# Max 验收记录 · 运营看板202610：其余指标卡主金额字号对齐负荷率

- 日期：2026-11-02（Asia/Shanghai）
- 验收人：Max（独立 Playwright/DOM `getComputedStyle.fontSize`；不采信 Leo 自报 `probe.json` / ≈29.95px）
- 账本：`### 2026-11-02 —— 运营看板202610：其余指标卡主金额字号对齐负荷率`（验收时状态仍「实现中」；本验未改账本）
- 页面：`/operations-dashboard-202610/board` → iframe `index.html`
- 探针：`docs/evidence/2026-11-02-ops-metric-font/max-metric-font-probe.cjs` → `max-probe.json`
- 视口：Playwright outer **1600×1000**；iframe `innerWidth`≈**1312**
- 结论：**通过**

## 对照表

| AC | 口径原文要点 | 实测方法 | 结果 | 证据 |
|----|--------------|----------|------|------|
| 1 | 顶部 KPI 四卡 `.kpi-value`（新签/完成合同/开票/回款）主金额与负荷率主百分比**同量级**（约 **30px 级**；常见桌面宽不得仍停在约 20–24px） | 四卡 computed **34.112px**；对照 `#monthlyLoadVal`/`#annualLoadVal` 同为 **34.112px**；文案 `9,234.31` / `12,331.02` / `9,172.22` / `13,459.19` | **通过** | `max-01-kpi-values.png` / `max-probe.json` |
| 2 | 应收与资金风险四卡主金额（`.risk-metric strong`：应收/WIP/存货/营业收入）同上约 30px 级 | 四卡 strong 均为 **34.112px**；与负荷率同值对齐 | **通过** | `max-02-risk-values.png` |
| 3 | 各卡副文案可略放大（非必与主值同级） | KPI `.kpi-delta-label`/`.kpi-meta` **11px**，`.kpi-delta-num` **12px**；应收 `small`/`较上期` **11px** | **通过**（已略放大） | `max-probe.json` |
| 4 | 不挤破顶栏四卡网格与应收 2×2；主数字不截断/不换行破碎；不显著撑高已压低的交付保障高度 | KPI/应收卡片无重叠；`white-space:nowrap`、无截断/换行破碎；三栏比 **0.25:0.50:0.25**；`#deliveryPanel` h≈**268.30**、`#loadChart` h=**150**（对照视觉微调基线，未回撑） | **通过** | `max-04-delivery-panel.png` |
| 5 | 不回退：负荷率字号、较上期、KPI 口径/配色、应收红绿、现金流柱叠排等 | 负荷率主值仍 **34.112px**（远高于 ~17px 锚点）；负荷副文案与应收四卡均为「较上期 …」；可见文案无「同比」「环比」对比口径 | **通过** | `max-03-load-compare.png` / period 抽查 |
| 6 | 证据落本目录 max-* | 本目录 `max-*` png/json/cjs/md 已落 | **通过** | 见下「证据路径」 |

## 阻断

无。

## 关键实测数字（摘要）

| 区域 | 改前账本锚点（非口径） | Max 独立实测 @1600 |
|------|------------------------|---------------------|
| 负荷率 `#monthlyLoadVal` / `#annualLoadVal` | 近期验 ~34px 级（勿回退） | **34.112px**（未回退） |
| 顶部 KPI `.kpi-value` ×4 | ~23–32px（压缩档） | **34.112px** ×4 |
| 应收 `.risk-metric strong` ×4 | ~18–26px / 常见 ~20px | **34.112px** ×4 |
| KPI 副文案 | — | label **11px** / num **12px** |
| 应收「较上期」 | — | **11px**；文案含「较上期」 |

- 说明：Leo 自报 ≈29.95px（README 称 1440×900）不采信、不作为本记录数字。本验与先前负荷率终验同一 1600 视口口径，iframe 内容宽 ≈1312 → `clamp(28px,2.6vw,36px)` 计算为 **34.112px**，KPI/应收/负荷三者一致。
- 本条明确不在范围（未当阻断）：图表中心/图例/贡献表/告警标题/板块目标轴签；已去掉的现金流顶部三指标卡。

## 证据路径

- `docs/evidence/2026-11-02-ops-metric-font/max-metric-font-验收记录.md`（本文件）
- `docs/evidence/2026-11-02-ops-metric-font/max-probe.json`
- `docs/evidence/2026-11-02-ops-metric-font/max-metric-font-probe.cjs`
- `docs/evidence/2026-11-02-ops-metric-font/max-01-kpi-values.png`
- `docs/evidence/2026-11-02-ops-metric-font/max-02-risk-values.png`
- `docs/evidence/2026-11-02-ops-metric-font/max-03-load-compare.png`
- `docs/evidence/2026-11-02-ops-metric-font/max-04-delivery-panel.png`

## 账本未结

- 状态仍为「实现中」（本验未改账本、未改实现、未 commit/push）
- 建议：无阻断，可由 Alex 关「已落地」

- 探针时刻（Asia/Shanghai）：2026-11-02 16:49:49
