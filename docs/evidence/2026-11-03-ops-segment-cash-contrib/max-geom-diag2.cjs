const { chromium } = require('playwright');
(async () => {
  const fileUrl = 'file:///C:/Work/2_Development/21_Platform/26_engineering-platform/public/operations-dashboard-202610/index.html';
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1600, height: 1100 } });
  await page.goto(fileUrl, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => document.body.dataset.ready === 'true', { timeout: 25000 });
  await page.waitForTimeout(800);
  const info = await page.evaluate(() => {
    const el = document.getElementById('contributionChart');
    const elT = document.getElementById('targetChart');
    const pick = (node) => {
      const s = getComputedStyle(node);
      return {
        id: node.id,
        className: node.className,
        inline: node.getAttribute('style'),
        height: s.height,
        minHeight: s.minHeight,
        maxHeight: s.maxHeight,
        flex: s.flex,
        flexGrow: s.flexGrow,
        display: s.display,
        parentDisplay: getComputedStyle(node.parentElement).display,
        parentFlexDir: getComputedStyle(node.parentElement).flexDirection,
        chartH: window.dashboard?.charts?.[node.id]?.chartHeight,
        chartOptH: window.dashboard?.charts?.[node.id]?.options?.chart?.height,
      };
    };
    // try matched rules if available
    let matchedC = null;
    try {
      const rules = node => {
        const out = [];
        for (const sheet of document.styleSheets) {
          let cssRules;
          try { cssRules = sheet.cssRules; } catch { continue; }
          for (const rule of cssRules) {
            if (!rule.selectorText || !rule.style) continue;
            try {
              if (node.matches(rule.selectorText) && (rule.style.height || rule.style.minHeight || rule.style.maxHeight)) {
                out.push({ sel: rule.selectorText, height: rule.style.height, minHeight: rule.style.minHeight, maxHeight: rule.style.maxHeight, importantH: rule.style.getPropertyPriority('height') });
              }
            } catch {}
          }
        }
        return out;
      };
      matchedC = { c: rules(el), t: rules(elT) };
    } catch (e) { matchedC = String(e); }
    return { c: pick(el), t: pick(elT), matchedC };
  });
  console.log(JSON.stringify(info, null, 2));
  await browser.close();
})().catch(e => { console.error(e); process.exit(1); });
