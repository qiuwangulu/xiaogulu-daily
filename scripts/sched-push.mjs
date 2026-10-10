#!/usr/bin/env node
/**
 * 小咕噜的日常 —— 服务端定时推送（GitHub Actions）
 * ------------------------------------------------
 * 目的：无需打开网页，也能在设定时刻准时推送「定时任务」（含 AI 今日计划）。
 *
 * 原理：前端把「定时任务 + 生成计划所需上下文」用家庭码派生密钥 AES-GCM 加密后，
 *      同步到 Supabase family_config(config_key=_sched_cloud)。本脚本用同一家庭码解密，
 *      判断当前是否有任务到点；AI 计划则调用大模型生成，再经 PushPlus 推送，
 *      并写跨设备去重标记、回写任务状态（pushPeriod / content）。
 *
 * 环境变量：
 *   FAMILY_CODE  必填（GitHub 仓库 Secret），用于派生解密密钥
 *   SB_URL       可选，Supabase 项目地址（默认内置）
 *   SB_KEY       可选，Supabase anon key（默认内置，与前端同）
 *   DRY_RUN      可选，=1 时不真正发送推送、不写云端（仅打印判断结果）
 *   TZ           建议设为 Asia/Shanghai（工作流已设置），保证触发时间按北京时间判断
 */
import crypto from 'node:crypto';

const SB_URL = process.env.SB_URL || 'https://ectqfthdbqceifuprdjf.supabase.co';
const SB_KEY = process.env.SB_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVjdHFmdGhkYnFjZWlmdXByZGpmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU1MTMxODgsImV4cCI6MjEwMTA4OTE4OH0.-BMsuLZg2vXeNn9ml7sFQZEICGij0o8DBNPNt9Vau7s';
const FAMILY_CODE = process.env.FAMILY_CODE || '';
const DRY_RUN = process.env.DRY_RUN === '1' || process.env.DRY_RUN === 'true';

const SCHED_CLOUD_KEY = '_sched_cloud';
const SALT_KEY = '_salt';
const SCHED_DEDUP_KEY = '_schedpushdedup';
const SCHED_PUSH_GRACE = 3 * 3600000;    // 触发后宽限 3 小时内推送
const SCHED_GEN_LEAD = 12 * 3600000;     // 提前 12 小时生成计划
const DEDUP_MAX_AGE = 12 * 3600000;      // 去重有效期
const PLAN_PROMPT_VERSION = '4';

/* ==================== 加密（与前端一致） ==================== */
function sha256hex8(s) { return crypto.createHash('sha256').update(s, 'utf8').digest().subarray(0, 8).toString('hex'); }
function deriveKey(code, saltB64) {
  const salt = Buffer.from(saltB64, 'base64');
  return crypto.pbkdf2Sync(Buffer.from(code, 'utf8'), salt, 310000, 32, 'sha256');
}
function decrypt(key, dataB64, ivB64) {
  const buf = Buffer.from(dataB64, 'base64');
  const iv = Buffer.from(ivB64, 'base64');
  const tag = buf.subarray(buf.length - 16);
  const ct = buf.subarray(0, buf.length - 16);
  const d = crypto.createDecipheriv('aes-256-gcm', key, iv);
  d.setAuthTag(tag);
  return Buffer.concat([d.update(ct), d.final()]).toString('utf8');
}
function encrypt(key, plaintext) {
  const iv = crypto.randomBytes(12);
  const c = crypto.createCipheriv('aes-256-gcm', key, iv);
  const enc = Buffer.concat([c.update(Buffer.from(plaintext, 'utf8')), c.final()]);
  const tag = c.getAuthTag();
  return { data: Buffer.concat([enc, tag]).toString('base64'), iv: iv.toString('base64') };
}

/* ==================== Supabase REST ==================== */
async function sbGet(path) {
  const res = await fetch(`${SB_URL}/rest/v1/${path}`, { headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` } });
  if (!res.ok) throw new Error(`Supabase GET ${res.status}: ${await res.text()}`);
  return res.json();
}
async function sbUpsert(table, row) {
  const res = await fetch(`${SB_URL}/rest/v1/${table}`, {
    method: 'POST',
    headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}`, 'Content-Type': 'application/json', Prefer: 'resolution=merge-duplicates' },
    body: JSON.stringify(row)
  });
  if (!res.ok) throw new Error(`Supabase POST ${res.status}: ${await res.text()}`);
  return null;
}

