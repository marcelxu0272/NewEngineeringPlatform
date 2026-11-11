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
  await page.waitForFunction(() => document.body.dataset.ready === 'true');
  await page.waitForTimeout(400);

  const layout = await page.evaluate(() => {
    const c = document.getElementById('contributionPanel').getBoundingClientRect();
    const t = document.getElementById('targetPanel').getBoundingClientRect();
    const cc = document.getElementById('contributionChart').getBoundingClientRect();
    const tc = document.getElementById('targetChart').getBoundingClientRect();
    return {
      pairCols: getComputedStyle(document.querySelector('.pair-row')).gridTemplateColumns,
      cw: +c.width.toFixed(2), tw: +t.width.toFixed(2),
      ccw: +cc.width.toFixed(2), tcw: +tc.width.toFixed(2),
      cch: +cc.height.toFixed(2), tch: +tc.height.toFixed(2),
    };
  });

  const tabs = ['contract','completed','invoice','receipt'];
  const perTab = {};
  for (const k of tabs) {
    await page.click(`[data-target-metric="${k}"]`);
    await page.waitForTimeout(220);
    perTab[k] = await page.evaluate((key) => {
      const totalTarget = window.dashboard.model.targets[key];
      const contractBudget = window.dashboard.model.targets.contract || 1;
      const expected = window.dashboard.model.depRows.map(r => {
        const tgt = totalTarget * (r.target / contractBudget);
        const act = r[key] || 0;
        const rate = tgt ? act / tgt * 100 : 0;
        return { name: r.name, rate };
      }).sort((a,b) => b.rate - a.rate);
      const cats = window.dashboard.charts.targetChart.xAxis[0].categories.slice();
      const ys = window.dashboard.charts.targetChart.series[0].data.map(p => +p.y.toFixed(4));
      const expectedRates = expected.map(e => +e.rate.toFixed(4));
      const sortedByRate = ys.every((y,i) => i === 0 || ys[i-1] + 1e-6 >= y);
      const catsMatch = cats.every((n,i) => n === expected[i].name);
      const ratesMatch = ys.every((y,i) => Math.abs(y - expectedRates[i]) < 0.05);
      const note = document.getElementById('targetNote')?.textContent || '';
      return { n: cats.length, cats, ys, sortedByRate, catsMatch, ratesMatch, noteHasRate: note.includes('完成率'), top3: cats.slice(0,3).map((n,i)=>({n, rate: ys[i]})) };
    }, k);
  }

  await page.locator('.pair-row').screenshot({ path: path.join(outDir, '06-target-sort-by-rate.png') });

  const widthOk = Math.abs(layout.cw - layout.tw) < 0.5 && Math.abs(layout.ccw - layout.tcw) < 0.5;
  const sortOk = tabs.every(k => perTab[k].sortedByRate && perTab[k].catsMatch && perTab[k].ratesMatch && perTab[k].n === 10 && perTab[k].noteHasRate);
  const pass = widthOk && sortOk && errors.length === 0;
  const out = { pass, widthOk, sortOk, layout, perTab, errors };
  fs.writeFileSync(path.join(outDir, 'probe-sort-by-rate.json'), JSON.stringify(out, null, 2), 'utf8');
  console.log(JSON.stringify(out, null, 2));
  await browser.close();
  if (!pass) process.exit(1);
})().catch(e => { console.error(e); process.exit(1); });
