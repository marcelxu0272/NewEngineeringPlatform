"use client"

import React, { useState } from 'react'
import { Table, Tooltip, Modal, message, Upload } from 'antd'
import { 
  DashboardOutlined, 
  BarChartOutlined, 
  SettingOutlined,
  DownOutlined,
  RightOutlined, 
  EyeOutlined,
  EyeInvisibleOutlined,
  ArrowLeftOutlined,
  UpOutlined,
  InboxOutlined
} from '@ant-design/icons'
import { Form, Input, Select, DatePicker, Button } from 'antd'
import Link from 'next/link'
import { ConfigProvider } from 'antd'
import { pinyin } from 'pinyin-pro';

// 添加模拟数据
const projectData = [
  {
    id: "B24208",
    name: "智能交通系统集成项目",
    manager: "赵强",
    department: "技术部",
    customer: "上海市金山区第一交警支队",
    startDate: "2024-03-01",
    businessType: "系统集成",
    contractSigned: "已签署",
    newContractAmount: "80,000.00",
    totalContractAmount: "320,000.00",
    remainingContractAmount: "240,000.00",
    completedContract: {
      current: "64,000.00",
      yearly: "128,000.00",
      total: "128,000.00",
      months: ["5,333.33", "5,333.33", "5,333.33", "5,333.33", "5,333.33", "5,333.33", 
               "5,333.33", "5,333.33", "5,333.33", "5,333.33", "5,333.33", "5,333.33"]
    },
    invoice: {
      current: "32,000.00",
      yearly: "64,000.00",
      total: "64,000.00",
      months: ["2,666.67", "2,666.67", "2,666.67", "2,666.67", "2,666.67", "2,666.67",
               "2,666.67", "2,666.67", "2,666.67", "2,666.67", "2,666.67", "2,666.67"]
    },
    payment: {
      current: "48,000.00",
      yearly: "96,000.00",
      total: "96,000.00",
      months: ["4,000.00", "4,000.00", "4,000.00", "4,000.00", "4,000.00", "4,000.00",
               "4,000.00", "4,000.00", "4,000.00", "4,000.00", "4,000.00", "4,000.00"]
    },
    receivable: "32,000.00",
    wip: "32,000.00"
  },
  {
    id: "B24209",
    name: "上海金山区石化数据中心基础设施建设项目",
    manager: "钱文",
    department: "销售部",
    customer: "数据中心",
    startDate: "2024-04-01",
    businessType: "软件开发",
    contractSigned: "已签署",
    newContractAmount: "120,000.00",
    totalContractAmount: "480,000.00",
    remainingContractAmount: "360,000.00",
    completedContract: {
      current: "96,000.00",
      yearly: "192,000.00",
      total: "192,000.00",
      months: ["8,000.00", "8,000.00", "8,000.00", "8,000.00", "8,000.00", "8,000.00", 
               "8,000.00", "8,000.00", "8,000.00", "8,000.00", "8,000.00", "8,000.00"]
    },
    invoice: {
      current: "48,000.00",
      yearly: "96,000.00",
      total: "96,000.00",
      months: ["4,000.00", "4,000.00", "4,000.00", "4,000.00", "4,000.00", "4,000.00",
               "4,000.00", "4,000.00", "4,000.00", "4,000.00", "4,000.00", "4,000.00"]
    },
    payment: {
      current: "72,000.00",
      yearly: "144,000.00",
      total: "144,000.00",
      months: ["6,000.00", "6,000.00", "6,000.00", "6,000.00", "6,000.00", "6,000.00",
               "6,000.00", "6,000.00", "6,000.00", "6,000.00", "6,000.00", "6,000.00"]
    },
    receivable: "48,000.00",
    wip: "48,000.00"
  },
  {
    id: "B24210",
    name: "数据分析系统",
    manager: "李四",
    department: "技术部",
    customer: "数据分析中心",
    startDate: "2024-05-01",
    businessType: "系统集成",
    contractSigned: "已签署",
    newContractAmount: "150,000.00",
    totalContractAmount: "600,000.00",
    remainingContractAmount: "450,000.00",
    completedContract: {
      current: "120,000.00",
      yearly: "240,000.00",
      total: "240,000.00",
      months: ["10,000.00", "10,000.00", "10,000.00", "10,000.00", "10,000.00", "10,000.00", 
               "10,000.00", "10,000.00", "10,000.00", "10,000.00", "10,000.00", "10,000.00"]
    },
    invoice: {
      current: "90,000.00",
      yearly: "180,000.00",
      total: "180,000.00",
      months: ["7,500.00", "7,500.00", "7,500.00", "7,500.00", "7,500.00", "7,500.00",
               "7,500.00", "7,500.00", "7,500.00", "7,500.00", "7,500.00", "7,500.00"]
    },
    payment: {
      current: "108,000.00",
      yearly: "216,000.00",
      total: "216,000.00",
      months: ["9,000.00", "9,000.00", "9,000.00", "9,000.00", "9,000.00", "9,000.00",
               "9,000.00", "9,000.00", "9,000.00", "9,000.00", "9,000.00", "9,000.00"]
    },
    receivable: "72,000.00",
    wip: "72,000.00"
  },
  {
    id: "B24211",
    name: "人工智能项目",
    manager: "张三",
    department: "销售部",
    customer: "人工智能研究中心",
    startDate: "2024-06-01",
    businessType: "软件开发",
    contractSigned: "已签署",
    newContractAmount: "180,000.00",
    totalContractAmount: "720,000.00",
    remainingContractAmount: "540,000.00",
    completedContract: {
      current: "144,000.00",
      yearly: "288,000.00",
      total: "288,000.00",
      months: ["12,000.00", "12,000.00", "12,000.00", "12,000.00", "12,000.00", "12,000.00", 
               "12,000.00", "12,000.00", "12,000.00", "12,000.00", "12,000.00", "12,000.00"]
    },
    invoice: {
      current: "108,000.00",
      yearly: "216,000.00",
      total: "216,000.00",
      months: ["9,000.00", "9,000.00", "9,000.00", "9,000.00", "9,000.00", "9,000.00",
               "9,000.00", "9,000.00", "9,000.00", "9,000.00", "9,000.00", "9,000.00"]
    },
    payment: {
      current: "129,600.00",
      yearly: "259,200.00",
      total: "259,200.00",
      months: ["10,800.00", "10,800.00", "10,800.00", "10,800.00", "10,800.00", "10,800.00",
               "10,800.00", "10,800.00", "10,800.00", "10,800.00", "10,800.00", "10,800.00"]
    },  
    receivable: "90,000.00",
    wip: "90,000.00"
  }
  // 可以继续添加更多项目数据...
]