/* ==================== 触发时间 / 周期（与前端一致） ==================== */
const pad2 = n => String(n).padStart(2, '0');
function taskFirstTrigger(task) {
  const p = task.startDate.split('-').map(Number), q = task.startTime.split(':').map(Number);
  return new Date(p[0], p[1] - 1, p[2], q[0], q[1], 0, 0);
}
function addMonths(date, n) {
  const d = new Date(date.getTime()); const day = d.getDate();
  d.setDate(1); d.setMonth(d.getMonth() + n);
  d.setDate(Math.min(day, new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate()));
  return d;
}
function stepFwd(t, freq) {
  if (freq === 'daily') return new Date(t.getTime() + 86400000);
  if (freq === 'weekly') return new Date(t.getTime() + 7 * 86400000);
  if (freq === 'monthly') return addMonths(t, 1);
  return null;
}
function stepBack(t, freq) {
  if (freq === 'daily') return new Date(t.getTime() - 86400000);
  if (freq === 'weekly') return new Date(t.getTime() - 7 * 86400000);
  if (freq === 'monthly') return addMonths(t, -1);
  return null;
}
function computeTriggers(task, now) {
  const first = taskFirstTrigger(task);
  if (task.freq === 'once') {
    return { prev: first.getTime() <= now.getTime() ? first : null, next: first.getTime() > now.getTime() ? first : null };
  }
  let prev = new Date(first.getTime());
  if (prev.getTime() > now.getTime()) { while (prev.getTime() > now.getTime()) prev = stepBack(prev, task.freq); }
  else { while (stepFwd(prev, task.freq).getTime() <= now.getTime()) prev = stepFwd(prev, task.freq); }
  return { prev: prev, next: stepFwd(prev, task.freq) };
}
function periodKey(task, trig) {
  const y = trig.getFullYear();
  if (task.freq === 'once') return 'once';
  if (task.freq === 'daily') return y + '-' + pad2(trig.getMonth() + 1) + '-' + pad2(trig.getDate());
  if (task.freq === 'weekly') {
    const onejan = new Date(y, 0, 1);
    const wk = Math.ceil((((trig - onejan) / 86400000) + onejan.getDay() + 1) / 7);
    return y + '-W' + pad2(wk);
  }
  if (task.freq === 'monthly') return y + '-' + pad2(trig.getMonth() + 1);
  return '';
}

/* ==================== 计划生成（复刻前端） ==================== */
function getAgeDetail(birthStr, ds) {
  const [by, bm, bd] = birthStr.split('-').map(Number);
  const [y, m, d] = ds.split('-').map(Number);
  const cur = new Date(y, m - 1, d);
  let months = (y - by) * 12 + (m - 1 - (bm - 1));
  if (d < bd) months--;
  months = Math.max(0, months);
  const anniv = new Date(by, (bm - 1) + months, bd);
  let days = Math.round((cur - anniv) / 86400000);
  if (days < 0) days = 0;
  return { months, days };
}
function buildPlanSystemPrompt(ctx, dateStr, wText) {
  const ad = getAgeDetail(ctx.birthDate, dateStr);
  const h = ctx.height || '', w = ctx.weight || '';
  const kbPart = (ctx.kb || []).slice(0, 50).map(x => '- [' + x.cat + '] ' + x.text).join('\n');
  return '你是一位专业、贴心的婴幼儿育儿规划助手，服务对象是长辈（外婆）带小宝宝，目标是提前生成「今日计划」以减少带娃决策压力。\n'
    + '请用简体中文、具体可操作；不要使用 markdown 标记；分点请用「·」。内容精炼：每个分类 3 条以内、每条不超过 20 字。\n\n'
    + '【宝宝档案】\n- 姓名：' + ctx.babyName + '；出生：' + ctx.birthDate + '；当前 ' + ad.months + ' 月龄 ' + ad.days + ' 天\n'
    + ((h || w) ? '- 身高 ' + (h || '—') + 'cm，体重 ' + (w || '—') + 'kg\n' : '')
    + '\n【家庭知识库（优先参考，含权威育儿资料）】\n' + (kbPart || '（暂无）') + '\n'
    + '\n【目标日期天气】' + dateStr + ' ' + wText + '\n'
    + '\n【规划规则——请严格按以下三部分输出】\n'
    + '【喂养】单次奶量、喝奶次数、辅食（尝试食物及量）、喝水、营养补剂、过敏/防呛提醒。\n'
    + '【起居护理】穿衣（结合天气，必须点明当日具体气温：最高/最低几度，据此建议穿什么）、洗澡、剪指甲、睡眠、排便关注。\n'
    + '【健康·出行】户外活动时间与时长、天气应对（大风/雾霾/降温）、防病注意；并再次点明当日最高/最低温，提示长辈据此增减衣物。\n'
    + '【温度要求】上方天气已给出当日最高温和最低温，请在「起居护理·穿衣」与「健康·出行」中明确写出具体温度数值（如"今日 28℃/19℃，短袖即可"），不要只写"根据天气"。\n'
    + '\n【输出格式】第一行必须以「摘要：」开头写一句不超过 25 字的关键提示；之后换行写「计划：」，再按【喂养】【起居护理】【健康·出行】分块给出内容。';
}
function splitPlan(full) {
  if (!full) return { summary: '', detail: '' };
  let summary = '', detail = String(full);
  const m = detail.match(/摘要[:：]\s*([^\n]*)/);
  if (m) summary = m[1].trim();
  const idx = detail.indexOf('计划：');
  if (idx >= 0) detail = detail.slice(idx + 3).trim();
  if (!summary) summary = (String(full).split('\n')[0] || '').slice(0, 30);
  return { summary, detail };
}
function escapeHtml(s) { return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }

