const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

const root = path.resolve(__dirname, '../../..');
const output = __dirname;
const base = process.env.TIMESHEET_BASE_URL || 'http://localhost:3001';
const checks = [];
const pageErrors = [];
const snapshots = [];
function check(name, condition, details) {
  assert.ok(condition, `${name}: ${JSON.stringify(details)}`);
  checks.push({ name, details });
}
const value = text => Number(text.replace(/[^\d.\-]/g, ''));

async function selectOption(page, label, option) {
  const combo = page.getByRole('combobox', { name: label, exact: true });
  await page.locator('.ant-select').filter({ has: combo }).locator('.ant-select-selector').click();
  // Ant Design virtualizes these options. Exercise its real keyboard navigation
  // instead of clicking an unmounted item or its hidden accessibility mirror.
  for (let i = 0; i < 20; i++) {
    await page.waitForTimeout(35);
    const activeId = await combo.getAttribute('aria-activedescendant');
    const active = activeId ? await page.locator(`[id="${activeId}"]`).getAttribute('aria-label') : null;
    if (active === option) { await combo.press('Enter'); return; }
    await combo.press('ArrowDown');
  }
  throw new Error(`未找到可选项 ${label}: ${option}`);
}
async function chart(frame, id) {
  return frame.evaluate(id => {
    const instance = echarts.getInstanceByDom(document.getElementById(id));
    return { option: instance.getOption(), width: instance.getWidth(), height: instance.getHeight() };
  }, id);
}
async function download(page, locator) {
  const pending = page.waitForEvent('download');
  await locator.click();
  const item = await pending;
  const data = fs.readFileSync(await item.path());
  return { name: item.suggestedFilename(), bom: data.subarray(0, 3).equals(Buffer.from([239, 187, 191])), text: data.toString('utf8').replace(/^\uFEFF/, '') };
}

