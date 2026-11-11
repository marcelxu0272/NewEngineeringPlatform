import { NextRequest, NextResponse } from 'next/server';
import { PDFDocument } from 'pdf-lib';
import { addReport, ensureReports, listReports } from '@/lib/pdf-reports/store';
import { isReportCategory, MAX_PDF_BYTES } from '@/lib/pdf-reports/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
const fail = (error: string, status = 400) => NextResponse.json({ error }, { status });

export async function GET(request: NextRequest) {
  const category = request.nextUrl.searchParams.get('category');
  if (!isReportCategory(category)) return fail('请选择有效的报告类别');
  try {
    await ensureReports();
    return NextResponse.json({ reports: listReports(category) });
  } catch (error) {
    console.error('PDF reports list:', error);
    return fail('报告列表加载失败，请重试', 500);
  }
}

export async function POST(request: NextRequest) {
  // Basic local-demo storage; no publication or access-control workflow in this iteration.
  if (Number(request.headers.get('content-length')) > MAX_PDF_BYTES + 65536) return fail('PDF 大小不能超过 20 MB', 413);
  try {
    const form = await request.formData();
    const category = form.get('category');
    const title = String(form.get('title') || '').trim();
    const period = String(form.get('period') || '');
    const unit = String(form.get('unit') || '').trim();
    const summary = String(form.get('summary') || '').trim();
    const file = form.get('file');
    if (!isReportCategory(category)) return fail('报告类别无效');
    if (!title || title.length > 120) return fail('请填写 1–120 字的报告标题');
    if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(period)) return fail('请填写有效报告期');
    if (!unit || unit.length > 100 || summary.length > 2000) return fail('组织归属或摘要不符合要求');
    if (!file || typeof file === 'string' || !/\.pdf$/i.test(file.name)) return fail('请选择 PDF 文件');
    if (!file.size || file.size > MAX_PDF_BYTES) return fail('请选择非空且不超过 20 MB 的 PDF', 413);
    const bytes = Buffer.from(await file.arrayBuffer());
    if (!bytes.subarray(0, 1024).includes(Buffer.from('%PDF-'))) return fail('文件内容不是有效 PDF');
    let pages: number;
    try {
      const pdf = await PDFDocument.load(bytes);
      pages = pdf.getPageCount();
      if (!pages || pages > 1000) return fail('仅支持 1–1000 页的 PDF');
    } catch { return fail('PDF 损坏或已加密，请使用可正常打开的未加密 PDF'); }
    await ensureReports();
    const report = addReport({ category, title, period, unit, summary,
      fileName: file.name.slice(0, 240), fileSize: bytes.length, pageCount: pages }, bytes);
    return NextResponse.json({ report }, { status: 201 });
  } catch (error) {
    console.error('PDF reports upload:', error);
    return fail('上传失败，请检查文件后重试', 500);
  }
}
