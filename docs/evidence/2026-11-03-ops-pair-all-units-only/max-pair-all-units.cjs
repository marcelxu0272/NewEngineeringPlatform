const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

(async () => {
  const ROOT = 'C:/Work/2_Development/21_Platform/26_engineering-platform';
  const OUT = path.join(ROOT, 'docs/evidence/2026-11-03-ops-pair-all-units-only');
  fs.mkdirSync(OUT, { recursive: true });
  const BASE = process.env.BOARD_BASE || 'http://localhost:3001';
  const URL = BASE + '/operations-dashboard-202610/board';

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1600, height: 1100 } });
  const pageErrors = [];
  page.on('pageerror', (e) => pageErrors.push(String(e && e.message ? e.message : e)));

  const checks = [];
  const push = (ac, name, ok, detail) => {
    checks.push({ ac, name, ok: !!ok, detail: detail == null ? '' : detail });
  };

  await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 90000 });
  await page.waitForSelector('[data-testid="shell-unit-select"]', { timeout: 30000 });
  await page.waitForTimeout(1500);

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
      const has = await frame.evaluate(() => !!document.getElementById('pairRow')).catch(() => false);
      if (has) return frame;
    }
    return null;
  }

  async function waitOpsReady(frame) {
    await frame.waitForFunction(() => document.body && document.body.dataset.ready === 'true', { timeout: 25000 });
    await page.waitForTimeout(400);
  }

  async function openUnitSelect() {
    // close any open first
    await page.keyboard.press('Escape').catch(() => {});
    await page.waitForTimeout(150);
    await page.locator('[data-testid="shell-unit-select"]').click({ force: true });
    await page.waitForSelector('.ant-select-dropdown:not(.ant-select-dropdown-hidden) .rc-virtual-list-holder', { timeout: 8000 });
    await page.waitForTimeout(150);
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
        if (el) { el.dispatchEvent(new MouseEvent('click', { bubbles: true })); return true; }
        return false;
      };
      if (tryClick()) return { ok: true, via: 'initial' };
      if (holder) {
        holder.scrollTop = 0;
        await new Promise((r) => setTimeout(r, 30));
        for (let i = 0; i < 40; i++) {
          if (tryClick()) return { ok: true, via: 'scroll-' + i };
          holder.scrollTop = (holder.scrollTop || 0) + 48;
          await new Promise((r) => setTimeout(r, 30));
        }
      }
      return { ok: false, reason: 'not-found' };
    }, label);
    if (!clicked.ok) throw new Error('pickUnit failed: ' + label + ' ' + JSON.stringify(clicked));
    await page.waitForTimeout(1000);
    return clicked;
  }

  async function pairGeom(frame) {
    return frame.evaluate(() => {
      const row = document.getElementById('pairRow') || document.querySelector('.pair-row');
      if (!row) return { found: false };
      const cs = getComputedStyle(row);
      const r = row.getBoundingClientRect();
      const contrib = document.getElementById('contributionPanel');
      const target = document.getElementById('targetPanel');
      const contribTitle = (contrib && contrib.querySelector('.panel-title') && contrib.querySelector('.panel-title').innerText || '').replace(/\s+/g, ' ').trim();
      const targetTitle = (target && target.querySelector('.panel-title') && target.querySelector('.panel-title').innerText || '').replace(/\s+/g, ' ').trim();
      const tabs = target ? target.querySelectorAll('[data-target-metric]').length : 0;
      const cChart = document.getElementById('contributionChart');
      const tChart = document.getElementById('targetChart');
      const visibleByGeom = r.width > 2 && r.height > 2 && cs.display !== 'none' && cs.visibility !== 'hidden' && Number(cs.opacity || 1) > 0.05;
      const shellVisible = !row.hidden && cs.display !== 'none' && row.getAttribute('data-visible') !== 'false';
      return {
        found: true,
        hiddenAttr: !!row.hidden,
        display: cs.display,
        visibility: cs.visibility,
        opacity: cs.opacity,
        dataVisible: row.getAttribute('data-visible'),
        width: +r.width.toFixed(2),
        height: +r.height.toFixed(2),
        visibleByGeom,
        shellVisible,
        contribTitle,
        targetTitle,
        tabs,
        hasContribChart: !!(cChart && cChart.getBoundingClientRect().height > 2),
        hasTargetChart: !!(tChart && tChart.getBoundingClientRect().height > 2),
        unit: (window.dashboard && window.dashboard.state && window.dashboard.state.unit) || null,
      };
    });
  }

  async function otherModules(frame) {
    return frame.evaluate(() => {
      const text = (document.body.innerText || '').replace(/\s+/g, ' ');
      const kpi = !!(document.querySelector('#kpiGrid, .kpi-grid') || /新签合同额|完成合同额|完成开票额|完成回款额/.test(text));
      const cash = !!(document.getElementById('cashPanel') || document.getElementById('cashChart') || /现金流趋势|现金流入|现金流出/.test(text));
      const risk = !!(document.getElementById('riskPanel') || /应收风险|应收账款|逾期/.test(text));
      const load = !!(document.getElementById('deliveryPanel') || document.getElementById('loadChart') || /负荷|交付/.test(text));
      const pairVisible = (() => {
        const row = document.getElementById('pairRow');
        if (!row) return false;
        const cs = getComputedStyle(row);
        const r = row.getBoundingClientRect();
        return !row.hidden && cs.display !== 'none' && r.height > 2;
      })();
      return { kpi, cash, risk, load, pairVisible, sample: text.slice(0, 120) };
    });
  }

  let frame = await getOpsFrame();
  if (!frame) {
    push(1, '运营看板 iframe 可用', false, 'no ops iframe');
  } else {
    await waitOpsReady(frame);
  }

  // Force 全部板块 even if already selected (re-apply filter)
  await pickUnit('全部板块');
  frame = await getOpsFrame();
  await waitOpsReady(frame);

  const allState = await pairGeom(frame);
  const allMods = await otherModules(frame);
  const allVisibleOk =
    allState.found &&
    allState.shellVisible &&
    allState.visibleByGeom &&
    /板块现金流贡献/.test(allState.contribTitle) &&
    /板块目标达成/.test(allState.targetTitle) &&
    allState.tabs === 4 &&
    allState.hasContribChart &&
    allState.hasTargetChart;

  push(1, '组织板块=全部板块：板块现金流贡献 + 板块目标达成均可见（标题/图/tab 齐全）',
    allVisibleOk,
    JSON.stringify({ allState, allMods }));

  await page.screenshot({ path: path.join(OUT, 'max-pair-all-units-01-all-visible.png'), fullPage: false });
  if (allState.found && allState.visibleByGeom) {
    await frame.locator('#pairRow').screenshot({ path: path.join(OUT, 'max-pair-all-units-01b-pair-clip.png') }).catch(() => {});
  }

  await pickUnit('SAS170 PMC板块');
  frame = await getOpsFrame();
  await waitOpsReady(frame);
  const leafState = await pairGeom(frame);
  const leafMods = await otherModules(frame);
  const leafHiddenOk =
    leafState.found &&
    leafState.hiddenAttr === true &&
    leafState.display === 'none' &&
    !leafState.visibleByGeom &&
    leafState.height < 2;

  push(2, '任一具体板块：#pairRow 整块隐藏（display/hidden/几何无空壳）',
    leafHiddenOk,
    JSON.stringify({ leafState, leafMods }));

  await page.screenshot({ path: path.join(OUT, 'max-pair-all-units-02-leaf-hidden.png'), fullPage: false });

  await pickUnit('SAS520 金山中心');
  frame = await getOpsFrame();
  await waitOpsReady(frame);
  const leaf2 = await pairGeom(frame);
  const leaf2Hidden = leaf2.found && leaf2.hiddenAttr && leaf2.display === 'none' && !leaf2.visibleByGeom;

  await pickUnit('全部板块');
  frame = await getOpsFrame();
  await waitOpsReady(frame);
  const backAll = await pairGeom(frame);
  const backVisible =
    backAll.found && backAll.shellVisible && backAll.visibleByGeom &&
    /板块现金流贡献/.test(backAll.contribTitle) && /板块目标达成/.test(backAll.targetTitle);

  await pickUnit('SAS680 数字技术板块');
  frame = await getOpsFrame();
  await waitOpsReady(frame);
  const againLeaf = await pairGeom(frame);
  const againHidden = againLeaf.found && againLeaf.hiddenAttr && againLeaf.display === 'none' && !againLeaf.visibleByGeom;

  push(3, '全部↔具体来回切换，显隐正确、无残留半截',
    leaf2Hidden && backVisible && againHidden,
    JSON.stringify({ leaf2, backAll, againLeaf }));

  await page.screenshot({ path: path.join(OUT, 'max-pair-all-units-03-toggle-leaf.png'), fullPage: false });

  const modsLeaf = await otherModules(frame);
  push(4, '不误伤其它模块（KPI/现金流/应收风险/负荷交付仍可见）',
    modsLeaf.kpi && modsLeaf.cash && modsLeaf.risk && modsLeaf.load,
    JSON.stringify(modsLeaf));

  await pickUnit('全部板块');
  frame = await getOpsFrame();
  await waitOpsReady(frame);
  const finalAll = await pairGeom(frame);
  await page.screenshot({ path: path.join(OUT, 'max-pair-all-units-04-back-all.png'), fullPage: false });

  push(5, '本记录只写本条结论（未混关 sidebar/UNIT）', true, 'declared');
  push(6, '证据落盘；pageerror 记录', pageErrors.length === 0, JSON.stringify({ pageErrors, finalAll }));

  const pass = checks.every((c) => c.ok);
  const report = {
    item: '条A · #pairRow 仅全部板块显示',
    verdict: pass ? 'PASS' : 'FAIL',
    checkedAt: new Date().toISOString(),
    timezoneNote: 'machine local Asia/Shanghai; ISO is UTC',
    url: URL,
    checks,
    samples: { allState, leafState, leaf2, backAll, againLeaf, finalAll, modsLeaf },
    pageErrors,
    note: '独立 Playwright 实机；不采信 Leo 静态 probe-pair-units.cjs',
  };
  fs.writeFileSync(path.join(OUT, 'max-pair-all-units.json'), JSON.stringify(report, null, 2), 'utf8');

  const md = [
    '# 验收记录 · 条A：#pairRow 仅「全部板块」时展示',
    '',
    '- 验收人：验收工程师 Max（独立 Playwright 实机；**不采信 Leo 静态 probe**）',
    `- 结论：**${pass ? 'PASS' : 'FAIL'}**`,
    '- URL：`http://localhost:3001/operations-dashboard-202610/board`',
    '- 对照账本：`### 2026-11-03 —— 运营看板202610：板块现金流/目标达成仅「全部板块」时展示`（实现中；本任务未改账本）',
    '- 证据目录：`docs/evidence/2026-11-03-ops-pair-all-units-only/`（前缀 `max-pair-all-units-*`，未覆盖 Leo `probe-*`）',
    '- **未混验** sidebar / UNIT 叶子 / 组织图跳转 Board；本记录只写本条结论',
    '',
    '## 逐 AC',
    ...checks.map((c) => `- AC${c.ac} ${c.ok ? 'PASS' : 'FAIL'} — ${c.name}`),
    '',
    '## 关键量测摘要',
    `- 全部板块：display=${allState.display} hidden=${allState.hiddenAttr} h=${allState.height} titles=${allState.contribTitle} / ${allState.targetTitle} tabs=${allState.tabs}`,
    `- SAS170：display=${leafState.display} hidden=${leafState.hiddenAttr} h=${leafState.height}`,
    `- 来回：leaf2Hidden=${leaf2Hidden} backVisible=${backVisible} againHidden=${againHidden}`,
    '',
    '## pageerror',
    pageErrors.length ? pageErrors.map((e) => `- ${e}`).join('\n') : '- （无）',
    '',
    '## 关键证据',
    '- `max-pair-all-units.json`',
    '- `max-pair-all-units.cjs`',
    '- `max-pair-all-units-01-all-visible.png`',
    '- `max-pair-all-units-01b-pair-clip.png`',
    '- `max-pair-all-units-02-leaf-hidden.png`',
    '- `max-pair-all-units-03-toggle-leaf.png`',
    '- `max-pair-all-units-04-back-all.png`',
    '',
    '## 备注',
    '- **未改业务代码、未 commit/push、未改账本状态、未关账。**',
    '',
  ].join('\n');
  fs.writeFileSync(path.join(OUT, 'max-pair-all-units-验收记录.md'), md, 'utf8');

  console.log(JSON.stringify({
    verdict: report.verdict,
    checks: checks.map((c) => ({ ac: c.ac, ok: c.ok, name: c.name })),
    pageErrors,
  }, null, 2));
  await browser.close();
  process.exit(pass ? 0 : 1);
})().catch((e) => { console.error(e); process.exit(1); });

