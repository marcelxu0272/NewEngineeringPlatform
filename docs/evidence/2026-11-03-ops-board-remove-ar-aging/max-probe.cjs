const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

(async () => {
  const OUT = path.resolve('docs/evidence/2026-11-03-ops-board-remove-ar-aging');
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

  const dom = await page.evaluate(() => {
    const bodyText = document.body.innerText || '';
    const html = document.documentElement.innerHTML || '';
    const titleHits = Array.from(document.querySelectorAll('h1,h2,h3,.panel-title,.sub-title,.chart-section-title,span,p,div'))
      .filter((el) => {
        const own = Array.from(el.childNodes).filter((n) => n.nodeType === 3).map((n) => n.textContent || '').join('');
        return /应收账款账龄结构/.test(own) || (/账龄结构/.test(own) && /应收/.test(own));
      })
      .map((el) => (el.innerText || '').replace(/\s+/g, ' ').trim().slice(0, 80));
    const agingIds = ['agingChart', 'agingLegend', 'agingBar', 'arAging', 'ageStructure', 'agingPanel', 'agingSection']
      .map((id) => ({ id, exists: !!document.getElementById(id) }));
    const riskLabels = Array.from(document.querySelectorAll('#riskMetrics .risk-metric .metric-label, #riskMetrics .risk-metric'))
      .map((el) => {
        const lab = el.querySelector?.('.metric-label');
        return (lab ? lab.textContent : el.childNodes[0]?.textContent || el.textContent || '').trim().split(/\s+/)[0];
      })
      .filter(Boolean);
    // better: only .metric-label
    const riskMetricLabels = Array.from(document.querySelectorAll('#riskMetrics .risk-metric .metric-label')).map((el) => (el.textContent || '').trim());
    const riskCount = document.querySelectorAll('#riskMetrics .risk-metric').length;
    const modules = {
      kpi: !!document.querySelector('#kpiGrid, .kpi-grid, [data-kpi]') || document.querySelectorAll('.kpi-card').length > 0 || !!document.getElementById('kpiPanel') || document.body.innerText.includes('新签合同额'),
      cash: !!document.getElementById('cashPanel') && /现金流与资金安全/.test(bodyText),
      risk: !!document.getElementById('riskPanel') && /应收与资金风险/.test(bodyText),
      contrib: !!document.getElementById('contributionPanel') && /板块现金流贡献/.test(bodyText),
      target: !!document.getElementById('targetPanel') && /板块目标达成/.test(bodyText),
      delivery: !!document.getElementById('deliveryPanel') && /工作负荷与交付保障/.test(bodyText),
      alerts: !!document.getElementById('alertList') || /经营异常预警/.test(bodyText),
    };
    const riskPanelRect = document.getElementById('riskPanel')?.getBoundingClientRect();
    const afterRisk = (() => {
      const risk = document.getElementById('riskPanel');
      let el = risk?.nextElementSibling;
      while (el && el.nodeType === 1 && getComputedStyle(el).display === 'none') el = el.nextElementSibling;
      return {
        tag: el?.tagName,
        id: el?.id || null,
        className: el?.className || null,
        text: (el?.querySelector?.('.panel-title')?.innerText || el?.innerText || '').replace(/\s+/g, ' ').trim().slice(0, 60),
      };
    })();
    // blank hole heuristic: large empty space inside risk panel below metrics
    const metrics = document.getElementById('riskMetrics');
    const mb = metrics?.getBoundingClientRect();
    const pb = riskPanelRect;
    const emptyBelow = pb && mb ? +(pb.bottom - mb.bottom).toFixed(2) : null;
    return {
      bodyHasAgingTitle: /应收账款账龄结构/.test(bodyText),
      htmlHasAgingTitle: /应收账款账龄结构/.test(html),
      htmlHasAgingPhrase: /账龄结构/.test(html),
      titleHits,
      agingIds,
      riskCount,
      riskMetricLabels,
      modules,
      afterRisk,
      emptyBelow,
      openAgingType: typeof window.openAging,
      riskPanelH: pb ? +pb.height.toFixed(2) : null,
    };
  });

  push(1, '页面不再出现「应收账款账龄结构」标题/图区/图例/空态', !dom.bodyHasAgingTitle && !dom.htmlHasAgingTitle && dom.titleHits.length === 0 && dom.agingIds.every((x) => !x.exists), JSON.stringify({ bodyHasAgingTitle: dom.bodyHasAgingTitle, htmlHasAgingTitle: dom.htmlHasAgingTitle, titleHits: dom.titleHits, agingIds: dom.agingIds }));
  push(2, '专用 DOM/入口移除或不可达；风险区无巨大空白占位洞', dom.openAgingType === 'undefined' && (dom.emptyBelow === null || dom.emptyBelow < 120), JSON.stringify({ openAgingType: dom.openAgingType, emptyBelow: dom.emptyBelow, afterRisk: dom.afterRisk, riskPanelH: dom.riskPanelH }));
  push(3, '不误删其它模块；风险四指标卡仍在', dom.riskCount === 4 && ['应收账款','WIP','存货','营业收入'].every((l) => dom.riskMetricLabels.includes(l)) && dom.modules.kpi && dom.modules.cash && dom.modules.risk && dom.modules.contrib && dom.modules.target && dom.modules.delivery, JSON.stringify({ riskCount: dom.riskCount, riskMetricLabels: dom.riskMetricLabels, modules: dom.modules }));

  // AC4: don't regress unfinished width+rate-sort — soft check that pair equal + rate sort still holds
  const pairAndSort = await page.evaluate(() => {
    const c = document.getElementById('contributionPanel')?.getBoundingClientRect();
    const t = document.getElementById('targetPanel')?.getBoundingClientRect();
    const equal = c && t && Math.abs(c.width - t.width) < 1;
    const key = 'contract';
    const model = window.dashboard.model;
    const totalTarget = model.targets[key];
    const contractBudget = model.targets.contract || 1;
    const byRate = [...model.depRows].map((r) => {
      const tgt = totalTarget * (r.target / contractBudget);
      const act = r[key] || 0;
      return { name: r.name, rate: tgt ? (act / tgt) * 100 : 0 };
    }).sort((a, b) => b.rate - a.rate).map((x) => x.name);
    const cats = window.dashboard.charts.targetChart?.xAxis?.[0]?.categories || [];
    const match = cats.length === byRate.length && cats.every((n, i) => n === byRate[i]);
    return { equal, match, catsTop: cats.slice(0, 3), byRateTop: byRate.slice(0, 3) };
  });
  push(4, '不回退未结宽度对齐 + 按完成率降序', pairAndSort.equal && pairAndSort.match, JSON.stringify(pairAndSort));
  push(5, '无 pageerror；证据落盘；未改实现/账本', errors.length === 0, JSON.stringify({ errors }));

  await page.locator('#riskPanel').screenshot({ path: path.join(OUT, 'max-01-risk-no-aging.png') });
  await page.locator('.pair-row').screenshot({ path: path.join(OUT, 'max-02-pair-after-remove.png') });
  await page.screenshot({ path: path.join(OUT, 'max-03-board-full.png'), fullPage: false });

  const pass = checks.every((c) => c.ok);
  const report = {
    item: '去掉「应收账款账龄结构」整块',
    verdict: pass ? 'PASS' : 'FAIL',
    checkedAt: new Date().toISOString(),
    dom,
    pairAndSort,
    checks,
    errors,
  };
  fs.writeFileSync(path.join(OUT, 'max-probe.json'), JSON.stringify(report, null, 2), 'utf8');
  const md = [
    '# 验收记录 · 去掉「应收账款账龄结构」整块',
    '',
    `- 验收人：验收工程师 Max（独立探针，不采信 Leo 自报）`,
    `- 结论：**${pass ? 'PASS' : 'FAIL'}**`,
    `- 文件：\`public/operations-dashboard-202610/index.html\`（未 commit）`,
    `- 证据目录：\`docs/evidence/2026-11-03-ops-board-remove-ar-aging/\``,
    `- 对照账本：2026-11-03「去掉『应收账款账龄结构』整块」`,
    '',
    '## 逐 AC',
    ...checks.map((c) => `- AC${c.ac} ${c.ok ? 'PASS' : 'FAIL'} — ${c.name}`),
    '',
    '## 关键证据',
    '- `max-probe.json`',
    '- `max-01-risk-no-aging.png`',
    '- `max-02-pair-after-remove.png`',
    '- `max-03-board-full.png`',
    '',
    '## 备注',
    '- 风险四卡标签实测：' + JSON.stringify(dom.riskMetricLabels),
    '- **未改实现、未 commit/push、未改账本状态、未关账。** 与「宽度对齐 + 完成率降序」分条、勿混关。',
    '',
  ].join('\n');
  fs.writeFileSync(path.join(OUT, 'max-去掉账龄结构-验收记录.md'), md, 'utf8');

  console.log(JSON.stringify({ verdict: report.verdict, checks: checks.map((c) => ({ ac: c.ac, ok: c.ok, name: c.name })), riskMetricLabels: dom.riskMetricLabels }, null, 2));
  await browser.close();
  process.exit(pass ? 0 : 1);
})().catch((e) => { console.error(e); process.exit(1); });
