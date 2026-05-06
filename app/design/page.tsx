'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  LayoutDashboard, BarChart3, Users, Wrench, ChevronRight,
  ArrowUpRight, Search, Bell, User, Home, FileText,
  AlertCircle, CheckCircle2, Info,
} from 'lucide-react';
import {
  PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar,
} from 'recharts';
import Link from 'next/link';

const lineData = [
  { month: '1月', value: 72 }, { month: '2月', value: 78 },
  { month: '3月', value: 85 }, { month: '4月', value: 81 },
  { month: '5月', value: 88 }, { month: '6月', value: 92 },
];

const barData = [
  { name: '工艺部', hours: 4200 }, { name: '设备部', hours: 3800 },
  { name: '管道部', hours: 5100 }, { name: '电气部', hours: 2900 },
  { name: '仪表部', hours: 3400 },
];

const donutData = (val: number) => [
  { name: 'filled', value: val },
  { name: 'empty', value: 100 - val },
];

const BRAND = '#007069';
const BRAND_LIGHT = 'rgba(0,112,105,0.2)';

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section className="mb-12">
    <div className="flex items-center gap-3 mb-6">
      <div className="w-1 h-6 bg-[#007069] rounded-full" />
      <h2 className="text-lg font-semibold text-gray-800">{title}</h2>
    </div>
    {children}
  </section>
);

const ColorSwatch = ({ color, label, textColor = 'text-gray-700' }: { color: string; label: string; textColor?: string }) => (
  <div className="flex flex-col gap-1.5">
    <div className="h-14 rounded-lg border border-gray-100 shadow-sm" style={{ background: color }} />
    <p className="text-xs font-medium text-gray-600 leading-tight">{label}</p>
    <p className={`text-xs font-mono ${textColor} opacity-70`}>{color}</p>
  </div>
);

