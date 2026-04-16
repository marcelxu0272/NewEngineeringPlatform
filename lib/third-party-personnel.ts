export type ThirdPartyPerson = {
  id: number;
  companyName: string;
  name: string;
  gender: string;
  age: number;
  project: string;
  arrivalDate: string;
  projectDuration: string;
  phone: string;
};

export const THIRD_PARTY_STORAGE_KEY = 'engineering-platform-third-party-personnel-v1';

export const DEFAULT_PROJECT_OPTIONS = ['项目A', '项目B', '项目C', '项目D', 'D25999', '智慧城市项目'];

export const DEFAULT_PERSONNEL: ThirdPartyPerson[] = [
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

const fieldMapping: Record<string, string[]> = {
  companyName: ['公司名称', '公司', '企业名称', '单位名称'],
  name: ['姓名', '名字', '人员姓名'],
  gender: ['性别'],
  age: ['年龄'],
  project: ['所属项目', '项目', '项目名称'],
  arrivalDate: ['实际到岗时间', '到岗时间', '入职时间'],
  projectDuration: ['项目周期', '周期'],
  phone: ['联系电话', '电话', '手机号', '联系方式', '手机', '电话号码'],
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

function validateImportRow(
  row: ImportRow,
  projectList: string[],
): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  const companyName = row.companyName;
  const name = row.name;
  const gender = row.gender;
  const age = row.age;
  const project = row.project;
  let arrivalDate = row.arrivalDate;
  const projectDuration = row.projectDuration;
  const phone = row.phone;

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
  } else if (!projectList.includes(String(project).trim())) {
    errors.push(`项目"${project}"不在可选项目列表中`);
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

  return { isValid: errors.length === 0, errors };
}

export function validateImportData(raw: Record<string, string>[], projectList: string[]): ImportPreview {
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
    const validation = validateImportRow(normalizedRow, projectList);
    const withMeta: ImportRow = {
      ...normalizedRow,
      isValid: validation.isValid,
      errors: validation.errors,
    };
    result.data.push(withMeta);
    if (validation.isValid) {
      result.valid++;
    } else {
      result.invalid++;
    }
  });

  return result;
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
