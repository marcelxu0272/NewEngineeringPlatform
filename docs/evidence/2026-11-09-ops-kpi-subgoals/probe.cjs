/**
 * 运营看板顶部四 KPI 子目标与 12 段进度条 — 页面级 DOM 真实渲染探针（实现证据，非验收关账）
 * 对照：docs/需求文档/202611_运营看板四KPI子目标与12段进度条.md 验收条件 1–7
 * 运行：node docs/evidence/2026-11-09-ops-kpi-subgoals/probe.cjs
 * 夹具中的 13.23% / 115.68% / 0 / 缺失 均为「仅测试」，只注入 DOM 测量，不写入演示主数据。
 */
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const KS = require(path.resolve('public/operations-dashboard-202610/kpi-subgoals.js'));

const OUT = __dirname;
const FILE = 'file://' + path.resolve('public/operations-dashboard-202610/index.html');
const UNITS = ['全部板块', 'SAS170 PMC板块', 'SAS610 咨询板块', 'SAS680 数字技术板块', 'SAS650 新材料板块',
  'SAS710 生命科学板块', 'SAS690 COII板块', 'SAS720 模块化板块', 'SAS670 供应链板块',
  'SAS520 金山中心', 'SAS560 沈阳中心', 'SAS550 惠湛中心', 'SAS530 银川中心'];
const KPIS = { contract: ['新签合同额', '当月新增'], completed: ['完成合同额', '上月新增'], invoice: ['完成开票额', '当月新增'], receipt: ['完成回款额', '当月新增'] };
const CATS = ['EPC', 'PMC', '设计及咨询'];
const WIDTHS = [1440, 1280, 1024, 760, 520, 312];
const PCT2 = /^\d{1,3}(,\d{3})*\.\d{2}%$/;
const PCT1 = /^\d{1,3}(,\d{3})*\.\d%$/;
const MONEY = /^\d{1,3}(,\d{3})*\.\d{2}$/;

const results = [];
const fails = [];
function check(ok, name, detail) {
  const row = { name, ok: !!ok, detail: detail == null ? null : detail };
  results.push(row);
  if (!ok) fails.push(row);
  console.log((ok ? 'PASS' : 'FAIL') + '  ' + name + (!ok && detail != null ? '  ' + JSON.stringify(detail) : ''));
}
const units = t => (MONEY.test(String(t)) ? KS.unitsFromDisplay(t) : null);
const rgb = hex => 'rgb(' + hex.slice(1).match(/.{2}/g).map(x => parseInt(x, 16)).join(', ') + ')';
const ticksOk = t => !!t && t.segs === 12 && Math.max(...t.tickW) - Math.min(...t.tickW) <= 1;

// file:// 下 window.postMessage 的 origin 是 "null"，页面会丢掉。与 11-06 probe 一样派发带本页 origin 的 MessageEvent，载荷仍是壳层那两条消息。
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
  const sw = page.locator('#kpiSubgoalSwitch');
  if (await sw.count() === 0) throw new Error('缺少 #kpiSubgoalSwitch');
  const cur = await sw.getAttribute('aria-checked');
  if ((cur === 'true') !== on) await page.click('#kpiSubgoalSwitch');
  await page.waitForFunction(v => document.getElementById('kpiSubgoalSwitch').getAttribute('aria-checked') === v, String(on));
  await page.waitForTimeout(50);
}

