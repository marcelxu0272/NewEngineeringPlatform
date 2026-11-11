'use client';
import {useEffect,useState} from 'react';
import {Alert,Input,Modal} from 'antd';
import {formatHsse,HSSE_FIELDS,HsseKey,HsseMonth,HsseResult,HsseValues,MAX_HSSE_VALUE} from '@/lib/hsse/types';
const blank=()=>Object.fromEntries(HSSE_FIELDS.map(({key})=>[key,''])) as Record<HsseKey,string>;
export default function HsseEntry({year,month,open,current,saving,setSaving,onClose,onSaved}:{year:number;month:number;open:boolean;current:HsseMonth|null;saving:boolean;setSaving:(saving:boolean)=>void;onClose:()=>void;onSaved:(result:HsseResult)=>void}){
const [draft,setDraft]=useState(blank),[saveError,setSaveError]=useState('');
useEffect(()=>{if(!open)return;const next=blank();if(current)for(const {key} of HSSE_FIELDS)next[key]=key==='hours'?formatHsse(key,current[key]).slice(0,-1):String(current[key]);setDraft(next);setSaveError('');},[open,current]);
  const save = async () => {
    const values = {} as HsseValues;
    for (const { key, label } of HSSE_FIELDS) {
      const text = draft[key].trim();
      if (!(key === 'hours' ? /^\d+(\.\d{1,6})?$/ : /^\d+$/).test(text)) {
        setSaveError(`${label}：${key === 'hours' ? '请输入非负数，最多6位小数' : '请输入非负整数'}，不可留空`); return;
      }
      if (key === 'hours') {
        const [whole, fraction = ''] = text.split('.');
        values[key] = Number(whole) * 1_000_000 + Number(fraction.padEnd(6, '0'));
      } else values[key] = Number(text);
      if (!Number.isSafeInteger(values[key]) || values[key] > MAX_HSSE_VALUE) { setSaveError(`${label}：数值超出支持范围`); return; }
    }
    setSaving(true); setSaveError('');
    try {
      const res = await fetch('/api/hsse-performance', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ year, month, values }) });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || '保存失败，请重试');
      onSaved(result); onClose();
    } catch (error) { setSaveError(error instanceof Error ? error.message : '保存失败，输入已保留，请重试'); }
    finally { setSaving(false); }
  };


return (    <Modal title={`${year}年${month}月 · HSSE数据录入`} open={open} width={720} onCancel={() => { if (!saving) onClose(); }}
      onOk={save} okText={saveError ? '重试保存' : '保存本月数据'} cancelText="取消" confirmLoading={saving} cancelButtonProps={{ disabled: saving }}
      closable={!saving} maskClosable={!saving} keyboard={!saving}>
      <p className="mb-4 text-sm text-slate-500">全公司月报 · 所有项目必填，零值请填0。年度累计及 Recordables 自动计算。</p>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {HSSE_FIELDS.map(({ key, label }) => <label key={key} className="block text-xs font-medium text-slate-600">
          <span className="mb-1 block">{label}</span>
          <Input aria-label={label} value={draft[key]} disabled={saving} inputMode={key === 'hours' ? 'decimal' : 'numeric'}
            maxLength={24} placeholder={key === 'hours' ? '例如 0.28（百万人工时）' : '非负整数'}
            onChange={event => { const value = event.target.value; setDraft(prev => ({ ...prev, [key]: value })); }} />
        </label>)}
      </div>
      {saveError && <Alert className="mt-4" type="error" showIcon message={saveError} />}
    </Modal>
);
}
