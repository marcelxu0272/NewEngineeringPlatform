# 验收记录 · 条B：壳级 UNIT_OPTIONS = 全部板块 + 12 SAS 叶子

- 验收人：验收工程师 Max（独立 Playwright 实机；**不采信 Leo 静态 probe**）
- 结论：**PASS**
- URL：`http://localhost:3001/operations-dashboard-202610/board`
- 对照账本：`### 2026-11-03 —— 运营看板202610：壳级组织板块换成真实叶子板块/中心`（实现中；本任务未改账本）
- 证据目录：`docs/evidence/2026-11-03-ops-board-unit-leaf-options/`（前缀 `max-unit-leaf-*`）
- **未混验** sidebar / pair 仅全部 / 组织图跳转 Board；本记录只写本条结论

## 逐 AC
- AC1 PASS — 壳级下拉选项恰好按序：全部板块 + 12 SAS 叶子
- AC2 PASS — 不含公司级 EPC；不再出现设计院 / 数字化业务单元 / 专业室
- AC3 PASS — 选中项经壳 postMessage 把 unit 传给可见 iframe；运营看板接收不报错
- AC4 PASS — iframe demo 映射对齐叶子（静态核对 DEMO_DATA / unitFactor；假数不要求真实金额）
- AC5 PASS — 「全部板块」仍驱动条A逻辑（本条不替代条A关账；交叉引用）
- AC6 PASS — 不与 sidebar/pair 混关（本记录只写本条）
- AC7 PASS — 证据落盘

## 选项实读（顺序，含虚拟列表滚动）
1. 全部板块
2. SAS170 PMC板块
3. SAS610 咨询板块
4. SAS680 数字技术板块
5. SAS650 新材料板块
6. SAS710 生命科学板块
7. SAS690 COII板块
8. SAS720 模块化板块
9. SAS670 供应链板块
10. SAS520 金山中心
11. SAS560 沈阳中心
12. SAS550 惠湛中心
13. SAS530 银川中心

## pageerror
- （无）

## 关键证据
- `max-unit-leaf.json`
- `max-unit-leaf.cjs`
- `max-unit-leaf-01-dropdown.png`
- `max-unit-leaf-02-leaf-selected.png`

## 备注
- DEMO_DATA 假数未验真实金额；仅核对 12 叶子名出现在 departments/projects。
- 条A「全部板块驱动 pair 显隐」仅交叉观察，关账以条A证据为准。
- **未改业务代码、未 commit/push、未改账本状态、未关账。**
