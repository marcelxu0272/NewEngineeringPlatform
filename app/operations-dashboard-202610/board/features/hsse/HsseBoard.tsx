'use client';
import {useEffect,useRef,useState} from 'react';
import {Alert,Button,Select,Spin} from 'antd';
import {HsseResult} from '@/lib/hsse/types';
import {HssePyramid} from './HssePyramid';
import HsseEntry from './HsseEntry';
import HsseImport from './HsseImport';
export default function HsseBoard({ year, primary, active }: { year: number; primary: string; active: boolean }) {
  const [month, setMonth] = useState(() => Number(new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Shanghai', month: 'numeric' }).format(new Date())));
  const [data, setData] = useState<HsseResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [retry, setRetry] = useState(0);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [importCount, setImportCount] = useState(0);
  const sequence = useRef(0);

  useEffect(() => {
    if (!active) return;
    const controller = new AbortController();
    const id = ++sequence.current;
    setLoading(true); setLoadError(''); setData(null); setSaved(false);
    (async () => {
      try {
        const res = await fetch(`/api/hsse-performance?year=${year}&month=${month}`, { cache: 'no-store', signal: controller.signal });
        const result = await res.json();
        if (!res.ok) throw new Error(result.error || '数据加载失败');
        if (id === sequence.current) setData(result);
      } catch (error) {
        if (!controller.signal.aborted && id === sequence.current) setLoadError(error instanceof Error ? error.message : '数据加载失败');
      } finally { if (!controller.signal.aborted && id === sequence.current) setLoading(false); }
    })();
    return () => controller.abort();
  }, [year, month, retry, active]);

  // Closing the company view discards an unsaved modal, never saves it implicitly.
  useEffect(() => { if (!active && !saving) setOpen(false); }, [active, saving]);
  useEffect(() => { if (!active) setImportOpen(false); }, [active]);

  const edit=()=>{setSaved(false);setOpen(true);};

  return <section className="h-full overflow-auto bg-white" aria-label="HSSE绩效看板" hidden={!active}>
    <div className="sticky top-0 z-10 flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 bg-white px-6 py-4">
      <div className="flex items-center gap-3">
        <span className="text-sm font-medium text-slate-700">统计月份</span>
        <Select aria-label="HSSE统计月份" value={month} disabled={saving || open || importOpen} onChange={setMonth} style={{ width: 150 }}
          options={Array.from({ length: 12 }, (_, i) => ({ value: i + 1, label: `${year}年${i + 1}月` }))} />
        <span className="text-xs text-slate-500">全公司</span>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Button href="/operations-dashboard-202610/HSSE月报批量导入模板.xlsx" download>下载Excel模板</Button>
        <Button onClick={() => { setSaved(false); setImportOpen(true); }}>Excel批量录入</Button>
        <Button type="primary" style={{ background: primary }} disabled={loading || !data} onClick={edit}>
          {data?.current ? '修改本月数据' : '录入本月数据'}
        </Button>
      </div>
    </div>
    <div className="px-6 pt-3" aria-live="polite">
      {saved && <Alert type="success" showIcon message={importCount ? `已批量导入${importCount}个月，年度累计已更新` : '本月数据已保存，年度累计已更新'} closable onClose={() => setSaved(false)} />}
      {loadError && <Alert type="error" showIcon message={loadError} action={<Button size="small" onClick={() => setRetry(n => n + 1)}>重试</Button>} />}
      {!loading && data && data.missingMonths.length > 0 && <Alert type="warning" showIcon
        message={`年度累计仅合计已录入月份；缺报月份：${data.missingMonths.map(m => `${m}月`).join('、')}`} />}
    </div>
    {loading ? <div className="flex h-64 items-center justify-center"><Spin tip="加载HSSE数据…"><div className="h-12 w-40" /></Spin></div>
      : data && <div className="overflow-x-auto px-3 pb-4"><HssePyramid data={data} /></div>}
    <HsseEntry year={year} month={month} open={open} current={data?.current??null} saving={saving} setSaving={setSaving} onClose={()=>setOpen(false)} onSaved={result=>{setData(result);setOpen(false);setImportCount(0);setSaved(true);}} />
    <HsseImport open={importOpen} onClose={() => setImportOpen(false)} year={year} month={month}
      onSaved={(result, count) => { setData(result); setImportCount(count); setSaved(true); }} />
  </section>;
}
