import { NextRequest, NextResponse } from 'next/server';
import { readHsse, saveHsse } from '@/lib/hsse/store';
import { validPeriod, validValues } from '@/lib/hsse/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
const response = (body: unknown, status = 200) => NextResponse.json(body, { status, headers: { 'Cache-Control': 'no-store' } });
export async function GET(request: NextRequest) {
  const year = Number(request.nextUrl.searchParams.get('year'));
  const month = Number(request.nextUrl.searchParams.get('month'));
  if (!validPeriod(year, month)) return response({ error: '请选择2026年1—12月' }, 400);
  try { return response(readHsse(year, month)); }
  catch (error) { console.error('HSSE read:', error); return response({ error: '数据加载失败，请重试' }, 500); }
}
export async function PUT(request: NextRequest) {
  let input;
  try { input = await request.json(); }
  catch { return response({ error: '请求内容不是有效JSON' }, 400); }
  if (!input || !validPeriod(input.year, input.month) || !validValues(input.values)) {
    return response({ error: '请完整填写有效月报：次数为非负整数，人工时为非负整数小时，数值须在支持范围内' }, 400);
  }
  try { return response(saveHsse(input.year, input.month, input.values)); }
  catch (error) { console.error('HSSE save:', error); return response({ error: '保存失败，输入已保留，请重试' }, 500); }
}
