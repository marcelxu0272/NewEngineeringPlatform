import Link from 'next/link';

export default function CatalogConfigPage() {
  return (
    <main className="mx-auto max-w-xl px-6 py-16 text-gray-700">
      <h1 className="text-2xl font-semibold text-gray-800">目录为只读</h1>
      <p className="mt-3 text-sm leading-6 text-gray-600">
        公开发布的演示只展示现有功能卡片，不提供修改名称、标签或缩略图。
      </p>
      <Link href="/" className="mt-6 inline-block text-sm text-[#00706a]">
        返回首页
      </Link>
    </main>
  );
}
