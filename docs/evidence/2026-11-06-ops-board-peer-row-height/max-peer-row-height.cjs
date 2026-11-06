/**
 * Max 独立验收探针 — Board 经营全景同行等高
 * 对照：docs/需求文档/202611_运营看板202610_Board目标态视觉与口径公共规格.md
 *       增补「Board 经营全景同行等高」
 *       docs/变更账本.md「2026-11-06 —— Issue 3 仓内正式镜像与 Board 经营全景同行等高公共规则」
 *
 * 只量测树顶「运营看板」经营全景。不改业务源码，不采信实现方 probe 结论。
 * 几何量只作证据。1px 仅表示 getBoundingClientRect 的亚像素/边框取整噪声，不是新的业务阈值。
 */
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const OUT = __dirname;
const BASE = process.env.MAX_BASE || 'http://127.0.0.1:3456';
const NOISE_PX = 1;

const UNITS = [
  '全部板块',
  'SAS170 PMC板块',
  'SAS610 咨询板块',
  'SAS680 数字技术板块',
  'SAS650 新材料板块',
  'SAS710 生命科学板块',
  'SAS690 COII板块',
  'SAS720 模块化板块',
  'SAS670 供应链板块',
  'SAS520 金山中心',
  'SAS560 沈阳中心',
  'SAS550 惠湛中心',
  'SAS530 银川中心',
];

function round1(n) {
  return Math.round(n * 10) / 10;
}

