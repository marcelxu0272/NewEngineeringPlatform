const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

(async () => {
  const OUT = path.resolve('docs/evidence/2026-11-03-ops-shell-filter-and-completed-contract');
  fs.mkdirSync(OUT, { recursive: true });
  const base = 'http://127.0.0.1:3001';
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1600, height: 1100 } });
  const result = { pass: false, ac: {}, notes: [] };

  await page.goto(base + '/operations-dashboard-202610/board', { waitUntil: 'networkidle', timeout: 90000 });
  await page.waitForTimeout(1500);

  // A1: shell filter visible
  const filter = page.locator('[data-testid="board-shell-filters"]');
  const filterVisible = await filter.isVisible();
  const yearText = (await page.locator('[data-testid="shell-year-lock"]').innerText()).trim();
  const yearLockOk = yearText.includes('2026');
  // no business type in shell filter
  const filterText = await filter.innerText();
  const noBusiness = !/业务类型/.test(filterText);
  // unit select present
  const unitSelect = page.locator('[data-testid="shell-unit-select"], [aria-label="组织板块"]').first();
  const unitOk = await unitSelect.count() > 0;

  await page.screenshot({ path: path.join(OUT, 'A1-shell-filter-default.png'), fullPage: false });

  // A1b: switch to placeholder - filter still visible
  await page.getByRole('treeitem', { name: /人力资源看板/ }).click();
  await page.waitForTimeout(600);
  const filterOnPlaceholder = await filter.isVisible();
  const placeholderCards = await page.locator('text=占位').count();
  await page.screenshot({ path: path.join(OUT, 'A1b-filter-on-placeholder.png') });

  // back to ops
  await page.getByRole('treeitem', { name: /^运营看板$/ }).click();
  await page.waitForTimeout(1200);

  // A3: index.html no three selects
  let opsFrame = page.frameLocator('iframe[title*="运营看板"]').first();
  // prefer contentFrame of ops iframe
  const iframes = page.locator('iframe');
  const nIframes = await iframes.count();
  let ops = null;
  let completed = null;
  for (let i = 0; i < nIframes; i++) {
    const t = await iframes.nth(i).getAttribute('title');
    const h = await iframes.nth(i).elementHandle();
    const f = await h.contentFrame();
    if (t && t.includes('完成合同额')) completed = f;
    else if (t && t.includes('运营看板')) ops = f;
  }
  if (!ops) {
    // fallback first frame
    const h = await iframes.first().elementHandle();
    ops = await h.contentFrame();
  }

  const yearSelectCount = await ops.locator('#yearSelect, select[aria-label="统计年度"]').count();
  const unitSelectCount = await ops.locator('#unitSelect, select[aria-label="组织板块"]').count();
  const bizSelectCount = await ops.locator('#businessSelect, select[aria-label="业务类型"]').count();
  const headerHidden = await ops.evaluate(() => {
    const h = document.querySelector('.header');
    if (!h) return true;
    const s = getComputedStyle(h);
    return s.display === 'none' || s.visibility === 'hidden';
  });

  // A4: change unit and check postMessage effect via banner / state
  // Open ant select
  await page.locator('[data-testid="board-shell-filters"] .ant-select').click();
  await page.locator('.ant-select-item-option').filter({ hasText: '设计院' }).first().click();
  await page.waitForTimeout(900);
  // ops should still render; probe state.unit if accessible
  const opsUnit = await ops.evaluate(() => {
    try {
      // not global; infer from toast or just that page didn't throw
      return document.body.innerText.includes('现金流') || !!document.querySelector('#cashPanel, #kpiGrid');
    } catch (e) { return false; }
  });
  await page.screenshot({ path: path.join(OUT, 'A4-unit-design-institute.png') });

  // B: completed contract
  await page.getByRole('treeitem', { name: /完成合同额看板/ }).click();
  await page.waitForTimeout(2000);
  // reacquire completed frame
  for (let i = 0; i < await iframes.count(); i++) {
    const t = await iframes.nth(i).getAttribute('title');
    const h = await iframes.nth(i).elementHandle();
    const f = await h.contentFrame();
    if (t && t.includes('完成合同额')) completed = f;
  }
  const filterStill = await filter.isVisible();
  const noPlaceholderOnCompleted = (await page.locator('.absolute.inset-0.z-20 >> text=占位').count()) === 0;

  let blocks = {};
  if (completed) {
    await completed.waitForSelector('.kpi-card, text=完成合同额', { timeout: 15000 }).catch(()=>{});
    await page.waitForTimeout(1200);
    blocks = await completed.evaluate(() => {
      const text = document.body.innerText;
      return {
        kpi: !!document.querySelector('.kpi-card') && text.includes('完成合同额') && text.includes('完成开票额') && text.includes('完成回款额') && text.includes('存量合同额'),
        delta: text.includes('较上一期'),
        tree: text.includes('本月完成合同额情况'),
        alerts: text.includes('项目预警一览'),
        trend: text.includes('月度走势'),
        pm: text.includes('按项目经理汇总'),
        emptyReady: !!document.getElementById('alertEmpty'),
        drawer: !!document.getElementById('drawer'),
      };
    });
    // open drawer via tree more
    await completed.locator('#btnTreeMore').click();
    await page.waitForTimeout(400);
    const drawerOpen = await completed.evaluate(() => document.getElementById('drawer').classList.contains('open'));
    blocks.drawerOpen = drawerOpen;
    await completed.locator('#drawerClose').click().catch(()=>{});
  }

  // screenshot completed
  await page.screenshot({ path: path.join(OUT, 'B1-completed-contract-board.png') });
  if (completed) {
    const panel = completed.locator('.page');
    await panel.screenshot({ path: path.join(OUT, 'B2-completed-content.png') }).catch(()=>{});
  }

  // empty alerts via direct page
  const page2 = await browser.newPage({ viewport: { width: 1400, height: 900 } });
  await page2.goto(base + '/operations-dashboard-202610/completed-contract.html?emptyAlerts=1', { waitUntil: 'networkidle' });
  await page2.waitForTimeout(800);
  const emptyVisible = await page2.locator('#alertEmpty').isVisible();
  await page2.screenshot({ path: path.join(OUT, 'B3-alerts-empty-state.png') });
  await page2.close();

  result.ac = {
    A1_filterVisible: filterVisible,
    A1_yearLock2026: yearLockOk,
    A1_noBusinessType: noBusiness,
    A1_unitSelect: unitOk,
    A1b_filterOnPlaceholder: filterOnPlaceholder,
    A1b_placeholderShown: placeholderCards > 0,
    A3_noYearSelect: yearSelectCount === 0,
    A3_noUnitSelectInIframe: unitSelectCount === 0,
    A3_noBizSelect: bizSelectCount === 0,
    A3_headerHidden: headerHidden,
    A4_opsAliveAfterUnit: opsUnit,
    A4_filterOnCompleted: filterStill,
    B1_noPlaceholder: noPlaceholderOnCompleted,
    B2_blocks: blocks,
    B3_emptyAlerts: emptyVisible,
  };

  const ac = result.ac;
  result.pass = !!(
    ac.A1_filterVisible && ac.A1_yearLock2026 && ac.A1_noBusinessType && ac.A1_unitSelect &&
    ac.A1b_filterOnPlaceholder &&
    ac.A3_noYearSelect && ac.A3_noUnitSelectInIframe && ac.A3_noBizSelect && ac.A3_headerHidden &&
    ac.A4_opsAliveAfterUnit && ac.A4_filterOnCompleted &&
    ac.B1_noPlaceholder && ac.B2_blocks && ac.B2_blocks.kpi && ac.B2_blocks.tree &&
    ac.B2_blocks.alerts && ac.B2_blocks.trend && ac.B2_blocks.pm && ac.B2_blocks.delta &&
    ac.B2_blocks.drawerOpen && ac.B3_emptyAlerts
  );

  fs.writeFileSync(path.join(OUT, 'probe.json'), JSON.stringify(result, null, 2), 'utf8');
  console.log(JSON.stringify(result, null, 2));
  await browser.close();
  process.exit(result.pass ? 0 : 1);
})().catch(e => { console.error(e); process.exit(2); });
