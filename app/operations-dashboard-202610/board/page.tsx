'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import {
  CaretDownOutlined,
  CaretUpOutlined,
  CaretRightOutlined,
} from '@ant-design/icons';
import { ConfigProvider, Select } from 'antd';
import 'remixicon/fonts/remixicon.css';

/**
 * 运营看板202610 · Board 内容壳
 * 左：wood. Projects Zone 深色侧栏；内：白底看板目录 + 运营看板 / 完成合同额 iframe / 占位
 * 壳级筛选（年 2026 + 组织板块）在 header 下、目录与内容上；主题在全局 header
 */

type NodeId =
  | 'current'
  | 'market'
  | 'opportunity'
  | 'market-data'
  | 'contract-board'
  | 'hr'
  | 'completed-contract';

type TreeNode = {
  id: NodeId;
  label: string;
  leaf: boolean;
  placeholder?: boolean;
  /** Remix Icon class for first-level items only */
  icon?: string;
  children?: TreeNode[];
};

const TREE: TreeNode[] = [
  { id: 'current', label: '运营看板', leaf: true, icon: 'ri-dashboard-2-line' },
  {
    id: 'market',
    label: '市场看板',
    leaf: false,
    icon: 'ri-store-2-line',
    children: [
      { id: 'opportunity', label: '机会清单', leaf: true, placeholder: true },
      { id: 'market-data', label: '市场数据', leaf: true, placeholder: true },
      { id: 'contract-board', label: '合同看板', leaf: true, placeholder: true },
    ],
  },
  { id: 'hr', label: '人力资源看板', leaf: true, placeholder: true, icon: 'ri-team-line' },
  {
    id: 'completed-contract',
    label: '完成合同额看板',
    leaf: true,
    icon: 'ri-money-cny-circle-line',
  },
];

const THEME_OPTIONS = [
  { value: 'teal', label: '青绿主题' },
  { value: 'blue', label: '深蓝主题' },
  { value: 'wood', label: '暖棕主题' },
];

const THEME_COLORS: Record<string, { primary: string; soft: string }> = {
  teal: { primary: '#008b8b', soft: 'rgba(0, 139, 139, 0.12)' },
  blue: { primary: '#306da9', soft: 'rgba(48, 109, 169, 0.12)' },
  wood: { primary: '#897044', soft: 'rgba(137, 112, 68, 0.12)' },
};

/** 壳级组织板块：全部 + 各板块/中心叶子（不含公司级EPC；已去除设计院/数字化业务单元/专业室） */
const UNIT_OPTIONS = [
  { value: '全部板块', label: '全部板块' },
  { value: 'SAS170 PMC板块', label: 'SAS170 PMC板块' },
  { value: 'SAS610 咨询板块', label: 'SAS610 咨询板块' },
  { value: 'SAS680 数字技术板块', label: 'SAS680 数字技术板块' },
  { value: 'SAS650 新材料板块', label: 'SAS650 新材料板块' },
  { value: 'SAS710 生命科学板块', label: 'SAS710 生命科学板块' },
  { value: 'SAS690 COII板块', label: 'SAS690 COII板块' },
  { value: 'SAS720 模块化板块', label: 'SAS720 模块化板块' },
  { value: 'SAS670 供应链板块', label: 'SAS670 供应链板块' },
  { value: 'SAS520 金山中心', label: 'SAS520 金山中心' },
  { value: 'SAS560 沈阳中心', label: 'SAS560 沈阳中心' },
  { value: 'SAS550 惠湛中心', label: 'SAS550 惠湛中心' },
  { value: 'SAS530 银川中心', label: 'SAS530 银川中心' },
];

const OPS_IFRAME_SRC = '/operations-dashboard-202610/index.html';
const COMPLETED_IFRAME_SRC = '/operations-dashboard-202610/completed-contract.html';

const SIDEBAR_EXPANDED_W = 224;
const SIDEBAR_COLLAPSED_W = 64;

type ShellNavLeaf = {
  id: string;
  label: string;
  href?: string;
  placeholder?: boolean;
  current?: boolean;
};

type ShellNavItem = {
  id: string;
  label: string;
  icon: string;
  href?: string;
  placeholder?: boolean;
  collapsible?: boolean;
  children?: ShellNavLeaf[];
};