async function measureIn(target) {
  return target.evaluate(() => {
    const round1 = (n) => Math.round(n * 10) / 10;
    const box = (el) => el.getBoundingClientRect();
    const visible = (el) => {
      if (!el) return false;
      const s = getComputedStyle(el);
      if (s.display === 'none' || s.visibility === 'hidden') return false;
      const r = box(el);
      return r.width > 0 && r.height > 0;
    };
    const labelOf = (el) => {
      const t = (el.innerText || el.textContent || '').replace(/\s+/g, ' ').trim();
      return t.slice(0, 42);
    };
    const padBox = (el) => {
      const r = box(el);
      const s = getComputedStyle(el);
      const bt = parseFloat(s.borderTopWidth) || 0;
      const bb = parseFloat(s.borderBottomWidth) || 0;
      const pt = parseFloat(s.paddingTop) || 0;
      const pb = parseFloat(s.paddingBottom) || 0;
      return {
        top: r.top + bt + pt,
        bottom: r.bottom - bb - pb,
        left: r.left + (parseFloat(s.borderLeftWidth) || 0) + (parseFloat(s.paddingLeft) || 0),
        right: r.right - (parseFloat(s.borderRightWidth) || 0) - (parseFloat(s.paddingRight) || 0),
        pb,
        pt,
      };
    };
    const inkExtent = (el) => {
      let bottom = -Infinity;
      let top = Infinity;
      const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
      let node;
      while ((node = walker.nextNode())) {
        if (!node.textContent || !node.textContent.trim()) continue;
        const parent = node.parentElement;
        if (!parent) continue;
        const ps = getComputedStyle(parent);
        if (ps.display === 'none' || ps.visibility === 'hidden') continue;
        const range = document.createRange();
        range.selectNodeContents(node);
        for (const r of range.getClientRects()) {
          if (r.width <= 0 || r.height <= 0) continue;
          bottom = Math.max(bottom, r.bottom);
          top = Math.min(top, r.top);
        }
      }
      el.querySelectorAll('svg').forEach((svg) => {
        const s = getComputedStyle(svg);
        if (s.display === 'none' || s.visibility === 'hidden') return;
        const r = svg.getBoundingClientRect();
        if (r.width <= 0 || r.height <= 0) return;
        bottom = Math.max(bottom, r.bottom);
        top = Math.min(top, r.top);
      });
      return { top, bottom };
    };
    const clipsIn = (el) => {
      const hits = [];
      const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
      let node;
      let seen = 0;
      while ((node = walker.nextNode())) {
        if (!node.textContent || !node.textContent.trim()) continue;
        const parent = node.parentElement;
        if (!parent || parent.closest('svg')) continue;
        const ps = getComputedStyle(parent);
        if (ps.display === 'none' || ps.visibility === 'hidden') continue;
        const range = document.createRange();
        range.selectNodeContents(node);
        const rects = [...range.getClientRects()].filter((r) => r.width > 0 && r.height > 0);
        if (!rects.length) continue;
        let clipper = parent;
        while (clipper && clipper !== el.parentElement) {
          const cs = getComputedStyle(clipper);
          const ox = cs.overflowX;
          const oy = cs.overflowY;
          const clipsX = ox === 'hidden' || ox === 'clip' || ox === 'auto' || ox === 'scroll';
          const clipsY = oy === 'hidden' || oy === 'clip' || oy === 'auto' || oy === 'scroll';
          if (clipsX || clipsY) {
            const host = box(clipper);
            for (const r of rects) {
              const dx = clipsX ? Math.max(host.left - r.left, r.right - host.right) : 0;
              const dy = clipsY ? Math.max(host.top - r.top, r.bottom - host.bottom) : 0;
              if (dx > 1 || dy > 1) {
                hits.push({
                  text: node.textContent.trim().slice(0, 36),
                  dx: round1(dx),
                  dy: round1(dy),
                  clipper: clipper.id || String(clipper.className).slice(0, 40),
                });
                seen += 1;
                break;
              }
            }
          }
          if (seen > 12) return hits;
          clipper = clipper.parentElement;
        }
      }
      return hits;
    };
    const rowsOf = (elements, zone) => {
      const items = elements.filter(visible).map((el) => {
        const r = box(el);
        const ink = inkExtent(el);
        const pad = padBox(el);
        const cs = getComputedStyle(el);
        const minH = parseFloat(cs.minHeight) || 0;
        const inkSlack = Number.isFinite(ink.bottom) ? pad.bottom - ink.bottom : null;
        return {
          label: labelOf(el),
          top: round1(r.top),
          left: round1(r.left),
          h: round1(r.height),
          w: round1(r.width),
          inkSlack: inkSlack == null ? null : round1(inkSlack),
          minHeight: round1(minH),
          padBottom: round1(pad.pb),
          alignSelf: cs.alignSelf,
          overflowY: cs.overflowY,
          clips: clipsIn(el).slice(0, 6),
        };
      });
      items.sort((a, b) => a.top - b.top || a.left - b.left);
      const groups = [];
      items.forEach((it) => {
        const mid = it.top + it.h / 2;
        let row = groups.find((g) => mid >= g.top - 1 && mid <= g.bottom + 1);
        if (!row) {
          row = { top: it.top, bottom: it.top + it.h, items: [] };
          groups.push(row);
        }
        row.items.push(it);
        row.top = Math.min(row.top, it.top);
        row.bottom = Math.max(row.bottom, it.top + it.h);
      });
      return groups.map((g, index) => {
        const hs = g.items.map((it) => it.h);
        const slacks = g.items.map((it) => it.inkSlack).filter((v) => v != null);
        const minSlack = slacks.length ? Math.min(...slacks) : null;
        const maxSlack = slacks.length ? Math.max(...slacks) : null;
        const minHeightBound = g.items.every((it) => it.minHeight > 0 && it.h <= it.minHeight + 1);
        return {
          zone,
          row: index + 1,
          n: g.items.length,
          heights: hs,
          spread: round1(Math.max(...hs) - Math.min(...hs)),
          minInkSlack: minSlack == null ? null : round1(minSlack),
          maxInkSlack: maxSlack == null ? null : round1(maxSlack),
          minHeightBound,
          labels: g.items.map((it) => it.label),
          clips: g.items.flatMap((it) => it.clips),
          items: g.items.map(({ clips, ...rest }) => rest),
        };
      });
    };
    const styleBrief = (el) => {
      if (!el) return null;
      const s = getComputedStyle(el);
      const r = box(el);
      return {
        display: s.display,
        alignItems: s.alignItems,
        gridTemplateColumns: s.gridTemplateColumns,
        gridTemplateRows: s.gridTemplateRows,
        flexGrow: s.flexGrow,
        height: round1(r.height),
        width: round1(r.width),
        peerCols: el.dataset.peerCols || '',
        hidden: !!el.hidden,
      };
    };
    const main = document.getElementById('main');
    const mainCs = getComputedStyle(main);
    const gap = parseFloat(mainCs.rowGap || mainCs.gap) || 0;
    const mainBox = box(main);
    const sections = [...main.children].map((el) => {
      const r = box(el);
      const s = getComputedStyle(el);
      const ink = visible(el) ? inkExtent(el) : { bottom: NaN };
      const pad = padBox(el);
      return {
        id: el.id || el.className,
        display: s.display,
        hidden: !!el.hidden,
        visible: visible(el),
        top: round1(r.top),
        h: round1(r.height),
        w: round1(r.width),
        flexGrow: s.flexGrow,
        inkSlack: visible(el) && Number.isFinite(ink.bottom) ? round1(pad.bottom - ink.bottom) : null,
        marginBottom: s.marginBottom,
      };
    });
    const visibleSections = sections.filter((s) => s.visible);
    const gaps = [];
    for (let i = 1; i < visibleSections.length; i += 1) {
      gaps.push({
        from: visibleSections[i - 1].id,
        to: visibleSections[i].id,
        px: round1(visibleSections[i].top - (visibleSections[i - 1].top + visibleSections[i - 1].h)),
      });
    }
    const blanks = [];
    main.querySelectorAll('div, section, span, i').forEach((el) => {
      if (!visible(el)) return;
      if (el.closest('svg, dialog')) return;
      const text = (el.innerText || '').trim();
      if (text) return;
      if (el.querySelector('svg, canvas, img, .chart')) return;
      const cls = String(el.className || '');
      if (/progress|chart|status-dot|icon/.test(cls)) return;
      const r = box(el);
      if (r.height < 20 || r.width < 40) return;
      blanks.push({ tag: el.tagName, className: cls.slice(0, 60), h: round1(r.height), w: round1(r.width) });
    });
    const lineCountOf = (el) => {
      if (!el) return 0;
      const range = document.createRange();
      range.selectNodeContents(el);
      const tops = new Set();
      for (const r of range.getClientRects()) {
        if (r.width > 0 && r.height > 0) tops.add(Math.round(r.top));
      }
      return tops.size;
    };
    const note = document.getElementById('targetNote');
    const noteCs = note ? getComputedStyle(note) : null;
    const noteLines = lineCountOf(note);
    const pair = document.getElementById('pairRow');
    const delivery = document.getElementById('deliveryPanel');
    const deliveryCols = ['delivery-left', 'delivery-mid', 'delivery-right'].map((cls) => {
      const el = delivery.querySelector('.' + cls);
      const r = box(el);
      return { cls, h: round1(r.height), w: round1(r.width), top: round1(r.top) };
    });
    const leftW = deliveryCols[0].w || 1;
    const risk = document.getElementById('riskPanel');
    const riskBox = box(risk);
    const deliveryBox = box(delivery);
    return {
      ready: document.body.dataset.ready || '',
      unit: window.dashboard && window.dashboard.state ? window.dashboard.state.unit : null,
      main: {
        display: mainCs.display,
        flexDirection: mainCs.flexDirection,
        gap: round1(gap),
        clientHeight: main.clientHeight,
        scrollHeight: main.scrollHeight,
        width: round1(mainBox.width),
      },
      grids: {
        kpi: styleBrief(document.getElementById('kpiGrid')),
        cash: styleBrief(document.getElementById('cashMetrics')),
        risk: styleBrief(document.getElementById('riskMetrics')),
        pair: styleBrief(pair),
      },
      rows: [
        ...rowsOf([...document.querySelectorAll('#kpiGrid > .kpi-card')], 'kpi'),
        ...rowsOf([...document.querySelectorAll('#cashMetrics > .cash-metric')], 'cash'),
        ...rowsOf([...document.querySelectorAll('#riskMetrics > .risk-metric')], 'risk'),
        ...(getComputedStyle(pair).display === 'none'
          ? []
          : rowsOf([...pair.querySelectorAll(':scope > .panel')], 'pair')),
      ],
      sections,
      gaps,
      blanks: blanks.slice(0, 12),
      pair: {
        display: getComputedStyle(pair).display,
        dataVisible: pair.getAttribute('data-visible'),
        hidden: !!pair.hidden,
        height: round1(box(pair).height),
      },
      note: note
        ? {
            text: note.textContent,
            whiteSpace: noteCs.whiteSpace,
            overflow: noteCs.overflow,
            textOverflow: noteCs.textOverflow,
            lineRects: noteLines,
            scrollWidth: note.scrollWidth,
            clientWidth: note.clientWidth,
            clippedX: note.scrollWidth > note.clientWidth + 1,
          }
        : null,
      targetButtons: [...document.querySelectorAll('#targetPanel .segment button')].map((b) => {
        const r = box(b);
        return {
          text: b.textContent.trim(),
          top: round1(r.top),
          w: round1(r.width),
          h: round1(r.height),
          scrollWidth: b.scrollWidth,
          clientWidth: b.clientWidth,
        };
      }),
      targetButtonRows: (() => {
        const tops = [...document.querySelectorAll('#targetPanel .segment button')].map((b) => Math.round(box(b).top));
        return new Set(tops).size;
      })(),
      delivery: {
        h: round1(deliveryBox.height),
        w: round1(deliveryBox.width),
        widthShare: round1(deliveryBox.width / mainBox.width),
        flexGrow: getComputedStyle(delivery).flexGrow,
        columns: deliveryCols,
        widthRatio: deliveryCols.map((c) => round1(c.w / leftW)),
        heightSpread: round1(Math.max(...deliveryCols.map((c) => c.h)) - Math.min(...deliveryCols.map((c) => c.h))),
        inkSlack: sections.find((s) => s.id === 'deliveryPanel')?.inkSlack ?? null,
      },
      betweenRiskAndDelivery: round1(deliveryBox.top - riskBox.bottom),
      cashPanelInkSlack: sections.find((s) => s.id === 'cashPanel')?.inkSlack ?? null,
      riskPanelInkSlack: sections.find((s) => s.id === 'riskPanel')?.inkSlack ?? null,
      alertPanelInkSlack: sections.find((s) => s.id === 'alertPanel')?.inkSlack ?? null,
      chartLabelClips: [...document.querySelectorAll('#contributionChart text, #targetChart text, #cashChart text, #loadChart text, #deliveryChart text')]
        .map((node) => {
          const host = node.closest('.chart');
          if (!host) return null;
          const r = node.getBoundingClientRect();
          const h = host.getBoundingClientRect();
          if (r.width <= 0 || r.height <= 0) return null;
          const dx = Math.max(h.left - r.left, r.right - h.right);
          const dy = Math.max(h.top - r.top, r.bottom - h.bottom);
          if (dx <= 1 && dy <= 1) return null;
          return {
            chart: host.id,
            text: (node.textContent || '').trim().slice(0, 24),
            dx: round1(dx),
            dy: round1(dy),
          };
        })
        .filter(Boolean)
        .slice(0, 20),
    };
  });
}

