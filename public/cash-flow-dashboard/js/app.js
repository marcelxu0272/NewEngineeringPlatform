/* =============================================
   现金流仪表盘 — 业务逻辑
   Tech: Vue 2 + Element UI + ECharts
   =============================================
   数据层说明：
   - Phase 1：使用 MOCK_DATA，结构与真实 API 返回保持一致
   - Phase 2：将 fetchData() 中的 mock 替换为 fetch('/api/cash-flow?...')
   - SSO：页面加载时从 URL query-param 读取 authToken 写入 localStorage
   ============================================= */

// ──────────────────────────────────────────────
// SSO token 注入（企业微信单点登录回调）
// ──────────────────────────────────────────────
;(function () {
  var params = new URLSearchParams(window.location.search);
  var token = params.get('authToken');
  if (token) {
    localStorage.setItem('cf_auth_token', token);
    // 去掉 URL 中的 token 参数，避免分享时泄漏
    var url = window.location.href.replace(/[?&]authToken=[^&]+/, '').replace(/[?&]$/, '');
    window.history.replaceState({}, '', url);
  }
})();

// ──────────────────────────────────────────────
// 常量与配置
// ──────────────────────────────────────────────
var THEME_COLOR = '#007069';
var DANGER_COLOR = '#f56c6c';
var SUCCESS_COLOR = '#67c23a';
var WARNING_COLOR = '#e6a23c';

var PROJECT_GROUPS = [
  { code: 'SAS810', name: 'SAS810 东部项目群', boards: ['金山中心', '沈阳中心', '惠湛中心'] },
  { code: 'SAS820', name: 'SAS820 西部项目群', boards: ['银川中心', '公司级EPC'] },
  { code: 'SAS830', name: 'SAS830 海外项目群', boards: ['COII板块', '模块化板块', '供应链板块'] },
  { code: 'SAS840', name: 'SAS840 NM&LS 项目群', boards: ['新材料板块', '生命科学板块'] },
  { code: 'SAS850', name: 'SAS850 新业务项目群', boards: ['PMC板块', '咨询板块', '数字技术板块'] },
];

// 所有板块扁平列表
var ALL_BOARDS = PROJECT_GROUPS.reduce(function (acc, g) {
  g.boards.forEach(function (b) { acc.push({ code: b, name: b, groupCode: g.code }); });
  return acc;
}, []);

// ──────────────────────────────────────────────
// 模拟数据（Phase 1）
// ──────────────────────────────────────────────
var MONTHS_12 = (function () {
  var now = new Date();
  var months = [];
  for (var i = 11; i >= 0; i--) {
    var d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push((d.getMonth() + 1) + '月');
  }
  return months;
})();

function randomBetween(min, max) {
  return +(min + Math.random() * (max - min)).toFixed(2);
}

function generateTrend(base, volatility, count) {
  var arr = [];
  var val = base;
  for (var i = 0; i < count; i++) {
    val = val + randomBetween(-volatility, volatility);
    if (val < base * 0.4) val = base * 0.4;
    arr.push(+val.toFixed(2));
  }
  return arr;
}

/** 公司管理费项目明细（Phase 1 mock，字段与财务下钻一致） */
function generateManagementFeeDetail(seed, rowCount) {
  var templates = [
    { projectNo: 'C26003', projectName: '杭州赛瑞克5000吨/年 FDCA 中试装置项目', partyA: '赛瑞克（杭州）生物科技有限公司', pm: '吕全海', owner: '陈贺明', mgmtAttr: '新材料板块', bizType: '新建设计', date: '2026-03-03', amountYuan: 11000000 },
    { projectNo: 'C26002', projectName: '贝欧亿海南1万吨/年高端弹性体项目', partyA: '贝欧亿（海南）新材料有限公司', pm: '陈贺明', owner: '陈贺明', mgmtAttr: '新材料板块', bizType: '新建设计', date: '2026-03-23', amountYuan: 10700000 },
    { projectNo: 'C26001', projectName: '华东石化催化裂化装置升级改造', partyA: '华东石化工程有限公司', pm: '王伟', owner: '王伟', mgmtAttr: '工艺板块', bizType: '改造工程', date: '2026-02-15', amountYuan: 8650000.5 },
    { projectNo: 'C25098', projectName: '宁夏液化天然气储运基地工程设计', partyA: '宁夏能源投资集团', pm: '赵敏', owner: '刘强', mgmtAttr: '银川中心', bizType: 'EPC 咨询', date: '2026-01-08', amountYuan: 5230000 },
    { projectNo: 'C25095', projectName: '模块化海水淡化成套装置供货', partyA: '海洋工程（青岛）有限公司', pm: '孙磊', owner: '孙磊', mgmtAttr: '模块化板块', bizType: '设备供货', date: '2025-12-20', amountYuan: 32150000 },
  ];
  var rows = [];
  var hash = String(seed).split('').reduce(function (a, c) { return a + c.charCodeAt(0); }, 0);
  for (var i = 0; i < rowCount; i++) {
    var t = templates[i % templates.length];
    var jitter = (hash + i * 17) % 500000;
    var numSuffix = 50 + ((hash + i * 13) % 950);
    var projectNo = i < templates.length ? t.projectNo : 'C26' + ('000' + numSuffix).slice(-3);
    rows.push({
      projectNo: projectNo,
      projectName: i < templates.length ? t.projectName : t.projectName + '（同期项 ' + (i + 1) + '）',
      partyA: t.partyA,
      pm: t.pm,
      owner: t.owner,
      mgmtAttr: t.mgmtAttr,
      bizType: t.bizType,
      date: t.date,
      amountYuan: +(t.amountYuan + jitter - 250000).toFixed(2),
    });
  }
  return rows;
}

function sumMgmtFeeWan(rows) {
  var yuan = rows.reduce(function (s, r) { return s + (r.amountYuan || 0); }, 0);
  return +(yuan / 10000).toFixed(2);
}

