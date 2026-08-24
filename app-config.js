/* ============================================================
 * 小咕噜的日常 —— 应用默认配置（默认值统一在此维护，不在代码里写死）
 * ------------------------------------------------------------
 * 本文件集中存放管理弹窗中的"默认配置"：
 *   - 讯飞语音听写（APPID / APIKey / APISecret）
 *   - PushPlus 群组编码（群名/一对多 topic）
 *   - 云端同步（Supabase 项目 URL / anon key）
 *   - 默认家庭码
 * 修改默认值只需改这个文件，部署后立即生效，无需改动 index.html。
 * 注意：localStorage 中用户保存的自定义值优先级更高，会覆盖这里。
 * ============================================================ */
window.APP_CONFIG = {

  // 讯飞语音听写（流式版 WebAPI）默认凭据
  // 提示：这里存放的 secret 为应用默认值；管理弹窗 UI 会以掩码展示、不会明文显示。
  xfyun: {
    appid: '7c530973',
    apiKey: '4251d995b39fee0f288076247a235b0a',
    apiSecret: 'ODFkMmNjMTM0YWE2ZmZkMjUyNzg1YWI3'
  },

  // PushPlus 群组编码（一对多消息 topic，家人扫码入群同步接收）
  pushplusTopic: 'xiaogulu_daily',

  // 云端同步默认配置（Supabase REST 端点）
  supabase: {
    url: 'https://ectqfthdbqceifuprdjf.supabase.co',
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVjdHFmdGhkYnFjZWlmdXByZGpmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU1MTMxODgsImV4cCI6MjEwMTA4OTE4OH0.-BMsuLZg2vXeNn9ml7sFQZEICGij0o8DBNPNt9Vau7s'
  },

  // 默认家庭码（家人共享用）
  familyCode: 'maowo3545'
};
