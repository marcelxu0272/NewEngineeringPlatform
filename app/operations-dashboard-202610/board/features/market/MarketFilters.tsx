'use client';
import {Button,Checkbox,DatePicker,Select} from 'antd';
import dayjs from 'dayjs';
import {BUSINESS_TYPES,STAGES,BusinessType,DateRange,MarketFilters as Filters,MarketView} from '@/lib/market-demo/model';
import styles from './market.module.css';
export default function MarketFilters({view,draft,units,patch,query,reset,onOpportunities,onRefresh,onOverview,onExport}:{view:MarketView|null;draft:Filters;units:{value:string;label:string}[];patch:<K extends keyof Filters>(key:K,value:Filters[K])=>void;query:()=>void;reset:()=>void;onOpportunities:()=>void;onRefresh:()=>void;onOverview:()=>void;onExport:()=>void}){
  const datePicker = (label: string, key: 'application' | 'bidTime' | 'bidDate' | 'contract') => <div className={styles.field} key={key}>
    <span className={styles.fieldLabel}>{label}</span>
    <DatePicker.RangePicker aria-label={label} value={draft[key] ? [dayjs(draft[key]![0]), dayjs(draft[key]![1])] : null}
      allowClear style={{ width: 248, maxWidth: '100%' }} format="YYYY/MM/DD" placeholder={['开始日期', '结束日期']}
      disabledDate={date => date.year() !== 2026} onChange={dates => patch(key, dates?.[0] && dates[1] ? [dates[0].format('YYYY-MM-DD'), dates[1].format('YYYY-MM-DD')] as DateRange : null)} />
  </div>;

return (      <div className={styles.filters} aria-label="市场筛选">
        <div className={styles.field}><span className={styles.fieldLabel}>{view === 'opportunity' ? '所属板块' : '板块'}</span><Select aria-label="市场板块" value={draft.unit} options={units} onChange={value => patch('unit', value)} style={{ width: 210 }} /></div>
        <div className={styles.field}><span className={styles.fieldLabel}>业务类型</span>
          {view === 'market-data' ? <Checkbox.Group aria-label="业务类型" options={[...BUSINESS_TYPES]} value={draft.types} onChange={values => patch('types', values as BusinessType[])} />
            : <Select aria-label="市场业务类型" mode="multiple" placeholder="选择业务类型" value={draft.types} options={BUSINESS_TYPES.map(value => ({ value, label: value }))} onChange={value => patch('types', value)} style={{ minWidth: 260 }} maxTagCount="responsive" />}
        </div>
        {view === 'opportunity' && <div className={styles.field}><span className={styles.fieldLabel}>当前阶段</span><Select aria-label="当前阶段" value={draft.stage} onChange={value => patch('stage', value)} style={{ width: 130 }} options={['全部阶段', ...STAGES].map(value => ({ value, label: value }))} /></div>}
        {view === 'contract-board' ? datePicker('合同起止日期', 'contract') : <>{datePicker('申请时间', 'application')}{datePicker('预计投标时间', 'bidTime')}{datePicker('预计投标日期', 'bidDate')}</>}
        <div className={styles.actions}>
          <Button type="primary" onClick={query}>查询</Button><Button onClick={reset}>重置</Button>
          {view === 'opportunity' && <Button onClick={() => onOpportunities()}>机会清单</Button>}
          {view === 'contract-board' && <><Button aria-label="刷新模拟数据" onClick={() => { onRefresh(); }}>刷新</Button><Button onClick={() => onOverview()}>数据概况</Button><Button onClick={onExport}>导出明细</Button></>}
        </div>
      </div>
);}
