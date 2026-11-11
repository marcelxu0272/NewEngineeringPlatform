'use client';
import {formatHsse,HSSE_FIELDS,HsseKey,HsseResult,HsseValues,recordables} from '@/lib/hsse/types';
const boundaries = [143, 199, 246, 291, 328, 373, 428, 482, 537, 592, 647, 702];
const edge = (y: number) => (y - 143) * 360 / 559;

export function HssePyramid({ data }: { data: HsseResult }) {
  const display = (values: HsseValues | null, key: HsseKey) => values ? formatHsse(key, values[key]) : '未录入';
  return (
    <svg viewBox="0 0 960 742" role="img" aria-label={`${data.year}年${data.month}月HSSE绩效金字塔，当月及年度累计`}
      className="mx-auto block w-4/5" style={{ minWidth: 720, maxWidth: 960, fontFamily: 'Arial, Microsoft YaHei, sans-serif' }}>
      <rect width="960" height="742" fill="white" />
      <text x="28" y="61" fontSize="36" fontWeight="700" fill="#000">HSSE绩效 HSSE Statistics</text>
      <g fill="#263c49" fontSize="28" fontWeight="700" textAnchor="middle">
        <text x="316" y="124">{data.year}-{data.month}</text><text x="656" y="124">{data.year}</text>
      </g>
      <g stroke="#000" strokeWidth="1" strokeDasharray="4 3" fill="none">
        <path d="M428 132 H188 V324 H302" /><path d="M530 132 H774 V324 H657" />
      </g>
      <g fill="red" textAnchor="middle" fontWeight="700" fontSize="20">
        <text x="308" y="178">{data.current ? recordables(data.current) : '未录入'}</text>
        <text x="658" y="178">{data.cumulative ? recordables(data.cumulative) : '未录入'}</text>
        <text x="308" y="213">Recordables</text><text x="658" y="213">Recordables</text>
      </g>
      {HSSE_FIELDS.map((field, i) => {
        const top = boundaries[i], bottom = boundaries[i + 1], mid = (top + bottom) / 2;
        const left = 475 - edge(mid), right = 475 + edge(mid);
        const monthText = display(data.current, field.key), yearText = display(data.cumulative, field.key);
        const fitNumber = (text: string, available: number, reported: boolean) => Math.min(reported ? 17 : 13, available / (text.length * 0.65));
        return <g key={field.key} data-hsse-layer={field.key}>
          <polygon points={`${475 - edge(top)},${top} ${475 + edge(top)},${top} ${475 + edge(bottom)},${bottom} ${475 - edge(bottom)},${bottom}`}
            fill={field.color} stroke="white" strokeWidth="1" />
          <text x="475" y={mid + (field.lines.length === 1 ? 5 : -6)} textAnchor="middle" fill="white" fontSize="16" fontWeight="700">
            {field.lines.map((line, j) => <tspan key={line} x="475" dy={j ? 23 : 0}>{line}</tspan>)}
          </text>
          <text x={left - 18} y={mid + 5} textAnchor="end" fontSize={fitNumber(monthText, left - 30, !!data.current)} fontWeight="700" fill="black" data-hsse-month={field.key}>
            {monthText}
          </text>
          <text x={right + 18} y={mid + 5} textAnchor="start" fontSize={fitNumber(yearText, 960 - right - 30, !!data.cumulative)} fontWeight="700" fill="black" data-hsse-year={field.key}>
            {yearText}
          </text>
        </g>;
      })}
    </svg>
  );
}
