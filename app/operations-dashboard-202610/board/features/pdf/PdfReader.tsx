'use client';

// Adapted from the local dashboard-center PdfReader: continuous pages and viewport rendering.
import { getDocument, GlobalWorkerOptions, type PDFDocumentProxy } from 'pdfjs-dist';
import { useEffect, useRef, useState } from 'react';

GlobalWorkerOptions.workerSrc = '/api/pdf-assets/pdf.worker.min.mjs';

function PdfPage({ document, number, width, root, onFailure }: {
  document: PDFDocumentProxy; number: number; width: number;
  root: HTMLDivElement | null; onFailure: (message: string) => void;
}) {
  const holder = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const [near, setNear] = useState(false);
  const [ratio, setRatio] = useState(Math.SQRT2);
  const [rendering, setRendering] = useState(true);
  const pageWidth = Math.max(1, width - 40);

  useEffect(() => {
    if (!holder.current || !root) return;
    const observer = new IntersectionObserver(entries => setNear(entries[0].isIntersecting), { root, rootMargin: '800px 0px' });
    observer.observe(holder.current);
    return () => observer.disconnect();
  }, [root]);

  useEffect(() => {
    if (!near || !canvas.current) return;
    let active = true;
    let task: ReturnType<Awaited<ReturnType<PDFDocumentProxy['getPage']>>['render']> | undefined;
    const target = canvas.current;
    setRendering(true);
    void (async () => {
      try {
        const page = await document.getPage(number);
        if (!active) return;
        const unit = page.getViewport({ scale: 1 });
        setRatio(unit.height / unit.width);
        const viewport = page.getViewport({ scale: pageWidth / unit.width });
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        target.width = Math.floor(viewport.width * dpr);
        target.height = Math.floor(viewport.height * dpr);
        const context = target.getContext('2d');
        if (!context) throw new Error('无法创建 PDF 画布');
        task = page.render({ canvasContext: context, viewport, transform: [dpr, 0, 0, dpr, 0, 0] });
        await task.promise;
        if (active) setRendering(false);
      } catch (error) {
        if (active && !(error instanceof Error && error.name === 'RenderingCancelledException')) onFailure('PDF 页面绘制失败，请重试或下载原文件查看。');
      }
    })();
    return () => { active = false; task?.cancel(); target.width = 0; target.height = 0; };
  }, [document, number, pageWidth, near, onFailure]);

  return <div ref={holder} className="mx-auto mb-5" style={{ width: pageWidth }}>
    <div className="relative bg-white shadow-sm" style={{ height: pageWidth * ratio }} aria-busy={near && rendering}>
      {near && rendering && <div className="absolute inset-0 flex items-center justify-center text-sm text-slate-400" role="status">正在绘制第 {number} 页…</div>}
      <canvas ref={canvas} aria-label={`报告第 ${number} 页，共 ${document.numPages} 页`} style={{ width: '100%', height: '100%', visibility: near && !rendering ? 'visible' : 'hidden' }} />
    </div>
    <p className="mt-2 text-center text-xs text-slate-400">{number} / {document.numPages}</p>
  </div>;
}

export default function PdfReader({ url, onFailure }: { url: string; onFailure: (message: string) => void }) {
  const [document, setDocument] = useState<PDFDocumentProxy | null>(null);
  const [frame, setFrame] = useState<HTMLDivElement | null>(null);
  const [width, setWidth] = useState(650);
  const [zoom, setZoom] = useState(1);
  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    let task: ReturnType<typeof getDocument> | undefined;
    setDocument(null);
    void (async () => {
      try {
        const response = await fetch(url, { signal: controller.signal });
        if (!response.ok || !response.headers.get('content-type')?.includes('application/pdf')) throw new Error('文件读取失败');
        const data = new Uint8Array(await response.arrayBuffer());
        if (!active) return;
        task = getDocument({ data, cMapUrl: '/api/pdf-assets/cmaps/', cMapPacked: true, standardFontDataUrl: '/api/pdf-assets/standard_fonts/', isEvalSupported: false });
        const pdf = await task.promise;
        if (active) setDocument(pdf);
      } catch {
        if (active) onFailure('PDF 加载失败，请检查文件或网络后重试。');
      }
    })();
    return () => { active = false; controller.abort(); void task?.destroy(); };
  }, [url, onFailure]);

  useEffect(() => {
    if (!frame) return;
    const observer = new ResizeObserver(entries => setWidth(entries[0].contentRect.width));
    observer.observe(frame);
    return () => observer.disconnect();
  }, [frame]);

  return <div className="flex h-full min-h-0 flex-col">
    <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b border-slate-200 bg-white px-4 py-2 text-xs text-slate-500">
      <span>{document ? `共 ${document.numPages} 页 · 向下滚动阅读` : '正在解析 PDF…'}</span>
      <select aria-label="PDF 缩放" value={zoom} onChange={event => setZoom(Number(event.target.value))} className="rounded border border-slate-200 bg-white px-2 py-1">
        <option value={1}>适合宽度</option><option value={.8}>80%</option><option value={1.25}>125%</option><option value={1.5}>150%</option>
      </select>
    </div>
    <div ref={setFrame} className="min-h-0 flex-1 overflow-auto bg-slate-100 py-5 outline-offset-[-3px]" role="region" aria-label="PDF 连续阅读区" tabIndex={0}>
      {document ? Array.from({ length: document.numPages }, (_, index) => <PdfPage key={index + 1} document={document} number={index + 1} width={width * zoom} root={frame} onFailure={onFailure} />) : <div className="p-8 text-center text-sm text-slate-400" role="status">正在加载 PDF…</div>}
    </div>
  </div>;
}
