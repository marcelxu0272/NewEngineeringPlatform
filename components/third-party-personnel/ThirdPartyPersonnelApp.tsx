'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ConfigProvider, Pagination, message, Modal, Button, Space } from 'antd';
import { PlusOutlined, UploadOutlined, DownloadOutlined } from '@ant-design/icons';
import {
  DEFAULT_PERSONNEL,
  DEFAULT_PROJECT_OPTIONS,
  THIRD_PARTY_STORAGE_KEY,
  type ImportPreview,
  type ImportRow,
  type ThirdPartyPerson,
  parseCSVFile,
  validateImportData,
} from '@/lib/third-party-personnel';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

function loadStored(): ThirdPartyPerson[] | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(THIRD_PARTY_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ThirdPartyPerson[];
    return Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / k ** i).toFixed(2))} ${sizes[i]}`;
}

export function ThirdPartyPersonnelApp() {
  type PersonFormData = Omit<ThirdPartyPerson, 'id'> & { id: number | null };
  const topActionBtnClass =
    '!bg-[#163344] !border-[#163344] hover:!bg-[#1d4054] hover:!border-[#1d4054] !shadow-none';
  const [personnelList, setPersonnelList] = useState<ThirdPartyPerson[]>(DEFAULT_PERSONNEL);
  const [searchQuery, setSearchQuery] = useState('');
  const [projectFilter, setProjectFilter] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [importStep, setImportStep] = useState(1);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importPreview, setImportPreview] = useState<ImportPreview>({
    total: 0,
    valid: 0,
    invalid: 0,
    data: [],
  });
  const [importResult, setImportResult] = useState({
    success: false,
    imported: 0,
    message: '',
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState<PersonFormData>({
    id: null,
    companyName: '',
    name: '',
    gender: '',
    age: 28,
    project: '',
    arrivalDate: '',
    projectDuration: '',
    phone: '',
  });

  useEffect(() => {
    const stored = loadStored();
    if (stored && stored.length > 0) {
      setPersonnelList(stored);
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(THIRD_PARTY_STORAGE_KEY, JSON.stringify(personnelList));
    } catch {
      /* ignore quota */
    }
  }, [personnelList]);

  const projectList = useMemo(() => {
    const s = new Set(DEFAULT_PROJECT_OPTIONS);
    personnelList.forEach((p) => {
      if (p.project) s.add(p.project);
    });
    return Array.from(s).sort();
  }, [personnelList]);

  const filteredData = useMemo(() => {
    let filtered = personnelList;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (person) =>
          person.name.toLowerCase().includes(q) || person.companyName.toLowerCase().includes(q),
      );
    }
    if (projectFilter) {
      filtered = filtered.filter((person) => person.project === projectFilter);
    }
    return filtered;
  }, [personnelList, searchQuery, projectFilter]);

  const filteredTotal = filteredData.length;

  const filteredPersonnel = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredData.slice(start, start + pageSize);
  }, [filteredData, currentPage, pageSize]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, projectFilter]);

  const totalPersonnelCount = personnelList.length;
  const totalCompanyCount = useMemo(
    () => new Set(personnelList.map((p) => p.companyName)).size,
    [personnelList],
  );
  const totalProjectCount = useMemo(
    () => new Set(personnelList.map((p) => p.project)).size,
    [personnelList],
  );

  const resetFormData = useCallback(() => {
    setFormData({
      id: null,
      companyName: '',
      name: '',
      gender: '',
      age: 28,
      project: '',
      arrivalDate: '',
      projectDuration: '',
      phone: '',
    });
  }, []);

  const closeDialog = () => {
    setShowAddDialog(false);
    setShowEditDialog(false);
    resetFormData();
  };

  const validateForm = (): boolean => {
    const phoneOk = /^1[3-9]\d{9}$/.test(formData.phone);
    if (!formData.companyName.trim() || formData.companyName.length < 2) {
      message.error('请输入有效的公司名称');
      return false;
    }
    if (!formData.name.trim() || formData.name.length < 2) {
      message.error('请输入有效的姓名');
      return false;
    }
    if (!formData.gender) {
      message.error('请选择性别');
      return false;
    }
    if (formData.age < 18 || formData.age > 65) {
      message.error('年龄必须在18到65之间');
      return false;
    }
    if (!formData.project) {
      message.error('请选择所属项目');
      return false;
    }
    if (!formData.arrivalDate) {
      message.error('请选择到岗时间');
      return false;
    }
    if (!formData.projectDuration.trim() || formData.projectDuration.length < 2) {
      message.error('请输入项目周期');
      return false;
    }
    if (!phoneOk) {
      message.error('请输入正确的11位手机号码');
      return false;
    }
    return true;
  };

  const savePerson = () => {
    if (!validateForm()) return;
    if (showAddDialog) {
      const newPerson: ThirdPartyPerson = {
        ...formData,
        id: Date.now(),
      };
      setPersonnelList((prev) => [...prev, newPerson]);
      message.success('人员信息添加成功');
    } else {
      setPersonnelList((prev) =>
        prev.map((p) => (p.id === formData.id ? { ...formData, id: formData.id! } : p)),
      );
      message.success('人员信息更新成功');
    }
    closeDialog();
  };

  const editPerson = (person: ThirdPartyPerson) => {
    setFormData({ ...person, id: person.id });
    setShowEditDialog(true);
  };

  const deletePerson = (id: number) => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除该人员信息吗？',
      okText: '确定',
      cancelText: '取消',
      onOk: () => {
        setPersonnelList((prev) => prev.filter((p) => p.id !== id));
        message.success('删除成功');
      },
    });
  };

  const exportData = () => {
    if (filteredData.length === 0) {
      message.warning('没有数据可以导出');
      return;
    }
    const headers = ['序号', '公司名称', '姓名', '性别', '年龄', '所属项目', '到岗时间', '项目周期', '联系电话'];
    const csvContent = [
      headers.join(','),
      ...filteredData.map((person, index) =>
        [
          index + 1,
          person.companyName,
          person.name,
          person.gender,
          person.age,
          person.project,
          person.arrivalDate,
          person.projectDuration,
          person.phone,
        ].join(','),
      ),
    ].join('\n');
    const blob = new Blob([`\ufeff${csvContent}`], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `第三方人员管理_${new Date().toISOString().slice(0, 10)}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    message.success('数据导出成功');
  };

  const resetImport = () => {
    setImportStep(1);
    setImportFile(null);
    setImportPreview({ total: 0, valid: 0, invalid: 0, data: [] });
    setImportResult({ success: false, imported: 0, message: '' });
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const closeImportDialog = () => {
    setShowImportDialog(false);
    resetImport();
  };

  const validateAndSetFile = (file: File) => {
    const allowedExtensions = ['.xlsx', '.xls', '.csv'];
    const ext = `.${file.name.split('.').pop()?.toLowerCase() ?? ''}`;
    if (!allowedExtensions.includes(ext)) {
      message.error('请选择Excel(.xlsx, .xls)或CSV文件');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      message.error('文件大小不能超过10MB');
      return;
    }
    setImportFile(file);
  };

  const parseImportFile = async () => {
    if (!importFile) {
      message.error('请先选择文件');
      return;
    }
    const ext = `.${importFile.name.split('.').pop()?.toLowerCase() ?? ''}`;
    try {
      message.loading({ content: '正在解析文件...', key: 'import', duration: 0 });
      let data: Record<string, string>[] = [];
      if (ext === '.csv') {
        data = await parseCSVFile(importFile);
      } else {
        message.destroy('import');
        message.error('当前版本请先将 Excel 另存为 CSV 后上传');
        return;
      }
      const preview = validateImportData(data, projectList);
      setImportPreview(preview);
      setImportStep(2);
      message.destroy('import');
      message.success(`文件解析完成，共${preview.total}条记录`);
    } catch (e) {
      message.destroy('import');
      message.error(`文件解析失败：${e instanceof Error ? e.message : String(e)}`);
    }
  };

  const confirmImport = async () => {
    try {
      message.loading({ content: '正在导入数据...', key: 'import2', duration: 0 });
      const validData = importPreview.data.filter((row) => row.isValid);
      await new Promise((r) => setTimeout(r, 300));
      const additions: ThirdPartyPerson[] = validData.map((row) => ({
        id: Date.now() + Math.random(),
        companyName: String(row.companyName ?? ''),
        name: String(row.name ?? ''),
        gender: String(row.gender ?? ''),
        age: parseInt(String(row.age ?? '0'), 10),
        project: String(row.project ?? ''),
        arrivalDate: String(row.arrivalDate ?? ''),
        projectDuration: String(row.projectDuration ?? ''),
        phone: String(row.phone ?? ''),
      }));
      setPersonnelList((prev) => [...prev, ...additions]);
      setImportResult({ success: true, imported: additions.length, message: '' });
      setImportStep(3);
      message.destroy('import2');
      message.success(`成功导入${additions.length}条记录`);
    } catch (e) {
      message.destroy('import2');
      const msg = e instanceof Error ? e.message : '导入过程中发生未知错误';
      setImportResult({ success: false, imported: 0, message: msg });
      setImportStep(3);
      message.error(`导入失败：${msg}`);
    }
  };

  const downloadTemplate = () => {
    const headers = ['公司名称', '姓名', '性别', '年龄', '所属项目', '实际到岗时间', '项目周期', '联系电话'];
    const exampleData = [
      ['此条为示例数据请删除', '张三', '男', '28', 'D25999', '2024/1/15', '6个月', '13812345678'],
      ['此条为示例数据请删除', '李四', '女', '30', 'D25999', '2024-02-20', '3个月', '13987654321'],
    ];
    const csvContent = [headers.join(','), ...exampleData.map((row) => row.join(','))].join('\n');
    const blob = new Blob([`\ufeff${csvContent}`], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `第三方人员管理_导入模板_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    message.success('CSV模板下载成功');
  };

  const formOpen = showAddDialog || showEditDialog;

  return (
    <ConfigProvider
      theme={{
        token: { colorPrimary: '#007069', colorLink: '#007069' },
      }}
    >
      <div className="h-full min-h-0 overflow-y-auto px-6 pb-6">
        {/* 与人力资源看板 Vue 版一致：主操作均为 primary */}
        <div className="mb-6">
          <Space size="middle" wrap>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              className={topActionBtnClass}
              onClick={() => {
                resetFormData();
                setShowAddDialog(true);
              }}
            >
              添加人员
            </Button>
            <Button
              type="primary"
              icon={<UploadOutlined />}
              className={topActionBtnClass}
              onClick={() => setShowImportDialog(true)}
            >
              批量导入
            </Button>
            <Button type="primary" icon={<DownloadOutlined />} className={topActionBtnClass} onClick={exportData}>
              导出数据
            </Button>
          </Space>
        </div>

        <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
          <Card>
            <CardContent className="p-4">
              <div className="text-sm text-gray-600">总人员数量</div>
              <div className="mt-1 text-3xl font-bold text-gray-800">{totalPersonnelCount}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-sm text-gray-600">合作公司数量</div>
              <div className="mt-1 text-3xl font-bold text-gray-800">{totalCompanyCount}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-sm text-gray-600">涉及项目数量</div>
              <div className="mt-1 text-3xl font-bold text-gray-800">{totalProjectCount}</div>
            </CardContent>
          </Card>
        </div>

        <div className="mb-6 rounded-lg bg-white p-6 shadow">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-12">
            <div className="md:col-span-6">
              <label className="mb-2 block text-sm font-medium text-gray-700">搜索姓名或公司</label>
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="输入姓名或公司名称..."
              />
            </div>
            <div className="md:col-span-4">
              <label className="mb-2 block text-sm font-medium text-gray-700">所属项目</label>
              <Select value={projectFilter || '__all__'} onValueChange={(v) => setProjectFilter(v === '__all__' ? '' : v)}>
                <SelectTrigger>
                  <SelectValue placeholder="全部项目" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">全部项目</SelectItem>
                  {projectList.map((p) => (
                    <SelectItem key={p} value={p}>
                      {p}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end md:col-span-2">
              <Button className="w-full" onClick={() => { setSearchQuery(''); setProjectFilter(''); }}>
                重置筛选
              </Button>
            </div>
          </div>
        </div>

        <div className="overflow-hidden rounded-lg bg-white shadow">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {['序号', '公司名称', '姓名', '性别', '年龄', '所属项目', '到岗时间', '项目周期', '联系电话', '操作'].map(
                    (h) => (
                      <th
                        key={h}
                        className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
                      >
                        {h}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {filteredPersonnel.map((person, index) => (
                  <tr key={person.id} className="hover:bg-gray-50">
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-900">
                      {(currentPage - 1) * pageSize + index + 1}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm">{person.companyName}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm">{person.name}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm">{person.gender}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm">{person.age}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm">{person.project}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm">{person.arrivalDate}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm">{person.projectDuration}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm">{person.phone}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm font-medium">
                      <button type="button" className="mr-3 text-blue-600 hover:text-blue-900" onClick={() => editPerson(person)}>
                        编辑
                      </button>
                      <button type="button" className="text-red-600 hover:text-red-900" onClick={() => deletePerson(person.id)}>
                        删除
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredPersonnel.length === 0 && (
                  <tr>
                    <td colSpan={10} className="px-4 py-8 text-center text-gray-500">
                      暂无人员信息
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="flex flex-col items-stretch justify-between gap-4 border-t border-gray-200 bg-white px-4 py-4 sm:flex-row sm:items-center">
            <div className="text-sm text-gray-700">
              显示第{' '}
              <span className="font-medium">
                {filteredTotal === 0 ? 0 : (currentPage - 1) * pageSize + 1}
              </span>{' '}
              至{' '}
              <span className="font-medium">{Math.min(currentPage * pageSize, filteredTotal)}</span> 条，共{' '}
              <span className="font-medium">{filteredTotal}</span> 条记录
            </div>
            <Pagination
              current={currentPage}
              pageSize={pageSize}
              total={filteredTotal}
              showSizeChanger
              pageSizeOptions={['10', '20', '50', '100']}
              showQuickJumper
              onChange={(page, size) => {
                setCurrentPage(page);
                if (size && size !== pageSize) {
                  setPageSize(size);
                  setCurrentPage(1);
                }
              }}
            />
          </div>
        </div>

        <Dialog open={formOpen} onOpenChange={(o) => !o && closeDialog()}>
          <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{showAddDialog ? '添加人员信息' : '编辑人员信息'}</DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm">公司名称 *</label>
                <Input
                  value={formData.companyName}
                  onChange={(e) => setFormData((f) => ({ ...f, companyName: e.target.value }))}
                />
              </div>
              <div>
                <label className="mb-1 block text-sm">姓名 *</label>
                <Input value={formData.name} onChange={(e) => setFormData((f) => ({ ...f, name: e.target.value }))} />
              </div>
              <div>
                <label className="mb-1 block text-sm">性别 *</label>
                <Select
                  value={formData.gender || undefined}
                  onValueChange={(v) => setFormData((f) => ({ ...f, gender: v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="选择性别" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="男">男</SelectItem>
                    <SelectItem value="女">女</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="mb-1 block text-sm">年龄 *</label>
                <Input
                  type="number"
                  min={18}
                  max={65}
                  value={formData.age}
                  onChange={(e) => setFormData((f) => ({ ...f, age: parseInt(e.target.value, 10) || 0 }))}
                />
              </div>
              <div>
                <label className="mb-1 block text-sm">所属项目 *</label>
                <Select
                  value={formData.project || undefined}
                  onValueChange={(v) => setFormData((f) => ({ ...f, project: v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="选择项目" />
                  </SelectTrigger>
                  <SelectContent>
                    {projectList.map((p) => (
                      <SelectItem key={p} value={p}>
                        {p}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="mb-1 block text-sm">实际到岗时间 *</label>
                <Input
                  type="date"
                  value={formData.arrivalDate}
                  onChange={(e) => setFormData((f) => ({ ...f, arrivalDate: e.target.value }))}
                />
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1 block text-sm">项目周期 *</label>
                <Input
                  value={formData.projectDuration}
                  onChange={(e) => setFormData((f) => ({ ...f, projectDuration: e.target.value }))}
                  placeholder="如：3个月、6个月等"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1 block text-sm">联系电话 *</label>
                <Input
                  maxLength={11}
                  value={formData.phone}
                  onChange={(e) => setFormData((f) => ({ ...f, phone: e.target.value.replace(/\D/g, '') }))}
                  placeholder="11位手机号码"
                />
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <Button onClick={closeDialog}>取消</Button>
              <Button type="primary" onClick={savePerson}>
                {showAddDialog ? '添加' : '保存'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog
          open={showImportDialog}
          onOpenChange={(o) => {
            if (!o) closeImportDialog();
          }}
        >
          <DialogContent className="max-h-[90vh] max-w-5xl overflow-y-auto">
            <DialogHeader>
              <DialogTitle>批量导入人员信息</DialogTitle>
            </DialogHeader>

            <div className="mb-8 flex flex-wrap items-center justify-center gap-2 text-sm">
              <div className={`flex items-center gap-2 ${importStep >= 1 ? 'text-[#007069]' : 'text-gray-400'}`}>
                <span
                  className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium ${
                    importStep >= 1 ? 'bg-[#007069] text-white' : 'bg-gray-300 text-gray-600'
                  }`}
                >
                  1
                </span>
                上传文件
              </div>
              <div className={`h-1 w-12 ${importStep >= 2 ? 'bg-[#007069]' : 'bg-gray-300'}`} />
              <div className={`flex items-center gap-2 ${importStep >= 2 ? 'text-[#007069]' : 'text-gray-400'}`}>
                <span
                  className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium ${
                    importStep >= 2 ? 'bg-[#007069] text-white' : 'bg-gray-300 text-gray-600'
                  }`}
                >
                  2
                </span>
                预览数据
              </div>
              <div className={`h-1 w-12 ${importStep >= 3 ? 'bg-[#007069]' : 'bg-gray-300'}`} />
              <div className={`flex items-center gap-2 ${importStep >= 3 ? 'text-[#007069]' : 'text-gray-400'}`}>
                <span
                  className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium ${
                    importStep >= 3 ? 'bg-[#007069] text-white' : 'bg-gray-300 text-gray-600'
                  }`}
                >
                  3
                </span>
                确认导入
              </div>
            </div>

            {importStep === 1 && (
              <div className="space-y-4">
                <div className="rounded-lg bg-gray-50 p-4">
                  <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
                    <h4 className="font-medium">必需字段</h4>
                    <Button type="primary" size="small" onClick={downloadTemplate}>
                      下载模板
                    </Button>
                  </div>
                  <p className="mb-2 text-xs text-gray-500">请使用 CSV 文件导入；Excel 请先另存为 CSV。</p>
                  <div
                    role="button"
                    tabIndex={0}
                    className="cursor-pointer rounded-lg border-2 border-dashed border-gray-300 p-8 text-center hover:border-gray-400"
                    onClick={() => fileInputRef.current?.click()}
                    onKeyDown={(e) => e.key === 'Enter' && fileInputRef.current?.click()}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault();
                      const f = e.dataTransfer.files[0];
                      if (f) validateAndSetFile(f);
                    }}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".xlsx,.xls,.csv"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) validateAndSetFile(f);
                      }}
                    />
                    {!importFile ? (
                      <p className="text-gray-600">点击或拖拽 CSV 文件到此处</p>
                    ) : (
                      <div>
                        <p className="font-medium">{importFile.name}</p>
                        <p className="text-sm text-gray-500">{formatFileSize(importFile.size)}</p>
                        <button
                          type="button"
                          className="mt-2 text-sm text-red-600"
                          onClick={(ev) => {
                            ev.stopPropagation();
                            setImportFile(null);
                            if (fileInputRef.current) fileInputRef.current.value = '';
                          }}
                        >
                          移除文件
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {importStep === 2 && (
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div className="rounded-lg bg-white p-3 shadow">
                    <div className="text-2xl font-bold text-blue-600">{importPreview.total}</div>
                    <div className="text-sm text-gray-500">总记录数</div>
                  </div>
                  <div className="rounded-lg bg-white p-3 shadow">
                    <div className="text-2xl font-bold text-green-600">{importPreview.valid}</div>
                    <div className="text-sm text-gray-500">有效记录</div>
                  </div>
                  <div className="rounded-lg bg-white p-3 shadow">
                    <div className="text-2xl font-bold text-red-600">{importPreview.invalid}</div>
                    <div className="text-sm text-gray-500">错误记录</div>
                  </div>
                </div>
                <div className="max-h-80 overflow-auto rounded border">
                  <table className="min-w-full text-sm">
                    <thead className="sticky top-0 bg-gray-50">
                      <tr>
                        <th className="px-2 py-2 text-left">状态</th>
                        <th className="px-2 py-2 text-left">公司名称</th>
                        <th className="px-2 py-2 text-left">姓名</th>
                        <th className="px-2 py-2 text-left">错误信息</th>
                      </tr>
                    </thead>
                    <tbody>
                      {importPreview.data.map((row: ImportRow, idx: number) => (
                        <tr key={idx} className="border-t">
                          <td className="px-2 py-2">{row.isValid ? '✓' : '✗'}</td>
                          <td className="px-2 py-2">{String(row.companyName ?? '')}</td>
                          <td className="px-2 py-2">{String(row.name ?? '')}</td>
                          <td className="px-2 py-2 text-red-600">{(row.errors ?? []).join(', ') || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {importStep === 3 && (
              <div className="rounded-lg bg-gray-50 p-8 text-center">
                {importResult.success ? (
                  <div>
                    <p className="text-lg font-medium text-green-700">导入成功</p>
                    <p className="mt-2 text-3xl font-bold text-green-600">{importResult.imported}</p>
                    <p className="text-sm text-gray-600">条记录已加入列表</p>
                  </div>
                ) : (
                  <div>
                    <p className="text-lg font-medium text-red-700">导入失败</p>
                    <p className="mt-2 text-red-600">{importResult.message}</p>
                  </div>
                )}
              </div>
            )}

            <div className="mt-6 flex flex-wrap justify-between gap-2 border-t pt-4">
              <Button onClick={closeImportDialog}>{importStep === 3 ? '完成' : '取消'}</Button>
              <div className="flex gap-2">
                {importStep === 1 && (
                  <Button type="primary" disabled={!importFile} onClick={() => void parseImportFile()}>
                    解析文件
                  </Button>
                )}
                {importStep === 2 && (
                  <Button type="primary" disabled={importPreview.valid === 0} onClick={() => void confirmImport()}>
                    确认导入
                  </Button>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </ConfigProvider>
  );
}
