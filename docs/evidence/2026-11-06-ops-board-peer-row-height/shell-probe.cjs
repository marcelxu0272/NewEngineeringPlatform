const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const OUT = path.resolve('docs/evidence/2026-11-06-ops-board-peer-row-height');
const UNITS = [
  '全部板块','SAS170 PMC板块','SAS610 咨询板块','SAS680 数字技术板块','SAS650 新材料板块',
  'SAS710 生命科学板块','SAS690 COII板块','SAS720 模块化板块','SAS670 供应链板块',
  'SAS520 金山中心','SAS560 沈阳中心','SAS550 惠湛中心','SAS530 银川中心',
];
const fails = [];
const check = (ok, name, detail) => {
  if (!ok) fails.push({ name, detail });
  console.log((ok ? 'PASS' : 'FAIL') + '  ' + name);
};

async function measure(frame) {
  return frame.evaluate(() => {
    const visible = (el) => {
      const s = getComputedStyle(el);
      const r = el.getBoundingClientRect();
      return s.display !== 'none' && r.width > 0 && r.height > 0;
    };
    const rowsOf = (sel) => {
      const rows = [];
      [...document.querySelectorAll(sel)].filter(visible).forEach((el) => {
        const r = el.getBoundingClientRect();
        const top = Math.round(r.top);
        let row = rows.find((g) => Math.abs(g.top - top) <= 3);
        if (!row) { row = { top, h: [] }; rows.push(row); }
        row.h.push(Math.round(r.height * 10) / 10);
      });
      return rows.map((row) => ({ n: row.h.length, delta: Math.round((Math.max(...row.h) - Math.min(...row.h)) * 10) / 10, h: row.h }));
    };
    const pair = document.getElementById('pairRow');
    const note = document.getElementById('targetNote');
    return {
      ready: document.body.dataset.ready,
      unit: window.dashboard && window.dashboard.state.unit,
      pairDisplay: getComputedStyle(pair).display,
      kpi: rowsOf('.kpi-card'),
      cash: rowsOf('.cash-metric'),
      risk: rowsOf('.risk-metric'),
      pair: getComputedStyle(pair).display === 'none' ? [] : rowsOf('#pairRow > .panel'),
      noteClip: note.scrollWidth > note.clientWidth + 1,
      cols: {
        kpi: document.getElementById('kpiGrid').dataset.peerCols,
        cash: document.getElementById('cashMetrics').dataset.peerCols,
        pair: pair.dataset.peerCols,
      },
    };
  });
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto('http://127.0.0.1:3000/operations-dashboard-202610/board', { waitUntil: 'networkidle' });
  await page.getByTestId('board-main-header').waitFor();
  const frame = page.frame({ url: /operations-dashboard-202610\/index\.html/ });
  if (!frame) throw new Error('ops iframe missing');
  await frame.waitForFunction(() => document.body.dataset.ready === 'true');
  await page.waitForTimeout(300);
  const header = await page.getByTestId('board-main-header').innerText();
  check(header.includes('Board'), '壳 header 全部板块为 Board', header);
  let snap = await measure(frame);
  check(snap.kpi.some((r) => r.n === 2 && r.delta <= 1), '壳内 KPI 同行等高', snap.kpi);
  check(snap.cash.some((r) => r.n === 3 && r.delta <= 1), '壳内现金流三卡同行', snap.cash);
  check(snap.pair.some((r) => r.n === 2 && r.delta <= 1), '壳内成对模块等高', snap.pair);
  await page.screenshot({ path: path.join(OUT, '08-shell-desktop.png'), fullPage: true });

  await frame.click('#targetPanel .segment button[data-target-metric="invoice"]');
  await page.waitForTimeout(150);
  const noted = await frame.locator('#targetNote').innerText();
  check(noted.includes('完成开票额'), '壳内切换目标页签只改本区说明', noted);
  snap = await measure(frame);
  check(snap.pair.some((r) => r.n === 2 && r.delta <= 1), '切页签后成对模块仍等高', snap.pair);

  await frame.click('.kpi-card');
  await page.waitForTimeout(200);
  const open = await frame.evaluate(() => document.getElementById('detailDialog').open);
  check(open, '壳内点击 KPI 打开明细', open);
  await frame.evaluate(() => document.getElementById('detailDialog').close());

  const unitLog = [];
  for (const unit of UNITS) {
    await page.getByTestId('shell-unit-select').click();
    await page.locator('.ant-select-dropdown .ant-select-item-option[title="' + unit + '"]').click();
    await page.waitForTimeout(200);
    const head = await page.getByTestId('board-main-header').innerText();
    snap = await measure(frame);
    const expectHeader = unit === '全部板块' ? 'Board' : unit;
    const headerOk = head.includes(expectHeader);
    const pairOk = unit === '全部板块' ? snap.pair.some((r) => r.n === 2 && r.delta <= 1) : snap.pairDisplay === 'none';
    const peersOk = snap.kpi.every((r) => r.n < 2 || r.delta <= 1) && snap.cash.every((r) => r.n < 2 || r.delta <= 1) && snap.risk.every((r) => r.n < 2 || r.delta <= 1);
    check(headerOk && pairOk && peersOk && snap.unit === unit, '壳筛选 ' + unit, { head, unit: snap.unit, pair: snap.pairDisplay, cols: snap.cols });
    unitLog.push({ unit, head, pair: snap.pairDisplay, cols: snap.cols });
  }
  await page.screenshot({ path: path.join(OUT, '09-shell-leaf.png'), fullPage: true });

  await page.getByTestId('shell-unit-select').click();
  const dropdown = page.locator('.ant-select-dropdown').last();
  await dropdown.locator('.rc-virtual-list-holder').evaluate((el) => { el.scrollTop = 0; });
  await dropdown.locator('.ant-select-item-option', { hasText: /^全部板块$/ }).click();
  await page.waitForTimeout(200);
  await page.setViewportSize({ width: 780, height: 900 });
  await page.waitForTimeout(400);
  snap = await measure(frame);
  check(snap.cash.every((r) => r.n < 2 || r.delta <= 1), '壳窄屏现金流同行仍对齐', snap.cash);
  check(snap.pair.length === 0 || snap.pair.every((r) => r.n < 2 || r.delta <= 1), '壳窄屏成对模块对齐或已重排', snap.pair);
  check(!snap.noteClip, '壳窄屏目标说明不截断', snap.noteClip);
  await page.screenshot({ path: path.join(OUT, '10-shell-narrow.png'), fullPage: true });

  fs.writeFileSync(path.join(OUT, 'shell-probe.json'), JSON.stringify({ verdict: fails.length ? 'FAIL' : 'PASS', fails, unitLog, narrow: snap }, null, 2));
  console.log('VERDICT', fails.length ? 'FAIL' : 'PASS', 'fails=' + fails.length);
  await browser.close();
  process.exit(fails.length ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
