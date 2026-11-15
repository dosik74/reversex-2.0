import { useState, useMemo, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Search, X, Star, Trash2, Bookmark as BookmarkIcon,
  Film, Tv, Gamepad2, Clapperboard,
  MoreVertical, ExternalLink, Check, ChevronDown, Play, CalendarClock,
  CheckCheck, Pause, ArrowRight, Plus, type LucideIcon
} from 'lucide-react';
import { useBookmarks } from '@/context/BookmarkContext';
import { getUserBookmarks } from '@/services/bookmarkService';
import PosterImage from '@/components/PosterImage';
import { ContentBookmark, ContentStatus, ContentType, CONTENT_STATUS_CONFIG } from '@/types/anime';
import { toast } from 'sonner';

const STATUS_ORDER: ContentStatus[] = [
  'watching',
  'planned',
  'watched',
  'postponed',
  'dropped',
  'favorite',
];

const STATUS_THEME: Record<
  ContentStatus,
  {
    name: string;
    hex: string;
    text: string;
    bgSoft: string;
    border: string;
    activeTab: string;
    idleTab: string;
    badge: string;
    dot: string;
    icon: LucideIcon;
  }
> = {
  watching: {
    name: 'Смотрю',
    hex: '#10b981',
    text: 'text-emerald-400',
    bgSoft: 'bg-emerald-500/10',
    border: 'border-emerald-500/30',
    activeTab: 'bg-emerald-500 text-black shadow-[0_0_20px_rgba(16,185,129,0.5)] border-emerald-400 font-bold',
    idleTab: 'bg-zinc-900/70 border-white/10 text-zinc-300 hover:border-emerald-500/40 hover:text-emerald-300 hover:bg-emerald-500/5',
    badge: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
    dot: 'bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.9)]',
    icon: Play,
  },
  planned: {
    name: 'В планах',
    hex: '#0ea5e9',
    text: 'text-sky-400',
    bgSoft: 'bg-sky-500/10',
    border: 'border-sky-500/30',
    activeTab: 'bg-sky-500 text-black shadow-[0_0_20px_rgba(14,165,233,0.5)] border-sky-400 font-bold',
    idleTab: 'bg-zinc-900/70 border-white/10 text-zinc-300 hover:border-sky-500/40 hover:text-sky-300 hover:bg-sky-500/5',
    badge: 'bg-sky-500/15 text-sky-300 border-sky-500/30',
    dot: 'bg-sky-400 shadow-[0_0_8px_rgba(14,165,233,0.9)]',
    icon: CalendarClock,
  },
  watched: {
    name: 'Просмотрено',
    hex: '#a855f7',
    text: 'text-purple-400',
    bgSoft: 'bg-purple-500/10',
    border: 'border-purple-500/30',
    activeTab: 'bg-purple-500 text-white shadow-[0_0_20px_rgba(168,85,247,0.6)] border-purple-400 font-bold',
    idleTab: 'bg-zinc-900/70 border-white/10 text-zinc-300 hover:border-purple-500/40 hover:text-purple-300 hover:bg-purple-500/5',
    badge: 'bg-purple-500/15 text-purple-300 border-purple-500/30',
    dot: 'bg-purple-400 shadow-[0_0_8px_rgba(168,85,247,0.9)]',
    icon: CheckCheck,
  },
  postponed: {
    name: 'Отложено',
    hex: '#f97316',
    text: 'text-orange-400',
    bgSoft: 'bg-orange-500/10',
    border: 'border-orange-500/30',
    activeTab: 'bg-orange-500 text-black shadow-[0_0_20px_rgba(249,115,22,0.5)] border-orange-400 font-bold',
    idleTab: 'bg-zinc-900/70 border-white/10 text-zinc-300 hover:border-orange-500/40 hover:text-orange-300 hover:bg-orange-500/5',
    badge: 'bg-orange-500/15 text-orange-300 border-orange-500/30',
    dot: 'bg-orange-400 shadow-[0_0_8px_rgba(249,115,22,0.9)]',
    icon: Pause,
  },
  dropped: {
    name: 'Брошено',
    hex: '#ef4444',
    text: 'text-rose-400',
    bgSoft: 'bg-rose-500/10',
    border: 'border-rose-500/30',
    activeTab: 'bg-rose-500 text-white shadow-[0_0_20px_rgba(239,68,68,0.6)] border-rose-400 font-bold',
    idleTab: 'bg-zinc-900/70 border-white/10 text-zinc-300 hover:border-rose-500/40 hover:text-rose-300 hover:bg-rose-500/5',
    badge: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
    dot: 'bg-rose-400 shadow-[0_0_8px_rgba(239,68,68,0.9)]',
    icon: X,
  },
  favorite: {
    name: 'Избранное',
    hex: '#f59e0b',
    text: 'text-amber-400',
    bgSoft: 'bg-amber-500/10',
    border: 'border-amber-500/30',
    activeTab: 'bg-amber-400 text-black shadow-[0_0_20px_rgba(245,158,11,0.5)] border-amber-300 font-bold',
    idleTab: 'bg-zinc-900/70 border-white/10 text-zinc-300 hover:border-amber-500/40 hover:text-amber-300 hover:bg-amber-500/5',
    badge: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
    dot: 'bg-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.9)]',
    icon: Star,
  },
};

