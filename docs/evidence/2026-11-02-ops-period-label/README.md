# 同比/环比 → 较上期 · 证据

- 日期：2026-11-02（Asia/Shanghai）
- 账本：`同比/环比副文案统一为「较上期」`（状态仍「实现中」，未改）
- 改动：`public/operations-dashboard-202610/index.html`
- 未 commit；字号放大未回退（主≈29.95px，副 11px）

## 文案替换点

1. 年度负荷率 `#annualLoadSub`：`同比…` → `较上期…`
2. 当月负荷率 `#monthlyLoadSub`：`环比…` → `较上期…`
3. 告警摘要：`现金流出环比…` → `现金流出较上期…`
4. 应收四卡等已是「较上期」：未改

## 探针

- 可见 main 文案无「同比」「环比」
- `probe.json` pass: true

## 截图

- `01-load-period-labels.png`
- `02-alerts-period.png`