export default function DesignShowcase() {
  return (
    <div className="min-h-screen bg-[#f8faff]">

      {/* 顶部导航 */}
      <nav className="bg-white shadow-sm sticky top-0 z-10 border-b border-gray-100">
        <div className="container mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-[#007069] rounded-lg flex items-center justify-center">
              <span className="text-white text-sm font-bold">W</span>
            </div>
            <span className="font-semibold text-gray-800">Wood 工程平台</span>
            <span className="text-gray-300 mx-1">·</span>
            <span className="text-sm text-[#007069] font-medium">设计系统</span>
          </div>
          <div className="flex items-center gap-2">
            {['平台首页', '项目中台', '专家资源', '工程软件'].map((item, i) => (
              <button
                key={item}
                className={`text-sm px-3 py-1.5 rounded transition-colors ${
                  i === 0
                    ? 'bg-[#007069] text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {item}
              </button>
            ))}
            <div className="ml-2 flex items-center gap-1.5">
              <button className="w-8 h-8 flex items-center justify-center text-gray-500 hover:bg-gray-100 rounded-lg transition-colors">
                <Bell className="h-4 w-4" />
              </button>
              <button className="w-8 h-8 flex items-center justify-center text-gray-500 hover:bg-gray-100 rounded-lg transition-colors">
                <User className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-6 py-10 max-w-6xl">

        {/* 页眉 */}
        <div className="mb-12">
          <h1 className="text-2xl font-semibold text-gray-800 mb-1">Wood 工程平台 · 设计系统展示</h1>
          <p className="text-sm text-gray-500">主题色 #007069 · 背景色 #f8faff · 简洁商务风格</p>
        </div>

        {/* ──────────────── 色彩系统 ──────────────── */}
        <Section title="色彩系统">
          <div className="space-y-6">
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">品牌色阶</p>
              <div className="grid grid-cols-4 sm:grid-cols-8 gap-3">
                <ColorSwatch color="#007069" label="Brand" />
                <ColorSwatch color="#005c56" label="Hover" />
                <ColorSwatch color="#004842" label="Active" />
                <ColorSwatch color="rgba(0,112,105,0.2)" label="Tint 20%" />
                <ColorSwatch color="rgba(0,112,105,0.1)" label="Tint 10%" />
                <ColorSwatch color="rgba(0,112,105,0.05)" label="Tint 5%" />
                <ColorSwatch color="rgba(0,112,105,0.03)" label="Tint 3%" />
                <ColorSwatch color="#115e59" label="Chart Axis" />
              </div>
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">中性色 / 背景</p>
              <div className="grid grid-cols-4 sm:grid-cols-7 gap-3">
                <ColorSwatch color="#f8faff" label="内容背景" />
                <ColorSwatch color="#f3f4f6" label="页面背景" />
                <ColorSwatch color="#ffffff" label="卡片/顶栏" />
                <ColorSwatch color="#f9fafb" label="卡片头部" />
                <ColorSwatch color="#374151" label="主文字" />
                <ColorSwatch color="#6b7280" label="次文字" />
                <ColorSwatch color="#233845" label="侧边栏" />
              </div>
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">语义色</p>
              <div className="grid grid-cols-4 sm:grid-cols-6 gap-3">
                <ColorSwatch color="#dcfce7" label="成功背景" />
                <ColorSwatch color="#166534" label="成功文字" />
                <ColorSwatch color="#fef9c3" label="警告背景" />
                <ColorSwatch color="#f59e0b" label="警告" />
                <ColorSwatch color="#fee2e2" label="错误背景" />
                <ColorSwatch color="#ef4444" label="错误/增幅" />
              </div>
            </div>
          </div>
        </Section>

        {/* ──────────────── 字体层级 ──────────────── */}
        <Section title="字体层级">
          <Card className="border-0 shadow-md">
            <CardContent className="p-8 space-y-5">
              <div className="flex items-baseline gap-6 pb-4 border-b border-gray-100">
                <span className="text-xs text-gray-400 w-28 shrink-0">页面主标题</span>
                <span className="text-2xl font-semibold text-gray-800">Wood 工程平台 · 运营看板</span>
              </div>
              <div className="flex items-baseline gap-6 pb-4 border-b border-gray-100">
                <span className="text-xs text-gray-400 w-28 shrink-0">卡片标题大</span>
                <span className="text-lg font-semibold text-gray-800">年度新签合同额（万元）</span>
              </div>
              <div className="flex items-baseline gap-6 pb-4 border-b border-gray-100">
                <span className="text-xs text-gray-400 w-28 shrink-0">卡片标题小</span>
                <span className="text-sm font-medium text-gray-700">部门协作分析 · 本月负荷率</span>
              </div>
              <div className="flex items-baseline gap-6 pb-4 border-b border-gray-100">
                <span className="text-xs text-gray-400 w-28 shrink-0">数据大值</span>
                <span className="text-3xl font-bold text-[#007069]">75,120.41</span>
              </div>
              <div className="flex items-baseline gap-6 pb-4 border-b border-gray-100">
                <span className="text-xs text-gray-400 w-28 shrink-0">数据中值</span>
                <span className="text-xl font-bold text-[#007069]">22,947.25</span>
              </div>
              <div className="flex items-baseline gap-6 pb-4 border-b border-gray-100">
                <span className="text-xs text-gray-400 w-28 shrink-0">正文/表格</span>
                <span className="text-sm text-gray-700">工艺设计部 · 张伟 · EPC 项目 · 2026-04-28</span>
              </div>
              <div className="flex items-baseline gap-6">
                <span className="text-xs text-gray-400 w-28 shrink-0">辅助/元信息</span>
                <span className="text-xs text-gray-500">上月新增 5,364.80 · 较上期增长 12.5%</span>
              </div>
            </CardContent>
          </Card>
        </Section>

        {/* ──────────────── 按钮 ──────────────── */}
        <Section title="按钮">
          <Card className="border-0 shadow-md">
            <CardContent className="p-6 space-y-6">
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-xs text-gray-400 w-24 shrink-0">主操作按钮</span>
                <button className="px-4 py-1.5 bg-[#007069] text-white text-sm rounded-lg hover:bg-[#005c56] transition-colors">
                  查询
                </button>
                <button className="px-4 py-1.5 bg-[#007069] text-white text-sm rounded-lg hover:bg-[#005c56] transition-colors flex items-center gap-1.5">
                  <BarChart3 className="h-4 w-4" />
                  月度统计
                </button>
                <button className="px-4 py-1.5 bg-[#007069] text-white text-sm rounded-lg hover:bg-[#005c56] transition-colors">
                  导出 CSV
                </button>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-xs text-gray-400 w-24 shrink-0">导航激活态</span>
                <button className="text-sm px-3 py-1.5 bg-[#007069] text-white rounded transition-colors">
                  项目中台
                </button>
                <button className="text-sm px-3 py-1.5 text-gray-600 hover:bg-gray-100 rounded transition-colors">
                  专家资源
                </button>
                <button className="text-sm px-3 py-1.5 text-gray-600 hover:bg-gray-100 rounded transition-colors">
                  工程软件
                </button>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-xs text-gray-400 w-24 shrink-0">Ghost / Outline</span>
                <Button variant="ghost" size="sm">取消</Button>
                <Button variant="outline" size="sm">导入</Button>
                <Button variant="outline" size="sm" className="flex items-center gap-1.5">
                  <FileText className="h-4 w-4" />
                  下载模板
                </Button>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-xs text-gray-400 w-24 shrink-0">图标链接按钮</span>
                <button className="w-5 h-5 rounded-full bg-[#007069]/10 flex items-center justify-center hover:bg-[#007069]/20 transition-colors">
                  <ChevronRight className="h-3 w-3 text-[#007069]" />
                </button>
                <button className="w-6 h-6 rounded-full bg-[#007069]/10 flex items-center justify-center hover:bg-[#007069]/20 transition-colors">
                  <ChevronRight className="h-3.5 w-3.5 text-[#007069]" />
                </button>
                <span className="text-xs text-gray-400">用于卡片内跳转详情</span>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-xs text-gray-400 w-24 shrink-0">快速入口</span>
                <button className="h-24 w-24 flex flex-col items-center justify-center text-xs border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors gap-2">
                  <LayoutDashboard className="h-7 w-7 text-gray-500" />
                  工时上报
                </button>
                <button className="h-24 w-24 flex flex-col items-center justify-center text-xs border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors gap-2">
                  <FileText className="h-7 w-7 text-gray-500" />
                  电子申请
                </button>
                <button className="h-24 w-24 flex flex-col items-center justify-center text-xs border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors gap-2">
                  <Wrench className="h-7 w-7 text-gray-500" />
                  设计文件
                </button>
              </div>
            </CardContent>
          </Card>
        </Section>

        {/* ──────────────── 标签 / 徽章 ──────────────── */}
        <Section title="标签与徽章">
          <Card className="border-0 shadow-md">
            <CardContent className="p-6 flex flex-wrap items-center gap-3">
              <span className="px-2 py-0.5 text-xs rounded-full bg-green-100 text-green-800">+12.5%</span>
              <span className="px-2 py-0.5 text-xs rounded-full bg-green-100 text-green-800">已完成</span>
              <span className="px-2 py-0.5 text-xs rounded-full bg-yellow-100 text-yellow-700">进行中</span>
              <span className="px-2 py-0.5 text-xs rounded-full bg-red-100 text-red-700">逾期</span>
              <span className="px-2 py-0.5 text-xs rounded-full bg-[#007069]/10 text-[#007069]">EPC</span>
              <span className="px-2 py-0.5 text-xs rounded-full bg-[#007069]/10 text-[#007069]">设计及咨询</span>
              <span className="px-2 py-0.5 text-xs rounded-full bg-gray-100 text-gray-600">PMC</span>
              <span className="px-2 py-0.5 text-xs rounded-full bg-gray-100 text-gray-600">已归档</span>
              <div className="flex items-center gap-1.5 ml-4">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <AlertCircle className="h-4 w-4 text-yellow-500" />
                <Info className="h-4 w-4 text-[#007069]" />
                <AlertCircle className="h-4 w-4 text-red-500" />
              </div>
            </CardContent>
          </Card>
        </Section>

        {/* ──────────────── 数据看板卡片 ──────────────── */}
        <Section title="数据看板卡片">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { title: '年度新签合同额（万元）', value: '75,120.41', label: '11月新增', sub: '5,364.80', pct: '+12.5%', donut: 45.9 },
              { title: '年度完成合同额（万元）', value: '38,322.29', label: '上月新增', sub: '5,364.80', pct: '+8.3%', donut: 37.1 },
              { title: '年度完成开票额（万元）', value: '40,709.20', label: '上月新增', sub: '5,364.80', pct: '+8.3%', donut: 42.0 },
              { title: '年度完成回款额（万元）', value: '42,165.17', label: '上月新增', sub: '5,364.80', pct: '+8.3%', donut: 44.5 },
            ].map((card) => (
              <Card key={card.title} className="border-0 shadow-md">
                <CardContent className="p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-medium text-sm text-gray-700 truncate">{card.title}</h3>
                        <button className="w-5 h-5 rounded-full bg-[#007069]/10 flex items-center justify-center hover:bg-[#007069]/20 transition-colors shrink-0">
                          <ChevronRight className="h-3 w-3 text-[#007069]" />
                        </button>
                      </div>
                      <div className="text-3xl font-bold text-[#007069]">{card.value}</div>
                      <div className="flex items-center gap-2 mt-2 text-sm flex-wrap">
                        <span className="text-gray-500">{card.label}</span>
                        <span className="text-gray-500">{card.sub}</span>
                        <span className="px-2 py-0.5 text-xs rounded-full bg-green-100 text-green-800">{card.pct}</span>
                      </div>
                    </div>
                    <div className="relative w-20 h-20 shrink-0 ml-2">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={donutData(card.donut)} innerRadius="70%" outerRadius="100%" dataKey="value" startAngle={90} endAngle={-270} stroke="none">
                            <Cell fill={BRAND} />
                            <Cell fill={BRAND_LIGHT} />
                          </Pie>
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="absolute inset-0 flex items-center justify-center text-sm font-bold text-[#007069]">
                        {card.donut}%
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </Section>

        {/* ──────────────── 数据块 (Tinted Tile) ──────────────── */}
        <Section title="数据块 (Tinted Tile)">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="border-0 shadow-md">
              <CardContent className="p-4 space-y-2">
                <h3 className="font-medium text-sm text-gray-700 mb-3">应收款项（万元）</h3>
                <div className="bg-[#007069]/10 p-3 rounded-lg">
                  <div className="flex items-center justify-between">
                    <p className="text-xl font-bold text-[#007069]">22,947.25</p>
                    <div className="flex items-center text-red-500 text-sm">
                      <ArrowUpRight className="h-4 w-4" />
                      <span>1,344</span>
                    </div>
                  </div>
                  <p className="text-sm text-[#007069] mt-1">当前 WIP</p>
                </div>
                <div className="bg-[#007069]/10 p-3 rounded-lg">
                  <div className="flex items-center justify-between">
                    <p className="text-xl font-bold text-[#007069]">12,434.70</p>
                    <div className="flex items-center text-red-500 text-sm">
                      <ArrowUpRight className="h-4 w-4" />
                      <span>2,043</span>
                    </div>
                  </div>
                  <p className="text-sm text-[#007069] mt-1">应收账款</p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-md">
              <CardContent className="p-4 space-y-2">
                <h3 className="font-medium text-sm text-gray-700 mb-3">工程软件覆盖率</h3>
                <div className="grid grid-cols-3 gap-2">
                  {[{ v: '39.69%', l: 'S3D/E3D' }, { v: '14.59%', l: 'SPPID' }, { v: '20.46%', l: 'SPIAI' }].map((t) => (
                    <div key={t.l} className="bg-[#007069]/10 p-3 rounded-lg">
                      <div className="text-lg font-bold text-[#007069]">{t.v}</div>
                      <p className="text-xs text-[#007069] mt-1">{t.l}</p>
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {[{ v: '16,432', l: 'S3D/E3D' }, { v: '1,427', l: 'SPPID' }, { v: '288', l: 'SPIAI' }].map((t) => (
                    <div key={t.l} className="bg-[#007069]/5 p-3 rounded-lg">
                      <div className="text-lg font-bold text-[#007069]">{t.v}</div>
                      <p className="text-xs text-[#007069] mt-1">{t.l}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-md">
              <CardContent className="p-4">
                <h3 className="font-medium text-sm text-gray-700 mb-3">负荷率</h3>
                {[{ label: '全年', value: 87 }, { label: '当月', value: 96 }].map((item) => (
                  <div key={item.label} className="mb-3">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-sm text-gray-600">{item.label}</span>
                      <span className="text-sm font-bold text-[#007069]">{item.value}%</span>
                    </div>
                    <div className="h-3 bg-[#007069]/20 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#007069] rounded-full transition-all duration-500"
                        style={{ width: `${item.value}%` }}
                      />
                    </div>
                  </div>
                ))}
                <div className="mt-4 pt-3 border-t border-gray-100">
                  <h4 className="text-xs text-gray-500 mb-2">子目标拆解</h4>
                  {[
                    { type: '设计及咨询', current: 25430.5, target: 40000 },
                    { type: 'EPC', current: 42785.3, target: 80000 },
                    { type: 'PMC', current: 6904.61, target: 15000 },
                  ].map((t) => {
                    const pct = Math.min(100, (t.current / t.target) * 100).toFixed(1);
                    return (
                      <div key={t.type} className="mb-2">
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-gray-500">{t.type}</span>
                          <span className="text-[#007069]">{pct}%</span>
                        </div>
                        <div className="h-2 bg-[#007069]/20 rounded-full overflow-hidden">
                          <div className="h-full bg-[#007069] rounded-full" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </Section>

        {/* ──────────────── 图表 ──────────────── */}
        <Section title="图表">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="border-0 shadow-md">
              <CardContent className="p-4">
                <h3 className="font-medium text-sm text-gray-700 mb-4">月度合同完成率趋势</h3>
                <ResponsiveContainer width="100%" height={180}>
                  <LineChart data={lineData} margin={{ top: 10, right: 16, bottom: 0, left: -20 }}>
                    <CartesianGrid horizontal vertical={false} stroke="rgba(0,112,105,0.1)" />
                    <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#115e59' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} domain={[65, 100]} />
                    <Tooltip
                      content={({ active, payload }) =>
                        active && payload?.length ? (
                          <div className="bg-white p-2 border border-teal-200 rounded shadow-sm text-sm text-[#007069]">
                            {payload[0].payload.month}: {payload[0].value}%
                          </div>
                        ) : null
                      }
                    />
                    <Line type="monotone" dataKey="value" stroke={BRAND} strokeWidth={2} dot={{ r: 3, fill: BRAND }} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-md">
              <CardContent className="p-4">
                <h3 className="font-medium text-sm text-gray-700 mb-4">各部门工时分布</h3>
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={barData} margin={{ top: 10, right: 16, bottom: 0, left: -20 }}>
                    <CartesianGrid horizontal vertical={false} stroke="rgba(0,112,105,0.1)" />
                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#115e59' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                    <Tooltip
                      content={({ active, payload }) =>
                        active && payload?.length ? (
                          <div className="bg-white p-2 border border-teal-200 rounded shadow-sm text-sm text-[#007069]">
                            {payload[0].payload.name}: {(payload[0].value as number).toLocaleString()}h
                          </div>
                        ) : null
                      }
                    />
                    <Bar dataKey="hours" fill={BRAND} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </Section>

        {/* ──────────────── 表单 ──────────────── */}
        <Section title="表单与筛选">
          <Card className="border-0 shadow-md">
            <CardContent className="p-6">
              <div className="flex flex-wrap items-center gap-3 mb-6">
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="搜索功能或人员..."
                    className="pl-9 w-56 focus:ring-2 focus:ring-[#007069] focus:border-transparent text-sm"
                  />
                </div>
                <select className="text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#007069] text-gray-700">
                  <option>全部部门</option>
                  <option>工艺部</option>
                  <option>设备部</option>
                </select>
                <select className="text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#007069] text-gray-700">
                  <option>2026年</option>
                  <option>2025年</option>
                </select>
                <button className="px-4 py-2 bg-[#007069] text-white text-sm rounded-lg hover:bg-[#005c56] transition-colors">
                  查询
                </button>
                <Button variant="outline" size="sm">重置</Button>
              </div>

              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr>
                      {['项目名称', '负责部门', '项目经理', '类型', '状态', '合同额（万）'].map((h) => (
                        <th key={h} className="px-4 py-2.5 text-left text-sm font-medium" style={{ background: 'rgba(0,112,105,0.1)', color: '#007069' }}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      ['XX 炼化 EPC 总承包', '工艺部', '张伟', 'EPC', '执行中', '28,500.00'],
                      ['YY 化工 FEED 设计', '设备部', '李娜', '设计咨询', '完成', '4,200.00'],
                      ['ZZ 管道改造 PMC', '管道部', '王磊', 'PMC', '执行中', '9,800.00'],
                      ['AA 仪表系统升级', '仪表部', '赵静', '设计咨询', '招标', '2,600.00'],
                    ].map((row, i) => (
                      <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-[#007069]/[0.03]'}>
                        {row.map((cell, j) => (
                          <td key={j} className="px-4 py-2.5 text-gray-700 border-t border-gray-100">
                            {j === 4 ? (
                              <span className={`px-2 py-0.5 text-xs rounded-full ${
                                cell === '执行中' ? 'bg-[#007069]/10 text-[#007069]' :
                                cell === '完成' ? 'bg-green-100 text-green-800' :
                                'bg-gray-100 text-gray-600'
                              }`}>{cell}</span>
                            ) : cell}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="px-4 py-3 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
                  <span className="text-xs text-gray-500">共 4 条记录</span>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3].map((p) => (
                      <button key={p} className={`w-7 h-7 text-xs rounded ${p === 1 ? 'bg-[#007069] text-white' : 'text-gray-600 hover:bg-gray-100'}`}>{p}</button>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </Section>

        {/* ──────────────── Tabs ──────────────── */}
        <Section title="标签页">
          <Card className="border-0 shadow-md">
            <CardContent className="p-6">
              <Tabs defaultValue="tab1">
                <TabsList className="mb-4">
                  <TabsTrigger value="tab1">所有待办 (4)</TabsTrigger>
                  <TabsTrigger value="tab2">中台待办 (2)</TabsTrigger>
                  <TabsTrigger value="tab3">我的任务</TabsTrigger>
                </TabsList>
                <TabsContent value="tab1">
                  <ul className="space-y-3">
                    {[
                      { title: '月度工时核对', desc: '请在本月 25 日前完成工时数据审核', user: '张伟', date: '2026-04-30' },
                      { title: '项目成本分析报告', desc: '提交 Q1 成本分析汇总', user: '李娜', date: '2026-05-03' },
                    ].map((item, i) => (
                      <li key={i} className="border-b border-gray-100 pb-3 last:border-0 last:pb-0">
                        <h4 className="font-semibold text-sm text-gray-800">{item.title}</h4>
                        <p className="text-xs text-gray-600 mt-0.5">{item.desc}</p>
                        <p className="text-xs text-gray-400 mt-1">{item.user} · {item.date}</p>
                      </li>
                    ))}
                  </ul>
                </TabsContent>
                <TabsContent value="tab2">
                  <p className="text-sm text-gray-500">暂无中台待办事项</p>
                </TabsContent>
                <TabsContent value="tab3">
                  <p className="text-sm text-gray-500">暂无个人任务</p>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </Section>

        {/* ──────────────── 门户模块卡片 ──────────────── */}
        <Section title="门户模块卡片">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { title: 'Wood 工程平台首页', desc: '快速入口、文件模板、公告与待办', icon: LayoutDashboard, primary: true },
              { title: '项目中台', desc: '项目数据与运营看板', icon: BarChart3 },
              { title: 'SME 专家资源', desc: '专家资源与知识库', icon: Users },
              { title: '工程软件技能', desc: '工程软件与技能资源', icon: Wrench },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <Card
                  key={item.title}
                  className={`h-full transition-all hover:shadow-md cursor-pointer ${
                    item.primary
                      ? 'border-[#007069]/50 bg-[#007069]/5 hover:border-[#007069]/70'
                      : 'border-0 shadow-md hover:border-[#007069]/30 border border-transparent'
                  }`}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <div className={`p-2 rounded-lg ${item.primary ? 'bg-[#007069] text-white' : 'bg-gray-100 text-gray-600'}`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <ChevronRight className="h-4 w-4 text-gray-400" />
                    </div>
                    <CardTitle className="text-base mt-2">{item.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-xs text-gray-500">{item.desc}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </Section>

        {/* ──────────────── 公告横幅 ──────────────── */}
        <Section title="公告横幅 / 重要提示">
          <div className="space-y-3">
            <div className="flex items-start gap-3 p-4 bg-[#007069]/10 border border-[#007069]/20 rounded-lg">
              <Info className="h-4 w-4 text-[#007069] shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-[#007069]">项目执行跟踪详细数据</p>
                <p className="text-xs text-[#007069]/80 mt-0.5">每月月初更新，点击在线查看最新进展</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <AlertCircle className="h-4 w-4 text-yellow-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-yellow-800">工时上报截止提醒</p>
                <p className="text-xs text-yellow-700 mt-0.5">本月工时上报截止日期为 4月30日，请尽快完成提交</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
              <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0 mt-0.5" />
              <p className="text-sm text-green-800">Q1 成本数据已完成汇总，可在项目中台查看最新报表</p>
            </div>
          </div>
        </Section>

        {/* ──────────────── 返回 ──────────────── */}
        <div className="pb-8 flex items-center gap-4">
          <Link href="/">
            <button className="flex items-center gap-2 text-sm text-gray-500 hover:text-[#007069] transition-colors">
              <Home className="h-4 w-4" />
              返回站点首页
            </button>
          </Link>
          <Link href="/docs/DESIGN.md" target="_blank">
            <button className="flex items-center gap-2 text-sm text-gray-500 hover:text-[#007069] transition-colors">
              <FileText className="h-4 w-4" />
              查看设计规范文档
            </button>
          </Link>
        </div>

      </div>
    </div>
  );
}
