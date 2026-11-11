# Board 前端维护地图

适用入口：`/operations-dashboard-202610/board`。本次重构保留现有视觉、业务口径、HTTP地址、iframe与React混合结构；对应变更账本2026-11-10“Board整体模块化重构”。

## 从哪里开始

| 要修改的内容 | 所属位置 |
|---|---|
| 目录节点、入口类型、公司视角限制、侧栏入口 | `app/operations-dashboard-202610/board/config/boards.ts` |
| React看板注册 | 同目录 `config/view-registry.tsx` |
| 组织选项、主题选项及壳主题色 | `public/operations-dashboard-202610/shared/catalog.js`，由Next与静态浏览器模块共同引用 |
| 深色侧栏、白底目录、头部筛选 | Board的 `shell/` |
| 顶层状态、组织深链、提示、公司视角限制 | `shell/useBoardState.ts` |
| 内容挂载、iframe引用与宿主消息发送 | `host/DashboardHost.tsx`、`host/useIframeBridge.ts` |
| 市场三页 | `features/market/` |
| HSSE看板、金字塔、单月录入、Excel导入 | `features/hsse/` |
| PDF列表、上传、阅读 | `features/pdf/` |

`page.tsx`仅组合壳与宿主。原根目录HSSE/PDF文件及`market/`入口是兼容重导出；业务修改直接进入`features/`，不在兼容入口复制实现。

## 静态看板

四个地址继续保留：`index.html`、`completed-contract.html`、`timesheet.html`、`hr.html`。这些HTML只保留结构、图标与资源声明，均在`public/operations-dashboard-202610/`下。

| 页面目录 | 主要职责 |
|---|---|
| `overview/` | 运营看板：`data`、`model`、`theme`、`kpi`、`cash`、`risk`、`segments`、`delivery`、`alerts`、`charts`、`dialogs`、`layout`、`controller` |
| `completed-contract/` | 数据、完成额/预警模型、格式化、图表、项目经理汇总、弹窗、布局 |
| `timesheet/` | 数据、工时模型、图表选项、业务区块、详情、导出、布局 |
| `hr/` | 快照配置、组织模型、人员/表格视图、业务区块、地图与图表、详情/透视、导出 |

每页`app.js`是初始化和事件入口，模块通过该页面私有的`ctx`协作；没有跨看板共享业务状态。各职责模块只在本页初始化时注册自己的函数，变更某个业务区块无需编辑HTML或其他区块。

样式集中在各页面`styles.css`中，沿用原有声明顺序与选择器优先级。本次没有重新整理历史覆盖规则，避免把结构整理与视觉改版混为一件事。

已有小工具保持单一实现：`kpi-subgoals.js`与`project-details.js/.css`继续沿用原路径；人力资源快照`hr-data.js`保留来源字段和原数据。旧`hr.js`与`hr.css`仅提供兼容入口。

## 数据的归属

- 运营、完成合同额、工时的演示数据分别归各自页面的`data.js`，不改变数值、权重或统计范围。
- 人力资源仍使用原来源快照，不补造缺失字段。
- 市场统一模拟明细及计算仍在`lib/market-demo/`。
- HSSE字段、Excel解析与共享存储仍在`lib/hsse/`；PDF类型与存储仍在`lib/pdf-reports/`。
- 不改变现有`/api/hsse-performance`、导入接口、PDF接口、模板下载地址或`data/platform.db`。

公共目录只共用确实一致的选项、消息和资源生命周期，不将各看板不同的金额、缺失值或业务模型强行归为同一套计算。

## iframe通信与生命周期

`shared/host-bridge.js`统一定义并处理三种消息：

- `ops-dashboard-theme`：`theme`。
- `ops-dashboard-filter`：`year`、`unit`。
- `ops-dashboard-resize`：尺寸变化。

入站消息校验同源；工时、人力资源继续要求来自父窗口。原消息字段与年度锁定行为保留。壳通过同一组常量发送消息，iframe只接收上下文，不读取其他看板内部状态。

每个静态看板提供`mount()`，返回`update(context)`、`destroy()`和只读`disposed`。`shared/lifecycle.js`负责持久监听器、观察器、计时器、动画帧、地图读取请求及图表销毁。页面离开时清理；浏览器往返缓存保留页不提前销毁。

正常目录切换不会销毁或重新挂载iframe；市场共享筛选、HSSE月份继续保留。PDF仍按原类别与当前展示条件挂载。明确提交的保存/上传沿用原有完成语义。

原诊断入口`window.dashboard`、`window.timesheetDashboard`、`window.hrDashboard`、`window.__ccProbe`与`window.__ccResizeCharts`保留，便于现有浏览器验证继续使用；业务模块不通过这些诊断入口互相调用。

## 添加或修改一个看板

1. 在所属功能目录实现内容；静态看板采用本地资源和ES模块，在HTML中引用自己的`app.js`。
2. 在`config/boards.ts`登记节点、图标、入口类型和展示条件。新增iframe无需添加另一组ref或onLoad分支。
3. 新增React功能在`config/view-registry.tsx`注册渲染器，再由节点引用；内容宿主不添加业务判断。
4. 以`year/unit/theme`上下文更新内容，清理新增监听与图表；为筛选、状态保留及导出补可观察行为测试。

## 验证与回滚

开发服务运行于`localhost:3001`后执行：

```powershell
npm run board:check
```

该命令依次运行数学/数据测试、临时SQLite存储测试、静态生命周期、项目明细、工时、市场、HSSE、PDF前端与基线对比。每项日志及汇总写入`docs/evidence/2026-11-10-board-modularization/`。

专项静态检查：

```powershell
npx eslint app/operations-dashboard-202610/board --ext ".ts,.tsx"
npx eslint "public/operations-dashboard-202610/{overview,completed-contract,timesheet,hr,shared}/*.js" scripts/check-board.mjs
npx tsc --noEmit --incremental false --pretty false
```

Highcharts从原HTML原样提取为本地12.4.0，保留版权与许可声明；不能用当前node_modules内12.2.0替换。ECharts本地文件未更换。HTML入口缩小不等于全部资源总量同幅度缩小。

重构不涉及数据迁移。需要回滚时仅恢复对应批次的前端文件；保留原有未提交修改，不重置仓库或数据库。实施前源码快照位置记录于验收目录的`baseline-source-location.json`。
