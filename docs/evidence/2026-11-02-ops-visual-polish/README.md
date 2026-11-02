# 视觉与口径微调 · 证据

- 日期：2026-11-02（Asia/Shanghai）
- 账本：`### 2026-11-02 —— 运营看板202610：视觉与口径微调（现金流柱叠排 / 应收红绿 / 账龄条 / 高度）`（状态仍「实现中」，未改）
- 改动：`public/operations-dashboard-202610/index.html`
- 未 commit / 未改 `/org-chart`、`202602`

## 要点

1. 现金流：`grouping:false`，流出负柱上下叠排；`spacing`/`padding-bottom` 加大下留白
2. 较上期色：应收/WIP/存货 降绿升红；营业收入 升绿降红（demo：应收/存货降、WIP升、营收升）
3. 账龄：水平分布条（同合同额结构占比）+ 图例一行四列
4. 交付保障：layout/列 min-height、loadChart 150、环图区压低；三栏仍 0.25:0.50:0.25
5. 贡献/目标：`pair-row` stretch，高度差 0

## 截图

- `01-cashflow-stack.png`
- `02-risk-aging.png`
- `03-risk-period-colors.png`
- `04-delivery-height.png`
- `05-pair-equal-height.png`
- `probe.json`（pass: true）
