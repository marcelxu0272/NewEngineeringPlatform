"use client"

import React, { useState } from 'react'
import { Table, Checkbox } from 'antd'
import { ChevronDown, ChevronRight } from 'lucide-react'
import { Form, Input, Select, DatePicker, Button } from 'antd'
import type { CheckboxOptionType } from 'antd/es/checkbox';
import type { ColumnType } from 'antd/es/table';

// 添加模拟数据
const projectData = [
  {
    id: "B24206-0000",
    name: "关于山西省住建关于山西省住建关于山西省住建",
    manager: "王明",
    department: "技术部",
    customer: "山西省住建局",
    startDate: "2024-01-01",
    businessType: "软件开发",
    contractSigned: true,
    newContractAmount: "50,000.00",
    totalContractAmount: "",
    remainingContractAmount: "50,000",
    completedContract: {
      current: "288,000.00",
      yearly: "",
      total: "",
      months: ["24,000.00", "24,000.00", "24,000.00", "24,000.00", "24,000.00", "24,000.00", 
               "24,000.00", "24,000.00", "24,000.00", "24,000.00", "24,000.00", "24,000.00"]
    },
    invoice: {
      current: "",
      yearly: "288,000.00",
      total: "131,624.00",
      months: ["24,000.00", "24,000.00", "24,000.00", "24,000.00", "24,000.00", "24,000.00",
               "24,000.00", "24,000.00", "24,000.00", "24,000.00", "24,000.00", "24,000.00"]
    },
    payment: {
      current: "301,160.00",
      yearly: "301,160.00",
      total: "",
      months: ["25,096.67", "25,096.67", "25,096.67", "25,096.67", "25,096.67", "25,096.67",
               "25,096.67", "25,096.67", "25,096.67", "25,096.67", "25,096.67", "25,096.67"]
    },
    receivable: "169,536.00",
    wip: "131,624.00"
  },
  {
    id: "B24207",
    name: "智慧城市项目",
    manager: "李红",
    department: "销售部",
    customer: "城市规划局",
    startDate: "2024-02-15",
    businessType: "系统集成",
    contractSigned: true,
    newContractAmount: "100,000.00",
    totalContractAmount: "500,000.00",
    remainingContractAmount: "400,000",
    completedContract: {
      current: "150,000.00",
      yearly: "300,000.00",
      total: "300,000.00",
      months: ["12,500.00", "12,500.00", "12,500.00", "12,500.00", "12,500.00", "12,500.00", 
               "12,500.00", "12,500.00", "12,500.00", "12,500.00", "12,500.00", "12,500.00"]
    },
    invoice: {
      current: "100,000.00",
      yearly: "250,000.00",
      total: "250,000.00",
      months: ["10,000.00", "10,000.00", "10,000.00", "10,000.00", "10,000.00", "10,000.00",
               "10,000.00", "10,000.00", "10,000.00", "10,000.00", "10,000.00", "10,000.00"]
    },
    payment: {
      current: "80,000.00",
      yearly: "200,000.00",
      total: "200,000.00",
      months: ["6,666.67", "6,666.67", "6,666.67", "6,666.67", "6,666.67", "6,666.67",
               "6,666.67", "6,666.67", "6,666.67", "6,666.67", "6,666.67", "6,666.67"]
    },
    receivable: "50,000.00",
    wip: "50,000.00"
  },
  // 可以继续添加更多项目数据...
]

// 添加模拟选项数据
const managerOptions = [
  { label: '张三', value: 'zhangsan' },
  { label: '李四', value: 'lisi' },
]

const departmentOptions = [
  { label: '技术部', value: 'tech' },
  { label: '销售部', value: 'sales' },
]

const businessTypeOptions = [
  { label: '软件开发', value: 'software' },
  { label: '系统集成', value: 'system' },
]

