# 现金流与资金安全（去指标卡 / 当年趋势图）+ KPI 配色 · 证据

- 日期：2026-11-02（Asia/Shanghai）
- 账本：`### 2026-11-02 —— 运营看板202610：现金流与资金安全（去指标卡 / 当年趋势图）`（状态仍待落地，未改）
- 改动：`public/operations-dashboard-202610/index.html`
- 未改：`/org-chart`、`public/202602/**`；未 commit

## 现金流验收对照

1. `#cashMetrics` 已移除，三指标卡不可见
2. 子标题「当年现金流趋势」；主标题仍为「现金流与资金安全」
3. 柱：当月流入 / 当月流出；折线：当年累计净现金流
4. 流入/流出柱 = 主题色（primary / accent）；累计净现金流 zones 正绿负红
5–6. 见截图与 probe.json（pass: true）

## 同页 KPI 配色

- 「当月新增/上月新增」与「占目标」标签同色（`--muted`）
- 金额与百分比数字 = 主题色（`--primary`）；主金额 `.kpi-value` 同步主题色

## 截图

- `01-kpi-colors.png` — KPI 配色
- `02-cashflow-module.png` — 现金流模块视口
- `03-cashflow-clip.png` — 模块裁剪
- `probe.json`
