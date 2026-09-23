import { useEffect, useState } from 'react';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { GENRES, SORTS, type GenreFilter, type SortOption } from '@/components/MovieSortFilter';
import { CONTENT_STATUS_CONFIG, type ContentStatus } from '@/types/anime';
import supabase from '@/lib/supabase';
import { cn } from '@/lib/utils';

export type StatusValue = ContentStatus | 'all';

const STATUS_ORDER: StatusValue[] = ['all', 'watched', 'watching', 'planned', 'postponed', 'dropped'];

interface CatalogFilterBarProps {
  // ── Статус («Закладки») ──
  showStatus?: boolean;
  statusValue?: StatusValue;
  onStatusChange?: (v: StatusValue) => void;
  /** откуда грузить счётчики (content_bookmarks.content_type) */
  contentType?: 'movie' | 'series';
  // ── Сортировка ──
  sortBy: SortOption;
  onSortChange: (s: SortOption) => void;
  // ── Жанры: одиночный режим (фильмы/сериалы) ──
  genre?: GenreFilter;
  onGenreChange?: (g: GenreFilter) => void;
  showGenres?: boolean;
  // ── Жанры: мульти-режим (игры) ──
  genreMode?: 'single' | 'multi';
  multiOptions?: { id: string; label: string }[];
  multiSelected?: string[];
  onToggleMultiGenre?: (id: string) => void;
  // ── Сброс ──
  onReset?: () => void;
}

