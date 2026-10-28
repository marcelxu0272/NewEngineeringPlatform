# 运营看板数据源清单（`operations-dashboard.html`）

本文档用于说明 `public/dashboard/operations-dashboard.html` 当前版本的数据来源。  
结论：当前页面为**前端静态数据 + 前端计算**，未接入后端 API。

## 1. 主数据源（Vue `data()`）

位于 `new Vue({ data() { return { ... } } })`：

- `cardData`
  - 顶部 4 个 KPI 卡片数据（标题、主值、月度值、百分比、donut 值、子目标）
- `cfInflow` / `cfOutflow` / `cfNetCash` / `cfPrevYearNet`
  - 现金流主指标与上年净现金流
- `cfOutItems`
  - 现金流出明细项（名称、金额、占比、主题色、icon）
- `wsLocalIn` / `wsLocalOut`
  - Workshare 本板块 Top3（Share-in / Share-out）
- `wsCompanyIn` / `wsCompanyOut`
  - Workshare 公司整体 Top3（Share-in / Share-out）
- `deliveryItems`
  - 项目交付保障原始清单（`id/name/phase/overdue/date`）
- `cfMonthlyDetail`
  - 年度现金流月度明细（弹窗表格 + 详情图）
- `opsMonthlyDetail`
  - 其他运营指标月度明细（弹窗表格 + 详情图）
- `departments` / `pms` / `years`
  - 筛选器选项
- `selectedDept` / `selectedPm` / `selectedYear` / `wsTab` 等
  - 页面状态

## 2. 模板内硬编码数据（不走 `data()`）

以下数值直接写在 HTML 模板里：

- “应收与其他运营指标（万元）”卡片中的金额与趋势值
  - WIP、应收账款、存货、营业收入及对应涨跌值
- “工程软件设计项目覆盖率”3 个软件的覆盖率
  - `S3D/E3D 43.38%`
  - `SPPID 0.4%`
  - `SPI 13.32%`

## 3. 派生数据源（`computed`）

从 `deliveryItems` 计算得到：

- `deliveryOverdueCount`：已过期数量
- `deliveryWithin7Count`：一周内数量
- `deliveryWithin30Count`：一月内数量
- `deliveryWithin7List`：一周内项目列表
- `deliveryWithin30List`：一月内项目列表
- `deliveryTopRisk`：交付保障卡片 Top 风险项（固定补齐 3 条）

## 4. 图表数据来源

### 4.1 来源于 `data()` 的图表

- KPI Donut 图：`cardData[].donutValue`
- 现金流详情图：`cfMonthlyDetail`
- 其他运营指标详情图：`opsMonthlyDetail`

### 4.2 图表函数内写死（hardcoded）的数据

- `renderCashFlowChart()`（迷你柱图，若容器存在）
  - `xAxis.categories` 为硬编码
  - `series` 两组柱状数据为硬编码

## 5. 时间相关隐式数据源

- `new Date()`（当前日期）
  - 用于计算“已过期 / 一周内 / 一月内 / 剩余天数”等状态

## 6. 当前对接状态

- 未发现 `fetch` / `axios` / API route 请求逻辑
- 当前看板所有业务数据来源为：
  1) `data()` 静态对象  
  2) 模板内直接写死值  
  3) `computed` 派生计算  

