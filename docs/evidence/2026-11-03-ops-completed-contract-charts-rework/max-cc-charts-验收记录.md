# Max 验收记录 —— 完成合同额看板图表完整迁移返工

- 时间：2026/11/3 09:28:25（Asia/Shanghai）；补核约 09:30
- 页：`http://127.0.0.1:3001/operations-dashboard-202610/board` → 完成合同额 iframe；亦直开 `completed-contract.html`
- 结论：**通过**
- 阻断：无
- overall：**PASS**（AC1–10 全部通过）

| AC | 项 | 结果 | 要点 |
|----|----|------|------|
| AC1 | 底座：本地 ECharts / 禁 CDN / 不搬 Element / demo | 通过 | script=`./vendor/echarts.min.js`；无外网 CDN；无 Element |
| AC2 | P0 月度走势 6 系列+双轴+legend+markArea+累计前缀和 | 通过 | 当月柱×3 + 累计线×3；yAxis=2；tooltip=axis；完成/开票/回款累计=前缀和（补核） |
| AC3 | P0 treemap 面积∝|额| / 负值 / 其他 / click | 通过 | 含 P-2026-045 monthCompletion=-900000、value=|额|；「其他项目」kind=other；点击可开详情 |
| AC4 | P0 预警横向 bar 六类 / 有 count / 点选筛选 | 通过 | 源六类标签齐全；data 均>0；点条打开筛选 modal |
| AC5 | P1 更多→壳 modal 表+分页；查看 Drawer | 通过 | 更多打开表+分页；查看打开 Drawer |
| AC6 | P1 KPI 较上期 ±万；存量减号；tag/同步 | 通过 | 完成额「较上一期 +102.50 万」（非%）；存量 U+2212（−120.00 万）；保留 tag/同步说明 |
| AC7 | P2 树图空态 emptyTree=none\|all-zero | 通过 | none→「本次填报没有项目」；all-zero→「本月完成合同额均为 0」；tiles=0 |
| AC8 | P2 走势说明文案 | 通过 | 「柱=各月，线=累计；右侧为预测月。单位：万元」 |
| AC9 | P2 PM 占比分列 当月｜本年累计 | 通过 | thead 占比下分列「当月」「本年累计」 |
| AC10 | 证据/回归：不误改壳筛选与运营看板 KPI 完成合同额 | 通过 | 壳筛选可见、2026 锁年、无业务类型、有组织板块；运营看板仍见「完成合同额」 |

## 证据文件
- `max-probe.json`
- `max-cc-charts-probe.cjs`
- `max-cc-default.png` / `max-cc-modal.png` / `max-cc-drawer.png`
- `max-cc-emptyTree-none.png` / `max-cc-emptyTree-all-zero.png`
- `max-cc-board-iframe.png`

## 约束遵守
未改实现；不 commit/push；不改账本状态；不关账。未采信 Leo 自报，独立 Playwright 实测。