export default function CatalogFilterBar({
  showStatus = true,
  statusValue = 'all',
  onStatusChange,
  contentType = 'series',
  sortBy,
  onSortChange,
  genre = 'all',
  onGenreChange,
  showGenres = true,
  genreMode = 'single',
  multiOptions = [],
  multiSelected = [],
  onToggleMultiGenre,
  onReset,
}: CatalogFilterBarProps) {
  const [statusOpen, setStatusOpen] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [counts, setCounts] = useState<Record<string, number>>({});

  // Счётчики статусов — как в старых CategoryFilter
  useEffect(() => {
    if (!showStatus) return;
    (async () => {
      try {
        const { data: user } = await supabase.auth.getUser();
        if (!user.user?.id) return;
        const { data } = await supabase
          .from('content_bookmarks')
          .select('status')
          .eq('user_id', user.user.id)
          .eq('content_type', contentType);
        const next: Record<string, number> = {};
        (data || []).forEach((item: any) => {
          next[item.status] = (next[item.status] || 0) + 1;
        });
        setCounts(next);
      } catch (e) {
        console.error('Error loading status counts:', e);
      }
    })();
  }, [showStatus, contentType]);

  const statusActive = showStatus && statusValue !== 'all';
  const statusLabel =
    statusValue === 'all' ? 'Закладки' : CONTENT_STATUS_CONFIG[statusValue as ContentStatus]?.label || 'Закладки';

  const activeFilterCount =
    (sortBy !== 'popularity' ? 1 : 0) +
    (genreMode === 'single' && showGenres && genre !== 'all' ? 1 : 0) +
    (genreMode === 'multi' ? multiSelected.length : 0);

  const hasActive = statusActive || activeFilterCount > 0;

  const sortLabel = SORTS.find((s) => s.id === sortBy)?.label || 'Сортировка';

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* ── Кнопка 1: Закладки / статус ── */}
      {showStatus && (
        <Popover open={statusOpen} onOpenChange={setStatusOpen}>
          <PopoverTrigger asChild>
            <button
              className={cn(
                'inline-flex items-center gap-2 h-10 px-4 rounded-full border text-sm font-semibold transition-all',
                statusActive
                  ? 'bg-foreground text-background border-transparent dark:bg-white dark:text-black'
                  : 'bg-muted/60 text-muted-foreground border-border hover:bg-muted hover:text-foreground dark:bg-white/[0.05] dark:border-white/[0.08] dark:hover:bg-white/[0.1] dark:hover:text-white',
              )}
            >
              {statusLabel}
              {statusActive && counts[statusValue] > 0 && (
                <span className="text-[11px] font-bold opacity-70">({counts[statusValue]})</span>
              )}
              {statusActive && <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />}
            </button>
          </PopoverTrigger>
          <PopoverContent align="start" className="w-64 p-2">
            <p className="px-2.5 pt-1.5 pb-2 text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
              Мои списки
            </p>
            <div className="space-y-0.5">
              {STATUS_ORDER.map((s) => {
                const active = statusValue === s;
                const label = s === 'all' ? 'Все' : CONTENT_STATUS_CONFIG[s as ContentStatus]?.label;
                const count = s === 'all' ? 0 : counts[s] || 0;
                return (
                  <button
                    key={s}
                    onClick={() => {
                      onStatusChange?.(s);
                      setStatusOpen(false);
                    }}
                    className={cn(
                      'w-full flex items-center justify-between gap-2 px-2.5 py-2 rounded-lg text-sm font-medium transition-colors',
                      active ? 'bg-muted text-foreground' : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground',
                    )}
                  >
                    <span className="inline-flex items-center gap-2">
                      {active ? <span className="w-2 h-2 rounded-full bg-amber-500" /> : <span className="w-2" />}
                      {label}
                      {count > 0 && <span className="text-xs opacity-60">({count})</span>}
                    </span>
                  </button>
                );
              })}
            </div>
          </PopoverContent>
        </Popover>
      )}

      {/* ── Кнопка 2: Фильтры (сортировка + жанры) ── */}
      <Popover open={filtersOpen} onOpenChange={setFiltersOpen}>
        <PopoverTrigger asChild>
          <button
            className={cn(
              'inline-flex items-center gap-2 h-10 px-4 rounded-full border text-sm font-semibold transition-all',
              activeFilterCount > 0
                ? 'bg-foreground text-background border-transparent dark:bg-white dark:text-black'
                : 'bg-muted/60 text-muted-foreground border-border hover:bg-muted hover:text-foreground dark:bg-white/[0.05] dark:border-white/[0.08] dark:hover:bg-white/[0.1] dark:hover:text-white',
            )}
          >
            Фильтры
            {activeFilterCount > 0 && (
              <span className="min-w-5 h-5 px-1 rounded-full bg-amber-500 text-black text-[11px] font-bold inline-flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-80 max-w-[calc(100vw-2rem)] p-0 overflow-hidden">
          <div className="p-3 space-y-4 max-h-[70vh] overflow-y-auto">
            {/* Сортировка */}
            <div>
              <p className="px-1 pb-2 text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
                Сортировка · <span className="normal-case font-semibold">{sortLabel}</span>
              </p>
              <div className="space-y-0.5">
                {SORTS.map((s) => {
                  const active = sortBy === s.id;
                  return (
                    <button
                      key={s.id}
                      onClick={() => onSortChange(s.id)}
                      className={cn(
                        'w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-sm font-medium transition-colors',
                        active ? 'bg-muted text-foreground' : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground',
                      )}
                    >
                      {active ? <span className="w-2 h-2 rounded-full bg-amber-500" /> : <span className="w-2" />}
                      {s.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Жанры: одиночный */}
            {genreMode === 'single' && showGenres && (
              <div>
                <p className="px-1 pb-2 text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground">Жанр</p>
                <div className="flex flex-wrap gap-1.5">
                  {GENRES.map((g) => {
                    const active = genre === g.id;
                    return (
                      <button
                        key={g.id}
                        onClick={() => onGenreChange?.(g.id)}
                        className={cn(
                          'px-3 py-1.5 rounded-full text-xs font-semibold border transition-all',
                          active
                            ? 'bg-gradient-to-r from-amber-400 to-orange-500 text-black/90 border-transparent shadow-md shadow-orange-500/25'
                            : 'bg-muted/60 text-muted-foreground border-border hover:bg-muted hover:text-foreground',
                        )}
                      >
                        {g.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Жанры: мульти (игры) */}
            {genreMode === 'multi' && (
              <div>
                <p className="px-1 pb-2 text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
                  Жанры{multiSelected.length > 0 && ` · ${multiSelected.length}`}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {multiOptions.map((g) => {
                    const active = multiSelected.includes(g.id);
                    return (
                      <button
                        key={g.id}
                        onClick={() => onToggleMultiGenre?.(g.id)}
                        className={cn(
                          'inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold border transition-all',
                          active
                            ? 'bg-foreground text-background border-transparent dark:bg-white dark:text-black'
                            : 'bg-muted/60 text-muted-foreground border-border hover:bg-muted hover:text-foreground',
                        )}
                      >
                        {g.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Сброс */}
            {onReset && (
              <button
                onClick={() => {
                  onReset();
                  setFiltersOpen(false);
                }}
                disabled={!hasActive}
                className="w-full inline-flex items-center justify-center px-3 py-2 rounded-lg text-sm font-semibold text-muted-foreground hover:bg-muted hover:text-foreground transition-colors disabled:opacity-40"
              >
                Сбросить всё
              </button>
            )}
          </div>
        </PopoverContent>
      </Popover>

      {/* Текстовый сброс — только когда есть активные */}
      {hasActive && onReset && (
        <button
          onClick={onReset}
          className="inline-flex items-center h-10 px-3 rounded-full text-[13px] font-semibold text-muted-foreground hover:text-red-600 dark:hover:text-red-300 transition-colors"
        >
          Сбросить
        </button>
      )}
    </div>
  );
}
