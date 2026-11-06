/**
 * Max 独立复验探针（不读取、不引用实现方 probe 结论）。
 * 只打开壳页面 /operations-dashboard-202610/board，量几何。
 * 不改业务页面。
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { chromium } = require('playwright');

const OUT = __dirname;
const URL = process.env.PROBE_URL || 'http://localhost:3000/operations-dashboard-202610/board';
const TOL = 1;
const HEIGHT_TOL = 2;

const LEAVES = [
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

function round(n) {
  return Math.round(n * 10) / 10;
}

function measureInPage() {
  const TOL = 1;
  const doc = document;
  const win = doc.defaultView;

  function clippedX(node) {
    const b = node.getBoundingClientRect();
    if (b.width < 0.5 || b.height < 0.5) {
      return { left: 0, right: 0, overflow: 0, empty: true };
    }
    let left = 0;
    let right = 0;
    let el = node.parentElement;
    while (el) {
      const cs = win.getComputedStyle(el);
      const ox = cs.overflowX;
      const oy = cs.overflow;
      const clips =
        ox === 'hidden' || ox === 'clip' || ox === 'scroll' || ox === 'auto' ||
        oy === 'hidden' || oy === 'clip';
      if (clips) {
        const h = el.getBoundingClientRect();
        const clipLeft = h.left + (parseFloat(cs.borderLeftWidth) || 0);
        const clipRight = h.right - (parseFloat(cs.borderRightWidth) || 0);
        left = Math.max(left, clipLeft - b.left);
        right = Math.max(right, b.right - clipRight);
      }
      if (el === doc.body) break;
      el = el.parentElement;
    }
    return { left: round1(left), right: round1(right), overflow: round1(Math.max(0, left) + Math.max(0, right)), empty: false };
  }
  function round1(n) {
    return Math.round(n * 10) / 10;
  }
  function textBox(el) {
    if (!el) return null;
    return {
      scrollWidth: el.scrollWidth,
      clientWidth: el.clientWidth,
      scrollHeight: el.scrollHeight,
      clientHeight: el.clientHeight,
      dx: round1(el.scrollWidth - el.clientWidth),
      dy: round1(el.scrollHeight - el.clientHeight),
      clip: clippedX(el),
    };
  }
  function slack(el) {
    const cs = win.getComputedStyle(el);
    const r = el.getBoundingClientRect();
    const kids = [...el.children].filter((c) => {
      const cr = c.getBoundingClientRect();
      const pcs = win.getComputedStyle(c);
      return cr.height > 0.5 && pcs.display !== 'none' && pcs.position !== 'absolute' && pcs.position !== 'fixed';
    });
    if (!kids.length || r.height < 1) return null;
    let maxBottom = r.top;
    kids.forEach((c) => {
      maxBottom = Math.max(maxBottom, c.getBoundingClientRect().bottom);
    });
    const innerBottom = r.bottom - (parseFloat(cs.borderBottomWidth) || 0);
    const padB = parseFloat(cs.paddingBottom) || 0;
    return round1(innerBottom - maxBottom - padB);
  }
  function describe(el) {
    const r = el.getBoundingClientRect();
    return {
      id: el.id || '',
      cls: String(el.className || '').slice(0, 80),
      text: (el.innerText || '').replace(/\s+/g, ' ').trim().slice(0, 48),
      top: round1(r.top),
      left: round1(r.left),
      width: round1(r.width),
      height: round1(r.height),
      slack: slack(el),
      scrollVsClient: {
        dx: round1(el.scrollWidth - el.clientWidth),
        dy: round1(el.scrollHeight - el.clientHeight),
      },
    };
  }
  function rowsOf(rootSel, itemSel) {
    const root = doc.querySelector(rootSel);
    if (!root) return { missing: true, rows: [] };
    const cs = win.getComputedStyle(root);
    const hidden = root.hidden || cs.display === 'none';
    const items = [...root.querySelectorAll(itemSel)].map(describe);
    const visible = items.filter((it) => it.width > 0.5 && it.height > 0.5);
    const rows = [];
    visible.forEach((it) => {
      const hit = rows.find((row) => Math.abs(row.top - it.top) <= 3);
      if (hit) hit.items.push(it);
      else rows.push({ top: it.top, items: [it] });
    });
    rows.sort((a, b) => a.top - b.top);
    const packed = rows.map((row) => {
      const hs = row.items.map((i) => i.height);
      const max = Math.max(...hs);
      const min = Math.min(...hs);
      const tallest = row.items.reduce((a, b) => (a.height >= b.height ? a : b));
      return {
        n: row.items.length,
        top: row.top,
        heights: hs,
        delta: round1(max - min),
        tallestSlack: tallest.slack,
        ids: row.items.map((i) => i.id || i.text || i.cls),
        items: row.items,
      };
    });
    const template = cs.gridTemplateColumns || '';
    const templateCols = template.split(' ').filter((p) => p && p !== 'none').length;
    return {
      missing: false,
      hidden,
      display: cs.display,
      peerCols: root.dataset.peerCols || null,
      template,
      templateCols,
      clientWidth: root.clientWidth,
      clientHeight: root.clientHeight,
      firstRowCols: packed[0] ? packed[0].n : 0,
      rowCount: packed.length,
      rows: packed,
    };
  }

  const pair = doc.getElementById('pairRow');
  const panels = pair ? [...pair.querySelectorAll(':scope > .panel')] : [];
  const titles = panels.map((panel) => {
    const title = panel.querySelector('.panel-title');
    const bits = title ? [...title.querySelectorAll('.unit, .info-button, svg')] : [];
    return {
      panel: panel.id,
      titleText: title ? title.textContent.replace(/\s+/g, ' ').trim().slice(0, 40) : null,
      whiteSpace: title ? win.getComputedStyle(title).whiteSpace : null,
      font: title ? win.getComputedStyle(title).font : null,
      box: textBox(title),
      parts: bits.map((n) => ({
        tag: n.tagName,
        cls: String(n.className || '').slice(0, 40),
        clip: clippedX(n),
      })),
    };
  });
  const labels = [...doc.querySelectorAll('#pairRow .highcharts-data-label')].map((lab) => {
    const host = lab.closest('.chart') || lab.closest('.panel');
    const b = lab.getBoundingClientRect();
    const h = host ? host.getBoundingClientRect() : null;
    const rawRight = h ? round1(b.right - h.right) : null;
    return {
      chart: lab.closest('.chart')?.id || '',
      text: (lab.textContent || '').trim().slice(0, 24),
      width: round1(b.width),
      rawBeyondChartRight: rawRight,
      clip: clippedX(lab),
    };
  });
  const axis = [...doc.querySelectorAll('#pairRow .highcharts-axis-labels text')].slice(0, 6).map((n) => ({
    text: (n.textContent || '').trim().slice(0, 24),
    clip: clippedX(n),
  }));
  const deliveryRight = doc.querySelector('#deliveryPanel .delivery-right');
  const deliveryTitle = deliveryRight ? (deliveryRight.innerText || '').slice(0, 40) : '';

  const main = doc.querySelector('main');
  const risk = doc.getElementById('riskPanel');
  const cash = doc.getElementById('cashPanel');
  const delivery = doc.getElementById('deliveryPanel');
  function gap(a, b) {
    if (!a || !b) return null;
    const ar = a.getBoundingClientRect();
    const br = b.getBoundingClientRect();
    if (ar.height < 1 || br.height < 1) return null;
    return round1(br.top - ar.bottom);
  }

  return {
    ready: doc.body.dataset.ready || null,
    unit: win.dashboard?.state?.unit || null,
    docClientWidth: doc.documentElement.clientWidth,
    mainClientWidth: main ? main.clientWidth : null,
    pairHiddenAttr: pair ? pair.hidden : null,
    pairDataVisible: pair ? pair.getAttribute('data-visible') : null,
    pairDisplay: pair ? win.getComputedStyle(pair).display : null,
    pairRectH: pair ? round1(pair.getBoundingClientRect().height) : null,
    gaps: {
      cashToRisk: gap(cash, risk),
      riskToDelivery: gap(risk, delivery),
    },
    groups: {
      kpi: rowsOf('#kpiGrid', ':scope > .kpi-card'),
      cash: rowsOf('#cashMetrics', ':scope > .cash-metric'),
      risk: rowsOf('#riskMetrics', ':scope > .risk-metric'),
      pair: rowsOf('#pairRow', ':scope > .panel'),
    },
    delivery: delivery
      ? {
          height: round1(delivery.getBoundingClientRect().height),
          slack: slack(delivery),
          clientWidth: delivery.clientWidth,
        }
      : null,
    titles,
    labels,
    labelCount: labels.length,
    maxLabelOverflow: labels.reduce((m, l) => Math.max(m, l.clip.overflow || 0), 0),
    axisSample: axis,
    deliveryRightClip: deliveryRight ? clippedX(deliveryRight) : null,
    deliveryRightText: deliveryTitle,
    deliveryNumbers: [...doc.querySelectorAll('#deliveryPanel .delivery-kpi-card strong')].map((el) => {
      const range = doc.createRange();
      range.selectNodeContents(el);
      const b = range.getBoundingClientRect();
      const card = el.closest('.delivery-kpi-card');
      const panel = doc.getElementById('deliveryPanel');
      return {
        text: (el.textContent || '').trim(),
        dx: round1(el.scrollWidth - el.clientWidth),
        beyondCard: card ? round1(Math.max(0, b.right - card.getBoundingClientRect().right, card.getBoundingClientRect().left - b.left)) : null,
        beyondPanel: panel ? round1(Math.max(0, b.right - panel.getBoundingClientRect().right, panel.getBoundingClientRect().left - b.left)) : null,
      };
    }),
    bodyClips: [
      '#kpiGrid .kpi-title',
      '#kpiGrid .kpi-value',
      '#kpiGrid .kpi-meta',
      '#kpiGrid .kpi-delta',
      '#cashMetrics .metric-label',
      '#cashMetrics strong',
      '#cashMetrics .metric-delta',
      '#riskMetrics .metric-label',
      '#riskMetrics strong',
      '#riskMetrics .risk-period',
      '#pairRow .panel-title',
      '#deliveryPanel .panel-title',
      '#deliveryPanel .delivery-kpi-card strong',
      '#deliveryPanel .delivery-kpi-card small',
    ].flatMap((sel) =>
      [...doc.querySelectorAll(sel)].map((el) => {
        const box = textBox(el);
        return {
          sel,
          text: (el.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 32),
          dx: box.dx,
          dy: box.dy,
          clip: box.clip.overflow,
        };
      }).filter((x) => x.dx > TOL || x.dy > TOL || x.clip > TOL)
    ),
  };
}

function injectionInPage() {
  function heights(sel) {
    return [...document.querySelectorAll(sel)].map((el) => {
      const r = el.getBoundingClientRect();
      return { h: Math.round(r.height * 10) / 10, top: Math.round(r.top * 10) / 10, left: Math.round(r.left * 10) / 10 };
    });
  }
  function snap() {
    return {
      kpi: heights('#kpiGrid > .kpi-card'),
      cash: heights('#cashMetrics > .cash-metric'),
      risk: heights('#riskMetrics > .risk-metric'),
      pair: heights('#pairRow > .panel'),
      delivery: heights('#deliveryPanel'),
    };
  }
  const before = snap();
  const host = document.querySelector('#kpiGrid .kpi-card .kpi-content');
  const extra = document.createElement('div');
  extra.id = 'max-reprobe-inject';
  extra.textContent = '独立复验注入的换行正文。只应拉高所在这一行，不应把别的行或别的模块撑到同一高度。独立复验注入的换行正文。';
  extra.style.cssText = 'display:block;width:100%;white-space:normal;font-size:16px;line-height:22px;';
  host.appendChild(extra);
  const injectedBox = extra.getBoundingClientRect();
  const after = snap();
  const card = host.closest('.kpi-card');
  const cardRect = card.getBoundingClientRect();
  const textCut = injectedBox.bottom - cardRect.bottom;
  extra.remove();
  const restored = snap();
  return {
    before,
    after,
    restored,
    injectedTextCut: Math.round(textCut * 10) / 10,
    grew: Math.round((after.kpi[0].h - before.kpi[0].h) * 10) / 10,
  };
}

function judgeInjection(block) {
  const issues = [];
  if (!block || block.grew < 20) issues.push('注入换行后首张 KPI 高度没有跟着内容长高（' + (block && block.grew) + 'px）');
  if (block && block.injectedTextCut > HEIGHT_TOL) issues.push('注入正文被卡片底边裁切 ' + block.injectedTextCut + 'px');
  if (block) {
    const first = block.after.kpi[0];
    block.after.kpi.forEach((card, i) => {
      const same = Math.abs(card.top - first.top) <= 3;
      if (same && Math.abs(card.h - first.h) > HEIGHT_TOL) issues.push('注入后同行 KPI[' + i + '] 高度差 ' + Math.abs(card.h - first.h));
      if (!same && Math.abs(card.h - block.before.kpi[i].h) > HEIGHT_TOL) issues.push('注入后非同行 KPI[' + i + '] 高度被带动 ' + card.h + ' vs ' + block.before.kpi[i].h);
    });
    ['cash', 'risk', 'pair', 'delivery'].forEach((name) => {
      block.after[name].forEach((card, i) => {
        const prev = block.before[name][i];
        if (prev && Math.abs(card.h - prev.h) > HEIGHT_TOL) issues.push('注入 KPI 后 ' + name + '[' + i + '] 高度变化 ' + prev.h + ' → ' + card.h);
      });
    });
    block.restored.kpi.forEach((card, i) => {
      if (Math.abs(card.h - block.before.kpi[i].h) > HEIGHT_TOL) issues.push('撤掉注入后 KPI[' + i + '] 未回到原高');
    });
  }
  return { pass: issues.length === 0, issues };
}

function judgeRows(group, expect) {
  const issues = [];
  if (!group || group.missing) issues.push('容器缺失');
  else if (group.hidden) issues.push('容器被隐藏');
  else {
    if (expect.firstRow && group.firstRowCols !== expect.firstRow) issues.push('首行列数 ' + group.firstRowCols + '，期望 ' + expect.firstRow);
    group.rows.forEach((row, i) => {
      if (row.delta > HEIGHT_TOL) issues.push('第 ' + (i + 1) + ' 行外框高度差 ' + row.delta + 'px');
      if (row.tallestSlack != null && row.tallestSlack > 80) issues.push('第 ' + (i + 1) + ' 行最高卡片内容下方空出 ' + row.tallestSlack + 'px');
    });
  }
  return { pass: issues.length === 0, issues, firstRowCols: group && group.firstRowCols, rowCount: group && group.rowCount };
}

function judgePairNarrow(m) {
  const issues = [];
  const g = m.groups.pair;
  if (!g || g.hidden || g.firstRowCols < 1) issues.push('成对行不可见');
  m.titles.forEach((t) => {
    const dx = t.box ? t.box.dx : 999;
    const clip = t.box ? t.box.clip.overflow : 999;
    if (dx > TOL) issues.push(t.panel + ' 标题 scrollWidth-clientWidth=' + dx);
    if (clip > TOL) issues.push(t.panel + ' 标题被祖先裁切 ' + clip + 'px');
    (t.parts || []).forEach((p) => {
      if (p.clip.overflow > TOL) issues.push(t.panel + ' 标题内 ' + (p.cls || p.tag) + ' 横向裁切 ' + p.clip.overflow + 'px');
    });
  });
  if (!m.labelCount) issues.push('未量到柱端数字标签');
  const overflowLabels = (m.labels || []).filter((l) => l.clip.overflow > TOL);
  if (overflowLabels.length) {
    issues.push('柱端数字横向裁切 ' + overflowLabels.length + ' 个，最大 ' + m.maxLabelOverflow + 'px，例：' + overflowLabels.slice(0, 3).map((l) => l.chart + ':' + l.text + '@' + l.clip.overflow).join(' | '));
  }
  (m.groups.pair.rows || []).forEach((row, i) => {
    if (row.n > 1 && row.delta > HEIGHT_TOL) issues.push('窄屏成对第 ' + (i + 1) + ' 行高度差 ' + row.delta);
    if (row.n === 1 && row.tallestSlack != null && row.tallestSlack > 80) issues.push('单列成对卡内容下方空出 ' + row.tallestSlack + 'px');
  });
  return {
    pass: issues.length === 0,
    issues,
    cols: g && g.firstRowCols,
    templateCols: g && g.templateCols,
    peerCols: g && g.peerCols,
  };
}

function judgeDesktopRestore(m) {
  const g = m.groups.pair;
  const issues = [];
  if (!g || g.firstRowCols < 2) issues.push('拉回桌面后成对行首行不是多列（' + (g && g.firstRowCols) + '）');
  (g && g.rows || []).forEach((row, i) => {
    if (row.n > 1 && row.delta > HEIGHT_TOL) issues.push('桌面成对第 ' + (i + 1) + ' 行高度差 ' + row.delta);
  });
  return { pass: issues.length === 0, issues, cols: g && g.firstRowCols, heights: g && g.rows.map((r) => r.heights) };
}

async function shellGeom(page) {
  return page.evaluate(() => {
    const box = (el) => {
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return { w: Math.round(r.width * 10) / 10, h: Math.round(r.height * 10) / 10, x: Math.round(r.x * 10) / 10, y: Math.round(r.y * 10) / 10 };
    };
    const iframe = document.querySelector('iframe[title="运营看板202610 · 运营看板"]');
    return {
      viewport: { w: window.innerWidth, h: window.innerHeight, dpr: window.devicePixelRatio },
      sidebar: box(document.querySelector('[data-testid="wood-shell-sidebar"]')),
      sidebarCollapsed: document.querySelector('[data-testid="wood-shell-sidebar"]')?.getAttribute('data-collapsed'),
      tree: box(document.querySelector('aside[aria-label="看板目录"]')),
      iframe: box(iframe),
    };
  });
}

function opsFrame(page) {
  return page.frames().find((f) => f.url().includes('/operations-dashboard-202610/index.html'));
}

async function waitLayout(page, { needLabels }) {
  const frame = opsFrame(page);
  if (!frame) throw new Error('未找到经营全景 iframe');
  await frame.waitForFunction(() => document.body && document.body.dataset.ready === 'true', { timeout: 30000 });
  let prev = '';
  let stable = 0;
  let last = null;
  for (let i = 0; i < 30; i++) {
    last = await frame.evaluate(() => {
      const row = document.getElementById('pairRow');
      const labels = [...document.querySelectorAll('#pairRow .highcharts-data-label')];
      const rights = labels.map((el) => Math.round(el.getBoundingClientRect().right));
      return {
        cols: row ? row.dataset.peerCols || '' : '',
        hidden: !!(row && (row.hidden || getComputedStyle(row).display === 'none')),
        n: labels.length,
        rights: rights.join(','),
      };
    });
    const sig = JSON.stringify(last);
    if (sig === prev) stable += 1;
    else stable = 0;
    prev = sig;
    const labelsOk = !needLabels || last.hidden || last.n >= 4;
    if (stable >= 2 && labelsOk) return last;
    await page.waitForTimeout(200);
  }
  return last;
}

async function shot(page, name) {
  const file = path.join(OUT, name);
  await page.screenshot({ path: file, animations: 'disabled' });
  return name;
}

async function shotPair(page, name) {
  const frame = opsFrame(page);
  const file = path.join(OUT, name);
  const handle = await frame.$('#pairRow');
  if (!handle) return null;
  await handle.screenshot({ path: file, animations: 'disabled' });
  return name;
}

async function chooseUnit(page, value) {
  const selector = page.locator('[data-testid="shell-unit-select"] .ant-select-selector');
  await selector.click();
  const dropdown = page.locator('.ant-select-dropdown:not(.ant-select-dropdown-hidden)').last();
  await dropdown.waitFor({ state: 'visible', timeout: 5000 });
  const order = ['全部板块', ...LEAVES];
  const want = order.indexOf(value);
  for (let i = 0; i < order.length + 2; i++) {
    const active = dropdown.locator('.ant-select-item-option-active');
    const selected = dropdown.locator('.ant-select-item-option-selected');
    let title = '';
    if (await active.count()) title = await active.first().getAttribute('title') || '';
    else if (await selected.count()) title = await selected.first().getAttribute('title') || '';
    if (title === value) {
      await page.keyboard.press('Enter');
      await page.waitForFunction((unit) => {
        const f = [...document.querySelectorAll('iframe')].find((el) => (el.getAttribute('title') || '').includes('运营看板'));
        return f && f.contentWindow && f.contentWindow.dashboard && f.contentWindow.dashboard.state.unit === unit;
      }, value, { timeout: 10000 });
      return;
    }
    const cur = order.indexOf(title);
    await page.keyboard.press(cur === -1 || (want !== -1 && want < cur) ? 'ArrowUp' : 'ArrowDown');
  }
  throw new Error('壳级组织板块下拉键盘未能选中：' + value);
}

async function main() {
  const sha = execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim();
  const browser = await chromium.launch({ headless: true });
  const pageErrors = [];
  const context = await browser.newContext({
    viewport: { width: 760, height: 1000 },
    deviceScaleFactor: 1,
    locale: 'zh-CN',
  });
  const page = await context.newPage();
  page.on('pageerror', (err) => pageErrors.push(String(err)));
  await page.goto(URL, { waitUntil: 'networkidle', timeout: 90000 });
  await waitLayout(page, { needLabels: true });

  const narrowColdShell = await shellGeom(page);
  const narrowCold = await opsFrame(page).evaluate(measureInPage);
  const shots = [];
  shots.push(await shot(page, 'max-reprobe-01-shell-760.png'));
  const pairShot = await shotPair(page, 'max-reprobe-02-pair-760.png');
  if (pairShot) shots.push(pairShot);

  await page.setViewportSize({ width: 1440, height: 1000 });
  await waitLayout(page, { needLabels: true });
  const desktopShell = await shellGeom(page);
  const desktop = await opsFrame(page).evaluate(measureInPage);
  const injectionRaw = await opsFrame(page).evaluate(injectionInPage);
  const injection = Object.assign(judgeInjection(injectionRaw), {
    grew: injectionRaw.grew,
    injectedTextCut: injectionRaw.injectedTextCut,
    beforeKpi: injectionRaw.before.kpi,
    afterKpi: injectionRaw.after.kpi,
    beforePair: injectionRaw.before.pair,
    afterPair: injectionRaw.after.pair,
  });
  shots.push(await shot(page, 'max-reprobe-03-shell-1440.png'));
  shots.push(await shotPair(page, 'max-reprobe-04-pair-1440.png'));
  for (const [sel, name] of [
    ['#kpiGrid', 'max-reprobe-05-kpi-1440.png'],
    ['#cashMetrics', 'max-reprobe-06-cash-1440.png'],
    ['#riskMetrics', 'max-reprobe-07-risk-1440.png'],
    ['#deliveryPanel', 'max-reprobe-08-delivery-1440.png'],
  ]) {
    const handle = await opsFrame(page).$(sel);
    if (handle) {
      await handle.screenshot({ path: path.join(OUT, name), animations: 'disabled' });
      shots.push(name);
    }
  }

  await page.setViewportSize({ width: 760, height: 1000 });
  await waitLayout(page, { needLabels: true });
  const narrowResizeShell = await shellGeom(page);
  const narrowResize = await opsFrame(page).evaluate(measureInPage);
  shots.push(await shot(page, 'max-reprobe-09-shell-760-from-desktop.png'));
  const pairResizeShot = await shotPair(page, 'max-reprobe-10-pair-760-from-desktop.png');
  if (pairResizeShot) shots.push(pairResizeShot);

  await page.setViewportSize({ width: 1440, height: 1000 });
  await waitLayout(page, { needLabels: true });
  const restoredShell = await shellGeom(page);
  const restored = await opsFrame(page).evaluate(measureInPage);
  shots.push(await shotPair(page, 'max-reprobe-11-pair-1440-restored.png'));

  const leaves = [];
  for (const name of LEAVES) {
    await chooseUnit(page, name);
    await waitLayout(page, { needLabels: false });
    const m = await opsFrame(page).evaluate(measureInPage);
    const hidden =
      m.pairDisplay === 'none' &&
      (m.pairHiddenAttr === true || m.pairDataVisible === 'false') &&
      (m.pairRectH === 0 || m.pairRectH === null);
    const ref = m.gaps.cashToRisk;
    const hole = m.gaps.riskToDelivery;
    const noHole = ref != null && hole != null && Math.abs(hole - ref) <= 8;
    leaves.push({
      unit: name,
      stateUnit: m.unit,
      pairDisplay: m.pairDisplay,
      pairHiddenAttr: m.pairHiddenAttr,
      pairDataVisible: m.pairDataVisible,
      pairRectH: m.pairRectH,
      gaps: m.gaps,
      hidden,
      noHole,
      pass: hidden && noHole && m.unit === name,
    });
    fs.writeFileSync(path.join(OUT, 'max-reprobe-leaves.json'), JSON.stringify(leaves, null, 2));
  }
  await page.mouse.move(8, 8);
  await opsFrame(page).evaluate(() => {
    const tip = document.getElementById('globalTooltip');
    if (tip) {
      tip.classList.remove('show');
      tip.setAttribute('aria-hidden', 'true');
    }
    const risk = document.getElementById('riskPanel');
    if (risk) risk.scrollIntoView({ block: 'start' });
  });
  const leafFrameShot = path.join(OUT, 'max-reprobe-12-leaf-yinchuan.png');
  await page.locator('iframe[title="运营看板202610 · 运营看板"]').screenshot({ path: leafFrameShot });
  shots.push('max-reprobe-12-leaf-yinchuan.png');

  let backAll = null;
  let backAllError = null;
  try {
    await chooseUnit(page, '全部板块');
    await waitLayout(page, { needLabels: true });
    backAll = await opsFrame(page).evaluate(measureInPage);
  } catch (err) {
    backAllError = String(err && err.message ? err.message : err);
  }

  const contentWidth = (shell) => (shell.iframe ? shell.iframe.w : null);
  const near312 = (w) => w != null && Math.abs(w - 312) <= 8;

  const result = {
    probe: 'max-independent-reprobe',
    sha,
    url: URL,
    capturedAt: new Date().toISOString(),
    pageErrors,
    shots,
    precondition: {
      cold760: { shell: narrowColdShell, contentWidth: contentWidth(narrowColdShell), near312: near312(contentWidth(narrowColdShell)), docClientWidth: narrowCold.docClientWidth, pairClientWidth: narrowCold.groups.pair.clientWidth },
      resize760: { shell: narrowResizeShell, contentWidth: contentWidth(narrowResizeShell), near312: near312(contentWidth(narrowResizeShell)), docClientWidth: narrowResize.docClientWidth, pairClientWidth: narrowResize.groups.pair.clientWidth },
      desktop1440: { shell: desktopShell, contentWidth: contentWidth(desktopShell) },
      restored1440: { shell: restoredShell, contentWidth: contentWidth(restoredShell) },
    },
    narrowCold: {
      judge: judgePairNarrow(narrowCold),
      titles: narrowCold.titles,
      labels: narrowCold.labels,
      groups: narrowCold.groups,
      maxLabelOverflow: narrowCold.maxLabelOverflow,
      bodyClips: narrowCold.bodyClips,
      deliveryNumbers: narrowCold.deliveryNumbers,
    },
    narrowFromDesktop: {
      judge: judgePairNarrow(narrowResize),
      rowJudgements: {
        kpi: judgeRows(narrowResize.groups.kpi, {}),
        cash: judgeRows(narrowResize.groups.cash, {}),
        risk: judgeRows(narrowResize.groups.risk, {}),
      },
      titles: narrowResize.titles,
      labelSummary: {
        count: narrowResize.labelCount,
        maxOverflow: narrowResize.maxLabelOverflow,
        offenders: narrowResize.labels.filter((l) => l.clip.overflow > TOL).slice(0, 8),
      },
      groups: {
        kpi: narrowResize.groups.kpi,
        cash: narrowResize.groups.cash,
        risk: narrowResize.groups.risk,
        pair: narrowResize.groups.pair,
      },
    },
    desktop: {
      kpi: judgeRows(desktop.groups.kpi, { firstRow: 2 }),
      cash: judgeRows(desktop.groups.cash, { firstRow: 3 }),
      risk: judgeRows(desktop.groups.risk, { firstRow: 2 }),
      pair: judgeRows(desktop.groups.pair, { firstRow: 2 }),
      injection,
      bodyClips: desktop.bodyClips,
      delivery: desktop.delivery,
      deliveryNumbers: desktop.deliveryNumbers,
      pairHeights: desktop.groups.pair.rows,
      groups: desktop.groups,
      axisSample: desktop.axisSample,
      deliveryRightClip: desktop.deliveryRightClip,
    },
    restored: {
      judge: judgeDesktopRestore(restored),
      groupsPair: restored.groups.pair,
      kpi: judgeRows(restored.groups.kpi, { firstRow: 2 }),
      cash: judgeRows(restored.groups.cash, { firstRow: 3 }),
      risk: judgeRows(restored.groups.risk, { firstRow: 2 }),
      bodyClips: restored.bodyClips,
      delivery: restored.delivery,
      deliveryNumbers: restored.deliveryNumbers,
    },
    leaves,
    backAllError,
    backToAllPairCols: backAll ? backAll.groups.pair.firstRowCols : null,
  };

  const blocking =
    result.precondition.cold760.near312 &&
    result.precondition.resize760.near312 &&
    result.narrowCold.judge.pass &&
    result.narrowFromDesktop.judge.pass &&
    result.narrowFromDesktop.rowJudgements.kpi.pass &&
    result.narrowFromDesktop.rowJudgements.cash.pass &&
    result.narrowFromDesktop.rowJudgements.risk.pass &&
    result.restored.judge.pass;

  const regression =
    result.desktop.kpi.pass &&
    result.desktop.cash.pass &&
    result.desktop.risk.pass &&
    result.desktop.pair.pass &&
    result.desktop.injection.pass &&
    result.desktop.bodyClips.length === 0 &&
    (result.desktop.delivery && result.desktop.delivery.slack != null && result.desktop.delivery.slack <= 80) &&
    result.leaves.every((l) => l.pass) &&
    result.restored.kpi.pass &&
    result.restored.cash.pass &&
    result.restored.risk.pass &&
    result.restored.bodyClips.length === 0 &&
    (result.restored.delivery && result.restored.delivery.slack != null && result.restored.delivery.slack <= 80);

  result.verdict = blocking && regression ? 'PASS' : 'FAIL';
  result.blockingPass = blocking;
  result.regressionPass = regression;

  fs.writeFileSync(path.join(OUT, 'max-reprobe-result.json'), JSON.stringify(result, null, 2));
  console.log(JSON.stringify({
    verdict: result.verdict,
    blockingPass: blocking,
    regressionPass: regression,
    cold: result.narrowCold.judge,
    resizeNarrow: result.narrowFromDesktop.judge,
    content: {
      cold: result.precondition.cold760.contentWidth,
      resize: result.precondition.resize760.contentWidth,
    },
    restored: result.restored.judge,
    desktop: {
      kpi: result.desktop.kpi,
      cash: result.desktop.cash,
      risk: result.desktop.risk,
      pair: result.desktop.pair,
      injection: result.desktop.injection,
      bodyClips: result.desktop.bodyClips,
      delivery: result.desktop.delivery,
    },
    leavesFail: result.leaves.filter((l) => !l.pass).map((l) => l.unit),
    pageErrors,
  }, null, 2));
  await browser.close();
  if (result.verdict !== 'PASS') process.exitCode = 2;
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
