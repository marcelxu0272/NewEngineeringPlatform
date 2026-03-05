"use client"

import { Card, CardContent} from "@/components/ui/card"
import { Line, LineChart, ResponsiveContainer, XAxis, Tooltip as RechartsTooltip, YAxis, CartesianGrid, PieChart, Pie, Cell, Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Area } from "recharts"
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
import { Select, Switch, Button, Modal } from 'antd';
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
          background: 'linear-gradient(to bottom left, transparent calc(50% - 1px), #00706933, transparent calc(50% + 1px))'
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

// 添加人员数据
const personnel = [
  { value: 'zhangsan', label: '张三' },
  { value: 'lisi', label: '李四' },
  { value: 'wangwu', label: '王五' },
  { value: 'zhaoliu', label: '赵六' },
  { value: 'qianqi', label: '钱七' },
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

// 修改卡片数据，移除 subTargets 属性
const cardData = [
  {
    title: "年度新签合同额（万元）",
    value: "75,120.41",
    monthLabel: "11月新增",
    monthValue: "5,364.80",
    percentage: "12.5%",
    donutValue: 45.9
  },
  {
    title: "年度完成合同额（万元）",
    value: "38,322.29",
    monthLabel: "上月新增",
    monthValue: "5,364.80",
    percentage: "8.3%",
    donutValue: 37.1
  },
  {
    title: "年度完成开票额（万元）",
    value: "40,709.20",
    monthLabel: "上月新增",
    monthValue: "5,364.80",
    percentage: "8.3%",
    donutValue: 42.0
  },
  {
    title: "年度完成回款额（万元）",
    value: "42,165.17",
    monthLabel: "上月新增",
    monthValue: "5,364.80",
    percentage: "8.3%",
    donutValue: 44.5
  }
];

// 添加雷达图数据
const radarData = [
  { subject: '沈阳中心', A: 85, fullMark: 100 },
  { subject: '银川中心', A: 65, fullMark: 100 },
  { subject: '惠湛中心', A: 72, fullMark: 100 },
  { subject: '供应链', A: 78, fullMark: 100 },
  { subject: '数字技术', A: 90, fullMark: 100 },
  { subject: 'COII', A: 11, fullMark: 100 },
  { subject: '新材料', A: 6, fullMark: 100 }
];

// 添加未来三月预派发工时数据
const futureWorkloadData = [  
  { month: "8月", hours: 168 },
  { month: "9月", hours: 182 },
  { month: "10月", hours: 176 },
]

// 添加软件使用明细数据
const softwareUsageData = {
  "S3D/E3D": [
    { projectId: "D22002", hours: 4320 },
    { projectId: "D21089", hours: 3650 },
    { projectId: "D22134", hours: 2845 },
    { projectId: "D22078", hours: 2217 },
    { projectId: "D21256", hours: 1400 }
  ],
  "SPPID": [
    { projectId: "D22045", hours: 520 },
    { projectId: "D21134", hours: 380 },
    { projectId: "D22002", hours: 275 },
    { projectId: "D21089", hours: 252 }
  ],
  "SPIAI": [
    { projectId: "D22078", hours: 120 },
    { projectId: "D21256", hours: 95 },
    { projectId: "D22002", hours: 73 }
  ]
};

// 添加项目成本排名数据
const topProjectCosts = [
  { projectId: "D22078", name: "某石化公司烯烃项目", cost: 8642.53 },
  { projectId: "D21089", name: "某化工集团环氧项目", cost: 6735.21 },
  { projectId: "D22002", name: "某能源公司LNG接收站", cost: 5324.87 },
  { projectId: "D21256", name: "某炼化企业催化装置", cost: 4218.65 },
  { projectId: "D22134", name: "某集团公司储运工程", cost: 3876.29 }
];

// 添加月度明细数据
const monthlyDetailData = {
  "年度新签合同额": [
    { month: "1月", value: 5364.80 },
    { month: "2月", value: 6234.56 },
    { month: "3月", value: 7125.32 },
    { month: "4月", value: 8432.15 },
    { month: "5月", value: 6543.21 },
    { month: "6月", value: 7654.32 },
    { month: "7月", value: 8765.43 },
    { month: "8月", value: 7654.32 },
    { month: "9月", value: 6543.21 },
    { month: "10月", value: 5432.10 },
    { month: "11月", value: 5364.80 },
    { month: "12月", value: 0 }
  ],
  "年度完成合同额": [
    { month: "1月", value: 3245.67 },
    { month: "2月", value: 2876.54 },
    { month: "3月", value: 3456.78 },
    { month: "4月", value: 3987.65 },
    { month: "5月", value: 3456.78 },
    { month: "6月", value: 3987.65 },
    { month: "7月", value: 4321.09 },
    { month: "8月", value: 3987.65 },
    { month: "9月", value: 3456.78 },
    { month: "10月", value: 2876.54 },
    { month: "11月", value: 2345.67 },
    { month: "12月", value: 0 }
  ],
  "年度完成开票额": [
    { month: "1月", value: 3456.78 },
    { month: "2月", value: 3123.45 },
    { month: "3月", value: 3654.32 },
    { month: "4月", value: 4123.45 },
    { month: "5月", value: 3654.32 },
    { month: "6月", value: 4123.45 },
    { month: "7月", value: 4567.89 },
    { month: "8月", value: 4123.45 },
    { month: "9月", value: 3654.32 },
    { month: "10月", value: 3123.45 },
    { month: "11月", value: 2654.32 },
    { month: "12月", value: 0 }
  ],
  "年度完成回款额": [
    { month: "1月", value: 3567.89 },
    { month: "2月", value: 3234.56 },
    { month: "3月", value: 3765.43 },
    { month: "4月", value: 4234.56 },
    { month: "5月", value: 3765.43 },
    { month: "6月", value: 4234.56 },
    { month: "7月", value: 4678.90 },
    { month: "8月", value: 4234.56 },
    { month: "9月", value: 3765.43 },
    { month: "10月", value: 3234.56 },
    { month: "11月", value: 2765.43 },
    { month: "12月", value: 0 }
  ],
  "当前WIP": [
    { month: "1月", value: 1876.54 },
    { month: "2月", value: 1987.65 },
    { month: "3月", value: 2098.76 },
    { month: "4月", value: 2109.87 },
    { month: "5月", value: 2210.98 },
    { month: "6月", value: 2321.09 },
    { month: "7月", value: 2432.10 },
    { month: "8月", value: 2543.21 },
    { month: "9月", value: 2654.32 },
    { month: "10月", value: 2765.43 },
    { month: "11月", value: 2876.54 },
    { month: "12月", value: 0 }
  ],
  "应收账款": [
    { month: "1月", value: 1023.45 },
    { month: "2月", value: 1134.56 },
    { month: "3月", value: 1245.67 },
    { month: "4月", value: 1356.78 },
    { month: "5月", value: 1467.89 },
    { month: "6月", value: 1578.90 },
    { month: "7月", value: 1689.01 },
    { month: "8月", value: 1790.12 },
    { month: "9月", value: 1901.23 },
    { month: "10月", value: 2012.34 },
    { month: "11月", value: 2123.45 },
    { month: "12月", value: 0 }
  ]
};

// 添加客户合同额数据
const customerContractData = [
  { name: '中石化', value: 28500.25 },
  { name: '中石油', value: 19750.80 },
  { name: '中海油', value: 15320.45 },
  { name: '中化集团', value: 12450.30 },
  { name: '其他客户', value: 8750.60 }
];

// 饼图的颜色
const COLORS = ['#007069', '#00968e', '#33b3ac', '#66c9c4', '#99dedb'];

export default function Component() {
  const [selectedDept, setSelectedDept] = useState('dept1');
  const [selectedPerson, setSelectedPerson] = useState<string[]>(['zhangsan']);
  const [expandedSoftwares, setExpandedSoftwares] = useState<string[]>(["S3D/E3D", "SPPID", "SPIAI"]);
  
  // 添加模态框状态
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState("");
  const [modalData, setModalData] = useState<any[]>([]);

  // 添加人员选择变更处理函数
  const handlePersonChange = (value: string[]) => {
    setSelectedPerson(value);
  };

  // 更新切换软件明细展开状态的函数
  const toggleSoftwareExpand = (software: string) => {
    if (expandedSoftwares.includes(software)) {
      setExpandedSoftwares(expandedSoftwares.filter(item => item !== software));
    } else {
      setExpandedSoftwares([...expandedSoftwares, software]);
    }
  };

  // 添加打开模态框的函数
  const openDetailModal = (title: string) => {
    setModalTitle("月度统计明细");
    const combinedData = monthlyDetailData["年度新签合同额"].map((item, index) => {
      return {
        month: item.month,
        "年度新签合同额": monthlyDetailData["年度新签合同额"][index].value,
        "年度完成合同额": monthlyDetailData["年度完成合同额"][index].value,
        "年度完成开票额": monthlyDetailData["年度完成开票额"][index].value,
        "年度完成回款额": monthlyDetailData["年度完成回款额"][index].value,
        "当前WIP": monthlyDetailData["当前WIP"][index].value,
        "应收账款": monthlyDetailData["应收账款"][index].value,
        "成本": monthlyDetailData["当前WIP"][index].value * 0.7, // 添加成本字段（这里用WIP的70%作为示例）
      };
    });
    setModalData(combinedData);
    setIsModalOpen(true);
  };

  // 添加导出CSV函数
  const exportToCSV = () => {
    // 表头
    const headers = ["月份", "年度新签合同额", "年度完成合同额", "年度完成开票额", "年度完成回款额", "当前WIP", "应收账款", "成本"];
    
    // 转换数据为CSV格式
    let csvContent = headers.join(",") + "\n";
    
    // 添加数据行
    modalData.forEach(item => {
      const row = [
        item.month,
        item["年度新签合同额"].toFixed(2),
        item["年度完成合同额"].toFixed(2),
        item["年度完成开票额"].toFixed(2),
        item["年度完成回款额"].toFixed(2),
        item["当前WIP"].toFixed(2),
        item["应收账款"].toFixed(2),
        item["成本"].toFixed(2)
      ];
      csvContent += row.join(",") + "\n";
    });
    
    // 添加合计行
    const totals = [
      "合计",
      modalData.reduce((sum, item) => sum + item["年度新签合同额"], 0).toFixed(2),
      modalData.reduce((sum, item) => sum + item["年度完成合同额"], 0).toFixed(2),
      modalData.reduce((sum, item) => sum + item["年度完成开票额"], 0).toFixed(2),
      modalData.reduce((sum, item) => sum + item["年度完成回款额"], 0).toFixed(2),
      modalData.reduce((sum, item) => sum + item["当前WIP"], 0).toFixed(2),
      modalData.reduce((sum, item) => sum + item["应收账款"], 0).toFixed(2),
      modalData.reduce((sum, item) => sum + item["成本"], 0).toFixed(2)
    ];
    csvContent += totals.join(",");
    
    // 创建Blob对象
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    
    // 创建下载链接
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    
    // 设置下载属性
    link.setAttribute("href", url);
    link.setAttribute("download", "数据月度明细.csv");
    link.style.visibility = "hidden";
    
    // 添加到文档并触发点击
    document.body.appendChild(link);
    link.click();
    
    // 清理
    document.body.removeChild(link);
  };

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
            <div className="flex justify-between items-center pt-6 px-6">
              <h2 className="text-2xl">项目经理看板</h2>
            </div>
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
              {/* 修改人员选择器为多选 */}
              <Select
                mode="multiple"
                allowClear
                value={selectedPerson}
                onChange={handlePersonChange}
                options={personnel}
                style={{ width: 300 }}
                className="text-[#007069]"
                placeholder="选择人员（空为全部）"
                maxTagCount={2}
                maxTagTextLength={3}
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
              {/* 添加月度统计按钮 */}
              <Button 
                type="primary"
                icon={<BarChartOutlined />}
                onClick={() => openDetailModal("月度统计")}
                className="bg-[#007069] hover:bg-[#005c56] ml-auto" // 添加 ml-auto 使按钮靠右对齐
              >
                月度统计
              </Button>
            </div>

            <div className="px-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {cardData.map((card, index) => (
                  <Card key={index} className="border-0 shadow-md">
                    <CardContent className="p-4">
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-medium text-sm text-gray-700">{card.title}</h3>
                          <AntTooltip title="查看详情">
                            <button 
                              onClick={() => openDetailModal(card.title)}
                              className="w-5 h-5 rounded-full bg-[#007069]/10 flex items-center justify-center hover:bg-[#007069]/20 transition-colors"
                            >
                              <RightOutlined className="text-xs text-[#007069]" />
                            </button>
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
              <CardContent className="p-4 h-full flex flex-col">
                <h3 className="font-medium text-sm text-gray-700 mb-2">成本分析（万元）</h3>
                <div className="flex flex-col md:flex-row gap-3 flex-1">
                  {/* 合计成本 */}
                  <div className="bg-[#007069]/10 p-3 rounded-lg flex-[1] flex flex-col justify-center">
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
                  
                  {/* 成本排名前三的项目 */}
                  <div className="bg-[#007069]/5 p-3 rounded-lg flex-[3] flex flex-col justify-center">
                    <div className="space-y-2">
                      {topProjectCosts.map((project, idx) => (
                        <div key={idx} className="flex justify-between items-center">
                          <div className="flex-1">
                            <div className="flex items-center gap-1">
                              <span className={`text-xs px-1.5 py-0.5 rounded-sm ${
                                idx === 0 ? 'bg-amber-100 text-amber-800' : 
                                idx === 1 ? 'bg-amber-100 text-amber-800' : 
                                idx === 2 ? 'bg-amber-100 text-amber-800' :
                                'bg-blue-100 text-blue-700'
                              }`}>
                                {idx + 1}
                              </span>
                              <span className="text-xs text-gray-500 font-medium">{project.projectId}</span>
                              <span className="text-xs text-gray-500 truncate ml-1">{project.name}</span>
                            </div>
                          </div>
                          <span className="text-sm text-[#007069] font-medium ml-2">{project.cost.toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 未来三月预派发工时 */}
            <Card className="border-0 shadow-md h-full">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-4">
                  <h3 className="font-medium text-sm text-gray-700">未来三月预派发工时</h3>
                  <AntTooltip title="查看详情">
                    <Link 
                      href="/dashboard/future-workload"
                      className="w-5 h-5 rounded-full bg-[#007069]/10 flex items-center justify-center hover:bg-[#007069]/20 transition-colors"
                    >
                      <RightOutlined className="text-xs text-[#007069]" />
                    </Link>
                  </AntTooltip>
                </div>
                <div className="w-full h-36">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart 
                      data={futureWorkloadData} 
                      margin={{ top: 20, right: 20, bottom: 0, left: 0 }}
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
                        padding={{ left: 20, right: 20 }}
                      />
                      <YAxis
                        tick={{ fontSize: 12, fill: '#115e59' }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <RechartsTooltip
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            return (
                              <div className="bg-white p-2 border border-teal-200 rounded shadow-sm">
                                <p className="text-sm text-[#007069]">{`${payload[0].payload.month}: ${payload[0].value}小时`}</p>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Area
                        type="natural"
                        dataKey="hours"
                        stroke="#007069"
                        fillOpacity={0.2}
                        fill="#007069"
                      />
                      <Line 
                        type="natural" 
                        dataKey="hours" 
                        stroke="#007069" 
                        strokeWidth={2} 
                        dot={{ r: 4, fill: '#007069' }}
                        label={({value, x, y}) => (
                          <text 
                            x={x} 
                            y={y-10} 
                            fill="#115e59" 
                            fontSize={12} 
                            textAnchor="middle"
                          >
                            {`${value}h`}
                          </text>
                        )}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 调整底部部的间距 */}
          <div className="px-4 grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* 左侧雷达图卡片 */}
            <Card className="border-0 shadow-md">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="font-medium text-sm text-gray-700">Workshare 金额（万元）</h3>
                  <AntTooltip title="查看详情">
                    <Link 
                      href="/dashboard/workshare-detail"
                      className="w-5 h-5 rounded-full bg-[#007069]/10 flex items-center justify-center hover:bg-[#007069]/20 transition-colors"
                    >
                      <RightOutlined className="text-xs text-[#007069]" />
                    </Link>
                  </AntTooltip>
                </div>
                <div className="w-full h-[210px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                      <PolarGrid stroke="rgba(0, 112, 105, 0.2)" />
                      <PolarAngleAxis dataKey="subject" tick={{ fill: '#007069', fontSize: 12 }} />
                      <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: '#007069', fontSize: 10 }} />
                      <Radar
                        name="项目金额"
                        dataKey="A"
                        stroke="#007069"
                        fill="#007069"
                        fillOpacity={0.6}
                      />
                      <RechartsTooltip
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            return (
                              <div className="bg-white p-2 border border-teal-200 rounded shadow-sm">
                                <p className="text-sm text-[#007069]">{`${payload[0].payload.subject}: ${payload[0].value}万元`}</p>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* 右侧卡片改为客户合同额饼图 */}
            <Card className="border-0 shadow-md">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="font-medium text-sm text-gray-700">客户合同额（万元）</h3>
                  <AntTooltip title="查看详情">
                    <Link 
                      href="/dashboard/customer-contracts"
                      className="w-5 h-5 rounded-full bg-[#007069]/10 flex items-center justify-center hover:bg-[#007069]/20 transition-colors"
                    >
                      <RightOutlined className="text-xs text-[#007069]" />
                    </Link>
                  </AntTooltip>
                </div>
                <div className="w-full h-[210px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={customerContractData}
                        cx="50%"
                        cy="50%"
                        labelLine={true}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        nameKey="name"
                        label={({ name, value, percent }) => `${name}: ${(percent * 100).toFixed(0)}% (${value.toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 0})}万)`}
                      >
                        {customerContractData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <RechartsTooltip
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            return (
                              <div className="bg-white p-2 border border-teal-200 rounded shadow-sm">
                                <p className="text-sm text-[#007069]">{`${payload[0]?.name || ''}: ${payload[0]?.value?.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2}) || '0.00'}万元`}</p>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-md h-full">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-4">
                  <h3 className="font-medium text-sm text-gray-700">工程师工程软件参与小时数</h3>
                  <AntTooltip title="查看详情">
                    <Link 
                      href="/dashboard/software-hours"
                      className="w-5 h-5 rounded-full bg-[#007069]/10 flex items-center justify-center hover:bg-[#007069]/20 transition-colors"
                    >
                      <RightOutlined className="text-xs text-[#007069]" />
                    </Link>
                  </AntTooltip>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {/* S3D/E3D 软件卡片 */}
                  <div className="bg-[#007069]/10 p-3 rounded-lg">
                    <div 
                      className="flex justify-between items-center cursor-pointer"
                      onClick={() => toggleSoftwareExpand("S3D/E3D")}
                    >
                      <div>
                        <div className="text-lg font-bold text-[#007069]">16,432</div>
                        <p className="text-xs text-[#007069] mt-1">S3D/E3D</p>
                      </div>
                      <div className={`transition-transform duration-300 ${expandedSoftwares.includes("S3D/E3D") ? "rotate-90" : ""}`}>
                        <RightOutlined className="text-xs text-[#007069]" />
                      </div>
                    </div>
                    
                    {/* 展开的项目明细 */}
                    <div className={`overflow-hidden transition-all duration-300 ease-in-out ${expandedSoftwares.includes("S3D/E3D") ? "max-h-[500px] mt-2" : "max-h-0"}`}>
                      <div className="border-t border-[#007069]/20 pt-2 space-y-2">
                        {softwareUsageData["S3D/E3D"].map((item, idx) => (
                          <div key={idx} className="flex justify-between items-center text-xs">
                            <span className="text-[#007069]">{item.projectId}</span>
                            <span className="text-[#007069] font-medium">{item.hours}h</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  {/* SPPID 软件卡片 */}
                  <div className="bg-[#007069]/10 p-3 rounded-lg">
                    <div 
                      className="flex justify-between items-center cursor-pointer"
                      onClick={() => toggleSoftwareExpand("SPPID")}
                    >
                      <div>
                        <div className="text-lg font-bold text-[#007069]">1,427</div>
                        <p className="text-xs text-[#007069] mt-1">SPPID</p>
                      </div>
                      <div className={`transition-transform duration-300 ${expandedSoftwares.includes("SPPID") ? "rotate-90" : ""}`}>
                        <RightOutlined className="text-xs text-[#007069]" />
                      </div>
                    </div>
                    
                    {/* 展开的项目明细 */}
                    <div className={`overflow-hidden transition-all duration-300 ease-in-out ${expandedSoftwares.includes("SPPID") ? "max-h-[500px] mt-2" : "max-h-0"}`}>
                      <div className="border-t border-[#007069]/20 pt-2 space-y-1">
                        {softwareUsageData["SPPID"].map((item, idx) => (
                          <div key={idx} className="flex justify-between items-center text-xs">
                            <span className="text-[#007069]">{item.projectId}</span>
                            <span className="text-[#007069] font-medium">{item.hours}h</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  {/* SPIAI 软件卡片 */}
                  <div className="bg-[#007069]/10 p-3 rounded-lg">
                    <div 
                      className="flex justify-between items-center cursor-pointer"
                      onClick={() => toggleSoftwareExpand("SPIAI")}
                    >
                      <div>
                        <div className="text-lg font-bold text-[#007069]">288</div>
                        <p className="text-xs text-[#007069] mt-1">SPIAI</p>
                      </div>
                      <div className={`transition-transform duration-300 ${expandedSoftwares.includes("SPIAI") ? "rotate-90" : ""}`}>
                        <RightOutlined className="text-xs text-[#007069]" />
                      </div>
                    </div>
                    
                    {/* 展开的项目明细 */}
                    <div className={`overflow-hidden transition-all duration-300 ease-in-out ${expandedSoftwares.includes("SPIAI") ? "max-h-[500px] mt-2" : "max-h-0"}`}>
                      <div className="border-t border-[#007069]/20 pt-2 space-y-1">
                        {softwareUsageData["SPIAI"].map((item, idx) => (
                          <div key={idx} className="flex justify-between items-center text-xs">
                            <span className="text-[#007069]">{item.projectId}</span>
                            <span className="text-[#007069] font-medium">{item.hours}h</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* 修改月度明细模态框 */}
      <Modal
        title={modalTitle}
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        width={1500}
        style={{ top: 80 }}
        footer={[
          <Button 
            key="export" 
            type="primary" 
            onClick={exportToCSV}
            className="bg-[#007069] hover:bg-[#005c56]"
          >
            导出Excel
          </Button>,
          <Button 
            key="close" 
            onClick={() => setIsModalOpen(false)}
          >
            关闭
          </Button>
        ]}
      >
        <Table
          dataSource={[
            ...modalData,
            {
              // 添加合计行
              key: 'total',
              month: '合计',
              "年度新签合同额": modalData.reduce((sum, item) => sum + item["年度新签合同额"], 0),
              "年度完成合同额": modalData.reduce((sum, item) => sum + item["年度完成合同额"], 0),
              "年度完成开票额": modalData.reduce((sum, item) => sum + item["年度完成开票额"], 0),
              "年度完成回款额": modalData.reduce((sum, item) => sum + item["年度完成回款额"], 0),
              "当前WIP": null, // WIP不需要合计
              "应收账款": null, // 应收账款不需要合计
              "成本": modalData.reduce((sum, item) => sum + item["成本"], 0),
            }
          ]}
          columns={[
            { 
              title: '月份', 
              dataIndex: 'month', 
              key: 'month', 
              width: 80,
              render: (text) => text === '合计' ? <strong>{text}</strong> : text // 合计行加粗
            },
            ...['年度新签合同额', '年度完成合同额', '年度完成开票额', '年度完成回款额', '当前WIP', '应收账款', '成本'].map(key => ({
              title: key,
              dataIndex: key,
              key: key,
              width: 160,
              align: 'right' as const,
              render: (text, record) => {
                // 对于合计行
                if (record.month === '合计') {
                  // 如果是WIP或应收账款，显示空白
                  if (key === '当前WIP' || key === '应收账款') {
                    return '';
                  }
                  // 其他列显示加粗的合计数值
                  return <strong>{text?.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                  })}</strong>;
                }
                // 普通行的数字格式化
                return typeof text === 'number' ? text.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2
                }) : '';
              }
            }))
          ]}
          pagination={false}
          scroll={{ x: 'max-content', y: 500 }}
          bordered
          size="small"
          className="ant-table-small"
        />
      </Modal>
    </ConfigProvider>
  )
}