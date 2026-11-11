import {MONTHLY_METRICS} from './monthly-model.js';

// Uses the same integer-cent matrix as the single-unit monthly view.
export function comparisonData(detail, selected, cumulative = false) {
  return selected.filter(name => detail.units.includes(name)).map(name => {
    const index = detail.units.indexOf(name);
    const raw = detail.matrix.map(row => row[index]);
    let total = 0;
    const values = raw.map(value => value === null ? null : cumulative && MONTHLY_METRICS[detail.key][1] !== 'balance' ? (total += value) : value);
    return {name, values, summary: MONTHLY_METRICS[detail.key][1] === 'balance' ? raw[7] : raw.reduce((sum, value) => sum + (value ?? 0), 0)};
  });
}

export function registerComparison(ctx) {
  const state = {selected: [], query: ''};
  const money = value => value === null ? '—' : ctx.money(value / 1000000);
  const balance = () => MONTHLY_METRICS[ctx.projectDetail.key][1] === 'balance';
  const mode = () => balance() ? '月末余额' : ctx.projectDetail.compareCumulative ? '年内累计' : '当月金额';
  function updateChoices() {
    const root = ctx.$('comparisonChoices');
    root.querySelectorAll('input').forEach(input => {
      input.checked = state.selected.includes(input.value);
      input.disabled = state.selected.length >= 3 && !input.checked;
      input.closest('label').hidden = !input.value.toLocaleLowerCase().includes(state.query.trim().toLocaleLowerCase());
    });
    ctx.$('comparisonCount').textContent = `已选 ${state.selected.length}/3 · 最多比较3个板块`;
    ctx.$('comparisonSelected').innerHTML = state.selected.map(name => `<button type="button" data-compare-remove="${ctx.safe(name)}" aria-label="移除${ctx.safe(name)}">${ctx.safe(name)} ×</button>`).join('');
    ctx.$('comparisonNoMatch').hidden = Array.from(root.querySelectorAll('label')).some(label => !label.hidden);
  }
  function drawComparison() {
    ctx.destroyMonthly();
    const detail = ctx.projectDetail, series = comparisonData(detail, state.selected, !balance() && detail.compareCumulative);
    const root = ctx.$('comparisonResult');
    if (series.length < 2) {root.innerHTML = '<p class="empty-state" role="status">请选择至少2个板块进行比较</p>';return;}
    const headers = ['月份', ...series.map(item => ctx.safe(item.name))];
    const rows = Array.from({length: 12}, (_, i) => [`${i + 1}月`, ...series.map(item => money(item.values[i]))]);
    root.innerHTML = `<div id="monthlyDetailChart" style="height:280px"></div><div class="monthly-table comparison-table">${ctx.table(headers, rows)}</div><div class="comparison-summary">${series.map(item => `<p>${ctx.safe(item.name)} · ${balance() ? '8月末余额' : '截至8月累计'}：<strong>${money(item.summary)}</strong> 万元</p>`).join('')}</div><button id="comparisonExport" class="dialog-action">导出比较数据</button>`;
    const colors = [ctx.colors.primary, ctx.colors.accent, ctx.colors.secondary];
    ctx.chart('monthlyDetailChart', {chart: {type: 'line'}, xAxis: {categories: rows.map(row => row[0])}, yAxis: {title: {text: `${mode()}（万元）`}}, legend: {enabled: true, itemStyle: {textOverflow: 'none'}}, tooltip: {shared: true, valueDecimals: 2, valueSuffix: ' 万元'}, plotOptions: {series: {connectNulls: false}}, series: series.map((item, index) => ({name: item.name, color: colors[index], data: item.values.map(value => value === null ? null : value / 1000000)}))});
  }
  function renderComparison() {
    const detail = ctx.projectDetail;
    if (balance()) detail.compareCumulative = false;
    ctx.$('monthlyPanel').innerHTML = `<div class="comparison-toolbar"><button id="comparisonBack" class="dialog-action">返回单板块明细</button><span>板块比较 · ${ctx.safe(MONTHLY_METRICS[detail.key][0])}</span></div><p class="dialog-description">演示数据 · 截至2026年8月 · 单位：万元。不受项目关键词影响。${balance() ? '比较月末余额，不作累计。' : '当月金额与年内累计使用相同月度序列。'}</p><label class="comparison-search">搜索板块 <input id="comparisonSearch" type="search" value="${ctx.safe(state.query)}" placeholder="输入板块名称或编码"></label><p id="comparisonCount" aria-live="polite"></p><div id="comparisonSelected" class="comparison-selected"></div><fieldset id="comparisonChoices"><legend>选择2—3个板块</legend>${detail.units.map(name => `<label><input type="checkbox" value="${ctx.safe(name)}">${ctx.safe(name)}</label>`).join('')}</fieldset><p id="comparisonNoMatch" hidden>没有匹配的板块</p>${balance() ? '' : `<div class="comparison-modes" role="group" aria-label="比较口径"><button data-compare-mode="month" aria-pressed="${!detail.compareCumulative}">当月金额</button><button data-compare-mode="cumulative" aria-pressed="${!!detail.compareCumulative}">年内累计</button></div>`}<div id="comparisonResult"></div>`;
    updateChoices();drawComparison();
  }
  function exportComparison() {
    const detail = ctx.projectDetail, series = comparisonData(detail, state.selected, !balance() && detail.compareCumulative);
    const rows = [[MONTHLY_METRICS[detail.key][0], ctx.state.year, mode(), '万元', '演示数据'], ['月份', ...series.map(item => item.name)], ...Array.from({length: 12}, (_, i) => [`${i + 1}月`, ...series.map(item => money(item.values[i]))]), [balance() ? '8月末余额' : '截至8月累计', ...series.map(item => money(item.summary))]];
    const csv = '\ufeff' + rows.map(row => row.map(value => '"' + String(value).replaceAll('"', '""') + '"').join(',')).join('\r\n');
    const url = URL.createObjectURL(new Blob([csv], {type: 'text/csv;charset=utf-8'})), link = document.createElement('a');
    link.href = url;link.download = `${MONTHLY_METRICS[detail.key][0]}_板块比较_${mode()}_演示.csv`;link.click();ctx.lifecycle.timeout(() => URL.revokeObjectURL(url), 0);
  }
  ctx.lifecycle.listen(document, 'input', event => {if (event.target.id === 'comparisonSearch') {state.query = event.target.value;updateChoices();}});
  ctx.lifecycle.listen(document, 'change', event => {
    if (!event.target.matches('#comparisonChoices input') || !ctx.projectDetail?.comparing) return;
    const name = event.target.value;
    if (event.target.checked && state.selected.length < 3 && !state.selected.includes(name)) state.selected.push(name);
    else if (!event.target.checked) state.selected = state.selected.filter(item => item !== name);
    updateChoices();drawComparison();
  });
  ctx.lifecycle.listen(document, 'click', event => {
    const button = event.target.closest('button');if (!button || !ctx.projectDetail) return;
    if (button.id === 'comparisonStart' && ctx.state.unit === '全部板块') {ctx.projectDetail.comparing = true;state.query = '';ctx.renderMonthly();}
    else if (button.id === 'comparisonBack') {ctx.projectDetail.comparing = false;ctx.renderMonthly();}
    else if (button.dataset.compareRemove) {state.selected = state.selected.filter(name => name !== button.dataset.compareRemove);updateChoices();drawComparison();}
    else if (button.dataset.compareMode) {ctx.projectDetail.compareCumulative = button.dataset.compareMode === 'cumulative';renderComparison();}
    else if (button.id === 'comparisonExport') exportComparison();
  });
  Object.assign(ctx, {renderComparison});
}
