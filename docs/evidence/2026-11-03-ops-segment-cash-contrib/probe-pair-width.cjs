const { chromium } = require('playwright');
(async () => {
  const fileUrl = 'file:///C:/Work/2_Development/21_Platform/26_engineering-platform/public/operations-dashboard-202610/index.html';
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } });
  await page.goto(fileUrl, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => document.body.dataset.ready === 'true');
  await page.waitForTimeout(400);
  const info = await page.evaluate(() => {
    const pair = document.querySelector('.pair-row');
    const c = document.getElementById('contributionPanel');
    const t = document.getElementById('targetPanel');
    const cs = getComputedStyle(pair);
    const box = (el) => {
      const r = el.getBoundingClientRect();
      const s = getComputedStyle(el);
      return { w: Math.round(r.width*100)/100, h: Math.round(r.height*100)/100, left: Math.round(r.left*100)/100, minW: s.minWidth, maxW: s.maxWidth, width: s.width, flex: s.flex, gridColumn: s.gridColumn };
    };
    return {
      pairCols: cs.gridTemplateColumns,
      pairDisplay: cs.display,
      pairW: pair.getBoundingClientRect().width,
      contrib: box(c),
      target: box(t),
      chartC: box(document.getElementById('contributionChart')),
      chartT: box(document.getElementById('targetChart')),
    };
  });
  console.log(JSON.stringify(info, null, 2));
  await browser.close();
})().catch(e => { console.error(e); process.exit(1); });
