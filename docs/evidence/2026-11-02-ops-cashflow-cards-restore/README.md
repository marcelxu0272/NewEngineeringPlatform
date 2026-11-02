# 恢复现金流顶部三指标卡 · 证据

- 日期：2026-11-02（Asia/Shanghai）
- 账本：`恢复现金流顶部三指标卡（保留当年趋势图）`（状态仍「实现中」，未改）
- 改动：`public/operations-dashboard-202610/index.html`（`renderCash` 主金额色）
- 未 commit

## 布局（AC1–4）

1. `#cashMetrics` 三卡在模块标题下、**当年现金流趋势**图上方
2. 趋势保留：叠柱 `grouping:false`、流出负柱、累计折线正绿负红、下留白
3. 主金额 ≈29.95px；副文案「较上期」红绿语义保留

## AC5 配色

实现（`renderCash`）：
- 流入 / 流出：`amountColor = colors.primary`（`<strong style="color:…">`）
- 净现金流：`>0` → `colors.success`；`<0` → `colors.danger`；`==0` → `colors.primary`
- 流出卡 tone 改为 `primary`（不再 warning），避免继承非主题色
- 主题经 Next header `postMessage` → `applyHostTheme` → `setTheme` → `render()` 重算色

探针 `ac5-color-probe.cjs` → `probe-ac5.json`（pass: true）：
| 主题 | --primary | 流入/流出 strong | 净额（正） |
|------|-----------|------------------|------------|
| teal | #008b8b | rgb(0,139,139) | success |
| blue | #306da9 | rgb(48,109,169) | rgb(35,139,119)=#238b77 |

负净额：demo 无负值；`06-ac5-net-negative-forced.png` 为 DOM 强制 `--danger` 样例；代码分支 `vals[2]<0` 已落地。

## 截图

- `01`/`02` 恢复卡布局；`max-*` Max 既有
- `03-ac5-cash-colors-blue.png` / `04-ac5-cash-colors-teal.png`
- `05-ac5-cash-cards-closeup.png` / `06-ac5-net-negative-forced.png`

## Claire → Max

一次终验 AC1–5。通过后请 Alex 关「已落地」。
