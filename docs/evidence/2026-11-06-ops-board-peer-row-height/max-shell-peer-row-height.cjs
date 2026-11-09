/**
 * Max 壳层探针 — /operations-dashboard-202610/board
 * 只验树顶「运营看板」iframe 内的同行等高，以及叶子隐藏成对行。
 * 不打开人力资源看板、完成合同额看板做混验。
 */
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const { measureIn, judge, UNITS } = require('./max-peer-row-height.cjs');

const OUT = __dirname;
const BASE = process.env.MAX_BASE || 'http://127.0.0.1:3456';

async function frameOf(page) {
  const frame = page.frame({ url: /operations-dashboard-202610\/index\.html/ });
  if (!frame) throw new Error('运营看板 iframe 未出现');
  await frame.waitForFunction(() => document.body.dataset.ready === 'true');
  return frame;
}

async function shot(page, name) {
  await page.screenshot({ path: path.join(OUT, name) });
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 1 });
  const issues = [];
  await page.goto(BASE + '/operations-dashboard-202610/board', { waitUntil: 'networkidle', timeout: 90000 });
  await page.getByTestId('board-main-header').waitFor();
  const frame = await frameOf(page);
  await page.waitForTimeout(400);

  const header = (await page.getByTestId('board-main-header').innerText()).replace(/\s+/g, ' ');
  const treeText = await page.locator('[aria-label="看板目录"]').innerText();
  if (!header.includes('Board')) issues.push({ ac: '全部板块时壳 header 为 Board', detail: header });
  if (!treeText.includes('运营看板')) issues.push({ ac: '看板目录含树顶运营看板', detail: treeText.slice(0, 200) });

  const desktop = await measureIn(frame);
  issues.push(...judge(desktop, 'shell-desktop'));
  if (!desktop.rows.some((r) => r.zone === 'pair' && r.n === 2 && r.spread <= 1)) {
    issues.push({ ac: '壳内成对模块同行等高', detail: desktop.rows.filter((r) => r.zone === 'pair') });
  }
  await shot(page, 'max-shell-01-desktop.png');

  await page.locator('[data-testid="shell-unit-select"]').click();
  await page.locator('.ant-select-dropdown').waitFor();
  for (let i = 0; i < 12; i += 1) await page.keyboard.press('ArrowDown');
  await page.locator('.ant-select-item-option', { hasText: 'SAS530 银川中心' }).click();
  await page.waitForTimeout(300);
  const leafHeader = (await page.getByTestId('board-main-header').innerText()).replace(/\s+/g, ' ');
  const leaf = await measureIn(frame);
  if (!leafHeader.includes('银川中心')) issues.push({ ac: '壳选叶子后 header 为该叶子', detail: leafHeader });
  if (leaf.pair.display !== 'none' || leaf.pair.height > 1) issues.push({ ac: '壳内叶子成对行隐藏', detail: leaf.pair });
  if (Math.abs(leaf.betweenRiskAndDelivery - leaf.main.gap) > 1) {
    issues.push({
      ac: '壳内叶子隐藏后不留空洞',
      detail: { between: leaf.betweenRiskAndDelivery, gap: leaf.main.gap },
    });
  }
  issues.push(...judge(leaf, 'shell-leaf-yinchuan'));
  await shot(page, 'max-shell-02-leaf.png');

  await page.locator('[data-testid="shell-unit-select"]').click();
  await page.locator('.ant-select-dropdown').waitFor();
  for (let i = 0; i < 12; i += 1) await page.keyboard.press('ArrowUp');
  await page.keyboard.press('Enter');
  await page.waitForTimeout(300);
  const restoredHeader = (await page.getByTestId('board-main-header').innerText()).replace(/\s+/g, ' ');
  if (!restoredHeader.includes('Board')) issues.push({ ac: '壳下拉回到全部板块后 header 为 Board', detail: restoredHeader });

  const widths = [1200, 960, 760];
  const sweep = [];
  for (const width of widths) {
    await page.setViewportSize({ width, height: 1000 });
    await page.waitForTimeout(280);
    const snap = await measureIn(frame);
    issues.push(...judge(snap, 'shell-width-' + width));
    sweep.push({
      width,
      iframe: snap.main.width,
      cols: {
        kpi: snap.grids.kpi.peerCols,
        cash: snap.grids.cash.peerCols,
        risk: snap.grids.risk.peerCols,
        pair: snap.grids.pair.peerCols,
      },
      rows: snap.rows.map((r) => ({ zone: r.zone, n: r.n, spread: r.spread, heights: r.heights, minInkSlack: r.minInkSlack })),
      delivery: { h: snap.delivery.h, widthShare: snap.delivery.widthShare, flexGrow: snap.delivery.flexGrow },
    });
  }
  await shot(page, 'max-shell-03-narrow.png');

  const mid = sweep.find((s) => s.cols.cash !== '3' || s.cols.kpi !== '2' || s.cols.pair !== '2');
  if (!mid) issues.push({ ac: '壳层变窄后经营全景按新列数重排', detail: sweep });

  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.waitForTimeout(280);
  const back = await measureIn(frame);
  issues.push(...judge(back, 'shell-restored'));
  const cash = back.rows.filter((r) => r.zone === 'cash');
  if (!(cash.length === 1 && cash[0].n === 3)) issues.push({ ac: '壳层拉回宽屏后现金流恢复同一行', detail: cash });

  const unitChecks = [];
  for (const unit of UNITS) {
    if (unit === '全部板块') continue;
    await page.goto(BASE + '/operations-dashboard-202610/board?unit=' + encodeURIComponent(unit), {
      waitUntil: 'networkidle',
      timeout: 90000,
    });
    const f = await frameOf(page);
    await page.waitForTimeout(250);
    const snap = await measureIn(f);
    const headerText = (await page.getByTestId('board-main-header').innerText()).replace(/\s+/g, ' ');
    const okHide = snap.pair.display === 'none' && snap.pair.height <= 1;
    const okHole = Math.abs(snap.betweenRiskAndDelivery - snap.main.gap) <= 1;
    if (!headerText.includes(unit)) issues.push({ ac: '深链叶子 header', ctx: unit, detail: headerText });
    if (!okHide) issues.push({ ac: '深链叶子成对行隐藏', ctx: unit, detail: snap.pair });
    if (!okHole) {
      issues.push({
        ac: '深链叶子不留空洞',
        ctx: unit,
        detail: { between: snap.betweenRiskAndDelivery, gap: snap.main.gap },
      });
    }
    issues.push(...judge(snap, 'shell-unit-' + unit));
    unitChecks.push({
      unit,
      header: headerText,
      pairDisplay: snap.pair.display,
      between: snap.betweenRiskAndDelivery,
      gap: snap.main.gap,
      spreads: snap.rows.map((r) => ({ zone: r.zone, n: r.n, spread: r.spread })),
    });
  }

  const report = {
    probe: 'max-shell-peer-row-height',
    commit: '69bbce5db6b5cf8029e68ff5f6c5d01a8b8ef272',
    url: BASE + '/operations-dashboard-202610/board',
    measuredAt: new Date().toISOString(),
    verdict: issues.length ? 'FAIL' : 'PASS',
    issueCount: issues.length,
    issues,
    header,
    desktop: {
      rows: desktop.rows.map((r) => ({
        zone: r.zone,
        n: r.n,
        spread: r.spread,
        heights: r.heights,
        minInkSlack: r.minInkSlack,
        maxInkSlack: r.maxInkSlack,
        clips: r.clips.length,
      })),
      delivery: desktop.delivery,
      pair: desktop.pair,
      note: desktop.note,
      gaps: desktop.gaps,
    },
    leaf: { header: leafHeader, pair: leaf.pair, between: leaf.betweenRiskAndDelivery, gap: leaf.main.gap },
    sweep,
    unitChecks,
  };
  fs.writeFileSync(path.join(OUT, 'max-shell-peer-row-height.json'), JSON.stringify(report, null, 2));
  console.log('SHELL VERDICT ' + report.verdict + ' issues=' + issues.length);
  issues.slice(0, 40).forEach((item) => console.log('ISSUE ' + item.ac + ' @ ' + (item.ctx || '')));
  await browser.close();
  process.exit(issues.length ? 1 : 0);
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
