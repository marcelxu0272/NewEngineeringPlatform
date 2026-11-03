import { NextResponse } from 'next/server';
import { saveThumbnail } from '@/lib/catalog';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const MAX_BYTES = 2 * 1024 * 1024;

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const id = formData.get('id');
    const file = formData.get('file');
    if (typeof id !== 'string' || !(file instanceof File)) {
      return NextResponse.json({ error: '参数不正确' }, { status: 400 });
    }
    if (file.type !== 'image/jpeg') {
      return NextResponse.json({ error: '请上传 JPEG 图片' }, { status: 400 });
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json({ error: '图片不能超过 2MB' }, { status: 400 });
    }
    const bytes = Buffer.from(await file.arrayBuffer());
    return NextResponse.json({ items: saveThumbnail(id, bytes) });
  } catch (error) {
    console.error('Catalog thumbnail API error:', error);
    const text = error instanceof Error ? error.message : '缩略图上传失败';
    const status = text === '条目不存在' || text === '请上传 JPEG 图片' || text === '缩略图路径不合法' ? 400 : 500;
    return NextResponse.json({ error: text }, { status });
  }
}
