const assert = require('node:assert/strict');
const fs = require('node:fs');
const PD = require('../../../public/operations-dashboard-202610/project-details');
let checks = 0;
const check = value => { assert.ok(value); checks++; };
const units = [{ name: 'SAS170 PMC板块', weight: 12 }, { name: 'SAS610 咨询板块', weight: 11 }];
const allUnits = units.map(unit => unit.name);
for (const amount of ['9,234.31', '0.01', '0.00', '-3.26']) {
  for (const key of ['contract', 'completed', 'invoice', 'receipt', 'wip', 'receivables']) {
    const rows = PD.makeRows({ key, year: 2026, displayAmount: amount, units, allUnits });
    check(rows.reduce((n, row) => n + row.amountCents, 0) === PD.wanToCents(amount));
    check(rows.length === (key === 'contract' ? 96 : 48));
    check(rows.every(row => Number.isSafeInteger(row.amountCents) && row.name.startsWith('模拟') && row.customer.startsWith('模拟')));
    check(rows.every(row => PD.rowCells(row, key === 'contract').length === (key === 'contract' ? 10 : 9)));
  }
}
const rows = PD.makeRows({ key: 'contract', year: 2026, displayAmount: '1234.56', units, allUnits });
check(new Set(rows.map(row => row.type)).size === 2);
check(PD.filterRows(rows, units[0].name, '').every(row => row.unit === units[0].name));
const first = rows[0];
for (const term of [first.projectCode, first.name, first.manager, first.customer]) check(PD.filterRows(rows, '', term).length > 0);
check(PD.filterRows(rows, '', '不存在的项目').length === 0);
const csv = PD.csv(rows, true);
check(csv.charCodeAt(0) === 0xfeff && csv.split('\r\n').length === rows.length + 1);
check(csv.split('\r\n')[0].endsWith('"类型"'));
check(PD.wanToCents('1.00') === 1000000 && PD.wanToCents('0.01') === 10000);
check(PD.allocate(1, [1, 1, 1]).reduce((n, v) => n + v, 0) === 1);
const narrowed = PD.makeRows({ key: 'wip', year: 2026, displayAmount: '200.00', units: [units[1]], allUnits });
check(narrowed.every(row => row.projectCode.startsWith('D2602')));
const result = { verdict: 'PASS', checks, coverage: 'six metrics; positive, zero, negative and one-unit totals; project fields, search, CSV and stable IDs' };
fs.writeFileSync('docs/evidence/2026-11-10-ops-project-details/model-results.json', JSON.stringify(result, null, 2));
console.log(JSON.stringify(result));
