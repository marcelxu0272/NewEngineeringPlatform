'use client';

import Link from 'next/link';
import { LayoutGrid, FolderKanban, FolderOpen, Settings } from 'lucide-react';
import { ThirdPartyPersonnelApp } from '@/components/third-party-personnel/ThirdPartyPersonnelApp';

export default function ThirdPartyPersonnelPage() {
  return (
    <div className="flex min-h-screen">
      {/* 左侧边栏：贴近旧版视觉 */}
      <div className="fixed left-0 top-0 z-10 flex h-screen w-16 flex-col items-center bg-[#122f42] p-2 shadow-lg">
        <Link
          href="/"
          className="mb-8 mt-4 flex h-12 w-12 items-center justify-center rounded-full bg-white hover:opacity-90"
        >
          <span className="text-2xl font-bold text-[#122f42]">W.</span>
        </Link>
        <div className="mt-8 flex flex-1 flex-col space-y-8">
          <Link
            href="/dashboard"
            className="flex h-6 w-6 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-700"
            title="项目中台"
          >
            <LayoutGrid className="h-5 w-5" />
          </Link>
          <Link
            href="/project-requirements"
            className="flex h-6 w-6 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-700"
            title="关键项目岗位需求"
          >
            <FolderOpen className="h-5 w-5" />
          </Link>
          <span
            className="flex h-6 w-6 items-center justify-center rounded-lg bg-[#0f2433] text-white"
            title="第三方人员管理"
          >
            <FolderKanban className="h-5 w-5" />
          </span>
          <span className="flex h-6 w-6 cursor-default items-center justify-center rounded-lg text-gray-400 hover:bg-gray-700">
            <Settings className="h-5 w-5" />
          </span>
        </div>
      </div>

      {/* 主区域：与 dashboard 相同的顶栏高度与标题样式 */}
      <div className="ml-16 min-h-screen w-[calc(100%-4rem)] space-y-4 overflow-x-hidden bg-[#f8faff] pb-4">
        <div className="fixed left-16 right-0 top-0 z-20 h-20 bg-white shadow-sm">
          <div className="flex items-center justify-between px-6 pt-6">
            <h2 className="text-2xl">第三方人员管理</h2>
            <div className="text-sm text-gray-500">待办(0)&nbsp;&nbsp;&nbsp;您好，admin</div>
          </div>
        </div>

        <div className="pt-20">
          <ThirdPartyPersonnelApp />
        </div>
      </div>
    </div>
  );
}
