'use client';
import {useEffect,useMemo,useRef,useState,type CSSProperties} from 'react';
import {ConfigProvider} from 'antd';
import zhCN from 'antd/locale/zh_CN';
import 'dayjs/locale/zh-cn';
import {createMarketDemo,chinaToday,defaultFilters,exportCsv,selectMarket,MarketFilters as Filters,MarketView} from '@/lib/market-demo/model';
import {Detail} from './types';
import OpportunityView from './OpportunityView';
import MarketDataView from './MarketDataView';
import ContractView from './ContractView';
import MarketFilters from './MarketFilters';
import MarketDetailsDrawer from './MarketDetailsDrawer';
import MarketOverview from './MarketOverview';
import styles from './market.module.css';
const TITLES={opportunity:'机会清单','market-data':'市场数据','contract-board':'合同看板'};
export default function MarketBoard({ view, unit, units, primary }: {
  view: MarketView | null; unit: string; units: { value: string; label: string }[]; primary: string;
}) {
  const demo = useMemo(() => createMarketDemo(units.filter(row => row.value !== '全部板块').map(row => row.value)), [units]);
  const [draft, setDraft] = useState<Filters>(() => defaultFilters(unit));
  const [filters, setFilters] = useState<Filters>(() => defaultFilters(unit));
  const [generatedAt, setGeneratedAt] = useState(chinaToday);
  const [detail, setDetail] = useState<Detail | null>(null);
  const [search, setSearch] = useState('');
  const [overview, setOverview] = useState(false);
  const [mode, setMode] = useState<'金额' | '标榜'>('金额');
  const [rankPage, setRankPage] = useState('1—5');
  const root = useRef<HTMLElement>(null);
  useEffect(() => {
    setDraft(prev => ({ ...prev, unit })); setFilters(prev => ({ ...prev, unit }));
  }, [unit]);
  useEffect(() => { setDetail(null); setOverview(false); if (root.current) root.current.scrollTop = 0; }, [view]);
  const selected = useMemo(() => selectMarket(demo, filters, view === 'opportunity'), [demo, filters, view]);
  const show = (title: string, kind: Detail['kind'], rows: Detail['rows']) => { setSearch(''); setDetail({ title, kind, rows }); };
  const query = () => { setFilters({ ...draft, types: [...draft.types] }); setRankPage('1—5'); };
  const reset = () => { const next = defaultFilters(unit); setDraft(next); setFilters(next); setRankPage('1—5'); };
  const patch = <K extends keyof Filters>(key: K, value: Filters[K]) => setDraft(prev => ({ ...prev, [key]: value }));
  const exportDetails = () => {
    const blob = new Blob([exportCsv(selected.contracts)], { type: 'text/csv;charset=utf-8' });
    const href = URL.createObjectURL(blob), link = document.createElement('a');
    link.href = href; link.download = `合同看板_演示明细_${generatedAt}.csv`; link.click(); URL.revokeObjectURL(href);
  };
  return <ConfigProvider locale={zhCN}><section ref={root} className={styles.root} aria-label="市场看板演示" hidden={!view} style={{ '--market-primary': primary } as CSSProperties}>
    <div className={styles.body}>
      <header className={styles.header}><div><div className={styles.eyebrow}>MARKET / 2026</div><h2 className={styles.title}>{view ? TITLES[view] : '市场看板'}</h2><p className={styles.subtitle}>单位：万元 · 模拟数据生成时间 {generatedAt} · 仅前端演示</p></div><span className={styles.badge}>演示数据</span></header>

      <MarketFilters {...{view,draft,units,patch,query,reset}} onOpportunities={()=>show('机会清单','opportunities',selected.opportunities)} onRefresh={()=>{setGeneratedAt(chinaToday());setFilters(prev=>({...prev}));}} onOverview={()=>setOverview(true)} onExport={exportDetails}/>
      <p className={styles.note}>当前范围：{filters.unit} · {filters.types.join(' / ') || '未选业务类型'} · 图表与明细均为模拟数据。合同统计区间：{filters.contract ? filters.contract.join(' 至 ') : '2026全年'}。</p>


      {view==='opportunity'&&<OpportunityView data={selected} units={units}/>}
      {view==='market-data'&&<MarketDataView data={selected} primary={primary} onDetails={show} generatedAt={generatedAt}/>}
      {view==='contract-board'&&<ContractView data={selected} primary={primary} onDetails={show} units={units} mode={mode} setMode={setMode} rankPage={rankPage} setRankPage={setRankPage}/>}
    </div>
    <MarketDetailsDrawer {...{detail,setDetail,search,setSearch}}/>
    <MarketOverview {...{overview,setOverview,filters,selected}}/>
  </section></ConfigProvider>;
}
