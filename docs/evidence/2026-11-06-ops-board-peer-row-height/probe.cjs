/**
 * Board 经营全景同行等高 — 可观测探针
 * 对照：docs/需求文档/202611_运营看板202610_Board目标态视觉与口径公共规格.md
 *       增补「Board 经营全景同行等高」
 * 只测树顶运营看板 iframe 内同行卡片/成对模块。不测 Catalog / HR / 完成合同额。
 */
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const OUT = __dirname;
const FILE = 'file://' + path.resolve('public/operations-dashboard-202610/index.html');
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

const fails = [];
function check(ok, name, detail) {
  const row = { name, ok: !!ok, detail: detail == null ? null : detail };
  if (!ok) fails.push(row);
  console.log((ok ? 'PASS' : 'FAIL') + '  ' + name + (detail != null ? '  ' + JSON.stringify(detail) : ''));
  return row;
}

async function readPeers(page) {
  return page.evaluate(() => {
    const visible = (el) => {
      if (!el) return false;
      const s = getComputedStyle(el);
      const r = el.getBoundingClientRect();
      return s.display !== 'none' && s.visibility !== 'hidden' && r.width > 0 && r.height > 0;
    };
    const textBox = (node) => {
      const range = document.createRange();
      range.selectNodeContents(node);
      return range.getBoundingClientRect();
    };
    const contentSlack = (el) => {
      const r = el.getBoundingClientRect();
      let bottom = r.top;
      el.querySelectorAll('*').forEach((node) => {
        if (node.namespaceURI === 'http://www.w3.org/2000/svg') return;
        const cs = getComputedStyle(node);
        if (cs.display === 'none' || cs.visibility === 'hidden') return;
        const b = node.getBoundingClientRect();
        if (b.height > 0) bottom = Math.max(bottom, b.bottom);
      });
      const cs = getComputedStyle(el);
      const padB = parseFloat(cs.paddingBottom) || 0;
      const borderB = parseFloat(cs.borderBottomWidth) || 0;
      return (r.bottom - borderB - padB) - bottom;
    };
    const textInside = (node, host) => {
      if (!node || !host) return true;
      const b = textBox(node);
      if (!b.width && !b.height) return true;
      const h = host.getBoundingClientRect();
      return b.left >= h.left - 1 && b.right <= h.right + 1 && b.top >= h.top - 1 && b.bottom <= h.bottom + 1;
    };
    const pack = (sel) => [...document.querySelectorAll(sel)].filter(visible).map((el) => {
      const r = el.getBoundingClientRect();
      const num = el.querySelector('.kpi-value, strong');
      return {
        id: el.id || '',
        top: Math.round(r.top),
        h: Math.round(r.height * 10) / 10,
        w: Math.round(r.width * 10) / 10,
        slack: Math.round(contentSlack(el) * 10) / 10,
        numInside: textInside(num, el),
        cols: el.parentElement ? el.parentElement.dataset.peerCols || '' : '',
      };
    });
    const rowsOf = (items) => {
      const rows = [];
      items.forEach((it) => {
        let row = rows.find((g) => Math.abs(g.top - it.top) <= 3);
        if (!row) {
          row = { top: it.top, items: [] };
          rows.push(row);
        }
        row.items.push(it);
      });
      return rows.map((row) => {
        const hs = row.items.map((it) => it.h);
        const maxH = Math.max(...hs);
        const snug = Math.min(...row.items.map((it) => it.slack));
        return {
          n: row.items.length,
          h: hs,
          delta: Math.round((maxH - Math.min(...hs)) * 10) / 10,
          tallestSlack: Math.round(snug * 10) / 10,
          numInside: row.items.every((it) => it.numInside),
        };
      });
    };
    const pair = document.getElementById('pairRow');
    const pairStyle = getComputedStyle(pair);
    const note = document.getElementById('targetNote');
    const noteHost = document.getElementById('targetPanel');
    const buttons = [...document.querySelectorAll('#targetPanel .segment button')].map((b) => ({
      text: b.textContent.trim(),
      inside: textInside(b, noteHost),
    }));
    const risk = document.getElementById('riskPanel').getBoundingClientRect();
    const delivery = document.getElementById('deliveryPanel').getBoundingClientRect();
    const main = document.getElementById('main');
    const gap = parseFloat(getComputedStyle(main).rowGap || getComputedStyle(main).gap) || 0;
    const spacers = [...document.querySelectorAll('#main [class*="spacer"], #main [class*="placeholder"], #main [data-peer-pad]')].map((el) => el.className);
    return {
      kpi: rowsOf(pack('.kpi-card')),
      cash: rowsOf(pack('.cash-metric')),
      risk: rowsOf(pack('.risk-metric')),
      pair: pairStyle.display === 'none' ? [] : rowsOf(pack('#pairRow > .panel')),
      pairDisplay: pairStyle.display,
      pairVisible: pairStyle.display !== 'none',
      buttons,
      noteText: note.textContent,
      noteInside: pairStyle.display === 'none' ? true : textInside(note, noteHost),
      noteClip: pairStyle.display === 'none' ? false : note.scrollWidth > note.clientWidth + 1,
      betweenRiskDelivery: Math.round(delivery.top - risk.bottom),
      mainGap: gap,
      spacers,
      peerCols: {
        kpi: document.getElementById('kpiGrid').dataset.peerCols || '',
        cash: document.getElementById('cashMetrics').dataset.peerCols || '',
        risk: document.getElementById('riskMetrics').dataset.peerCols || '',
        pair: pair.dataset.peerCols || '',
      },
    };
  });
}

