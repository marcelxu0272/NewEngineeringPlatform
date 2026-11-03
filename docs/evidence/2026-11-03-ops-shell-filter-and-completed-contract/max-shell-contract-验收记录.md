# 验收记录 · Board 壳级筛选上提 + 完成合同额看板 iframe

- **验收人**：Max（独立终验，未采信 Leo 自报）
- **账本条目**：`2026-11-03 —— Board 壳级筛选上提（锁 2026、去业务类型）+ 完成合同额看板 iframe 接入概览同构内容`
- **账本状态（未改）**：待落地
- **Board URL**：`http://127.0.0.1:3001/operations-dashboard-202610/board`
- **时间**：2026-11-03（Asia/Shanghai）
- **约束**：不改实现、不 commit/push、不改账本状态；与「协作入口文档」正交（本验不关那条）

## 结论

| 维度 | 结果 |
|------|------|
| **overall** | **通过** |
| A 壳级筛选 | 通过 |
| B 完成合同额看板 | 通过 |
| 阻断 | 无 |

## A. 壳级筛选（逐条）

| AC | 结果 | 证据要点 |
|----|------|----------|
| A1 壳筛选在 header 下、目录/内容上；占位节点仍可见 | **通过** | 几何：header bottom=80 → filter top=80/bottom=128 → catalog top=128；占位「人力资源看板」时筛选条仍可见 |
| A2 仅「2026年度」固定 +「组织板块」下拉；无业务类型 | **通过** | shell ant-select 仅 1 个；选项=全部板块/设计院/数字化业务单元/专业室；筛选条文案无「业务类型」 |
| A3 `index.html` 无旧三下拉；收 `{year:2026,unit}`；business 恒全部 | **通过** | iframe DOM：`#yearSelect/#unitSelect/#businessSelect`=0；`.header-controls` hidden；强制 postMessage 收到 `ops-dashboard-filter` |
| A4 切节点筛选不消失；当前 unit/year 发给可见 iframe；完成合同额稳定收消息 | **通过** | 切完成合同额后筛选仍在；完成合同额 iframe 收到 `{year:2026,unit:'专业室'}`；无相关 pageerror |

## B. 完成合同额看板（逐条）

| AC | 结果 | 证据要点 |
|----|------|----------|
| B1 去占位；专用 iframe；仍在 Board | **通过** | `completed-contract.html` iframe 可见；无占位四卡覆盖；URL 仍为 `/board` |
| B2 区块：四 KPI（较上一期色义）/ 树图 / 预警 / 走势 / 按 PM 汇总 | **通过** | 文案与 DOM 均命中；含「较上一期」；未混「上月新增」 |
| B3 只读 Drawer；`?emptyAlerts=1` 空态；无选线/角色分流/跳转追踪表 | **通过** | Drawer 可开且无输入控件；空态文案「未发现异常」；禁项未出现 |
| B4 demo；不误改运营看板 KPI「完成合同额」；合同看板仍占位 | **通过** | 回切运营看板仍存活且含「完成合同额」标签；「合同看板」仍四卡占位 |

## 证据路径

目录：`docs/evidence/2026-11-03-ops-shell-filter-and-completed-contract/`

- `max-probe.json`
- `max-shell-contract-probe.cjs`
- `max-shell-contract-验收记录.md`（本文件）
- `max-A1-shell-filter-default.png`
- `max-A1b-filter-on-placeholder.png`
- `max-A4-unit-design-institute.png`
- `max-B1-completed-contract-board.png`
- `max-B2-completed-content.png`
- `max-B3-alerts-empty-state.png`
- `max-B4-contract-board-still-placeholder.png`

## 未结变更提及

- **本条**：壳级筛选 + 完成合同额看板（本验通过，账本状态未改，待产品喊关「已落地」）
- **正交**：`2026-11-03 —— 协作入口文档（AGENTS / README / 账本指针）`（本验不覆盖、不关账）
