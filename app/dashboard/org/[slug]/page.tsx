"use client";

import { useParams, notFound } from "next/navigation";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from "recharts";
import Highcharts from "highcharts";
import HighchartsReact from "highcharts-react-official";
import * as HighchartsFunnelModule from "highcharts/modules/funnel";
import * as HighchartsAnnotationsModule from "highcharts/modules/annotations";
import { useMemo } from "react";

if (typeof Highcharts === "object") {
  const funnelFn =
    (
      HighchartsFunnelModule as unknown as {
        default?: (h: typeof Highcharts) => void;
      }
    ).default ??
    (HighchartsFunnelModule as unknown as (h: typeof Highcharts) => void);
  if (typeof funnelFn === "function") funnelFn(Highcharts);
  const annFn =
    (
      HighchartsAnnotationsModule as unknown as {
        default?: (h: typeof Highcharts) => void;
      }
    ).default ??
    (HighchartsAnnotationsModule as unknown as (h: typeof Highcharts) => void);
  if (typeof annFn === "function") annFn(Highcharts);
}
import {
  ArrowUpOutlined,
  DashboardOutlined,
  BarChartOutlined,
  SettingOutlined,
  RightOutlined,
} from "@ant-design/icons";
import { Select, Switch, Tooltip as AntTooltip } from "antd";
import { useState, useEffect } from "react";
import { ConfigProvider } from "antd";

const ORG_SLUGS = ["xinyewu", "nm-ls", "haiwai", "dongbu", "xibu"] as const;
type OrgSlug = (typeof ORG_SLUGS)[number];

const SLUG_TO_NAME: Record<OrgSlug, string> = {
  xinyewu: "新业务项目群",
  "nm-ls": "NM&LS 项目群",
  haiwai: "海外项目群",
  dongbu: "东部项目群",
  xibu: "西部项目群",
};

const SLUG_TO_SECTORS: Record<OrgSlug, string[]> = {
  xinyewu: ["PMC板块", "咨询板块", "数字技术板块"],
  "nm-ls": ["新材料板块", "生命科学板块"],
  haiwai: ["COII板块", "模块化板块", "供应链板块"],
  dongbu: ["金山中心", "沈阳中心", "惠湛中心"],
  xibu: ["银川中心"],
};

// 同一青绿色系，由深到浅提高区分度
const SECTOR_COLORS = ["#004d47", "#0d9488", "#14b8a6", "#2dd4bf", "#5eead4"];

const cardData = [
  {
    title: "年度新签合同额（万元）",
    value: "75,120.41",
    monthLabel: "11月新增",
    monthValue: "5,364.80",
    percentage: "12.5%",
    donutValue: 45.9,
    donutBySector: [16, 15.5, 14.4],
    subTargets: [
      {
        type: "设计及咨询",
        current: 25430.5,
        target: 40000,
        bySector: [8500, 9430.5, 7500],
      },
      {
        type: "EPC",
        current: 42785.3,
        target: 80000,
        bySector: [14000, 14785.3, 14000],
      },
      {
        type: "PMC",
        current: 6904.61,
        target: 15000,
        bySector: [2300, 2302.31, 2302.3],
      },
    ],
  },
  {
    title: "年度完成合同额（万元）",
    value: "38,322.29",
    monthLabel: "上月新增",
    monthValue: "5,364.80",
    percentage: "8.3%",
    donutValue: 37.1,
    donutBySector: [12.5, 13.2, 11.4],
    subTargets: [
      {
        type: "设计及咨询",
        current: 12845.2,
        target: 35000,
        bySector: [4200, 4345.2, 4300],
      },
      {
        type: "EPC",
        current: 21634.8,
        target: 65000,
        bySector: [7200, 7214.8, 7220],
      },
      {
        type: "PMC",
        current: 3842.29,
        target: 12000,
        bySector: [1280, 1281.09, 1281.2],
      },
    ],
  },
  {
    title: "年度完成开票额（万元）",
    value: "40,709.20",
    monthLabel: "上月新增",
    monthValue: "5,364.80",
    percentage: "8.3%",
    donutValue: 42.0,
    donutBySector: [14, 14.5, 13.5],
    subTargets: [
      {
        type: "设计及咨询",
        current: 15268.4,
        target: 38000,
        bySector: [5100, 5084.4, 5084],
      },
      {
        type: "EPC",
        current: 22389.5,
        target: 70000,
        bySector: [7460, 7464.5, 7465],
      },
      {
        type: "PMC",
        current: 3051.3,
        target: 13000,
        bySector: [1017, 1017.1, 1017.2],
      },
    ],
  },
  {
    title: "年度完成回款额（万元）",
    value: "42,165.17",
    monthLabel: "上月新增",
    monthValue: "5,364.80",
    percentage: "8.3%",
    donutValue: 44.5,
    donutBySector: [15, 15.2, 14.3],
    subTargets: [
      {
        type: "设计及咨询",
        current: 16845.2,
        target: 36000,
        bySector: [5615, 5615.2, 5615],
      },
      {
        type: "EPC",
        current: 21583.67,
        target: 68000,
        bySector: [7194, 7194.89, 7194.78],
      },
      {
        type: "PMC",
        current: 3736.3,
        target: 14000,
        bySector: [1245, 1245.1, 1246.2],
      },
    ],
  },
];

