import fs from 'node:fs';
import path from 'node:path';
import { mergeCatalog, thumbnailPath, type CatalogItem } from '@/lib/catalog-filter';

const catalogFile = path.join(process.cwd(), 'config', 'catalog.json');

function isCatalogItem(value: unknown): value is CatalogItem {
  if (!value || typeof value !== 'object') return false;
  const row = value as Record<string, unknown>;
  return (
    typeof row.id === 'string' &&
    typeof row.href === 'string' &&
    row.href.startsWith('/') &&
    typeof row.title === 'string' &&
    typeof row.description === 'string' &&
    Array.isArray(row.tags) &&
    row.tags.every((tag) => typeof tag === 'string') &&
    typeof row.thumbnail === 'string' &&
    typeof row.sort === 'number' &&
    typeof row.hidden === 'boolean' &&
    typeof row.icon === 'string'
  );
}

export function readCatalog(): CatalogItem[] {
  const raw = fs.readFileSync(catalogFile, 'utf8');
  const parsed: unknown = JSON.parse(raw);
  if (!Array.isArray(parsed) || !parsed.every(isCatalogItem)) {
    throw new Error('目录文件格式不正确');
  }
  return parsed;
}

export function writeCatalog(items: CatalogItem[]) {
  const tmp = `${catalogFile}.tmp`;
  fs.writeFileSync(tmp, `${JSON.stringify(items, null, 2)}\n`, 'utf8');
  try {
    fs.renameSync(tmp, catalogFile);
  } catch {
    fs.copyFileSync(tmp, catalogFile);
    fs.rmSync(tmp, { force: true });
  }
}

export function presentCatalog(items: CatalogItem[]): CatalogItem[] {
  return items.map((item) => {
    if (!item.thumbnail) return item;
    const file = path.join(process.cwd(), 'public', item.thumbnail.replace(/^\//, ''));
    if (!fs.existsSync(file)) return item;
    const version = Math.round(fs.statSync(file).mtimeMs);
    return { ...item, thumbnail: `${item.thumbnail}?v=${version}` };
  });
}

export function saveCatalog(incoming: unknown): CatalogItem[] {
  const next = mergeCatalog(readCatalog(), incoming);
  writeCatalog(next);
  return presentCatalog(next);
}

export function saveThumbnail(id: string, bytes: Buffer): CatalogItem[] {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id)) throw new Error('条目不存在');
  if (bytes.length < 3 || bytes[0] !== 0xff || bytes[1] !== 0xd8 || bytes[2] !== 0xff) {
    throw new Error('请上传 JPEG 图片');
  }
  const items = readCatalog();
  if (!items.some((item) => item.id === id)) throw new Error('条目不存在');
  const dir = path.join(process.cwd(), 'public', 'catalog', 'thumbs');
  fs.mkdirSync(dir, { recursive: true });
  const file = path.join(dir, `${id}.jpg`);
  const resolvedDir = `${path.resolve(dir)}${path.sep}`;
  if (!path.resolve(file).startsWith(resolvedDir)) throw new Error('缩略图路径不合法');
  fs.writeFileSync(file, bytes);
  const next = items.map((item) => (item.id === id ? { ...item, thumbnail: thumbnailPath(id) } : item));
  writeCatalog(next);
  return presentCatalog(next);
}
