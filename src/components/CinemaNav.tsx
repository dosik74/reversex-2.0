import { Link } from 'react-router-dom';
import { Film, Tv, Gamepad2, Clapperboard } from 'lucide-react';

type CinemaSection = 'movies' | 'series' | 'games';

const TABS: { key: CinemaSection; label: string; path: string; icon: typeof Film }[] = [
  { key: 'movies', label: 'Фильмы', path: '/movies', icon: Film },
  { key: 'series', label: 'Сериалы', path: '/series', icon: Tv },
  { key: 'games', label: 'Игры', path: '/games', icon: Gamepad2 },
];

/**
 * Общая навигация «Кинотеатр»: сегмент-контроль в стеклянной пилюле.
 * Один тёплый акцент на активном табе, остальное — тихо.
 */
export default function CinemaNav({ active }: { active: CinemaSection }) {
  return (
    <div className="flex items-center justify-between gap-3 mb-6">
      <p className="hidden sm:inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-zinc-500">
        <Clapperboard className="w-4 h-4 text-amber-200/80" />
        Кинотеатр
      </p>

      <nav
        aria-label="Разделы кинотеатра"
        className="inline-flex items-center gap-1 p-1 rounded-full bg-white/[0.04] border border-white/[0.08] backdrop-blur-md shadow-[0_8px_30px_-12px_rgba(0,0,0,0.8)]"
      >
        {TABS.map(({ key, label, path, icon: Icon }) => {
          const isActive = key === active;
          return (
            <Link
              key={key}
              to={path}
              aria-current={isActive ? 'page' : undefined}
              className={`inline-flex items-center gap-2 px-4 sm:px-5 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-all duration-200 ${
                isActive
                  ? 'bg-gradient-to-b from-amber-200 to-amber-400 text-black shadow-[0_4px_20px_-4px_rgba(251,191,36,0.5)]'
                  : 'text-zinc-400 hover:text-white hover:bg-white/[0.07]'
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" strokeWidth={isActive ? 2.4 : 2} />
              {label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
