# Board 壳左侧 sidebar · wood. Projects Zone（ep75）

- 日期：2026-11-03（Asia/Shanghai）
- 主文件：`app/operations-dashboard-202610/board/page.tsx`
- 范围：替换原 `fixed w-16 bg-gray-800` 灰图标栏；**不改**白底「看板目录」树；未 commit。

## 做法

1. 深色侧栏 `bg-[#2f3640]`，展开 224px / 折叠 64px；`data-testid="wood-shell-sidebar"`。
2. 顶：`wood. Projects Zone` + `项目数据中台`（折叠态 `W`）。
3. 待办提醒（`ri-notification-3-line` → `/notice-board`）。
4. 「全局看板」默认展开（`shellExpanded.global=true`），组浅底 + 上 chevron；子项：运营看板（当前选中 → `/operations-dashboard-202610/board`）、交付保障看板（`/delivery-assurance-action-items-config`）、人力资源看板（占位 toast）。
5. 一级：项目管理 / 报告体系 / 平台设置 / 操作日志（可折叠下 chevron）；人员评分体系 / 项目执行跟踪（无 chevron，占位）。
6. 底右折叠 `«` / `»`；主区 `marginLeft` 与 header/筛选条 `left` 随侧栏宽联动（不再写死 `ml-16`）。
7. 无页项点击不报错，顶部 toast「…（占位，暂无独立页）」。

## 自检

```
node docs/evidence/2026-11-03-ops-board-sidebar-real/probe-sidebar.cjs
```

结果见 `probe-result.txt`（全 PASS）。另：`esbuild --loader:.tsx=tsx` 与 `typescript.transpileModule` 0 diag（`'use client';` 已正确）。

## 与截图差异

- Remix Icon 近似真实图标，非像素复刻。
- 可折叠组无真实子路由时展开为单条占位/同名入口。
- 白底「看板目录」按账本保留（非本条替换对象）。

## 截图

请 Max 浏览器实机补 `sidebar-expanded.png` / `sidebar-collapsed.png`。