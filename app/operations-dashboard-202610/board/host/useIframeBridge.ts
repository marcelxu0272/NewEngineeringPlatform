'use client';
import { useCallback,useEffect,useRef } from 'react';
import {FRAME_MESSAGES} from '@/public/operations-dashboard-202610/shared/host-bridge.js';
export function useIframeBridge(selected:string,theme:string,unit:string) {
 const frames=useRef<Record<string,HTMLIFrameElement|null>>({});
 const sync=useCallback((id:string)=>{
   if(id!==selected)return;
   const win=frames.current[id]?.contentWindow;if(!win)return;
   win.postMessage({type:FRAME_MESSAGES.theme,theme},window.location.origin);
   win.postMessage({type:FRAME_MESSAGES.filter,year:2026,unit},window.location.origin);
 },[selected,theme,unit]);
 useEffect(()=>sync(selected),[selected,sync]);
 const register=useCallback((id:string,frame:HTMLIFrameElement|null)=>{frames.current[id]=frame;},[]);
 return {register,sync};
}
