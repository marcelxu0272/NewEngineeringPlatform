export type ThirdPartyPerson = {
  id: number;
  companyName: string;
  name: string;
  gender: string;
  age: number;
  project: string;
  positionName: string;
  arrivalDate: string;
  projectDuration: string;
  phone: string;
  weeklyWorkTime: string;
  baseRate: number;
  weekdayOvertimeRate: number;
  weekendOvertimeRate: number;
  holidayOvertimeRate: number;
  status: '在岗' | '离职';
  leaveDate: string;
};

export const THIRD_PARTY_STORAGE_KEY = 'engineering-platform-third-party-personnel-v2';

export const PROJECT_MANAGEMENT_MAP: Record<string, string> = {
  B26107: '惠源中心',
  G26039: 'PMC板块',
  G26035: '新材料板块',
  C25061: '沈阳中心',
  G25058: '新材料板块',
};

export const DEFAULT_PROJECT_OPTIONS = Object.keys(PROJECT_MANAGEMENT_MAP);

export function resolveManagementAffiliation(project: string): string {
  return PROJECT_MANAGEMENT_MAP[String(project || '').trim()] || '';
}

export const DEFAULT_PERSONNEL: ThirdPartyPerson[] = [
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
  },
];

export function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
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

export function parseDateString(dateStr: string): { isValid: boolean; standardDate: string; error: string } {
  if (!dateStr || !dateStr.toString().trim()) {
    return { isValid: false, standardDate: '', error: '日期不能为空' };
  }
  const trimmedDate = dateStr.toString().trim();
  const pattern = /^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/;
  const match = trimmedDate.match(pattern);
  if (!match) {
    return {
      isValid: false,
      standardDate: '',
      error: '日期格式不正确，支持格式：YYYY-MM-DD 或 YYYY/M/D',
    };
  }
  const year = parseInt(match[1], 10);
  const month = parseInt(match[2], 10);
  const day = parseInt(match[3], 10);
  if (year < 1900 || year > 2100) {
    return { isValid: false, standardDate: '', error: '年份必须在1900-2100之间' };
  }
  if (month < 1 || month > 12) {
    return { isValid: false, standardDate: '', error: '月份必须在1-12之间' };
  }
  if (day < 1 || day > 31) {
    return { isValid: false, standardDate: '', error: '日期必须在1-31之间' };
  }
  const daysInMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  if ((year % 4 === 0 && year % 100 !== 0) || year % 400 === 0) {
    daysInMonth[1] = 29;
  }
  if (day > daysInMonth[month - 1]) {
    return { isValid: false, standardDate: '', error: `${month}月最多${daysInMonth[month - 1]}天` };
  }
  const date = new Date(year, month - 1, day);
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
    return { isValid: false, standardDate: '', error: '无效的日期' };
  }
  const standardDate = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  return { isValid: true, standardDate, error: '' };
}

export const IMPORT_REQUIRED_HEADERS = [
  '公司名称',
  '姓名',
  '性别',
  '年龄',
  '所属项目',
  '岗位名称',
  '实际到岗时间',
  '项目周期',
  '联系电话',
] as const;

export const IMPORT_OPTIONAL_HEADERS = [
  '周工作时间',
  '基本费率',
  '工作日加班费率',
  '周末加班费率',
  '法定假日加班费率',
  '人员状态',
  '离职时间',
] as const;

export const IMPORT_TEMPLATE_HEADERS = [...IMPORT_REQUIRED_HEADERS, ...IMPORT_OPTIONAL_HEADERS];

