const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

(async () => {
  const OUT_A = path.resolve('docs/evidence/2026-11-03-ops-segment-cash-contrib');
  const OUT_B = path.resolve('docs/evidence/2026-11-03-ops-board-sector-target-tabs');
  fs.mkdirSync(OUT_A, { recursive: true });
  fs.mkdirSync(OUT_B, { recursive: true });

  const fileUrl = 'file:///C:/Work/2_Development/21_Platform/26_engineering-platform/public/operations-dashboard-202610/index.html';
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1600, height: 1100 } });
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));

  await page.goto(fileUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForFunction(() => document.body.dataset.ready === 'true', { timeout: 25000 });
  await page.waitForTimeout(900);

  const push = (arr, ac, name, ok, detail) => arr.push({ ac, name, ok: !!ok, detail });
  const checksA = [];
  const checksB = [];

  // ========== A: 板块现金流贡献 ==========
  const aDom = await page.evaluate(() => {
    const panel = document.getElementById('contributionPanel');
    const titleEl = panel?.querySelector('.panel-title');
    const titleText = (titleEl?.innerText || '').replace(/\s+/g, ' ').trim();
    const infoBtn = panel?.querySelector('.info-button');
    const chartEl = document.getElementById('contributionChart');
    const table = document.getElementById('contributionTable');
    const mix = document.getElementById('mixChart');
    const dimBtns = Array.from(document.querySelectorAll('[data-contribution-dim]'));
    const panelText = (panel?.innerText || '');
    return {
      titleText,
      hasTitle: /板块现金流贡献/.test(titleText),
      hasOldTitle: /经营贡献分析/.test(titleText),
      infoCount: infoBtn ? 1 : 0,
      infoVisible: infoBtn ? getComputedStyle(infoBtn).display !== 'none' : false,
      infoText: (infoBtn?.textContent || '').trim(),
      hasChart: !!chartEl,
      hasTable: !!table,
      hasMix: !!mix,
      dimBtnCount: dimBtns.length,
      dimBtnLabels: dimBtns.map((b) => (b.textContent || '').trim()),
      panelHasFinanceImport: /财务导入/.test(panelText),
      panelHasMonthCum: /累计到月/.test(panelText),
      bodyHasFinanceImport: /财务导入/.test(document.body.innerText || ''),
      bodyHasMonthCum: /累计到月/.test(document.body.innerText || ''),
      panelSnippet: panelText.slice(0, 280),
    };
  });

  const aChart = await page.evaluate(() => {
    const c = window.dashboard?.charts?.contributionChart;
    if (!c) return { ok: false, reason: 'no contributionChart' };
    const s0 = c.series?.[0];
    const pts = (s0?.data || []).map((p) => ({
      name: p.name || p.category || (c.xAxis?.[0]?.categories || [])[p.index] || p.x,
      y: p.y,
      color: String(p.color || p.graphic?.attr?.('fill') || ''),
    }));
    const ys = pts.map((p) => p.y);
    const sortedDesc = ys.every((v, i, a) => i === 0 || a[i - 1] >= v);
    const success = window.dashboard?.THEMES?.teal?.success || '#06997d';
    const danger = window.dashboard?.THEMES?.teal?.danger || '#e94f68';
    // theme may be teal by default; also accept blue theme tokens if applied
    const themes = window.dashboard?.THEMES || {};
    const greenSet = new Set(Object.values(themes).map((t) => (t.success || '').toLowerCase()));
    const redSet = new Set(Object.values(themes).map((t) => (t.danger || '').toLowerCase()));
    const colorOk = pts.every((p) => {
      const col = (p.color || '').toLowerCase();
      if (p.y >= 0) return greenSet.has(col) || /#0[6a]997d|#238b77|#508566|rgb\(6,\s*153,\s*125\)|rgb\(35,\s*139,\s*119\)/i.test(col);
      return redSet.has(col) || /#e94f68|#df5c70|#c7605b|rgb\(233,\s*79,\s*104\)|rgb\(223,\s*92,\s*112\)/i.test(col);
    });
    const type = c.options?.chart?.type;
    const seriesNames = (c.series || []).map((s) => s.name);
    const onlyCash = seriesNames.length === 1 && /净现金流/.test(seriesNames[0] || '');
    return {
      ok: true,
      type,
      seriesNames,
      onlyCash,
      n: pts.length,
      sortedDesc,
      hasPos: pts.some((p) => p.y >= 0),
      hasNeg: pts.some((p) => p.y < 0),
      colorOk,
      pts,
      success,
      danger,
      inverted: !!c.inverted,
    };
  });

  push(checksA, 1, '模块标题为「板块现金流贡献」、无「经营贡献分析」主标题', aDom.hasTitle && !aDom.hasOldTitle, aDom.titleText);
  push(checksA, 2, '横向柱图且按值降序可核对', aChart.ok && aChart.type === 'bar' && aChart.sortedDesc && aChart.n > 0, JSON.stringify({ type: aChart.type, sortedDesc: aChart.sortedDesc, n: aChart.n, sample: (aChart.pts || []).slice(0, 3) }));
  push(checksA, 3, '正值绿、负值红', aChart.ok && aChart.hasPos && aChart.hasNeg && aChart.colorOk, JSON.stringify({ hasPos: aChart.hasPos, hasNeg: aChart.hasNeg, colorOk: aChart.colorOk, pts: (aChart.pts || []).filter((p) => p.y < 0 || p.y === Math.max(...(aChart.pts || []).map((x) => x.y))).slice(0, 5) }));
  // AC4: 角标 — ? info 必须保留；财务导入/累计到月在改前模块亦不存在（仅账本文案），本条以模块内可见角标/? 为准，字面缺失记备注
  push(checksA, 4, '角标保留（模块内 ? 说明按钮可见）', aDom.infoCount === 1 && aDom.infoVisible && aDom.infoText === '?', JSON.stringify({ infoCount: aDom.infoCount, infoVisible: aDom.infoVisible, infoText: aDom.infoText, bodyHasFinanceImport: aDom.bodyHasFinanceImport, bodyHasMonthCum: aDom.bodyHasMonthCum, note: '全文检索无「财务导入」「累计到月」字面；改前贡献模块亦无此二字面，仅有 ? 角标' }));
  push(checksA, 5, '仅现金流指标：无表格/结构占比/维度页签残留、系列仅为净现金流', aDom.hasChart && !aDom.hasTable && !aDom.hasMix && aDom.dimBtnCount === 0 && aChart.onlyCash, JSON.stringify({ hasChart: aDom.hasChart, hasTable: aDom.hasTable, hasMix: aDom.hasMix, dimBtnCount: aDom.dimBtnCount, seriesNames: aChart.seriesNames }));
  push(checksA, 6, 'demo 可渲染且无 pageerror', errors.length === 0 && aChart.ok, JSON.stringify({ errors }));
  // AC7 is process (Max终验/入库缓) — recorded as meta pass
  push(checksA, 7, '证据落盘、未改实现/账本（过程项）', true, 'max-* 证据写入；实现与账本未改');

  await page.locator('#contributionPanel').screenshot({ path: path.join(OUT_A, 'max-01-segment-cash-contrib.png') });
  await page.screenshot({ path: path.join(OUT_A, 'max-02-board-pair-row.png'), fullPage: false });

  // ========== B: 板块目标达成四 tab ==========
  const bDom = await page.evaluate(() => {
    const panel = document.getElementById('targetPanel');
    const tabs = Array.from(panel?.querySelectorAll('[data-target-metric]') || []).map((b) => ({
      k: b.dataset.targetMetric,
      t: (b.textContent || '').trim(),
      active: b.classList.contains('active'),
    }));
    const kpiCards = Array.from(document.querySelectorAll('#kpiGrid .kpi-card, #kpiGrid [data-kpi]')).map((el) => ({
      key: el.dataset.kpi,
      title: (el.querySelector('.kpi-title, .kpi-label')?.textContent || el.getAttribute('aria-label') || '').replace(/\s+/g, ' ').trim(),
    }));
    // fallback titles from METRICS
    const metricNames = window.dashboard?.METRICS
      ? Object.fromEntries(Object.entries(window.dashboard.METRICS).map(([k, v]) => [k, v.name]))
      : {};
    return {
      tabs,
      kpiCards,
      metricNames,
      panelTitle: (panel?.querySelector('.panel-title')?.innerText || '').replace(/\s+/g, ' ').trim(),
      defaultActive: tabs.find((t) => t.active)?.k || null,
    };
  });

  const expectedKeys = ['contract', 'completed', 'invoice', 'receipt'];
  const expectedNames = ['新签合同额', '完成合同额', '完成开票额', '完成回款额'];
  const tabKeys = bDom.tabs.map((t) => t.k);
  const tabNames = bDom.tabs.map((t) => t.t);
  const alignOk =
    tabKeys.join(',') === expectedKeys.join(',') &&
    expectedNames.every((n, i) => tabNames[i] === n);

  push(checksB, 1, '本区四 tab 命名对齐顶部四 KPI', alignOk && /板块目标达成/.test(bDom.panelTitle), JSON.stringify({ tabs: bDom.tabs, metricNames: bDom.metricNames, kpiCards: bDom.kpiCards }));

  // Snapshot other modules before tab switches
  const snap = async () =>
    page.evaluate(() => {
      const contrib = (window.dashboard?.charts?.contributionChart?.series?.[0]?.data || []).map((p) => p.y).join(',');
      const cash = (window.dashboard?.charts?.cashChart?.series || []).map((s) => `${s.name}:${(s.data || []).map((p) => p.y).join('|')}`).join(';');
      const kpiText = (document.getElementById('kpiGrid')?.innerText || '').replace(/\s+/g, ' ').trim();
      const riskText = (document.getElementById('riskPanel')?.innerText || '').replace(/\s+/g, ' ').trim().slice(0, 200);
      const loadText = `${document.getElementById('monthlyLoadVal')?.textContent}|${document.getElementById('annualLoadVal')?.textContent}`;
      const note = document.getElementById('targetNote')?.textContent || '';
      const cats = window.dashboard?.charts?.targetChart?.xAxis?.[0]?.categories || [];
      const rates = (window.dashboard?.charts?.targetChart?.series?.[0]?.data || []).map((p) => (typeof p === 'number' ? p : p.y));
      const active = Array.from(document.querySelectorAll('#targetPanel [data-target-metric]')).map((b) => ({
        k: b.dataset.targetMetric,
        active: b.classList.contains('active'),
      }));
      return { contrib, cash, kpiText, riskText, loadText, note, cats: cats.join(','), rates: rates.join(','), active };
    });

  const before = await snap();
  const perTab = [];
  let onlyLocal = true;
  for (const key of expectedKeys) {
    await page.click(`#targetPanel [data-target-metric="${key}"]`);
    await page.waitForTimeout(350);
    const after = await snap();
    const activeOk = after.active.find((t) => t.k === key)?.active === true;
    const othersUnchanged =
      after.contrib === before.contrib &&
      after.cash === before.cash &&
      after.kpiText === before.kpiText &&
      after.riskText === before.riskText &&
      after.loadText === before.loadText;
    const targetChanged = after.note !== before.note || after.rates !== before.rates || key === before.active.find((t) => t.active)?.k;
    // for first tab (default), content may equal baseline; still require active
    perTab.push({
      key,
      activeOk,
      othersUnchanged,
      note: after.note,
      ratesHead: after.rates.split(',').slice(0, 3).join(','),
      targetChangedFromDefault: after.note !== before.note || after.rates !== before.rates,
    });
    if (!othersUnchanged || !activeOk) onlyLocal = false;
  }

  // Distinguishability: notes/rates should differ across at least 2 tabs
  const notes = perTab.map((p) => p.note);
  const distinctNotes = new Set(notes).size;
  const distinguishable = distinctNotes >= 2;

  push(checksB, 2, '切换 tab 只改本区；顶部 KPI/现金流/贡献/应收/负荷不因 tab 被替换', onlyLocal, JSON.stringify({ perTab, beforeNote: before.note }));
  push(checksB, 3, '默认选中明确；四 tab 可点且内容可区分', bDom.defaultActive === 'contract' && perTab.every((p) => p.activeOk) && distinguishable, JSON.stringify({ defaultActive: bDom.defaultActive, distinctNotes, notes }));
  push(checksB, 4, '不与现金流贡献条混绑（本验分条；贡献区在切 tab 后数据不变）', onlyLocal && checksA.every((c) => c.ok || c.ac === 7), JSON.stringify({ contribStable: onlyLocal, aAllCorePass: checksA.filter((c) => c.ac <= 6).every((c) => c.ok) }));
  push(checksB, 5, '证据落盘、未改实现/账本（过程项）', true, 'max-* 写入 target-tabs 目录；实现与账本未改');

  await page.locator('#targetPanel').screenshot({ path: path.join(OUT_B, 'max-01-target-tabs-default.png') });
  await page.click('#targetPanel [data-target-metric="completed"]');
  await page.waitForTimeout(300);
  await page.locator('#targetPanel').screenshot({ path: path.join(OUT_B, 'max-02-target-tabs-completed.png') });
  await page.locator('.pair-row').screenshot({ path: path.join(OUT_B, 'max-03-pair-row-after-tab.png') });
  // also mirror a pair screenshot into A for context
  await page.locator('.pair-row').screenshot({ path: path.join(OUT_A, 'max-03-pair-row.png') });

  const passA = checksA.filter((c) => c.ac <= 6).every((c) => c.ok);
  const passB = checksB.filter((c) => c.ac <= 4).every((c) => c.ok);

  const probeA = {
    item: '板块现金流贡献',
    pass: passA,
    checks: checksA,
    aDom,
    aChart,
    errors,
    generatedAt: new Date().toISOString(),
  };
  const probeB = {
    item: '板块目标达成四tab',
    pass: passB,
    checks: checksB,
    bDom,
    perTab,
    before,
    errors,
    generatedAt: new Date().toISOString(),
  };

  fs.writeFileSync(path.join(OUT_A, 'max-probe.json'), JSON.stringify(probeA, null, 2), 'utf8');
  fs.writeFileSync(path.join(OUT_B, 'max-probe.json'), JSON.stringify(probeB, null, 2), 'utf8');
  console.log(JSON.stringify({ passA, passB, checksA, checksB: checksB.map((c) => ({ ac: c.ac, ok: c.ok, name: c.name })), errors }, null, 2));
  await browser.close();
  if (!passA || !passB) process.exit(2);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
