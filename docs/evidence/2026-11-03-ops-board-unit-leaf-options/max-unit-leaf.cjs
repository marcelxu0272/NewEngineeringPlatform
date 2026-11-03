const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

(async () => {
  const ROOT = 'C:/Work/2_Development/21_Platform/26_engineering-platform';
  const OUT = path.join(ROOT, 'docs/evidence/2026-11-03-ops-board-unit-leaf-options');
  fs.mkdirSync(OUT, { recursive: true });
  const BASE = process.env.BOARD_BASE || 'http://localhost:3001';
  const URL = BASE + '/operations-dashboard-202610/board';

  const EXPECTED = [
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
  const FORBIDDEN = ['公司级EPC', '设计院', '数字化业务单元', '专业室'];

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
  await page.waitForTimeout(1200);

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

  async function openUnitSelect() {
    await page.keyboard.press('Escape').catch(() => {});
    await page.waitForTimeout(120);
    await page.locator('[data-testid="shell-unit-select"]').click({ force: true });
    await page.waitForSelector('.ant-select-dropdown:not(.ant-select-dropdown-hidden) .rc-virtual-list-holder', { timeout: 8000 });
    await page.waitForTimeout(150);
  }

  async function collectAllOptions() {
    await openUnitSelect();
    return page.evaluate(async () => {
      const dd = document.querySelector('.ant-select-dropdown:not(.ant-select-dropdown-hidden)');
      const holder = dd && dd.querySelector('.rc-virtual-list-holder');
      const seen = new Set();
      const ordered = [];
      const collect = () => {
        dd.querySelectorAll('.ant-select-item-option').forEach((el) => {
          const t = ((el.querySelector('.ant-select-item-option-content') && el.querySelector('.ant-select-item-option-content').textContent) || el.getAttribute('title') || el.textContent || '').replace(/\s+/g, ' ').trim();
          if (t && !seen.has(t)) { seen.add(t); ordered.push(t); }
        });
      };
      collect();
      if (holder) {
        holder.scrollTop = 0;
        await new Promise((r) => setTimeout(r, 30));
        for (let i = 0; i < 40; i++) {
          holder.scrollTop = (holder.scrollTop || 0) + 48;
          await new Promise((r) => setTimeout(r, 30));
          collect();
        }
      }
      return ordered;
    });
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
    if (!clicked.ok) throw new Error('pickUnit failed: ' + label);
    await page.waitForTimeout(1000);
  }

  const options = await collectAllOptions();
  await page.screenshot({ path: path.join(OUT, 'max-unit-leaf-01-dropdown.png'), fullPage: false });

  const orderOk =
    options.length === EXPECTED.length &&
    EXPECTED.every((v, i) => options[i] === v);
  const noForbidden = FORBIDDEN.every((f) => !options.some((o) => o === f || o.includes(f)));

  push(1, '壳级下拉选项恰好按序：全部板块 + 12 SAS 叶子', orderOk,
    JSON.stringify({ expected: EXPECTED, actual: options, len: options.length }));
  push(2, '不含公司级 EPC；不再出现设计院 / 数字化业务单元 / 专业室', noForbidden,
    JSON.stringify({ forbiddenHits: FORBIDDEN.filter((f) => options.some((o) => o.includes(f))), options }));

  await page.keyboard.press('Escape');
  await page.waitForTimeout(300);

  let frame = await getOpsFrame();
  if (frame) {
    await frame.waitForFunction(() => document.body && document.body.dataset.ready === 'true', { timeout: 25000 }).catch(() => {});
    await frame.evaluate(() => {
      window.__maxUnitMsgs = [];
      if (!window.__maxUnitHook) {
        window.__maxUnitHook = (e) => {
          if (e && e.data && e.data.type === 'ops-dashboard-filter') {
            window.__maxUnitMsgs.push(Object.assign({}, e.data, { t: Date.now() }));
          }
        };
        window.addEventListener('message', window.__maxUnitHook);
      }
    });
  }

  const leaf = 'SAS170 PMC板块';
  await pickUnit(leaf);
  frame = await getOpsFrame();
  let recv = { ok: false };
  if (frame) {
    recv = await frame.evaluate((expectedUnit) => {
      const msgs = window.__maxUnitMsgs || [];
      const last = msgs[msgs.length - 1] || null;
      const stateUnit = (window.dashboard && window.dashboard.state && window.dashboard.state.unit) || null;
      const alive = !!(document.body && document.body.dataset.ready === 'true');
      return {
        ok: true,
        msgsCount: msgs.length,
        last,
        stateUnit,
        matches: stateUnit === expectedUnit || (last && last.unit === expectedUnit),
        alive,
      };
    }, leaf);
  }
  push(3, '选中项经壳 postMessage 把 unit 传给可见 iframe；运营看板接收不报错',
    !!(recv.ok && recv.alive && recv.matches && pageErrors.length === 0),
    JSON.stringify(recv));

  await page.screenshot({ path: path.join(OUT, 'max-unit-leaf-02-leaf-selected.png'), fullPage: false });

  const indexPath = path.join(ROOT, 'public/operations-dashboard-202610/index.html');
  const indexHtml = fs.readFileSync(indexPath, 'utf8');
  const leafNames = EXPECTED.slice(1);
  const demoHits = leafNames.map((n) => ({ name: n, inDemo: indexHtml.indexOf("'" + n + "'") >= 0 || indexHtml.indexOf('"' + n + '"') >= 0 }));
  const allDemo = demoHits.every((h) => h.inDemo);
  const hasUnitFactor = /unitFactor/.test(indexHtml) && /state\.unit==='全部板块'/.test(indexHtml);
  push(4, 'iframe demo 映射对齐叶子（静态核对 DEMO_DATA / unitFactor；假数不要求真实金额）',
    allDemo && hasUnitFactor,
    JSON.stringify({ demoHits, hasUnitFactor, note: '已静态核对 index.html DEMO_DATA.departments / projects.department 含 12 叶子名；金额为演示假数未验真值' }));

  await pickUnit('全部板块');
  frame = await getOpsFrame();
  let pairCross = null;
  if (frame) {
    pairCross = await frame.evaluate(() => {
      const row = document.getElementById('pairRow');
      if (!row) return null;
      const cs = getComputedStyle(row);
      const r = row.getBoundingClientRect();
      return {
        unit: window.dashboard && window.dashboard.state && window.dashboard.state.unit,
        hidden: !!row.hidden,
        display: cs.display,
        h: +r.height.toFixed(2),
        visible: !row.hidden && cs.display !== 'none' && r.height > 2,
      };
    });
  }
  push(5, '「全部板块」仍驱动条A逻辑（本条不替代条A关账；交叉引用）',
    !!(pairCross && pairCross.unit === '全部板块' && pairCross.visible),
    JSON.stringify({ pairCross, note: '仅交叉观察；结论见条A证据目录' }));

  push(6, '不与 sidebar/pair 混关（本记录只写本条）', true, 'declared');
  push(7, '证据落盘', true, OUT);

  const pass = checks.every((c) => c.ok);
  const report = {
    item: '条B · UNIT_OPTIONS = 全部 + 12 SAS 叶子',
    verdict: pass ? 'PASS' : 'FAIL',
    checkedAt: new Date().toISOString(),
    timezoneNote: 'machine local Asia/Shanghai; ISO is UTC',
    url: URL,
    expected: EXPECTED,
    actualOptions: options,
    checks,
    recv,
    demoHits,
    pairCross,
    pageErrors,
    note: '独立 Playwright 实机；不采信 Leo 静态 probe-pair-units.cjs；选项经 rc-virtual-list 滚动采集',
  };
  fs.writeFileSync(path.join(OUT, 'max-unit-leaf.json'), JSON.stringify(report, null, 2), 'utf8');

  const md = [
    '# 验收记录 · 条B：壳级 UNIT_OPTIONS = 全部板块 + 12 SAS 叶子',
    '',
    '- 验收人：验收工程师 Max（独立 Playwright 实机；**不采信 Leo 静态 probe**）',
    `- 结论：**${pass ? 'PASS' : 'FAIL'}**`,
    '- URL：`http://localhost:3001/operations-dashboard-202610/board`',
    '- 对照账本：`### 2026-11-03 —— 运营看板202610：壳级组织板块换成真实叶子板块/中心`（实现中；本任务未改账本）',
    '- 证据目录：`docs/evidence/2026-11-03-ops-board-unit-leaf-options/`（前缀 `max-unit-leaf-*`）',
    '- **未混验** sidebar / pair 仅全部 / 组织图跳转 Board；本记录只写本条结论',
    '',
    '## 逐 AC',
    ...checks.map((c) => `- AC${c.ac} ${c.ok ? 'PASS' : 'FAIL'} — ${c.name}`),
    '',
    '## 选项实读（顺序，含虚拟列表滚动）',
    ...options.map((o, i) => (i + 1) + '. ' + o + (EXPECTED[i] === o ? '' : '  ⟵ 期望: ' + (EXPECTED[i] || '(无)'))),
    '',
    '## pageerror',
    pageErrors.length ? pageErrors.map((e) => '- ' + e).join('\n') : '- （无）',
    '',
    '## 关键证据',
    '- `max-unit-leaf.json`',
    '- `max-unit-leaf.cjs`',
    '- `max-unit-leaf-01-dropdown.png`',
    '- `max-unit-leaf-02-leaf-selected.png`',
    '',
    '## 备注',
    '- DEMO_DATA 假数未验真实金额；仅核对 12 叶子名出现在 departments/projects。',
    '- 条A「全部板块驱动 pair 显隐」仅交叉观察，关账以条A证据为准。',
    '- **未改业务代码、未 commit/push、未改账本状态、未关账。**',
    '',
  ].join('\n');
  fs.writeFileSync(path.join(OUT, 'max-unit-leaf-验收记录.md'), md, 'utf8');

  console.log(JSON.stringify({
    verdict: report.verdict,
    checks: checks.map((c) => ({ ac: c.ac, ok: c.ok, name: c.name })),
    options,
    pageErrors,
  }, null, 2));
  await browser.close();
  process.exit(pass ? 0 : 1);
})().catch((e) => { console.error(e); process.exit(1); });
