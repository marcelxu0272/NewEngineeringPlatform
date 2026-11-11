const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
(async () => {
  const browser = await chromium.launch({ headless: true });
  const errors = [], results = []; let checks = 0;
  const check = (value, label) => { assert.ok(value, label); checks++; };
  try {
    for (const [id, html, expectedCharts] of [['overview','index.html',5],['completed-contract','completed-contract.html',3],['timesheet','timesheet.html',4],['hr','hr.html',1]]) {
      const page = await browser.newPage({ viewport: { width: 1100, height: 850 } });
      page.on('pageerror', e => errors.push(`${id}: ${e.message}`));
      await page.goto(`http://localhost:3001/operations-dashboard-202610/${html}`, { waitUntil: 'networkidle' });
      await page.waitForFunction(() => !!window.__boardRuntime);
      check(await page.locator('.highcharts-container,[_echarts_instance_]').count() === expectedCharts, `${id} charts`);
      const themeBefore = await page.locator('html').getAttribute('data-theme');
      await page.evaluate(() => window.dispatchEvent(new MessageEvent('message', { origin: 'https://untrusted.invalid', data: { type:'ops-dashboard-theme',theme:'wood' } })));
      check(await page.locator('html').getAttribute('data-theme') === themeBefore, `${id} foreign message ignored`);
      await page.evaluate(() => window.__boardRuntime.update({year:2026,unit:'SAS170 PMC板块',theme:'wood'}));
      check(await page.locator('html').getAttribute('data-theme') === 'wood', `${id} update theme`);
      if (id === 'overview') {
        check(await page.evaluate(() => window.dashboard.state.unit) === 'SAS170 PMC板块');
        await page.locator('[data-kpi="contract"]').click(); check(await page.locator('#detailDialog tbody tr').count() === 10); await page.locator('#closeDialog').click();
      } else if (id === 'completed-contract') {
        check(await page.evaluate(() => window.__ccProbe().seriesTrend) === 6);
        await page.locator('#btnTreeMore').click(); check(await page.locator('#modal').isVisible()); await page.locator('#modalClose').click();
      } else if (id === 'timesheet') {
        check(await page.evaluate(() => window.timesheetDashboard.state.effectiveUnit) === 'SAS170 PMC板块');
        await page.locator('[data-forecast-month="2027-01"]').click(); check(await page.evaluate(() => window.timesheetDashboard.state.month) === '2027-01');
      } else {
        check(await page.evaluate(() => window.hrDashboard.state.unit) === 'SAS170 PMC板块');
        await page.evaluate(() => window.__boardRuntime.update({year:2026,unit:'全部板块',theme:'wood'}));
        await page.locator('#openPersonnelSearch').click(); await page.locator('#hrPersonnelSearch').fill('董烨'); await page.locator('#hrPersonnelSearchForm').evaluate(el => el.requestSubmit());
        check((await page.locator('#hrSearchResults').textContent()).includes('董烨')); await page.locator('#closeHrDialog').click();
        await page.locator('#openDemandPivot').click(); check(await page.locator('#hrPivotTableContainer table').count() > 0); await page.locator('#closeHrDialog').click();
      }
      for (let cycle = 0; cycle < 2; cycle++) {
        await page.evaluate(() => window.__boardRuntime.destroy());
        check(await page.evaluate(() => window.__boardRuntime.disposed) === true, `${id} disposed`);
        check(await page.evaluate(() => document.querySelectorAll('.highcharts-container').length === 0 && Array.from(document.querySelectorAll('[_echarts_instance_]')).every(el => !window.echarts?.getInstanceByDom(el))), `${id} charts disposed`);
        if (id==='completed-contract') check(await page.locator('#btnTreeMore').evaluate(el=>el.onclick===null), 'onclick handler restored');
        await page.evaluate(async id => { const module = await import(`/operations-dashboard-202610/${id}/app.js`); window.__boardRuntime=module.mount(); }, id);
        await page.waitForFunction(count => document.querySelectorAll('.highcharts-container,[_echarts_instance_]').length === count, expectedCharts);
        check(await page.evaluate(() => !window.__boardRuntime.disposed), `${id} remounted`);
      }
      results.push({ id, mountCycles: 2, charts: expectedCharts }); await page.close();
    }
    const zero=await browser.newPage();await zero.goto('http://localhost:3001/operations-dashboard-202610/completed-contract.html?emptyTree=all-zero&emptyAlerts=1',{waitUntil:'networkidle'});
    check(await zero.evaluate(()=>window.__ccProbe().treemapTiles.length)===0);check(await zero.evaluate(()=>window.__ccProbe().emptyAlerts)===true);await zero.close();
    check(errors.length === 0, errors.join('\n'));
    const output = { verdict:'PASS',checks,errors,results };
    fs.writeFileSync(path.join(__dirname,'static-results.json'),JSON.stringify(output,null,2));console.log(JSON.stringify(output));
  } finally { await browser.close(); }
})().catch(error=>{console.error(error);process.exitCode=1;});
