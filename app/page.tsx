import Link from 'next/link';
import { LayoutDashboard, Users, Wrench, Megaphone, BarChart3, FolderKanban, ChevronRight, Network } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const routes = [
  {
    href: '/platform',
    title: 'Wood 工程平台首页',
    description: '快速入口、文件模板、公告与待办',
    icon: LayoutDashboard,
    primary: true,
  },
  {
    href: '/dashboard',
    title: '项目中台',
    description: '项目数据与看板',
    icon: BarChart3,
  },
  {
    href: '/project-management',
    title: '项目管理',
    description: '项目管理相关功能',
    icon: FolderKanban,
  },
  {
    href: '/expert-resources',
    title: 'SME 专家资源',
    description: '专家资源与知识库',
    icon: Users,
  },
  {
    href: '/engineering-skills',
    title: '工程软件技能',
    description: '工程软件与技能资源',
    icon: Wrench,
  },
  {
    href: '/notice-board',
    title: '公告板',
    description: '查看公告与通知',
    icon: Megaphone,
  },
  {
    href: '/org-chart',
    title: '组织架构图',
    description: '四列布局组织架构图',
    icon: Network,
  },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-4">
          <h1 className="text-2xl font-semibold text-gray-800">工程平台</h1>
          <p className="text-sm text-gray-500 mt-1">选择功能模块进入</p>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {routes.map((item) => {
            const Icon = item.icon;
            return (
              <Link key={item.href} href={item.href}>
                <Card
                  className={`h-full transition-all hover:shadow-md hover:border-[#00706a]/30 ${
                    item.primary ? 'border-[#00706a]/50 bg-[#00706a]/5' : ''
                  }`}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <div
                        className={`p-2 rounded-lg ${
                          item.primary ? 'bg-[#00706a] text-white' : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        <Icon className="h-6 w-6" />
                      </div>
                      <ChevronRight className="h-5 w-5 text-gray-400" />
                    </div>
                    <CardTitle className="text-lg mt-2">{item.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-500">{item.description}</p>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </main>
    </div>
  );
}
