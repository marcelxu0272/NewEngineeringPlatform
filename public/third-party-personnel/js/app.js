/* global Vue */
(function () {
  var STORAGE_KEY = 'engineering-platform-third-party-personnel-v2';
  var PROJECT_MANAGEMENT_MAP = {
    B26107: '惠源中心',
    G26039: 'PMC板块',
    G26035: '新材料板块',
    C25061: '沈阳中心',
    G25058: '新材料板块',
  };
  var DEFAULT_PROJECT_OPTIONS = Object.keys(PROJECT_MANAGEMENT_MAP);

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

  function resolveManagement(project) {
    return PROJECT_MANAGEMENT_MAP[String(project || '').trim()] || '';
  }

  var IMPORT_TEMPLATE_HEADERS = [
    '公司名称',
    '姓名',
    '性别',
    '年龄',
    '所属项目',
    '岗位名称',
    '实际到岗时间',
    '项目周期',
    '联系电话',
    '周工作时间',
    '基本费率',
    '工作日加班费率',
    '周末加班费率',
    '法定假日加班费率',
    '人员状态',
    '离职时间',
  ];

  var IMPORT_FIELD_ALIASES = {
    companyName: ['公司名称', '公司', '企业名称', '单位名称'],
    name: ['姓名', '名字', '人员姓名'],
    gender: ['性别'],
    age: ['年龄'],
    project: ['所属项目', '项目', '项目名称'],
    positionName: ['岗位名称', '岗位', '职位'],
    arrivalDate: ['实际到岗时间', '到岗时间', '入职时间'],
    projectDuration: ['项目周期', '周期'],
    phone: ['联系电话', '电话', '手机号', '联系方式', '手机', '电话号码'],
    weeklyWorkTime: ['周工作时间', '工作时间'],
    baseRate: ['基本费率', '基本费率(元/小时)', '基本费率（元/小时）'],
    weekdayOvertimeRate: ['工作日加班费率', '工作日加班费率(元/小时)', '工作日加班费率（元/小时）'],
    weekendOvertimeRate: ['周末加班费率', '周末加班费率(元/小时)', '周末加班费率（元/小时）'],
    holidayOvertimeRate: ['法定假日加班费率', '法定假日加班费率(元/小时)', '法定假日加班费率（元/小时）'],
    status: ['人员状态', '状态'],
    leaveDate: ['离职时间'],
  };

  function normalizeImportFieldName(fieldName) {
    var trimmed = String(fieldName || '').trim();
    var keys = Object.keys(IMPORT_FIELD_ALIASES);
    for (var i = 0; i < keys.length; i++) {
      if (IMPORT_FIELD_ALIASES[keys[i]].indexOf(trimmed) > -1) return keys[i];
    }
    return trimmed;
  }

  function parseCSVLine(line) {
    var result = [];
    var current = '';
    var inQuotes = false;
    for (var i = 0; i < line.length; i++) {
      var char = line[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current);
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current);
    return result;
  }

  function parseDateString(dateStr) {
    if (!dateStr || !String(dateStr).trim()) {
      return { isValid: false, standardDate: '', error: '日期不能为空' };
    }
    var trimmedDate = String(dateStr).trim();
    var match = trimmedDate.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/);
    if (!match) {
      return { isValid: false, standardDate: '', error: '日期格式不正确，支持格式：YYYY-MM-DD 或 YYYY/M/D' };
    }
    var year = parseInt(match[1], 10);
    var month = parseInt(match[2], 10);
    var day = parseInt(match[3], 10);
    if (year < 1900 || year > 2100) return { isValid: false, standardDate: '', error: '年份必须在1900-2100之间' };
    if (month < 1 || month > 12) return { isValid: false, standardDate: '', error: '月份必须在1-12之间' };
    if (day < 1 || day > 31) return { isValid: false, standardDate: '', error: '日期必须在1-31之间' };
    var daysInMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    if ((year % 4 === 0 && year % 100 !== 0) || year % 400 === 0) daysInMonth[1] = 29;
    if (day > daysInMonth[month - 1]) {
      return { isValid: false, standardDate: '', error: month + '月最多' + daysInMonth[month - 1] + '天' };
    }
    var date = new Date(year, month - 1, day);
    if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
      return { isValid: false, standardDate: '', error: '无效的日期' };
    }
    return {
      isValid: true,
      standardDate: year + '-' + String(month).padStart(2, '0') + '-' + String(day).padStart(2, '0'),
      error: '',
    };
  }

  function validateOptionalRate(value, label, errors) {
    if (value === undefined || value === null || String(value).trim() === '') return;
    var num = Number(value);
    if (isNaN(num) || num < 0) errors.push(label + '须为不小于0的数字');
  }

  function validateImportRow(row) {
    var errors = [];
    if (!row.companyName || !String(row.companyName).trim()) errors.push('公司名称不能为空');
    if (!row.name || !String(row.name).trim()) errors.push('姓名不能为空');
    if (!row.gender || !String(row.gender).trim()) errors.push('性别不能为空');
    else if (['男', '女'].indexOf(String(row.gender).trim()) < 0) errors.push('性别只能是"男"或"女"');
    if (!row.age || !String(row.age).trim()) errors.push('年龄不能为空');
    else {
      var ageNum = parseInt(String(row.age), 10);
      if (isNaN(ageNum) || ageNum < 18 || ageNum > 65) errors.push('年龄必须是18-65之间的数字');
    }
    if (!row.project || !String(row.project).trim()) errors.push('所属项目不能为空');
    if (!row.positionName || !String(row.positionName).trim()) errors.push('岗位名称不能为空');
    if (!row.arrivalDate || !String(row.arrivalDate).trim()) errors.push('到岗时间不能为空');
    else {
      var dateResult = parseDateString(String(row.arrivalDate));
      if (!dateResult.isValid) errors.push('到岗时间' + dateResult.error);
      else row.arrivalDate = dateResult.standardDate;
    }
    if (!row.projectDuration || !String(row.projectDuration).trim()) errors.push('项目周期不能为空');
    if (!row.phone || !String(row.phone).trim()) errors.push('联系电话不能为空');
    else if (!/^1[3-9]\d{9}$/.test(String(row.phone).trim())) errors.push('联系电话格式不正确，应为11位手机号码');

    if (row.weeklyWorkTime && String(row.weeklyWorkTime).trim()) {
      if (!/^\d+(\.\d+)?\*\d+(\.\d+)?$/.test(String(row.weeklyWorkTime).trim())) {
        errors.push('周工作时间格式应为“天数*小时”，如 5*8');
      }
    }
    validateOptionalRate(row.baseRate, '基本费率', errors);
    validateOptionalRate(row.weekdayOvertimeRate, '工作日加班费率', errors);
    validateOptionalRate(row.weekendOvertimeRate, '周末加班费率', errors);
    validateOptionalRate(row.holidayOvertimeRate, '法定假日加班费率', errors);

    var statusText = row.status ? String(row.status).trim() : '';
    if (statusText && ['在岗', '离职'].indexOf(statusText) < 0) errors.push('人员状态只能是“在岗”或“离职”');
    var effectiveStatus = statusText === '离职' ? '离职' : '在岗';
    if (row.leaveDate && String(row.leaveDate).trim()) {
      var leaveResult = parseDateString(String(row.leaveDate));
      if (!leaveResult.isValid) errors.push('离职时间' + leaveResult.error);
      else row.leaveDate = leaveResult.standardDate;
    }
    if (effectiveStatus === '离职' && (!row.leaveDate || !String(row.leaveDate).trim())) {
      errors.push('离职状态下必须填写离职时间');
    }
    return { isValid: errors.length === 0, errors: errors };
  }

  function parseCSVText(text) {
    var lines = String(text || '')
      .replace(/^\ufeff/, '')
      .split(/\r?\n/)
      .filter(function (line) {
        return line.trim();
      });
    if (lines.length < 2) throw new Error('CSV文件至少需要包含标题行和数据行');
    var headers = parseCSVLine(lines[0]).map(function (h) {
      return String(h || '').trim();
    });
    var data = [];
    for (var i = 1; i < lines.length; i++) {
      var values = parseCSVLine(lines[i]);
      if (values.length !== headers.length) continue;
      var rec = {};
      headers.forEach(function (header, idx) {
        rec[header] = String(values[idx] || '').trim();
      });
      data.push(rec);
    }
    return data;
  }

  function validateImportData(raw) {
    var result = { total: raw.length, valid: 0, invalid: 0, data: [] };
    raw.forEach(function (row) {
      var normalized = {};
      Object.keys(row).forEach(function (key) {
        normalized[normalizeImportFieldName(key)] = row[key];
      });
      var validation = validateImportRow(normalized);
      result.data.push(
        Object.assign({}, normalized, {
          isValid: validation.isValid,
          errors: validation.errors,
        }),
      );
      if (validation.isValid) result.valid++;
      else result.invalid++;
    });
    return result;
  }

  function formatFileSize(bytes) {
    if (!bytes) return '0 Bytes';
    var k = 1024;
    var sizes = ['Bytes', 'KB', 'MB', 'GB'];
    var i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  function rowToPerson(row, id) {
    var status = String(row.status || '').trim() === '离职' ? '离职' : '在岗';
    return normalizePerson({
      id: id,
      companyName: row.companyName,
      name: row.name,
      gender: row.gender,
      age: row.age,
      project: row.project,
      positionName: row.positionName,
      arrivalDate: row.arrivalDate,
      projectDuration: row.projectDuration,
      phone: row.phone,
      weeklyWorkTime: row.weeklyWorkTime || '',
      baseRate: row.baseRate || 0,
      weekdayOvertimeRate: row.weekdayOvertimeRate || 0,
      weekendOvertimeRate: row.weekendOvertimeRate || 0,
      holidayOvertimeRate: row.holidayOvertimeRate || 0,
      status: status,
      leaveDate: status === '离职' ? row.leaveDate || '' : '',
      statusLogs: [],
    });
  }

  function defaultPerson() {
    return {
      id: null,
      companyName: '',
      name: '',
      gender: '',
      age: 28,
      project: '',
      positionName: '',
      arrivalDate: '',
      projectDuration: '',
      phone: '',
      weeklyWorkTime: '',
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
      positionName: String(person.positionName || ''),
      arrivalDate: String(person.arrivalDate || ''),
      projectDuration: String(person.projectDuration || ''),
      phone: String(person.phone || ''),
      weeklyWorkTime: String(person.weeklyWorkTime || ''),
      baseRate: Number(person.baseRate || 0),
      weekdayOvertimeRate: Number(person.weekdayOvertimeRate || 0),
      weekendOvertimeRate: Number(person.weekendOvertimeRate || 0),
      holidayOvertimeRate: Number(person.holidayOvertimeRate || 0),
      status: person.status === '离职' ? '离职' : '在岗',
      leaveDate: String(person.leaveDate || ''),
      statusLogs: Array.isArray(person.statusLogs) ? person.statusLogs : [],
    };
  }

  function initialList() {
    return [
      {
        id: 1,
        companyName: '上海克龙化工技术有限公司',
        name: '刘秀波',
        gender: '男',
        age: 42,
        project: 'B26107',
        positionName: '管道工程师',
        arrivalDate: '2026-09-01',
        projectDuration: '6个月',
        phone: '13817654321',
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
        companyName: '上海法谊工程项目管理有限公司',
        name: '宋扬',
        gender: '男',
        age: 44,
        project: 'G26039',
        positionName: '控制经理',
        arrivalDate: '2026-09-01',
        projectDuration: '24个月',
        phone: '13918273645',
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
        companyName: '上海法谊工程项目管理有限公司',
        name: '陈俊',
        gender: '男',
        age: 35,
        project: 'G26035',
        positionName: '施工副经理',
        arrivalDate: '2026-09-01',
        projectDuration: '16个月（暂定）',
        phone: '13765432198',
        weeklyWorkTime: '5*8',
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
        showImportDialog: false,
        importStep: 1,
        importFile: null,
        importFileName: '',
        importFileSizeLabel: '',
        importPreview: { total: 0, valid: 0, invalid: 0, data: [] },
        importResult: { success: false, imported: 0, message: '' },
        currentOperator: 'admin',
        dialogMode: 'create',
        personForm: defaultPerson(),
        editSnapshot: { status: '在岗', leaveDate: '' },
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
          positionName: [requiredRule('请输入岗位名称')],
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
          status: [requiredRule('请选择人员状态', 'change')],
          leaveDate: [
            {
              validator: (rule, value, callback) => {
                if (this.personForm.status === '离职' && !value) {
                  return callback(new Error('离职状态下必须填写离职时间'));
                }
                callback();
              },
              trigger: 'change',
            },
          ],
          weeklyWorkTime: [
            {
              validator: function (rule, value, callback) {
                if (!value) return callback();
                if (!/^\d+(\.\d+)?\*\d+(\.\d+)?$/.test(String(value))) {
                  return callback(new Error('格式应为“天数*小时”，如 5*8'));
                }
                callback();
              },
              trigger: 'blur',
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
        var logs = Array.isArray(this.personForm.statusLogs) ? this.personForm.statusLogs : [];
        return logs.slice().reverse();
      },
      formManagementAffiliation: function () {
        return resolveManagement(this.personForm.project) || '—';
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
        if (!val && !this.showImportDialog) this.unlockBodyScroll();
      },
      showImportDialog: function (val) {
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
      resolveManagement: resolveManagement,
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
        this.editSnapshot = { status: '在岗', leaveDate: '' };
        this.showPersonDialog = true;
        this.$nextTick(function () {
          if (this.$refs.personFormRef) this.$refs.personFormRef.clearValidate();
        });
      },
      openEdit: function (row) {
        this.dialogMode = 'edit';
        this.personForm = normalizePerson(row);
        this.editSnapshot = {
          status: this.personForm.status,
          leaveDate: this.personForm.leaveDate || '',
        };
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
      onPersonStatusChanged: function (status) {
        if (status === '离职' && !this.personForm.leaveDate) {
          this.personForm.leaveDate = todayStr();
        }
        if (status === '在岗') {
          this.personForm.leaveDate = '';
        }
      },
      savePerson: function () {
        var self = this;
        if (!this.$refs.personFormRef) return;
        this.$refs.personFormRef.validate(function (valid) {
          if (!valid) return;
          var payload = normalizePerson(self.personForm);
          if (payload.status !== '离职') {
            payload.leaveDate = '';
          }

          if (self.dialogMode === 'create') {
            payload.id = Date.now();
            payload.statusLogs = [];
            self.personnelList.push(payload);
            self.$message.success('人员信息添加成功');
          } else {
            var prevStatus = self.editSnapshot.status;
            var prevLeave = self.editSnapshot.leaveDate || '';
            var nextLeave = payload.leaveDate || '';
            if (prevStatus !== payload.status || prevLeave !== nextLeave) {
              var oldLogs = Array.isArray(payload.statusLogs) ? payload.statusLogs : [];
              payload.statusLogs = oldLogs.concat([
                {
                  operator: self.currentOperator,
                  operationTime: nowDateTimeStr(),
                  content:
                    '状态：' +
                    prevStatus +
                    ' -> ' +
                    payload.status +
                    '；离职时间：' +
                    (prevLeave || '-') +
                    ' -> ' +
                    (nextLeave || '-'),
                },
              ]);
            }
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
      resetImportState: function () {
        this.importStep = 1;
        this.importFile = null;
        this.importFileName = '';
        this.importFileSizeLabel = '';
        this.importPreview = { total: 0, valid: 0, invalid: 0, data: [] };
        this.importResult = { success: false, imported: 0, message: '' };
        if (this.$refs.importFileInput) this.$refs.importFileInput.value = '';
      },
      openImport: function () {
        this.resetImportState();
        this.showImportDialog = true;
      },
      closeImport: function () {
        this.showImportDialog = false;
      },
      onImportDialogClosed: function () {
        this.unlockBodyScroll();
        this.resetImportState();
      },
      triggerImportFile: function () {
        if (this.$refs.importFileInput) this.$refs.importFileInput.click();
      },
      setImportFile: function (file) {
        if (!file) return;
        var name = String(file.name || '');
        var ext = name.slice(name.lastIndexOf('.')).toLowerCase();
        if (['.csv', '.xlsx', '.xls'].indexOf(ext) < 0) {
          this.$message.error('请选择Excel(.xlsx, .xls)或CSV文件');
          return;
        }
        if (file.size > 10 * 1024 * 1024) {
          this.$message.error('文件大小不能超过10MB');
          return;
        }
        if (ext !== '.csv') {
          this.$message.warning('当前版本请将 Excel 另存为 CSV 后上传');
          return;
        }
        this.importFile = file;
        this.importFileName = name;
        this.importFileSizeLabel = formatFileSize(file.size);
      },
      onImportFileChange: function (e) {
        var file = e.target.files && e.target.files[0];
        this.setImportFile(file);
      },
      onImportDrop: function (e) {
        var file = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
        this.setImportFile(file);
      },
      clearImportFile: function () {
        this.importFile = null;
        this.importFileName = '';
        this.importFileSizeLabel = '';
        if (this.$refs.importFileInput) this.$refs.importFileInput.value = '';
      },
      downloadImportTemplate: function () {
        var example = [
          [
            '此条为示例数据请删除',
            '张三',
            '男',
            '28',
            'B26107',
            '管道工程师',
            '2024/1/15',
            '6个月',
            '13812345678',
            '5*8',
            '120',
            '160',
            '180',
            '240',
            '在岗',
            '',
          ],
          [
            '此条为示例数据请删除',
            '李四',
            '女',
            '30',
            'G26039',
            '控制经理',
            '2024-02-20',
            '3个月',
            '13987654321',
            '',
            '',
            '',
            '',
            '',
            '在岗',
            '',
          ],
        ];
        var csv = [IMPORT_TEMPLATE_HEADERS.join(',')].concat(example.map(function (row) {
          return row.join(',');
        })).join('\n');
        var blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
        var link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = '第三方人员管理_导入模板_' + todayStr() + '.csv';
        link.click();
        URL.revokeObjectURL(link.href);
        this.$message.success('CSV模板下载成功');
      },
      parseImportFile: function () {
        var self = this;
        if (!this.importFile) {
          this.$message.error('请先选择文件');
          return;
        }
        var reader = new FileReader();
        reader.onload = function (e) {
          try {
            var raw = parseCSVText(e.target.result);
            self.importPreview = validateImportData(raw);
            self.importStep = 2;
            self.$message.success('文件解析完成，共' + self.importPreview.total + '条记录');
          } catch (err) {
            self.$message.error('文件解析失败：' + (err.message || String(err)));
          }
        };
        reader.onerror = function () {
          self.$message.error('文件读取失败');
        };
        reader.readAsText(this.importFile, 'UTF-8');
      },
      confirmImport: function () {
        var self = this;
        try {
          var validRows = this.importPreview.data.filter(function (row) {
            return row.isValid;
          });
          if (!validRows.length) {
            this.$message.warning('没有可导入的有效记录');
            return;
          }
          var base = Date.now();
          var additions = validRows.map(function (row, idx) {
            return rowToPerson(row, base + idx);
          });
          this.personnelList = this.personnelList.concat(additions);
          this.importResult = { success: true, imported: additions.length, message: '' };
          this.importStep = 3;
          this.$message.success('成功导入' + additions.length + '条记录');
        } catch (err) {
          this.importResult = {
            success: false,
            imported: 0,
            message: err.message || '导入过程中发生未知错误',
          };
          this.importStep = 3;
          this.$message.error('导入失败：' + this.importResult.message);
        }
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
          '管理归属',
          '岗位名称',
          '到岗时间',
          '项目周期',
          '联系电话',
          '人员状态',
          '离职时间',
          '周工作时间',
          '基本费率(元/小时)',
          '工作日加班费率(元/小时)',
          '周末加班费率(元/小时)',
          '法定假日加班费率(元/小时)',
        ];
        var lines = this.filteredData.map(function (item, index) {
          return [
            index + 1,
            item.companyName,
            item.name,
            item.gender,
            item.age,
            item.project,
            resolveManagement(item.project) || '-',
            item.positionName,
            item.arrivalDate,
            item.projectDuration,
            item.phone,
            item.status,
            item.leaveDate || '-',
            item.weeklyWorkTime || '-',
            item.baseRate || '-',
            item.weekdayOvertimeRate || '-',
            item.weekendOvertimeRate || '-',
            item.holidayOvertimeRate || '-',
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
