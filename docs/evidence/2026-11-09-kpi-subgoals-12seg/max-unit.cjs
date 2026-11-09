/**
 * Max 独立单测。预期来自 max-oracle.cjs，被测对象才是 kpi-subgoals.js。
 * 运行：node --test docs/evidence/2026-11-09-kpi-subgoals-12seg/max-unit.cjs
 */
'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');
const O = require('./max-oracle.cjs');
const KS = require(path.resolve('public/operations-dashboard-202610/kpi-subgoals.js'));

test('验算例 1.00 与权重 1:1:1：余数给 EPC，展示 0.34/0.33/0.33', () => {
  const mine = O.allocate(100n, [1, 1, 1]);
  assert.deepEqual(mine, [34n, 33n, 33n]);
  assert.deepEqual(mine.map(O.formatUnits), ['0.34', '0.33', '0.33']);
  assert.equal(mine.reduce((a, b) => a + b, 0n), 100n);
  assert.deepEqual(KS.allocate(100n, [1, 1, 1]), mine);
});

test('平手按 EPC、PMC、设计及咨询；完成额与目标额的余数分开', () => {
  assert.deepEqual(O.allocate(101n, [1, 1, 1]), [34n, 34n, 33n]);
  assert.deepEqual(O.allocate(10n, [1, 2, 4]), [1n, 3n, 6n]);
  const done = O.allocate(100n, [1, 1, 1]);
  const target = O.allocate(200n, [1, 1, 1]);
  assert.deepEqual(done, [34n, 33n, 33n]);
  assert.deepEqual(target, [67n, 67n, 66n]);
  assert.deepEqual(KS.allocate(101n, [1, 1, 1]), O.allocate(101n, [1, 1, 1]));
  assert.deepEqual(KS.allocate(10n, [1, 2, 4]), O.allocate(10n, [1, 2, 4]));
  assert.deepEqual(KS.splitKpi('1.00', '2.00', { done: [1, 1, 1], target: [1, 1, 1] }).map(r => r.done), done);
  assert.deepEqual(KS.splitKpi('1.00', '2.00', { done: [1, 1, 1], target: [1, 1, 1] }).map(r => r.target), target);
});

test('演示权重下不能整除的主金额：三行展示合计仍等于主卡，且与独立余数法逐行一致', () => {
  const samples = ['1.00', '0.01', '13.23', '115.68', '9,234.31', '0.00'];
  for (const text of samples) {
    const total = O.parseUnits(text);
    for (const key of Object.keys(O.DEMO_WEIGHTS)) {
      for (const side of ['done', 'target']) {
        const w = O.DEMO_WEIGHTS[key][side];
        const mine = O.allocate(total, w);
        assert.equal(mine.reduce((a, b) => a + b, 0n), total, text + ' ' + key + ' ' + side);
        assert.deepEqual(KS.allocate(total, w), mine);
        const shown = mine.map(O.formatUnits);
        const back = shown.reduce((a, t) => a + O.parseUnits(t), 0n);
        assert.equal(back, total);
      }
    }
  }
});

test('5000 组仅测试正权重：实现分配等于独立精确余数，每类最多加 1', () => {
  let seed = 20261109;
  const rnd = n => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed % n; };
  for (let k = 0; k < 5000; k += 1) {
    const T = BigInt(rnd(5000000));
    const w = [rnd(97) + 1, rnd(97) + 1, rnd(97) + 1];
    const mine = O.allocate(T, w);
    assert.deepEqual(KS.allocate(T, w), mine);
  }
});

test('百分比文字与条宽比例独立于实现函数', () => {
  assert.equal(O.percentText(1323n, 10000n), '13.23%');
  assert.equal(O.percentText(11568n, 10000n), '115.68%');
  assert.equal(O.percentText(1n, 3n), '33.33%');
  assert.equal(O.percentText(2n, 3n), '66.67%');
  assert.equal(O.percentText(0n, 5000n), '0.00%');
  assert.equal(O.percentText(5n, 0n), '—');
  assert.equal(O.percentText(null, 100n), '—');
  assert.equal(KS.percentText(1323n, 10000n), O.percentText(1323n, 10000n));
  assert.equal(KS.percentText(11568n, 10000n), O.percentText(11568n, 10000n));
  assert.equal(KS.percentText(1n, 3n), '33.33%');
  assert.equal(KS.percentText(2n, 3n), '66.67%');
  const ratio = O.fillRatio(1323n, 10000n);
  assert.equal(ratio.capped, false);
  assert.ok(ratio.num * 12n > ratio.den && ratio.num * 12n < ratio.den * 2n);
  assert.equal(O.fillRatio(11568n, 10000n).capped, true);
  assert.equal(O.fillRatio(0n, 5000n).num, 0n);
  assert.equal(O.fillRatio(1n, 0n).num, 0n);
  assert.equal(KS.fillPercent(1323n, 10000n), 13.23);
  assert.equal(KS.fillPercent(11568n, 10000n), 100);
});

test('缺失不能当成 0 进入合计；目标 0 与有效完成额 0 文案不同', () => {
  const zero = KS.rowView('EPC', { done: 0n, target: 5000n });
  assert.equal(zero.doneText, '0.00');
  assert.equal(zero.pctText, '0.00%');
  assert.equal(zero.missing, false);
  assert.equal(zero.noTarget, false);
  const none = KS.rowView('PMC', { done: 0n, target: 0n });
  assert.equal(none.targetText, '0.00');
  assert.equal(none.pctText, '—');
  assert.equal(none.noTarget, true);
  const miss = KS.rowView('设计及咨询', null);
  assert.equal(miss.doneText, '—');
  assert.equal(miss.targetText, '—');
  assert.equal(miss.pctText, '—');
  assert.equal(miss.missing, true);
  assert.equal(miss.noTarget, false);
  assert.equal(O.parseUnits(miss.doneText), null);
  const missZero = KS.rowView('EPC', { done: null, target: 0n });
  assert.equal(missZero.missing, true);
  assert.equal(missZero.noTarget, true);
  assert.equal(missZero.doneText, '—');
  const over = KS.rowView('PMC', { done: 11568n, target: 10000n });
  assert.equal(over.pctText, O.percentText(11568n, 10000n));
  assert.equal(over.fill, 100);
});
