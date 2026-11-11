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
  page.on('pageerror', e => errors.push(String(e)));
  await page.goto(fileUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForFunction(() => document.body.dataset.ready === 'true', { timeout: 25000 });
  await page.waitForTimeout(800);

  const geom = await page.evaluate(() => {
    const cChart = document.getElementById('contributionChart');
    const tChart = document.getElementById('targetChart');
    const ccb = cChart.getBoundingClientRect();
    const tcb = tChart.getBoundingClientRect();
    const cs = getComputedStyle(cChart);
    const ts = getComputedStyle(tChart);
    const cb = document.getElementById('contributionPanel').getBoundingClientRect();
    const tb = document.getElementById('targetPanel').getBoundingClientRect();
    return {
      chartH: { c: +ccb.height.toFixed(2), t: +tcb.height.toFixed(2), diff: +(Math.abs(ccb.height - tcb.height)).toFixed(2) },
      chartW: { c: +ccb.width.toFixed(2), t: +tcb.width.toFixed(2) },
      clientH: { c: cChart.clientHeight, t: tChart.clientHeight },
      css: {
        c: { h: cs.height, min: cs.minHeight, max: cs.maxHeight, flex: cs.flex, grow: cs.flexGrow },
        t: { h: ts.height, min: ts.minHeight, max: ts.maxHeight, flex: ts.flex, grow: ts.flexGrow },
      },
      panelW: { c: +cb.width.toFixed(2), t: +tb.width.toFixed(2) },
      agingGone: !document.getElementById('agingChart') && !document.body.innerText.includes('应收账款账龄结构'),
    };
  });

  // rate sort spot-check
  const sorts = {};
  for (const k of ['contract','completed','invoice','receipt']) {
    await page.click(`[data-target-metric="${k}"]`);
    await page.waitForTimeout(200);
    sorts[k] = await page.evaluate(() => {
      const ys = window.dashboard.charts.targetChart.series[0].data.map(p => p.y);
      return { n: ys.length, desc: ys.every((y,i)=>i===0||ys[i-1]+1e-9>=y) };
    });
  }

  // re-measure height after tab switches (Highcharts may resize)
  const geom2 = await page.evaluate(() => {
    const c = document.getElementById('contributionChart');
    const t = document.getElementById('targetChart');
    return { c: c.clientHeight, t: t.clientHeight, diff: Math.abs(c.clientHeight - t.clientHeight) };
  });

  await page.locator('.pair-row').screenshot({ path: path.join(OUT, '09-pair-chart-height-lock.png') });

  const pass = geom.chartH.diff < 1 && geom2.diff < 1 &&
    Math.abs(geom.panelW.c - geom.panelW.t) < 1 &&
    geom.agingGone &&
    Object.values(sorts).every(s => s.n===10 && s.desc) &&
    errors.length === 0;

  const out = { pass, geom, geomAfterTabs: geom2, sorts, errors };
  fs.writeFileSync(path.join(OUT, 'probe-chart-height-lock.json'), JSON.stringify(out, null, 2), 'utf8');
  console.log(JSON.stringify(out, null, 2));
  await browser.close();
  if (!pass) process.exit(1);
})().catch(e => { console.error(e); process.exit(1); });
