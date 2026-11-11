# 运营看板月度下探验收记录

对应：变更账本2026-11-10“运营看板指标下探月度明细”，用户当前批准方案。实现中，供需求角色收口，不关闭其他未结条。

## 实现

11项金额指标接入月度视图；四年度KPI、WIP、应收为项目/月度双Tab。共用管理归属，项目搜索和分页独立。其他五项直接展示月度图表和月表。统一2026年、截至8月，9—12月显式缺失；所有新增内容为演示数据。

月度模型：`public/operations-dashboard-202610/overview/monthly-model.js`；月度视图/导出：同目录`monthly.js`；原项目视图及控制继续在`dialogs.js`与`app.js`。不增加API、数据库或依赖。

四KPI按整数分确定月度预算，保留当月/上月新增，项目模拟金额按月再分配，年度总额保持；项目辅助模块默认算法不变。余额以末期值对齐，不累加；收入为年累计。现金流复用现有数据，管理归属下流入与流出分别分配后计算净额。月表单位万元，项目元，导出BOM CSV。

## 验证

- `node docs/evidence/2026-11-10-ops-monthly-details/verify.cjs`：121项PASS、无pageerror，详见`results.json`。
- 覆盖11入口、Tab数量、12个月与缺失值、图表系列、四KPI逐月项目导出与月表核对、搜索隔离、管理归属跨Tab保留、CSV BOM、关闭图表清理以及零值/分配模型。
- 六类项目明细既有浏览器106项通过，保留10条/页、完整导出与金额换算。
- `monthly-1440.png`、`monthly-1280.png`、`monthly-850.png`记录两指定尺寸及窄屏。1280图已目视核对：图例、横轴和管理归属完整，月表在弹窗内部滚动。
- 运营业务模块及统一检查脚本ESLint通过；`git diff --check`通过。全仓既有TypeScript错误见前次模块化记录，本次未改TypeScript源码。
- 专项已接入`npm run board:check`，整套结果见`../2026-11-10-board-modularization/suite-results.json`与同目录check日志。

未修改真实业务数据，未commit/push，保留已有未提交修改。
