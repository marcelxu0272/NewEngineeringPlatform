/**
 * Max 壳层探针。组织选项只用真实键盘，并确认活动项仍挂在 document 上。
 * 前置：http://127.0.0.1:3000/operations-dashboard-202610/board
 * 运行：node docs/evidence/2026-11-09-kpi-subgoals-12seg/max-shell-probe.cjs
 */
'use strict';

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const O = require('./max-oracle.cjs');

const OUT = __dirname;
const URL = process.env.BOARD_URL || 'http://127.0.0.1:3000/operations-dashboard-202610/board';
const SRC = fs.readFileSync(path.resolve('public/operations-dashboard-202610/index.html'), 'utf8');
const results = [];
const fails = [];

function check(ac, ok, name, detail) {
  const row = { ac, name, ok: !!ok, detail: detail == null ? null : detail };
  results.push(row);
  if (!ok) {
    fails.push(row);
    console.log('FAIL  [' + ac + '] ' + name + '  ' + JSON.stringify(detail).slice(0, 500));
  } else console.log('PASS  [' + ac + '] ' + name);
}

function parsePageWeights(src) {
  const m = src.match(/const DEMO_SUBGOAL_WEIGHTS = \{([\s\S]*?)\n  \};/);
  const out = {};
  for (const key of Object.keys(O.KPI_META)) {
    const line = m[1].match(new RegExp(key + ':\\{done:\\[([^\\]]+)\\],target:\\[([^\\]]+)\\]\\}'));
    out[key] = {
      done: line[1].split(',').map(s => Number(s.trim())),
      target: line[2].split(',').map(s => Number(s.trim())),
    };
  }
  return out;
}
const WEIGHTS = parsePageWeights(SRC);

const opsFrame = page => page.frames().find(f => /operations-dashboard-202610\/index\.html/.test(f.url()));
async function ready(page) {
  await page.waitForFunction(() => [...document.querySelectorAll('iframe')].some(f => /index\.html/.test(f.src)));
  const frame = opsFrame(page);
  await frame.waitForFunction(() => document.body.dataset.ready === 'true' && document.getElementById('kpiSubgoalSwitch'));
  return frame;
}

async function pickUnit(page, frame, unit) {
  const select = page.getByTestId('shell-unit-select');
  await select.click();
  const dropdown = page.locator('.ant-select-dropdown:not(.ant-select-dropdown-hidden)').last();
  await dropdown.waitFor({ state: 'visible' });
  for (let i = 0; i < O.UNITS.length + 2; i += 1) await page.keyboard.press('ArrowUp');
  let picked = null;
  for (let i = 0; i < O.UNITS.length + 2; i += 1) {
    const active = dropdown.locator('.ant-select-item-option-active');
    const info = await active.evaluateAll(els => els.slice(0, 1).map(el => ({
      title: el.getAttribute('title'),
      connected: el.isConnected,
      inDocument: el.isConnected && document.documentElement.contains(el),
    })));
    if (!info.length || !info[0].inDocument) {
      throw new Error('活动选项不在 DOM 中，拒绝用脱 DOM 的虚拟项：' + JSON.stringify(info));
    }
    if (info[0].title === unit) {
      await page.keyboard.press('Enter');
      picked = info[0];
      break;
    }
    await page.keyboard.press('ArrowDown');
    await page.waitForTimeout(30);
  }
  if (!picked) throw new Error('键盘未能选中 ' + unit);
  await frame.waitForFunction(u => window.dashboard.state.unit === u, unit);
  await page.waitForTimeout(120);
  return picked;
}

