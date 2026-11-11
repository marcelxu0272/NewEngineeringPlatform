'use client';
import {type FormEvent} from 'react';
import {Dialog,DialogContent,DialogDescription,DialogTitle} from '@/components/ui/dialog';
import {button,field} from './ui';
export default function ReportUploadDialog({upload,setUpload,uploading,uploadOpener,title,submit,year,unit,units,uploadError,primary}:{upload:boolean;setUpload:(value:boolean)=>void;uploading:boolean;uploadOpener:{current:HTMLButtonElement|null};title:string;submit:(event:FormEvent<HTMLFormElement>)=>void;year:number;unit:string;units:{value:string;label:string}[];uploadError:string;primary:string}){return (    <Dialog open={upload} onOpenChange={open => { if (!uploading) setUpload(open); }}>
      <DialogContent className="max-h-[92dvh] w-[94vw] overflow-auto" onCloseAutoFocus={event => { event.preventDefault(); uploadOpener.current?.focus(); }}><DialogTitle>上传 PDF · {title}</DialogTitle><DialogDescription>填写报告基本信息，上传后即可在列表查看。</DialogDescription>
        <form onSubmit={submit} className="space-y-4"><label className="block text-sm text-slate-600">报告标题<input name="title" required maxLength={120} className={`${field} mt-1`} placeholder={`例如：2026年10月${title}`} /></label>
          <div className="grid grid-cols-2 gap-3"><label className="block text-sm text-slate-600">报告期<input type="month" name="period" required min={`${year}-01`} max={`${year}-12`} defaultValue={`${year}-10`} className={`${field} mt-1`} /></label><label className="block text-sm text-slate-600">组织板块<select name="unit" defaultValue={unit} className={`${field} mt-1`}>{units.map(u => <option key={u.value} value={u.value}>{u.label}</option>)}</select></label></div>
          <label className="block text-sm text-slate-600">摘要（选填）<textarea name="summary" maxLength={2000} rows={3} className={`${field} mt-1`} placeholder="简要说明报告内容" /></label>
          <label className="block rounded-lg border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-600">选择 PDF 文件<input type="file" name="file" required accept=".pdf,application/pdf" className="mt-3 block w-full text-xs" /><span className="mt-2 block text-xs text-slate-400">最大 20 MB，支持未加密 PDF。</span></label>
          {uploadError && <p role="alert" className="text-sm text-red-600">{uploadError}</p>}
          <div className="flex justify-end gap-2"><button type="button" className={button} disabled={uploading} onClick={() => setUpload(false)}>取消</button><button type="submit" className={`${button} !border-transparent !text-white`} style={{ backgroundColor: primary }} disabled={uploading}>{uploading ? '正在上传…' : '上传并保存'}</button></div>
        </form>
      </DialogContent>
    </Dialog>);}
