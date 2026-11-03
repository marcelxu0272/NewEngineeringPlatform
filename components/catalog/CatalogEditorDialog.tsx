'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import type { CatalogItem } from '@/lib/catalog-filter';

async function toJpeg(file: File): Promise<Blob> {
  if (!file.type.startsWith('image/')) throw new Error('请选择图片');
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, 1280 / bitmap.width);
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(bitmap.width * scale));
  canvas.height = Math.max(1, Math.round(bitmap.height * scale));
  const context = canvas.getContext('2d');
  if (!context) throw new Error('无法处理图片');
  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.8));
  if (!blob) throw new Error('无法处理图片');
  if (blob.size > 2 * 1024 * 1024) throw new Error('图片不能超过 2MB');
  return blob;
}

export function CatalogEditorDialog({
  item,
  open,
  saving,
  error,
  onOpenChange,
  onSave,
}: {
  item: CatalogItem | null;
  open: boolean;
  saving: boolean;
  error: string;
  onOpenChange: (open: boolean) => void;
  onSave: (item: CatalogItem, file: Blob | null) => void;
}) {
  const [form, setForm] = useState<CatalogItem | null>(item);
  const [tagInput, setTagInput] = useState('');
  const [file, setFile] = useState<Blob | null>(null);
  const [preview, setPreview] = useState('');
  const [localError, setLocalError] = useState('');

  useEffect(() => {
    setForm(item);
    setTagInput('');
    setFile(null);
    setPreview('');
    setLocalError('');
  }, [item]);

  useEffect(() => {
    if (!preview) return;
    return () => URL.revokeObjectURL(preview);
  }, [preview]);

  function addTag() {
    if (!form) return;
    const value = tagInput.trim();
    if (!value) return;
    if (value.length > 12) {
      setLocalError('标签过长');
      return;
    }
    if (form.tags.length >= 8) {
      setLocalError('标签最多 8 个');
      return;
    }
    if (!form.tags.includes(value)) {
      setForm({ ...form, tags: [...form.tags, value] });
    }
    setTagInput('');
    setLocalError('');
  }

  async function onPickFile(selected: File | undefined) {
    if (!selected) return;
    try {
      const jpeg = await toJpeg(selected);
      setFile(jpeg);
      setPreview(URL.createObjectURL(jpeg));
      setLocalError('');
    } catch (pickError) {
      setLocalError(pickError instanceof Error ? pickError.message : '无法处理图片');
    }
  }

  const message = localError || error;
  const shownThumb = preview || form?.thumbnail || '';

  return (
    <Dialog open={open} onOpenChange={(next) => !saving && onOpenChange(next)}>
      <DialogContent className="flex h-[640px] w-[720px] max-w-[720px] flex-col gap-0 overflow-hidden p-0">
        <DialogHeader className="shrink-0 border-b px-6 py-4 pr-12">
          <DialogTitle>编辑功能</DialogTitle>
          <DialogDescription>修改名称、说明、标签和首页显示。路径不可更改。</DialogDescription>
        </DialogHeader>
        {form && (
          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-6 py-4">
            <label className="block space-y-1.5 text-sm">
              <span className="text-gray-600">标识</span>
              <Input value={form.id} readOnly />
            </label>
            <label className="block space-y-1.5 text-sm">
              <span className="text-gray-600">路径</span>
              <Input value={form.href} readOnly />
            </label>
            <label className="block space-y-1.5 text-sm">
              <span className="text-gray-600">名称</span>
              <Input
                value={form.title}
                maxLength={80}
                onChange={(event) => setForm({ ...form, title: event.target.value })}
              />
            </label>
            <label className="block space-y-1.5 text-sm">
              <span className="text-gray-600">说明</span>
              <textarea
                value={form.description}
                maxLength={200}
                rows={3}
                className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                onChange={(event) => setForm({ ...form, description: event.target.value })}
              />
            </label>
            <div className="space-y-1.5 text-sm">
              <span className="text-gray-600">标签</span>
              <div className="flex flex-wrap gap-2">
                {form.tags.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    className="rounded-full border border-gray-200 px-2.5 py-1 text-xs text-gray-700"
                    onClick={() => setForm({ ...form, tags: form.tags.filter((item) => item !== tag) })}
                  >
                    {tag} 移除
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  value={tagInput}
                  placeholder="输入标签"
                  aria-label="新标签"
                  onChange={(event) => setTagInput(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      event.preventDefault();
                      addTag();
                    }
                  }}
                />
                <Button type="button" variant="outline" onClick={addTag}>
                  添加
                </Button>
              </div>
            </div>
            <label className="block space-y-1.5 text-sm">
              <span className="text-gray-600">排序</span>
              <Input
                type="number"
                step={1}
                value={Number.isInteger(form.sort) ? form.sort : ''}
                onChange={(event) => {
                  const value = event.target.value;
                  setForm({ ...form, sort: value === '' ? Number.NaN : Number(value) });
                }}
              />
            </label>
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={!form.hidden}
                onChange={(event) => setForm({ ...form, hidden: !event.target.checked })}
              />
              在首页显示
            </label>
            <div className="space-y-1.5 text-sm">
              <span className="text-gray-600">缩略图</span>
              <div className="aspect-video w-full max-w-sm overflow-hidden rounded-md bg-gray-100">
                {shownThumb ? (
                  // Local preview may be a blob URL, which next/image does not accept.
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={shownThumb} alt="" className="h-full w-full object-cover object-top" />
                ) : (
                  <div className="flex h-full items-center justify-center text-xs text-gray-400">暂无缩略图</div>
                )}
              </div>
              <Input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                aria-label="替换缩略图"
                onChange={(event) => void onPickFile(event.target.files?.[0])}
              />
              <p className="text-xs text-gray-500">选择图片后，点击保存才会替换。支持 JPG、PNG、WebP。</p>
            </div>
            {message && <p className="text-sm text-red-600">{message}</p>}
          </div>
        )}
        <DialogFooter className="shrink-0 border-t px-6 py-4 sm:space-x-0">
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" disabled={saving} onClick={() => onOpenChange(false)}>
              取消
            </Button>
            <Button
              type="button"
              className="bg-[#00706a] text-white hover:bg-[#00706a]/90"
              disabled={saving || !form}
              onClick={() => {
                if (!form) return;
                if (!form.title.trim()) {
                  setLocalError('名称不能为空');
                  return;
                }
                if (!Number.isInteger(form.sort)) {
                  setLocalError('排序必须是整数');
                  return;
                }
                setLocalError('');
                onSave(
                  { ...form, title: form.title.trim(), description: form.description.trim() },
                  file
                );
              }}
            >
              {saving ? '保存中' : '保存'}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
