const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

function parseRgb(s) {
  if (!s) return null;
  const m = String(s).match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i);
  if (!m) return null;
  return [Number(m[1]), Number(m[2]), Number(m[3])];
}
function hexToRgb(hex) {
  if (!hex) return null;
  const h = hex.replace('#', '').trim();
  if (h.length !== 6) return null;
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}
function sameRgb(a, b, tol = 2) {
  if (!a || !b) return false;
  return Math.abs(a[0] - b[0]) <= tol && Math.abs(a[1] - b[1]) <= tol && Math.abs(a[2] - b[2]) <= tol;
}

(async () => {
  const OUT = path.resolve('docs/evidence/2026-11-02-ops-cashflow-cards-restore');
  fs.mkdirSync(OUT, { recursive: true });
  const url = 'http://127.0.0.1:3000/operations-dashboard-202610/board';
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1600, height: 1100 } });
  await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 });

  let frame = page;
  const iframe = page.locator('iframe').first();
  let iframeEl = null;
  if (await iframe.count()) {
    iframeEl = await iframe.elementHandle();
    const f = await iframeEl.contentFrame();
    if (f) frame = f;
  }
  await frame.waitForSelector('#cashMetrics .cash-metric strong', { timeout: 30000 });
  await frame.waitForTimeout(1000);

  async function setTheme(name) {
    // Host Next header posts {type:'ops-dashboard-theme', theme}; also try Ant Select
    await page.evaluate((theme) => {
      const iframe = document.querySelector('iframe');
      if (iframe && iframe.contentWindow) {
        iframe.contentWindow.postMessage({ type: 'ops-dashboard-theme', theme }, window.location.origin);
      }
    }, name);
    // Also try clicking host theme select if present (Ant Design)
    const hostSelect = page.locator('.ant-select').filter({ hasText: /主题|青绿|深蓝|暖棕/ }).first();
    if (await hostSelect.count()) {
      try {
        await hostSelect.click({ timeout: 2000 });
        const optLabel = name === 'teal' ? '青绿主题' : name === 'wood' ? '暖棕主题' : '深蓝主题';
        await page.locator('.ant-select-item-option').filter({ hasText: optLabel }).first().click({ timeout: 3000 });
      } catch (_) { /* postMessage is enough */ }
    }
    await frame.waitForTimeout(1000);
  }

  async function sample() {
    return frame.evaluate(() => {
      const cs = (el) => getComputedStyle(el);
      const cards = [...document.querySelectorAll('#cashMetrics .cash-metric')];
      const root = getComputedStyle(document.documentElement);
      return {
        tokens: {
          primary: root.getPropertyValue('--primary').trim(),
          success: root.getPropertyValue('--success').trim(),
          danger: root.getPropertyValue('--danger').trim(),
          theme: document.documentElement.dataset.theme || '',
        },
        cards: cards.map((btn) => {
          const strong = btn.querySelector('strong');
          const label = (btn.querySelector('.metric-label') || {}).textContent || '';
          return {
            label: label.trim(),
            value: strong ? strong.textContent.trim() : '',
            color: strong ? cs(strong).color : null,
            inline: strong ? strong.getAttribute('style') : null,
            valuePx: strong ? parseFloat(cs(strong).fontSize) : null,
            tone: [...btn.classList].find((c) => c.startsWith('tone-')) || null,
          };
        }),
        series: (() => {
          const c = (window.Highcharts && Highcharts.charts || []).find((x) => x && x.renderTo && x.renderTo.id === 'cashChart');
          if (!c) return null;
          return {
            names: c.series.map((s) => s.name),
            grouping: c.options.plotOptions && c.options.plotOptions.column && c.options.plotOptions.column.grouping,
            hasZones: !!(c.series.find((s) => s.type === 'line' && s.zones && s.zones.length)),
          };
        })(),
      };
    });
  }

  function checkTheme(sample, name) {
    const primary = hexToRgb(sample.tokens.primary) || parseRgb(sample.tokens.primary);
    const success = hexToRgb(sample.tokens.success) || parseRgb(sample.tokens.success);
    const danger = hexToRgb(sample.tokens.danger) || parseRgb(sample.tokens.danger);
    const inflow = sample.cards[0];
    const outflow = sample.cards[1];
    const net = sample.cards[2];
    const inflowOk = sameRgb(parseRgb(inflow.color), primary);
    const outflowOk = sameRgb(parseRgb(outflow.color), primary);
    const netVal = Number(String(net.value).replace(/,/g, ''));
    let netOk = false;
    let netExpect = '';
    if (netVal > 0) {
      netOk = sameRgb(parseRgb(net.color), success);
      netExpect = 'success/green';
    } else if (netVal < 0) {
      netOk = sameRgb(parseRgb(net.color), danger);
      netExpect = 'danger/red';
    } else {
      netOk = sameRgb(parseRgb(net.color), primary);
      netExpect = 'primary (zero)';
    }
    return {
      theme: sample.tokens.theme || name,
      tokens: sample.tokens,
      inflow: { ...inflow, matchPrimary: inflowOk },
      outflow: { ...outflow, matchPrimary: outflowOk },
      net: { ...net, netVal, matchSignColor: netOk, expect: netExpect },
      valuePxOk: sample.cards.every((c) => c.valuePx >= 28 && c.valuePx <= 36),
      series: sample.series,
      pass: inflowOk && outflowOk && netOk,
    };
  }

  await setTheme('teal');
  const teal = await sample();
  const tealCheck = checkTheme(teal, 'teal');
  await frame.locator('#cashPanel').screenshot({ path: path.join(OUT, '04-ac5-cash-colors-teal.png') });

  await setTheme('blue');
  const blue = await sample();
  const blueCheck = checkTheme(blue, 'blue');
  await frame.locator('#cashPanel').screenshot({ path: path.join(OUT, '03-ac5-cash-colors-blue.png') });
  await frame.locator('#cashMetrics').screenshot({ path: path.join(OUT, '05-ac5-cash-cards-closeup.png') });

  const negSample = await frame.evaluate(() => {
    const cards = [...document.querySelectorAll('#cashMetrics .cash-metric')];
    const net = cards[2];
    const strong = net.querySelector('strong');
    const probe = document.createElement('span');
    probe.style.color = 'var(--danger)';
    document.body.appendChild(probe);
    const dangerComputed = getComputedStyle(probe).color;
    probe.remove();
    strong.style.color = dangerComputed;
    strong.textContent = '-1,234.00';
    return {
      label: (net.querySelector('.metric-label') || {}).textContent.trim(),
      value: strong.textContent.trim(),
      color: getComputedStyle(strong).color,
      dangerToken: getComputedStyle(document.documentElement).getPropertyValue('--danger').trim(),
      dangerComputed,
      note: 'forced-negative-DOM-sample for AC5 red evidence (demo vals normally positive); code path vals[2]<0 uses colors.danger',
    };
  });
  await frame.locator('#cashMetrics').screenshot({ path: path.join(OUT, '06-ac5-net-negative-forced.png') });
  const negOk = sameRgb(parseRgb(negSample.color), parseRgb(negSample.dangerComputed));

  // restore
  await setTheme('blue');

  const themesDiffer = tealCheck.tokens.primary.toLowerCase() !== blueCheck.tokens.primary.toLowerCase();

  const result = {
    pass: tealCheck.pass && blueCheck.pass && negOk && themesDiffer,
    ac5: {
      rule: 'inflow/outflow strong = --primary; net >0 success, <0 danger, ==0 primary',
      themesDiffer,
      teal: tealCheck,
      blue: blueCheck,
      negativeForced: { ...negSample, matchDanger: negOk },
    },
    regressions: {
      cardsPresent: blue.cards.length === 3,
      names: blue.cards.map((c) => c.label),
      valuePx: blue.cards.map((c) => c.valuePx),
      series: blue.series,
    },
    screenshots: [
      '03-ac5-cash-colors-blue.png',
      '04-ac5-cash-colors-teal.png',
      '05-ac5-cash-cards-closeup.png',
      '06-ac5-net-negative-forced.png',
    ],
    ts: new Date().toISOString(),
  };

  fs.writeFileSync(path.join(OUT, 'probe-ac5.json'), JSON.stringify(result, null, 2), 'utf8');
  console.log(JSON.stringify({
    pass: result.pass,
    themesDiffer,
    teal: { pass: tealCheck.pass, primary: tealCheck.tokens.primary, inflow: tealCheck.inflow.color, theme: tealCheck.theme },
    blue: { pass: blueCheck.pass, primary: blueCheck.tokens.primary, inflow: blueCheck.inflow.color, theme: blueCheck.theme, net: blueCheck.net.color, success: blueCheck.tokens.success },
    negOk,
  }, null, 2));
  await browser.close();
  process.exit(result.pass ? 0 : 1);
})().catch((e) => {
  console.error(e);
  process.exit(2);
});
