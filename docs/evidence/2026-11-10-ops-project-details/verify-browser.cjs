const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const PD = require('../../../public/operations-dashboard-202610/project-details');
(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  page.setDefaultTimeout(15000);
  const errors = [], reports = []; let checks = 0;
  const check = (value, label) => { assert.ok(value, label); checks++; };
  const evidence = __dirname;
  page.on('pageerror', error => errors.push(error.message));
  try {
    await page.goto('http://localhost:3001/operations-dashboard-202610/board', { waitUntil: 'networkidle', timeout: 90000 });
    const frame = page.frameLocator('iframe[title="运营看板202610 · 运营看板"]');
    await frame.locator('body[data-ready="true"]').waitFor();
    const dialog = frame.locator('#detailDialog');
    for (const [key, title, selector] of [
      ['contract', '年度新签合同额', '[data-kpi="contract"]'], ['completed', '年度完成合同额', '[data-kpi="completed"]'],
      ['invoice', '年度完成开票额', '[data-kpi="invoice"]'], ['receipt', '年度完成回款额', '[data-kpi="receipt"]'],
      ['wip', 'WIP', '[data-risk="1"]'], ['receivables', '应收账款', '[data-risk="0"]'],
    ]) {
      const card = frame.locator(selector);
      if (!['wip', 'receivables'].includes(key)) check((await card.locator('.kpi-title').textContent()).startsWith(title));
      const displayed = await card.locator(key === 'wip' || key === 'receivables' ? 'strong' : '.kpi-value').textContent();
      await card.click(); await dialog.waitFor();
      check(await frame.locator('#dialogTitle').textContent() === `${title}明细`);
      const headers = await dialog.locator('thead th').allTextContents();
      check(JSON.stringify(headers) === JSON.stringify([...PD.HEADERS, ...(key === 'contract' ? ['类型'] : [])]));
      check(await dialog.locator('tbody tr').count() === 10);
      check(await dialog.locator('tbody tr').first().locator('td').count() === (key === 'contract' ? 10 : 9));
      const next = dialog.getByRole('button', { name: '下一页', exact: true });
      const firstId = await dialog.locator('tbody tr').first().getAttribute('data-project-id');
      await next.click(); check(await dialog.locator('tbody tr').first().getAttribute('data-project-id') !== firstId);
      const downloadWait = page.waitForEvent('download'); await dialog.getByRole('button', { name: '导出', exact: true }).click();
      const download = await downloadWait, file = path.join(evidence, `${key}.csv`); await download.saveAs(file);
      const csv = fs.readFileSync(file, 'utf8');
      check(csv.charCodeAt(0) === 0xfeff);
      const rows = csv.slice(1).split('\r\n').slice(1).map(line => line.split(',').map(cell => cell.slice(1, -1).replace(/""/g, '"')));
      check(rows.length === (key === 'contract' ? 576 : 288), 'export all filtered rows, not only current page');
      check(rows.reduce((n, row) => n + Math.round(Number(row[8]) * 100), 0) === PD.wanToCents(displayed), 'currency reconciliation');
      if (key === 'contract') check(new Set(rows.map(row => row[9])).size === 2);
      const unit = rows[0][5];
      await dialog.getByRole('combobox', { name: '管理归属', exact: true }).selectOption(unit);
      check((await dialog.locator('tbody tr').allTextContents()).every(text => text.includes(unit)));
      const search = dialog.getByRole('textbox', { name: '搜索项目明细', exact: true });
      for (const column of [0, 1, 3, 2]) {
        await search.fill(rows[0][column]);
        check((await dialog.locator('tbody tr').first().textContent()).includes(rows[0][column]));
      }
      await search.fill('不存在的项目');
      check(await dialog.getByText('当前筛选范围内暂无项目明细', { exact: true }).isVisible());
      check(await dialog.getByRole('button', { name: '下一页', exact: true }).isDisabled());
      await search.fill(''); await dialog.getByRole('combobox', { name: '管理归属', exact: true }).selectOption('');
      if (key === 'contract') {
        for (const [width, height] of [[1440, 900], [1280, 720]]) {
          await page.setViewportSize({ width, height });
          const report = await dialog.evaluate(el => {
            const rect = el.getBoundingClientRect(), scroller = el.querySelector('.project-detail-scroll');
            return { width: rect.width, height: rect.height, right: rect.right, bottom: rect.bottom, viewportWidth: innerWidth, viewportHeight: innerHeight,
              overflow: el.scrollWidth - el.clientWidth, tableScrollWidth: scroller.scrollWidth, tableClientWidth: scroller.clientWidth };
          });
          check(report.right <= report.viewportWidth && report.bottom <= report.viewportHeight && report.overflow <= 1);
          await page.screenshot({ path: path.join(evidence, `new-contract-${width}x${height}.png`) });
          reports.push({ viewport: { width, height }, ...report });
        }
        await page.setViewportSize({ width: 1440, height: 900 });
      }
      await dialog.getByRole('button', { name: '关闭详情', exact: true }).click(); await dialog.waitFor({ state: 'hidden' });
    }
    const choose = async (combo, title) => {
      await combo.locator('xpath=ancestor::div[contains(@class,"ant-select-selector")][1]').click();
      const id = await combo.getAttribute('aria-controls');
      await page.locator(`[id="${id}"]`).locator('xpath=ancestor::div[contains(@class,"ant-select-dropdown")][1]').getByTitle(title, { exact: true }).click();
    };
    await frame.locator('[data-kpi="contract"]').click();
    await choose(page.getByRole('combobox', { name: '组织板块', exact: true }), 'SAS170 PMC板块');
    await dialog.getByRole('combobox', { name: '管理归属', exact: true }).locator('option[value="SAS170 PMC板块"]').waitFor({ state: 'attached' });
    check(await dialog.getByRole('combobox', { name: '管理归属', exact: true }).locator('option').count() === 2);
    const totalYuan = (await dialog.locator('#projectDetailMeta strong').textContent()).replace(/,/g, '');
    const cardWan = (await frame.locator('[data-kpi="contract"] .kpi-value').textContent()).replace(/,/g, '');
    check(Math.round(Number(totalYuan) * 100) === PD.wanToCents(cardWan));
    await choose(page.getByRole('combobox', { name: '主题颜色', exact: true }), '暖棕主题');
    check(await frame.locator('html').getAttribute('data-theme') === 'wood');
    check(await dialog.isVisible());
    await dialog.getByRole('textbox', { name: '搜索项目明细', exact: true }).focus();
    await page.keyboard.press('Escape'); await dialog.waitFor({ state: 'hidden' });
    await frame.locator('[data-risk="2"]').click(); check((await frame.locator('#dialogTitle').textContent()).includes('存货'));
    check(await dialog.locator('.project-detail-table').count() === 0); await frame.locator('#closeDialog').click();
    await frame.locator('[data-cash-detail]').first().click(); check((await frame.locator('#dialogTitle').textContent()).includes('现金流入明细')); await frame.locator('#closeDialog').click();
    await frame.getByRole('switch', { name: /子目标/ }).click();
    check(await frame.locator('[data-kpi="contract"]').isVisible());
    await choose(page.getByRole('combobox', { name: '组织板块', exact: true }), '全部板块');
    check(errors.length === 0, errors.join('\n'));
    const result = { verdict: 'PASS', checks, pageErrors: errors, layout: reports, exports: 'BOM UTF-8 CSV; full filter scope; cents reconcile with displayed cards' };
    fs.writeFileSync(path.join(evidence, 'browser-results.json'), JSON.stringify(result, null, 2));
    console.log(JSON.stringify(result));
  } catch (error) { await page.screenshot({ path: path.join(evidence, 'failure.png') }); console.error(errors); throw error; }
  finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
