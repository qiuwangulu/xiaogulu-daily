#!/usr/bin/env node
/**
 * 小咕噜 sched-push.mjs 本地 mock 集成测试（v3.6.17 回归）
 * ------------------------------------------------------
 * 硬隔离（遵守 ISOLATE.md）：
 *   - 不访问任何真实服务：Supabase / Open-Meteo / wttr.in / PushPlus / DeepSeek 全部由本地 mock 服务器扮演；
 *     任何漏网的外部请求会直接抛错（MOCK-ISOLATION），确保测试绝不误触线上。
 *   - 不使用真实家庭码：FAMILY_CODE 为每次运行随机生成的 TEST-ISOLATE-xxxx。
 *   - 不写云端：脚本的 SB_URL 被指向 127.0.0.1 的 mock 服务器。
 *
 * 覆盖 v3.6.17 修复点：
 *   A. 「部署后今日计划不刷新」→ 服务端 prompt 版本过期(staleVer)必须触发重生成，并标记服务端自己的 planVer=12；
 *   B. 30 分钟生成冷却 → 连续两次运行（pg_cron 每 5 分钟触发）不得重复调 AI；
 *   C. 天气缓存 → 同一次运行内两个 AI 任务只打一次 Open-Meteo；
 * D. 到点推送去重 + 「补生成」不得与①同运行双调用（genAttempted 守卫）；
 *   E. 解密失败（盐不一致）→ 明确报错并以退出码 1 结束（不再静默无推送）；
 *   F. 云端版本更高（前端已生成新版）→ 服务端不得回退重生成（防乒乓）。
 *
 * 用法：
 *   node scripts/sched-push.test.mjs                      # 跑全部用例
 *   node scripts/sched-push.test.mjs --case cooldown-blocks   # 只跑指定用例
 *   node scripts/sched-push.test.mjs --case <name>        # 内部子进程模式（由 runner 调用，勿手动使用）
 */
import crypto from 'node:crypto';
import http from 'node:http';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { spawnSync } from 'node:child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SCRIPT = path.join(__dirname, 'sched-push.mjs');

/* ==================== 测试专用密钥材料（随机，与任何真实家庭无关） ==================== */
function makeMaterial() {
  return { code: 'TEST-ISOLATE-' + crypto.randomBytes(5).toString('hex'), salt: crypto.randomBytes(16).toString('base64') };
}
function deriveKey(code, saltB64) {
  return crypto.pbkdf2Sync(Buffer.from(code, 'utf8'), Buffer.from(saltB64, 'base64'), 310000, 32, 'sha256');
}
function encrypt(key, plaintext) {
  const iv = crypto.randomBytes(12);
  const c = crypto.createCipheriv('aes-256-gcm', key, iv);
  const enc = Buffer.concat([c.update(Buffer.from(plaintext, 'utf8')), c.final()]);
  return { data: Buffer.concat([enc, c.getAuthTag()]).toString('base64'), iv: iv.toString('base64') };
}
function decrypt(key, dataB64, ivB64) {
  const buf = Buffer.from(dataB64, 'base64');
  const d = crypto.createDecipheriv('aes-256-gcm', key, Buffer.from(ivB64, 'base64'));
  d.setAuthTag(buf.subarray(buf.length - 16));
  return Buffer.concat([d.update(buf.subarray(0, buf.length - 16)), d.final()]).toString('utf8');
}

/* ==================== 北京时间工具（与脚本 fmtDateLocal 语义一致） ==================== */
function shParts(d) {
  const p = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Shanghai', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false }).formatToParts(d);
  const g = t => Number(p.find(x => x.type === t).value);
  return { y: g('year'), m: g('month'), d: g('day'), hh: g('hour'), mm: g('minute') };
}
const pad2 = n => String(n).padStart(2, '0');
function todayStr() { const p = shParts(new Date()); return p.y + '-' + pad2(p.m) + '-' + pad2(p.d); }
/** 取「now - minusMin 分钟」的北京时间日期与时分，用作任务首次触发时间（保证落在 3 小时推送窗口内） */
function trigStr(minusMin) {
  const p = shParts(new Date(Date.now() - minusMin * 60000));
  return { startDate: p.y + '-' + pad2(p.m) + '-' + pad2(p.d), startTime: pad2(p.hh) + ':' + pad2(p.mm) };
}

