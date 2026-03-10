'use client';

import { useParams, notFound } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
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
  'xinyewu': ['PMC板块', '咨询板块', '数字技术板块'],
  'nm-ls': ['新材料板块', '生命科学板块'],
  'haiwai': ['COII板块', '模块化板块', '供应链板块'],
  'dongbu': ['金山中心', '沈阳中心', '惠湛中心'],
  'xibu': ['银川中心'],
};

// 同一青绿色系，由深到浅提高区分度
const SECTOR_COLORS = ['#004d47', '#0d9488', '#14b8a6', '#2dd4bf', '#5eead4'];

const cardData = [
  {
    title: '年度新签合同额（万元）',
    value: '75,120.41',
    monthLabel: '11月新增',
    monthValue: '5,364.80',
    percentage: '12.5%',
    donutValue: 45.9,
    donutBySector: [16, 15.5, 14.4],
    subTargets: [
      { type: '设计及咨询', current: 25430.5, target: 40000, bySector: [8500, 9430.5, 7500] },
      { type: 'EPC', current: 42785.3, target: 80000, bySector: [14000, 14785.3, 14000] },
      { type: 'PMC', current: 6904.61, target: 15000, bySector: [2300, 2302.31, 2302.3] },
    ],
  },
  {
    title: '年度完成合同额（万元）',
    value: '38,322.29',
    monthLabel: '上月新增',
    monthValue: '5,364.80',
    percentage: '8.3%',
    donutValue: 37.1,
    donutBySector: [12.5, 13.2, 11.4],
    subTargets: [
      { type: '设计及咨询', current: 12845.2, target: 35000, bySector: [4200, 4345.2, 4300] },
      { type: 'EPC', current: 21634.8, target: 65000, bySector: [7200, 7214.8, 7220] },
      { type: 'PMC', current: 3842.29, target: 12000, bySector: [1280, 1281.09, 1281.2] },
    ],
  },
  {
    title: '年度完成开票额（万元）',
    value: '40,709.20',
    monthLabel: '上月新增',
    monthValue: '5,364.80',
    percentage: '8.3%',
    donutValue: 42.0,
    donutBySector: [14, 14.5, 13.5],
    subTargets: [
      { type: '设计及咨询', current: 15268.4, target: 38000, bySector: [5100, 5084.4, 5084] },
      { type: 'EPC', current: 22389.5, target: 70000, bySector: [7460, 7464.5, 7465] },
      { type: 'PMC', current: 3051.3, target: 13000, bySector: [1017, 1017.1, 1017.2] },
    ],
  },
  {
    title: '年度完成回款额（万元）',
    value: '42,165.17',
    monthLabel: '上月新增',
    monthValue: '5,364.80',
    percentage: '8.3%',
    donutValue: 44.5,
    donutBySector: [15, 15.2, 14.3],
    subTargets: [
      { type: '设计及咨询', current: 16845.2, target: 36000, bySector: [5615, 5615.2, 5615] },
      { type: 'EPC', current: 21583.67, target: 68000, bySector: [7194, 7194.89, 7194.78] },
      { type: 'PMC', current: 3736.3, target: 14000, bySector: [1245, 1245.1, 1246.2] },
    ],
  },
];

const marketDataLine = [
  { name: '预计合同额', value: 120000 },
  { name: '预计投标额', value: 85000 },
  { name: '权重合同额', value: 62000 },
];

const STATUS_TOOLTIP: Record<string, string> = {
  '新增': '该项目已被纳入核心项目跟踪，开始进行重点关注与保障。',
  '项目信息变更': '项目关键信息发生变化，包括：工程平台发起的 CRB 变更，以及数据中台发起的项目经理、项目名称、客户名称、执行日期等信息变更。',
  '保障活动更新': '该核心项目的保障活动配置项状态已更新，请关注最新进展。',
};

