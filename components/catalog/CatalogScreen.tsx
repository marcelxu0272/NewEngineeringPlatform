'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { CatalogCards } from '@/components/catalog/CatalogCards';
import { CatalogEditorDialog } from '@/components/catalog/CatalogEditorDialog';
import { CatalogFilters } from '@/components/catalog/CatalogFilters';
import { Button } from '@/components/ui/button';
import {
  collectTags,
  emptyCatalogFilter,
  filterCatalog,
  type CatalogFilter,
  type CatalogItem,
} from '@/lib/catalog-filter';

export function CatalogScreen({ mode }: { mode: 'home' | 'config' }) {
  const homepage = mode === 'home';
  const [items, setItems] = useState<CatalogItem[]>([]);
  const [draft, setDraft] = useState<CatalogFilter>(emptyCatalogFilter());
  const [applied, setApplied] = useState<CatalogFilter>(emptyCatalogFilter());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState<CatalogItem | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  useEffect(() => {
    let cancelled = false;
    fetch('/api/catalog')
      .then(async (response) => {
        const data = (await response.json()) as { items?: CatalogItem[]; error?: string };
        if (!response.ok) throw new Error(data.error || '目录加载失败');
        if (!cancelled) setItems(data.items ?? []);
      })
      .catch((loadError: unknown) => {
        if (!cancelled) setError(loadError instanceof Error ? loadError.message : '目录加载失败');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const results = filterCatalog(items, homepage ? { ...applied, visibility: 'all' } : applied, { homepage });
  const tags = collectTags(items, homepage);

  async function save(item: CatalogItem, file: Blob | null) {
    setSaving(true);
    setSaveError('');
    try {
      const next = items.map((current) =>
        current.id === item.id
          ? {
              ...current,
              title: item.title,
              description: item.description,
              tags: item.tags,
              sort: item.sort,
              hidden: item.hidden,
            }
          : current
      );
      const response = await fetch('/api/catalog', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: next }),
      });
      const data = (await response.json()) as { items?: CatalogItem[]; error?: string };
      if (!response.ok) throw new Error(data.error || '保存失败');
      let saved = data.items ?? [];
      setItems(saved);
      if (file) {
        const form = new FormData();
        form.set('id', item.id);
        form.set('file', file, `${item.id}.jpg`);
        const upload = await fetch('/api/catalog/thumbnail', { method: 'POST', body: form });
        const uploaded = (await upload.json()) as { items?: CatalogItem[]; error?: string };
        if (!upload.ok) throw new Error(uploaded.error || '缩略图上传失败');
        saved = uploaded.items ?? saved;
      }
      setItems(saved);
      setEditing(null);
    } catch (saveFailure: unknown) {
      setSaveError(saveFailure instanceof Error ? saveFailure.message : '保存失败');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-200 bg-white">
        <div className="container mx-auto flex items-center justify-between gap-4 px-4 py-4">
          <div>
            <h1 className="text-2xl font-semibold text-gray-800">{homepage ? '工程平台' : '目录配置'}</h1>
            <p className="mt-1 text-sm text-gray-500">
              {homepage ? '搜索或按标签查找功能模块' : '修改已有功能的名称、标签和缩略图'}
            </p>
          </div>
          {homepage ? (
            <Button variant="outline" asChild>
              <Link href="/catalog-config">目录配置</Link>
            </Button>
          ) : (
            <Button variant="outline" asChild>
              <Link href="/">返回首页</Link>
            </Button>
          )}
        </div>
      </header>
      <main className="container mx-auto px-4 py-8">
        <CatalogFilters
          tags={tags}
          draft={draft}
          applied={applied}
          resultCount={results.length}
          pending={loading}
          showVisibility={!homepage}
          onDraftChange={setDraft}
          onSearch={() =>
            setApplied({
              keyword: draft.keyword,
              tags: [...draft.tags],
              visibility: homepage ? 'all' : draft.visibility,
            })
          }
          onReset={() => {
            const empty = emptyCatalogFilter();
            setDraft(empty);
            setApplied(empty);
          }}
          onRemoveKeyword={() => {
            setApplied((current) => ({ ...current, keyword: '' }));
            setDraft((current) =>
              current.keyword.trim() === applied.keyword.trim() ? { ...current, keyword: '' } : current
            );
          }}
          onRemoveTag={(tag) => {
            setDraft((current) => ({ ...current, tags: current.tags.filter((item) => item !== tag) }));
            setApplied((current) => ({ ...current, tags: current.tags.filter((item) => item !== tag) }));
          }}
          onRemoveVisibility={() => {
            setDraft((current) => ({ ...current, visibility: 'all' }));
            setApplied((current) => ({ ...current, visibility: 'all' }));
          }}
        />
        {loading && <p className="py-16 text-center text-sm text-gray-500">正在加载目录</p>}
        {!loading && error && <p className="py-16 text-center text-sm text-red-600">{error}</p>}
        {!loading && !error && <CatalogCards items={results} mode={mode} onEdit={setEditing} />}
      </main>
      {!homepage && (
        <CatalogEditorDialog
          item={editing}
          open={editing !== null}
          saving={saving}
          error={saveError}
          onOpenChange={(open) => {
            if (!open) {
              setEditing(null);
              setSaveError('');
            }
          }}
          onSave={(item, file) => void save(item, file)}
        />
      )}
    </div>
  );
}