/* ==================== 用例定义 ==================== */
const CASES = {
  /* A. 服务端 prompt 冻结在旧版本（planVer=8）→ 必须重生成并标记 12（修复「部署后不刷新」） */
  'stale-regenerates': {
    runs: 1,
    seed(st) {
      const key = deriveKey(st.mat.code, st.mat.salt);
      const today = todayStr();
      const cloud = { tasks: [aiTask({ id: 't1', genDate: today, planVer: '8', content: '旧prompt(v8)生成的内容', genTryTs: 0 })], ctx: baseCtx(st), ts: Date.now() };
      st.store['_salt'] = { config_key: '_salt', encrypted_data: st.mat.salt, iv: '' };
      const enc = encrypt(key, JSON.stringify(cloud));
      st.store['_sched_cloud'] = { config_key: '_sched_cloud', encrypted_data: enc.data, iv: enc.iv };
      st.today = today;
    },
    assert(runs, st) {
      const c = runs[0].counters, log = runs[0].log.join('\n');
      eq(c.ai, 1, '陈旧版本应触发 1 次 AI 生成');
      eq(c.omForecast, 1, '应调用 1 次 Open-Meteo');
      ok(log.includes('生成今日计划'), '日志应包含「生成今日计划」');
      const cloud = JSON.parse(decrypt(deriveKey(st.mat.code, st.mat.salt), st.store['_sched_cloud'].encrypted_data, st.store['_sched_cloud'].iv));
      eq(cloud.tasks[0].planVer, '12', '生成后应标记服务端版本 12');
      eq(cloud.tasks[0].genDate, st.today, 'genDate 应为今天');
      ok(cloud.tasks[0].content.includes('MOCK'), '内容应为新生成（mock）');
      ok(cloud.tasks[0].genTryTs > 0, 'genTryTs 应已记录（冷却起点）');
    }
  },

  /* B1. 5 分钟内刚尝试过（pg_cron 5 分钟节奏）→ 冷却期内不得再调 AI（防 token 风暴） */
  'cooldown-blocks': {
    runs: 1,
    seed(st) {
      const key = deriveKey(st.mat.code, st.mat.salt);
      const today = todayStr();
      const cloud = { tasks: [aiTask({ id: 't1', genDate: today, planVer: '8', content: '旧prompt(v8)生成的内容', genTryTs: Date.now() - 5 * 60000 })], ctx: baseCtx(st), ts: Date.now() };
      st.store['_salt'] = { config_key: '_salt', encrypted_data: st.mat.salt, iv: '' };
      const enc = encrypt(key, JSON.stringify(cloud));
      st.store['_sched_cloud'] = { config_key: '_sched_cloud', encrypted_data: enc.data, iv: enc.iv };
    },
    assert(runs) {
      eq(runs[0].counters.ai, 0, '冷却期内（5 分钟）不得调用 AI');
      eq(runs[0].counters.omForecast, 0, '冷却期内不得调用天气');
      const log = runs[0].log.join('\n');
      ok(!log.includes('生成今日计划'), '冷却期内不得触发生成');
      // 若测试时刻恰在 00:01 任务的 3 小时推送窗口内：允许用旧内容到点推送（正确降级行为）；
      // 否则应记录「无到点任务」。
      ok(log.includes('无到点任务') || log.includes('到点推送'), '应正常走完流程');
    }
  },

  /* B2. 冷却已过（45 分钟）→ 允许重试（自愈） */
  'cooldown-expires': {
    runs: 1,
    seed(st) {
      const key = deriveKey(st.mat.code, st.mat.salt);
      const today = todayStr();
      const cloud = { tasks: [aiTask({ id: 't1', genDate: today, planVer: '8', content: '旧prompt(v8)生成的内容', genTryTs: Date.now() - 45 * 60000 })], ctx: baseCtx(st), ts: Date.now() };
      st.store['_salt'] = { config_key: '_salt', encrypted_data: st.mat.salt, iv: '' };
      const enc = encrypt(key, JSON.stringify(cloud));
      st.store['_sched_cloud'] = { config_key: '_sched_cloud', encrypted_data: enc.data, iv: enc.iv };
    },
    assert(runs, st) {
      eq(runs[0].counters.ai, 1, '冷却过后应重试生成');
      const cloud = JSON.parse(decrypt(deriveKey(st.mat.code, st.mat.salt), st.store['_sched_cloud'].encrypted_data, st.store['_sched_cloud'].iv));
      eq(cloud.tasks[0].planVer, '12', '重生成后应标记 12');
    }
  },

  /* B3. 当天已用最新 prompt 生成过 → 不得重复调用 */
  'fresh-same-day': {
    runs: 1,
    seed(st) {
      const key = deriveKey(st.mat.code, st.mat.salt);
      const today = todayStr();
      const cloud = { tasks: [aiTask({ id: 't1', genDate: today, planVer: '12', content: '新版内容', genTryTs: Date.now() - 2 * 3600000 })], ctx: baseCtx(st), ts: Date.now() };
      st.store['_salt'] = { config_key: '_salt', encrypted_data: st.mat.salt, iv: '' };
      const enc = encrypt(key, JSON.stringify(cloud));
      st.store['_sched_cloud'] = { config_key: '_sched_cloud', encrypted_data: enc.data, iv: enc.iv };
    },
    assert(runs) {
      eq(runs[0].counters.ai, 0, '当天已生成不得重复调用');
    }
  },

  /* F. 云端版本更高（前端 v13 已生成）→ 服务端(12)不得回退重生成（防乒乓） */
  'cloud-newer-no-pingpong': {
    runs: 1,
    seed(st) {
      const key = deriveKey(st.mat.code, st.mat.salt);
      const today = todayStr();
      const cloud = { tasks: [aiTask({ id: 't1', genDate: today, planVer: '13', content: '前端新版内容', genTryTs: 0 })], ctx: baseCtx(st), ts: Date.now() };
      st.store['_salt'] = { config_key: '_salt', encrypted_data: st.mat.salt, iv: '' };
      const enc = encrypt(key, JSON.stringify(cloud));
      st.store['_sched_cloud'] = { config_key: '_sched_cloud', encrypted_data: enc.data, iv: enc.iv };
    },
    assert(runs) {
      eq(runs[0].counters.ai, 0, '云端版本更高时服务端不得回退重生成');
    }
  },

  /* 跨天：genDate 是昨天 → 今天必须重新生成 */
  'cross-day-regenerates': {
    runs: 1,
    seed(st) {
      const key = deriveKey(st.mat.code, st.mat.salt);
      const y = new Date(Date.now() - 86400000);
      const p = shParts(y);
      const yesterday = p.y + '-' + pad2(p.m) + '-' + pad2(p.d);
      const cloud = { tasks: [aiTask({ id: 't1', genDate: yesterday, planVer: '12', content: '昨天的计划', genTryTs: 0 })], ctx: baseCtx(st), ts: Date.now() };
      st.store['_salt'] = { config_key: '_salt', encrypted_data: st.mat.salt, iv: '' };
      const enc = encrypt(key, JSON.stringify(cloud));
      st.store['_sched_cloud'] = { config_key: '_sched_cloud', encrypted_data: enc.data, iv: enc.iv };
    },
    assert(runs, st) {
      eq(runs[0].counters.ai, 1, '跨天必须重新生成');
      const cloud = JSON.parse(decrypt(deriveKey(st.mat.code, st.mat.salt), st.store['_sched_cloud'].encrypted_data, st.store['_sched_cloud'].iv));
      eq(cloud.tasks[0].genDate, todayStr(), 'genDate 应更新为今天');
    }
  },

  /* B4. 生成失败（AI 500）后紧接着的第二次运行（pg_cron 5 分钟后）→ 冷却挡住，两次运行共 1 次调用 */
  'fail-then-cooldown': {
    runs: 2,
    seed(st) {
      const key = deriveKey(st.mat.code, st.mat.salt);
      const today = todayStr();
      const cloud = { tasks: [aiTask({ id: 't1', genDate: today, planVer: '8', content: '', genTryTs: 0 })], ctx: baseCtx(st, { ai: 'fail' }), ts: Date.now() };
      st.store['_salt'] = { config_key: '_salt', encrypted_data: st.mat.salt, iv: '' };
      const enc = encrypt(key, JSON.stringify(cloud));
      st.store['_sched_cloud'] = { config_key: '_sched_cloud', encrypted_data: enc.data, iv: enc.iv };
    },
    assert(runs, st) {
      eq(runs[0].delta.ai, 1, '首次运行应尝试 1 次（失败）');
      eq(runs[1].delta.ai, 0, '第二次运行（5 分钟后）应被冷却挡住');
      const cloud = JSON.parse(decrypt(deriveKey(st.mat.code, st.mat.salt), st.store['_sched_cloud'].encrypted_data, st.store['_sched_cloud'].iv));
      ok(cloud.tasks[0].genTryTs > 0, '失败后 genTryTs 必须回写云端（冷却跨运行生效）');
      eq(cloud.tasks[0].planVer, '8', '失败不得标记为新版本');
      ok(runs[0].log.join('\n').includes('生成失败'), '失败应有明确日志');
    }
  },

  /* C. 天气缓存：同一次运行两个 AI 任务 → Open-Meteo 只打 1 次，第二次命中云端缓存 */
  'weather-cache-two-tasks': {
    runs: 1,
    seed(st) {
      const key = deriveKey(st.mat.code, st.mat.salt);
      const today = todayStr();
      const cloud = { tasks: [
        aiTask({ id: 't1', genDate: today, planVer: '8', content: '旧1', genTryTs: 0 }),
        aiTask({ id: 't2', name:'今日计划2', genDate: today, planVer: '8', content: '旧2', genTryTs: 0 })
      ], ctx: baseCtx(st), ts: Date.now() };
      st.store['_salt'] = { config_key: '_salt', encrypted_data: st.mat.salt, iv: '' };
      const enc = encrypt(key, JSON.stringify(cloud));
      st.store['_sched_cloud'] = { config_key: '_sched_cloud', encrypted_data: enc.data, iv: enc.iv };
    },
    assert(runs) {
      eq(runs[0].counters.ai, 2, '两个任务应各自生成');
      eq(runs[0].counters.omForecast, 1, '天气缓存生效：Open-Meteo 只调用 1 次');
      ok(runs[0].log.join('\n').includes('命中云端缓存'), '日志应记录命中缓存');
    }
  },

  /* C2. 地理编码路径：地址不在本地兜底表 → 应调一次 geocoding + 一次 forecast */
  'weather-geocode-path': {
    runs: 1,
    seed(st) {
      const key = deriveKey(st.mat.code, st.mat.salt);
      const today = todayStr();
      const cloud = { tasks: [aiTask({ id: 't1', genDate: today, planVer: '8', content: '旧', genTryTs: 0 })], ctx: baseCtx(st, { weatherAddr: '杭州市西湖区' }), ts: Date.now() };
      st.store['_salt'] = { config_key: '_salt', encrypted_data: st.mat.salt, iv: '' };
      const enc = encrypt(key, JSON.stringify(cloud));
      st.store['_sched_cloud'] = { config_key: '_sched_cloud', encrypted_data: enc.data, iv: enc.iv };
    },
    assert(runs) {
      eq(runs[0].counters.omGeo, 1, '应调用 1 次地理编码');
      eq(runs[0].counters.omForecast, 1, '应调用 1 次预报');
      eq(runs[0].counters.wttr, 0, '主源成功不得启用备用源');
    }
  },

  /* C3. 主源配额超限（j.error）→ 自动切换 wttr.in 备用源（v3.6.16 行为保持） */
  'weather-fallback-wttr': {
    runs: 1,
    seed(st) {
      const key = deriveKey(st.mat.code, st.mat.salt);
      const today = todayStr();
      const cloud = { tasks: [aiTask({ id: 't1', genDate: today, planVer: '8', content: '旧', genTryTs: 0 })], ctx: baseCtx(st, { om: 'limit' }), ts: Date.now() };
      st.store['_salt'] = { config_key: '_salt', encrypted_data: st.mat.salt, iv: '' };
      const enc = encrypt(key, JSON.stringify(cloud));
      st.store['_sched_cloud'] = { config_key: '_sched_cloud', encrypted_data: enc.data, iv: enc.iv };
    },
    assert(runs) {
      eq(runs[0].counters.omForecast, 1, '主源应被调用 1 次');
      eq(runs[0].counters.wttr, 1, '主源超限应切换备用源 wttr.in');
      eq(runs[0].counters.ai, 1, '天气走备用源不影响计划生成');
    }
  },

  /* D1. 到点推送 + 跨运行去重：第二次运行不得重复推送 */
  'push-and-dedup': {
    runs: 2,
    seed(st) {
      const key = deriveKey(st.mat.code, st.mat.salt);
      const t = trigStr(2);   // 2 分钟前 → 落在 3 小时推送窗口内
      const cloud = { tasks: [textTask(t)], ctx: baseCtx(st), ts: Date.now() };
      st.store['_salt'] = { config_key: '_salt', encrypted_data: st.mat.salt, iv: '' };
      const enc = encrypt(key, JSON.stringify(cloud));
      st.store['_sched_cloud'] = { config_key: '_sched_cloud', encrypted_data: enc.data, iv: enc.iv };
    },
    assert(runs, st) {
      eq(runs[0].delta.pushplus, 1, '首次到点应推送 1 次');
      ok(runs[0].log.join('\n').includes('到点推送'), '日志应记录到点推送');
      eq(runs[1].delta.pushplus, 0, '第二次运行不得重复推送（pushPeriod 已标记）');
      ok(st.store['_schedpushdedup'], '应写云端去重标记');
      const cloud = JSON.parse(decrypt(deriveKey(st.mat.code, st.mat.salt), st.store['_sched_cloud'].encrypted_data, st.store['_sched_cloud'].iv));
      ok(cloud.tasks[0].pushPeriod, 'pushPeriod 应已回写');
    }
  },

  /* D2. 到点推送前①刚生成失败（内容仍空）→ 补生成不得同运行双调用 AI（genAttempted 守卫） */
  'push-empty-single-gen': {
    runs: 1,
    seed(st) {
      const key = deriveKey(st.mat.code, st.mat.salt);
      const t = trigStr(2);
      const cloud = { tasks: [Object.assign(aiTask({ id: 't1', genDate: todayStr(), planVer: '8', content: '', genTryTs: 0 }), { startDate: t.startDate, startTime: t.startTime })], ctx: baseCtx(st, { ai: 'fail' }), ts: Date.now() };
      st.store['_salt'] = { config_key: '_salt', encrypted_data: st.mat.salt, iv: '' };
      const enc = encrypt(key, JSON.stringify(cloud));
      st.store['_sched_cloud'] = { config_key: '_sched_cloud', encrypted_data: enc.data, iv: enc.iv };
    },
    assert(runs) {
      eq(runs[0].counters.ai, 1, '①失败后②补生成被守卫挡住：全程只 1 次 AI 调用');
      eq(runs[0].counters.pushplus, 1, '到点仍应推送（内容允许为空）');
    }
  },

  /* E1. 云端 _salt 被不一致的盐覆盖 → 解密失败：明确报错 + 退出码 1（不再静默无推送） */
  'decrypt-fail': {
    runs: 1,
    seed(st) {
      const otherSalt = crypto.randomBytes(16).toString('base64');   // 模拟另一台设备用不同盐覆盖了云端 _salt
      const goodKey = deriveKey(st.mat.code, st.mat.salt);           // 数据本来的正确密钥
      const cloud = { tasks: [aiTask({ id: 't1', genDate: todayStr(), planVer: '8', content: 'x', genTryTs: 0 })], ctx: baseCtx(st), ts: Date.now() };
      const enc = encrypt(goodKey, JSON.stringify(cloud));                                   // 数据用正确盐加密
      st.store['_sched_cloud'] = { config_key: '_sched_cloud', encrypted_data: enc.data, iv: enc.iv };
      st.store['_salt'] = { config_key: '_salt', encrypted_data: otherSalt, iv: '' };       // 但云端盐已被换成别人的
      st.cfg.noRewrite = true;   // 禁止子进程重写 _sched_cloud（否则会把盐不一致「修好」，失去测试意义）
    },
    assert(runs) {
      eq(runs[0].exitCode, 1, '解密失败必须以退出码 1 结束');
      const log = runs[0].log.join('\n');
      ok(log.includes('解密失败'), '日志应明确「解密失败」');
      ok(log.includes('恢复方法'), '日志应给出恢复方法');
      ok(log.includes('_salt'), '日志应指出根因（_salt 被覆盖）');
    }
  },

  /* E2. 云端无 salt → 退出码 1 */
  'no-salt': {
    runs: 1,
    seed(st) {
      // 不写 _salt
    },
    assert(runs) {
      eq(runs[0].exitCode, 1, '无 salt 必须以退出码 1 结束');
      ok(runs[0].log.join('\n').includes('云端无 salt'), '日志应明确「云端无 salt」');
    }
  },
};

