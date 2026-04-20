/* 派遣人员考勤 · 原型 Mock 版
 * 技术栈：Vue 2 + Element UI + Tailwind
 * 仅用于交互演示，不做真实后端联调。
 */

(function () {
  const PROJECTS = [
    { id: 'PJT-10023', name: '滨海炼化一体化项目', code: 'D25999' },
    { id: 'PJT-10024', name: '塔里木油田扩建项目', code: 'D26012' },
    { id: 'PJT-10025', name: '东海海上平台EPC', code: 'D26108' },
  ];

  const VENDORS = [
    { id: 'VND-7788', name: '北京精英外包有限公司' },
    { id: 'VND-7799', name: '上海智汇人力服务' },
    { id: 'VND-7800', name: '广州鸿达工程咨询' },
  ];

  /** 与「第三方人员管理」对齐的 Mock：按项目带出默认派遣名单（可增删改） */
  const PROJECT_THIRD_PARTY_PERSONNEL = {
    'PJT-10023': [
      { name: '张三', vendorId: 'VND-7788' },
      { name: '李四', vendorId: 'VND-7788' },
      { name: '王五', vendorId: 'VND-7799' },
    ],
    'PJT-10024': [
      { name: '刘一', vendorId: 'VND-7799' },
      { name: '陈二', vendorId: 'VND-7800' },
    ],
    'PJT-10025': [
      { name: '周强', vendorId: 'VND-7788' },
      { name: '吴敏', vendorId: 'VND-7800' },
      { name: '郑华', vendorId: 'VND-7800' },
    ],
  };

  const STATUS_LIST = [
    { value: 'DRAFT', label: '草稿', tag: 'info' },
    { value: 'SUBMITTED', label: '待采购确认', tag: 'warning' },
    { value: 'REJECTED', label: '已驳回', tag: 'danger' },
    { value: 'APPROVED', label: '已确认', tag: '' },
    { value: 'PAYABLE_GENERATED', label: '应付已生成', tag: 'warning' },
    { value: 'PUSH_FAILED', label: '推送失败', tag: 'danger' },
    { value: 'PUSHED_TO_PAYMENT', label: '已推送付款', tag: 'success' },
  ];

  const STATUS_MAP = STATUS_LIST.reduce((m, s) => ((m[s.value] = s), m), {});

  /** 日格下拉候选项（值与 parseDay 约定一致；亦可 allow-create 输入其他数字工时） */
  const DAY_ENTRY_OPTIONS = [
    { value: '8', meaning: '全日出勤（8h）' },
    { value: '9', meaning: '全日出勤（9h）' },
    { value: '4', meaning: '半日出勤（4h）' },
    { value: '+', meaning: '事假' },
    { value: '⊕', meaning: '病假' },
    { value: '○', meaning: '调休' },
    { value: '√', meaning: '年休' },
    { value: '☆', meaning: '法定节假日加班' },
    { value: '×', meaning: '旷工' },
    { value: '▲', meaning: '项目假' },
  ];

  // 符号/数值解析：支持 8 / 4 / + / ⊕ / ○ / √ / ☆ / × / ▲
  function parseDay(raw) {
    const v = (raw || '').toString().trim();
    if (!v) return null;
    if (v === '+') return { type: 'personal', hours: 8 };
    if (v === '⊕') return { type: 'sick', hours: 8 };
    if (v === '○') return { type: 'comp', hours: 8 };
    if (v === '√') return { type: 'annual', hours: 8 };
    if (v === '☆') return { type: 'legal', hours: 8 };
    if (v === '×') return { type: 'absent', hours: 0 };
    if (v === '▲') return { type: 'projectLeave', hours: 8 };
    const num = Number(v);
    if (!isNaN(num)) {
      if (num >= 8) return { type: 'actual', hours: 8, ot: num - 8 };
      if (num > 0) return { type: 'actual', hours: num, ot: 0 };
    }
    return { type: 'invalid', hours: 0 };
  }

  function isWeekend(year, month, day) {
    const d = new Date(year, month - 1, day).getDay();
    return d === 0 || d === 6;
  }

  function daysInMonth(year, month) {
    return new Date(year, month, 0).getDate();
  }

  function makeRow(name, vendorId, rate) {
    return {
      _key: 'row_' + Math.random().toString(36).slice(2, 9),
      name,
      vendorId,
      rate: { normal: rate || 150, otWeekdayCoef: 1.5, otWeekendCoef: 2, otHolidayCoef: 3 },
      days: Array(31).fill(''),
      otherAttendance: '',
      remark: '',
      summary: emptySummary(),
    };
  }

  function emptySummary() {
    return {
      actual: 0,
      otWeekday: 0,
      otWeekend: 0,
      otHoliday: 0,
      compOff: 0,
      annual: 0,
      personal: 0,
      sick: 0,
      projectLeave: 0,
      absent: 0,
    };
  }

  function recalcRow(row, year, month) {
    const sum = emptySummary();
    const maxDay = daysInMonth(year, month);
    for (let i = 0; i < maxDay; i++) {
      const parsed = parseDay(row.days[i]);
      if (!parsed) continue;
      const day = i + 1;
      const weekend = isWeekend(year, month, day);
      switch (parsed.type) {
        case 'actual':
          sum.actual += parsed.hours;
          if (parsed.ot > 0) {
            if (weekend) sum.otWeekend += parsed.ot;
            else sum.otWeekday += parsed.ot;
          }
          break;
        case 'personal':
          sum.personal += parsed.hours;
          break;
        case 'sick':
          sum.sick += parsed.hours;
          break;
        case 'projectLeave':
          sum.projectLeave += parsed.hours;
          break;
        case 'comp':
          sum.compOff += parsed.hours;
          break;
        case 'annual':
          sum.annual += parsed.hours;
          break;
        case 'legal':
          sum.otHoliday += parsed.hours;
          break;
        case 'absent':
          sum.absent += 1;
          break;
      }
    }
    row.summary = sum;
  }

  function calcAmount(row) {
    const r = row.rate;
    return (
      row.summary.actual * r.normal +
      row.summary.otWeekday * r.normal * r.otWeekdayCoef +
      row.summary.otWeekend * r.normal * r.otWeekendCoef +
      row.summary.otHoliday * r.normal * r.otHolidayCoef
    );
  }

  function fmtDate(d) {
    const p = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
  }

  function buildMockSheet(seed) {
    const project = PROJECTS[seed % PROJECTS.length];
    const year = 2026;
    const month = 3;
    const persons = [
      makeRow('张三', 'VND-7788', 160),
      makeRow('李四', 'VND-7788', 140),
      makeRow('王五', 'VND-7799', 180),
      makeRow('赵六', 'VND-7800', 150),
    ];
    const maxDay = daysInMonth(year, month);
    persons.forEach((p, idx) => {
      for (let d = 1; d <= maxDay; d++) {
        if (isWeekend(year, month, d)) {
          if (idx % 2 === 0 && d % 13 === 0) p.days[d - 1] = '4';
          else p.days[d - 1] = '';
        } else {
          if (idx === 2 && (d === 7 || d === 8)) p.days[d - 1] = '+';
          else if (idx === 3 && d === 14) p.days[d - 1] = '⊕';
          else p.days[d - 1] = '8';
        }
      }
      recalcRow(p, year, month);
    });

    const status = ['DRAFT', 'SUBMITTED', 'APPROVED', 'PUSHED_TO_PAYMENT', 'REJECTED'][seed % 5];
    const sheet = {
      id: 'ATS-' + (1000 + seed),
      sheetNo: `ATS-${year}-${String(month).padStart(2, '0')}-${String(seed).padStart(3, '0')}`,
      projectId: project.id,
      projectName: project.name,
      projectCode: project.code,
      year,
      month,
      status,
      persons,
      createdBy: '王项经',
      submittedAt: status !== 'DRAFT' ? '2026-04-02 10:10' : '',
      approvedAt: ['APPROVED', 'PAYABLE_GENERATED', 'PUSHED_TO_PAYMENT'].includes(status)
        ? '2026-04-02 14:22'
        : '',
      rejectedReason: status === 'REJECTED' ? '李四 3 月 12 日符号无法识别，请修正后再提交' : '',
      amount: 0,
      payableNo: '',
      versionNo: 1,
      pushAttempts: 0,
      lastPushError: '',
      externalPaymentId: '',
      rateVersion: 3,
      updatedAt: '2026-04-02 14:22',
      logs: [
        { action: 'CREATE', actionLabel: '创建', operator: '王项经', at: '2026-04-01 09:12', comment: '' },
        { action: 'SUBMIT', actionLabel: '送采购确认', operator: '王项经', at: '2026-04-02 10:10', comment: '' },
      ],
    };
    if (['APPROVED', 'PAYABLE_GENERATED', 'PUSHED_TO_PAYMENT'].includes(status)) {
      sheet.amount = persons.reduce((t, r) => t + calcAmount(r), 0);
      sheet.payableNo = `PAY-${year}-${String(month).padStart(2, '0')}-${String(seed).padStart(4, '0')}`;
      sheet.logs.push({
        action: 'APPROVE',
        actionLabel: '确认通过',
        operator: '陈采购',
        at: '2026-04-02 14:22',
        comment: '工时清晰，符合合同',
      });
    }
    if (status === 'PUSHED_TO_PAYMENT') {
      sheet.externalPaymentId = 'PMTREQ-2026-55' + (100 + seed);
      sheet.logs.push({
        action: 'PUSHED',
        actionLabel: '推送付款模块',
        operator: '陈采购',
        at: '2026-04-02 15:05',
        comment: '付款模块回执成功',
      });
    }
    if (status === 'REJECTED') {
      sheet.logs.push({
        action: 'REJECT',
        actionLabel: '驳回',
        operator: '陈采购',
        at: '2026-04-02 14:25',
        comment: sheet.rejectedReason,
      });
    }
    return sheet;
  }

  new Vue({
    el: '#app',
    data() {
      return {
        currentRole: 'PM',
        currentUser: { id: 'u_pm_01', name: '王项经' },
        projects: PROJECTS,
        vendors: VENDORS,
        statusOptions: STATUS_LIST,
        statusMap: STATUS_MAP,

        sheets: Array.from({ length: 8 }, (_, i) => buildMockSheet(i)),

        filter: { project: '', period: '', status: '', keyword: '' },
        page: { current: 1, size: 10 },

        currentPeriodLabel: '2026-03',

        editDrawer: false,
        editMode: 'create',
        editForm: this.buildEmptyForm(),

        reviewDrawer: false,
        reviewComment: '',

        calcDialog: false,

        payableDialog: false,

        detailDrawer: false,

        importDialog: false,
        importStep: 0,
        mockImportPersons: [
          { name: '赵一', vendorName: '北京精英外包有限公司', actual: 168 },
          { name: '孙二', vendorName: '上海智汇人力服务', actual: 160 },
          { name: '周三', vendorName: '广州鸿达工程咨询', actual: 152 },
        ],

        dayEntryOptions: DAY_ENTRY_OPTIONS,

        currentSheetId: null,

        tableHeaderStyle: { background: '#f7f9fb', color: '#374151', fontWeight: 600 },
      };
    },
    computed: {
      currentSheet() {
        return this.sheets.find((s) => s.id === this.currentSheetId) || null;
      },
      filteredSheets() {
        return this.sheets.filter((s) => {
          if (this.filter.project && s.projectId !== this.filter.project) return false;
          if (this.filter.status && s.status !== this.filter.status) return false;
          if (this.filter.period) {
            const [y, m] = this.filter.period.split('-').map(Number);
            if (s.year !== y || s.month !== m) return false;
          }
          if (this.filter.keyword) {
            const k = this.filter.keyword.toLowerCase();
            const hit =
              s.sheetNo.toLowerCase().includes(k) ||
              s.projectName.toLowerCase().includes(k) ||
              s.projectCode.toLowerCase().includes(k) ||
              s.persons.some((p) => p.name.includes(k));
            if (!hit) return false;
          }
          return true;
        });
      },
      pagedSheets() {
        const start = (this.page.current - 1) * this.page.size;
        return this.filteredSheets.slice(start, start + this.page.size);
      },
      stats() {
        const inMonth = this.sheets.filter((s) => s.year === 2026 && s.month === 3);
        return {
          total: inMonth.length,
          pending: inMonth.filter((s) => s.status === 'SUBMITTED').length,
          pushed: inMonth.filter((s) => s.status === 'PUSHED_TO_PAYMENT').length,
          amount: inMonth.reduce((t, s) => t + (s.amount || 0), 0),
        };
      },
      daysInMonth() {
        const p = this.editForm.period;
        if (!p) return 30;
        const [y, m] = p.split('-').map(Number);
        return daysInMonth(y, m);
      },
      validationMessages() {
        const msgs = [];
        const p = this.editForm.period;
        if (!p) {
          msgs.push('请选择年月');
          return msgs;
        }
        const [y, m] = p.split('-').map(Number);
        const maxDay = daysInMonth(y, m);
        this.editForm.persons.forEach((row, idx) => {
          if (!row.name) msgs.push(`第 ${idx + 1} 行缺少姓名`);
          if (!row.vendorId) msgs.push(`第 ${idx + 1} 行未选择供应商（${row.name || '未命名'}）`);
          for (let i = 0; i < maxDay; i++) {
            const parsed = parseDay(row.days[i]);
            if (parsed && parsed.type === 'invalid') {
              msgs.push(`「${row.name}」第 ${i + 1} 日填写不合法：${row.days[i]}`);
            }
          }
          // 请假最小单位 4 小时
          if (row.summary.personal > 0 && row.summary.personal % 4 !== 0) {
            msgs.push(`「${row.name}」事假合计不是 4 的倍数`);
          }
          const pl = row.summary.projectLeave || 0;
          if (pl > 0 && pl % 4 !== 0) {
            msgs.push(`「${row.name}」项目假合计不是 4 的倍数`);
          }
        });
        return msgs;
      },
      totalActualHours() {
        return this.editForm.persons.reduce((t, r) => t + r.summary.actual, 0);
      },
      totalOtHours() {
        return this.editForm.persons.reduce(
          (t, r) => t + r.summary.otWeekday + r.summary.otWeekend + r.summary.otHoliday,
          0
        );
      },
      calcRows() {
        if (!this.currentSheet) return [];
        return this.currentSheet.persons.map((p) => ({
          ...p,
          amount: calcAmount(p),
        }));
      },
      calcTotal() {
        return this.calcRows.reduce((t, r) => t + r.amount, 0);
      },
      payableByVendor() {
        if (!this.currentSheet) return [];
        const map = {};
        this.currentSheet.persons.forEach((p) => {
          if (!map[p.vendorId]) {
            map[p.vendorId] = {
              vendorId: p.vendorId,
              vendorName: this.vendorName(p.vendorId),
              count: 0,
              amount: 0,
            };
          }
          map[p.vendorId].count += 1;
          map[p.vendorId].amount += calcAmount(p);
        });
        return Object.values(map);
      },
    },
    methods: {
      formatAmount(v) {
        return (Number(v) || 0).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      },
      formatProjectDisplay(project) {
        if (!project) return '';
        return `${project.code}  ${project.name}`;
      },
      vendorName(id) {
        const v = this.vendors.find((x) => x.id === id);
        return v ? v.name : id || '—';
      },
      vendorCount(sheet) {
        return new Set(sheet.persons.map((p) => p.vendorId).filter(Boolean)).size;
      },
      daysInSheet(sheet) {
        return daysInMonth(sheet.year, sheet.month);
      },
      isWeekend(day) {
        const p = this.editForm.period;
        if (!p) return false;
        const [y, m] = p.split('-').map(Number);
        return isWeekend(y, m, day);
      },
      isWeekendOf(sheet, day) {
        return isWeekend(sheet.year, sheet.month, day);
      },
      resetFilter() {
        this.filter = { project: '', period: '', status: '', keyword: '' };
      },
      buildEmptyForm() {
        return {
          id: null,
          projectId: '',
          projectCode: '',
          period: '2026-03',
          persons: [],
        };
      },
      onProjectChange(id) {
        const p = this.projects.find((x) => x.id === id);
        this.editForm.projectCode = p ? p.code : '';
        if (this.editMode !== 'create' || !id) return;
        this.applyThirdPartyPersonnelForProject(id);
      },
      applyThirdPartyPersonnelForProject(projectId) {
        const list = PROJECT_THIRD_PARTY_PERSONNEL[projectId];
        if (!list || list.length === 0) {
          this.editForm.persons = [];
          return;
        }
        this.editForm.persons = list.map((x, i) => makeRow(x.name, x.vendorId, 150 + (i % 3) * 10));
        const period = this.editForm.period;
        if (!period) return;
        const [y, mo] = period.split('-').map(Number);
        this.editForm.persons.forEach((row) => recalcRow(row, y, mo));
      },
      onEditPeriodChange() {
        const p = this.editForm.period;
        if (!p || !this.editForm.persons.length) return;
        const [y, m] = p.split('-').map(Number);
        this.editForm.persons.forEach((row) => recalcRow(row, y, m));
      },
      openCreate() {
        this.editMode = 'create';
        this.editForm = this.buildEmptyForm();
        this.editDrawer = true;
      },
      openEdit(sheet) {
        this.editMode = 'edit';
        this.currentSheetId = sheet.id;
        this.editForm = {
          id: sheet.id,
          projectId: sheet.projectId,
          projectCode: sheet.projectCode,
          period: `${sheet.year}-${String(sheet.month).padStart(2, '0')}`,
          persons: sheet.persons.map((p) => ({
            ...p,
            days: [...p.days],
            otherAttendance: p.otherAttendance || '',
            remark: p.remark || '',
            summary: { ...emptySummary(), ...p.summary },
          })),
        };
        this.$nextTick(() => {
          const period = this.editForm.period;
          if (!period) return;
          const [y, mo] = period.split('-').map(Number);
          this.editForm.persons.forEach((row) => recalcRow(row, y, mo));
        });
        this.editDrawer = true;
      },
      addPerson() {
        if (!this.editForm.projectId) {
          this.$message.warning('请先选择项目');
          return;
        }
        this.editForm.persons.push(makeRow('', '', 150));
      },
      removePerson(idx) {
        this.editForm.persons.splice(idx, 1);
      },
      recalcRow(row) {
        const p = this.editForm.period;
        if (!p) return;
        const [y, m] = p.split('-').map(Number);
        recalcRow(row, y, m);
      },
      setDayCell(row, idx, val) {
        const s = val === null || val === undefined ? '' : String(val).trim();
        this.$set(row.days, idx, s);
        this.recalcRow(row);
      },
      /** 从 el-select 实例读取 filter 输入框内容（filterable + allow-create 失焦未点选项时仍保留） */
      getSelectQuery(selectInst) {
        if (!selectInst) return '';
        const raw =
          selectInst.query !== undefined
            ? selectInst.query
            : selectInst.$data && selectInst.$data.query;
        return raw != null ? String(raw).trim() : '';
      },
      selectRef(refKey) {
        const r = this.$refs[refKey];
        return r && (Array.isArray(r) ? r[0] : r);
      },
      /**
       * 下拉关闭时把当前检索词写回业务值（避免必须点选列表项）
       */
      flushFilterableSelect(refKey, apply) {
        const tryOnce = () => {
          const inst = this.selectRef(refKey);
          const q = this.getSelectQuery(inst);
          if (q === '') return false;
          apply(q);
          if (inst && Object.prototype.hasOwnProperty.call(inst, 'query')) inst.query = '';
          return true;
        };
        tryOnce();
        this.$nextTick(() => {
          tryOnce();
        });
      },
      onDayVisibleChange(visible, row, dayNum) {
        if (visible) return;
        const refKey = 'daySel_' + row._key + '_' + dayNum;
        this.flushFilterableSelect(refKey, (q) => this.setDayCell(row, dayNum - 1, q));
      },
      copyFromLastMonth() {
        if (!this.editForm.projectId) {
          this.$message.warning('请先选择项目');
          return;
        }
        const names = ['张三', '李四', '王五', '赵六', '钱七'];
        this.editForm.persons = names.map((n, i) =>
          makeRow(n, VENDORS[i % VENDORS.length].id, 150 + i * 10)
        );
        this.$message.success('已复制上月人员名单');
      },
      fillWeekdayByHours() {
        if (!this.editForm.projectId) {
          this.$message.warning('请先选择项目');
          return;
        }
        this.$prompt('请输入工作日默认工时（支持小数）', '一键填充工作日', {
          confirmButtonText: '填充',
          cancelButtonText: '取消',
          inputValue: '8',
          inputPlaceholder: '例如 8 或 9',
          inputPattern: /^([1-9]\d?)(\.\d{1,2})?$/,
          inputErrorMessage: '请输入大于 0 且最多两位小数的小时数',
        })
          .then(({ value }) => {
            this.applyWeekdayHours(value);
          })
          .catch(() => {});
      },
      applyWeekdayHours(hourValue) {
        const p = this.editForm.period;
        if (!p) return;
        const [y, m] = p.split('-').map(Number);
        const max = daysInMonth(y, m);
        const normalized = String(Number(hourValue));
        this.editForm.persons.forEach((row) => {
          for (let d = 1; d <= max; d++) {
            if (!isWeekend(y, m, d)) row.days[d - 1] = normalized;
          }
          this.recalcRow(row);
        });
        this.$message.success(`已填充所有工作日为 ${normalized} 小时`);
      },
      saveDraft() {
        this._persist('DRAFT');
        this.$message.success('草稿已保存');
        this.editDrawer = false;
      },
      submitFromEdit() {
        if (this.validationMessages.length > 0) {
          this.$confirm('存在校验提示，仍要提交？', '提示', { type: 'warning' })
            .then(() => this._doSubmit())
            .catch(() => {});
          return;
        }
        this._doSubmit();
      },
      _doSubmit() {
        this._persist('SUBMITTED');
        this.$message.success('已送采购确认');
        this.editDrawer = false;
      },
      _persist(status) {
        const [y, m] = this.editForm.period.split('-').map(Number);
        const proj = this.projects.find((p) => p.id === this.editForm.projectId);
        if (this.editMode === 'create') {
          const id = 'ATS-' + (2000 + this.sheets.length);
          const newSheet = {
            id,
            sheetNo: `ATS-${y}-${String(m).padStart(2, '0')}-${String(this.sheets.length + 1).padStart(3, '0')}`,
            projectId: proj.id,
            projectName: proj.name,
            projectCode: proj.code,
            year: y,
            month: m,
            status,
            persons: this.editForm.persons.map((p) => ({ ...p })),
            createdBy: this.currentUser.name,
            submittedAt: status === 'SUBMITTED' ? fmtDate(new Date()) : '',
            approvedAt: '',
            rejectedReason: '',
            amount: 0,
            payableNo: '',
            versionNo: 1,
            pushAttempts: 0,
            lastPushError: '',
            externalPaymentId: '',
            rateVersion: 3,
            updatedAt: fmtDate(new Date()),
            logs: [
              { action: 'CREATE', actionLabel: '创建', operator: this.currentUser.name, at: fmtDate(new Date()), comment: '' },
            ],
          };
          if (status === 'SUBMITTED') {
            newSheet.logs.push({
              action: 'SUBMIT',
              actionLabel: '送采购确认',
              operator: this.currentUser.name,
              at: fmtDate(new Date()),
              comment: '',
            });
          }
          this.sheets.unshift(newSheet);
          this.currentSheetId = newSheet.id;
        } else {
          const sheet = this.sheets.find((s) => s.id === this.editForm.id);
          if (!sheet) return;
          sheet.persons = this.editForm.persons.map((p) => ({ ...p }));
          sheet.updatedAt = fmtDate(new Date());
          if (status === 'SUBMITTED') {
            sheet.status = 'SUBMITTED';
            sheet.submittedAt = fmtDate(new Date());
            sheet.logs.push({
              action: 'SUBMIT',
              actionLabel: '重新提交',
              operator: this.currentUser.name,
              at: fmtDate(new Date()),
              comment: '',
            });
          }
        }
      },
      submitSheet(sheet) {
        this.$confirm('提交后单将进入「待采购确认」状态，是否继续？', '提示', { type: 'warning' })
          .then(() => {
            sheet.status = 'SUBMITTED';
            sheet.submittedAt = fmtDate(new Date());
            sheet.updatedAt = fmtDate(new Date());
            sheet.logs.push({
              action: 'SUBMIT',
              actionLabel: '送采购确认',
              operator: this.currentUser.name,
              at: fmtDate(new Date()),
              comment: '',
            });
            this.$message.success('已提交');
          })
          .catch(() => {});
      },
      openReview(sheet) {
        this.currentSheetId = sheet.id;
        this.reviewComment = '';
        this.reviewDrawer = true;
      },
      doApprove() {
        const sheet = this.currentSheet;
        if (!sheet) return;
        sheet.status = 'APPROVED';
        sheet.approvedAt = fmtDate(new Date());
        sheet.updatedAt = fmtDate(new Date());
        sheet.amount = sheet.persons.reduce((t, p) => t + calcAmount(p), 0);
        sheet.logs.push({
          action: 'APPROVE',
          actionLabel: '确认通过',
          operator: '陈采购',
          at: fmtDate(new Date()),
          comment: this.reviewComment,
        });
        this.reviewDrawer = false;
        this.$message.success('已确认，已生成成本快照');
      },
      doReject() {
        if (!this.reviewComment) {
          this.$message.warning('请填写驳回原因');
          return;
        }
        const sheet = this.currentSheet;
        if (!sheet) return;
        sheet.status = 'REJECTED';
        sheet.rejectedReason = this.reviewComment;
        sheet.updatedAt = fmtDate(new Date());
        sheet.logs.push({
          action: 'REJECT',
          actionLabel: '驳回',
          operator: '陈采购',
          at: fmtDate(new Date()),
          comment: this.reviewComment,
        });
        this.reviewDrawer = false;
        this.$message.success('已驳回，考勤单退回项目经理');
      },
      openCalc(sheet) {
        this.currentSheetId = sheet.id;
        this.calcDialog = true;
      },
      generatePayable() {
        const sheet = this.currentSheet;
        if (!sheet) return;
        sheet.status = 'PAYABLE_GENERATED';
        sheet.amount = this.calcTotal;
        sheet.payableNo =
          'PAY-' +
          sheet.year +
          '-' +
          String(sheet.month).padStart(2, '0') +
          '-' +
          String(2000 + this.sheets.indexOf(sheet)).padStart(4, '0');
        sheet.updatedAt = fmtDate(new Date());
        sheet.logs.push({
          action: 'PAYABLE',
          actionLabel: '生成应付单',
          operator: '陈采购',
          at: fmtDate(new Date()),
          comment: '',
        });
        this.calcDialog = false;
        this.currentSheetId = sheet.id;
        this.payableDialog = true;
      },
      openPayable(sheet) {
        this.currentSheetId = sheet.id;
        this.payableDialog = true;
      },
      pushPayment() {
        const sheet = this.currentSheet;
        if (!sheet) return;
        sheet.pushAttempts += 1;
        // 模拟 70% 成功，30% 失败
        const ok = Math.random() > 0.3;
        if (ok) {
          sheet.status = 'PUSHED_TO_PAYMENT';
          sheet.externalPaymentId = 'PMTREQ-2026-' + Math.floor(10000 + Math.random() * 90000);
          sheet.lastPushError = '';
          sheet.updatedAt = fmtDate(new Date());
          sheet.logs.push({
            action: 'PUSHED',
            actionLabel: '推送付款模块',
            operator: '陈采购',
            at: fmtDate(new Date()),
            comment: '成功',
          });
          this.$message.success('推送成功，付款模块已接收');
        } else {
          sheet.status = 'PUSH_FAILED';
          sheet.lastPushError = '付款模块返回 500：供应商银行信息缺失';
          sheet.updatedAt = fmtDate(new Date());
          sheet.logs.push({
            action: 'PUSH_FAILED',
            actionLabel: '推送失败',
            operator: '陈采购',
            at: fmtDate(new Date()),
            comment: sheet.lastPushError,
          });
          this.$message.error('推送失败，可在应付单页面重试');
        }
      },
      retryPush() {
        this.pushPayment();
      },
      openDetail(sheet) {
        this.currentSheetId = sheet.id;
        this.detailDrawer = true;
      },
      openImport() {
        this.importDialog = true;
        this.importStep = 0;
      },
      mockUploadStep() {
        this.importStep = 1;
      },
      logColor(action) {
        switch (action) {
          case 'APPROVE':
          case 'PUSHED':
            return '#007069';
          case 'REJECT':
          case 'PUSH_FAILED':
            return '#f56c6c';
          case 'SUBMIT':
            return '#e6a23c';
          default:
            return '#909399';
        }
      },
    },
  });
})();
