/**
 * Max 页面探针（file:// 真实 Chromium 渲染）。
 * 金额预期只来自 max-oracle.cjs，不调用 KpiSubgoals 的分配/百分比/条宽函数当答案。
 * 运行：node docs/evidence/2026-11-09-kpi-subgoals-12seg/max-page-probe.cjs
 */
'use strict';

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const O = require('./max-oracle.cjs');

const OUT = __dirname;
const FILE = 'file://' + path.resolve('public/operations-dashboard-202610/index.html');
const SRC = fs.readFileSync(path.resolve('public/operations-dashboard-202610/index.html'), 'utf8');
const results = [];
const fails = [];

function check(ac, ok, name, detail) {
  const row = { ac, name, ok: !!ok, detail: detail == null ? null : detail };
  results.push(row);
  if (!ok) {
    fails.push(row);
    const text = JSON.stringify(detail);
    console.log('FAIL  [' + ac + '] ' + name + (text ? '  ' + text.slice(0, 600) : ''));
  } else {
    console.log('PASS  [' + ac + '] ' + name);
  }
}

function parsePageWeights(src) {
  const m = src.match(/const DEMO_SUBGOAL_WEIGHTS = \{([\s\S]*?)\n  \};/);
  if (!m) throw new Error('页面里没有 DEMO_SUBGOAL_WEIGHTS');
  const out = {};
  for (const key of Object.keys(O.KPI_META)) {
    const line = m[1].match(new RegExp(key + ':\\{done:\\[([^\\]]+)\\],target:\\[([^\\]]+)\\]\\}'));
    if (!line) throw new Error('缺少权重 ' + key);
    out[key] = {
      done: line[1].split(',').map(s => Number(s.trim())),
      target: line[2].split(',').map(s => Number(s.trim())),
    };
  }
  return out;
}

const WEIGHTS = parsePageWeights(SRC);

function hostMessage(page, data) {
  return page.evaluate(payload => {
    window.dispatchEvent(new MessageEvent('message', { data: payload, origin: window.location.origin }));
  }, data);
}
async function setUnit(page, unit) {
  await hostMessage(page, { type: 'ops-dashboard-filter', year: 2026, unit });
  await page.waitForFunction(u => window.dashboard && window.dashboard.state.unit === u, unit);
}
async function setTheme(page, theme) {
  await hostMessage(page, { type: 'ops-dashboard-theme', theme });
  await page.waitForFunction(t => window.dashboard.state.theme === t, theme);
}
async function setSwitch(page, on) {
  const cur = await page.getAttribute('#kpiSubgoalSwitch', 'aria-checked');
  if ((cur === 'true') !== on) await page.click('#kpiSubgoalSwitch');
  await page.waitForFunction(v => document.getElementById('kpiSubgoalSwitch').getAttribute('aria-checked') === v, String(on));
  await page.waitForTimeout(80);
}