async function measure(frame) {
  return frame.evaluate(() => {
    const txt = el => (el ? el.textContent.trim() : null);
    const glyph = node => {
      const g = document.createRange();
      g.selectNodeContents(node);
      const r = g.getBoundingClientRect();
      return { l: r.left, t: r.top, r: r.right, b: r.bottom, w: r.width, h: r.height };
    };
    const cards = [...document.querySelectorAll('#kpiGrid > .kpi-card')].map(card => {
      const cr = card.getBoundingClientRect();
      const leaves = [...card.querySelectorAll('.kpi-value, .kpi-title, .kpi-delta-label, .kpi-delta-num, .kpi-sub-name, .kpi-sub-done, .kpi-sub-target, .kpi-sub-pct, .kpi-sub-flag')];
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
          if (w > 0.5 && h > 0.5) glyphHits.push({ a: a.node.textContent.trim().slice(0, 20), b: b.node.textContent.trim().slice(0, 20) });
        }
      }
      const mainEl = document.getElementById('main');
      const prev = mainEl.scrollTop;
      card.scrollIntoView({ block: 'center', inline: 'nearest' });
      const appR = document.querySelector('.app').getBoundingClientRect();
      const clipped = [];
      for (const node of leaves) {
        const b = glyph(node);
        if (b.w < 0.5 || b.h < 0.5) continue;
        if (b.t < appR.top - 1 || b.b > appR.bottom + 1 || b.l < appR.left - 1 || b.r > appR.right + 1) {
          clipped.push(node.textContent.trim().slice(0, 24));
        }
      }
      mainEl.scrollTop = prev;
      return {
        kpi: card.dataset.kpi,
        h: cr.height,
        t: cr.top,
        w: cr.width,
        value: txt(card.querySelector('.kpi-value')),
        target: txt(card.querySelector('.kpi-meta b')),
        rate: txt(card.querySelector('.kpi-meta em')),
        title: txt(card.querySelector('.kpi-title')),
        unitLabel: txt(card.querySelector('.kpi-title .unit')),
        deltaLabels: [...card.querySelectorAll('.kpi-delta-label')].map(txt),
        deltaNums: [...card.querySelectorAll('.kpi-delta-num')].map(txt),
        rows: [...card.querySelectorAll('.kpi-sub-row')].map(r => ({
          cat: r.dataset.category,
          name: txt(r.querySelector('.kpi-sub-name')),
          done: txt(r.querySelector('.kpi-sub-done')),
          target: txt(r.querySelector('.kpi-sub-target')),
          pct: txt(r.querySelector('.kpi-sub-pct')),
        })),
        segs: [...card.querySelectorAll('.progress-track')].map(el => el.querySelectorAll('.seg12-ticks > b').length),
        glyphHits: glyphHits.slice(0, 4),
        clipped: clipped.slice(0, 4),
        overflow: card.scrollHeight > card.clientHeight + 1 || card.scrollWidth > card.clientWidth + 1,
      };
    });
    const visible = el => {
      const s = getComputedStyle(el);
      const r = el.getBoundingClientRect();
      return s.display !== 'none' && r.width > 0 && r.height > 0;
    };
    const rowsOf = sel => {
      const groups = [];
      [...document.querySelectorAll(sel)].filter(visible).forEach(el => {
        const r = el.getBoundingClientRect();
        const top = Math.round(r.top);
        let row = groups.find(g => Math.abs(g.top - top) <= 3);
        if (!row) { row = { top, h: [] }; groups.push(row); }
        row.h.push(Math.round(r.height * 10) / 10);
      });
      return groups.map(row => ({ n: row.h.length, delta: Math.round((Math.max(...row.h) - Math.min(...row.h)) * 10) / 10, h: row.h }));
    };
    const pair = document.getElementById('pairRow');
    const note = document.getElementById('targetNote');
    const prev = pair.previousElementSibling;
    const next = pair.nextElementSibling;
    return {
      unit: window.dashboard.state.unit,
      theme: window.dashboard.state.theme,
      checked: document.getElementById('kpiSubgoalSwitch').getAttribute('aria-checked'),
      show: window.dashboard.state.showSubgoals,
      noteText: txt(document.getElementById('kpiToolbar')),
      cards,
      iframeW: document.documentElement.clientWidth,
      cash: rowsOf('.cash-metric'),
      pairRows: getComputedStyle(pair).display === 'none' ? [] : rowsOf('#pairRow > .panel'),
      noteClip: !!(note && note.scrollWidth > note.clientWidth + 1),
      pairDisplay: getComputedStyle(pair).display,
      pairOffset: pair.offsetHeight,
      pairGap: prev && next ? Math.round((next.getBoundingClientRect().top - prev.getBoundingClientRect().bottom) * 10) / 10 : null,
      chartN: Object.values(window.dashboard.charts).filter(c => c && c.container && c.container.classList.contains('highcharts-container')).length,
      chartSig: Object.entries(window.dashboard.charts).filter(([, c]) => c && c.series).map(([id, c]) => [id, c.series.map(s => s.type + ':' + s.name + ':' + s.color)]),
    };
  });
}

