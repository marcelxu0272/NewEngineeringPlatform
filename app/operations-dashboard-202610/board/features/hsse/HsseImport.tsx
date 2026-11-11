'use client';

import { useEffect, useState } from 'react';
import { Alert, Button, Modal, Table, Tag } from 'antd';
import { formatHsse, HSSE_FIELDS, HsseResult, HsseValues, recordables } from '@/lib/hsse/types';

type PreviewRow = { rowNumber: number; year: number; month: number; values: HsseValues; action: '新增' | '覆盖' };
export default function HsseImport({ open, onClose, year, month, onSaved }: {
  open: boolean; onClose: () => void; year: number; month: number;
  onSaved: (data: HsseResult, count: number) => void;
}) {
  const [rows, setRows] = useState<PreviewRow[]>([]);
  const [skipped, setSkipped] = useState(0);
  const [filename, setFilename] = useState('');
  const [issues, setIssues] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  useEffect(() => { if (open) { setRows([]); setFilename(''); setError(''); setIssues([]); } }, [open]);

  const upload = async (file: File) => {
    setRows([]); setError(''); setIssues([]); setFilename(file.name);
    if (!/\.xlsx$/i.test(file.name) || !file.size || file.size > 4 * 1024 * 1024) { setError('请选择非空且不超过4MB的.xlsx文件'); return; }
    setBusy(true);
    try {
      const form = new FormData(); form.append('file', file);
      const response = await fetch('/api/hsse-performance/import', { method: 'POST', body: form });
      const result = await response.json();
      if (!response.ok) { setIssues(result.issues ?? []); throw new Error(result.error || 'Excel校验失败'); }
      setRows(result.rows); setSkipped(result.skipped);
    } catch (e) { setError(e instanceof Error ? e.message : '文件校验失败，请重新选择文件重试'); }
    finally { setBusy(false); }
  };
  const save = async () => {
    setBusy(true); setError('');
    try {
      const response = await fetch('/api/hsse-performance/import', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ year, month, rows }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || '批量保存失败，请重试');
      onSaved(result.data, result.count); onClose();
    } catch (e) { setError(e instanceof Error ? e.message : '批量保存失败，预览已保留，请重试'); }
    finally { setBusy(false); }
  };
  const overwrite = rows.filter(row => row.action === '覆盖').map(row => `${row.month}月`);
  return <Modal title="Excel宽表批量录入 · 全公司HSSE月报" open={open} width={1180}
    onCancel={() => { if (!busy) onClose(); }} closable={!busy} maskClosable={!busy} keyboard={!busy}
    onOk={save} confirmLoading={busy} okButtonProps={{ disabled: !rows.length || busy, 'aria-label': `确认导入${rows.length ? ` ${rows.length} 个月` : ''}` }} cancelButtonProps={{ disabled: busy }}
    okText={`确认导入${rows.length ? ` ${rows.length} 个月` : ''}`} cancelText="取消">
    <p className="mb-3 text-sm text-slate-500">每月一行，11项指标横向展开。人工时单位为百万（例如0.28），最多6位小数。年度累计和Recordables由系统计算。</p>
    <div className="mb-4 flex flex-wrap items-center gap-4">
      <Button href="/operations-dashboard-202610/HSSE月报批量导入模板.xlsx" download>下载Excel宽表模板</Button>
      <label className="text-sm text-slate-600">
        <span className="mr-2">选择Excel文件</span>
        <input aria-label="HSSE批量导入Excel" type="file" accept=".xlsx" disabled={busy}
          onChange={event => { const file = event.target.files?.[0]; event.target.value = ''; if (file) void upload(file); }} />
      </label>
    </div>
    {busy && !rows.length && <p role="status" className="mb-3 text-sm text-slate-500">正在校验Excel…</p>}
    {error && <Alert className="mb-3" type="error" showIcon message={error}
      description={issues.length ? <ul className="max-h-48 list-disc overflow-auto pl-5">{issues.map((issue, i) => <li key={i}>{issue}</li>)}</ul> : undefined} />}
    {rows.length > 0 && <>
      <Alert className="mb-3" type={overwrite.length ? 'warning' : 'info'} showIcon
        message={`${filename}：${rows.length}个月可导入，跳过${skipped}个未填写月份。${overwrite.length ? `将覆盖已有月报：${overwrite.join('、')}。` : '均为新增月份。'}确认后整批保存。`} />
      <Table<PreviewRow> size="small" rowKey="month" pagination={false} scroll={{ x: 1950, y: 360 }} dataSource={rows}
        columns={[
          { title: '月份', dataIndex: 'month', fixed: 'left', width: 110, render: value => `${year}-${value}` },
          { title: '操作', dataIndex: 'action', width: 80, render: value => <Tag color={value === '覆盖' ? 'orange' : 'green'}>{value}</Tag> },
          ...HSSE_FIELDS.map(({ key, label }) => ({ title: label, key, width: key === 'property' ? 240 : 145,
            render: (_: unknown, row: PreviewRow) => formatHsse(key, row.values[key]) })),
          { title: 'Recordables（计算）', key: 'recordables', width: 150, render: (_, row) => recordables(row.values) },
        ]} />
    </>}
    <p className="mt-3 text-xs text-slate-500">未填写任何指标的月份会跳过；有填写的月份必须填齐全部指标，零值请填0。同月不可重复，不接受公式单元格。校验失败整批不导入。</p>
  </Modal>;
}
