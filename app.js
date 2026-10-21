
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
const DEFAULT_PHOTO_DATA_SQ = 'assets/photo-data-sq.webp';   // v3.6.36 深色头像方形裁切版（锁屏/通知媒体信息 artwork 用，406x406）

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
  { id: 'learnLogic', name: '学算术', icon: '🧩', type: 'note', category: 'learn' },
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
  // v3.6.36 播放中切换主题：锁屏/通知媒体信息的头像 artwork 跟随主题刷新（深色用深色头像）
  if (eeCurrentId && 'mediaSession' in navigator) {
    const _cur = EARLY_EDU.find(x => x.id === eeCurrentId);
    if (_cur) eeSetMediaMetadata(_cur);
  }
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
  loadMsOverrideCloud().catch(() => {}); // v3.6.0 里程碑类型/首次覆盖 启动即从家庭云恢复
  loadHousekeeperCloud().catch(() => {}); // v3.6.0 育儿嫂休假 / v3.6.45 家政考勤 启动即从家庭云恢复
  loadAchLikesLocal();
  loadAchLikesCloud().then(() => refreshAchLikeUI()).catch(() => {}); // v3.6.7 成就点赞启动即从家庭云恢复
  setInterval(() => { if (!document.hidden) loadAchLikesCloud().then(() => refreshAchLikeUI()).catch(() => {}); }, 30000); // 家人点赞后本机及时可见
  loadEarlyEdu().then(() => { renderEarlyEduCard(); }).catch(() => {}); // v3.5.157 早教音频
  eeSetupMediaSession(); // v3.5.157 锁屏播放/停止
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
// v3.6.44 需求④：新的一天清空首页身高/体重输入（仅回填当天已记录的数值）；
// 之前日期的记录保留在 bodyHistory（曲线/历史/知识库引用不受影响），babyHeight/babyWeight
// 保留为「最新录入值」供 AI 上下文引用，输入为空时不写空、不同步
function loadHeight() {
  const el = document.getElementById('heightInput'); if (!el) return;
  if (document.activeElement === el) return;
  const rec = getBodyHistory().find(x => x.d === getTodayDateStr());
  el.value = (rec && rec.h != null) ? rec.h : '';
}
function saveHeight() {
  const el = document.getElementById('heightInput'); if (!el) return;
  const raw = String(el.value == null ? '' : el.value).trim();
  const prev = localStorage.getItem('babyHeight') || '';
  const v = parseFloat(raw);
  if (v > 0) {
    if (raw !== prev) { localStorage.setItem('babyHeight', raw); bumpConfigTs('babyHeight'); }
    recordBodyMeasurement('h', v);          // 幂等：无变化时不重复写盘/上传
  }
  // 输入为空（如新的一天尚未测量）：保留 babyHeight 作为最新录入值，不写空、不触发同步
}
function loadWeight() {
  const el = document.getElementById('weightInput'); if (!el) return;
  if (document.activeElement === el) return;
  const rec = getBodyHistory().find(x => x.d === getTodayDateStr());
  el.value = (rec && rec.w != null) ? rec.w : '';
}
function saveWeight() {
  const el = document.getElementById('weightInput'); if (!el) return;
  const raw = String(el.value == null ? '' : el.value).trim();
  const prev = localStorage.getItem('babyWeight') || '';
  const v = parseFloat(raw);
  if (v > 0) {
    if (raw !== prev) { localStorage.setItem('babyWeight', raw); bumpConfigTs('babyWeight'); }
    recordBodyMeasurement('w', v);          // 幂等：无变化时不重复写盘/上传
  }
  // 输入为空（如新的一天尚未测量）：保留 babyWeight 作为最新录入值，不写空、不触发同步
}
// v3.6.44 需求④：跨天（业务日 1 点翻页）自动清空首页身高/体重输入
// ——loadHeight/loadWeight 有「焦点保护」（正在输入时不动），定时巡检只在日期真正变化时触发一次
setInterval(() => {
  try {
    const ds = getTodayDateStr();
    if (window.__hwDay !== ds) {
      window.__hwDay = ds;
      loadHeight(); loadWeight();
    }
  } catch (e) {}
}, 60000);
document.addEventListener('visibilitychange', function () { if (document.visibilityState === 'hidden') flushBodySaves(); });
window.addEventListener('pagehide', flushBodySaves);
window.addEventListener('beforeunload', flushBodySaves);

// 业务"今天"的判定：每日重置时间为凌晨 1:00（0:00-0:59 期间仍算昨天）
function effectiveNow() {
  const d = new Date();
  if (d.getHours() === 0) return new Date(d.getTime() - 3600000); // 0点档视为前一天 23:xx
  return d;
}
// v3.6.5 今日计划的"今天"用真实日历日（0 点整翻页），与业务日期 effectiveNow（1 点翻页）刻意区分：
// 喂养等记录仍按业务日（0:00-0:59 归前一天，方便家长记完夜奶再睡），
// 但 AI 今日计划按用户要求「每天 0 点生成当天计划、推送后只读」，必须 0 点就翻页，
// 否则 0:00-0:59 之间会出现「新计划不生成、旧计划被当成今天已推送而锁死」的问题（服务端 sched-push.mjs 一直用真实日历日，前后端口径此前不一致）。
function planTodayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
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