async function snap(page) {
  return page.evaluate(() => {
    const txt = el => (el ? el.textContent.trim() : null);
    const glyph = node => {
      const g = document.createRange();
      g.selectNodeContents(node);
      const r = g.getBoundingClientRect();
      return { l: r.left, t: r.top, r: r.right, b: r.bottom, w: r.width, h: r.height };
    };
    const trackOf = el => {
      if (!el) return null;
      const fill = el.querySelector('.seg12-fill');
      const ticks = [...el.querySelectorAll('.seg12-ticks > b')];
      const fr = fill ? fill.getBoundingClientRect() : null;
      const tr = el.getBoundingClientRect();
      return {
        segs: ticks.length,
        tickW: ticks.map(b => b.getBoundingClientRect().width),
        tickL: ticks.map(b => b.getBoundingClientRect().left),
        trackW: tr.width,
        trackL: tr.left,
        fillW: fr ? fr.width : null,
        fillL: fr ? fr.left : null,
        fillStyle: fill ? fill.getAttribute('style') : null,
        fillBg: fill ? getComputedStyle(fill).backgroundImage : null,
        trackBg: getComputedStyle(el).backgroundColor,
      };
    };
    const stillClipped = card => {
      const mainEl = document.getElementById('main');
      const prev = mainEl.scrollTop;
      card.scrollIntoView({ block: 'center', inline: 'nearest' });
      const appR = document.querySelector('.app').getBoundingClientRect();
      const hits = [];
      const nodes = [...card.querySelectorAll('.kpi-value, .kpi-title, .kpi-meta, .kpi-delta-label, .kpi-delta-num, .kpi-sub-name, .kpi-sub-done, .kpi-sub-target, .kpi-sub-pct, .kpi-sub-flag')];
      for (const node of nodes) {
        const b = glyph(node);
        if (b.w < 0.5 || b.h < 0.5) continue;
        if (b.t < appR.top - 1 || b.b > appR.bottom + 1 || b.l < appR.left - 1 || b.r > appR.right + 1) {
          hits.push(node.textContent.trim().slice(0, 40));
        }
      }
      mainEl.scrollTop = prev;
      return hits;
    };
    const cards = [...document.querySelectorAll('#kpiGrid > .kpi-card')].map(card => {
      const cr = card.getBoundingClientRect();
      const leaves = [...card.querySelectorAll('.kpi-value, .kpi-title, .kpi-meta, .kpi-delta-label, .kpi-delta-num, .kpi-sub-name, .kpi-sub-done, .kpi-sub-target, .kpi-sub-pct, .kpi-sub-flag')];
      const glyphHits = [];
      const boxes = leaves.map(node => ({ node, b: glyph(node) }));
      for (let i = 0; i < boxes.length; i += 1) {
        for (let j = i + 1; j < boxes.length; j += 1) {
          const a = boxes[i];
          const b = boxes[j];
          if (a.node.contains(b.node) || b.node.contains(a.node)) continue;
          if (a.b.w < 0.5 || b.b.w < 0.5 || a.b.h < 0.5 || b.b.h < 0.5) continue;
          const w = Math.min(a.b.r, b.b.r) - Math.max(a.b.l, b.b.l);
          const h = Math.min(a.b.b, b.b.b) - Math.max(a.b.t, b.b.t);
          if (w > 0.5 && h > 0.5) glyphHits.push({ a: a.node.textContent.trim().slice(0, 24), b: b.node.textContent.trim().slice(0, 24), area: Math.round(w * h) });
        }
      }
      const clipped = stillClipped(card);
      const ellipsis = leaves.filter(n => getComputedStyle(n).textOverflow === 'ellipsis' && n.scrollWidth > n.clientWidth + 1).map(n => n.textContent.trim().slice(0, 40));
      const subs = card.querySelector('.kpi-subgoals');
      return {
        kpi: card.dataset.kpi,
        rect: { t: cr.top, l: cr.left, w: cr.width, h: cr.height, b: cr.bottom, r: cr.right },
        scroll: { sh: card.scrollHeight, ch: card.clientHeight, sw: card.scrollWidth, cw: card.clientWidth },
        title: txt(card.querySelector('.kpi-title')),
        unit: txt(card.querySelector('.kpi-title .unit')),
        value: txt(card.querySelector('.kpi-value')),
        target: txt(card.querySelector('.kpi-meta b')),
        metaText: txt(card.querySelector('.kpi-meta')),
        rate: txt(card.querySelector('.kpi-meta em')),
        deltaLabels: [...card.querySelectorAll('.kpi-delta-label')].map(txt),
        deltaNums: [...card.querySelectorAll('.kpi-delta-num')].map(txt),
        mainTrack: trackOf(card.querySelector('.kpi-content > .progress-track')),
        hasSub: !!subs,
        subText: subs ? subs.textContent : '',
        rows: [...card.querySelectorAll('.kpi-sub-row')].map(r => ({
          cat: r.dataset.category,
          name: txt(r.querySelector('.kpi-sub-name')),
          done: txt(r.querySelector('.kpi-sub-done')),
          target: txt(r.querySelector('.kpi-sub-target')),
          pct: txt(r.querySelector('.kpi-sub-pct')),
          flag: txt(r.querySelector('.kpi-sub-flag')),
          missing: r.dataset.missing === 'true',
          noTarget: r.dataset.noTarget === 'true',
          track: trackOf(r.querySelector('.progress-track')),
        })),
        glyphHits: glyphHits.slice(0, 6),
        clipped: clipped.slice(0, 6),
        ellipsis,
      };
    });
    const pair = document.getElementById('pairRow');
    const prev = pair ? pair.previousElementSibling : null;
    const next = pair ? pair.nextElementSibling : null;
    const pr = pair ? pair.getBoundingClientRect() : null;
    const prevB = prev ? prev.getBoundingClientRect() : null;
    const nextB = next ? next.getBoundingClientRect() : null;
    let storage = null;
    try { storage = { local: Object.keys(localStorage), session: Object.keys(sessionStorage) }; } catch (e) { storage = { error: String(e) }; }
    const charts = Object.entries(window.dashboard.charts).filter(([, c]) => c && c.series).map(([id, c]) => ({
      id,
      hc: !!(c.container && c.container.classList.contains('highcharts-container')),
      series: c.series.map(s => [s.type, s.name, String(s.color), (s.data || s.options.data || []).length]),
    }));
    const sw = document.getElementById('kpiSubgoalSwitch');
    return {
      unit: window.dashboard.state.unit,
      theme: window.dashboard.state.theme,
      showSubgoals: window.dashboard.state.showSubgoals,
      primary: getComputedStyle(document.documentElement).getPropertyValue('--primary').trim(),
      switchChecked: sw ? sw.getAttribute('aria-checked') : null,
      switchLabel: txt(sw && sw.querySelector('.kpi-switch-label')),
      toolbar: txt(document.getElementById('kpiToolbar')),
      cards,
      pairDisplay: pair ? getComputedStyle(pair).display : null,
      pairHidden: pair ? pair.hidden : null,
      pairH: pr ? pr.height : null,
      pairOffset: pair ? pair.offsetHeight : null,
      pairGap: prevB && nextB ? Math.round((nextB.top - prevB.bottom) * 10) / 10 : null,
      storage,
      cookie: document.cookie,
      search: location.search,
      charts,
      mainOverflow: getComputedStyle(document.getElementById('main')).overflow,
    };
  });
}

