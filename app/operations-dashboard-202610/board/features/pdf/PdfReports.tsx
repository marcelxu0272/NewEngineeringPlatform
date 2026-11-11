'use client';

import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties, type FormEvent } from 'react';
import { MAX_PDF_BYTES, PdfReport, REPORT_CATEGORIES, ReportCategory } from '@/lib/pdf-reports/types';

import {button,field} from './ui';
import ReportList from './ReportList';
import ReportReaderDialog from './ReportReaderDialog';
import ReportUploadDialog from './ReportUploadDialog';

export default function PdfReports({ category, unit, year, units, primary }: {
  category: ReportCategory; unit: string; year: number; units: { value: string; label: string }[]; primary: string;
}) {
  const title = REPORT_CATEGORIES[category];
  const [reports, setReports] = useState<PdfReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [period, setPeriod] = useState('all');
  const [reload, setReload] = useState(0);
  const [activeReport, setActiveReport] = useState<PdfReport | null>(null);
  const [readerError, setReaderError] = useState('');
  const [readerAttempt, setReaderAttempt] = useState(0);
  const [upload, setUpload] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [notice, setNotice] = useState('');
  const opener = useRef<HTMLButtonElement | null>(null);
  const uploadOpener = useRef<HTMLButtonElement>(null);
  const style = { '--report-primary': primary } as CSSProperties;

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true); setError('');
    void (async () => {
      try {
        const response = await fetch(`/api/pdf-reports?category=${category}`, { signal: controller.signal });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || '报告列表加载失败');
        if (!controller.signal.aborted) setReports(result.reports);
      } catch (error) {
        if (!controller.signal.aborted) setError(error instanceof Error ? error.message : '报告列表加载失败');
      } finally { if (!controller.signal.aborted) setLoading(false); }
    })();
    return () => controller.abort();
  }, [category, reload]);

  useEffect(() => { setActiveReport(null); setPeriod('all'); setQuery(''); setNotice(''); }, [unit, year]);
  const scoped = useMemo(() => reports.filter(r => r.period.startsWith(`${year}-`) && (unit === '全部板块' || r.unit === unit)), [reports, unit, year]);
  const periods = Array.from(new Set(scoped.map(r => r.period))).sort().reverse();
  const filtered = scoped.filter(r => (period === 'all' || r.period === period) && `${r.title} ${r.period} ${r.summary}`.toLowerCase().includes(query.toLowerCase().trim()));
  const onReaderFailure = useCallback((message: string) => setReaderError(message), []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const file = form.get('file');
    if (!file || typeof file === 'string' || !file.size || file.size > MAX_PDF_BYTES || !/\.pdf$/i.test(file.name)) { setUploadError('请选择非空且不超过 20 MB 的 PDF 文件'); return; }
    form.set('category', category);
    setUploading(true); setUploadError('');
    try {
      const response = await fetch('/api/pdf-reports', { method: 'POST', body: form });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || '上传失败');
      setReports(prev => [result.report, ...prev]);
      setUpload(false); setQuery(''); setPeriod('all');
      setNotice(`已上传“${result.report.title}”${unit !== '全部板块' && result.report.unit !== unit ? '，切换到对应组织板块可查看' : ''}。`);
    } catch (error) { setUploadError(error instanceof Error ? error.message : '上传失败，请重试'); }
    finally { setUploading(false); }
  }

  return <div className="h-full overflow-auto bg-[#f5f7fa] p-5" style={style} data-testid="pdf-reports-page">
    <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
      <div><div className="mb-1 text-[11px] tracking-widest text-slate-400">PDF REPORTS</div><h3 className="text-xl font-semibold text-slate-800">{title}</h3><p className="mt-1 text-xs text-slate-500">{year}年度 · {unit} · 按报告期查阅历史报告</p></div>
      <button ref={uploadOpener} className={`${button} !border-transparent !text-white`} style={{ backgroundColor: primary }} onClick={() => { setUploadError(''); setUpload(true); }}><i className="ri-upload-cloud-2-line" aria-hidden />上传 PDF</button>
    </div>
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white p-3">
      <div className="flex flex-wrap items-center gap-2"><span className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600">全部报告 {scoped.length}</span><select aria-label="报告期筛选" value={period} onChange={e => setPeriod(e.target.value)} className="rounded-md border border-slate-200 bg-white px-2 py-1.5 text-xs"><option value="all">全部报告期</option>{periods.map(p => <option key={p} value={p}>{p}</option>)}</select></div>
      <input type="search" aria-label="搜索报告" placeholder="搜索报告标题、报告期或摘要" className={`${field} sm:max-w-[260px]`} value={query} onChange={e => setQuery(e.target.value)} />
    </div>
    {notice && <p role="status" className="mb-3 rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{notice}</p>}
    {loading ? <p role="status" className="rounded-lg border border-slate-200 bg-white p-12 text-center text-sm text-slate-400">正在加载报告列表…</p> : error ? <div role="alert" className="rounded-lg border border-red-100 bg-white p-8 text-center"><p className="mb-3 text-sm text-red-600">{error}</p><button className={button} onClick={() => setReload(n => n + 1)}>重新加载</button></div> : !filtered.length ? <div className="rounded-lg border border-dashed border-slate-300 bg-white px-6 py-16 text-center"><i className="ri-file-pdf-2-line text-3xl text-slate-300" aria-hidden /><h4 className="mt-3 font-medium text-slate-700">{scoped.length ? '没有找到匹配的报告' : '当前范围暂无报告'}</h4><p className="mt-2 text-sm text-slate-400">{scoped.length ? '可调整报告期或搜索条件。' : '可上传该组织的 PDF 报告，或切换组织板块查看。'}</p>{(query || period !== 'all') && <button className={`${button} mt-4`} onClick={() => { setQuery(''); setPeriod('all'); }}>清除筛选</button>}</div> : <ReportList filtered={filtered} primary={primary} onOpen={(report,element)=>{opener.current=element;setReaderError('');setReaderAttempt(0);setActiveReport(report);}} />}
    <p className="mt-4 text-xs text-slate-400">示例报告为合成内容；上传后直接进入列表，可持续保存和查阅。</p>

    <ReportReaderDialog {...{activeReport,setActiveReport,opener,title,readerError,setReaderError,readerAttempt,setReaderAttempt,onReaderFailure}} />
    <ReportUploadDialog {...{upload,setUpload,uploading,uploadOpener,title,submit,year,unit,units,uploadError,primary}} />

  </div>;
}
