'use client'

import { useState, useEffect } from 'react'
import { Tabs, Table, Input, Button, Menu, Space, Typography, Modal, DatePicker, Select, Radio } from 'antd'
import { NotificationOutlined, FilterOutlined, DownOutlined, UpOutlined, EditOutlined, DeleteOutlined, PlusOutlined, SwapOutlined, UserOutlined, FileOutlined, StarOutlined, SettingOutlined, InfoCircleOutlined } from '@ant-design/icons'
import type { TabsProps } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import type { MenuProps } from 'antd'
import { Badge } from 'antd'
import { message } from 'antd';
import dayjs from 'dayjs';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import '@wangeditor/editor/dist/css/style.css'
//import { Editor, Toolbar } from '@wangeditor/editor-for-react'
import { IDomEditor, IEditorConfig, IToolbarConfig } from '@wangeditor/editor'
import { Tooltip } from 'antd';
import dynamic from 'next/dynamic';

// 2. 动态导入编辑器组件
const Editor = dynamic(
  () => import('@wangeditor/editor-for-react').then(({ Editor }) => Editor),
  { ssr: false }
)

const Toolbar = dynamic(
  () => import('@wangeditor/editor-for-react').then(({ Toolbar }) => Toolbar),
  { ssr: false }
)


dayjs.extend(isSameOrAfter);
dayjs.extend(isSameOrBefore);

interface NoticeItem {
  key: string
  title: string
  type: string
  status: string
  createDate: string
  endDate: string
  publisher: string
  scope: string | {
    type: string;
    targets: string[];
  }
  content?: string
  is_read?: boolean
  readCount?: number
}

interface NoticeFormData {
  title: string;
  type: string;
  createDate: string;
  endDate: string;
  publisher: string;
  scope: {
    type: string;
    targets: string[];
  };
  content: string;
}

// 在 interface NoticeFormData 下方添加新的接口
interface DraftNotice extends NoticeFormData {
  lastUpdated: string;
}

const mockData: NoticeItem[] = [
  {
    key: '1',
    title: '10月份考勤制度调整',
    type: '公司公告',
    status: '待生效',
    createDate: '2025-01-15',
    endDate: '2025-12-31',
    publisher: 'HR部门',
    scope: '全体人员',
    content: '根据公司的发展需要，我们将于2024年10月份调整考勤制度。新的考勤制度将更加灵活，员工可以根据自己的需求选择合适的工作时间。具体的调整细节将在后续通知中公布。\n\n如需了解更多信息，请联系人力资源部张三。',
    is_read: true,
    readCount: 156
  },
  {
    key: '2',
    title: '2025年春节放假通知',
    type: '公司公告',
    status: '生效中',
    createDate: '2024-11-10',
    endDate: '2025-02-29',
    publisher: '行政部',
    scope: '全体人员',
    is_read: true,
    readCount: 89
  },
  {
    key: '3',
    title: '办公室装修施工通知',
    type: '公司公告',
    status: '生效中',
    createDate: '2024-02-20',
    endDate: '2025-01-10',
    publisher: '行政部',
    scope: '研发部',
    is_read: false,
    readCount: 50
  },    
  {
    key: '4',
    title: '年度团建活动报名通知',
    type: '活动公告',
    status: '已过期',
    createDate: '2024-01-05',
    endDate: '2024-01-20',
    publisher: '文化委员会',
    scope: '全体人员',
    is_read: true,
    readCount: 100
  },

  {
    key: '5',
    title: '年终述职会议安排',
    type: '公司公告',
    status: '已过期',
    createDate: '2023-01-08',
    endDate: '2023-01-31',
    publisher: '人事部',
    scope: '部门主管',
    is_read: true,
    readCount: 70
  }
]

const mockDepartments = ['研发部', '产品部', '市场部', '人事部', '财务部'];
const mockRoles = ['部门主管', '项目经理', '普通员工', '实习生'];
const mockUsers = ['张三', '李四', '王五', '赵六'];

// 添加一个模拟的当前用户信息
const mockCurrentUser = {
  name: 'admin(10000)',
  department: 'HR部门'
};

const NoticeBoardComponent = dynamic(
  () => Promise.resolve(NoticeBoard),
  { ssr: false }
)

export default NoticeBoardComponent