function tickDelta(track) {
  if (!track || !track.tickW.length) return Infinity;
  return Math.max(...track.tickW) - Math.min(...track.tickW);
}

function assertFill(ac, tag, done, target, track) {
  const exp = O.expectedFillPx(done, target, track.trackW);
  const near = Math.abs(track.fillW - exp) <= 1.25;
  check(ac, near, tag + ' 填充宽度按未舍入比例', { fillW: track.fillW, exp, style: track.fillStyle, trackW: track.trackW });
  if (done != null && target > 0n && done * 12n !== target && done < target) {
    const ratio = Number(done) / Number(target);
    const snapped = Math.round(ratio * 12) / 12;
    if (Math.abs(ratio - snapped) > 0.015 && track.trackW > 20) {
      const got = track.fillW / track.trackW;
      check(ac, Math.abs(got - ratio) + 0.01 < Math.abs(got - snapped), tag + ' 填充不吸附到 1/12', { got, ratio, snapped });
    }
  }
}

function assertMain(tag, s) {
  check('AC7', s.cards.length === 4, tag + ' 四张主卡', s.cards.map(c => c.kpi));
  for (const c of s.cards) {
    const [name, addLabel] = O.KPI_META[c.kpi];
    const done = O.parseUnits(c.value);
    const target = O.parseUnits(c.target);
    check('AC7', c.title && c.title.startsWith(name) && c.unit === '（万元）', tag + ' ' + c.kpi + ' 名称与万元', { title: c.title, unit: c.unit });
    check('AC7', /目标/.test(c.metaText || '') && /占总目标/.test(c.metaText || ''), tag + ' ' + c.kpi + ' 保留目标与占总目标', c.metaText);
    check('AC7', c.rate === O.percentText(done, target), tag + ' ' + c.kpi + ' 占总目标等于独立 2 位百分比', { rate: c.rate, value: c.value, target: c.target, exp: O.percentText(done, target) });
    check('AC5', c.mainTrack && c.mainTrack.segs === 12 && tickDelta(c.mainTrack) <= 1, tag + ' ' + c.kpi + ' 主条 12 等分', c.mainTrack && { segs: c.mainTrack.segs, tickW: c.mainTrack.tickW });
    if (c.mainTrack) assertFill('AC5', tag + ' ' + c.kpi + ' 主条', done, target, c.mainTrack);
    const share = c.deltaNums[1];
    const shareOk = share === '—' || /^\d{1,3}(,\d{3})*\.\d%$/.test(share);
    check('AC7', c.deltaLabels[0] === addLabel && c.deltaLabels[1] === '占目标' && shareOk, tag + ' ' + c.kpi + ' 新增文案与占目标 1 位或无目标', { labels: c.deltaLabels, nums: c.deltaNums });
    if (target === 0n) {
      check('AC4', c.rate === '—' && /无目标/.test(c.metaText || '') && c.mainTrack && c.mainTrack.fillW <= 0.5, tag + ' ' + c.kpi + ' 主目标 0', { rate: c.rate, meta: c.metaText, fill: c.mainTrack && c.mainTrack.fillW });
    }
  }
}