/* ==================== 任务/上下文构造 ==================== */
function baseCtx(st, opt) {
  opt = opt || {};
  st.cfg = opt;   // mock 行为模式（ai:'fail' / om:'limit' / weatherAddr / noRewrite），由子进程运行时读取
  return {
    ai: { base: 'http://127.0.0.1:0/ai', apiKey: 'test-key', model: 'deepseek-chat' },   // base 端口由子进程运行时替换
    pushToken: 'test-push-token',
    weatherAddr: opt.weatherAddr || '七宝',   // 「七宝」命中脚本内置 CN_FALLBACK，不走地理编码
    babyName: '小咕噜(测试)',
    birthDate: '2024-06-01',
    height: '80',
    weight: '10.5',
    kb: [
      { cat: '穿衣', text: '熊猫系带长袖长裤、蓝/黄背心厚睡袋（测试知识库条目）' },
      { cat: '户外/综合', text: '≤19km/h（≤4级，风小）→ 正常户外；20-38km/h（5-6级）→ 戴帽防风；≥39km/h（≥7级）→ 减少户外（测试条目）' }
    ]
  };
}
function aiTask(o) {
  return Object.assign({ id: 't1', name: '今日计划', mode: 'ai', type: 'plan', enabled: true, freq: 'daily', startDate: todayStr(), startTime: '00:01' }, o);
}
function textTask(t) {
  return { id: 'p1', name: '喝水提醒', mode: 'text', type: 'remind', enabled: true, freq: 'daily', startDate: t.startDate, startTime: t.startTime, content: '该喝水啦' };
}

