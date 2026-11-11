'use client';
import {Drawer,Input,Table,Tag} from 'antd';
import {type ColumnsType} from 'antd/es/table';
import {Opportunity,Contract,Framework,money} from '@/lib/market-demo/model';
import {Detail} from './types';
import styles from './market.module.css';
export default function MarketDetailsDrawer({detail,setDetail,search,setSearch}:{detail:Detail|null;setDetail:(value:Detail|null)=>void;search:string;setSearch:(value:string)=>void}){
  const visibleDetails = detail?.rows.filter(row => `${row.name} ${row.customer} ${row.unit}`.toLowerCase().includes(search.toLowerCase())) ?? [];
  const detailColumns: ColumnsType<Opportunity | Contract | Framework> = [
    { title: '模拟项目名称', dataIndex: 'name', width: 240 }, { title: '板块/中心', dataIndex: 'unit', width: 180 },
    { title: '业务类型', dataIndex: 'type', width: 100 }, { title: '模拟客户', dataIndex: 'customer', width: 130 },
    ...(detail?.kind === 'opportunities' ? [
      { title: '当前阶段', dataIndex: 'stage', width: 100 }, { title: '申请时间', dataIndex: 'applicationDate', width: 120 },
      { title: '预计投标时间', dataIndex: 'bidTime', width: 120 }, { title: '预计投标日期', dataIndex: 'bidDate', width: 120 },
      { title: '预计合同额（万元）', dataIndex: 'estimated', width: 160, render: (value: number) => money(value) },
      { title: '投标合同额（万元）', dataIndex: 'bid', width: 160, render: (value: number) => money(value) },
      { title: '权重合同额（万元）', dataIndex: 'weighted', width: 160, render: (value: number) => money(value) },
    ] : [{ title: '日期', dataIndex: 'date', width: 120 }, { title: '金额（万元）', dataIndex: 'amount', width: 140, render: (value: number) => money(value) },
      { title: '类型', dataIndex: 'kind', width: 100 }]),
  ];

return (    <Drawer title={`${detail?.title ?? ''} · 演示明细`} open={!!detail} onClose={() => setDetail(null)} width="min(1100px, 96vw)">
      <div className={styles.detailsTop}><Input aria-label="搜索模拟项目" placeholder="搜索项目、客户或板块名称" value={search} onChange={event => setSearch(event.target.value)} allowClear style={{ maxWidth: 340 }} /><Tag color="gold">模拟数据</Tag></div>
      <Table<Opportunity | Contract | Framework> rowKey="id" size="small" columns={detailColumns} dataSource={visibleDetails} scroll={{ x: 1200 }} pagination={{ pageSize: 10, showSizeChanger: false, showTotal: total => `共${total}条` }} />
    </Drawer>
);}
