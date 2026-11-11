'use client';
import {useState,useEffect} from 'react';
import {TREE,findNode,UNIT_OPTIONS,THEME_COLORS,SIDEBAR_COLLAPSED_W,SIDEBAR_EXPANDED_W,type NodeId} from '../config/boards';
export function useBoardState(){
 const [selected,setSelected]=useState<NodeId>('current');
 const [sidebarCollapsed,setSidebarCollapsed]=useState(false);
 const [theme,setTheme]=useState('blue'),[unit,setUnit]=useState('全部板块');
 const [placeholderHint,setPlaceholderHint]=useState<string|null>(null);
 useEffect(()=>{if(unit!=='全部板块'&&findNode(TREE,selected)?.companyOnly)setSelected('current');},[unit,selected]);
 useEffect(()=>{const raw=new URLSearchParams(window.location.search).get('unit');if(raw&&UNIT_OPTIONS.some(row=>row.value===raw))setUnit(raw);},[]);
 useEffect(()=>{if(!placeholderHint)return;const timer=setTimeout(()=>setPlaceholderHint(null),2200);return()=>clearTimeout(timer);},[placeholderHint]);
 return {selected,setSelected,sidebarCollapsed,setSidebarCollapsed,theme,setTheme,unit,setUnit,placeholderHint,
  onPlaceholderClick:(label:string)=>setPlaceholderHint(`${label}（占位，暂无独立页）`),
  themeColor:THEME_COLORS[theme]??THEME_COLORS.blue,sidebarW:sidebarCollapsed?SIDEBAR_COLLAPSED_W:SIDEBAR_EXPANDED_W};
}
