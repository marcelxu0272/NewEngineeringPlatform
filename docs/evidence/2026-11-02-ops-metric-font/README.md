# 其余指标卡主金额字号对齐负荷率 · 证据

- 日期：2026-11-02（Asia/Shanghai）
- 账本：`其余指标卡主金额字号对齐负荷率`（状态仍「实现中」，未改）
- 改动：`public/operations-dashboard-202610/index.html`
- 未 commit

## 字号前后（探针 1440×900）

| 区域 | 改前锚点 | 改后 |
|------|----------|------|
| 顶部 KPI `.kpi-value` ×4 | ~23px（压缩档） | **≈29.95px** |
| 应收四卡 `.risk-metric strong` | ~20px | **≈29.95px** |
| 负荷率主百分比（已关，对照） | ≈29.95px | **≈29.95px（未回退）** |
| KPI 副文案 delta | — | label 11 / num 12 |
| 应收「较上期」 | — | **11px** |

## 截图

- `01-kpi-values.png`
- `02-risk-values.png`
- `probe.json`（pass: true；与负荷率对齐）
