'use client'

import React, { useEffect, useState } from 'react';
import { Tree, Input, Select, Button, Radio, Modal, Form, List, Space, Divider } from 'antd';
import { ClearOutlined, SettingOutlined, PlusOutlined, MinusCircleOutlined, UploadOutlined } from '@ant-design/icons';
import type { DataNode } from 'antd/es/tree';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import Grid from '@mui/material/Grid'
import styled from 'styled-components';
import type { PersonCard } from '@/lib/types/esk';



// 树形结构数据
const treeData: DataNode[] = [
  {
    title: 'AVEVA',
    key: 'AVEVA',
    children: [
      {
        title: 'E3D',
        key: 'AVEVA-E3D',
        children: [
          {
            title: 'Catalogue',
            key: 'AVEVA-E3D-Catalogue',
            children: [
              { title: 'Piping', key: 'AVEVA-E3D-Catalogue-Piping' },
              { title: 'Structural', key: 'AVEVA-E3D-Catalogue-Structural' },
            ],
          },
        ],
      },
    ],
  },
  {
    title: 'Hexagon',
    key: 'Hexagon',
    children: [
      {
        title: 'Smart3D',
        key: 'Hexagon-Smart3D',
        children: [
          {
            title: 'Catalogue',
            key: 'Hexagon-Smart3D-Catalogue',
            children: [
              { title: 'Piping', key: 'Hexagon-Smart3D-Catalogue-Piping' },
              { title: 'Structural', key: 'Hexagon-Smart3D-Catalogue-Structural' },
            ],
          },
        ],
      },
    ],
  },
];  

