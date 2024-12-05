"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowDownIcon, ArrowUpIcon } from "lucide-react"
import { Line, LineChart, ResponsiveContainer, XAxis, Tooltip, YAxis } from "recharts"
import { ChartContainer } from "@/components/ui/chart"
import { LayoutDashboard, BarChart2, Settings } from "lucide-react"
import { Table } from 'antd';

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

export default function Component() {
  return (
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
            <LayoutDashboard className="w-6 h-6" />
          </button>
          <button className="w-6 h-6 text-gray-400 hover:bg-gray-700 rounded-lg flex items-center justify-center">
            <BarChart2 className="w-6 h-6" />
          </button>
          <button className="w-6 h-6 text-gray-400 hover:bg-gray-700 rounded-lg flex items-center justify-center">
            <Settings className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* 调整主内容区域的左边距 */}
      <div className="ml-16 p-4 space-y-4 bg-[#007069]/10 w-full min-h-screen">
        {/* Top Row - Annual Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-0 shadow-md">
            <CardContent className="p-4">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-medium text-sm text-[#007069] mb-2">年度新签合同额（万元）</h3>
                  <div className="text-2xl font-bold text-[#007069]">75,120.41</div>
                  <div className="flex items-center mt-2 text-sm">
                    <span className="text-gray-500 mr-4">11月新增</span>
                    <span>5,364.80</span>
                  </div>
                </div>
                <div className="relative w-16 h-16 mt-6">
                  <div className="w-16 h-16 rounded-full border-4 border-[#007069]/20" />
                  <div 
                    className="absolute top-0 left-0 w-16 h-16 rounded-full border-4 border-[#007069]"
                    style={{ 
                      clipPath: 'polygon(50% 0%, 100% 0%, 100% 100%, 50% 100%)',
                      transform: 'rotate(165deg)'
                    }} 
                  />
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-sm font-bold text-[#007069]">
                    45.9%
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md">
            <CardContent className="p-4">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-medium text-sm text-[#007069] mb-2">年度完成合同额（万元）</h3>
                  <div className="text-2xl font-bold text-[#007069]">38,322.29</div>
                  <div className="flex items-center mt-2 text-sm">
                    <span className="text-gray-500 mr-4">上月新增</span>
                    <span>5,364.80</span>
                  </div>
                </div>
                <div className="relative w-16 h-16 mt-6">
                  <div className="w-16 h-16 rounded-full border-4 border-[#007069]/20" />
                  <div 
                    className="absolute top-0 left-0 w-16 h-16 rounded-full border-4 border-[#007069]"
                    style={{ 
                      clipPath: 'polygon(50% 0%, 100% 0%, 100% 100%, 50% 100%)',
                      transform: 'rotate(133deg)'
                    }} 
                  />
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-sm font-bold text-[#007069]">
                    37.1%
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md">
            <CardContent className="p-4">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-medium text-sm text-[#007069] mb-2">年度完成开票额（万元）</h3>
                  <div className="text-2xl font-bold text-[#007069]">40,709.20</div>
                  <div className="flex items-center mt-2 text-sm">
                    <span className="text-gray-500 mr-4">上月新增</span>
                    <span>5,364.80</span>
                  </div>
                </div>
                <div className="relative w-16 h-16 mt-6">
                  <div className="w-16 h-16 rounded-full border-4 border-[#007069]/20" />
                  <div 
                    className="absolute top-0 left-0 w-16 h-16 rounded-full border-4 border-[#007069]"
                    style={{ 
                      clipPath: 'polygon(50% 0%, 100% 0%, 100% 100%, 50% 100%)',
                      transform: 'rotate(151deg)'
                    }} 
                  />
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-sm font-bold text-[#007069]">
                    42.0%
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md">
            <CardContent className="p-4">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-medium text-sm text-[#007069] mb-2">年度完成回款额（万元）</h3>
                  <div className="text-2xl font-bold text-[#007069]">42,165.17</div>
                  <div className="flex items-center mt-2 text-sm">
                    <span className="text-gray-500 mr-4">上月新增</span>
                    <span>5,364.80</span>
                  </div>
                </div>
                <div className="relative w-16 h-16 mt-6">
                  <div className="w-16 h-16 rounded-full border-4 border-[#007069]/20" />
                  <div 
                    className="absolute top-0 left-0 w-16 h-16 rounded-full border-4 border-[#007069]"
                    style={{ 
                      clipPath: 'polygon(50% 0%, 100% 0%, 100% 100%, 50% 100%)',
                      transform: 'rotate(160deg)'
                    }} 
                  />
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-sm font-bold text-[#007069]">
                    44.5%
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Middle Section - Costs, WIP, and Workload Analysis */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="border-0 shadow-md">
            <CardContent className="p-4">
              <h3 className="font-medium text-sm text-[#007069] mb-2">应收款项（万元）</h3>
              <div className="space-y-2">
                <div className="bg-[#007069]/10 p-3 rounded-lg">
                  <div>
                    <div className="flex items-center justify-between">
                      <p className="text-xl font-bold text-[#007069]">22,947.25</p>
                      <div className="flex items-center text-red-500 text-sm whitespace-nowrap">
                        <ArrowUpIcon className="w-4 h-4 mr-1" />
                        <span>1,344</span>
                      </div>
                    </div>
                    <p className="text-sm text-[#007069] mt-1">当前WIP</p>
                  </div>
                </div>
                
                <div className="bg-[#007069]/10 p-3 rounded-lg">
                  <div>
                    <div className="flex items-center justify-between">
                      <p className="text-xl font-bold text-[#007069]">12,434.70</p>
                      <div className="flex items-center text-red-500 text-sm whitespace-nowrap">
                        <ArrowUpIcon className="w-4 h-4 mr-1" />
                        <span>2,043</span>
                      </div>
                    </div>
                    <p className="text-sm text-[#007069] mt-1">应收账款</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-0 shadow-md">
            <CardContent className="p-4">
              <h3 className="font-medium text-sm text-[#007069] mb-2">成本分析（万元）</h3>
              <div className="space-y-2">
                {/* 合计成本 */}
                <div className="bg-[#007069]/10 p-3 rounded-lg">
                  <p className="text-xl font-bold text-[#007069]">33,199.69</p>
                  <p className="text-sm text-[#007069] mt-1">合计成本</p> 
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
                    <p className="text-lg font-bold text-[#007069]">6,032.32</p>
                    <p className="text-sm text-[#007069] mt-1">部门成本</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md">
            <CardContent className="p-4">
              <h3 className="font-medium text-sm text-[#007069] mb-2">负荷分析</h3>
              <div className="grid grid-cols-2 gap-4 mt-8">
                <div className="space-y-2">
                  <div className="bg-[#007069]/10 p-3 rounded-lg">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-[#007069]">全年</span>
                      <span className="text-lg font-bold text-[#007069]">87%</span>
                    </div>
                  </div>
                  <div className="bg-[#007069]/10 p-3 rounded-lg">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-[#007069]">当月</span>
                      <span className="text-lg font-bold text-[#007069]">96%</span>
                    </div>
                  </div>
                </div>

                <div>
                  <p className="text-sm text-[#007069] mb-2">负荷率预测</p>
                  <div className="w-full h-28">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart 
                        data={workloadPredictionData} 
                        margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
                      >
                        <XAxis 
                          dataKey="month" 
                          tick={{ fontSize: 12, fill: '#115e59' }} 
                          axisLine={false} 
                          tickLine={false} 
                        />
                        <Tooltip
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
                        <YAxis 
                          domain={[yAxisMin, yAxisMax]} 
                          hide={true}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Bottom Row - Department Collaboration, Software Design Satisfaction, and Design Hours */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Card className="border-0 shadow-md lg:col-span-2">
            <CardContent className="p-4">
              <h3 className="font-medium text-sm text-[#007069] mb-2">Workshare 金额</h3>
              <Table 
                columns={columns} 
                dataSource={data} 
                scroll={{ x: 1100, y: 200 }}
                size="small"
                pagination={false}
                className="text-sm"
                bordered
                style={{
                  '--ant-table-border-color': 'rgba(0, 112, 105, 0.2)',
                  '--ant-table-cell-border-color': 'rgba(0, 112, 105, 0.1)',
                }}
                components={{
                  header: {
                    cell: ({ children, ...restProps }) => (
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
                <h3 className="font-medium text-sm text-[#007069] mb-4">工程软件设计项目覆盖率</h3>
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
                <h3 className="font-medium text-sm text-[#007069] mb-4">工程师工程软件参与小时数</h3>
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
  )
}