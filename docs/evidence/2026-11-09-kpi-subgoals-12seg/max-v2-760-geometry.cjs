/**
 * v2 补测：复走页面探针在 file:// 宽 760 的关/开/再关顺序，
 * 记录 grid 列数、每张卡的 top/left/width/height，以及按 top 相差 ≤3px 分成的同一行。
 * 同行等高断言只比较同一行里的外框高度，不把不同列数的两次测量拿来互比。
 * 运行：node docs/evidence/2026-11-09-kpi-subgoals-12seg/max-v2-760-geometry.cjs
 */
'use strict';

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const OUT = path.join(__dirname, 'max-v2-760-geometry.json');
const FILE = 'file://' + path.resolve('public/operations-dashboard-202610/index.html');

async function setSwitch(page, on) {
  const cur = await page.getAttribute('#kpiSubgoalSwitch', 'aria-checked');
  if ((cur === 'true') !== on) await page.click('#kpiSubgoalSwitch');
  await page.waitForFunction(v => document.getElementById('kpiSubgoalSwitch').getAttribute('aria-checked') === v, String(on));
  await page.waitForTimeout(80);
}

async function snapScroll(page) {
  await page.evaluate(() => {
    const mainEl = document.getElementById('main');
    const cards = [...document.querySelectorAll('#kpiGrid > .kpi-card')];
    for (const card of cards) {
      const prev = mainEl.scrollTop;
      card.scrollIntoView({ block: 'center', inline: 'nearest' });
      mainEl.scrollTop = prev;
    }
  });
}

async function geom(page, tag) {
  return page.evaluate(label => {
    const grid = document.getElementById('kpiGrid');
    const cs = getComputedStyle(grid);
    const cards = [...grid.querySelectorAll(':scope > .kpi-card')].map(c => {
      const r = c.getBoundingClientRect();
      const delta = c.querySelector(':scope > .kpi-delta');
      return {
        kpi: c.dataset.kpi,
        top: Math.round(r.top * 1000) / 1000,
        left: Math.round(r.left * 1000) / 1000,
        width: Math.round(r.width * 1000) / 1000,
        height: Math.round(r.height * 1000) / 1000,
        sub: !!c.querySelector('.kpi-subgoals'),
        deltaPosition: delta ? getComputedStyle(delta).position : null,
      };
    });
    const rows = [];
    cards.forEach(c => {
      let g = rows.find(row => Math.abs(row.top - c.top) <= 3);
      if (!g) {
        g = { top: c.top, cards: [] };
        rows.push(g);
      }
      g.cards.push(c);
    });
    return {
      tag: label,
      peerCols: grid.dataset.peerCols || null,
      gridTemplateColumns: cs.gridTemplateColumns,
      switchChecked: document.getElementById('kpiSubgoalSwitch').getAttribute('aria-checked'),
      viewport: { w: window.innerWidth, h: window.innerHeight },
      cards,
      rows: rows.map((g, ri) => {
        const hs = g.cards.map(c => c.height);
        const ws = g.cards.map(c => c.width);
        return {
          row: ri + 1,
          n: g.cards.length,
          top: g.top,
          heightDelta: Math.round((Math.max(...hs) - Math.min(...hs)) * 1000) / 1000,
          widthDelta: Math.round((Math.max(...ws) - Math.min(...ws)) * 1000) / 1000,
          kpis: g.cards.map(c => c.kpi),
          heights: hs,
          widths: ws,
          lefts: g.cards.map(c => c.left),
        };
      }),
    };
  }, tag);
}

(async () => {
  const browser = await chromium.launch({ channel: 'chrome', args: ['--no-sandbox', '--disable-dev-shm-usage'] });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 1 });
  await page.goto(FILE);
  await page.waitForFunction(() => document.body.dataset.ready === 'true' && document.getElementById('kpiSubgoalSwitch'));
  const shots = [];
  const widths = [1440, 1280, 1024, 760];
  for (const w of widths) {
    await page.setViewportSize({ width: w, height: 1000 });
    await setSwitch(page, false);
    await page.waitForTimeout(450);
    if (w === 760) shots.push(await geom(page, '760-off-before-scroll'));
    await snapScroll(page);
    await page.waitForTimeout(200);
    if (w === 760) shots.push(await geom(page, '760-off-after-scroll-this-is-offH'));
    await setSwitch(page, true);
    await page.waitForTimeout(450);
    await snapScroll(page);
    if (w === 760) shots.push(await geom(page, '760-on-after-scroll'));
    await setSwitch(page, false);
    await page.waitForTimeout(450);
    await snapScroll(page);
    await page.waitForTimeout(200);
    if (w === 760) shots.push(await geom(page, '760-back-after-scroll-this-is-backH'));
    await setSwitch(page, true);
  }
  const off = shots.find(s => s.tag === '760-off-after-scroll-this-is-offH');
  const back = shots.find(s => s.tag === '760-back-after-scroll-this-is-backH');
  const summary = {
    offCols: off && off.peerCols,
    backCols: back && back.peerCols,
    sameCols: !!(off && back && off.peerCols === back.peerCols),
    offHeights: off && off.cards.map(c => c.height),
    backHeights: back && back.cards.map(c => c.height),
    withinRowMaxHeightDelta: shots.map(s => ({
      tag: s.tag,
      peerCols: s.peerCols,
      maxDelta: Math.max(...s.rows.map(r => r.heightDelta)),
      rows: s.rows.map(r => ({ row: r.row, n: r.n, heightDelta: r.heightDelta, widths: r.widths })),
    })),
  };
  const payload = {
    grouping: '同一行 = getBoundingClientRect().top 相差不超过 3px。同行等高只看该组 heightDelta，不跨列数比较两次测量的卡高。',
    summary,
    shots,
  };
  fs.writeFileSync(OUT, JSON.stringify(payload, null, 2));
  console.log(JSON.stringify(summary, null, 2));
  await browser.close();
})().catch(err => {
  console.error(err);
  process.exit(2);
});
