'use client';

import Link from 'next/link';
import {
  DashboardOutlined,
  BarChartOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import { ConfigProvider } from 'antd';

/**
 * 组织架构图（四列布局）
 * HTML 源文件请放在：public/202602/组织架构图_四列布局_base copy.html
 */
const IFRAME_SRC = '/202602/组织架构图_四列布局_base%20copy.html';

export default function OrgChartPage() {
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
        {/* 固定一级目录（与项目中台一致） */}
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
              title="组织架构图"
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
          {/* 固定顶部 header */}
          <div className="fixed top-0 left-16 right-0 h-20 bg-white shadow-sm z-20">
            <h2 className="pt-6 pl-6 text-2xl">全局看板 &gt; 运营看板</h2>
          </div>

          {/* 内容区：组织架构图 iframe */}
          <div className="flex-1 pt-20 h-full overflow-hidden">
            <div className="h-full w-full bg-white">
              <iframe
                title="组织架构图"
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