/* ==================== 断言工具 ==================== */
function ok(cond, msg) { if (!cond) throw new Error('断言失败: ' + msg); }
function eq(a, b, msg) { if (a !== b) throw new Error(`断言失败: ${msg}（期望 ${JSON.stringify(b)}，实际 ${JSON.stringify(a)}）`); }

/* ==================== 子进程模式：跑一个用例的一次运行 ==================== */
async function runChild(caseName, stateFile) {
  let st = { store: {}, counters: zero(), mat: null, log: [], seeded: false };
  if (fs.existsSync(stateFile)) {
    try { st = Object.assign(st, JSON.parse(fs.readFileSync(stateFile, 'utf8'))); } catch { /* 忽略损坏的状态文件，重新播种 */ }
  }
  if (!st.mat) st.mat = makeMaterial();
  if (!st.seeded) { CASES[caseName].seed(st); st.seeded = true; }

  const counters = st.counters;
  const store = st.store;

  const server = http.createServer(async (req, res) => {
    const u = new URL(req.url, 'http://x');
    const send = (code, obj) => { res.writeHead(code, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(obj)); };
    try {
      if (req.method === 'GET' && u.pathname === '/rest/v1/family_config') {
        const ck = (u.searchParams.get('config_key') || '').replace(/^eq\./, '');
        const row = store[ck];
        counters.sbGets++;
        if (!row) return send(200, []);
        const sel = u.searchParams.get('select') || '';
        const out = {};
        if (sel.includes('encrypted_data')) out.encrypted_data = row.encrypted_data;
        if (sel.includes('iv')) out.iv = row.iv;
        return send(200, [out]);
      }
      if (req.method === 'POST' && u.pathname === '/rest/v1/family_config') {
        const row = JSON.parse(await readBody(req));
        store[row.config_key] = row;
        counters.sbUpserts++;
        return send(201, {});
      }
      if (req.method === 'GET' && u.pathname === '/rest/v1/family_records') { counters.sbGets++; return send(200, []); }
      if (req.method === 'POST' && u.pathname === '/ai') {
        counters.ai++;
        await readBody(req);
        if (st.cfg && st.cfg.ai === 'fail') return send(500, { error: 'mock AI failure' });
        return send(200, { choices: [{ message: { content: 'MOCK计划：晴天适宜户外（mock 生成内容）' } }] });
      }
      if (req.method === 'GET' && u.pathname === '/mock/om-geo') {
        counters.omGeo++;
        return send(200, { results: [{ name: '西湖区', latitude: 30.2594, longitude: 120.1305, country_code: 'CN', admin1: '浙江省' }] });
      }
      if (req.method === 'GET' && u.pathname === '/mock/om-forecast') {
        counters.omForecast++;
        if (st.cfg && st.cfg.om === 'limit') return send(200, { error: true, reason: 'Daily API request limit exceeded' });
        return send(200, { daily: { time: [st.today || todayStr()], weather_code: [1], temperature_2m_max: [25], temperature_2m_min: [18], precipitation_probability_max: [10], wind_speed_10m_max: [12] }, hourly: { time: ['00:00'], wind_speed_10m: [10], temperature_2m: [22] } });
      }
      if (req.method === 'GET' && u.pathname === '/mock/wttr') {
        counters.wttr++;
        return send(200, { weather: [{ date: st.today || todayStr(), maxtempC: '24', mintempC: '17', hourly: [{ windspeedKmph: '11' }] }] });
      }
      if (req.method === 'POST' && u.pathname === '/mock/pushplus') {
        counters.pushplus++;
        await readBody(req);
        return send(200, { code: 200 });
      }
      return send(404, { error: 'mock: unknown route ' + u.pathname });
    } catch (e) { return send(500, { error: String(e && e.message) }); }
  });
  await new Promise(r => server.listen(0, '127.0.0.1', r));
  const port = server.address().port;
  server.unref();   // 关键：mock 服务器不得拖住事件循环，保证主流程结束后进程自然退出

  const base = `http://127.0.0.1:${port}`;
  process.env.SB_URL = base;
  process.env.FAMILY_CODE = st.mat.code;
  process.env.TZ = 'Asia/Shanghai';
  delete process.env.DRY_RUN;
  // ctx.ai.base 端口替换（seed 时写的是占位端口）；noRewrite 用例（解密失败）跳过
  if (store['_sched_cloud'] && !(st.cfg && st.cfg.noRewrite)) {
    try {
      const key = deriveKey(st.mat.code, st.mat.salt);
      const cloud = JSON.parse(decrypt(key, store['_sched_cloud'].encrypted_data, store['_sched_cloud'].iv));
      if (cloud.ctx && cloud.ctx.ai) cloud.ctx.ai.base = base + '/ai';
      if (cloud.ctx) cloud.ctx.__modes = st.cfg || {};
      const enc = encrypt(key, JSON.stringify(cloud));
      store['_sched_cloud'] = { config_key: '_sched_cloud', encrypted_data: enc.data, iv: enc.iv };
    } catch { /* decrypt-fail 用例：数据本就解不开，保持原样 */ }
  }

  /* ---- 捕获脚本日志 ---- */
  const logs = [];
  const inspect = (await import('node:util')).inspect;
  for (const lvl of ['log', 'warn', 'error', 'info']) {
    const orig = console[lvl].bind(console);
    console[lvl] = (...a) => { logs.push(a.map(x => (typeof x === 'string' ? x : inspect(x))).join(' ')); orig(...a); };
  }

  /* ---- fetch 隔离补丁：非 mock 的外部请求直接抛错 ---- */
  const realFetch = globalThis.fetch.bind(globalThis);
  globalThis.fetch = async (input, init) => {
    const url = typeof input === 'string' ? input : (input && input.url) || String(input);
    if (url.startsWith(base)) return realFetch(input, init);
    if (url.includes('geocoding-api.open-meteo.com')) return realFetch(base + '/mock/om-geo' + (new URL(url).search || ''), init);
    if (url.includes('api.open-meteo.com')) return realFetch(base + '/mock/om-forecast' + (new URL(url).search || ''), init);
    if (url.includes('wttr.in')) return realFetch(base + '/mock/wttr', init);
    if (url.includes('pushplus.plus')) return realFetch(base + '/mock/pushplus', init);
    throw new Error('MOCK-ISOLATION: 未预期的外部请求: ' + url);
  };

  await import(pathToFileURL(SCRIPT).href);

  process.on('exit', () => {
    st.log = logs;
    try { fs.writeFileSync(stateFile, JSON.stringify(st)); } catch { /* ignore */ }
  });
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let b = '';
    req.on('data', c => { b += c; if (b.length > 5e6) reject(new Error('body too large')); });
    req.on('end', () => resolve(b));
    req.on('error', reject);
  });
}
function zero() { return { ai: 0, omGeo: 0, omForecast: 0, wttr: 0, pushplus: 0, sbGets: 0, sbUpserts: 0 }; }

