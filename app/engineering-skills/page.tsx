'use client'

import React, { useEffect, useState, useMemo, useRef } from 'react';
import { Tree, Input, Select, Button, Radio, Modal, Form, List, Space, Divider, Table, Drawer, Tag, Typography, Popconfirm, InputNumber, message, Pagination } from 'antd';
import { ClearOutlined, SettingOutlined, PlusOutlined, MinusCircleOutlined, UploadOutlined, ExpandAltOutlined, ShrinkOutlined, SearchOutlined, ArrowLeftOutlined, MailOutlined, PhoneOutlined, TeamOutlined, EnvironmentOutlined, WechatOutlined } from '@ant-design/icons';
import type { DataNode } from 'antd/es/tree';
import { cn } from '@/lib/utils'
import styled from 'styled-components';
import type { PersonCard } from '@/lib/types/esk';
import type { ColumnsType, ColumnType } from 'antd/es/table';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

// 添加自定义样式的 Radio.Group
const StyledRadioGroup = styled(Radio.Group)`
  .ant-radio-button-wrapper-checked {
    background-color: #007069;
    border-color: #007069;
    color: white;
    &:hover {
      background-color: #007069;
      border-color: #007069;
      color: white;
    }
  }
`;

// 添加一个新的函数来获取所有叶节点的 key
const getAllLeafKeys = (nodes: DataNode[]): string[] => {
  let leafKeys: string[] = [];
  const traverse = (node: DataNode) => {
    if (!node.children || node.children.length === 0) {
      leafKeys.push(node.key as string);
    } else {
      node.children.forEach(traverse);
    }
  };
  nodes.forEach(traverse);
  return leafKeys;
};

// 获取所有叶节点的 key（在组件内根据 treeData 计算）

// 在组件顶部添加以下样式
const tableHeaderStyle = `
  .ant-table-thead > tr > th {
    padding: 8px 16px;
  }
`;

// 修改 leaderboardData 的类型定义
interface LeaderboardPerson {
  name: string;
  hours: number;
}

interface LeaderboardData {
  s3d: LeaderboardPerson[];
  sppid: LeaderboardPerson[];
  spi: LeaderboardPerson[];
}

