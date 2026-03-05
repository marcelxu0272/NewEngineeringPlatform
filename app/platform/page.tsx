'use client';

import React from 'react';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Search, HelpCircle, Heart, User, Calendar, BarChart2, FileText, Briefcase, Clock, CreditCard, Book, Target, Settings, GitBranch, LogOut, Lock, QrCode, ChevronRight, Edit, Speech, Headset, ChevronLast, ChevronLeft, Home} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay";
import useEmblaCarousel from 'embla-carousel-react';

const HomePage = () => {
  const [showQRCode, setShowQRCode] = useState(false);
  const [image1Src, setImage1Src] = useState('');
  const [image2Src, setImage2Src] = useState('');
  const router = useRouter();
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true }, [Autoplay()]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [todoTab, setTodoTab] = useState('all');
  const [selectedModule, setSelectedModule] = useState('平台首页');
  const [isButtonsExpanded, setIsButtonsExpanded] = useState(true);

  useEffect(() => {
    setImage1Src('/images/HSE-POL-100001.png');
    setImage2Src('/images/wood_quality_policy.jpg');
  }, []);

  const updateCurrentSlide = () => {
    if (emblaApi) {
      setCurrentSlide(emblaApi.selectedScrollSnap());
    }
  };

  const companyDesignFiles = [
    { name: "设计规范模板.docx", date: "2024-09-20" },
    { name: "图纸模板.dwg", date: "2024-09-18" },
    { name: "设计报告模板.pptx", date: "2024-09-15" },
    { name: "设计计算书模板.xlsx", date: "2024-09-10" },
    { name: "设计审核清单.pdf", date: "2024-09-05" },
    { name: "设计变更申请表.docx", date: "2024-09-01" },
  ];

  const companyGeneralFiles = [
    { name: "项目计划模板.docx", date: "2024-09-20" },
    { name: "周报模板.xlsx", date: "2024-09-18" },
    { name: "会议纪要模板.pptx", date: "2024-09-15" },
    { name: "公司介绍模板.pdf", date: "2024-09-10" },
    { name: "员工手册.pdf", date: "2024-09-05" },
    { name: "费用报销指南.docx", date: "2024-09-01" },
  ];

  const woodGeneralFiles = [
    { name: "Wood品牌指南.pdf", date: "2024-09-20" },
    { name: "全球项目执行标准.docx", date: "2024-09-18" },
    { name: "Wood安全规程.pptx", date: "2024-09-15" },
    { name: "国际合作协议模板.pdf", date: "2024-09-10" },
    { name: "Wood环境政策.pdf", date: "2024-09-05" },
    { name: "全球人力资源政策.docx", date: "2024-09-01" },
  ];

  const jointVentureFiles = [
    { name: "合资协议模板.docx", date: "2024-09-20" },
    { name: "股东会议纪要.pdf", date: "2024-09-18" },
    { name: "利润分配方案.xlsx", date: "2024-09-15" },
    { name: "合资公司章程.pdf", date: "2024-09-10" },
    { name: "合资企业管理制度.docx", date: "2024-09-05" },
    { name: "合资项目风险评估报告.pptx", date: "2024-09-01" },
  ];

  const bcpQhseFiles = [
    { name: "业务连续性计划.pdf", date: "2024-09-20" },
    { name: "QHSSE管理手册.docx", date: "2024-09-18" },
    { name: "风评估报告.xlsx", date: "2024-09-15" },
    { name: "应急响应程序.pptx", date: "2024-09-10" },
    { name: "环境影响评估报告.pdf", date: "2024-09-05" },
    { name: "职业健康安全培训计划.docx", date: "2024-09-01" },
  ];

  const functionModules = [
    "Wood 工程平台首页", "项目中台", "OA管理", "设计管理",
    "费用管理", "文档管理", "合同管理", "资源管理",
    "计划管理", "个人中心", "平台管理", "物资采购", "AI&Tools"
  ];

  const quickAccessItems = [
    { name: "设计文件签署", icon: GitBranch },
    { name: "设计条件流转", icon: GitBranch },
    { name: "设计文件校审", icon: GitBranch },
    { name: "设计文件出图", icon: GitBranch },
    { name: "一致性校验DCT", icon: BarChart2 },
    { name: "外埠差旅报销", icon: CreditCard },
    { name: "市内出差报销", icon: CreditCard },
    { name: "费用报销", icon: CreditCard },
    { name: "工时上报", icon: Clock },
    { name: "远程工作中心", icon: Briefcase },
    { name: "业务管理体系", icon: Settings },
    { name: "项目交付模型", icon: Target },
    { name: "外部标准", icon: Book },
    { name: "电子申请", icon: FileText },
    { name: "电子签待办", icon: FileText },
  ];

  const woodChinaWebsites = [
    "公司官网",
    "SharePoint公司资质",
    "SharePoint公司管理体系(CHN BMS)",
    "SharePoint公司项目",
    "SharePoint培训资料"
  ];

  const woodWebsites = [
    "Official Website",
    "BMS",
    "Service-now",
    "Brand Hub",
    "Moments Hub",
    "Yammer",
    "Lessons Learned",
    "Ethics&Compliance",
    "HSSE&S Learning Hub",
    "Training Center"
  ];

  const carouselItems = [
    { title: "设计工具——塞夫分割器", content: "基于公司标准的CAD图框，批量打印DWG图纸，把一个dwg文件多张图分割成一单张图一个dwg文件和pdf文件，输出的文件名可以自定义格式，PDF文件带数字签名信息。\n【技术支持和安装请联系：吴平均】" },
    { title: "公告2", content: "重要公告内容2..." },
    { title: "公告3", content: "重要公告内容3..." },
    { title: "公告4", content: "重要公告内容4..." },
  ];

  const handleSMEClick = () => {
    router.push('/expert-resources');
  };

  const handleEngineeringSoftwareSkillsClick = () => {
    router.push('/engineering-skills');
  };

  const allTodos = [
    { title: "功能名称 1", description: "概...", assignee: "张三", date: "2024-09-24" },
    { title: "功能名称 2", description: "概述...", assignee: "李四", date: "2024-09-25" },
  ];

  const platformTodos = [
    { title: "中台功能 1", description: "概述...", assignee: "王五", date: "2024-09-26" },
    { title: "中台功能 2", description: "概述...", assignee: "赵六", date: "2024-09-27" },
  ];

  const handleModuleClick = (module: string) => {
    setSelectedModule(module);
    if (module === "项目中台") {
      router.push('/dashboard');
    }
  };

  const handleViewMoreNotices = () => {
    router.push('/notice-board');
  };

  return (
    <div className="min-h-screen bg-gray-100 relative">
      <nav className="bg-white shadow-sm sticky top-0 z-10">
        <div className="container mx-auto px-3 py-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 overflow-x-auto flex-grow">
              {functionModules.map((module, index) => (
                <Button
                  key={index}
                  variant="ghost"
                  size="sm"
                  className={`text-sm whitespace-nowrap transition-colors ${
                    selectedModule === module
                      ? 'bg-[#00706a] text-white hover:bg-[#00706a] hover:text-gray-200'
                      : 'hover:bg-gray-100'
                  }`}
                  onClick={() => handleModuleClick(module)}
                >
                  {module}
                </Button>
              ))}
            </div>

            <Link href="/">
                <Button variant="ghost" size="sm" className="flex items-center gap-2 text-gray-600">
                  <Home className="h-4 w-4" />
                  <span>站点首页</span>
                </Button>
              </Link>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  <span>个人信息</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end">
                <DropdownMenuLabel>个人信息</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <Calendar className="mr-2 h-4 w-4" />
                  <span>年假: 40h | 调休: 16h</span>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <BarChart2 className="mr-2 h-4 w-4" />
                  <span>当月: 85% | 上月: 78%</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <Lock className="mr-2 h-4 w-4" />
                  <span>修改密码</span>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>退出登录</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </nav>

      <main className="container mx-auto p-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 space-y-4">
            <div className="relative">
              <Input
                type="search"
                placeholder="搜索功能..."
                className="w-full pl-10 pr-4 py-2 text-sm rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#00a0af] focus:border-transparent"
              />
              <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
            </div>

            <Card className="overflow-hidden">
              <CardHeader className="bg-gray-50 py-3 px-4">
                <CardTitle className="text-lg font-semibold">快速入口</CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
                  {quickAccessItems.map((item, i) => (
                    <Button key={i} variant="outline" className="h-24 flex flex-col items-center justify-center text-sm hover:bg-gray-50 transition-colors">
                      <item.icon className="h-8 w-8 mb-2" />
                      {item.name}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="h-[240px]">
                <CardHeader className="py-2 px-4">
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-sm font-medium">文件模板</CardTitle>
                    <ChevronRight className="h-4 w-4 text-gray-400 cursor-pointer" />
                  </div>
                </CardHeader>
                <CardContent className="px-4 py-2 overflow-y-auto h-[220px]">
                  <Tabs defaultValue="company-design">
                    <TabsList className="grid grid-cols-3 h-8 mb-2">
                      <TabsTrigger value="company-design" className="text-xs">公司设计</TabsTrigger>
                      <TabsTrigger value="company-general" className="text-xs">公司通用</TabsTrigger>
                      <TabsTrigger value="wood-general" className="text-xs">Wood通用</TabsTrigger>
                    </TabsList>
                    <TabsContent value="company-design">
                      <ul className="space-y-2 text-xs">
                        {companyDesignFiles.map((item, index) => (
                          <li key={index} className="flex justify-between items-center">
                            <span className="truncate">{item.name}</span>
                            <span className="text-gray-500">{item.date}</span>
                          </li>
                        ))}
                      </ul>
                    </TabsContent>
                    <TabsContent value="company-general">
                      <ul className="space-y-2 text-xs">
                        {companyGeneralFiles.map((item, index) => (
                          <li key={index} className="flex justify-between items-center">
                            <span className="truncate">{item.name}</span>
                            <span className="text-gray-500">{item.date}</span>
                          </li>
                        ))}
                      </ul>
                    </TabsContent>
                    <TabsContent value="wood-general">
                      <ul className="space-y-2 text-xs">
                        {woodGeneralFiles.map((item, index) => (
                          <li key={index} className="flex justify-between items-center">
                            <span className="truncate">{item.name}</span>
                            <span className="text-gray-500">{item.date}</span>
                          </li>
                        ))}
                      </ul>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>

              <Card className="h-[240px]">
                <CardHeader className="py-2 px-4">
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-sm font-medium">重要文件</CardTitle>
                    <ChevronRight className="h-4 w-4 text-gray-400 cursor-pointer" />
                  </div>
                </CardHeader>
                <CardContent className="px-4 py-2 overflow-y-auto h-[220px]">
                  <Tabs defaultValue="joint-venture">
                    <TabsList className="grid grid-cols-2 h-8 mb-2">
                      <TabsTrigger value="joint-venture" className="text-xs">合资协议</TabsTrigger>
                      <TabsTrigger value="bcp-qhse" className="text-xs">BCP&QHSE</TabsTrigger>
                    </TabsList>
                    <TabsContent value="joint-venture">
                      <ul className="space-y-2 text-xs">
                        {jointVentureFiles.map((item, index) => (
                          <li key={index} className="flex justify-between items-center">
                            <span className="truncate">{item.name}</span>
                            <span className="text-gray-500">{item.date}</span>
                          </li>
                        ))}
                      </ul>
                    </TabsContent>
                    <TabsContent value="bcp-qhse">
                      <ul className="space-y-2 text-xs">
                        {bcpQhseFiles.map((item, index) => (
                          <li key={index} className="flex justify-between items-center">
                            <span className="truncate">{item.name}</span>
                            <span className="text-gray-500">{item.date}</span>
                          </li>
                        ))}
                      </ul>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader className="py-2 px-4">
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-sm font-medium">WoodChina 相关网站</CardTitle>
                    <Edit className="h-4 w-4 text-gray-400 cursor-pointer" />
                  </div>
                </CardHeader>
                <CardContent className="p-2">
                  <div className="grid grid-cols-2 gap-1">
                    {woodChinaWebsites.map((site, i) => (
                      <Button key={i} variant="outline" size="sm" className="text-xs h-12 whitespace-normal">
                        {site}
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="py-2 px-4">
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-sm font-medium">Wood 相关网站</CardTitle>
                    <Edit className="h-4 w-4 text-gray-400 cursor-pointer" />
                  </div>
                </CardHeader>
                <CardContent className="p-2">
                  <div className="grid grid-cols-2 gap-1">
                    {woodWebsites.map((site, i) => (
                      <Button key={i} variant="outline" size="sm" className="text-xs h-12 whitespace-normal">
                        {site}
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          <div className="space-y-4">
            <Card>
              <CardContent className="p-2">
                <div className="relative" ref={emblaRef}>
                  <Carousel
                    plugins={[
                      Autoplay({
                        delay: 5000,
                      }),
                    ]}
                    onSelect={updateCurrentSlide}
                  >
                    <CarouselContent>
                      {carouselItems.map((item, index) => (
                        <CarouselItem key={index}>
                          <div className="p-4 pb-12">
                            <div className="flex justify-between items-center mb-2">
                              <h3 className="font-semibold text-lg">🔔 {item.title}</h3>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleViewMoreNotices}
                                className="text-xs text-gray-400 hover:text-gray-700 flex items-center"
                              >
                                更多
                                <ChevronRight className="h-4 w-4" />
                              </Button>
                            </div>
                            <p className="text-sm text-gray-600 whitespace-pre-wrap break-words">{item.content}</p>
                          </div>
                        </CarouselItem>
                      ))}
                    </CarouselContent>
                    <div className="absolute bottom-2 left-0 right-0 flex justify-center items-center space-x-2">
                      <CarouselPrevious className="relative left-0 right-0 top-0 translate-y-0" />
                      <span className="text-sm text-gray-600">
                        {currentSlide + 1} / {carouselItems.length}
                      </span>
                      <CarouselNext className="relative left-0 right-0 top-0 translate-y-0" />
                    </div>
                  </Carousel>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <Tabs value={todoTab} onValueChange={setTodoTab} className="w-full">
                  <TabsList className="grid w-full grid-cols-2 mb-4 relative">
                    <TabsTrigger value="all" className="flex items-center justify-center">
                      所有待办(2)
                    </TabsTrigger>
                    <TabsTrigger value="platform" className="flex items-center justify-center">
                      中台待办(2)
                    </TabsTrigger>
                  </TabsList>
                  <TabsContent value="all" className="h-[240px] overflow-y-auto">
                    <ul className="space-y-3">
                      {allTodos.map((todo, i) => (
                        <li key={i} className="border-b pb-2 last:border-b-0 last:pb-0">
                          <h4 className="font-semibold text-sm">{todo.title}</h4>
                          <p className="text-gray-600 text-xs mt-1">{todo.description}</p>
                          <p className="text-gray-400 text-xs mt-1">{todo.assignee} | {todo.date}</p>
                        </li>
                      ))}
                    </ul>
                  </TabsContent>
                  <TabsContent value="platform" className="h-[240px] overflow-y-auto">
                    <ul className="space-y-3">
                      {platformTodos.map((todo, i) => (
                        <li key={i} className="border-b pb-2 last:border-b-0 last:pb-0">
                          <h4 className="font-semibold text-sm">{todo.title}</h4>
                          <p className="text-gray-600 text-xs mt-1">{todo.description}</p>
                          <p className="text-gray-400 text-xs mt-1">{todo.assignee} | {todo.date}</p>
                        </li>
                      ))}
                    </ul>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>

            <Card className="overflow-hidden">
              <CardContent className="p-4 flex space-x-4">
                <Button
                  className="w-1/2 h-12 text-xl font-bold bg-[#00706a] hover:bg-[#00706a] text-white transition-colors duration-300"
                  onClick={handleSMEClick}
                >
                  SME 专家资源
                </Button>
                <Button
                  className="w-1/2 h-12 text-xl font-bold bg-[#00706a] hover:bg-[#00706a] text-white transition-colors duration-300"
                  onClick={handleEngineeringSoftwareSkillsClick}
                >
                  工程软件技能
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="py-2 px-4">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-sm font-medium">Q&HSSE Policy</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-2 h-[340px]">
                <div className="grid grid-cols-2 gap-4">
                  {image1Src && (
                    <div className="aspect-[1/1.414] w-full relative rounded-md shadow-sm hover:shadow-md transition-shadow overflow-hidden">
                      <Image
                        src={image1Src}
                        alt="A4 文件 1"
                        layout="fill"
                        objectFit="cover"
                      />
                    </div>
                  )}
                  {image2Src && (
                    <div className="aspect-[1/1.414] w-full relative rounded-md shadow-sm hover:shadow-md transition-shadow overflow-hidden">
                      <Image
                        src={image2Src}
                        alt="A4 件 2"
                        layout="fill"
                        objectFit="cover"
                      />
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <div className="fixed bottom-4 left-4 flex flex-col space-y-2">
        <Button
          variant="default"
          onClick={() => setIsButtonsExpanded(!isButtonsExpanded)}
          className="w-12 h-12 bg-[#555555]/50 hover:bg-[#333333]/50 text-white shadow-md transition-all duration-300 ease-in-out flex items-center justify-center rounded-sm"
        >
          <ChevronLeft className={`h-4 w-4 transition-transform duration-300 ${isButtonsExpanded ? '' : 'rotate-180'}`} />
        </Button>

        <Button
          variant="default"
          className={`${
            isButtonsExpanded ? 'w-36' : 'w-12'
          } h-12 bg-[#555555] hover:bg-[#f3a547] text-white shadow-md transition-all duration-300 ease-in-out flex items-center justify-start pl-3 rounded-sm`}
          title="欢迎询问各类IT/ES/Wood工程平台的问题"
        >
          <Headset className="h-6 w-6 flex-shrink-0" />
          {isButtonsExpanded && <span className="text-base ml-3">Help Desk</span>}
        </Button>
        <Button
          variant="default"
          className={`${
            isButtonsExpanded ? 'w-36' : 'w-12'
          } h-12 bg-[#555555] hover:bg-[#a50164] text-white shadow-md transition-all duration-300 ease-in-out flex items-center justify-start pl-3 rounded-sm`}
          title="报告您对任何不道德的、非法的或可疑活动的担忧"
        >
          <Speech className="h-6 w-6 flex-shrink-0" />
          {isButtonsExpanded && <span className="text-base ml-3">Speak Up</span>}
        </Button>
        <Button
          variant="default"
          onClick={() => setShowQRCode(!showQRCode)}
          className={`${
            isButtonsExpanded ? 'w-36' : 'w-12'
          } h-12 bg-[#555555] hover:bg-[#00a0af] text-white shadow-md transition-all duration-300 ease-in-out flex items-center justify-start pl-3 rounded-sm`}
          title="填写您的安全观察"
        >
          <Heart className="h-6 w-6 flex-shrink-0" />
          {isButtonsExpanded && <span className="text-base ml-3">Heart</span>}
        </Button>
      </div>

      <Dialog open={showQRCode} onOpenChange={setShowQRCode}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Heart 卡片</DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center p-6">
            <div className="bg-gray-100 w-64 h-64 flex items-center justify-center">
              <QrCode className="w-40 h-40 text-gray-600" />
            </div>
          </div>
          <p className="text-center text-sm text-gray-500">
            请使用微信扫描此二维码填写您的安全观察
          </p>
        </DialogContent>
      </Dialog>
    </div>
  );
};
export default HomePage;
