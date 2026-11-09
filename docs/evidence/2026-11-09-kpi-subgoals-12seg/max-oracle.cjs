/**
 * Max 独立预期。不 require kpi-subgoals.js。
 * 余数用 BigInt 精确分数；百分比四舍五入到 0.01 个百分点（正数 half-up）。
 * 13.23 / 115.68 / 测试权重都只用于核对，不是演示主数据。
 */
'use strict';

const CATEGORIES = Object.freeze(['EPC', 'PMC', '设计及咨询']);
const DASH = '—';

function parseUnits(text) {
  const m = /^([\d,]+)\.(\d{2})$/.exec(String(text == null ? '' : text).trim());
  if (!m) return null;
  return BigInt(m[1].replace(/,/g, '') + m[2]);
}

function formatUnits(units) {
  if (typeof units !== 'bigint' || units < 0n) throw new RangeError('units');
  const frac = (units % 100n).toString().padStart(2, '0');
  const whole = (units / 100n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return whole + '.' + frac;
}

function formatHundredths(h) {
  if (typeof h !== 'bigint' || h < 0n) throw new RangeError('hundredths');
  const frac = (h % 100n).toString().padStart(2, '0');
  const whole = (h / 100n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return whole + '.' + frac;
}

/** 最大余数法。余数只可能是 0、1、2；平手按类别下标。 */
function allocate(totalUnits, weights) {
  if (typeof totalUnits !== 'bigint' || totalUnits < 0n) throw new RangeError('total');
  if (!Array.isArray(weights) || weights.length !== 3 || weights.some(w => !Number.isSafeInteger(w) || w <= 0)) {
    throw new RangeError('weights');
  }
  const ws = weights.map(BigInt);
  const sumW = ws.reduce((a, b) => a + b, 0n);
  const parts = ws.map((w, i) => {
    const prod = totalUnits * w;
    return { i, q: prod / sumW, r: prod % sumW };
  });
  const out = parts.map(p => p.q);
  let left = totalUnits - out.reduce((a, b) => a + b, 0n);
  if (left < 0n || left > 2n) throw new Error('余数超出 0..2：' + left.toString());
  const order = parts.slice().sort((a, b) => (a.r === b.r ? a.i - b.i : (a.r > b.r ? -1 : 1)));
  for (let k = 0; left > 0n; k += 1, left -= 1n) out[order[k].i] += 1n;
  return out;
}

function percentHundredths(done, target) {
  if (typeof done !== 'bigint' || typeof target !== 'bigint' || target === 0n) return null;
  return (done * 20000n + target) / (2n * target);
}

function percentText(done, target) {
  if (done == null || target == null || target === 0n) return DASH;
  return formatHundredths(percentHundredths(done, target)) + '%';
}

/** 未舍入比例，上限 1。返回精确分子分母，供像素比较。 */
function fillRatio(done, target) {
  if (done == null || target == null || target === 0n) return { num: 0n, den: 1n, capped: true };
  if (done >= target) return { num: 1n, den: 1n, capped: true };
  return { num: done, den: target, capped: false };
}

function expectedFillPx(done, target, trackW) {
  const ratio = fillRatio(done, target);
  if (ratio.capped && ratio.num === 0n) return 0;
  if (ratio.capped && ratio.num === 1n) return trackW;
  return Number(ratio.num) / Number(ratio.den) * trackW;
}

const DEMO_WEIGHTS = Object.freeze({
  contract: { done: [5, 3, 2], target: [9, 6, 5] },
  completed: { done: [6, 2, 2], target: [11, 5, 4] },
  invoice: { done: [4, 3, 3], target: [8, 7, 5] },
  receipt: { done: [5, 2, 3], target: [10, 4, 6] },
});

const UNITS = Object.freeze([
  '全部板块',
  'SAS170 PMC板块',
  'SAS610 咨询板块',
  'SAS680 数字技术板块',
  'SAS650 新材料板块',
  'SAS710 生命科学板块',
  'SAS690 COII板块',
  'SAS720 模块化板块',
  'SAS670 供应链板块',
  'SAS520 金山中心',
  'SAS560 沈阳中心',
  'SAS550 惠湛中心',
  'SAS530 银川中心',
]);

const KPI_META = Object.freeze({
  contract: ['新签合同额', '当月新增'],
  completed: ['完成合同额', '上月新增'],
  invoice: ['完成开票额', '当月新增'],
  receipt: ['完成回款额', '当月新增'],
});

module.exports = {
  CATEGORIES,
  DASH,
  UNITS,
  KPI_META,
  DEMO_WEIGHTS,
  parseUnits,
  formatUnits,
  formatHundredths,
  allocate,
  percentHundredths,
  percentText,
  fillRatio,
  expectedFillPx,
};
