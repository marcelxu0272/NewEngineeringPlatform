/* global Vue */
(function () {
  var STORAGE_KEY = 'engineering-platform-third-party-personnel-v1';
  var DEFAULT_PROJECT_OPTIONS = ['项目A', '项目B', '项目C', '项目D', 'D25999', '智慧城市项目'];

  function todayStr() {
    return new Date().toISOString().slice(0, 10);
  }

  function nowDateTimeStr() {
    var d = new Date();
    var yyyy = d.getFullYear();
    var mm = String(d.getMonth() + 1).padStart(2, '0');
    var dd = String(d.getDate()).padStart(2, '0');
    var hh = String(d.getHours()).padStart(2, '0');
    var mi = String(d.getMinutes()).padStart(2, '0');
    var ss = String(d.getSeconds()).padStart(2, '0');
    return yyyy + '-' + mm + '-' + dd + ' ' + hh + ':' + mi + ':' + ss;
  }

  function requiredRule(message, trigger) {
    return { required: true, message: message, trigger: trigger || 'blur' };
  }

  function defaultPerson() {
    return {
      id: null,
      companyName: '',
      name: '',
      gender: '',
      age: 28,
      project: '',
      arrivalDate: '',
      projectDuration: '',
      phone: '',
      weeklyWorkTime: '5*8',
      baseRate: 0,
      weekdayOvertimeRate: 0,
      weekendOvertimeRate: 0,
      holidayOvertimeRate: 0,
      status: '在岗',
      leaveDate: '',
      statusLogs: [],
    };
  }

  function normalizePerson(person) {
    return {
      id: Number(person.id || Date.now()),
      companyName: String(person.companyName || ''),
      name: String(person.name || ''),
      gender: String(person.gender || ''),
      age: Number(person.age || 0),
      project: String(person.project || ''),
      arrivalDate: String(person.arrivalDate || ''),
      projectDuration: String(person.projectDuration || ''),
      phone: String(person.phone || ''),
      weeklyWorkTime: String(person.weeklyWorkTime || '5*8'),
      baseRate: Number(person.baseRate || 0),
      weekdayOvertimeRate: Number(person.weekdayOvertimeRate || 0),
      weekendOvertimeRate: Number(person.weekendOvertimeRate || 0),
      holidayOvertimeRate: Number(person.holidayOvertimeRate || 0),
      status: person.status === '离岗' ? '离岗' : '在岗',
      leaveDate: String(person.leaveDate || ''),
      statusLogs: Array.isArray(person.statusLogs) ? person.statusLogs : [],
    };
  }

  function initialList() {
    return [
      {
        id: 1,
        companyName: '北京科技有限公司',
        name: '张三',
        gender: '男',
        age: 28,
        project: '项目A',
        arrivalDate: '2024-01-15',
        projectDuration: '6个月',
        phone: '13812345678',
        weeklyWorkTime: '5*8',
        baseRate: 120,
        weekdayOvertimeRate: 160,
        weekendOvertimeRate: 180,
        holidayOvertimeRate: 240,
        status: '在岗',
        leaveDate: '',
        statusLogs: [],
      },
      {
        id: 2,
        companyName: '上海软件开发公司',
        name: '李四',
        gender: '女',
        age: 32,
        project: '项目B',
        arrivalDate: '2024-02-01',
        projectDuration: '3个月',
        phone: '13987654321',
        weeklyWorkTime: '5*8',
        baseRate: 135,
        weekdayOvertimeRate: 175,
        weekendOvertimeRate: 195,
        holidayOvertimeRate: 255,
        status: '在岗',
        leaveDate: '',
        statusLogs: [],
      },
      {
        id: 3,
        companyName: '广州信息技术有限公司',
        name: '王五',
        gender: '男',
        age: 35,
        project: '项目A',
        arrivalDate: '2024-01-20',
        projectDuration: '12个月',
        phone: '13765432198',
        weeklyWorkTime: '6*8',
        baseRate: 140,
        weekdayOvertimeRate: 185,
        weekendOvertimeRate: 210,
        holidayOvertimeRate: 280,
        status: '在岗',
        leaveDate: '',
        statusLogs: [],
      },
    ];
  }

  new Vue({
    el: '#app',
    data: function () {
      return {
        personnelList: [],
        draftFilter: { keyword: '', project: '' },
        appliedFilter: { keyword: '', project: '' },
        currentPage: 1,
        pageSize: 10,
        showPersonDialog: false,
        showStatusDialog: false,
        currentOperator: 'admin',
        dialogMode: 'create',
        personForm: defaultPerson(),
        statusForm: { id: null, name: '', status: '在岗', leaveDate: '', statusLogs: [] },
        personRules: {
          companyName: [requiredRule('请选择或输入公司名称')],
          name: [requiredRule('请输入姓名')],
          gender: [requiredRule('请选择性别', 'change')],
          age: [
            requiredRule('请输入年龄', 'change'),
            {
              validator: function (rule, value, callback) {
                if (value < 18 || value > 65) return callback(new Error('年龄必须在18到65之间'));
                callback();
              },
              trigger: 'change',
            },
          ],
          project: [requiredRule('请选择所属项目', 'change')],
          arrivalDate: [requiredRule('请选择实际到岗时间', 'change')],
          projectDuration: [requiredRule('请输入项目周期')],
          phone: [
            requiredRule('请输入联系电话'),
            {
              pattern: /^1[3-9]\d{9}$/,
              message: '请输入11位手机号',
              trigger: 'blur',
            },
          ],
          weeklyWorkTime: [
            requiredRule('请输入周工作时间'),
            {
              pattern: /^\d+(\.\d+)?\*\d+(\.\d+)?$/,
              message: '格式应为“天数*小时”，如 5*8',
              trigger: 'blur',
            },
          ],
          baseRate: [requiredRule('请输入基本费率', 'change')],
          weekdayOvertimeRate: [requiredRule('请输入工作日加班费率', 'change')],
          weekendOvertimeRate: [requiredRule('请输入周末加班费率', 'change')],
          holidayOvertimeRate: [requiredRule('请输入法定假日加班费率', 'change')],
        },
        statusRules: {
          status: [requiredRule('请选择人员状态', 'change')],
          leaveDate: [
            {
              validator: (rule, value, callback) => {
                if (this.statusForm.status === '离岗' && !value) return callback(new Error('离岗状态下必须填写离岗时间'));
                callback();
              },
              trigger: 'change',
            },
          ],
        },
      };
    },
    computed: {
      projectOptions: function () {
        var set = {};
        DEFAULT_PROJECT_OPTIONS.forEach(function (item) {
          set[item] = true;
        });
        this.personnelList.forEach(function (item) {
          if (item.project) set[item.project] = true;
        });
        return Object.keys(set);
      },
      companyOptions: function () {
        var set = {};
        this.personnelList.forEach(function (item) {
          var name = String(item.companyName || '').trim();
          if (name) set[name] = true;
        });
        return Object.keys(set);
      },
      companyCount: function () {
        var set = {};
        this.personnelList.forEach(function (item) {
          set[item.companyName] = true;
        });
        return Object.keys(set).length;
      },
      projectCount: function () {
        var set = {};
        this.personnelList.forEach(function (item) {
          set[item.project] = true;
        });
        return Object.keys(set).length;
      },
      filteredData: function () {
        var keyword = (this.appliedFilter.keyword || '').toLowerCase();
        var project = this.appliedFilter.project;
        return this.personnelList.filter(function (person) {
          var keywordOk =
            !keyword ||
            person.name.toLowerCase().indexOf(keyword) > -1 ||
            person.companyName.toLowerCase().indexOf(keyword) > -1;
          var projectOk = !project || person.project === project;
          return keywordOk && projectOk;
        });
      },
      pagedData: function () {
        var start = (this.currentPage - 1) * this.pageSize;
        return this.filteredData.slice(start, start + this.pageSize);
      },
      statusLogsForDisplay: function () {
        var logs = Array.isArray(this.statusForm.statusLogs) ? this.statusForm.statusLogs : [];
        return logs.slice().reverse();
      },
    },
    watch: {
      personnelList: {
        deep: true,
        handler: function (list) {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
        },
      },
      showPersonDialog: function (val) {
        if (!val && !this.showStatusDialog) this.unlockBodyScroll();
      },
      showStatusDialog: function (val) {
        if (!val && !this.showPersonDialog) this.unlockBodyScroll();
      },
    },
    created: function () {
      try {
        var raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
          var parsed = JSON.parse(raw);
          if (Array.isArray(parsed) && parsed.length) {
            this.personnelList = parsed.map(normalizePerson);
            return;
          }
        }
      } catch (e) {
        // ignore
      }
      this.personnelList = initialList().map(normalizePerson);
    },
    methods: {
      lockBodyScroll: function () {
        document.body.classList.add('modal-open');
      },
      unlockBodyScroll: function () {
        document.body.classList.remove('modal-open');
      },
      applyFilter: function () {
        this.appliedFilter = {
          keyword: this.draftFilter.keyword || '',
          project: this.draftFilter.project || '',
        };
        this.currentPage = 1;
      },
      resetFilter: function () {
        this.draftFilter = { keyword: '', project: '' };
        this.appliedFilter = { keyword: '', project: '' };
        this.currentPage = 1;
      },
      openAdd: function () {
        this.dialogMode = 'create';
        this.personForm = defaultPerson();
        this.showPersonDialog = true;
        this.$nextTick(function () {
          if (this.$refs.personFormRef) this.$refs.personFormRef.clearValidate();
        });
      },
      openEdit: function (row) {
        this.dialogMode = 'edit';
        this.personForm = normalizePerson(row);
        this.showPersonDialog = true;
        this.$nextTick(function () {
          if (this.$refs.personFormRef) this.$refs.personFormRef.clearValidate();
        });
      },
      queryCompanySuggestions: function (queryString, cb) {
        var keyword = String(queryString || '').trim().toLowerCase();
        var list = this.companyOptions
          .filter(function (item) {
            return !keyword || item.toLowerCase().indexOf(keyword) > -1;
          })
          .map(function (item) {
            return { value: item };
          });
        cb(list);
      },
      onCompanySelect: function (item) {
        this.personForm.companyName = item.value;
      },
      validateForm: function () {
        var f = this.personForm;
        if (!f.companyName || f.companyName.length < 2) return '请输入有效的公司名称';
        if (!f.name || f.name.length < 2) return '请输入有效的姓名';
        if (!f.gender) return '请选择性别';
        if (f.age < 18 || f.age > 65) return '年龄必须在18到65之间';
        if (!f.project) return '请选择所属项目';
        if (!f.arrivalDate) return '请选择到岗时间';
        if (!f.projectDuration || f.projectDuration.length < 2) return '请输入项目周期';
        if (!/^1[3-9]\d{9}$/.test(f.phone)) return '请输入正确的11位手机号码';
        if (!/^\d+(\.\d+)?\*\d+(\.\d+)?$/.test(f.weeklyWorkTime)) return '周工作时间格式应为“天数*小时”';
        if (f.baseRate <= 0) return '请输入有效的基本费率';
        if (f.weekdayOvertimeRate <= 0) return '请输入有效的工作日加班费率';
        if (f.weekendOvertimeRate <= 0) return '请输入有效的周末加班费率';
        if (f.holidayOvertimeRate <= 0) return '请输入有效的法定假日加班费率';
        return '';
      },
      savePerson: function () {
        var self = this;
        if (!this.$refs.personFormRef) return;
        this.$refs.personFormRef.validate(function (valid) {
          if (!valid) return;
          var payload = normalizePerson(self.personForm);
          if (self.dialogMode === 'create') {
            payload.id = Date.now();
            self.personnelList.push(payload);
            self.$message.success('人员信息添加成功');
          } else {
            self.personnelList = self.personnelList.map(function (item) {
              return item.id === payload.id ? payload : item;
            });
            self.$message.success('人员信息更新成功');
          }
          self.showPersonDialog = false;
        });
      },
      deletePerson: function (id) {
        var self = this;
        this.$confirm('确定要删除该人员信息吗？', '确认删除', { type: 'warning' })
          .then(function () {
            self.personnelList = self.personnelList.filter(function (item) {
              return item.id !== id;
            });
            self.$message.success('删除成功');
          })
          .catch(function () {});
      },
      openStatus: function (row) {
        this.statusForm = {
          id: row.id,
          name: row.name,
          status: row.status,
          leaveDate: row.leaveDate || (row.status === '离岗' ? todayStr() : ''),
          statusLogs: Array.isArray(row.statusLogs) ? row.statusLogs.slice() : [],
        };
        this.showStatusDialog = true;
        this.$nextTick(function () {
          if (this.$refs.statusFormRef) this.$refs.statusFormRef.clearValidate();
        });
      },
      onStatusChanged: function (status) {
        if (status === '离岗' && !this.statusForm.leaveDate) {
          this.statusForm.leaveDate = todayStr();
        }
        if (status === '在岗') {
          this.statusForm.leaveDate = '';
        }
      },
      saveStatus: function () {
        var self = this;
        if (!this.$refs.statusFormRef) return;
        this.$refs.statusFormRef.validate(function (valid) {
          if (!valid) return;
          var form = self.statusForm;
          var currentOperator = self.currentOperator;
          var operationTime = nowDateTimeStr();
          self.personnelList = self.personnelList.map(function (item) {
            if (item.id !== form.id) return item;
            var previousStatus = item.status;
            var previousLeaveDate = item.leaveDate || '-';
            var nextLeaveDate = form.status === '离岗' ? form.leaveDate : '';
            var operationContent =
              '状态：' +
              previousStatus +
              ' -> ' +
              form.status +
              '；离岗时间：' +
              previousLeaveDate +
              ' -> ' +
              (nextLeaveDate || '-');
            var oldLogs = Array.isArray(item.statusLogs) ? item.statusLogs : [];
            var nextLogs = oldLogs.concat([
              {
                operator: currentOperator,
                operationTime: operationTime,
                content: operationContent,
              },
            ]);
            return {
              id: item.id,
              companyName: item.companyName,
              name: item.name,
              gender: item.gender,
              age: item.age,
              project: item.project,
              arrivalDate: item.arrivalDate,
              projectDuration: item.projectDuration,
              phone: item.phone,
              weeklyWorkTime: item.weeklyWorkTime,
              baseRate: item.baseRate,
              weekdayOvertimeRate: item.weekdayOvertimeRate,
              weekendOvertimeRate: item.weekendOvertimeRate,
              holidayOvertimeRate: item.holidayOvertimeRate,
              status: form.status,
              leaveDate: nextLeaveDate,
              statusLogs: nextLogs,
            };
          });
          self.showStatusDialog = false;
          self.$message.success('状态信息更新成功');
        });
      },
      exportData: function () {
        if (!this.filteredData.length) {
          this.$message.warning('没有数据可以导出');
          return;
        }
        var headers = [
          '序号',
          '公司名称',
          '姓名',
          '性别',
          '年龄',
          '所属项目',
          '到岗时间',
          '项目周期',
          '周工作时间',
          '基本费率(元/小时)',
          '工作日加班费率(元/小时)',
          '周末加班费率(元/小时)',
          '法定假日加班费率(元/小时)',
          '人员状态',
          '离岗时间',
          '联系电话',
        ];
        var lines = this.filteredData.map(function (item, index) {
          return [
            index + 1,
            item.companyName,
            item.name,
            item.gender,
            item.age,
            item.project,
            item.arrivalDate,
            item.projectDuration,
            item.weeklyWorkTime,
            item.baseRate,
            item.weekdayOvertimeRate,
            item.weekendOvertimeRate,
            item.holidayOvertimeRate,
            item.status,
            item.leaveDate || '-',
            item.phone,
          ].join(',');
        });
        var csv = [headers.join(',')].concat(lines).join('\n');
        var blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
        var link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = '第三方人员管理_' + todayStr() + '.csv';
        link.click();
        URL.revokeObjectURL(link.href);
        this.$message.success('数据导出成功');
      },
    },
  });
})();
