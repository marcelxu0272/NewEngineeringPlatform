'use client';

import { Layout, Row, Col, Card, Radio, Button, Space, Typography, Table, Progress, Tooltip, ConfigProvider } from 'antd';
import { DownloadOutlined, ArrowUpOutlined, ArrowDownOutlined } from '@ant-design/icons';
import * as echarts from 'echarts';
import { useEffect, useRef } from 'react';
import { debounce } from 'lodash';
// 引入中国地图数据
import chinaJson from 'lib/china.json';

const { Content } = Layout;
const { Text } = Typography;

// 添加类型定义
interface Project {
  client: string;
  amount: number;
}

// 添加模拟数据或从API获取
const top20ProjectsData: Project[] = [
  { client: "客户A公司", amount: 5000 },
  { client: "客户B集团", amount: 4500 },
  { client: "客户C企业", amount: 4000 },
  // ... 更多数据
];

const formatNumber = (num: number) => num.toLocaleString('zh-CN', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2
});

// 添加类型定义
interface MetricInfo {
  totalAmount: string;
  currentMonthAmount: string;
  monthlyChange: string;
  yearlyTarget: string;
  completionRate: string;
}

export default function MarketingDashboard() {
  const chartRef = useRef<HTMLDivElement>(null);
  const pieChart1Ref = useRef<HTMLDivElement>(null);
  const pieChart2Ref = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<echarts.ECharts>();
  const pieChart1Instance = useRef<echarts.ECharts>();
  const pieChart2Instance = useRef<echarts.ECharts>();
  const monthlyChartRef = useRef<HTMLDivElement>(null);
  const monthlyChartInstance = useRef<echarts.ECharts>();
  const scatterChartRef = useRef<HTMLDivElement>(null);
  const scatterChartInstance = useRef<echarts.ECharts>();
  const waterfallChartRef = useRef<HTMLDivElement>(null);
  const waterfallChartInstance = useRef<echarts.ECharts>();

  const resizeHandler = () => {
    chartInstance.current?.resize();
    pieChart1Instance.current?.resize();
    pieChart2Instance.current?.resize();
    monthlyChartInstance.current?.resize();
    scatterChartInstance.current?.resize();
    waterfallChartInstance.current?.resize();
  };

  useEffect(() => {
    if (!chartRef.current) return;
    
    console.log('地图数据:', chinaJson);
    // 注册地图
    echarts.registerMap('china', chinaJson);
    
    // 初始化图表
    chartInstance.current = echarts.init(chartRef.current);
    
    const option = {
      tooltip: {
        trigger: 'item',
        formatter: '{b}<br/>数据：{c}'
      },
      visualMap: {
        min: 0,
        max: 100,
        text: ['高', '低'],
        realtime: false,
        calculable: true,
        inRange: {
          color: ['#FFFFFF', '#007069']
        }
      },
      series: [{
        name: '区域数据',
        type: 'map',
        map: 'china',
        roam: false,
        aspectScale: 1,
        zoom: 1.5,
        center: [104, 35],
        layoutCenter: ['50%', '50%'],
        layoutSize: '100%',
        selectedMode: 'single',
        label: {
          show: false,
          fontSize: 8
        },
        emphasis: {
          label: {
            show: true
          }
        },
        data: [
          { name: '北京市', value: 98 },
          { name: '上海市', value: 86 },
          { name: '广东省', value: 79 },
          { name: '江苏省', value: 70 },
          { name: '浙江省', value: 65 },
          { name: '山东省', value: 60 },
          { name: '河南省', value: 55 },
          { name: '河北省', value: 50 },
          { name: '陕西省', value: 45 },
          { name: '湖北省', value: 40 },
          { name: '湖南省', value: 35 },
          { name: '安徽省', value: 30 },
          { name: '江西省', value: 25 },
          { name: '福建省', value: 20 },
          { name: '广东省', value: 15 },
          { name: '广西壮族自治区', value: 10 },
          { name: '海南省', value: 5 },
          { name: '重庆市', value: 2 },
          { name: '四川省', value: 1 },
          { name: '新疆维吾尔自治区', value: 1 },
          { name: '西藏自治区', value: 1 },
          { name: '宁夏回族自治区', value: 1 },
          { name: '青海省', value: 1 },
          { name: '香港特别行政区', value: 1 },
          { name: '澳门特别行政区', value: 1 },
          { name: '台湾省', value: 1 },
          { name: '云南省', value: 1 },
          { name: '黑龙江省', value: 1 },
          { name: '吉林省', value: 1 },
          { name: '辽宁省', value: 1 },
          { name: '内蒙古自治区', value: 1 }
        ]
      }]
    };

    chartInstance.current.setOption(option);
    
    // 初始化饼图1
    if (pieChart1Ref.current) {
      pieChart1Instance.current = echarts.init(pieChart1Ref.current);
      const pieOption1 = {
        title: {
          show: false
        },
        tooltip: {
          trigger: 'item',
          formatter: '{b}: {c} ({d}%)'
        },
        legend: {
          orient: 'horizontal',
          bottom: '5%',
          left: 'center',
          show: false
        },
        series: [
          {
            name: '销售占比',
            type: 'pie',
            radius: ['30%', '60%'],
            center: ['50%', '50%'],
            data: [
              { value: 35, name: '华东', itemStyle: { color: '#007069' } },
              { value: 30, name: '华北', itemStyle: { color: '#3c928d' } },
              { value: 20, name: '华南', itemStyle: { color: '#6faeab' } },
              { value: 10, name: '西部', itemStyle: { color: '#95c3c1' } },
              { value: 5, name: '其他', itemStyle: { color: '#cae1e0' } }
            ],
            label: {
              show: true,
              formatter: '{b}\n{d}%',
              position: 'outside'
            },
            emphasis: {
              label: {
                show: true,
                fontSize: '14',
                fontWeight: 'bold'
              },
              itemStyle: {
                shadowBlur: 10,
                shadowOffsetX: 0,
                shadowColor: 'rgba(0, 0, 0, 0.5)'
              }
            },
            itemStyle: {
              borderRadius: 4
            },
            animationType: 'scale',
            animationEasing: 'elasticOut',
            animationDelay: function (idx) {
              return Math.random() * 200;
            }
          }
        ]
      };
      pieChart1Instance.current.setOption(pieOption1);
    }

    // 初始化饼图2
    if (pieChart2Ref.current) {
      pieChart2Instance.current = echarts.init(pieChart2Ref.current);
      const pieOption2 = {
        title: {
          show: false
        },
        tooltip: {
          trigger: 'item',
          formatter: '{b}: {c} ({d}%)'
        },
        legend: {
          orient: 'horizontal',
          bottom: '5%',
          left: 'center',
          show: false
        },
        series: [
          {
            name: '业务分布',
            type: 'pie',
            radius: ['30%', '60%'],
            center: ['50%', '50%'],
            data: [
              { value: 40, name: '新能源', itemStyle: { color: '#007069' } },
              { value: 25, name: '传统能源', itemStyle: { color: '#3c928d' } },
              { value: 20, name: '工业制造', itemStyle: { color: '#6faeab' } },
              { value: 15, name: '其他', itemStyle: { color: '#95c3c1' } }
            ],
            label: {
              show: true,
              formatter: '{b}\n{d}%',
              position: 'outside'
            },
            emphasis: {
              label: {
                show: true,
                fontSize: '14',
                fontWeight: 'bold'
              },
              itemStyle: {
                shadowBlur: 10,
                shadowOffsetX: 0,
                shadowColor: 'rgba(0, 0, 0, 0.5)'
              }
            },
            itemStyle: {
              borderRadius: 4
            },
            animationType: 'scale',
            animationEasing: 'elasticOut',
            animationDelay: function (idx) {
              return Math.random() * 200;
            }
          }
        ]
      };
      pieChart2Instance.current.setOption(pieOption2);
    }

    // 初始化月度图表
    if (monthlyChartRef.current) {
      monthlyChartInstance.current = echarts.init(monthlyChartRef.current);
      
      // 月度数据
      const monthlyData = [
        5333.33, 6444.44, 8555.55, 7666.66, 9777.77, 12888.88,
        11999.99, 10111.11, 13222.22, 15333.33, 14444.44, 16555.55
      ];
      
      // 计算累计值
      const accumulatedData = monthlyData.reduce((acc, curr) => {
        if (acc.length === 0) return [curr];
        return [...acc, acc[acc.length - 1] + curr];
      }, [] as number[]);

      const monthlyOption = {
        tooltip: {
          trigger: 'axis',
          axisPointer: {
            type: 'cross',
            crossStyle: {
              color: '#999'
            }
          }
        },
        legend: {
          data: ['当月新签合同额', '累计新签合同额'],
          bottom: '0%'
        },
        grid: {
          top: '15%',
          right: '5%', 
          bottom: '10%',
          left: '5%',
          containLabel: true
        },
        xAxis: {
          type: 'category',
          data: Array.from({length: 12}, (_, i) => `${i + 1}月`),
          axisPointer: {
            type: 'shadow'
          }
        },
        yAxis: [
          {
            type: 'value',
            name: '当月金额（万）',
            min: 0,
            axisLabel: {
              formatter: '{value}'
            },
            splitLine: { show: false }
          },
          {
            type: 'value',
            name: '累计金额（万）',
            min: 0,
            axisLabel: {
              formatter: '{value}'
            },
            splitLine: { show: false }
          }
        ],
        series: [
          {
            name: '当月新签合同额',
            type: 'bar',
            data: monthlyData,
            itemStyle: {
              color: '#007069'
            },
            label: {
              show: false,
              position: 'top',
              formatter: (params: any) => {
                return params.value.toFixed(2);
              }
            }
          },
          {
            name: '累计新签合同额',
            type: 'line',
            yAxisIndex: 1,
            data: accumulatedData,
            symbol: 'circle',
            symbolSize: 8,
            itemStyle: {
              color: '#85e5a7'
            },
            label: {
              show: false,
              position: 'top',
              formatter: (params: any) => {
                return params.value.toFixed(2);
              }
            }
          }
        ]
      };

      monthlyChartInstance.current.setOption(monthlyOption);
    }

    // 初始化散点图
    if (scatterChartRef.current) {
      scatterChartInstance.current = echarts.init(scatterChartRef.current);
      
      // 生成模拟数据
      const data = Array.from({ length: 50 }, () => ({
        value: [
          Math.random() * 10000, // 合同金额 (万元)
          (Math.random() * 30 + 10).toFixed(2), // 利润率 (%)
          Math.random() * 100 // 项目规模
        ],
        itemStyle: {
          color: [
            '#007069', 
            '#3c928d',
            '#6faeab',
            '#95c3c1'
          ][Math.floor(Math.random() * 4)]
        }
      }));

      const scatterOption = {
        grid: {
          left: '5%',
          right: '5%',
          bottom: '10%',
          top: '5%'
        },
        title: {
          show: false
        },
        tooltip: {
          trigger: 'item',
          formatter: function (params: any) {
            return `合同金额: ${params.value[0].toFixed(2)}万元<br/>
                    利润率: ${params.value[1]}%<br/>
                    项目规模: ${params.value[2].toFixed(0)}`;
          }
        },
        xAxis: {
          //name: '合同金额(万元)',
          splitLine: {
            lineStyle: {
              type: 'dashed'
            }
          }
        },
        yAxis: {
          //name: '利润率(%)',
          splitLine: {
            lineStyle: {
              type: 'dashed'
            }
          }
        },
        series: [{
          type: 'scatter',
          symbolSize: function (data: any) {
            return data[2] / 4; // 根据第三个维度设置点的大小
          },
          data: data,
          emphasis: {
            focus: 'series',
            label: {
              show: true,
              formatter: function (param: any) {
                return param.value[1] + '%';
              },
              position: 'top'
            }
          }
        }]
      };

      scatterChartInstance.current.setOption(scatterOption);
    }

    // 初始化瀑布图
    if (waterfallChartRef.current) {
      waterfallChartInstance.current = echarts.init(waterfallChartRef.current);
      
      const waterfallOption = {
        title: {
          show: false
        },
        tooltip: {
          trigger: 'axis',
          formatter: function(params: any) {
            return `${params[0].name}: ${params[0].value}个项目`;
          }
        },
        grid: {
          left: '5%',
          right: '5%',
          bottom: '10%',
          top: '15%',
          containLabel: true
        },
        xAxis: {
          type: 'category',
          data: ['<=50w', '50w~100w', '100w~200w', '>200w'],
          axisLabel: {
            interval: 0,
            rotate: 0
          }
        },
        yAxis: {
          type: 'value',
          name: '项目数量'
        },
        series: [{
          type: 'bar',
          label: {
            show: true,
            position: 'top',
            formatter: '{c}个'
          },
          itemStyle: {
            color: '#007069'
          },
          data: [
            15,  // <=50w的项目数
            25,  // 50w~100w的项目数
            20,  // 100w~200w的项目数
            10   // >200w的项目数
          ]
        }]
      };

      waterfallChartInstance.current.setOption(waterfallOption);
    }

    // 监听容器尺寸变化
    const observer = new ResizeObserver(debounce(resizeHandler, 100));
    
    // 监听所有图表容器
    [chartRef, pieChart1Ref, pieChart2Ref, monthlyChartRef, scatterChartRef, waterfallChartRef].forEach(ref => {
      if (ref.current) {
        observer.observe(ref.current);
      }
    });

    return () => {
      observer.disconnect();
      chartInstance.current?.dispose();
      pieChart1Instance.current?.dispose();
      pieChart2Instance.current?.dispose();
      monthlyChartInstance.current?.dispose();
      scatterChartInstance.current?.dispose();
      waterfallChartInstance.current?.dispose();
    };
  }, []);

  // 添加模拟数据
  const metricInfo: MetricInfo = {
    totalAmount: "12,345.67",
    currentMonthAmount: "2,345.67",
    monthlyChange: "+1,234.56",
    yearlyTarget: "20,000.00",
    completionRate: "61.73"
  };

  // 添加renderChangeWithTriangle函数
  const renderChangeWithTriangle = (change: string, isWipOrAR: boolean = false) => {
    const numericChange = parseFloat(change.replace(/,/g, ''));
    const textSize = isWipOrAR ? "text-2xl" : "text-base";
    
    if (numericChange > 0) {
      return (
        <div className="flex items-center">
          <ArrowUpOutlined className="text-red-500 mr-0.5" />
          <span className={`${textSize} font-bold text-red-500`}>{change}</span>
        </div>
      );
    } else if (numericChange < 0) {
      return (
        <div className="flex items-center">
          <ArrowDownOutlined className="text-green-500 mr-0.5" />
          <span className={`${textSize} font-bold text-green-500`}>{change.replace('-', '')}</span>
        </div>
      );
    }
    return <span className={`${textSize} font-bold`}>{change}</span>;
  };

  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#007069',
          // 可以添加其他主题变量
        },
      }}
    >
      <Layout>
        <Row justify="space-between" align="middle" style={{ padding: '16px', paddingBottom: '0px' }}>
          <Col>
            <Radio.Group defaultValue="withEPC">
              <Radio.Button value="withEPC">包含EPC</Radio.Button>
              <Radio.Button value="withoutEPC">不包含EPC</Radio.Button>
            </Radio.Group>
          </Col>
          <Col>
            <Space>
              <span>统计截至日期:</span>
              <Text>2024-01-18</Text>
              <Button type="primary" icon={<DownloadOutlined />}>
                导出
              </Button>
            </Space>
          </Col>
        </Row>

        <Content style={{ padding: '16px' }}>
          <Row gutter={[16, 16]}>
            <Col span={6}>
              <Card style={{ marginBottom: '16px', height: 'calc(33.33vh - 32px)' }} className="">
                {/* 顶部数据展示 */}
                <div className="grid grid-cols-2 gap-8 mb-2">
                  <div>
                    <div className="text-sm text-gray-500">累计额 (万元)</div>
                    <div className="text-[32px] font-medium text-[#007069]">2,790.00</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">当月新增额 (万元)</div>
                    <div className="text-[32px] font-medium text-[#007069]">2,790.00</div>
                  </div>
                </div>

                {/* 进度条区域 */}
                <div className="space-y-3">
                  <div className="mb-4 border-b border-gray-200 pb-4">
                    <div className="flex justify-between mb-2">
                      <span className="text-gray-600">年度目标完成进度</span>
                      <span className="text-gray-500">2,790 / 30,000</span>
                    </div>
                    <div className="flex items-center">
                      <div className="flex-grow relative h-4 bg-[#007069]/10 rounded-full">
                        <div 
                          className="absolute left-0 top-0 h-full bg-[#007069] rounded-full" 
                          style={{ width: '9.3%' }}
                        >
                          <span className="absolute right-1 top-1/2 -translate-y-1/2 text-white text-xs">9.3%</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 子目标进度条 */}
                  {[
                    { type: "设计及咨询", current: "25,431.00", target: "40,000.00", percent: 63.6 },
                    { type: "EPC", current: "42,785.00", target: "80,000.00", percent: 53.5 },
                    { type: "PMC", current: "6,905.00", target: "15,000.00", percent: 46.0 }
                  ].map((item, index) => (
                    <div key={index}>
                      <div className="flex items-center">
                        <span className="text-gray-600 w-20">{item.type}</span>
                        <Tooltip 
                          title={`当前: ${item.current} / 目标: ${item.target} 万元`}
                          placement="right"
                        >
                          <div className="flex-grow relative h-4 bg-[#007069]/10 rounded-full">
                            <div 
                              className="absolute left-0 top-0 h-full bg-[#007069] rounded-full" 
                              style={{ width: `${item.percent}%` }}
                            >
                              <span className="absolute right-1 top-1/2 -translate-y-1/2 text-white text-xs">{item.percent}%</span>
                            </div>
                          </div>
                        </Tooltip>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
              <Card 
                title="项目新签合同额分布范围" 
                style={{ marginBottom: '16px', height: 'calc(33.33vh - 32px)' }}
              >
                <div ref={waterfallChartRef} style={{ 
                  width: '100%', 
                  height: '100%',
                  minHeight: '200px' 
                }}/>
              </Card>
            </Col>

            <Col span={12}>
              <Card style={{ 
                flex: 1,
                height: 'calc(66.66vh - 48px)',
                display: 'flex',
                flexDirection: 'column'
              }}>
                <div ref={chartRef} style={{
                  width: '100%',
                  height: '100%',
                  minHeight: '560px'
                }}/>
              </Card>
            </Col>

            <Col span={6}>
              <Card 
                title="销售区域分布" 
                style={{ marginBottom: '16px', height: 'calc(33.33vh - 32px)' }}>
                <div ref={pieChart1Ref} style={{ 
                  width: '100%', 
                  height: '100%',
                  minHeight: '200px' 
                }}></div>
              </Card>
              <Card 
                title="业务类型分布" 
                style={{ marginBottom: '16px', height: 'calc(33.33vh - 32px)' }}>
                <div ref={pieChart2Ref} style={{ 
                  width: '100%', 
                  height: '100%',
                  minHeight: '200px' 
                }}></div>
              </Card>
            </Col>
          </Row>

          <Row gutter={[16, 16]}>
            <Col span={8}>
              <Card 
                title="月度新签合同额" 
                style={{ height: 'calc(33.33vh - 32px)' }}
              >
                <div ref={monthlyChartRef} style={{ 
                  width: '100%', 
                  height: '100%',
                  minHeight: '200px' 
                }}></div>
              </Card>
            </Col>
            <Col span={8}>
              <Card 
                title="项目分析" 
                style={{ height: 'calc(33.33vh - 32px)' }}
              >
                <div ref={scatterChartRef} style={{ 
                  width: '100%', 
                  height: '100%',
                  minHeight: '200px' 
                }}></div>
              </Card>
            </Col>
            <Col span={8}>
              <Card title="客户新签合同额排行榜" style={{ height: 'calc(33.33vh - 32px)' }}>
                <div className="overflow-y-auto" style={{ height: 'calc(100% - 40px)' }}>
                  <table className="w-full">
                    <tbody className="bg-white divide-y divide-gray-200">
                      {Object.entries(
                        top20ProjectsData.reduce((acc, project) => ({
                          ...acc,
                          [project.client]: {
                            amount: (acc[project.client]?.amount || 0) + project.amount
                          }
                        }), {} as Record<string, { amount: number }>)
                      )
                        .map(([client, stats]) => ({
                          client,
                          amount: stats.amount
                        }))
                        .sort((a, b) => b.amount - a.amount)
                        .slice(0, 10)
                        .map((item, index) => {
                          const maxAmount = Math.max(...top20ProjectsData.map(p => p.amount));
                          return (
                            <tr key={item.client}>
                              <td className="px-2 py-2 whitespace-nowrap text-sm">{index + 1}</td>
                              <td className="px-2 py-2 whitespace-nowrap text-sm truncate" style={{maxWidth: '120px'}}>{item.client}</td>
                              <td className="px-2 py-2">
                                <div className="flex items-center">
                                  <span className="w-20 text-sm">{formatNumber(item.amount)}</span>
                                  <Progress 
                                    percent={Math.round((item.amount / maxAmount) * 100)}
                                    size="small"
                                    showInfo={false}
                                    strokeColor="#007069"
                                  />
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
              </Card>
            </Col>
          </Row>
        </Content>
      </Layout>
    </ConfigProvider>
  );
}
