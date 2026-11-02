const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

(async () => {
  const OUT = path.resolve('docs/evidence/2026-11-02-ops-metric-font');
  fs.mkdirSync(OUT, { recursive: true });

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
  await frame.waitForSelector('#monthlyLoadVal, .kpi-value, #riskMetrics', { timeout: 30000 });
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
    const px = (el) => (el ? parseFloat(cs(el).fontSize) : null);
    const text = (el) => (el ? el.textContent.replace(/\s+/g, ' ').trim() : '');

    // Load rate baseline (must not regress to ~17)
    const mVal = document.querySelector('#monthlyLoadVal');
    const aVal = document.querySelector('#annualLoadVal');
    const mSub = document.querySelector('#monthlyLoadSub');
    const aSub = document.querySelector('#annualLoadSub');
    const load = {
      monthlyPx: px(mVal),
      annualPx: px(aVal),
      mSubPx: px(mSub),
      aSubPx: px(aSub),
      monthlyText: text(mVal),
      annualText: text(aVal),
      monthlySub: text(mSub),
      annualSub: text(aSub),
      whiteSpaceM: mVal ? cs(mVal).whiteSpace : null,
      overflowM: mVal ? cs(mVal).textOverflow : null
    };

    // KPI four cards
    const kpiEls = [...document.querySelectorAll('.kpi-value')].filter(visible);
    const kpiCards = [...document.querySelectorAll('.kpi-card')].filter(visible);
    const kpiInfo = kpiEls.map((el, i) => {
      const card = el.closest('.kpi-card');
      const title = card ? text(card.querySelector('.kpi-title')) : '';
      const r = rect(el);
      const truncated =
        text(el).includes('…') ||
        (cs(el).textOverflow === 'ellipsis' && el.scrollWidth > el.clientWidth + 1);
      const broken = r.h > px(el) * 1.8;
      return {
        i,
        title,
        text: text(el),
        px: px(el),
        whiteSpace: cs(el).whiteSpace,
        textOverflow: cs(el).textOverflow,
        truncated,
        broken,
        color: cs(el).color,
        rect: r
      };
    });

    // KPI sub / delta
    const kpiDeltaLabels = [...document.querySelectorAll('.kpi-delta-label, .kpi-meta')].filter(visible).map(el => ({
      text: text(el), px: px(el)
    }));
    const kpiDeltaNums = [...document.querySelectorAll('.kpi-delta-num')].filter(visible).map(el => ({
      text: text(el), px: px(el)
    }));

    // Risk four cards
    const riskBtns = [...document.querySelectorAll('#riskMetrics .risk-metric, .risk-metrics .risk-metric')].filter(visible);
    const riskInfo = riskBtns.map((btn, i) => {
      const strong = btn.querySelector('strong');
      const small = btn.querySelector('small, .risk-period');
      const label = text(btn.querySelector('.metric-label'));
      const r = strong ? rect(strong) : null;
      const truncated = strong && (
        text(strong).includes('…') ||
        (cs(strong).textOverflow === 'ellipsis' && strong.scrollWidth > strong.clientWidth + 1)
      );
      const broken = strong && r && r.h > px(strong) * 1.8;
      return {
        i,
        label,
        text: text(strong),
        px: px(strong),
        smallText: text(small),
        smallPx: px(small),
        whiteSpace: strong ? cs(strong).whiteSpace : null,
        truncated: !!truncated,
        broken: !!broken,
        color: strong ? cs(strong).color : null,
        smallColor: small ? cs(small).color : null,
        rect: r
      };
    });

    // Geometry: KPI grid + risk 2x2 no overlap
    const kpiRects = kpiCards.map(rect);
    let kpiOverlap = false;
    for (let i = 0; i < kpiRects.length; i++) {
      for (let j = i + 1; j < kpiRects.length; j++) {
        const a = kpiRects[i], b = kpiRects[j];
        const ox = Math.min(a.right, b.right) - Math.max(a.left, b.left);
        const oy = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
        if (ox > 1 && oy > 1) kpiOverlap = true;
      }
    }
    const riskRects = riskBtns.map(rect);
    let riskOverlap = false;
    for (let i = 0; i < riskRects.length; i++) {
      for (let j = i + 1; j < riskRects.length; j++) {
        const a = riskRects[i], b = riskRects[j];
        const ox = Math.min(a.right, b.right) - Math.max(a.left, b.left);
        const oy = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
        if (ox > 1 && oy > 1) riskOverlap = true;
      }
    }

    // Delivery height baseline from visual polish Max: panelH≈268.3, loadH=150
    const deliveryPanel = document.querySelector('#deliveryPanel');
    const deliveryLayout = document.querySelector('.delivery-layout');
    const loadChart = document.querySelector('#loadChart');
    const left = document.querySelector('.delivery-left');
    const mid = document.querySelector('.delivery-mid');
    const right = document.querySelector('.delivery-right');
    const colW = [left, mid, right].map(el => (el ? rect(el).w : 0));
    const sumW = colW.reduce((a, b) => a + b, 0) || 1;
    const ratios = { left: colW[0] / sumW, mid: colW[1] / sumW, right: colW[2] / sumW };
    const dR = deliveryPanel ? rect(deliveryPanel) : null;
    const lR = deliveryLayout ? rect(deliveryLayout) : null;
    const lcR = loadChart ? rect(loadChart) : null;
    const baselinePanelH = 268.3;
    const baselineLoadH = 150;
    const heightNotRegressed =
      dR && lcR &&
      dR.h <= baselinePanelH + 24 &&
      lcR.h <= baselineLoadH + 8;

    // 较上期 still present; no visible 同比/环比 compare labels (tip 非同比非阻断)
    const periodHits = [];
    const walker = document.createTreeWalker(document.querySelector('main') || document.body, NodeFilter.SHOW_TEXT, {
      acceptNode(node) {
        const p = node.parentElement;
        if (!p) return NodeFilter.FILTER_REJECT;
        if (['SCRIPT', 'STYLE', 'NOSCRIPT', 'TEMPLATE'].includes(p.tagName)) return NodeFilter.FILTER_REJECT;
        if (!visible(p)) return NodeFilter.FILTER_REJECT;
        const t = node.textContent.replace(/\s+/g, ' ').trim();
        if (!t) return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      }
    });
    let n;
    while ((n = walker.nextNode())) {
      const t = n.textContent.replace(/\s+/g, ' ').trim();
      if (/较上期|同比|环比/.test(t)) periodHits.push(t);
    }
    const hasJiaoshangqi = periodHits.some(t => t.includes('较上期'));
    const residualTongbiHuanbi = periodHits.filter(t => {
      const stripped = t.replace(/非同比/g, '');
      return /同比|环比/.test(stripped);
    });

    // Cash stack still present (non-regression soft check)
    const cashCanvas = document.querySelector('#cashflowChart, #cashChart, canvas');
    const cashPanel = document.querySelector('#cashflowPanel, [data-panel="cashflow"], .cash-panel');

    // AC judgments
    // ~30px level: >= 28 and not stuck at 20-24. Align with load (same magnitude).
    const kpiAll30 =
      kpiInfo.length >= 4 &&
      kpiInfo.every(k => k.px != null && k.px >= 28 && k.px < 40);
    const kpiNotStuckSmall = kpiInfo.every(k => k.px != null && k.px > 25);
    const riskAll30 =
      riskInfo.length >= 4 &&
      riskInfo.every(r => r.px != null && r.px >= 28 && r.px < 40);
    const riskNotStuckSmall = riskInfo.every(r => r.px != null && r.px > 25);
    // same magnitude as load: within ~6px of load monthly
    const loadRef = load.monthlyPx;
    const alignLoad =
      loadRef != null &&
      kpiInfo.every(k => Math.abs(k.px - loadRef) <= 6) &&
      riskInfo.every(r => Math.abs(r.px - loadRef) <= 6);

    const noTruncate =
      kpiInfo.every(k => !k.truncated && !k.broken) &&
      riskInfo.every(r => !r.truncated && !r.broken);

    const loadNotRegressed =
      load.monthlyPx != null && load.annualPx != null &&
      load.monthlyPx >= 28 && load.annualPx >= 28 &&
      load.monthlyPx > 20; // clearly not ~17

    const periodOk = hasJiaoshangqi && residualTongbiHuanbi.length === 0;
    const loadSubsPeriod =
      (load.monthlySub || '').includes('较上期') &&
      (load.annualSub || '').includes('较上期');

    const ratioOk =
      Math.abs(ratios.left - 0.25) <= 0.04 &&
      Math.abs(ratios.mid - 0.5) <= 0.04 &&
      Math.abs(ratios.right - 0.25) <= 0.04;

    const ac = {
      ac1_kpi30px: kpiAll30 && kpiNotStuckSmall && alignLoad,
      ac2_risk30px: riskAll30 && riskNotStuckSmall && alignLoad,
      ac3_subOk: true, // optional enlarge; record values
      ac4_layout: !kpiOverlap && !riskOverlap && noTruncate && !!heightNotRegressed && ratioOk,
      ac5_noRegression: loadNotRegressed && periodOk && loadSubsPeriod,
      ac6_evidence: true
    };

    const blockers = [];
    if (!ac.ac1_kpi30px) blockers.push('AC1 顶部KPI四卡主金额未达约30px级或未与负荷率同量级（仍停在约20–24px级）');
    if (!ac.ac2_risk30px) blockers.push('AC2 应收四卡主金额未达约30px级或未与负荷率同量级');
    if (!ac.ac4_layout) {
      if (kpiOverlap) blockers.push('AC4 KPI网格卡片重叠');
      if (riskOverlap) blockers.push('AC4 应收2×2卡片重叠');
      if (!noTruncate) blockers.push('AC4 主数字截断或换行破碎');
      if (!heightNotRegressed) blockers.push('AC4 交付保障高度相对基线显著回撑');
      if (!ratioOk) blockers.push('AC4 三栏比例被挤破');
    }
    if (!ac.ac5_noRegression) {
      if (!loadNotRegressed) blockers.push('AC5 负荷率字号回退（非≥28px量级）');
      if (!periodOk || !loadSubsPeriod) blockers.push('AC5 「较上期」标签回退或出现同比/环比可见对比口径');
    }

    return {
      ac,
      pass: ac.ac1_kpi30px && ac.ac2_risk30px && ac.ac3_subOk && ac.ac4_layout && ac.ac5_noRegression && ac.ac6_evidence,
      blockers,
      load,
      kpiInfo,
      riskInfo,
      kpiDeltaLabels,
      kpiDeltaNums,
      geometry: {
        kpiOverlap,
        riskOverlap,
        ratios,
        colW,
        panelH: dR ? dR.h : null,
        layoutH: lR ? lR.h : null,
        loadH: lcR ? lcR.h : null,
        baselinePanelH,
        baselineLoadH,
        heightNotRegressed: !!heightNotRegressed,
        kpiRects,
        riskRects
      },
      period: {
        hasJiaoshangqi,
        loadSubsPeriod,
        residualTongbiHuanbi,
        periodHits: periodHits.slice(0, 24)
      },
      viewportHint: { innerWidth: window.innerWidth, innerHeight: window.innerHeight },
      beforeAnchor: { kpi: '23–32px(压缩)', risk: '18–26px/常见~20px', loadRefPrevMax: '~34px@1600' },
      ts: new Date().toISOString()
    };
  });

  async function shot(name, selector) {
    const loc = frame.locator(selector).first();
    const p = path.join(OUT, name);
    if (await loc.count()) {
      await loc.screenshot({ path: p });
    } else {
      await page.screenshot({ path: p, fullPage: false });
    }
    return p;
  }

  const shots = {
    'max-01-kpi-values.png': await shot('max-01-kpi-values.png', '.kpi-grid, #kpiRow, main > section:first-child, .kpi-card'),
    'max-02-risk-values.png': await shot('max-02-risk-values.png', '#riskMetrics'),
    'max-03-load-compare.png': await shot('max-03-load-compare.png', '.delivery-left'),
    'max-04-delivery-panel.png': await shot('max-04-delivery-panel.png', '#deliveryPanel')
  };

  // Prefer a wider KPI strip shot
  const kpiStrip = frame.locator('.kpi-grid, #kpiCards, #kpiRow').first();
  if (await kpiStrip.count()) {
    await kpiStrip.screenshot({ path: path.join(OUT, 'max-01-kpi-values.png') });
  } else {
    // screenshot first four kpi cards area via evaluate clip
    const box = await frame.evaluate(() => {
      const cards = [...document.querySelectorAll('.kpi-card')];
      if (!cards.length) return null;
      const rs = cards.map(c => c.getBoundingClientRect());
      const left = Math.min(...rs.map(r => r.left));
      const top = Math.min(...rs.map(r => r.top));
      const right = Math.max(...rs.map(r => r.right));
      const bottom = Math.max(...rs.map(r => r.bottom));
      return { x: left, y: top, width: right - left, height: bottom - top };
    });
    if (box && box.width > 0) {
      // need page-relative; if iframe, adjust
      const iframeEl = page.locator('iframe').first();
      let offset = { x: 0, y: 0 };
      if (await iframeEl.count()) {
        const ib = await iframeEl.boundingBox();
        if (ib) offset = { x: ib.x, y: ib.y };
      }
      await page.screenshot({
        path: path.join(OUT, 'max-01-kpi-values.png'),
        clip: {
          x: Math.max(0, offset.x + box.x),
          y: Math.max(0, offset.y + box.y),
          width: Math.min(1600, box.width + 4),
          height: Math.min(400, box.height + 4)
        }
      });
    }
  }

  const out = {
    pass: probe.pass,
    ac: probe.ac,
    blockers: probe.blockers,
    load: probe.load,
    kpiInfo: probe.kpiInfo,
    riskInfo: probe.riskInfo,
    kpiDeltaLabels: probe.kpiDeltaLabels,
    kpiDeltaNums: probe.kpiDeltaNums,
    geometry: probe.geometry,
    period: probe.period,
    viewportHint: probe.viewportHint,
    beforeAnchor: probe.beforeAnchor,
    shots: Object.keys(shots),
    url,
    viewport: { width: 1600, height: 1000 },
    ts: probe.ts
  };

  fs.writeFileSync(path.join(OUT, 'max-probe.json'), JSON.stringify(out, null, 2), 'utf8');
  console.log(JSON.stringify({
    pass: probe.pass,
    blockers: probe.blockers,
    ac: probe.ac,
    loadPx: [probe.load.monthlyPx, probe.load.annualPx],
    kpiPx: probe.kpiInfo.map(k => k.px),
    kpiText: probe.kpiInfo.map(k => k.text),
    riskPx: probe.riskInfo.map(r => r.px),
    riskText: probe.riskInfo.map(r => ({ label: r.label, text: r.text, small: r.smallText, smallPx: r.smallPx })),
    geometry: {
      kpiOverlap: probe.geometry.kpiOverlap,
      riskOverlap: probe.geometry.riskOverlap,
      ratios: probe.geometry.ratios,
      panelH: probe.geometry.panelH,
      loadH: probe.geometry.loadH,
      heightOk: probe.geometry.heightNotRegressed
    },
    period: probe.period,
    viewportHint: probe.viewportHint,
    deltaLabels: probe.kpiDeltaLabels,
    deltaNums: probe.kpiDeltaNums
  }, null, 2));

  await browser.close();
})().catch(e => { console.error('PROBE_FAIL', e); process.exit(1); });
