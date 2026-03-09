'use client';

import { useParams, notFound } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  FunnelChart,
  Funnel,
  LabelList,
  Legend,
} from 'recharts';
import {
  ArrowUpOutlined,
  DashboardOutlined,
  BarChartOutlined,
  SettingOutlined,
  RightOutlined,
} from '@ant-design/icons';
import { Select, Switch, Tooltip as AntTooltip } from 'antd';
import { useState } from 'react';
import { ConfigProvider } from 'antd';

const ORG_SLUGS = ['xinyewu', 'nm-ls', 'haiwai', 'dongbu', 'xibu'] as const;
type OrgSlug = (typeof ORG_SLUGS)[number];

const SLUG_TO_NAME: Record<OrgSlug, string> = {
  'xinyewu': '新业务项目群',
  'nm-ls': 'NM&LS 项目群',
  'haiwai': '海外项目群',
  'dongbu': '东部项目群',
  'xibu': '西部项目群',
};

const SLUG_TO_SECTORS: Record<OrgSlug, string[]> = {
  'xinyewu': ['SAS170 PMC板块', 'SAS610 咨询板块', 'SAS680 数字技术板块'],
  'nm-ls': ['SAS650 新材料板块', 'SAS710 生命科学板块'],
  'haiwai': ['SAS690 COII板块', 'SAS720 模块化板块', 'SAS670 供应链板块'],
  'dongbu': ['SAS520 金山中心', 'SAS560 沈阳中心', 'SAS550 惠湛中心'],
  'xibu': ['SAS530 银川中心'],
};

const SECTOR_COLORS = ['#007069', '#005c56', '#0d9488', '#2dd4bf', '#14b8a6'];

const cardData = [
  {
    title: '年度新签合同额（万元）',
    value: '75,120.41',
    monthLabel: '11月新增',
    monthValue: '5,364.80',
    percentage: '12.5%',
    donutValue: 45.9,
    subTargets: [
      { type: '设计及咨询', current: 25430.5, target: 40000 },
      { type: 'EPC', current: 42785.3, target: 80000 },
      { type: 'PMC', current: 6904.61, target: 15000 },
    ],
  },
  {
    title: '年度完成合同额（万元）',
    value: '38,322.29',
    monthLabel: '上月新增',
    monthValue: '5,364.80',
    percentage: '8.3%',
    donutValue: 37.1,
    subTargets: [
      { type: '设计及咨询', current: 12845.2, target: 35000 },
      { type: 'EPC', current: 21634.8, target: 65000 },
      { type: 'PMC', current: 3842.29, target: 12000 },
    ],
  },
  {
    title: '年度完成开票额（万元）',
    value: '40,709.20',
    monthLabel: '上月新增',
    monthValue: '5,364.80',
    percentage: '8.3%',
    donutValue: 42.0,
    subTargets: [
      { type: '设计及咨询', current: 15268.4, target: 38000 },
      { type: 'EPC', current: 22389.5, target: 70000 },
      { type: 'PMC', current: 3051.3, target: 13000 },
    ],
  },
  {
    title: '年度完成回款额（万元）',
    value: '42,165.17',
    monthLabel: '上月新增',
    monthValue: '5,364.80',
    percentage: '8.3%',
    donutValue: 44.5,
    subTargets: [
      { type: '设计及咨询', current: 16845.2, target: 36000 },
      { type: 'EPC', current: 21583.67, target: 68000 },
      { type: 'PMC', current: 3736.3, target: 14000 },
    ],
  },
];

const funnelData = [
  { name: '预计投标额', value: 120000, fill: '#007069' },
  { name: '预计合同额', value: 85000, fill: '#005c56' },
  { name: '权重合同额', value: 62000, fill: '#0d9488' },
];

const projectActivityData = [
  { id: 'P001', name: '某炼油厂扩建项目', sector: 'SAS520 金山中心', time: '2025-03-01', status: '新增' },
  { id: 'P002', name: '某石化储备库项目', sector: 'SAS560 沈阳中心', time: '2025-02-28', status: '项目信息变更' },
  { id: 'P003', name: '某化工园区建设项目', sector: 'SAS170 PMC板块', time: '2025-02-25', status: '保障活动更新' },
];

