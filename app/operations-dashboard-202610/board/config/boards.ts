import type {RendererId} from './view-registry';
import {UNIT_OPTIONS,THEME_OPTIONS,THEME_COLORS as SHARED_THEME_COLORS} from '@/public/operations-dashboard-202610/shared/catalog.js';
export {UNIT_OPTIONS,THEME_OPTIONS};
export type NodeId =
  | 'current'
  | 'department-cost'
  | 'delivery-assurance'
  | 'market'
  | 'opportunity'
  | 'market-data'
  | 'contract-board'
  | 'hr'
  | 'timesheet'
  | 'completed-contract'
  | 'hsse'
  | 'pdf-reports'
  | 'wip-aging'
  | 'completed-contract-deduction';

export type TreeNode = {
  id: NodeId;
  label: string;
  leaf: boolean;
  placeholder?: boolean;
  /** Remix Icon class for first-level items only */
  icon?: string;
  children?: TreeNode[];
  companyOnly?: boolean;
  content?: { kind: 'iframe'; src: string; title: string } | { kind: 'react'; renderer: RendererId };
};

export const TREE: TreeNode[] = [
  { id: 'current', content: { kind: 'iframe', src: '/operations-dashboard-202610/index.html', title: '运营看板202610 · 运营看板' }, label: '运营看板', leaf: true, icon: 'ri-dashboard-2-line' },
  { id: 'department-cost', label: '部门成本看板', leaf: true, placeholder: true, icon: 'ri-coins-line' },
  {
    id: 'market',
    label: '市场看板',
    leaf: false,
    icon: 'ri-store-2-line',
    children: [
      { id: 'opportunity', content: { kind: 'react', renderer: 'market' }, label: '机会清单', leaf: true },
      { id: 'market-data', content: { kind: 'react', renderer: 'market' }, label: '市场数据', leaf: true },
      { id: 'contract-board', content: { kind: 'react', renderer: 'market' }, label: '合同看板', leaf: true },
    ],
  },
  { id: 'hr', content: { kind: 'iframe', src: '/operations-dashboard-202610/hr.html', title: '运营看板202610 · 人力资源看板' }, label: '人力资源看板', leaf: true, icon: 'ri-team-line' },
  { id: 'timesheet', content: { kind: 'iframe', src: '/operations-dashboard-202610/timesheet.html', title: '运营看板202610 · 工时看板' }, label: '工时看板', leaf: true, icon: 'ri-time-line' },
  { id: 'delivery-assurance', label: '交付保障看板', leaf: true, placeholder: true, icon: 'ri-shield-check-line' },
  {
    id: 'completed-contract', content: { kind: 'iframe', src: '/operations-dashboard-202610/completed-contract.html', title: '运营看板202610 · 完成合同额看板' },
    label: '完成合同额看板',
    leaf: true,
    icon: 'ri-money-cny-circle-line',
  },
  {
    id: 'hsse', content: { kind: 'react', renderer: 'hsse' }, companyOnly: true,
    label: 'HSSE绩效看板',
    leaf: true,
    icon: 'ri-shield-cross-line',
  },
  {
    id: 'pdf-reports',
    label: 'PDF报告',
    leaf: false,
    icon: 'ri-file-pdf-2-line',
    children: [
      { id: 'wip-aging', content: { kind: 'react', renderer: 'pdf' }, label: 'WIP 账龄分析', leaf: true },
      { id: 'completed-contract-deduction', content: { kind: 'react', renderer: 'pdf' }, label: '完成合同额核减', leaf: true },
    ],
  },
];



export const THEME_COLORS: Record<string,{primary:string;soft:string}>=SHARED_THEME_COLORS;

/** 壳级组织板块：全部 + 各板块/中心叶子（不含公司级EPC；已去除设计院/数字化业务单元/专业室） */



export const SIDEBAR_EXPANDED_W = 224;
export const SIDEBAR_COLLAPSED_W = 64;

export type ShellNavLeaf = {
  id: string;
  label: string;
  href?: string;
  placeholder?: boolean;
  current?: boolean;
  boardNode?: NodeId;
};

export type ShellNavItem = {
  id: string;
  label: string;
  icon: string;
  href?: string;
  placeholder?: boolean;
  collapsible?: boolean;
  children?: ShellNavLeaf[];
};

export const SHELL_NAV: ShellNavItem[] = [
  {
    id: 'todo',
    label: '待办提醒',
    icon: 'ri-notification-3-line',
    href: '/notice-board',
  },
  {
    id: 'global',
    label: '全局看板',
    icon: 'ri-dashboard-line',
    collapsible: true,
    children: [
      {
        id: 'ops',
        label: '运营看板',
        href: '/operations-dashboard-202610/board',
        current: true,
      },
      {
        id: 'delivery',
        label: '交付保障看板',
        href: '/delivery-assurance-action-items-config',
      },
      {
        id: 'hr-board',
        label: '人力资源看板',
        boardNode: 'hr',
      },
    ],
  },
  {
    id: 'pm',
    label: '项目管理',
    icon: 'ri-bar-chart-box-line',
    collapsible: true,
    href: '/project-management',
    children: [{ id: 'pm-home', label: '项目管理', href: '/project-management' }],
  },
  {
    id: 'reports',
    label: '报告体系',
    icon: 'ri-file-chart-line',
    collapsible: true,
    children: [{ id: 'reports-ph', label: '报告体系', placeholder: true }],
  },
  {
    id: 'settings',
    label: '平台设置',
    icon: 'ri-settings-3-line',
    collapsible: true,
    href: '/platform',
    children: [{ id: 'settings-home', label: '平台设置', href: '/platform' }],
  },
  {
    id: 'oplog',
    label: '操作日志',
    icon: 'ri-file-list-3-line',
    collapsible: true,
    children: [{ id: 'oplog-ph', label: '操作日志', placeholder: true }],
  },
  {
    id: 'rating',
    label: '人员评分体系',
    icon: 'ri-user-star-line',
    placeholder: true,
  },
  {
    id: 'exec-track',
    label: '项目执行跟踪',
    icon: 'ri-crosshair-2-line',
    placeholder: true,
  },
];


export function findNode(nodes: TreeNode[], id: NodeId): TreeNode | undefined {
  for (const n of nodes) {
    if (n.id === id) return n;
    if (n.children) {
      const hit = findNode(n.children, id);
      if (hit) return hit;
    }
  }
  return undefined;
}


export function flattenNodes(nodes = TREE): TreeNode[] { return nodes.flatMap(node => [node, ...flattenNodes(node.children ?? [])]); }
export const IFRAME_NODES = flattenNodes().filter(node => node.content?.kind === 'iframe');