const fieldMapping: Record<string, string[]> = {
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

function normalizeFieldName(fieldName: string): string {
  const trimmedFieldName = (fieldName || '').toString().trim();
  for (const [standardField, aliases] of Object.entries(fieldMapping)) {
    if (aliases.includes(trimmedFieldName)) {
      return standardField;
    }
  }
  return trimmedFieldName;
}

export type ImportRow = Record<string, string | number | undefined> & {
  isValid?: boolean;
  errors?: string[];
};

export type ImportPreview = {
  total: number;
  valid: number;
  invalid: number;
  data: ImportRow[];
};

function validateOptionalRate(value: string | number | undefined, label: string, errors: string[]) {
  if (value === undefined || value === null || String(value).trim() === '') return;
  const num = Number(value);
  if (Number.isNaN(num) || num < 0) {
    errors.push(`${label}须为不小于0的数字`);
  }
}

function validateImportRow(row: ImportRow): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  const companyName = row.companyName;
  const name = row.name;
  const gender = row.gender;
  const age = row.age;
  const project = row.project;
  const positionName = row.positionName;
  let arrivalDate = row.arrivalDate;
  const projectDuration = row.projectDuration;
  const phone = row.phone;
  const weeklyWorkTime = row.weeklyWorkTime;
  const status = row.status;
  let leaveDate = row.leaveDate;

  if (!companyName || !String(companyName).trim()) {
    errors.push('公司名称不能为空');
  }
  if (!name || !String(name).trim()) {
    errors.push('姓名不能为空');
  }
  if (!gender || !String(gender).trim()) {
    errors.push('性别不能为空');
  } else if (!['男', '女'].includes(String(gender).trim())) {
    errors.push('性别只能是"男"或"女"');
  }
  if (!age || !String(age).trim()) {
    errors.push('年龄不能为空');
  } else {
    const ageNum = parseInt(String(age), 10);
    if (Number.isNaN(ageNum) || ageNum < 18 || ageNum > 65) {
      errors.push('年龄必须是18-65之间的数字');
    }
  }
  if (!project || !String(project).trim()) {
    errors.push('所属项目不能为空');
  }
  if (!positionName || !String(positionName).trim()) {
    errors.push('岗位名称不能为空');
  }
  if (!arrivalDate || !String(arrivalDate).trim()) {
    errors.push('到岗时间不能为空');
  } else {
    const dateResult = parseDateString(String(arrivalDate));
    if (!dateResult.isValid) {
      errors.push(`到岗时间${dateResult.error}`);
    } else {
      row.arrivalDate = dateResult.standardDate;
      arrivalDate = dateResult.standardDate;
    }
  }
  if (!projectDuration || !String(projectDuration).trim()) {
    errors.push('项目周期不能为空');
  }
  if (!phone || !String(phone).trim()) {
    errors.push('联系电话不能为空');
  } else {
    const phoneRegex = /^1[3-9]\d{9}$/;
    if (!phoneRegex.test(String(phone).trim())) {
      errors.push('联系电话格式不正确，应为11位手机号码');
    }
  }

  if (weeklyWorkTime && String(weeklyWorkTime).trim()) {
    if (!/^\d+(\.\d+)?\*\d+(\.\d+)?$/.test(String(weeklyWorkTime).trim())) {
      errors.push('周工作时间格式应为“天数*小时”，如 5*8');
    }
  }

  validateOptionalRate(row.baseRate, '基本费率', errors);
  validateOptionalRate(row.weekdayOvertimeRate, '工作日加班费率', errors);
  validateOptionalRate(row.weekendOvertimeRate, '周末加班费率', errors);
  validateOptionalRate(row.holidayOvertimeRate, '法定假日加班费率', errors);

  const statusText = status ? String(status).trim() : '';
  if (statusText && !['在岗', '离职'].includes(statusText)) {
    errors.push('人员状态只能是“在岗”或“离职”');
  }
  const effectiveStatus = statusText === '离职' ? '离职' : '在岗';
  if (leaveDate && String(leaveDate).trim()) {
    const leaveResult = parseDateString(String(leaveDate));
    if (!leaveResult.isValid) {
      errors.push(`离职时间${leaveResult.error}`);
    } else {
      row.leaveDate = leaveResult.standardDate;
      leaveDate = leaveResult.standardDate;
    }
  }
  if (effectiveStatus === '离职' && (!leaveDate || !String(leaveDate).trim())) {
    errors.push('离职状态下必须填写离职时间');
  }

  return { isValid: errors.length === 0, errors };
}

export function validateImportData(raw: Record<string, string>[], _projectList?: string[]): ImportPreview {
  const result: ImportPreview = {
    total: raw.length,
    valid: 0,
    invalid: 0,
    data: [],
  };

  raw.forEach((row) => {
    const normalizedRow: ImportRow = {};
    Object.keys(row).forEach((key) => {
      const nk = normalizeFieldName(key);
      normalizedRow[nk] = row[key];
    });
    const validation = validateImportRow(normalizedRow);
    const withMeta = {
      ...normalizedRow,
      isValid: validation.isValid,
      errors: validation.errors,
    } as ImportRow;
    result.data.push(withMeta);
    if (validation.isValid) {
      result.valid++;
    } else {
      result.invalid++;
    }
  });

  return result;
}

export function rowToThirdPartyPerson(row: ImportRow, id: number): ThirdPartyPerson {
  const status = String(row.status || '').trim() === '离职' ? '离职' : '在岗';
  return {
    id,
    companyName: String(row.companyName ?? '').trim(),
    name: String(row.name ?? '').trim(),
    gender: String(row.gender ?? '').trim(),
    age: parseInt(String(row.age ?? '0'), 10) || 0,
    project: String(row.project ?? '').trim(),
    positionName: String(row.positionName ?? '').trim(),
    arrivalDate: String(row.arrivalDate ?? '').trim(),
    projectDuration: String(row.projectDuration ?? '').trim(),
    phone: String(row.phone ?? '').trim(),
    weeklyWorkTime: String(row.weeklyWorkTime ?? '').trim(),
    baseRate: Number(row.baseRate) || 0,
    weekdayOvertimeRate: Number(row.weekdayOvertimeRate) || 0,
    weekendOvertimeRate: Number(row.weekendOvertimeRate) || 0,
    holidayOvertimeRate: Number(row.holidayOvertimeRate) || 0,
    status,
    leaveDate: status === '离职' ? String(row.leaveDate ?? '').trim() : '',
  };
}

export async function parseCSVFile(file: File): Promise<Record<string, string>[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const lines = text.split('\n').filter((line) => line.trim());
        if (lines.length < 2) {
          reject(new Error('CSV文件至少需要包含标题行和数据行'));
          return;
        }
        const headers = parseCSVLine(lines[0]);
        const data: Record<string, string>[] = [];
        for (let i = 1; i < lines.length; i++) {
          const values = parseCSVLine(lines[i]);
          if (values.length === headers.length) {
            const rec: Record<string, string> = {};
            headers.forEach((header, idx) => {
              rec[(header || '').toString().trim()] = (values[idx] || '').toString().trim();
            });
            data.push(rec);
          }
        }
        resolve(data);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(new Error('文件读取失败'));
    reader.readAsText(file, 'UTF-8');
  });
}