// 添加一个格式化数字的辅助函数
const formatNumber = (num: number) => {
  return num.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

// 计算月度汇总数据
const calculateMonthlySum = (field: 'completedContract' | 'invoice' | 'payment') => {
  return Array(12).fill(0).map((_, index) => {
    const sum = projectData.reduce((acc, item) => {
      return acc + parseFloat(item[field].months[index].replace(/,/g, ''));
    }, 0);
    return formatNumber(sum);
  });
};

// 修改汇总数据的计算逻辑
const summaryData = {
  id: '汇总',
  name: '',
  manager: '',
  department: '',
  customer: '',
  startDate: '',
  businessType: '',
  contractSigned: '',
  newContractAmount: formatNumber(projectData.reduce((sum, item) => sum + parseFloat(item.newContractAmount.replace(/,/g, '')), 0)),
  totalContractAmount: formatNumber(projectData.reduce((sum, item) => sum + parseFloat(item.totalContractAmount.replace(/,/g, '')), 0)),
  remainingContractAmount: formatNumber(projectData.reduce((sum, item) => sum + parseFloat(item.remainingContractAmount.replace(/,/g, '')), 0)),
  completedContract: {
    current: formatNumber(projectData.reduce((sum, item) => sum + parseFloat(item.completedContract.current.replace(/,/g, '')), 0)),
    yearly: formatNumber(projectData.reduce((sum, item) => sum + parseFloat(item.completedContract.yearly.replace(/,/g, '')), 0)),
    total: formatNumber(projectData.reduce((sum, item) => sum + parseFloat(item.completedContract.total.replace(/,/g, '')), 0)),
    months: calculateMonthlySum('completedContract')
  },
  invoice: {
    current: formatNumber(projectData.reduce((sum, item) => sum + parseFloat(item.invoice.current.replace(/,/g, '')), 0)),
    yearly: formatNumber(projectData.reduce((sum, item) => sum + parseFloat(item.invoice.yearly.replace(/,/g, '')), 0)),
    total: formatNumber(projectData.reduce((sum, item) => sum + parseFloat(item.invoice.total.replace(/,/g, '')), 0)),
    months: calculateMonthlySum('invoice')
  },
  payment: {
    current: formatNumber(projectData.reduce((sum, item) => sum + parseFloat(item.payment.current.replace(/,/g, '')), 0)),
    yearly: formatNumber(projectData.reduce((sum, item) => sum + parseFloat(item.payment.yearly.replace(/,/g, '')), 0)), 
    total: formatNumber(projectData.reduce((sum, item) => sum + parseFloat(item.payment.total.replace(/,/g, '')), 0)),
    months: calculateMonthlySum('payment')
  },
  receivable: formatNumber(projectData.reduce((sum, item) => sum + parseFloat(item.receivable.replace(/,/g, '')), 0)),
  wip: formatNumber(projectData.reduce((sum, item) => sum + parseFloat(item.wip.replace(/,/g, '')), 0))
}

// 在数据源中添加汇总数据
const dataSourceWithSummary = [summaryData, ...projectData]

// 从项目数据中动态生成项目经理选项
const managerOptions = Array.from(new Set(projectData.map(item => item.manager)))
  .map(manager => ({
    label: manager,
    value: manager
  }))

const departmentOptions = [
  { label: '技术部', value: '技术部' },
  { label: '销售部', value: '销售部' },
]

const businessTypeOptions = [
  { label: '软件开发', value: '软件开发' },
  { label: '系统集成', value: '系统集成' },
]

// 添加列宽度配置
const COLUMN_WIDTHS = {
  id: 100,
  name: 200,
  manager: 80,
  department: 100,
  customer: 150,
  startDate: 90,
  businessType: 80,
  contractSigned: 100
}

// 计算每列的 left 位置
const getLeftPosition = (index: number) => {
  let left = 0
  const columns = Object.values(COLUMN_WIDTHS)
  for (let i = 0; i < index; i++) {
    left += columns[i]
  }
  return left
}

// 算基本信息总宽度
const BASIC_INFO_TOTAL_WIDTH = Object.values(COLUMN_WIDTHS).reduce((sum, width) => sum + width, 0)

// 添加统计数据
const statisticsData = [
  {
    key: 'S520',
    code: 'S520',
    unit: '金山中心',
    newContract: '58,103,733.00',
    remainingContract: '71,176,438.00',
    wip: '67,422,976.00',
    receivable: '15,608,788.00',
    currentCompleted: '7,908,154.00',
    yearlyCompleted: '61,565,773.00',
    yearlyInvoice: '74,651,950.00',
    yearlyPayment: '81,636,783.00'
  },
  {
    key: 'S530',
    code: 'S530', 
    unit: '银川中心',
    newContract: '36,844,488.00',
    remainingContract: '26,698,956.00',
    wip: '29,833,204.00',
    receivable: '15,849,132.00',
    currentCompleted: '5,915,782.00',
    yearlyCompleted: '32,660,438.00',
    yearlyInvoice: '18,252,212.00',
    yearlyPayment: '14,174,117.00'
  },
  {
    key: 'S540',
    code: 'S540', 
    unit: '惠湛中心',
    newContract: '42,191,111.00',
    remainingContract: '35,123,456.00',
    wip: '40,987,654.00',
    receivable: '18,765,432.00',
    currentCompleted: '6,543,210.00',
    yearlyCompleted: '43,210,987.00',
    yearlyInvoice: '32,109,876.00',
    yearlyPayment: '29,876,543.00'
  },
  {
    key: 'S550',
    code: 'S550', 
    unit: '沈阳中心',
    newContract: '50,000,000.00',
    remainingContract: '45,000,000.00',
    wip: '48,000,000.00',
    receivable: '22,000,000.00',
    currentCompleted: '8,000,000.00',
    yearlyCompleted: '50,000,000.00',
    yearlyInvoice: '40,000,000.00',
    yearlyPayment: '38,000,000.00'
  },
  // ... 其他数据项
  {
    key: 'design',
    code: '',
    unit: '其中: 设计服类业务',
    newContract: '404,508,116.00',
    remainingContract: '398,497,556.00',
    wip: '159,114,604.00',
    receivable: '72,765,511.00',
    currentCompleted: '32,505,271.00',
    yearlyCompleted: '256,835,870.00',
    yearlyInvoice: '245,823,203.00',
    yearlyPayment: '249,362,938.00'
  },
  {
    key: 'epc',
    code: '',
    unit: 'EPC类业务',
    newContract: '39,724,388.00',
    remainingContract: '383,127,680.00',
    wip: '65,798,250.00',
    receivable: '57,940,632.00',
    currentCompleted: '17,061,259.00',
    yearlyCompleted: '175,953,562.00',
    yearlyInvoice: '214,914,131.00',
    yearlyPayment: '198,945,943.00'
  },
  {
    key: 'total',
    code: '',
    unit: '合计',
    newContract: '799,232,503.00',
    remainingContract: '781,625,237.00',
    wip: '224,912,853.00',
    receivable: '130,706,143.00',
    currentCompleted: '49,566,530.00',
    yearlyCompleted: '432,789,432.00',
    yearlyInvoice: '460,737,334.00',
    yearlyPayment: '448,308,881.00'
  }
]

// 拼音匹配函数
const pinyinMatch = (input: string, option?: { label: string, value: string }) => {
  if (!option) return false;
  input = input.toLowerCase();
  const label = option.label;
  
  // 中文匹配
  if (label.includes(input)) return true;
  
  // 全拼匹配
  const fullPinyin = pinyin(label, { toneType: 'none' }).toLowerCase();
  if (fullPinyin.includes(input)) return true;
  
  // 首字母匹配
  const firstLetters = pinyin(label, { pattern: 'first', toneType: 'none' }).toLowerCase();
  if (firstLetters.includes(input)) return true;
  
  return false;
}

export default function ProjectTable() {
  const [form] = Form.useForm()
  const [filteredData, setFilteredData] = useState(projectData)
  const [dataSourceWithSummary, setDataSourceWithSummary] = useState([summaryData, ...projectData])
  const [expandedSections, setExpandedSections] = useState({
    contract: false,
    invoice: false,
    payment: false
  })
  const [visibleSections, setVisibleSections] = useState({
    customer: true,
    startDate: true, 
    businessType: true,
    contractSigned: true,
    contractAmount: true,
    completedContract: true,
    invoice: true,
    payment: true,
    wip: true
  })

  // 添加统计弹窗控制状态
  const [showStatistics, setShowStatistics] = useState(false)

  // 添加展开/收起状态
  const [isFilterExpanded, setIsFilterExpanded] = useState(true)

  // 添加导入Modal状态
  const [importModalVisible, setImportModalVisible] = useState(false)

  // 添加导入处理函数
  const handleImport = (file: RcFile) => {
    // TODO: 处理Excel文件导入
    message.success('导入成功')
    setImportModalVisible(false)
    return false // 阻止自动上传
  }

  // 添加导出处理函数  
  const handleExport = () => {
    // TODO: 导出数据到Excel
    message.success('导出成功')
  }

  // 添加统计表格列定义
  const statisticsColumns = [
    {
      title: '项目执行单位编码',
      dataIndex: 'code',
      width: 120,
      onHeaderCell: () => ({
        style: { 
          backgroundColor: '#884d8f',
          color: 'white'
        }
      })
    },
    {
      title: '项目执行单位',
      dataIndex: 'unit',
      width: 150,
      onHeaderCell: () => ({
        style: { 
          backgroundColor: '#884d8f',
          color: 'white'
        }
      })
    },
    {
      title: '本年度新增合同额',
      dataIndex: 'newContract',
      align: 'right',
      width: 120,
      onHeaderCell: () => ({
        style: { 
          backgroundColor: '#884d8f',
          color: 'white'
        }
      }),
      onCell: () => ({
        style: { fontFamily: 'monospace' }
      })
    },
    {
      title: '截止报告期存量合同额',
      dataIndex: 'remainingContract', 
      align: 'right',
      width: 150,
      onHeaderCell: () => ({
        style: { 
          backgroundColor: '#884d8f',
          color: 'white'
        }
      }),
      onCell: () => ({
        style: { fontFamily: 'monospace' }
      })
    },
    {
      title: 'WIP(催开票)',
      dataIndex: 'wip',
      align: 'right',
      width: 120,
      onHeaderCell: () => ({
        style: { 
          backgroundColor: '#884d8f',
          color: 'white'
        }
      }),
      onCell: () => ({
        style: { fontFamily: 'monospace' }
      })
    },
    {
      title: '应收账款(催回款)',
      dataIndex: 'receivable',
      align: 'right',
      width: 120,
      onHeaderCell: () => ({
        style: { 
          backgroundColor: '#884d8f',
          color: 'white'
        }
      }),
      onCell: () => ({
        style: { fontFamily: 'monospace' }
      })
    },
    {
      title: '报告当期完成合同额',
      dataIndex: 'currentCompleted',
      align: 'right',
      width: 150,
      onHeaderCell: () => ({
        style: { 
          backgroundColor: '#884d8f',
          color: 'white'
        }
      }),
      onCell: () => ({
        style: { fontFamily: 'monospace' }
      })
    },
    {
      title: '本年度累计完成合同额',
      dataIndex: 'yearlyCompleted',
      align: 'right',
      width: 150,
      onHeaderCell: () => ({
        style: { 
          backgroundColor: '#884d8f',
          color: 'white'
        }
      }),
      onCell: () => ({
        style: { fontFamily: 'monospace' }
      })
    },
    {
      title: '本年度累计完成开票',
      dataIndex: 'yearlyInvoice',
      align: 'right',
      width: 150,
      onHeaderCell: () => ({
        style: { 
          backgroundColor: '#884d8f',
          color: 'white'
        }
      }),
      onCell: () => ({
        style: { fontFamily: 'monospace' }
      })
    },
    {
      title: '本年度累计完成回款',
      dataIndex: 'yearlyPayment',
      align: 'right',
      width: 150,
      onHeaderCell: () => ({
        style: { 
          backgroundColor: '#884d8f',
          color: 'white'
        }
      }),
      onCell: () => ({
        style: { fontFamily: 'monospace' }
      })
    }
  ]

  const toggleExpand = (section: 'contract' | 'invoice' | 'payment') => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }))
  }

  const toggleVisibility = (section: keyof typeof visibleSections) => {
    setVisibleSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }))
  }

  const hiddenSections = Object.keys(visibleSections).filter(section => !visibleSections[section as keyof typeof visibleSections])

  const monthlyHeaders = [
    "1月", "2月", "3月", "4月", "5月", "6月", 
    "7月", "8月", "9月", "10月", "11月", "12月"
  ]

  const getHeaders = (section: 'contract' | 'invoice' | 'payment') => {
    const baseHeaders = {
      contract: ["报告当期完��合同额", "本年度完成合同额", "项目结算完成合同额"],
      invoice: ["报告当期开票额", "本年度累计开票金额", "项目结算开票金额"],
      payment: ["报告当期回款额", "本年度累计回款金额", "项目结算回款金额"]
    }

    return expandedSections[section]
      ? [...monthlyHeaders, ...baseHeaders[section]]
      : baseHeaders[section]
  }

  const contractHeaders = getHeaders('contract')
  const invoiceHeaders = getHeaders('invoice')
  const paymentHeaders = getHeaders('payment')

  const onFinish = (values: any) => {
    let filtered = projectData.filter(item => {
      // 项目编号筛选
      if (values.projectId && !item.id.toLowerCase().includes(values.projectId.toLowerCase())) {
        return false
      }
      
      // 项目名称筛选
      if (values.projectName && !item.name.toLowerCase().includes(values.projectName.toLowerCase())) {
        return false
      }
      
      // 项目经理筛选 - 直接比较中文名称
      if (values.manager && item.manager !== values.manager) {
        return false
      }
      
      // 部门筛选
      if (values.department && item.department !== values.department) {
        return false
      }
      
      // 客户名称筛选
      if (values.customer && !item.customer.toLowerCase().includes(values.customer.toLowerCase())) {
        return false
      }
      
      // 业务类别筛选 - 修改为数组包含判断
      if (values.businessType?.length && !values.businessType.includes(item.businessType)) {
        return false
      }
      
      return true
    })

    // 重新计算汇总数据
    const newSummaryData = {
      id: '汇总',
      name: '',
      manager: '',
      department: '',
      customer: '',
      startDate: '',
      businessType: '',
      contractSigned: '',
      // 合同额相关字段汇总
      newContractAmount: formatNumber(filtered.reduce((sum, item) => sum + parseFloat(item.newContractAmount.replace(/,/g, '')), 0)),
      totalContractAmount: formatNumber(filtered.reduce((sum, item) => sum + parseFloat(item.totalContractAmount.replace(/,/g, '')), 0)),
      remainingContractAmount: formatNumber(filtered.reduce((sum, item) => sum + parseFloat(item.remainingContractAmount.replace(/,/g, '')), 0)),
      // 完成合同额相关字段汇总
      completedContract: {
        current: formatNumber(filtered.reduce((sum, item) => sum + parseFloat(item.completedContract.current.replace(/,/g, '')), 0)),
        yearly: formatNumber(filtered.reduce((sum, item) => sum + parseFloat(item.completedContract.yearly.replace(/,/g, '')), 0)),
        total: formatNumber(filtered.reduce((sum, item) => sum + parseFloat(item.completedContract.total.replace(/,/g, '')), 0)),
        months: Array(12).fill(0).map((_, index) => 
          formatNumber(filtered.reduce((sum, item) => sum + parseFloat(item.completedContract.months[index].replace(/,/g, '')), 0))
        )
      },
      // 开票相关字段汇总
      invoice: {
        current: formatNumber(filtered.reduce((sum, item) => sum + parseFloat(item.invoice.current.replace(/,/g, '')), 0)),
        yearly: formatNumber(filtered.reduce((sum, item) => sum + parseFloat(item.invoice.yearly.replace(/,/g, '')), 0)),
        total: formatNumber(filtered.reduce((sum, item) => sum + parseFloat(item.invoice.total.replace(/,/g, '')), 0)),
        months: Array(12).fill(0).map((_, index) => 
          formatNumber(filtered.reduce((sum, item) => sum + parseFloat(item.invoice.months[index].replace(/,/g, '')), 0))
        )
      },
      // 回款相关字段汇总
      payment: {
        current: formatNumber(filtered.reduce((sum, item) => sum + parseFloat(item.payment.current.replace(/,/g, '')), 0)),
        yearly: formatNumber(filtered.reduce((sum, item) => sum + parseFloat(item.payment.yearly.replace(/,/g, '')), 0)), 
        total: formatNumber(filtered.reduce((sum, item) => sum + parseFloat(item.payment.total.replace(/,/g, '')), 0)),
        months: Array(12).fill(0).map((_, index) => 
          formatNumber(filtered.reduce((sum, item) => sum + parseFloat(item.payment.months[index].replace(/,/g, '')), 0))
        )
      },
      // WIP和应收账款汇总
      receivable: formatNumber(filtered.reduce((sum, item) => sum + parseFloat(item.receivable.replace(/,/g, '')), 0)),
      wip: formatNumber(filtered.reduce((sum, item) => sum + parseFloat(item.wip.replace(/,/g, '')), 0))
    }

    setFilteredData(filtered)
    setDataSourceWithSummary([newSummaryData, ...filtered])
  }

  const onReset = () => {
    form.resetFields()
    setFilteredData(projectData)
    setDataSourceWithSummary([summaryData, ...projectData])
  }

  const getColumns = () => {
    // 通用的onCell配置
    const getCommonCellProps = (width: number) => ({
      onCell: () => ({
        style: {
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          width: width,
          maxWidth: width
        },
        onMouseEnter: (e: React.MouseEvent<HTMLTableCellElement>) => {
          const cell = e.currentTarget;
          // 检查内容是否被截断
          if (cell.scrollWidth > cell.clientWidth) {
            cell.style.whiteSpace = 'normal';
            cell.style.height = 'auto';
            cell.style.maxHeight = '200px';
            cell.style.overflow = 'visible';
            cell.style.backgroundColor = 'rgba(0,0,0,0.02)';
            cell.style.zIndex = '1';
          }
        },
        onMouseLeave: (e: React.MouseEvent<HTMLTableCellElement>) => {
          const cell = e.currentTarget;
          cell.style.whiteSpace = 'nowrap';
          cell.style.height = '';
          cell.style.maxHeight = '';
          cell.style.overflow = 'hidden';
          cell.style.backgroundColor = '';
          cell.style.zIndex = '';
        }
      })
    });

    // 基本信息列
    const basicColumns = [
      {
        title: '基本信息',
        children: [
          {
            title: '项目编号',
            dataIndex: 'id',
            width: COLUMN_WIDTHS.id,
            fixed: 'left',
            ellipsis: true,
            onHeaderCell: () => ({
              style: { backgroundColor: 'rgb(249, 250, 251)' }
            }),
            ...getCommonCellProps(COLUMN_WIDTHS.id)
          },
          {
            title: '项目名称',
            dataIndex: 'name',
            width: COLUMN_WIDTHS.name,
            fixed: 'left',
            ellipsis: true,
            onHeaderCell: () => ({
              style: { backgroundColor: 'rgb(249, 250, 251)' }
            }),
            ...getCommonCellProps(COLUMN_WIDTHS.name)
          },
          {
            title: '项目经理',
            dataIndex: 'manager',
            width: COLUMN_WIDTHS.manager,
            fixed: 'left',
            ellipsis: true,
            onHeaderCell: () => ({
              style: { backgroundColor: 'rgb(249, 250, 251)' }
            }),
            ...getCommonCellProps(COLUMN_WIDTHS.manager)
          },
          {
            title: '板块归属',
            dataIndex: 'department',
            width: COLUMN_WIDTHS.department,
            fixed: 'left',
            ellipsis: true,
            onHeaderCell: () => ({
              style: { backgroundColor: 'rgb(249, 250, 251)' }
            }),
            ...getCommonCellProps(COLUMN_WIDTHS.department)
          },
          ...(visibleSections.customer ? [{
            title: '客户名称',
            dataIndex: 'customer',
            width: COLUMN_WIDTHS.customer,
            fixed: 'left',
            ellipsis: true,
            onHeaderCell: () => ({
              style: { backgroundColor: 'rgb(249, 250, 251)' }
            }),
            ...getCommonCellProps(COLUMN_WIDTHS.customer)
          }] : []),
          ...(visibleSections.startDate ? [{
            title: '开始时间',
            dataIndex: 'startDate',
            width: COLUMN_WIDTHS.startDate,
            fixed: 'left',
            ellipsis: true,
            onHeaderCell: () => ({
              style: { backgroundColor: 'rgb(249, 250, 251)' }
            }),
            ...getCommonCellProps(COLUMN_WIDTHS.startDate)
          }] : []),
          ...(visibleSections.businessType ? [{
            title: '业务类别',
            dataIndex: 'businessType',
            width: COLUMN_WIDTHS.businessType,
            fixed: 'left',
            ellipsis: true,
            onHeaderCell: () => ({
              style: { backgroundColor: 'rgb(249, 250, 251)' }
            }),
            ...getCommonCellProps(COLUMN_WIDTHS.businessType)
          }] : []),
          ...(visibleSections.contractSigned ? [{
            title: '合同是否签署',
            dataIndex: 'contractSigned',
            width: COLUMN_WIDTHS.contractSigned,
            fixed: 'left',
            ellipsis: true,
            onHeaderCell: () => ({
              style: { backgroundColor: 'rgb(249, 250, 251)', textAlign: 'center' }
            }),
            ...getCommonCellProps(COLUMN_WIDTHS.contractSigned)
          }] : [])
        ]
      }
    ]

    // 合同额列
    const contractAmountColumns = [
      {
        title: (<div className="cursor-pointer flex items-center"> 合同额 </div>),
        onHeaderCell: () => ({
          style: { backgroundColor: 'rgb(239, 246, 255)' }
        }),
        children: [
          {
            title: '本年度新增合同额',
            dataIndex: 'newContractAmount',
            align: 'right',
            onHeaderCell: () => ({
              style: { backgroundColor: 'rgb(239, 246, 255)' }
            }),
            onCell: () => ({
              style: { fontFamily: 'monospace' }
            })
          },
          {
            title: '总合同额',
            dataIndex: 'totalContractAmount',
            align: 'right',
            onHeaderCell: () => ({
              style: { backgroundColor: 'rgb(239, 246, 255)' }
            }),
            onCell: () => ({
              style: { fontFamily: 'monospace' }
            })
          },
          {
            title: '截止报告期存量合同额',
            dataIndex: 'remainingContractAmount',
            align: 'right',
            onHeaderCell: () => ({
              style: { backgroundColor: 'rgb(239, 246, 255)' }
            }),
            onCell: () => ({
              style: { fontFamily: 'monospace' }
            })
          }
        ]
      }
    ]

    // 完成合同额列
    const getCompletedContractColumns = () => {
      const columns = [
        {
          title: (
            <Tooltip title="点击展开/收起月度数据">
              <div className="flex items-center gap-2">
                <div onClick={() => toggleExpand('contract')} className="cursor-pointer flex items-center">
                  完成合同额情况 {expandedSections.contract ? <DownOutlined className="inline" /> : <RightOutlined className="inline" />}
                </div>
              </div>
            </Tooltip>
          ),
          onHeaderCell: () => ({
            style: { backgroundColor: 'rgb(240, 253, 244)' }
          }),
          children: [
            {
              title: '报告当期完成合同额',
              dataIndex: ['completedContract', 'current'],
              align: 'right',
              onHeaderCell: () => ({
                style: { backgroundColor: 'rgb(240, 253, 244)' }
              }),
              onCell: () => ({
                style: { fontFamily: 'monospace' }
              })
            },
            {
              title: '本年度成合同额',
              dataIndex: ['completedContract', 'yearly'],
              align: 'right',
              onHeaderCell: () => ({
                style: { backgroundColor: 'rgb(240, 253, 244)' }
              }),
              onCell: () => ({
                style: { fontFamily: 'monospace' }
              })
            },
            {
              title: '项目结算完成合同额',
              dataIndex: ['completedContract', 'total'],
              align: 'right',
              onHeaderCell: () => ({
                style: { backgroundColor: 'rgb(240, 253, 244)' }
              }),
              onCell: () => ({
                style: { fontFamily: 'monospace' }
              })
            }
          ]
        }
      ]

      if (expandedSections.contract) {
        columns[0].children.unshift(
          ...monthlyHeaders.map((header, index) => ({
            title: header,
            dataIndex: ['completedContract', 'months', index.toString()],
            align: 'right',
            onHeaderCell: () => ({
              style: { backgroundColor: 'rgb(240, 253, 244)' }
            }),
            onCell: () => ({
              style: { fontFamily: 'monospace' }
            })
          }))
        )
      }

      return columns
    }

    // 开票情况列
    const getInvoiceColumns = () => {
      const columns = [
        {
          title: (
            <Tooltip title="点击展开/收起月度数据">
              <div className="flex items-center gap-2">
                <div onClick={() => toggleExpand('invoice')} className="cursor-pointer flex items-center">
                  开票情况 {expandedSections.invoice ? <DownOutlined className="inline" /> : <RightOutlined className="inline" />}
                </div>
              </div>
            </Tooltip>
          ),
          onHeaderCell: () => ({
            style: { backgroundColor: 'rgb(255, 247, 237)' } // 使用橙色背景
          }),
          children: [
            {
              title: '报告当期开票额',
              dataIndex: ['invoice', 'current'],
              align: 'right',
              onHeaderCell: () => ({
                style: { backgroundColor: 'rgb(255, 247, 237)' }
              }),
              onCell: () => ({
                style: { fontFamily: 'monospace' }
              })
            },
            {
              title: '本年度累计开票金额',
              dataIndex: ['invoice', 'yearly'],
              align: 'right',
              onHeaderCell: () => ({
                style: { backgroundColor: 'rgb(255, 247, 237)' }
              }),
              onCell: () => ({
                style: { fontFamily: 'monospace' }
              })
            },
            {
              title: '项目结算开票金额',
              dataIndex: ['invoice', 'total'],
              align: 'right',
              onHeaderCell: () => ({
                style: { backgroundColor: 'rgb(255, 247, 237)' }
              }),
              onCell: () => ({
                style: { fontFamily: 'monospace' }
              })
            }
          ]
        }
      ]

      if (expandedSections.invoice) {
        columns[0].children.unshift(
          ...monthlyHeaders.map((header, index) => ({
            title: header,
            dataIndex: ['invoice', 'months', index.toString()],
            align: 'right',
            onHeaderCell: () => ({
              style: { backgroundColor: 'rgb(255, 247, 237)' }
            }),
            onCell: () => ({
              style: { fontFamily: 'monospace' }
            })
          }))
        )
      }

      return columns
    }

    // 回款情况列
    const getPaymentColumns = () => {
      const columns = [
        {
          title: (
            <Tooltip title="点击展开/收起月度数据">
              <div className="flex items-center gap-2">
                <div onClick={() => toggleExpand('payment')} className="cursor-pointer flex items-center">
                  回款情况 {expandedSections.payment ? <DownOutlined className="inline" /> : <RightOutlined className="inline" />}
                </div>
              </div>
            </Tooltip>
          ),
          onHeaderCell: () => ({
            style: { backgroundColor: 'rgb(237, 247, 255)' } // 使用浅蓝色背景
          }),
          children: [
            {
              title: '报告当期回款额',
              dataIndex: ['payment', 'current'],
              align: 'right',
              onHeaderCell: () => ({
                style: { backgroundColor: 'rgb(237, 247, 255)' }
              }),
              onCell: () => ({
                style: { fontFamily: 'monospace' }
              })
            },
            {
              title: '本年度累计回款金额',
              dataIndex: ['payment', 'yearly'],
              align: 'right',
              onHeaderCell: () => ({
                style: { backgroundColor: 'rgb(237, 247, 255)' }
              }),
              onCell: () => ({
                style: { fontFamily: 'monospace' }
              })
            },
            {
              title: '项目结算回款金额',
              dataIndex: ['payment', 'total'],
              align: 'right',
              onHeaderCell: () => ({
                style: { backgroundColor: 'rgb(237, 247, 255)' }
              }),
              onCell: () => ({
                style: { fontFamily: 'monospace' }
              })
            }
          ]
        }
      ]

      if (expandedSections.payment) {
        columns[0].children.unshift(
          ...monthlyHeaders.map((header, index) => ({
            title: header,
            dataIndex: ['payment', 'months', index.toString()],
            align: 'right',
            onHeaderCell: () => ({
              style: { backgroundColor: 'rgb(237, 247, 255)' }
            }),
            onCell: () => ({
              style: { fontFamily: 'monospace' }
            })
          }))
        )
      }

      return columns
    }

    // WIP及应收账款列
    const wipColumns = [
      {
        title: (<div className="cursor-pointer flex items-center"> WIP及应收账款情况 </div>),
        onHeaderCell: () => ({
          style: { backgroundColor: 'rgb(254, 242, 242)' }
        }),
        children: [
          {
            title: '应收账款（催收）',
            dataIndex: 'receivable',
            align: 'right',
            onHeaderCell: () => ({
              style: { backgroundColor: 'rgb(254, 242, 242)' }
            }),
            onCell: () => ({
              style: { fontFamily: 'monospace' }
            })
          },
          {
            title: 'WIP（催开票）',
            dataIndex: 'wip',
            align: 'right',
            onHeaderCell: () => ({
              style: { backgroundColor: 'rgb(254, 242, 242)' }
            }),
            onCell: () => ({
              style: { fontFamily: 'monospace' }
            })
          }
        ]
      }
    ]

    return [
      ...basicColumns,
      ...(visibleSections.contractAmount ? contractAmountColumns : []),
      ...(visibleSections.completedContract ? getCompletedContractColumns() : []),
      ...(visibleSections.invoice ? getInvoiceColumns() : []),
      ...(visibleSections.payment ? getPaymentColumns() : []),
      ...(visibleSections.wip ? wipColumns : [])
    ]
  }

  // 添加检查是否全部显示/隐藏的辅助函数
  const isAllVisible = Object.values(visibleSections).every(value => value)
  const isAllHidden = Object.values(visibleSections).every(value => !value)

  // 添加处理全部显示/隐藏的函数
  const toggleAll = () => {
    const newValue = !isAllVisible
    setVisibleSections(Object.keys(visibleSections).reduce((acc, key) => ({
      ...acc,
      [key]: newValue
    }), {} as typeof visibleSections))
  }

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
        {/* 添加左侧固定菜单 */}
        <div className="fixed left-0 top-0 h-screen w-16 bg-gray-800 p-2 flex flex-col items-center z-10">
          {/* 公司logo */}
          <div className="mb-8 mt-4 w-12 h-12 bg-white rounded-full flex items-center justify-center">
            <span className="text-gray-800 text-2xl font-bold">W</span>
          </div>
          
          {/* 菜单按钮 */}
          <div className="flex-1 flex flex-col mt-8 space-y-8">
            <Link href="/dashboard">
              <button className="w-6 h-6 text-gray-400 hover:bg-gray-700 rounded-lg flex items-center justify-center">
                <DashboardOutlined className="w-6 h-6" />
              </button>
            </Link>
            <button className="w-6 h-6 text-white hover:bg-gray-700 rounded-lg flex items-center justify-center">
              <BarChartOutlined className="w-6 h-6" />
            </button>
            <button className="w-6 h-6 text-gray-400 hover:bg-gray-700 rounded-lg flex items-center justify-center">
              <SettingOutlined className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* 主内容区域 */}
        <div className="ml-16 pb-4 space-y-4 bg-[#f8faff] w-[calc(100%-4rem)] min-h-screen">
          {/* 固定顶部白条 */}
          <div className="fixed top-0 left-16 right-0 h-20 bg-white shadow-sm z-20">
            <h2 className="pt-6 pl-6 text-2xl">运营看板 - 项目执行跟踪详细数据</h2>
          </div>

          {/* 原有内容,添加上边距 */}
          <div className="pt-20 ">
            <div className="mx-4">
              {/* 添加查看统计按钮 */}
              <div className="mb-4 flex justify-between items-center">
                <Button
                  type="text"
                  onClick={() => window.history.back()}
                  icon={<ArrowLeftOutlined className="text-[#007069]" />}
                  className="flex items-center gap-2 text-[#007069]"
                >
                  返回
                </Button>

                <div className="flex gap-2">
                  <Button 
                    type="primary"
                    className="bg-[#007069] text-white"
                    onClick={() => setImportModalVisible(true)}
                  >
                    导入
                  </Button>

                  <Button 
                    type="primary"
                    className="bg-[#007069] text-white"
                    onClick={handleExport}
                  >
                    导出
                  </Button>

                  <Button 
                    type="primary"
                    onClick={() => setShowStatistics(true)}
                    className="bg-[#007069]"
                  >
                    查看统计
                  </Button>
                </div>
              </div>

              {/* 修改统计弹窗 */}
              <Modal
                title="追踪表数据统计"
                open={showStatistics}
                onCancel={() => setShowStatistics(false)}
                width={1900}
                footer={null}
              >
                <Table
                  columns={statisticsColumns}
                  dataSource={statisticsData}
                  pagination={false}
                  bordered
                  size="small"
                  scroll={{ x: 'max-content' }}
                  onRow={(record) => ({
                    style: {
                      backgroundColor: 
                        record.key === 'design' ? 'rgb(209, 250, 229)' :
                        record.key === 'epc' ? 'rgb(209, 250, 229)' :
                        record.key === 'total' ? 'rgb(209, 250, 229)' :
                        undefined,
                      fontWeight:
                        ['design', 'epc', 'total'].includes(record.key) ? 'bold' : undefined
                    }
                  })}
                />
              </Modal>

              {/* 筛选区域 */}
              <div className="border rounded-lg p-2 mb-6 bg-white">
                <Form
                  form={form}
                  onFinish={onFinish}
                  layout="vertical"
                  size="middle"
                >
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-2 px-2">
                    {/* 第一行基础筛选项 */}
                    <Form.Item name="projectId" label="项目编号" className="mb-1">
                      <Input placeholder="请输入项目编号" allowClear />
                    </Form.Item>
                    
                    <Form.Item name="projectName" label="项目名称" className="mb-1">
                      <Input placeholder="请输入项目名称" allowClear />
                    </Form.Item>

                    <Form.Item name="manager" label="项目经理" className="mb-1">
                      <Select
                        showSearch
                        placeholder="请选择项目经理"
                        options={managerOptions}
                        allowClear
                        filterOption={pinyinMatch}
                      />
                    </Form.Item>

                    {/* 按钮组 */}
                    <div className="flex items-end justify-end gap-2 pb-[2px]"> {/* 添加 pb-[2px] 以对齐表单项底部 */}
                      <Button
                        onClick={() => setIsFilterExpanded(!isFilterExpanded)}
                        className="flex items-center"
                      >
                        {isFilterExpanded ? "收起" : "展开"}
                        {isFilterExpanded ? <UpOutlined className="ml-1" /> : <DownOutlined className="ml-1" />}
                      </Button>
                      <Button 
                        type="primary" 
                        htmlType="submit" 
                        className="w-20 hover:bg-[#005c56] transition-colors"
                      >
                        查询
                      </Button>   
                      <Button onClick={onReset}>重置</Button>
                    </div>

                    {/* 高级筛选项 */}
                    <div className={`grid grid-cols-1 md:grid-cols-4 col-span-4 gap-2 transition-all duration-300 overflow-hidden ${
                      isFilterExpanded ? 'max-h-72 opacity-100' : 'max-h-0 opacity-0'
                    }`}>
                      <Form.Item name="department" label="板块归属" className="mb-1">
                        <Select
                          showSearch
                          placeholder="请选择部门"
                          options={departmentOptions}
                          allowClear
                          filterOption={pinyinMatch}
                        />
                      </Form.Item>

                      <Form.Item name="customer" label="客户名称" className="mb-1">
                        <Input placeholder="请输入客户名称" allowClear />
                      </Form.Item>

                      <Form.Item name="businessType" label="业务类别" className="mb-1">
                        <Select
                          mode="multiple"
                          showSearch
                          placeholder="请选择业务类别(可多选)"
                          options={businessTypeOptions}
                          allowClear
                          filterOption={pinyinMatch}
                          maxTagCount={2}
                        />
                      </Form.Item>
                    </div>
                  </div>
                </Form>
              </div>

              {/* 列显示控制区域 */}
              <div className="relative">
                {/* 列显示控制区域 */}
                <div className="mb-2 p-2 bg-gray-100 border flex items-center gap-2">
                  <span className="text-gray-600 font-medium">显示/隐藏列:</span>
                  <Button
                    size="small"
                    onClick={toggleAll}
                    className={`
                      transition-colors flex items-center gap-1.5
                      ${isAllVisible
                        ? 'bg-green-100 text-green-700 hover:bg-green-200 border-green-200'
                        : 'bg-red-100 text-red-700 hover:bg-red-200 border-red-200'}
                    `}
                  >
                    {isAllVisible
                      ? <EyeInvisibleOutlined className="text-green-700" />
                      : <EyeOutlined className="text-red-700" />
                    }
                    全部{isAllVisible ? '隐藏' : '显示'}
                  </Button>
                  <div className="h-5 border-l border-gray-300 mx-2"></div>
                  {Object.entries({
                    customer: '客户名称',
                    startDate: '开始时间',
                    businessType: '业务类别',
                    contractSigned: '合同是否签署',
                    contractAmount: '合同额',
                    completedContract: '完成合同额情况',
                    invoice: '开票情况',
                    payment: '回款情况',
                    wip: 'WIP及应收账款情况'
                  }).map(([key, label]) => (
                    <Button
                      key={key}
                      size="small"
                      onClick={() => toggleVisibility(key as keyof typeof visibleSections)}
                      className={`
                        transition-colors flex items-center gap-1.5
                        ${visibleSections[key as keyof typeof visibleSections] 
                          ? 'bg-blue-100 text-blue-700 hover:bg-blue-200 border-blue-200' 
                          : 'hover:bg-gray-100'}
                      `}
                    >
                      {visibleSections[key as keyof typeof visibleSections] 
                        ? <EyeOutlined className="text-blue-700" />
                        : <EyeInvisibleOutlined className="text-gray-500" />
                      }
                      {label}
                    </Button>
                  ))}
                </div>

                <Table
                  columns={getColumns()}
                  dataSource={dataSourceWithSummary}
                  bordered
                  size="small"
                  scroll={{ x: 'max-content' }}
                  pagination={false}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 添加导入Modal */}
      <Modal
        title="导入数据"
        open={importModalVisible}
        onCancel={() => setImportModalVisible(false)}
        footer={null}
      >
        <Upload.Dragger
          accept=".xlsx,.xls"
          beforeUpload={handleImport}
          showUploadList={false}
        >
          <p className="ant-upload-drag-icon">
            <InboxOutlined />
          </p>
          <p className="ant-upload-text">点击或拖拽文件到此区域上传</p>
          <p className="ant-upload-hint">
            支持.xlsx或.xls格式的Excel文件
          </p>
        </Upload.Dragger>
      </Modal>
    </ConfigProvider>
  )
}

