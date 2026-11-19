import {
  CalendarClock,
  CheckCheck,
  Pause,
  Play,
  Star,
  X,
  type LucideIcon,
} from "lucide-react";
import type { ContentBookmark, ContentStatus } from "@/types/anime";

interface PosterStatusTheme {
  label: string;
  Icon: LucideIcon;
  /** бейдж: фон + текст + рамка */
  badge: string;
  /** рамка постера */
  ring: string;
  /** заливка прогресс-бара */
  bar: string;
  /** лёгкое затемнение постера */
  dim: string;
}

/**
 * Единая палитра статусов для постеров в каталоге.
 * Зелёная галочка = просмотрено, синий календарь = в планах,
 * красный крестик = брошено.
 */
export const POSTER_STATUS_THEME: Record<ContentStatus, PosterStatusTheme> = {
  watching: {
    label: "Смотрю",
    Icon: Play,
    badge: "bg-cyan-500/90 text-white border-cyan-200/60",
    ring: "ring-cyan-300/80",
    bar: "bg-cyan-400",
    dim: "bg-black/10",
  },
  planned: {
    label: "В планах",
    Icon: CalendarClock,
    badge: "bg-blue-500/90 text-white border-blue-200/60",
    ring: "ring-blue-300/80",
    bar: "bg-blue-400",
    dim: "bg-black/10",
  },
  watched: {
    label: "Просмотрено",
    Icon: CheckCheck,
    badge: "bg-emerald-500/90 text-white border-emerald-200/60",
    ring: "ring-emerald-300/80",
    bar: "bg-emerald-400",
    dim: "bg-black/10",
  },
  postponed: {
    label: "Отложено",
    Icon: Pause,
    badge: "bg-orange-500/90 text-white border-orange-200/60",
    ring: "ring-orange-300/80",
    bar: "bg-orange-400",
    dim: "bg-black/15",
  },
  dropped: {
    label: "Брошено",
    Icon: X,
    badge: "bg-rose-600/90 text-white border-rose-200/60",
    ring: "ring-rose-300/80",
    bar: "bg-rose-400",
    dim: "bg-black/35",
  },
  favorite: {
    label: "Избранное",
    Icon: Star,
    badge: "bg-amber-400/95 text-black border-amber-100/70",
    ring: "ring-amber-300/80",
    bar: "bg-amber-300",
    dim: "bg-black/5",
  },
};

/** Классы рамки для контейнера постера (добавлять к его className). */
export function posterStatusRing(bookmark: ContentBookmark | null | undefined): string {
  if (!bookmark) return "";
  const theme = POSTER_STATUS_THEME[bookmark.status] || POSTER_STATUS_THEME.planned;
  return `ring-1 ring-inset ${theme.ring}`;
}

interface PosterStatusProps {
  bookmark: ContentBookmark | null | undefined;
  /** единица измерения прогресса: "сез." для сериалов */
  unit?: string;
  /** класс вертикального положения бейджа (если сверху уже есть другой бейдж) */
  badgeTopClass?: string;
}

/**
 * Оверлей поверх постера: статусный бейдж сверху слева + прогресс внизу.
 * Класть внутрь уже позиционированного (relative) контейнера постера,
 * рядом с <PosterImage />. Не перехватывает клики.
 */
export default function PosterStatus({ bookmark, unit = "", badgeTopClass = "top-1.5" }: PosterStatusProps) {
  if (!bookmark) return null;

  const theme = POSTER_STATUS_THEME[bookmark.status] || POSTER_STATUS_THEME.planned;
  const { Icon } = theme;
  const total = Number(bookmark.totalItems ?? 0);
  const progress = Math.min(Math.max(Number(bookmark.progress ?? 0), 0), total || 0);
  const hasProgress = total > 0;
  const percent = hasProgress ? Math.round((progress / total) * 100) : 0;

  return (
    <div className="pointer-events-none absolute inset-0 z-20">
      {/* лёгкое затемнение, чтобы статус читался сразу.
          Цветную рамку добавляет posterStatusRing() на контейнер постера. */}
      <div className={`absolute inset-0 ${theme.dim}`} />

      {/* бейдж статуса */}
      <div
        className={`absolute left-1.5 ${badgeTopClass} flex max-w-[calc(100%-0.75rem)] items-center gap-1 rounded-full border px-1.5 py-[3px] text-[10px] font-bold leading-none shadow-md backdrop-blur-md ${theme.badge}`}
      >
        <Icon className="h-3 w-3 shrink-0" strokeWidth={2.5} />
        <span className="truncate">{theme.label}</span>
      </div>

      {/* прогресс внизу постера, например 3/5 сез. */}
      {hasProgress && (
        <div className="absolute bottom-0 left-0 right-0">
          <div className="flex justify-start px-1.5 pb-1">
            <span className="rounded bg-black/75 px-1.5 py-0.5 text-[10px] font-bold tabular-nums text-white shadow">
              {progress}/{total}
              {unit ? ` ${unit}` : ""}
            </span>
          </div>
          <div className="h-1 w-full bg-black/70">
            <div className={`h-full transition-all ${theme.bar}`} style={{ width: `${percent}%` }} />
          </div>
        </div>
      )}
    </div>
  );
}
