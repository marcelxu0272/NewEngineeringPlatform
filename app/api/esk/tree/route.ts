import { NextResponse } from 'next/server';
import { getEskTree } from '@/lib/db/queries';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const data = getEskTree();
    return NextResponse.json(data);
  } catch (e) {
    console.error('ESK tree API error:', e);
    return NextResponse.json(
      { error: 'Failed to load ESK tree' },
      { status: 500 }
    );
  }
}
