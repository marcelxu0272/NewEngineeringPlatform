/* 银川绩效派发 · 原型 Mock 版
 * 技术栈：Vue 2 + Element UI 2.15 + Tailwind 2（CDN，无脚手架）
 * 口径来源：docs/plans/2026-09-10-yinchuan-performance-payout-design.md v0.26
 *
 * 实现说明：
 * 1. 比例一律存 0~10000 的万分比整数，校验用整数比较，不做浮点相加。
 * 2. 金额中间不取整，仅展示时四舍五入到分；尾差按 distribute() 补到本级最后一行。
 * 3. LedgerEntry 不单独落库，按 spec「派生金额一律现算」由单据派生，避免两套数字。
 * 4. 任务书、派工记录为只读 mock，不提供维护页。
 * 5. 专业间一行 = 任务书一个单元；专业内按 unitId 建单。
 * 6. 发起编辑态预估包按 K2/K3 默认值试算，仅辅助填表。
 * 7. 专业间可终止整链；已终止释放可分配基数，KPI 不计。
 */

(function () {
  'use strict';

  var STORAGE_KEY = 'engineering-platform-yinchuan-performance-payout-v6';

  /* ==========================================================================
   * 一、主数据（只读 mock）
   * ========================================================================== */

  var USERS = [
    { id: 'u_wanglei', name: '王磊', namePinyin: 'wanglei', empNo: '170001', status: 'active' },
    { id: 'u_liqiang', name: '李强', namePinyin: 'liqiang', empNo: '170002', status: 'active' },
    { id: 'u_zhangxin', name: '张鑫', namePinyin: 'zhangxin', empNo: '170003', status: 'active' },
    { id: 'u_anxiaohua', name: '安小华', namePinyin: 'anxiaohua', empNo: '170004', status: 'active' },
    { id: 'u_sunqiang', name: '孙强', namePinyin: 'sunqiang', empNo: '170011', status: 'active' },
    { id: 'u_zhaomin', name: '赵敏', namePinyin: 'zhaomin', empNo: '170012', status: 'active' },
    { id: 'u_zhoufang', name: '周芳', namePinyin: 'zhoufang', empNo: '170013', status: 'active' },
    { id: 'u_qianjin', name: '钱进', namePinyin: 'qianjin', empNo: '170014', status: 'active' },
    { id: 'u_huangbin', name: '黄斌', namePinyin: 'huangbin', empNo: '170021', status: 'active' },
    { id: 'u_litao', name: '李涛', namePinyin: 'litao', empNo: '170022', status: 'active' },
    { id: 'u_hanxue', name: '韩雪', namePinyin: 'hanxue', empNo: '170023', status: 'active' },
    { id: 'u_machao', name: '马超', namePinyin: 'machao', empNo: '178901', status: 'active' },
    { id: 'u_liuyang', name: '刘洋', namePinyin: 'liuyang', empNo: '178902', status: 'active' },
    { id: 'u_chenli', name: '陈立', namePinyin: 'chenli', empNo: '178903', status: 'active' },
    { id: 'u_wuqian', name: '吴倩', namePinyin: 'wuqian', empNo: '178904', status: 'active' },
    { id: 'u_guojing', name: '郭静', namePinyin: 'guojing', empNo: '178905', status: 'active' },
    { id: 'u_fenghao', name: '冯浩', namePinyin: 'fenghao', empNo: '178906', status: 'active' },
    // 历史派过工时但已离职：不应出现在专业内可选名单
    { id: 'u_zhouli', name: '周离', namePinyin: 'zhouli', empNo: '178999', status: 'resigned' },
    { id: 'u_admin', name: '管理员', namePinyin: 'guanliyuan', empNo: '100000', status: 'active' }
  ];

  var USER_MAP = USERS.reduce(function (m, u) { m[u.id] = u; return m; }, {});

  var DISCIPLINES = [
    { id: 'd_pipe', name: '设计-设计-管道', directorUserId: 'u_huangbin' },
    { id: 'd_process', name: '设计-设计-工艺', directorUserId: 'u_litao' },
    { id: 'd_elec', name: '设计-设计-电气', directorUserId: 'u_hanxue' }
  ];

  var DISCIPLINE_MAP = DISCIPLINES.reduce(function (m, d) { m[d.id] = d; return m; }, {});

  /** 专业饼图固定色（同一专业跨单颜色一致） */
  var DISCIPLINE_PIE_COLOR = {
    d_pipe: '#007069',
    d_process: '#3c928d',
    d_elec: '#6faeab'
  };
  var PIE_COLOR_FALLBACK = ['#95c3c1', '#cae1e0', '#5a9e9a'];

  var PROJECTS = [
    { id: 'p018', code: 'B26666', name: '银川新材料装置设计', center: 'SAS530', contractAmountExclTax: 10000000, managerUserId: 'u_wanglei' },
    { id: 'p019', code: 'B26777', name: '银川中试装置改造', center: 'SAS530', contractAmountExclTax: 6000000, managerUserId: 'u_wanglei' },
    { id: 'p020', code: 'B26888', name: '银川热电联产配套', center: 'SAS530', contractAmountExclTax: 8000000, managerUserId: 'u_liqiang' },
    { id: 'p021', code: 'B26999', name: '银川空分装置改造', center: 'SAS530', contractAmountExclTax: 12000000, managerUserId: 'u_wanglei' },
    { id: 'p022', code: 'B27000-0001', name: '银川污水处理配套', center: 'SAS530', contractAmountExclTax: 10000000, managerUserId: 'u_wanglei' },
    { id: 'p023', code: 'B27111-0001', name: '银川储运系统升级', center: 'SAS530', contractAmountExclTax: 7500000, managerUserId: 'u_wanglei' },
    { id: 'p024', code: 'B27222-0001', name: '银川循环水系统改造', center: 'SAS530', contractAmountExclTax: 9000000, managerUserId: 'u_wanglei' }
  ];

  var PROJECT_MAP = PROJECTS.reduce(function (m, p) { m[p.id] = p; return m; }, {});

  /* 任务书：同一专业可在多工作包重复出现、负责人可不同。p019 无任务书，不可发起。 */
  var TASK_BOOKS = [
    {
      id: 'tb018', projectId: 'p018', workPackages: [
        { id: 'WP1', name: '主装置管道', disciplineId: 'd_pipe', leadUserId: 'u_sunqiang' },
        { id: 'WP2', name: '工艺系统', disciplineId: 'd_process', leadUserId: 'u_zhaomin' },
        { id: 'WP3', name: '供配电', disciplineId: 'd_elec', leadUserId: 'u_zhoufang' },
        { id: 'WP4', name: '公用工程管道', disciplineId: 'd_pipe', leadUserId: 'u_sunqiang' }
      ]
    },
    {
      id: 'tb020', projectId: 'p020', workPackages: [
        { id: 'WP1', name: '热力管道', disciplineId: 'd_pipe', leadUserId: 'u_sunqiang' },
        { id: 'WP2', name: '热电电气', disciplineId: 'd_elec', leadUserId: 'u_zhoufang' }
      ]
    },
    {
      id: 'tb021', projectId: 'p021', workPackages: [
        { id: 'WP1', name: '空分管道', disciplineId: 'd_pipe', leadUserId: 'u_sunqiang' },
        { id: 'WP2', name: '空分工艺', disciplineId: 'd_process', leadUserId: 'u_zhaomin' }
      ]
    },
    {
      id: 'tb022', projectId: 'p022', workPackages: [
        { id: 'WP1', name: '污水管网', disciplineId: 'd_pipe', leadUserId: 'u_sunqiang' },
        { id: 'WP2', name: '处理工艺', disciplineId: 'd_process', leadUserId: 'u_zhaomin' }
      ]
    },
    {
      id: 'tb023', projectId: 'p023', workPackages: [
        { id: 'WP1', name: '储运管道', disciplineId: 'd_pipe', leadUserId: 'u_sunqiang' },
        { id: 'WP2', name: '储运工艺', disciplineId: 'd_process', leadUserId: 'u_zhaomin' },
        { id: 'WP3', name: '储运电气', disciplineId: 'd_elec', leadUserId: 'u_zhoufang' }
      ]
    },
    {
      // 同专业多单元、不同负责人：管道 WP1 孙强 / WP5 钱进
      id: 'tb024', projectId: 'p024', workPackages: [
        { id: 'WP1', name: '循环水管道', disciplineId: 'd_pipe', leadUserId: 'u_sunqiang' },
        { id: 'WP2', name: '循环水工艺', disciplineId: 'd_process', leadUserId: 'u_zhaomin' },
        { id: 'WP5', name: '冷却塔管道', disciplineId: 'd_pipe', leadUserId: 'u_qianjin' }
      ]
    }
  ];

  var TASK_BOOK_BY_PROJECT = TASK_BOOKS.reduce(function (m, t) { m[t.projectId] = t; return m; }, {});

  /* 工时派发记录：按项目 + 单元 + 专业；专业内名单取当前单元当前专业下全量历史派工工程师去重、剔离职 */
  var DISPATCHES = [
    { projectId: 'p018', unitId: 'WP1', disciplineId: 'd_pipe', leadUserId: 'u_sunqiang', engineerUserId: 'u_machao' },
    { projectId: 'p018', unitId: 'WP1', disciplineId: 'd_pipe', leadUserId: 'u_sunqiang', engineerUserId: 'u_liuyang' },
    { projectId: 'p018', unitId: 'WP1', disciplineId: 'd_pipe', leadUserId: 'u_sunqiang', engineerUserId: 'u_zhouli' },
    { projectId: 'p018', unitId: 'WP4', disciplineId: 'd_pipe', leadUserId: 'u_sunqiang', engineerUserId: 'u_machao' },
    { projectId: 'p018', unitId: 'WP2', disciplineId: 'd_process', leadUserId: 'u_zhaomin', engineerUserId: 'u_chenli' },
    { projectId: 'p018', unitId: 'WP2', disciplineId: 'd_process', leadUserId: 'u_zhaomin', engineerUserId: 'u_wuqian' },
    { projectId: 'p018', unitId: 'WP3', disciplineId: 'd_elec', leadUserId: 'u_zhoufang', engineerUserId: 'u_guojing' },

    { projectId: 'p020', unitId: 'WP1', disciplineId: 'd_pipe', leadUserId: 'u_sunqiang', engineerUserId: 'u_machao' },
    { projectId: 'p020', unitId: 'WP1', disciplineId: 'd_pipe', leadUserId: 'u_sunqiang', engineerUserId: 'u_liuyang' },
    { projectId: 'p020', unitId: 'WP2', disciplineId: 'd_elec', leadUserId: 'u_zhoufang', engineerUserId: 'u_guojing' },

    { projectId: 'p021', unitId: 'WP1', disciplineId: 'd_pipe', leadUserId: 'u_sunqiang', engineerUserId: 'u_machao' },
    { projectId: 'p021', unitId: 'WP1', disciplineId: 'd_pipe', leadUserId: 'u_sunqiang', engineerUserId: 'u_liuyang' },
    { projectId: 'p021', unitId: 'WP2', disciplineId: 'd_process', leadUserId: 'u_zhaomin', engineerUserId: 'u_chenli' },
    { projectId: 'p021', unitId: 'WP2', disciplineId: 'd_process', leadUserId: 'u_zhaomin', engineerUserId: 'u_wuqian' },

    { projectId: 'p022', unitId: 'WP1', disciplineId: 'd_pipe', leadUserId: 'u_sunqiang', engineerUserId: 'u_machao' },
    { projectId: 'p022', unitId: 'WP1', disciplineId: 'd_pipe', leadUserId: 'u_sunqiang', engineerUserId: 'u_liuyang' },
    { projectId: 'p022', unitId: 'WP2', disciplineId: 'd_process', leadUserId: 'u_zhaomin', engineerUserId: 'u_chenli' },
    { projectId: 'p022', unitId: 'WP2', disciplineId: 'd_process', leadUserId: 'u_zhaomin', engineerUserId: 'u_wuqian' },

    { projectId: 'p023', unitId: 'WP1', disciplineId: 'd_pipe', leadUserId: 'u_sunqiang', engineerUserId: 'u_machao' },
    { projectId: 'p023', unitId: 'WP1', disciplineId: 'd_pipe', leadUserId: 'u_sunqiang', engineerUserId: 'u_liuyang' },
    { projectId: 'p023', unitId: 'WP2', disciplineId: 'd_process', leadUserId: 'u_zhaomin', engineerUserId: 'u_chenli' },
    { projectId: 'p023', unitId: 'WP2', disciplineId: 'd_process', leadUserId: 'u_zhaomin', engineerUserId: 'u_wuqian' },
    { projectId: 'p023', unitId: 'WP3', disciplineId: 'd_elec', leadUserId: 'u_zhoufang', engineerUserId: 'u_guojing' },

    { projectId: 'p024', unitId: 'WP1', disciplineId: 'd_pipe', leadUserId: 'u_sunqiang', engineerUserId: 'u_machao' },
    { projectId: 'p024', unitId: 'WP5', disciplineId: 'd_pipe', leadUserId: 'u_qianjin', engineerUserId: 'u_liuyang' },
    { projectId: 'p024', unitId: 'WP5', disciplineId: 'd_pipe', leadUserId: 'u_qianjin', engineerUserId: 'u_fenghao' },
    { projectId: 'p024', unitId: 'WP2', disciplineId: 'd_process', leadUserId: 'u_zhaomin', engineerUserId: 'u_chenli' }
  ];

  /**
   * 工时派发明细（演示 mock）：项目 + 单元 + 专业；同一人可多资格行。
   * reportHours / dispatchHours 可为 null（界面 -）；上报超过派发属正常。
   */
  var HOUR_DISPATCH_LINES = [];
  (function seedHourDispatchLines() {
    var months = ['2026-07', '2026-08', '2026-09'];
    DISPATCHES.forEach(function (d, idx) {
      months.forEach(function (m, mi) {
        var base = 8 + ((idx + mi * 3) % 5) * 8;
        var dispatch = (mi === 2 && idx % 5 === 0) ? null : base;
        var report;
        if (mi === 1) report = base + 12;
        else if (mi === 2 && idx % 4 === 1) report = null;
        else report = Math.max(0, base - (idx % 3) * 4);
        if (report === null && dispatch === null) return;
        HOUR_DISPATCH_LINES.push({
          projectId: d.projectId,
          unitId: d.unitId,
          disciplineId: d.disciplineId,
          engineerUserId: d.engineerUserId,
          role: '设计',
          month: m,
          reportHours: report,
          dispatchHours: dispatch
        });
      });
      if (idx % 2 === 0) {
        HOUR_DISPATCH_LINES.push({
          projectId: d.projectId,
          unitId: d.unitId,
          disciplineId: d.disciplineId,
          engineerUserId: d.engineerUserId,
          role: '校核',
          month: '2026-08',
          reportHours: 8,
          dispatchHours: 16
        });
      }
      if (idx % 5 === 0) {
        HOUR_DISPATCH_LINES.push({
          projectId: d.projectId,
          unitId: d.unitId,
          disciplineId: d.disciplineId,
          engineerUserId: d.engineerUserId,
          role: '审核',
          month: '2026-08',
          reportHours: null,
          dispatchHours: 4
        });
      }
    });
  })();

  /* ==========================================================================
   * 二、规则配置演示默认值（§3.5）
   * ========================================================================== */

  function defaultConfig() {
    return {
      k2ReviewerId: 'u_zhangxin',
      k3ReviewerId: 'u_anxiaohua',
      k1: { min: 1, max: 5000 },               // 万分比整数：0.01% ~ 50%
      k2: { min: 0, max: 2, default: 1 },
      k3: { min: 0, max: 2, default: 1 },
      quality: {
        weight: 0.4, defaultOptionId: 'q1', options: [
          { id: 'q1', label: '按项目质量要求完成', coef: 1.0 },
          { id: 'q2', label: '项目内审无不合格项，但整改问题较多', coef: 0.9 },
          { id: 'q3', label: '项目内审有不合格项', coef: 0.8 },
          { id: 'q4', label: '业主有书面质量问题反馈', coef: 0.7 }
        ]
      },
      progress: {
        weight: 0.3, defaultOptionId: 'p1', options: [
          { id: 'p1', label: '按项目计划完成', coef: 1.0 },
          { id: 'p2', label: '本专业按计划，但影响其他专业进度', coef: 0.9 },
          { id: 'p3', label: '影响本专业及其他专业进度', coef: 0.8 }
        ]
      },
      response: {
        weight: 0.3, defaultOptionId: 'r1', options: [
          { id: 'r1', label: '业主及项目团队无负面反馈', coef: 1.0 },
          { id: 'r2', label: '公司内部有书面的负面反馈', coef: 0.9 },
          { id: 'r3', label: '业主有书面的负面反馈', coef: 0.8 }
        ]
      }
    };
  }

  /* ==========================================================================
   * 三、状态字典
   * ========================================================================== */

  var INTER_STATUS = {
    INTER_DRAFT: { label: '草稿', badge: 'yc-badge-mute' },
    INTER_PENDING: { label: '待审核', badge: 'yc-badge-doing' },
    INTER_APPROVED: { label: '已通过', badge: 'yc-badge-ok' },
    INTER_REJECTED: { label: '已驳回', badge: 'yc-badge-danger' },
    INTER_TERMINATED: { label: '已终止', badge: 'yc-badge-danger' }
  };

  var INTRA_STATUS = {
    INTRA_DRAFT: { label: '待完成', badge: 'yc-badge-warn' },
    INTRA_PENDING: { label: '待审批', badge: 'yc-badge-doing' },
    INTRA_APPROVED: { label: '已通过', badge: 'yc-badge-ok' },
    INTRA_REJECTED: { label: '已驳回', badge: 'yc-badge-danger' },
    INTRA_TERMINATED: { label: '已终止', badge: 'yc-badge-danger' }
  };

  var EVAL_STATUS = {
    EVAL_BLOCKED: { label: '专业内未完成', badge: 'yc-badge-mute' },
    EVAL_PENDING: { label: '待评估', badge: 'yc-badge-warn' },
    EVAL_DONE: { label: '已完成', badge: 'yc-badge-ok' },
    EVAL_TERMINATED: { label: '已终止', badge: 'yc-badge-danger' }
  };

  var ACTION_LABEL = {
    SUBMIT: '提交',
    RESUBMIT: '修改后重提',
    CONFIRM_K2: '确认 K2',
    CONFIRM_K3: '确认 K3',
    REJECT: '驳回',
    APPROVE: '审批通过',
    EVALUATE: '提交评估',
    TERMINATE: '终止'
  };

  /* ==========================================================================
   * 四、工具函数
   * ========================================================================== */

  function round2(n) { return Math.round((n + Number.EPSILON) * 100) / 100; }
  function round4(n) { return Math.round((n + Number.EPSILON) * 10000) / 10000; }

  function formatAmount(n) {
    if (n === null || n === undefined || isNaN(n)) return '—';
    var parts = round2(n).toFixed(2).split('.');
    return parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',') + '.' + parts[1];
  }

  /** 万分比整数 -> 百分比字符串 */
  function formatRatio(r) {
    if (r === null || r === undefined) return '—';
    return (r / 100).toFixed(2) + '%';
  }

  function formatCoef(n) {
    if (n === null || n === undefined || isNaN(n)) return '—';
    return Number(n).toFixed(2);
  }

  /** 绩效系数 K2 / K3 固定四位小数 */
  function formatKCoef(n) {
    if (n === null || n === undefined || isNaN(n)) return '—';
    return round4(n).toFixed(4);
  }

  /** 从单据编号解析年份，如 YCJX-2026-001 */
  function sheetYear(sheetNo) {
    var m = String(sheetNo || '').match(/-(\d{4})-/);
    return m ? Number(m[1]) : null;
  }

  function uniqueProjectCount(rows) {
    var seen = {};
    var n = 0;
    (rows || []).forEach(function (r) {
      var key = r.projectId || r.projectCode;
      if (!key || seen[key]) return;
      seen[key] = true;
      n += 1;
    });
    return n;
  }

  /** 金额按项目构成：不超过 5 个全画；超过 5 个则 Top5 + 其他 */
  function amountComposeByProject(rows, amountKey) {
    var map = {};
    (rows || []).forEach(function (r) {
      var code = r.projectCode || '—';
      var amt = r[amountKey];
      if (amt === null || amt === undefined || isNaN(amt)) return;
      if (!map[code]) map[code] = { name: code + ' ' + (r.projectName || ''), value: 0 };
      map[code].value += Number(amt);
    });
    var list = Object.keys(map).map(function (k) {
      return { name: map[k].name, value: round2(map[k].value) };
    }).sort(function (a, b) { return b.value - a.value; });
    if (list.length <= 5) return list;
    var top = list.slice(0, 5);
    var rest = list.slice(5).reduce(function (a, x) { return a + x.value; }, 0);
    top.push({ name: '其他', value: round2(rest) });
    return top;
  }

  /** 综合评分系数始终三位小数（§3.6） */
  function formatComposite(n) {
    if (n === null || n === undefined || isNaN(n)) return '—';
    return Number(n).toFixed(3);
  }

  /** 百分比输入（可两位小数）-> 万分比整数 */
  function pctToRatio(pct) {
    var v = Number(pct);
    if (isNaN(v)) return 0;
    return Math.round(v * 100);
  }

  function ratioToPct(r) { return Math.round(r) / 100; }

  function nowStamp() {
    var d = new Date();
    function p(n) { return String(n).padStart(2, '0'); }
    return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate()) + ' ' + p(d.getHours()) + ':' + p(d.getMinutes());
  }

  function userName(id) { return (USER_MAP[id] && USER_MAP[id].name) || '—'; }
  function disciplineName(id) { return (DISCIPLINE_MAP[id] && DISCIPLINE_MAP[id].name) || '—'; }

  function uid(prefix) { return prefix + '_' + Math.random().toString(36).slice(2, 9); }

  function deepClone(o) { return JSON.parse(JSON.stringify(o)); }

  /**
   * 逐级取整：把一组精确值四舍五入到分，并保证合计等于「精确合计四舍五入」的结果。
   * 尾差补到最后一个非零行（§3.6）。返回 { values: [], adjustIndex, adjust }
   */
  function distribute(exactValues) {
    var rounded = exactValues.map(round2);
    var target = round2(exactValues.reduce(function (a, b) { return a + b; }, 0));
    var sum = round2(rounded.reduce(function (a, b) { return a + b; }, 0));
    var diff = round2(target - sum);
    var idx = -1;
    for (var i = rounded.length - 1; i >= 0; i--) {
      if (exactValues[i] > 0) { idx = i; break; }
    }
    if (diff !== 0 && idx >= 0) rounded[idx] = round2(rounded[idx] + diff);
    return { values: rounded, adjustIndex: diff === 0 ? -1 : idx, adjust: diff };
  }

  /** 任务书 -> 按单元全列（一行一个工作包） */
  function taskBookUnitRows(projectId) {
    var tb = TASK_BOOK_BY_PROJECT[projectId];
    if (!tb) return [];
    return tb.workPackages.map(function (wp) {
      return {
        unitId: wp.id,
        unitName: wp.name,
        disciplineId: wp.disciplineId,
        leadUserId: wp.leadUserId
      };
    });
  }

  /** 从任务书快照一条专业间比例行 */
  function unitLineFromBook(projectId, unitId, ratio) {
    var rows = taskBookUnitRows(projectId);
    var t = rows.filter(function (r) { return r.unitId === unitId; })[0];
    if (!t) throw new Error('unit not in task book: ' + projectId + '/' + unitId);
    return {
      unitId: t.unitId,
      unitName: t.unitName,
      disciplineId: t.disciplineId,
      leadUserId: t.leadUserId,
      ratio: ratio
    };
  }

  /** 专业内可选工程师：当前项目 + 当前单元 + 当前专业下全量历史派工、去重、剔离职 */
  function dispatchedEngineers(projectId, unitId, disciplineId) {
    var seen = {};
    var out = [];
    DISPATCHES.forEach(function (d) {
      if (d.projectId !== projectId || d.unitId !== unitId || d.disciplineId !== disciplineId) return;
      if (seen[d.engineerUserId]) return;
      var u = USER_MAP[d.engineerUserId];
      if (!u || u.status !== 'active') return;
      seen[d.engineerUserId] = true;
      out.push(d.engineerUserId);
    });
    return out.sort(function (a, b) {
      return (USER_MAP[a].namePinyin || '').localeCompare(USER_MAP[b].namePinyin || '');
    });
  }

  function personLabel(userId) {
    var u = USER_MAP[userId];
    if (!u) return '—';
    return u.name + '(' + (u.empNo || '—') + ')';
  }

  function addHourNull(a, b) {
    if (b === null || b === undefined) return (a === null || a === undefined) ? null : a;
    if (a === null || a === undefined) return b;
    return a + b;
  }

  /** 上报 | 派发；空为 -；总计行一位小数 */
  function formatHourPair(report, dispatch, withDecimal) {
    function one(v) {
      if (v === null || v === undefined) return '-';
      return withDecimal ? Number(v).toFixed(1) : String(v);
    }
    return one(report) + ' | ' + one(dispatch);
  }

  /** 进度条占比：派发为 0 时有上报则满格；上报超过派发按 100% 封顶（数值仍如实展示） */
  function hourProgressPct(report, dispatch) {
    var r = Number(report) || 0;
    var d = Number(dispatch) || 0;
    if (d <= 0) return r > 0 ? 100 : 0;
    return Math.min(100, (r / d) * 100);
  }

  /** 聚合当前单元当前专业工时派发明细表 */
  function buildHourDispatchDetail(projectId, unitId, disciplineId) {
    var lines = HOUR_DISPATCH_LINES.filter(function (l) {
      return l.projectId === projectId && l.unitId === unitId && l.disciplineId === disciplineId;
    });
    var monthSet = {};
    lines.forEach(function (l) { monthSet[l.month] = true; });
    var months = Object.keys(monthSet).sort();
    var ROLE_ORDER = { '设计': 1, '校核': 2, '审核': 3 };
    var map = {};
    lines.forEach(function (l) {
      var key = l.engineerUserId + '|' + l.role;
      if (!map[key]) {
        map[key] = {
          engineerUserId: l.engineerUserId,
          role: l.role,
          personLabel: personLabel(l.engineerUserId),
          cells: {},
          totalReport: null,
          totalDispatch: null,
          isTotal: false
        };
      }
      var cell = map[key].cells[l.month] || { report: null, dispatch: null };
      cell.report = addHourNull(cell.report, l.reportHours);
      cell.dispatch = addHourNull(cell.dispatch, l.dispatchHours);
      map[key].cells[l.month] = cell;
    });
    var rows = Object.keys(map).map(function (k) { return map[k]; });
    rows.forEach(function (row) {
      months.forEach(function (m) {
        var c = row.cells[m] || { report: null, dispatch: null };
        row.totalReport = addHourNull(row.totalReport, c.report);
        row.totalDispatch = addHourNull(row.totalDispatch, c.dispatch);
      });
      row.progressPct = hourProgressPct(row.totalReport, row.totalDispatch);
    });
    rows.sort(function (a, b) {
      var pa = (USER_MAP[a.engineerUserId] && USER_MAP[a.engineerUserId].namePinyin) || '';
      var pb = (USER_MAP[b.engineerUserId] && USER_MAP[b.engineerUserId].namePinyin) || '';
      if (pa !== pb) return pa.localeCompare(pb);
      return (ROLE_ORDER[a.role] || 9) - (ROLE_ORDER[b.role] || 9);
    });

    var totals = {
      personLabel: '总计',
      role: '',
      cells: {},
      totalReport: null,
      totalDispatch: null,
      progressPct: 0,
      isTotal: true
    };
    months.forEach(function (m) {
      totals.cells[m] = { report: null, dispatch: null };
    });
    rows.forEach(function (row) {
      months.forEach(function (m) {
        var c = row.cells[m] || { report: null, dispatch: null };
        totals.cells[m].report = addHourNull(totals.cells[m].report, c.report);
        totals.cells[m].dispatch = addHourNull(totals.cells[m].dispatch, c.dispatch);
      });
      totals.totalReport = addHourNull(totals.totalReport, row.totalReport);
      totals.totalDispatch = addHourNull(totals.totalDispatch, row.totalDispatch);
    });
    totals.progressPct = hourProgressPct(totals.totalReport, totals.totalDispatch);

    return { months: months, rows: rows.concat(rows.length ? [totals] : []) };
  }

  function splitStamp(at) {
    var s = at || '';
    var parts = s.split(' ');
    return {
      date: (parts[0] || '').replace(/-/g, '/'),
      time: parts[1] || ''
    };
  }

  function log(sheet, action, operatorId, value, comment) {
    sheet.logs = sheet.logs || [];
    sheet.logs.push({
      action: action,
      operatorId: operatorId,
      operatorName: userName(operatorId),
      value: value === undefined ? null : value,
      comment: comment || null,
      at: nowStamp()
    });
  }

  /* ==========================================================================
   * 五、演示种子数据（§9）
   * ========================================================================== */

  function seedState() {
    var cfg = defaultConfig();
    var inter = [];
    var intra = [];
    var evals = [];
    var seq = 1;

    function sheetNo(prefix) { return prefix + '-2026-' + String(seq++).padStart(3, '0'); }

    function makeInter(projectId, k1, lines, status, extra) {
      var p = PROJECT_MAP[projectId];
      var s = {
        id: uid('inter'),
        sheetNo: sheetNo('YCJX'),
        projectId: projectId,
        contractAmountExclTax: p.contractAmountExclTax,
        k1: k1,
        k2: cfg.k2.default,
        k3: cfg.k3.default,
        k2ReviewerId: cfg.k2ReviewerId,
        k3ReviewerId: cfg.k3ReviewerId,
        k2Default: cfg.k2.default,
        k3Default: cfg.k3.default,
        k2ConfirmedBy: null, k2ConfirmedAt: null,
        k3ConfirmedBy: null, k3ConfirmedAt: null,
        k2Status: 'pending', k3Status: 'pending',
        rejectReason: null, rejectedBy: null, rejectedAt: null,
        status: status,
        remark: '',
        lines: lines,
        logs: [],
        updatedAt: nowStamp()
      };
      Object.assign(s, extra || {});
      log(s, 'SUBMIT', p.managerUserId, 'K1 ' + formatRatio(k1));
      inter.push(s);
      return s;
    }

    function makeIntra(interSheet, unitId, personRatios, status, extra) {
      var line = interSheet.lines.filter(function (l) { return l.unitId === unitId; })[0];
      if (!line) throw new Error('inter line missing unit ' + unitId);
      var s = {
        id: uid('intra'),
        sheetNo: sheetNo('YCZN'),
        projectId: interSheet.projectId,
        disciplineId: line.disciplineId,
        unitId: line.unitId,
        unitName: line.unitName,
        interId: interSheet.id,
        leadUserId: line.leadUserId,
        status: status,
        candidateUserIds: dispatchedEngineers(interSheet.projectId, line.unitId, line.disciplineId),
        lines: personRatios.map(function (pr) {
          return { userId: pr[0], ratio: pr[1], sortKey: USER_MAP[pr[0]].namePinyin };
        }),
        review: { directorUserId: DISCIPLINE_MAP[line.disciplineId].directorUserId, comment: null, at: null },
        logs: [],
        updatedAt: nowStamp()
      };
      Object.assign(s, extra || {});
      if (status !== 'INTRA_DRAFT') log(s, 'SUBMIT', line.leadUserId, '比例合计 100.00%');
      if (status === 'INTRA_APPROVED') {
        s.review.at = nowStamp();
        log(s, 'APPROVE', s.review.directorUserId);
      }
      intra.push(s);
      return s;
    }

    function makeEvalDone(interSheet) {
      var lines = [];
      intra.forEach(function (ins) {
        if (ins.interId !== interSheet.id || ins.status !== 'INTRA_APPROVED') return;
        ins.lines.forEach(function (pl) {
          if (pl.ratio <= 0) return;
          var q = cfg.quality.options.filter(function (o) { return o.id === cfg.quality.defaultOptionId; })[0];
          var prg = cfg.progress.options.filter(function (o) { return o.id === cfg.progress.defaultOptionId; })[0];
          var rs = cfg.response.options.filter(function (o) { return o.id === cfg.response.defaultOptionId; })[0];
          lines.push({
            userId: pl.userId,
            disciplineId: ins.disciplineId,
            unitId: ins.unitId,
            qualityOptionId: q.id, qualityLabel: q.label, qualityCoef: q.coef,
            progressOptionId: prg.id, progressLabel: prg.label, progressCoef: prg.coef,
            responseOptionId: rs.id, responseLabel: rs.label, responseCoef: rs.coef,
            composite: round3(q.coef * cfg.quality.weight + prg.coef * cfg.progress.weight + rs.coef * cfg.response.weight)
          });
        });
      });
      var ev = {
        id: uid('eval'),
        sheetNo: sheetNo('YCPG'),
        projectId: interSheet.projectId,
        interId: interSheet.id,
        status: 'EVAL_DONE',
        lines: lines,
        weightsAtSubmit: { quality: cfg.quality.weight, progress: cfg.progress.weight, response: cfg.response.weight },
        logs: [],
        updatedAt: nowStamp()
      };
      log(ev, 'EVALUATE', PROJECT_MAP[interSheet.projectId].managerUserId, lines.length + ' 人');
      evals.push(ev);
      return ev;
    }

    // 历史：p018 已锁定（双管道单元同负责人 + 工艺；电气 0% 不出账）
    var h018 = makeInter('p018', 180, [
      unitLineFromBook('p018', 'WP1', 2500),
      unitLineFromBook('p018', 'WP4', 1500),
      unitLineFromBook('p018', 'WP2', 6000),
      unitLineFromBook('p018', 'WP3', 0)
    ], 'INTER_APPROVED', {
      remark: '首轮按单元拆分：主装置管道 25%、公用工程管道 15%、工艺 60%。',
      k2Status: 'confirmed', k3Status: 'confirmed',
      k2ConfirmedBy: cfg.k2ReviewerId, k2ConfirmedAt: nowStamp(),
      k3ConfirmedBy: cfg.k3ReviewerId, k3ConfirmedAt: nowStamp()
    });
    log(h018, 'CONFIRM_K2', cfg.k2ReviewerId, 'K2 = 1.0000');
    log(h018, 'CONFIRM_K3', cfg.k3ReviewerId, 'K3 = 1.0000');
    makeIntra(h018, 'WP1', [['u_machao', 5000], ['u_liuyang', 5000]], 'INTRA_APPROVED');
    makeIntra(h018, 'WP4', [['u_machao', 10000]], 'INTRA_APPROVED');
    makeIntra(h018, 'WP2', [['u_chenli', 5000], ['u_wuqian', 5000]], 'INTRA_APPROVED');
    makeEvalDone(h018);

    // 单据 1：p018 专业间待 K2/K3（四单元全列，电气 0%）
    makeInter('p018', 200, [
      unitLineFromBook('p018', 'WP1', 2500),
      unitLineFromBook('p018', 'WP4', 1500),
      unitLineFromBook('p018', 'WP2', 6000),
      unitLineFromBook('p018', 'WP3', 0)
    ], 'INTER_PENDING', {
      remark: '新材料装置第二轮派发（按单元）。'
    });

    // 单据 2：p021 专业间已通过；管道单元已通过，工艺单元待室主任审
    var s2 = makeInter('p021', 250, [
      unitLineFromBook('p021', 'WP1', 4500),
      unitLineFromBook('p021', 'WP2', 5500)
    ], 'INTER_APPROVED', {
      remark: '空分装置改造按单元派发。',
      k2Status: 'confirmed', k3Status: 'confirmed',
      k2ConfirmedBy: cfg.k2ReviewerId, k2ConfirmedAt: nowStamp(),
      k3ConfirmedBy: cfg.k3ReviewerId, k3ConfirmedAt: nowStamp()
    });
    log(s2, 'CONFIRM_K2', cfg.k2ReviewerId, 'K2 = 1.0000');
    log(s2, 'CONFIRM_K3', cfg.k3ReviewerId, 'K3 = 1.0000');
    makeIntra(s2, 'WP1', [['u_machao', 6000], ['u_liuyang', 4000]], 'INTRA_APPROVED');
    makeIntra(s2, 'WP2', [['u_chenli', 5000], ['u_wuqian', 5000]], 'INTRA_PENDING');

    // 单据 3：p022 两单元都已通过、评估未提交
    var s3 = makeInter('p022', 200, [
      unitLineFromBook('p022', 'WP1', 4000),
      unitLineFromBook('p022', 'WP2', 6000)
    ], 'INTER_APPROVED', {
      k2Status: 'confirmed', k3Status: 'confirmed',
      k2ConfirmedBy: cfg.k2ReviewerId, k2ConfirmedAt: nowStamp(),
      k3ConfirmedBy: cfg.k3ReviewerId, k3ConfirmedAt: nowStamp()
    });
    log(s3, 'CONFIRM_K2', cfg.k2ReviewerId, 'K2 = 1.0000');
    log(s3, 'CONFIRM_K3', cfg.k3ReviewerId, 'K3 = 1.0000');
    makeIntra(s3, 'WP1', [['u_machao', 5000], ['u_liuyang', 5000]], 'INTRA_APPROVED');
    makeIntra(s3, 'WP2', [['u_chenli', 6000], ['u_wuqian', 4000]], 'INTRA_APPROVED');

    // 单据 4：p023 专业间已驳回待改
    var s4 = makeInter('p023', 180, [
      unitLineFromBook('p023', 'WP1', 5000),
      unitLineFromBook('p023', 'WP2', 5000),
      unitLineFromBook('p023', 'WP3', 0)
    ], 'INTER_REJECTED', {
      rejectReason: 'K1 提取比例偏低，且储运电气未分配，请与专业室确认后重提。',
      rejectedBy: cfg.k3ReviewerId,
      rejectedAt: nowStamp()
    });
    log(s4, 'REJECT', cfg.k3ReviewerId, null, s4.rejectReason);

    // 历史：p024 已锁定（双管道不同负责人 + 工艺；无进行中单，便于新建演示）
    var h024 = makeInter('p024', 200, [
      unitLineFromBook('p024', 'WP1', 3000),
      unitLineFromBook('p024', 'WP5', 2000),
      unitLineFromBook('p024', 'WP2', 5000)
    ], 'INTER_APPROVED', {
      remark: '循环水按单元：循环水管道孙强 30%、冷却塔管道钱进 20%、工艺 50%。',
      k2Status: 'confirmed', k3Status: 'confirmed',
      k2ConfirmedBy: cfg.k2ReviewerId, k2ConfirmedAt: nowStamp(),
      k3ConfirmedBy: cfg.k3ReviewerId, k3ConfirmedAt: nowStamp()
    });
    log(h024, 'CONFIRM_K2', cfg.k2ReviewerId, 'K2 = 1.0000');
    log(h024, 'CONFIRM_K3', cfg.k3ReviewerId, 'K3 = 1.0000');
    makeIntra(h024, 'WP1', [['u_machao', 10000]], 'INTRA_APPROVED');
    makeIntra(h024, 'WP5', [['u_liuyang', 5000], ['u_fenghao', 5000]], 'INTRA_APPROVED');
    makeIntra(h024, 'WP2', [['u_chenli', 10000]], 'INTRA_APPROVED');
    makeEvalDone(h024);

    // 单据 5：p020 专业间已通过，专业内草稿
    var s5 = makeInter('p020', 180, [
      unitLineFromBook('p020', 'WP1', 7000),
      unitLineFromBook('p020', 'WP2', 3000)
    ], 'INTER_APPROVED', {
      remark: '热电联产配套节点绩效。',
      k2Status: 'confirmed', k3Status: 'confirmed',
      k2ConfirmedBy: cfg.k2ReviewerId, k2ConfirmedAt: nowStamp(),
      k3ConfirmedBy: cfg.k3ReviewerId, k3ConfirmedAt: nowStamp()
    });
    log(s5, 'CONFIRM_K2', cfg.k2ReviewerId, 'K2 = 1.0000');
    log(s5, 'CONFIRM_K3', cfg.k3ReviewerId, 'K3 = 1.0000');
    makeIntra(s5, 'WP1', [], 'INTRA_DRAFT');
    makeIntra(s5, 'WP2', [], 'INTRA_DRAFT');

    return { config: cfg, interSheets: inter, intraSheets: intra, evaluations: evals };
  }

  /* ==========================================================================
   * 六、持久化
   * ========================================================================== */

  function loadState() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return seedState();
      var s = JSON.parse(raw);
      if (!s || !s.config || !s.interSheets) return seedState();
      return s;
    } catch (e) {
      return seedState();
    }
  }

  function saveState(state) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      /* 演示环境忽略写入失败 */
    }
  }

  /* ==========================================================================
   * 七、身份定义
   * ========================================================================== */

  var ROLE_GROUPS = [
    {
      label: '发起与评估',
      options: [
        { key: 'PM:u_wanglei', name: '项目经理 · 王磊' },
        { key: 'PM:u_liqiang', name: '项目经理 · 李强' }
      ]
    },
    {
      label: '专业间审核',
      options: [{ key: 'K2', name: 'K2 审核人' }, { key: 'K3', name: 'K3 审核人' }]
    },
    {
      label: '专业负责人',
      options: [
        { key: 'LEAD:u_sunqiang', name: '专业负责人 · 设计-设计-管道 孙强' },
        { key: 'LEAD:u_zhaomin', name: '专业负责人 · 设计-设计-工艺 赵敏' },
        { key: 'LEAD:u_zhoufang', name: '专业负责人 · 设计-设计-电气 周芳' },
        { key: 'LEAD:u_qianjin', name: '专业负责人 · 设计-设计-管道 钱进' }
      ]
    },
    {
      label: '专业室主任',
      options: [
        { key: 'DIRECTOR:u_huangbin', name: '专业室主任 · 设计-设计-管道 黄斌' },
        { key: 'DIRECTOR:u_litao', name: '专业室主任 · 设计-设计-工艺 李涛' },
        { key: 'DIRECTOR:u_hanxue', name: '专业室主任 · 设计-设计-电气 韩雪' }
      ]
    },
    {
      label: '工程师',
      options: [
        { key: 'ENGINEER:u_machao', name: '工程师 · 马超' },
        { key: 'ENGINEER:u_liuyang', name: '工程师 · 刘洋' },
        { key: 'ENGINEER:u_fenghao', name: '工程师 · 冯浩' },
        { key: 'ENGINEER:u_chenli', name: '工程师 · 陈立' },
        { key: 'ENGINEER:u_wuqian', name: '工程师 · 吴倩' }
      ]
    },
    {
      label: '配置',
      options: [{ key: 'ADMIN', name: '系统配置' }]
    }
  ];

  /* ==========================================================================
   * 八、Vue 应用
   * ========================================================================== */

  var state = loadState();


  Vue.component('yc-formula-page', {
    template: '#yc-tpl-formula'
  });

  new Vue({
    el: '#app',
    data: function () {
      return {
        state: state,
        roleGroups: ROLE_GROUPS,
        currentRole: 'PM:u_wanglei',
        activeTab: 'inter',
        interView: 'list',
        intraView: 'list',
        queryProjectView: 'list',
        queryPersonView: 'list',
        queryProjectReturnView: 'list',
        queryPersonReturnView: 'list',
        interScope: 'all',
        intraScope: 'all',
        evalScope: 'all',

        users: USERS,
        disciplines: DISCIPLINES,
        projects: PROJECTS,

        interStatusDict: INTER_STATUS,
        intraStatusDict: INTRA_STATUS,
        evalStatusDict: EVAL_STATUS,

        // 专业间：筛选（草稿态） / 查询（已生效）
        interFilter: { projectId: '', status: '', keyword: '' },
        interQuery: { projectId: '', status: '', keyword: '' },
        interPage: 1,
        interPageSize: 10,

        intraFilter: { projectId: '', disciplineId: '', status: '' },
        intraQuery: { projectId: '', disciplineId: '', status: '' },
        intraPage: 1,
        intraPageSize: 10,

        queryProjectFilter: { projectId: '', status: '', keyword: '' },
        queryProjectQuery: { projectId: '', status: '', keyword: '' },
        queryProjectPage: 1,
        queryProjectPageSize: 10,
        queryPersonFilter: { projectId: '', disciplineId: '', status: '', keyword: '' },
        queryPersonQuery: { projectId: '', disciplineId: '', status: '', keyword: '' },
        queryPersonPage: 1,
        queryPersonPageSize: 10,

        // 专业间编辑弹窗
        interEdit: { visible: false, saving: false, isNew: true, id: null, projectId: '', k1Pct: null, remark: '', rows: [], errors: {}, dirty: false },
        // 专业间审核弹窗
        interReview: { visible: false, saving: false, sheet: null, field: null, value: null, error: '' },
        // 驳回弹窗（二次确认 + 原因必填）
        rejectBox: { visible: false, saving: false, kind: '', sheetId: null, reason: '', error: '' },
        // 工时派发详情弹窗（专业内填写参考）
        hourDispatchBox: { visible: false, months: [], rows: [] },
        // 专业内编辑弹窗
        intraEdit: { visible: false, saving: false, id: null, rows: [], dirty: false },
        // 专业内审批弹窗
        intraReview: { visible: false, saving: false, sheet: null },
        // 查看详情弹窗
        formulaBox: { visible: false, title: '', rows: [], logs: [], splits: [], people: null, queryPeople: null, interId: '', projectId: '', projectCode: '', projectName: '', managerName: '', remark: '', showHistory: false },
        historyEditPage: 1,
        historyFormulaPage: 1,
        historyPageSize: 10,
        formulaPeoplePage: 1,
        // 绩效查询统计下探
        statsBox: {
          visible: false,
          kind: 'project',
          key: '',
          title: '',
          tip: '',
          mainText: '',
          secondaryText: '',
          showChart: false,
          chartData: [],
          rows: [],
          page: 1
        },
        // 评估：先项目列表，点进去评人
        evalView: 'list',
        evalProjectId: '',
        evalFilter: { projectId: '', status: '', keyword: '' },
        evalQuery: { projectId: '', status: '', keyword: '' },
        evalPage: 1,
        evalPageSize: 10,
        evalDraft: {},
        evalSaving: false,
        // 规则配置
        configForm: null,
        configSaving: false,
        showDemoReset: true
      };
    },

    computed: {
      /* ---------- 身份 ---------- */
      currentUserId: function () {
        var r = this.currentRole;
        if (r === 'PM' || r === 'PM:u_wanglei') return 'u_wanglei';
        if (r === 'K2') return this.state.config.k2ReviewerId;   // 展示与入口跟当前配置（§5.0）
        if (r === 'K3') return this.state.config.k3ReviewerId;
        if (r === 'ADMIN') return 'u_admin';
        return r.split(':')[1] || '';
      },
      currentUserName: function () { return userName(this.currentUserId); },
      roleKind: function () { return this.currentRole.split(':')[0]; },
      isPM: function () { return this.roleKind === 'PM'; },
      isAdmin: function () { return this.roleKind === 'ADMIN'; },
      isLead: function () { return this.roleKind === 'LEAD'; },
      isDirector: function () { return this.roleKind === 'DIRECTOR'; },
      isEngineer: function () { return this.roleKind === 'ENGINEER'; },

      currentRoleLabel: function () {
        var r = this.currentRole;
        if (r === 'K2') return 'K2 审核人 · ' + userName(this.state.config.k2ReviewerId);
        if (r === 'K3') return 'K3 审核人 · ' + userName(this.state.config.k3ReviewerId);
        var found = null;
        this.roleGroups.forEach(function (g) {
          g.options.forEach(function (o) { if (o.key === r) found = o.name; });
        });
        return found || r;
      },

      /** 筛选下拉：项目经理只见自己的项目；系统配置见全部 */
      visibleProjects: function () {
        var self = this;
        if (this.isAdmin || this.roleKind === 'K2' || this.roleKind === 'K3') return this.projects;
        if (this.isPM) {
          return this.projects.filter(function (p) { return p.managerUserId === self.currentUserId; });
        }
        return this.projects;
      },

      /* ---------- 派生：每张专业间单的计算结果 ---------- */
      computedInterSheets: function () {
        var self = this;
        return this.state.interSheets.map(function (s) { return self.buildInterView(s); });
      },

      interSheetById: function () {
        var m = {};
        this.computedInterSheets.forEach(function (v) { m[v.id] = v; });
        return m;
      },

      /* ---------- 专业间列表 ---------- */
      matchedInterSheets: function () {
        var q = this.interQuery;
        var self = this;
        return this.computedInterSheets.filter(function (v) {
          if (!self.interSheetVisible(v)) return false;
          if (q.projectId && v.projectId !== q.projectId) return false;
          if (q.status && v.status !== q.status) return false;
          if (q.keyword) {
            var k = q.keyword.trim().toLowerCase();
            var hay = (v.sheetNo + ' ' + v.projectCode + ' ' + v.projectName).toLowerCase();
            if (hay.indexOf(k) === -1) return false;
          }
          return true;
        }).sort(function (a, b) {
          return self.compareTodoThenUpdatedAt(a, b, self.isInterTodo);
        });
      },
      filteredInterSheets: function () {
        var self = this;
        return this.matchedInterSheets.filter(function (v) { return self.interScope === 'all' || self.isInterTodo(v); });
      },
      pagedInterSheets: function () {
        var start = (this.interPage - 1) * this.interPageSize;
        return this.filteredInterSheets.slice(start, start + this.interPageSize);
      },

      /* ---------- 专业内列表 ---------- */
      computedIntraSheets: function () {
        var self = this;
        return this.state.intraSheets.map(function (s) { return self.buildIntraView(s); });
      },
      matchedIntraSheets: function () {
        var q = this.intraQuery;
        var self = this;
        return this.computedIntraSheets.filter(function (v) {
          if (q.projectId && v.projectId !== q.projectId) return false;
          if (q.disciplineId && v.disciplineId !== q.disciplineId) return false;
          if (q.status && v.status !== q.status) return false;
          // 专业负责人 / 室主任只看自己相关的单
          if (self.isLead && v.leadUserId !== self.currentUserId) return false;
          if (self.isDirector && v.directorUserId !== self.currentUserId) return false;
          // 项目经理可见本人项目下的全部专业内单
          if (self.isPM) {
            var p = PROJECT_MAP[v.projectId];
            if (!p || p.managerUserId !== self.currentUserId) return false;
          }
          return true;
        }).sort(function (a, b) {
          return self.compareTodoThenUpdatedAt(a, b, self.isIntraTodo);
        });
      },
      filteredIntraSheets: function () {
        var self = this;
        return this.matchedIntraSheets.filter(function (v) { return self.intraScope === 'all' || self.isIntraTodo(v); });
      },
      pagedIntraSheets: function () {
        var start = (this.intraPage - 1) * this.intraPageSize;
        return this.filteredIntraSheets.slice(start, start + this.intraPageSize);
      },

      /* ---------- 评估 ---------- */
      evalListStatusOptions: function () {
        return [
          { value: 'EVAL_PENDING', label: EVAL_STATUS.EVAL_PENDING.label },
          { value: 'EVAL_DONE', label: EVAL_STATUS.EVAL_DONE.label }
        ];
      },
      evaluableProjects: function () {
        var self = this;
        return this.computedInterSheets.filter(function (v) {
          return v.status === 'INTER_APPROVED'
            && PROJECT_MAP[v.projectId].managerUserId === self.currentUserId
            && (v.evalStatus === 'EVAL_PENDING' || v.evalStatus === 'EVAL_DONE');
        });
      },
      matchedEvalProjects: function () {
        var q = this.evalQuery;
        var self = this;
        return this.evaluableProjects.filter(function (v) {
          if (q.projectId && v.projectId !== q.projectId) return false;
          if (q.status && v.evalStatus !== q.status) return false;
          if (q.keyword) {
            var k = q.keyword.trim().toLowerCase();
            var hay = (v.sheetNo + ' ' + v.projectCode + ' ' + v.projectName).toLowerCase();
            if (hay.indexOf(k) === -1) return false;
          }
          return true;
        }).sort(function (a, b) {
          return self.compareTodoThenUpdatedAt(a, b, self.isEvalTodo);
        });
      },
      filteredEvalProjects: function () {
        var self = this;
        return this.matchedEvalProjects.filter(function (v) { return self.evalScope === 'all' || self.isEvalTodo(v); });
      },
      pagedEvalProjects: function () {
        var start = (this.evalPage - 1) * this.evalPageSize;
        return this.filteredEvalProjects.slice(start, start + this.evalPageSize);
      },
      currentEvalSheet: function () {
        var id = this.evalProjectId;
        if (!id) return null;
        return this.interSheetById[id] || null;
      },

      /* ---------- 绩效查询：项目 / 个人 ---------- */
      queryProjectStatusOptions: function () {
        return [
          { value: 'INTER_PENDING', label: '待审核' },
          { value: 'INTER_REJECTED', label: '已驳回' },
          { value: 'EVAL_BLOCKED', label: '专业内未完成' },
          { value: 'EVAL_PENDING', label: '待评估' },
          { value: 'LOCKED', label: '已完成' },
          { value: 'INTER_TERMINATED', label: '已终止' }
        ];
      },
      queryProjectRows: function () {
        var self = this;
        var q = this.queryProjectQuery;
        var rows = [];
        this.computedInterSheets.forEach(function (v) {
          if (v.status === 'INTER_DRAFT') return;
          var scope = self.queryScope(v);
          if (!scope.seeProject) return;
          if (q.projectId && v.projectId !== q.projectId) return;
          if (q.status && v.queryStatus !== q.status) return;
          if (q.keyword) {
            var k = q.keyword.trim().toLowerCase();
            if ((v.sheetNo + ' ' + v.projectCode + ' ' + v.projectName).toLowerCase().indexOf(k) === -1) return;
          }
          rows.push(self.buildQueryProjectRow(v));
        });
        return rows.sort(function (a, b) { return a.projectCode < b.projectCode ? 1 : -1; });
      },
      pagedQueryProjectRows: function () {
        var start = (this.queryProjectPage - 1) * this.queryProjectPageSize;
        return this.queryProjectRows.slice(start, start + this.queryProjectPageSize);
      },
      queryPersonRows: function () {
        var self = this;
        var q = this.queryPersonQuery;
        var rows = [];
        this.computedInterSheets.forEach(function (v) {
          if (v.status === 'INTER_DRAFT') return;
          var scope = self.queryScope(v);
          if (!scope.ok) return;
          if (q.projectId && v.projectId !== q.projectId) return;
          v.disciplines.forEach(function (d) {
            if (scope.disciplineIds && scope.disciplineIds.indexOf(d.disciplineId) === -1) return;
            if (q.disciplineId && d.disciplineId !== q.disciplineId) return;
            d.persons.forEach(function (p) {
              if (scope.personIds && scope.personIds.indexOf(p.userId) === -1) return;
              /* 已终止：仅保留曾锁定实发的个人行可查 */
              if (v.terminated && !p.locked) return;
              if (q.status === 'pending' && p.locked) return;
              if (q.status === 'locked' && !p.locked) return;
              if (q.keyword) {
                var k = q.keyword.trim();
                if (p.name.indexOf(k) === -1) return;
              }
              rows.push({
                rowKey: v.id + '_' + d.disciplineId + '_' + p.userId,
                projectCode: v.projectCode,
                projectName: v.projectName,
                sheetNo: v.sheetNo,
                disciplineId: d.disciplineId,
                disciplineName: d.name,
                name: p.name,
                sortKey: p.sortKey || p.name,
                allocAmount: p.preEvalAmount,
                qualityCoef: p.evaluated && p.evalLine ? p.evalLine.qualityCoef : null,
                progressCoef: p.evaluated && p.evalLine ? p.evalLine.progressCoef : null,
                responseCoef: p.evaluated && p.evalLine ? p.evalLine.responseCoef : null,
                actualAmount: p.locked ? p.amount : null,
                locked: p.locked,
                terminated: !!v.terminated,
                ctx: { kind: 'person', interId: v.id, disciplineId: d.disciplineId, userId: p.userId, fromQuery: true }
          });
        });
          });
        });
        return rows.sort(function (a, b) {
          if (a.projectCode !== b.projectCode) return a.projectCode < b.projectCode ? 1 : -1;
          if (a.disciplineName !== b.disciplineName) return a.disciplineName < b.disciplineName ? -1 : 1;
          return a.sortKey < b.sortKey ? -1 : 1;
        });
      },
      pagedQueryPersonRows: function () {
        var start = (this.queryPersonPage - 1) * this.queryPersonPageSize;
        return this.queryPersonRows.slice(start, start + this.queryPersonPageSize);
      },
      pagedFormulaQueryPeople: function () {
        var list = (this.formulaBox && this.formulaBox.queryPeople) || [];
        var start = (this.formulaPeoplePage - 1) * 10;
        return list.slice(start, start + 10);
      },

      /* ---------- 绩效查询 KPI（身份可见全量，不受筛选影响） ---------- */
      queryStatsYear: function () { return 2026; },
      queryProjectBaseRows: function () {
        var self = this;
        var year = this.queryStatsYear;
        var rows = [];
          this.computedInterSheets.forEach(function (v) {
          if (v.status === 'INTER_DRAFT') return;
          if (sheetYear(v.sheetNo) !== year) return;
          var scope = self.queryScope(v);
          if (!scope.seeProject) return;
          var row = self.buildQueryProjectRow(v);
          row.evalStatus = v.evalStatus;
          row.amountDone = v.evalStatus === 'EVAL_DONE' ? v.allocatedTotal : null;
          row.amountPending = v.evalStatus === 'EVAL_PENDING' ? v.pool : null;
          rows.push(row);
        });
        return rows;
      },
      queryPersonBaseRows: function () {
        var self = this;
        var year = this.queryStatsYear;
        var rows = [];
        this.computedInterSheets.forEach(function (v) {
          if (v.status === 'INTER_DRAFT') return;
          if (sheetYear(v.sheetNo) !== year) return;
          var scope = self.queryScope(v);
          if (!scope.ok) return;
          v.disciplines.forEach(function (d) {
            if (scope.disciplineIds && scope.disciplineIds.indexOf(d.disciplineId) === -1) return;
            d.persons.forEach(function (p) {
              if (scope.personIds && scope.personIds.indexOf(p.userId) === -1) return;
              if (v.terminated && !p.locked) return;
              var detail = self.buildQueryPersonDetail(d, p);
              rows.push({
                sheetNo: v.sheetNo,
                projectId: v.projectId,
                projectCode: v.projectCode,
                projectName: v.projectName,
                disciplineId: d.disciplineId,
                disciplineName: d.name,
                name: detail.name,
                locked: !!p.locked,
                terminated: !!v.terminated,
                allocAmount: detail.allocAmount,
                actualAmount: detail.actualAmount,
                amount: p.locked ? detail.actualAmount : detail.allocAmount,
                ctx: { kind: 'person', interId: v.id, disciplineId: d.disciplineId, userId: p.userId, fromQuery: true }
              });
            });
          });
        });
        return rows;
      },
      queryProjectKpis: function () {
        var tipExclude = '已终止单据不计入本统计。';
        var rows = this.queryProjectBaseRows.filter(function (r) { return !r.terminated; });
        var done = rows.filter(function (r) { return r.evalStatus === 'EVAL_DONE'; });
        var pending = rows.filter(function (r) { return r.evalStatus === 'EVAL_PENDING'; });
        var doneAmt = done.reduce(function (a, r) { return a + (r.amountDone || 0); }, 0);
        var pendingAmt = pending.reduce(function (a, r) { return a + (r.amountPending || 0); }, 0);
        return [
          {
            key: 'projDoneAmt',
            kind: 'project',
            title: '当年已完成实发合计（元）',
            tip: '当年已完成的实发金额合计。' + tipExclude,
            mainText: formatAmount(doneAmt),
            secondaryText: '',
            showChart: true,
            rows: done.map(function (r) {
              return Object.assign({}, r, { amount: r.amountDone });
            }),
            chartRows: done,
            chartAmountKey: 'amountDone'
          },
          {
            key: 'projPendingAmt',
            kind: 'project',
            title: '当年进行中预估合计（元）',
            tip: '状态为待评估、待审核、已驳回的预估分配金额合计。' + tipExclude,
            mainText: formatAmount(pendingAmt),
            secondaryText: '',
            showChart: true,
            rows: pending.map(function (r) {
              return Object.assign({}, r, { amount: r.amountPending });
            }),
            chartRows: pending,
            chartAmountKey: 'amountPending'
          },
          {
            key: 'projDoneCount',
            kind: 'project',
            title: '当年已完成绩效评估',
            tip: '当年已完成评估的数量。' + tipExclude,
            mainText: String(done.length),
            secondaryText: '项目数 ' + uniqueProjectCount(done),
            showChart: false,
            rows: done.map(function (r) {
              return Object.assign({}, r, { amount: r.amountDone });
            })
          },
          {
            key: 'projPendingCount',
            kind: 'project',
            title: '进行中绩效评估',
            tip: '状态为待评估、待审核、已驳回的数量。' + tipExclude,
            mainText: String(pending.length),
            secondaryText: '项目数 ' + uniqueProjectCount(pending),
            showChart: false,
            rows: pending.map(function (r) {
              return Object.assign({}, r, { amount: r.amountPending });
            })
          }
        ];
      },
      queryPersonKpis: function () {
        var tipExclude = '已终止的不计入。';
        var rows = this.queryPersonBaseRows.filter(function (r) { return !r.terminated; });
        var done = rows.filter(function (r) { return r.locked; });
        var pending = rows.filter(function (r) { return !r.locked; });
        var doneAmt = done.reduce(function (a, r) { return a + (r.actualAmount || 0); }, 0);
        var pendingAmt = pending.reduce(function (a, r) { return a + (r.allocAmount || 0); }, 0);
        return [
          {
            key: 'personDoneAmt',
            kind: 'person',
            title: '当年已完成实发合计（元）',
            tip: '当年已锁定个人行的实际分配金额合计。' + tipExclude,
            mainText: formatAmount(doneAmt),
            secondaryText: '项目数 ' + uniqueProjectCount(done),
            showChart: true,
            rows: done.map(function (r) {
              return Object.assign({}, r, { amount: r.actualAmount });
            }),
            chartRows: done,
            chartAmountKey: 'actualAmount'
          },
          {
            key: 'personPendingAmt',
            kind: 'person',
            title: '当年进行中预估合计（元）',
            tip: '当年尚未锁定个人行的预估分配金额合计。' + tipExclude,
            mainText: formatAmount(pendingAmt),
            secondaryText: '项目数 ' + uniqueProjectCount(pending),
            showChart: true,
            rows: pending.map(function (r) {
              return Object.assign({}, r, { amount: r.allocAmount });
            }),
            chartRows: pending,
            chartAmountKey: 'allocAmount'
          }
        ];
      },
      pagedStatsRows: function () {
        var list = (this.statsBox && this.statsBox.rows) || [];
        var start = ((this.statsBox.page || 1) - 1) * 10;
        return list.slice(start, start + 10);
      },

      /* 待办数量使用已执行的搜索条件，与列表的待办切换保持同一口径。 */
      todoInterCount: function () { return this.matchedInterSheets.filter(this.isInterTodo).length; },
      todoIntraCount: function () { return this.matchedIntraSheets.filter(this.isIntraTodo).length; },
      todoEvalCount: function () { return this.matchedEvalProjects.filter(this.isEvalTodo).length; },
      evaluationSummary: function () {
        var self = this;
        var v = this.currentEvalSheet;
        var result = { people: 0, before: 0, after: 0, difference: 0 };
        var ids = {};
        if (!v) return result;
        v.disciplines.forEach(function (d) {
          d.persons.forEach(function (p) {
            ids[p.userId] = true;
            result.before += Math.round(p.preEvalAmount * 100);
            result.after += Math.round((v.evalStatus === 'EVAL_PENDING' ? self.draftAmount(d, p) : p.amount) * 100);
          });
        });
        result.people = Object.keys(ids).length;
        result.before /= 100;
        result.after /= 100;
        result.difference = round2(result.after - result.before);
        return result;
      },

      /* ---------- 可发起项目（本人项目 + 有任务书；进行中在选中时提示） ---------- */
      selectableProjects: function () {
        var self = this;
        return PROJECTS.filter(function (p) {
          if (p.managerUserId !== self.currentUserId) return false;
          if (!TASK_BOOK_BY_PROJECT[p.id]) return false;
          return true;
        });
      },

      /* ---------- 专业间编辑：合计与校验 ---------- */
      interEditTotal: function () {
        return this.interEdit.rows.reduce(function (a, r) { return a + pctToRatio(r.pct || 0); }, 0);
      },
      interEditTotalValid: function () {
        return this.interEditTotal === 10000;
      },
      /** 编辑态试算包：C × K1 × K2默认 × K3默认；K1 未填/越界时为 null */
      interEditEstimatedPool: function () {
        if (!this.interEdit.projectId) return null;
        if (!this.k1Valid) return null;
        var c = this.interEditAllocableAmount();
        if (!(c > 0)) return null;
        var cfg = this.state.config;
        var k2 = cfg.k2.default;
        var k3 = cfg.k3.default;
        if (!this.interEdit.isNew && this.interEdit.id) {
          var editId = this.interEdit.id;
          var sheet = this.state.interSheets.filter(function (x) { return x.id === editId; })[0];
          if (sheet) {
            k2 = sheet.k2Default;
            k3 = sheet.k3Default;
          }
        }
        return round2(c * (pctToRatio(this.interEdit.k1Pct) / 10000) * k2 * k3);
      },
      interEditCanSubmit: function () {
        if (!this.interEdit.projectId) return false;
        if (!(this.interEditAllocableAmount() > 0)) return false;
        if (!this.interEditTotalValid) return false;
        if (!this.k1Valid) return false;
        return this.interEdit.rows.every(function (r) { return !!r.leadUserId; });
      },
      k1Valid: function () {
        var r = pctToRatio(this.interEdit.k1Pct);
        var c = this.state.config.k1;
        return this.interEdit.k1Pct !== null && this.interEdit.k1Pct !== '' && r >= c.min && r <= c.max;
      },
      k1Hint: function () {
        var c = this.state.config.k1;
        return '允许区间 ' + formatRatio(c.min) + ' ~ ' + formatRatio(c.max);
      },

      /* ---------- 历史派发（同一项目、不含草稿、不含当前单） ---------- */
      interEditHistory: function () {
        return this.historyPayoutRows(this.interEdit.projectId, this.interEdit.id);
      },
      pagedInterEditHistory: function () {
        var start = (this.historyEditPage - 1) * this.historyPageSize;
        var rows = this.interEditHistory.slice(start, start + this.historyPageSize);
        return this.appendHistoryTotalRow(rows, this.interEditHistoryTotal, this.interEditHistory.length);
      },
      interEditHistoryTotal: function () {
        return this.sumActualAmounts(this.interEditHistory);
      },
      formulaHistory: function () {
        return this.historyPayoutRows(this.formulaBox.projectId, this.formulaBox.interId);
      },
      pagedFormulaHistory: function () {
        var start = (this.historyFormulaPage - 1) * this.historyPageSize;
        var rows = this.formulaHistory.slice(start, start + this.historyPageSize);
        return this.appendHistoryTotalRow(rows, this.formulaHistoryTotal, this.formulaHistory.length);
      },
      formulaHistoryTotal: function () {
        return this.sumActualAmounts(this.formulaHistory);
      },

      /* ---------- 专业内编辑：合计 ---------- */
      intraEditTotal: function () {
        return this.intraEdit.rows.reduce(function (a, r) { return a + pctToRatio(r.pct || 0); }, 0);
      },
      intraEditTotalValid: function () { return this.intraEditTotal === 10000; },

      /* ---------- 配置：权重合计 ---------- */
      configWeightTotal: function () {
        if (!this.configForm) return 0;
        var f = this.configForm;
        return round2(Number(f.quality.weight || 0) + Number(f.progress.weight || 0) + Number(f.response.weight || 0));
      },
      configWeightValid: function () { return this.configWeightTotal === 1; },
      configCanSave: function () {
        if (!this.configForm) return false;
        var f = this.configForm;
        if (!f.k2ReviewerId || !f.k3ReviewerId) return false;
        if (!this.configWeightValid) return false;
        if (!(f.k1.min >= 0) || !(f.k1.max >= f.k1.min)) return false;
        var dims = ['k2', 'k3'];
        for (var i = 0; i < dims.length; i++) {
          var d = f[dims[i]];
          if (!(d.min <= d.default && d.default <= d.max)) return false;
        }
        var evalDims = ['quality', 'progress', 'response'];
        for (var j = 0; j < evalDims.length; j++) {
          var e = f[evalDims[j]];
          if (!e.options.length) return false;
          var found = e.options.some(function (o) { return o.id === e.defaultOptionId; });
          if (!found) return false;
        }
        return true;
      }
    },

    methods: {
      /** 专业间列表可见：项目经理仅本人项目；K2/K3 仅自己在快照上的单；系统配置全部 */
      interSheetVisible: function (v) {
        var me = this.currentUserId;
        if (this.isAdmin) return true;
        if (this.isPM) return v.managerUserId === me;
        if (this.roleKind === 'K2' || this.roleKind === 'K3') {
          return v.k2ReviewerId === me || v.k3ReviewerId === me;
        }
        /* 专业负责人 / 室主任 / 工程师不办专业间，列表为空 */
        return false;
      },
      isInterTodo: function (v) {
        if (this.isPM) return v.managerUserId === this.currentUserId && (v.status === 'INTER_DRAFT' || v.status === 'INTER_REJECTED');
        if (this.roleKind !== 'K2' && this.roleKind !== 'K3') return false;
        var field = this.roleKind.toLowerCase();
        return v.status === 'INTER_PENDING' && v[field + 'ReviewerId'] === this.currentUserId && v[field + 'Status'] === 'pending';
      },
      isIntraTodo: function (v) {
        return (this.isLead && this.canEditIntra(v)) || (this.isDirector && this.canApproveIntra(v));
      },
      isEvalTodo: function (v) {
        return this.isPM && v.managerUserId === this.currentUserId && v.evalStatus === 'EVAL_PENDING';
      },
      /**
       * 列表默认排序：需要当前用户操作的记录置顶，同组内再按更新时间降序。
       * isTodoFn(row) 为 true 表示该行对当前身份仍有待办。
       */
      compareTodoThenUpdatedAt: function (a, b, isTodoFn) {
        var ta = isTodoFn.call(this, a) ? 1 : 0;
        var tb = isTodoFn.call(this, b) ? 1 : 0;
        if (ta !== tb) return tb - ta;
        if (a.updatedAt === b.updatedAt) return 0;
        return b.updatedAt < a.updatedAt ? -1 : 1;
      },
      detailStatusMeta: function (v) {
        // 专业间详情只展示专业间状态，与列表一致；不串评估页的「专业内未完成」
        var meta = this.statusOf(INTER_STATUS, v.status);
        return { text: meta.label, badge: meta.badge };
      },
      detailPendingText: function (v, ctx) {
        if (ctx.kind === 'discipline') {
          var d = v.disciplines.filter(function (x) {
            return ctx.unitId ? x.unitId === ctx.unitId : x.disciplineId === ctx.disciplineId;
          })[0];
          return d && d.waitingSplit ? this.evalIntraHint(d) : '本单元分配已通过';
        }
        // 以下仅专业间（项目）详情
        if (v.status === 'INTER_PENDING') {
          var names = [];
          if (v.k2Status === 'pending') names.push('K2 审核人 ' + userName(v.k2ReviewerId));
          if (v.k3Status === 'pending') names.push('K3 审核人 ' + userName(v.k3ReviewerId));
          return '待处理：' + names.join('、');
        }
        if (v.status === 'INTER_DRAFT' || v.status === 'INTER_REJECTED') {
          return '待项目经理 ' + userName(v.managerUserId) + ' ' + (v.status === 'INTER_REJECTED' ? '修改重提。驳回原因：' + (v.rejectReason || '未填写') : '提交派发');
        }
        if (v.status === 'INTER_APPROVED') {
          return 'K2、K3 均已确认，专业间已通过';
        }
        return '';
      },
      /* ================= 格式化 ================= */
      formatAmount: formatAmount,
      formatRatio: formatRatio,
      formatCoef: formatCoef,
      formatKCoef: formatKCoef,
      formatComposite: formatComposite,
      userName: userName,
      disciplineName: disciplineName,
      actionLabel: function (a) { return ACTION_LABEL[a] || a; },
      formatProjectDisplay: function (p) { return p.code + ' ' + p.name; },

      tableHeaderStyle: function () {
        return { background: '#f7f9fb', color: '#374151', fontWeight: '600' };
      },

      payoutStatusMeta: function (v) {
        if (v.terminated || v.status === 'INTER_TERMINATED') return { text: '已终止', badge: 'yc-badge-danger' };
        if (v.status === 'INTER_REJECTED') return { text: '已驳回', badge: 'yc-badge-danger' };
        if (!v.poolLocked) return { text: '待审核', badge: 'yc-badge-doing' };
        if (v.evalStatus === 'EVAL_DONE') return { text: '已完成', badge: 'yc-badge-ok' };
        return { text: '预估', badge: 'yc-badge-warn' };
      },
      sumActualAmounts: function (rows) {
        var has = false;
        var sum = 0;
        (rows || []).forEach(function (r) {
          if (r.amount !== null && r.amount !== undefined) {
            has = true;
            sum += r.amount;
          }
        });
        return has ? sum : null;
      },
      actualAllocatedOf: function (v) {
        /* 可分配基数：已终止释放，不计 */
        if (v.terminated || v.status === 'INTER_TERMINATED') return null;
        return v.evalStatus === 'EVAL_DONE' ? v.allocatedTotal : null;
      },
      /** 查询列表展示用实发（含已终止且曾有分配金额） */
      displayActualAllocated: function (v) {
        /* 仅曾锁定评估（含终止后仍带评估行）才展示「分配实发」 */
        if (!(v.allocatedTotal > 0)) return null;
        if (v.evalStatus === 'EVAL_DONE') return v.allocatedTotal;
        if ((v.terminated || v.status === 'INTER_TERMINATED') && v.evaluation
          && (v.evaluation.lines || []).length) {
          return v.allocatedTotal;
        }
        return null;
      },
      buildQueryPersonDetail: function (d, p) {
        return {
          unitId: d.unitId,
          unitName: d.unitName,
          disciplineName: d.name,
          name: p.name,
          allocAmount: p.preEvalAmount,
          qualityCoef: p.evaluated && p.evalLine ? p.evalLine.qualityCoef : null,
          progressCoef: p.evaluated && p.evalLine ? p.evalLine.progressCoef : null,
          responseCoef: p.evaluated && p.evalLine ? p.evalLine.responseCoef : null,
          actualAmount: p.locked ? p.amount : null
        };
      },
      appendHistoryTotalRow: function (rows, totalAmount, allLength) {
        if (!allLength) return rows;
        return rows.concat([{
          id: '__history_total__',
          isTotal: true,
          no: '合计',
          statusText: '',
          statusBadge: '',
          sheetNo: '',
          amount: totalAmount
        }]);
      },
      historyRowClassName: function (param) {
        return param.row && param.row.isTotal ? 'yc-history-total-row' : '';
      },
      historySpanMethod: function (param) {
        if (!param.row || !param.row.isTotal) return [1, 1];
        if (param.columnIndex === 0) return [1, 3];
        if (param.columnIndex === 1 || param.columnIndex === 2) return [0, 0];
        return [1, 1];
      },
      historyPayoutRows: function (projectId, excludeId) {
        var self = this;
        if (!projectId) return [];
        var rows = [];
        this.computedInterSheets.forEach(function (v) {
          if (v.projectId !== projectId) return;
          if (v.status === 'INTER_DRAFT') return;
          if (excludeId && v.id === excludeId) return;
          var meta = self.payoutStatusMeta(v);
          rows.push({
            id: v.id,
            sheetNo: v.sheetNo,
            statusText: meta.text,
            statusBadge: meta.badge,
            amount: self.displayActualAllocated(v)
          });
        });
        rows.sort(function (a, b) { return a.sheetNo < b.sheetNo ? -1 : (a.sheetNo > b.sheetNo ? 1 : 0); });
        rows.forEach(function (r, i) { r.no = i + 1; });
        return rows;
      },

      /* ================= 派生计算 ================= */

      /** 综合评分系数默认值（三项默认选项 + 当前权重） */
      defaultComposite: function () {
        var c = this.state.config;
        function coefOf(dim) {
          var found = c[dim].options.filter(function (o) { return o.id === c[dim].defaultOptionId; })[0];
          return found ? found.coef : 1;
        }
        return round3(coefOf('quality') * c.quality.weight + coefOf('progress') * c.progress.weight + coefOf('response') * c.response.weight);
      },

      /**
       * 构造一张专业间单的完整派生视图：绩效金额、各专业包、各人金额（含尾差与锁定态）
       */
      buildInterView: function (s) {
        var self = this;
        var p = PROJECT_MAP[s.projectId];
        var locked = s.k2Status === 'confirmed' && s.k3Status === 'confirmed';
        var k2 = s.k2, k3 = s.k3;
        var poolExact = s.contractAmountExclTax * (s.k1 / 10000) * k2 * k3;

        var allLines = s.lines || [];
        var active = allLines.filter(function (l) { return l.ratio > 0; });
        var sumRatio = active.reduce(function (a, l) { return a + l.ratio; }, 0);

        // 专业包：按精确值取整后把尾差补到最后一个有效专业行
        var discExacts = active.map(function (l) { return poolExact * (l.ratio / 10000); });
        var discDist = distribute(discExacts);

        var evaluation = this.state.evaluations.filter(function (e) { return e.interId === s.id; })[0] || null;
        var evalDone = !!(evaluation && evaluation.status === 'EVAL_DONE');
        /* 终止后评估单为 EVAL_TERMINATED，仍用原锁定行金额做列表展示 */
        var evalLocked = evalDone || !!(evaluation && evaluation.status === 'EVAL_TERMINATED' && (evaluation.lines || []).length);

        var disciplines = active.map(function (l, i) {
          var intra = self.state.intraSheets.filter(function (x) {
            return x.interId === s.id && x.unitId === l.unitId;
          })[0] || null;

          var discPoolExact = discExacts[i];
          var persons = [];
          var allocatedTotal = null;
          var personAdjustIndex = -1;
          var personAdjust = 0;

          var intraSettled = intra && (intra.status === 'INTRA_APPROVED' || intra.status === 'INTRA_TERMINATED')
            && (intra.lines || []).some(function (x) { return x.ratio > 0; });

          if (intraSettled) {
            var personLines = intra.lines.filter(function (x) { return x.ratio > 0; }).slice().sort(function (a, b) {
              return (a.sortKey || '').localeCompare(b.sortKey || '');
            });
            var exacts = personLines.map(function (pl) {
              var composite = self.defaultComposite();
              var evalLine = null;
              if (evaluation) {
                evalLine = evaluation.lines.filter(function (el) {
                  return el.userId === pl.userId && el.unitId === l.unitId;
                })[0] || null;
              }
              if (evalLocked && evalLine) composite = evalLine.composite;
              return discPoolExact * (pl.ratio / 10000) * composite;
            });
            var dist = distribute(exacts);
            personAdjustIndex = dist.adjustIndex;
            personAdjust = dist.adjust;
            persons = personLines.map(function (pl, j) {
              var evalLine = evaluation
                ? (evaluation.lines.filter(function (el) {
                  return el.userId === pl.userId && el.unitId === l.unitId;
                })[0] || null)
                : null;
              var composite = (evalLocked && evalLine) ? evalLine.composite : self.defaultComposite();
              return {
                userId: pl.userId,
                name: userName(pl.userId),
                sortKey: pl.sortKey,
                ratio: pl.ratio,
                composite: composite,
                evaluated: evalLocked && !!evalLine,
                evalLine: evalLine,
                preEvalAmount: round2(discPoolExact * (pl.ratio / 10000)),
                amount: dist.values[j],
                locked: evalLocked,
                roundingAdjust: dist.adjustIndex === j ? dist.adjust : 0
              };
            });
            allocatedTotal = round2(persons.reduce(function (a, x) { return a + x.amount; }, 0));
          }

          return {
            unitId: l.unitId,
            unitName: l.unitName,
            disciplineId: l.disciplineId,
            name: disciplineName(l.disciplineId),
            leadUserId: l.leadUserId,
            leadName: userName(l.leadUserId),
            directorUserId: DISCIPLINE_MAP[l.disciplineId].directorUserId,
            ratio: l.ratio,
            poolExact: discPoolExact,
            pool: discDist.values[i],
            roundingAdjust: discDist.adjustIndex === i ? discDist.adjust : 0,
            intra: intra,
            intraStatus: intra ? intra.status : null,
            persons: persons,
            allocatedTotal: allocatedTotal,
            personAdjustIndex: personAdjustIndex,
            personAdjust: personAdjust,
            waitingSplit: !intra || intra.status !== 'INTRA_APPROVED'
          };
        });

        // 评估状态
        var evalStatus = 'EVAL_BLOCKED';
        if (s.status === 'INTER_TERMINATED') {
          evalStatus = 'EVAL_TERMINATED';
        } else if (s.status === 'INTER_APPROVED') {
          var allApproved = disciplines.length > 0 && disciplines.every(function (d) {
            return d.intra && d.intra.status === 'INTRA_APPROVED';
          });
          if (evalDone) evalStatus = 'EVAL_DONE';
          else if (allApproved) evalStatus = 'EVAL_PENDING';
        }

        var projectAllocated = disciplines.reduce(function (a, d) {
          return a + (d.allocatedTotal === null ? 0 : d.allocatedTotal);
        }, 0);

        return {
          id: s.id,
          raw: s,
          sheetNo: s.sheetNo,
          projectId: s.projectId,
          projectCode: p.code,
          projectName: p.name,
          managerUserId: p.managerUserId,
          C: s.contractAmountExclTax,
          remark: s.remark || '',
          k1: s.k1,
          k2: k2, k3: k3,
          k2ReviewerId: s.k2ReviewerId, k3ReviewerId: s.k3ReviewerId,
          k2Status: s.k2Status, k3Status: s.k3Status,
          k2Default: s.k2Default, k3Default: s.k3Default,
          status: s.status,
          terminated: s.status === 'INTER_TERMINATED',
          rejectReason: s.rejectReason,
          poolExact: poolExact,
          pool: round2(poolExact),
          poolLocked: locked,
          sumRatio: sumRatio,
          unallocatedRatio: 10000 - sumRatio,
          disciplines: disciplines,
          allDisciplineLines: allLines,
          allocatedTotal: round2(projectAllocated),
          evaluation: evaluation,
          evalStatus: evalStatus,
          queryStatus: s.status === 'INTER_TERMINATED' ? 'INTER_TERMINATED'
            : (s.status === 'INTER_PENDING' ? 'INTER_PENDING'
              : (s.status === 'INTER_REJECTED' ? 'INTER_REJECTED'
                : (evalStatus === 'EVAL_DONE' ? 'LOCKED'
                  : (evalStatus === 'EVAL_PENDING' ? 'EVAL_PENDING' : 'EVAL_BLOCKED')))),
          updatedAt: s.updatedAt,
          logs: s.logs || []
        };
      },

      buildIntraView: function (s) {
        var interView = this.interSheetById ? this.interSheetById[s.interId] : null;
        var pool = null;
        if (interView) {
          var d = interView.disciplines.filter(function (x) { return x.unitId === s.unitId; })[0];
          if (d) pool = d.pool;
        }
        var p = PROJECT_MAP[s.projectId];
        var total = s.lines.reduce(function (a, l) { return a + l.ratio; }, 0);
        return {
          id: s.id,
          raw: s,
          sheetNo: s.sheetNo,
          interId: s.interId,
          projectId: s.projectId,
          projectCode: p.code,
          projectName: p.name,
          managerUserId: p.managerUserId,
          unitId: s.unitId,
          unitName: s.unitName,
          disciplineId: s.disciplineId,
          disciplineName: disciplineName(s.disciplineId),
          leadUserId: s.leadUserId,
          leadName: userName(s.leadUserId),
          directorUserId: DISCIPLINE_MAP[s.disciplineId].directorUserId,
          directorName: userName(DISCIPLINE_MAP[s.disciplineId].directorUserId),
          pool: pool,
          personCount: s.lines.filter(function (l) { return l.ratio > 0; }).length,
          candidateCount: (s.candidateUserIds || []).length,
          ratioTotal: total,
          status: s.status,
          updatedAt: s.updatedAt,
          logs: s.logs || []
        };
      },

      /* ================= 绩效查询（身份可见范围 §5.1） ================= */

      queryScope: function (v) {
        var me = this.currentUserId;
        var kind = this.roleKind;
        var scope = { ok: false, seeProject: false, disciplineIds: null, personIds: null };
        if (kind === 'ADMIN') {
          scope.ok = true;
          scope.seeProject = true;
          return scope;
        }
        if (kind === 'PM') {
          if (v.managerUserId !== me) return scope;
          scope.ok = true;
          scope.seeProject = true;
          return scope;
        }
        if (kind === 'K2' || kind === 'K3') {
          if (v.k2ReviewerId !== me && v.k3ReviewerId !== me) return scope;
          scope.ok = true;
          scope.seeProject = true;
          return scope;
        }
        if (kind === 'LEAD') {
          var leadIds = v.disciplines.filter(function (d) { return d.leadUserId === me; }).map(function (d) { return d.disciplineId; });
          if (!leadIds.length) return scope;
          scope.ok = true;
          scope.seeProject = true;
          scope.disciplineIds = leadIds;
          return scope;
        }
        if (kind === 'DIRECTOR') {
          var dirIds = v.disciplines.filter(function (d) { return d.directorUserId === me; }).map(function (d) { return d.disciplineId; });
          if (!dirIds.length) return scope;
          scope.ok = true;
          scope.seeProject = true;
          scope.disciplineIds = dirIds;
          return scope;
        }
        if (kind === 'ENGINEER') {
          var hasSelf = v.disciplines.some(function (d) {
            return d.persons.some(function (p) { return p.userId === me; });
          });
          if (!hasSelf) return scope;
          scope.ok = true;
          scope.seeProject = false;
          scope.personIds = [me];
          return scope;
        }
        return scope;
      },

      buildQueryProjectRow: function (v) {
        var statusText, statusBadge;
        if (v.terminated || v.status === 'INTER_TERMINATED') {
          statusText = '已终止'; statusBadge = 'yc-badge-danger';
        } else if (v.status === 'INTER_REJECTED') { statusText = '已驳回'; statusBadge = 'yc-badge-danger'; }
        else if (!v.poolLocked) { statusText = '待审核'; statusBadge = 'yc-badge-doing'; }
        else if (v.evalStatus === 'EVAL_DONE') { statusText = '已完成'; statusBadge = 'yc-badge-ok'; }
        else if (v.evalStatus === 'EVAL_PENDING') { statusText = '待评估'; statusBadge = 'yc-badge-warn'; }
        else { statusText = '专业内未完成'; statusBadge = 'yc-badge-mute'; }
        return {
          sheetNo: v.sheetNo,
          projectId: v.projectId,
          projectCode: v.projectCode,
          projectName: v.projectName,
          C: v.C,
          k1: v.k1,
          pool: v.pool,
          poolLocked: v.poolLocked,
          allocatedTotal: v.allocatedTotal,
          actualAllocated: this.displayActualAllocated(v),
          terminated: !!v.terminated,
          unallocatedRatio: v.unallocatedRatio,
          statusText: statusText,
          statusBadge: statusBadge,
          updatedAt: v.updatedAt,
          ctx: { kind: 'project', interId: v.id, fromQuery: true }
        };
      },

      /* ================= 查看详情弹窗（§4.2） ================= */

      openFormula: function (ctx) {
        var self = this;
        var v = this.interSheetById[ctx.interId];
        if (!v) return;
        var onQueryProject = this.activeTab === 'queryProject';
        var onQueryPerson = this.activeTab === 'queryPerson';
        var fromStats = (onQueryProject && this.queryProjectView === 'stats')
          || (onQueryPerson && this.queryPersonView === 'stats');
        if (fromStats) {
          if (onQueryPerson) this.queryPersonReturnView = 'stats';
          else this.queryProjectReturnView = 'stats';
          this.disposeStatsBar();
        } else if (onQueryProject) {
          this.queryProjectReturnView = 'list';
        } else if (onQueryPerson) {
          this.queryPersonReturnView = 'list';
        }
        var rows = [];
        var title = '';

        function term(op, name, val, status, statusBadge, sum) {
          rows.push({
            op: op || '',
            name: name,
            val: val,
            status: status || '',
            statusBadge: statusBadge || '',
            sum: !!sum
          });
        }
        function kStatus(st) {
          return st === 'confirmed'
            ? { status: '已确认', statusBadge: 'yc-badge-ok' }
            : { status: '待审核', statusBadge: 'yc-badge-doing' };
        }

        var k2s = kStatus(v.k2Status);
        var k3s = kStatus(v.k3Status);
        var poolStatus = v.poolLocked
          ? { status: '已锁定', statusBadge: 'yc-badge-ok' }
          : { status: '待审核', statusBadge: 'yc-badge-doing' };

        var splits = [];
        var people = null;
        var queryPeople = null;
        var intraSheet = null;
        var fromQuery = !!ctx.fromQuery;
        if (ctx.kind === 'project' && fromQuery) {
          title = '查看详情';
          queryPeople = [];
          v.disciplines.forEach(function (d) {
            (d.persons || []).forEach(function (p) {
              queryPeople.push(self.buildQueryPersonDetail(d, p));
            });
          });
        } else if (ctx.kind === 'project') {
          title = '查看详情';
          term('', '可分配金额', formatAmount(v.C));
          term('×', '绩效系数 K1', formatRatio(v.k1));
          term('×', '绩效系数 K2', v.k2Status === 'confirmed' ? formatKCoef(v.k2) : '—', k2s.status, k2s.statusBadge);
          term('×', '绩效系数 K3', v.k3Status === 'confirmed' ? formatKCoef(v.k3) : '—', k3s.status, k3s.statusBadge);
          term('=', '预估分配金额', v.poolLocked ? formatAmount(v.pool) : '—', poolStatus.status, poolStatus.statusBadge, true);
          splits = (v.allDisciplineLines || []).map(function (l) {
            var d = v.disciplines.filter(function (x) { return x.unitId === l.unitId; })[0];
            return {
              unitId: l.unitId,
              unitName: l.unitName,
              disciplineId: l.disciplineId,
              name: disciplineName(l.disciplineId),
              leadName: userName(l.leadUserId),
              ratio: l.ratio,
              poolText: (v.poolLocked && d) ? formatAmount(d.pool) : '—'
            };
          });
        } else if (ctx.kind === 'discipline') {
          var d = v.disciplines.filter(function (x) {
            return ctx.unitId ? x.unitId === ctx.unitId : x.disciplineId === ctx.disciplineId;
          })[0];
          title = '查看详情';
          term('', '专业分配金额', formatAmount(d.pool), '', '', true);
          var intra = d.intra;
          intraSheet = intra;
          var peopleLines = [];
          if (intra && intra.lines) {
            peopleLines = intra.lines.filter(function (l) { return l.ratio > 0; }).slice().sort(function (a, b) {
              return (a.sortKey || '').localeCompare(b.sortKey || '');
            });
          }
          var exacts = peopleLines.map(function (l) { return d.pool * (l.ratio / 10000); });
          var dist = distribute(exacts);
          people = peopleLines.map(function (l, i) {
            return { name: userName(l.userId), ratio: l.ratio, amount: dist.values[i] };
          });
        } else {
          var dd = v.disciplines.filter(function (x) {
            return ctx.unitId ? x.unitId === ctx.unitId : x.disciplineId === ctx.disciplineId;
          })[0];
          var pp = dd.persons.filter(function (x) { return x.userId === ctx.userId; })[0];
          title = '查看详情';
          queryPeople = [self.buildQueryPersonDetail(dd, pp)];
        }

        this.formulaBox = {
          visible: true,
          title: (ctx.kind === 'project' ? '派发详情' : ctx.kind === 'discipline' ? '专业分配详情' : '个人绩效详情') + ' · ' + (intraSheet ? intraSheet.sheetNo : v.sheetNo),
          statusMeta: fromQuery ? null : (ctx.kind === 'discipline' && intraSheet
            ? { text: this.statusOf(INTRA_STATUS, intraSheet.status).label, badge: this.statusOf(INTRA_STATUS, intraSheet.status).badge }
            : this.detailStatusMeta(v)),
          pendingText: fromQuery ? '' : this.detailPendingText(v, ctx),
          rows: rows,
          logs: this.collectLogs(v, ctx),
          splits: splits,
          people: people,
          queryPeople: queryPeople,
          interId: v.id,
          projectId: v.projectId,
          sheetNo: intraSheet ? intraSheet.sheetNo : v.sheetNo,
          projectCode: v.projectCode,
          projectName: v.projectName,
          managerName: userName(v.managerUserId),
          remark: v.remark || '',
          showHistory: !ctx.fromQuery && ctx.kind === 'project',
          fromStats: fromStats
        };
        this.historyFormulaPage = 1;
        this.formulaPeoplePage = 1;
        if (fromStats || onQueryProject || onQueryPerson || ctx.fromQuery) {
          if (ctx.kind === 'person' || onQueryPerson) {
            this.activeTab = 'queryPerson';
            this.queryPersonView = 'formula';
          } else {
            this.activeTab = 'queryProject';
            this.queryProjectView = 'formula';
          }
        } else if (this.activeTab === 'intra') {
          this.intraView = 'formula';
        } else {
          this.activeTab = 'inter';
          this.interView = 'formula';
        }
        this.enterPageCharts();
      },

      enterPageCharts: function () {
        var self = this;
        this.$nextTick(function () {
          setTimeout(function () {
            self.renderSplitPie();
            self.renderPeoplePie();
          }, 60);
        });
      },

      closeFormula: function () {
        this.disposeSplitPie();
        if (this.queryProjectView === 'formula') {
          var backP = this.queryProjectReturnView || 'list';
          this.queryProjectView = backP;
          this.queryProjectReturnView = 'list';
          if (backP === 'stats') {
            var selfP = this;
            this.$nextTick(function () {
              setTimeout(function () { selfP.renderStatsBar(); }, 80);
            });
          }
        } else if (this.queryPersonView === 'formula') {
          var backN = this.queryPersonReturnView || 'list';
          this.queryPersonView = backN;
          this.queryPersonReturnView = 'list';
          if (backN === 'stats') {
            var selfN = this;
            this.$nextTick(function () {
              setTimeout(function () { selfN.renderStatsBar(); }, 80);
            });
          }
        } else if (this.intraView === 'formula') {
          this.intraView = 'list';
        } else {
          this.interView = 'list';
        }
      },

      onFormulaOpened: function () {
        this.enterPageCharts();
      },

      pieColor: function (disciplineId, index) {
        if (DISCIPLINE_PIE_COLOR[disciplineId]) return DISCIPLINE_PIE_COLOR[disciplineId];
        return PIE_COLOR_FALLBACK[index % PIE_COLOR_FALLBACK.length];
      },

      piePaletteColor: function (index) {
        var palette = ['#007069', '#3c928d', '#6faeab', '#95c3c1', '#cae1e0'];
        return palette[index % palette.length];
      },

      formulaPageVm: function () {
        var r = this.$refs.formulaPage;
        if (!r) return null;
        if (Array.isArray(r)) {
          for (var i = 0; i < r.length; i++) {
            if (r[i] && r[i].$el && r[i].$el.offsetParent !== null) return r[i];
          }
          return r[0] || null;
        }
        return r;
      },

      renderSplitPie: function () {
        var self = this;
        var page = this.formulaPageVm();
        var el = page && page.$refs ? page.$refs.splitPie : null;
        var data = (this.formulaBox.splits || []).filter(function (s) { return s.ratio > 0; }).map(function (s, i) {
          return {
            name: s.unitName || s.name,
            value: s.ratio,
            ratio: s.ratio,
            amountText: s.poolText,
            itemStyle: { color: self.piePaletteColor(i) }
          };
        });
        this.applyRatioPie(el, '_splitPieChart', data, '专业间比例', '专业分配金额');
      },

      renderPeoplePie: function () {
        var self = this;
        var page = this.formulaPageVm();
        var el = page && page.$refs ? page.$refs.peoplePie : null;
        var data = (this.formulaBox.people || []).filter(function (p) { return p.ratio > 0; }).map(function (p, i) {
          return {
            name: p.name,
            value: p.ratio,
            ratio: p.ratio,
            amountText: formatAmount(p.amount),
            itemStyle: { color: self.piePaletteColor(i) }
          };
        });
        this.applyRatioPie(el, '_peoplePieChart', data, '专业内比例', '分配金额');
      },

      applyRatioPie: function (el, chartKey, data, ratioLabel, amountLabel) {
        if (!el || typeof echarts === 'undefined' || !data.length) {
          this.disposeRatioPie(chartKey);
          return;
        }
        var chart = this[chartKey];
        if (!chart) {
          chart = echarts.init(el);
          this[chartKey] = chart;
        }
        chart.setOption({
          animation: false,
          color: ['#007069', '#3c928d', '#6faeab', '#95c3c1', '#cae1e0'],
          legend: { show: false },
          tooltip: {
            trigger: 'item',
            confine: true,
            extraCssText: 'background:#fff;border:1px solid #99d1cc;box-shadow:none;padding:8px 10px;',
            textStyle: { color: '#374151', fontSize: 12 },
            formatter: function (p) {
              var d = p.data || {};
              return p.name +
                '<br/>' + ratioLabel + ' ' + formatRatio(d.ratio) +
                '<br/>' + amountLabel + ' ' + (d.amountText || '—');
            }
          },
          series: [{
            type: 'pie',
            radius: ['42%', '68%'],
            center: ['50%', '50%'],
            avoidLabelOverlap: true,
            minShowLabelAngle: 0,
            label: {
              show: true,
              position: 'outside',
              alignTo: 'labelLine',
              bleedMargin: 4,
              distanceToLabelLine: 2,
              fontSize: 11,
              lineHeight: 14,
              color: '#374151',
              overflow: 'none',
              formatter: function (p) {
                var d = p.data || {};
                return p.name + '\n' + formatRatio(d.ratio);
              }
            },
            labelLine: {
              show: true,
              length: 6,
              length2: 4,
              lineStyle: { color: '#9ca3af', width: 1 }
            },
            labelLayout: { hideOverlap: false, moveOverlap: 'shiftY' },
            itemStyle: { borderColor: '#fff', borderWidth: 2 },
            emphasis: {
              scale: true,
              scaleSize: 4,
              itemStyle: { shadowBlur: 0 }
            },
            data: data
          }]
        }, true);
        chart.resize();
      },

      disposeRatioPie: function (chartKey) {
        if (this[chartKey]) {
          this[chartKey].dispose();
          this[chartKey] = null;
        }
      },

      disposeSplitPie: function () {
        this.disposeRatioPie('_splitPieChart');
        this.disposeRatioPie('_peoplePieChart');
      },

      openQueryStats: function (kpi) {
        if (!kpi) return;
        var chartData = [];
        if (kpi.showChart) {
          chartData = amountComposeByProject(kpi.chartRows || kpi.rows, kpi.chartAmountKey || 'amount');
        }
        this.statsBox = {
          visible: true,
          kind: kpi.kind,
          key: kpi.key,
          title: kpi.title,
          tip: kpi.tip,
          mainText: kpi.mainText,
          secondaryText: kpi.secondaryText || '',
          showChart: !!kpi.showChart,
          chartData: chartData,
          rows: kpi.rows || [],
          page: 1
        };
        if (kpi.kind === 'person') {
          this.activeTab = 'queryPerson';
          this.queryPersonView = 'stats';
          this.queryPersonReturnView = 'list';
        } else {
          this.activeTab = 'queryProject';
          this.queryProjectView = 'stats';
          this.queryProjectReturnView = 'list';
        }
        var self = this;
        this.$nextTick(function () {
          setTimeout(function () { self.renderStatsBar(); }, 80);
        });
      },

      closeStats: function () {
        this.disposeStatsBar();
        if (this.activeTab === 'queryPerson') {
          this.queryPersonView = 'list';
          this.queryPersonReturnView = 'list';
        } else {
          this.queryProjectView = 'list';
          this.queryProjectReturnView = 'list';
        }
      },

      onStatsOpened: function () {
        var self = this;
        this.$nextTick(function () {
          setTimeout(function () { self.renderStatsBar(); }, 60);
        });
      },

      renderStatsBar: function () {
        var el = this.$refs.statsBar;
        var data = (this.statsBox && this.statsBox.chartData) || [];
        if (!this.statsBox.showChart || !el || typeof echarts === 'undefined' || !data.length) {
          this.disposeStatsBar();
          return;
        }
        var chart = this._statsBarChart;
        if (!chart) {
          chart = echarts.init(el);
          this._statsBarChart = chart;
        }
        var names = data.map(function (d) { return d.name; }).reverse();
        var values = data.map(function (d) { return d.value; }).reverse();
        var colors = ['#007069', '#3c928d', '#6faeab', '#95c3c1', '#cae1e0', '#9ca3af'];
        chart.setOption({
          animation: false,
          grid: { left: 12, right: 48, top: 8, bottom: 8, containLabel: true },
          tooltip: {
            trigger: 'axis',
            axisPointer: { type: 'shadow' },
            confine: true,
            extraCssText: 'background:#fff;border:1px solid #99d1cc;box-shadow:none;padding:8px 10px;',
            textStyle: { color: '#374151', fontSize: 12 },
            formatter: function (params) {
              var p = params && params[0];
              if (!p) return '';
              return p.name + '<br/>金额 ' + formatAmount(p.value);
            }
          },
          xAxis: {
            type: 'value',
            name: '金额（元）',
            nameTextStyle: { color: '#6b7280', fontSize: 11 },
            axisLabel: {
              color: '#115e59',
              fontSize: 11,
              formatter: function (v) { return formatAmount(v); }
            },
            splitLine: { lineStyle: { color: 'rgba(0,112,105,0.1)' } }
          },
          yAxis: {
            type: 'category',
            data: names,
            axisLabel: {
              color: '#374151',
              fontSize: 11,
              width: 160,
              overflow: 'truncate'
            },
            axisTick: { show: false },
            axisLine: { lineStyle: { color: 'rgba(0,112,105,0.2)' } }
          },
          series: [{
            type: 'bar',
            data: values.map(function (v, i) {
              return {
                value: v,
                itemStyle: { color: colors[(data.length - 1 - i) % colors.length] }
              };
            }),
            barMaxWidth: 22,
            label: {
              show: true,
              position: 'right',
              color: '#374151',
              fontSize: 11,
              formatter: function (p) { return formatAmount(p.value); }
            }
          }]
        }, true);
        chart.resize();
      },

      disposeStatsBar: function () {
        if (this._statsBarChart) {
          this._statsBarChart.dispose();
          this._statsBarChart = null;
        }
      },

      collectLogs: function (v, ctx) {
        var self = this;
        function wrap(list, kind, extra) {
          return (list || []).map(function (l) {
            var stamp = splitStamp(l.at);
            return {
              at: l.at,
              date: stamp.date || '—',
              time: stamp.time || '',
              text: self.formatLogSentence(l, v, kind, extra || {})
            };
          });
        }
        var logs;
        if (ctx.kind === 'discipline') {
          var disc = v.disciplines.filter(function (x) { return x.disciplineId === ctx.disciplineId; })[0];
          if (disc && disc.intra) {
            logs = wrap(disc.intra.logs, 'intra', { directorUserId: disc.directorUserId });
          } else {
            logs = [];
          }
        } else {
          logs = wrap(v.logs, 'inter', {});
        if (ctx.kind !== 'project' && ctx.disciplineId) {
          var d = v.disciplines.filter(function (x) { return x.disciplineId === ctx.disciplineId; })[0];
          if (d && d.intra) {
              logs = logs.concat(wrap(d.intra.logs, 'intra', { directorUserId: d.directorUserId }));
          }
        }
        if (v.evaluation) {
            logs = logs.concat(wrap(v.evaluation.logs, 'eval', {}));
          }
        }
        return logs.sort(function (a, b) { return a.at < b.at ? -1 : (a.at > b.at ? 1 : 0); });
      },

      formatLogSentence: function (l, v, kind, extra) {
        var who = l.operatorName || '—';
        if (kind === 'intra') {
          var director = userName(extra.directorUserId);
          if (l.action === 'SUBMIT' || l.action === 'RESUBMIT') {
            return who + '已提交专业内派发，正在等待专业室主任（' + director + '）；';
          }
          if (l.action === 'APPROVE') {
            return '专业内派发审核通过（' + who + '）；';
          }
          if (l.action === 'REJECT') {
            var intraReason = (l.comment || '').replace(/[；;。.\s]+$/, '');
            return who + '已驳回专业内派发' + (intraReason ? '，原因：' + intraReason : '') + '；';
          }
        }
        if (kind === 'eval') {
          return who + '已提交评估，个人绩效已锁定；';
        }
        var k2 = userName(v.k2ReviewerId);
        var k3 = userName(v.k3ReviewerId);
        if (l.action === 'SUBMIT') {
          return who + '已提交专业间派发，正在等待绩效系数 K2 审核人（' + k2 + '）、绩效系数 K3 审核人（' + k3 + '）；';
        }
        if (l.action === 'RESUBMIT') {
          return who + '已修改后重提专业间派发，正在等待绩效系数 K2 审核人（' + k2 + '）、绩效系数 K3 审核人（' + k3 + '）；';
        }
        if (l.action === 'CONFIRM_K2') {
          return '绩效系数 K2 已确认（' + who + '）；';
        }
        if (l.action === 'CONFIRM_K3') {
          return '绩效系数 K3 已确认（' + who + '）；';
        }
        if (l.action === 'REJECT') {
          var reason = (l.comment || '').replace(/[；;。.\s]+$/, '');
          return who + '已驳回专业间派发' + (reason ? '，原因：' + reason : '') + '；';
        }
        return who + (ACTION_LABEL[l.action] ? ACTION_LABEL[l.action] : l.action) + '；';
      },

      /* ================= 专业间：筛选 ================= */
      searchInter: function () { this.interQuery = deepClone(this.interFilter); this.interPage = 1; },
      resetInter: function () {
        this.interFilter = { projectId: '', status: '', keyword: '' };
        this.searchInter();
      },
      searchIntra: function () { this.intraQuery = deepClone(this.intraFilter); this.intraPage = 1; },
      resetIntra: function () {
        this.intraFilter = { projectId: '', disciplineId: '', status: '' };
        this.searchIntra();
      },
      searchQueryProject: function () { this.queryProjectQuery = deepClone(this.queryProjectFilter); this.queryProjectPage = 1; },
      resetQueryProject: function () {
        this.queryProjectFilter = { projectId: '', status: '', keyword: '' };
        this.searchQueryProject();
      },
      searchQueryPerson: function () { this.queryPersonQuery = deepClone(this.queryPersonFilter); this.queryPersonPage = 1; },
      resetQueryPerson: function () {
        this.queryPersonFilter = { projectId: '', disciplineId: '', status: '', keyword: '' };
        this.searchQueryPerson();
      },
      searchEval: function () { this.evalQuery = deepClone(this.evalFilter); this.evalPage = 1; },
      resetEval: function () {
        this.evalFilter = { projectId: '', status: '', keyword: '' };
        this.searchEval();
      },

      /* ================= 专业间：发起 / 编辑 ================= */

      hasOngoingPayout: function (projectId) {
        var self = this;
        return this.state.interSheets.some(function (s) {
          if (s.projectId !== projectId) return false;
          if (s.status === 'INTER_TERMINATED') return false;
          if (s.status === 'INTER_DRAFT' || s.status === 'INTER_PENDING' || s.status === 'INTER_REJECTED') return true;
          if (s.status === 'INTER_APPROVED') {
            var v = self.buildInterView(s);
            return v.evalStatus !== 'EVAL_DONE';
          }
          return false;
        });
      },

      /** 项目已分配实发合计（仅已完成评估的单据） */
      projectAllocatedAmount: function (projectId) {
        var self = this;
        if (!projectId) return 0;
        var sum = 0;
        this.computedInterSheets.forEach(function (v) {
          if (v.projectId !== projectId) return;
          var amt = self.actualAllocatedOf(v);
          if (amt !== null && amt !== undefined) sum += amt;
        });
        return round2(sum);
      },

      /** 可分配金额 = max(0, 不含税合同额 - 已分配金额) */
      projectAllocableAmount: function (projectId) {
        var p = PROJECT_MAP[projectId];
        if (!p) return null;
        return Math.max(0, round2(p.contractAmountExclTax - this.projectAllocatedAmount(projectId)));
      },

      openInterCreate: function () {
        this.historyEditPage = 1;
        this.interEdit = {
          visible: true, saving: false, isNew: true, id: null,
          projectId: '', k1Pct: null, remark: '', rows: [], errors: {}, dirty: false
        };
        this.activeTab = 'inter';
        this.interView = 'edit';
      },

      openInterEdit: function (v) {
        var rows = taskBookUnitRows(v.projectId).map(function (t) {
          var line = (v.allDisciplineLines || []).filter(function (l) { return l.unitId === t.unitId; })[0];
          return {
            unitId: t.unitId,
            unitName: t.unitName,
            disciplineId: t.disciplineId,
            name: disciplineName(t.disciplineId),
            leadUserId: t.leadUserId,
            leadName: userName(t.leadUserId),
            pct: line ? ratioToPct(line.ratio) : 0
          };
        });
        this.historyEditPage = 1;
        this.interEdit = {
          visible: true, saving: false, isNew: false, id: v.id,
          projectId: v.projectId, k1Pct: ratioToPct(v.k1), remark: v.remark || '', rows: rows, errors: {}, dirty: false
        };
        this.activeTab = 'inter';
        this.interView = 'edit';
      },

      onInterProjectChange: function (projectId) {
        var self = this;
        this.interEdit.dirty = true;
        this.historyEditPage = 1;
        if (!projectId) {
          this.interEdit.rows = [];
          return;
        }
        if (this.hasOngoingPayout(projectId)) {
          this.$alert(
            '该项目存在尚未全部完成评估的绩效派发，完成前无法再次发起新派发。',
            '无法发起',
            { type: 'warning', confirmButtonText: '知道了' }
          );
          this.$nextTick(function () {
            self.interEdit.projectId = '';
            self.interEdit.rows = [];
          });
          return;
        }
        this.interEdit.rows = taskBookUnitRows(projectId).map(function (t) {
          return {
            unitId: t.unitId,
            unitName: t.unitName,
            disciplineId: t.disciplineId,
            name: disciplineName(t.disciplineId),
            leadUserId: t.leadUserId,
            leadName: userName(t.leadUserId),
            pct: 0
          };
        });
      },

      interEditAllocableAmount: function () {
        return this.projectAllocableAmount(this.interEdit.projectId);
      },

      /** 编辑态单元行预估包：项目预估包 × 该行专业间比例；无有效 K1 或比例为 0 时为 null */
      interEditRowEstimatedAmount: function (row) {
        var pool = this.interEditEstimatedPool;
        if (pool === null || pool === undefined) return null;
        var ratio = pctToRatio(row && row.pct);
        if (!(ratio > 0)) return null;
        return round2(pool * (ratio / 10000));
      },

      closeInterEdit: function () {
        var self = this;
        if (this.interEdit.dirty) {
          this.$confirm('有未保存的内容，确认离开？', '提示', { type: 'warning', confirmButtonText: '确认离开', cancelButtonText: '继续编辑' })
            .then(function () { self.interView = 'list'; })
            .catch(function () { });
        } else {
          this.interView = 'list';
        }
      },

      submitInter: function () {
        if (!this.interEditCanSubmit || this.interEdit.saving) return;
        if (this.interEdit.isNew && this.hasOngoingPayout(this.interEdit.projectId)) {
          this.$alert(
            '该项目存在尚未全部完成评估的绩效派发，完成前无法再次发起新派发。',
            '无法发起',
            { type: 'warning', confirmButtonText: '知道了' }
          );
          return;
        }
        var self = this;
        this.interEdit.saving = true;
        var cfg = this.state.config;
        var lines = this.interEdit.rows.map(function (r) {
          return {
            unitId: r.unitId,
            unitName: r.unitName,
            disciplineId: r.disciplineId,
            leadUserId: r.leadUserId,
            ratio: pctToRatio(r.pct || 0)
          };
        });
        var k1 = pctToRatio(this.interEdit.k1Pct);
        var remark = (this.interEdit.remark || '').trim();
        var allocable = this.interEditAllocableAmount();

        setTimeout(function () {
          if (self.interEdit.isNew) {
            var s = {
              id: uid('inter'),
              sheetNo: 'YCJX-2026-' + String(self.state.interSheets.length + 101).slice(-3),
              projectId: self.interEdit.projectId,
              contractAmountExclTax: allocable,
              k1: k1,
              k2: cfg.k2.default, k3: cfg.k3.default,
              k2ReviewerId: cfg.k2ReviewerId, k3ReviewerId: cfg.k3ReviewerId,
              k2Default: cfg.k2.default, k3Default: cfg.k3.default,
              k2ConfirmedBy: null, k2ConfirmedAt: null,
              k3ConfirmedBy: null, k3ConfirmedAt: null,
              k2Status: 'pending', k3Status: 'pending',
              rejectReason: null, rejectedBy: null, rejectedAt: null,
              status: 'INTER_PENDING',
              remark: remark,
              lines: lines,
              logs: [],
              updatedAt: nowStamp()
            };
            log(s, 'SUBMIT', self.currentUserId, 'K1 ' + formatRatio(k1));
            self.state.interSheets.push(s);
          } else {
            var t = self.state.interSheets.filter(function (x) { return x.id === self.interEdit.id; })[0];
            t.contractAmountExclTax = allocable;
            t.k1 = k1;
            t.lines = lines;
            t.remark = remark;
            // 重提：审核人与 K2/K3 默认值一并按当前配置刷新（§6.1）
            t.k2ReviewerId = cfg.k2ReviewerId;
            t.k3ReviewerId = cfg.k3ReviewerId;
            t.k2Default = cfg.k2.default;
            t.k3Default = cfg.k3.default;
            t.k2 = cfg.k2.default;
            t.k3 = cfg.k3.default;
            t.k2Status = 'pending';
            t.k3Status = 'pending';
            t.k2ConfirmedBy = null; t.k2ConfirmedAt = null;
            t.k3ConfirmedBy = null; t.k3ConfirmedAt = null;
            t.rejectReason = null; t.rejectedBy = null; t.rejectedAt = null;
            t.status = 'INTER_PENDING';
            t.updatedAt = nowStamp();
            log(t, 'RESUBMIT', self.currentUserId, 'K1 ' + formatRatio(k1));
          }
          self.persist();
          self.interEdit.saving = false;
          self.interView = 'list';
          self.disposeSplitPie();
          self.disposeStatsBar();
          self.$message({ type: 'success', message: '保存成功，已提交待审核' });
        }, 220);
      },

      /* ================= 专业间：审核 ================= */

      canReviewK2: function (v) { return v.status === 'INTER_PENDING' && v.k2Status === 'pending' && v.k2ReviewerId === this.currentUserId; },
      canReviewK3: function (v) { return v.status === 'INTER_PENDING' && v.k3Status === 'pending' && v.k3ReviewerId === this.currentUserId; },

      canTerminateInter: function (v) {
        if (!v || v.status === 'INTER_TERMINATED') return false;
        if (this.isAdmin) return true;
        return this.isPM && v.managerUserId === this.currentUserId;
      },

      confirmTerminateInter: function (v) {
        var self = this;
        if (!this.canTerminateInter(v)) return;
        this.$confirm(
          '终止后，本单及关联的全部专业内单、评估单将变为「已终止」，未完成流程结束。已产生的分配实发将从可分配基数中释放（可重新派发），且不计入绩效查询顶部统计。确认终止？',
          '确认终止',
          {
            confirmButtonText: '确认终止',
            cancelButtonText: '取消',
            type: 'warning',
            confirmButtonClass: 'el-button--danger'
          }
        ).then(function () {
          self.terminateInter(v.id);
        }).catch(function () { /* 取消 */ });
      },

      terminateInter: function (interId) {
        var self = this;
        var s = this.state.interSheets.filter(function (x) { return x.id === interId; })[0];
        if (!s || s.status === 'INTER_TERMINATED') return;
        var stamp = nowStamp();
        s.status = 'INTER_TERMINATED';
        s.terminatedBy = this.currentUserId;
        s.terminatedAt = stamp;
        s.updatedAt = stamp;
        log(s, 'TERMINATE', this.currentUserId, null, '整链终止');

        this.state.intraSheets.forEach(function (t) {
          if (t.interId !== interId) return;
          if (t.status === 'INTRA_TERMINATED') return;
          t.status = 'INTRA_TERMINATED';
          t.updatedAt = stamp;
          log(t, 'TERMINATE', self.currentUserId, null, '随专业间终止');
        });

        this.state.evaluations.forEach(function (ev) {
          if (ev.interId !== interId) return;
          if (ev.status === 'EVAL_TERMINATED') return;
          ev.status = 'EVAL_TERMINATED';
          ev.updatedAt = stamp;
          log(ev, 'TERMINATE', self.currentUserId, null, '随专业间终止');
        });

        this.persist();
        this.interView = 'list';
        this.intraView = 'list';
        this.evalView = 'list';
        this.evalProjectId = '';
        this.disposeSplitPie();
        this.disposeStatsBar();
        this.$message({ type: 'warning', message: '已终止本派发链' });
      },

      openInterReview: function (v, field) {
        this.interReview = {
          visible: true, saving: false, sheet: v, field: field,
          value: field === 'k2' ? v.k2 : v.k3, error: ''
        };
        this.activeTab = 'inter';
        this.interView = 'review';
      },

      closeInterReview: function () {
        this.interView = 'list';
      },

      validateReviewValue: function () {
        var r = this.interReview;
        var c = this.state.config[r.field];
        var val = Number(r.value);
        if (r.value === null || r.value === '' || isNaN(val)) { r.error = '请填写系数'; return false; }
        if (val < c.min || val > c.max) {
          r.error = '需在 ' + formatKCoef(c.min) + ' ~ ' + formatKCoef(c.max) + ' 之间';
          return false;
        }
        r.error = '';
        return true;
      },

      confirmCoef: function () {
        if (!this.validateReviewValue() || this.interReview.saving) return;
        var self = this;
        this.interReview.saving = true;
        var field = this.interReview.field;
        var id = this.interReview.sheet.id;
        var val = round4(Number(this.interReview.value));

        setTimeout(function () {
          var s = self.state.interSheets.filter(function (x) { return x.id === id; })[0];
          s[field] = val;
          s[field + 'Status'] = 'confirmed';
          s[field + 'ConfirmedBy'] = self.currentUserId;
          s[field + 'ConfirmedAt'] = nowStamp();
          s.updatedAt = nowStamp();
          log(s, field === 'k2' ? 'CONFIRM_K2' : 'CONFIRM_K3', self.currentUserId, field.toUpperCase() + ' = ' + formatKCoef(val));

          if (s.k2Status === 'confirmed' && s.k3Status === 'confirmed') {
            s.status = 'INTER_APPROVED';
            self.spawnIntraSheets(s);
          }
          self.persist();
          self.interReview.saving = false;
          self.interView = 'list';
          self.disposeSplitPie();
          self.disposeStatsBar();
          self.$message({ type: 'success', message: field.toUpperCase() + ' 已确认' });
        }, 200);
      },

      /** 专业间通过时，为比例 > 0 的单元行各建一张 INTRA_DRAFT（§6.2） */
      spawnIntraSheets: function (s) {
        var self = this;
        s.lines.filter(function (l) { return l.ratio > 0; }).forEach(function (l) {
          var exists = self.state.intraSheets.some(function (x) {
            return x.interId === s.id && x.unitId === l.unitId;
          });
          if (exists) return;
          self.state.intraSheets.push({
            id: uid('intra'),
            sheetNo: 'YCZN-2026-' + String(self.state.intraSheets.length + 101).slice(-3),
            projectId: s.projectId,
            disciplineId: l.disciplineId,
            unitId: l.unitId,
            unitName: l.unitName,
            interId: s.id,
            leadUserId: l.leadUserId,
            status: 'INTRA_DRAFT',
            candidateUserIds: dispatchedEngineers(s.projectId, l.unitId, l.disciplineId),
            lines: [],
            review: { directorUserId: DISCIPLINE_MAP[l.disciplineId].directorUserId, comment: null, at: null },
            logs: [],
            updatedAt: nowStamp()
          });
        });
      },

      /* ================= 驳回（二次确认 + 原因必填） ================= */

      openReject: function (kind, sheetId) {
        this.rejectBox = { visible: true, saving: false, kind: kind, sheetId: sheetId, reason: '', error: '' };
      },

      rejectWarning: function () {
        if (this.rejectBox.kind === 'inter') {
          return '驳回后 K2、K3 将全部清回该单快照默认值并重新确认，单据退回项目经理。确认驳回？';
        }
        return '驳回后退回该专业负责人重新分配比例。确认驳回？';
      },

      doReject: function () {
        var box = this.rejectBox;
        if (!box.reason || !box.reason.trim()) { box.error = '驳回原因必填'; return; }
        if (box.saving) return;
        box.error = '';
        box.saving = true;
        var self = this;

        setTimeout(function () {
          if (box.kind === 'inter') {
            var s = self.state.interSheets.filter(function (x) { return x.id === box.sheetId; })[0];
            // 清回该单快照默认值，两项都回 pending
            s.k2 = s.k2Default;
            s.k3 = s.k3Default;
            s.k2Status = 'pending';
            s.k3Status = 'pending';
            s.k2ConfirmedBy = null; s.k2ConfirmedAt = null;
            s.k3ConfirmedBy = null; s.k3ConfirmedAt = null;
            s.status = 'INTER_REJECTED';
            s.rejectReason = box.reason.trim();
            s.rejectedBy = self.currentUserId;
            s.rejectedAt = nowStamp();
            s.updatedAt = nowStamp();
            log(s, 'REJECT', self.currentUserId, null, s.rejectReason);
          } else {
            var t = self.state.intraSheets.filter(function (x) { return x.id === box.sheetId; })[0];
            t.status = 'INTRA_REJECTED';
            t.review.comment = box.reason.trim();
            t.review.at = nowStamp();
            t.updatedAt = nowStamp();
            log(t, 'REJECT', self.currentUserId, null, t.review.comment);
          }
          self.persist();
          box.saving = false;
          box.visible = false;
          if (box.kind === 'inter') self.interView = 'list';
          else self.intraView = 'list';
          self.disposeSplitPie();
          self.disposeStatsBar();
          self.$message({ type: 'warning', message: '已驳回' });
        }, 200);
      },

      /* ================= 专业内 ================= */

      canEditIntra: function (v) {
        return (v.status === 'INTRA_DRAFT' || v.status === 'INTRA_REJECTED') && v.leadUserId === this.currentUserId;
      },
      canApproveIntra: function (v) {
        return v.status === 'INTRA_PENDING' && v.directorUserId === this.currentUserId;
      },

      openIntraEdit: function (v) {
        var raw = v.raw;
        var rows = (raw.candidateUserIds || []).map(function (uidv) {
          var line = raw.lines.filter(function (l) { return l.userId === uidv; })[0];
          return { userId: uidv, name: userName(uidv), pct: line ? ratioToPct(line.ratio) : 0 };
        });
        this.intraEdit = { visible: true, saving: false, id: v.id, rows: rows, dirty: false };
        this.activeTab = 'intra';
        this.intraView = 'edit';
      },

      intraEditSheet: function () {
        var id = this.intraEdit.id;
        return this.computedIntraSheets.filter(function (x) { return x.id === id; })[0] || {};
      },

      /** 编辑态行预估：本单元分配金额 × 专业内比例；比例为 0 或无包时为 null */
      intraEditRowEstimatedAmount: function (row) {
        var sheet = this.intraEditSheet();
        if (!sheet || sheet.pool === null || sheet.pool === undefined) return null;
        var ratio = pctToRatio(row && row.pct);
        if (!(ratio > 0)) return null;
        return round2(sheet.pool * (ratio / 10000));
      },

      openHourDispatchDetail: function () {
        var sheet = this.intraEditSheet();
        if (!sheet || !sheet.projectId) {
          this.$message({ type: 'warning', message: '无法定位当前单元' });
          return;
        }
        var detail = buildHourDispatchDetail(sheet.projectId, sheet.unitId, sheet.disciplineId);
        this.hourDispatchBox = {
          visible: true,
          months: detail.months,
          rows: detail.rows
        };
      },

      hourCellPair: function (row, month) {
        var c = (row && row.cells && row.cells[month]) || { report: null, dispatch: null };
        return formatHourPair(c.report, c.dispatch, !!(row && row.isTotal));
      },

      hourTotalPair: function (row) {
        return formatHourPair(row && row.totalReport, row && row.totalDispatch, true);
      },

      hourDispatchRowClass: function (o) {
        return (o.row && o.row.isTotal) ? 'yc-hour-total-row' : '';
      },

      closeIntraEdit: function () {
        var self = this;
        if (this.intraEdit.dirty) {
          this.$confirm('有未保存的内容，确认离开？', '提示', { type: 'warning', confirmButtonText: '确认离开', cancelButtonText: '继续编辑' })
            .then(function () { self.intraView = 'list'; })
            .catch(function () { });
        } else {
          this.intraView = 'list';
        }
      },

      submitIntra: function () {
        if (!this.intraEditTotalValid || this.intraEdit.saving) return;
        var self = this;
        this.intraEdit.saving = true;
        setTimeout(function () {
          var s = self.state.intraSheets.filter(function (x) { return x.id === self.intraEdit.id; })[0];
          s.lines = self.intraEdit.rows.map(function (r) {
            return { userId: r.userId, ratio: pctToRatio(r.pct || 0), sortKey: USER_MAP[r.userId].namePinyin };
          });
          s.status = 'INTRA_PENDING';
          s.review.comment = null;
          s.review.at = null;
          s.updatedAt = nowStamp();
          log(s, 'SUBMIT', self.currentUserId, '比例合计 100.00%');
          self.persist();
          self.intraEdit.saving = false;
          self.intraView = 'list';
          self.disposeSplitPie();
          self.disposeStatsBar();
          self.$message({ type: 'success', message: '已提交，待专业室主任审批' });
        }, 220);
      },

      openIntraReview: function (v) {
        this.intraReview = { visible: true, saving: false, sheet: v };
        this.activeTab = 'intra';
        this.intraView = 'review';
      },

      closeIntraReview: function () {
        this.intraView = 'list';
      },

      approveIntra: function () {
        if (this.intraReview.saving) return;
        var self = this;
        this.intraReview.saving = true;
        var id = this.intraReview.sheet.id;
        setTimeout(function () {
          var s = self.state.intraSheets.filter(function (x) { return x.id === id; })[0];
          s.status = 'INTRA_APPROVED';
          s.review.comment = null;
          s.review.at = nowStamp();
          s.updatedAt = nowStamp();
          // 个人行生成时固定展示顺序
          s.lines.forEach(function (l) { l.sortKey = USER_MAP[l.userId].namePinyin; });
          log(s, 'APPROVE', self.currentUserId);
          self.persist();
          self.intraReview.saving = false;
          self.intraView = 'list';
          self.disposeSplitPie();
          self.disposeStatsBar();
          self.$message({ type: 'success', message: '已通过，已生成个人行' });
        }, 200);
      },

      intraReviewPersons: function () {
        var v = this.intraReview.sheet;
        if (!v) return [];
        var pool = v.pool || 0;
        var lines = v.raw.lines.filter(function (l) { return l.ratio > 0; }).slice().sort(function (a, b) {
          return (a.sortKey || '').localeCompare(b.sortKey || '');
        });
        var exacts = lines.map(function (l) { return pool * (l.ratio / 10000); });
        var dist = distribute(exacts);
        return lines.map(function (l, i) {
          return { name: userName(l.userId), ratio: l.ratio, amount: dist.values[i] };
        });
      },

      /* ================= 评估 ================= */

      openEvalDetail: function (v) {
        this.evalProjectId = v.id;
        this.evalView = 'detail';
      },
      backEvalList: function () {
        this.evalView = 'list';
        this.evalProjectId = '';
        this.evalDraft = {};
      },
      evalIntraHint: function (d) {
        if (!d.intra) return '本单元分配金额已定，专业内单据尚未生成，暂不能评估本单元工程师。';
        if (d.intraStatus === 'INTRA_DRAFT') {
          return '专业内待完成，待专业负责人 ' + d.leadName + ' 提交分配比例。';
        }
        if (d.intraStatus === 'INTRA_PENDING') {
          return '专业内已提交，待室主任 ' + userName(d.directorUserId) + ' 审批。通过后才会生成个人行。';
        }
        if (d.intraStatus === 'INTRA_REJECTED') {
          return '专业内已驳回，待专业负责人 ' + d.leadName + ' 修改后重提。';
        }
        return '本单元专业内尚未完成，暂不能评估。';
      },

      initEvalDraft: function () {
        var v = this.currentEvalSheet;
        var cfg = this.state.config;
        var draft = {};
        if (!v) { this.evalDraft = draft; return; }
        var existing = v.evaluation;
        v.disciplines.forEach(function (d) {
          d.persons.forEach(function (p) {
            var key = d.unitId + '|' + p.userId;
            var line = existing
              ? existing.lines.filter(function (el) { return el.userId === p.userId && el.unitId === d.unitId; })[0]
              : null;
            draft[key] = {
              qualityOptionId: line ? line.qualityOptionId : cfg.quality.defaultOptionId,
              progressOptionId: line ? line.progressOptionId : cfg.progress.defaultOptionId,
              responseOptionId: line ? line.responseOptionId : cfg.response.defaultOptionId
            };
          });
        });
        this.evalDraft = draft;
      },

      optionById: function (dim, id) {
        var opts = this.state.config[dim].options;
        return opts.filter(function (o) { return o.id === id; })[0] || null;
      },

      draftComposite: function (unitId, userId) {
        var key = unitId + '|' + userId;
        var d = this.evalDraft[key];
        var cfg = this.state.config;
        if (!d) return this.defaultComposite();
        var q = this.optionById('quality', d.qualityOptionId);
        var p = this.optionById('progress', d.progressOptionId);
        var r = this.optionById('response', d.responseOptionId);
        if (!q || !p || !r) return this.defaultComposite();
        return round3(q.coef * cfg.quality.weight + p.coef * cfg.progress.weight + r.coef * cfg.response.weight);
      },

      draftAmount: function (disc, person) {
        // 与提交后的专业内尾差分配一致，汇总始终等于页面上的个人绩效合计。
        var self = this;
        var dist = distribute(disc.persons.map(function (p) {
          return disc.poolExact * (p.ratio / 10000) * self.draftComposite(disc.unitId, p.userId);
        }));
        return dist.values[disc.persons.indexOf(person)];
      },

      submitEvaluation: function () {
        var v = this.currentEvalSheet;
        if (!v || v.evalStatus !== 'EVAL_PENDING' || this.evalSaving) return;
        var self = this;
        this.evalSaving = true;
        var cfg = this.state.config;

        setTimeout(function () {
          var lines = [];
          v.disciplines.forEach(function (d) {
            d.persons.forEach(function (p) {
              var draft = self.evalDraft[d.unitId + '|' + p.userId] || {
                qualityOptionId: cfg.quality.defaultOptionId,
                progressOptionId: cfg.progress.defaultOptionId,
                responseOptionId: cfg.response.defaultOptionId
              };
              var q = self.optionById('quality', draft.qualityOptionId);
              var pr = self.optionById('progress', draft.progressOptionId);
              var rs = self.optionById('response', draft.responseOptionId);
              lines.push({
                userId: p.userId,
                disciplineId: d.disciplineId,
                unitId: d.unitId,
                qualityOptionId: q.id, qualityLabel: q.label, qualityCoef: q.coef,
                progressOptionId: pr.id, progressLabel: pr.label, progressCoef: pr.coef,
                responseOptionId: rs.id, responseLabel: rs.label, responseCoef: rs.coef,
                composite: round3(q.coef * cfg.quality.weight + pr.coef * cfg.progress.weight + rs.coef * cfg.response.weight)
              });
            });
          });
          var ev = {
            id: uid('eval'),
            sheetNo: 'YCPG-2026-' + String(self.state.evaluations.length + 101).slice(-3),
            projectId: v.projectId,
            interId: v.id,
            status: 'EVAL_DONE',
            lines: lines,
            weightsAtSubmit: { quality: cfg.quality.weight, progress: cfg.progress.weight, response: cfg.response.weight },
            logs: [],
            updatedAt: nowStamp()
          };
          log(ev, 'EVALUATE', self.currentUserId, lines.length + ' 人');
          self.state.evaluations.push(ev);
          self.persist();
          self.evalSaving = false;
          self.$message({ type: 'success', message: '评估已提交，个人绩效已锁定' });
        }, 240);
      },

      /* ================= 规则配置 ================= */

      initConfigForm: function () {
        this.configForm = deepClone(this.state.config);
      },

      saveConfig: function () {
        if (!this.configCanSave || this.configSaving) return;
        var self = this;
        this.configSaving = true;
        setTimeout(function () {
          self.state.config = deepClone(self.configForm);
          self.persist();
          self.configSaving = false;
          self.$message({ type: 'success', message: '保存成功' });
          self.$alert(
            '进行中的专业间单据仍按提交时的审核人处理；新的填报按新区间与新选项校验。',
            '配置已生效',
            { confirmButtonText: '知道了' }
          );
        }, 200);
      },

      restoreDemoConfig: function () {
        var self = this;
        this.$confirm('将把全部配置项重置为演示默认值，已落库单据的快照不受影响。确认恢复？', '恢复演示默认值', {
          type: 'warning', confirmButtonText: '确认恢复', cancelButtonText: '取消'
        }).then(function () {
          self.state.config = defaultConfig();
          self.initConfigForm();
          self.persist();
          self.$message({ type: 'success', message: '已恢复演示默认值' });
        }).catch(function () { });
      },

      resetDemoData: function () {
        var self = this;
        this.$confirm('将清空当前演示数据并恢复为预置单据。确认重置？', '重置演示数据', {
          type: 'warning', confirmButtonText: '确认重置', cancelButtonText: '取消'
        }).then(function () {
          var fresh = seedState();
          self.state = fresh;
          self.persist();
          self.initConfigForm();
          self.evalProjectId = '';
          self.evalView = 'list';
          self.evalDraft = {};
          self.$message({ type: 'success', message: '演示数据已重置' });
        }).catch(function () { });
      },

      /* ================= 其他 ================= */
      persist: function () { saveState(this.state); },

      /** 空态文案三分：筛选无结果 / 本来没数据 / 当前身份无可办事项（§7.0） */
      emptyText: function (hasFilter, roleNote) {
        if (hasFilter) return '未找到符合条件的数据，请调整筛选条件后重试';
        if (roleNote) return roleNote;
        return '暂无数据';
      },
      interHasFilter: function () {
        var q = this.interQuery;
        return !!(q.projectId || q.status || q.keyword);
      },
      intraHasFilter: function () {
        var q = this.intraQuery;
        return !!(q.projectId || q.disciplineId || q.status);
      },
      queryProjectHasFilter: function () {
        var q = this.queryProjectQuery;
        return !!(q.projectId || q.status || q.keyword);
      },
      queryPersonHasFilter: function () {
        var q = this.queryPersonQuery;
        return !!(q.projectId || q.disciplineId || q.status || q.keyword);
      },
      evalHasFilter: function () {
        var q = this.evalQuery;
        return !!(q.projectId || q.status || q.keyword);
      },

      statusOf: function (dict, key) {
        return dict[key] || { label: key, badge: 'yc-badge-mute' };
      },

      interStatusOptions: function () {
        return Object.keys(INTER_STATUS).map(function (k) { return { value: k, label: INTER_STATUS[k].label }; });
      },
      intraStatusOptions: function () {
        return Object.keys(INTRA_STATUS).map(function (k) { return { value: k, label: INTRA_STATUS[k].label }; });
      },

      /** 用户点击一级 tab：各页一律回列表，避免多 tab 同时停在详情/表单导致状态串台 */
      onMainTabClick: function () {
        this.resetAllTabViewsToList();
      },
      resetAllTabViewsToList: function () {
        this.interView = 'list';
        this.intraView = 'list';
        this.queryProjectView = 'list';
        this.queryPersonView = 'list';
        this.queryProjectReturnView = 'list';
        this.queryPersonReturnView = 'list';
        this.evalView = 'list';
        this.evalProjectId = '';
        this.evalDraft = {};
        this.disposeSplitPie();
        this.disposeStatsBar();
      }
    },

    watch: {
      interScope: function () { this.interPage = 1; },
      intraScope: function () { this.intraPage = 1; },
      evalScope: function () { this.evalPage = 1; },
      filteredInterSheets: function (rows) { this.interPage = Math.min(this.interPage, Math.max(1, Math.ceil(rows.length / this.interPageSize))); },
      filteredIntraSheets: function (rows) { this.intraPage = Math.min(this.intraPage, Math.max(1, Math.ceil(rows.length / this.intraPageSize))); },
      filteredEvalProjects: function (rows) { this.evalPage = Math.min(this.evalPage, Math.max(1, Math.ceil(rows.length / this.evalPageSize))); },
      currentRole: function () {
        this.interScope = this.intraScope = this.evalScope = 'all';
        this.initConfigForm();
        // 切身份：重置分页与评估选择，避免看到上一身份的上下文
        this.interPage = 1;
        this.intraPage = 1;
        this.queryProjectPage = 1;
        this.queryPersonPage = 1;
        this.resetAllTabViewsToList();
        this.evalPage = 1;
        if (this.activeTab === 'config' && !this.isAdmin) this.activeTab = 'inter';
        // 工程师默认落在「个人绩效查询」；若当前在项目查询则切过去
        if (this.isEngineer && this.activeTab === 'queryProject') {
          this.activeTab = 'queryPerson';
        }
        var self = this;
        this.$nextTick(function () {
          if (self.$refs.mainTabs && self.$refs.mainTabs.calcPaneInstances) {
            self.$refs.mainTabs.calcPaneInstances(true);
          }
        });
      },
      evalProjectId: function () { this.initEvalDraft(); }
    },

    created: function () {
      this.initConfigForm();
      this.searchInter();
      this.searchIntra();
      this.searchQueryProject();
      this.searchQueryPerson();
      this.searchEval();
      try {
        var params = new URLSearchParams(window.location.search);
        if (params.get('demoReset') === '0') this.showDemoReset = false;
      } catch (e) { /* 忽略 */ }
    },

    beforeDestroy: function () {
      this.disposeSplitPie();
      this.disposeStatsBar();
    }
  });

  /** 三位小数（综合评分系数） */
  function round3(n) { return Math.round((n + Number.EPSILON) * 1000) / 1000; }
})();
