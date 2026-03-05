import { NextResponse } from 'next/server';
import { getDashboardData } from '@/lib/db/queries';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const data = getDashboardData();
    return NextResponse.json(data);
  } catch (e) {
    console.error('Dashboard API error:', e);
    return NextResponse.json(
      { error: 'Failed to load dashboard data' },
      { status: 500 }
    );
  }
}