// 添加自定义样式的 Radio.Group
const StyledRadioGroup = styled(Radio.Group)`
  .ant-radio-button-wrapper-checked {
    background-color: #1890ff;
    border-color: #1890ff;
    color: white;
    &:hover {
      background-color: #40a9ff;
      border-color: #40a9ff;
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

// 获取所有叶节点的 key
const allSkillKeys = getAllLeafKeys(treeData);

const EngineeringSystemSkills = () => {
  const [peopleData, setPeopleData] = useState<PersonCard[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [checkedSkills, setCheckedSkills] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedRegion, setSelectedRegion] = useState<string>('');
  const [selectedSpecialty, setSelectedSpecialty] = useState<string>('');
  const [filterMode, setFilterMode] = useState<'all' | 'any'>('all');
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedPerson, setSelectedPerson] = useState<PersonCard | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);

  useEffect(() => {
    fetch('/api/esk/people').then((r) => r.json()).then((d) => { setPeopleData(d); setDataLoading(false); }).catch(() => setDataLoading(false));
  }, []);

  const onCheck = (checkedKeys: React.Key[] | { checked: React.Key[]; halfChecked: React.Key[]; }) => {
    if (Array.isArray(checkedKeys)) {
      setCheckedSkills(checkedKeys as string[]);
    } else {
      setCheckedSkills(checkedKeys.checked as string[]);
    }
  };

  const filteredPeople = peopleData.filter(person =>
    (checkedSkills.length === 0 || (filterMode === 'all' ?
      checkedSkills.every(skill => 
        person.skills.some(personSkill => personSkill.name.startsWith(skill)))
      :
      checkedSkills.some(skill => 
        person.skills.some(personSkill => personSkill.name.startsWith(skill)))
    )) &&
    (searchTerm === '' || person.name.includes(searchTerm) || person.email.includes(searchTerm)) &&
    (selectedRegion === '' || person.region === selectedRegion) &&
    (selectedSpecialty === '' || person.specialty === selectedSpecialty)
  );

  const regions = Array.from(new Set(peopleData.map(person => person.region).filter(Boolean))) as string[];
  const specialties = Array.from(new Set(peopleData.map(person => person.specialty).filter(Boolean))) as string[];

  const clearCheckedSkills = () => {
    setCheckedSkills([]);
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

  if (dataLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <span className="text-gray-500">加载中...</span>
      </div>
    );
  }

  return (
    <div className="flex h-screen">
      <div className="w-1/4 p-4 border-r">
        <div className="h-full border rounded-lg p-4 shadow-sm overflow-auto">
          <h2 className="text-xl font-bold mb-4">软件技能目录</h2>          
          <p className="text-sm text-gray-500 mb-2">请选择需要筛选的软件技能</p>
          <div className="flex items-center justify-between mb-2">
            <Button 
              onClick={clearCheckedSkills}
              size="small"
              icon={<ClearOutlined />}
            >
              清空选择
            </Button>
            <StyledRadioGroup 
              value={filterMode} 
              onChange={(e) => setFilterMode(e.target.value)}
              size="small"
            >
              <Radio.Button value="all">同时满足</Radio.Button>
              <Radio.Button value="any">满足任一</Radio.Button>
            </StyledRadioGroup>
          </div>
          <Tree
            treeData={treeData}
            checkable
            onCheck={onCheck}
            checkedKeys={checkedSkills}
          />
        </div>
      </div>
      <div className="w-3/4 p-4 overflow-auto">
        <div className="mb-4 flex justify-between items-center">
          <div className="flex space-x-4">
            <Input
              placeholder="搜索姓名或邮箱"
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ width: '200px' }}
            />
            <Select
              style={{ width: '150px' }}
              placeholder="选择区域"
              onChange={(value) => setSelectedRegion(value)}
              allowClear
            >
              {regions.map(region => (
                <Select.Option key={region} value={region}>{region}</Select.Option>
              ))}
            </Select>
            <Select
              style={{ width: '150px' }}
              placeholder="选择专业"
              onChange={(value) => setSelectedSpecialty(value)}
              allowClear
            >
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
        <Grid container spacing={2}>
          {filteredPeople.map(person => (
            <Grid item xs={12} sm={6} key={person.email}>
              <PersonCard person={person} />
            </Grid>
          ))}
        </Grid>
        {filteredPeople.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            暂无匹配人员
          </div>
        )}
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
      />
    </div>
  );
};

function PersonCard({ person }: { person: PersonCard }) {
  return (
    <Card className="relative">
      <CardHeader>
        <Badge 
          className={cn(
            "absolute top-4 right-4 text-base px-3 py-1",
            getSpecialtyColor(person.specialty),
            "hover:bg-opacity-100"
          )}
        >
          {person.specialty}
        </Badge>
        <CardTitle className="text-2xl">{person.name}</CardTitle>
        <p className="text-sm text-blue-500">{person.email}</p>
        <p className="text-sm text-gray-500">{person.region}</p>
      </CardHeader>
      <CardContent>
        <div className="mb-3">
          <h3 className="font-semibold mb-1">🖥️ 软件技能水平</h3>
          <div className="flex flex-col space-y-2">
            {person.skills.map((skill, index) => (
              <div 
                key={index} 
                className={cn(
                  "w-full flex justify-between items-center px-3 py-1",
                  "rounded-none", // 移除圆角
                  getSkillLevel(skill.level)
                )}
              >
                <span>{skill.name}</span>
                <span>{getSkillLevelText(skill.level)}</span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function getSpecialtyColor(specialty: string): string {
  const colorMap: { [key: string]: string } = {
    '管道设计': 'bg-blue-100 text-blue-800 hover:bg-blue-100 hover:text-blue-800',
    '结构设计': 'bg-green-100 text-green-800 hover:bg-green-100 hover:text-green-800',
    // 可以根据需要添加更多专业
  }
  return colorMap[specialty] || 'bg-gray-100 text-gray-800 hover:bg-gray-100 hover:text-gray-800'  // 默认颜色
}

function getSkillLevel(level: number): string {
  const levelMap = {
    0: 'bg-gray-100 text-gray-800 border-gray-300',
    1: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    2: 'bg-purple-100 text-purple-800 border-purple-300'
  }
  return levelMap[level as keyof typeof levelMap] || 'bg-gray-100 text-gray-800 border-gray-300'
}

function getSkillLevelText(level: number): string {
  const levelMap = {
    0: '菜鸟',
    1: '熟练',
    2: '精通'
  }
  return levelMap[level as keyof typeof levelMap] || '未知'
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
}

const ManagementModal: React.FC<ManagementModalProps> = ({
  visible,
  onOk,
  onCancel,
  peopleData,
  selectedPerson,
  setSelectedPerson,
  isAddingNew,
  setIsAddingNew
}) => {
  const [form] = Form.useForm();

  useEffect(() => {
    if (selectedPerson) {
      form.setFieldsValue(selectedPerson);
    } else {
      form.resetFields();
    }
  }, [selectedPerson, form]);

  const handleAddNew = () => {
    setIsAddingNew(true);
    setSelectedPerson(null);
    form.resetFields();
  };

  const handleBatchAdd = () => {
    // 这里添加批量添加的逻辑
    console.log("批量添加功能待实现");
  };

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
      width={800}
      bodyStyle={{ height: '600px', overflow: 'hidden' }}
    >
      <div className="flex h-full">
        <div className="w-1/3 pr-4 border-r overflow-y-auto" style={{ height: 'calc(100% - 40px)' }}>
          <Space className="mb-2">
            <Button icon={<PlusOutlined />} onClick={handleAddNew}>
              添加
            </Button>
            <Button icon={<UploadOutlined />} onClick={handleBatchAdd}>
              批量添加
            </Button>
          </Space>
          <List
            dataSource={peopleData}
            renderItem={(item) => (
              <List.Item
                onClick={() => {
                  setSelectedPerson(item);
                  setIsAddingNew(false);
                }}
                className={`cursor-pointer ${selectedPerson?.email === item.email ? 'bg-blue-100' : ''}`}
              >
                {item.name}
              </List.Item>
            )}
          />
        </div>
        <div className="w-2/3 pl-4 overflow-y-auto" style={{ height: 'calc(100% - 40px)' }}>
          <Form form={form} layout="vertical">
            <Form.Item name="name" label="姓名" rules={[{ required: true }]}>
              <Input disabled={!isAddingNew} />
            </Form.Item>
            <Form.Item name="email" label="邮箱" rules={[{ required: true, type: 'email' }]}>
              <Input disabled={!isAddingNew} />
            </Form.Item>
            <Form.Item name="region" label="区域" rules={[{ required: true }]}>
              <Input disabled={!isAddingNew} />
            </Form.Item>
            <Form.Item name="specialty" label="专业" rules={[{ required: true }]}>
              <Select>
                <Select.Option value="管道设计">管道设计</Select.Option>
                <Select.Option value="结构设计">结构设计</Select.Option>
              </Select>
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
                            {allSkillKeys.map((skillKey) => (
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
                            <Select.Option value={0}>菜鸟</Select.Option>
                            <Select.Option value={1}>熟练</Select.Option>
                            <Select.Option value={2}>精通</Select.Option>
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
    </Modal>
  );
};

export default EngineeringSystemSkills;