"use client";

import React, { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, Line, ComposedChart, PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { Card } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LeftOutlined } from '@ant-design/icons';
import { DashboardOutlined, BarChartOutlined, SettingOutlined, ArrowUpOutlined, ArrowDownOutlined, FolderOutlined, DollarOutlined } from '@ant-design/icons';

// 添加千分符的辅助函数
const formatNumber = (num: number | undefined | null, decimals: number = 0): string => {
  if (num === undefined || num === null) {
    return '0.00';
  }
  const fixedNum = num.toFixed(decimals);
  return fixedNum.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
};

// 添加新的模拟数据
const top20ProjectsData = [
  { id: 'P001', name: '上海某炼油厂扩建项目', client: '上海建设集团', manager: '张三', responsible: '李四', management: '金山中心', businessType: '工程总承包', amount: 5000 },
  { id: 'P002', name: '北京某石化储备库项目', client: '北京开发有限公司', manager: '王五', responsible: '赵六', management: '沈阳中心', businessType: '设计咨询', amount: 4500 },
  { id: 'P003', name: '广州某化工园区建设项目', client: '广州地产公司', manager: '孙七', responsible: '周八', management: '金山中心', businessType: '工程总承包', amount: 4000 },
  { id: 'P004', name: '深圳某石油码头改造项目', client: '深圳商业集团', manager: '吴九', responsible: '郑十', management: '沈阳中心', businessType: '设计咨询', amount: 3500 },
  { id: 'P005', name: '成都某石化研发中心项目', client: '成都建设集团', manager: '陈十一', responsible: '张十二', management: '金山中心', businessType: '工程总承包', amount: 3000 },
  { id: 'P006', name: '重庆某油气管道工程项目', client: '重庆工业公司', manager: '李十三', responsible: '王十四', management: '沈阳中心', businessType: '设计咨询', amount: 2500 },
  { id: 'P007', name: '杭州某化工厂环保改造项目', client: '杭州地产公司', manager: '赵十五', responsible: '孙十六', management: '金山中心', businessType: '工程总承包', amount: 2000 },
  { id: 'P008', name: '南京某石油储备基地项目', client: '南京商业集团', manager: '周七', responsible: '吴十八', management: '沈阳中心', businessType: '设计咨询', amount: 1500 },
  { id: 'P009', name: '武汉某石化实验室建设项目', client: '武汉建设集团', manager: '陈十九', responsible: '李二十', management: '金山中心', businessType: '工程总承包', amount: 1000 },
  // ... 添加更多项目数据，总共20条
];

