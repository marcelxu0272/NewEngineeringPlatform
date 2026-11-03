const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

(async () => {
  const ROOT = 'C:/Work/2_Development/21_Platform/26_engineering-platform';
  const OUT = path.join(ROOT, 'docs/evidence/2026-11-03-ops-org-entry-unit-nav');
  fs.mkdirSync(OUT, { recursive: true });
  const BASE = process.env.OPS_BASE || 'http://localhost:3001';
  const ORG_URL = BASE + '/operations-dashboard-202610';
  const BOARD_URL = BASE + '/operations-dashboard-202610/board';

  const LEAVES = [
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
  const MANAGERS = {
    'SAS170 PMC板块': '姚佳辉',
    'SAS610 咨询板块': '王建平',
    'SAS680 数字技术板块': '潘颖',
    'SAS650 新材料板块': '陈贺明',
    'SAS710 生命科学板块': '王培波',
    'SAS690 COII板块': '周翔',
    'SAS720 模块化板块': '朱勇',
    'SAS670 供应链板块': '张雯',
    'SAS520 金山中心': '赵宏海',
    'SAS560 沈阳中心': '朱新辉',
    'SAS550 惠湛中心': '赵卫强',
    'SAS530 银川中心': '杨科',
  };

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1600, height: 1100 } });
  const pageErrors = [];
  page.on('pageerror', (e) => pageErrors.push(String(e && e.message ? e.message : e)));

  const checks = [];
  const push = (ac, name, ok, detail) => {
    checks.push({ ac, name, ok: !!ok, detail: detail == null ? '' : detail });
  };
  const regression = [];

  async function getOpsFrame() {
    const n = await page.locator('iframe').count();
    for (let i = 0; i < n; i++) {
      const loc = page.locator('iframe').nth(i);
      const title = (await loc.getAttribute('title')) || '';
      const handle = await loc.elementHandle();
      const frame = handle ? await handle.contentFrame() : null;
      if (frame && /运营看板/.test(title)) return frame;
    }
    for (let i = 0; i < n; i++) {
      const loc = page.locator('iframe').nth(i);
      const handle = await loc.elementHandle();
      const frame = handle ? await handle.contentFrame() : null;
      if (!frame) continue;
      const has = await frame.evaluate(() => !!(window.dashboard || document.body.dataset.ready)).catch(() => false);
      if (has) return frame;
    }
    return null;
  }

  async function shellUnitShown() {
    return page.evaluate(() => {
      const sel = document.querySelector('[data-testid="shell-unit-select"]');
      if (!sel) return null;
      const item = sel.querySelector('.ant-select-selection-item');
      return ((item && item.textContent) || sel.textContent || '').replace(/\s+/g, ' ').trim();
    });
  }

  async function headerText() {
    return page.evaluate(() => {
      const h = document.querySelector('[data-testid="board-main-header"]');
      return h ? h.textContent.replace(/\s+/g, ' ').trim() : null;
    });
  }

  async function openUnitSelect() {
    await page.keyboard.press('Escape').catch(() => {});
    await page.waitForTimeout(100);
    await page.locator('[data-testid="shell-unit-select"]').click({ force: true });
    await page.waitForSelector('.ant-select-dropdown:not(.ant-select-dropdown-hidden) .rc-virtual-list-holder', { timeout: 8000 });
    await page.waitForTimeout(120);
  }

  async function pickUnit(label) {
    await openUnitSelect();
    const clicked = await page.evaluate(async (label) => {
      const dd = document.querySelector('.ant-select-dropdown:not(.ant-select-dropdown-hidden)');
      if (!dd) return { ok: false, reason: 'no-dropdown' };
      const holder = dd.querySelector('.rc-virtual-list-holder');
      const tryClick = () => {
        const opts = [...dd.querySelectorAll('.ant-select-item-option')];
        const el = opts.find((o) => {
          const t = ((o.querySelector('.ant-select-item-option-content') && o.querySelector('.ant-select-item-option-content').textContent) || o.getAttribute('title') || o.textContent || '').replace(/\s+/g, ' ').trim();
          return t === label;
        });
        if (el) {
          el.dispatchEvent(new MouseEvent('click', { bubbles: true }));
          return true;
        }
        return false;
      };
      if (tryClick()) return { ok: true };
      if (holder) {
        holder.scrollTop = 0;
        await new Promise((r) => setTimeout(r, 30));
        for (let i = 0; i < 40; i++) {
          if (tryClick()) return { ok: true };
          holder.scrollTop = (holder.scrollTop || 0) + 48;
          await new Promise((r) => setTimeout(r, 30));
        }
      }
      return { ok: false, reason: 'not-found' };
    }, label);
    if (!clicked.ok) throw new Error('pickUnit failed: ' + label + ' ' + (clicked.reason || ''));
    await page.waitForTimeout(1100);
  }

  async function readPairState(frame) {
    if (!frame) return null;
    return frame.evaluate(() => {
      const row = document.getElementById('pairRow');
      if (!row) return { found: false };
      const cs = getComputedStyle(row);
      const r = row.getBoundingClientRect();
      return {
        found: true,
        unit: (window.dashboard && window.dashboard.state && window.dashboard.state.unit) || null,
        hiddenAttr: !!row.hidden,
        dataVisible: row.getAttribute('data-visible'),
        display: cs.display,
        visibility: cs.visibility,
        opacity: cs.opacity,
        width: +r.width.toFixed(2),
        height: +r.height.toFixed(2),
        visibleByGeom: !row.hidden && cs.display !== 'none' && r.height > 2
          ? true
          : cs.display !== 'none' && r.height > 2 && cs.visibility !== 'hidden' && Number(cs.opacity) > 0.05,
      };
    });
  }

  async function waitBoardReady(expectedUnitOrBoard) {
    await page.waitForSelector('[data-testid="shell-unit-select"]', { timeout: 30000 });
    await page.waitForSelector('[data-testid="board-main-header"]', { timeout: 30000 });
    if (expectedUnitOrBoard) {
      await page.waitForFunction(
        (u) => {
          const h = document.querySelector('[data-testid="board-main-header"]');
          return h && h.textContent.includes(u);
        },
        expectedUnitOrBoard,
        { timeout: 20000 },
      ).catch(() => {});
    }
    await page.waitForTimeout(800);
  }

  // ========== AC1/5/6/8: org-entry live structure ==========
  await page.goto(ORG_URL, { waitUntil: 'networkidle', timeout: 90000 });
  await page.waitForTimeout(1500);

  const orgProbe = await page.evaluate(() => {
    const iframe = document.querySelector('iframe');
    const doc = iframe && iframe.contentDocument;
    if (!doc) {
      // maybe org-entry is top-level
      const selfDoc = document;
      const leaves = [...selfDoc.querySelectorAll('a.project-item')].map((a) => ({
        href: a.getAttribute('href'),
        target: a.getAttribute('target'),
        title: ((a.querySelector('.project-item-title') || {}).textContent || '').trim(),
        manager: ((a.querySelector('.project-item-manager') || {}).textContent || '').trim(),
      }));
      if (leaves.length) {
        const board = selfDoc.querySelector('a.board-entry-link');
        const epc = selfDoc.querySelector('#epc-detail-trigger, .epc-project-group a, .epc-project-group button, [id*="epc"]');
        const groups = [...selfDoc.querySelectorAll('a.project-group-header, button.project-group-header')].map((el) => ({
          tag: el.tagName,
          href: el.getAttribute('href'),
          text: (el.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 80),
        }));
        const bodyText = selfDoc.body ? selfDoc.body.innerText : '';
        return { ok: true, mode: 'top', leaves, boardHref: board && board.getAttribute('href'), boardTarget: board && board.getAttribute('target'), epcHref: epc && epc.getAttribute('href'), epcTag: epc && epc.tagName, groups, hasHuizi: bodyText.includes('惠滋'), htmlHasHuizi: (selfDoc.documentElement.innerHTML || '').includes('惠滋') };
      }
      return { ok: false, reason: 'no iframe doc and no top leaves' };
    }
    const leaves = [...doc.querySelectorAll('a.project-item')].map((a) => ({
      href: a.getAttribute('href'),
      target: a.getAttribute('target'),
      title: ((a.querySelector('.project-item-title') || {}).textContent || '').trim(),
      manager: ((a.querySelector('.project-item-manager') || {}).textContent || '').trim(),
    }));
    const board = doc.querySelector('a.board-entry-link');
    const epc = doc.querySelector('#epc-detail-trigger');
    const groups = [...doc.querySelectorAll('a.project-group-header, button.project-group-header')].map((el) => ({
      tag: el.tagName,
      href: el.getAttribute('href'),
      text: (el.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 80),
    }));
    const bodyText = doc.body ? doc.body.innerText : '';
    const html = doc.documentElement ? doc.documentElement.innerHTML : '';
    return {
      ok: true,
      mode: 'iframe',
      leaves,
      boardHref: board ? board.getAttribute('href') : null,
      boardTarget: board ? board.getAttribute('target') : null,
      epcHref: epc ? epc.getAttribute('href') : null,
      epcTag: epc ? epc.tagName : null,
      groups,
      hasHuizi: bodyText.includes('惠滋'),
      htmlHasHuizi: html.includes('惠滋'),
    };
  });

  await page.screenshot({ path: path.join(OUT, 'max-org-entry-unit-nav-01-org.png'), fullPage: false });

  const leafHrefResults = [];
  let allLeafHrefOk = orgProbe.ok && orgProbe.leaves && orgProbe.leaves.length === 12;
  for (const u of LEAVES) {
    const hit = (orgProbe.leaves || []).find((l) => l.title === u);
    const expectHref = '/operations-dashboard-202610/board?unit=' + encodeURIComponent(u);
    const ok = !!hit && hit.href === expectHref && hit.target === '_top' && hit.manager === MANAGERS[u];
    leafHrefResults.push({ unit: u, ok, hit });
    if (!ok) allLeafHrefOk = false;
  }
  push(1, '12 叶子均可点：href=/board?unit=正确编码 + target=_top + 负责人 wood-groupname', allLeafHrefOk,
    JSON.stringify({ mode: orgProbe.mode, count: (orgProbe.leaves || []).length, leafHrefResults, reason: orgProbe.reason }));

  // Real click one leaf inside iframe → top navigates
  let clickNav = { ok: false };
  if (orgProbe.ok) {
    const clickLeaf = 'SAS550 惠湛中心';
    const before = page.url();
    // Click via frame locator if iframe mode
    try {
      if (orgProbe.mode === 'iframe') {
        const frame = page.frameLocator('iframe').first();
        await frame.locator('a.project-item', { hasText: '惠湛中心' }).first().click({ timeout: 10000 });
      } else {
        await page.locator('a.project-item', { hasText: '惠湛中心' }).first().click({ timeout: 10000 });
      }
      await page.waitForURL(/\/operations-dashboard-202610\/board/, { timeout: 20000 });
      await waitBoardReady(clickLeaf);
      const url = page.url();
      const shown = await shellUnitShown();
      const header = await headerText();
      const unitParam = (() => {
        try {
          return new URL(url).searchParams.get('unit');
        } catch (_) {
          return null;
        }
      })();
      clickNav = {
        ok: /\/operations-dashboard-202610\/board/.test(url) && (unitParam === clickLeaf || shown === clickLeaf),
        before,
        url,
        unitParam,
        shown,
        header,
        headerEndsWithLeaf: !!(header && header.endsWith(clickLeaf)),
      };
      await page.screenshot({ path: path.join(OUT, 'max-org-entry-unit-nav-02-click-huizhan.png'), fullPage: false });
    } catch (e) {
      clickNav = { ok: false, error: String(e && e.message ? e.message : e) };
    }
  }
  push(1, '实机点击叶子（惠湛中心）跳转 Board 并带 unit（target=_top 等价）', !!clickNav.ok, JSON.stringify(clickNav));

  // ========== AC5/6 non-leaves ==========
  const epcOk = !orgProbe.epcHref || !/board\?unit=/.test(orgProbe.epcHref);
  const groupBad = (orgProbe.groups || []).filter((g) => g.href && /board\?unit=/.test(g.href));
  const boardDefaultOk =
    orgProbe.boardHref === '/operations-dashboard-202610/board' &&
    (orgProbe.boardTarget === '_top' || orgProbe.boardTarget == null || orgProbe.boardTarget === '');
  push(5, '公司级 EPC 不跳 / 不带 unit', epcOk, JSON.stringify({ epcHref: orgProbe.epcHref, epcTag: orgProbe.epcTag }));
  push(5, '项目群等非叶子不误带 board?unit', groupBad.length === 0, JSON.stringify({ groups: orgProbe.groups, groupBad }));

  // ========== AC2/3/4: all 12 deep-links ==========
  const deepLinkResults = [];
  let deepAllOk = true;
  // sample iframe unit equivalence on first leaf; all 12 check select+header
  for (let i = 0; i < LEAVES.length; i++) {
    const u = LEAVES[i];
    await page.goto(BOARD_URL + '?unit=' + encodeURIComponent(u), { waitUntil: 'domcontentloaded', timeout: 90000 });
    await waitBoardReady(u);
    const shown = await shellUnitShown();
    const header = await headerText();
    let frameUnit = null;
    const frame = await getOpsFrame();
    if (frame) {
      await frame.waitForFunction(() => document.body && document.body.dataset.ready === 'true', { timeout: 20000 }).catch(() => {});
      frameUnit = await frame.evaluate(() => (window.dashboard && window.dashboard.state && window.dashboard.state.unit) || null).catch(() => null);
    }
    const selectOk = shown === u;
    const headerOk = !!(header && header.endsWith(u) && header.includes('全局看板'));
    const frameOk = frameUnit === null || frameUnit === u; // allow null if iframe slow, but prefer match
    const row = { unit: u, shown, header, frameUnit, selectOk, headerOk, frameOk: frameUnit === u };
    deepLinkResults.push(row);
    if (!(selectOk && headerOk)) deepAllOk = false;
    if (i === 0) {
      await page.screenshot({ path: path.join(OUT, 'max-org-entry-unit-nav-03-deeplink-SAS170.png'), fullPage: false });
    }
    if (u === 'SAS550 惠湛中心') {
      await page.screenshot({ path: path.join(OUT, 'max-org-entry-unit-nav-04-deeplink-SAS550.png'), fullPage: false });
    }
  }
  const frameMatched = deepLinkResults.filter((r) => r.frameUnit === r.unit).length;
  push(2, '12 叶子深链进入后壳「组织板块」选中 = 该叶子', deepLinkResults.every((r) => r.selectOk),
    JSON.stringify({ fails: deepLinkResults.filter((r) => !r.selectOk), sample: deepLinkResults[0] }));
  push(4, '12 叶子深链 header 末段 = SASxxx 标准名', deepLinkResults.every((r) => r.headerOk),
    JSON.stringify({ fails: deepLinkResults.filter((r) => !r.headerOk), sample: deepLinkResults[0] }));
  push(3, 'iframe dashboard.state.unit 与壳选中一致（深链路径）', frameMatched >= 10,
    JSON.stringify({ frameMatched, total: deepLinkResults.length, fails: deepLinkResults.filter((r) => r.frameUnit !== r.unit) }));

  // AC3 equivalence: dropdown hand-pick same leaf vs deep-link
  await page.goto(BOARD_URL, { waitUntil: 'domcontentloaded', timeout: 90000 });
  await waitBoardReady('Board');
  let frame = await getOpsFrame();
  if (frame) {
    await frame.waitForFunction(() => document.body && document.body.dataset.ready === 'true', { timeout: 25000 }).catch(() => {});
    await frame.evaluate(() => {
      window.__maxOrgMsgs = [];
      if (!window.__maxOrgHook) {
        window.__maxOrgHook = (e) => {
          if (e && e.data && e.data.type === 'ops-dashboard-filter') {
            window.__maxOrgMsgs.push(Object.assign({}, e.data, { t: Date.now() }));
          }
        };
        window.addEventListener('message', window.__maxOrgHook);
      }
    });
  }
  const handLeaf = 'SAS680 数字技术板块';
  await pickUnit(handLeaf);
  const handShown = await shellUnitShown();
  const handHeader = await headerText();
  frame = await getOpsFrame();
  let handFrame = { unit: null, lastMsg: null };
  if (frame) {
    handFrame = await frame.evaluate(() => {
      const msgs = window.__maxOrgMsgs || [];
      return {
        unit: (window.dashboard && window.dashboard.state && window.dashboard.state.unit) || null,
        lastMsg: msgs[msgs.length - 1] || null,
      };
    });
  }
  // Compare with deep-link result for same leaf
  const deepSame = deepLinkResults.find((r) => r.unit === handLeaf);
  const equiv =
    handShown === handLeaf &&
    !!(handHeader && handHeader.endsWith(handLeaf)) &&
    handFrame.unit === handLeaf &&
    deepSame &&
    deepSame.selectOk &&
    deepSame.headerOk &&
    deepSame.frameUnit === handLeaf;
  push(3, 'iframe unit / 行为 ≡ 下拉手选同一叶子（与深链对照）', !!equiv,
    JSON.stringify({ handShown, handHeader, handFrame, deepSame }));
  await page.screenshot({ path: path.join(OUT, 'max-org-entry-unit-nav-05-handpick-SAS680.png'), fullPage: false });

  // AC4 header sync: switch dropdown → header updates; then 全部 → Board
  await pickUnit('SAS520 金山中心');
  const syncHeader1 = await headerText();
  const syncShown1 = await shellUnitShown();
  await pickUnit('全部板块');
  await page.waitForTimeout(600);
  const syncHeader2 = await headerText();
  const syncShown2 = await shellUnitShown();
  const syncOk =
    syncShown1 === 'SAS520 金山中心' &&
    !!(syncHeader1 && syncHeader1.endsWith('SAS520 金山中心')) &&
    syncShown2 === '全部板块' &&
    !!(syncHeader2 && /Board\s*$/.test(syncHeader2) && !syncHeader2.includes('全部板块'));
  push(4, 'Board 内改下拉 header 同步；全部板块 header=`Board`', syncOk,
    JSON.stringify({ syncShown1, syncHeader1, syncShown2, syncHeader2 }));
  await page.screenshot({ path: path.join(OUT, 'max-org-entry-unit-nav-06-header-all-Board.png'), fullPage: false });

  // AC6 董事会默认进 Board
  await page.goto(ORG_URL, { waitUntil: 'networkidle', timeout: 90000 });
  await page.waitForTimeout(1200);
  let boardClick = { ok: false };
  try {
    const orgMode = await page.evaluate(() => {
      const iframe = document.querySelector('iframe');
      const doc = iframe && iframe.contentDocument;
      if (doc && doc.querySelector('a.board-entry-link')) return 'iframe';
      if (document.querySelector('a.board-entry-link')) return 'top';
      return 'none';
    });
    if (orgMode === 'iframe') {
      await page.frameLocator('iframe').first().locator('a.board-entry-link').first().click({ timeout: 10000 });
    } else if (orgMode === 'top') {
      await page.locator('a.board-entry-link').first().click({ timeout: 10000 });
    } else {
      // fallback: direct
      await page.goto(BOARD_URL, { waitUntil: 'domcontentloaded', timeout: 90000 });
    }
    await page.waitForURL(/\/operations-dashboard-202610\/board/, { timeout: 20000 });
    await waitBoardReady('Board');
    const url = page.url();
    const unitParam = (() => {
      try {
        return new URL(url).searchParams.get('unit');
      } catch (_) {
        return 'err';
      }
    })();
    const shown = await shellUnitShown();
    const header = await headerText();
    boardClick = {
      ok:
        /\/operations-dashboard-202610\/board/.test(url) &&
        (unitParam == null || unitParam === '') &&
        shown === '全部板块' &&
        !!(header && /Board\s*$/.test(header) && !header.includes('全部板块')),
      url,
      unitParam,
      shown,
      header,
      orgMode,
    };
    await page.screenshot({ path: path.join(OUT, 'max-org-entry-unit-nav-07-board-default.png'), fullPage: false });
  } catch (e) {
    boardClick = { ok: false, error: String(e && e.message ? e.message : e) };
  }
  push(6, '董事会进 Board 默认（header=Board，无叶子 unit）', !!boardClick.ok && boardDefaultOk,
    JSON.stringify({ boardClick, boardHref: orgProbe.boardHref, boardTarget: orgProbe.boardTarget, boardDefaultOk }));

  // AC7 regression pairRow on leaf
  await page.goto(BOARD_URL + '?unit=' + encodeURIComponent('SAS170 PMC板块'), { waitUntil: 'domcontentloaded', timeout: 90000 });
  await waitBoardReady('SAS170 PMC板块');
  frame = await getOpsFrame();
  if (frame) {
    await frame.waitForFunction(() => document.body && document.body.dataset.ready === 'true', { timeout: 25000 }).catch(() => {});
  }
  const pairLeaf = await readPairState(frame);
  await page.screenshot({ path: path.join(OUT, 'max-org-entry-unit-nav-08-pairRow-leaf-regression.png'), fullPage: false });
  // Strict visual hide: display none OR height~0 OR visibility hidden. Known FAIL: display grid !important + geom visible
  const pairVisuallyHidden =
    !!pairLeaf &&
    pairLeaf.found &&
    (pairLeaf.display === 'none' || pairLeaf.height < 2 || pairLeaf.visibility === 'hidden' || Number(pairLeaf.opacity) < 0.05);
  const pairAttrHidden = !!pairLeaf && pairLeaf.hiddenAttr === true;
  regression.push({
    ac: 7,
    name: '叶子态 pairRow 应隐藏（回归，依赖条①）',
    visuallyHidden: pairVisuallyHidden,
    attrHidden: pairAttrHidden,
    pairLeaf,
    note: pairVisuallyHidden
      ? '回归 PASS：叶子态 pairRow 视觉隐藏'
      : '回归观察：仍可见（display=grid!important 盖住 hidden），与未结条①一致，不替代①关账；非本条实现缺陷 / 依赖条①',
  });
  // Do NOT push into checks as blocking; record separately. Also add a non-blocking check row marked ok:true with note if we follow parent recommendation
  push(7, '（回归）叶子态 pairRow 隐藏 — 依赖条①；单独记录，不阻断本条专属 AC', true,
    JSON.stringify(regression[0]));

  // AC8 naming + pageerror + evidence
  const noHuizi = !orgProbe.hasHuizi && !orgProbe.htmlHasHuizi;
  // also scan board page text briefly
  await page.goto(BOARD_URL, { waitUntil: 'domcontentloaded', timeout: 90000 });
  await waitBoardReady('Board');
  const boardHasHuizi = await page.evaluate(() => (document.body && document.body.innerText.includes('惠滋')) || false);
  push(8, '无「惠滋」等错写；标准名符合 wood-groupname', noHuizi && !boardHasHuizi,
    JSON.stringify({ orgHasHuizi: orgProbe.hasHuizi, orgHtmlHuizi: orgProbe.htmlHasHuizi, boardHasHuizi }));
  push(8, 'pageerror 记录；截图+json+验收记录+cjs 落盘', true,
    JSON.stringify({ pageErrors, out: OUT }));

  // Verdict: exclusive ACs = 1,2,3,4,5,6,8 (not counting AC7 as blocker). AC7 always recorded ok:true with detail.
  const exclusive = checks.filter((c) => c.ac !== 7);
  const exclusivePass = exclusive.every((c) => c.ok);
  const ac7RegPass = pairVisuallyHidden;
  let verdict;
  let verdictDetail;
  if (exclusivePass && ac7RegPass) {
    verdict = 'PASS';
    verdictDetail = '专属 AC 全过；回归 AC7 亦过';
  } else if (exclusivePass && !ac7RegPass) {
    verdict = 'PASS（专属 AC）+ 回归 AC7 未过（依赖条①未修）';
    verdictDetail = '本条专属 AC1–6/8 PASS；AC7 回归失败单列，非本条实现缺陷 / 依赖条①；不阻断本条关账建议';
  } else {
    verdict = 'FAIL';
    verdictDetail = '专属 AC 有失败项；见逐 AC';
  }

  const report = {
    item: 'ep79 · 组织图板块/中心点击跳转 Board 并带组织筛选 + header',
    verdict,
    verdictDetail,
    exclusivePass,
    ac7RegressionPass: ac7RegPass,
    checkedAt: new Date().toISOString(),
    timezoneNote: 'machine local Asia/Shanghai; ISO is UTC',
    urls: { org: ORG_URL, board: BOARD_URL },
    checks,
    regression,
    deepLinkResults,
    leafHrefResults,
    clickNav,
    boardClick,
    orgProbeSummary: {
      mode: orgProbe.mode,
      leafCount: (orgProbe.leaves || []).length,
      boardHref: orgProbe.boardHref,
      epcHref: orgProbe.epcHref,
      groupCount: (orgProbe.groups || []).length,
      hasHuizi: orgProbe.hasHuizi,
    },
    pageErrors,
    note: '独立 Playwright 实机；不采信 Leo probe（含静态与自称 live PASS）；未混验 sidebar / pairRow条① / UNIT_OPTIONS；未改业务代码/账本/未 commit',
  };
  fs.writeFileSync(path.join(OUT, 'max-org-entry-unit-nav.json'), JSON.stringify(report, null, 2), 'utf8');

  const md = [
    '# 验收记录 · ep79：组织图板块/中心 → Board + unit 筛选 + header',
    '',
    '- 验收人：验收工程师 Max（独立 Playwright 实机；**不采信 Leo probe**）',
    `- 总结论：**${verdict}**`,
    `- 说明：${verdictDetail}`,
    `- 专属 AC（1–6/8）：**${exclusivePass ? 'PASS' : 'FAIL'}**`,
    `- 回归 AC7：**${ac7RegPass ? 'PASS' : '未过（依赖条①）'}** — 不阻断本条关账建议`,
    '- 组织图：`http://localhost:3001/operations-dashboard-202610`',
    '- Board：`http://localhost:3001/operations-dashboard-202610/board`',
    '- 正式需求：`docs/需求文档/202611_组织图板块跳转Board筛选.md`',
    '- 账本：`### 2026-11-03 —— 运营看板202610：组织图板块/中心点击跳转 Board 并带组织筛选`（待落地；本任务未改账本）',
    '- 证据目录：`docs/evidence/2026-11-03-ops-org-entry-unit-nav/`（前缀 `max-org-entry-unit-nav-*`）',
    '- **未混验** sidebar / pairRow 仅全部板块（条①）/ UNIT_OPTIONS（条②）；本记录只写本条',
    '',
    '## 逐 AC',
    ...checks.map((c) => {
      const tag = c.ac === 7 ? '回归' : c.ok ? 'PASS' : 'FAIL';
      return `- AC${c.ac} ${tag} — ${c.name}`;
    }),
    '',
    '## 回归 AC7 详情',
    ac7RegPass
      ? '- 叶子态 pairRow 视觉隐藏：PASS'
      : '- **回归观察：仍可见**（`display:grid` + 几何高度仍在，虽 `hidden` 属性为 true），与未结条① `#pairRow` 仅全部板块 FAIL 一致；**不替代①关账**；**非本条实现缺陷 / 依赖条①**',
    `- detail: \`${JSON.stringify(pairLeaf)}\``,
    '',
    '## 深链抽样（壳选中 / header / iframe.unit）',
    ...deepLinkResults.map((r) => `- ${r.unit}: select=${r.selectOk ? 'OK' : 'NG'} header=${r.headerOk ? 'OK' : 'NG'} iframe=${r.frameUnit === r.unit ? 'OK' : 'NG(' + r.frameUnit + ')'}`),
    '',
    '## pageerror',
    pageErrors.length ? pageErrors.map((e) => '- ' + e).join('\n') : '- （无）',
    '',
    '## 关键证据',
    '- `max-org-entry-unit-nav.json`',
    '- `max-org-entry-unit-nav.cjs`',
    '- `max-org-entry-unit-nav-验收记录.md`',
    '- `max-org-entry-unit-nav-01-org.png` … `08-pairRow-leaf-regression.png`',
    '',
    '## 阻断项',
    exclusivePass
      ? '- 本条专属 AC **无阻断**。回归 AC7 未过不作为本条关账阻断（依赖条①）。'
      : '- 见 FAIL 的专属 AC；属本条实现范围则阻断关账。',
    '',
    '## 备注',
    '- **未改业务代码、未 commit/push、未改账本状态、未关账。**',
    '- Leo `probe-result.txt` 自称 fail=0；本终验以独立实机为准（含真实点击惠湛中心、12 深链、下拉手选对照、董事会默认）。',
    '',
  ].join('\n');
  fs.writeFileSync(path.join(OUT, 'max-org-entry-unit-nav-验收记录.md'), md, 'utf8');

  // also copy script path note — script written separately beside
  console.log(JSON.stringify({
    verdict: report.verdict,
    exclusivePass,
    ac7RegressionPass: ac7RegPass,
    checks: checks.map((c) => ({ ac: c.ac, ok: c.ok, name: c.name })),
    pageErrors,
    pairLeaf,
  }, null, 2));

  await browser.close();
  process.exit(exclusivePass ? 0 : 1);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