// 生成公司级 mock 数据
function generateCompanyData() {
  var cashIn12m  = generateTrend(12000, 2000, 12);
  var cashOut12m = generateTrend(9000,  1800, 12);
  var ar12m      = generateTrend(35000, 3000, 12);
  var wip12m     = generateTrend(80000, 5000, 12);
  var curCashIn  = cashIn12m[11];
  var curCashOut = cashOut12m[11];
  var netCash    = +(curCashIn - curCashOut).toFixed(2);

  var boardNames = ALL_BOARDS.map(function (b) { return b.name; });
  var boardNetCash = boardNames.map(function () { return randomBetween(-3000, 8000); });
  var boardCollRate = boardNames.map(function () { return randomBetween(55, 98); });

  var fulfillment = boardNames.map(function (name, i) {
    var profit = randomBetween(-500, 3000);
    var netCashVal = boardNetCash[i];
    var status = profit > 0 && netCashVal > 0  ? 'eligible'
               : profit > 0 && netCashVal <= 0 ? 'deferred'
               : profit < 0 && netCashVal > 0  ? 'deduct'
               : 'deduct_deferred';
    return { name: name, profit: profit, netCash: netCashVal, status: status };
  });

  // 预警逻辑
  var alerts = [];
  boardNames.forEach(function (name, i) {
    if (boardNetCash[i] < 0) {
      alerts.push({
        type: 'error',
        title: name + ' — 净现金流为负',
        desc: '净现金流 ' + formatAmountNum(boardNetCash[i]) + ' 万元，请关注资金状况',
      });
    }
    if (boardCollRate[i] < 70) {
      alerts.push({
        type: boardCollRate[i] < 50 ? 'error' : 'warning',
        title: name + ' — 回款率偏低',
        desc: '回款率 ' + boardCollRate[i].toFixed(2) + '%，低于' + (boardCollRate[i] < 50 ? '告警' : '预警') + '阈值',
      });
    }
  });

  var mgmtRows = generateManagementFeeDetail('company', 28);
  var mgmtWan = sumMgmtFeeWan(mgmtRows);
  var mgmtChangeWan = +randomBetween(-80, 120).toFixed(2);
  var arProjects = generateArProjects('company', 24);
  var arAgging   = aggregateArAging(arProjects);
  var revDetail  = generateRevenueDetail();

  return {
    managementFeeDetail: mgmtRows,
    arDetail:            Object.assign({ projects: arProjects }, arAgging),
    wipDetail:           generateWipDetail(),
    cashFlowDetail:      generateCashFlowDetail(),
    revenueDetail:       revDetail,
    kpi: {
      wip:     wip12m[11],
      ar:      ar12m[11],
      cashIn:  curCashIn,
      cashOut: curCashOut,
      netCash: netCash,
      inventoryWan:       Math.round(wip12m[11] * randomBetween(0.36, 0.44)),
      inventoryChangeWan: +randomBetween(-200, 300).toFixed(2),
      revenueWan:         revDetail.forecast.revenue,
      revenueChangeWan:   +randomBetween(-300, 500).toFixed(2),
      wipChange:     +(wip12m[11] - wip12m[10]).toFixed(2),
      arChange:      +(ar12m[11]  - ar12m[10]).toFixed(2),
      cashInChange:  +(cashIn12m[11]  - cashIn12m[10]).toFixed(2),
      cashOutChange: +(cashOut12m[11] - cashOut12m[10]).toFixed(2),
      netCashChange: +(netCash - (cashIn12m[10] - cashOut12m[10])).toFixed(2),
      managementFeeWan: mgmtWan,
      managementFeeChangeWan: mgmtChangeWan,
    },
    trend: {
      months: MONTHS_12,
      cashIn12m:  cashIn12m,
      cashOut12m: cashOut12m,
      ar12m:      ar12m,
      wip12m:     wip12m,
    },
    boardHealth: {
      names:       boardNames,
      netCash:     boardNetCash,
      collRate:    boardCollRate,
    },
    fulfillment: fulfillment,
    alerts: alerts,
  };
}

// 生成项目群 mock 数据
function generateGroupData(groupCode) {
  var group = PROJECT_GROUPS.find(function (g) { return g.code === groupCode; }) || PROJECT_GROUPS[0];
  var boards = group.boards;
  var cashIn12m  = generateTrend(3000, 600, 12);
  var cashOut12m = generateTrend(2200, 500, 12);
  var ar12m      = generateTrend(9000, 800, 12);
  var wip12m     = generateTrend(20000, 1500, 12);
  var curCashIn  = cashIn12m[11];
  var curCashOut = cashOut12m[11];
  var netCash    = +(curCashIn - curCashOut).toFixed(2);

  var boardNetCash  = boards.map(function () { return randomBetween(-1000, 3000); });
  var boardCollRate = boards.map(function () { return randomBetween(60, 98); });

  var alerts = [];
  boards.forEach(function (name, i) {
    if (boardNetCash[i] < 0) {
      alerts.push({ type: 'error', title: name + ' — 净现金流为负', desc: '净现金流 ' + formatAmountNum(boardNetCash[i]) + ' 万元' });
    }
    if (boardCollRate[i] < 70) {
      alerts.push({ type: 'warning', title: name + ' — 回款率偏低', desc: '回款率 ' + boardCollRate[i].toFixed(2) + '%' });
    }
  });

  var mgmtRowsG = generateManagementFeeDetail(groupCode, 18);
  var mgmtWanG = sumMgmtFeeWan(mgmtRowsG);
  var mgmtChangeG = +randomBetween(-40, 60).toFixed(2);
  var arProjectsG = generateArProjects(groupCode, 16);
  var arAggingG   = aggregateArAging(arProjectsG);
  var revDetailG  = generateRevenueDetail();

  return {
    managementFeeDetail: mgmtRowsG,
    arDetail:            Object.assign({ projects: arProjectsG }, arAggingG),
    wipDetail:           generateWipDetail(),
    cashFlowDetail:      generateCashFlowDetail(),
    revenueDetail:       revDetailG,
    kpi: {
      wip:     wip12m[11],
      ar:      ar12m[11],
      cashIn:  curCashIn,
      cashOut: curCashOut,
      netCash: netCash,
      inventoryWan:       Math.round(wip12m[11] * randomBetween(0.36, 0.44)),
      inventoryChangeWan: +randomBetween(-100, 180).toFixed(2),
      revenueWan:         revDetailG.forecast.revenue,
      revenueChangeWan:   +randomBetween(-200, 350).toFixed(2),
      wipChange:     +(wip12m[11] - wip12m[10]).toFixed(2),
      arChange:      +(ar12m[11]  - ar12m[10]).toFixed(2),
      cashInChange:  +(cashIn12m[11]  - cashIn12m[10]).toFixed(2),
      cashOutChange: +(cashOut12m[11] - cashOut12m[10]).toFixed(2),
      netCashChange: +(netCash - (cashIn12m[10] - cashOut12m[10])).toFixed(2),
      managementFeeWan: mgmtWanG,
      managementFeeChangeWan: mgmtChangeG,
    },
    trend: {
      months: MONTHS_12,
      cashIn12m:  cashIn12m,
      cashOut12m: cashOut12m,
      ar12m:      ar12m,
      wip12m:     wip12m,
    },
    boardHealth: {
      names:    boards,
      netCash:  boardNetCash,
      collRate: boardCollRate,
    },
    fulfillment: [],
    alerts: alerts,
  };
}

