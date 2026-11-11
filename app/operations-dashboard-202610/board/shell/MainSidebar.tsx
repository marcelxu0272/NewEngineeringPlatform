'use client';
import { useState } from 'react';
import Link from 'next/link';
import { CaretDownOutlined,CaretUpOutlined } from '@ant-design/icons';
import { SHELL_NAV, type NodeId } from '../config/boards';
export default function MainSidebar({sidebarCollapsed,setSidebarCollapsed,sidebarW,setSelected,onPlaceholderClick}:{sidebarCollapsed:boolean;setSidebarCollapsed:(v:boolean|((v:boolean)=>boolean))=>void;sidebarW:number;setSelected:(id:NodeId)=>void;onPlaceholderClick:(label:string)=>void}) {
const [shellExpanded,setShellExpanded]=useState<Record<string,boolean>>({global:true});
const toggleShellGroup=(id:string)=>setShellExpanded(prev=>({...prev,[id]:!prev[id]}));
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
                    title={child.boardNode ? child.label : `${child.label}（占位）`}
                    onClick={() => child.boardNode ? setSelected(child.boardNode) : onPlaceholderClick(child.label)}
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

return (        <aside
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
        </aside>);
}
