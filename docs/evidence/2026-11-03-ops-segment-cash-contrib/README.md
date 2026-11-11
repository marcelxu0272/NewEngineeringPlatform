# 运营看板 · 板块现金流贡献 + 板块目标达成 tab

- 日期：2026-11-03（Asia/Shanghai）
- 文件：`public/operations-dashboard-202610/index.html`
- 入库：暂缓（勿 commit）

## AC

1. 「经营贡献分析」→「板块现金流贡献」横向柱：只现金流一指标；正绿负红；按值排序；标题旁 `?` 角标保留；去掉原表格/结构占比/维度页签
2. 「板块目标达成」四 tab 对齐顶部 KPI（新签合同额 / 完成合同额 / 完成开票额 / 完成回款额）；点击只刷新本区

## 自检

Playwright `probe.cjs` → `probe.json`：`pass: true`
- 贡献图有正负色、降序
- 切「完成合同额」tab 后贡献图数据不变、目标区 note 切到完成合同额

## 截图

- 01-segment-cash-contrib.png
- 02-target-tabs.png
- 03-full-board.png

## 追加 · 目标达成去前5截断

- 四 tab 均展示当前筛选下全部 depRows（不再 slice(0,5)）
- 自检：probe-targets-all.json pass true（10/10）
- 截图：04-target-all-segments.png

## 追加 · 两卡等宽 + tab 各自降序

- pair-row：repeat(2,minmax(0,1fr))；两卡图区同宽同高 320px
- 目标达成：每 tab 按当前指标值降序（互不影响）
- 自检：probe-pair-align-sort.json pass（1280/1360/1600 等宽；四 tab 各自排序）
- 截图：05-pair-width-align.png

## 追加 · 完成率排序 + 删除账龄结构

- 目标达成四 tab：按各自完成率降序（非金额）
- 删除「应收账款账龄结构」整块（HTML/渲染/openAging/账龄预警与入口）；保留风险四指标卡
- 宽度等分保持
- 自检：probe-no-aging-rate-sort.json pass
- 截图：07-risk-no-aging.png、08-pair-after-aging-removal.png

## 追加 · pair 图区高度锁死

- 根因：.contribution-chart{flex:1} 在等高 panel 内把贡献图撑高（目标侧有 tab+note）
- 修复：base 改为 flex:0 0 auto；pair-row 两端 chart lex:0 0 320px + height/min/max 全锁 320
- 自检：probe-chart-height-lock.json — clientHeight 320/320 diff 0
- 截图：09-pair-chart-height-lock.png