// 生成板块 mock 数据
function generateBoardData(boardCode) {
  var cashIn12m  = generateTrend(800, 200, 12);
  var cashOut12m = generateTrend(600, 150, 12);
  var ar12m      = generateTrend(2500, 300, 12);
  var wip12m     = generateTrend(6000, 400, 12);
  var curCashIn  = cashIn12m[11];
  var curCashOut = cashOut12m[11];
  var netCash    = +(curCashIn - curCashOut).toFixed(2);
  var collRate   = +(curCashIn / (curCashIn + randomBetween(100, 500)) * 100).toFixed(2);

  var alerts = [];
  if (netCash < 0) {
    alerts.push({ type: 'error', title: boardCode + ' — 净现金流为负', desc: '净现金流 ' + formatAmountNum(netCash) + ' 万元，需重点关注' });
  }
  if (collRate < 70) {
    alerts.push({ type: 'warning', title: '回款率偏低', desc: '当前回款率 ' + collRate + '%' });
  }

  var mgmtRowsB = generateManagementFeeDetail(boardCode, 12);
  var mgmtWanB = sumMgmtFeeWan(mgmtRowsB);
  var mgmtChangeB = +randomBetween(-25, 35).toFixed(2);
  var arProjectsB = generateArProjects(boardCode, 10);
  var arAggingB   = aggregateArAging(arProjectsB);
  var revDetailB  = generateRevenueDetail();

  return {
    managementFeeDetail: mgmtRowsB,
    arDetail:            Object.assign({ projects: arProjectsB }, arAggingB),
    wipDetail:           generateWipDetail(),
    cashFlowDetail:      generateCashFlowDetail(),
    revenueDetail:       revDetailB,
    kpi: {
      wip:     wip12m[11],
      ar:      ar12m[11],
      cashIn:  curCashIn,
      cashOut: curCashOut,
      netCash: netCash,
      collRate: collRate,
      inventoryWan:       Math.round(wip12m[11] * randomBetween(0.36, 0.44)),
      inventoryChangeWan: +randomBetween(-60, 100).toFixed(2),
      revenueWan:         revDetailB.forecast.revenue,
      revenueChangeWan:   +randomBetween(-100, 200).toFixed(2),
      wipChange:     +(wip12m[11] - wip12m[10]).toFixed(2),
      arChange:      +(ar12m[11]  - ar12m[10]).toFixed(2),
      cashInChange:  +(cashIn12m[11]  - cashIn12m[10]).toFixed(2),
      cashOutChange: +(cashOut12m[11] - cashOut12m[10]).toFixed(2),
      netCashChange: +(netCash - (cashIn12m[10] - cashOut12m[10])).toFixed(2),
      managementFeeWan: mgmtWanB,
      managementFeeChangeWan: mgmtChangeB,
    },
    trend: {
      months: MONTHS_12,
      cashIn12m:  cashIn12m,
      cashOut12m: cashOut12m,
      ar12m:      ar12m,
      wip12m:     wip12m,
    },
    boardHealth: {
      names:    [boardCode],
      netCash:  [netCash],
      collRate: [collRate],
    },
    fulfillment: [],
    alerts: alerts,
  };
}

// ──────────────────────────────────────────────
// 下探弹窗 mock 数据生成器
// ──────────────────────────────────────────────

/** AR 应收账款项目明细 */
function generateArProjects(seed, rowCount) {
  var pmList = ['张明', '李华', '王芳', '赵磊', '陈伟', '孙洁'];
  var bizTypes = ['EPC业务', 'PMC业务', '设计咨询类业务'];
  var clientList = ['上海金山置业有限公司', '华东石化工程有限公司', '宁夏能源投资集团', '贝欧亿（海南）新材料有限公司', '赛瑞克（杭州）生物科技有限公司'];
  var projNames  = ['金山中心A栋装修工程', '金山中心B区改造', '沈阳中心设备安装项目', '惠湛PMC咨询服务', '银川中心EPC总包项目'];
  var nodeTypes  = ['预付款', '进度款 1', '进度款 2', '竣工款', '保留金'];
  var nodeDescs  = ['合同签订后7日内支付', '主体结构完成后支付', '全体结构完成后支付', '竣工验收完成后支付', '保修期满后支付'];

  var hash = String(seed).split('').reduce(function (a, c) { return a + c.charCodeAt(0); }, 0);
  var today = new Date(2026, 4, 6);
  var rows  = [];
  for (var i = 0; i < rowCount; i++) {
    var dayOff  = (hash + i * 37) % 400;
    var amount  = Math.round(randomBetween(300, 1500));
    var invDate = new Date(today.getTime() - dayOff * 86400000);
    var planDate = new Date(invDate.getTime() + (30 + (i % 60)) * 86400000);
    var fcDate   = new Date(planDate.getTime() + ((hash + i) % 45) * 86400000);
    var fmt = function (d) {
      return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
    };
    rows.push({
      projectNo:   'B260' + String(10 + ((hash + i) % 90)).slice(-2),
      projectName: projNames[i % projNames.length] + (i >= projNames.length ? '（' + (Math.floor(i / projNames.length) + 1) + '）' : ''),
      clientName:  clientList[i % clientList.length],
      pm:          pmList[i % pmList.length],
      bizType:     bizTypes[i % bizTypes.length],
      paymentNode: nodeTypes[i % nodeTypes.length],
      nodeDesc:    nodeDescs[i % nodeDescs.length],
      paymentPct:  [30, 20, 40, 10, 5][i % 5],
      amountWan:   amount,
      invoiceDate: fmt(invDate),
      planDate:    fmt(planDate),
      forecastDate: fmt(fcDate),
      planOverdue:     planDate < today,
      forecastOverdue: fcDate < today,
    });
  }
  return rows;
}

function aggregateArAging(projects) {
  var bizTypes = ['EPC业务', 'PMC业务', '设计咨询类业务'];
  var pmList   = ['张明', '李华', '王芳', '赵磊', '陈伟', '孙洁'];
  var byBiz = {};  var byPm = {};
  bizTypes.forEach(function (bt) { byBiz[bt] = { current: 0, d90: 0, d180: 0, d360: 0 }; });
  pmList.forEach(function (pm)   { byPm[pm]  = { current: 0, d90: 0, d180: 0, d360: 0 }; });
  var total = { current: 0, d90: 0, d180: 0, d360: 0 };

  projects.forEach(function (r, i) {
    var bucket = i % 4 === 0 ? 'd360' : i % 4 === 1 ? 'd180' : i % 4 === 2 ? 'd90' : 'current';
    if (byBiz[r.bizType]) { byBiz[r.bizType][bucket] += r.amountWan; }
    if (byPm[r.pm])       { byPm[r.pm][bucket]       += r.amountWan; }
    total[bucket] += r.amountWan;
  });
  return { agingByBiz: byBiz, agingByPm: byPm, total: total, bizTypes: bizTypes, pmList: pmList };
}

/** WIP 及存货月度明细 */
function generateWipDetail() {
  var rows = [];  var cumWip = 4000;
  for (var i = 0; i < 12; i++) {
    var isForecast = i > 4; // May 2026 = month index 4
    var contract = Math.round(randomBetween(380, 680));
    var invoice  = Math.round(randomBetween(350, 640));
    var wipDelta = contract - invoice;
    cumWip = Math.max(cumWip + wipDelta, 2500);
    var cumInv = Math.round(cumWip * randomBetween(0.36, 0.45));
    rows.push({
      month: (i + 1) + '月', contract: contract, invoice: invoice, wipDelta: wipDelta,
      cumWip: cumWip, cumInv: cumInv, invRatio: +(cumInv / cumWip * 100).toFixed(1),
      isForecast: isForecast,
    });
  }
  return {
    prevYear: { contractAmt: 5000, extCost: 4700, cumWip: 4000, cumInv: 1600, invWipRatio: 40.0 },
    monthly: rows,
  };
}

/** 现金流月度明细 */
function generateCashFlowDetail() {
  var rows = [];  var cumNet = 0;  var cumMgmt = 0;
  for (var i = 0; i < 12; i++) {
    var isForecast = i > 4;
    var inflow  = Math.round(randomBetween(800, 1800));
    var outflow = Math.round(randomBetween(700, 1500));
    var net     = inflow - outflow;
    cumNet  += net;
    var mgmt = Math.round(randomBetween(48, 65));
    cumMgmt += mgmt;
    rows.push({
      month: (i + 1) + '月', inflow: inflow, outflow: outflow,
      netCash: net, cumNetCash: cumNet,
      mgmtFeeAllocated: mgmt, cumMgmtFeeAllocated: cumMgmt,
      cashContrib: net - mgmt, isForecast: isForecast,
    });
  }
  return {
    monthly: rows,
    prevYear:        { netCash: 2480, cashContrib: 1815 },
    forecastYear:    { netCash: Math.round(cumNet * randomBetween(0.92, 1.08)), cashContrib: Math.round((cumNet - cumMgmt) * randomBetween(0.9, 1.1)) },
    twoYearForecast: { netCash: 2480 + Math.round(cumNet), cashContrib: 1815 + Math.round(cumNet - cumMgmt) },
  };
}

