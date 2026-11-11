'use client';
import { useState } from 'react';
import { CaretDownOutlined, CaretRightOutlined } from '@ant-design/icons';
import { TREE, type TreeNode, type NodeId } from '../config/boards';
export default function DashboardDirectory({selected, setSelected, unit, themeColor}: {selected:NodeId;setSelected:(id:NodeId)=>void;unit:string;themeColor:{primary:string;soft:string}}) {
 const [expanded,setExpanded]=useState<Record<string,boolean>>({market:true,'pdf-reports':true});
 const onTreeClick=(node:TreeNode)=>{if(!node.leaf)setExpanded(prev=>({...prev,[node.id]:!prev[node.id]}));else setSelected(node.id);};
  const renderTreeNodes = (nodes: TreeNode[], depth = 0) =>
    nodes.filter(node=>!node.companyOnly||unit==='全部板块').map((node) => {
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
            aria-expanded={node.leaf ? undefined : isOpen}
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


return (            <aside
              className="board-tree flex w-56 shrink-0 flex-col overflow-y-auto border-r border-slate-200 bg-white"
              aria-label="看板目录"
            >
              <div className="border-b border-slate-100 px-3 py-3 text-xs font-semibold tracking-wide text-slate-500">
                看板目录
              </div>
              <nav className="board-tree-nav shrink-0 p-2" role="tree">
                <ul className="board-tree m-0 list-none p-0">{renderTreeNodes(TREE)}</ul>
              </nav>
              <section
                className="mx-3 mb-4 mt-3 shrink-0 border-t border-slate-100 pt-4"
                aria-label="经营红绿灯（示例）"
                data-testid="directory-health-lights"
              >
                <div className="mb-2 flex items-center justify-between text-[11px] text-slate-400">
                  <span>经营红绿灯</span>
                  <span>示例</span>
                </div>
                <ul className="m-0 list-none space-y-1 p-0">
                  {[
                    { label: '合同签约', status: '正常', color: 'bg-emerald-500', textColor: 'text-emerald-600' },
                    { label: '资金回收', status: '关注', color: 'bg-amber-500', textColor: 'text-amber-600' },
                    { label: '交付保障', status: '预警', color: 'bg-red-500', textColor: 'text-red-600' },
                  ].map((item) => (
                    <li key={item.label} className="flex items-center justify-between py-2 text-[13px]">
                      <span className="text-slate-700">{item.label}</span>
                      <span className={`inline-flex items-center gap-1.5 text-xs ${item.textColor}`}>
                        <span className={`h-2 w-2 rounded-full ${item.color}`} aria-hidden="true" />
                        {item.status}
                      </span>
                    </li>
                  ))}
                </ul>
              </section>
            </aside>);
}
