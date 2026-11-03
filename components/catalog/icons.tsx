import {
  BarChart3,
  CalendarCheck,
  ClipboardList,
  Coins,
  FolderKanban,
  LayoutDashboard,
  LayoutGrid,
  Megaphone,
  Network,
  Palette,
  Smartphone,
  TrendingUp,
  UserCog,
  Users,
  Wrench,
  type LucideIcon,
} from 'lucide-react';

const ICONS: Record<string, LucideIcon> = {
  BarChart3,
  CalendarCheck,
  ClipboardList,
  Coins,
  FolderKanban,
  LayoutDashboard,
  LayoutGrid,
  Megaphone,
  Network,
  Palette,
  Smartphone,
  TrendingUp,
  UserCog,
  Users,
  Wrench,
};

export function CatalogIcon({ name, className }: { name: string; className?: string }) {
  const Icon = ICONS[name] ?? LayoutDashboard;
  return <Icon className={className} />;
}
