# Max 验收记录 · 恢复现金流顶部三指标卡（保留当年趋势图，含配色 AC5）

- 日期：2026-11-02（Asia/Shanghai）
- 验收人：Max（独立 Playwright + DOM getComputedStyle + Highcharts；**不采信** Leo 自报）
- 账本：`### 2026-11-02 —— 运营看板202610：恢复现金流顶部三指标卡（保留当年趋势图）`（验收时状态仍「实现中」，含 AC5 配色）
- 页面：`/operations-dashboard-202610/board` → iframe `index.html`
- 结论：**通过**（无阻断）

## 账本验收对照（按账本编号）

| 账本 AC | 口径 | 实测 | 结果 |
|---------|------|------|------|
| 1 | 「现金流与资金安全」内三卡可见：现金流入/流出/净现金流，主金额可读 | 三卡 label 正确；值 201,508.59 / 185,425.82 / 16,082.77；`#cashMetrics` display=grid | 通过 |
| 2 | 三卡在当年趋势图上方；不得只恢复卡丢趋势图 | cardsAboveChart=true；metrics.bottom=472.59 ≤ chart.top=504.59；`#cashChart` 可见 | 通过 |
| 3 | 趋势图不回退：子标题「当年现金流趋势」；流入/流出柱上下排；累计净折线正绿负红；主题色柱；图下留白 | sub=`当年现金流趋势（万元）`；series=当月流入/当月流出/当年累计净现金流；grouping=false；outflow y=-17700；sameX=true；zones value:0 danger + success；spacingBottom=18 | 通过 |
| 4 | 三卡主金额 ≈30px 级（对齐负荷率/KPI/应收）；副文案可略放大 | valuePx=34.112×3；peers kpi/load/risk=34.112；deltaPx=11；常见桌面宽未停在约20px | 通过 |
| 5 | **配色**：流入/流出主金额=当前主题色（随主题）；净现金流正绿负红；零可用主题色/中性 | 见下 AC5 明细 | 通过 |
| 6 | 不挤破布局、主数字不截断；不改 org-chart；「较上期」等不回退 | overlap=false；truncated/broken=false；orgInCash=false；三卡副文案均为「较上期」；无残留同比/环比对比标签 | 通过 |
| 7 | 证据 max-* | max-01…07 png + max-probe.json + 本记录 + probe 脚本 | 通过 |

## Claire 派活 AC1–5 对照

| Claire | 对应账本 | 结论 |
|--------|----------|------|
| AC1 | 账本 1 + 2 | 通过 |
| AC2 | 账本 3 | 通过 |
| AC3 | 账本 4 | 通过 |
| AC4 | 账本 6 +「较上期」 | 通过 |
| AC5 | 账本 5（配色） | 通过 |

## AC5 配色明细（独立主题切换 ≥2）

| 主题 | --primary | 流入色 | 流出色 | 净现金流色（demo 正） | match |
|------|-----------|--------|--------|----------------------|-------|
| teal | #008b8b | rgb(0,139,139) | 同左 | rgb(6,153,125)=--success | 通过 |
| blue | #306da9 | rgb(48,109,169) | 同左 | rgb(35,139,119)=--success | 通过 |
| wood（加验） | #897044 | rgb(137,112,68) | 同左 | success 绿 | 通过 |

- 主题间 primary 互异：true（流入/流出色随主题变，非固定灰黑）
- **负值路径**：demo 净现金流为正（16,082.77→绿）。探针强制 DOM 样例 `-1,234.00` → rgb 对齐 `--danger`（blue 下 #df5c70）；并核对实现 `renderCash`：`vals[2]>0 → colors.success`；`<0 → colors.danger`；`==0 → colors.primary`。截图：`max-07-net-negative-forced.png`
- 零值约定：实现用主题色（primary），与账本「零可用主题色或中性」一致

## 阻断

无。

## 证据路径

`docs/evidence/2026-11-02-ops-cashflow-cards-restore/`

- `max-01-cash-module.png` — 整模块三卡+趋势同框
- `max-02-cash-cards.png` — 三卡近景
- `max-03-cash-viewport.png` — 视口
- `max-04-ac5-colors-teal.png` / `max-05-ac5-colors-blue.png` / `max-06-ac5-colors-wood.png` — 主题切换配色
- `max-07-net-negative-forced.png` — 净负红强制样例
- `max-probe.json` — 完整探针（含 AC5 色值）
- `max-cashflow-cards-probe.cjs` — 复跑脚本
- 本记录

## 备注

- 与旧「去指标卡」关系：本条展示口径覆盖旧 AC1（现须展示三卡）；旧趋势图相关已关项实测未回退。
- 未改实现、未 commit/push、未改账本状态。
- 探针时刻（Asia/Shanghai）：约 2026-11-02 17:01；`max-probe.json` ts=UTC 对应。