/* ==================== 父进程模式：编排全部用例 ==================== */
function main() {
  const args = process.argv.slice(2);
  if (args[0] === '--case') {
    const stateFile = process.env.TEST_STATE;
    if (!stateFile) { console.error('内部用法缺少 TEST_STATE'); process.exit(2); }
    runChild(args[1], stateFile).catch(e => { console.error('[TEST] 子进程异常', e); process.exit(3); });
    return;
  }

  let only = null;
  const i = args.indexOf('--only');
  if (i >= 0) only = args[i + 1];
  const names = only ? [only] : Object.keys(CASES);
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'xgl-sched-test-'));
  let pass = 0, fail = 0;
  for (const name of names) {
    const stateFile = path.join(tmp, name + '.json');
    const runs = [];
    let prev = zero();
    try {
      for (let r = 0; r < CASES[name].runs; r++) {
        const cp = spawnSync(process.execPath, [fileURLToPath(import.meta.url), '--case', name], {
          env: Object.assign({}, process.env, { TEST_STATE: stateFile }),
          encoding: 'utf8', timeout: 90000
        });
        const st = JSON.parse(fs.readFileSync(stateFile, 'utf8'));
        const delta = {};
        for (const k of Object.keys(prev)) delta[k] = (st.counters[k] || 0) - prev[k];
        prev = Object.assign({}, st.counters);
        runs.push({ counters: st.counters, delta, log: st.log || [], exitCode: cp.status, stdout: cp.stdout || '' });
      }
      const st = JSON.parse(fs.readFileSync(stateFile, 'utf8'));
      CASES[name].assert(runs, st);
      console.log(`  PASS  ${name}  (ai=${runs.map(r => r.counters.ai).join('+')} om=${runs.map(r => r.counters.omForecast).join('+')} push=${runs.map(r => r.counters.pushplus).join('+')})`);
      pass++;
    } catch (e) {
      console.log(`  FAIL  ${name}\n        ${e.message}`);
      if (runs.length) console.log('        ---- 末次运行日志尾部 ----\n' + runs[runs.length - 1].log.slice(-12).map(l => '        ' + l).join('\n'));
      fail++;
    }
  }
  console.log(`\n结果: ${pass} 通过, ${fail} 失败 / 共 ${names.length}`);
  try { fs.rmSync(tmp, { recursive: true, force: true }); } catch { /* ignore */ }
  process.exit(fail ? 1 : 0);
}
main();
