export const REPORT_CATEGORIES = {
  'wip-aging': 'WIP 账龄分析',
  'completed-contract-deduction': '完成合同额核减',
} as const;

export type ReportCategory = keyof typeof REPORT_CATEGORIES;
export function isReportCategory(value: unknown): value is ReportCategory {
  return typeof value === 'string' && Object.hasOwn(REPORT_CATEGORIES, value);
}

export interface PdfReport {
  id: string;
  category: ReportCategory;
  title: string;
  period: string;
  unit: string;
  summary: string;
  fileName: string;
  fileSize: number;
  pageCount: number;
  createdAt: string;
  sample: boolean;
}

export const MAX_PDF_BYTES = 20 * 1024 * 1024;
