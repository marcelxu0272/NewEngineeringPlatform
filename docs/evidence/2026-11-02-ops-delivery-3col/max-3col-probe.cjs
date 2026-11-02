const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const OUT = 'C:/Work/2_Development/21_Platform/26_engineering-platform/docs/evidence/2026-11-02-ops-delivery-3col';
const PREFIX = 'max-3col';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const report = { ts: new Date().toISOString(), actor: 'Max-independent-3col', checks: {}, failures: [] };

  await page.goto('http://localhost:3000/operations-dashboard-202610/board', { waitUntil: 'networkidle', timeout: 90000 });
  await page.waitForTimeout(3000);
  const frame = await (await page.waitForSelector('iframe')).contentFrame();
  await frame.waitForSelector('#deliveryPanel', { timeout: 20000 });
  await frame.evaluate(() => document.getElementById('deliveryPanel')?.scrollIntoView({ block: 'center' }));
  await page.waitForTimeout(800);

  const m = await frame.evaluate(() => {
    const panel = document.getElementById('deliveryPanel');
    const layout = panel.querySelector('.delivery-layout');
    const left = panel.querySelector('.delivery-left');
    const mid = panel.querySelector('.delivery-mid');
    const right = panel.querySelector('.delivery-right');
    const lb = layout.getBoundingClientRect();
    const gap = parseFloat(getComputedStyle(layout).gap) || 0;
    const cols = [
      { name: 'left', el: left },
      { name: 'mid', el: mid },
      { name: 'right', el: right }
    ].map(({ name, el }) => {
      if (!el) return { name, missing: true };
      const r = el.getBoundingClientRect();
      const c = getComputedStyle(el);
      return {
        name, missing: false,
        w: r.width, h: r.height, left: r.left, right: r.right, top: r.top, bottom: r.bottom,
        flex: c.flex, flexGrow: c.flexGrow, display: c.display, flexDir: c.flexDirection,
        text: (el.innerText || '').replace(/\s+/g, ' ').trim().slice(0, 200)
      };
    });

    // ratios relative to sum of column widths (exclude gaps)
    const present = cols.filter(c => !c.missing);
    const sumW = present.reduce((a, c) => a + c.w, 0);
    const ratios = Object.fromEntries(present.map(c => [c.name, c.w / sumW]));

    // Left: month above, year below
    const leftEl = left;
    const leftKids = leftEl ? [...leftEl.children].map(el => {
      const r = el.getBoundingClientRect();
      return { cls: String(el.className).slice(0,50), top: r.top, bottom: r.bottom, h: r.height, text: (el.innerText||'').replace(/\s+/g,' ').trim().slice(0,80) };
    }) : [];
    const leftText = leftEl ? leftEl.innerText : '';
    const hasMonth = /当月负荷率/.test(leftText);
    const hasYear = /年度负荷率/.test(leftText);
    // order: 当月 should appear above 年度 (smaller top)
    let monthTop = null, yearTop = null;
    leftEl?.querySelectorAll('*').forEach(el => {
      const t = (el.textContent || '').trim();
      if (t === '当月负荷率' || (el.childNodes.length && [...el.childNodes].some(n => n.nodeType===3 && n.textContent.trim()==='当月负荷率'))) {
        const r = el.getBoundingClientRect();
        if (monthTop == null || r.top < monthTop) monthTop = r.top;
      }
      if (t === '年度负荷率' || (el.childNodes.length && [...el.childNodes].some(n => n.nodeType===3 && n.textContent.trim()==='年度负荷率'))) {
        const r = el.getBoundingClientRect();
        if (yearTop == null || r.top < yearTop) yearTop = r.top;
      }
    });
    // fallback: indexOf in text blocks
    if (monthTop == null || yearTop == null) {
      const blocks = [...(leftEl?.querySelectorAll('div,section,article') || [])];
      blocks.forEach(b => {
        if (/当月负荷率/.test(b.innerText) && monthTop == null) monthTop = b.getBoundingClientRect().top;
        if (/年度负荷率/.test(b.innerText) && yearTop == null) yearTop = b.getBoundingClientRect().top;
      });
    }

    // Mid: trend chart
    const midText = mid ? mid.innerText : '';
    const loadChart = panel.querySelector('#loadChart');
    const loadB = loadChart ? loadChart.getBoundingClientRect() : null;
    const midB = mid ? mid.getBoundingClientRect() : null;
    const midChartFill = (loadB && midB && midB.width > 0) ? loadB.width / midB.width : 0;
    const xLabels = loadChart ? [...loadChart.querySelectorAll('.highcharts-xaxis-labels text, .highcharts-axis-labels text')]
      .map(el => ({ text: el.textContent.trim(), bottom: el.getBoundingClientRect().bottom }))
      .filter(x => /\d+月/.test(x.text)) : [];
    const loadBox = loadChart ? loadChart.getBoundingClientRect() : null;
    // also check mid panel overflow for clipping
    const midOverflow = mid && loadB ? loadB.bottom - mid.getBoundingClientRect().bottom : 0;

    // Right: chart on top, legend below
    const rightText = right ? right.innerText : '';
    const donut = right?.querySelector('#deliveryChart, .donut-wrap, .highcharts-container');
    const legend = right?.querySelector('#deliveryLegend, .legend-list, .delivery-legend, [class*=legend]');
    const donutB = donut ? donut.getBoundingClientRect() : null;
    const legendB = legend ? legend.getBoundingClientRect() : null;
    const rightB = right ? right.getBoundingClientRect() : null;
    const chartAboveLegend = donutB && legendB ? donutB.top < legendB.top : null;
    const rightInner = right?.querySelector('.delivery-chart-inner');
    const innerCs = rightInner ? getComputedStyle(rightInner) : null;

    // AC15: emptyRight of visual children in right column
    let emptyRight = null, fillRatio = null;
    if (right && rightInner) {
      const rb = right.getBoundingClientRect();
      let maxR = -Infinity, minL = Infinity;
      [...rightInner.children].forEach(el => {
        const r = el.getBoundingClientRect();
        if (r.width < 2) return;
        maxR = Math.max(maxR, r.right); minL = Math.min(minL, r.left);
      });
      // also legend/donut if nested
      [donut, legend].forEach(el => {
        if (!el) return;
        const r = el.getBoundingClientRect();
        if (r.width < 2) return;
        maxR = Math.max(maxR, r.right); minL = Math.min(minL, r.left);
      });
      if (isFinite(maxR)) {
        emptyRight = rb.right - maxR;
        fillRatio = (maxR - minL) / rb.width;
      }
    }

    // If column layout (chart above legend), children of inner should stack; measure empty using full right content union of meaningful nodes
    if (right) {
      const rb = right.getBoundingClientRect();
      let maxR = -Infinity, minL = Infinity;
      right.querySelectorAll('#deliveryChart, .donut-wrap, .highcharts-container, #deliveryLegend, .legend-list, .legend-item, li, span').forEach(el => {
        if (/tooltip|popover|bubble|info-button/i.test(String(el.className)+el.id)) return;
        const r = el.getBoundingClientRect();
        const c = getComputedStyle(el);
        if (r.width < 3 || r.height < 3 || c.display==='none') return;
        // skip full-stretch empty wrappers: prefer elements with text or svg
        const meaningful = el.tagName === 'SVG' || /highcharts|chart|legend|donut/i.test(String(el.className)+el.id) || (el.innerText||'').trim().length > 0;
        if (!meaningful && el.children.length === 0) return;
        maxR = Math.max(maxR, r.right); minL = Math.min(minL, r.left);
      });
      if (isFinite(maxR)) {
        emptyRight = rb.right - maxR;
        fillRatio = (maxR - minL) / rb.width;
      }
    }

    return {
      layoutW: lb.width, gap,
      layoutDisplay: getComputedStyle(layout).display,
      cols, ratios, sumW,
      leftKids, hasMonth, hasYear, monthTop, yearTop, monthAboveYear: monthTop != null && yearTop != null ? monthTop < yearTop : null,
      midHasTrendTitle: /近\s*6\s*个月负荷率趋势|近6个月负荷率趋势/.test(midText),
      loadChart: loadB && { w: loadB.width, h: loadB.height, fillOfMid: midChartFill },
      xLabels: xLabels.map(x => x.text),
      midOverflow,
      rightHasDeliveryTitle: /项目交付保障/.test(rightText),
      donut: donutB && { w: donutB.width, h: donutB.height, top: donutB.top },
      legend: legendB && { w: legendB.width, h: legendB.height, top: legendB.top, text: (legend.innerText||'').replace(/\s+/g,' ').trim().slice(0,80) },
      chartAboveLegend,
      rightInnerFlexDir: innerCs?.flexDirection,
      emptyRight, fillRatio,
      rightW: rightB?.width
    };
  });

  report.measure = m;

  // Tolerance for ratios: target 0.25 / 0.50 / 0.25, allow ±0.04 (4pp) — 明显偏离则 fail
  const rL = m.ratios.left, rM = m.ratios.mid, rR = m.ratios.right;
  const ratioOk = Math.abs(rL - 0.25) <= 0.04 && Math.abs(rM - 0.50) <= 0.04 && Math.abs(rR - 0.25) <= 0.04;
  report.checks['1_ratio_quarter_half_quarter'] = {
    pass: ratioOk && !m.cols.some(c => c.missing),
    ratios: m.ratios,
    widths: Object.fromEntries(m.cols.map(c => [c.name, c.w])),
    tolerance: '±0.04 on share of (left+mid+right) width sum',
    sumW: m.sumW, layoutW: m.layoutW
  };

  report.checks['2_left_month_above_year'] = {
    pass: !!m.hasMonth && !!m.hasYear && m.monthAboveYear === true,
    hasMonth: m.hasMonth, hasYear: m.hasYear, monthAboveYear: m.monthAboveYear,
    monthTop: m.monthTop, yearTop: m.yearTop
  };

  report.checks['3_mid_trend_chart'] = {
    pass: !!m.midHasTrendTitle && !!m.loadChart && m.loadChart.w > 0 && m.loadChart.fillOfMid >= 0.70 && (m.xLabels||[]).length >= 2,
    midHasTrendTitle: m.midHasTrendTitle,
    loadChart: m.loadChart,
    xLabels: m.xLabels,
    midOverflow: m.midOverflow
  };

  report.checks['4_right_chart_above_legend'] = {
    pass: !!m.rightHasDeliveryTitle && !!m.donut && !!m.legend && m.chartAboveLegend === true && m.rightInnerFlexDir === 'column',
    rightHasDeliveryTitle: m.rightHasDeliveryTitle,
    donut: m.donut, legend: m.legend,
    chartAboveLegend: m.chartAboveLegend,
    rightInnerFlexDir: m.rightInnerFlexDir
  };

  // AC15: emptyRight <= 56 (same as prior Max-15) OR fillRatio >= 0.85
  const ac15 = m.emptyRight != null && (m.emptyRight <= 56 || (m.fillRatio != null && m.fillRatio >= 0.85));
  report.checks['5_no_regression_ac15_right_fill'] = {
    pass: !!ac15,
    emptyRight: m.emptyRight,
    fillRatio: m.fillRatio,
    rightW: m.rightW
  };

  // screenshots
  await page.screenshot({ path: path.join(OUT, `${PREFIX}-01-context.png`), fullPage: false });
  const clip = await page.evaluate(() => {
    const f = document.querySelector('iframe');
    const fr = f.getBoundingClientRect();
    const d = f.contentDocument.getElementById('deliveryPanel').getBoundingClientRect();
    return { x: Math.max(0, fr.left+d.left-2), y: Math.max(0, fr.top+d.top-2), width: Math.min(d.width+4, 1200), height: Math.min(d.height+4, 520) };
  });
  await page.screenshot({ path: path.join(OUT, `${PREFIX}-02-panel.png`), clip });

  // column clips
  for (const name of ['left','mid','right']) {
    const c = await page.evaluate((name) => {
      const f = document.querySelector('iframe');
      const fr = f.getBoundingClientRect();
      const el = f.contentDocument.querySelector('.delivery-' + name);
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return { x: Math.max(0, fr.left+r.left), y: Math.max(0, fr.top+r.top-2), width: Math.ceil(r.width), height: Math.ceil(Math.min(r.height+4, 420)) };
    }, name);
    if (c && c.width > 10) await page.screenshot({ path: path.join(OUT, `${PREFIX}-03-${name}.png`), clip: c });
  }

  const shots = fs.readdirSync(OUT).filter(f => f.startsWith(PREFIX) && f.endsWith('.png'));
  report.checks['6_evidence_saved'] = { pass: shots.length >= 3, shots };

  for (const [k,v] of Object.entries(report.checks)) {
    if (!v.pass) report.failures.push(k);
  }
  report.overallPass = report.failures.length === 0;

  fs.writeFileSync(path.join(OUT, `${PREFIX}-probe-result.json`), JSON.stringify(report, null, 2));
  console.log(JSON.stringify({
    overallPass: report.overallPass,
    failures: report.failures,
    checks: Object.fromEntries(Object.entries(report.checks).map(([k,v]) => [k, v.pass])),
    ratios: m.ratios,
    widths: Object.fromEntries(m.cols.map(c => [c.name, +c.w.toFixed(1)])),
    left: { hasMonth: m.hasMonth, hasYear: m.hasYear, monthAboveYear: m.monthAboveYear },
    mid: { title: m.midHasTrendTitle, chart: m.loadChart, xLabels: m.xLabels },
    right: { title: m.rightHasDeliveryTitle, chartAboveLegend: m.chartAboveLegend, flexDir: m.rightInnerFlexDir, emptyRight: m.emptyRight, fillRatio: m.fillRatio, legend: m.legend },
    flex: m.cols.map(c => ({ name: c.name, flex: c.flex }))
  }, null, 2));

  await browser.close();
})().catch(e => { console.error(e); process.exit(1); });
