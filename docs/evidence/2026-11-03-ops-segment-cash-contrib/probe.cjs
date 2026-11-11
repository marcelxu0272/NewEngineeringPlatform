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
  await page.waitForTimeout(800);

  const title = await page.locator('#contributionPanel .panel-title').innerText();
  const hasChart = await page.locator('#contributionChart').count();
  const hasTable = await page.locator('#contributionTable').count();
  const hasMix = await page.locator('#mixChart').count();
  const infoBtn = await page.locator('#contributionPanel .info-button').count();
  const targetTabs = await page.locator('[data-target-metric]').evaluateAll(els => els.map(e => ({k: e.dataset.targetMetric, t: e.textContent.trim(), active: e.classList.contains('active')})));

  // capture chart series colors/signs
  const contrib = await page.evaluate(() => {
    const c = window.dashboard?.charts?.contributionChart;
    if (!c) return null;
    const pts = c.series[0].data.map(p => ({ name: p.category || p.name, y: p.y, color: p.color }));
    const sorted = pts.every((p,i,a) => i===0 || a[i-1].y >= p.y);
    return { n: pts.length, sortedDesc: sorted, pts: pts.slice(0, 12), hasNeg: pts.some(p => p.y < 0), hasPos: pts.some(p => p.y >= 0) };
  });

  // click completed tab — should only change target chart, not contribution
  const beforeContrib = await page.evaluate(() => window.dashboard.charts.contributionChart.series[0].data.map(p => p.y).join(','));
  await page.click('[data-target-metric="completed"]');
  await page.waitForTimeout(400);
  const afterTabs = await page.locator('[data-target-metric]').evaluateAll(els => els.map(e => ({k: e.dataset.targetMetric, active: e.classList.contains('active')})));
  const afterContrib = await page.evaluate(() => window.dashboard.charts.contributionChart.series[0].data.map(p => p.y).join(','));
  const targetNote = await page.locator('#targetNote').innerText();
  const targetSeriesName = await page.evaluate(() => {
    const tip = window.dashboard.charts.targetChart?.series?.[0];
    // read note and first point tooltip context via options
    return { note: document.getElementById('targetNote')?.textContent, n: tip?.data?.length };
  });

  await page.locator('#contributionPanel').screenshot({ path: path.join(outDir, '01-segment-cash-contrib.png') });
  await page.locator('#targetPanel').screenshot({ path: path.join(outDir, '02-target-tabs.png') });
  await page.screenshot({ path: path.join(outDir, '03-full-board.png'), fullPage: false });

  const probe = {
    title: title.replace(/\s+/g,' ').trim(),
    hasChart, hasTable, hasMix, infoBtn,
    targetTabs, afterTabs,
    contribUnchangedOnTargetTab: beforeContrib === afterContrib,
    contrib, targetNote, targetSeriesName, errors,
    pass: hasChart===1 && hasTable===0 && hasMix===0 && infoBtn===1 &&
      title.includes('板块现金流贡献') &&
      targetTabs.map(t=>t.k).join(',') === 'contract,completed,invoice,receipt' &&
      afterTabs.find(t=>t.k==='completed')?.active === true &&
      beforeContrib === afterContrib &&
      contrib?.sortedDesc === true && contrib?.hasNeg === true && contrib?.hasPos === true &&
      errors.length === 0
  };
  fs.writeFileSync(path.join(outDir, 'probe.json'), JSON.stringify(probe, null, 2), 'utf8');
  console.log(JSON.stringify(probe, null, 2));
  await browser.close();
})().catch(e => { console.error(e); process.exit(1); });
