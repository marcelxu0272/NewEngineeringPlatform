const { chromium } = require('playwright');
const { PDFDocument } = require('pdf-lib');
const Database = require('better-sqlite3');
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const base = process.env.PDF_TEST_URL || 'http://localhost:3001';
const out = __dirname;
const uploadedIds = [];

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  try {
    const response = await context.request.get(`${base}/api/pdf-reports?category=wip-aging`);
    assert.equal(response.status(), 200);
    const wip = (await response.json()).reports;
    assert.ok(wip.length >= 2);
    const sample = wip.find(report => report.sample);
    const source = await context.request.get(`${base}/api/pdf-reports/${sample.id}/file`);
    const bytes = await source.body();
    assert.equal((await PDFDocument.load(bytes)).getPageCount(), 2);
    assert.equal((await context.request.get(`${base}/api/pdf-reports?category=invalid`)).status(), 400);
    assert.equal((await context.request.get(`${base}/api/pdf-reports/missing/file`)).status(), 404);
    const invalid = await context.request.post(`${base}/api/pdf-reports`, { multipart: {
      category: 'wip-aging', title: 'invalid', period: '2026-10', unit: '全部板块',
      file: { name: 'invalid.pdf', mimeType: 'application/pdf', buffer: Buffer.from('not a pdf') },
    } });
    assert.equal(invalid.status(), 400);

    await page.goto(`${base}/operations-dashboard-202610/board`, { waitUntil: 'domcontentloaded' });
    await page.getByRole('treeitem').filter({ hasText: 'WIP 账龄分析' }).click();
    const reports = page.getByTestId('pdf-reports-page');
    await reports.getByRole('button', { name: '查看', exact: true }).first().waitFor();
    await page.screenshot({ path: path.join(out, 'list-wip.png') });
    await reports.getByLabel('报告期筛选').selectOption('2026-09');
    assert.equal(await reports.locator('tbody tr').count(), 1);
    await reports.getByLabel('搜索报告').fill('不存在的报告');
    await reports.getByText('没有找到匹配的报告', { exact: true }).waitFor();
    await reports.getByRole('button', { name: '清除筛选' }).click();

    await reports.getByRole('button', { name: '查看', exact: true }).first().click();
    const reader = page.getByRole('region', { name: 'PDF 连续阅读区' });
    await page.locator('canvas').first().waitFor({ state: 'visible' });
    assert.ok(await page.locator('canvas').first().evaluate(canvas => canvas.width > 500 && canvas.height > 500));
    await reader.evaluate(el => {
      const second = el.querySelectorAll('canvas')[1];
      el.scrollTop += second.getBoundingClientRect().top - el.getBoundingClientRect().top - 20;
    });
    await page.locator('canvas').nth(1).waitFor({ state: 'visible' });
    await page.screenshot({ path: path.join(out, 'reader-second-page.png') });
    await page.getByLabel('PDF 缩放').selectOption('1.25');
    await reader.evaluate(el => { el.scrollTop = 0; });
    await page.locator('canvas').first().waitFor({ state: 'visible' });
    await page.getByLabel('PDF 缩放').selectOption('1');
    await page.locator('canvas').first().waitFor({ state: 'visible' });
    const downloadEvent = page.waitForEvent('download');
    await page.getByRole('link', { name: '下载 PDF', exact: true }).click();
    const download = await downloadEvent;
    assert.ok(download.suggestedFilename().endsWith('.pdf'));
    assert.deepEqual(fs.readFileSync(await download.path()), bytes);
    await page.setViewportSize({ width: 375, height: 812 });
    await page.waitForFunction(() => {
      const canvas = document.querySelector('[role="dialog"] canvas');
      return canvas && canvas.width > 100 && canvas.width < 400 && getComputedStyle(canvas).visibility === 'visible';
    });
    const dialog = page.getByRole('dialog');
    assert.equal(await dialog.evaluate(el => el.scrollWidth <= el.clientWidth), true);
    await page.screenshot({ path: path.join(out, 'reader-narrow.png') });
    await page.keyboard.press('Escape');
    await page.setViewportSize({ width: 1440, height: 1000 });

    // A failed read can be retried without closing or losing the selected report.
    const pattern = '**/api/pdf-reports/*/file';
    await page.route(pattern, route => route.fulfill({ status: 503, body: 'Temporary error' }));
    await reports.getByRole('button', { name: '查看', exact: true }).first().click();
    await page.getByRole('button', { name: '重新加载 PDF' }).waitFor();
    await page.unroute(pattern);
    await page.getByRole('button', { name: '重新加载 PDF' }).click();
    await page.locator('canvas').first().waitFor({ state: 'visible' });
    await page.screenshot({ path: path.join(out, 'reader-desktop.png') });
    await page.keyboard.press('Escape');

    // Exercise UI uploads in both categories. These test-created rows are removed below.
    for (const category of ['wip-aging', 'completed-contract-deduction']) {
      const title = category === 'wip-aging' ? 'WIP 账龄分析' : '完成合同额核减';
      await page.getByRole('treeitem').filter({ hasText: title }).click();
      const unique = `浏览器验证_${category}_${Date.now()}`;
      await reports.getByRole('button', { name: '上传 PDF', exact: true }).click();
      const upload = page.getByRole('dialog');
      await upload.locator('[name="title"]').fill(unique);
      await upload.locator('[name="period"]').fill('2026-10');
      await upload.locator('[name="summary"]').fill('测试上传保存、多页阅读和组织筛选，测试结束仅清理本条测试记录。');
      await upload.locator('[name="unit"]').selectOption('SAS170 PMC板块');
      await upload.locator('[name="file"]').setInputFiles({ name: '中文文件名验证.pdf', mimeType: 'application/pdf', buffer: bytes });
      const saved = page.waitForResponse(r => r.url() === `${base}/api/pdf-reports` && r.request().method() === 'POST');
      await upload.getByRole('button', { name: '上传并保存' }).click();
      const saveResponse = await saved;
      assert.equal(saveResponse.status(), 201);
      const created = (await saveResponse.json()).report;
      uploadedIds.push(created.id);
      await upload.waitFor({ state: 'hidden' });
      await reports.getByText(unique, { exact: true }).waitFor();
      await page.reload();
      await page.getByRole('treeitem').filter({ hasText: title }).click();
      await reports.getByText(unique, { exact: true }).waitFor();
      await reports.locator('tr').filter({ hasText: unique }).getByRole('button', { name: '查看' }).click();
      await page.locator('canvas').first().waitFor({ state: 'visible' });
      await page.keyboard.press('Escape');
      await page.getByTestId('shell-unit-select').click();
      await page.getByTitle('SAS170 PMC板块', { exact: true }).last().click();
      await reports.getByText(unique, { exact: true }).waitFor();
      assert.equal(await reports.locator('tbody tr').count(), 1);
      await page.getByTestId('shell-unit-select').click();
      await page.getByTitle('SAS610 咨询板块', { exact: true }).last().click();
      await reports.getByText('当前范围暂无报告', { exact: true }).waitFor();
      await page.getByTestId('shell-unit-select').click();
      await page.getByTitle('全部板块', { exact: true }).last().click();
      await reports.getByText(unique, { exact: true }).waitFor();
    }
    assert.deepEqual(errors, []);
    fs.writeFileSync(path.join(out, 'verification.json'), JSON.stringify({ result: 'PASS', checks: [
      'two category lists', 'period and query filters', 'empty state', 'PDF page 1 and page 2 actually rendered',
      'zoom and narrow dialog', 'download byte equality', 'load failure and retry',
      'UI uploads in both categories', 'persistence after refresh', 'organization scope filter',
      'invalid file rejected', 'unknown category rejected', 'missing file 404',
    ], pageErrors: errors }, null, 2));
    console.log('PASS: lists, reading, download, uploads, persistence, scopes, retry');
  } finally {
    // Delete only IDs created by this test; never reset the database or existing reports.
    if (uploadedIds.length) {
      const db = new Database(path.join(process.cwd(), 'data', 'platform.db'));
      const remove = db.prepare('DELETE FROM pdf_reports WHERE id = ?');
      for (const id of uploadedIds) remove.run(id);
      db.close();
    }
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
