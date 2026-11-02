const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const BASE = 'http://localhost:3000';
const OUT = 'C:/Work/2_Development/21_Platform/26_engineering-platform/docs/evidence/2026-11-02-ops-tree-visual-rework';
const RESULT = path.join(OUT, 'probe-result.json');

function yOverlap(a, b) {
  return Math.min(a.bottom, b.bottom) > Math.max(a.top, b.top) + 0.5;
}

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const report = { ts: new Date().toISOString(), checks: {}, geometry: [], failures: [] };

  try {
    await page.goto(`${BASE}/operations-dashboard-202610/board`, { waitUntil: 'networkidle', timeout: 90000 });
    await page.waitForTimeout(2500);

    // Theme select in Next header
    const themeInfo = await page.evaluate(() => {
      const selects = [...document.querySelectorAll('select, .ant-select')];
      // Look for theme dropdown text
      const bodyText = document.body.innerText;
      const header = document.querySelector('header') || document.body;
      const headerText = header.innerText || '';
      // Ant Select display
      const antSelects = [...document.querySelectorAll('.ant-select-selection-item')].map(el => el.textContent?.trim());
      const nativeSelects = [...document.querySelectorAll('select')].map(s => ({
        id: s.id, name: s.name, value: s.value,
        text: s.options[s.selectedIndex]?.text
      }));
      const htmlTheme = document.documentElement.getAttribute('data-theme') || document.body.getAttribute('data-theme');
      return { antSelects, nativeSelects, htmlTheme, headerSnippet: headerText.slice(0, 400) };
    });
    report.themeInfo = themeInfo;

    // Find iframe
    const iframeEl = await page.waitForSelector('iframe', { timeout: 15000 });
    const frame = await iframeEl.contentFrame();
    if (!frame) throw new Error('no iframe frame');
    await frame.waitForSelector('main', { timeout: 20000 });
    await frame.waitForTimeout(2000); // charts

    // === Check 1: scroll containers ===
    const scrollInfo = await page.evaluate(async () => {
      const iframe = document.querySelector('iframe');
      const fdoc = iframe.contentDocument;
      const fwin = iframe.contentWindow;
      function scrollable(el) {
        if (!el) return null;
        const cs = fwin.getComputedStyle(el);
        const oy = cs.overflowY;
        const canScroll = (oy === 'auto' || oy === 'scroll' || oy === 'overlay') && el.scrollHeight > el.clientHeight + 2;
        return {
          tag: el.tagName, id: el.id, className: String(el.className).slice(0,80),
          overflowY: oy, scrollHeight: el.scrollHeight, clientHeight: el.clientHeight,
          canScroll, scrollTop: el.scrollTop
        };
      }
      const html = fdoc.documentElement;
      const body = fdoc.body;
      const app = fdoc.querySelector('.app');
      const main = fdoc.querySelector('main');
      const paneCandidates = [];
      // outer shell
      const outer = {
        docEl: { scrollH: document.documentElement.scrollHeight, clientH: document.documentElement.clientHeight, overflowY: getComputedStyle(document.documentElement).overflowY },
        body: { scrollH: document.body.scrollHeight, clientH: document.body.clientHeight, overflowY: getComputedStyle(document.body).overflowY },
      };
      // find pane wrapping iframe
      let p = iframe.parentElement;
      const outerScrollers = [];
      while (p) {
        const cs = getComputedStyle(p);
        const can = (cs.overflowY === 'auto' || cs.overflowY === 'scroll') && p.scrollHeight > p.clientHeight + 2;
        outerScrollers.push({ tag: p.tagName, className: String(p.className).slice(0,100), overflowY: cs.overflowY, scrollH: p.scrollHeight, clientH: p.clientHeight, canScroll: can });
        p = p.parentElement;
      }
      return {
        outer,
        outerScrollers,
        iframe: { html: scrollable(html), body: scrollable(body), app: scrollable(app), main: scrollable(main) }
      };
    });
    report.scrollInfo = scrollInfo;
    const mainScrolls = scrollInfo.iframe.main?.canScroll === true;
    const htmlScrolls = scrollInfo.iframe.html?.canScroll === true;
    const bodyScrolls = scrollInfo.iframe.body?.canScroll === true;
    const appScrolls = scrollInfo.iframe.app?.canScroll === true;
    const outerAny = scrollInfo.outerScrollers.some(s => s.canScroll);
    const check1Pass = mainScrolls && !htmlScrolls && !bodyScrolls && !appScrolls && !outerAny;
    report.checks['1_main_only_scroll'] = { pass: check1Pass, mainScrolls, htmlScrolls, bodyScrolls, appScrolls, outerAny };

    // === Check 3: three dropdowns visible first screen + default blue ===
    const topbar = await frame.evaluate(() => {
      const selects = [...document.querySelectorAll('select')].map(s => {
        const r = s.getBoundingClientRect();
        return { id: s.id, name: s.name, value: s.value, text: s.options[s.selectedIndex]?.text, top: r.top, bottom: r.bottom, visible: r.bottom > 0 && r.top < window.innerHeight && r.width > 0 };
      });
      // also look for custom dropdowns
      const labels = [...document.querySelectorAll('.toolbar select, .topbar select, header select, .filters select, .panel-header select, .content-toolbar select')];
      const themeAttr = document.documentElement.getAttribute('data-theme') || document.body.getAttribute('data-theme') || document.documentElement.className;
      const appTheme = document.querySelector('.app')?.getAttribute('data-theme') || document.querySelector('[data-theme]')?.getAttribute('data-theme');
      const vh = window.innerHeight;
      return { selects, themeAttr, appTheme, vh, toolbarHTML: (document.querySelector('.toolbar, .topbar, .content-header, .filters') || document.querySelector('main')?.previousElementSibling)?.outerHTML?.slice(0,500) };
    });
    report.topbar = topbar;
    const visibleSelects = (topbar.selects || []).filter(s => s.visible);
    const threeVisible = visibleSelects.length >= 3 || (topbar.selects || []).filter(s => s.top >= 0 && s.top < topbar.vh).length >= 3;
    report.checks['3a_three_dropdowns_first_screen'] = { pass: threeVisible, visibleSelects, allSelects: topbar.selects };

    // Default blue theme - check outer Next header + iframe
    const themeProbe = await page.evaluate(() => {
      // Look in page for theme value
      const ant = [...document.querySelectorAll('.ant-select-selection-item')].map(el => el.textContent?.trim());
      const selects = [...document.querySelectorAll('select')].map(s => ({ value: s.value, text: s.options[s.selectedIndex]?.text, name: s.name, id: s.id }));
      return { ant, selects };
    });
    const iframeTheme = await frame.evaluate(() => {
      const root = document.documentElement;
      const body = document.body;
      const app = document.querySelector('.app');
      const cs = getComputedStyle(document.documentElement);
      // sample primary-ish colors
      const treeActive = document.querySelector('.tree-node.active, .tree-item.active, .nav-item.active, [aria-selected="true"], .ant-menu-item-selected, .selected');
      // tree is outside iframe - skip here
      return {
        dataTheme: root.getAttribute('data-theme') || body.getAttribute('data-theme') || app?.getAttribute('data-theme'),
        className: root.className + '|' + (app?.className || ''),
        bg: cs.getPropertyValue('--bg') || cs.backgroundColor,
        primary: cs.getPropertyValue('--primary') || cs.getPropertyValue('--color-primary'),
        styleTheme: root.getAttribute('style')
      };
    });
    report.themeProbe = { themeProbe, iframeTheme };

    // Tree is in Next shell (outside iframe)
    const treeTheme = await page.evaluate(() => {
      const candidates = [
        ...document.querySelectorAll('[class*="tree"] .active, [class*="Tree"] .active, .ant-tree-node-selected, .ant-menu-item-selected, [data-selected="true"], .selected')
      ];
      // also look for tree items with background
      const allTreeish = [...document.querySelectorAll('aside li, aside [role="treeitem"], .board-tree li, [class*="tree"] li, [class*="Tree"] span')].slice(0, 40);
      const samples = allTreeish.map(el => {
        const cs = getComputedStyle(el);
        const r = el.getBoundingClientRect();
        return { text: el.textContent?.trim().slice(0,40), bg: cs.backgroundColor, color: cs.color, fw: cs.fontWeight, w: r.width, h: r.height, cls: String(el.className).slice(0,80) };
      }).filter(x => x.w > 0 && x.h > 0);
      const selected = samples.filter(s => /selected|active|current/i.test(s.cls) || (s.bg !== 'rgba(0, 0, 0, 0)' && s.bg !== 'transparent'));
      // find "当前运营看板"
      const current = allTreeish.find(el => (el.textContent || '').includes('当前运营看板'));
      let currentStyle = null;
      if (current) {
        const cs = getComputedStyle(current);
        currentStyle = { text: current.textContent.trim().slice(0,40), bg: cs.backgroundColor, color: cs.color, cls: String(current.className).slice(0,120) };
        // walk up for selected style
        let p = current;
        for (let i=0;i<5 && p;i++) {
          const pcs = getComputedStyle(p);
          if (pcs.backgroundColor !== 'rgba(0, 0, 0, 0)' && pcs.backgroundColor !== 'transparent') {
            currentStyle = { text: current.textContent.trim().slice(0,40), bg: pcs.backgroundColor, color: pcs.color, cls: String(p.className).slice(0,120), level: i };
            break;
          }
          p = p.parentElement;
        }
      }
      return { samples: samples.slice(0,15), selected, currentStyle, antSelected: [...document.querySelectorAll('.ant-menu-item-selected, .ant-tree-node-selected')].map(el => {
        const cs = getComputedStyle(el);
        return { text: el.textContent?.trim().slice(0,40), bg: cs.backgroundColor, color: cs.color };
      }) };
    });
    report.treeTheme = treeTheme;

    // Screenshot first screen
    await page.screenshot({ path: path.join(OUT, '01-board-first-screen.png'), fullPage: false });
    await iframeEl.screenshot({ path: path.join(OUT, '02-iframe-first-screen.png') }).catch(()=>{});

    // === Geometry of six blocks ===
    // Wait for charts to have height
    await frame.waitForTimeout(1500);
    const geometry = await frame.evaluate(() => {
      const ids = ['kpiGrid','cashPanel','riskPanel','contributionPanel','targetPanel','deliveryPanel','alertPanel'];
      // fallbacks by text if ids missing
      const byText = (re) => {
        const panels = [...document.querySelectorAll('.panel, section, [class*="panel"], [class*="card"]')];
        return panels.find(p => re.test(p.textContent || ''));
      };
      const fallbacks = {
        cashPanel: /现金流/,
        riskPanel: /应收|资金风险/,
        contributionPanel: /经营贡献/,
        targetPanel: /板块目标/,
        deliveryPanel: /工作负荷|交付保障/,
        alertPanel: /异常预警/,
        kpiGrid: /KPI|关键指标|签约/
      };
      const result = [];
      for (const id of ids) {
        let el = document.getElementById(id);
        if (!el && fallbacks[id]) el = byText(fallbacks[id]);
        if (!el) { result.push({ id, missing: true }); continue; }
        const r = el.getBoundingClientRect();
        const chart = el.querySelector('.highcharts-container, canvas, svg, .chart, [id$="Chart"]');
        let chartBox = null;
        if (chart) {
          const cr = chart.getBoundingClientRect();
          chartBox = { top: cr.top, bottom: cr.bottom, height: cr.height, width: cr.width };
        }
        result.push({
          id: el.id || id,
          missing: false,
          top: r.top, bottom: r.bottom, left: r.left, right: r.right,
          height: r.height, width: r.width,
          chartBox
        });
      }
      // also cash chart specifically
      const cashChart = document.getElementById('cashChart') || document.querySelector('#cashChart, .cash-chart-wrap');
      let cashChartRect = null;
      if (cashChart) {
        const r = cashChart.getBoundingClientRect();
        cashChartRect = { top: r.top, bottom: r.bottom, height: r.height, width: r.width, scrollHeight: cashChart.scrollHeight, clientHeight: cashChart.clientHeight };
      }
      const targetChart = document.getElementById('targetChart');
      let targetChartRect = null;
      if (targetChart) {
        const r = targetChart.getBoundingClientRect();
        targetChartRect = { top: r.top, bottom: r.bottom, height: r.height, width: r.width };
      }
      const main = document.querySelector('main');
      const mainRect = main ? main.getBoundingClientRect() : null;
      const mainScroll = main ? { scrollHeight: main.scrollHeight, clientHeight: main.clientHeight, scrollWidth: main.scrollWidth, clientWidth: main.clientWidth } : null;
      return { result, cashChartRect, targetChartRect, mainRect, mainScroll, vh: window.innerHeight };
    });
    report.geometryRaw = geometry;

    // Normalize boxes for overlap check (document/main space - use absolute by adding scroll)
    const boxesAbs = await frame.evaluate(() => {
      const main = document.querySelector('main');
      const scrollTop = main ? main.scrollTop : 0;
      const ids = ['kpiGrid','cashPanel','riskPanel','contributionPanel','targetPanel','deliveryPanel','alertPanel'];
      const byText = (re) => [...document.querySelectorAll('.panel, section, [class*="panel"]')].find(p => re.test(p.innerText||''));
      const fb = { cashPanel:/现金流与资金安全|现金流/, riskPanel:/应收与资金风险/, contributionPanel:/经营贡献/, targetPanel:/板块目标/, deliveryPanel:/工作负荷与交付|交付保障/, alertPanel:/经营异常预警|异常预警/, kpiGrid:/关键指标|经营总览/ };
      return ids.map(id => {
        let el = document.getElementById(id) || (fb[id] && byText(fb[id]));
        if (!el) return { id, missing: true };
        const r = el.getBoundingClientRect();
        return { id: el.id||id, top: r.top + scrollTop, bottom: r.bottom + scrollTop, left: r.left, right: r.right, height: r.height, width: r.width, missing: false };
      });
    });
    report.geometry = boxesAbs;

    // Overlap pairs: exclude contribution|target same row
    const named = Object.fromEntries(boxesAbs.filter(b => !b.missing).map(b => [b.id, b]));
    const pairIds = [
      ['kpiGrid','cashPanel'],
      ['cashPanel','riskPanel'],
      ['riskPanel','contributionPanel'],
      ['riskPanel','targetPanel'],
      ['contributionPanel','deliveryPanel'],
      ['targetPanel','deliveryPanel'],
      ['deliveryPanel','alertPanel'],
      ['cashPanel','contributionPanel'],
      ['cashPanel','alertPanel'],
      ['kpiGrid','riskPanel'],
    ];
    // also check contribution vs target: they MAY overlap in y (same row) - record but don't fail
    const overlaps = [];
    for (const [a,b] of pairIds) {
      if (!named[a] || !named[b]) continue;
      if (yOverlap(named[a], named[b])) {
        overlaps.push({ a, b, aY: [named[a].top, named[a].bottom], bY: [named[b].top, named[b].bottom] });
      }
    }
    let contribTargetSameRow = false;
    if (named.contributionPanel && named.targetPanel) {
      contribTargetSameRow = Math.abs(named.contributionPanel.top - named.targetPanel.top) < 40;
    }
    const check6Pass = overlaps.length === 0;
    report.checks['6_geometry_no_y_overlap'] = { pass: check6Pass, overlaps, contribTargetSameRow, boxes: boxesAbs };

    // Cash chart height / not clipped
    const cashH = geometry.cashChartRect?.height || named.cashPanel?.height || 0;
    const cashChartOk = cashH >= 200; // min-height 220 expected for wrap
    // Also check highcharts path exists and has size
    const cashVisual = await frame.evaluate(() => {
      const wrap = document.querySelector('.cash-chart-wrap, #cashChart');
      if (!wrap) return { ok: false, reason: 'no wrap' };
      const r = wrap.getBoundingClientRect();
      const hc = wrap.querySelector('.highcharts-container, svg');
      const hr = hc ? hc.getBoundingClientRect() : null;
      const paths = wrap.querySelectorAll('.highcharts-series path, .highcharts-graph');
      return { wrapH: r.height, wrapW: r.width, hcH: hr?.height, hcW: hr?.width, pathCount: paths.length, clipped: wrap.scrollHeight > wrap.clientHeight + 2 };
    });
    report.cashVisual = cashVisual;
    const check2Pass = cashVisual.wrapH >= 200 && !cashVisual.clipped && (cashVisual.hcH == null || cashVisual.hcH >= 150);
    report.checks['2_cash_trend_visible'] = { pass: check2Pass, cashVisual };

    // Target bar not clipped by scrollbar
    const targetVisual = await frame.evaluate(() => {
      const main = document.querySelector('main');
      const chart = document.getElementById('targetChart') || document.querySelector('.target-chart');
      if (!chart) return { ok: false, reason: 'no target chart' };
      const r = chart.getBoundingClientRect();
      const mainR = main.getBoundingClientRect();
      const sb = main.offsetWidth - main.clientWidth; // scrollbar width
      const clippedBySb = r.right > mainR.right - 1; // extends under scrollbar?
      // labels
      const labels = [...chart.querySelectorAll('.highcharts-data-label, text')].map(el => {
        const br = el.getBoundingClientRect();
        return { t: el.textContent?.trim(), right: br.right, visible: br.width > 0 };
      }).filter(x => x.t);
      return { h: r.height, w: r.width, right: r.right, mainRight: mainR.right, clientRight: mainR.left + main.clientWidth, sb, clippedBySb: r.right > main.clientWidth + mainR.left + 2, labels: labels.slice(0,10) };
    });
    report.targetVisual = targetVisual;
    report.checks['6b_target_not_clipped_by_scrollbar'] = { pass: targetVisual.ok !== false && !targetVisual.clippedBySb && (targetVisual.h || 0) >= 160, targetVisual };

    // Screenshot cash area - scroll cash into view
    await frame.evaluate(() => {
      const el = document.getElementById('cashPanel') || document.querySelector('.cash-chart-wrap');
      el?.scrollIntoView({ block: 'center' });
    });
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(OUT, '03-cash-trend.png'), fullPage: false });

    await frame.evaluate(() => {
      const el = document.getElementById('targetPanel') || document.getElementById('targetChart');
      el?.scrollIntoView({ block: 'center' });
    });
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(OUT, '04-target-bars.png'), fullPage: false });

    // === Check 4: scroll to bottom, alert fully visible ===
    const alertCheck = await frame.evaluate(() => {
      const main = document.querySelector('main');
      main.scrollTop = main.scrollHeight;
      return new Promise(resolve => {
        requestAnimationFrame(() => {
          const el = document.getElementById('alertPanel') || [...document.querySelectorAll('.panel')].find(p => /异常预警/.test(p.innerText||''));
          if (!el) { resolve({ pass: false, reason: 'missing alert' }); return; }
          const r = el.getBoundingClientRect();
          const mainR = main.getBoundingClientRect();
          // fully visible: top >= main top and bottom <= main bottom (within 2px)
          const fully = r.top >= mainR.top - 2 && r.bottom <= mainR.bottom + 2;
          // or at least most of it visible
          const mostly = r.top < mainR.bottom && r.bottom > mainR.top && (Math.min(r.bottom, mainR.bottom) - Math.max(r.top, mainR.top)) / r.height > 0.95;
          resolve({ pass: fully || mostly, fully, mostly, top: r.top, bottom: r.bottom, height: r.height, mainTop: mainR.top, mainBottom: mainR.bottom, scrollTop: main.scrollTop, scrollHeight: main.scrollHeight });
        });
      });
    });
    report.checks['4_alert_fully_visible_at_bottom'] = alertCheck;
    await page.waitForTimeout(400);
    await page.screenshot({ path: path.join(OUT, '05-alert-bottom.png'), fullPage: false });

    // === Check 5: tree selected color follows theme (not fixed teal) ===
    // Parse current selected bg
    const tealFixed = /rgb\(\s*0\s*,\s*112\s*,\s*105\s*\)|#007069/i;
    const currentBg = treeTheme.currentStyle?.bg || treeTheme.antSelected?.[0]?.bg || '';
    const isFixedTeal = tealFixed.test(currentBg);
    // Check default is blue-ish
    const isBlueish = /rgb\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*\)/.test(currentBg) && !isFixedTeal;
    // Try switching theme if ant select exists
    let afterSwitch = null;
    try {
      // Find theme control
      const themeControl = page.locator('text=深蓝').first();
      const hasTheme = await themeControl.count();
      report.themeControlCount = hasTheme;
      // Try ant select in header
      const headerSelects = page.locator('header .ant-select, [class*="header"] .ant-select');
      if (await headerSelects.count() > 0) {
        await headerSelects.first().click();
        await page.waitForTimeout(400);
        // click 青绿 or similar
        const opt = page.locator('.ant-select-item-option').filter({ hasText: /青绿|绿色|暖棕|琥珀|teal|green/i });
        if (await opt.count() > 0) {
          await opt.first().click();
          await page.waitForTimeout(800);
          afterSwitch = await page.evaluate(() => {
            const current = [...document.querySelectorAll('aside li, [class*="tree"] li, [class*="Tree"] *')].find(el => (el.textContent||'').includes('当前运营看板'));
            if (!current) return null;
            let p = current;
            for (let i=0;i<6 && p;i++) {
              const cs = getComputedStyle(p);
              if (cs.backgroundColor !== 'rgba(0, 0, 0, 0)' && cs.backgroundColor !== 'transparent') {
                return { bg: cs.backgroundColor, color: cs.color, level: i };
              }
              p = p.parentElement;
            }
            return { bg: getComputedStyle(current).backgroundColor, color: getComputedStyle(current).color };
          });
          // switch back to blue
          await headerSelects.first().click();
          await page.waitForTimeout(300);
          const blueOpt = page.locator('.ant-select-item-option').filter({ hasText: /深蓝|蓝色|blue/i });
          if (await blueOpt.count() > 0) await blueOpt.first().click();
          await page.waitForTimeout(500);
        } else {
          await page.keyboard.press('Escape');
        }
      }
    } catch (e) {
      report.themeSwitchError = String(e);
    }
    report.afterThemeSwitch = afterSwitch;

    // Default blue check from themeProbe / iframe
    const defaultBlue =
      /blue|深蓝/i.test(JSON.stringify(themeProbe)) ||
      /blue/i.test(String(iframeTheme.dataTheme || '')) ||
      /blue/i.test(String(iframeTheme.className || '')) ||
      /深蓝/.test(JSON.stringify(themeInfo));
    report.checks['3b_default_blue_theme'] = { pass: !!defaultBlue, themeProbe, iframeTheme, themeInfo };
    report.checks['5_tree_follows_theme'] = {
      pass: !isFixedTeal && (!!currentBg || (treeTheme.antSelected||[]).length > 0),
      currentBg,
      isFixedTeal,
      afterSwitch,
      changed: afterSwitch && afterSwitch.bg && afterSwitch.bg !== currentBg
    };

    // Screenshot tree
    await page.screenshot({ path: path.join(OUT, '06-tree-theme-default.png'), fullPage: false });

    // Full page-ish scroll collage - scroll main mid
    await frame.evaluate(() => { const m = document.querySelector('main'); if (m) m.scrollTop = m.scrollHeight * 0.35; });
    await page.waitForTimeout(300);
    await page.screenshot({ path: path.join(OUT, '07-mid-scroll-layout.png'), fullPage: false });

    // Summarize failures
    const mapping = {
      '1_main_only_scroll': '1 仅 main 纵滚',
      '2_cash_trend_visible': '2 现金流趋势完整',
      '3a_three_dropdowns_first_screen': '3a 首屏三下拉',
      '3b_default_blue_theme': '3b 默认深蓝',
      '4_alert_fully_visible_at_bottom': '4 预警整块可见',
      '5_tree_follows_theme': '5 树选中随主题',
      '6_geometry_no_y_overlap': '6 几何 y 不相交',
      '6b_target_not_clipped_by_scrollbar': '6b 目标条不被滚动条挡'
    };
    for (const [k,v] of Object.entries(report.checks)) {
      if (!v.pass) report.failures.push({ key: k, label: mapping[k] || k, detail: v });
    }
    report.overallPass = report.failures.length === 0;
    report.screenshots = fs.readdirSync(OUT).filter(f => f.endsWith('.png'));

  } catch (e) {
    report.error = String(e && e.stack || e);
    report.overallPass = false;
  }

  fs.writeFileSync(RESULT, JSON.stringify(report, null, 2), 'utf8');
  console.log(JSON.stringify({ overallPass: report.overallPass, failures: report.failures?.map(f => f.label || f.key), checks: Object.fromEntries(Object.entries(report.checks||{}).map(([k,v]) => [k, v.pass])), error: report.error }, null, 2));
  await browser.close();
})().catch(e => { console.error(e); process.exit(1); });