const projectActivityData = [
  { id: 'C25088', name: '上海石化公司全面技术改造和提质升级项目20万吨/年碳五分离装置（异戊烯部分）', sector: '金山中心', time: '2025-03-01', status: '新增', subStatus: undefined },
  { id: 'G25007', name: '梨树风光制绿氢生物质耦合绿色甲醇项目业主工程师服务', sector: '沈阳中心', time: '2025-02-28', status: '项目信息变更', subStatus: 'CRB变更' },
  { id: 'G25009', name: '神华化工公司重点工程项目项目管理服务', sector: 'PMC板块', time: '2025-02-25', status: '保障活动更新', subStatus: undefined },
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

function getDonutConfigBySector(segments: number[], size: 'large' | 'small') {
  const total = segments.reduce((a, b) => a + b, 0);
  const unfilled = Math.max(0, 100 - total);
  const data = [...segments.map((v, i) => ({ name: `Sector${i}`, value: v })), { name: 'Unfilled', value: unfilled }];
  const colors = [...segments.map((_, i) => SECTOR_COLORS[i % SECTOR_COLORS.length]), 'rgba(0, 112, 105, 0.2)'];
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
  const [showSubTargets, setShowSubTargets] = useState(false);
  const [hiddenOutputKeys, setHiddenOutputKeys] = useState<Record<string, boolean>>({});

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
            <div className="px-4 pt-0 pb-2 flex flex-wrap items-center gap-4">
              <Select value={selectedDept} onChange={setSelectedDept} options={departmentOptions} style={{ width: 200 }} className="text-[#007069]" />
              <Select
                placeholder="选择项目经理"
                allowClear
                style={{ width: 160 }}
                options={[
                  { value: 'pm1', label: '张伟' },
                  { value: 'pm2', label: '李娜' },
                  { value: 'pm3', label: '王磊' },
                  { value: 'pm4', label: '赵静' },
                ]}
                className="text-[#007069]"
              />
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
              <span className="ml-2 pl-4 border-l border-gray-200 flex items-center gap-3 flex-wrap flex-1">
                {sectors.map((sector, i) => (
                  <span key={sector} className="flex items-center gap-1.5 text-sm text-gray-600">
                    <span className="w-4 h-4 rounded shrink-0" style={{ backgroundColor: SECTOR_COLORS[i % SECTOR_COLORS.length] }} />
                    {sector}
                  </span>
                ))}
              </span>
              <button className="ml-auto flex items-center gap-2 px-4 py-1.5 bg-[#007069] text-white text-sm rounded-lg hover:bg-[#005c56] transition-colors shrink-0">
                <BarChartOutlined />
                月度统计
              </button>
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
                            <div className="absolute inset-0 flex items-center justify-center">{getDonutConfigBySector(card.donutBySector, 'large')}</div>
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-sm font-bold text-[#007069]">{card.donutValue}%</div>
                          </div>
                        </div>
                      </AntTooltip>
                      <div className={`overflow-hidden transition-all duration-300 ease-in-out ${showSubTargets ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'}`}>
                        <div className="mt-4 pt-4 border-t border-[#007069]/20">
                          {card.subTargets.map((target, idx) => {
                            const percentage = Math.min(100, (target.current / target.target) * 100).toFixed(1);
                            const bySector = target.bySector ?? [target.current];
                            return (
                              <div key={idx} className="mb-2 last:mb-0">
                                <div className="flex text-sm mb-1">
                                  <span className="text-gray-500">{target.type}</span>
                                  <span className="ml-4 text-[#007069]">
                                    {target.current.toLocaleString()} / {target.target.toLocaleString()}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <div className="flex-1 h-3 bg-[#007069]/20 rounded-full overflow-hidden flex">
                                    {bySector.map((seg, si) => {
                                      const segPct = Math.min(100, (seg / target.target) * 100);
                                      return (
                                        <div
                                          key={si}
                                          className="h-full transition-all duration-500 first:rounded-l-full last:rounded-r-full"
                                          style={{ width: `${segPct}%`, backgroundColor: SECTOR_COLORS[si % SECTOR_COLORS.length] }}
                                        />
                                      );
                                    })}
                                  </div>
                                  <span className="text-sm text-[#007069] shrink-0">{percentage}%</span>
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
                      <div className="flex items-center gap-2 mt-1">
                        <p className="text-sm text-[#007069]">合计成本</p>
                        <AntTooltip title="查看详情">
                          <Link href="/dashboard/cost-detail" className="w-5 h-5 rounded-full bg-[#007069]/10 flex items-center justify-center hover:bg-[#007069]/20 transition-colors">
                            <RightOutlined className="text-xs text-[#007069]" />
                          </Link>
                        </AntTooltip>
                      </div>
                    </div>
                    <div className="flex gap-2 w-full">
                      <div className="flex-1 bg-[#007069]/5 p-2 rounded-lg">
                        <p className="text-lg font-bold text-[#007069]">27,167.37</p>
                        <p className="text-sm text-[#007069] mt-1 whitespace-nowrap">项目成本</p>
                      </div>
                      <div className="flex-1 bg-[#007069]/5 p-2 rounded-lg">
                        <p className="text-lg font-bold text-[#007069]">6,032.32</p>
                        <div className="flex items-center gap-2 mt-1">
                          <p className="text-sm text-[#007069] whitespace-nowrap">管理成本</p>
                          <AntTooltip title="查看详情">
                            <Link href="/dashboard/department-cost-detail" className="w-5 h-5 rounded-full bg-[#007069]/10 flex items-center justify-center hover:bg-[#007069]/20 transition-colors">
                              <RightOutlined className="text-xs text-[#007069]" />
                            </Link>
                          </AntTooltip>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-md h-full">
                <CardContent className="p-4">
                  <h3 className="font-medium text-sm text-gray-700 mb-1">市场数据（万元）</h3>
                  <div className="h-[160px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={marketDataLine} margin={{ top: 32, right: 36, left: 36, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,112,105,0.1)" vertical={false} />
                        <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#115e59' }} axisLine={false} tickLine={false} interval={0} />
                        <YAxis hide />
                        <RechartsTooltip formatter={(value: number) => value.toLocaleString()} />
                        <Line type="monotone" dataKey="value" stroke="#007069" strokeWidth={2} dot={{ r: 4, fill: '#007069' }} activeDot={{ r: 5 }} connectNulls>
                          <LabelList position="top" dataKey="value" formatter={(v: number) => v.toLocaleString()} fill="#007069" fontSize={12} />
                        </Line>
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="px-4 grid grid-cols-1 lg:grid-cols-3 gap-4 mt-4">
              <Card className="border-0 shadow-md">
                <CardContent className="p-4">
                  <h3 className="font-medium text-sm text-gray-700 mb-3">最新核心项目动态</h3>
                  <div className="space-y-2">
                    {projectActivityData.map((row) => {
                      const statusColor: Record<string, { bg: string; text: string; dot: string }> = {
                        '新增': { bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500' },
                        '项目信息变更': { bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-500' },
                        '保障活动更新': { bg: 'bg-sky-50', text: 'text-sky-700', dot: 'bg-sky-500' },
                      };
                      const sc = statusColor[row.status] ?? { bg: 'bg-gray-50', text: 'text-gray-600', dot: 'bg-gray-400' };
                      const statusLabel = row.subStatus ? `${row.status} · ${row.subStatus}` : row.status;
                      return (
                        <div key={row.id} className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 hover:bg-[#007069]/5 transition-colors">
                          <div className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${sc.dot}`} />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 justify-between mb-1">
                              <AntTooltip title={STATUS_TOOLTIP[row.status]} placement="topLeft">
                                <span className={`text-xs px-1.5 py-0.5 rounded font-medium cursor-default ${sc.bg} ${sc.text}`}>
                                  {statusLabel}
                                </span>
                              </AntTooltip>
                              <span className="text-xs text-gray-400">{row.time}</span>
                            </div>
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="text-sm font-medium text-gray-800 font-mono shrink-0">{row.id}</span>
                              <span className="text-sm font-medium text-gray-800 truncate flex-1" title={row.name}>{row.name}</span>
                              <span className="text-xs text-[#007069] shrink-0">{row.sector}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-md">
                <CardContent className="p-4">
                  <h3 className="font-medium text-sm text-gray-700 mb-2">单位工时创造产值（万元/小时）</h3>
                  <div className="h-[220px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={outputTrendData} margin={{ top: 5, right: 0, left: -20, bottom: 0 }} barCategoryGap="25%">
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,112,105,0.1)" vertical={false} />
                        <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#115e59' }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 11, fill: '#115e59' }} axisLine={false} tickLine={false} />
                        <RechartsTooltip formatter={(value: number) => value.toFixed(2)} />
                        <Legend
                          verticalAlign="middle"
                          align="right"
                          layout="vertical"
                          wrapperStyle={{ paddingLeft: 16, fontSize: 12 }}
                          onClick={(data, _index, _e) => {
                            const key = data?.dataKey != null ? String(data.dataKey) : '';
                            if (key) setHiddenOutputKeys((prev) => ({ ...prev, [key]: !prev[key] }));
                          }}
                          formatter={(value, entry) => {
                            const key = entry?.dataKey != null ? String(entry.dataKey) : '';
                            const hidden = key && hiddenOutputKeys[key];
                            return <span style={{ cursor: 'pointer', opacity: hidden ? 0.5 : 1, fontSize: 12 }}>{value}</span>;
                          }}
                        />
                        <Bar dataKey="sectorA" name={sectors[0] || '板块1'} stackId="a" fill={SECTOR_COLORS[0]} hide={!!hiddenOutputKeys.sectorA} radius={[0, 0, 0, 0]} />
                        {sectors[1] && <Bar dataKey="sectorB" name={sectors[1]} stackId="a" fill={SECTOR_COLORS[1]} hide={!!hiddenOutputKeys.sectorB} />}
                        {sectors[2] && <Bar dataKey="sectorC" name={sectors[2]} stackId="a" fill={SECTOR_COLORS[2]} hide={!!hiddenOutputKeys.sectorC} radius={[3, 3, 0, 0]} />}
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-0 shadow-md">
                <CardContent className="p-4">

                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </ConfigProvider>
  );
}