function judge(snap, ctx) {
  const issues = [];
  const note = (ac, ok, detail) => {
    if (!ok) issues.push({ ac, ctx, detail });
  };
  snap.rows.forEach((row) => {
    if (row.n >= 2) {
      note('同行外框等高', row.spread <= NOISE_PX, row);
      const determiningSlack = row.minInkSlack;
      const manufactured =
        determiningSlack != null && determiningSlack > 24 && !row.minHeightBound;
      note('决定行高的卡片下方无大块空底', !manufactured, {
        zone: row.zone,
        row: row.row,
        minInkSlack: determiningSlack,
        minHeightBound: row.minHeightBound,
      });
    }
    note('正文未被裁切', row.clips.length === 0, { zone: row.zone, row: row.row, clips: row.clips });
  });
  note('无独立空白块', snap.blanks.length === 0, snap.blanks);
  return issues;
}

async function scrollTo(page, selector) {
  await page.evaluate((sel) => {
    const el = document.querySelector(sel);
    const main = document.getElementById('main');
    if (!el || !main) return;
    const top = el.getBoundingClientRect().top - main.getBoundingClientRect().top + main.scrollTop - 12;
    main.scrollTop = Math.max(0, top);
  }, selector);
  await page.waitForTimeout(80);
}

async function shot(page, name) {
  await page.screenshot({ path: path.join(OUT, name) });
}

