import { ReactNode, useState, useEffect } from 'react';
import { ChevronRight, X, Sparkles } from 'lucide-react';

interface PosterRowProps<T> {
  title: string;
  items: T[];
  render: (item: T) => ReactNode;
  /** key extractor */
  getKey: (item: T) => string | number;
}

/**
 * Kinopoisk-style horizontal poster row with a "Посмотреть все" card
 * at the end that opens a fullscreen collection view.
 */
export default function PosterRow<T>({ title, items, render, getKey }: PosterRowProps<T>) {
  const [expanded, setExpanded] = useState(false);

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

  return (
    <section className="pr-section mb-10">
      <style>{`
        .pr-in { animation: pr-fade .4s ease both; }
        .pr-section { content-visibility: auto; contain-intrinsic-size: auto 500px; }
        .pr-overlay { animation: pr-fade .25s ease both; }
        .pr-hero { animation: pr-rise .45s cubic-bezier(.16,1,.3,1) both; }
        .pr-card { animation: pr-rise .5s cubic-bezier(.16,1,.3,1) both; }
        @keyframes pr-fade { from { opacity: 0; } to { opacity: 1; } }
        @keyframes pr-rise { from { opacity: 0; transform: translateY(24px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>

      <div className="flex items-end justify-between gap-4 mb-4">
        <h2 className="font-grotesk text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-3 min-w-0">
          <span className="truncate">{title}</span>
          <span className="flex-shrink-0 text-[11px] font-semibold text-zinc-400 bg-white/[0.05] border border-white/[0.08] rounded-full px-2.5 py-1">
            {items.length}
          </span>
        </h2>
        <button
          onClick={() => setExpanded(true)}
          className="flex-shrink-0 inline-flex items-center gap-1 text-[13px] font-semibold text-zinc-400 hover:text-amber-200 transition-colors"
        >
          Все
          <ChevronRight className="w-4 h-4" />
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
          className="shrink-0 w-[150px] sm:w-[170px] lg:w-[185px] aspect-[2/3] rounded-2xl bg-gradient-to-br from-white/[0.06] to-white/[0.02] border border-white/[0.08] border-dashed hover:border-amber-200/50 hover:from-amber-200/[0.08] flex flex-col items-center justify-center gap-2 text-zinc-500 hover:text-amber-100 transition-all group"
        >
          <span className="w-12 h-12 rounded-full bg-white/[0.06] group-hover:bg-amber-300/20 flex items-center justify-center transition-colors">
            <ChevronRight className="w-6 h-6" />
          </span>
          <span className="text-sm font-semibold px-3 text-center leading-tight">Посмотреть все</span>
          <span className="text-[11px] text-zinc-600 group-hover:text-amber-200/70 transition-colors">{items.length} шт.</span>
        </button>
      </div>

      {/* ── Fullscreen collection view ── */}
      {expanded && (
        <div className="pr-overlay fixed inset-0 z-[100] bg-zinc-950 overflow-y-auto">
          {/* Ambient glow */}
          <div className="fixed -top-48 left-1/2 -translate-x-1/2 w-[60rem] h-[60rem] rounded-full blur-[160px] opacity-[0.12] bg-gradient-to-br from-amber-200 to-orange-500 pointer-events-none" />

          {/* Hero header */}
          <div className="sticky top-0 z-20 bg-zinc-950/85 backdrop-blur-xl border-b border-white/[0.06]">
            <div className="max-w-[1600px] mx-auto px-4 sm:px-8 py-5 flex items-center justify-between gap-4">
              <div className="min-w-0">
                <p className="font-pixel text-[9px] tracking-[0.3em] text-amber-200/80 uppercase mb-1.5 flex items-center gap-1.5">
                  <Sparkles className="w-3 h-3" /> Коллекция
                </p>
                <h1 className="font-grotesk text-2xl sm:text-4xl font-bold text-white tracking-tight truncate">
                  <span className="font-script text-3xl sm:text-5xl text-amber-100 mr-3">{title}</span>
                </h1>
              </div>
              <div className="flex items-center gap-4 flex-shrink-0">
                <span className="hidden sm:block text-sm text-zinc-500 font-medium">{items.length} позиций</span>
                <button
                  onClick={() => setExpanded(false)}
                  className="w-11 h-11 rounded-full bg-white/[0.06] border border-white/10 hover:bg-red-500/20 hover:border-red-500/40 flex items-center justify-center text-zinc-300 hover:text-white transition-all active:scale-90"
                  title="Закрыть (Esc)"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>

          {/* Full-width grid */}
          <div className="relative max-w-[1600px] mx-auto px-4 sm:px-8 py-8">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8 gap-4 sm:gap-5">
              {items.map((item, i) => (
                <div key={getKey(item)} className="pr-card" style={{ animationDelay: `${Math.min(i * 30, 600)}ms` }}>
                  {render(item)}
                </div>
              ))}
            </div>

            <div className="mt-12 flex justify-center">
              <button
                onClick={() => setExpanded(false)}
                className="px-8 py-3 rounded-full font-grotesk font-semibold text-sm bg-white/[0.05] border border-white/10 text-zinc-300 hover:bg-white/[0.1] hover:text-white transition-all"
              >
                Свернуть коллекцию
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
