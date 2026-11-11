'use client';
import {money,sum} from '@/lib/market-demo/model';
import {ViewProps} from './types';
import {Card,BusinessProgress,createChartRenderer} from './MarketCards';
import {goGetOption,ringOption} from './MarketChart';
import styles from './market.module.css';
export default function MarketDataView({data,primary,onDetails,generatedAt}:ViewProps&{generatedAt:string}){
const selected=data,show=onDetails,chart=createChartRenderer(data);const contractDetails=(title:string,rows=data.actual)=>onDetails(title,'contracts',rows);
return (<div className={styles.grid} data-market-grid="market-data">
        <Card title="新签合同完成情况" detail={() => contractDetails('新签合同完成情况')}>
          {chart(ringOption(selected, primary), '新签合同完成环图')}
          <div className={`${styles.split} ${styles.foot}`}><span>当月新增 <strong>{money(sum(selected.actual.filter(row => row.date.slice(0, 7) === generatedAt.slice(0, 7)), row => row.amount))}</strong> 万元</span><span>当年累计 <strong>{money(selected.signed)}</strong> 万元</span></div>
        </Card>
        <Card title="截止目前（新签+权重）距目标完成情况" detail={() => show('权重项目明细', 'opportunities', selected.opportunities)}>
          {chart(ringOption(selected, primary, true), '新签加权重双层环图')}
          <div className={`${styles.split} ${styles.foot}`}><span>新签＋权重 <strong>{money(selected.signed + selected.weighted)}</strong></span><span>年度目标 {money(selected.target)} 万元</span></div>
        </Card>
        <Card title="各业务线完成情况"><BusinessProgress data={selected} primary={primary} /></Card>
        <Card title="各业务线完成情况（含权重合同额）"><BusinessProgress data={selected} primary={primary} weighted /></Card>
        <Card title="项目机会 GoGet 分析" full detail={() => show('项目机会 GoGet 分析', 'opportunities', selected.opportunities)}>
          {chart(goGetOption(selected, primary), 'GoGet三级分段漏斗', 470)}
          <p className={styles.note}>GO＝投标合同额 / 预计合同额；GET＝权重合同额 / 投标合同额。仅为演示计算。</p>
        </Card>
      </div>);}
