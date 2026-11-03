# ep76 返工：pairRow 叶子态真正不可见（Max FAIL 条①）

- 日期：2026-11-03（Asia/Shanghai）
- 账本：`板块现金流/目标达成仅「全部板块」时展示`
- **未 commit**

## 根因

`.pair-row{display:grid!important}` 压过 JS `row.style.display='none'`（无 important），导致壳选 SAS170 等叶子后 `#pairRow` 虽有 `hidden` / `data-visible=false`，computed 仍为 grid，两块仍可见。

## 修复（仅 `public/operations-dashboard-202610/index.html`）

1. CSS：`#pairRow[hidden], #pairRow[data-visible="false"]{ display:none!important; }`
2. JS `syncPairRowVisibility`：隐藏用 `setProperty('display','none','important')`；显示用 `removeProperty('display')` 回落到 grid。

未改 board 侧栏、UNIT_OPTIONS、org-entry、ep79。

## 自测

```
node docs/evidence/2026-11-03-ops-pair-all-units-only/probe-pair-units.cjs
node docs/evidence/2026-11-03-ops-pair-all-units-only/probe-pair-rework-display.cjs
```

BASE=`http://localhost:3001`

关键结果：

- 全部板块：`computedDisplay=grid`，`offsetHeight≈402`，`data-visible=true`
- SAS170 / SAS520：`computedDisplay=none`，`offsetHeight=0`，`hidden=true`，`data-visible=false`
- 切回全部板块：恢复可见

产物：`probe-rework-result.txt` / `.json`，截图 `rework-01-all-visible.png`、`rework-02-leaf-hidden.png`、`rework-03-back-all.png`
