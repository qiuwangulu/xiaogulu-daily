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
const SCHED_GEN_LEAD = 12 * 3600000;     // v3.6.3 起不再使用：改为每天 0 点生成「当天」计划
const DEDUP_MAX_AGE = 12 * 3600000;      // 去重有效期
const PLAN_PROMPT_VERSION = '8'; // v3.6.3 计划prompt: 今日计划改为「每天0点生成当天计划」(天气/补剂按当天, 大便/早教按前一天)，新增【统计口径】明确行

// v3.6.0 育儿嫂休假 / 工资结算常量（与前端一致）
const NANNY_VACATION_CLOUD_KEY = '_nanny_vacation';
const NANNY_BASE_SALARY = 10000;
const NANNY_PAY_DIVISOR = 26;

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
// v3.6.0 任务间隔：步进单位数（默认1）
function taskInterval(task) { return Math.max(1, parseInt((task && task.interval) || 1, 10) || 1); }
function stepFwd(t, freq, interval) {
  interval = interval || 1;
  if (freq === 'daily') return new Date(t.getTime() + interval * 86400000);
  if (freq === 'weekly') return new Date(t.getTime() + interval * 7 * 86400000);
  if (freq === 'monthly') return addMonths(t, interval);
  return null;
}
function stepBack(t, freq, interval) {
  interval = interval || 1;
  if (freq === 'daily') return new Date(t.getTime() - interval * 86400000);
  if (freq === 'weekly') return new Date(t.getTime() - interval * 7 * 86400000);
  if (freq === 'monthly') return addMonths(t, -interval);
  return null;
}
function computeTriggers(task, now) {
  const first = taskFirstTrigger(task);
  if (task.freq === 'once') {
    return { prev: first.getTime() <= now.getTime() ? first : null, next: first.getTime() > now.getTime() ? first : null };
  }
  const iv = taskInterval(task);
  let prev = new Date(first.getTime());
  if (prev.getTime() > now.getTime()) { while (prev.getTime() > now.getTime()) prev = stepBack(prev, task.freq, iv); }
  else { while (stepFwd(prev, task.freq, iv).getTime() <= now.getTime()) prev = stepFwd(prev, task.freq, iv); }
  return { prev: prev, next: stepFwd(prev, task.freq, iv) };
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

/* ==================== 计划生成（复刻前端 v3.6.0） ==================== */
// v3.6.0 早教类型映射（与前端 PLAN_EE_TYPES 一致）
const PLAN_EE_TYPES = {
  learnLanguage: '学语言', readBook: '读书', learnLogic: '学算术',
  fineMotor: '精细动作', grossMotor: '大运动', listenStory: '听故事', listenMusic: '听歌'
};
const PLAN_DOW = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
// v3.6.0 拉取并解密某一天的云端记录（family_records，与前端同密钥）
async function fetchDayRecords(fid, key, dateStr) {
  try {
    const rows = await sbGet(`family_records?family_id=eq.${fid}&record_date=eq.${dateStr}&select=encrypted_data,iv`);
    if (!rows.length || !rows[0].encrypted_data || !rows[0].iv) return [];
    const plain = decrypt(key, rows[0].encrypted_data, rows[0].iv);
    const arr = JSON.parse(plain);
    return Array.isArray(arr) ? arr : [];
  } catch (e) { console.warn('[记录] 当日记录读取失败', dateStr, e && e.message); return []; }
}
// v3.6.0 采集某天记录的早教/大便/辅食/户外统计（移植前端 collectPlanDayStats）
function collectPlanDayStats(recs) {
  const counts = {}; Object.keys(PLAN_EE_TYPES).forEach(k => counts[k] = 0);
  let poop = 0, outdoorMin = 0;
  const foods = [];
  for (const r of recs) {
    if (!r || !r.type) continue;
    if (Object.prototype.hasOwnProperty.call(PLAN_EE_TYPES, r.type)) counts[r.type]++;
    if (r.type === 'poop') poop++;
    if (r.type === 'outdoor' && r.duration) outdoorMin += r.duration;
    if (r.type === 'solidFood') foods.push({ names: Array.isArray(r.solidFoods) ? r.solidFoods.slice() : [], note: (r.note || '').trim() });
  }
  return { counts, poop, outdoorMin, foods };
}
// v3.6.0 营养补剂建议：读最近 N 天记录中最后一条 supplement，返回相反项（移植前端 getSupplementSuggestion）
async function recentSupplement(fid, key) {
  try {
    const today = new Date();
    const minDate = new Date(today.getTime() - 14 * 86400000);
    const minStr = minDate.getFullYear() + '-' + pad2(minDate.getMonth() + 1) + '-' + pad2(minDate.getDate());
    const rows = await sbGet(`family_records?family_id=eq.${fid}&record_date=gte.${minStr}&order=record_date.desc&select=encrypted_data,iv`);
    for (const row of rows) {
      if (!row.encrypted_data || !row.iv) continue;
      let recs = []; try { recs = JSON.parse(decrypt(key, row.encrypted_data, row.iv)); } catch { continue; }
      if (!Array.isArray(recs)) continue;
      // 取当天最晚（数组末尾）的补剂记录
      for (let i = recs.length - 1; i >= 0; i--) {
        const r = recs[i];
        if (r && r.type === 'supplement' && r.supplementTypes && r.supplementTypes.length) {
          if (r.supplementTypes.includes('AD') && !r.supplementTypes.includes('D3')) return 'D3';
          if (r.supplementTypes.includes('D3') && !r.supplementTypes.includes('AD')) return 'AD';
          return 'AD';
        }
      }
    }
  } catch (e) { console.warn('[补剂] 读取失败', e && e.message); }
  return 'AD';
}

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
function buildPlanSystemPrompt(ctx, dateStr, wText, stats, supRec) {
  const ad = getAgeDetail(ctx.birthDate, dateStr);
  const h = ctx.height || '', w = ctx.weight || '';
  const kbPart = (ctx.kb || []).slice(0, 50).map(x => '- [' + x.cat + '] ' + x.text).join('\n');
  // v3.6.1 目标日星期（M/W/F 补剂判定）与「前一日」早教/大便/辅食统计
  const targetDow = new Date(dateStr + 'T00:00:00').getDay();
  const targetIsMWF = (targetDow === 1 || targetDow === 3 || targetDow === 5);
  let dayPart = '';
  if (stats) {
    const c = stats.counts;
    const eeLine = Object.keys(PLAN_EE_TYPES).map(k => PLAN_EE_TYPES[k] + c[k] + '次').join('、');
    dayPart = '\n【前一日已记录的早教/起居数据（用于安排今日计划）】\n'
      + '- 早教各项次数：' + eeLine + '\n'
      + '- 大便次数：' + stats.poop + ' 次\n'
      + '- 户外时长：' + stats.outdoorMin + ' 分钟\n'
      + (stats.foods.length ? ('- 辅食记录：' + stats.foods.map(f => (f.names.join('/') || '辅食') + (f.note ? '（备注：' + f.note + '）' : '')).join('；') + '\n') : '')
      + '- 营养补剂建议（与上次相反）：' + (supRec || '—') + '\n';
  }
  return '你是一位专业、贴心的婴幼儿育儿规划助手，服务对象是长辈（外婆）带小宝宝，目标是提前生成「今日计划」以减少带娃决策压力。\n'
    + '请用简体中文、具体可操作；不要使用 markdown 标记；分点请用「·」。内容精炼：每个分类 3 条以内、每条不超过 20 字。\n\n'
    + '【宝宝档案】\n- 姓名：' + ctx.babyName + '；出生：' + ctx.birthDate + '；当前 ' + ad.months + ' 月龄 ' + ad.days + ' 天\n'
    + ((h || w) ? '- 身高 ' + (h || '—') + 'cm，体重 ' + (w || '—') + 'kg\n' : '')
    + '\n【家庭知识库（优先参考，含权威育儿资料与早教/穿衣建议）】\n' + (kbPart || '（暂无）') + '\n'
    + dayPart
    + '\n【目标日期天气】' + dateStr + '（' + PLAN_DOW[targetDow] + '） ' + wText + '\n'
    + '\n【规划规则——请严格按以下四部分输出，顺序固定：喂养 → 起居护理 → 健康·出行 → 早教（早教必须放在最后）】\n'
    + '【喂养】单次奶量、喝奶次数、辅食（尝试食物及量）、喝水、过敏/防呛提醒；'
    // v3.6.2 补剂判定明确按「本计划日（=任务触发当天）」的星期，不用第二天的星期
    + (targetIsMWF ? ('本计划日 ' + dateStr + ' 为' + PLAN_DOW[targetDow] + '（即任务触发当天；周一/三/五为补剂日），营养补剂请安排：' + (supRec || 'D3') + '（与上次相反）。')
                   : ('本计划日 ' + dateStr + ' 为' + PLAN_DOW[targetDow] + '（即任务触发当天；非周一/周三/周五），营养补剂项写明「今日无需补剂」。'))
    + '\n'
    + '【起居护理】穿衣（结合天气，必须点明当日具体气温：最高/最低几度，据此建议穿什么、几件多厚，参考知识库「穿衣」）；洗澡、剪指甲、睡眠、排便关注'
    + (stats && stats.poop === 0 ? '；昨日大便 0 次，需关注是否便秘：两餐间记得喂水、多顺时针揉腹'
       : (stats && stats.poop >= 3 ? '；昨日大便≥3 次，需关注拉肚子：注意保暖、防红屁屁' : '')) + '。\n'
    + '【健康·出行】户外活动时间与时长（结合天气与昨日户外时长，给出具体时段如"上午9-10点、下午4-5点"及总时长建议）、天气应对（大风/雾霾/降温）、防病注意；并再次点明当日最高/最低温，提示长辈据此增减衣物；结合知识库「穿衣」给出是否戴帽子、是否裹薄包被/纱巾。\n'
    + '【辅食提醒】若上方"辅食记录"备注含过敏/异常（如某品牌米粉过敏），在喂养或辅食处提醒今日更换品牌（具体到备注里的牌子）。\n'
    + '【补剂判定】营养补剂是否为补剂日（周一/三/五），一律按本计划日（即上方"目标日期"、任务触发当天）的星期判断；不得按"第二天"或其他任何日期判断。\n'
    + '【统计口径】天气与营养补剂一律按「本计划日（上方目标日期、任务触发当天）」判断；大便次数与早教一律按「前一日」的记录判断。两者口径不得混用。\n'
    + '【早教】放在最后一段输出。结合上方"前一日早教数据"：次数<1 的项目必须纳入今日计划；结合宝宝月龄与知识库「早教」条目，给具体可操作动作（如"练习翻身""读布书认识动物""听儿歌"）。已做满的项目不必重复。\n'
    + '【温度要求】上方天气已给出当日最高温和最低温，请在「起居护理·穿衣」与「健康·出行」中明确写出具体温度数值（如"今日 28℃/19℃，短袖即可"），不要只写"根据天气"。\n'
    + '\n【输出格式】第一行必须以「摘要：」开头写一句不超过 25 字的关键提示；之后换行写「计划：」，再按【喂养】【起居护理】【健康·出行】【早教】顺序分块给出内容（早教在最后）。';
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

/* ==================== 育儿嫂休假 / 工资（v3.6.0） ==================== */
function fmtDateLocal(d) { return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate()); }
// 拉取云端育儿嫂休假集合
async function fetchNannyVacation(fid, key) {
  try {
    const rows = await sbGet(`family_config?family_id=eq.${fid}&config_key=eq.${NANNY_VACATION_CLOUD_KEY}&select=encrypted_data,iv`);
    if (!rows.length || !rows[0].encrypted_data || !rows[0].iv) return [];
    const arr = JSON.parse(decrypt(key, rows[0].encrypted_data, rows[0].iv));
    return Array.isArray(arr) ? arr.filter(d => typeof d === 'string') : [];
  } catch (e) { console.warn('[Nanny] 读取失败', e && e.message); return []; }
}
// 计算工资任务在某触发周期内的结算明细（移植前端 computeWage）
function computeWage(task, trig, vacList) {
  const dailyRate = NANNY_BASE_SALARY / NANNY_PAY_DIVISOR;
  const end = new Date(trig.getFullYear(), trig.getMonth(), trig.getDate());
  const startStr = (task.lastWageDate && /^\d{4}-\d{2}-\d{2}$/.test(task.lastWageDate)) ? task.lastWageDate : (task.startDate || fmtDateLocal(end));
  const start = new Date(startStr + 'T00:00:00');
  if (isNaN(start.getTime())) start.setTime(end.getTime());
  let totalDays = Math.round((end - start) / 86400000);
  if (totalDays < 1) totalDays = 1;
  let vacDays = 0;
  for (const d of (vacList || [])) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(d)) continue;
    const dd = new Date(d + 'T00:00:00');
    if (dd >= start && dd < end) vacDays++;
  }
  const workDays = Math.max(0, totalDays - vacDays);
  const wage = Math.round(dailyRate * workDays);
  return { dailyRate, totalDays, vacDays, workDays, wage, startStr, endStr: fmtDateLocal(new Date(end.getTime() - 86400000)) };
}
function wagePushContent(w) {
  // v3.6.1 固定默认格式（前端任务编辑不再填写内容）：「YYYY-MM：休假 X 天，工作 Y 天，应发工资 Z 元，请转账。」
  const ym = (w.endStr || '').slice(0, 7);
  return `${ym}：休假 ${w.vacDays} 天，工作 ${w.workDays} 天，应发工资 ${w.wage} 元，请转账。`;
}
// v3.6.1 月度归档：工资结算推送成功后，把当月休假日归档进备忘录已办事项、清空当月休假、切到下个月
async function archiveNannyMonthCloud(fid, key, monthKey, nannyVac) {
  const ym = monthKey;
  const monthList = nannyVac.filter(d => typeof d === 'string' && d.slice(0, 7) === ym);
  const rest = nannyVac.filter(d => !(typeof d === 'string' && d.slice(0, 7) === ym));
  if (!monthList.length) return 0;
  // ① 写备忘录已办事项（与前端 loadMemoCloud 合并策略一致：云端先入、服务端后入）
  try {
    const rows = await sbGet(`family_config?family_id=eq.${fid}&config_key=eq._memo&select=encrypted_data,iv`);
    let arr = [];
    if (rows.length && rows[0].encrypted_data && rows[0].iv) {
      try { const p = JSON.parse(decrypt(key, rows[0].encrypted_data, rows[0].iv)); if (Array.isArray(p)) arr = p; } catch { /* ignore */ }
    }
    const maxId = arr.reduce((m, x) => Math.max(m, (x && x.id) || 0), 0);
    arr.unshift({ id: maxId + 1, done: true, date: fmtDateLocal(new Date()),
      text: '👩 育儿嫂休假 ' + ym + '：' + monthList.join('、') + '（共 ' + monthList.length + ' 天）' });
    const enc = encrypt(key, JSON.stringify(arr));
    await sbUpsert('family_config', { family_id: fid, config_key: '_memo', encrypted_data: enc.data, iv: enc.iv, last_modified: Date.now() });
    console.log('[Nanny] 已归档当月休假日到备忘录已办事项', ym, monthList.length, '天');
  } catch (e) { console.warn('[Nanny] 备忘录归档失败', e && e.message); }
  // ② 清空当月休假并写回云端
  try {
    const enc2 = encrypt(key, JSON.stringify(rest));
    await sbUpsert('family_config', { family_id: fid, config_key: NANNY_VACATION_CLOUD_KEY, encrypted_data: enc2.data, iv: enc2.iv, last_modified: Date.now() });
    console.log('[Nanny] 已清空当月休假', ym, '剩余', rest.length, '天');
  } catch (e) { console.warn('[Nanny] 休假回写失败', e && e.message); }
  return monthList.length;
}

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
async function generatePlan(task, trig, ctx, fid, key) {
  const dateStr = trig.getFullYear() + '-' + pad2(trig.getMonth() + 1) + '-' + pad2(trig.getDate());
  if (!ctx.ai || !ctx.ai.apiKey) { console.warn('[计划] 无 AI 密钥，跳过生成'); return false; }
  if (DRY_RUN) { console.log('[DRY] 触发计划生成（跳过真实调用）', dateStr); return false; }
  let wText = '（未获取）';
  try { wText = await weatherText(ctx.weatherAddr, dateStr); } catch { /* ignore */ }
  // v3.6.1 统计「目标日期的前一天」的记录（如 10-14 的计划按 10-13 的记录）
  let stats = null, supRec = 'AD';
  if (key && fid) {
    try {
      const prev = new Date(trig.getTime() - 86400000);
      const prevStr = prev.getFullYear() + '-' + pad2(prev.getMonth() + 1) + '-' + pad2(prev.getDate());
      const recs = await fetchDayRecords(fid, key, prevStr);
      stats = collectPlanDayStats(recs);
      supRec = await recentSupplement(fid, key);
      console.log('[计划] 前一日统计', prevStr, '早教=', JSON.stringify(stats && stats.counts), '大便=', stats && stats.poop, '户外=', stats && stats.outdoorMin, '补剂=', supRec);
    } catch (e) { console.warn('[计划] 统计读取失败', e && e.message); }
  }
  const r = await callAI(ctx.ai, [
    { role: 'system', content: buildPlanSystemPrompt(ctx, dateStr, wText, stats, supRec) },
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

  // v3.6.0 育儿嫂休假集合（供工资任务扣减）
  let nannyVac = [];
  try { nannyVac = await fetchNannyVacation(fid, key); } catch (e) { console.warn('[Nanny] 读取失败', e && e.message); }
  console.log('[Sched] 育儿嫂休假天数 =', nannyVac.length);

  const now = new Date();
  let changed = false;

  for (const task of tasks) {
    if (!task || !task.enabled) continue;
    const { prev, next } = computeTriggers(task, now);
    const name = (task.name && String(task.name).trim()) ? String(task.name).trim() : (task.mode === 'ai' ? '今日计划' : '定时提醒');

    // ① v3.6.3 AI 计划：每天 0 点生成「当天」计划（不再提前 12h 生成次日计划）
    //    云端未生成当天计划(genDate !== 今天) 或 prompt 版本过期 → 用今天 00:00 生成；
    //    前端已生成/编辑当天计划并同步到云端时，此处不覆盖（保护用户编辑）。
    if (task.mode === 'ai' && ctx.ai) {
      const todayStr = fmtDateLocal(now);
      const todayTrg = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const staleVer = (task.planVer || '') !== (ctx.promptVer || PLAN_PROMPT_VERSION);
      if (task.genDate !== todayStr || staleVer || !task.content) {
        console.log('[Sched] 生成今日计划:', name, 'for', todayStr);
        if (await generatePlan(task, todayTrg, ctx, fid, key)) changed = true;
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

    if (task.mode === 'ai' && !task.content) { await generatePlan(task, trig, ctx, fid, key); }

    let title, content;
    // v3.6.0 育儿嫂工资任务：触发时按周期(上次结算日~本次触发)算工作天数与工资
    if (task.type === 'wage') {
      const w = computeWage(task, trig, nannyVac);
      title = '👩 育儿嫂工资结算';
      content = '<pre style="white-space:pre-wrap;font-family:inherit;line-height:1.6;">' + escapeHtml(wagePushContent(w)) + '</pre>';
    } else if (task.mode === 'ai') {
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
      if (task.type === 'wage') {
        task.lastWageDate = fmtDateLocal(trig);
        // v3.6.1 结算成功后归档：当月休假 → 备忘录已办，清空当月休假，前端切到下个月
        const ym = fmtDateLocal(new Date(trig.getTime() - 86400000)).slice(0, 7);
        try { nannyVac = (await fetchNannyVacation(fid, key)); await archiveNannyMonthCloud(fid, key, ym, nannyVac); }
        catch (e) { console.warn('[Nanny] 归档失败', e && e.message); }
      }
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
