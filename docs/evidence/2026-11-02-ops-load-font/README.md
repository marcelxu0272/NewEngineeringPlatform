# 工作负荷左右卡主百分比字号放大 · 证据

- 日期：2026-11-02（Asia/Shanghai）
- 账本：`工作负荷左右卡主百分比字号放大`（状态仍「实现中」，未改）
- 改动：`public/operations-dashboard-202610/index.html`（`.delivery-kpi-card strong/small` + `#monthlyLoadVal`/`#annualLoadVal` 覆盖）
- 未 commit

## 字号前后

| 项 | 改前（账本锚点） | 改后（探针） |
|----|------------------|--------------|
| 主百分比 `#monthlyLoadVal` / `#annualLoadVal` | ~17px | **≈29.95px**（+≈13px） |
| 副文案 `small` | ~7–8px | **11px** |

规则：`clamp(28px, 2.6vw, 36px)!important`；压缩媒体查询内原 17px 已抬至 28px 基线并由晚层覆盖。

## 约束自检

- 三栏比例仍 0.25:0.50:0.25
- loadChart 高 150（压低未回退）；panelH≈268
- 主数字 nowrap，未截断

## 截图

- `01-load-kpi-fonts.png`
- `02-delivery-panel.png`
- `probe.json`（pass: true）
