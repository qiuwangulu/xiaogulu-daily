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
// v3.6.17 AI 生成冷却（与前端 SCHED_GEN_COOLDOWN 一致）。
// 修复：本工作流由 Supabase pg_cron 每 5 分钟触发，此前「genDate 不更新/版本过期」时
// 每次运行都会调 AI + 天气，最坏 288 次/天 → DeepSeek token 与 Open-Meteo 配额双重风暴。
const SCHED_GEN_COOLDOWN = 30 * 60000;
// v3.6.17 服务端天气缓存（云端 family_config._sched_weather，3 小时 TTL）：
// Open-Meteo 免费额度按 IP 计，GitHub Actions 位于 Azure 共享 IP 段，易被他人的 CI 用量挤爆
// （线上已实测 "Daily API request limit exceeded"），缓存可把重复调用收敛到 1 次/3 小时。
const WEATHER_CACHE_KEY = '_sched_weather';
const WEATHER_CACHE_TTL = 3 * 3600000;
// v3.6.17 计划prompt 与前端 v3.6.14 内容对齐（风级换算以家庭知识库为准、穿衣列出同一厚薄档位
// 全部衣物、辅食试吃条件、统计口径明确行），版本号前后端统一升 12。
// v3.6.40 新增【辅食第N天食谱推荐】规则（前一日有辅食记录时，按昨日添加时间/量/连续天数+月龄+
// 知识库「辅食」条目推荐当天具体食谱与制作方法），版本号前后端统一升 13，与前端逐字对齐。
// 修复的根因：服务端 prompt 此前冻结在 v3.6.3(v8)，生成后却把 task.planVer 标记为
// ctx.promptVer（前端版本号）——「用旧 prompt 生成的内容冒充最新版本」，前端 staleVer 判假，
// 导致部署新 prompt 后今日计划永不刷新。现在改为标记服务端自己的版本号：服务端落后时，
// 前端会按版本差重新生成，前后端任一边更新都能自愈。
// 注意：prompt 内容变化时须前后端同步升级此版本号（前端 app.js PLAN_PROMPT_VERSION）。
const PLAN_PROMPT_VERSION = '14'; // v3.6.50 与 app.js 逐字对齐：重写【风级换算与户外/防风】——风速档位以家庭知识库中用户自定义标准为唯一准绳（用户阈值绝对优先、严禁通用风级表/兜底数值覆盖、边界严禁四舍五入或折中），兜底仅在知识库无风速风级定义时启用且须声明；详见 app.js 同段注释

