const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

(async () => {
  const outDir = 'C:/Work/2_Development/21_Platform/26_engineering-platform/docs/evidence/2026-11-03-ops-segment-cash-contrib';
  const fileUrl = 'file:///C:/Work/2_Development/21_Platform/26_engineering-platform/public/operations-dashboard-202610/index.html';
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } });
  const errors = [];
  page.on('pageerror', e => errors.push(String(e)));
  await page.goto(fileUrl, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => document.body.dataset.ready === 'true', { timeout: 20000 });
  await page.waitForTimeout(500);

  const dom = await page.evaluate(() => ({
    agingTitle: !!Array.from(document.querySelectorAll('*')).find(el => (el.childNodes.length && Array.from(el.childNodes).some(n => n.nodeType===3 && n.textContent.includes('应收账款账龄结构')))),
    agingChart: !!document.getElementById('agingChart'),
    agingLegend: !!document.getElementById('agingLegend'),
    riskMetrics: document.querySelectorAll('#riskMetrics .risk-metric').length,
    contrib: !!document.getElementById('contributionChart'),
    contribTitle: (document.querySelector('#contributionPanel .panel-title')?.innerText || '').replace(/\s+/g,' '),
    openAging: typeof window.openAging,
  }));

  const layout = await page.evaluate(() => {
    const c = document.getElementById('contributionPanel').getBoundingClientRect();
    const t = document.getElementById('targetPanel').getBoundingClientRect();
    return { cw: +c.width.toFixed(2), tw: +t.width.toFixed(2), equal: Math.abs(c.width-t.width)<0.5 };
  });

  const tabs = ['contract','completed','invoice','receipt'];
  const sorts = {};
  for (const k of tabs) {
    await page.click(`[data-target-metric="${k}"]`);
    await page.waitForTimeout(180);
    sorts[k] = await page.evaluate(() => {
      const ys = window.dashboard.charts.targetChart.series[0].data.map(p => p.y);
      return { n: ys.length, desc: ys.every((y,i)=> i===0 || ys[i-1]+1e-9 >= y), note: document.getElementById('targetNote')?.textContent || '' };
    });
  }

  await page.locator('#riskPanel').screenshot({ path: path.join(outDir, '07-risk-no-aging.png') });
  await page.locator('.pair-row').screenshot({ path: path.join(outDir, '08-pair-after-aging-removal.png') });

  const pass = !dom.agingTitle && !dom.agingChart && !dom.agingLegend && dom.riskMetrics === 4 &&
    dom.contrib && dom.contribTitle.includes('板块现金流贡献') &&
    layout.equal && tabs.every(k => sorts[k].n===10 && sorts[k].desc && sorts[k].note.includes('完成率')) &&
    errors.length === 0;

  const out = { pass, dom, layout, sorts, errors };
  fs.writeFileSync(path.join(outDir, 'probe-no-aging-rate-sort.json'), JSON.stringify(out, null, 2), 'utf8');
  console.log(JSON.stringify(out, null, 2));
  await browser.close();
  if (!pass) process.exit(1);
})().catch(e => { console.error(e); process.exit(1); });
