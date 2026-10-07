# 测试硬隔离守则（v3.5.110 起强制执行）

事故记录：v3.5.110 开发期间，本地 Playwright 实测因 `app.js` 第 5245 行
自动写入预设家庭码 `maowo3545`，导致测试环境 `isSyncReady()` 恒为 true，
**真实读写家庭云**，覆盖了云端加密盐 `_salt`，使 29 天记录密文被改写为不可解。

## 铁律（任何本地测试都必须遵守）

1. **禁止**用真实家庭码 `maowo3545` 跑任何本地测试。
2. 测试前必须 `localStorage.setItem('family_code','')`，让 `isSyncReady()` 返回 false。
3. 测试脚本必须用 `page.route('**/*.supabase.co/**', route => route.abort())` 拦截所有云端请求。
4. 测试后必须核对云端 `family_config` / `family_records` 的 `last_modified` 未变化。
5. 测试产生的 localStorage 数据（ai_chat / ai_kb / memo 等）不得提交进仓库。

## 标准测试模板（务必照抄）

```python
ISOLATE = """
localStorage.setItem('family_code','');
localStorage.setItem('family_salt','');
localStorage.setItem('family_id','');
"""
pg.route('**/*.supabase.co/**', lambda r: r.abort())
pg.goto(URL); pg.wait_for_timeout(800)
pg.evaluate(ISOLATE); pg.reload(); pg.wait_for_timeout(800)
```

## 部署前检查清单

- [ ] `git status` 无意外文件
- [ ] 仓库内无测试数据文件
- [ ] 云端 `last_modified` 未被测试改动
