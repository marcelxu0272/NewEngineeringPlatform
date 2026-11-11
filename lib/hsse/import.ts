import ExcelJS from 'exceljs';
import { HSSE_FIELDS, HsseValues, MAX_HSSE_VALUE, validPeriod, validValues } from './types';

export const IMPORT_HEADERS = ['年度', '月份', ...HSSE_FIELDS.map(field => field.label)];
export const MAX_IMPORT_BYTES = 4 * 1024 * 1024;
export type HsseImportRow = { rowNumber: number; year: number; month: number; values: HsseValues };
export class ImportValidationError extends Error {
  constructor(public issues: string[]) { super(issues.join('；')); }
}
const normalize = (value: unknown) => typeof value === 'string' ? value.replace(/\s+/g, '').trim() : '';
const empty = (value: unknown) => value === null || value === undefined || (typeof value === 'string' && !value.trim());

export async function parseHsseWorkbook(bytes: Buffer): Promise<{ rows: HsseImportRow[]; skipped: number }> {
  const workbook = new ExcelJS.Workbook();
  try { await workbook.xlsx.load(bytes as unknown as Parameters<typeof workbook.xlsx.load>[0]); }
  catch { throw new ImportValidationError(['文件无法读取，请使用未加密的.xlsx模板']); }
  const sheet = workbook.getWorksheet('HSSE月报') ?? (workbook.worksheets.length === 1 ? workbook.worksheets[0] : undefined);
  if (!sheet) throw new ImportValidationError(['未找到“HSSE月报”工作表']);
  if (sheet.rowCount > 1000 || sheet.columnCount > 30) throw new ImportValidationError(['工作表超出模板范围，请使用下载的宽表模板']);
  let headerRow = 0;
  const columns: number[] = [];
  for (let r = 1; r <= Math.min(10, sheet.rowCount); r++) {
    const row = sheet.getRow(r);
    const labels = Array.from({ length: sheet.columnCount }, (_, i) => normalize(row.getCell(i + 1).value));
    if (!labels.includes('年度') || !labels.includes('月份')) continue;
    const issues: string[] = [];
    for (const header of IMPORT_HEADERS) {
      const matches = labels.map((label, i) => label === normalize(header) ? i + 1 : 0).filter(Boolean);
      if (matches.length !== 1) issues.push(`第${r}行表头“${header}”${matches.length ? '重复' : '缺失'}`);
      columns.push(matches[0]);
    }
    labels.forEach((label, i) => { if (!empty(row.getCell(i + 1).value) && !IMPORT_HEADERS.some(h => normalize(h) === label)) issues.push(`第${r}行第${i + 1}列为未知表头`); });
    if (issues.length) throw new ImportValidationError(issues);
    headerRow = r; break;
  }
  if (!headerRow) throw new ImportValidationError(['前10行未找到完整表头，请使用下载的模板，不要修改列名']);
  const rows: HsseImportRow[] = [], issues: string[] = [];
  const seen = new Set<number>();
  let skipped = 0;
  for (let r = headerRow + 1; r <= sheet.rowCount; r++) {
    const row = sheet.getRow(r);
    const values = columns.map(column => row.getCell(column).value);
    if (values.slice(2).every(empty)) { if (values.some(v => !empty(v))) skipped++; continue; }
    const startIssues = issues.length;
    const yearText = String(values[0] ?? '').trim(), monthText = String(values[1] ?? '').trim();
    const year = Number(yearText), month = Number(monthText);
    if (!/^\d+$/.test(yearText) || !/^\d+$/.test(monthText) || !validPeriod(year, month)) issues.push(`第${r}行：年度须为2026，月份须为1—12`);
    else if (seen.has(month)) issues.push(`第${r}行：${month}月重复，每月只能一行`);
    else seen.add(month);
    const parsed = {} as HsseValues;
    HSSE_FIELDS.forEach(({ key, label }, i) => {
      const value = values[i + 2];
      const text = typeof value === 'number' || typeof value === 'string' ? String(value).trim() : '';
      if (!(key === 'hours' ? /^\d+(\.\d{1,6})?$/ : /^\d+$/).test(text)) {
        issues.push(`第${r}行“${label}”：${key === 'hours' ? '须为非负数，最多6位小数（百万人工时）' : '须为非负整数'}，不接受空白或公式`); return;
      }
      if (key === 'hours') {
        const [whole, fraction = ''] = text.split('.');
        parsed[key] = Number(whole) * 1_000_000 + Number(fraction.padEnd(6, '0'));
      } else parsed[key] = Number(text);
      if (!Number.isSafeInteger(parsed[key]) || parsed[key] > MAX_HSSE_VALUE) issues.push(`第${r}行“${label}”：数值超出支持范围`);
    });
    if (issues.length === startIssues) rows.push({ rowNumber: r, year, month, values: parsed });
    if (issues.length >= 50) break;
  }
  if (issues.length) throw new ImportValidationError(issues.slice(0, 50));
  if (!rows.length) throw new ImportValidationError(['没有可导入数据，请至少完整填写一个月份的11项指标']);
  return { rows: rows.sort((a, b) => a.month - b.month), skipped };
}

export function validImportRows(rows: unknown): rows is HsseImportRow[] {
  return Array.isArray(rows) && rows.length > 0 && rows.length <= 12
    && rows.every(row => row && validPeriod(row.year, row.month) && validValues(row.values))
    && new Set(rows.map(row => row.month)).size === rows.length;
}
