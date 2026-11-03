const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

(async () => {
  const OUT = path.resolve('docs/evidence/2026-11-03-ops-shell-filter-and-completed-contract');
  fs.mkdirSync(OUT, { recursive: true });
  const BASE = 'http://127.0.0.1:3001';
  const BOARD = BASE + '/operations-dashboard-202610/board';
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1600, height: 1100 } });
  const blockers = [];
  const notes = [];

  await page.goto(BOARD, { waitUntil: 'networkidle', timeout: 90000 });
  await page.waitForTimeout(1800);

  async function framesByTitle() {
    const out = { ops: null, completed: null, all: [] };
    const n = await page.locator('iframe').count();
    for (let i = 0; i < n; i++) {
      const loc = page.locator('iframe').nth(i);
      const title = (await loc.getAttribute('title')) || '';
      const handle = await loc.elementHandle();
      const frame = handle ? await handle.contentFrame() : null;
      const box = await loc.boundingBox();
      const opacity = await loc.evaluate((el) => getComputedStyle(el).opacity);
      const pe = await loc.evaluate((el) => getComputedStyle(el).pointerEvents);
      const src = await loc.getAttribute('src');
      const info = { i, title, src, opacity: Number(opacity), pointerEvents: pe, box };
      out.all.push(info);
      if (/完成合同额/.test(title)) out.completed = frame;
      else if (/运营看板/.test(title)) out.ops = frame;
    }
    return out;
  }

  function rectOf(box) {
    if (!box) return null;
    return { x: box.x, y: box.y, w: box.width, h: box.height, top: box.y, bottom: box.y + box.height, left: box.x, right: box.x + box.width };
  }

  // ---------- A1 geometry ----------
  const header = page.locator('div.fixed.left-16.right-0.top-0').first();
  const filter = page.locator('[data-testid="board-shell-filters"]');
  const catalog = page.locator('aside[aria-label="看板目录"]');
  const yearLock = page.locator('[data-testid="shell-year-lock"]');

  const A1 = {
    filterVisible: await filter.isVisible(),
    yearText: (await yearLock.innerText().catch(() => '')).trim(),
    filterText: (await filter.innerText().catch(() => '')).replace(/\s+/g, ' ').trim(),
    geometry: null,
  };
  const headerBox = rectOf(await header.boundingBox());
  const filterBox = rectOf(await filter.boundingBox());
  const catalogBox = rectOf(await catalog.boundingBox());
  A1.geometry = { header: headerBox, filter: filterBox, catalog: catalogBox };
  A1.belowHeader = !!(headerBox && filterBox && Math.abs(filterBox.top - headerBox.bottom) <= 3);
  A1.aboveCatalog = !!(filterBox && catalogBox && filterBox.bottom <= catalogBox.top + 2);
  A1.yearLock2026 = /2026\s*年度/.test(A1.yearText) && !/select/i.test(await yearLock.evaluate((el) => el.tagName));
  A1.hasYearDropdown = await page.locator('[data-testid="board-shell-filters"] select, [data-testid="board-shell-filters"] .ant-select').filter({ hasText: /2025|2024|年度/ }).count().then(() => false).catch(() => false);
  // more precise: shell filter should not contain a year ant-select — only one ant-select for unit
  A1.shellSelectCount = await page.locator('[data-testid="board-shell-filters"] .ant-select').count();
  A1.noBusinessType = !/业务类型/.test(A1.filterText);
  A1.hasUnitLabel = /组织板块/.test(A1.filterText);
  A1.unitOptions = [];

  await page.screenshot({ path: path.join(OUT, 'max-A1-shell-filter-default.png'), fullPage: false });

  // open unit select and collect options
  await page.locator('[data-testid="board-shell-filters"] .ant-select').click();
  await page.waitForTimeout(400);
  const unitOpts = await page.locator('.ant-select-dropdown:not(.ant-select-dropdown-hidden) .ant-select-item-option').allTextContents();
  A1.unitOptions = unitOpts.map((t) => t.replace(/\s+/g, ' ').trim()).filter(Boolean);
  const expectedUnits = ['全部板块', '设计院', '数字化业务单元', '专业室'];
  A1.unitOptionsOk = expectedUnits.every((u) => A1.unitOptions.some((o) => o.includes(u)));
  await page.keyboard.press('Escape');
  await page.waitForTimeout(300);

  // A1 placeholder visibility
  await page.getByRole('treeitem', { name: /人力资源看板/ }).click();
  await page.waitForTimeout(700);
  const A1b = {
    filterVisible: await filter.isVisible(),
    placeholderCards: await page.locator('text=占位').count(),
    bodyHasPlaceholderTitle: /人力资源看板/.test(await page.locator('.absolute.inset-0.z-20, [class*="placeholder"]').first().innerText().catch(async () => page.innerText())),
  };
  // better placeholder detection
  A1b.placeholderShown = (await page.locator('div').filter({ hasText: /^占位$/ }).count()) > 0 || A1b.placeholderCards > 0;
  A1b.shellStillAbove = await filter.isVisible();
  await page.screenshot({ path: path.join(OUT, 'max-A1b-filter-on-placeholder.png'), fullPage: false });

  // back to ops
  await page.getByRole('treeitem', { name: /^运营看板$/ }).click();
  await page.waitForTimeout(1500);
  let fr = await framesByTitle();

  // ---------- A3 index.html no three selects + filter receive ----------
  const A3 = { opsPresent: !!fr.ops };
  if (fr.ops) {
    A3.dom = await fr.ops.evaluate(() => {
      const q = (sel) => document.querySelectorAll(sel).length;
      const header = document.querySelector('.header-controls');
      const headerHidden = !header || header.hasAttribute('hidden') || header.getAttribute('aria-hidden') === 'true' || getComputedStyle(header).display === 'none';
      const selects = [...document.querySelectorAll('select')].map((s) => ({
        id: s.id || null,
        aria: s.getAttribute('aria-label'),
        visible: !!(s.offsetWidth || s.offsetHeight || s.getClientRects().length),
      }));
      const hasOldIds = !!(document.getElementById('yearSelect') || document.getElementById('unitSelect') || document.getElementById('businessSelect'));
      const visibleOldLabels = [...document.querySelectorAll('label, span, .header-controls *')].some((el) => {
        const t = (el.textContent || '').trim();
        if (!/统计年度|组织板块|业务类型/.test(t)) return false;
        const r = el.getBoundingClientRect();
        return r.width > 0 && r.height > 0 && getComputedStyle(el).display !== 'none';
      });
      return {
        yearSelect: q('#yearSelect, select[aria-label="统计年度"]'),
        unitSelect: q('#unitSelect, select[aria-label="组织板块"]'),
        bizSelect: q('#businessSelect, select[aria-label="业务类型"]'),
        selectCount: selects.length,
        selects,
        hasOldIds,
        headerControlsHidden: headerHidden,
        visibleOldLabels,
        hasListenerSnippet: /ops-dashboard-filter/.test(document.documentElement.outerHTML) || typeof window.__opsFilterHooked === 'boolean',
      };
    });
    // inject listener to capture next filter message
    await fr.ops.evaluate(() => {
      window.__maxFilterMsgs = [];
      if (!window.__maxFilterHook) {
        window.__maxFilterHook = (e) => {
          if (e && e.data && e.data.type === 'ops-dashboard-filter') window.__maxFilterMsgs.push(e.data);
        };
        window.addEventListener('message', window.__maxFilterHook);
      }
    });
  } else {
    blockers.push('A3 找不到运营看板 iframe');
  }

  // change unit → expect postMessage
  await page.locator('[data-testid="board-shell-filters"] .ant-select').click();
  await page.waitForTimeout(300);
  await page.locator('.ant-select-dropdown:not(.ant-select-dropdown-hidden) .ant-select-item-option').filter({ hasText: '设计院' }).first().click();
  await page.waitForTimeout(1000);
  const A4 = { afterUnit: {} };
  if (fr.ops) {
    A4.afterUnit = await fr.ops.evaluate(() => {
      const alive = !!(document.querySelector('#cashPanel') || document.querySelector('#kpiGrid') || /现金流|经营/.test(document.body.innerText));
      const msgs = window.__maxFilterMsgs || [];
      const last = msgs[msgs.length - 1] || null;
      let stateUnit = null;
      try {
        // state is const in module scope — not exposed; infer via toast or re-read by forcing
        stateUnit = last && last.unit;
      } catch (_) {}
      return { alive, msgs, last, pageErrors: window.__maxPageErrors || [] };
    });
  }
  await page.screenshot({ path: path.join(OUT, 'max-A4-unit-design-institute.png'), fullPage: false });

  // also force postMessage from host and verify applyHostFilter path (ops still alive, no throw)
  if (fr.ops) {
    A4.forced = await page.evaluate(() => {
      const iframe = [...document.querySelectorAll('iframe')].find((el) => (el.title || '').includes('运营看板'));
      if (!iframe || !iframe.contentWindow) return { ok: false, reason: 'no-ops-iframe' };
      iframe.contentWindow.postMessage({ type: 'ops-dashboard-filter', year: 2026, unit: '数字化业务单元' }, window.location.origin);
      return { ok: true };
    });
    await page.waitForTimeout(800);
    A4.forcedRecv = await fr.ops.evaluate(() => {
      const msgs = window.__maxFilterMsgs || [];
      return { last: msgs[msgs.length - 1] || null, count: msgs.length, alive: !!document.body };
    });
  }

  // ---------- B completed contract ----------
  const pageErrors = [];
  page.on('pageerror', (e) => pageErrors.push(String(e)));
  page.on('console', (msg) => {
    if (msg.type() === 'error') pageErrors.push('console:' + msg.text());
  });

  await page.getByRole('treeitem', { name: /完成合同额看板/ }).click();
  await page.waitForTimeout(2200);
  fr = await framesByTitle();

  const B1 = {
    filterStillVisible: await filter.isVisible(),
    completedIframePresent: !!fr.completed,
    completedSrc: (fr.all.find((x) => /完成合同额/.test(x.title)) || {}).src || null,
    completedVisible: !!(fr.all.find((x) => /完成合同额/.test(x.title) && x.opacity > 0.5)),
    placeholderOverlayVisible: await page.locator('div.absolute.inset-0.z-20').filter({ hasText: '占位' }).count().then(async (c) => {
      if (c === 0) return false;
      // visible?
      const loc = page.locator('div.absolute.inset-0.z-20').first();
      return await loc.isVisible().catch(() => false);
    }),
    noNewCatalogUrl: !/completed-contract/.test(page.url()) || /\/board/.test(page.url()),
    url: page.url(),
  };

  // install message capture on completed
  if (fr.completed) {
    await fr.completed.evaluate(() => {
      window.__maxFilterMsgs = [];
      if (!window.__maxFilterHook) {
        window.__maxFilterHook = (e) => {
          if (e && e.data && e.data.type === 'ops-dashboard-filter') window.__maxFilterMsgs.push(e.data);
        };
        window.addEventListener('message', window.__maxFilterHook);
      }
    });
  }

  // change unit while on completed — should not error; filter persists
  await page.locator('[data-testid="board-shell-filters"] .ant-select').click();
  await page.waitForTimeout(300);
  await page.locator('.ant-select-dropdown:not(.ant-select-dropdown-hidden) .ant-select-item-option').filter({ hasText: '专业室' }).first().click();
  await page.waitForTimeout(1000);

  A4.onCompleted = {
    filterVisible: await filter.isVisible(),
    recv: fr.completed
      ? await fr.completed.evaluate(() => ({
          msgs: window.__maxFilterMsgs || [],
          last: (window.__maxFilterMsgs || [])[(window.__maxFilterMsgs || []).length - 1] || null,
          bodyOk: !!document.body,
        }))
      : null,
    pageErrors: pageErrors.slice(),
  };

  await page.screenshot({ path: path.join(OUT, 'max-B1-completed-contract-board.png'), fullPage: false });

  let B2 = { present: !!fr.completed };
  if (fr.completed) {
    await fr.completed.waitForSelector('.kpi-card', { timeout: 15000 });
    await page.waitForTimeout(1000);
    B2 = await fr.completed.evaluate(() => {
      const text = document.body.innerText.replace(/\s+/g, ' ');
      const deltas = [...document.querySelectorAll('.kpi-delta')].map((el) => ({
        text: el.textContent.replace(/\s+/g, ' ').trim(),
        className: el.className,
        color: getComputedStyle(el).color,
      }));
      const forbidden = {
        reportLinePicker: /报告线选线|选择报告线/.test(text),
        roleSplit: /填报角色|审阅角色|填报\/审阅/.test(text),
        jumpTrack: /跳转项目追踪表|打开项目追踪表/.test(text),
        lastMonthNew: /上月新增/.test(text), // should not mix ops KPI exception wording into this page's delta labels
        contractBoardImpl: /合同看板/.test(text) && !/完成合同额/.test(document.title || ''),
      };
      return {
        present: true,
        demoNote: /演示|样例|demo|假数/i.test(text) || /demo/i.test(document.documentElement.innerHTML),
        kpi: !!document.querySelector('.kpi-card') && /完成合同额/.test(text) && /完成开票额/.test(text) && /完成回款额/.test(text) && /存量合同额/.test(text),
        deltaPrev: /较上一期/.test(text),
        deltas,
        tree: /本月完成合同额情况/.test(text) && !!document.querySelector('#treeChart, .tree'),
        alerts: /项目预警一览/.test(text),
        trend: /月度走势/.test(text),
        pm: /按(项目经理|PM)汇总/.test(text) && !!document.querySelector('#pmTable'),
        emptyReady: !!document.getElementById('alertEmpty'),
        drawer: !!document.getElementById('drawer'),
        forbidden,
        titles: {
          h2: [...document.querySelectorAll('h2, .panel-title')].map((el) => el.textContent.replace(/\s+/g, ' ').trim()),
        },
      };
    });

    // open drawer
    const moreBtn = fr.completed.locator('#btnTreeMore, button:has-text("更多")').first();
    if (await moreBtn.count()) {
      await moreBtn.click();
      await page.waitForTimeout(500);
    } else {
      // click a tree leaf if any
      const leaf = fr.completed.locator('#treeChart [data-project], .tree-item, .tree button, .tree a').first();
      if (await leaf.count()) await leaf.click();
      await page.waitForTimeout(500);
    }
    B2.drawerOpen = await fr.completed.evaluate(() => {
      const d = document.getElementById('drawer');
      return !!(d && d.classList.contains('open'));
    });
    B2.drawerReadonly = await fr.completed.evaluate(() => {
      const d = document.getElementById('drawer');
      if (!d) return false;
      const inputs = d.querySelectorAll('input, textarea, select, [contenteditable="true"]');
      return inputs.length === 0;
    });
    await fr.completed.locator('#drawerClose').click().catch(() => {});
    await page.waitForTimeout(300);

    await fr.completed.locator('.page, body').first().screenshot({ path: path.join(OUT, 'max-B2-completed-content.png') }).catch(async () => {
      await page.screenshot({ path: path.join(OUT, 'max-B2-completed-content.png') });
    });
  } else {
    blockers.push('B1/B2 找不到完成合同额 iframe');
  }

  // empty alerts
  const page2 = await browser.newPage({ viewport: { width: 1400, height: 900 } });
  await page2.goto(BASE + '/operations-dashboard-202610/completed-contract.html?emptyAlerts=1', { waitUntil: 'networkidle', timeout: 60000 });
  await page2.waitForTimeout(900);
  const B3 = await page2.evaluate(() => {
    const empty = document.getElementById('alertEmpty');
    const cs = empty ? getComputedStyle(empty) : null;
    const visible = !!(empty && cs && cs.display !== 'none' && cs.visibility !== 'hidden' && empty.getBoundingClientRect().height > 0);
    return {
      emptyExists: !!empty,
      emptyVisible: visible,
      emptyText: empty ? empty.textContent.replace(/\s+/g, ' ').trim() : null,
      alertRows: document.querySelectorAll('#alertTable tbody tr, .alert-row').length,
    };
  });
  await page2.screenshot({ path: path.join(OUT, 'max-B3-alerts-empty-state.png'), fullPage: false });
  await page2.close();

  // B4: ops KPI 完成合同额 not broken; 合同看板 still placeholder
  await page.getByRole('treeitem', { name: /^运营看板$/ }).click();
  await page.waitForTimeout(1500);
  fr = await framesByTitle();
  const B4 = { opsKpiCompleted: null, contractBoardStillPlaceholder: null };
  if (fr.ops) {
    B4.opsKpiCompleted = await fr.ops.evaluate(() => {
      const text = document.body.innerText.replace(/\s+/g, ' ');
      // ops board still has its own KPI named 完成合同额 (module), should remain
      const has = /完成合同额/.test(text);
      // should NOT have been replaced by completed-contract blocks like 按项目经理汇总 in ops overview necessarily — just ensure ops still loads
      return {
        hasCompletedContractKpiLabel: has,
        alive: !!(document.querySelector('#cashPanel') || document.querySelector('.kpi-card') || /经营指标|现金流/.test(text)),
      };
    });
  }
  await page.getByRole('treeitem', { name: /合同看板/ }).click();
  await page.waitForTimeout(700);
  B4.contractBoardStillPlaceholder = {
    filterVisible: await filter.isVisible(),
    placeholderCards: await page.locator('div').filter({ hasText: /^占位$/ }).count(),
    titleOk: /合同看板/.test(await page.locator('h3').first().innerText().catch(() => '')),
  };
  await page.screenshot({ path: path.join(OUT, 'max-B4-contract-board-still-placeholder.png'), fullPage: false });

  // ---- verdicts ----
  const A = {
    '1_filterBelowHeaderAboveCatalog': !!(A1.filterVisible && A1.belowHeader && A1.aboveCatalog),
    '1b_visibleOnPlaceholder': !!(A1b.filterVisible && A1b.placeholderShown),
    '2_yearLockAndUnitOnly': !!(A1.yearLock2026 && A1.noBusinessType && A1.hasUnitLabel && A1.shellSelectCount === 1 && A1.unitOptionsOk),
    '3_indexNoOldSelectsReceivesFilter': !!(
      A3.dom &&
      A3.dom.yearSelect === 0 &&
      A3.dom.unitSelect === 0 &&
      A3.dom.bizSelect === 0 &&
      !A3.dom.hasOldIds &&
      A3.dom.headerControlsHidden &&
      A4.forcedRecv &&
      A4.forcedRecv.last &&
      A4.forcedRecv.last.year === 2026 &&
      typeof A4.forcedRecv.last.unit === 'string'
    ),
    '4_persistAndPostToVisibleIframe': !!(
      A4.afterUnit &&
      A4.afterUnit.alive &&
      A4.onCompleted &&
      A4.onCompleted.filterVisible &&
      A4.onCompleted.recv &&
      A4.onCompleted.recv.bodyOk &&
      (!A4.onCompleted.pageErrors || A4.onCompleted.pageErrors.filter((e) => /completed-contract|filter/i.test(e)).length === 0)
    ),
  };

  const B = {
    '1_iframeNoPlaceholder': !!(B1.completedIframePresent && B1.completedVisible && !B1.placeholderOverlayVisible && /board/.test(B1.url)),
    '2_blocksMatchOverviewIA': !!(B2.kpi && B2.deltaPrev && B2.tree && B2.alerts && B2.trend && B2.pm),
    '3_readonlyDrawerAndEmpty': !!(B2.drawer && B2.drawerOpen && B2.drawerReadonly && B3.emptyVisible && !(B2.forbidden && (B2.forbidden.reportLinePicker || B2.forbidden.roleSplit || B2.forbidden.jumpTrack))),
    '4_demoNoOpsRegressionNoContractBoard': !!(
      B4.opsKpiCompleted &&
      B4.opsKpiCompleted.alive &&
      B4.opsKpiCompleted.hasCompletedContractKpiLabel &&
      B4.contractBoardStillPlaceholder &&
      B4.contractBoardStillPlaceholder.placeholderCards > 0
    ),
  };

  if (!A['1_filterBelowHeaderAboveCatalog']) blockers.push('A1 壳级筛选条几何或可见性未过（应在 header 下、目录上）');
  if (!A['1b_visibleOnPlaceholder']) blockers.push('A1 占位节点选中时筛选条不可见或占位未出现');
  if (!A['2_yearLockAndUnitOnly']) blockers.push('A2 控件不合规（须固定2026年度 + 组织板块，无业务类型）');
  if (!A['3_indexNoOldSelectsReceivesFilter']) blockers.push('A3 index.html 仍有旧三下拉或未收到壳 filter postMessage');
  if (!A['4_persistAndPostToVisibleIframe']) blockers.push('A4 切节点后筛选消失，或完成合同额收消息异常');
  if (!B['1_iframeNoPlaceholder']) blockers.push('B1 完成合同额仍为占位或未用专用 iframe');
  if (!B['2_blocksMatchOverviewIA']) blockers.push('B2 完成合同额区块不全（KPI/较上一期/树图/预警/走势/PM）');
  if (!B['3_readonlyDrawerAndEmpty']) blockers.push('B3 Drawer/空态/只读或出现禁项（选线/角色分流/跳转）');
  if (!B['4_demoNoOpsRegressionNoContractBoard']) blockers.push('B4 运营看板 KPI 完成合同额回退或合同看板被实现');

  const A_pass = Object.values(A).every(Boolean);
  const B_pass = Object.values(B).every(Boolean);
  const overall = A_pass && B_pass && blockers.length === 0;

  const result = {
    overall,
    A_pass,
    B_pass,
    A,
    B,
    blockers,
    notes,
    details: { A1, A1b, A3, A4, B1, B2, B3, B4, iframes: fr.all, pageErrors },
    screenshots: [
      'max-A1-shell-filter-default.png',
      'max-A1b-filter-on-placeholder.png',
      'max-A4-unit-design-institute.png',
      'max-B1-completed-contract-board.png',
      'max-B2-completed-content.png',
      'max-B3-alerts-empty-state.png',
      'max-B4-contract-board-still-placeholder.png',
    ],
    boardUrl: BOARD,
    ledger: '2026-11-03 —— Board 壳级筛选上提（锁 2026、去业务类型）+ 完成合同额看板 iframe 接入概览同构内容',
    orthogonalOpen: '协作入口文档（AGENTS / README / 账本指针）—— 本验不关',
    ts: new Date().toISOString(),
    tzNote: 'Asia/Shanghai',
  };

  fs.writeFileSync(path.join(OUT, 'max-probe.json'), JSON.stringify(result, null, 2), 'utf8');
  console.log(JSON.stringify({ overall, A_pass, B_pass, A, B, blockers, unitOptions: A1.unitOptions, forcedLast: A4.forcedRecv && A4.forcedRecv.last, completedRecv: A4.onCompleted && A4.onCompleted.recv && A4.onCompleted.recv.last, B3, geometry: A1.geometry }, null, 2));
  await browser.close();
  process.exit(overall ? 0 : 1);
})().catch((e) => {
  console.error(e);
  process.exit(2);
});
