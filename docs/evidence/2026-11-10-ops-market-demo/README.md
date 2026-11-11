# 三个市场看板 · 前端演示实现自验

日期：2026-11-10。依据：用户本会话批准的“三个市场看板前端演示页”方案、三张原平台参考图、变更账本同日条目。

## 实现结果

- 机会清单、市场数据、合同看板三个原占位入口接入完整React前端页面；其他通用占位页保持原样。
- 最多两列：内容区800px起双列，否则单列。四张合同指标卡和四档金额区均为2×2；GoGet与客户排行跨整行；同排卡片等高，宽表在模块内部滚动。
- 包含完整筛选、查询/重置、阶段选择、三个日期范围、合同区间、刷新、数据概况、详情抽屉及搜索、框架存量入口、客户1—5/6—10切换、本地CSV导出。
- 环图、双层环图、业务线进度、三级分段GoGet、板块柱线图、实际/预测月度图、三条年度趋势均可展示。图表含悬浮提示、图例；金额/标榜切换分别按金额/完成率排序。
- 所有金额、汇总、图表、客户排名与明细来自同一套确定性模拟记录，单位万元。模拟项目、客户、项目群名称均有“模拟”前缀；页面始终标明演示数据。
- 组织选项复用壳级12个板块/中心，生产演示集共864项机会记录。合同区间默认为2026年1月1日至上海当前日期，年度目标为全年模拟目标；机会权重包含筛选内尚未签约的机会。
- 三页共享筛选状态；阶段只作用机会清单。壳组织变更即时同步页内，页内组织查询不会反写壳级选择。查询前草稿不影响已显示结果。
- 使用现有ECharts、Ant Design、dayjs；控件本地中文化、主题跟随、图表卸载与ResizeObserver清理。没有市场业务API、数据库或持久化改动。

## 自验结果

| 检查 | 结论 | 证据 |
|---|---|---|
| 数据、合计、筛选、边界、CSV | 24项通过 | `verify-model.ts`、`model-results.json` |
| 浏览器交互与布局 | 98项通过，无pageerror | `verify-browser.ts`、`browser-results.json` |
| 双列与单列、同行等高、无页面横向溢出 | 1440×900、1280×720双列；1100×800单列通过 | `layout-results.json`、`contracts-*` |
| 机会清单与市场数据 | 表头、模块、筛选后数值通过 | `opportunity-1440x900.png`、`market-data-1440x900.png` |
| 主要图表视觉 | 已目视核对 | `goget.png`、`segment-progress.png`、`contract-trend.png`、`annual-trends.png`、`customer-ranking.png` |
| 专项ESLint | 通过 | 下方命令 |
| 全仓TypeScript | 有既有其他页面诊断；本次市场实现、Board及测试文件无诊断 | `typecheck.log` |

模型测试用3个板块的216项机会构造验证场景；浏览器测试从现有Board源读取全部组织选项，重新计算真实演示集的期望数值，核对表格合计、日期/业务类型/组织筛选后的指标，以及CSV行数、BOM和实际/预测类型。

浏览器测试另覆盖详情空搜索、图表悬浮与图例、金额/标榜、框架入口、客户翻页、主题、全空结果、重置、刷新、壳组织与页内组织的独立性，并检查返回运营看板、进入HSSE的导航。未触发任何市场业务API请求。

`export-check.csv`为自动导出的明确模拟数据检查产物。`*-initial.png`与`inspect-page.cjs`为初始巡检；`failure.png`是测试定位器调试时的过程记录，不是最终验收证据。最终结论以`browser-results.json`与上述正式命名截图为准。

## 重跑

```powershell
npx tsx docs/evidence/2026-11-10-ops-market-demo/verify-model.ts
# 本仓开发服务已运行于localhost:3001
npx tsx docs/evidence/2026-11-10-ops-market-demo/verify-browser.ts
npx eslint app/operations-dashboard-202610/board/market/*.tsx lib/market-demo/model.ts app/operations-dashboard-202610/board/page.tsx
npx tsc --noEmit --incremental false --pretty false
```

实现自验，供需求角色正式收口；不代替独立验收，不混关Board公共规格、HSSE、PDF等其他未结条目。未commit/push。
