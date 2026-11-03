const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

(async () => {
  const ROOT = 'C:/Work/2_Development/21_Platform/26_engineering-platform';
  const OUT = path.join(ROOT, 'docs/evidence/2026-11-03-ops-pair-all-units-only');
  fs.mkdirSync(OUT, { recursive: true });
  const BASE = process.env.BOARD_BASE || 'http://localhost:3001';
  const URL = BASE + '/operations-dashboard-202610/board';
  const checks = [];
  const push = (name, ok, detail) => checks.push({ name, ok: !!ok, detail: detail == null ? '' : String(detail) });

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1600, height: 1100 } });
  await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 90000 });
  await page.waitForSelector('[data-testid="shell-unit-select"]', { timeout: 30000 });
  await page.waitForTimeout(1200);

  async function getOpsFrame() {
    const n = await page.locator('iframe').count();
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

  async function openUnitSelect() {
    await page.keyboard.press('Escape').catch(() => {});
    await page.waitForTimeout(120);
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
        if (el) { el.dispatchEvent(new MouseEvent('click', { bubbles: true })); return true; }
        return false;
      };
      if (tryClick()) return { ok: true };
      if (holder) {
        holder.scrollTop = 0;
        await new Promise((r) => setTimeout(r, 30));
        for (let i = 0; i < 50; i++) {
          if (tryClick()) return { ok: true };
          holder.scrollTop += 40;
          await new Promise((r) => setTimeout(r, 20));
        }
      }
      return { ok: false, reason: 'not-found' };
    }, label);
    await page.waitForTimeout(800);
    return clicked;
  }

  async function measurePair(frame) {
    return frame.evaluate(() => {
      const row = document.getElementById('pairRow');
      if (!row) return null;
      const cs = getComputedStyle(row);
      return {
        hidden: !!row.hidden,
        dataVisible: row.getAttribute('data-visible'),
        styleDisplay: row.style.display,
        computedDisplay: cs.display,
        offsetHeight: row.offsetHeight,
        clientHeight: row.clientHeight,
      };
    });
  }

  let frame = await getOpsFrame();
  push('ops-iframe', !!frame, frame ? 'found' : 'missing');
  if (!frame) {
    fs.writeFileSync(path.join(OUT, 'probe-rework-result.json'), JSON.stringify({ checks, pass: false }, null, 2));
    console.log('FAIL ops-iframe');
    process.exit(1);
  }
  await frame.waitForFunction(() => document.body && document.body.dataset.ready === 'true', { timeout: 25000 });

  // Ensure 全部板块 first
  await pickUnit('全部板块');
  frame = await getOpsFrame();
  await frame.waitForFunction(() => document.body && document.body.dataset.ready === 'true', { timeout: 25000 });
  await page.waitForTimeout(500);
  const all = await measurePair(frame);
  push('all:computed-not-none', all && all.computedDisplay !== 'none', JSON.stringify(all));
  push('all:data-visible-true', all && all.dataVisible === 'true', all && all.dataVisible);
  push('all:not-hidden', all && all.hidden === false, all && String(all.hidden));
  push('all:height>0', all && all.offsetHeight > 0, all && String(all.offsetHeight));
  await page.screenshot({ path: path.join(OUT, 'rework-01-all-visible.png'), fullPage: false });

  const leafPick = await pickUnit('SAS170 PMC板块');
  push('pick-SAS170', leafPick && leafPick.ok, JSON.stringify(leafPick));
  frame = await getOpsFrame();
  await frame.waitForFunction(() => document.body && document.body.dataset.ready === 'true', { timeout: 25000 });
  await page.waitForTimeout(600);
  const leaf = await measurePair(frame);
  push('leaf:computed-none', leaf && leaf.computedDisplay === 'none', JSON.stringify(leaf));
  push('leaf:data-visible-false', leaf && leaf.dataVisible === 'false', leaf && leaf.dataVisible);
  push('leaf:hidden', leaf && leaf.hidden === true, leaf && String(leaf.hidden));
  push('leaf:height≈0', leaf && leaf.offsetHeight === 0, leaf && String(leaf.offsetHeight));
  await page.screenshot({ path: path.join(OUT, 'rework-02-leaf-hidden.png'), fullPage: false });

  // second leaf sanity
  await pickUnit('SAS520 金山中心');
  frame = await getOpsFrame();
  await page.waitForTimeout(500);
  const leaf2 = await measurePair(frame);
  push('leaf2:computed-none', leaf2 && leaf2.computedDisplay === 'none', JSON.stringify(leaf2));

  // back to all
  await pickUnit('全部板块');
  frame = await getOpsFrame();
  await page.waitForTimeout(500);
  const back = await measurePair(frame);
  push('back:computed-not-none', back && back.computedDisplay !== 'none', JSON.stringify(back));
  push('back:height>0', back && back.offsetHeight > 0, back && String(back.offsetHeight));
  await page.screenshot({ path: path.join(OUT, 'rework-03-back-all.png'), fullPage: false });

  await browser.close();

  const pass = checks.every((c) => c.ok);
  const result = { base: BASE, at: new Date().toISOString(), pass, checks, all, leaf, leaf2, back };
  fs.writeFileSync(path.join(OUT, 'probe-rework-result.json'), JSON.stringify(result, null, 2));
  const lines = checks.map((c) => (c.ok ? 'PASS' : 'FAIL') + '  ' + c.name + (c.detail ? '  ' + c.detail : ''));
  fs.writeFileSync(path.join(OUT, 'probe-rework-result.txt'), lines.join('\n') + '\npass=' + pass + '\n');
  console.log(lines.join('\n'));
  console.log('pass=' + pass);
  process.exit(pass ? 0 : 1);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