function assertSubs(tag, s) {
  for (const c of s.cards) {
    const cats = c.rows.map(r => r.cat);
    const names = c.rows.map(r => r.name);
    check('AC1', cats.join() === O.CATEGORIES.join() && names.join() === O.CATEGORIES.join(), tag + ' ' + c.kpi + ' 三行顺序', names);
    const done = O.parseUnits(c.value);
    const target = O.parseUnits(c.target);
    const expDone = O.allocate(done, WEIGHTS[c.kpi].done);
    const expTarget = O.allocate(target, WEIGHTS[c.kpi].target);
    let sumD = 0n;
    let sumT = 0n;
    let sumOk = true;
    c.rows.forEach((r, i) => {
      const rd = O.parseUnits(r.done);
      const rt = O.parseUnits(r.target);
      if (rd == null || rt == null) sumOk = false;
      else { sumD += rd; sumT += rt; }
      check('AC2', rd === expDone[i], tag + ' ' + c.kpi + ' ' + r.cat + ' 完成额逐行等于独立余数', { shown: r.done, exp: O.formatUnits(expDone[i]) });
      check('AC2', rt === expTarget[i], tag + ' ' + c.kpi + ' ' + r.cat + ' 目标额逐行等于独立余数', { shown: r.target, exp: O.formatUnits(expTarget[i]) });
      check('AC5', r.pct === O.percentText(rd, rt), tag + ' ' + c.kpi + ' ' + r.cat + ' 百分比', { pct: r.pct, exp: O.percentText(rd, rt) });
      check('AC5', r.track && r.track.segs === 12 && tickDelta(r.track) <= 1, tag + ' ' + c.kpi + ' ' + r.cat + ' 子条 12 等分', r.track && r.track.segs);
      if (r.track) assertFill('AC5', tag + ' ' + c.kpi + ' ' + r.cat + ' 子条', rd, rt, r.track);
      if (rt === 0n) check('AC4', r.pct === '—' && r.flag === '无目标' && r.track && r.track.fillW <= 0.5 && !r.missing, tag + ' ' + c.kpi + ' ' + r.cat + ' 无目标', r);
    });
    check('AC2', sumOk && sumD === done && sumT === target, tag + ' ' + c.kpi + ' 三行展示合计等于主卡', { sumD: sumD.toString(), mainD: String(done), sumT: sumT.toString(), mainT: String(target) });
    check('AC7', !/当月新增|上月新增|占目标/.test(c.subText), tag + ' ' + c.kpi + ' 子行没有新增文案');
    if (s.unit === 'SAS170 PMC板块') {
      check('AC1', s.unit.includes('PMC') && c.rows.some(r => r.name === 'PMC'), tag + ' SAS170 组织名与业务 PMC 同时在', { unit: s.unit, names });
    }
  }
}

function assertLayout(tag, s) {
  const groups = [];
  s.cards.forEach(c => {
    let g = groups.find(row => Math.abs(row.top - c.rect.t) <= 3);
    if (!g) { g = { top: c.rect.t, h: [] }; groups.push(g); }
    g.h.push(c.rect.h);
  });
  groups.forEach((g, i) => {
    const delta = Math.max(...g.h) - Math.min(...g.h);
    check('AC6', g.h.length < 2 || delta <= 1, tag + ' 第' + (i + 1) + '行外框等高', { delta, h: g.h });
  });
  s.cards.forEach(c => {
    check('AC6', c.scroll.sh <= c.scroll.ch + 1 && c.scroll.sw <= c.scroll.cw + 1, tag + ' ' + c.kpi + ' 卡内无滚动裁切', c.scroll);
    check('AC6', c.ellipsis.length === 0, tag + ' ' + c.kpi + ' 无省略号', c.ellipsis);
    check('AC6', c.glyphHits.length === 0, tag + ' ' + c.kpi + ' 字形不互相遮挡', c.glyphHits);
    check('AC6', c.clipped.length === 0, tag + ' ' + c.kpi + ' 文字未被 overflow 裁掉', c.clipped);
  });
}

