'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import {
  DashboardOutlined,
  BarChartOutlined,
  SettingOutlined,
  CaretDownOutlined,
  CaretRightOutlined,
} from '@ant-design/icons';
import { ConfigProvider, Select } from 'antd';
import 'remixicon/fonts/remixicon.css';

/**
 * 运营看板202610 · Board 内容区
 * 左：看板目录；右：运营看板 / 完成合同额 iframe / 占位
 * 壳级筛选（锁 2026 + 组织板块）在 header 下、目录与内容上；主题在全局 header
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

/** 与 public/.../index.html 原 unitSelect 选项一致 */
const UNIT_OPTIONS = [
  { value: '全部板块', label: '全部板块' },
  { value: '设计院', label: '设计院' },
  { value: '数字化业务单元', label: '数字化业务单元' },
  { value: '专业室', label: '专业室' },
];

const OPS_IFRAME_SRC = '/operations-dashboard-202610/index.html';
const COMPLETED_IFRAME_SRC = '/operations-dashboard-202610/completed-contract.html';

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
  const [theme, setTheme] = useState('blue');
  const [unit, setUnit] = useState('全部板块');
  const opsIframeRef = useRef<HTMLIFrameElement>(null);
  const completedIframeRef = useRef<HTMLIFrameElement>(null);

  const selectedMeta = useMemo(() => findNode(TREE, selected), [selected]);
  const themeColor = THEME_COLORS[theme] ?? THEME_COLORS.blue;

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
        <div className="fixed left-0 top-0 z-10 flex h-screen w-16 flex-col items-center bg-gray-800 p-2">
          <Link
            href="/"
            className="mb-8 mt-4 flex h-12 w-12 items-center justify-center rounded-full bg-white hover:opacity-90"
          >
            <span className="text-2xl font-bold text-gray-800">W</span>
          </Link>
          <div className="mt-8 flex flex-1 flex-col space-y-8">
            <Link
              href="/dashboard"
              className="flex h-6 w-6 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-700"
              title="项目中台"
            >
              <DashboardOutlined className="h-6 w-6" />
            </Link>
            <Link
              href="/operations-dashboard-202610"
              className="flex h-6 w-6 items-center justify-center rounded-lg bg-gray-700 text-white"
              title="运营看板202610"
            >
              <BarChartOutlined className="h-6 w-6" />
            </Link>
            <span className="flex h-6 w-6 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-700">
              <SettingOutlined className="h-6 w-6" />
            </span>
          </div>
        </div>

        <div className="ml-16 flex h-screen w-full flex-col overflow-hidden bg-[#f8faff]">
          <div className="fixed left-16 right-0 top-0 z-20 flex h-20 items-center justify-between bg-white px-6 shadow-sm">
            <h2 className="text-2xl">全局看板 &gt; 运营看板 &gt; Board</h2>
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
            className="fixed left-16 right-0 top-20 z-20 flex h-12 items-center gap-4 border-b border-slate-200 bg-white px-6"
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
                style={{ width: 180 }}
                aria-label="组织板块"
                data-testid="shell-unit-select"
              />
            </div>
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