async function snap(page) {
  return page.evaluate(() => {
    const R = el => { const r = el.getBoundingClientRect(); return { l: r.left, t: r.top, r: r.right, b: r.bottom, w: r.width, h: r.height }; };
    const txt = el => (el ? el.textContent.trim() : null);
    const textRect = node => { const g = document.createRange(); g.selectNodeContents(node); const r = g.getBoundingClientRect(); return { l: r.left, r: r.right, t: r.top, b: r.bottom, w: r.width }; };
    const track = el => {
      if (!el) return null;
      const fill = el.querySelector('.seg12-fill');
      const ticks = [...el.querySelectorAll('.seg12-ticks > b')];
      return { segs: ticks.length, tickW: ticks.map(b => b.getBoundingClientRect().width), trackW: el.getBoundingClientRect().width,
        fillW: fill ? fill.getBoundingClientRect().width : null, fillBg: fill ? getComputedStyle(fill).backgroundImage : null,
        trackBg: getComputedStyle(el).backgroundColor };
    };
    const sw = document.getElementById('kpiSubgoalSwitch');
    const cards = [...document.querySelectorAll('#kpiGrid > .kpi-card')].map(card => {
      const cr = R(card);
      const tokens = [...card.querySelectorAll('.kpi-title, .kpi-value, .kpi-meta > span, .kpi-delta-row, .kpi-sub-name, .kpi-sub-amount, .kpi-sub-pct, .kpi-sub-flag')];
      const clipped = tokens.filter(n => { const t = textRect(n); return t.w > 0 && (t.l < cr.l - 1 || t.r > cr.r + 1 || t.t < cr.t - 1 || t.b > cr.b + 1); }).map(n => n.textContent.trim());
      const ellipsis = tokens.filter(n => getComputedStyle(n).textOverflow === 'ellipsis' && n.scrollWidth > n.clientWidth + 1).map(n => n.textContent.trim());
      const delta = card.querySelector('.kpi-delta');
      const subs = card.querySelector('.kpi-subgoals');
      let overlap = 0;
      if (delta && subs) {
        const a = R(delta), b = R(subs);
        overlap = Math.max(0, Math.min(a.r, b.r) - Math.max(a.l, b.l)) * Math.max(0, Math.min(a.b, b.b) - Math.max(a.t, b.t));
      }
      const glyphBox = node => {
        const g = document.createRange();
        g.selectNodeContents(node);
        const r = g.getBoundingClientRect();
        return { l: r.left, t: r.top, r: r.right, b: r.bottom, w: r.width, h: r.height };
      };
      const leaves = [...card.querySelectorAll('.kpi-value, .kpi-title, .kpi-meta > span, .kpi-delta-label, .kpi-delta-num, .kpi-sub-name, .kpi-sub-done, .kpi-sub-target, .kpi-sub-pct, .kpi-sub-flag')];
      const glyphHits = [];
      for (let i = 0; i < leaves.length; i += 1) {
        for (let j = i + 1; j < leaves.length; j += 1) {
          if (leaves[i].contains(leaves[j]) || leaves[j].contains(leaves[i])) continue;
          const a = glyphBox(leaves[i]);
          const b = glyphBox(leaves[j]);
          if (a.w < 0.5 || b.w < 0.5 || a.h < 0.5 || b.h < 0.5) continue;
          const w = Math.min(a.r, b.r) - Math.max(a.l, b.l);
          const h = Math.min(a.b, b.b) - Math.max(a.t, b.t);
          if (w > 0.5 && h > 0.5) glyphHits.push({ a: leaves[i].textContent.trim(), b: leaves[j].textContent.trim(), area: Math.round(w * h) });
        }
      }
      return {
        kpi: card.dataset.kpi, rect: cr,
        scroll: { sh: card.scrollHeight, ch: card.clientHeight, sw: card.scrollWidth, cw: card.clientWidth },
        title: txt(card.querySelector('.kpi-title')), unit: txt(card.querySelector('.kpi-title .unit')),
        value: txt(card.querySelector('.kpi-value')), target: txt(card.querySelector('.kpi-meta b')),
        metaText: txt(card.querySelector('.kpi-meta')), rate: txt(card.querySelector('.kpi-meta em')),
        deltaLabels: [...card.querySelectorAll('.kpi-delta-label')].map(txt), deltaNums: [...card.querySelectorAll('.kpi-delta-num')].map(txt),
        mainTrack: track(card.querySelector('.kpi-content > .progress-track')),
        subText: subs ? subs.textContent : '',
        rows: [...card.querySelectorAll('.kpi-sub-row')].map(r => ({
          cat: r.dataset.category, name: txt(r.querySelector('.kpi-sub-name')), done: txt(r.querySelector('.kpi-sub-done')),
          target: txt(r.querySelector('.kpi-sub-target')), pct: txt(r.querySelector('.kpi-sub-pct')),
          flag: txt(r.querySelector('.kpi-sub-flag')), track: track(r.querySelector('.progress-track')) })),
        clipped, ellipsis, overlap, glyphHits,
      };
    });
    const pair = document.getElementById('pairRow');
    let storage;
    try { storage = { local: Object.keys(localStorage), session: Object.keys(sessionStorage) }; } catch (e) { storage = { error: String(e) }; }
    const charts = JSON.stringify(Object.entries(window.dashboard.charts).filter(([, c]) => c && c.series)
      .map(([id, c]) => [id, c.series.map(s => [s.type, s.name, String(s.color), JSON.stringify(s.options.data)])]));
    return { unit: window.dashboard.state.unit, theme: window.dashboard.state.theme,
      switchChecked: sw ? sw.getAttribute('aria-checked') : null, switchRole: sw ? sw.getAttribute('role') : null, switchLabel: txt(sw),
      toolbarText: txt(document.getElementById('kpiToolbar')), cards,
      pairDisplay: pair ? getComputedStyle(pair).display : null, storage, charts, cookie: document.cookie, search: location.search };
  });
}

