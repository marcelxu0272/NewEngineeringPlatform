import { NextRequest, NextResponse } from 'next/server';
import { ImportValidationError, MAX_IMPORT_BYTES, parseHsseWorkbook, validImportRows } from '@/lib/hsse/import';
import { readHsse, saveHsseBatch } from '@/lib/hsse/store';
import { validPeriod } from '@/lib/hsse/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
const response = (data: unknown, status = 200) => NextResponse.json(data, { status, headers: { 'Cache-Control': 'no-store' } });

export async function POST(request: NextRequest) {
  if (Number(request.headers.get('content-length')) > MAX_IMPORT_BYTES + 65536) return response({ error: 'Excel文件不能超过4MB' }, 413);
  try {
    const form = await request.formData();
    const file = form.get('file');
    if (!file || typeof file === 'string' || !/\.xlsx$/i.test(file.name)) return response({ error: '请选择.xlsx格式的Excel文件' }, 400);
    if (!file.size || file.size > MAX_IMPORT_BYTES) return response({ error: '请选择非空且不超过4MB的Excel文件' }, 400);
    const parsed = await parseHsseWorkbook(Buffer.from(await file.arrayBuffer()));
    const existing = readHsse(2026, 12).missingMonths;
    return response({ ...parsed, rows: parsed.rows.map(row => ({ ...row, action: existing.includes(row.month) ? '新增' : '覆盖' })) });
  } catch (error) {
    if (error instanceof ImportValidationError) return response({ error: 'Excel校验未通过，未导入任何数据', issues: error.issues }, 400);
    console.error('HSSE import preview:', error);
    return response({ error: '文件校验失败，请检查文件后重试' }, 500);
  }
}

export async function PUT(request: NextRequest) {
  let input;
  try { input = await request.json(); }
  catch { return response({ error: '导入内容无效，请重新上传Excel' }, 400); }
  if (!input || !validPeriod(input.year, input.month) || !validImportRows(input.rows)) return response({ error: '月报数据不完整、月份重复或数值无效，整批未保存' }, 400);
  try { return response({ data: saveHsseBatch(input.rows, input.year, input.month), count: input.rows.length }); }
  catch (error) {
    console.error('HSSE import save:', error);
    return response({ error: '批量保存失败，整批未保存，请重试' }, 500);
  }
}
