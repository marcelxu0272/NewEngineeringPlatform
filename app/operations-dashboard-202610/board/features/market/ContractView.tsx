'use client';
import {Button,Progress,Segmented,Table,Tooltip} from 'antd';
import {BUSINESS_TYPES,money,sum,percent,rate} from '@/lib/market-demo/model';
import {ViewProps} from './types';
import {Card,createChartRenderer} from './MarketCards';
import {annualOption,groupRing,MarketChart,palette,progressOption,trendOption} from './MarketChart';
import styles from './market.module.css';
export default function ContractView({data,primary,onDetails,units,mode,setMode,rankPage,setRankPage}:ViewProps&{units:{value:string;label:string}[];mode:'金额'|'标榜';setMode:(mode:'金额'|'标榜')=>void;rankPage:string;setRankPage:(page:string)=>void}){
const selected=data,show=onDetails,chart=createChartRenderer(data);const contractDetails=(title:string,rows=data.actual)=>onDetails(title,'contracts',rows);
const colors=palette(primary);
  const customerRows = Array.from(new Set(selected.actual.map(row => row.customer))).map(customer => ({ customer, amount: sum(selected.actual.filter(row => row.customer === customer), row => row.amount) })).sort((a, b) => b.amount - a.amount);
  const customerSlice = customerRows.slice(rankPage === '1—5' ? 0 : 5, rankPage === '1—5' ? 5 : 10);

return (<>
        <div className={styles.grid} data-market-grid="kpi">
          {['总签署合同额', ...BUSINESS_TYPES].map((type, index) => {
            const rows = index === 0 ? selected.actual : selected.actual.filter(row => row.type === type);
            const value = sum(rows, row => row.amount), target = index === 0 ? selected.target : sum(selected.targets.filter(row => row.type === type), row => row.amount), completion = rate(value, target);
            return <section className={`${styles.card} ${styles.metric}`} key={type} data-market-module={type}>
              <div className={styles.metricLabel}>{type}</div><div className={styles.metricAmount} data-market-kpi={type}>{money(value)}<span className={styles.unit}>万元</span></div>
              <div className={styles.split}><span>目标 {money(target)} 万元</span><span>完成率 {percent(completion)}</span></div>
              <Progress size="small" percent={completion ?? 0} showInfo={false} strokeColor={primary} trailColor="#eef2f5" />
            </section>;
          })}
        </div>
        <div className={styles.grid} data-market-grid="contracts">
          <Card title="各板块实际进度" detail={() => contractDetails('各板块实际进度')} extra={<Tooltip title="金额按签约额排序，标榜按完成率排序"><Segmented size="small" options={['金额', '标榜']} value={mode} onChange={value => setMode(value as typeof mode)} /></Tooltip>}>
            {chart(progressOption(selected, units.filter(u => u.value !== '全部板块').map(u => u.value), primary, mode), '各板块金额与完成率', 320, selected.actual.length > 0)}
          </Card>
          <Card title="各群组新签合同额占比" detail={() => contractDetails('各群组新签合同额占比')}>{chart(groupRing(selected, primary), '群组合同额环图', 320, selected.actual.length > 0)}</Card>
          <Card title="框架情况" extra={<Button type="link" size="small" onClick={() => show('框架存量情况', 'frameworks', selected.frameworks)}>框架存量情况 ›</Button>}>
            {['新签框架', '变更框架'].map(kind => {
              const rows = selected.frameworks.filter(row => row.kind === kind), amount = sum(rows, row => row.amount), total = sum(selected.frameworks, row => row.amount);
              return <div className={styles.framework} key={kind}><div className={styles.split}><span>{kind}</span><Button size="small" type="text" onClick={() => show(kind, 'frameworks', rows)}>个数 {rows.length} ›</Button></div>
                <div className={styles.bandAmount}>{money(amount)}<span className={styles.unit}>万元</span></div><Progress size="small" percent={rate(amount, total) ?? 0} showInfo={false} strokeColor={primary} />
                <span className={styles.note}>金额占比 {percent(rate(amount, total))}</span>
              </div>;
            })}
            <p className={styles.note}>框架总金额 {money(sum(selected.frameworks, row => row.amount))} 万元 · 共{new Set(selected.frameworks.map(row => row.unit)).size}个板块</p>
          </Card>
          <Card title="金额分档" detail={() => contractDetails('金额分档')}>
            <div className={styles.miniGrid} data-market-grid="bands">{[[0, 50], [50, 200], [200, 500], [500, Infinity]].map(([start, end]) => {
              const rows = selected.actual.filter(row => row.amount >= start && row.amount < end), amount = sum(rows, row => row.amount);
              return <div key={start} className={styles.band}><div className={styles.note}>{end === Infinity ? '500万元以上' : `${start}—${end}万元`}</div>
                <div className={styles.bandAmount}>{money(amount)}</div><div className={styles.note}>占比 {percent(rate(amount, selected.signed))} · {rows.length}项</div>
                <Button size="small" type="link" onClick={() => contractDetails(`${start}—${end === Infinity ? '以上' : end}万元合同`, rows)}>查看明细</Button></div>;
            })}</div>
          </Card>
          <Card title="金额趋势（万元）" detail={() => contractDetails('金额趋势明细', selected.contracts)}>{chart(trendOption(selected, primary), '月度实际预测金额趋势', 320, selected.contracts.length > 0)}<p className={styles.note}>实际与预测均按当前筛选日期归集；预测为未签机会的模拟权重金额。</p></Card>
          <Card title="业务类型年度变化" detail={() => contractDetails('业务类型年度变化', selected.contracts)}>
            {BUSINESS_TYPES.map((type, i) => <div className={styles.annual} key={type}><div className={styles.split}><strong style={{ color: colors[i] }}>{type}</strong><span>2026实际＋预测 {money(sum(selected.contracts.filter(row => row.type === type), row => row.amount))} 万元</span></div>
              {selected.contracts.some(row => row.type === type) ? <MarketChart option={annualOption(selected, type, colors[i])} label={`${type}年度变化`} height={72} /> : <p className={styles.note}>无匹配数据</p>}
            </div>)}<p className={styles.note}>2024、2025为模拟对照值；当前筛选作用于所有序列。</p>
          </Card>
          <Card title="客户签署金额排行" full detail={() => contractDetails('客户签署金额排行')} extra={<Segmented size="small" options={['1—5', '6—10']} value={rankPage} onChange={value => setRankPage(String(value))} />}>
            <Table size="small" rowKey="customer" pagination={false} dataSource={customerSlice} columns={[
              { title: '排名', width: 70, render: (_, __, index) => index + (rankPage === '1—5' ? 1 : 6) },
              { title: '客户', dataIndex: 'customer', render: customer => <Button type="link" size="small" onClick={() => contractDetails(customer, selected.actual.filter(row => row.customer === customer))}>{customer}</Button> },
              { title: '金额（万元）', dataIndex: 'amount', align: 'right', render: value => money(value) },
              { title: '占比', align: 'right', render: (_, row) => percent(rate(row.amount, selected.signed)) },
            ]} summary={() => <Table.Summary.Row><Table.Summary.Cell index={0} colSpan={2}>合计（全部客户）</Table.Summary.Cell><Table.Summary.Cell index={2} align="right">{money(selected.signed)}</Table.Summary.Cell><Table.Summary.Cell index={3} align="right">{percent(rate(selected.signed, selected.signed))}</Table.Summary.Cell></Table.Summary.Row>} />
          </Card>
        </div>
      </>);}
