'use client';

/**
 * 组织架构图（四列布局）
 * HTML 源文件请放在：public/202602/组织架构图_四列布局_base copy.html
 */
const IFRAME_SRC = '/202602/组织架构图_四列布局_base%20copy.html';

export default function OrgChartPage() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <header className="bg-white border-b border-gray-200 shrink-0">
        <div className="container mx-auto px-4 py-3">
          <h1 className="text-xl font-semibold text-gray-800">组织架构图</h1>
          <p className="text-sm text-gray-500 mt-0.5">四列布局</p>
        </div>
      </header>
      <main className="flex-1 min-h-0 container mx-auto px-4 py-4">
        <div className="h-[calc(100vh-8rem)] w-full rounded-lg border border-gray-200 bg-white overflow-hidden">
          <iframe
            title="组织架构图"
            src={IFRAME_SRC}
            className="w-full h-full border-0"
          />
        </div>
      </main>
    </div>
  );
}
