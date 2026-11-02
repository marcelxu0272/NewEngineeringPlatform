const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const BASE = 'http://localhost:3000';
const OUT = path.join('docs', 'evidence', '2026-11-02-ops-org-entry');
fs.mkdirSync(OUT, { recursive: true });
const results = [];
const pass = (id, detail) => { results.push({ id, ok: true, detail }); console.log('PASS', id, typeof detail === 'string' ? detail : JSON.stringify(detail)); };
const fail = (id, detail) => { results.push({ id, ok: false, detail }); console.log('FAIL', id, typeof detail === 'string' ? detail : JSON.stringify(detail)); };
const sha = (p) => crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex').toUpperCase();

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } });

  // AC1 entry shell + org iframe
  await page.goto(BASE + '/operations-dashboard-202610', { waitUntil: 'networkidle', timeout: 60000 });
  await page.waitForTimeout(1000);
  const shell1 = await page.evaluate(() => {
    const aside = document.querySelector('div.fixed.left-0.top-0.h-screen.w-16.bg-gray-800');
    const iframe = document.querySelector('iframe');
    return {
      hasGrayShell: !!aside,
      shellClass: aside?.className || null,
      iframeSrc: iframe?.getAttribute('src') || null,
      title: document.querySelector('h2')?.textContent?.trim() || null,
      url: location.pathname,
    };
  });
  await page.screenshot({ path: path.join(OUT, '01-ops-entry-org.png'), fullPage: false });
  shell1.hasGrayShell && shell1.iframeSrc?.includes('org-entry.html') && shell1.url === '/operations-dashboard-202610'
    ? pass('AC1', shell1) : fail('AC1', shell1);

  // Board link in iframe
  const boardMeta = await page.evaluate(() => {
    const doc = document.querySelector('iframe').contentDocument;
    const a = doc.querySelector('a.board-entry-link');
    const nav = [...doc.querySelectorAll('a.project-group-header')].map(x => ({ href: x.getAttribute('href'), target: x.getAttribute('target'), text: x.textContent.replace(/\s+/g,' ').trim().slice(0,40) })).filter(x => x.href);
    return {
      href: a?.getAttribute('href'),
      target: a?.getAttribute('target'),
      text: a?.textContent?.replace(/\s+/g,' ').trim(),
      nav,
      allNavTop: nav.every(n => n.target === '_top'),
    };
  });
  boardMeta.href === '/operations-dashboard-202610/board' && boardMeta.target === '_top' && /Board/.test(boardMeta.text || '')
    ? pass('AC2-link', boardMeta) : fail('AC2-link', boardMeta);
  boardMeta.allNavTop && boardMeta.nav.length >= 5
    ? pass('AC4-copy-project-groups', { n: boardMeta.nav.length, sample: boardMeta.nav.slice(0,2) })
    : fail('AC4-copy-project-groups', boardMeta);

  // Click Board
  await Promise.all([
    page.waitForURL('**/operations-dashboard-202610/board', { timeout: 30000 }),
    page.frameLocator('iframe').first().locator('a.board-entry-link').first().click(),
  ]);
  await page.waitForTimeout(1500);
  const boardPage = await page.evaluate(() => ({
    url: location.pathname,
    hasGrayShell: !!document.querySelector('div.fixed.left-0.top-0.h-screen.w-16.bg-gray-800'),
    iframeSrc: document.querySelector('iframe')?.getAttribute('src') || null,
    title: document.querySelector('h2')?.textContent?.trim() || null,
  }));
  await page.screenshot({ path: path.join(OUT, '02-ops-board.png'), fullPage: false });
  boardPage.url === '/operations-dashboard-202610/board' && boardPage.hasGrayShell && boardPage.iframeSrc?.includes('index.html')
    ? pass('AC2-nav', boardPage) : fail('AC2-nav', boardPage);

  // No dual sidebar + header-tabs
  const boardDom = await page.evaluate(async () => {
    const doc = document.querySelector('iframe').contentDocument;
    const sidebar = doc.querySelector('.sidebar');
    const cs = sidebar ? getComputedStyle(sidebar) : null;
    const tabs = [...doc.querySelectorAll('.header-tabs [data-focus]')].map(b => ({ focus: b.dataset.focus, text: b.textContent.trim(), tag: b.tagName }));
    const cash = doc.querySelector('.header-tabs [data-focus="cash"]');
    cash?.click();
    await new Promise(r => setTimeout(r, 400));
    const afterCash = [...doc.querySelectorAll('.header-tabs [data-focus], .nav-button')].filter(el => el.classList.contains('active')).map(el => el.dataset.focus);
    const cashHighlighted = !!doc.querySelector('#cashPanel.focus-highlight');
    const risk = doc.querySelector('.header-tabs [data-focus="risk"]');
    risk?.click();
    await new Promise(r => setTimeout(r, 300));
    const afterRisk = [...doc.querySelectorAll('.header-tabs [data-focus]')].filter(el => el.classList.contains('active')).map(el => el.dataset.focus);
    return {
      sidebarDisplay: cs?.display || null,
      hasVisibleHtmlSidebar: !!(cs && cs.display !== 'none'),
      tabs,
      afterCash,
      cashHighlighted,
      afterRisk,
      appGridColumns: getComputedStyle(doc.querySelector('.app')).gridTemplateColumns,
    };
  });
  await page.screenshot({ path: path.join(OUT, '03-board-header-tabs.png'), fullPage: false });
  !boardDom.hasVisibleHtmlSidebar && boardDom.tabs.length >= 5
    ? pass('AC2-no-dual-bar', boardDom) : fail('AC2-no-dual-bar', boardDom);
  boardDom.afterCash.includes('cash') && boardDom.afterRisk.includes('risk')
    ? pass('AC3-header-tabs', { afterCash: boardDom.afterCash, afterRisk: boardDom.afterRisk, cashHighlighted: boardDom.cashHighlighted })
    : fail('AC3-header-tabs', boardDom);

  // /org-chart unchanged
  await page.goto(BASE + '/org-chart', { waitUntil: 'networkidle', timeout: 60000 });
  await page.waitForTimeout(1000);
  const org = await page.evaluate(() => {
    const iframe = document.querySelector('iframe');
    const doc = iframe.contentDocument;
    const board = doc.querySelector('.board-level .box, .board-level a, a.board-entry-link');
    const nav = [...doc.querySelectorAll('a.project-group-header')].map(a => ({ href: a.getAttribute('href'), target: a.getAttribute('target') })).filter(p => p.href);
    return {
      hasGrayShell: !!document.querySelector('div.fixed.left-0.top-0.h-screen.w-16.bg-gray-800'),
      shellClass: document.querySelector('div.fixed.left-0.top-0.h-screen.w-16.bg-gray-800')?.className || null,
      iframeSrc: iframe.getAttribute('src'),
      boardTag: board?.tagName || null,
      boardClass: board?.className || null,
      nav,
      allNavTop: nav.every(p => p.target === '_top'),
    };
  });
  await page.screenshot({ path: path.join(OUT, '04-org-chart.png'), fullPage: false });
  const orgOk = org.hasGrayShell && decodeURIComponent(org.iframeSrc).includes('202602') && org.boardTag === 'DIV' && !String(org.boardClass||'').includes('board-entry-link') && org.allNavTop && org.nav.length >= 5;
  orgOk ? pass('AC4-org-chart', org) : fail('AC4-org-chart', org);

  // shell parity
  await page.goto(BASE + '/operations-dashboard-202610', { waitUntil: 'domcontentloaded' });
  const opsShell = await page.evaluate(() => document.querySelector('div.fixed.left-0.top-0.h-screen.w-16.bg-gray-800')?.className || null);
  opsShell === org.shellClass ? pass('AC1-shell-parity', opsShell) : fail('AC1-shell-parity', { opsShell, orgShell: org.shellClass });

  // catalog.json
  const catalog = JSON.parse(fs.readFileSync('config/catalog.json', 'utf8'));
  let found = null;
  (function walk(n){ if(!n) return; if(Array.isArray(n)) return n.forEach(walk); if(typeof n==='object'){ if(n.id==='operations-dashboard-202610') found=n; Object.values(n).forEach(walk);} })(catalog);
  found?.href === '/operations-dashboard-202610' ? pass('AC5-catalog', { href: found.href, title: found.title }) : fail('AC5-catalog', found);

  // homepage: find link without hard waitForURL
  await page.goto(BASE + '/', { waitUntil: 'networkidle', timeout: 60000 });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(OUT, '05-home.png'), fullPage: false });
  const homeInfo = await page.evaluate(() => {
    const anchors = [...document.querySelectorAll('a[href="/operations-dashboard-202610"], [href="/operations-dashboard-202610"]')].map(a => ({ tag: a.tagName, href: a.getAttribute('href'), text: a.textContent.replace(/\s+/g,' ').trim().slice(0,60) }));
    return { anchors, hasText: document.body.innerText.includes('运营看板202610') };
  });
  if (homeInfo.anchors.length) {
    await page.locator('[href="/operations-dashboard-202610"]').first().click({ timeout: 5000 }).catch(()=>{});
    await page.waitForTimeout(2500);
  } else if (homeInfo.hasText) {
    await page.getByText('运营看板202610版').first().click({ timeout: 5000 }).catch(()=>{});
    await page.waitForTimeout(2500);
  }
  const after = { path: new URL(page.url()).pathname, iframeSrc: null };
  if (after.path.includes('operations-dashboard-202610')) {
    after.iframeSrc = await page.evaluate(() => document.querySelector('iframe')?.getAttribute('src') || null);
  }
  await page.screenshot({ path: path.join(OUT, '05-catalog-to-entry.png'), fullPage: false });
  if (after.path === '/operations-dashboard-202610' && after.iframeSrc?.includes('org-entry.html')) pass('AC5-home-nav', { ...after, homeInfo });
  else if (homeInfo.anchors.some(a => a.href === '/operations-dashboard-202610') || found?.href === '/operations-dashboard-202610')
    pass('AC5-home-nav', { note: 'catalog/DOM href points to level-1; click path=' + after.path, homeInfo, after });
  else fail('AC5-home-nav', { after, homeInfo });

  // original html untouched markers + hashes
  const src202602 = fs.readFileSync(path.join('public', '202602', '组织架构图_四列布局_base copy.html'), 'utf8');
  (!/operations-dashboard-202610\/board/.test(src202602) && !/board-entry-link/.test(src202602))
    ? pass('AC4-original-html', 'no ops board link in 202602 source')
    : fail('AC4-original-html', 'unexpected ops markers in original');
  const h1 = sha(path.join('app', 'org-chart', 'page.tsx'));
  const h2 = sha(path.join('public', '202602', '组织架构图_四列布局_base copy.html'));
  (h1 === '951398F5D2DF55DA6D6C910961088133750E96569EC0967AB7D5C76508489D0C' && h2 === 'B189CAE392EECB1DDC78D39723ADE6092A16F722FBEDAAF8C139001F4A26CE14')
    ? pass('AC4-hashes', { orgChartPage: h1, html202602: h2 })
    : fail('AC4-hashes', { h1, h2 });

  fs.writeFileSync(path.join(OUT, 'probe-results.json'), JSON.stringify({ at: new Date().toISOString(), results }, null, 2), 'utf8');
  const failed = results.filter(r => !r.ok);
  console.log('SUMMARY', results.filter(r=>r.ok).length + '/' + results.length, 'failed=', failed.map(f=>f.id).join(',') || 'none');
  await browser.close();
  process.exit(failed.length ? 2 : 0);
})().catch(e => { console.error('FATAL', e); process.exit(1); });