const SHELL_NAV: ShellNavItem[] = [
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
        placeholder: true,
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

function findNode(nodes: TreeNode[], id: NodeId): TreeNode | undefined {
  for (const n of nodes) {
    if (n.id === id) return n;
    if (n.children) {
      const hit = findNode(n.children, id);
      if (hit) return hit;
    }
  }
  return undefined;
}

function PlaceholderView({ title }: { title: string }) {
  return (
    <div className="h-full overflow-auto bg-[#f5f7fa] p-6">
      <h3 className="mb-4 text-lg font-semibold text-slate-800">{title}</h3>
      <div className="grid grid-cols-2 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="flex min-h-[140px] items-center justify-center rounded-lg border border-dashed border-slate-300 bg-white text-sm text-slate-400"
          >
            占位
          </div>
        ))}
      </div>
    </div>
  );
}

export default function OperationsDashboard202610BoardPage() {
  const [selected, setSelected] = useState<NodeId>('current');
  const [expanded, setExpanded] = useState<Record<string, boolean>>({
    market: true,
  });
  const [shellExpanded, setShellExpanded] = useState<Record<string, boolean>>({
    global: true,
  });
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [theme, setTheme] = useState('blue');
  const [unit, setUnit] = useState('全部板块');
  const [placeholderHint, setPlaceholderHint] = useState<string | null>(null);
  const opsIframeRef = useRef<HTMLIFrameElement>(null);
  const completedIframeRef = useRef<HTMLIFrameElement>(null);

  // ep79: ?unit= from org-entry deep link → same as shell Select
  useEffect(() => {
    try {
      const raw = new URLSearchParams(window.location.search).get('unit');
      if (raw && UNIT_OPTIONS.some((o) => o.value === raw)) {
        setUnit(raw);
      }
    } catch {
      /* ignore */
    }
  }, []);

  const selectedMeta = useMemo(() => findNode(TREE, selected), [selected]);
  const themeColor = THEME_COLORS[theme] ?? THEME_COLORS.blue;
  const sidebarW = sidebarCollapsed ? SIDEBAR_COLLAPSED_W : SIDEBAR_EXPANDED_W;

  const activeIframeRef = useCallback(() => {
    if (selected === 'current') return opsIframeRef.current;
    if (selected === 'completed-contract') return completedIframeRef.current;
    return null;
  }, [selected]);

  const postTo = useCallback((win: Window | null | undefined, data: object) => {
    if (!win) return;
    win.postMessage(data, window.location.origin);
  }, []);

  const postTheme = useCallback(
    (name: string, win?: Window | null) => {
      postTo(win ?? activeIframeRef()?.contentWindow, {
        type: 'ops-dashboard-theme',
        theme: name,
      });
    },
    [activeIframeRef, postTo],
  );

  const postFilter = useCallback(
    (nextUnit: string, win?: Window | null) => {
      postTo(win ?? activeIframeRef()?.contentWindow, {
        type: 'ops-dashboard-filter',
        year: 2026,
        unit: nextUnit,
      });
    },
    [activeIframeRef, postTo],
  );

  const syncActiveIframe = useCallback(
    (win?: Window | null) => {
      const target = win ?? activeIframeRef()?.contentWindow;
      postTheme(theme, target);
      postFilter(unit, target);
    },
    [activeIframeRef, postFilter, postTheme, theme, unit],
  );

  useEffect(() => {
    if (selected === 'current' || selected === 'completed-contract') {
      syncActiveIframe();
    }
  }, [selected, theme, unit, syncActiveIframe]);

  useEffect(() => {
    if (!placeholderHint) return;
    const t = setTimeout(() => setPlaceholderHint(null), 2200);
    return () => clearTimeout(t);
  }, [placeholderHint]);

  const onOpsIframeLoad = () => {
    if (selected === 'current') syncActiveIframe(opsIframeRef.current?.contentWindow);
  };
  const onCompletedIframeLoad = () => {
    if (selected === 'completed-contract') {
      syncActiveIframe(completedIframeRef.current?.contentWindow);
    }
  };

  const onTreeClick = (node: TreeNode) => {
    if (!node.leaf) {
      setExpanded((prev) => ({ ...prev, [node.id]: !prev[node.id] }));
      return;
    }
    setSelected(node.id);
  };

  const toggleShellGroup = (id: string) => {
    setShellExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const onPlaceholderClick = (label: string) => {
    setPlaceholderHint(`${label}（占位，暂无独立页）`);
  };

  const renderTreeNodes = (nodes: TreeNode[], depth = 0) =>
    nodes.map((node) => {
      const isOpen = !!expanded[node.id];
      const isActive = selected === node.id;
      return (
        <li
          key={node.id}
          role="none"
          className={`board-tree-li list-none rounded-md ${isActive ? 'selected active' : ''}`}
          style={
            isActive
              ? {
                  backgroundColor: themeColor.soft,
                  color: themeColor.primary,
                }
              : undefined
          }
          data-selected={isActive ? 'true' : 'false'}
        >
          <button
            type="button"
            role="treeitem"
            aria-selected={isActive}
            data-selected={isActive ? 'true' : 'false'}
            onClick={() => onTreeClick(node)}
            className={`board-tree-item flex w-full items-center gap-1 rounded-md px-2 py-1.5 text-left text-[13px] transition-colors ${
              isActive
                ? 'font-semibold selected active'
                : 'text-slate-700 hover:bg-slate-100'
            }`}
            style={{
              paddingLeft: 8 + depth * 14,
              ...(isActive
                ? {
                    backgroundColor: themeColor.soft,
                    color: themeColor.primary,
                  }
                : {}),
            }}
            title={
              node.leaf
                ? node.label
                : isOpen
                  ? `收起 ${node.label}`
                  : `展开 ${node.label}`
            }
          >
            {!node.leaf ? (
              <span className="inline-flex w-3 shrink-0 text-[10px] text-slate-400">
                {isOpen ? <CaretDownOutlined /> : <CaretRightOutlined />}
              </span>
            ) : (
              <span className="inline-block w-3 shrink-0" />
            )}
            {depth === 0 && node.icon ? (
              <i
                className={`${node.icon} shrink-0 text-[15px] leading-none`}
                aria-hidden
              />
            ) : null}
            <span className="truncate">{node.label}</span>
            {node.placeholder ? (
              <span className="ml-auto shrink-0 rounded bg-slate-100 px-1 text-[10px] font-normal text-slate-400">
                占位
              </span>
            ) : null}
          </button>
          {!node.leaf && isOpen && node.children ? (
            <ul className="board-tree m-0 list-none p-0" role="group">
              {renderTreeNodes(node.children, depth + 1)}
            </ul>
          ) : null}
        </li>
      );
    });

  const showOps = selected === 'current';
  const showCompleted = selected === 'completed-contract';
  const showPlaceholder = !!selectedMeta?.placeholder;

  const renderShellNav = () =>
    SHELL_NAV.map((item) => {
      const isGroupOpen = !!shellExpanded[item.id];
      const hasChildren = !!(item.collapsible && item.children?.length);
      const groupActive = item.id === 'global' || !!item.children?.some((c) => c.current);

      if (sidebarCollapsed) {
        const collapsedHref =
          item.href || item.children?.find((c) => c.href)?.href || undefined;
        const collapsedCurrent = item.children?.some((c) => c.current);
        const iconBtnClass = `flex h-10 w-10 items-center justify-center rounded-lg text-[18px] transition-colors ${
          collapsedCurrent
            ? 'bg-white/15 text-white'
            : 'text-slate-300 hover:bg-white/10 hover:text-white'
        }`;
        if (collapsedHref) {
          return (
            <Link
              key={item.id}
              href={collapsedHref}
              className={iconBtnClass}
              title={item.label}
              aria-label={item.label}
              data-testid={`shell-nav-${item.id}`}
            >
              <i className={item.icon} aria-hidden />
            </Link>
          );
        }
        return (
          <button
            key={item.id}
            type="button"
            className={iconBtnClass}
            title={`${item.label}（占位）`}
            aria-label={`${item.label}（占位）`}
            data-testid={`shell-nav-${item.id}`}
            onClick={() => onPlaceholderClick(item.label)}
          >
            <i className={item.icon} aria-hidden />
          </button>
        );
      }

      return (
        <div key={item.id} className="px-2" data-testid={`shell-nav-${item.id}`}>
          {hasChildren ? (
            <button
              type="button"
              onClick={() => toggleShellGroup(item.id)}
              className={`flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-[13px] transition-colors ${
                groupActive && isGroupOpen
                  ? 'bg-white/10 text-white'
                  : 'text-slate-300 hover:bg-white/8 hover:text-white'
              }`}
              aria-expanded={isGroupOpen}
              title={isGroupOpen ? `收起 ${item.label}` : `展开 ${item.label}`}
            >
              <i className={`${item.icon} shrink-0 text-[16px] leading-none`} aria-hidden />
              <span className="min-w-0 flex-1 truncate">{item.label}</span>
              <span className="shrink-0 text-[10px] text-slate-400">
                {isGroupOpen ? <CaretUpOutlined /> : <CaretDownOutlined />}
              </span>
            </button>
          ) : item.href ? (
            <Link
              href={item.href}
              className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] text-slate-300 transition-colors hover:bg-white/8 hover:text-white"
              title={item.label}
            >
              <i className={`${item.icon} shrink-0 text-[16px] leading-none`} aria-hidden />
              <span className="min-w-0 flex-1 truncate">{item.label}</span>
            </Link>
          ) : (
            <button
              type="button"
              className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-[13px] text-slate-300 transition-colors hover:bg-white/8 hover:text-white"
              title={`${item.label}（占位）`}
              onClick={() => onPlaceholderClick(item.label)}
            >
              <i className={`${item.icon} shrink-0 text-[16px] leading-none`} aria-hidden />
              <span className="min-w-0 flex-1 truncate">{item.label}</span>
            </button>
          )}

          {hasChildren && isGroupOpen ? (
            <div
              className={`mt-0.5 space-y-0.5 ${
                item.id === 'global' ? 'rounded-lg bg-white/5 py-1' : ''
              }`}
              role="group"
              aria-label={item.label}
            >
              {item.children!.map((child) => {
                const leafClass = `flex w-full items-center rounded-md py-1.5 pl-9 pr-2.5 text-left text-[13px] transition-colors ${
                  child.current
                    ? 'font-medium text-white'
                    : 'text-slate-400 hover:bg-white/8 hover:text-slate-100'
                }`;
                if (child.href) {
                  return (
                    <Link
                      key={child.id}
                      href={child.href}
                      className={leafClass}
                      aria-current={child.current ? 'page' : undefined}
                      data-selected={child.current ? 'true' : 'false'}
                    >
                      {child.label}
                    </Link>
                  );
                }
                return (
                  <button
                    key={child.id}
                    type="button"
                    className={leafClass}
                    title={`${child.label}（占位）`}
                    onClick={() => onPlaceholderClick(child.label)}
                  >
                    {child.label}
                  </button>
                );
              })}
            </div>
          ) : null}
        </div>
      );
    });

  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: themeColor.primary,
          colorLink: themeColor.primary,
          colorLinkHover: themeColor.primary,
          colorLinkActive: themeColor.primary,
        },
      }}
    >
      <div className="flex h-screen overflow-hidden bg-[#f8faff]">
        {/* wood. Projects Zone 深色侧栏（替换原 w-16 灰图标栏） */}
        <aside
          className="fixed left-0 top-0 z-30 flex h-screen flex-col border-r border-white/5 bg-[#2f3640] text-slate-200"
          style={{ width: sidebarW }}
          aria-label="项目数据中台导航"
          data-testid="wood-shell-sidebar"
          data-collapsed={sidebarCollapsed ? 'true' : 'false'}
        >
          <div
            className={`flex shrink-0 items-center border-b border-white/10 ${
              sidebarCollapsed ? 'justify-center px-1 py-4' : 'gap-2 px-4 py-4'
            }`}
          >
            {sidebarCollapsed ? (
              <Link
                href="/"
                className="flex h-9 w-9 items-center justify-center rounded-md bg-white/10 text-sm font-bold text-white"
                title="wood. Projects Zone"
              >
                W
              </Link>
            ) : (
              <div className="min-w-0">
                <Link href="/" className="block leading-tight hover:opacity-90">
                  <span className="text-[17px] font-bold tracking-tight text-white">
                    wood.
                  </span>
                  <span className="ml-1 text-[13px] font-medium text-slate-300">
                    Projects Zone
                  </span>
                </Link>
                <div className="mt-0.5 text-[11px] text-slate-400">项目数据中台</div>
              </div>
            )}
          </div>

          <nav
            className={`flex flex-1 flex-col gap-1 overflow-y-auto py-3 ${
              sidebarCollapsed ? 'items-center px-1' : ''
            }`}
            aria-label="主菜单"
          >
            {renderShellNav()}
          </nav>

          <div
            className={`flex shrink-0 border-t border-white/10 p-2 ${
              sidebarCollapsed ? 'justify-center' : 'justify-end'
            }`}
          >
            <button
              type="button"
              className="inline-flex h-8 w-8 items-center justify-center rounded-md text-slate-400 transition-colors hover:bg-white/10 hover:text-white"
              aria-label={sidebarCollapsed ? '展开侧栏' : '折叠侧栏'}
              title={sidebarCollapsed ? '展开侧栏' : '折叠侧栏'}
              data-testid="shell-sidebar-collapse"
              onClick={() => setSidebarCollapsed((v) => !v)}
            >
              <span className="text-base leading-none" aria-hidden>
                {sidebarCollapsed ? '»' : '«'}
              </span>
            </button>
          </div>
        </aside>

        <div
          className="flex h-screen w-full flex-col overflow-hidden bg-[#f8faff]"
          style={{ marginLeft: sidebarW }}
        >
          <div
            className="fixed right-0 top-0 z-20 flex h-20 items-center justify-between bg-white px-6 shadow-sm"
            style={{ left: sidebarW }}
          >
            <h2 className="text-2xl" data-testid="board-main-header">
              全局看板 &gt; 运营看板 &gt;{' '}
              {unit === '全部板块' ? 'Board' : unit}
            </h2>
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-500">主题</span>
              <Select
                value={theme}
                onChange={setTheme}
                options={THEME_OPTIONS}
                style={{ width: 128 }}
                aria-label="主题颜色"
              />
            </div>
          </div>

          {/* 壳级筛选条：header 下、目录与内容上；整树（含占位）始终可见 */}
          <div
            className="fixed right-0 top-20 z-20 flex h-12 items-center gap-4 border-b border-slate-200 bg-white px-6"
            style={{ left: sidebarW }}
            data-testid="board-shell-filters"
            aria-label="壳级筛选"
          >
            <span
              className="inline-flex h-8 items-center rounded-md border border-slate-200 bg-slate-50 px-3 text-sm font-medium text-slate-700"
              data-testid="shell-year-lock"
              title="统计年度固定为 2026，不可更改"
            >
              2026年度
            </span>
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-500">组织板块</span>
              <Select
                value={unit}
                onChange={setUnit}
                options={UNIT_OPTIONS}
                style={{ width: 220 }}
                aria-label="组织板块"
                data-testid="shell-unit-select"
              />
            </div>
            {placeholderHint ? (
              <span
                className="ml-auto rounded bg-slate-800/90 px-3 py-1 text-xs text-white"
                role="status"
                data-testid="shell-placeholder-toast"
              >
                {placeholderHint}
              </span>
            ) : null}
          </div>

          <div className="flex h-full flex-1 overflow-hidden pt-[128px]">
            <aside
              className="board-tree flex w-56 shrink-0 flex-col border-r border-slate-200 bg-white"
              aria-label="看板目录"
            >
              <div className="border-b border-slate-100 px-3 py-3 text-xs font-semibold tracking-wide text-slate-500">
                看板目录
              </div>
              <nav className="board-tree-nav flex-1 overflow-auto p-2" role="tree">
                <ul className="board-tree m-0 list-none p-0">{renderTreeNodes(TREE)}</ul>
              </nav>
            </aside>

            <div className="relative min-w-0 flex-1 overflow-hidden bg-white">
              <iframe
                ref={opsIframeRef}
                title="运营看板202610 · 运营看板"
                src={OPS_IFRAME_SRC}
                className={`absolute inset-0 block h-full w-full border-0 ${showOps ? 'z-10 opacity-100' : 'pointer-events-none z-0 opacity-0'}`}
                allow="same-origin"
                onLoad={onOpsIframeLoad}
              />
              <iframe
                ref={completedIframeRef}
                title="运营看板202610 · 完成合同额看板"
                src={COMPLETED_IFRAME_SRC}
                className={`absolute inset-0 block h-full w-full border-0 ${showCompleted ? 'z-10 opacity-100' : 'pointer-events-none z-0 opacity-0'}`}
                allow="same-origin"
                onLoad={onCompletedIframeLoad}
              />
              {showPlaceholder && selectedMeta ? (
                <div className="absolute inset-0 z-20">
                  <PlaceholderView title={selectedMeta.label} />
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </ConfigProvider>
  );
}
