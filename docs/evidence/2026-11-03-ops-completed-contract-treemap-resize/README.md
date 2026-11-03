# 完成合同额看板 · treemap 自适应 + 查看明细 modal + 走势 tooltip

- 日期：2026-11-03（Asia/Shanghai）
- 文件：`public/operations-dashboard-202610/completed-contract.html`
- 勿 commit

## 本回合交付

1. **treemap 自适应**：ResizeObserver + 双 rAF `chart.resize({width,height})` + visualViewport；容器 `min-width:0` 撑满
2. **查看明细 modal**（已恢复）：
   - 「本月完成合同额情况」→ 查看明细
   - 「项目预警一览」→ 查看明细
   - 无 Drawer、无行内「查看」列
3. **月度走势 tooltip**：去掉易坏的 `valueFormatter`，改自定义 formatter（系列名+数值同行）+ `confine:true` + 限宽

## 保留
空白口径 `.empty[hidden]`；KPI「较上期」右侧

## 自检
probe: **PASS**

## 截图
- treemap-base-1280.png / treemap-wide-col.png / treemap-narrow-col.png
- modal-tree-detail.png / modal-alert-detail.png
- trend-tooltip.png
