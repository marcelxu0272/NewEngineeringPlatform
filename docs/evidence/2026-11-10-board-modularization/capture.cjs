const { chromium } = require('playwright');
const fs = require('node:fs');
const path = require('node:path');
(async () => {
  const mode = process.argv[2] || 'baseline';
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const errors = [], failed = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('response', response => { if (response.status() >= 400 && response.url().includes('/operations-dashboard-202610/')) failed.push({ url: response.url(), status: response.status() }); });
  const snapshots = {};
  try {
    await page.goto('http://localhost:3001/operations-dashboard-202610/board', { waitUntil: 'networkidle', timeout: 120000 });
    for (const [id, title] of [['current', '运营看板'], ['completed-contract', '完成合同额看板'], ['timesheet', '工时看板'], ['hr', '人力资源看板'], ['market', '市场数据'], ['hsse', 'HSSE绩效看板']]) {
      await page.getByRole('treeitem', { name: title, exact: true }).click();
      await page.screenshot({ path: path.join(__dirname, `${mode}-${id}.png`) });
      if (['current', 'completed-contract', 'timesheet', 'hr'].includes(id)) {
        const frame = page.frames().find(frame => frame.url().endsWith('/' + ({ current: 'index.html', 'completed-contract': 'completed-contract.html', timesheet: 'timesheet.html', hr: 'hr.html' })[id]));
        snapshots[id] = await frame.evaluate(() => ({
          text: document.body.innerText.replace(/\s+/g, ' ').trim(),
          model: window.dashboard ? { totals: window.dashboard.model.totals, wip: window.dashboard.model.wip, receivables: window.dashboard.model.receivables } : null,
          chartCount: document.querySelectorAll('.highcharts-container,[_echarts_instance_]').length,
        }));
      }
    }
    fs.writeFileSync(path.join(__dirname, `${mode}.json`), JSON.stringify({ snapshots, errors, failed }, null, 2));
    console.log(JSON.stringify({ mode, errors, failed, charts: Object.fromEntries(Object.entries(snapshots).map(([key, value]) => [key, value.chartCount])) }));
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
