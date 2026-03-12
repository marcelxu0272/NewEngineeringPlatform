'use client';

import Link from 'next/link';
import { DashboardOutlined, FileTextOutlined, SettingOutlined } from '@ant-design/icons';

export default function ProjectRequirementsPage() {
  return (
    <div className="flex min-h-screen">
      {/* 左侧边栏：与 dashboard/org/[slug] 一致 */}
      <div className="fixed left-0 top-0 h-screen w-16 bg-gray-800 p-2 flex flex-col items-center z-10">
        <Link href="/" className="mb-8 mt-4 w-12 h-12 bg-white rounded-full flex items-center justify-center hover:opacity-90">
          <span className="text-gray-800 text-2xl font-bold">W</span>
        </Link>
        <div className="flex-1 flex flex-col mt-8 space-y-8">
          <Link href="/dashboard" className="w-6 h-6 text-gray-400 hover:bg-gray-700 rounded-lg flex items-center justify-center" title="项目中台">
            <DashboardOutlined className="w-6 h-6" />
          </Link>
          <span className="w-6 h-6 text-white bg-gray-700 rounded-lg flex items-center justify-center" title="关键项目岗位需求">
            <FileTextOutlined className="w-6 h-6" />
          </span>
          <span className="w-6 h-6 text-gray-400 hover:bg-gray-700 rounded-lg flex items-center justify-center">
            <SettingOutlined className="w-6 h-6" />
          </span>
        </div>
      </div>

      {/* 主内容区：顶栏 + iframe */}
      <div className="ml-16 flex flex-col flex-1 min-h-screen bg-gray-50 w-[calc(100%-4rem)]">

        <main className="flex-1 min-h-0">
          <iframe
            src="/key-project-requirements/index_v2.html"
            title="关键项目岗位需求"
            className="w-full h-full border-0"
            sandbox="allow-same-origin allow-scripts allow-forms allow-popups"
          />
        </main>
      </div>
    </div>
  );
}
