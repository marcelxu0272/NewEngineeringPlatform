'use client'

import { useState, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

type Personnel = {
  name: string; email: string; phone?: string; department?: string; major?: string;
  projects?: string[]; industries?: string[]; regions?: string[]; skills?: string[]; qualifications?: string[]; location?: string;
};
import { 
  MailOutlined, 
  PhoneOutlined, 
  EnvironmentOutlined,
  ProjectOutlined,    // 项目图标
  BankOutlined,       // 行业图标
  ToolOutlined,       // 技能图标
  TrophyOutlined,     // 资质图标
  BookOutlined        // 专业图标
} from '@ant-design/icons'

export default function PersonnelCards() {
  const [searchTerm, setSearchTerm] = useState('')
  const [departmentFilter, setDepartmentFilter] = useState('')
  const [majorFilter, setMajorFilter] = useState('')
  const [personnelData, setPersonnelData] = useState<Personnel[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/sme/personnel').then((res) => res.json()).then((d) => { setPersonnelData(d); setLoading(false); }).catch(() => setLoading(false))
  }, [])

  const departments = Array.from(new Set(personnelData.map(p => p.department).filter(Boolean))) as string[]
  const majors = Array.from(new Set(personnelData.map(p => p.major).filter(Boolean))) as string[]

  const filteredData = personnelData.filter(person => {
    const matchesSearch = Object.values(person).some(value => 
      Array.isArray(value) 
        ? value.some(item => item.toLowerCase().includes(searchTerm.toLowerCase()))
        : typeof value === 'string' && value.toLowerCase().includes(searchTerm.toLowerCase())
    )
    const matchesDepartment = !departmentFilter || person.department === departmentFilter
    const matchesMajor = !majorFilter || person.major === majorFilter

    return matchesSearch && matchesDepartment && matchesMajor
  })

  if (loading) return <div className="text-gray-500 p-4">加载中...</div>

  return (
    <div>
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <Input
          placeholder="搜索..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="md:w-64"
        />
        <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
          <SelectTrigger className="md:w-48">
            <SelectValue placeholder="所有部门" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">所有部门</SelectItem>
            {departments.map(dept => (
              <SelectItem key={dept} value={dept}>{dept}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={majorFilter} onValueChange={setMajorFilter}>
          <SelectTrigger className="md:w-48">
            <SelectValue placeholder="所有专业" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">所有专业</SelectItem>
            {majors.map(major => (
              <SelectItem key={major} value={major}>{major}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredData.map((person, index) => (
          <PersonCard key={index} person={person} />
        ))}
      </div>
    </div>
  )
}

// 添加这个辅助函数来格式化手机号
function formatPhoneNumber(phoneNumber: string): string {
  if (phoneNumber.length !== 11) return phoneNumber; // 如果不是11位则返回原始号码
  return `${phoneNumber.slice(0, 3)} ${phoneNumber.slice(3, 7)} ${phoneNumber.slice(7)}`;
}

// 修改这个函数来返回纯色而不是渐变色
function getLocationGradient(location: string): string {
  const colorMap: { [key: string]: string } = {
    '徐汇': 'bg-[#f5fffe]',
    '金山': 'bg-[#f5f9ff]',
    '沈阳': 'bg-[#fff7f5]',
    '惠州': 'bg-[#fdf5fd]',
    '银川': 'bg-[#f5fdff]'
  }
  return colorMap[location] || 'bg-[#f8f8f8]' // 默认背景v色
}

function PersonCard({ person }: { person: any }) {
  return (
    <Card className={cn(
      "relative hover:shadow-lg transition-shadow duration-300 rounded-none border-none",
      getLocationGradient(person.location)
    )}>
      <div className="flex h-full">
        {/* 左侧信息区域 */}
        <div className="w-1/3 p-6 flex flex-col justify-between h-full">
          <div className="mb-4">
            <CardTitle className="text-2xl font-bold text-gray-800">{person.name}</CardTitle>
            <p className="text-sm font-medium text-gray-600 mt-1">
              {person.department} · {person.major}
            </p>
          </div>
          
          <div className="space-y-3">
            <div className="flex items-center text-gray-600">
              <MailOutlined className="mr-3 text-gray-400" /> 
              <a 
                href={`mailto:${person.email}`} 
                className="text-sm hover:text-[#00706a] transition-colors cursor-pointer"
              >
                {person.email}
              </a>
            </div>
            <div className="flex items-center text-gray-600">
              <PhoneOutlined className="mr-3 text-gray-400" /> 
              <span className="text-sm">{formatPhoneNumber(person.phone)}</span>
            </div>
            <div className="flex items-center text-gray-600">
              <EnvironmentOutlined className="mr-3 text-gray-400" /> 
              <span className="text-sm">{person.location}</span>
            </div>
          </div>
        </div>

        {/* 右侧技能区域 */}
        <div className="w-2/3 p-6">
          <div className="space-y-4">
            {/* 行业经验 */}
            <div>
              <div className="flex items-center mb-2">
                <BankOutlined className="mr-2 text-gray-400" />
                <span className="text-sm font-medium text-gray-400">擅长领域</span>
              </div>
              <div className="flex flex-wrap gap-1.5">  {/* 移除 max-h-[80px] overflow-y-auto */}
                {person.industries?.map((item: string, index: number) => (
                  <Badge key={`industry-${index}`} variant="outline" className="text-sm text-gray-600 bg-transparent hover:bg-transparent">
                    {item}
                  </Badge>
                ))}
              </div>
            </div>

            {/* 项目经验 */}
            <div>
              <div className="flex items-center mb-2">
                <ProjectOutlined className="mr-2 text-gray-400" />
                <span className="text-sm font-medium text-gray-400">项目经历</span>
              </div>
              <div className="flex flex-wrap gap-1.5">  {/* 移除 max-h-[80px] overflow-y-auto */}
                {person.projects?.map((item: string, index: number) => (
                  <Badge key={`project-${index}`} variant="outline" className="text-sm text-gray-600 bg-transparent hover:bg-transparent">
                    {item}
                  </Badge>
                ))}
              </div>
            </div>

            {/* 资质与技能 */}
            <div>
              <div className="flex items-center mb-2">
                <TrophyOutlined className="mr-2 text-gray-400" />
                <span className="text-sm font-medium text-gray-400">资质与技能</span>
              </div>
              <div className="flex flex-wrap gap-1.5">  {/* 移除 max-h-[80px] overflow-y-auto */}
                {[...(person.qualifications || []), ...(person.skills || [])].map((item: string, index: number) => (
                  <Badge key={`skill-qual-${index}`} variant="outline" className="text-sm text-gray-600 bg-transparent hover:bg-transparent">
                    {item}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Card>
  )
}

function getFieldTitle(field: keyof typeof titles) {
  const titles = {
    projects: '📂 项目',
    industries: '🏭 行业',
    skills: '🛠️ 技能',
    qualifications: '🏆 资质'
  }
  return titles[field] || field
}

// 添加这个函数来为不同的专业分配颜色
function getMajorColor(major: string): string {
  const colorMap: { [key: string]: string } = {
    // '工艺': 'bg-blue-100 text-blue-800 hover:bg-blue-100 hover:text-blue-800',
    // '静设备': 'bg-blue-100 text-blue-800 hover:bg-blue-100 hover:text-blue-800',
    // '结构': 'bg-green-100 text-green-800 hover:bg-green-100 hover:text-green-800',
    // '总图': 'bg-green-100 text-green-800 hover:bg-green-100 hover:text-green-800',
    // '暖通': 'bg-green-100 text-green-800 hover:bg-green-100 hover:text-green-800',
    // '建筑': 'bg-green-100 text-green-800 hover:bg-green-100 hover:text-green-800',
    // '电气': 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100 hover:text-yellow-800',
    // '电信': 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100 hover:text-yellow-800',
    // '仪表': 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100 hover:text-yellow-800',
    // '管道': 'bg-red-100 text-red-800 hover:bg-red-100 hover:text-red-800',
    // '材料': 'bg-red-100 text-red-800 hover:bg-red-100 hover:text-red-800',
    // '应力': 'bg-red-100 text-red-800 hover:bg-red-100 hover:text-red-800',
    // '给排水': 'bg-red-100 text-red-800 hover:bg-red-100 hover:text-red-800',
    // '数字技术': 'bg-purple-100 text-purple-800 hover:bg-purple-100 hover:text-purple-800',
    // '采购': 'bg-pink-100 text-pink-800 hover:bg-pink-100 hover:text-pink-800',
    // '合同': 'bg-orange-100 text-orange-800 hover:bg-orange-100 hover:text-orange-800',
    // '费控': 'bg-orange-100 text-orange-800 hover:bg-orange-100 hover:text-orange-800',
    // '进度计划': 'bg-orange-100 text-orange-800 hover:bg-orange-100 hover:text-orange-800',
    // '施工管理': 'bg-teal-100 text-teal-800 hover:bg-teal-100 hover:text-teal-800',
    // '安全': 'bg-teal-100 text-teal-800 hover:bg-teal-100 hover:text-teal-800',
    // '质量': 'bg-teal-100 text-teal-800 hover:bg-teal-100 hover:text-teal-800'
    // 可以根据需要添加更多专业
  }
  return colorMap[major] || 'bg-[#85e5a7] text-[#00706a] hover:bg-[#85e5a7] hover:text-[#00706a]'  // 默认颜色
}