const marketDataFunnelValues = [120000, 85000, 62000]; // 预计合同额、预计投标额、权重合同额（万元）
const marketDataFunnelNames = ["预计合同额", "预计投标额", "权重合同额"];
// 漏斗图专用浅色系，与板块主题色区分
const FUNNEL_COLORS = ["#e5f9f7", "#b9e6e0", "#82cdbb"];

const STATUS_TOOLTIP: Record<string, string> = {
  新增: "该项目已被纳入核心项目跟踪，开始进行重点关注与保障。",
  项目信息变更:
    "项目关键信息发生变化，包括：工程平台发起的 CRB 变更，以及数据中台发起的项目经理、项目名称、客户名称、执行日期等信息变更。",
  保障活动更新: "该核心项目的保障活动配置项状态已更新，请关注最新进展。",
};

const projectActivityData = [
  {
    id: "C25088",
    name: "上海石化公司全面技术改造和提质升级项目20万吨/年碳五分离装置（异戊烯部分）",
    sector: "金山中心",
    time: "2025-03-01",
    status: "新增",
    subStatus: undefined,
  },
  {
    id: "G25007",
    name: "梨树风光制绿氢生物质耦合绿色甲醇项目业主工程师服务",
    sector: "沈阳中心",
    time: "2025-02-28",
    status: "项目信息变更",
    subStatus: "CRB变更",
  },
  {
    id: "G25009",
    name: "神华化工公司重点工程项目项目管理服务",
    sector: "PMC板块",
    time: "2025-02-25",
    status: "保障活动更新",
    subStatus: undefined,
  },
];

// 工作负荷数据：key 与 SLUG_TO_SECTORS 的板块顺序对应，sectorA/B/C
const workloadData: Record<
  string,
  { annual: number; current: number; f1: number; f2: number; f3: number }[]
> = {
  xinyewu: [
    { annual: 88.5, current: 92.0, f1: 19, f2: 8, f3: 8 },
    { annual: 91.2, current: 95.0, f1: 19, f2: 9, f3: 8 },
    { annual: 85.0, current: 88.0, f1: 19, f2: 8, f3: 8 },
  ],
  "nm-ls": [
    { annual: 90.0, current: 94.0, f1: 19, f2: 9, f3: 8 },
    { annual: 87.5, current: 91.0, f1: 19, f2: 9, f3: 8 },
  ],
  haiwai: [
    { annual: 92.0, current: 96.0, f1: 19, f2: 9, f3: 9 },
    { annual: 88.0, current: 91.5, f1: 19, f2: 9, f3: 9 },
    { annual: 86.5, current: 89.0, f1: 19, f2: 9, f3: 8 },
  ],
  dongbu: [
    { annual: 91.46, current: 100.0, f1: 19, f2: 9, f3: 9 },
    { annual: 89.0, current: 93.0, f1: 19, f2: 9, f3: 9 },
    { annual: 87.5, current: 90.0, f1: 19, f2: 9, f3: 9 },
  ],
  xibu: [{ annual: 85.0, current: 88.0, f1: 9, f2: 9, f3: 8 }],
};

