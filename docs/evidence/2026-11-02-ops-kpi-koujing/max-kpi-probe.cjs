const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const OUT = 'C:/Work/2_Development/21_Platform/26_engineering-platform/docs/evidence/2026-11-02-ops-kpi-koujing';
const PREFIX = 'max-kpi';

function parseNum(s) {
  if (s == null) return null;
  const m = String(s).replace(/,/g, '').match(/-?\d+(?:\.\d+)?/);
  return m ? parseFloat(m[0]) : null;
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const report = { ts: new Date().toISOString(), actor: 'Max-independent-kpi', checks: {}, failures: [] };

  await page.goto('http://localhost:3000/operations-dashboard-202610/board', { waitUntil: 'networkidle', timeout: 90000 });
  await page.waitForTimeout(2800);
  const iframeEl = await page.waitForSelector('iframe', { timeout: 15000 });
  const frame = await iframeEl.contentFrame();
  await frame.waitForSelector('#kpiGrid, .kpi-grid', { timeout: 20000 });
  await page.waitForTimeout(1000);

  async function snapshot(label) {
    return frame.evaluate((label) => {
      const kpiRoot = document.getElementById('kpiGrid') || document.querySelector('.kpi-grid');
      const cards = [...(kpiRoot ? kpiRoot.querySelectorAll('.kpi-card') : [])].map(card => {
        const title = (card.querySelector('.kpi-title, .title, .kpi-label')?.textContent || card.innerText.split('\n')[0] || '').trim();
        const value = (card.querySelector('.kpi-value, .value')?.textContent || '').trim();
        const yoyEl = card.querySelector('.kpi-yoy, .yoy');
        const yoyText = yoyEl ? yoyEl.textContent.trim() : '';
        const yoyVisible = !!(yoyEl && getComputedStyle(yoyEl).display !== 'none' && getComputedStyle(yoyEl).visibility !== 'hidden' && yoyEl.getBoundingClientRect().height > 0);
        const full = card.innerText.replace(/\s+/g, ' ').trim();
        return {
          title, value, yoyText, yoyVisible,
          hasTongbi: /同比/.test(full) || /同比/.test(yoyText),
          hasMonthAdd: /当月新增/.test(full),
          hasPrevMonthAdd: /上月新增/.test(full),
          hasPctOfTarget: /占目标|占总目标/.test(full),
          full
        };
      });

      // risk panel cards
      const risk = document.getElementById('riskPanel') || [...document.querySelectorAll('.panel')].find(p => /应收与资金风险/.test(p.innerText||''));
      const riskCards = [];
      if (risk) {
        // common structures: .risk-card, .metric-card, .stat-card, or grid children
        const nodes = risk.querySelectorAll('.risk-card, .metric-card, .stat-card, .kpi-card, .risk-item, .card');
        const list = nodes.length ? [...nodes] : [];
        // fallback: look for labeled blocks
        if (!list.length) {
          const labels = ['应收账款','WIP','存货','营业收入','1年以上应收'];
          labels.forEach(lab => {
            const el = [...risk.querySelectorAll('*')].find(e => e.childNodes.length && [...e.childNodes].some(n => n.nodeType===3 && n.textContent.trim()===lab));
            if (el) {
              let box = el.closest('.risk-card, .metric-card, .stat-card, .card, div') || el.parentElement;
              riskCards.push({ label: lab, text: (box.innerText||'').replace(/\s+/g,' ').trim(), small: (box.querySelector('.small,.sub,.meta,.risk-small,.delta')?.textContent||'').trim() });
            }
          });
        } else {
          list.forEach(el => {
            const text = el.innerText.replace(/\s+/g,' ').trim();
            const label = (el.querySelector('.label,.title,.name,.risk-label')?.textContent || text.split(' ')[0] || '').trim();
            const small = (el.querySelector('.small,.sub,.meta,.risk-small,.delta,.hint')?.textContent || '').trim();
            riskCards.push({ label, text, small, hasTongbi: /同比/.test(text), hasPeriod: /较上期/.test(text) });
          });
        }
      }

      const bodyHasTongbi = /同比/.test((kpiRoot?.innerText||'') + (risk?.innerText||''));
      return {
        label,
        cards,
        riskCards,
        riskText: risk ? risk.innerText.replace(/\s+/g,' ').trim().slice(0, 800) : null,
        bodyHasTongbi,
        kpiText: kpiRoot ? kpiRoot.innerText.replace(/\s+/g,' ').trim() : null
      };
    }, label);
  }

  const before = await snapshot('default');
  report.before = before;

  // scroll kpi into view and screenshot
  await frame.evaluate(() => (document.getElementById('kpiGrid')||document.querySelector('.kpi-grid'))?.scrollIntoView({ block: 'start' }));
  await page.waitForTimeout(300);
  await page.screenshot({ path: path.join(OUT, `${PREFIX}-01-kpi-default.png`), fullPage: false });
  // kpi clip
  const kpiClip = await page.evaluate(() => {
    const f = document.querySelector('iframe');
    const fr = f.getBoundingClientRect();
    const el = f.contentDocument.getElementById('kpiGrid') || f.contentDocument.querySelector('.kpi-grid');
    const r = el.getBoundingClientRect();
    return { x: Math.max(0, fr.left+r.left-2), y: Math.max(0, fr.top+r.top-2), width: Math.min(r.width+4, 1200), height: Math.min(r.height+8, 400) };
  });
  await page.screenshot({ path: path.join(OUT, `${PREFIX}-01b-kpi-grid.png`), clip: kpiClip });

  await frame.evaluate(() => document.getElementById('riskPanel')?.scrollIntoView({ block: 'center' }));
  await page.waitForTimeout(400);
  const riskClip = await page.evaluate(() => {
    const f = document.querySelector('iframe');
    const fr = f.getBoundingClientRect();
    const el = f.contentDocument.getElementById('riskPanel');
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return { x: Math.max(0, fr.left+r.left-2), y: Math.max(0, fr.top+Math.max(0,r.top)-2), width: Math.min(r.width+4, 1200), height: Math.min(Math.max(r.height, 200), 500) };
  });
  if (riskClip) await page.screenshot({ path: path.join(OUT, `${PREFIX}-02-risk-cards.png`), clip: riskClip });
  else await page.screenshot({ path: path.join(OUT, `${PREFIX}-02-risk-cards.png`), fullPage: false });

  // === Evaluate AC on default ===
  const cards = before.cards || [];
  const titles = cards.map(c => c.title);
  const noTongbiKpi = cards.every(c => !c.hasTongbi) && !before.bodyHasTongbi;
  const noYoyVisible = cards.every(c => !c.yoyVisible || !/同比/.test(c.yoyText||''));

  const completed = cards.find(c => /完成合同额/.test(c.title));
  const others = cards.filter(c => !/完成合同额/.test(c.title));

  const ac1 = noTongbiKpi && noYoyVisible && others.length >= 3 && others.every(c => c.hasMonthAdd && c.hasPctOfTarget);
  // AC1 also says 每卡展示当月新增+占比 — exception is AC2 for 完成合同额
  report.checks['1_kpi_no_yoy_month_add_pct'] = {
    pass: ac1,
    noTongbiKpi, noYoyVisible,
    others: others.map(c => ({ title: c.title, hasMonthAdd: c.hasMonthAdd, hasPctOfTarget: c.hasPctOfTarget, full: c.full })),
    allTitles: titles
  };

  const ac2 = !!completed && completed.hasPrevMonthAdd && !completed.hasMonthAdd && completed.hasPctOfTarget && !completed.hasTongbi;
  report.checks['2_completed_contract_prev_month'] = {
    pass: ac2,
    completed: completed || null
  };

  // Risk AC3/4
  const riskText = before.riskText || '';
  const riskCards = before.riskCards || [];
  const recv = riskCards.find(c => /应收账款/.test(c.label) || /应收账款/.test(c.text));
  const revenue = riskCards.find(c => /营业收入/.test(c.label) || /营业收入/.test(c.text));
  const oldName = /1年以上应收/.test(riskText);
  const recvHasPeriod = recv ? /较上期/.test(recv.text + recv.small) : /应收账款[\s\S]{0,80}较上期/.test(riskText);
  const recvNoAging = recv ? !/1年以内|1年以上/.test(recv.text) : !/应收账款[\s\S]{0,60}1年以内/.test(riskText);
  const ac3 = recvHasPeriod && recvNoAging && !/应收账款[\s\S]{0,40}同比/.test(riskText);
  report.checks['3_receivable_vs_prior_period'] = {
    pass: ac3,
    recv, recvHasPeriod, recvNoAging
  };

  const revenueHasPeriod = revenue ? /较上期/.test(revenue.text + (revenue.small||'')) : /营业收入[\s\S]{0,60}较上期/.test(riskText);
  const ac4 = !oldName && (/营业收入/.test(riskText)) && revenueHasPeriod;
  report.checks['4_revenue_rename_vs_prior'] = {
    pass: ac4,
    oldNamePresent: oldName,
    hasRevenueName: /营业收入/.test(riskText),
    revenueHasPeriod,
    revenue
  };

  // Optional: verify % roughly matches value/target for one card
  const pctChecks = cards.map(c => {
    const value = parseNum(c.value);
    const targetM = c.full.match(/目标\s*([\d,.]+)/);
    const pctM = c.full.match(/占总目标\s*([\d.]+)\s*%/) || c.full.match(/占目标\s*([\d.]+)\s*%/g);
    // Prefer 占总目标 next to main value
    const mainPct = c.full.match(/占总目标\s*([\d.]+)\s*%/);
    const target = targetM ? parseNum(targetM[1]) : null;
    const pct = mainPct ? parseFloat(mainPct[1]) : null;
    let ok = null;
    if (value != null && target && pct != null && target !== 0) {
      const calc = (value / target) * 100;
      ok = Math.abs(calc - pct) <= 1.0; // allow 1pp demo rounding
    }
    return { title: c.title, value, target, pct, ok };
  });
  report.pctChecks = pctChecks;

  // === Filter switch AC5 ===
  // Change year select and sector if available
  await frame.evaluate(() => (document.getElementById('kpiGrid')||document.querySelector('.kpi-grid'))?.scrollIntoView({ block: 'start' }));
  const filterResult = await frame.evaluate(async () => {
    const selects = [...document.querySelectorAll('select')];
    const changed = [];
    for (const s of selects) {
      if (s.options.length < 2) continue;
      const prev = s.value;
      // pick a different option
      const opt = [...s.options].find(o => o.value !== prev) || s.options[Math.min(1, s.options.length-1)];
      if (!opt) continue;
      s.value = opt.value;
      s.dispatchEvent(new Event('change', { bubbles: true }));
      changed.push({ id: s.id || s.name, from: prev, to: opt.value, text: opt.text });
      if (changed.length >= 2) break; // year + one more
    }
    return changed;
  });
  await page.waitForTimeout(1500);
  const after = await snapshot('filtered');
  report.after = after;
  report.filterResult = filterResult;

  await page.screenshot({ path: path.join(OUT, `${PREFIX}-03-kpi-after-filter.png`), fullPage: false });
  const kpiClip2 = await page.evaluate(() => {
    const f = document.querySelector('iframe');
    const fr = f.getBoundingClientRect();
    const el = f.contentDocument.getElementById('kpiGrid') || f.contentDocument.querySelector('.kpi-grid');
    const r = el.getBoundingClientRect();
    return { x: Math.max(0, fr.left+r.left-2), y: Math.max(0, fr.top+r.top-2), width: Math.min(r.width+4, 1200), height: Math.min(r.height+8, 400) };
  });
  await page.screenshot({ path: path.join(OUT, `${PREFIX}-03b-kpi-grid-filtered.png`), clip: kpiClip2 });

  const afterCards = after.cards || [];
  const afterNoTongbi = afterCards.every(c => !c.hasTongbi) && !after.bodyHasTongbi;
  const afterMonth = afterCards.filter(c => !/完成合同额/.test(c.title)).every(c => c.hasMonthAdd);
  const afterPrev = afterCards.some(c => /完成合同额/.test(c.title) && c.hasPrevMonthAdd);
  const afterRiskOk = /较上期/.test(after.riskText||'') && /营业收入/.test(after.riskText||'') && !/同比/.test(after.riskText||'') && !/1年以上应收/.test(after.riskText||'');
  const ac5 = afterNoTongbi && afterMonth && afterPrev && afterRiskOk && filterResult.length >= 1;
  report.checks['5_filter_no_yoy_regression'] = {
    pass: ac5,
    afterNoTongbi, afterMonth, afterPrev, afterRiskOk,
    filterResult,
    afterCards: afterCards.map(c => ({ title: c.title, hasTongbi: c.hasTongbi, hasMonthAdd: c.hasMonthAdd, hasPrevMonthAdd: c.hasPrevMonthAdd, full: c.full }))
  };

  // AC6 evidence files
  const shots = fs.readdirSync(OUT).filter(f => f.startsWith(PREFIX) && f.endsWith('.png'));
  report.checks['6_evidence_saved'] = { pass: shots.length >= 3, shots };

  for (const [k,v] of Object.entries(report.checks)) {
    if (!v.pass) report.failures.push(k);
  }
  report.overallPass = report.failures.length === 0;

  fs.writeFileSync(path.join(OUT, `${PREFIX}-probe-result.json`), JSON.stringify(report, null, 2));
  console.log(JSON.stringify({
    overallPass: report.overallPass,
    failures: report.failures,
    checks: Object.fromEntries(Object.entries(report.checks).map(([k,v]) => [k, v.pass])),
    beforeCards: before.cards?.map(c => ({ title: c.title, hasTongbi: c.hasTongbi, hasMonthAdd: c.hasMonthAdd, hasPrevMonthAdd: c.hasPrevMonthAdd, hasPct: c.hasPctOfTarget, full: c.full })),
    riskText: before.riskText,
    riskCards: before.riskCards,
    pctChecks,
    filterResult,
    afterNoTongbi,
    afterSample: afterCards.map(c => c.full)
  }, null, 2));

  await browser.close();
})().catch(e => { console.error(e); process.exit(1); });
