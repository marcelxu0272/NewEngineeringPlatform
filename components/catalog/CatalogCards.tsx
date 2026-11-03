'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { CatalogIcon } from '@/components/catalog/icons';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { CatalogItem } from '@/lib/catalog-filter';

function Thumbnail({ item }: { item: CatalogItem }) {
  const [failed, setFailed] = useState(false);
  if (!item.thumbnail || failed) {
    return (
      <div className="flex aspect-video items-center justify-center bg-gray-100 text-gray-500">
        <CatalogIcon name={item.icon} className="h-8 w-8" />
      </div>
    );
  }
  return (
    <div className="aspect-video overflow-hidden bg-gray-100">
      {/* Public thumbnails use a cache-busting query string. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={item.thumbnail}
        alt=""
        className="h-full w-full object-cover object-top"
        onError={() => setFailed(true)}
      />
    </div>
  );
}

function CardBody({ item }: { item: CatalogItem }) {
  return (
    <>
      <Thumbnail key={item.thumbnail || item.id} item={item} />
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-3">
          <CardTitle className="text-lg">{item.title}</CardTitle>
          {item.hidden && <Badge variant="outline">已隐藏</Badge>}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-gray-500">{item.description}</p>
        <div className="flex flex-wrap gap-1.5">
          {item.tags.map((tag) => (
            <span key={tag} className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
              {tag}
            </span>
          ))}
        </div>
      </CardContent>
    </>
  );
}

export function CatalogCards({
  items,
  mode,
  onEdit,
}: {
  items: CatalogItem[];
  mode: 'home' | 'config';
  onEdit?: (item: CatalogItem) => void;
}) {
  if (items.length === 0) {
    return <p className="py-16 text-center text-sm text-gray-500">没有符合条件的功能</p>;
  }

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((item) => {
        const highlighted = item.id === 'platform';
        const cardClass = `h-full overflow-hidden transition-all hover:border-[#00706a]/30 hover:shadow-md ${
          highlighted ? 'border-[#00706a]/50 bg-[#00706a]/5' : ''
        }`;
        if (mode === 'home') {
          return (
            <Link key={item.id} href={item.href} target="_blank" rel="noopener noreferrer" className="block h-full">
              <Card className={cardClass}>
                <CardBody item={item} />
                <div className="flex justify-end px-6 pb-4 text-gray-400">
                  <ChevronRight className="h-5 w-5" />
                </div>
              </Card>
            </Link>
          );
        }
        return (
          <Card key={item.id} className={cardClass}>
            <CardBody item={item} />
            <div className="flex justify-end gap-2 px-6 pb-4">
              <Button type="button" variant="outline" size="sm" asChild>
                <Link href={item.href}>打开</Link>
              </Button>
              <Button type="button" size="sm" className="bg-[#00706a] text-white hover:bg-[#00706a]/90" onClick={() => onEdit?.(item)}>
                编辑
              </Button>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
