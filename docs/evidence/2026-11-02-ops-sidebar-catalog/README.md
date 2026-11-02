# Board 侧栏文案与一级 Remix Icon · 证据

- 日期：2026-11-02（Asia/Shanghai）
- 账本：`### 2026-11-02 —— 运营看板202610：Board 侧栏文案与一级 Remix Icon`（状态仍待落地，未改）
- 主要改动：`app/operations-dashboard-202610/board/page.tsx`
- 依赖：新增 `remixicon`（`package.json` / lock），`import 'remixicon/fonts/remixicon.css'`
- 用语同步：`docs/adr/0001-operations-dashboard-tree-and-two-column.md`（界面用语）；`GLOSSARY.md` 已有「看板目录/运营看板」未再改
- 未改：账本状态、`/org-chart`、`public/202602/**`、iframe KPI/三栏；未 commit

## 验收对照

1. 侧栏标题「看板目录」（无「看板树」）
2. 树顶节点「运营看板」（id 仍 `current`）
3. 一级四项 Remix Icon：
   - 运营看板 → `ri-dashboard-2-line`
   - 市场看板 → `ri-store-2-line`
   - 人力资源看板 → `ri-team-line`
   - 完成合同额看板 → `ri-money-cny-circle-line`
4. 市场二级叶子无图标
5. probe.json pass: true

## 截图

- `01-sidebar-full.png`
- `02-sidebar-clip.png`
- `probe.json`