// WIP及应收账款转化趋势（万元）
const wipReceivableTrendData = [
  { month: "9月", wip: 18520, receivable: 12430 },
  { month: "10月", wip: 19200, receivable: 13100 },
  { month: "11月", wip: 22947, receivable: 12435 },
  { month: "12月", wip: 21500, receivable: 11800 },
  { month: "1月", wip: 20800, receivable: 12900 },
  { month: "2月", wip: 22100, receivable: 13200 },
];

function getDonutConfigBySector(
  segments: number[],
  size: "large" | "small",
  sectorNames?: string[],
) {
  const total = segments.reduce((a, b) => a + b, 0);
  const unfilled = Math.max(0, 100 - total);
  const data = [
    ...segments.map((v, i) => ({
      name: sectorNames?.[i] ?? `板块${i + 1}`,
      value: v,
    })),
    { name: "未完成", value: unfilled },
  ];
  const colors = [
    ...segments.map((_, i) => SECTOR_COLORS[i % SECTOR_COLORS.length]),
    "rgba(0, 112, 105, 0.2)",
  ];
  return (
    <ResponsiveContainer
      width={size === "large" ? 100 : 80}
      height={size === "large" ? 100 : 80}
    >
      <PieChart>
        <Tooltip
          formatter={(value: number, name: string) => [
            name === "未完成" ? `${value.toFixed(1)}%` : `${value}%`,
            name,
          ]}
          contentStyle={{ fontSize: "12px", padding: "8px 12px" }}
          wrapperStyle={{
            zIndex: 10,
            transform: "translateY(-100%) translateY(4px)",
          }}
          offset={0}
          separator=": "
        />
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
}

// 构建「事业群 + 项目交付板块」的层级选项（事业群为组，组标题作为第一项可选，其下为各板块）
const ORG_GROUPED_OPTIONS: {
  label: string;
  options: { value: string; label: string }[];
}[] = ORG_SLUGS.map((s) => ({
  label: SLUG_TO_NAME[s],
  options: [
    { value: s, label: SLUG_TO_NAME[s] },
    ...SLUG_TO_SECTORS[s].map((sec) => ({ value: `${s}__${sec}`, label: sec })),
  ],
}));

export default function OrgDashboardPage() {
  const params = useParams();
  const slug = params?.slug as string | undefined;
  const [selectedDept, setSelectedDept] = useState<string>(() => slug!);
  const [showSubTargets, setShowSubTargets] = useState(false);

  if (!slug || !ORG_SLUGS.includes(slug as OrgSlug)) {
    notFound();
  }

  const orgSlug = slug as OrgSlug;
  const orgName = SLUG_TO_NAME[orgSlug];
  const sectors = SLUG_TO_SECTORS[orgSlug];

  // 路由切换事业群时，同步选择器为当前事业群
  useEffect(() => {
    setSelectedDept(slug!);
  }, [slug]);

  const wipReceivableBarOptions = useMemo<Highcharts.Options>(
    () => ({
      chart: {
        type: "column",
        height: 220,
        backgroundColor: "transparent",
        style: { fontFamily: "inherit" },
        margin: [-20, 90, 30, 0],
      },
      title: { text: undefined },
      credits: { enabled: false },
      xAxis: {
        categories: wipReceivableTrendData.map((d) => d.month),
        lineColor: "transparent",
        tickColor: "transparent",
        labels: { style: { color: "#115e59", fontSize: "11px" } },
      },
      yAxis: {
        visible: false,
        title: { text: null },
        gridLineColor: "rgba(0,112,105,0.1)",
        labels: { style: { color: "#115e59", fontSize: "11px" } },
      },
      legend: {
        layout: "vertical",
        align: "right",
        verticalAlign: "middle",
        itemStyle: { color: "#374151", fontWeight: "normal", fontSize: "11px" },
      },
      tooltip: { shared: true, valueDecimals: 0, valueSuffix: " 万元" },
      plotOptions: {
        column: {
          borderWidth: 0,
          borderRadius: 2,
          groupPadding: 0.1,
          pointPadding: 0.05,
        },
      },
      series: [
        {
          type: "column",
          name: "WIP",
          data: wipReceivableTrendData.map((d) => d.wip),
          color: FUNNEL_COLORS[2],
        },
        {
          type: "column",
          name: "应收账款",
          data: wipReceivableTrendData.map((d) => d.receivable),
          color: FUNNEL_COLORS[1],
        },
      ],
    }),
    [],
  );

  const funnelOptions = useMemo<Highcharts.Options>(() => {
    const rate1 =
      marketDataFunnelValues[1] != null && marketDataFunnelValues[0]
        ? (
            (marketDataFunnelValues[1] / marketDataFunnelValues[0]) *
            100
          ).toFixed(1)
        : "";
    const rate2 =
      marketDataFunnelValues[2] != null && marketDataFunnelValues[1]
        ? (
            (marketDataFunnelValues[2] / marketDataFunnelValues[1]) *
            100
          ).toFixed(1)
        : "";
    return {
      chart: {
        type: "funnel",
        height: 170,
        backgroundColor: "transparent",
        style: { fontFamily: "inherit" },
        margin: [10, 100, 10, 10],
      },
      title: { text: undefined },
      credits: { enabled: false },
      plotOptions: {
        funnel: {
          dataLabels: {
            enabled: true,
            format: "<b>{point.name}</b><br/>{point.y:,.0f} 万元",
            style: {
              color: "#374151",
              fontSize: "11px",
              fontWeight: "normal",
              textOutline: "none",
            },
            softConnector: true,
            crop: false,
            overflow: "allow",
          },
          neckWidth: "28%",
          neckHeight: "20%",
        },
      },
      legend: { enabled: false },
      tooltip: { valueDecimals: 0, valueSuffix: " 万元" },
      series: [
        {
          type: "funnel",
          name: "金额（万元）",
          data: marketDataFunnelNames.map((name, i) => ({
            name,
            y: marketDataFunnelValues[i],
            color: FUNNEL_COLORS[i],
            ...(i < 2 ? { id: `funnel-${i}` } : {}),
          })),
        },
      ],
      annotations: [
        ...(rate1
          ? [
              {
                labels: [
                  {
                    point: "funnel-0",
                    text: rate1 + "%",
                    style: {
                      color: "#007069",
                      fontWeight: "bold",
                      fontSize: "20px",
                    },
                    y: 36,
                    verticalAlign: "bottom" as const,
                    backgroundColor: "transparent",
                    borderWidth: 0,
                  },
                ],
              },
            ]
          : []),
        ...(rate2
          ? [
              {
                labels: [
                  {
                    point: "funnel-1",
                    text: rate2 + "%",
                    style: {
                      color: "#007069",
                      fontWeight: "bold",
                      fontSize: "20px",
                    },
                    y: 28,
                    verticalAlign: "bottom" as const,
                    backgroundColor: "transparent",
                    borderWidth: 0,
                  },
                ],
              },
            ]
          : []),
      ] as Highcharts.AnnotationsOptions[],
    };
  }, []);

  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: "#007069",
          colorLink: "#007069",
          colorLinkHover: "#005c56",
          colorLinkActive: "#004842",
        },
      }}
    >
      <div className="flex min-h-screen">
        <div className="fixed left-0 top-0 h-screen w-16 bg-gray-800 p-2 flex flex-col items-center z-10">
          <Link
            href="/"
            className="mb-8 mt-4 w-12 h-12 bg-white rounded-full flex items-center justify-center hover:opacity-90"
          >
            <span className="text-gray-800 text-2xl font-bold">W</span>
          </Link>
          <div className="flex-1 flex flex-col mt-8 space-y-8">
            <Link
              href="/dashboard"
              className="w-6 h-6 text-gray-400 hover:bg-gray-700 rounded-lg flex items-center justify-center"
              title="项目中台"
            >
              <DashboardOutlined className="w-6 h-6" />
            </Link>
            <span
              className="w-6 h-6 text-white bg-gray-700 rounded-lg flex items-center justify-center"
              title="事业群看板"
            >
              <BarChartOutlined className="w-6 h-6" />
            </span>
            <span className="w-6 h-6 text-gray-400 hover:bg-gray-700 rounded-lg flex items-center justify-center">
              <SettingOutlined className="w-6 h-6" />
            </span>
          </div>
        </div>

        <div className="ml-16 pb-4 space-y-4 bg-[#f8faff] w-[calc(100%-4rem)] min-h-screen overflow-x-hidden">
          <div className="fixed top-0 left-16 right-0 h-20 bg-white shadow-sm z-20">
            <h2 className="pt-6 pl-6 text-2xl">
              运营看板 {">"} {orgName}
            </h2>
          </div>

          <div className="pt-20">
            <div className="px-4 pt-0 pb-2 flex flex-wrap items-center gap-4">
              {/* <Select
                value={selectedDept}
                onChange={setSelectedDept}
                options={ORG_GROUPED_OPTIONS}
                style={{ width: 240 }}
                className="text-[#007069]"
                placeholder="选择事业群 / 板块"
                listHeight={320}
              /> */}
              {/* <Select
                placeholder="选择项目经理"
                allowClear
                style={{ width: 160 }}
                options={[
                  { value: 'pm1', label: '张伟' },
                  { value: 'pm2', label: '李娜' },
                  { value: 'pm3', label: '王磊' },
                  { value: 'pm4', label: '赵静' },
                ]}
                className="text-[#007069]"
              /> */}
              <Select
                defaultValue="2025年"
                style={{ width: 90 }}
                options={[
                  { value: "2025", label: "2025年" },
                  { value: "2024", label: "2024年" },
                  { value: "2023", label: "2023年" },
                ]}
                className="text-[#007069]"
              />
              <div className="flex items-center gap-2">
                <span className="text-sm text-[#007069]">显示子目标</span>
                <Switch checked={showSubTargets} onChange={setShowSubTargets} />
              </div>
              <span className="ml-2 pl-4 border-l border-gray-200 flex items-center gap-3 flex-wrap flex-1">
                {sectors.map((sector, i) => (
                  <button
                    key={sector}
                    type="button"
                    className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-[#007069] cursor-pointer transition-colors rounded px-1 py-0.5 -m-0.5 hover:bg-[#007069]/5"
                    title="点击筛选（功能开发中）"
                  >
                    <span
                      className="w-4 h-4 rounded shrink-0"
                      style={{
                        backgroundColor:
                          SECTOR_COLORS[i % SECTOR_COLORS.length],
                      }}
                    />
                    {sector}
                    <RightOutlined className="text-[10px] opacity-70" />
                  </button>
                ))}
              </span>
              <button className="ml-auto flex items-center gap-2 px-4 py-1.5 bg-[#007069] text-white text-sm rounded-lg hover:bg-[#005c56] transition-colors shrink-0">
                <BarChartOutlined />
                月度统计
              </button>
            </div>

            <div className="px-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {cardData.map((card, index) => (
                  <Card key={index} className="border-0 shadow-md">
                    <CardContent className="p-4">
                      <AntTooltip>
                        <div className="flex justify-between items-center">
                          <div>
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="font-medium text-sm text-gray-700">
                                {card.title}
                              </h3>
                              <Link
                                href="/dashboard/detail"
                                className="w-5 h-5 rounded-full bg-[#007069]/10 flex items-center justify-center hover:bg-[#007069]/20 transition-colors"
                              >
                                <RightOutlined className="text-xs text-[#007069]" />
                              </Link>
                            </div>
                            <div className="text-3xl font-bold text-[#007069]">
                              {card.value}
                            </div>
                            <div className="flex items-center mt-2 text-sm">
                              <span className="text-gray-500 mr-2">
                                {card.monthLabel}
                              </span>
                              <span className="text-gray-500 mr-2">
                                {card.monthValue}
                              </span>
                              <span className="px-2 py-0.5 text-xs rounded-full bg-green-100 text-green-800">
                                {card.percentage}
                              </span>
                            </div>
                          </div>
                          <div className="relative w-24 h-24">
                            <div className="absolute inset-0 flex items-center justify-center">
                              {getDonutConfigBySector(
                                card.donutBySector.slice(0, sectors.length),
                                "large",
                                sectors,
                              )}
                              <div
                                className="absolute inset-0 flex items-center justify-center pointer-events-none text-sm font-bold text-[#007069]"
                                style={{ zIndex: 1 }}
                              >
                                {card.donutValue}%
                              </div>
                            </div>
                          </div>
                        </div>
                      </AntTooltip>
                      <div
                        className={`overflow-hidden transition-all duration-300 ease-in-out ${showSubTargets ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"}`}
                      >
                        <div className="mt-4 pt-4 border-t border-[#007069]/20">
                          {card.subTargets.map((target, idx) => {
                            const percentage = Math.min(
                              100,
                              (target.current / target.target) * 100,
                            ).toFixed(1);
                            const rawBySector = target.bySector ?? [
                              target.current,
                            ];
                            const bySector = rawBySector.slice(
                              0,
                              sectors.length,
                            );
                            return (
                              <div key={idx} className="mb-2 last:mb-0">
                                <div className="flex text-sm mb-1">
                                  <span className="text-gray-500">
                                    {target.type}
                                  </span>
                                  <span className="ml-4 text-[#007069]">
                                    {target.current.toLocaleString()} /{" "}
                                    {target.target.toLocaleString()}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <div className="flex-1 h-3 bg-[#007069]/20 rounded-full overflow-hidden flex">
                                    {bySector.map((seg, si) => {
                                      const segPct = Math.min(
                                        100,
                                        (seg / target.target) * 100,
                                      );
                                      const sectorName =
                                        sectors[si] ?? `板块${si + 1}`;
                                      return (
                                        <AntTooltip
                                          key={si}
                                          title={`${sectorName}: ${seg.toLocaleString()} 万元`}
                                          placement="top"
                                        >
                                          <div
                                            className="h-full transition-all duration-500 first:rounded-l-full last:rounded-r-full cursor-default min-w-[2px]"
                                            style={{
                                              width: `${segPct}%`,
                                              backgroundColor:
                                                SECTOR_COLORS[
                                                  si % SECTOR_COLORS.length
                                                ],
                                            }}
                                          />
                                        </AntTooltip>
                                      );
                                    })}
                                  </div>
                                  <span className="text-sm text-[#007069] shrink-0">
                                    {percentage}%
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            <div className="px-4 grid grid-cols-1 lg:grid-cols-3 gap-4 mt-4">
              <Card className="border-0 shadow-md h-full">
                <CardContent className="p-4">
                  <h3 className="font-medium text-sm text-gray-700 mb-2">
                    应收款项（万元）
                  </h3>
                  <div className="space-y-2">
                    <div className="bg-[#007069]/10 p-3 rounded-lg">
                      <div className="flex items-center justify-between">
                        <p className="text-xl font-bold text-[#007069]">
                          22,947.25
                        </p>
                        <div className="flex items-center text-red-500 text-sm whitespace-nowrap">
                          <ArrowUpOutlined className="w-4 h-4 mr-1" />
                          <span>1,344</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                      <p className="text-sm text-[#007069] mt-1">当前WIP</p>
                        <AntTooltip title="查看详情">
                          <Link href="/dashboard/department-cost-detail" className="w-5 h-5 rounded-full bg-[#007069]/10 flex items-center justify-center hover:bg-[#007069]/20 transition-colors">
                            <RightOutlined className="text-xs text-[#007069]" />
                          </Link>
                        </AntTooltip>
                      </div>
                    </div>
                    <div className="bg-[#007069]/10 p-3 rounded-lg">
                      <div className="flex items-center justify-between">
                        <p className="text-xl font-bold text-[#007069]">
                          12,434.70
                        </p>
                        <div className="flex items-center text-red-500 text-sm whitespace-nowrap">
                          <ArrowUpOutlined className="w-4 h-4 mr-1" />
                          <span>2,043</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                      <p className="text-sm text-[#007069] mt-1">应收账款</p>
                        <AntTooltip title="查看详情">
                          <Link href="/dashboard/department-cost-detail" className="w-5 h-5 rounded-full bg-[#007069]/10 flex items-center justify-center hover:bg-[#007069]/20 transition-colors">
                            <RightOutlined className="text-xs text-[#007069]" />
                          </Link>
                        </AntTooltip>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-md h-full">
                <CardContent className="p-4">
                  <h3 className="font-medium text-sm text-gray-700 mb-2">
                    成本分析（万元）
                  </h3>
                  <div className="space-y-2">
                    <div className="bg-[#007069]/10 p-3 rounded-lg">
                      <p className="text-xl font-bold text-[#007069]">
                        33,199.69
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <p className="text-sm text-[#007069]">合计成本</p>
                        <AntTooltip title="查看详情">
                          <Link
                            href="/dashboard/cost-detail"
                            className="w-5 h-5 rounded-full bg-[#007069]/10 flex items-center justify-center hover:bg-[#007069]/20 transition-colors"
                          >
                            <RightOutlined className="text-xs text-[#007069]" />
                          </Link>
                        </AntTooltip>
                      </div>
                    </div>
                    <div className="flex gap-2 w-full">
                      <div className="flex-1 bg-[#007069]/5 p-2 rounded-lg">
                        <p className="text-lg font-bold text-[#007069]">
                          27,167.37
                        </p>
                        <p className="text-sm text-[#007069] mt-1 whitespace-nowrap">
                          项目成本
                        </p>
                      </div>
                      <div className="flex-1 bg-[#007069]/5 p-2 rounded-lg">
                        <p className="text-lg font-bold text-[#007069]">
                          6,032.32
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <p className="text-sm text-[#007069] whitespace-nowrap">
                            管理成本
                          </p>
                          {/* <AntTooltip title="查看详情">
                            <Link href="/dashboard/department-cost-detail" className="w-5 h-5 rounded-full bg-[#007069]/10 flex items-center justify-center hover:bg-[#007069]/20 transition-colors">
                              <RightOutlined className="text-xs text-[#007069]" />
                            </Link>
                          </AntTooltip> */}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-md h-full">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-1.5">
                      <h3 className="font-medium text-sm text-gray-700">
                        市场机会（万元）
                      </h3>
                      <AntTooltip title="所有 CRB1、CRB2 和未确认完成的 CRB3 的合同金额均为市场机会，时间范围与工程平台「市场看板 - 机会清单」的默认范围一致。">
                        <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-[#007069]/10 text-xs text-[#007069] cursor-default">
                          ?
                        </span>
                      </AntTooltip>
                    </div>
                    <AntTooltip title="查看详情">
                      <button
                        type="button"
                        className="w-5 h-5 rounded-full bg-[#007069]/10 flex items-center justify-center hover:bg-[#007069]/20 transition-colors"
                      >
                        <RightOutlined className="text-xs text-[#007069]" />
                      </button>
                    </AntTooltip>
                  </div>
                  <HighchartsReact
                    highcharts={Highcharts}
                    options={funnelOptions}
                  />
                </CardContent>
              </Card>
            </div>

            <div className="px-4 grid grid-cols-1 lg:grid-cols-3 gap-4 mt-4">
              <Card className="border-0 shadow-md">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium text-sm text-gray-700">
                      WIP及应收账款转化趋势（万元）
                    </h3>
                    <AntTooltip title="导出明细">
                      <button
                        type="button"
                        className="w-5 h-5 rounded-full bg-[#007069]/10 flex items-center justify-center hover:bg-[#007069]/20 transition-colors"
                      >
                        <RightOutlined className="text-xs text-[#007069]" />
                      </button>
                    </AntTooltip>
                  </div>
                  <HighchartsReact
                    highcharts={Highcharts}
                    options={wipReceivableBarOptions}
                  />
                </CardContent>
              </Card>

              <Card className="border-0 shadow-md">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium text-sm text-gray-700">
                      工作负荷一览
                    </h3>
                    <AntTooltip title="查看详情">
                      <button
                        type="button"
                        className="w-5 h-5 rounded-full bg-[#007069]/10 flex items-center justify-center hover:bg-[#007069]/20 transition-colors"
                      >
                        <RightOutlined className="text-xs text-[#007069]" />
                      </button>
                    </AntTooltip>
                  </div>
                  <div
                    className="grid gap-2"
                    style={{
                      gridTemplateColumns: `repeat(${sectors.length}, minmax(0, 1fr))`,
                    }}
                  >
                    {sectors.map((sector, si) => {
                      const wl = (workloadData[orgSlug] ?? [])[si];
                      if (!wl) return null;
                      const rows: { label: string; value: number }[] = [
                        { label: "全年", value: wl.annual },
                        { label: "当月", value: wl.current },
                        { label: "未来第一月预测", value: wl.f1 },
                        { label: "未来第二月预测", value: wl.f2 },
                        { label: "未来第三月预测", value: wl.f3 },
                      ];
                      return (
                        <div key={sector}>
                          <p
                            className="text-xs font-medium text-[#007069] mb-1.5 truncate"
                            title={sector}
                          >
                            {sector}
                          </p>
                          <div className="space-y-1">
                            {rows.map(({ label, value }) => (
                              <div
                                key={label}
                                className="relative flex items-center justify-between px-2 py-2 rounded overflow-hidden bg-[#007069]/10"
                              >
                                <div
                                  className="absolute inset-0 bg-[#007069]/15"
                                  style={{ width: `${Math.min(value, 100)}%` }}
                                />
                                <span className="relative z-10 text-[11px] text-[#007069]">
                                  {label}
                                </span>
                                <span className="relative z-10 text-[11px] font-semibold text-[#007069] tabular-nums whitespace-nowrap">
                                  {value.toFixed(2)} %
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
              <Card className="border-0 shadow-md">
                <CardContent className="p-4">
                  <h3 className="font-medium text-sm text-gray-700 mb-3">
                    最新核心项目动态
                  </h3>
                  <div className="space-y-2">
                    {projectActivityData.map((row) => {
                      const statusColor: Record<
                        string,
                        { bg: string; text: string; dot: string }
                      > = {
                        新增: {
                          bg: "bg-emerald-50",
                          text: "text-emerald-700",
                          dot: "bg-emerald-500",
                        },
                        项目信息变更: {
                          bg: "bg-amber-50",
                          text: "text-amber-700",
                          dot: "bg-amber-500",
                        },
                        保障活动更新: {
                          bg: "bg-sky-50",
                          text: "text-sky-700",
                          dot: "bg-sky-500",
                        },
                      };
                      const sc = statusColor[row.status] ?? {
                        bg: "bg-gray-50",
                        text: "text-gray-600",
                        dot: "bg-gray-400",
                      };
                      const statusLabel = row.subStatus
                        ? `${row.status} · ${row.subStatus}`
                        : row.status;
                      return (
                        <div
                          key={row.id}
                          className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 hover:bg-[#007069]/5 transition-colors"
                        >
                          <div
                            className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${sc.dot}`}
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 justify-between mb-1">
                              <AntTooltip
                                title={STATUS_TOOLTIP[row.status]}
                                placement="topLeft"
                              >
                                <span
                                  className={`text-xs px-1.5 py-0.5 rounded font-medium cursor-default ${sc.bg} ${sc.text}`}
                                >
                                  {statusLabel}
                                </span>
                              </AntTooltip>
                              <span className="text-xs text-gray-400">
                                {row.time}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="text-sm font-medium text-gray-800 font-mono shrink-0">
                                {row.id}
                              </span>
                              <span
                                className="text-sm font-medium text-gray-800 truncate flex-1"
                                title={row.name}
                              >
                                {row.name}
                              </span>
                              <span className="text-xs text-[#007069] shrink-0">
                                {row.sector}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </ConfigProvider>
  );
}
