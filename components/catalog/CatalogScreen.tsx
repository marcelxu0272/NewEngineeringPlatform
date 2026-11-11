'use client';

import { useEffect, useState } from 'react';
import { CatalogCards } from '@/components/catalog/CatalogCards';
import { CatalogFilters } from '@/components/catalog/CatalogFilters';
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

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-200 bg-white">
        <div className="container mx-auto flex items-center justify-between gap-4 px-4 py-4">
          <div>
            <h1 className="text-2xl font-semibold text-gray-800">{homepage ? '工程平台' : '目录配置'}</h1>
            <p className="mt-1 text-sm text-gray-500">搜索或按标签查找功能模块</p>
          </div>
        </div>
      </header>
      <main className="container mx-auto px-4 py-8">
        <CatalogFilters
          tags={tags}
          draft={draft}
          applied={applied}
          resultCount={results.length}
          pending={loading}
          showVisibility={false}
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
        {!loading && !error && <CatalogCards items={results} mode="home" />}
      </main>
    </div>
  );
}
