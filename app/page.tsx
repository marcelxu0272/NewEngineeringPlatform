import Link from 'next/link';
import { LayoutDashboard, Users, Wrench, Megaphone, BarChart3, FolderKanban, ChevronRight, Network, ClipboardList, UserCog, CalendarCheck, Palette, TrendingUp } from 'lucide-react';
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
    href: '/dashboard/org/xx',
    title: 'xx项目群',
    description: 'A/B/C 板块看板与项目动态',
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
  {
    href: '/project-requirements',
    title: '关键项目岗位需求',
    description: '报表体系 · 资源与交付保障、关键岗位人力需求',
    icon: ClipboardList,
  },
  {
    href: '/third-party-personnel',
    title: '第三方人员管理',
    description: '合作方人员信息、CSV 批量导入与导出',
    icon: UserCog,
  },
  {
    href: '/dispatch-attendance',
    title: '派遣人员考勤',
    description: '月度考勤、采购确认、成本测算与应付单推送',
    icon: CalendarCheck,
  },
  {
    href: '/delivery-assurance-action-items-config',
    title: '交付保障行动项配置',
    description: '交付保障行动项配置、审批与版本管理',
    icon: ClipboardList,
  },
  {
    href: '/cash-flow-dashboard',
    title: '现金流仪表盘',
    description: '三级联动现金流看板，WIP / AR / Cash In / Cash Out',
    icon: TrendingUp,
  },
  {
    href: '/design',
    title: '设计系统展示',
    description: '色彩、字体、组件与布局规范预览',
    icon: Palette,
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
