/* 运营看板202610 · 顶部四 KPI 子目标与 12 段轨道（演示）
 * 金额一律用 0.01 万元整数（BigInt）运算，保证三行展示值之和等于主卡展示值。
 * 浏览器挂 window.KpiSubgoals；Node 可 require（scripts/test-ops-kpi-subgoals.cjs）。
 * 口径：docs/需求文档/202611_运营看板四KPI子目标与12段进度条.md */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.KpiSubgoals = api;
})(typeof self !== 'undefined' ? self : globalThis, function () {
  'use strict';
  const CATEGORIES = Object.freeze(['EPC', 'PMC', '设计及咨询']);
  const SEGMENTS = 12;
  const DASH = '—';

  const groupThousands = digits => digits.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  const twoDecimals = n => groupThousands((n / 100n).toString()) + '.' + (n % 100n).toString().padStart(2, '0');

  function unitsFromDisplay(text) {
    const m = /^([\d,]+)\.(\d{2})$/.exec(String(text).trim());
    if (!m) throw new RangeError('不是非负 2 位小数金额：' + text);
    return BigInt(m[1].replace(/,/g, '') + m[2]);
  }

  function formatUnits(units) {
    return twoDecimals(units);
  }

  function allocate(totalUnits, weights) {
    if (typeof totalUnits !== 'bigint' || totalUnits < 0n) throw new RangeError('totalUnits 须为非负 BigInt');
    if (!Array.isArray(weights) || weights.length !== CATEGORIES.length
      || !weights.every(w => Number.isSafeInteger(w) && w > 0)) {
      throw new RangeError('权重须为 3 个正整数');
    }
    const ws = weights.map(BigInt);
    const sumW = ws.reduce((a, b) => a + b, 0n);
    const parts = ws.map((w, i) => ({ i, q: (totalUnits * w) / sumW, r: (totalUnits * w) % sumW }));
    const out = parts.map(p => p.q);
    let left = totalUnits - out.reduce((a, b) => a + b, 0n);
    // 同分母 sumW，比较余数 r 即比较精确小数部分；平手按类别顺序
    const order = parts.slice().sort((a, b) => (a.r === b.r ? a.i - b.i : (a.r > b.r ? -1 : 1)));
    for (let k = 0; left > 0n; k += 1, left -= 1n) out[order[k].i] += 1n;
    return out;
  }

  function splitKpi(mainDoneText, mainTargetText, weights) {
    const done = allocate(unitsFromDisplay(mainDoneText), weights.done);
    const target = allocate(unitsFromDisplay(mainTargetText), weights.target);
    return CATEGORIES.map((category, i) => ({ category, done: done[i], target: target[i] }));
  }

  function percentText(done, target) {
    if (done == null || target == null || target === 0n) return DASH;
    const hundredths = (done * 20000n + target) / (2n * target);
    return twoDecimals(hundredths) + '%';
  }

  function fillPercent(done, target) {
    if (done == null || target == null || target === 0n) return 0;
    return Math.min(1, Number(done) / Number(target)) * 100;
  }

  function rowView(category, record) {
    const done = record && record.done != null ? record.done : null;
    const target = record && record.target != null ? record.target : null;
    const missing = done === null || target === null;
    return {
      category,
      missing,
      noTarget: target === 0n,
      doneText: missing ? DASH : formatUnits(done),
      targetText: missing ? DASH : formatUnits(target),
      pctText: missing ? DASH : percentText(done, target),
      fill: missing ? 0 : fillPercent(done, target),
    };
  }

  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  function trackHtml(fill, label) {
    return '<div class="progress-track seg12" role="progressbar" aria-label="' + esc(label)
      + '" aria-valuemin="0" aria-valuemax="100" aria-valuenow="' + fill + '">'
      + '<i class="seg12-fill" style="width:' + fill + '%"></i>'
      + '<span class="seg12-ticks" aria-hidden="true">' + '<b></b>'.repeat(SEGMENTS) + '</span></div>';
  }

  function subRowsHtml(kpiName, rows) {
    return '<div class="kpi-subgoals" data-kpi-subgoals>' + rows.map(r =>
      '<div class="kpi-sub-row" data-category="' + esc(r.category) + '"'
      + (r.missing ? ' data-missing="true"' : '') + (r.noTarget ? ' data-no-target="true"' : '') + '>'
      + '<div class="kpi-sub-line"><span class="kpi-sub-name">' + esc(r.category) + '</span>'
      + '<span class="kpi-sub-amount"><b class="kpi-sub-done">' + esc(r.doneText) + '</b> / <span class="kpi-sub-target">'
      + esc(r.targetText) + '</span></span></div>'
      + '<div class="kpi-sub-bar">' + trackHtml(r.fill, kpiName + ' ' + r.category + ' 进度')
      + '<span class="kpi-sub-pct">' + esc(r.pctText) + '</span>'
      + (r.noTarget ? '<span class="kpi-sub-flag">无目标</span>' : '')
      + '</div></div>').join('') + '</div>';
  }

  return { CATEGORIES, SEGMENTS, unitsFromDisplay, formatUnits, allocate, splitKpi, percentText, fillPercent, rowView, trackHtml, subRowsHtml };
});
