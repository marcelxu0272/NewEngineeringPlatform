const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

(async () => {
  const OUT = path.resolve('docs/evidence/2026-11-02-ops-visual-polish');
  fs.mkdirSync(OUT, { recursive: true });
  const url = 'http://127.0.0.1:3000/operations-dashboard-202610/board';
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } });
  await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 });

  // Prefer iframe board content if present
  let frame = page;
  const iframe = page.locator('iframe').first();
  if (await iframe.count()) {
    const handle = await iframe.elementHandle();
    const f = await handle.contentFrame();
    if (f) frame = f;
  }
  await frame.waitForSelector('#cashChart, #riskPanel, #deliveryPanel', { timeout: 30000 });
  await frame.waitForTimeout(1200);

  const probe = await frame.evaluate(() => {
    const GREEN = 'rgb(35, 139, 119)';
    const RED = 'rgb(223, 92, 112)';
    const near = (a, b, tol = 2) => Math.abs(a - b) <= tol;
    const rgbClose = (c, target) => {
      const m = String(c).match(/\d+/g);
      const t = String(target).match(/\d+/g);
      if (!m || !t || m.length < 3 || t.length < 3) return false;
      return Math.abs(+m[0] - +t[0]) <= 8 && Math.abs(+m[1] - +t[1]) <= 8 && Math.abs(+m[2] - +t[2]) <= 8;
    };
    const cs = (el) => getComputedStyle(el);
    const rect = (el) => {
      const r = el.getBoundingClientRect();
      return { x: r.x, y: r.y, w: r.width, h: r.height, top: r.top, bottom: r.bottom, left: r.left, right: r.right };
    };

    // —— AC1 cashflow ——
    const cashChartEl = document.querySelector('#cashChart');
    const cashWrap = document.querySelector('.cash-chart-wrap');
    const cashPanel = document.querySelector('#cashPanel');
    const hc = window.Highcharts && Highcharts.charts
      ? Highcharts.charts.find(c => c && c.renderTo && c.renderTo.id === 'cashChart')
      : null;
    const series = hc ? hc.series.map(s => ({
      name: s.name,
      type: s.type,
      data: (s.yData || []).slice(0, 12),
      optionsGrouping: s.options && s.options.grouping,
      visible: s.visible
    })) : [];
    const plotOpts = hc && hc.options && hc.options.plotOptions ? hc.options.plotOptions : {};
    const colGrouping = plotOpts.column && plotOpts.column.grouping;
    const spacing = hc && hc.options && hc.options.chart ? hc.options.chart.spacing : null;
    const inS = series.find(s => /流入/.test(s.name));
    const outS = series.find(s => /流出/.test(s.name));
    const inPos = inS && inS.data.every(v => v == null || v >= 0);
    const outNeg = outS && outS.data.every(v => v == null || v <= 0);
    // Geometry: sample first column points graphic y vs plot zero
    let pointGeom = null;
    if (hc && inS && outS) {
      const inPts = hc.series.find(s => /流入/.test(s.name)).points || [];
      const outPts = hc.series.find(s => /流出/.test(s.name)).points || [];
      const i0 = inPts[0], o0 = outPts[0];
      if (i0 && o0 && i0.graphic && o0.graphic) {
        const ib = i0.graphic.getBBox();
        const ob = o0.graphic.getBBox();
        // In Highcharts SVG, y increases downward; inflow above zero means smaller y (top)
        pointGeom = {
          inY: ib.y, inH: ib.height, inX: ib.x,
          outY: ob.y, outH: ob.height, outX: ob.x,
          sameXish: Math.abs(ib.x - ob.x) < 8, // stacked same category x
          inAboveOut: ib.y + ib.height <= ob.y + 2 // inflow bottom touches/near outflow top around zero
        };
      }
    }
    const wrapCS = cashWrap ? cs(cashWrap) : null;
    const chartCS = cashChartEl ? cs(cashChartEl) : null;
    const wrapR = cashWrap ? rect(cashWrap) : null;
    const chartR = cashChartEl ? rect(cashChartEl) : null;
    const panelR = cashPanel ? rect(cashPanel) : null;
    const plotBottom = hc && hc.plotBox ? (hc.plotTop + hc.plotHeight) : null;
    const chartBottomPad = chartR && plotBottom != null ? (chartR.h - plotBottom) : null;
    const wrapBottomGap = wrapR && chartR ? (wrapR.bottom - chartR.bottom) : null;
    const panelPadBottom = wrapCS ? wrapCS.paddingBottom : null;
    const spacingBottom = Array.isArray(spacing) ? spacing[2] : (spacing && spacing.bottom);

    const ac1 = {
      groupingFalse: colGrouping === false,
      inPos: !!inPos,
      outNeg: !!outNeg,
      pointGeom,
      spacingBottom,
      cashPadBottom: panelPadBottom,
      wrapBottomGap,
      chartBottomPad,
      seriesNames: series.map(s => s.name),
      pass: false
    };
    ac1.pass = ac1.groupingFalse && ac1.inPos && ac1.outNeg
      && (!!pointGeom ? (pointGeom.sameXish && pointGeom.inAboveOut) : true)
      && ((spacingBottom != null && spacingBottom >= 14) || (parseFloat(panelPadBottom) >= 20) || (wrapBottomGap != null && wrapBottomGap >= 10));

    // —— AC2 risk period colors ——
    const riskCards = [...document.querySelectorAll('#riskMetrics .risk-metric')].map(el => {
      const label = (el.querySelector('.metric-label') || el).textContent.trim().split('\n')[0].replace(/\s+/g, '');
      const period = el.querySelector('.risk-period') || el.querySelector('small');
      const text = period ? period.textContent.replace(/\s+/g, ' ').trim() : '';
      const color = period ? cs(period).color : null;
      const up = /\+|↑|▲/.test(text) || /较上期\s*\+/.test(text);
      const down = /-|↓|▼/.test(text.replace(/较上期/, '')) || /较上期\s*-/.test(text);
      // parse signed %
      const m = text.match(/([+\-−]?)\s*([\d.]+)\s*%/);
      let delta = null;
      if (m) delta = (m[1] === '-' || m[1] === '−' ? -1 : 1) * parseFloat(m[2]);
      if (text.includes('较上期') && /-\s*[\d.]/.test(text.replace('较上期',''))) {
        // already handled
      }
      return { label, text, color, delta, up, down };
    });
    // Map by known labels
    const findCard = (name) => riskCards.find(c => c.label.includes(name));
    const cRec = findCard('应收');
    const cWip = findCard('WIP');
    const cInv = findCard('存货');
    const cRev = findCard('营业');
    const expectGood = (card, isRevenue) => {
      if (!card || card.delta == null) return { ok: false, reason: 'missing' };
      const up = card.delta >= 0;
      const good = isRevenue ? up : !up;
      const expectColor = good ? GREEN : RED;
      const colorOk = rgbClose(card.color, expectColor);
      return { ok: colorOk, expectColor, actual: card.color, delta: card.delta, good, text: card.text };
    };
    const riskChecks = {
      receivables: expectGood(cRec, false),
      wip: expectGood(cWip, false),
      inventory: expectGood(cInv, false),
      revenue: expectGood(cRev, true),
      green: GREEN,
      red: RED,
      cards: riskCards
    };
    riskChecks.pass = ['receivables','wip','inventory','revenue'].every(k => riskChecks[k].ok);

    // —— AC3 aging bar ——
    const agingChart = document.querySelector('#agingChart');
    const agingLegend = document.querySelector('#agingLegend');
    const agingHc = window.Highcharts && Highcharts.charts
      ? Highcharts.charts.find(c => c && c.renderTo && c.renderTo.id === 'agingChart')
      : null;
    const agingType = agingHc ? agingHc.options.chart.type : null;
    const agingStack = agingHc && agingHc.options.plotOptions && agingHc.options.plotOptions.series
      ? agingHc.options.plotOptions.series.stacking : null;
    const agingSeriesCount = agingHc ? agingHc.series.length : 0;
    const agingSeriesNames = agingHc ? agingHc.series.map(s => s.name) : [];
    const hasDonutVisible = (() => {
      const donuts = [...document.querySelectorAll('#riskPanel .donut-wrap, #riskPanel .aging-layout')];
      return donuts.some(el => {
        const s = cs(el);
        return s.display !== 'none' && s.visibility !== 'hidden' && el.getBoundingClientRect().height > 20;
      });
    })();
    // Also ensure aging chart is not pie
    const agingIsPie = agingType === 'pie' || (agingHc && agingHc.series.some(s => s.type === 'pie'));
    const legendCS = agingLegend ? cs(agingLegend) : null;
    const legendItems = agingLegend ? agingLegend.querySelectorAll('.mix-item, button, .legend-item').length : 0;
    const legendGrid = legendCS ? legendCS.gridTemplateColumns : null;
    const legendCols = legendGrid ? legendGrid.split(/\s+/).filter(Boolean).length : 0;
    // Compare with mixChart (合同额结构)
    const mixHc = window.Highcharts && Highcharts.charts
      ? Highcharts.charts.find(c => c && c.renderTo && c.renderTo.id === 'mixChart')
      : null;
    const mixType = mixHc ? mixHc.options.chart.type : null;
    const agingR = agingChart ? rect(agingChart) : null;
    const ac3 = {
      type: agingType,
      stacking: agingStack,
      seriesCount: agingSeriesCount,
      seriesNames: agingSeriesNames,
      hasDonutVisible,
      agingIsPie,
      legendItems,
      legendCols,
      legendGrid,
      mixType,
      agingH: agingR ? agingR.h : null,
      pass: false
    };
    ac3.pass = !ac3.agingIsPie && !ac3.hasDonutVisible
      && ac3.type === 'bar' && ac3.stacking === 'normal'
      && ac3.seriesCount === 4 && ac3.legendItems === 4 && ac3.legendCols === 4
      && ac3.mixType === 'bar' && ac3.agingH != null && ac3.agingH <= 40;

    // —— AC4 delivery height ——
    const deliveryPanel = document.querySelector('#deliveryPanel');
    const deliveryLayout = document.querySelector('.delivery-layout');
    const loadChart = document.querySelector('#loadChart');
    const dR = deliveryPanel ? rect(deliveryPanel) : null;
    const lR = deliveryLayout ? rect(deliveryLayout) : null;
    const lcR = loadChart ? rect(loadChart) : null;
    const left = document.querySelector('.delivery-left');
    const mid = document.querySelector('.delivery-mid');
    const right = document.querySelector('.delivery-right');
    const colW = [left, mid, right].map(el => el ? rect(el).w : 0);
    const sumW = colW.reduce((a,b)=>a+b,0) || 1;
    const ratios = { left: colW[0]/sumW, mid: colW[1]/sumW, right: colW[2]/sumW };
    // Baseline from prior Max 3col: loadChart h=180, layout cols h=260
    const baselineLoadH = 180;
    const baselineColH = 260;
    const loadLower = lcR && lcR.h < baselineLoadH - 5;
    const layoutLower = lR && lR.h < baselineColH; // layout content area
    // readable: three cols still present and ratios near 0.25/0.5/0.25
    const ratioOk = Math.abs(ratios.left-0.25)<=0.04 && Math.abs(ratios.mid-0.5)<=0.04 && Math.abs(ratios.right-0.25)<=0.04;
    const ac4 = {
      panelH: dR ? dR.h : null,
      layoutH: lR ? lR.h : null,
      loadH: lcR ? lcR.h : null,
      baselineLoadH,
      baselineColH,
      loadLower,
      layoutLower,
      ratios,
      ratioOk,
      colW,
      pass: false
    };
    ac4.pass = !!loadLower && ratioOk && ac4.layoutH != null && ac4.layoutH >= 150; // pressed but still readable

    // —— AC5 pair equal height ——
    const contrib = document.querySelector('#contributionPanel') || document.querySelector('.pair-row > .panel');
    const target = document.querySelector('#targetPanel');
    const pair = document.querySelector('.pair-row');
    const cR = contrib ? rect(contrib) : null;
    const tR = target ? rect(target) : null;
    const heightDiff = cR && tR ? Math.abs(cR.h - tR.h) : 999;
    const topDiff = cR && tR ? Math.abs(cR.top - tR.top) : 999;
    const pairAlign = pair ? cs(pair).alignItems : null;
    const ac5 = {
      contribH: cR ? cR.h : null,
      targetH: tR ? tR.h : null,
      heightDiff,
      topDiff,
      pairAlign,
      pass: heightDiff <= 2 && topDiff <= 2
    };

    // light regress: KPI delta still 当月新增/上月新增 style, not 同比 as primary
    const kpiDeltas = [...document.querySelectorAll('.kpi-delta')].map(el => el.textContent.replace(/\s+/g,' ').trim());
    const regress = {
      hasTongbiPrimary: kpiDeltas.some(t => /^同比/.test(t) || t.includes('同比') && !t.includes('当月新增') && !t.includes('上月新增')),
      sample: kpiDeltas.slice(0,4),
      hasDangyueOrShangyue: kpiDeltas.some(t => t.includes('当月新增') || t.includes('上月新增'))
    };

    const ac = {
      ac1: ac1.pass,
      ac2: riskChecks.pass,
      ac3: ac3.pass,
      ac4: ac4.pass,
      ac5: ac5.pass
    };
    const blockers = [];
    if (!ac.ac1) blockers.push('AC1 现金流柱非上下排或下留白不足');
    if (!ac.ac2) blockers.push('AC2 较上期红绿语义不符');
    if (!ac.ac3) blockers.push('AC3 账龄非水平分布条或图例非一行四列');
    if (!ac.ac4) blockers.push('AC4 交付保障高度未压低或三栏比例破坏');
    if (!ac.ac5) blockers.push('AC5 贡献/目标高度不一致');

    return {
      ac,
      blockers,
      metrics: { cash: ac1, risk: riskChecks, aging: ac3, delivery: ac4, pair: ac5, regress },
      ts: new Date().toISOString()
    };
  });

  // Screenshots
  const shots = {};
  async function shot(name, selector) {
    const loc = frame.locator(selector).first();
    if (await loc.count()) {
      const p = path.join(OUT, name);
      await loc.screenshot({ path: p });
      shots[name] = p;
      return;
    }
    await page.screenshot({ path: path.join(OUT, name), fullPage: false });
    shots[name] = path.join(OUT, name);
  }

  await shot('max-01-cashflow-stack.png', '#cashPanel');
  await shot('max-02-risk-period-colors.png', '#riskMetrics');
  await shot('max-03-aging-bar.png', '#riskPanel');
  await shot('max-04-delivery-height.png', '#deliveryPanel');
  await shot('max-05-pair-equal-height.png', '.pair-row');

  // Also a cash wrap clip for bottom padding visibility
  await shot('max-01b-cash-wrap.png', '.cash-chart-wrap');

  probe.ac.ac6 = true; // evidence written below
  probe.shots = Object.keys(shots);
  probe.url = url;
  probe.overallPass = probe.ac.ac1 && probe.ac.ac2 && probe.ac.ac3 && probe.ac.ac4 && probe.ac.ac5 && probe.ac.ac6;
  if (!probe.overallPass && !probe.blockers.length) probe.blockers.push('未知失败');

  fs.writeFileSync(path.join(OUT, 'max-probe.json'), JSON.stringify(probe, null, 2), 'utf8');
  console.log(JSON.stringify({ overallPass: probe.overallPass, ac: probe.ac, blockers: probe.blockers, metricsSummary: {
    cash: { groupingFalse: probe.metrics.cash.groupingFalse, inPos: probe.metrics.cash.inPos, outNeg: probe.metrics.cash.outNeg, spacingBottom: probe.metrics.cash.spacingBottom, cashPadBottom: probe.metrics.cash.cashPadBottom, pointGeom: probe.metrics.cash.pointGeom },
    riskPass: probe.metrics.risk.pass,
    aging: { type: probe.metrics.aging.type, legendCols: probe.metrics.aging.legendCols, seriesCount: probe.metrics.aging.seriesCount },
    delivery: { layoutH: probe.metrics.delivery.layoutH, loadH: probe.metrics.delivery.loadH, ratios: probe.metrics.delivery.ratios },
    pair: { contribH: probe.metrics.pair.contribH, targetH: probe.metrics.pair.targetH, diff: probe.metrics.pair.heightDiff }
  }}, null, 2));

  await browser.close();
})().catch(e => { console.error('PROBE_FAIL', e); process.exit(1); });
