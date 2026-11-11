import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
// Serve PDF.js resources from the installed version, without a CDN or copied worker drift.
export async function GET(_request: Request, { params }: { params: { path: string[] } }) {
  const parts = params.path;
  const worker = parts.length === 1 && parts[0] === 'pdf.worker.min.mjs';
  const font = parts.length === 2 && ['cmaps', 'standard_fonts'].includes(parts[0]) && /^[a-zA-Z0-9_.-]+$/.test(parts[1]) && !parts[1].startsWith('.');
  if (!worker && !font) return new NextResponse(null, { status: 404 });
  try {
    const root = path.join(process.cwd(), 'node_modules', 'pdfjs-dist');
    const file = worker ? path.join(root, 'build', parts[0]) : path.join(root, ...parts);
    return new NextResponse(new Uint8Array(await readFile(file)), { headers: {
      'Content-Type': worker ? 'text/javascript' : 'application/octet-stream',
      'Cache-Control': 'no-cache', 'X-Content-Type-Options': 'nosniff',
    } });
  } catch { return new NextResponse(null, { status: 404 }); }
}
