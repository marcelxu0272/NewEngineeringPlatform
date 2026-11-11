const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  page.setDefaultTimeout(15000);
  let checks = 0, saves = 0, fail = true;
  const errors = [];
  const importResponses = [];
  page.on('response', async response => {
    if (response.url().endsWith('/api/hsse-performance/import') && response.request().method() === 'POST') {
      try { importResponses.push({status:response.status(),body:await response.json()}); } catch {}
    }
  });
  const check = value => { assert.ok(value); checks++; };
  page.on('pageerror', error => errors.push(error.message));
  // Preview uses the REAL HTTP parser. Commit is mocked to avoid writing fixture data to the user's database.
  await page.route('**/api/hsse-performance/import', async route => {
    if (route.request().method() !== 'PUT') return route.continue();
    saves++;
    if (fail) return route.fulfill({ status: 500, json: { error: '批量保存失败，整批未保存，请重试' } });
    const input = route.request().postDataJSON();
    const keys = Object.keys(input.rows[0].values);
    const cumulative = Object.fromEntries(keys.map(k => [k, input.rows.reduce((sum, row) => sum + row.values[k], 0)]));
    return route.fulfill({ json: { count: input.rows.length, data: { year: input.year, month: input.month,
      current: input.rows.find(row => row.month === input.month)?.values ?? null, cumulative,
      missingMonths: Array.from({ length: input.month }, (_, i) => i + 1).filter(m => !input.rows.some(row => row.month === m)) } } });
  });
  try {
    await page.goto('http://localhost:3001/operations-dashboard-202610/board', { waitUntil: 'networkidle', timeout: 90000 });
    await page.getByRole('treeitem', { name: 'HSSE绩效看板', exact: true }).click();
    const board = page.getByRole('region', { name: 'HSSE绩效看板', exact: true });
    await board.locator('svg[role=img]').waitFor();
    const downloadEvent = page.waitForEvent('download');
    await board.getByRole('link', { name: '下载Excel模板', exact: true }).click();
    const download = await downloadEvent;
    check(download.suggestedFilename().endsWith('.xlsx'));
    const downloaded = path.join(__dirname, 'download-check.xlsx');
    await download.saveAs(downloaded);
    check(fs.readFileSync(downloaded).equals(fs.readFileSync(path.join(process.cwd(), 'public/operations-dashboard-202610/HSSE月报批量导入模板.xlsx'))));
    fs.unlinkSync(downloaded);
    await board.getByRole('button', { name: 'Excel批量录入', exact: true }).click();
    const dialog = page.getByRole('dialog');
    check(await dialog.getByRole('button', { name: '确认导入', exact: true }).isDisabled());
    const file = dialog.getByLabel('HSSE批量导入Excel', { exact: true });
    await file.setInputFiles(path.join(__dirname, 'fixture-invalid.xlsx'));
    await dialog.getByText('Excel校验未通过，未导入任何数据', { exact: true }).waitFor();
    check(await dialog.getByText(/第5行“F”/).count() === 1);
    check(await dialog.getByRole('button', { name: '确认导入', exact: true }).isDisabled());
    await file.setInputFiles(path.join(__dirname, 'fixture-valid.xlsx'));
    await dialog.getByText(/2个月可导入，跳过10个未填写月份/).waitFor();
    check(await dialog.getByRole('columnheader').count() === 14);
    check(saves === 0);
    await page.screenshot({ path: path.join(__dirname, 'preview-1440x900.png') });
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.screenshot({ path: path.join(__dirname, 'preview-1280x720.png') });
    check(await dialog.evaluate(el => el.getBoundingClientRect().right <= innerWidth));
    await dialog.getByRole('button', { name: /^取\s*消$/ }).click();
    await dialog.waitFor({ state: 'hidden' }); check(saves === 0);
    await board.getByRole('button', { name: 'Excel批量录入', exact: true }).click();
    check(await dialog.getByRole('button', { name: '确认导入', exact: true }).isDisabled());
    await file.setInputFiles(path.join(__dirname, 'fixture-valid.xlsx'));
    await dialog.getByRole('button', { name: /确认导入\s*2\s*个月/ }).click();
    await dialog.getByText('批量保存失败，整批未保存，请重试', { exact: true }).waitFor();
    check(await dialog.getByRole('columnheader').count() === 14);
    fail = false;
    await dialog.getByRole('button', { name: /确认导入\s*2\s*个月/ }).click();
    await dialog.waitFor({ state: 'hidden' });
    await board.getByText('已批量导入2个月，年度累计已更新', { exact: true }).waitFor();
    check(await board.locator('[data-hsse-year="hours"]').textContent() === '0.280001M');
    check(await board.locator('[data-hsse-year="bbso"]').textContent() === '418');
    check(errors.length === 0 && saves === 2);
    const result = { verdict: 'PASS', checks, errors, preview: 'real HTTP Excel parser', commit: 'mocked; actual transaction tested separately using isolated SQLite' };
    fs.writeFileSync(path.join(__dirname, 'browser-results.json'), JSON.stringify(result, null, 2));
    console.log(JSON.stringify(result));
  } catch (error) {
    console.error('Import preview responses:', JSON.stringify(importResponses));
    console.error('Import dialog:', await page.getByRole('dialog').textContent().catch(()=>''));
    await page.screenshot({path:path.join(__dirname,'failure.png')});
    throw error;
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
