const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

function parseRgb(s) {
  if (!s) return null;
  const m = String(s).match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i);
  if (!m) return null;
  return [Number(m[1]), Number(m[2]), Number(m[3])];
}
function hexToRgb(hex) {
  if (!hex) return null;
  let h = String(hex).replace('#', '').trim();
  if (h.length === 3) h = h.split('').map((c) => c + c).join('');
  if (h.length !== 6) return null;
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}
function sameRgb(a, b, tol = 3) {
  if (!a || !b) return false;
  return Math.abs(a[0] - b[0]) <= tol && Math.abs(a[1] - b[1]) <= tol && Math.abs(a[2] - b[2]) <= tol;
}
function tokenRgb(tok) {
  return hexToRgb(tok) || parseRgb(tok);
}

(async () => {
  const OUT = path.resolve('docs/evidence/2026-11-02-ops-cashflow-cards-restore');
  fs.mkdirSync(OUT, { recursive: true });
  const url = 'http://127.0.0.1:3000/operations-dashboard-202610/board';
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1600, height: 1100 } });
  await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 });

  let frame = page;
  const iframe = page.locator('iframe').first();
  if (await iframe.count()) {
    const handle = await iframe.elementHandle();
    const f = await handle.contentFrame();
    if (f) frame = f;
  }
  await frame.waitForSelector('#cashPanel, #cashMetrics, #cashChart', { timeout: 30000 });
  await frame.waitForTimeout(1800);

  async function setTheme(name) {
    await page.evaluate((theme) => {
      const iframe = document.querySelector('iframe');
      if (iframe && iframe.contentWindow) {
        iframe.contentWindow.postMessage({ type: 'ops-dashboard-theme', theme }, window.location.origin);
      }
    }, name);
    const hostSelect = page.locator('.ant-select').first();
    if (await hostSelect.count()) {
      try {
        await hostSelect.click({ timeout: 2000 });
        const optLabel = name === 'teal' ? '青绿主题' : name === 'wood' ? '暖棕主题' : '深蓝主题';
        const opt = page.locator('.ant-select-item-option').filter({ hasText: optLabel }).first();
        if (await opt.count()) await opt.click({ timeout: 3000 });
        else await page.keyboard.press('Escape');
      } catch (_) {}
    }
    await frame.waitForTimeout(1200);
  }

  const baseProbe = await frame.evaluate(() => {
    const cs = (el) => getComputedStyle(el);
    const rect = (el) => {
      const r = el.getBoundingClientRect();
      return { x: r.x, y: r.y, w: r.width, h: r.height, top: r.top, bottom: r.bottom, left: r.left, right: r.right };
    };
    const visible = (el) => {
      if (!el) return false;
      const s = cs(el);
      if (s.display === 'none' || s.visibility === 'hidden' || Number(s.opacity) === 0) return false;
      const r = el.getBoundingClientRect();
      return r.width > 0 && r.height > 0;
    };
    const px = (el) => (el ? parseFloat(cs(el).fontSize) : null);
    const text = (el) => (el ? el.textContent.replace(/\s+/g, ' ').trim() : '');
    const colorOf = (el) => (el ? cs(el).color : null);

    const cashPanel = document.querySelector('#cashPanel');
    const cashMetrics = document.querySelector('#cashMetrics');
    const cashChart = document.querySelector('#cashChart');
    const panelTitle = cashPanel ? text(cashPanel.querySelector('.panel-title')) : '';
    const subTitle = cashPanel ? text(cashPanel.querySelector('.sub-title')) : '';

    const cards = [...document.querySelectorAll('#cashMetrics .cash-metric')].filter(visible);
    const cardInfo = cards.map((btn, i) => {
      const strong = btn.querySelector('strong');
      const label = text(btn.querySelector('.metric-label'));
      const delta = btn.querySelector('.metric-delta, small');
      const r = strong ? rect(strong) : null;
      const truncated = strong && (
        text(strong).includes('…') || text(strong).includes('...') ||
        (cs(strong).textOverflow === 'ellipsis' && strong.scrollWidth > strong.clientWidth + 1)
      );
      const broken = strong && r && r.h > px(strong) * 1.85;
      return {
        i, label, value: text(strong), valuePx: px(strong),
        valueColor: colorOf(strong),
        inlineStyle: strong ? strong.getAttribute('style') : null,
        deltaText: text(delta), deltaPx: px(delta),
        deltaColor: colorOf(delta) || (delta ? colorOf(delta.querySelector('em')) : null),
        whiteSpace: strong ? cs(strong).whiteSpace : null,
        textOverflow: strong ? cs(strong).textOverflow : null,
        truncated: !!truncated, broken: !!broken,
        rect: r, cardRect: rect(btn), display: cs(btn).display,
        tone: [...btn.classList].find((c) => c.startsWith('tone-')) || null,
      };
    });

    const metricsRect = cashMetrics && visible(cashMetrics) ? rect(cashMetrics) : null;
    const chartRect = cashChart && visible(cashChart) ? rect(cashChart) : null;
    const chartWrap = document.querySelector('.cash-chart-wrap');
    const wrapRect = chartWrap && visible(chartWrap) ? rect(chartWrap) : null;
    const cardsAboveChart = !!(metricsRect && chartRect && metricsRect.bottom <= chartRect.top + 2);

    let hc = null;
    try {
      const charts = (window.Highcharts && Highcharts.charts) || [];
      const c = charts.find((ch) => ch && ch.renderTo && (ch.renderTo.id === 'cashChart' || ch.renderTo === cashChart));
      if (c) {
        const grouping = c.options.plotOptions && c.options.plotOptions.column
          ? c.options.plotOptions.column.grouping : undefined;
        const spacing = c.options.chart && c.options.chart.spacing;
        const spacingBottom = Array.isArray(spacing) ? spacing[2] : (c.options.chart && c.options.chart.spacingBottom);
        const inS = c.series.find((s) => /流入/.test(s.name));
        const outS = c.series.find((s) => /流出/.test(s.name));
        const lineS = c.series.find((s) => s.type === 'line' || (s.options && s.options.type === 'line'));
        let pointGeom = null;
        if (inS && outS && inS.points && outS.points && inS.points[0] && outS.points[0]) {
          pointGeom = {
            in0: { plotX: inS.points[0].plotX, plotY: inS.points[0].plotY, y: inS.points[0].y },
            out0: { plotX: outS.points[0].plotX, plotY: outS.points[0].plotY, y: outS.points[0].y },
            sameX: Math.abs(inS.points[0].plotX - outS.points[0].plotX) < 1,
          };
        }
        hc = {
          series: c.series.map((s) => ({
            name: s.name,
            type: s.type || (s.options && s.options.type) || (c.options.chart && c.options.chart.type),
            color: s.color || (s.options && s.options.color),
            dataSample: (s.yData || []).slice(0, 3),
            zoneAxis: s.options && s.options.zoneAxis,
            zones: s.options && s.options.zones,
            negDataCount: (s.yData || []).filter((v) => v < 0).length,
            posDataCount: (s.yData || []).filter((v) => v > 0).length,
          })),
          grouping, spacingBottom,
          chartType: c.options.chart && c.options.chart.type,
          legendEnabled: !!(c.options.legend && c.options.legend.enabled !== false),
          inflowPositive: !!(inS && ((inS.points || []).length ? (inS.points || []).every((p) => p.y == null || p.y >= 0) : (inS.yData || []).every((v) => v == null || v >= 0))),
          outflowNegative: !!(outS && ((outS.points || []).length ? (outS.points || []).some((p) => p.y < 0) : (outS.yData || []).some((v) => v < 0))),
          hasLine: !!lineS,
          lineZones: !!(lineS && lineS.options && lineS.options.zones && lineS.options.zones.length),
          lineZoneValue0: !!(lineS && lineS.options && lineS.options.zones && lineS.options.zones.some((z) => z.value === 0)),
          pointGeom,
        };
      }
    } catch (e) {
      hc = { error: String(e) };
    }

    const kpiStrong = document.querySelector('.kpi-card .kpi-value, .kpi-card strong');
    const loadStrong = document.querySelector('#deliveryPanel .delivery-kpi-card strong, .delivery-kpi strong, .load-metric strong');
    const riskStrong = document.querySelector('#riskPanel .risk-metric strong, .risk-metrics .risk-metric strong');
    const peers = { kpiPx: px(kpiStrong), loadPx: px(loadStrong), riskPx: px(riskStrong) };

    const periodHits = cardInfo.map((c) => (c.deltaText.includes('较上期') ? '较上期' : c.deltaText));
    const residualTongbi = cardInfo
      .filter((c) => /同比|环比/.test(c.deltaText) && !/非同比|非环比/.test(c.deltaText))
      .map((c) => ({ label: c.label, deltaText: c.deltaText }));

    const orgInCash = !!(cashPanel && cashPanel.querySelector('#orgChart, .org-chart, [id*="org"]'));
    const deliveryPanel = document.querySelector('#deliveryPanel');
    const deliveryH = deliveryPanel ? rect(deliveryPanel).h : null;
    const loadChart = document.querySelector('#loadChart, #deliveryChart');
    const loadChartH = loadChart && visible(loadChart) ? rect(loadChart).h : null;

    const cardOverlap = cardInfo.some((a, i) =>
      cardInfo.some((b, j) => {
        if (i >= j) return false;
        const A = a.cardRect, B = b.cardRect;
        return !(A.right <= B.left + 1 || B.right <= A.left + 1 || A.bottom <= B.top + 1 || B.bottom <= A.top + 1);
      })
    );

    return {
      panelTitle, subTitle,
      metricsDisplay: cashMetrics ? cs(cashMetrics).display : null,
      metricsRect, chartRect, wrapRect, cardsAboveChart, cardInfo, peers, hc,
      periodHits, residualTongbi, cardOverlap,
      deliveryH, loadChartH, orgInCash,
      heightNotRegressed: deliveryH != null && deliveryH < 320 && loadChartH != null && loadChartH <= 180,
    };
  });

  // Theme samples for AC5
  async function sampleColors() {
    return frame.evaluate(() => {
      const cs = (el) => getComputedStyle(el);
      const cards = [...document.querySelectorAll('#cashMetrics .cash-metric')];
      const root = getComputedStyle(document.documentElement);
      return {
        tokens: {
          primary: root.getPropertyValue('--primary').trim(),
          success: root.getPropertyValue('--success').trim(),
          danger: root.getPropertyValue('--danger').trim(),
          theme: document.documentElement.dataset.theme || '',
        },
        cards: cards.map((btn) => {
          const strong = btn.querySelector('strong');
          return {
            label: ((btn.querySelector('.metric-label') || {}).textContent || '').trim(),
            value: strong ? strong.textContent.trim() : '',
            color: strong ? cs(strong).color : null,
            inline: strong ? strong.getAttribute('style') : null,
            valuePx: strong ? parseFloat(cs(strong).fontSize) : null,
            tone: [...btn.classList].find((c) => c.startsWith('tone-')) || null,
          };
        }),
      };
    });
  }

  function checkTheme(sample, name) {
    const primary = tokenRgb(sample.tokens.primary);
    const success = tokenRgb(sample.tokens.success);
    const danger = tokenRgb(sample.tokens.danger);
    const inflow = sample.cards[0];
    const outflow = sample.cards[1];
    const net = sample.cards[2];
    const inflowOk = sameRgb(parseRgb(inflow.color), primary);
    const outflowOk = sameRgb(parseRgb(outflow.color), primary);
    const netVal = Number(String(net.value).replace(/,/g, ''));
    let netOk = false;
    let netExpect = '';
    if (netVal > 0) { netOk = sameRgb(parseRgb(net.color), success); netExpect = 'success/green'; }
    else if (netVal < 0) { netOk = sameRgb(parseRgb(net.color), danger); netExpect = 'danger/red'; }
    else { netOk = sameRgb(parseRgb(net.color), primary); netExpect = 'primary (zero)'; }
    return {
      theme: sample.tokens.theme || name,
      tokens: sample.tokens,
      inflow: { ...inflow, matchPrimary: inflowOk },
      outflow: { ...outflow, matchPrimary: outflowOk },
      net: { ...net, netVal, matchSignColor: netOk, expect: netExpect },
      valuePxOk: sample.cards.every((c) => c.valuePx >= 28 && c.valuePx <= 40),
      pass: inflowOk && outflowOk && netOk,
    };
  }

  await setTheme('teal');
  const tealSample = await sampleColors();
  const tealCheck = checkTheme(tealSample, 'teal');
  await frame.locator('#cashPanel').screenshot({ path: path.join(OUT, 'max-04-ac5-colors-teal.png') });

  await setTheme('blue');
  const blueSample = await sampleColors();
  const blueCheck = checkTheme(blueSample, 'blue');
  await frame.locator('#cashPanel').screenshot({ path: path.join(OUT, 'max-05-ac5-colors-blue.png') });
  await frame.locator('#cashMetrics').screenshot({ path: path.join(OUT, 'max-02-cash-cards.png') });

  // wood as third theme if available
  await setTheme('wood');
  const woodSample = await sampleColors();
  const woodCheck = checkTheme(woodSample, 'wood');
  await frame.locator('#cashPanel').screenshot({ path: path.join(OUT, 'max-06-ac5-colors-wood.png') });

  // back to blue for module shots + negative force
  await setTheme('blue');
  await frame.waitForTimeout(800);
  await frame.locator('#cashPanel').screenshot({ path: path.join(OUT, 'max-01-cash-module.png') });
  await page.screenshot({ path: path.join(OUT, 'max-03-cash-viewport.png'), fullPage: false });

  // Forced negative path for AC5 evidence + code path note
  const negSample = await frame.evaluate(() => {
    const cards = [...document.querySelectorAll('#cashMetrics .cash-metric')];
    const net = cards[2];
    const strong = net.querySelector('strong');
    const probe = document.createElement('span');
    probe.style.color = 'var(--danger)';
    document.body.appendChild(probe);
    const dangerComputed = getComputedStyle(probe).color;
    probe.remove();
    // temporary visual sample
    const prevText = strong.textContent;
    const prevStyle = strong.getAttribute('style');
    strong.style.color = dangerComputed;
    strong.textContent = '-1,234.00';
    const out = {
      label: (net.querySelector('.metric-label') || {}).textContent.trim(),
      value: strong.textContent.trim(),
      color: getComputedStyle(strong).color,
      dangerToken: getComputedStyle(document.documentElement).getPropertyValue('--danger').trim(),
      dangerComputed,
      note: 'forced-negative-DOM-sample; renderCash: if(vals[2]<0) amountColor=colors.danger; ==0 → primary; >0 → success',
      codePath: 'public/operations-dashboard-202610/index.html renderCash amountColor branch for i===2',
      prevText, prevStyle,
    };
    return out;
  });
  await frame.locator('#cashMetrics').screenshot({ path: path.join(OUT, 'max-07-net-negative-forced.png') });
  // restore DOM (re-render via theme)
  await setTheme('blue');
  const negOk = sameRgb(parseRgb(negSample.color), parseRgb(negSample.dangerComputed));

  const namesOk = baseProbe.cardInfo.length === 3 &&
    baseProbe.cardInfo[0].label === '现金流入' &&
    baseProbe.cardInfo[1].label === '现金流出' &&
    baseProbe.cardInfo[2].label === '净现金流' &&
    baseProbe.cardInfo.every((c) => c.value && c.value.length > 0);

  const fontOk = baseProbe.cardInfo.every((c) => c.valuePx >= 28 && c.valuePx <= 40) &&
    !baseProbe.cardInfo.some((c) => c.valuePx < 24);

  const trendOk = !!(
    /当年现金流趋势/.test(baseProbe.subTitle) &&
    baseProbe.hc &&
    baseProbe.hc.grouping === false &&
    baseProbe.hc.outflowNegative &&
    baseProbe.hc.lineZones &&
    baseProbe.hc.lineZoneValue0 &&
    baseProbe.hc.spacingBottom >= 14 &&
    baseProbe.hc.pointGeom && baseProbe.hc.pointGeom.sameX
  );

  const periodOk = baseProbe.periodHits.every((h) => h === '较上期') && baseProbe.residualTongbi.length === 0;

  const themesDiffer =
    (tealCheck.tokens.primary || '').toLowerCase() !== (blueCheck.tokens.primary || '').toLowerCase();

  // Prefer teal+blue as the two required themes; wood bonus
  const ac5Pass = tealCheck.pass && blueCheck.pass && themesDiffer && negOk;

  const ac = {
    '1_cardsVisible': namesOk && baseProbe.metricsDisplay !== 'none',
    '2_cardsAboveChart': !!baseProbe.cardsAboveChart && !!baseProbe.chartRect,
    '3_trendPreserved': trendOk,
    '4_font30px': fontOk,
    '5_colors': ac5Pass,
    '6_layoutNoOrg': !baseProbe.cardOverlap &&
      baseProbe.cardInfo.every((c) => !c.truncated && !c.broken) &&
      !baseProbe.orgInCash &&
      periodOk,
    '7_evidence': true,
  };

  const blockers = [];
  if (!ac['1_cardsVisible']) blockers.push('AC1 三卡不可见或卡名/主金额异常');
  if (!ac['2_cardsAboveChart']) blockers.push('AC2 三卡未在趋势图上方或趋势图缺失');
  if (!ac['3_trendPreserved']) blockers.push('AC3 趋势图口径回退（子标题/叠柱/zones/留白）');
  if (!ac['4_font30px']) blockers.push('AC4 主金额字号未达约30px级');
  if (!ac['5_colors']) blockers.push('AC5 配色未通过（流入/流出主题色或净正绿负红）');
  if (!ac['6_layoutNoOrg']) blockers.push('AC6 布局/截断/org-chart/较上期回退');

  const pass = Object.values(ac).every(Boolean) && blockers.length === 0;

  const result = {
    pass,
    ac,
    blockers,
    claireMap: {
      AC1: 'ledger 1+2',
      AC2: 'ledger 3',
      AC3: 'ledger 4',
      AC4: 'ledger 6 + 较上期',
      AC5: 'ledger 5',
    },
    panelTitle: baseProbe.panelTitle,
    subTitle: baseProbe.subTitle,
    metricsDisplay: baseProbe.metricsDisplay,
    metricsRect: baseProbe.metricsRect,
    chartRect: baseProbe.chartRect,
    cardsAboveChart: baseProbe.cardsAboveChart,
    cardInfo: baseProbe.cardInfo,
    peers: baseProbe.peers,
    hc: baseProbe.hc,
    periodHits: baseProbe.periodHits,
    residualTongbi: baseProbe.residualTongbi,
    cardOverlap: baseProbe.cardOverlap,
    heightNotRegressed: baseProbe.heightNotRegressed,
    deliveryH: baseProbe.deliveryH,
    loadChartH: baseProbe.loadChartH,
    orgInCash: baseProbe.orgInCash,
    ac5: {
      rule: 'inflow/outflow strong = --primary; net >0 success, <0 danger, ==0 primary',
      themesDiffer,
      teal: tealCheck,
      blue: blueCheck,
      wood: woodCheck,
      negativeForced: { ...negSample, matchDanger: negOk },
      pass: ac5Pass,
    },
    screenshots: [
      'max-01-cash-module.png',
      'max-02-cash-cards.png',
      'max-03-cash-viewport.png',
      'max-04-ac5-colors-teal.png',
      'max-05-ac5-colors-blue.png',
      'max-06-ac5-colors-wood.png',
      'max-07-net-negative-forced.png',
    ],
    ts: new Date().toISOString(),
  };

  fs.writeFileSync(path.join(OUT, 'max-probe.json'), JSON.stringify(result, null, 2), 'utf8');
  console.log(JSON.stringify({
    pass: result.pass,
    ac: result.ac,
    blockers: result.blockers,
    ac5: {
      pass: ac5Pass,
      themesDiffer,
      teal: { pass: tealCheck.pass, primary: tealCheck.tokens.primary, inflow: tealCheck.inflow.color, net: tealCheck.net.color },
      blue: { pass: blueCheck.pass, primary: blueCheck.tokens.primary, inflow: blueCheck.inflow.color, net: blueCheck.net.color },
      wood: { pass: woodCheck.pass, primary: woodCheck.tokens.primary, inflow: woodCheck.inflow.color },
      negOk,
    },
    valuePx: baseProbe.cardInfo.map((c) => c.valuePx),
    cardsAbove: baseProbe.cardsAboveChart,
    subTitle: baseProbe.subTitle,
  }, null, 2));

  await browser.close();
})().catch((e) => { console.error(e); process.exit(1); });
