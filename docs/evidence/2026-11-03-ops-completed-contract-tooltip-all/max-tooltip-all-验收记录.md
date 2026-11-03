# Max 验收记录 · treemap 自适应 + 全页图表 tooltip

- 日期：2026-11-03（Asia/Shanghai）
- 目标：`public/operations-dashboard-202610/completed-contract.html`
- 账本：完成合同额看板 treemap 自适应 + 全页图表 tooltip（状态仍待落地，本记录不改账本）
- 结论：**PASS**
- 阻断：无
- 入库：仍缓；未改实现 / 未 commit / 未 push / 未改账本

## 逐 AC

| AC | 检查 | 结果 |
|----|------|------|
| B1 | base.fill | PASS |
| B2 | wide.resizeFill | PASS |
| B2 | narrow.resizeFill | PASS |
| B3 | vp.wide.fill | PASS |
| B3 | vp.narrow.fill | PASS |
| B3 | resize.hook | PASS |
| B4 | emptyTree.vacuumShows | PASS |
| B4 | emptyAlerts.vacuumShows | PASS |
| B5 | treeChart.tooltip.meta | PASS |
| B5 | alertChart.tooltip.meta | PASS |
| B5 | trendChart.tooltip.meta | PASS |
| B5 | tree.fmt.names | PASS |
| B5 | alert.fmt.names | PASS |
| B5 | trend.fmt.names | PASS |
| B5 | tree.tip.dom | PASS |
| B5 | alert.tip.dom | PASS |
| B5 | trend.tip.dom | PASS |

## 证据

- treemap-resize/：max-treemap-*.png、max-emptyTree-none.png、max-probe.json
- tooltip-all/：max-tooltip-treemap.png、max-tooltip-alert.png、max-tooltip-trend.png、max-emptyAlerts.png、max-probe.json