async function setUnit(page, unit) {
  await page.evaluate((name) => {
    window.dispatchEvent(new MessageEvent('message', {
      data: { type: 'ops-dashboard-filter', unit: name },
      origin: window.location.origin,
    }));
  }, unit);
  await page.waitForTimeout(180);
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 1 });
  const issues = [];
  const push = (list) => issues.push(...list);
  const scenarios = {};

  await page.goto(BASE + '/operations-dashboard-202610/index.html', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForFunction(() => document.body.dataset.ready === 'true');
  await page.evaluate(() => document.fonts && document.fonts.ready);
  await page.waitForTimeout(400);

  scenarios.desktop = await measureIn(page);
  push(judge(scenarios.desktop, 'desktop-1440'));
  await shot(page, 'max-01-desktop-top.png');
  await scrollTo(page, '#pairRow');
  await shot(page, 'max-02-desktop-pair.png');
  await scrollTo(page, '#deliveryPanel');
  await shot(page, 'max-03-desktop-delivery.png');
  await page.evaluate(() => { document.getElementById('main').scrollTop = 0; });

  const sweepWidths = [1680, 1440, 1200, 1040, 920, 800, 680, 560, 440];
  scenarios.sweep = [];
  for (const width of sweepWidths) {
    await page.setViewportSize({ width, height: 1000 });
    await page.waitForTimeout(220);
    const snap = await measureIn(page);
    scenarios.sweep.push({
      width,
      cols: {
        kpi: snap.grids.kpi.peerCols,
        cash: snap.grids.cash.peerCols,
        risk: snap.grids.risk.peerCols,
        pair: snap.grids.pair.peerCols,
      },
      rows: snap.rows.map((r) => ({
        zone: r.zone,
        row: r.row,
        n: r.n,
        heights: r.heights,
        spread: r.spread,
        minInkSlack: r.minInkSlack,
        maxInkSlack: r.maxInkSlack,
        labels: r.labels,
      })),
      note: snap.note,
      targetButtonRows: snap.targetButtonRows,
      delivery: {
        h: snap.delivery.h,
        widthShare: snap.delivery.widthShare,
        widthRatio: snap.delivery.widthRatio,
        heightSpread: snap.delivery.heightSpread,
        flexGrow: snap.delivery.flexGrow,
        inkSlack: snap.delivery.inkSlack,
      },
      gaps: snap.gaps,
      blanks: snap.blanks,
    });
    push(judge(snap, 'sweep-' + width));
  }

  const wrapHit = scenarios.sweep.find((s) => s.cols.pair === '2' && ((s.note && s.note.lineRects >= 2) || s.targetButtonRows >= 2));
  const wrapWidth = wrapHit ? wrapHit.width : 680;
  await page.setViewportSize({ width: wrapWidth, height: 1000 });
  await page.waitForTimeout(240);
  scenarios.noteWrap = await measureIn(page);
  push(judge(scenarios.noteWrap, 'note-wrap-' + wrapWidth));
  if (scenarios.noteWrap.note) {
    const wrapped = scenarios.noteWrap.note.lineRects >= 2 || scenarios.noteWrap.targetButtonRows >= 2;
    const notCut = !scenarios.noteWrap.note.clippedX;
    if (!wrapped) issues.push({ ac: '成对模块说明或页签发生换行', ctx: 'note-wrap', detail: { note: scenarios.noteWrap.note, buttonRows: scenarios.noteWrap.targetButtonRows } });
    if (!notCut) issues.push({ ac: '换行说明不被截断', ctx: 'note-wrap', detail: scenarios.noteWrap.note });
  }
  await scrollTo(page, '#pairRow');
  await shot(page, 'max-04-note-wrap-pair.png');

  const cash2 = scenarios.sweep.find((s) => s.cols.cash === '2');
  const cash1 = scenarios.sweep.find((s) => s.cols.cash === '1');
  scenarios.reflowWidths = {
    cash2: cash2 ? cash2.width : null,
    cash1: cash1 ? cash1.width : null,
    kpi1: (scenarios.sweep.find((s) => s.cols.kpi === '1') || {}).width || null,
    pair1: (scenarios.sweep.find((s) => s.cols.pair === '1') || {}).width || null,
  };

  await page.setViewportSize({ width: 1280, height: 1000 });
  await page.waitForTimeout(240);
  await page.evaluate(() => {
    const add = (el, id, text) => {
      const node = document.createElement('span');
      node.id = id;
      node.dataset.maxProbe = '1';
      node.textContent = text;
      node.style.display = 'block';
      node.style.whiteSpace = 'normal';
      node.style.lineHeight = '1.45';
      node.style.fontSize = '12px';
      node.style.width = '100%';
      el.appendChild(node);
    };
    add(
      document.querySelector('#cashMetrics > .cash-metric > div'),
      'max-probe-cash',
      '补充经营说明需要完整换行，用来拉开与同行卡片的内容高度。这一段必须完整留在卡片里，不能为了凑高度被裁掉。',
    );
    add(
      document.querySelector('#riskMetrics > .risk-metric'),
      'max-probe-risk',
      '应收卡片补充长文案，确认同一行另一张卡外框跟着变高，下一行不被旧配对撑高。正文需要完整可见。',
    );
    add(
      document.querySelector('#kpiGrid > .kpi-card .kpi-content'),
      'max-probe-kpi',
      'KPI 第一张卡增加两行说明，同行另一张应拉齐到这一高度，下一行 KPI 保持自身内容高度。',
    );
  });
  await page.waitForTimeout(80);
  scenarios.grownWide = await measureIn(page);
  push(judge(scenarios.grownWide, 'grown-wide-1280'));
  const grownCash = scenarios.grownWide.rows.filter((r) => r.zone === 'cash');
  const grownRisk = scenarios.grownWide.rows.filter((r) => r.zone === 'risk');
  const grownKpi = scenarios.grownWide.rows.filter((r) => r.zone === 'kpi');
  if (grownCash.length >= 1 && grownCash[0].n >= 2) {
    const shortSlack = grownCash[0].maxInkSlack;
    const tallSlack = grownCash[0].minInkSlack;
    if (!(shortSlack > tallSlack + 8)) {
      issues.push({ ac: '内容更短的现金流卡靠外框拉齐而不是截断长文', ctx: 'grown-wide', detail: grownCash[0] });
    }
  }
  if (grownRisk.length >= 2 && grownRisk[0].n >= 2) {
    if (!(grownRisk[0].heights[0] > grownRisk[1].heights[0] + 8)) {
      issues.push({ ac: '变高的应收行不把下一行撑到同一高度', ctx: 'grown-wide', detail: grownRisk });
    }
  }
  if (grownKpi.length >= 2 && grownKpi[0].n >= 2) {
    if (!(grownKpi[0].heights[0] > grownKpi[1].heights[0] + 8)) {
      issues.push({ ac: '变高的 KPI 行不把下一行撑到同一高度', ctx: 'grown-wide', detail: grownKpi });
    }
  }
  await page.evaluate(() => { document.getElementById('main').scrollTop = 0; });
  await shot(page, 'max-05-unequal-content-wide.png');

  const midWidth = scenarios.reflowWidths.cash2 || 680;
  await page.setViewportSize({ width: midWidth, height: 1000 });
  await page.waitForTimeout(260);
  scenarios.grownMid = await measureIn(page);
  push(judge(scenarios.grownMid, 'grown-mid-' + midWidth));
  const midCash = scenarios.grownMid.rows.filter((r) => r.zone === 'cash');
  const tall = midCash.find((r) => (r.labels[0] || '').includes('补充经营说明') || r.maxInkSlack > 20);
  const shortRows = midCash.filter((r) => r !== tall);
  if (!tall || shortRows.length === 0) {
    issues.push({ ac: '中等宽度现金流重排成新的同行', ctx: 'grown-mid', detail: midCash });
  } else {
    shortRows.forEach((row) => {
      const shortH = Math.max(...row.heights);
      const tallH = Math.max(...tall.heights);
      if (shortH > tallH - 8) {
        issues.push({
          ac: '离开原同行后不再保持旧高度',
          ctx: 'grown-mid',
          detail: { tallH, shortH, row, tall },
        });
      }
    });
  }
  await page.evaluate(() => { document.getElementById('main').scrollTop = 0; });
  await shot(page, 'max-06-reflow-mid-unequal.png');

  const narrowWidth = scenarios.reflowWidths.cash1 || 440;
  await page.setViewportSize({ width: narrowWidth, height: 1000 });
  await page.waitForTimeout(260);
  scenarios.grownNarrow = await measureIn(page);
  push(judge(scenarios.grownNarrow, 'grown-narrow-' + narrowWidth));
  const narrowCash = scenarios.grownNarrow.rows.filter((r) => r.zone === 'cash');
  if (narrowCash.length < 2) {
    issues.push({ ac: '窄屏现金流拆成多行', ctx: 'grown-narrow', detail: narrowCash });
  } else {
    const heights = narrowCash.map((r) => r.heights[0]);
    const maxH = Math.max(...heights);
    const minH = Math.min(...heights);
    if (maxH - minH < 8) {
      issues.push({ ac: '窄屏各行按自身内容分高，不沿用三卡同一高度', ctx: 'grown-narrow', detail: narrowCash });
    }
  }
  await shot(page, 'max-07-reflow-narrow.png');

  await page.evaluate(() => {
    document.querySelectorAll('[data-max-probe]').forEach((el) => el.remove());
  });
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.waitForTimeout(260);
  scenarios.restored = await measureIn(page);
  push(judge(scenarios.restored, 'restored-1440'));
  const restoredCash = scenarios.restored.rows.filter((r) => r.zone === 'cash');
  if (!(restoredCash.length === 1 && restoredCash[0].n === 3)) {
    issues.push({ ac: '拉回宽屏后现金流回到同一行', ctx: 'restored', detail: restoredCash });
  }
  const restoredKpi = scenarios.restored.rows.filter((r) => r.zone === 'kpi');
  if (!(restoredKpi.length === 2 && restoredKpi.every((r) => r.n === 2))) {
    issues.push({ ac: '拉回宽屏后 KPI 回到二乘二', ctx: 'restored', detail: restoredKpi });
  }

  scenarios.units = [];
  for (const unit of UNITS) {
    await setUnit(page, unit);
    const snap = await measureIn(page);
    const leaf = unit !== '全部板块';
    if (leaf) {
      if (snap.pair.display !== 'none' || snap.pair.height > 1) {
        issues.push({ ac: '叶子成对行隐藏', ctx: unit, detail: snap.pair });
      }
      const hole = Math.abs(snap.betweenRiskAndDelivery - snap.main.gap);
      if (hole > NOISE_PX) {
        issues.push({
          ac: '叶子隐藏后不留空洞',
          ctx: unit,
          detail: { between: snap.betweenRiskAndDelivery, gap: snap.main.gap, pair: snap.pair },
        });
      }
      if (snap.rows.some((r) => r.zone === 'pair')) {
        issues.push({ ac: '叶子不残留成对模块行', ctx: unit, detail: snap.rows.filter((r) => r.zone === 'pair') });
      }
    } else if (!snap.rows.some((r) => r.zone === 'pair' && r.n === 2)) {
      issues.push({ ac: '全部板块展示成对模块', ctx: unit, detail: snap.pair });
    }
    push(judge(snap, 'unit-' + unit));
    scenarios.units.push({
      unit,
      stateUnit: snap.unit,
      pair: snap.pair,
      betweenRiskAndDelivery: snap.betweenRiskAndDelivery,
      mainGap: snap.main.gap,
      rows: snap.rows.map((r) => ({ zone: r.zone, n: r.n, spread: r.spread, heights: r.heights })),
      delivery: { h: snap.delivery.h, widthShare: snap.delivery.widthShare, flexGrow: snap.delivery.flexGrow },
    });
  }
  await setUnit(page, 'SAS530 银川中心');
  await page.evaluate(() => { document.getElementById('main').scrollTop = 0; });
  await shot(page, 'max-08-leaf-yinchuan.png');
  await scrollTo(page, '#deliveryPanel');
  await shot(page, 'max-09-leaf-delivery.png');

  await setUnit(page, '全部板块');
  await page.waitForTimeout(200);
  const tabs = ['contract', 'completed', 'invoice', 'receipt'];
  scenarios.tabs = [];
  for (const metric of tabs) {
    await page.click('#targetPanel .segment button[data-target-metric="' + metric + '"]');
    await page.waitForTimeout(120);
    const snap = await measureIn(page);
    push(judge(snap, 'tab-' + metric));
    const pair = snap.rows.find((r) => r.zone === 'pair');
    scenarios.tabs.push({
      metric,
      note: snap.note,
      pair: pair ? { n: pair.n, spread: pair.spread, heights: pair.heights, minInkSlack: pair.minInkSlack, maxInkSlack: pair.maxInkSlack } : null,
    });
    if (snap.note && snap.note.clippedX) {
      issues.push({ ac: '目标页签说明不截断', ctx: metric, detail: snap.note });
    }
  }
  await scrollTo(page, '#pairRow');
  await shot(page, 'max-10-target-tab-receipt.png');

  const d = scenarios.desktop.delivery;
  scenarios.deliveryStory = {
    h: d.h,
    cashPanelH: scenarios.desktop.sections.find((s) => s.id === 'cashPanel')?.h,
    pairH: scenarios.desktop.sections.find((s) => s.id === 'pairRow')?.h,
    flexGrow: d.flexGrow,
    widthShare: d.widthShare,
    widthRatio: d.widthRatio,
    columnHeightSpread: d.heightSpread,
    inkSlack: d.inkSlack,
    mainClientHeight: scenarios.desktop.main.clientHeight,
  };
  if (Number(d.flexGrow) > 0) {
    issues.push({ ac: '工作负荷独占一行不被 flex 撑高', ctx: 'desktop', detail: d });
  }
  if (d.widthShare < 0.95) {
    issues.push({ ac: '工作负荷在桌面独占一行', ctx: 'desktop', detail: d });
  }
  const ratio = d.widthRatio;
  if (!(ratio[1] > ratio[0] * 1.6 && ratio[1] > ratio[2] * 1.6 && Math.abs(ratio[0] - ratio[2]) < 0.25)) {
    issues.push({ ac: '工作负荷三栏仍约四分之一、二分之一、四分之一', ctx: 'desktop', detail: ratio });
  }
  if (scenarios.deliveryStory.pairH && d.h >= scenarios.deliveryStory.pairH) {
    issues.push({ ac: '工作负荷整体仍比成对图区模块矮', ctx: 'desktop', detail: scenarios.deliveryStory });
  }

  const report = {
    probe: 'max-peer-row-height',
    commit: '69bbce5db6b5cf8029e68ff5f6c5d01a8b8ef272',
    baseline: '09e4bec3a98582f75a286364bc527aad53852ca9',
    url: BASE + '/operations-dashboard-202610/index.html',
    measuredAt: new Date().toISOString(),
    noisePx: NOISE_PX,
    noiseNote: '1px 只用于丢掉 getBoundingClientRect 的亚像素和边框取整，不是新的业务通过阈值。',
    verdict: issues.length ? 'FAIL' : 'PASS',
    issueCount: issues.length,
    issues,
    deliveryStory: scenarios.deliveryStory,
    reflowWidths: scenarios.reflowWidths,
    desktop: {
      main: scenarios.desktop.main,
      grids: scenarios.desktop.grids,
      rows: scenarios.desktop.rows,
      gaps: scenarios.desktop.gaps,
      blanks: scenarios.desktop.blanks,
      pair: scenarios.desktop.pair,
      note: scenarios.desktop.note,
      delivery: scenarios.desktop.delivery,
      sectionInk: {
        cash: scenarios.desktop.cashPanelInkSlack,
        risk: scenarios.desktop.riskPanelInkSlack,
        alert: scenarios.desktop.alertPanelInkSlack,
      },
      chartLabelClips: scenarios.desktop.chartLabelClips,
    },
    sweep: scenarios.sweep,
    noteWrap: {
      width: wrapWidth,
      note: scenarios.noteWrap.note,
      targetButtonRows: scenarios.noteWrap.targetButtonRows,
      pair: scenarios.noteWrap.rows.filter((r) => r.zone === 'pair'),
      buttons: scenarios.noteWrap.targetButtons,
    },
    grownWide: scenarios.grownWide.rows,
    grownMid: { width: midWidth, rows: scenarios.grownMid.rows, cols: scenarios.grownMid.grids },
    grownNarrow: { width: narrowWidth, rows: scenarios.grownNarrow.rows, cols: scenarios.grownNarrow.grids },
    restored: {
      rows: scenarios.restored.rows.map((r) => ({ zone: r.zone, n: r.n, spread: r.spread, heights: r.heights })),
    },
    units: scenarios.units,
    tabs: scenarios.tabs,
  };
  fs.writeFileSync(path.join(OUT, 'max-peer-row-height.json'), JSON.stringify(report, null, 2));
  console.log('VERDICT ' + report.verdict + ' issues=' + issues.length);
  issues.slice(0, 30).forEach((item) => console.log('ISSUE ' + item.ac + ' @ ' + item.ctx));
  await browser.close();
  process.exit(issues.length ? 1 : 0);
}

module.exports = { measureIn, judge, UNITS, NOISE_PX };

if (require.main === module) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
