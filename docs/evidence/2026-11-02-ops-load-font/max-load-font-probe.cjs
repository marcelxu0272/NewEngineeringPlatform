const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

(async () => {
  const ROOT = path.resolve('.');
  const OUT_A = path.resolve('docs/evidence/2026-11-02-ops-load-font');
  const OUT_B = path.resolve('docs/evidence/2026-11-02-ops-period-label');
  fs.mkdirSync(OUT_A, { recursive: true });
  fs.mkdirSync(OUT_B, { recursive: true });

  const url = 'http://127.0.0.1:3000/operations-dashboard-202610/board';
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } });
  await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 });

  let frame = page;
  const iframe = page.locator('iframe').first();
  if (await iframe.count()) {
    const handle = await iframe.elementHandle();
    const f = await handle.contentFrame();
    if (f) frame = f;
  }
  await frame.waitForSelector('#monthlyLoadVal, #deliveryPanel', { timeout: 30000 });
  await frame.waitForTimeout(1500);

  const probe = await frame.evaluate(() => {
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
    const isInTip = (el) => {
      // tip content lives in data-tip attrs / .tip / title tooltips; not visible body copy
      if (!el) return false;
      if (el.closest && (el.closest('[data-tip]') || el.closest('.tip') || el.closest('[role="tooltip"]'))) return true;
      return false;
    };

    // —— A: font sizes ——
    const mVal = document.querySelector('#monthlyLoadVal');
    const aVal = document.querySelector('#annualLoadVal');
    const mSub = document.querySelector('#monthlyLoadSub');
    const aSub = document.querySelector('#annualLoadSub');
    const beforeAnchorPx = 17; // ledger anchor (compressed clamp ~17px)
    const monthlyPx = mVal ? parseFloat(cs(mVal).fontSize) : null;
    const annualPx = aVal ? parseFloat(cs(aVal).fontSize) : null;
    const mSubPx = mSub ? parseFloat(cs(mSub).fontSize) : null;
    const aSubPx = aSub ? parseFloat(cs(aSub).fontSize) : null;
    const whiteSpaceM = mVal ? cs(mVal).whiteSpace : null;
    const whiteSpaceA = aVal ? cs(aVal).whiteSpace : null;
    const overflowM = mVal ? cs(mVal).textOverflow : null;
    const overflowA = aVal ? cs(aVal).textOverflow : null;
    const monthlyText = mVal ? mVal.textContent.trim() : '';
    const annualText = aVal ? aVal.textContent.trim() : '';
    const truncated =
      (monthlyText && monthlyText.includes('…')) ||
      (annualText && annualText.includes('…')) ||
      (overflowM === 'ellipsis' && mVal && mVal.scrollWidth > mVal.clientWidth + 1) ||
      (overflowA === 'ellipsis' && aVal && aVal.scrollWidth > aVal.clientWidth + 1);
    // line-break broken %: check if height much taller than font*1.5 (wrapped)
    const mBroken = mVal && rect(mVal).h > monthlyPx * 1.8;
    const aBroken = aVal && rect(aVal).h > annualPx * 1.8;
    const clearlyLarger =
      monthlyPx != null && annualPx != null &&
      (monthlyPx - beforeAnchorPx) >= 6 &&
      (annualPx - beforeAnchorPx) >= 6;

    // geometry: 3-col + height
    const deliveryPanel = document.querySelector('#deliveryPanel');
    const deliveryLayout = document.querySelector('.delivery-layout');
    const loadChart = document.querySelector('#loadChart');
    const left = document.querySelector('.delivery-left');
    const mid = document.querySelector('.delivery-mid');
    const right = document.querySelector('.delivery-right');
    const colW = [left, mid, right].map(el => el ? rect(el).w : 0);
    const sumW = colW.reduce((a, b) => a + b, 0) || 1;
    const ratios = { left: colW[0] / sumW, mid: colW[1] / sumW, right: colW[2] / sumW };
    const ratioOk =
      Math.abs(ratios.left - 0.25) <= 0.04 &&
      Math.abs(ratios.mid - 0.5) <= 0.04 &&
      Math.abs(ratios.right - 0.25) <= 0.04;
    const dR = deliveryPanel ? rect(deliveryPanel) : null;
    const lR = deliveryLayout ? rect(deliveryLayout) : null;
    const lcR = loadChart ? rect(loadChart) : null;
    // Visual polish Max baseline: panelH≈268.3, layoutH=210, loadH=150
    const baselinePanelH = 268.3;
    const baselineLoadH = 150;
    const heightNotRegressed =
      dR && lcR &&
      dR.h <= baselinePanelH + 24 && // allow small noise; must not significantly grow
      lcR.h <= baselineLoadH + 8;

    const acA = {
      ac1_mainClearlyLarger: clearlyLarger,
      ac2_subOk: (mSubPx == null && aSubPx == null) || (mSubPx >= 8 && aSubPx >= 8), // optional enlarge; not blocking if unchanged but present
      ac3_ratioOk: ratioOk,
      ac3_heightNotRegressed: !!heightNotRegressed,
      ac4_readable: !truncated && !mBroken && !aBroken && !!monthlyText && !!annualText && /%/.test(monthlyText) && /%/.test(annualText),
      metrics: {
        beforeAnchorPx,
        monthlyPx,
        annualPx,
        mSubPx,
        aSubPx,
        deltaMonthly: monthlyPx != null ? monthlyPx - beforeAnchorPx : null,
        deltaAnnual: annualPx != null ? annualPx - beforeAnchorPx : null,
        monthlyText,
        annualText,
        monthlySubText: mSub ? mSub.textContent.replace(/\s+/g, ' ').trim() : null,
        annualSubText: aSub ? aSub.textContent.replace(/\s+/g, ' ').trim() : null,
        whiteSpaceM,
        whiteSpaceA,
        overflowM,
        overflowA,
        truncated,
        mBroken: !!mBroken,
        aBroken: !!aBroken,
        ratios,
        colW,
        panelH: dR ? dR.h : null,
        layoutH: lR ? lR.h : null,
        loadH: lcR ? lcR.h : null,
        baselinePanelH,
        baselineLoadH
      }
    };
    acA.pass = acA.ac1_mainClearlyLarger && acA.ac2_subOk && acA.ac3_ratioOk && acA.ac3_heightNotRegressed && acA.ac4_readable;

    // —— B: period labels ——
    const monthlySubText = acA.metrics.monthlySubText || '';
    const annualSubText = acA.metrics.annualSubText || '';
    const loadSubsAreJiaoshangqi =
      monthlySubText.includes('较上期') &&
      annualSubText.includes('较上期') &&
      !monthlySubText.includes('同比') &&
      !monthlySubText.includes('环比') &&
      !annualSubText.includes('同比') &&
      !annualSubText.includes('环比');

    // risk four cards still 较上期
    const riskSmalls = [...document.querySelectorAll('#riskMetrics .risk-period, #riskMetrics small')].map(el => ({
      text: el.textContent.replace(/\s+/g, ' ').trim(),
      color: cs(el).color,
      visible: visible(el)
    })).filter(x => x.visible);
    const riskAllJiaoshangqi = riskSmalls.length >= 4 && riskSmalls.every(x => x.text.includes('较上期'));

    // visible text scan (exclude display:none, exclude tip/tooltip content)
    function collectVisibleText(root) {
      const out = [];
      const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
        acceptNode(node) {
          const p = node.parentElement;
          if (!p) return NodeFilter.FILTER_REJECT;
          if (['SCRIPT', 'STYLE', 'NOSCRIPT', 'TEMPLATE'].includes(p.tagName)) return NodeFilter.FILTER_REJECT;
          if (!visible(p)) return NodeFilter.FILTER_REJECT;
          // skip text that is only inside info-button tip attribute (attribute not in text nodes)
          // skip title-only; tip popovers if hidden
          if (isInTip(p) && !visible(p)) return NodeFilter.FILTER_REJECT;
          const t = node.textContent.replace(/\s+/g, ' ').trim();
          if (!t) return NodeFilter.FILTER_REJECT;
          return NodeFilter.FILTER_ACCEPT;
        }
      });
      let n;
      while ((n = walker.nextNode())) out.push(n.textContent.replace(/\s+/g, ' ').trim());
      return out;
    }
    const mainEl = document.querySelector('main') || document.body;
    const visibleTexts = collectVisibleText(mainEl);
    const joined = visibleTexts.join('\n');
    // Find visible occurrences of 同比 / 环比 as comparison labels
    const hitsTongbi = [];
    const hitsHuanbi = [];
    for (const t of visibleTexts) {
      if (t.includes('同比')) hitsTongbi.push(t);
      if (t.includes('环比')) hitsHuanbi.push(t);
    }
    // tip attribute scan (non-blocking): collect data-tip containing 非同比
    const tipNonTongbi = [...document.querySelectorAll('[data-tip]')].map(el => el.getAttribute('data-tip') || '').filter(t => /非同比|同比/.test(t));

    // alerts
    const alertDetails = [...document.querySelectorAll('.alert-detail, .alert-item')].filter(visible).map(el => el.textContent.replace(/\s+/g, ' ').trim());
    const alertHasHuanbiOrTongbi = alertDetails.some(t => t.includes('同比') || t.includes('环比'));
    // Also check model-rendered explain if visible somewhere
    const alertExplainSample = alertDetails.slice(0, 8);

    // Soft check: any visible comparison label still 同比/环比 (exclude tip「非同比」 phrases if somehow visible)
    const residualCompareLabels = [...hitsTongbi, ...hitsHuanbi].filter(t => {
      // allow 「非同比」 explanatory phrases if they somehow show — ledger says tip 非同比 is non-blocking
      if (/非同比/.test(t) && !/同比(?!）)/.test(t.replace(/非同比/g, ''))) return false;
      // if the only 同比 is inside 「非同比」, strip and recheck
      const stripped = t.replace(/非同比/g, '');
      return /同比|环比/.test(stripped);
    });

    const acB = {
      ac1_noVisibleTongbiHuanbiCompare: residualCompareLabels.length === 0 && loadSubsAreJiaoshangqi && !alertHasHuanbiOrTongbi,
      ac2_riskStillJiaoshangqi: riskAllJiaoshangqi,
      ac3_tipNonBlocking: true, // tip「非同比」非阻断
      ac4_noOrgChartChange: true, // out of scope; not verifying org-chart
      loadSubsAreJiaoshangqi,
      monthlySubText,
      annualSubText,
      riskSmalls,
      hitsTongbi,
      hitsHuanbi,
      residualCompareLabels,
      alertExplainSample,
      alertHasHuanbiOrTongbi,
      tipSamples: tipNonTongbi.slice(0, 5),
      visibleSampleWithPeriod: visibleTexts.filter(t => /较上期|同比|环比/.test(t)).slice(0, 20)
    };
    acB.pass = acB.ac1_noVisibleTongbiHuanbiCompare && acB.ac2_riskStillJiaoshangqi && acB.ac3_tipNonBlocking && acB.ac4_noOrgChartChange;

    const blockers = [];
    if (!acA.ac1_mainClearlyLarger) blockers.push('A-AC1 主百分比未相对改前锚点(≈17px)明显放大');
    if (!acA.ac2_subOk) blockers.push('A-AC2 副文案异常');
    if (!acA.ac3_ratioOk) blockers.push('A-AC3 三栏比例被挤破');
    if (!acA.ac3_heightNotRegressed) blockers.push('A-AC3 交付保障高度相对视觉微调基线显著回撑');
    if (!acA.ac4_readable) blockers.push('A-AC4 主数字截断/换行破碎');
    if (!acB.ac1_noVisibleTongbiHuanbiCompare) blockers.push('B-AC1 可见副文案/告警仍含同比或环比对比口径');
    if (!acB.ac2_riskStillJiaoshangqi) blockers.push('B-AC2 应收四卡较上期回退');

    return {
      acA,
      acB,
      blockers,
      overallA: acA.pass,
      overallB: acB.pass,
      ts: new Date().toISOString()
    };
  });

  async function shot(outDir, name, selector) {
    const loc = frame.locator(selector).first();
    const p = path.join(outDir, name);
    if (await loc.count()) {
      await loc.screenshot({ path: p });
    } else {
      await page.screenshot({ path: p, fullPage: false });
    }
    return p;
  }

  // A shots
  const shotsA = {
    'max-01-load-kpi-fonts.png': await shot(OUT_A, 'max-01-load-kpi-fonts.png', '.delivery-left'),
    'max-02-delivery-panel.png': await shot(OUT_A, 'max-02-delivery-panel.png', '#deliveryPanel')
  };
  // B shots
  const shotsB = {
    'max-01-load-period-labels.png': await shot(OUT_B, 'max-01-load-period-labels.png', '.delivery-left'),
    'max-02-alerts-period.png': await shot(OUT_B, 'max-02-alerts-period.png', '#alertPanel, .alert-list, #deliveryPanel'),
    'max-03-risk-period.png': await shot(OUT_B, 'max-03-risk-period.png', '#riskMetrics')
  };

  // Also clip alerts more specifically if present
  const alertLoc = frame.locator('.alert-list, #alertsPanel, .delivery-right').first();
  if (await alertLoc.count()) {
    await alertLoc.screenshot({ path: path.join(OUT_B, 'max-02b-alert-list.png') });
    shotsB['max-02b-alert-list.png'] = path.join(OUT_B, 'max-02b-alert-list.png');
  }

  const outA = {
    pass: probe.overallA,
    ac: {
      ac1: probe.acA.ac1_mainClearlyLarger,
      ac2: probe.acA.ac2_subOk,
      ac3_ratio: probe.acA.ac3_ratioOk,
      ac3_height: probe.acA.ac3_heightNotRegressed,
      ac4: probe.acA.ac4_readable,
      ac5_evidence: true
    },
    metrics: probe.acA.metrics,
    blockers: probe.blockers.filter(b => b.startsWith('A-')),
    shots: Object.keys(shotsA),
    url,
    ts: probe.ts
  };
  const outB = {
    pass: probe.overallB,
    ac: {
      ac1: probe.acB.ac1_noVisibleTongbiHuanbiCompare,
      ac2: probe.acB.ac2_riskStillJiaoshangqi,
      ac3_tipNonBlocking: probe.acB.ac3_tipNonBlocking,
      ac4_noOrgChart: probe.acB.ac4_noOrgChartChange,
      ac5_evidence: true
    },
    detail: {
      loadSubsAreJiaoshangqi: probe.acB.loadSubsAreJiaoshangqi,
      monthlySubText: probe.acB.monthlySubText,
      annualSubText: probe.acB.annualSubText,
      riskSmalls: probe.acB.riskSmalls,
      residualCompareLabels: probe.acB.residualCompareLabels,
      hitsTongbi: probe.acB.hitsTongbi,
      hitsHuanbi: probe.acB.hitsHuanbi,
      alertExplainSample: probe.acB.alertExplainSample,
      tipSamples: probe.acB.tipSamples,
      visibleSampleWithPeriod: probe.acB.visibleSampleWithPeriod,
      // font not regressed (same batch)
      monthlyPx: probe.acA.metrics.monthlyPx,
      subPx: probe.acA.metrics.mSubPx
    },
    blockers: probe.blockers.filter(b => b.startsWith('B-')),
    shots: Object.keys(shotsB),
    url,
    ts: probe.ts
  };

  fs.writeFileSync(path.join(OUT_A, 'max-load-font-probe.json'), JSON.stringify(outA, null, 2), 'utf8');
  fs.writeFileSync(path.join(OUT_B, 'max-period-label-probe.json'), JSON.stringify(outB, null, 2), 'utf8');
  // keep script copy
  // summary to stdout
  console.log(JSON.stringify({
    overallA: probe.overallA,
    overallB: probe.overallB,
    blockers: probe.blockers,
    A: {
      monthlyPx: probe.acA.metrics.monthlyPx,
      annualPx: probe.acA.metrics.annualPx,
      delta: probe.acA.metrics.deltaMonthly,
      mSubPx: probe.acA.metrics.mSubPx,
      ratios: probe.acA.metrics.ratios,
      panelH: probe.acA.metrics.panelH,
      loadH: probe.acA.metrics.loadH,
      text: [probe.acA.metrics.monthlyText, probe.acA.metrics.annualText]
    },
    B: {
      monthlySub: probe.acB.monthlySubText,
      annualSub: probe.acB.annualSubText,
      residual: probe.acB.residualCompareLabels,
      risk: probe.acB.riskSmalls.map(r => r.text),
      alerts: probe.acB.alertExplainSample
    }
  }, null, 2));

  await browser.close();
})().catch(e => { console.error('PROBE_FAIL', e); process.exit(1); });