/* ==================== 天气（Open-Meteo） ==================== */
const WMO_CODES = { 0: '晴', 1: '大致晴朗', 2: '局部多云', 3: '阴', 45: '雾', 48: '雾凇', 51: '毛毛雨(弱)', 53: '毛毛雨', 55: '毛毛雨(强)', 56: '冻毛毛雨', 57: '冻毛毛雨', 61: '小雨', 63: '中雨', 65: '大雨', 66: '冻雨', 67: '冻雨', 71: '小雪', 73: '中雪', 75: '大雪', 77: '雪粒', 80: '阵雨(弱)', 81: '阵雨', 82: '阵雨(强)', 85: '阵雪', 86: '阵雪(强)', 95: '雷阵雨', 96: '雷阵雨伴小冰雹', 99: '雷阵雨伴大冰雹' };
const CN_FALLBACK = [
  { kw: '七宝', lat: 31.1550, lon: 121.3328, name: '上海·闵行区·七宝镇' },
  { kw: '闵行', lat: 31.1128, lon: 121.3817, name: '上海·闵行区' },
  { kw: '上海', lat: 31.2304, lon: 121.4737, name: '上海' },
];
async function geocode(addr) {
  const raw = String(addr || '').trim();
  for (const f of CN_FALLBACK) { if (raw.includes(f.kw)) return { lat: f.lat, lon: f.lon, name: f.name }; }
  try {
    const cands = [];
    const push = s => { const v = String(s || '').replace(/[\s,，]+/g, ''); if (v.length >= 2 && !cands.includes(v)) cands.push(v); };
    push(raw);
    const mc = raw.match(/^(.{2,8}?)(?:市|自治州|地区|盟)/); if (mc) push(mc[1]);
    for (const q of cands) {
      const res = await fetch('https://geocoding-api.open-meteo.com/v1/search?name=' + encodeURIComponent(q) + '&count=5&language=zh&format=json');
      const j = await res.json();
      const r = (j.results || []).find(x => x && (x.country_code === 'CN' || x.country === '中国'));
      if (r) { let name = r.name || ''; if (r.admin1 && r.admin1 !== name && !r.admin1.startsWith(name)) name += '·' + r.admin1; return { lat: r.latitude, lon: r.longitude, name }; }
    }
  } catch { /* ignore */ }
  return { lat: 31.2304, lon: 121.4737, name: '上海' };
}
async function weatherText(addr, dateStr) {
  try {
    const geo = await geocode(addr);
    const url = 'https://api.open-meteo.com/v1/forecast?latitude=' + geo.lat + '&longitude=' + geo.lon
      + '&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,wind_speed_10m_max'
      + '&timezone=Asia%2FShanghai&start_date=' + dateStr + '&end_date=' + dateStr;
    const res = await fetch(url);
    const j = await res.json();
    const d = j && j.daily;
    if (!d || !d.time || !d.time.length) return '（天气获取失败，请手动参考天气预报）';
    const desc = WMO_CODES[d.weather_code[0]] != null ? WMO_CODES[d.weather_code[0]] : ('天气代码' + d.weather_code[0]);
    return geo.name + ' ' + desc + '，最高' + Math.round(d.temperature_2m_max[0]) + '℃/最低' + Math.round(d.temperature_2m_min[0]) + '℃，降水概率' + (d.precipitation_probability_max[0] != null ? d.precipitation_probability_max[0] : '—') + '%，最大风速' + (d.wind_speed_10m_max[0] != null ? Math.round(d.wind_speed_10m_max[0]) : '—') + 'km/h';
  } catch { return '（天气获取失败，请手动参考天气预报）'; }
}