const outputTrendMonths = ['9月', '10月', '11月', '12月', '1月', '2月'];
const outputTrendData = [
  { month: '9月', total: 12.5, sectorA: 4.2, sectorB: 3.8, sectorC: 4.5 },
  { month: '10月', total: 13.1, sectorA: 4.5, sectorB: 4.0, sectorC: 4.6 },
  { month: '11月', total: 12.8, sectorA: 4.3, sectorB: 4.2, sectorC: 4.3 },
  { month: '12月', total: 14.0, sectorA: 4.8, sectorB: 4.5, sectorC: 4.7 },
  { month: '1月', total: 13.5, sectorA: 4.6, sectorB: 4.3, sectorC: 4.6 },
  { month: '2月', total: 13.2, sectorA: 4.4, sectorB: 4.4, sectorC: 4.4 },
];

function getDonutConfig(value: number, size: 'large' | 'small') {
  const data = [
    { name: 'Filled', value },
    { name: 'Unfilled', value: 100 - value },
  ];
  const colors = ['#007069', 'rgba(0, 112, 105, 0.2)'];
  return (
    <ResponsiveContainer width={size === 'large' ? 100 : 80} height={size === 'large' ? 100 : 80}>
      <PieChart>
        <Pie
          data={data}
          innerRadius="70%"
          outerRadius="100%"
          dataKey="value"
          startAngle={90}
          endAngle={-270}
          stroke="none"
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={colors[index]} />
          ))}
        </Pie>
      </PieChart>
    </ResponsiveContainer>
  );
}

