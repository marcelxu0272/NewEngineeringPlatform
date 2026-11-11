'use client';
import {ConfigProvider} from 'antd';
import 'remixicon/fonts/remixicon.css';
import MainSidebar from './shell/MainSidebar';
import BoardHeader from './shell/BoardHeader';
import DashboardDirectory from './shell/DashboardDirectory';
import DashboardHost from './host/DashboardHost';
import {useBoardState} from './shell/useBoardState';

/** Board composition root; navigation and view behavior live in their owning modules. */
export default function OperationsDashboard202610BoardPage(){
 const board=useBoardState(),{themeColor,sidebarW}=board;
 return <ConfigProvider theme={{token:{colorPrimary:themeColor.primary,colorLink:themeColor.primary,colorLinkHover:themeColor.primary,colorLinkActive:themeColor.primary}}}>
  <div className="flex h-screen overflow-hidden bg-[#f8faff]">
   <MainSidebar {...board}/>
   <div className="flex h-screen w-full flex-col overflow-hidden bg-[#f8faff]" style={{marginLeft:sidebarW}}>
    <BoardHeader {...board}/>
    <div className="flex h-full flex-1 overflow-hidden pt-[128px]">
     <DashboardDirectory {...board}/>
     <DashboardHost selected={board.selected} theme={board.theme} unit={board.unit} primary={themeColor.primary}/>
    </div>
   </div>
  </div>
 </ConfigProvider>;
}
