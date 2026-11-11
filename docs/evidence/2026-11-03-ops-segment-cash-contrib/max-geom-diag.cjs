const { chromium } = require('playwright');
(async () => {
  const fileUrl = 'file:///C:/Work/2_Development/21_Platform/26_engineering-platform/public/operations-dashboard-202610/index.html';
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1600, height: 1100 } });
  await page.goto(fileUrl, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => document.body.dataset.ready === 'true', { timeout: 25000 });
  await page.waitForTimeout(800);
  const info = await page.evaluate(() => {
    const detail = (sel) => {
      const el = document.querySelector(sel);
      if (!el) return null;
      const r = el.getBoundingClientRect();
      const s = getComputedStyle(el);
      return {
        sel,
        w: +r.width.toFixed(2), h: +r.height.toFixed(2),
        cssH: s.height, cssMinH: s.minHeight, cssMaxH: s.maxHeight,
        box: s.boxSizing, overflow: s.overflow,
        clientH: el.clientHeight, offsetH: el.offsetHeight,
        child0: el.firstElementChild ? { tag: el.firstElementChild.tagName, h: +el.firstElementChild.getBoundingClientRect().height.toFixed(2) } : null,
      };
    };
    return {
      contributionChart: detail('#contributionChart'),
      targetChart: detail('#targetChart'),
      contributionPanel: detail('#contributionPanel'),
      targetPanel: detail('#targetPanel'),
      hcC: detail('#contributionChart .highcharts-container'),
      hcT: detail('#targetChart .highcharts-container'),
    };
  });
  console.log(JSON.stringify(info, null, 2));
  await browser.close();
})().catch(e => { console.error(e); process.exit(1); });