// 添加列宽度配置
const COLUMN_WIDTHS = {
  id: 100,
  name: 200,
  manager: 100,
  department: 100,
  customer: 150,
  startDate: 120,
  businessType: 120,
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

export default function ProjectTable() {
  const [form] = Form.useForm()
  const [expandedSections, setExpandedSections] = useState({
    contract: false,
    invoice: false,
    payment: false
  })
  const [columnVisibility, setColumnVisibility] = useState({
    basicInfo: true,
    contractAmount: true,
    completedContract: true,
    invoice: true,
    payment: true,
    wip: true
  })

  const toggleExpand = (section: 'contract' | 'invoice' | 'payment') => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }))
  }

  const monthlyHeaders = [
    "1月", "2月", "3月", "4月", "5月", "6月", 
    "7月", "8月", "9月", "10月", "11月", "12月"
  ]

  const getHeaders = (section: 'contract' | 'invoice' | 'payment') => {
    const baseHeaders = {
      contract: ["报告当期完成合同额", "本年度完成合同额", "项目结算完成合同额"],
      invoice: ["报告当期开票额", "本年度累计开票金额", "项目结算开票金额"],
      payment: ["报告当期回款额", "年度累计回款金额", "项目结算回款金额"]
    }

    return expandedSections[section]
      ? [...monthlyHeaders, ...baseHeaders[section]]
      : baseHeaders[section]
  }

  const contractHeaders = getHeaders('contract')
  const invoiceHeaders = getHeaders('invoice')
  const paymentHeaders = getHeaders('payment')

  const onFinish = (values: any) => {
    console.log('搜索条件:', values)
    // TODO: 实现筛选逻辑
  }

  const onReset = () => {
    form.resetFields()
  }

  const getColumns = () => {
    // 基本信息列
    const basicColumns = [
      {
        title: '基本信息',
        children: [
          {
            title: '项目编号',
            dataIndex: 'id',
            width: 100,
            fixed: 'left',
            onHeaderCell: () => ({
              style: { backgroundColor: 'rgb(249, 250, 251)' }
            })
          },
          {
            title: '项目名称',
            dataIndex: 'name',
            width: COLUMN_WIDTHS.name,
            fixed: 'left',
            onHeaderCell: () => ({
              style: { backgroundColor: 'rgb(249, 250, 251)' }
            })
          },
          {
            title: '项目经理',
            dataIndex: 'manager',
            width: 100,
            fixed: 'left',
            onHeaderCell: () => ({
              style: { backgroundColor: 'rgb(249, 250, 251)' }
            })
          },
          {
            title: '部门归属',
            dataIndex: 'department',
            width: 100,
            fixed: 'left',
            onHeaderCell: () => ({
              style: { backgroundColor: 'rgb(249, 250, 251)' }
            })
          },
          {
            title: '客户名称',
            dataIndex: 'customer',
            width: 100,
            fixed: 'left',
            onHeaderCell: () => ({
              style: { backgroundColor: 'rgb(249, 250, 251)' }
            })
          },
          {
            title: '开始时间',
            dataIndex: 'startDate',
            width: 100,
            fixed: 'left',
            onHeaderCell: () => ({
              style: { backgroundColor: 'rgb(249, 250, 251)' }
            })
          },
          {
            title: '业务类别',
            dataIndex: 'businessType',
            width: 80,
            fixed: 'left',
            onHeaderCell: () => ({
              style: { backgroundColor: 'rgb(249, 250, 251)' }
            })
          },
          {
            title: '合同是否签署',
            dataIndex: 'contractSigned',
            width: 80,
            fixed: 'left',
            onHeaderCell: () => ({
              style: { backgroundColor: 'rgb(249, 250, 251)', textAlign: 'center' }
            })
          }
        ]
      }
    ]

    // 合同额列
    const contractAmountColumns = [
      {
        title: '合同额',
        onHeaderCell: () => ({
          style: { backgroundColor: 'rgb(239, 246, 255)' }
        }),
        children: [
          {
            title: '本年度新增合同额',
            dataIndex: 'newContractAmount',
            onHeaderCell: () => ({
              style: { backgroundColor: 'rgb(239, 246, 255)' }
            })
          },
          {
            title: '总合同额',
            dataIndex: 'totalContractAmount',
            onHeaderCell: () => ({
              style: { backgroundColor: 'rgb(239, 246, 255)' }
            })
          },
          {
            title: '截止报告期存量合同额',
            dataIndex: 'remainingContractAmount',
            onHeaderCell: () => ({
              style: { backgroundColor: 'rgb(239, 246, 255)' }
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
            <div onClick={() => toggleExpand('contract')} className="cursor-pointer">
              完成合同额情况 {expandedSections.contract ? <ChevronDown className="inline" /> : <ChevronRight className="inline" />}
            </div>
          ),
          onHeaderCell: () => ({
            style: { backgroundColor: 'rgb(240, 253, 244)' }
          }),
          children: [
            {
              title: '报告当期完成合同额',
              dataIndex: ['completedContract', 'current'],
              onHeaderCell: () => ({
                style: { backgroundColor: 'rgb(240, 253, 244)' }
              })
            },
            {
              title: '本年度完成合同额',
              dataIndex: ['completedContract', 'yearly'],
              onHeaderCell: () => ({
                style: { backgroundColor: 'rgb(240, 253, 244)' }
              })
            },
            {
              title: '项目结算完成合同额',
              dataIndex: ['completedContract', 'total'],
              onHeaderCell: () => ({
                style: { backgroundColor: 'rgb(240, 253, 244)' }
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
            onHeaderCell: () => ({
              style: { backgroundColor: 'rgb(240, 253, 244)' }
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
            <div onClick={() => toggleExpand('invoice')} className="cursor-pointer">
              开票情况 {expandedSections.invoice ? <ChevronDown className="inline" /> : <ChevronRight className="inline" />}
            </div>
          ),
          onHeaderCell: () => ({
            style: { backgroundColor: 'rgb(255, 247, 237)' } // 使用橙色背景
          }),
          children: [
            {
              title: '报告当期开票额',
              dataIndex: ['invoice', 'current'],
              onHeaderCell: () => ({
                style: { backgroundColor: 'rgb(255, 247, 237)' }
              })
            },
            {
              title: '本年度累计开票金额',
              dataIndex: ['invoice', 'yearly'],
              onHeaderCell: () => ({
                style: { backgroundColor: 'rgb(255, 247, 237)' }
              })
            },
            {
              title: '项目结算开票金额',
              dataIndex: ['invoice', 'total'],
              onHeaderCell: () => ({
                style: { backgroundColor: 'rgb(255, 247, 237)' }
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
            onHeaderCell: () => ({
              style: { backgroundColor: 'rgb(255, 247, 237)' }
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
            <div onClick={() => toggleExpand('payment')} className="cursor-pointer">
              回款情况 {expandedSections.payment ? <ChevronDown className="inline" /> : <ChevronRight className="inline" />}
            </div>
          ),
          onHeaderCell: () => ({
            style: { backgroundColor: 'rgb(237, 247, 255)' } // 使用浅蓝色背景
          }),
          children: [
            {
              title: '报告当期回款额',
              dataIndex: ['payment', 'current'],
              onHeaderCell: () => ({
                style: { backgroundColor: 'rgb(237, 247, 255)' }
              })
            },
            {
              title: '本年度累计回款金额',
              dataIndex: ['payment', 'yearly'],
              onHeaderCell: () => ({
                style: { backgroundColor: 'rgb(237, 247, 255)' }
              })
            },
            {
              title: '项目结算回款金额',
              dataIndex: ['payment', 'total'],
              onHeaderCell: () => ({
                style: { backgroundColor: 'rgb(237, 247, 255)' }
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
            onHeaderCell: () => ({
              style: { backgroundColor: 'rgb(237, 247, 255)' }
            })
          }))
        )
      }

      return columns
    }

    // WIP及应收账款列
    const wipColumns = [
      {
        title: 'WIP及应收账款情况',
        onHeaderCell: () => ({
          style: { backgroundColor: 'rgb(254, 242, 242)' }
        }),
        children: [
          {
            title: '应收账款（催收）',
            dataIndex: 'receivable',
            onHeaderCell: () => ({
              style: { backgroundColor: 'rgb(254, 242, 242)' }
            })
          },
          {
            title: 'WIP（催开票）',
            dataIndex: 'wip',
            onHeaderCell: () => ({
              style: { backgroundColor: 'rgb(254, 242, 242)' }
            })
          }
        ]
      }
    ]

    // 添加列选择选项
    const columnOptions = [
      { label: '基本信息', value: 'basicInfo' },
      { label: '合同额', value: 'contractAmount' },
      { label: '完成合同额情况', value: 'completedContract' },
      { label: '开票情况', value: 'invoice' },
      { label: '回款情况', value: 'payment' },
      { label: 'WIP及应收账款', value: 'wip' }
    ]

    // 添加列选择处理函数
    const handleColumnVisibilityChange = (checkedValues: string[]) => {
      const newVisibility = {} as typeof columnVisibility
      Object.keys(columnVisibility).forEach(key => {
        newVisibility[key as keyof typeof columnVisibility] = checkedValues.includes(key)
      })
      setColumnVisibility(newVisibility)
    }

    const columns = []
    if (columnVisibility.basicInfo) columns.push(...basicColumns)
    if (columnVisibility.contractAmount) columns.push(...contractAmountColumns)
    if (columnVisibility.completedContract) columns.push(...getCompletedContractColumns())
    if (columnVisibility.invoice) columns.push(...getInvoiceColumns())
    if (columnVisibility.payment) columns.push(...getPaymentColumns())
    if (columnVisibility.wip) columns.push(...wipColumns)

    return [
      ...columns,
      <div className="mb-4">
        <Checkbox.Group
          options={columnOptions as CheckboxOptionType[]}
          value={Object.entries(columnVisibility)
            .filter(([_, visible]) => visible)
            .map(([key]) => key) as string[]}
          onChange={handleColumnVisibilityChange}
        />
      </div>
    ]
  }

  return (
    <div className="p-4 bg-white rounded-lg shadow-lg">
      {/* 筛选区域 */}
      <div className="border rounded-md p-4">
        <Form
          form={form}
          onFinish={onFinish}
          layout="vertical"
          size="middle"
          className="grid grid-cols-1 md:grid-cols-4 gap-2"
        >
          <Form.Item name="projectId" label="项目编号">
            <Input placeholder="请输入项目编号" />
          </Form.Item>
          
          <Form.Item name="projectName" label="项目名称">
            <Input placeholder="请输入项目名称" />
          </Form.Item>

          <Form.Item name="manager" label="项目经理">
            <Select
              placeholder="请选择项目经理"
              options={managerOptions}
            />
          </Form.Item>

          <Form.Item name="department" label="部门归属">
            <Select
              placeholder="请选择部门"
              options={departmentOptions}
            />
          </Form.Item>

          <Form.Item name="customer" label="客户名称">
            <Input placeholder="请输入客户名称" />
          </Form.Item>

          <Form.Item name="startDate" label="开始时间">
            <DatePicker className="w-full" placeholder="请选择开始时间" />
          </Form.Item>

          <Form.Item name="businessType" label="业务类别">
            <Select
              placeholder="请选择业务类别"
              options={businessTypeOptions}
            />
          </Form.Item>

          <Form.Item className="flex justify-end md:col-span-4">
            <Button type="primary" htmlType="submit" className="mr-2">
              搜索
            </Button>
            <Button onClick={onReset}>重置</Button>
          </Form.Item>
        </Form>
      </div>

      <div className="relative overflow-x-auto pt-4">
        <Table
          columns={getColumns() as ColumnType<typeof projectData[0]>[]}
          dataSource={projectData}
          bordered
          size="small"
          scroll={{ x: 'max-content' }}
          pagination={false}
        />
      </div>
    </div>
  )
}

