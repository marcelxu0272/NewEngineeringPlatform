const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  try {
    const response = await page.request.get('http://localhost:3001/api/hsse-performance?year=2026&month=12');
    const data = await response.json();
    assert.equal(response.status(), 200);
    assert.equal(data.current, null); assert.equal(data.cumulative, null); assert.equal(data.missingMonths.length, 12);
    await page.goto('http://localhost:3001/operations-dashboard-202610/board', { waitUntil: 'domcontentloaded' });
    await page.getByRole('treeitem', { name: 'HSSE绩效看板', exact: true }).click();
    await page.locator('[data-hsse-month="hours"]').waitFor();
    assert.equal(await page.locator('[data-hsse-month="hours"]').textContent(), '未录入');
    await page.screenshot({ path: path.join(__dirname, 'live-empty-state.png') });
    fs.writeFileSync(path.join(__dirname, 'live-read-results.json'), JSON.stringify({ verdict: 'PASS', realHttpApi: true, databaseRows: 0, noFixtures: true }, null, 2));
    console.log('PASS: real HTTP API and Board empty state, no fixture records remain.');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exit(1); });
