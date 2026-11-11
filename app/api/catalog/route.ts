import { NextResponse } from 'next/server';
import { presentCatalog, readCatalog } from '@/lib/catalog';

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
