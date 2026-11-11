'use client';
import { Select } from 'antd';
import { THEME_OPTIONS,UNIT_OPTIONS } from '../config/boards';
export default function BoardHeader({sidebarW,unit,setUnit,theme,setTheme,placeholderHint}:{sidebarW:number;unit:string;setUnit:(unit:string)=>void;theme:string;setTheme:(theme:string)=>void;placeholderHint:string|null}){return <>          <div
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

</>;}
