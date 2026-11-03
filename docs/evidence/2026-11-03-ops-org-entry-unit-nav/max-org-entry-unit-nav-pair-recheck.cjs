const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1600, height: 1100 } });
  const BASE = 'http://localhost:3001';
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
    await page.waitForTimeout(100);
    await page.locator('[data-testid="shell-unit-select"]').click({ force: true });
    await page.waitForSelector('.ant-select-dropdown:not(.ant-select-dropdown-hidden) .rc-virtual-list-holder', { timeout: 8000 });
  }
  async function pickUnit(label) {
    await openUnitSelect();
    await page.evaluate(async (label) => {
      const dd = document.querySelector('.ant-select-dropdown:not(.ant-select-dropdown-hidden)');
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
      if (tryClick()) return;
      holder.scrollTop = 0;
      for (let i = 0; i < 40; i++) {
        if (tryClick()) return;
        holder.scrollTop += 48;
        await new Promise((r) => setTimeout(r, 30));
      }
    }, label);
    await page.waitForTimeout(1200);
  }
  function readPair(frame) {
    return frame.evaluate(() => {
      const row = document.getElementById('pairRow');
      if (!row) return null;
      const cs = getComputedStyle(row);
      const r = row.getBoundingClientRect();
      return { unit: window.dashboard && window.dashboard.state && window.dashboard.state.unit, hidden: !!row.hidden, dataVisible: row.getAttribute('data-visible'), display: cs.display, h: +r.height.toFixed(2), w: +r.width.toFixed(2) };
    });
  }
  await page.goto(BASE + '/operations-dashboard-202610/board?unit=' + encodeURIComponent('SAS170 PMC板块'), { waitUntil: 'domcontentloaded', timeout: 90000 });
  await page.waitForSelector('[data-testid="shell-unit-select"]', { timeout: 30000 });
  await page.waitForTimeout(2000);
  let frame = await getOpsFrame();
  if (frame) await frame.waitForFunction(() => document.body && document.body.dataset.ready === 'true', { timeout: 25000 }).catch(() => {});
  const deep = await readPair(frame);

  await page.goto(BASE + '/operations-dashboard-202610/board', { waitUntil: 'domcontentloaded', timeout: 90000 });
  await page.waitForSelector('[data-testid="shell-unit-select"]', { timeout: 30000 });
  await page.waitForTimeout(1500);
  frame = await getOpsFrame();
  if (frame) await frame.waitForFunction(() => document.body && document.body.dataset.ready === 'true', { timeout: 25000 }).catch(() => {});
  const allState = await readPair(frame);
  await pickUnit('SAS170 PMC板块');
  frame = await getOpsFrame();
  const leafPick = await readPair(frame);
  await pickUnit('SAS520 金山中心');
  frame = await getOpsFrame();
  const leaf2 = await readPair(frame);
  console.log(JSON.stringify({ deep, allState, leafPick, leaf2 }, null, 2));
  await browser.close();
})().catch((e) => { console.error(e); process.exit(1); });
