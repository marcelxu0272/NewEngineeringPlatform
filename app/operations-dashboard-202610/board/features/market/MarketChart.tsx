'use client';

import { useEffect, useRef } from 'react';
import * as echarts from 'echarts';
import type { EChartsOption } from 'echarts';
import { BUSINESS_TYPES, money, percent, rate, MarketSelection, sum } from '@/lib/market-demo/model';

export function MarketChart({ option, label, height = 300 }: { option: EChartsOption; label: string; height?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const instance = useRef<echarts.ECharts | null>(null);
  useEffect(() => {
    if (!ref.current) return;
    const chart = echarts.init(ref.current, undefined, { renderer: 'svg' });
    instance.current = chart;
    const observer = new ResizeObserver(() => chart.resize()); observer.observe(ref.current);
    return () => { observer.disconnect(); chart.dispose(); instance.current = null; };
  }, []);
  useEffect(() => { instance.current?.setOption({ animation: false, textStyle: { fontFamily: 'Microsoft YaHei, sans-serif', fontSize: 11 }, ...option }, true); }, [option]);
  return <div ref={ref} role="img" aria-label={label} data-market-chart={label} style={{ width: '100%', height, minWidth: 0 }} />;
}

export const palette = (primary: string) => [primary, '#18a99a', '#77bfc2'];
export function ringOption(data: MarketSelection, primary: string, weighted = false): EChartsOption {
  const remainder = Math.max(0, data.target - data.signed);
  return {
    color: [primary, '#e6edf1', '#18a99a', '#f3be35'],
    tooltip: { trigger: 'item', valueFormatter: value => `${money(Number(value))} 万元` },
    legend: { bottom: 0, textStyle: { fontSize: 10 }, itemWidth: 9, itemHeight: 9 },
    graphic: [{ type: 'text', left: 'center', top: '37%', style: { text: percent(rate(data.signed + (weighted ? data.weighted : 0), data.target)), fontSize: 23, fontWeight: 700, fill: primary } },
      { type: 'text', left: 'center', top: '49%', style: { text: weighted ? '新签＋权重 / 目标' : '已签 / 年度目标', fill: '#7a8897', fontSize: 10 } }],
    series: weighted ? [
      { name: '签约与权重', type: 'pie', radius: ['38%', '55%'], center: ['50%', '44%'], label: { show: false },
        data: [{ name: '已签合同', value: data.signed, itemStyle: { color: primary } }, { name: '权重合同', value: data.weighted, itemStyle: { color: '#18a99a' } }] },
      { name: '距目标', type: 'pie', radius: ['61%', '70%'], center: ['50%', '44%'], label: { show: false },
        data: [{ name: '已签合同', value: data.signed, itemStyle: { color: primary } }, { name: '已中未签', value: data.unsignedWon, itemStyle: { color: '#f3be35' } },
          { name: '距目标余额', value: Math.max(0, data.target - data.signed - data.unsignedWon), itemStyle: { color: '#e6edf1' } }] },
    ] : [{ type: 'pie', radius: ['45%', '68%'], center: ['50%', '44%'], label: { show: false },
      data: [{ name: '已签合同', value: data.signed }, { name: '未完成目标', value: remainder }] }],
  };
}

export function groupRing(data: MarketSelection, primary: string): EChartsOption {
  const groups = Array.from(new Set(data.actual.map(row => row.group)));
  return { color: [...palette(primary), '#c2a766'], tooltip: { trigger: 'item', formatter: '{b}<br/>{c} 万元 · {d}%' },
    legend: { bottom: 0, textStyle: { fontSize: 10 }, itemWidth: 9 },
    graphic: [{ type: 'text', left: 'center', top: '38%', style: { text: money(data.signed), fontSize: 23, fontWeight: 700, fill: '#253c4d' } },
      { type: 'text', left: 'center', top: '49%', style: { text: '新签合同额 / 万元', fontSize: 10, fill: '#8797a5' } }],
    series: [{ type: 'pie', radius: ['42%', '65%'], center: ['50%', '44%'], label: { show: false },
      data: groups.map(name => ({ name, value: sum(data.actual.filter(row => row.group === name), row => row.amount) })) }],
  };
}

export function progressOption(data: MarketSelection, units: string[], primary: string, mode: '金额' | '标榜'): EChartsOption {
  const rows = units.filter(unit => data.targets.some(row => row.unit === unit)).map(unit => {
    const amount = sum(data.actual.filter(row => row.unit === unit), row => row.amount);
    return { unit, amount, completion: rate(amount, sum(data.targets.filter(row => row.unit === unit), row => row.amount)) ?? 0 };
  }).sort((a, b) => mode === '金额' ? b.amount - a.amount : b.completion - a.completion);
  return { color: [primary, '#18a99a'], tooltip: { trigger: 'axis' }, legend: { top: 4, textStyle: { fontSize: 10 }, itemWidth: 9 },
    grid: { left: 48, right: 48, bottom: 90, top: 50 },
    xAxis: { type: 'category', data: rows.map(row => row.unit.replace(/^SAS\d+\s*/, '')), axisLabel: { rotate: 55, fontSize: 9, interval: 0 } },
    yAxis: [{ type: 'value', name: '万元', splitLine: { lineStyle: { type: 'dashed', color: '#e8eef2' } } }, { type: 'value', name: '%', splitLine: { show: false } }],
    series: [{ name: '新签合同额', type: 'bar', barMaxWidth: 25, data: rows.map(row => row.amount) },
      { name: '完成率', type: 'line', yAxisIndex: 1, smooth: true, data: rows.map(row => Number(row.completion.toFixed(2))) }],
  };
}

export function trendOption(data: MarketSelection, primary: string): EChartsOption {
  return { color: [primary, '#9ac6df'], legend: { top: 3, itemWidth: 9 }, tooltip: { trigger: 'axis' },
    grid: { left: 52, right: 16, bottom: 35, top: 50 },
    xAxis: { type: 'category', data: Array.from({ length: 12 }, (_, i) => `${i + 1}月`), axisLabel: { fontSize: 10 } },
    yAxis: { type: 'value', name: '万元', splitLine: { lineStyle: { type: 'dashed', color: '#e8eef2' } } },
    series: ['实际', '预测'].map(kind => ({ name: kind, type: 'bar' as const, stack: 'total', barMaxWidth: 24,
      data: Array.from({ length: 12 }, (_, i) => sum(data.contracts.filter(row => row.kind === kind && Number(row.date.slice(5, 7)) === i + 1), row => row.amount)) })),
  };
}

export function annualOption(data: MarketSelection, type: string, color: string): EChartsOption {
  const rows = data.contracts.filter(row => row.type === type);
  return { color: [color], tooltip: { trigger: 'axis' }, grid: { left: 12, right: 12, top: 8, bottom: 23 },
    xAxis: { type: 'category', data: ['2024年', '2025年', '2026年'], axisLabel: { fontSize: 9 }, axisTick: { show: false } },
    yAxis: { type: 'value', show: false },
    series: [{ type: 'line', smooth: true, symbolSize: 5, areaStyle: { opacity: 0.04 },
      data: [sum(rows, row => row.history2024), sum(rows, row => row.history2025), sum(rows, row => row.amount)] }],
  };
}

export function goGetOption(data: MarketSelection, primary: string): EChartsOption {
  const fields = ['estimated', 'bid', 'weighted'] as const;
  const titles = ['预计合同额', '投标合同额', '权重合同额'];
  const rows = fields.map(field => BUSINESS_TYPES.map(type => sum(data.opportunities.filter(row => row.type === type), row => row[field])));
  const totals = rows.map(values => values.reduce((n, v) => n + v, 0));
  const colors = palette(primary);
  return {
    tooltip: { trigger: 'item' }, legend: { bottom: 5, data: [...BUSINESS_TYPES], itemWidth: 12 },
    series: BUSINESS_TYPES.map((type, typeIndex) => ({ name: type, type: 'custom' as const, coordinateSystem: 'none', itemStyle: { color: colors[typeIndex] },
      tooltip: { formatter: (params: unknown) => {
        const point = params as { dataIndex: number };
        return `${type} · ${titles[point.dataIndex]}<br/>${money(rows[point.dataIndex][typeIndex])} 万元`;
      } },
      renderItem: (params, api) => {
        const stage = params.dataIndex, width = Math.max(100, api.getWidth() - 160), base = totals[0] || 1;
        const stageWidth = width * totals[stage] / base, left = 145 + (width - stageWidth) / 2;
        const total = totals[stage] || 1, before = rows[stage].slice(0, typeIndex).reduce((n, v) => n + v, 0);
        const x = left + stageWidth * before / total, segment = stageWidth * rows[stage][typeIndex] / total;
        const y = 44 + stage * 145;
        const group: echarts.CustomSeriesRenderItemReturn = { type: 'group', children: [
          { type: 'rect', shape: { x, y, width: segment, height: 76 }, style: { fill: colors[typeIndex] } },
        ] };
        const children = group.children!;
        if (segment > 35) children.push({ type: 'text', style: { x: x + segment / 2, y: y + 38, text: Math.round(rows[stage][typeIndex]).toLocaleString('zh-CN'), fill: '#fff', fontSize: 11, align: 'center', verticalAlign: 'middle' } });
        if (typeIndex === 0) {
          children.push({ type: 'text', style: { x: 5, y: y + 25, text: `${titles[stage]}\n总计 ${money(totals[stage])}`, fill: '#546777', fontSize: 11, lineHeight: 20 } });
          if (stage < 2) {
            const nextWidth = width * totals[stage + 1] / base, nextLeft = 145 + (width - nextWidth) / 2;
            children.push({ type: 'polygon', silent: true, shape: { points: [[left, y + 76], [left + stageWidth, y + 76], [nextLeft + nextWidth, y + 145], [nextLeft, y + 145]] }, style: { fill: '#dcefee' } });
            children.push({ type: 'text', silent: true, style: { x: 145 + width / 2, y: y + 110, text: `${stage === 0 ? 'GO' : 'GET'}  ${percent(rate(totals[stage + 1], totals[stage]))}`, fill: primary, fontSize: 13, fontWeight: 'bold', align: 'center' } });
          }
        }
        return group;
      }, data: fields.map((_, stage) => [stage, rows[stage][typeIndex]]),
    })),
  };
}
