const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const checks = [];
const errors = [];
function check(name, ok, details) { assert.ok(ok, `${name}: ${JSON.stringify(details)}`); checks.push({ name, details }); }
async function choose(page, label, option) {
  const combo = page.getByRole('combobox', { name: label, exact: true });
  await page.locator('.ant-select').filter({ has: combo }).locator('.ant-select-selector').click();
  for (let i = 0; i < 20; i++) {
    await page.waitForTimeout(35);
    const id = await combo.getAttribute('aria-activedescendant');
    if (id && await page.locator(`[id="${id}"]`).getAttribute('aria-label') === option) { await combo.press('Enter'); return; }
    await combo.press('ArrowDown');
  }
  throw new Error(`Option not found: ${option}`);
}
(async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
    page.on('pageerror', e => errors.push(String(e)));
    const base = process.env.TIMESHEET_BASE_URL || 'http://localhost:3001';
    await page.goto(`${base}/operations-dashboard-202610/board?unit=${encodeURIComponent('SAS680 数字技术板块')}`, { waitUntil: 'networkidle' });
    await choose(page, '主题颜色', '暖棕主题');
    await page.getByRole('treeitem', { name: '工时看板', exact: true }).click();
    const frame = page.frames().find(f => f.url().endsWith('/timesheet.html'));
    await frame.waitForFunction(() => window.timesheetDashboard?.state.effectiveUnit === 'SAS680 数字技术板块' && window.timesheetDashboard.state.theme === 'wood');
    check('带组织参数首次进入接收最新筛选和主题', true);
    await page.getByRole('treeitem', { name: 'WIP 账龄分析', exact: true }).click();
    await choose(page, '组织板块', 'SAS610 咨询板块');
    await choose(page, '主题颜色', '青绿主题');
    await page.getByRole('treeitem', { name: '工时看板', exact: true }).click();
    await frame.waitForFunction(() => window.timesheetDashboard.state.effectiveUnit === 'SAS610 咨询板块' && window.timesheetDashboard.state.theme === 'teal');
    check('隐藏时变更组织主题再返回同步', true);
    for (const width of [1440, 1280]) {
      await page.setViewportSize({ width, height: width === 1440 ? 1000 : 720 });
      await frame.waitForTimeout(200);
      const clipped = await frame.evaluate(() => [...document.querySelectorAll('.mini-chart,.trend-chart,.forecast-chart,.personnel-chart')].flatMap(host => {
        if (host.hidden) return [];
        const rect = host.getBoundingClientRect();
        return [...host.querySelectorAll('svg text')].filter(el => {
          const r = el.getBoundingClientRect();
          return r.width > 0 && (r.left < rect.left - 1 || r.right > rect.right + 1 || r.top < rect.top - 1 || r.bottom > rect.bottom + 1);
        }).map(el => ({ chart: host.id, text: el.textContent }));
      }));
      check(`图表轴签和数据标签不越界 ${width}`, clipped.length === 0, clipped);
    }
    await choose(page, '主题颜色', '深蓝主题');
    await frame.evaluate(() => scrollTo(0, document.documentElement.scrollHeight));
    await frame.waitForTimeout(100);
    const tbd = await frame.locator('#tbdHours').boundingBox();
    const bounds = await page.locator('iframe[src$="timesheet.html"]').boundingBox();
    check('滚动到底可完整看到 TBD 与底部说明', tbd && tbd.y >= bounds.y && tbd.y + tbd.height <= bounds.y + bounds.height + 1, { tbd, bounds });
    await page.screenshot({ path: path.join(__dirname, 'board-1280-footer.png') });
    check('补充场景无浏览器错误', errors.length === 0, errors);
    fs.writeFileSync(path.join(__dirname, 'lifecycle.json'), JSON.stringify({ result: 'PASS', checks, errors }, null, 2));
    console.log(JSON.stringify({ result: 'PASS', checks: checks.length, errors }, null, 2));
  } finally { await browser.close(); }
})().catch(e => { fs.writeFileSync(path.join(__dirname, 'lifecycle.json'), JSON.stringify({ result: 'FAIL', error: e.stack, checks, errors }, null, 2)); console.error(e); process.exitCode = 1; });
