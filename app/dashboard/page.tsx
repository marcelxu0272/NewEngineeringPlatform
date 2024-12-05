"use client"

import { Card, CardContent} from "@/components/ui/card"
import { Line, LineChart, ResponsiveContainer, XAxis, Tooltip as RechartsTooltip, YAxis, CartesianGrid, PieChart, Pie, Cell } from "recharts"
import { Table } from 'antd';
import type { ColumnType } from 'antd/es/table';
import { 
  ArrowUpOutlined,
  DashboardOutlined,
  BarChartOutlined,
  SettingOutlined,
  CalendarOutlined,
  RightOutlined,
} from '@ant-design/icons'
import { Select, Switch } from 'antd';
import { useState } from 'react';
import Link from "next/link"
import { Tooltip as AntTooltip } from 'antd';
import { ConfigProvider } from 'antd'

const workloadPredictionData = [  
  { month: "8月", rate: 92 },
  { month: "9月", rate: 88 },
  { month: "10月", rate: 85 },
]

// 计算最小值和最大值，并设置合适的范围
const minRate = Math.min(...workloadPredictionData.map(d => d.rate))
const maxRate = Math.max(...workloadPredictionData.map(d => d.rate))
const yAxisMin = Math.floor(minRate / 5) * 5 // 向下取整到最近的5的倍数
const yAxisMax = Math.ceil(maxRate / 5) * 5   // 向上取整到最近的5的倍数

// 添加表格数据和列定义
const columns = [
  {
    title: () => (
      <div className="relative h-8 w-full">
        {/* 白色背景 */}
        <div className="absolute inset-0"></div>
        {/* 对角线 */}
        <div className="absolute inset-0" style={{
          background: 'linear-gradient(to bottom left, transparent calc(50% - 1px), #007069, transparent calc(50% + 1px))'
        }}></div>
        {/* 右上角文字 */}
        <div className="absolute right-1 top-1 text-xs">SO</div>
        {/* 左下角文字 */}
        <div className="absolute left-1 bottom-1 text-xs">LO</div>
      </div>
    ),
    dataIndex: 'department',
    width: 100,
    fixed: 'left',
  },
  // 动态生成协作部门列
  ...Array(10).fill(null).map((_, index) => ({
    title: `协作部门${index + 1}`,
    dataIndex: `col${index}`,
    width: 100,
  })),
];

const data = Array(15).fill(null).map((_, index) => ({
  key: index,
  department: `部门${index + 1}`,
  // 为每一行生成随机协作数据
  ...Array(10).fill(null).reduce((acc, _, colIndex) => {
    acc[`col${colIndex}`] = Math.floor(Math.random() * 100);
    return acc;
  }, {}),
}));

// 添加部门数据
const departments = [
  { value: 'all', label: '全部' },
  { value: 'dept1', label: '工艺部' },
  { value: 'dept2', label: '设备部' },
  { value: 'dept3', label: '管道部' },
  { value: 'dept4', label: '电气部' },
  { value: 'dept5', label: '仪表部' },
];

