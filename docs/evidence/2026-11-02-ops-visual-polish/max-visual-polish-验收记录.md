# Max 验收记录 · 运营看板202610：视觉与口径微调

- 日期：2026-11-02（Asia/Shanghai）
- 验收人：Max（独立 Playwright/DOM/Highcharts；不采信 Leo 自报 probe.json）
- 账本：`### 2026-11-02 —— 运营看板202610：视觉与口径微调（现金流柱叠排 / 应收红绿 / 账龄条 / 高度）`（验收时状态仍「实现中」；本验未改账本）
- 页面：`/operations-dashboard-202610/board` → iframe `index.html`
- 探针：`docs/evidence/2026-11-02-ops-visual-polish/max-visual-polish-probe.cjs` → `max-probe.json`
- 结论：**通过**

## 对照表

| AC | 口径原文要点 | 实测方法 | 结果 | 证据 |
|----|--------------|----------|------|------|
| 1 | 当年现金流趋势：同月流入/流出柱**上下排**（非左右分组）；图下留白加大、勿贴底 | Highcharts `plotOptions.column.grouping===false`；流入 `y≥0`、流出 `y≤0`；首柱图形 `sameXish` 且 `inAboveOut`；`spacing[2]=18`、`.cash-chart-wrap padding-bottom=28px` | **通过** | `max-01-cashflow-stack.png` / `max-01b-cash-wrap.png` / `max-probe.json` |
| 2 | 应收/WIP/存货：降绿升红；营业收入：升绿降红（较上期金额与趋势） | 读取四卡 `.risk-period` computed `color` 与解析 `delta`；对照 success `rgb(35,139,119)` / danger `rgb(223,92,112)`。实测：应收 -2.1% 绿；WIP +6.3% 红；存货 -1.8% 绿；营收 +4.5% 绿 | **通过** | `max-02-risk-period-colors.png` |
| 3 | 账龄改水平分布条（同合同额结构占比）；图例一行四列；非环图主展示 | agingChart `type=bar` + `stacking=normal`、4 段；`mixChart` 同为 bar；`#agingLegend` `grid-template-columns` 四列、4 items；无可见 donut/pie | **通过** | `max-03-aging-bar.png` |
| 4 | 工作负荷与交付保障整块再压低；三栏比例保持 | 对照既有 Max 三栏基线：loadChart `180→150`、layout `260→210`；比率仍 `0.25:0.50:0.25` | **通过** | `max-04-delivery-height.png` |
| 5 | 板块目标达成 ↔ 经营贡献分析同排高度一致 | `#contributionPanel` / `#targetPanel` `getBoundingClientRect`：高度差 `0`、top 差 `0`；`.pair-row align-items:stretch` | **通过** | `max-05-pair-equal-height.png` |
| 6 | 证据齐全 | 本目录 `max-*` png/json/md 已落 | **通过** | 见下「证据路径」 |

## 阻断

无。

## 不回归抽检（本条不重开旧口径）

- KPI `.kpi-delta` 仍见「当月新增 / 上月新增」结构样本；未把本条做成「同比」主口径回退。
- 未要求改 org-chart；未改实现文件、未 commit/push、未改账本状态。

## 关键实测数字（摘要）

- 现金流：grouping=false；点几何 inY=67/outY=102、同 X；spacingBottom=18；pad-bottom=28px
- 交付：panelH≈268.3；layoutH=210；loadH=150；比率 0.25/0.50/0.25
- 成对：contribH=targetH≈375.84；diff=0
- 账龄：系列「1年以内 / 1–2年 / 2–3年 / 3年以上」；legend 四列；chartH=24

## 证据路径

- `docs/evidence/2026-11-02-ops-visual-polish/max-visual-polish-验收记录.md`（本文件）
- `docs/evidence/2026-11-02-ops-visual-polish/max-probe.json`
- `docs/evidence/2026-11-02-ops-visual-polish/max-visual-polish-probe.cjs`
- `docs/evidence/2026-11-02-ops-visual-polish/max-01-cashflow-stack.png`
- `docs/evidence/2026-11-02-ops-visual-polish/max-01b-cash-wrap.png`
- `docs/evidence/2026-11-02-ops-visual-polish/max-02-risk-period-colors.png`
- `docs/evidence/2026-11-02-ops-visual-polish/max-03-aging-bar.png`
- `docs/evidence/2026-11-02-ops-visual-polish/max-04-delivery-height.png`
- `docs/evidence/2026-11-02-ops-visual-polish/max-05-pair-equal-height.png`

## 账本未结

- 状态仍为「实现中」（本验未改账本）
- 建议：无阻断，可由 Alex 关「已落地」；入库仍等用户定；未 commit/push

- 探针时刻（Asia/Shanghai）：2026-11-02 16:33:08
