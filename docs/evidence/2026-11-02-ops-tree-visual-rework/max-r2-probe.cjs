const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const BASE = 'http://localhost:3000';
const OUT = 'C:/Work/2_Development/21_Platform/26_engineering-platform/docs/evidence/2026-11-02-ops-tree-visual-rework';
const PREFIX = 'max-r2';

function yOverlap(a, b) {
  return Math.min(a.bottom, b.bottom) > Math.max(a.top, b.top) + 0.5;
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const report = { ts: new Date().toISOString(), actor: 'Max-independent-r2', checks: {}, failures: [] };

  try {
    await page.goto(`${BASE}/operations-dashboard-202610/board`, { waitUntil: 'networkidle', timeout: 90000 });
    await page.waitForTimeout(3000);

    const iframeEl = await page.waitForSelector('iframe', { timeout: 15000 });
    const frame = await iframeEl.contentFrame();
    await frame.waitForSelector('main', { timeout: 20000 });
    await frame.waitForTimeout(2000);

    // === 1 scroll ===
    const scrollInfo = await page.evaluate(() => {
      const iframe = document.querySelector('iframe');
      const fdoc = iframe.contentDocument;
      const fwin = iframe.contentWindow;
      const scrollable = (el) => {
        if (!el) return null;
        const cs = fwin.getComputedStyle(el);
        const oy = cs.overflowY;
        const canScroll = (oy === 'auto' || oy === 'scroll' || oy === 'overlay') && el.scrollHeight > el.clientHeight + 2;
        return { tag: el.tagName, id: el.id, overflowY: oy, scrollHeight: el.scrollHeight, clientHeight: el.clientHeight, canScroll };
      };
      let p = iframe.parentElement;
      const outerScrollers = [];
      while (p) {
        const cs = getComputedStyle(p);
        const can = (cs.overflowY === 'auto' || cs.overflowY === 'scroll') && p.scrollHeight > p.clientHeight + 2;
        if (can || cs.overflowY === 'auto' || cs.overflowY === 'scroll') {
          outerScrollers.push({ tag: p.tagName, className: String(p.className).slice(0,100), overflowY: cs.overflowY, scrollH: p.scrollHeight, clientH: p.clientHeight, canScroll: can });
        }
        p = p.parentElement;
      }
      return {
        iframe: {
          html: scrollable(fdoc.documentElement),
          body: scrollable(fdoc.body),
          app: scrollable(fdoc.querySelector('.app')),
          main: scrollable(fdoc.querySelector('main'))
        },
        outerScrollers,
        mainDisplay: fwin.getComputedStyle(fdoc.querySelector('main')).display,
        mainFlexDir: fwin.getComputedStyle(fdoc.querySelector('main')).flexDirection
      };
    });
    report.scrollInfo = scrollInfo;
    const mainScrolls = !!scrollInfo.iframe.main?.canScroll;
    const htmlScrolls = !!scrollInfo.iframe.html?.canScroll;
    const bodyScrolls = !!scrollInfo.iframe.body?.canScroll;
    const appScrolls = !!scrollInfo.iframe.app?.canScroll;
    const outerAny = scrollInfo.outerScrollers.some(s => s.canScroll);
    report.checks['1_main_only_scroll'] = {
      pass: mainScrolls && !htmlScrolls && !bodyScrolls && !appScrolls && !outerAny,
      mainScrolls, htmlScrolls, bodyScrolls, appScrolls, outerAny,
      main: scrollInfo.iframe.main
    };

    // === 3 dropdowns + blue ===
    const topbar = await frame.evaluate(() => {
      const vh = window.innerHeight;
      const selects = [...document.querySelectorAll('select')].map(s => {
        const r = s.getBoundingClientRect();
        return { id: s.id, name: s.name, value: s.value, text: s.options[s.selectedIndex]?.text, top: r.top, visible: r.top >= 0 && r.top < vh && r.width > 0 };
      });
      return {
        selects,
        dataTheme: document.documentElement.getAttribute('data-theme') || document.body.getAttribute('data-theme'),
        vh
      };
    });
    const themeOuter = await page.evaluate(() => ({
      ant: [...document.querySelectorAll('.ant-select-selection-item')].map(e => e.textContent.trim()),
    }));
    const threeVisible = (topbar.selects || []).filter(s => s.visible).length >= 3;
    const defaultBlue = /blue/i.test(String(topbar.dataTheme || '')) || themeOuter.ant.some(t => /深蓝/.test(t));
    report.checks['3a_three_dropdowns_first_screen'] = { pass: threeVisible, selects: topbar.selects };
    report.checks['3b_default_blue_theme'] = { pass: !!defaultBlue, dataTheme: topbar.dataTheme, ant: themeOuter.ant };

    await page.screenshot({ path: path.join(OUT, `${PREFIX}-01-board-first-screen.png`), fullPage: false });
    await iframeEl.screenshot({ path: path.join(OUT, `${PREFIX}-02-iframe-first-screen.png`) }).catch(()=>{});

    // === geometry boxes + union ===
    const geom = await frame.evaluate(() => {
      const main = document.querySelector('main');
      const st = main.scrollTop;
      const ids = ['kpiGrid','cashPanel','riskPanel','contributionPanel','targetPanel','deliveryPanel','alertPanel'];
      function union(el) {
        const r = el.getBoundingClientRect();
        let top = r.top, bottom = r.bottom, left = r.left, right = r.right;
        el.querySelectorAll('*').forEach(c => {
          const cr = c.getBoundingClientRect();
          if (cr.width > 0 && cr.height > 0) {
            top = Math.min(top, cr.top); bottom = Math.max(bottom, cr.bottom);
            left = Math.min(left, cr.left); right = Math.max(right, cr.right);
          }
        });
        return {
          boxTop: r.top + st, boxBottom: r.bottom + st, boxH: r.height,
          contentTop: top + st, contentBottom: bottom + st, contentH: bottom - top,
          overflow: bottom - r.bottom, width: r.width, left: r.left, right: r.right
        };
      }
      const boxes = ids.map(id => {
        const el = document.getElementById(id);
        if (!el) return { id, missing: true };
        return { id, missing: false, ...union(el) };
      });
      const cashChart = document.getElementById('cashChart') || document.querySelector('.cash-chart-wrap');
      let cashVisual = null;
      if (cashChart) {
        const r = cashChart.getBoundingClientRect();
        const hc = cashChart.querySelector('.highcharts-container, svg');
        const hr = hc ? hc.getBoundingClientRect() : null;
        cashVisual = {
          wrapH: r.height, wrapW: r.width,
          hcH: hr?.height, hcW: hr?.width,
          pathCount: cashChart.querySelectorAll('.highcharts-series path, .highcharts-graph').length,
          clipped: cashChart.scrollHeight > cashChart.clientHeight + 2,
          top: r.top + st, bottom: r.bottom + st
        };
      }
      const targetChart = document.getElementById('targetChart');
      let targetVisual = null;
      if (targetChart) {
        const r = targetChart.getBoundingClientRect();
        const mainR = main.getBoundingClientRect();
        targetVisual = {
          h: r.height, w: r.width, right: r.right,
          clientRight: mainR.left + main.clientWidth,
          clippedBySb: r.right > mainR.left + main.clientWidth + 2,
          sb: main.offsetWidth - main.clientWidth
        };
      }
      const mainStyle = getComputedStyle(main);
      return {
        boxes, cashVisual, targetVisual,
        main: { scrollH: main.scrollHeight, clientH: main.clientHeight, display: mainStyle.display, flexDir: mainStyle.flexDirection, overflowY: mainStyle.overflowY },
        mainChildren: [...main.children].map(ch => ({ id: ch.id, cls: String(ch.className).slice(0,40), tag: ch.tagName, display: getComputedStyle(ch).display, h: ch.getBoundingClientRect().height }))
      };
    });
    report.geometry = geom.boxes;
    report.cashVisual = geom.cashVisual;
    report.targetVisual = geom.targetVisual;
    report.mainMeta = geom.main;
    report.mainChildren = geom.mainChildren;

    // overlap on BOX model (primary AC) and also content union
    const namedBox = Object.fromEntries(geom.boxes.filter(b => !b.missing).map(b => [b.id, { top: b.boxTop, bottom: b.boxBottom, height: b.boxH }]));
    const namedContent = Object.fromEntries(geom.boxes.filter(b => !b.missing).map(b => [b.id, { top: b.contentTop, bottom: b.contentBottom, height: b.contentH }]));
    const pairs = [
      ['kpiGrid','cashPanel'],['cashPanel','riskPanel'],['riskPanel','contributionPanel'],['riskPanel','targetPanel'],
      ['contributionPanel','deliveryPanel'],['targetPanel','deliveryPanel'],['deliveryPanel','alertPanel'],
      ['cashPanel','contributionPanel'],['cashPanel','alertPanel'],['kpiGrid','riskPanel']
    ];
    const boxOverlaps = [];
    const contentOverlaps = [];
    for (const [a,b] of pairs) {
      if (namedBox[a] && namedBox[b] && yOverlap(namedBox[a], namedBox[b])) boxOverlaps.push({ a, b, aY: [namedBox[a].top, namedBox[a].bottom], bY: [namedBox[b].top, namedBox[b].bottom] });
      if (namedContent[a] && namedContent[b] && yOverlap(namedContent[a], namedContent[b])) contentOverlaps.push({ a, b });
    }
    const contribTargetSameRow = namedBox.contributionPanel && namedBox.targetPanel && Math.abs(namedBox.contributionPanel.top - namedBox.targetPanel.top) < 40;
    const anyOverflow = geom.boxes.some(b => !b.missing && b.overflow > 2);
    const cashOk = geom.cashVisual && geom.cashVisual.wrapH >= 200 && !geom.cashVisual.clipped && (geom.cashVisual.hcH == null || geom.cashVisual.hcH >= 150);
    // cash panel must contain chart (box includes chart)
    const cashPanel = geom.boxes.find(b => b.id === 'cashPanel');
    const cashContainsChart = cashPanel && geom.cashVisual && cashPanel.boxTop <= geom.cashVisual.top + 1 && cashPanel.boxBottom >= geom.cashVisual.bottom - 1 && cashPanel.boxH >= 300;

    report.checks['2_cash_trend_visible'] = { pass: !!(cashOk && cashContainsChart && !anyOverflow), cashVisual: geom.cashVisual, cashPanelH: cashPanel?.boxH, cashContainsChart, anyOverflow };
    report.checks['6_geometry_no_y_overlap'] = { pass: boxOverlaps.length === 0 && contentOverlaps.length === 0 && !anyOverflow, boxOverlaps, contentOverlaps, contribTargetSameRow, anyOverflow };
    report.checks['6b_target_not_clipped_by_scrollbar'] = {
      pass: geom.targetVisual && !geom.targetVisual.clippedBySb && geom.targetVisual.h >= 160,
      targetVisual: geom.targetVisual
    };

    // cash screenshot - scroll into view
    await frame.evaluate(() => document.getElementById('cashPanel')?.scrollIntoView({ block: 'center' }));
    await page.waitForTimeout(400);
    await page.screenshot({ path: path.join(OUT, `${PREFIX}-03-cash-trend.png`), fullPage: false });

    await frame.evaluate(() => document.getElementById('targetPanel')?.scrollIntoView({ block: 'center' }));
    await page.waitForTimeout(400);
    await page.screenshot({ path: path.join(OUT, `${PREFIX}-04-target-bars.png`), fullPage: false });

    // === 4 alert at bottom ===
    const alertCheck = await frame.evaluate(() => {
      const main = document.querySelector('main');
      main.scrollTop = main.scrollHeight;
      return new Promise(resolve => {
        requestAnimationFrame(() => {
          const el = document.getElementById('alertPanel');
          if (!el) return resolve({ pass: false, reason: 'missing' });
          const r = el.getBoundingClientRect();
          const mainR = main.getBoundingClientRect();
          const fully = r.top >= mainR.top - 2 && r.bottom <= mainR.bottom + 2;
          const mostly = r.top < mainR.bottom && r.bottom > mainR.top && (Math.min(r.bottom, mainR.bottom) - Math.max(r.top, mainR.top)) / r.height > 0.95;
          resolve({ pass: fully || mostly, fully, mostly, top: r.top, bottom: r.bottom, height: r.height, mainTop: mainR.top, mainBottom: mainR.bottom, scrollTop: main.scrollTop, scrollHeight: main.scrollHeight });
        });
      });
    });
    report.checks['4_alert_fully_visible_at_bottom'] = alertCheck;
    await page.waitForTimeout(300);
    await page.screenshot({ path: path.join(OUT, `${PREFIX}-05-alert-bottom.png`), fullPage: false });

    // === 5 tree theme ===
    async function treeSel() {
      return page.evaluate(() => {
        const nodes = [...document.querySelectorAll('aside *')];
        const label = nodes.find(el => el.childNodes.length && [...el.childNodes].some(n => n.nodeType === 3 && n.textContent.trim() === '当前运营看板'));
        if (!label) return null;
        let p = label;
        while (p && p !== document.body) {
          const cs = getComputedStyle(p);
          if (p.tagName === 'BUTTON' || p.tagName === 'LI' || (cs.backgroundColor !== 'rgba(0, 0, 0, 0)' && cs.backgroundColor !== 'transparent')) {
            return { tag: p.tagName, bg: cs.backgroundColor, color: cs.color, cls: String(p.className).slice(0,100) };
          }
          p = p.parentElement;
        }
        return { tag: label.tagName, bg: getComputedStyle(label).backgroundColor, color: getComputedStyle(label).color };
      });
    }
    const before = await treeSel();
    let after = null;
    try {
      await page.locator('.ant-select').first().click();
      await page.waitForTimeout(350);
      const opt = page.locator('.ant-select-item-option').filter({ hasText: /青绿/ });
      if (await opt.count()) {
        await opt.first().click();
        await page.waitForTimeout(800);
        after = await treeSel();
        await page.locator('.ant-select').first().click();
        await page.waitForTimeout(300);
        await page.locator('.ant-select-item-option').filter({ hasText: /深蓝/ }).first().click();
        await page.waitForTimeout(500);
      } else {
        await page.keyboard.press('Escape');
      }
    } catch (e) {
      report.themeSwitchError = String(e);
    }
    const tealFixed = /rgb\(\s*0\s*,\s*112\s*,\s*105\s*\)|#007069/i.test(before?.bg || '');
    const changed = after && before && after.bg !== before.bg;
    report.checks['5_tree_follows_theme'] = {
      pass: !tealFixed && !!before && (!!changed || /48,\s*109,\s*169|0,\s*139,\s*139/.test(before.bg || '')),
      before, after, changed, tealFixed
    };
    await page.screenshot({ path: path.join(OUT, `${PREFIX}-06-tree-theme.png`), fullPage: false });

    // mid scroll layout
    await frame.evaluate(() => { const m = document.querySelector('main'); m.scrollTop = m.scrollHeight * 0.35; });
    await page.waitForTimeout(300);
    await page.screenshot({ path: path.join(OUT, `${PREFIX}-07-mid-scroll.png`), fullPage: false });

    // delivery clip
    await frame.evaluate(() => document.getElementById('deliveryPanel')?.scrollIntoView({ block: 'center' }));
    await page.waitForTimeout(300);
    await page.screenshot({ path: path.join(OUT, `${PREFIX}-09-delivery.png`), fullPage: false });

    // summarize vs Leo
    report.vsLeo = {
      leoClaimed: { overallPass: true, cashPanelH: 382.8, mainScrollH: 1963, mainClientH: 792, overlaps: [] },
      maxMeasured: {
        cashPanelH: cashPanel?.boxH,
        mainScrollH: geom.main.scrollH,
        mainClientH: geom.main.clientH,
        boxOverlaps: boxOverlaps.length,
        contentOverlaps: contentOverlaps.length,
        cashOverflow: cashPanel?.overflow
      }
    };

    for (const [k, v] of Object.entries(report.checks)) {
      if (!v.pass) report.failures.push(k);
    }
    // hard rule: any overlap/occlusion => fail overall even if some soft checks pass
    report.overallPass = report.failures.length === 0;
    report.screenshots = fs.readdirSync(OUT).filter(f => f.startsWith(PREFIX) && f.endsWith('.png'));

    fs.writeFileSync(path.join(OUT, `${PREFIX}-geometry-table.json`), JSON.stringify(geom.boxes, null, 2));
    fs.writeFileSync(path.join(OUT, `${PREFIX}-probe-result.json`), JSON.stringify(report, null, 2));
    console.log(JSON.stringify({
      overallPass: report.overallPass,
      failures: report.failures,
      checks: Object.fromEntries(Object.entries(report.checks).map(([k,v]) => [k, v.pass])),
      vsLeo: report.vsLeo,
      main: geom.main,
      cashPanelH: cashPanel?.boxH,
      boxOverlaps,
      contentOverlaps
    }, null, 2));
  } catch (e) {
    report.error = String(e && e.stack || e);
    report.overallPass = false;
    fs.writeFileSync(path.join(OUT, `${PREFIX}-probe-result.json`), JSON.stringify(report, null, 2));
    console.error(report.error);
    process.exit(1);
  }
  await browser.close();
})();
