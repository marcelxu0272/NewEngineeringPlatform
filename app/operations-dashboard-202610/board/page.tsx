'use client';

import Link from 'next/link';
import {
  DashboardOutlined,
  BarChartOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import { ConfigProvider } from 'antd';

/**
 * 运营看板202610 · Board 内容页
 * Next 灰窄栏壳对齐 org-chart；iframe 承载原 index.html 业务看板
 */
const IFRAME_SRC = '/operations-dashboard-202610/index.html';

export default function OperationsDashboard202610BoardPage() {
  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#007069',
          colorLink: '#007069',
          colorLinkHover: '#005c56',
          colorLinkActive: '#004842',
        },
      }}
    >
      <div className="flex h-screen overflow-hidden bg-[#f8faff]">
        <div className="fixed left-0 top-0 h-screen w-16 bg-gray-800 p-2 flex flex-col items-center z-10">
          <Link
            href="/"
            className="mb-8 mt-4 w-12 h-12 bg-white rounded-full flex items-center justify-center hover:opacity-90"
          >
            <span className="text-gray-800 text-2xl font-bold">W</span>
          </Link>
          <div className="flex-1 flex flex-col mt-8 space-y-8">
            <Link
              href="/dashboard"
              className="w-6 h-6 text-gray-400 hover:bg-gray-700 rounded-lg flex items-center justify-center"
              title="项目中台"
            >
              <DashboardOutlined className="w-6 h-6" />
            </Link>
            <Link
              href="/operations-dashboard-202610"
              className="w-6 h-6 text-white bg-gray-700 rounded-lg flex items-center justify-center"
              title="运营看板202610"
            >
              <BarChartOutlined className="w-6 h-6" />
            </Link>
            <span className="w-6 h-6 text-gray-400 hover:bg-gray-700 rounded-lg flex items-center justify-center">
              <SettingOutlined className="w-6 h-6" />
            </span>
          </div>
        </div>

        <div className="flex flex-col ml-16 w-full h-screen overflow-hidden bg-[#f8faff]">
          <div className="fixed top-0 left-16 right-0 h-20 bg-white shadow-sm z-20">
            <h2 className="pt-6 pl-6 text-2xl">全局看板 &gt; 运营看板 &gt; Board</h2>
          </div>

          <div className="flex-1 pt-20 h-full overflow-hidden">
            <div className="h-full w-full bg-white">
              <iframe
                title="运营看板202610 · Board"
                src={IFRAME_SRC}
                className="w-full h-full border-0 block"
                allow="same-origin"
              />
            </div>
          </div>
        </div>
      </div>
    </ConfigProvider>
  );
}