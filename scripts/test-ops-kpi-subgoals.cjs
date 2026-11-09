// 运营看板顶部四 KPI 子目标纯函数单测：node --test scripts/test-ops-kpi-subgoals.cjs
// 文中权重与 13.23% / 115.68% 均为「仅测试」，不是演示主数据或业务比例。
const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const KS = require(path.join(__dirname, '../public/operations-dashboard-202610/kpi-subgoals.js'));

test('展示金额换 0.01 万元整数并写回千分位', () => {
  assert.equal(KS.unitsFromDisplay('1.00'), 100n);
  assert.equal(KS.unitsFromDisplay('9,234.31'), 923431n);
  assert.equal(KS.unitsFromDisplay('0.00'), 0n);
  assert.equal(KS.formatUnits(923431n), '9,234.31');
  assert.equal(KS.formatUnits(5n), '0.05');
  assert.equal(KS.formatUnits(123456789n), '1,234,567.89');
  assert.throws(() => KS.unitsFromDisplay('1.0'), RangeError);
  assert.throws(() => KS.unitsFromDisplay('-1.00'), RangeError);
  assert.throws(() => KS.unitsFromDisplay('—'), RangeError);
});

test('验算例：主额 1.00、仅测试权重 1:1:1 → 0.34 / 0.33 / 0.33', () => {
  assert.deepEqual(KS.allocate(100n, [1, 1, 1]), [34n, 33n, 33n]);
  assert.deepEqual(KS.allocate(100n, [1, 1, 1]).map(KS.formatUnits), ['0.34', '0.33', '0.33']);
});

test('余数按精确小数部分从大到小，平手按 EPC、PMC、设计及咨询', () => {
  assert.deepEqual(KS.allocate(101n, [1, 1, 1]), [34n, 34n, 33n]);
  // 10×[1,2,4]/7：1+3/7、2+6/7、5+5/7 → 余 2 给 PMC(6/7)、设计及咨询(5/7)
  assert.deepEqual(KS.allocate(10n, [1, 2, 4]), [1n, 3n, 6n]);
  assert.deepEqual(KS.allocate(0n, [3, 2, 1]), [0n, 0n, 0n]);
  assert.deepEqual(KS.allocate(600n, [1, 2, 3]), [100n, 200n, 300n]);
});

test('权重必须是 3 个正整数', () => {
  assert.throws(() => KS.allocate(100n, [0, 1, 1]), RangeError);
  assert.throws(() => KS.allocate(100n, [1.5, 1, 1]), RangeError);
  assert.throws(() => KS.allocate(100n, [1, 1]), RangeError);
  assert.throws(() => KS.allocate(100, [1, 1, 1]), RangeError);
  assert.throws(() => KS.allocate(-1n, [1, 1, 1]), RangeError);
});

test('仅测试正权重 × 不能整除金额：合计严格相等，余数规则成立', () => {
  let seed = 20261109;
  const rnd = n => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed % n; };
  for (let k = 0; k < 5000; k += 1) {
    const T = BigInt(rnd(5000000));
    const w = [rnd(97) + 1, rnd(97) + 1, rnd(97) + 1];
    const out = KS.allocate(T, w);
    const W = BigInt(w[0] + w[1] + w[2]);
    const fl = w.map(x => (T * BigInt(x)) / W);
    const rem = w.map(x => (T * BigInt(x)) % W);
    assert.equal(out.reduce((a, b) => a + b, 0n), T);
    const plus = out.map((v, i) => v - fl[i]);
    plus.forEach(p => assert.ok(p === 0n || p === 1n));
    for (let i = 0; i < 3; i += 1) {
      for (let j = 0; j < 3; j += 1) {
        if (plus[i] === 1n && plus[j] === 0n) {
          assert.ok(rem[i] > rem[j] || (rem[i] === rem[j] && i < j), JSON.stringify({ T: String(T), w }));
        }
      }
    }
  }
});

