const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const out = __dirname;
  const records = new Map();
  const keys = ['f', 'lti', 'rwc', 'mtc', 'fac', 'hipo', 'property', 'environment', 'nearMiss', 'bbso', 'hours'];
  const zero = Object.fromEntries(keys.map(k => [k, 0]));
  records.set(1, { ...zero, fac: 1, nearMiss: 1, bbso: 2584, hours: 2360000 });
  records.set(9, { ...zero, bbso: 209, hours: 280000 });
  let failSave = false, failRead = false, checks = 0, puts = 0;
  const errors = [];
  const check = v => { assert.ok(v); checks++; };
  async function setup(context) {
    await context.route('**/api/hsse-performance**', async route => {
      const req = route.request();
      if (req.method() === 'PUT') {
        puts++;
        if (failSave) return route.fulfill({ status: 500, json: { error: '保存失败，输入已保留，请重试' } });
        const body = req.postDataJSON(); records.set(body.month, body.values);
      } else if (failRead) return route.fulfill({ status: 500, json: { error: '数据加载失败，请重试' } });
      const month = req.method() === 'PUT' ? req.postDataJSON().month : Number(new URL(req.url()).searchParams.get('month'));
      const months = [...records.keys()].filter(m => m <= month);
      const cumulative = months.length ? Object.fromEntries(keys.map(k => [k, months.reduce((n, m) => n + records.get(m)[k], 0)])) : null;
      return route.fulfill({ json: { year: 2026, month, current: records.has(month) ? { ...records.get(month), year: 2026, month } : null,
        cumulative, missingMonths: Array.from({ length: month }, (_, i) => i + 1).filter(m => !records.has(m)) } });
    });
  }
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  await setup(context);
  const page = await context.newPage(); page.setDefaultTimeout(12000);
  page.on('pageerror', e => errors.push(e.message));
  await page.goto('http://localhost:3001/operations-dashboard-202610/board', { waitUntil: 'networkidle', timeout: 90000 });
  const tree = page.getByRole('tree');
  const hsse = tree.getByRole('treeitem', { name: 'HSSE绩效看板', exact: true });
  await hsse.waitFor();
  const labels = await tree.getByRole('treeitem').allTextContents();
  check(labels.findIndex(s => s.includes('HSSE绩效看板')) === labels.findIndex(s => s.includes('完成合同额看板')) + 1);
  await hsse.click();
  const board = page.getByRole('region', { name: 'HSSE绩效看板', exact: true });
  const monthSelect = page.getByRole('combobox', { name: 'HSSE统计月份' });
  async function month(m) {
    await monthSelect.press('Enter');
    await page.getByTitle(`2026年${m}月`, { exact: true }).click();
    await board.locator('svg[role=img]').waitFor();
  }
  await month(9);
  check(await board.locator('[data-hsse-layer]').count() === 11);
  check(await board.locator('[data-hsse-month="bbso"]').textContent() === '209');
  check(await board.locator('[data-hsse-year="bbso"]').textContent() === '2793');
  check(await board.locator('[data-hsse-year="hours"]').textContent() === '2.64M');
  await page.screenshot({ path: path.join(out, 'board-1440x900.png'), fullPage: true });
  await board.locator('svg[role=img]').screenshot({ path: path.join(out, 'pyramid-reference.png') });
  await page.setViewportSize({ width: 1280, height: 720 }); await board.evaluate(el => { el.scrollTop = 0; });
  await page.screenshot({ path: path.join(out, 'board-1280x720.png') });
  check(await board.isVisible());
  await tree.getByRole('treeitem', { name: '运营看板', exact: true }).click();
  await hsse.click();
  check(await board.locator('svg[role=img]').getAttribute('aria-label') === '2026年9月HSSE绩效金字塔，当月及年度累计');
  await month(10);
  check(await board.locator('[data-hsse-month="f"]').textContent() === '未录入');
  await board.getByRole('button', { name: '录入本月数据' }).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByRole('button', { name: '保存本月数据', exact: true }).click();
  await dialog.getByText(/不可留空/).waitFor(); check(puts === 0);
  await dialog.getByRole('textbox').first().fill('-1');
  await dialog.getByRole('button', { name: '重试保存' }).click();
  check(puts === 0);
  for (const input of await dialog.getByRole('textbox').all()) await input.fill('0');
  await dialog.getByRole('textbox', { name: 'AT RISK HOURS 人工时（百万）', exact: true }).fill('0.0000001');
  await dialog.getByRole('button', { name: '重试保存' }).click();
  await dialog.getByText(/最多6位小数/).waitFor(); check(puts === 0);
  await dialog.getByRole('textbox', { name: 'AT RISK HOURS 人工时（百万）', exact: true }).fill('0.000001');
  failSave = true;
  await dialog.getByRole('button', { name: '重试保存' }).click();
  await dialog.getByText('保存失败，输入已保留，请重试').waitFor();
  check(await dialog.getByRole('textbox').last().inputValue() === '0.000001');
  failSave = false;
  await dialog.getByRole('button', { name: '重试保存' }).click();
  await dialog.waitFor({ state: 'hidden' });
  check(await board.locator('[data-hsse-month="hours"]').textContent() === '0.000001M');
  check(await board.locator('[data-hsse-year="hours"]').textContent() === '2.640001M');
  await board.getByRole('button', { name: '修改本月数据' }).click();
  await dialog.getByRole('textbox').first().fill('99');
  await dialog.getByRole('button', { name: /^取\s*消$/ }).click();
  await dialog.waitFor({ state: 'hidden' });
  check(records.get(10).f === 0);
  // Theme applies to controls; pyramid semantic colors stay fixed.
  await page.getByRole('combobox', { name: '主题颜色' }).press('Enter');
  await page.getByRole('combobox', { name: '主题颜色' }).press('ArrowUp');
  await page.getByRole('combobox', { name: '主题颜色' }).press('Enter');
  check(await board.locator('[data-hsse-layer="f"] polygon').getAttribute('fill') === '#ff0000');
  check((await board.getByRole('button', { name: '修改本月数据' }).getAttribute('style')).includes('0, 139, 139'));
  await page.getByRole('combobox', { name: '组织板块' }).press('Enter');
  await page.getByTitle('SAS170 PMC板块', { exact: true }).click();
  await hsse.waitFor({ state: 'hidden' }); check(!await board.isVisible());
  check(await tree.getByRole('treeitem', { name: '运营看板', exact: true }).getAttribute('aria-selected') === 'true');
  await page.getByRole('combobox', { name: '组织板块' }).press('Enter');
  await page.getByTitle('全部板块', { exact: true }).click();
  await hsse.click();
  await board.locator('svg[role=img]').waitFor();
  check(await board.locator('[data-hsse-month="hours"]').textContent() === '0.000001M');
  // Read failure and retry, without displaying values from the previous month.
  failRead = true; await monthSelect.press('Enter'); await page.getByTitle('2026年11月', { exact: true }).click();
  await board.getByText('数据加载失败，请重试').waitFor();
  check(await board.locator('svg[role=img]').count() === 0);
  failRead = false; await board.getByRole('button', { name: /^重\s*试$/ }).click();
  await board.locator('svg[role=img]').waitFor(); check(await board.locator('[data-hsse-month="f"]').textContent() === '未录入');
  // A second browser context reads the same server fixture, rather than localStorage.
  const other = await browser.newContext(); await setup(other);
  const second = await other.newPage();
  await second.goto('http://localhost:3001/operations-dashboard-202610/board', { waitUntil: 'networkidle' });
  await second.getByRole('treeitem', { name: 'HSSE绩效看板', exact: true }).click();
  await second.getByRole('combobox', { name: 'HSSE统计月份' }).press('Enter');
  await second.getByTitle('2026年10月', { exact: true }).click();
  await second.locator('[data-hsse-month="hours"]').waitFor();
  check(await second.locator('[data-hsse-month="hours"]').textContent() === '0.000001M');
  check(errors.length === 0);
  fs.writeFileSync(path.join(out, 'browser-results.json'), JSON.stringify({ verdict: 'PASS', checks, errors,
    note: 'Browser uses shared in-memory API fixture; real API persistence is separately tested against isolated SQLite.' }, null, 2));
  console.log(JSON.stringify({ verdict: 'PASS', checks, errors }));
  await browser.close();
})().catch(error => { console.error(error); process.exit(1); });
