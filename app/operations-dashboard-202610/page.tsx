'use client';

import Link from 'next/link';
import {
  DashboardOutlined,
  BarChartOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import { ConfigProvider } from 'antd';

/**
 * 运营看板202610 · 组织图一级入口
 * iframe：public/operations-dashboard-202610/org-entry.html（自 202602 组织图复制）
 * 视觉对齐 /org-chart（Next 灰窄栏壳）
 */
const IFRAME_SRC = '/operations-dashboard-202610/org-entry.html';

export default function OperationsDashboard202610Page() {
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
        {/* 固定一级目录（与 org-chart / 项目中台一致） */}
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
            <span
              className="w-6 h-6 text-white bg-gray-700 rounded-lg flex items-center justify-center"
              title="运营看板202610"
            >
              <BarChartOutlined className="w-6 h-6" />
            </span>
            <span className="w-6 h-6 text-gray-400 hover:bg-gray-700 rounded-lg flex items-center justify-center">
              <SettingOutlined className="w-6 h-6" />
            </span>
          </div>
        </div>

        {/* 主区域：header + 内容 */}
        <div className="flex flex-col ml-16 w-full h-screen overflow-hidden bg-[#f8faff]">
          <div className="fixed top-0 left-16 right-0 h-20 bg-white shadow-sm z-20">
            <h2 className="pt-6 pl-6 text-2xl">全局看板 &gt; 运营看板</h2>
          </div>

          <div className="flex-1 pt-20 h-full overflow-hidden">
            <div className="h-full w-full bg-white">
              <iframe
                title="运营看板202610 · 组织架构"
                src={IFRAME_SRC}
                className="w-full h-full border-0 block"
              />
            </div>
          </div>
        </div>
      </div>
    </ConfigProvider>
  );
}