/** 收入与毛利月度明细 */
function generateRevenueDetail() {
  var rows   = [];
  var fTotal = { contract: 0, revenue: 0, cost: 0, profit: 0, divMgmt: 0, divProfit: 0, mgmtAlloc: 0, ebit: 0 };
  var yTotal = { contract: 0, revenue: 0, cost: 0, profit: 0, divMgmt: 0, divProfit: 0, mgmtAlloc: 0, ebit: 0 };
  for (var i = 0; i < 12; i++) {
    var isForecast = i > 4;
    var contract   = Math.round(randomBetween(350, 520));
    var revenue    = Math.round(randomBetween(325, 490));
    var cost       = Math.round(revenue * randomBetween(0.72, 0.82));
    var profit     = revenue - cost;
    var divMgmt    = Math.round(randomBetween(38, 56));
    var divProfit  = profit - divMgmt;
    var mgmtAlloc  = Math.round(randomBetween(18, 26));
    var ebit       = divProfit - mgmtAlloc;
    var row = {
      month: (i + 1) + '月', contract: contract, revenue: revenue, cost: cost, profit: profit,
      profitRate:    +(profit    / revenue * 100).toFixed(1),
      divMgmt:       divMgmt,    divProfit: divProfit,
      divProfitRate: +(divProfit / revenue * 100).toFixed(1),
      mgmtFeeAlloc:  mgmtAlloc,  ebitContrib: ebit,
      isForecast:    isForecast,
    };
    rows.push(row);
    fTotal.contract += contract; fTotal.revenue += revenue; fTotal.cost += cost;
    fTotal.profit += profit; fTotal.divMgmt += divMgmt; fTotal.divProfit += divProfit;
    fTotal.mgmtAlloc += mgmtAlloc; fTotal.ebit += ebit;
    if (!isForecast) {
      yTotal.contract += contract; yTotal.revenue += revenue; yTotal.cost += cost;
      yTotal.profit += profit; yTotal.divMgmt += divMgmt; yTotal.divProfit += divProfit;
      yTotal.mgmtAlloc += mgmtAlloc; yTotal.ebit += ebit;
    }
  }
  fTotal.profitRate    = +(fTotal.profit / fTotal.revenue * 100).toFixed(1);
  fTotal.divProfitRate = +(fTotal.divProfit / fTotal.revenue * 100).toFixed(1);
  yTotal.profitRate    = yTotal.revenue > 0 ? +(yTotal.profit / yTotal.revenue * 100).toFixed(1) : 0;
  yTotal.divProfitRate = yTotal.revenue > 0 ? +(yTotal.divProfit / yTotal.revenue * 100).toFixed(1) : 0;
  return { monthly: rows, forecast: fTotal, ytd: yTotal };
}

// ──────────────────────────────────────────────
// 数据获取函数（Phase 2 替换此函数为真实 API）
// ──────────────────────────────────────────────
function fetchData(level, orgCode) {
  // Phase 2: return fetch('/api/cash-flow?level=' + level + '&org=' + orgCode + ...)
  //            .then(function(r) { return r.json(); });
  return Promise.resolve(
    level === 'company'      ? generateCompanyData() :
    level === 'projectGroup' ? generateGroupData(orgCode) :
                               generateBoardData(orgCode)
  );
}

