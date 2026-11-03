# 验收记录 · ep79：组织图板块/中心 → Board + unit 筛选 + header

- 验收人：验收工程师 Max（独立 Playwright 实机；**不采信 Leo probe**）
- 总结论：**PASS**
- 专属 AC（1–6/8）：**PASS**
- 回归 AC7：**PASS**（本轮深链 + 下拉叶子态均为 `display:none` / height=0；**不替代条①关账**）
- 组织图：`http://localhost:3001/operations-dashboard-202610`
- Board：`http://localhost:3001/operations-dashboard-202610/board`
- 正式需求：`docs/需求文档/202611_组织图板块跳转Board筛选.md`
- 账本：`### 2026-11-03 —— 运营看板202610：组织图板块/中心点击跳转 Board 并带组织筛选`（待落地；本任务未改账本）
- 证据目录：`docs/evidence/2026-11-03-ops-org-entry-unit-nav/`（前缀 `max-org-entry-unit-nav-*`）
- **未混验** sidebar / pairRow 仅全部板块（条①）/ UNIT_OPTIONS（条②）；本记录只写本条

## 逐 AC

- AC1 PASS — 12 叶子 href=`/board?unit=` 正确编码 + `target=_top` + 负责人 wood-groupname
- AC1 PASS — 实机点击「惠湛中心」跳转 Board 并带 unit
- AC2 PASS — 12 叶子深链进入后壳「组织板块」选中 = 该叶子
- AC3 PASS — iframe `dashboard.state.unit` 与壳选中一致（深链；12/12）
- AC3 PASS — 下拉手选 ≡ 深链（抽样 SAS680 数字技术板块）
- AC4 PASS — 12 叶子深链 header 末段 = `SASxxx 标准名`
- AC4 PASS — Board 内改下拉 header 同步；全部板块 header=`Board`
- AC5 PASS — 公司级 EPC 不跳 / 不带 unit
- AC5 PASS — 项目群等非叶子不误带 `board?unit`
- AC6 PASS — 董事会进 Board 默认（header=`Board`，无叶子 unit）
- AC7 回归 PASS — 叶子态 `#pairRow` 本轮视觉隐藏（深链+下拉）；依赖条①历史未结，**不替代①关账**
- AC8 PASS — 无「惠滋」错写；pageerror 无；证据落盘

## 回归 AC7 详情

- 主探针（深链 SAS170）：`display=none`, `hidden=true`, `h=0`, `w=0`
- 补检 `max-org-entry-unit-nav-pair-recheck.cjs`：下拉选 SAS170 / SAS520 同为 `display=none` / h=0；全部板块仍 `display=grid` h≈401
- 对照：条①此前 FAIL（叶子态 `display:grid!important` 仍占位）。本轮观察已隐藏，**仍由条①单独关账**，本条不混关。

## 阻断项

- 本条专属 AC **无阻断**。
- 回归 AC7 本轮过，仍注明依赖条①、不替代①关账。

## pageerror

- （无）

## 关键证据

- `max-org-entry-unit-nav.cjs`
- `max-org-entry-unit-nav.json`
- `max-org-entry-unit-nav-验收记录.md`
- `max-org-entry-unit-nav-pair-recheck.cjs`
- `max-org-entry-unit-nav-01-org.png` … `08-pairRow-leaf-regression.png`

## 备注

- **未改业务代码、未 commit/push、未改账本状态、未关账。**
- Leo `probe-result.txt` 自称 fail=0；本终验以独立实机为准（真实点击、12 深链、下拉对照、董事会默认）。
- **未混验声明**：未把 sidebar / pairRow条① / UNIT_OPTIONS 结论写入本条关账建议。
