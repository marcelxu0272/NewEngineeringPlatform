# HSSE Excel宽表批量录入 · 实现自验

日期：2026-11-09。依据：用户新增批量录入/Excel大宽表要求及变更账本同日“Excel宽表批量录入”条。

## 已实现

- 工具条新增“下载Excel模板”“Excel批量录入”；保留单月录入。
- 模板为单张“HSSE月报”工作表，13列：年度、月份、11项指标；预列2026年12个月，指标全部留空。冻结前4行与前2列，输入区、表头与说明分色。
- 人工时以百万录入，最多6位小数；记录精确转换成整数小时。Recordables与年度累计沿用既有计算。
- 支持.xlsx（最大4MB），前10行寻找完整表头；已填月份必须全部填写，空月份跳过，不接受公式、重复月、非法年度/数值/表头。
- POST导入接口只校验与预览；显示新增/覆盖月份。确认后PUT通过共享SQLite事务整批保存，失败整批回滚，预览保留可重试。
- 保存后刷新当前月与年度累计；不删除导入范围以外的月份。

## 证据

| 检查 | 结果 | 文件 |
|---|---|---|
| 模板/解析/实际API/事务 | 26项通过 | `verify-import.ts`、`api-results.json` |
| 浏览器导入 | 14项通过，无pageerror | `verify-browser.cjs`、`browser-results.json` |
| 预览布局 | 1440×900与1280×720通过，宽表可横向滚动 | `preview-1440x900.png`、`preview-1280x720.png` |
| 模板视觉 | 已渲染并核对13列、12个月、说明、填写区 | `template-preview.png` |
| 原HSSE回归 | API24项、浏览器24项、真实HTTP空态通过 | `../2026-11-09-ops-hsse/` |
| 专项ESLint | 通过 | 命令如下 |
| 全仓TypeScript | 其他既有页面错误；HSSE文件无诊断 | `typecheck.log` |

存储测试在切换临时目录后动态加载数据库模块，并断言数据库路径位于临时目录。以SQLite触发器强制第二个月写入失败，确认第一个月的修改回滚；重试成功及关闭重开后的持久化均通过。测试库已删除。

浏览器下载和Excel预览使用真实HTTP接口；提交保存由浏览器模拟响应，避免将合成测试月报写入平台库。真实写入事务由隔离SQLite测试验证。重新检查平台HSSE月报仍为空。

模板由bundled artifact-tool生成，随后仅规范化SpreadsheetML的XML命名空间前缀，使其兼容ExcelJS读取，不改变单元格数据/样式；导出的模板已用实际导入解析器读取验证。未声称已在原生Microsoft Excel中验收。

## 重跑

```powershell
npx tsx docs/evidence/2026-11-09-ops-hsse-import/verify-import.ts
# localhost:3001须运行本仓开发服务
node docs/evidence/2026-11-09-ops-hsse-import/verify-browser.cjs
npx eslint app/operations-dashboard-202610/board/HsseBoard.tsx app/operations-dashboard-202610/board/HsseImport.tsx app/api/hsse-performance/import/route.ts lib/hsse/*.ts
npx tsc --noEmit --incremental false --pretty false
```

`fixture-valid.xlsx`、`fixture-invalid.xlsx`是明确合成的自动化测试输入，不是正式月报或供用户填写的模板。最终模板在`outputs/hsse-import-20261109/HSSE月报批量导入模板.xlsx`，应用下载副本在`public/operations-dashboard-202610/`。

仅为实现自验，供需求角色收口；不混关HSSE原条或其他既有未结条。未commit/push。
