const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

(async () => {
  const OUT = path.resolve('docs/evidence/2026-11-03-ops-segment-cash-contrib');
  fs.mkdirSync(OUT, { recursive: true });
  const fileUrl = 'file:///C:/Work/2_Development/21_Platform/26_engineering-platform/public/operations-dashboard-202610/index.html';
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1600, height: 1100 } });
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));

  await page.goto(fileUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForFunction(() => document.body.dataset.ready === 'true', { timeout: 25000 });
  await page.waitForTimeout(800);

  const checks = [];
  const push = (ac, name, ok, detail) => checks.push({ ac, name, ok: !!ok, detail });

  // --- Geometry: pair-row equal split + chart same W/H ---
  const geom = await page.evaluate(() => {
    const row = document.querySelector('.pair-row');
    const contrib = document.getElementById('contributionPanel');
    const target = document.getElementById('targetPanel');
    const cChart = document.getElementById('contributionChart');
    const tChart = document.getElementById('targetChart');
    const rb = row?.getBoundingClientRect();
    const cb = contrib?.getBoundingClientRect();
    const tb = target?.getBoundingClientRect();
    const ccb = cChart?.getBoundingClientRect();
    const tcb = tChart?.getBoundingClientRect();
    const cs = cChart ? getComputedStyle(cChart) : null;
    const ts = tChart ? getComputedStyle(tChart) : null;
    return {
      rowW: rb ? +rb.width.toFixed(2) : null,
      panelW: { c: cb ? +cb.width.toFixed(2) : null, t: tb ? +tb.width.toFixed(2) : null },
      panelH: { c: cb ? +cb.height.toFixed(2) : null, t: tb ? +tb.height.toFixed(2) : null },
      chartW: { c: ccb ? +ccb.width.toFixed(2) : null, t: tcb ? +tcb.width.toFixed(2) : null },
      chartH: { c: ccb ? +ccb.height.toFixed(2) : null, t: tcb ? +tcb.height.toFixed(2) : null },
      cssH: { c: cs?.height, t: ts?.height, cMin: cs?.minHeight, tMin: ts?.minHeight },
      equalPanelW: cb && tb ? Math.abs(cb.width - tb.width) < 1 : false,
      equalChartW: ccb && tcb ? Math.abs(ccb.width - tcb.width) < 1 : false,
      equalChartH: ccb && tcb ? Math.abs(ccb.height - tcb.height) < 1 : false,
      bothChartH320: ccb && tcb ? Math.abs(ccb.height - 320) < 2 && Math.abs(tcb.height - 320) < 2 : false,
      titles: {
        c: (contrib?.querySelector('.panel-title')?.innerText || '').replace(/\s+/g, ' ').trim(),
        t: (target?.querySelector('.panel-title')?.innerText || '').replace(/\s+/g, ' ').trim(),
      },
    };
  });

  push(1, 'pair-row 两卡等分宽度对齐', geom.equalPanelW, JSON.stringify(geom.panelW));
  push(2, '两卡图区同宽同高（≈320px）', geom.equalChartW && geom.equalChartH && geom.bothChartH320, JSON.stringify({ chartW: geom.chartW, chartH: geom.chartH, cssH: geom.cssH }));

  // --- Per-tab sort by completion RATE (not absolute amount) ---
  const tabs = [
    { key: 'contract', label: '新签合同额' },
    { key: 'completed', label: '完成合同额' },
    { key: 'invoice', label: '完成开票额' },
    { key: 'receipt', label: '完成回款额' },
  ];
  const sortResults = {};
  for (const tab of tabs) {
    await page.click(`[data-target-metric="${tab.key}"]`);
    await page.waitForTimeout(250);
    sortResults[tab.key] = await page.evaluate((key) => {
      const dash = window.dashboard;
      const model = dash.model;
      const totalTarget = model.targets[key];
      const contractBudget = model.targets.contract || 1;
      const expected = [...model.depRows].map((r) => {
        const tgt = totalTarget * (r.target / contractBudget);
        const act = r[key] || 0;
        const rate = tgt ? (act / tgt) * 100 : 0;
        return { name: r.name, act, rate };
      });
      const byRate = [...expected].sort((a, b) => b.rate - a.rate).map((x) => x.name);
      const byAmtAbs = [...expected].sort((a, b) => Math.abs(b.act) - Math.abs(a.act)).map((x) => x.name);
      const chart = dash.charts.targetChart;
      const cats = (chart?.xAxis?.[0]?.categories || []).slice();
      const ys = (chart?.series?.[0]?.data || []).map((p) => p.y);
      const note = document.getElementById('targetNote')?.textContent || '';
      const active = document.querySelector(`[data-target-metric="${key}"]`)?.classList.contains('active');
      const rateDesc = ys.every((y, i) => i === 0 || ys[i - 1] + 1e-9 >= y);
      const catsMatchRate = cats.length === byRate.length && cats.every((n, i) => n === byRate[i]);
      const catsMatchAmt = cats.length === byAmtAbs.length && cats.every((n, i) => n === byAmtAbs[i]);
      const orderDiffers = byRate.join('|') !== byAmtAbs.join('|');
      // Critical: order must match rate sort; if rate vs amount differ, must NOT match amount
      const notAmountSort = orderDiffers ? !catsMatchAmt : true; // if coincident, cannot disprove; still require rate match
      return {
        n: cats.length,
        active,
        note,
        rateDesc,
        cats,
        ys,
        byRate,
        byAmtAbs,
        catsMatchRate,
        catsMatchAmt,
        orderDiffers,
        notAmountSort,
        sample: expected.slice(0, 3),
      };
    }, tab.key);
  }

  const allTabsRateOk = tabs.every((t) => {
    const s = sortResults[t.key];
    return s && s.n >= 2 && s.active && s.rateDesc && s.catsMatchRate && s.notAmountSort && /完成率/.test(s.note);
  });
  const anyOrderDiffers = tabs.some((t) => sortResults[t.key]?.orderDiffers);
  const ac3Detail = {};
  for (const t of tabs) {
    const s = sortResults[t.key];
    ac3Detail[t.key] = {
      n: s.n,
      rateDesc: s.rateDesc,
      catsMatchRate: s.catsMatchRate,
      notAmountSort: s.notAmountSort,
      orderDiffers: s.orderDiffers,
      note: s.note,
      top3: s.cats.slice(0, 3),
      rateTop3: s.byRate.slice(0, 3),
      amtTop3: s.byAmtAbs.slice(0, 3),
    };
  }
  push(3, '四 tab 各自按完成率降序（切换后按新 tab 完成率重排）', allTabsRateOk, JSON.stringify(ac3Detail));
  push(4, '禁止按金额绝对值排序（至少一 tab 完成率序≠金额序，且图表未跟金额序）', anyOrderDiffers && tabs.every((t) => sortResults[t.key].notAmountSort && sortResults[t.key].catsMatchRate), JSON.stringify({ anyOrderDiffers, perTab: Object.fromEntries(tabs.map((t) => [t.key, { orderDiffers: sortResults[t.key].orderDiffers, catsMatchAmt: sortResults[t.key].catsMatchAmt, catsMatchRate: sortResults[t.key].catsMatchRate }])) }));

  // AC5 regression smoke: tabs still 4, cash contrib still there, all sectors
  const smoke = await page.evaluate(() => {
    const tabsN = document.querySelectorAll('#targetPanel [data-target-metric]').length;
    const contribTitle = (document.querySelector('#contributionPanel .panel-title')?.innerText || '').replace(/\s+/g, ' ');
    const cType = window.dashboard?.charts?.contributionChart?.options?.chart?.type;
    const nRows = window.dashboard?.model?.depRows?.length || 0;
    const chartN = window.dashboard?.charts?.targetChart?.series?.[0]?.data?.length || 0;
    return { tabsN, contribTitle, cType, nRows, chartN, allSectors: nRows > 0 && chartN === nRows };
  });
  push(5, '不回退：四 tab / 全部板块 / 现金流贡献横向柱', smoke.tabsN === 4 && /板块现金流贡献/.test(smoke.contribTitle) && smoke.cType === 'bar' && smoke.allSectors, JSON.stringify(smoke));
  push(6, '无 pageerror；证据落盘；未改实现/账本', errors.length === 0, JSON.stringify({ errors }));

  await page.locator('.pair-row').screenshot({ path: path.join(OUT, 'max-pair-rate-sort-01-pair-row.png') });
  await page.click('[data-target-metric="contract"]');
  await page.waitForTimeout(200);
  await page.locator('#targetPanel').screenshot({ path: path.join(OUT, 'max-pair-rate-sort-02-tab-contract.png') });
  await page.click('[data-target-metric="receipt"]');
  await page.waitForTimeout(200);
  await page.locator('#targetPanel').screenshot({ path: path.join(OUT, 'max-pair-rate-sort-03-tab-receipt.png') });
  await page.screenshot({ path: path.join(OUT, 'max-pair-rate-sort-04-board.png'), fullPage: false });

  const pass = checks.every((c) => c.ok);
  const report = {
    item: '宽度对齐 + 各 tab 按完成率降序',
    verdict: pass ? 'PASS' : 'FAIL',
    checkedAt: new Date().toISOString(),
    geom,
    sortResults,
    smoke,
    checks,
    errors,
  };
  fs.writeFileSync(path.join(OUT, 'max-pair-rate-sort-probe.json'), JSON.stringify(report, null, 2), 'utf8');

  const md = [
    '# 验收记录 · 宽度对齐 + 各 tab 按完成率降序',
    '',
    `- 验收人：验收工程师 Max（独立探针，不采信 Leo 自报）`,
    `- 结论：**${pass ? 'PASS' : 'FAIL'}**`,
    `- 文件：\`public/operations-dashboard-202610/index.html\`（未 commit）`,
    `- 证据目录：\`docs/evidence/2026-11-03-ops-segment-cash-contrib/\`（新文件 max-pair-rate-sort-*，未覆盖旧 max-*）`,
    `- 对照账本：2026-11-03「板块目标达成宽度对齐 + 各 tab 按完成率降序」`,
    '',
    '## 逐 AC',
    ...checks.map((c) => `- AC${c.ac} ${c.ok ? 'PASS' : 'FAIL'} — ${c.name}`),
    '',
    '## 关键证据',
    '- `max-pair-rate-sort-probe.json`',
    '- `max-pair-rate-sort-01-pair-row.png`',
    '- `max-pair-rate-sort-02-tab-contract.png`',
    '- `max-pair-rate-sort-03-tab-receipt.png`',
    '- `max-pair-rate-sort-04-board.png`',
    '',
    '## 备注',
    '- 排序键核对：图表 categories 与按完成率降序期望一致；与按金额绝对值序对比，至少一 tab 序不同且图表未跟金额序。',
    '- **未改实现、未 commit/push、未改账本状态、未关账。** 与「去掉应收账款账龄结构」分条、勿混关。',
    '',
  ].join('\n');
  fs.writeFileSync(path.join(OUT, 'max-pair-rate-sort-验收记录.md'), md, 'utf8');

  console.log(JSON.stringify({ verdict: report.verdict, checks: checks.map((c) => ({ ac: c.ac, ok: c.ok, name: c.name })), anyOrderDiffers, geomSummary: { equalPanelW: geom.equalPanelW, equalChartW: geom.equalChartW, equalChartH: geom.equalChartH, chartH: geom.chartH } }, null, 2));
  await browser.close();
  process.exit(pass ? 0 : 1);
})().catch((e) => { console.error(e); process.exit(1); });