// ---- v3.5.148 定时任务推送的跨设备去重（独立 key，避免与成就推送互相覆盖）----
const PUSH_SCHED_DEDUP_KEY = '_schedpushdedup';
async function _cloudSchedDup(sig) {
  try {
    if (typeof isSyncReady !== 'function' || !isSyncReady()) return false;
    const fid = getFamilyId();
    if (!fid) return false;
    const rows = await supabaseGet(`family_config?family_id=eq.${fid}&config_key=eq.${PUSH_SCHED_DEDUP_KEY}&select=encrypted_data`);
    if (!Array.isArray(rows) || rows.length === 0) return false;
    let rec = null;
    try { rec = JSON.parse(rows[0].encrypted_data || 'null'); } catch (e) { return false; }
    if (!rec || rec.sig !== sig) return false;
    if (Date.now() - (rec.ts || 0) > PUSH_DEDUP_MAX_AGE) return false;
    return true;
  } catch (e) { return false; }
}
async function _cloudSchedMark(sig) {
  try {
    if (typeof isSyncReady !== 'function' || !isSyncReady()) return;
    const fid = getFamilyId();
    if (!fid) return;
    await supabaseUpsert('family_config', {
      family_id: fid, config_key: PUSH_SCHED_DEDUP_KEY,
      encrypted_data: JSON.stringify({ sig: sig, ts: Date.now(), dev: getDeviceName() }),
      iv: '', last_modified: Date.now()
    });
  } catch (e) { console.warn('[推送] 定时任务云端去重标记失败:', e); }
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

      // v3.6.12 通知标题 = 本次更新的内容本身（去掉「新增N条：」前缀）
      const displayTitle = newAchievements.join(' · ');

      // v3.6.12 详情：点开后呈现「今日成就」的全部内容，其中本次新增的条目高亮
      const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
      const newSet = new Set(newAchievements);
      const items = achArr.map(a => {
        const inner = newSet.has(a)
          ? `<span style="background:#ffecb3;color:#c0392b;font-weight:bold;padding:1px 4px;border-radius:3px;">${esc(a)}</span>`
          : esc(a);
        return `<p style="margin:3px 0;">${inner}</p>`;
      }).join('');
      // 当天统计（v3.5.79 统一走 getRecordsByDate 过滤脏记录）
      const recs = getRecordsByDate(ds);
      let poopCount = 0, outdoorMin = 0, sleepMin = 0;
      recs.forEach(r => {
        if (r.type === 'poop') poopCount++;
        else if (r.type === 'outdoor' && r.duration) outdoorMin += r.duration;
        else if (r.type === 'sleep' && r.duration) sleepMin += r.duration;
      });
      const fmtDur = min => { min = Math.round(min); const h = Math.floor(min / 60), m = min % 60; if (h > 0 && m > 0) return `${h}小时${m}分钟`; return h > 0 ? `${h}小时` : `${m}分钟`; };
      const content = `<h3>小咕噜的今日成就 ${ds}</h3>` +
        `<p><b>🏆 今日成就（加亮为本次新增）：</b></p>` + items +
        `<p><b>💧 水+奶量:</b> ${Math.round(totalMilk * 1.12)} ml</p>` +
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

/* v3.6.24 上一次睡眠记录（跨天查找最近的 sleep 记录，逻辑同 getLastMilkRecord：按开始时间取最晚） */
function getLastSleepRecord() {
  const today = new Date();
  for (let d = 0; d <= 7; d++) {
    const dt = new Date(today);
    dt.setDate(dt.getDate() - d);
    const ds = `${dt.getFullYear()}-${String(dt.getMonth()+1).padStart(2,'0')}-${String(dt.getDate()).padStart(2,'0')}`;
    const recs = getRecordsByDate(ds);   // v3.5.79 过滤脏记录
    let best = null, bestMin = -1;
    for (const r of recs) {
      if (r.type === 'sleep' && (r.sleepStartTime || r.recTime)) {
        const [hh, mm] = (r.sleepStartTime || r.recTime || '00:00').split(':').map(Number);
        const minutes = hh * 60 + mm;
        if (minutes > bestMin) { bestMin = minutes; best = r; }
      }
    }
    if (best) return { rec: best, ds };
  }
  return null;
}
/* v3.6.24 预估下一次睡觉：起床时间（开始+时长）+ 2 小时清醒间隔；
 * 跨夜记录的开始时间以记录所述日期为基准，若开始晚于记录时间则回退一天（如 0:30 补录的 20:00 入睡） */
function getNextSleepInfo() {
  const found = getLastSleepRecord();
  if (!found) return null;
  const { rec, ds } = found;
  const [sh, sm] = (rec.sleepStartTime || rec.recTime || '00:00').split(':').map(Number);
  const durMin = Math.max(0, Math.round(rec.duration || 0));
  const [yy, mo, dd] = ds.split('-').map(Number);
  const start = new Date(yy, mo - 1, dd, sh, sm, 0, 0);
  const recTs = rec.timestamp || rec.updatedAt || 0;
  if (recTs && start.getTime() > recTs + 30 * 60000) start.setDate(start.getDate() - 1);
  const wake = new Date(start.getTime() + durMin * 60000);
  const next = new Date(wake.getTime() + 2 * 3600000);   // 醒来后再玩 2 小时
  return { rec, start, wake, next, durMin };
}
/* v3.6.25 当天总睡眠时长：今日所有 sleep 记录的 duration 求和（夜觉 + 午睡等多次小睡累计）；
 * 当天无睡眠记录返回 null（调用方显示「暂无记录」）。
 * 注意区分：「下一次睡觉」预估仍基于上一次睡眠记录（getNextSleepInfo），此处只统计当天总量 */
function getTodaySleepTotal() {
  let total = 0, has = false;
  getTodayRecords().forEach(r => {
    if (r.type === 'sleep' && r.duration) { total += Math.max(0, Math.round(r.duration)); has = true; }
  });
  return has ? total : null;
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
  html += `<div class="overview-item ov-unit-item"><span class="ov-label">水+奶量:</span><span class="ov-value ov-num">${Math.round(totalMilk * 1.12)}</span><span class="ov-value ov-unit">ml</span></div>`;
  html += '</div>';

  // v3.6.24 下一次睡觉行：5-19 点按「上次睡眠开始+时长+2h」预估；19-凌晨5点显示「-」；右侧为上次睡眠时长（如 13.5 h）
  const sleepInfo = getNextSleepInfo();
  const nowH = new Date().getHours();
  const dayTime = (nowH >= 5 && nowH < 19);
  let sleepTimeVal, sleepDurVal;
  if (sleepInfo) {
    if (dayTime) {
      const nh = String(sleepInfo.next.getHours()).padStart(2, '0'), nm = String(sleepInfo.next.getMinutes()).padStart(2, '0');
      sleepTimeVal = `<span class="ov-time">${nh}:${nm}</span>`;
    } else {
      sleepTimeVal = `<span class="ov-value">-</span>`;
    }
  } else {
    sleepTimeVal = `<span class="ov-value">暂无记录</span>`;
  }
  // v3.6.25 睡眠时长改为「当天总睡眠时长」（当天所有 sleep 记录 duration 求和，含午睡等多次小睡），不再显示上一次
  // v3.6.43 无记录时「暂无记录」→「-」（用户要求，与夜间「下次睡觉」的「-」占位风格统一）
  const sleepTotalMin = getTodaySleepTotal();
  if (sleepTotalMin !== null) {
    const durH = Math.round(sleepTotalMin / 6) / 10;   // 分钟→小时，保留 1 位小数
    sleepDurVal = `<span class="ov-value ov-num">${durH}</span><span class="ov-value ov-unit">h</span>`;
  } else {
    sleepDurVal = `<span class="ov-value">-</span>`;
  }
  html += '<div class="overview-row">';
  html += `<div class="overview-item"><span class="ov-icon">😴</span><span class="ov-label">下次睡觉:</span>${sleepTimeVal}</div>`;
  html += `<div class="overview-item ov-unit-item"><span class="ov-label">睡眠时长:</span>${sleepDurVal}</div>`;
  html += '</div>';

  const planHtml = renderTodayPlanCardHTML();
  const achArr = computeAchievements(records);
  const _achDs = getTodayDateStr();
  let achHtml = '';
  if (achArr.length > 0) {
    // v3.6.9 今日成就整体只保留一个赞（按天）：图标放大一倍、点赞/取消区分度明显
    const _liked = isAchLiked(_achDs);
    const _likeBtn = `<button class="ach-like-btn${_liked ? ' liked' : ''}" data-ds="${escapeHtml(_achDs)}" onclick="toggleAchLike(this.dataset.ds, event)" title="${_liked ? '取消点赞' : '点赞'}" aria-label="${_liked ? '取消点赞' : '点赞'}">👍</button>`;
    achHtml = `<div class="overview-achievement"><span class="ov-text"><span class="ov-icon">🏆</span> <span class="ov-label">今日成就:</span> ${achArr.map(n => escapeHtml(n)).join(' | ')}</span>${_likeBtn}</div>`;
  } else {
    achHtml = `<div class="overview-achievement"><span class="ov-text"><span class="ov-icon">🏆</span> <span class="ov-label">今日成就:</span> 无</span></div>`;
  }

  // v3.5.145 总览卡片内：今日计划（上）→ 今日成就（中）；日报胶囊已移至卡片下方独立渲染
  html += '<div class="ov-bottom-row">' + planHtml + achHtml + '</div>';

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
  // v3.6.24 合并倒计时提示：距下次喝奶/睡觉：h min / h min（夜间无睡觉预估时只显示喝奶）；v3.6.26 「下一次喝奶」改为「下次喝奶」
  const fmtLeft = ms => { const dm = Math.floor(ms / 60000); return Math.floor(dm / 60) + 'h ' + (dm % 60) + 'min'; };
  if (diff > 0) {
    let txt = `⏰ 距下次喝奶：${fmtLeft(diff)}`;
    const si = getNextSleepInfo();
    const nowH2 = new Date().getHours();
    if (si && nowH2 >= 5 && nowH2 < 19) {
      const sd = si.next - new Date();
      if (sd > 0) txt = `⏰ 距下次喝奶/睡觉：${fmtLeft(diff)} / ${fmtLeft(sd)}`;
    }
    showToast(txt, 3000);
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
  // v3.6.46 播放模式下拉（随机/多曲循环）：点按钮与菜单以外的区域时关闭
  const menu = document.getElementById('eePlayMenu');
  if (menu && menu.classList.contains('open')) {
    const wrap = document.getElementById('eePlayWrap');
    if (!wrap || !wrap.contains(e.target)) menu.classList.remove('open');
  }
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

/* ==================== 渲染卡片（v3.5.143：扁平列出全部活动，不再按分类分组） ==================== */
function renderCards(newestIds) {
  newestIds = newestIds || [];
  const grid = document.getElementById('cardsGrid');
  grid.innerHTML = '';
  const records = getTodayRecords();
  const q = actSearchQuery;

  // v3.5.144 保留顶部分类多选下拉筛选（selectedCategories），但下方活动不再按分类分组、不显示分类标题
  // v3.5.160 听歌/听故事已并入首页合并卡片（放音频卡），此处从网格中移除
  let acts = ACTIVITIES.filter(act => selectedCategories.has(act.category) && !hiddenActivities.includes(act.id) && act.id !== 'listenMusic' && act.id !== 'listenStory');
  if (q) acts = acts.filter(act => act.name.toLowerCase().includes(q));

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

  if (!grid.children.length) {
    grid.innerHTML = '<div class="memo-empty">没有匹配的活动，换个关键词试试～</div>';
  }
  renderAudioMixerCard();   // v3.5.160 同步刷新合并卡片中的听歌/听故事区块（显隐 + 记录列表）
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
const APP_VERSION = 'v3.6.52'; // v3.6.52: 修复「家庭数据密钥(盐)被打挂导致服务端定时任务连续解密失败」事故的根因与自愈缺口——①【根因·预防】本地无 salt 且云端 _salt 查询为空时，老逻辑直接新建随机盐并上传，把家庭真实密钥打挂（服务端随后全部解密失败：今日计划停更、推送全停；前端巡检因时机缺口数小时未自愈）。新增安全闸 resolveCloudSalt/cloudFamilyHasData（app.js）：_salt 查询为空时，仅当确认家庭无任何数据行（family_records/其他 config 键全无）才允许新建（首次创建家庭）；家庭已有数据行 = 密钥异常，重试 2 次后明确失败并 toast「请用原手机打开 App 修复」，绝不新建覆盖。getCryptoKey/initSync/同步设置保存三处入口全部改走该安全闸。②【自愈缺口】setupSyncListeners 的 visibilitychange（切前台）与 online（联网恢复）补跑 checkSaltConsistency 盐巡检（节流 60s）——原 10 分钟间隔巡检在 document.hidden（锁屏/切后台）期间整段跳过，手机解锁使用过也不会修；③巡检判定 unknown（无法判定）时新增 30 分钟节流的可见 toast，不再静默；④服务端 scripts/sched-push.mjs 修 main() 的 TDZ 运行时错误（v3.6.45 引入：家政考勤日志行引用 const now 早于声明，服务端每次运行必崩——此前一直被盐解密失败挡在后面），并更新解密失败提示文案。新增 test_v3652.py（安全闸四场景 + 服务端 main() DRY_RUN+mock fetch 冒烟，抓 TDZ 类运行时错误）；回归全量通过；离线版双主题 0 报错；HANDOFF 同步。线上应急处置：已将云端 _salt 恢复为家庭真实盐值（能解密全部数据行），服务端解密恢复。// v3.6.51: 用户需求「修正当月工作天数计算：如果上户日期在当月，当天日期减上户日期」——家政考勤上户中(on)人员的当月总天数原口径为「1号至今天」（如 10-21 上户、10-22 查看显示本月 22 天），未按上户日期截断，导致当月刚开始上户就按当月已过去的天数计工作天数（工资多算）。现 hkMonthTotalDays（app.js 与服务端 scripts/sched-push.mjs 同步修改，服务端工资推送同口径）修正为：上户日期在当月 → 本月天数 = 当天 − 上户日期 + 1（含两端：上户当天即开始工作计 1 天，与已下户口径「1号至下户日期含当天」对称；如 10-21 上户、10-22 查看 = 2 天）；上户日期不在当月（更早月份上户）仍为「1号至今天」；历史月=整月；已下户口径不变（下户日期在当月=1号至下户日期）。当天上户=1 天；上户日期异常（晚于今天/格式错）回落原口径。computeWage（满勤月工资÷满勤天数×当月工作天数）与「已工作 X 天（本月 Y 天，休假 Z 天）」展示行自动跟随。新增 test_v3651.py；回归全量通过；离线版双主题 0 报错；HANDOFF 同步。// v3.6.50: 用户需求「知识库中低于15算小风，但今日计划中16归为小风，应该以知识库为准」——根因：计划 prompt【风级换算与户外/防风】段（app.js buildPlanSystemPrompt 与 scripts/sched-push.mjs 两侧逐字对齐）虽写「必须以家庭知识库为准」，但又给出兜底数值 ≤19km/h=风小，与用户知识库自定义的 ≤15km/h=风小 冲突，16km/h 落在两口径之间被更醒目的兜底数值带跑归小风。修复（两侧逐字重写规则段）：①风速档位判定改为「以家庭知识库中用户自定义的风速风级标准为唯一准绳」（通常位于知识库「穿衣/户外」条目），用户写明阈值优先于本段一切数值；②严禁使用通用气象风级表（如蒲福风级 3 级=12-19km/h）或 prompt 内兜底数值覆盖知识库定义；③边界严格按知识库原文执行、含等号一侧归属知识库写明的一档，不得四舍五入或取折中（例：KB 定义「风小 ≤15km/h」时 16km/h 必须归下一档「风稍大」）；④兜底（≤19 风小/20-38 风稍大/≥39 风大）仅在知识库完全没有风速/风级相关定义时启用，且须在正文注明「知识库未定义风速档位，按通用口径」；⑤摘要与正文的风档名称一律用知识库的档位名称。PLAN_PROMPT_VERSION 13→14，触发当天计划按新 prompt 重新生成（staleVer 重生成）。新增 test_v3650.py；回归全量通过；离线版双主题 0 报错；HANDOFF 同步。// v3.6.49: 用户需求「家政考勤后面的数字去掉」——备忘录家政考勤分区标题行右侧的当月休假天数汇总数字（#nannyVacDays .cnt，v3.6.0 起显示如「2.5」）不再渲染：renderHousekeeper 不再计算赋值、置空内容；HTML 初始值同步清空；保留空 span（无 min-width 不占位，样式规则不动），当月休假明细（各人「已工作 X 天（本月 Y 天，休假 Z 天）」行、休假 chips、月份切换）与工作天数/工资口径（hkMonthVacDays/hkMonthWorkDays/computeWage）均不受影响；待办事项/已办事项分区计数（0/33 等）保持不变。新增 test_v3649.py；回归全量通过；离线版双主题 0 报错；HANDOFF 同步。// v3.6.48: 两项用户需求——①「自定义任务在管理任务页已关闭，但仍推送消息」（v3.6.45 仅在 pushTask/runScheduler/服务端 sched-push 三处加了 enabled 终检，但漏了云同步传播链路，关闭态会被复活/延迟传播，构成三层根因）：(a)【复活漏洞·主因】mergeSchedCloudTasks 的 else 分支（计划内容不更新时）只合并 pushPeriod、不合并 enabled——他端/服务端回写后，本机周期性 saveSchedCloud 会把本地陈旧 enabled=true 覆盖回云端，关闭被复活，服务端 cron 每 5 分钟读到 true 继续推；现 enabled 按 enabledTs（开关操作时间戳，toggleTask 切换时记 Date.now()，同早教音频 name/type 的 updatedAt 冲突合并语义）取新端裁决：云端 enabledTs 更新→本地采纳云端 enabled（关闭/开启都正确传播），本地 enabledTs 更新→保留本地；(b)【传播延迟】saveSchedTasks→scheduleSchedCloudSave 有 5s 防抖，且 isSyncReady() 不就绪（无网/无密钥）时静默 return 且不补传——关闭后 5s 内遇服务端 cron 到点，或关页面/断网导致同步从未发生，云端仍 true 继续推；现 toggleTask 开关操作后 scheduleSchedCloudSave(0) 即时上云，未就绪时记 _schedCloudPending 标记，由 runScheduler（60s 轮询+切前台）在就绪后补传；(c)【陈旧覆盖】页面常开时周期性上传不重新拉取云端，长期运行会把陈旧的 enabled=true 推回云；现 saveSchedCloud 上传前若距上次成功拉取云端超过 3 分钟，先 loadSchedCloud() 拉取合并再上传。②家政考勤「下户状态的添加按钮也置灰」（v3.6.47 需求③的延续）：renderHKPerson 中已下户(!on)时，添加休假日期的「添加」按钮（openHKVacPicker 入口）也加 .hk-date-btn-end 置灰类（与下户日期按钮同款双主题置灰），上户中保持 .fab-btn 原色不变。新增 test_v3648.py；回归全量通过；离线版双主题 0 报错；HANDOFF 同步。// v3.6.47: 三项用户需求——①「指定循环」改名「多曲循环」（v3.6.46 需求①的后续调整）：首页播放下拉菜单项「📋 指定循环」→「📋 多曲循环」，弹窗标题「指定音频循环放」→「多曲音频循环放」，首页连播提示语「或『指定』循环播放」→「或『多曲』循环播放」，管理页播放音频数 hint 同步；播放/循环/队列/自动记录等逻辑语义不变（函数名 openEePickModal/eeStartPick/_eeLoop 等不改，避免动存量测试与调用方）。②管理音频编辑弹窗新增「默认加入多曲循环」开关（v3.6.47 需求②，.toggle-switch 样式同管理活动开关，默认关）：开启后该音频条目标记 loop=true（随 _early_edu 云同步传播，同 name/type 的 updatedAt 冲突合并语义）；首页「播放 → 多曲循环」弹窗打开时，所有 loop 音频自动勾选（eePickSet 预填）并在列表内置顶显示（renderEePickList 稳定排序：loop 组在前、组内 addedAt 倒序，与管理页「新添加在前」一致）；确定起播时队列顺序同样 loop 优先（confirmEePick），即默认循环曲目排在最前；开关状态在编辑弹窗打开时回显（eeEdit），保存时读写（eeSaveEdit）。③家政考勤「下户日期」按钮置灰（v3.6.47 需求③）：renderHKPerson 中已下户(!on)状态的下户日期按钮加 .hk-date-btn-end 类（深色 rgba(127,140,141,.22) 底/灰字/无投影，浅色 rgba(99,110,114,.14) 底/灰字，emoji 降透明度），上户日期按钮保持 .fab-btn 原色不变，双主题生效。新增 test_v3647.py；存量 test_v3646 断言随文案更新（下拉两项/弹窗标题/提示语）；回归全量通过；离线版双主题 0 报错；HANDOFF 同步。// v3.6.46: 用户需求「首页放音乐：点击播放增加下拉框（随机/指定）」——①未播放时点「播放」不再直接随机开播，先出「随机/指定循环」下拉菜单（.ee-play-menu，播放中再点一次仍=停止，恢复/防抖/亮屏续播等既有逻辑不变；点菜单外区域自动关闭）；②「随机」=原逻辑（随机连播管理中的播放音频数 N 首，播完即停，eePlayN 明确 _eeLoop=false）；③「指定循环」=打开「指定音频循环放」弹窗（eePickModal）：标题「指定音频循环放」，显示管理音频中所有音频名称（仅名称、无试听），上方左侧类别多选下拉（同管理音频页交互）+同一行右侧关键字搜索，每首前勾选框（.add-check 样式同添加记录），已勾选跨筛选/搜索保留，底部显示「已选 N 首」；多选确定后返回首页起播并全局 toast「循环播放 N 首」；④指定循环语义：队列=勾选音频（按列表顺序：新添加在前，与管理页一致，重复打开顺序稳定），播完自动回队首循环（eeAdvanceQueue 的 _eeLoop 分支；随机模式仍播完即停），预取下一首时循环模式取队首（eePrefetchNext），「切换」按钮在循环模式下改为队列内下一首（到队尾回队首、跳过已删墓碑条目），随机模式下切换仍为当天已播降权的加权随机；播放中文案前缀区分模式（eeNowPrefix：循环播放：/正在播放：）；停止即退出循环模式（eeStop 清 _eeLoop）；指定队列同样记当天已播（降权仅影响随机挑曲）与播放自动记录（听歌/听故事，同随机模式）；空音频池时随机/指定均提示「请先在管理 → 早教添加音频」。index.html：播放按钮外包 .ee-play-wrap + 下拉菜单、新增 eePickModal 弹窗与 CSS（.ee-play-menu/.ee-pick-foot，深浅双主题）、连播提示语文案改「点『播放』可选『随机』连播N首歌或『指定』循环播放」、管理页播放音频数 hint 同步补充指定循环说明。// v3.6.45: 两项用户需求——①备忘录「育儿嫂休假」升级为「家政考勤」（v3.6.45 需求②）：分区标题改「家政考勤」（🏠），下含钟点工/育儿嫂两个子标题；每个子标题带「是否上户」开关（样式同管理中的活动开关 .toggle-switch，默认开启）；上户中→显示上户日期（日期选择组件，样式同添加休假日期的组件）+ 当月休假和工作时间；已下户→显示下户日期 + 自动清掉超出下户日期的休假 + 提示「请根据微信推送消息，结算家政当月的工资」；当月工作时间 = 当月1号至下户日期或当月最后一天的总天数 − 休假天数（上户中：当月=1号至今天、历史月=整月；已下户：下户日期在当月=1号至下户日期）；日期选择组件支持选半天（多选提示条内每个已选日期带「全天/半天」切换按钮，按 1/0.5 计数），日历中超出下户日期的日期置灰不可选；数据模型 housekeeper_v1：每人 {on,startDate,endDate,vac:{日期:1|0.5}}，云键 _housekeeper（本地优先并集合并）；旧数据自动迁移：旧 nanny_vacation_v1 平铺数组 → 育儿嫂.vac（值1），旧云键 _nanny_vacation 兼容读取；保留 getNannyVacation/addNannyVacation/removeNannyVacation/renderNannyVacation/openNannyVacationPicker 兼容旧调用方。②任务工资结算改造（v3.6.45 需求③）：任务编辑新增「满勤月工资/满勤天数」输入（默认 10000 元/26 天，getTaskWageVals 读写、旧任务回落默认）；computeWage 改为「满勤月工资÷满勤天数×当月工作天数」，当月工作天数取家政考勤·育儿嫂（当月总天数−当月休假，0.5计数），结算月=触发日前一天所在月（下户提前推送时=下户当月）；添加/编辑弹窗工资结算图标 👩→💰；关闭任务不再推送（pushTask 入口终检 task.enabled===false 直接不推，覆盖已认领/并发窗口场景）；当月有下户日期时推送提前至下户日期当天同一时刻（runScheduler 中 wage 任务的 trig 用「下户日期+任务开始时刻」替换原触发点，原日期不再推；periodKey 随调整后 trig 计算，不重复推）；服务端 scripts/sched-push.mjs 同步：fetchHousekeeperCloud（新键+旧键兜底）、computeWage 新口径、下户提前推送、archiveNannyMonthCloud 改操作 housekeeper.nanny.vac（保留 0.5 值）。// v3.6.44: 六项用户需求——①备忘录三个分区标题（待办事项/已办事项/育儿嫂休假）字号 14px→16px（.memo-todo-head/.memo-done-head/.nanny-vac-head 共用规则，v3.6.44 需求①）②首页身高/体重输入按天清空（v3.6.44 需求④：loadHeight/loadWeight 改为只回填「当天」bodyHistory 记录，新的一天从空开始——前几天的记录完整保留在 bodyHistory（曲线/历史/AI 上下文不受影响）；saveHeight/saveWeight 输入为空时不再写空 babyHeight/babyWeight、不触发同步（保留「最新录入值」供 AI 引用）；新增 60s 跨天巡检（业务日 1 点翻页检测到日期变化即重载两个输入，load 自带焦点保护不会打断正在输入的用户））③成长里程碑编辑类型单选改多选（v3.6.44 需求⑥：openMsEdit 的 select 改为 checkbox-group（样式同添加记录），覆盖存储 ms_override_v1 新格式 {domainIds:[...], isFirst}，读兼容旧格式 domainId；collectMilestones 生成 it.domains 数组（it.domain=domains[0] 主类型，徽章缓存快照/LLM enrich 等无 domains 字段的路径经 msDomainsOf 回退）；时间轴卡片渲染多个类型标签；三大徽章组匹配改为「条目任一类型命中组 domains」）④AI育儿知识库编辑分类单选改多选（v3.6.44 需求⑦：editKb 的 select 改为 checkbox-group；保存时用户勾选与原集合不同→写 cats 数组（cat=cats[0] 保旧消费方兼容），相同→沿用关键词自动重分类（旧行为）；renderKb 筛选改「条目任一分类被选中」、列表渲染多个分类标签；reTagKb/LLM 精分回填同步维护 cats）⑤音频管理页「试听中」文案红改蓝（v3.6.44 需求⑧的上传图1：.ee-aud-tag 深色 #e17055→#74b9ff、白天 #d63031→#0984e3，与播放按钮蓝色系统一；按钮图标红色不变）⑥锁屏/通知媒体信息（v3.6.44 需求⑧的上传图2：artwork 固定为小咕噜深色模式头像 assets/photo-data-sq.webp 406x406 不再跟随主题（原浅色主题用 photo-day-v3 320x320）；主标题=音频名（title=it.name 本就如此，回归锁定）；副标题固定「小咕噜音频」（原「小咕噜音频 · 类型」）；title/artist/album/绝对URL 语义不变）。test_v3636.py 同步更新为新语义（浅色主题下 artwork 仍为深色头像、切主题不换 artwork、artist=小咕噜音频）。// v3.6.43: 三项用户反馈——①总览睡眠时长无记录时「暂无记录」改为「-」（与夜间「下次睡觉」的「-」占位风格统一；「下次睡觉」列保持「暂无记录」不变，体温/历史列表等其它暂无记录占位一律不动）；②总览「详情」胶囊由今日计划标题行下移一行至第二行最右侧（.ov-plan-detail-btn top:0→24px=一行行高 15px×1.6，right:0 贴右不变；卡片 min-height:48px 两行高，保证单行摘要时第二行也有空间放胶囊、不溢出到日报胶囊区域）；③备忘录待办勾选后停顿时长 3s→2s（_memoPendingDone 定时器 3000→2000，视觉 pending 标记/「已完成1件事」提示/二次点击撤销逻辑不变）。// v3.6.42: 去掉首页总览体温行 // v3.6.42: 去掉首页总览体温行（用户反馈「总览中去掉体温这一行」——v3.6.41 新增的「🌡️ 体温: 36.5℃ ● 20:30」整行移除，总览恢复为「下次喝奶+水奶量 / 下次睡觉+睡眠时长」两行结构；体温记录仍可在历史列表与添加弹窗正常查看/记录，仅总览不再展示。无 CSS 变动（.temp-normal/.temp-high 为既有样式类，历史列表仍在用，保留）。// v3.6.41: 首页总览新增体温行 // v3.6.41: 首页总览新增体温行（用户要求「首页测体温显示具体温度和正常/发烧的图标」）——总览在「下次睡觉/睡眠时长」行后新增「🌡️ 体温: 36.5℃ ● 20:30」：显示当天最后一次体温记录的具体数值+单位+状态图标+测量时间；状态口径与历史列表/添加弹窗实时指示完全一致（≤37.5℃ 正常=绿● / >37.5℃ 发烧=红⚠️，旧记录无 tempStatus 时按阈值现算）；当天无有效体温记录（temperature>0）则不占位——体温非每日必测，避免每天显示「暂无记录」拥挤总览。无新增 CSS（复用 overview-item/ov-value 与既有 .temp-normal/.temp-high）。// v3.6.40: 新增「辅食第N天食谱推荐」（用户要求「AI推荐今日计划：如果前一天添加了辅食，计为第一天，查询知识库，按添加辅食的时间和最相近的月龄，推荐当天的辅食食谱和制作方法，需要比较具体，比如多少度的水冲泡多少米粉」）——①collectPlanDayStats 的辅食记录补昨日添加时间(solidFoodTime/recTime)/克数(solidFoodAmount)/饭后情况(afterMeal)；②新增 solidFoodStreak()：从目标日往前逐日查辅食记录、遇空档即止（最多回看 60 天），streak=1 即昨日为辅食第1天（首次添加）、今日计划目标日=第 streak+1 天；③buildPlanSystemPrompt 在【辅食提醒】后新增【辅食第N天食谱推荐】规则——前一日有辅食记录时要求【喂养】辅食项给出当天具体食谱与制作方法，必须具体到：吃什么（观察未满2-3天仍吃同一种）/多少克多少毫升（比昨日增不超2成）/什么温度的水（如50-60℃温开水）与冲调蒸煮步骤稀稠程度/喂食时段（参考昨日添加时间，如上午10点）/过敏观察要点，并须结合知识库「辅食」条目与宝宝月龄，知识库无对应月龄食谱时按通用原则（6月龄高铁米粉稀糊、7-8月龄蛋黄肉泥、9-10月龄稠粥手指食物、11-12月龄软饭小丁）；④KB_EG_SEED_VER 2→3 新增 2 条「辅食」种子：按月龄食谱（具体到水温与克数：6月龄约50-60℃水、15g米粉+150ml水冲成缓慢滴落稀糊；7-8月龄20g+170ml稍稠+蛋黄肉泥；9-10月龄稠粥碎末+手指食物；11-12月龄小馄饨蒸糕软饭小丁）与添加观察原则；⑤PLAN_PROMPT_VERSION 12→13（服务端 sched-push.mjs 同步：collectPlanDayStats 同款增强 + solidFoodStreakCloud 一次拉 60 天记录逐日找辅食 + prompt 规则段逐字对齐 + 版本号 13）。// v3.6.39: 修复「将日报字体大小改为与AI育儿字体一样大」——实测两胶囊文字本就同为 12px/800（像素墨迹高 12.0 vs 11.8，基本相同），用户观感差异来自 v3.6.38 放大的 📈（15px）与 12px 文字的反差：AI育儿胶囊 12px 图标+12px 文字均匀显「正常大小」，日报胶囊 15px 图标+12px 文字显字小。若只调大日报则会变成日报反比AI育儿大、仍不一致，故两胶囊文字同步 12px→14px（.ov-report-pill 与 .ai-chip 两条规则），盒高均保持 25px 锁死不变——两胶囊文字真正一样大且更醒目；胶囊宽度各增约 8px（日报为右对齐、AI育儿为居中于头像下，均不破坏布局）。双主题截图验证两胶囊文字同大同醒目。// v3.6.38: 修复「把首页日报胶囊高度调大，和AI育儿胶囊高度调成一样」——实测两胶囊盒模型本就完全一致（均 height:25px、box-sizing:border-box、同 12px/800 字、同 1px 外框、内容盒均 23px，v3.5.153 起即锁死相同高度），观感差异来自 emoji 字形墨迹占比：👆（AI育儿）为竖向实心大手、墨迹占满字形箱；📈（日报）为方形网格、内置留白多，在部分设备 emoji 字体（如苹果/三星）下渲染更小，致日报胶囊显矮。修复：日报胶囊内 📈 用 span.pill-emoji 单独放大 12px→15px（flex-shrink:0 防压缩），视觉体量与 👆 拉齐；盒高保持 25px 不变（与 AI育儿胶囊真正一致），胶囊仅宽约 3px，位置与布局无变化。双主题截图验证视觉高度一致。// v3.6.36: 锁屏/通知媒体信息补 artwork——用户反馈「放音乐，锁屏时，左上角的音频图标改为小咕噜的头像（深色模式的）」，截图显示通知左上角是 PWA 默认图标（星星月亮）：MediaMetadata 从未设置 artwork，系统回退显示应用图标。修复：深色主题 artwork=assets/photo-data-sq.webp（从深色头像 photo-data.webp 居中裁切的 406x406 方形版，系统通知不裁切变形）；浅色主题=assets/photo-day-v3.webp（本身 320x320 方形）；artwork 一律转绝对 URL（系统通知只认绝对地址）；抽公共函数 eeSetMediaMetadata(it)，首页连播起播与管理页改名刷新共用；播放中切换主题（手动/跨时段自动）→ applyTheme 里即时刷新 artwork，头像跟随主题。title/artist/album 语义不变。新增 test_v3636.py 15/15（深色播放→方形深色头像+绝对URL+sizes 406x406+webp/浅色播放→photo-day-v3+320x320/播放中切主题 artwork 双向刷新/标题副标题专辑保持/改名同步锁屏标题且 artwork 不丢/方形头像资源可加载且 406x406）。// v3.6.35: 修复「设置连播5首，但还是2首就停止，无法继续播放」（用户第三次反馈，同一根因横跨 v3.6.30/v3.6.31/v3.6.34 三版）——根因是切歌时序竞态：eePlayItem 里 `_eeInternalPause=true; a.pause()` 在 finally 中同步复位，而 pause 事件是异步派达的——派达时标志已失效、eeCurrentId 还是旧曲，pause 处理器把 UI 误打成「已暂停：旧曲」+按钮「播放」+释放唤醒锁；新曲加载慢（play promise 未 resolve、eeAudio.paused 已因 play() 调用变 false）时该假状态持续数秒，用户看到「已暂停」点「播放」→ eeToggle 判定 !paused=正在播放 → eeStop() 真停，再点只能重开新队列——即「连播2首就停且无法继续」，全程无 toast。修复：①pause 事件处理器加「!eeAudio.paused → return」守卫（pause 后已恢复播放=切歌/恢复竞态，不是系统暂停，不更新 UI，从根上消除假「已暂停」）②eePlayItem 换 src 前先撤旧失败监控（_eeFailArmed=false+撤看门狗），武装延后一个 macrotask 且仅当仍未开播才武装——防旧 src 的 abort/error 噪声（X5 特性）命中新曲 armed 状态导致连续几首切歌凑满失败 3 首误停整条链；play() 早期 reject（同步/微任务早于武装）补 armed 再走失败处理，不漏同步 reject 死停 ③eePlayQueueItem 跳过已删墓碑条目，避免起播已删云端文件 404 触发失败链 ④eeAutoRecordOnPlay 包 try/catch，记录异常（云同步失败）不得阻断起播 ⑤亮屏续播：黑屏期间资源被系统收回（readyState=0 且无进度）直接重载当前曲，不断链。新增 test_v3635.py（切歌加载中不得假「已暂停」+pause 事件不破坏连播状态/真暂停→点播放恢复当前队列不清空不重开/src 切换 error 噪声不打断 5 首连播/墓碑条目跳过且队列继续/亮屏续播两路回归/停止后可重开/记录异常不阻断起播/播放数 5 队列 5）。// v3.6.34: 修复「点击成长里程碑徽章，详情显示 undefined月龄」——根因：v3.6.29 徽章固化后，renderMilestoneBadges 给固化徽章构造的 hit 只有 text/label/date/domain，缺 ageMonths/ageDays/isFirst，renderBadgeDetail 直接渲染 ${it.ageMonths} → 「undefined月龄」且不标「首次」（非固化路径从 items 现找不受影响，故只在徽章固化后的设备上复现）。修复：固化 hit 补 isFirst=true 与月龄——优先取 items 中同 text（同 date 优先）的完整条目，取不到按出生日期 getAgeDetail 现算（try/catch 兜底）；renderBadgeDetail 对缺失月龄不渲染该段，双保险绝不再出现 undefined。// v3.6.33: 修复「配好 AI 密钥、测试通过，但徽章仍是规则值」的剩余断链——用户确认密钥已配且测试通过，徽章却仍像没调 AI。定位四漏洞：①「测试」按钮假通过——classifyMilestoneLLM 缓存键 msllm:provider:model:hash 不含 apiKey，以前用有效密钥测过之后，即使密钥失效/输错，点「测试」仍命中旧缓存显示「✓ 返回」；现测试前先删测试文本的缓存键，保证通过来自真实 API 调用。②保存配置不清补救节流——之前打开分析时补救失败写过 ms_badge_ai_try（24h 节流），用户之后配好密钥，24h 内再打开分析也不会重试；现 saveAITagConfig 检测到配置真正变化（ms_badge_cfg_sig 签名比较）时清除该节流键并立即补救（配置没变则不重置，避免反复点保存反复打 API）。③补救触发依赖打开分析——用户配好密钥后不再打开分析页，徽章永远不更新；现 saveAITagConfig 保存成功后立即对无 AI label 的徽章组尝试补救一次（不在分析页时成功弹「徽章已更新为 AI 概括」）。④期内补救全失败时静默无声——现全部组仍无 label 时弹温和 toast「徽章 AI 概括失败，暂按规则显示（可到 管理 → AI 设置 点「测试」检查密钥）」（ms_badge_ai_fail_tip 24h 节流）；openAnalysis 路径的补救仍静默（用户正看着徽章变化）。v3.6.32 的期内补救/不重置刷新锚/已有 AI label 组绝不变/未配置 toast 指引等行为均不变。// v3.6.32: 修复「成长里程碑徽章像没调用 AI 大模型」——根因是固化设计漏洞：徽章一旦在无 AI label 的情况下固化（旧格式缓存升级时按规则结果即时固化 / 无密钥时进刷新窗口 / AI 调用失败），而 15 天刷新窗口只补「新解锁的组」，这些已固化的无 label 组永远等不到 AI 美化（截图中「妈妈出门休检半天…」正是规则回退的 slice(0,8)+省略号）。修复：①打开分析时若存在无 AI label 的徽章组且已配置 AI → 立即尝试 AI 美化一次（enrichMilestonesWithLLM 美化范围从「仅 fresh 组」扩大到「fresh 组 + 无 label 组」；已有 AI label 的已固化组仍绝不变；不重置 15 天刷新锚；失败 24h 节流）②AI 未配置时 toast 明确提示「请到 管理 → AI 设置 配置密钥（可先点测试）」，不再无声回退规则 ③刷新窗口 AI 调用失败有 toast 提示。15 天周期、期内固化、编辑不重算等既有语义均不变。// v3.6.31: 修复「设 5 首连播只播 2 首、手机黑屏就自动停」的收尾因素——黑屏/锁屏期间系统暂停音频（v3.6.30 已做到只暂停不散队），但连播链在黑屏期间断裂且亮屏后不会自动续播，用户看到的就是「没操作却停了」。现两层防护：①播放期间申请屏幕唤醒锁（Wake Lock API），尽量阻止自动熄屏——屏幕亮着页面就不冻结、音频焦点不丢、连播不断；页面切后台/系统暂停/用户停止时按规范释放（省电），亮屏或恢复播放时重新申请；微信 X5 等旧内核不支持时静默降级。②亮屏自动续播（visibilitychange→visible）：队列还在且音频处于暂停态 → 自动从当前这首继续（UI 恢复「正在播放」）；若当前首在黑屏期间已播完（X5/页面冻结丢 ended）→ 直接下一首；恢复失败（音频资源被收）→ 重载当前曲；用户经媒体通知/锁屏控件主动暂停（_eeUserPaused）时不自动续播，尊重意图，点 App 内播放按钮仍可随时恢复。另修：锁屏媒体通知的「播放」旧实现只 play() 不刷新 App 界面（通知续播后 App 仍显示「已暂停」）——现同步 UI 与唤醒锁。// v3.6.30: ①徽章更新策略按用户明确调整——仍每 15 天刷新窗口更新一次、期内固化，且「更新里程碑记录/编辑里程碑」都不再重新更新徽章（v3.6.29 的「编辑即重推」已回退：saveMsEdit 保留徽章固化快照不动，仅刷新缓存 items 供时间轴/分类即时生效，且不重置 15 天刷新锚）②修复「播放音频数设为 5 却只连播 2 首」多重因素：(a) 播放数云同步旧逻辑无条件用云端值覆盖本地——某次保存上传失败/他端旧值后写，本地设置就被顶掉且每次开 App/切前台复发；现本地保存记时间戳，仅当云端 last_modified 更新才覆盖；(b) 连播看门狗 10s→15s 且加载超时改为只跳过本首、不计入连续失败（慢网络下 3 首慢歌误杀整条链是「播 2 首就停」的误停机制；真正无法播放的文件仍走 error/play reject 连续 3 首停+toast；整队超时有 toast 兜底）；(c) 系统/锁屏暂停旧逻辑直接 eeStop 清队列（mediaSession pause 与音频焦点丢失）——现只暂停不散队、UI 显示「已暂停」、点按钮从当前这首继续；(d) 防同一 src 重复 ended（微信 X5 pause/currentTime 归零后重发会导致莫名跳首）；(e) 连播提示语诚实显示实际可连播数=min(设置数, 现有音频数)，不足则明说「不足则全放」。// v3.6.29: ①成长里程碑徽章固化——双根因导致徽章「突然改乱」：(a) v3.6.17 起 enrichMilestonesWithLLM 内 Promise.allSettled(_mapPool(...)) 包住 async 函数的 Promise，每次必抛 "object is not iterable" → AI label 从未落盘；(b) 徽章每 15 天周期重算且刷新时先把无 AI 标签的规则结果存缓存（AI 异步返回前离开即被污染）→ 徽章标题从 AI 概括退化为规则截断。现徽章一经确定即永久固化（缓存新增 badges 快照，renderMilestoneBadges 优先用固化徽章；刷新窗口只补未解锁组，AI label 仅美化本次新固化组一次；旧格式缓存首次打开即时推导固化；手动编辑里程碑属用户显式意图，重推并固化）②总览右列冒号与数值间隔改为与「下次喝奶: 02:25」一致（4px）——label/数值/单位均 auto 宽、数值紧跟冒号，item 132→120px（右移右缘不变）；v3.6.28 的 h 与 l 对齐因与冒号紧凑互斥移除。// v3.6.28: ①总览「下次睡觉」图标 🌙→😴（与 ACTIVITY_TYPES/日报/图表的睡眠图标体系统一）②睡眠时长单位「h」右移约一个字符宽与上一行「ml」的「l」对齐（.ov-unit.unit-h padding-left:0.83em，unit 框 20→22px，item 总宽 132 不变）；「睡」与「水」第一个字对齐、数值右端对齐保持不变（两端对齐）。// v3.6.27: 总览「下一次睡觉」→「下次睡觉」，与「下次喝奶」口径统一（toast 早已是「距下次喝奶/睡觉」）。// v3.6.26: ①toast 与总览口径统一「距下一次喝奶」→「距下次喝奶」（总览 label 早已是「下次喝奶:」）②总览右列（水+奶量/睡眠时长）整体收紧往右移——item 156→132px、label 76→66px（冒号与数值间隔减少）、数值 42→36px、单位 26→20px、gap 5→4px，第一个字与单位仍保持对齐③「放音乐」标题字重 700→400——与「🎵 听歌/🎧 听故事」（.ee-sub-head）及「🍼 喝奶」等卡片标题（.card-name，均 16px/400）视觉一致（用户反馈 700 观感偏大）。// v3.6.24: ①首页总览「今日计划 / 今日成就」字号 14px→15px，与「下一次喝奶」行一致（水+奶量等同比例统一）②「放音乐」标题 14px→16px 与「🎵 听歌」标题同尺寸；连播提示语从按钮下方移到「放音乐」与按钮之间，且「几首」改为管理里的实际播放音频数（如 5 首，动态渲染）③总览「下次喝奶」下方新增「下一次睡觉 / 睡眠时长」行——5-19 点按「上一次睡眠开始时间+睡眠时长+2 小时」预估下次睡觉时间，19-凌晨 5 点显示「-」，右侧显示上一次睡眠时长（如 13.5 h）；刷新网页的「距下一次喝奶」toast 增加距睡觉倒计时，简化提示语为「距下一次喝奶/睡觉：h min / h min」。// v3.6.23: 播放自动记录改为「每次播放新增去重后的记录」——v3.6.22 的「每类每天仅 1 条」不符合预期（用户反馈：点一次播放就应记一次，同一天可多次播放多次记录）；去重维度改为「同一次播放队列内」：多首故事（中文/英文/古诗）仍合并 1 条听故事、多首儿歌合并 1 条听歌；提示语改为「已添加1条听故事/听歌记录」；切换（eeSwitch）与连播自动接歌仍不记录。// v3.6.22: ①首页「放音乐」手指图标放大 12px→16px（与听歌/听故事图标同尺寸）②修复管理弹窗滚到底时最后一项音频被吸底「确定」条遮住（选项面板底部留白 72px）③播放自动记录去重——每类每天仅 1 条（中文/英文/古诗合并为 1 条听故事、儿歌 1 条听歌），今日已有同类型记录则只高亮已有记录并提示「已添加」，停止后再播放 / 切换不再重复添加 ④早教音频云同步改手动——只有点「立即同步」才加密上云共享（按钮改 .btn 样式置左、状态词与提示移至按钮下方），本地改动只存本机并标记「有改动未同步」，云端拉取仍自动（启动 + 切回前台），家人设备刷新 / 重开即可看到。// v3.6.21: ①修复首页连播「播了几首就莫名停止」——音频元素 error 事件此前无处理（加载失败即死停）、起播无看门狗（加载挂起会卡在「加载中」）、播放/停止按钮无防抖（连击/幽灵点击会误停）；现三路归一失败处理（error/play reject/10s 看门狗）：单曲失败自动跳下一首，连续 3 首失败才停止并明确 toast 原因，按钮加 400ms 防抖 ②修复「管理里删除/新增音频，家人手机不同步」——旧合并逻辑是并集且本地优先，删除直接 splice 导致他端把已删歌曲复活、改名/改分类也不传播；现改墓碑式删除（deleted 标记随云同步，30 天后压缩清理）+ 同 id 按 updatedAt 取新版冲突合并 + 云端保存失败不再静默（管理页早教页新增云同步状态行，失败 toast + 自动重试 + 手动「立即同步」）+ 切回前台节流补拉云端列表 ③首页音频卡新增「放音乐」指引——切换/播放上方左侧指向下手指（尺寸颜色同 AI育儿 图标）+ 右侧加粗黄色「放音乐」，按钮下方灰色小字提示连播与停止方式。// v3.6.20: ①管理音频「试听」改用独立播放器——与管理页列表按钮联动（再点一次=停止、播放中按钮变红+显示「试听中」），与首页播放器（eeAudio/eeQueue/eeCurrentId）完全隔离，首页音频卡片不再被试听占用，停止就在管理当前页点；关管理弹窗/删除试听项自动停 ②管理音频去掉「选免版权」功能（按钮/弹窗/Wikimedia 预设与解析函数全删，已添加的免版权条目保留在列表仍可播放/改名/删除） ③「本地音频」上传链路由「选择音频文件」改名「选文件」并去掉 input 的 accept="audio/*"（该过滤会让 Android 系统选择器先扫描媒体库、实测慢好几秒才弹窗，且并未挡住「照片和视频」入口；类型改由前端 eeFileKind 校验拦截，选择器秒开） ④上传时若转码/解析失败：保留提示且该文件不加入音频列表（原先降级为原格式上传，会传入播不了的条目）。// v3.6.19: 早教音频「编辑」从只能改分类升级为可修改名称+分类——上传前自动转码为 MP3（本地 lamejs 编码，无外部依赖），解决微信 X5/iOS 等内核「Failed to load because no supported source was found」播不出的问题；同时修正上传 Content-Type 按扩展名精确判定（修复 m4a/wav 等被误标 audio/mpeg）；对列表里已存在的无法播放的旧格式给出明确提示。②今日计划推送详情标题去掉「小咕噜 」前缀，只保留任务名称（前后端同步）。// v3.6.17: ①修复「部署后今日计划不刷新」双根因——服务端计划 prompt 与前端 v3.6.14 逐字对齐并改用服务端自己的版本号(PLAN_PROMPT_VERSION=12，不再冒用前端版本号)，服务端落后时前端按版本差重新生成自愈；服务端加 30 分钟生成冷却(task.genTryTs 持久化)防每5分钟重试风暴、同运行防双生成(genAttempted)；②降低天气 API 超限——服务端加云端天气缓存(3小时TTL、只缓存成功结果)，Open-Meteo 超限自动切 wttr.in 备用源(v3.6.16已有)；③降低 DeepSeek token 消耗——AI 问答每次只带最近12条历史上行(界面仍展示全部)、知识库按权威优先+12000字预算截断、里程碑 LLM  enrich 并发限4；④修复家庭密钥(盐)被打挂的根因——前端盐一致性改多行试解多数决判定(_judgeSalt)，无法判定绝不覆盖云端，getCryptoKey 拉取失败绝不新建盐，开App后10秒+每10分钟云端巡检(checkSaltConsistency)自动修复；服务端解密失败明确报错并以退出码1结束。配套：pg_cron 触发间隔5→15分钟。// v3.6.16: ①天气获取健壮化——Open-Meteo 增加 hourly 兜底风速/气温（修复「温度有/风速未知」半失败）、增加 wttr.in 备用源（解决定时任务撞每日配额导致的「天气获取失败」）、app.js 增加 3 小时天气缓存降低请求频率；②成长里程碑徽章刷新间隔 14 天→15 天并锚定刷新时间（未配 AI 也刷新，避免不足间隔就变）、徽章标题硬截断≤10 字改善概括。v3.6.15: 早教音频新增云存储容量闸门——总上限 800MB（Supabase 免费版 Storage 1GB 预留余量，按儿歌约 4MB/首 ≈ 200 首），早教页实时显示「已用/上限/约还可添加 N 首」，本地上传与录音上传前校验，超限即拦截并提示先删除旧音频；上传元数据记录 size 以精确统计。v3.6.14: ①今日计划风级换算改为以家庭知识库为准（新增户外风速风级换算种子，不再用通用气象推算）②穿衣列出同一厚薄档位所有合适衣物（含多件）③备忘录编辑「保存」由绿色改蓝色（#74b9ff/#0984e3）。v3.6.13: 今日计划「详情」胶囊由卡片右下角上移至「📅 今日计划」标题所在行的最右侧（.ov-plan-detail-btn 定位 bottom:0 → top:0）。v3.6.12: ①今日成就改左右两栏——左栏文字两端对齐(justify)，右栏为点赞按钮独占列，其下方留白、文字不侵入；②今日计划标题与摘要同行内联，换行第二行从最左侧开始；③成就推送标题改为「本次更新内容」（去掉「新增N条：」），点开后展示今日成就全部内容并高亮本次新增项。v3.6.11: 首页今日成就点赞按钮 float:right 上移至文字块右上、标签行下一行最右侧。v3.6.10: 点赞按钮从「同行右侧」上移至「成就文字下方第二行右对齐」（.ov-ach-main 包图标+文字占满整行，点赞按钮 flex-wrap 换行到右对齐）。v3.6.9: ①今日成就只保留1个赞（按天存储，图标放大1倍、点赞/取消区分度明显、点赞提示「已点赞，真棒！」取消不提示）②备忘录待办勾选后停留3s提示「已完成1件事」再归入已办 ③计划prompt：前一日无辅食记录时按辅食添加条件判断可否试辅食、穿衣精确到知识库具体衣物名称。v3.6.8: 计划prompt风级换算
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
  { id: 'learnLogic', re: /学算术/, parse: (zone) => ({ params: { note: zone } }) },
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
      aiSyncComposerBtn();   // v3.5.150 回填后同步按钮（非空 → 显示发送）
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
  // v3.5.145 不再覆盖 .hs-value：其颜色/字重由 loadHistory 内联（黄色 #ffeaa7/#d68910、不加粗），此处仅兜底标签与单位
  document.querySelectorAll('#historyModal .hs-label, #historyModal .history-body-row .hb-unit').forEach(el => { el.style.color = c; });
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
  // v3.5.82 颜色改为内联：不依赖可能被缓存的旧 CSS；标签主题自适应
  // v3.5.145 数值改为黄色（与首页总览一致 #ffeaa7/#d68910）且不加粗
  const _hvc = document.body.classList.contains('theme-day') ? '#3d4852' : '#ffffff';
  const _hvVal = document.body.classList.contains('theme-day') ? '#d68910' : '#ffeaa7';
  let sHtml = `<div class="history-sum-row"><span class="hs-label" style="color:${_hvc}">🍼 水+奶量</span><span class="hs-value" style="color:${_hvVal};font-weight:400">${Math.round(totalMilk * 1.12)} ml</span></div>`;
  const _achVal = achArr.length > 0
    ? achArr.map(n => escapeHtml(n)).join(' | ') + (isAchLiked(ds) ? ' <span class="ach-like-icon" title="已点赞">👍</span>' : '')
    : '无';
  sHtml += `<div class="history-sum-row"><span class="hs-label" style="color:${_hvc}">🏆 今日成就</span><span class="hs-value" style="color:${_hvVal};font-weight:400">${_achVal}</span></div>`;
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
        `<div class="rec-detail">${(r.name === '学逻辑' ? '学算术' : r.name)}: ${formatRecordBrief(r, ds)}</div>` +
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
    v = Math.round(v * 100) / 100;   // v3.5.163 统一保留 2 位小数（原来 1 位会把 6.85 覆盖成 6.9）
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
let _dpPicked = []; // v3.6.1 育儿嫂休假多选：本次会话勾选的日期集合
let _dpHalf = new Set();   // v3.6.45 需求②：本次会话勾选为「半天」的日期集合（按 0.5 计数）
let _dpPerson = 'nanny';   // v3.6.45 需求②：家政考勤多选模式下的操作对象（hourly/nanny）
let _dpMode = 'history'; // v3.5.135 日期选择器模式：history(历史,禁未来) | task(定时任务,可选未来) | nanny(家政考勤休假,多选+半天) | hkStart(上户日期,单选) | hkEnd(下户日期,单选)
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
  const lockFuture = (_dpMode !== 'task' && _dpMode !== 'nanny' && _dpMode !== 'hkStart' && _dpMode !== 'hkEnd'); // 历史模式禁选未来；定时任务/家政考勤模式可选任意日期
  const multi = (_dpMode === 'nanny');   // v3.6.1 育儿嫂休假：多选日期
  // v3.6.45 需求②：已下户(!on)人员的休假日期不得晚于下户日期（添加按钮中超出下户日期的不可选）
  let hkEndLimit = '';
  if (_dpMode === 'nanny') {
    try {
      const p0 = getHousekeeper()[_dpPerson];
      if (p0 && !p0.on && p0.endDate) hkEndLimit = p0.endDate;
    } catch (e) {}
  }
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
    // v3.6.45 需求②：超出下户日期的日期不可选（家政考勤多选模式）
    const overEnd = !!(hkEndLimit && key > hkEndLimit);
    if (key === todayKey) cls.push('today');
    if (multi) {
      // 多选模式：已选日期高亮，再次点击取消
      if (_dpPicked.indexOf(key) >= 0) { cls.push('selected'); if (_dpHalf.has(key)) cls.push('half'); }
    } else if (key === _dpSelected && (!lockFuture || !isFuture)) cls.push('selected');
    if (lockFuture && isFuture) cls.push('disabled');
    if (overEnd) cls.push('disabled');
    if (overEnd || (lockFuture && isFuture)) {
      html += `<div class="${cls.join(' ')}" data-d="${d}" title="${overEnd ? '已超出下户日期' : ''}">${d}</div>`;
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
  if (_dpMode === 'nanny') {
    // v3.6.1 多选：点一下加选，再点一下取消
    const i = _dpPicked.indexOf(key);
    if (i >= 0) { _dpPicked.splice(i, 1); _dpHalf.delete(key); }
    else { _dpPicked.push(key); _dpPicked.sort(); }
    _dpSelected = _dpPicked[_dpPicked.length - 1] || '';
    renderHistoryDatePicker();
    updateDpMultiBar();
    return;
  }
  if (_dpMode !== 'task' && _dpMode !== 'hkStart' && _dpMode !== 'hkEnd') {
    // 历史模式禁止选择当天及以后
    const t = new Date();
    const todayKey = `${t.getFullYear()}-${String(t.getMonth()+1).padStart(2,'0')}-${String(t.getDate()).padStart(2,'0')}`;
    if (key >= todayKey) return;
  }
  _dpSelected = key;
  renderHistoryDatePicker();
}
// v3.6.45 需求②：半天切换（多选提示条内每个已选日期一个按钮，全天↔半天，按 1/0.5 计数）
function dpToggleHalf(d) {
  if (_dpHalf.has(d)) _dpHalf.delete(d); else _dpHalf.add(d);
  renderHistoryDatePicker();
  updateDpMultiBar();
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
  // v3.6.45 家政考勤·上户日期（单选）
  if (_dpMode === 'hkStart') {
    if (!_dpSelected) { showToast('请先选择日期'); return; }
    hkSetStartDate(_dpPerson, _dpSelected);
    showToast('已设置上户日期');
    hideModal('historyDatePickerModal');
    return;
  }
  // v3.6.45 家政考勤·下户日期（单选）：设后自动清掉超出下户日期的休假
  if (_dpMode === 'hkEnd') {
    if (!_dpSelected) { showToast('请先选择日期'); return; }
    hkSetEndDate(_dpPerson, _dpSelected);
    showToast('已设置下户日期');
    hideModal('historyDatePickerModal');
    return;
  }
  // v3.6.1 家政考勤休假模式（多选，v3.6.45 起含半天 0.5）：把勾选的所有日期（含半天计数）合并进该人的休假如集
  if (_dpMode === 'nanny') {
    if (!_dpPicked.length) { showToast('请先选择日期'); return; }
    const hk = getHousekeeper();
    const person = hk[_dpPerson] || hk.nanny;
    let added = 0;
    _dpPicked.forEach(d => {
      if (!(d in person.vac)) added++;
      person.vac[d] = _dpHalf.has(d) ? 0.5 : 1;   // 已勾选同日期：半天/全天取值以本次为准
    });
    saveHousekeeper(hk);
    showToast(added ? ('已添加 ' + added + ' 天休假') : '所选日期已是休假');
    _dpPicked = []; _dpHalf = new Set();
    hideModal('historyDatePickerModal');
    return;
  }
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
  // v3.5.157 切到「早教」页时渲染列表
  if (tab === 'earlyedu') { try { renderEarlyEduTab(); } catch (e) {} }
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
  renderEarlyEduTab(); // v3.5.157 早教音频列表
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
  // v3.6.33 配置真正发生变化时：①清除补救节流（之前打开分析时补救失败过的话，立即允许重试，不用等 24h）
  // ②尝试给「无 AI label」的徽章组补概括（不用再手动打开分析）——修复「配好密钥测试通过但徽章仍规则值」。
  // 配置未变化则不重置节流：避免用户反复点「保存」反复打 API（ms_badge_cfg_sig 记录上次已补救的配置签名）。
  const _cfgSig = prov + '|' + apiKey + '|' + model + '|' + base;
  if (_cfgSig !== localStorage.getItem('ms_badge_cfg_sig')) {
    localStorage.setItem('ms_badge_cfg_sig', _cfgSig);
    localStorage.removeItem('ms_badge_ai_try');
    const _rc = loadMilestoneBadgeCache();
    if (_rc && _rc.badges && _rc.badges.some(b => b && !b.label)) msRemedyBadgeLabels(_rc.items, _rc.badges);
  }
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
  // v3.6.33 缓存键 msllm:provider:model:hash 不含 apiKey——换失效/错误的密钥后，
  // 旧成功结果会让「测试」假通过（用户以为密钥没问题，徽章补救却静默失败）。
  // 测试前先删测试文本的缓存键，保证「✓ 通过」来自真实 API 调用。
  try { localStorage.removeItem(msLLMCacheKey('宝宝今天第一次自己翻身了，好开心', cfg)); } catch {}
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
  renderNannyVacation();
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
        <div class="memo-check" onclick="toggleMemoDone(${it.id}, this)"></div>
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
const _memoPendingDone = {};   // v3.6.9 待办勾选后延迟归入已办（id -> timer）；v3.6.43 停留时长 3s→2s
function toggleMemoDone(id, el) {
  const items = getMemos(); const i = items.findIndex(x => x.id === id); if (i < 0) return;
  if (!items[i].done) {
    // 已挂起 → 二次点击视为取消勾选，撤销延迟
    if (_memoPendingDone[id]) {
      clearTimeout(_memoPendingDone[id]); delete _memoPendingDone[id];
      const r0 = el && el.closest ? el.closest('.memo-item') : null;
      if (r0) r0.classList.remove('memo-done-pending');
      if (el) { el.classList.remove('done'); el.textContent = ''; }
      return;
    }
    // v3.6.9 立即视觉标记 + 提示「已完成1件事」，停留 2s 后再真正归入已办（v3.6.43 由 3s 改 2s）
    const row = el && el.closest ? el.closest('.memo-item') : null;
    if (row) row.classList.add('memo-done-pending');
    if (el) { el.classList.add('done'); el.textContent = '✓'; }
    showToast('已完成1件事');
    _memoPendingDone[id] = setTimeout(() => {
      delete _memoPendingDone[id];
      const its = getMemos(); const j = its.findIndex(x => x.id === id); if (j < 0) return;
      if (its[j].done) return;
      const it = its[j]; it.done = true; it.date = getTodayDateStr(); its.splice(j, 1); its.unshift(it);
      saveMemos(its); renderMemo();
    }, 2000);
  } else {
    items[i].done = false; items[i].date = '';
    saveMemos(items); renderMemo();
  }
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
// v3.6.3 待办事项增加展开/收起（默认展开）
function toggleMemoTodoExpand() {
  const h = document.getElementById('memoTodoHead'), b = document.getElementById('memoTodoBody');
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

/* ---------- 家政考勤（v3.6.45 需求②；前身：育儿嫂休假 v3.6.0 → v3.6.44） ----------
 * 「育儿嫂休假」升级为「家政考勤」：下含钟点工 / 育儿嫂两个子标题，每人一份配置：
 *   { on: 是否上户(默认true), startDate: 上户日期, endDate: 下户日期, vac: { 'YYYY-MM-DD': 1|0.5 } }
 * vac 的值 1=全天休假、0.5=半天休假（v3.6.45 新增：日期选择组件支持选半天，按 0.5 计数）。
 * 展示口径（当月工作时间 = 当月1号至下户日期或当月最后一天的总天数 − 当月休假天数）：
 *   上户中(on=true)：当月=本月1号至今天；历史月=整月天数
 *   已下户(on=false)：下户日期在当月→当月1号至下户日期；否则整月天数
 * 用于：①备忘录内展示每人当月休假与工作时间；②育儿嫂工资任务按「满勤月工资÷满勤天数×当月工作天数」结算。
 * 存储键 housekeeper_v1，加密同步家庭云 `_housekeeper`；
 * 旧数据自动迁移：旧 `nanny_vacation_v1`（平铺日期数组）平移到 育儿嫂(nanny).vac（值 1），旧云键 `_nanny_vacation` 兼容读取合并。 */
const HOUSEKEEPER_KEY = 'housekeeper_v1';
const HOUSEKEEPER_CLOUD_KEY = '_housekeeper';
const NANNY_VACATION_KEY = 'nanny_vacation_v1';            // 旧键（仅迁移用，保留常量名）
const NANNY_VACATION_CLOUD_KEY = '_nanny_vacation';        // 旧云键（兼容读取）
const NANNY_MONTH_KEY = 'nanny_month_v1';   // v3.6.1 当前展示年月 YYYY-MM
const HK_PERSONS = [
  { id: 'hourly', name: '钟点工', icon: '🧹' },
  { id: 'nanny',  name: '育儿嫂', icon: '👩' }
];
function hkDefaultPerson() { return { on: true, startDate: '', endDate: '', vac: {} }; }
function hkDefault() { return { hourly: hkDefaultPerson(), nanny: hkDefaultPerson() }; }
// 旧平铺日期数组 → vac { date: 1 }（全天）
function hkVacFromList(list) {
  const vac = {};
  (Array.isArray(list) ? list : []).forEach(d => { if (typeof d === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(d)) vac[d] = 1; });
  return vac;
}
function hkPersonDef(v) {
  const p0 = hkDefaultPerson();
  if (v && typeof v === 'object') {
    p0.on = v.on !== false;                                  // 缺省=开启（默认上户中）
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
function getHousekeeper() {
  let hk = null;
  try {
    const raw = localStorage.getItem(HOUSEKEEPER_KEY);
    if (raw) {
      const p = JSON.parse(raw);
      if (p && typeof p === 'object') { hk = { hourly: hkPersonDef(p.hourly), nanny: hkPersonDef(p.nanny) }; }
    }
  } catch (e) {}
  if (!hk) {
    // 首次读取：从旧育儿嫂休假键迁移（v3.6.45 之前的数据平移到 nanny.vac）
    hk = hkDefault();
    try {
      const old = JSON.parse(localStorage.getItem(NANNY_VACATION_KEY) || '[]');
      if (Array.isArray(old) && old.length) hk.nanny.vac = hkVacFromList(old);
    } catch (e) {}
    localStorage.setItem(HOUSEKEEPER_KEY, JSON.stringify(hk));
  }
  return hk;
}
function saveHousekeeper(hk) {
  const v = hk || getHousekeeper();
  localStorage.setItem(HOUSEKEEPER_KEY, JSON.stringify(v));
  saveHousekeeperCloud();
  renderHousekeeper();
}
// ---- 兼容旧 API（育儿嫂 = 家政考勤中的 nanny 子项）：平铺日期数组视图，供旧调用方/测试使用 ----
function getNannyVacation() { return Object.keys(getHousekeeper().nanny.vac).sort(); }
function saveNannyVacation(list) {
  const hk = getHousekeeper();
  hk.nanny.vac = hkVacFromList(list);
  saveHousekeeper(hk);
}
function addNannyVacation(date) {
  const hk = getHousekeeper();
  if (date && !(date in hk.nanny.vac)) hk.nanny.vac[date] = 1;
  saveHousekeeper(hk);
}
function removeNannyVacation(date) {
  const hk = getHousekeeper();
  let hit = '';
  HK_PERSONS.forEach(p => { if (date in hk[p.id].vac) { delete hk[p.id].vac[date]; hit = p.id; } });
  saveHousekeeper(hk);
}
// v3.6.1 当前年月（默认本月），格式 YYYY-MM
function getNannyMonth() {
  const v = localStorage.getItem(NANNY_MONTH_KEY);
  if (v && /^\d{4}-\d{2}$/.test(v)) return v;
  const n = new Date();
  return n.getFullYear() + '-' + String(n.getMonth() + 1).padStart(2, '0');
}
function setNannyMonth(ym) { localStorage.setItem(NANNY_MONTH_KEY, ym); }
function nextNannyMonth(ym) {
  const m = /^(\d{4})-(\d{2})$/.exec(ym || ''); if (!m) return getNannyMonth();
  let y = +m[1], mo = +m[2] + 1; if (mo > 12) { mo = 1; y++; }
  return y + '-' + String(mo).padStart(2, '0');
}
// 某年月的自然天数
function daysInNannyMonth(ym) {
  const m = /^(\d{4})-(\d{2})$/.exec(ym || ''); if (!m) return 30;
  return new Date(+m[1], +m[2], 0).getDate();
}
// 某人当月总天数口径：
//   v3.6.45 需求②：已下户(!on)——下户日期在当月=1号至下户日期（含当天）；否则整月
//   v3.6.51 用户需求「如果上户日期在当月，当天日期减上户日期」：上户中(on)且上户日期在当月 →
//     本月天数 = 当天 − 上户日期 + 1（含两端：上户当天即开始工作计 1 天，与下户口径「1号至下户日含当天」对称）；
//     上户日期不在当月（更早月份上户）= 1号至今天；历史月=整月
function hkMonthTotalDays(person, ym) {
  const daysInMonth = daysInNannyMonth(ym);
  if (person.on) {
    const today = getTodayDateStr();
    if (ym === today.slice(0, 7)) {
      const td = parseInt(today.slice(8, 10), 10) || 1;
      const sd = person.startDate;
      if (sd && sd.slice(0, 7) === ym) {
        const sdd = parseInt(sd.slice(8, 10), 10);
        if (sdd >= 1 && sdd <= td) return td - sdd + 1;   // v3.6.51：上户日期在当月，按上户日至当天计
      }
      return td;
    }
    return daysInMonth;
  }
  const end = person.endDate;
  if (end && end.slice(0, 7) === ym) return parseInt(end.slice(8, 10), 10) || daysInMonth;
  return daysInMonth;
}
// 某人当月休假天数（0.5 计数）
function hkMonthVacDays(person, ym) {
  let v = 0;
  Object.keys(person.vac || {}).forEach(d => {
    if (d.slice(0, 7) === ym) v += (person.vac[d] === 0.5 ? 0.5 : 1);
  });
  return v;
}
// 某人当月工作天数 = 总天数 − 休假天数
function hkMonthWorkDays(person, ym) { return Math.max(0, hkMonthTotalDays(person, ym) - hkMonthVacDays(person, ym)); }
// 去掉整数小数点，便于文案展示（10 → "10"，10.5 → "10.5"）
function hkNum(n) { const v = Math.round(n * 10) / 10; return Number.isInteger(v) ? String(v) : String(v); }
// v3.6.0 工资结算默认常量（月薪 / 计薪基准天数）；v3.6.45 需求③起可在任务编辑中按人覆盖（task.baseSalary/task.payDays）
const NANNY_BASE_SALARY = 10000;
const NANNY_PAY_DIVISOR = 26;
// 把 Date 格式化为 YYYY-MM-DD（本地时区）
function fmtDateLocal(d) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}
// v3.6.45 需求③：工资 = 满勤月工资 ÷ 满勤天数 × 当月工作天数。
// 当月工作天数取家政考勤·育儿嫂（备忘录 → 家政考勤）：当月1号至下户日期或当月最后一天 − 当月休假（0.5计数）。
// 结算月 = 触发日前一天所在月（monthly 任务每月1号推=结算上月；下户提前推送时=下户当月）。
// vacList 参数保留以兼容旧调用签名（v3.6.45 起休假数据一律取家政考勤，不再由调用方传入）。
function computeWage(task, trig, vacList) {
  const base = (task && task.baseSalary > 0) ? task.baseSalary : NANNY_BASE_SALARY;
  const div = (task && task.payDays > 0) ? task.payDays : NANNY_PAY_DIVISOR;
  const dailyRate = base / div;
  const end = new Date(trig.getFullYear(), trig.getMonth(), trig.getDate());
  const ym = fmtDateLocal(new Date(end.getTime() - 86400000)).slice(0, 7);
  const person = getHousekeeper().nanny;
  const totalDays = hkMonthTotalDays(person, ym);
  const vacDays = hkMonthVacDays(person, ym);
  const workDays = hkMonthWorkDays(person, ym);
  const wage = Math.round(dailyRate * workDays);
  return { dailyRate, baseSalary: base, payDays: div, totalDays, vacDays, workDays, wage, ym,
    startStr: ym + '-01', endStr: ym + '-' + String(totalDays).padStart(2, '0') };
}
// v3.6.1 工资结算推送内容改为固定默认格式（任务编辑时无需填写内容）：
// 「YYYY-MM：休假 X 天，工作 Y 天，应发工资 Z 元，请转账。」
function wagePushContent(w) {
  const ym = (w.endStr || '').slice(0, 7);
  return `${ym}：休假 ${hkNum(w.vacDays)} 天，工作 ${hkNum(w.workDays)} 天，应发工资 ${w.wage} 元，请转账。`;
}
// ---- 家政考勤 UI ----
function hkPersonElId(id) { return 'hkPerson' + id.charAt(0).toUpperCase() + id.slice(1); }
function renderHousekeeper() {
  const hk = getHousekeeper();
  const ym = getNannyMonth();
  // v3.6.49 用户需求「家政考勤后面的数字去掉」：标题行右侧当月休假天数汇总（#nannyVacDays）
  // 不再渲染内容——保留空 span（无 min-width 不占位；待办/已办分区计数不动），
  // hkMonthVacDays 计算仍供「当月工作天数」口径使用
  const cntEl = document.getElementById('nannyVacDays');
  if (cntEl) cntEl.textContent = '';
  const monthEl = document.getElementById('nannyMonthLabel');
  if (monthEl) monthEl.textContent = ym;
  HK_PERSONS.forEach(p => renderHKPerson(p.id, hk[p.id], ym));
}
function renderHKPerson(id, person, ym) {
  const box = document.getElementById(hkPersonElId(id)); if (!box) return;
  const meta = HK_PERSONS.find(p => p.id === id) || { name: id, icon: '👩' };
  let h = '<div class="hk-sub-head"><span class="hk-sub-name">' + meta.icon + ' ' + meta.name + '</span>'
    + '<div class="toggle-switch ' + (person.on ? 'on' : '') + '" onclick="hkToggle(\'' + id + '\')" title="是否上户"></div></div>';
  if (person.on) {
    h += '<div class="hk-field-row"><span class="hk-field-label">上户日期</span>'
      + '<button class="fab-btn" type="button" onclick="openHKDatePicker(\'' + id + '\',\'start\')"><span class="fab-icon fab-emoji">📅</span>' + (person.startDate || '选择日期') + '</button></div>';
  } else {
    // v3.6.47 需求③：下户日期按钮置灰（.hk-date-btn-end）与上户日期按钮区分——上户保持 .fab-btn 原色不变
    h += '<div class="hk-field-row"><span class="hk-field-label">下户日期</span>'
      + '<button class="fab-btn hk-date-btn-end" type="button" onclick="openHKDatePicker(\'' + id + '\',\'end\')"><span class="fab-icon fab-emoji">📅</span>' + (person.endDate || '选择日期') + '</button></div>'
      + '<div class="hk-settle-tip">💰 请根据微信推送消息，结算家政当月的工资</div>';
  }
  // 当月休假与工作时间（上户中/已下户均展示，便于对账）
  h += '<div class="hk-work-line">' + ym + ' 已工作 ' + hkNum(hkMonthWorkDays(person, ym)) + ' 天（本月 '
    + hkMonthTotalDays(person, ym) + ' 天，休假 ' + hkNum(hkMonthVacDays(person, ym)) + ' 天）</div>';
  // v3.6.48 需求②：已下户时「添加」休假按钮也置灰（.hk-date-btn-end 同下户日期按钮），
  // 上户中保持 .fab-btn 原色不变（下户后仍可在日期弹窗内补选历史日期，仅入口置灰提示状态）
  h += '<div class="nanny-vac-row"><button class="fab-btn' + (person.on ? '' : ' hk-date-btn-end') + '" type="button" onclick="openHKVacPicker(\'' + id + '\')"><span class="fab-icon fab-emoji">📅</span>添加</button></div>';
  const monthVac = Object.keys(person.vac).filter(d => d.slice(0, 7) === ym).sort();
  h += '<div class="nanny-vac-list">' + (monthVac.length
    ? monthVac.map(d => '<span class="nanny-vac-chip" onclick="hkRemoveVac(\'' + id + '\',\'' + d + '\')" title="点击删除">' + d + (person.vac[d] === 0.5 ? ' <b>半天</b>' : '') + ' <b>✕</b></span>').join('')
    : '<div class="memo-empty">' + ym + ' 尚未添加休假日期</div>') + '</div>';
  box.innerHTML = h;
}
// 「是否上户」开关（样式同管理中的活动开关 .toggle-switch）
function hkToggle(id) {
  const hk = getHousekeeper();
  const p0 = hk[id]; if (!p0) return;
  p0.on = !p0.on;
  if (p0.on) p0.endDate = '';          // 重新上户：清掉下户日期，工作时间回到「1号至今/整月」口径
  saveHousekeeper(hk);
  const meta = HK_PERSONS.find(p => p.id === id);
  showToast((meta ? meta.name : id) + (p0.on ? '：上户中' : '：已下户'));
}
// 上户/下户日期（单选日期选择器，样式同添加休假日期的组件）
function openHKDatePicker(id, kind) {
  _dpMode = (kind === 'start') ? 'hkStart' : 'hkEnd';
  _dpPerson = id;
  const hk = getHousekeeper();
  const cur = (kind === 'start' ? hk[id].startDate : hk[id].endDate) || '';
  let d = cur ? new Date(cur + 'T00:00:00') : new Date();
  if (isNaN(d.getTime())) d = new Date();
  _dpViewYear = d.getFullYear(); _dpViewMonth = d.getMonth();
  _dpSelected = cur || fmtDateLocal(d);
  _dpPicked = []; _dpHalf = new Set();
  renderHistoryDatePicker();
  const q = document.getElementById('dpQuick'); if (q) q.style.display = 'none';
  const mb = document.getElementById('dpMultiBar'); if (mb) mb.style.display = 'none';
  showModal('historyDatePickerModal');
}
function hkSetStartDate(id, date) {
  const hk = getHousekeeper(); const p0 = hk[id]; if (!p0) return;
  p0.startDate = date;
  saveHousekeeper(hk);
}
// 设下户日期：自动清掉超出下户日期的休假选项（下户之后不应再有更晚的休假记录）
function hkSetEndDate(id, date) {
  const hk = getHousekeeper(); const p0 = hk[id]; if (!p0) return;
  p0.endDate = date;
  let removed = 0;
  Object.keys(p0.vac).forEach(d => { if (d > date) { delete p0.vac[d]; removed++; } });
  saveHousekeeper(hk);
  if (removed) showToast('已清理 ' + removed + ' 天超出下户日期的休假');
}
// 添加/修改当月休假（多选 + 可选半天）
function openHKVacPicker(id) {
  _dpMode = 'nanny';            // 复用 nanny 多选模式（存量语义不变），人员由 _dpPerson 指定
  _dpPerson = id;
  _dpPicked = []; _dpHalf = new Set();
  const ym = getNannyMonth();
  const mm = /^(\d{4})-(\d{2})$/.exec(ym);
  if (mm) { _dpViewYear = +mm[1]; _dpViewMonth = +mm[2] - 1; }
  else { const n = new Date(); _dpViewYear = n.getFullYear(); _dpViewMonth = n.getMonth(); }
  const hk = getHousekeeper();
  const person = hk[id];
  Object.keys(person.vac).forEach(d => {
    if (d.slice(0, 7) === ym) { _dpPicked.push(d); if (person.vac[d] === 0.5) _dpHalf.add(d); }
  });
  _dpPicked.sort();
  _dpSelected = _dpPicked[_dpPicked.length - 1] || (ym + '-01');
  renderHistoryDatePicker();
  const q = document.getElementById('dpQuick'); if (q) q.style.display = 'none';
  const mb = document.getElementById('dpMultiBar'); if (mb) mb.style.display = '';
  updateDpMultiBar();
  showModal('historyDatePickerModal');
}
// 兼容旧入口（育儿嫂休假添加）：等价于 openHKVacPicker('nanny')
function openNannyVacationPicker() { openHKVacPicker('nanny'); }
// v3.6.1 多选提示条：显示已勾选数量；v3.6.45 需求②：每个已选日期带「全天/半天」切换按钮（按 1/0.5 计数）
function updateDpMultiBar() {
  const h = document.getElementById('dpMultiHint');
  if (!h) return;
  if (_dpMode === 'nanny' && _dpPicked.length) {
    h.innerHTML = _dpPicked.map(d =>
      '<button type="button" class="dp-half-btn' + (_dpHalf.has(d) ? ' half' : '') + '" onclick="dpToggleHalf(\'' + d + '\')" title="点击切换全天/半天">'
      + d.slice(5) + ' ' + (_dpHalf.has(d) ? '半天' : '全天') + '</button>').join('');
  } else if (_dpPicked.length) {
    h.textContent = '已选 ' + _dpPicked.length + ' 天：' + _dpPicked.map(d => d.slice(5)).join('、');
  } else {
    h.textContent = '点选日期，可多选';
  }
}
function dpClearPicked() { _dpPicked = []; _dpHalf = new Set(); _dpSelected = ''; renderHistoryDatePicker(); updateDpMultiBar(); }
function hkRemoveVac(id, date) {
  const hk = getHousekeeper(); const p0 = hk[id]; if (!p0) return;
  delete p0.vac[date];
  saveHousekeeper(hk);
}
// v3.6.1 展开/收起（同已办事项）
function toggleNannyVacExpand() {
  const h = document.getElementById('nannyVacHead'), b = document.getElementById('nannyVacBody');
  if (h && b) { h.classList.toggle('open'); b.classList.toggle('open'); }
}
// v3.6.1 月度归档：工资结算推送成功后调用
// ①把育儿嫂当前年月的休假日写进备忘录「已办事项」；②清空当月休假；③当前年月切到下个月
function archiveNannyMonth(monthKey) {
  const ym = monthKey || getNannyMonth();
  const hk = getHousekeeper();
  const person = hk.nanny;
  const monthList = Object.keys(person.vac).filter(d => d.slice(0, 7) === ym).sort();
  const rest = Object.keys(person.vac).filter(d => d.slice(0, 7) !== ym);
  if (monthList.length) {
    const total = monthList.reduce((s, d) => s + (person.vac[d] === 0.5 ? 0.5 : 1), 0);
    const items = getMemos();
    items.unshift({ id: _memoNextId(), done: true, date: getTodayDateStr(),
      text: '👩 育儿嫂休假 ' + ym + '：' + monthList.join('、') + '（共 ' + hkNum(total) + ' 天）' });
    saveMemos(items);
  }
  const newVac = {};
  rest.forEach(d => { newVac[d] = person.vac[d]; });
  person.vac = newVac;
  saveHousekeeper(hk);
  setNannyMonth(nextNannyMonth(ym));
  renderHousekeeper();
  return monthList.length;
}
async function saveHousekeeperCloud() {
  if (!isSyncReady()) return;
  try {
    const key = await getCryptoKey(); if (!key) return;
    const { data, iv } = await encrypt(key, JSON.stringify(getHousekeeper()));
    await supabaseUpsert('family_config', { family_id: getFamilyId(), config_key: HOUSEKEEPER_CLOUD_KEY, encrypted_data: data, iv, last_modified: Date.now() });
  } catch (e) { console.warn('[家政考勤] 云端保存失败:', e); }
}
// 云端家政考勤合并：本地优先（同日期本地有则保留本地值），并集合并；
// 旧云键 `_nanny_vacation`（平铺数组）在无新键时兼容读取，合并进 nanny.vac。
async function loadHousekeeperCloud() {
  if (!isSyncReady()) return false;
  try {
    const key = await getCryptoKey(); if (!key) return false;
    const rows = await supabaseGet(`family_config?family_id=eq.${getFamilyId()}&config_key=eq.${HOUSEKEEPER_CLOUD_KEY}&select=encrypted_data,iv`);
    const hk = getHousekeeper();
    if (rows.length > 0 && rows[0].encrypted_data && rows[0].iv) {
      const json = await decrypt(key, rows[0].encrypted_data, rows[0].iv);
      const remote = JSON.parse(json);
      if (remote && typeof remote === 'object') {
        HK_PERSONS.forEach(p => {
          const rp = hkPersonDef(remote[p.id]);
          const lp = hk[p.id];
          Object.keys(rp.vac).forEach(d => { if (!(d in lp.vac)) lp.vac[d] = rp.vac[d]; });
          if (rp.startDate && !lp.startDate) lp.startDate = rp.startDate;
          if (rp.endDate && !lp.endDate) lp.endDate = rp.endDate;
          lp.on = lp.on && rp.on;   // 任一端标记已下户 → 合并为已下户（保守：避免给已下户的人多算工时）
        });
        saveHousekeeper(hk);
        return true;
      }
    }
    // 无新键：尝试旧云键（v3.6.45 之前的育儿嫂休假）
    const oldRows = await supabaseGet(`family_config?family_id=eq.${getFamilyId()}&config_key=eq.${NANNY_VACATION_CLOUD_KEY}&select=encrypted_data,iv`);
    if (oldRows.length > 0 && oldRows[0].encrypted_data && oldRows[0].iv) {
      const arr = JSON.parse(await decrypt(key, oldRows[0].encrypted_data, oldRows[0].iv));
      if (Array.isArray(arr)) {
        const merged = hkVacFromList(arr);
        Object.keys(merged).forEach(d => { if (!(d in hk.nanny.vac)) hk.nanny.vac[d] = 1; });
        saveHousekeeper(hk);
        return true;
      }
    }
  } catch (e) { console.warn('[家政考勤] 云端加载失败:', e); }
  return false;
}
// 兼容旧名（v3.6.45 前调用方）
async function loadNannyVacationCloud() { return loadHousekeeperCloud(); }
// 兼容旧渲染名（存量测试/旧调用方）
function renderNannyVacation() { renderHousekeeper(); }

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
// v3.5.163 体重数值统一显示格式：最多 2 位小数、去掉无意义尾随 0（6.85→6.85，6.7→6.7，7→7）
//   与历史弹窗保存精度（2 位小数）保持一致，避免录入 6.85 而图上标签显示 6.9
function fmtWeight(v) {
  const n = Number(v);
  if (!isFinite(n)) return '';
  return String(Math.round(n * 100) / 100);
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
//         录有体重的日期并进来。
//   v3.5.163 范围上界放宽到「今日」（图标题同步改为"截止今日"）：当天量了体重就能立刻出现在图上，
//         不再等到第二天；完全没有大便记录时退化为「全部体重点」，避免整图空白。
function buildWeightDualAxis(base) {
  const list = Array.isArray(base) ? base : [];
  const mk = ds => { const p = String(ds).split('-'); return { ds: ds, label: `${parseInt(p[1], 10)}/${parseInt(p[2], 10)}`, t: Date.parse(ds) }; };
  const map = new Map();
  list.forEach(p => map.set(p.t, { ds: p.ds, label: p.label, t: p.t }));
  const ts = list.map(p => p.t).filter(t => !isNaN(t));
  const lo = ts.length ? Math.min(...ts) : null;
  let hi = ts.length ? Math.max(...ts) : null;
  if (hi != null) {                                        // 右界至少到今日（与图标题口径一致）
    const todayTs = Date.parse(getTodayDateStr());
    if (!isNaN(todayTs)) hi = Math.max(hi, todayTs);
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
  // v3.5.142 折叠轴：0~100 等间隔 20（主区），>100 压缩到顶部「折叠区」，便于观察 100 以内的变化
  let foldAxis = null;
  if (opts.leftFold) {
    const F = opts.leftFold;                       // { base:100, step:20 }
    const base = F.base || 100, step = F.step || 20;
    const dMax = leftValid.length ? Math.max(...leftValid) : 0;
    lMin = 0;
    if (dMax <= base) {
      lMax = base;                                  // 全在 100 以内：常规 0~100
      lTicks = []; for (let v = 0; v <= base + 1e-6; v += step) lTicks.push(v);
    } else {
      const foldMax = Math.ceil(dMax / 50) * 50;    // 折叠区上界（取整到 50）
      lMax = foldMax;
      lTicks = []; for (let v = 0; v <= base + 1e-6; v += step) lTicks.push(v);
      lTicks.push(foldMax);
      foldAxis = { base: base, foldMax: foldMax };
    }
  } else if (opts.leftMin !== undefined && opts.leftStep) {            // 固定下限+步长（如体重趋势：min 3 step 1）
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
  const yL = v => {
    if (foldAxis) {
      // 分段：0~base 占下方 FOLD_R 比例高度（等间隔），base~foldMax 压到上方剩余高度
      const FOLD_R = 0.78;
      if (v <= foldAxis.base) return PT + ih - (v / foldAxis.base) * ih * FOLD_R;
      const span = foldAxis.foldMax - foldAxis.base || 1;
      return PT + ih * (1 - FOLD_R) - ((v - foldAxis.base) / span) * ih * (1 - FOLD_R);
    }
    return PT + ih - ((v - lMin) / (lMax - lMin)) * ih;
  };
  const yR = v => PT + ih - ((v - rMin) / (rMax - rMin)) * ih;
  const esc = s => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/'/g, "\\'").replace(/"/g, '&quot;');
  const mkMtip = id => `<g id="${id}" style="display:none" pointer-events="none"><rect rx="4" ry="4" height="20" fill="#2ecc71" stroke="rgba(255,255,255,0.45)" stroke-width="0.5"/><text class="tiptext" font-size="11" font-weight="bold" fill="#ffffff" x="6" y="14">?</text></g>`;
  const leftTipId = 'mtip' + (++_chartTipSeq);
  const rightTipId = 'mtip' + (++_chartTipSeq);
  // 网格线 + 左轴刻度（轴文字为leftAxisColor 主题色；对应折线为 leftColor 蓝）
  let grid = '', ylabels = '';
  lTicks.forEach(v => {
    const gy = yL(v).toFixed(1);
    const isFoldLine = foldAxis && Math.abs(v - foldAxis.base) < 1e-6;   // 100 分界处用虚线强调
    grid += `<line class="gridln" x1="${PL}" y1="${gy}" x2="${W - PR}" y2="${gy}" stroke="${isFoldLine ? 'rgba(255,255,255,0.22)' : 'rgba(255,255,255,0.08)'}" stroke-width="1"${isFoldLine ? ' stroke-dasharray="3 3"' : ''}/>`;
    ylabels += `<text x="${PL - 5}" y="${(parseFloat(gy) + 4).toFixed(1)}" fill="${leftAxisColor}" font-size="9" text-anchor="end">${leftFmt(v)}</text>`;
  });
  // v3.5.142 折叠区提示：在压缩区内标「⌇ 折叠」示意 y 轴在此被压缩
  if (foldAxis) {
    const fy = ((yL(foldAxis.base) + yL(foldAxis.foldMax)) / 2).toFixed(1);
    ylabels += `<text x="${PL - 5}" y="${(parseFloat(fy) + 3).toFixed(1)}" fill="${leftAxisColor}" font-size="8" text-anchor="end" opacity="0.75">⌇</text>`;
  }
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
// v3.6.44 需求⑥：里程碑条目的类型列表（兼容无 domains 字段的旧数据/徽章缓存快照，回退为主类型）
function msDomainsOf(it) { return (it && Array.isArray(it.domains) && it.domains.length) ? it.domains : [it.domain]; }
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
// v3.6.17 并发限流映射：避免里程碑首次刷新时上百条文本并行调用 LLM 触发 429 限流（计费照常发生）
async function _mapPool(items, limit, fn) {
  const ret = new Array(items.length);
  let idx = 0;
  const workers = [];
  for (let i = 0; i < Math.min(limit, items.length); i++) {
    workers.push((async () => {
      while (idx < items.length) { const j = idx++; try { ret[j] = await fn(items[j], j); } catch (e) { ret[j] = null; } }
    })());
  }
  await Promise.all(workers);
  return ret;
}
// 规则先渲染，再异步用 LLM 回写分类/短标签；无配置或全失败则保持规则结果不动
// v3.6.29 badges：本次新固化（fresh）的徽章用 AI label 美化一次；已固化组不受影响
async function enrichMilestonesWithLLM(items, badges) {
  const cfg = getAITagConfig();
  if (!cfg || !items || !items.length) return;
  const unique = []; const seen = new Set();
  for (const it of items) { if (!seen.has(it.text)) { seen.add(it.text); unique.push(it); } }
  let changed = false;
  // v3.6.29 修复：_mapPool 自 v3.6.17 起为 async（内部已逐条 try/catch 隔离失败），
  // 此处却仍用 Promise.allSettled 包住其返回的 Promise → 每次必抛 "object is not iterable"，
  // 导致 AI label 从未落盘、徽章退化为规则截断（用户反馈「突然改乱」的根因）。改为直接 await。
  await _mapPool(unique, 4, async it => {   // v3.6.17 最多 4 条并行
    const r = await classifyMilestoneLLM(it.text, cfg);
    if (!r) return;
    const dom = msDomainById(r.domainId);
    for (const x of items) { if (x.text !== it.text) continue; x.domain = dom; x.domains = [dom]; if (r.label) x.label = r.label; }
    changed = true;
  });
  if (!changed) return;
  // v3.6.29 本次新固化的徽章用 AI label 美化一次（已固化组绝不变）
  // v3.6.32 范围扩大：fresh 组 + 「已固化但无 label」的组均可美化——旧格式缓存升级/无 AI 时固化/AI 失败遗留的
  // 规则徽章，15 天刷新窗口只补新组、永远等不到 AI（用户反馈「徽章像没调 AI」的根因）；
  // 已有 AI label 的已固化组仍绝不变（固化语义优先）
  if (badges) badges.forEach(b => {
    if (!b || (!b.fresh && b.label)) return;
    const it = items.find(x => x.text === b.text);
    if (it && it.label && it.label.trim()) b.label = it.label.trim();
  });
  const badgesEl = document.getElementById('milestoneBadges');
  // v3.5.104 renderMilestoneBadges 返回的是自带 id 的整块，用 outerHTML 替换（原用 innerHTML 会造成同 id 嵌套 = 重复 ID）
  if (badgesEl) badgesEl.outerHTML = renderMilestoneBadges(items, badges);
  const tlEl = document.getElementById('milestoneTimeline');
  if (tlEl) tlEl.innerHTML = renderMilestoneInner();
}
// v3.6.33 期内补救公共逻辑：给「已固化但无 AI label」的徽章组补 AI 概括一次。
// 背景（v3.6.32 修复「徽章像没调 AI」）：旧格式缓存升级即时固化 / 无密钥进刷新窗口 / AI 失败遗留的
// 无 label 组，15 天刷新窗口只补新解锁组、永远等不到 AI。本函数被两处调用：
//   ① openAnalysis 非刷新窗口且有配置时（v3.6.32 原有路径）
//   ② saveAITagConfig 保存成功后（v3.6.33 新增：用户配好密钥不用再手动打开分析即自动补）
// 约束：不改 15 天刷新锚（保存后恢复旧锚）；ms_badge_ai_try 24h 节流防每次打开都打 API；
// 已有 AI label 的组绝不变（由 enrichMilestonesWithLLM 的过滤保证）。
// v3.6.33 失败可见性：AI 配置存在但一个组都没美化成功（调用全失败/无返回）→ 温和 toast
// （ms_badge_ai_fail_tip 24h 节流），不再无声失败让用户干等。
// opts.silent=true（openAnalysis 路径）：用户正看着徽章，成功不额外弹 toast；保存配置路径默认弹「已更新」。
function msRemedyBadgeLabels(items, badges, opts) {
  if (!items || !items.length || !badges || !badges.some(b => b && !b.label)) return Promise.resolve();
  const cfg = getAITagConfig();
  if (!cfg) return Promise.resolve();
  const _lastTry = Number(localStorage.getItem('ms_badge_ai_try') || 0);
  if (Date.now() - _lastTry <= 86400000) return Promise.resolve();   // 24h 节流中
  localStorage.setItem('ms_badge_ai_try', String(Date.now()));
  const _prevLast = localStorage.getItem(MS_BADGE_LAST_KEY);
  return enrichMilestonesWithLLM(items, badges)
    .then(() => {
      saveMilestoneBadgeCache(items, badges);
      if (_prevLast) localStorage.setItem(MS_BADGE_LAST_KEY, _prevLast);   // 补救不重置 15 天刷新锚
      if (badges.every(b => !b || !b.label)) {   // 全部组仍无 label = AI 一个都没返回
        const _lastFailTip = Number(localStorage.getItem('ms_badge_ai_fail_tip') || 0);
        if (Date.now() - _lastFailTip > 86400000) {
          localStorage.setItem('ms_badge_ai_fail_tip', String(Date.now()));
          showToast('徽章 AI 概括失败，暂按规则显示（可到 管理 → AI 设置 点「测试」检查密钥）');
        }
      } else if (!(opts && opts.silent)) {
        showToast('徽章已更新为 AI 概括');   // 保存配置路径：用户不在分析页，明确告知已生效
      }
    })
    .catch(() => {});
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
const AI_CHAT_CAP = 60;            // v3.5.155 单次对话本地保留上限提高到 60 条（≈30 轮），避免多轮对话被静默截断只显示最新几轮
const AI_CHAT_SEND_CAP = 12;       // v3.6.17 每次请求最多携带最近 12 条历史（≈6 轮）上行：长对话每轮全量重发是 token 消耗主因（界面展示仍为全部 60 条）
const KB_CHAT_BUDGET = 12000;      // v3.6.17 问答 system prompt 知识库预算（字符，权威条目优先）：默认全量发送，仅在知识库异常增大时截断，防止单轮输入无限膨胀
const AI_HIST_KEY = 'ai_chat_history_v1';
const AI_HIST_CAP = 10;            // v3.5.137 历史对话仅保留最近 10 段（此前 30）
let KB = [];
let KB_FILTER = '全部';
const kbExpanded = new Set();      // v3.5.122 知识库已展开条目的全局索引（仅控制 UI 折叠态）
let scrollKbToNew = false;         // v3.5.142 添加后滚动定位到新条目
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
  aiSyncComposerBtn();  // v3.5.150 按当前输入内容初始化右侧按钮（话筒/发送）
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
    `<div class="ai-hist-item open" data-i="${i}">`
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
  if (KB.length) {
    // v3.6.17 知识库预算截断（权威条目优先，其余按原顺序）：默认全量发送，
    // 仅在知识库异常增大时截断，防止单轮输入无限膨胀（当前 KB 约 1 万汉字，每轮问答都会全量重发）。
    const ordered = KB.filter(x => x.cat === KB_AUTH_CAT).concat(KB.filter(x => x.cat !== KB_AUTH_CAT));
    const lines = []; let len = 0;
    for (const x of ordered) {
      const line = '- [' + x.cat + '] ' + x.text;
      if (len + line.length > KB_CHAT_BUDGET && lines.length) break;
      lines.push(line); len += line.length;
    }
    kbText = '\n\n【家庭知识库（我家宝宝的具体情况与偏好，回复时务必优先考虑）】\n' + lines.join('\n');
  }
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
      // v3.6.17 只带最近 N 条历史上行（界面仍展示全部 60 条）：长对话每轮全量重发 full KB+7天记录+全部历史 是 token 消耗主因
      let _hist = AI_CHAT.filter(m => (m.role === 'me' || m.role === 'ai') && !isAIFailMsg(m))
        .map(m => ({ role: m.role === 'me' ? 'user' : 'assistant', content: m.text }))
        .slice(-AI_CHAT_SEND_CAP);
      if (_hist.length && _hist[0].role === 'assistant') _hist = _hist.slice(1);   // 首条须为用户提问
      const msgs = [{ role: 'system', content: buildAISystemPrompt() }].concat(_hist);
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
  AI_CHAT.push({ role: 'me', text: v }); el.value = ''; aiSyncComposerBtn(); saveAIChat(); renderAIMsgs();
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
  aiSyncComposerBtn();
}
// 回车发送（Shift+Enter 换行）
function aiInputKey(e) {
  if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) {
    e.preventDefault();
    sendAIMsg();
  }
}
// v3.5.150 AI 输入框右侧按钮切换：空 → 话筒（按住说话）；非空 → 发送按钮（向上箭头，点击发送）
function aiSyncComposerBtn() {
  const ta = document.getElementById('aiChatInput');
  const mic = document.getElementById('aiVoiceBtn');
  const send = document.getElementById('aiSendBtn');
  if (!ta || !mic || !send) return;
  const has = ta.value.trim().length > 0;
  mic.classList.toggle('hide', has);
  send.classList.toggle('show', has);
}
// v3.5.150 点击「发送」按钮发送（与回车等价）
function aiSendClick() {
  const ta = document.getElementById('aiChatInput');
  if (!ta || !ta.value.trim()) return;
  sendAIMsg();
}

/* ---------- 知识库（7 类 + 综合兜底；AI 自动分类；加密同步家庭云） ---------- */
function loadKBLocal() { try { KB = JSON.parse(localStorage.getItem(KB_KEY) || '[]'); } catch { KB = []; } if (!Array.isArray(KB)) KB = []; }
function saveKBLocal() { try { localStorage.setItem(KB_KEY, JSON.stringify(KB)); } catch (e) {} }

/* ==================== v3.5.132 定时任务 + 今日计划 ==================== */
const SCHED_TASKS_KEY = 'sched_tasks';
const SCHED_CLOUD_KEY = '_sched_cloud';   // v3.5.154 定时任务加密同步到家庭云（供服务端 GitHub Actions 定时推送）
const WEATHER_ADDR_KEY = 'weather_addr';
const WEATHER_ADDR_CLOUD_KEY = 'weather_addr_v1';   // 加密家庭云（地址不写死、可配置）
const WEATHER_GEO_CACHE_KEY = 'weather_geo_cache';
const SCHED_DEFAULT_ADDR = '上海市闵行区七宝镇宝南路55弄九星家园';
const SCHED_GEN_LEAD = 12 * 3600000;     // v3.6.3 起不再使用：改为每天 0 点生成「当天」计划（保留字段仅兼容旧云端 ctx）
const SCHED_PUSH_GRACE = 3 * 3600000;    // 触发后宽限 3 小时内才推送（避免补推历史）
const SCHED_GEN_COOLDOWN = 30 * 60000;   // AI 生成失败重试冷却 30 分钟
// AI 计划 prompt 版本：内容与分类结构变化时递增，可强制所有 AI 任务用最新 prompt 重新生成
// v3.6.17 升 12：与服务端 scripts/sched-push.mjs 对齐（服务端 prompt 内容同步到 v3.6.14，
// 并修复「服务端用旧 prompt 生成却标记前端版本号」导致部署后不更新的问题）。
// v3.6.50 升 14：重写【风级换算与户外/防风】段（用户需求「知识库中低于15算小风，但今日计划中16归为小风，应该以知识库为准」——
// 根因：prompt 虽写「以知识库为准」但又给出兜底数值 ≤19km/h=风小，与用户知识库自定义的 ≤15km/h=风小冲突，
// 16km/h 落在两口径之间被兜底带跑归小风）。改为：知识库自定义风速风级标准为唯一准绳（用户阈值绝对优先、
// 严禁通用气象风级表/兜底数值覆盖知识库、边界严禁四舍五入或折中），兜底仅在知识库完全无风速风级定义时启用且须声明。
// v3.6.40 升 13：新增【辅食第N天食谱推荐】规则（前后端逐字对齐 + 辅食按月龄食谱种子）。
// 注意：prompt 内容变化时须前后端同步升级此版本号（服务端 PLAN_PROMPT_VERSION）。
// 比较用数值单调语义（见 runScheduler staleVer）：云端版本更新时不本地回退重生成。
const PLAN_PROMPT_VERSION = '14'; // v3.6.50 计划prompt: 重写【风级换算与户外/防风】——风速档位判定改为「以家庭知识库中用户自定义的风速风级标准为唯一准绳」：用户阈值绝对优先、严禁通用气象风级表（蒲福风级）或 prompt 兜底数值覆盖知识库、边界严格按知识库原文（KB 定义「风小 ≤15km/h」时 16km/h 必须归下一档「风稍大」，不得四舍五入/折中）、兜底（≤19 风小）仅在知识库完全无风速风级定义时启用且须声明为兜底；摘要风档名称用知识库档位名。两侧逐字对齐，触发当天计划按新 prompt 重新生成。
let SCHED_TASKS = [];
const _pad2 = n => String(n).padStart(2, '0');

function loadSchedTasks() {
  try { SCHED_TASKS = JSON.parse(localStorage.getItem(SCHED_TASKS_KEY) || '[]'); } catch (e) { SCHED_TASKS = []; }
  if (!Array.isArray(SCHED_TASKS)) SCHED_TASKS = [];
}
function saveSchedTasks() {
  try { localStorage.setItem(SCHED_TASKS_KEY, JSON.stringify(SCHED_TASKS)); } catch (e) {}
  scheduleSchedCloudSave();   // v3.5.154 任务变化时同步到家庭云
}
/* v3.5.154 定时任务加密同步到家庭云（config_key=_sched_cloud）。
 * 内容 = 任务数组 + 生成计划所需上下文（AI密钥/推送token+topic/天气地址/身高体重/宝宝档案/知识库）。
 * 服务端（GitHub Actions）用家庭码派生密钥解密后，即可在「无需打开网页」时准时推送。
 * v3.6.6 根治 0 点档「今日计划不更新/不可编辑」第二层根因——此前只有推送、没有拉取：
 *   ① 服务端 0 点生成的当天计划，手机端因从不拉取而看不到，首页/任务卡停留旧计划被锁死；
 *   ② _schedCloudLast 是内存变量、刷新即重置 → 每次开 app 约 1.5s 后必把本地陈旧状态
 *      （genDate 还是昨天）全量推回云端，覆盖服务端刚生成的计划（服务端日志里 0 点后
 *      反复重新生成即由此而来）。现在：开 app 先拉取合并，拉取完成前不推送。 */
let _schedCloudTimer = null;
let _schedCloudLast = '';
let _schedCloudCtx = null;               // v3.6.6 最近一次拉到的云端 ctx（本地缺配置时兜底，避免把空配置推上云）
let _schedCloudPullPromise = null;       // v3.6.6 开 app 后的首次云端拉取（完成前不推送）
let _schedCloudPullSettled = false;      // v3.6.6 首次拉取已结束（成功或失败）
let _schedCloudPending = false;          // v3.6.48 需求①：有待同步变更但 sync 未就绪（无网/无密钥）——旧逻辑静默丢弃且不补传，
                                          // 导致关闭任务后同步从未发生、服务端照旧数据推送；就绪后由 runScheduler 补传
let _schedCloudLastPull = 0;             // v3.6.48 需求①：最近一次成功拉到云端数据的时刻（上传前陈旧检查用）
function scheduleSchedCloudSave(delay) {
  if (typeof isSyncReady === 'function' && !isSyncReady()) { _schedCloudPending = true; return; }
  if (_schedCloudTimer) clearTimeout(_schedCloudTimer);
  _schedCloudTimer = setTimeout(() => {
    _schedCloudTimer = null;
    // v3.6.6 首次拉取还没回来 → 等它（最多再等 8s）再推，防止陈旧本地状态覆盖云端最新计划
    if (_schedCloudPullPromise && !_schedCloudPullSettled) {
      Promise.race([_schedCloudPullPromise, new Promise(r => setTimeout(r, 8000))])
        .then(() => saveSchedCloud().catch(() => {}));
      return;
    }
    saveSchedCloud().catch(() => {});
  }, delay == null ? 5000 : delay);
}
async function saveSchedCloud() {
  if (typeof isSyncReady !== 'function' || !isSyncReady()) { _schedCloudPending = true; return; }
  // v3.6.48 需求①：上传前若久未拉取云端（页面常开只上传不拉取），先拉一次合并，
  // 避免陈旧本地状态（如他端已关闭的任务本端还是 enabled=true）被周期性上传覆盖回云端
  if (Date.now() - _schedCloudLastPull > 180000) {
    try { await loadSchedCloud(); } catch (e) {}
  }
  try {
    const key = await getCryptoKey(); if (!key) return;
    const ai = getAITagConfig();
    const bd = BIRTH_DATE;
    // v3.6.6 本地没配的项用云端 ctx 兜底：避免多设备中「无密钥/无地址」的设备把服务端可用的配置覆盖成空
    const cc = _schedCloudCtx;
    const kbSrc = (KB && KB.length) ? KB : (cc && Array.isArray(cc.kb) ? cc.kb : []);
    const ctx = {
      ai: (ai && ai.apiKey) ? { base: ai.base, model: ai.model, apiKey: ai.apiKey } : (cc && cc.ai) || null,
      pushToken: localStorage.getItem('pushplus_token') || (cc && cc.pushToken) || _DEFAULT_PUSHTOKEN,
      pushTopic: localStorage.getItem('pushplus_topic') || (cc && cc.pushTopic) || _DEFAULT_PUSHTOPIC,
      weatherAddr: localStorage.getItem(WEATHER_ADDR_KEY) || (cc && cc.weatherAddr) || SCHED_DEFAULT_ADDR,
      height: localStorage.getItem('babyHeight') || '',
      weight: localStorage.getItem('babyWeight') || '',
      babyName: BABY_NAME,
      birthDate: bd.getFullYear() + '-' + _pad2(bd.getMonth() + 1) + '-' + _pad2(bd.getDate()),
      kb: kbSrc.slice(0, 50).map(x => ({ cat: x.cat, text: x.text })),
      promptVer: PLAN_PROMPT_VERSION,
      genLead: SCHED_GEN_LEAD
    };
    const body = JSON.stringify({ tasks: SCHED_TASKS, ctx: ctx });
    if (body === _schedCloudLast) return;   // 无变化则跳过，避免频繁写云端
    const { data, iv } = await encrypt(key, JSON.stringify({ tasks: SCHED_TASKS, ctx: ctx, ts: Date.now() }));
    await supabaseUpsert('family_config', { family_id: getFamilyId(), config_key: SCHED_CLOUD_KEY, encrypted_data: data, iv, last_modified: Date.now() });
    _schedCloudLast = body;
    console.log('[Sched] 定时任务已同步家庭云');
  } catch (e) { console.warn('[Sched] 定时任务云端同步失败:', e); }
}

/* v3.6.6 从家庭云拉取定时任务并合并（服务端 0 点生成的当天计划由此到达手机）。
 * 合并策略（按任务 id）：
 *   - 云端有、本地无 → 加入本地（新设备/重装恢复；本机删过的不复活，见墓碑）；
 *   - 云端 genDate 比本地新 → 整任务以云端为准（服务端只改计划字段后整组回写，其余字段本就来自某台设备）；
 *   - 其余 → 保留本地（用户在本机的编辑优先），仅当云端 pushPeriod 更新时补合并
 *     （服务端已推送 → 本机置只读、不重复推）。 */
const SCHED_TOMB_KEY = 'sched_tombstones';   // v3.6.6 已删除任务 id 墓碑（保留 30 天），防止云端旧数据把删除的任务拉回来
function _schedTombstones() {
  try {
    const arr = JSON.parse(localStorage.getItem(SCHED_TOMB_KEY) || '[]');
    const now = Date.now();
    return Array.isArray(arr) ? arr.filter(x => x && x.id != null && now - (x.ts || 0) < 30 * 86400000) : [];
  } catch (e) { return []; }
}
function _schedTombAdd(id) {
  try {
    const arr = _schedTombstones().filter(x => String(x.id) !== String(id));
    arr.push({ id: id, ts: Date.now() });
    localStorage.setItem(SCHED_TOMB_KEY, JSON.stringify(arr.slice(-100)));
  } catch (e) {}
}
async function loadSchedCloud() {
  if (typeof isSyncReady !== 'function' || !isSyncReady()) return false;
  try {
    const fid = getFamilyId(); if (!fid) return false;
    const key = await getCryptoKey(); if (!key) return false;
    // 网络超时 8s 兜底：拉不下来不影响本地调度（推送闸门也会在 8s 后放行）
    const rows = await Promise.race([
      supabaseGet(`family_config?family_id=eq.${fid}&config_key=eq.${SCHED_CLOUD_KEY}&select=encrypted_data,iv`),
      new Promise((_, rej) => setTimeout(() => rej(new Error('sched cloud timeout')), 8000))
    ]);
    if (!Array.isArray(rows) || rows.length === 0 || !rows[0].encrypted_data || !rows[0].iv) return false;
    let obj = null;
    try { obj = JSON.parse(await decrypt(key, rows[0].encrypted_data, rows[0].iv)); } catch (e) { return false; }
    if (!obj || !Array.isArray(obj.tasks)) return false;
    _schedCloudLastPull = Date.now();   // v3.6.48 需求①：拉到云端数据的时刻（saveSchedCloud 上传前陈旧检查）
    _schedCloudCtx = (obj.ctx && typeof obj.ctx === 'object') ? obj.ctx : null;
    return mergeSchedCloudTasks(obj.tasks);
  } catch (e) { console.warn('[Sched] 定时任务云端加载失败:', e); return false; }
}
function mergeSchedCloudTasks(cloudTasks) {
  if (!Array.isArray(cloudTasks) || !cloudTasks.length) return false;
  const tombIds = new Set(_schedTombstones().map(x => String(x.id)));
  let changed = false;
  const localMap = new Map();
  SCHED_TASKS.forEach(t => { if (t && t.id != null) localMap.set(t.id, t); });
  for (const ct of cloudTasks) {
    if (!ct || ct.id == null) continue;
    if (tombIds.has(String(ct.id))) continue;          // 本机删过的任务不复活
    const lt = localMap.get(ct.id);
    if (!lt) { SCHED_TASKS.push(ct); localMap.set(ct.id, ct); changed = true; continue; }
    const cg = ct.genDate || '', lg = lt.genDate || '';
    // v3.6.17 云端 genDate 更新 **或 prompt 版本更新**（如服务端用对齐后的新 prompt 重新生成）都采纳云端整任务
    const cVer = Number(ct.planVer || 0), lVer = Number(lt.planVer || 0);
    if (ct.content && (cg > lg || cVer > lVer)) {
      // 服务端 0 点生成了更新的当天计划 → 整任务以云端为准
      Object.assign(lt, ct);
      changed = true;
    } else {
      // v3.6.48 需求①：enabled 开关按 enabledTs 取新端裁决（关闭/开启均为用户显式操作）——
      // 旧逻辑只合并 pushPeriod，本机陈旧 enabled=true 会覆盖回云端 false（他端关闭被复活），
      // 服务端 cron 每 5 分钟读到 true 继续推送，即「任务已关闭但仍推送」的主因。
      const cet = Number(ct.enabledTs || 0), let2 = Number(lt.enabledTs || 0);
      if (cet > let2) { lt.enabled = !!ct.enabled; lt.enabledTs = cet; changed = true; }
      // 计划状态不更新 → 保留本地编辑；仅合并更新的推送周期标记
      const cp = ct.pushPeriod || '', lp = lt.pushPeriod || '';
      if (cp && cp > lp) { lt.pushPeriod = cp; changed = true; }
    }
  }
  if (changed) {
    saveSchedTasks();          // 落本地 + 安排云端同步（把合并结果写回，供服务端继续用）
    if (currentManageTab === 'tasks') renderSchedTasks();
    renderTodayPlanCard();     // 首页计划卡从「旧计划/未生成」刷新为服务端刚生成的当天计划
    console.log('[Sched] 已合并家庭云定时任务');
  }
  return changed;
}

/* ================= 早教音频（v3.5.157） =================
 * 存储：本地上传 → Supabase Storage 公开桶 early-edu（多设备同步）；
 *       故事 → Wikimedia 免版权音频（运行时通过 Commons API 解析直链）。
 * 元数据（名称/类型/URL）加密存 family_config._early_edu，与家庭云同步。
 * 首页：随机播放/停止（避开上一条）+ 进度条 + Media Session 锁屏控制。 */
const EARLY_EDU_KEY = '_early_edu';
const EARLY_EDU_BUCKET = 'early-edu';
/* v3.6.21 墓碑保留时长：删除后标记 deleted/deletedAt 随家庭云同步到其他设备，
 * 保留 30 天（确保各设备都拉到删除状态）后在保存时压缩清理，避免无限增长 */
const EE_TOMBSTONE_KEEP_MS = 30 * 24 * 3600 * 1000;
/* 旧字段兼容：历史存储的 type='故事' 统一归一化为 '故事(中文)' */
function eeNormalizeTypes(arr) { if (!Array.isArray(arr)) return; arr.forEach(x => { if (x && x.type === '故事') x.type = '故事(中文)'; }); }
/* v3.6.21 旧数据补 updatedAt（冲突合并按它取新版；缺省视为 addedAt） */
function eeBackfillUpdated(arr) { if (!Array.isArray(arr)) return; arr.forEach(x => { if (x && !x.updatedAt) x.updatedAt = x.addedAt || 0; }); }
/* v3.6.21 有效音频列表（过滤删除墓碑；墓碑仅用于跨设备删除同步，不参与渲染/播放/容量统计） */
function eeActiveList() { return EARLY_EDU.filter(x => !x.deleted); }
let EARLY_EDU = [];
let eeCurrentId = null, eeLastId = null;
let eeAudio = null;
let _eeSaveTimer = null, _eeLast = '';
/* v3.5.158 随机连播：播放队列 + 下标 + 播放令牌（令牌用于屏蔽 play/pause 竞态产生的过期回调） */
let eeQueue = [], eeQueueIdx = 0, eePlayToken = 0;
/* v3.6.21 连播健壮性：起播看门狗（加载挂起不死卡在「加载中」）+ 连续失败计数（失败自动跳下一首，
 * 连续 EE_MAX_FAIL_STREAK 首失败才停止并明确提示，不再无声停止）+ 播放/停止按钮防抖（连击误停）
 * v3.6.30 继续加固（用户仍反馈「设置为 5 首却连播 2 首就停」）：
 * ①看门狗 10s→15s（Supabase 冷启动/4G 慢网络下 10s 误杀）；
 * ②加载超时改为「只跳过本首、不计入连续失败」——慢网络下 3 首慢歌就误杀整条链是本案误停主机制；
 *   真正无法播放的文件仍走 error/play() reject 计数（连续 3 首停+toast）；整队超时也有 toast 兜底；
 * ③同一 src 的 ended 只认第一次——部分 WebView（微信 X5）pause()/currentTime 归零后会重发 ended 导致莫名跳首；
 * ④系统/锁屏暂停只暂停不散队（mediaSession pause 旧逻辑直接 eeStop 清队列），点按钮可继续当前队列。 */
let EE_WATCHDOG_MS = 15000;
const EE_MAX_FAIL_STREAK = 3;
let _eeFailStreak = 0, _eeFailArmed = false, _eeFailTip = '', _eeWatchdog = null, _eeLastToggleTs = 0;
let _eeTimeoutStreak = 0;          // v3.6.30 连续加载超时计数（独立于硬失败，仅整队都超时才停+提示）
let _eeLastEndedSrc = '', _eeLastEndedTs = 0;   // v3.6.30 防同一 src 重复 ended
let _eePlaying = false;                         // v3.6.35 playing 事件已派达（真正出声才算起播成功）
let _eeInternalPause = false;      // v3.6.30 内部主动 pause（切歌/停止）时不刷新「已暂停」UI
let _eeWakeLock = null, _eeWakeLockPending = false;   // v3.6.31 屏幕唤醒锁（播放中持有，尽量防止自动熄屏断连播）
let _eeUserPaused = false;         // v3.6.31 用户经媒体通知主动暂停（亮屏不自动续播，尊重用户意图）
/* v3.6.37 「当天已播放」记录：随机挑曲时给当天已播过的降权（用户反馈「随机播放音频，当天已播放的，
 * 减少下一次播放的概率」）。结构 { date, ids[] }，按日期键控——非当天的记录不计（跨天自动重置）。 */
const EE_PLAYED_TODAY_KEY = 'ee_played_today';
/* v3.5.162 预取音频 / 管理分类筛选与搜索 / 上传待定分类 / 分类选择回调 */
let eePrefetchAudio = null;
const EE_TYPES = ['儿歌', '古诗', '故事(中文)', '故事(英文)'];
let eeFilterSet = new Set(EE_TYPES);
let eeSearchQuery = '';
let eePendingUploadType = null;
let eeCatPickCb = null;
/* v3.6.46 多曲循环播放：_eeLoop=当前队列播完是否回到队首循环（仅「多曲循环」模式为 true，
 * 随机连播播完即停）；eePickSet=「多曲音频循环放」弹窗已勾选的音频 id（跨筛选保留）；
 * _eePickCats=弹窗类别筛选（默认全部）、_eePickQuery=弹窗关键字搜索（小写）。 */
let _eeLoop = false;
let eePickSet = new Set();
let _eePickCats = new Set(EE_TYPES), _eePickQuery = '';
const EE_ICO_PLAY = '<svg viewBox="0 0 24 24"><polygon points="6,4 20,12 6,20"/></svg>';
const EE_ICO_STOP = '<svg viewBox="0 0 24 24"><rect x="6" y="6" width="12" height="12"/></svg>';
/* 播放音频数（管理 → 早教里可改，默认 5） */
const EE_PLAY_COUNT_KEY = 'ee_play_count';
const EE_PLAY_COUNT_TS_KEY = 'ee_play_count_ts';   // v3.6.30 本地最近一次保存的时间戳（与云端 last_modified 比较，防旧值覆盖）
const EE_PLAY_COUNT_CLOUD_KEY = '_ee_play_count';
const EE_PLAY_COUNT_DEFAULT = 5;

function eeStorageBase() { return (SYNC_CONFIG.supabaseUrl || '').replace(/\/+$/, '') + '/storage/v1'; }

async function loadEarlyEdu() {
  eeLoadSyncTs();
  try { const raw = localStorage.getItem('early_edu'); if (raw) EARLY_EDU = JSON.parse(raw) || []; } catch (e) {}
  eeNormalizeTypes(EARLY_EDU); eeBackfillUpdated(EARLY_EDU);
  if (isSyncReady()) {
    try {
      const key = await getCryptoKey(); if (!key) { eeSetSyncState('nokey'); return; }
      const rows = await supabaseGet(`family_config?family_id=eq.${getFamilyId()}&config_key=eq.${EARLY_EDU_KEY}&select=encrypted_data,iv`);
      let rowFound = false;
      if (rows.length && rows[0].encrypted_data && rows[0].iv) {
        rowFound = true;
        const json = await decrypt(key, rows[0].encrypted_data, rows[0].iv);
        const cloud = JSON.parse(json || '[]');
        // v3.6.21 行存在即合并（不再要求 cloud.length>0：全删场景云端只含墓碑，空数组/墓碑都要合）
        if (Array.isArray(cloud)) {
          const before = JSON.stringify(EARLY_EDU);
          eeNormalizeTypes(cloud); eeBackfillUpdated(cloud);
          EARLY_EDU = eeMergeEarlyEdu(EARLY_EDU, cloud);
          const after = JSON.stringify(EARLY_EDU);
          if (after !== before) { try { localStorage.setItem('early_edu', after); } catch (e) {} _eeDirty = true; }
          if (eeSameList(EARLY_EDU, cloud)) { _eeLast = after; _eeDirty = false; }   // 内容与云端一致：无需再推
        }
      }
      // v3.6.22 启动不自动上云，仅按需提示：从未同步过显示 idle，有改动显示 pending
      eeSetSyncState(_eeDirty ? 'pending' : (rowFound ? 'ok' : 'idle'));
    } catch (e) { console.warn('[早教] 云端读取失败', e); eeSetSyncState('fail'); }
    await loadEePlayCountCloud().catch(() => {});
  } else { eeSetSyncState('off'); }
}
/* ---------- 播放音频数（默认 5，可改，随家庭云同步） ---------- */
function getEePlayCount() {
  const v = parseInt(localStorage.getItem(EE_PLAY_COUNT_KEY) || '', 10);
  return (v > 0) ? Math.min(v, 99) : EE_PLAY_COUNT_DEFAULT;
}
function eeSavePlayCount(v) {
  v = parseInt(v, 10);
  if (!v || v < 1) v = EE_PLAY_COUNT_DEFAULT;
  if (v > 99) v = 99;
  localStorage.setItem(EE_PLAY_COUNT_KEY, String(v));
  localStorage.setItem(EE_PLAY_COUNT_TS_KEY, String(Date.now()));   // v3.6.30 记本地保存时刻
  const el = document.getElementById('eePlayCount'); if (el) el.value = v;
  showToast('播放音频数：' + v + ' 首');
  eeRefreshPlayHint();   // v3.6.24 管理里改播放数 → 首页连播提示语同步
  eeSavePlayCountCloud(v);
}
async function eeSavePlayCountCloud(v) {
  if (!isSyncReady()) return;
  try {
    const key = await getCryptoKey(); if (!key) return;
    const { data, iv } = await encrypt(key, JSON.stringify({ n: v }));
    await supabaseUpsert('family_config', { family_id: getFamilyId(), config_key: EE_PLAY_COUNT_CLOUD_KEY, encrypted_data: data, iv, last_modified: Date.now() });
  } catch (e) { console.warn('[早教] 播放数保存失败', e); }
}
async function loadEePlayCountCloud() {
  if (!isSyncReady()) return;
  try {
    const key = await getCryptoKey(); if (!key) return;
    const rows = await supabaseGet(`family_config?family_id=eq.${getFamilyId()}&config_key=eq.${EE_PLAY_COUNT_CLOUD_KEY}&select=encrypted_data,iv,last_modified`);
    if (rows.length && rows[0].encrypted_data && rows[0].iv) {
      const json = await decrypt(key, rows[0].encrypted_data, rows[0].iv);
      const o = JSON.parse(json || '{}');
      // v3.6.30 仅当云端比本地保存更新才覆盖——修复「本地设 5 被云端旧值悄悄改回（如 2）→ 连播只播 2 首」
      // （旧逻辑无条件覆盖：一旦某次保存上传失败/他端旧值后写，本地设置就被顶掉，且每次开 App/切前台都会复发）
      const cloudTs = Number(rows[0].last_modified || 0);
      const localTs = Number(localStorage.getItem(EE_PLAY_COUNT_TS_KEY) || 0);
      if (o && o.n && cloudTs > localTs) {
        localStorage.setItem(EE_PLAY_COUNT_KEY, String(o.n));
        localStorage.setItem(EE_PLAY_COUNT_TS_KEY, String(cloudTs));
      }
    }
  } catch (e) { console.warn('[早教] 播放数读取失败', e); }
}
/* v3.6.21 合并：同 id 取 updatedAt 更新的一版（改名/改分类可跨设备传播，旧逻辑本地优先导致他端改名被吞）；
 * 墓碑粘性——一端标记删除、另一端没有更新的改动时，删除结果传播（修复家人手机复活已删歌曲） */
function eeMergeEarlyEdu(local, cloud) {
  const map = {};
  const put = (x) => {
    if (!x || !x.id) return;
    const old = map[x.id];
    if (!old) { map[x.id] = x; return; }
    const a = old.updatedAt || 0, b = x.updatedAt || 0;
    if (b > a) { map[x.id] = x; return; }
    if (b === a && x.deleted && !old.deleted) map[x.id] = x;   // 同戳优先墓碑（删除传播）
  };
  local.forEach(put); cloud.forEach(put);
  return Object.values(map);
}
/* v3.6.22 早教音频云同步改手动：本地改动只存本机并标记「有改动未同步」；只有点「立即同步」才加密上云共享；
 * 云端拉取仍自动（启动 + 切回前台节流补拉），保证家人设备刷新 / 重开即可收到新增 / 删除 / 改名 */
let _eeSyncState = '', _eeSaveRetry = 0, _eeDirty = false;
let _eeLastSyncTs = 0;   // 最近一次成功上云时间戳（持久化，重启后仍显示「已同步 HH:MM」）
function eeLoadSyncTs() { try { _eeLastSyncTs = parseInt(localStorage.getItem('ee_last_sync_ts') || '0', 10) || 0; } catch (e) { _eeLastSyncTs = 0; } }
function eeSetSyncState(state) {
  _eeSyncState = state;
  const el = document.getElementById('eeSyncState'); if (!el) return;
  const hhmm = ts => { const t = new Date(ts); return String(t.getHours()).padStart(2, '0') + ':' + String(t.getMinutes()).padStart(2, '0'); };
  let html = '', cls = 'ee-sync-state';
  if (state === 'ok') { html = '☁️ 云端已同步' + (_eeLastSyncTs ? ' ' + hhmm(_eeLastSyncTs) : ''); cls += ' is-ok'; }
  else if (state === 'pending') { html = '☁️ 有改动未同步（点左侧「立即同步」上云共享）'; cls += ' is-warn'; }
  else if (state === 'idle') { html = '☁️ 音频列表尚未同步到云端'; }
  else if (state === 'off') { html = '☁️ 未开启家庭云同步（仅存本机）'; }
  else if (state === 'nokey') { html = '⚠️ 云端密钥异常，同步已暂停（请重新打开 App 或联系家庭管理员）'; cls += ' is-warn'; }
  else { html = '⚠️ 云端同步失败，请检查网络'; cls += ' is-warn'; }
  el.innerHTML = html;
  el.className = cls;
}
/* v3.6.22 立即同步（管理 → 早教页唯一上云入口）：先推送本地改动，再拉取云端合并 */
function eeCloudSyncNow() {
  if (!isSyncReady()) { showToast('请先在「管理 → 家庭云同步」开启同步'); return; }
  showToast('正在同步音频列表…');
  Promise.resolve(eePushEarlyEdu()).catch(() => {}).then(() => eePullCloud());
}
/* v3.6.22 推送本地音频列表上云（加密 upsert；失败 toast + 自动重试上限 2 次；成功记录同步时间戳） */
async function eePushEarlyEdu() {
  if (!isSyncReady()) { eeSetSyncState('off'); return; }
  try {
    const key = await getCryptoKey(); if (!key) { eeSetSyncState('nokey'); return; }
    const body = JSON.stringify(EARLY_EDU);
    if (body === _eeLast) { _eeDirty = false; eeSetSyncState('ok'); return; }
    const { data, iv } = await encrypt(key, body);
    await supabaseUpsert('family_config', { family_id: getFamilyId(), config_key: EARLY_EDU_KEY, encrypted_data: data, iv, last_modified: Date.now() });
    _eeLast = body; _eeSaveRetry = 0; _eeDirty = false;
    _eeLastSyncTs = Date.now();
    try { localStorage.setItem('ee_last_sync_ts', String(_eeLastSyncTs)); } catch (e) {}
    eeSetSyncState('ok');
    showToast('☁️ 音频列表已同步到云端');
  } catch (e) {
    console.warn('[早教] 云端推送失败', e);
    eeSetSyncState('fail');
    showToast('☁️ 音频列表云端同步失败，请检查网络（将自动重试）');
    if (_eeSaveRetry < 2) { _eeSaveRetry++; setTimeout(() => { eePushEarlyEdu().catch(() => {}); }, 3000); }   // v3.6.22 失败自动重试（上限 2 次）
  }
}
/* v3.6.22 列表内容比对（忽略键顺序/条目顺序）：判定本地与云端是否一致，避免误报「有改动未同步」 */
function eeSameList(a, b) {
  if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length) return false;
  const canon = arr => arr.slice().sort((x, y) => String(x.id).localeCompare(String(y.id)))
    .map(x => JSON.stringify(x, Object.keys(x).sort())).join('\u0000');
  return canon(a) === canon(b);
}
/* v3.6.22 拉取云端列表并合并（墓碑 + updatedAt），只更新本地不反推，避免覆盖他端新数据；
 * 合并产生了本地独有改动（如本机墓碑/新增）时标记待同步，提示用户点「立即同步」传播 */
async function eePullCloud() {
  if (!isSyncReady()) { eeSetSyncState('off'); return; }
  try {
    const key = await getCryptoKey(); if (!key) { eeSetSyncState('nokey'); return; }
    const rows = await supabaseGet(`family_config?family_id=eq.${getFamilyId()}&config_key=eq.${EARLY_EDU_KEY}&select=encrypted_data,iv`);
    let rowFound = false;
    if (rows.length && rows[0].encrypted_data && rows[0].iv) {
      rowFound = true;
      const json = await decrypt(key, rows[0].encrypted_data, rows[0].iv);
      const cloud = JSON.parse(json || '[]');
      if (Array.isArray(cloud)) {
        const before = JSON.stringify(EARLY_EDU);
        eeNormalizeTypes(cloud); eeBackfillUpdated(cloud);
        EARLY_EDU = eeMergeEarlyEdu(EARLY_EDU, cloud);
        const after = JSON.stringify(EARLY_EDU);
        if (after !== before) {
          try { localStorage.setItem('early_edu', after); } catch (e) {}
          _eeDirty = true;   // 拉到了他端改动，本地与上次推送快照不一致，待下次立即同步
          renderEarlyEduList(); renderEarlyEduCard();
          showToast('☁️ 音频列表已更新（来自其他设备）');
        }
        if (eeSameList(EARLY_EDU, cloud)) { _eeLast = after; _eeDirty = false; }   // 内容与云端一致：无需再推
      }
    }
    eeSetSyncState(_eeDirty ? 'pending' : (rowFound ? 'ok' : 'idle'));
  } catch (e) { console.warn('[早教] 云端拉取失败', e); eeSetSyncState('fail'); }
}
/* v3.6.21 切回前台补拉云端列表（家人手机不刷新网页也能收到新增/删除，节流 60s） */
let _eeLastPullTs = 0;
document.addEventListener('visibilitychange', () => {
  if (document.hidden) return;
  // v3.6.31 亮屏：连播队列还在 → 自动续播（黑屏/锁屏期间系统暂停只暂停不散队，见 eePause/eeResumeAfterVisible）
  if (eeCurrentId && eeQueue.length) eeResumeAfterVisible();
  const now = Date.now();
  if (now - _eeLastPullTs < 60000) return;
  _eeLastPullTs = now;
  if (isSyncReady()) eePullCloud().catch(() => {});
});
/* v3.6.22 本地保存：只写本机 + 标记「有改动未同步」——不再自动上云，上云只能点「立即同步」 */
async function saveEarlyEdu() {
  // 压缩过期墓碑（30 天前的删除标记，各设备应已同步到）
  const cutoff = Date.now() - EE_TOMBSTONE_KEEP_MS;
  const compacted = EARLY_EDU.filter(x => !(x.deleted && (x.deletedAt || 0) < cutoff));
  if (compacted.length !== EARLY_EDU.length) { EARLY_EDU = compacted; try { renderEarlyEduList(); } catch (e) {} }
  try { localStorage.setItem('early_edu', JSON.stringify(EARLY_EDU)); } catch (e) {}
  _eeDirty = true;
  eeSetSyncState(isSyncReady() ? 'pending' : 'off');
}
function scheduleEarlyEduSave() { _eeSaveRetry = 0; if (_eeSaveTimer) clearTimeout(_eeSaveTimer); _eeSaveTimer = setTimeout(() => { _eeSaveTimer = null; saveEarlyEdu().catch(() => {}); }, 800); }

/* ---------- 管理：渲染 / 筛选 / 上传 / 添加 / 删除 ---------- */
function renderEarlyEduTab() {
  renderEeCatPanel(); renderEarlyEduList();
  const pc = document.getElementById('eePlayCount'); if (pc) pc.value = getEePlayCount();
  const s = document.getElementById('eeSearch'); if (s) s.value = '';
  eeSearchQuery = '';
  eeSetSyncState(_eeSyncState || 'idle');   // v3.6.21 云同步状态行
}
// v3.5.162 管理分类下拉面板（多选 + 搜索框，交互同首页分类筛选）
function renderEeCatPanel() {
  const panel = document.getElementById('eeCatPanel');
  const allOn = eeFilterSet.size === EE_TYPES.length;
  let h = '<label class="cat-dp-item"><input type="checkbox" ' + (allOn ? 'checked' : '') + ' onchange="eeCatToggleAll(this)"> 📂 全部</label>';
  EE_TYPES.forEach(t => {
    const on = eeFilterSet.has(t);
    h += '<label class="cat-dp-item"><input type="checkbox" data-cat="' + t + '" ' + (on ? 'checked' : '') + ' onchange="eeCatToggleOne(\'' + t + '\',this)"> ' + t + '</label>';
  });
  if (panel) panel.innerHTML = h;
  const btn = document.getElementById('eeCatBtn');
  if (btn) btn.innerHTML = (allOn ? '📂 全部分类' : '📂 已选 ' + eeFilterSet.size + ' 类') + ' <span class="cat-arrow">&#9662;</span>';
}
function toggleEeCat() { const p = document.getElementById('eeCatPanel'); if (p) p.classList.toggle('open'); }
function eeCatToggleAll(cb) { eeFilterSet = cb.checked ? new Set(EE_TYPES) : new Set(); renderEeCatPanel(); renderEarlyEduList(); }
function eeCatToggleOne(t, cb) { if (cb.checked) eeFilterSet.add(t); else eeFilterSet.delete(t); renderEeCatPanel(); renderEarlyEduList(); }
function onEeSearch() { const el = document.getElementById('eeSearch'); eeSearchQuery = el ? el.value.trim().toLowerCase() : ''; renderEarlyEduList(); }
function renderEarlyEduList() {
  const list = document.getElementById('eeList'); if (!list) return;
  eeUpdateUsage();
  let items = eeActiveList().slice().sort((a, b) => (b.addedAt || 0) - (a.addedAt || 0));   // v3.6.21 过滤删除墓碑
  if (eeFilterSet.size !== EE_TYPES.length) items = items.filter(x => eeFilterSet.has(x.type));
  if (eeSearchQuery) items = items.filter(x => (x.name || '').toLowerCase().includes(eeSearchQuery));
  if (!items.length) { list.innerHTML = '<div class="ee-empty">暂无音频，点上方按钮添加</div>'; return; }
  let h = '';
  items.forEach(it => {
    const tag = it.src === 'wikimedia' ? '免版权' : '本地';
    // v3.6.20 试听状态：管理页独立播放器（与首页播放器不共用），试听中的项按钮变「停止」并标红
    const auditioning = eeAuditionId === it.id;
    h += '<div class="ee-item' + (auditioning ? ' ee-item-aud' : '') + '" data-id="' + it.id + '">'
      + '<div class="ee-info"><div class="ee-name">' + escapeHtml(it.name) + '</div>'
      + '<div class="ee-meta"><span class="ee-tag">' + it.type + '</span>' + tag
      + (it.src === 'wikimedia' ? ' · Wikimedia' : '')
      + (auditioning ? ' · <span class="ee-aud-tag">🔊 试听中</span>' : '')
      + (eeIsVideoItem(it) ? ' · 视频(仅声音)' : '')
      + (it.playable === false ? ' · <span class="ee-warn">⚠️ 可能无法播放</span>' : '')
      + '</div></div>'
      + '<div class="ee-actions">'
      + '<button class="ee-edit" onclick="eeEdit(\'' + it.id + '\')" title="编辑名称/分类"><svg viewBox="0 0 24 24"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg></button>'
      + '<button class="ee-play' + (auditioning ? ' ee-aud-ing' : '') + '" onclick="eePreview(\'' + it.id + '\')" title="' + (auditioning ? '停止试听' : '试听') + '">' + (auditioning ? '<svg viewBox="0 0 24 24"><rect x="6" y="6" width="12" height="12"/></svg>' : '<svg viewBox="0 0 24 24"><polygon points="6,4 20,12 6,20"/></svg>') + '</button>'
      + '<button class="rec-del" onclick="eeDelete(\'' + it.id + '\')" title="删除"><svg viewBox="0 0 24 24"><path d="M3 6h18"/><path d="M8 6V4h8v2"/><path d="M6 6l1 14h10l1-14"/><path d="M10 10v6"/><path d="M14 10v6"/></svg></button>'
      + '</div></div>';
  });
  list.innerHTML = h;
}
/* ---------- v3.6.15 云存储容量闸门（Supabase 免费版 Storage 1GB） ---------- */
function eeUsedBytes() {
  return eeActiveList().reduce((s, it) => {   // v3.6.21 墓碑不计入容量（文件已在删除时清掉）
    if (it && it.src === 'wikimedia') return s;   // 免版权项只存直链，不占云存储
    return s + ((it && it.size > 0) ? it.size : EE_EST_MB_PER_TRACK * 1048576);
  }, 0);
}
function eeQuotaLeftBytes() { return Math.max(0, EE_MAX_TOTAL_MB * 1048576 - eeUsedBytes()); }
function eeCheckQuota(incomingBytes) {
  const left = eeQuotaLeftBytes();
  if ((incomingBytes || 0) <= left) return { ok: true };
  const usedMB = Math.round(eeUsedBytes() / 1048576);
  const leftN = Math.floor(left / (EE_EST_MB_PER_TRACK * 1048576));
  return { ok: false, msg: '云存储空间不足（已用约 ' + usedMB + 'MB / 上限 ' + EE_MAX_TOTAL_MB + 'MB，约还可放 ' + Math.max(0, leftN) + ' 首）。请先在下方列表删除一些音频，再上传' };
}
function eeUpdateUsage() {
  const el = document.getElementById('eeUsage'); if (!el) return;
  const usedMB = eeUsedBytes() / 1048576;
  const leftN = Math.floor(eeQuotaLeftBytes() / (EE_EST_MB_PER_TRACK * 1048576));
  const usedTxt = usedMB >= 10 ? String(Math.round(usedMB)) : usedMB.toFixed(1);
  const near = usedMB >= EE_MAX_TOTAL_MB * 0.9;
  if (el.classList) el.classList.toggle('ee-usage-warn', near);
  el.innerHTML = '☁️ 云存储：已用约 ' + usedTxt + ' MB / 上限 ' + EE_MAX_TOTAL_MB + ' MB（约还可添加 ' + Math.max(0, leftN) + ' 首，超出需先删除旧音频）';
}
// v3.5.165 上传文件类型判定：audio / video / image / other
const EE_AUDIO_EXT = ['mp3', 'm4a', 'm4b', 'aac', 'wav', 'ogg', 'oga', 'opus', 'flac', 'amr', 'awb', 'caf', 'aif', 'aiff', 'wma', 'mp2', 'weba', 'mid'];
const EE_VIDEO_EXT = ['mp4', 'm4v', 'mov', '3gp', '3gpp', 'mkv', 'webm', 'avi', 'flv', 'wmv', 'mpeg', 'mpg', 'ts'];
const EE_IMAGE_EXT = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'heic', 'heif', 'bmp', 'tif', 'tiff', 'svg'];
const EE_MAX_UPLOAD_MB = 50;                      // Supabase Storage 免费版单文件上限
const EE_MAX_TOTAL_MB = 800;                      // v3.6.15 云存储总容量上限（Supabase 免费版 Storage 1GB，预留余量给数据库/其他文件/系统）
const EE_EST_MB_PER_TRACK = 4;                     // v3.6.15 单首音频估算 MB（128kbps 3-4 分钟儿歌约 3-4MB；历史无 size 记录时按此估算）
function eeFileExt(name) { const m = String(name || '').toLowerCase().match(/\.([a-z0-9]{1,5})(\?|$)/); return m ? m[1] : ''; }
// v3.6.0 上传仅支持音频（本地文件与录音，录音本质是音频文件）；视频/图片/文档一律归为 other 拦截
function eeFileKind(f) {
  const ext = eeFileExt(f && f.name);
  const mime = String((f && f.type) || '').toLowerCase();
  if (EE_AUDIO_EXT.includes(ext) || mime.startsWith('audio/')) return 'audio';
  if (mime.startsWith('image/') || EE_IMAGE_EXT.includes(ext)) return 'image';
  return 'other';
}
// v3.6.0 上传仅音频：统一以 audio/* 声明 Content-Type，保证 <audio> 正常解码
// v3.6.18 按扩展名精确判定 Content-Type（修复 m4a/wav/flac 等被误标 audio/mpeg 导致部分内核解码失败）
function eeContentTypeFor(f, kind) {
  const ext = eeFileExt(f && f.name);
  const byExt = {
    mp3: 'audio/mpeg', mpeg: 'audio/mpeg', mp2: 'audio/mpeg',
    m4a: 'audio/mp4', m4b: 'audio/mp4', aac: 'audio/aac',
    wav: 'audio/wav', ogg: 'audio/ogg', oga: 'audio/ogg', opus: 'audio/ogg',
    flac: 'audio/flac', weba: 'audio/webm', webm: 'audio/webm', amr: 'audio/amr', mid: 'audio/midi', midi: 'audio/midi'
  };
  if (byExt[ext]) return byExt[ext];
  const t = String((f && f.type) || '').toLowerCase();
  return t && t.startsWith('audio/') ? t : 'audio/mpeg';
}
/* ==================== v3.6.18 非通用音频格式上传前转码为 MP3 ====================
 * 背景：用户上传 .ogg 后在微信里报「Failed to load because no supported source was found」——
 * ogg/oga/opus/flac/amr/wma 等容器并非所有浏览器/WebView 内核都能解码（iOS 全线不支持 ogg，
 * 微信 X5 内核亦有部分格式缺失）。这些格式上传后无法播放，用户侧只能删除重来。
 * 方案：上传前用 Web Audio（decodeAudioData）解码为 PCM，再经本地 lamejs 编码为 MP3
 * （lame.min.js 为本仓库自带脚本，无外部 CDN 依赖；MP3 在所有设备均可播放，体积约 1MB/分钟）。
 * mp3/m4a/aac/wav 为通用格式，保持原样上传（不损失音质、不增大体积）。 */
const EE_TRANSCODE_EXT = ['ogg', 'oga', 'opus', 'flac', 'amr', 'awb', 'wma', 'caf', 'aif', 'aiff', 'mid', 'midi', 'weba', 'ac3', 'dts', 'ape', 'wv', 'mka', 'ra', 'rm', 'mp2'];
const EE_MP3_RATES = [8000, 11025, 12000, 16000, 22050, 24000, 32000, 44100, 48000];   // MP3 合法采样率
function eeNeedTranscode(f) { return EE_TRANSCODE_EXT.includes(eeFileExt(f && f.name)); }
function _eeReadArrayBuffer(file) {
  if (file.arrayBuffer) return file.arrayBuffer();
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result);
    r.onerror = () => reject(new Error('文件读取失败'));
    r.readAsArrayBuffer(file);
  });
}
/** 采样率不在 MP3 合法列表时线性重采样（绝大多数文件为 44100，此分支极少触发） */
function _eeResample(ch0, ch1, from, to) {
  const ratio = from / to;
  const n = Math.floor(ch0.length / ratio);
  const out0 = new Float32Array(n);
  const out1 = ch1 ? new Float32Array(n) : null;
  for (let i = 0; i < n; i++) {
    const pos = i * ratio, i0 = Math.floor(pos), i1 = Math.min(i0 + 1, ch0.length - 1), t = pos - i0;
    out0[i] = ch0[i0] * (1 - t) + ch0[i1] * t;
    if (out1) out1[i] = ch1[i0] * (1 - t) + ch1[i1] * t;
  }
  return { ch0: out0, ch1: out1 };
}
/** 把解码后的 AudioBuffer 编码为 MP3 File（失败抛错，由调用方提示用户） */
async function eeEncodeMp3(file) {
  if (typeof lamejs === 'undefined') throw new Error('格式转换组件未加载，请刷新页面后重试');
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) throw new Error('当前浏览器不支持音频解码');
  const raw = await _eeReadArrayBuffer(file);
  const actx = new AC();
  let pcm;
  try { pcm = await new Promise((res, rej) => { const p = actx.decodeAudioData(raw, res, rej); if (p && p.then) p.then(res, rej); }); }
  catch (e) { throw new Error('该音频无法在此设备解码（如 iOS 不支持 ogg），请先在电脑上转为 mp3 再上传'); }
  finally { try { actx.close && actx.close(); } catch (e) {} }
  let rate = pcm.sampleRate;
  if (EE_MP3_RATES.indexOf(rate) < 0) rate = 44100;   // 非合法采样率统一按 44.1k 输出
  let ch0 = pcm.getChannelData(0);
  let ch1 = pcm.numberOfChannels > 1 ? pcm.getChannelData(1) : null;
  if (pcm.sampleRate !== rate) { const r = _eeResample(ch0, ch1, pcm.sampleRate, rate); ch0 = r.ch0; ch1 = r.ch1; }
  const chans = ch1 ? 2 : 1;
  const enc = new lamejs.Mp3Encoder(chans, rate, 128);
  const toI16 = f => { const n = f.length, o = new Int16Array(n); for (let i = 0; i < n; i++) { const v = f[i] < -1 ? -1 : (f[i] > 1 ? 1 : f[i]); o[i] = v < 0 ? v * 0x8000 : v * 0x7FFF; } return o; };
  const i16_0 = toI16(ch0), i16_1 = ch1 ? toI16(ch1) : null;
  const blockSize = 1152, parts = [];
  for (let i = 0; i < i16_0.length; i += blockSize) {
    const a = i16_0.subarray(i, i + blockSize);
    const buf = chans === 2 ? enc.encodeBuffer(a, i16_1.subarray(i, i + blockSize)) : enc.encodeBuffer(a);
    if (buf.length) parts.push(new Uint8Array(buf.buffer, buf.byteOffset, buf.byteLength));
  }
  const end = enc.flush();
  if (end.length) parts.push(new Uint8Array(end.buffer, end.byteOffset, end.byteLength));
  const mp3 = new Blob(parts, { type: 'audio/mpeg' });
  const base = (file.name || 'audio').replace(/\.[^.]+$/, '');
  try { return new File([mp3], base + '.mp3', { type: 'audio/mpeg' }); }
  catch (e) { const b = mp3; b.name = base + '.mp3'; return b; }
}
/** 需要时把文件转码为 MP3，返回 { file, transcoded, failed }；不需要或失败按原样返回。
 * v3.6.20 failed=true 表示该文件在当前设备无法解码（转码失败）——调用方应保留提示并跳过上传，
 * 不再按原格式上传（原格式在 iOS/微信 X5 等内核播不了，传上去也是坏条目）。 */
async function eeMaybeTranscode(file) {
  if (!eeNeedTranscode(file)) return { file, transcoded: false, failed: false };
  showToast('正在转换音频格式（' + eeFileExt(file.name) + ' → mp3）…');
  try { return { file: await eeEncodeMp3(file), transcoded: true, failed: false }; }
  catch (e) {
    console.warn('[音频] 转码失败', e);
    showToast((e && e.message ? e.message : '格式转换失败') + '，该文件未加入音频列表');
    return { file, transcoded: false, failed: true };
  }
}
// 探测某个 URL 的音轨能否被当前浏览器解码（用于视频/录屏文件，避免"传上去却播不出"）
function eeProbePlayable(url, timeoutMs) {
  return new Promise(resolve => {
    let done = false;
    const a = document.createElement('audio');
    const fin = ok => { if (done) return; done = true; try { a.removeAttribute('src'); a.load && a.load(); } catch (e) {} resolve(ok); };
    const timer = setTimeout(() => fin(false), timeoutMs || 8000);
    a.addEventListener('loadedmetadata', () => { clearTimeout(timer); fin(true); });
    a.addEventListener('error', () => { clearTimeout(timer); fin(false); });
    a.preload = 'metadata';
    a.muted = true;
    a.src = url;
    try { a.load(); } catch (e) { clearTimeout(timer); fin(false); }
  });
}
function eeIsVideoItem(it) { if (!it) return false; if (it.kind) return it.kind === 'video'; return EE_VIDEO_EXT.includes(eeFileExt(it.path || it.url || '')); }
// v3.5.162 本地上传：先弹分类选择，确定后再选文件（本地上传需指定分类）
// v3.6.0 仅支持音频：本地音频文件与录音；图片/视频/文档一律拦截
function eeTriggerUpload() {
  eeOpenCatPick('选择音频分类', (t) => { eeShowRecord(t); }, '✅ 支持：网页内录音与本地音频文件 / 录音（mp3 / m4a / wav / amr…）<br>🚫 不支持：照片、视频、文档等无法播放的文件<br>💡 选「开始录音」不会弹出手机系统选择器；点「选文件」会弹出系统选择器（可能列出「录音机」「照片和视频」入口），从中选音频即可');
}
async function eeOnFiles(input) {
  const files = Array.from(input.files || []);
  input.value = '';
  if (!files.length) { eePendingUploadType = null; return; }
  const type = eePendingUploadType || '儿歌';
  eePendingUploadType = null;

  // 先按类型/体积分桶，能上传的才进队列（仅 audio 可上传；视频/图片/文档一律拦截）
  const bucket = { audio: [], image: [], other: [], big: [] };
  files.forEach(f => {
    const k = eeFileKind(f);
    if (k === 'audio') bucket.audio.push(f);
    else if (k === 'image') bucket.image.push(f);
    else if ((f.size || 0) > EE_MAX_UPLOAD_MB * 1024 * 1024) bucket.big.push(f);
    else bucket.other.push(f);   // 视频/文档等不支持类型
  });
  const list = bucket.audio;
  if (!list.length) {
    if (bucket.image.length) showToast('图片无法作为音频播放，已取消上传（请选择音频文件或录音）');
    else if (bucket.big.length) showToast('文件超过 ' + EE_MAX_UPLOAD_MB + 'MB，请先裁剪或压缩后再上传');
    else showToast('不支持的文件类型，请选择音频文件或录音（不支持图片、视频、文档）');
    return;
  }

  // v3.6.15 容量闸门：已用 + 本次待传 超过云存储上限则整批拦截，提示删除旧音频
  {
    const incoming = list.reduce((s, f) => s + (f.size || 0), 0);
    const q = eeCheckQuota(incoming);
    if (!q.ok) { showToast(q.msg); return; }
  }

  const needTc = list.some(eeNeedTranscode);
  showToast('上传中（' + list.length + ' 个）…' + (needTc ? '（ogg 等格式将自动转为 mp3）' : ''));
  let ok = 0, fail = 0;
  for (const f of list) {
    try { if (await eeUploadOne(f, type)) ok++; else fail++; }
    catch (e) { fail++; console.warn('[音频] 上传失败', e); }
  }
  scheduleEarlyEduSave(); renderEarlyEduList(); renderEarlyEduCard();
  const parts = [];
  if (ok) parts.push('已添加 ' + ok + ' 个');
  if (fail) parts.push(fail + ' 个上传失败');
  if (bucket.image.length) parts.push(bucket.image.length + ' 张图片已跳过（无法播放）');
  if (bucket.other.length) parts.push(bucket.other.length + ' 个不支持的类型已跳过');
  if (bucket.big.length) parts.push(bucket.big.length + ' 个超过 ' + EE_MAX_UPLOAD_MB + 'MB 已跳过');
  showToast(parts.length ? parts.join('，') : '上传失败，请检查网络或稍后重试');
}
// v3.5.162 分类选择弹窗（上传 / 修改分类 共用）；v3.5.165 支持可选提示行
function eeOpenCatPick(title, cb, hint) {
  eeCatPickCb = cb;
  const t = document.getElementById('eeCatPickTitle'); if (t) t.textContent = title || '选择分类';
  const h = document.getElementById('eeCatPickHint');
  if (h) { if (hint) { h.innerHTML = hint; h.style.display = ''; } else { h.innerHTML = ''; h.style.display = 'none'; } }
  // v3.6.19 本弹窗仅剩上传入口（改分类已并入 eeEditModal），默认「儿歌」
  const sel = document.getElementById('eeCatPickSelect');
  if (sel) sel.value = '儿歌';
  showModal('eeCatPickModal');
}
// v3.6.1 下拉框单选：点「确定」后取当前选中项
function eeConfirmPickCat() {
  const sel = document.getElementById('eeCatPickSelect');
  const t = (sel && sel.value) || '儿歌';
  eePickCat(t);
}
function eePickCat(t) { hideModal('eeCatPickModal'); const cb = eeCatPickCb; eeCatPickCb = null; if (cb) cb(t); }
/* ---------- v3.6.19 编辑音频：名称 + 分类（原 eeEditType 仅能改分类，用户反馈要能改名称） ---------- */
/* v3.6.47 需求②：编辑弹窗新增「默认加入多曲循环」开关（默认关；开启后该音频在多曲循环弹窗内自动勾选并置顶） */
let eeEditingId = null;
function eeEdit(id) {
  const it = EARLY_EDU.find(x => x.id === id); if (!it) return;
  eeEditingId = id;
  const nm = document.getElementById('eeEditName'); if (nm) nm.value = it.name || '';
  const tp = document.getElementById('eeEditType'); if (tp) tp.value = it.type || '儿歌';
  const sw = document.getElementById('eeEditLoopSw'); if (sw) sw.classList.toggle('on', !!it.loop);   // v3.6.47 回显开关状态
  showModal('eeEditModal');
  setTimeout(() => { try { nm.focus(); nm.select(); } catch (e) {} }, 50);   // 聚焦并全选，方便直接覆盖输入
}
/* v3.6.47 需求②：「默认加入多曲循环」开关点击（仅切视觉态，保存时随 eeSaveEdit 落盘） */
function eeEditLoopToggle() {
  const sw = document.getElementById('eeEditLoopSw');
  if (sw) sw.classList.toggle('on');
}
function eeSaveEdit() {
  const id = eeEditingId;
  const it = id ? EARLY_EDU.find(x => x.id === id) : null;
  if (!it) { eeEditingId = null; hideModal('eeEditModal'); return; }
  const nmEl = document.getElementById('eeEditName');
  const nm = (nmEl && nmEl.value || '').trim();
  if (!nm) { showToast('请输入音频名称'); return; }        // 名称为空：不关弹窗，留在原页改
  const tpEl = document.getElementById('eeEditType');
  const tp = (tpEl && tpEl.value) || it.type || '儿歌';
  const swEl = document.getElementById('eeEditLoopSw');
  const loopOn = !!(swEl && swEl.classList.contains('on'));   // v3.6.47 读取开关态
  const nameChanged = nm !== it.name;
  it.name = nm; it.type = tp;
  if (loopOn) it.loop = true; else delete it.loop;   // v3.6.47 关时删字段保持数据干净（旧数据无该字段=不加入）
  it.updatedAt = Date.now();   // v3.6.21 改名/改分类/循环标志按 updatedAt 跨设备传播
  eeEditingId = null;
  hideModal('eeEditModal');
  scheduleEarlyEduSave(); renderEarlyEduList(); renderEarlyEduCard();
  // 正在播放该音频时，同步刷新「当前播放」文案与锁屏媒体信息（否则锁屏还显示旧名）
  if (eeCurrentId === id) {
    try { eeSetNowText(eeNowPrefix() + it.type + ' · ' + it.name, true); } catch (e) {}
    eeSetMediaMetadata(it);   // v3.6.36 同步刷新锁屏媒体信息（标题/头像）
  }
  showToast(nameChanged ? ('已保存：' + nm) : ('已修改分类：' + tp));
}
async function eeUploadFile(file, path, kind) {
  if (!isSyncReady()) throw new Error('未配置家庭云（请先开启同步）');
  const base = eeStorageBase();
  const res = await fetch(base + '/object/' + EARLY_EDU_BUCKET + '/' + encodeURIComponent(path), {
    method: 'POST',
    headers: { 'apikey': SYNC_CONFIG.supabaseKey, 'Authorization': 'Bearer ' + SYNC_CONFIG.supabaseKey, 'x-upsert': 'true', 'Content-Type': eeContentTypeFor(file, kind || eeFileKind(file)) },
    body: file
  });
  if (!res.ok) { const t = await res.text(); throw new Error('上传失败 ' + res.status + ' ' + t.slice(0, 80)); }
  return base + '/object/public/' + EARLY_EDU_BUCKET + '/' + encodeURIComponent(path);
}
// v3.6.3 单个音频文件上传（本地上传 / 网页内录音共用）
async function eeUploadOne(file, type) {
  let kind = eeFileKind(file);
  if (kind !== 'audio') { showToast('不支持的文件类型，请选择音频文件或录音'); return false; }
  // v3.6.18 非通用格式（ogg/flac/amr/wma 等）先转码为 MP3 再上传：这些容器在 iOS/微信 X5 等内核
  // 无法解码，上传后也播不出（用户实测报 "Failed to load because no supported source was found"）
  { const tc = await eeMaybeTranscode(file); if (tc.failed) return false; file = tc.file; kind = eeFileKind(file); }   // v3.6.20 转码失败→保留提示并跳过，不入列表
  // v3.6.15 容量闸门兜底（录音等单文件路径也受总容量限制）
  { const q = eeCheckQuota(file.size || 0); if (!q.ok) { showToast(q.msg); return false; } }
  const ext = eeFileExt(file.name) || 'webm';
  const fid = getFamilyId() || 'default';
  const path = fid + '/ee_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7) + '.' + ext;
  const url = await eeUploadFile(file, path, kind);
  EARLY_EDU.push({ id: 'ee_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7), name: (file.name || '录音').replace(/\.[^.]+$/, ''), type, src: 'upload', kind: 'audio', playable: true, url, path, size: file.size || 0, addedAt: Date.now(), updatedAt: Date.now() });   // v3.6.21 updatedAt 供跨设备冲突合并
  scheduleEarlyEduSave(); renderEarlyEduList(); renderEarlyEduCard();
  return true;
}
/* ---------- v3.6.3 网页内录音（绕开手机系统「照片/视频」选择器） ---------- */
let _eeRecStream = null, _eeRecRec = null, _eeRecChunks = [], _eeRecTimer = null, _eeRecStart = 0, _eeRecType = '儿歌';
function eeShowRecord(type) {
  _eeRecType = type || '儿歌';
  const st = document.getElementById('eeRecStatus');
  if (st) st.textContent = '当前分类：' + _eeRecType + '，点击「开始录音」或选择本地音频文件';
  const tm = document.getElementById('eeRecTimer'); if (tm) tm.textContent = '00:00';
  const wave = document.getElementById('eeRecWave'); if (wave) wave.style.display = 'none';
  const sb = document.getElementById('eeRecStartBtn'); if (sb) sb.style.display = '';
  showModal('eeRecordModal');
}
function _eeRecCleanup() {
  if (_eeRecStream) { try { _eeRecStream.getTracks().forEach(t => t.stop()); } catch (e) {} _eeRecStream = null; }
  if (_eeRecTimer) { clearInterval(_eeRecTimer); _eeRecTimer = null; }
  _eeRecRec = null;
}
async function eeStartRecord() {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) { showToast('当前浏览器不支持录音，请改用「选文件」'); return; }
  try { _eeRecStream = await navigator.mediaDevices.getUserMedia({ audio: true }); }
  catch (e) { showToast('无法获取麦克风权限：' + (e && e.message || e)); return; }
  let mime = '';
  try {
    if (window.MediaRecorder && MediaRecorder.isTypeSupported && MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) mime = 'audio/webm;codecs=opus';
  } catch (e) {}
  try { _eeRecRec = new MediaRecorder(_eeRecStream, mime ? { mimeType: mime } : undefined); }
  catch (e) { _eeRecCleanup(); showToast('录音初始化失败：' + (e && e.message || e)); return; }
  _eeRecChunks = [];
  _eeRecRec.ondataavailable = e => { if (e.data && e.data.size) _eeRecChunks.push(e.data); };
  _eeRecRec.onstop = () => { _eeRecFinish(); };
  try { _eeRecRec.start(250); } catch (e) { _eeRecCleanup(); showToast('录音启动失败：' + (e && e.message || e)); return; }
  _eeRecStart = Date.now();
  const st = document.getElementById('eeRecStatus'); if (st) st.textContent = '录音中…（分类：' + _eeRecType + '）';
  const wave = document.getElementById('eeRecWave'); if (wave) wave.style.display = '';
  const sb = document.getElementById('eeRecStartBtn'); if (sb) sb.style.display = 'none';
  _eeRecTimer = setInterval(() => {
    const s = Math.floor((Date.now() - _eeRecStart) / 1000);
    const t = document.getElementById('eeRecTimer');
    if (t) t.textContent = String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0');
  }, 500);
}
function eeStopRecord() {
  try { if (_eeRecRec && _eeRecRec.state !== 'inactive') _eeRecRec.stop(); } catch (e) {}
  if (_eeRecTimer) { clearInterval(_eeRecTimer); _eeRecTimer = null; }
}
async function _eeRecFinish() {
  if (_eeRecStream) { try { _eeRecStream.getTracks().forEach(t => t.stop()); } catch (e) {} _eeRecStream = null; }
  _eeRecRec = null;
  if (!_eeRecChunks.length) { showToast('未录到音频，请重试'); return; }
  const mime = (_eeRecChunks[0] && _eeRecChunks[0].type) || 'audio/webm';
  let ext = 'webm';
  if (mime.indexOf('mp4') >= 0) ext = 'm4a';
  else if (mime.indexOf('ogg') >= 0 || mime.indexOf('oga') >= 0) ext = 'ogg';
  const blob = new Blob(_eeRecChunks, { type: mime });
  _eeRecChunks = [];
  let file;
  try { file = new File([blob], '录音_' + getTodayDateStr() + '.' + ext, { type: mime }); }
  catch (e) { file = blob; file.name = '录音_' + getTodayDateStr() + '.' + ext; }
  try {
    showToast('上传中…');
    await eeUploadOne(file, _eeRecType);
    showToast('已添加录音到「' + _eeRecType + '」');
    hideModal('eeRecordModal');
  } catch (e) { showToast('上传失败：' + (e && e.message || e)); }
}
function eePickFileFromRecord() {
  hideModal('eeRecordModal');
  eePendingUploadType = _eeRecType;
  const inp = document.getElementById('eeFileInput'); if (inp) inp.click();
}
function eeDelete(id) {
  const it = EARLY_EDU.find(x => x.id === id); if (!it) return;
  showConfirm('删除音频', '确定删除「' + (it.name || '该音频') + '」？删除后从早教列表移除' + (it.src === 'upload' ? '，云端文件也会一并删除' : '') + '。', () => {
    // v3.6.21 墓碑式删除：标记 deleted/deletedAt/updatedAt 而非直接移除。
    // 旧逻辑直接 splice：其他设备合并时以本地为准，会把已删除的条目复活（家人手机看不到删除）。
    // 墓碑随家庭云同步（30 天后压缩清理），存储文件仍立即删除。
    it.deleted = true; it.deletedAt = Date.now(); it.updatedAt = Date.now();
    if (it.src === 'upload' && it.path) eeDeleteFile(it.path).catch(() => {});
    if (eeCurrentId === id) eeStop();
    if (eeAuditionId === id) eeStopAudition();   // v3.6.20 删除试听中的条目 → 停止试听
    scheduleEarlyEduSave(); renderEarlyEduList(); renderEarlyEduCard();
    showToast('已删除');
  });
}
async function eeDeleteFile(path) {
  if (!isSyncReady()) return;
  try { await fetch(eeStorageBase() + '/object/' + EARLY_EDU_BUCKET + '/' + encodeURIComponent(path), { method: 'DELETE', headers: { 'apikey': SYNC_CONFIG.supabaseKey, 'Authorization': 'Bearer ' + SYNC_CONFIG.supabaseKey } }); }
  catch (e) { console.warn('[早教] 删除文件失败', e); }
}
/* ---------- v3.6.20 管理页独立试听播放器（与首页播放器完全隔离） ----------
 * 用户要求：管理里点试听，停止就在管理当前页点；首页音频卡片不能播试听的音频——
 * 两者不是同一功能、不能共用播放器。首页用 eeAudio/eeQueue/eeCurrentId（随机连播+首页UI+锁屏），
 * 试听用独立的 _eeAudAudio 单例：一次只试听一条；同项再点一次=停止；播完/失败自动复位；
 * 删除试听中的条目或关闭管理弹窗时自动停止。 */
let _eeAudAudio = null, eeAuditionId = null;
function eeAuditionAudio() {
  if (!_eeAudAudio) {
    _eeAudAudio = new Audio();
    _eeAudAudio.addEventListener('ended', () => eeStopAudition());
  }
  return _eeAudAudio;
}
function eePreview(id) {
  if (eeAuditionId === id) { eeStopAudition(); return; }      // 试听中再点一次 = 停止（就在当前页停）
  const it = EARLY_EDU.find(x => x.id === id); if (!it) return;
  const a = eeAuditionAudio();
  try { a.pause(); } catch (e) {}                              // 顶掉上一条试听
  eeAuditionId = id;
  a.src = it.url;
  try { a.currentTime = 0; } catch (e) {}
  renderEarlyEduList();                                        // 按钮切「停止」+「试听中」标记
  const p = a.play();
  if (p && p.then) p.catch(err => {
    if (eeAuditionId !== id) return;                           // 已被停止/切走，忽略过期回调
    console.warn('[早教] 试听失败', err);
    showToast('试听失败：' + (err && err.message ? String(err.message).replace(/\s*https?:\/\/\S+$/, '') : '格式可能不支持') + '，可删除后重新上传（新上传会自动转 mp3）');
    eeStopAudition();
  });
}
function eeStopAudition() {
  eeAuditionId = null;
  if (_eeAudAudio) { try { _eeAudAudio.pause(); } catch (e) {} }
  renderEarlyEduList();
}

/* ---------- 首页：随机连播 n 首 / 停止 / 切换 / 进度 / 锁屏 ---------- */
/* v3.6.21 连播失败统一处理：error 事件 / play() reject / 看门狗超时 三路归一（_eeFailArmed 防重复触发）。
 * 单曲失败自动跳下一首；连续 EE_MAX_FAIL_STREAK 首失败才停止，并明确 toast 原因（不再无声停止）。 */
function eeDisarmWatchdog() { if (_eeWatchdog) { clearTimeout(_eeWatchdog); _eeWatchdog = null; } }
function eeArmWatchdog() {
  eeDisarmWatchdog();
  _eeWatchdog = setTimeout(() => { if (_eeFailArmed) eeFailAdvance('加载超时', true); }, EE_WATCHDOG_MS);
}
function eeFailAdvance(reason, isTimeout) {
  // v3.6.37 页面在后台（切后台/锁屏）时暂不处理失败：系统拦截 play()/收回音频焦点不是文件坏，
  // 此刻走失败链会连跳 3 首直接停（「不停留在页面里播放就中断」的次要根因）。
  // 保持 armed 与看门狗、不跳首不停，等亮屏 eeResumeAfterVisible 重试；仍失败才正常计数
  if (document.hidden) return;
  if (!_eeFailArmed) return;               // 已被 playing / 停止 复位：忽略过期回调
  _eeFailArmed = false; eeDisarmWatchdog();
  if (isTimeout) {
    // v3.6.30 加载超时不计入连续失败——慢网络（Supabase 冷启动/4G）下 3 首慢歌就误杀整条连播链，
    // 正是「设置为 5 首却连播 2 首就停」的误停机制；超时只跳过本首（队列有限，不会死循环）。
    // 兜底：整队连续超时（上限 8 次）仍停止并明确提示，避免完全无感知。
    _eeTimeoutStreak++;
    console.warn('[早教] 连播第 ' + (eeQueueIdx + 1) + ' 首加载超时，跳过（连续超时 ' + _eeTimeoutStreak + ' 次，不计入失败）');
    if (_eeTimeoutStreak >= Math.min(Math.max(eeQueue.length, 1), 8)) {
      showToast('连播已停止：网络较慢，连续 ' + _eeTimeoutStreak + ' 首加载超时，请检查网络后重试');
      eeStop(); return;
    }
  } else {
    _eeFailStreak++; _eeTimeoutStreak = 0;
    console.warn('[早教] 连播第 ' + (eeQueueIdx + 1) + ' 首失败：' + reason + '（连续 ' + _eeFailStreak + ' 次）');
    if (_eeFailStreak >= EE_MAX_FAIL_STREAK) {
      showToast('连播已停止：' + reason + _eeFailTip + '（连续 ' + _eeFailStreak + ' 首无法播放，请检查网络，或删除后重新上传）');
      eeStop(); return;
    }
  }
  if (eeQueueIdx < eeQueue.length - 1) { eeAdvanceQueue(); return; }   // 单曲失败自动跳下一首
  if (isTimeout) { showToast('最后一首加载超时，连播结束（网络较慢可重试）'); eeStop(); return; }
  showToast('播放失败：' + reason + _eeFailTip + '，可删除后重新上传');
  eeStop();
}
function eeEnsureAudio() {
  if (eeAudio) return eeAudio;
  eeAudio = new Audio();
  eeAudio.preload = 'auto';   // v3.5.162 预加载，缓解首屏点击播放的等待
  eeAudio.addEventListener('timeupdate', () => {
    if (!eeAudio.duration || isNaN(eeAudio.duration)) return;
    const fill = document.getElementById('eeProgressFill'); if (fill) fill.style.width = (eeAudio.currentTime / eeAudio.duration * 100) + '%';
    const t = document.getElementById('eeTime'); if (t) t.textContent = eeFmtTime(eeAudio.currentTime) + ' / ' + eeFmtTime(eeAudio.duration);
  });
  // v3.6.30 同一 src 的 ended 只认第一次——部分 WebView（微信 X5）在 pause()/currentTime 归零后会重发 ended，
  // 不防的话连播会莫名跳一首/首数对不上
  eeAudio.addEventListener('ended', () => {
    // v3.6.37 「真实播完」守卫：切歌会换 src、进度归零（媒体 load algorithm），切后台/锁屏期间
    // 积压的 ended 事件在恢复可见时补发——此刻 audio 已是下一首、进度为 0，并非真的播完。
    // 不守卫的话每个补发的 ended 都触发 eeAdvanceQueue 跳一首，5 首队列被几跳耗尽即 eeStop，
    // 即用户反馈的「如果不停留在小咕噜的日常页面，播放音乐不到 5 首就中断」
    // （v3.6.30 的同 src 1s 防重只挡同一 src 的重复，挡不住切歌后不同 src 的积压事件）
    if (!(eeAudio.ended || (eeAudio.duration && isFinite(eeAudio.duration) && eeAudio.currentTime >= eeAudio.duration - 0.3))) return;
    const src = eeAudio.src || '';
    const now = Date.now();
    if (src && src === _eeLastEndedSrc && now - _eeLastEndedTs < 1000) return;
    _eeLastEndedSrc = src; _eeLastEndedTs = now;
    eeAdvanceQueue();
  }); // 播完自动接下一首，队列播完则停止
  // v3.6.21 真正出声才算起播成功：复位失败计数并撤看门狗；
  // error 事件（src 加载失败）此前无处理——会死停在本首、后续队列全部作废（「播了 2 首就停」根因之一）
  eeAudio.addEventListener('playing', () => { _eePlaying = true; _eeFailStreak = 0; _eeTimeoutStreak = 0; _eeFailArmed = false; eeDisarmWatchdog(); });
  eeAudio.addEventListener('error', () => {
    if (_eeFailArmed) { console.warn('[早教] 音频元素 error', eeAudio.error && eeAudio.error.code); eeFailAdvance('音频加载失败'); }
  });
  eeAudio.addEventListener('pause', () => {
    if ('mediaSession' in navigator) { try { navigator.mediaSession.playbackState = 'paused'; } catch (e) {} }
    // v3.6.35 切歌/恢复竞态守卫：pause() 后紧接着又 play()（换 src 起播新曲 / 用户恢复播放）时，
    // pause 事件是【异步派达】的——派达瞬间 audio 其实已恢复播放。这不是「系统暂停」，
    // 绝不能把 UI 打成「已暂停」：加载中的新曲会停在假「已暂停」数秒，用户见状点「播放」，
    // 会被 eeToggle 的「!paused → 正在播放 → eeStop」判定误停整条连播链，且再点只能重开新队列——
    // 即用户反馈的「连播 2 首就停、无法继续播放」（v3.6.30 的 _eeInternalPause 是同步标志，
    // finally 里先于 pause 事件复位，挡不住异步派达；本守卫按 audio 真实播放态判断，从根上消除）
    if (!eeAudio.paused) return;
    if (!_eeInternalPause && eeCurrentId && eeQueue.length) {
      eeReleaseWakeLock();   // v3.6.31 已被系统暂停：释放屏幕锁省电，亮屏续播时再申请
      const it = EARLY_EDU.find(x => x.id === eeCurrentId);
      eeSetNowText('已暂停：' + (it ? it.type + ' · ' + it.name : ''), false);
      const lbl = document.getElementById('eePlayLabel'); if (lbl) lbl.textContent = '播放';
      const ico = document.getElementById('eeIco'); if (ico) ico.innerHTML = EE_ICO_PLAY;
    }
  });
  eeAudio.addEventListener('play', () => { if ('mediaSession' in navigator) { try { navigator.mediaSession.playbackState = 'playing'; } catch (e) {} } });
  return eeAudio;
}
function eeFmtTime(s) { s = Math.max(0, Math.floor(s || 0)); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); }
/* v3.5.162 统一设置「正在播放/加载中」文本，并切换高亮色 */
function eeSetNowText(text, playing) {
  const now = document.getElementById('eeNowText'); if (!now) return;
  now.textContent = text || '';
  if (playing) now.classList.add('playing'); else now.classList.remove('playing');
}
/* v3.5.162 预取队列中下一首的直链，使自动连播切换更快（点播放没反应/下一首慢的主要优化点） */
function eePrefetchNext() {
  try {
    const ni = eeQueueIdx + 1;
    let nid = ni < eeQueue.length ? eeQueue[ni] : null;
    if (nid == null && _eeLoop && eeQueue.length) nid = eeQueue[0];   // v3.6.46 循环模式：下一首=队首
    if (!nid) return;
    const nx = EARLY_EDU.find(x => x.id === nid);
    if (!nx || !nx.url) return;
    if (eePrefetchAudio && eePrefetchAudio.src && eePrefetchAudio.src.indexOf(encodeURIComponent(nx.url)) === -1) { try { eePrefetchAudio.src = ''; } catch (e) {} }
    if (!eePrefetchAudio) { eePrefetchAudio = new Audio(); eePrefetchAudio.preload = 'auto'; }
    eePrefetchAudio.src = nx.url;   // 浏览器开始在后台缓冲，下一首几乎可瞬时起播
  } catch (e) {}
}
function eeToggle() {
  // v3.6.21 防抖：连击/幽灵点击会在 transition 期间误触停止（「播了 2 首就停」根因之一）
  const nowTs = Date.now();
  if (nowTs - _eeLastToggleTs < 400) return;
  _eeLastToggleTs = nowTs;
  if (eeAudio && !eeAudio.paused && !eeAudio.ended) { eeStop(); return; }
  // v3.6.30 暂停中（系统/锁屏暂停）且队列还在 → 从当前这首继续，而不是重开新队列
  if (eeCurrentId && eeQueue.length && eeQueueIdx < eeQueue.length) {
    const it = EARLY_EDU.find(x => x.id === eeCurrentId) || EARLY_EDU.find(x => x.id === eeQueue[eeQueueIdx]);
    eeSetNowText(eeNowPrefix() + (it ? it.type + ' · ' + it.name : ''), true);
    const lbl = document.getElementById('eePlayLabel'); if (lbl) lbl.textContent = '停止';
    const ico = document.getElementById('eeIco'); if (ico) ico.innerHTML = EE_ICO_STOP;
    _eeInternalPause = false;
    _eeUserPaused = false;   // v3.6.31 用户手动恢复：清「主动暂停」标志，亮屏续播逻辑随之恢复生效
    const p = eeAudio.play();
    if (p && p.then) p.catch(() => eePlayN());
    eeRequestWakeLock();     // v3.6.31 恢复播放：补屏幕唤醒锁
    return;
  }
  // v3.6.46 未播放：不再直接随机开播，先出「随机 / 多曲循环」下拉，由用户选播放模式（v3.6.47 需求①「指定循环」改名「多曲循环」）
  eeTogglePlayMenu();
}
/* v3.6.46 播放模式文案前缀：多曲循环模式显示「循环播放：」，随机连播显示「正在播放：」 */
function eeNowPrefix() { return _eeLoop ? '循环播放：' : '正在播放：'; }
/* v3.6.46 播放模式下拉开关：未播放时点「播放」出菜单（随机/多曲循环）；点菜单外区域关闭 */
function eeTogglePlayMenu() {
  const m = document.getElementById('eePlayMenu');
  if (m) m.classList.toggle('open');
}
function _eeClosePlayMenu() { const m = document.getElementById('eePlayMenu'); if (m) m.classList.remove('open'); }
/* v3.6.46 随机播放=原 v3.6.45 及以前的「点播放即随机连播」逻辑（播放音频数 N 首，播完即停） */
function eeStartRandom() {
  _eeClosePlayMenu();
  eePlayN();
}
/* v3.6.46 多曲循环（v3.6.47 需求①前称「指定循环」）：打开「多曲音频循环放」弹窗（类别筛选 + 关键字搜索 + 勾选多选，样式同添加记录） */
function openEePickModal() {
  _eeClosePlayMenu();
  if (!eeActiveList().length) { showToast('请先在「管理 → 早教」添加音频'); return; }
  // v3.6.47 需求②：管理音频编辑弹窗开了「默认加入多曲循环」的音频，在此自动勾选（打开即预填）
  eePickSet = new Set(eeActiveList().filter(x => x.loop).map(x => x.id));
  _eePickCats = new Set(EE_TYPES);
  _eePickQuery = '';
  const s = document.getElementById('eePickSearch'); if (s) s.value = '';
  renderEePickCatPanel();
  renderEePickList();
  showModal('eePickModal');
}
function toggleEePickCat() { const p = document.getElementById('eePickCatPanel'); if (p) p.classList.toggle('open'); }
/* v3.6.46 多曲弹窗类别下拉面板（多选 + 全选，交互同管理音频页分类筛选） */
function renderEePickCatPanel() {
  const panel = document.getElementById('eePickCatPanel');
  const allOn = _eePickCats.size === EE_TYPES.length;
  let h = '<label class="cat-dp-item"><input type="checkbox" ' + (allOn ? 'checked' : '') + ' onchange="eePickCatToggleAll(this)"> 📂 全部</label>';
  EE_TYPES.forEach(t => {
    const on = _eePickCats.has(t);
    h += '<label class="cat-dp-item"><input type="checkbox" data-cat="' + t + '" ' + (on ? 'checked' : '') + ' onchange="eePickCatToggleOne(\'' + t + '\',this)"> ' + t + '</label>';
  });
  if (panel) panel.innerHTML = h;
  const btn = document.getElementById('eePickCatBtn');
  if (btn) btn.innerHTML = (allOn ? '📂 全部分类' : '📂 已选 ' + _eePickCats.size + ' 类') + ' <span class="cat-arrow">&#9662;</span>';
}
function eePickCatToggleAll(cb) { _eePickCats = cb.checked ? new Set(EE_TYPES) : new Set(); renderEePickCatPanel(); renderEePickList(); }
function eePickCatToggleOne(t, cb) { if (cb.checked) _eePickCats.add(t); else _eePickCats.delete(t); renderEePickCatPanel(); renderEePickList(); }
function onEePickSearch() { const el = document.getElementById('eePickSearch'); _eePickQuery = el ? el.value.trim().toLowerCase() : ''; renderEePickList(); }
/* v3.6.46 多曲弹窗列表：仅显示音频名称（无需试听），每首前勾选框（.add-check 样式同添加记录）；
 * 已勾选状态跨筛选/搜索保留（eePickSet 不受过滤影响）；
 * v3.6.47 需求②：编辑弹窗开了「默认加入多曲循环」的音频置顶显示（稳定排序：先按 addedAt 倒序=新添加在前，
 * 再按 loop 标志分组成 loop 组在前、组内相对顺序不变——与管理页「新添加在前」口径一致） */
function renderEePickList() {
  const list = document.getElementById('eePickList'); if (!list) return;
  let items = eeActiveList().slice().sort((a, b) => (b.addedAt || 0) - (a.addedAt || 0));   // v3.6.21 过滤删除墓碑
  items.sort((a, b) => (b.loop ? 1 : 0) - (a.loop ? 1 : 0));   // v3.6.47 置顶：loop 组在前（sort 稳定，组内仍 addedAt 倒序）
  if (_eePickCats.size !== EE_TYPES.length) items = items.filter(x => _eePickCats.has(x.type));
  if (_eePickQuery) items = items.filter(x => (x.name || '').toLowerCase().includes(_eePickQuery));
  if (!items.length) { list.innerHTML = '<div class="ee-empty">没有匹配的音频</div>'; _eePickCntRefresh(); return; }
  let h = '';
  items.forEach(it => {
    const on = eePickSet.has(it.id);
    h += '<div class="add-item"><div class="add-check' + (on ? ' checked' : '') + '" onclick="toggleEePickSelect(\'' + it.id + '\')">' + (on ? '\u2713' : '') + '</div>'
      + '<div class="add-body"><div class="add-name">' + escapeHtml(it.name) + '</div></div></div>';
  });
  list.innerHTML = h;
  _eePickCntRefresh();
}
function _eePickCntRefresh() {
  const c = document.getElementById('eePickCnt');
  if (c) c.textContent = '已选 ' + eePickSet.size + ' 首';
}
function toggleEePickSelect(id) {
  if (eePickSet.has(id)) eePickSet.delete(id); else eePickSet.add(id);
  renderEePickList();
}
/* v3.6.46 确定多曲：队列=勾选音频（按列表顺序：新添加在前，与管理页一致，重复打开顺序稳定；
 * v3.6.47 需求②：默认加入多曲循环的音频排在队列最前，与弹窗内置顶显示一致），播完回队首循环；
 * 全局提示「循环播放 N 首」后返回首页起播 */
function confirmEePick() {
  if (!eePickSet.size) { showToast('请至少选择一首音频'); return; }
  const order = eeActiveList().slice().sort((a, b) => (b.addedAt || 0) - (a.addedAt || 0));
  order.sort((a, b) => (b.loop ? 1 : 0) - (a.loop ? 1 : 0));   // v3.6.47 loop 组优先（稳定排序，组内 addedAt 倒序）
  const ids = order.filter(x => eePickSet.has(x.id)).map(x => x.id);
  hideModal('eePickModal');
  eeStartPick(ids);
}
function eeStartPick(ids) {
  if (!ids || !ids.length) return;
  _eeLoop = true;
  eeQueue = ids.slice();
  eeQueueIdx = 0;
  _eeFailStreak = 0; _eeTimeoutStreak = 0;   // v3.6.21/v3.6.30 新队列重置失败与超时计数
  _eeUserPaused = false;
  eeMarkPlayedToday(eeQueue);                // v3.6.37 本队即将播放：记入当天已播
  try { eeAutoRecordOnPlay(); } catch (e) { console.warn('[早教] 播放自动记录失败（不影响播放）', e); }
  showToast('循环播放 ' + eeQueue.length + ' 首');
  eePlayQueueItem();
}
/* v3.6.37 读取「当天已播放」计数：{ id: 次数 }；非当天/损坏数据一律视为空（跨天重置） */
function eePlayedToday() {
  try {
    const r = JSON.parse(localStorage.getItem(EE_PLAYED_TODAY_KEY) || '{}');
    if (!r || r.date !== getTodayDateStr() || !Array.isArray(r.ids)) return {};
    const cnt = {};
    for (const id of r.ids) cnt[id] = (cnt[id] || 0) + 1;
    return cnt;
  } catch (e) { return {}; }
}
/* v3.6.37 把入队/起播的曲目记入「当天已播放」（累加，不清空——当天播得越多权重越低） */
function eeMarkPlayedToday(ids) {
  try {
    let list = [];
    const r = JSON.parse(localStorage.getItem(EE_PLAYED_TODAY_KEY) || '{}');
    if (r && r.date === getTodayDateStr() && Array.isArray(r.ids)) list = r.ids.slice();
    for (const id of (ids || [])) if (id) list.push(id);
    localStorage.setItem(EE_PLAYED_TODAY_KEY, JSON.stringify({ date: getTodayDateStr(), ids: list }));
  } catch (e) {}
}
/* v3.6.37 当天已播权重：未播 1.0 / 播过 1 次 0.3 / 2 次 0.12 / ≥3 次 0.04——降权而非禁止，
 * 曲目少（如不足 5 首）时已播过的仍有机会入队，不会凑不齐一队 */
function eePlayedWeight(id, played) {
  const c = played[id] || 0;
  return c >= 3 ? 0.04 : (c === 2 ? 0.12 : (c === 1 ? 0.3 : 1.0));
}
/* v3.6.37 从候选池里按当天已播权重抽一个（不修改池；权重永不为 0，池非空必有结果） */
function eeWeightedPick(pool, played) {
  let total = 0;
  for (const x of pool) total += eePlayedWeight(x.id, played);
  let r = Math.random() * total;
  for (let j = 0; j < pool.length; j++) { r -= eePlayedWeight(pool[j].id, played); if (r <= 0) return pool[j]; }
  return pool[pool.length - 1];
}
/* 随机挑 n 首（n = 管理里「播放音频数」，默认 5），依次播放；不足则全放。
 * v3.6.37 改加权不放回抽取（用户反馈「随机播放音频，当天已播放的，减少下一次播放的概率」）：
 * 每一步在剩余曲目里按权重概率抽一首（当天已播过的降权），抽出即移出剩余池——
 * 保持原语义：只从有效（未删除）音频里挑、队列内不重复、n 不足则全放。 */
function eeShufflePick(n) {
  const pool = eeActiveList().slice();   // v3.6.21 只从有效（未删除）音频里挑
  if (!pool.length) return [];
  const played = eePlayedToday();
  const k = Math.max(1, Math.min(n, pool.length));
  const rest = pool.slice();
  const out = [];
  for (let t = 0; t < k && rest.length; t++) {
    const pick = eeWeightedPick(rest, played);
    out.push(pick);
    rest.splice(rest.indexOf(pick), 1);
  }
  return out;
}
function eePlayN() {
  if (!eeActiveList().length) { showToast('请先在「管理 → 早教」添加音频'); return; }
  _eeLoop = false;                            // v3.6.46 随机连播不循环（播完即停；循环仅「多曲循环」模式）
  eeQueue = eeShufflePick(getEePlayCount()).map(x => x.id);
  eeMarkPlayedToday(eeQueue);              // v3.6.37 本队即将播放：记入当天已播，下次随机挑曲时降权
  eeQueueIdx = 0;
  _eeFailStreak = 0; _eeTimeoutStreak = 0;   // v3.6.21/v3.6.30 新队列重置失败与超时计数
  _eeUserPaused = false;                     // v3.6.31 新队列：非用户暂停态
  try { eeAutoRecordOnPlay(); } catch (e) { console.warn('[早教] 播放自动记录失败（不影响播放）', e); }   // v3.6.35 记录异常（如云同步失败）不得阻断起播
  eePlayQueueItem();
}
/* v3.6.23 自动记录：每次点「播放」都新增去重后的记录——队列内含故事（中文/英文/古诗）只记 1 条听故事、
 * 含儿歌只记 1 条听歌（同一次播放内多首同类型合并），同一天可多次播放多次记录；
 * 切换（eeSwitch）不记录；连播自动接歌不记录。提示「已添加1条听故事/听歌记录」 */
function eeAutoRecordOnPlay() {
  if (!eeQueue.length) return;
  const items = eeQueue.map(id => EARLY_EDU.find(x => x.id === id)).filter(Boolean);
  if (!items.length) return;
  const storyLangs = [];
  if (items.some(x => x.type === '古诗' || x.type === '故事(中文)')) storyLangs.push('中文');
  if (items.some(x => x.type === '故事(英文)')) storyLangs.push('英文');
  const hasSong = items.some(x => x.type === '儿歌');
  if (!storyLangs.length && !hasSong) return;
  const now = new Date();
  const hh = String(now.getHours()).padStart(2, '0');
  const mm = String(now.getMinutes()).padStart(2, '0');
  const recTime = hh + ':' + mm;
  const ts = Date.now();
  const records = getTodayRecords();
  const added = [];
  if (storyLangs.length) {
    records.push({ type: 'listenStory', name: '听故事', time: recTime, recTime, timestamp: ts, storyLangs, storyTime: recTime, updatedAt: Date.now() });
    added.push('听故事');
  }
  if (hasSong) {
    records.push({ type: 'listenMusic', name: '听歌', time: recTime, recTime, timestamp: ts + 1, simpleTime: recTime, updatedAt: Date.now() });
    added.push('听歌');
  }
  persistRecords(records);
  afterRecordChange(getTodayDateStr());
  // 高亮本次新增记录对应的子区块
  const flashIds = [];
  if (storyLangs.length) flashIds.push('listenStory');
  if (hasSong) flashIds.push('listenMusic');
  if (flashIds.length) eeFlashMixer(flashIds);
  if (added.length === 1) showToast('已添加1条' + added[0] + '记录');
  else showToast('已添加' + added.length + '条记录（' + added.join(' / ') + '）');
}
function eePlayQueueItem() {
  const it = EARLY_EDU.find(x => x.id === eeQueue[eeQueueIdx]);
  // v3.6.35 条目不存在或已被删（墓碑，如播放途中家人设备/本机删除）：跳过，
  // 避免起播已删云端文件的 404 error 触发失败链（连续失败会误停整条连播）
  if (!it || it.deleted) { eeAdvanceQueue(); return; }
  eePlayItem(it);
}
function eeAdvanceQueue() {
  eeQueueIdx++;
  if (eeQueueIdx < eeQueue.length) { eePlayQueueItem(); return; }
  // v3.6.46 多曲循环：队列播完回到队首继续（原逻辑为 eeStop 停止）
  if (_eeLoop && eeQueue.length) { eeQueueIdx = 0; eePlayQueueItem(); return; }
  eeStop();
}
/* 切换：随机换一首（替换当前队列位，剩余连播数不变）。
 * v3.6.37 同样按当天已播权重抽（换入的曲目也要播，记入当天已播供下次降权）
 * v3.6.46 多曲循环模式下改为「队列内下一首（到队尾回队首）」——保持「循环这 N 首」语义，
 * 不把随机曲目混进指定队列；墓碑（已删）条目自动跳过。 */
function eeSwitch() {
  if (!eeActiveList().length) { showToast('请先在「管理 → 早教」添加音频'); return; }
  if (_eeLoop && eeQueue.length) {
    for (let step = 1; step <= eeQueue.length; step++) {
      const ni = (eeQueueIdx + step) % eeQueue.length;
      const cand = EARLY_EDU.find(x => x.id === eeQueue[ni]);
      if (cand && !cand.deleted) {
        eeQueueIdx = ni;
        eeMarkPlayedToday([cand.id]);   // v3.6.37 换入曲目即将播放：记入当天已播
        eePlayItem(cand);
        return;
      }
    }
    showToast('多曲循环的音频都已删除，请重新选择');
    return;
  }
  let pool = eeActiveList().slice();   // v3.6.21 只从有效（未删除）音频里挑
  if (eeCurrentId && pool.length > 1) pool = pool.filter(x => x.id !== eeCurrentId);
  const it = eeWeightedPick(pool, eePlayedToday());
  eeMarkPlayedToday([it.id]);          // v3.6.37 换入曲目即将播放：记入当天已播
  if (!eeQueue.length) { eeQueue = [it.id]; eeQueueIdx = 0; }
  else eeQueue[eeQueueIdx] = it.id;
  eePlayItem(it);
}
function eePlayItem(it) {
  const a = eeEnsureAudio();
  const token = ++eePlayToken;
  _eePlaying = false;   // v3.6.35 新曲：尚未出声（playing 事件派达才算真正起播成功）
  // v3.5.162 立即 UI 反馈：点击即把按钮切到「停止」、文案切到「加载中」，消除「点按钮没反应」的错觉
  eeSetNowText('加载中：' + it.type + ' · ' + it.name, true);
  const lbl = document.getElementById('eePlayLabel'); if (lbl) lbl.textContent = '停止';
  const ico = document.getElementById('eeIco'); if (ico) ico.innerHTML = EE_ICO_STOP;
  // v3.6.35 先撤上一首的失败监控再换 src：更换 src 会令浏览器中止旧资源，部分 WebView（微信 X5）
  // 会对旧 src 补发 error/abort——不先撤的话这些过期事件会命中新曲的 armed 状态，
  // 连续几首切歌即凑满 EE_MAX_FAIL_STREAK，误停整条连播链（「播 2-3 首就停」机制之一）
  _eeFailArmed = false; eeDisarmWatchdog();
  try { _eeInternalPause = true; a.pause(); } catch (e) {} finally { _eeInternalPause = false; }   // 先停掉上一首，避免 play() 被隐式 pause 打断
  a.src = it.url;
  try { a.currentTime = 0; } catch (e) {}
  eePrefetchNext();                        // v3.5.162 提前缓冲下一首，加速自动连播切换
  // v3.6.21 起播看门狗 + 失败提示：加载挂起不再死卡在「加载中」；10s 未出声按失败处理（跳下一首/超限停止）
  const _badExt = eeFileExt(it.url || it.path || '');
  _eeFailTip = EE_TRANSCODE_EXT.indexOf(_badExt) >= 0 ? ('（' + _badExt + ' 格式当前设备无法播放，重新上传时会自动转为 mp3）') : '';
  // v3.6.35 武装延后一个 macrotask：旧 src 的 abort/error 噪声在同一 tick 派达，延后到下一 task 即可避开；
  // 且仅当仍未真正出声（playing 事件未派达）才武装——play() resolve 不等于播放成功，
  // 出声与否一律以 playing 事件为准（v3.6.21 语义），避免误杀已在播的曲目
  setTimeout(() => {
    if (token !== eePlayToken) return;          // 已被停止/切歌取代：不武装
    if (_eePlaying) return;                     // 已真正出声：无需看护
    _eeFailArmed = true; eeArmWatchdog();
  }, 0);
  const p = a.play();
  if (!p || !p.then) return;
  p.then(() => {
    if (token !== eePlayToken) return;     // 已被更新的播放/停止动作取代，忽略过期回调
    eeCurrentId = it.id; eeLastId = it.id;
    eeRequestWakeLock();   // v3.6.31 起播成功即持屏幕唤醒锁，尽量让屏幕不熄、连播不断
    eeSetNowText(eeNowPrefix() + it.type + ' · ' + it.name, true);
    eeSetMediaMetadata(it);   // v3.6.36 锁屏/通知媒体信息（含小咕噜头像 artwork，跟随主题）
  }).catch(err => {
    if (token !== eePlayToken) return;                    // 过期请求（典型：快速停止/切换）
    if (err && err.name === 'AbortError') return;         // play/pause 竞态：静默忽略，不弹错
    // v3.6.35 早期 reject（同步/微任务，早于延后武装）兜底：令牌有效说明这次 reject 仍属当前播放动作，
    // 补上 armed 再走失败处理——避免延后武装漏掉同步 reject 后死停在本首
    _eeFailArmed = true;
    console.warn('[早教] 播放失败', err);
    // v3.6.21 统一走失败处理（与 error 事件/看门狗归一，_eeFailArmed 防重复）：跳下一首或超限停止+提示
    eeFailAdvance('播放失败' + (err && err.message ? '：' + String(err.message).replace(/\s*https?:\/\/\S+$/, '') : ''));
  });
}
function eeStop() {
  eePlayToken++;                             // 令牌自增，使未完成的 play() 回调全部失效
  _eeFailArmed = false; _eeFailStreak = 0; _eeTimeoutStreak = 0; eeDisarmWatchdog();   // v3.6.21 复位连播失败状态
  _eePlaying = false;                        // v3.6.35 停止：清「已出声」标志
  _eeUserPaused = false;                     // v3.6.31 用户主动停止：清「主动暂停」标志
  eeReleaseWakeLock();                       // v3.6.31 停止即释放屏幕唤醒锁
  eeQueue = []; eeQueueIdx = 0;
  _eeLoop = false;                           // v3.6.46 停止即退出循环模式（下次点播放重选随机/指定）
  if (eeAudio) {
    try { _eeInternalPause = true; eeAudio.pause(); } catch (e) {} finally { _eeInternalPause = false; }
    try { eeAudio.currentTime = 0; } catch (e) {}
  }
  eeCurrentId = null;
  const lbl = document.getElementById('eePlayLabel'); if (lbl) lbl.textContent = '播放';
  const ico = document.getElementById('eeIco'); if (ico) ico.innerHTML = EE_ICO_PLAY;
  const fill = document.getElementById('eeProgressFill'); if (fill) fill.style.width = '0%';
  const t = document.getElementById('eeTime'); if (t) t.textContent = '00:00 / 00:00';
  renderEarlyEduCard();
}
/* v3.6.36 锁屏/通知媒体信息 artwork：小咕噜头像跟随当前主题——
 * 深色主题用方形裁切版（photo-data-sq.webp，406x406，系统通知不裁切变形）；
 * 浅色主题用 photo-day-v3.webp（本身即 320x320 方形）。
 * 此前未设 artwork，系统通知左上角显示的是 PWA 默认图标（星星月亮），
 * 用户要求改为小咕噜头像（深色模式）。 */
function eeArtworkUrl() {
  // v3.6.44 需求⑧：锁屏/通知媒体信息图标固定为小咕噜深色模式头像（photo-data-sq.webp，406x406），不再跟随主题
  const rel = DEFAULT_PHOTO_DATA_SQ;
  try { return new URL(rel, location.href).href; } catch (e) { return rel; }   // 系统通知只认绝对 URL
}
function eeSetMediaMetadata(it) {
  if (!('mediaSession' in navigator) || !it) return;
  try {
    navigator.mediaSession.metadata = new MediaMetadata({
      title: it.name,               // 主标题=试听音频名称（v3.6.44 需求⑧）
      artist: '小咕噜音频',          // 副标题固定「小咕噜音频」（v3.6.44 需求⑧，原为「小咕噜音频 · 类型」）
      album: '早教音频',
      artwork: [{ src: eeArtworkUrl(), sizes: '406x406', type: 'image/webp' }]
    });
  } catch (e) {}
}
function eeSetupMediaSession() {
  if (!('mediaSession' in navigator)) return;
  try {
    navigator.mediaSession.setActionHandler('play', () => {
      // v3.6.31 媒体通知/锁屏的「播放」：恢复当前队列并同步 App 内 UI（旧实现只 play() 不刷新界面，通知续播后 App 仍显示「已暂停」）
      _eeUserPaused = false;
      if (eeCurrentId && eeQueue.length) {
        const it = EARLY_EDU.find(x => x.id === eeCurrentId);
        eeSetNowText('正在播放：' + (it ? it.type + ' · ' + it.name : ''), true);
        const lbl = document.getElementById('eePlayLabel'); if (lbl) lbl.textContent = '停止';
        const ico = document.getElementById('eeIco'); if (ico) ico.innerHTML = EE_ICO_STOP;
        if (eeAudio) eeAudio.play().catch(() => {});
        eeRequestWakeLock();
      } else eePlayN();
    });
    // v3.6.30 系统/锁屏暂停只暂停、不清队列（旧逻辑直接 eeStop → 队列被清空，表现为「没操作却停了」）
    navigator.mediaSession.setActionHandler('pause', () => eePause());
    navigator.mediaSession.setActionHandler('stop', () => eeStop());
    navigator.mediaSession.setActionHandler('nexttrack', () => eeSwitch());
  } catch (e) {}
}
/* v3.6.31 屏幕唤醒锁：播放期间尽量阻止自动熄屏——黑屏后浏览器定时器冻结/系统收回音频焦点，
 * 连播链必断（用户反馈「设 5 首只播 2 首，手机黑屏就自动停」）。
 * 规范：页面切后台/锁屏时锁自动释放，回前台需重新申请；请求失败（不支持/低电量/被拒）静默降级，
 * 由 eeResumeAfterVisible 亮屏续播兜底。微信 X5 等旧内核多不支持，属预期。 */
async function eeRequestWakeLock() {
  if (_eeWakeLock || _eeWakeLockPending) return;
  try {
    if (!('wakeLock' in navigator) || !navigator.wakeLock || typeof navigator.wakeLock.request !== 'function') return;
    _eeWakeLockPending = true;
    const lock = await navigator.wakeLock.request('screen');
    _eeWakeLockPending = false;
    _eeWakeLock = lock;
    lock.addEventListener('release', () => { if (_eeWakeLock === lock) _eeWakeLock = null; });
  } catch (e) { _eeWakeLockPending = false; }
}
function eeReleaseWakeLock() {
  try {
    if (_eeWakeLock) { const w = _eeWakeLock; _eeWakeLock = null; w.release(); }
  } catch (e) {}
}
/* v3.6.31 亮屏自动续播：黑屏/锁屏期间系统把音频暂停（队列保留、UI「已暂停」），点亮屏幕自动从当前这首继续，
 * 杜绝「没操作却停了」的观感；若当前首在页面冻结时已播完（ended 丢失），直接下一首。
 * 用户经媒体通知主动暂停（_eeUserPaused）时不自动续播，尊重意图。 */
function eeResumeAfterVisible() {
  if (!eeAudio || !eeCurrentId || !eeQueue.length) return;
  if (!eeAudio.paused) { eeRequestWakeLock(); return; }        // 还在播（锁可能已释放）：只补锁
  if (_eeUserPaused) return;                                   // 用户主动暂停：等用户点播放
  const it = EARLY_EDU.find(x => x.id === eeCurrentId) || EARLY_EDU.find(x => x.id === eeQueue[eeQueueIdx]);
  // 当前首其实已播完（X5/页面冻结丢 ended）→ 走下一首，而不是把这一首重播
  const dur = eeAudio.duration;
  if (eeAudio.ended || (dur && isFinite(dur) && eeAudio.currentTime >= dur - 0.3)) { eeAdvanceQueue(); return; }
  if (!it) { eeAdvanceQueue(); return; }
  eeSetNowText(eeNowPrefix() + it.type + ' · ' + it.name, true);
  const lbl = document.getElementById('eePlayLabel'); if (lbl) lbl.textContent = '停止';
  const ico = document.getElementById('eeIco'); if (ico) ico.innerHTML = EE_ICO_STOP;
  _eeInternalPause = false;
  const p = eeAudio.play();
  if (p && p.then) p.catch(() => eePlayItem(it));              // 恢复失败（如 X5 收了音频资源）：重载当前曲
  eeRequestWakeLock();
}
/* v3.6.30 暂停（保留队列，之后可从当前这首继续） */
function eePause() {
  if (!eeAudio || eeAudio.paused) return;
  try { _eeInternalPause = true; eeAudio.pause(); } catch (e) {} finally { _eeInternalPause = false; }
  _eeUserPaused = true;          // v3.6.31 经媒体通知/锁屏控件主动暂停：亮屏不自动续播
  eeReleaseWakeLock();           // v3.6.31 暂停即释放屏幕锁，省电
  const it = EARLY_EDU.find(x => x.id === eeCurrentId);
  eeSetNowText('已暂停：' + (it ? it.type + ' · ' + it.name : ''), false);
  const lbl = document.getElementById('eePlayLabel'); if (lbl) lbl.textContent = '播放';
  const ico = document.getElementById('eeIco'); if (ico) ico.innerHTML = EE_ICO_PLAY;
}
function renderEarlyEduCard() {
  const now = document.getElementById('eeNowText'); if (!now) return;
  if (eeCurrentId) return;
  now.textContent = eeActiveList().length ? '' : '暂未添加音频，去「管理 → 早教」添加';   // v3.6.21 按有效音频计数
  now.classList.remove('playing');
  eeRefreshPlayHint();   // v3.6.24 连播提示语里的「几首」同步管理中的播放音频数
}
/* v3.6.24 连播提示语动态显示播放音频数（管理里可改，默认 5）
 * v3.6.30 诚实显示：实际可连播数 = min(设置数, 现有有效音频数)——设置 5 但只有 2 首时明说
 * 「不足则全放」，避免用户误以为连播链中途坏了（「设置为 5 却只连播 2 首」投诉的主因之一）
 * v3.6.46 文案改「点『播放』可选『随机』连播 N 首歌或『指定』循环播放」（#eePlayHintNote 沿用） */
function eeRefreshPlayHint() {
  const el = document.getElementById('eePlayHintCount'); if (!el) return;
  const set = getEePlayCount();
  const avail = eeActiveList().length;
  el.textContent = String(avail ? Math.max(1, Math.min(set, avail)) : set);
  const note = document.getElementById('eePlayHintNote');
  if (note) note.textContent = (avail && set > avail) ? ('（现有音频 ' + avail + ' 首，不足则全放）') : '';
}

/* ---------- 首页合并卡片：放音频(固定) + 听歌 + 听故事（随分类筛选显隐） ---------- */
/* 听歌/听故事区块是否显示：分类筛选含「学习」(=全部/学习) 且活动未被隐藏 且 (无搜索 或 名称匹配) */
function mixerSectionVisible(actId) {
  const act = ACTIVITIES.find(a => a.id === actId); if (!act) return false;
  if (!selectedCategories.has(act.category)) return false;
  if (hiddenActivities.includes(actId)) return false;
  if (actSearchQuery) { if (!((act.name || '').toLowerCase().includes(actSearchQuery))) return false; }
  return true;
}
function renderActivityRecordsHtml(actId) {
  const records = getTodayRecords();
  const actRecords = records.filter(r => r.type === actId).reverse();
  if (!actRecords.length) return '<div class="card-empty">今日暂无记录</div>';
  const readOnly = isReadOnlyMode();
  let h = '<div class="card-records">';
  actRecords.forEach(r => {
    const time = r.recTime || r.time;
    const editDeleteHtml = readOnly ? '' : `<span class="rec-edit" onclick="event.stopPropagation();openEditRecord('${actId}',${r.timestamp})"><svg viewBox="0 0 24 24"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg></span><span class="rec-delete" onclick="event.stopPropagation();deleteRecord('${actId}',${r.timestamp})"><svg viewBox="0 0 24 24"><path d="M3 6h18"/><path d="M8 6V4h8v2"/><path d="M6 6l1 14h10l1-14"/><path d="M10 10v6"/><path d="M14 10v6"/></svg></span>`;
    h += `<div class="record-tag" data-timestamp="${r.timestamp}" data-type="${actId}"><div class="rec-left"><span class="rec-time">${time || ''}</span><span class="rec-detail">${formatRecordBrief(r, getTodayDateStr())}</span></div>${editDeleteHtml}</div>`;
  });
  h += '</div>';
  return h;
}
function renderAudioMixerCard() {
  const musicSec = document.getElementById('mixerMusicSection');
  const storySec = document.getElementById('mixerStorySection');
  if (musicSec) musicSec.style.display = mixerSectionVisible('listenMusic') ? '' : 'none';
  if (storySec) storySec.style.display = mixerSectionVisible('listenStory') ? '' : 'none';
  const mb = document.getElementById('mixerMusicBody'); if (mb) mb.innerHTML = renderActivityRecordsHtml('listenMusic');
  const sb = document.getElementById('mixerStoryBody'); if (sb) sb.innerHTML = renderActivityRecordsHtml('listenStory');
}
/* v3.5.162 播放后高亮「听歌 / 听故事」子区块（动画加在 section 上，不会被记录重建 innerHTML 覆盖） */
function eeFlashMixer(ids) {
  ids.forEach(id => {
    const sec = id === 'listenMusic' ? document.getElementById('mixerMusicSection') : document.getElementById('mixerStorySection');
    if (!sec) return;
    sec.classList.remove('highlight');
    void sec.offsetWidth;   // 强制重绘以重启动画
    sec.classList.add('highlight');
    setTimeout(() => sec.classList.remove('highlight'), 3000);
  });
}

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
  // v3.5.137+ 优先级：①内置「区县」坐标（确定是中国、精确到区，且比 Open-Meteo 的市级中心更贴近用户）→
  // ②Open-Meteo 逐级降级（仅取中国境内）→ ③城市级内置坐标兜底。
  // 说明：免费地理编码服务在国内覆盖不到街道/小区级（Nominatim 国内连不通、Open-Meteo 中文详细地址几乎匹配不到），
  // 故最精确只能稳定到「区/县」一级，同城市各区县天气基本一致，这一级已足够准确。
  const fb = geoFallback(raw);
  if (fb && fb.name.indexOf('·') >= 0) { cache[raw] = fb; try { localStorage.setItem(WEATHER_GEO_CACHE_KEY, JSON.stringify(cache)); } catch (e) {} return fb; }
  const cands = geoCandidates(raw);
  for (let i = 0; i < cands.length; i++) {
    const r = await geoSearchOne(cands[i]);
    if (r) { cache[raw] = r; try { localStorage.setItem(WEATHER_GEO_CACHE_KEY, JSON.stringify(cache)); } catch (e) {} return r; }
  }
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
// 常用区县坐标（比市级更贴近，优先匹配）。值为 {lat, lon, c:城市, n:区县名}，
// 显示名统一为「城市·区县」，让定位更直观（免费地理编码在国内到不了小区/街道级）。
// 同城市各区县天气几乎一致，故坐标用各区县中心近似即可。
const CN_DISTRICT_FALLBACK = {
  // 上海 16 区
  '黄浦': {lat:31.2317, lon:121.4844, c:'上海', n:'黄浦区'}, '徐汇': {lat:31.1883, lon:121.4365, c:'上海', n:'徐汇区'},
  '长宁': {lat:31.2204, lon:121.4246, c:'上海', n:'长宁区'}, '静安': {lat:31.2290, lon:121.4483, c:'上海', n:'静安区'},
  '普陀': {lat:31.2495, lon:121.3963, c:'上海', n:'普陀区'}, '虹口': {lat:31.2646, lon:121.5050, c:'上海', n:'虹口区'},
  '杨浦': {lat:31.2595, lon:121.5264, c:'上海', n:'杨浦区'}, '闵行': {lat:31.1128, lon:121.3817, c:'上海', n:'闵行区'},
  '宝山': {lat:31.4050, lon:121.4894, c:'上海', n:'宝山区'}, '嘉定': {lat:31.3756, lon:121.2655, c:'上海', n:'嘉定区'},
  '浦东': {lat:31.2216, lon:121.5397, c:'上海', n:'浦东新区'}, '金山': {lat:30.7418, lon:121.3414, c:'上海', n:'金山区'},
  '松江': {lat:31.0322, lon:121.2277, c:'上海', n:'松江区'}, '青浦': {lat:31.1497, lon:121.1243, c:'上海', n:'青浦区'},
  '奉贤': {lat:30.9179, lon:121.4740, c:'上海', n:'奉贤区'}, '崇明': {lat:31.6269, lon:121.3973, c:'上海', n:'崇明区'},
  // 北京核心城区
  '东城': {lat:39.9170, lon:116.4160, c:'北京', n:'东城区'}, '西城': {lat:39.9150, lon:116.3660, c:'北京', n:'西城区'},
  '朝阳': {lat:39.9219, lon:116.4435, c:'北京', n:'朝阳区'}, '海淀': {lat:39.9599, lon:116.2980, c:'北京', n:'海淀区'},
  '丰台': {lat:39.8585, lon:116.2866, c:'北京', n:'丰台区'}, '通州': {lat:39.9097, lon:116.6569, c:'北京', n:'通州区'},
  // 广州核心区
  '天河': {lat:23.1247, lon:113.3614, c:'广州', n:'天河区'}, '越秀': {lat:23.1290, lon:113.2670, c:'广州', n:'越秀区'},
  '海珠': {lat:23.0830, lon:113.3170, c:'广州', n:'海珠区'}, '番禺': {lat:22.9370, lon:113.3840, c:'广州', n:'番禺区'},
  // 深圳核心区
  '福田': {lat:22.5410, lon:114.0570, c:'深圳', n:'福田区'}, '南山': {lat:22.5310, lon:113.9390, c:'深圳', n:'南山区'},
  '宝安': {lat:22.5550, lon:113.8830, c:'深圳', n:'宝安区'}, '龙岗': {lat:22.7230, lon:114.2130, c:'深圳', n:'龙岗区'},
  // 成都 / 武汉核心区（区名全国重名少）
  '锦江': {lat:30.6490, lon:104.1010, c:'成都', n:'锦江区'}, '武侯': {lat:30.6420, lon:104.0430, c:'成都', n:'武侯区'},
  '武昌': {lat:30.5450, lon:114.3050, c:'武汉', n:'武昌区'}, '江汉': {lat:30.6160, lon:114.2700, c:'武汉', n:'江汉区'}
};
// 镇 / 街道级坐标（比区更贴近，按需补充；显示名带「区·镇」，全国重名少的镇才放这里）
const CN_TOWN_FALLBACK = {
  '七宝镇': {lat:31.1550, lon:121.3328, c:'上海', n:'闵行区·七宝镇'}
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
// 兜底：按地址中的「镇」→「区」→「市」关键字取内置坐标，显示名统一为「城市·区·镇」
function geoFallback(addr) {
  const a = String(addr || '');
  for (const k in CN_TOWN_FALLBACK) if (a.indexOf(k) >= 0) { const v = CN_TOWN_FALLBACK[k]; return { lat: v.lat, lon: v.lon, name: (v.c ? v.c + '·' : '') + v.n }; }
  for (const k in CN_DISTRICT_FALLBACK) if (a.indexOf(k) >= 0) { const v = CN_DISTRICT_FALLBACK[k]; return { lat: v.lat, lon: v.lon, name: (v.c ? v.c + '·' : '') + v.n }; }
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
    if (r) { let name = r.name || ''; if (r.admin1 && r.admin1 !== name && !r.admin1.startsWith(name)) name += '·' + r.admin1; return { lat: r.latitude, lon: r.longitude, name }; }
  } catch (e) { console.warn('[天气] 地理编码失败(', q, '):', e); }
  return null;
}
/* v3.6.16 天气缓存：按「地址|日期」缓存 3 小时，减少 Open-Meteo 调用、缓解每日配额限流 */
const WEATHER_CACHE_KEY = 'weather_cache_v1';
const WEATHER_CACHE_TTL = 3 * 3600 * 1000;
async function _openMeteoWeather(addr, dateStr) {
  const geo = await geocodeAddr(addr); if (!geo) return null;
  try {
    const url = 'https://api.open-meteo.com/v1/forecast?latitude=' + geo.lat + '&longitude=' + geo.lon
      + '&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,wind_speed_10m_max'
      + '&hourly=wind_speed_10m,temperature_2m'
      + '&timezone=Asia%2FShanghai&start_date=' + dateStr + '&end_date=' + dateStr;
    const res = await fetch(url);
    const j = await res.json();
    if (j && j.error) return null;
    const d = j && j.daily;
    if (!d || !d.time || !d.time.length) return null;
    let tmax = d.temperature_2m_max[0], tmin = d.temperature_2m_min[0], wind = d.wind_speed_10m_max[0];
    const ws = ((j.hourly && j.hourly.wind_speed_10m) || []).filter(x => x != null);
    if (wind == null && ws.length) wind = Math.max.apply(null, ws);
    const ts = ((j.hourly && j.hourly.temperature_2m) || []).filter(x => x != null);
    if ((tmax == null || tmin == null) && ts.length) { if (tmax == null) tmax = Math.max.apply(null, ts); if (tmin == null) tmin = Math.min.apply(null, ts); }
    if (tmax == null && tmin == null) return null;
    return { code: d.weather_code[0], tmax, tmin, pop: (d.precipitation_probability_max && d.precipitation_probability_max[0] != null ? d.precipitation_probability_max[0] : null), wind, name: geo.name };
  } catch (e) { console.warn('[天气] Open-Meteo 获取失败', e); return null; }
}
async function _wttrWeather(addr, dateStr) {
  const geo = await geocodeAddr(addr); if (!geo) return null;
  try {
    const res = await fetch('https://wttr.in/' + geo.lat + ',' + geo.lon + '?format=j1');
    const j = await res.json();
    const w = (j && j.weather || []).find(x => x.date === dateStr) || (j && j.weather && j.weather[0]);
    if (!w) return null;
    const tmax = parseFloat(w.maxtempC), tmin = parseFloat(w.mintempC);
    if (isNaN(tmax) || isNaN(tmin)) return null;
    const hs = (w.hourly || []).map(h => parseInt(h.windspeedKmph, 10)).filter(x => !isNaN(x));
    const wind = hs.length ? Math.max.apply(null, hs) : null;
    return { code: null, tmax, tmin, pop: null, wind, name: geo.name, backup: true };
  } catch (e) { console.warn('[天气] wttr.in 备用源失败', e); return null; }
}
async function fetchWeather(addr, dateStr) {
  try {
    const c = JSON.parse(localStorage.getItem(WEATHER_CACHE_KEY) || '{}');
    const hit = c[addr + '|' + dateStr];
    if (hit && Date.now() - hit.ts < WEATHER_CACHE_TTL) return hit.w;
  } catch (e) {}
  let w = await _openMeteoWeather(addr, dateStr);
  if (!w) w = await _wttrWeather(addr, dateStr);
  if (w) {   // 只缓存成功结果，避免失败被缓存导致长时间不重试
    try {
      const c = JSON.parse(localStorage.getItem(WEATHER_CACHE_KEY) || '{}');
      c[addr + '|' + dateStr] = { ts: Date.now(), w };
      const ks = Object.keys(c);
      if (ks.length > 10) ks.slice(0, ks.length - 10).forEach(k => delete c[k]);
      localStorage.setItem(WEATHER_CACHE_KEY, JSON.stringify(c));
    } catch (e) {}
  }
  return w;
}
function weatherText(w) {
  if (!w) return '（天气获取失败，请手动参考天气预报）';
  const desc = (w.code != null && WMO_CODES[w.code] != null) ? WMO_CODES[w.code] : '';
  const head = w.name + (desc ? ' ' + desc : '') + (w.backup ? '（备用天气源）' : '');
  return head + '，最高' + Math.round(w.tmax) + '℃/最低' + Math.round(w.tmin) + '℃，降水概率' + (w.pop != null ? w.pop : '—') + '%，最大风速' + (w.wind != null ? Math.round(w.wind) : '—') + 'km/h';
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
// v3.6.0 任务间隔：返回触发步进单位数（默认1，即"每1天/周/月"）
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
    return { prev: first.getTime() <= now.getTime() ? first : null,
             next: first.getTime() > now.getTime() ? first : null };
  }
  const iv = taskInterval(task);
  let prev = new Date(first.getTime());
  if (prev.getTime() > now.getTime()) {
    while (prev.getTime() > now.getTime()) prev = stepBack(prev, task.freq, iv);
  } else {
    while (stepFwd(prev, task.freq, iv).getTime() <= now.getTime()) prev = stepFwd(prev, task.freq, iv);
  }
  return { prev: prev, next: stepFwd(prev, task.freq, iv) };
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
// v3.6.0 早教 7 项（用于统计"生成日当天"次数，次数<1 的项目纳入次日计划）
const PLAN_EE_TYPES = {
  learnLanguage: '学语言', readBook: '读书', learnLogic: '学算术',
  fineMotor: '精细动作', grossMotor: '大运动', listenStory: '听故事', listenMusic: '听歌'
};
// v3.6.0 采集某天记录里的早教/大便/辅食/户外统计（供 AI 排次日计划参考）
function collectPlanDayStats(dateStr) {
  const recs = (typeof getRecordsByDate === 'function') ? (getRecordsByDate(dateStr) || []) : [];
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
// v3.6.40 辅食连续添加天数：从目标日往前逐日查辅食记录，遇空档即止（最多回看 60 天）。
// 语义（对应用户要求「如果前一天添加了辅食，计为第一天」）：streak=1 即昨日为辅食第1天（首次添加），
// 今日计划目标日 = 第 streak+1 天；streak>1 表示已连续添加多日。昨日无辅食记录时 streak=0（不触发新规则）。
function solidFoodStreak(targetDateStr) {
  const t = new Date((targetDateStr || planTodayStr()) + 'T00:00:00');
  if (isNaN(t.getTime())) return { streak: 0, lastDate: '' };
  const yd = new Date(t.getTime() - 86400000);
  const lastDate = yd.getFullYear() + '-' + _pad2(yd.getMonth() + 1) + '-' + _pad2(yd.getDate());
  let streak = 0;
  for (let i = 1; i <= 60; i++) {
    const d = new Date(t.getTime() - i * 86400000);
    const ds = d.getFullYear() + '-' + _pad2(d.getMonth() + 1) + '-' + _pad2(d.getDate());
    const recs = (typeof getRecordsByDate === 'function') ? (getRecordsByDate(ds) || []) : [];
    if (!recs.some(r => r && r.type === 'solidFood')) break;
    streak++;
  }
  return { streak: streak, lastDate: streak > 0 ? lastDate : '' };
}
const PLAN_DOW = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
function buildPlanSystemPrompt(dateStr, wText, stats, sfStreak) {
  const ad = getAgeDetail(dateStr);
  const birthStr = BIRTH_DATE.getFullYear() + '-' + _pad2(BIRTH_DATE.getMonth() + 1) + '-' + _pad2(BIRTH_DATE.getDate());
  const h = localStorage.getItem('babyHeight') || '';
  const w = localStorage.getItem('babyWeight') || '';
  const kbPart = KB.slice(0, 50).map(x => '- [' + x.cat + '] ' + x.text).join('\n');
  // v3.6.40 辅食连续添加天数（昨日=第 streak 天，今日=第 streak+1 天；streak=0 表示前一日无辅食记录）。
  // 防御：历史调用方第 4 参可能传非对象（如旧测试传的 'D3'），非对象按未传处理。
  const _sf = (sfStreak && typeof sfStreak === 'object' && !Array.isArray(sfStreak)) ? sfStreak : null;
  const sfDay = (_sf && _sf.streak > 0) ? (_sf.streak + 1) : 0;
  // v3.6.0 目标日星期（营养补剂 M/W/F 判定）与生成日当天早教/大便/辅食统计
  const targetDow = new Date(dateStr + 'T00:00:00').getDay();
  const targetIsMWF = (targetDow === 1 || targetDow === 3 || targetDow === 5);
  const supRec = (typeof getSupplementSuggestion === 'function') ? getSupplementSuggestion() : 'D3';
  let dayPart = '';
  if (stats) {
    const c = stats.counts;
    const eeLine = Object.keys(PLAN_EE_TYPES).map(k => PLAN_EE_TYPES[k] + c[k] + '次').join('、');
    // v3.6.1 统计口径改为「目标日期的前一天」：如 10-14 早上生成的计划，按 10-13 的记录
    dayPart = '\n【前一日已记录的早教/起居数据（用于安排今日计划）】\n'
      + '- 早教各项次数：' + eeLine + '\n'
      + '- 大便次数：' + stats.poop + ' 次\n'
      + '- 户外时长：' + stats.outdoorMin + ' 分钟\n'
      + (stats.foods.length ? ('- 辅食记录：' + stats.foods.map(f => (f.names.join('/') || '辅食') + (f.amount > 0 ? ' ' + f.amount + 'g' : '') + (f.time ? ('（昨日 ' + f.time + ' 添加' + (f.afterMeal && f.afterMeal !== '正常' ? '，饭后' + f.afterMeal : '') + '）') : '') + (f.note ? '（备注：' + f.note + '）' : '')).join('；') + '\n') : '- 前一日无辅食记录（今日是否试新辅食，需按下方「辅食试吃条件」判断）\n')
      + (sfDay > 0 ? ('- 辅食已连续添加 ' + _sf.streak + ' 天：昨日为辅食第' + _sf.streak + '天，今日为辅食第' + sfDay + '天\n') : '')
      + '- 营养补剂建议（与上次相反）：' + (supRec || '—') + '\n';
  }
  return '你是一位专业、贴心的婴幼儿育儿规划助手，服务对象是长辈（外婆）带小宝宝，目标是提前生成「今日计划」以减少带娃决策压力。\n'
    + '请用简体中文、具体可操作；不要使用 markdown 标记；分点请用「·」。内容精炼：每个分类 3 条以内、每条不超过 20 字。\n\n'
    + '【宝宝档案】\n- 姓名：' + BABY_NAME + '；出生：' + birthStr + '；当前 ' + ad.months + ' 月龄 ' + ad.days + ' 天\n'
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
    // v3.6.50 用户需求「知识库中低于15算小风，但今日计划中16归为小风，应该以知识库为准」——原段落虽写「以知识库为准」，
    // 但又给出兜底数值 ≤19km/h=风小，与用户知识库自定义的 ≤15km/h=风小 冲突，16km/h 落在两口径之间被兜底带跑归小风。
    // 现改为：知识库自定义风速风级标准为唯一准绳（用户阈值绝对优先、严禁通用风级表/兜底数值覆盖、边界严禁四舍五入或折中），
    // 兜底仅在知识库完全无风速风级定义时启用且须声明。
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
// v3.6.1 取「目标日期的前一天」的早教/大便/辅食/户外统计（如 10-14 的计划按 10-13 的记录）
function planStatsDateStr(targetDateStr) {
  const d = new Date((targetDateStr || planTodayStr()) + 'T00:00:00');
  if (isNaN(d.getTime())) return planTodayStr();
  d.setDate(d.getDate() - 1);
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}
async function generatePlanForTask(task, trig) {
  const cfg = await getAITagConfigWait();
  if (!cfg) { console.warn('[计划] 未配置 AI 密钥，跳过生成'); return; }
  const dateStr = trig.getFullYear() + '-' + _pad2(trig.getMonth() + 1) + '-' + _pad2(trig.getDate());
  let wText = '（未获取）';
  try { wText = weatherText(await fetchWeather(getWeatherAddr(), dateStr)); } catch (e) {}
  // v3.6.1 统计前一天（目标日期 -1 天）的记录
  const stats = (typeof collectPlanDayStats === 'function') ? collectPlanDayStats(planStatsDateStr(dateStr)) : null;
  // v3.6.40 辅食连续添加天数（昨日=第N天→今日=第N+1天），供「辅食第N天食谱推荐」规则使用
  const sfStreak = (typeof solidFoodStreak === 'function') ? solidFoodStreak(dateStr) : { streak: 0, lastDate: '' };
  const r = await callAIChat(cfg, [
    { role: 'system', content: buildPlanSystemPrompt(dateStr, wText, stats, sfStreak) },
    { role: 'user', content: '请为 ' + dateStr + '（地址：' + getWeatherAddr() + '）生成今日计划，严格按格式输出。' }
  ]);
  if (typeof r === 'string' && r.indexOf('__FAIL__:') === 0) { console.warn('[计划] AI 生成失败', r); return; }
  task.content = String(r).trim();
  task.genPeriod = periodKey(task, trig);
  task.genDate = dateStr;
  task.planVer = PLAN_PROMPT_VERSION;   // v3.5.142 记录生成本内容所用的 prompt 版本
  saveSchedTasks();
  // v3.6.0 生成仅写任务页，不刷新首页（首页只在推送时更新）
}

/* ---------- 推送（复用今日成就的 PushPlus 配置） ---------- */
async function pushTask(task, trig, pk) {
  // v3.6.45 需求③：关闭任务不再推送消息——即使本周期已被认领（并发/宽限窗口内），
  // 推送前终检任务是否仍处于开启态，关闭后一律不推。
  if (task && task.enabled === false) return false;
  // v3.5.148 防重复推送①：进入函数后立即"同步认领"本周期并落盘（await 之前），
  // 这样并发/多次触发的 runScheduler 在推送尚未返回时也会看到已认领，从而跳过，避免同一条任务重复发送。
  if (task.pushPeriod === pk) return true;      // 本周期已被认领（并发重复调用）
  const _prevPk = task.pushPeriod;
  task.pushPeriod = pk; task.pushTs = Date.now();
  saveSchedTasks();
  // v3.5.148 防重复推送②：跨设备去重——家庭内其他设备已推过本周期则本机跳过
  const _sig = 'task|' + (task.id || task.name || '') + '|' + pk;
  try { if (await _cloudSchedDup(_sig)) return true; } catch (e) {}

  let title, content;
  // v3.6.0 育儿嫂工资任务 / v3.6.45 需求③：触发时按「满勤月工资÷满勤天数×当月工作天数」算工资，自动生成推送内容
  // （当月工作天数取家政考勤·育儿嫂，见 computeWage）
  if (task.type === 'wage') {
    const w = computeWage(task, trig);
    title = '👩 育儿嫂工资结算';
    content = '<pre style="white-space:pre-wrap;font-family:inherit;line-height:1.6;">' + escapeHtml(wagePushContent(w)) + '</pre>';
  } else if (task.mode === 'ai') {
    const sp = splitPlan(task.content);
    // v3.5.153 推送标题改为「任务名称」，不再拼接日期
    const nm = (task.name && String(task.name).trim()) ? String(task.name).trim() : '今日计划';
    title = '📅 ' + nm;
    const sum = sp.summary ? '<p style="font-size:16px;font-weight:600;">📌 ' + escapeHtml(sp.summary) + '</p>' : '';
    // v3.6.18 详情标题只保留任务名称（用户要求去掉「小咕噜 」前缀，避免与任务名「咕噜今日计划」重复拗口）
    content = '<h3>' + escapeHtml(nm) + '</h3>' + sum + '<pre style="white-space:pre-wrap;font-family:inherit;line-height:1.6;">' + escapeHtml(sp.detail || task.content || '') + '</pre>';
  } else {
    // v3.5.148 通知内容改为任务名称（如「⏰ 育儿嫂午餐费」），不再统一显示"定时提醒"
    const nm = (task.name && String(task.name).trim()) ? String(task.name).trim() : '定时提醒';
    title = '⏰ ' + nm;
    content = '<pre style="white-space:pre-wrap;font-family:inherit;line-height:1.6;">' + escapeHtml(task.content || '') + '</pre>';
  }
  const ok = await notifyPushplus(title, content);
  if (ok) {
    try { _cloudSchedMark(_sig); } catch (e) {}
    // v3.6.0 工资任务结算成功后记录本次结算日（=触发日），作为下一周期起点
    // v3.6.1 结算成功后：把当月休假日归档到备忘录已办、清空当月休假、切到下个月
    if (task.type === 'wage') {
      task.lastWageDate = fmtDateLocal(trig); saveSchedTasks();
      try { archiveNannyMonth(getNannyMonth()); } catch (e) { console.warn('[Nanny] 归档失败', e); }
    }
    if (task.freq === 'once') { task.enabled = false; saveSchedTasks(); }
  } else {
    // 推送失败：回滚认领状态，允许下一次调度重试，避免漏推
    task.pushPeriod = _prevPk; saveSchedTasks();
  }
  return ok;
}

/* ---------- 调度器（静态站点：页面打开时由定时器检查触发） ---------- */
/* ---------- v3.6.3 今日计划：每天 0 点生成「当天」计划 ----------
 * 简化规则：每天 0 点调用 AI 生成当天计划（天气/营养补剂按当天；大便/早教按前一天）；
 * 用户在任务中可编辑；到用户设定的触发时刻推送并更新首页；推送后至次日 0 点只读不可编辑。 */
function _planToday() { return new Date(planTodayStr() + 'T00:00:00'); }
function planPushedToday(task) {
  try { return !!task && task.pushPeriod === periodKey(task, _planToday()); } catch (e) { return false; }
}
function isPlanEditable(task) {
  if (task.mode !== 'ai') return true;
  if (task.genDate !== planTodayStr()) return false;   // 当天计划未生成 → 不可编辑
  return !planPushedToday(task);                          // 已推送 → 只读
}
function planLockMsg(task) {
  if (task.genDate !== planTodayStr()) return '今日计划尚未生成（每天 0 点自动生成），暂无法编辑';
  if (planPushedToday(task)) return '今日计划已推送，在次日 0 点生成新计划前为只读，不可编辑';
  return '暂无法编辑';
}
let _schedRunning = false;
async function runScheduler(forceGen) {
  // v3.5.148 防重复推送③：调度器重入保护。
  // 页面加载 / 切到任务页 / 可见性变化 / 60s 轮询 会几乎同时各触发一次 runScheduler，
  // 若上一次尚未跑完（内部有 await 推送），会再次遍历到同一任务导致重复推送。此处直接跳过并发调用。
  if (_schedRunning) return;
  _schedRunning = true;
  try {
  const now = new Date();
  const canPush = isPushSender();
  let pushedThisRun = false;   // v3.6.0 仅当本次实际推送了计划，才在结束后刷新首页
  let planGenThisRun = false;  // v3.6.5 0 点生成了当天计划，也刷新首页计划卡
  for (const task of SCHED_TASKS) {
    if (!task.enabled) continue;
    const { prev, next } = computeTriggers(task, now);
    // v3.6.3 AI 计划：每天 0 点生成「当天」计划（不再提前 12h 生成次日计划）。
    // genDate !== 今天 或 prompt 版本过期 → 以今天 00:00 为触发日重新生成
    // （天气/营养补剂按当天判断，大便/早教/辅食/户外按前一天记录）。
    if (task.mode === 'ai') {
      const todayStr = planTodayStr();   // v3.6.5 计划日用真实日历日（0 点翻页），不用业务日（1 点翻页）
      const cooling = (Date.now() - (task.genTryTs || 0)) <= SCHED_GEN_COOLDOWN;
      // 内容版本过期也重生成：已有内容但用的是旧 prompt 版本，用户主动查看(forceGen)时立即刷新
      // v3.6.17 数值单调比较：云端版本 >= 本地时不重生成（防止服务端新 prompt 生成的内容被本地旧版本回退覆盖，高低版本乒乓）
      const staleVer = Number(task.planVer || 0) < Number(PLAN_PROMPT_VERSION);
      if ((task.genDate !== todayStr || staleVer) && (!cooling || (forceGen && (!task.content || staleVer)))) {
        const _beforeGen = task.genDate;
        task.genTryTs = Date.now(); saveSchedTasks();
        await generatePlanForTask(task, new Date(todayStr + 'T00:00:00'));
        // v3.6.5 0 点生成当天计划后立即刷新首页计划卡（此前只在实际推送时刷新，
        // 会导致跨 0 点在线的用户首页卡片停留/消失，直到 06:30 推送才更新）
        if (task.genDate !== _beforeGen && task.genDate === todayStr) planGenThisRun = true;
      }
    }
    // 触发推送：触发时刻起、宽限 3 小时内（仅"由本设备负责推送"的设备执行，避免多设备重复推送）
    // v3.5.144 修复：原先用 next（永远在未来）导致 now>=trig 恒为 false，定时任务推送从不触发。改用 prev（刚过去的触发点）。
    if (!canPush) continue;
    // v3.6.45 需求③：工资任务当月有下户日期时，推送提前至下户日期当天同一时刻
    // （如原定 10月30日 12:00、下户 10月20日 → 10月20日 12:00 推，10月30日不推）
    let trig = prev;
    if (task.type === 'wage') {
      try {
        const p0 = getHousekeeper().nanny;
        if (!p0.on && p0.endDate && task.startTime) {
          const shifted = new Date(p0.endDate + 'T' + task.startTime + ':00');
          if (!isNaN(shifted.getTime()) && shifted < trig) trig = shifted;
        }
      } catch (e) {}
    }
    if (trig && now >= trig && now < new Date(trig.getTime() + SCHED_PUSH_GRACE)) {
      const pk = periodKey(task, trig);
      if (task.pushPeriod !== pk) {
        if (task.mode === 'ai' && !task.content) { await generatePlanForTask(task, trig); }
        const pp = await pushTask(task, trig, pk);
        if (pp) pushedThisRun = true;
      }
    }
  }
  if (currentManageTab === 'tasks') renderSchedTasks();
  // v3.6.0 首页只在「本次有推送」时才刷新：0 点生成当天计划不污染首页；触发时刻推送才更新首页
  // v3.6.5 0 点生成当天计划同样刷新首页计划卡（跨 0 点在线的用户能立即看到新计划）
  if (pushedThisRun || planGenThisRun) renderTodayPlanCard();
  scheduleSchedCloudSave();   // v3.5.154 页面运行期间定期同步上下文（token/天气地址/知识库等变更）
  // v3.6.48 需求①：之前因 sync 未就绪被暂存的待同步变更（如无网时关闭任务），就绪后立即补传
  if (_schedCloudPending && (typeof isSyncReady !== 'function' || isSyncReady())) {
    _schedCloudPending = false; scheduleSchedCloudSave(0);
  }
  } finally { _schedRunning = false; }
}
// AI 计划 prompt 升级：检测到 prompt 版本变化则立即用最新 prompt 重新生成一次（不再等 12h 窗口），
// 有内容则整段替换为最新；无内容（未配密钥/网络失败）则保留旧内容不空白。
// v3.5.142 版本号升至 3——本次会强制把所有 AI 任务的内容刷新为新分类（喂养/起居护理/健康·出行）。
async function migratePlanPromptVersion() {
  let v = '';
  try { v = localStorage.getItem('plan_prompt_ver') || ''; } catch (e) {}
  if (v === PLAN_PROMPT_VERSION) return;
  try { localStorage.setItem('plan_prompt_ver', PLAN_PROMPT_VERSION); } catch (e) {}
  const aiTasks = SCHED_TASKS.filter(t => t && t.mode === 'ai');
  // 立即用最新 prompt 重新生成（不等窗口）：替换为新分类内容
  for (const t of aiTasks) {
    if (!t.enabled) continue;
    try {
      const before = t.content || '';
      // v3.6.5 prompt 升级后重新生成「当天」计划（天气/补剂按当天、大便/早教按前一天）
      await generatePlanForTask(t, new Date(planTodayStr() + 'T00:00:00'));
      if (!t.content || t.content === before) {   // 生成失败 → 保留旧内容并清掉周期标记，之后窗口内还会重试
        t.content = before; t.genPeriod = ''; saveSchedTasks();
      }
    } catch (e) { console.warn('[计划] 发布后重新生成失败', e); }
  }
}
function initScheduler() {
  loadSchedTasks();
  // v3.6.6 开 app 先从家庭云拉任务（含服务端 0 点生成的当天计划）：拉取完成前不推送、不跑本地生成，
  // 避免本地陈旧状态（genDate 还是昨天）覆盖/顶掉云端最新计划（此前每次开 app 都必推一次）
  _schedCloudPullSettled = false;   // 先复位：新拉取开始，闸门重新关上
  _schedCloudPullPromise = Promise.resolve()
    .then(() => loadSchedCloud())
    .catch(() => false)
    .then(ok => { _schedCloudPullSettled = true; return ok; });
  const pullGate = () => Promise.race([_schedCloudPullPromise, new Promise(r => setTimeout(r, 8000))]);
  Promise.resolve(migratePlanPromptVersion())
    .then(() => pullGate())
    .then(() => runScheduler())
    .catch(() => runScheduler());
  loadWeatherAddrCloud().catch(() => {});
  // v3.5.154 云端 AI 密钥加载完成后再首次同步定时任务到家庭云（确保 ctx.ai 有值）
  Promise.resolve()
    .then(() => (typeof loadCloudAITagKey === 'function' ? loadCloudAITagKey() : null))
    .catch(() => {})
    .then(() => pullGate())
    .then(() => scheduleSchedCloudSave(1500));
  setInterval(runScheduler, 60000);
  // v3.6.6 页面常开时不拉云会看不到服务端 0 点生成的新计划：每 5 分钟 + 切回前台时补拉一次
  setInterval(() => { if (!document.hidden) loadSchedCloud().catch(() => {}); }, 5 * 60000);
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) { loadSchedCloud().catch(() => {}); runScheduler(); }
  });
}

/* ---------- 今日计划（首页总览卡片） ---------- */
// v3.6.3 首页今日计划只展示「当天」的计划：当天已生成(genDate==今天)或今天已推送。
// 0 点前未生成 → 无卡片；推送后同一份继续展示（只读）。
function getCurrentPlan() {
  const task = SCHED_TASKS.find(t => t.enabled && t.mode === 'ai');
  if (!task) return null;
  const todayStr = planTodayStr();   // v3.6.5 计划日=真实日历日（0 点翻页）
  const pushed = planPushedToday(task);
  if (task.content && (task.genDate === todayStr || pushed)) {
    return { text: task.content, editable: isPlanEditable(task), date: task.genDate || todayStr, today: true, pushed: pushed, pending: false };
  }
  return null;
}
// v3.5.141 总览卡片只显示摘要；点击「详情」弹窗看全部内容
function renderTodayPlanCardHTML() {
  const p = getCurrentPlan();
  if (!p) return '';
  const sp = splitPlan(p.text);
  const disp = sp.summary || (p.text ? p.text.split('\n')[0].slice(0, 40) : '（尚未生成）');
  return '<div class="ov-plan-card">'
    + '<span class="ov-plan-title">📅 今日计划</span>'
    + '<span class="ov-plan-summary">' + escapeHtml(disp) + '</span>'
    + '<span class="ov-plan-detail-btn" onclick="openPlanDetail()">详情</span>'
    + '</div>';
}
function renderTodayPlanCard() { try { updateOverview(true); } catch (e) {} }
function openPlanDetail() {
  const p = getCurrentPlan();
  const c = (p && p.text) || '';
  const sp = splitPlan(c);
  const sumEl = document.getElementById('planDetailSum');
  const bodyEl = document.getElementById('planDetailBody');
  if (sumEl) sumEl.innerHTML = sp.summary ? '📌 ' + escapeHtml(sp.summary) : '';
  if (bodyEl) bodyEl.textContent = (sp.detail || c || '（尚未生成）');
  showModal('planDetailModal');
}

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
// v3.5.140 任务卡片默认收起，点击标题展开查看/编辑计划内容
let taskExpanded = {};
function toggleTaskExpand(id) { taskExpanded[id] = !taskExpanded[id]; renderSchedTasks(); }
function renderSchedTasks() {
  const box = document.getElementById('tasksList'); if (!box) return;
  if (!SCHED_TASKS.length) { box.innerHTML = ''; return; }
  let h = '';
  SCHED_TASKS.forEach(t => {
    const editable = isPlanEditable(t);
    const nm = (t.name && String(t.name).trim()) ? String(t.name).trim() : (t.mode === 'ai' ? '今日计划' : '定时提醒');
    // v3.6.2 工资结算任务用 💰（与育儿嫂/工资语义匹配），AI 任务 🤖，其余 ✏️
    const icon = t.mode === 'ai' ? '🤖' : (t.mode === 'wage' ? '💰' : '✏️');
    const expanded = !!taskExpanded[t.id];
    h += '<div class="task-card" id="taskcard_' + t.id + '">'
      + '<div class="task-row">'
      + '<div class="task-info" onclick="toggleTaskExpand(\'' + t.id + '\')">'
      + '<div class="task-name' + (expanded ? ' open' : '') + '"><span class="task-chev">▶</span>' + icon + ' ' + escapeHtml(nm) + '</div>'
      + '<div class="task-sub">' + ((t.interval && t.interval > 1) ? ('每隔' + t.interval + (t.freq === 'daily' ? '天' : t.freq === 'weekly' ? '周' : '月') + ' · ') : '') + SCHED_FREQ_LABEL[t.freq] + ' ' + t.startDate + ' ' + t.startTime + ' · ' + (t.type === 'wage' ? '👩 育儿嫂工资结算' : (t.mode === 'ai' ? 'AI 推荐计划' : '自定义内容')) + (t.enabled ? '' : ' · 已停止') + '</div>'
      + '</div>'
      + '<div class="task-actions">'
      + '<span class="rec-edit" onclick="openTaskEditor(\'' + t.id + '\')" title="编辑"><svg viewBox="0 0 24 24"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg></span>'
      + '<span class="rec-del" onclick="deleteTask(\'' + t.id + '\')" title="删除"><svg viewBox="0 0 24 24"><path d="M3 6h18"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/></svg></span>'
      + '<div class="toggle-switch ' + (t.enabled ? 'on' : '') + '" data-tid="' + t.id + '" onclick="toggleTask(\'' + t.id + '\')" title="开启/关闭该任务"></div>'
      + '</div></div>';
    if (expanded) {
      h += '<div class="task-push-hint">' + (t.enabled ? '已开启，到点将推送微信消息' : '开启将会推送微信消息') + '</div>';
      if (t.mode === 'ai') {
        h += '<textarea class="task-plan" id="plan_' + t.id + '" placeholder="AI 推荐计划每天 0 点自动生成为此，可直接编辑"' + (editable ? '' : ' readonly') + ' onfocus="onPlanFocus(\'' + t.id + '\')" onclick="onPlanFocus(\'' + t.id + '\')" oninput="onPlanInput(\'' + t.id + '\',this.value)">' + escapeHtml(t.content || '') + '</textarea>';
      } else {
        h += '<textarea class="task-plan" id="plan_' + t.id + '" placeholder="输入到点要推送的消息内容" oninput="onPlanInput(\'' + t.id + '\',this.value)">' + escapeHtml(t.content || '') + '</textarea>';
      }
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
  let curInt = 1;
  if (id) {
    const t = SCHED_TASKS.find(x => x.id === id);
    setRadio('taskFreq', t.freq); setRadio('taskMode', t.mode);
    setTaskStartDateValue(t.startDate);
    setTaskTimeVal(t.startTime);
    curInt = t.interval || 1;
    document.getElementById('taskName').value = t.name || '';
    document.getElementById('taskCustom').value = t.content || '';
    // v3.6.45 需求③：满勤月工资/满勤天数（默认 10000 元 / 26 天，旧任务无此字段时回落默认）
    document.getElementById('taskBaseSalary').value = (t.baseSalary > 0) ? t.baseSalary : NANNY_BASE_SALARY;
    document.getElementById('taskPayDays').value = (t.payDays > 0) ? t.payDays : NANNY_PAY_DIVISOR;
  } else {
    setRadio('taskFreq', 'daily'); setRadio('taskMode', 'ai');
    setTaskStartDateValue(getTodayDateStr());
    setTaskTimeVal('08:00');
    document.getElementById('taskName').value = '';
    document.getElementById('taskCustom').value = '';
    document.getElementById('taskBaseSalary').value = NANNY_BASE_SALARY;
    document.getElementById('taskPayDays').value = NANNY_PAY_DIVISOR;
  }
  const ivEl = document.getElementById('taskInterval'); if (ivEl) ivEl.value = curInt;
  // v3.5.137 AI 推荐任务最多一个：新建时若已存在 AI 任务，禁用该选项并自动切到「自定义」
  setAIModeDisabled(hasOtherAITask(id || ''), !id);
  onFreqChange(); onModeChange();
  showModal('taskEditorModal');
}
// v3.6.45 需求③：读取工资结算的满勤月工资/满勤天数（0 或非法 → 回落默认 10000/26）
function getTaskWageVals() {
  const bsEl = document.getElementById('taskBaseSalary');
  const pdEl = document.getElementById('taskPayDays');
  const bs = parseFloat((bsEl && bsEl.value) || '');
  const pd = parseInt((pdEl && pdEl.value) || '', 10);
  return { baseSalary: (bs > 0) ? bs : NANNY_BASE_SALARY, payDays: (pd > 0 && pd <= 31) ? pd : NANNY_PAY_DIVISOR };
}
function saveTask() {
  const id = document.getElementById('taskEditId').value;
  const freq = document.querySelector('input[name="taskFreq"]:checked').value;
  const startDate = document.getElementById('taskStartDate').value;
  const startTime = getTaskTimeVal();
  const intervalEl = document.getElementById('taskInterval');
  const interval = Math.max(1, parseInt((intervalEl && intervalEl.value) || '1', 10) || 1);
  const mode = document.querySelector('input[name="taskMode"]:checked').value;
  const nameEl = document.getElementById('taskName');
  const name = nameEl ? nameEl.value.trim() : '';
  if (!startDate) { showToast('请选择开始日期'); return; }
  // v3.5.137 兜底校验：AI 推荐任务只允许存在一个
  if (mode === 'ai' && hasOtherAITask(id || '')) { showToast('已有 AI 推荐任务，最多只能添加一个'); return; }
  // v3.6.45 需求③：工资结算参数（满勤月工资/满勤天数）
  const wageVals = getTaskWageVals();
  if (id) {
    const t = SCHED_TASKS.find(x => x.id === id);
    t.name = name;
    t.freq = freq; t.interval = interval; t.startDate = startDate; t.startTime = startTime; t.mode = mode;
    t.type = (mode === 'wage') ? 'wage' : 'normal';
    if (mode === 'custom') t.content = document.getElementById('taskCustom').value;
    else if (mode === 'wage') { t.content = ''; if (!t.lastWageDate) t.lastWageDate = ''; t.baseSalary = wageVals.baseSalary; t.payDays = wageVals.payDays; }
  } else {
    const isWage = (mode === 'wage');
    SCHED_TASKS.push({ id: 't_' + Date.now(), name: name, freq: freq, interval: interval, startDate: startDate, startTime: startTime, mode: mode, type: isWage ? 'wage' : 'normal',
      content: mode === 'custom' ? document.getElementById('taskCustom').value : '', enabled: true, lastWageDate: isWage ? '' : undefined,
      baseSalary: isWage ? wageVals.baseSalary : undefined, payDays: isWage ? wageVals.payDays : undefined,
      genPeriod: '', pushPeriod: '', genTryTs: 0 });
  }
  const isNew = !id;
  const newId = isNew ? SCHED_TASKS[SCHED_TASKS.length - 1].id : id;
  if (isNew) taskExpanded[newId] = true;   // v3.5.155 新增后展开，便于一眼看到
  saveSchedTasks(); hideModal('taskEditorModal'); renderSchedTasks(); runScheduler(true);
  if (isNew) {
    const el = document.getElementById('taskcard_' + newId);
    if (el) { try { el.scrollIntoView({ block: 'center', behavior: 'smooth' }); } catch (e) { el.scrollIntoView(); } }
    showToast('已添加一条任务');
  }
}
function toggleTask(id) {
  const t = SCHED_TASKS.find(x => x.id === id); if (!t) return;
  t.enabled = !t.enabled; t.enabledTs = Date.now();   // v3.6.48 需求①：记录开关操作时间，供多设备/服务端冲突合并按新端裁决
  saveSchedTasks(); renderSchedTasks();
  // v3.6.48 需求①：开关即时上云（不等 5s 防抖）——关闭若卡在防抖窗内遇服务端 cron 到点，
  // 云端仍是 enabled=true，会照旧推送「已关闭的任务」
  scheduleSchedCloudSave(0);
  showToast(t.enabled ? '已开启，到点将推送微信消息' : '已关闭，不再推送');
  if (t.enabled) runScheduler(true);
}
// v3.5.155 删除任务：从列表移除后不再推送、不再出现在任务页；同步家庭云并触发调度更新
function deleteTask(id) {
  const t = SCHED_TASKS.find(x => x.id === id); if (!t) return;
  const nm = (t.name && String(t.name).trim()) ? String(t.name).trim() : (t.mode === 'ai' ? '今日计划' : '定时提醒');
  showConfirm('删除任务', '确定删除任务「' + nm + '」？\n删除后不再推送消息，且从任务页移除（不可恢复）。', function () {
    SCHED_TASKS = SCHED_TASKS.filter(x => x.id !== id);
    delete taskExpanded[id];
    _schedTombAdd(id);   // v3.6.6 记墓碑，防止云端旧任务被拉取合并时复活
    saveSchedTasks(); renderSchedTasks(); runScheduler(true);
    showToast('已删除任务：' + nm);
  }, '删除');
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
  // v3.6.0 间隔输入：单位跟随频率（天/周/月），仅一次时隐藏
  const unit = { daily: '天', weekly: '周', monthly: '月' }[freq] || '';
  const unitEl = document.getElementById('taskIntervalUnit');
  if (unitEl) unitEl.textContent = unit;
  const field = document.getElementById('taskIntervalField');
  if (field) field.style.display = (freq === 'once') ? 'none' : '';
}
function onModeChange() {
  const mode = document.querySelector('input[name="taskMode"]:checked').value;
  const f = document.getElementById('taskCustomField');
  // v3.6.1 工资结算任务不需要填写内容（默认只读文案），隐藏自定义输入框
  if (f) f.style.display = mode === 'custom' ? 'block' : 'none';
  const wf = document.getElementById('taskWageField');
  if (wf) wf.style.display = mode === 'wage' ? 'block' : 'none';
  // v3.6.0 育儿嫂工资任务默认按月结算：选择工资类型时强制频率为「每月」并展示间隔
  if (mode === 'wage') { setRadio('taskFreq', 'monthly'); onFreqChange(); }
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
// v3.6.0 早教/穿衣 知识库种子（供 AI 今日计划参考月龄早教建议与穿衣厚薄）；用户可改删
// v3.6.14 新增「户外」风速→风级换算（本地标准）种子，使计划风大/风小判断以知识库为准而非通用气象推算
// v3.6.50 用户需求「知识库中低于15算小风，但今日计划中16归为小风，应该以知识库为准」：旧种子条目措辞为
// 「以此为准」的 ≤19 口径，与用户知识库自定义的 ≤15 口径并存时会互相干扰（AI 难以区分哪条是用户写的）。
// 现 KB_EG_SEED_VER 3→4：①种子风速条目措辞软化为「仅用户未自定义时以此为准，用户自己写的风速档位一律优先」；
// ②seedAuthoritativeKB 清理旧版 ≤19「以此为准」种子条目；③用户 KB 已有任何风速/风级定义时不再注入种子风速条目。
// v3.6.40 新增「辅食」按月龄食谱种子（具体到水温/克数/稀稠/时段），使「辅食第N天」推荐以知识库为准
const KB_EG_SEED_VER = '4';
const KB_EG_SEEDS = [
  { cat: '早教', text: '4-6月：多趴卧练抬头与翻身、黑白卡追视、摇铃练追声；6-8月：读布书认物(动物/水果)、积木对敲练精细、躲猫猫练因果；8-12月：扶站学走、仿声学"爸爸/妈妈"、简单指令游戏。按宝宝当前月龄选做。' },
  { cat: '早教', text: '每日早教总时长建议 30-60 分钟，分段进行；宝宝状态好(吃饱睡足)时做，哭闹或犯困立刻停；不强迫，以游戏化、互动为主。' },
  { cat: '穿衣', text: '洋葱式穿衣：内层纯棉连体哈衣+中间马甲/薄外套+外层外套；判断标准——颈背温热干燥刚好，手脚微凉正常。气温 20-26℃ 一件薄连体+薄外套；15-20℃ 加马甲；10-15℃ 厚外套+帽子；<10℃ 羽绒+帽子+包被。' },
  { cat: '穿衣', text: '外出必带：根据气温备帽子(防晒/保暖)、薄包被或纱巾(风大时遮挡)；车内/室内暖气足要能随时减衣，避免捂热。' },
  { cat: '户外', text: '【风速→风级换算（本地参考标准，仅用户未自定义时以此为准）】最大风速 ≤19km/h 为4级以内=风小；20–38km/h 为5–6级=风稍大；≥39km/h 为7级及以上=风大（约上海大风蓝色预警风力）。据此安排户外与防风：风小→正常户外、可不戴帽或只戴薄帽、鼓励适当增加户外时长；风稍大→戴帽防风、婴儿车加防风罩、选避风时段与地点、适当缩短户外；风大→减少户外活动或改室内、必须戴帽并防风、避开风口与广告牌。注意风有风寒效应、体感更冷，户外穿衣在气温档基础上：风稍大升半档、风大升一档。**如知识库中已有用户自己写的风速档位标准（如「风小 ≤15km/h」「风稍大 15-30km/h」），一律以用户写的为准，本条仅作用户未自定义时的参考，不得与用户定义冲突或并用。**' },
  { cat: '辅食', text: '【辅食按月龄食谱（具体到水温与克数）】6月龄（刚添加）：富铁高铁米粉——用约50-60℃温开水，按包装比例约15g米粉+150ml水，冲成倾斜勺子能缓慢滴落的稀糊；从1勺开始，每天1次、上午10点左右喂，同一种连续吃3-5天无过敏再换。7-8月龄：米粉稍稠（约20g+170ml水，滴落能堆叠），可引入蛋黄（从1/8个渐至1/2个，蒸蛋羹或兑米糊）、肉泥/鱼泥/猪肝泥补铁、南瓜土豆苹果香蕉等泥。9-10月龄：稠粥软饭（10倍粥过渡到7倍粥）、碎菜碎肉末、豆腐，引入软条手指食物练抓握与咀嚼。11-12月龄：小馄饨、蒸糕、软饭小丁，性状接近家庭餐；1岁前不加盐糖、不喝鲜奶，每天奶量保持500ml左右。' },
  { cat: '辅食', text: '【辅食添加与观察原则】满6月龄（约180天）起添加，不早于4月、不晚于6月；首推富铁食物（高铁米粉、肉泥）；每次只引入一种新食物、连续观察2-3天无过敏再加下一种；由稀到稠、由少到多，每天增量不超过前一日2成；新食物安排在上午添加，便于白天观察过敏；发热、腹泻、接种前后3天暂停添加新食物；1岁前奶仍是主食（每天600-800ml），加辅食不骤减奶量。' }
];
function seedAuthoritativeKB() {
  try {
    if (localStorage.getItem('kb_auth_seed') === KB_SEED_VER && localStorage.getItem('kb_eg_seed') === KB_EG_SEED_VER) return;
    let added = 0;
    // v3.6.50（KB_EG_SEED_VER 3→4）：清理旧版种子风速条目（原样「本地标准，风大/风小以此为准」≤19 口径）——
    // 该措辞自称「以此为准」，会与用户知识库自定义的风速档位（如 ≤15=风小）互相干扰。
    for (let i = KB.length - 1; i >= 0; i--) {
      const x = KB[i];
      if (x && x.cat === '户外' && typeof x.text === 'string' && x.text.includes('风速→风级换算') && x.text.includes('风大/风小以此为准')) KB.splice(i, 1);
    }
    // v3.6.50：用户 KB 已有任何风速/风级自定义定义时，不再注入种子风速条目（避免两条阈值并存混淆 AI）
    const hasUserWindRule = KB.some(x => x && typeof x.text === 'string' && /km\/h|风速|风级|风小|风稍大|风大/.test(x.text));
    KB_AUTH_SEEDS.forEach(s => { if (s && !KB.some(x => x.text === s)) { KB.push({ text: s, cat: KB_AUTH_CAT }); added++; } });
    KB_EG_SEEDS.forEach(s => {
      if (!s) return;
      if (s.cat === '户外' && typeof s.text === 'string' && s.text.includes('风速→风级换算') && hasUserWindRule) return;
      if (!KB.some(x => x.text === s.text)) { KB.push({ text: s.text, cat: s.cat }); added++; }
    });
    localStorage.setItem('kb_auth_seed', KB_SEED_VER);
    localStorage.setItem('kb_eg_seed', KB_EG_SEED_VER);
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
  saveKBLocal(); await saveKBCloud();
  // v3.5.142 添加后：清空搜索、确保该分类可见、展开新条目，并滚动定位到它
  kbSearchQuery = '';
  const searchEl = document.getElementById('kbSearch'); if (searchEl) searchEl.value = '';
  kbSelectedCats = new Set(KB_FILTER_CATS);
  renderCatDropdownPanel('kb');
  kbExpanded.add(KB.length - 1);   // 展开刚添加的这条（索引为末尾）
  scrollKbToNew = true;
  renderKb(); updateKbCntLine();
  showToast('已添加一条记录');
  const cfg = getAITagConfig();
  if (cfg) {                                   // 异步用大模型精分（不阻塞）
    classifyKbLLM(v, cfg).then(c => {
      if (!c || c === cat) return;
      const idx = KB.findIndex(x => x.text === v && x.cat === cat);
      if (idx >= 0) { KB[idx].cat = c; if (Array.isArray(KB[idx].cats)) KB[idx].cats = [c]; saveKBLocal(); saveKBCloud(); renderKb(); updateKbCntLine(); }
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
// v3.6.44 需求⑦：编辑弹窗分类改为多选（checkbox-group，样式同添加记录）
let _kbEditIdx = -1, _kbEditOrigCat = '';
// v3.6.44 需求⑦：条目分类列表（兼容旧格式单 cat；cat 始终等于 cats[0]，供 AI 上下文等旧消费方使用）
function kbCatsOf(x) { return (x && Array.isArray(x.cats) && x.cats.length) ? x.cats : (x && x.cat ? [x.cat] : []); }
function editKb(i) {
  if (i < 0 || i >= KB.length) return;
  _kbEditIdx = i; _kbEditOrigCat = KB[i].cat;
  // 分类多选：可选分类 + 综合；若该条分类不在预设里（历史自定义），临时补进去，避免选择被重置
  const cats = KB_FILTER_CATS.concat();
  const cur = kbCatsOf(KB[i]);
  if (KB[i].cat && !cats.includes(KB[i].cat)) cats.unshift(KB[i].cat);
  const catRow = document.getElementById('kbEditCatRow');
  if (catRow) {
    catRow.innerHTML = '<label>分类（可多选）:</label>'
      + '<div class="checkbox-group" id="kbEditCatBox">'
      + cats.map(c => `<label><input type="checkbox" value="${_escAttr(c)}"${cur.indexOf(c) !== -1 ? ' checked' : ''}> ${_escAttr(c)}</label>`).join('')
      + '</div>';
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
  // v3.6.44 需求⑦：收集多选分类
  const box = document.getElementById('kbEditCatBox');
  const cats = [];
  if (box) box.querySelectorAll('input[type="checkbox"]').forEach(c => { if (c.checked) cats.push(c.value); });
  const origCats = kbCatsOf(KB[i]);
  const sameSet = cats.length === origCats.length && cats.every(c => origCats.indexOf(c) !== -1);
  KB[i].text = v;
  if (cats.length && !sameSet) {
    // 用户主动改了分类（多选）→ 尊重用户选择；cat 取首个，保持 AI 上下文等旧消费方兼容
    KB[i].cats = cats.slice();
    KB[i].cat = cats[0];
  } else {
    // 未改分类 → 沿用原有关键词自动重分类（保持旧行为）
    KB[i].cat = aiClassifyKb(v);
    delete KB[i].cats;
  }
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
    KB[i].cat = id; KB[i].cats = [id]; saveKBLocal(); saveKBCloud(); renderKb();
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
  const arr = KB.filter(x => kbCatsOf(x).some(c => kbSelectedCats.has(c)) && (!q || (x.text || '').toLowerCase().includes(q)));
  const cnt = document.getElementById('kbCnt'); if (cnt) cnt.textContent = KB.length;
  if (!arr.length) { list.innerHTML = '<div class="ai-kb-empty">该分类下还没有内容～</div>'; return; }
  list.innerHTML = arr.map(x => {
    const realIdx = KB.indexOf(x);
    const expanded = kbExpanded.has(realIdx);
    return `<div class="ai-kb-item${expanded ? ' expanded' : ' collapsed'}" onclick="toggleKbExpand(${realIdx})"><div class="kb-body">`
      // v3.6.44 需求⑦：多分类条目渲染多个标签（点任一标签都可改分类）
      + kbCatsOf(x).map(c => `<span class="ai-kb-tag" onclick="event.stopPropagation();reTagKb(${realIdx})" title="点此改分类">${escapeHtml(c)}</span>`).join('')
      + `<div class="kb-txt">${escapeHtml(x.text)}</div>`
      + `<div class="kb-toggle">${expanded ? '▾ 收起' : '▸ 展开'}</div>`
      + `</div>`
      + `<span class="rec-edit" onclick="event.stopPropagation();editKb(${realIdx})" title="编辑">${MEMO_EDIT_SVG}</span>`
      + `<span class="rec-delete" onclick="event.stopPropagation();delKb(${realIdx})" title="删除">${MEMO_DEL_SVG}</span></div>`;
  }).join('');
  // v3.5.142 添加新记录后：把列表滚动到新条目并短暂高亮
  if (scrollKbToNew) {
    scrollKbToNew = false;
    const newIdx = KB.length - 1;
    const pos = arr.indexOf(KB[newIdx]);          // 新条目在渲染列表中的位置
    const item = pos >= 0 ? list.children[pos] : list.lastElementChild;
    if (item) {
      try { item.scrollIntoView({ block: 'center', behavior: 'smooth' }); } catch (e) { item.scrollIntoView(); }
      item.classList.add('kb-just-added');
      setTimeout(() => { try { item.classList.remove('kb-just-added'); } catch (e) {} }, 2000);
    }
  }
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
  // v3.6.0 应用用户手动覆盖（类型/是否首次）
  const ov = loadMsOverride();
  for (const it of items) {
    it.domain = classifyMilestone(it.text);
    it.domains = [it.domain];   // v3.6.44 需求⑥：多类型（至少含自动分类的主类型）
    const ad = getAgeDetail(it.date);
    it.ageMonths = ad.months; it.ageDays = ad.days;
    const o = ov[msOverrideKey(it.date, it.text)];
    if (o) {
      // v3.6.44 需求⑥：兼容旧格式 domainId（单选）与新格式 domainIds（多选）
      const domIds = Array.isArray(o.domainIds) ? o.domainIds : (o.domainId ? [o.domainId] : []);
      if (domIds.length) {
        it.domains = domIds.map(msDomainById).filter(Boolean);
        it.domain = it.domains[0];
      }
      if (typeof o.isFirst === 'boolean') it.isFirst = o.isFirst;
    }
  }
  return items;
}
// v3.6.0 里程碑类型/首次 手动覆盖存储（localStorage + 加密同步家庭云）
const MILESTONE_OVERRIDE_KEY = 'ms_override_v1';
const MS_OVERRIDE_CLOUD_KEY = '_ms_override';
function msOverrideKey(date, text) { return date + '||' + text; }
function loadMsOverride() { try { return JSON.parse(localStorage.getItem(MILESTONE_OVERRIDE_KEY) || '{}') || {}; } catch { return {}; } }
function saveMsOverride(obj) { try { localStorage.setItem(MILESTONE_OVERRIDE_KEY, JSON.stringify(obj)); } catch {} saveMsOverrideCloud(); }
async function saveMsOverrideCloud() {
  if (typeof isSyncReady !== 'function' || !isSyncReady()) return;
  try {
    const key = await getCryptoKey(); if (!key) return;
    const { data, iv } = await encrypt(key, JSON.stringify(loadMsOverride()));
    await supabaseUpsert('family_config', { family_id: getFamilyId(), config_key: MS_OVERRIDE_CLOUD_KEY, encrypted_data: data, iv, last_modified: Date.now() });
  } catch (e) { console.warn('[里程碑] 云同步失败', e); }
}
async function loadMsOverrideCloud() {
  if (typeof isSyncReady !== 'function' || !isSyncReady()) return;
  try {
    const key = await getCryptoKey(); if (!key) return;
    const rows = await supabaseGet(`family_config?family_id=eq.${getFamilyId()}&config_key=eq.${MS_OVERRIDE_CLOUD_KEY}&select=encrypted_data,iv`);
    if (rows.length && rows[0].encrypted_data && rows[0].iv) {
      const obj = JSON.parse(await decrypt(key, rows[0].encrypted_data, rows[0].iv));
      if (obj && typeof obj === 'object') { localStorage.setItem(MILESTONE_OVERRIDE_KEY, JSON.stringify(obj)); }
    }
  } catch (e) { console.warn('[里程碑] 云加载失败', e); }
}

/* ==================== 成就点赞（v3.6.7 / v3.6.9） ====================
 * v3.6.9：首页「今日成就」只保留一个赞（代表当天成就整体，按天存储），图标放大一倍、点赞/取消区分度明显，
 *         点赞后提示「已点赞，真棒！」，取消不提示；点赞状态加密同步家庭云，所有家人可见。
 * 历史、成长里程碑只读展示点赞图标（👍），不可取消。
 * 点赞 key = 记录日期（achLikeKey）：首页用业务日(getTodayDateStr)、历史用所选日期、
 * 里程碑用记录日期 it.date —— 三者都指向同一天，保持一致。
 */
const LIKE_CLOUD_KEY = '_ach_like';
let _achLikes = {};                 // { "2026-10-15": true } 按天点赞
function achLikeKey(ds) { return String(ds == null ? '' : ds); }
function isAchLiked(ds) { return !!_achLikes[achLikeKey(ds)]; }
function loadAchLikesLocal() {
  try { _achLikes = JSON.parse(localStorage.getItem('ach_likes') || '{}') || {}; } catch (e) { _achLikes = {}; }
}
function saveAchLikesLocal() {
  try { localStorage.setItem('ach_likes', JSON.stringify(_achLikes)); } catch (e) {}
}
// 从家庭云拉取点赞并与本地合并（并集）：云端新增的点赞补到本地，本地删除的（本机取消）以本地为准
async function loadAchLikesCloud() {
  if (typeof isSyncReady !== 'function' || !isSyncReady()) return false;
  try {
    const key = await getCryptoKey(); if (!key) return false;
    const rows = await supabaseGet(`family_config?family_id=eq.${getFamilyId()}&config_key=eq.${LIKE_CLOUD_KEY}&select=encrypted_data,iv`);
    if (!rows || !rows.length || !rows[0].encrypted_data || !rows[0].iv) return false;
    const obj = JSON.parse(await decrypt(key, rows[0].encrypted_data, rows[0].iv));
    const cloud = (obj && obj.likes) || {};
    let changed = false;
    for (const k in cloud) { if (cloud[k] && !_achLikes[k]) { _achLikes[k] = true; changed = true; } }
    if (changed) saveAchLikesLocal();
    return changed;
  } catch (e) { console.warn('[点赞] 云端加载失败', e); return false; }
}
// 把本地点赞推送到家庭云（全量写入；本机取消掉的 key 不在 _achLikes 中即被移除）
async function saveAchLikesCloud() {
  if (typeof isSyncReady !== 'function' || !isSyncReady()) return;
  try {
    const key = await getCryptoKey(); if (!key) return;
    const body = JSON.stringify({ likes: _achLikes, ts: Date.now() });
    const { data, iv } = await encrypt(key, body);
    await supabaseUpsert('family_config', { family_id: getFamilyId(), config_key: LIKE_CLOUD_KEY, encrypted_data: data, iv, last_modified: Date.now() });
  } catch (e) { console.warn('[点赞] 云端保存失败', e); }
}
// 切换点赞（仅首页可操作，按天）：先拉云端合并，再翻转本地，再推送，最后刷新相关视图
async function toggleAchLike(ds, evt) {
  const k = achLikeKey(ds);
  try { await loadAchLikesCloud(); } catch (e) {}
  const was = !!_achLikes[k];
  if (was) delete _achLikes[k]; else _achLikes[k] = true;
  saveAchLikesLocal();
  if (!was) showToast('已点赞，真棒！');   // 取消点赞不提示
  try { await saveAchLikesCloud(); } catch (e) {}
  refreshAchLikeUI(ds);
  if (evt && evt.stopPropagation) evt.stopPropagation();
}
// 点赞状态变化后刷新三处视图（仅刷新当前可见者，避免无谓重绘）
function refreshAchLikeUI() {
  try { updateOverview(true); } catch (e) {}
  const histModal = document.getElementById('historyModal');
  if (histModal && histModal.classList.contains('show')) { try { loadHistory(); } catch (e) {} }
  const tl = document.getElementById('milestoneTimeline');
  if (tl) { try { tl.innerHTML = renderMilestoneInner(); } catch (e) {} }
}

let _milestoneItems = [];
let _milestoneExpanded = false;
const MILESTONE_PREVIEW = 5;

// ============ v3.5.105 里程碑徽章刷新频率控制：每 14 天凌晨 1 点窗口才刷新，其他时间沿用缓存 ============
const MS_BADGE_CACHE_KEY = 'ms_badge_cache';
const MS_BADGE_LAST_KEY = 'ms_badge_last_update';
// 是否到了「刷新徽章」的窗口：距上次刷新 >= 15 天，且当天已过凌晨 1 点（锚定刷新时刻，避免跨日午夜误触发）
function shouldRefreshMilestones(now) {
  now = now || Date.now();
  const last = Number(localStorage.getItem(MS_BADGE_LAST_KEY) || 0);
  if (now - last < 15 * 86400000) return false;   // 未到 15 天
  if (new Date(now).getHours() < 1) return false;  // 当天凌晨 1 点前不触发
  return true;
}
// 把当前里程碑分类结果（含 AI/规则 domain 与 label）缓存到本地，并刷新「上次刷新时间」
// v3.6.29 增加 badges 参数：三大徽章的固化快照（一旦确定不再随周期刷新而改变）
function saveMilestoneBadgeCache(items, badges) {
  try {
    const data = (items || []).map(it => ({
      text: it.text, date: it.date, isFirst: it.isFirst,
      ageMonths: it.ageMonths, ageDays: it.ageDays,
      label: it.label || null, domainId: it.domain ? it.domain.id : 'other'
    }));
    const obj = { ts: Date.now(), items: data };
    if (badges) obj.badges = badges.map(b => ({ groupIdx: b.groupIdx, text: b.text, label: b.label || null, date: b.date, domainId: b.domainId || null }));
    localStorage.setItem(MS_BADGE_CACHE_KEY, JSON.stringify(obj));
    localStorage.setItem(MS_BADGE_LAST_KEY, String(Date.now()));
  } catch {}
}
// 读取上次刷新的徽章分类结果；无缓存返回 null（此时回落为当前规则结果）
// v3.6.29 返回 { items, badges }；旧格式缓存（无 badges）返回 badges=null，由调用方推导
function loadMilestoneBadgeCache() {
  try {
    const raw = localStorage.getItem(MS_BADGE_CACHE_KEY);
    if (!raw) return null;
    const obj = JSON.parse(raw);
    if (!obj || !Array.isArray(obj.items)) return null;
    return {
      items: obj.items.map(it => ({
        text: it.text, date: it.date, isFirst: it.isFirst,
        ageMonths: it.ageMonths, ageDays: it.ageDays,
        label: it.label, domain: msDomainById(it.domainId)
      })),
      badges: Array.isArray(obj.badges) ? obj.badges.map(b => ({ groupIdx: b.groupIdx, text: b.text, label: b.label || null, date: b.date, domainId: b.domainId || null })) : null
    };
  } catch { return null; }
}
// v3.6.29 徽章固化：从 items 推导三大徽章快照（挑选逻辑与 renderMilestoneBadges 一致）。
// 返回稀疏数组 [{groupIdx, text, label, date, domainId, fresh}]——fresh 表示本次新固化（AI 回来后可用其 label 美化一次）。
// domainId 一并固化：无 label 的徽章标题回退简化时仍需领域关键词（v3.6.29 修复「固化徽章显示原文而非关键词」）。
// 背景：旧逻辑每 15 天周期重算徽章，且刷新时先把「无 AI 标签的规则结果」存缓存，
// 若 AI 异步返回前用户离开/失败，缓存被污染 → 之后 15 天徽章标题从 AI 概括退化为规则截断（用户反馈「突然改乱」）。
// 叠加 v3.6.17 起 enrichMilestonesWithLLM 内 Promise.allSettled(async) 必抛（v3.6.29 修复）→ AI label 实际从未落盘。
function deriveBadgesFromItems(items) {
  const out = [];
  MILESTONE_BADGE_GROUPS.forEach((g, idx) => {
    const hit = (items || []).find(i => i.isFirst && msDomainsOf(i).some(d => g.domains.indexOf(d.id) !== -1));
    if (hit) out[idx] = { groupIdx: idx, text: hit.text, label: (hit.label && hit.label.trim()) ? hit.label.trim() : null, date: hit.date, domainId: hit.domain.id, fresh: true };
  });
  return out;
}

// 徽章行：三大类别各取一条「最新达成的首次」成就，简化描述 + 完整日期；点击看全文
// v3.6.29 badges 为固化快照（稀疏数组）：存在即优先使用，徽章不再随周期刷新/新记录而改变；仅未固化组才从 items 现找
// 固化 hit 携带 domain（domainId 反查，兼容无 domainId 的旧快照时按文本重新归类）——保证标题简化与点击展开详情可用
let _msBadgeHits = [];        // 徽章对应的原始条目（供点击展开）
let _msBadgeOpen = -1;        // 当前展开的徽章索引，-1 = 无
function renderMilestoneBadges(items, badges) {
  _msBadgeHits = [];
  _msBadgeOpen = -1;
  let html = '<div class="ms-badges" id="milestoneBadges">';
  MILESTONE_BADGE_GROUPS.forEach((g, idx) => {
    // items 已按日期倒序 → 第一个命中的即为该类别最新达成的首次成就
    const fixed = badges && badges[idx];
    let hit;
    if (fixed) {
      hit = { text: fixed.text, label: fixed.label, date: fixed.date,
              domain: fixed.domainId ? msDomainById(fixed.domainId) : classifyMilestone(fixed.text) };
      // v3.6.34 固化 hit 补全详情展开所需字段（用户反馈：点击徽章显示「undefined月龄」）：
      // ① isFirst——徽章定义即「最新达成的首次成就」，旧实现缺此字段导致详情不标「首次」；
      // ② ageMonths/ageDays——优先取 items 中同 text（同 date 优先）的完整条目，取不到则按出生日期现算，
      //    兜底 try/catch + renderBadgeDetail 对缺失月龄不渲染该段，绝不再出现 undefined。
      hit.isFirst = true;
      const src = (items || []).find(i => i.text === fixed.text && i.date === fixed.date)
               || (items || []).find(i => i.text === fixed.text);
      if (src && src.ageMonths != null) { hit.ageMonths = src.ageMonths; hit.ageDays = src.ageDays; }
      else { try { const ad = getAgeDetail(fixed.date); hit.ageMonths = ad.months; hit.ageDays = ad.days; } catch { hit.ageMonths = null; hit.ageDays = null; } }
    } else {
      hit = (items || []).find(i => i.isFirst && msDomainsOf(i).some(d => g.domains.indexOf(d.id) !== -1));
    }
    if (hit) {
      _msBadgeHits[idx] = hit;
      let short = (hit.label && hit.label.trim()) ? hit.label.trim() : simplifyMilestone(hit.text, hit.domain);
      short = short.replace(/\s+/g, ' ').trim();
      if (short.length > 10) short = short.slice(0, 10) + '…';   // v3.6.16 徽章标题硬截断，避免甩长句
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
  // v3.6.34 月龄兜底：缺失时不渲染该段（绝不再显示「undefined月龄」）
  const ageTxt = (it.ageMonths == null) ? '' : ` · ${it.ageMonths}月龄${it.ageDays > 0 ? it.ageDays + '天' : ''}`;
  return `<div class="ms-badge-detail" onclick="toggleMilestoneBadge(${_msBadgeOpen})">` +
    `<div class="ms-bd-text">${it.text.replace(/</g, '&lt;')}</div>` +
    `<div class="ms-bd-meta">${it.date} · ${it.domain.icon} ${it.domain.name}` +
      (it.isFirst ? ' · 首次' : '') + ageTxt + `</div>` +
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
      // v3.6.44 需求⑥：多类型条目渲染多个标签（主类型决定卡片左边框色）
      const d = it.domain;
      const domTags = msDomainsOf(it).map(dm => `<span class="ms-tag" style="background:${dm.color}22;color:${dm.color}">${dm.icon} ${dm.name}</span>`).join('');
      const gi = _milestoneItems.indexOf(it);
      cards += `<div class="ms-card" style="border-left-color:${d.color}">` +
        `<div class="ms-text">${it.text.replace(/</g, '&lt;')}</div>` +
        `<div class="ms-meta">` +
          domTags +
          (it.isFirst ? `<span class="ms-first">首次</span>` : '') +
          (isAchLiked(it.date) ? `<span class="ms-like-icon" title="已点赞">👍</span>` : '') +
        `</div>` +
        // v3.6.1 编辑图标与首页记录卡一致（SVG 铅笔，复用 .rec-edit 样式）
        `<span class="rec-edit ms-edit" onclick="openMsEdit(${gi})" title="修改类型/首次"><svg viewBox="0 0 24 24"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg></span>` +
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
// v3.6.0 里程碑编辑：修改类型（可多选，v3.6.44 需求⑥）/是否首次
let _msEditIdx = -1, _msEditFirst = false;
function openMsEdit(idx) {
  const it = _milestoneItems[idx]; if (!it) return;
  _msEditIdx = idx; _msEditFirst = !!it.isFirst;
  // v3.6.44 需求⑥：类型改多选——checkbox-group（样式同添加记录），全领域+成长点滴
  const box = document.getElementById('msEditTypeBox');
  if (box) {
    const doms = msDomainsOf(it);
    box.innerHTML = MILESTONE_DOMAINS.concat([MILESTONE_OTHER]).map(d =>
      '<label><input type="checkbox" value="' + d.id + '"' + (doms.some(x => x.id === d.id) ? ' checked' : '') + '> ' + d.icon + ' ' + d.name + '</label>').join('');
  }
  // v3.6.2 是否首次改用原生 radio（与辅食饭后情况同款），用 checked 回显
  const yes = document.getElementById('msFirstYes'), no = document.getElementById('msFirstNo');
  if (yes) yes.checked = _msEditFirst;
  if (no) no.checked = !_msEditFirst;
  showModal('msEditModal');
}
function setMsFirst(v) {
  _msEditFirst = !!v;
  const yes = document.getElementById('msFirstYes'), no = document.getElementById('msFirstNo');
  if (yes) yes.checked = _msEditFirst;
  if (no) no.checked = !_msEditFirst;
}
function saveMsEdit() {
  const it = _milestoneItems[_msEditIdx]; if (!it) { hideModal('msEditModal'); return; }
  // v3.6.44 需求⑥：收集多选类型（一个都没勾则沿用原类型，防止误清空）
  const box = document.getElementById('msEditTypeBox');
  let domIds = [];
  if (box) box.querySelectorAll('input[type="checkbox"]').forEach(c => { if (c.checked) domIds.push(c.value); });
  if (!domIds.length) domIds = msDomainsOf(it).map(d => d.id);
  const ov = loadMsOverride();
  ov[msOverrideKey(it.date, it.text)] = { domainIds: domIds, isFirst: _msEditFirst };
  saveMsOverride(ov);
  // v3.6.30 用户明确：徽章只每 15 天刷新窗口更新一次，期内连「编辑里程碑」也不重新更新
  // ——保留徽章固化快照不动；仅把缓存 items 换成最新结果（时间轴/分类计数即时生效）
  _milestoneItems = collectMilestones();
  const _c = loadMilestoneBadgeCache();
  if (_c && _c.badges) {
    const _prevLast = localStorage.getItem(MS_BADGE_LAST_KEY);
    saveMilestoneBadgeCache(_milestoneItems, _c.badges);          // items 刷新，badges 原样保留
    if (_prevLast) localStorage.setItem(MS_BADGE_LAST_KEY, _prevLast);   // 编辑不重置 15 天刷新锚
    const be = document.getElementById('milestoneBadges'); if (be) be.outerHTML = renderMilestoneBadges(_milestoneItems, _c.badges);
  } else {
    // 尚无固化快照（未到过刷新窗口）：按当前结果展示，不落盘（等刷新窗口再定）
    const be = document.getElementById('milestoneBadges'); if (be) be.outerHTML = renderMilestoneBadges(_milestoneItems);
  }
  const tl = document.getElementById('milestoneTimeline'); if (tl) tl.innerHTML = renderMilestoneInner();
  hideModal('msEditModal');
  showToast('已更新里程碑');
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
// v3.6.25→v3.6.29：缓存带回 {items, badges}；badges 为固化徽章快照（旧格式缓存无 badges 时由 items 现推导并即刻固化）
let _msBadges = null;        // v3.6.29 本次渲染实际使用的徽章快照（openAnalysis 刷新窗口据此保存/AI 美化）
function makeMilestoneTimeline(useCacheBadge) {
  const items = collectMilestones();
  _milestoneItems = items;
  let badgeItems = items;
  _msBadges = null;
  if (useCacheBadge) {
    // 非刷新窗口：徽章用缓存快照（一旦固化不再随周期/新记录改变）
    const c = loadMilestoneBadgeCache();
    if (c) {
      badgeItems = c.items;
      if (c.badges) _msBadges = c.badges;
      else {
        // 旧格式缓存（无 badges）：用缓存 items 推导一次并即时固化，防止升级后首次打开又变
        _msBadges = deriveBadgesFromItems(c.items);
        const _prevLast = localStorage.getItem(MS_BADGE_LAST_KEY);
        saveMilestoneBadgeCache(c.items, _msBadges);
        if (_prevLast) localStorage.setItem(MS_BADGE_LAST_KEY, _prevLast);   // 格式升级不重置 15 天刷新锚
      }
    }
  } else {
    // 刷新窗口/首次：旧徽章原样保留，只补未解锁组；渲染即用合并结果
    // （v3.6.29 修复：旧代码此分支 badges=null，首渲染退化为「原始重算值」，AI 失败/离开即污染）
    const oldCache = loadMilestoneBadgeCache();
    const oldBadges = (oldCache && oldCache.badges) || [];
    _msBadges = oldBadges.slice();
    deriveBadgesFromItems(items).forEach((b, idx) => { if (b && !_msBadges[idx]) _msBadges[idx] = b; });
  }
  const head = `<div class="chart-card"><div class="chart-title">🏆 成长里程碑</div>`;
  if (!items.length) {
    return head + `<div class="chart-empty">还没有成就记录<br><span style="font-size:12px;opacity:.7">记录时写点什么，比如「第一次翻身」</span></div></div>`;
  }
  const firstCount = items.filter(i => i.isFirst).length;
  const nowAge = getAgeDetail(getTodayDateStr());
  const stat = `<div class="ms-stat">当前 ${nowAge.months}月龄${nowAge.days > 0 ? nowAge.days + '天' : ''} · 共 ${items.length} 条 · ${firstCount} 个「第一次」</div>`;
  return head + stat + renderMilestoneBadges(badgeItems, _msBadges) +
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
  // —— 吃睡：奶量趋势 + 奶量及次数(合并) + 睡眠时长 + 辅食情况（v3.6.4 睡眠时长移到辅食上方） ——
  html += `<div class="tab-panel" data-panel="feed">`;
  html += makeMilkTrendChart();   // 奶量趋势（全部记录，双轴：总奶量 + 单次平均）
  html += makeMilkCountComboChart(milkData, milkCountData, milkStdRows); // 奶量及次数（双轴柱状，合并）
  html += makeBarChart(sleepData, { title: '😴 每日睡眠时长（近15天）', unit: 'h', color: '#7da8e6', fmt: v => v.toFixed(1), tickStep: 2, stdLines: [{ values: sleepStdRows.map(r => r.min) }, { values: sleepStdRows.map(r => r.max) }] }); // 睡眠时长（v3.6.4 移到辅食情况上方）
  html += makeSolidFoodAnalysis();    // 辅食情况（环形统计 + 时间轴）
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
    leftFold: { base: 100, step: 20 },          // v3.5.142 0~100 等间隔 20，>100 折叠到顶部，便于看 100 内变化
    rightLabel: '乳糖酶量', rightUnit: '滴', rightFmt: v => String(v),
    xTickMode: 'keyDates',
    leftTipText: d => (d.count > 1 ? `${d.value}分钟 · ${d.count}次平均` : `${d.value}分钟`),
    rightTipText: d => `${d.value}滴`
  });
  // v3.5.87 体重变化（与上方大便图同横轴，便于上下对照）：左=体重kg(蓝实线带点，刻度同体重趋势)，右=乳糖酶量(橘虚线)
  //         最新日期若体重为空，左线自然断开（不画线）
  // v3.5.95 横轴改为「大便间隔日 ∪ 该范围内的体重记录日」：修掉"没大便那天量的体重在图上消失"的问题
  // v3.5.163 横轴右界放宽到「今日」：当天量的体重当即上点，标题同步改「截止今日」
  const weightAxis = buildWeightDualAxis(poopGapPts);
  const weightDualLeft = weightAxis.map(p => ({ ds: p.ds, label: p.label, t: p.t, value: weightRecordedOn(p.ds) }));
  const weightDualRight = weightAxis.map(p => ({ ds: p.ds, label: p.label, t: p.t, value: getLactaseByDate(p.ds) }));
  html += makeLactaseDualChart(weightDualLeft, weightDualRight, {
    title: '⚖️ 体重变化（截止今日）',
    leftLabel: '体重', leftUnit: 'kg', leftFmt: fmtWeight,
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
  html += makeLineChart(toChart(weightPts), { title: '⚖️ 体重趋势', unit: 'kg', color: '#6ec6ff', fmt: fmtWeight, yMin: 3, yStep: 1, xTickMode: 'keyDates', who: { table: WHO_WEIGHT }, zoomTiers: { min: 3, step: 1 } });
  html += makeLineChart(toChart(heightPts), { title: '📏 身高趋势', unit: 'cm', color: '#6ec6ff', fmt: v => v.toFixed(1), yMin: 48, yStep: 2, xTickMode: 'keyDates', who: { table: WHO_HEIGHT }, zoomTiers: { min: 50, step: 5 } });
  const _msRefresh = shouldRefreshMilestones();
  html += makeMilestoneTimeline(!_msRefresh);   // 成长里程碑时间轴（徽章快照由 makeMilestoneTimeline 计算并暴露为 _msBadges）
  html += `</div>`;
  content.innerHTML = html;
  bindChartTipDismiss();
  // v3.5.86 渲染后恢复到重渲染前激活的标签（首次打开无历史激活则维持默认「吃睡」）
  if (_prevTab && _prevTab !== 'feed') { try { switchAnalysisTab(_prevTab); } catch (e) {} }
  showModal('analysisModal');
  // v3.5.105 仅在「刷新窗口」才调用 AI/规则回写并重算徽章；其他时间沿用缓存（不调 AI、不重算）
  if (_msRefresh) {
    // v3.6.29 徽章固化：无论是否配置 AI，先锚定刷新时间并保存合并后的徽章（含已定徽章）
    // ——修复「AI 异步返回前用户离开/失败 → 缓存被无标签规则结果污染」
    saveMilestoneBadgeCache(_milestoneItems, _msBadges);
    const cfg = getAITagConfig();
    if (cfg) enrichMilestonesWithLLM(_milestoneItems, _msBadges)
      .then(() => saveMilestoneBadgeCache(_milestoneItems, _msBadges))
      .catch(() => showToast('徽章 AI 概括失败，已按规则概括（可到 管理 → AI 设置 点「测试」检查密钥）'));
  } else if (!_msBadges || _msBadges.some(b => b && !b.label)) {
    // v3.6.32 期内补救：存在「已固化但无 AI label」的徽章组（旧格式缓存升级 / 无 AI 时固化 / AI 调用失败遗留，
    // 或从未固化过）——15 天刷新窗口只补新解锁组，这些组永远等不到 AI 美化（用户反馈「徽章像没调 AI」根因）。
    // 打开分析即尝试 AI 美化一次：不改 15 天周期、不动已有 AI label 的组；失败 24h 节流避免每次打开都打 API。
    // v3.6.33 逻辑抽为 msRemedyBadgeLabels（saveAITagConfig 保存密钥后也会调用：配好即补，不用再打开分析）；
    // 补救全部失败时有 toast 提示（不再无声）。
    const cfg = getAITagConfig();
    if (cfg) {
      msRemedyBadgeLabels(_milestoneItems, _msBadges, { silent: true });   // 用户正看着徽章变化，成功不弹 toast
    } else {
      // AI 未配置：明确告知去向（24h 节流，避免每次打开都弹）
      const _lastTip = Number(localStorage.getItem('ms_badge_ai_tip') || 0);
      if (Date.now() - _lastTip > 86400000) {
        localStorage.setItem('ms_badge_ai_tip', String(Date.now()));
        showToast('徽章 AI 概括未启用：请到 管理 → AI 设置 配置密钥（可先点「测试」验证）');
      }
    }
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
function hideModal(id) { const el = document.getElementById(id); if (!el) return; resetModalFullscreen(el); el.classList.remove('show'); document.body.style.overflow = ''; if (id === 'manageModal' && eeAuditionId) eeStopAudition(); }
function closeModal(e, id) { if (e.target.id === id) hideModal(id); }
function showToast(msg, ms) { const toast = document.getElementById('toast'); toast.textContent = msg; toast.classList.add('show'); setTimeout(() => toast.classList.remove('show'), ms || 1800); }
// v3.5.155 通用二次确认弹窗（替代原生 confirm，风格统一且不会被 webview 拦截）
let _confirmCb = null;
function showConfirm(title, msg, onConfirm, okText) {
  document.getElementById('confirmTitle').textContent = title || '确定操作？';
  document.getElementById('confirmMsg').textContent = msg || '';
  const okBtn = document.getElementById('confirmOkBtn');
  okBtn.textContent = okText || '删除';
  _confirmCb = (typeof onConfirm === 'function') ? onConfirm : null;
  showModal('confirmModal');
}
function hideConfirm() { _confirmCb = null; hideModal('confirmModal'); }
function runConfirm() { const cb = _confirmCb; _confirmCb = null; hideModal('confirmModal'); if (cb) cb(); }

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
async function deriveKey(familyCode, saltB64, noCache) {
  if (!noCache && _cryptoKey && _cryptoFamilyCode === familyCode) return _cryptoKey;
  const salt = b64ToBuf(saltB64);
  const baseKey = await crypto.subtle.importKey('raw', new TextEncoder().encode(familyCode), {name:'PBKDF2'}, false, ['deriveKey']);
  const key = await crypto.subtle.deriveKey({name:'PBKDF2', salt, iterations:310000, hash:'SHA-256'}, baseKey, {name:'AES-GCM', length:256}, false, ['encrypt','decrypt']);
  if (!noCache) { _cryptoKey = key; _cryptoFamilyCode = familyCode; }
  return key;
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
      // v3.6.52 云端盐解析加安全闸：家庭已有数据行时，即使 _salt 查询为空也绝不新建随机盐
      // （老逻辑在此把家庭密钥打挂过：服务端连续解密失败、今日计划停更，见 resolveCloudSalt 注释）
      const r = await resolveCloudSalt(getFamilyId());
      if (!r.ok) {
        console.error('[Crypto] 云端盐异常，暂不新建（避免覆盖家庭密钥）:', r.reason);
        if (r.reason === 'data-but-no-salt') showToast('云端密钥记录缺失，请用原手机打开 App 修复后再同步');
        return null;
      }
      if (r.salt) {
        salt = r.salt;
        localStorage.setItem('family_salt', salt);
        console.log('[Crypto] 已拉取云端 salt，加入现有家庭');
        return await deriveKey(fc, salt);
      }
      // 云端确认没有 salt 且家庭无任何数据：新建（首次创建家庭）
      salt = bufToB64(crypto.getRandomValues(new Uint8Array(16)));
      localStorage.setItem('family_salt', salt);
      await uploadSalt(salt);
      console.log('[Crypto] 新建家庭 salt');
    } else {
      return null;   // v3.6.17 未配置同步且本地无 salt：不派生垃圾密钥
    }
  }
  return await deriveKey(fc, salt);
}
/* v3.6.17 盐一致性判定：本地与云端 salt 不一致时，用多行云端数据分别试解，多数决。
 * 返回 'local'（本地盐能解密家庭数据 → 用本地修复云端）/ 'cloud'（云端盐才是对的 → 采纳云端）/
 * 'unknown'（没有可用验证数据 → 不覆盖任何一方）。
 * 修复的漏洞：旧逻辑只验证「今天」的记录，当天无记录/网络抖动时两者都判失败 →
 * 无条件上传本地盐覆盖云端，把家庭密钥打挂（服务端定时任务因此连续解密失败、今日计划停更）。 */
async function _judgeSalt(fid, localSaltB64, cloudSaltB64) {
  const fc = localStorage.getItem('family_code');
  if (!fc || !localSaltB64 || !cloudSaltB64) return 'unknown';
  let localKey = null, cloudKey = null;
  try { localKey = await deriveKey(fc, localSaltB64, true); } catch { return 'unknown'; }
  try { cloudKey = await deriveKey(fc, cloudSaltB64, true); } catch { return 'unknown'; }
  // 候选行：最近 6 天记录（一次查询）+ 常用配置键
  const cands = [];
  cands.push(`family_records?family_id=eq.${fid}&select=encrypted_data,iv&order=record_date.desc&limit=6`);
  for (const ck of ['_memo', '_ai_kb', '_ms_override', 'bodyHistory', 'babyHeight', 'babyWeight', 'milkDefaultAmount', '_early_edu', '_sched_cloud']) {
    cands.push(`family_config?family_id=eq.${fid}&config_key=eq.${ck}&select=encrypted_data,iv`);
  }
  let localWins = 0, cloudWins = 0, tested = 0;
  for (const q of cands) {
    let rows = null;
    try { rows = await supabaseGet(q); } catch { continue; }
    if (!Array.isArray(rows)) continue;
    for (const r0 of rows) {
      if (!r0 || !r0.encrypted_data || !r0.iv) continue;
      tested++;
      let lok = false, cok = false;
      try { await decrypt(localKey, r0.encrypted_data, r0.iv); lok = true; } catch {}
      if (!lok) { try { await decrypt(cloudKey, r0.encrypted_data, r0.iv); cok = true; } catch {} }
      if (lok && !cok) localWins++;
      else if (cok && !lok) cloudWins++;
    }
  }
  if (!tested) return 'unknown';          // 无验证数据：不覆盖
  if (localWins > cloudWins) return 'local';
  if (cloudWins > localWins) return 'cloud';
  return 'unknown';                        // 平局也无法判定：不覆盖（保留云端，fail-safe）
}
/* v3.6.17 盐一致性巡检：本地与云端 salt 不一致时判定并修复；一致时仅 1 次轻量查询。
 * 调用点：syncUpload（推送前）+ 开 App 后定期巡检（保证不做任何操作也能自愈）。 */
async function checkSaltConsistency() {
  if (typeof isSyncReady !== 'function' || !isSyncReady()) return;
  const fid = getFamilyId(); if (!fid) return;
  const localSalt = localStorage.getItem('family_salt');
  if (!localSalt) return;   // 本地无 salt 由 getCryptoKey 处理（拉取/新建）
  let saltRows = null;
  try { saltRows = await supabaseGet(`family_config?family_id=eq.${fid}&config_key=eq._salt&select=encrypted_data`); }
  catch (e) { return; }     // 网络问题：下次再查
  if (!saltRows || !saltRows.length || !saltRows[0].encrypted_data) return;
  const cloudSalt = saltRows[0].encrypted_data;
  if (cloudSalt === localSalt) return;    // 一致，无需处理
  console.warn('[Sync] 检测到云端 salt 与本地不一致，开始判定');
  const verdict = await _judgeSalt(fid, localSalt, cloudSalt);
  if (verdict === 'local') {
    console.warn('[Sync] 本地 salt 可解密家庭数据，用本地 salt 修复云端');
    await uploadSalt(localSalt);
    showToast('检测到云端密钥不一致，已用本机密钥修复');
  } else if (verdict === 'cloud') {
    console.warn('[Sync] 云端 salt 可解密家庭数据，采纳云端 salt');
    localStorage.setItem('family_salt', cloudSalt);
    _cryptoKey = null;
    showToast('已同步云端密钥，请重新操作');
  } else {
    console.warn('[Sync] 云端 salt 无法判定（无可用验证数据），保留云端 salt，不覆盖');
    // v3.6.52 无法判定时也给用户可见提示（30 分钟节流）：静默无修复会让用户与排障者都以为已自愈，
    // 实际服务端可能仍在解密失败（本次线上事故中巡检未跑到，无任何提示）
    const warnTs = Number(localStorage.getItem('_saltWarnTs') || 0);
    if (Date.now() - warnTs > 30 * 60000) {
      try { localStorage.setItem('_saltWarnTs', String(Date.now())); } catch (e) {}
      showToast('检测到云端密钥异常且无法自动判定，请保持联网稍候，或用原手机打开 App');
    }
  }
}
async function uploadSalt(saltB64) {
  if (!isSyncReady()) return;
  try { await supabaseUpsert('family_config', { family_id: getFamilyId(), config_key:'_salt', encrypted_data: saltB64, iv:'', last_modified: Date.now() }); } catch {}
}
/* v3.6.52 家庭数据存在性检查（新建盐前的安全闸，修复线上「家庭密钥被打挂」事故）：
 * 本地无 salt 且云端 _salt 查询为空时，必须区分「首次创建家庭」与「云端密钥异常」——
 * 只要家庭已有任何数据行（family_records 或其他 config 键），就绝不允许新建随机盐上传。
 * 事故根因：某设备本地无 salt 时，云端 _salt 查询命中空结果（查询抖动/行被并发覆盖），
 * 老逻辑直接新建随机盐并上传，把家庭真实密钥打挂——服务端随后连续解密失败
 * （今日计划停更、推送全停），且前端巡检因时机问题数小时未自愈。
 * 返回 true=家庭已有数据 / false=确实是空家庭 / null=查询失败无法判定（调用方应重试而非下结论）。 */
async function cloudFamilyHasData(fid) {
  try {
    const recs = await supabaseGet(`family_records?family_id=eq.${fid}&select=record_date&limit=1`);
    if (Array.isArray(recs) && recs.length > 0) return true;
    const cfgs = await supabaseGet(`family_config?family_id=eq.${fid}&config_key=neq._salt&select=config_key&limit=1`);
    if (Array.isArray(cfgs) && cfgs.length > 0) return true;
    return false;
  } catch (e) { return null; }
}
/* v3.6.52 云端盐解析（getCryptoKey / initSync / 同步设置保存 三处共用）：
 * 查云端 _salt——有则采纳（加入已有家庭）；查询为空时，仅当确认家庭无任何数据行才允许新建
 * （首次创建家庭）；为空但家庭已有数据行 = 密钥异常，重试 2 次后明确失败，绝不新建覆盖。
 * 返回 {ok:true, salt:<云端盐>} / {ok:true, salt:null（允许新建）} / {ok:false, reason:'data-but-no-salt'|'network'} */
async function resolveCloudSalt(fid) {
  for (let attempt = 0; attempt < 3; attempt++) {
    let saltRows = null;
    try {
      saltRows = await supabaseGet(`family_config?family_id=eq.${fid}&config_key=eq._salt&select=encrypted_data`);
    } catch (e) { await new Promise(r => setTimeout(r, 600)); continue; }   // 网络失败：重试，绝不新建
    if (saltRows && saltRows.length > 0 && saltRows[0].encrypted_data) return { ok: true, salt: saltRows[0].encrypted_data };
    const hasData = await cloudFamilyHasData(fid);
    if (hasData === null) { await new Promise(r => setTimeout(r, 600)); continue; }   // 查不了就重试，不下结论
    if (hasData) return { ok: false, reason: 'data-but-no-salt' };
    return { ok: true, salt: null };   // 确认空家庭：允许调用方新建
  }
  return { ok: false, reason: 'network' };
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
    // v3.6.17 先做盐一致性巡检/修复（可能改写本地 salt），再派生密钥；
    // 旧逻辑在此处「只验证今天记录、验证不了就上传本地盐覆盖云端」，曾把家庭密钥打挂
    const key = await (async () => { await checkSaltConsistency(); return await getCryptoKey(); })();
    if (!key) return;
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
    // 尝试拉取 salt（加入已有家庭）；拉不到且家庭无数据则新建（创建新家庭）
    // v3.6.52 安全闸（同 getCryptoKey）：家庭已有数据行时，_salt 查询为空也绝不新建随机盐覆盖
    const r = await resolveCloudSalt(fid);
    if (r.ok && r.salt) {
      localStorage.setItem('family_salt', r.salt);
      showToast('已加入家庭，拉取数据中...');
    } else if (r.ok) {
      const newSalt = bufToB64(crypto.getRandomValues(new Uint8Array(16)));
      localStorage.setItem('family_salt', newSalt);
      await uploadSalt(newSalt);
      showToast('已创建新家庭');
    } else {
      showToast('云端密钥记录缺失，请用原手机打开 App 修复后再同步');
      return;
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
        // v3.6.52 安全闸（同 getCryptoKey）：家庭已有数据行时，_salt 查询为空也绝不新建随机盐覆盖
        const r = await resolveCloudSalt(fid);
        if (r.ok && r.salt) {
          localStorage.setItem('family_salt', r.salt);
        } else if (r.ok) {
          const newSalt = bufToB64(crypto.getRandomValues(new Uint8Array(16)));
          localStorage.setItem('family_salt', newSalt);
          await uploadSalt(newSalt);
        } else {
          console.warn('[Sync] 云端盐异常，不新建:', r.reason);
          if (r.reason === 'data-but-no-salt') showToast('云端密钥记录缺失，请用原手机打开 App 修复后再同步');
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
    // v3.6.17 云端密钥巡检：开 App 后 10 秒首次执行，之后每 10 分钟一次（仅前台）
    // 目的：服务端若因盐不一致解密失败，App 打开即可多行试解自动判定并修复，无需等 syncUpload
    try { setTimeout(() => { checkSaltConsistency().catch(() => {}); }, 10000); } catch (e) {}
    try { setInterval(() => { if (!document.hidden) checkSaltConsistency().catch(() => {}); }, 10 * 60000); } catch (e) {}
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
  // v3.6.52 切前台盐巡检节流（页面级）：锁屏/切后台期间 document.hidden，10 分钟间隔巡检会整段跳过；
  // 云端 _salt 一旦被不一致密钥覆盖，只靠定时巡检可能几小时都遇不到一次（线上事故：盐 01:47 被打挂，
  // 手机 01:55 前台使用过但巡检未触发，服务端持续瘫痪）。切前台/联网恢复时补上巡检。
  let _saltVisCheckTs = 0;
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden && isSyncReady() && navigator.onLine) {
      flushSyncQueue(); syncPullAll(quick);
      const nowTs = Date.now();
      if (nowTs - _saltVisCheckTs > 60000) {
        _saltVisCheckTs = nowTs;
        checkSaltConsistency().catch(() => {});
      }
    }
  });
  window.addEventListener('online', () => {
    if (isSyncReady()) { flushSyncQueue(); syncPullAll(quick); checkSaltConsistency().catch(() => {}); }
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
