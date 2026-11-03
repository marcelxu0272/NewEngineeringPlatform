import { NextResponse } from 'next/server';
import { presentCatalog, readCatalog, saveCatalog } from '@/lib/catalog';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

function message(error: unknown) {
  return error instanceof Error ? error.message : '目录操作失败';
}

export async function GET() {
  try {
    return NextResponse.json({ items: presentCatalog(readCatalog()) });
  } catch (error) {
    console.error('Catalog API error:', error);
    return NextResponse.json({ error: message(error) }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body: unknown = await request.json();
    const items = body && typeof body === 'object' ? (body as { items?: unknown }).items : undefined;
    return NextResponse.json({ items: saveCatalog(items) });
  } catch (error) {
    console.error('Catalog API error:', error);
    const text = message(error);
    const status = text === '目录文件格式不正确' ? 500 : 400;
    return NextResponse.json({ error: text }, { status });
  }
}
