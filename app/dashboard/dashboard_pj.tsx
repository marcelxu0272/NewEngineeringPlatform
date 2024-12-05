"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowDownIcon, ArrowUpIcon } from "lucide-react"
import { Line, LineChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts"
import { ChartContainer } from "@/components/ui/chart"

const workloadPredictionData = [
  { month: "8月", rate: 92 },
  { month: "9月", rate: 88 },
  { month: "10月", rate: 85 },
]

export default function Component() {
  return (
    <div className="p-4 space-y-4 bg-teal-50">
      {/* Top Row - Annual Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-medium text-sm text-teal-900 mb-2">年度新签合同额</h3>
                <div className="text-2xl font-bold text-teal-900">75,120.41<span className="text-sm ml-1">万元</span></div>
                <div className="flex items-center mt-2 text-red-500 text-sm">
                  <ArrowDownIcon className="w-4 h-4 mr-1" />
                  19.85%
                  <span className="text-gray-500 ml-2">同比</span>
                </div>
              </div>
              <div className="relative w-16 h-16">
                <div className="w-16 h-16 rounded-full border-4 border-teal-200" />
                <div 
                  className="absolute top-0 left-0 w-16 h-16 rounded-full border-4 border-teal-600"
                  style={{ 
                    clipPath: 'polygon(50% 0%, 100% 0%, 100% 100%, 50% 100%)',
                    transform: 'rotate(165deg)'
                  }} 
                />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-sm font-bold text-teal-900">
                  45.9%
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-medium text-sm text-teal-900 mb-2">年度完成合同额</h3>
                <div className="text-2xl font-bold text-teal-900">38,322.29<span className="text-sm ml-1">万元</span></div>
                <div className="flex items-center mt-2 text-green-500 text-sm">
                  <ArrowUpIcon className="w-4 h-4 mr-1" />
                  12.34%
                  <span className="text-gray-500 ml-2">同比</span>
                </div>
              </div>
              <div className="relative w-16 h-16">
                <div className="w-16 h-16 rounded-full border-4 border-teal-200" />
                <div 
                  className="absolute top-0 left-0 w-16 h-16 rounded-full border-4 border-teal-600"
                  style={{ 
                    clipPath: 'polygon(50% 0%, 100% 0%, 100% 100%, 50% 100%)',
                    transform: 'rotate(133deg)'
                  }} 
                />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-sm font-bold text-teal-900">
                  37.1%
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-medium text-sm text-teal-900 mb-2">年度完成开票额</h3>
                <div className="text-2xl font-bold text-teal-900">40,709.20<span className="text-sm ml-1">万元</span></div>
                <div className="flex items-center mt-2 text-green-500 text-sm">
                  <ArrowUpIcon className="w-4 h-4 mr-1" />
                  8.45%
                  <span className="text-gray-500 ml-2">同比</span>
                </div>
              </div>
              <div className="relative w-16 h-16">
                <div className="w-16 h-16 rounded-full border-4 border-teal-200" />
                <div 
                  className="absolute top-0 left-0 w-16 h-16 rounded-full border-4 border-teal-600"
                  style={{ 
                    clipPath: 'polygon(50% 0%, 100% 0%, 100% 100%, 50% 100%)',
                    transform: 'rotate(151deg)'
                  }} 
                />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-sm font-bold text-teal-900">
                  42.0%
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-medium text-sm text-teal-900 mb-2">年度完成回款额</h3>
                <div className="text-2xl font-bold text-teal-900">42,165.17<span className="text-sm ml-1">万元</span></div>
                <div className="flex items-center mt-2 text-green-500 text-sm">
                  <ArrowUpIcon className="w-4 h-4 mr-1" />
                  15.23%
                  <span className="text-gray-500 ml-2">同比</span>
                </div>
              </div>
              <div className="relative w-16 h-16">
                <div className="w-16 h-16 rounded-full border-4 border-teal-200" />
                <div 
                  className="absolute top-0 left-0 w-16 h-16 rounded-full border-4 border-teal-600"
                  style={{ 
                    clipPath: 'polygon(50% 0%, 100% 0%, 100% 100%, 50% 100%)',
                    transform: 'rotate(160deg)'
                  }} 
                />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-sm font-bold text-teal-900">
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
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium text-teal-900">成本分析</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-3 p-4">
            <div className="bg-teal-50 p-3 rounded-lg">
              <p className="text-sm text-teal-900 mb-1">合计成本</p>
              <p className="text-xl font-bold text-teal-900">33,199.69<span className="text-sm ml-1">万元</span></p>
            </div>
            <div className="bg-teal-50 p-3 rounded-lg">
              <p className="text-sm text-teal-900 mb-1">项目成本</p>
              <p className="text-xl font-bold text-teal-900">27,167.37<span className="text-sm ml-1">万元</span></p>
            </div>
            <div className="bg-teal-50 p-3 rounded-lg">
              <p className="text-sm text-teal-900 mb-1">报价成本</p>
              <p className="text-xl font-bold text-teal-900">936.52<span className="text-sm ml-1">万元</span></p>
            </div>
            <div className="bg-teal-50 p-3 rounded-lg">
              <p className="text-sm text-teal-900 mb-1">部门成本</p>
              <p className="text-xl font-bold text-teal-900">6032.32<span className="text-sm ml-1">万元</span></p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium text-teal-900">WIP分析</CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-baseline mb-1">
                  <p className="text-sm text-teal-900">当前WIP</p>
                  <div className="flex items-center text-red-500 text-sm">
                    <ArrowUpIcon className="w-4 h-4" />
                    1,344.73
                  </div>
                </div>
                <p className="text-xl font-bold text-teal-900">22,947.25<span className="text-sm ml-1">万元</span></p>
              </div>
              <div className="pt-4 border-t border-teal-100">
                <div className="flex justify-between items-baseline mb-1">
                  <p className="text-sm text-teal-900">应收账款</p>
                  <div className="flex items-center text-red-500 text-sm">
                    <ArrowUpIcon className="w-4 h-4" />
                    2,043.71
                  </div>
                </div>
                <p className="text-xl font-bold text-teal-900">12,434.70<span className="text-sm ml-1">万元</span></p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium text-teal-900">负荷分析</CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <div className="flex justify-between items-start">
              <div className="space-y-4 flex-1">
                <div>
                  <p className="text-sm text-teal-900 mb-1">全年累计负荷率</p>
                  <div className="flex items-center">
                    <div className="text-lg font-bold text-teal-900 bg-teal-100 px-2 py-1 rounded">87%</div>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-teal-900 mb-1">当月负荷率</p>
                  <div className="flex items-center">
                    <div className="text-lg font-bold text-teal-900 bg-yellow-100 px-2 py-1 rounded">96%</div>
                  </div>
                </div>
              </div>
              <div className="flex-1">
                <div className="pt-4 border-t border-teal-100">
                  <p className="text-sm text-teal-900 mb-2">未来三个月负荷率预测</p>
                  <div className="w-full h-32">
                    <ChartContainer
                      config={{
                        rate: {
                          label: "负荷率",
                          color: "hsl(var(--chart-1))",
                        },
                      }}
                    >
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={workloadPredictionData}>
                          <XAxis dataKey="month" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                          <YAxis hide domain={[80, 100]} />
                          <Tooltip
                            content={({ active, payload }) => {
                              if (active && payload && payload.length) {
                                return (
                                  <div className="bg-white p-2 border border-gray-300 rounded shadow">
                                    <p className="text-sm">{`${payload[0].payload.month}: ${payload[0].value}%`}</p>
                                  </div>
                                );
                              }
                              return null;
                            }}
                          />
                          <Line type="monotone" dataKey="rate" stroke="hsl(var(--chart-1))" strokeWidth={2} dot={{ r: 3 }} />
                        </LineChart>
                      </ResponsiveContainer>
                    </ChartContainer>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Row - Department Collaboration, Software Design Satisfaction, and Design Hours */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="border-0 shadow-md lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium text-teal-900">部门协作</CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <div className="w-full h-80 bg-teal-50 rounded-lg flex items-center justify-center">
              <p className="text-teal-900">部门协作趋势折线图</p>
              {/* 部门协作趋势折线图 */}
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card className="border-0 shadow-md h-[calc(50%-0.5rem)]">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-medium text-teal-900">软件设计满意度</CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <div className="grid grid-cols-3 gap-4 h-full items-center">
                <div className="text-center">
                  <div className="text-xl font-bold text-teal-900">39.69%</div>
                  <p className="text-sm text-teal-600 mt-1">S3D/E3D</p>
                </div>
                <div className="text-center">
                  <div className="text-xl font-bold text-teal-900">14.59%</div>
                  <p className="text-sm text-teal-600 mt-1">SPPID</p>
                </div>
                <div className="text-center">
                  <div className="text-xl font-bold text-teal-900">20.46%</div>
                  <p className="text-sm text-teal-600 mt-1">SPIAI</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md h-[calc(50%-0.5rem)]">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-medium text-teal-900">设计工时（小时）</CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <div className="grid grid-cols-3 gap-4 h-full items-center">
                <div className="text-center">
                  <div className="text-xl font-bold text-teal-900">16,432</div>
                  <p className="text-sm text-teal-600 mt-1">S3D/E3D</p>
                </div>
                <div className="text-center">
                  <div className="text-xl font-bold text-teal-900">1,427</div>
                  <p className="text-sm text-teal-600 mt-1">SPPID</p>
                </div>
                <div className="text-center">
                  <div className="text-xl font-bold text-teal-900">288</div>
                  <p className="text-sm text-teal-600 mt-1">SPIAI</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}