function assertLeaf(tag, s) {
  if (s.unit === '全部板块') return;
  check('AC6', s.pairDisplay === 'none' && s.pairHidden === true && s.pairOffset === 0, tag + ' 叶子两块整块隐藏', { display: s.pairDisplay, hidden: s.pairHidden, offset: s.pairOffset, h: s.pairH, gap: s.pairGap });
  check('AC6', s.pairGap != null && s.pairGap < 40, tag + ' 叶子两块隐藏后不留大洞', s.pairGap);
}

(async () => {
  const browser = await chromium.launch({ channel: 'chrome', args: ['--no-sandbox', '--disable-dev-shm-usage'] });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 1 });
  await page.goto(FILE);
  await page.waitForFunction(() => document.body.dataset.ready === 'true' && document.getElementById('kpiSubgoalSwitch'));

  check('文档', JSON.stringify(WEIGHTS) === JSON.stringify(O.DEMO_WEIGHTS), '页面演示权重与证据里抄录的正整数一致', WEIGHTS);

  const s0 = await snap(page);
  const charts0 = JSON.stringify(s0.charts);
  check('AC3', s0.switchChecked === 'false' && s0.showSubgoals === false && s0.switchLabel === '显示子目标', '进入页面开关为关', { checked: s0.switchChecked, label: s0.switchLabel, state: s0.showSubgoals });
  check('AC3', s0.cards.every(c => c.rows.length === 0 && !c.hasSub), '关闭时没有子行节点', s0.cards.map(c => c.rows.length));
  check('规格', /仅演示、非业务默认/.test(s0.toolbar || ''), '开关旁标明仅演示、非业务默认', s0.toolbar);
  assertMain('关态1440', s0);
  assertLayout('关态1440', s0);
  await page.locator('#kpiGrid').screenshot({ path: path.join(OUT, 'max-page-off-1440.png') });

  await setSwitch(page, true);
  const s1 = await snap(page);
  check('AC3', s1.switchChecked === 'true' && s1.showSubgoals === true, '打开开关后为开');
  check('AC5', JSON.stringify(s1.charts) === charts0, '开关不改变 Highcharts 系列类型、名称、颜色和点数', { before: s0.charts.length, after: s1.charts.length });
  check('AC5', s1.charts.length > 0 && s1.charts.every(c => c.hc), '图表容器仍是 Highcharts', s1.charts.map(c => c.id));
  check('AC3', JSON.stringify(s1.storage) === JSON.stringify(s0.storage) && s1.cookie === s0.cookie && s1.search === s0.search, '开关不写本地存储、cookie 或 URL', { before: s0.storage, after: s1.storage });
  await page.locator('#kpiGrid').screenshot({ path: path.join(OUT, 'max-page-on-1440.png') });

  for (const unit of O.UNITS) {
    await setUnit(page, unit);
    const s = await snap(page);
    check('AC3', s.switchChecked === 'true' && s.showSubgoals === true, unit + ' 切换后开关保持', s.switchChecked);
    assertMain(unit, s);
    assertSubs(unit, s);
    assertLayout(unit + ' 1440', s);
    assertLeaf(unit, s);
    if (unit === 'SAS170 PMC板块') await page.locator('#kpiGrid').screenshot({ path: path.join(OUT, 'max-page-sas170.png') });
    if (unit === 'SAS530 银川中心') await page.screenshot({ path: path.join(OUT, 'max-page-leaf-yinchuan.png'), clip: { x: 0, y: 0, width: 1440, height: 900 } });
  }

  await setUnit(page, '全部板块');
  const widths = [1440, 1280, 1024, 760, 520, 312];
  for (const w of widths) {
    await page.setViewportSize({ width: w, height: 1000 });
    await setSwitch(page, false);
    await page.waitForTimeout(450);
    const off = await snap(page);
    assertLayout('关 ' + w, off);
    check('AC3', off.cards.every(c => !c.hasSub), '关 ' + w + ' 不留子行空位', off.cards.map(c => c.hasSub));
    await page.waitForTimeout(200);
    const offH = await page.evaluate(() => {
      const cols = document.getElementById('kpiGrid').dataset.peerCols;
      return [...document.querySelectorAll('#kpiGrid > .kpi-card')].map(c => ({ h: c.getBoundingClientRect().height, cols, sub: !!c.querySelector('.kpi-subgoals') }));
    });
    await setSwitch(page, true);
    await page.waitForTimeout(450);
    const on = await snap(page);
    assertLayout('开 ' + w, on);
    assertSubs('开 ' + w, on);
    check('AC6', on.cards.every((c, i) => c.rect.h + 0.5 >= offH[i].h), '开 ' + w + ' 展开后不低于收起高度', { offH, onH: on.cards.map(c => c.rect.h) });
    if (w === 312 || w === 760) await page.locator('#kpiGrid').screenshot({ path: path.join(OUT, 'max-page-on-' + w + '.png') });
    await setSwitch(page, false);
    await page.waitForTimeout(450);
    const back = await snap(page);
    await page.waitForTimeout(200);
    const backH = await page.evaluate(() => [...document.querySelectorAll('#kpiGrid > .kpi-card')].map(c => ({
      h: c.getBoundingClientRect().height,
      sub: !!c.querySelector('.kpi-subgoals'),
      cols: document.getElementById('kpiGrid').dataset.peerCols,
    })));
    const dh = backH.map((c, i) => Math.abs(c.h - offH[i].h));
    const sameCols = backH.every((c, i) => c.cols === offH[i].cols);
    check('AC6', backH.every(c => !c.sub) && offH.every(c => !c.sub) && (!sameCols || Math.max(...dh) <= 1), '收起后无子行空位 ' + w, { dh, sameCols, offH, backH });
    await setSwitch(page, true);
  }
  await page.setViewportSize({ width: 312, height: 1000 });
  await setSwitch(page, false);
  await page.locator('#kpiGrid').screenshot({ path: path.join(OUT, 'max-page-off-312.png') });
  await setSwitch(page, true);
  await page.setViewportSize({ width: 1440, height: 1000 });

  const themes = await page.evaluate(() => Object.fromEntries(Object.entries(window.dashboard.THEMES).map(([k, v]) => [k, v.primary])));
  for (const [name, primary] of Object.entries(themes)) {
    await setTheme(page, name);
    const s = await snap(page);
    const fills = s.cards.flatMap(c => [c.mainTrack, ...c.rows.map(r => r.track)]).filter(Boolean);
    const rgb = 'rgb(' + primary.slice(1).match(/.{2}/g).map(x => parseInt(x, 16)).join(', ') + ')';
    check('AC5', s.primary.toLowerCase() === primary.toLowerCase(), '主题 ' + name + ' CSS 变量', { primary: s.primary, exp: primary });
    check('AC7', fills.length === 16 && fills.every(t => (t.fillBg || '').includes(rgb)), '主题 ' + name + ' 主条和子条填充跟随主题', { sample: fills[0] && fills[0].fillBg, rgb, n: fills.length });
    await page.locator('#kpiGrid').screenshot({ path: path.join(OUT, 'max-page-theme-' + name + '.png') });
  }
  await setTheme(page, 'blue');
  const afterTheme = await snap(page);
  check('AC5', JSON.stringify(afterTheme.charts.map(c => c.series)) === JSON.stringify(s1.charts.map(c => c.series)), '主题切换不改 Highcharts 系列结构');

  await page.evaluate(() => {
    const m = window.dashboard.model;
    m.totals.contract = 13.23;
    m.targets.contract = 100;
    m.totals.completed = 115.68;
    m.targets.completed = 100;
    m.totals.invoice = 0;
    m.targets.invoice = 50;
    m.totals.receipt = 0;
    m.targets.receipt = 0;
  });
  await setUnit(page, 'SAS170 PMC板块');
  await page.evaluate(() => {
    const m = window.dashboard.model;
    m.totals.contract = 13.23;
    m.targets.contract = 100;
    m.totals.completed = 115.68;
    m.targets.completed = 100;
    m.totals.invoice = 0;
    m.targets.invoice = 50;
    m.totals.receipt = 0;
    m.targets.receipt = 0;
  });
  await setSwitch(page, false);
  await setSwitch(page, true);
  const fx = await snap(page);
  const byKpi = Object.fromEntries(fx.cards.map(c => [c.kpi, c]));
  check('AC5', byKpi.contract.value === '13.23' && byKpi.contract.target === '100.00' && byKpi.contract.rate === '13.23%', '仅测试主条文字 13.23%', { value: byKpi.contract.value, target: byKpi.contract.target, rate: byKpi.contract.rate });
  const cTrack = byKpi.contract.mainTrack;
  const seg = cTrack.trackW / 12;
  const inSeg2 = cTrack.fillW > seg + 0.6 && cTrack.fillW < seg * 2 - 0.6;
  check('AC5', inSeg2 && Math.abs(cTrack.fillW / cTrack.trackW - 0.1323) <= 1.25 / cTrack.trackW, '仅测试 13.23% 主条落在第 2 段内部', { fillW: cTrack.fillW, trackW: cTrack.trackW, seg, style: cTrack.fillStyle });
  check('AC4', byKpi.completed.rate === '115.68%' && Math.abs(byKpi.completed.mainTrack.fillW - byKpi.completed.mainTrack.trackW) <= 1, '仅测试 115.68% 主条满宽且文字照实', { rate: byKpi.completed.rate, fillW: byKpi.completed.mainTrack.fillW, trackW: byKpi.completed.mainTrack.trackW });
  check('AC4', byKpi.invoice.value === '0.00' && byKpi.invoice.rate === '0.00%' && byKpi.invoice.mainTrack.fillW <= 0.5 && !/无目标|缺失/.test(byKpi.invoice.metaText), '有效完成额 0.00 主卡', { value: byKpi.invoice.value, rate: byKpi.invoice.rate, meta: byKpi.invoice.metaText });
  check('AC4', byKpi.invoice.rows.every(r => r.done === '0.00' && r.pct === '0.00%' && r.flag == null && r.track.fillW <= 0.5), '有效完成额 0 的三行不是缺失也不是无目标', byKpi.invoice.rows.map(r => ({ done: r.done, pct: r.pct, flag: r.flag })));
  check('AC4', byKpi.receipt.target === '0.00' && byKpi.receipt.rate === '—' && /无目标/.test(byKpi.receipt.metaText) && byKpi.receipt.mainTrack.fillW <= 0.5, '主目标 0.00', { target: byKpi.receipt.target, rate: byKpi.receipt.rate, meta: byKpi.receipt.metaText, share: byKpi.receipt.deltaNums[1] });
  check('AC4', byKpi.receipt.deltaNums[1] === '—', '主目标 0 时占目标不做除法', byKpi.receipt.deltaNums[1]);
  check('AC4', byKpi.receipt.value === '0.00' && byKpi.receipt.rows.map(r => r.name).join() === O.CATEGORIES.join() && byKpi.receipt.rows.every(r => r.done === '0.00' && r.target === '0.00' && r.pct === '—' && r.flag === '无目标' && r.track.fillW <= 0.5), 'SAS170 主目标 0 时三行仍是 EPC/PMC/设计及咨询且都无目标', byKpi.receipt.rows.map(r => ({ name: r.name, done: r.done, target: r.target, pct: r.pct, flag: r.flag })));
  await page.locator('#kpiGrid').screenshot({ path: path.join(OUT, 'max-page-fixture-ratios.png') });

  const injected = await page.evaluate(() => {
    const KS = window.KpiSubgoals;
    const host = document.querySelector('#fixtureHost') || document.createElement('div');
    host.id = 'fixtureHost';
    const hostCard = document.querySelector('[data-kpi="contract"] .kpi-content');
    hostCard.appendChild(host);
    host.innerHTML = KS.subRowsHtml('仅测试', [
      KS.rowView('EPC', { done: 1323n, target: 10000n }),
      KS.rowView('PMC', { done: 11568n, target: 10000n }),
      KS.rowView('设计及咨询', { done: 0n, target: 5000n }),
      KS.rowView('EPC', { done: 0n, target: 0n }),
      KS.rowView('PMC', null),
      KS.rowView('设计及咨询', { done: null, target: 0n }),
    ]);
    host.style.cssText = 'width:100%;background:#fff;padding:8px';
    return [...host.querySelectorAll('.kpi-sub-row')].map(el => {
      const track = el.querySelector('.progress-track');
      const fill = el.querySelector('.seg12-fill');
      return {
        cat: el.dataset.category,
        done: el.querySelector('.kpi-sub-done').textContent.trim(),
        target: el.querySelector('.kpi-sub-target').textContent.trim(),
        pct: el.querySelector('.kpi-sub-pct').textContent.trim(),
        flag: el.querySelector('.kpi-sub-flag') ? el.querySelector('.kpi-sub-flag').textContent.trim() : null,
        missing: el.dataset.missing === 'true',
        trackW: track.getBoundingClientRect().width,
        fillW: fill.getBoundingClientRect().width,
        segs: track.querySelectorAll('.seg12-ticks > b').length,
        style: fill.getAttribute('style'),
      };
    });
  });
  await page.locator('#fixtureHost').screenshot({ path: path.join(OUT, 'max-page-fixture-rows.png') });
  const [r1323, r115, rZero, rNo, rMiss, rMiss0] = injected;
  const segW = r1323.trackW / 12;
  check('AC5', r1323.trackW > 80 && r1323.pct === '13.23%' && r1323.segs === 12 && r1323.fillW > segW + 0.6 && r1323.fillW < segW * 2 - 0.6, '仅测试子条 13.23% 在第 2 段内部', r1323);
  check('AC4', r115.trackW > 80 && r115.pct === '115.68%' && Math.abs(r115.fillW - r115.trackW) <= 1, '仅测试子条 115.68% 满宽', r115);
  check('AC4', rZero.done === '0.00' && rZero.pct === '0.00%' && rZero.fillW <= 0.5 && !rZero.flag && !rZero.missing, '仅测试有效完成额 0', rZero);
  check('AC4', rNo.target === '0.00' && rNo.pct === '—' && rNo.flag === '无目标' && rNo.fillW <= 0.5, '仅测试目标 0', rNo);
  check('AC4', rMiss.done === '—' && rMiss.target === '—' && rMiss.pct === '—' && !rMiss.flag && rMiss.missing && O.parseUnits(rMiss.done) === null, '缺失行是破折号，不能当成 0.00 做合计', rMiss);
  check('AC4', rMiss0.missing && rMiss0.flag === '无目标' && rMiss0.pct === '—' && rMiss0.done === '—', '缺失且目标已知为 0', rMiss0);
  const bogus = [rMiss].reduce((a, r) => a + (O.parseUnits(r.done) || 0n), 0n);
  check('AC4', bogus === 0n && O.parseUnits(rMiss.done) === null, '把缺失当成 0 去加总会被独立解析拒绝', { parsed: O.parseUnits(rMiss.done), bogus: bogus.toString() });

  await page.reload();
  await page.waitForFunction(() => document.body.dataset.ready === 'true');
  const s9 = await snap(page);
  check('AC3', s9.switchChecked === 'false' && s9.showSubgoals === false && s9.cards.every(c => !c.hasSub), '刷新后开关回到关且无子行', s9.switchChecked);
  check('AC3', s9.unit === '全部板块', '刷新后组织回到默认全部板块', s9.unit);
  await page.locator('#kpiGrid').screenshot({ path: path.join(OUT, 'max-page-refresh-off.png') });

  await browser.close();
  const byAc = {};
  for (const row of results) {
    if (!byAc[row.ac]) byAc[row.ac] = { pass: 0, fail: 0 };
    byAc[row.ac][row.ok ? 'pass' : 'fail'] += 1;
  }
  const verdict = fails.length ? 'FAIL' : 'PASS';
  fs.writeFileSync(path.join(OUT, 'max-page-result.json'), JSON.stringify({
    file: FILE,
    input: 'baseline 232cadfe0dfff742561491b71cdd977047bbc9c7 + patch sha256 688a5bfceefc5a43c6d42d1614681e1c78b64ac7e45bfcbe99e0d9bfe2573684',
    declaredImplShaNotPresent: '5a1191ac9f0c8b93e60756d0be434cd45ca005fe',
    weights: WEIGHTS,
    verdict,
    byAc,
    failCount: fails.length,
    passCount: results.length - fails.length,
    fails,
  }, null, 2));
  console.log('verdict=' + verdict + ' pass=' + (results.length - fails.length) + ' fail=' + fails.length);
  process.exit(fails.length ? 1 : 0);
})().catch(err => {
  console.error(err);
  process.exit(2);
});
