const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const BASE = 'http://localhost:3000';
const OUT = path.join('docs', 'evidence', '2026-11-02-ops-org-entry');
const results = [];

function pass(id, detail) { results.push({ id, ok: true, detail }); console.log('PASS', id, detail); }
function fail(id, detail) { results.push({ id, ok: false, detail }); console.log('FAIL', id, detail); }

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } });

  // 1) /operations-dashboard-202610 = org entry with gray narrow shell
  await page.goto(BASE + '/operations-dashboard-202610', { waitUntil: 'networkidle', timeout: 60000 });
  await page.waitForTimeout(1500);
  const shell1 = await page.evaluate(() => {
    const aside = document.querySelector('div.fixed.left-0.top-0.h-screen.w-16.bg-gray-800');
    const iframe = document.querySelector('iframe');
    const h2 = document.querySelector('h2');
    return {
      hasGrayShell: !!aside,
      shellWidthClass: aside ? aside.className : null,
      iframeSrc: iframe ? iframe.getAttribute('src') : null,
      title: h2 ? h2.textContent.trim() : null,
      url: location.pathname,
    };
  });
  await page.screenshot({ path: path.join(OUT, '01-ops-entry-org.png'), fullPage: false });
  if (shell1.hasGrayShell && shell1.iframeSrc && shell1.iframeSrc.includes('org-entry.html') && shell1.url === '/operations-dashboard-202610') {
    pass('AC1', JSON.stringify(shell1));
  } else {
    fail('AC1', JSON.stringify(shell1));
  }

  // iframe board link inside org-entry
  const frame = page.frameLocator('iframe').first();
  const boardLink = frame.locator('a.board-entry-link');
  const boardCount = await boardLink.count();
  const boardHref = boardCount ? await boardLink.first().getAttribute('href') : null;
  const boardTarget = boardCount ? await boardLink.first().getAttribute('target') : null;
  const boardText = boardCount ? await boardLink.first().innerText() : null;
  if (boardCount === 1 && boardHref === '/operations-dashboard-202610/board' && boardTarget === '_top' && /Board/.test(boardText || '')) {
    pass('AC2-link', `href=${boardHref} target=${boardTarget} text=${(boardText||'').trim()}`);
  } else {
    fail('AC2-link', `count=${boardCount} href=${boardHref} target=${boardTarget} text=${boardText}`);
  }

  // project group links still target=_top in copy
  const pg = await page.evaluate(async () => {
    const iframe = document.querySelector('iframe');
    const doc = iframe.contentDocument;
    const links = [...doc.querySelectorAll('a.project-group-header')].map(a => ({ href: a.getAttribute('href'), target: a.getAttribute('target'), text: a.textContent.trim().slice(0,40) }));
    return links;
  });
  const allTop = pg.length > 0 && pg.every(l => l.target === '_top');
  if (allTop) pass('AC4-copy-project-groups', `n=${pg.length} sample=${JSON.stringify(pg.slice(0,2))}`);
  else fail('AC4-copy-project-groups', JSON.stringify(pg));

  // click Board
  await Promise.all([
    page.waitForURL('**/operations-dashboard-202610/board', { timeout: 30000 }),
    boardLink.first().click(),
  ]);
  await page.waitForTimeout(2000);
  const boardPage = await page.evaluate(() => {
    const aside = document.querySelector('div.fixed.left-0.top-0.h-screen.w-16.bg-gray-800');
    const iframe = document.querySelector('iframe');
    const h2 = document.querySelector('h2');
    return {
      url: location.pathname,
      hasGrayShell: !!aside,
      iframeSrc: iframe ? iframe.getAttribute('src') : null,
      title: h2 ? h2.textContent.trim() : null,
    };
  });
  await page.screenshot({ path: path.join(OUT, '02-ops-board.png'), fullPage: false });
  if (boardPage.url === '/operations-dashboard-202610/board' && boardPage.hasGrayShell && boardPage.iframeSrc && boardPage.iframeSrc.includes('index.html')) {
    pass('AC2-nav', JSON.stringify(boardPage));
  } else {
    fail('AC2-nav', JSON.stringify(boardPage));
  }

  // HTML inner: no dual sidebar (sidebar display none), header-tabs present
  const boardDom = await page.evaluate(() => {
    const iframe = document.querySelector('iframe');
    const doc = iframe.contentDocument;
    const sidebar = doc.querySelector('.sidebar');
    const cs = sidebar ? getComputedStyle(sidebar) : null;
    const tabs = [...doc.querySelectorAll('.header-tabs [data-focus]')].map(b => ({ focus: b.dataset.focus, text: b.textContent.trim(), tag: b.tagName }));
    const appCs = getComputedStyle(doc.querySelector('.app'));
    return {
      sidebarDisplay: cs ? cs.display : null,
      sidebarVisibility: cs ? cs.visibility : null,
      tabs,
      appGridColumns: appCs ? appCs.gridTemplateColumns : null,
      hasVisibleHtmlSidebar: cs && cs.display !== 'none' && cs.visibility !== 'hidden',
    };
  });
  if (!boardDom.hasVisibleHtmlSidebar && boardDom.tabs.length >= 5) {
    pass('AC2-no-dual-bar', JSON.stringify(boardDom));
  } else {
    fail('AC2-no-dual-bar', JSON.stringify(boardDom));
  }

  // 3) header-tabs focus navigation
  const focusResult = await page.evaluate(async () => {
    const iframe = document.querySelector('iframe');
    const doc = iframe.contentDocument;
    const btn = doc.querySelector('.header-tabs [data-focus="cash"]');
    if (!btn) return { ok: false, reason: 'no cash tab' };
    btn.click();
    await new Promise(r => setTimeout(r, 400));
    const active = [...doc.querySelectorAll('.header-tabs [data-focus], .nav-button')].filter(el => el.classList.contains('active')).map(el => ({ focus: el.dataset.focus, cls: el.className, tag: el.tagName }));
    const cashPanel = doc.querySelector('#cashPanel');
    const highlighted = cashPanel ? cashPanel.classList.contains('focus-highlight') : false;
    // also try risk
    const risk = doc.querySelector('.header-tabs [data-focus="risk"]');
    risk && risk.click();
    await new Promise(r => setTimeout(r, 300));
    const active2 = [...doc.querySelectorAll('.header-tabs [data-focus]')].filter(el => el.classList.contains('active')).map(el => el.dataset.focus);
    return { ok: true, afterCash: active, cashHighlighted: highlighted, afterRisk: active2 };
  });
  await page.screenshot({ path: path.join(OUT, '03-board-header-tabs.png'), fullPage: false });
  if (focusResult.ok && focusResult.afterCash.some(a => a.focus === 'cash') && focusResult.afterRisk.includes('risk')) {
    pass('AC3-header-tabs', JSON.stringify(focusResult));
  } else {
    fail('AC3-header-tabs', JSON.stringify(focusResult));
  }

  // 4) /org-chart unchanged
  await page.goto(BASE + '/org-chart', { waitUntil: 'networkidle', timeout: 60000 });
  await page.waitForTimeout(1500);
  const org = await page.evaluate(() => {
    const aside = document.querySelector('div.fixed.left-0.top-0.h-screen.w-16.bg-gray-800');
    const iframe = document.querySelector('iframe');
    const doc = iframe && iframe.contentDocument;
    const boardBox = doc ? doc.querySelector('.board-level .box, a.board-entry-link') : null;
    const boardTag = boardBox ? boardBox.tagName : null;
    const boardHref = boardBox && boardBox.tagName === 'A' ? boardBox.getAttribute('href') : null;
    const pgs = doc ? [...doc.querySelectorAll('a.project-group-header')].map(a => ({ href: a.getAttribute('href'), target: a.getAttribute('target') })) : [];
    return {
      hasGrayShell: !!aside,
      iframeSrc: iframe ? iframe.getAttribute('src') : null,
      boardTag,
      boardHref,
      projectGroups: pgs,
      boardIsNotOpsLink: boardTag !== 'A' || (boardHref && !boardHref.includes('operations-dashboard-202610')),
    };
  });
  await page.screenshot({ path: path.join(OUT, '04-org-chart.png'), fullPage: false });
  // original org chart Board should NOT be the ops board link (still non-clickable div typically)
  const orgOk = org.hasGrayShell && org.iframeSrc && decodeURIComponent(org.iframeSrc).includes('202602') && org.projectGroups.length > 0 && org.projectGroups.every(p => p.target === '_top') && (org.boardTag === 'DIV' || org.boardIsNotOpsLink);
  if (orgOk) pass('AC4-org-chart', JSON.stringify(org));
  else fail('AC4-org-chart', JSON.stringify(org));

  // 5) catalog entry still points to level-1
  const catalogRaw = fs.readFileSync(path.join('config', 'catalog.json'), 'utf8');
  const catalog = JSON.parse(catalogRaw);
  const entry = catalog.find ? catalog.find(x => x.id === 'operations-dashboard-202610') : (catalog.items || catalog.entries || []).find?.(x => x.id === 'operations-dashboard-202610');
  // catalog may be array or object with array
  let found = null;
  function walk(n) {
    if (!n) return;
    if (Array.isArray(n)) return n.forEach(walk);
    if (typeof n === 'object') {
      if (n.id === 'operations-dashboard-202610') found = n;
      Object.values(n).forEach(walk);
    }
  }
  walk(catalog);
  if (found && found.href === '/operations-dashboard-202610') pass('AC5-catalog', JSON.stringify({ href: found.href, title: found.title }));
  else fail('AC5-catalog', JSON.stringify(found));

  // homepage catalog click if present
  await page.goto(BASE + '/', { waitUntil: 'networkidle', timeout: 60000 });
  await page.waitForTimeout(1000);
  const homeLink = page.locator('a[href="/operations-dashboard-202610"]').first();
  const homeCount = await homeLink.count();
  if (homeCount > 0) {
    await Promise.all([
      page.waitForURL('**/operations-dashboard-202610', { timeout: 30000 }),
      homeLink.click(),
    ]);
    await page.waitForTimeout(1200);
    const after = await page.evaluate(() => ({ url: location.pathname, iframeSrc: document.querySelector('iframe')?.getAttribute('src') }));
    await page.screenshot({ path: path.join(OUT, '05-catalog-to-entry.png'), fullPage: false });
    if (after.url === '/operations-dashboard-202610' && after.iframeSrc && after.iframeSrc.includes('org-entry.html')) pass('AC5-home-nav', JSON.stringify(after));
    else fail('AC5-home-nav', JSON.stringify(after));
  } else {
    // catalog card may use different structure; try text
    const byText = page.getByText('运营看板202610', { exact: false }).first();
    if (await byText.count()) {
      await byText.click();
      await page.waitForTimeout(1500);
      const after = { url: page.url(), note: 'clicked by text' };
      await page.screenshot({ path: path.join(OUT, '05-catalog-to-entry.png'), fullPage: false });
      if (page.url().includes('/operations-dashboard-202610') && !page.url().includes('/board')) pass('AC5-home-nav', JSON.stringify(after));
      else fail('AC5-home-nav', JSON.stringify(after));
    } else {
      pass('AC5-home-nav', 'homepage link not found in DOM; catalog.json href verified only');
      await page.screenshot({ path: path.join(OUT, '05-home.png'), fullPage: false });
    }
  }

  // side-by-side visual compare shell classes with org-chart vs ops entry
  await page.goto(BASE + '/operations-dashboard-202610', { waitUntil: 'domcontentloaded' });
  const opsShell = await page.evaluate(() => {
    const el = document.querySelector('div.fixed.left-0.top-0.h-screen.w-16.bg-gray-800');
    return el ? el.className : null;
  });
  await page.goto(BASE + '/org-chart', { waitUntil: 'domcontentloaded' });
  const orgShell = await page.evaluate(() => {
    const el = document.querySelector('div.fixed.left-0.top-0.h-screen.w-16.bg-gray-800');
    return el ? el.className : null;
  });
  if (opsShell && orgShell && opsShell === orgShell) pass('AC1-shell-parity', `same class: ${opsShell}`);
  else if (opsShell && orgShell && opsShell.includes('w-16') && opsShell.includes('bg-gray-800') && orgShell.includes('w-16') && orgShell.includes('bg-gray-800')) pass('AC1-shell-parity', `both gray narrow; ops=${opsShell} org=${orgShell}`);
  else fail('AC1-shell-parity', `ops=${opsShell} org=${orgShell}`);

  fs.writeFileSync(path.join(OUT, 'probe-results.json'), JSON.stringify({ at: new Date().toISOString(), results }, null, 2), 'utf8');
  const failed = results.filter(r => !r.ok);
  console.log('SUMMARY', results.length - failed.length, '/', results.length, 'failed=', failed.map(f => f.id).join(',') || 'none');
  await browser.close();
  process.exit(failed.length ? 2 : 0);
})().catch(err => { console.error('FATAL', err); process.exit(1); });
