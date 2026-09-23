import { ReactNode } from 'react';
import { Search, X } from 'lucide-react';

interface CatalogHeaderProps {
  scriptLabel: string;
  title: string;
  subtitle?: string;
  searchPlaceholder?: string;
  searchValue?: string;
  onSearchChange?: (v: string) => void;
  /** tailwind gradient classes for the glow blob, e.g. "from-amber-200 to-orange-500" */
  glow?: string;
  accent?: string;
  children?: ReactNode;
}

export default function CatalogHeader({
  scriptLabel,
  title,
  subtitle,
  searchPlaceholder = 'Поиск...',
  searchValue,
  onSearchChange,
  glow = 'from-amber-200 to-orange-500',
  accent = 'text-amber-700 dark:text-amber-200/90',
  children,
}: CatalogHeaderProps) {
  return (
    <header className="relative overflow-hidden mb-10 rounded-3xl border border-border/70 bg-card/70 dark:border-white/[0.07] dark:bg-white/[0.015]">
      <style>{`
        .cat-in { animation: cat-fade .55s cubic-bezier(.16,1,.3,1) both; }
        @keyframes cat-fade { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
        .spot-beam { background: linear-gradient(to bottom, rgba(252,211,77,0.14), rgba(252,211,77,0.03) 55%, transparent 80%); clip-path: polygon(38% 0, 62% 0, 100% 100%, 0% 100%); }
      `}</style>

      {/* Зал: тёплый спотлайт сверху + мягкое свечение */}
      <div className="spot-beam absolute inset-x-0 top-0 h-72 pointer-events-none" />
      <div className={`absolute -top-48 left-1/2 -translate-x-1/2 w-[42rem] h-[42rem] rounded-full blur-[140px] opacity-[0.16] bg-gradient-to-br ${glow} pointer-events-none`} />
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber-100/40 to-transparent pointer-events-none" />

      <div className="relative px-5 sm:px-8 pt-9 pb-7">
        <p className={`flex items-center gap-3 text-[11px] font-bold uppercase tracking-[0.28em] ${accent} cat-in`}>
          <span className="h-px w-7 bg-current opacity-60" />
          {scriptLabel}
        </p>
        <h1
          className="font-grotesk font-bold tracking-tight leading-[0.95] mt-3 mb-3 text-5xl sm:text-6xl bg-gradient-to-b from-foreground via-foreground to-muted-foreground bg-clip-text text-transparent cat-in"
          style={{ animationDelay: '70ms' }}
        >
          {title}
        </h1>
        {subtitle && (
          <p className="cat-in" style={{ animationDelay: '130ms' }}>
            <span className="inline-flex items-center gap-2 text-[13px] text-muted-foreground bg-muted/60 border border-border rounded-full pl-2.5 pr-3.5 py-1.5 dark:text-zinc-400 dark:bg-white/[0.04] dark:border-white/[0.07]">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-300 opacity-60" />
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-amber-300" />
              </span>
              {subtitle}
            </span>
          </p>
        )}

        {onSearchChange !== undefined && (
          <div className="relative max-w-xl mt-6 cat-in group" style={{ animationDelay: '190ms' }}>
            <div className="absolute -inset-px rounded-full bg-gradient-to-r from-amber-200/0 via-amber-200/25 to-amber-200/0 opacity-0 group-focus-within:opacity-100 transition-opacity duration-300 pointer-events-none" />
            <div className="relative flex items-center">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-amber-600 dark:group-focus-within:text-amber-200 transition-colors" />
              <input
                type="text"
                value={searchValue}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder={searchPlaceholder}
                className="w-full pl-12 pr-12 h-12 bg-background backdrop-blur-md border border-border rounded-full text-[15px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-amber-500/50 focus:ring-4 focus:ring-amber-500/10 transition-all dark:bg-black/40 dark:text-white dark:placeholder:text-zinc-600 dark:border-white/10 dark:focus:border-amber-200/40 dark:focus:ring-amber-200/10"
              />
              {searchValue ? (
                <button
                  onClick={() => onSearchChange('')}
                  aria-label="Очистить поиск"
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-muted hover:bg-muted/80 dark:bg-white/[0.06] dark:hover:bg-white/[0.12] flex items-center justify-center transition-colors"
                >
                  <X className="w-3.5 h-3.5 text-muted-foreground dark:text-zinc-400" />
                </button>
              ) : (
                <kbd className="absolute right-5 top-1/2 -translate-y-1/2 text-[11px] font-semibold text-muted-foreground border border-border rounded-md px-1.5 py-0.5 pointer-events-none dark:text-zinc-600 dark:border-white/10">
                  /
                </kbd>
              )}
            </div>
          </div>
        )}

        {children && <div className="mt-6 cat-in" style={{ animationDelay: '240ms' }}>{children}</div>}
      </div>

      <div className="relative h-px bg-gradient-to-r from-transparent via-white/[0.08] to-transparent" />
    </header>
  );
}