/* ==================== AI 调用 ==================== */
async function callAI(cfg, messages) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 60000);
  try {
    const res = await fetch(cfg.base, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + cfg.apiKey },
      body: JSON.stringify({ model: cfg.model, messages, temperature: 0.6 }),
      signal: ctrl.signal
    });
    if (!res.ok) { console.warn('[AI] HTTP', res.status); return null; }
    const j = await res.json();
    const content = j && j.choices && j.choices[0] && j.choices[0].message && j.choices[0].message.content;
    return content ? String(content) : null;
  } catch (e) { console.warn('[AI] 调用失败', e && e.message); return null; }
  finally { clearTimeout(timer); }
}
async function generatePlan(task, trig, ctx) {
  const dateStr = trig.getFullYear() + '-' + pad2(trig.getMonth() + 1) + '-' + pad2(trig.getDate());
  if (!ctx.ai || !ctx.ai.apiKey) { console.warn('[计划] 无 AI 密钥，跳过生成'); return false; }
  if (DRY_RUN) { console.log('[DRY] 触发计划生成（跳过真实调用）', dateStr); return false; }
  let wText = '（未获取）';
  try { wText = await weatherText(ctx.weatherAddr, dateStr); } catch { /* ignore */ }
  const r = await callAI(ctx.ai, [
    { role: 'system', content: buildPlanSystemPrompt(ctx, dateStr, wText) },
    { role: 'user', content: '请为 ' + dateStr + '（地址：' + (ctx.weatherAddr || '') + '）生成今日计划，严格按格式输出。' }
  ]);
  if (!r) { console.warn('[计划] 生成失败，跳过'); return false; }
  task.content = String(r).trim();
  task.genPeriod = periodKey(task, trig);
  task.genDate = dateStr;
  task.planVer = ctx.promptVer || PLAN_PROMPT_VERSION;
  return true;
}