function NoticeBoard() {
  const [activeTab, setActiveTab] = useState('all')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedNotice, setSelectedNotice] = useState<NoticeItem | null>(null)
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState({
    type: '',
    createDate: null,
    endDate: null,
    publisher: ''
  })
  const [isAdmin, setIsAdmin] = useState(false)
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false)
  const [isBatchMoveModalOpen, setIsBatchMoveModalOpen] = useState(false)
  const [selectedRows, setSelectedRows] = useState<NoticeItem[]>([])
  const [noticeForm, setNoticeForm] = useState<NoticeFormData>({
    title: '',
    type: '',
    createDate: '',
    endDate: '',
    publisher: '',
    scope: {
      type: '',
      targets: []
    },
    content: ''
  });
  const [editor, setEditor] = useState<IDomEditor | null>(null)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
  const [notices, setNotices] = useState<NoticeItem[]>(mockData)
  const [categories, setCategories] = useState([
    { id: '1', name: '公司公告' },
    { id: '2', name: '活动公告' }
  ]);
  const [editingCategory, setEditingCategory] = useState<{ id: string; name: string } | null>(null);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [batchMoveTarget, setBatchMoveTarget] = useState('');
  const [searchKeyword, setSearchKeyword] = useState('');

  // 添加新的状态来跟踪是否显示草稿提示
  const [showDraftPrompt, setShowDraftPrompt] = useState(false);

  // 添加删除确认 Modal 的状态
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [noticeToDelete, setNoticeToDelete] = useState<NoticeItem | null>(null);
  const [isBatchDeleteModalOpen, setIsBatchDeleteModalOpen] = useState(false);

  // 添加预览模态框的状态
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);

  // 添加一个state来存储草稿数据
  const [draft, setDraft] = useState<DraftNotice | null>(null);

  useEffect(() => {
    // 加载草稿
    const loadDraft = (): DraftNotice | null => {
      const draftStr = localStorage.getItem('noticeFormDraft');
      return draftStr ? JSON.parse(draftStr) : null;
    };
    
    setDraft(loadDraft());
  }, []);

  const getNoticeStatus = (notice: NoticeItem): string => {
    const now = dayjs()
    const startDate = dayjs(notice.createDate)
    const endDate = dayjs(notice.endDate)

    if (now.isBefore(startDate)) {
      return '待生效'
    }

    if (now.isAfter(endDate)) {
      return '已过期'
    }

    return '生效中'
  }

  // 确保 getNoticeStatus 在 getUnreadCount 之前
  const getUnreadCount = () => {
    return notices.filter(notice => 
      !notice.is_read && getNoticeStatus(notice) === '生效中'
    ).length;
  };

  const tabItems: TabsProps['items'] = [
    {
      key: 'all',
      label: '全部',
    },
    {
      key: 'unread',
      label: `未读 (${getUnreadCount()})`,
    },
    {
      key: 'read',
      label: '已读',
    },
  ];

  const getFilteredData = () => {
    return notices.filter(item => {
      const currentStatus = getNoticeStatus(item)
      
      let matchesTab = true
      switch (activeTab) {
        case 'unread':
          matchesTab = !item.is_read && currentStatus === '生效中'
          break
        case 'read':
          matchesTab = !!item.is_read
          break
        // 'all' 不需要特殊处理，保持 matchesTab = true
      }

      const matchesSearch = !searchKeyword || 
        item.title.toLowerCase().includes(searchKeyword.toLowerCase());

      const matchesType = !filters.type || item.type === filters.type
      const matchesPublisher = !filters.publisher || item.publisher === filters.publisher
      
      const matchesCreateDate = !filters.createDate || 
        dayjs(item.createDate).isSameOrAfter(dayjs(filters.createDate), 'day')
      
      const matchesEndDate = !filters.endDate || 
        dayjs(item.endDate).isSameOrBefore(dayjs(filters.endDate), 'day')

      return matchesTab && matchesSearch && matchesType && matchesPublisher && 
             matchesCreateDate && matchesEndDate
    })
  }

  const columns: ColumnsType<NoticeItem> = [
    {
      title: '公告标题',
      dataIndex: 'title',
      key: 'title',
      render: (text, record) => (
        <div className="flex items-center">
          {!record.is_read && (
            <Badge status="error" className="mr-2" />
          )}
          <Typography.Text
            style={{ 
              cursor: 'pointer',
              color: !record.is_read ? '#1890ff' : 'inherit'
            }}
            onClick={() => {
              updateNoticeStatus(record)
              setSelectedNotice(record)
              setIsDetailModalOpen(true)
            }}
          >
            {text}
          </Typography.Text>
        </div>
      ),
    },
    {
      title: '公告类别',
      dataIndex: 'type',
      key: 'type',
    },
    {
      title: '公告状态',
      dataIndex: 'status',
      key: 'status',
      render: (_, record) => {
        const currentStatus = getNoticeStatus(record)
        let color = '';
        
        switch (currentStatus) {
          case '待生效':
            color = 'blue';
            break;
          case '生效中':
            color = 'green';
            break;
          case '已过期':
            color = 'gray';
            break;
        }
        return (
          <Badge
            color={color}
            text={currentStatus}
          />
        );
      },
    },
    {
      title: '生效日期',
      dataIndex: 'createDate',
      key: 'createDate',
    },
    {
      title: '终止日期',
      dataIndex: 'endDate',
      key: 'endDate',
    },
    {
      title: '发布部门',
      dataIndex: 'publisher',
      key: 'publisher',
    },
    {
      title: '发布范围',
      dataIndex: 'scope',
      key: 'scope',
      render: (scope) => {
        if (typeof scope === 'string') return scope;
        if (scope.type === '全体员') return '全体人员';
        return `${scope.type}: ${scope.targets.join(', ')}`;
      }
    },
    {
      title: '阅读量',
      dataIndex: 'readCount',
      key: 'readCount',
      render: (count) => count || 0,
      className: isAdmin ? undefined : 'hidden',
    },
    {
      title: '操作',
      dataIndex: 'action',
      key: 'action',
      render: (_, record) => (
        isAdmin && (
          <Space>
            <Button 
              type="link" 
              icon={<EditOutlined />}
              onClick={() => {
                setSelectedNotice(record);
                setNoticeForm({
                  title: record.title,
                  type: record.type,
                  createDate: record.createDate,
                  endDate: record.endDate,
                  publisher: record.publisher,
                  scope: typeof record.scope === 'string' 
                    ? { type: record.scope, targets: [] }
                    : record.scope,
                  content: record.content || ''
                });
                setIsModalOpen(true);
              }}
            >
              编辑
            </Button>
            <Button 
              type="link" 
              icon={<DeleteOutlined />} 
              danger
              onClick={() => handleDelete(record)}
            >
              删除
            </Button>
          </Space>
        )
      ),
      width: isAdmin ? undefined : 0,
      className: isAdmin ? undefined : 'hidden',
    },
  ]

  const handleNoticeSubmit = () => {
    if (!noticeForm.title || !noticeForm.type || !noticeForm.createDate || 
        !noticeForm.endDate || !noticeForm.publisher || !noticeForm.scope) {
      message.error('请填写所有必填项');
      return;
    }

    // 检查日期是否合法
    if (dayjs(noticeForm.endDate).isBefore(noticeForm.createDate)) {
      message.error('终止日期不能早于生效日期');
      return;
    }

    const newNotice: NoticeItem = {
      key: selectedNotice?.key || Date.now().toString(),
      title: noticeForm.title,
      type: noticeForm.type,
      status: dayjs().isBefore(noticeForm.createDate) ? '待生效' : '生效中',
      createDate: noticeForm.createDate,
      endDate: noticeForm.endDate,
      publisher: noticeForm.publisher,
      scope: noticeForm.scope.type === '全体人员' ? '全体人员' : noticeForm.scope,
      content: noticeForm.content,
      is_read: true
    };

    // 更新notices列表
    setNotices(prev => {
      if (selectedNotice) {
        // 编辑现有公告
        return prev.map(notice => 
          notice.key === selectedNotice.key ? newNotice : notice
        );
      } else {
        // 添加新公告
        return [...prev, newNotice];
      }
    });

    // 重置表单和关闭模态框
    setNoticeForm({
      title: '',
      type: '',
      createDate: '',
      endDate: '',
      publisher: '',
      scope: {
        type: '',
        targets: []
      },
      content: ''
    });
    setSelectedNotice(null);
    setIsModalOpen(false);
    
    // 显示成功提示
    message.success(selectedNotice ? '公告更新成功' : '公告发布成功');
  };

  const editorConfig: Partial<IEditorConfig> = {
    placeholder: '请输入内容...',
    MENU_CONF: {}
  }

  const toolbarConfig: Partial<IToolbarConfig> = {
    toolbarKeys: [
      'headerSelect',
      'bold',
      'italic',
      'underline',
      'through',
      'color',
      'bgColor',
      '|',
      'bulletedList',
      'numberedList',
      'todo',
      '|',
      'justifyLeft',
      'justifyCenter',
      'justifyRight',
      '|',
      'insertLink',
      'insertTable',
      'codeBlock',
      'divider'
    ]
  }

  const updateNoticeStatus = (notice: NoticeItem) => {
    if (!notice.is_read) {
      const updatedNotices = notices.map(item => 
        item.key === notice.key 
          ? { 
              ...item, 
              is_read: true,
              readCount: (item.readCount || 0) + 1 
            }
          : item
      )
      setNotices(updatedNotices)
      setSelectedNotice({ 
        ...notice, 
        is_read: true,
        readCount: (notice.readCount || 0) + 1 
      })
    }
  }

  useEffect(() => {
    return () => {
      if (editor == null) return
      editor.destroy()
      setEditor(null)
    }
  }, [editor])

  // 修改保存草稿的函数
  const saveDraft = (formData: NoticeFormData) => {
    const newDraft: DraftNotice = {
      ...formData,
      lastUpdated: new Date().toISOString()
    };
    localStorage.setItem('noticeFormDraft', JSON.stringify(newDraft));
    setDraft(newDraft);
    message.success('草稿已保存');
  };

  // 修改清除草稿的函数
  const clearDraft = () => {
    localStorage.removeItem('noticeFormDraft');
    setDraft(null);
  };

  // 修改handleNewNotice函数
  const handleNewNotice = () => {
    if (draft) {
      setShowDraftPrompt(true);
    } else {
      setSelectedNotice(null);
      setNoticeForm({
        title: '',
        type: '',
        createDate: '',
        endDate: '',
        publisher: mockCurrentUser.department,
        scope: {
          type: '',
          targets: []
        },
        content: ''
      });
      setIsModalOpen(true);
    }
  };

  // 检查类别是否在使用中
  const isCategoryInUse = (categoryName: string) => {
    return notices.some(notice => notice.type === categoryName);
  };

  // 更新类别选择器的选项
  const categoryOptions = categories.map(category => ({
    value: category.name,
    label: category.name
  }));

  // 修改删除类别的处理逻辑
  const handleDeleteCategory = (category: { id: string; name: string }) => {
    if (isCategoryInUse(category.name)) {
      message.error('该类别已被公告使用，无法删除');
      return;
    }

    Modal.confirm({
      title: '确认删除',
      content: '删除后不可恢复，是否继续？',
      onOk: () => {
        setCategories(categories.filter(cat => cat.id !== category.id));
        message.success('删除成功');
      }
    });
  };

  // 修改更新类别的处理逻辑
  const handleUpdateCategory = (category: { id: string; name: string }, newName: string) => {
    if (!newName.trim()) {
      message.error('类别名称不能为空');
      return;
    }
    
    if (categories.some(cat => cat.id !== category.id && cat.name === newName.trim())) {
      message.error('类别名称已存在');
      return;
    }

    const oldName = category.name;
    
    // 更新类别名
    setCategories(categories.map(cat =>
      cat.id === category.id 
        ? { ...cat, name: newName.trim() }
        : cat
    ));

    // 同步更新所有用该类别的公告
    setNotices(notices.map(notice =>
      notice.type === oldName
        ? { ...notice, type: newName.trim() }
        : notice
    ));

    setEditingCategory(null);
    message.success('修改成功');
  };

  const handleBatchMove = () => {
    if (!batchMoveTarget) {
      message.error('请选择目标类别');
      return;
    }

    const updatedNotices = notices.map(notice => 
      selectedRows.some(selected => selected.key === notice.key)
        ? { ...notice, type: batchMoveTarget }
        : notice
    );

    setNotices(updatedNotices);
    setSelectedRows([]);
    setBatchMoveTarget('');
    setIsBatchMoveModalOpen(false);
    message.success(`已将 ${selectedRows.length} 条公告移动至 "${batchMoveTarget}"`);
  };

  // 修改 Modal 组件的 footer
  const modalFooter = [
    isAdmin && !selectedNotice && (
      <Button key="save-draft" onClick={() => saveDraft(noticeForm)}>
        保存草稿
      </Button>
    ),
    <Button key="preview" onClick={() => setIsPreviewModalOpen(true)}>
      预览
    </Button>,
    <Button key="cancel" onClick={() => setIsModalOpen(false)}>
      取消
    </Button>,
    <Button key="submit" type="primary" onClick={handleNoticeSubmit}>
      发布
    </Button>
  ].filter(Boolean);

  // 添加删除处理函数
  const handleDelete = (notice: NoticeItem) => {
    setNoticeToDelete(notice);
    setIsDeleteModalOpen(true);
  };

  // 确认删除
  const confirmDelete = () => {
    if (noticeToDelete) {
      setNotices(prev => prev.filter(notice => notice.key !== noticeToDelete.key));
      message.success('删除成功');
      setIsDeleteModalOpen(false);
      setNoticeToDelete(null);
    }
  };

  // 批量删除
  const handleBatchDelete = () => {
    setIsBatchDeleteModalOpen(true);
  };

  // 确认批量删除
  const confirmBatchDelete = () => {
    const selectedKeys = selectedRows.map(row => row.key);
    setNotices(prev => prev.filter(notice => !selectedKeys.includes(notice.key)));
    setSelectedRows([]);
    setIsBatchDeleteModalOpen(false);
    message.success(`已删除 ${selectedKeys.length} 条公告`);
  };

  return (
    <div className="flex flex-col h-screen">
      {/* 顶部导航 */}
      <nav className="bg-[#f2f2f2] shadow-sm sticky top-0 z-10 h-12">
        <div className="container mx-auto px-3 py-2">
          <div className="flex items-center justify-between">
            {/* 可以在这里添加导航内容 */}
          </div>
        </div>
      </nav>

      {/* 主体内容区 */}
      <div className="flex flex-1 overflow-hidden">
        {/* 左侧菜单 */}
        <div className="w-36 bg-[#f2f2f2] shadow-sm overflow-y-auto">
          {/* 可以在这里添加菜单内容 */}
        </div>

        {/* 右侧内容区 */}
        <div className="flex-1 p-6 overflow-auto">
          <div className="flex justify-between items-center mb-4">
            <Button 
              type={isAdmin ? "primary" : "default"}
              onClick={() => setIsAdmin(!isAdmin)}
            >
              {isAdmin ? "退出管理模式" : "管理员模式"}
            </Button>
            
            {isAdmin && (
              <Space>
                <Button 
                  type="primary" 
                  icon={<PlusOutlined />}
                  onClick={handleNewNotice}
                >
                  新建公告
                </Button>
                <Button 
                  onClick={() => setIsCategoryModalOpen(true)}
                >
                  管理类别
                </Button>
                <Button 
                  icon={<SwapOutlined />}
                  onClick={() => setIsBatchMoveModalOpen(true)}
                  disabled={selectedRows.length === 0}
                >
                  批量移动
                </Button>
                <Button 
                  danger
                  icon={<DeleteOutlined />}
                  onClick={handleBatchDelete}
                  disabled={selectedRows.length === 0}
                >
                  批量删除
                </Button>
              </Space>
            )}
          </div>

          <div className="flex justify-between">
            <Tabs 
              items={tabItems} 
              activeKey={activeTab}
              onChange={setActiveTab}
            />
            <Space>
              <Input.Search
                placeholder="搜索公告标题"
                style={{ width: 300 }}
                value={searchKeyword}
                onChange={e => setSearchKeyword(e.target.value)}
                onSearch={value => setSearchKeyword(value)}
                allowClear
              />
              <Button 
                icon={<FilterOutlined />}
                onClick={() => setShowFilters(!showFilters)}
              >
                筛选 {showFilters ? <UpOutlined /> : <DownOutlined />}
              </Button>
            </Space>
          </div>

          {showFilters && (
            <div className="bg-gray-50 p-6 mb-4 rounded border">
              <div className="grid grid-cols-4 gap-x-8 gap-y-6">
                <div>
                  <div className="text-gray-600 text-sm mb-1.5">公告类别</div>
                  <Select
                    style={{ width: '100%' }}
                    value={filters.type}
                    onChange={(value) => setFilters(prev => ({ ...prev, type: value }))}
                    allowClear
                    placeholder="请选择公告类别"
                    size="middle"
                  >
                    {categories.map(category => (
                      <Select.Option key={category.id} value={category.name}>
                        {category.name}
                      </Select.Option>
                    ))}
                  </Select>
                </div>

                <div>
                  <div className="text-gray-600 text-sm mb-1.5 flex items-center">
                    最早生效日期
                    <Tooltip title="筛选该日期及之后生效的公告">
                      <InfoCircleOutlined className="ml-1 text-gray-400" />
                    </Tooltip>
                  </div>
                  <DatePicker
                    style={{ width: '100%' }}
                    value={filters.createDate}
                    onChange={(date) => setFilters(prev => ({ ...prev, createDate: date }))}
                    placeholder="请选择最早生效日期"
                    size="middle"
                  />
                </div>

                <div>
                  <div className="text-gray-600 text-sm mb-1.5 flex items-center">
                    最晚终止日期
                    <Tooltip title="筛选该日期及之前终止的公告">
                      <InfoCircleOutlined className="ml-1 text-gray-400" />
                    </Tooltip>
                  </div>
                  <DatePicker
                    style={{ width: '100%' }}
                    value={filters.endDate}
                    onChange={(date) => setFilters(prev => ({ ...prev, endDate: date }))}
                    placeholder="请选择最晚终止日期"
                    size="middle"
                  />
                </div>

                <div>
                  <div className="text-gray-600 text-sm mb-1.5">发布部门</div>
                  <Select
                    style={{ width: '100%' }}
                    value={filters.publisher}
                    onChange={(value) => setFilters(prev => ({ ...prev, publisher: value }))}
                    allowClear
                    placeholder="请选择发布部门"
                    size="middle"
                  >
                    <Select.Option value="HR部门">HR部门</Select.Option>
                    <Select.Option value="行政部">行政部</Select.Option>
                    <Select.Option value="文化委员会">文化委员会</Select.Option>
                    <Select.Option value="人事部">人事部</Select.Option>
                  </Select>
                </div>

                <div className="flex items-end col-span-4 justify-end space-x-2">
                  <Button onClick={() => {
                    setFilters({
                      type: '',
                      createDate: null,
                      endDate: null,
                      publisher: ''
                    })
                  }}>
                    重置
                  </Button>
                  <Button type="primary" onClick={() => setShowFilters(false)}>
                    确定
                  </Button>
                </div>
              </div>
            </div>
          )}
          
          <Table
            columns={columns}
            dataSource={getFilteredData()}
            rowSelection={isAdmin ? {
              onChange: (_, selectedRows) => setSelectedRows(selectedRows)
            } : undefined}
            pagination={{
              total: getFilteredData().length,
              pageSize: 15,
              showSizeChanger: false,
              showQuickJumper: true,
            }}
          />
        </div>
      </div>

      <Modal
        title="公告详情"
        open={isDetailModalOpen}
        onCancel={() => setIsDetailModalOpen(false)}
        footer={null}
        width={1000}
      >
        <div className="bg-[#ffffff] p-8">
          <div className="text-center mb-6 border-b pb-2">
            <Typography.Title level={2} style={{ color: '#00706a' }}>
              {selectedNotice?.title}
            </Typography.Title>
          </div>

          <div className="flex justify-between text-gray-500 text-sm mb-6 border-b pb-6">
            <div>
              <span className="inline-block w-20">【发布部门】</span>
              <span>{selectedNotice?.publisher}</span>
            </div>
            <div>
              <span className="inline-block w-20">【生效日期】</span>
              <span>{selectedNotice?.createDate}</span>
            </div>
            <div>
              <span className="inline-block w-20">【终止日期】</span>
              <span>{selectedNotice?.endDate}</span>
            </div>
          </div>
          
          <div className="rounded-lg min-h-[300px] whitespace-pre-line">
            {selectedNotice?.content}
          </div>
        </div>
      </Modal>

      <Modal
        title="发现草稿"
        open={showDraftPrompt}
        onCancel={() => {
          setShowDraftPrompt(false);
          setSelectedNotice(null);
          setNoticeForm({
            title: '',
            type: '',
            createDate: '',
            endDate: '',
            publisher: mockCurrentUser.department,
            scope: {
              type: '',
              targets: []
            },
            content: ''
          });
          setIsModalOpen(true);
        }}
        footer={[
          <Button 
            key="new" 
            onClick={() => {
              setShowDraftPrompt(false);
              setSelectedNotice(null);
              setNoticeForm({
                title: '',
                type: '',
                createDate: '',
                endDate: '',
                publisher: mockCurrentUser.department,
                scope: {
                  type: '',
                  targets: []
                },
                content: ''
              });
              setIsModalOpen(true);
            }}
          >
            创建新公告
          </Button>,
          <Button 
            key="load" 
            type="primary"
            onClick={() => {
              if (draft) {
                setNoticeForm({
                  title: draft.title,
                  type: draft.type,
                  createDate: draft.createDate,
                  endDate: draft.endDate,
                  publisher: draft.publisher,
                  scope: draft.scope,
                  content: draft.content
                });
                if (editor) {
                  editor.setHtml(draft.content);
                }
              }
              setShowDraftPrompt(false);
              setIsModalOpen(true);
            }}
          >
            加载草稿
          </Button>
        ]}
      >
        <p>发现上次未完成的公告草稿（{draft?.lastUpdated ? dayjs(draft.lastUpdated).format('YYYY-MM-DD HH:mm:ss') : '未知时间'}），是否继续编辑？</p>
      </Modal>

      <Modal
        title={selectedNotice ? "编辑公告" : "新建公告"}
        open={isModalOpen}
        onCancel={() => {
          setIsModalOpen(false);
          setSelectedNotice(null);
          setNoticeForm({
            title: '',
            type: '',
            createDate: '',
            endDate: '',
            publisher: '',
            scope: {
              type: '',
              targets: []
            },
            content: ''
          });
          if (editor) {
            editor.setHtml('');
          }
        }}
        footer={modalFooter}
        width={1000}
      >
        <div className="space-y-4">
          <div>
            <div className="mb-2">
              <span className="text-red-500 mr-1">*</span>
              公告标题
            </div>
            <Input
              value={noticeForm.title}
              onChange={e => setNoticeForm(prev => ({ ...prev, title: e.target.value }))}
              placeholder="请输入公告标题（25字以内）"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="mb-2">
                <span className="text-red-500 mr-1">*</span>
                公告类别
              </div>
              <Select
                style={{ width: '100%' }}
                value={noticeForm.type}
                onChange={value => setNoticeForm(prev => ({ ...prev, type: value }))}
                placeholder="请选择公告类别"
              >
                {categories.map(category => (
                  <Select.Option key={category.id} value={category.name}>
                    {category.name}
                  </Select.Option>
                ))}
              </Select>
            </div>

            <div>
              <div className="mb-2">
                发布部门
              </div>
              <Select
                style={{ width: '100%' }}
                value={noticeForm.publisher}
                disabled={true}
                placeholder="请选择发布部门"
              >
                <Select.Option value="HR部门">HR部门</Select.Option>
                <Select.Option value="行政部">行政部</Select.Option>
                <Select.Option value="文化委员会">文化委员会</Select.Option>
                <Select.Option value="人事部">人事部</Select.Option>
              </Select>
            </div>

            <div>
              <div className="mb-2">
                <span className="text-red-500 mr-1">*</span>
                生效日期
              </div>
              <DatePicker
                style={{ width: '100%' }}
                value={noticeForm.createDate ? dayjs(noticeForm.createDate) : null}
                onChange={(date) => setNoticeForm(prev => ({ 
                  ...prev, 
                  createDate: date ? date.format('YYYY-MM-DD') : '' 
                }))}
                placeholder="请选择生效日期"
                disabled={!!selectedNotice}
              />
              {selectedNotice && (
                <div className="text-gray-400 text-sm mt-1">
                  编辑模式下不可修改生效日期
                </div>
              )}
            </div>

            <div>
              <div className="mb-2">
                <span className="text-red-500 mr-1">*</span>
                终止日期
              </div>
              <DatePicker
                style={{ width: '100%' }}
                value={noticeForm.endDate ? dayjs(noticeForm.endDate) : null}
                onChange={(date) => setNoticeForm(prev => ({ 
                  ...prev, 
                  endDate: date ? date.format('YYYY-MM-DD') : '' 
                }))}
                placeholder="请选择终止日期"
              />
            </div>

            <div className="space-y-4">
              <div>
                <div className="mb-2">
                  <span className="text-red-500 mr-1">*</span>
                  发布范围
                </div>
                <Radio.Group
                  value={noticeForm.scope.type}
                  onChange={e => setNoticeForm(prev => ({ 
                    ...prev, 
                    scope: {
                      type: e.target.value,
                      targets: []  // 切换类型时清空已选项
                    }
                  }))}
                >
                  <div className="space-y-3">
                    <Radio value="全体人员">全体人员</Radio>
                    <Radio value="部门">部门</Radio>
                    <Radio value="角色">角色</Radio>
                    <Radio value="指定人员">指定人员</Radio>
                  </div>
                </Radio.Group>
              </div>

              {/* 根据选择的范围类型显示对应的二级选择器 */}
              {noticeForm.scope.type && noticeForm.scope.type !== '全体人员' && (
                <div className="pl-6 mt-3 bg-gray-100 p-4 rounded-lg">  {/* 添加边距以对齐 */}
                  <div className="mb-2">
                    {noticeForm.scope.type === '部门' && '选择部门'}
                    {noticeForm.scope.type === '角色' && '选择角色'}
                    {noticeForm.scope.type === '指定人员' && '选择人员'}
                  </div>
                  <Select
                    mode="multiple"
                    style={{ width: '100%' }}
                    value={noticeForm.scope.targets}
                    onChange={value => setNoticeForm(prev => ({
                      ...prev,
                      scope: {
                        ...prev.scope,
                        targets: value
                      }
                    }))}
                    placeholder={`请选择${noticeForm.scope.type === '部门' ? '部门' : 
                                        noticeForm.scope.type === '角色' ? '角色' : '人员'}`}
                  >
                    {noticeForm.scope.type === '部门' && mockDepartments.map(dept => (
                      <Select.Option key={dept} value={dept}>{dept}</Select.Option>
                    ))}
                    {noticeForm.scope.type === '角色' && mockRoles.map(role => (
                      <Select.Option key={role} value={role}>{role}</Select.Option>
                    ))}
                    {noticeForm.scope.type === '指定人员' && mockUsers.map(user => (
                      <Select.Option key={user} value={user}>{user}</Select.Option>
                    ))}
                  </Select>
                </div>
              )}
            </div>
          </div>

          <div>
            <div className="mb-2">
              <span className="text-red-500 mr-1">*</span>
              公告内容
            </div>
            <div className="border rounded-md">
              <Toolbar
                editor={editor}
                defaultConfig={toolbarConfig}
                mode="default"
                style={{ borderBottom: '1px solid #ccc' }}
              />
              <Editor
                defaultConfig={editorConfig}
                value={noticeForm.content}
                onCreated={setEditor}
                onChange={editor => setNoticeForm(prev => ({ ...prev, content: editor.getHtml() }))}
                style={{ height: '300px', overflowY: 'hidden' }}
              />
            </div>
          </div>
        </div>
      </Modal>

      <Modal
        title={
          <div className="pb-2">
            <span>管理公告类别</span>
          </div>
        }
        open={isCategoryModalOpen}
        onCancel={() => {
          setIsCategoryModalOpen(false);
          setEditingCategory(null);
          setNewCategoryName('');
        }}
        footer={null}
        width={600}
      >
        <div className="space-y-4">
          {/* 帮助提示 */}
          <div className="bg-blue-50 text-blue-700 p-3 rounded-lg text-sm flex items-start">
            <InfoCircleOutlined className="mr-2 mt-0.5" />
            <div>
              <p>使用说明：</p>
              <ul className="list-disc list-inside mt-1 space-y-1">
                <li>正在使用中的类别无法删除</li>
                <li>类别名称不能重复</li>
                <li>编辑后将同步更新所有使用该类别的公告</li>
              </ul>
            </div>
          </div>

          {/* 类别列表 */}
          <div className="divide-y">
            {categories.map(category => {
              const usageCount = notices.filter(notice => notice.type === category.name).length;
              
              return (
                <div 
                  key={category.id} 
                  className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex-1">
                    {editingCategory?.id === category.id ? (
                      <Input
                        value={editingCategory.name}
                        onChange={(e) => setEditingCategory({ 
                          ...editingCategory, 
                          name: e.target.value 
                        })}
                        onPressEnter={() => handleUpdateCategory(category, editingCategory.name)}
                        autoFocus
                      />
                    ) : (
                      <div className="flex items-center">
                        <span className="text-gray-900">{category.name}</span>
                      </div>
                    )}
                  </div>
                  
                  <Space>
                    {editingCategory?.id === category.id ? (
                      <>
                        <Button 
                          size="small"
                          type="primary"
                          onClick={() => handleUpdateCategory(category, editingCategory.name)}
                        >
                          确认
                        </Button>
                        <Button 
                          size="small"
                          onClick={() => setEditingCategory(null)}
                        >
                          取消
                        </Button>
                      </>
                    ) : (
                      <>
                        <Tooltip title="编辑类别">
                          <Button 
                            type="text"
                            size="small"
                            icon={<EditOutlined />}
                            onClick={() => setEditingCategory(category)}
                          />
                        </Tooltip>
                        <Tooltip title={usageCount > 0 ? "该类别正在使用中,无法删除" : "删除类别"}>
                          <Button 
                            type="text" 
                            danger 
                            size="small"
                            icon={<DeleteOutlined />}
                            disabled={usageCount > 0}
                            onClick={() => handleDeleteCategory(category)}
                          />
                        </Tooltip>
                      </>
                    )}
                  </Space>
                </div>
              );
            })}
          </div>

          {/* 添加新类别 */}
          <div className="flex gap-2 pt-2">
            <Input
              placeholder="输入新类别名称"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              onPressEnter={() => {
                if (!newCategoryName.trim()) {
                  message.error('类别名称不能为空');
                  return;
                }
                if (categories.some(cat => cat.name === newCategoryName.trim())) {
                  message.error('类别名称已存在');
                  return;
                }
                setCategories([...categories, { 
                  id: Date.now().toString(), 
                  name: newCategoryName.trim() 
                }]);
                setNewCategoryName('');
                message.success('添加成功');
              }}
            />
            <Button 
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => {
                if (!newCategoryName.trim()) {
                  message.error('类别名称不能为空');
                  return;
                }
                if (categories.some(cat => cat.name === newCategoryName.trim())) {
                  message.error('类别名称已存在');
                  return;
                }
                setCategories([...categories, { 
                  id: Date.now().toString(), 
                  name: newCategoryName.trim() 
                }]);
                setNewCategoryName('');
                message.success('添加成功');
              }}
            >
              添加
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        title="批量移动公告"
        open={isBatchMoveModalOpen}
        onCancel={() => {
          setIsBatchMoveModalOpen(false);
          setBatchMoveTarget('');
        }}
        onOk={handleBatchMove}
        okText="确定移动"
        cancelText="取消"
      >
        <div className="space-y-4">
          <div className="text-gray-500 mb-4">
            已选择 {selectedRows.length} 条公告
          </div>
          
          <div>
            <div className="mb-2">目标类别</div>
            <Select
              style={{ width: '100%' }}
              value={batchMoveTarget}
              onChange={value => setBatchMoveTarget(value)}
              placeholder="请选择目标类别"
            >
              {categories.map(category => (
                <Select.Option 
                  key={category.id} 
                  value={category.name}
                  disabled={selectedRows.every(row => row.type === category.name)}
                >
                  {category.name}
                </Select.Option>
              ))}
            </Select>
          </div>

          {selectedRows.length > 0 && (
            <div className="mt-4">
              <div className="text-sm text-gray-500 mb-2">将移动以下公告：</div>
              <div className="max-h-40 overflow-y-auto">
                {selectedRows.map(notice => (
                  <div 
                    key={notice.key}
                    className="flex justify-between items-center py-1 text-sm"
                  >
                    <span className="truncate flex-1">{notice.title}</span>
                    <span className="text-gray-400 ml-2">{notice.type}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </Modal>

      {/* 添加删除确认 Modal */}
      <Modal
        title="确认删除"
        open={isDeleteModalOpen}
        onCancel={() => {
          setIsDeleteModalOpen(false);
          setNoticeToDelete(null);
        }}
        onOk={confirmDelete}
        okText="确认删除"
        cancelText="取消"
        okButtonProps={{ danger: true }}
      >
        <p>确定要删除公告 "{noticeToDelete?.title}" 吗？此操作不可恢复。</p>
      </Modal>

      {/* 添加批量删除确认 Modal */}
      <Modal
        title="确认批量删除"
        open={isBatchDeleteModalOpen}
        onCancel={() => setIsBatchDeleteModalOpen(false)}
        onOk={confirmBatchDelete}
        okText="确认删除"
        cancelText="取消"
        okButtonProps={{ danger: true }}
      >
        <div className="space-y-4">
          <p>确定要删除以下 {selectedRows.length} 条公告吗？此操作不可恢复。</p>
          <div className="max-h-40 overflow-y-auto">
            {selectedRows.map(notice => (
              <div 
                key={notice.key}
                className="py-1 text-sm"
              >
                • {notice.title}
              </div>
            ))}
          </div>
        </div>
      </Modal>

      {/* 在最后一个 Modal 后添加预览模态框 */}
      <Modal
        title="公告预览"
        open={isPreviewModalOpen}
        onCancel={() => setIsPreviewModalOpen(false)}
        footer={null}
        width={1000}
      >
        <div className="bg-[#ffffff] p-8">
          <div className="text-center mb-6 border-b pb-2">
            <Typography.Title level={2} style={{ color: '#00706a' }}>
              {noticeForm.title || '未填写标题'}
            </Typography.Title>
          </div>

          <div className="flex justify-between text-gray-500 text-sm mb-6 border-b pb-6">
            <div>
              <span className="inline-block w-20">【发布部门】</span>
              <span>{noticeForm.publisher || '未选择'}</span>
            </div>
            <div>
              <span className="inline-block w-20">【生效日期】</span>
              <span>{noticeForm.createDate || '未选择'}</span>
            </div>
            <div>
              <span className="inline-block w-20">【终止日期】</span>
              <span>{noticeForm.endDate || '未选择'}</span>
            </div>
          </div>
          
          <div className="rounded-lg min-h-[300px]">
            <div 
              className="prose max-w-none"
              dangerouslySetInnerHTML={{ __html: noticeForm.content || '未填写内容' }}
            />
          </div>
        </div>
      </Modal>
    </div>
  )
}