test('完成额与目标额分开拆，余数不互相挪；类别顺序固定', () => {
  const rows = KS.splitKpi('1.00', '2.00', { done: [1, 1, 1], target: [1, 1, 1] });
  assert.deepEqual(rows.map(r => r.category), ['EPC', 'PMC', '设计及咨询']);
  assert.deepEqual(rows.map(r => r.done), [34n, 33n, 33n]);
  assert.deepEqual(rows.map(r => r.target), [67n, 67n, 66n]);
  const big = KS.splitKpi('9,234.31', '9,950.00', { done: [7, 5, 3], target: [11, 13, 17] });
  assert.equal(big.reduce((a, r) => a + r.done, 0n), 923431n);
  assert.equal(big.reduce((a, r) => a + r.target, 0n), 995000n);
});

test('百分比文字四舍五入 2 位；目标为 0 不除', () => {
  assert.equal(KS.percentText(1323n, 10000n), '13.23%');
  assert.equal(KS.percentText(11568n, 10000n), '115.68%');
  assert.equal(KS.percentText(1n, 3n), '33.33%');
  assert.equal(KS.percentText(2n, 3n), '66.67%');
  assert.equal(KS.percentText(1n, 20000n), '0.01%');
  assert.equal(KS.percentText(0n, 5000n), '0.00%');
  assert.equal(KS.percentText(5n, 0n), '—');
  assert.equal(KS.percentText(null, 100n), '—');
  assert.equal(KS.percentText(2000000n, 10n), '20,000,000.00%');
});

test('轨道填充用未舍入比例、上限 100%，不吸附到 1/12', () => {
  const f = KS.fillPercent(1323n, 10000n);
  assert.ok(Math.abs(f - 13.23) < 1e-9);
  assert.ok(f > 100 / 12 && f < 200 / 12);
  assert.equal(KS.fillPercent(11568n, 10000n), 100);
  assert.equal(KS.fillPercent(0n, 5000n), 0);
  assert.equal(KS.fillPercent(1n, 0n), 0);
  assert.equal(KS.fillPercent(null, 10n), 0);
  assert.ok(Math.abs(KS.fillPercent(1n, 7n) - 100 / 7) < 1e-9);
});

test('行视图：有效 0、无目标、缺失彼此区分', () => {
  assert.deepEqual(KS.rowView('EPC', { done: 0n, target: 5000n }),
    { category: 'EPC', missing: false, noTarget: false, doneText: '0.00', targetText: '50.00', pctText: '0.00%', fill: 0 });
  assert.deepEqual(KS.rowView('PMC', { done: 0n, target: 0n }),
    { category: 'PMC', missing: false, noTarget: true, doneText: '0.00', targetText: '0.00', pctText: '—', fill: 0 });
  assert.deepEqual(KS.rowView('设计及咨询', null),
    { category: '设计及咨询', missing: true, noTarget: false, doneText: '—', targetText: '—', pctText: '—', fill: 0 });
  assert.deepEqual(KS.rowView('EPC', { done: null, target: 0n }),
    { category: 'EPC', missing: true, noTarget: true, doneText: '—', targetText: '—', pctText: '—', fill: 0 });
  const over = KS.rowView('PMC', { done: 11568n, target: 10000n });
  assert.equal(over.pctText, '115.68%');
  assert.equal(over.fill, 100);
});

test('HTML：12 刻度轨道、三行顺序、无新增文案、无目标标记', () => {
  const t = KS.trackHtml(13.23, '仅测试');
  assert.equal((t.match(/<b><\/b>/g) || []).length, 12);
  assert.match(t, /class="seg12-fill" style="width:13\.23%"/);
  const rows = KS.splitKpi('1.00', '0.00', { done: [1, 1, 1], target: [1, 1, 1] }).map(r => KS.rowView(r.category, r));
  const html = KS.subRowsHtml('新签合同额', rows);
  const cats = [...html.matchAll(/data-category="([^"]+)"/g)].map(m => m[1]);
  assert.deepEqual(cats, ['EPC', 'PMC', '设计及咨询']);
  assert.equal((html.match(/无目标/g) || []).length, 3);
  assert.doesNotMatch(html, /当月新增|上月新增|占目标/);
  assert.equal((html.match(/<b><\/b>/g) || []).length, 36);
});
