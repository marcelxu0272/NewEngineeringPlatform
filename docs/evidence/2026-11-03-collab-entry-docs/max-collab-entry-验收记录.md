# 验收记录 —— 协作入口文档（AGENTS / README / 账本指针）

- **验收人**：Max（执行器）
- **账本条目**：2026-11-03 —— 协作入口文档（AGENTS / README / 账本指针）
- **账本状态（验时）**：待落地（本验不改账本状态）
- **时间**：2026-11-03 09:14 Asia/Shanghai (UTC+8)
- **项目**：`C:\Work\2_Development\21_Platform\26_engineering-platform`（machine `c33fffad`）
- **范围**：只验链接与入口；**不**验业务 UI、**不**验完成合同额；不改实现、不 commit/push
- **总体结论**：**通过**

## 逐 AC

| AC | 结论 | 说明 |
|----|------|------|
| 1. 仓根 `AGENTS.md` + 必链 + 硬规则 | **通过** | 存在；链到账本 / GLOSSARY / `docs/adr/` / `docs/evidence/` / `docs/需求文档/` 等；写明谁可改正式口径、派活须提未结变更、异步同刻不并行改同文件 |
| 2. `README.md`「协作与文档」 | **通过** | 有该节；链 AGENTS / 账本 / GLOSSARY / ADR / evidence；保留 Next Getting Started |
| 3. `docs/agents/domain.md` 指针 | **通过** | 指向 AGENTS + 账本 + evidence；职责与 AGENTS 一致（需求角色改口径、派活提未结变更、先账本后正文） |
| 4. 与壳级筛选/完成合同额正交 | **通过** | 本验未扩验业务 UI；三文件与账本本条均声明文档入口与业务实现分条、勿混范围 |
| Claire 补：相对链接均存在 | **通过** | 见 `max-link-probe.json`；缺失链接 = 0 |
| Claire 补：协作入口不提及 Claude / `CLAUDE.md` | **通过** | 三文件全文搜 Claude/CLAUDE.md（大小写不敏感）= 0 命中；仓内无 `CLAUDE.md` 属预期，**不**因此阻断 |

## 职责表述核对（不打架）

- **谁可改正式口径**：AGENTS 硬规则 §2 + domain「Who may change formal口径」一致——仅需求角色 Agent（或用户明确授权）。
- **派活须提未结变更**：AGENTS §1 + domain「Dispatch/handoff must mention the ledger…」一致。
- **异步不并行改同文件**：AGENTS §4「异步单写」；README/domain 未写相反规则。
- **协作入口**：AGENTS + README 为准；domain 指向根 AGENTS；**不**依赖 `CLAUDE.md`。

## Claude / CLAUDE.md

- 三文件提及：**无**
- 仓根 `CLAUDE.md`：**不存在**（用户自删，按 Claire/Alex 补充不判阻断）

## 证据

- 本文件：`docs/evidence/2026-11-03-collab-entry-docs/max-collab-entry-验收记录.md`
- 链接探针：`docs/evidence/2026-11-03-collab-entry-docs/max-link-probe.json`

## 阻断

无。
