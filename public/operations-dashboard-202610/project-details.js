/* Project-level synthetic drill-down records. No production project/person data. */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.OpsProjectDetails = api;
})(typeof window === 'object' ? window : globalThis, function () {
  'use strict';
  const HEADERS = ['项目编号', '项目名称', '甲方名称', '项目经理', '负责人', '管理归属', '业务类型', '日期', '金额（元）'];
  function wanToCents(display) {
    const clean = String(display).replace(/,/g, '').trim();
    if (!/^-?\d+(\.\d{1,2})?$/.test(clean)) throw new Error('Invalid displayed amount');
    const [whole, decimals = ''] = clean.replace('-', '').split('.');
    return (Number(whole) * 100 + Number(decimals.padEnd(2, '0'))) * 10000 * (clean.startsWith('-') ? -1 : 1);
  }
  function allocate(total, weights) {
    const sign = total < 0 ? -1 : 1, absolute = Math.abs(total), denominator = weights.reduce((sum, weight) => sum + weight, 0);
    if (!weights.length) return [];
    const exact = weights.map(weight => absolute * weight / denominator);
    const result = exact.map(Math.floor);
    let remainder = absolute - result.reduce((sum, amount) => sum + amount, 0);
    exact.map((value, i) => ({ i, remainder: value - result[i] })).sort((a, b) => b.remainder - a.remainder || a.i - b.i).forEach(item => {
      if (remainder > 0) { result[item.i]++; remainder--; }
    });
    return result.map(amount => amount * sign);
  }
  function makeRows(options) {
    const units = options.units, cents = wanToCents(options.displayAmount);
    const unitAmounts = allocate(cents, units.map(unit => unit.weight));
    const rows = [];
    units.forEach((unit, u) => {
      const unitIndex = options.allUnits.indexOf(unit.name) + 1;
      const amounts = allocate(unitAmounts[u], Array.from({ length: 24 }, (_, i) => 1 + (unitIndex + i * 7) % 13));
      for (let i = 0; i < 24; i++) {
        const project = {
          projectCode: `D${String(options.year).slice(-2)}${String(unitIndex).padStart(2, '0')}${String(i + 1).padStart(2, '0')}`,
          name: `模拟${['产业园设计', '能源咨询', '工程建设', '技术改造'][i % 4]}项目${unitIndex}-${i + 1}`,
          customer: `模拟甲方${String((unitIndex * 3 + i) % 20 + 1).padStart(2, '0')}`,
          manager: `模拟经理${String((unitIndex + i) % 16 + 1).padStart(2, '0')}`,
          owner: `模拟主管${String((unitIndex + i * 3) % 10 + 1).padStart(2, '0')}`,
          unit: unit.name, business: ['EPC', '项目管理', '工程咨询', '新建设计', '技改设计'][i % 5],
          date: `${options.year}-${String(i % 8 + 1).padStart(2, '0')}-${String(i % 24 + 1).padStart(2, '0')}`,
        };
        if (options.key === 'contract') {
          const parts = allocate(amounts[i], [8 + i % 3, 2]);
          ['新签', '变更'].forEach((type, j) => rows.push({ ...project, id: `${project.projectCode}-${j}`, amountCents: parts[j], type,
            date: j ? `${options.year}-${String(i % 8 + 1).padStart(2, '0')}-28` : project.date }));
        } else rows.push({ ...project, id: project.projectCode, amountCents: amounts[i] });
      }
    });
    return rows.sort((a, b) => b.amountCents - a.amountCents || a.id.localeCompare(b.id));
  }
  function filterRows(rows, unit, query) {
    const term = String(query || '').trim().toLocaleLowerCase();
    return rows.filter(row => (!unit || row.unit === unit) && (!term || [row.projectCode, row.name, row.manager, row.customer].some(value => value.toLocaleLowerCase().includes(term))));
  }
  function rowCells(row, withType) {
    const amount = (row.amountCents / 100).toFixed(2);
    return [row.projectCode, row.name, row.customer, row.manager, row.owner, row.unit, row.business, row.date, amount, ...(withType ? [row.type] : [])];
  }
  function csv(rows, withType) {
    const escape = value => '"' + String(value).replace(/"/g, '""') + '"';
    return '\ufeff' + [[...HEADERS, ...(withType ? ['类型'] : [])], ...rows.map(row => rowCells(row, withType))].map(row => row.map(escape).join(',')).join('\r\n');
  }
  return { HEADERS, wanToCents, allocate, makeRows, filterRows, rowCells, csv };
});
