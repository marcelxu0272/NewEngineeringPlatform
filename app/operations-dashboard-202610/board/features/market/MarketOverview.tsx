'use client';
import {Button,Modal} from 'antd';
import {MarketSelection,MarketFilters,money,sum,percent,rate} from '@/lib/market-demo/model';
import styles from './market.module.css';
export default function MarketOverview({overview,setOverview,filters,selected}:{overview:boolean;setOverview:(value:boolean)=>void;filters:MarketFilters;selected:MarketSelection}){return (    <Modal title="合同看板 · 数据概况（演示）" open={overview} onCancel={() => setOverview(false)} footer={<Button onClick={() => setOverview(false)}>关闭</Button>}>
      <p>当前板块：{filters.unit}</p><p>已签合同 {selected.actual.length} 项，共 {money(selected.signed)} 万元。</p><p>预测记录 {selected.forecast.length} 项，共 {money(sum(selected.forecast, row => row.amount))} 万元。</p><p>年度目标 {money(selected.target)} 万元；完成率 {percent(rate(selected.signed, selected.target))}。</p><p className={styles.note}>全部为本地生成的演示记录，不代表真实经营情况。</p>
    </Modal>
);}
