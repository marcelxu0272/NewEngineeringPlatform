# 板块现金流贡献/目标达成仅全部板块 + UNIT 12 叶子（ep76 + UNIT）

- 日期：2026-11-03（Asia/Shanghai）
- 与 ep75 侧栏**分条**，勿混关账本；未 commit。

## 文件

- `app/operations-dashboard-202610/board/page.tsx` — `UNIT_OPTIONS`
- `public/operations-dashboard-202610/index.html` — `#pairRow` 显隐 + `DEMO_DATA.departments` / unitFactor / projects.department / cashW 负样本叶子名
- `completed-contract.html` — 仅透传 `state.unit` 文案，无旧叶子硬编码，未改

## AC

1. **仅全部板块显示**：`#pairRow`（板块现金流贡献 + 板块目标达成）仅当 `state.unit==='全部板块'` 显示；否则 `display:none` + `hidden`，不留空壳；`render` / 壳 `ops-dashboard-filter` 联动。
2. **UNIT_OPTIONS**：全部板块 + SAS170 PMC板块 / SAS610 咨询板块 / SAS680 数字技术板块 / SAS650 新材料板块 / SAS710 生命科学板块 / SAS690 COII板块 / SAS720 模块化板块 / SAS670 供应链板块 / SAS520 金山中心 / SAS560 沈阳中心 / SAS550 惠湛中心 / SAS530 银川中心。不含公司级EPC；已删设计院/数字化业务单元/专业室。

## 自检

```
node docs/evidence/2026-11-03-ops-pair-all-units-only/probe-pair-units.cjs
```

结果见 `probe-result.txt`（全 PASS）。

## Max 返工（display !important）

见 `max-rework-display.md`；Playwright：`probe-pair-rework-display.cjs` → `probe-rework-result.txt`（叶子 computed display===none）。

