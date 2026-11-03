export type CatalogItem = {
  id: string;
  href: string;
  title: string;
  description: string;
  tags: string[];
  thumbnail: string;
  sort: number;
  hidden: boolean;
  icon: string;
};

export type VisibilityFilter = 'all' | 'visible' | 'hidden';

export type CatalogFilter = {
  keyword: string;
  tags: string[];
  visibility: VisibilityFilter;
};

export const emptyCatalogFilter = (): CatalogFilter => ({
  keyword: '',
  tags: [],
  visibility: 'all',
});

const TITLE_MAX = 80;
const DESCRIPTION_MAX = 200;
const TAG_MAX = 12;
const TAGS_MAX = 8;

export function filterCatalog(
  items: CatalogItem[],
  filter: CatalogFilter,
  options: { homepage: boolean }
): CatalogItem[] {
  const keyword = filter.keyword.trim().toLowerCase();
  return items
    .filter((item) => {
      if (options.homepage && item.hidden) return false;
      if (!options.homepage && filter.visibility === 'visible' && item.hidden) return false;
      if (!options.homepage && filter.visibility === 'hidden' && !item.hidden) return false;
      if (filter.tags.length > 0 && !filter.tags.some((tag) => item.tags.includes(tag))) return false;
      if (!keyword) return true;
      const haystack = [item.title, item.description, item.href, ...item.tags].join('\n').toLowerCase();
      return haystack.includes(keyword);
    })
    .sort((a, b) => a.sort - b.sort || a.title.localeCompare(b.title, 'zh'));
}

export function collectTags(items: CatalogItem[], homepage: boolean): string[] {
  const source = homepage ? items.filter((item) => !item.hidden) : items;
  return [...new Set(source.flatMap((item) => item.tags))].sort((a, b) => a.localeCompare(b, 'zh'));
}

export function thumbnailPath(id: string): string {
  return `/catalog/thumbs/${id}.jpg`;
}

export function canonicalThumbnail(thumbnail: string, id: string): string {
  const pathOnly = thumbnail.split('?')[0]?.trim() ?? '';
  if (!pathOnly) return '';
  if (pathOnly !== thumbnailPath(id)) {
    throw new Error('缩略图路径不合法');
  }
  return pathOnly;
}

function normalizeTags(tags: unknown): string[] {
  if (!Array.isArray(tags)) throw new Error('标签格式不正确');
  const next: string[] = [];
  for (const tag of tags) {
    if (typeof tag !== 'string') throw new Error('标签格式不正确');
    const value = tag.trim();
    if (!value) continue;
    if (value.length > TAG_MAX) throw new Error('标签过长');
    if (!next.includes(value)) next.push(value);
  }
  if (next.length > TAGS_MAX) throw new Error('标签最多 8 个');
  return next;
}

export function mergeCatalog(current: CatalogItem[], incoming: unknown): CatalogItem[] {
  if (!Array.isArray(incoming) || incoming.length !== current.length) {
    throw new Error('不能新增或删除条目');
  }
  const currentById = new Map(current.map((item) => [item.id, item]));
  const seen = new Set<string>();
  const next = incoming.map((raw) => {
    if (!raw || typeof raw !== 'object') throw new Error('目录格式不正确');
    const row = raw as Record<string, unknown>;
    if (typeof row.id !== 'string' || !currentById.has(row.id) || seen.has(row.id)) {
      throw new Error('不能新增或删除条目');
    }
    seen.add(row.id);
    const prev = currentById.get(row.id)!;
    if (typeof row.title !== 'string' || !row.title.trim()) throw new Error('名称不能为空');
    const title = row.title.trim();
    if (title.length > TITLE_MAX) throw new Error('名称过长');
    if (typeof row.description !== 'string') throw new Error('说明格式不正确');
    const description = row.description.trim();
    if (description.length > DESCRIPTION_MAX) throw new Error('说明过长');
    if (typeof row.sort !== 'number' || !Number.isInteger(row.sort)) throw new Error('排序必须是整数');
    if (typeof row.hidden !== 'boolean') throw new Error('显示状态不正确');
    const thumbnail = typeof row.thumbnail === 'string' ? canonicalThumbnail(row.thumbnail, prev.id) : '';
    return {
      ...prev,
      title,
      description,
      tags: normalizeTags(row.tags),
      sort: row.sort,
      hidden: row.hidden,
      thumbnail,
    };
  });
  if (seen.size !== current.length) throw new Error('不能新增或删除条目');
  return next;
}