function assertRows(label, rows, { requireMulti }) {
  check(rows.length > 0, label + ' 有可见同行', { rows: rows.length });
  rows.forEach((row, i) => {
    if (row.n >= 2) {
      check(row.delta <= 1, label + ' 第' + (i + 1) + '行外框等高', row);
      check(row.tallestSlack <= 8, label + ' 第' + (i + 1) + '行最高卡下方无多余空白', row);
    }
    check(row.numInside, label + ' 第' + (i + 1) + '行主数字未被裁切', row);
  });
  if (requireMulti) {
    const multi = rows.filter((row) => row.n >= 2);
    check(multi.length > 0, label + ' 仍有同排卡片', { rows });
  }
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 1 });
  await page.goto(FILE);
  await page.waitForFunction(() => document.body.dataset.ready === 'true');
  await page.waitForTimeout(200);

  const desktop = await readPeers(page);
  assertRows('桌面 KPI', desktop.kpi, { requireMulti: true });
  assertRows('桌面现金流三卡', desktop.cash, { requireMulti: true });
  assertRows('桌面应收四卡', desktop.risk, { requireMulti: true });
  assertRows('桌面成对模块', desktop.pair, { requireMulti: true });
  check(desktop.buttons.every((b) => b.inside), '桌面目标页签全文在卡片内', desktop.buttons);
  check(desktop.noteInside && !desktop.noteClip, '桌面目标说明全文在卡片内', { note: desktop.noteText, clip: desktop.noteClip });
  check(desktop.spacers.length === 0, '没有空白占位节点', desktop.spacers);
  check(desktop.kpi.length === 2 && desktop.kpi.every((r) => r.n === 2), '桌面 KPI 仍为二乘二', desktop.kpi);
  check(desktop.cash.length === 1 && desktop.cash[0].n === 3, '桌面现金流三卡仍同一行', desktop.cash);
  await page.screenshot({ path: path.join(OUT, '01-desktop-panorama.png'), fullPage: true });
  await page.locator('#pairRow').scrollIntoViewIfNeeded();
  await page.locator('#pairRow').screenshot({ path: path.join(OUT, '02-desktop-pair.png') });

  await page.setViewportSize({ width: 520, height: 1000 });
  await page.waitForTimeout(250);
  const narrow = await readPeers(page);
  assertRows('窄屏 KPI', narrow.kpi, { requireMulti: false });
  assertRows('窄屏现金流', narrow.cash, { requireMulti: false });
  assertRows('窄屏应收', narrow.risk, { requireMulti: false });
  assertRows('窄屏成对模块', narrow.pair, { requireMulti: false });
  check(narrow.buttons.every((b) => b.inside), '窄屏目标页签全文在卡片内', narrow.buttons);
  check(narrow.noteInside && !narrow.noteClip, '窄屏目标说明换行且不截断', { note: narrow.noteText, clip: narrow.noteClip });
  const cashReflow = narrow.cash.length > 1;
  check(cashReflow, '窄屏现金流按内容重排成新的行', narrow.cash);
  if (cashReflow) {
    const heights = new Set(narrow.cash.map((row) => row.h[0]));
    check(narrow.cash.every((row) => row.n < 3), '窄屏不再把三张现金流卡挤在同一行', narrow.peerCols);
  }
  await page.screenshot({ path: path.join(OUT, '03-narrow-520.png'), fullPage: true });

  // 壳视口 760 时 iframe 内容宽 312（760 - 侧栏 224 - 目录 224）。这里直接把看板文档设成该内容宽。
  await page.setViewportSize({ width: 312, height: 1000 });
  await page.waitForTimeout(300);
  const content312 = await page.evaluate(() => {
    const pair = document.getElementById('pairRow');
    const tol = 1;
    const hOutside = (node, host) => {
      if (!node || !host) return 0;
      const b = node.getBoundingClientRect();
      const h = host.getBoundingClientRect();
      if (b.width < 0.5) return 0;
      return Math.max(0, h.left - b.left, b.right - h.right);
    };
    const panels = [...pair.querySelectorAll(':scope > .panel')].map((panel) => {
      const title = panel.querySelector('.panel-title');
      const labels = [...panel.querySelectorAll('.highcharts-data-label')];
      const labelOver = Math.max(0, ...labels.map((lab) => hOutside(lab, lab.closest('.chart') || panel)), 0);
      const bits = title ? [...title.querySelectorAll('.unit, .info-button, svg')] : [];
      return {
        id: panel.id,
        w: Math.round(panel.getBoundingClientRect().width * 10) / 10,
        titleScroll: title ? title.scrollWidth : 0,
        titleClient: title ? title.clientWidth : 0,
        titleClip: title ? title.scrollWidth > title.clientWidth + tol : false,
        bitOver: Math.round(Math.max(0, ...bits.map((n) => hOutside(n, panel)), 0) * 10) / 10,
        labelCount: labels.length,
        labelOver: Math.round(labelOver * 10) / 10,
        overflow: panel.scrollWidth > panel.clientWidth + tol,
      };
    });
    const tops = [...pair.querySelectorAll(':scope > .panel')].map((el) => Math.round(el.getBoundingClientRect().top));
    return {
      pairW: pair.clientWidth,
      cols: pair.dataset.peerCols || '',
      stacked: tops.length === 2 && Math.abs(tops[0] - tops[1]) > 8,
      panels,
    };
  });
  const pairFits = content312.panels.every((p) => !p.titleClip && p.bitOver <= 1 && p.labelOver <= 1 && !p.overflow && p.labelCount > 0);
  check(content312.cols === '1' && content312.stacked, '内容宽 312 成对行收成 1 列', content312);
  check(pairFits, '内容宽 312 标题与柱端数字未裁切', content312);
  const peers312 = await readPeers(page);
  assertRows('内容宽 312 KPI', peers312.kpi, { requireMulti: false });
  assertRows('内容宽 312 现金流', peers312.cash, { requireMulti: false });
  assertRows('内容宽 312 应收', peers312.risk, { requireMulti: false });
  assertRows('内容宽 312 成对模块', peers312.pair, { requireMulti: false });
  await page.locator('#pairRow').scrollIntoViewIfNeeded();
  await page.locator('#pairRow').screenshot({ path: path.join(OUT, '11-content-312-pair.png') });

  await page.setViewportSize({ width: 1280, height: 1000 });
  await page.waitForTimeout(250);
  await page.evaluate(() => {
    const card = document.querySelectorAll('.risk-metric')[0];
    const extra = document.createElement('small');
    extra.id = 'probe-extra';
    extra.textContent = '补充经营说明需要完整换行展示，不能为了与旁边卡片凑高度被裁掉。再补一句让这一侧明显更高，用来确认另一行不被跟着拉高。';
    extra.style.whiteSpace = 'normal';
    extra.style.display = 'block';
    card.appendChild(extra);
  });
  await page.waitForTimeout(50);
  const grown = await readPeers(page);
  assertRows('内容变长后的应收', grown.risk, { requireMulti: true });
  check(grown.risk.length >= 2, '内容变长后应收仍分成多行', grown.risk);
  if (grown.risk.length >= 2) {
    check(grown.risk[0].h[0] > grown.risk[1].h[0] + 8, '更高的一行不把下一行撑到同一高度', {
      row1: grown.risk[0].h,
      row2: grown.risk[1].h,
    });
  }
  const extraInside = await page.evaluate(() => {
    const extra = document.getElementById('probe-extra');
    const card = extra.closest('.risk-metric');
    const range = document.createRange();
    range.selectNodeContents(extra);
    const b = range.getBoundingClientRect();
    const h = card.getBoundingClientRect();
    return b.left >= h.left - 1 && b.right <= h.right + 1 && b.top >= h.top - 1 && b.bottom <= h.bottom + 1;
  });
  check(extraInside, '变长正文完整落在卡片内', extraInside);
  await page.screenshot({ path: path.join(OUT, '04-risk-content-grow.png'), fullPage: true });
  await page.evaluate(() => document.getElementById('probe-extra').remove());

  const units = [];
  for (const unit of UNITS) {
    await page.evaluate((name) => {
      window.dispatchEvent(new MessageEvent('message', {
        data: { type: 'ops-dashboard-filter', unit: name },
        origin: window.location.origin,
      }));
    }, unit);
    await page.waitForTimeout(120);
    const snap = await readPeers(page);
    const leaf = unit !== '全部板块';
    if (leaf) {
      check(snap.pairDisplay === 'none', unit + ' 成对模块整块隐藏', { display: snap.pairDisplay });
      check(Math.abs(snap.betweenRiskDelivery - snap.mainGap) <= 4, unit + ' 隐藏后不留空壳', {
        between: snap.betweenRiskDelivery,
        gap: snap.mainGap,
      });
    } else {
      assertRows(unit + ' 成对模块', snap.pair, { requireMulti: true });
    }
    assertRows(unit + ' KPI', snap.kpi, { requireMulti: true });
    assertRows(unit + ' 现金流', snap.cash, { requireMulti: true });
    assertRows(unit + ' 应收', snap.risk, { requireMulti: true });
    units.push({ unit, pairDisplay: snap.pairDisplay, kpi: snap.kpi, cash: snap.cash, risk: snap.risk, pair: snap.pair, between: snap.betweenRiskDelivery });
  }
  await page.evaluate(() => {
    window.dispatchEvent(new MessageEvent('message', {
      data: { type: 'ops-dashboard-filter', unit: 'SAS530 银川中心' },
      origin: window.location.origin,
    }));
  });
  await page.waitForTimeout(150);
  await page.screenshot({ path: path.join(OUT, '05-leaf-yinchuan.png'), fullPage: true });
  await page.evaluate(() => {
    window.dispatchEvent(new MessageEvent('message', {
      data: { type: 'ops-dashboard-filter', unit: '全部板块' },
      origin: window.location.origin,
    }));
  });
  await page.waitForTimeout(200);

  const tabs = ['contract', 'completed', 'invoice', 'receipt'];
  const tabSnaps = [];
  for (const metric of tabs) {
    await page.click('#targetPanel .segment button[data-target-metric="' + metric + '"]');
    await page.waitForTimeout(80);
    const snap = await readPeers(page);
    assertRows('页签 ' + metric, snap.pair, { requireMulti: true });
    check(snap.noteText.length > 0 && !snap.noteClip && snap.noteInside, '页签 ' + metric + ' 说明未截断', snap.noteText);
    tabSnaps.push({ metric, note: snap.noteText, pair: snap.pair });
  }
  await page.screenshot({ path: path.join(OUT, '06-target-tab-receipt.png'), fullPage: true });

  await page.click('.kpi-card');
  await page.waitForTimeout(150);
  const dialogOpen = await page.evaluate(() => document.getElementById('detailDialog').open);
  check(dialogOpen, '点击 KPI 卡打开明细', dialogOpen);
  await page.screenshot({ path: path.join(OUT, '07-kpi-dialog.png'), fullPage: true });
  await page.keyboard.press('Escape');

  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.waitForTimeout(250);
  const back = await readPeers(page);
  check(back.cash.length === 1 && back.cash[0].n === 3, '拉回宽屏后现金流恢复同一行', back.cash);
  check(back.kpi.length === 2 && back.kpi.every((r) => r.n === 2), '拉回宽屏后 KPI 恢复二乘二', back.kpi);
  assertRows('拉回宽屏成对模块', back.pair, { requireMulti: true });

  const report = {
    verdict: fails.length ? 'FAIL' : 'PASS',
    fails,
    desktop,
    narrow,
    content312,
    grown: grown.risk,
    units,
    tabSnaps,
    back: { kpi: back.kpi, cash: back.cash, pair: back.pair },
  };
  fs.writeFileSync(path.join(OUT, 'probe-result.json'), JSON.stringify(report, null, 2));
  console.log('\nVERDICT ' + report.verdict + ' fails=' + fails.length);
  await browser.close();
  process.exit(fails.length ? 1 : 0);
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