(async () => {
  const html = fs.readFileSync(path.join(root, 'public/operations-dashboard-202610/timesheet.html'), 'utf8');
  const scripts = [...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi)].map(m => m[1]).filter(s => s.trim());
  scripts.forEach((script, i) => new vm.Script(script, { filename: `timesheet-inline-${i}.js` }));
  const moduleDir = path.join(root, 'public/operations-dashboard-202610/timesheet');
  for (const name of fs.readdirSync(moduleDir).filter(name => name.endsWith('.js'))) {
    const result = ts.transpileModule(fs.readFileSync(path.join(moduleDir, name), 'utf8'), { reportDiagnostics: true, compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.CommonJS } });
    assert.ok(!(result.diagnostics || []).some(d => d.category === ts.DiagnosticCategory.Error), name);
    new vm.Script(result.outputText, { filename: name });
  }
  check('工时页ES模块入口与脚本语法', html.includes('type="module" src="./timesheet/app.js"'));
  const shell = ts.transpileModule(fs.readFileSync(path.join(root, 'app/operations-dashboard-202610/board/page.tsx'), 'utf8'), {
    reportDiagnostics: true,
    compilerOptions: { jsx: ts.JsxEmit.Preserve, target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.ESNext },
  });
  check('Board TSX 语法', !(shell.diagnostics || []).some(d => d.category === ts.DiagnosticCategory.Error));

  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, acceptDownloads: true });
    page.on('pageerror', error => pageErrors.push(String(error)));
    await page.goto(`${base}/operations-dashboard-202610/board`, { waitUntil: 'networkidle', timeout: 60000 });
    await page.getByRole('treeitem', { name: '工时看板', exact: true }).click();
    const frame = page.frames().find(f => f.url().endsWith('/timesheet.html'));
    assert.ok(frame, '工时 iframe 已加载');
    await frame.waitForFunction(() => document.body.dataset.ready === 'true');
    await frame.waitForFunction(() => document.querySelector('#effectiveDepartment').textContent.includes('SAS610'));
    check('全部板块映射咨询且不回写壳', (await page.getByRole('combobox', { name: '组织板块' }).evaluate(e => e.closest('.ant-select').textContent)).includes('全部板块'));
    const bodyText = await frame.locator('body').innerText();
    check('演示标识及固定报告期', bodyText.includes('演示数据') && bodyText.includes('2026-11-01') && bodyText.includes('2026-11-03'));
    check('不含软件用量与部门排名', !bodyText.includes('工程软件用量') && !bodyText.includes('部门/分公司负荷率预测'));
    check('无重复组织年度控件', await frame.locator('[aria-label="组织板块"],[aria-label="统计年度"]').count() === 0);
    const model = await frame.evaluate(() => window.timesheetDashboard.model);
    const near = (a, b) => Math.abs(a - b) < 0.015;
    check('批准工时由同一份项目及 OverHead 汇总', near(model.report.approvedHours, model.report.projectHours + model.report.overheadHours) && near(value(await frame.locator('#approvedHours').innerText()), model.report.approvedHours));
    check('报告期负荷计算及卡片数值一致', near(model.report.rate, model.report.projectHours / model.report.standardHours * 100) && near(value(await frame.locator('#reportLoad').innerText()), model.report.rate));
    check('人员报告工时与标准工时合计一致', near(model.people.reduce((n, p) => n + p.projectHours, 0), model.report.projectHours) && near(model.people.reduce((n, p) => n + p.standardHours, 0), model.report.standardHours));
    check('逐日工时与报告期合计一致', near(model.days.reduce((n, d) => n + d.projectHours, 0), model.report.projectHours) && near(model.days.reduce((n, d) => n + d.standardHours, 0), model.report.standardHours));
    for (const [i, forecast] of model.forecasts.entries()) {
      check(`预测汇总使用容量加权 ${forecast.month}`, near(forecast.availableHours, model.people.reduce((n, p) => n + p.forecast[i].availableHours, 0)) && near(forecast.assignedHours, model.people.reduce((n, p) => n + p.forecast[i].assignedHours, 0)) && near(forecast.rate, forecast.assignedHours / forecast.availableHours * 100));
    }
    check('默认样例含零工时与超100人员', model.people.some(p => p.forecast.some(f => f.rate > 100)) && model.people.some(p => p.forecast.some(f => f.rate === 0)));
    const months = await frame.locator('[data-forecast-month]').evaluateAll(es => es.map(e => e.dataset.forecastMonth));
    check('跨年三月控件', ['2026-12', '2027-01', '2027-02'].every(m => months.includes(m)), months);

    // Validate all four real dialogs, including keyboard dismissal and department inheritance.
    for (const kind of ['baseline', 'reported', 'projects', 'people']) {
      await frame.locator(`[data-detail-kind="${kind}"]`).click();
      const dialog = frame.locator('#detailDialog');
      check(`统计明细 ${kind}`, await dialog.isVisible() && (await frame.locator('#detailContext').innerText()).includes('SAS610') && await frame.locator('#detailTable tbody tr').count() > 0);
      await page.keyboard.press('Escape');
      check(`明细 Esc 关闭 ${kind}`, !await dialog.isVisible());
    }
    await frame.locator('[data-detail-kind="people"]').click();
    const lockedY = await frame.evaluate(() => scrollY);
    const iframeRect = await page.locator('iframe[src$="timesheet.html"]').boundingBox();
    await page.mouse.move(iframeRect.x + 4, iframeRect.y + 8);
    await page.mouse.wheel(0, 650);
    await page.waitForTimeout(150);
    check('明细弹窗背景滚轮不穿透', await frame.evaluate(() => scrollY) === lockedY);
    await page.screenshot({ path: path.join(output, 'detail-dialog.png') });
    await frame.locator('#closeDetail').click();
    check('明细关闭恢复焦点', await frame.evaluate(() => document.activeElement.dataset.detailKind) === 'people');
    await frame.locator('[data-trend-mode="report"]').click();
    let trend = await chart(frame, 'departmentTrendChart');
    check('报告期逐日趋势', trend.option.xAxis[0].data.length === 3, trend.option.xAxis[0].data);
    await frame.locator('[data-trend-mode="history"]').click();
    trend = await chart(frame, 'departmentTrendChart');
    check('六个月实际加三个月预测', trend.option.xAxis[0].data.length === 9 && trend.option.series.some(s => s.lineStyle?.type === 'dashed'), { axis: trend.option.xAxis[0].data });
    let forecast = await chart(frame, 'departmentForecastChart');
    check('仅本部门三个月条形', forecast.option.series[0].data.length === 3, forecast.option.series[0].data);

    const sort = frame.locator('#personnelSort');
    const sortTag = await sort.evaluate(e => e.tagName);
    if (sortTag === 'SELECT') {
      const options = await sort.locator('option').evaluateAll(es => es.map(e => ({ value: e.value, text: e.textContent })));
      const asc = options.find(o => /低.*高|升序/.test(o.text));
      const desc = options.find(o => /高.*低|降序/.test(o.text));
      assert.ok(asc && desc, '升降序选项');
      for (const order of [asc, desc]) {
        await sort.selectOption(order.value);
        const current = await chart(frame, 'personnelForecastChart');
        const vals = current.option.series[0].data.map(d => typeof d === 'number' ? d : d.value).filter(v => v !== null);
        check(`人员排序 ${order.text}`, vals.every((v, i) => i === 0 || (order === asc ? vals[i - 1] <= v : vals[i - 1] >= v)), vals);
      }
    }
    for (const month of ['2026-12', '2027-01', '2027-02']) {
      await frame.locator(`[data-forecast-month="${month}"]`).click();
      const summary = await download(page, frame.locator('#exportSummary'));
      const detail = await download(page, frame.locator('#exportDetails'));
      check(`CSV BOM 与部门月份 ${month}`, summary.bom && detail.bom && summary.text.includes('SAS610') && detail.text.includes('SAS610') && summary.text.includes(month) && detail.text.includes(month), { summary: summary.name, detail: detail.name });
      fs.writeFileSync(path.join(output, `summary-${month}.csv`), '\uFEFF' + summary.text);
      fs.writeFileSync(path.join(output, `details-${month}.csv`), '\uFEFF' + detail.text);
    }
    const personnel = await chart(frame, 'personnelForecastChart');
    const firstName = personnel.option.yAxis[0].data[0];
    await frame.locator('#personnelSearch').fill(firstName);
    await frame.locator('#searchPersonnel').click();
    let filtered = await chart(frame, 'personnelForecastChart');
    check('人员姓名搜索', filtered.option.yAxis[0].data.length === 1 && filtered.option.yAxis[0].data[0] === firstName, filtered.option.yAxis[0].data);
    const filteredCSV = await download(page, frame.locator('#exportDetails'));
    check('明细导出沿用搜索结果', filteredCSV.text.includes(firstName) && filteredCSV.text.trim().split(/\r?\n/).length <= 3, filteredCSV.text);
    await frame.locator('#personnelSearch').fill('不存在的人员');
    await frame.locator('#searchPersonnel').click();
    check('人员无匹配空态', await frame.locator('#personnelEmpty').isVisible());
    await frame.locator('#personnelSearch').fill('');
    await frame.locator('#searchPersonnel').click();

    // Real shell messages: verify all supported units and three themes through the actual controls.
    const units = ['SAS170 PMC板块', 'SAS610 咨询板块', 'SAS680 数字技术板块', 'SAS650 新材料板块', 'SAS710 生命科学板块', 'SAS690 COII板块', 'SAS720 模块化板块', 'SAS670 供应链板块', 'SAS520 金山中心', 'SAS560 沈阳中心', 'SAS550 惠湛中心', 'SAS530 银川中心'];
    for (const unit of units) {
      await selectOption(page, '组织板块', unit);
      await frame.waitForFunction(unit => document.getElementById('effectiveDepartment').textContent.includes(unit), unit);
      const text = await frame.locator('body').innerText();
      check(`部门切换 ${unit}`, !/NaN|Infinity/.test(text));
      const data = await frame.evaluate(() => window.timesheetDashboard.model);
      check(`当前部门模型及全部预测 ${unit}`, data.unit === unit && data.forecasts.length === 3 && data.forecasts.every(f => f.tbdHours === 0));
      if (unit.startsWith('SAS520')) {
        check('零工时显示真实零', value(await frame.locator('#approvedHours').innerText()) === 0 && value(await frame.locator('#reportLoad').innerText()) === 0 && data.forecasts.every(f => f.rate === 0));
      }
      if (unit.startsWith('SAS720')) {
        check('零标准工时不除零', (await frame.locator('#reportLoad').innerText()).includes('—') && data.report.rate === null && data.forecasts.every(f => f.rate === null));
      }
      if (unit.startsWith('SAS550')) {
        check('无数据与真实零区分', (await frame.locator('#approvedHours').innerText()).includes('—') && data.available === false && data.people.length === 0);
      }
    }
    await selectOption(page, '组织板块', '全部板块');
    await frame.waitForFunction(() => document.getElementById('effectiveDepartment').textContent.includes('SAS610'));
    for (const [label, theme] of [['青绿主题', 'teal'], ['暖棕主题', 'wood'], ['深蓝主题', 'blue']]) {
      await selectOption(page, '主题颜色', label);
      await frame.waitForFunction(theme => document.documentElement.dataset.theme === theme, theme);
      check(`主题同步 ${label}`, true);
    }
    await page.getByRole('treeitem', { name: 'WIP 账龄分析', exact: true }).click();
    await page.getByRole('treeitem', { name: '工时看板', exact: true }).click();
    check('切换 PDF 后返回保留部门主题', (await frame.locator('#effectiveDepartment').innerText()).includes('SAS610') && await frame.evaluate(() => document.documentElement.dataset.theme) === 'blue');

    // Measure layout inside the shell, rather than an unrealistically wide standalone HTML page.
    for (const size of [{ width: 1440, height: 1000 }, { width: 1280, height: 720 }]) {
      await page.setViewportSize(size);
      await frame.waitForTimeout(250);
      const geometry = await frame.evaluate(() => ({ width: innerWidth, scrollWidth: document.documentElement.scrollWidth, clientWidth: document.documentElement.clientWidth, height: innerHeight, scrollHeight: document.documentElement.scrollHeight }));
      check(`内容无横向溢出 ${size.width}`, geometry.scrollWidth <= geometry.clientWidth + 1, geometry);
      const layout = await frame.evaluate(() => ({ kpis: [...document.querySelectorAll('.kpi-card')].map(e => e.getBoundingClientRect().toJSON()), bottom: [...document.querySelectorAll('.bottom-grid > .panel')].map(e => e.getBoundingClientRect().toJSON()) }));
      check(`顶部2×2及底部双列 ${size.width}`, layout.kpis.length === 4 && Math.abs(layout.kpis[0].x - layout.kpis[2].x) < 1 && Math.abs(layout.kpis[1].x - layout.kpis[3].x) < 1 && layout.kpis[2].y > layout.kpis[0].y && Math.abs(layout.bottom[0].y - layout.bottom[1].y) < 1 && layout.bottom[1].x > layout.bottom[0].x, layout);
      const shellGeometry = await page.evaluate(() => ({ width: innerWidth, height: innerHeight, scrollWidth: document.documentElement.scrollWidth, scrollHeight: document.documentElement.scrollHeight }));
      check(`壳无重复滚动 ${size.width}`, shellGeometry.scrollWidth <= shellGeometry.width + 1 && shellGeometry.scrollHeight <= shellGeometry.height + 1, shellGeometry);
      await frame.evaluate(() => scrollTo(0, 0));
      await page.screenshot({ path: path.join(output, `board-${size.width}-top.png`) });
      await frame.locator('#departmentForecastChart').scrollIntoViewIfNeeded();
      await page.screenshot({ path: path.join(output, `board-${size.width}-bottom.png`) });
      snapshots.push({ ...size, iframe: geometry });
    }
    const before = await chart(frame, 'departmentTrendChart');
    await page.getByTestId('shell-sidebar-collapse').click();
    await frame.waitForTimeout(300);
    const after = await chart(frame, 'departmentTrendChart');
    check('折叠侧栏触发图表 resize', after.width > before.width, { before: before.width, after: after.width });
    await page.getByTestId('shell-sidebar-collapse').click();
    check('无浏览器运行错误', pageErrors.length === 0, pageErrors);
    fs.writeFileSync(path.join(output, 'verification.json'), JSON.stringify({ result: 'PASS', checks, snapshots, pageErrors }, null, 2));
    console.log(JSON.stringify({ result: 'PASS', checks: checks.length, snapshots, pageErrors }, null, 2));
  } finally { await browser.close(); }
})().catch(error => {
  fs.writeFileSync(path.join(output, 'verification.json'), JSON.stringify({ result: 'FAIL', error: error.stack, checks, snapshots, pageErrors }, null, 2));
  console.error(error);
  process.exitCode = 1;
});
