# Board整体模块化重构验收记录

日期：2026-11-10。对应变更账本“Board整体模块化重构”，实现记录供需求角色收口；不代替正式需求验收，不关闭其他未结条目。

## 实现结果

- Board入口拆为配置、导航壳、状态与内容宿主。目录配置登记入口、类型及公司视角限制；React渲染器集中注册。
- 四个静态HTML地址保留，样式按原层叠顺序外置；数据、模型、区块、图表、弹窗、布局、初始化与清理分别维护，采用浏览器ES Modules。
- 市场三视图、共享筛选与明细分离；HSSE金字塔、单月录入、Excel导入分离；PDF列表、上传窗口、阅读器分离。原组件入口保留兼容重导出。
- 组织/主题选项与宿主通信共用，静态页面有明确的mount/update/destroy接口及监听器、观察器、计时器、请求、图表清理。
- API、数据库结构与业务数据层位置保持原样。Highcharts保持原HTML中的12.4.0，原样提取并保留许可声明；ECharts未变更。

维护入口：`docs/architecture/board-modularization.md`。实施前仅前端源码快照位置见`baseline-source-location.json`，没有复制或回滚数据库。

## 体积对照

| 入口 | 拆分前字节 | 拆分后字节 |
|---|---:|---:|
| index.html | 398,967 | 11,482 |
| completed-contract.html | 44,740 | 6,223 |
| timesheet.html | 37,868 | 6,811 |
| hr.html | 7,211 | 7,230 |
| Board page.tsx | 30,113 | 1,263 |

详见`sizes.json`。人力资源原先已有HTML/样式拆分，本次主要拆大脚本。资源转入独立模块，以上不是全部加载资源体积或下载性能承诺。

## 回归结果

运行中的开发服务：`http://localhost:3001`；命令：`npm run board:check`。最终`suite-results.json`为PASS，15个检查步骤及基线/库完整性门禁全部通过；每项完整输出在`check-*.log`。

| 检查 | 通过项数 |
|---|---:|
| KPI子目标数学 | 10 |
| 项目明细金额模型 | 108 |
| 市场共享模型 | 24 |
| HSSE/PDF隔离SQLite持久化 | 6 |
| HSSE API隔离测试 | 24 |
| HSSE Excel导入隔离测试 | 26 |
| 四静态页通信/销毁/重新初始化 | 50 |
| 六类项目明细浏览器回归 | 106 |
| 工时浏览器与生命周期 | 75 + 6 |
| 市场三页浏览器回归 | 98 |
| HSSE单月录入浏览器回归 | 24 |
| HSSE Excel导入浏览器回归 | 14 |
| PDF列表/上传/阅读浏览器回归 | 11 |

覆盖四年度KPI名称、三行子目标与12段轨道、六类明细默认10条、元/万元换算及CSV合计、新签/变更列；覆盖导航、组织/主题同步、HSSE返回保留月份、市场筛选、空态/明细/排名/导出、保存失败和重试。各页既有浏览器脚本检查1440×900、1280×720，市场另检查单列宽度；工时及静态生命周期回归检查图表重排与重复挂载清理。

持久化写入只使用临时目录中的隔离SQLite；浏览器提交与上传使用路由内存夹具。PDF读取原有文件用于阅读器验证，不向真实公司库写测试数据。Excel浏览器预览使用实际HTTP解析，提交由夹具接收；真实事务在隔离库验证。

## 前后基线

- `baseline.json`与`final.json`的四静态页正文、运营模型金额及图表数量完全一致；图表数量依次为运营5、完成合同额3、工时4、人力资源1。
- 最终捕获没有pageerror或看板资源HTTP错误。Highcharts SHA-256等于原内嵌内容，记录在`highcharts-sha256.json`；ECharts哈希记录在`sizes.json`。
- `baseline-*.png`与`final-*.png`保存六个视图；`visual-content-comparison.json`记录1440×900下主内容裁剪区（x=448,y=128至右下角）的像素对比，六个视图均为0差异。这不是对整张导航壳截图或所有尺寸的逐像素承诺。
- `phase1*`、`phase2*`和`phase3*`是分批迁移检查；`probe-*`、`hsse-check.png`与其他诊断截图仅为过程材料，最终以统一回归和final截图为准。

## 静态检查及限制

- Board全部TS/TSX专项ESLint通过：`eslint-react.log`。
- 新静态业务模块、公共模块及统一回归入口专项ESLint通过：`eslint-static.log`。
- `git diff --check`通过，仅有Git换行转换提示。
- 全仓`tsc --noEmit --incremental false --pretty false`退出2；既有错误位于DataList、其他dashboard页面等，完整记录在`typecheck-final.log`，本次Board与公共模块没有诊断。未将全仓检查报告为通过。
- 未commit/push；保留原有未提交修改。重构回退只涉及前端各批次文件，不涉及业务数据。
