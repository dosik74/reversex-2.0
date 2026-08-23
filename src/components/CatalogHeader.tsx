import { ReactNode } from 'react';
import { Search, X } from 'lucide-react';

interface CatalogHeaderProps {
  scriptLabel: string;
  title: string;
  subtitle?: string;
  searchPlaceholder?: string;
  searchValue?: string;
  onSearchChange?: (v: string) => void;
  /** tailwind gradient classes for the glow blob, e.g. "from-amber-400 to-orange-500" */
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
  glow = 'from-purple-500 to-violet-600',
  accent = 'text-purple-400',
  children,
}: CatalogHeaderProps) {
  return (
    <div className="relative overflow-hidden mb-8">
      <style>{`
        .cat-in { animation: cat-fade .5s cubic-bezier(.16,1,.3,1) both; }
        @keyframes cat-fade { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>

      {/* Glow blob */}
      <div className={`absolute -top-40 left-1/3 -translate-x-1/2 w-[34rem] h-[34rem] rounded-full blur-[130px] opacity-[0.18] bg-gradient-to-br ${glow} pointer-events-none`} />

      <div className="relative pt-8">
        <p className={`font-script text-2xl sm:text-3xl ${accent} cat-in`} style={{ animationDelay: '0ms' }}>
          {scriptLabel}
        </p>
        <h1 className="font-grotesk text-4xl sm:text-5xl font-bold text-white tracking-tight mt-1 mb-2 cat-in" style={{ animationDelay: '60ms' }}>
          {title}
        </h1>
        {subtitle && (
          <p className="text-sm text-zinc-500 mb-6 cat-in" style={{ animationDelay: '120ms' }}>{subtitle}</p>
        )}

        {onSearchChange !== undefined && (
          <div className="relative max-w-lg mb-6 cat-in" style={{ animationDelay: '180ms' }}>
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input
              type="text"
              value={searchValue}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder={searchPlaceholder}
              className="w-full pl-11 pr-10 py-3 bg-white/[0.05] border border-white/10 rounded-2xl text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-purple-500/40 focus:border-transparent transition-all"
            />
            {searchValue && (
              <button
                onClick={() => onSearchChange('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 p-0.5 rounded-md hover:bg-white/10 transition-colors"
              >
                <X className="w-4 h-4 text-zinc-500" />
              </button>
            )}
          </div>
        )}

        {children}
      </div>
    </div>
  );
}
