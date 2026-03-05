// 指标数据定义
export const metrics = [
  { 
    id: 'newContracts', 
    name: '年度新签合同额', 
    hasYearlyTarget: true,
    subTargets: [
      { type: "设计及咨询", current: 25430.5, target: 40000 },
      { type: "EPC", current: 42785.3, target: 80000 },
      { type: "PMC", current: 6904.61, target: 15000 }
    ]
  },
  {
    id: 'completedContracts',
    name: '年度完成合同额',
    hasYearlyTarget: true, 
    subTargets: [
      { type: "设计及咨询", current: 12845.2, target: 35000 },
      { type: "EPC", current: 21634.8, target: 65000 },
      { type: "PMC", current: 3842.29, target: 12000 }
    ]
  },
  { 
    id: 'invoicedAmount', 
    name: '年度完成开票额', 
    hasYearlyTarget: true,
    subTargets: [
      { type: "设计及咨询", current: 15678.4, target: 30000 },
      { type: "EPC", current: 35421.6, target: 70000 },
      { type: "PMC", current: 4523.8, target: 10000 }
    ]
  },
  { 
    id: 'receivedPayments', 
    name: '年度完成回款额', 
    hasYearlyTarget: true,
    subTargets: [
      { type: "设计及咨询", current: 13245.7, target: 28000 },
      { type: "EPC", current: 31568.2, target: 65000 },
      { type: "PMC", current: 3987.4, target: 9000 }
    ]
  },
  { id: 'wip', name: 'WIP', hasYearlyTarget: false },
  { id: 'accountsReceivable', name: '应收账款', hasYearlyTarget: false },
];

// 月度数据
export const monthlyData = [
  { month: '1月', newContracts: 4000, completedContracts: 3500, invoicedAmount: 3200, receivedPayments: 3000, wip: 1000, accountsReceivable: 2000 },
  { month: '2月', newContracts: 3000, completedContracts: 2800, invoicedAmount: 2600, receivedPayments: 2400, wip: 1100, accountsReceivable: 2100 },
  { month: '3月', newContracts: 2000, completedContracts: 1800, invoicedAmount: 1700, receivedPayments: 1600, wip: 1200, accountsReceivable: 2200 },
  { month: '4月', newContracts: 2780, completedContracts: 2500, invoicedAmount: 2300, receivedPayments: 2100, wip: 1300, accountsReceivable: 2300 },
  { month: '5月', newContracts: 1890, completedContracts: 1700, invoicedAmount: 1600, receivedPayments: 1500, wip: 1400, accountsReceivable: 2400 },
  { month: '6月', newContracts: 2390, completedContracts: 2200, invoicedAmount: 2000, receivedPayments: 1900, wip: 1500, accountsReceivable: 2500 },
  { month: '7月', newContracts: 3490, completedContracts: 3200, invoicedAmount: 3000, receivedPayments: 2800, wip: 1600, accountsReceivable: 2600 },
  { month: '8月', newContracts: 3190, completedContracts: 2900, invoicedAmount: 2700, receivedPayments: 2500, wip: 1700, accountsReceivable: 2700 },
  { month: '9月', newContracts: 2490, completedContracts: 2300, invoicedAmount: 2100, receivedPayments: 2000, wip: 8200, accountsReceivable: 12500 },
  { month: '10月', newContracts: 2790, completedContracts: 2600, invoicedAmount: 2400, receivedPayments: 2200, wip: 8500, accountsReceivable: 12000 },
  { month: '11月', newContracts: 0, completedContracts: 0, invoicedAmount: 0, receivedPayments: 0, wip: 0, accountsReceivable: 0 },
  { month: '12月', newContracts: 0, completedContracts: 0, invoicedAmount: 0, receivedPayments: 0, wip: 0, accountsReceivable: 0 }
];

// 项目分布数据
export const projectData = {
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

// 项目成本数据
export const projectCostData = [
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
  { month: '11月', 差旅及报销: 0, 人力成本: 0, 低负荷成本: 0, 一般付款: 0, 涉外支付: 0, 设计服务分包: 0, 采购: 0, 施工分包: 0, 其他: 0 },
  { month: '12月', 差旅及报销: 0, 人力成本: 0, 低负荷成本: 0, 一般付款: 0, 涉外支付: 0, 设计服务分包: 0, 采购: 0, 施工分包: 0, 其他: 0 }
];

// 管理成本数据
export const managementCostData = {
  费用支付金额: 100000,
  转入成本: 50000,
  转出成本: 30000,
  部门工时成本: 200000,
  低负荷成本: 80000,
  部门管理成本: 150000
};

// 工作负荷预测数据
export const workloadPredictionData = [  
  { month: "8月", rate: 92 },
  { month: "9月", rate: 88 },
  { month: "10月", rate: 85 },
];

// 部门数据
export const departments = [
  { value: 'all', label: '全部' },
  { value: 'dept1', label: '工艺部' },
  { value: 'dept2', label: '设备部' },
  { value: 'dept3', label: '管道部' },
  { value: 'dept4', label: '电气部' },
  { value: 'dept5', label: '仪表部' },
];

// 部门协作数据
export const departmentCollaborationData = Array(15).fill(null).map((_, index) => ({
  key: index,
  department: `部门${index + 1}`,
  ...Array(10).fill(null).reduce((acc, _, colIndex) => {
    acc[`col${colIndex}`] = Math.floor(Math.random() * 100);
    return acc;
  }, {}),
}));

// 部门协作表格列定义
export const collaborationColumns = [
  {
    title: 'department',
    dataIndex: 'department',
    width: 100,
    fixed: 'left',
  },
  ...Array(10).fill(null).map((_, index) => ({
    title: `协作部门${index + 1}`,
    dataIndex: `col${index}`,
    width: 100,
  })),
];

// 卡片数据
export const cardData = [
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