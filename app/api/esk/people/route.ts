import { NextResponse } from 'next/server';
import { getEskPeople } from '@/lib/db/queries';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const data = getEskPeople();
    return NextResponse.json(data);
  } catch (e) {
    console.error('ESK people API error:', e);
    return NextResponse.json(
      { error: 'Failed to load ESK people' },
      { status: 500 }
    );
  }
}