/* ==================== 推送 ==================== */
async function notifyPushplus(ctx, title, content) {
  const token = ctx.pushToken;
  if (!token) { console.warn('PushPlus token 未配置'); return false; }
  if (DRY_RUN) { console.log('[DRY] 将推送 →', title); return true; }
  try {
    const payload = { token, title, content, template: 'html' };
    if (ctx.pushTopic) payload.topic = ctx.pushTopic;
    const res = await fetch('https://www.pushplus.plus/send', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    const data = await res.json();
    const ok = !!(data && data.code === 200);
    console.log('[推送]', ok ? '成功' : ('失败 ' + JSON.stringify(data)));
    return ok;
  } catch (e) { console.warn('[推送] 异常', e && e.message); return false; }
}
async function cloudDup(fid, sig) {
  try {
    const rows = await sbGet(`family_config?family_id=eq.${fid}&config_key=eq.${SCHED_DEDUP_KEY}&select=encrypted_data`);
    if (!rows.length) return false;
    let rec = null; try { rec = JSON.parse(rows[0].encrypted_data || 'null'); } catch { return false; }
    if (!rec || rec.sig !== sig) return false;
    if (Date.now() - (rec.ts || 0) > DEDUP_MAX_AGE) return false;
    return true;
  } catch { return false; }
}
async function cloudMark(fid, sig) {
  if (DRY_RUN) return;
  try { await sbUpsert('family_config', { family_id: fid, config_key: SCHED_DEDUP_KEY, encrypted_data: JSON.stringify({ sig, ts: Date.now(), dev: 'gha' }), iv: '', last_modified: Date.now() }); }
  catch (e) { console.warn('[推送] 去重标记失败', e && e.message); }
}

/* ==================== 主流程 ==================== */
async function main() {
  if (!FAMILY_CODE) { console.error('缺少 FAMILY_CODE 环境变量'); process.exit(1); }
  const fid = sha256hex8(FAMILY_CODE);
  console.log('[Sched] family_id =', fid, '| DRY_RUN =', DRY_RUN, '| TZ =', process.env.TZ || '(默认)');

  const saltRows = await sbGet(`family_config?family_id=eq.${fid}&config_key=eq.${SALT_KEY}&select=encrypted_data`);
  if (!saltRows.length || !saltRows[0].encrypted_data) { console.error('云端无 salt，无法解密'); process.exit(1); }
  const key = deriveKey(FAMILY_CODE, saltRows[0].encrypted_data);

  const rows = await sbGet(`family_config?family_id=eq.${fid}&config_key=eq.${SCHED_CLOUD_KEY}&select=encrypted_data,iv`);
  if (!rows.length || !rows[0].encrypted_data || !rows[0].iv) { console.log('云端无定时任务数据（前端尚未同步）'); return; }
  let data;
  try { data = JSON.parse(decrypt(key, rows[0].encrypted_data, rows[0].iv)); }
  catch (e) { console.error('解密失败（家庭码是否与前端一致？）', e && e.message); process.exit(1); }

  const tasks = Array.isArray(data.tasks) ? data.tasks : [];
  const ctx = data.ctx || {};
  console.log('[Sched] 任务数 =', tasks.length, '| AI密钥 =', ctx.ai && ctx.ai.apiKey ? '有' : '无', '| 推送token =', ctx.pushToken ? '有' : '无', '| 天气地址 =', ctx.weatherAddr || '');

  const now = new Date();
  let changed = false;

  for (const task of tasks) {
    if (!task || !task.enabled) continue;
    const { prev, next } = computeTriggers(task, now);
    const name = (task.name && String(task.name).trim()) ? String(task.name).trim() : (task.mode === 'ai' ? '今日计划' : '定时提醒');

    // ① AI 计划提前生成：进入 [触发-12h, 触发) 窗口且本周期未生成
    if (task.mode === 'ai' && next && ctx.ai) {
      const winStart = new Date(next.getTime() - SCHED_GEN_LEAD);
      if (now >= winStart && now < next) {
        const pk = periodKey(task, next);
        const staleVer = (task.planVer || '') !== (ctx.promptVer || PLAN_PROMPT_VERSION);
        if (task.genPeriod !== pk || staleVer || !task.content) {
          console.log('[Sched] 生成计划:', name, 'for', pk);
          if (await generatePlan(task, next, ctx)) changed = true;
        }
      }
    }

    // ② 到点推送
    const trig = prev;
    if (!trig) continue;
    const inWindow = now >= trig && now < new Date(trig.getTime() + SCHED_PUSH_GRACE);
    const pk = periodKey(task, trig);
    if (!inWindow) { console.log('[Sched] 未到点:', name, '下次', next ? next.toLocaleString('zh-CN') : '—'); continue; }
    if (task.pushPeriod === pk) continue;
    const sig = 'task|' + (task.id || task.name || '') + '|' + pk;
    if (await cloudDup(fid, sig)) { console.log('[Sched] 云端已推过，跳过:', name, pk); task.pushPeriod = pk; changed = true; continue; }

    if (task.mode === 'ai' && !task.content) { await generatePlan(task, trig, ctx); }

    let title, content;
    if (task.mode === 'ai') {
      const sp = splitPlan(task.content);
      title = '📅 ' + name;
      const sum = sp.summary ? '<p style="font-size:16px;font-weight:600;">📌 ' + escapeHtml(sp.summary) + '</p>' : '';
      content = '<h3>小咕噜 ' + escapeHtml(name) + '</h3>' + sum + '<pre style="white-space:pre-wrap;font-family:inherit;line-height:1.6;">' + escapeHtml(sp.detail || task.content || '') + '</pre>';
    } else {
      title = '⏰ ' + name;
      content = '<pre style="white-space:pre-wrap;font-family:inherit;line-height:1.6;">' + escapeHtml(task.content || '') + '</pre>';
    }

    console.log('[Sched] 到点推送:', title, '(' + pk + ')');
    const ok = await notifyPushplus(ctx, title, content);
    if (ok) {
      await cloudMark(fid, sig);
      task.pushPeriod = pk; task.pushTs = Date.now();
      if (task.freq === 'once') task.enabled = false;
      changed = true;
    } else {
      console.warn('[Sched] 推送失败，保留待下次重试:', title);
    }
  }

  if (changed && !DRY_RUN) {
    try {
      const { data: outData, iv: outIv } = encrypt(key, JSON.stringify({ tasks, ctx, ts: Date.now() }));
      await sbUpsert('family_config', { family_id: fid, config_key: SCHED_CLOUD_KEY, encrypted_data: outData, iv: outIv, last_modified: Date.now() });
      console.log('[Sched] 已回写云端任务状态');
    } catch (e) { console.warn('[Sched] 回写失败', e && e.message); }
  } else if (!changed) {
    console.log('[Sched] 无到点任务');
  } else {
    console.log('[DRY] 有状态变化（未写回云端）');
  }
}

main().catch(e => { console.error('[Sched] 运行异常', e); process.exit(1); });
