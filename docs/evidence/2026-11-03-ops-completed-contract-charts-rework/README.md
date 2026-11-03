# 完成合同额看板 · 图表完整迁移返工证据

- 日期：2026-11-03（Asia/Shanghai）
- 实现：Leo（本回合）；对照源报告线概览 ECharts 三图 + KPI/钻取/PM
- 范围文件：
  - `public/operations-dashboard-202610/completed-contract.html`（重写）
  - `public/operations-dashboard-202610/vendor/echarts.min.js`（从仓内 `node_modules/echarts@5.6.0` 拷贝，**无 CDN**）
- 未改：源仓；账本状态；`index.html` 运营看板 KPI 模块；壳筛选已关逻辑；org-chart / 银川 / catalog
- 入库：暂缓（勿 commit）

## AC / 清单对照自检

| # | 项 | 结果 | 证据 |
|---|----|------|------|
| P0-1 | 月度走势 6 系列 + 双轴 + legend + 预测 markArea + tooltip；累计=前缀和；note | PASS | `probe.json` seriesTrend=6；`trendNote`；default 截图 |
| P0-2 | treemap 面积∝\|额\|；负值；「其他项目」；近零/cap 规则；tooltip；项目/其他 click | PASS | `treemapTiles` 含负值与 other；canvas |
| P0-3 | 预警横向 bar；源六类；click 筛选；有 count 才出 | PASS | `alertTypes` 六类；alert canvas；alert-modal 截图 |
| P1-4 | 「更多」/其他 → 壳 modal 表 + 分页；查看 drawer | PASS | `modalOpen`；diff/alert modal 截图；`hasModal` |
| P1-5 | KPI 完成额 delta ±万；存量减号正常；tag/同步说明 | PASS | `kpiDelta`=`较上一期 +102.50 万`；`stockDelta` 含 − |
| P2-6 | 树图空态 none / all-zero | PASS | `?emptyTree=none|all-zero` 文案 + 截图 |
| P2-7 | 走势 note | PASS | note 文案 |
| P2-8 | PM 占比分列 当月｜本年累计 | PASS | `pmHeads` 含当月/本年累计 |

## 探针

见同目录 `probe.json`（Playwright @ 3001）。

## 截图

- `completed-contract-default.png`
- `completed-contract-diff-modal.png`
- `completed-contract-alert-modal.png`
- `completed-contract-emptyTree-none.png`
- `completed-contract-emptyTree-all-zero.png`
- `completed-contract-emptyAlerts.png`

## demo 开关

- `?emptyTree=none` / `?emptyTree=all-zero`
- `?emptyAlerts=1`