function assertMoney(tag, m) {
  const groups = [];
  m.cards.forEach(c => {
    let g = groups.find(row => Math.abs(row.t - c.t) <= 3);
    if (!g) { g = { t: c.t, h: [] }; groups.push(g); }
    g.h.push(c.h);
  });
  groups.forEach((g, i) => {
    const delta = Math.max(...g.h) - Math.min(...g.h);
    check('AC6', g.h.length < 2 || delta <= 1, tag + ' KPI 第' + (i + 1) + '行等高', { delta, h: g.h });
  });
  m.cards.forEach(c => {
    const done = O.parseUnits(c.value);
    const target = O.parseUnits(c.target);
    const [name, addLabel] = O.KPI_META[c.kpi];
    check('AC7', c.title.startsWith(name) && c.unitLabel === '（万元）', tag + ' ' + c.kpi + ' 名称', c.title);
    check('AC7', c.rate === O.percentText(done, target), tag + ' ' + c.kpi + ' 占总目标', { rate: c.rate, exp: O.percentText(done, target) });
    check('AC7', c.deltaLabels[0] === addLabel && c.deltaLabels[1] === '占目标', tag + ' ' + c.kpi + ' 新增文案', c.deltaLabels);
    check('AC1', c.rows.map(r => r.name).join() === O.CATEGORIES.join(), tag + ' ' + c.kpi + ' 三行', c.rows.map(r => r.name));
    const expD = O.allocate(done, WEIGHTS[c.kpi].done);
    const expT = O.allocate(target, WEIGHTS[c.kpi].target);
    let sd = 0n;
    let st = 0n;
    c.rows.forEach((r, i) => {
      const rd = O.parseUnits(r.done);
      const rt = O.parseUnits(r.target);
      sd += rd;
      st += rt;
      check('AC2', rd === expD[i] && rt === expT[i], tag + ' ' + c.kpi + ' ' + r.cat + ' 逐行 0.01 万元', { done: r.done, target: r.target, expD: O.formatUnits(expD[i]), expT: O.formatUnits(expT[i]) });
      check('AC5', r.pct === O.percentText(rd, rt), tag + ' ' + c.kpi + ' ' + r.cat + ' 百分比', { pct: r.pct, exp: O.percentText(rd, rt) });
    });
    check('AC2', sd === done && st === target, tag + ' ' + c.kpi + ' 合计', { sd: sd.toString(), st: st.toString() });
    check('AC5', c.segs.length === 4 && c.segs.every(n => n === 12), tag + ' ' + c.kpi + ' 主条加三子条都是 12 段', c.segs);
    check('AC6', !c.overflow && c.glyphHits.length === 0 && c.clipped.length === 0, tag + ' ' + c.kpi + ' 无裁切无字形遮挡', { overflow: c.overflow, glyphHits: c.glyphHits, clipped: c.clipped });
    if (m.unit === 'SAS170 PMC板块') check('AC1', c.rows.some(r => r.name === 'PMC'), tag + ' 组织 PMC 与业务 PMC 并存', m.unit);
  });
  if (m.unit !== '全部板块') {
    check('AC6', m.pairDisplay === 'none' && m.pairOffset === 0 && m.pairGap < 40, tag + ' 叶子两块隐藏且不留洞', { display: m.pairDisplay, offset: m.pairOffset, gap: m.pairGap });
  }
}

