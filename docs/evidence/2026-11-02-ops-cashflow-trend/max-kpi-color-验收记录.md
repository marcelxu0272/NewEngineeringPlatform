# Max 验收记录 · Board KPI 配色

- 日期：2026-11-02（Asia/Shanghai）
- 验收人：Max（独立计算色/DOM；不采信 Leo 自报）
- 账本：`### 2026-11-02 —— 运营看板202610：Board KPI 配色（占目标文案色 / 数字主题色）`（验收时状态仍「待落地」）
- 页面：`/operations-dashboard-202610/board` → iframe KPI 四卡
- 结论：**通过**

## 对照表

| AC | 口径 | 实测 | 结果 |
|----|------|------|------|
| 1 | 「占目标」与「当月新增」（完成合同额为「上月新增」）文案色一致 | 四卡 `.kpi-delta-label` 计算色均为 `rgb(110,131,156)`（muted）；完成合同额为上月新增 | 通过 |
| 2 | 金额与百分比数字用默认主题色 | `.kpi-value` / `.kpi-delta-num` = `--primary`；teal/wood/blue 切换后数字随主题变 | 通过 |
| 3 | 不回退 KPI 口径（无同比；当月/上月新增+占目标仍在） | 四卡无「同比」、`.kpi-yoy` 不可见；结构完整 | 通过 |
| 4 | 证据 | `max-kpi-color-*` / `max-cash-kpi-probe.json` / `max-theme-follow.json` | 通过 |

## 阻断

无。

## 量测摘要（默认主机主题 blue 时）

- 标签色：`rgb(110, 131, 156)`
- 数字/主金额：`rgb(48, 109, 169)` = `#306da9`（blue.primary）

## 备注

- 探针时刻（Asia/Shanghai）：2026-11-02 15:58:12
