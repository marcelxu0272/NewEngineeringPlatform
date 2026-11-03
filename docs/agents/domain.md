# Domain Docs

How the engineering skills should consume this repo's domain documentation when exploring the codebase.

## Collaboration pointers (this repo)

Before exploring or proposing口径 changes, also know:

- Root map: [`AGENTS.md`](../../AGENTS.md)
- **Change ledger:** [`docs/变更账本.md`](../变更账本.md) — append here **before** editing formal requirements / acceptance / confirmed glossary·ADR wording
- **Evidence:** [`docs/evidence/`](../evidence/)
- Who may change formal口径: requirements-role agent (or user-authorized only); others propose only
- Dispatch/handoff must mention the ledger and related open entries

Glossary and ADRs below remain the vocabulary/decision sources for domain language.

## Before exploring, read these


- **`GLOSSARY.md`** at the repo root, or
- **`GLOSSARY-MAP.md`** at the repo root if it exists: it points at one `GLOSSARY.md` per context. Read each one relevant to the topic.
- **`docs/adr/`**: read ADRs that touch the area you're about to work in. In multi-context repos, also check `src/<context>/docs/adr/` for context-scoped decisions.
- **`docs/变更账本.md`**: read open entries that touch the area; do not change formal口径 without appending here first (see root `AGENTS.md`).
- **`docs/evidence/`**: acceptance evidence for closed/in-progress验收; not a substitute for the ledger.

If glossary/ADR files don't exist, **proceed silently** on those (don't flag absence; don't suggest creating them upfront). The change ledger and `AGENTS.md` **do** exist in this repo—use them. The `/domain-modeling` skill (reached via `/grill-with-docs` and `/improve-codebase-architecture`) creates glossary/ADR lazily when terms or decisions actually get resolved.

## File structure

Single-context repo (most repos):

```
/
├── GLOSSARY.md
├── docs/adr/
│   ├── 0001-event-sourced-orders.md
│   └── 0002-postgres-for-write-model.md
└── src/
```

Multi-context repo (presence of `GLOSSARY-MAP.md` at the root):

```
/
├── GLOSSARY-MAP.md
├── docs/adr/                          ← system-wide decisions
└── src/
    ├── ordering/
    │   ├── GLOSSARY.md
    │   └── docs/adr/                  ← context-specific decisions
    └── billing/
        ├── GLOSSARY.md
        └── docs/adr/
```

## Use the glossary's vocabulary

When your output names a domain concept (in an issue title, a refactor proposal, a hypothesis, a test name), use the term as defined in `GLOSSARY.md`. Don't drift to synonyms the glossary explicitly avoids.

If the concept you need isn't in the glossary yet, that's a signal: either you're inventing language the project doesn't use (reconsider) or there's a real gap (note it for `/domain-modeling`).

## Flag ADR conflicts

If your output contradicts an existing ADR, surface it explicitly rather than silently overriding:

> _Contradicts ADR-0007 (event-sourced orders), but worth reopening because…_
