import {PdfReport} from '@/lib/pdf-reports/types';
export const button = 'inline-flex items-center justify-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 transition hover:bg-slate-50 disabled:cursor-wait disabled:opacity-50';
export const field = 'w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm outline-offset-2';
export const size = (bytes: number) => bytes < 1024 * 1024 ? `${(bytes / 1024).toFixed(1)} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`;
export const date = (value: string) => new Date(value).toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai', hour12: false });
export const fileUrl = (report: PdfReport) => `/api/pdf-reports/${encodeURIComponent(report.id)}/file`;
