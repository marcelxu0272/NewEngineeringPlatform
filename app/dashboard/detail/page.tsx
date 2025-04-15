"use client";

import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, Line, ComposedChart, PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { Card } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { 
  DashboardOutlined,
  BarChartOutlined,
  SettingOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  FolderOutlined,
  DollarOutlined,
  ArrowLeftOutlined,
  SearchOutlined  // 添加这一行
} from '@ant-design/icons';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Highcharts from 'highcharts';
import { Progress } from "@/components/ui/progress";
import { LayoutDashboard, BarChart2, Settings, ArrowUpIcon, ArrowDownIcon, Folder, DollarSign } from 'lucide-react';
import { metrics, monthlyData as data, projectData, projectCostData, managementCostData } from '@/lib/data/dashboard';


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
  { 
    id: 'P001', 
    name: '上海某炼油厂扩建项目', 
    client: '阿朗新科高性能弹性体（常州）有限公司',
    manager: '三',
    responsible: '李四',
    management: '金山中心',
    businessType: '工程总承包',
    date: '2025-01-15',
    type: '新签',
    amount: 5000 * 10000
  },
  { 
    id: 'P002', 
    name: '北京某石化储备库项目', 
    client: '中国化学工程第十一建设有限公司', 
    manager: '王五', 
    responsible: '赵六', 
    management: '沈阳中心', 
    businessType: '设计咨询', 
    date: '2025-01-20',
    type: '新签',
    amount: 4500 * 10000
  },
  { 
    id: 'P003', 
    name: '广州某化工园区建设项目', 
    client: '宁夏英力特化工股份有限公司', 
    manager: '孙七', 
    responsible: '周八', 
    management: '金山中心', 
    businessType: '工程总承包', 
    date: '2025-02-01',
    type: '变更',
    amount: 4000 * 10000
  },
  { 
    id: 'P004', 
    name: '深圳某石油码头改造项目', 
    client: '宁夏英力特化工股份有限公司', 
    manager: '吴九', 
    responsible: '郑十', 
    management: '沈阳中心', 
    businessType: '设计咨询', 
    date: '2025-02-05',
    type: '新签',
    amount: 3500 * 10000
  },
  { 
    id: 'P005', 
    name: '成都某石化研发中心项目', 
    client: '和元智造（上海）基因技术有限公司', 
    manager: '陈十一', 
    responsible: '张十二', 
    management: '金山中心', 
    businessType: '工程总承包', 
    date: '2025-02-10',
    type: '变更',
    amount: 3000 * 10000
  },
  { 
    id: 'P006', 
    name: '重庆某油气管道工程项目', 
    client: '中国化学工程第十建设有限公司', 
    manager: '李十三', 
    responsible: '王十四', 
    management: '沈阳中心', 
    businessType: '设计咨询', 
    date: '2025-02-15',
    type: '新签',
    amount: 2500 * 10000
  },
  { 
    id: 'P007', 
    name: '杭州某化工厂环保改造项目', 
    client: '中国化学工程第九建设有限公司', 
    manager: '赵十五', 
    responsible: '孙十六', 
    management: '金山中心', 
    businessType: '工程总承包', 
    date: '2025-02-20',
    type: '变更',
    amount: 2000 * 10000
  },
  { 
    id: 'P008', 
    name: '南京某石油储备基地项目', 
    client: '中国化学工程第十一建设有限公司', 
    manager: '周七', 
    responsible: '吴十八', 
    management: '沈阳中心', 
    businessType: '设计咨询', 
    date: '2025-03-01',
    type: '新签',
    amount: 1500 * 10000
  },
  { 
    id: 'P009', 
    name: '武汉某石化实验室建设项目', 
    client: '中国化学工程第十一建设有限公司', 
    manager: '陈十九', 
    responsible: '李二十', 
    management: '金山中心', 
    businessType: '工程总承包', 
    date: '2025-03-05',
    type: '变更',
    amount: 1000 * 10000
  },
  { 
    id: 'P010', 
    name: '上海某化工园区建设项目', 
    client: '中国化学工程第一建设有限公司', 
    manager: '张二十一', 
    responsible: '李二十二', 
    management: '金山中心', 
    businessType: '工程总承包', 
    date: '2025-03-10',
    type: '新签',
    amount: 900 * 10000
  },
  { 
    id: 'P011', 
    name: '北京某石化研发中心项目', 
    client: '中国化学工程第一建设有限公司', 
    manager: '王二十三', 
    responsible: '赵二十四', 
    management: '沈阳中心', 
    businessType: '设计咨询', 
    date: '2025-03-15',
    type: '变更',
    amount: 800 * 10000
  },
  { 
    id: 'P012', 
    name: '广州某石油码头改造项目', 
    client: '巴斯夫一体化基地（北京）有限公司', 
    manager: '孙二十五', 
    responsible: '周二十六', 
    management: '金山中心', 
    businessType: '工程总承包', 
    date: '2025-03-20',
    type: '新签',
    amount: 700 * 10000
  },
  { 
    id: 'P013', 
    name: '深圳某石化储备库项目', 
    client: '巴斯夫一体化基地（上海）有限公司', 
    manager: '吴二十-seven', 
    responsible: '郑二十-eight', 
    management: '沈阳中心', 
    businessType: '设计咨询', 
    date: '2025-03-25',
    type: '变更',
    amount: 600 * 10000
  },
  { 
    id: 'P014', 
    name: '成都某石化实验室建设项目', 
    client: '宁夏英力特化工股份有限公司', 
    manager: '陈二十-nine', 
    responsible: '张三十', 
    management: '金山中心', 
    businessType: '工程总承包', 
    date: '2025-04-01',
    type: '新签',
    amount: 500 * 10000
  },
  { 
    id: 'P015', 
    name: '重庆某石化园区建设项目', 
    client: '阿朗新科高性能弹性体（常州）有限公司', 
    manager: '李三十一', 
    responsible: '王三十-two', 
    management: '沈阳中心', 
    businessType: '设计咨询', 
    date: '2025-04-05',
    type: '变更',
    amount: 400 * 10000
  },
  { 
    id: 'P016', 
    name: '杭州某石化研发中心项目', 
    client: '阿朗新科高性能弹性体（常州）有限公司', 
    manager: '赵三十-three', 
    responsible: '孙三十-four', 
    management: '金山中心', 
    businessType: '工程总承包', 
    date: '2025-04-10',
    type: '新签',
    amount: 300 * 10000
  },
  { 
    id: 'P017', 
    name: '南京某石化储备库项目', 
    client: '巴斯夫一体化基地（广东）有限公司', 
    manager: '周三十-five', 
    responsible: '吴三十-six', 
    management: '沈阳中心', 
    businessType: '设计咨询', 
    date: '2025-04-15',
    type: '变更',
    amount: 200 * 10000
  },
  { 
    id: 'P018', 
    name: '武汉某石化码头改造项目', 
    client: '阿朗新科高性能弹性体（常州）有限公司', 
    manager: '陈三十-seven', 
    responsible: '李三十-eight', 
    management: '金山中心', 
    businessType: '工程总承包', 
    date: '2025-04-20',
    type: '新签',
    amount: 100 * 10000
  },
  { 
    id: 'P019', 
    name: '苏州某石化园区建设项目', 
    client: '阿朗新科高性能弹性体（常州）有限公司', 
    manager: '张三十-nine', 
    responsible: '赵四十', 
    management: '沈阳中心', 
    businessType: '设计咨询', 
    date: '2025-04-25',
    type: '变更',
    amount: 90 * 10000
  },
  { 
    id: 'P020', 
    name: '天津某石化研发中心项目', 
    client: '阿朗新科高性能弹性体（常州）有限公司', 
    manager: '孙四十-one', 
    responsible: '周四十-two', 
    management: '金山中心', 
    businessType: '工程总承包', 
    date: '2025-04-30',
    type: '新签',
    amount: 80 * 10000
  }
];

