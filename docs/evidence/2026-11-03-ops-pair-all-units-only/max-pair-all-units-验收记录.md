# 验收记录 · 条A：#pairRow 仅「全部板块」时展示

- 验收人：验收工程师 Max（独立 Playwright 实机；**不采信 Leo 静态 probe**）
- 结论：**FAIL**
- URL：`http://localhost:3001/operations-dashboard-202610/board`
- 对照账本：`### 2026-11-03 —— 运营看板202610：板块现金流/目标达成仅「全部板块」时展示`（实现中；本任务未改账本）
- 证据目录：`docs/evidence/2026-11-03-ops-pair-all-units-only/`（前缀 `max-pair-all-units-*`，未覆盖 Leo `probe-*`）
- **未混验** sidebar / UNIT 叶子 / 组织图跳转 Board；本记录只写本条结论

## 逐 AC
- AC1 PASS — 组织板块=全部板块：板块现金流贡献 + 板块目标达成均可见（标题/图/tab 齐全）
- AC2 FAIL — 任一具体板块：#pairRow 整块隐藏（display/hidden/几何无空壳）
- AC3 FAIL — 全部↔具体来回切换，显隐正确、无残留半截
- AC4 PASS — 不误伤其它模块（KPI/现金流/应收风险/负荷交付仍可见）
- AC5 PASS — 本记录只写本条结论（未混关 sidebar/UNIT）
- AC6 PASS — 证据落盘；pageerror 记录

## 关键量测摘要
- 全部板块：display=grid hidden=false h=401.58 titles=板块现金流贡献 （万元） ? / 板块目标达成 ? tabs=4
- SAS170：display=grid hidden=true h=401.58
- 来回：leaf2Hidden=false backVisible=true againHidden=false

## pageerror
- （无）

## 关键证据
- `max-pair-all-units.json`
- `max-pair-all-units.cjs`
- `max-pair-all-units-01-all-visible.png`
- `max-pair-all-units-01b-pair-clip.png`
- `max-pair-all-units-02-leaf-hidden.png`
- `max-pair-all-units-03-toggle-leaf.png`
- `max-pair-all-units-04-back-all.png`

## 备注
- **未改业务代码、未 commit/push、未改账本状态、未关账。**

## 阻断项（AC2 / AC3）
- **根因**：public/operations-dashboard-202610/index.html 中 .pair-row{ display:grid!important; … } 覆盖了 syncPairRowVisibility() 设置的 ow.hidden=true 与 ow.style.display='none'（无 !important），故叶子态虽已设 hidden / data-visible=false / state.unit 正确，**几何仍可见**（宽≈1105、高≈401），标题/图/tab 仍在，形成空壳大洞。
- **复现**：壳级「组织板块」选 `SAS170 PMC板块`（或任一叶子）后，iframe 内 #pairRow 仍 getBoundingClientRect().height≈401，getComputedStyle(row).display==='grid'。
- **建议修复方向**（本任务未改代码）：隐藏时用 ow.style.setProperty('display','none','important')，或增加 .pair-row[hidden], .pair-row[data-visible="false"]{display:none!important}；显示时再清回。
- 全部板块态 AC1 正常；其它模块 AC4 未误伤。

