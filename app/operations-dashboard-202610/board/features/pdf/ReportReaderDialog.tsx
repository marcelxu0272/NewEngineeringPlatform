'use client';
import dynamic from 'next/dynamic';
import {Dialog,DialogContent,DialogDescription,DialogTitle} from '@/components/ui/dialog';
import {PdfReport} from '@/lib/pdf-reports/types';
import {button,size,date,fileUrl} from './ui';
const PdfReader = dynamic(() => import('./PdfReader'), { ssr: false, loading: () => <p className="p-8 text-sm text-slate-400">正在准备 PDF 阅读器…</p> });
export default function ReportReaderDialog({activeReport,setActiveReport,opener,title,readerError,setReaderError,readerAttempt,setReaderAttempt,onReaderFailure}:{activeReport:PdfReport|null;setActiveReport:(value:PdfReport|null)=>void;opener:{current:HTMLButtonElement|null};title:string;readerError:string;setReaderError:(value:string)=>void;readerAttempt:number;setReaderAttempt:(value:(n:number)=>number)=>void;onReaderFailure:(message:string)=>void}){return (    <Dialog open={!!activeReport} onOpenChange={open => { if (!open) setActiveReport(null); }}>
      <DialogContent className="flex h-[92dvh] w-[96vw] max-w-[1400px] flex-col gap-0 overflow-hidden p-0" onCloseAutoFocus={event => { event.preventDefault(); opener.current?.focus(); }}>
        <div className="shrink-0 border-b border-slate-200 px-5 py-4 pr-12"><DialogTitle className="leading-6">{activeReport?.title}</DialogTitle><DialogDescription className="mt-1 text-xs">PDF 在线阅读 · 文档信息与原始页面</DialogDescription></div>
        {activeReport && <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
          <aside className="max-h-[30vh] shrink-0 overflow-auto border-b border-slate-200 bg-white p-5 lg:max-h-none lg:w-[270px] lg:border-b-0 lg:border-r" aria-label="文档信息">
            <h4 className="mb-4 text-sm font-semibold text-slate-700">文档信息</h4><dl className="grid grid-cols-2 gap-x-4 gap-y-4 text-xs">{[['报告期', activeReport.period], ['页数', `${activeReport.pageCount} 页`], ['组织板块', activeReport.unit], ['文件大小', size(activeReport.fileSize)], ['上传时间', date(activeReport.createdAt)], ['报告类别', title]].map(([label, value]) => <div key={label}><dt className="mb-1 text-slate-400">{label}</dt><dd className="break-words leading-5 text-slate-700">{value}</dd></div>)}</dl>
            <h5 className="mb-1 mt-5 text-xs text-slate-400">摘要</h5><p className="whitespace-pre-wrap text-xs leading-6 text-slate-600">{activeReport.summary || '暂无摘要'}</p><p className="mt-4 break-all text-[11px] text-slate-400">{activeReport.fileName}</p>{activeReport.sample && <p className="mt-3 rounded bg-amber-50 p-2 text-xs text-amber-700">合成示例，不含真实经营数据。</p>}
            <a className={`${button} mt-5 w-full`} href={`${fileUrl(activeReport)}?download=1`}><i className="ri-download-line" aria-hidden />下载 PDF</a>
          </aside>
          <div className="min-h-0 min-w-0 flex-1" aria-label="PDF 文档">{readerError ? <div role="alert" className="flex h-full flex-col items-center justify-center gap-4 bg-slate-50 p-6"><p className="text-sm text-red-600">{readerError}</p><button className={button} onClick={() => { setReaderError(''); setReaderAttempt(n => n + 1); }}>重新加载 PDF</button><a className="text-sm underline" href={`${fileUrl(activeReport)}?download=1`}>下载原文件</a></div> : <PdfReader key={`${activeReport.id}-${readerAttempt}`} url={fileUrl(activeReport)} onFailure={onReaderFailure} />}</div>
        </div>}
      </DialogContent>
    </Dialog>

);}
