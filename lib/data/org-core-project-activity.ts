/**
 * 事业群核心项目及动态（静态演示数据）。API 与看板卡片共用。
 */

import type { OrgSlug } from "@/lib/data/org-dashboard-meta";
import { ORG_SLUGS } from "@/lib/data/org-dashboard-meta";

export type CoreProjectActivityItem = {
  time: string;
  status: string;
  subStatus?: string;
};

export type CoreProjectWithActivities = {
  id: string;
  name: string;
  sector: string;
  activities: CoreProjectActivityItem[];
};

export const STATUS_TOOLTIP: Record<string, string> = {
  新增: "该项目已被纳入核心项目跟踪，开始进行重点关注与保障。",
  项目信息变更:
    "项目关键信息发生变化，包括：工程平台发起的 CRB 变更，以及数据中台发起的项目经理、项目名称、客户名称、执行日期等信息变更。",
  保障活动更新: "该核心项目的保障活动配置项状态已更新，请关注最新进展。",
};

/** 各事业群核心项目（activities 建议按时间从新到旧排列） */
export const CORE_PROJECTS_BY_ORG: Record<OrgSlug, CoreProjectWithActivities[]> =
  {
    xinyewu: [
      {
        id: "X25011",
        name: "某炼化一体化项目数字化交付平台咨询",
        sector: "数字技术板块",
        activities: [
          { time: "2025-03-02", status: "保障活动更新" },
          { time: "2025-02-28", status: "项目信息变更", subStatus: "客户名称变更" },
          { time: "2025-02-18", status: "保障活动更新" },
          { time: "2025-02-10", status: "项目信息变更", subStatus: "项目经理变更" },
          { time: "2025-01-28", status: "保障活动更新" },
          { time: "2025-01-15", status: "新增" },
        ],
      },
      {
        id: "X25008",
        name: "园区智慧能源 PMC 全过程项目管理",
        sector: "PMC板块",
        activities: [
          { time: "2025-03-01", status: "新增" },
          { time: "2025-02-25", status: "项目信息变更", subStatus: "执行日期变更" },
          { time: "2025-02-20", status: "保障活动更新" },
          { time: "2025-02-08", status: "保障活动更新" },
          { time: "2025-01-30", status: "项目信息变更", subStatus: "CRB变更" },
        ],
      },
      {
        id: "X25003",
        name: "化工企业战略投资可行性研究",
        sector: "咨询板块",
        activities: [
          { time: "2025-02-28", status: "项目信息变更", subStatus: "CRB变更" },
          { time: "2025-02-01", status: "保障活动更新" },
          { time: "2025-01-05", status: "新增" },
        ],
      },
      {
        id: "X24092",
        name: "LNG 接收站工程咨询与数字化建模",
        sector: "咨询板块",
        activities: [
          { time: "2025-02-25", status: "保障活动更新" },
          { time: "2024-11-08", status: "新增" },
        ],
      },
    ],
    "nm-ls": [
      {
        id: "N25005",
        name: "高性能复合材料产线 EPCM 服务",
        sector: "新材料板块",
        activities: [
          { time: "2025-03-01", status: "新增" },
          { time: "2025-02-18", status: "项目信息变更", subStatus: "执行日期变更" },
        ],
      },
      {
        id: "N25002",
        name: "生物药中试基地设计及项目管理",
        sector: "生命科学板块",
        activities: [
          { time: "2025-02-27", status: "保障活动更新" },
          { time: "2025-02-01", status: "新增" },
          { time: "2025-01-12", status: "项目信息变更", subStatus: "客户名称变更" },
        ],
      },
      {
        id: "N24088",
        name: "医用高分子材料国产化替代咨询",
        sector: "新材料板块",
        activities: [
          { time: "2025-02-20", status: "保障活动更新" },
          { time: "2024-09-01", status: "新增" },
        ],
      },
    ],
    haiwai: [
      {
        id: "H25014",
        name: "中东模块化天然气处理装置供应链协同项目",
        sector: "供应链板块",
        activities: [
          { time: "2025-03-02", status: "项目信息变更", subStatus: "CRB变更" },
          { time: "2025-02-05", status: "新增" },
        ],
      },
      {
        id: "H25009",
        name: "东南亚 COII 标准模块化装置设计审查",
        sector: "COII板块",
        activities: [
          { time: "2025-02-29", status: "保障活动更新" },
          { time: "2025-01-20", status: "新增" },
        ],
      },
      {
        id: "H25001",
        name: "非洲现场模块化组装与物流统筹",
        sector: "模块化板块",
        activities: [
          { time: "2025-02-15", status: "保障活动更新" },
          { time: "2024-12-01", status: "新增" },
        ],
      },
    ],
    dongbu: [
      {
        id: "C25088",
        name: "上海石化公司全面技术改造和提质升级项目20万吨/年碳五分离装置（异戊烯部分）",
        sector: "金山中心",
        activities: [
          { time: "2025-03-01", status: "新增" },
          { time: "2025-02-22", status: "保障活动更新" },
          { time: "2025-02-18", status: "项目信息变更", subStatus: "项目名称变更" },
          { time: "2025-02-12", status: "保障活动更新" },
          { time: "2025-01-25", status: "项目信息变更", subStatus: "项目经理变更" },
        ],
      },
      {
        id: "G25007",
        name: "梨树风光制绿氢生物质耦合绿色甲醇项目业主工程师服务",
        sector: "沈阳中心",
        activities: [
          { time: "2025-02-28", status: "项目信息变更", subStatus: "CRB变更" },
          { time: "2025-02-20", status: "保障活动更新" },
          { time: "2025-02-12", status: "项目信息变更", subStatus: "执行日期变更" },
          { time: "2025-02-05", status: "保障活动更新" },
          { time: "2025-02-01", status: "新增" },
          { time: "2025-01-18", status: "保障活动更新" },
        ],
      },
      {
        id: "G25009",
        name: "神华化工公司重点工程项目项目管理服务",
        sector: "惠湛中心",
        activities: [
          { time: "2025-02-25", status: "保障活动更新" },
          { time: "2025-01-08", status: "新增" },
        ],
      },
      {
        id: "D24055",
        name: "沿海炼化基地储运系统 PMC",
        sector: "惠湛中心",
        activities: [
          { time: "2025-02-10", status: "项目信息变更", subStatus: "项目名称变更" },
          { time: "2024-08-20", status: "新增" },
        ],
      },
    ],
    xibu: [
      {
        id: "Y25001",
        name: "宁夏新能源配套化工项目全周期咨询",
        sector: "银川中心",
        activities: [
          { time: "2025-02-26", status: "新增" },
          { time: "2025-02-01", status: "保障活动更新" },
        ],
      },
      {
        id: "Y24030",
        name: "煤化工升级改造项目管理服务",
        sector: "银川中心",
        activities: [
          { time: "2025-02-18", status: "保障活动更新" },
          { time: "2024-06-10", status: "新增" },
          { time: "2024-05-01", status: "项目信息变更", subStatus: "项目经理变更" },
        ],
      },
    ],
    xx: [
      {
        id: "D25001",
        name: "某EPC项目",
        sector: "A板块",
        activities: [
          { time: "2025-03-01", status: "新增" },
          { time: "2025-02-15", status: "保障活动更新" },
        ],
      },
      {
        id: "D25002",
        name: "某PMC项目",
        sector: "B板块",
        activities: [
          { time: "2025-02-28", status: "项目信息变更", subStatus: "CRB变更" },
          { time: "2025-02-01", status: "新增" },
        ],
      },
      {
        id: "D25003",
        name: "某咨询项目",
        sector: "C板块",
        activities: [
          { time: "2025-02-25", status: "保障活动更新" },
          { time: "2025-02-14", status: "项目信息变更", subStatus: "CRB变更" },
          { time: "2025-02-01", status: "保障活动更新" },
          { time: "2025-01-20", status: "项目信息变更", subStatus: "客户名称变更" },
          { time: "2025-01-10", status: "新增" },
          { time: "2025-01-02", status: "项目信息变更", subStatus: "执行日期变更" },
        ],
      },
    ],
  };

export type ActivityFeedRow = {
  id: string;
  name: string;
  sector: string;
  time: string;
  status: string;
  subStatus?: string;
};

/** 看板「最新核心项目动态」卡片：取全局最新若干条动态（跨项目） */
export function getCoreActivityFeedPreview(org: OrgSlug, limit = 3): ActivityFeedRow[] {
  const projects = CORE_PROJECTS_BY_ORG[org] ?? [];
  const flat: ActivityFeedRow[] = [];
  for (const p of projects) {
    for (const a of p.activities) {
      flat.push({
        id: p.id,
        name: p.name,
        sector: p.sector,
        time: a.time,
        status: a.status,
        subStatus: a.subStatus,
      });
    }
  }
  flat.sort((x, y) => y.time.localeCompare(x.time));
  return flat.slice(0, limit);
}

export function isOrgCoreActivitySlug(s: string): s is OrgSlug {
  return (ORG_SLUGS as readonly string[]).includes(s);
}
