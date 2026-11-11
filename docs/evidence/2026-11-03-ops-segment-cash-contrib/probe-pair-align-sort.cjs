const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

(async () => {
  const outDir = 'C:/Work/2_Development/21_Platform/26_engineering-platform/docs/evidence/2026-11-03-ops-segment-cash-contrib';
  fs.mkdirSync(outDir, { recursive: true });
  const fileUrl = 'file:///C:/Work/2_Development/21_Platform/26_engineering-platform/public/operations-dashboard-202610/index.html';
  const browser = await chromium.launch({ headless: true });
  const results = {};
  for (const width of [1600, 1360, 1280]) {
    const page = await browser.newPage({ viewport: { width, height: 1000 } });
    const errors = [];
    page.on('pageerror', e => errors.push(String(e)));
    await page.goto(fileUrl, { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => document.body.dataset.ready === 'true');
    await page.waitForTimeout(400);

    const layout = await page.evaluate(() => {
      const pair = document.querySelector('.pair-row');
      const c = document.getElementById('contributionPanel');
      const t = document.getElementById('targetPanel');
      const cs = getComputedStyle(pair);
      const box = el => {
        const r = el.getBoundingClientRect();
        return { w: +r.width.toFixed(2), h: +r.height.toFixed(2) };
      };
      return {
        cols: cs.gridTemplateColumns,
        contrib: box(c),
        target: box(t),
        chartC: box(document.getElementById('contributionChart')),
        chartT: box(document.getElementById('targetChart')),
      };
    });

    const tabs = ['contract','completed','invoice','receipt'];
    const sorts = {};
    for (const k of tabs) {
      await page.click(`[data-target-metric="${k}"]`);
      await page.waitForTimeout(200);
      sorts[k] = await page.evaluate((key) => {
        const cats = window.dashboard.charts.targetChart.xAxis[0].categories.slice();
        const vals = window.dashboard.model.depRows
          .slice()
          .sort((a,b)=>(b[key]||0)-(a[key]||0))
          .map(r => r.name);
        const chartYs = window.dashboard.charts.targetChart.series[0].data.map(p => p.y);
        const metricOrder = cats;
        const expected = vals;
        const sortedByMetric = metricOrder.every((n,i) => n === expected[i]);
        // rates themselves should also be descending? not required — order is by metric amount
        return { n: cats.length, cats, expected, sortedByMetric, chartYs };
      }, k);
    }

    const widthEqual = Math.abs(layout.contrib.w - layout.target.w) < 0.5;
    const chartWEqual = Math.abs(layout.chartC.w - layout.chartT.w) < 0.5;
    const chartHEqual = Math.abs(layout.chartC.h - layout.chartT.h) < 0.5;
    const allSorted = tabs.every(k => sorts[k].sortedByMetric && sorts[k].n === 10);

    if (width === 1600) {
      await page.locator('.pair-row').screenshot({ path: path.join(outDir, '05-pair-width-align.png') });
    }

    results[width] = {
      layout, widthEqual, chartWEqual, chartHEqual, allSorted,
      sortSample: Object.fromEntries(tabs.map(k => [k, sorts[k].cats.slice(0,3)])),
      errors, pass: widthEqual && chartWEqual && allSorted && errors.length === 0
    };
    await page.close();
  }

  const pass = Object.values(results).every(r => r.pass);
  const out = { pass, results };
  fs.writeFileSync(path.join(outDir, 'probe-pair-align-sort.json'), JSON.stringify(out, null, 2), 'utf8');
  console.log(JSON.stringify(out, null, 2));
  await browser.close();
  if (!pass) process.exit(1);
})().catch(e => { console.error(e); process.exit(1); });
