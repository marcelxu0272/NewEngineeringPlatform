import { NextResponse } from 'next/server';
import { getSmePersonnel } from '@/lib/db/queries';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const data = getSmePersonnel();
    return NextResponse.json(data);
  } catch (e) {
    console.error('SME personnel API error:', e);
    return NextResponse.json(
      { error: 'Failed to load SME personnel' },
      { status: 500 }
    );
  }
}