const EngineeringSystemSkills = () => {
  const router = useRouter();
  const [peopleData, setPeopleData] = useState<PersonCard[]>([]);
  const [treeData, setTreeData] = useState<DataNode[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [checkedSkills, setCheckedSkills] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedRegion, setSelectedRegion] = useState<string>('全部');
  const [selectedSpecialty, setSelectedSpecialty] = useState<string>('全部');
  const [filterMode, setFilterMode] = useState<'all' | 'any'>('any');
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedPerson, setSelectedPerson] = useState<PersonCard | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState<string>('全部');
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [expandedKeys, setExpandedKeys] = useState<React.Key[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [isSkillModalVisible, setIsSkillModalVisible] = useState(false);
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardData>({
    s3d: [] as LeaderboardPerson[],
    sppid: [] as LeaderboardPerson[],
    spi: [] as LeaderboardPerson[],
  });
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;
  const cardListRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    Promise.all([
      fetch('/api/esk/people').then((r) => r.json()),
      fetch('/api/esk/tree').then((r) => r.json()),
    ]).then(([people, tree]) => {
      setPeopleData(people);
      setTreeData(tree);
      setDataLoading(false);
    }).catch(() => setDataLoading(false));
  }, []);

  const allSkillKeys = useMemo(() => getAllLeafKeys(treeData), [treeData]);

  // 添加搜索节点的函数
  const onSearchNode = (value: string) => {
    setSearchValue(value);
    if (!value) {
      setExpandedKeys([]);
      return;
    }

    const expandedKeys = findExpandedKeys(treeData, value);
    setExpandedKeys(expandedKeys);
  };

  // 递归查找匹配的节点并返回开的 key
  const findExpandedKeys = (data: DataNode[], searchValue: string): string[] => {
    const result: string[] = [];
    const search = (nodes: DataNode[], parentKey?: string) => {
      let hasMatch = false;
      for (const node of nodes) {
        const nodeMatches = (node.title?.toString() || '').toLowerCase().includes(searchValue.toLowerCase());
        let childrenMatch = false;

        if (node.children) {
          childrenMatch = search(node.children, node.key as string);
        }

        if (nodeMatches || childrenMatch) {
          if (parentKey && !result.includes(parentKey)) {
            result.push(parentKey);
          }
          if (!result.includes(node.key as string)) {
            result.push(node.key as string);
          }
          hasMatch = true;
        }
      }
      return hasMatch;
    };
    search(data);
    return result;
  };

  // 添加新的函数来获取所有非叶节点的 key
  const getAllNonLeafKeys = (nodes: DataNode[]): string[] => {
    let nonLeafKeys: string[] = [];
    const traverse = (node: DataNode) => {
      if (node.children && node.children.length > 0) {
        nonLeafKeys.push(node.key as string);
        node.children.forEach(traverse);
      }
    };
    nodes.forEach(traverse);
    return nonLeafKeys;
  };

  // 获取所有非叶节点的 key
  const allNonLeafKeys = useMemo(() => getAllNonLeafKeys(treeData), [treeData]);

  // 添加切换展开/收缩的函数
  const toggleExpand = () => {
    if (isExpanded) {
      setExpandedKeys([]);
    } else {
      setExpandedKeys(allNonLeafKeys);
    }
    setIsExpanded(!isExpanded);
  };

  const onCheck = (checkedKeys: React.Key[] | { checked: React.Key[]; halfChecked: React.Key[]; }) => {
    if (Array.isArray(checkedKeys)) {
      setCheckedSkills(checkedKeys as string[]);
    } else {
      setCheckedSkills(checkedKeys.checked as string[]);
    }
  };

  // 修改获取专业列表的逻辑
  const specialties = useMemo(() => {
    return Array.from(new Set(peopleData.map(person => {
      if (person.specialty.startsWith('PMC-') || person.specialty.startsWith('EPC-')) {
        return person.specialty;
      }
      const parts = person.specialty.split('-');
      return parts[parts.length - 1] || person.specialty;
    })));
  }, [peopleData]);

  const filteredPeople = useMemo(() => {
    return peopleData.filter(person =>
      (checkedSkills.length === 0 || (filterMode === 'all' ?
        checkedSkills.every(skill => 
          person.skills.some(personSkill => personSkill.name.startsWith(skill)))
        :
        checkedSkills.some(skill => 
          person.skills.some(personSkill => personSkill.name.startsWith(skill)))
      )) &&
      (searchTerm === '' || 
        person.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        person.email.toLowerCase().includes(searchTerm.toLowerCase())
      ) &&
      (selectedDepartment === '全部' || person.department === selectedDepartment) &&
      (selectedRegion === '全部' || person.region === selectedRegion) &&
      (selectedSpecialty === '全部' || formatSpecialty(person.specialty) === selectedSpecialty)
    );
  }, [checkedSkills, searchTerm, selectedDepartment, selectedRegion, selectedSpecialty, filterMode]);

  console.log('Filtered people count:', filteredPeople.length);

  const regions = Array.from(new Set(peopleData.map(person => person.region)));
  const departments = Array.from(new Set(peopleData.map(person => person.department)));

  const clearCheckedSkills = () => {
    setCheckedSkills([]);
    setSearchTerm('');
    setSelectedDepartment('全部');
    setSelectedRegion('全部');
    setSelectedSpecialty('全部');
  };

  const handleSelectChange = (setter: React.Dispatch<React.SetStateAction<string>>) => (value: string | undefined) => {
    setter(value === undefined ? '全部' : value);
  };

  const showModal = () => {
    setIsModalVisible(true);
    setSelectedPerson(null);
    setIsAddingNew(false);
  };

  const handleModalOk = () => {
    // 这里处理保存逻辑
    setIsModalVisible(false);
  };

  const handleModalCancel = () => {
    setIsModalVisible(false);
  };

  const showDrawer = (person: PersonCard) => {
    setSelectedPerson(person);
    setDrawerVisible(true);
  };

  const closeDrawer = () => {
    setDrawerVisible(false);
  };

  const showSkillModal = () => {
    setIsSkillModalVisible(true);
  };

  const handleSkillModalOk = () => {
    // 这里处理录的保存逻辑
    setIsSkillModalVisible(false);
  };

  const handleSkillModalCancel = () => {
    setIsSkillModalVisible(false);
  };

  // 修改计算排行榜的逻辑
  useEffect(() => {
    const calculateLeaderboard = () => {
      const skillData = {
        s3d: [] as LeaderboardPerson[],
        sppid: [] as LeaderboardPerson[],
        spi: [] as LeaderboardPerson[],
      };

      peopleData.forEach(person => {
        // S3D/E3D
        const s3dHours = person.skills
          .filter(skill => skill.name.toLowerCase().includes('s3d') || skill.name.toLowerCase().includes('e3d'))
          .reduce((acc, skill) => acc + (skill.hours || 0), 0);
        if (s3dHours > 0) {
          skillData.s3d.push({ name: person.name, hours: s3dHours });
        }

        // SPPID
        const sppidHours = person.skills
          .filter(skill => skill.name.toLowerCase().includes('sppid'))
          .reduce((acc, skill) => acc + (skill.hours || 0), 0);
        if (sppidHours > 0) {
          skillData.sppid.push({ name: person.name, hours: sppidHours });
        }

        // SPI/AI
        const spiHours = person.skills
          .filter(skill => skill.name.toLowerCase().includes('spi') || skill.name.toLowerCase().includes('ai'))
          .reduce((acc, skill) => acc + (skill.hours || 0), 0);
        if (spiHours > 0) {
          skillData.spi.push({ name: person.name, hours: spiHours });
        }
      });

      // 对每个类别排序并取前5名
      Object.keys(skillData).forEach(key => {
        skillData[key as keyof typeof skillData].sort((a, b) => b.hours - a.hours);
        skillData[key as keyof typeof skillData] = skillData[key as keyof typeof skillData].slice(0, 5);
      });

      setLeaderboardData(skillData);
    };

    calculateLeaderboard();
  }, [peopleData]);

  const paginatedPeople = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredPeople.slice(startIndex, startIndex + pageSize);
  }, [filteredPeople, currentPage]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    if (cardListRef.current) {
      cardListRef.current.scrollTop = 0;
    }
  };

  // 添加一个新的函数来处理排行榜项目的点击
  const handleLeaderboardItemClick = (person: PersonCard) => {
    setSelectedPerson(person);
    setDrawerVisible(true);
  };

  if (dataLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <span className="text-gray-500">加载中...</span>
      </div>
    );
  }

  return (
    <div className="flex h-screen">
      {/* 左侧边栏 */}
      <div className="w-1/4 p-4 border-r flex flex-col">
        {/* 软件技能目录 */}
        <div className="flex-grow overflow-auto mb-4">
          <div className="border rounded-lg p-4 shadow-sm h-full flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">📖 软件技能目录</h2>
              <Button 
                type="default"
                icon={<SettingOutlined />} 
                size="small"
                aria-label="管理技能目录"
                onClick={showSkillModal}
              />
            </div>
            {/* <p className="text-sm text-gray-500 mb-2">请选择需要筛选的软件技能</p> */}
            <div className="flex items-center justify-between mb-2">
              <div className="flex space-x-2">
                <Button 
                  size="small" 
                  onClick={toggleExpand}
                  icon={isExpanded ? <ShrinkOutlined /> : <ExpandAltOutlined />}
                >
                  {isExpanded ? '收缩' : '展开'}
                </Button>
                <Button 
                  onClick={clearCheckedSkills}
                  size="small"
                  icon={<ClearOutlined />}
                >
                  清空
                </Button>
              </div>
              <StyledRadioGroup 
                value={filterMode} 
                onChange={(e) => setFilterMode(e.target.value)}
                size="small"
              >
                <Radio.Button value="any">具备其一</Radio.Button>
                <Radio.Button value="all">同时具备</Radio.Button>
              </StyledRadioGroup>
            </div>
            <Input
              placeholder="搜索技能"
              onChange={(e) => onSearchNode(e.target.value)}
              className="mb-2 bg-gray-100"
              style={{ backgroundColor: '#fafafa' }}
              prefix={<SearchOutlined className="text-gray-400 mr-1" />}
            />
            <div className="flex-grow overflow-auto">
              <Tree
                treeData={treeData}
                checkable
                onCheck={onCheck}
                checkedKeys={checkedSkills}
                expandedKeys={expandedKeys}
                onExpand={(keys) => setExpandedKeys(keys)}
                filterTreeNode={(node) => 
                  searchValue ? (node.title?.toString().toLowerCase() ?? '').includes(searchValue.toLowerCase()) : false
                }
              />
            </div>
          </div>
        </div>
        
        {/* 修改排行榜显示 */}
        <div className="border rounded-lg p-4 shadow-sm">
          <h3 className="text-lg font-semibold mb-4">🏅 软件用量小时数月度排行榜</h3>
          <div className="flex gap-6">
            {/* 排名列 */}
            <div className="flex flex-col justify-between pt-8">
              {[1, 2, 3, 4, 5].map((rank) => (
                <div key={rank} className={cn(
                  "h-8 flex items-center font-medium",
                  rank <= 3 ? 'text-yellow-500 font-bold text-lg' : 'text-gray-400'
                )}>
                  {rank}
                </div>
              ))}
            </div>

            {/* S3D/E3D 排行 */}
            <div className="flex-1">
              <div className="text-sm font-medium text-gray-600 mb-2 pb-1 border-b">S3D/E3D</div>
              <List
                size="small"
                dataSource={leaderboardData.s3d}
                renderItem={(item) => (
                  <List.Item className="py-1.5 !px-0">
                    <span className="truncate flex-1 font-medium">{item.name}</span>
                    <span className="text-[#007069] font-semibold">{item.hours}</span>
                  </List.Item>
                )}
              />
            </div>

            {/* SPPID 排行 */}
            <div className="flex-1">
              <div className="text-sm font-medium text-gray-600 mb-2 pb-1 border-b">SPPID</div>
              <List
                size="small"
                dataSource={leaderboardData.sppid}
                renderItem={(item) => (
                  <List.Item className="py-1.5 !px-0">
                    <span className="truncate flex-1 font-medium">{item.name}</span>
                    <span className="text-[#007069] font-semibold">{item.hours}</span>
                  </List.Item>
                )}
              />
            </div>

            {/* SPI/AI 排行 */}
            <div className="flex-1">
              <div className="text-sm font-medium text-gray-600 mb-2 pb-1 border-b">SPI/AI</div>
              <List
                size="small"
                dataSource={leaderboardData.spi}
                renderItem={(item) => (
                  <List.Item className="py-1.5 !px-0">
                    <span className="truncate flex-1 font-medium">{item.name}</span>
                    <span className="text-[#007069] font-semibold">{item.hours}</span>
                  </List.Item>
                )}
              />
            </div>
          </div>
        </div>
      </div>
      
      {/* 右侧主要内容区域 */}
      <div className="w-3/4 p-4 flex flex-col">
        {/* 搜索和筛选区域 */}
        <div className="mb-4 flex justify-between items-center">
          <div className="flex space-x-4">
            <Input
              placeholder="搜索姓名"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ width: '300px' }}
            />
            <Select
              style={{ width: '150px' }}
              placeholder="选择部门"
              value={selectedDepartment}
              onChange={handleSelectChange(setSelectedDepartment)}
              allowClear
            >
              <Select.Option value="全部">部门</Select.Option>
              {departments.map(department => (
                <Select.Option key={department} value={department}>{department}</Select.Option>
              ))}
            </Select>
            <Select
              style={{ width: '150px' }}
              placeholder="选择区域"
              value={selectedRegion}
              onChange={handleSelectChange(setSelectedRegion)}
              allowClear
            >
              <Select.Option value="全部">区域</Select.Option>
              {regions.map(region => (
                <Select.Option key={region} value={region}>{region}</Select.Option>
              ))}
            </Select>
            <Select
              style={{ width: '150px' }}
              placeholder="选择专业"
              value={selectedSpecialty}
              onChange={handleSelectChange(setSelectedSpecialty)}
              allowClear
            >
              <Select.Option value="全部">专业</Select.Option>
              {specialties.map(specialty => (
                <Select.Option key={specialty} value={specialty}>{specialty}</Select.Option>
              ))}
            </Select>
          </div>
          <Button 
            type="default"
            icon={<SettingOutlined />} 
            size="middle"
            aria-label="管理"
            onClick={showModal}
          />
        </div>
        
        {/* 卡片列表区域 */}
        <div ref={cardListRef} className="flex-grow overflow-auto">
          {paginatedPeople.map((person) => (
            <PersonCard
              key={person.email}
              person={person}
              checkedSkills={checkedSkills}
              onClick={() => showDrawer(person)}
            />
          ))}
        </div>
        
        {/* 分页器和汇总区域 */}
        <div className="mt-4 border-t pt-4 flex justify-end items-center">
          <Pagination
            current={currentPage}
            total={filteredPeople.length}
            pageSize={pageSize}
            showTotal={(total, range) => `共 ${total} 条`}
            onChange={handlePageChange}
            showSizeChanger={false}
            showQuickJumper={false}
          />
        </div>
      </div>
      <ManagementModal
        visible={isModalVisible}
        onOk={handleModalOk}
        onCancel={handleModalCancel}
        peopleData={peopleData}
        selectedPerson={selectedPerson}
        setSelectedPerson={setSelectedPerson}
        isAddingNew={isAddingNew}
        setIsAddingNew={setIsAddingNew}
        allSkillKeys={allSkillKeys}
      />
      <Drawer
        title={<span className="text-xl font-bold">人员详情</span>}
        placement="right"
        onClose={closeDrawer}
        visible={drawerVisible}
        width={600}
        bodyStyle={{ padding: '24px' }}
      >
        {selectedPerson && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <InfoItem label="姓名" value={selectedPerson.name} />
              <InfoItem label="邮箱" value={selectedPerson.email} />
              <InfoItem label="手机号" value={selectedPerson.phone} />
              <InfoItem label="部门" value={selectedPerson.department} />
              <InfoItem label="区域" value={selectedPerson.region} />
              <InfoItem label="专业" value={selectedPerson.specialty} />
            </div>
            <Divider className="my-4" />
            <div>
              <h3 className="text-lg font-semibold mb-4">🖥️ 软件技能水平</h3>
              <div className="space-y-4">
                {selectedPerson.skills
                  .sort((a, b) => b.level - a.level) // 添加这行来排序
                  .map((skill, index) => (
                    <div key={index} className="flex flex-col w-full">
                      <div className="flex items-center justify-between mb-2">
                        <span><strong>{skill.name}</strong></span>
                        <div 
                          className={cn(
                            "flex justify-center items-center px-3 py-1",
                            "rounded-none",
                            getSkillLevel(skill.level)
                          )}
                        > 
                          <span>{getSkillLevelText(skill.level)}</span>
                        </div>
                      </div>
                      <div className="w-full bg-gray-200 h-1">
                        <div 
                          className={cn(
                            "h-1",
                            getSkillLevelColor(skill.level)
                          )}
                          style={{ width: `${(skill.level) * 33.33}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        )}
      </Drawer>
      <SkillManagementModal
        visible={isSkillModalVisible}
        onOk={handleSkillModalOk}
        onCancel={handleSkillModalCancel}
        treeData={treeData}
      />
    </div>
  );
};

function getSkillLevel(level: number): string {
  const levelMap = {
    1: 'bg-[#33A39F] text-white border-[#33A39F]',
    2: 'bg-[#486ba1] text-white border-[#486ba1]',
    3: 'bg-[#9e7b8f] text-white border-[#9e7b8f]'
  }
  return levelMap[level as keyof typeof levelMap] || 'bg-[#007069] text-white border-[#007069]'
}

function getSkillLevelText(level: number): string {
  const levelMap = {
    1: '入门',
    2: '熟练',
    3: '精通'
  }
  return levelMap[level as keyof typeof levelMap] || '未知'
}

// 修改进度条颜色获取逻辑
function getSkillLevelColor(level: number): string {
  const colorMap = {
    1: 'bg-gradient-to-r from-[#e5f6ef] to-[#a5ebbf]',  // 入门
    2: 'bg-gradient-to-r from-[#e5f6ef] to-[#52b88f]',  // 熟练
    3: 'bg-gradient-to-r from-[#e5f6ef] via-[#85e5a7] to-[#007069]'   // 精通
  }
  return colorMap[level as keyof typeof colorMap] || 'bg-gradient-to-r from-[#e5f6ef] to-[#e5f6ef]'
}

// 修改进度条渲染部分
function SkillProgressBar({ level }: { level: number }) {
  const colors = getSkillLevelColor(level)
  
  return (
    <div className="w-16 h-1.5 flex gap-0.5">
      <div className={`w-1/2 h-full ${colors[0]}`} />
      <div className={`w-1/2 h-full ${colors[1]}`} />
    </div>
  )
}

interface ManagementModalProps {
  visible: boolean;
  onOk: () => void;
  onCancel: () => void;
  peopleData: PersonCard[];
  selectedPerson: PersonCard | null;
  setSelectedPerson: (person: PersonCard | null) => void;
  isAddingNew: boolean;
  setIsAddingNew: (isAdding: boolean) => void;
  allSkillKeys: string[];
}

const ManagementModal: React.FC<ManagementModalProps> = ({
  visible,
  onOk,
  onCancel,
  peopleData,
  selectedPerson,
  setSelectedPerson,
  isAddingNew,
  setIsAddingNew,
  allSkillKeys
}) => {
  const [form] = Form.useForm();
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (selectedPerson) {
      form.setFieldsValue(selectedPerson);
    } else {
      form.resetFields();
    }
  }, [selectedPerson, form]);

  const handleBatchAdd = () => {
    console.log("批量添加功能待实现");
  };

  const filteredPeopleData = useMemo(() => {
    return peopleData.filter(person =>
      person.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      person.email.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [peopleData, searchTerm]);

  return (
    <Modal
      title="人员管理"
      visible={visible}
      onOk={() => {
        form.validateFields().then(() => {
          onOk();
        });
      }}
      onCancel={onCancel}
      width={900}
      bodyStyle={{ height: '700px', overflow: 'hidden', padding: '4px' }}
      footer={null}
    >
      <div className="flex flex-col h-full">
        <div className="flex flex-grow overflow-hidden" style={{ height: 'calc(100% - 60px)' }}>
          <div className="w-1/3 pr-4 border-r flex flex-col">
            <div className="sticky top-0 bg-white z-10 pb-2">
              <Input
                placeholder="搜索姓名或邮箱"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="mb-2"
                prefix={<SearchOutlined />}
              />
            </div>
            <div className="overflow-y-auto flex-grow">
              <List
                dataSource={filteredPeopleData}
                renderItem={(item) => (
                  <List.Item
                    onClick={() => {
                      setSelectedPerson(item);
                      setIsAddingNew(false);
                    }}
                    className={`cursor-pointer ${selectedPerson?.email === item.email ? 'bg-blue-100' : ''}`}
                  >
                    <div className="flex flex-col w-full">
                      <span>{item.name}</span>
                      <span className="text-xs text-gray-400 truncate" style={{ maxWidth: '100%' }}>{item.email}</span>
                    </div>
                  </List.Item>
                )}
              />
            </div>
          </div>
          <div className="w-2/3 pl-4 overflow-y-auto">
            <Form form={form} layout="vertical">
              <Form.Item name="name" label="姓名" rules={[{ required: true }]}>
                <Input disabled={!isAddingNew} />
              </Form.Item>
              <Form.Item name="email" label="邮箱" rules={[{ required: true, type: 'email' }]}>
                <Input disabled={!isAddingNew} />
              </Form.Item>
              <Form.Item name="phone" label="手机号" rules={[{ required: true, pattern: /^1[3-9]\d{9}$/, message: '请输有效的手机号' }]}>
                <Input disabled={!isAddingNew} />
              </Form.Item>
              <Form.Item name="region" label="区域" rules={[{ required: true }]}>
                <Input disabled={!isAddingNew} />
              </Form.Item>
              <Form.Item name="specialty" label="专业" rules={[{ required: true }]}>
              <Input disabled={!isAddingNew} />
              </Form.Item>
              <Form.Item label="技能">
                <Form.List name="skills">
                  {(fields, { add, remove }) => (
                    <>
                      {fields.map(({ key, name, ...restField }) => (
                        <Space key={key} style={{ display: 'flex', marginBottom: 8 }} align="baseline">
                          <Form.Item
                            {...restField}
                            name={[name, 'name']}
                            rules={[{ required: true, message: '请选择技能名称' }]}
                          >
                            <Select style={{ width: 340 }}>
                              {allSkillKeys.map((skillKey: string) => (
                                <Select.Option key={skillKey} value={skillKey}>
                                  {skillKey}
                                </Select.Option>
                              ))}
                            </Select>
                          </Form.Item>
                          <Form.Item
                            {...restField}
                            name={[name, 'level']}
                            rules={[{ required: true, message: '请选择技能水平' }]}
                          >
                            <Select style={{ width: 80 }}>
                              <Select.Option value={1}>入门</Select.Option>
                              <Select.Option value={2}>熟练</Select.Option>
                              <Select.Option value={3}>精通</Select.Option>
                            </Select>
                          </Form.Item>
                          <MinusCircleOutlined onClick={() => remove(name)} style={{ color: 'red' }} />
                        </Space>
                      ))}
                      <Form.Item>
                        <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>
                          添加技能
                        </Button>
                      </Form.Item>
                    </>
                  )}
                </Form.List>
              </Form.Item>
            </Form>
          </div>
        </div>
        <div className="flex justify-between items-center mt-4 pt-4 border-t" style={{ minHeight: '60px' }}>
          <Button type="default" icon={<UploadOutlined />} onClick={handleBatchAdd}>
            批量添加
          </Button>
          <div>
            <Button onClick={onCancel} style={{ marginRight: 8 }}>
              取消
            </Button>
            <Button type="primary" onClick={() => {
              form.validateFields().then(() => {
                onOk();
              });
            }}>
              确定
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};

// 新增的 InfoItem 组件
const InfoItem: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => (
  <div>
    <span className="text-gray-500">{label}：</span>
    <span className="font-medium">{value}</span>
  </div>
);

interface SkillManagementModalProps {
  visible: boolean;
  onOk: () => void;
  onCancel: () => void;
  treeData: DataNode[];
}

// 改 FlattenedNode 接口
interface FlattenedNode {
  key: string;
  title: string;
  parentKey: string | null;
}

// 在 columns 定义之前添加这个接口
interface EditableColumn extends ColumnType<FlattenedNode> {
  editable?: boolean;
  dataIndex?: string;
}

const SkillManagementModal: React.FC<SkillManagementModalProps> = ({
  visible,
  onOk,
  onCancel,
  treeData
}) => {
  const [flattenedData, setFlattenedData] = useState<FlattenedNode[]>([]);
  const [editingKey, setEditingKey] = useState<string>('');
  const [form] = Form.useForm();

  // 新增状态来控制添加节点的弹窗
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [newNodeParent, setNewNodeParent] = useState<string | null>(null);
  const [newNodeTitle, setNewNodeTitle] = useState('');

  useEffect(() => {
    const flattenTree = (nodes: DataNode[], parentKey: string | null = null): FlattenedNode[] => {
      return nodes.reduce((acc: FlattenedNode[], node) => {
        acc.push({
          key: node.key as string,
          title: node.title as string,
          parentKey
        });
        if (node.children) {
          acc.push(...flattenTree(node.children, node.key as string));
        }
        return acc;
      }, []);
    };

    setFlattenedData(flattenTree(treeData));
  }, [treeData]);

  const isEditing = (record: FlattenedNode) => record.key === editingKey;

  const edit = (record: Partial<FlattenedNode> & { key: React.Key }) => {
    form.setFieldsValue({ title: '', ...record });
    setEditingKey(record.key);
  };

  const cancel = () => {
    setEditingKey('');
  };

  // 修改生成节点Key的函数
  const generateNodeKey = (title: string, parentKey: string | null): string => {
    const parentPrefix = parentKey ? `${parentKey}-` : '';
    return `${parentPrefix}${title.replace(/\s+/g, '-')}`;
  };

  // 修改确认添加节点的数
  const confirmAdd = () => {
    if (newNodeTitle.trim() === "根节点") {
      message.error('节点名称不能为"根节点"');
      return;
    }

    const newKey = generateNodeKey(newNodeTitle, newNodeParent);
    const newNode: FlattenedNode = {
      key: newKey,
      title: newNodeTitle,
      parentKey: newNodeParent,
    };
    const newData = [...flattenedData, newNode];
    setFlattenedData(newData);
    setIsAddModalVisible(false);
    setNewNodeParent(null);
    setNewNodeTitle('');
    
    // 直接保存新节点，无需进入编辑模式
    setEditingKey('');
  };

  // 新增取消添加节点的函数
  const cancelAdd = () => {
    setIsAddModalVisible(false);
    setNewNodeParent(null);
    setNewNodeTitle('');
  };

  // 修改保存数
  const save = async (key: React.Key) => {
    try {
      const row = (await form.validateFields()) as FlattenedNode;
      
      if (row.title.trim() === "根节点") {
        message.error('节点名称不能为"根节点"');
        return;
      }

      if (row.parentKey === key) {
        message.error('父节点不能是点自身');
        return;
      }

      const newData = [...flattenedData];
      const index = newData.findIndex(item => key === item.key);
      if (index > -1) {
        const item = newData[index];
        const newKey = generateNodeKey(row.title, row.parentKey);
        newData.splice(index, 1, {
          ...item,
          ...row,
          key: newKey,
          parentKey: row.parentKey || null,
        });
        // 更新子节点的parentKey
        newData.forEach(node => {
          if (node.parentKey === key) {
            node.parentKey = newKey;
            node.key = generateNodeKey(node.title, newKey);
          }
        });
        setFlattenedData(newData);
        setEditingKey('');
      }
    } catch (errInfo) {
      console.log('验证失败:', errInfo);
    }
  };

  // 修改删除函数
  const handleDelete = (key: React.Key) => {
    const deleteNode = (nodeKey: React.Key) => {
      const newData = flattenedData.filter(item => item.key !== nodeKey);
      const childNodes = flattenedData.filter(item => item.parentKey === nodeKey);
      childNodes.forEach(child => deleteNode(child.key));
      return newData;
    };
    const newData = deleteNode(key);
    setFlattenedData(newData);
  };

  // 修改添加节函数
  const handleAdd = () => {
    setIsAddModalVisible(true);
  };

  // 修改列定义
  const columns: EditableColumn[] = [
    {
      title: '节点Key',
      dataIndex: 'key',
      key: 'nodeKey',
      width: '30%',
    },
    {
      title: '节点名称',
      dataIndex: 'title',
      key: 'title',
      editable: true,
      width: '20%',
    },
    {
      title: '父节点Key',
      dataIndex: 'parentKey',
      key: 'parentKey',
      editable: true,
      width: '30%',
      render: (parentKey: string | null) => parentKey || '根节点',
    },
    {
      title: '操作',
      key: 'operation',
      width: '10%',
      render: (_: any, record: FlattenedNode) => {
        const editable = isEditing(record);
        return editable ? (
          <span>
            <Typography.Link onClick={() => save(record.key)} style={{ marginRight: 8 }}>
              保存
            </Typography.Link>
            <Popconfirm title="确定取消？" onConfirm={cancel}>
              <a>取消</a>
            </Popconfirm>
          </span>
        ) : (
          <span>
            <Typography.Link disabled={editingKey !== ''} onClick={() => edit(record)} style={{ marginRight: 8 }}>
              编辑
            </Typography.Link>
            <Popconfirm title="确定删除？" onConfirm={() => handleDelete(record.key)}>
              <a style={{ color: 'red' }}>删除</a>
            </Popconfirm>
          </span>
        );
      },
    },
  ];

  const mergedColumns: ColumnsType<FlattenedNode> = columns.map(col => {
    if (!col.editable) {
      return col as ColumnType<FlattenedNode>;
    }
    return {
      ...col,
      onCell: (record: FlattenedNode) => ({
        record,
        inputType: 'text',
        dataIndex: col.dataIndex,
        title: col.title,
        editing: isEditing(record),
      }),
    } as ColumnType<FlattenedNode>;
  });

  const EditableCell: React.FC<EditableCellProps> = ({
    editing,
    dataIndex,
    title,
    inputType,
    record,
    index,
    children,
    ...restProps
  }) => {
    const inputNode = inputType === 'number' ? <InputNumber /> : <Input />;

    return (
      <td {...restProps}>
        {editing ? (
          <Form.Item
            name={dataIndex}
            style={{ margin: 0 }}
            rules={[
              {
                required: dataIndex !== 'parentKey',
                message: `请输入 ${title}!`,
              },
              {
                validator: (_, value) => {
                  if (dataIndex === 'parentKey' && value === record.key) {
                    return Promise.reject(new Error('父节点不能是节点自身'));
                  }
                  if (dataIndex === 'title' && value.trim() === '根节点') {
                    return Promise.reject(new Error('节点名称不能为"根节点"'));
                  }
                  return Promise.resolve();
                },
              },
            ]}
          >
            {dataIndex === 'parentKey' ? (
              <Select allowClear style={{ width: '100%' }}>
                <Select.Option value={null}>根节点</Select.Option>
                {flattenedData
                  .filter(node => node.key !== record.key)
                  .map(node => (
                    <Select.Option key={node.key} value={node.key}>
                      {node.key}
                    </Select.Option>
                  ))}
              </Select>
            ) : (
              inputNode
            )}
          </Form.Item>
        ) : (
          children
        )}
      </td>
    );
  };

  return (
    <Modal
      title="技能目录管理"
      visible={visible}
      onOk={onOk}
      onCancel={onCancel}
      width={1400}
      style={{ top: 20 }}
      bodyStyle={{ height: 'calc(100vh - 200px)', overflow: 'auto' }}
    >
      <Button onClick={handleAdd} type="primary" style={{ marginBottom: 16 }}>
        添加节点
      </Button>
      <Form form={form} component={false}>
        <Table
          components={{
            body: {
              cell: EditableCell,
            },
          }}
          bordered
          dataSource={flattenedData}
          columns={mergedColumns as ColumnsType<FlattenedNode>}
          rowClassName="editable-row"
          pagination={false}
          rowKey="key"
          scroll={{ y: 'calc(100vh - 310px)' }}
        />
      </Form>
      <Modal
        title="添加新节点"
        visible={isAddModalVisible}
        onOk={confirmAdd}
        onCancel={cancelAdd}
      >
        <Form layout="vertical">
          <Form.Item 
            label="节点名称" 
            required
            rules={[
              { required: true, message: '请输入节点名称' },
              { validator: (_, value) => 
                value.trim() === '根节点' 
                  ? Promise.reject(new Error('节点名称不能为"根节点"')) 
                  : Promise.resolve()
              }
            ]}
          >
            <Input 
              value={newNodeTitle}
              onChange={(e) => setNewNodeTitle(e.target.value)}
            />
          </Form.Item>
          <Form.Item label="父节点">
            <Select
              value={newNodeParent}
              onChange={(value) => setNewNodeParent(value)}
              allowClear
            >
              <Select.Option value={null}>根节点</Select.Option>
              {flattenedData.map(node => (
                <Select.Option key={node.key} value={node.key}>
                  {node.key}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </Modal>
  );
};

// 定义 EditableCellProps 接口
interface EditableCellProps extends React.HTMLAttributes<HTMLElement> {
  editing: boolean;
  dataIndex: string;
  title: any;
  inputType: 'number' | 'text';
  record: FlattenedNode;
  index: number;
  children: React.ReactNode;
}

const formatSpecialty = (specialty: string): string => {
  if (specialty.startsWith('PMC-') || specialty.startsWith('EPC-')) {
    return specialty;
  }
  const parts = specialty.split('-');
  return parts[parts.length - 1] || specialty;
};

// 修改 PersonCard 组件中显示专业的部分
const PersonCard: React.FC<{ person: PersonCard; checkedSkills: string[]; onClick: () => void }> = ({ person, checkedSkills, onClick }) => {
  const sortedSkills = [...person.skills].sort((a, b) => {
    if (b.level !== a.level) {
      return b.level - a.level;
    }
    return a.name.localeCompare(b.name);
  });

  return (
    <div 
      className="bg-white border border-gray-200 rounded-lg mb-4 cursor-pointer hover:border-blue-500 transition-colors duration-300"
      onClick={onClick}
    >
      {/* 基本信息部分 - 添加了浅灰色背景 */}
      <div className="flex justify-between p-4 bg-gray-50">
        {/* 左侧信息 */}
        <div className="space-y-2">
          <h3 className="text-xl font-bold">{person.name}</h3>
          <div className="flex items-center space-x-6 text-gray-600">
            <div className="flex items-center space-x-1">
              <MailOutlined className="text-gray-400" />
              <span>{person.email}</span>
            </div>
            <div className="flex items-center space-x-1">
              <PhoneOutlined className="text-gray-400" />
              <span>{person.phone}</span>
            </div>
            <div className="flex items-center space-x-1 text-[#3975c6]">
              <Image 
                src="/images/wechat.png" 
                alt="企业微信" 
                width={16} 
                height={16} 
                className="text-green-500"
              />
              <span>企业微信</span>
            </div>
          </div>
        </div>

        {/* 右侧信息 */}
        <div className="text-right space-y-2">
          <div className="flex items-center justify-end space-x-1 text-gray-600">
            <TeamOutlined className="text-gray-400" />
            <span>{person.department}</span>
          </div>
          <div className="flex items-center justify-end space-x-1 text-gray-600">
            <EnvironmentOutlined className="text-gray-400" />
            <span>{person.region}</span>
          </div>
        </div>
      </div>
      
      {/* 技能部分 */}
      <div className="flex flex-wrap gap-2 p-3 border-t">
        {sortedSkills.map((skill, index) => (
          <div 
            key={index} 
            className={cn(
              "flex items-center px-3",
              getSkillLevel(skill.level),
              checkedSkills.some(checkedSkill => skill.name.startsWith(checkedSkill)) ? "border-2 border-orange-500" : ""
            )}
          >
            <span>{skill.name}</span>
            <span className="ml-2 text-xs">{getSkillLevelText(skill.level)}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default EngineeringSystemSkills;
