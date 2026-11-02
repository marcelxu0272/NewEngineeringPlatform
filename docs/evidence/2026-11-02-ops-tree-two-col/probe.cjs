const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const BASE = 'http://localhost:3000';
const OUT = path.join('docs', 'evidence', '2026-11-02-ops-tree-two-col');
fs.mkdirSync(OUT, { recursive: true });
const results = [];
const pass = (id, detail) => { results.push({ id, ok: true, detail }); console.log('PASS', id, typeof detail === 'string' ? detail : JSON.stringify(detail)); };
const fail = (id, detail) => { results.push({ id, ok: false, detail }); console.log('FAIL', id, typeof detail === 'string' ? detail : JSON.stringify(detail)); };
const sha = (p) => crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex').toUpperCase();

const EXPECT_TREE = [
  '当前运营看板',
  '市场看板',
  '机会清单',
  '市场数据',
  '合同看板',
  '人力资源看板',
  '完成合同额看板',
];

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } });

  // --- AC1: /board left tree + right content; default current; Board->/board; org-chart & 202602 unchanged ---
  await page.goto(BASE + '/operations-dashboard-202610', { waitUntil: 'networkidle', timeout: 90000 });
  await page.waitForTimeout(800);
  const entry = await page.evaluate(() => {
    const iframe = document.querySelector('iframe');
    const doc = iframe?.contentDocument;
    const a = doc?.querySelector('a.board-entry-link');
    return {
      url: location.pathname,
      boardHref: a?.getAttribute('href') || null,
      boardTarget: a?.getAttribute('target') || null,
      boardText: (a?.textContent || '').replace(/\s+/g, ' ').trim(),
    };
  });
  entry.boardHref === '/operations-dashboard-202610/board' && entry.boardTarget === '_top'
    ? pass('AC1-board-link', entry) : fail('AC1-board-link', entry);

  // Navigate to board (prefer location if click flaky)
  try {
    await Promise.all([
      page.waitForURL('**/operations-dashboard-202610/board', { timeout: 15000 }),
      page.frameLocator('iframe').first().locator('a.board-entry-link').first().click({ timeout: 8000 }),
    ]);
  } catch (e) {
    await page.goto(BASE + '/operations-dashboard-202610/board', { waitUntil: 'networkidle', timeout: 90000 });
  }
  await page.waitForTimeout(1500);

  const boardShell = await page.evaluate(() => {
    const gray = document.querySelector('div.fixed.left-0.top-0.h-screen.w-16.bg-gray-800');
    const treeButtons = [...document.querySelectorAll('button')].filter(b => {
      const t = (b.textContent || '').replace(/\s+/g, ' ').trim();
      return /当前运营看板|市场看板|机会清单|市场数据|合同看板|人力资源看板|完成合同额看板/.test(t);
    }).map(b => (b.textContent || '').replace(/\s+/g, ' ').trim());
    const iframe = document.querySelector('iframe');
    const themeSelect = [...document.querySelectorAll('.ant-select, select')].map(el => ({
      tag: el.tagName,
      className: el.className,
      text: (el.textContent || '').slice(0, 80),
    }));
    // header theme: look for Select near title
    const h2 = document.querySelector('h2');
    return {
      url: location.pathname,
      hasGrayShell: !!gray,
      treeLabels: treeButtons,
      iframeSrc: iframe?.getAttribute('src') || null,
      iframeVisible: iframe ? getComputedStyle(iframe).opacity !== '0' && getComputedStyle(iframe).display !== 'none' : false,
      iframeOpacity: iframe ? getComputedStyle(iframe).opacity : null,
      title: h2?.textContent?.trim() || null,
      bodyHasPlaceholderTitle: !!document.querySelector('h3'),
    };
  });
  await page.screenshot({ path: path.join(OUT, '01-board-default-current.png'), fullPage: false });

  const hasLeftTree = EXPECT_TREE.every(lab => boardShell.treeLabels.some(t => t.includes(lab)));
  const defaultCurrent = boardShell.treeLabels.some(t => t.includes('当前运营看板')) &&
    (boardShell.iframeSrc || '').includes('index.html') &&
    boardShell.url === '/operations-dashboard-202610/board';
  hasLeftTree && defaultCurrent && boardShell.hasGrayShell
    ? pass('AC1-board-layout-default', boardShell)
    : fail('AC1-board-layout-default', { hasLeftTree, defaultCurrent, boardShell });

  // org-chart + 202602 hashes
  const orgSha = sha(path.join('app', 'org-chart', 'page.tsx'));
  const readmeSha = sha(path.join('public', '202602', 'README.md'));
  const html202602 = path.join('public', '202602', '组织架构图_四列布局_base copy.html');
  const htmlSha = fs.existsSync(html202602) ? sha(html202602) : 'MISSING';
  const EXPECT = {
    org: '951398F5D2DF55DA6D6C910961088133750E96569EC0967AB7D5C76508489D0C',
    readme: '1F5BB11CC655BB5C224D0AE41D24BC1FD4122AD2F5786F168B123C6BBD7A1B47',
    html: 'B189CAE392EECB1DDC78D39723ADE6092A16F722FBEDAAF8C139001F4A26CE14',
  };
  orgSha === EXPECT.org && readmeSha === EXPECT.readme && htmlSha === EXPECT.html
    ? pass('AC1-protected-hashes', { orgSha, readmeSha, htmlSha })
    : fail('AC1-protected-hashes', { orgSha, readmeSha, htmlSha, EXPECT });

  await page.goto(BASE + '/org-chart', { waitUntil: 'networkidle', timeout: 90000 });
  await page.waitForTimeout(800);
  const orgPage = await page.evaluate(() => ({
    url: location.pathname,
    iframeSrc: document.querySelector('iframe')?.getAttribute('src') || null,
    hasGray: !!document.querySelector('div.fixed.left-0.top-0.h-screen.w-16.bg-gray-800'),
  }));
  await page.screenshot({ path: path.join(OUT, '02-org-chart-unchanged.png'), fullPage: false });
  orgPage.url === '/org-chart' && orgPage.hasGray
    ? pass('AC1-org-chart-route', orgPage) : fail('AC1-org-chart-route', orgPage);

  // back to board for remaining ACs
  await page.goto(BASE + '/operations-dashboard-202610/board', { waitUntil: 'networkidle', timeout: 90000 });
  await page.waitForTimeout(1500);

  // --- AC2: tree structure; market parent expands only; leaf switches right ---
  const beforeSel = await page.evaluate(() => {
    const active = [...document.querySelectorAll('button')].find(b => (b.className || '').includes('font-semibold') && /当前运营看板/.test(b.textContent || ''));
    const iframe = document.querySelector('iframe');
    return {
      activeCurrent: !!(active && getComputedStyle(active).fontWeight >= 600 || active),
      iframeSrc: iframe?.getAttribute('src'),
      iframeOpacity: iframe ? getComputedStyle(iframe).opacity : null,
      selectedHint: [...document.querySelectorAll('button')].filter(b => /bg-\[#007069\]\/10|font-semibold/.test(b.className)).map(b => (b.textContent||'').replace(/\s+/g,' ').trim()),
    };
  });

  // Click market parent - should NOT change selection away from current if it was current
  const marketBtn = page.locator('button', { hasText: '市场看板' }).first();
  // collapse then expand
  await marketBtn.click();
  await page.waitForTimeout(300);
  const afterMarketCollapse = await page.evaluate(() => {
    const labels = [...document.querySelectorAll('button')].map(b => (b.textContent||'').replace(/\s+/g,' ').trim());
    const kidsVisible = ['机会清单','市场数据','合同看板'].filter(k => labels.some(l => l.includes(k)));
    const iframeOpacity = document.querySelector('iframe') ? getComputedStyle(document.querySelector('iframe')).opacity : null;
    const active = [...document.querySelectorAll('button')].filter(b => /font-semibold/.test(b.className)).map(b => (b.textContent||'').replace(/\s+/g,' ').trim());
    return { kidsVisible, iframeOpacity, active, pathname: location.pathname };
  });
  await marketBtn.click(); // expand again
  await page.waitForTimeout(300);
  const afterMarketExpand = await page.evaluate(() => {
    const labels = [...document.querySelectorAll('button')].map(b => (b.textContent||'').replace(/\s+/g,' ').trim());
    const kidsVisible = ['机会清单','市场数据','合同看板'].filter(k => labels.some(l => l.includes(k)));
    const active = [...document.querySelectorAll('button')].filter(b => /font-semibold/.test(b.className)).map(b => (b.textContent||'').replace(/\s+/g,' ').trim());
    const iframeOpacity = document.querySelector('iframe') ? getComputedStyle(document.querySelector('iframe')).opacity : null;
    const h3 = document.querySelector('h3')?.textContent?.trim() || null;
    return { kidsVisible, active, iframeOpacity, h3, pathname: location.pathname };
  });
  await page.screenshot({ path: path.join(OUT, '03-tree-market-parent.png'), fullPage: false });

  const marketParentOk = afterMarketCollapse.kidsVisible.length === 0 &&
    afterMarketExpand.kidsVisible.length === 3 &&
    afterMarketExpand.pathname === '/operations-dashboard-202610/board' &&
    afterMarketExpand.active.some(a => a.includes('当前运营看板')) &&
    !afterMarketExpand.active.some(a => a.includes('市场看板') && !a.includes('当前'));
  // Note: market parent should not become selected; current should stay
  marketParentOk
    ? pass('AC2-market-parent-toggle', { afterMarketCollapse, afterMarketExpand })
    : fail('AC2-market-parent-toggle', { afterMarketCollapse, afterMarketExpand });

  // Click leaf 机会清单
  await page.locator('button', { hasText: '机会清单' }).first().click();
  await page.waitForTimeout(500);
  const afterLeaf = await page.evaluate(() => {
    const h3 = document.querySelector('h3')?.textContent?.trim() || null;
    const cards = [...document.querySelectorAll('h3 + div .grid > div, .grid.grid-cols-2 > div')];
    // broader: dashed cards with 占位
    const all = [...document.querySelectorAll('div')].filter(d => (d.textContent || '').trim() === '占位' && d.children.length === 0);
    const dashed = [...document.querySelectorAll('div')].filter(d => /border-dashed/.test(d.className) && /占位/.test(d.textContent || ''));
    const iframe = document.querySelector('iframe');
    const iframeOpacity = iframe ? getComputedStyle(iframe).opacity : null;
    const selectsInContent = [...document.querySelectorAll('select')].length;
    // content area selects (year/unit/business are inside iframe; placeholder should have none in shell content)
    return {
      h3,
      placeholderCount: dashed.length || all.length,
      dashedCount: dashed.length,
      iframeOpacity,
      pathname: location.pathname,
      active: [...document.querySelectorAll('button')].filter(b => /font-semibold/.test(b.className)).map(b => (b.textContent||'').replace(/\s+/g,' ').trim()),
      hasYearInShell: !!document.querySelector('select#yearSelect'),
    };
  });
  await page.screenshot({ path: path.join(OUT, '04-placeholder-opportunity.png'), fullPage: false });
  afterLeaf.h3 === '机会清单' && afterLeaf.placeholderCount >= 4 && afterLeaf.pathname === '/operations-dashboard-202610/board' && Number(afterLeaf.iframeOpacity) === 0
    ? pass('AC2-leaf-switch-placeholder', afterLeaf)
    : fail('AC2-leaf-switch-placeholder', afterLeaf);

  // Click back to current
  await page.locator('button', { hasText: '当前运营看板' }).first().click();
  await page.waitForTimeout(800);

  // --- AC3: toolbar only 3 selects; no focus/asof/reset/help/role; theme in Next header; iframe sync ---
  const toolbar = await page.evaluate(async () => {
    const iframe = document.querySelector('iframe');
    const doc = iframe.contentDocument;
    const headerControls = doc.querySelector('.header-controls');
    const selects = [...(headerControls?.querySelectorAll('select') || [])].map(s => ({
      id: s.id,
      aria: s.getAttribute('aria-label'),
      options: [...s.options].map(o => o.textContent.trim()),
    }));
    const focusBar = doc.querySelector('.focus-bar, [class*="focus-bar"]');
    const headerTabs = doc.querySelector('.header-tabs');
    const headerTabsDisplay = headerTabs ? getComputedStyle(headerTabs).display : null;
    const themeSelectInIframe = doc.querySelector('#themeSelect');
    const resetBtn = [...doc.querySelectorAll('button')].find(b => /重置/.test(b.textContent || ''));
    const roleEl = [...doc.querySelectorAll('select,button,label,span')].find(el => /角色/.test((el.textContent||'') + (el.getAttribute('aria-label')||'')) && el.closest('.header'));
    const asOf = [...doc.querySelectorAll('input,select,label')].find(el => /截至/.test((el.textContent||'') + (el.getAttribute('aria-label')||'') + (el.getAttribute('data-tip')||'')) && el.closest('.header-controls'));
    const helpBtn = [...doc.querySelectorAll('button')].find(b => /^说明$/.test((b.textContent||'').trim()) && b.closest('header'));
    // Next header theme (antd Select)
    const antSelects = [...document.querySelectorAll('.ant-select')].map(el => ({
      text: (el.textContent||'').replace(/\s+/g,' ').trim().slice(0,60),
      nearHeader: !!el.closest('header') || (el.compareDocumentPosition(document.querySelector('h2')) & Node.DOCUMENT_POSITION_FOLLOWING) !== 0,
    }));
    return {
      selects,
      selectIds: selects.map(s => s.id),
      focusBar: !!focusBar,
      headerTabsDisplay,
      themeSelectInIframe: !!themeSelectInIframe,
      resetBtn: !!resetBtn,
      roleEl: !!roleEl,
      asOf: !!asOf,
      helpBtn: !!helpBtn,
      antSelects,
      iframeDataTheme: doc.documentElement.getAttribute('data-theme') || doc.body?.dataset?.theme || null,
      htmlClass: doc.documentElement.className,
      bodyClass: doc.body.className,
    };
  });

  // Try theme change via ant select
  let themeSync = { tried: false };
  try {
    const ant = page.locator('.ant-select').first();
    if (await ant.count()) {
      await ant.click();
      await page.waitForTimeout(300);
      // pick 深蓝主题
      const opt = page.locator('.ant-select-item-option').filter({ hasText: '深蓝' }).first();
      if (await opt.count()) {
        await opt.click();
        await page.waitForTimeout(600);
        themeSync = await page.evaluate(() => {
          const doc = document.querySelector('iframe').contentDocument;
          return {
            tried: true,
            dataTheme: doc.documentElement.getAttribute('data-theme'),
            bodyDataset: doc.body?.getAttribute('data-theme'),
            cssVars: getComputedStyle(doc.documentElement).getPropertyValue('--primary')?.trim() || null,
            htmlAttr: [...doc.documentElement.attributes].map(a => a.name + '=' + a.value).slice(0, 10),
          };
        });
      } else {
        themeSync = { tried: true, error: 'no-blue-option' };
      }
    }
  } catch (e) {
    themeSync = { tried: true, error: String(e) };
  }
  await page.screenshot({ path: path.join(OUT, '05-current-toolbar-theme.png'), fullPage: false });

  const toolbarOk = toolbar.selectIds.length === 3 &&
    toolbar.selectIds.includes('yearSelect') &&
    toolbar.selectIds.includes('unitSelect') &&
    toolbar.selectIds.includes('businessSelect') &&
    !toolbar.focusBar &&
    (toolbar.headerTabsDisplay === 'none' || toolbar.headerTabsDisplay === null) &&
    !toolbar.themeSelectInIframe &&
    !toolbar.resetBtn &&
    !toolbar.roleEl &&
    !toolbar.asOf &&
    !toolbar.helpBtn &&
    toolbar.antSelects.length >= 1;
  toolbarOk ? pass('AC3-toolbar-and-theme-control', { toolbar, themeSync }) : fail('AC3-toolbar-and-theme-control', { toolbar, themeSync });
  themeSync.tried && (themeSync.dataTheme === 'blue' || (themeSync.cssVars && themeSync.cssVars.length > 0) || themeSync.bodyDataset === 'blue')
    ? pass('AC3-theme-iframe-sync', themeSync)
    : fail('AC3-theme-iframe-sync', themeSync);

  // --- AC4: KPI 2x2; cash/risk/delivery/alert full row; contrib|target same row ---
  const layout = await page.evaluate(() => {
    const doc = document.querySelector('iframe').contentDocument;
    const main = doc.querySelector('main');
    const mainCs = getComputedStyle(main);
    const kpi = doc.querySelector('#kpiGrid, .kpi-grid');
    const kpiCs = getComputedStyle(kpi);
    const kpiCards = [...(kpi?.children || [])];
    const rect = (el) => {
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height), right: Math.round(r.right), bottom: Math.round(r.bottom) };
    };
    const cash = rect(doc.querySelector('#cashPanel'));
    const risk = rect(doc.querySelector('#riskPanel'));
    const contrib = rect(doc.querySelector('#contributionPanel'));
    const target = rect(doc.querySelector('#targetPanel'));
    const delivery = rect(doc.querySelector('#deliveryPanel'));
    const alert = rect(doc.querySelector('#alertPanel'));
    const mainRect = rect(main);
    const almostFull = (r) => r && mainRect && r.w >= mainRect.w * 0.85;
    const sameRow = (a, b) => a && b && Math.abs(a.y - b.y) < 40;
    const sideBySide = (a, b) => a && b && sameRow(a, b) && a.w < mainRect.w * 0.7 && b.w < mainRect.w * 0.7;
    // KPI 2x2: 4 cards, two rows
    let kpi2x2 = false;
    if (kpiCards.length >= 4) {
      const rs = kpiCards.slice(0, 4).map(c => rect(c));
      const row1 = rs.filter(r => Math.abs(r.y - rs[0].y) < 20);
      const row2 = rs.filter(r => Math.abs(r.y - rs[0].y) >= 40);
      kpi2x2 = row1.length === 2 && row2.length === 2;
    }
    // panel titles for business meaning smoke
    const titles = [...doc.querySelectorAll('.panel-title')].map(t => t.textContent.replace(/\s+/g,' ').trim()).slice(0, 10);
    return {
      mainCols: mainCs.gridTemplateColumns,
      kpiCols: kpiCs.gridTemplateColumns,
      kpiCardCount: kpiCards.length,
      kpi2x2,
      cash, risk, contrib, target, delivery, alert, mainRect,
      cashFull: almostFull(cash),
      riskFull: almostFull(risk),
      deliveryFull: almostFull(delivery),
      alertFull: almostFull(alert),
      contribTargetSameRow: sideBySide(contrib, target),
      titles,
      middleDisplay: getComputedStyle(doc.querySelector('.middle-grid')).display,
      bottomDisplay: getComputedStyle(doc.querySelector('.bottom-grid')).display,
    };
  });
  await page.screenshot({ path: path.join(OUT, '06-dual-column-layout.png'), fullPage: false });
  // also scroll for lower panels
  await page.evaluate(() => {
    const doc = document.querySelector('iframe').contentDocument;
    doc.querySelector('main').scrollTop = 800;
  });
  await page.waitForTimeout(400);
  await page.screenshot({ path: path.join(OUT, '07-dual-column-lower.png'), fullPage: false });

  const expectedTitles = ['现金流与资金安全', '应收与资金风险', '经营贡献分析', '板块目标达成', '工作负荷与交付保障', '经营异常预警'];
  const titlesOk = expectedTitles.every(t => layout.titles.some(x => x.includes(t)));
  layout.kpi2x2 && layout.cashFull && layout.riskFull && layout.deliveryFull && layout.alertFull && layout.contribTargetSameRow && titlesOk && layout.middleDisplay === 'contents' && layout.bottomDisplay === 'contents'
    ? pass('AC4-layout-and-meaning', layout)
    : fail('AC4-layout-and-meaning', layout);

  // --- AC5: more placeholders distinguishable ---
  await page.locator('button', { hasText: '人力资源看板' }).first().click();
  await page.waitForTimeout(400);
  const phHr = await page.evaluate(() => ({
    h3: document.querySelector('h3')?.textContent?.trim(),
    cards: [...document.querySelectorAll('div')].filter(d => /border-dashed/.test(d.className) && /占位/.test(d.textContent||'')).length,
    shellSelects: [...document.querySelectorAll('select')].filter(s => !s.closest('iframe')).length,
    yearInDom: !!document.querySelector('#yearSelect'),
  }));
  await page.screenshot({ path: path.join(OUT, '08-placeholder-hr.png'), fullPage: false });

  await page.locator('button', { hasText: '完成合同额看板' }).first().click();
  await page.waitForTimeout(400);
  const phDone = await page.evaluate(() => ({
    h3: document.querySelector('h3')?.textContent?.trim(),
    cards: [...document.querySelectorAll('div')].filter(d => /border-dashed/.test(d.className) && /占位/.test(d.textContent||'')).length,
  }));
  await page.screenshot({ path: path.join(OUT, '09-placeholder-completed.png'), fullPage: false });

  phHr.h3 === '人力资源看板' && phHr.cards >= 4 && !phHr.yearInDom && phDone.h3 === '完成合同额看板' && phDone.cards >= 4
    ? pass('AC5-placeholders', { phHr, phDone })
    : fail('AC5-placeholders', { phHr, phDone });

  // AC6 evidence dir written by this script
  pass('AC6-evidence-dir', { out: OUT, files: fs.readdirSync(OUT) });

  fs.writeFileSync(path.join(OUT, 'probe-results.json'), JSON.stringify({ at: new Date().toISOString(), results }, null, 2), 'utf8');
  const failed = results.filter(r => !r.ok);
  console.log('SUMMARY', { total: results.length, failed: failed.length, ids: failed.map(f => f.id) });
  await browser.close();
  process.exit(failed.length ? 1 : 0);
})().catch(err => { console.error(err); process.exit(2); });