// v3.6.0 育儿嫂休假 / v3.6.45 家政考勤 / 工资结算常量（与前端一致）
const HOUSEKEEPER_CLOUD_KEY = '_housekeeper';
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
    if (r.type === 'solidFood') foods.push({ names: Array.isArray(r.solidFoods) ? r.solidFoods.slice() : [], note: (r.note || '').trim(),
      time: (r.solidFoodTime || r.recTime || ''), amount: (r.solidFoodAmount > 0 ? r.solidFoodAmount : 0), afterMeal: (r.afterMeal || '') });   // v3.6.40 补添加时间/克数/饭后情况：供「辅食第N天」按昨日添加时间与量推荐今日食谱
  }
  return { counts, poop, outdoorMin, foods };
}
// v3.6.40 辅食连续添加天数（云端版）：一次拉取目标日前 60 天记录，从目标日前一天往前逐日找 solidFood，遇空档即止。
// 语义与前端 solidFoodStreak 一致：streak=1 即昨日为辅食第1天（首次添加），今日计划目标日 = 第 streak+1 天。
async function solidFoodStreakCloud(fid, key, targetDateStr) {
  try {
    const t = new Date(targetDateStr + 'T00:00:00');
    if (isNaN(t.getTime())) return { streak: 0, lastDate: '' };
    const min = new Date(t.getTime() - 60 * 86400000);
    const minStr = fmtDateLocal(min);
    const rows = await sbGet(`family_records?family_id=eq.${fid}&record_date=gte.${minStr}&record_date=lt.${targetDateStr}&select=record_date,encrypted_data,iv`);
    const foodDates = new Set();
    for (const row of (rows || [])) {
      if (!row.encrypted_data || !row.iv) continue;
      let recs = []; try { recs = JSON.parse(decrypt(key, row.encrypted_data, row.iv)); } catch { continue; }
      if (Array.isArray(recs) && recs.some(r => r && r.type === 'solidFood')) foodDates.add(String(row.record_date).slice(0, 10));
    }
    let streak = 0;
    const d = new Date(t.getTime() - 86400000);
    while (streak < 60) {
      if (!foodDates.has(fmtDateLocal(d))) break;
      streak++;
      d.setDate(d.getDate() - 1);
    }
    return { streak: streak, lastDate: streak > 0 ? fmtDateLocal(new Date(t.getTime() - 86400000)) : '' };
  } catch (e) { console.warn('[辅食] 连续添加天数读取失败', e && e.message); return { streak: 0, lastDate: '' }; }
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
function buildPlanSystemPrompt(ctx, dateStr, wText, stats, supRec, sfStreak) {
  const ad = getAgeDetail(ctx.birthDate, dateStr);
  const h = ctx.height || '', w = ctx.weight || '';
  const kbPart = (ctx.kb || []).slice(0, 50).map(x => '- [' + x.cat + '] ' + x.text).join('\n');
  // v3.6.40 辅食连续添加天数（昨日=第 streak 天，今日=第 streak+1 天；streak=0 表示前一日无辅食记录）
  const _sf = (sfStreak && typeof sfStreak === 'object' && !Array.isArray(sfStreak)) ? sfStreak : null;
  const sfDay = (_sf && _sf.streak > 0) ? (_sf.streak + 1) : 0;
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
      + (stats.foods.length ? ('- 辅食记录：' + stats.foods.map(f => (f.names.join('/') || '辅食') + (f.amount > 0 ? ' ' + f.amount + 'g' : '') + (f.time ? ('（昨日 ' + f.time + ' 添加' + (f.afterMeal && f.afterMeal !== '正常' ? '，饭后' + f.afterMeal : '') + '）') : '') + (f.note ? '（备注：' + f.note + '）' : '')).join('；') + '\n') : '- 前一日无辅食记录（今日是否试新辅食，需按下方「辅食试吃条件」判断）\n')
      + (sfDay > 0 ? ('- 辅食已连续添加 ' + _sf.streak + ' 天：昨日为辅食第' + _sf.streak + '天，今日为辅食第' + sfDay + '天\n') : '')
      + '- 营养补剂建议（与上次相反）：' + (supRec || '—') + '\n';
  }
  // v3.6.17 以下 prompt 正文与前端 app.js buildPlanSystemPrompt（v3.6.14）逐字对齐
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
    + '【起居护理】穿衣（结合天气，必须点明当日具体气温：最高/最低几度，据此建议穿什么、几件多厚，参考知识库「穿衣」；穿衣必须精确到知识库里的具体衣物名称，如「熊猫系带长袖长裤」「蓝/黄背心厚睡袋」，不得只写「长袖长裤」「连体衣」这类泛称；知识库无对应款式时才给通用建议）；若知识库中同一厚薄档位有多件衣物（如多件长袖长裤），请在该档位下**全部列出**这些厚薄合适的衣物名称（如「熊猫长袖长裤／黄边长袖长裤／条纹长袖长裤」），提示长辈当天任选一件未洗的穿，不要把多件只写一件、也不要只写泛称，让长辈据当天实际哪件未洗来选；洗澡、剪指甲、睡眠、排便关注'
    + (stats && stats.poop === 0 ? '；昨日大便 0 次，需关注是否便秘：两餐间记得喂水、多顺时针揉腹'
       : (stats && stats.poop >= 3 ? '；昨日大便≥3 次，需关注拉肚子：注意保暖、防红屁屁' : '')) + '。\n'
    + '【健康·出行】户外活动时间与时长（结合天气与昨日户外时长，给出具体时段如"上午9-10点、下午4-5点"及总时长建议）、天气应对（大风/雾霾/降温）、防病注意；并再次点明当日最高/最低温，提示长辈据此增减衣物；结合知识库「穿衣」给出是否戴帽子、是否裹薄包被/纱巾。\n'
    + '【辅食提醒】若上方"辅食记录"备注含过敏/异常（如某品牌米粉过敏），在喂养或辅食处提醒今日更换品牌（具体到备注里的牌子）。\n'
    // v3.6.40 辅食第N天食谱推荐（用户要求：前一天添加了辅食计为第一天，按添加辅食的时间与最相近月龄查知识库，推荐当天具体食谱与制作方法，如多少度的水冲泡多少米粉）
    + (sfDay > 0 ? ('【辅食第' + sfDay + '天食谱推荐】上方显示前一日已添加辅食（含昨日添加时间/食物/量）：今日为辅食第' + sfDay + '天，请在【喂养】的辅食项给出今日具体食谱与制作方法——必须具体到：①吃什么（昨日为首次添加或同食物观察未满2-3天，今日仍吃同一种食物、不添新食物；观察期满可按知识库换下一种）；②多少克/多少毫升（比昨日略增，增幅不超过2成）；③用什么温度的水（如"50-60℃温开水"）及冲调/蒸煮步骤、稀稠程度（由稀到稠）；④建议喂食时段（参考昨日添加时间，如上午10点，固定在宝宝清醒情绪好时）；⑤过敏观察要点（观察皮疹/腹泻/呕吐，出现即停）。食谱必须结合知识库「辅食」条目与宝宝当前月龄；知识库无对应月龄食谱时按通用原则：6月龄首口高铁米粉（约50-60℃水冲成缓慢滴落的稀糊、每天1次）；7-8月龄稍稠引入蛋黄/肉泥；9-10月龄稠粥碎末加手指食物；11-12月龄软饭小丁接近家庭餐。\n') : '')
    + '【辅食试吃条件】若上方为「前一日无辅食记录」（或辅食很少），请在【喂养】的辅食项按辅食添加条件判断今日是否可试新辅食：月龄是否已达 6 月龄且已开始添加辅食、是否处于健康状态且非接种当日、每次只引入一种新食物并连续观察 2-3 天无过敏再加下一种、由稀到稠由少到多；据此明确写出「今日可试 XX（某种具体食物，如米粉/南瓜泥/蛋黄）」或「暂不添加，原因：…」。\n'
    + '【补剂判定】营养补剂是否为补剂日（周一/三/五），一律按本计划日（即上方"目标日期"、任务触发当天）的星期判断；不得按"第二天"或其他任何日期判断。\n'
    + '【统计口径】天气与营养补剂一律按「本计划日（上方目标日期、任务触发当天）」判断；大便次数与早教一律按「前一日」的记录判断。两者口径不得混用。\n'
    + '【早教】放在最后一段输出。结合上方"前一日早教数据"：次数<1 的项目必须纳入今日计划；结合宝宝月龄与知识库「早教」条目，给具体可操作动作（如"练习翻身""读布书认识动物""听儿歌"）。已做满的项目不必重复。\n'
    // v3.6.50 与 app.js buildPlanSystemPrompt 逐字对齐：知识库自定义风速风级标准为唯一准绳（详见 app.js 同段注释）
    + '【风级换算与户外/防风】天气中的「最大风速」(km/h)换算风大/风小，**一律以家庭知识库中用户自定义的风速风级标准为唯一准绳**（通常位于知识库「穿衣/户外」条目，如「风小 ≤15km/h」「风稍大 15-30km/h」「风大 ≥30km/h」）。用户写明的阈值优先于本段一切数值、优先于任何通用气象风级表（如蒲福风级 3 级=12-19km/h）——**严禁使用通用风级表或四舍五入、取折中等方式自行改判档位**。边界严格按知识库原文执行：知识库写明「≤15km/h 为风小」时，16km/h 不属于风小，必须按知识库的下一档（风稍大）执行；含等号的一侧归属知识库写明的那一档。仅当知识库完全没有风速/风级相关定义时，才采用兜底：≤19km/h（≤4级，风小）→ 正常户外、可不戴帽或只戴薄帽、鼓励适当增加户外时长；20-38km/h（5-6级，风稍大）→ 戴帽防风、婴儿车加防风罩、选避风时段与地点、适当缩短户外；≥39km/h（≥7级，风大）→ 减少户外活动或改室内、必须戴帽并防风、避开风口与广告牌（参考：上海大风蓝色预警≈平均风力6级≈39km/h）；采用兜底时须在正文注明「知识库未定义风速档位，按通用口径」。该判断请写入【健康·出行】的户外时段、戴帽与避风建议中，并可在摘要点出"风大注意防风"或"风小宜多户外"（摘要与正文的风档名称一律用知识库的档位名称）。注意风有风寒效应、体感更冷，户外穿衣在气温档基础上：风稍大升半档、风大升一档。\n'
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

/* ==================== 家政考勤 / 工资（v3.6.0 → v3.6.45） ==================== */
function fmtDateLocal(d) { return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate()); }
function daysInMonth(ym) {
  const m = /^(\d{4})-(\d{2})$/.exec(ym || ''); if (!m) return 30;
  return new Date(+m[1], +m[2], 0).getDate();
}
// v3.6.45 家政考勤默认结构（与前端 hkDefault 一致）
function hkDefault() {
  const p0 = () => ({ on: true, startDate: '', endDate: '', vac: {} });
  return { hourly: p0(), nanny: p0() };
}
function hkPersonDef(v) {
  const p0 = { on: true, startDate: '', endDate: '', vac: {} };
  if (v && typeof v === 'object') {
    p0.on = v.on !== false;
    if (typeof v.startDate === 'string') p0.startDate = v.startDate;
    if (typeof v.endDate === 'string') p0.endDate = v.endDate;
    if (v.vac && typeof v.vac === 'object' && !Array.isArray(v.vac)) {
      Object.keys(v.vac).forEach(d => {
        if (/^\d{4}-\d{2}-\d{2}$/.test(d)) p0.vac[d] = (v.vac[d] === 0.5 || v.vac[d] === '0.5') ? 0.5 : 1;
      });
    }
  }
  return p0;
}
// 拉取云端家政考勤（v3.6.45）；无新键 _housekeeper 时兜底读旧键 _nanny_vacation（平铺日期数组 → nanny.vac）
async function fetchHousekeeper(fid, key) {
  try {
    const rows = await sbGet(`family_config?family_id=eq.${fid}&config_key=eq.${HOUSEKEEPER_CLOUD_KEY}&select=encrypted_data,iv`);
    if (rows.length && rows[0].encrypted_data && rows[0].iv) {
      const remote = JSON.parse(decrypt(key, rows[0].encrypted_data, rows[0].iv));
      if (remote && typeof remote === 'object') {
        return { hourly: hkPersonDef(remote.hourly), nanny: hkPersonDef(remote.nanny) };
      }
    }
  } catch (e) { console.warn('[家政考勤] 读取失败', e && e.message); }
  // 旧键兜底（v3.6.45 之前的育儿嫂休假平铺数组）
  try {
    const rows = await sbGet(`family_config?family_id=eq.${fid}&config_key=eq.${NANNY_VACATION_CLOUD_KEY}&select=encrypted_data,iv`);
    if (rows.length && rows[0].encrypted_data && rows[0].iv) {
      const arr = JSON.parse(decrypt(key, rows[0].encrypted_data, rows[0].iv));
      if (Array.isArray(arr)) {
        const hk = hkDefault();
        arr.forEach(d => { if (typeof d === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(d)) hk.nanny.vac[d] = 1; });
        return hk;
      }
    }
  } catch (e) { console.warn('[Nanny] 旧键读取失败', e && e.message); }
  return hkDefault();
}
// 某人当月总天数口径（与前端 hkMonthTotalDays 一致）：
//   v3.6.51 用户需求「如果上户日期在当月，当天日期减上户日期」：上户中(on)且上户日期在当月 →
//     本月天数 = 当天 − 上户日期 + 1（含两端：上户当天即开始工作计 1 天，与下户口径「1号至下户日含当天」对称）；
//     上户日期不在当月（更早月份上户）= 1号至今天；历史月=整月
//   已下户(!on)：下户日期在当月=1号至下户日期（含当天）；否则整月
function hkMonthTotalDays(person, ym, todayStr) {
  const dim = daysInMonth(ym);
  if (person.on) {
    if (ym === todayStr.slice(0, 7)) {
      const td = parseInt(todayStr.slice(8, 10), 10) || 1;
      const sd = person.startDate;
      if (sd && sd.slice(0, 7) === ym) {
        const sdd = parseInt(sd.slice(8, 10), 10);
        if (sdd >= 1 && sdd <= td) return td - sdd + 1;   // v3.6.51：上户日期在当月，按上户日至当天计
      }
      return td;
    }
    return dim;
  }
  const end = person.endDate;
  if (end && end.slice(0, 7) === ym) return parseInt(end.slice(8, 10), 10) || dim;
  return dim;
}
function hkMonthVacDays(person, ym) {
  let v = 0;
  Object.keys(person.vac || {}).forEach(d => { if (d.slice(0, 7) === ym) v += (person.vac[d] === 0.5 ? 0.5 : 1); });
  return v;
}
function hkNum(n) { const v = Math.round(n * 10) / 10; return Number.isInteger(v) ? String(v) : String(v); }
// v3.6.45 需求③：工资 = 满勤月工资 ÷ 满勤天数 × 当月工作天数（与前端 computeWage 一致）。
// 当月工作天数取家政考勤·育儿嫂；结算月 = 触发日前一天所在月（monthly 每月1号推=结算上月；
// 下户提前推送时 trig=下户日期当天 → 结算下户当月）。
// vacList 参数保留兼容旧签名（v3.6.45 起一律取 hk）。
function computeWage(task, trig, hk, vacList) {
  const base = (task && task.baseSalary > 0) ? task.baseSalary : NANNY_BASE_SALARY;
  const div = (task && task.payDays > 0) ? task.payDays : NANNY_PAY_DIVISOR;
  const dailyRate = base / div;
  const end = new Date(trig.getFullYear(), trig.getMonth(), trig.getDate());
  const ym = fmtDateLocal(new Date(end.getTime() - 86400000)).slice(0, 7);
  const h = hk || hkDefault();
  const person = h.nanny;
  const todayStr = fmtDateLocal(new Date());
  const totalDays = hkMonthTotalDays(person, ym, todayStr);
  const vacDays = hkMonthVacDays(person, ym);
  const workDays = Math.max(0, totalDays - vacDays);
  const wage = Math.round(dailyRate * workDays);
  return { dailyRate, baseSalary: base, payDays: div, totalDays, vacDays, workDays, wage, ym,
    startStr: ym + '-01', endStr: ym + '-' + String(totalDays).padStart(2, '0') };
}
function wagePushContent(w) {
  // v3.6.1 固定默认格式（前端任务编辑不再填写内容）：「YYYY-MM：休假 X 天，工作 Y 天，应发工资 Z 元，请转账。」
  const ym = (w.endStr || '').slice(0, 7);
  return `${ym}：休假 ${hkNum(w.vacDays)} 天，工作 ${hkNum(w.workDays)} 天，应发工资 ${w.wage} 元，请转账。`;
}
// v3.6.45 需求③：工资任务当月有下户日期时，推送提前至下户日期当天同一时刻
// （如原定 10月30日 12:00、下户 10月20日 → 10月20日 12:00 推，10月30日不推）
function wageTrigAdjusted(task, trig, hk) {
  try {
    const p0 = (hk || hkDefault()).nanny;
    if (p0 && !p0.on && p0.endDate && task.startTime) {
      const shifted = new Date(p0.endDate + 'T' + task.startTime + ':00');
      if (!isNaN(shifted.getTime()) && shifted < trig) return shifted;
    }
  } catch (e) {}
  return trig;
}
// v3.6.1 月度归档：工资结算推送成功后，把育儿嫂当月休假日归档进备忘录已办事项、清空当月休假
// v3.6.45：改操作家政考勤 housekeeper.nanny.vac（保留 0.5 半天值），并写回 _housekeeper 云键
async function archiveNannyMonthCloud(fid, key, monthKey, hk) {
  const ym = monthKey;
  const person = (hk || hkDefault()).nanny;
  const monthList = Object.keys(person.vac).filter(d => d.slice(0, 7) === ym).sort();
  const rest = Object.keys(person.vac).filter(d => d.slice(0, 7) !== ym);
  if (!monthList.length) return 0;
  const total = monthList.reduce((s, d) => s + (person.vac[d] === 0.5 ? 0.5 : 1), 0);
  // ① 写备忘录已办事项（与前端 loadMemoCloud 合并策略一致：云端先入、服务端后入）
  try {
    const rows = await sbGet(`family_config?family_id=eq.${fid}&config_key=eq._memo&select=encrypted_data,iv`);
    let arr = [];
    if (rows.length && rows[0].encrypted_data && rows[0].iv) {
      try { const p = JSON.parse(decrypt(key, rows[0].encrypted_data, rows[0].iv)); if (Array.isArray(p)) arr = p; } catch { /* ignore */ }
    }
    const maxId = arr.reduce((m, x) => Math.max(m, (x && x.id) || 0), 0);
    arr.unshift({ id: maxId + 1, done: true, date: fmtDateLocal(new Date()),
      text: '👩 育儿嫂休假 ' + ym + '：' + monthList.join('、') + '（共 ' + hkNum(total) + ' 天）' });
    const enc = encrypt(key, JSON.stringify(arr));
    await sbUpsert('family_config', { family_id: fid, config_key: '_memo', encrypted_data: enc.data, iv: enc.iv, last_modified: Date.now() });
    console.log('[家政考勤] 已归档当月休假日到备忘录已办事项', ym, monthList.length, '天');
  } catch (e) { console.warn('[家政考勤] 备忘录归档失败', e && e.message); }
  // ② 清空当月休假并写回云端（_housekeeper）
  try {
    const out = hk || hkDefault();
    const newVac = {};
    rest.forEach(d => { newVac[d] = out.nanny.vac[d]; });
    out.nanny.vac = newVac;
    const enc2 = encrypt(key, JSON.stringify(out));
    await sbUpsert('family_config', { family_id: fid, config_key: HOUSEKEEPER_CLOUD_KEY, encrypted_data: enc2.data, iv: enc2.iv, last_modified: Date.now() });
    console.log('[家政考勤] 已清空当月休假', ym, '剩余', rest.length, '天');
  } catch (e) { console.warn('[家政考勤] 回写失败', e && e.message); }
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
// v3.6.16 主源 Open-Meteo（daily + hourly 兜底风速/气温）；失败/配额超限返回 null 交由备用源
async function openMeteoText(addr, dateStr) {
  try {
    const geo = await geocode(addr);
    const url = 'https://api.open-meteo.com/v1/forecast?latitude=' + geo.lat + '&longitude=' + geo.lon
      + '&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,wind_speed_10m_max'
      + '&hourly=wind_speed_10m,temperature_2m'
      + '&timezone=Asia%2FShanghai&start_date=' + dateStr + '&end_date=' + dateStr;
    const res = await fetch(url);
    const j = await res.json();
    if (j && j.error) return null;                                   // 「Daily API request limit exceeded」等 → 触发备用源
    const d = j && j.daily;
    if (!d || !d.time || !d.time.length) return null;
    let tmax = d.temperature_2m_max[0], tmin = d.temperature_2m_min[0], wind = d.wind_speed_10m_max[0];
    // daily 缺风速/气温时，用 hourly 当日值兜底（修复「温度有、风速未知」的半失败）
    const ws = ((j.hourly && j.hourly.wind_speed_10m) || []).filter(x => x != null);
    if (wind == null && ws.length) wind = Math.max.apply(null, ws);
    const ts = ((j.hourly && j.hourly.temperature_2m) || []).filter(x => x != null);
    if ((tmax == null || tmin == null) && ts.length) {
      if (tmax == null) tmax = Math.max.apply(null, ts);
      if (tmin == null) tmin = Math.min.apply(null, ts);
    }
    if (tmax == null && tmin == null) return null;
    const desc = (d.weather_code && WMO_CODES[d.weather_code[0]] != null) ? WMO_CODES[d.weather_code[0]] : '';
    return geo.name + (desc ? ' ' + desc : '') + '，最高' + Math.round(tmax) + '℃/最低' + Math.round(tmin)
      + '℃，降水概率' + ((d.precipitation_probability_max && d.precipitation_probability_max[0] != null) ? d.precipitation_probability_max[0] : '—')
      + '%，最大风速' + (wind != null ? Math.round(wind) : '—') + 'km/h';
  } catch { return null; }
}
// v3.6.16 备用源 wttr.in（独立服务/配额，用坐标查询，无需城市名）
async function wttrText(addr, dateStr) {
  try {
    const geo = await geocode(addr);
    const res = await fetch('https://wttr.in/' + geo.lat + ',' + geo.lon + '?format=j1');
    const j = await res.json();
    const w = (j && j.weather || []).find(x => x.date === dateStr) || (j && j.weather && j.weather[0]);
    if (!w) return null;
    const tmax = parseFloat(w.maxtempC), tmin = parseFloat(w.mintempC);
    if (isNaN(tmax) || isNaN(tmin)) return null;
    const hs = (w.hourly || []).map(h => parseInt(h.windspeedKmph, 10)).filter(x => !isNaN(x));
    const wind = hs.length ? Math.max.apply(null, hs) : null;
    return geo.name + '（备用天气源），最高' + Math.round(tmax) + '℃/最低' + Math.round(tmin)
      + '℃，最大风速' + (wind != null ? wind : '—') + 'km/h';
  } catch { return null; }
}
/* v3.6.17 天气缓存（云端，3h TTL）：同一「地址|日期」在 TTL 内直接复用，
 * 避免版本过期/生成重试期间反复打 Open-Meteo（免费额度按 IP 计，Actions 共享 IP 易超限）。
 * 只缓存成功结果；缓存读写失败不影响主流程。 */
async function readWeatherCache(fid, key, addr, dateStr) {
  try {
    const rows = await sbGet(`family_config?family_id=eq.${fid}&config_key=eq.${WEATHER_CACHE_KEY}&select=encrypted_data,iv`);
    if (!rows.length || !rows[0].encrypted_data || !rows[0].iv) return null;
    const c = JSON.parse(decrypt(key, rows[0].encrypted_data, rows[0].iv));
    const hit = c && c[addr + '|' + dateStr];
    if (hit && hit.text && Date.now() - (hit.ts || 0) < WEATHER_CACHE_TTL) return hit.text;
  } catch (e) { console.warn('[天气] 缓存读取失败', e && e.message); }
  return null;
}
async function writeWeatherCache(fid, key, addr, dateStr, text) {
  try {
    let c = {};
    const rows = await sbGet(`family_config?family_id=eq.${fid}&config_key=eq.${WEATHER_CACHE_KEY}&select=encrypted_data,iv`);
    if (rows.length && rows[0].encrypted_data && rows[0].iv) {
      try { c = JSON.parse(decrypt(key, rows[0].encrypted_data, rows[0].iv)) || {}; } catch { c = {}; }
    }
    c[addr + '|' + dateStr] = { ts: Date.now(), text };
    const ks = Object.keys(c);
    if (ks.length > 8) ks.slice(0, ks.length - 8).forEach(k => delete c[k]);   // 只保留最近 8 条
    const enc = encrypt(key, JSON.stringify(c));
    await sbUpsert('family_config', { family_id: fid, config_key: WEATHER_CACHE_KEY, encrypted_data: enc.data, iv: enc.iv, last_modified: Date.now() });
  } catch (e) { console.warn('[天气] 缓存写入失败', e && e.message); }
}
async function weatherText(addr, dateStr, fid, key) {
  const cached = (fid && key) ? await readWeatherCache(fid, key, addr, dateStr) : null;
  if (cached) { console.log('[天气] 命中云端缓存', addr + '|' + dateStr); return cached; }
  const t = await openMeteoText(addr, dateStr) || await wttrText(addr, dateStr);
  if (t && fid && key) await writeWeatherCache(fid, key, addr, dateStr, t);   // 只缓存成功结果
  return t || '（天气获取失败，请手动参考天气预报）';
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
  try { wText = await weatherText(ctx.weatherAddr, dateStr, fid, key); } catch { /* ignore */ }
  // v3.6.1 统计「目标日期的前一天」的记录（如 10-14 的计划按 10-13 的记录）
  let stats = null, supRec = 'AD', sfStreak = { streak: 0, lastDate: '' };   // v3.6.40 sfStreak：辅食连续添加天数
  if (key && fid) {
    try {
      const prev = new Date(trig.getTime() - 86400000);
      const prevStr = prev.getFullYear() + '-' + pad2(prev.getMonth() + 1) + '-' + pad2(prev.getDate());
      const recs = await fetchDayRecords(fid, key, prevStr);
      stats = collectPlanDayStats(recs);
      sfStreak = await solidFoodStreakCloud(fid, key, dateStr);
      supRec = await recentSupplement(fid, key);
      console.log('[计划] 前一日统计', prevStr, '早教=', JSON.stringify(stats && stats.counts), '大便=', stats && stats.poop, '户外=', stats && stats.outdoorMin, '补剂=', supRec, '辅食连续天数=', sfStreak && sfStreak.streak);
    } catch (e) { console.warn('[计划] 统计读取失败', e && e.message); }
  }
  const r = await callAI(ctx.ai, [
    { role: 'system', content: buildPlanSystemPrompt(ctx, dateStr, wText, stats, supRec, sfStreak) },
    { role: 'user', content: '请为 ' + dateStr + '（地址：' + (ctx.weatherAddr || '') + '）生成今日计划，严格按格式输出。' }
  ]);
  if (!r) { console.warn('[计划] 生成失败，跳过'); return false; }
  task.content = String(r).trim();
  task.genPeriod = periodKey(task, trig);
  task.genDate = dateStr;
  task.planVer = PLAN_PROMPT_VERSION;   // v3.6.17 标记服务端自己的版本号（不再冒用 ctx.promptVer）：服务端落后时前端会按版本差重新生成，自愈
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
  catch (e) {
    // v3.6.17 明确根因与恢复方法：某台设备/测试环境用不一致的盐覆盖了云端 _salt
    // （前端 v3.6.17 已修复该「验证不了就覆盖」的自动修复漏洞；v3.6.52 再加安全闸：
    //  家庭已有数据行时，本地无盐设备即使 _salt 查询为空也绝不新建随机盐上传）。
    console.error('[Sched] 云端定时任务解密失败：', e && e.message);
    console.error('[Sched] 根因通常是云端 _salt 被不一致的密钥覆盖（家庭数据密钥被打挂）。');
    console.error('[Sched] 恢复方法：在存有真实数据的手机上打开 App（切前台/联网即触发密钥巡检），多行试解自动判定并修复云端 salt；随后本工作流即可正常解密。');
    process.exit(1);
  }

  const tasks = Array.isArray(data.tasks) ? data.tasks : [];
  const ctx = data.ctx || {};
  console.log('[Sched] 任务数 =', tasks.length, '| AI密钥 =', ctx.ai && ctx.ai.apiKey ? '有' : '无', '| 推送token =', ctx.pushToken ? '有' : '无', '| 天气地址 =', ctx.weatherAddr || '');

  // v3.6.0 育儿嫂休假集合（供工资任务扣减）/ v3.6.45 家政考勤（housekeeper_v1）
  let housekeeper = hkDefault();
  try { housekeeper = await fetchHousekeeper(fid, key); } catch (e) { console.warn('[家政考勤] 读取失败', e && e.message); }
  const now = new Date();   // v3.6.52 修复 TDZ：原声明在下方家政考勤日志之后，main() 每次运行必崩（v3.6.45 引入，此前被盐解密失败挡着）
  console.log('[Sched] 家政考勤（育儿嫂）当月休假天数 =', hkMonthVacDays(housekeeper.nanny, fmtDateLocal(now).slice(0, 7)));

  let changed = false;
  const genAttempted = new Set();   // v3.6.17 本次运行已尝试过生成的任务（避免①失败后②在同一次运行内重复调 AI+天气）

  for (const task of tasks) {
    if (!task || !task.enabled) continue;
    const { prev, next } = computeTriggers(task, now);
    const name = (task.name && String(task.name).trim()) ? String(task.name).trim() : (task.mode === 'ai' ? '今日计划' : '定时提醒');
    const taskKey = (task.id != null) ? String(task.id) : name;

    // ① v3.6.17 AI 计划：每天 0 点生成「当天」计划（不再提前 12h 生成次日计划）
    //    云端未生成当天计划(genDate !== 今天) 或 prompt 版本过期 → 用今天 00:00 生成；
    //    前端已生成/编辑当天计划并同步到云端时，此处不覆盖（保护用户编辑）。
    //    v3.6.17 新增 30 分钟冷却（task.genTryTs 持久化到云端）：杜绝每 5 分钟重试风暴。
    if (task.mode === 'ai' && ctx.ai && !genAttempted.has(taskKey)) {
      const todayStr = fmtDateLocal(now);
      const todayTrg = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const staleVer = Number(task.planVer || 0) < Number(PLAN_PROMPT_VERSION);   // v3.6.17 数值单调比较，防高低版本乒乓
      const cooling = (now.getTime() - (task.genTryTs || 0)) <= SCHED_GEN_COOLDOWN;
      if ((task.genDate !== todayStr || staleVer || !task.content) && !cooling) {
        console.log('[Sched] 生成今日计划:', name, 'for', todayStr);
        task.genTryTs = now.getTime();   // 冷却起点（成功/失败都记，失败后 30 分钟内不重试）
        genAttempted.add(taskKey);
        if (await generatePlan(task, todayTrg, ctx, fid, key)) changed = true;
        else changed = true;             // genTryTs 变化也需要回写，让冷却跨运行生效
      }
    }

    // ② 到点推送
    // v3.6.45 需求③：工资任务当月有下户日期 → 推送提前至下户日期当天同一时刻（原触发点不再推）
    let trig = prev;
    if (!trig) continue;
    if (task.type === 'wage') trig = wageTrigAdjusted(task, trig, housekeeper);
    const inWindow = now >= trig && now < new Date(trig.getTime() + SCHED_PUSH_GRACE);
    const pk = periodKey(task, trig);
    if (!inWindow) { console.log('[Sched] 未到点:', name, '下次', next ? next.toLocaleString('zh-CN') : '—'); continue; }
    if (task.pushPeriod === pk) continue;
    const sig = 'task|' + (task.id || task.name || '') + '|' + pk;
    if (await cloudDup(fid, sig)) { console.log('[Sched] 云端已推过，跳过:', name, pk); task.pushPeriod = pk; changed = true; continue; }

    // v3.6.17 ① 已尝试过生成（失败）则不再同运行内重复生成（此前会造成双份 AI+天气调用）；
    // 同时受 30 分钟冷却保护：到点推送前几分钟刚失败过，不会立刻再调一次 AI+天气
    if (task.mode === 'ai' && !task.content && !genAttempted.has(taskKey)
        && (now.getTime() - (task.genTryTs || 0)) > SCHED_GEN_COOLDOWN) {
      console.log('[Sched] 到点前补生成今日计划:', name);
      task.genTryTs = now.getTime();
      genAttempted.add(taskKey);
      if (await generatePlan(task, trig, ctx, fid, key)) changed = true;
      else changed = true;
    }

    let title, content;
    // v3.6.0 育儿嫂工资任务 / v3.6.45 需求③：触发时按「满勤月工资÷满勤天数×当月工作天数」算工资
    // （当月工作天数取家政考勤·育儿嫂，见 computeWage）
    if (task.type === 'wage') {
      const w = computeWage(task, trig, housekeeper);
      title = '👩 育儿嫂工资结算';
      content = '<pre style="white-space:pre-wrap;font-family:inherit;line-height:1.6;">' + escapeHtml(wagePushContent(w)) + '</pre>';
    } else if (task.mode === 'ai') {
      const sp = splitPlan(task.content);
      title = '📅 ' + name;
      const sum = sp.summary ? '<p style="font-size:16px;font-weight:600;">📌 ' + escapeHtml(sp.summary) + '</p>' : '';
      // v3.6.18 详情标题只保留任务名称（用户要求去掉「小咕噜 」前缀；与前端 app.js 同步）
      content = '<h3>' + escapeHtml(name) + '</h3>' + sum + '<pre style="white-space:pre-wrap;font-family:inherit;line-height:1.6;">' + escapeHtml(sp.detail || task.content || '') + '</pre>';
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
        // v3.6.1 结算成功后归档：当月休假 → 备忘录已办，清空当月休假
        // v3.6.45：归档操作家政考勤 housekeeper.nanny.vac（保留 0.5 半天值）
        const ym = fmtDateLocal(new Date(trig.getTime() - 86400000)).slice(0, 7);
        try { await archiveNannyMonthCloud(fid, key, ym, housekeeper); }
        catch (e) { console.warn('[家政考勤] 归档失败', e && e.message); }
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
