'use client';

import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { CatalogFilter, VisibilityFilter } from '@/lib/catalog-filter';

const VISIBILITY_OPTIONS: { value: VisibilityFilter; label: string }[] = [
  { value: 'all', label: '全部' },
  { value: 'visible', label: '首页显示' },
  { value: 'hidden', label: '已隐藏' },
];

type CatalogFiltersProps = {
  tags: string[];
  draft: CatalogFilter;
  applied: CatalogFilter;
  resultCount: number;
  pending: boolean;
  showVisibility: boolean;
  onDraftChange: (next: CatalogFilter) => void;
  onSearch: () => void;
  onReset: () => void;
  onRemoveKeyword: () => void;
  onRemoveTag: (tag: string) => void;
  onRemoveVisibility: () => void;
};

function chipClassName() {
  return 'inline-flex items-center gap-1 rounded-full border border-[#00706a]/30 bg-[#00706a]/10 px-2.5 py-1 text-xs text-[#00706a]';
}

export function CatalogFilters({
  tags,
  draft,
  applied,
  resultCount,
  pending,
  showVisibility,
  onDraftChange,
  onSearch,
  onReset,
  onRemoveKeyword,
  onRemoveTag,
  onRemoveVisibility,
}: CatalogFiltersProps) {
  const visibilityLabel = VISIBILITY_OPTIONS.find((option) => option.value === applied.visibility)?.label;

  return (
    <div className="mb-6 space-y-3">
      <form
        className="flex flex-wrap items-center gap-3"
        onSubmit={(event) => {
          event.preventDefault();
          onSearch();
        }}
      >
        <Input
          value={draft.keyword}
          onChange={(event) => onDraftChange({ ...draft, keyword: event.target.value })}
          placeholder="搜索名称、说明、标签或路径"
          aria-label="关键词"
          className="w-full sm:w-64"
        />
        <div className="flex flex-wrap gap-2">
          {tags.map((tag) => {
            const selected = draft.tags.includes(tag);
            return (
              <button
                key={tag}
                type="button"
                aria-pressed={selected}
                className={`rounded-full border px-3 py-1 text-sm ${
                  selected
                    ? 'border-[#00706a] bg-[#00706a] text-white'
                    : 'border-gray-200 bg-white text-gray-700 hover:border-[#00706a]/40'
                }`}
                onClick={() =>
                  onDraftChange({
                    ...draft,
                    tags: selected ? draft.tags.filter((item) => item !== tag) : [...draft.tags, tag],
                  })
                }
              >
                {tag}
              </button>
            );
          })}
        </div>
        {showVisibility && (
          <div className="flex flex-wrap gap-2" role="group" aria-label="显示状态">
            {VISIBILITY_OPTIONS.map((option) => {
              const selected = draft.visibility === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  aria-pressed={selected}
                  className={`rounded-md border px-3 py-1.5 text-sm ${
                    selected
                      ? 'border-[#00706a] bg-[#00706a] text-white'
                      : 'border-gray-200 bg-white text-gray-700 hover:border-[#00706a]/40'
                  }`}
                  onClick={() => onDraftChange({ ...draft, visibility: option.value })}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
        )}
        <div className="flex gap-2">
          <Button type="submit" className="bg-[#00706a] text-white hover:bg-[#00706a]/90">
            搜索
          </Button>
          <Button type="button" variant="outline" onClick={onReset}>
            重置
          </Button>
        </div>
      </form>
      <div className="flex flex-wrap items-center gap-2 text-sm text-gray-600">
        <span>{pending ? '正在加载目录' : `共 ${resultCount} 个`}</span>
        {applied.keyword.trim() && (
          <button type="button" className={chipClassName()} onClick={onRemoveKeyword}>
            关键词：{applied.keyword.trim()}
            <X className="h-3 w-3" />
            <span className="sr-only">去掉关键词条件</span>
          </button>
        )}
        {applied.tags.map((tag) => (
          <button key={tag} type="button" className={chipClassName()} onClick={() => onRemoveTag(tag)}>
            {tag}
            <X className="h-3 w-3" />
            <span className="sr-only">去掉标签 {tag}</span>
          </button>
        ))}
        {showVisibility && applied.visibility !== 'all' && (
          <button type="button" className={chipClassName()} onClick={onRemoveVisibility}>
            显示状态：{visibilityLabel}
            <X className="h-3 w-3" />
            <span className="sr-only">去掉显示状态条件</span>
          </button>
        )}
      </div>
    </div>
  );
}
