'use client';

import React from 'react';
import { useState, useEffect } from 'react';
import { Search, HelpCircle, Heart, User, Calendar, BarChart2, Menu, FileText, Users, Briefcase, Mail, Clock, Folder, Truck, CreditCard, Phone, Book, GraduationCap, Target, PieChart, Settings, GitBranch, LogOut, Lock, MessageCircle, QrCode, ChevronRight, Edit } from 'lucide-react';
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

const HomePage = () => {
  const [showQRCode, setShowQRCode] = useState(false);
  const [image1Src, setImage1Src] = useState('');
  const [image2Src, setImage2Src] = useState('');

  useEffect(() => {
    import('../lib/HSE-POL-100001.png').then(image => setImage1Src(image.default.src));
    import('../lib/wood_quality_policy.jpg').then(image => setImage2Src(image.default.src));
  }, []);

  const fileItems = [
    { name: "项目计划模板.docx", date: "2024-09-20" },
    { name: "周报模板.xlsx", date: "2024-09-18" },
    { name: "会议纪要模板.pptx", date: "2024-09-15" },
    { name: "设计规范文档.pdf", date: "2024-09-10" },
    { name: "设计规范文档2.pdf", date: "2024-09-10" },
    { name: "设计规范文档3.pdf", date: "2024-09-10" }
  ];

  const functionModules = [
    "平台首页", "项目中台", "OA管理", "设计管理", "安全管理",
    "质量管理", "费用管理", "文档管理", "合同管理", "资源管理",
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
    { name: "电子签申请", icon: FileText },
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

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-black text-white p-3 shadow-md">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold">Wood 工程平台</h1>
          <div className="flex items-center space-x-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <HelpCircle className="h-4 w-4 mr-1" />
                  帮助中心
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end">
                <DropdownMenuItem>
                  <FileText className="mr-2 h-4 w-4" /> 
                  <span>平台操作手册</span>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <MessageCircle className="mr-2 h-4 w-4" />
                  <span>Help Desk</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <DropdownMenu open={showQRCode} onOpenChange={setShowQRCode}>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <Heart className="h-4 w-4 mr-1" />
                  Heart
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end">
                <div className="p-4 text-center">
                  <div className="bg-gray-200 w-48 h-48 mx-auto flex items-center justify-center">
                    <QrCode className="w-24 h-24 text-gray-600" />
                  </div>
                  <p className="mt-4 text-sm">请用微信扫描此二维码</p>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <User className="h-4 w-4" />
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
      </header>

      <nav className="bg-white shadow-sm sticky top-0 z-10">
        <div className="container mx-auto px-3 py-2">
          <div className="flex items-center space-x-2 overflow-x-auto">
            {functionModules.map((module, index) => (
              <Button key={index} variant="ghost" size="sm" className="text-sm whitespace-nowrap hover:bg-gray-100 transition-colors">
                {module}
              </Button>
            ))}
          </div>
        </div>
      </nav>
      
      <main className="container mx-auto p-4">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          <div className="lg:col-span-3 space-y-4">
            {/* 功能检索 */}
            <div className="relative">
              <Input
                type="search"
                placeholder="搜索功能..."
                className="w-full pl-10 pr-4 py-2 text-sm rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#00a0af] focus:border-transparent"
              />
              <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
            </div>

            {/* 快速入口 */}
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

            {/* 文件模板和重要文件 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader className="py-2 px-4">
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-sm font-medium">文件模板</CardTitle>
                    <ChevronRight className="h-4 w-4 text-gray-400 cursor-pointer" />
                  </div>
                </CardHeader>
                <CardContent className="px-4 py-2">
                  <Tabs defaultValue="company-design">
                    <TabsList className="grid grid-cols-3 h-8 mb-2">
                      <TabsTrigger value="company-design" className="text-xs">公司设计</TabsTrigger>
                      <TabsTrigger value="company-general" className="text-xs">公司通用</TabsTrigger>
                      <TabsTrigger value="wood-general" className="text-xs">Wood通用</TabsTrigger>
                    </TabsList>
                    <TabsContent value="company-design">
                      <ul className="space-y-2 text-xs">
                        {fileItems.map((item, index) => (
                          <li key={index} className="flex justify-between items-center">
                            <span className="truncate">{item.name}</span>
                            <span className="text-gray-500">{item.date}</span>
                          </li>
                        ))}
                      </ul>
                    </TabsContent>
                    <TabsContent value="company-general">
                      <ul className="space-y-2 text-xs">
                        {fileItems.map((item, index) => (
                          <li key={index} className="flex justify-between items-center">
                            <span className="truncate">{item.name}</span>
                            <span className="text-gray-500">{item.date}</span>
                          </li>
                        ))}
                      </ul>
                    </TabsContent>
                    <TabsContent value="wood-general">
                      <ul className="space-y-2 text-xs">
                        {fileItems.map((item, index) => (
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

              <Card>
                <CardHeader className="py-2 px-4">
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-sm font-medium">重要文件</CardTitle>
                    <ChevronRight className="h-4 w-4 text-gray-400 cursor-pointer" />
                  </div>
                </CardHeader>
                <CardContent className="px-4 py-2">
                  <Tabs defaultValue="joint-venture">
                    <TabsList className="grid grid-cols-2 h-8 mb-2">
                      <TabsTrigger value="joint-venture" className="text-xs">合资协议</TabsTrigger>
                      <TabsTrigger value="bcp-qhse" className="text-xs">BCP&QHSE</TabsTrigger>
                    </TabsList>
                    <TabsContent value="joint-venture">
                      <ul className="space-y-2 text-xs">
                        {fileItems.map((item, index) => (
                          <li key={index} className="flex justify-between items-center">
                            <span className="truncate">{item.name}</span>
                            <span className="text-gray-500">{item.date}</span>
                          </li>
                        ))}
                      </ul>
                    </TabsContent>
                    <TabsContent value="bcp-qhse">
                      <ul className="space-y-2 text-xs">
                        {fileItems.map((item, index) => (
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

            {/* 相关网站 */}
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
            {/* 待办事项 */}
            <Card>
              <CardHeader className="bg-gray-50 py-3 px-4">
                <CardTitle className="text-lg font-semibold">待办事项</CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <ul className="space-y-3">
                  {[...Array(5)].map((_, i) => (
                    <li key={i} className="border-b pb-2 last:border-b-0 last:pb-0">
                      <h4 className="font-semibold text-sm">功能名称 {i + 1}</h4>
                      <p className="text-gray-600 text-xs mt-1">概述...</p>
                      <p className="text-gray-400 text-xs mt-1">张三 | 2024-09-24</p>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            {/* SME 按钮 */}
            <Card className="overflow-hidden">
              <CardContent className="p-4 space-y-4">
                <Button
                  className="w-full h-16 text-xl font-bold bg-[#9f0c90] hover:bg-[#9f0c90] text-white transition-colors duration-300"
                >
                  SME 专家资源库
                </Button>
                <Button
                  className="w-full h-16 text-xl font-bold bg-[#9f0c90] hover:bg-[#9f0c90] text-white transition-colors duration-300"
                >
                  工程师资源库
                </Button>
              </CardContent>
            </Card>

            {/* 展板区域 */}
            <Card>
              <CardHeader className="bg-gray-50 py-3 px-4">
                <CardTitle className="text-lg font-semibold">Q&HSSE Policy</CardTitle>
              </CardHeader>
              <CardContent className="p-4">
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
                        alt="A4 文件 2"
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
    </div>
  );
};
export default HomePage;