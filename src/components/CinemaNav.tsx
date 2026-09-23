import { Link } from 'react-router-dom';

type CinemaSection = 'movies' | 'series' | 'games';

const TABS: { key: CinemaSection; label: string; path: string }[] = [
  { key: 'movies', label: 'Фильмы', path: '/movies' },
  { key: 'series', label: 'Сериалы', path: '/series' },
  { key: 'games', label: 'Игры', path: '/games' },
];

/**
 * Общая навигация «Кинотеатр»: сегмент-контроль в стеклянной пилюле.
 * Один тёплый акцент на активном табе, остальное — тихо.
 */
export default function CinemaNav({ active }: { active: CinemaSection }) {
  return (
    <div className="flex items-center justify-between gap-3 mb-6">
      <p className="hidden sm:block text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
        Кинотеатр
      </p>

      <nav
        aria-label="Разделы кинотеатра"
        className="inline-flex items-center gap-1 p-1 rounded-full bg-card/80 border border-border backdrop-blur-md shadow-[0_8px_30px_-12px_rgba(0,0,0,0.25)] max-w-full overflow-x-auto no-scrollbar dark:bg-white/[0.04] dark:border-white/[0.08] dark:shadow-[0_8px_30px_-12px_rgba(0,0,0,0.8)]"
      >
        {TABS.map(({ key, label, path }) => {
          const isActive = key === active;
          return (
            <Link
              key={key}
              to={path}
              aria-current={isActive ? 'page' : undefined}
              className={`inline-flex items-center px-4 sm:px-5 py-2 rounded-full text-sm font-semibold whitespace-nowrap shrink-0 transition-all duration-200 ${
                isActive
                  ? 'bg-gradient-to-b from-amber-200 to-amber-400 text-black shadow-[0_4px_20px_-4px_rgba(251,191,36,0.5)]'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted dark:text-zinc-400 dark:hover:text-white dark:hover:bg-white/[0.07]'
              }`}
            >
              {label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
