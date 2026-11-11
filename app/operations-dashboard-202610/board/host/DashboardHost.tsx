'use client';
import { IFRAME_NODES,flattenNodes,findNode } from '../config/boards';
import {useIframeBridge} from './useIframeBridge';
import PlaceholderView from './PlaceholderView';
import {viewRenderers,type ViewProps} from '../config/view-registry';
const features=Array.from(new Set(flattenNodes().flatMap(node=>node.content?.kind==='react'?[node.content.renderer]:[])));
export default function DashboardHost({selected,theme,unit,primary}:ViewProps&{theme:string}) {
 const {register,sync}=useIframeBridge(selected,theme,unit),meta=findNode(flattenNodes(),selected);
 return <div className="relative min-w-0 flex-1 overflow-hidden bg-white">
  {IFRAME_NODES.map(node=>node.content?.kind==='iframe'&&<iframe key={node.id} ref={el=>register(node.id,el)} title={node.content.title} src={node.content.src} className={`absolute inset-0 block h-full w-full border-0 ${selected===node.id?'z-10 opacity-100':'pointer-events-none z-0 opacity-0'}`} allow="same-origin" onLoad={()=>sync(node.id)}/>)}
  {features.map(renderer=><div key={renderer} className={`absolute inset-0 ${meta?.content?.kind==='react'&&meta.content.renderer===renderer&&(!meta.companyOnly||unit==='全部板块')?'z-20':'hidden'}`}>{viewRenderers[renderer]({selected,unit,primary})}</div>)}
  {meta?.placeholder&&<div className="absolute inset-0 z-20"><PlaceholderView title={meta.label}/></div>}
 </div>;
}
