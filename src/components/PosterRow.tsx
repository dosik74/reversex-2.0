import { ReactNode, useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';

interface PosterRowProps<T> {
  title: string;
  items: T[];
  render: (item: T) => ReactNode;
  /** key extractor */
  getKey: (item: T) => string | number;
  /** optional accessors for search/sort inside the collection view (fall back to item fields) */
  getTitle?: (item: T) => string;
  getRating?: (item: T) => number;
  getYear?: (item: T) => string | number;
  getPoster?: (item: T) => string;
}

type CollectionSort = 'default' | 'rating' | 'year' | 'title';

const SORTS: { id: CollectionSort; label: string }[] = [
  { id: 'default', label: 'Как в подборке' },
  { id: 'rating', label: 'По рейтингу' },
  { id: 'year', label: 'По году' },
  { id: 'title', label: 'По названию' },
];

/**
 * Kinopoisk-style horizontal poster row with a "Посмотреть все" card
 * at the end that opens a fullscreen collection view (rendered via
 * portal so it truly covers the viewport).
 */
export default function PosterRow<T>({ title, items, render, getKey, getTitle, getRating, getYear, getPoster }: PosterRowProps<T>) {
  const [expanded, setExpanded] = useState(false);
  const [sort, setSort] = useState<CollectionSort>('default');
  const [query, setQuery] = useState('');

  const titleOf = (it: T): string => getTitle?.(it) ?? (it as any)?.title ?? '';
  const ratingOf = (it: T): number => Number(getRating?.(it) ?? (it as any)?.rating ?? 0) || 0;
  const yearOf = (it: T): string => String(getYear?.(it) ?? (it as any)?.year ?? '');
  const posterOf = (it: T): string => getPoster?.(it) ?? (it as any)?.poster ?? '';

  // Reset collection view state on open
  useEffect(() => {
    if (expanded) {
      setSort('default');
      setQuery('');
    }
  }, [expanded]);

  // Lock body scroll + Esc to close
  useEffect(() => {
    if (!expanded) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setExpanded(false); };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [expanded]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = q ? items.filter((it) => titleOf(it).toLowerCase().includes(q)) : [...items];
    switch (sort) {
      case 'rating':
        list = [...list].sort((a, b) => ratingOf(b) - ratingOf(a));
        break;
      case 'year':
        list = [...list].sort((a, b) => parseInt(yearOf(b)) - parseInt(yearOf(a)) || 0);
        break;
      case 'title':
        list = [...list].sort((a, b) => titleOf(a).localeCompare(titleOf(b)));
        break;
      default:
        break;
    }
    return list;
  }, [items, query, sort]);

  const avgRating = useMemo(() => {
    const rated = items.map(ratingOf).filter((r) => r > 0);
    if (!rated.length) return 0;
    return rated.reduce((s, r) => s + r, 0) / rated.length;
  }, [items]);

  const heroPosters = useMemo(() => items.map(posterOf).filter(Boolean).slice(0, 12), [items]);

  return (
    <section className="pr-section mb-10">
      <style>{`
        .pr-in { animation: pr-fade .4s ease both; }
        .pr-section { content-visibility: auto; contain-intrinsic-size: auto 500px; }
        .pr-overlay { animation: pr-fade .25s ease both; }
        .pr-card { animation: pr-rise .5s cubic-bezier(.16,1,.3,1) both; }
        @keyframes pr-fade { from { opacity: 0; } to { opacity: 1; } }
        @keyframes pr-rise { from { opacity: 0; transform: translateY(24px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>

      <div className="flex items-end justify-between gap-4 mb-4">
        <h2 className="font-grotesk text-xl sm:text-2xl font-bold tracking-tight text-foreground dark:text-white flex items-center gap-3 min-w-0">
          <span className="truncate">{title}</span>
          <span className="flex-shrink-0 text-[11px] font-semibold text-muted-foreground bg-muted border border-border rounded-full px-2.5 py-1 dark:text-zinc-400 dark:bg-white/[0.05] dark:border-white/[0.08]">
            {items.length}
          </span>
        </h2>
        <button
          onClick={() => setExpanded(true)}
          className="flex-shrink-0 text-[13px] font-semibold text-muted-foreground hover:text-amber-700 dark:text-zinc-400 dark:hover:text-amber-200 transition-colors"
        >
          Все
        </button>
      </div>

      <div className="flex gap-3 overflow-x-auto kp-scroll pb-2 -mx-1 px-1">
        {items.map((item) => (
          <div key={getKey(item)} className="shrink-0 w-[150px] sm:w-[170px] lg:w-[185px] pr-in">
            {render(item)}
          </div>
        ))}
        {/* Посмотреть все */}
        <button
          onClick={() => setExpanded(true)}
          className="shrink-0 w-[150px] sm:w-[170px] lg:w-[185px] aspect-[2/3] rounded-2xl bg-gradient-to-br from-muted to-muted/40 border border-border border-dashed hover:border-amber-500/50 hover:from-amber-500/[0.08] flex flex-col items-center justify-center gap-2 text-muted-foreground hover:text-amber-800 transition-all group dark:from-white/[0.06] dark:to-white/[0.02] dark:border-white/[0.08] dark:text-zinc-500 dark:hover:text-amber-100 dark:hover:border-amber-200/50 dark:hover:from-amber-200/[0.08]"
        >
          <span className="text-sm font-semibold px-3 text-center leading-tight">Посмотреть все</span>
          <span className="text-[11px] text-muted-foreground group-hover:text-amber-700/70 transition-colors dark:text-zinc-600 dark:group-hover:text-amber-200/70">{items.length} шт.</span>
        </button>
      </div>

      {/* ── Fullscreen collection view (portal → всегда поверх всего) ── */}
      {expanded && createPortal(
        <div className="pr-overlay fixed inset-0 z-[200] bg-zinc-950 text-white overflow-y-auto">
          {/* Hero: коллаж постеров + инфо */}
          <div className="relative overflow-hidden">
            {heroPosters.length > 0 && (
              <>
                <div className="absolute inset-0 flex">
                  {heroPosters.map((p, i) => (
                    <div key={i} className="h-full flex-1 min-w-0 first:pl-0">
                      <img src={p} alt="" aria-hidden className="w-full h-full object-cover object-top opacity-50" loading="lazy" />
                    </div>
                  ))}
                </div>
                <div className="absolute inset-0 backdrop-blur-[2px] bg-zinc-950/60 pointer-events-none" />
              </>
            )}
            <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[50rem] h-[30rem] rounded-full blur-[140px] opacity-20 bg-gradient-to-br from-amber-400 to-orange-600 pointer-events-none" />
            <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/40 to-transparent pointer-events-none" />

            <div className="relative max-w-[1600px] mx-auto px-4 sm:px-8 pt-6 pb-8">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-amber-300">
                    Коллекция
                  </p>
                  <h1 className="font-grotesk font-black tracking-tight leading-none text-4xl sm:text-5xl lg:text-6xl mt-3">
                    {title}
                  </h1>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-2 mt-4 text-sm">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 border border-white/15 px-3 py-1 text-[13px] font-bold">
                      {items.length} позиций
                    </span>
                    {avgRating > 0 && (
                      <span className="inline-flex items-center rounded-full bg-amber-400 text-black px-3 py-1 text-[13px] font-black">
                        {avgRating.toFixed(1)}
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => setExpanded(false)}
                  className="flex-shrink-0 h-11 px-5 rounded-full bg-white/10 border border-white/15 hover:bg-white/20 text-sm font-bold transition-all active:scale-95"
                >
                  Закрыть
                </button>
              </div>
            </div>
          </div>

          {/* Липкая панель: поиск + сортировка (сплошной фон!) */}
          <div className="sticky top-0 z-10 bg-zinc-950 border-y border-white/10">
            <div className="max-w-[1600px] mx-auto px-4 sm:px-8 py-3 flex flex-col md:flex-row md:items-center gap-2.5">
              <div className="relative flex-1 min-w-[200px]">
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={`Поиск в «${title}»...`}
                  className="w-full px-5 h-10 bg-white/[0.06] border border-white/10 rounded-full text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-amber-300/50 focus:ring-4 focus:ring-amber-300/10 transition-all"
                />
              </div>
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                {SORTS.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setSort(s.id)}
                    className={`px-3.5 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all border ${
                      sort === s.id
                        ? 'bg-white text-black border-transparent'
                        : 'bg-white/[0.05] text-zinc-400 border-white/10 hover:bg-white/[0.1] hover:text-white'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Сетка */}
          <div className="max-w-[1600px] mx-auto px-4 sm:px-8 py-8">
            {visible.length > 0 ? (
              <>
                {(query.trim() || sort !== 'default') && (
                  <p className="text-xs font-semibold text-zinc-500 mb-4">
                    Показано {visible.length} из {items.length}
                  </p>
                )}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8 gap-4 sm:gap-5">
                  {visible.map((item, i) => (
                    <div key={getKey(item)} className="pr-card" style={{ animationDelay: `${Math.min(i * 25, 500)}ms` }}>
                      {render(item)}
                    </div>
                  ))}
                </div>
                <div className="mt-12 flex justify-center">
                  <button
                    onClick={() => setExpanded(false)}
                    className="px-8 py-3 rounded-full font-bold text-sm bg-white/[0.06] border border-white/10 text-zinc-200 hover:bg-white/[0.12] hover:text-white transition-all active:scale-95"
                  >
                    Закрыть коллекцию
                  </button>
                </div>
              </>
            ) : (
              <div className="text-center py-20">
                <p className="text-lg font-bold text-zinc-300">Ничего не найдено</p>
                <p className="text-sm text-zinc-500 mt-1">По запросу «{query}» в этой коллекции пусто</p>
                <button
                  onClick={() => { setQuery(''); setSort('default'); }}
                  className="mt-5 px-6 py-2.5 rounded-full text-sm font-bold bg-white text-black hover:bg-zinc-200 transition-colors"
                >
                  Показать всё
                </button>
              </div>
            )}
          </div>
        </div>,
        document.body
      )}
    </section>
  );
}
