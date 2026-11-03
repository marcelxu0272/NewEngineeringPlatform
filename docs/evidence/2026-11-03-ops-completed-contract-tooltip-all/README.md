# 完成合同额看板 · 全页 ECharts tooltip 统一

- 日期：2026-11-03（Asia/Shanghai）
- 文件：`public/operations-dashboard-202610/completed-contract.html`
- 勿 commit

## 改了哪些 tooltip

| Chart | 改动 |
|-------|------|
| treemap | `tooltipBase` confine/限宽 + 标签/值 flex 行 |
| 预警 bar | 同上 + 类型标题/数量 |
| 月度走势 | `tooltipAxisFormatter` 六系列名+万元 |

公共：`tooltipBase` / `tooltipRow` / `tooltipAxisFormatter` / `tooltipFmtNum`

保留：空白口径、KPI 较上期、两处查看明细 modal、treemap ResizeObserver

## 自检
probe: **PASS**（tree/alert/trend formatter + confine）
