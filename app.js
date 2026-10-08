
const BIRTH_DATE = new Date(2026, 3, 25);
const BABY_NAME = '小咕噜';
// 月龄（满 N 个整月，出生日为切换日：如 4/25 出生，5/25 = 1 月龄、5/24 = 0 月龄）
function getAgeMonths(ds) {
  const [y, m, d] = ds.split('-').map(Number);
  let months = (y - BIRTH_DATE.getFullYear()) * 12 + (m - 1 - BIRTH_DATE.getMonth());
  if (d < BIRTH_DATE.getDate()) months--;
  return Math.max(0, months);
}
// ---------- 月龄标准范围（0-24 月龄）：数据统一在 std-config.js 中配置 ----------
const _STD = window.STD_CONFIG || {};
// ---------- 应用默认配置（讯飞/推送/云端同步）：统一在 app-config.js 中配置 ----------
const _APP = window.APP_CONFIG || {};
const _DEFAULT_XFYUN = _APP.xfyun || null;
const _DEFAULT_PUSHTOPIC = _APP.pushplusTopic || 'xiaogulu_daily';
const _DEFAULT_PUSHTOKEN = _APP.pushplusToken || '';
const _DEFAULT_SUPABASE_URL = (_APP.supabase && _APP.supabase.url) || '';
const _DEFAULT_SUPABASE_KEY = (_APP.supabase && _APP.supabase.anonKey) || '';
const _DEFAULT_FAMILY_CODE = _APP.familyCode || '';
const MILK_STD = _STD.MILK_STD || [];
const MILK_COUNT_STD = _STD.MILK_COUNT_STD || [];
const SLEEP_STD = _STD.SLEEP_STD || [];
// 大便次数标准（0-36 月龄；仅 max 有参考意义，min 均为 0）；配置缺失时按默认规则生成兜底
const POOP_STD = (_STD.POOP_STD && _STD.POOP_STD.length) ? _STD.POOP_STD : Array.from({ length: 37 }, (_, m) => ({ month: m, min: 0, max: m <= 5 ? 7 : 3 }));
// ---------- WHO 生长参考曲线（0-24 月龄，男孩）：数据统一在 std-config.js 中配置 ----------
const WHO_HEIGHT = _STD.WHO_HEIGHT || [];
const WHO_WEIGHT = _STD.WHO_WEIGHT || [];
// 按日期取标准行（超龄取最后一行；空表返回全 null 安全行）
function getStdRow(table, ds) {
  if (!table || !table.length) return { month: 0, min: null, max: null, p3: null, p50: null, p75: null };
  const m = getAgeMonths(ds);
  return table.find(r => r.month === m) || table[table.length - 1];
}
// v3.5.114 浅色头像再次调整裁剪：原 (125,0,685,560) 右边界切掉了宝宝右侧手臂，
// 改为 (200,20,760,580) —— 画面整体左移，右臂完整入镜，圆形构图下脸部仍居中。
// 文件名再次更换（photo-day-v3.webp）以绕开 GitHub Pages CDN 600s 缓存。
// photo-day.webp / photo-day-v2.webp 同步更新为同一内容，作为旧版 app.js 的兜底。
const DEFAULT_PHOTO_DAY = 'assets/photo-day-v3.webp';
const DEFAULT_PHOTO_DATA = 'assets/photo-data.webp';

const CATEGORIES = [
  { id: 'eatSleep', name: '吃睡', icon: '🍼' },
  { id: 'health', name: '健康', icon: '💚' },
  { id: 'clean', name: '清洁', icon: '🧴' },
  { id: 'learn', name: '学习', icon: '📖' },
  { id: 'sport', name: '运动', icon: '🏃' },
];

const ACTIVITIES = [
  // 吃睡 - 睡眠带开始时间
  { id: 'milk', name: '喝奶（水量）', icon: '🍼', type: 'milk', category: 'eatSleep' },
  { id: 'sleep', name: '睡眠', icon: '😴', type: 'sleep', unit: '分钟', category: 'eatSleep' },
  { id: 'drinkWater', name: '喝水', icon: '💧', type: 'drinkWater', category: 'eatSleep' },
  { id: 'supplement', name: '营养补剂', icon: '💊', type: 'supplement', category: 'eatSleep' },
  { id: 'solidFood', name: '辅食', icon: '🥣', type: 'solidFood', category: 'eatSleep' },
  // 健康
  { id: 'poop', name: '大便', icon: '💩', type: 'poop', category: 'health' },
  { id: 'airButt', name: '晾屁股', icon: '🍑', type: 'airButt', category: 'health' },
  { id: 'vaccine', name: '疫苗接种', icon: '💉', type: 'vaccine', category: 'health' },
  { id: 'temperature', name: '测体温', icon: '🌡️', type: 'temperature', category: 'health' },
  // 清洁
  { id: 'bath', name: '洗澡', icon: '🛀', type: 'bath', category: 'clean' },
  { id: 'wash', name: '洗手洗脸', icon: '🧼', type: 'simple', category: 'clean' },
  { id: 'cleanNose', name: '清理鼻涕', icon: '🤧', type: 'simple', category: 'clean' },
  { id: 'cutNails', name: '剪指甲', icon: '✂️', type: 'note', category: 'clean' },
  // 学习
  { id: 'listenStory', name: '听故事', icon: '🎧', type: 'listenStory', category: 'learn' },
  { id: 'readBook', name: '读书', icon: '📖', type: 'simple', category: 'learn' },
  { id: 'listenMusic', name: '听歌', icon: '🎵', type: 'simple', category: 'learn' },
  { id: 'learnLanguage', name: '学语言', icon: '🗣️', type: 'note', category: 'learn' },
  { id: 'learnLogic', name: '学逻辑', icon: '🧩', type: 'note', category: 'learn' },
  // 运动
  { id: 'outdoor', name: '户外活动', icon: '☀️', type: 'duration', unit: '分钟', category: 'sport' },
  { id: 'grossMotor', name: '大运动', icon: '🤸', type: 'grossMotor', category: 'sport' },
  { id: 'fineMotor', name: '精细动作', icon: '✋', type: 'fineMotor', category: 'sport' },
];

const DEFAULT_HIDDEN = ['vaccine'];
const VACCINE_OPTIONS = ['乙肝', '五联', '轮状病毒', '肺炎', '流脑', '麻塞风', '水痘', '甲肝', '手足口'];
const POOP_STATUS = [
  { value: '正常', label: '正常', icon: '<svg class="poop-svg" viewBox="0 0 24 24"><path d="M5 20c0-1 .5-2 2-2.2C6 16 6.5 14.5 8 14.3c-.5-1.5 0-2.8 1.8-3 .2-1.6 1.2-2.6 2.8-2.4 1-.1 1.8.4 2.2 1.3 1.6-.2 2.8.6 3 2 .2 1.2-.4 2-1.5 2.2 1 .2 1.5 1 1.3 2-.2.8-.8 1.3-1.8 1.3H7c-1.2 0-2-.3-2-1.7z"/></svg>', cls: 'poop-normal' },
  { value: '拉肚子', label: '拉肚子', icon: '<svg class="poop-svg" viewBox="0 0 24 24"><path d="M12 2.7C12 2.7 5.5 10.5 5.5 14.5c0 4.1 2.9 6.8 6.5 6.8s6.5-2.7 6.5-6.8C18.5 10.5 12 2.7 12 2.7z"/></svg>', cls: 'poop-watery' },
  { value: '青屎', label: '青屎', icon: '<svg class="poop-svg" viewBox="0 0 24 24"><path d="M5 20c0-1 .5-2 2-2.2C6 16 6.5 14.5 8 14.3c-.5-1.5 0-2.8 1.8-3 .2-1.6 1.2-2.6 2.8-2.4 1-.1 1.8.4 2.2 1.3 1.6-.2 2.8.6 3 2 .2 1.2-.4 2-1.5 2.2 1 .2 1.5 1 1.3 2-.2.8-.8 1.3-1.8 1.3H7c-1.2 0-2-.3-2-1.7z"/></svg>', cls: 'poop-green' },
  { value: '便血', label: '便血', icon: '<svg class="poop-svg" viewBox="0 0 24 24"><path d="M12 2.7C12 2.7 5.5 10.5 5.5 14.5c0 4.1 2.9 6.8 6.5 6.8s6.5-2.7 6.5-6.8C18.5 10.5 12 2.7 12 2.7z"/></svg>', cls: 'poop-blood' },
];

const DEFAULT_GROSS_MOTOR = ['会抬头', '会翻身', '会爬', '会坐', '会站', '会走路', '会跑步'];
const DEFAULT_FINE_MOTOR = ['抓握', '摇头', '点头', '挥手', '放东西', '捏', '戳'];
// v3.5.74 辅食食物默认清单（用户可在管理弹窗增删，长期有效）
const DEFAULT_SOLID_FOODS = ['高铁米粉','不含铁米粉','苹果','南瓜','山药','小米','红薯','玉米','紫薯','猪肉','牛肉','羊肉','鱼','鸡肉','虾','鸡蛋','猪肝','胡萝卜','梨','豆腐','花生','枣','黄豆','绿豆','红豆','油菜','白菜','西兰花','西红柿','茄子','牛油果','芒果','猕猴桃','莴苣','黄瓜','核桃','冬瓜','香菇','香蕉','西瓜'];

let hiddenActivities = [];
// v3.5.115 首页筛选：默认全部分类选中（=显示全部活动）；actSearchQuery 为活动名搜索关键字
let selectedCategories = new Set(CATEGORIES.map(c => c.id));
let actSearchQuery = '';
// v3.5.127 添加弹窗：分类改为多选（默认全选=显示全部活动），与首页分类一致
let addModalCats = new Set(CATEGORIES.map(c => c.id));
let addSelectedSet = new Set(); // 跨分类保留已勾选活动
let grossMotorOptions = [];
let fineMotorOptions = [];
let solidFoodOptions = [];   // v3.5.74 辅食食物清单（可在管理弹窗增删）
// v3.5.69 自定义选项永久保存：本地保存时间戳 + 云端并集重试，避免被回滚覆盖
const CUSTOM_OPT_KEYS = ['grossMotorOptions', 'fineMotorOptions', 'solidFoodOptions'];
const CUSTOM_OPT_DEFS = { grossMotorOptions: DEFAULT_GROSS_MOTOR, fineMotorOptions: DEFAULT_FINE_MOTOR, solidFoodOptions: DEFAULT_SOLID_FOODS };
// 每个选项键对应的「用户已删除」墓碑键（防止出厂项被自动补回）
const CUSTOM_OPT_DEL_KEYS = { grossMotorOptions: 'grossMotorDeleted', fineMotorOptions: 'fineMotorDeleted', solidFoodOptions: 'solidFoodDeleted' };
let _optRetryTimer = null, _optRetryLeft = 0;

function loadCustomOptions() {
  try { grossMotorOptions = JSON.parse(localStorage.getItem('grossMotorOptions') || '[]'); } catch { grossMotorOptions = []; }
  if (!Array.isArray(grossMotorOptions)) grossMotorOptions = [];
  // v3.5.69 不再用「空数组 → 回落默认值」，否则用户删光全部选项后刷新会复活；
  // 改为只补上还没出现过的出厂项，用户自行删除的（有删除记录时）保持删除
  const _gDel = safeParseArr(localStorage.getItem('grossMotorDeleted'));
  DEFAULT_GROSS_MOTOR.forEach(o => { if (!grossMotorOptions.includes(o) && !_gDel.includes(o)) grossMotorOptions.push(o); });
  try { fineMotorOptions = JSON.parse(localStorage.getItem('fineMotorOptions') || '[]'); } catch { fineMotorOptions = []; }
  if (!Array.isArray(fineMotorOptions)) fineMotorOptions = [];
  const _fDel = safeParseArr(localStorage.getItem('fineMotorDeleted'));
  DEFAULT_FINE_MOTOR.forEach(o => { if (!fineMotorOptions.includes(o) && !_fDel.includes(o)) fineMotorOptions.push(o); });
  try { solidFoodOptions = JSON.parse(localStorage.getItem('solidFoodOptions') || '[]'); } catch { solidFoodOptions = []; }
  if (!Array.isArray(solidFoodOptions)) solidFoodOptions = [];
  const _sDel = safeParseArr(localStorage.getItem('solidFoodDeleted'));
  DEFAULT_SOLID_FOODS.forEach(o => { if (!solidFoodOptions.includes(o) && !_sDel.includes(o)) solidFoodOptions.push(o); });
}
function getSolidFoodOptions() {
  if (!Array.isArray(solidFoodOptions) || solidFoodOptions.length === 0) loadCustomOptions();
  return (Array.isArray(solidFoodOptions) && solidFoodOptions.length) ? solidFoodOptions : DEFAULT_SOLID_FOODS;
}
function safeParseArr(s) { try { const a = JSON.parse(s || '[]'); return Array.isArray(a) ? a : []; } catch { return []; } }
function saveCustomOptions() {
  const now = Date.now();
  localStorage.setItem('grossMotorOptions', JSON.stringify(grossMotorOptions));
  localStorage.setItem('fineMotorOptions', JSON.stringify(fineMotorOptions));
  localStorage.setItem('solidFoodOptions', JSON.stringify(solidFoodOptions));
  // 记录本地改动时间，供同步下行判断"该不该覆盖本地"（含本地保存时间，不依赖墙钟一致性即可保护本机改动）
  CUSTOM_OPT_KEYS.forEach(k => localStorage.setItem(`cfgts_${k}`, String(now)));
  syncUpload('config');
  scheduleOptionsRetry();   // 静默上传可能失败（离线/网络抖动），延后重试确保永久生效
}
function scheduleOptionsRetry() {
  _optRetryLeft = 3;
  clearTimeout(_optRetryTimer);
  const tick = async () => {
    if (_optRetryLeft <= 0) return;
    _optRetryLeft--;
    try {
      if (isSyncReady() && navigator.onLine) { await syncUpload('config'); _optRetryLeft = 0; return; }
    } catch (e) {}
    _optRetryTimer = setTimeout(tick, 8000);
  };
  _optRetryTimer = setTimeout(tick, 5000);
}

/* ==================== v3.5.20 白天/夜间皮肤自动切换 ==================== */
// 规则：6:00-18:00（含 6:00 不含 18:00）为白天皮肤；其余时间为夜间皮肤（与历史版本渲染完全一致，零改动）
// 变化范围：仅配色 + 标题图标（★→☀）。布局/字号/其他图标/按钮位置一律不动。
// v3.5.21 手动切换：右上角 ☀浅色/★深色 按钮（localStorage theme_manual）；
//   手动选择即时生效；跨越 6:00/18:00 时段边界时自动清除手动偏好，恢复自动切换。
let _themeLastAutoDay = null;
function isDaytimeNow() {
  const h = new Date().getHours();
  return h >= 6 && h < 18;
}
function applyTheme() {
  const autoDay = isDaytimeNow();
  // 跨越时段边界（上次校准与本次自动判定不同）：手动偏好让位于自动切换
  if (_themeLastAutoDay !== null && _themeLastAutoDay !== autoDay) {
    localStorage.removeItem('theme_manual');
  }
  // 首次加载时：若当前时段与残留的手动偏好矛盾，说明偏好已过期，立即清除
  // （例如 18:00 后刷新页面，_themeLastAutoDay 尚未记录，但 theme_manual 残留 'day'）
  if (_themeLastAutoDay === null) {
    const m = localStorage.getItem('theme_manual');
    if ((m === 'day' && !autoDay) || (m === 'night' && autoDay)) {
      localStorage.removeItem('theme_manual');
    }
  }
  _themeLastAutoDay = autoDay;
  const manual = localStorage.getItem('theme_manual');
  const day = manual ? manual === 'day' : autoDay;
  document.body.classList.toggle('theme-day', day);
  // 标题图标：夜间显示 ★、白天显示户外活动太阳（由 CSS body.theme-day 控制显隐，无需 JS 切换）
  // 浏览器状态栏 / PWA 标题栏颜色跟随主题
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute('content', day ? '#f5f8fd' : '#0a0f1e');
  // 手动切换按钮高亮同步
  const bd = document.getElementById('themeBtnDay'), bn = document.getElementById('themeBtnNight');
  if (bd) bd.classList.toggle('active', day);
  if (bn) bn.classList.toggle('active', !day);
  // 白天/夜间切换时，若处于默认头像状态则同步更换
  if (!localStorage.getItem('babyPhoto')) loadPhoto();
}
function setManualTheme(t) {
  localStorage.setItem('theme_manual', t);
  applyTheme();
}
function setupTheme() {
  applyTheme();
  // 每分钟校准：跨 6:00 / 18:00 时无需刷新页面即可自动切换（并清除过期的手动偏好）
  setInterval(applyTheme, 60000);
}

function init() {
  setupTheme();
  loadCustomOptions();
  loadHiddenActivities();
  // ===== 升级兼容：旧版(v3.5.39及之前)没在 pushSuccessHistory 记录失败推送 =====
  // 加载 v3.5.40 时若 pushSuccessHistory 为空但有 pushLastSig → 补一条到历史,
  // 防止旧版失败推送的签名被新版本当作"未推送过"再次推送
  try {
    const histRaw = localStorage.getItem('pushSuccessHistory');
    const hist = histRaw ? JSON.parse(histRaw) : [];
    if ((!Array.isArray(hist) || hist.length === 0) && localStorage.getItem('pushLastSig')) {
      localStorage.setItem('pushSuccessHistory', JSON.stringify([{ ts: Date.now(), sig: localStorage.getItem('pushLastSig') }]));
      console.log('[推送] 升级兼容: 用旧版 pushLastSig 初始化历史');
    }
  } catch {}
  checkDateReset();
  renderCategoryBar();
  renderCards();
  updateAgeInfo();
  loadHeight(); loadWeight(); loadPhoto();
  seedBodyHistory();
  updateAddButtonVisibility();
  try { updateOverview(); } catch(e) { console.error('updateOverview error:', e); }
  setupMidnightReset();
  setInterval(() => { try { updateOverview(/*skipPush=*/true); } catch(e) { console.error(e); } }, 60000);
  setupPWA();
  initSync();
  aiInit();
  loadMemoCloud().catch(() => {});   // v3.5.115 备忘录启动即从家庭云恢复（本地优先合并）
  bindVoiceTouch();
  bindVoiceButton('kbVoiceBtn', 'kb');     // v3.5.127 知识库添加区语音按钮
  bindVoiceButton('memoVoiceBtn', 'memo'); // v3.5.127 备忘录添加区语音按钮
  bindFastTaps();
  initModalFullscreen();   // v3.5.125 备忘录/分析/历史/管理弹窗注入「全屏」按钮
  // 自动清理测试残留数据（仅一次， harmless）
  cleanupTestData();
  // 页面加载后检查喝奶提醒（已到时间则 toast，仅提醒一次）
  setTimeout(checkMilkReminder, 1200);
}

// 清理本地测试残留数据（开发/测试期间写入的脏数据）
function cleanupTestData() {
  const testKws = ['同步bug测试', '双设备同步验证', '本地新增', '本地更新', '不被覆盖', '正常新增'];
  const recs = getTodayRecords();
  const clean = recs.filter(r => !testKws.some(kw => (r.note || '').includes(kw)));
  if (clean.length < recs.length) {
    persistRecords(clean);
    syncUpload('records', getTodayDateStr());
    renderCards(); updateOverview();
    console.log('已清理 ' + (recs.length - clean.length) + ' 条测试残留记录');
  }
}

function updateAgeInfo() {
  const now = effectiveNow(); // 与业务日切换对齐（凌晨0-1点仍算前一天，月龄在1:00才+1）
  const birth = BIRTH_DATE;
  let months = (now.getFullYear() - birth.getFullYear()) * 12 + (now.getMonth() - birth.getMonth());
  if (now.getDate() < birth.getDate()) months--;
  if (months < 0) months = 0;
  const days = Math.floor((now - birth) / 86400000) + 1;
  document.getElementById('ageInfo').innerHTML = `<span class="highlight">${months}</span>月龄，出生第<span class="highlight">${days}</span>天`;
}

// v3.5.76 身高体重保存加固：写盘即打时间戳(cfgts_*)，防止云端拉取用旧值覆盖刚输入的数据
function bumpConfigTs(key) { try { localStorage.setItem('cfgts_' + key, String(Date.now())); } catch (e) {} }
let _bodySaveTimer = null;
// 输入过程中防抖保存：即使不触发 blur/change（如切后台），也能落盘且进曲线
function onBodyInput(field) {
  if (_bodySaveTimer) clearTimeout(_bodySaveTimer);
  _bodySaveTimer = setTimeout(function () { _bodySaveTimer = null; if (field === 'w') saveWeight(); else saveHeight(); }, 800);
}
// 页面隐藏/卸载时强制落盘，避免"输入后直接切走"丢数据
function flushBodySaves() {
  if (_bodySaveTimer) { clearTimeout(_bodySaveTimer); _bodySaveTimer = null; }
  try { saveHeight(); } catch (e) {}
  try { saveWeight(); } catch (e) {}
}
function loadHeight() { const el = document.getElementById('heightInput'); if (!el) return; if (document.activeElement === el) return; const h = localStorage.getItem('babyHeight'); if (h != null) el.value = h; }
function saveHeight() {
  const el = document.getElementById('heightInput'); if (!el) return;
  const raw = String(el.value == null ? '' : el.value).trim();
  const prev = localStorage.getItem('babyHeight') || '';
  if (raw !== prev) { localStorage.setItem('babyHeight', raw); bumpConfigTs('babyHeight'); }
  const v = parseFloat(raw);
  if (v > 0) recordBodyMeasurement('h', v);          // 幂等：无变化时不重复写盘/上传
  else if (raw !== prev) syncUpload('config');
}
function loadWeight() { const el = document.getElementById('weightInput'); if (!el) return; if (document.activeElement === el) return; const w = localStorage.getItem('babyWeight'); if (w != null) el.value = w; }
function saveWeight() {
  const el = document.getElementById('weightInput'); if (!el) return;
  const raw = String(el.value == null ? '' : el.value).trim();
  const prev = localStorage.getItem('babyWeight') || '';
  if (raw !== prev) { localStorage.setItem('babyWeight', raw); bumpConfigTs('babyWeight'); }
  const v = parseFloat(raw);
  if (v > 0) recordBodyMeasurement('w', v);          // 幂等：无变化时不重复写盘/上传
  else if (raw !== prev) syncUpload('config');
}
document.addEventListener('visibilitychange', function () { if (document.visibilityState === 'hidden') flushBodySaves(); });
window.addEventListener('pagehide', flushBodySaves);
window.addEventListener('beforeunload', flushBodySaves);

// 业务"今天"的判定：每日重置时间为凌晨 1:00（0:00-0:59 期间仍算昨天）
function effectiveNow() {
  const d = new Date();
  if (d.getHours() === 0) return new Date(d.getTime() - 3600000); // 0点档视为前一天 23:xx
  return d;
}
function getTodayKey() {
  const d = effectiveNow();
  return `records_${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}
function getDateKey(ds) { return `records_${ds}`; }
function checkDateReset(opts) {
  const t = effectiveNow();
  const today = `${t.getFullYear()}-${String(t.getMonth()+1).padStart(2,'0')}-${String(t.getDate()).padStart(2,'0')}`;
  const last = localStorage.getItem('lastActiveDate');
  localStorage.setItem('lastActiveDate', today);
  // 跨日（last 存在且与今天不同）才清推送集合；仅是 init 启动记录 today 不清
  if (opts && opts.force) { localStorage.removeItem('pushAchSet'); localStorage.removeItem('pushAchSig'); localStorage.removeItem('pushLastSig'); localStorage.removeItem('pushAchTs'); /* pushSuccessHistory保留(24h窗口自动过期) */ return; }
  if (last && last !== today) { localStorage.removeItem('pushAchSet'); localStorage.removeItem('pushAchSig'); localStorage.removeItem('pushLastSig'); localStorage.removeItem('pushAchTs'); /* pushSuccessHistory保留(24h窗口自动过期) */ }
}
function setupMidnightReset() {
  // 定时到下一个凌晨 1:00 触发日切重置（当日重置时间为 1:00）
  const now = new Date();
  let next = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 1, 0, 0);
  if (next <= now) next = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 1, 0, 0);
  setTimeout(() => { checkDateReset({force:true}); renderCards(); updateAgeInfo(); updateOverview(); setupMidnightReset(); }, next - now);
}

function handlePhotoUpload(e) {
  const f = e.target.files[0]; if (!f) return;
  // 大小限制：100KB，确保3年存储空间
  if (f.size > 100 * 1024) { showToast('照片不能超过100KB，请先压缩'); e.target.value = ''; return; }
  const r = new FileReader();
  r.onload = ev => { localStorage.setItem('babyPhoto', ev.target.result); loadPhoto(); showToast('照片已保存'); };
  r.readAsDataURL(f);
}
function loadPhoto() {
  const img = document.getElementById('babyPhoto');
  if (!img) return;                       // 无照片元素（如 AI 入口内）则跳过
  const ph = document.getElementById('photoPlaceholder');
  const day = document.body.classList.contains('theme-day');
  // v3.5.113 头像为固定照片：浅色用 photo-day-v2.webp（2026-10-07 换新照片），深色用 photo-data.webp，随主题自动切换
  const du = day ? DEFAULT_PHOTO_DAY : DEFAULT_PHOTO_DATA;
  if (du) {
    if (img.getAttribute('src') !== du) img.src = du;
    img.classList.remove('hidden');
    if (ph) ph.classList.add('hidden');
  } else if (ph) { img.classList.add('hidden'); ph.classList.remove('hidden'); }
}

function loadHiddenActivities() {
  try { const s = JSON.parse(localStorage.getItem('hiddenActivities')); hiddenActivities = s || [...DEFAULT_HIDDEN]; }
  catch { hiddenActivities = [...DEFAULT_HIDDEN]; }
}
function saveHiddenActivities() { localStorage.setItem('hiddenActivities', JSON.stringify(hiddenActivities)); syncUpload('config'); }

function getTodayRecords() {
  try { return sanitizeRecords(JSON.parse(localStorage.getItem(getTodayKey()) || '[]')); } catch { return []; }
}
// 读取任意日期的记录（历史页编辑/添加/删除用）
// v3.5.79 统一走 sanitizeRecords：脏记录（无 type 或无时间信息）不再进入界面与统计
function getRecordsByDate(ds) {
  try {
    return sanitizeRecords(JSON.parse(localStorage.getItem(getDateKey(ds)) || '[]'));
  } catch { return []; }
}
// 统一的数据落地后处理：刷新历史列表 / 今日卡片 / 分析图表，并同步云端
function afterRecordChange(ds) {
  const isToday = (ds === getTodayDateStr());
  try { syncUpload('records', ds); } catch (e) { console.warn('[同步] 上传失败:', e); }
  // 历史弹窗若打开 → 刷新列表（编辑的正是该日期）
  const histModal = document.getElementById('historyModal');
  if (histModal && histModal.classList.contains('show')) loadHistory();
  if (isToday) { try { renderCards(); } catch (e) {} try { updateOverview(); } catch (e) {} }
  // 分析弹窗若打开 → 重绘图表（历史数据变化会影响近15天柱状图）
  const anaModal = document.getElementById('analysisModal');
  if (anaModal && anaModal.classList.contains('show')) { try { openAnalysis(); } catch (e) {} }
}
// 统一持久化今日记录：时间戳单独存 records_<日期>_ts，供云端同步做"本地 vs 云端"冲突判断
// 注意：时间戳不能塞进 records 数组（JSON.stringify 不会序列化数组的非索引属性）
// ds 省略时写入今天；传入日期则写入该历史日期（用于历史页编辑/添加）
function persistRecords(records, ds) {
  const ts = Date.now();
  const key = ds ? getDateKey(ds) : getTodayKey();
  const json = JSON.stringify(records);
  localStorage.setItem(key, json);
  localStorage.setItem(key + '_ts', String(ts));
  // 自动本地备份（保留最近 10 份，防止同步覆盖或意外丢失）
  try {
    const backups = JSON.parse(localStorage.getItem('record_backups') || '[]');
    backups.push({ date: key, ts: ts, data: records });
    // 只保留最近 10 份备份 + 每日期保留最新一份
    const byDate = {};
    for (const b of backups) { if (!byDate[b.date] || byDate[b.date].ts < b.ts) byDate[b.date] = b; }
    const kept = Object.values(byDate).sort((a, b) => b.ts - a.ts).slice(0, 10);
    localStorage.setItem('record_backups', JSON.stringify(kept));
  } catch (e) {}
  return records;
}
// 读取某日记录的本地修改时间戳（无则为 0）
function getLocalRecordTs(ds) {
  const v = localStorage.getItem('records_' + ds + '_ts');
  return v ? parseInt(v) || 0 : 0;
}

/* ==================== 合并式同步（v3.5.55） ====================
 * 旧逻辑是「谁的时间戳新谁赢」的单向覆盖，导致：
 *   ① 家人设备本地时间戳更晚时 → 不拉取 → 看不到别人的新记录
 *   ② 更糟的是会把自己旧数据反向推上云端 → 覆盖丢失别人的新记录
 * 新逻辑：记录级合并 = 并集 + 删除墓碑 + 同键取 updatedAt 较新者，双向收敛。
 * 只会保留更多数据，不会丢数据。
 * ============================================================ */
// 记录合法性校验：必须带 type，且必须带时间信息（recTime 或 timestamp）。
// 用途：过滤历史遗留或误注入的脏记录（例如 {type:'milk',milkAmount:150} 这种既无 recTime
// 也无 timestamp 的测试数据），避免它们出现在界面（被渲染成 undefined）、计入统计，
// 或被同步逻辑回传云端。真实记录在保存时都带 timestamp，因此该判据不会误伤正常数据。
function isValidRecord(r) {
  return !!(r && typeof r === 'object' && r.type && (r.recTime || r.timestamp));
}
function sanitizeRecords(arr) {
  return Array.isArray(arr) ? arr.filter(isValidRecord) : [];
}
// 记录唯一键：type|timestamp
function recKey(r) {
  if (!r || typeof r !== 'object') return '';
  return String(r.type || '') + '|' + String(r.timestamp || '');
}
// 墓碑（已删除记录的 key 集合）—— 防止合并时被"复活"
function getTombstones(ds) {
  try {
    const a = JSON.parse(localStorage.getItem('records_' + ds + '_del') || '[]');
    return Array.isArray(a) ? new Set(a) : new Set();
  } catch { return new Set(); }
}
function addTombstones(ds, keys) {
  const s = getTombstones(ds);
  (keys || []).forEach(k => { if (k && k !== '|') s.add(k); });
  const arr = [...s].slice(-300); // 上限保护，避免无限增长
  try { localStorage.setItem('records_' + ds + '_del', JSON.stringify(arr)); } catch {}
  return new Set(arr);
}
function tombstoneKey(ds) { return 'records_' + ds + '_del'; }
// 合并两条记录列表：并集，剔除墓碑，同键取 updatedAt 较新者
function mergeRecordLists(cloudArr, localArr, tombs) {
  const map = new Map();
  const put = (r) => {
    if (!r || typeof r !== 'object') return;
    const k = recKey(r);
    if (!k || k === '|') return;
    if (tombs && tombs.has(k)) return;              // 已删除 → 不复活
    const prev = map.get(k);
    if (!prev) { map.set(k, r); return; }
    const a = Number(prev.updatedAt) || 0;
    const b = Number(r.updatedAt) || 0;
    if (b >= a) map.set(k, r);                      // 取较新版本
  };
  (Array.isArray(cloudArr) ? cloudArr : []).forEach(put);
  (Array.isArray(localArr) ? localArr : []).forEach(put);
  return [...map.values()];
}

function getMilkInterval() {
  const h = new Date().getHours();
  return (h >= 5 && h < 19) ? 3 : 5;
}

function getSupplementSuggestion() {
  const allKeys = [];
  for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (k.startsWith('records_')) allKeys.push(k); }
  allKeys.sort().reverse();
  for (const k of allKeys) {
    let recs = []; try { recs = JSON.parse(localStorage.getItem(k) || '[]'); } catch { continue; }
    if (!Array.isArray(recs)) continue; // 防止脏数据导致 "recs is not iterable"
    for (const r of recs) {
      if (r.type === 'supplement' && r.supplementTypes) {
        if (r.supplementTypes.includes('AD') && !r.supplementTypes.includes('D3')) return 'D3';
        if (r.supplementTypes.includes('D3') && !r.supplementTypes.includes('AD')) return 'AD';
        return 'AD';
      }
    }
  }
  return 'AD';
}

/* ==================== 成就计算与订阅推送(PushPlus) ==================== */
function computeAchievements(records) {
  const achievements = new Set();
  records.forEach(r => {
    if (r.note && r.note.trim()) achievements.add(r.note.trim());
  });
  return [...achievements];
}
function isSubscribeMode() { return true; } // 订阅推送始终开启（只要有配置就自动推送）
function savePushTopic() {
  const inp = document.getElementById('pushTopicInput');
  if (!inp) return;
  const topic = inp.value.trim();
  // 掩码/空值 → 恢复默认群组编码
  const untouched = (!topic) || (topic === XF_MASK);
  if (untouched) { localStorage.removeItem('pushplus_topic'); showToast('已恢复默认群组编码'); loadPushTopicUI(); return; }
  localStorage.setItem('pushplus_topic', topic);
  localStorage.removeItem('pushAchSig');
  localStorage.removeItem('pushAchSet');
  localStorage.removeItem('pushLastSig');   // 注意：不清除 pushSuccessHistory / pushLastAchievements（历史兜底防线）
  localStorage.removeItem('pushAchTs');
  loadPushTopicUI();
  showToast('群组编码已保存');
}
// ---------- 推送：创建者 token 加密显示与保存（样式同讯飞） ----------
function savePushToken() {
  const inp = document.getElementById('pushTokenInput');
  if (!inp) return;
  const val = inp.value.trim();
  const untouched = (!val) || (val === XF_MASK);
  if (untouched) { localStorage.removeItem('pushplus_token'); showToast('已恢复默认推送 token'); loadPushTokenUI(); return; }
  if (val.length < 8) { showToast('token 长度过短，请检查'); return; }
  localStorage.setItem('pushplus_token', val);
  localStorage.removeItem('pushAchTs');
  loadPushTokenUI();
  showToast('推送 token 已保存');
}
function loadPushTokenUI() {
  const el = document.getElementById('pushTokenInput');
  const see = document.getElementById('pushTokenSee');
  if (!el) return;
  if (see) see.checked = false;
  el.type = 'password';
  const hasCustom = !!localStorage.getItem('pushplus_token');
  const hasDefault = !!_DEFAULT_PUSHTOKEN;
  el.value = (hasCustom || hasDefault) ? XF_MASK : '';
  bindPushTokenMaskEvents();
}
function togglePushTokenSee() {
  const show = document.getElementById('pushTokenSee').checked;
  const el = document.getElementById('pushTokenInput');
  el.type = show ? 'text' : 'password';
}
function bindPushTokenMaskEvents() {
  const el = document.getElementById('pushTokenInput');
  if (!el || el._maskBound) return; el._maskBound = true;
  el.addEventListener('focus', function() { if (this.value === XF_MASK) this.value = ''; });
  el.addEventListener('blur', function() { if (!this.value) loadPushTokenUI(); });
}
// ---------- 推送：群组编码加密显示与保存（样式同 token） ----------
function loadPushTopicUI() {
  const el = document.getElementById('pushTopicInput');
  const see = document.getElementById('pushTopicSee');
  if (!el) return;
  if (see) see.checked = false;
  el.type = 'password';
  const hasCustom = !!localStorage.getItem('pushplus_topic');
  const hasDefault = !!_DEFAULT_PUSHTOPIC;
  el.value = (hasCustom || hasDefault) ? XF_MASK : '';
  bindPushTopicMaskEvents();
}
function togglePushTopicSee() {
  const show = document.getElementById('pushTopicSee').checked;
  const el = document.getElementById('pushTopicInput');
  el.type = show ? 'text' : 'password';
}
function bindPushTopicMaskEvents() {
  const el = document.getElementById('pushTopicInput');
  if (!el || el._maskBound) return; el._maskBound = true;
  el.addEventListener('focus', function() { if (this.value === XF_MASK) this.value = ''; });
  el.addEventListener('blur', function() { if (!this.value) loadPushTopicUI(); });
}
async function notifyPushplus(title, content) {
  // token 优先从 localStorage 读取（用户自定义），否则使用应用默认值
  const token = localStorage.getItem('pushplus_token') || _DEFAULT_PUSHTOKEN;
  if (!token) { console.warn('PushPlus Token未配置，无法推送'); return false; }
  try {
    const payload = { token: token, title: title, content: content, template: 'html' };
    const topic = localStorage.getItem('pushplus_topic') || _DEFAULT_PUSHTOPIC;
    payload.topic = topic; // 默认按群组编码一对多推送
    const res = await fetch('https://www.pushplus.plus/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    return !!(data && data.code === 200);
  } catch (e) { console.warn('PushPlus推送失败:', e); return false; }
}
// ========== 推送：基于成就内容变化的智能推送 ==========
// 核心原则：成就集合变了才推，内容相同不推
// 定时器(updateOverview(/*skipPush*/true)) 不触发推送
//
// 架构：脏位标记 + 延迟合并调度
//   多个 updateOverview() 调用（添加/编辑/删除/设置变更等）只设置 _pushDirty 标记，
//   由 3 秒后的统一调度器执行一次 checkAchievementPush。
//   这从根本上消除"一次用户操作触发 N 次推送检查"的并发窗口。
//
// 五层防护（全部基于 localStorage，跨 PWA 实例/后台恢复/设置变更安全）：
//   Layer1: pushLastSig       — 签名去重（快速路径，内容完全相同→不推）
//   Layer2: pushSending       — 发送中锁（localStorage，60s超时自愈，防并发）
//   Layer3: pushSuccessHistory[] — 推送历史（最近50条{ts,sig}，永不被动清除，
//                                  即使Layer1的签名被savePushTopic等意外清除，
//                                  Layer3仍能识别"今天已推过此内容"）
const PUSH_HIST_KEY = 'pushSuccessHistory'; // 历史记录key（不被设置变更清除）
const PUSH_SENDING_KEY = 'pushSending';     // 发送中标记
const PUSH_SIG_KEY = 'pushLastSig';         // 上次推送签名
const PUSH_ACH_KEY = 'pushLastAchievements'; // 上次推送的完整成就列表（用于计算新增项）
const PUSH_MAX_HIST = 100;                  // 历史最多保留条数
const PUSH_SENDING_TIMEOUT = 60000;         // 发送中锁超时 60s
const PUSH_NEW_SIG_KEY = 'pushLastNewSig';  // 上次推送的"新增成就"签名（同内容拦截用，不被设置变更清除）
const PUSH_TS_KEY = 'pushLastPushTs';       // 上次推送时间戳
const PUSH_SAME_WINDOW = 2 * 60 * 1000;     // 同一批新增成就 2分钟内不重复推(辅助层)
const PUSH_SCHED_DELAY = 3000;              // 脏位调度延迟:用户操作后等3秒再统一检查推送(合并多次调用)
const PUSH_SENDER_OFF_KEY = 'pushSenderDisabled'; // '1' = 本设备不负责推送（多设备去重开关）
const PUSH_LEADER_KEY = 'pushLeader';       // 同浏览器多标签页:推送领导者 {id,ts}
const PUSH_LEADER_TTL = 15000;              // 领导者心跳有效期 15s（超时其他标签页可抢占）
const PUSH_LEADER_HEARTBEAT = 5000;         // 心跳间隔 5s
const PUSH_LEADER_MAX_RETRY = 12;           // 非领导者最多重试 12 次(约 60s)后再放弃，避免漏推
const PUSH_DEDUP_KEY = '_pushdedup';        // family_config 中的跨设备推送去重键(云端共享)
const PUSH_DEDUP_MAX_AGE = 12 * 60 * 60 * 1000; // 同日同内容去重有效期 12h

// ---- 跨设备云端去重（走已配置的 Supabase 家庭同步通道）----
// 多台设备共用同一群组编码时，每台设备都会各推一遍同样内容。
// 利用 family_config 这张各设备共享的 KV 表记录"今天已经推过的内容指纹"，
// 实现跨设备自动去重 —— 用户无需手动关闭任何设备的推送开关。
// 注意：只存内容指纹(哈希)与时间戳，不存明文，不泄露宝宝记录内容。
function _pushHash(s) {                     // djb2 稳定哈希
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) >>> 0;
  return h.toString(36);
}
function _pushContentSig(achArr) {
  return getTodayDateStr() + '#' + _pushHash([...achArr].sort().join('|'));
}
// 返回 true = 其他设备已推送过相同内容，本设备应跳过
async function _cloudPushDup(sig) {
  try {
    if (typeof isSyncReady !== 'function' || !isSyncReady()) return false;
    const fid = getFamilyId();
    if (!fid) return false;
    const rows = await supabaseGet(`family_config?family_id=eq.${fid}&config_key=eq.${PUSH_DEDUP_KEY}&select=encrypted_data,last_modified`);
    if (!Array.isArray(rows) || rows.length === 0) return false;
    let rec = null;
    try { rec = JSON.parse(rows[0].encrypted_data || 'null'); } catch (e) { return false; }
    if (!rec || rec.sig !== sig) return false;
    if (Date.now() - (rec.ts || 0) > PUSH_DEDUP_MAX_AGE) return false;
    return true;
  } catch (e) { return false; }             // 云端不可用 → 不拦截，宁可重推也不漏推
}
// 推送成功后写入云端指纹，供其他设备去重
async function _cloudPushMark(sig) {
  try {
    if (typeof isSyncReady !== 'function' || !isSyncReady()) return;
    const fid = getFamilyId();
    if (!fid) return;
    await supabaseUpsert('family_config', {
      family_id: fid, config_key: PUSH_DEDUP_KEY,
      encrypted_data: JSON.stringify({ sig: sig, ts: Date.now(), dev: getDeviceName() }),
      iv: '', last_modified: Date.now()
    });
  } catch (e) { console.warn('[推送] 云端去重标记失败:', e); }
}

// ---- 设备级推送开关（跨设备去重）----
// 多台设备共用同一群组编码时，每台都会各自推送一遍 → 重复消息。
// 由用户指定唯一一台"负责推送"的设备；其他设备只记录、不推送。
function isPushSender() { return localStorage.getItem(PUSH_SENDER_OFF_KEY) !== '1'; }
function togglePushSender() {
  const el = document.getElementById('pushSenderToggle');
  if (!el) return;
  if (el.checked) { localStorage.removeItem(PUSH_SENDER_OFF_KEY); showToast('✅ 本设备将负责推送'); }
  else { localStorage.setItem(PUSH_SENDER_OFF_KEY, '1'); showToast('已关闭本设备推送，由其他设备负责'); }
}
function loadPushSenderUI() {
  const el = document.getElementById('pushSenderToggle');
  if (el) el.checked = isPushSender();
}

// ---- 标签页级领导者选举（同浏览器多标签页去重）----
// localStorage 在同一浏览器的多个标签页间共享，用「心跳 + TTL 抢占」选出唯一推送者。
const _PAGE_ID = 'p' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
function _pushHeartbeat() {
  try {
    let leader = null;
    try { leader = JSON.parse(localStorage.getItem(PUSH_LEADER_KEY) || 'null'); } catch {}
    const now = Date.now();
    // 无领导者 / 领导者已过期 / 自己就是领导者 → 续期
    if (!leader || !leader.id || (now - leader.ts > PUSH_LEADER_TTL) || leader.id === _PAGE_ID) {
      localStorage.setItem(PUSH_LEADER_KEY, JSON.stringify({ id: _PAGE_ID, ts: now }));
    }
  } catch (e) {}
}
function _isPushLeader() {
  try {
    const raw = localStorage.getItem(PUSH_LEADER_KEY);
    if (!raw) return true;                  // 无记录：默认自己是领导者，避免漏推
    let leader = null;
    try { leader = JSON.parse(raw); } catch { return true; }
    if (!leader || !leader.id) return true;
    if (Date.now() - leader.ts > PUSH_LEADER_TTL) return true; // 领导者已失效 → 可抢占
    return leader.id === _PAGE_ID;
  } catch (e) { return true; }
}
_pushHeartbeat();
setInterval(_pushHeartbeat, PUSH_LEADER_HEARTBEAT);

// ---- 脏位标记 + 延迟合并调度器 ----
// 解决根因：一次用户操作（如添加成就）会触发 updateOverview() 多次（添加后+渲染后+关弹窗后...），
// 每次都独立走推送检查，产生并发窗口。改为：只标记脏，由单一调度器统一执行。
let _pushDirty = false;                     // 脏位：有未处理的推送检查
let _pushTimer = null;                      // 调度器 timer ID
let _pushRetry = 0;                         // 因"非领导者"而重试的次数

function _markPushDirty() {
  _pushDirty = true;
  if (_pushTimer) return;                   // 已有调度器在等待
  _pushTimer = setTimeout(async () => {
    _pushTimer = null;
    if (!_pushDirty) return;
    // 层0：本设备被用户关闭推送 → 直接丢弃，不再重试
    if (!isPushSender()) { _pushDirty = false; _pushRetry = 0; return; }
    // 层1：同浏览器其他标签页是推送领导者 → 稍后重试，避免漏推
    if (!_isPushLeader()) {
      if (_pushRetry < PUSH_LEADER_MAX_RETRY) { _pushRetry++; _markPushDirty(); return; }
      _pushDirty = false; _pushRetry = 0; return;   // 重试上限，放弃本次
    }
    _pushDirty = false; _pushRetry = 0;
    try {
      const records = getTodayRecords();
      let totalMilk = 0;
      records.forEach(r => { if (r.type === 'milk' && r.milkAmount) totalMilk += r.milkAmount; });
      const achArr = computeAchievements(records);
      if (achArr.length === 0) return;
      // 层2：跨设备云端去重 —— 同一天同一组成就，任一设备已推过则其他设备跳过
      if (await _cloudPushDup(_pushContentSig(achArr))) {
        console.log('[推送] 云端去重命中:其他设备已推送过相同内容,本设备跳过');
        return;
      }
      checkAchievementPush(achArr, totalMilk);
    } catch (e) { console.warn('[推送] 调度器异常:', e); }
  }, PUSH_SCHED_DELAY);
}

function _isRecentlyPushed(sig) {
  // Layer3: 检查历史记录中是否有相同签名（24小时内）
  try {
    const hist = JSON.parse(localStorage.getItem(PUSH_HIST_KEY) || '[]');
    if (!Array.isArray(hist)) return false;
    const oneDayAgo = Date.now() - 86400000;
    return hist.some(h => h.sig === sig && h.ts > oneDayAgo);
  } catch { return false; }
}
function _recordPushHistory(sig) {
  try {
    let hist = JSON.parse(localStorage.getItem(PUSH_HIST_KEY) || '[]');
    if (!Array.isArray(hist)) hist = [];
    hist.unshift({ ts: Date.now(), sig: sig });
    if (hist.length > PUSH_MAX_HIST) hist.length = PUSH_MAX_HIST;
    localStorage.setItem(PUSH_HIST_KEY, JSON.stringify(hist));
  } catch {}
}

function checkAchievementPush(achArr, totalMilk) {
  try {
    if (!isSubscribeMode()) return;
    const token = localStorage.getItem('pushplus_token') || _DEFAULT_PUSHTOKEN;
    if (!token || !achArr || achArr.length === 0) return;

    const currentSig = [...achArr].sort().join('|');

    // Layer1: 签名去重（快速路径）
    if (currentSig === (localStorage.getItem(PUSH_SIG_KEY) || '')) return;

    // Layer3: 历史记录兜底（防止 pushLastSig 被设置变更等意外清除后的重复）
    if (_isRecentlyPushed(currentSig)) {
      // 历史中有同签名 → 恢复 pushLastSig（自我修复），然后跳过
      localStorage.setItem(PUSH_SIG_KEY, currentSig);
      // 同步成就列表，避免下次 newAchievements 计算错误
      try { localStorage.setItem(PUSH_ACH_KEY, JSON.stringify(achArr)); } catch {}
      console.log('[推送] 历史去重命中, sig=', currentSig);
      return;
    }

    // Layer2: 发送中锁（localStorage，跨实例安全）
    const sending = localStorage.getItem(PUSH_SENDING_KEY);
    if (sending) {
      const sendingTs = parseInt(sending, 10);
      if (!isNaN(sendingTs) && (Date.now() - sendingTs < PUSH_SENDING_TIMEOUT)) {
        console.log('[推送] 发送中,跳过(剩余', Math.ceil((PUSH_SENDING_TIMEOUT - (Date.now() - sendingTs))/1000), 's)');
        return;
      }
      // 发送中锁已超时（上次可能异常中断），清除后继续
      localStorage.removeItem(PUSH_SENDING_KEY);
    }

    // ===== 计算本次新增的成就（在锁定状态前完成）=====
    let lastAch = [];
    try { lastAch = JSON.parse(localStorage.getItem(PUSH_ACH_KEY) || '[]'); } catch {}
    if (!Array.isArray(lastAch)) lastAch = [];
    const newAchievements = achArr.filter(a => !lastAch.includes(a));
    if (newAchievements.length === 0) {
      // 签名变了但没有真正的"新"成就（极少见，如成就被删又加回同样的）
      // 也记录签名防下次误判，但不推送
      localStorage.setItem(PUSH_SIG_KEY, currentSig);
      _recordPushHistory(currentSig);
      try { localStorage.setItem(PUSH_ACH_KEY, JSON.stringify(achArr)); } catch {}
      console.log('[推送] 签名变化但无新增成就，不推送');
      return;
    }

    // ===== Layer4: 同一批"新增成就"短期内已推过 → 坚决不推 =====
    // 这是间隔 1 分钟重复推送的终极防线：无论签名为何变化、状态是否被意外清除，
    // 只要本次要推的新增内容与上次推送的新增内容完全一致，30 分钟内不再推第二次。
    // 新增内容真的变了（如又加了一条新成就）则照常推送，不会漏推。
    const newSig = [...newAchievements].sort().join('|');
    const lastPushTs = parseInt(localStorage.getItem(PUSH_TS_KEY) || '0', 10);
    if (newSig && newSig === (localStorage.getItem(PUSH_NEW_SIG_KEY) || '')
        && !isNaN(lastPushTs) && (Date.now() - lastPushTs < PUSH_SAME_WINDOW)) {
      // 同步全量状态，避免后续反复进入计算
      localStorage.setItem(PUSH_SIG_KEY, currentSig);
      _recordPushHistory(currentSig);
      try { localStorage.setItem(PUSH_ACH_KEY, JSON.stringify(achArr)); } catch {}
      console.log('[推送] 同内容30分钟内已推过,跳过 newSig=', newSig);
      return;
    }

    // 同步锁定状态：在调用 doPush 之前立即写入签名+成就列表，
    // 防止推送期间再次触发时把同一条成就当"新增"重复推。
    localStorage.setItem(PUSH_SIG_KEY, currentSig);
    _recordPushHistory(currentSig);
    try { localStorage.setItem(PUSH_ACH_KEY, JSON.stringify(achArr)); } catch {}
    localStorage.setItem(PUSH_NEW_SIG_KEY, newSig);
    localStorage.setItem(PUSH_TS_KEY, String(Date.now()));

    doPush(achArr, totalMilk, newAchievements);
  } catch (e) { console.warn('推送检查失败:', e); }
}

function doPush(achArr, totalMilk, newAchievements) {
  // newAchievements 已由 checkAchievementPush 计算并锁定，无需 doPush 内部再算
  // 保留为参数传入以保证一致性

  // 标记发送中（持久化到 localStorage）
  localStorage.setItem(PUSH_SENDING_KEY, String(Date.now()));

  (async () => {
    try {
      const ds = getTodayDateStr();

      // 通知标题 = 本次新增的成就（v3.5.64：推送只呈现"本次更新"的内容）
      // 超过 3 条时标题只放前 3 条，但补上"等N条"让家人知道还有更多，完整内容看正文
      const titleSrc = newAchievements.length > 0 ? newAchievements : achArr;
      const displayTitle = titleSrc.length > 3
        ? titleSrc.slice(0, 3).join(' · ') + ` 等${titleSrc.length}条`
        : titleSrc.join(' · ');

      // 详情内容 = 今日全部成就，其中本次新增的高亮（v3.5.66 恢复）
      // 标题段保持"本次新增"不变：通知栏只给结论，点开才看全天完整清单
      const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
      const newSet = new Set(newAchievements);
      const items = achArr.map(a => newSet.has(a)
        ? `<li><span style="background:#ffecb3;color:#c0392b;font-weight:bold;padding:1px 4px;border-radius:3px;">${esc(a)}</span></li>`
        : `<li>${esc(a)}</li>`
      ).join('');
      // 当天统计（v3.5.79 统一走 getRecordsByDate 过滤脏记录）
      const recs = getRecordsByDate(ds);
      let poopCount = 0, outdoorMin = 0, sleepMin = 0;
      recs.forEach(r => {
        if (r.type === 'poop') poopCount++;
        else if (r.type === 'outdoor' && r.duration) outdoorMin += r.duration;
        else if (r.type === 'sleep' && r.duration) sleepMin += r.duration;
      });
      const fmtDur = min => { min = Math.round(min); const h = Math.floor(min / 60), m = min % 60; if (h > 0 && m > 0) return `${h}小时${m}分钟`; return h > 0 ? `${h}小时` : `${m}分钟`; };
      // 区块标题按是否有新增区分：有新增时才写"本次新增"高亮说明
      const achLabel = newAchievements.length > 0 ? '🏆 今日成就（加亮为本次新增）:' : '🏆 今日成就:';
      const achBlock = items ? `<p><b>${achLabel}</b></p><ul>${items}</ul>` : '';
      const content = `<h3>小咕噜的今日成就 ${ds}</h3>` + achBlock +
        `<p><b>🍼 水+奶量:</b> ${Math.round(totalMilk * 1.12)} ml</p>` +
        `<p><b>💩 大便次数:</b> ${poopCount} 次</p>` +
        `<p><b>☀️ 户外活动:</b> ${fmtDur(outdoorMin)}</p>` +
        `<p><b>😴 睡眠时长:</b> ${fmtDur(sleepMin)}</p>`;

      const ok = await notifyPushplus(displayTitle, content);

      // 推送成功后写入云端内容指纹，供家庭内其他设备去重（跨设备重复推送的核心防线）
      if (ok) _cloudPushMark(_pushContentSig(achArr));

      // 清除发送中锁
      localStorage.removeItem(PUSH_SENDING_KEY);

      // 注意：签名/历史/成就列表已在 checkAchievementPush 同步锁定，
      // doPush 只需释放发送中锁即可。无须再次写入（幂等）。
      console.log('[推送] 完成, ok=', ok, ' newAch=', newAchievements.length, '条');
    } catch (e) {
      console.warn('[推送] 异常:', e);
      // 异常也要清除发送中锁，避免永久卡死
      localStorage.removeItem(PUSH_SENDING_KEY);
    }
  })();
}

/* ==================== 信息总览 ==================== */
function getLastMilkRecord() {
  // 跨天查找最近的喝奶记录，从今天往前找最多7天
  // 修复：同一天内按 milkTime 取最晚，而不是数组末尾（后者可能是后补的早期记录）
  const today = new Date();
  for (let d = 0; d <= 7; d++) {
    const dt = new Date(today);
    dt.setDate(dt.getDate() - d);
    const ds = `${dt.getFullYear()}-${String(dt.getMonth()+1).padStart(2,'0')}-${String(dt.getDate()).padStart(2,'0')}`;
    const recs = getRecordsByDate(ds);   // v3.5.79 过滤脏记录
    let best = null, bestMin = -1;
    for (const r of recs) {
      if (r.type === 'milk' && r.milkTime) {
        const [hh, mm] = (r.milkTime || r.recTime || '00:00').split(':').map(Number);
        const minutes = hh * 60 + mm;
        if (minutes > bestMin) { bestMin = minutes; best = r; }
      }
    }
    if (best) return best;
  }
  return null;
}

function updateOverview(skipPush) {
  const records = getTodayRecords();
  const bar = document.getElementById('overviewBar');

  let totalMilk = 0;
  records.forEach(r => { if (r.type === 'milk' && r.milkAmount) totalMilk += r.milkAmount; });

  const lastMilkRec = getLastMilkRecord();
  let html = '<div class="overview-row">';
  if (lastMilkRec) {
    const [h, m] = (lastMilkRec.milkTime || lastMilkRec.recTime || '00:00').split(':').map(Number);
    const intv = getMilkInterval();
    const ld = lastMilkRec.timestamp ? new Date(lastMilkRec.timestamp) : new Date();
    ld.setHours(h, m, 0, 0);
    const nd = new Date(ld.getTime() + intv * 3600000);
    const nh = String(nd.getHours()).padStart(2, '0'), nm = String(nd.getMinutes()).padStart(2, '0');
    html += `<div class="overview-item"><span class="ov-icon">🍼</span><span class="ov-label">下次喝奶:</span><span class="ov-time">${nh}:${nm}</span></div>`;
  } else {
    html += `<div class="overview-item"><span class="ov-icon">🍼</span><span class="ov-label">下次喝奶:</span><span class="ov-value">暂无记录</span></div>`;
  }
  html += `<div class="overview-item"><span class="ov-label">水+奶量:</span><span class="ov-value">${Math.round(totalMilk * 1.12)} ml</span></div>`;
  html += '</div>';

  const achArr = computeAchievements(records);
  if (achArr.length > 0) {
    html += `<div class="overview-achievement"><span class="ov-icon">🏆</span><span class="ov-text"><span class="ov-label">今日成就:</span> ${achArr.join(' | ')}</span></div>`;
  } else {
    html += `<div class="overview-achievement"><span class="ov-icon">🏆</span><span class="ov-text"><span class="ov-label">今日成就:</span> 无</span></div>`;
  }

  // v3.5.106 总览内「日报」小组件：点击弹窗看完整日报（图标同修改前，不显示条数）
  // v3.5.109 日报胶囊右移并改添加按钮底色（右对齐包裹）
  html += `<div class="ov-report-row"><div class="ov-report-pill" onclick="openReport()">&#128200; 日报 <span class="pill-chev">&#8250;</span></div></div>`;
  // v3.5.132 首页总览「今日计划」卡片（默认收起，点击展开；无 AI 任务则不显示）
  html += renderTodayPlanCardHTML();

  bar.innerHTML = html;
  // 推送检查改为脏位标记，由统一调度器延迟合并执行
  // 这消除了"一次操作触发多次 updateOverview → 多次独立推送检查"的并发根因
  if (!skipPush && achArr.length > 0) _markPushDirty();
}

let milkRemindShown = false; // 页面级变量：本次页面生命周期内只弹一次，刷新后自然重置
function checkMilkReminder(attempt) {
  if (milkRemindShown) return;
  // 若有其他 toast 正在显示（如操作反馈），等待其结束后再弹，避免覆盖（最多等 5 秒）
  const toastEl = document.getElementById('toast');
  if (toastEl && toastEl.classList.contains('show') && (attempt || 0) < 10) {
    setTimeout(() => checkMilkReminder((attempt || 0) + 1), 500);
    return;
  }
  const lastMilkRec = getLastMilkRecord();
  if (!lastMilkRec) return;
  const [h, m] = (lastMilkRec.milkTime || lastMilkRec.recTime || '00:00').split(':').map(Number);
  const intv = getMilkInterval();
  const ld = lastMilkRec.timestamp ? new Date(lastMilkRec.timestamp) : new Date();
  ld.setHours(h, m, 0, 0);
  const nd = new Date(ld.getTime() + intv * 3600000);
  const nh = String(nd.getHours()).padStart(2, '0'), nm = String(nd.getMinutes()).padStart(2, '0');
  const diff = nd - new Date();
  milkRemindShown = true;
  if (diff > 0) {
    const dm = Math.floor(diff / 60000);
    showToast(`⏰ 距下次喝奶（${nh}:${nm}）还有 ${Math.floor(dm/60)}h ${dm%60}min`, 3000);
  } else {
    showToast(`⏰ 下次喝奶时间到了（${nh}:${nm}）！`, 3000);
  }
}

/* ==================== 首页筛选（v3.5.115：左侧分类多选下拉 + 右侧活动名搜索） ==================== */
function renderCategoryBar() {
  const panel = document.getElementById('catDropdownPanel');
  if (panel) {
    const allOn = selectedCategories.size === CATEGORIES.length;
    let h = `<label class="cat-dp-item"><input type="checkbox" ${allOn ? 'checked' : ''} onchange="toggleCatAll(this)"> 🏠 全部</label>`;
    CATEGORIES.forEach(c => {
      const on = selectedCategories.has(c.id);
      h += `<label class="cat-dp-item"><input type="checkbox" data-cat="${c.id}" ${on ? 'checked' : ''} onchange="toggleCatFilter('${c.id}',this)"> ${c.icon} ${c.name}</label>`;
    });
    panel.innerHTML = h;
  }
  const btn = document.getElementById('catDropdownBtn');
  if (btn) btn.innerHTML = (selectedCategories.size === CATEGORIES.length ? '📂 全部' : '📂 已选 ' + selectedCategories.size + ' 类') + ' <span class="cat-arrow">&#9662;</span>';
}
function toggleCatDropdown() { const p = document.getElementById('catDropdownPanel'); if (p) p.classList.toggle('open'); }
// v3.5.118 点击下拉框以外区域时关闭分类下拉面板
// v3.5.127 改为关闭所有已展开的分类下拉（首页/添加弹窗/知识库共用同一套面板结构）
function _catOutsideClose(e) {
  document.querySelectorAll('.cat-dropdown-panel.open').forEach(p => {
    const dd = p.closest('.cat-dropdown');
    if (dd && !dd.contains(e.target)) p.classList.remove('open');
  });
}
document.addEventListener('click', _catOutsideClose);

/* ==================== v3.5.127 通用「分类多选下拉」组件（首页筛选 / 添加弹窗 / 知识库 共用） ==================== */
// 通过命名空间 ns 区分三处实例：'home' 复用原有 selectedCategories/renderCategoryBar；'add' / 'kb' 各自管理
function catDpCfg(ns) {
  if (ns === 'add') return {
    panelId: 'addCatPanel', btnId: 'addCatBtn',
    selected: addModalCats,
    cats: CATEGORIES.map(c => ({ id: c.id, icon: c.icon, name: c.name })),
    onChange: renderAddList
  };
  if (ns === 'kb') return {
    panelId: 'kbCatPanel', btnId: 'kbCatBtn',
    selected: kbSelectedCats,
    cats: KB_FILTER_CATS.map(c => ({ id: c, icon: KB_CAT_ICON[c] || '🏷️', name: c })),
    onChange: renderKb
  };
  return null;
}
// 渲染某命名空间的下拉面板 + 按钮文案
function renderCatDropdownPanel(ns) {
  const cfg = catDpCfg(ns); if (!cfg) return;
  const panel = document.getElementById(cfg.panelId);
  const allOn = cfg.selected.size === cfg.cats.length;
  let h = `<label class="cat-dp-item"><input type="checkbox" ${allOn ? 'checked' : ''} onchange="catDpToggleAll('${ns}',this)"> ${cfg.iconAll || '📂'} ${cfg.allLabel || '全部'}</label>`;
  cfg.cats.forEach(c => {
    const on = cfg.selected.has(c.id);
    h += `<label class="cat-dp-item"><input type="checkbox" data-cat="${c.id}" ${on ? 'checked' : ''} onchange="catDpToggleOne('${ns}','${_escAttr(c.id)}',this)"> ${c.icon} ${c.name}</label>`;
  });
  if (panel) panel.innerHTML = h;
  const btn = document.getElementById(cfg.btnId);
  if (btn) btn.innerHTML = (allOn ? `${cfg.iconAll || '📂'} ${cfg.allLabel || '全部'}` : `${cfg.iconAll || '📂'} 已选 ${cfg.selected.size} 类`) + ' <span class="cat-arrow">&#9662;</span>';
}
function catDpToggleAll(ns, cb) {
  const cfg = catDpCfg(ns); if (!cfg) return;
  const next = cb.checked ? new Set(cfg.cats.map(c => c.id)) : new Set();
  if (ns === 'add') addModalCats = next; else kbSelectedCats = next;
  renderCatDropdownPanel(ns); cfg.onChange();
}
function catDpToggleOne(ns, id, cb) {
  const cfg = catDpCfg(ns); if (!cfg) return;
  if (cb.checked) cfg.selected.add(id); else cfg.selected.delete(id);
  renderCatDropdownPanel(ns); cfg.onChange();
}
function toggleCatDropdownNs(ns) {
  const cfg = catDpCfg(ns); if (!cfg) return;
  const p = document.getElementById(cfg.panelId); if (p) p.classList.toggle('open');
}
// 知识库搜索（文本过滤，与多选分类叠加生效）
function onKbSearch() {
  const el = document.getElementById('kbSearch');
  kbSearchQuery = el ? el.value.trim().toLowerCase() : '';
  renderKb();
}
function toggleCatAll(cb) {
  selectedCategories = cb.checked ? new Set(CATEGORIES.map(c => c.id)) : new Set();
  renderCategoryBar(); renderCards();
}
function toggleCatFilter(id, cb) {
  if (cb.checked) selectedCategories.add(id); else selectedCategories.delete(id);
  renderCategoryBar(); renderCards();
}
function onActSearch() {
  const el = document.getElementById('actSearch');
  actSearchQuery = el ? el.value.trim().toLowerCase() : '';
  renderCards();
}

/* ==================== 渲染卡片（v3.5.115：按分类分组，分类标题置于对应活动上方） ==================== */
function renderCards(newestIds) {
  newestIds = newestIds || [];
  const grid = document.getElementById('cardsGrid');
  grid.innerHTML = '';
  const records = getTodayRecords();
  const q = actSearchQuery;

  CATEGORIES.forEach(cat => {
    if (!selectedCategories.has(cat.id)) return;
    let acts = ACTIVITIES.filter(act => act.category === cat.id && !hiddenActivities.includes(act.id));
    if (q) acts = acts.filter(act => act.name.toLowerCase().includes(q));
    if (!acts.length) return;

    // 分类分组标题（图标在左、文字在右），置于该分类活动上方
    const title = document.createElement('div');
    title.className = 'cat-section-title';
    title.innerHTML = `<span class="cat-sec-icon">${cat.icon}</span><span class="cat-sec-name">${cat.name}</span>`;
    grid.appendChild(title);

    acts.forEach(act => {
      const card = document.createElement('div');
      card.className = 'card';
      card.dataset.id = act.id;
      if (newestIds.includes(act.id)) card.classList.add('highlight');

      const actRecords = records.filter(r => r.type === act.id).reverse();
      const count = actRecords.length;

      let bodyHtml = '';
      if (actRecords.length === 0) {
        bodyHtml = '<div class="card-empty">今日暂无记录</div>';
      } else {
        bodyHtml = '<div class="card-records">';
        actRecords.forEach((r, i) => {
          const isNewest = i === 0 && newestIds.includes(act.id);
          const time = r.recTime || r.time;
          const readOnly = isReadOnlyMode();
          const editDeleteHtml = readOnly ? '' : `<span class="rec-edit" onclick="event.stopPropagation();openEditRecord('${r.type}',${r.timestamp})"><svg viewBox="0 0 24 24"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg></span><span class="rec-delete" onclick="event.stopPropagation();deleteRecord('${r.type}',${r.timestamp})"><svg viewBox="0 0 24 24"><path d="M3 6h18"/><path d="M8 6V4h8v2"/><path d="M6 6l1 14h10l1-14"/><path d="M10 10v6"/><path d="M14 10v6"/></svg></span>`;
          bodyHtml += `<div class="record-tag${isNewest ? ' newest' : ''}" data-timestamp="${r.timestamp}" data-type="${r.type}">
            <div class="rec-left"><span class="rec-time">${time}</span><span class="rec-detail">${formatRecordBrief(r, getTodayDateStr())}</span></div>
            ${editDeleteHtml}
          </div>`;
        });
        bodyHtml += '</div>';
      }

      card.innerHTML = `<div class="card-header"><div class="card-name"><span class="icon">${act.icon}</span>${act.name}</div>${count>0?`<div class="card-count">${count}次</div>`:''}</div>${bodyHtml}`;
      grid.appendChild(card);
    });
  });

  if (!grid.children.length) {
    grid.innerHTML = '<div class="memo-empty">没有匹配的活动，换个关键词或分类试试～</div>';
  }
}

function formatRecordBrief(r, ds) {
  let base = '';
  if (r.type === 'milk') {
    if (r.milkAmount > 0) base = r.milkAmount + 'ml';
    // v3.5.90 乳糖酶量：优先用记录自身的 lactase；老记录（v3.5.87 之前录入、无该字段）回退到「当日乳糖酶量」（历史补充规则）
    let lac = (r.lactase != null) ? r.lactase : null;
    if (lac == null) {
      let d = ds;
      if (!d && r.timestamp) { const dt = new Date(Number(r.timestamp)); if (!isNaN(dt.getTime())) d = `${dt.getFullYear()}-${String(dt.getMonth()+1).padStart(2,'0')}-${String(dt.getDate()).padStart(2,'0')}`; }
      if (d) lac = getLactaseByDate(d);
    }
    if (lac != null) base += ' · 乳糖酶' + lac + '滴';
  }
  else if (r.type === 'poop') { base = r.poopStatus || ''; }
  else if (r.type === 'supplement') { base = (r.supplementTypes||[]).join('/'); if (r.supplementAmount > 0) base += ' ' + r.supplementAmount + '粒'; }
  else if (r.type === 'solidFood') { base = (r.solidFoods||[]).join('、'); if (r.solidFoodAmount > 0) base += ' ' + r.solidFoodAmount + 'g'; if (r.afterMeal) base += ' · 饭后' + r.afterMeal; }
  else if (r.type === 'vaccine') { base = (r.vaccineTypes||[]).join('/'); if (r.vaccineDose > 0) base += ' 第' + r.vaccineDose + '剂'; }
  else if (r.type === 'listenStory') { base = (r.storyLangs||[]).join('/'); }
  else if (r.type === 'grossMotor') { base = (r.grossMotorItems||[]).join(', '); }
  else if (r.type === 'fineMotor') { base = (r.fineMotorItems||[]).join(', '); }
  else if (r.type === 'sleep') {
    if (r.duration && r.duration > 0) {
      const h = Math.floor(r.duration / 60); const m = Math.round(r.duration % 60);
      let s = ''; if (h > 0) s += h + 'h'; if (m > 0) s += (s ? ' ' : '') + m + 'min';
      base = s;
    }
  }
  else if (r.type === 'drinkWater') { base = '已喝水'; }
  else if (r.duration !== undefined && r.duration > 0) { base = r.duration + '分钟'; if (r.level) base += ' · 屁股状态:' + r.level; }
  else if (r.level) { base = '屁股状态:' + r.level; }
  else if (r.shampoo && r.shampoo !== '无') { base = '使用沐浴露:' + r.shampoo; }
  else if (r.temperature) { base = r.temperature + '℃ <span class="' + (r.tempStatus === 'high' ? 'temp-high' : 'temp-normal') + '">' + (r.tempStatus === 'high' ? '⚠️' : '●') + '</span>'; }
  // 所有类型统一追加备注（多行以<br>显示）
  const note = (r.note || '').trim();
  if (note) {
    const noteHtml = note.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '<br>');
    return base ? base + ' · ' + noteHtml : noteHtml;
  }
  return base || '已记录';
}

function deleteRecord(type, timestamp, ds) {
  const target = ds || getTodayDateStr();
  const label = target === getTodayDateStr() ? '这条记录' : `${target} 的这条记录`;
  if (!confirm(`删除${label}？`)) return;
  let records = getRecordsByDate(target);
  // 先登记墓碑，再删除：否则合并同步时这条记录会从家人设备"复活"
  const doomed = records.filter(r => r.type === type && r.timestamp === timestamp);
  if (doomed.length) addTombstones(target, doomed.map(recKey));
  records = records.filter(r => !(r.type === type && r.timestamp === timestamp));
  persistRecords(records, target);
  afterRecordChange(target);
  showToast('已删除');
}

/* ==================== 编辑记录 ==================== */
let _editingType = null, _editingTimestamp = null, _editingDateStr = null;

// ds 省略为今天；历史页传入所选日期，编辑后写回该日期
function openEditRecord(type, timestamp, ds) {
  const target = ds || getTodayDateStr();
  const records = getRecordsByDate(target);
  const rec = records.find(r => r.type === type && r.timestamp === timestamp);
  if (!rec) { showToast('记录不存在'); return; }
  _editingType = type; _editingTimestamp = timestamp; _editingDateStr = target;
  const act = ACTIVITIES.find(a => a.id === type);
  const container = document.getElementById('editFormContent');
  let editPendingSf = null;   // v3.5.74 辅食下拉需在 innerHTML 落盘后回填

  const titleEl = document.getElementById('editFormTitle');
  if (titleEl) titleEl.textContent = target === getTodayDateStr()
    ? '✏️ 编辑记录'
    : `✏️ 编辑记录 · ${target}`;
  let html = `<div style="margin-bottom:12px;font-size:15px;color:#dfe6e9;">${act.icon} ${act.name}</div>`;
  html += `<div class="input-row"><label style="font-size:14px;color:#b2bec3;">开始:</label><div class="time-input-group">`;
  const [hh, mm] = (rec.recTime || rec.time || '00:00').split(':').map(Number);
  html += `<input type="number" id="edt_h" min="0" max="23" value="${String(hh).padStart(2,'0')}"><span>:</span><input type="number" id="edt_m" min="0" max="59" value="${String(mm).padStart(2,'0')}">`;
  html += `</div></div>`;

  if (act.type === 'milk') {
    html += `<div class="input-row"><label style="font-size:14px;color:#b2bec3;">奶量:</label><input type="number" id="edt_val" value="${rec.milkAmount||120}"><span class="unit">ml</span></div>`;
  } else if (act.type === 'sleep') {
    const dur = rec.duration || 0; const dh = Math.floor(dur / 60); const dm = Math.round(dur % 60);
    html += `<div class="input-row"><label style="font-size:14px;color:#b2bec3;">时长:</label><input type="number" min="0" id="edt_dur_h" value="${dh}" style="width:50px;"><span class="unit">h</span><input type="number" min="0" max="59" id="edt_dur_m" value="${dm}" style="width:50px;margin-left:8px;"><span class="unit">min</span></div>`;
  } else if (act.type === 'poop') {
    let po = ''; POOP_STATUS.forEach(ps => { po += `<label><input type="radio" name="edt_poop" value="${ps.value}" ${(rec.poopStatus||'正常')===ps.value?'checked':''}> <span class="poop-icon ${ps.cls}">${ps.icon}</span>${ps.label}</label>`; });
    html += `<div class="input-row radio-group">${po}</div>`;
  } else if (act.type === 'supplement') {
    const sel = rec.supplementTypes || ['AD'];
    html += `<div class="input-row checkbox-group"><label><input type="checkbox" name="edt_sup" value="AD" ${sel.includes('AD')?'checked':''}> AD</label><label><input type="checkbox" name="edt_sup" value="D3" ${sel.includes('D3')?'checked':''}> D3</label></div>`;
    html += `<div class="input-row"><label style="font-size:14px;color:#b2bec3;">用量:</label><input type="number" id="edt_val" value="${rec.supplementAmount||1}"><span class="unit">粒</span></div>`;
  } else if (act.type === 'solidFood') {
    // v3.5.74 辅食：食物（可搜索多选）+ 克数 + 饭后正常/异常
    editPendingSf = { p: 'edt', id: act.id, sel: rec.solidFoods || [] };
    html += `<div class="input-row sf-row"><label class="sf-label">食物:</label>${sfPickerHtml('edt', act.id)}<input type="number" step="1" min="0" id="edt_sfamt" class="sf-amt" placeholder="0" value="${rec.solidFoodAmount > 0 ? rec.solidFoodAmount : ''}"><span class="unit">g</span></div>`;
    html += `<div class="input-row sf-row sf-meal-row radio-group"><label class="sf-label">饭后:</label><label><input type="radio" name="edt_meal" value="正常" ${(rec.afterMeal||'正常')==='正常'?'checked':''}> 正常</label><label><input type="radio" name="edt_meal" value="异常" ${rec.afterMeal==='异常'?'checked':''}> 异常</label></div>`;
  } else if (act.type === 'vaccine') {
    const sel = rec.vaccineTypes || [];
    let vh = ''; VACCINE_OPTIONS.forEach(v => { vh += `<label><input type="checkbox" name="edt_vac" value="${v}" ${sel.includes(v)?'checked':''}> ${v}</label>`; });
    html += `<div class="input-row checkbox-group">${vh}</div><div class="input-row"><label style="font-size:14px;color:#b2bec3;">第几剂:</label><input type="number" id="edt_val" value="${rec.vaccineDose||1}"><span class="unit">剂</span></div>`;
  } else if (act.type === 'listenStory') {
    const sel = rec.storyLangs || ['中文'];
    html += `<div class="input-row checkbox-group"><label><input type="checkbox" name="edt_story" value="中文" ${sel.includes('中文')?'checked':''}> 中文</label><label><input type="checkbox" name="edt_story" value="英文" ${sel.includes('英文')?'checked':''}> 英文</label></div>`;
  } else if (act.type === 'grossMotor') {
    const sel = rec.grossMotorItems || [];
    let gh = ''; grossMotorOptions.forEach(o => { gh += `<label><input type="checkbox" name="edt_gm" value="${o}" ${sel.includes(o)?'checked':''}> ${o}</label>`; });
    html += `<div class="input-row checkbox-group">${gh}</div>`;
  } else if (act.type === 'fineMotor') {
    const sel = rec.fineMotorItems || [];
    let fh = ''; fineMotorOptions.forEach(o => { fh += `<label><input type="checkbox" name="edt_fm" value="${o}" ${sel.includes(o)?'checked':''}> ${o}</label>`; });
    html += `<div class="input-row checkbox-group">${fh}</div>`;
  } else if (act.type === 'duration') {
    html += `<div class="input-row"><input type="number" step="0.1" id="edt_val" value="${rec.duration||0}"><span class="unit">${act.unit}</span></div>`;
  } else if (act.type === 'airButt') {
    html += `<div class="input-row"><input type="number" step="0.1" id="edt_val" value="${rec.duration||0}"><span class="unit">分钟</span></div><div class="input-row"><label style="font-size:14px;color:#b2bec3;">屁股状态:</label><select id="edt_sel"><option value="正常" ${rec.level==='正常'?'selected':''}>正常</option><option value="发红" ${rec.level==='发红'?'selected':''}>发红</option><option value="红疹" ${rec.level==='红疹'?'selected':''}>红疹</option><option value="溃烂" ${rec.level==='溃烂'?'selected':''}>溃烂</option></select></div>`;
  } else if (act.type === 'bath') {
    html += `<div class="input-row"><label style="font-size:14px;color:#b2bec3;">使用沐浴露:</label><select id="edt_sel"><option value="无" ${(rec.shampoo||'无')==='无'?'selected':''}>无</option><option value="头发" ${rec.shampoo==='头发'?'selected':''}>头发</option><option value="身体" ${rec.shampoo==='身体'?'selected':''}>身体</option><option value="头发和身体" ${rec.shampoo==='头发和身体'?'selected':''}>头发和身体</option></select></div>`;
  } else if (act.type === 'note') {
    // 备注即内容，由统一备注框编辑
  } else if (act.type === 'temperature') {
    html += `<div class="input-row"><input type="number" step="0.1" id="edt_val" value="${rec.temperature||36.5}"><span class="unit">℃</span></div>`;
  }

  // 所有活动统一附带多行备注编辑框
  const notePh2 = act.type === 'note' ? '记录内容（支持多行）' : '备注（可选，支持多行）';
  const noteEsc = (rec.note || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  html += `<div class="input-row add-note-row"><textarea id="edt_note" rows="2" placeholder="${notePh2}">${noteEsc}</textarea></div>`;

  container.innerHTML = html;
  if (editPendingSf) sfInit(editPendingSf.p, editPendingSf.id, editPendingSf.sel);
  showModal('editModal');
}

function saveEditRecord() {
  const target = _editingDateStr || getTodayDateStr();
  const records = getRecordsByDate(target);
  const idx = records.findIndex(r => r.type === _editingType && r.timestamp === _editingTimestamp);
  if (idx === -1) { showToast('记录不存在'); return; }
  const rec = records[idx];
  const act = ACTIVITIES.find(a => a.id === _editingType);

  // 更新时刻
  const hh = String(parseInt(document.getElementById('edt_h').value) || 0).padStart(2, '0');
  const mm = String(parseInt(document.getElementById('edt_m').value) || 0).padStart(2, '0');
  rec.recTime = hh + ':' + mm;

  if (act.type === 'milk') {
    rec.milkTime = rec.recTime;
    const a = parseInt(document.getElementById('edt_val').value); rec.milkAmount = isNaN(a) || a < 1 ? 120 : a;
  } else if (act.type === 'sleep') {
    rec.sleepStartTime = rec.recTime;
    const dh = parseInt(document.getElementById('edt_dur_h').value) || 0;
    const dm = parseInt(document.getElementById('edt_dur_m').value) || 0;
    rec.duration = dh * 60 + dm;
  } else if (act.type === 'drinkWater') {
    rec.drinkTime = rec.recTime;
  } else if (act.type === 'poop') {
    rec.poopTime = rec.recTime;
    const rds = document.getElementsByName('edt_poop'); for (const r of rds) { if (r.checked) { rec.poopStatus = r.value; break; } }
  } else if (act.type === 'supplement') {
    rec.supplementTime = rec.recTime;
    const cbs = document.getElementsByName('edt_sup'); const types = []; for (const cb of cbs) { if (cb.checked) types.push(cb.value); }
    rec.supplementTypes = types.length > 0 ? types : ['AD'];
    const a = parseInt(document.getElementById('edt_val').value); rec.supplementAmount = isNaN(a) || a < 1 ? 1 : a;
  } else if (act.type === 'solidFood') {
    rec.solidFoodTime = rec.recTime;
    rec.solidFoods = sfGetSelection('edt', _editingType);
    const el = document.getElementById('edt_sfamt'); const v = el ? parseFloat(String(el.value).trim()) : NaN;
    rec.solidFoodAmount = (!isNaN(v) && v > 0) ? Math.round(v) : 0;
    const rds = document.getElementsByName('edt_meal'); let _m = '正常'; for (const r of rds) { if (r.checked) { _m = r.value; break; } }
    rec.afterMeal = _m;
  } else if (act.type === 'vaccine') {
    rec.vaccineTime = rec.recTime;
    const cbs = document.getElementsByName('edt_vac'); const types = []; for (const cb of cbs) { if (cb.checked) types.push(cb.value); }
    rec.vaccineTypes = types;
    const d = parseInt(document.getElementById('edt_val').value); rec.vaccineDose = isNaN(d) || d < 1 ? 1 : d;
  } else if (act.type === 'listenStory') {
    rec.storyTime = rec.recTime;
    const cbs = document.getElementsByName('edt_story'); const langs = []; for (const cb of cbs) { if (cb.checked) langs.push(cb.value); }
    rec.storyLangs = langs.length > 0 ? langs : ['中文'];
  } else if (act.type === 'grossMotor') {
    rec.grossMotorTime = rec.recTime;
    const cbs = document.getElementsByName('edt_gm'); const items = []; for (const cb of cbs) { if (cb.checked) items.push(cb.value); }
    rec.grossMotorItems = items;
  } else if (act.type === 'fineMotor') {
    rec.fineMotorTime = rec.recTime;
    const cbs = document.getElementsByName('edt_fm'); const items = []; for (const cb of cbs) { if (cb.checked) items.push(cb.value); }
    rec.fineMotorItems = items;
  } else if (act.type === 'duration') {
    rec.durationTime = rec.recTime;
    const v = parseFloat(document.getElementById('edt_val').value); rec.duration = isNaN(v) ? 0 : v;
  } else if (act.type === 'airButt') {
    rec.airButtTime = rec.recTime;
    const v = parseFloat(document.getElementById('edt_val').value); rec.duration = isNaN(v) ? 0 : v;
    rec.level = document.getElementById('edt_sel').value;
  } else if (act.type === 'bath') {
    rec.bathTime = rec.recTime;
    rec.shampoo = document.getElementById('edt_sel').value;
  } else if (act.type === 'note') {
    rec.noteTime = rec.recTime;
  } else if (act.type === 'temperature') {
    rec.tempTime = rec.recTime;
    const v = parseFloat(document.getElementById('edt_val').value); rec.temperature = isNaN(v) ? 0 : v;
    rec.tempStatus = v <= 37.5 ? 'normal' : 'high';
  }

  // 统一读取备注（所有活动类型均支持）
  const noteEl = document.getElementById('edt_note');
  if (noteEl) rec.note = noteEl.value.trim();

  // 标记修改时间：跨设备合并时，同一条记录取 updatedAt 较新的版本
  rec.updatedAt = Date.now();

  persistRecords(records, target);
  hideModal('editModal');
  afterRecordChange(target);
  showToast('已更新');
}

/* ==================== 添加记录弹窗 ==================== */
const APP_VERSION = 'v3.5.137'; // v3.5.137:①首页分类下拉/搜索框字号统一14;②任务「开始时间」改为同首页添加弹窗的数字输入(时:分);③AI育儿历史对话不再同步家庭云、只保留最近10条;④云端同步三按钮(设置/同步/恢复)等宽并排;⑤AI推荐任务全局仅允许一个,已有则新建时禁用该选项;⑥修复详细中文地址查不到天气的问题(地理编码逐级降级+内置城市兜底)
let _addModalOpening = false;
let _addTargetDate = null;   // 添加目标日期：null=今天；历史页传所选日期
function openAddModal(ds) {
  if (_addModalOpening) return;
  _addModalOpening = true;
  setTimeout(() => { _addModalOpening = false; }, 400);
  _addTargetDate = ds || null;
  addModalCats = new Set(CATEGORIES.map(c => c.id));   // v3.5.127 多选分类重置为全选
  addSelectedSet = new Set();
  document.getElementById('addSearchInput').value = '';
  const addTitleEl = document.getElementById('addModalTitle');
  if (addTitleEl) addTitleEl.textContent = ds ? `添加记录 · ${ds}` : '添加记录';
  showModal('addModal'); // 先弹窗再渲染：即使渲染出错，弹窗也必定打开
  try {
    renderAddModal();
  } catch (e) {
    console.error('renderAddModal error:', e);
    showToast('活动列表加载异常：' + (e && e.message ? e.message : e));
  }
}

function getNowTimeStr() { const n = new Date(); return String(n.getHours()).padStart(2,'0')+':'+String(n.getMinutes()).padStart(2,'0'); }

/* ==================== 辅食：食物多选下拉（关键字搜索 + 滚动条） ====================
   p = 前缀（'ad' 添加弹窗 / 'edt' 编辑弹窗），id = 活动 id
   选中态存在内存 SF_PICKER 中，渲染后由 sfInit 回填，避免重渲染丢失勾选
================================================================================ */
const SF_PICKER = {};
function sfKey(p, id) { return p + '|' + id; }
function sfEsc(s) { return String(s == null ? '' : s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
function sfJsStr(s) { return sfEsc(s).replace(/'/g, "\\'").replace(/\\/g, '\\\\'); }
function sfState(p, id) {
  const key = sfKey(p, id);
  if (!SF_PICKER[key]) SF_PICKER[key] = { sel: new Set(), kw: '' };
  return SF_PICKER[key];
}
function sfInit(p, id, selected) {
  const key = sfKey(p, id);
  SF_PICKER[key] = { sel: new Set(Array.isArray(selected) ? selected : []), kw: '' };
  const sEl = document.getElementById(`${p}search_${id}`); if (sEl) sEl.value = '';
  const pn = document.getElementById(`${p}panel_${id}`); if (pn) pn.style.display = 'none';
  sfRenderList(p, id);
  sfRenderTrigger(p, id);
}
function sfPickerHtml(p, id) {
  return `<div class="sf-select" id="${p}sel_${id}">`
    + `<div class="sf-trigger" onclick="sfTogglePanel('${p}','${id}')">`
    + `<span class="sf-ph sf-ph-empty" id="${p}ph_${id}">请选择食物</span><span class="sf-arrow">&#9662;</span></div>`
    + `<div class="sf-panel" id="${p}panel_${id}" style="display:none;">`
    + `<div class="sf-search"><input type="text" id="${p}search_${id}" placeholder="输入关键字查找" oninput="sfFilter('${p}','${id}',this.value)"></div>`
    + `<div class="sf-list" id="${p}list_${id}"></div>`
    + `</div></div>`;
}
function sfRenderList(p, id) {
  const st = sfState(p, id);
  const box = document.getElementById(`${p}list_${id}`);
  if (!box) return;
  const kw = String(st.kw || '').trim();
  const kwL = kw.toLowerCase();
  const opts = getSolidFoodOptions();
  const shown = kwL ? opts.filter(o => String(o).toLowerCase().includes(kwL)) : opts;
  let h = '';
  shown.forEach(o => {
    const e = sfEsc(o);
    h += `<label class="sf-opt"><input type="checkbox" name="${p}sfopt_${id}" value="${e}" ${st.sel.has(o) ? 'checked' : ''} onchange="sfOnCheck('${p}','${id}','${sfJsStr(o)}',this.checked)"><span class="sf-opt-t">${e}</span></label>`;
  });
  if (shown.length === 0) {
    if (kw) h += `<div class="sf-addnew" onclick="sfAddNew('${p}','${id}','${sfJsStr(kw)}')">＋ 添加「${sfEsc(kw)}」为新食物</div>`;
    else h += `<div class="sf-empty">暂无食物选项，可在管理弹窗添加</div>`;
  } else if (kw && !shown.some(o => String(o) === kw)) {
    h += `<div class="sf-addnew" onclick="sfAddNew('${p}','${id}','${sfJsStr(kw)}')">＋ 添加「${sfEsc(kw)}」为新食物</div>`;
  }
  box.innerHTML = h;
}
function sfOnCheck(p, id, val, checked) {
  const st = sfState(p, id);
  if (checked) st.sel.add(val); else st.sel.delete(val);
  sfRenderTrigger(p, id);
  if (p === 'vi') { try { sfSyncVoiceItem(id); } catch (e) {} }
}
function sfRenderTrigger(p, id) {
  const el = document.getElementById(`${p}ph_${id}`);
  if (!el) return;
  const arr = Array.from(sfState(p, id).sel);
  if (arr.length === 0) { el.textContent = '请选择食物'; el.classList.add('sf-ph-empty'); }
  else { el.textContent = arr.join('、'); el.classList.remove('sf-ph-empty'); }
}
function sfCloseAllPanels() {
  const ps = document.querySelectorAll('.sf-panel');
  for (let i = 0; i < ps.length; i++) ps[i].style.display = 'none';
}
function sfTogglePanel(p, id) {
  const panel = document.getElementById(`${p}panel_${id}`);
  if (!panel) return;
  const willOpen = panel.style.display === 'none';
  sfCloseAllPanels();
  if (!willOpen) return;
  panel.style.display = '';
  sfRenderList(p, id);
  // 下方空间不足时向上展开，避免被弹窗容器裁剪
  try {
    const sel = document.getElementById(`${p}sel_${id}`);
    const rect = (sel && sel.getBoundingClientRect) ? sel.getBoundingClientRect() : null;
    const vh = (typeof window !== 'undefined' && window.innerHeight) || 0;
    const need = 240;   // 面板大致高度
    if (rect && vh && (vh - rect.bottom) < need && rect.top > need) {
      panel.style.top = 'auto'; panel.style.bottom = 'calc(100% + 4px)';
    } else {
      panel.style.top = 'calc(100% + 4px)'; panel.style.bottom = 'auto';
    }
  } catch (e) {
    panel.style.top = 'calc(100% + 4px)'; panel.style.bottom = 'auto';
  }
}
function sfFilter(p, id, val) {
  sfState(p, id).kw = (val == null ? '' : String(val));
  sfRenderList(p, id);
}
function sfGetSelection(p, id) { return Array.from(sfState(p, id).sel); }
function sfAddNew(p, id, name) {
  name = String(name || '').trim();
  if (!name) return;
  if (!Array.isArray(solidFoodOptions)) solidFoodOptions = [];
  if (!solidFoodOptions.includes(name)) {
    solidFoodOptions.push(name);
    saveCustomOptions();
    markOptDeleted('solidFoodDeleted', name, false);
    showToast('已添加食物「' + name + '」，长期有效');
  }
  const st = sfState(p, id);
  st.sel.add(name); st.kw = '';
  const sEl = document.getElementById(`${p}search_${id}`); if (sEl) sEl.value = '';
  sfRenderList(p, id); sfRenderTrigger(p, id);
}
// 点击下拉以外的任何区域都关闭面板（面板内部点击不关闭，方便多选）
// iOS Safari 对 div/span 等"不可点击元素"不派发 click，故同时监听 touchstart
function _sfOutsideClose(e) {
  if (!e) return;
  const t = e.target;
  if (t && t.closest && t.closest('.sf-select')) return;   // 下拉内部：不关
  sfCloseAllPanels();
}
document.addEventListener('click', _sfOutsideClose);
document.addEventListener('touchstart', _sfOutsideClose, { passive: true });
// iOS 事件委托兜底：让 body 具备可点击性，click 才会冒泡到 document
if (document.body && !document.body.hasAttribute('onclick')) {
  document.body.setAttribute('onclick', 'void(0)');
}

function renderAddModal() {
  // v3.5.127 分类栏改为「左侧多选下拉 + 右侧搜索」并排（同首页分类样式）；筛选活动按所选分类 + 搜索关键字
  renderCatDropdownPanel('add');
  renderAddList();
}

/* ---------- v3.5.125 通用「分类选择」下拉弹窗（首页添加弹窗 + 知识库改分类共用一套） ---------- */
let _catPickCb = null;
function openCatPicker(title, items, curId, cb) {
  _catPickCb = cb || null;
  const tEl = document.getElementById('catPickTitle'); if (tEl) tEl.textContent = title || '选择分类';
  const list = document.getElementById('catPickList'); if (!list) return;
  list.innerHTML = (items || []).map(it => {
    const on = String(it.id) === String(curId);
    return `<div class="cat-pick-item${on ? ' on' : ''}" data-c="${_escAttr(it.id)}" onclick="pickCatItem('${_escAttr(it.id)}')">`
      + `<span class="cp-icon">${it.icon || '🏷️'}</span>`
      + `<span class="cp-name">${_escAttr(it.name)}</span>`
      + `<span class="cp-check">✓</span></div>`;
  }).join('');
  showModal('catPickModal');
}
function pickCatItem(id) {
  const cb = _catPickCb; _catPickCb = null;
  hideModal('catPickModal');
  if (cb) cb(id);
}

function renderAddList(filterText) {
  filterText = (filterText || '').trim().toLowerCase();
  const list = document.getElementById('addList');
  let html = '';
  const sfPending = [];   // v3.5.74 辅食下拉需在 innerHTML 落盘后回填选项与已选态

  ACTIVITIES.forEach(act => {
    if (hiddenActivities.includes(act.id)) return;
    if (!addModalCats.has(act.category)) return;   // v3.5.127 多选分类：只显示所选分类下的活动
    if (filterText && !act.name.toLowerCase().includes(filterText) && !act.icon.includes(filterText)) return;

    let inputsHtml = '';
    if (act.type === 'milk') {
      inputsHtml = `<div class="input-row"><label style="font-size:14px;color:#b2bec3;">开始:</label><div class="time-input-group"><input type="number" id="adinp_${act.id}_h" min="0" max="23" value="${String(new Date().getHours()).padStart(2,'0')}"><span>:</span><input type="number" id="adinp_${act.id}_m" min="0" max="59" value="${String(new Date().getMinutes()).padStart(2,'0')}"></div></div><div class="input-row"><label style="font-size:14px;color:#b2bec3;">奶量:</label><input type="number" step="1" min="1" id="adinp_${act.id}" value="${getDefaultMilkAmount()}"><span class="unit">ml</span></div><div class="input-row"><label style="font-size:14px;color:#b2bec3;">乳糖酶:</label><input type="number" step="1" min="0" id="adinp_${act.id}_lactase" value="${getDefaultLactase()}"><span class="unit">滴</span></div>`;
    } else if (act.type === 'sleep') {
      // 睡眠：开始时间 + 时长（X h Y min）
      inputsHtml = `<div class="input-row"><label style="font-size:14px;color:#b2bec3;">开始:</label><div class="time-input-group"><input type="number" id="adinp_${act.id}_h" min="0" max="23" value="${String(new Date().getHours()).padStart(2,'0')}"><span>:</span><input type="number" id="adinp_${act.id}_m" min="0" max="59" value="${String(new Date().getMinutes()).padStart(2,'0')}"></div></div><div class="input-row"><label style="font-size:14px;color:#b2bec3;">时长:</label><input type="number" min="0" id="adinp_${act.id}_dur_h" placeholder="0" style="width:50px;"><span class="unit">h</span><input type="number" min="0" max="59" id="adinp_${act.id}_dur_m" placeholder="0" style="width:50px;margin-left:8px;"><span class="unit">min</span></div>`;
    } else if (act.type === 'drinkWater') {
      // 喝水：时间
      inputsHtml = `<div class="input-row"><label style="font-size:14px;color:#b2bec3;">开始:</label><div class="time-input-group"><input type="number" id="adinp_${act.id}_h" min="0" max="23" value="${String(new Date().getHours()).padStart(2,'0')}"><span>:</span><input type="number" id="adinp_${act.id}_m" min="0" max="59" value="${String(new Date().getMinutes()).padStart(2,'0')}"></div></div>`;
    } else if (act.type === 'poop') {
      let po = ''; POOP_STATUS.forEach(ps => { po += `<label><input type="radio" name="adpoop_${act.id}" value="${ps.value}" ${ps.value==='正常'?'checked':''}> <span class="poop-icon ${ps.cls}">${ps.icon}</span>${ps.label}</label>`; });
      inputsHtml = `<div class="input-row"><label style="font-size:14px;color:#b2bec3;">开始:</label><div class="time-input-group"><input type="number" id="adinp_${act.id}_h" min="0" max="23" value="${String(new Date().getHours()).padStart(2,'0')}"><span>:</span><input type="number" id="adinp_${act.id}_m" min="0" max="59" value="${String(new Date().getMinutes()).padStart(2,'0')}"></div></div><div class="input-row radio-group">${po}</div>`;
    } else if (act.type === 'supplement') {
      const sug = getSupplementSuggestion();
      const dow = new Date().getDay(), isMWF = (dow===1||dow===3||dow===5);
      inputsHtml = `<div class="input-row"><label style="font-size:14px;color:#b2bec3;">开始:</label><div class="time-input-group"><input type="number" id="adinp_${act.id}_h" min="0" max="23" value="${String(new Date().getHours()).padStart(2,'0')}"><span>:</span><input type="number" id="adinp_${act.id}_m" min="0" max="59" value="${String(new Date().getMinutes()).padStart(2,'0')}"></div></div><div class="input-row checkbox-group"><label><input type="checkbox" name="adsup_${act.id}" value="AD" ${isMWF?'checked':''}> AD</label><label><input type="checkbox" name="adsup_${act.id}" value="D3"> D3</label></div><div class="input-row"><label style="font-size:14px;color:#b2bec3;">用量:</label><input type="number" step="1" min="1" id="adinp_${act.id}" value="1"><span class="unit">粒</span></div><div class="hint-text">建议选${sug}（与上次不同）</div>`;
    } else if (act.type === 'solidFood') {
      // v3.5.74 辅食：开始时间 + 食物（可搜索多选下拉）+ 克数 + 饭后正常/异常
      const _sh = String(new Date().getHours()).padStart(2,'0'), _sm = String(new Date().getMinutes()).padStart(2,'0');
      inputsHtml = `<div class="input-row"><label style="font-size:14px;color:#b2bec3;">开始:</label><div class="time-input-group"><input type="number" id="adinp_${act.id}_h" min="0" max="23" value="${_sh}"><span>:</span><input type="number" id="adinp_${act.id}_m" min="0" max="59" value="${_sm}"></div></div>`;
      inputsHtml += `<div class="input-row sf-row"><label class="sf-label">食物:</label>${sfPickerHtml('ad', act.id)}<input type="number" step="1" min="0" id="adinp_${act.id}" placeholder="0" class="sf-amt"><span class="unit">g</span></div>`;
      inputsHtml += `<div class="input-row sf-row sf-meal-row radio-group"><label class="sf-label">饭后:</label><label><input type="radio" name="admeal_${act.id}" value="正常" checked> 正常</label><label><input type="radio" name="admeal_${act.id}" value="异常"> 异常</label></div>`;
      sfPending.push({ p: 'ad', id: act.id, sel: [] });
    } else if (act.type === 'vaccine') {
      let vh = ''; VACCINE_OPTIONS.forEach(v => { vh += `<label><input type="checkbox" name="advac_${act.id}" value="${v}"> ${v}</label>`; });
      inputsHtml = `<div class="input-row"><label style="font-size:14px;color:#b2bec3;">开始:</label><div class="time-input-group"><input type="number" id="adinp_${act.id}_h" min="0" max="23" value="${String(new Date().getHours()).padStart(2,'0')}"><span>:</span><input type="number" id="adinp_${act.id}_m" min="0" max="59" value="${String(new Date().getMinutes()).padStart(2,'0')}"></div></div><div class="input-row checkbox-group">${vh}</div><div class="input-row"><label style="font-size:14px;color:#b2bec3;">第几剂:</label><input type="number" step="1" min="1" id="adinp_${act.id}" value="1"><span class="unit">剂</span></div>`;
    } else if (act.type === 'listenStory') {
      inputsHtml = `<div class="input-row"><label style="font-size:14px;color:#b2bec3;">开始:</label><div class="time-input-group"><input type="number" id="adinp_${act.id}_h" min="0" max="23" value="${String(new Date().getHours()).padStart(2,'0')}"><span>:</span><input type="number" id="adinp_${act.id}_m" min="0" max="59" value="${String(new Date().getMinutes()).padStart(2,'0')}"></div></div><div class="input-row checkbox-group"><label><input type="checkbox" name="adstory_${act.id}" value="中文"> 中文</label><label><input type="checkbox" name="adstory_${act.id}" value="英文"> 英文</label></div>`;
    } else if (act.type === 'grossMotor') {
      let gh = ''; grossMotorOptions.forEach(o => { gh += `<label><input type="checkbox" name="adgm_${act.id}" value="${o}"> ${o}</label>`; });
      inputsHtml = `<div class="input-row"><label style="font-size:14px;color:#b2bec3;">开始:</label><div class="time-input-group"><input type="number" id="adinp_${act.id}_h" min="0" max="23" value="${String(new Date().getHours()).padStart(2,'0')}"><span>:</span><input type="number" id="adinp_${act.id}_m" min="0" max="59" value="${String(new Date().getMinutes()).padStart(2,'0')}"></div></div><div class="input-row checkbox-group">${gh}</div>`;
    } else if (act.type === 'fineMotor') {
      let fh = ''; fineMotorOptions.forEach(o => { fh += `<label><input type="checkbox" name="adfm_${act.id}" value="${o}"> ${o}</label>`; });
      inputsHtml = `<div class="input-row"><label style="font-size:14px;color:#b2bec3;">开始:</label><div class="time-input-group"><input type="number" id="adinp_${act.id}_h" min="0" max="23" value="${String(new Date().getHours()).padStart(2,'0')}"><span>:</span><input type="number" id="adinp_${act.id}_m" min="0" max="59" value="${String(new Date().getMinutes()).padStart(2,'0')}"></div></div><div class="input-row checkbox-group">${fh}</div>`;
    } else if (act.type === 'duration') {
      inputsHtml = `<div class="input-row"><label style="font-size:14px;color:#b2bec3;">开始:</label><div class="time-input-group"><input type="number" id="adinp_${act.id}_h" min="0" max="23" value="${String(new Date().getHours()).padStart(2,'0')}"><span>:</span><input type="number" id="adinp_${act.id}_m" min="0" max="59" value="${String(new Date().getMinutes()).padStart(2,'0')}"></div></div><div class="input-row"><input type="number" step="0.1" id="adinp_${act.id}" placeholder="0"><span class="unit">${act.unit}</span></div>`;
    } else if (act.type === 'airButt') {
      inputsHtml = `<div class="input-row"><label style="font-size:14px;color:#b2bec3;">开始:</label><div class="time-input-group"><input type="number" id="adinp_${act.id}_h" min="0" max="23" value="${String(new Date().getHours()).padStart(2,'0')}"><span>:</span><input type="number" id="adinp_${act.id}_m" min="0" max="59" value="${String(new Date().getMinutes()).padStart(2,'0')}"></div></div><div class="input-row"><input type="number" step="0.1" id="adinp_${act.id}" placeholder="0"><span class="unit">分钟</span></div><div class="input-row"><label style="font-size:14px;color:#b2bec3;">屁股状态:</label><select id="adsel_${act.id}"><option value="正常">正常</option><option value="发红">发红</option><option value="红疹">红疹</option><option value="溃烂">溃烂</option></select></div>`;
    } else if (act.type === 'bath') {
      inputsHtml = `<div class="input-row"><label style="font-size:14px;color:#b2bec3;">开始:</label><div class="time-input-group"><input type="number" id="adinp_${act.id}_h" min="0" max="23" value="${String(new Date().getHours()).padStart(2,'0')}"><span>:</span><input type="number" id="adinp_${act.id}_m" min="0" max="59" value="${String(new Date().getMinutes()).padStart(2,'0')}"></div></div><div class="input-row"><label style="font-size:14px;color:#b2bec3;">使用沐浴露:</label><select id="adsel_${act.id}"><option value="无">无</option><option value="头发">头发</option><option value="身体">身体</option><option value="头发和身体">头发和身体</option></select></div>`;
    } else if (act.type === 'note') {
      inputsHtml = `<div class="input-row"><label style="font-size:14px;color:#b2bec3;">开始:</label><div class="time-input-group"><input type="number" id="adinp_${act.id}_h" min="0" max="23" value="${String(new Date().getHours()).padStart(2,'0')}"><span>:</span><input type="number" id="adinp_${act.id}_m" min="0" max="59" value="${String(new Date().getMinutes()).padStart(2,'0')}"></div></div>`;
    } else if (act.type === 'temperature') {
      inputsHtml = `<div class="input-row"><label style="font-size:14px;color:#b2bec3;">开始:</label><div class="time-input-group"><input type="number" id="adinp_${act.id}_h" min="0" max="23" value="${String(new Date().getHours()).padStart(2,'0')}"><span>:</span><input type="number" id="adinp_${act.id}_m" min="0" max="59" value="${String(new Date().getMinutes()).padStart(2,'0')}"></div></div><div class="input-row"><input type="number" step="0.1" id="adinp_${act.id}" placeholder="36.5" oninput="addTempIndicator('${act.id}')"><span class="unit">℃</span><span class="temp-indicator-inline" id="adtemp_${act.id}"></span></div>`;
    } else if (act.type === 'simple') {
      inputsHtml = `<div class="input-row"><label style="font-size:14px;color:#b2bec3;">开始:</label><div class="time-input-group"><input type="number" id="adinp_${act.id}_h" min="0" max="23" value="${String(new Date().getHours()).padStart(2,'0')}"><span>:</span><input type="number" id="adinp_${act.id}_m" min="0" max="59" value="${String(new Date().getMinutes()).padStart(2,'0')}"></div></div>`;
    }

    // 每项活动统一附带多行备注输入框
    const notePh = act.type === 'note' ? '记录内容（支持多行）' : '备注（可选，支持多行）';
    inputsHtml += `<div class="input-row add-note-row"><textarea id="adnote_${act.id}" rows="2" placeholder="${notePh}"></textarea></div>`;

    const isChecked = addSelectedSet.has(act.id);
    html += `<div class="add-item"><div class="add-check${isChecked?' checked':''}" data-id="${act.id}" onclick="toggleAddSelect('${act.id}')">${isChecked?'\u2713':''}</div><div class="add-body"><div class="add-name">${act.icon} ${act.name}</div><div class="add-inputs${isChecked?' show':''}" id="adinputs_${act.id}">${inputsHtml}</div></div></div>`;
  });

  if (!html) html = '<div style="text-align:center;color:#636e72;padding:24px 0;font-size:15px;">没有匹配的活动</div>';
  list.innerHTML = html;
  // 辅食食物下拉：落盘后再填充选项列表并回填已选
  sfPending.forEach(x => sfInit(x.p, x.id, x.sel));
}

function filterAddList() {
  const val = document.getElementById('addSearchInput').value;
  renderAddList(val);
}

function toggleAddSelect(id) {
  const ck = document.querySelector(`.add-check[data-id="${id}"]`);
  const inp = document.getElementById(`adinputs_${id}`);
  if (ck.classList.contains('checked')) {
    ck.classList.remove('checked'); ck.textContent = '';
    if (inp) inp.classList.remove('show');
    addSelectedSet.delete(id);
  } else {
    ck.classList.add('checked'); ck.textContent = '\u2713';
    if (inp) inp.classList.add('show');
    addSelectedSet.add(id);
  }
}
function addTempIndicator(id) {
  const inp = document.getElementById(`adinp_${id}`), ind = document.getElementById(`adtemp_${id}`);
  if (!inp || !ind) return; const v = parseFloat(inp.value);
  if (isNaN(v)) { ind.innerHTML = ''; return; }
  ind.innerHTML = v <= 37.5 ? '<span class="temp-normal">&#9679;</span>' : '<span class="temp-high">&#9888;</span>';
}

/* ==================== 确定添加 ==================== */
function confirmAdd() {
  if (addSelectedSet.size === 0) { showToast('请至少选择一项活动'); return; }
  const target = _addTargetDate || getTodayDateStr();
  const records = getRecordsByDate(target);
  const now = new Date(), timeStr = now.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }), ts = Date.now();
  const newestIds = [];

  addSelectedSet.forEach(id => {
    const act = ACTIVITIES.find(a => a.id === id); if (!act) return;

    // 获取时刻（DOM中可能不存在，使用默认值）
    let recTime = timeStr;
    const hEl = document.getElementById(`adinp_${id}_h`);
    const mEl = document.getElementById(`adinp_${id}_m`);
    if (hEl && mEl) {
      const hh = String(parseInt(hEl.value) || 0).padStart(2, '0');
      const mm = String(parseInt(mEl.value) || 0).padStart(2, '0');
      recTime = hh + ':' + mm;
    }

    const record = { type: id, name: act.name, time: timeStr, recTime: recTime, timestamp: ts, updatedAt: Date.now() };

    if (act.type === 'milk') {
      record.milkTime = recTime;
      const el = document.getElementById(`adinp_${id}`); const _mv = el ? parseFloat(String(el.value).trim()) : NaN; record.milkAmount = (!isNaN(_mv) && Math.round(_mv) > 0) ? Math.max(1, Math.round(_mv)) : getDefaultMilkAmount();
      // 乳糖酶：>=0 整数、不能为空，非法/空时回退到管理弹窗默认值
      const lel = document.getElementById(`adinp_${id}_lactase`); const _lv = lel ? parseInt(String(lel.value).trim(), 10) : NaN; record.lactase = (!isNaN(_lv) && _lv >= 0) ? _lv : getDefaultLactase();
    } else if (act.type === 'sleep') {
      record.sleepStartTime = recTime;
      const dhEl = document.getElementById(`adinp_${id}_dur_h`); const dmEl = document.getElementById(`adinp_${id}_dur_m`);
      const dh = (dhEl && !isNaN(parseInt(dhEl.value))) ? parseInt(dhEl.value) : 0;
      const dm = (dmEl && !isNaN(parseInt(dmEl.value))) ? parseInt(dmEl.value) : 0;
      record.duration = dh * 60 + dm;
    } else if (act.type === 'drinkWater') {
      record.drinkTime = recTime;
    } else if (act.type === 'poop') {
      record.poopTime = recTime;
      const rds = document.getElementsByName(`adpoop_${id}`); for (const r of rds) { if (r.checked) { record.poopStatus = r.value; break; } }
    } else if (act.type === 'supplement') {
      const cbs = document.getElementsByName(`adsup_${id}`); const types = []; for (const cb of cbs) { if (cb.checked) types.push(cb.value); }
      record.supplementTypes = types.length > 0 ? types : ['AD'];
      record.supplementTime = recTime;
      const el = document.getElementById(`adinp_${id}`); record.supplementAmount = (el && !isNaN(parseInt(el.value))) ? Math.max(1, parseInt(el.value)) : 1;
    } else if (act.type === 'solidFood') {
      record.solidFoodTime = recTime;
      record.solidFoods = sfGetSelection('ad', id);
      const el = document.getElementById(`adinp_${id}`); const _sv = el ? parseFloat(String(el.value).trim()) : NaN;
      record.solidFoodAmount = (!isNaN(_sv) && _sv > 0) ? Math.round(_sv) : 0;
      const rds = document.getElementsByName(`admeal_${id}`); let _meal = '正常'; for (const r of rds) { if (r.checked) { _meal = r.value; break; } }
      record.afterMeal = _meal;
    } else if (act.type === 'vaccine') {
      const cbs = document.getElementsByName(`advac_${id}`); const types = []; for (const cb of cbs) { if (cb.checked) types.push(cb.value); }
      record.vaccineTypes = types; record.vaccineTime = recTime;
      const el = document.getElementById(`adinp_${id}`); record.vaccineDose = (el && !isNaN(parseInt(el.value))) ? Math.max(1, parseInt(el.value)) : 1;
    } else if (act.type === 'listenStory') {
      const cbs = document.getElementsByName(`adstory_${id}`); const langs = []; for (const cb of cbs) { if (cb.checked) langs.push(cb.value); }
      record.storyLangs = langs.length > 0 ? langs : ['中文'];
      record.storyTime = recTime;
    } else if (act.type === 'grossMotor') {
      const cbs = document.getElementsByName(`adgm_${id}`); const items = []; for (const cb of cbs) { if (cb.checked) items.push(cb.value); }
      record.grossMotorItems = items; record.grossMotorTime = recTime;
    } else if (act.type === 'fineMotor') {
      const cbs = document.getElementsByName(`adfm_${id}`); const items = []; for (const cb of cbs) { if (cb.checked) items.push(cb.value); }
      record.fineMotorItems = items; record.fineMotorTime = recTime;
    } else if (act.type === 'duration') { const el = document.getElementById(`adinp_${id}`); record.duration = (el && !isNaN(parseFloat(el.value))) ? parseFloat(el.value) : 0; record.durationTime = recTime; }
    else if (act.type === 'airButt') { const el = document.getElementById(`adinp_${id}`); record.duration = (el && !isNaN(parseFloat(el.value))) ? parseFloat(el.value) : 0; const sel = document.getElementById(`adsel_${id}`); record.level = sel ? sel.value : '正常'; record.airButtTime = recTime; }
    else if (act.type === 'bath') { const sel = document.getElementById(`adsel_${id}`); record.shampoo = sel ? sel.value : '无'; record.bathTime = recTime; }
    else if (act.type === 'note') { record.noteTime = recTime; }
    else if (act.type === 'temperature') { const el = document.getElementById(`adinp_${id}`); const v = (el && !isNaN(parseFloat(el.value))) ? parseFloat(el.value) : 0; record.temperature = v; record.tempStatus = v <= 37.5 ? 'normal' : 'high'; record.tempTime = recTime; }
    else if (act.type === 'simple') { record.simpleTime = recTime; }

    // 统一读取备注（所有活动类型均支持）
    const noteEl = document.getElementById(`adnote_${id}`);
    record.note = (noteEl && noteEl.value.trim()) ? noteEl.value.trim() : '';

    records.push(record); newestIds.push(id);
  });

  persistRecords(records, target);
  addSelectedSet = new Set();
  hideModal('addModal');
  // 只有添加到今天时才渲染今日卡片（否则历史日期的记录不该出现在今日列表）
  if (target === getTodayDateStr()) { try { renderCards(newestIds); } catch (e) {} }
  afterRecordChange(target);
  showToast(`已添加 ${newestIds.length} 条记录到 ${target}`);
}

/* ==================== 语音速记 ==================== */
// 中文数字转数值（支持 一百三十 / 两百五 / 三十八点五 / 三十八度五）
function cnNum(s) {
  if (s === null || s === undefined) return null;
  s = String(s).trim();
  if (!s) return null;
  if (/^\d+(?:\.\d+)?$/.test(s)) return parseFloat(s);
  s = s.replace(/度/g, '点');
  if (!/^[零一二两三四五六七八九十百千万点]+$/.test(s)) return null;
  const D = { '零':0,'一':1,'二':2,'两':2,'三':3,'四':4,'五':5,'六':6,'七':7,'八':8,'九':9 };
  const parts = s.split('点');
  function intOf(p) {
    if (!p) return 0;
    let total = 0, num = 0;
    for (const ch of p) {
      if (D[ch] !== undefined && ch !== '零') { num = D[ch]; }
      else if (ch === '十') { total += (num || 1) * 10; num = 0; }
      else if (ch === '百') { total += (num || 1) * 100; num = 0; }
      else if (ch === '千') { total += (num || 1) * 1000; num = 0; }
      else if (ch === '万') { total = (total + num) * 10000; num = 0; }
    }
    return total + num;
  }
  let r = intOf(parts[0]);
  if (parts[1]) { let dec = 0, sc = 0.1; for (const ch of parts[1]) { if (D[ch] === undefined) break; dec += D[ch] * sc; sc /= 10; } r += dec; }
  return r;
}
// 时长解析 → 分钟（"一小时二十分钟"→80 "半小时"→30 "两小时"→120 "90分钟"→90
//             "7小时3"→423 [口语省略"分"字，数字 <60 视为分钟，仅对时长型规则宽松匹配]）
function parseDurationMin(seg) {
  const N = '(\\d+(?:\\.\\d+)?|[零一二两三四五六七八九十百千]+)';
  const re = new RegExp(N + '(个半)?(小时|钟头|分钟|分)(?![钟])|半小时', 'g');
  let total = 0, found = false, m;
  while ((m = re.exec(seg)) !== null) {
    found = true;
    if (m[0] === '半小时') { total += 30; continue; }
    const n = cnNum(m[1]); if (n === null) { continue; }
    if (m[2] === '个半') { total += n * 60 + 30; }
    else if (m[3] === '小时' || m[3] === '钟头') {
      total += n * 60;
      if (/^\s*半/.test(seg.slice(m.index + m[0].length))) total += 30;
    } else { total += n; }
  }
  // 回退：若 seg 含"X小时"且后面紧跟 < 60 的纯数字（口语省略"分"字），将该数字计入分钟
  if (!found) return null;
  const hbMatch = seg.match(new RegExp(N + '\\s*(?:小时|钟头)(?!分钟|钟头)'));
  if (hbMatch) {
    const after = seg.slice(hbMatch.index + hbMatch[0].length);
    const minMatch = after.match(/^\s*(\d+|[零一二两三四五六七八九十]+)/);
    if (minMatch) {
      const minN = cnNum(minMatch[1]);
      if (minN !== null && minN < 60 && minN >= 0) {
        total += minN;
      }
    }
  }
  return Math.round(total);
}
// 时长型活动(sleep/outdoor/airButt)的"裸数字时长"解析：口语常省略单位（"户外活动40"→40分钟）
// 必须先剔除时刻表达（15:30 / 下午3点半 / 三点十五），避免把开始时刻误当时长
function parseBareDurationMin(zone) {
  let s = String(zone || '');
  s = s.replace(/(凌晨|早上|上午|中午|下午|傍晚|晚上)?\s*\d{1,2}\s*[:：]\s*\d{1,2}/g, ' ');                       // 15:30
  s = s.replace(/(凌晨|早上|上午|中午|下午|傍晚|晚上)\s*\d{1,2}\s*(?:[点时]\s*(?:半|一刻|\d{1,2}|[零一二三四五六七八九十]+)?)?/g, ' '); // 下午3点半
  s = s.replace(/\d{1,2}\s*[点时]\s*(?:半|一刻|\d{1,2}|[零一二三四五六七八九十]+)?/g, ' ');                        // 3点半/3点15/3点
  s = s.replace(/[零一二两三四五六七八九十]+\s*[点时]\s*(?:半|一刻|[零一二三四五六七八九十]+)?/g, ' ');            // 三点半/三点十五
  const N = '(\\d+(?:\\.\\d+)?|[零一二两三四五六七八九十百千]+)';
  const m = s.match(new RegExp(N));
  if (!m) return null;
  const n = cnNum(m[1]);
  if (n === null || n <= 0 || n > 720) return null;   // 裸数字合理性：1~720分钟(12h)
  return n;
}
function parseDurationLoose(zone) {                      // 带单位优先，裸数字兜底
  const d = parseDurationMin(zone);
  return d !== null ? d : parseBareDurationMin(zone);
}
// 体温解析（"38度5"/"三十八度五"/"38.5度" → 38.5）
function parseTempNum(seg) {
  const N = '(\\d+(?:\\.\\d+)?|[零一二两三四五六七八九十百]+)';
  let v = null, m;
  if ((m = seg.match(new RegExp(N + '\\s*[度]\\s*' + N + '(?!\\s*(?:分钟|小时|粒|针|ml|毫升))')))) {
    const a = cnNum(m[1]), b = cnNum(m[2]);
    if (a !== null && b !== null && b < 10) v = a + b / 10;
  }
  if (v === null && (m = seg.match(new RegExp(N + '\\s*[点]\\s*' + N)))) {
    const a = cnNum(m[1]), b = cnNum(m[2]);
    if (a !== null && b !== null && b < 10) v = a + b / 10;
  }
  if (v === null && (m = seg.match(new RegExp(N + '\\s*[度℃]')))) v = cnNum(m[1]);
  if (v === null && (m = seg.match(/(3\d\.\d)/))) v = parseFloat(m[1]);
  if (v === null || isNaN(v) || v < 34 || v > 43) return null;
  return Math.round(v * 10) / 10;
}
// 相对/绝对时刻解析 → {h, m} 或 null（"半小时前"/"两点半"/"下午3点15分"）
function parseVoiceTimeHint(seg) {
  const N = '(\\d{1,2}|[零一二两三四五六七八九十]+)';
  let m, min = null;
  if (/半小时前/.test(seg)) min = 30;
  if (min === null) {
    if ((m = seg.match(new RegExp(N + '\\s*个?小时(?:钟头)?(?:之|以)?前')))) { const n = cnNum(m[1]); if (n !== null) min = n * 60; }
    else if ((m = seg.match(new RegExp(N + '\\s*分钟(?:之|以)?前|' + N + '\\s*分前')))) { const n = cnNum(m[1]); if (n !== null) min = n; }
    else if (/刚才|刚刚/.test(seg)) min = 0;
  }
  const now = new Date();
  if (min !== null) {
    const t = new Date(now.getTime() - min * 60000);
    return { h: t.getHours(), m: t.getMinutes() };
  }
  // 绝对时刻："下午三点半"/"晚上8点"/"两点半"/"15:20"
  const AMPM = '(凌晨|早上|上午|中午|下午|傍晚|晚上)?';
  let T_RE;
  try { T_RE = new RegExp(AMPM + N + '\\s*(?:点|:|(?<!小)时)\\s*(半|三|一刻|右|\\d{1,2}|[一二三四五六十]+)?\\s*分?', ''); }
  catch (e) { T_RE = new RegExp(AMPM + N + '\\s*(?:点|:)\\s*(半|三|一刻|右|\\d{1,2}|[一二三四五六十]+)?\\s*分?', ''); }
  if ((m = seg.match(T_RE))) {
    let h = cnNum(m[2]); if (h === null) return null;
    let mm = 0;
    if (m[3] === '半') mm = 30; else if (m[3] === '三') mm = 15; else if (m[3] === '一刻') mm = 15;
    else if (m[3]) { const x = cnNum(m[3]); mm = (x !== null && x < 60) ? x : 0; }
    const ap = m[1];
    if (ap === '下午' || ap === '傍晚' || ap === '晚上') { if (h < 12) h += 12; }
    else if (ap === '中午') { if (h < 11) h += 12; }
    else if (ap === '凌晨' || ap === '早上' || ap === '上午') { if (h === 12) h = 0; }
    else {
      // 无上下午前缀：取不超过当前时刻且最近的解释（录的是刚发生的事）
      const nowMin = now.getHours() * 60 + now.getMinutes();
      const c1 = h * 60 + mm, c2 = (h + 12) * 60 + mm;
      const cands = [c1, c2].filter(c => c <= nowMin + 1);
      const pick = cands.length ? Math.max(...cands) : Math.min(c1, c2);
      return { h: Math.floor(pick / 60), m: pick % 60 };
    }
    if (h > 23 || mm > 59) return null;
    return { h, m: mm };
  }
  return null;
}
function voiceNowHM() { const n = new Date(); return String(n.getHours()).padStart(2, '0') + ':' + String(n.getMinutes()).padStart(2, '0'); }

// 语音规则表（顺序即优先级；每条返回 record 就绪的参数字段，与 confirmAdd 字段一一对应）
const VOICE_RULES = [
  { id: 'vaccine', re: /疫苗|接种|打了?(?:一针|加强针)|乙肝|五联|轮状|肺炎|流脑|麻塞风|麻腮风|水痘|甲肝|手足口/,
    parse: (zone) => {
      const types = [];
      [['乙肝','乙肝'],['五联','五联'],['轮状','轮状病毒'],['肺炎','肺炎'],['流脑','流脑'],['麻塞风','麻塞风'],['麻腮风','麻塞风'],['水痘','水痘'],['甲肝','甲肝'],['手足口','手足口']]
        .forEach(([kw, val]) => { if (zone.includes(kw) && !types.includes(val)) types.push(val); });
      let dose = 1; const dm = zone.match(/([一二两三四五六七八九十]|\d+)\s*[针剂]/); if (dm) { const n = cnNum(dm[1]); if (n !== null && n >= 1 && n <= 10) dose = n; }
      return { params: { vaccineTypes: types, vaccineDose: dose }, warn: types.length === 0 };
    } },
  { id: 'supplement', re: /AD|ad|Ad|维D|维生素\s*[ADad]|D3|d3|鱼肝油|补剂/,
    parse: (zone) => {
      const types = [];
      if (/AD|ad|Ad|维生素\s*[ADad]|鱼肝油/.test(zone)) types.push('AD');
      if (/D3|d3|维D/.test(zone) && !types.includes('D3')) types.push('D3');
      let amount = 1; const am = zone.match(/([一二两三四五六七八九十]|\d+)\s*[粒颗滴]/); if (am) { const n = cnNum(am[1]); if (n !== null && n >= 1 && n <= 10) amount = n; }
      return { params: { supplementTypes: types.length ? types : ['AD'], supplementAmount: amount } };
    } },
  { id: 'solidFood', re: /辅食|米粉|米糊|果泥|肉泥|菜泥|蛋黄|米饼|磨牙棒|添加\s*辅食|(?:吃了?|喂了?|给的?)\s*(?:米糊|米粉|果泥|肉泥|菜泥|蛋黄|高铁|南瓜|土豆|红薯|紫薯|山药|胡萝卜|西兰花|白菜|油菜|苹果|香蕉|梨|牛油果|猕猴桃|西瓜|冬瓜|黄瓜|莴苣|西红柿|茄子|香菇|玉米|小米|豆腐|猪肝|鸡蛋|猪肉|牛肉|羊肉|鸡肉|鱼|虾)/,
    parse: (zone) => {
      const foods = [];
      getSolidFoodOptions().forEach(f => { if (zone.includes(f) && !foods.includes(f)) foods.push(f); });
      [['米糊','高铁米粉'],['米粉','高铁米粉'],['蛋黄','鸡蛋'],['鸡肉泥','鸡肉'],['猪肉泥','猪肉']]
        .forEach(([kw, val]) => { if (zone.includes(kw) && !foods.includes(val)) foods.push(val); });
      let amount = 0;
      const am = zone.match(/(\d+(?:\.\d+)?)\s*(?:g|克)(?![0-9])/);
      if (am) { const n = parseFloat(am[1]); if (!isNaN(n) && n >= 0) amount = Math.round(n); }
      let meal = '正常';
      if (/异常|过敏|起疹|红疹|吐了|呕吐|不舒服|拉肚|腹泻/.test(zone)) meal = '异常';
      return { params: { solidFoods: foods, solidFoodAmount: amount, afterMeal: meal }, warn: foods.length === 0 };
    } },
  { id: 'temperature', re: /体温|发烧|额温|耳温|烧到|发低烧|低烧|高烧|有点烧/,
    parse: (zone) => {
      const v = parseTempNum(zone);
      return v === null ? { params: {}, warn: true } : { params: { temperature: v, tempStatus: v <= 37.5 ? 'normal' : 'high' } };
    } },
  { id: 'poop', re: /拉肚子|腹泻|大便|拉屎|拉臭|臭臭|便便|粑粑|排便|便血|青屎|拉了|拉粑/,
    parse: (zone) => {
      let st = '正常';
      if (/拉肚|腹泻|稀/.test(zone)) st = '拉肚子';
      else if (/青|绿/.test(zone)) st = '青屎';
      else if (/血/.test(zone)) st = '便血';
      return { params: { poopStatus: st } };
    } },
  { id: 'milk', re: /喂奶|喝[了完]?奶|吃[了完]?奶|毫升奶|奶粉|奶喝完|亲喂|乳糖酶/,
    parse: (zone) => {
      let amount = null;
      const re = /(\d+(?:\.\d+)?|[零一二两三四五六七八九十百千]+)/g; let m;
      while ((m = re.exec(zone)) !== null) {
        const after = zone.slice(m.index + m[0].length, m.index + m[0].length + 3);
        const before = zone.slice(Math.max(0, m.index - 1), m.index);
        // 时间/体温数字不算奶量：数字后跟 点/时/冒号/度(16:50的"16"、16点50的"16"、38.5度)、
        // 数字前是 冒号/点/时(16:50的"50"、16点50的"50")、前是"度"
        if (/^[点时:度]/.test(after) || /[:点时]/.test(before) || /度/.test(before)) continue;
        const n = cnNum(m[0]);
        if (n !== null && n >= 20 && n <= 400) { amount = Math.round(n); break; }
      }
      // 乳糖酶：优先「乳糖酶N」，其次「N滴」
      let lactase = null;
      const lm = zone.match(/乳糖酶[^0-9]{0,4}(\d+(?:\.\d+)?)/);
      if (lm) lactase = Math.round(parseFloat(lm[1]));
      else { const dm = zone.match(/(\d+(?:\.\d+)?)\s*滴/); if (dm) lactase = Math.round(parseFloat(dm[1])); }
      const params = { milkAmount: amount === null ? getDefaultMilkAmount() : amount };
      if (lactase !== null) params.lactase = lactase;
      // 仅当奶量与乳糖酶都没听清时才标记待补
      return { params, warn: amount === null && lactase === null };
    } },
  { id: 'sleep', re: /睡着了|睡觉了?|睡了|小睡|午睡|睡了一|睡眠|哄睡|补觉/,
    parse: (zone, ctx) => {
      let d = parseDurationLoose(zone);
      // 跨段回填：本段没找到时长时，从未匹配段池子里找一段带时长的附加进来
      if (d === null && ctx && Array.isArray(ctx.pool) && ctx.pool.length) {
        for (let i = 0; i < ctx.pool.length; i++) {
          const ex = parseDurationMin(ctx.pool[i]);
          if (ex !== null) { const consumedSeg = ctx.pool.splice(i, 1)[0]; if (ctx.consumed) ctx.consumed.add(consumedSeg); d = ex; break; }
        }
      }
      return d === null ? { params: { duration: 0 }, warn: true } : { params: { duration: d } };
    } },
  { id: 'outdoor', re: /户外|出门|出去了?玩?|遛弯|散步|晒太阳|外面[耍玩]/,
    parse: (zone, ctx) => {
      let d = parseDurationLoose(zone);
      if (d === null && ctx && Array.isArray(ctx.pool) && ctx.pool.length) {
        for (let i = 0; i < ctx.pool.length; i++) {
          const ex = parseDurationMin(ctx.pool[i]);
          if (ex !== null) { const consumedSeg = ctx.pool.splice(i, 1)[0]; if (ctx.consumed) ctx.consumed.add(consumedSeg); d = ex; break; }
        }
      }
      return d === null ? { params: { duration: 0 }, warn: true } : { params: { duration: d } };
    } },
  { id: 'bath', re: /洗澡|沐浴|洗了?个澡/,
    parse: (zone) => ({ params: { shampoo: /沐浴露|洗发|洗头|香波/.test(zone) ? '头发和身体' : '无' } }) },
  { id: 'listenStory', re: /听故事|讲故事|故事/,
    parse: (zone) => {
      const langs = [];
      if (/英文|英语/.test(zone)) langs.push('英文');
      if (/中文|国语|普通话/.test(zone) || langs.length === 0) langs.push('中文');
      return { params: { storyLangs: langs } };
    } },
  { id: 'readBook', re: /读书|看书|绘本|亲子阅读|讲书/, parse: () => ({ params: {} }) },
  { id: 'listenMusic', re: /听歌|听音乐|音乐|儿歌/, parse: () => ({ params: {} }) },
  { id: 'drinkWater', re: /喝水|喂水|喝了?点水/, parse: () => ({ params: {} }) },
  { id: 'airButt', re: /晾屁/,
    parse: (zone, ctx) => {
      let d = parseDurationLoose(zone);
      if (d === null && ctx && Array.isArray(ctx.pool) && ctx.pool.length) {
        for (let i = 0; i < ctx.pool.length; i++) {
          const ex = parseDurationMin(ctx.pool[i]);
          if (ex !== null) { const consumedSeg = ctx.pool.splice(i, 1)[0]; if (ctx.consumed) ctx.consumed.add(consumedSeg); d = ex; break; }
        }
      }
      let level = '正常';
      if (/发红/.test(zone)) level = '发红'; else if (/红疹|疹/.test(zone)) level = '红疹'; else if (/溃烂|破/.test(zone)) level = '溃烂';
      return { params: { duration: d === null ? 0 : d, level } };
    } },
  { id: 'wash', re: /洗手|洗脸|洗了?手脸/, parse: () => ({ params: {} }) },
  { id: 'cleanNose', re: /鼻涕|擤鼻|清理鼻子?/, parse: () => ({ params: {} }) },
  { id: 'cutNails', re: /剪指甲|指甲/, parse: (zone) => ({ params: { note: zone } }) },
  { id: 'grossMotor', re: /大运动|抬头|翻身|会爬|练爬|爬了|爬行|会坐|坐稳|练坐|会站|扶站|站起|练站|走路|学步|会走|跑步|会跑/,
    parse: (zone) => {
      const items = [];
      grossMotorOptions.forEach(o => { if (zone.includes(o) && !items.includes(o)) items.push(o); });
      const map = { '抬头':'会抬头','翻身':'会翻身','爬':'会爬','坐':'会坐','站':'会站','走路':'会走路','跑':'会跑步' };
      Object.keys(map).forEach(k => { if (new RegExp('(?:会|练|在|刚)?' + k).test(zone) && !items.includes(map[k])) items.push(map[k]); });
      return { params: { grossMotorItems: items }, warn: items.length === 0 };
    } },
  { id: 'fineMotor', re: /精细动作|抓握|摇头|点头|挥手|放东西|捏|戳|对拍/,
    parse: (zone) => {
      const items = [];
      fineMotorOptions.forEach(o => { if (zone.includes(o) && !items.includes(o)) items.push(o); });
      return { params: { fineMotorItems: items }, warn: items.length === 0 };
    } },
  { id: 'learnLanguage', re: /学语言|学说话/, parse: (zone) => ({ params: { note: zone } }) },
  { id: 'learnLogic', re: /学逻辑/, parse: (zone) => ({ params: { note: zone } }) },
];

function parseVoiceText(text) {
  const items = []; const unmatched = [];
  // 跨段回填池：把"无规则命中但有语义的段"（如"7小时3"）暂存，供 sleep/outdoor/airButt 等时长型规则在自身没找到时长时回填
  const crossSegPool = [];
  // 已消费的段：被跨段回填用掉的段不应再 unmatched（避免误报"未识别"）
  const consumedSegs = new Set();
  const segs = [];
  String(text || '').split(/[\n，,。；;！!？?、]+/).forEach(s => {
    s.split(/然后|接着|再然后/).forEach(x => { x = x.trim(); if (x) segs.push(x); });
  });
  // 先预扫描：把所有 seg 中"无规则命中但有可解析时长"的段提前入池（这样 seg 1 处理时也能看到 seg 2+ 的候选项）
  segs.forEach(seg => {
    let hitCount = 0;
    VOICE_RULES.forEach(r => { const re = new RegExp(r.re.source); if (re.test(seg)) hitCount++; });
    if (hitCount === 0 && parseDurationMin(seg) !== null) crossSegPool.push(seg);
  });
  segs.forEach(seg => {
    const hits = [];
    VOICE_RULES.forEach(r => {
      const re = new RegExp(r.re.source, 'g'); let mm;
      while ((mm = re.exec(seg)) !== null) { hits.push({ rule: r, idx: mm.index }); if (mm.index === re.lastIndex) re.lastIndex++; }
    });
    const seen = new Set(); const uniq = [];
    hits.sort((a, b) => a.idx - b.idx).forEach(h => { if (!seen.has(h.rule.id)) { seen.add(h.rule.id); uniq.push(h); } });
    // 只对"完全无规则命中且未被跨段回填消费"的段进 unmatched
    if (uniq.length === 0) { if (!consumedSegs.has(seg)) unmatched.push(seg); return; }
    let segOk = false;
    uniq.forEach((h, i) => {
      const zone = seg.slice(h.idx, i + 1 < uniq.length ? uniq[i + 1].idx : seg.length);
      // 单活动时整段解析（关键词前的参数如"听英文故事"的"英文"不丢失）；多活动时仅本区间
      const parseZone = uniq.length === 1 ? seg : zone;
      // 时长型规则（sleep / outdoor / airButt）传入 ctx 用于跨段时长回填与消费追踪
      const needsDuration = (h.rule.id === 'sleep' || h.rule.id === 'outdoor' || h.rule.id === 'airButt');
      const parsed = h.rule.parse(parseZone, needsDuration ? { pool: crossSegPool, consumed: consumedSegs } : undefined);
      if (!parsed) return;
      segOk = true;
      const act = ACTIVITIES.find(a => a.id === h.rule.id);
      // 单活动时时间提示可在整段任意位置；多活动时仅限本活动区间
      const th = parseVoiceTimeHint(uniq.length === 1 ? seg : zone);
      let recTime = th ? (String(th.h).padStart(2, '0') + ':' + String(th.m).padStart(2, '0')) : null;
      // 时长类活动（睡眠/户外/晾屁股）说了时长没说时刻 → 开始时刻回推
      if (!recTime && parsed.params && parsed.params.duration > 0 && (act.type === 'sleep' || act.type === 'duration' || act.type === 'airButt')) {
        const t = new Date(Date.now() - parsed.params.duration * 60000);
        recTime = String(t.getHours()).padStart(2, '0') + ':' + String(t.getMinutes()).padStart(2, '0');
      }
      if (!recTime) recTime = voiceNowHM();
      items.push({ actId: h.rule.id, icon: act.icon, name: act.name, params: parsed.params || {}, recTime, warn: !!parsed.warn, zone });
    });
    if (!segOk) unmatched.push(seg);
  });

  // ===== v3.5.21 数值参数回填：语音被标点切分后，纯数值段(如"36.5""130")无法被任何规则命中 =====
  // 但它很可能是前一个活动的参数（体温值/奶量/时长），尝试回填到前一个 item 的 params 里
  if (unmatched.length > 0 && items.length > 0) {
    const backfillIdx = [];
    unmatched.forEach((seg, ui) => {
      const trimmed = seg.trim();
      if (!trimmed) return;
      const last = items[items.length - 1];
      let filled = false;

      // 体温回填：parseTempNum 能识别 "36.5" / "38度5" / "38点5" 等
      if (last.actId === 'temperature' && last.params.temperature === undefined) {
        const tv = parseTempNum(trimmed);
        if (tv !== null) {
          last.params.temperature = tv;
          last.params.tempStatus = tv <= 37.5 ? 'normal' : 'high';
          if (last.warn) last.warn = false; // 原本 warn=true(缺体温)，现已补全
          filled = true;
        }
      }

      // 奶量回填：纯数字 20-400
      if (!filled && last.actId === 'milk' && last.params.milkAmount === undefined) {
        const mn = cnNum(trimmed);
        if (mn !== null && mn >= 20 && mn <= 400) {
          last.params.milkAmount = Math.round(mn);
          if (last.warn) last.warn = false;
          filled = true;
        }
      }

      // 时长回填：sleep / outdoor / airButt 缺 duration 时
      if (!filled && (last.actId === 'sleep' || last.actId === 'outdoor' || last.actId === 'airButt')
          && last.params.duration !== undefined && last.params.duration === 0) {
        const dv = parseDurationLoose(trimmed);
        if (dv !== null && dv > 0) {
          last.params.duration = dv;
          if (last.warn) last.warn = false;
          filled = true;
        }
      }

      if (filled) backfillIdx.push(ui);
    });
    // 从 unmatched 中移除已成功回填的段（倒序删除避免索引偏移）
    backfillIdx.sort((a, b) => b - a).forEach(ui => unmatched.splice(ui, 1));
  }

  return { items, unmatched: unmatched.join('；') };
}

// ---- 语音 UI 与识别（按住说话） ----
let voiceRecog = null, voiceRecActive = false, voiceFinalText = '', voiceItems = [];

// ========== 讯飞语音听写（流式版 WebAPI，浏览器 WebSocket 直连，国内可用） ==========
function getXfyunConfig() {
  const appid = localStorage.getItem('xfyun_appid');
  const apiKey = localStorage.getItem('xfyun_api_key');
  const apiSecret = localStorage.getItem('xfyun_api_secret');
  // 本地有自定义配置则优先；否则回退到 app-config.js 的默认值（无需每次填写）
  if (appid && apiKey && apiSecret) return { appid: appid, apiKey: apiKey, apiSecret: apiSecret };
  if (_DEFAULT_XFYUN && _DEFAULT_XFYUN.appid && _DEFAULT_XFYUN.apiKey && _DEFAULT_XFYUN.apiSecret) {
    return { appid: _DEFAULT_XFYUN.appid, apiKey: _DEFAULT_XFYUN.apiKey, apiSecret: _DEFAULT_XFYUN.apiSecret };
  }
  return null;
}
function saveXfyunConfig() {
  const appid = document.getElementById('xfAppidInput').value.trim();
  const apiKey = document.getElementById('xfApiKeyInput').value.trim();
  const apiSecret = document.getElementById('xfApiSecretInput').value.trim();
  // 三个都留空/保持掩码原样 = 使用 app-config.js 默认值，清除本地自定义
  const untouched = (!appid && !apiKey && !apiSecret) || (appid === XF_MASK && apiKey === XF_MASK && apiSecret === XF_MASK);
  if (untouched) { clearXfyunConfig(); return; }
  if (!appid || !apiKey || !apiSecret) { showToast('请填写完整的 APPID / API Key / API Secret（或全部留空使用默认）'); return; }
  localStorage.setItem('xfyun_appid', appid);
  localStorage.setItem('xfyun_api_key', apiKey);
  localStorage.setItem('xfyun_api_secret', apiSecret);
  loadXfyunConfigUI();
  showToast('语音配置已保存，语音将使用讯飞识别');
}
function clearXfyunConfig() {
  localStorage.removeItem('xfyun_appid');
  localStorage.removeItem('xfyun_api_key');
  localStorage.removeItem('xfyun_api_secret');
  loadXfyunConfigUI();
  showToast('已恢复默认语音配置');
}
// 显示/隐藏明文切换
function toggleXfyunSee() {
  const show = document.getElementById('xfSeeToggle').checked;
  ['xfAppidInput', 'xfApiKeyInput', 'xfApiSecretInput'].forEach(id => {
    const el = document.getElementById(id);
    el.type = show ? 'text' : 'password';
  });
}
// 回填 UI：星号掩码表示已配置（默认或自定义），点输入框自动清空便于修改
const XF_MASK = '********';
const XF_INPUT_IDS = ['xfAppidInput', 'xfApiKeyInput', 'xfApiSecretInput'];
function loadXfyunConfigUI() {
  const appid = localStorage.getItem('xfyun_appid');
  const apiKey = localStorage.getItem('xfyun_api_key');
  const apiSecret = localStorage.getItem('xfyun_api_secret');
  const el = id => document.getElementById(id);
  const see = document.getElementById('xfSeeToggle');
  if (see) see.checked = false;
  XF_INPUT_IDS.forEach(id => { if (el(id)) el(id).type = 'password'; });
  // 全部填星号掩码：有默认配置或本地自定义时均表示"已配置"
  const hasCustom = !!(appid && apiKey && apiSecret);
  XF_INPUT_IDS.forEach(id => { if (el(id)) el(id).value = (hasCustom || _DEFAULT_XFYUN) ? XF_MASK : ''; });
  bindXfMaskEvents();
  const hint = document.getElementById('xfDefaultHint');
  if (hint) hint.textContent = hasCustom
    ? '已启用自定义语音配置。点输入框可修改，「清除」恢复默认。'
    : (_DEFAULT_XFYUN ? '已使用默认语音配置（星号表示已配置，无需填写）。点输入框可覆盖自定义。' : '未配置语音，请填写讯飞三要素。');
}
// 星号掩码交互：focus 清空便于输入，blur 空值时恢复星号
function bindXfMaskEvents() {
  XF_INPUT_IDS.forEach(id => {
    const el = document.getElementById(id);
    if (!el || el.dataset.maskBound) return;
    el.dataset.maskBound = '1';
    el.addEventListener('focus', () => { if (el.value === XF_MASK) el.value = ''; el.type = 'text'; });
    el.addEventListener('blur', () => { if (!el.value.trim()) { el.value = XF_MASK; el.type = 'password'; } });
  });
}
// 构建带鉴权的 WebSocket URL（HMAC-SHA256 签名，讯飞 WebAPI 标准）
async function buildXfyunUrl(cfg) {
  const host = 'iat-api.xfyun.cn';
  const path = '/v2/iat';
  const date = new Date().toUTCString();
  const origin = 'host: ' + host + '\ndate: ' + date + '\nGET ' + path + ' HTTP/1.1';
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey('raw', enc.encode(cfg.apiSecret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(origin));
  const signature = btoa(String.fromCharCode.apply(null, new Uint8Array(sig)));
  const authOrigin = 'api_key="' + cfg.apiKey + '", algorithm="hmac-sha256", headers="host date request-line", signature="' + signature + '"';
  const authorization = btoa(authOrigin);
  return 'wss://' + host + path + '?authorization=' + encodeURIComponent(authorization) + '&date=' + encodeURIComponent(date) + '&host=' + encodeURIComponent(host);
}
// 浏览器采样率 → 16k（线性插值）
function downsampleTo16k(input, inputRate) {
  if (inputRate === 16000) return input;
  const ratio = inputRate / 16000;
  const outLen = Math.floor(input.length / ratio);
  const out = new Float32Array(outLen);
  for (let i = 0; i < outLen; i++) {
    const pos = i * ratio;
    const i0 = Math.floor(pos);
    const i1 = Math.min(i0 + 1, input.length - 1);
    out[i] = input[i0] + (input[i1] - input[i0]) * (pos - i0);
  }
  return out;
}
function float32ToInt16(f32) {
  const out = new Int16Array(f32.length);
  for (let i = 0; i < f32.length; i++) {
    const s = Math.max(-1, Math.min(1, f32[i]));
    out[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
  }
  return out;
}
function pcmToBase64(u8) {
  let bin = '';
  for (let i = 0; i < u8.length; i += 0x8000) bin += String.fromCharCode.apply(null, u8.subarray(i, i + 0x8000));
  return btoa(bin);
}
// 解析讯飞识别结果（含 wpgs 动态修正：rpl 时按 rg 范围替换旧句），返回当前完整文本
function parseXfyunResult(sentences, r) {
  if (!r) return null;
  const text = (r.ws || []).map(w => (w.cw || []).map(c => c.w || '').join('')).join('');
  if (r.pgs === 'rpl' && Array.isArray(r.rg)) {
    const from = r.rg[0], to = r.rg[r.rg.length - 1];
    for (let sn = from; sn <= to; sn++) sentences.delete(sn);
  }
  if (r.sn != null) sentences.set(r.sn, text);
  return [...sentences.keys()].sort((a, b) => a - b).map(k => sentences.get(k)).join('');
}
let xfSession = null;
async function startXfyunDictation() {
  const cfg = getXfyunConfig();
  if (!cfg) return false;
  let url;
  try { url = await buildXfyunUrl(cfg); } catch (e) { showToast('语音配置无效'); return false; }
  const sess = { sentences: new Map(), queue: [], endSent: false, finalized: false };
  xfSession = sess;
  let ws;
  try { ws = new WebSocket(url); } catch (e) { xfSession = null; showToast('无法连接语音服务'); return false; }
  sess.ws = ws;
  ws.onopen = async () => {
    try {
      sess.ws.send(JSON.stringify({
        common: { app_id: cfg.appid },
        business: { language: 'zh_cn', domain: 'iat', accent: 'mandarin', vad_eos: 5000, dwa: 'wpgs' },
        data: { status: 0, format: 'audio/L16;rate=16000', encoding: 'raw', audio: '' }
      }));
      await startXfyunMic(sess);
      // 讯飞识别已激活 → 切换到"录音中"态（状态3）
      if (!_voiceHoldCanceled && voiceRecActive) setVoiceState('recording');
    } catch (e) {
      disarmVoiceTimeout();
      showToast('无法访问麦克风：请检查浏览器录音权限');
      sess.endSent = true;
      finalizeXfyun(sess);
    }
  };
  ws.onmessage = ev => {
    let res; try { res = JSON.parse(ev.data); } catch (e) { return; }
    if (res.code !== 0) {
      showToast('语音识别失败：' + (res.message || res.code));
      sess.endSent = true;
      finalizeXfyun(sess);
      return;
    }
    const d = res.data;
    if (d && d.result) {
      const text = parseXfyunResult(sess.sentences, d.result);
      if (text != null) voiceFinalText = text;
    }
    if (d && d.status === 2) finalizeXfyun(sess);
  };
  ws.onerror = () => {
    if (!sess.finalized) showToast('语音服务连接失败');
    sess.endSent = true;
    finalizeXfyun(sess);
  };
  ws.onclose = () => finalizeXfyun(sess);
  return true;
}
async function startXfyunMic(sess) {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: { channelCount: 1, echoCancellation: true, noiseSuppression: true } });
  sess.stream = stream;
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  sess.audioCtx = audioCtx;
  const source = audioCtx.createMediaStreamSource(stream);
  sess.source = source;
  const processor = audioCtx.createScriptProcessor(4096, 1, 1);
  sess.processor = processor;
  const inputRate = audioCtx.sampleRate;
  const pcmBuf = [];
  processor.onaudioprocess = e => {
    e.outputBuffer.getChannelData(0).fill(0); // 静音输出，防止回声
    if (sess.endSent || xfSession !== sess) return;
    const down = downsampleTo16k(e.inputBuffer.getChannelData(0), inputRate);
    const int16 = float32ToInt16(down);
    for (let i = 0; i < int16.length; i++) pcmBuf.push(int16[i]);
    while (pcmBuf.length >= 640) { // 640样本=1280字节=40ms，讯飞标准帧
      const frame = new Int16Array(pcmBuf.splice(0, 640));
      sess.queue.push(JSON.stringify({ data: { status: 1, format: 'audio/L16;rate=16000', encoding: 'raw', audio: pcmToBase64(new Uint8Array(frame.buffer)) } }));
    }
  };
  source.connect(processor);
  processor.connect(audioCtx.destination);
  sess.sendTimer = setInterval(() => {
    if (sess.ws && sess.ws.readyState === 1 && sess.queue.length) sess.ws.send(sess.queue.shift());
  }, 40);
}
// 会话收尾：关连接、释放录音、进入统一的识别完成处理
function finalizeXfyun(sess) {
  if (sess.finalized) return;
  sess.finalized = true;
  clearTimeout(sess.timeoutTimer);
  clearInterval(sess.sendTimer);
  sess.queue.length = 0;
  try { sess.ws && sess.ws.close(); } catch (e) {}
  try { sess.source && sess.source.disconnect(); } catch (e) {}
  try { sess.processor && sess.processor.disconnect(); } catch (e) {}
  try { if (sess.audioCtx && sess.audioCtx.state !== 'closed') { const cp = sess.audioCtx.close(); if (cp && cp.catch) cp.catch(() => {}); } } catch (e) {}
  try { sess.stream && sess.stream.getTracks().forEach(t => t.stop()); } catch (e) {}
  if (xfSession === sess) xfSession = null;
  finishVoiceRecognition();
}
// 用户松开按钮：停录音并发送结束帧，等讯飞返回最终结果（3秒超时兜底）
function stopXfyunDictation() {
  const sess = xfSession;
  if (!sess) return;
  try { sess.source && sess.source.disconnect(); } catch (e) {}
  try { sess.processor && sess.processor.disconnect(); } catch (e) {}
  try { if (sess.audioCtx && sess.audioCtx.state !== 'closed') { const cp = sess.audioCtx.close(); if (cp && cp.catch) cp.catch(() => {}); } } catch (e) {}
  try { sess.stream && sess.stream.getTracks().forEach(t => t.stop()); } catch (e) {}
  clearInterval(sess.sendTimer);
  sess.queue.length = 0;
  if (!sess.endSent) {
    sess.endSent = true;
    if (sess.ws && sess.ws.readyState === 1) {
      try { sess.ws.send(JSON.stringify({ data: { status: 2, format: 'audio/L16;rate=16000', encoding: 'raw', audio: '' } })); } catch (e) {}
      sess.timeoutTimer = setTimeout(() => finalizeXfyun(sess), 3000);
    } else {
      finalizeXfyun(sess);
    }
  }
}
// 识别完成统一入口（Web Speech API 与讯飞共用）
// 语音按钮三态切换：idle(默认) / holding(按住) / recording(录音中)
let _voiceHoldCanceled = false;      // 本次按住是否被上滑取消
let _voiceTimeoutTimer = null;       // 录音超时定时器
const VOICE_MAX_SEC = 60;            // 单次录音上限（秒），超时自动结束
const VOICE_LABEL = { idle: '语音', recording: '录音中' };
// v3.5.114 语音目标：'record' = 首页「语音」按钮（识别后弹解析弹窗）；
//                 'ai'     = AI 对话输入框（识别后把文字回填输入框，不弹解析弹窗）
let voiceTarget = 'record';
function voiceBtnEl() {
  if (voiceTarget === 'ai') return document.getElementById('aiVoiceBtn');
  if (voiceTarget === 'kb') return document.getElementById('kbVoiceBtn');
  if (voiceTarget === 'memo') return document.getElementById('memoVoiceBtn');
  return document.getElementById('voiceHoldBtn');
}
function setVoiceState(state) {
  const btn = voiceBtnEl();
  if (!btn) return;
  btn.classList.toggle('holding', state === 'holding');
  btn.classList.toggle('recording', state === 'recording');
  const label = btn.querySelector('.voice-label');
  if (label) label.textContent = (state === 'holding') ? '语音' : (VOICE_LABEL[state] || '语音');
  if (label && state === 'idle') label.textContent = '语音';
  // AI 目标：同步「录音中」提示条与输入框占位文案
  if (voiceTarget === 'ai') {
    const bar = document.getElementById('aiRecBar');
    if (bar) bar.classList.toggle('show', state === 'holding' || state === 'recording');
    const ta = document.getElementById('aiChatInput');
    if (ta) ta.placeholder = (state === 'idle') ? '输入问题，回车发送…' : '正在聆听…松开结束';
  }
}
// 开始录音超时倒计时（到点自动结束录音）
function armVoiceTimeout() {
  clearTimeout(_voiceTimeoutTimer);
  _voiceTimeoutTimer = setTimeout(() => { stopVoiceHold(); }, VOICE_MAX_SEC * 1000);
}
function disarmVoiceTimeout() { clearTimeout(_voiceTimeoutTimer); _voiceTimeoutTimer = null; }
// 取消录音（上滑移出按钮或 touchcancel）：静默丢弃本次识别结果
// v3.5.114 抽出 quiet 版：关闭 AI 弹窗时静默中断，不弹「已取消录音」
function cancelVoiceHoldQuiet() {
  disarmVoiceTimeout();
  _voiceHoldCanceled = true;
  voiceRecActive = false;
  voiceFinalText = ''; voiceItems = [];
  // 中止讯飞会话
  if (xfSession) { try { xfSession.endSent = true; xfSession.finalized = true; try { xfSession.ws && xfSession.ws.close(); } catch(e){} try { xfSession.stream && xfSession.stream.getTracks().forEach(t=>t.stop()); } catch(e){} xfSession = null; } catch(e){} }
  // 中止 Web Speech
  if (voiceRecog) { try { voiceRecog.onend = null; voiceRecog.stop(); } catch (e) {} }
  setVoiceState('idle');
}
function cancelVoiceHold() { cancelVoiceHoldQuiet(); showToast('已取消录音'); }

function finishVoiceRecognition() {
  disarmVoiceTimeout();
  voiceRecActive = false;
  const target = voiceTarget;
  setVoiceState('idle');
  if (_voiceHoldCanceled) { _voiceHoldCanceled = false; return; }
  if (!voiceFinalText) { showToast('未识别到语音，请靠近一点再试试'); return; }
  // 知识库 / 备忘录：识别结果直接回填对应文本域（可编辑后再保存），不弹解析弹窗
  if (target === 'kb') { fillVoiceIntoTextarea('kbInput'); return; }
  if (target === 'memo') { fillVoiceIntoTextarea('memoInput'); return; }
  // AI 对话：识别结果直接回填输入框（可编辑后再发送），不弹解析弹窗
  if (target === 'ai') {
    const ta = document.getElementById('aiChatInput');
    if (ta) {
      const prev = ta.value.replace(/\s+$/, '');
      ta.value = prev ? prev + ' ' + voiceFinalText.trim() : voiceFinalText.trim();
      try { ta.focus(); ta.setSelectionRange(ta.value.length, ta.value.length); } catch (e) {}
    }
    showToast('已转成文字，可直接发送');
    return;
  }
  const r = parseVoiceText(voiceFinalText);
  voiceItems = r.items;
  showVoiceModal(voiceFinalText, r.unmatched);
}
// v3.5.127 把识别文字回填到指定文本域（知识库/备忘录语音按钮）：保留已有内容并追加
function fillVoiceIntoTextarea(elId) {
  const ta = document.getElementById(elId);
  if (!ta) return;
  const prev = ta.value.replace(/\s+$/, '');
  ta.value = prev ? prev + ' ' + voiceFinalText.trim() : voiceFinalText.trim();
  try { ta.focus(); ta.setSelectionRange(ta.value.length, ta.value.length); } catch (e) {}
  showToast('已转成文字，可直接发送');
}

function startVoiceHold(target) {
  if (isReadOnlyMode()) return;
  if (voiceRecActive) return;
  voiceTarget = target || 'record';
  _voiceHoldCanceled = false;
  voiceFinalText = '';
  voiceItems = [];
  const btn = voiceBtnEl();
  setVoiceState('holding'); // 状态2：先进入按住态（高亮边 + tip），等识别真正激活再切录音中
  armVoiceTimeout();
  // 优先讯飞（国内直连可用）；未配置则回退浏览器自带 Web Speech API（海外可用）
  if (getXfyunConfig()) {
    voiceRecActive = true;
    startXfyunDictation().then(started => {
      if (!started) { disarmVoiceTimeout(); voiceRecActive = false; setVoiceState('idle'); }
    });
    return;
  }
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) { disarmVoiceTimeout(); showToast('当前浏览器不支持语音识别：请到「管理」页配置讯飞语音'); if (btn) btn.classList.remove('holding', 'recording'); return; }
  try {
    voiceRecog = new SR();
    voiceRecog.lang = 'zh-CN'; voiceRecog.interimResults = true; voiceRecog.continuous = false; voiceRecog.maxAlternatives = 1;
    voiceRecog.onresult = (e) => {
      let interim = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const t = e.results[i][0].transcript;
        if (e.results[i].isFinal) voiceFinalText += t; else interim += t;
      }
      voiceFinalText = (voiceFinalText + interim).trim();
    };
    voiceRecog.onerror = (e) => {
      disarmVoiceTimeout();
      voiceRecActive = false;
      setVoiceState('idle');
      if (e.error === 'not-allowed' || e.error === 'service-not-allowed') showToast('麦克风权限被拒：点地址栏左侧🔒→权限→麦克风→允许');
      else if (e.error === 'no-speech') showToast('没有听到声音');
      else if (e.error === 'network') showToast('语音服务连接失败：国内请在「管理」页配置讯飞语音');
      else if (e.error === 'audio-capture') showToast('无法访问麦克风：请确认浏览器有录音权限');
      else showToast('语音识别出错(' + e.error + ')：国内可在「管理」页配置讯飞语音');
    };
    voiceRecog.onend = finishVoiceRecognition;
    voiceRecog.start();
    voiceRecActive = true;
    setVoiceState('recording'); // 状态3：录音中
  } catch (err) {
    disarmVoiceTimeout();
    showToast('语音识别启动失败');
    setVoiceState('idle');
  }
}
function stopVoiceHold() {
  disarmVoiceTimeout();
  if (_voiceHoldCanceled) return;
  if (xfSession) { stopXfyunDictation(); return; }
  if (voiceRecog && voiceRecActive) { try { voiceRecog.stop(); } catch (e) {} }
}
// 语音按钮触摸事件绑定（按住说话：touch 按住 + 鼠标按住兜底；上滑移出=取消）
// v3.5.127 抽出通用函数，首页(record)/AI(ai)/知识库(kb)/备忘录(memo) 共用，识别结果按 target 路由
function bindVoiceButton(id, target) {
  const btn = document.getElementById(id);
  if (!btn || btn.dataset.bound === '1') return;
  btn.dataset.bound = '1';
  let sx = 0, sy = 0, movedOut = false, active = false;
  const begin = (x, y) => { sx = x; sy = y; movedOut = false; active = true; startVoiceHold(target); };
  const move = (x, y) => {
    if (!active) return;
    const r = btn.getBoundingClientRect();
    const outX = x < r.left - 8 || x > r.right + 8;
    const outY = y < r.top - 40 || y > r.bottom + 8;
    if ((y - sy < -30) || outX || outY) { if (!movedOut) { movedOut = true; cancelVoiceHold(); } }
    else movedOut = false;
  };
  const end = () => { if (!active) return; active = false; if (!_voiceHoldCanceled) stopVoiceHold(); };
  btn.addEventListener('touchstart', (e) => { e.preventDefault(); const t = e.touches[0]; begin(t.clientX, t.clientY); }, { passive: false });
  btn.addEventListener('touchmove', (e) => { const t = e.touches[0]; move(t.clientX, t.clientY); e.preventDefault(); }, { passive: false });
  btn.addEventListener('touchend', (e) => { e.preventDefault(); end(); }, { passive: false });
  btn.addEventListener('touchcancel', (e) => { e.preventDefault(); active = false; cancelVoiceHold(); }, { passive: false });
  btn.addEventListener('mousedown', (e) => { e.preventDefault(); begin(e.clientX, e.clientY); });
  window.addEventListener('mouseup', () => { if (active) end(); });
  btn.addEventListener('contextmenu', (e) => e.preventDefault());
}
// 首页底部「语音」按钮（识别后弹解析弹窗）
function bindVoiceTouch() { bindVoiceButton('voiceHoldBtn', 'record'); }
// v3.5.114 AI 对话输入框话筒：按住说话（与首页语音同一套识别链路：优先讯飞，回退 Web Speech）
function bindAIVoiceTouch() { bindVoiceButton('aiVoiceBtn', 'ai'); }

// 触摸直发兜底：部分手机浏览器 click 合成可能失效（尤其语音按钮 preventDefault 之后），
// 对底部栏关键按钮直接用 touchend 触发，确保点击必定响应；桌面端仍走 onclick
function enableFastTap(el, handler) {
  if (!el) return;
  let sx = 0, sy = 0, moved = false;
  el.addEventListener('touchstart', (e) => {
    const t = e.touches[0];
    sx = t.clientX; sy = t.clientY; moved = false;
  }, { passive: true });
  el.addEventListener('touchmove', (e) => {
    const t = e.touches[0];
    if (Math.abs(t.clientX - sx) > 10 || Math.abs(t.clientY - sy) > 10) moved = true; // 滑动不触发
  }, { passive: true });
  el.addEventListener('touchend', (e) => {
    if (moved) return;
    e.preventDefault(); // 阻止本次合成 click，避免与 onclick 重复触发
    handler();
  }, { passive: false });
}
function bindFastTaps() {
  // 底部导航：备忘录 / 历史 / 分析 / 管理（添加按钮已在 HTML 内联 ontouchstart 兜底；日报已移入总览胶囊）
  const navs = { openMemo: openMemo, openHistory: openHistory, openAnalysis: openAnalysis, openManage: openManage };
  document.querySelectorAll('.nav-item').forEach(el => {
    const fn = el.getAttribute('onclick') || '';
    const m = fn.match(/(\w+)\s*\(\)/);
    if (m && navs[m[1]]) enableFastTap(el, navs[m[1]]);
  });
}

function showVoiceModal(rawText, unmatched) {
  showModal('voiceModal');
  const rawEl = document.getElementById('voiceRawText');
  if (rawEl) rawEl.textContent = rawText || '（无）';
  renderVoiceItems(unmatched);
}
function clearVoiceModal() {
  voiceFinalText = ''; voiceItems = [];
  const rawEl = document.getElementById('voiceRawText');
  if (rawEl) rawEl.textContent = '（无）';
  renderVoiceItems();
}

function voiceItemParamDef(item) {
  const p = item.params;
  if (p.milkAmount !== undefined) return { key: 'milkAmount', label: '奶量', value: p.milkAmount, unit: 'ml', min: 1, step: 1 };
  if (p.duration !== undefined && (item.actId === 'sleep' || item.actId === 'outdoor' || item.actId === 'airButt')) return { key: 'duration', label: '时长', value: p.duration, unit: '分钟', min: 0, step: 1 };
  if (p.temperature !== undefined) return { key: 'temperature', label: '体温', value: p.temperature, unit: '℃', min: 30, step: 0.1 };
  if (p.supplementAmount !== undefined) return { key: 'supplementAmount', label: '用量', value: p.supplementAmount, unit: '粒', min: 1, step: 1 };
  if (p.solidFoodAmount !== undefined) return { key: 'solidFoodAmount', label: '克数', value: p.solidFoodAmount, unit: 'g', min: 0, step: 1 };
  if (p.vaccineDose !== undefined) return { key: 'vaccineDose', label: '第几剂', value: p.vaccineDose, unit: '剂', min: 1, step: 1 };
  return null;
}
function renderVoiceItems(unmatched) {
  const box = document.getElementById('voiceResultList');
  const btn = document.getElementById('voiceConfirmBtn');
  let html = '';
  const viPending = [];   // v3.5.75 辅食：食物下拉需在 innerHTML 落盘后回填
  if (voiceItems.length === 0) {
    html = '<div class="voice-empty-tip">未识别到活动。试试：喂奶130 · 睡了一小时 · 洗澡了 · 大便拉肚子 · 体温38度5</div>';
  } else {
    voiceItems.forEach((it, i) => {
      const pd = voiceItemParamDef(it);
      const extra = [];
      if (it.params.poopStatus) extra.push(it.params.poopStatus);
      if (it.params.shampoo && it.params.shampoo !== '无') extra.push('沐浴露');
      if (it.params.storyLangs) extra.push(it.params.storyLangs.join('+'));
      if (it.params.supplementTypes) extra.push(it.params.supplementTypes.join('+'));
      if (it.params.vaccineTypes && it.params.vaccineTypes.length) extra.push(it.params.vaccineTypes.join('+'));
      if (it.params.grossMotorItems && it.params.grossMotorItems.length) extra.push(it.params.grossMotorItems.join('+'));
      if (it.params.fineMotorItems && it.params.fineMotorItems.length) extra.push(it.params.fineMotorItems.join('+'));
      if (it.params.solidFoods && it.params.solidFoods.length) extra.push(it.params.solidFoods.join('+'));
      if (it.params.afterMeal === '异常') extra.push('饭后异常');
      // 时间与数值输入同添加弹窗：HH:MM 数字直填 + 参数行（时长类拆 h/min）
      const [vhh, vmm] = (it.recTime || getNowTimeStr()).split(':').map(x => String(parseInt(x) || 0).padStart(2, '0'));
      const isDur = pd && pd.key === 'duration';
      const dh = isDur ? Math.floor((pd.value || 0) / 60) : 0;
      const dm = isDur ? Math.round((pd.value || 0) % 60) : 0;
      // v3.5.75 辅食：语音确认界面也能直接选食物 / 改饭后状态（听不清时手动补）
      const isSf = it.actId === 'solidFood';
      if (isSf) viPending.push({ p: 'vi', id: String(i), sel: it.params.solidFoods || [] });
      const sfBlock = isSf
        ? `<div class="input-row sf-row"><label class="sf-label">食物:</label>${sfPickerHtml('vi', String(i))}</div>`
          + `<div class="input-row sf-row sf-meal-row radio-group"><label class="sf-label">饭后:</label>`
          + `<label><input type="radio" name="vimeal_${i}" value="正常" ${(it.params.afterMeal||'正常')==='正常'?'checked':''}> 正常</label>`
          + `<label><input type="radio" name="vimeal_${i}" value="异常" ${it.params.afterMeal==='异常'?'checked':''}> 异常</label></div>`
        : '';
      html += `<div class="voice-record-item${it.warn ? ' vri-warn' : ''}" id="vri_${i}">
        <div class="vri-head">
          <span class="vri-name">${it.icon} ${it.name}${extra.length ? '<span class="vri-unit"> · ' + extra.join(' · ') + '</span>' : ''}</span>
          <span class="vri-unit" id="viwarn_${i}" style="color:#fd79a8;${it.warn ? '' : 'display:none;'}">待补</span>
          <span class="vri-del" onclick="voiceItems.splice(${i},1);renderVoiceItems();">&#10005;</span>
        </div>
        <div class="input-row"><label style="font-size:14px;color:#b2bec3;">开始:</label><div class="time-input-group"><input type="number" min="0" max="23" value="${vhh}" id="vit_h_${i}"><span>:</span><input type="number" min="0" max="59" value="${vmm}" id="vit_m_${i}"></div></div>
        ${isDur
          ? `<div class="input-row"><label style="font-size:14px;color:#b2bec3;">${pd.label}:</label><input type="number" min="0" id="vinh_${i}" value="${dh}" style="width:50px;"><span class="unit">h</span><input type="number" min="0" max="59" id="vinm_${i}" value="${dm}" style="width:50px;margin-left:8px;"><span class="unit">min</span></div>`
          : (pd ? `<div class="input-row"><label style="font-size:14px;color:#b2bec3;">${pd.label}:</label><input type="number" min="${pd.min}" step="${pd.step}" value="${pd.value != null ? pd.value : ''}" id="vin_${i}"><span class="unit">${pd.unit}</span></div>` : '')}
        ${(it.actId === 'milk' && it.params.lactase !== undefined) ? `<div class="input-row"><label style="font-size:14px;color:#b2bec3;">乳糖酶:</label><input type="number" min="0" step="1" value="${it.params.lactase}" id="vilact_${i}"><span class="unit">滴</span></div>` : ''}
        ${sfBlock}
      </div>`;
    });
  }
  if (unmatched) html += `<div class="voice-empty-tip" style="color:#fab1a0;">未识别：${unmatched}（已忽略）</div>`;
  const warnCount = voiceItems.filter(x => x.warn).length;
  if (warnCount > 0) html += `<div class="voice-empty-tip" style="color:#fd79a8;">${warnCount} 条参数未听清（粉框），请补充后确认</div>`;
  box.innerHTML = html;
  viPending.forEach(x => sfInit(x.p, x.id, x.sel));
  btn.style.display = voiceItems.length ? '' : 'none';
  btn.textContent = `确认添加 ${voiceItems.length} 条`;
}
// v3.5.75 语音里选了食物后，同步回该条记录并撤下「待补」标记
function sfSyncVoiceItem(idx) {
  const i = parseInt(idx, 10);
  const it = (typeof voiceItems !== 'undefined' && voiceItems[i]) || null;
  if (!it || it.actId !== 'solidFood') return;
  it.params.solidFoods = sfGetSelection('vi', String(i));
  it.warn = it.params.solidFoods.length === 0;
  const badge = document.getElementById('viwarn_' + i);
  if (badge) badge.style.display = it.warn ? '' : 'none';
  const card = document.getElementById('vri_' + i);
  if (card && card.classList) card.classList.toggle('vri-warn', !!it.warn);
}
function confirmVoiceAdd() {
  if (voiceItems.length === 0) return;
  if (isReadOnlyMode()) { showToast('只读模式下无法添加记录'); return; }
  const records = getTodayRecords();
  const now = new Date(), ts = Date.now(), timeStr = now.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
  const newestIds = [];
  // 读取卡片上可能被手动修改的值（时间 HH:MM 直填 + 数值/时长 h·min）
  voiceItems.forEach((it, i) => {
    const pd = voiceItemParamDef(it);
    const hEl = document.getElementById('vit_h_' + i);
    const mEl = document.getElementById('vit_m_' + i);
    if (hEl && mEl) {
      const hh = String(parseInt(hEl.value) || 0).padStart(2, '0');
      const mm = String(parseInt(mEl.value) || 0).padStart(2, '0');
      it.recTime = hh + ':' + mm;
    }
    if (pd && pd.key === 'duration') {
      const dhEl = document.getElementById('vinh_' + i);
      const dmEl = document.getElementById('vinm_' + i);
      if (dhEl && dmEl) it.params.duration = (parseInt(dhEl.value) || 0) * 60 + (parseInt(dmEl.value) || 0);
    } else if (pd) {
      const nEl = document.getElementById('vin_' + i);
      if (nEl && nEl.value !== '' && !isNaN(parseFloat(nEl.value))) it.params[pd.key] = parseFloat(nEl.value);
    }
  });
  voiceItems.forEach((it, viIdx) => {
    const act = ACTIVITIES.find(a => a.id === it.actId); if (!act) return;
    const p = it.params;
    const record = { type: it.actId, name: act.name, time: timeStr, recTime: it.recTime, timestamp: ts, note: p.note || '', updatedAt: Date.now() };
    if (act.type === 'milk') { record.milkTime = it.recTime; record.milkAmount = Math.max(1, Math.round(p.milkAmount || getDefaultMilkAmount())); const lel = document.getElementById('vilact_' + viIdx); const _lv = lel && lel.value !== '' && !isNaN(parseFloat(lel.value)) ? parseFloat(lel.value) : (p.lactase != null ? p.lactase : null); record.lactase = (_lv != null && _lv >= 0) ? Math.max(0, Math.round(_lv)) : getDefaultLactase(); }
    else if (act.type === 'sleep') { record.sleepStartTime = it.recTime; record.duration = Math.max(0, Math.round(p.duration || 0)); }
    else if (act.type === 'drinkWater') { record.drinkTime = it.recTime; }
    else if (act.type === 'poop') { record.poopTime = it.recTime; record.poopStatus = p.poopStatus || '正常'; }
    else if (act.type === 'supplement') { record.supplementTypes = (p.supplementTypes && p.supplementTypes.length) ? p.supplementTypes : ['AD']; record.supplementTime = it.recTime; record.supplementAmount = Math.max(1, Math.round(p.supplementAmount || 1)); }
    else if (act.type === 'solidFood') {
      // v3.5.75 优先取语音面板里手动勾选的食物（听不清时用户会自己补）
      const picked = (typeof sfGetSelection === 'function') ? sfGetSelection('vi', String(viIdx)) : [];
      record.solidFoods = picked.length ? picked : (p.solidFoods || []);
      record.solidFoodTime = it.recTime;
      record.solidFoodAmount = Math.max(0, Math.round(p.solidFoodAmount || 0));
      const rds2 = document.getElementsByName(`vimeal_${viIdx}`); let _vm = p.afterMeal || '正常';
      for (const r of rds2) { if (r.checked) { _vm = r.value; break; } }
      record.afterMeal = _vm;
      if (p.note) record.note = p.note;
    }
    else if (act.type === 'vaccine') { record.vaccineTypes = p.vaccineTypes || []; record.vaccineTime = it.recTime; record.vaccineDose = Math.max(1, Math.round(p.vaccineDose || 1)); }
    else if (act.type === 'listenStory') { record.storyLangs = (p.storyLangs && p.storyLangs.length) ? p.storyLangs : ['中文']; record.storyTime = it.recTime; }
    else if (act.type === 'grossMotor') { record.grossMotorItems = p.grossMotorItems || []; record.grossMotorTime = it.recTime; }
    else if (act.type === 'fineMotor') { record.fineMotorItems = p.fineMotorItems || []; record.fineMotorTime = it.recTime; }
    else if (act.type === 'duration') { record.duration = Math.max(0, parseFloat(p.duration || 0)); record.durationTime = it.recTime; }
    else if (act.type === 'airButt') { record.duration = Math.max(0, parseFloat(p.duration || 0)); record.level = p.level || '正常'; record.airButtTime = it.recTime; }
    else if (act.type === 'bath') { record.shampoo = p.shampoo || '无'; record.bathTime = it.recTime; }
    else if (act.type === 'note') { record.noteTime = it.recTime; if (p.note) record.note = p.note; }
    else if (act.type === 'temperature') { const v = parseFloat(p.temperature); if (!(v >= 34 && v <= 43)) { showToast(act.name + '体温异常，请检查'); return; } record.temperature = v; record.tempStatus = v <= 37.5 ? 'normal' : 'high'; record.tempTime = it.recTime; }
    else if (act.type === 'simple') { record.simpleTime = it.recTime; }
    records.push(record); newestIds.push(it.actId);
  });
  persistRecords(records);
  syncUpload('records', getTodayDateStr());
  hideModal('voiceModal');
  voiceFinalText = ''; voiceItems = [];
  const rawEl = document.getElementById('voiceRawText');
  if (rawEl) rawEl.textContent = '（无）';
  renderVoiceItems();
  renderCards(newestIds); updateOverview();
  showToast(`语音速记已添加 ${newestIds.length} 条记录`);
}

/* ==================== 日报 ==================== */
function openReport() {
  const records = getTodayRecords(); const content = document.getElementById('reportContent');
  const stats = {};
  const noteRecords = []; // 带备注的记录（用于备注区块）
  records.forEach(r => {
    if (!stats[r.type]) stats[r.type] = { name: r.name, count: 0, duration: 0, totalCount: 0, details: [], totalMilk: 0, totalSuppl: 0, totalSolid: 0, solidFoods: [] };
    stats[r.type].count++;
    if (r.duration !== undefined) stats[r.type].duration += r.duration;
    if (r.count !== undefined) stats[r.type].totalCount += r.count;
    if (r.milkAmount !== undefined) stats[r.type].totalMilk += r.milkAmount;
    if (r.supplementAmount !== undefined) stats[r.type].totalSuppl += r.supplementAmount;
    if (r.solidFoodAmount !== undefined) stats[r.type].totalSolid += r.solidFoodAmount;
    if (r.type === 'solidFood') {
      (r.solidFoods || []).forEach(f => { if (!stats[r.type].solidFoods.includes(f)) stats[r.type].solidFoods.push(f); });
      if (r.afterMeal === '异常') stats[r.type].solidAbnormal = (stats[r.type].solidAbnormal || 0) + 1;
    }
    let detail = '';
    if (r.level) detail = '程度:' + r.level;
    else if (r.shampoo && r.shampoo !== '无') detail = '使用沐浴露:' + r.shampoo;
    else if (r.temperature) detail = r.temperature + '℃' + (r.tempStatus === 'high' ? '⚠️' : '');
    else if (r.note) detail = r.note;
    if (detail) stats[r.type].details.push(detail);
    if (r.note && r.note.trim()) noteRecords.push({ time: r.recTime || r.time || '', name: r.name, note: r.note.trim() });
  });
  const height = localStorage.getItem('babyHeight') || '';
  const weight = localStorage.getItem('babyWeight') || '';
  let html = '';
  if (height || weight) {
    html += `<div class="report-item"><span class="report-label">高</span><span class="report-value">${height||'-'} cm</span></div>`;
    html += `<div class="report-item"><span class="report-label">重</span><span class="report-value">${weight||'-'} kg</span></div>`;
    html += '<div style="height:8px;"></div>';
  }
  CATEGORIES.forEach(cat => {
    const ca = ACTIVITIES.filter(a => a.category === cat.id && !hiddenActivities.includes(a.id));
    if (ca.length === 0) return;
    html += `<div class="report-section"><div class="report-section-title">${cat.icon} ${cat.name}</div>`;
    ca.forEach(act => {
      const s = stats[act.id]; let val = '', isZero = false;
      if (!s) { val = act.type==='milk'?'0次 · 0ml':act.type==='sleep'?'0次 · 0h 0min':'0次'; isZero = true; }
      else {
        if (act.type === 'sleep') { const h = Math.floor(s.duration / 60); const m = Math.round(s.duration % 60); val = s.count + '次 · ' + h + 'h ' + m + 'min'; }
        else if (act.type === 'supplement') val = s.count + '次 · ' + s.totalSuppl + '粒';
        else if (act.type === 'solidFood') val = s.count + '次 · ' + s.totalSolid + 'g';
        else if (act.type === 'milk') val = s.count + '次 · ' + s.totalMilk + 'ml';
        else if (s.duration > 0) val = s.count + '次 · ' + s.duration.toFixed(1) + '分钟';
        else val = s.count + '次';
      }
      html += `<div class="report-item"><span class="report-label">${act.icon} ${act.name}</span><span class="report-value${isZero?' zero':''}">${val}</span></div>`;
      // 辅食下一行展示当天吃过的食物清单（饭后异常标红提示）
      if (act.type === 'solidFood' && s && s.solidFoods && s.solidFoods.length) {
        const escF = s.solidFoods.map(f => String(f).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'));
        const abn = s.solidAbnormal ? `<span style="color:#e17055;"> · 饭后异常${s.solidAbnormal}次</span>` : '';
        html += `<div class="report-item"><span class="report-label">${act.icon} 吃了什么</span><span class="report-value">${escF.join('、')}${abn}</span></div>`;
      }
      // 喝奶（水量）下一行展示 水+奶 总量（奶量*1.12）
      if (act.type === 'milk') {
        const base = s ? s.totalMilk : 0;
        const mixed = Math.round(base * 1.12);
        html += `<div class="report-item"><span class="report-label">${act.icon} 喝奶（水+奶）</span><span class="report-value${isZero?' zero':''}">${mixed}ml</span></div>`;
        // v3.5.89 日报显示当日乳糖酶「单次最小值」（口径同健康图表：getLactaseByDate 已改为取当日喝奶记录乳糖酶最小值）
        const _lac = getLactaseByDate(getTodayDateStr());
        html += `<div class="report-item"><span class="report-label">${act.icon} 乳糖酶</span><span class="report-value${(!_lac) ? ' zero' : ''}">${_lac != null ? _lac : 0}滴</span></div>`;
      }
    });
    html += '</div>';
  });
  // 备注区块：按时间正序列出所有备注
  if (noteRecords.length > 0) {
    noteRecords.sort((a, b) => (a.time || '').localeCompare(b.time || ''));
    html += `<div class="report-section"><div class="report-section-title">📝 备注记录</div>`;
    noteRecords.forEach(n => {
      const noteHtml = n.note.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '<br>');
      html += `<div class="report-item note-item"><span class="report-label">${n.time} ${n.name}</span><span class="report-value note-text">${noteHtml}</span></div>`;
    });
    html += '</div>';
  }
  html += `<div class="report-item" style="margin-top:8px; border-top:1px solid rgba(255,255,255,0.15); padding-top:10px;"><span class="report-label">总记录数</span><span class="report-value">${records.length}条</span></div>`;
  content.innerHTML = html || '<div class="report-empty">今天还没有记录哦~</div>';
  showModal('reportModal');
}

/* ==================== 历史 ==================== */
function openHistory() {
  // 历史默认打开昨天（今天及以后禁止查看）
  const t = new Date(); t.setDate(t.getDate() - 1);
  document.getElementById('historyDate').value = `${t.getFullYear()}-${String(t.getMonth()+1).padStart(2,'0')}-${String(t.getDate()).padStart(2,'0')}`;
  loadHistory(); showModal('historyModal');
  hardenHistoryColors();
}
// v3.5.82 历史弹窗配色兜底：颜色直接内联，不依赖可能被缓存的 CSS；
// 同时兜底去掉旧缓存 HTML 里「高/重」前残留的图标，保证任意缓存状态下都呈现白字无图标
function hardenHistoryColors() {
  const day = document.body.classList.contains('theme-day');
  const c = day ? '#3d4852' : '#ffffff';
  document.querySelectorAll('#historyModal .hs-label, #historyModal .hs-value, #historyModal .history-body-row .hb-unit').forEach(el => { el.style.color = c; });
  document.querySelectorAll('#historyModal .history-body-row label').forEach((el, i) => { el.style.color = c; el.textContent = (i === 0 ? '高' : '重'); });
  ['historyHeightInput', 'historyWeightInput'].forEach(id => { const el = document.getElementById(id); if (el) el.style.color = c; });
}
function loadHistory() {
  const ds = document.getElementById('historyDate').value; if (!ds) return;
  loadHistoryBody(ds);   // 回填该日期已记录的身高/体重
  // v3.5.79 历史列表同样走 sanitize：脏记录（无时间戳的测试数据）不再被渲染成 undefined
  const records = getRecordsByDate(ds);
  const list = document.getElementById('historyList');
  const summary = document.getElementById('historySummary');
  const dateLabel = document.getElementById('historyDateLabel');
  if (dateLabel) dateLabel.textContent = ds;   // 列表下方显示当前查看的日期
  if (records.length === 0) {
    if (summary) { summary.innerHTML = ''; summary.style.display = 'none'; }
    list.innerHTML = '<div class="report-empty">该日期暂无记录</div>';
    return;
  }
  // 顶部统计: 所选日期总奶量 + 成就
  let totalMilk = 0;
  records.forEach(r => { if (r.type === 'milk' && r.milkAmount) totalMilk += r.milkAmount; });
  const achArr = computeAchievements(records);
  // v3.5.82 颜色改为内联：不依赖可能被缓存的旧 CSS（v3.5.80 的 #ffeaa7 黄色），彻底消除"数值/单位/内容发黄"；主题自适应
  const _hvc = document.body.classList.contains('theme-day') ? '#3d4852' : '#ffffff';
  let sHtml = `<div class="history-sum-row"><span class="hs-label" style="color:${_hvc}">🍼 水+奶量</span><span class="hs-value" style="color:${_hvc}">${Math.round(totalMilk * 1.12)} ml</span></div>`;
  sHtml += `<div class="history-sum-row"><span class="hs-label" style="color:${_hvc}">🏆 今日成就</span><span class="hs-value" style="color:${_hvc}">${achArr.length > 0 ? achArr.join(' | ') : '无'}</span></div>`;
  if (summary) { summary.innerHTML = sHtml; summary.style.display = 'flex'; }
  // 按活动开始时间正序排列
  const sorted = [...records].sort((a, b) => {
    const ta = (a.recTime || a.time || '00:00');
    const tb = (b.recTime || b.time || '00:00');
    return ta.localeCompare(tb);
  });
  let html = '';
  sorted.forEach(r => {
    // 记录定位键：type + timestamp（编辑/删除据此找到记录；日期从当前历史日期取）
    const t = String(r.type || '').replace(/'/g, "\\'");
    const ts = Number(r.timestamp) || 0;
    html += `<div class="history-record">` +
      `<div class="history-rec-main">` +
        `<div class="rec-time">${r.recTime || r.time}</div>` +
        `<div class="rec-detail">${r.name}: ${formatRecordBrief(r, ds)}</div>` +
      `</div>` +
      `<div class="history-rec-ops">` +
        `<span class="rec-edit" onclick="openEditRecord('${t}', ${ts}, '${ds}')" title="编辑"><svg viewBox="0 0 24 24"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg></span>` +
        `<span class="rec-delete" onclick="deleteRecord('${t}', ${ts}, '${ds}')" title="删除"><svg viewBox="0 0 24 24"><path d="M3 6h18"/><path d="M8 6V4h8v2"/><path d="M6 6l1 14h10l1-14"/><path d="M10 10v6"/><path d="M14 10v6"/></svg></span>` +
      `</div>` +
    `</div>`;
  });
  list.innerHTML = html;
}
// ---------- 历史页：所选日期的身高/体重（v3.5.73） ----------
// 回填：bodyHistory 里该日期有值就显示，没有则留空
function loadHistoryBody(ds) {
  const el = document.getElementById('historyHeightInput');
  const ew = document.getElementById('historyWeightInput');
  if (!el && !ew) return;
  const rec = getBodyHistory().find(x => x.d === ds);
  if (el) el.value = (rec && rec.h != null) ? rec.h : '';
  if (ew) ew.value = (rec && rec.w != null) ? rec.w : '';
}
// 保存：留空表示清除该项；写入后即时同步云端，并刷新体重/身高趋势曲线
function saveHistoryBody(field) {
  const dsEl = document.getElementById('historyDate');
  const ds = dsEl ? dsEl.value : '';
  if (!ds) { showToast('请先选择日期'); return; }
  const el = document.getElementById(field === 'h' ? 'historyHeightInput' : 'historyWeightInput');
  if (!el) return;
  const raw = String(el.value == null ? '' : el.value).trim();
  const name = field === 'h' ? '身高' : '体重';
  let v = null;
  if (raw !== '') {
    v = parseFloat(raw);
    if (isNaN(v) || v <= 0) { showToast(name + '需为大于 0 的数字'); loadHistoryBody(ds); return; }
    v = Math.round(v * 10) / 10;   // 统一保留 1 位小数
  }
  // 与上次值相同则不重复写盘/同步（onchange 与 onblur 会各触发一次）
  const prev = getBodyHistory().find(x => x.d === ds);
  const oldV = prev ? prev[field] : null;
  if ((oldV == null && v == null) || (oldV != null && v != null && Math.abs(oldV - v) < 1e-9)) { loadHistoryBody(ds); return; }
  recordBodyMeasurement(field, v, ds);
  loadHistoryBody(ds);
  showToast(v == null ? ('已清除该日' + name) : (name + '已记录 ' + v + (field === 'h' ? 'cm' : 'kg')));
}
// 历史页：向所选日期添加记录
function addHistoryRecord() {
  const ds = document.getElementById('historyDate').value;
  if (!ds) { showToast('请先选择日期'); return; }
  openAddModal(ds);
}
// ---------- 自绘日期选择器（替代系统 picker：蓝色"确定"按钮 + 蓝色头部） ----------
let _dpViewYear = 0, _dpViewMonth = 0, _dpSelected = '';
let _dpMode = 'history'; // v3.5.135 日期选择器模式：history(历史,禁未来) | task(定时任务,可选未来)
function openHistoryDatePicker() {
  _dpMode = 'history';
  const cur = document.getElementById('historyDate').value;
  // 若当前值是今天或未来（异常状态），回退到昨天
  const now = new Date();
  const todayKey = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;
  const validCur = (cur && cur < todayKey) ? cur : '';
  let d = validCur ? new Date(validCur + 'T00:00:00') : new Date(now.getTime() - 86400000);
  _dpViewYear = d.getFullYear();
  _dpViewMonth = d.getMonth();
  _dpSelected = validCur || `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  renderHistoryDatePicker();
  const q = document.getElementById('dpQuick'); if (q) q.style.display = '';
  showModal('historyDatePickerModal');
}
// v3.5.135 定时任务「开始日期」复用应用内日历选择器（同历史「选日」样式），允许选择未来日期
function openTaskDatePicker() {
  _dpMode = 'task';
  const cur = document.getElementById('taskStartDate').value;
  let d = cur ? new Date(cur + 'T00:00:00') : new Date();
  if (isNaN(d.getTime())) d = new Date();
  _dpViewYear = d.getFullYear();
  _dpViewMonth = d.getMonth();
  _dpSelected = cur || `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  renderHistoryDatePicker();
  const q = document.getElementById('dpQuick'); if (q) q.style.display = 'none';
  showModal('historyDatePickerModal');
}
// 同步任务开始日期：隐藏字段存值 + 触发按钮显示文本
function setTaskStartDateValue(v) {
  const hs = document.getElementById('taskStartDate'); if (hs) hs.value = v || '';
  const btn = document.getElementById('taskStartDateBtn'); if (btn) btn.textContent = v || '选择日期';
}
function renderHistoryDatePicker() {
  const label = document.getElementById('dpMonthLabel');
  if (label) label.textContent = `${_dpViewYear} 年 ${_dpViewMonth + 1} 月`;
  const grid = document.getElementById('dpGrid');
  if (!grid) return;
  const first = new Date(_dpViewYear, _dpViewMonth, 1);
  // 周一开头：(getDay()+6)%7
  const startOffset = (first.getDay() + 6) % 7;
  const daysInMonth = new Date(_dpViewYear, _dpViewMonth + 1, 0).getDate();
  const prevMonthDays = new Date(_dpViewYear, _dpViewMonth, 0).getDate();
  const today = new Date();
  const todayKey = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;
  const lockFuture = _dpMode !== 'task'; // 历史模式禁选未来；定时任务模式可选任意日期
  let html = '';
  // 上月尾部
  for (let i = startOffset - 1; i >= 0; i--) {
    const d = prevMonthDays - i;
    html += `<div class="dp-cell outside" data-d="${d}" data-prev="1">${d}</div>`;
  }
  // 本月
  for (let d = 1; d <= daysInMonth; d++) {
    const key = `${_dpViewYear}-${String(_dpViewMonth+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    const cls = ['dp-cell'];
    // 历史记录只能看过去，禁止选当天及以后的日期；定时任务模式可选未来
    const isFuture = key >= todayKey;
    if (key === todayKey) cls.push('today');
    if (key === _dpSelected && (!lockFuture || !isFuture)) cls.push('selected');
    if (lockFuture && isFuture) cls.push('disabled');
    if (lockFuture && isFuture) {
      html += `<div class="${cls.join(' ')}" data-d="${d}">${d}</div>`;
    } else {
      html += `<div class="${cls.join(' ')}" data-d="${d}" onclick="dpSelectDay('${key}')">${d}</div>`;
    }
  }
  // 下月头部补齐到 42 格（6 行 × 7）
  const totalCells = startOffset + daysInMonth;
  const fill = (7 - (totalCells % 7)) % 7;
  for (let d = 1; d <= fill; d++) {
    html += `<div class="dp-cell outside" data-d="${d}" data-next="1">${d}</div>`;
  }
  grid.innerHTML = html;
}
function dpSelectDay(key) {
  if (_dpMode !== 'task') {
    // 历史模式禁止选择当天及以后
    const t = new Date();
    const todayKey = `${t.getFullYear()}-${String(t.getMonth()+1).padStart(2,'0')}-${String(t.getDate()).padStart(2,'0')}`;
    if (key >= todayKey) return;
  }
  _dpSelected = key;
  renderHistoryDatePicker();
}
function dpNavMonth(delta) {
  _dpViewMonth += delta;
  if (_dpViewMonth < 0) { _dpViewMonth = 11; _dpViewYear--; }
  if (_dpViewMonth > 11) { _dpViewMonth = 0; _dpViewYear++; }
  renderHistoryDatePicker();
}
function dpPickQuick(deltaDays) {
  if (deltaDays <= 0) return; // 禁止选今天及以后
  const d = new Date();
  d.setDate(d.getDate() - deltaDays);
  const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  _dpSelected = key;
  _dpViewYear = d.getFullYear();
  _dpViewMonth = d.getMonth();
  renderHistoryDatePicker();
}
function confirmHistoryDatePicker() {
  if (!_dpSelected) { showToast('请先选择日期'); return; }
  // 定时任务模式：回填「开始日期」并关闭，允许选择未来
  if (_dpMode === 'task') {
    setTaskStartDateValue(_dpSelected);
    hideModal('historyDatePickerModal');
    return;
  }
  // 最终守卫：禁止确定今天及以后的日期
  const t = new Date();
  const todayKey = `${t.getFullYear()}-${String(t.getMonth()+1).padStart(2,'0')}-${String(t.getDate()).padStart(2,'0')}`;
  if (_dpSelected >= todayKey) { showToast('历史记录只能查看过去的日期'); return; }
  document.getElementById('historyDate').value = _dpSelected;
  loadHistory();
  hideModal('historyDatePickerModal');
}

/* ==================== 管理 ==================== */
// 奶量默认值（水量）：添加弹窗中喝奶的预填数值，可在管理弹窗修改，必须大于 0
const MILK_DEFAULT_KEY = 'milkDefaultAmount';
const MILK_DEFAULT_FALLBACK = 140;
function getDefaultMilkAmount() {
  const v = parseInt(localStorage.getItem(MILK_DEFAULT_KEY), 10);
  return (!isNaN(v) && v > 0) ? v : MILK_DEFAULT_FALLBACK;
}
function setDefaultMilkAmount(v) { localStorage.setItem(MILK_DEFAULT_KEY, String(v)); }
// 输入框失焦/回车时保存：必须大于 0，非法值恢复上次有效值并提示
function saveMilkDefault() {
  const el = document.getElementById('milkDefaultInput');
  if (!el) return;
  const raw = String(el.value || '').trim();
  const v = parseFloat(raw);            // 用 parseFloat 而非 parseInt，避免 155.6 被截成 155
  const r = Math.round(v);              // 四舍五入到整数毫升
  if (!raw || isNaN(v) || r <= 0) {
    el.value = getDefaultMilkAmount();
    showToast('奶量默认值必须大于 0');
    return;
  }
  if (r === Number(localStorage.getItem(MILK_DEFAULT_KEY))) { el.value = r; return; }
  setDefaultMilkAmount(r);
  el.value = r;
  try { syncUpload('config'); } catch (e) {}   // 同步给家人设备
  showToast('奶量默认值已设为 ' + r + 'ml');
}
// 乳糖酶默认值（滴）：添加弹窗中喝奶的预填数值，可在管理弹窗修改，必须 >=0 的整数且不能为空
const LACTASE_DEFAULT_KEY = 'lactaseDefaultDrops';
const LACTASE_DEFAULT_FALLBACK = 7;
function getDefaultLactase() {
  const v = parseInt(localStorage.getItem(LACTASE_DEFAULT_KEY), 10);
  return (!isNaN(v) && v >= 0) ? v : LACTASE_DEFAULT_FALLBACK;
}
function setDefaultLactase(v) { localStorage.setItem(LACTASE_DEFAULT_KEY, String(v)); }
// 输入框失焦/回车时保存：必须 >=0 整数且不能为空，非法值恢复上次有效值并提示
function saveLactaseDefault() {
  const el = document.getElementById('lactaseDefaultInput');
  if (!el) return;
  const raw = String(el.value || '').trim();
  const v = parseInt(raw, 10);
  if (raw === '' || isNaN(v) || v < 0) {
    el.value = getDefaultLactase();
    showToast('乳糖酶默认值需为 ≥0 的整数');
    return;
  }
  if (v === Number(localStorage.getItem(LACTASE_DEFAULT_KEY))) { el.value = v; return; }
  setDefaultLactase(v);
  el.value = v;
  try { syncUpload('config'); } catch (e) {}   // 同步给家人设备
  showToast('乳糖酶默认值已设为 ' + v + '滴');
}
// v3.5.94 管理弹窗分类：settings=设置（只读/云端同步/语音识别/订阅推送）、acts=活动（活动开关+各项选项）
let currentManageTab = 'settings';
function switchManageTab(tab) {
  currentManageTab = tab;
  document.querySelectorAll('#manageTabBar .cat-tag').forEach(t => t.classList.toggle('active', t.dataset.mtab === tab));
  document.querySelectorAll('.manage-tab-panel').forEach(p => {
    p.style.display = p.dataset.mpanel === tab ? 'block' : 'none';
  });
  const box = document.querySelector('#manageModal .modal-box');
  if (box) box.scrollTop = 0;
  // v3.5.136 切到「任务」页时立即跑一次调度：进入生成窗口的任务可当场生成计划并显示（计划为空则无视冷却重试）
  if (tab === 'tasks') { try { runScheduler(true); } catch (e) {} }
}
// v3.5.94 活动列表：喝奶下方接奶量/乳糖酶默认值；大运动/精细动作/辅食开关的下一行接各自选项区插槽
function buildManageListHTML() {
  let html = '';
  ACTIVITIES.forEach(act => {
    const visible = !hiddenActivities.includes(act.id);
    html += `<div class="manage-item"><span class="manage-name">${act.icon} ${act.name}</span><div class="toggle-switch ${visible?'on':''}" data-id="${act.id}" onclick="toggleManage('${act.id}')"></div></div>`;
    if (act.id === 'milk') {
      html += `<div class="manage-item"><span class="manage-name" style="font-size:14px;">🍼 奶量默认值（水量）</span>` +
        `<span class="mi-value"><input type="number" inputmode="numeric" min="1" step="1" id="milkDefaultInput" ` +
        `value="${getDefaultMilkAmount()}" onchange="saveMilkDefault()" onblur="saveMilkDefault()" ` +
        `onkeydown="if(event.key==='Enter'){event.preventDefault();this.blur();}"><span class="mi-unit">ml</span></span></div>`;
      html += `<div class="manage-item"><span class="manage-name" style="font-size:14px;">🍼 乳糖酶默认值</span>` +
        `<span class="mi-value"><input type="number" inputmode="numeric" min="0" step="1" id="lactaseDefaultInput" ` +
        `value="${getDefaultLactase()}" onchange="saveLactaseDefault()" onblur="saveLactaseDefault()" ` +
        `onkeydown="if(event.key==='Enter'){event.preventDefault();this.blur();}"><span class="mi-unit">滴</span></span></div>`;
    }
    // v3.5.94 三个可自定义选项的活动：选项区紧跟在该开关的下一行
    if (act.id === 'solidFood' || act.id === 'grossMotor' || act.id === 'fineMotor') {
      html += `<div class="manage-opt-slot" data-opt-for="${act.id}"></div>`;
    }
  });
  return html;
}
function openManage() {
  // 每次打开都从 localStorage 重新加载，保证显示最新值（包括上次关闭时即时修改的内容）
  loadHiddenActivities();
  loadCustomOptions();
  const list = document.getElementById('manageList');
  // v3.5.94 活动列表（选项区插到大运动/精细动作/辅食开关的下一行）
  list.innerHTML = buildManageListHTML();
  renderCustomOptionsSection();
  // v3.5.94 恢复上次所在分类
  switchManageTab(currentManageTab);
  // v3.5.132 打开管理即载入天气地址与定时任务列表
  const wa = document.getElementById('weatherAddrInput'); if (wa) wa.value = getWeatherAddr();
  renderSchedTasks();
  document.getElementById('readOnlyToggle').checked = isReadOnlyMode();
  loadPushTokenUI();
  loadPushTopicUI();
  loadPushSenderUI();
  loadXfyunConfigUI();
  loadAITagUI();
  updateReadOnlySlider();
  showModal('manageModal');
}
function isReadOnlyMode() { const v = localStorage.getItem('readonly_mode'); return v === 'yes'; }
function updateReadOnlySlider() {
  const slider = document.getElementById('readOnlySlider');
  if (!slider) return;
  if (isReadOnlyMode()) slider.style.background = '#2ecc71';
  else slider.style.background = 'rgba(255,255,255,0.1)';
}
function toggleReadOnly() {
  const ck = document.getElementById('readOnlyToggle').checked;
  localStorage.setItem('readonly_mode', ck ? 'yes' : 'no');
  updateReadOnlySlider();
  renderCards(); updateAddButtonVisibility();
}
function updateAddButtonVisibility() {
  const fab = document.getElementById('fabBtn');
  const mic = document.getElementById('voiceHoldBtn');
  const hide = isReadOnlyMode() ? 'none' : '';
  if (fab) fab.style.display = hide;
  if (mic) mic.style.display = hide;
}
function toggleManage(id) {
  const idx = hiddenActivities.indexOf(id);
  if (idx >= 0) hiddenActivities.splice(idx, 1); else hiddenActivities.push(id);
  const el = document.querySelector(`.toggle-switch[data-id="${id}"]`);
  if (el) el.classList.toggle('on');
  // 即时生效：保存到 localStorage + 重新渲染首页分类与卡片
  saveHiddenActivities();
  renderCategoryBar();
  renderCards();
}
function renderCustomOptionsSection() {
  // v3.5.94 三个选项区各自渲染到对应活动开关下一行的插槽（大运动/精细动作/辅食）
  // v3.5.69 明确告知：选项即改即存（本地 + 云端），不会因为换天/刷新而丢失
  const savedTip = `<span class="cos-saved">✓ 已永久保存</span>`;
  const esc = o => String(o).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
  const tag = (o, fn) => `<span class="custom-tag">${esc(o)}<span class="tag-remove" onclick="${fn}('${esc(o).replace(/'/g,"\\'")}')">×</span></span>`;
  // 大运动
  const grossSlot = document.querySelector('.manage-opt-slot[data-opt-for="grossMotor"]');
  if (grossSlot) {
    let h = `<div class="cos-title-row"><div class="cos-title">🤸 大运动选项</div>${savedTip}</div>`;
    h += `<div class="custom-options-tags">`;
    grossMotorOptions.forEach(o => { h += tag(o, 'removeGrossMotorOpt'); });
    h += `</div>`;
    h += `<div class="custom-add-row"><input type="text" id="newGrossMotorOpt" placeholder="新增选项" onkeydown="if(event.key==='Enter'){event.preventDefault();addGrossMotorOpt();}"><button class="btn btn-primary" onclick="addGrossMotorOpt()">添加</button></div>`;
    grossSlot.innerHTML = h;
  }
  // 精细动作
  const fineSlot = document.querySelector('.manage-opt-slot[data-opt-for="fineMotor"]');
  if (fineSlot) {
    let h = `<div class="cos-title-row"><div class="cos-title">✋ 精细动作选项</div>${savedTip}</div>`;
    h += `<div class="custom-options-tags">`;
    fineMotorOptions.forEach(o => { h += tag(o, 'removeFineMotorOpt'); });
    h += `</div>`;
    h += `<div class="custom-add-row"><input type="text" id="newFineMotorOpt" placeholder="新增选项" onkeydown="if(event.key==='Enter'){event.preventDefault();addFineMotorOpt();}"><button class="btn btn-primary" onclick="addFineMotorOpt()">添加</button></div>`;
    fineSlot.innerHTML = h;
    // 恢复默认选项按钮放在最后一个选项区之后
    fineSlot.insertAdjacentHTML('afterend',
      `<div class="custom-add-row" style="margin-top:14px;"><button class="btn" style="flex:1;font-size:13px;" onclick="openResetOptionsConfirm()">🔄 恢复默认选项</button></div>`);
  }
  // 辅食食物（v3.5.74 条目较多，容器限高可滚动）
  const solidSlot = document.querySelector('.manage-opt-slot[data-opt-for="solidFood"]');
  if (solidSlot) {
    let h = `<div class="cos-title-row"><div class="cos-title">🥣 辅食食物选项</div>${savedTip}</div>`;
    h += `<div class="custom-options-tags sf-tags">`;
    solidFoodOptions.forEach(o => { h += tag(o, 'removeSolidFoodOpt'); });
    h += `</div>`;
    h += `<div class="custom-add-row"><input type="text" id="newSolidFoodOpt" placeholder="新增食物" onkeydown="if(event.key==='Enter'){event.preventDefault();addSolidFoodOpt();}"><button class="btn btn-primary" onclick="addSolidFoodOpt()">添加</button></div>`;
    solidSlot.innerHTML = h;
  }
}
function _optLenLimit(val) {
  if (val.length > 12) { showToast('选项名最多 12 个字'); return false; }
  if (/^\d+$/.test(val)) { showToast('选项名不能纯数字'); return false; }
  return true;
}
function addGrossMotorOpt() {
  const inp = document.getElementById('newGrossMotorOpt'); const val = inp.value.trim();
  if (!val) return; if (grossMotorOptions.includes(val)) { showToast('已存在'); return; }
  if (!_optLenLimit(val)) return;
  grossMotorOptions.push(val); saveCustomOptions(); renderCustomOptionsSection();
  markOptDeleted('grossMotorDeleted', val, false);
  showToast('已添加「' + val + '」，长期有效');
}
function removeGrossMotorOpt(opt) {
  if (!confirm(`删除大运动选项「${opt}」？\n已记录的条目不会受影响。`)) return;
  grossMotorOptions = grossMotorOptions.filter(o => o !== opt); saveCustomOptions(); renderCustomOptionsSection();
  markOptDeleted('grossMotorDeleted', opt, true);
  showToast('已删除「' + opt + '」');
}
function addFineMotorOpt() {
  const inp = document.getElementById('newFineMotorOpt'); const val = inp.value.trim();
  if (!val) return; if (fineMotorOptions.includes(val)) { showToast('已存在'); return; }
  if (!_optLenLimit(val)) return;
  fineMotorOptions.push(val); saveCustomOptions(); renderCustomOptionsSection();
  markOptDeleted('fineMotorDeleted', val, false);
  showToast('已添加「' + val + '」，长期有效');
}
function removeFineMotorOpt(opt) {
  if (!confirm(`删除精细动作选项「${opt}」？\n已记录的条目不会受影响。`)) return;
  fineMotorOptions = fineMotorOptions.filter(o => o !== opt); saveCustomOptions(); renderCustomOptionsSection();
  markOptDeleted('fineMotorDeleted', opt, true);
  showToast('已删除「' + opt + '」');
}
// v3.5.74 辅食食物选项增删
function addSolidFoodOpt() {
  const inp = document.getElementById('newSolidFoodOpt'); const val = (inp && inp.value ? inp.value : '').trim();
  if (!val) return; if (solidFoodOptions.includes(val)) { showToast('已存在'); return; }
  if (!_optLenLimit(val)) return;
  solidFoodOptions.push(val); saveCustomOptions(); renderCustomOptionsSection();
  markOptDeleted('solidFoodDeleted', val, false);
  showToast('已添加「' + val + '」，长期有效');
}
function removeSolidFoodOpt(opt) {
  if (!confirm(`删除辅食食物「${opt}」？\n已记录的条目不会受影响。`)) return;
  solidFoodOptions = solidFoodOptions.filter(o => o !== opt); saveCustomOptions(); renderCustomOptionsSection();
  markOptDeleted('solidFoodDeleted', opt, true);
  showToast('已删除「' + opt + '」');
}
// 删除记录：防止"出厂默认项"在下次加载时被自动补回（用户主动删掉的要保持删除）
function markOptDeleted(key, val, del) {
  let arr = safeParseArr(localStorage.getItem(key));
  if (del) { if (!arr.includes(val)) arr.push(val); }
  else { arr = arr.filter(o => o !== val); }
  localStorage.setItem(key, JSON.stringify(arr));
}
function resetCustomOptions() { grossMotorOptions = [...DEFAULT_GROSS_MOTOR]; fineMotorOptions = [...DEFAULT_FINE_MOTOR]; solidFoodOptions = [...DEFAULT_SOLID_FOODS]; saveCustomOptions(); renderCustomOptionsSection(); }
function openResetOptionsConfirm() {
  const removedG = grossMotorOptions.filter(o => !DEFAULT_GROSS_MOTOR.includes(o));
  const removedF = fineMotorOptions.filter(o => !DEFAULT_FINE_MOTOR.includes(o));
  const removedS = solidFoodOptions.filter(o => !DEFAULT_SOLID_FOODS.includes(o));
  const el = document.getElementById('optionsResetPreview');
  if (el) {
    const all = [...removedG, ...removedF, ...removedS];
    el.innerHTML = all.length
      ? `将移除你添加的 ${all.length} 个选项：<span style="color:#e17055;">${all.join('、')}</span>`
      : '当前没有自定义选项，恢复后与现状一致。';
  }
  showModal('optionsResetModal');
}
function doResetCustomOptions() {
  resetCustomOptions();
  localStorage.setItem('grossMotorDeleted', '[]');
  localStorage.setItem('fineMotorDeleted', '[]');
  localStorage.setItem('solidFoodDeleted', '[]');
  hideModal('optionsResetModal');
  showToast('已恢复默认选项');
}
function saveManage() { saveHiddenActivities(); renderCategoryBar(); renderCards(); hideModal('manageModal'); showToast('已保存'); }
// v3.5.99 AI 里程碑归类配置（用户自带密钥，localStorage 设备级，不落云端）
function loadAITagUI() {
  let cfg = {}; try { cfg = JSON.parse(localStorage.getItem('ai_tag_cfg') || '{}'); } catch {}
  const prov = document.getElementById('aiTagProvider'); if (prov) prov.value = cfg.provider || 'deepseek';
  // v3.5.101 模型名默认显示服务商默认值（如 DeepSeek→deepseek-v4-flash），不再留空
  const modelEl = document.getElementById('aiTagModel');
  if (modelEl) modelEl.value = (cfg.model && cfg.model.trim()) ? cfg.model.trim() : ((LLM_PROVIDERS[prov.value] || {}).model || '');
  const baseEl = document.getElementById('aiTagBase'); if (baseEl) baseEl.value = cfg.base || '';
  if (prov) onAITagProviderChange();
  // v3.5.101/102 API Key 永不显示明文（同订阅推送规则）：本机覆盖密钥 或 家庭云端默认密钥 存在即显示掩码；
  // 勾选「显示明文」也只显示掩码（toggleAITagSee 强制）；真实密钥仅运行时内存用，绝不明文展示
  const keyEl = document.getElementById('aiTagKey');
  const see = document.getElementById('aiTagSee');
  if (keyEl) {
    if (see) see.checked = false;
    keyEl.type = 'password';
    keyEl.value = (cfg.apiKey || _cloudAITagKey) ? XF_MASK : '';
    bindAITagKeyMaskEvents();
    // 云端默认密钥可能尚未加载完：加载完成后若仍为空且云端有密钥则补显掩码
    if (!_cloudAITagKeyLoaded) {
      loadCloudAITagKey().then(() => { if (keyEl && !keyEl.value.trim() && _cloudAITagKey) keyEl.value = XF_MASK; }).catch(() => {});
    }
    const hint = document.getElementById('aiTagHint');
    if (hint && _cloudAITagKey && !cfg.apiKey) hint.textContent = '● 当前使用家庭云端默认密钥（已加密同步，不可见明文）';
  }
  const hint = document.getElementById('aiTagHint'); if (hint) hint.textContent = '';
}
function onAITagProviderChange() {
  const prov = document.getElementById('aiTagProvider');
  const baseRow = document.getElementById('aiTagBaseRow');
  if (prov && baseRow) baseRow.style.display = (prov.value === 'custom') ? 'flex' : 'none';
  // v3.5.101 切换服务商时同步把模型名默认成该服务商的默认值（用户未自定义时）
  const modelEl = document.getElementById('aiTagModel');
  if (modelEl && (!modelEl.value || !modelEl.value.trim())) {
    modelEl.value = ((LLM_PROVIDERS[prov.value] || {}).model || '');
  }
}
function bindAITagKeyMaskEvents() {
  const el = document.getElementById('aiTagKey');
  if (!el || el._maskBound) return; el._maskBound = true;
  // 聚焦时若显示的是掩码则清空，方便输入新密钥；失焦若为空则恢复掩码显示
  el.addEventListener('focus', function() { if (this.value === XF_MASK) this.value = ''; });
  el.addEventListener('blur', function() {
    const saved = (() => { try { return JSON.parse(localStorage.getItem('ai_tag_cfg') || '{}').apiKey; } catch { return ''; } })();
    if (!this.value.trim()) this.value = saved ? XF_MASK : '';
  });
}
function toggleAITagSee() {
  // v3.5.101 即使勾选「显示明文」也只切换输入框类型，但值始终是掩码（同订阅推送），真实密钥不落地显示
  const ck = document.getElementById('aiTagSee');
  const el = document.getElementById('aiTagKey');
  if (el && ck) el.type = ck.checked ? 'text' : 'password';
}
function saveAITagConfig() {
  const prov = document.getElementById('aiTagProvider').value;
  const rawKey = document.getElementById('aiTagKey').value.trim();
  const model = document.getElementById('aiTagModel').value.trim();
  const base = document.getElementById('aiTagBase').value.trim();
  let cfg = {}; try { cfg = JSON.parse(localStorage.getItem(AI_TAG_CFG_KEY) || '{}'); } catch {}
  // v3.5.102 掩码/空 = 未改密钥：保留本机覆盖密钥；本机也没有则回落家庭云端默认（不写本地密钥）
  let apiKey = (rawKey === XF_MASK || !rawKey) ? (cfg.apiKey || '') : rawKey;
  if (prov === 'custom' && !base) { showToast('自定义需填写接口地址'); return; }
  localStorage.setItem(AI_TAG_CFG_KEY, JSON.stringify({ provider: prov, apiKey, model, base }));
  // v3.5.102 提示当前生效的密钥来源
  if (apiKey) showToast('已保存 AI 归类配置（本机覆盖密钥）');
  else if (_cloudAITagKey) showToast('已保存（使用家庭云端默认密钥）');
  else showToast('已保存（未设置密钥，将回退规则分类）');
}
async function testAITagConfig() {
  const cfg = getAITagConfig();
  const hint = document.getElementById('aiTagHint');
  if (!cfg) { if (hint) hint.textContent = '请先填写并保存 API Key'; return; }
  if (hint) hint.textContent = '测试中…';
  const r = await classifyMilestoneLLM('宝宝今天第一次自己翻身了，好开心', cfg);
  if (hint) hint.textContent = r
    ? ('✓ 返回：' + (r.label || '—') + '（' + msDomainById(r.domainId).name + '）')
    : '✗ 调用失败（检查密钥 / 网络 / CORS；OpenAI 需走自定义+代理）';
}

/* ==================== 日报复制 ==================== */
function buildReportText() {
  const t = new Date(); const ds = `${t.getFullYear()}-${String(t.getMonth()+1).padStart(2,'0')}-${String(t.getDate()).padStart(2,'0')}`;
  const records = getTodayRecords();
  let text = `${BABY_NAME}的日常 (${ds})\n${document.getElementById('ageInfo').textContent}\n`;
  const h = localStorage.getItem('babyHeight'), w = localStorage.getItem('babyWeight');
  if (h || w) text += `高${h||'-'}cm 重${w||'-'}kg\n`;
  text += '\u2500'.repeat(20) + '\n';
  const noteRecords = [];
  if (records.length === 0) { text += '今天还没有记录哦~\n'; } else {
    const stats = {};
    records.forEach(r => {
      if (!stats[r.type]) stats[r.type] = { name: r.name, count: 0, duration: 0, totalMilk: 0 };
      stats[r.type].count++;
      if (r.duration !== undefined) stats[r.type].duration += r.duration;
      if (r.milkAmount !== undefined) stats[r.type].totalMilk += r.milkAmount;
      if (r.note && r.note.trim()) noteRecords.push({ time: r.recTime || r.time || '', name: r.name, note: r.note.trim() });
    });
    CATEGORIES.forEach(cat => { ACTIVITIES.filter(a => a.category === cat.id && !hiddenActivities.includes(a.id)).forEach(act => { const s = stats[act.id]; if (!s) return; let line = `${act.name}: `; if (act.type === 'milk') line += `${s.count}次 ${s.totalMilk}ml`; else if (act.type === 'sleep') { const hh = Math.floor(s.duration / 60); const mm = Math.round(s.duration % 60); line += `${s.count}次 ${hh}h ${mm}min`; } else if (s.duration > 0) line += `${s.duration.toFixed(1)}分钟`; else line += `${s.count}次`; text += line + '\n'; if (act.type === 'milk') text += `喝奶（水+奶）: ${Math.round(s.totalMilk * 1.12)}ml\n`; }); });
    if (noteRecords.length > 0) {
      noteRecords.sort((a, b) => (a.time || '').localeCompare(b.time || ''));
      text += '\n📝 备注:\n';
      noteRecords.forEach(n => { text += `${n.time} ${n.name}: ${n.note.replace(/\n/g, ' / ')}\n`; });
    }
    text += `总记录数: ${records.length}条\n`;
  }
  text += '\u2500'.repeat(20) + '\n记录于 小咕噜的日常';
  return text;
}
function copyReport() { copyTextToClipboard(buildReportText()); }
// v3.5.125 okMsg 可选：允许调用方自定义成功提示（默认为「已复制到剪贴板」）
function copyTextToClipboard(text, okMsg) {
  const m = okMsg || '已复制到剪贴板';
  if (navigator.clipboard) { navigator.clipboard.writeText(text).then(() => showToast(m)).catch(() => fallbackCopyText(text, m)); }
  else fallbackCopyText(text, m);
}
function fallbackCopyText(text, okMsg) { const ta = document.createElement('textarea'); ta.value = text; ta.style.cssText = 'position:fixed;opacity:0;'; document.body.appendChild(ta); ta.select(); try { document.execCommand('copy'); showToast(okMsg || '已复制到剪贴板'); } catch { showToast('复制失败'); } document.body.removeChild(ta); }

/* ==================== 备忘录 ==================== */
const MEMO_KEY = 'memo_data_v1';
let _memoSeq = 0;
let _memoEditingId = null;
function getMemos() {
  try { const d = JSON.parse(localStorage.getItem(MEMO_KEY) || '{}'); const items = Array.isArray(d.items) ? d.items : []; _memoSeq = items.reduce((m, x) => Math.max(m, x.id || 0), 0); return items; }
  catch { return []; }
}
function saveMemos(items) { localStorage.setItem(MEMO_KEY, JSON.stringify({ items })); saveMemoCloud(); }
function _memoNextId() { return ++_memoSeq; }
function _escHtml(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '<br>'); }
// v3.5.120 textarea 内容转义：保留原始换行（不能像 _escHtml 那样把 \n 变成 <br>）
function _escTa(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
// v3.5.120 行内编辑文本域随内容自动增高（上限 200px，超过则内部滚动）
function _memoEditAutoGrow(el) {
  if (!el) return;
  el.style.height = 'auto';
  el.style.height = Math.min(el.scrollHeight, 200) + 'px';
}
function _escAttr(s) { return String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
const MEMO_EDIT_SVG = '<svg viewBox="0 0 24 24"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>';
const MEMO_DEL_SVG = '<svg viewBox="0 0 24 24"><path d="M3 6h18"/><path d="M8 6V4h8v2"/><path d="M6 6l1 14h10l1-14"/><path d="M10 10v6"/><path d="M14 10v6"/></svg>';

function openMemo() {
  _memoEditingId = null;
  const ta = document.getElementById('memoInput'); if (ta) ta.value = '';
  renderMemo();
  showModal('memoModal');
}
function closeMemo() {
  _memoEditingId = null;
  hideModal('memoModal');
}
function renderMemo() {
  const items = getMemos();
  const todos = items.filter(i => !i.done);
  const dones = items.filter(i => i.done);
  const tl = document.getElementById('memoTodoList');
  const dl = document.getElementById('memoDoneBody');
  document.getElementById('memoTodoCnt').textContent = todos.length;
  document.getElementById('memoDoneCnt').textContent = dones.length;
  if (!tl) return;
  tl.innerHTML = todos.length ? '' : '<div class="memo-empty">暂无待办，添加一条吧～</div>';
  todos.forEach(it => {
    if (_memoEditingId === it.id) {
      // v3.5.120 改为多行 textarea：长文本可换行完整可见（原来是单行 input，看不到后面的内容）
      tl.innerHTML += `<div class="memo-item memo-item-editing">
        <div class="memo-check" onclick="toggleMemoDone(${it.id})"></div>
        <div class="memo-edit-wrap">
          <textarea class="memo-edit-input" id="mei_${it.id}" rows="2" placeholder="输入待办事项…" oninput="_memoEditAutoGrow(this)" onkeydown="_memoEditKey(event,${it.id})">${_escTa(it.text)}</textarea>
          <div class="memo-edit-actions">
            <span class="memo-mini-save" onclick="saveMemoEdit(${it.id})">保存</span>
            <span class="memo-mini-cancel" onclick="cancelMemoEdit()">取消</span>
          </div>
        </div>
      </div>`;
    } else {
      tl.innerHTML += `<div class="memo-item">
        <div class="memo-check" onclick="toggleMemoDone(${it.id})"></div>
        <div class="memo-content">${_escHtml(it.text)}</div>
        <span class="rec-edit" onclick="startMemoEdit(${it.id})" title="编辑">${MEMO_EDIT_SVG}</span>
        <span class="rec-delete" onclick="deleteMemo(${it.id})" title="删除">${MEMO_DEL_SVG}</span>
      </div>`;
    }
  });
  dl.innerHTML = dones.map(it => `<div class="memo-item memo-done-item">
      <div class="memo-check done" onclick="toggleMemoDone(${it.id})">✓</div>
      <div style="flex:1;min-width:0;"><div class="memo-content">${_escHtml(it.text)}</div><div class="memo-date">${_escHtml(it.date || '')}</div></div>
      <span class="rec-delete" onclick="deleteMemo(${it.id})" title="删除">${MEMO_DEL_SVG}</span>
    </div>`).join('');
}
function addMemo() {
  const ta = document.getElementById('memoInput'); if (!ta) return;
  const v = ta.value.trim();
  if (!v) { showToast('请输入内容'); return; }
  const items = getMemos();
  items.unshift({ id: _memoNextId(), text: v, done: false, date: '' });
  saveMemos(items); ta.value = ''; renderMemo();
}
function toggleMemoDone(id) {
  const items = getMemos(); const i = items.findIndex(x => x.id === id); if (i < 0) return;
  if (!items[i].done) { const it = items[i]; it.done = true; it.date = getTodayDateStr(); items.splice(i, 1); items.unshift(it); }
  else { items[i].done = false; items[i].date = ''; }
  saveMemos(items); renderMemo();
}
// v3.5.120 多行编辑快捷键：回车=换行，Ctrl/Cmd+回车=保存，Esc=取消
function _memoEditKey(e, id) {
  if (e.key === 'Escape') { e.preventDefault(); cancelMemoEdit(); }
  else if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); saveMemoEdit(id); }
}
function startMemoEdit(id) {
  _memoEditingId = id; renderMemo();
  const el = document.getElementById('mei_' + id);
  if (el) { el.focus(); el.setSelectionRange(el.value.length, el.value.length); _memoEditAutoGrow(el); }
}
function saveMemoEdit(id) {
  const el = document.getElementById('mei_' + id); if (!el) return;
  const v = el.value.trim(); if (!v) { showToast('内容不能为空'); return; }
  const items = getMemos(); const i = items.findIndex(x => x.id === id); if (i < 0) return;
  items[i].text = v; _memoEditingId = null; saveMemos(items); renderMemo();
}
function cancelMemoEdit() { _memoEditingId = null; renderMemo(); }
function deleteMemo(id) {
  const items = getMemos().filter(x => x.id !== id); saveMemos(items); renderMemo();
}
function toggleMemoDoneExpand() {
  const h = document.getElementById('memoDoneHead'), b = document.getElementById('memoDoneBody');
  if (h && b) { h.classList.toggle('open'); b.classList.toggle('open'); }
}

/* ---------- 备忘录加密同步家庭云（v3.5.115） ----------
 * 此前备忘录只存本机 localStorage，清缓存/换设备即丢。现与知识库/历史对话共用同一套端到端加密。
 * 合并策略：本地 + 云端按 id 取并集，本地已存在的条目优先（绝不覆盖本地内容）。 */
async function loadMemoCloud() {
  if (!isSyncReady()) return false;
  try {
    const key = await getCryptoKey(); if (!key) return false;
    const rows = await supabaseGet(`family_config?family_id=eq.${getFamilyId()}&config_key=eq.${MEMO_CLOUD_KEY}&select=encrypted_data,iv`);
    if (rows.length > 0 && rows[0].encrypted_data && rows[0].iv) {
      const json = await decrypt(key, rows[0].encrypted_data, rows[0].iv);
      const arr = JSON.parse(json);
      if (Array.isArray(arr) && arr.length) {
        const local = getMemos();
        const map = new Map();
        arr.forEach(m => { if (m && m.id != null) map.set(m.id, m); });   // 云端先入
        local.forEach(m => { if (m && m.id != null) map.set(m.id, m); });  // 本地后入 → 本地优先
        const merged = [...map.values()].sort((a, b) => (b.id || 0) - (a.id || 0));
        localStorage.setItem(MEMO_KEY, JSON.stringify({ items: merged }));
        _memoSeq = merged.reduce((m, x) => Math.max(m, x.id || 0), 0);
        if (document.getElementById('memoModal') && document.getElementById('memoModal').classList.contains('show')) renderMemo();
        return true;
      }
    }
  } catch (e) { console.warn('[Memo] 云端加载失败:', e); }
  return false;
}
async function saveMemoCloud() {
  if (!isSyncReady()) return;
  try {
    const key = await getCryptoKey(); if (!key) return;
    const { data, iv } = await encrypt(key, JSON.stringify(getMemos()));
    await supabaseUpsert('family_config', { family_id: getFamilyId(), config_key: MEMO_CLOUD_KEY, encrypted_data: data, iv, last_modified: Date.now() });
  } catch (e) { console.warn('[Memo] 云端保存失败:', e); }
}

/* ==================== 数据分析 ==================== */
function getBodyHistory() {
  try { const a = JSON.parse(localStorage.getItem('bodyHistory') || '[]'); return Array.isArray(a) ? a : []; } catch { return []; }
}
// field: 'h' | 'w'；dateStr 省略时记到今天。val 传 null 表示清除该字段
// （历史弹窗用来补录/修改过去某一天的高重）
function recordBodyMeasurement(field, val, dateStr) {
  let hist = getBodyHistory();
  const ds = dateStr || getTodayDateStr();
  if (hist.length === 0) {
    // 首次记录：以当前已有值作为曲线起点
    const h = parseFloat(localStorage.getItem('babyHeight')) || null;
    const w = parseFloat(localStorage.getItem('babyWeight')) || null;
    if (h || w) hist.push({ d: ds, h: h, w: w });
  }
  let rec = hist.find(x => x.d === ds);
  if (!rec) {
    if (val == null) return;                 // 本来就没有记录，无需清除
    rec = { d: ds, h: null, w: null }; hist.push(rec);
  }
  rec[field] = val;
  // 高和重都被清空 → 整条记录移除，避免曲线上留下空白点
  if (rec.h == null && rec.w == null) hist = hist.filter(x => x.d !== ds);
  hist.sort((a, b) => a.d.localeCompare(b.d));
  const serialized = JSON.stringify(hist);
  // v3.5.76 幂等：内容没变就不重复写盘/上传（oninput/onchange/onblur 可能多次触发）
  if (localStorage.getItem('bodyHistory') === serialized) return;
  localStorage.setItem('bodyHistory', serialized);
  bumpConfigTs('bodyHistory');   // 打上本地时间戳，避免同步拉取把刚记录的曲线点覆盖掉
  syncUpload('config');
  // 如果分析弹窗正打开，实时刷新图表
  if (document.getElementById('analysisModal') && document.getElementById('analysisModal').classList.contains('show')) {
    openAnalysis();
  }
}
// 补充历史身高体重数据（幂等，仅首次或缺失时填入）
function seedBodyHistory() {
  let hist = getBodyHistory();
  const seedData = [
    // 2026-04 ~ 2026-07 历史体重
    { d: '2026-04-25', h: 50,   w: 3.34 },
    { d: '2026-05-10', h: null, w: 3.54 },
    { d: '2026-05-11', h: null, w: 3.60 },
    { d: '2026-05-12', h: null, w: 3.62 },
    { d: '2026-05-14', h: null, w: 3.70 },
    { d: '2026-05-15', h: null, w: 3.70 },
    { d: '2026-05-16', h: null, w: 3.73 },
    { d: '2026-05-17', h: null, w: 3.76 },
    { d: '2026-05-18', h: null, w: 3.76 },
    { d: '2026-05-19', h: null, w: 3.79 },
    { d: '2026-05-21', h: null, w: 3.86 },
    { d: '2026-05-22', h: 54,   w: 3.89 },
    { d: '2026-05-23', h: null, w: 3.92 },
    { d: '2026-05-24', h: null, w: 3.92 },
    { d: '2026-05-26', h: null, w: 3.96 },
    { d: '2026-05-28', h: null, w: 4.04 },
    { d: '2026-05-29', h: null, w: 4.11 },
    { d: '2026-05-30', h: null, w: 4.12 },
    { d: '2026-05-31', h: null, w: 4.15 },
    { d: '2026-06-01', h: null, w: 4.15 },
    { d: '2026-06-02', h: null, w: 4.24 },
    { d: '2026-06-03', h: null, w: 4.27 },
    { d: '2026-06-04', h: null, w: 4.27 },
    { d: '2026-06-05', h: null, w: 4.32 },
    { d: '2026-06-06', h: null, w: 4.35 },
    { d: '2026-06-07', h: 56.5, w: 4.42 },
    { d: '2026-06-08', h: null, w: 4.43 },
    { d: '2026-06-09', h: null, w: 4.48 },
    { d: '2026-06-10', h: null, w: 4.48 },
    { d: '2026-06-11', h: null, w: 4.49 },
    { d: '2026-06-12', h: null, w: 4.55 },
    { d: '2026-06-13', h: 57,   w: 4.60 },
    { d: '2026-06-14', h: null, w: 4.60 },
    { d: '2026-06-15', h: null, w: 4.65 },
    { d: '2026-06-20', h: 59.1, w: 4.75 },
    { d: '2026-06-22', h: null, w: 4.80 },
    { d: '2026-07-01', h: null, w: 5.20 },
    { d: '2026-07-09', h: null, w: 5.45 },
    { d: '2026-07-17', h: null, w: 5.55 },
    // 现有数据（保留）
    { d: '2026-08-10', h: 61.0, w: 5.70 },
    { d: '2026-08-18', h: 62.5, w: 5.87 },
    { d: '2026-08-20', h: 62.5, w: 6.10 }
  ];
  let changed = false;
  seedData.forEach(s => {
    const existing = hist.find(x => x.d === s.d);
    if (!existing) {
      hist.push({ d: s.d, h: s.h, w: s.w });
      if (s.h != null || s.w != null) changed = true;
    }
    else {
      const hadH = existing.h != null, hadW = existing.w != null;
      if (s.h != null && !hadH) { existing.h = s.h; changed = true; }
      if (s.w != null && !hadW) { existing.w = s.w; changed = true; }
    }
  });
  if (changed) {
    hist.sort((a, b) => a.d.localeCompare(b.d));
    localStorage.setItem('bodyHistory', JSON.stringify(hist));
    syncUpload('config');
  }
}
// 相同数值只保留最早日期（按日期升序遍历去重）
function dedupeBodySeries(points) {
  // v3.5.9 修复：按"日期"去重（同一天只保留一条），而不是按"数值"去重
  // 旧逻辑按值去重会导致：当天体重/身高与历史某天相同时，当天的数据点从曲线上消失
  const seen = new Set(); const out = [];
  for (const p of points) {
    if (p.v == null) continue;
    if (!seen.has(p.d)) { seen.add(p.d); out.push(p); }
  }
  return out;
}
function dailyMilkTotal(ds) {
  const recs = getRecordsByDate(ds);   // v3.5.79 统一过滤脏记录，避免脏数据计入图表
  let total = 0;
  recs.forEach(r => { if (r.type === 'milk' && r.milkAmount) total += r.milkAmount; });
  return total > 0 ? total : null;
}
function dailySleepHours(ds) {
  const recs = getRecordsByDate(ds);
  let total = 0;
  recs.forEach(r => { if (r.type === 'sleep' && r.duration) total += r.duration; });
  return total > 0 ? total / 60 : null;
}
function dailyMilkCount(ds) {
  const recs = getRecordsByDate(ds);
  let count = 0;
  recs.forEach(r => { if (r.type === 'milk') count++; });
  return count > 0 ? count : null;
}
function dailyPoopInfo(ds) {
  // 返回 { count, statuses: [状态文字] }，无记录返回 null
  const recs = getRecordsByDate(ds);
  const statuses = [];
  recs.forEach(r => { if (r.type === 'poop') statuses.push(r.poopStatus || '正常'); });
  return statuses.length > 0 ? { count: statuses.length, statuses: statuses } : null;
}
/* ==================== v3.5.70 大便与喝奶时间间隔 ==================== */
// 干预时间点：在间隔趋势图上以竖线分隔标注，方便对比「加乳糖酶」等措施前后的变化。
// 想增减标记，直接改下面这行；也可在浏览器控制台执行（会一直生效）：
//   localStorage.setItem('interventionMarks', JSON.stringify([{date:'2026-09-08',label:'加乳糖酶'}]))
const DEFAULT_INTERVENTION_MARKS = [{ date: '2026-09-08', label: '加乳糖酶' }];
function getInterventionMarks() {
  try {
    const raw = localStorage.getItem('interventionMarks');
    if (raw) {
      const a = JSON.parse(raw);
      if (Array.isArray(a)) return a.filter(m => m && typeof m.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(m.date));
    }
  } catch {}
  return DEFAULT_INTERVENTION_MARKS;
}
// 截止「昨天」的全部历史：只保留当天确实有大便、且能算出间隔的日期（其余不画点）
function collectPoopGapSeries() {
  const cache = {};
  const load = d => {
    if (!(d in cache)) cache[d] = getRecordsByDate(d);   // v3.5.79 过滤脏记录
    return cache[d];
  };
  const todayDs = getTodayDateStr();
  const keys = [];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    const m = /^records_(\d{4}-\d{2}-\d{2})$/.exec(k || '');
    if (m) keys.push(m[1]);
  }
  keys.sort();
  const out = [];
  keys.forEach(ds => {
    if (ds >= todayDs) return;              // 截止昨天：今天及以后不参与（当天还没过完）
    const g = dailyPoopMilkGap(ds, load);
    if (!g) return;                         // 当天没大便（或没有可参照的喝奶）→ 排除该数据点
    const p = ds.split('-');
    out.push({
      ds: ds,
      label: `${parseInt(p[1], 10)}/${parseInt(p[2], 10)}`,
      value: g.avg,
      count: g.count,
      t: Date.parse(ds)                     // 与体重/身高图一致：按 UTC 日期，横轴按真实日期间隔等分
    });
  });
  return out;
}
// 口径（v3.5.72）：对当天每一次大便，找到「早于它、且离它最近」的那次喝奶，
//      间隔 = 大便时间 − 那次喝奶时间（分钟，非负）；再把当天所有大便的间隔求平均，作为这天的数据点。
//      喝奶只在「当天 + 往前回溯 3 天」里找：凌晨的大便能匹配到前一天夜奶；
//      若某次大便之前回溯范围内都没有喂奶记录，则该次大便不参与当天的平均。
function _hmToMin(hm) {
  const m = /^(\d{1,2}):(\d{1,2})$/.exec(String(hm == null ? '' : hm).trim());
  if (!m) return null;
  const h = parseInt(m[1], 10), mi = parseInt(m[2], 10);
  if (isNaN(h) || isNaN(mi) || h > 23 || mi > 59) return null;
  return h * 60 + mi;
}
function _dsToBaseMs(ds) {
  const p = String(ds == null ? '' : ds).split('-').map(Number);
  if (p.length !== 3 || p.some(isNaN)) return null;
  return new Date(p[0], p[1] - 1, p[2], 0, 0, 0, 0).getTime();
}
function _shiftDs(ds, days) {
  const b = _dsToBaseMs(ds); if (b == null) return null;
  const d = new Date(b); d.setDate(d.getDate() + days);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
// 返回 { avg: 平均间隔分钟, count: 参与平均的大便次数, min, max } 或 null（当天无大便/无喝奶记录）
// loader: 可选的取记录函数（全历史扫描时传入带缓存的版本，避免同一天被反复解析）
function dailyPoopMilkGap(ds, loader) {
  const load = loader || getRecordsByDate;   // v3.5.79 过滤脏记录
  const base = _dsToBaseMs(ds); if (base == null) return null;
  const recs = load(ds);
  if (!Array.isArray(recs)) return null;
  const poopAbs = [];
  recs.forEach(r => {
    if (!r || r.type !== 'poop') return;
    const t = _hmToMin(r.poopTime || r.recTime || r.time);
    if (t != null) poopAbs.push(base + t * 60000);
  });
  if (poopAbs.length === 0) return null;   // 当天没大便 → 该天无数据点
  // v3.5.72 只收集「当天 + 往前回溯数天」的喝奶时间点：取早于大便的那一次（喂奶 → 排便的方向）
  const milkAbs = [];
  [0, -1, -2, -3].forEach(off => {
    const d2 = _shiftDs(ds, off); if (!d2) return;
    const b2 = _dsToBaseMs(d2);
    const rs = load(d2);
    if (!Array.isArray(rs)) return;
    rs.forEach(r => {
      if (!r || r.type !== 'milk') return;
      const t = _hmToMin(r.milkTime || r.recTime || r.time);
      if (t != null) milkAbs.push(b2 + t * 60000);
    });
  });
  if (milkAbs.length === 0) return null;   // 回溯范围内没有喝奶记录 → 无法计算间隔
  const gaps = [];
  poopAbs.forEach(p => {
    let best = null;
    milkAbs.forEach(m => {
      if (m > p) return;                   // 晚于大便的喝奶不算（只认"喂完奶之后拉"）
      const g = (p - m) / 60000;           // 大便时间 − 之前最近一次喝奶时间
      if (best === null || g < best) best = g;
    });
    if (best != null) gaps.push(best);     // 之前确实没有喂奶记录的样本直接跳过
  });
  if (gaps.length === 0) return null;
  const sum = gaps.reduce((a, b) => a + b, 0);
  return {
    avg: Math.round(sum / gaps.length),
    count: gaps.length,
    min: Math.round(Math.min(...gaps)),
    max: Math.round(Math.max(...gaps))
  };
}
// 通用折线图（内联SVG，无外部依赖；点击数据点显示横纵坐标）
let _chartTipSeq = 0;
// v3.5.13 图表 Y 轴档位状态：compact/undefined=紧凑档（数据范围），full=全量档（含 WHO 参考线）
let _chartZoomState = {};
// v3.5.19 +/− 缩放：+ 放大到数据档（紧凑），− 缩小到全量档（含 WHO）
function chartZoomIn(chartTitle) { if (_chartZoomState[chartTitle] !== 'compact') { _chartZoomState[chartTitle] = 'compact'; openAnalysis(); } }
function chartZoomOut(chartTitle) { if (_chartZoomState[chartTitle] !== 'full') { _chartZoomState[chartTitle] = 'full'; openAnalysis(); } }
function makeLineChart(data, opts) {
  const title = opts.title, unit = opts.unit || '', color = opts.color || '#74b9ff';
  const valid = data.filter(d => d.value != null);
  const head = `<div class="chart-card"><div class="chart-title">${title}</div>`;
  if (valid.length === 0) return head + `<div class="chart-empty">暂无数据</div></div>`;
  const W = 360, H = 168, PL = 40, PR = 54, PT = 22, PB = 24;
  const iw = W - PL - PR, ih = H - PT - PB;
  const n = data.length;
  // 横轴：数据点带时间戳 t 时按日期间隔线性等分（间隔1天的图上距离是间隔2天的一半），否则按索引等分
  const tArr = data.map(d => d.t).filter(t => t != null);
  const hasT = tArr.length === n && n > 1 && Math.max(...tArr) > Math.min(...tArr);
  const tMin = hasT ? Math.min(...tArr) : 0, tMax = hasT ? Math.max(...tArr) : 1;
  // v3.5.18 WHO 图例移到标题行（HTML，不受 SVG 裁剪），SVG 内只保留 WHO 数据点+tooltip
  const whoLegend = opts.who && hasT
    ? `<span style="float:right;font-size:10px;color:#b2bec3;margin-right:4px;">` +
      `<span style="display:inline-block;width:6px;height:6px;border-radius:50%;background:#e87878;margin-right:2px;vertical-align:middle;"></span>3% ` +
      `<span style="display:inline-block;width:6px;height:6px;border-radius:50%;background:#8a90a6;margin-right:2px;vertical-align:middle;"></span>50% ` +
      `<span style="display:inline-block;width:6px;height:6px;border-radius:50%;background:#d4a03a;margin-right:2px;vertical-align:middle;"></span>75%</span>`
    : '';
  // v3.5.19 +/− 缩放按钮行：WHO 图例下方、图上方、靠最右侧（当前档高亮）
  const titleSafe = title.replace(/'/g, "\\'");
  const zoomRow = opts.zoomTiers
    ? `<div class="chart-zoom-row">` +
      `<span class="chart-zoom-btn ${_chartZoomState[title] === 'full' ? 'active' : ''}" onclick="event.stopPropagation();chartZoomOut('${titleSafe}')">−</span>` +
      `<span class="chart-zoom-btn ${_chartZoomState[title] !== 'full' ? 'active' : ''}" onclick="event.stopPropagation();chartZoomIn('${titleSafe}')">+</span>` +
      `</div>`
    : '';
  const head2 = `<div class="chart-card"><div class="chart-title">${title}${whoLegend}</div>${zoomRow}`;
  // WHO 参考曲线关键点：两端日期 + 范围内每月25号（月龄切换日），每点按该日期月龄取 p3/p50/p75
  let whoPts = null;
  if (opts.who && hasT) {
    whoPts = [];
    const addWhoPt = ts => {
      const dt = new Date(ts);
      const ds = `${dt.getUTCFullYear()}-${String(dt.getUTCMonth() + 1).padStart(2, '0')}-${String(dt.getUTCDate()).padStart(2, '0')}`;
      whoPts.push({ t: ts, row: getStdRow(opts.who.table, ds) });
    };
    addWhoPt(tMin);
    let cur = new Date(tMin);
    cur = new Date(Date.UTC(cur.getUTCFullYear(), cur.getUTCMonth(), 25));
    if (cur.getTime() <= tMin) cur = new Date(Date.UTC(cur.getUTCFullYear(), cur.getUTCMonth() + 1, 25));
    while (cur.getTime() < tMax) {
      addWhoPt(cur.getTime());
      cur = new Date(Date.UTC(cur.getUTCFullYear(), cur.getUTCMonth() + 1, 25));
    }
    addWhoPt(tMax);
    whoPts = whoPts.filter((p, i) => i === 0 || p.t !== whoPts[i - 1].t); // 去重（末端恰为25号）
  }
  // 纵坐标：v3.5.13 紧凑档（zoomTiers，默认）只按数据范围取轴；全量档含 WHO 参考曲线值
  const dataMax = Math.max(...valid.map(d => d.value));
  const dataMin = Math.min(...valid.map(d => d.value));
  const compactMode = opts.zoomTiers && _chartZoomState[title] !== 'full';
  let min, max, ticks;
  if (compactMode) {
    // 紧凑档：从 zoomTiers.min 到数据最大值所在档位，间隔 zoomTiers.step；WHO 线超出部分由 clipPath 裁剪
    min = opts.zoomTiers.min;
    max = Math.ceil(dataMax / opts.zoomTiers.step) * opts.zoomTiers.step;
    if (max <= min) max = min + opts.zoomTiers.step;
    ticks = [];
    for (let v = min; v <= max + 0.0001; v += opts.zoomTiers.step) ticks.push(Math.round(v * 100) / 100);
  } else if (opts.yMin !== undefined && opts.yStep) {
    min = opts.yMin;
    max = Math.ceil(dataMax / opts.yStep) * opts.yStep;
    if (max <= dataMax) max += opts.yStep;
    if (whoPts && whoPts.length > 1) {
      const refVals = whoPts.flatMap(p => [p.row.p3, p.row.p50, p.row.p75]);
      const refMin = Math.min(...refVals), refMax = Math.max(...refVals);
      min = Math.min(min, Math.floor(refMin / opts.yStep) * opts.yStep);
      max = Math.max(max, Math.ceil(refMax / opts.yStep) * opts.yStep);
    }
    if (max <= min) max = min + opts.yStep;
    ticks = [];
    for (let v = min; v <= max + 0.0001; v += opts.yStep) ticks.push(Math.round(v * 100) / 100);
  } else {
    min = dataMin;
    max = dataMax;
    if (max === min) { const p = Math.abs(max) * 0.1 || 1; min = Math.max(0, min - p); max = max + p; }
    else { const pad = (max - min) * 0.15; min = Math.max(0, min - pad); max = max + pad; }
    ticks = [min, (min + max) / 2, max];
  }
  const xf = i => {
    if (hasT) return PL + (iw * (data[i].t - tMin)) / (tMax - tMin);
    return PL + (n <= 1 ? iw / 2 : (iw * i) / (n - 1));
  };
  const yf = v => PT + ih - ((v - min) / (max - min)) * ih;
  const fmtV = opts.fmt ? opts.fmt : (v => v);
  const labelColor = opts.labelColor || '#fff';
  const tipId = 'ctip' + (++_chartTipSeq);
  // 折线（无数据日断开）+ 可点击数据点（含透明命中区）
  let path = '', dots = '', started = false;
  data.forEach((d, i) => {
    if (d.value == null) { started = false; return; }
    const px = xf(i).toFixed(2), py = yf(d.value).toFixed(2);
    path += (started ? 'L' : 'M') + px + ' ' + py + ' ';
    started = true;
    const valRaw = opts.tipText ? opts.tipText(d) : (fmtV(d.value) + unit);
    const valText = String(valRaw).replace(/'/g, "\\'").replace(/"/g, '&quot;');
    const labelText = d.label.replace(/'/g, "\\'").replace(/"/g, '&quot;');
    dots += `<circle class="chart-dot" cx="${px}" cy="${py}" r="3" fill="${color}" stroke="rgba(0,0,0,0.3)" stroke-width="1"/>` +
      `<circle class="chart-hit" cx="${px}" cy="${py}" r="11" fill="transparent" data-cx="${px}" data-cy="${py}" onclick="chartTip(this,'${tipId}','${labelText}','${valText}')"/>`;
  });
  // 点击提示浮层（默认隐藏）：白色加粗文字（tiptext 类：白天主题下不随 .chart-svg text 变深灰）
  const tip = `<g id="${tipId}" style="display:none" pointer-events="none"><rect rx="4" ry="4" height="20" fill="#2ecc71" stroke="rgba(255,255,255,0.45)" stroke-width="0.5"/><text class="tiptext" font-size="11" font-weight="bold" fill="#ffffff" x="6" y="14">?</text></g>`;
  // 网格线 + y轴刻度（按 ticks；gridln 类：白天主题下网格线变浅蓝）
  let grid = '', ylabels = '';
  ticks.forEach(v => {
    const gy = yf(v).toFixed(1);
    grid += `<line class="gridln" x1="${PL}" y1="${gy}" x2="${W - PR}" y2="${gy}" stroke="rgba(255,255,255,0.08)" stroke-width="1"/>`;
    ylabels += `<text x="${PL - 5}" y="${(parseFloat(gy) + 4).toFixed(1)}" fill="${labelColor}" font-size="9" text-anchor="end">${fmtV(Math.round(v * 10) / 10)}</text>`;
  });
  if (unit) ylabels += `<text x="${PL - 5}" y="13" fill="#fff" font-size="8.5" font-weight="bold" text-anchor="end">${unit}</text>`;
  // x轴标签：keyDates 模式显示首末日期 + 每月25号（按时间轴位置渲染，不依赖数据点）；默认按 step 抽稀
  let xlabels = '';
  if (opts.xTickMode === 'keyDates') {
    if (hasT) {
      // 按时间轴渲染：首末日期 + 范围内每月25号，即使该日期没有数据点也显示刻度
      const keyMap = new Map(); // 时间戳 -> 标签（自动去重：首/末恰为25号时只显示一次）
      const fmtTs = ts => { const dt = new Date(ts); return `${dt.getUTCMonth() + 1}/${dt.getUTCDate()}`; };
      keyMap.set(tMin, fmtTs(tMin));
      keyMap.set(tMax, fmtTs(tMax));
      let cur = new Date(tMin);
      cur = new Date(Date.UTC(cur.getUTCFullYear(), cur.getUTCMonth(), 25));
      if (cur.getTime() <= tMin) cur = new Date(Date.UTC(cur.getUTCFullYear(), cur.getUTCMonth() + 1, 25));
      while (cur.getTime() < tMax) {
        keyMap.set(cur.getTime(), fmtTs(cur.getTime()));
        cur = new Date(Date.UTC(cur.getUTCFullYear(), cur.getUTCMonth() + 1, 25));
      }
      Array.from(keyMap.keys()).sort((a, b) => a - b).forEach(ts => {
        const x = (PL + (iw * (ts - tMin)) / (tMax - tMin)).toFixed(1);
        xlabels += `<text x="${x}" y="${H - 8}" fill="#fff" font-size="9" text-anchor="middle">${keyMap.get(ts)}</text>`;
      });
    } else {
      // 无时间戳时退化为数据点判断（首/末/25号数据点）
      data.forEach((d, i) => {
        const dt = d.t != null ? new Date(d.t) : null;
        const isKey = i === 0 || i === n - 1 || (dt && dt.getUTCDate() === 25);
        if (!isKey) return;
        xlabels += `<text x="${xf(i).toFixed(1)}" y="${H - 8}" fill="#fff" font-size="9" text-anchor="middle">${d.label}</text>`;
      });
    }
  } else {
    const step = Math.max(1, Math.ceil(n / 7));
    data.forEach((d, i) => {
      if (i % step !== 0 && i !== n - 1) return;
      xlabels += `<text x="${xf(i).toFixed(1)}" y="${H - 8}" fill="#fff" font-size="9" text-anchor="middle">${d.label}</text>`;
    });
  }
  // WHO 参考曲线渲染：p3~p75 半透明填充带（最底层）+ 3条虚线 + 右端标注
  let whoBand = '', whoPaths = '', whoDots = '';
  if (whoPts && whoPts.length > 1) {
    const xfT = ts => PL + (iw * (ts - tMin)) / (tMax - tMin);
    // 填充带：p3 正序 + p75 逆序闭合
    const bandA = whoPts.map(p => `${xfT(p.t).toFixed(1)} ${yf(p.row.p3).toFixed(1)}`);
    const bandB = [...whoPts].reverse().map(p => `${xfT(p.t).toFixed(1)} ${yf(p.row.p75).toFixed(1)}`);
    whoBand = `<path class="whoband" d="M${bandA.join(' L')} L${bandB.join(' L')} Z" fill="rgba(255,255,255,0.04)" stroke="none"/>`;
    // 3条参考虚线：p3 柔红 / p50 中性灰 / p75 琥珀；右端标注百分比（p50 标注放线下方避免与 p75 重叠）
    const lineDefs = [
      { key: 'p3', color: '#e87878', label: '3%', dy: -3 },
      { key: 'p50', color: '#8a90a6', label: '50%', dy: 10 },
      { key: 'p75', color: '#d4a03a', label: '75%', dy: -3 }
    ];
    lineDefs.forEach(def => {
      const pts = whoPts.map(p => `${xfT(p.t).toFixed(1)} ${yf(p.row[def.key]).toFixed(1)}`);
      whoPaths += `<path d="M${pts.join(' L')}" fill="none" stroke="${def.color}" stroke-width="1.2" stroke-dasharray="4,3" opacity="0.8"/>`;
      // v3.5.18：右端文字标注已移到标题行图例，SVG 内只保留 WHO 数据点+tooltip
      // v3.5.12 WHO 参考值数据点：关键点（首末日+每月25号）渲染可见小圆点+透明命中区，点击显示该日标准值标注
      whoPts.forEach(p => {
        const x = xfT(p.t).toFixed(1), y = yf(p.row[def.key]).toFixed(1);
        const dt = new Date(p.t);
        const labelText = `${dt.getUTCMonth() + 1}/${dt.getUTCDate()}`;
        const valText = `WHO ${def.label}: ${fmtV(p.row[def.key])}${unit}`;
        whoDots += `<circle cx="${x}" cy="${y}" r="2.5" fill="${def.color}" stroke="rgba(0,0,0,0.3)" stroke-width="1"/>` +
          `<circle class="chart-hit" cx="${x}" cy="${y}" r="9" fill="transparent" data-cx="${x}" data-cy="${y}" onclick="chartTip(this,'${tipId}','${labelText}','${valText}')"/>`;
      });
    });
  }
  // v3.5.71 干预时间点竖线（如「加乳糖酶」）：把趋势按时间点分隔，便于对比前后变化
  let markLines = '', markLabels = '';
  if (opts.markers && opts.markers.length && hasT) {
    const escXml = s => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    opts.markers.forEach(mk => {
      const ts = mk.t;
      if (!(ts > tMin && ts < tMax)) return;   // 落在数据范围之外就不画（避免画在边缘误导）
      const x = PL + (iw * (ts - tMin)) / (tMax - tMin);
      const c = mk.color || '#f39c12';
      markLines += `<line x1="${x.toFixed(1)}" y1="${PT}" x2="${x.toFixed(1)}" y2="${(PT + ih).toFixed(1)}" stroke="${c}" stroke-width="1.6" stroke-dasharray="5,3" opacity="0.95"/>`;
      // 标签默认放竖线右侧；靠右时改放左侧，避免文字出界
      const toRight = x < PL + iw * 0.55;
      const tx = toRight ? x + 4 : x - 4;
      markLabels += `<text x="${tx.toFixed(1)}" y="${PT + 9}" fill="${c}" font-size="8.5" font-weight="bold" text-anchor="${toRight ? 'start' : 'end'}">${escXml(mk.text || mk.label || '')}</text>`;
    });
  }
  // v3.5.13 clipPath：绘图区裁剪（紧凑档下 WHO 参考线超出 Y 轴范围的部分不溢出图表）
  // v3.5.27/v3.5.31：dots(用户数据点)和whoDots(WHO数据点)移到clipPath外，避免最右侧被裁剪
  const clipId = 'cclip' + (++_chartTipSeq);
  return head2 + `<svg class="chart-svg" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">` +
    `<defs><clipPath id="${clipId}"><rect x="${PL}" y="${PT}" width="${iw}" height="${ih}"/></clipPath></defs>` +
    grid + ylabels + xlabels +
    `<g clip-path="url(#${clipId})">` + whoBand + whoPaths + markLines +
    `<path class="dataline" d="${path.trim()}" fill="none" stroke="${color}" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/></g>` +
    markLabels + dots + whoDots + tip + `</svg></div>`;
}
// 点击数据点显示/隐藏横纵坐标浮层（同一点再点隐藏）
function chartTip(hitEl, tipId, label, valueText) {
  const svg = hitEl.ownerSVGElement;
  const g = svg.querySelector('#' + tipId);
  if (!g) return;
  const content = label + '：' + valueText;
  const text = g.querySelector('text');
  const rect = g.querySelector('rect');
  if (g.style.display !== 'none' && text.textContent === content) { g.style.display = 'none'; return; } // 再点同一点隐藏
  // 同一张图里同时只保留一个标注（点新的自动关掉旧的），与其它图表行为一致
  svg.querySelectorAll('g[id^="ctip"], g[id^="mtip"]').forEach(o => { if (o !== g) o.style.display = 'none'; });
  text.textContent = content;
  const wChar = [...content].reduce((s, c) => s + (/[\u4e00-\u9fff\uff1a：]/.test(c) ? 11 : 7), 0);
  const w = wChar + 14;
  rect.setAttribute('width', w);
  const cx = parseFloat(hitEl.getAttribute('data-cx')), cy = parseFloat(hitEl.getAttribute('data-cy'));
  const W = parseFloat(svg.viewBox.baseVal.width);
  const x = Math.max(2, Math.min(cx - w / 2, W - w - 2));
  // tip 高度 20：若上方空间足够则显示在数据点上方，否则显示在下方
  const y = cy - 36 >= 8 ? cy - 34 : Math.min(cy + 12, 168 - 24);
  g.setAttribute('transform', `translate(${x.toFixed(1)},${y.toFixed(1)})`);
  g.style.display = '';
}
// 点击图表/弹窗其他区域（非柱形/数据点）自动取消所有标注
// 注意：modal-box 有 onclick=event.stopPropagation() 拦截冒泡，必须用 capture 阶段监听才能收到弹窗内点击
let _chartTipDismissBound = false;
function bindChartTipDismiss() {
  if (_chartTipDismissBound) return; _chartTipDismissBound = true;
  const modal = document.getElementById('analysisModal');
  if (!modal) return;
  modal.addEventListener('click', e => {
    const t = e.target;
    if (t.classList && (t.classList.contains('bar-hit') || t.classList.contains('chart-hit'))) return;
    // mtip = 奶量趋势图（双轴各自一个 tip），ctip = 其余图表
    document.querySelectorAll('#analysisContent g[id^="ctip"], #analysisContent g[id^="mtip"]').forEach(g => { g.style.display = 'none'; });
  }, true);
}
// 柱状图（内联SVG，无外部依赖；点击柱形显示横纵坐标）
function makeBarChart(data, opts) {
  const title = opts.title, unit = opts.unit || '', color = opts.color || '#74b9ff';
  const valid = data.filter(d => d.value != null);
  const head = `<div class="chart-card"><div class="chart-title">${title}</div>`;
  if (valid.length === 0) return head + `<div class="chart-empty">暂无数据</div></div>`;
  const W = 330, H = 168, PL = 40, PR = 12, PT = 22, PB = 24;
  const minV = 0;
  const dataMax = Math.max(...valid.map(d => d.value));
  // 月龄标准范围线（opts.stdLines: [{values:[与data等长]}]）取值纳入纵轴范围
  const stdVals = (opts.stdLines || []).flatMap(l => l.values.filter(v => v != null));
  const stdMax = stdVals.length ? Math.max(...stdVals) : 0;
  const rangeMax = Math.max(dataMax, stdMax);
  // 纵坐标轴：自动计算 0 到"最大值向上取整"的 step 倍数
  let ticks;
  if (opts.fixedTicks) {
    ticks = opts.fixedTicks;
    var maxV = ticks[ticks.length - 1];
  } else {
    const step = opts.tickStep || 1;
    // maxV = 向上取整到 step 的整数倍；至少留 step 余量
    var maxV = Math.ceil(rangeMax / step) * step;
    if (maxV <= rangeMax) maxV += step; // 确保柱子顶部不贴天花板
    if (maxV <= 0) maxV = step;
    // 在 0 和 maxV 之间按 step 生成所有刻度
    ticks = [];
    for (let v = 0; v <= maxV + 0.0001; v += step) ticks.push(Math.round(v * 100) / 100);
  }
  const iw = W - PL - PR, ih = H - PT - PB;
  const n = data.length;
  const slotW = iw / n;
  const barW = Math.min(20, Math.max(4, slotW * 0.6));
  const yf = v => PT + ih - ((v - minV) / (maxV - minV)) * ih;
  const fmtV = opts.fmt ? opts.fmt : (v => v);
  const tipId = 'ctip' + (++_chartTipSeq);
  let bars = '';
  data.forEach((d, i) => {
    const cxBar = PL + slotW * i + slotW / 2;
    if (d.value == null) return;
    const barTop = yf(d.value);
    const barBottom = yf(0);
    const h = barBottom - barTop; // 柱子高度（正值：底部y - 顶部y）
    const valRaw = opts.tipText ? opts.tipText(d) : (fmtV(d.value) + unit);
    const valText = String(valRaw).replace(/'/g, "\\'").replace(/"/g, '&quot;');
    const labelText = d.label.replace(/'/g, "\\'").replace(/"/g, '&quot;');
    bars += `<rect class="bar-rect" x="${(cxBar - barW / 2).toFixed(1)}" y="${barTop.toFixed(1)}" width="${barW.toFixed(1)}" height="${Math.max(1, h).toFixed(1)}" rx="2" fill="${color}"/>` +
      `<rect class="bar-hit" x="${(cxBar - slotW / 2).toFixed(1)}" y="${PT.toFixed(1)}" width="${slotW.toFixed(1)}" height="${ih.toFixed(1)}" fill="transparent" data-cx="${cxBar.toFixed(1)}" data-cy="${barTop.toFixed(1)}" onclick="chartTip(this,'${tipId}','${labelText}','${valText}')"/>`;
  });
  // 点击提示浮层：深色半透明背景 + 白色文字（tiptext 类：白天主题下保持绿底白字）
  const tip = `<g id="${tipId}" style="display:none" pointer-events="none"><rect rx="4" ry="4" height="20" fill="#2ecc71" stroke="rgba(255,255,255,0.45)" stroke-width="0.5"/><text class="tiptext" font-size="11" font-weight="bold" fill="#ffffff" x="6" y="14">?</text></g>`;
  // 网格线 + y轴刻度（按 ticks；gridln 类：白天主题下网格线变浅蓝）
  let grid = '', ylabels = '';
  ticks.forEach(v => {
    const gy = yf(v).toFixed(1);
    grid += `<line class="gridln" x1="${PL}" y1="${gy}" x2="${W - PR}" y2="${gy}" stroke="rgba(255,255,255,0.08)" stroke-width="1"/>`;
    ylabels += `<text x="${PL - 5}" y="${(parseFloat(gy) + 4).toFixed(1)}" fill="#fff" font-size="9" text-anchor="end">${fmtV(Math.round(v * 10) / 10)}</text>`;
  });
  if (unit) ylabels += `<text x="${PL - 5}" y="13" fill="#fff" font-size="8.5" font-weight="bold" text-anchor="end">${unit}</text>`;
  // x轴标签
  const step = Math.max(1, Math.ceil(n / 7));
  let xlabels = '';
  data.forEach((d, i) => {
    const cxBar = PL + slotW * i + slotW / 2;
    if (i % step !== 0 && i !== n - 1) return;
    xlabels += `<text x="${cxBar.toFixed(1)}" y="${H - 8}" fill="#fff" font-size="9" text-anchor="middle">${d.label}</text>`;
  });
  // 月龄标准范围线：绿色虚线（每天按其月龄取标准值；跨月龄切换日（25号）标准值变化时呈阶梯状垂直跳变）
  let stdSvg = '';
  (opts.stdLines || []).forEach(line => {
    const pts = [];
    line.values.forEach((v, i) => {
      if (v == null) return;
      pts.push({ x: PL + slotW * i + slotW / 2, v });
    });
    if (!pts.length) return;
    let p = `M${pts[0].x.toFixed(1)} ${yf(pts[0].v).toFixed(1)} `;
    for (let k = 1; k < pts.length; k++) {
      const prev = pts[k - 1], cur = pts[k];
      if (prev.v === cur.v) {
        p += `L${cur.x.toFixed(1)} ${yf(cur.v).toFixed(1)} `;
      } else {
        // 阶梯跳变：水平延伸至两柱中间 → 垂直跳到新值 → 水平到下一点
        const mid = ((prev.x + cur.x) / 2).toFixed(1);
        p += `L${mid} ${yf(prev.v).toFixed(1)} L${mid} ${yf(cur.v).toFixed(1)} L${cur.x.toFixed(1)} ${yf(cur.v).toFixed(1)} `;
      }
    }
    stdSvg += `<path class="stdline" d="${p.trim()}" fill="none" stroke="#5eead4" stroke-width="1.5" stroke-dasharray="5,3" opacity="0.9"/>`;
  });
  return head + `<svg class="chart-svg" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">` +
    grid + ylabels + xlabels + bars + stdSvg + tip + `</svg></div>`;
}
// ==================== 乳糖酶：历史补充 + 每日取值 ====================
// v3.5.87 历史乳糖酶补充规则（按日期区间给定每日乳糖酶滴数）
function getHistoricalLactase(ds) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(ds || '')) return null;
  if (ds <= '2026-09-07') return 0;                                   // 9月7日及之前均为 0
  if (ds >= '2026-09-08' && ds <= '2026-09-14') return 8;             // 9月8日 ~ 9月14日 8 滴
  if (ds >= '2026-09-15' && ds <= '2026-09-27') return 7;             // 9月15日 ~ 9月27日 7 滴
  if (ds >= '2026-09-28' && ds <= '2026-10-03') return 6;             // 9月28日 ~ 10月3日 6 滴
  if (ds === '2026-10-04') return 7;                                  // 10月4日 7 滴
  return null;                                                        // 10月4日之后无历史补充，依赖实际记录
}
// 某日乳糖酶量（滴）：乳糖酶按「每天一次给药」记录，故取当天喝奶记录里录入的乳糖酶之最小值（只算一次），无当日记录则回退到历史补充规则
function getLactaseByDate(ds) {
  const recs = getRecordsByDate(ds);   // v3.5.79 统一过滤脏记录
  let min = Infinity, has = false;
  (recs || []).forEach(r => { if (r && r.type === 'milk' && r.lactase != null) { const v = Number(r.lactase); if (!isNaN(v)) { min = Math.min(min, v); has = true; } } });
  if (has) return min;
  return getHistoricalLactase(ds);
}
// 某日记录的体重（kg）：bodyHistory 里该日期有值才返回，否则 null（曲线在该日断开）
function weightRecordedOn(ds) {
  const rec = getBodyHistory().find(x => x.d === ds);
  return (rec && rec.w != null) ? rec.w : null;
}
// v3.5.95 体重变化图的横轴日期序列
//   背景：该图原先完全跟随「大便与喝奶时间差」的日期序列取点，导致「当天没有大便」的日子
//         即使录了体重（例如 9/27 量得 6.7kg）也不会出现在图上。
//   规则：以大便间隔序列为基准（保持与上图同横轴、便于上下对照），再把落在该时间范围内、
//         录有体重的日期并进来。范围上界放宽到「昨日」（与图标题"截止昨日"口径一致），
//         这样“最后一次大便之后才量的体重”也不会丢点；完全没有大便记录时退化为
//         「全部体重点」，避免整图空白。
function buildWeightDualAxis(base) {
  const list = Array.isArray(base) ? base : [];
  const mk = ds => { const p = String(ds).split('-'); return { ds: ds, label: `${parseInt(p[1], 10)}/${parseInt(p[2], 10)}`, t: Date.parse(ds) }; };
  const map = new Map();
  list.forEach(p => map.set(p.t, { ds: p.ds, label: p.label, t: p.t }));
  const ts = list.map(p => p.t).filter(t => !isNaN(t));
  const lo = ts.length ? Math.min(...ts) : null;
  let hi = ts.length ? Math.max(...ts) : null;
  if (hi != null) {                                        // 右界至少到昨日（与图标题口径一致）
    const todayTs = Date.parse(getTodayDateStr());
    if (!isNaN(todayTs)) hi = Math.max(hi, todayTs - 86400000);
  }
  getBodyHistory().forEach(x => {
    if (!x || !x.d || x.w == null) return;                 // 只取真正录了体重的日期
    const t = Date.parse(x.d);
    if (isNaN(t)) return;
    if (lo != null && (t < lo || t > hi)) return;          // 限定在图示时间范围内，不改变横轴跨度
    if (!map.has(t)) { const p = mk(x.d); if (!isNaN(p.t)) map.set(p.t, p); }
  });
  return Array.from(map.values()).sort((a, b) => a.t - b.t);
}
// v3.5.95 主题蓝：深色模式浅蓝 #7da8e6（深底可读），浅色模式深蓝 #0984e3（白底可读）。
//   图线（.dataline/.chart-dot，浅色模式由 CSS 覆盖为 #0984e3）与图例圆点必须同源，
//   否则浅色模式下图例蓝(#7da8e6)与图线蓝(#0984e3)不一致。
function chartBlue() { return document.body.classList.contains('theme-day') ? '#0984e3' : '#7da8e6'; }
// 双纵轴折线图：左轴=左侧指标（蓝实线带点），右轴=乳糖酶量滴（橘色虚线，固定 0~8 step2）
// 用于「体重变化」与「大便与喝奶时间差变化」两张图（两条线共用同一横轴日期域，便于上下对照）
// leftData / rightData：与 makeLineChart 同构的 { ds, label, value, t } 数组，value 为 null 时该线在该点断开
function makeLactaseDualChart(leftData, rightData, opts) {
  const title = opts.title;
  const leftUnit = opts.leftUnit || '', rightUnit = opts.rightUnit || '滴';
  const leftColor = opts.leftColor || chartBlue();
  // v3.5.93 左侧轴（刻度+文字）改为主题色：深色模式白色、浅色模式黑色；左折线仍为蓝色 leftColor
  // 与右侧轴同理（rightColor 为轴文字色、rightLineColor 为折线色）
  const leftAxisColor = document.body.classList.contains('theme-day') ? '#111111' : '#ffffff';
  // v3.5.91 右侧轴（刻度+文字）改为主题色：深色模式白色、浅色模式黑色
  // 与 applyTheme 的 body.theme-day 判定保持一致（图表在弹窗打开时渲染，取当前主题）
  const rightColor = document.body.classList.contains('theme-day') ? '#111111' : '#ffffff';
  // v3.5.92 右侧折线单独用橙色（轴文字仍为主题色）
  const rightLineColor = opts.rightLineColor || '#ff9f43';
  const leftFmt = opts.leftFmt || (v => v);
  const rightFmt = opts.rightFmt || (v => v);
  const leftLabel = opts.leftLabel || '左轴';
  const rightLabel = opts.rightLabel || '乳糖酶';
  const legend = `<span style="float:right;font-size:10px;color:#b2bec3;margin-right:4px;">` +
    `<span style="display:inline-block;width:7px;height:7px;border-radius:50%;background:${leftColor};margin-right:2px;vertical-align:middle;"></span>${leftLabel} ` +
    `<span style="display:inline-block;width:9px;height:3px;background:${rightLineColor};margin-right:2px;vertical-align:middle;margin-left:6px;"></span>${rightLabel}</span>`;
  const head = `<div class="chart-card"><div class="chart-title">${title}${legend}</div>`;
  const n = leftData.length;
  if (n === 0) return head + `<div class="chart-empty">暂无数据</div></div>`;
  const W = 360, H = 168, PL = 40, PR = 54, PT = 22, PB = 24;
  const iw = W - PL - PR, ih = H - PT - PB;
  // 横轴：数据点带时间戳时按日期间隔线性等分（与体重/身高图一致）
  const tArr = leftData.map(d => d.t).filter(t => t != null);
  const hasT = tArr.length === n && n > 1 && Math.max(...tArr) > Math.min(...tArr);
  const tMin = hasT ? Math.min(...tArr) : 0, tMax = hasT ? Math.max(...tArr) : 1;
  // —— 左轴刻度 ——
  const leftValid = leftData.filter(d => d.value != null).map(d => d.value);
  let lMin, lMax, lTicks;
  if (opts.leftMin !== undefined && opts.leftStep) {            // 固定下限+步长（如体重趋势：min 3 step 1）
    const base = leftValid.length ? Math.max(...leftValid) : (opts.leftMin || 0);
    lMin = opts.leftMin;
    lMax = Math.ceil(base / opts.leftStep) * opts.leftStep;
    if (lMax <= lMin) lMax = lMin + opts.leftStep;
    lTicks = []; for (let v = lMin; v <= lMax + 1e-6; v += opts.leftStep) lTicks.push(Math.round(v * 10) / 10);
  } else if (opts.leftScaleFactor) {                            // v3.5.88 体重变化：刻度 = 本段最小体重*0.8 ~ 最大体重*1.2（5 等分）
    if (leftValid.length === 0) { lMin = 0; lMax = 1; lTicks = [0, 1]; }
    else {
      const dMin = Math.min(...leftValid), dMax = Math.max(...leftValid);
      lMin = dMin * opts.leftScaleFactor.min;
      lMax = dMax * opts.leftScaleFactor.max;
      if (lMax <= lMin) lMax = lMin + 1;
      lTicks = [];
      const N = 4;
      for (let i = 0; i <= N; i++) lTicks.push(Math.round((lMin + (lMax - lMin) * i / N) * 10) / 10);
    }
  } else {                                                      // 自适应（如大便间隔分钟）
    if (leftValid.length === 0) { lMin = 0; lMax = 1; }
    else {
      const dMin = Math.min(...leftValid), dMax = Math.max(...leftValid);
      if (dMax === dMin) { const p = Math.abs(dMax) * 0.1 || 1; lMin = Math.max(0, dMin - p); lMax = dMax + p; }
      else { const pad = (dMax - dMin) * 0.15; lMin = Math.max(0, dMin - pad); lMax = dMax + pad; }
    }
    lTicks = [lMin, (lMin + lMax) / 2, lMax];
  }
  // —— 右轴刻度（固定 0~8 step2）——
  const rMin = 0, rMax = 8, rStep = 2;
  const rTicks = [0, 2, 4, 6, 8];
  const xf = i => {
    if (hasT) return PL + (iw * (leftData[i].t - tMin)) / (tMax - tMin);
    return PL + (n <= 1 ? iw / 2 : (iw * i) / (n - 1));
  };
  const yL = v => PT + ih - ((v - lMin) / (lMax - lMin)) * ih;
  const yR = v => PT + ih - ((v - rMin) / (rMax - rMin)) * ih;
  const esc = s => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/'/g, "\\'").replace(/"/g, '&quot;');
  const mkMtip = id => `<g id="${id}" style="display:none" pointer-events="none"><rect rx="4" ry="4" height="20" fill="#2ecc71" stroke="rgba(255,255,255,0.45)" stroke-width="0.5"/><text class="tiptext" font-size="11" font-weight="bold" fill="#ffffff" x="6" y="14">?</text></g>`;
  const leftTipId = 'mtip' + (++_chartTipSeq);
  const rightTipId = 'mtip' + (++_chartTipSeq);
  // 网格线 + 左轴刻度（轴文字为leftAxisColor 主题色；对应折线为 leftColor 蓝）
  let grid = '', ylabels = '';
  lTicks.forEach(v => {
    const gy = yL(v).toFixed(1);
    grid += `<line class="gridln" x1="${PL}" y1="${gy}" x2="${W - PR}" y2="${gy}" stroke="rgba(255,255,255,0.08)" stroke-width="1"/>`;
    ylabels += `<text x="${PL - 5}" y="${(parseFloat(gy) + 4).toFixed(1)}" fill="${leftAxisColor}" font-size="9" text-anchor="end">${leftFmt(Math.round(v * 10) / 10)}</text>`;
  });
  // 右轴刻度（轴文字为rightColor 主题色；对应折线为 rightLineColor 橙）
  rTicks.forEach(v => {
    const gy = yR(v).toFixed(1);
    ylabels += `<text x="${W - PR + 5}" y="${(parseFloat(gy) + 4).toFixed(1)}" fill="${rightColor}" font-size="9" text-anchor="start">${rightFmt(v)}</text>`;
  });
  ylabels += `<text x="${PL - 5}" y="13" fill="${leftAxisColor}" font-size="8.5" font-weight="bold" text-anchor="end">${leftUnit}</text>`;
  ylabels += `<text x="${W - PR + 5}" y="13" fill="${rightColor}" font-size="8.5" font-weight="bold" text-anchor="start">${rightUnit}</text>`;
  // x 轴标签（keyDates 模式：首末 + 每月25号，按时间轴位置渲染，不依赖数据点）
  let xlabels = '';
  if (opts.xTickMode === 'keyDates' && hasT) {
    const keyMap = new Map();
    const fmtTs = ts => { const dt = new Date(ts); return `${dt.getUTCMonth() + 1}/${dt.getUTCDate()}`; };
    keyMap.set(tMin, fmtTs(tMin)); keyMap.set(tMax, fmtTs(tMax));
    let cur = new Date(tMin);
    cur = new Date(Date.UTC(cur.getUTCFullYear(), cur.getUTCMonth(), 25));
    if (cur.getTime() <= tMin) cur = new Date(Date.UTC(cur.getUTCFullYear(), cur.getUTCMonth() + 1, 25));
    while (cur.getTime() < tMax) { keyMap.set(cur.getTime(), fmtTs(cur.getTime())); cur = new Date(Date.UTC(cur.getUTCFullYear(), cur.getUTCMonth() + 1, 25)); }
    Array.from(keyMap.keys()).sort((a, b) => a - b).forEach(ts => {
      const x = (PL + (iw * (ts - tMin)) / (tMax - tMin)).toFixed(1);
      xlabels += `<text x="${x}" y="${H - 8}" fill="#fff" font-size="9" text-anchor="middle">${keyMap.get(ts)}</text>`;
    });
  } else {
    const step = Math.max(1, Math.ceil(n / 7));
    leftData.forEach((d, i) => { if (i % step !== 0 && i !== n - 1) return; xlabels += `<text x="${xf(i).toFixed(1)}" y="${H - 8}" fill="#fff" font-size="9" text-anchor="middle">${d.label}</text>`; });
  }
  // 左线（蓝实线带点）：默认断开于 null；opts.leftConnectNulls=true 时跨空档连线（如体重变化，仅有测体重的几天有值）
  const clipId = 'dclip' + (++_chartTipSeq);
  let lPath = '', lDots = '', started = false;
  leftData.forEach((d, i) => {
    if (d.value == null) { if (!opts.leftConnectNulls) started = false; return; }
    const px = xf(i).toFixed(2), py = yL(d.value).toFixed(2);
    lPath += (started ? 'L' : 'M') + px + ' ' + py + ' '; started = true;
    const tx = opts.leftTipText ? opts.leftTipText(d) : (leftFmt(d.value) + leftUnit);
    const lb = esc(d.label);
    lDots += `<circle class="chart-dot" cx="${px}" cy="${py}" r="3" fill="${leftColor}" stroke="rgba(0,0,0,0.3)" stroke-width="1"/>` +
      `<circle class="chart-hit" cx="${px}" cy="${py}" r="11" fill="transparent" data-cx="${px}" data-cy="${py}" onclick="chartTip(this,'${leftTipId}','${lb}','${esc(tx)}')"/>`;
  });
  // 右线（橙色虚线 rightLineColor；轴刻度/文字为主题色 rightColor；不带可见数据点；断开于 null，裁剪到绘图区）
  // v3.5.88 乳糖酶线仅保留透明点击热区（便于查看数值），不再绘制圆点
  let rPath = '', rDots = '', rStarted = false;
  rightData.forEach((d, i) => {
    if (d.value == null) { rStarted = false; return; }
    const px = xf(i).toFixed(2), py = yR(d.value).toFixed(2);
    rPath += (rStarted ? 'L' : 'M') + px + ' ' + py + ' '; rStarted = true;
    const tx = opts.rightTipText ? opts.rightTipText(d) : (rightFmt(d.value) + rightUnit);
    const lb = esc(d.label);
    rDots += `<circle class="chart-hit" cx="${px}" cy="${py}" r="11" fill="transparent" data-cx="${px}" data-cy="${py}" onclick="chartTip(this,'${rightTipId}','${lb}','${esc(tx)}')"/>`;
  });
  return head + `<svg class="chart-svg" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">` +
    `<defs><clipPath id="${clipId}"><rect x="${PL}" y="${PT}" width="${iw}" height="${ih}"/></clipPath></defs>` +
    grid + ylabels + xlabels +
    `<g clip-path="url(#${clipId})">` +
      `<path class="dataline" d="${lPath.trim()}" fill="none" stroke="${leftColor}" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/>` +
      `<path d="${rPath.trim()}" fill="none" stroke="${rightLineColor}" stroke-width="2" stroke-dasharray="5,3" stroke-linejoin="round" stroke-linecap="round"/>` +
    `</g>` + lDots + rDots + mkMtip(leftTipId) + mkMtip(rightTipId) + `</svg></div>`;
}
// v3.5.78 奶量及次数合并图：双轴柱状图
//   左轴 = 奶量(ml)，蓝色柱(#7da8e6)；右轴 = 次数(次)，绿色柱(#2ecc71)
//   仅保留奶量标准范围虚线（teal），去掉喝奶次数标准线；点击柱区显示「奶量Xml · 次数Y次」
function makeMilkCountComboChart(milkData, countData, milkStdRows) {
  const title = '🍼 奶量及次数（水+奶，近15天）';
  const legend = `<span style="float:right;font-size:10px;color:#b2bec3;margin-right:4px;">` +
    `<span style="display:inline-block;width:7px;height:7px;border-radius:2px;background:${chartBlue()};margin-right:2px;vertical-align:middle;"></span>奶量 ` +
    `<span style="display:inline-block;width:7px;height:7px;border-radius:2px;background:#ff9f43;margin-right:2px;vertical-align:middle;"></span>次数</span>`;
  const head = `<div class="chart-card"><div class="chart-title">${title}${legend}</div>`;
  const hasMilk = milkData.some(d => d.value != null);
  const hasCount = countData.some(d => d.value != null);
  if (!hasMilk && !hasCount) return head + `<div class="chart-empty">暂无数据</div></div>`;
  // v3.5.82 柱形间隔缩短一半：每天固定占宽 18（v3.5.81 为 36）
  const H = 168, PL = 42, PR = 48, PT = 22, PB = 24;
  const n = milkData.length;
  const slotW = 18;
  const iw = n * slotW;
  const W = PL + iw + PR;
  const ih = H - PT - PB;
  const barW = Math.min(14, Math.max(5, slotW * 0.22));
  const barGap = 4;   // 同一天两根柱的间距（原约 2，调大1倍）
  // 左轴：奶量(ml)，tickStep=100，并纳入奶量标准范围线取值
  const milkVals = milkData.map(d => d.value).filter(v => v != null);
  const milkStdVals = (milkStdRows || []).map(r => [r.min, r.max]).flat().filter(v => v != null);
  const milkRangeMax = Math.max(0, ...milkVals, ...milkStdVals);
  let milkMax = Math.ceil(milkRangeMax / 100) * 100; if (milkMax <= milkRangeMax) milkMax += 100; if (milkMax <= 0) milkMax = 100;
  const yMilk = v => PT + ih - (ih * v) / milkMax;
  // 右轴：次数(次)。最大值对齐到 12 的倍数，使 0/25/50/75/100% 五档刻度为 0/3/6/9/12（间隔=3）且与左侧网格线共用
  const countVals = countData.map(d => d.value).filter(v => v != null);
  const countRangeMax = Math.max(0, ...countVals);
  let countMax = Math.ceil(countRangeMax / 12) * 12; if (countMax < countRangeMax) countMax += 12; if (countMax <= 0) countMax = 12;
  const yCount = v => PT + ih - (ih * v) / countMax;
  // 网格线 + 双轴刻度标签（按 0/25/50/75/100% 等分，与奶量趋势双轴一致）
  const pcts = [0, 0.25, 0.5, 0.75, 1];
  let grid = '', ylabels = '';
  pcts.forEach(p => {
    const gy = (PT + ih - ih * p).toFixed(1);
    grid += `<line class="gridln" x1="${PL}" y1="${gy}" x2="${W - PR}" y2="${gy}" stroke="rgba(255,255,255,0.08)" stroke-width="1"/>`;
    ylabels += `<text x="${PL - 5}" y="${(parseFloat(gy) + 4).toFixed(1)}" fill="#fff" font-size="9" text-anchor="end">${Math.round(milkMax * p)}</text>`;
    ylabels += `<text x="${W - PR + 5}" y="${(parseFloat(gy) + 4).toFixed(1)}" fill="#fff" font-size="9" text-anchor="start">${Math.round(countMax * p)}</text>`;
  });
  ylabels += `<text x="${PL - 5}" y="13" fill="#fff" font-size="8.5" font-weight="bold" text-anchor="end">奶量ml</text>`;
  ylabels += `<text x="${W - PR + 5}" y="13" fill="#fff" font-size="8.5" font-weight="bold" text-anchor="start">次数</text>`;
  // x轴标签（v3.5.84 与其他图口径一致：抽稀，最多约 7 个，首末必显示）
  const step = Math.max(1, Math.ceil(n / 7));
  let xlabels = '';
  milkData.forEach((d, i) => {
    if (i % step !== 0 && i !== n - 1) return;
    const cx = PL + slotW * i + slotW / 2;
    xlabels += `<text x="${cx.toFixed(1)}" y="${H - 8}" fill="#fff" font-size="9" text-anchor="middle">${d.label}</text>`;
  });
  // 柱形：蓝(奶量,左轴,同"奶量趋势"总奶量线色 #7da8e6) + 橙(次数,右轴,同"单次平均"线色 #ff9f43) 并排
  const tipId = 'ctip' + (++_chartTipSeq);
  let bars = '';
  milkData.forEach((d, i) => {
    const cx = PL + slotW * i + slotW / 2;
    const blueX = cx - barGap / 2 - barW, greenX = cx + barGap / 2;
    const mv = milkData[i].value, cv = countData[i].value;
    if (mv != null) {
      const top = yMilk(mv), bottom = yMilk(0);
      bars += `<rect class="bar-rect" x="${blueX.toFixed(1)}" y="${top.toFixed(1)}" width="${barW.toFixed(1)}" height="${Math.max(1, bottom - top).toFixed(1)}" rx="2" fill="#7da8e6"/>`;
    }
    if (cv != null) {
      const top = yCount(cv), bottom = yCount(0);
      bars += `<rect x="${greenX.toFixed(1)}" y="${top.toFixed(1)}" width="${barW.toFixed(1)}" height="${Math.max(1, bottom - top).toFixed(1)}" rx="2" fill="#ff9f43"/>`;
    }
    const mLbl = mv != null ? (Math.round(mv) + 'ml') : '—';
    const cLbl = cv != null ? (cv + '次') : '—';
    const valText = `奶量 ${mLbl} · 次数 ${cLbl}`.replace(/'/g, "\\'").replace(/"/g, '&quot;');
    const labelText = d.label.replace(/'/g, "\\'").replace(/"/g, '&quot;');
    const hitY = Math.min(mv != null ? yMilk(mv) : (H - PB), cv != null ? yCount(cv) : (H - PB));
    bars += `<rect class="bar-hit" x="${(cx - slotW / 2).toFixed(1)}" y="${PT.toFixed(1)}" width="${slotW.toFixed(1)}" height="${ih.toFixed(1)}" fill="transparent" data-cx="${cx.toFixed(1)}" data-cy="${hitY.toFixed(1)}" onclick="chartTip(this,'${tipId}','${labelText}','${valText}')"/>`;
  });
  // 奶量标准范围虚线（teal），仅奶量；含 min + max 两条阶梯线
  const buildStdPath = values => {
    const pts = [];
    milkData.forEach((d, i) => { if (d.value == null || values[i] == null) return; pts.push({ x: PL + slotW * i + slotW / 2, v: values[i] }); });
    if (pts.length < 2) return '';
    let p = `M${pts[0].x.toFixed(1)} ${yMilk(pts[0].v).toFixed(1)} `;
    for (let k = 1; k < pts.length; k++) {
      const prev = pts[k - 1], cur = pts[k];
      if (prev.v === cur.v) { p += `L${cur.x.toFixed(1)} ${yMilk(cur.v).toFixed(1)} `; }
      else { const mid = ((prev.x + cur.x) / 2).toFixed(1); p += `L${mid} ${yMilk(prev.v).toFixed(1)} L${mid} ${yMilk(cur.v).toFixed(1)} L${cur.x.toFixed(1)} ${yMilk(cur.v).toFixed(1)} `; }
    }
    return p.trim();
  };
  let stdSvg = '';
  [milkStdRows.map(r => r.min), milkStdRows.map(r => r.max)].forEach(vals => {
    const p = buildStdPath(vals);
    if (p) stdSvg += `<path class="stdline" d="${p}" fill="none" stroke="#5eead4" stroke-width="1.5" stroke-dasharray="5,3" opacity="0.9"/>`;
  });
  const tip = `<g id="${tipId}" style="display:none" pointer-events="none"><rect rx="4" ry="4" height="20" fill="#2ecc71" stroke="rgba(255,255,255,0.45)" stroke-width="0.5"/><text class="tiptext" font-size="11" font-weight="bold" fill="#ffffff" x="6" y="14">?</text></g>`;
  return head + `<div class="chart-scroll"><svg class="chart-svg" viewBox="0 0 ${W} ${H}" width="${W}" style="width:${W}px;height:auto" xmlns="http://www.w3.org/2000/svg">` +
    grid + ylabels + xlabels + bars + stdSvg + tip + `</svg></div></div>`;
}
/* ==================== 成长里程碑时间轴（v3.5.56） ====================
 * 数据来源：全部历史记录里的 note 字段（今日成就），跨日期扫描。
 * 非结构化文本 → 展示层轻结构化：关键词自动归类到发展领域 + 自动识别"首次"。
 * 不改变用户输入习惯（仍是自由文本），匹配不上归入「成长点滴」，绝不丢条目。
 * ============================================================ */
/* 领域词典（v3.5.65 重构）
 * kw   = 强词：能体现"这条记录到底在说什么"的主题词（动作、物件、症状、事件）
 * weak = 弱词：情绪/氛围修饰语（开心、好玩、兴奋…），几乎出现在任何句子里，
 *        只作为"实在没有强词"时的兜底信号，权重仅 25%，避免句末情绪词盖过整句主题。
 */
const MILESTONE_DOMAINS = [
  { id:'gross',  name:'大运动',   icon:'🏃', color:'#ff9f43',
    kw:['健身架','手脚并用','翻身','抬头','趴','爬','站','走','独坐','坐稳','坐起来','坐得稳','蹬腿','踢腿','蹬','踢','扶站','翻滚','爬行','迈步','学步','跳','撑起','支撑','靠坐','拉坐','靠站','竖抱','俯卧','挥手','抬腿','侧翻','蹦','手舞足蹈','翻身练习','抬头练习','爬行垫'],
    weak:[] },
  { id:'fine',   name:'精细运动', icon:'✋', color:'#feca57',
    kw:['抓握','抓住','换手','捏取','对敲','撕纸','翻书','按键','拍手','拍打','摇铃','积木','吃手','塞嘴里','攥','抠','捏','拿','抓','握','撕','够','拨弄','伸手','手绢','握持','拨','摸'],
    weak:[] },
  { id:'lang',   name:'语言',     icon:'💬', color:'#48dbfb',
    kw:['咿咿呀呀','咿呀','学说话','发音','叫妈妈','叫爸爸','说话','咕咕','应答','模仿声','啊呜','尖叫','哼','学语','发声','对话','叫唤','儿歌','唱歌','元音'],
    weak:[] },
  { id:'cog',    name:'认知',     icon:'🧠', color:'#a29bfe',
    kw:['认生','认人','追视','追听','寻声','找东西','镜子','好奇','明白','理解','懂','寻找','记住','认得','注视','反应','模仿','探索','发现','盯着','玩具','会玩','因果关系'],
    weak:[] },
  { id:'social', name:'社交情感', icon:'😊', color:'#ff6b9d',
    kw:['微笑','笑出声','互动','回应','撒娇','依恋','黏人','认妈妈','打招呼','逗引','社交','不怕生','闹觉'],
    weak:['开心','高兴','好玩','兴奋','激动','表情','笑','乐','配合','乖','勇敢','暖和','喜欢'] },
  { id:'self',   name:'生活自理', icon:'💤', color:'#1dd1a1',
    kw:['自主入睡','自己睡着','自己睡','入睡','抱奶瓶','自己吃','自己拿','咀嚼','吞咽','辅食','断夜奶','睡整觉','接觉','含着','奶睡','拍睡','自主','抓勺','用勺','学饮杯','洗手','刷牙'],
    weak:[] },
  { id:'health', name:'健康',     icon:'🏥', color:'#ff7675',
    kw:['大便','便便','拉了','臭臭','便秘','腹泻','拉稀','医院','看病','就医','疫苗','打针','预防针','发烧','体温','感冒','咳嗽','打喷嚏','流鼻涕','吃药','用药','体检','黄疸','褪黄','晒黄疸','湿疹','热疹','痱子','皮疹','纽强','药膏','红屁屁','尿布疹','尿布','鼻涕','呕吐','吐奶','胀气','肠胀气','肚肚','乳糖酶','益生菌','厌奶'],
    weak:[] }
];
const MILESTONE_OTHER = { id:'other', name:'成长点滴', icon:'🌟', color:'#74b9ff', kw:[], weak:[] };
// 徽章行：三大关注类别（可合并多个领域）
const MILESTONE_BADGE_GROUPS = [
  { label: '大运动',   icon: '🏃', color: '#ff9f43', domains: ['gross'] },
  { label: '语言社交', icon: '💬', color: '#48dbfb', domains: ['lang', 'social'] },
  { label: '健康',     icon: '🏥', color: '#ff7675', domains: ['health'] }
];
// 简化描述（徽章用）：优先取前半句（主题位置）里命中的最长关键词，且至少 2 字
// —— 只取 1 字的关键词（如「笑」「闹」）会语义不明，故设下限；
//    强词命中优先，没有强词才看弱词；都没有则回退为截取原文。
const MS_SIMPLIFY_MIN = 2;
const MS_SIMPLIFY_MAX = 8;
// v3.5.97 否定词：关键词若紧接在否定词之后（如「不尖叫」「没发烧」「不会翻身」），是在描述"没有发生"，
//   不应作为该行为的达成里程碑（否则「半夜不尖叫、拉屎1天就恢复正常了」会被识别成「尖叫」）。
//   否定词后允许跟一个能愿/副词（会/能/要/再/太…），以覆盖「不会翻身」「还没学会站」等写法。
const MS_NEG_RE = /(?:不|没|未|别|无|非|莫|勿)(?:会|能|要|想|肯|敢|再|有|太|算|得|是|怎么)?$/;
// 关键词在文本中第一处「非否定」出现的位置；全部被否定则返回 -1
function _msIdx(text, kw) {
  let from = 0;
  while (true) {
    const i = text.indexOf(kw, from);
    if (i === -1) return -1;
    const pre = text.slice(Math.max(0, i - 4), i);   // 看关键词前最多 4 个字是否以否定结构结尾
    if (!MS_NEG_RE.test(pre)) return i;
    from = i + 1;
  }
}
function simplifyMilestone(text, domain) {
  const t = String(text || '');
  const len = t.length || 1;
  let best = '', bestKey = null;
  const scan = list => {
    for (const kw of (list || [])) {
      if (kw.length < MS_SIMPLIFY_MIN) continue;
      const idx = _msIdx(t, kw);
      if (idx === -1) continue;
      const key = [(idx / len) < 0.5 ? 0 : 1, -kw.length];   // 前半句优先，其次取长
      if (!bestKey || key[0] < bestKey[0] || (key[0] === bestKey[0] && key[1] < bestKey[1])) {
        best = kw; bestKey = key;
      }
    }
  };
  scan(domain && domain.kw);
  if (!best) scan(domain && domain.weak);
  if (best) return best;
  return t.length > MS_SIMPLIFY_MAX ? t.slice(0, MS_SIMPLIFY_MAX) + '…' : (t || '—');
}

// 弱词（情绪泛词）权重：只有强词时才让位，避免「…非常开心」这类句末情绪抢走归类
const MS_WEAK_FACTOR = 0.25;
// 关键词得分：长度² × 位置权重（前半句 ×2）。累加同领域的多个命中。
function _msDomainScore(text, list, factor) {
  const len = text.length || 1;
  let s = 0;
  for (const kw of (list || [])) {
    const idx = _msIdx(text, kw);                 // v3.5.97 被否定的关键词（如「不尖叫」）不计分
    if (idx === -1) continue;
    const posW = (idx / len) < 0.5 ? 2 : 1;      // 前半句通常是主题，权重翻倍
    s += kw.length * kw.length * posW * factor;
  }
  return s;
}
// 打分制归类：取总得分最高的领域；并列时靠前者优先（数组顺序即语义优先级）
// 旧实现是"命中即返回"，导致句末情绪词（开心）盖过整句主题（玩健身架）
function classifyMilestone(text) {
  const t = String(text || '');
  let best = null, bestScore = 0;
  for (const d of MILESTONE_DOMAINS) {
    const s = _msDomainScore(t, d.kw, 1) + _msDomainScore(t, d.weak || [], MS_WEAK_FACTOR);
    if (s > bestScore) { bestScore = s; best = d; }
  }
  return best || MILESTONE_OTHER;
}
// ============ v3.5.99 里程碑大模型智能归类（用户自带密钥，本地直连，失败/未配置回退规则） ============
// 服务商：DeepSeek / 通义千问 已验证浏览器可直连（CORS 放行）；OpenAI 浏览器直连被 CORS 拦截，需走「自定义」+ 代理
const LLM_PROVIDERS = {
  deepseek: { name: 'DeepSeek', base: 'https://api.deepseek.com/v1/chat/completions', model: 'deepseek-v4-flash' },
  qwen:     { name: '通义千问', base: 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions', model: 'qwen-plus' },
  custom:   { name: '自定义',   base: '', model: '' }
};
const AI_TAG_CFG_KEY = 'ai_tag_cfg';
// v3.5.102 家庭云端默认密钥（已解密，仅存运行时内存，绝不落本地明文/也不在任何 UI 明文显示）
// 与记录同为 AES-GCM/PBKDF2 端到端加密，用 family_code+family_salt 派生密钥；
// 存放在 family_config 的 config_key=_ai_deepseek_key，仅家人（知家庭码者）可解密。
let _cloudAITagKey = '';
let _cloudAITagKeyLoaded = false;
const AI_CLOUD_KEY_CFG = '_ai_deepseek_key';
async function loadCloudAITagKey() {
  _cloudAITagKey = '';
  if (!isSyncReady()) return; // 未配置同步则不尝试（也不置已加载标记，便于后续重试）
  try {
    const key = await getCryptoKey(); if (!key) return;
    const rows = await supabaseGet(`family_config?family_id=eq.${getFamilyId()}&config_key=eq.${AI_CLOUD_KEY_CFG}&select=encrypted_data,iv`);
    if (rows.length > 0 && rows[0].encrypted_data && rows[0].iv) {
      _cloudAITagKey = await decrypt(key, rows[0].encrypted_data, rows[0].iv);
      console.log('[AI] 已加载家庭云端默认密钥');
    } else {
      console.log('[AI] 家庭云端无默认密钥');
    }
  } catch (e) { console.warn('[AI] 云端默认密钥加载失败:', e); }
  finally { _cloudAITagKeyLoaded = true; }
}
// 读取 AI 归类配置；优先"本机覆盖密钥"，否则回落"家庭云端默认密钥"；都无则 null（回退规则分类）
function getAITagConfig() {
  try {
    const c = JSON.parse(localStorage.getItem(AI_TAG_CFG_KEY) || '{}');
    const localKey = (c && c.apiKey) ? c.apiKey : '';
    const apiKey = localKey || _cloudAITagKey; // v3.5.102 本机覆盖优先，否则用云端默认
    if (!apiKey) return null;
    const provider = c.provider || 'deepseek';
    const p = LLM_PROVIDERS[provider] || LLM_PROVIDERS.deepseek;
    const base = (provider === 'custom') ? (c.base || '') : p.base;
    const model = (c.model && c.model.trim()) ? c.model.trim() : p.model;
    if (!base || !model) return null;
    return { base, model, apiKey, provider };
  } catch { return null; }
}
function msDomainById(id) { return MILESTONE_DOMAINS.find(d => d.id === id) || MILESTONE_OTHER; }
// 统一的 OpenAI 兼容 chat/completions 调用；任何异常/非 200/解析失败都返回 null（由上层回退规则）
// v3.5.121 超时 9s→15s：JSON 归类在网络较慢时同样容易被误判失败（与 AI 问答无响应同源问题）
async function callChatCompletions(cfg, messages) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 15000);
  try {
    const res = await fetch(cfg.base, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + cfg.apiKey },
      body: JSON.stringify({ model: cfg.model, messages: messages, temperature: 0.2, response_format: { type: 'json_object' } }),
      signal: ctrl.signal
    });
    if (!res.ok) return null;
    const j = await res.json();
    const content = j && j.choices && j.choices[0] && j.choices[0].message && j.choices[0].message.content;
    if (!content) return null;
    return JSON.parse(content);
  } catch { return null; }
  finally { clearTimeout(timer); }
}
// 按 provider+model+文本 哈希缓存，避免不同模型结果互相覆盖
function msLLMCacheKey(text, cfg) {
  let h = 0; for (let i = 0; i < text.length; i++) h = (h * 31 + text.charCodeAt(i)) | 0;
  return 'msllm:' + cfg.provider + ':' + cfg.model + ':' + (h >>> 0);
}
// 单条文本调 LLM 归类：返回 {domainId, label} 或 null。命中缓存直接返回
async function classifyMilestoneLLM(text, cfg) {
  const cacheKey = msLLMCacheKey(text, cfg);
  try { const c = localStorage.getItem(cacheKey); if (c) return JSON.parse(c); } catch {}
  const domainList = MILESTONE_DOMAINS.map(d => d.name).concat([MILESTONE_OTHER.name]).join('、');
  const sys = '你是婴儿成长里程碑分类助手。用户会给你一段育儿记录文本，请判断它最贴合哪个成长领域，并提取一个不超过6个汉字的简短标签概括核心成就。\n'
    + '可选领域（必须严格从中选一个，输出其准确名称）：' + domainList + '。\n'
    + '只输出 JSON，格式：{"domain":"领域名称","label":"简短标签"}。'
    + '若文本主要是日常流水账（如"喝了150ml奶""睡了2小时"），选「成长点滴」并给一个中性标签。';
  const out = await callChatCompletions(cfg, [
    { role: 'system', content: sys },
    { role: 'user', content: String(text || '') }
  ]);
  if (!out || !out.domain) return null;
  const label = (out.label && String(out.label).trim()) ? String(out.label).trim().slice(0, 8) : null;
  const dom = MILESTONE_DOMAINS.find(d => d.name === out.domain) || MILESTONE_OTHER;   // v3.5.99 LLM 返回领域名称，按名称匹配
  const result = { domainId: dom.id, label: label };
  try { localStorage.setItem(cacheKey, JSON.stringify(result)); } catch {}
  return result;
}
// 规则先渲染，再异步用 LLM 回写分类/短标签；无配置或全失败则保持规则结果不动
async function enrichMilestonesWithLLM(items) {
  const cfg = getAITagConfig();
  if (!cfg || !items || !items.length) return;
  const unique = []; const seen = new Set();
  for (const it of items) { if (!seen.has(it.text)) { seen.add(it.text); unique.push(it); } }
  let changed = false;
  await Promise.allSettled(unique.map(async it => {
    const r = await classifyMilestoneLLM(it.text, cfg);
    if (!r) return;
    const dom = msDomainById(r.domainId);
    for (const x of items) { if (x.text !== it.text) continue; x.domain = dom; if (r.label) x.label = r.label; }
    changed = true;
  }));
  if (!changed) return;
  const badgesEl = document.getElementById('milestoneBadges');
  // v3.5.104 renderMilestoneBadges 返回的是自带 id 的整块，用 outerHTML 替换（原用 innerHTML 会造成同 id 嵌套 = 重复 ID）
  if (badgesEl) badgesEl.outerHTML = renderMilestoneBadges(items);
  const tlEl = document.getElementById('milestoneTimeline');
  if (tlEl) tlEl.innerHTML = renderMilestoneInner();
}

// ==================== v3.5.109 AI 育儿问答（入口=去上传的头像；底部抽屉：对话 + 知识库） ====================
const KB_CATS = ['奶粉喂养','辅食','睡眠','早教','穿衣','户外','医疗']; // 自动分类候选（不含「权威资料」，后者为投喂的权威参考，不参与关键词/大模型自动归类）
const KB_AUTH_CAT = '权威资料';   // v3.5.131 方案A：投喂权威育儿资料（崔玉涛等）的统一分类，仅人工标注/种子投喂
// v3.5.125 知识库分类图标（分类选择弹窗内展示）
const KB_CAT_ICON = { '奶粉喂养':'🍼','辅食':'🍚','睡眠':'😴','早教':'📚','穿衣':'👕','户外':'🌳','医疗':'💊','综合':'📌','权威资料':'🎓' };
const KB_FILTER_CATS = KB_CATS.concat(['综合', KB_AUTH_CAT]);   // v3.5.127 知识库筛选下拉的全部可选分类（含「权威资料」）
let kbSelectedCats = new Set(KB_FILTER_CATS);      // v3.5.127 多选（默认全选=显示全部）
let kbSearchQuery = '';                            // v3.5.127 知识库搜索关键字
const KB_KEY = 'ai_kb_v1';
const KB_CLOUD_KEY = '_ai_kb';
const AI_HIST_CLOUD_KEY = '_ai_hist';   // v3.5.137 已停用（历史对话不再上家庭云；常量保留仅为兼容旧版本残留数据）
const MEMO_CLOUD_KEY = '_memo';         // v3.5.115 备忘录同样加密同步家庭云（此前只存本机，清缓存后丢失）
const AI_CHAT_KEY = 'ai_chat_v1';
const AI_CHAT_CAP = 10;            // 单次对话本地仅留最近 10 条
const AI_HIST_KEY = 'ai_chat_history_v1';
const AI_HIST_CAP = 10;            // v3.5.137 历史对话仅保留最近 10 段（此前 30）
let KB = [];
let KB_FILTER = '全部';
const kbExpanded = new Set();      // v3.5.122 知识库已展开条目的全局索引（仅控制 UI 折叠态）
let AI_CHAT = [];
let AI_HIST = [];
let tokenExceeded = false;
// v3.5.114 起语音识别统一走首页链路（startVoiceHold('ai')），不再单独持有 AI 识别实例

function aiInit() {
  try { AI_CHAT = JSON.parse(localStorage.getItem(AI_CHAT_KEY) || '[]'); } catch { AI_CHAT = []; }
  if (!Array.isArray(AI_CHAT)) AI_CHAT = [];
  try { AI_HIST = JSON.parse(localStorage.getItem(AI_HIST_KEY) || '[]'); } catch { AI_HIST = []; }
  if (!Array.isArray(AI_HIST)) AI_HIST = [];
  loadKBLocal();
  loadAIHistLocal();
  // v3.5.110 知识库自动双向同步家庭云：启动即拉取；云端为空而本地有内容时上推
  if (isSyncReady()) {
    loadKBCloud()
      .then(had => { if (!had && KB.length) return saveKBCloud(); })
      .then(() => { seedAuthoritativeKB(); })   // v3.5.131 方案A：云端拉取完成后再投喂，避免与云端已有条目重复
      .catch(() => { seedAuthoritativeKB(); });
    // v3.5.137 历史对话已改为「仅本机、不共享」：不再读写家庭云
  } else {
    seedAuthoritativeKB();   // 未配置同步时也投喂（仅本机）
  }
  initScheduler();   // v3.5.132 启动定时任务调度（含天气地址云端恢复）
}

function escapeHtml(s) { return String(s).replace(/[&<>"']/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c])); }

/* ---------- v3.5.114 大模型输出的 markdown 记号净化 ----------
 * 背景：DeepSeek 回复里大量 ** 加粗、* 列表、*** 分隔线，气泡里显示成满屏星号，阅读吃力。
 * 策略：纯文本场景直接剥掉记号；气泡场景把 **xx** 转成 <b>xx</b>（保留重点层次），其余记号一律去掉。
 * 注意：气泡版先 escapeHtml 再插入 <b>，不存在 XSS 风险。 */
function mdToText(s) {
  return String(s == null ? '' : s)
    .replace(/\*\*\*(.+?)\*\*\*/g, '$1')
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/(^|\n)\s*[\*\-]\s+/g, '$1· ')
    .replace(/\*(.+?)\*/g, '$1')
    .replace(/\*/g, '')
    .replace(/^#{1,6}\s*/gm, '')
    .replace(/`{1,3}/g, '')
    .replace(/~~(.+?)~~/g, '$1');
}
function aiMsgHtml(text) {
  let s = escapeHtml(text == null ? '' : String(text));
  s = s.replace(/\*\*\*(.+?)\*\*\*/g, '<b>$1</b>');
  s = s.replace(/\*\*(.+?)\*\*/g, '<b>$1</b>');
  s = s.replace(/(^|\n)\s*[\*\-]\s+/g, '$1· ');
  s = s.replace(/\*(.+?)\*/g, '$1');
  s = s.replace(/\*/g, '');
  s = s.replace(/^#{1,6}\s*/gm, '');
  s = s.replace(/`{1,3}/g, '');
  s = s.replace(/~~(.+?)~~/g, '$1');
  return s.replace(/\n/g, '<br>');
}

/* ---------- AI 弹窗开关 / 标签 ---------- */
// v3.5.122 「全屏」按钮：在页面内把 AI 对话页撑满整个视口（非浏览器 Fullscreen API，手机端更稳），再点退出
const AI_FS_ENTER_SVG = '<svg viewBox="0 0 24 24"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/></svg>';
const AI_FS_EXIT_SVG = '<svg viewBox="0 0 24 24"><path d="M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5"/></svg>';
function toggleAIFullscreen() {
  const s = document.querySelector('.ai-sheet'); if (!s) return;
  const on = s.classList.toggle('ai-fullscreen');
  const b = document.getElementById('aiFsBtn');
  if (b) b.innerHTML = on ? AI_FS_EXIT_SVG : AI_FS_ENTER_SVG;
}
function openAI() {
  const overlay = document.getElementById('aiOverlay'); if (!overlay) return;
  overlay.classList.add('show');
  bindAIVoiceTouch();   // v3.5.114 话筒按住说话
  renderTokenBanner(); renderAIMsgs(); renderKb(); updateKbCntLine(); renderAIHistory();
  renderCatDropdownPanel('kb');   // v3.5.127 知识库分类下拉面板在 AI 打开时一并渲染
  const s = document.querySelector('.ai-sheet'); if (s) s.classList.add('ai-fullscreen');  // v3.5.127 默认全屏
  const fsBtn = document.getElementById('aiFsBtn'); if (fsBtn) fsBtn.innerHTML = AI_FS_EXIT_SVG;
}
// v3.5.110 关闭弹窗：自动把当前对话归档进「历史对话」并清空当前对话
function closeAI() {
  archiveAIChat();
  const o = document.getElementById('aiOverlay'); if (o) o.classList.remove('show');
  toggleAIDrawer(false);
  if (voiceTarget === 'ai') cancelVoiceHoldQuiet();
  // v3.5.122 关闭时退出全屏态，下次打开恢复常态
  const s = document.querySelector('.ai-sheet'); if (s) s.classList.remove('ai-fullscreen');
  const fsBtn = document.getElementById('aiFsBtn'); if (fsBtn) fsBtn.innerHTML = AI_FS_ENTER_SVG;
}
function switchAITab(t) {
  document.querySelectorAll('.ai-tab').forEach(x => x.classList.toggle('on', x.dataset.tab === t));
  const pc = document.getElementById('pane-chat'), pk = document.getElementById('pane-kb');
  if (pc) pc.classList.toggle('on', t === 'chat');
  if (pk) pk.classList.toggle('on', t === 'kb');
  if (t === 'kb') { renderKb(); updateKbCntLine(); }   // 切到知识库不清空当前对话
}

/* ---------- 历史对话抽屉 ---------- */
function toggleAIDrawer(show) {
  const d = document.getElementById('aiDrawer'), m = document.getElementById('aiDrawerMask');
  if (!d || !m) return;
  const on = show === undefined ? !d.classList.contains('show') : !!show;
  d.classList.toggle('show', on);
  m.classList.toggle('show', on);
  if (on) renderAIHistory();
}
function loadAIHistLocal() {
  try { AI_HIST = JSON.parse(localStorage.getItem(AI_HIST_KEY) || '[]'); } catch { AI_HIST = []; }
  if (!Array.isArray(AI_HIST)) AI_HIST = [];
  // v3.5.137 上限 10 条（旧版本可能存了 30 条，加载时一并裁剪回写）
  if (AI_HIST.length > AI_HIST_CAP) {
    AI_HIST = AI_HIST.slice(0, AI_HIST_CAP);
    try { localStorage.setItem(AI_HIST_KEY, JSON.stringify(AI_HIST)); } catch (e) {}
  }
}
function saveAIHistory() {
  if (AI_HIST.length > AI_HIST_CAP) AI_HIST = AI_HIST.slice(0, AI_HIST_CAP);
  try { localStorage.setItem(AI_HIST_KEY, JSON.stringify(AI_HIST)); } catch (e) {}
}
// v3.5.137 历史对话不再读写家庭云（仅本机保存，不共享给家人）
function archiveAIChat() {
  if (!AI_CHAT.length) return;
  const firstUser = AI_CHAT.find(m => m.role === 'me');
  AI_HIST.unshift({
    id: 'h' + Date.now(),
    time: new Date().toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }),
    preview: firstUser ? firstUser.text.slice(0, 40) : '（无内容）',
    msgs: AI_CHAT.slice()
  });
  saveAIHistory();
  AI_CHAT = [];
  try { localStorage.removeItem(AI_CHAT_KEY); } catch (e) {}
  renderAIMsgs();
}
function renderAIHistory() {
  const box = document.getElementById('aiHistList'); if (!box) return;
  if (!AI_HIST.length) { box.innerHTML = '<div class="ai-hist-empty">还没有历史对话。<br>关闭 AI 育儿页面时，当前对话会自动存到这里，<br>仅保存在本机（最多保留最近 10 条，不上传、不共享）。</div>'; return; }
  box.innerHTML = AI_HIST.map((h, i) => (
    `<div class="ai-hist-item" data-i="${i}">`
    + `<div class="ai-hist-head"><div class="ai-hist-time">${escapeHtml(h.time)}</div>`
    + `<span class="ai-hist-copy" onclick="event.stopPropagation();copyAIHist(${i})">复制</span></div>`
    + `<div class="ai-hist-prev">${escapeHtml(mdToText(h.preview))}</div>`
    + `<div class="ai-hist-body">${h.msgs.map(m => `<div class="ai-hist-msg"><b>${m.role === 'me' ? '我' : 'AI'}</b> ${aiMsgHtml(m.text)}</div>`).join('')}</div>`
    + `</div>`
  )).join('');
  box.querySelectorAll('.ai-hist-item').forEach(el => {
    el.addEventListener('click', () => el.classList.toggle('open'));
  });
}
// v3.5.125 历史对话复制：把该段对话整理成「时间 + 我/AI + 内容」的纯文本拷到剪贴板
function copyAIHist(i) {
  const h = AI_HIST[i];
  if (!h) { showToast('内容不存在'); return; }
  let txt = '【' + (h.time || '') + '】';
  (h.msgs || []).forEach(m => { txt += '\n' + (m.role === 'me' ? '我' : 'AI') + '：' + mdToText(m.text); });
  copyTextToClipboard(txt, '已复制整段对话');
}
function clearAIHistory() {
  if (!AI_HIST.length) return;
  if (!confirm('确定清空全部历史对话？此操作不可恢复。')) return;
  AI_HIST = []; saveAIHistory(); renderAIHistory();
}

/* ---------- token 上限提示 ---------- */
function setTokenExceeded(v) { tokenExceeded = !!v; renderTokenBanner(); }
function renderTokenBanner() { const b = document.getElementById('tokenBanner'); if (b) b.style.display = tokenExceeded ? 'block' : 'none'; }

/* ---------- 对话（本地 localStorage，上限 10 条；不联网同步） ---------- */
function saveAIChat() {
  if (AI_CHAT.length > AI_CHAT_CAP) AI_CHAT = AI_CHAT.slice(-AI_CHAT_CAP);
  try { localStorage.setItem(AI_CHAT_KEY, JSON.stringify(AI_CHAT)); } catch (e) {}
}
/* v3.5.120 AI 对话复制：点消息气泡下方的「复制」把该条内容拷到剪贴板（用 mdToText 去掉 markdown 记号，粘贴出来是干净文字） */
function copyAICur(i) {
  const m = AI_CHAT[i];
  if (!m) { showToast('内容不存在'); return; }
  copyTextToClipboard(mdToText(m.text));
}
// v3.5.131 ① 滚动到底部：立即一次 + 300ms 后补一次（等软键盘收起、视口恢复，确保落到最新 AI 回复）
function scrollAIMsgsBottom() {
  const box = document.getElementById('aiMsgs'); if (!box) return;
  box.scrollTop = box.scrollHeight;
  setTimeout(() => { if (box) box.scrollTop = box.scrollHeight; }, 300);
}
function renderAIMsgs() {
  const box = document.getElementById('aiMsgs'); if (!box) return;
  if (!AI_CHAT.length) {
    box.innerHTML = `<div class="ai-msg ai"><span class="ai-mini">AI 育儿助手</span>你好呀～我是咕噜的育儿小助手。我已经读过宝宝档案和你录入的「家庭知识库」，可以直接问我喂养、睡眠、发育相关的问题 🍼</div>`;
  } else {
    // v3.5.121 失败回复下方额外给「重试」；两类消息都保留「复制」
    box.innerHTML = AI_CHAT.map((m, i) => {
      const tools = (isAIFailMsg(m) ? `<span class="ai-retry" onclick="retryAIMsg(${i})">↻ 重试</span>` : '')
        + `<span class="ai-copy" onclick="copyAICur(${i})">复制</span>`;
      return m.role === 'me'
        ? `<div class="ai-msg-wrap me"><div class="ai-msg me">${aiMsgHtml(m.text)}</div><span class="ai-tools">${tools}</span></div>`
        : `<div class="ai-msg-wrap ai"><div class="ai-msg ai${isAIFailMsg(m) ? ' fail' : ''}"><span class="ai-mini">AI 育儿助手</span>${aiMsgHtml(m.text)}</div><span class="ai-tools">${tools}</span></div>`;
    }).join('');
  }
  scrollAIMsgsBottom();
  const c = document.getElementById('aiLocalCnt'); if (c) c.textContent = AI_CHAT.length;
}
/* ---------- v3.5.114 让 AI 能准确回答宝宝的具体数据 ----------
 * 背景：此前 system prompt 只注入「月龄 + 知识库」，家长问"今天拉了几次/喝了多少奶"时，
 * 模型看不到任何数据，只能回"我这边看不到宝宝的情况"。现在把宝宝档案 + 今日明细 +
 * 近 7 天逐日汇总 + 最近身高体重一并注入，模型可直接引用真实数字作答。 */
function daySummaryForAI(ds) {
  const recs = getRecordsByDate(ds);
  const byName = {};
  const notes = [];
  recs.forEach(r => {
    const n = r.name || r.type || '记录';
    if (!byName[n]) byName[n] = { cnt: 0, ml: 0, dur: 0, cnts: 0, statuses: [], foods: [], level: '', temp: null };
    const o = byName[n];
    o.cnt++;
    if (r.milkAmount != null) o.ml += Number(r.milkAmount) || 0;
    if (r.duration != null) o.dur += Number(r.duration) || 0;
    if (r.count != null) o.cnts += Number(r.count) || 0;
    if (r.poopStatus) o.statuses.push(r.poopStatus);
    if (Array.isArray(r.solidFoods)) r.solidFoods.forEach(f => { if (f && !o.foods.includes(f)) o.foods.push(f); });
    if (r.level) o.level = r.level;
    if (r.temperature) o.temp = r.temperature;
    if (r.note && String(r.note).trim()) notes.push(`${r.recTime || r.time || ''} ${n}: ${String(r.note).trim()}`);
  });
  return { recs, byName, notes };
}
// v3.5.131 改为逐条时间点输出（保留 recTime 的 HH:MM），便于回答"几点睡""距上次喂奶/睡眠多久"等带时间的问题
function formatDayForAI(ds) {
  const { recs, byName, notes } = daySummaryForAI(ds);
  if (!recs.length) return `- ${ds}：当天没有任何记录`;
  // 按时间升序逐条列出（时间取 recTime，统一 HH:MM）
  const sorted = recs.slice().sort((a, b) => String(a.recTime || a.time || '').localeCompare(String(b.recTime || b.time || '')));
  const lines = sorted.map(r => {
    const t = String(r.recTime || r.time || '').slice(0, 5);   // HH:MM
    const name = r.name || r.type || '记录';
    let d = name;
    if (r.milkAmount != null) d += ` ${Number(r.milkAmount) || 0}ml`;
    if (r.duration != null) d += ` ${Math.round(Number(r.duration) || 0)}分钟`;
    if (r.count != null) d += ` ${Number(r.count) || 0}次`;
    if (r.poopStatus) d += ` 性状:${r.poopStatus}`;
    if (Array.isArray(r.solidFoods) && r.solidFoods.length) d += ` 食物:${r.solidFoods.join('、')}`;
    if (r.level) d += ` ${r.level}`;
    if (r.temperature) d += ` ${r.temperature}℃`;
    if (r.note && String(r.note).trim()) d += ` 备注:${String(r.note).trim()}`;
    return `    · ${t} ${d}`;
  });
  let out = `- ${ds}（共${recs.length}条）：\n` + lines.join('\n');
  if (notes.length) out += `\n     备注：` + notes.join(' | ');
  return out;
}
function buildAISystemPrompt() {
  const ds = getTodayDateStr();
  const ad = getAgeDetail(ds);
  const birthStr = `${BIRTH_DATE.getFullYear()}-${String(BIRTH_DATE.getMonth() + 1).padStart(2, '0')}-${String(BIRTH_DATE.getDate()).padStart(2, '0')}`;
  const h = localStorage.getItem('babyHeight') || '';
  const w = localStorage.getItem('babyWeight') || '';
  const bh = getBodyHistory()
    .filter(x => x && x.d && (x.w != null || x.h != null))
    .sort((a, b) => (a.d < b.d ? 1 : -1))
    .slice(0, 6)
    .map(x => `${x.d} ${x.h != null ? x.h + 'cm' : ''}${(x.h != null && x.w != null) ? ' / ' : ''}${x.w != null ? x.w + 'kg' : ''}`)
    .join('；');

  const pad2 = n => String(n).padStart(2, '0');
  const now = new Date();
  const wk = ['日', '一', '二', '三', '四', '五', '六'][now.getDay()];
  const clock = `${now.getFullYear()}-${pad2(now.getMonth() + 1)}-${pad2(now.getDate())} ${pad2(now.getHours())}:${pad2(now.getMinutes())}（周${wk}）`;
  let baby = `【宝宝档案】\n- 姓名：${BABY_NAME}；出生日期：${birthStr}；今天：${ds}，当前 ${ad.months} 月龄 ${ad.days} 天\n`;
  if (h || w) baby += `- 当前身高体重（家长最新录入）：身高 ${h || '—'}cm，体重 ${w || '—'}kg\n`;
  if (bh) baby += `- 历史身高体重记录：${bh}\n`;
  baby += `现在时刻：${clock}（回答"现在几点""距上次喂奶/睡眠多久"等问题时，以此刻为基准与记录时间相减计算）\n`;

  const days = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
    days.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`);
  }
  const daily = days.map(formatDayForAI).join('\n');

  let kbText = '';
  if (KB.length) kbText = '\n\n【家庭知识库（我家宝宝的具体情况与偏好，回复时务必优先考虑）】\n' + KB.map(x => '- [' + x.cat + '] ' + x.text).join('\n');
  // v3.5.131 方案A：标注「权威资料」的条目为权威育儿参考，冲突时优先采信并注明出处
  if (KB.some(x => x.cat === KB_AUTH_CAT)) {
    kbText += '\n（其中标注「' + KB_AUTH_CAT + '」的条目为权威育儿参考，如崔玉涛《育儿百科》等；当与一般性经验或网络说法冲突时，优先采信权威资料，并尽量注明出处。）';
  }

  return '你是一位耐心、专业的婴幼儿育儿顾问，服务对象是用户的小宝宝。\n'
    + '请用简洁、温暖、可操作的口吻回答喂养、睡眠、发育、健康、早教等问题，给出具体建议并说明原因；如无把握请如实说明并建议就医。\n'
    + '回答使用简体中文，避免冗长，分点清晰。不要使用 markdown 标记：不要写星号（* 或 **），不要加 # 标题，列点请用「·」或「1. 2. 3.」。\n\n'
    + baby
    + '\n【宝宝每日记录（家长手工录入，时间为当天 HH:MM）】\n'
    + daily
    + '\n（以上为家长手工录入的真实数据，时间为当天 HH:MM。家长问"今天喝了多少奶""拉了几次、性状如何""睡了多久"等具体数字时，'
    + '直接引用上面数据作答，不要说"我看不到宝宝的情况"；问"现在几点""距上次喂奶/睡眠多久"时，用上面记录的时间与「现在时刻」相减计算并说明；'
    + '某项当天没有记录时，直接说"记录里没有这一项"，不要编造，也不要反问用户来确认。）'
    + kbText;
}
/* ---------- v3.5.121 AI 问答稳定性修复 ----------
 * 线上反馈：AI 有时回"（抱歉，AI 暂时没有回应，请稍后再试）"。定位到 6 个原因：
 *  ① 单次请求超时只有 15s——system prompt 里带了宝宝档案 + 近 7 天逐日明细 + 家庭知识库，
 *     模型生成一段完整回答通常要 20~40s（移动网络更久），于是正常回答被 abort 掉，误报失败；
 *  ② 失败后没有任何重试，一次网络抖动/服务端 5xx 就直接放弃；
 *  ③ 429 一律当作"token 额度耗尽"并弹 banner，但移动网络下 429 大多是短时频率限制，等几秒即可；
 *  ④ 失败占位文本被当成 AI 的正式回复写进对话，还会随下一轮请求发给模型，污染上下文；
 *  ⑤ 家庭云端默认密钥是异步加载的，冷启动后立刻提问会读到空配置；
 *  ⑥ 没有并发保护，回车连点会同时发多个请求，更容易触发限流。
 * 下面逐条修掉，并且失败时在气泡下方给「重试」按钮，一键用最近的提问重新请求。 */
const AI_REQ_TIMEOUT = 60000;   // 单次请求超时（原 15000ms）
const AI_REQ_RETRY = 2;         // 可重试错误的最大重试次数（总尝试 = 3）
const AI_FAIL_RE = /抱歉，AI 暂时没有回应|模型 token 额度已达上限|AI 响应超时|AI 服务端暂时故障|AI 返回了空内容|AI 请求过于频繁|AI 密钥无效|模型不可用/;
let aiBusy = false;             // 请求进行中标记（防并发）
let aiReqSeq = 0;               // 请求序号：清空对话/关闭页面后，旧请求的结果作废

// 判断一条已存在的 AI 回复是否为"失败占位"（含旧版本写进历史的老文案）
function isAIFailMsg(m) { return !!(m && m.role === 'ai' && (m.failed || AI_FAIL_RE.test(String(m.text || '')))); }
function aiFailReasonText(reason) {
  switch (reason) {
    case 'quota': return '⚠️ 当前模型 token 额度已达上限，AI 暂时无法回复。请稍后再试，或联系管理员调整额度。';
    case 'ratelimit': return '⚠️ AI 请求过于频繁（服务端限流），已自动重试仍未成功，请等十几秒后再问。';
    case 'auth': return '（AI 密钥无效或已过期：请到「管理」页重新配置密钥）';
    case 'model': return '（模型不可用：请到「管理」页检查模型名称与接口地址）';
    case 'server': return '（AI 服务端暂时故障，已自动重试仍未成功，请稍后点下方「重试」）';
    case 'timeout': return '（AI 响应超时，网络较慢时较常见，请点下方「重试」）';
    case 'network': return '（网络异常导致请求中断，请检查网络后点下方「重试」）';
    case 'empty': return '（AI 返回了空内容，请点下方「重试」）';
    default: return '（抱歉，AI 暂时没有回应，请点下方「重试」）';
  }
}
// 单次请求：成功 {ok:true,content}；失败 {ok:false,reason,status?,retryAfter?}
async function _aiFetchOnce(cfg, messages) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), AI_REQ_TIMEOUT);
  try {
    const res = await fetch(cfg.base, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + cfg.apiKey },
      body: JSON.stringify({ model: cfg.model, messages: messages, temperature: 0.6 }),
      signal: ctrl.signal
    });
    if (res.ok) {
      let j = null;
      try { j = await res.json(); } catch { return { ok: false, reason: 'empty', status: res.status }; }
      const content = j && j.choices && j.choices[0] && j.choices[0].message && j.choices[0].message.content;
      if (!content || !String(content).trim()) return { ok: false, reason: 'empty', status: res.status };
      return { ok: true, content: String(content) };
    }
    // 非 2xx：读响应体，用于区分「短时限流」与「额度/余额耗尽」
    let body = '';
    try { body = String((await res.text()) || ''); } catch {}
    const hint = (body + ' ' + (res.headers.get('retry-after') || '')).toLowerCase();
    if (res.status === 429 || res.status === 402) {
      const isQuota = /insufficient|balance|quota|arrears|欠费|余额|额度/.test(hint);
      return { ok: false, reason: isQuota ? 'quota' : 'ratelimit', status: res.status, retryAfter: Number(res.headers.get('retry-after')) || 0 };
    }
    if (res.status === 401 || res.status === 403) return { ok: false, reason: 'auth', status: res.status };
    if (res.status === 404) return { ok: false, reason: 'model', status: res.status };
    if (res.status === 400 && /model|not found|不存在|invalid/.test(hint)) return { ok: false, reason: 'model', status: res.status };
    if (res.status >= 500) return { ok: false, reason: 'server', status: res.status };
    return { ok: false, reason: 'other', status: res.status };
  } catch (e) {
    const aborted = !!(e && (e.name === 'AbortError' || e.name === 'TimeoutError'));
    return { ok: false, reason: aborted ? 'timeout' : 'network' };
  } finally { clearTimeout(timer); }
}
// 带自动重试的对话调用：成功返回文本；失败返回 '__FAIL__:<reason>'
async function callAIChat(cfg, messages) {
  const RETRYABLE = { timeout: 1, network: 1, server: 1, ratelimit: 1, empty: 1 };
  let last = { ok: false, reason: 'other' };
  for (let attempt = 0; attempt <= AI_REQ_RETRY; attempt++) {
    if (attempt > 0) {
      let wait = (last.reason === 'ratelimit') ? 3000 : 1200 * attempt;   // 指数退避
      if (last.retryAfter > 0) wait = Math.max(wait, Math.min(last.retryAfter * 1000, 15000));  // 服务端指定优先级更高
      _setAITypingText(`AI 正在思考…（第 ${attempt + 1} 次尝试）`);
      try { console.warn('[AI] 第 ' + attempt + ' 次请求失败(' + last.reason + ')，' + Math.round(wait / 1000) + 's 后重试'); } catch {}
      await new Promise(r => setTimeout(r, wait));
    }
    const r = await _aiFetchOnce(cfg, messages);
    if (r.ok) return r.content;
    last = r;
    if (!RETRYABLE[r.reason]) break;   // auth/model/quota 重试无意义
  }
  try { console.warn('[AI] 请求最终失败：', last); } catch {}
  return '__FAIL__:' + last.reason;
}
function _setAITypingText(t) { const el = document.getElementById('aiTyping'); if (el) el.textContent = t; }

// 发起一轮请求（调用前需保证最后一条是用户提问）；失败时写入带 failed 标记的回复
async function runAIRequest() {
  if (aiBusy) return;
  aiBusy = true;
  const seq = ++aiReqSeq;
  const box = document.getElementById('aiMsgs');
  const typing = document.createElement('div');
  typing.className = 'ai-typing'; typing.id = 'aiTyping'; typing.textContent = 'AI 正在思考…';
  if (box) { box.appendChild(typing); box.scrollTop = box.scrollHeight; }
  // 每秒刷新等待时长：超过 12 秒补一句说明，避免长回答期间看起来像卡死
  const t0 = Date.now();
  const tick = setInterval(() => {
    const s = Math.round((Date.now() - t0) / 1000);
    if (s > 12) _setAITypingText(`AI 仍在生成回答…（已等待 ${s} 秒）`);
  }, 1000);

  let reply = '', failed = false, reason = '';
  try {
    let cfg = getAITagConfig();
    if (!cfg && !_cloudAITagKeyLoaded) {
      // 家庭云端默认密钥是异步加载的：冷启动后马上提问会读到空配置，这里等一次（最多 4 秒）
      try { await Promise.race([loadCloudAITagKey(), new Promise(r => setTimeout(r, 4000))]); } catch {}
      cfg = getAITagConfig();
    }
    if (!cfg) {
      reply = '（尚未配置 AI 密钥：请到「管理」页配置 DeepSeek 等大模型密钥后再使用本功能）';
    } else {
      const msgs = [{ role: 'system', content: buildAISystemPrompt() }]
        .concat(AI_CHAT.filter(m => (m.role === 'me' || m.role === 'ai') && !isAIFailMsg(m))
          .map(m => ({ role: m.role === 'me' ? 'user' : 'assistant', content: m.text })));
      const r = await callAIChat(cfg, msgs);
      if (typeof r === 'string' && r.indexOf('__FAIL__:') === 0) {
        reason = r.slice(9); failed = true; reply = aiFailReasonText(reason);
        setTokenExceeded(reason === 'quota');
      } else {
        setTokenExceeded(false);
        reply = r;
      }
    }
  } finally {
    clearInterval(tick);
    aiBusy = false;
    const el = document.getElementById('aiChatInput'); if (el) el.readOnly = false;   // v3.5.131 复位，输入框恢复可编辑
  }
  if (seq !== aiReqSeq) return;   // 期间对话被清空/用户已离开，丢弃结果
  const t = document.getElementById('aiTyping'); if (t) t.remove();
  AI_CHAT.push(failed ? { role: 'ai', text: reply, failed: true, reason } : { role: 'ai', text: reply });
  saveAIChat(); renderAIMsgs();
}
// v3.5.131 ① 回车/发送后先 blur() 收起键盘；发送期间输入框加 readonly 防并发（仍可点、可聚焦）
async function sendAIMsg() {
  if (aiBusy) { showToast('AI 正在回答，请稍候'); return; }
  const el = document.getElementById('aiChatInput'); if (!el) return;
  const v = el.value.trim(); if (!v) return;
  el.blur();                  // 收起软键盘
  el.readOnly = true;          // 防并发（回复返回后由 runAIRequest 复位）
  AI_CHAT.push({ role: 'me', text: v }); el.value = ''; saveAIChat(); renderAIMsgs();
  await runAIRequest();
}
// 一键重试：删掉这条失败的 AI 回复，用最近的用户提问重新请求（提问本身保留）
async function retryAIMsg(i) {
  if (aiBusy) { showToast('AI 正在回答，请稍候'); return; }
  const m = AI_CHAT[i];
  if (!isAIFailMsg(m)) return;
  AI_CHAT.splice(i, 1);
  saveAIChat(); renderAIMsgs();
  let hasMe = false;
  for (let k = AI_CHAT.length - 1; k >= 0; k--) { if (AI_CHAT[k].role === 'me') { hasMe = true; break; } }
  if (!hasMe) { showToast('没有可重试的问题'); return; }
  await runAIRequest();
}
function clearAIChat() {
  aiReqSeq++;                                   // 使在途请求的结果作废
  const t = document.getElementById('aiTyping'); if (t) t.remove();
  AI_CHAT = []; saveAIChat(); renderAIMsgs();
}
// 回车发送（Shift+Enter 换行）
function aiInputKey(e) {
  if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) {
    e.preventDefault();
    sendAIMsg();
  }
}

/* ---------- 知识库（7 类 + 综合兜底；AI 自动分类；加密同步家庭云） ---------- */
function loadKBLocal() { try { KB = JSON.parse(localStorage.getItem(KB_KEY) || '[]'); } catch { KB = []; } if (!Array.isArray(KB)) KB = []; }
function saveKBLocal() { try { localStorage.setItem(KB_KEY, JSON.stringify(KB)); } catch (e) {} }

/* ==================== v3.5.132 定时任务 + 今日计划 ==================== */
const SCHED_TASKS_KEY = 'sched_tasks';
const WEATHER_ADDR_KEY = 'weather_addr';
const WEATHER_ADDR_CLOUD_KEY = 'weather_addr_v1';   // 加密家庭云（地址不写死、可配置）
const WEATHER_GEO_CACHE_KEY = 'weather_geo_cache';
const SCHED_DEFAULT_ADDR = '上海市闵行区七宝镇宝南路55弄九星家园';
const SCHED_GEN_LEAD = 12 * 3600000;     // 提前 12 小时生成计划
const SCHED_PUSH_GRACE = 3 * 3600000;    // 触发后宽限 3 小时内才推送（避免补推历史）
const SCHED_GEN_COOLDOWN = 30 * 60000;   // AI 生成失败重试冷却 30 分钟
let SCHED_TASKS = [];
let todayPlanExpanded = false;
const _pad2 = n => String(n).padStart(2, '0');

function loadSchedTasks() {
  try { SCHED_TASKS = JSON.parse(localStorage.getItem(SCHED_TASKS_KEY) || '[]'); } catch (e) { SCHED_TASKS = []; }
  if (!Array.isArray(SCHED_TASKS)) SCHED_TASKS = [];
}
function saveSchedTasks() { try { localStorage.setItem(SCHED_TASKS_KEY, JSON.stringify(SCHED_TASKS)); } catch (e) {} }

/* ---------- 天气地址（可配置 + 加密家庭云） ---------- */
function getWeatherAddr() { return localStorage.getItem(WEATHER_ADDR_KEY) || SCHED_DEFAULT_ADDR; }
function setWeatherAddr(addr) {
  const a = (addr || '').trim() || SCHED_DEFAULT_ADDR;
  localStorage.setItem(WEATHER_ADDR_KEY, a);
  saveWeatherAddrCloud(a);
}
async function saveWeatherAddrCloud(addr) {
  if (!isSyncReady()) return;
  try {
    const key = await getCryptoKey(); if (!key) return;
    const { data, iv } = await encrypt(key, JSON.stringify({ addr: addr }));
    await supabaseUpsert('family_config', { family_id: getFamilyId(), config_key: WEATHER_ADDR_CLOUD_KEY, encrypted_data: data, iv, last_modified: Date.now() });
  } catch (e) { console.warn('[天气地址] 云端保存失败', e); }
}
async function loadWeatherAddrCloud() {
  if (!isSyncReady()) return;
  try {
    const key = await getCryptoKey(); if (!key) return;
    const rows = await supabaseGet(`family_config?family_id=eq.${getFamilyId()}&config_key=eq.${WEATHER_ADDR_CLOUD_KEY}&select=encrypted_data,iv`);
    if (rows.length && rows[0].encrypted_data && rows[0].iv) {
      const json = await decrypt(key, rows[0].encrypted_data, rows[0].iv);
      const o = JSON.parse(json || '{}');
      if (o && o.addr) localStorage.setItem(WEATHER_ADDR_KEY, o.addr);
    }
  } catch (e) { console.warn('[天气地址] 云端读取失败', e); }
}
function saveWeatherAddrUI() {
  const inp = document.getElementById('weatherAddrInput'); if (!inp) return;
  const v = inp.value.trim();
  if (!v) { showToast('地址不能为空'); return; }
  setWeatherAddr(v);
  showToast('天气地址已保存（加密同步家庭云）');
}

/* ---------- 天气（Open-Meteo 免密钥 API） ---------- */
const WMO_CODES = {0:'晴',1:'大致晴朗',2:'局部多云',3:'阴',45:'雾',48:'雾凇',51:'毛毛雨(弱)',53:'毛毛雨',55:'毛毛雨(强)',56:'冻毛毛雨',57:'冻毛毛雨',61:'小雨',63:'中雨',65:'大雨',66:'冻雨',67:'冻雨',71:'小雪',73:'中雪',75:'大雪',77:'雪粒',80:'阵雨(弱)',81:'阵雨',82:'阵雨(强)',85:'阵雪',86:'阵雪(强)',95:'雷阵雨',96:'雷阵雨伴小冰雹',99:'雷阵雨伴大冰雹'};
async function geocodeAddr(addr) {
  const raw = String(addr || '').trim();
  if (!raw) return null;
  const cache = (() => { try { return JSON.parse(localStorage.getItem(WEATHER_GEO_CACHE_KEY) || '{}'); } catch (e) { return {}; } })();
  if (cache[raw] && cache[raw].lat) return cache[raw];
  // v3.5.137 修复「未查询到天气」：Open-Meteo 地理编码对中文详细地址（如"上海市闵行区七宝镇xx路55弄"）几乎匹配不到，
  // 改为逐级降级——原地址 → 去门牌 → 市名 → 区名，任一命中即用；全部失败再用内置坐标兜底。
  const cands = geoCandidates(raw);
  for (let i = 0; i < cands.length; i++) {
    const r = await geoSearchOne(cands[i]);
    if (r) { cache[raw] = r; try { localStorage.setItem(WEATHER_GEO_CACHE_KEY, JSON.stringify(cache)); } catch (e) {} return r; }
  }
  const fb = geoFallback(raw);
  if (fb) { cache[raw] = fb; try { localStorage.setItem(WEATHER_GEO_CACHE_KEY, JSON.stringify(cache)); } catch (e) {} return fb; }
  console.warn('[天气] 地理编码全部失败，地址：', raw);
  return null;
}

/* ---------- v3.5.137 地理编码降级与兜底 ---------- */
// 常见城市坐标（接口不可用时的最后一道保险）
const CN_CITY_FALLBACK = {
  '北京': [39.9042, 116.4074], '上海': [31.2304, 121.4737], '天津': [39.3434, 117.3616], '重庆': [29.5630, 106.5516],
  '广州': [23.1291, 113.2644], '深圳': [22.5431, 114.0579], '杭州': [30.2741, 120.1551], '南京': [32.0603, 118.7969],
  '苏州': [31.2989, 120.5853], '无锡': [31.4912, 120.3119], '宁波': [29.8683, 121.5440], '合肥': [31.8206, 117.2272],
  '成都': [30.5728, 104.0668], '武汉': [30.5928, 114.3055], '西安': [34.3416, 108.9398], '郑州': [34.7466, 113.6254],
  '长沙': [28.2282, 112.9388], '南昌': [28.6820, 115.8579], '福州': [26.0745, 119.2965], '厦门': [24.4798, 118.0894],
  '济南': [36.6512, 117.1201], '青岛': [36.0671, 120.3826], '沈阳': [41.8057, 123.4315], '大连': [38.9140, 121.6147],
  '哈尔滨': [45.8038, 126.5349], '长春': [43.8171, 125.3235], '石家庄': [38.0428, 114.5149], '太原': [37.8706, 112.5489],
  '南宁': [22.8170, 108.3669], '昆明': [24.8801, 102.8329], '贵阳': [26.6470, 106.6302], '海口': [20.0444, 110.1999],
  '兰州': [36.0611, 103.8343], '西宁': [36.6171, 101.7782], '银川': [38.4872, 106.2309], '乌鲁木齐': [43.8256, 87.6168],
  '呼和浩特': [40.8414, 111.7519], '拉萨': [29.6500, 91.1000], '三亚': [18.2528, 109.5119],
  '香港': [22.3193, 114.1694], '澳门': [22.1987, 113.5439], '台北': [25.0330, 121.5654]
};
// 常用区县坐标（比市级更贴近，优先匹配）
const CN_DISTRICT_FALLBACK = {
  '闵行': [31.1128, 121.3817], '浦东': [31.2216, 121.5397], '徐汇': [31.1883, 121.4365], '黄浦': [31.2317, 121.4844],
  '静安': [31.2290, 121.4483], '长宁': [31.2204, 121.4246], '普陀': [31.2495, 121.3963], '虹口': [31.2646, 121.5050],
  '杨浦': [31.2595, 121.5264], '宝山': [31.4050, 121.4894], '嘉定': [31.3756, 121.2655], '松江': [31.0322, 121.2277],
  '青浦': [31.1497, 121.1243], '奉贤': [30.9179, 121.4740], '金山': [30.7418, 121.3414], '崇明': [31.6269, 121.3973]
};
// 由详细地址逐级生成搜索候选（去重、保持精度优先）
function geoCandidates(addr) {
  const out = [];
  const push = s => { const v = String(s == null ? '' : s).replace(/[\s,，]+/g, ''); if (v.length >= 2 && out.indexOf(v) < 0) out.push(v); };
  const a = String(addr || '').trim();
  if (!a) return out;
  push(a);
  push(a.replace(/[0-9０-９]+/g, '').replace(/[弄号幢栋室座组队排弄]/g, ''));
  let rest = a;
  const mProv = a.match(/^(.{2,8}?)(?:省|自治区|特别行政区)/);   // 省 / 自治区
  if (mProv) { push(mProv[1]); rest = a.slice(mProv[0].length); }
  const mCity = rest.match(/^(.{2,8}?)(?:市|自治州|地区|盟)/);     // 市 / 州 / 地区
  if (mCity) push(mCity[1]);
  const dm = a.match(/([^省市区县镇乡街道]{2,5})(?:区|县|旗)/g); // 区 / 县
  if (dm) dm.slice().reverse().forEach(x => { push(x); push(x.replace(/(区|县|旗)$/, '')); });
  return out;
}
// 兜底：按地址中的「区」→「市」关键字取内置坐标
function geoFallback(addr) {
  const a = String(addr || '');
  for (const k in CN_DISTRICT_FALLBACK) if (a.indexOf(k) >= 0) return { lat: CN_DISTRICT_FALLBACK[k][0], lon: CN_DISTRICT_FALLBACK[k][1], name: k };
  for (const k in CN_CITY_FALLBACK) if (a.indexOf(k) >= 0) return { lat: CN_CITY_FALLBACK[k][0], lon: CN_CITY_FALLBACK[k][1], name: k };
  return null;
}
// 单次地理编码：只要中国境内的结果（避免「上海市」被匹配到美国同名小镇）
async function geoSearchOne(q) {
  try {
    const url = 'https://geocoding-api.open-meteo.com/v1/search?name=' + encodeURIComponent(q) + '&count=5&language=zh&format=json';
    const res = await fetch(url);
    const j = await res.json();
    const list = (j && j.results) || [];
    const r = list.find(x => x && (x.country_code === 'CN' || x.country === '中国'));
    if (r) return { lat: r.latitude, lon: r.longitude, name: (r.name || '') + (r.admin1 ? '·' + r.admin1 : '') };
  } catch (e) { console.warn('[天气] 地理编码失败(', q, '):', e); }
  return null;
}
async function fetchWeather(addr, dateStr) {
  const geo = await geocodeAddr(addr); if (!geo) return null;
  try {
    const url = 'https://api.open-meteo.com/v1/forecast?latitude=' + geo.lat + '&longitude=' + geo.lon
      + '&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,wind_speed_10m_max'
      + '&timezone=Asia%2FShanghai&start_date=' + dateStr + '&end_date=' + dateStr;
    const res = await fetch(url);
    const j = await res.json();
    const d = j && j.daily;
    if (!d || !d.time || !d.time.length) return null;
    return { code: d.weather_code[0], tmax: d.temperature_2m_max[0], tmin: d.temperature_2m_min[0],
      pop: d.precipitation_probability_max[0], wind: d.wind_speed_10m_max[0], name: geo.name };
  } catch (e) { console.warn('[天气] 获取失败', e); return null; }
}
function weatherText(w) {
  if (!w) return '（天气获取失败，请手动参考天气预报）';
  const desc = WMO_CODES[w.code] != null ? WMO_CODES[w.code] : ('天气代码' + w.code);
  return w.name + ' ' + desc + '，最高' + Math.round(w.tmax) + '℃/最低' + Math.round(w.tmin) + '℃，降水概率' + (w.pop != null ? w.pop : '—') + '%，最大风速' + (w.wind != null ? Math.round(w.wind) : '—') + 'km/h';
}

/* ---------- 触发时间计算 ---------- */
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
    return { prev: first.getTime() <= now.getTime() ? first : null,
             next: first.getTime() > now.getTime() ? first : null };
  }
  let prev = new Date(first.getTime());
  if (prev.getTime() > now.getTime()) {
    while (prev.getTime() > now.getTime()) prev = stepBack(prev, task.freq);
  } else {
    while (stepFwd(prev, task.freq).getTime() <= now.getTime()) prev = stepFwd(prev, task.freq);
  }
  return { prev: prev, next: stepFwd(prev, task.freq) };
}
function periodKey(task, trig) {
  const y = trig.getFullYear();
  if (task.freq === 'once') return 'once';
  if (task.freq === 'daily') return y + '-' + _pad2(trig.getMonth() + 1) + '-' + _pad2(trig.getDate());
  if (task.freq === 'weekly') {
    const onejan = new Date(y, 0, 1);
    const wk = Math.ceil((((trig - onejan) / 86400000) + onejan.getDay() + 1) / 7);
    return y + '-W' + _pad2(wk);
  }
  if (task.freq === 'monthly') return y + '-' + _pad2(trig.getMonth() + 1);
  return '';
}

/* ---------- 计划生成（AI） ---------- */
function buildPlanSystemPrompt(dateStr, wText) {
  const ad = getAgeDetail(dateStr);
  const birthStr = BIRTH_DATE.getFullYear() + '-' + _pad2(BIRTH_DATE.getMonth() + 1) + '-' + _pad2(BIRTH_DATE.getDate());
  const h = localStorage.getItem('babyHeight') || '';
  const w = localStorage.getItem('babyWeight') || '';
  const kbPart = KB.slice(0, 50).map(x => '- [' + x.cat + '] ' + x.text).join('\n');
  return '你是一位专业、贴心的婴幼儿育儿规划助手，服务对象是长辈（外婆）带小宝宝，目标是提前生成「今日计划」以减少带娃决策压力。\n'
    + '请用简体中文，具体、可操作；不要使用 markdown 标记（不用 * 和 #），分点请用「·」或「1. 2. 3.」。\n\n'
    + '【宝宝档案】\n- 姓名：' + BABY_NAME + '；出生：' + birthStr + '；当前 ' + ad.months + ' 月龄 ' + ad.days + ' 天\n'
    + ((h || w) ? '- 身高 ' + (h || '—') + 'cm，体重 ' + (w || '—') + 'kg\n' : '')
    + '\n【家庭知识库（优先参考，含权威育儿资料）】\n' + (kbPart || '（暂无）') + '\n'
    + '\n【目标日期天气】' + dateStr + ' ' + wText + '\n'
    + '\n【规划规则——请严格按以下三部分输出】\n'
    + '【衣+行+健康】根据天气，结合知识库与宝宝情况，推荐户外活动时间与时长、穿衣、防病注意事项（如大风不出门、起雾少开窗、降温添衣、雾霾减少外出等）。\n'
    + '【食】单次奶量、喝奶次数、乳糖酶用量、辅食建议尝试的食物及具体量、注意事项（过敏/防呛等）。\n'
    + '【住】是否洗澡（结合天气与知识库，提醒开暖风等）、是否剪指甲、营养补剂、排便关注（据此前情况与知识库提醒，如近期易腹泻需肚子保暖）。\n'
    + '\n【输出格式】第一行必须以「摘要：」开头写一句不超过 30 字的关键提示；之后换行写「计划：」，再按【衣+行+健康】【食】【住】分块给出内容。';
}
function splitPlan(full) {
  if (!full) return { summary: '', detail: '' };
  let summary = '', detail = String(full);
  const m = detail.match(/摘要[:：]\s*([^\n]*)/);
  if (m) summary = m[1].trim();
  const idx = detail.indexOf('计划：');
  if (idx >= 0) detail = detail.slice(idx + 3).trim();
  if (!summary) summary = (String(full).split('\n')[0] || '').slice(0, 30);
  return { summary: summary, detail: detail };
}
async function getAITagConfigWait() {
  let cfg = getAITagConfig();
  if (!cfg && (typeof _cloudAITagKeyLoaded === 'undefined' || !_cloudAITagKeyLoaded)) {
    try { await Promise.race([loadCloudAITagKey(), new Promise(r => setTimeout(r, 4000))]); } catch (e) {}
    cfg = getAITagConfig();
  }
  return cfg;
}
async function generatePlanForTask(task, trig) {
  const cfg = await getAITagConfigWait();
  if (!cfg) { console.warn('[计划] 未配置 AI 密钥，跳过生成'); return; }
  const dateStr = trig.getFullYear() + '-' + _pad2(trig.getMonth() + 1) + '-' + _pad2(trig.getDate());
  let wText = '（未获取）';
  try { wText = weatherText(await fetchWeather(getWeatherAddr(), dateStr)); } catch (e) {}
  const r = await callAIChat(cfg, [
    { role: 'system', content: buildPlanSystemPrompt(dateStr, wText) },
    { role: 'user', content: '请为 ' + dateStr + '（地址：' + getWeatherAddr() + '）生成今日计划，严格按格式输出。' }
  ]);
  if (typeof r === 'string' && r.indexOf('__FAIL__:') === 0) { console.warn('[计划] AI 生成失败', r); return; }
  task.content = String(r).trim();
  task.genPeriod = periodKey(task, trig);
  task.genDate = dateStr;
  saveSchedTasks();
}

/* ---------- 推送（复用今日成就的 PushPlus 配置） ---------- */
async function pushTask(task, trig, pk) {
  let title, content;
  if (task.mode === 'ai') {
    const sp = splitPlan(task.content);
    const ds = task.genDate || (trig.getFullYear() + '-' + _pad2(trig.getMonth() + 1) + '-' + _pad2(trig.getDate()));
    title = '📅 ' + ds + ' 今日计划';
    const sum = sp.summary ? '<p style="font-size:16px;font-weight:600;">📌 ' + escapeHtml(sp.summary) + '</p>' : '';
    content = '<h3>小咕噜 ' + ds + ' 今日计划</h3>' + sum + '<pre style="white-space:pre-wrap;font-family:inherit;line-height:1.6;">' + escapeHtml(sp.detail || task.content || '') + '</pre>';
  } else {
    title = '⏰ 定时提醒';
    content = '<pre style="white-space:pre-wrap;font-family:inherit;line-height:1.6;">' + escapeHtml(task.content || '') + '</pre>';
  }
  const ok = await notifyPushplus(title, content);
  if (ok) {
    task.pushPeriod = pk; task.pushTs = Date.now();
    if (task.freq === 'once') task.enabled = false;
    saveSchedTasks();
  }
  return ok;
}

/* ---------- 调度器（静态站点：页面打开时由定时器检查触发） ---------- */
// v3.5.136 是否处于「提前 12 小时生成窗口」，即 [下次触发-12h, 下次触发)
// 跨天也成立：每天 08:00 的任务，当天 20:00 起即可生成/编辑次日计划
function planGenWindowOpen(task, now) {
  const n = now || new Date();
  const { next } = computeTriggers(task, n);
  if (!next) return false;
  const winStart = new Date(next.getTime() - SCHED_GEN_LEAD);
  return n >= winStart && n < next;
}
// v3.5.136 可编辑判定直接对齐生成窗口（原来要求"下次触发的周期=今天"，导致 20:00 后生成的次日计划被误判为不可编辑）
function isPlanEditable(task) {
  if (task.mode !== 'ai') return true;
  return planGenWindowOpen(task);
}
// v3.5.136 只读提示：本周期已推送完成且下一周期计划尚未生成时，沿用原有文案
function planLockMsg(task) {
  const now = new Date();
  const { prev } = computeTriggers(task, now);
  if (prev && task.pushPeriod === periodKey(task, prev)) return '因今日计划已推送，明日计划未生成，无法编辑';
  return '未到计划生成时间，暂无法编辑';
}
async function runScheduler(forceGen) {
  const now = new Date();
  const canPush = isPushSender();
  for (const task of SCHED_TASKS) {
    if (!task.enabled) continue;
    const { prev, next } = computeTriggers(task, now);
    // AI 计划生成：进入 [触发-12h, 触发) 窗口且本周期未生成。
    // v3.5.136 生成不再受"由本设备负责推送"限制——任务为本机所有，否则未开启推送的设备上计划会一直空白。
    // forceGen=true（用户主动打开任务页/新建/开启任务）时忽略失败冷却，计划内容仍为空则当场重试。
    if (task.mode === 'ai' && next) {
      const winStart = new Date(next.getTime() - SCHED_GEN_LEAD);
      if (now >= winStart && now < next) {
        const pk = periodKey(task, next);
        const cooling = (Date.now() - (task.genTryTs || 0)) <= SCHED_GEN_COOLDOWN;
        if (task.genPeriod !== pk && (!cooling || (forceGen && !task.content))) {
          task.genTryTs = Date.now(); saveSchedTasks();
          await generatePlanForTask(task, next);
        }
      }
    }
    // 触发推送：触发时刻起、宽限 3 小时内（仅"由本设备负责推送"的设备执行，避免多设备重复推送）
    if (!canPush) continue;
    const trig = next || (task.freq === 'once' ? prev : null);
    if (trig && now >= trig && now < new Date(trig.getTime() + SCHED_PUSH_GRACE)) {
      const pk = periodKey(task, trig);
      if (task.pushPeriod !== pk) {
        if (task.mode === 'ai' && !task.content) { await generatePlanForTask(task, trig); }
        await pushTask(task, trig, pk);
      }
    }
  }
  if (currentManageTab === 'tasks') renderSchedTasks();
  renderTodayPlanCard();
}
function initScheduler() {
  loadSchedTasks();
  loadWeatherAddrCloud().catch(() => {});
  runScheduler();
  setInterval(runScheduler, 60000);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) runScheduler(); });
}

/* ---------- 今日计划（首页总览卡片） ---------- */
function getCurrentPlan() {
  const task = SCHED_TASKS.find(t => t.enabled && t.mode === 'ai');
  if (!task) return null;
  const now = new Date();
  const { prev, next } = computeTriggers(task, now);
  const todayStr = getTodayDateStr();
  if (prev && periodKey(task, prev) === todayStr && task.pushPeriod === periodKey(task, prev) && task.content) {
    return { text: task.content, editable: false, date: todayStr };
  }
  if (next && periodKey(task, next) === todayStr) {
    const winStart = new Date(next.getTime() - SCHED_GEN_LEAD);
    if (now >= winStart && now < next) {
      return { text: task.content || '', editable: true, date: todayStr, pending: !task.content };
    }
  }
  return null;
}
function renderTodayPlanCardHTML() {
  const p = getCurrentPlan();
  if (!p) return '';
  const sp = splitPlan(p.text);
  const disp = sp.summary || (p.text ? p.text.split('\n')[0].slice(0, 40) : '（尚未生成）');
  const full = sp.detail || p.text || '（尚未生成）';
  const detailStyle = todayPlanExpanded ? 'display:block;' : 'display:none;';
  const chev = todayPlanExpanded ? '▾' : '▸';
  const note = p.editable ? '' : ' <span class="ov-plan-lock">已推送·只读</span>';
  return '<div class="ov-plan-card" onclick="toggleTodayPlan()">'
    + '<div class="ov-plan-head"><span class="ov-plan-title">📅 今日计划</span>'
    + '<span class="ov-plan-summary">' + escapeHtml(disp) + '</span>'
    + '<span class="ov-plan-chev">' + chev + '</span></div>'
    + '<div class="ov-plan-detail" style="' + detailStyle + '">' + escapeHtml(full) + note + '</div>'
    + '</div>';
}
function renderTodayPlanCard() { try { updateOverview(true); } catch (e) {} }
function toggleTodayPlan() { todayPlanExpanded = !todayPlanExpanded; renderTodayPlanCard(); }

/* ---------- 定时任务 UI ---------- */
const SCHED_FREQ_LABEL = { once: '仅一次', daily: '每天', weekly: '每周', monthly: '每月' };
/* v3.5.137 任务「开始时间」改为与首页添加弹窗一致的两个数字输入框（时/分） */
function getTaskTimeVal() {
  const hEl = document.getElementById('taskStartHour'), mEl = document.getElementById('taskStartMin');
  const h = Math.max(0, Math.min(23, parseInt((hEl && hEl.value) || '0', 10) || 0));
  const m = Math.max(0, Math.min(59, parseInt((mEl && mEl.value) || '0', 10) || 0));
  if (hEl) hEl.value = _pad2(h);
  if (mEl) mEl.value = _pad2(m);
  return _pad2(h) + ':' + _pad2(m);
}
function setTaskTimeVal(v) {
  const p = String(v || '08:00').split(':');
  const h = Math.max(0, Math.min(23, parseInt(p[0], 10) || 0));
  const m = Math.max(0, Math.min(59, parseInt(p[1], 10) || 0));
  const hEl = document.getElementById('taskStartHour'), mEl = document.getElementById('taskStartMin');
  if (hEl) hEl.value = _pad2(h);
  if (mEl) mEl.value = _pad2(m);
}
// v3.5.137 AI 推荐任务全局只允许一个：已有 AI 任务时，新建弹窗禁用「AI 推荐」选项
function hasOtherAITask(exceptId) {
  return SCHED_TASKS.some(t => t.mode === 'ai' && t.id !== exceptId);
}
function setAIModeDisabled(dis, showTip) {
  const r = document.querySelector('input[name="taskMode"][value="ai"]');
  if (!r) return;
  const lab = r.closest('.cat-tag');
  r.disabled = !!dis;
  if (lab) {
    lab.classList.toggle('disabled', !!dis);
    lab.style.pointerEvents = dis ? 'none' : '';
    lab.title = dis ? '已有 AI 推荐任务，最多只能添加一个' : '';
  }
  if (dis && r.checked) { setRadio('taskMode', 'custom'); onModeChange(); }
  if (dis && showTip) showToast('已有 AI 推荐任务，最多只能添加一个');
}
function renderSchedTasks() {
  const box = document.getElementById('tasksList'); if (!box) return;
  if (!SCHED_TASKS.length) { box.innerHTML = ''; return; }
  let h = '';
  SCHED_TASKS.forEach(t => {
    const editable = isPlanEditable(t);
    // v3.5.136 任务名称（用户可自定，未填则给默认名）
    const nm = (t.name && String(t.name).trim()) ? String(t.name).trim() : (t.mode === 'ai' ? '今日计划' : '定时提醒');
    const icon = t.mode === 'ai' ? '🤖' : '✏️';
    h += '<div class="task-card">'
      + '<div class="task-row">'
      + '<div class="task-info">'
      + '<div class="task-name">' + icon + ' ' + escapeHtml(nm) + '</div>'
      + '<div class="task-sub">' + SCHED_FREQ_LABEL[t.freq] + ' ' + t.startDate + ' ' + t.startTime + ' · ' + (t.mode === 'ai' ? 'AI 推荐计划' : '自定义内容') + (t.enabled ? '' : ' · 已停止') + '</div>'
      + '</div>'
      + '<div class="task-actions">'
      + '<span class="rec-edit" onclick="openTaskEditor(\'' + t.id + '\')" title="编辑"><svg viewBox="0 0 24 24"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg></span>'
      + '<div class="toggle-switch ' + (t.enabled ? 'on' : '') + '" data-tid="' + t.id + '" onclick="toggleTask(\'' + t.id + '\')" title="开启/关闭该任务"></div>'
      + '</div></div>'
      // v3.5.136 开关含义提示（开启后会通过微信推送）
      + '<div class="task-push-hint">' + (t.enabled ? '已开启，到点将推送微信消息' : '开启将会推送微信消息') + '</div>';
    if (t.mode === 'ai') {
      h += '<textarea class="task-plan" id="plan_' + t.id + '" placeholder="AI 推荐计划会在触发前 12 小时自动生成为此，可直接编辑"' + (editable ? '' : ' readonly') + ' onfocus="onPlanFocus(\'' + t.id + '\')" onclick="onPlanFocus(\'' + t.id + '\')" oninput="onPlanInput(\'' + t.id + '\',this.value)">' + escapeHtml(t.content || '') + '</textarea>';
    } else {
      h += '<textarea class="task-plan" id="plan_' + t.id + '" placeholder="输入到点要推送的消息内容" oninput="onPlanInput(\'' + t.id + '\',this.value)">' + escapeHtml(t.content || '') + '</textarea>';
    }
    h += '</div>';
  });
  box.innerHTML = h;
}
function onPlanInput(id, val) {
  const t = SCHED_TASKS.find(x => x.id === id); if (!t) return;
  t.content = val; saveSchedTasks();
}
function onPlanFocus(id) {
  const t = SCHED_TASKS.find(x => x.id === id); if (!t) return;
  if (!isPlanEditable(t)) {
    showToast(planLockMsg(t));
    const el = document.getElementById('plan_' + id); if (el) el.blur();
  }
}
function openTaskEditor(id) {
  document.getElementById('taskEditId').value = id || '';
  if (id) {
    const t = SCHED_TASKS.find(x => x.id === id);
    setRadio('taskFreq', t.freq); setRadio('taskMode', t.mode);
    setTaskStartDateValue(t.startDate);
    setTaskTimeVal(t.startTime);
    document.getElementById('taskName').value = t.name || '';
    document.getElementById('taskCustom').value = t.content || '';
  } else {
    setRadio('taskFreq', 'daily'); setRadio('taskMode', 'ai');
    setTaskStartDateValue(getTodayDateStr());
    setTaskTimeVal('08:00');
    document.getElementById('taskName').value = '';
    document.getElementById('taskCustom').value = '';
  }
  // v3.5.137 AI 推荐任务最多一个：新建时若已存在 AI 任务，禁用该选项并自动切到「自定义」
  setAIModeDisabled(hasOtherAITask(id || ''), !id);
  onFreqChange(); onModeChange();
  showModal('taskEditorModal');
}
function saveTask() {
  const id = document.getElementById('taskEditId').value;
  const freq = document.querySelector('input[name="taskFreq"]:checked').value;
  const startDate = document.getElementById('taskStartDate').value;
  const startTime = getTaskTimeVal();
  const mode = document.querySelector('input[name="taskMode"]:checked').value;
  const nameEl = document.getElementById('taskName');
  const name = nameEl ? nameEl.value.trim() : '';
  if (!startDate) { showToast('请选择开始日期'); return; }
  // v3.5.137 兜底校验：AI 推荐任务只允许存在一个
  if (mode === 'ai' && hasOtherAITask(id || '')) { showToast('已有 AI 推荐任务，最多只能添加一个'); return; }
  if (id) {
    const t = SCHED_TASKS.find(x => x.id === id);
    t.name = name;
    t.freq = freq; t.startDate = startDate; t.startTime = startTime; t.mode = mode;
    if (mode === 'custom') t.content = document.getElementById('taskCustom').value;
  } else {
    SCHED_TASKS.push({ id: 't_' + Date.now(), name: name, freq: freq, startDate: startDate, startTime: startTime, mode: mode,
      content: mode === 'custom' ? document.getElementById('taskCustom').value : '', enabled: true,
      genPeriod: '', pushPeriod: '', genTryTs: 0 });
  }
  saveSchedTasks(); hideModal('taskEditorModal'); renderSchedTasks(); runScheduler(true);
}
function toggleTask(id) {
  const t = SCHED_TASKS.find(x => x.id === id); if (!t) return;
  t.enabled = !t.enabled; saveSchedTasks(); renderSchedTasks();
  showToast(t.enabled ? '已开启，到点将推送微信消息' : '已关闭，不再推送');
  if (t.enabled) runScheduler(true);
}
function syncSeg(radio) {
  const seg = radio.closest('.te-seg'); if (!seg) return;
  seg.querySelectorAll('.cat-tag').forEach(l => l.classList.toggle('active', l.querySelector('input').checked));
}
function setRadio(name, val) {
  const radios = document.querySelectorAll('input[name="' + name + '"]');
  radios.forEach(r => { r.checked = (r.value === val); });
  const seg = radios[0] && radios[0].closest('.te-seg');
  if (seg) seg.querySelectorAll('.cat-tag').forEach(l => l.classList.toggle('active', l.querySelector('input').checked));
}
function onFreqChange() {
  const freq = document.querySelector('input[name="taskFreq"]:checked').value;
  const hint = document.getElementById('taskFreqHint');
  const map = { once: '仅在该日期时刻执行一次', daily: '每天该时刻执行（AI 任务提前 12 小时生成次日计划）', weekly: '每周该日期时刻执行', monthly: '每月该日期时刻执行' };
  if (hint) hint.textContent = map[freq] || '';
}
function onModeChange() {
  const mode = document.querySelector('input[name="taskMode"]:checked').value;
  const f = document.getElementById('taskCustomField');
  if (f) f.style.display = mode === 'custom' ? 'block' : 'none';
}
// v3.5.131 方案A：首次启动把权威育儿资料（崔玉涛体系等）投喂进家庭知识库，标注「权威资料」。
// 仅摘要+注明出处，不整本搬运；一次性（按 kb_auth_seed 版本号），用户删除后不会重复投喂。
const KB_SEED_VER = '1';
const KB_AUTH_SEEDS = [
  '新生儿胃容量很小：第1天约5-7ml(樱桃大小)，第3天约22-27ml(核桃)，1周约45-60ml(鸡蛋)，满月约80-150ml。主张按需喂养，不必严格按时。— 崔玉涛《育儿百科》',
  '喂奶后建议竖抱拍嗝（空心掌由下往上轻拍后背），可减少吐奶与肠胀气；母乳亲喂且宝宝无不适时可不强制拍嗝。',
  '1岁内婴儿睡眠应坚持仰卧（back to sleep），床垫硬实、床上不放枕头/被子/毛绒玩具，可显著降低婴儿猝死综合征(SIDS)风险。— 美国儿科学会/崔玉涛',
  '建立昼夜节律：白天小睡保持室内明亮、声响正常；夜间喂奶调暗灯光、少互动，帮助宝宝区分昼夜。',
  '生理性黄疸多在出生后2-3天出现、2周内消退；若出生24小时内出现、程度过重或退而复现，需就医排查病理性黄疸。',
  '足月儿出生后约15天起每日补充维生素D 400IU（母乳与配方奶均可能不足），促进钙吸收、预防佝偻病，可补至2岁。— 崔玉涛',
  '发热处理：3个月以下体温≥38℃须立即就医；退热优先物理降温（减衣被、温水擦浴），药物首选对乙酰氨基酚(≥2月)或布洛芬(≥6月)，禁用酒精擦浴。— 崔玉涛',
  '辅食一般在满6月龄(约180天)开始，不早于4月、不晚于6月；首推富铁食物(强化铁米粉、肉泥)，每次只加一种、观察3-5天再添新食物。— 崔玉涛/WHO',
  '湿疹护理核心是保湿：每日多次厚涂无刺激润肤霜，洗澡水温不过热、时间宜短；中重度需遵医嘱用弱效激素药膏，不必盲目忌口。— 崔玉涛',
  '肠绞痛多见于2周-4月龄，表现为固定时段长时间剧烈哭闹、难以安抚；可试飞机抱、顺时针揉腹、排气操缓解，通常4-6月自行好转。',
  '疫苗接种：乙肝、卡介苗出生即接种，之后按免疫规划按时进行；发热或急性病期间暂缓，接种后留观30分钟。',
  '大运动大致规律：2月抬头、4月翻身、6月独坐、8月爬行、12月扶站/学走；个体差异大，明显落后或能力倒退应及时评估。',
  '6月龄前纯母乳或配方奶喂养通常不需额外喂水；添加辅食后及炎热出汗多时可少量补水。',
  '建立固定睡前程序（洗澡-抚触-喂奶-放床）有助于宝宝学会自主入睡；新生儿可用包裹、白噪音、轻摇模拟宫内环境安抚。'
];
function seedAuthoritativeKB() {
  try {
    if (localStorage.getItem('kb_auth_seed') === KB_SEED_VER) return;
    let added = 0;
    KB_AUTH_SEEDS.forEach(s => { if (s && !KB.some(x => x.text === s)) { KB.push({ text: s, cat: KB_AUTH_CAT }); added++; } });
    localStorage.setItem('kb_auth_seed', KB_SEED_VER);
    if (added) { saveKBLocal(); if (typeof saveKBCloud === 'function') saveKBCloud().catch(() => {}); renderKb(); updateKbCntLine(); }
  } catch (e) {}
}
const KB_RULES = {
  奶粉喂养:['奶','奶粉','配方','喂养','奶瓶','母乳','乳糖','乳清','冲调','吃奶','喝奶','夜奶','断奶','蛋白','氨基酸'],
  辅食:['辅食','米粉','米糊','蛋黄','果泥','菜泥','面条','粥','添加','固体','手指食物','餐','月龄吃','南瓜','土豆','肉泥'],
  睡眠:['睡','夜醒','哄睡','入睡','作息','午睡','小睡','安睡','分床','熬夜','抱睡','落地醒','睡整觉'],
  早教:['早教','启蒙','玩具','绘本','趴','抬头','翻身','认知','游戏','互动','精细','大运动','发育','练习','追视','坐'],
  穿衣:['穿衣','衣服','连体','哈衣','外套','厚度','洋葱','保暖','换衣','薄','厚','穿法','包被','睡袋'],
  户外:['户外','出门','公园','晒太阳','散步','遛','出行','旅行','阳光','空气','吹风','遛弯'],
  医疗:['医','药','发烧','发热','咳嗽','疫苗','生病','就诊','医生','过敏','疹','护臀','维生素','钙','铁','体温','症状','腹泻','鼻塞']
};
function aiClassifyKb(text) { // 关键词兜底
  let best = '综合', max = 0;
  for (const c of KB_CATS) { let n = 0; for (const k of KB_RULES[c]) if (text.includes(k)) n++; if (n > max) { max = n; best = c; } }
  return best;
}
async function classifyKbLLM(text, cfg) {
  const catList = KB_CATS.concat(['综合']).join('、');
  const sys = '你是婴儿育儿知识库分类助手。用户给一段育儿备注文本，请判断它最贴合哪个分类。\n可选分类（必须严格从中选一个）：' + catList + '。\n只输出 JSON：{"cat":"分类名称"}。若都不贴合则选「综合」。';
  const out = await callChatCompletions(cfg, [{ role: 'system', content: sys }, { role: 'user', content: String(text || '') }]);
  if (out && out.cat && (KB_CATS.includes(out.cat) || out.cat === '综合')) return out.cat;
  return null;
}
async function addKb() {
  const el = document.getElementById('kbInput'); if (!el) return;
  const v = el.value.trim(); if (!v) { el.focus(); return; }
  const cat = aiClassifyKb(v);                 // 先关键词兜底，保证即时有分类
  el.value = '';
  KB.push({ text: v, cat });
  saveKBLocal(); await saveKBCloud(); renderKb(); updateKbCntLine();
  const cfg = getAITagConfig();
  if (cfg) {                                   // 异步用大模型精分（不阻塞）
    classifyKbLLM(v, cfg).then(c => {
      if (!c || c === cat) return;
      const idx = KB.findIndex(x => x.text === v && x.cat === cat);
      if (idx >= 0) { KB[idx].cat = c; saveKBLocal(); saveKBCloud(); renderKb(); updateKbCntLine(); }
    }).catch(() => {});
  }
}
function delKb(i) {
  if (i < 0 || i >= KB.length) return;
  KB.splice(i, 1);
  // 删除后后方条目索引整体前移 1，同步修正展开集合，避免错位；被删条目本身从集合移除
  for (const v of [...kbExpanded]) {
    if (v === i) kbExpanded.delete(v);
    else if (v > i) { kbExpanded.delete(v); kbExpanded.add(v - 1); }
  }
  saveKBLocal(); saveKBCloud(); renderKb(); updateKbCntLine();
}
// v3.5.123 编辑知识库：由浏览器原生 prompt（单行，长文本看不全）改为与首页「编辑记录」同一套弹窗样式，
// 支持多行文本（textarea 自动增高，最长 200px，超出内部滚动）
let _kbEditIdx = -1, _kbEditOrigCat = '';
function editKb(i) {
  if (i < 0 || i >= KB.length) return;
  _kbEditIdx = i; _kbEditOrigCat = KB[i].cat;
  // 分类下拉：可选分类 + 综合；若该条分类不在预设里（历史自定义），临时补进去，避免选择被重置
  const cats = KB_FILTER_CATS.concat();
  if (KB[i].cat && !cats.includes(KB[i].cat)) cats.unshift(KB[i].cat);
  const catRow = document.getElementById('kbEditCatRow');
  if (catRow) {
    catRow.innerHTML = '<label>分类:</label>'
      + '<select id="kbEditCat">'
      + cats.map(c => `<option value="${_escAttr(c)}"${c === KB[i].cat ? ' selected' : ''}>${_escAttr(c)}</option>`).join('')
      + '</select>';
  }
  const ta = document.getElementById('kbEditTa');
  if (ta) ta.value = KB[i].text;
  showModal('kbEditModal');
  // 等弹窗可见后再量高度/聚焦（隐藏态量不出 scrollHeight）
  setTimeout(() => {
    const t2 = document.getElementById('kbEditTa');
    if (t2) { _memoEditAutoGrow(t2); t2.focus(); try { t2.setSelectionRange(t2.value.length, t2.value.length); } catch {} }
  }, 60);
}
function saveKbEdit() {
  const i = _kbEditIdx;
  if (i < 0 || i >= KB.length) { hideModal('kbEditModal'); return; }
  const ta = document.getElementById('kbEditTa');
  const v = ta ? ta.value.trim() : '';
  if (!v) { showToast('内容不能为空'); if (ta) ta.focus(); return; }
  const sel = document.getElementById('kbEditCat');
  const chosen = sel ? sel.value : _kbEditOrigCat;
  KB[i].text = v;
  // 用户主动改了分类 → 尊重用户选择；未改分类 → 沿用原有关键词自动重分类（保持旧行为）
  KB[i].cat = (chosen && chosen !== _kbEditOrigCat) ? chosen : aiClassifyKb(v);
  hideModal('kbEditModal');
  saveKBLocal(); saveKBCloud(); renderKb(); updateKbCntLine();
}
// Ctrl/Cmd+回车 = 保存；Esc = 取消（回车本身用于换行）
function kbEditKey(e) {
  if (e.key === 'Enter' && (e.ctrlKey || e.metaKey) && !e.isComposing) { e.preventDefault(); saveKbEdit(); }
  else if (e.key === 'Escape') { e.preventDefault(); hideModal('kbEditModal'); }
}
// v3.5.125 知识库「改分类」：由原生 prompt 改为与首页添加弹窗同一套分类选择下拉弹窗
function reTagKb(i) {
  if (i < 0 || i >= KB.length) return;
  const items = KB_FILTER_CATS.map(c => ({ id: c, name: c, icon: KB_CAT_ICON[c] || '🏷️' }));
  openCatPicker('选择分类', items, KB[i].cat, (id) => {
    if (!id) return;
    KB[i].cat = id; saveKBLocal(); saveKBCloud(); renderKb();
  });
}
// v3.5.122 知识库条目折叠/展开：编辑/删除/改分类需 stopPropagation，避免误触整条折叠切换
function toggleKbExpand(i) {
  if (kbExpanded.has(i)) kbExpanded.delete(i); else kbExpanded.add(i);
  renderKb();
}
function renderKb() {
  const list = document.getElementById('kbList'); if (!list) return;
  // v3.5.127 知识库筛选：多选分类 + 文本搜索（默认全选+空搜索=显示全部）
  const q = (kbSearchQuery || '').trim().toLowerCase();
  const arr = KB.filter(x => kbSelectedCats.has(x.cat) && (!q || (x.text || '').toLowerCase().includes(q)));
  const cnt = document.getElementById('kbCnt'); if (cnt) cnt.textContent = KB.length;
  if (!arr.length) { list.innerHTML = '<div class="ai-kb-empty">该分类下还没有内容～</div>'; return; }
  list.innerHTML = arr.map(x => {
    const realIdx = KB.indexOf(x);
    const expanded = kbExpanded.has(realIdx);
    return `<div class="ai-kb-item${expanded ? ' expanded' : ' collapsed'}" onclick="toggleKbExpand(${realIdx})"><div class="kb-body">`
      + `<span class="ai-kb-tag" onclick="event.stopPropagation();reTagKb(${realIdx})" title="点此改分类">${escapeHtml(x.cat)}</span>`
      + `<div class="kb-txt">${escapeHtml(x.text)}</div>`
      + `<div class="kb-toggle">${expanded ? '▾ 收起' : '▸ 展开'}</div>`
      + `</div>`
      + `<span class="rec-edit" onclick="event.stopPropagation();editKb(${realIdx})" title="编辑">${MEMO_EDIT_SVG}</span>`
      + `<span class="rec-delete" onclick="event.stopPropagation();delKb(${realIdx})" title="删除">${MEMO_DEL_SVG}</span></div>`;
  }).join('');
}
function updateKbCntLine() { const el = document.getElementById('kbCntLine'); if (el) el.textContent = '知识库 ' + KB.length + ' 条'; }
async function loadKBCloud() {
  if (!isSyncReady()) return false;
  try {
    const key = await getCryptoKey(); if (!key) return false;
    const rows = await supabaseGet(`family_config?family_id=eq.${getFamilyId()}&config_key=eq.${KB_CLOUD_KEY}&select=encrypted_data,iv`);
    if (rows.length > 0 && rows[0].encrypted_data && rows[0].iv) {
      const json = await decrypt(key, rows[0].encrypted_data, rows[0].iv);
      const arr = JSON.parse(json);
      if (Array.isArray(arr) && arr.length) {
        KB = arr; saveKBLocal();
        if (document.getElementById('aiOverlay')) { renderKb(); updateKbCntLine(); }
        return true;
      }
    }
  } catch (e) { console.warn('[KB] 云端加载失败:', e); }
  return false;
}
async function saveKBCloud() {
  if (!isSyncReady()) return;
  try {
    const key = await getCryptoKey(); if (!key) return;
    const { data, iv } = await encrypt(key, JSON.stringify(KB));
    await supabaseUpsert('family_config', { family_id: getFamilyId(), config_key: KB_CLOUD_KEY, encrypted_data: data, iv, last_modified: Date.now() });
  } catch (e) { console.warn('[KB] 云端保存失败:', e); }
}

/* ---------- 对话语音输入（v3.5.114 起并入首页语音链路，见 startVoiceHold('ai') / bindAIVoiceTouch） ---------- */

// 月龄 + 距上次满月的天数（如 4月龄11天）
function getAgeDetail(ds) {
  const [y, m, d] = ds.split('-').map(Number);
  const cur = new Date(y, m - 1, d);
  let months = (y - BIRTH_DATE.getFullYear()) * 12 + (m - 1 - BIRTH_DATE.getMonth());
  if (d < BIRTH_DATE.getDate()) months--;
  months = Math.max(0, months);
  const anniv = new Date(BIRTH_DATE.getFullYear(), BIRTH_DATE.getMonth() + months, BIRTH_DATE.getDate());
  let days = Math.round((cur - anniv) / 86400000);
  if (days < 0) days = 0;
  return { months: months, days: days };
}
// 扫描全部历史日期的 note，按日期倒序返回；标注领域与是否首次出现
function collectMilestones() {
  const allKeys = [];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (/^records_\d{4}-\d{2}-\d{2}$/.test(k)) allKeys.push(k);
  }
  allKeys.sort();                       // 日期升序，首次遇到的即为"最早"
  const firstSeen = {};
  const items = [];
  for (const k of allKeys) {
    const ds = k.slice(8);
    let recs = [];
    try { recs = JSON.parse(localStorage.getItem(k) || '[]'); } catch { continue; }
    if (!Array.isArray(recs)) continue;
    const seenToday = new Set();
    for (const r of recs) {
      const t = (r && r.note) ? String(r.note).trim() : '';
      if (!t || seenToday.has(t)) continue;
      seenToday.add(t);
      if (!(t in firstSeen)) firstSeen[t] = ds;
      items.push({ text: t, date: ds, isFirst: (firstSeen[t] === ds) });
    }
  }
  // 按日期倒序（最新在上），同一天保持原顺序
  items.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
  for (const it of items) {
    it.domain = classifyMilestone(it.text);
    const ad = getAgeDetail(it.date);
    it.ageMonths = ad.months; it.ageDays = ad.days;
  }
  return items;
}
let _milestoneItems = [];
let _milestoneExpanded = false;
const MILESTONE_PREVIEW = 5;

// ============ v3.5.105 里程碑徽章刷新频率控制：每 14 天凌晨 1 点窗口才刷新，其他时间沿用缓存 ============
const MS_BADGE_CACHE_KEY = 'ms_badge_cache';
const MS_BADGE_LAST_KEY = 'ms_badge_last_update';
// 是否到了「刷新徽章」的窗口：距上次刷新 >= 14 天，且当天已过凌晨 1 点（锚定刷新时刻，避免跨日午夜误触发）
function shouldRefreshMilestones(now) {
  now = now || Date.now();
  const last = Number(localStorage.getItem(MS_BADGE_LAST_KEY) || 0);
  if (now - last < 14 * 86400000) return false;   // 未到 14 天
  if (new Date(now).getHours() < 1) return false;  // 当天凌晨 1 点前不触发
  return true;
}
// 把当前里程碑分类结果（含 AI/规则 domain 与 label）缓存到本地，并刷新「上次刷新时间」
function saveMilestoneBadgeCache(items) {
  try {
    const data = (items || []).map(it => ({
      text: it.text, date: it.date, isFirst: it.isFirst,
      ageMonths: it.ageMonths, ageDays: it.ageDays,
      label: it.label || null, domainId: it.domain ? it.domain.id : 'other'
    }));
    localStorage.setItem(MS_BADGE_CACHE_KEY, JSON.stringify({ ts: Date.now(), items: data }));
    localStorage.setItem(MS_BADGE_LAST_KEY, String(Date.now()));
  } catch {}
}
// 读取上次刷新的徽章分类结果；无缓存返回 null（此时回落为当前规则结果）
function loadMilestoneBadgeCache() {
  try {
    const raw = localStorage.getItem(MS_BADGE_CACHE_KEY);
    if (!raw) return null;
    const obj = JSON.parse(raw);
    if (!obj || !Array.isArray(obj.items)) return null;
    return obj.items.map(it => ({
      text: it.text, date: it.date, isFirst: it.isFirst,
      ageMonths: it.ageMonths, ageDays: it.ageDays,
      label: it.label, domain: msDomainById(it.domainId)
    }));
  } catch { return null; }
}

// 徽章行：三大类别各取一条「最新达成的首次」成就，简化描述 + 完整日期；点击看全文
let _msBadgeHits = [];        // 徽章对应的原始条目（供点击展开）
let _msBadgeOpen = -1;        // 当前展开的徽章索引，-1 = 无
function renderMilestoneBadges(items) {
  _msBadgeHits = [];
  _msBadgeOpen = -1;
  let html = '<div class="ms-badges" id="milestoneBadges">';
  MILESTONE_BADGE_GROUPS.forEach((g, idx) => {
    // items 已按日期倒序 → 第一个命中的即为该类别最新达成的首次成就
    const hit = items.find(i => i.isFirst && g.domains.indexOf(i.domain.id) !== -1);
    if (hit) {
      _msBadgeHits[idx] = hit;
      const short = (hit.label && hit.label.trim()) ? hit.label.trim() : simplifyMilestone(hit.text, hit.domain);
      html += `<div class="ms-badge" style="--msbd:${g.color};background:linear-gradient(160deg, ${g.color}2e, ${g.color}0d)" onclick="toggleMilestoneBadge(${idx})">` +
        `<span class="ms-badge-em">${g.icon}</span>` +
        `<div class="ms-badge-nm">${short.replace(/</g, '&lt;')}</div>` +
        `<div class="ms-badge-dt">${hit.date}</div>` +
      `</div>`;
    } else {
      _msBadgeHits[idx] = null;
      html += `<div class="ms-badge empty">` +
        `<span class="ms-badge-em">${g.icon}</span>` +
        `<div class="ms-badge-nm">待解锁</div>` +
        `<div class="ms-badge-dt">${g.label}</div>` +
      `</div>`;
    }
  });
  return html + '</div>';
}
// 点击徽章 → 展开/收起完整描述
function toggleMilestoneBadge(idx) {
  _msBadgeOpen = (_msBadgeOpen === idx) ? -1 : idx;
  const el = document.getElementById('milestoneBadgeDetail');
  if (el) el.innerHTML = renderBadgeDetail();
}
function renderBadgeDetail() {
  const it = _msBadgeHits[_msBadgeOpen];
  if (!it) return '';
  return `<div class="ms-badge-detail" onclick="toggleMilestoneBadge(${_msBadgeOpen})">` +
    `<div class="ms-bd-text">${it.text.replace(/</g, '&lt;')}</div>` +
    `<div class="ms-bd-meta">${it.date} · ${it.domain.icon} ${it.domain.name}` +
      (it.isFirst ? ' · 首次' : '') + ` · ${it.ageMonths}月龄${it.ageDays > 0 ? it.ageDays + '天' : ''}</div>` +
  `</div>`;
}

function renderMilestoneInner() {
  const items = _milestoneItems;
  const shown = _milestoneExpanded ? items : items.slice(0, MILESTONE_PREVIEW);
  // 按日期分组（items 已按日期倒序，同日期天然相邻）→ 同一天只显示一次日期
  const groups = [];
  for (const it of shown) {
    const g = groups[groups.length - 1];
    if (g && g.date === it.date) g.items.push(it);
    else groups.push({ date: it.date, items: [it] });
  }
  let html = '';
  for (const g of groups) {
    const head = g.items[0];
    const ageLabel = `${head.ageMonths}月龄${head.ageDays > 0 ? head.ageDays + '天' : ''}`;
    let cards = '';
    for (const it of g.items) {
      const d = it.domain;
      cards += `<div class="ms-card" style="border-left-color:${d.color}">` +
        `<div class="ms-text">${it.text.replace(/</g, '&lt;')}</div>` +
        `<div class="ms-meta">` +
          `<span class="ms-tag" style="background:${d.color}22;color:${d.color}">${d.icon} ${d.name}</span>` +
          (it.isFirst ? `<span class="ms-first">首次</span>` : '') +
        `</div>` +
      `</div>`;
    }
    html += `<div class="ms-group">` +
      `<div class="ms-date">${g.date} · ${ageLabel}</div>` +
      `<div class="ms-group-items">${cards}</div>` +
    `</div>`;
  }
  if (items.length > MILESTONE_PREVIEW) {
    html += `<div class="ms-more" onclick="toggleMilestoneExpand()">${_milestoneExpanded ? '收起 ▲' : `展开全部 ${items.length} 条 ▼`}</div>`;
  }
  return html;
}
function toggleMilestoneExpand() {
  _milestoneExpanded = !_milestoneExpanded;
  const el = document.getElementById('milestoneTimeline');
  if (el) el.innerHTML = renderMilestoneInner();   // 只重绘时间轴，保持弹窗滚动位置
}
/* ==================== 奶量趋势（双轴折线图，v3.5.59） ====================
 * 横轴：日期（全部已记录数据，非近15天）
 * 左轴：每日总奶量（与近15天柱状图同口径：奶量×1.12 折算水+奶）
 * 右轴：每日单次平均奶量（当日总奶量 ÷ 当日喝奶次数）
 * v3.5.60：两轴均改为非 0 起点的动态区间，让波动看得更清楚（milkAxisRange）
 * v3.5.62：两轴系数分开；v3.5.63 系数微调——总奶量 0.7×最低 ~ 1.05×最高；单次平均 0.95×最低 ~ 1.25×最高
 * ============================================================ */
function collectMilkTrendData() {
  const keys = [];
  // 当天还没过完、奶量没记全，统计进去会拉低曲线 → 只统计今天之前的完整日期
  const _now = new Date();
  const todayKey = `${_now.getFullYear()}-${String(_now.getMonth() + 1).padStart(2, '0')}-${String(_now.getDate()).padStart(2, '0')}`;
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (/^records_\d{4}-\d{2}-\d{2}$/.test(k)) keys.push(k);
  }
  keys.sort();                       // 日期升序
  const out = [];
  for (const k of keys) {
    const ds = k.slice(8);
    if (ds >= todayKey) continue;    // 跳过当天及以后
    let recs = [];
    try { recs = JSON.parse(localStorage.getItem(k) || '[]'); } catch { continue; }
    if (!Array.isArray(recs)) continue;
    let sum = 0, cnt = 0;
    for (const r of recs) {
      if (r && r.type === 'milk') { cnt++; if (r.milkAmount) sum += r.milkAmount; }
    }
    if (cnt === 0 || sum <= 0) continue;
    const total = Math.round(sum * 1.12);        // 与「近15天奶量」柱状图口径一致
    out.push({ ds: ds, t: Date.parse(ds + 'T00:00:00'), total: total, avg: Math.round(total / cnt) });
  }
  return out;
}
// 纵轴区间：最小值 = 最低值 × loF 向下取整，最大值 = 最高值 × hiF 向上取整
// 左轴（总奶量）用 0.7 / 1.05，右轴（单次平均）用 0.95 / 1.25（v3.5.63）
function milkAxisRange(minV, maxV, loF, hiF) {
  const lf = (typeof loF === 'number') ? loF : 0.8;
  const hf = (typeof hiF === 'number') ? hiF : 1.2;
  // ±1e-9 抵消浮点误差（如 800×1.1=880.0000000000001，直接 ceil 会变成 881）
  let lo = Math.floor((Number(minV) || 0) * lf + 1e-9);
  let hi = Math.ceil((Number(maxV) || 0) * hf - 1e-9);
  if (!(hi > lo)) hi = lo + 1;          // 防止区间为 0 导致除零
  return { min: lo, max: hi };
}
function makeMilkTrendChart() {
  const data = collectMilkTrendData();
  // v3.5.93 左侧轴（刻度+总量ml）改为主题色：深色模式白色、浅色模式黑色；总奶量折线仍为蓝色 #7da8e6
  const leftAxisColor = document.body.classList.contains('theme-day') ? '#111111' : '#ffffff';
  // v3.5.91 右侧轴（刻度+文字）改为主题色：深色模式白色、浅色模式黑色
  const rightColor = document.body.classList.contains('theme-day') ? '#111111' : '#ffffff';
  // v3.5.92 右侧折线与数据点单独用橙色（轴文字仍为主题色）
  const rightLineColor = '#ff9f43';
  const legend = `<span style="float:right;font-size:10px;color:#b2bec3;margin-right:4px;">` +
    `<span style="display:inline-block;width:6px;height:6px;border-radius:50%;background:${chartBlue()};margin-right:2px;vertical-align:middle;"></span>总奶量 ` +
    `<span style="display:inline-block;width:6px;height:6px;border-radius:50%;background:${rightLineColor};margin-right:2px;vertical-align:middle;"></span>单次平均</span>`;
  const head = `<div class="chart-card"><div class="chart-title">🍼 奶量趋势（截至昨日）${legend}</div>`;
  const n = data.length;
  if (n === 0) return head + `<div class="chart-empty">暂无奶量数据</div></div>`;

  const W = 360, H = 180, PL = 42, PR = 48, PT = 24, PB = 26;
  const iw = W - PL - PR, ih = H - PT - PB;
  const tMin = data[0].t, tMax = data[n - 1].t;
  const xf = ts => (tMax === tMin) ? (PL + iw / 2) : (PL + (iw * (ts - tMin)) / (tMax - tMin));

  // 左右轴各自独立缩放，共用 5 条等分网格线（0/25/50/75/100% 对应各自 [min,max] 区间）
  // 总奶量：0.7×最低 ~ 1.05×最高；单次平均：0.95×最低 ~ 1.25×最高
  const totals = data.map(d => d.total), avgs = data.map(d => d.avg);
  const rT = milkAxisRange(Math.min(...totals), Math.max(...totals), 0.7, 1.05);
  const rA = milkAxisRange(Math.min(...avgs), Math.max(...avgs), 0.95, 1.25);
  const yT = v => PT + ih - (ih * (v - rT.min)) / (rT.max - rT.min);
  const yA = v => PT + ih - (ih * (v - rA.min)) / (rA.max - rA.min);

  const pcts = [0, 0.25, 0.5, 0.75, 1];
  let grid = '', ylabels = '';
  pcts.forEach(p => {
    const gy = (PT + ih - ih * p).toFixed(1);
    grid += `<line class="gridln" x1="${PL}" y1="${gy}" x2="${W - PR}" y2="${gy}" stroke="rgba(255,255,255,0.08)" stroke-width="1"/>`;
    ylabels += `<text x="${PL - 5}" y="${(parseFloat(gy) + 4).toFixed(1)}" fill="${leftAxisColor}" font-size="9" text-anchor="end">${Math.round(rT.min + (rT.max - rT.min) * p)}</text>`;
    ylabels += `<text x="${W - PR + 5}" y="${(parseFloat(gy) + 4).toFixed(1)}" fill="${rightColor}" font-size="9" text-anchor="start">${Math.round(rA.min + (rA.max - rA.min) * p)}</text>`;
  });
  ylabels += `<text x="${PL - 5}" y="13" fill="${leftAxisColor}" font-size="8.5" font-weight="bold" text-anchor="end">总量ml</text>`;
  ylabels += `<text x="${W - PR + 5}" y="13" fill="${rightColor}" font-size="8.5" font-weight="bold" text-anchor="start">单次ml</text>`;

  // 横轴日期标签：首末 + 抽稀，最多约 7 个
  let xlabels = '';
  const xStep = Math.max(1, Math.ceil(n / 6));
  data.forEach((d, i) => {
    if (i % xStep !== 0 && i !== n - 1) return;
    const [ , mo, dd ] = d.ds.split('-');
    xlabels += `<text x="${xf(d.t).toFixed(1)}" y="${H - 8}" fill="#fff" font-size="9" text-anchor="middle">${parseInt(mo)}/${parseInt(dd)}</text>`;
  });

  const pathT = data.map(d => `${xf(d.t).toFixed(1)} ${yT(d.total).toFixed(1)}`).join(' L');
  const pathA = data.map(d => `${xf(d.t).toFixed(1)} ${yA(d.avg).toFixed(1)}`).join(' L');

  // 数据点 + 点击提示（点数过多时抽稀命中区，避免 HTML 过大）
  // v3.5.67：两条线各用独立 tip，避免点总奶量却弹出单次平均的标注
  const tipIdT = 'mtip' + (++_chartTipSeq);   // 左轴：总奶量
  const tipIdA = 'mtip' + (++_chartTipSeq);   // 右轴：单次平均
  const mkTip = id => `<g id="${id}" style="display:none" pointer-events="none"><rect rx="4" ry="4" height="20" fill="#2ecc71" stroke="rgba(255,255,255,0.45)" stroke-width="0.5"/><text class="tiptext" font-size="11" font-weight="bold" fill="#ffffff" x="6" y="14">?</text></g>`;
  const hitStep = Math.max(1, Math.ceil(n / 40));
  let dots = '';
  data.forEach((d, i) => {
    const px = xf(d.t).toFixed(1);
    const pyT = yT(d.total), pyA = yA(d.avg);
    dots += `<circle cx="${px}" cy="${pyT.toFixed(1)}" r="2" fill="${chartBlue()}" stroke="rgba(0,0,0,0.3)" stroke-width="1"/>`;
    dots += `<circle cx="${px}" cy="${pyA.toFixed(1)}" r="2" fill="${rightLineColor}" stroke="rgba(0,0,0,0.3)" stroke-width="1"/>`;
    if (i % hitStep !== 0 && i !== n - 1) return;
    const [ , mo, dd ] = d.ds.split('-');
    const lb = `${parseInt(mo)}/${parseInt(dd)}`;
    // 命中半径按两条线的垂直间距收缩：间距近时缩小，防止上层的命中区盖住另一条线
    const gap = Math.abs(pyT - pyA);
    const hr = Math.max(4, Math.min(10, gap / 2));
    dots += `<circle class="chart-hit" cx="${px}" cy="${pyT.toFixed(1)}" r="${hr.toFixed(1)}" fill="transparent" data-cx="${px}" data-cy="${pyT.toFixed(1)}" onclick="chartTip(this,'${tipIdT}','${lb}','总 ${d.total}ml')"/>`;
    dots += `<circle class="chart-hit" cx="${px}" cy="${pyA.toFixed(1)}" r="${hr.toFixed(1)}" fill="transparent" data-cx="${px}" data-cy="${pyA.toFixed(1)}" onclick="chartTip(this,'${tipIdA}','${lb}','单次均 ${d.avg}ml')"/>`;
  });
  const tip = mkTip(tipIdT) + mkTip(tipIdA);
  const clipId = 'mclip' + (++_chartTipSeq);

  return head + `<svg class="chart-svg" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">` +
    `<defs><clipPath id="${clipId}"><rect x="${PL}" y="${PT}" width="${iw}" height="${ih}"/></clipPath></defs>` +
    grid + ylabels + xlabels +
    `<g clip-path="url(#${clipId})">` +
      `<path class="dataline" d="M${pathT}" fill="none" stroke="${chartBlue()}" stroke-width="2.2" stroke-linejoin="round" stroke-linecap="round"/>` +
      `<path d="M${pathA}" fill="none" stroke="${rightLineColor}" stroke-width="2.2" stroke-linejoin="round" stroke-linecap="round"/>` +
    `</g>` + dots + tip + `</svg></div>`;
}
// v3.5.105 useCacheBadge=true：徽章沿用上次缓存（非刷新窗口，不重算/不调 AI）；false 或缓存缺失时退化为当前 items（刷新窗口或首次）
function makeMilestoneTimeline(useCacheBadge) {
  const items = collectMilestones();
  _milestoneItems = items;
  const badgeItems = (useCacheBadge ? loadMilestoneBadgeCache() : null) || items;
  const head = `<div class="chart-card"><div class="chart-title">🏆 成长里程碑</div>`;
  if (!items.length) {
    return head + `<div class="chart-empty">还没有成就记录<br><span style="font-size:12px;opacity:.7">记录时写点什么，比如「第一次翻身」</span></div></div>`;
  }
  const firstCount = items.filter(i => i.isFirst).length;
  const nowAge = getAgeDetail(getTodayDateStr());
  const stat = `<div class="ms-stat">当前 ${nowAge.months}月龄${nowAge.days > 0 ? nowAge.days + '天' : ''} · 共 ${items.length} 条 · ${firstCount} 个「第一次」</div>`;
  return head + stat + renderMilestoneBadges(badgeItems) +
    `<div id="milestoneBadgeDetail"></div>` +
    `<div class="ms-timeline" id="milestoneTimeline">${renderMilestoneInner()}</div></div>`;
}
/* ==================== 辅食情况分析（v3.5.78） ==================== */
/* 食物图标映射：与首页辅食活动一致；未预设对应图标的，foodIcon 默认返回 🥣 */
const SOLID_FOOD_ICONS = {
  '高铁米粉':'🍚','不含铁米粉':'🍚','苹果':'🍎','南瓜':'🎃','山药':'🥔','小米':'🌾','红薯':'🍠','玉米':'🌽','紫薯':'🍠','猪肉':'🥩','牛肉':'🥩','羊肉':'🥩','鱼':'🐟','鸡肉':'🍗','虾':'🦐','鸡蛋':'🥚','猪肝':'🍖','胡萝卜':'🥕','梨':'🍐','豆腐':'🧈','花生':'🥜','枣':'🌰','黄豆':'🫘','绿豆':'🫘','红豆':'🫘','油菜':'🥬','白菜':'🥬','西兰花':'🥦','西红柿':'🍅','茄子':'🍆','牛油果':'🥑','芒果':'🥭','猕猴桃':'🥝','莴苣':'🥬','黄瓜':'🥒','核桃':'🌰','冬瓜':'🍈','香菇':'🍄','香蕉':'🍌','西瓜':'🍉'
};
function foodIcon(name) { return SOLID_FOOD_ICONS[name] || '🥣'; }

// 扫描全部历史，收集辅食记录（思路同 collectMilestones）
function collectSolidFoods() {
  const keys = [];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (/^records_\d{4}-\d{2}-\d{2}$/.test(k)) keys.push(k);
  }
  keys.sort();
  const firstFoodDate = {};
  const records = [];
  for (const k of keys) {
    const ds = k.slice(8);
    let recs = [];
    try { recs = JSON.parse(localStorage.getItem(k) || '[]'); } catch { continue; }
    if (!Array.isArray(recs)) continue;
    for (const r of recs) {
      if (r && r.type === 'solidFood' && Array.isArray(r.solidFoods) && r.solidFoods.length) {
        const foods = r.solidFoods.map(f => String(f));
        foods.forEach(f => { if (!(f in firstFoodDate)) firstFoodDate[f] = ds; });
        records.push({ date: ds, foods: foods, amount: r.solidFoodAmount || 0, afterMeal: r.afterMeal || '正常' });
      }
    }
  }
  records.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
  return { records, firstFoodDate };
}

let _sfExpanded = false;
let _sfGroups = [];
let _sfFirstFoodDate = {};
const SF_PREVIEW = 5;

function renderSfTimeline() {
  const groups = _sfGroups;
  const shown = _sfExpanded ? groups : groups.slice(0, SF_PREVIEW);
  let html = '';
  for (const g of shown) {
    const ad = getAgeDetail(g.date);
    const ageLabel = `${ad.months}月龄${ad.days > 0 ? ad.days + '天' : ''}`;
    let cards = '';
    for (const r of g.items) {
      const icon = foodIcon(r.foods[0]);                 // 对应食物图标，无预设默认 🥣
      const fnames = r.foods.map(f => String(f).replace(/</g, '&lt;')).join('、');
      const amt = r.amount > 0 ? ' ' + r.amount + 'g' : '';
      const isFirst = r.foods.some(f => _sfFirstFoodDate[f] === g.date);
      const bad = r.afterMeal === '异常';
      cards += `<div class="ms-card" style="border-left-color:${bad ? '#ff7675' : '#74b9ff'}">` +
        `<div class="ms-text">${icon} ${fnames}${amt}</div>` +
        `<div class="ms-meta">` +
          `<span class="ms-tag" style="background:${bad ? '#ff767522' : '#2ecc7122'};color:${bad ? '#ff7675' : '#2ecc71'}">${r.afterMeal}</span>` +
          (isFirst ? `<span class="ms-first">首次</span>` : '') +
        `</div>` +
      `</div>`;
    }
    html += `<div class="ms-group">` +
      `<div class="ms-date">${g.date} · ${ageLabel}</div>` +
      `<div class="ms-group-items">${cards}</div>` +
    `</div>`;
  }
  if (groups.length > SF_PREVIEW) {
    html += `<div class="ms-more" onclick="toggleSfExpand()">${_sfExpanded ? '收起 ▲' : `展开全部 ${groups.length} 天 ▼`}</div>`;
  }
  return html;
}
function toggleSfExpand() {
  _sfExpanded = !_sfExpanded;
  const el = document.getElementById('sfTimeline');
  if (el) el.innerHTML = renderSfTimeline();
}

function makeSolidFoodAnalysis() {
  const { records, firstFoodDate } = collectSolidFoods();
  _sfFirstFoodDate = firstFoodDate;
  const head = `<div class="chart-card"><div class="chart-title">🥣 辅食情况</div>`;
  if (!records.length) {
    return head + `<div class="chart-empty">还没有辅食记录<br><span style="font-size:12px;opacity:.7">添加辅食后，这里会统计尝试进度与饭后反应</span></div></div>`;
  }
  const totalFoods = Math.max(1, getSolidFoodOptions().length);   // 食物总数（分母）
  const tried = new Set(), abnormal = new Set();
  records.forEach(r => r.foods.forEach(f => { tried.add(f); if (r.afterMeal === '异常') abnormal.add(f); }));
  const triedCount = tried.size;
  const abnormalCount = abnormal.size;
  const normalCount = triedCount - abnormalCount;
  const notTried = Math.max(0, totalFoods - triedCount);
  const nowAge = getAgeDetail(getTodayDateStr());
  const stat = `<div class="ms-stat">当前 ${nowAge.months}月龄${nowAge.days > 0 ? nowAge.days + '天' : ''} · 共尝试 ${triedCount} 种 · 异常 ${abnormalCount} 种</div>`;

  // 环形：异常红 / 正常绿 / 未尝试白
  const C = 2 * Math.PI * 70;
  const segAb = (abnormalCount / totalFoods) * C;
  const segNo = (normalCount / totalFoods) * C;
  const segUn = (notTried / totalFoods) * C;
  const dash = len => `${len.toFixed(2)} ${(C - len).toFixed(2)}`;
  // v3.5.82 无异常时不绘制红色弧（stroke-linecap="round" 在 0 长度时仍会残留一个小红点）
  const abArc = abnormalCount > 0
    ? `<circle cx="100" cy="100" r="70" stroke="#ff7675" stroke-dasharray="${dash(segAb)}" stroke-dashoffset="0" stroke-linecap="round"/>`
    : '';
  const ring = `<div class="sf-ring-wrap">` +
    `<div class="sf-abnormal">` + [...abnormal].map(f => `<span class="sf-ab-chip">${String(f).replace(/</g, '&lt;')}</span>`).join('') + `</div>` +
    `<svg class="sf-donut" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">` +
      `<g transform="rotate(-90 100 100)" fill="none" stroke-width="22">` +
        `<circle class="sf-arc-un" cx="100" cy="100" r="70" stroke-dasharray="${dash(segUn)}" stroke-dashoffset="${(-(segAb + segNo)).toFixed(2)}"/>` +
        `<circle cx="100" cy="100" r="70" stroke="#2ecc71" stroke-dasharray="${dash(segNo)}" stroke-dashoffset="${(-segAb).toFixed(2)}" stroke-linecap="round"/>` +
        abArc +
      `</g>` +
      `<text class="sf-center-num" x="100" y="98" text-anchor="middle">${triedCount}/${totalFoods}</text>` +
      `<text class="sf-center-lab" x="100" y="116" text-anchor="middle">已尝试/总数</text>` +
    `</svg>` +
    `<div class="sf-legend"><span><i class="sf-lg-ab"></i>异常</span><span><i class="sf-lg-no"></i>正常</span><span><i class="sf-lg-un"></i>未尝试</span></div>` +
  `</div>`;

  // 时间轴（与成长里程碑样式一致）
  _sfGroups = [];
  for (const r of records) {
    const g = _sfGroups[_sfGroups.length - 1];
    if (g && g.date === r.date) g.items.push(r);
    else _sfGroups.push({ date: r.date, items: [r] });
  }
  const tl = `<div class="ms-timeline" id="sfTimeline">${renderSfTimeline()}</div>`;

  return head + stat + ring + tl + `</div>`;
}

function openAnalysis() {
  const content = document.getElementById('analysisContent');
  // v3.5.86 保留当前激活标签：同步完成/图表缩放会重新调用 openAnalysis()，若不保留会把标签重置回默认「吃睡」导致窗口跳动
  const _anaModal = document.getElementById('analysisModal');
  const _activeTag = content ? content.querySelector('#analysisTabBar .cat-tag.active') : null;
  const _prevTab = (_anaModal && _anaModal.classList.contains('show') && _activeTag) ? _activeTag.dataset.tab : null;
  // 1) 近15天（含当天）每日数据
  const days = [];
  for (let i = 14; i >= 0; i--) {
    const dt = effectiveNow(); dt.setDate(dt.getDate() - i);
    const ds = `${dt.getFullYear()}-${String(dt.getMonth()+1).padStart(2,'0')}-${String(dt.getDate()).padStart(2,'0')}`;
    days.push({ ds: ds, label: `${dt.getMonth()+1}/${dt.getDate()}` });
  }
  // 奶量（水+奶）= 水量 * 1.12
  const milkData = days.map(d => { const t = dailyMilkTotal(d.ds); return { label: d.label, value: t != null ? Math.round(t * 1.12) : null }; });
  const milkCountData = days.map(d => ({ label: d.label, value: dailyMilkCount(d.ds) }));
  const sleepData = days.map(d => ({ label: d.label, value: dailySleepHours(d.ds) }));
  const poopData = days.map(d => { const info = dailyPoopInfo(d.ds); return { label: d.label, value: info ? info.count : null, statuses: info ? info.statuses : null }; });
  const poopGapPts = collectPoopGapSeries();
  // 2) 体重/身高曲线（相同数值只保留最早日期；横轴按日期间隔等分）
  const hist = getBodyHistory();
  const weightPts = dedupeBodySeries(hist.map(x => ({ d: x.d, v: x.w })));
  const heightPts = dedupeBodySeries(hist.map(x => ({ d: x.d, v: x.h })));
  const toChart = pts => pts.map(p => { const [y, m, dd] = p.d.split('-'); return { label: `${parseInt(m)}/${parseInt(dd)}`, value: p.v, t: Date.parse(p.d) }; });
  let html = '';
  // 月龄标准范围（每天按其所在月龄取 min/max，绿色虚线）
  const milkStdRows = days.map(d => getStdRow(MILK_STD, d.ds));
  const countStdRows = days.map(d => getStdRow(MILK_COUNT_STD, d.ds));
  const sleepStdRows = days.map(d => getStdRow(SLEEP_STD, d.ds));
  // v3.5.88 大便次数图虚线固定为 3，不再按月龄取 POOP_STD（poopStdRows 已移除）
  // ===== 分析弹窗分区标签页（v3.5.81）：吃睡 / 健康 / 成长，样式与首页分类一致 =====
  html += `<div class="category-bar" id="analysisTabBar">` +
    `<div class="cat-tag active" data-tab="feed" onclick="switchAnalysisTab('feed')"><span class="cat-icon">🍼</span><span class="cat-label">吃睡</span></div>` +
    `<div class="cat-tag" data-tab="health" onclick="switchAnalysisTab('health')"><span class="cat-icon">💚</span><span class="cat-label">健康</span></div>` +
    `<div class="cat-tag" data-tab="grow" onclick="switchAnalysisTab('grow')"><span class="cat-icon">🌟</span><span class="cat-label">成长</span></div>` +
    `</div>`;
  // —— 吃睡：奶量趋势 + 奶量及次数(合并) + 辅食情况 + 睡眠时长 ——
  html += `<div class="tab-panel" data-panel="feed">`;
  html += makeMilkTrendChart();   // 奶量趋势（全部记录，双轴：总奶量 + 单次平均）
  html += makeMilkCountComboChart(milkData, milkCountData, milkStdRows); // 奶量及次数（双轴柱状，合并）
  html += makeSolidFoodAnalysis();    // 辅食情况（环形统计 + 时间轴）
  html += makeBarChart(sleepData, { title: '😴 每日睡眠时长（近15天）', unit: 'h', color: '#7da8e6', fmt: v => v.toFixed(1), tickStep: 2, stdLines: [{ values: sleepStdRows.map(r => r.min) }, { values: sleepStdRows.map(r => r.max) }] }); // 睡眠时长（v3.5.81 并入吃睡分类最下方）
  html += `</div>`;
  // —— 健康：大便次数 + 大便与喝奶时间差(双轴) + 体重变化(双轴) ——
  html += `<div class="tab-panel" data-panel="health" style="display:none">`;
  // v3.5.88 大便次数图虚线固定为 3（原按当月龄 POOP_STD.max，5月龄为7）
  html += makeBarChart(poopData, { title: '💩 大便次数（近15天）', unit: '次', color: '#7da8e6', tickStep: 1, tipText: d => `${d.value}次 · ${(d.statuses||[]).join('/')}`, stdLines: [{ values: poopData.map(() => 3) }] });
  // v3.5.87 大便与喝奶时间差变化（截止昨日）：左=间隔分钟(蓝实线带点)，右=乳糖酶量(橘虚线)；去掉干预竖线
  const lactaseGap = poopGapPts.map(p => ({ ds: p.ds, label: p.label, t: p.t, value: getLactaseByDate(p.ds) }));
  html += makeLactaseDualChart(poopGapPts, lactaseGap, {
    title: '💩 大便与喝奶时间差变化（截止昨日）',
    leftLabel: '时间差', leftUnit: '分钟', leftFmt: v => String(Math.round(v)),
    rightLabel: '乳糖酶量', rightUnit: '滴', rightFmt: v => String(v),
    xTickMode: 'keyDates',
    leftTipText: d => (d.count > 1 ? `${d.value}分钟 · ${d.count}次平均` : `${d.value}分钟`),
    rightTipText: d => `${d.value}滴`
  });
  // v3.5.87 体重变化（与上方大便图同横轴，便于上下对照）：左=体重kg(蓝实线带点，刻度同体重趋势)，右=乳糖酶量(橘虚线)
  //         最新日期若体重为空，左线自然断开（不画线）
  // v3.5.95 横轴改为「大便间隔日 ∪ 该范围内的体重记录日」：修掉"没大便那天量的体重在图上消失"的问题
  const weightAxis = buildWeightDualAxis(poopGapPts);
  const weightDualLeft = weightAxis.map(p => ({ ds: p.ds, label: p.label, t: p.t, value: weightRecordedOn(p.ds) }));
  const weightDualRight = weightAxis.map(p => ({ ds: p.ds, label: p.label, t: p.t, value: getLactaseByDate(p.ds) }));
  html += makeLactaseDualChart(weightDualLeft, weightDualRight, {
    title: '⚖️ 体重变化（截止昨日）',
    leftLabel: '体重', leftUnit: 'kg', leftFmt: v => v.toFixed(1),
    leftScaleFactor: { min: 0.9, max: 1.1 },   // v3.5.91 左轴刻度 = 本段最小体重*0.9 ~ 最大体重*1.1
    leftConnectNulls: true,                     // v3.5.90 体重按折线连接各测量点（仅测体重的几天有值，跨空档连线），保留数据点
    rightLabel: '乳糖酶量', rightUnit: '滴', rightFmt: v => String(v),
    xTickMode: 'keyDates',
    leftTipText: d => `${d.value}kg`,
    rightTipText: d => `${d.value}滴`
  });
  html += `</div>`;
  // —— 成长：体重趋势 + 身高趋势 + 成长里程碑 ——
  html += `<div class="tab-panel" data-panel="grow" style="display:none">`;
  html += makeLineChart(toChart(weightPts), { title: '⚖️ 体重趋势', unit: 'kg', color: '#6ec6ff', fmt: v => v.toFixed(1), yMin: 3, yStep: 1, xTickMode: 'keyDates', who: { table: WHO_WEIGHT }, zoomTiers: { min: 3, step: 1 } });
  html += makeLineChart(toChart(heightPts), { title: '📏 身高趋势', unit: 'cm', color: '#6ec6ff', fmt: v => v.toFixed(1), yMin: 48, yStep: 2, xTickMode: 'keyDates', who: { table: WHO_HEIGHT }, zoomTiers: { min: 50, step: 5 } });
  const _msRefresh = shouldRefreshMilestones();
  html += makeMilestoneTimeline(!_msRefresh);   // 成长里程碑时间轴（非刷新窗口徽章用缓存；刷新窗口/首次用当前并稍后调 AI）
  html += `</div>`;
  content.innerHTML = html;
  bindChartTipDismiss();
  // v3.5.86 渲染后恢复到重渲染前激活的标签（首次打开无历史激活则维持默认「吃睡」）
  if (_prevTab && _prevTab !== 'feed') { try { switchAnalysisTab(_prevTab); } catch (e) {} }
  showModal('analysisModal');
  // v3.5.105 仅在「刷新窗口」才调用 AI/规则回写并重算徽章；其他时间沿用缓存（不调 AI、不重算）
  if (_msRefresh) {
    enrichMilestonesWithLLM(_milestoneItems).then(() => saveMilestoneBadgeCache(_milestoneItems));
  }
  // v3.5.82 各分类面板统一高度，切换标签时弹窗不跳动
  requestAnimationFrame(() => equalizeAnalysisPanels());
}

// v3.5.82 分析弹窗：把所有分类面板的最小高度统一为「最高面板」的高度，避免切换标签时弹窗高度/滚动位置跳动
function equalizeAnalysisPanels() {
  const panels = [...document.querySelectorAll('#analysisContent .tab-panel')];
  if (panels.length < 2) return;
  panels.forEach(p => { p.style.minHeight = ''; });
  let max = 0;
  panels.forEach(p => {
    const prev = p.style.display;
    p.style.display = ''; p.style.visibility = 'hidden';
    max = Math.max(max, p.offsetHeight);
    p.style.display = prev; p.style.visibility = '';
  });
  if (max > 0) panels.forEach(p => { p.style.minHeight = max + 'px'; });
}

// v3.5.81 分析弹窗分区标签切换：仅切换 display，所有图表已在上方一次性渲染
function switchAnalysisTab(tab) {
  document.querySelectorAll('#analysisTabBar .cat-tag').forEach(t => t.classList.toggle('active', t.dataset.tab === tab));
  document.querySelectorAll('#analysisContent .tab-panel').forEach(p => { p.style.display = (p.dataset.panel === tab) ? '' : 'none'; });
}

/* ==================== 模态框 ==================== */
/* ---------- v3.5.125 弹窗全屏（备忘录 / 分析 / 历史 / 管理） ---------- */
const MODAL_FS_TARGETS = ['memoModal', 'analysisModal', 'historyModal', 'manageModal'];
// 给目标弹窗标题栏注入「全屏」按钮（关闭按钮左侧）
function initModalFullscreen() {
  MODAL_FS_TARGETS.forEach(id => {
    const ov = document.getElementById(id); if (!ov) return;
    const box = ov.querySelector('.modal-box'); if (!box || box.querySelector('.modal-fs-btn')) return;
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'modal-fs-btn'; b.title = '全屏';
    b.innerHTML = AI_FS_ENTER_SVG;
    b.addEventListener('click', (e) => { e.stopPropagation(); toggleModalFullscreen(id); });
    box.appendChild(b);
  });
}
function toggleModalFullscreen(id) {
  const ov = document.getElementById(id); if (!ov) return;
  const box = ov.querySelector('.modal-box'); if (!box) return;
  const on = box.classList.toggle('modal-fs');
  const b = box.querySelector('.modal-fs-btn');
  if (b) { b.innerHTML = on ? AI_FS_EXIT_SVG : AI_FS_ENTER_SVG; b.title = on ? '退出全屏' : '全屏'; }
}
// 每次打开（或关闭）弹窗都复位为常态，下次进入永远是普通大小
function resetModalFullscreen(el) {
  const box = (el && el.querySelector) ? el.querySelector('.modal-box') : null;
  if (!box || !box.classList.contains('modal-fs')) return;
  box.classList.remove('modal-fs');
  const b = box.querySelector('.modal-fs-btn');
  if (b) { b.innerHTML = AI_FS_ENTER_SVG; b.title = '全屏'; }
}
function showModal(id) {
  const el = document.getElementById(id); if (!el) return;
  resetModalFullscreen(el);
  // v3.5.127 默认全屏：备忘录/分析/历史/管理 打开即撑满整个视口（再点退出按钮回到普通大小）
  if (MODAL_FS_TARGETS.indexOf(id) >= 0) {
    const box = el.querySelector('.modal-box');
    if (box) {
      box.classList.add('modal-fs');
      const b = box.querySelector('.modal-fs-btn');
      if (b) { b.innerHTML = AI_FS_EXIT_SVG; b.title = '退出全屏'; }
    }
  }
  el.classList.add('show'); document.body.style.overflow = 'hidden';
}
function hideModal(id) { const el = document.getElementById(id); if (!el) return; resetModalFullscreen(el); el.classList.remove('show'); document.body.style.overflow = ''; }
function closeModal(e, id) { if (e.target.id === id) hideModal(id); }
function showToast(msg, ms) { const toast = document.getElementById('toast'); toast.textContent = msg; toast.classList.add('show'); setTimeout(() => toast.classList.remove('show'), ms || 1800); }

/* ==================== 云端同步模块 ==================== */

// ---------- 配置 ----------
// Supabase 默认端点 / 家庭码统一在 app-config.js 中维护（不在代码里写死）
const SYNC_CONFIG = { supabaseUrl: _DEFAULT_SUPABASE_URL, supabaseKey: _DEFAULT_SUPABASE_KEY, pollInterval: 5*60*1000, historyDays: 90 };
const PRESET_FAMILY_CODE = _DEFAULT_FAMILY_CODE;
let _cryptoKey = null, _cryptoFamilyCode = null, _isSyncing = false;

function loadSyncConfig() {
  // 预设值优先，localStorage覆盖
  if (!localStorage.getItem('sb_url')) localStorage.setItem('sb_url', SYNC_CONFIG.supabaseUrl);
  if (!localStorage.getItem('sb_key')) localStorage.setItem('sb_key', SYNC_CONFIG.supabaseKey);
  if (!localStorage.getItem('family_code')) localStorage.setItem('family_code', PRESET_FAMILY_CODE);
  SYNC_CONFIG.supabaseUrl = localStorage.getItem('sb_url') || '';
  SYNC_CONFIG.supabaseKey = localStorage.getItem('sb_key') || '';
}
function isSyncReady() {
  return !!(SYNC_CONFIG.supabaseUrl && SYNC_CONFIG.supabaseKey && localStorage.getItem('family_code'));
}
function getFamilyId() { return localStorage.getItem('family_id') || ''; }
function getDeviceName() { return localStorage.getItem('device_name') || '未知设备'; }
function getTodayDateStr() {
  const d = effectiveNow();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

// ---------- 加密模块（Web Crypto API / AES-GCM 端到端加密）----------
function bufToB64(buf) {
  const bytes = new Uint8Array(buf); let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}
function b64ToBuf(b64) {
  const binary = atob(b64); const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer;
}
async function generateFamilyId(familyCode) {
  const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(familyCode));
  return Array.from(new Uint8Array(hash)).slice(0, 8).map(b => b.toString(16).padStart(2,'0')).join('');
}
async function deriveKey(familyCode, saltB64) {
  if (_cryptoKey && _cryptoFamilyCode === familyCode) return _cryptoKey;
  const salt = b64ToBuf(saltB64);
  const baseKey = await crypto.subtle.importKey('raw', new TextEncoder().encode(familyCode), {name:'PBKDF2'}, false, ['deriveKey']);
  const key = await crypto.subtle.deriveKey({name:'PBKDF2', salt, iterations:310000, hash:'SHA-256'}, baseKey, {name:'AES-GCM', length:256}, false, ['encrypt','decrypt']);
  _cryptoKey = key; _cryptoFamilyCode = familyCode; return key;
}
async function encrypt(key, plaintext) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ciphertext = await crypto.subtle.encrypt({name:'AES-GCM', iv}, key, new TextEncoder().encode(plaintext));
  return { data: bufToB64(ciphertext), iv: bufToB64(iv) };
}
async function decrypt(key, dataB64, ivB64) {
  const plaintext = await crypto.subtle.decrypt({name:'AES-GCM', iv: b64ToBuf(ivB64)}, key, b64ToBuf(dataB64));
  return new TextDecoder().decode(plaintext);
}
async function getCryptoKey() {
  const fc = localStorage.getItem('family_code'); if (!fc) return null;
  let salt = localStorage.getItem('family_salt');
  if (!salt) {
    // 本地没有 salt：先查云端是否已有（加入已有家庭），绝不自动生成覆盖
    if (isSyncReady()) {
      try {
        const saltRows = await supabaseGet(`family_config?family_id=eq.${getFamilyId()}&config_key=eq._salt&select=encrypted_data`);
        if (saltRows.length > 0 && saltRows[0].encrypted_data) {
          salt = saltRows[0].encrypted_data;
          localStorage.setItem('family_salt', salt);
          console.log('[Crypto] 已拉取云端 salt，加入现有家庭');
          return await deriveKey(fc, salt);
        }
      } catch (e) {}
    }
    // 云端也没有才新建（首次创建家庭）
    salt = bufToB64(crypto.getRandomValues(new Uint8Array(16)));
    localStorage.setItem('family_salt', salt);
    await uploadSalt(salt);
    console.log('[Crypto] 新建家庭 salt');
  }
  return await deriveKey(fc, salt);
}
async function uploadSalt(saltB64) {
  if (!isSyncReady()) return;
  try { await supabaseUpsert('family_config', { family_id: getFamilyId(), config_key:'_salt', encrypted_data: saltB64, iv:'', last_modified: Date.now() }); } catch {}
}

// ---------- Supabase REST 客户端 ----------
async function supabaseRequest(path, method, body) {
  const url = `${SYNC_CONFIG.supabaseUrl}/rest/v1/${path}`;
  const headers = { 'apikey': SYNC_CONFIG.supabaseKey, 'Authorization': `Bearer ${SYNC_CONFIG.supabaseKey}`, 'Content-Type': 'application/json' };
  if (method === 'POST') headers['Prefer'] = 'resolution=merge-duplicates';
  const res = await fetch(url, { method, headers, body: body ? JSON.stringify(body) : undefined });
  if (!res.ok) throw new Error(`Supabase ${res.status}: ${await res.text()}`);
  if (method === 'GET') return res.json();
  return null;
}
async function supabaseGet(path) { return supabaseRequest(path, 'GET'); }
async function supabaseUpsert(table, row) { return supabaseRequest(table, 'POST', row); }

// ---------- 同步：上传 ----------
async function syncUpload(category, dateStr) {
  if (!isSyncReady()) return;
  if (!navigator.onLine) { enqueueSync(category, dateStr); return; }
  try {
    const key = await getCryptoKey(); if (!key) return;
    // salt 一致性检查与自动修复：防止用错误的 salt 加密上传
    const localSalt = localStorage.getItem('family_salt');
    if (localSalt && isSyncReady()) {
      try {
        const saltRows = await supabaseGet(`family_config?family_id=eq.${getFamilyId()}&config_key=eq._salt&select=encrypted_data`);
        if (saltRows.length > 0 && saltRows[0].encrypted_data && saltRows[0].encrypted_data !== localSalt) {
          // salt 不一致：尝试用本地 salt 解密云端一条数据，验证哪个 salt 正确
          let localSaltValid = false, cloudSaltValid = false;
          try {
            const testRows = await supabaseGet(`family_records?family_id=eq.${getFamilyId()}&record_date=eq.${getTodayDateStr()}&select=encrypted_data,iv`);
            if (testRows.length > 0) {
              // 尝试用本地 salt 解密
              try { await decrypt(key, testRows[0].encrypted_data, testRows[0].iv); localSaltValid = true; } catch {}
              // 尝试用云端 salt 解密（需要临时派生密钥）
              if (!localSaltValid) {
                try {
                  const cloudKey = await deriveKey(localStorage.getItem('family_code'), saltRows[0].encrypted_data);
                  await decrypt(cloudKey, testRows[0].encrypted_data, testRows[0].iv);
                  cloudSaltValid = true;
                } catch {}
              }
            }
          } catch {}
          if (!localSaltValid && !cloudSaltValid) {
            // 两者都无法解密：云端数据已损坏，用本地 salt 覆盖修复
            console.warn('[Sync] 云端 salt 和数据均无法解密，用本地 salt 修复');
            await uploadSalt(localSalt);
            showToast('检测到云端密钥损坏，已自动修复，请重新点击同步');
            return;
          } else if (!localSaltValid && cloudSaltValid) {
            // 云端 salt 能解密，本地不能：拉取云端 salt
            console.warn('[Sync] 本地 salt 错误，拉取云端 salt');
            localStorage.setItem('family_salt', saltRows[0].encrypted_data);
            _cryptoKey = null;
            showToast('已同步云端密钥，请重新操作');
            return;
          } else if (localSaltValid && !cloudSaltValid) {
            // 本地 salt 能解密，云端不能：用本地覆盖云端
            console.warn('[Sync] 云端 salt 错误，用本地 salt 修复');
            await uploadSalt(localSalt);
          }
          // 两者都能解密（理论上不可能，但安全起见继续）
        }
      } catch (e) {}
    }
    const fid = getFamilyId();
    if (category === 'records') {
      // v3.5.79 上传前过滤脏记录，杜绝把无时间戳的非法数据推送到云端
      let records = sanitizeRecords(JSON.parse(localStorage.getItem(`records_${dateStr}`) || '[]'));
      const { data, iv } = await encrypt(key, JSON.stringify(records));
      // last_modified 用本地修改时间戳（若缺失则用当前时间，保证比旧数据新）
      const localTs = getLocalRecordTs(dateStr);
      const modTime = localTs > 0 ? localTs : Date.now();
      await supabaseUpsert('family_records', { family_id: fid, record_date: dateStr, encrypted_data: data, iv, last_modified: modTime, modified_by: getDeviceName() });
      // 上传后把本地时间戳对齐到云端时间，避免下次拉取误判
      if (localTs === 0) localStorage.setItem(`records_${dateStr}_ts`, String(modTime));
      // 同步删除墓碑：让家人设备知道这些记录已删除，避免合并时复活
      try {
        const tombs = [...getTombstones(dateStr)];
        const { data: tdata, iv: tiv } = await encrypt(key, JSON.stringify(tombs));
        await supabaseUpsert('family_config', { family_id: fid, config_key: '_del_' + dateStr, encrypted_data: tdata, iv: tiv, last_modified: Date.now() });
      } catch (e) {}
    } else if (category === 'config') {
      const configKeys = ['hiddenActivities','grossMotorOptions','fineMotorOptions','solidFoodOptions','babyHeight','babyWeight','bodyHistory','milkDefaultAmount'];
      const upTs = Date.now();
      for (const ck of configKeys) {
        const val = localStorage.getItem(ck) || '';
        const { data, iv } = await encrypt(key, val);
        await supabaseUpsert('family_config', { family_id: fid, config_key: ck, encrypted_data: data, iv, last_modified: upTs });
        // v3.5.69 上传成功后对齐本地时间戳，以免下次拉取时把自己刚传的内容判为"云端更新"再覆盖回来
        // v3.5.76 扩展到全部配置键（身高/体重/bodyHistory 也要对齐，否则拉取会用云端旧值覆盖刚输入的数据）
        localStorage.setItem(`cfgts_${ck}`, String(upTs));
      }
    }
    setSyncStatus('synced');
  } catch (e) { console.warn('同步上传失败:', e); setSyncStatus('pending'); enqueueSync(category, dateStr); }
}

// ---------- 同步：拉取 ----------
async function syncOneDay(key, fid, ds) {
  try {
    const rows = await supabaseGet(`family_records?family_id=eq.${fid}&record_date=eq.${ds}&select=encrypted_data,iv,last_modified`);
    let cloudRecs = null, cloudTs = 0;
    if (rows.length > 0) {
      cloudTs = rows[0].last_modified || 0;
      try {
        const plaintext = await decrypt(key, rows[0].encrypted_data, rows[0].iv);
        const parsed = JSON.parse(plaintext);
        if (Array.isArray(parsed)) cloudRecs = parsed;
      } catch (e) { cloudRecs = null; }
    }
    let localRecs = [];
    try { localRecs = sanitizeRecords(JSON.parse(localStorage.getItem(`records_${ds}`) || '[]')); } catch {}
    const tombs = getTombstones(ds);
    // v3.5.79 合并结果再过一道合法性过滤：云端若残留脏记录（旧版本误传），
    // 会在本轮同步中被就地清除（本地 + 云端双向收敛），无需人工介入
    const merged = sanitizeRecords(mergeRecordLists(sanitizeRecords(cloudRecs || []), localRecs, tombs));
    const mergedJson = JSON.stringify(merged);
    const localJson = JSON.stringify(localRecs);
    const cloudJson = cloudRecs === null ? null : JSON.stringify(cloudRecs);
    let dayChanged = false;
    if (mergedJson !== localJson) {
      const oldLocal = localStorage.getItem(`records_${ds}`);
      if (oldLocal) { localStorage.setItem(`records_${ds}_bak`, oldLocal); localStorage.setItem(`records_${ds}_bak_ts`, localStorage.getItem(`records_${ds}_ts`) || '0'); }
      localStorage.setItem(`records_${ds}`, mergedJson);
      dayChanged = true;
    }
    if (cloudJson !== mergedJson) {
      const { data, iv } = await encrypt(key, mergedJson);
      const newTs = Math.max(cloudTs, getLocalRecordTs(ds), Date.now());
      await supabaseUpsert('family_records', { family_id: fid, record_date: ds, encrypted_data: data, iv, last_modified: newTs, modified_by: getDeviceName() });
      localStorage.setItem(`records_${ds}_ts`, String(newTs));
    } else {
      if (cloudTs > 0) localStorage.setItem(`records_${ds}_ts`, String(cloudTs));
    }
    return dayChanged;
  } catch (e) { return false; }
}

// 滚动窗口：返回最近 days 天的日期列表（近期/增量同步用）
function syncRollingDates(days) {
  const today = new Date(); const arr = [];
  for (let i = 0; i < days; i++) {
    const d = new Date(today); d.setDate(d.getDate() - i);
    arr.push(`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`);
  }
  return arr;
}

async function syncPullAll(opts) {
  if (!isSyncReady() || !navigator.onLine || _isSyncing) return;
  _isSyncing = true; setSyncStatus('syncing');
  try {
    const key = await getCryptoKey(); if (!key) { _isSyncing = false; return; }
    const fid = getFamilyId(); let changed = false;
    // 同步天数：启动/手动为全量(historyDays)，前台恢复/轮询只同步最近几天以控制请求量
    const days = (opts && opts.days) || SYNC_CONFIG.historyDays;

    // 0. 预拉「删除墓碑」（v3.5.79）
    // 墓碑原来只在第 2 步（拉取配置）时合并到本地，导致第 1 步合并记录时用的还是旧墓碑：
    // 家人设备上残留的已删除记录（例如误注入的测试数据）会在本轮被并集合并后又回推云端，形成拉锯。
    // 这里提前拉一次墓碑，使云端最新墓碑在"本轮记录合并"时就生效，一次同步即可收敛。
    try {
      const tombRows = await supabaseGet(`family_config?family_id=eq.${fid}&config_key=like._del_*&select=config_key,encrypted_data,iv`);
      for (const row of tombRows) {
        try {
          const dsT = String(row.config_key).slice(5);
          const plainTomb = await decrypt(key, row.encrypted_data, row.iv);
          let arrTomb = []; try { arrTomb = JSON.parse(plainTomb); } catch {}
          if (Array.isArray(arrTomb) && arrTomb.length) addTombstones(dsT, arrTomb);
        } catch (e) {}
      }
    } catch (e) {}

    // 1. 拉取记录（分批并发：每批 6 天；合并/备份/双向收敛语义保持不变）
    // v3.5.116 修复：全量同步(未指定 days)改为直接拉取云端已有的全部日期，不再受 historyDays 窗口限制。
    // 否则清缓存后 8 月等较早历史不会被拉回，表现为"数据丢失"。近期/前台增量同步仍用滚动小窗口。
    let dates;
    if (opts && opts.days) {
      dates = syncRollingDates(days);
    } else {
      try {
        const dr = await supabaseGet(`family_records?family_id=eq.${fid}&select=record_date`);
        const cloudDates = [...new Set((dr || []).map(r => r.record_date).filter(Boolean))];
        dates = cloudDates.length ? cloudDates : syncRollingDates(days);
      } catch (e) { console.warn('[Sync] 拉取云端日期失败，回退滚动窗口:', e); dates = syncRollingDates(days); }
    }
    const BATCH = 6;
    for (let b = 0; b < dates.length; b += BATCH) {
      const batch = dates.slice(b, b + BATCH);
      const rs = await Promise.all(batch.map(ds => syncOneDay(key, fid, ds).catch(e => { console.warn('同步单日失败:', ds, e); return false; })));
      if (rs.some(Boolean)) changed = true;
    }

    // 2. 拉取配置
    try {
      const configRows = await supabaseGet(`family_config?family_id=eq.${fid}&select=config_key,encrypted_data,iv,last_modified`);
      for (const row of configRows) {
        if (row.config_key === '_salt') continue;
        // 删除墓碑：合并到本地（取并集），使其他设备已删除的记录不会在本地复活
        if (row.config_key && row.config_key.indexOf('_del_') === 0) {
          try {
            const dsT = row.config_key.slice(5);
            const plaintext = await decrypt(key, row.encrypted_data, row.iv);
            let arr = []; try { arr = JSON.parse(plaintext); } catch {}
            if (Array.isArray(arr) && arr.length) {
              const before = getTombstones(dsT).size;
              const merged = addTombstones(dsT, arr);
              if (merged.size > before) changed = true;   // 有新墓碑 → 需重渲染
            }
          } catch {}
          continue;
        }
        try {
          const localTs = parseInt(localStorage.getItem(`cfgts_${row.config_key}`) || '0');
          // v3.5.69 自定义选项改为「并集合并」，绝不因时间戳判断失误而整体覆盖、丢掉用户新加的选项。
          // 判定"本地是否独有"用三个信号：本地时间戳较新 / 两分钟内保存过 / 云端原文本里确实没有这些项
          // （第三点专门覆盖长期离线的情况：云端若早已包含，就不该判为本地独有）
          if (CUSTOM_OPT_KEYS.includes(row.config_key)) {
            const plaintext = await decrypt(key, row.encrypted_data, row.iv);
            let cloudArr = [];
            try { const p = JSON.parse(plaintext); if (Array.isArray(p)) cloudArr = p; } catch {}
            let localArr = [];
            try { const p = JSON.parse(localStorage.getItem(row.config_key) || '[]'); if (Array.isArray(p)) localArr = p; } catch {}
            const _fresh = CUSTOM_OPT_DEFS[row.config_key] || [];
            const _delKey = CUSTOM_OPT_DEL_KEYS[row.config_key] || '';
            const _delArr = safeParseArr(localStorage.getItem(_delKey));
            const localOnly = localArr.filter(o => localArr.includes(o) && !cloudArr.includes(o));
            const cloudOnly = cloudArr.filter(o => cloudArr.includes(o) && !localArr.includes(o));
            const _withinWindow = localTs > 0 && (Date.now() - localTs) < 120000;
            const _realLocalOnly = localOnly.filter(o => !_fresh.includes(o));
            const _keepLocal = localTs > row.last_modified || _withinWindow || _realLocalOnly.length > 0;
            let merged;
            if (_keepLocal) merged = Array.from(new Set([...localArr, ...cloudArr]));
            else merged = Array.from(new Set([...cloudArr, ...localArr]));
            // 已删除的出厂项不再补回（尊重用户删除），然后再把没见过的出厂项补齐
            merged = merged.filter(o => !_delArr.includes(o));
            _fresh.forEach(o => { if (!merged.includes(o) && !_delArr.includes(o)) merged.push(o); });
            const before = localStorage.getItem(row.config_key);
            localStorage.setItem(row.config_key, JSON.stringify(merged));
            localStorage.setItem(`cfgts_${row.config_key}`, String(Math.max(localTs, row.last_modified)));
            if (before !== JSON.stringify(merged)) changed = true;
            // 本地独有的项（用户新加的）→ 立即回写云端，保证家人设备与以后任何覆盖都能拿到
            if (_keepLocal && (merged.length > cloudArr.length || merged.join('|') !== cloudArr.join('|'))) {
              try {
                const { data: upData, iv: upIv } = await encrypt(key, JSON.stringify(merged));
                await supabaseUpsert('family_config', { family_id: fid, config_key: row.config_key, encrypted_data: upData, iv: upIv, last_modified: Date.now() });
              } catch (e) {}
            }
            continue;   // 已处理，跳过下面的整体覆盖逻辑
          }
          if (row.last_modified > localTs) {
            const plaintext = await decrypt(key, row.encrypted_data, row.iv);
            localStorage.setItem(row.config_key, plaintext);
            localStorage.setItem(`cfgts_${row.config_key}`, String(row.last_modified));
            changed = true;
          }
        } catch {}
      }
    } catch {}

    // updateOverview(true):同步拉取的数据由对方设备产生，推送责任在产生方，
    // 本设备不应再推送一次（否则"对方记录→本设备同步→本设备再推"造成跨设备重复）
    if (changed) { loadCustomOptions(); loadHiddenActivities(); loadHeight(); loadWeight(); renderCategoryBar(); renderCards(); updateOverview(true);
      // 如果分析弹窗正打开，刷新身高体重曲线
      if (document.getElementById('analysisModal') && document.getElementById('analysisModal').classList.contains('show')) { openAnalysis(); }
    }
    setSyncStatus('synced');
  } catch (e) { console.warn('同步拉取失败:', e); setSyncStatus('pending'); }
  _isSyncing = false;
}
async function syncPullAllAndRefresh() {
  if (!isSyncReady()) { showToast('请先配置同步'); openSyncSettings(); return; }
  showToast('同步中...');
  // 双向：先把本地改动推上去，再拉取合并（旧版只拉不推，本地改动会一直卡在本机）
  try { await syncUpload('records', getTodayDateStr()); } catch (e) {}
  try { await syncUpload('config'); } catch (e) {}
  await syncPullAll();
  showToast('同步完成');
}
// v3.5.6 数据保护：从备份恢复今日数据（恢复最近一次云端拉取覆盖前的本地数据）
async function restoreTodayFromBackup() {
  const ds = getTodayDateStr();
  const bak = localStorage.getItem(`records_${ds}_bak`);
  if (!bak) { showToast('今日暂无备份（备份在每次云端拉取覆盖前自动创建）'); return; }
  let bakRecords;
  try { bakRecords = JSON.parse(bak); if (!Array.isArray(bakRecords)) throw 0; } catch { showToast('备份数据损坏'); return; }
  if (!confirm(`将用备份恢复今日数据（共 ${bakRecords.length} 条）并上传云端覆盖？\n当前本地记录将被替换，请谨慎操作。`)) return;
  localStorage.setItem(`records_${ds}`, bak);
  localStorage.setItem(`records_${ds}_ts`, String(Date.now())); // 本地最新 → 下次同步会把备份数据推上云端
  renderCards(); updateOverview();
  hideModal('manageModal');
  showToast(`已恢复 ${bakRecords.length} 条记录，正在上传云端...`);
  try { await syncUpload('records', ds); showToast('云端已同步更新'); } catch (e) { showToast('云端上传失败，本地已恢复'); }
}

// ---------- 离线队列 ----------
function enqueueSync(category, dateStr) {
  let q = []; try { q = JSON.parse(localStorage.getItem('syncQueue') || '[]'); } catch {}
  const k = category + '_' + (dateStr || '');
  q = q.filter(item => (item.category + '_' + (item.dateStr || '')) !== k);
  q.push({ category, dateStr, ts: Date.now() });
  localStorage.setItem('syncQueue', JSON.stringify(q));
}
async function flushSyncQueue() {
  let q = []; try { q = JSON.parse(localStorage.getItem('syncQueue') || '[]'); } catch {}
  if (q.length === 0) return;
  localStorage.setItem('syncQueue', '[]');
  const deduped = {};
  for (const item of q) { const k = item.category + '_' + (item.dateStr || ''); deduped[k] = item; }
  for (const item of Object.values(deduped)) { try { await syncUpload(item.category, item.dateStr); } catch {} }
}

// ---------- 同步状态 ----------
function setSyncStatus(status) {
  const dot = document.getElementById('syncDot'); const dotM = document.getElementById('syncDotManage');
  const text = document.getElementById('syncStatusText'); const textM = document.getElementById('syncStatusTextManage');
  const fidEl = document.getElementById('syncFamilyId');
  const cfg = { synced: ['on','已同步'], syncing: ['pending','同步中...'], pending: ['pending','待同步'], off: ['off','未配置'] };
  const [cls, label] = cfg[status] || cfg.off;
  [dot, dotM].forEach(d => { if (d) { d.className = 'sync-dot ' + cls; } });
  [text, textM].forEach(t => { if (t) t.textContent = label; });
  if (fidEl) { const fid = getFamilyId(); fidEl.textContent = fid ? `家庭ID: ${fid.slice(0,8)}...（家人用此ID确认同一家庭）` : ''; }
}
function updateSyncUI() {
  if (!isSyncReady()) { setSyncStatus('off'); return; }
  setSyncStatus('synced');
}

// ---------- 家庭码 / 同步设置 UI ----------
function showFamilySetup() { showModal('familySetupModal'); }
// 同步设置：4 框（URL / key / 家庭码 / 设备名）的掩码逻辑（样式同讯飞，焦点清空/失焦回填）
const SYNC_INPUT_IDS = ['sbUrlInput', 'sbKeyInput', 'familyCodeInput', 'deviceNameInput'];
function openSyncSettings() {
  // 全部以掩码形式回填；本地有值或默认配置存在时显示掩码，焦点清空
  const hasUrl = !!(localStorage.getItem('sb_url') || (_APP.supabase && _APP.supabase.url));
  const hasKey = !!(localStorage.getItem('sb_key') || (_APP.supabase && _APP.supabase.anonKey));
  const hasFcode = !!(localStorage.getItem('family_code') || _APP.familyCode);
  const dname = localStorage.getItem('device_name') || '';
  document.getElementById('sbUrlInput').value = hasUrl ? XF_MASK : '';
  document.getElementById('sbKeyInput').value = hasKey ? XF_MASK : '';
  document.getElementById('familyCodeInput').value = hasFcode ? XF_MASK : '';
  document.getElementById('deviceNameInput').value = dname; // 设备名非敏感，原样显示
  // 同步设置框默认密码类型，点"显示明文"切换
  const see = document.getElementById('syncSeeToggle'); if (see) see.checked = false;
  ['sbUrlInput', 'sbKeyInput', 'familyCodeInput'].forEach(id => { const el = document.getElementById(id); if (el) el.type = 'password'; });
  bindSyncMaskEvents();
  updateSyncUI(); showModal('syncModal');
}
function bindSyncMaskEvents() {
  ['sbUrlInput', 'sbKeyInput', 'familyCodeInput'].forEach(id => {
    const el = document.getElementById(id);
    if (!el || el._maskBound) return; el._maskBound = true;
    el.addEventListener('focus', function() { if (this.value === XF_MASK) this.value = ''; });
    el.addEventListener('blur', function() {
      // 留空 → 恢复掩码（未修改）
      if (!this.value.trim()) {
        const orig = id === 'sbUrlInput' ? (localStorage.getItem('sb_url') || (_APP.supabase && _APP.supabase.url))
                    : id === 'sbKeyInput' ? (localStorage.getItem('sb_key') || (_APP.supabase && _APP.supabase.anonKey))
                    : (localStorage.getItem('family_code') || _APP.familyCode);
        this.value = orig ? XF_MASK : '';
      }
    });
  });
}
function toggleSyncSee() {
  const show = document.getElementById('syncSeeToggle').checked;
  ['sbUrlInput', 'sbKeyInput', 'familyCodeInput'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.type = show ? 'text' : 'password';
  });
}
async function saveSyncConfig() {
  // 掩码视为"未修改"——回退到 localStorage 或 app-config 默认值
  const getRaw = (id, fallback) => {
    const v = document.getElementById(id).value.trim();
    if (!v || v === XF_MASK) return fallback;
    return v;
  };
  const url = getRaw('sbUrlInput', localStorage.getItem('sb_url') || (_APP.supabase && _APP.supabase.url) || '').replace(/\/+$/, '');
  const skey = getRaw('sbKeyInput', localStorage.getItem('sb_key') || (_APP.supabase && _APP.supabase.anonKey) || '');
  const fcode = getRaw('familyCodeInput', localStorage.getItem('family_code') || _APP.familyCode || '');
  const dname = document.getElementById('deviceNameInput').value.trim() || '未知设备';
  if (!url || !skey || !fcode) { showToast('请填写 URL、key 和家庭码'); return; }
  if (fcode.length < 4) { showToast('家庭码至少4位'); return; }
  showToast('配置中...');
  localStorage.setItem('sb_url', url); localStorage.setItem('sb_key', skey);
  localStorage.setItem('family_code', fcode); localStorage.setItem('device_name', dname);
  loadSyncConfig();
  const fid = await generateFamilyId(fcode); localStorage.setItem('family_id', fid);
  _cryptoKey = null; // 清缓存重新派生
  try {
    // 尝试拉取 salt（加入已有家庭）；拉不到则新建（创建新家庭）
    const saltRows = await supabaseGet(`family_config?family_id=eq.${fid}&config_key=eq._salt&select=encrypted_data`);
    if (saltRows.length > 0 && saltRows[0].encrypted_data) {
      localStorage.setItem('family_salt', saltRows[0].encrypted_data);
      showToast('已加入家庭，拉取数据中...');
    } else {
      const newSalt = bufToB64(crypto.getRandomValues(new Uint8Array(16)));
      localStorage.setItem('family_salt', newSalt);
      await uploadSalt(newSalt);
      showToast('已创建新家庭');
    }
    await syncPullAll();
    updateSyncUI();
  } catch (e) {
    console.warn('配置验证失败:', e);
    showToast('连接失败，请检查 URL 和 key');
    return;
  }
  hideModal('syncModal'); showToast('同步已开启');
}
async function uploadAllLocalData() {
  if (!isSyncReady()) { showToast('请先保存配置'); return; }
  showToast('上传中...');
  try {
    // 上传所有本地记录（跳过 records_<日期>_ts 时间戳键）
    const keys = [];
    for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (k.startsWith('records_') && !k.endsWith('_ts')) keys.push(k); }
    const key = await getCryptoKey(); const fid = getFamilyId();
    for (const k of keys) {
      const ds = k.replace('records_', '');
      let records = JSON.parse(localStorage.getItem(k) || '[]');
      if (!Array.isArray(records)) records = [];
      const { data, iv } = await encrypt(key, JSON.stringify(records));
      const localTs = getLocalRecordTs(ds);
      const modTime = localTs > 0 ? localTs : Date.now();
      await supabaseUpsert('family_records', { family_id: fid, record_date: ds, encrypted_data: data, iv, last_modified: modTime, modified_by: getDeviceName() });
      if (localTs === 0) localStorage.setItem(`records_${ds}_ts`, String(modTime));
    }
    await syncUpload('config');
    showToast(`已上传 ${keys.length} 天记录`);
  } catch (e) { showToast('上传失败: ' + e.message); }
}

// ---------- PWA：动态注入 manifest ----------
function setupPWA() {
  try {
    const iconUri = 'assets/pwa-icon-192.webp';
    const _dayBg = document.body.classList.contains('theme-day') ? '#f5f8fd' : '#0a0f1e'; // v3.5.21 manifest 颜色随实际主题（含手动切换）
    const manifest = { name:'小咕噜的日常', short_name:'小咕噜', start_url:'./index.html', scope:'.', display:'standalone', background_color:_dayBg, theme_color:_dayBg, icons:[{src:iconUri, sizes:'192x192', type:'image/png'},{src:iconUri, sizes:'512x512', type:'image/png'}] };
    const blob = new Blob([JSON.stringify(manifest)], {type:'application/manifest+json'});
    const manifestUrl = URL.createObjectURL(blob);
    const link = document.createElement('link'); link.rel = 'manifest'; link.href = manifestUrl;
    document.head.appendChild(link);
  } catch {}
  // 监听 PWA 安装事件，提供页面内安装引导
  window.addEventListener('beforeinstallprompt', e => {
    e.preventDefault();
    window.deferredInstallPrompt = e;
    showInstallPrompt();
  });
}
function showInstallPrompt() {
  // 已作为 PWA 运行（主屏幕/桌面快捷方式），不显示安装横幅
  if (window.matchMedia('(display-mode: standalone)').matches || navigator.standalone === true) return;
  // 用户之前手动关闭过安装横幅，尊重用户选择
  if (localStorage.getItem('pwa_install_dismissed') === 'yes') return;
  if (document.getElementById('pwaInstallBar')) return;
  const bar = document.createElement('div');
  bar.id = 'pwaInstallBar';
  bar.style.cssText = 'position:fixed;top:0;left:0;width:100%;z-index:200;background:#1a1f2e;border-bottom:1px solid rgba(255,255,255,0.1);padding:10px 14px;display:flex;align-items:center;justify-content:space-between;gap:10px;font-size:14px;color:#fff;';
  bar.innerHTML = '<span>📲 安装到主屏幕，像 App 一样使用</span><div style="display:flex;align-items:center;gap:8px;"><button id="pwaInstallBtn" style="padding:6px 14px;border-radius:16px;border:none;background:#667eea;color:#fff;font-size:13px;font-weight:600;cursor:pointer;">安装</button><button id="pwaDismissBtn" style="padding:4px 8px;border-radius:12px;border:none;background:transparent;color:#b2bec3;font-size:18px;line-height:1;cursor:pointer;" title="不再提示">×</button></div>';
  document.body.appendChild(bar);
  document.getElementById('pwaInstallBtn').addEventListener('click', async () => {
    const prompt = window.deferredInstallPrompt;
    if (!prompt) return;
    prompt.prompt();
    const { outcome } = await prompt.userChoice;
    if (outcome === 'accepted') { window.deferredInstallPrompt = null; bar.remove(); }
  });
  document.getElementById('pwaDismissBtn').addEventListener('click', () => {
    localStorage.setItem('pwa_install_dismissed', 'yes');
    bar.remove();
  });
}
// 如果已作为 PWA 运行，隐藏浏览器 UI 提示
window.addEventListener('appinstalled', () => { const bar = document.getElementById('pwaInstallBar'); if (bar) bar.remove(); window.deferredInstallPrompt = null; });

// ---------- 同步初始化 ----------
async function initSync() {
  loadSyncConfig();
  setupSyncListeners();
  // 有预设配置则自动生成family_id并开始同步，不弹引导
  if (isSyncReady()) {
    const fc = localStorage.getItem('family_code');
    if (fc && !localStorage.getItem('family_id')) {
      const fid = await generateFamilyId(fc);
      localStorage.setItem('family_id', fid);
    }
    // 如果没有 salt，尝试从云端拉取（加入已有家庭）；拉不到再生成（创建新家庭）
    if (!localStorage.getItem('family_salt')) {
      const fid = getFamilyId();
      try {
        const saltRows = await supabaseGet(`family_config?family_id=eq.${fid}&config_key=eq._salt&select=encrypted_data`);
        if (saltRows.length > 0 && saltRows[0].encrypted_data) {
          localStorage.setItem('family_salt', saltRows[0].encrypted_data);
        } else {
          const newSalt = bufToB64(crypto.getRandomValues(new Uint8Array(16)));
          localStorage.setItem('family_salt', newSalt);
          await uploadSalt(newSalt);
        }
      } catch (e) { console.warn('salt同步失败:', e); }
    }
    updateSyncUI();
    // v3.5.102 启动即加载家庭云端默认 AI 密钥（加密同步），供 LLM 归类使用
    try { await loadCloudAITagKey(); } catch (e) { console.warn('[AI] 启动加载云端密钥失败:', e); }
    // v3.5.10 启动自动双向同步：复用 syncPullAll 内置的冲突判定与 v3.5.6 备份保护
    // - cloudTs > localTs：拉取云端覆盖本地（覆盖前自动备份 records_<ds>_bak）
    // - localTs > cloudTs：本地有未上传修改 → 自动反推云端（满足"家人打开即看到更新"+"本地修改自动同步"）
    // - 相等或无云端记录：不动，保留本地
    // 安全前提：syncPullAll 内部已有备份+冲突判定，此调用不绕过任何防护
    // 启动：近 3 天优先（首屏数据秒级到位），4 秒后后台静默补全全量 30 天（不阻塞首屏）
    try { await syncPullAll({ days: 3 }); } catch (e) { console.warn('启动同步(近3天)失败:', e); }
    try { setTimeout(() => { syncPullAll().catch(e => console.warn('后台补全同步失败:', e)); }, 4000); } catch (e) {}
    return;
  }
  showFamilySetup();
}
function setupSyncListeners() {
  // v3.5.55：重新启用前台恢复/网络恢复/轮询同步。
  // 原实现只在页面首次加载时同步一次，PWA 从后台切回前台不会重新同步，
  // 导致家人"打开小程序"其实没触发任何同步，看不到别人的新记录。
  // 为控制请求量，这些增量同步只处理最近 3 天（启动与手动"立即同步"仍为全量 30 天）。
  const quick = { days: 3 };
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden && isSyncReady() && navigator.onLine) { flushSyncQueue(); syncPullAll(quick); }
  });
  window.addEventListener('online', () => {
    if (isSyncReady()) { flushSyncQueue(); syncPullAll(quick); }
  });
  setInterval(() => {
    if (isSyncReady() && navigator.onLine && !document.hidden) syncPullAll(quick);
  }, SYNC_CONFIG.pollInterval);
}

// ===== 全局兜底：未捕获 JS 错误 toast 提示（便于真机定位问题） =====
window.addEventListener('error', (e) => {
  try { showToast('脚本异常: ' + (e.message || 'unknown').slice(0, 60)); } catch (_) {}
});
window.addEventListener('unhandledrejection', (e) => {
  try { showToast('异步异常: ' + String(e.reason && e.reason.message || e.reason || '').slice(0, 60)); } catch (_) {}
});

// ===== fabBtn 事件绑定：复用 enableFastTap（与底部导航一致）=====
// 触摸端：touchstart/end 触发，touchend 时 preventDefault 抑制合成 click，只开一次
// 桌面端：仍走 onclick（mouse 无合成 click 落在遮罩上的问题）
// 注意：移除原 ontouchstart 内联 —— 它在按下即开弹窗，松手时合成 click 会落在刚弹出的
//       遮罩上触发 closeModal，导致"点一次点不开"（弹窗开即被关）。
setTimeout(() => {
  const fab = document.getElementById('fabBtn');
  if (fab && !fab.dataset.fastTapBound) {
    fab.dataset.fastTapBound = '1';
    enableFastTap(fab, openAddModal);
  }
  // 版本号显示：管理弹窗最上方（标题下方小字）
  const verTag = document.getElementById('appVersionTag');
  if (verTag) verTag.textContent = APP_VERSION;
}, 0);

init();
