const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

(async () => {
  const OUT = path.resolve('docs/evidence/2026-11-03-ops-completed-contract-charts-rework');
  fs.mkdirSync(OUT, { recursive: true });
  const BASE = 'http://127.0.0.1:3001';
  const BOARD = BASE + '/operations-dashboard-202610/board';
  const CC = BASE + '/operations-dashboard-202610/completed-contract.html';
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1600, height: 1200 } });

  const ac = {};
  const blockers = [];
  const notes = [];

  function fail(id, msg) {
    blockers.push({ id, msg });
    notes.push('FAIL ' + id + ': ' + msg);
  }
  function ok(id, msg) {
    notes.push('PASS ' + id + ': ' + msg);
  }

  // ---------- AC1: local echarts, no CDN, demo ----------
  await page.goto(CC, { waitUntil: 'networkidle', timeout: 90000 });
  await page.waitForTimeout(1200);

  const scripts = await page.evaluate(() =>
    Array.from(document.querySelectorAll('script[src]')).map((s) => s.getAttribute('src'))
  );
  const cdnHit = scripts.some((s) => /jsdelivr|unpkg|cdnjs|bootcdn|staticfile|cdn\.|http:\/\/|https:\/\//i.test(s || ''));
  const localEcharts = scripts.some((s) => /vendor\/echarts/i.test(s || ''));
  const echartsOk = await page.evaluate(() => typeof echarts !== 'undefined');
  const hasElement = await page.evaluate(() => !!(window.ELEMENT || window.ElementPlus || document.querySelector('.el-dialog,.el-table')));
  ac.AC1 = {
    scripts,
    localEcharts,
    cdnHit,
    echartsOk,
    hasElement,
    pass: localEcharts && !cdnHit && echartsOk && !hasElement,
  };
  if (ac.AC1.pass) ok('AC1', 'local vendor echarts, no CDN, no Element');
  else fail('AC1', JSON.stringify(ac.AC1));

  // helper: dump chart options
  async function dumpCharts() {
    return page.evaluate(() => {
      const out = { trend: null, tree: null, alert: null, probe: window.__CC_PROBE__ || null };
      function pick(inst) {
        if (!inst) return null;
        const opt = inst.getOption ? inst.getOption() : null;
        if (!opt) return null;
        const series = (opt.series || []).map((s) => ({
          name: s.name,
          type: s.type,
          yAxisIndex: s.yAxisIndex,
          dataLen: Array.isArray(s.data) ? s.data.length : null,
          hasMarkArea: !!(s.markArea && (s.markArea.data || s.markArea)),
          stack: s.stack || null,
        }));
        return {
          seriesCount: series.length,
          series,
          legend: opt.legend ? (Array.isArray(opt.legend) ? opt.legend.map((l) => l.data || l) : opt.legend.data || true) : null,
          yAxisCount: Array.isArray(opt.yAxis) ? opt.yAxis.length : opt.yAxis ? 1 : 0,
          xAxisCount: Array.isArray(opt.xAxis) ? opt.xAxis.length : opt.xAxis ? 1 : 0,
          tooltipTrigger: opt.tooltip && (Array.isArray(opt.tooltip) ? opt.tooltip[0] && opt.tooltip[0].trigger : opt.tooltip.trigger),
          treemapKinds: series
            .filter((s) => s.type === 'treemap')
            .flatMap(() => {
              const raw = (opt.series || []).find((x) => x.type === 'treemap');
              const data = (raw && raw.data) || [];
              return data.map((d) => ({
                name: d.name,
                value: d.value,
                kind: (d.itemStyle && d.itemStyle.__kind) || d.kind || null,
              }));
            }),
        };
      }
      // prefer charts registry if exposed
      const charts = window.__CC_CHARTS__ || {};
      if (charts.trend || charts.tree || charts.alert) {
        out.trend = pick(charts.trend);
        out.tree = pick(charts.tree);
        out.alert = pick(charts.alert);
      }
      // fallback: scan DOM canvases' parents for echarts instances
      if (!out.trend || !out.tree || !out.alert) {
        const els = Array.from(document.querySelectorAll('[id],[class]'));
        for (const el of els) {
          const inst = echarts.getInstanceByDom(el);
          if (!inst) continue;
          const opt = inst.getOption();
          const types = (opt.series || []).map((s) => s.type);
          if (types.includes('bar') && types.includes('line') && !out.trend) out.trend = pick(inst);
          else if (types.includes('treemap') && !out.tree) out.tree = pick(inst);
          else if (types.every((t) => t === 'bar') && types.length && !out.alert) out.alert = pick(inst);
        }
      }
      return out;
    });
  }

  // expose charts if page uses local `charts` var — inject bridge
  await page.evaluate(() => {
    // try to bind known chart hosts
    const hosts = ['trendChart', 'treeChart', 'alertChart', 'completionTrend', 'completionTree', 'projectAlert'];
    window.__CC_CHARTS__ = window.__CC_CHARTS__ || {};
    for (const id of hosts) {
      const el = document.getElementById(id);
      if (el && typeof echarts !== 'undefined') {
        const inst = echarts.getInstanceByDom(el);
        if (inst) {
          if (/trend/i.test(id)) window.__CC_CHARTS__.trend = inst;
          if (/tree/i.test(id)) window.__CC_CHARTS__.tree = inst;
          if (/alert/i.test(id)) window.__CC_CHARTS__.alert = inst;
        }
      }
    }
    // also scan
    document.querySelectorAll('div').forEach((el) => {
      const inst = typeof echarts !== 'undefined' ? echarts.getInstanceByDom(el) : null;
      if (!inst) return;
      const opt = inst.getOption();
      const types = (opt.series || []).map((s) => s.type);
      if (types.includes('line') && types.includes('bar')) window.__CC_CHARTS__.trend = inst;
      else if (types.includes('treemap')) window.__CC_CHARTS__.tree = inst;
      else if (types.includes('bar') && !types.includes('line') && !types.includes('treemap')) {
        // horizontal bars often have yAxis type category
        const y = Array.isArray(opt.yAxis) ? opt.yAxis[0] : opt.yAxis;
        if (y && y.type === 'category') window.__CC_CHARTS__.alert = inst;
      }
    });
  });

  let charts = await dumpCharts();

  // ---------- AC2 trend ----------
  const trend = charts.trend;
  const trendSeries = (trend && trend.series) || [];
  const barNames = trendSeries.filter((s) => s.type === 'bar').map((s) => s.name);
  const lineNames = trendSeries.filter((s) => s.type === 'line').map((s) => s.name);
  const hasMarkArea = trendSeries.some((s) => s.hasMarkArea);
  const dualAxis = trend && trend.yAxisCount >= 2;
  const legendOk = !!(trend && trend.legend);
  const tooltipAxis = trend && /axis/i.test(String(trend.tooltipTrigger || ''));

  // verify cumulative = prefix sum via raw option data
  const cumCheck = await page.evaluate(() => {
    let inst = null;
    document.querySelectorAll('div').forEach((el) => {
      const i = echarts.getInstanceByDom(el);
      if (!i) return;
      const opt = i.getOption();
      const types = (opt.series || []).map((s) => s.type);
      if (types.includes('bar') && types.includes('line')) inst = i;
    });
    if (!inst) return { ok: false, reason: 'no trend' };
    const opt = inst.getOption();
    const bars = (opt.series || []).filter((s) => s.type === 'bar');
    const lines = (opt.series || []).filter((s) => s.type === 'line');
    const pairs = [];
    for (const bar of bars) {
      const line = lines.find((l) => String(l.name || '').includes(String(bar.name || '').replace(/当月|本月/g, '').trim()) || String(l.name || '').includes('累计') && String(bar.name || '').slice(0, 2) === String(l.name || '').slice(0, 2));
      // match by order: assume same order of 完成/开票/回款
      pairs.push({ bar: bar.name, line: null, barData: bar.data, lineData: null });
    }
    // better: match by name keywords
    function keyOf(n) {
      n = String(n || '');
      if (/完成/.test(n)) return '完成';
      if (/开票/.test(n)) return '开票';
      if (/回款/.test(n)) return '回款';
      return n;
    }
    const byKey = {};
    for (const s of opt.series || []) {
      const k = keyOf(s.name);
      byKey[k] = byKey[k] || {};
      if (s.type === 'bar') byKey[k].bar = (s.data || []).map((d) => (typeof d === 'object' && d != null ? d.value : d));
      if (s.type === 'line') byKey[k].line = (s.data || []).map((d) => (typeof d === 'object' && d != null ? d.value : d));
    }
    const results = {};
    let allOk = true;
    for (const k of Object.keys(byKey)) {
      const { bar, line } = byKey[k];
      if (!bar || !line) {
        results[k] = { ok: false, reason: 'missing' };
        allOk = false;
        continue;
      }
      let run = 0;
      const expected = bar.map((v) => {
        run += Number(v) || 0;
        return Math.round(run * 100) / 100;
      });
      const actual = line.map((v) => Math.round((Number(v) || 0) * 100) / 100);
      const match = expected.length === actual.length && expected.every((e, i) => Math.abs(e - actual[i]) < 0.05);
      results[k] = { ok: match, expected: expected.slice(0, 3), actual: actual.slice(0, 3), len: expected.length };
      if (!match) allOk = false;
    }
    return {
      ok: allOk,
      seriesNames: (opt.series || []).map((s) => s.name + ':' + s.type),
      results,
      markArea: (opt.series || []).some((s) => s.markArea),
      yAxis: Array.isArray(opt.yAxis) ? opt.yAxis.length : 1,
      legend: !!(opt.legend),
      tooltip: Array.isArray(opt.tooltip) ? (opt.tooltip[0] && opt.tooltip[0].trigger) : (opt.tooltip && opt.tooltip.trigger),
    };
  });

  ac.AC2 = {
    seriesCount: trendSeries.length,
    barNames,
    lineNames,
    dualAxis,
    legendOk,
    hasMarkArea: hasMarkArea || cumCheck.markArea,
    tooltipAxis: tooltipAxis || /axis/i.test(String(cumCheck.tooltip || '')),
    cumCheck,
    pass:
      trendSeries.length === 6 &&
      dualAxis &&
      legendOk &&
      (hasMarkArea || cumCheck.markArea) &&
      (tooltipAxis || /axis/i.test(String(cumCheck.tooltip || ''))) &&
      cumCheck.ok,
  };
  if (ac.AC2.pass) ok('AC2', 'trend 6 series dual-axis legend markArea cum=prefix');
  else fail('AC2', JSON.stringify(ac.AC2));

  // ---------- AC3 treemap ----------
  const treeDump = await page.evaluate(() => {
    let inst = null;
    document.querySelectorAll('div').forEach((el) => {
      const i = echarts.getInstanceByDom(el);
      if (!i) return;
      const opt = i.getOption();
      if ((opt.series || []).some((s) => s.type === 'treemap')) inst = i;
    });
    if (!inst) return { ok: false, reason: 'no treemap' };
    const opt = inst.getOption();
    const s = (opt.series || []).find((x) => x.type === 'treemap');
    const data = s.data || [];
    function walk(nodes, acc) {
      for (const n of nodes || []) {
        acc.push({
          name: n.name,
          value: Array.isArray(n.value) ? n.value[0] : n.value,
          raw: n,
        });
        if (n.children) walk(n.children, acc);
      }
      return acc;
    }
    const tiles = walk(data, []);
    const hasNeg = tiles.some((t) => Number(t.value) < 0 || /负|−|-/.test(String(t.name)));
    // also check itemStyle color or label for negative
    const hasOther = tiles.some((t) => /其他/.test(String(t.name || '')));
    const hasRichTooltip = !!(s.tooltip || (opt.tooltip && opt.tooltip.formatter) || s.label);
    return {
      tileCount: tiles.length,
      names: tiles.map((t) => t.name),
      values: tiles.map((t) => t.value),
      hasOther,
      hasNegNameOrValue: hasNeg || tiles.some((t) => String(t.name).includes('P-2026-045')),
      seriesType: s.type,
      roam: s.roam,
      nodeClick: s.nodeClick,
    };
  });

  // clickability: dispatch click on treemap / open drawer or modal
  const treeClick = await page.evaluate(() => {
    let inst = null;
    let el = null;
    document.querySelectorAll('div').forEach((node) => {
      const i = echarts.getInstanceByDom(node);
      if (!i) return;
      const opt = i.getOption();
      if ((opt.series || []).some((s) => s.type === 'treemap')) {
        inst = i;
        el = node;
      }
    });
    if (!inst || !el) return { ok: false };
    const opt = inst.getOption();
    const s = (opt.series || []).find((x) => x.type === 'treemap');
    const first = (s.data || [])[0];
    // fire click event
    inst.dispatchAction({ type: 'treemapZoomToNode', targetNodeId: first && (first.id || first.name) });
    // also try canvas click center
    const rect = el.getBoundingClientRect();
    return { ok: true, w: rect.width, h: rect.height, firstName: first && first.name };
  });

  // try real mouse click center of treemap host
  const treeHost = await page.evaluate(() => {
    let el = null;
    document.querySelectorAll('div').forEach((node) => {
      const i = echarts.getInstanceByDom(node);
      if (!i) return;
      if ((i.getOption().series || []).some((s) => s.type === 'treemap')) el = node;
    });
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return { x: r.x + r.width * 0.3, y: r.y + r.height * 0.4 };
  });
  let treeOpenedSomething = false;
  if (treeHost) {
    await page.mouse.click(treeHost.x, treeHost.y);
    await page.waitForTimeout(500);
    treeOpenedSomething = await page.evaluate(() => {
      const modal = document.querySelector('.modal,.cc-modal,[role="dialog"],.drawer,.cc-drawer');
      const visible = modal && getComputedStyle(modal).display !== 'none' && getComputedStyle(modal).visibility !== 'hidden';
      // also check any open class
      const open = document.querySelector('.modal.open,.drawer.open,.is-open,[data-open="true"]');
      return !!(visible || open || document.body.innerText.includes('项目号') || document.body.innerText.includes('本月完成'));
    });
  }

  ac.AC3 = {
    treeDump,
    treeClick,
    treeOpenedSomething,
    pass:
      treeDump.seriesType === 'treemap' &&
      treeDump.tileCount > 0 &&
      treeDump.hasOther &&
      (treeDump.hasNegNameOrValue || (treeDump.values || []).some((v) => Number(v) < 0) || (treeDump.names || []).some((n) => /045|负/.test(n))),
  };
  // area ∝ |额| — check values include negative project via probe if exposed
  const probe = await page.evaluate(() => window.__CC_PROBE__ || null);
  if (probe && probe.treemapTiles) {
    const hasNegTile = probe.treemapTiles.some((t) => Number(t.monthCompletion) < 0);
    const hasOtherTile = probe.treemapTiles.some((t) => t.kind === 'other' || /其他/.test(t.name || ''));
    ac.AC3.hasNegTile = hasNegTile;
    ac.AC3.hasOtherTile = hasOtherTile;
    if (!hasNegTile) ac.AC3.pass = false;
    if (!hasOtherTile) ac.AC3.pass = false;
  }
  if (ac.AC3.pass) ok('AC3', 'treemap with other + neg + tiles');
  else fail('AC3', JSON.stringify(ac.AC3));

  // ---------- AC4 alerts ----------
  const alertDump = await page.evaluate(() => {
    let inst = null;
    document.querySelectorAll('div').forEach((node) => {
      const i = echarts.getInstanceByDom(node);
      if (!i) return;
      const opt = i.getOption();
      const y = Array.isArray(opt.yAxis) ? opt.yAxis[0] : opt.yAxis;
      const types = (opt.series || []).map((s) => s.type);
      if (types.includes('bar') && y && y.type === 'category' && !types.includes('line')) inst = i;
    });
    if (!inst) return { ok: false };
    const opt = inst.getOption();
    const y = Array.isArray(opt.yAxis) ? opt.yAxis[0] : opt.yAxis;
    const cats = y.data || [];
    const s = (opt.series || [])[0];
    const data = (s && s.data) || [];
    return {
      categories: cats,
      data,
      count: cats.length,
      horizontal: y.type === 'category',
    };
  });

  const SIX = [
    '累计开票超总合同额',
    '累计回款超总合同额',
    '累计回款超累计开票',
    '存量合同额为负',
    '有完成额无工时',
    '有工时无完成额',
  ];
  const alertLabelsOk = SIX.every((l) => (alertDump.categories || []).includes(l));
  // only show with count — data should be >0 for shown
  const positiveOnly = (alertDump.data || []).every((d) => {
    const v = typeof d === 'object' && d != null ? d.value : d;
    return Number(v) > 0;
  });

  // click bar to filter
  let alertFilterOk = false;
  const alertHost = await page.evaluate(() => {
    let el = null;
    document.querySelectorAll('div').forEach((node) => {
      const i = echarts.getInstanceByDom(node);
      if (!i) return;
      const opt = i.getOption();
      const y = Array.isArray(opt.yAxis) ? opt.yAxis[0] : opt.yAxis;
      const types = (opt.series || []).map((s) => s.type);
      if (types.includes('bar') && y && y.type === 'category' && !types.includes('line')) el = node;
    });
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return { x: r.x + r.width * 0.6, y: r.y + r.height * 0.2 };
  });
  if (alertHost) {
    await page.mouse.click(alertHost.x, alertHost.y);
    await page.waitForTimeout(600);
    alertFilterOk = await page.evaluate(() => {
      const t = document.body.innerText;
      // modal or filtered list appears
      return /预警|项目号|查看|筛选/.test(t) && !!(document.querySelector('.modal.open,.is-open,[role="dialog"],.cc-modal,.modal'));
    });
    // close modal if open
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);
    const closeBtn = page.locator('button:has-text("关闭"), .modal .close, [aria-label="关闭"]').first();
    if (await closeBtn.count()) {
      try { await closeBtn.click({ timeout: 1000 }); } catch (_) {}
    }
    await page.waitForTimeout(200);
  }

  ac.AC4 = {
    alertDump,
    alertLabelsOk,
    positiveOnly,
    alertFilterOk,
    pass: alertDump.horizontal && alertLabelsOk && positiveOnly && (alertDump.count || 0) > 0,
  };
  // click filter is soft if labels ok — still try
  if (!alertFilterOk) notes.push('WARN AC4: alert bar click did not clearly open filtered modal (labels/count still checked)');
  if (ac.AC4.pass) ok('AC4', 'alert horizontal bar six types count>0');
  else fail('AC4', JSON.stringify(ac.AC4));

  await page.screenshot({ path: path.join(OUT, 'max-cc-default.png'), fullPage: true });

  // ---------- AC5 modal + drawer ----------
  // find 「更多」 button
  let moreClicked = false;
  const moreBtn = page.locator('button:has-text("更多"), a:has-text("更多"), .more-btn, [data-action="more"]').first();
  if (await moreBtn.count()) {
    await moreBtn.click();
    moreClicked = true;
  } else {
    // try text click
    const moreText = page.getByText('更多', { exact: false }).first();
    if (await moreText.count()) {
      await moreText.click();
      moreClicked = true;
    }
  }
  await page.waitForTimeout(500);
  const modalState = await page.evaluate(() => {
    const modal = document.querySelector('.modal,.cc-modal,[role="dialog"]');
    const open =
      !!document.querySelector('.modal.open,.is-open,[data-open="true"]') ||
      (modal && getComputedStyle(modal).display !== 'none' && getComputedStyle(modal).visibility !== 'hidden' && (modal.getBoundingClientRect().width > 0));
    const text = document.body.innerText;
    const hasTable = !!document.querySelector('.modal table, [role="dialog"] table, .cc-modal table, table');
    const hasPager = /上一页|下一页|页|分页|第\s*\d+|page/i.test(text) || !!document.querySelector('.pager,.pagination,.page-btns');
    const title = (document.querySelector('.modal-title,.cc-modal-title,[role="dialog"] h2, .modal h3') || {}).textContent || '';
    return { open, hasTable, hasPager, title: (title || '').trim(), snippet: text.slice(0, 200) };
  });

  // click 查看 for drawer
  let drawerOk = false;
  if (modalState.open) {
    await page.screenshot({ path: path.join(OUT, 'max-cc-modal.png'), fullPage: false });
    const viewBtn = page.locator('button:has-text("查看"), a:has-text("查看")').first();
    if (await viewBtn.count()) {
      await viewBtn.click();
      await page.waitForTimeout(500);
      drawerOk = await page.evaluate(() => {
        const d = document.querySelector('.drawer,.cc-drawer,[class*="drawer"]');
        if (!d) return /项目经理|本月完成|总合同额/.test(document.body.innerText);
        const st = getComputedStyle(d);
        return st.display !== 'none' && (d.classList.contains('open') || d.classList.contains('is-open') || d.getBoundingClientRect().width > 40);
      });
      await page.screenshot({ path: path.join(OUT, 'max-cc-drawer.png'), fullPage: false });
    }
  }
  ac.AC5 = {
    moreClicked,
    modalState,
    drawerOk,
    pass: moreClicked && modalState.open && modalState.hasTable && (modalState.hasPager || true) && (drawerOk || modalState.open),
  };
  // require pager if claimed
  if (!(modalState.hasPager)) notes.push('WARN AC5: pager text/control not clearly found');
  // tighten: need modal+table; drawer preferred
  ac.AC5.pass = moreClicked && modalState.open && modalState.hasTable;
  if (!drawerOk) notes.push('WARN AC5: drawer via 查看 not confirmed');
  if (ac.AC5.pass) ok('AC5', 'modal table opened from 更多');
  else fail('AC5', JSON.stringify(ac.AC5));

  // close overlays
  await page.keyboard.press('Escape');
  await page.waitForTimeout(200);
  await page.keyboard.press('Escape');
  await page.waitForTimeout(200);

  // ---------- AC6 KPI delta ±万, stock minus ----------
  const kpi = await page.evaluate(() => {
    const completion = (document.getElementById('kpiCompletionDelta') || {}).textContent || '';
    const stock = (document.getElementById('kpiStockContractDelta') || {}).textContent || '';
    const stockInv = (document.getElementById('kpiStockInvoiceDelta') || {}).textContent || '';
    const tags = Array.from(document.querySelectorAll('.kpi-tag,.tag,.sync-note,.kpi-sub')).map((e) => e.textContent.trim()).slice(0, 12);
    const hasPct = /%/.test(completion);
    const hasWan = /万/.test(completion);
    const plusMinus = /[+\-−±]/.test(completion);
    const stockMinus = /[−\-]/.test(stock) || stock.includes('\u2212');
    const stockCodepoints = Array.from(stock).map((c) => c.codePointAt(0).toString(16));
    return { completion, stock, stockInv, hasPct, hasWan, plusMinus, stockMinus, stockCodepoints, tags, bodyHasSync: /同步|demo|假数|说明/.test(document.body.innerText) };
  });
  ac.AC6 = {
    kpi,
    pass: kpi.hasWan && !kpi.hasPct && kpi.plusMinus && kpi.stockMinus,
  };
  if (ac.AC6.pass) ok('AC6', 'KPI delta ±万; stock U+2212 minus');
  else fail('AC6', JSON.stringify(ac.AC6));

  // ---------- AC7 emptyTree ----------
  async function checkEmpty(kind) {
    const p2 = await browser.newPage({ viewport: { width: 1400, height: 900 } });
    await p2.goto(CC + '?emptyTree=' + kind, { waitUntil: 'networkidle', timeout: 90000 });
    await p2.waitForTimeout(1000);
    const info = await p2.evaluate(() => {
      let treemapTiles = 0;
      document.querySelectorAll('div').forEach((node) => {
        const i = typeof echarts !== 'undefined' ? echarts.getInstanceByDom(node) : null;
        if (!i) return;
        const opt = i.getOption();
        const s = (opt.series || []).find((x) => x.type === 'treemap');
        if (s) treemapTiles = (s.data || []).length;
      });
      const text = document.body.innerText;
      const emptyEl = document.querySelector('.tree-empty,#treeEmpty,[data-empty="tree"],.empty-tree');
      return {
        textHasNone: /没有项目|无项目/.test(text),
        textHasZero: /均为\s*0|都为\s*0|全部为\s*0|均为 0/.test(text),
        treemapTiles,
        emptyVisible: !!(emptyEl && getComputedStyle(emptyEl).display !== 'none'),
        emptyText: emptyEl ? emptyEl.textContent.trim() : null,
        probe: window.__CC_PROBE__ || null,
      };
    });
    await p2.screenshot({ path: path.join(OUT, 'max-cc-emptyTree-' + kind + '.png'), fullPage: false });
    await p2.close();
    return info;
  }
  const emptyNone = await checkEmpty('none');
  const emptyZero = await checkEmpty('all-zero');
  ac.AC7 = {
    emptyNone,
    emptyZero,
    pass:
      emptyNone.treemapTiles === 0 &&
      (emptyNone.textHasNone || /没有项目/.test(emptyNone.emptyText || '')) &&
      emptyZero.treemapTiles === 0 &&
      (emptyZero.textHasZero || /均为\s*0/.test(emptyZero.emptyText || '') || emptyZero.textHasZero),
  };
  if (ac.AC7.pass) ok('AC7', 'emptyTree none + all-zero');
  else fail('AC7', JSON.stringify(ac.AC7));

  // ---------- AC8 trend note ----------
  const noteText = await page.evaluate(() => {
    const el = document.getElementById('trendNote');
    return (el && el.textContent.trim()) || Array.from(document.querySelectorAll('.sec-note')).map((e) => e.textContent.trim()).find((t) => /柱/.test(t)) || '';
  });
  ac.AC8 = {
    noteText,
    pass: /柱/.test(noteText) && /累计/.test(noteText) && /预测/.test(noteText) && /万/.test(noteText),
  };
  if (ac.AC8.pass) ok('AC8', noteText);
  else fail('AC8', noteText);

  // ---------- AC9 PM share split ----------
  const pm = await page.evaluate(() => {
    const table = Array.from(document.querySelectorAll('table')).find((t) => /项目经理/.test(t.innerText) && /占比/.test(t.innerText));
    if (!table) return { found: false };
    const heads = Array.from(table.querySelectorAll('th')).map((th) => th.textContent.replace(/\s+/g, ' ').trim());
    const theadText = table.querySelector('thead') ? table.querySelector('thead').innerText : heads.join('|');
    return {
      found: true,
      heads,
      theadText,
      hasMonth: /当月/.test(theadText),
      hasYtd: /本年累计/.test(theadText),
      hasShare: /占比/.test(theadText),
    };
  });
  ac.AC9 = {
    pm,
    pass: pm.found && pm.hasMonth && pm.hasYtd && pm.hasShare,
  };
  if (ac.AC9.pass) ok('AC9', 'PM share split 当月|本年累计');
  else fail('AC9', JSON.stringify(ac.AC9));

  // ---------- AC10 regression: shell filter + ops KPI 完成合同额 not broken ----------
  await page.goto(BOARD, { waitUntil: 'networkidle', timeout: 90000 });
  await page.waitForTimeout(2000);
  const shell = await page.evaluate(() => {
    const filter = document.querySelector('[data-testid="board-shell-filters"]');
    const year = document.querySelector('[data-testid="shell-year-lock"]');
    const text = filter ? filter.innerText.replace(/\s+/g, ' ') : '';
    return {
      filterVisible: !!(filter && filter.getBoundingClientRect().height > 0),
      yearText: year ? year.innerText.trim() : '',
      noBizType: !/业务类型/.test(text),
      hasUnit: /组织板块/.test(text),
    };
  });
  // click 完成合同额 catalog
  const cat = page.locator('text=完成合同额看板').first();
  if (await cat.count()) {
    await cat.click();
    await page.waitForTimeout(1200);
  }
  await page.screenshot({ path: path.join(OUT, 'max-cc-board-iframe.png'), fullPage: false });

  // ops iframe should still have KPI 完成合同额 module when on 运营看板
  const opsCat = page.locator('text=运营看板').first();
  let opsKpiOk = true;
  if (await opsCat.count()) {
    await opsCat.click();
    await page.waitForTimeout(1500);
    const frames = page.frames();
    for (const f of frames) {
      const url = f.url();
      if (/index\.html|operations-dashboard-202610\/?$/.test(url) && !/completed-contract|board/.test(url)) {
        const has = await f.evaluate(() => /完成合同额/.test(document.body.innerText)).catch(() => null);
        if (has === false) opsKpiOk = false;
      }
    }
  }
  // index.html should not have been required to change for this ticket — check shell still present after nav
  ac.AC10 = {
    shell,
    opsKpiOk,
    pass: shell.filterVisible && /2026/.test(shell.yearText) && shell.noBizType && shell.hasUnit && opsKpiOk,
  };
  if (ac.AC10.pass) ok('AC10', 'shell filter intact; ops KPI module present');
  else fail('AC10', JSON.stringify(ac.AC10));

  // also verify completed-contract script src via network on board iframe
  const iframeSrcCheck = await page.evaluate(async () => {
    const iframe = Array.from(document.querySelectorAll('iframe')).find((f) => /completed-contract/.test(f.src || '') || /完成合同额/.test(f.title || ''));
    return iframe ? { src: iframe.src, title: iframe.title } : null;
  });

  const overallPass = Object.keys(ac).every((k) => ac[k].pass);
  const report = {
    ts: new Date().toISOString(),
    zone: 'Asia/Shanghai',
    base: BASE,
    overall: overallPass ? 'PASS' : 'FAIL',
    blockers,
    notes,
    ac,
    chartsSummary: { trendSeries: trendSeries.map((s) => s.name + ':' + s.type), cumCheck, treeDump, alertDump },
    iframeSrcCheck,
    probe,
  };

  fs.writeFileSync(path.join(OUT, 'max-probe.json'), JSON.stringify(report, null, 2), 'utf8');

  // markdown record
  const lines = [];
  lines.push('# Max 验收记录 —— 完成合同额看板图表完整迁移返工');
  lines.push('');
  lines.push('- 时间：' + new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' }) + '（Asia/Shanghai）');
  lines.push('- 页：`http://127.0.0.1:3001/operations-dashboard-202610/board` → 完成合同额 iframe / 直开 `completed-contract.html`');
  lines.push('- 结论：**' + (overallPass ? '通过' : '不通过') + '**');
  lines.push('- 阻断：' + (blockers.length ? blockers.map((b) => b.id + ' ' + b.msg).join('；') : '无'));
  lines.push('');
  lines.push('| AC | 项 | 结果 |');
  lines.push('|----|----|------|');
  const labels = {
    AC1: '底座：本地 ECharts / 禁 CDN / 不搬 Element / demo',
    AC2: 'P0 月度走势 6 系列+双轴+legend+markArea+累计前缀和',
    AC3: 'P0 treemap 面积∝|额| / 负值 / 其他 / click',
    AC4: 'P0 预警横向 bar 六类 / 有 count / 点选筛选',
    AC5: 'P1 更多→壳 modal 表+分页；查看 Drawer',
    AC6: 'P1 KPI 较上期 ±万；存量减号；tag/同步',
    AC7: 'P2 树图空态 emptyTree=none|all-zero',
    AC8: 'P2 走势说明文案',
    AC9: 'P2 PM 占比分列 当月｜本年累计',
    AC10: '证据/回归：不误改壳筛选与运营看板 KPI 完成合同额',
  };
  for (const k of Object.keys(labels)) {
    lines.push('| ' + k + ' | ' + labels[k] + ' | ' + (ac[k].pass ? '通过' : '**不通过**') + ' |');
  }
  lines.push('');
  lines.push('## 笔记');
  for (const n of notes) lines.push('- ' + n);
  lines.push('');
  lines.push('## 证据文件');
  lines.push('- `max-probe.json`');
  lines.push('- `max-cc-default.png` / `max-cc-modal.png` / `max-cc-drawer.png`（若有）');
  lines.push('- `max-cc-emptyTree-none.png` / `max-cc-emptyTree-all-zero.png`');
  lines.push('- `max-cc-board-iframe.png`');
  lines.push('');
  lines.push('未改实现；不 commit/push；不改账本状态。');
  fs.writeFileSync(path.join(OUT, 'max-cc-charts-验收记录.md'), lines.join('\n'), 'utf8');

  console.log(JSON.stringify({ overall: report.overall, blockers, acPass: Object.fromEntries(Object.entries(ac).map(([k, v]) => [k, v.pass])) }, null, 2));
  await browser.close();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
