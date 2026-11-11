'use client';
import {Table,Tag} from 'antd';
import {type ColumnsType} from 'antd/es/table';
import {BUSINESS_TYPES,Opportunity,money,percent,rate,sum,MarketSelection} from '@/lib/market-demo/model';
import {SummaryRow} from './types';
import {Card} from './MarketCards';
import styles from './market.module.css';
export default function OpportunityView({data:selected,units}:{data:MarketSelection;units:{value:string;label:string}[]}){const filters={types:BUSINESS_TYPES.filter(type=>selected.targets.some(row=>row.type===type))};
  const summary = (unitName: string, type: string, rows: Opportunity[]): Omit<SummaryRow, 'id' | 'span'> => {
    const ids = new Set(rows.map(row => row.id));
    const target = sum(selected.targets.filter(row => (unitName === '全部' || row.unit === unitName) && (type === '全部' || row.type === type)), row => row.amount);
    return { unit: unitName, type, estimated: sum(rows, row => row.estimated), bid: sum(rows, row => row.bid), weighted: sum(rows, row => row.weighted),
      target, signed: sum(selected.actual.filter(row => ids.has(row.opportunityId)), row => row.amount), unsignedWon: sum(rows.filter(row => row.stage === '已中标'), row => row.bid) };
  };
  const tableRows: SummaryRow[] = [];
  units.filter(u => u.value !== '全部板块' && selected.opportunities.some(row => row.unit === u.value)).forEach((u, index) => {
    const types = BUSINESS_TYPES.filter(type => filters.types.includes(type));
    types.forEach((type, i) => tableRows.push({ ...summary(u.value, type, selected.opportunities.filter(row => row.unit === u.value && row.type === type)), id: `${u.value}-${type}`, span: i === 0 ? types.length : 0, serial: index + 1 }));
    tableRows.push({ ...summary(u.value, '全部', selected.opportunities.filter(row => row.unit === u.value)), id: `${u.value}-subtotal`, span: 1, unit: `${u.label}小计`, type: '小计', summary: true });
  });
  if (tableRows.length) {
    for (const type of BUSINESS_TYPES.filter(t => filters.types.includes(t))) tableRows.push({ ...summary('全部', type, selected.opportunities.filter(row => row.type === type)), id: `${type}-total`, span: 1, unit: `${type}小计`, summary: true });
    const nonEpcTypes = BUSINESS_TYPES.filter(type => filters.types.includes(type) && type !== 'EPC');
    tableRows.push({ ...summary('全部', '全部', selected.opportunities.filter(row => row.type !== 'EPC')), id: 'nonepc', span: 1, unit: '非EPC小计', type: '—', summary: true,
      target: sum(selected.targets.filter(row => nonEpcTypes.includes(row.type)), row => row.amount) });
    tableRows.push({ ...summary('全部', '全部', selected.opportunities), id: 'grand-total', span: 1, unit: '合计', type: '—', summary: true });
  }
  const moneyColumn = (title: string, key: keyof Pick<SummaryRow, 'estimated' | 'bid' | 'weighted' | 'target' | 'signed' | 'unsignedWon'>): ColumnsType<SummaryRow>[number] => ({ title, dataIndex: key, align: 'right', width: 140, render: value => money(value) });
  const summaryColumns: ColumnsType<SummaryRow> = [
    { title: '序号', dataIndex: 'serial', width: 60, fixed: 'left', onCell: row => ({ rowSpan: row.summary ? 1 : row.span }) },
    { title: '业务板块/中心', dataIndex: 'unit', width: 200, fixed: 'left', onCell: row => ({ rowSpan: row.summary ? 1 : row.span }) },
    { title: '业务类型', dataIndex: 'type', width: 115 }, moneyColumn('预计合同额', 'estimated'), moneyColumn('预计投标额', 'bid'), moneyColumn('权重合同额', 'weighted'),
    moneyColumn('新签合同目标', 'target'), moneyColumn('已签合同额', 'signed'), moneyColumn('已中未签合同额', 'unsignedWon'),
    { title: '已签/目标%', width: 125, align: 'right', render: (_, row) => percent(rate(row.signed, row.target)) },
    { title: '（已签+权重）/目标%', width: 180, align: 'right', render: (_, row) => percent(rate(row.signed + row.weighted, row.target)) },
  ];


return (<Card title="机会与签约汇总" extra={<Tag color="blue">单位：万元</Tag>}>
        <Table<SummaryRow> size="small" bordered columns={summaryColumns} dataSource={tableRows} rowKey="id" pagination={false} scroll={{ x: 1650, y: 570 }} rowClassName={row => row.summary ? styles.summary : ''} locale={{ emptyText: '当前筛选无演示数据' }} />
      </Card>);}
