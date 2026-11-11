export const HSSE_FIELDS = [
  { key: 'f', lines: ['F'], label: 'F', color: '#ff0000' },
  { key: 'lti', lines: ['LTI', '损失工时'], label: 'LTI 损失工时', color: '#ffc000' },
  { key: 'rwc', lines: ['RWC', '工作受限事件'], label: 'RWC 工作受限事件', color: '#ffc000' },
  { key: 'mtc', lines: ['MTC医院医疗处理'], label: 'MTC 医院医疗处理', color: '#ffc000' },
  { key: 'fac', lines: ['FAC现场医疗处理'], label: 'FAC 现场医疗处理', color: '#808080' },
  { key: 'hipo', lines: ['HiPo INCIDENT', '高风险事件'], label: 'HiPo INCIDENT 高风险事件', color: '#808080' },
  { key: 'property', lines: ['PROPERTY DAMAGE & SECURITY', '财产损失和安保事件'], label: 'PROPERTY DAMAGE & SECURITY 财产损失和安保事件', color: '#808080' },
  { key: 'environment', lines: ['ENVIRONMENT环境事件'], label: 'ENVIRONMENT 环境事件', color: '#808080' },
  { key: 'nearMiss', lines: ['NEAR MISS未遂事件'], label: 'NEAR MISS 未遂事件', color: '#808080' },
  { key: 'bbso', lines: ['BEHAVIORAL BASED SAFETY OBSERVATION (BBSO)', '安全观察'], label: 'BBSO 安全观察', color: '#00b050' },
  { key: 'hours', lines: ['AT RISK HOURS人工时/百万'], label: 'AT RISK HOURS 人工时（百万）', color: '#00b050' },
] as const;

export type HsseKey = typeof HSSE_FIELDS[number]['key'];
/** hours is stored/transferred as integer hours; the form displays millions. */
export type HsseValues = Record<HsseKey, number>;
export type HsseMonth = HsseValues & { year: number; month: number; updatedAt: string };
export type HsseResult = {
  year: number; month: number; current: HsseMonth | null;
  cumulative: HsseValues | null; missingMonths: number[];
};

// Keep twelve-month totals and the four-category Recordables sum safely integral.
export const MAX_HSSE_VALUE = Math.floor(Number.MAX_SAFE_INTEGER / 48);
export function validPeriod(year: unknown, month: unknown): boolean {
  return year === 2026 && Number.isInteger(month) && Number(month) >= 1 && Number(month) <= 12;
}
export function validValues(value: unknown): value is HsseValues {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const values = value as Record<string, unknown>;
  return HSSE_FIELDS.every(({ key }) => typeof values[key] === 'number'
    && Number.isSafeInteger(values[key]) && Number(values[key]) >= 0 && Number(values[key]) <= MAX_HSSE_VALUE);
}
export function recordables(values: HsseValues): number {
  return values.f + values.lti + values.rwc + values.mtc;
}
export function formatHsse(key: HsseKey, value: number): string {
  return key === 'hours' ? `${(value / 1_000_000).toFixed(6).replace(/\.?0+$/, '') || '0'}M` : String(value);
}
