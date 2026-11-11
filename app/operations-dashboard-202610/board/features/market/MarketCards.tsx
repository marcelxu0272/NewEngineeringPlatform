'use client';
import {type ReactNode} from 'react';
import {Button,Empty,Progress} from 'antd';
import {BUSINESS_TYPES,money,percent,rate,sum,MarketSelection} from '@/lib/market-demo/model';
import {MarketChart} from './MarketChart';
import styles from './market.module.css';
export function Card({ title, children, extra, detail, full = false }: { title: string; children: ReactNode; extra?: ReactNode; detail?: () => void; full?: boolean }) {
  return <section className={`${styles.card} ${full ? styles.full : ''}`} data-market-module={title}>
    <div className={styles.cardHeader}><h3 className={styles.cardTitle}>{title}{detail && <Button size="small" type="text" aria-label={`${title}明细`} onClick={detail}>›</Button>}</h3>{extra}</div>
    {children}
  </section>;
}

export function BusinessProgress({ data, weighted, primary }: { data: MarketSelection; weighted?: boolean; primary: string }) {
  return <>{BUSINESS_TYPES.map(type => {
    const signed = sum(data.actual.filter(row => row.type === type), row => row.amount);
    const weight = weighted ? sum(data.opportunities.filter(row => row.type === type), row => row.weighted) : 0;
    const target = sum(data.targets.filter(row => row.type === type), row => row.amount), completion = rate(signed + weight, target);
    return <div className={styles.businessRow} key={type}>
      <div className={styles.split}><span className={styles.businessTitle}>{type}</span><span><strong>{money(signed)}{weighted && <>＋{money(weight)}</>}</strong> / {money(target)} 万元</span></div>
      <div className={styles.businessMeta}><span>完成率</span><strong style={{ color: primary }}>{percent(completion)}</strong></div>
      <Progress percent={completion ?? 0} showInfo={false} strokeColor={primary} trailColor="#e9f0f4" size="small" />
    </div>;
  })}<p className={styles.note}>年度目标为模拟值；金额与图表统一由当前筛选记录计算。</p></>;
}


export function createChartRenderer(selected:MarketSelection){
  return function renderChart(option: Parameters<typeof MarketChart>[0]['option'], label: string, height?: number, hasRows = selected.opportunities.length > 0) { return hasRows
    ? <MarketChart option={option} label={label} height={height} /> : <div className={styles.empty}><Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="当前筛选无演示数据" /></div>; };

}
