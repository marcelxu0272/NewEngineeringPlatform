// Focused UI-data regression checks; all state and storage stay in this process.
const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const path = require('node:path');
let options;
const context = {
  Vue: function (definition) { options = definition; },
  localStorage: { getItem: () => null, setItem: () => {} },
  window: { location: { search: '' } },
  URLSearchParams,
  setTimeout: fn => fn(),
  console,
};
vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../public/yinchuan-performance-payout/js/app.js'), 'utf8'), context);
function app() {
  const x = options.data();
  x.state = JSON.parse(JSON.stringify(x.state));
  Object.entries(options.methods).forEach(([key, fn]) => { x[key] = fn.bind(x); });
  Object.entries(options.computed).forEach(([key, fn]) => Object.defineProperty(x, key, { get: fn.bind(x) }));
  x.$message = () => {};
  x.$nextTick = fn => fn();
  options.created.call(x);
  return x;
}
const x = app();
assert.equal(x.todoInterCount, 1);
x.interScope = 'todo';
assert.equal(x.filteredInterSheets.length, 1);
assert.equal(x.filteredInterSheets[0].status, 'INTER_REJECTED');
x.interFilter.keyword = '新材料';
assert.equal(x.todoInterCount, 1, 'editing a search draft must not immediately filter');
x.searchInter();
assert.equal(x.todoInterCount, 0);
assert.equal(x.filteredInterSheets.length, 0);
x.interScope = 'all';
assert.equal(x.filteredInterSheets.length, 2);
x.resetInter();
x.currentRole = 'K2';
assert.equal(x.todoInterCount, 1);
const pending = x.state.interSheets.find(s => s.status === 'INTER_PENDING');
pending.k2Status = 'confirmed';
assert.equal(x.todoInterCount, 0, 'confirmed K2 is no longer a todo');
x.currentRole = 'K3';
assert.equal(x.todoInterCount, 1, 'K3 remains pending independently');
x.currentRole = 'LEAD:u_sunqiang';
x.intraScope = 'todo';
assert.ok(x.filteredIntraSheets.length > 0);
assert.equal(x.todoIntraCount, x.filteredIntraSheets.length);
assert.ok(x.filteredIntraSheets.every(s => s.leadUserId === x.currentUserId && x.canEditIntra(s)));
const directorRow = x.computedIntraSheets.find(s => s.status === 'INTRA_PENDING');
x.currentRole = 'DIRECTOR:' + directorRow.directorUserId;
assert.ok(x.todoIntraCount > 0);
assert.ok(x.filteredIntraSheets.every(s => x.canApproveIntra(s)));
x.intraQuery.status = 'INTRA_APPROVED';
assert.equal(x.todoIntraCount, 0);
x.interPage = 5;
options.watch.interScope.call(x);
assert.equal(x.interPage, 1);
x.interPage = 5;
options.watch.filteredInterSheets.call(x, []);
assert.equal(x.interPage, 1, 'empty results clamp pagination');
const y = app();
y.evalScope = 'todo';
assert.equal(y.filteredEvalProjects.length, y.todoEvalCount);
assert.equal(y.todoEvalCount, 1);
y.evalProjectId = y.filteredEvalProjects[0].id;
y.initEvalDraft();
assert.equal(y.evaluationSummary.before, 200000);
assert.equal(y.evaluationSummary.after, 200000);
const d = y.currentEvalSheet.disciplines[0];
const p = d.persons[0];
const option = y.state.config.quality.options.find(o => o.coef === 0.9);
y.evalDraft[d.disciplineId + '|' + p.userId].qualityOptionId = option.id;
assert.equal(y.evaluationSummary.after, 198400);
assert.equal(y.evaluationSummary.difference, -1600);
// Use a fractional pool to exercise the actual submit-time rounding distribution.
y.state.interSheets.find(s => s.id === y.evalProjectId).contractAmountExclTax = 1234567.89;
const preview = y.currentEvalSheet.disciplines.flatMap(d => d.persons.map(p => y.draftAmount(d, p)));
const total = y.evaluationSummary.after;
y.submitEvaluation();
const locked = y.currentEvalSheet.disciplines.flatMap(d => d.persons.map(p => p.amount));
assert.deepEqual(Array.from(preview), Array.from(locked), 'preview and locked row amounts must match including rounding');
assert.equal(y.evaluationSummary.after, total);
assert.equal(y.todoEvalCount, 0);
assert.equal(y.filteredEvalProjects.length, 0);
y.openFormula({ kind: 'project', interId: y.evalProjectId });
assert.equal(y.formulaBox.statusMeta.text, '已锁定');
assert.ok(y.formulaBox.title.includes(y.currentEvalSheet.sheetNo));
assert.equal(y.formulaSections.length, 0);
y.configForm.k2.default = 1.5;
y.currentRole = 'ADMIN';
options.watch.currentRole.call(y);
assert.equal(y.configForm.k2.default, y.state.config.k2.default);
console.log('PASS: role-scoped todos, committed filters, pagination, evaluation summary, rounding and locking, detail metadata, rule view reset');
