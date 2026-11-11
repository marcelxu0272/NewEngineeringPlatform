import { NextRequest, NextResponse } from 'next/server';
import { ensureReports, getReportFile } from '@/lib/pdf-reports/store';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await ensureReports();
    const file = getReportFile(params.id);
    if (!file) return NextResponse.json({ error: '报告文件不存在' }, { status: 404 });
    const disposition = request.nextUrl.searchParams.get('download') === '1' ? 'attachment' : 'inline';
    return new NextResponse(new Uint8Array(file.content), { headers: {
      'Content-Type': 'application/pdf',
      'Content-Length': String(file.content.length),
      'Content-Disposition': `${disposition}; filename="report.pdf"; filename*=UTF-8''${encodeURIComponent(file.fileName)}`,
      'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff',
    } });
  } catch (error) {
    console.error('PDF report file:', error);
    return NextResponse.json({ error: '文件读取失败，请重试' }, { status: 500 });
  }
}