function peerRows(cards) {
  const g = new Map();
  cards.forEach(c => { const k = Math.round(c.rect.t); if (!g.has(k)) g.set(k, []); g.get(k).push(c); });
  return [...g.values()];
}
function assertLayout(tag, s) {
  peerRows(s.cards).forEach((row, i) => {
    const hs = row.map(c => c.rect.h);
    check(Math.max(...hs) - Math.min(...hs) <= 1, `${tag} 第${i + 1}行同行等高`, hs);
  });
  s.cards.forEach(c => {
    check(c.scroll.sh <= c.scroll.ch + 1 && c.scroll.sw <= c.scroll.cw + 1, `${tag} ${c.kpi} 卡内无溢出`, c.scroll);
    check(c.clipped.length === 0 && c.ellipsis.length === 0, `${tag} ${c.kpi} 类别/金额/百分比不截断`, { clipped: c.clipped, ellipsis: c.ellipsis });
    check(c.overlap === 0, `${tag} ${c.kpi} 新增块不压住子目标`, c.overlap);
    check(c.glyphHits.length === 0, `${tag} ${c.kpi} 文字字形互不遮挡`, c.glyphHits);
  });
}
function assertMain(tag, s) {
  check(s.cards.length === 4, `${tag} 四张主卡`, s.cards.length);
  s.cards.forEach(c => {
    const [name, addLabel] = KPIS[c.kpi];
    check(c.title && c.title.startsWith(name) && c.unit === '（万元）', `${tag} ${c.kpi} 名称与万元`, c.title);
    check(/目标/.test(c.metaText) && /占总目标/.test(c.metaText), `${tag} ${c.kpi} 保留目标/占总目标`, c.metaText);
    check(PCT2.test(c.rate) && c.rate === KS.percentText(units(c.value), units(c.target)), `${tag} ${c.kpi} 占总目标 2 位且与主条同口径`, { rate: c.rate, value: c.value, target: c.target });
    const fillExp = KS.fillPercent(units(c.value), units(c.target)) / 100 * c.mainTrack.trackW;
    check(Math.abs(c.mainTrack.fillW - fillExp) <= 0.6, `${tag} ${c.kpi} 主条宽按未舍入比例`, { fillW: c.mainTrack.fillW, fillExp });
    check(ticksOk(c.mainTrack), `${tag} ${c.kpi} 主条 12 等分`, c.mainTrack && c.mainTrack.tickW);
    check(c.deltaLabels[0] === addLabel && c.deltaLabels[1] === '占目标' && PCT1.test(c.deltaNums[1]), `${tag} ${c.kpi} 新增文案与占目标 1 位`, { l: c.deltaLabels, n: c.deltaNums });
  });
}
function assertSubs(tag, s) {
  s.cards.forEach(c => {
    check(c.rows.length === 3 && c.rows.map(r => r.cat).join() === CATS.join() && c.rows.map(r => r.name).join() === CATS.join(), `${tag} ${c.kpi} 三行顺序`, c.rows.map(r => r.name));
    const doneSum = c.rows.reduce((a, r) => (a === null || units(r.done) === null ? null : a + units(r.done)), 0n);
    const targetSum = c.rows.reduce((a, r) => (a === null || units(r.target) === null ? null : a + units(r.target)), 0n);
    check(doneSum !== null && doneSum === units(c.value), `${tag} ${c.kpi} 三行完成额之和 = 主完成额`, { rows: c.rows.map(r => r.done), main: c.value });
    check(targetSum !== null && targetSum === units(c.target), `${tag} ${c.kpi} 三行目标额之和 = 主目标额`, { rows: c.rows.map(r => r.target), main: c.target });
    c.rows.forEach(r => {
      check(r.pct === KS.percentText(units(r.done), units(r.target)) && ticksOk(r.track), `${tag} ${c.kpi} ${r.cat} 百分比与 12 段`, { pct: r.pct, segs: r.track && r.track.segs });
      const fillExp = KS.fillPercent(units(r.done), units(r.target)) / 100 * r.track.trackW;
      check(Math.abs(r.track.fillW - fillExp) <= 0.6, `${tag} ${c.kpi} ${r.cat} 子条宽按未舍入比例`, { fillW: r.track.fillW, fillExp });
    });
    check(!/当月新增|上月新增|占目标/.test(c.subText), `${tag} ${c.kpi} 子行无新增/占目标文案`, c.subText);
  });
}

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 1 });
  await page.goto(FILE);
  await page.waitForFunction(() => document.body.dataset.ready === 'true');

  // AC3/AC7：进入页面
  const s0 = await snap(page);
  check(s0.switchChecked === 'false' && s0.switchRole === 'switch' && s0.switchLabel === '显示子目标', 'AC3 进入页面开关为关', { c: s0.switchChecked, l: s0.switchLabel });
  check(/仅演示、非业务默认/.test(s0.toolbarText || ''), '演示权重标明「仅演示、非业务默认」', s0.toolbarText);
  check(s0.cards.every(c => c.rows.length === 0 && !c.subText), 'AC3 关闭时无子行', null);
  assertMain('AC5/AC7 关态 1440', s0);
  await page.screenshot({ path: path.join(OUT, 'kpi-off-1440.png'), clip: { x: 0, y: 0, width: 1440, height: 520 } });

  // AC1/AC2/AC3：打开并遍历 13 组织
  await setSwitch(page, true);
  const s1 = await snap(page);
  check(s1.charts === s0.charts, 'AC5 开关不改 Highcharts 系列', null);
  check(JSON.stringify(s1.storage) === JSON.stringify(s0.storage) && s1.cookie === s0.cookie && s1.search === s0.search, 'AC3 开关不写持久化', { s0: s0.storage, s1: s1.storage });
  await page.screenshot({ path: path.join(OUT, 'kpi-on-1440.png'), clip: { x: 0, y: 0, width: 1440, height: 760 } });
  for (const unit of UNITS) {
    await setUnit(page, unit);
    const s = await snap(page);
    check(s.switchChecked === 'true', `AC3 ${unit} 切换后开关保持`, s.switchChecked);
    assertMain(`AC7 ${unit}`, s);
    assertSubs(`AC1/AC2 ${unit}`, s);
    assertLayout(`AC6 ${unit} 1440`, s);
    if (unit !== '全部板块') check(s.pairDisplay === 'none', `AC6 ${unit} 成对模块整块隐藏`, s.pairDisplay);
    if (unit === 'SAS170 PMC板块' || unit === 'SAS530 银川中心') {
      await page.screenshot({ path: path.join(OUT, `kpi-on-${unit.split(' ')[0]}.png`), clip: { x: 0, y: 0, width: 1440, height: 760 } });
    }
  }
  await setUnit(page, '全部板块');

  // AC6：变窄重排、展开/收起
  for (const w of WIDTHS) {
    await page.setViewportSize({ width: w, height: 1000 });
    await setSwitch(page, false);
    await page.waitForTimeout(150);
    const off = await snap(page);
    assertLayout(`AC6 关 ${w}`, off);
    await setSwitch(page, true);
    await page.waitForTimeout(150);
    const on = await snap(page);
    assertLayout(`AC6 开 ${w}`, on);
    assertSubs(`AC2 开 ${w}`, on);
    await page.screenshot({ path: path.join(OUT, `kpi-on-${w}.png`), fullPage: false });
    await setSwitch(page, false);
    await page.waitForTimeout(150);
    const back = await snap(page);
    const dh = back.cards.map((c, i) => Math.abs(c.rect.h - off.cards[i].rect.h));
    check(Math.max(...dh) <= 0.5 && back.cards.every(c => c.rows.length === 0), `AC6 收起回到紧凑高度 ${w}`, dh);
    await setSwitch(page, true);
  }
  await setUnit(page, 'SAS530 银川中心');
  await page.setViewportSize({ width: 312, height: 1000 });
  await page.waitForTimeout(150);
  assertLayout('AC6 叶子 312', await snap(page));
  await setUnit(page, '全部板块');
  await page.setViewportSize({ width: 312, height: 1000 });
  for (const unit of UNITS) {
    await setUnit(page, unit);
    await setSwitch(page, false);
    await page.waitForTimeout(80);
    const off = await snap(page);
    assertLayout(`AC6 关 ${unit} 312`, off);
    assertMain(`AC7 关 ${unit} 312`, off);
    check(off.cards.every(c => c.rows.length === 0 && !c.subText), `AC3 ${unit} 312 收起无子行空位`, off.cards.map(c => c.rows.length));
    await setSwitch(page, true);
    await page.waitForTimeout(80);
    const on = await snap(page);
    assertLayout(`AC6 开 ${unit} 312`, on);
    assertMain(`AC7 开 ${unit} 312`, on);
    assertSubs(`AC1 开 ${unit} 312`, on);
  }
  await setUnit(page, '全部板块');
  await page.setViewportSize({ width: 312, height: 2200 });
  await setSwitch(page, false);
  await page.locator('#kpiGrid').screenshot({ path: path.join(OUT, 'kpi-off-312.png') });
  await setSwitch(page, true);
  await page.locator('#kpiGrid').screenshot({ path: path.join(OUT, 'kpi-on-312.png') });
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.waitForTimeout(150);

  // AC5/AC7：主题跟随
  const themes = await page.evaluate(() => Object.fromEntries(Object.entries(window.dashboard.THEMES).map(([k, v]) => [k, { primary: v.primary, track: v.track }])));
  for (const [name, t] of Object.entries(themes)) {
    await setTheme(page, name);
    const s = await snap(page);
    const tracks = s.cards.flatMap(c => [c.mainTrack, ...c.rows.map(r => r.track)]);
    check(tracks.every(tr => tr.fillBg.includes(rgb(t.primary)) && (!t.track || tr.trackBg === rgb(t.track))), `AC5 主题 ${name} 主条/子条跟随`, tracks[0]);
    await page.screenshot({ path: path.join(OUT, `kpi-theme-${name}.png`), clip: { x: 0, y: 0, width: 1440, height: 760 } });
  }
  await setTheme(page, 'blue');

  // AC4/AC5：「仅测试」夹具注入真实卡片
  const fx = await page.evaluate(() => {
    const KSx = window.KpiSubgoals;
    const host = document.querySelector('#kpiGrid > .kpi-card .kpi-content');
    const box = document.createElement('div');
    box.id = 'fixtureBox';
    box.innerHTML = KSx.subRowsHtml('仅测试', [
      KSx.rowView('EPC', { done: 1323n, target: 10000n }),
      KSx.rowView('PMC', { done: 11568n, target: 10000n }),
      KSx.rowView('设计及咨询', { done: 0n, target: 5000n }),
    ]) + KSx.subRowsHtml('仅测试', [
      KSx.rowView('EPC', { done: 0n, target: 0n }),
      KSx.rowView('PMC', null),
      KSx.rowView('设计及咨询', { done: null, target: 0n }),
    ]);
    host.appendChild(box);
    host.querySelector(':scope > .progress-track').outerHTML = KSx.trackHtml(KSx.fillPercent(1323n, 10000n), '仅测试 主条');
    const m = host.querySelector(':scope > .progress-track');
    const read = el => ({ cat: el.dataset.category, done: el.querySelector('.kpi-sub-done').textContent, target: el.querySelector('.kpi-sub-target').textContent,
      pct: el.querySelector('.kpi-sub-pct').textContent, flag: el.querySelector('.kpi-sub-flag') ? el.querySelector('.kpi-sub-flag').textContent : null,
      missing: el.dataset.missing === 'true', trackW: el.querySelector('.progress-track').getBoundingClientRect().width,
      fillW: el.querySelector('.seg12-fill').getBoundingClientRect().width });
    return { rows: [...box.querySelectorAll('.kpi-sub-row')].map(read),
      main: { trackW: m.getBoundingClientRect().width, fillW: m.querySelector('.seg12-fill').getBoundingClientRect().width } };
  });
  await page.screenshot({ path: path.join(OUT, 'fixture-test-only.png'), clip: { x: 0, y: 0, width: 1440, height: 900 } });
  const inSeg2 = b => { const seg = b.trackW / 12; return b.fillW > seg + 0.5 && b.fillW < 2 * seg - 0.5 && Math.abs(b.fillW / b.trackW - 0.1323) <= 0.6 / b.trackW + 1e-3; };
  const [r1323, r11568, rZero, rNoTgt, rMiss, rMissNoTgt] = fx.rows;
  check(r1323.pct === '13.23%' && inSeg2(r1323), 'AC5 仅测试 13.23% 子条落第 2 段内部', r1323);
  check(inSeg2(fx.main), 'AC5 仅测试 13.23% 主条落第 2 段内部', fx.main);
  check(r11568.pct === '115.68%' && Math.abs(r11568.fillW - r11568.trackW) <= 0.5, 'AC4 仅测试 115.68% 满条且文字照实', r11568);
  check(rZero.done === '0.00' && rZero.pct === '0.00%' && rZero.fillW === 0 && !rZero.flag && !rZero.missing, 'AC4 有效完成额 0', rZero);
  check(rNoTgt.target === '0.00' && rNoTgt.pct === '—' && rNoTgt.flag === '无目标' && rNoTgt.fillW === 0, 'AC4 目标 0 无目标', rNoTgt);
  check(rMiss.done === '—' && rMiss.target === '—' && rMiss.pct === '—' && !rMiss.flag && rMiss.fillW === 0 && rMiss.missing, 'AC4 缺失不补 0', rMiss);
  check(rMissNoTgt.flag === '无目标' && rMissNoTgt.pct === '—' && rMissNoTgt.missing, 'AC4 缺失且目标已知为 0', rMissNoTgt);
  check(units(rMiss.done) === null, 'AC4 缺失行不能参与合计判通过', rMiss.done);

  // AC4：主卡目标展示为 0.00 时，主条与三行都按无目标。改的是内存里的演示数，刷新会回到文件原值。
  await page.evaluate(() => {
    window.dashboard.DEMO_DATA.current.contract = 0;
    window.dashboard.METRICS.contract.target = 0;
  });
  await setUnit(page, 'SAS170 PMC板块');
  await setSwitch(page, true);
  const zeroMain = await page.evaluate(() => {
    const card = document.querySelector('[data-kpi="contract"]');
    const rowOf = r => ({
      cat: r.dataset.category,
      done: r.querySelector('.kpi-sub-done').textContent.trim(),
      target: r.querySelector('.kpi-sub-target').textContent.trim(),
      pct: r.querySelector('.kpi-sub-pct').textContent.trim(),
      flag: r.querySelector('.kpi-sub-flag') ? r.querySelector('.kpi-sub-flag').textContent.trim() : null,
      fill: r.querySelector('.seg12-fill').getBoundingClientRect().width,
    });
    return {
      value: card.querySelector('.kpi-value').textContent.trim(),
      target: card.querySelector('.kpi-meta b').textContent.trim(),
      rate: card.querySelector('.kpi-meta em').textContent.trim(),
      flag: card.querySelector('.kpi-meta .kpi-sub-flag') ? card.querySelector('.kpi-meta .kpi-sub-flag').textContent.trim() : null,
      fill: card.querySelector('.kpi-content > .progress-track .seg12-fill').getBoundingClientRect().width,
      rows: [...card.querySelectorAll('.kpi-sub-row')].map(rowOf),
      addShare: card.querySelectorAll('.kpi-delta-num')[1].textContent.trim(),
    };
  });
  check(zeroMain.value === '0.00' && zeroMain.target === '0.00' && zeroMain.rate === '—' && zeroMain.flag === '无目标' && zeroMain.fill === 0, 'AC4 主卡目标 0：— / 无目标 / 空条', zeroMain);
  check(zeroMain.rows.map(r => r.cat).join() === CATS.join() && zeroMain.rows.every(r => r.done === '0.00' && r.target === '0.00' && r.pct === '—' && r.flag === '无目标' && r.fill === 0), 'AC4 SAS170 主目标 0 时三行仍是 EPC/PMC/设计及咨询且都无目标', zeroMain.rows);
  check(zeroMain.addShare === '—', 'AC4 主目标 0 时占目标不做除法', zeroMain.addShare);
  await page.click('[data-kpi="contract"] .kpi-title');
  await page.waitForFunction(() => document.getElementById('detailDialog').open);
  const dialogBits = await page.evaluate(() => document.getElementById('dialogContent').innerText);
  check(/目标达成率\s*—/.test(dialogBits) && !dialogBits.includes('∞') && !dialogBits.includes('NaN'), 'AC4 主目标 0 时明细达成率不做除法', dialogBits.slice(0, 240));

  // AC3：刷新复位
  await page.reload();
  await page.waitForFunction(() => document.body.dataset.ready === 'true');
  const s9 = await snap(page);
  check(s9.switchChecked === 'false' && s9.cards.every(c => c.rows.length === 0), 'AC3 刷新后恢复为关', s9.switchChecked);

  await browser.close();
  const verdict = fails.length ? 'FAIL' : 'PASS';
  fs.writeFileSync(path.join(OUT, 'probe-result.json'), JSON.stringify({ file: FILE, verdict, fails, results }, null, 2));
  console.log('verdict=' + verdict + ' pass=' + (results.length - fails.length) + ' fail=' + fails.length);
  process.exit(fails.length ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
