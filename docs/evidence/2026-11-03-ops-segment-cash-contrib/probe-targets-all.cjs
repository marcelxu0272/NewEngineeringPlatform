const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

(async () => {
  const outDir = 'C:/Work/2_Development/21_Platform/26_engineering-platform/docs/evidence/2026-11-03-ops-segment-cash-contrib';
  fs.mkdirSync(outDir, { recursive: true });
  const fileUrl = 'file:///C:/Work/2_Development/21_Platform/26_engineering-platform/public/operations-dashboard-202610/index.html';
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } });
  const errors = [];
  page.on('pageerror', e => errors.push(String(e)));
  await page.goto(fileUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForFunction(() => document.body.dataset.ready === 'true', { timeout: 20000 });
  await page.waitForTimeout(500);

  const depCount = await page.evaluate(() => window.dashboard.model.depRows.length);
  const tabs = ['contract','completed','invoice','receipt'];
  const perTab = {};
  for (const k of tabs) {
    await page.click(`[data-target-metric="${k}"]`);
    await page.waitForTimeout(250);
    perTab[k] = await page.evaluate(() => {
      const c = window.dashboard.charts.targetChart;
      return {
        n: c.series[0].data.length,
        cats: c.xAxis[0].categories.slice(),
        note: document.getElementById('targetNote')?.textContent || ''
      };
    });
  }

  await page.locator('#targetPanel').screenshot({ path: path.join(outDir, '04-target-all-segments.png') });

  const allFull = tabs.every(k => perTab[k].n === depCount && !/前\d/.test(perTab[k].note) && perTab[k].note.includes('全部板块'));
  const contribOk = await page.evaluate(() => {
    const c = window.dashboard.charts.contributionChart;
    return !!(c && c.series[0] && c.series[0].data.length > 0);
  });

  const probe = { depCount, perTab, allFull, contribOk, errors, pass: allFull && contribOk && errors.length === 0 };
  fs.writeFileSync(path.join(outDir, 'probe-targets-all.json'), JSON.stringify(probe, null, 2), 'utf8');
  console.log(JSON.stringify(probe, null, 2));
  await browser.close();
})().catch(e => { console.error(e); process.exit(1); });
