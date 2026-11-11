import { chromium, type Locator } from 'playwright';
import {UNIT_OPTIONS} from '../../../public/operations-dashboard-202610/shared/catalog.js';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { BUSINESS_TYPES, createMarketDemo, defaultFilters, money, selectMarket } from '../../../lib/market-demo/model';

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  page.setDefaultTimeout(16000);
  let checks = 0;
  const errors: string[] = [], requests: string[] = [];
  const check = (value: unknown, message?: string) => { assert.ok(value, message); checks++; };
  const unitLabels = UNIT_OPTIONS.map(row=>row.value);
  const demo = createMarketDemo(unitLabels.filter(unit => unit !== '全部板块'));
  const defaults = defaultFilters('全部板块');
  const all = selectMarket(demo, defaults);
  const evidence = 'docs/evidence/2026-11-10-ops-market-demo';
  page.on('pageerror', error => errors.push(error.message));
  page.on('request', request => { if (request.url().includes('/api/')) requests.push(request.url()); });
  const root = page.getByRole('region', { name: '市场看板演示', exact: true });
  const navigate = async (name: string) => {
    await page.getByRole('treeitem', { name, exact: true }).click();
    await root.getByRole('heading', { name, exact: true }).waitFor();
  };
  const query = () => root.getByRole('button', { name: /^查\s*询$/ }).click();
  const reset = () => root.getByRole('button', { name: /^重\s*置$/ }).click();
  const select = async (combo: Locator, title: string) => {
    await combo.scrollIntoViewIfNeeded();
    await combo.locator('xpath=ancestor::div[contains(@class,"ant-select-selector")][1]').click();
    const list = await combo.getAttribute('aria-controls');
    const popup = page.locator(`[id="${list}"]`).locator('xpath=ancestor::div[contains(@class,"ant-select-dropdown")][1]');
    await popup.getByTitle(title, { exact: true }).click();
  };
  const fillRange = async (label: string, start: string, end: string) => {
    const inputs = root.getByText(label, { exact: true }).locator('..').locator('input');
    await inputs.nth(0).fill(start); await inputs.nth(0).press('Tab');
    await inputs.nth(1).fill(end); await inputs.nth(1).press('Enter');
  };
  const kpi = () => root.locator('[data-market-kpi="总签署合同额"]');
  async function layout(width: number, height: number, expectedCols: number, name: string) {
    await page.setViewportSize({ width, height });
    const report = await root.evaluate(el => {
      const grids = Array.from(el.querySelectorAll<HTMLElement>('[data-market-grid]')).map(grid => {
        const cards = Array.from(grid.children).map(card => { const rect = card.getBoundingClientRect(); return { top: Math.round(rect.top), height: rect.height }; });
        return { name: grid.dataset.marketGrid, columns: getComputedStyle(grid).gridTemplateColumns.split(' ').length, cards };
      });
      return { clientWidth: el.clientWidth, scrollWidth: el.scrollWidth, grids };
    });
    check(report.clientWidth === report.scrollWidth, `${width}: root overflow`);
    check(report.grids.every(grid => grid.columns === expectedCols), `${width}: expected ${expectedCols} columns`);
    for (const grid of report.grids) for (const card of grid.cards) {
      const row = grid.cards.filter(other => other.top === card.top);
      check(row.length <= 2 && row.every(other => Math.abs(other.height - card.height) <= 1), `${width}: equal-height row`);
    }
    await root.evaluate(el => { el.scrollTop = 0; });
    await page.screenshot({ path: path.join(evidence, `${name}-${width}x${height}.png`) });
    return report;
  }
  try {
    await page.goto('http://localhost:3001/operations-dashboard-202610/board', { waitUntil: 'domcontentloaded', timeout: 120000 });
    await page.waitForLoadState('networkidle');
    await navigate('机会清单');
    const marketNodes = page.getByRole('treeitem').filter({ hasText: /^(机会清单|市场数据|合同看板)$/ });
    check(await marketNodes.count() === 3);
    check(await root.getByText('演示数据', { exact: true }).count() === 1);
    const total = root.locator('tr[data-row-key="grand-total"]');
    check(await total.locator('td').nth(7).textContent() === money(all.signed));
    check(await total.locator('td').nth(3).textContent() === money(all.estimated));
    check(await total.locator('td').nth(5).textContent() === money(all.weighted));
    check(await root.getByRole('columnheader').filter({ hasText: '已中未签合同额' }).count() === 1);
    await fillRange('申请时间', '2026/02/01', '2026/02/28'); await query();
    const february = selectMarket(demo, { ...defaults, application: ['2026-02-01', '2026-02-28'] });
    check(await total.locator('td').nth(3).textContent() === money(february.estimated));
    await select(root.getByRole('combobox', { name: '当前阶段', exact: true }), '已签约'); await query();
    await root.getByRole('button', { name: '机会清单', exact: true }).click();
    const dialog = page.getByRole('dialog');
    await dialog.getByPlaceholder('搜索项目、客户或板块名称').fill('不存在的项目');
    await dialog.locator('.ant-empty-description').getByText('暂无数据', { exact: true }).waitFor(); check(true);
    await dialog.getByRole('button', { name: 'Close', exact: true }).click();
    await dialog.waitFor({ state: 'hidden' });
    await reset();
    check(await total.locator('td').nth(7).textContent() === money(all.signed));
    await layout(1440, 900, 2, 'opportunity'); // no card grid on this view, table remains scoped

    await navigate('市场数据');
    check(await root.locator('[data-market-module]').count() === 5);
    check(await root.locator('[data-market-chart] svg').count() === 3);
    await root.getByRole('checkbox', { name: 'EPC', exact: true }).uncheck(); await query();
    const noEpc = selectMarket(demo, { ...defaults, types: ['设计及咨询', 'PMC'] });
    const signedCard = root.locator('[data-market-module="新签合同完成情况"]');
    check((await signedCard.textContent())!.includes(money(noEpc.signed)));
    await layout(1440, 900, 2, 'market-data');
    const funnel = root.locator('[data-market-module="项目机会 GoGet 分析"]');
    await funnel.screenshot({ path: path.join(evidence, 'goget.png') });
    const firstChart = root.locator('[data-market-chart="新签合同完成环图"]');
    await firstChart.scrollIntoViewIfNeeded();
    const bounds = await firstChart.boundingBox();
    await page.mouse.move(bounds!.x + bounds!.width / 2 + 80, bounds!.y + 132);
    await page.waitForFunction(() => Array.from(document.querySelectorAll('[data-market-chart] div')).some(el => (el.textContent ?? '').includes('万元') && getComputedStyle(el).visibility !== 'hidden'));
    check(true);
    await firstChart.locator('text').filter({ hasText: /^已签合同$/ }).click(); check(true);

    await navigate('合同看板');
    check((await kpi().textContent())!.includes(money(noEpc.signed)));
    check((await root.locator('[data-market-kpi="EPC"]').textContent())!.startsWith('0.00'));
    await reset(); check((await kpi().textContent())!.includes(money(all.signed)));
    check(await root.locator('[data-market-module]').count() === 11);
    const layout1440 = await layout(1440, 900, 2, 'contracts');
    const layout1280 = await layout(1280, 720, 2, 'contracts');
    const layout1100 = await layout(1100, 800, 1, 'contracts');
    writeFileSync(path.join(evidence, 'layout-results.json'), JSON.stringify([layout1440, layout1280, layout1100], null, 2));
    await page.setViewportSize({ width: 1440, height: 900 });
    for (const [title, filename] of [['各板块实际进度', 'segment-progress'], ['金额趋势（万元）', 'contract-trend'], ['业务类型年度变化', 'annual-trends'], ['客户签署金额排行', 'customer-ranking']]) {
      await root.locator(`[data-market-module="${title}"]`).screenshot({ path: path.join(evidence, `${filename}.png`) });
    }
    await fillRange('合同起止日期', '2026/02/01', '2026/02/28'); await query();
    const contractFebruary = selectMarket(demo, { ...defaults, contract: ['2026-02-01', '2026-02-28'] });
    check((await kpi().textContent())!.includes(money(contractFebruary.signed)));
    await reset();
    await root.getByRole('button', { name: '数据概况', exact: true }).click();
    check((await dialog.textContent())!.includes(money(all.signed)));
    await dialog.getByRole('button', { name: /^关\s*闭$/ }).click(); await dialog.waitFor({ state: 'hidden' });
    await root.getByRole('button', { name: '刷新模拟数据', exact: true }).click();
    check((await kpi().textContent())!.includes(money(all.signed)));
    const downloadWait = page.waitForEvent('download'); await root.getByRole('button', { name: '导出明细', exact: true }).click();
    const download = await downloadWait, downloadedFile = path.join(evidence, 'export-check.csv');
    await download.saveAs(downloadedFile);
    const csv = readFileSync(downloadedFile, 'utf8');
    check(csv.charCodeAt(0) === 0xfeff && csv.split('\r\n').length === all.contracts.length + 1);
    check(csv.includes('模拟客户') && csv.includes('实际') && csv.includes('预测'));
    const customers = root.locator('[data-market-module="客户签署金额排行"]');
    const firstCustomer = await customers.locator('tbody tr').first().textContent();
    await customers.getByText('6—10', { exact: true }).click();
    check(await customers.locator('tbody tr').count() === 5 && await customers.locator('tbody tr').first().textContent() !== firstCustomer);
    await root.getByRole('button', { name: '框架存量情况 ›', exact: true }).click();
    await dialog.getByText('框架存量情况 · 演示明细', { exact: true }).waitFor(); check(true);
    await dialog.getByRole('button', { name: 'Close', exact: true }).click(); await dialog.waitFor({ state: 'hidden' });
    await root.getByText('标榜', { exact: true }).click(); check(await root.locator('[data-market-chart="各板块金额与完成率"] svg').count() === 1);
    await select(page.getByRole('combobox', { name: '组织板块', exact: true }), unitLabels[1]);
    const singleUnit = selectMarket(demo, { ...defaults, unit: unitLabels[1] });
    check((await kpi().textContent())!.includes(money(singleUnit.signed)));
    await select(root.getByRole('combobox', { name: '市场板块', exact: true }), unitLabels[2]); await query();
    check((await kpi().textContent())!.includes(money(selectMarket(demo, { ...defaults, unit: unitLabels[2] }).signed)));
    check((await page.getByTestId('board-main-header').textContent())!.includes(unitLabels[1]));
    await select(page.getByRole('combobox', { name: '主题颜色', exact: true }), '青绿主题');
    check(await root.evaluate(el => getComputedStyle(el).getPropertyValue('--market-primary').trim()) === '#008b8b');
    await navigate('市场数据');
    for (const type of BUSINESS_TYPES) await root.getByRole('checkbox', { name: type, exact: true }).uncheck();
    await query();
    check(await root.locator('[data-market-chart]').count() === 0);
    check(await root.getByText('当前筛选无演示数据', { exact: true }).count() === 3);
    await navigate('合同看板');
    check((await kpi().textContent())!.startsWith('0.00'));
    check(await root.locator('[data-market-chart]').count() === 0);
    await reset();
    await page.getByRole('treeitem', { name: '运营看板', exact: true }).click();
    check(!await root.isVisible());
    await select(page.getByRole('combobox', { name: '组织板块', exact: true }), '全部板块');
    await page.getByRole('treeitem', { name: 'HSSE绩效看板', exact: true }).click();
    check(await page.getByRole('region', { name: 'HSSE绩效看板', exact: true }).isVisible());
    check(errors.length === 0, errors.join('\n'));
    check(requests.every(url => !url.includes('/market')), requests.join('\n'));
    const result = { verdict: 'PASS', checks, pageErrors: errors, localMarketApiRequests: requests.filter(url => url.includes('/market')), data: 'deterministic synthetic records' };
    writeFileSync(path.join(evidence, 'browser-results.json'), JSON.stringify(result, null, 2));
    console.log(JSON.stringify(result));
  } catch (error) {
    await page.screenshot({ path: path.join(evidence, 'failure.png') });
    console.error('page errors', errors);
    throw error;
  } finally { await browser.close(); }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
