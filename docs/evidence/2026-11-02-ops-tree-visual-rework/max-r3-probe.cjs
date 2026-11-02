const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const BASE = 'http://localhost:3000';
const OUT = 'C:/Work/2_Development/21_Platform/26_engineering-platform/docs/evidence/2026-11-02-ops-tree-visual-rework';
const PREFIX = 'max-r3';

function yOverlap(a, b) {
  return Math.min(a.bottom, b.bottom) > Math.max(a.top, b.top) + 0.5;
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const report = { ts: new Date().toISOString(), actor: 'Max-independent-r3-final', checks: {}, failures: [] };

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
        return { overflowY: oy, scrollHeight: el.scrollHeight, clientHeight: el.clientHeight, canScroll };
      };
      let p = iframe.parentElement;
      const outerScrollers = [];
      while (p) {
        const cs = getComputedStyle(p);
        const can = (cs.overflowY === 'auto' || cs.overflowY === 'scroll') && p.scrollHeight > p.clientHeight + 2;
        if (can) outerScrollers.push({ tag: p.tagName, cls: String(p.className).slice(0,80), canScroll: can });
        p = p.parentElement;
      }
      return {
        html: scrollable(fdoc.documentElement),
        body: scrollable(fdoc.body),
        app: scrollable(fdoc.querySelector('.app')),
        main: scrollable(fdoc.querySelector('main')),
        outerAny: outerScrollers.some(s => s.canScroll),
        outerScrollers
      };
    });
    report.scrollInfo = scrollInfo;
    report.checks['1_main_only_scroll'] = {
      pass: !!scrollInfo.main?.canScroll && !scrollInfo.html?.canScroll && !scrollInfo.body?.canScroll && !scrollInfo.app?.canScroll && !scrollInfo.outerAny,
      ...scrollInfo
    };

    // === 3 dropdowns + blue + 12 title + 13 padding + 14 font ===
    const chrome = await frame.evaluate(() => {
      const vh = window.innerHeight;
      const selects = [...document.querySelectorAll('select')].map(s => {
        const r = s.getBoundingClientRect();
        return { text: s.options[s.selectedIndex]?.text, top: r.top, bottom: r.bottom, visible: r.top >= 0 && r.top < vh && r.width > 0 };
      });
      // title "运营看板202610版"
      const titleHit = [...document.querySelectorAll('h1,h2,.header-title,[class*=title]')].map(el => {
        const cs = getComputedStyle(el);
        const r = el.getBoundingClientRect();
        return {
          text: (el.textContent || '').trim().slice(0, 40),
          display: cs.display, visibility: cs.visibility, opacity: cs.opacity,
          w: r.width, h: r.height, visible: r.width > 0 && r.height > 0 && cs.display !== 'none' && cs.visibility !== 'hidden' && +cs.opacity > 0
        };
      });
      const bodyTextHasTitle = (document.body.innerText || '').includes('运营看板202610版');
      // header padding
      const header = document.querySelector('.header, header, .content-header, .toolbar') || document.querySelector('#main')?.previousElementSibling;
      let headerPad = null;
      let controlsPad = null;
      if (header) {
        const cs = getComputedStyle(header);
        const r = header.getBoundingClientRect();
        headerPad = { padT: parseFloat(cs.paddingTop), padB: parseFloat(cs.paddingBottom), h: r.height, top: r.top, visible: r.bottom > 0 && r.top < vh };
        // control row
        const row = header.querySelector('.header-controls, .filters, .toolbar-right') || header;
        const rcs = getComputedStyle(row);
        controlsPad = { padT: parseFloat(rcs.paddingTop), padB: parseFloat(rcs.paddingBottom), tag: row.tagName, cls: String(row.className).slice(0,60) };
      }
      // font sizes in content
      const main = document.querySelector('main');
      const bodyFs = parseFloat(getComputedStyle(document.body).fontSize);
      const mainFs = main ? parseFloat(getComputedStyle(main).fontSize) : null;
      const samples = [];
      const pick = (sel) => {
        const el = document.querySelector(sel);
        if (!el) return;
        samples.push({ sel, fs: parseFloat(getComputedStyle(el).fontSize), text: (el.textContent||'').trim().slice(0,20) });
      };
      pick('.kpi-card .kpi-value, .kpi-value');
      pick('.panel-head, .panel-title');
      pick('table, .contrib-table, td');
      pick('#cashChart text, .highcharts-axis-labels text');
      // first visible text node style via a label
      const label = document.querySelector('.panel-head span, .panel-head');
      if (label) samples.push({ sel: 'panel-head', fs: parseFloat(getComputedStyle(label).fontSize) });

      return {
        selects, titleHit, bodyTextHasTitle,
        dataTheme: document.documentElement.getAttribute('data-theme'),
        headerPad, controlsPad, bodyFs, mainFs, samples,
        headerHTML: header ? header.outerHTML.slice(0, 600) : null,
        vh
      };
    });
    const themeOuter = await page.evaluate(() => ({
      ant: [...document.querySelectorAll('.ant-select-selection-item')].map(e => e.textContent.trim())
    }));

    const threeVisible = (chrome.selects || []).filter(s => s.visible).length >= 3;
    const defaultBlue = /blue/i.test(String(chrome.dataTheme || '')) || themeOuter.ant.some(t => /深蓝/.test(t));
    report.checks['3a_three_dropdowns_first_screen'] = { pass: threeVisible, selects: chrome.selects };
    report.checks['3b_default_blue_theme'] = { pass: !!defaultBlue, dataTheme: chrome.dataTheme, ant: themeOuter.ant };

    // 12: no title visible
    const titleVisible = chrome.bodyTextHasTitle || (chrome.titleHit || []).some(t => /运营看板202610/.test(t.text) && t.visible);
    report.checks['12_no_dashboard_title'] = { pass: !titleVisible, bodyTextHasTitle: chrome.bodyTextHasTitle, titleHit: chrome.titleHit };

    // 13: increased vertical padding on header / dropdowns still first screen
    // Leo claimed ~20/21 or header padding 14px - we require pad meaningfully > previous tight (was often ~8 or less). Pass if header padT+padB >= 24 OR controls pad >= 16 each, AND three visible
    const padT = chrome.headerPad?.padT ?? 0;
    const padB = chrome.headerPad?.padB ?? 0;
    const cPadT = chrome.controlsPad?.padT ?? 0;
    const cPadB = chrome.controlsPad?.padB ?? 0;
    const paddingIncreased = (padT + padB >= 24) || (cPadT >= 16 && cPadB >= 16) || (padT >= 12 && padB >= 12);
    report.checks['13_dropdown_vertical_padding'] = {
      pass: threeVisible && paddingIncreased,
      threeVisible, padT, padB, cPadT, cPadB, headerPad: chrome.headerPad, controlsPad: chrome.controlsPad
    };

    // 14: font larger - body/main >= 13
    const fontOk = (chrome.mainFs >= 13 || chrome.bodyFs >= 13);
    report.checks['14_content_font_larger'] = {
      pass: fontOk,
      bodyFs: chrome.bodyFs, mainFs: chrome.mainFs, samples: chrome.samples
    };
    report.chrome = chrome;

    await page.screenshot({ path: path.join(OUT, `${PREFIX}-01-board-first-screen.png`), fullPage: false });
    await iframeEl.screenshot({ path: path.join(OUT, `${PREFIX}-02-iframe-first-screen.png`) }).catch(()=>{});

    // === geometry ===
    const geom = await frame.evaluate(() => {
      const main = document.querySelector('main');
      const st = main.scrollTop;
      const ids = ['kpiGrid','cashPanel','riskPanel','contributionPanel','targetPanel','deliveryPanel','alertPanel'];
      function union(el) {
        const r = el.getBoundingClientRect();
        let top = r.top, bottom = r.bottom;
        el.querySelectorAll('*').forEach(c => {
          const cr = c.getBoundingClientRect();
          if (cr.width > 0 && cr.height > 0) { top = Math.min(top, cr.top); bottom = Math.max(bottom, cr.bottom); }
        });
        return {
          boxTop: r.top + st, boxBottom: r.bottom + st, boxH: r.height,
          contentTop: top + st, contentBottom: bottom + st, contentH: bottom - top,
          overflow: bottom - r.bottom
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
          wrapH: r.height, hcH: hr?.height,
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
        targetVisual = { h: r.height, clippedBySb: r.right > mainR.left + main.clientWidth + 2 };
      }
      return {
        boxes, cashVisual, targetVisual,
        main: { scrollH: main.scrollHeight, clientH: main.clientHeight, display: getComputedStyle(main).display, overflowY: getComputedStyle(main).overflowY }
      };
    });
    report.geometry = geom.boxes;
    report.cashVisual = geom.cashVisual;
    report.targetVisual = geom.targetVisual;

    const namedBox = Object.fromEntries(geom.boxes.filter(b => !b.missing).map(b => [b.id, { top: b.boxTop, bottom: b.boxBottom }]));
    const pairs = [
      ['kpiGrid','cashPanel'],['cashPanel','riskPanel'],['riskPanel','contributionPanel'],['riskPanel','targetPanel'],
      ['contributionPanel','deliveryPanel'],['targetPanel','deliveryPanel'],['deliveryPanel','alertPanel'],
      ['cashPanel','contributionPanel'],['kpiGrid','riskPanel']
    ];
    const boxOverlaps = [];
    for (const [a,b] of pairs) {
      if (namedBox[a] && namedBox[b] && yOverlap(namedBox[a], namedBox[b])) boxOverlaps.push({ a, b, aY: [namedBox[a].top, namedBox[a].bottom], bY: [namedBox[b].top, namedBox[b].bottom] });
    }
    const cashPanel = geom.boxes.find(b => b.id === 'cashPanel');
    const cashOk = geom.cashVisual && geom.cashVisual.wrapH >= 200 && !geom.cashVisual.clipped && cashPanel && cashPanel.boxH >= 300 && cashPanel.overflow < 2;
    report.checks['2_cash_trend_visible'] = { pass: !!cashOk, cashVisual: geom.cashVisual, cashPanelH: cashPanel?.boxH, cashOverflow: cashPanel?.overflow };

    // === CRITICAL: loadChart X axis not clipped ===
    const loadCheck = await frame.evaluate(() => {
      const delivery = document.getElementById('deliveryPanel');
      const loadChart = document.getElementById('loadChart');
      if (!delivery || !loadChart) return { ok: false, reason: 'missing' };
      const dcs = getComputedStyle(delivery);
      const box = delivery.getBoundingClientRect();
      const chartBox = loadChart.getBoundingClientRect();
      // X axis label texts
      const labels = [...loadChart.querySelectorAll('.highcharts-xaxis-labels text, .highcharts-axis-labels text')].map(el => {
        const r = el.getBoundingClientRect();
        return {
          text: (el.textContent || '').trim(),
          top: r.top, bottom: r.bottom, h: r.height,
          pastBottom: +(r.bottom - box.bottom).toFixed(2),
          pastTop: +(box.top - r.top).toFixed(2),
          inside: r.bottom <= box.bottom + 0.5 && r.top >= box.top - 0.5 && r.height > 0
        };
      }).filter(l => l.text);
      const monthLabels = labels.filter(l => /\d+月|[A-Za-z]{3}|\d{1,2}/.test(l.text));
      const anyClipped = monthLabels.some(l => !l.inside || l.pastBottom > 0.5);
      const chartPast = +(chartBox.bottom - box.bottom).toFixed(2);
      // also delivery-trend
      const trend = delivery.querySelector('.delivery-trend');
      let trendPast = null;
      if (trend) {
        const tr = trend.getBoundingClientRect();
        trendPast = +(tr.bottom - box.bottom).toFixed(2);
      }
      return {
        deliveryOverflow: dcs.overflowY,
        boxH: box.height,
        chartH: chartBox.height,
        chartPast,
        trendPast,
        labels: monthLabels,
        anyClipped,
        allInside: monthLabels.length > 0 && monthLabels.every(l => l.inside),
        deliveryOverflowPx: (() => {
          let bottom = box.bottom;
          delivery.querySelectorAll('*').forEach(c => {
            const r = c.getBoundingClientRect();
            if (r.height > 0) bottom = Math.max(bottom, r.bottom);
          });
          return +(bottom - box.bottom).toFixed(2);
        })()
      };
    });
    report.loadCheck = loadCheck;
    report.checks['6c_loadChart_xaxis_not_clipped'] = {
      pass: !!loadCheck.allInside && !loadCheck.anyClipped && (loadCheck.chartPast <= 0.5) && (loadCheck.deliveryOverflowPx <= 1),
      loadCheck
    };

    report.checks['6_geometry_no_y_overlap'] = {
      pass: boxOverlaps.length === 0 && geom.boxes.every(b => !b.missing && b.overflow <= 1),
      boxOverlaps,
      overflows: geom.boxes.map(b => ({ id: b.id, overflow: b.overflow }))
    };
    report.checks['6b_target_not_clipped_by_scrollbar'] = {
      pass: geom.targetVisual && !geom.targetVisual.clippedBySb && geom.targetVisual.h >= 160,
      targetVisual: geom.targetVisual
    };

    // screenshots cash / target / delivery
    await frame.evaluate(() => document.getElementById('cashPanel')?.scrollIntoView({ block: 'center' }));
    await page.waitForTimeout(350);
    await page.screenshot({ path: path.join(OUT, `${PREFIX}-03-cash-trend.png`), fullPage: false });

    await frame.evaluate(() => document.getElementById('targetPanel')?.scrollIntoView({ block: 'center' }));
    await page.waitForTimeout(350);
    await page.screenshot({ path: path.join(OUT, `${PREFIX}-04-target-bars.png`), fullPage: false });

    await frame.evaluate(() => document.getElementById('deliveryPanel')?.scrollIntoView({ block: 'center' }));
    await page.waitForTimeout(400);
    await page.screenshot({ path: path.join(OUT, `${PREFIX}-09-delivery-loadchart.png`), fullPage: false });
    // tight clip on loadChart
    const loadClip = await page.evaluate(() => {
      const f = document.querySelector('iframe');
      const fr = f.getBoundingClientRect();
      const el = f.contentDocument.getElementById('loadChart') || f.contentDocument.querySelector('.delivery-trend');
      const d = f.contentDocument.getElementById('deliveryPanel');
      if (!el || !d) return null;
      const r = el.getBoundingClientRect();
      const dr = d.getBoundingClientRect();
      return {
        x: fr.left + Math.min(r.left, dr.left),
        y: Math.max(0, fr.top + r.top - 30),
        width: Math.max(r.width, 400),
        height: Math.min(280, (dr.bottom - r.top) + 40)
      };
    });
    if (loadClip) await page.screenshot({ path: path.join(OUT, `${PREFIX}-10-loadchart-xaxis.png`), clip: loadClip });

    // === 4 alert ===
    const alertCheck = await frame.evaluate(() => {
      const main = document.querySelector('main');
      main.scrollTop = main.scrollHeight;
      return new Promise(resolve => {
        requestAnimationFrame(() => {
          const el = document.getElementById('alertPanel');
          if (!el) return resolve({ pass: false });
          const r = el.getBoundingClientRect();
          const mainR = main.getBoundingClientRect();
          const fully = r.top >= mainR.top - 2 && r.bottom <= mainR.bottom + 2;
          const mostly = (Math.min(r.bottom, mainR.bottom) - Math.max(r.top, mainR.top)) / r.height > 0.95;
          resolve({ pass: fully || mostly, fully, mostly, top: r.top, bottom: r.bottom, h: r.height });
        });
      });
    });
    report.checks['4_alert_fully_visible_at_bottom'] = alertCheck;
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
            return { tag: p.tagName, bg: cs.backgroundColor, color: cs.color };
          }
          p = p.parentElement;
        }
        return null;
      });
    }
    const before = await treeSel();
    let after = null;
    try {
      await page.locator('.ant-select').first().click();
      await page.waitForTimeout(300);
      const opt = page.locator('.ant-select-item-option').filter({ hasText: /青绿/ });
      if (await opt.count()) {
        await opt.first().click();
        await page.waitForTimeout(700);
        after = await treeSel();
        await page.locator('.ant-select').first().click();
        await page.waitForTimeout(250);
        await page.locator('.ant-select-item-option').filter({ hasText: /深蓝/ }).first().click();
        await page.waitForTimeout(400);
      } else await page.keyboard.press('Escape');
    } catch (e) { report.themeErr = String(e); }
    report.checks['5_tree_follows_theme'] = {
      pass: !!before && !!after && before.bg !== after.bg && !/#007069|rgb\(\s*0\s*,\s*112\s*,\s*105\s*\)/i.test(before.bg || ''),
      before, after
    };
    await page.screenshot({ path: path.join(OUT, `${PREFIX}-06-tree-theme.png`), fullPage: false });

    await frame.evaluate(() => { const m = document.querySelector('main'); m.scrollTop = 0; });
    await page.waitForTimeout(300);
    await page.screenshot({ path: path.join(OUT, `${PREFIX}-07-top-header-padding.png`), fullPage: false });

    for (const [k, v] of Object.entries(report.checks)) {
      if (!v.pass) report.failures.push(k);
    }
    // Combine 6: must also pass loadChart
    const sixPass = report.checks['6_geometry_no_y_overlap'].pass
      && report.checks['6b_target_not_clipped_by_scrollbar'].pass
      && report.checks['6c_loadChart_xaxis_not_clipped'].pass;
    report.checks['6_combined'] = { pass: sixPass };

    report.overallPass = report.failures.length === 0;
    report.vsLeo = {
      leo: { overallPass: true, loadChartFixed: true, t80u: true },
      max: {
        overallPass: report.overallPass,
        failures: report.failures,
        cashPanelH: cashPanel?.boxH,
        main: geom.main,
        loadCheck: { allInside: loadCheck.allInside, chartPast: loadCheck.chartPast, overflowPx: loadCheck.deliveryOverflowPx, labels: loadCheck.labels?.map(l => l.text) }
      }
    };

    fs.writeFileSync(path.join(OUT, `${PREFIX}-geometry-table.json`), JSON.stringify(geom.boxes, null, 2));
    fs.writeFileSync(path.join(OUT, `${PREFIX}-probe-result.json`), JSON.stringify(report, null, 2));
    fs.writeFileSync(path.join(OUT, `${PREFIX}-loadchart-check.json`), JSON.stringify(loadCheck, null, 2));
    console.log(JSON.stringify({
      overallPass: report.overallPass,
      failures: report.failures,
      checks: Object.fromEntries(Object.entries(report.checks).map(([k,v]) => [k, v.pass])),
      loadCheck: { allInside: loadCheck.allInside, anyClipped: loadCheck.anyClipped, chartPast: loadCheck.chartPast, overflowPx: loadCheck.deliveryOverflowPx, labels: loadCheck.labels },
      t80u: { title: report.checks['12_no_dashboard_title'].pass, pad: report.checks['13_dropdown_vertical_padding'].pass, font: report.checks['14_content_font_larger'].pass, bodyFs: chrome.bodyFs, mainFs: chrome.mainFs, padT, padB },
      main: geom.main,
      cashPanelH: cashPanel?.boxH,
      boxOverlaps
    }, null, 2));
  } catch (e) {
    console.error(e);
    fs.writeFileSync(path.join(OUT, `${PREFIX}-probe-result.json`), JSON.stringify({ error: String(e.stack || e) }, null, 2));
    process.exit(1);
  }
  await browser.close();
})();
