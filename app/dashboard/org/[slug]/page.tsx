'use client';

import { notFound } from 'next/navigation';
import { use, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import {
  PieChart, Pie, Cell, ResponsiveContainer,
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip as RechartsTooltip, Legend,
  FunnelChart, Funnel, LabelList,
} from 'recharts';
import {
  DashboardOutlined,
  BarChartOutlined,
  SettingOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  RightOutlined,
} from '@ant-design/icons';
import { Select, Switch } from 'antd';
import { Tooltip as AntTooltip } from 'antd';
import { ConfigProvider } from 'antd';

// ── 颜色常量（设计及咨询 / EPC / PMC）──────────────────────────────
const COLOR_DESIGN = '#007069';
const COLOR_EPC    = '#0272fd';
const COLOR_PMC    = '#ff7038';

const TYPE_COLORS: Record<string, string> = {
  '设计及咨询': COLOR_DESIGN,
  EPC: COLOR_EPC,
  PMC: COLOR_PMC,
};

// ── 事业群元数据 ────────────────────────────────────────────────────
const GROUP_META: Record<string, { name: string; divisions: string[] }> = {
  xinyewu: {
    name: '新业务项目群',
    divisions: ['SAS170 PMC板块', 'SAS610 咨询板块', 'SAS680 数字技术板块'],
  },
  'nm-ls': {
    name: 'NM&LS 项目群',
    divisions: ['SAS650 新材料板块', 'SAS710 生命科学板块'],
  },
  haiwai: {
    name: '海外项目群',
    divisions: ['SAS690 COII板块', 'SAS720 模块化板块', 'SAS670 供应链板块'],
  },
  dongbu: {
    name: '东部项目群',
    divisions: ['SAS520 金山中心', 'SAS560 沈阳中心', 'SAS550 惠湛中心'],
  },
  xibu: {
    name: '西部项目群',
    divisions: ['SAS530 银川中心'],
  },
};

// ── 占位数据 ─────────────────────────────────────────────────────────

const CARD_DATA = [
  {
    title: '年度新签合同额（万元）',
    value: '23,860.41',
    monthLabel: '本月新增',
    monthValue: '1,520.00',
    percentage: '39.77%',
    donutValue: 39.8,
    subTargets: [
      { type: '设计及咨询', current: 8120.5, target: 15000 },
      { type: 'EPC', current: 13580.3, target: 30000 },
      { type: 'PMC', current: 2159.61, target: 6000 },
    ],
  },
  {
    title: '年度完成合同额（万元）',
    value: '12,180.29',
    monthLabel: '上月新增',
    monthValue: '1,364.80',
    percentage: '35.82%',
    donutValue: 35.8,
    subTargets: [
      { type: '设计及咨询', current: 4085.2, target: 13000 },
      { type: 'EPC', current: 6852.8, target: 24000 },
      { type: 'PMC', current: 1242.29, target: 4500 },
    ],
  },
  {
    title: '年度完成开票额（万元）',
    value: '13,020.20',
    monthLabel: '上月新增',
    monthValue: '1,264.80',
    percentage: '40.69%',
    donutValue: 40.7,
    subTargets: [
      { type: '设计及咨询', current: 4868.4, target: 14000 },
      { type: 'EPC', current: 7100.5, target: 26000 },
      { type: 'PMC', current: 1051.3, target: 5000 },
    ],
  },
  {
    title: '年度完成回款额（万元）',
    value: '13,480.17',
    monthLabel: '上月新增',
    monthValue: '1,164.80',
    percentage: '41.79%',
    donutValue: 41.8,
    subTargets: [
      { type: '设计及咨询', current: 5345.2, target: 13500 },
      { type: 'EPC', current: 6880.67, target: 25000 },
      { type: 'PMC', current: 1254.3, target: 5500 },
    ],
  },
];

// 市场数据（占位）
const MARKET_DATA = [
  {
    type: '设计及咨询',
    color: COLOR_DESIGN,
    items: [
      { name: '预计投标额', value: 32000 },
      { name: '预计合同额', value: 22000 },
      { name: '权重合同额', value: 15400 },
    ],
  },
  {
    type: 'EPC',
    color: COLOR_EPC,
    items: [
      { name: '预计投标额', value: 85000 },
      { name: '预计合同额', value: 62000 },
      { name: '权重合同额', value: 43400 },
    ],
  },
  {
    type: 'PMC',
    color: COLOR_PMC,
    items: [
      { name: '预计投标额', value: 18000 },
      { name: '预计合同额', value: 13000 },
      { name: '权重合同额', value: 9100 },
    ],
  },
];

// 核心项目动态（占位）
const PROJECT_ACTIVITIES = [
  { id: 'P2025-001', name: '宁夏某石化改造项目', group: 'PMC', time: '2025-11-01', status: '新增' },
  { id: 'P2024-082', name: '上海某炼油扩建项目', group: 'EPC', time: '2025-10-28', status: '项目信息变更' },
  { id: 'P2024-057', name: '银川新材料研发中心', group: '设计及咨询', time: '2025-10-22', status: '保障活动更新' },
];

const STATUS_COLOR: Record<string, string> = {
  '新增': 'bg-green-100 text-green-700',
  '项目信息变更': 'bg-blue-100 text-blue-700',
  '保障活动更新': 'bg-orange-100 text-orange-700',
};

// 最近六个月标签
const SIX_MONTHS = ['6月前', '5月前', '4月前', '3月前', '2月前', '上月'];

// 人均产值趋势（占位）- 每个值保留 2 位小数
const buildTrendData = (divisions: string[]) =>
  SIX_MONTHS.map((month, i) => {
    const base: Record<string, unknown> = { month };
    base['事业群合计'] = parseFloat((18 + i * 1.2 + Math.random() * 2).toFixed(2));
    divisions.forEach((div, di) => {
      base[div] = parseFloat((15 + i * 0.8 + di * 1.5 + Math.random() * 2).toFixed(2));
    });
    return base;
  });

// 折线图系列颜色（事业群合计 + 各板块）
const LINE_COLORS = [
  '#374151', COLOR_DESIGN, COLOR_EPC, COLOR_PMC,
  '#8b5cf6', '#ec4899', '#f59e0b',
];

// 部门选项（占位）
const DEPT_OPTIONS = [
  { value: 'all', label: '全部' },
  { value: 'design', label: '设计及咨询' },
  { value: 'epc', label: 'EPC' },
  { value: 'pmc', label: 'PMC' },
];

const YEAR_OPTIONS = [
  { value: '2025', label: '2025年' },
  { value: '2024', label: '2024年' },
  { value: '2023', label: '2023年' },
];

// 数字格式化：千分符 + 2 位小数
function fmt(n: number) {
  return n.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// ── 组件 ─────────────────────────────────────────────────────────────

export default function OrgGroupDashboard({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const meta = GROUP_META[slug];
  if (!meta) notFound();

  const [selectedDept, setSelectedDept] = useState('all');
  const [selectedYear, setSelectedYear] = useState('2025');
  const [showSubTargets, setShowSubTargets] = useState(true);

  const trendData = buildTrendData(meta.divisions);
  const trendKeys = ['事业群合计', ...meta.divisions];

  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#007069',
          colorLink: '#007069',
          colorLinkHover: '#005c56',
          colorLinkActive: '#004842',
        },
      }}
    >
      <div className="flex min-h-screen">
        {/* 左侧固定一级导航 */}
        <div className="fixed left-0 top-0 h-screen w-16 bg-gray-800 p-2 flex flex-col items-center z-10">
          <Link
            href="/"
            className="mb-8 mt-4 w-12 h-12 bg-white rounded-full flex items-center justify-center hover:opacity-90"
          >
            <span className="text-gray-800 text-2xl font-bold">W</span>
          </Link>
          <div className="flex-1 flex flex-col mt-8 space-y-8">
            <Link
              href="/dashboard"
              className="w-6 h-6 text-white hover:bg-gray-700 rounded-lg flex items-center justify-center"
              title="项目中台"
            >
              <DashboardOutlined className="w-6 h-6" />
            </Link>
            <span className="w-6 h-6 text-gray-400 hover:bg-gray-700 rounded-lg flex items-center justify-center cursor-pointer">
              <BarChartOutlined className="w-6 h-6" />
            </span>
            <span className="w-6 h-6 text-gray-400 hover:bg-gray-700 rounded-lg flex items-center justify-center cursor-pointer">
              <SettingOutlined className="w-6 h-6" />
            </span>
          </div>
        </div>

        {/* 主内容区 */}
        <div className="ml-16 pb-8 space-y-4 bg-[#f8faff] w-[calc(100%-4rem)] min-h-screen overflow-x-hidden">
          {/* 顶部固定白条 */}
          <div className="fixed top-0 left-16 right-0 h-20 bg-white shadow-sm z-20">
            <h2 className="pt-6 pl-6 text-2xl">
              运营看板 &gt;{' '}
              <span className="text-[#007069]">{meta.name}</span>
            </h2>
          </div>

          <div className="pt-20">
            {/* ── 筛选区 ── */}
            <div className="px-4 pt-2 pb-2 flex items-center gap-4 flex-wrap">
              <Select
                value={selectedDept}
                onChange={setSelectedDept}
                options={DEPT_OPTIONS}
                style={{ width: 150 }}
              />
              <Select
                value={selectedYear}
                onChange={setSelectedYear}
                options={YEAR_OPTIONS}
                style={{ width: 90 }}
              />
              <div className="flex items-center gap-2">
                <span className="text-sm text-[#007069]">显示子目标</span>
                <Switch checked={showSubTargets} onChange={setShowSubTargets} />
              </div>
            </div>

            {/* ── 颜色图例栏 ── */}
            <div className="px-4 pb-3 flex items-center gap-6">
              {Object.entries(TYPE_COLORS).map(([label, color]) => (
                <div key={label} className="flex items-center gap-1.5">
                  <span
                    className="inline-block w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: color }}
                  />
                  <span className="text-xs text-gray-600">{label}</span>
                </div>
              ))}
            </div>

            {/* ── 四大 KPI 卡片 ── */}
            <div className="px-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {CARD_DATA.map((card, index) => (
                  <Card key={index} className="border-0 shadow-md">
                    <CardContent className="p-4">
                      {/* 标题 + 环形图 */}
                      <div className="flex justify-between items-start">
                        <div className="flex-1 min-w-0">
                          <AntTooltip title={`指标：${card.title}；口径：本自然年累计；单位：万元`}>
                            <h3 className="font-medium text-sm text-gray-700 mb-2 cursor-help">
                              {card.title}
                            </h3>
                          </AntTooltip>
                          <div className="text-2xl font-bold text-[#007069]">{card.value}</div>
                          <div className="flex items-center mt-2 text-xs gap-1 flex-wrap">
                            <span className="text-gray-500">{card.monthLabel}</span>
                            <span className="text-gray-700 font-medium">{card.monthValue}</span>
                            <span className="px-1.5 py-0.5 rounded-full bg-green-100 text-green-800">
                              {card.percentage}
                            </span>
                          </div>
                        </div>
                        {/* 三色环形图 */}
                        <div className="relative w-20 h-20 flex-shrink-0">
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={card.subTargets.map((t) => ({
                                  name: t.type,
                                  value: Math.min(100, (t.current / t.target) * 100),
                                }))}
                                innerRadius="65%"
                                outerRadius="100%"
                                dataKey="value"
                                startAngle={90}
                                endAngle={-270}
                                stroke="none"
                              >
                                {card.subTargets.map((t) => (
                                  <Cell key={t.type} fill={TYPE_COLORS[t.type]} />
                                ))}
                              </Pie>
                              <RechartsTooltip
                                formatter={(value: number, name: string) => [
                                  `${value.toFixed(1)}%`,
                                  name,
                                ]}
                              />
                            </PieChart>
                          </ResponsiveContainer>
                          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-xs font-bold text-gray-700">
                            {card.donutValue}%
                          </div>
                        </div>
                      </div>

                      {/* 子目标进度条 */}
                      <div
                        className={`overflow-hidden transition-all duration-300 ${
                          showSubTargets ? 'max-h-[300px] opacity-100' : 'max-h-0 opacity-0'
                        }`}
                      >
                        <div className="mt-3 pt-3 border-t border-gray-100 space-y-2">
                          {card.subTargets.map((t) => {
                            const pct = Math.min(100, (t.current / t.target) * 100);
                            const color = TYPE_COLORS[t.type];
                            return (
                              <AntTooltip
                                key={t.type}
                                title={`${t.type}：${fmt(t.current)} / ${fmt(t.target)} 万元，完成率 ${pct.toFixed(1)}%`}
                              >
                                <div className="cursor-help">
                                  <div className="flex justify-between text-xs mb-1">
                                    <span className="text-gray-500">{t.type}</span>
                                    <span style={{ color }} className="font-medium">
                                      {fmt(t.current)} / {fmt(t.target)}
                                    </span>
                                  </div>
                                  <div
                                    className="h-2 rounded-full overflow-hidden"
                                    style={{ backgroundColor: `${color}22` }}
                                  >
                                    <div
                                      className="h-full rounded-full transition-all duration-500"
                                      style={{ width: `${pct}%`, backgroundColor: color }}
                                    />
                                  </div>
                                </div>
                              </AntTooltip>
                            );
                          })}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* ── 第二行：应收款项 / 成本分析 / 占位 ── */}
            <div className="px-4 mt-4 grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* 应收款项 */}
              <Card className="border-0 shadow-md">
                <CardContent className="p-4">
                  <h3 className="font-medium text-sm text-gray-700 mb-3">应收款项（万元）</h3>
                  <div className="space-y-2">
                    <AntTooltip title="当前WIP：在制品价值，口径：本自然月末；单位：万元">
                      <div className="bg-[#007069]/10 p-3 rounded-lg cursor-help">
                        <div className="flex items-center justify-between">
                          <p className="text-xl font-bold text-[#007069]">7,284.25</p>
                          <div className="flex items-center text-red-500 text-sm">
                            <ArrowUpOutlined className="mr-1" />
                            <span>432.00</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <p className="text-sm text-[#007069]">当前WIP</p>
                          <AntTooltip title="查看详情">
                            <Link
                              href="#"
                              className="w-5 h-5 rounded-full bg-[#007069]/10 flex items-center justify-center hover:bg-[#007069]/20"
                            >
                              <RightOutlined className="text-xs text-[#007069]" />
                            </Link>
                          </AntTooltip>
                        </div>
                      </div>
                    </AntTooltip>
                    <AntTooltip title="应收账款：已开票未收款，口径：本自然月末；单位：万元">
                      <div className="bg-[#007069]/10 p-3 rounded-lg cursor-help">
                        <div className="flex items-center justify-between">
                          <p className="text-xl font-bold text-[#007069]">3,952.70</p>
                          <div className="flex items-center text-green-600 text-sm">
                            <ArrowDownOutlined className="mr-1" />
                            <span>218.00</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <p className="text-sm text-[#007069]">应收账款</p>
                          <AntTooltip title="查看详情">
                            <Link
                              href="#"
                              className="w-5 h-5 rounded-full bg-[#007069]/10 flex items-center justify-center hover:bg-[#007069]/20"
                            >
                              <RightOutlined className="text-xs text-[#007069]" />
                            </Link>
                          </AntTooltip>
                        </div>
                      </div>
                    </AntTooltip>
                  </div>
                </CardContent>
              </Card>

              {/* 成本分析 */}
              <Card className="border-0 shadow-md">
                <CardContent className="p-4">
                  <h3 className="font-medium text-sm text-gray-700 mb-3">成本分析（万元）</h3>
                  <div className="space-y-2">
                    <AntTooltip title="合计成本：本年截至今日累计；单位：万元">
                      <div className="bg-[#007069]/10 p-3 rounded-lg cursor-help">
                        <p className="text-xl font-bold text-[#007069]">10,542.31</p>
                        <div className="flex items-center gap-2 mt-1">
                          <p className="text-sm text-[#007069]">合计成本</p>
                          <AntTooltip title="查看详情">
                            <Link
                              href="#"
                              className="w-5 h-5 rounded-full bg-[#007069]/10 flex items-center justify-center hover:bg-[#007069]/20"
                            >
                              <RightOutlined className="text-xs text-[#007069]" />
                            </Link>
                          </AntTooltip>
                        </div>
                      </div>
                    </AntTooltip>
                    <div className="flex gap-2">
                      <div className="flex-1 bg-[#007069]/5 p-2 rounded-lg">
                        <p className="text-base font-bold text-[#007069]">8,634.12</p>
                        <p className="text-xs text-[#007069] mt-1">已签项目成本</p>
                      </div>
                      <div className="flex-1 bg-[#007069]/5 p-2 rounded-lg">
                        <p className="text-base font-bold text-[#007069]">1,908.19</p>
                        <p className="text-xs text-[#007069] mt-1">部门成本</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* 占位 */}
              <Card className="border-0 shadow-md">
                <CardContent className="p-4 h-full flex items-center justify-center min-h-[140px]">
                  <p className="text-sm text-gray-300">— 待规划 —</p>
                </CardContent>
              </Card>
            </div>

            {/* ── 市场数据（漏斗图）── */}
            <div className="px-4 mt-4">
              <Card className="border-0 shadow-md">
                <CardContent className="p-4">
                  <h3 className="font-medium text-sm text-gray-700 mb-4">
                    市场数据（万元）
                    <span className="ml-2 text-xs font-normal text-gray-400">
                      预计投标额 → 预计合同额 → 权重合同额
                    </span>
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {MARKET_DATA.map((m) => (
                      <div key={m.type}>
                        <div className="flex items-center gap-1.5 mb-2">
                          <span
                            className="inline-block w-2.5 h-2.5 rounded-full"
                            style={{ backgroundColor: m.color }}
                          />
                          <span className="text-xs font-medium text-gray-600">{m.type}</span>
                        </div>
                        <ResponsiveContainer width="100%" height={160}>
                          <FunnelChart>
                            <RechartsTooltip
                              formatter={(value: number, name: string) => [
                                `${fmt(value)} 万元`,
                                name,
                              ]}
                            />
                            <Funnel
                              dataKey="value"
                              data={m.items.map((item) => ({ ...item, fill: m.color }))}
                              isAnimationActive
                            >
                              {m.items.map((item, i) => (
                                <Cell
                                  key={item.name}
                                  fill={m.color}
                                  fillOpacity={1 - i * 0.22}
                                />
                              ))}
                              <LabelList
                                dataKey="name"
                                position="right"
                                style={{ fontSize: 11, fill: '#374151' }}
                              />
                              <LabelList
                                dataKey="value"
                                position="insideTop"
                                formatter={(v: number) => `${(v / 10000).toFixed(1)}亿`}
                                style={{ fontSize: 11, fill: '#fff', fontWeight: 600 }}
                              />
                            </Funnel>
                          </FunnelChart>
                        </ResponsiveContainer>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* ── 核心项目动态 ── */}
            <div className="px-4 mt-4">
              <Card className="border-0 shadow-md">
                <CardContent className="p-4">
                  <h3 className="font-medium text-sm text-gray-700 mb-3">
                    核心项目动态
                    <span className="ml-2 text-xs font-normal text-gray-400">
                      最新 3 条
                    </span>
                  </h3>
                  <div className="space-y-2">
                    {PROJECT_ACTIVITIES.map((item) => (
                      <AntTooltip
                        key={item.id}
                        title={`项目号：${item.id}；管理归属：${item.group}；时间：${item.time}`}
                      >
                        <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-100 hover:border-[#007069]/30 transition-colors cursor-default">
                          <span className="text-xs text-gray-400 font-mono w-20 flex-shrink-0">
                            {item.id}
                          </span>
                          <span className="flex-1 text-sm text-gray-700 truncate">{item.name}</span>
                          <span
                            className="text-xs px-2 py-0.5 rounded-full flex-shrink-0"
                            style={{
                              backgroundColor: `${TYPE_COLORS[item.group] ?? '#6b7280'}18`,
                              color: TYPE_COLORS[item.group] ?? '#6b7280',
                            }}
                          >
                            {item.group}
                          </span>
                          <span className="text-xs text-gray-400 flex-shrink-0">{item.time}</span>
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full flex-shrink-0 ${
                              STATUS_COLOR[item.status] ?? 'bg-gray-100 text-gray-600'
                            }`}
                          >
                            {item.status}
                          </span>
                        </div>
                      </AntTooltip>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* ── 人均产值趋势 ── */}
            <div className="px-4 mt-4">
              <Card className="border-0 shadow-md">
                <CardContent className="p-4">
                  <h3 className="font-medium text-sm text-gray-700 mb-1">
                    人均产值趋势（万元/人）
                  </h3>
                  <p className="text-xs text-gray-400 mb-4">
                    最近六个月 · 事业群合计 + 各板块
                  </p>
                  <ResponsiveContainer width="100%" height={220}>
                    <LineChart
                      data={trendData}
                      margin={{ top: 8, right: 16, bottom: 0, left: 8 }}
                    >
                      <CartesianGrid stroke="rgba(0,0,0,0.06)" horizontal vertical={false} />
                      <XAxis
                        dataKey="month"
                        tick={{ fontSize: 12, fill: '#6b7280' }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        tick={{ fontSize: 11, fill: '#6b7280' }}
                        axisLine={false}
                        tickLine={false}
                        width={36}
                        name="万元/人"
                      />
                      <RechartsTooltip
                        trigger="axis"
                        formatter={(value: number, name: string) => [
                          `${value.toFixed(2)} 万元/人`,
                          name,
                        ]}
                        contentStyle={{ fontSize: 12 }}
                      />
                      <Legend
                        wrapperStyle={{ fontSize: 11, paddingTop: 8 }}
                      />
                      {trendKeys.map((key, i) => (
                        <Line
                          key={key}
                          type="monotone"
                          dataKey={key}
                          stroke={LINE_COLORS[i % LINE_COLORS.length]}
                          strokeWidth={key === '事业群合计' ? 2.5 : 1.5}
                          strokeDasharray={key === '事业群合计' ? undefined : '4 2'}
                          dot={false}
                          connectNulls={false}
                        />
                      ))}
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* ── 占位区域 ── */}
            <div className="px-4 mt-4 grid grid-cols-1 lg:grid-cols-3 gap-4">
              {['待规划模块 A', '待规划模块 B', '待规划模块 C'].map((label) => (
                <Card key={label} className="border-0 shadow-md">
                  <CardContent className="p-4 flex items-center justify-center min-h-[100px]">
                    <p className="text-sm text-gray-300">— {label} —</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>
    </ConfigProvider>
  );
}