// ──────────────────────────────────────────────
// 工具函数
// ──────────────────────────────────────────────
function formatAmountNum(val) {
  if (val === null || val === undefined) return '—';
  return (+val).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function changeText(val) {
  var sign = val > 0 ? '+' : '';
  return sign + formatAmountNum(val) + ' 万元';
}

// ──────────────────────────────────────────────
// ECharts 图表构建函数
// ──────────────────────────────────────────────
function buildCashflowTrendChart(chartId, trend) {
  var dom = document.getElementById(chartId);
  if (!dom) return;
  var chart = echarts.getInstanceByDom(dom) || echarts.init(dom);
  chart.setOption({
    tooltip: { trigger: 'axis', formatter: function (params) {
      var str = params[0].axisValue + '<br/>';
      params.forEach(function (p) {
        str += p.marker + p.seriesName + '：' + formatAmountNum(p.value) + ' 万元<br/>';
      });
      return str;
    }},
    legend: { data: ['Cash In', 'Cash Out'], top: 0, right: 0, itemWidth: 14, itemHeight: 10, textStyle: { fontSize: 12 } },
    grid: { left: 10, right: 10, bottom: 20, top: 28, containLabel: true },
    xAxis: { type: 'category', data: trend.months, axisLabel: { fontSize: 11 }, boundaryGap: false },
    yAxis: { type: 'value', name: '万元', nameTextStyle: { fontSize: 11 }, axisLabel: { fontSize: 11, formatter: function (v) { return (v/10000).toFixed(0) + 'w'; } } },
    series: [
      {
        name: 'Cash In', type: 'line', smooth: true, data: trend.cashIn12m,
        itemStyle: { color: SUCCESS_COLOR }, lineStyle: { color: SUCCESS_COLOR },
        areaStyle: { color: 'rgba(103,194,58,0.08)' },
      },
      {
        name: 'Cash Out', type: 'line', smooth: true, data: trend.cashOut12m,
        itemStyle: { color: DANGER_COLOR }, lineStyle: { color: DANGER_COLOR },
        areaStyle: { color: 'rgba(245,108,108,0.06)' },
      },
    ],
  }, true);
  return chart;
}

function buildArWipTrendChart(chartId, trend) {
  var dom = document.getElementById(chartId);
  if (!dom) return;
  var chart = echarts.getInstanceByDom(dom) || echarts.init(dom);
  chart.setOption({
    tooltip: { trigger: 'axis', formatter: function (params) {
      var str = params[0].axisValue + '<br/>';
      params.forEach(function (p) {
        str += p.marker + p.seriesName + '：' + formatAmountNum(p.value) + ' 万元<br/>';
      });
      return str;
    }},
    legend: { data: ['AR', 'WIP'], top: 0, right: 0, itemWidth: 14, itemHeight: 10, textStyle: { fontSize: 12 } },
    grid: { left: 10, right: 10, bottom: 20, top: 28, containLabel: true },
    xAxis: { type: 'category', data: trend.months, axisLabel: { fontSize: 11 }, boundaryGap: false },
    yAxis: { type: 'value', name: '万元', nameTextStyle: { fontSize: 11 }, axisLabel: { fontSize: 11, formatter: function (v) { return (v/10000).toFixed(0) + 'w'; } } },
    series: [
      {
        name: 'AR', type: 'line', smooth: true, data: trend.ar12m,
        itemStyle: { color: WARNING_COLOR }, lineStyle: { color: WARNING_COLOR },
      },
      {
        name: 'WIP', type: 'line', smooth: true, data: trend.wip12m,
        itemStyle: { color: THEME_COLOR }, lineStyle: { color: THEME_COLOR },
      },
    ],
  }, true);
  return chart;
}

function buildCashflowRankChart(chartId, boardHealth) {
  var dom = document.getElementById(chartId);
  if (!dom) return;
  var chart = echarts.getInstanceByDom(dom) || echarts.init(dom);

  var paired = boardHealth.names.map(function (n, i) { return { name: n, val: boardHealth.netCash[i] }; });
  paired.sort(function (a, b) { return b.val - a.val; });
  var names = paired.map(function (p) { return p.name; });
  var values = paired.map(function (p) { return p.val; });
  var colors = values.map(function (v) { return v >= 0 ? SUCCESS_COLOR : DANGER_COLOR; });

  chart.setOption({
    tooltip: {
      trigger: 'axis', axisPointer: { type: 'shadow' },
      formatter: function (params) {
        return params[0].name + '<br/>' + params[0].marker + '净现金流：' + formatAmountNum(params[0].value) + ' 万元';
      },
    },
    grid: { left: 10, right: 20, top: 10, bottom: 10, containLabel: true },
    xAxis: { type: 'value', name: '万元', nameTextStyle: { fontSize: 11 }, axisLabel: { fontSize: 10 }, splitLine: { lineStyle: { type: 'dashed' } } },
    yAxis: { type: 'category', data: names, axisLabel: { fontSize: 11 }, inverse: false },
    series: [{
      type: 'bar',
      data: values.map(function (v, i) { return { value: v, itemStyle: { color: colors[i] } }; }),
      barMaxWidth: 24,
      label: { show: true, position: function (params) { return params.value[0] >= 0 ? 'right' : 'left'; }, formatter: function (p) { return formatAmountNum(p.value); }, fontSize: 10 },
    }],
  }, true);
  return chart;
}

function buildCollectionRateChart(chartId, boardHealth) {
  var dom = document.getElementById(chartId);
  if (!dom) return;
  var chart = echarts.getInstanceByDom(dom) || echarts.init(dom);

  var paired = boardHealth.names.map(function (n, i) { return { name: n, val: boardHealth.collRate[i] }; });
  paired.sort(function (a, b) { return b.val - a.val; });
  var names  = paired.map(function (p) { return p.name; });
  var values = paired.map(function (p) { return p.val; });
  var colors = values.map(function (v) {
    return v >= 85 ? SUCCESS_COLOR : (v >= 70 ? WARNING_COLOR : DANGER_COLOR);
  });

  chart.setOption({
    tooltip: {
      trigger: 'axis', axisPointer: { type: 'shadow' },
      formatter: function (params) {
        return params[0].name + '<br/>' + params[0].marker + '回款率：' + params[0].value.toFixed(2) + '%';
      },
    },
    grid: { left: 10, right: 20, top: 10, bottom: 10, containLabel: true },
    xAxis: {
      type: 'value', min: 0, max: 100, name: '%',
      nameTextStyle: { fontSize: 11 }, axisLabel: { fontSize: 10 },
      splitLine: { lineStyle: { type: 'dashed' } },
      // 基准线 85%
      markLine: { silent: true, data: [{ xAxis: 85, lineStyle: { color: SUCCESS_COLOR, type: 'dashed', width: 1.5 }, label: { formatter: '85%', color: SUCCESS_COLOR, fontSize: 11 } }] },
    },
    yAxis: { type: 'category', data: names, axisLabel: { fontSize: 11 } },
    series: [{
      type: 'bar',
      data: values.map(function (v, i) { return { value: v, itemStyle: { color: colors[i] } }; }),
      barMaxWidth: 24,
      label: { show: true, position: 'right', formatter: function (p) { return p.value.toFixed(2) + '%'; }, fontSize: 10 },
      markLine: { silent: true, data: [{ xAxis: 85, lineStyle: { color: SUCCESS_COLOR, type: 'dashed', width: 1.5 }, label: { show: false } }] },
    }],
  }, true);
  return chart;
}

// ──────────────────────────────────────────────
// Vue 实例
// ──────────────────────────────────────────────
new Vue({
  el: '#app',
  data: function () {
    var now = new Date();
    return {
      isLoading: true,
      isMobile: window.innerWidth < 768,

      // 看板层级
      currentLevel: 'company',      // 'company' | 'projectGroup' | 'board'
      selectedProjectGroup: 'SAS810',
      selectedBoard: '金山中心',

      // 静态配置
      levelTabs: [
        { key: 'company',      label: '公司级',  icon: 'fas fa-building' },
        { key: 'projectGroup', label: '项目群级', icon: 'fas fa-sitemap' },
        { key: 'board',        label: '板块级',   icon: 'fas fa-th-large' },
      ],
      projectGroups: PROJECT_GROUPS,
      boards: ALL_BOARDS,

      // 筛选
      filterYear: now.getFullYear(),
      yearOptions: (function () {
        var cur = now.getFullYear(); var opts = [];
        for (var i = cur - 2; i <= cur + 1; i++) opts.push(i); return opts;
      })(),

      // 业务数据
      kpiCards: [],
      managementFeeDetail: [],
      mgmtFeeDialogVisible: false,
      mgmtFeePage: 1,
      mgmtFeePageSize: 10,
      mgmtFeeFilterDraft: { keyword: '', mgmtAttr: '', bizType: '' },
      mgmtFeeFilter:      { keyword: '', mgmtAttr: '', bizType: '' },

      // AR 下探弹窗
      arDialogVisible: false,
      arDetail: null,
      arProjectPage: 1,
      arProjectPageSize: 10,
      arProjectFilter:      { keyword: '', bizType: '', pm: '' },
      arProjectFilterDraft: { keyword: '', bizType: '', pm: '' },

      // WIP & 存货下探弹窗
      wipDialogVisible: false,
      wipDetail: null,

      // 现金流下探弹窗
      cashFlowDialogVisible: false,
      cashFlowDetail: null,

      // 收入与毛利下探弹窗
      revenueDialogVisible: false,
      revenueDetail: null,

      fulfillmentStatus: [],
      alerts: [],
      alertsExpanded: false,
      currentTrend: null,
      currentBoardHealth: null,

      // 指标说明弹窗
      tipVisible: false,
      tipTitle: '',
      tipContent: '',

      // ECharts 实例引用（用于 resize）
      charts: [],

      // 最近一次成功加载完成的时间（用于「最后更新日期」）
      lastRefreshAt: null,
    };
  },

  computed: {
    currentOrgLabel: function () {
      if (this.currentLevel === 'company') return '全公司';
      if (this.currentLevel === 'projectGroup') {
        var g = this.projectGroups.find(function (x) { return x.code === this.selectedProjectGroup; }, this);
        return g ? g.name : '';
      }
      return this.selectedBoard;
    },
    eligibleCount: function () {
      return this.fulfillmentStatus.filter(function (f) { return f.status === 'eligible'; }).length;
    },
    deferredCount: function () {
      return this.fulfillmentStatus.filter(function (f) { return f.status === 'deferred'; }).length;
    },
    deductCount: function () {
      return this.fulfillmentStatus.filter(function (f) { return f.status === 'deduct'; }).length;
    },
    deductDeferredCount: function () {
      return this.fulfillmentStatus.filter(function (f) { return f.status === 'deduct_deferred'; }).length;
    },
    visibleAlerts: function () {
      return this.alertsExpanded ? this.alerts : this.alerts.slice(0, 5);
    },
    lastUpdatedDateText: function () {
      if (!this.lastRefreshAt) return '—';
      var d = this.lastRefreshAt instanceof Date ? this.lastRefreshAt : new Date(this.lastRefreshAt);
      return d.getFullYear() + '年' + (d.getMonth() + 1) + '月' + d.getDate() + '日';
    },
    mgmtFeePagedRows: function () {
      var start = (this.mgmtFeePage - 1) * this.mgmtFeePageSize;
      return this.mgmtFeeFilteredRows.slice(start, start + this.mgmtFeePageSize);
    },
    mgmtFeeFilteredRows: function () {
      var keyword = (this.mgmtFeeFilter.keyword || '').trim().toLowerCase();
      var mgmtAttr = this.mgmtFeeFilter.mgmtAttr;
      var bizType = this.mgmtFeeFilter.bizType;
      return this.managementFeeDetail.filter(function (row) {
        var matchKeyword = !keyword ||
          (row.projectNo && row.projectNo.toLowerCase().indexOf(keyword) > -1) ||
          (row.projectName && row.projectName.toLowerCase().indexOf(keyword) > -1) ||
          (row.partyA && row.partyA.toLowerCase().indexOf(keyword) > -1) ||
          (row.pm && row.pm.toLowerCase().indexOf(keyword) > -1) ||
          (row.owner && row.owner.toLowerCase().indexOf(keyword) > -1);
        var matchMgmtAttr = !mgmtAttr || row.mgmtAttr === mgmtAttr;
        var matchBizType = !bizType || row.bizType === bizType;
        return matchKeyword && matchMgmtAttr && matchBizType;
      });
    },
    mgmtFeeMgmtAttrOptions: function () {
      var map = {};
      this.managementFeeDetail.forEach(function (row) {
        if (row.mgmtAttr) map[row.mgmtAttr] = true;
      });
      return Object.keys(map);
    },
    mgmtFeeBizTypeOptions: function () {
      var map = {};
      this.managementFeeDetail.forEach(function (row) {
        if (row.bizType) map[row.bizType] = true;
      });
      return Object.keys(map);
    },

    // AR 下探相关
    arProjectFilteredRows: function () {
      if (!this.arDetail || !this.arDetail.projects) return [];
      var kw  = (this.arProjectFilter.keyword  || '').trim().toLowerCase();
      var bt  = this.arProjectFilter.bizType;
      var pm  = this.arProjectFilter.pm;
      return this.arDetail.projects.filter(function (r) {
        var mk = !kw || (r.projectNo + r.projectName + r.clientName + r.pm).toLowerCase().indexOf(kw) > -1;
        var mb = !bt || r.bizType === bt;
        var mp = !pm || r.pm === pm;
        return mk && mb && mp;
      });
    },
    arProjectPagedRows: function () {
      var s = (this.arProjectPage - 1) * this.arProjectPageSize;
      return this.arProjectFilteredRows.slice(s, s + this.arProjectPageSize);
    },
    arBizTypeOptions: function () {
      if (!this.arDetail) return [];
      var map = {};
      this.arDetail.projects.forEach(function (r) { if (r.bizType) map[r.bizType] = true; });
      return Object.keys(map);
    },
    arPmOptions: function () {
      if (!this.arDetail) return [];
      var map = {};
      this.arDetail.projects.forEach(function (r) { if (r.pm) map[r.pm] = true; });
      return Object.keys(map);
    },
  },

  methods: {
    // 数字格式化（对外暴露给 template）
    formatAmount: function (val) { return formatAmountNum(val); },

    // 兑现状态图标 class
    fulfillmentIcon: function (status) {
      if (status === 'eligible')        return 'fas fa-check-circle ff-eligible';
      if (status === 'deferred')        return 'fas fa-clock ff-deferred';
      if (status === 'deduct')          return 'fas fa-minus-circle ff-deduct';
      return 'fas fa-times-circle ff-deduct_deferred';
    },

    // 兑现状态 tooltip 内容（悬浮显示 P 和净现金流）
    fulfillmentTip: function (item) {
      var pSign  = item.profit  >= 0 ? '+' : '';
      var cfSign = item.netCash >= 0 ? '+' : '';
      var statusLabel = item.status === 'eligible'        ? '正常发放'
                      : item.status === 'deferred'        ? '缓发（现金流待转正）'
                      : item.status === 'deduct'          ? '扣减发放（P<0，按比例扣减工资后发放）'
                      : '扣减+缓发（P<0 且现金流为负）';
      return 'P（利润贡献）：' + pSign  + formatAmountNum(item.profit)  + ' 万元'
           + '  |  净现金流：' + cfSign + formatAmountNum(item.netCash) + ' 万元'
           + '  |  ' + statusLabel;
    },

    // 打开指标说明弹窗（替代 tooltip，PC/移动全端通用）
    openTip: function (title, content) {
      this.tipTitle   = title;
      this.tipContent = content;
      this.tipVisible = true;
    },

    // 切换层级
    switchLevel: function (level) {
      this.currentLevel = level;
      this.loadData();
    },

    // 组织变更（下拉选择项目群/板块）
    onOrgChange: function () {
      this.loadData();
    },

    // PC 查询
    onSearch: function () {
      this.loadData();
    },

    // 加载数据并渲染
    loadData: function () {
      var self = this;
      self.isLoading = true;
      var orgCode =
        self.currentLevel === 'company'      ? 'company' :
        self.currentLevel === 'projectGroup' ? self.selectedProjectGroup :
                                               self.selectedBoard;

      fetchData(self.currentLevel, orgCode).then(function (data) {
        self.buildKpiCards(data.kpi);
        self.managementFeeDetail = data.managementFeeDetail || [];
        self.resetMgmtFeeFilter();
        self.arDetail        = data.arDetail        || null;
        self.wipDetail       = data.wipDetail       || null;
        self.cashFlowDetail  = data.cashFlowDetail  || null;
        self.revenueDetail   = data.revenueDetail   || null;
        self.arProjectFilter      = { keyword: '', bizType: '', pm: '' };
        self.arProjectFilterDraft = { keyword: '', bizType: '', pm: '' };
        self.arProjectPage = 1;
        self.fulfillmentStatus = data.fulfillment || [];
        self.alerts            = data.alerts || [];
        self.alertsExpanded    = false;
        self.currentTrend      = data.trend;
        self.currentBoardHealth = data.boardHealth;
        self.lastRefreshAt     = new Date();
        self.isLoading = false;

        self.$nextTick(function () {
          self.renderCharts();
        });
      });
    },

    // 构建 KPI 卡片数据
    buildKpiCards: function (kpi) {
      var netPositive = kpi.netCash >= 0;
      this.kpiCards = [
        {
          key: 'wip', label: 'WIP', unit: '万元',
          value: kpi.wip, changePositive: kpi.wipChange >= 0, changeText: changeText(kpi.wipChange),
          colorClass: '', drillable: true, drillType: 'wip',
          tooltip: '来源：月度经营数据设置。在实施项目累计确认产值，存量值（累计）。数据刷新：每月初更新。',
        },
        {
          key: 'ar', label: 'AR', unit: '万元',
          value: kpi.ar, changePositive: kpi.arChange <= 0, changeText: changeText(kpi.arChange),
          colorClass: '', drillable: true, drillType: 'ar',
          tooltip: '来源：月度经营数据设置。已确认收入但尚未收到的款项，存量值。AR 下降为正向指标。',
        },
        {
          key: 'cashIn', label: 'Cash In', unit: '万元',
          value: kpi.cashIn, changePositive: kpi.cashInChange >= 0, changeText: changeText(kpi.cashInChange),
          colorClass: '', drillable: true, drillType: 'cashFlow',
          tooltip: '来源：月度经营数据完成回款额 + 开票回款中台。当月实际到账资金，流量值。',
        },
        {
          key: 'cashOut', label: 'Cash Out', unit: '万元',
          value: kpi.cashOut, changePositive: kpi.cashOutChange <= 0, changeText: changeText(kpi.cashOutChange),
          colorClass: '', drillable: true, drillType: 'cashFlow',
          tooltip: '来源：采购付款 + 施工付款 + 一般付款 + 费用报销 + 往来款汇总（Phase 1）。当月实际支出，流量值。',
        },
        {
          key: 'netCash', label: '净现金流', unit: '万元',
          value: kpi.netCash, changePositive: kpi.netCashChange >= 0, changeText: changeText(kpi.netCashChange),
          colorClass: netPositive ? 'kpi-card-positive' : 'kpi-card-negative',
          drillable: true, drillType: 'cashFlow',
          tooltip: '净现金流 = Cash In − Cash Out。正值表示资金健康，负值表示资金紧张。',
        },
        {
          key: 'mgmtFee', label: '公司管理费', unit: '万元',
          value: kpi.managementFeeWan,
          changePositive: kpi.managementFeeChangeWan <= 0,
          changeText: changeText(kpi.managementFeeChangeWan),
          colorClass: '', drillable: true, drillType: 'mgmtFee',
          tooltip: '按项目计提的公司管理费（OH）汇总。点击进入项目明细；金额为财务口径。',
        },
        {
          key: 'inventory', label: '存货', unit: '万元',
          value: kpi.inventoryWan,
          changePositive: kpi.inventoryChangeWan <= 0,
          changeText: changeText(kpi.inventoryChangeWan),
          colorClass: '', drillable: true, drillType: 'wip',
          tooltip: '存货余额 = 累计采购/制造成本中尚未结转的在库物资价值。存量值，与 WIP 同源。',
        },
        {
          key: 'revenue', label: '营业收入', unit: '万元',
          value: kpi.revenueWan,
          changePositive: kpi.revenueChangeWan >= 0,
          changeText: changeText(kpi.revenueChangeWan),
          colorClass: '', drillable: true, drillType: 'revenue',
          tooltip: '全年预测营业收入（开票口径）。数据来源：收入与毛利月度汇总。',
        },
      ];
    },

    onKpiCardClick: function (card) {
      if (!card.drillable) return;
      var dispatch = {
        mgmtFee:  this.openMgmtFeeDialog,
        ar:       this.openArDialog,
        wip:      this.openWipDialog,
        cashFlow: this.openCashFlowDialog,
        revenue:  this.openRevenueDialog,
      };
      if (dispatch[card.drillType]) dispatch[card.drillType].call(this);
    },

    openMgmtFeeDialog: function () {
      this.mgmtFeePage = 1;
      this.mgmtFeeFilterDraft = {
        keyword: this.mgmtFeeFilter.keyword,
        mgmtAttr: this.mgmtFeeFilter.mgmtAttr,
        bizType: this.mgmtFeeFilter.bizType,
      };
      this.mgmtFeeDialogVisible = true;
    },
    applyMgmtFeeFilter: function () {
      this.mgmtFeeFilter = {
        keyword: this.mgmtFeeFilterDraft.keyword || '',
        mgmtAttr: this.mgmtFeeFilterDraft.mgmtAttr || '',
        bizType: this.mgmtFeeFilterDraft.bizType || '',
      };
      this.mgmtFeePage = 1;
    },
    resetMgmtFeeFilter: function () {
      this.mgmtFeeFilterDraft = { keyword: '', mgmtAttr: '', bizType: '' };
      this.mgmtFeeFilter = { keyword: '', mgmtAttr: '', bizType: '' };
      this.mgmtFeePage = 1;
    },

    formatYuan: function (yuan) {
      if (yuan === null || yuan === undefined) return '—';
      return (+yuan).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    },

    // ── AR 下探 ──────────────────────────────────
    openArDialog: function () {
      this.arProjectPage = 1;
      this.arProjectFilter      = { keyword: '', bizType: '', pm: '' };
      this.arProjectFilterDraft = { keyword: '', bizType: '', pm: '' };
      this.arDialogVisible = true;
    },
    applyArFilter: function () {
      this.arProjectFilter = Object.assign({}, this.arProjectFilterDraft);
      this.arProjectPage = 1;
    },
    resetArFilter: function () {
      this.arProjectFilterDraft = { keyword: '', bizType: '', pm: '' };
      this.arProjectFilter      = { keyword: '', bizType: '', pm: '' };
      this.arProjectPage = 1;
    },
    arAgingTotalPct: function (bucket) {
      if (!this.arDetail) return '0.0';
      var t = this.arDetail.total;
      var sum = t.current + t.d90 + t.d180 + t.d360;
      if (!sum) return '0.0';
      return (t[bucket] / sum * 100).toFixed(1);
    },
    buildArCharts: function () {
      if (!this.arDetail) return;
      var self = this;
      setTimeout(function () {
        // PM 堆叠柱图
        var pmDom = document.getElementById('ar-pm-chart');
        if (pmDom) {
          var c1 = echarts.getInstanceByDom(pmDom) || echarts.init(pmDom);
          var pmData = self.arDetail.agingByPm;
          var pmList = self.arDetail.pmList;
          c1.setOption({
            tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
            legend: { data: ['账期内', '90天以内', '180-360天', '360天以上'], bottom: 0, textStyle: { fontSize: 11 } },
            grid: { left: 10, right: 10, top: 10, bottom: 44, containLabel: true },
            xAxis: { type: 'category', data: pmList, axisLabel: { fontSize: 11 } },
            yAxis: { type: 'value', name: '万元', axisLabel: { fontSize: 10 } },
            series: [
              { name: '账期内',    type: 'bar', stack: 'a', data: pmList.map(function (p) { return pmData[p] ? pmData[p].current : 0; }), itemStyle: { color: '#4f9ef8' } },
              { name: '90天以内',  type: 'bar', stack: 'a', data: pmList.map(function (p) { return pmData[p] ? pmData[p].d90    : 0; }), itemStyle: { color: '#67c23a' } },
              { name: '180-360天', type: 'bar', stack: 'a', data: pmList.map(function (p) { return pmData[p] ? pmData[p].d180   : 0; }), itemStyle: { color: '#e6a23c' } },
              { name: '360天以上', type: 'bar', stack: 'a', data: pmList.map(function (p) { return pmData[p] ? pmData[p].d360   : 0; }), itemStyle: { color: '#f56c6c' } },
            ],
          }, true);
        }
        // 账期分布 treemap
        var agingDom = document.getElementById('ar-aging-chart');
        if (agingDom) {
          var c2 = echarts.getInstanceByDom(agingDom) || echarts.init(agingDom);
          var t  = self.arDetail.total;
          var tSum = t.current + t.d90 + t.d180 + t.d360;
          c2.setOption({
            tooltip: { formatter: function (p) { return p.name.split('\n')[0] + '：' + formatAmountNum(p.value) + ' 万元'; } },
            series: [{
              type: 'treemap', roam: false, nodeClick: false, breadcrumb: { show: false },
              label: { fontSize: 12, formatter: function (p) { return p.name; } },
              data: [
                { name: '账期内\n' + formatAmountNum(t.current) + ' 万\n' + (t.current / tSum * 100).toFixed(1) + '%', value: t.current, itemStyle: { color: '#4f9ef8' } },
                { name: '90天以内\n' + formatAmountNum(t.d90) + ' 万\n' + (t.d90 / tSum * 100).toFixed(1) + '%', value: t.d90, itemStyle: { color: '#67c23a' } },
                { name: '180-360天\n' + formatAmountNum(t.d180) + ' 万\n' + (t.d180 / tSum * 100).toFixed(1) + '%', value: t.d180, itemStyle: { color: '#e6a23c' } },
                { name: '360天以上\n' + formatAmountNum(t.d360) + ' 万\n' + (t.d360 / tSum * 100).toFixed(1) + '%', value: t.d360, itemStyle: { color: '#f56c6c' } },
              ],
            }],
          }, true);
        }
      }, 150);
    },

    // ── WIP & 存货下探 ───────────────────────────
    openWipDialog: function () {
      this.wipDialogVisible = true;
    },
    buildWipChart: function () {
      if (!this.wipDetail) return;
      var self = this;
      setTimeout(function () {
        var dom = document.getElementById('wip-trend-chart');
        if (!dom) return;
        var chart = echarts.getInstanceByDom(dom) || echarts.init(dom);
        var rows   = self.wipDetail.monthly;
        var months = rows.map(function (r) { return r.month; });
        chart.setOption({
          tooltip: { trigger: 'axis' },
          legend: { data: ['累计WIP余额', '累计存货', '存货/WIP比例'], bottom: 0, textStyle: { fontSize: 11 } },
          grid: { left: 10, right: 50, top: 10, bottom: 44, containLabel: true },
          xAxis: { type: 'category', data: months, axisLabel: { fontSize: 11 } },
          yAxis: [
            { type: 'value', name: '万元', axisLabel: { fontSize: 10 } },
            { type: 'value', name: '%', axisLabel: { fontSize: 10, formatter: '{value}%' }, splitLine: { show: false } },
          ],
          series: [
            { name: '累计WIP余额', type: 'bar', data: rows.map(function (r) { return r.cumWip; }), itemStyle: { color: '#007069' } },
            { name: '累计存货',    type: 'bar', data: rows.map(function (r) { return r.cumInv; }), itemStyle: { color: '#4f9ef8' } },
            { name: '存货/WIP比例', type: 'line', yAxisIndex: 1, data: rows.map(function (r) { return r.invRatio; }),
              itemStyle: { color: '#e6a23c' }, symbol: 'circle', symbolSize: 5,
              label: { show: true, formatter: function (p) { return p.value + '%'; }, fontSize: 10 } },
          ],
        }, true);
      }, 150);
    },

    // ── 现金流下探 ───────────────────────────────
    openCashFlowDialog: function () {
      this.cashFlowDialogVisible = true;
    },
    buildCashFlowDetailChart: function () {
      if (!this.cashFlowDetail) return;
      var self = this;
      setTimeout(function () {
        var dom = document.getElementById('cf-detail-chart');
        if (!dom) return;
        var chart  = echarts.getInstanceByDom(dom) || echarts.init(dom);
        var rows   = self.cashFlowDetail.monthly;
        var months = rows.map(function (r) { return r.month; });
        var actIn  = rows.map(function (r) { return r.isForecast ? null : r.inflow; });
        var actOut = rows.map(function (r) { return r.isForecast ? null : r.outflow; });
        var fcIn   = rows.map(function (r) { return r.isForecast ? r.inflow  : null; });
        var fcOut  = rows.map(function (r) { return r.isForecast ? r.outflow : null; });
        var cumNet = rows.map(function (r) { return r.cumNetCash; });
        chart.setOption({
          tooltip: { trigger: 'axis' },
          legend: { data: ['实际现金流入', '实际现金流出', '预测现金流入', '预测现金流出', '累计经营性净现金流'], bottom: 0, textStyle: { fontSize: 11 } },
          grid: { left: 10, right: 50, top: 10, bottom: 50, containLabel: true },
          xAxis: { type: 'category', data: months, axisLabel: { fontSize: 11 } },
          yAxis: [
            { type: 'value', name: '万元', axisLabel: { fontSize: 10 } },
            { type: 'value', name: '万元（累计）', axisLabel: { fontSize: 10 }, splitLine: { show: false } },
          ],
          series: [
            { name: '实际现金流入', type: 'bar', data: actIn,  itemStyle: { color: '#4f9ef8' } },
            { name: '实际现金流出', type: 'bar', data: actOut, itemStyle: { color: '#e6a23c' } },
            { name: '预测现金流入', type: 'bar', data: fcIn,   itemStyle: { color: '#4f9ef8', opacity: 0.45 } },
            { name: '预测现金流出', type: 'bar', data: fcOut,  itemStyle: { color: '#e6a23c', opacity: 0.45 } },
            { name: '累计经营性净现金流', type: 'line', yAxisIndex: 1, data: cumNet,
              itemStyle: { color: '#f56c6c' }, lineStyle: { width: 2 }, symbol: 'circle', symbolSize: 5 },
          ],
        }, true);
      }, 150);
    },

    // ── 收入与毛利下探 ───────────────────────────
    openRevenueDialog: function () {
      this.revenueDialogVisible = true;
    },

    // 渲染所有图表（延迟执行确保容器已完成布局）
    renderCharts: function () {
      var self = this;
      var trend  = self.currentTrend;
      var health = self.currentBoardHealth;
      if (!trend || !health) return;

      // 先销毁旧实例，避免容器宽度缓存问题
      self.charts.forEach(function (c) { try { c.dispose(); } catch (e) { /* ignore */ } });
      self.charts = [];

      // setTimeout 确保 DOM 在 $nextTick 后已完成 grid 布局计算
      setTimeout(function () {
        var charts = [];
        var c1 = buildCashflowTrendChart('cashflow-trend-chart', trend);
        var c2 = buildArWipTrendChart('ar-wip-trend-chart', trend);
        var c3 = buildCashflowRankChart('cashflow-rank-chart', health);
        var c4 = buildCollectionRateChart('collection-rate-chart', health);
        if (c1) { c1.resize(); charts.push(c1); }
        if (c2) { c2.resize(); charts.push(c2); }
        if (c3) { c3.resize(); charts.push(c3); }
        if (c4) { c4.resize(); charts.push(c4); }
        self.charts = charts;
      }, 50);
    },

    // 窗口 resize 重绘
    handleResize: function () {
      var wasMobile = this.isMobile;
      this.isMobile = window.innerWidth < 768;
      // 移动/PC 切换时重新渲染布局
      if (wasMobile !== this.isMobile) {
        var self = this;
        this.$nextTick(function () { self.renderCharts(); });
      }
      this.charts.forEach(function (c) {
        try { c.resize(); } catch (e) { /* ignore */ }
      });
    },
  },

  mounted: function () {
    var self = this;
    self.loadData();
    window.addEventListener('resize', function () { self.handleResize(); });
  },

  beforeDestroy: function () {
    window.removeEventListener('resize', this.handleResize);
    this.charts.forEach(function (c) { try { c.dispose(); } catch (e) { /* ignore */ } });
  },
});
