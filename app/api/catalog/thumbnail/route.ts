import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST() {
  return NextResponse.json({ error: '目录为只读演示，不能更换缩略图' }, { status: 405 });
}