// 修改环形图配置函数
const getDonutConfig = (value: number, size: 'large' | 'small') => {
  const data = [
    { name: 'Filled', value },
    { name: 'Unfilled', value: 100 - value }
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
};

// 添加完整的卡片数据
const cardData = [
  {
    title: "年度新签合同额（万元）",
    value: "75,120.41",
    monthLabel: "11月新增",
    monthValue: "5,364.80",
    percentage: "12.5%",
    donutValue: 45.9,
    subTargets: [
      { type: "设计及咨询", current: 25430.5, target: 40000 },
      { type: "EPC", current: 42785.3, target: 80000 },
      { type: "PMC", current: 6904.61, target: 15000 }
    ]
  },
  {
    title: "年度完成合同额（万元）",
    value: "38,322.29",
    monthLabel: "上月新增",
    monthValue: "5,364.80",
    percentage: "8.3%",
    donutValue: 37.1,
    subTargets: [
      { type: "设计及咨询", current: 12845.2, target: 35000 },
      { type: "EPC", current: 21634.8, target: 65000 },
      { type: "PMC", current: 3842.29, target: 12000 }
    ]
  },
  {
    title: "年度完成开票额（万元）",
    value: "40,709.20",
    monthLabel: "上月新增",
    monthValue: "5,364.80",
    percentage: "8.3%",
    donutValue: 42.0,
    subTargets: [
      { type: "设计及咨询", current: 15268.4, target: 38000 },
      { type: "EPC", current: 22389.5, target: 70000 },
      { type: "PMC", current: 3051.3, target: 13000 }
    ]
  },
  {
    title: "年度完成回款额（万元）",
    value: "42,165.17",
    monthLabel: "上月新增",
    monthValue: "5,364.80",
    percentage: "8.3%",
    donutValue: 44.5,
    subTargets: [
      { type: "设计及咨询", current: 16845.2, target: 36000 },
      { type: "EPC", current: 21583.67, target: 68000 },
      { type: "PMC", current: 3736.3, target: 14000 }
    ]
  }
];

export default function Component() {
  const [selectedDept, setSelectedDept] = useState('all');
  const [showSubTargets, setShowSubTargets] = useState(true);

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


        
        {/* 添加最左侧固定菜单 */}
        <div className="fixed left-0 top-0 h-screen w-16 bg-gray-800 p-2 flex flex-col items-center z-10">
          {/* 司logo */}
          <div className="mb-8 mt-4 w-12 h-12 bg-white rounded-full flex items-center justify-center">
            <span className="text-gray-800 text-2xl font-bold">W</span>
          </div>
          
          {/* 菜单按钮 */}
          <div className="flex-1 flex flex-col mt-8 space-y-8">
            <button className="w-6 h-6 text-white hover:bg-gray-700 rounded-lg flex items-center justify-center">
              <DashboardOutlined className="w-6 h-6" />
            </button>
            <button className="w-6 h-6 text-gray-400 hover:bg-gray-700 rounded-lg flex items-center justify-center">
              <BarChartOutlined className="w-6 h-6" />
            </button>
            <button className="w-6 h-6 text-gray-400 hover:bg-gray-700 rounded-lg flex items-center justify-center">
              <SettingOutlined className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* 调整主内容区域的背景色 */}
        <div className="ml-16 pb-4 space-y-4 bg-[#f8faff] w-[calc(100%-4rem)] min-h-screen overflow-x-hidden">
          {/* 固定顶部白条 */}
          <div className="fixed top-0 left-16 right-0 h-20 bg-white shadow-sm z-20">
            <h2 className="pt-6 pl-6 text-2xl">运营看板</h2>
          </div>

          {/* 添加顶部内边距以防止内容被遮挡 */}
          <div className="pt-20">
            {/* 部门选择器 */}
            <div className="px-4 pt-0 pb-2 flex items-center gap-4">
              <Select
                value={selectedDept}
                onChange={setSelectedDept}
                options={departments}
                style={{ width: 150 }}
                className="text-[#007069]"
              />
              {/* 添加年份选择器 */}
              <Select
                defaultValue="2023年"
                style={{ width: 90 }}
                options={[
                  { value: '2023', label: '2023年' },
                  { value: '2022', label: '2022年' },
                  { value: '2021', label: '2021年' },
                ]}
                className="text-[#007069]"
              />
              <div className="flex items-center gap-2">
                <span className="text-sm text-[#007069]">显示子目标</span>
                <Switch
                  checked={showSubTargets}
                  onChange={setShowSubTargets}
                />
              </div>
            </div>

            <div className="px-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {cardData.map((card, index) => (
                  <Card key={index} className="border-0 shadow-md">
                    <CardContent className="p-4">
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-medium text-sm text-gray-700">{card.title}</h3>
                            <AntTooltip title="查看详情">
                              <Link 
                                href={`/dashboard/detail`}
                                className="w-5 h-5 rounded-full bg-[#007069]/10 flex items-center justify-center hover:bg-[#007069]/20 transition-colors"
                              >
                                <RightOutlined className="text-xs text-[#007069]" />
                              </Link>
                            </AntTooltip>
                          </div>
                          <div className="text-3xl font-bold text-[#007069]">{card.value}</div>
                          <div className="flex items-center mt-2 text-sm">
                            <span className="text-gray-500 mr-2">{card.monthLabel}</span>
                            <span className="text-gray-500 mr-2">{card.monthValue}</span>
                            <span className="px-2 py-0.5 text-xs rounded-full bg-green-100 text-green-800">
                              {card.percentage}
                            </span>
                          </div>
                        </div>
                        <div className="relative w-24 h-24">
                          <div className="absolute inset-0 flex items-center justify-center">
                            {getDonutConfig(card.donutValue, 'large')}
                          </div>
                          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-sm font-bold text-[#007069]">
                            {card.donutValue}%
                          </div>
                        </div>
                      </div>

                      {/* 子目标区域 */}
                      {showSubTargets && (
                        <div className="mt-4 pt-4 border-t border-[#007069]/20">
                          {card.subTargets.map((target, idx) => {
                            const percentage = Math.min(100, (target.current / target.target) * 100).toFixed(1);
                            return (
                              <div key={idx} className="mb-2 last:mb-0">
                                <div className="flex text-sm text-[#007069] mb-1">
                                  <span>{target.type}</span>
                                  <span className="ml-4 text-gray-500">
                                    {target.current.toLocaleString()} / {target.target.toLocaleString()}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <div className="flex-1 h-3 bg-[#007069]/20 rounded-full overflow-hidden cursor-pointer">
                                    <div 
                                      className="h-full bg-[#007069] rounded-full transition-all duration-500"
                                      style={{ width: `${percentage}%` }}
                                    />
                                  </div>
                                  <span className="text-sm text-[#007069]">{percentage}%</span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>

          {/* 调整中间部分的间距 */}
          <div className="px-4 grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Card className="border-0 shadow-md h-full">
              <CardContent className="p-4">
                <h3 className="font-medium text-sm text-gray-700 mb-2">应收款项（万元）</h3>
                <div className="space-y-2">
                  <div className="bg-[#007069]/10 p-3 rounded-lg">
                    <div>
                      <div className="flex items-center justify-between">
                        <p className="text-xl font-bold text-[#007069]">22,947.25</p>
                        <div className="flex items-center text-red-500 text-sm whitespace-nowrap">
                          <ArrowUpOutlined className="w-4 h-4 mr-1" />
                          <span>1,344</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <p className="text-sm text-[#007069]">当前WIP</p>
                        <AntTooltip title="查看详情">
                          <Link 
                            href={`/dashboard/wip-detail`}
                            className="w-5 h-5 rounded-full bg-[#007069]/10 flex items-center justify-center hover:bg-[#007069]/20 transition-colors"
                          >
                            <RightOutlined className="text-xs text-[#007069]" />
                          </Link>
                        </AntTooltip>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-[#007069]/10 p-3 rounded-lg">
                    <div>
                      <div className="flex items-center justify-between">
                        <p className="text-xl font-bold text-[#007069]">12,434.70</p>
                        <div className="flex items-center text-red-500 text-sm whitespace-nowrap">
                          <ArrowUpOutlined className="w-4 h-4 mr-1" />
                          <span>2,043</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <p className="text-sm text-[#007069]">应收账款</p>
                        <AntTooltip title="查看详情">
                          <Link 
                            href={`/dashboard/receivables-detail`}
                            className="w-5 h-5 rounded-full bg-[#007069]/10 flex items-center justify-center hover:bg-[#007069]/20 transition-colors"
                          >
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
                <h3 className="font-medium text-sm text-gray-700 mb-2">成本分析（万元）</h3>
                <div className="space-y-2">
                  {/* 合计成本 */}
                  <div className="bg-[#007069]/10 p-3 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xl font-bold text-[#007069]">33,199.69</p>
                        <div className="flex items-center gap-2 mt-1">
                          <p className="text-sm text-[#007069]">合计成本</p>
                          <AntTooltip title="查看详情">
                            <Link 
                              href={`/dashboard/cost-detail`}
                              className="w-5 h-5 rounded-full bg-[#007069]/10 flex items-center justify-center hover:bg-[#007069]/20 transition-colors"
                            >
                              <RightOutlined className="text-xs text-[#007069]" />
                            </Link>
                          </AntTooltip>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* 三个子项成本 */}
                  <div className="grid grid-cols-3 gap-2">
                    <div className="bg-[#007069]/5 p-2 rounded-lg">
                      <p className="text-lg font-bold text-[#007069]">936.52</p>
                      <p className="text-sm text-[#007069] mt-1">报价成本</p>
                    </div>
                    <div className="bg-[#007069]/5 p-2 rounded-lg">
                      <p className="text-lg font-bold text-[#007069]">27,167.37</p>
                      <p className="text-sm text-[#007069] mt-1">项目成本</p>
                    </div>
                    <div className="bg-[#007069]/5 p-2 rounded-lg">
                      <div>
                        <p className="text-lg font-bold text-[#007069]">6,032.32</p>
                        <div className="flex items-center gap-2 mt-1">
                          <p className="text-sm text-[#007069]">部门成本</p>
                          <AntTooltip title="查看详情">
                            <Link 
                              href={`/dashboard/department-cost-detail`}
                              className="w-5 h-5 rounded-full bg-[#007069]/10 flex items-center justify-center hover:bg-[#007069]/20 transition-colors"
                            >
                              <RightOutlined className="text-xs text-[#007069]" />
                            </Link>
                          </AntTooltip>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 负荷分析区域拆分成两个卡片 */}
            <div className="space-y-4">
              {/* 上部卡片 - 新增概览内容 */}
              <Card className="border-0 shadow-md h-[calc(25%-0.5rem)]">
                <CardContent className="p-4">
                  <div className="flex items-center">
                    <CalendarOutlined className="w-4 h-4 mr-4" />
                    <Link href="/dashboard/eletable" className="cursor-pointer">
                      <h3 className="font-medium text-sm text-[#ff4444]"><strong className="text-[#007069]">项目追踪表：</strong>每月月初更新，点击在线查！</h3>
                    </Link>
                  </div>
                </CardContent>
              </Card>

              {/* 下部卡片 - 左右布局 */}
              <Card className="border-0 shadow-md h-[calc(75%-0.5rem)]">
                <CardContent className="p-4">
                  <div className="grid grid-cols-2 gap-4">
                    {/* 左侧 */}
                    <div>
                      <h3 className="font-medium text-sm text-gray-700 mb-2">负荷率</h3>
                      <div className="space-y-2">
                        <div className="bg-[#007069]/10 p-2 rounded-lg">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-[#007069]">全年</span>
                            <span className="text-lg font-bold text-[#007069]">87%</span>
                          </div>
                        </div>
                        <div className="bg-[#007069]/10 p-2 rounded-lg">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-[#007069]">当月</span>
                            <span className="text-lg font-bold text-[#007069]">96%</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* 右侧 */}
                    <div>
                      <h4 className="font-medium text-sm text-gray-700 mb-2">未来三月的负荷率预测</h4>
                      <div className="w-full h-24 ">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart 
                            data={workloadPredictionData} 
                            margin={{ top: 10, right: 20, bottom: 0, left: -30 }}
                          >
                            <CartesianGrid 
                              horizontal={true}
                              vertical={false}
                              stroke="rgba(0, 112, 105, 0.1)"
                            />
                            <XAxis 
                              dataKey="month" 
                              tick={{ fontSize: 12, fill: '#115e59' }} 
                              axisLine={false} 
                              tickLine={false} 
                            />
                            <YAxis
                              tick={false}
                              axisLine={false}
                              tickLine={false}
                              domain={[yAxisMin, yAxisMax]}
                            />
                            <RechartsTooltip
                              content={({ active, payload }) => {
                                if (active && payload && payload.length) {
                                  return (
                                    <div className="bg-white p-2 border border-teal-200 rounded shadow-sm">
                                      <p className="text-sm text-[#007069]">{`${payload[0].payload.month}: ${payload[0].value}%`}</p>
                                    </div>
                                  );
                                }
                                return null;
                              }}
                            />
                            <Line 
                              type="monotone" 
                              dataKey="rate" 
                              stroke="#007069" 
                              strokeWidth={2} 
                              dot={{ r: 2, fill: '#007069' }}
                              label={({value, x, y}) => (
                                <text 
                                  x={x} 
                                  y={y-10} 
                                  fill="#115e59" 
                                  fontSize={12} 
                                  textAnchor="middle"
                                >
                                  {`${value}%`}
                                </text>
                              )}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* 调整底部部的间距 */}
          <div className="px-4 grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Card className="border-0 shadow-md lg:col-span-2">
              <CardContent className="p-4">
                <h3 className="font-medium text-sm text-gray-700 mb-2">Workshare 金额</h3>
                <Table 
                  columns={columns as ColumnType<any>[]} 
                  dataSource={data} 
                  scroll={{ x: 1100, y: 200 }}
                  size="small"
                  pagination={false}
                  className="text-sm"
                  bordered
                  style={{
                    ['--ant-table-border-color' as string]: 'rgba(0, 112, 105, 0.2)',
                    ['--ant-table-cell-border-color' as string]: 'rgba(0, 112, 105, 0.1)',
                  }}
                  components={{
                    header: {
                      cell: ({ children, ...restProps }: { children: React.ReactNode; restProps: any }) => (
                        <th
                          {...restProps}
                          style={{
                            background: 'rgba(0, 112, 105, 0.1)',
                            color: '#007069',
                            fontWeight: 'normal',
                          }}
                        >
                          {children}
                        </th>
                      ),
                    },
                  }}
                  rowClassName={(record, index) => 
                    index % 2 === 0 ? 'bg-white' : 'bg-[#007069]/[0.03]'
                  }
                />
              </CardContent>
            </Card>

            <div className="space-y-4">
              <Card className="border-0 shadow-md h-[calc(50%-0.5rem)]">
                <CardContent className="p-4">
                  <h3 className="font-medium text-sm text-gray-700 mb-4">工程软件设计项目覆盖率</h3>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="bg-[#007069]/10 p-3 rounded-lg">
                      <div className="text-lg font-bold text-[#007069]">39.69%</div>
                      <p className="text-xs text-[#007069] mt-1">S3D/E3D</p>
                    </div>
                    <div className="bg-[#007069]/10 p-3 rounded-lg">
                      <div className="text-lg font-bold text-[#007069]">14.59%</div>
                      <p className="text-xs text-[#007069] mt-1">SPPID</p>
                    </div>
                    <div className="bg-[#007069]/10 p-3 rounded-lg">
                      <div className="text-lg font-bold text-[#007069]">20.46%</div>
                      <p className="text-xs text-[#007069] mt-1">SPIAI</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-md h-[calc(50%-0.5rem)]">
                <CardContent className="p-4">
                  <h3 className="font-medium text-sm text-gray-700 mb-4">工程师工程软件参与小时数</h3>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="bg-[#007069]/10 p-3 rounded-lg">
                      <div className="text-lg font-bold text-[#007069]">16,432</div>
                      <p className="text-xs text-[#007069] mt-1">S3D/E3D</p>
                    </div>
                    <div className="bg-[#007069]/10 p-3 rounded-lg">
                      <div className="text-lg font-bold text-[#007069]">1,427</div>
                      <p className="text-xs text-[#007069] mt-1">SPPID</p>
                    </div>
                    <div className="bg-[#007069]/10 p-3 rounded-lg">
                      <div className="text-lg font-bold text-[#007069]">288</div>
                      <p className="text-xs text-[#007069] mt-1">SPIAI</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </ConfigProvider>
  )
}