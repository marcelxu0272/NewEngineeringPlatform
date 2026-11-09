/**
 * 四 KPI 子目标 · Board 壳层探针（实现侧自测，不是 Max 独立验收）
 * 前置：npm run dev，页面在 http://127.0.0.1:3000/operations-dashboard-202610/board
 * 运行：node docs/evidence/2026-11-09-ops-kpi-subgoals/shell-probe.cjs
 * 组织切换走壳上真实 antd 下拉，由壳 postMessage 进 iframe。
 */
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const OUT = __dirname;
const URL = 'http://127.0.0.1:3000/operations-dashboard-202610/board';
const UNITS = ['全部板块', 'SAS170 PMC板块', 'SAS610 咨询板块', 'SAS680 数字技术板块', 'SAS650 新材料板块',
  'SAS710 生命科学板块', 'SAS690 COII板块', 'SAS720 模块化板块', 'SAS670 供应链板块',
  'SAS520 金山中心', 'SAS560 沈阳中心', 'SAS550 惠湛中心', 'SAS530 银川中心'];
const results = [];
const fails = [];
const check = (ok, name, detail) => {
  const row = { name, ok: !!ok, detail: detail == null ? null : detail };
  results.push(row);
  if (!ok) fails.push(row);
  console.log((ok ? 'PASS' : 'FAIL') + '  ' + name + (!ok && detail != null ? '  ' + JSON.stringify(detail) : ''));
};
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
  for (let i = 0; i < UNITS.length + 1; i += 1) await page.keyboard.press('ArrowUp');
  let picked = false;
  for (let i = 0; i < UNITS.length + 1; i += 1) {
    const active = dropdown.locator('.ant-select-item-option-active');
    const title = (await active.count()) ? await active.first().getAttribute('title') : '';
    if (title === unit) {
      await page.keyboard.press('Enter');
      picked = true;
      break;
    }
    await page.keyboard.press('ArrowDown');
    await page.waitForTimeout(40);
  }
  if (!picked) throw new Error('键盘未能选中组织板块 ' + unit);
  await frame.waitForFunction(u => window.dashboard.state.unit === u, unit);
  await page.waitForTimeout(150);
}
const measure = frame => frame.evaluate(() => {
  const cards = [...document.querySelectorAll('#kpiGrid > .kpi-card')];
  const rows = new Map();
  cards.forEach(c => {
    const r = c.getBoundingClientRect();
    const k = Math.round(r.top);
    if (!rows.has(k)) rows.set(k, []);
    rows.get(k).push(r.height);
  });
  const textOut = (card) => {
    const host = card.getBoundingClientRect();
    return [...card.querySelectorAll('.kpi-sub-name, .kpi-sub-amount, .kpi-sub-pct, .kpi-value, .kpi-meta em')].filter(n => {
      const g = document.createRange();
      g.selectNodeContents(n);
      const b = g.getBoundingClientRect();
      return b.width > 0 && (b.left < host.left - 1 || b.right > host.right + 1);
    }).map(n => n.textContent.trim());
  };
  const glyphBox = node => {
    const g = document.createRange();
    g.selectNodeContents(node);
    const r = g.getBoundingClientRect();
    return { l: r.left, t: r.top, r: r.right, b: r.bottom, w: r.width, h: r.height };
  };
  const glyphHits = [];
  cards.forEach(card => {
    const leaves = [...card.querySelectorAll('.kpi-value, .kpi-title, .kpi-meta > span, .kpi-delta-label, .kpi-delta-num, .kpi-sub-name, .kpi-sub-done, .kpi-sub-target, .kpi-sub-pct, .kpi-sub-flag')];
    for (let i = 0; i < leaves.length; i += 1) {
      for (let j = i + 1; j < leaves.length; j += 1) {
        if (leaves[i].contains(leaves[j]) || leaves[j].contains(leaves[i])) continue;
        const a = glyphBox(leaves[i]);
        const b = glyphBox(leaves[j]);
        if (a.w < 0.5 || b.w < 0.5 || a.h < 0.5 || b.h < 0.5) continue;
        const w = Math.min(a.r, b.r) - Math.max(a.l, b.l);
        const h = Math.min(a.b, b.b) - Math.max(a.t, b.t);
        if (w > 0.5 && h > 0.5) glyphHits.push({ kpi: card.dataset.kpi, a: leaves[i].textContent.trim(), b: leaves[j].textContent.trim(), area: Math.round(w * h) });
      }
    }
  });
  const visible = (el) => {
    const s = getComputedStyle(el);
    const r = el.getBoundingClientRect();
    return s.display !== 'none' && r.width > 0 && r.height > 0;
  };
  const rowsOf = (sel) => {
    const groups = [];
    [...document.querySelectorAll(sel)].filter(visible).forEach((el) => {
      const r = el.getBoundingClientRect();
      const top = Math.round(r.top);
      let row = groups.find((g) => Math.abs(g.top - top) <= 3);
      if (!row) { row = { top, h: [] }; groups.push(row); }
      row.h.push(Math.round(r.height * 10) / 10);
    });
    return groups.map((row) => ({ n: row.h.length, delta: Math.round((Math.max(...row.h) - Math.min(...row.h)) * 10) / 10, h: row.h }));
  };
  const pair = document.getElementById('pairRow');
  const note = document.getElementById('targetNote');
  return {
    unit: window.dashboard.state.unit,
    theme: window.dashboard.state.theme,
    checked: document.getElementById('kpiSubgoalSwitch').getAttribute('aria-checked'),
    subRows: cards.map(c => c.querySelectorAll('.kpi-sub-row').length),
    cats: cards.map(c => [...c.querySelectorAll('.kpi-sub-row')].map(r => r.dataset.category).join(',')),
    peer: [...rows.values()].map(hs => Math.max(...hs) - Math.min(...hs)),
    overflow: cards.filter(c => c.scrollHeight > c.clientHeight + 1 || c.scrollWidth > c.clientWidth + 1).map(c => c.dataset.kpi),
    clipped: cards.flatMap(textOut),
    glyphHits,
    cash: rowsOf('.cash-metric'),
    pairRows: getComputedStyle(pair).display === 'none' ? [] : rowsOf('#pairRow > .panel'),
    noteClip: !!(note && note.scrollWidth > note.clientWidth + 1),
    pair: getComputedStyle(pair).display,
    note: (document.getElementById('kpiToolbar') || {}).innerText || '',
  };
});
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  await page.goto(URL, { waitUntil: 'networkidle' });
  let frame = await ready(page);
  let m = await measure(frame);
  check(m.checked === 'false' && m.subRows.every(n => n === 0), '壳 进入页面开关为关且无子行空内容', m);
  check(/仅演示、非业务默认/.test(m.note), '壳 可见演示标记', m.note);
  await frame.click('#kpiSubgoalSwitch');
  await frame.waitForFunction(() => document.getElementById('kpiSubgoalSwitch').getAttribute('aria-checked') === 'true');
  for (const unit of UNITS) {
    await pickUnit(page, frame, unit);
    m = await measure(frame);
    check(m.checked === 'true' && m.subRows.every(n => n === 3) && m.cats.every(c => c === 'EPC,PMC,设计及咨询'), '壳 ' + unit + ' 开关保持且三行齐全', m);
    check(m.peer.every(d => d <= 1) && m.overflow.length === 0 && m.clipped.length === 0 && m.glyphHits.length === 0, '壳 ' + unit + ' 同行等高且金额类别百分比在卡内、文字互不遮挡', m);
    if (unit !== '全部板块') check(m.pair === 'none', '壳 ' + unit + ' 成对模块整块隐藏', m.pair);
  }
  await pickUnit(page, frame, '全部板块');
  for (const w of [1440, 1024, 760]) {
    await page.setViewportSize({ width: w, height: 1000 });
    await page.waitForTimeout(300);
    m = await measure(frame);
    check(m.peer.every(d => d <= 1) && m.overflow.length === 0 && m.clipped.length === 0 && m.glyphHits.length === 0, '壳 视口 ' + w + ' 展开同行等高无裁切、文字互不遮挡', m);
    await page.screenshot({ path: path.join(OUT, 'shell-on-' + w + '.png') });
  }
  await pickUnit(page, frame, '全部板块');
  await page.setViewportSize({ width: 780, height: 900 });
  await page.waitForTimeout(400);
  m = await measure(frame);
  check(m.unit === '全部板块', '壳窄屏已用真实下拉回到全部板块', m.unit);
  check(m.cash.every((r) => r.n < 2 || r.delta <= 1), '壳窄屏现金流同行仍对齐', m.cash);
  check(m.pairRows.length === 0 || m.pairRows.every((r) => r.n < 2 || r.delta <= 1), '壳窄屏成对模块对齐或已重排', m.pairRows);
  check(!m.noteClip, '壳窄屏目标说明不截断', m.noteClip);
  check(m.peer.every(d => d <= 1) && m.overflow.length === 0 && m.clipped.length === 0 && m.glyphHits.length === 0, '壳窄屏 KPI 同行等高且文字互不遮挡', { peer: m.peer, overflow: m.overflow, clipped: m.clipped, glyphHits: m.glyphHits });
  await page.screenshot({ path: path.join(OUT, 'shell-on-780.png') });
  await page.setViewportSize({ width: 780, height: 2200 });
  await page.waitForTimeout(200);
  await frame.locator('#kpiGrid').screenshot({ path: path.join(OUT, 'shell-kpi-780.png') });
  await page.getByLabel('主题颜色').first().click();
  await page.locator('.ant-select-dropdown:not(.ant-select-dropdown-hidden) .ant-select-item-option').filter({ hasText: '暖棕主题' }).click();
  await frame.waitForFunction(() => window.dashboard.state.theme === 'wood');
  m = await measure(frame);
  check(m.theme === 'wood' && m.checked === 'true', '壳 主题切到暖棕后开关仍保持', m);
  await page.screenshot({ path: path.join(OUT, 'shell-theme-wood.png') });
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.reload({ waitUntil: 'networkidle' });
  frame = await ready(page);
  m = await measure(frame);
  check(m.checked === 'false' && m.subRows.every(n => n === 0) && m.theme === 'blue', '壳 刷新后开关关、主题回默认蓝', m);
  await browser.close();
  const verdict = fails.length ? 'FAIL' : 'PASS';
  fs.writeFileSync(path.join(OUT, 'shell-probe-result.json'), JSON.stringify({ url: URL, verdict, selfTest: true, notMaxAcceptance: true, fails, results }, null, 2));
  console.log('verdict=' + verdict + ' pass=' + (results.length - fails.length) + ' fail=' + fails.length);
  process.exit(fails.length ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
