# 工时看板 · 实现与验收记录

日期：2026-11-03。对照：`docs/变更账本.md`「运营看板202610：工时看板内容与交互」AC 1–13。

结论：本次工时内容与交互验收通过。主浏览器探针 75 项、生命周期与图表边界补充探针 6 项全部通过，无浏览器运行错误。全仓生产构建仍由既有市场看板语法错误阻断，单独记录，不计为全仓构建通过。未 commit/push。

## 验收对应

| AC | 验收结果 | 证据 |
|---|---|---|
| 1–3 | 原入口升级专用 iframe；无重复组织/年度控件；当前部门明确；四卡保持 2×2 | `verification.json`、两档 `board-*-top.png` |
| 2、8 | 12 部门切换、全部板块内部映射咨询且不回写壳；批准、项目、人员、逐日与预测汇总一致 | `verification.json` |
| 4 | 报告期三日／六个月实际＋三个月预测可切换；预测虚线，当前月标明截至11月3日 | `verification.json`、`board-1440-top.png` |
| 5、9 | 本部门三月条形、人员单月切换、姓名搜索、升降序、跨年年月及独立 TBD 均正常 | `verification.json`、`board-1280-bottom.png`、`board-1280-footer.png` |
| 6 | 四类只读明细、表尾合计、Esc／按钮关闭、关闭后恢复焦点及滚动位置；背景滚轮不穿透 | `verification.json`、`detail-dialog.png` |
| 7 | 两类 CSV 三个月均含 BOM、部门、真实年月和单位；人员明细遵循搜索、排序 | `verification.json`、`summary-*.csv`、`details-*.csv` |
| 10 | 三主题、带组织参数首次进入、隐藏时修改筛选主题后返回、PDF 来回切换与侧栏折叠后 resize | `verification.json`、`lifecycle.json` |
| 11 | 壳内1440×1000／1280×720，iframe 实际宽992／832；两列不溢出、SVG轴签和数值不越界、底部完整可达、壳无重复滚动 | 两份探针 JSON、`board-*.png` |
| 12 | 金山中心真实零、模块化板块零标准工时显示“—”、惠湛中心无数据、姓名无匹配空态、咨询118%完整显示 | `verification.json`、`board-1280-footer.png` |
| 13 | 内联脚本语法、Board TSX语法及依赖类型检查、专项ESLint均通过；全仓构建阻断单列 | `verification.json`、`build-check.txt` |

人工查看了1440顶部、1280顶部／双列预测区／页尾与明细弹窗截图；文字、按钮、姓名、单位和超100%标签均完整可读。页面仅展示演示数据，不含工程软件用量或跨部门排名。

## 复现命令

在仓库根目录、开发服务运行于3001时执行：

```powershell
node docs/evidence/2026-11-03-ops-timesheet/verify.cjs
node docs/evidence/2026-11-03-ops-timesheet/verify-lifecycle.cjs
npx eslint app/operations-dashboard-202610/board/page.tsx
```

探针可用 `TIMESHEET_BASE_URL` 指向其他开发端口。Board及其真实导入依赖使用项目 `tsconfig.json` 编译选项、以 `page.tsx` 为唯一根文件做专项 TypeScript 检查，诊断数为0；避免把既有市场页语法错误误记为工时页错误。

`npm run build` 的本次失败摘要见 `build-check.txt`（市场页526行语法错误）。生产构建与开发服务共用 `.next` 缓存，构建检查后已恢复3001开发服务，以上浏览器验收均在恢复后执行。

## 本次修正与边界

- 验收发现原生弹窗只锁 body 时，背景仍会滚动；已同时锁根 HTML/body，关闭、Esc及组织变化统一恢复样式、位置和焦点，真实滚轮复验通过。
- 新增内容沿用既有主题和壳消息，不新增依赖、业务 API、数据库表或真实账号权限。
- 原工时目录、PDF报告、经营红绿灯、其他目录与名称条目保持原状态，本记录仅用于本次工时内容条目收口。
