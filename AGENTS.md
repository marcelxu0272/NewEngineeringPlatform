# Agent / 协作者入口（工程平台）

本文件是人与 Agent 进入本仓时的**最短协作地图**。细则以链到的原文为准，这里不重复贴全文。

## 先读什么

| 用途 | 路径 |
|------|------|
| **变更账本（唯一口径变更入口）** | [`docs/变更账本.md`](docs/变更账本.md) |
| 验收证据 | [`docs/evidence/`](docs/evidence/)（说明见同目录 `README.md`） |
| 运营看板等业务用语 | [`GLOSSARY.md`](GLOSSARY.md) |
| 已拍板架构决策 | [`docs/adr/`](docs/adr/) |
| 正式/设计稿（引用，改口径须先记账本） | [`docs/需求文档/`](docs/需求文档/)、[`docs/plans/`](docs/plans/)、`docs/DESIGN.md`、`docs/DASHBOARD.md`、`docs/LIST_FORM.md` 等 |
| Matt skills / domain | [`docs/agents/domain.md`](docs/agents/domain.md) |
| Issue / triage | [`docs/agents/issue-tracker.md`](docs/agents/issue-tracker.md)、[`docs/agents/triage-labels.md`](docs/agents/triage-labels.md) |

开发启动命令见 [`README.md`](README.md)「Getting Started」。

## 硬规则（派活与改文档前）

1. **先读账本**：动手前读 `docs/变更账本.md` 与相关正式文档最新状态；派活、交接时**主动提及**本账本及与任务相关的**未结变更**。
2. **谁可改口径**：正式需求 / 验收口径 / GLOSSARY·ADR 中的已确认业务语言，**仅**需求角色 Agent（或用户明确授权之人）可改；其他角色发现问题只可提出，不得直接改口径。
3. **先账本后正文**：任何正式需求或验收口径的改动，必须**先追加**变更账本，再改对应文档。
4. **异步单写**：多人 / 多 Agent 异步协作，**同一时刻不要并行改同一文件**。
5. **证据归位**：对照验收跑测的截图、探针、记录放 `docs/evidence/`；关账时在账本条目备注中引用证据路径。
6. **不写业务代码的角色**：需求角色不改业务源码；实现与验收各走账本状态，不擅自改 AC 措辞。

## 未结变更（当前请到账本核对）

以 [`docs/变更账本.md`](docs/变更账本.md) 条目状态为准（提议 / 已确认 / 待落地 / 实现中 / 返工中 / 已落地）。文档入口类与业务实现类条目**分开**登记，勿混范围。

## 远程

https://github.com/marcelxu0272/NewEngineeringPlatform