const TYPE_FILTERS: { key: ContentType | 'all'; label: string; icon: LucideIcon }[] = [
  { key: 'all', label: 'Все', icon: Film },
  { key: 'movie', label: 'Фильмы', icon: Film },
  { key: 'series', label: 'Сериалы', icon: Tv },
  { key: 'anime', label: 'Аниме', icon: Clapperboard },
  { key: 'game', label: 'Игры', icon: Gamepad2 },
];

const TYPE_LABEL: Record<ContentType, string> = {
  movie: 'Фильм',
  series: 'Сериал',
  anime: 'Аниме',
  game: 'Игра',
};

interface ProfileBookmarksProps {
  userId: string;
  isOwnProfile: boolean;
  username?: string;
}

export default function ProfileBookmarks({ userId, isOwnProfile, username }: ProfileBookmarksProps) {
  const navigate = useNavigate();
  const contextBookmarks = useBookmarks();

  const [loading, setLoading] = useState(true);
  const [userBookmarks, setUserBookmarks] = useState<ContentBookmark[]>([]);
  const [activeTab, setActiveTab] = useState<ContentStatus>('watched');
  const [typeFilter, setTypeFilter] = useState<ContentType | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'rating' | 'year' | 'title'>('date');

  // Load bookmarks for this profile user
  useEffect(() => {
    let active = true;

    const loadData = async () => {
      // If own profile, we can read directly from context or cache
      if (isOwnProfile && contextBookmarks.bookmarks.length > 0) {
        setUserBookmarks(contextBookmarks.bookmarks);
        setLoading(false);
        return;
      }

      // Check local cache first for instant display
      try {
        const cached = localStorage.getItem(`rx_public_bookmarks_${userId}`);
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setUserBookmarks(parsed);
            setLoading(false);
          }
        }
      } catch {}

      try {
        setLoading(true);
        const data = await getUserBookmarks(userId);
        if (active) {
          setUserBookmarks(data);
          try {
            localStorage.setItem(`rx_public_bookmarks_${userId}`, JSON.stringify(data));
          } catch {}
        }
      } catch (err) {
        console.error('Error loading profile bookmarks:', err);
      } finally {
        if (active) setLoading(false);
      }
    };

    loadData();

    return () => {
      active = false;
    };
  }, [userId, isOwnProfile, contextBookmarks.bookmarks]);

  // Keep bookmarks in sync if on own profile
  const bookmarksToUse = isOwnProfile ? contextBookmarks.bookmarks : userBookmarks;

  // Calculate statistics across all statuses
  const stats = useMemo(() => {
    const s: Record<ContentStatus, number> = {
      watching: 0,
      planned: 0,
      watched: 0,
      postponed: 0,
      dropped: 0,
      favorite: 0,
    };
    bookmarksToUse.forEach((b) => {
      if (b.status in s) s[b.status]++;
    });
    return s;
  }, [bookmarksToUse]);

  const total = Object.values(stats).reduce((a, b) => a + b, 0);

  // Auto-switch to the first non-empty tab
  useEffect(() => {
    if (bookmarksToUse.length > 0 && stats[activeTab] === 0) {
      const best = STATUS_ORDER.find((s) => stats[s] > 0);
      if (best) setActiveTab(best);
    }
  }, [bookmarksToUse.length]);

  // Calculate counts by type in current tab
  const currentTabTypeCounts = useMemo(() => {
    const inTab = bookmarksToUse.filter((b) => b.status === activeTab);
    const counts: Record<string, number> = { all: inTab.length, movie: 0, series: 0, anime: 0, game: 0 };
    inTab.forEach((b) => {
      if (b.contentType in counts) counts[b.contentType]++;
    });
    return counts;
  }, [bookmarksToUse, activeTab]);

  // Filter & sort bookmarks
  const filtered = useMemo(() => {
    let list = bookmarksToUse.filter((b) => b.status === activeTab);
    if (typeFilter !== 'all') {
      list = list.filter((b) => b.contentType === typeFilter);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (b) =>
          b.title.toLowerCase().includes(q) ||
          (b.genre && b.genre.toLowerCase().includes(q))
      );
    }
    return [...list].sort((a, b) => {
      if (sortBy === 'rating') return (b.userRating || b.externalRating || 0) - (a.userRating || a.externalRating || 0);
      if (sortBy === 'title') return a.title.localeCompare(b.title);
      if (sortBy === 'year') return parseInt(b.releaseYear || '0') - parseInt(a.releaseYear || '0');
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });
  }, [bookmarksToUse, activeTab, typeFilter, searchQuery, sortBy]);

  const activeTheme = STATUS_THEME[activeTab];

  return (
    <div className="space-y-6">
      {/* ── Верхний переходник на полноэкранную страницу закладок ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-zinc-900/60 border border-white/10 backdrop-blur-md">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <BookmarkIcon className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-white leading-tight">Закладки и списки пользователя</h4>
            <p className="text-[11px] text-zinc-400">
              Всего в коллекции: <span className="font-semibold text-zinc-200 tabular-nums">{total}</span> тайтлов
            </p>
          </div>
        </div>

        <Link
          to={`/bookmarks/${username || userId}`}
          className="inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl bg-white/[0.08] hover:bg-emerald-500/20 text-xs font-bold text-zinc-200 hover:text-emerald-300 border border-white/10 hover:border-emerald-500/40 transition-all shadow-sm self-start sm:self-auto"
          title="Открыть все закладки на отдельной странице с расширенным списком"
        >
          <span>Открыть отдельной страницей</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* ── Tabs Bar (Смотрю, В планах, Просмотрено, Отложено, Брошено, Избранное) ── */}
      <div className="flex gap-2 overflow-x-auto kp-scroll pb-2 -mx-2 px-2 sm:mx-0 sm:px-0">
        {STATUS_ORDER.map((s) => {
          const t = STATUS_THEME[s];
          const active = activeTab === s;
          const Icon = t.icon;
          const count = stats[s];

          return (
            <button
              key={s}
              onClick={() => setActiveTab(s)}
              className={`group flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs sm:text-[13px] font-bold whitespace-nowrap shrink-0 transition-all duration-200 border ${
                active ? `${t.activeTab}` : `${t.idleTab}`
              }`}
            >
              <Icon
                className={`w-3.5 h-3.5 transition-transform ${
                  active ? 'scale-110 fill-current' : 'group-hover:scale-110'
                }`}
              />
              <span>{t.name}</span>
              <span
                className={`text-[11px] font-black px-2 py-0.5 rounded-full tabular-nums ${
                  active ? 'bg-black/25 text-inherit' : 'bg-white/10 text-zinc-300'
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* ── Toolbar: Content Type Filters, Search, Sort ── */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-2 rounded-2xl bg-zinc-900/60 border border-white/[0.08]">
        {/* Content Type Filter */}
        <div className="flex items-center gap-1 overflow-x-auto kp-scroll p-0.5">
          {TYPE_FILTERS.map((f) => {
            const count = currentTabTypeCounts[f.key] || 0;
            const active = typeFilter === f.key;

            return (
              <button
                key={f.key}
                onClick={() => setTypeFilter(f.key)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  active
                    ? 'bg-white text-black font-bold shadow-sm'
                    : 'text-zinc-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <span>{f.label}</span>
                <span
                  className={`text-[10px] tabular-nums font-bold px-1.5 py-0.2 rounded-full ${
                    active ? 'bg-black/20 text-black' : 'bg-white/10 text-zinc-400'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search & Sort */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1 sm:w-56">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Поиск по названию..."
              className="w-full pl-8 pr-7 py-1.5 bg-black/40 border border-white/10 rounded-xl text-xs sm:text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-white/30"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="h-8 px-2.5 rounded-xl bg-black/40 border border-white/10 text-xs text-zinc-300 font-semibold focus:outline-none cursor-pointer"
          >
            <option value="date" className="bg-zinc-900 text-white">По дате</option>
            <option value="rating" className="bg-zinc-900 text-white">По оценке</option>
            <option value="year" className="bg-zinc-900 text-white">По году</option>
            <option value="title" className="bg-zinc-900 text-white">По названию</option>
          </select>
        </div>
      </div>

      {/* ── Content List (Kinopoisk / Anixart Numbered Rows) ── */}
      {loading ? (
        <div className="flex flex-col gap-2.5">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-24 sm:h-28 rounded-2xl bg-zinc-900/40 border border-white/5 animate-pulse"
            />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 px-4 text-center rounded-3xl border border-dashed border-white/10 bg-zinc-900/20">
          <div
            className={`w-14 h-14 rounded-2xl mb-3 flex items-center justify-center border ${activeTheme.border} ${activeTheme.bgSoft}`}
          >
            {(() => {
              const Icon = activeTheme.icon;
              return <Icon className={`w-7 h-7 ${activeTheme.text}`} />;
            })()}
          </div>

          <h3 className="text-base sm:text-lg font-bold text-white mb-1">
            В списке «{activeTheme.name}» пока пусто
          </h3>
          <p className="text-xs text-zinc-400 max-w-sm mb-4">
            {isOwnProfile
              ? 'Добавляйте фильмы и сериалы в этот список кликом на закладку в каталоге.'
              : 'Пользователь ещё не добавил тайтлы в эту категорию.'}
          </p>

          {total > 0 && stats[activeTab] === 0 && (
            (() => {
              const populated = STATUS_ORDER.find((s) => stats[s] > 0);
              if (!populated) return null;
              const pt = STATUS_THEME[populated];
              return (
                <button
                  onClick={() => setActiveTab(populated)}
                  className={`px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-1.5 ${pt.activeTab}`}
                >
                  <span>Открыть «{pt.name}» ({stats[populated]})</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              );
            })()
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-2.5">
          {filtered.map((bookmark, index) => {
            const extRating = bookmark.externalRating ? Number(bookmark.externalRating) : 0;
            const ratingBadgeClass =
              extRating >= 7.0
                ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                : extRating >= 5.5
                ? 'bg-zinc-800 text-zinc-300 border-zinc-700'
                : 'bg-rose-500/15 text-rose-400 border-rose-500/30';

            const route =
              bookmark.contentType === 'movie'
                ? 'movie'
                : bookmark.contentType === 'series'
                ? 'series'
                : bookmark.contentType === 'game'
                ? 'game'
                : null;
            const detailUrl = route ? `/${route}/${bookmark.contentId}` : '#';

            return (
              <div
                key={bookmark.id}
                onClick={() => route && navigate(detailUrl)}
                className="group relative flex items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-2xl bg-zinc-900/40 hover:bg-zinc-900/90 border border-white/[0.06] hover:border-white/15 transition-all duration-200 cursor-pointer"
              >
                {/* 1. Позиция (как в Кинопоиске: 1, 2, 3...) */}
                <span className="w-5 sm:w-7 text-center text-xs sm:text-sm font-bold text-zinc-500 tabular-nums shrink-0 select-none group-hover:text-zinc-300">
                  {index + 1}
                </span>

                {/* 2. Постер */}
                <div className="relative w-14 sm:w-16 md:w-20 aspect-[2/3] shrink-0 rounded-xl overflow-hidden bg-zinc-800 shadow-md border border-white/5">
                  <PosterImage
                    src={bookmark.posterUrl}
                    alt={bookmark.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>

                {/* 3. Описание */}
                <div className="flex-1 min-w-0 pr-2">
                  <div className="flex flex-wrap items-baseline gap-2">
                    <h4 className="text-sm sm:text-base md:text-lg font-bold text-white group-hover:text-primary transition-colors line-clamp-1 leading-snug">
                      {bookmark.title}
                    </h4>
                    {bookmark.releaseYear && (
                      <span className="text-xs sm:text-sm text-zinc-400 font-medium tabular-nums shrink-0">
                        {bookmark.releaseYear}
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mt-1 text-xs text-zinc-400">
                    <span className="px-1.5 py-0.5 rounded bg-white/5 text-[11px] font-semibold text-zinc-300">
                      {TYPE_LABEL[bookmark.contentType]}
                    </span>
                    {bookmark.genre && (
                      <span className="truncate max-w-[220px] sm:max-w-md text-zinc-400">
                        · {bookmark.genre}
                      </span>
                    )}
                  </div>

                  <div className="mt-2 flex items-center gap-2">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${activeTheme.badge} border`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${activeTheme.dot}`} />
                      {activeTheme.name}
                    </span>
                  </div>
                </div>

                {/* 4. Рейтинги и кнопки */}
                <div
                  className="flex items-center gap-2 sm:gap-5 shrink-0"
                  onClick={(e) => e.stopPropagation()}
                >
                  {extRating > 0 && (
                    <div className="hidden sm:flex flex-col items-end">
                      <span
                        className={`text-xs sm:text-sm font-black tabular-nums px-2 py-0.5 rounded-lg border ${ratingBadgeClass}`}
                      >
                        {extRating.toFixed(1)}
                      </span>
                      <span className="text-[10px] text-zinc-500 mt-0.5 uppercase tracking-wider font-semibold">
                        TMDB
                      </span>
                    </div>
                  )}

                  {/* Оценка пользователя */}
                  {bookmark.userRating ? (
                    <div className="flex flex-col items-center">
                      <div className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-amber-400/15 border border-amber-400/30 text-amber-300 text-xs font-black tabular-nums">
                        <Star className="w-3.5 h-3.5 fill-current" />
                        <span>{Number(bookmark.userRating).toFixed(1)}</span>
                      </div>
                      <span className="text-[10px] text-zinc-500 mt-0.5 hidden sm:block">Оценка</span>
                    </div>
                  ) : null}

                  {/* Для гостей/посетителей: кнопка перехода */}
                  <Link
                    to={detailUrl}
                    className="w-9 h-9 rounded-full flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
                    title="Перейти к тайтлу"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
