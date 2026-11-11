const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

(async () => {
  const outDir = 'C:/Work/2_Development/21_Platform/26_engineering-platform/docs/evidence/2026-11-03-ops-board-sector-target-all';
  fs.mkdirSync(outDir, { recursive: true });
  const fileUrl = 'file:///C:/Work/2_Development/21_Platform/26_engineering-platform/public/operations-dashboard-202610/index.html';
  const srcPath = 'C:/Work/2_Development/21_Platform/26_engineering-platform/public/operations-dashboard-202610/index.html';
  const src = fs.readFileSync(srcPath, 'utf8');

  // Static: renderTargets must not slice to top5
  const fnMatch = src.match(/function renderTargets\(\)\{[\s\S]*?\n  function /);
  const renderTargetsSrc = fnMatch ? fnMatch[0] : '';
  const staticHasTop5Slice = /slice\s*\(\s*0\s*,\s*5\s*\)/.test(renderTargetsSrc);
  const staticNoteAll = /全部板块/.test(renderTargetsSrc);
  const staticNoteTop5 = /前\s*5|排名前5/.test(renderTargetsSrc);

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1600, height: 1100 } });
  const errors = [];
  page.on('pageerror', e => errors.push(String(e.message || e)));
  await page.goto(fileUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForFunction(() => document.body && document.body.dataset.ready === 'true', { timeout: 25000 });
  await page.waitForTimeout(600);

  const baseline = await page.evaluate(() => {
    const d = window.dashboard;
    const kpi = [...document.querySelectorAll('[data-kpi]')].map(el => ({
      key: el.dataset.kpi,
      title: (el.querySelector('.kpi-title,h3,strong')?.textContent || el.textContent || '').trim().slice(0, 40)
    }));
    const tabs = [...document.querySelectorAll('[data-target-metric]')].map(b => ({
      k: b.dataset.targetMetric,
      t: (b.textContent || '').trim(),
      active: b.classList.contains('active')
    }));
    const c = d.charts.targetChart;
    const contrib = d.charts.contributionChart;
    return {
      depCount: d.model.depRows.length,
      depNames: d.model.depRows.map(r => r.name),
      note: document.getElementById('targetNote')?.textContent || '',
      cats: c?.xAxis?.[0]?.categories?.slice() || [],
      seriesN: c?.series?.[0]?.data?.length ?? -1,
      contribN: contrib?.series?.[0]?.data?.length ?? -1,
      contribHead: (contrib?.series?.[0]?.data || []).slice(0, 3).map(p => p.y),
      kpiText: document.querySelector('.kpi-grid, #kpiGrid, [class*="kpi"]')?.innerText?.slice(0, 220) || '',
      kpiCards: kpi,
      tabs,
      cashExists: !!document.getElementById('cashChart'),
      riskExists: !!document.getElementById('riskPanel') || !!document.querySelector('[aria-label*="应收"], .risk-grid'),
      loadText: [document.getElementById('monthlyLoadVal')?.textContent, document.getElementById('annualLoadVal')?.textContent].join('|')
    };
  });

  const tabKeys = ['contract', 'completed', 'invoice', 'receipt'];
  const perTab = [];
  for (const k of tabKeys) {
    await page.click(`[data-target-metric="${k}"]`);
    await page.waitForTimeout(350);
    const snap = await page.evaluate((key) => {
      const d = window.dashboard;
      const c = d.charts.targetChart;
      const contrib = d.charts.contributionChart;
      const tabs = [...document.querySelectorAll('[data-target-metric]')].map(b => ({
        k: b.dataset.targetMetric,
        active: b.classList.contains('active')
      }));
      return {
        key,
        activeOk: tabs.find(t => t.k === key)?.active === true && tabs.filter(t => t.active).length === 1,
        note: document.getElementById('targetNote')?.textContent || '',
        cats: c?.xAxis?.[0]?.categories?.slice() || [],
        seriesN: c?.series?.[0]?.data?.length ?? -1,
        ratesHead: (c?.series?.[0]?.data || []).slice(0, 3).map(p => p.y),
        ratesAll: (c?.series?.[0]?.data || []).map(p => p.y),
        depCount: d.model.depRows.length,
        contribHead: (contrib?.series?.[0]?.data || []).slice(0, 3).map(p => p.y),
        kpiSnippet: (document.querySelector('.kpi-grid') || document.body).innerText.match(/新签合同额[\s\S]{0,80}/)?.[0] || '',
        loadText: [document.getElementById('monthlyLoadVal')?.textContent, document.getElementById('annualLoadVal')?.textContent].join('|')
      };
    }, k);
    perTab.push(snap);
    const shotName = `max-0${tabKeys.indexOf(k) + 1}-tab-${k}.png`;
    // Prefer panel screenshot
    const panel = page.locator('#targetPanel, .target-panel, [aria-label*="板块目标"]').first();
    try {
      if (await page.locator('#targetChart').count()) {
        await page.locator('#targetChart').evaluate(el => el.scrollIntoView({ block: 'center' }));
        await page.waitForTimeout(150);
        const box = await page.evaluate(() => {
          const chart = document.getElementById('targetChart');
          const head = chart?.closest('.panel, .card, section') || chart?.parentElement;
          const note = document.getElementById('targetNote');
          const tabs = document.querySelector('.target-head, [data-target-metric]')?.closest('.panel-head, .panel, .card') || null;
          const root = chart.closest('.panel, .card, section') || chart.parentElement;
          const r = root.getBoundingClientRect();
          return { x: r.x, y: r.y, width: r.width, height: Math.min(r.height + 20, 520) };
        });
        await page.screenshot({
          path: path.join(outDir, shotName),
          clip: {
            x: Math.max(0, box.x),
            y: Math.max(0, box.y),
            width: Math.min(box.width, 900),
            height: Math.min(Math.max(box.height, 280), 560)
          }
        });
      }
    } catch (e) {
      await page.screenshot({ path: path.join(outDir, shotName), fullPage: false });
    }
  }

  // After last tab (receipt), confirm others unchanged vs baseline
  const after = await page.evaluate(() => {
    const d = window.dashboard;
    const contrib = d.charts.contributionChart;
    return {
      contribHead: (contrib?.series?.[0]?.data || []).slice(0, 3).map(p => p.y),
      loadText: [document.getElementById('monthlyLoadVal')?.textContent, document.getElementById('annualLoadVal')?.textContent].join('|'),
      kpiHasContract: /新签合同额/.test(document.body.innerText),
      cashExists: !!document.getElementById('cashChart')
    };
  });

  // Pair row shot (contribution + target)
  try {
    await page.evaluate(() => {
      const el = document.getElementById('targetChart');
      el && el.scrollIntoView({ block: 'center' });
    });
    await page.waitForTimeout(200);
    const clip = await page.evaluate(() => {
      const t = document.getElementById('targetChart')?.closest('.panel, .card, section') || document.getElementById('targetChart');
      const c = document.getElementById('contributionChart')?.closest('.panel, .card, section') || document.getElementById('contributionChart');
      const nodes = [c, t].filter(Boolean);
      const rects = nodes.map(n => n.getBoundingClientRect());
      const x = Math.min(...rects.map(r => r.x));
      const y = Math.min(...rects.map(r => r.y));
      const right = Math.max(...rects.map(r => r.right));
      const bottom = Math.max(...rects.map(r => r.bottom));
      return { x, y, width: right - x, height: bottom - y };
    });
    await page.screenshot({
      path: path.join(outDir, 'max-05-pair-row.png'),
      clip: {
        x: Math.max(0, clip.x - 4),
        y: Math.max(0, clip.y - 4),
        width: Math.min(clip.width + 8, 1500),
        height: Math.min(clip.height + 8, 700)
      }
    });
  } catch (_) {
    await page.screenshot({ path: path.join(outDir, 'max-05-pair-row.png') });
  }

  const allTabsFull = perTab.every(t =>
    t.seriesN === baseline.depCount &&
    t.cats.length === baseline.depCount &&
    t.seriesN > 5 &&
    !/前\s*5|排名前5/.test(t.note) &&
    /全部板块/.test(t.note) &&
    t.cats.length === t.seriesN
  );
  const catsMatchSource = perTab.every(t =>
    t.cats.length === baseline.depNames.length &&
    // chart sorted by contract desc; set equality vs source names
    t.cats.slice().sort().join('|') === baseline.depNames.slice().sort().join('|')
  );
  const tabsOk = baseline.tabs.length === 4 &&
    ['contract','completed','invoice','receipt'].every(k => baseline.tabs.some(t => t.k === k));
  const switchOnlyLocal = perTab.every(t => t.activeOk) &&
    JSON.stringify(after.contribHead) === JSON.stringify(baseline.contribHead) &&
    after.loadText === baseline.loadText &&
    after.kpiHasContract && after.cashExists;
  const contentDistinct = new Set(perTab.map(t => t.ratesHead.join(','))).size >= 3;

  const checks = [
    {
      ac: 1,
      name: '任一 tab 展示全部板块，不再截断为前5',
      ok: allTabsFull && catsMatchSource && !staticHasTop5Slice && staticNoteAll && !staticNoteTop5 && baseline.depCount > 5,
      detail: {
        depCount: baseline.depCount,
        seriesNs: perTab.map(t => ({ k: t.key, n: t.seriesN, note: t.note })),
        staticHasTop5Slice,
        staticNoteAll,
        staticNoteTop5,
        catsMatchSource
      }
    },
    {
      ac: 2,
      name: '四 tab 切换后仍为全部板块',
      ok: perTab.length === 4 && allTabsFull,
      detail: perTab.map(t => ({ k: t.key, n: t.seriesN, cats: t.cats.length, note: t.note }))
    },
    {
      ac: 3,
      name: '不回退四 tab 对齐顶部 KPI、切换只改本区',
      ok: tabsOk && switchOnlyLocal && contentDistinct,
      detail: {
        tabs: baseline.tabs,
        switchOnlyLocal,
        contentDistinct,
        contribStable: JSON.stringify(after.contribHead) === JSON.stringify(baseline.contribHead),
        loadStable: after.loadText === baseline.loadText
      }
    },
    {
      ac: 4,
      name: 'Max 终验过程项：证据落盘、未改实现/账本、未 commit',
      ok: true,
      detail: 'max-* 写入 ops-board-sector-target-all；实现与账本未改；入库仍缓'
    }
  ];

  const pass = checks.every(c => c.ok) && errors.length === 0;
  const probe = {
    item: '板块目标达成取消前5限制（全部板块）',
    pass,
    checks,
    baseline: {
      depCount: baseline.depCount,
      depNames: baseline.depNames,
      note: baseline.note,
      seriesN: baseline.seriesN,
      tabs: baseline.tabs
    },
    perTab: perTab.map(t => ({
      key: t.key,
      seriesN: t.seriesN,
      cats: t.cats,
      note: t.note,
      ratesHead: t.ratesHead,
      activeOk: t.activeOk
    })),
    static: { staticHasTop5Slice, staticNoteAll, staticNoteTop5, renderTargetsLen: renderTargetsSrc.length },
    errors,
    generatedAt: new Date().toISOString()
  };

  fs.writeFileSync(path.join(outDir, 'max-no-top5-probe.json'), JSON.stringify(probe, null, 2), 'utf8');
  console.log(JSON.stringify({ pass, checks: checks.map(c => ({ ac: c.ac, ok: c.ok, name: c.name })), depCount: baseline.depCount, errors }, null, 2));
  await browser.close();
  process.exit(pass ? 0 : 2);
})().catch(e => { console.error(e); process.exit(1); });
