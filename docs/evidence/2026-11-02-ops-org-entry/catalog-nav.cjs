const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ headless: true });
  const p = await b.newPage({ viewport: { width: 1600, height: 1000 } });
  await p.goto('http://localhost:3000/', { waitUntil: 'networkidle' });
  await p.waitForTimeout(800);
  await p.evaluate(() => {
    const a = document.querySelector('a[href="/operations-dashboard-202610"]');
    if (a) location.href = a.href;
  });
  await p.waitForTimeout(2000);
  console.log('url', p.url());
  const src = await p.evaluate(() => document.querySelector('iframe')?.getAttribute('src'));
  console.log('iframe', src);
  await p.screenshot({ path: 'docs/evidence/2026-11-02-ops-org-entry/05-catalog-to-entry.png' });
  await b.close();
})();