const DataDashboard = () => {
  const [selectedMetric, setSelectedMetric] = useState('all');
  const [selectedMenu, setSelectedMenu] = useState('dashboard');
  const [selectedCenter, setSelectedCenter] = useState('all');
  const [selectedYear, setSelectedYear] = useState('2023');
  const [selectedSubmenu, setSelectedSubmenu] = useState('operationalMetrics');
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(true);

  const metrics = [
    { id: 'newContracts', name: '年度新签合同额(万元)', hasYearlyTarget: true },
    { id: 'completedContracts', name: '年度完成合同额(万元)', hasYearlyTarget: true },
    { id: 'invoicedAmount', name: '年度完成开票额(万元)', hasYearlyTarget: true },
    { id: 'receivedPayments', name: '年度完成回款额(万元)', hasYearlyTarget: true },
    { id: 'wip', name: 'WIP(万元)', hasYearlyTarget: false },
    { id: 'accountsReceivable', name: '应收账款(万元)', hasYearlyTarget: false },
  ];

  const data = [
    { month: '1月', newContracts: 4000, completedContracts: 3500, invoicedAmount: 3200, receivedPayments: 3000, wip: 1000, accountsReceivable: 2000 },
    { month: '2月', newContracts: 2000, completedContracts: 0, invoicedAmount: 0, receivedPayments: 0, wip: 0, accountsReceivable: 0 },
    { month: '3月', newContracts: 4000, completedContracts: 0, invoicedAmount: 0, receivedPayments: 0, wip: 0, accountsReceivable: 0 },
    { month: '4月', newContracts: 1000, completedContracts: 0, invoicedAmount: 0, receivedPayments: 0, wip: 0, accountsReceivable: 0 },
    { month: '5月', newContracts: 0, completedContracts: 0, invoicedAmount: 0, receivedPayments: 0, wip: 0, accountsReceivable: 0 },
    { month: '6月', newContracts: 0, completedContracts: 0, invoicedAmount: 0, receivedPayments: 0, wip: 0, accountsReceivable: 0 },
    { month: '7月', newContracts: 0, completedContracts: 0, invoicedAmount: 0, receivedPayments: 0, wip: 0, accountsReceivable: 0 },
    { month: '8月', newContracts: 0, completedContracts: 0, invoicedAmount: 0, receivedPayments: 0, wip: 0, accountsReceivable: 0 },
    { month: '9月', newContracts: 0, completedContracts: 0, invoicedAmount: 0, receivedPayments: 0, wip: 0, accountsReceivable: 0 },
    { month: '10月', newContracts: 0, completedContracts: 0, invoicedAmount: 0, receivedPayments: 0, wip: 0, accountsReceivable: 0 },
    { month: '11月', newContracts: 0, completedContracts: 0, invoicedAmount: 0, receivedPayments: 0, wip: 0, accountsReceivable: 0 },
    { month: '12月', newContracts: 0, completedContracts: 0, invoicedAmount: 0, receivedPayments: 0, wip: 0, accountsReceivable: 0 },
  ];

  // 新增项目数据
  const projectData = {
    managementDistribution: [
      { name: '金山中心', value: 40 },
      { name: '沈阳中心', value: 30 },
      { name: '其他中心', value: 30 },
    ],
    businessTypeDistribution: [
      { name: '工程总承包', value: 45 },
      { name: '设计咨询', value: 35 },
      { name: '其他业务', value: 20 },
    ],
  };

  // 修改后的项目成本数据，包含九种成本类型
  const projectCostData = [
    { month: '1月', 差旅及报销: 10100.00, 人力成本: 80800.00, 低负荷成本: 10050.00, 一般付款: 20200.00, 涉外支付: 15150.00, 设计服务分包: 30300.00, 采购: 50500.00, 施工分包: 70700.00, 其他: 10100.00 },
    { month: '2月', 差旅及报销: 10120.00, 人力成本: 85850.00, 低负荷成本: 10055.00, 一般付款: 22220.00, 涉外支付: 16160.00, 设计服务分包: 32320.00, 采购: 55550.00, 施工分包: 75750.00, 其他: 10110.00 },
    { month: '3月', 差旅及报销: 10110.00, 人力成本: 90900.00, 低负荷成本: 10060.00, 一般付款: 21210.00, 涉外支付: 17170.00, 设计服务分包: 34340.00, 采购: 60600.00, 施工分包: 80800.00, 其他: 10120.00 },
    { month: '4月', 差旅及报销: 10130.00, 人力成本: 95950.00, 低负荷成本: 10058.00, 一般付款: 23230.00, 涉外支付: 18180.00, 设计服务分包: 36360.00, 采购: 58580.00, 施工分包: 85850.00, 其他: 10130.00 },
    { month: '5月', 差旅及报销: 10125.00, 人力成本: 92920.00, 低负荷成本: 10062.00, 一般付款: 22225.00, 涉外支付: 17175.00, 设计服务分包: 35350.00, 采购: 62620.00, 施工分包: 88880.00, 其他: 10125.00 },
    { month: '6月', 差旅及报销: 10140.00, 人力成本: 100000.00, 低负荷成本: 10065.00, 一般付款: 24240.00, 涉外支付: 19190.00, 设计服务分包: 38380.00, 采购: 65650.00, 施工分包: 92920.00, 其他: 10140.00 },
    { month: '7月', 差旅及报销: 10135.00, 人力成本: 98980.00, 低负荷成本: 10063.00, 一般付款: 23235.00, 涉外支付: 18185.00, 设计服务分包: 37370.00, 采购: 63630.00, 施工分包: 90900.00, 其他: 10135.00 },
    { month: '8月', 差旅及报销: 10145.00, 人力成本: 105050.00, 低负荷成本: 10067.00, 一般付款: 24245.00, 涉外支付: 19195.00, 设计服务分包: 39390.00, 采购: 67670.00, 施工分包: 95950.00, 其他: 10145.00 },
    { month: '9月', 差旅及报销: 10150.00, 人力成本: 110100.00, 低负荷成本: 10070.00, 一般付款: 25250.00, 涉外支付: 20200.00, 设计服务分包: 40400.00, 采购: 70700.00, 施工分包: 98980.00, 其他: 10150.00 },
    { month: '10月', 差旅及报销: 10155.00, 人力成本: 115150.00, 低负荷成本: 10073.00, 一般付款: 25255.00, 涉外支付: 20205.00, 设计服务分包: 41410.00, 采购: 73730.00, 施工分包: 100000.00, 其他: 10155.00 },
  ];

  // 修改模拟数据，只保留最新一个月的数据
  const managementCostData = {
    费用支付金额: 100000,
    转入成本: 50000,
    转出成本: 30000,
    部门工时成本: 200000,
    低负荷成本: 80000,
    部门管理成本: 150000
  };

  const getMetricInfo = (metricId: string) => {
    type MetricItem = {
      month: string;
      newContracts: number;
      completedContracts: number;
      invoicedAmount: number;
      receivedPayments: number;
      wip: number;
      accountsReceivable: number;
    };

    const totalAmount = data.reduce((sum, item) => {
      const value = item[metricId as keyof typeof item];
      return sum + (typeof value === 'number' ? value : 0);
    }, 0);
    const currentMonthAmount = data.length > 0 ? Number(data[data.length - 1][metricId as keyof typeof data[0]]) || 0 : 0;
    const previousMonthAmount = data.length > 1 ? Number(data[data.length - 2][metricId as keyof typeof data[0]]) || 0 : 0;
    const monthlyChange = currentMonthAmount - previousMonthAmount;
    
    // 对于WIP和应收账款，我们只关心当前金额和月度变化
    if (metricId === 'wip' || metricId === 'accountsReceivable') {
      return {
        totalAmount: formatNumber(currentMonthAmount),
        currentMonthAmount: formatNumber(currentMonthAmount),
        monthlyChange: formatNumber(monthlyChange),
        yearlyTarget: '不适用',
        completionRate: '不适用'
      };
    }

    const yearlyTarget = 30000; // 假设的年度目标
    const completionRate = ((totalAmount / yearlyTarget) * 100).toFixed(2);

    return {
      totalAmount: formatNumber(totalAmount),
      currentMonthAmount: formatNumber(currentMonthAmount),
      monthlyChange: formatNumber(monthlyChange),
      yearlyTarget: formatNumber(yearlyTarget),
      completionRate
    };
  };

  const metricInfo = getMetricInfo(selectedMetric);

  // 修改计算累计值的函数
  const calculateCumulativeData = (data: any[], metric: string) => {
    let cumulative = 0;
    return data.map(item => {
      // 只有当月数值不为0时才累加
      if (item[metric] !== 0) {
        cumulative += item[metric];
        return {
          ...item,
          [`${metric}Cumulative`]: cumulative
        };
      }
      // 当月数值为0时，不设置累计值
      return {
        ...item,
        [`${metric}Cumulative`]: null
      };
    });
  };

  // 在渲染图表之前计算累计值
  const chartData = selectedMetric === 'all'
    ? data
    : calculateCumulativeData(data, selectedMetric);

  // 修改 renderChangeWithTriangle 函数,为 WIP 和应收账款添加特殊处理
  const renderChangeWithTriangle = (change: string, isWipOrAR: boolean = false) => {
    const numericChange = parseFloat(change.replace(/,/g, ''));
    const textSize = isWipOrAR ? "text-l" : "text-base"; // 为 WIP 和应收账款使用更小的字号
    
    if (numericChange > 0) {
      return (
        <div className="flex items-center">
          <ArrowUpOutlined className="text-red-500 mr-0.5" />
          <span className={`${textSize} font-bold`}>{change}</span>
        </div>
      );
    } else if (numericChange < 0) {
      return (
        <div className="flex items-center">
          <ArrowDownOutlined className="text-green-500 mr-0.5" />
          <span className={`${textSize} font-bold`}>{change.replace('-', '')}</span>
        </div>
      );
    } else {
      return <span className={`${textSize} font-bold`}>{change}</span>;
    }
  };

  const renderPieChart = (data: Array<{ name: string; value: number }>, title: string) => (
    <Card className="p-4">
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            outerRadius={80}
            fill="#007069"
            dataKey="value"
            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
          >
            {data.map((_, index: number) => (
              <Cell key={`cell-${index}`} fill={`${index === 0 ? '#007069' : `${index === 1 ? '#007069cc' : '#00706999'}`}`} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
    </Card>
  );

  const renderTop20ProjectsTable = () => (
    <Card className="p-4 mt-4">
      <h2 className="text-xl font-semibold mb-4">TOP20 项目</h2>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead>
            <tr>
              <th className="px-4 py-2 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">项目编号</th>
              <th className="px-4 py-2 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">项目名称</th>
              <th className="px-4 py-2 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">甲方名称</th>
              <th className="px-4 py-2 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">项目经理</th>
              <th className="px-4 py-2 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">负责人</th>
              <th className="px-4 py-2 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">管理归属</th>
              <th className="px-4 py-2 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">业务类型</th>
              <th className="px-4 py-2 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">金额（万元）</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {top20ProjectsData.map((project) => (
              <tr key={project.id}>
                <td className="px-4 py-2 whitespace-nowrap">{project.id}</td>
                <td className="px-4 py-2 whitespace-nowrap">{project.name}</td>
                <td className="px-4 py-2 whitespace-nowrap">{project.client}</td>
                <td className="px-4 py-2 whitespace-nowrap">{project.manager}</td>
                <td className="px-4 py-2 whitespace-nowrap">{project.responsible}</td>
                <td className="px-4 py-2 whitespace-nowrap">{project.management}</td>
                <td className="px-4 py-2 whitespace-nowrap">{project.businessType}</td>
                <td className="px-4 py-2 whitespace-nowrap">{formatNumber(project.amount)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );

  const renderProjectCostChart = () => (
    <Card className="p-4 mb-4">
      <h3 className="text-lg font-semibold mb-2">项目成本月分布</h3>
      <ResponsiveContainer width="100%" height={600}>
        <BarChart data={projectCostData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="month" />
          <YAxis tickFormatter={(value) => formatNumber(value)} />
          <Tooltip formatter={(value) => formatNumber(Number(value))} />
          <Legend />
          <Bar dataKey="差旅及报销" stackId="a" fill="#007069" />
          <Bar dataKey="人力成本" stackId="a" fill="#007069cc" />
          <Bar dataKey="低负荷成本" stackId="a" fill="#00706999" />
          <Bar dataKey="一般付款" stackId="a" fill="#007069aa" />
          <Bar dataKey="涉外支付" stackId="a" fill="#007069bb" />
          <Bar dataKey="设计服务分包" stackId="a" fill="#007069cc" />
          <Bar dataKey="采购" stackId="a" fill="#007069dd" />
          <Bar dataKey="施工分包" stackId="a" fill="#007069ee" />
          <Bar dataKey="其他" stackId="a" fill="#007069ff" />
        </BarChart>
      </ResponsiveContainer>
    </Card>
  );

  const renderProjectCostTable = () => {
    // 计算汇总据
    const totalCost = projectCostData.reduce((acc, item) => {
      Object.keys(item).forEach(key => {
        if (key !== 'month') {
          acc[key as keyof typeof item] = ((acc[key as keyof typeof item] || 0) as number) + (item[key as keyof typeof item] as number);
        }
      });
      return acc;
    }, {} as Record<string, number>);

    return (
      <Card className="p-4">
        <h3 className="text-lg font-semibold mb-2">项目成本明细数据</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">月份</th>
                <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">总成本</th>
                <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">差旅及报销</th>
                <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">人力成本</th>
                <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">低负荷成本</th>
                <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">一般付款</th>
                <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">涉外支付</th>
                <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">设计服务分包</th>
                <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">采购</th>
                <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">施工分包</th>
                <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">其他</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {/* 汇总行 */}
              <tr className=" font-bold">
                <td className="px-6 py-4 whitespace-nowrap">总计</td>
                <td className="px-6 py-4 whitespace-nowrap">{formatNumber(
                  totalCost.差旅及报销 + totalCost.人力成本 + totalCost.低负荷成本 + totalCost.一般付款 + 
                  totalCost.涉外支付 + totalCost.设计服务分包 + totalCost.采购 + totalCost.施工分包 + totalCost.其他, 2
                )}</td>
                <td className="px-6 py-4 whitespace-nowrap">{formatNumber(totalCost.差旅及报销, 2)}</td>
                <td className="px-6 py-4 whitespace-nowrap">{formatNumber(totalCost.人力成本, 2)}</td>
                <td className="px-6 py-4 whitespace-nowrap">{formatNumber(totalCost.低负荷成本, 2)}</td>
                <td className="px-6 py-4 whitespace-nowrap">{formatNumber(totalCost.一般付款, 2)}</td>
                <td className="px-6 py-4 whitespace-nowrap">{formatNumber(totalCost.涉外支付, 2)}</td>
                <td className="px-6 py-4 whitespace-nowrap">{formatNumber(totalCost.设计服务分包, 2)}</td>
                <td className="px-6 py-4 whitespace-nowrap">{formatNumber(totalCost.采购, 2)}</td>
                <td className="px-6 py-4 whitespace-nowrap">{formatNumber(totalCost.施工分包, 2)}</td>
                <td className="px-6 py-4 whitespace-nowrap">{formatNumber(totalCost.其他, 2)}</td>
              </tr>
              {projectCostData.map((item) => (
                <tr key={item.month}>
                  <td className="px-6 py-4 whitespace-nowrap font-bold">{selectedYear}年{item.month}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{formatNumber(
                    item.差旅及报销 + item.人力成本 + item.低负荷成本 + item.一般付款 + 
                    item.涉外支付 + item.设计服务分包 + item.采购 + item.施工分包 + item.其他, 2
                  )}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{formatNumber(item.差旅及报销, 2)}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{formatNumber(item.人力成本, 2)}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{formatNumber(item.低负荷成本, 2)}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{formatNumber(item.一般付款, 2)}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{formatNumber(item.涉外支付, 2)}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{formatNumber(item.设计服务分包, 2)}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{formatNumber(item.采购, 2)}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{formatNumber(item.施工分包, 2)}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{formatNumber(item.其他, 2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    );
  };

  const renderManagementCostCards = () => (
    <div className="grid grid-cols-6 gap-4">
      {Object.entries(managementCostData).map(([key, value]) => (
        <Card key={key} className="p-4">
          <h3 className="text-sm text-gray-500 mb-1">{key}</h3>
          <p className="text-xl font-bold">{formatNumber(value)}<span className="text-sm ml-1">元</span></p>
        </Card>
      ))}
    </div>
  );

  // 添加获取标题的函数
  const getPageTitle = () => {
    switch (selectedSubmenu) {
      case 'operationalMetrics':
        if (selectedMetric === 'all') {
          return '运营指标-数据概览';
        } else {
          const metricName = metrics.find(m => m.id === selectedMetric)?.name;
          return `运营指标-${metricName}`;
        }
      case 'projectDataOverview':
        return '项目数据-数据概览';
      case 'costDataOverview':
        return '成本数据-数据概览';
      case 'sectorCost':
        return '成本数据-项目成本';
      case 'managementCost':
        return '成本数据-管理成本';
      default:
        return '数据看板';
    }
  };

  return (
    <div className="flex">
      {/* 固定的一目录 */}
      <div className="fixed left-0 top-0 h-screen w-20 bg-gray-800 p-2 flex flex-col items-center z-10">
        {/* 使用字母W代替公司logo */}
        <div className="mb-8 mt-4 w-12 h-12 bg-white rounded-full flex items-center justify-center">
          <span className="text-gray-800 text-2xl font-bold">W</span>
        </div>
        
        <div className="flex-1 flex flex-col justify-center space-y-8">
          <Button
            variant="ghost"
            className="w-16 h-16"
            onClick={() => setSelectedMenu('dashboard')}
          >
            <DashboardOutlined className={`text-2xl ${selectedMenu === 'dashboard' ? 'text-white' : 'text-gray-400'}`} />
          </Button>
          <Button
            variant="ghost"
            className="w-16 h-16"
            onClick={() => setSelectedMenu('charts')}
          >
            <BarChartOutlined className={`text-2xl ${selectedMenu === 'charts' ? 'text-white' : 'text-gray-400'}`} />
          </Button>
          <Button
            variant="ghost"
            className="w-16 h-16"
            onClick={() => setSelectedMenu('settings')}
          >
            <SettingOutlined className={`text-2xl ${selectedMenu === 'settings' ? 'text-white' : 'text-gray-400'}`} />
          </Button>
        </div>
      </div>

      {/* 主要内容区域 */}
      <div className="flex ml-20 w-full">
        {/* 可折叠的二级目录 */}
        <div 
          className={`${
            isSidebarExpanded ? 'w-1/5' : 'w-12'
          } min-h-screen p-4 border-r transition-all duration-300 relative bg-white`}
        >
          {/* 添加折叠按钮 */}
          <button
            onClick={() => setIsSidebarExpanded(!isSidebarExpanded)}
            className="absolute text-gray-400 -right-3 top-1/2 transform -translate-y-1/2 w-6 h-24 bg-white border rounded-full flex items-center justify-center cursor-pointer shadow-md z-10"
          >
            {isSidebarExpanded ? '◀' : '▶'}
          </button>

          {/* 筛选内容 */}
          <div className={`${isSidebarExpanded ? 'opacity-100' : 'opacity-0 invisible'} transition-opacity duration-300 h-full`}>
            <div className="mb-4 ">
              <Button
                variant="ghost"
                onClick={() => window.history.back()}
                className="flex items-center pl-0 pr-0 text-gray-400"
              >
                <LeftOutlined className="h-4 w-4 mr-2" />
                返回
              </Button>
            </div>

            <h2 className="text-l font-bold mb-4">筛选</h2>
            
            {/* 筛选框 */}
            <div className="flex flex-col space-y-4 mb-4">
              <Select onValueChange={(value) => setSelectedCenter(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="选择板块" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部</SelectItem>
                  <SelectItem value="jinshan">金山中心</SelectItem>
                  <SelectItem value="shenyang">沈阳中心</SelectItem>
                </SelectContent>
              </Select>
              
              <Select onValueChange={(value) => setSelectedYear(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="选择年份" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2023">2023</SelectItem>
                  <SelectItem value="2022">2022</SelectItem>
                  <SelectItem value="2021">2021</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {/* 添加分割线 */}
            <div className="border-t border-gray-200 my-4"></div>
            
            <Accordion type="single" collapsible className="h-[calc(100vh-200px)] overflow-y-auto">
              <AccordionItem value="metrics">
                <AccordionTrigger>
                  <span className="flex items-center">
                    <BarChartOutlined className="text-lg mr-2" />
                    运营指标
                  </span>
                </AccordionTrigger>
                <AccordionContent>
                  <Button
                    variant="ghost"
                    className="w-full justify-start"
                    onClick={() => {
                      setSelectedMetric('all');
                      setSelectedSubmenu('operationalMetrics');
                    }}
                  >
                    🚩 数据概览
                  </Button>
                  {metrics.map((metric) => (
                    <Button
                      key={metric.id}
                      variant="ghost"
                      className="w-full justify-start"
                      onClick={() => {
                        setSelectedMetric(metric.id);
                        setSelectedSubmenu('operationalMetrics');
                      }}
                    >
                      {`💴 ${metric.name}`}
                    </Button>
                  ))}
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="projectData">
                <AccordionTrigger>
                  <span className="flex items-center">
                    <FolderOutlined className="text-lg mr-2" />
                    项目数据
                  </span>
                </AccordionTrigger>
                <AccordionContent>
                  <Button
                    variant="ghost"
                    className="w-full justify-start"
                    onClick={() => {
                      setSelectedSubmenu('projectDataOverview');
                    }}
                  >
                    🚩 数据概览
                  </Button>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="costData">
                <AccordionTrigger>
                  <span className="flex items-center">
                    <DollarOutlined className="text-lg mr-2" />
                    成本数据
                  </span>
                </AccordionTrigger>
                <AccordionContent>
                  <Button
                    variant="ghost"
                    className="w-full justify-start"
                    onClick={() => {
                      setSelectedSubmenu('costDataOverview');
                    }}
                  >
                    数据概览
                  </Button>
                  <Button
                    variant="ghost"
                    className="w-full justify-start"
                    onClick={() => {
                      setSelectedSubmenu('sectorCost');
                    }}
                  >
                    项目成本
                  </Button>
                  <Button
                    variant="ghost"
                    className="w-full justify-start"
                    onClick={() => {
                      setSelectedSubmenu('managementCost');
                    }}
                  >
                    管理成本
                  </Button>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </div>

        {/* 右侧内容区域 */}
        <div className={`flex-1 p-4 transition-all duration-300 ${
          isSidebarExpanded ? '' : 'ml-0'
        }`}>
          <h1 className="text-2xl font-bold mb-4 text-[#007069cc]">{getPageTitle()}</h1>
          
          {selectedSubmenu === 'operationalMetrics' && (
            <>
              {selectedMetric === 'all' ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {/* 先渲染除了 WIP 和应收账款之外的指标 */}
                  {metrics.filter(metric => !['wip', 'accountsReceivable'].includes(metric.id)).map((metric) => (
                    <Card key={metric.id} className="p-3 bg-gradient-to-r to-indigo-50">
                      <h2 className="text-base font-semibold pl-1">{metric.name}</h2>
                      <div className="">
                        <div className="bg-white p-1 rounded-lg flex items-baseline">
                          <p className="text-3xl font-bold text-[#007069]">{getMetricInfo(metric.id).totalAmount}</p>
                        </div>
                        
                        <div className="bg-white p-1 rounded-lg">
                          <div className="flex items-center justify-between">
                            <p className="text-xs text-gray-500">当月新增额</p>
                            <div className="flex items-center">
                              <span className="text-base font-bold">{getMetricInfo(metric.id).currentMonthAmount}</span>
                            </div>
                          </div>
                        </div>
                        
                        {metric.hasYearlyTarget && (
                          <div className="bg-white p-1 rounded-lg">
                            <p className="text-xs text-gray-500">年度目标完成进度</p>
                            <div className="flex items-center group relative">
                              <Progress 
                                value={parseFloat(getMetricInfo(metric.id).completionRate)} 
                                className="flex-grow mr-2 h-2 [&>div]:bg-[#007069]"
                              />
                              <span className="text-xs font-semibold">{getMetricInfo(metric.id).completionRate}%</span>
                              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                                {getMetricInfo(metric.id).totalAmount}万元 / {getMetricInfo(metric.id).yearlyTarget}万元
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </Card>
                  ))}

                  {/* WIP和应收账款合并的卡片 - 修改这部分 */}
                  <Card className="p-3 bg-gradient-to-r to-indigo-50 col-span-1 sm:col-span-2 lg:col-span-2">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:divide-x divide-gray-200">
                      {/* WIP部分 */}
                      <div className="sm:pr-4">
                        <h2 className="text-base font-semibold pl-1">WIP</h2>
                        <div className="bg-white p-2 rounded-lg">
                          <div className="flex items-baseline">
                            <p className="text-3xl font-bold text-[#007069]">{getMetricInfo('wip').totalAmount}</p>
                          </div>
                          <div className="flex items-center justify-between"> 
                            <p className="text-xs text-gray-500">当月变化</p>
                            <div className="flex items-center">
                              {renderChangeWithTriangle(getMetricInfo('wip').monthlyChange, true)}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* 应收账款部分 */}
                      <div className="sm:pl-2 mt-4 sm:mt-0">
                        <h2 className="text-base font-semibold pl-1">应收账款</h2>
                        <div className="bg-white p-2 rounded-lg">
                          <div className="flex items-baseline">
                            <p className="text-3xl font-bold text-[#007069]">{getMetricInfo('accountsReceivable').totalAmount}</p>
                          </div>
                          <div className="flex items-center justify-between">
                            <p className="text-xs text-gray-500">当月变化</p>
                            <div className="flex items-center">
                              {renderChangeWithTriangle(getMetricInfo('accountsReceivable').monthlyChange, true)}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card>
                </div>
              ) : (
                <>
                  <Card className="p-4 bg-gradient-to-r to-indigo-50">
                    {/* <h2 className="text-xl font-semibold mb-4">{metrics.find(m => m.id === selectedMetric)?.name}概览</h2> */}
                    <div className="grid grid-cols-2 ">
                      <div className="bg-white p-4 rounded-lg">
                        <p className="text-sm text-gray-500 mb-1">{metrics.find(m => m.id === selectedMetric)?.hasYearlyTarget ? '累计金额' : '当前金额'}</p>
                        <p className="text-3xl font-bold">{metricInfo.totalAmount}</p>
                      </div>
                      <div className="bg-white p-4 rounded-lg">
                        <p className="text-sm text-gray-500 mb-1">{metrics.find(m => m.id === selectedMetric)?.hasYearlyTarget ? '当月新增额' : '当月变化'}</p>
                        <div className="flex items-center">
                          {metrics.find(m => m.id === selectedMetric)?.hasYearlyTarget ? (
                            <span className="text-3xl font-bold">{metricInfo.currentMonthAmount}</span>
                          ) : (
                            renderChangeWithTriangle(metricInfo.monthlyChange, true)
                          )}
                        </div>
                      </div>
                      {metrics.find(m => m.id === selectedMetric)?.hasYearlyTarget && (
                        <div className="col-span-2 bg-white p-4 rounded-lg">
                          <p className="text-sm text-gray-500 mb-1">年度目标完成进度</p>
                          <div className="flex items-center ">
                            <Progress 
                              value={parseFloat(metricInfo.completionRate)} 
                              className="flex-grow mr-2 h-2 [&>div]:bg-[#007069]"
                            />
                            <span className="text-lg font-semibold">{metricInfo.completionRate}%</span>
                          </div>
                          <p className="text-sm text-gray-600">
                            {metricInfo.totalAmount} / {metricInfo.yearlyTarget}
                          </p>
                        </div>
                      )}
                    </div>
                  </Card>

                  {metrics.find(m => m.id === selectedMetric)?.hasYearlyTarget && (
                    <div className="flex mt-4 h-[500px]"> {/* 设置固定高度 */}
                      {/* 柱状图 */}
                      <Card className="p-4 mb-4 flex-grow-[2] flex flex-col">
                        <h2 className="text-xl font-semibold mb-4">各月金额</h2>
                        <div className="flex-grow overflow-hidden">
                          <ResponsiveContainer width="100%" height="100%">
                            <ComposedChart data={chartData}>
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey="month" />
                              <YAxis yAxisId="left" orientation="left" tickFormatter={(value) => formatNumber(value)} />
                              <YAxis yAxisId="right" orientation="right" tickFormatter={(value) => formatNumber(Number(value))} />
                              <Tooltip formatter={(value) => formatNumber(Number(value))} />
                              <Legend />
                              <Bar 
                                yAxisId="left" 
                                dataKey={selectedMetric} 
                                name={metrics.find(m => m.id === selectedMetric)?.name} 
                                fill="#007069" 
                                barSize={40}
                              />
                              <Line 
                                yAxisId="right" 
                                type="monotone" 
                                dataKey={`${selectedMetric}Cumulative`} 
                                name="当年累计" 
                                stroke="#85e5a7" 
                                strokeWidth={5}
                                connectNulls={false}
                              />
                            </ComposedChart>
                          </ResponsiveContainer>
                        </div>
                      </Card>
                      
                      {/* 详细信息表格 */}
                      <Card className="p-4 ml-4 mb-4 flex-grow-[1] flex flex-col">
                        <h2 className="text-xl font-semibold mb-4">详细数据</h2>
                        <div className="flex-grow overflow-y-auto">
                          <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50 sticky top-0">
                              <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">月份</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">金额（万元）</th>
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                              {data.map((item) => (
                                <tr key={item.month}>
                                  <td className="px-6 py-4 whitespace-nowrap">{item.month}</td>
                                  <td className="px-6 py-4 whitespace-nowrap">{formatNumber(Number(item[selectedMetric as keyof typeof item]))}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </Card>
                    </div>
                  )}

                  {(selectedMetric === 'wip' || selectedMetric === 'accountsReceivable') && (
                    <>
                      {/* 新增的TOP20项目表格 */}
                      {renderTop20ProjectsTable()}
                    </>
                  )}
                </>
              )}
            </>
          )}

          {selectedSubmenu === 'projectDataOverview' && (
            <div>
              <div className="grid grid-cols-2 gap-4">
                {renderPieChart(projectData.managementDistribution, '项目管理归属分布情况')}
                {renderPieChart(projectData.businessTypeDistribution, '项目业务类型分布情况')}
              </div>
            </div>
          )}

          {selectedSubmenu === 'costDataOverview' && (
            <div>
              <p>这里将显示成本数据的概览信息。</p>
              {/* 在这里添加成本数据概览的具体内容 */}
            </div>
          )}

          {selectedSubmenu === 'sectorCost' && (
            <div>
              {renderProjectCostChart()}
              {renderProjectCostTable()}
            </div>
          )}

          {selectedSubmenu === 'managementCost' && (
            <div>
              {renderManagementCostCards()}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// 生成随机颜色的辅助函数
const getRandomColor = () => {
  return '#' + Math.floor(Math.random()*16777215).toString(16);
};

export default DataDashboard;