const DataDashboard = () => {
  const [selectedMetric, setSelectedMetric] = useState('newContracts');
  const [selectedMenu, setSelectedMenu] = useState('dashboard');
  const [selectedCenter, setSelectedCenter] = useState('all');
  const [selectedYear, setSelectedYear] = useState('2025');
  const [selectedSubmenu, setSelectedSubmenu] = useState('operationalMetrics');
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(true);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [selectedManagement, setSelectedManagement] = useState('all');
  const [selectedCostManagement, setSelectedCostManagement] = useState('all');
  const [selectedProjectType, setSelectedProjectType] = useState('all');



  const getMetricInfo = (metricId: string) => {
    // 找到最后一个非0值的月份数据
    const lastNonZeroMonth = [...data].reverse().find(item => item[metricId as keyof typeof item] !== 0);
    const currentMonthAmount = lastNonZeroMonth ? Number(lastNonZeroMonth[metricId as keyof typeof lastNonZeroMonth]) : 0;
    
    // 找到倒数第二个非0值的月份数据
    const secondLastNonZeroMonth = [...data].reverse().filter(item => item[metricId as keyof typeof item] !== 0)[1];
    const previousMonthAmount = secondLastNonZeroMonth ? Number(secondLastNonZeroMonth[metricId as keyof typeof secondLastNonZeroMonth]) : 0;
    
    const monthlyChange = currentMonthAmount - previousMonthAmount;

    // 对于WIP和应收账款的特殊处理
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
    const completionRate = ((currentMonthAmount / yearlyTarget) * 100).toFixed(2);

    return {
      totalAmount: formatNumber(currentMonthAmount),
      currentMonthAmount: formatNumber(currentMonthAmount),
      monthlyChange: formatNumber(monthlyChange),
      yearlyTarget: formatNumber(yearlyTarget),
      completionRate
    };
  };

  const metricInfo = getMetricInfo(selectedMetric);

  // 计算累计值的函数
  const calculateCumulativeData = (data: any[], metric: string) => {
    let cumulative = 0;
    return data.map(item => {
      const currentValue = item[metric];
      if (currentValue === 0) {
        return {
          ...item,
          [`${metric}Cumulative`]: null  // 当月值为0时,累计值设为null
        };
      }
      cumulative += currentValue;
      return {
        ...item,
        [`${metric}Cumulative`]: cumulative
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
    const textSize = isWipOrAR ? "text-2xl" : "text-base"; 
    
    if (numericChange > 0) {
      return (
        <div className="flex items-center">
          <ArrowUpIcon className="w-6 h-6 text-red-500 mr-0.5" />
          <span className={`${textSize} font-bold text-red-500`}>{change}</span>
        </div>
      );
    } else if (numericChange < 0) {
      return (
        <div className="flex items-center">
          <ArrowDownIcon className="w-6 h-6 text-green-500 mr-0.5" />
          <span className={`${textSize} font-bold text-green-500`}>{change.replace('-', '')}</span>
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

  const renderTop20ProjectsTable = () => {
    // 判断是否需要显示筛选和搜索
    const showFilters = ['newContracts', 'completedContracts', 'invoicedAmount', 'receivedPayments'].includes(selectedMetric);

    // 筛选数据
    let filteredData = [...top20ProjectsData];
    
    if (showFilters) {
      // 管理归属筛选
      if (selectedManagement !== 'all') {
        filteredData = filteredData.filter(item => item.management === selectedManagement);
      }
      
      // 关键词搜索
      if (searchKeyword) {
        const keyword = searchKeyword.toLowerCase();
        filteredData = filteredData.filter(item => 
          item.id.toLowerCase().includes(keyword) ||
          item.name.toLowerCase().includes(keyword) ||
          item.manager.toLowerCase().includes(keyword) ||
          item.client.toLowerCase().includes(keyword)
        );
      }
    }

    // 计算分页
    const totalPages = Math.ceil(filteredData.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentPageData = filteredData.slice(startIndex, endIndex);

    // 导出数据函数
    const exportData = () => {
      // 创建CSV内容
      const headers = ['项目编号', '项目名称', '甲方名称', '项目经理', '负责人', '管理归属', '业务类型', '日期', '金额（元）'];
      const csvContent = [
        headers.join(','),
        ...filteredData.map(item => [
          item.id,
          item.name,
          item.client,
          item.manager,
          item.responsible,
          item.management,
          item.businessType,
          item.date,
          item.amount
        ].join(','))
      ].join('\n');

      // 创建Blob对象
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      
      // 设置下载属性
      link.setAttribute('href', url);
      link.setAttribute('download', `${metrics.find(m => m.id === selectedMetric)?.name}_数据.csv`);
      link.style.visibility = 'hidden';
      
      // 触发下载
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    };

    return (
      <Card className="p-4 mt-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">
            {selectedMetric === 'newContracts' ? '年度新签合同额明细' : 'TOP20 项目'}
          </h2>
          
          {/* 添加筛选和搜索区域 */}
          {showFilters && (
            <div className="flex items-center space-x-4">
              <Select value={selectedManagement} onValueChange={setSelectedManagement}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="选择管理归属" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部</SelectItem>
                  <SelectItem value="金山中心">金山中心</SelectItem>
                  <SelectItem value="沈阳中心">沈阳中心</SelectItem>
                </SelectContent>
              </Select>
              
              <div className="relative">
                <input
                  type="text"
                  placeholder="搜索项目编号/名称/经理/甲方"
                  value={searchKeyword}
                  onChange={(e) => setSearchKeyword(e.target.value)}
                  className="w-[300px] px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#007069]"
                />
                <SearchOutlined className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              </div>
            </div>
          )}
        </div>

        {/* 表格内容保持不变 */}
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
                <th className="px-4 py-2 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">日期</th>
                <th className="px-4 py-2 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">金额（元）</th>
                {selectedMetric === 'newContracts' && (
                  <th className="px-4 py-2 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">类型</th>
                )}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {currentPageData.map((project) => (
                <tr key={project.id}>
                  <td className="px-4 py-2 whitespace-nowrap">{project.id}</td>
                  <td className="px-4 py-2 whitespace-nowrap">{project.name}</td>
                  <td className="px-4 py-2 whitespace-nowrap">{project.client}</td>
                  <td className="px-4 py-2 whitespace-nowrap">{project.manager}</td>
                  <td className="px-4 py-2 whitespace-nowrap">{project.responsible}</td>
                  <td className="px-4 py-2 whitespace-nowrap">{project.management}</td>
                  <td className="px-4 py-2 whitespace-nowrap">{project.businessType}</td>
                  <td className="px-4 py-2 whitespace-nowrap">{project.date}</td>
                  <td className="px-4 py-2 whitespace-nowrap">{formatNumber(project.amount)}</td>
                  {selectedMetric === 'newContracts' && (
                    <td className="px-4 py-2 whitespace-nowrap">{project.type}</td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* 修改分页控制区域 */}
        <div className="flex items-center justify-between mt-4 px-4">
          <div className="text-sm text-gray-500">
            共 {filteredData.length} 条记录
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              上一页
            </Button>
            <span className="text-sm">
              第 {currentPage} / {totalPages} 页
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              下一页
            </Button>
            
            {/* 添加导出按钮 */}
            {showFilters && (
              <Button
                variant="outline"
                size="sm"
                onClick={exportData}
                className="ml-4"
              >
                导出数据
              </Button>
            )}
          </div>
        </div>
      </Card>
    );
  };

  // 更新渲染项目成本图表的函数
  const renderProjectCostChart = () => {
    // 计算每个月的合同项目成本和部门项目成本
    const chartData = projectCostData.map(item => ({
      month: item.month,
      合同项目成本: item.设计服务分包 + item.采购 + item.施工分包,
      部门项目成本: item.差旅及报销 + item.人力成本 + item.低负荷成本 + item.一般付款 + item.涉外支付 + item.其他
    }));

    return (
      <Card className="p-4 mb-4">
        <h3 className="text-lg font-semibold mb-2">项目成本月度分布</h3>
        <ResponsiveContainer width="100%" height={600}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis tickFormatter={(value) => formatNumber(value)} />
            <Tooltip formatter={(value) => formatNumber(Number(value))} />
            <Legend />
            <Bar dataKey="合同项目成本" stackId="a" fill="#007069" />
            <Bar dataKey="部门项目成本" stackId="a" fill="#00706999" />
          </BarChart>
        </ResponsiveContainer>
      </Card>
    );
  };

  const renderProjectCostTable = () => {
    // 计算汇总数据
    const totalCost = projectCostData.reduce((acc, item) => {
      Object.keys(item).forEach(key => {
        if (key !== 'month') {
          acc[key as keyof typeof item] = (acc[key as keyof typeof item] || 0) as number + (item[key as keyof typeof item] as number)
        }
      });
      return acc;
    }, {} as Record<string, number>);

    // 添加一个格式化函数来处理数值的显示
    const formatCostValue = (value: number) => {
      return value === 0 ? '-' : formatNumber(value, 2);
    };

    // 导出当前数据
    const exportCurrentData = () => {
      const headers = ['月份', '总成本', '差旅及报销', '人力成本', '低负荷成本', '一般付款', 
        '涉外支付', '设计服务分包', '采购', '施工分包', '其他'];
      
      const csvContent = [
        headers.join(','),
        ...projectCostData.map(item => [
          `${selectedYear}年${item.month}`,
          formatCostValue(item.差旅及报销 + item.人力成本 + item.低负荷成本 + item.一般付款 + 
            item.涉外支付 + item.设计服务分包 + item.采购 + item.施工分包 + item.其他),
          formatCostValue(item.差旅及报销),
          formatCostValue(item.人力成本),
          formatCostValue(item.低负荷成本),
          formatCostValue(item.一般付款),
          formatCostValue(item.涉外支付),
          formatCostValue(item.设计服务分包),
          formatCostValue(item.采购),
          formatCostValue(item.施工分包),
          formatCostValue(item.其他)
        ].join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `项目成本数据_${selectedYear}年.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    };

    // 导出明细数据
    const exportDetailData = () => {
      // 这里可以添加导出更详细数据的逻辑
      alert('导出明细功能待实现');
    };

    return (
      <Card className="p-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">项目成本明细数据</h3>
          <div className="flex items-center space-x-4">
            {/* 管理归属选择 */}
            <Select value={selectedCostManagement} onValueChange={setSelectedCostManagement}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="选择管理归属" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部</SelectItem>
                <SelectItem value="金山中心">金山中心</SelectItem>
                <SelectItem value="沈阳中心">沈阳中心</SelectItem>
              </SelectContent>
            </Select>

            {/* 项目类型选择 */}
            <div className="flex items-center space-x-4 border rounded-md p-2">
              <label className="flex items-center">
                <input
                  type="radio"
                  value="all"
                  checked={selectedProjectType === 'all'}
                  onChange={(e) => setSelectedProjectType(e.target.value)}
                  className="mr-2"
                />
                全部
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  value="contract"
                  checked={selectedProjectType === 'contract'}
                  onChange={(e) => setSelectedProjectType(e.target.value)}
                  className="mr-2"
                />
                合同项目
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  value="department"
                  checked={selectedProjectType === 'department'}
                  onChange={(e) => setSelectedProjectType(e.target.value)}
                  className="mr-2"
                />
                部门项目
              </label>
            </div>

            {/* 导出按钮 */}
            <Button
              variant="outline"
              onClick={exportCurrentData}
            >
              导出
            </Button>
            <Button
              variant="outline"
              onClick={exportDetailData}
            >
              导出明细
            </Button>
          </div>
        </div>

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
              <tr className="font-bold">
                <td className="px-6 py-4 whitespace-nowrap">总计</td>
                <td className="px-6 py-4 whitespace-nowrap">{formatCostValue(
                  totalCost.差旅及报销 + totalCost.人力成本 + totalCost.低负荷成本 + totalCost.一般付款 + 
                  totalCost.涉外支付 + totalCost.设计服务分包 + totalCost.采购 + totalCost.施工分包 + totalCost.其他
                )}</td>
                <td className="px-6 py-4 whitespace-nowrap">{formatCostValue(totalCost.差旅及报销)}</td>
                <td className="px-6 py-4 whitespace-nowrap">{formatCostValue(totalCost.人力成本)}</td>
                <td className="px-6 py-4 whitespace-nowrap">{formatCostValue(totalCost.低负荷成本)}</td>
                <td className="px-6 py-4 whitespace-nowrap">{formatCostValue(totalCost.一般付款)}</td>
                <td className="px-6 py-4 whitespace-nowrap">{formatCostValue(totalCost.涉外支付)}</td>
                <td className="px-6 py-4 whitespace-nowrap">{formatCostValue(totalCost.设计服务分包)}</td>
                <td className="px-6 py-4 whitespace-nowrap">{formatCostValue(totalCost.采购)}</td>
                <td className="px-6 py-4 whitespace-nowrap">{formatCostValue(totalCost.施工分包)}</td>
                <td className="px-6 py-4 whitespace-nowrap">{formatCostValue(totalCost.其他)}</td>
              </tr>
              {/* 月度数据行 */}
              {projectCostData.map((item) => (
                <tr key={item.month}>
                  <td className="px-6 py-4 whitespace-nowrap font-bold">{selectedYear}年{item.month}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{formatCostValue(
                    item.差旅及报销 + item.人力成本 + item.低负荷成本 + item.一般付款 + 
                    item.涉外支付 + item.设计服务分包 + item.采购 + item.施工分包 + item.其他
                  )}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{formatCostValue(item.差旅及报销)}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{formatCostValue(item.人力成本)}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{formatCostValue(item.低负荷成本)}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{formatCostValue(item.一般付款)}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{formatCostValue(item.涉外支付)}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{formatCostValue(item.设计服务分包)}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{formatCostValue(item.采购)}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{formatCostValue(item.施工分包)}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{formatCostValue(item.其他)}</td>
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

  // 添加获取当前页面标题的函数
  const getCurrentTitle = () => {
    if (selectedSubmenu === 'operationalMetrics') {
      return metrics.find(m => m.id === selectedMetric)?.name || '';
    } else if (selectedSubmenu === 'sectorCost') {
      return '项目成本';
    } else if (selectedSubmenu === 'managementCost') {
      return '管理成本';
    }
    return '';
  };

  // 添加分页状态
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // 修改 renderClientRankingTable 函数
  const renderClientRankingTable = () => {
    // 计算客户统计信息(保持不变)
    const clientStats = top20ProjectsData.reduce((acc, project) => {
      if (!acc[project.client]) {
        acc[project.client] = {
          amount: 0,
          projectCount: 0
        };
      }
      acc[project.client].amount += project.amount;
      acc[project.client].projectCount += 1;
      return acc;
    }, {} as Record<string, { amount: number; projectCount: number }>);

    // 转换为数组并排序(保持不变)
    const sortedClients = Object.entries(clientStats)
      .map(([client, stats]) => ({
        client,
        ...stats
      }))
      .sort((a, b) => b.amount - a.amount);

    // 计算最大合同额(保持不变)
    const maxAmount = Math.max(...sortedClients.map(item => item.amount));
    
    // 计算分页数据
    const totalPages = Math.ceil(sortedClients.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentPageData = sortedClients.slice(startIndex, endIndex);

    return (
      <Card className="p-4 mt-4">
        <h2 className="text-xl font-semibold mb-4">客户合同额排行榜</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            {/* 表头保持不变 */}
            <thead>
              <tr>
                <th className="px-4 py-2 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-16">排名</th>
                <th className="px-4 py-2 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">客户名称</th>
                <th className="px-4 py-2 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">项目/工作单数量</th>
                <th className="px-4 py-2 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-240">合同额（万元）</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {currentPageData.map((item, index) => (
                <tr key={item.client}>
                  <td className="px-4 py-2 whitespace-nowrap text-sm">{startIndex + index + 1}</td>
                  <td className="px-4 py-2 whitespace-nowrap text-sm">{item.client}</td>
                  <td className="px-4 py-2 whitespace-nowrap text-sm text-center">{item.projectCount}</td>
                  <td className="px-4 py-2">
                    <div className="flex items-center">
                      <span className="w-24 text-sm">{formatNumber(item.amount / 10000, 2)}</span>
                      <div className="flex-1 h-4">
                        <Progress 
                          value={Math.max(10, (item.amount / maxAmount) * 100)}
                          className="h-4 rounded-sm bg-white [&>div]:bg-[#007069] [&>div]:rounded-sm"
                        />
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* 添加分页控制 */}
        <div className="flex items-center justify-between mt-4 px-4">
          <div className="text-sm text-gray-500">
            共 {sortedClients.length} 条记录
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              上一页
            </Button>
            <span className="text-sm">
              第 {currentPage} / {totalPages} 页
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              下一页
            </Button>
          </div>
        </div>
      </Card>
    );
  };

  return (
    <div className="flex h-screen overflow-hidden bg-[#f8faff]">
      {/* 固定的一目录 */}
      <div className="fixed left-0 top-0 h-screen w-16 bg-gray-800 p-2 flex flex-col items-center z-10">
        {/* 公司logo */}
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

      {/* 主要内容区域 */}
      <div className={`flex ml-16 w-full h-screen overflow-hidden bg-[#f8faff] ${
        isSidebarExpanded ? '' : 'ml-0'
      }`}>
        {/* 可折叠的二级目录 */}
        <div className={`${
          isSidebarExpanded ? 'w-[280px]' : 'w-8'
        } h-screen overflow-hidden border-r transition-all duration-300 relative bg-white`}>
          {/* 添加折叠按钮 */}
          <button
            onClick={() => setIsSidebarExpanded(!isSidebarExpanded)}
            className="absolute text-gray-400 -right-2 top-1/2 transform -translate-y-1/2 w-6 h-20 bg-white border rounded-full flex items-center justify-center cursor-pointer shadow-md z-10"
          >
            {isSidebarExpanded ? '◀' : '▶'}
          </button>

          {/* 固定顶部白条 */}
          <div className="fixed top-0 left-16 right-0 h-20 bg-white shadow-sm z-20">
            <h2 className="pt-6 pl-6 text-2xl">运营看板 &gt; 数据明细</h2>
          </div>

          {/* 筛选内容 - 添加上边距以避免被顶部遮挡 */}
          <div className={`${isSidebarExpanded ? 'opacity-100' : 'opacity-0 invisible'} 
            transition-opacity duration-300 h-[calc(100vh-80px)] overflow-hidden w-full pt-24 px-6`}>
            <Button 
              onClick={() => window.history.back()}
              variant="ghost" 
              className="text-[#007069] p-0 hover:bg-transparent mb-4"
            >
              <ArrowLeftOutlined className="mr-2" />
              返回
            </Button>

            {/* 筛选框 */}
            <div className="flex flex-col space-y-4 mb-8">
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
                  <SelectItem value="2023">2025</SelectItem>
                  <SelectItem value="2022">2024</SelectItem>
                  <SelectItem value="2021">2023</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {/* 添加分割线 */}
            <div className="border-t border-gray-200"></div>
            
            <Accordion type="single" collapsible className="h-[calc(100vh-200px)] overflow-y-auto">
              <AccordionItem value="metrics">
                <AccordionTrigger>
                  <span className="flex items-center">
                    <BarChartOutlined className="w-5 h-5 mr-2" />
                    合同数据  
                  </span>
                </AccordionTrigger>
                <AccordionContent>
                  {metrics.map((metric) => (
                    <Button
                      key={metric.id}
                      variant="ghost"
                      className={`w-full justify-start ml-4 ${
                        selectedMetric === metric.id 
                          ? 'bg-[#007069]/10 text-[#007069] font-medium border-l-4 border-[#007069] pl-3'
                          : 'text-gray-600 hover:bg-gray-100'
                      }`}
                      onClick={() => {
                        setSelectedMetric(metric.id);
                        setSelectedSubmenu('operationalMetrics');
                      }}
                    >
                      {`${metric.name}`}
                    </Button>
                  ))}
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="costData">
                <AccordionTrigger>
                  <span className="flex items-center">
                    <DollarOutlined className="w-5 h-5 mr-2" />
                    成本数据
                  </span>
                </AccordionTrigger>
                <AccordionContent>
                  <Button
                    variant="ghost" 
                    className={`w-full justify-start ${
                      selectedSubmenu === 'sectorCost'
                        ? 'bg-[#007069]/10 text-[#007069] font-medium border-l-4 border-[#007069] pl-3'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                    onClick={() => {
                      setSelectedSubmenu('sectorCost');
                    }}
                  >
                    项目成本
                  </Button>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </div>

        {/* 右侧内容区域 */}
        <div className={`flex-1 transition-all duration-300 ${
          isSidebarExpanded ? '' : 'ml-0'
        } h-screen overflow-y-auto pt-20`}>
          {/* 内容区域添加padding */}
          <div className="p-4">
            {/* 添加标题区域 */}
            <h1 className="text-2xl font-semibold text-gray-800 mb-4">
              {getCurrentTitle()}
            </h1>
            
            {selectedSubmenu === 'operationalMetrics' && (
              <>
                <Card className="p-4 bg-gradient-to-r to-indigo-50">
                  <div className="grid grid-cols-3 ">
                    <div className="bg-white p-4 rounded-lg">
                      <p className="text-sm text-gray-500 mb-1">{metrics.find(m => m.id === selectedMetric)?.hasYearlyTarget ? '累计额（万元）' : '当前金额（万元）'}</p>
                      <p className="text-4xl font-bold text-[#007069]">{metricInfo.totalAmount}</p>
                    </div>
                    <div className="bg-white p-4 rounded-lg">
                      <p className="text-sm text-gray-500 mb-1">{metrics.find(m => m.id === selectedMetric)?.hasYearlyTarget ? '当月新增额（万元）' : '上月变化（万元）'}</p>
                      <div className="flex items-center">
                        {metrics.find(m => m.id === selectedMetric)?.hasYearlyTarget ? (
                          <span className="text-4xl font-bold text-[#007069]">{metricInfo.currentMonthAmount}</span>
                        ) : (
                          renderChangeWithTriangle(metricInfo.monthlyChange, true)
                        )}
                      </div>
                    </div>
                    {metrics.find(m => m.id === selectedMetric)?.hasYearlyTarget && (
                      <div className="col-span-3 bg-white p-4 rounded-lg">
                        <div className="flex text-sm mb-1">  
                          <p className="text-sm text-gray-500 mb-1">年度目标完成进度</p>
                          <p className="ml-4 text-sm text-gray-600">
                            {metricInfo.totalAmount} / {metricInfo.yearlyTarget}
                          </p>
                        </div>
                        <div className="flex items-center ">
                          <Progress 
                            value={parseFloat(metricInfo.completionRate)} 
                            className="flex-grow h-4 bg-[#007069]/20 rounded-full [&>div]:bg-[#007069] [&>div]:rounded-full"
                          />
                          <span className="text-lg text-[#007069] ml-8">{metricInfo.completionRate}%</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* 始终显示子目标区域,移除条件判断 */}
                  {metrics.find(m => m.id === selectedMetric)?.subTargets && (
                    <div className="p-4 border-t border-[#007069]/20">
                      {metrics.find(m => m.id === selectedMetric)?.subTargets?.map((target, idx) => {
                        const percentage = Math.min(100, (target.current / target.target) * 100).toFixed(1);
                        return (
                          <div key={idx} className="mb-2 last:mb-0">
                            <div className="text-gray-500 flex text-sm ">
                              <span>{target.type}</span>
                              <span className="ml-4 text-gray-500">
                                {formatNumber(target.current)} / {formatNumber(target.target)}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="flex-1 h-4 bg-[#007069]/20 rounded-full overflow-hidden">
                                <div 
                                  className="h-full bg-[#007069] rounded-full transition-all duration-500"
                                  style={{ width: `${percentage}%` }}
                                />
                              </div>
                              <span className="text-lg text-[#007069] ml-8">{percentage}%</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </Card>

                {metrics.find(m => m.id === selectedMetric)?.hasYearlyTarget && (
                  <div className="flex mt-4 h-[500px]">
                    <Card className="p-4 mb-4 w-full flex flex-col">
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
                            <Line yAxisId="right" type="monotone" dataKey={`${selectedMetric}Cumulative`} name="当年累计" stroke="#85e5a7" strokeWidth={5} />
                          </ComposedChart>
                        </ResponsiveContainer>
                      </div>
                    </Card>
                  </div>
                )}

                {(selectedMetric === 'wip' || 
                  selectedMetric === 'accountsReceivable' ||
                  selectedMetric === 'completedContracts' ||
                  selectedMetric === 'invoicedAmount' ||
                  selectedMetric === 'receivedPayments') && (
                  <>
                    {renderTop20ProjectsTable()}
                  </>
                )}

                {selectedMetric === 'newContracts' && (
                  <>
                    {renderTop20ProjectsTable()}
                    {renderClientRankingTable()}
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
    </div>
  );
};

// 生成随机颜色辅助函数
const getRandomColor = () => {
  return '#' + Math.floor(Math.random()*16777215).toString(16);
};

export default DataDashboard;