(async () => {
  const browser = await chromium.launch({ channel: 'chrome', args: ['--no-sandbox', '--disable-dev-shm-usage'] });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  await page.goto(URL, { waitUntil: 'networkidle' });
  let frame = await ready(page);
  let m = await measure(frame);
  const chartBefore = JSON.stringify(m.chartSig);
  check('AC3', m.checked === 'false' && m.show === false && m.cards.every(c => c.rows.length === 0), '壳进入时开关关且无子行', { checked: m.checked, rows: m.cards.map(c => c.rows.length) });
  check('规格', /仅演示、非业务默认/.test(m.noteText || ''), '壳上可见仅演示标记', m.noteText);
  check('AC5', m.chartN >= 4, '进入时 Highcharts 容器仍在', m.chartN);
  await page.screenshot({ path: path.join(OUT, 'max-shell-off-1440.png') });

  await frame.click('#kpiSubgoalSwitch');
  await frame.waitForFunction(() => document.getElementById('kpiSubgoalSwitch').getAttribute('aria-checked') === 'true');
  m = await measure(frame);
  check('AC5', JSON.stringify(m.chartSig) === chartBefore, '壳内打开开关不改 Highcharts 系列');
  await page.screenshot({ path: path.join(OUT, 'max-shell-on-1440.png') });

  for (const unit of O.UNITS) {
    const picked = await pickUnit(page, frame, unit);
    check('AC3', picked.inDocument === true && picked.title === unit, '真实键盘选中且选项仍在 DOM ' + unit, picked);
    m = await measure(frame);
    check('AC3', m.checked === 'true' && m.unit === unit, unit + ' 开关在组织切换后保持', { checked: m.checked, unit: m.unit });
    assertMoney('壳 ' + unit, m);
    if (unit === 'SAS170 PMC板块') await frame.locator('#kpiGrid').screenshot({ path: path.join(OUT, 'max-shell-sas170.png') });
    if (unit === 'SAS530 银川中心') await page.screenshot({ path: path.join(OUT, 'max-shell-leaf.png') });
  }

  await pickUnit(page, frame, '全部板块');
  await page.setViewportSize({ width: 760, height: 1000 });
  await page.waitForTimeout(400);
  m = await measure(frame);
  check('AC6', m.iframeW >= 280 && m.iframeW <= 360, '壳 760 时 iframe 内容宽在 312px 附近', m.iframeW);
  assertMoney('壳760', m);
  await page.screenshot({ path: path.join(OUT, 'max-shell-760.png') });
  await frame.locator('#kpiGrid').screenshot({ path: path.join(OUT, 'max-shell-kpi-760.png') });
  await frame.locator('[data-kpi="receipt"]').scrollIntoViewIfNeeded();
  await frame.locator('[data-kpi="receipt"]').screenshot({ path: path.join(OUT, 'max-shell-760-receipt.png') });

  await page.setViewportSize({ width: 780, height: 900 });
  await page.waitForTimeout(400);
  m = await measure(frame);
  check('AC3', m.unit === '全部板块' && m.checked === 'true', '780 前已用真实键盘回到全部板块', { unit: m.unit, checked: m.checked });
  check('AC6', m.iframeW >= 280 && m.iframeW <= 380, '壳 780 时 iframe 内容宽在 312px 附近', m.iframeW);
  check('11-06补测', m.cash.every(r => r.n < 2 || r.delta <= 1), '780 现金流同行仍对齐', m.cash);
  check('11-06补测', m.pairRows.length === 0 || m.pairRows.every(r => r.n < 2 || r.delta <= 1), '780 成对模块对齐或已重排', m.pairRows);
  check('11-06补测', !m.noteClip, '780 目标说明不截断', m.noteClip);
  assertMoney('壳780', m);
  await page.screenshot({ path: path.join(OUT, 'max-shell-780.png') });
  await frame.locator('#kpiGrid').screenshot({ path: path.join(OUT, 'max-shell-kpi-780.png') });
  await frame.locator('[data-kpi="receipt"]').scrollIntoViewIfNeeded();
  await frame.locator('[data-kpi="receipt"]').screenshot({ path: path.join(OUT, 'max-shell-780-receipt.png') });

  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.waitForTimeout(400);
  m = await measure(frame);
  check('AC6', m.checked === 'true', '拉回桌面后开关仍开', m.checked);
  assertMoney('壳拉回1440', m);
  await page.screenshot({ path: path.join(OUT, 'max-shell-back-1440.png') });

  const themeSelect = page.getByLabel('主题颜色').first();
  for (const label of ['暖棕主题', '青绿主题', '深蓝主题']) {
    await themeSelect.click();
    const dropdown = page.locator('.ant-select-dropdown:not(.ant-select-dropdown-hidden)').last();
    await dropdown.waitFor({ state: 'visible' });
    for (let i = 0; i < 4; i += 1) await page.keyboard.press('ArrowUp');
    let got = false;
    for (let i = 0; i < 6; i += 1) {
      const active = dropdown.locator('.ant-select-item-option-active');
      const info = await active.evaluateAll(els => els.slice(0, 1).map(el => ({
        title: el.getAttribute('title') || el.textContent.trim(),
        inDocument: el.isConnected && document.documentElement.contains(el),
      })));
      if (!info.length || !info[0].inDocument) throw new Error('主题选项脱离 DOM');
      if (info[0].title.includes(label.replace('主题', ''))) {
        await page.keyboard.press('Enter');
        got = true;
        break;
      }
      await page.keyboard.press('ArrowDown');
      await page.waitForTimeout(40);
    }
    if (!got) throw new Error('键盘未能选中主题 ' + label);
    const expectTheme = label.startsWith('暖棕') ? 'wood' : label.startsWith('青绿') ? 'teal' : 'blue';
    await frame.waitForFunction(t => window.dashboard.state.theme === t, expectTheme);
    m = await measure(frame);
    check('AC7', m.theme === expectTheme && m.checked === 'true', '壳主题 ' + label + ' 后开关仍保持', m.theme);
    if (expectTheme !== 'blue') await page.screenshot({ path: path.join(OUT, 'max-shell-theme-' + expectTheme + '.png') });
  }

  await page.reload({ waitUntil: 'networkidle' });
  frame = await ready(page);
  m = await measure(frame);
  check('AC3', m.checked === 'false' && m.show === false && m.cards.every(c => c.rows.length === 0), '壳刷新后开关回到关', { checked: m.checked, show: m.show });
  check('AC7', m.theme === 'blue', '壳刷新后主题回到默认蓝', m.theme);
  await page.screenshot({ path: path.join(OUT, 'max-shell-refresh-off.png') });

  await browser.close();
  const byAc = {};
  for (const row of results) {
    if (!byAc[row.ac]) byAc[row.ac] = { pass: 0, fail: 0 };
    byAc[row.ac][row.ok ? 'pass' : 'fail'] += 1;
  }
  const verdict = fails.length ? 'FAIL' : 'PASS';
  fs.writeFileSync(path.join(OUT, 'max-shell-result.json'), JSON.stringify({
    url: URL,
    verdict,
    byAc,
    failCount: fails.length,
    passCount: results.length - fails.length,
    fails,
    note: '组织与主题都用键盘选择，活动项必须 isConnected 且在 document 中。未点击可能被虚拟列表卸掉的 option。',
  }, null, 2));
  console.log('verdict=' + verdict + ' pass=' + (results.length - fails.length) + ' fail=' + fails.length);
  process.exit(fails.length ? 1 : 0);
})().catch(err => {
  console.error(err);
  process.exit(2);
});