export default function OrgDashboardPage() {
  const params = useParams();
  const slug = params?.slug as string | undefined;
  const [selectedDept, setSelectedDept] = useState('all');
  const [showSubTargets, setShowSubTargets] = useState(true);

  if (!slug || !ORG_SLUGS.includes(slug as OrgSlug)) {
    notFound();
  }

  const orgSlug = slug as OrgSlug;
  const orgName = SLUG_TO_NAME[orgSlug];
  const sectors = SLUG_TO_SECTORS[orgSlug];

  const departmentOptions = [{ value: 'all', label: '全部' }, ...sectors.map((s) => ({ value: s, label: s }))];

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
        <div className="fixed left-0 top-0 h-screen w-16 bg-gray-800 p-2 flex flex-col items-center z-10">
          <Link href="/" className="mb-8 mt-4 w-12 h-12 bg-white rounded-full flex items-center justify-center hover:opacity-90">
            <span className="text-gray-800 text-2xl font-bold">W</span>
          </Link>
          <div className="flex-1 flex flex-col mt-8 space-y-8">
            <Link href="/dashboard" className="w-6 h-6 text-gray-400 hover:bg-gray-700 rounded-lg flex items-center justify-center" title="项目中台">
              <DashboardOutlined className="w-6 h-6" />
            </Link>
            <span className="w-6 h-6 text-white bg-gray-700 rounded-lg flex items-center justify-center" title="事业群看板">
              <BarChartOutlined className="w-6 h-6" />
            </span>
            <span className="w-6 h-6 text-gray-400 hover:bg-gray-700 rounded-lg flex items-center justify-center">
              <SettingOutlined className="w-6 h-6" />
            </span>
          </div>
        </div>

        <div className="ml-16 pb-4 space-y-4 bg-[#f8faff] w-[calc(100%-4rem)] min-h-screen overflow-x-hidden">
          <div className="fixed top-0 left-16 right-0 h-20 bg-white shadow-sm z-20">
            <h2 className="pt-6 pl-6 text-2xl">运营看板 - {orgName}</h2>
          </div>

          <div className="pt-20">
            <div className="px-4 pt-0 pb-2 flex items-center gap-4">
              <Select value={selectedDept} onChange={setSelectedDept} options={departmentOptions} style={{ width: 200 }} className="text-[#007069]" />
              <Select
                defaultValue="2025年"
                style={{ width: 90 }}
                options={[
                  { value: '2025', label: '2025年' },
                  { value: '2024', label: '2024年' },
                  { value: '2023', label: '2023年' },
                ]}
                className="text-[#007069]"
              />
              <div className="flex items-center gap-2">
                <span className="text-sm text-[#007069]">显示子目标</span>
                <Switch checked={showSubTargets} onChange={setShowSubTargets} />
              </div>
            </div>

            {/* 板块图例 */}
            <div className="px-4 pb-2 flex flex-wrap items-center gap-4">
              <span className="text-sm font-medium text-gray-600">板块：</span>
              {sectors.map((sector, i) => (
                <span key={sector} className="flex items-center gap-1.5 text-sm">
                  <span className="w-4 h-4 rounded" style={{ backgroundColor: SECTOR_COLORS[i % SECTOR_COLORS.length] }} />
                  {sector}
                </span>
              ))}
            </div>

            <div className="px-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {cardData.map((card, index) => (
                  <Card key={index} className="border-0 shadow-md">
                    <CardContent className="p-4">
                      <AntTooltip title={`${card.title}，由下属板块汇总`}>
                        <div className="flex justify-between items-center">
                          <div>
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="font-medium text-sm text-gray-700">{card.title}</h3>
                              <Link href="/dashboard/detail" className="w-5 h-5 rounded-full bg-[#007069]/10 flex items-center justify-center hover:bg-[#007069]/20 transition-colors">
                                <RightOutlined className="text-xs text-[#007069]" />
                              </Link>
                            </div>
                            <div className="text-3xl font-bold text-[#007069]">{card.value}</div>
                            <div className="flex items-center mt-2 text-sm">
                              <span className="text-gray-500 mr-2">{card.monthLabel}</span>
                              <span className="text-gray-500 mr-2">{card.monthValue}</span>
                              <span className="px-2 py-0.5 text-xs rounded-full bg-green-100 text-green-800">{card.percentage}</span>
                            </div>
                          </div>
                          <div className="relative w-24 h-24">
                            <div className="absolute inset-0 flex items-center justify-center">{getDonutConfig(card.donutValue, 'large')}</div>
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-sm font-bold text-[#007069]">{card.donutValue}%</div>
                          </div>
                        </div>
                      </AntTooltip>
                      <div className={`overflow-hidden transition-all duration-300 ease-in-out ${showSubTargets ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'}`}>
                        <div className="mt-4 pt-4 border-t border-[#007069]/20">
                          {card.subTargets.map((target, idx) => {
                            const percentage = Math.min(100, (target.current / target.target) * 100).toFixed(1);
                            return (
                              <div key={idx} className="mb-2 last:mb-0">
                                <div className="flex text-sm mb-1">
                                  <span className="text-gray-500">{target.type}</span>
                                  <span className="ml-4 text-[#007069]">
                                    {target.current.toLocaleString()} / {target.target.toLocaleString()}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <div className="flex-1 h-3 bg-[#007069]/20 rounded-full overflow-hidden">
                                    <div className="h-full bg-[#007069] rounded-full transition-all duration-500" style={{ width: `${percentage}%` }} />
                                  </div>
                                  <span className="text-sm text-[#007069]">{percentage}%</span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            <div className="px-4 grid grid-cols-1 lg:grid-cols-3 gap-4 mt-4">
              <Card className="border-0 shadow-md h-full">
                <CardContent className="p-4">
                  <h3 className="font-medium text-sm text-gray-700 mb-2">应收款项（万元）</h3>
                  <div className="space-y-2">
                    <div className="bg-[#007069]/10 p-3 rounded-lg">
                      <div className="flex items-center justify-between">
                        <p className="text-xl font-bold text-[#007069]">22,947.25</p>
                        <div className="flex items-center text-red-500 text-sm whitespace-nowrap">
                          <ArrowUpOutlined className="w-4 h-4 mr-1" />
                          <span>1,344</span>
                        </div>
                      </div>
                      <p className="text-sm text-[#007069] mt-1">当前WIP</p>
                    </div>
                    <div className="bg-[#007069]/10 p-3 rounded-lg">
                      <div className="flex items-center justify-between">
                        <p className="text-xl font-bold text-[#007069]">12,434.70</p>
                        <div className="flex items-center text-red-500 text-sm whitespace-nowrap">
                          <ArrowUpOutlined className="w-4 h-4 mr-1" />
                          <span>2,043</span>
                        </div>
                      </div>
                      <p className="text-sm text-[#007069] mt-1">应收账款</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-md h-full">
                <CardContent className="p-4">
                  <h3 className="font-medium text-sm text-gray-700 mb-2">成本分析（万元）</h3>
                  <div className="space-y-2">
                    <div className="bg-[#007069]/10 p-3 rounded-lg">
                      <p className="text-xl font-bold text-[#007069]">33,199.69</p>
                      <p className="text-sm text-[#007069] mt-1">合计成本</p>
                    </div>
                    <div className="flex gap-2 w-full">
                      <div className="flex-1 bg-[#007069]/5 p-2 rounded-lg">
                        <p className="text-lg font-bold text-[#007069]">27,167.37</p>
                        <p className="text-sm text-[#007069] mt-1 whitespace-nowrap">已签项目成本</p>
                      </div>
                      <div className="flex-1 bg-[#007069]/5 p-2 rounded-lg">
                        <p className="text-lg font-bold text-[#007069]">6,032.32</p>
                        <p className="text-sm text-[#007069] mt-1 whitespace-nowrap">部门成本</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-md h-full">
                <CardContent className="p-4">
                  <h3 className="font-medium text-sm text-gray-700 mb-1">市场数据（万元）</h3>
                  <p className="text-xs text-gray-500 mb-2">预计合同额 → 预计投标额 → 权重合同额</p>
                  <div className="h-[180px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <FunnelChart>
                        <Legend formatter={(_, entry) => (entry as { payload?: { name?: string } }).payload?.name ?? ''} />
                        <Funnel dataKey="value" data={funnelData} nameKey="name">
                          <LabelList position="right" fill="#000" dataKey="name" />
                          <LabelList position="right" fill="#007069" dataKey="value" formatter={(v: number) => v.toLocaleString()} />
                        </Funnel>
                      </FunnelChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="px-4 grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
              <Card className="border-0 shadow-md">
                <CardContent className="p-4">
                  <h3 className="font-medium text-sm text-gray-700 mb-2">核心项目动态（最新3条）</h3>
                  <div className="space-y-2">
                    {projectActivityData.map((row) => (
                      <div key={row.id} className="flex flex-wrap items-center gap-x-4 gap-y-1 py-2 border-b border-gray-100 last:border-0 text-sm">
                        <span className="font-medium text-[#007069]">{row.id}</span>
                        <span>{row.name}</span>
                        <span className="text-gray-500">{row.sector}</span>
                        <span className="text-gray-500">{row.time}</span>
                        <span className="px-2 py-0.5 rounded bg-[#007069]/10 text-[#007069]">{row.status}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-md">
                <CardContent className="p-4">
                  <h3 className="font-medium text-sm text-gray-700 mb-2">人均产值趋势（万元/人，最近6个月）</h3>
                  <div className="h-[200px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={outputTrendData} margin={{ top: 5, right: 20, left: -10, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,112,105,0.1)" />
                        <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#115e59' }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 11, fill: '#115e59' }} axisLine={false} tickLine={false} />
                        <RechartsTooltip formatter={(value: number) => value.toFixed(2)} />
                        <Line type="monotone" dataKey="total" name="事业群合计" stroke="#007069" strokeWidth={2} dot={{ r: 3 }} />
                        <Line type="monotone" dataKey="sectorA" name={sectors[0] || '板块1'} stroke="#005c56" strokeWidth={1.5} dot={{ r: 2 }} />
                        {sectors[1] && <Line type="monotone" dataKey="sectorB" name={sectors[1]} stroke="#0d9488" strokeWidth={1.5} dot={{ r: 2 }} />}
                        {sectors[2] && <Line type="monotone" dataKey="sectorC" name={sectors[2]} stroke="#2dd4bf" strokeWidth={1.5} dot={{ r: 2 }} />}
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </ConfigProvider>
  );
}
