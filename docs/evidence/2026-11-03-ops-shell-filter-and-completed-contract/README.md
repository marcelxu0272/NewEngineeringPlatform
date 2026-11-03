# 证据 · Board 壳级筛选 + 完成合同额看板

- 日期：2026-11-03（Asia/Shanghai）
- 账本：`Board 壳级筛选上提（锁 2026、去业务类型）+ 完成合同额看板 iframe 接入概览同构内容`（**勿改账本状态**；实现未关账）
- 未 commit / push
- 本地 Board 服务端口：**3001**

## 改动文件

- `app/operations-dashboard-202610/board/page.tsx` — 壳级筛选条；`completed-contract` 去 placeholder；双 iframe
- `public/operations-dashboard-202610/index.html` — 去掉内容顶栏三下拉；收 `ops-dashboard-filter`
- `public/operations-dashboard-202610/completed-contract.html` — 新建 demo（无外部 CDN）
- 口径已先改（Alex）：`GLOSSARY.md`、`docs/adr/0001-operations-dashboard-tree-and-two-column.md`（本回合未再改状态字段）

## 探针

- `probe.cjs` → `probe.json`（pass: true）
- 截图：`A1-shell-filter-default.png`、`A1b-filter-on-placeholder.png`、`A4-unit-design-institute.png`、`B1-completed-contract-board.png`、`B2-completed-content.png`、`B3-alerts-empty-state.png`

## AC 自检

见 Leo 回报。
