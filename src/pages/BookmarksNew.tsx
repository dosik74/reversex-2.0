import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search, X, Star, Trash2, Trophy, Bookmark as BookmarkIcon,
  Film, Tv, Gamepad2, LayoutGrid, SlidersHorizontal, Sparkles,
} from 'lucide-react';
import { useBookmarks } from '@/context/BookmarkContext';
import { ContentBookmark, ContentStatus, ContentType, CONTENT_STATUS_CONFIG } from '@/types/anime';
import { toast } from 'sonner';

const STATUS_ORDER: ContentStatus[] = ['favorite', 'watching', 'planned', 'watched', 'postponed', 'dropped'];

const STATUS_THEME: Record<ContentStatus, { gradient: string; glow: string; text: string; soft: string }> = {
  favorite:  { gradient: 'from-amber-400 to-orange-500', glow: 'shadow-amber-500/25', text: 'text-amber-400',   soft: 'bg-amber-500/10' },
  watching:  { gradient: 'from-emerald-400 to-teal-500', glow: 'shadow-emerald-500/25', text: 'text-emerald-400', soft: 'bg-emerald-500/10' },
  planned:   { gradient: 'from-sky-400 to-indigo-500',  glow: 'shadow-sky-500/25',    text: 'text-sky-400',     soft: 'bg-sky-500/10' },
  watched:   { gradient: 'from-zinc-400 to-zinc-600',   glow: 'shadow-zinc-500/25',   text: 'text-zinc-300',    soft: 'bg-zinc-500/10' },
  postponed: { gradient: 'from-orange-400 to-pink-500', glow: 'shadow-orange-500/25', text: 'text-orange-400',  soft: 'bg-orange-500/10' },
  dropped:   { gradient: 'from-red-400 to-rose-600',    glow: 'shadow-red-500/25',    text: 'text-red-400',     soft: 'bg-red-500/10' },
};

const TYPE_FILTERS: { key: ContentType | 'all'; label: string; icon: React.ReactNode }[] = [
  { key: 'all', label: 'Все', icon: <LayoutGrid className="w-3.5 h-3.5" /> },
  { key: 'movie', label: 'Фильмы', icon: <Film className="w-3.5 h-3.5" /> },
  { key: 'series', label: 'Сериалы', icon: <Tv className="w-3.5 h-3.5" /> },
  { key: 'game', label: 'Игры', icon: <Gamepad2 className="w-3.5 h-3.5" /> },
];

const EMPTY_TEXT: Record<ContentStatus, string> = {
  favorite: 'Нет избранного',
  watching: 'Ничего не смотрите',
  planned: 'Планов пока нет',
  watched: 'Ничего не просмотрено',
  postponed: 'Нет отложенного',
  dropped: 'Ничего не брошено',
};

/* ─────────── Card ─────────── */
function BookmarkCard({ bookmark, index }: { bookmark: ContentBookmark; index: number }) {
  const navigate = useNavigate();
  const { setStatus, removeBookmark, updateRating } = useBookmarks();
  const [ratingOpen, setRatingOpen] = useState(false);
  const [ratingInput, setRatingInput] = useState(String(bookmark.userRating || ''));

  const theme = STATUS_THEME[bookmark.status];
  const cfg = CONTENT_STATUS_CONFIG[bookmark.status];

  const openDetail = () => {
    const route = bookmark.contentType === 'movie' ? 'movie'
      : bookmark.contentType === 'series' ? 'series' : bookmark.contentType === 'game' ? 'game' : null;
    if (route) navigate(`/${route}/${bookmark.contentId}`);
  };

  const handleStatus = (e: React.MouseEvent, s: ContentStatus) => {
    e.stopPropagation();
    setStatus({
      contentType: bookmark.contentType,
      contentId: bookmark.contentId,
      title: bookmark.title,
      posterUrl: bookmark.posterUrl,
      externalRating: bookmark.externalRating,
      genre: bookmark.genre,
      releaseYear: bookmark.releaseYear,
      synopsis: bookmark.synopsis,
      status: s,
    });
    toast.success(`Статус → «${CONTENT_STATUS_CONFIG[s].label}»`);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    removeBookmark(bookmark.contentType, bookmark.contentId);
    toast.success('Удалено из закладок');
  };

  const submitRating = () => {
    const r = parseFloat(ratingInput);
    if (isNaN(r) || r < 0 || r > 10) {
      toast.error('Оценка от 0 до 10');
      return;
    }
    updateRating(bookmark.id, r);
    setRatingOpen(false);
    toast.success(`Оценка ${r} сохранена`);
  };

  return (
    <>
      <div
        className="bkc group relative rounded-2xl overflow-hidden bg-zinc-900/70 border border-white/[0.06] hover:border-white/20 hover:-translate-y-1 transition-all duration-300 cursor-pointer"
        style={{ animationDelay: `${Math.min(index * 40, 400)}ms` }}
        onClick={openDetail}
      >
        {/* Poster */}
        <div className="relative aspect-[2/3] overflow-hidden bg-zinc-800">
          {bookmark.posterUrl ? (
            <img
              src={bookmark.posterUrl}
              alt={bookmark.title}
              loading="lazy"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              onError={(e) => {
                (e.target as HTMLImageElement).src =
                  'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="300" height="450"%3E%3Crect fill="%2318181b" width="300" height="450"/%3E%3C/svg%3E';
              }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <BookmarkIcon className="w-8 h-8 text-zinc-700" />
            </div>
          )}

          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/10 to-transparent" />

          {/* Type badge */}
          <span className="absolute top-2 left-2 w-7 h-7 rounded-lg bg-black/60 backdrop-blur-sm flex items-center justify-center text-sm">
            {bookmark.contentType === 'movie' ? '🎬' : bookmark.contentType === 'series' ? '📺' : '🎮'}
          </span>

          {/* External rating */}
          {!!bookmark.externalRating && (
            <span className="absolute top-2 right-2 flex items-center gap-1 bg-black/60 backdrop-blur-sm rounded-lg px-1.5 py-1">
              <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
              <span className="text-[11px] font-bold text-amber-400">{Number(bookmark.externalRating).toFixed(1)}</span>
            </span>
          )}

          {/* Hover actions */}
          <div className="absolute inset-x-2 bottom-2 flex gap-1.5 opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
            <button
              onClick={(e) => { e.stopPropagation(); setRatingOpen(true); }}
              title="Оценить"
              className="flex-1 py-2 rounded-xl bg-white/15 backdrop-blur-md hover:bg-white/25 active:scale-95 transition-all flex items-center justify-center"
            >
              <Star className="w-4 h-4 text-amber-400" />
            </button>
            <button
              onClick={handleDelete}
              title="Удалить"
              className="flex-1 py-2 rounded-xl bg-white/15 backdrop-blur-md hover:bg-red-500/50 active:scale-95 transition-all flex items-center justify-center"
            >
              <Trash2 className="w-4 h-4 text-red-300" />
            </button>
          </div>

          {/* Status pill */}
          <div className={`absolute bottom-2 inset-x-2 ${ratingOpen ? 'opacity-0' : 'opacity-100'} transition-opacity`}>
            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wide bg-gradient-to-r ${theme.gradient} text-black/90 shadow-lg`}>
              {cfg.icon} {cfg.label}
            </span>
          </div>

          {/* User rating chip */}
          {!!bookmark.userRating && (
            <div className="absolute bottom-10 right-2 flex items-center gap-1 bg-purple-600 rounded-lg px-1.5 py-0.5 shadow-lg shadow-purple-500/30">
              <Star className="w-2.5 h-2.5 fill-white text-white" />
              <span className="text-[11px] font-bold text-white">{Number(bookmark.userRating).toFixed(1)}</span>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="p-3 space-y-1">
          <h3 className="font-script text-base font-semibold text-white leading-snug line-clamp-2 group-hover:text-purple-300 transition-colors">
            {bookmark.title}
          </h3>
          <div className="flex items-center gap-1.5 text-[11px] text-zinc-500">
            {bookmark.releaseYear && <span>{bookmark.releaseYear}</span>}
            {!!bookmark.userRating && (
              <span className={`flex items-center gap-0.5 ml-auto ${theme.text}`}>
                <Star className="w-3 h-3 fill-current" />{Number(bookmark.userRating).toFixed(1)}
              </span>
            )}
          </div>

          {/* Quick status switcher */}
          <div className="pt-1.5 grid grid-cols-6 gap-1 opacity-70 group-hover:opacity-100 transition-opacity">
            {STATUS_ORDER.map((s) => (
              <button
                key={s}
                onClick={(e) => handleStatus(e, s)}
                title={CONTENT_STATUS_CONFIG[s].label}
                className={`h-6 rounded-md text-xs flex items-center justify-center transition-all active:scale-90 ${
                  bookmark.status === s ? CONTENT_STATUS_CONFIG[s].bgColor + ' ring-1 ring-white/20' : 'bg-white/[0.04] hover:bg-white/10'
                }`}
              >
                {CONTENT_STATUS_CONFIG[s].icon}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Rating modal */}
      {ratingOpen && (
        <div
          className="fixed inset-0 z-[100] bg-black/75 backdrop-blur-sm flex items-center justify-center bkc-overlay"
          onClick={() => setRatingOpen(false)}
        >
          <div className="w-80 bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-2xl bkc-modal" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between mb-4">
              <div className="min-w-0 pr-2">
                <h3 className="text-lg font-bold text-white">Ваша оценка</h3>
                <p className="text-xs text-zinc-500 truncate">{bookmark.title}</p>
              </div>
              <button onClick={() => setRatingOpen(false)} className="p-1 rounded-lg hover:bg-zinc-800 transition-colors shrink-0">
                <X className="w-4 h-4 text-zinc-400" />
              </button>
            </div>

            <input
              type="number" min="0" max="10" step="0.1"
              value={ratingInput}
              onChange={(e) => setRatingInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && submitRating()}
              placeholder="0–10"
              autoFocus
              className="w-full px-4 py-3 mb-4 bg-zinc-800 border border-zinc-700 rounded-xl text-white text-center text-3xl font-bold focus:outline-none focus:ring-2 focus:ring-purple-500/50"
            />

            <div className="flex justify-center gap-1 mb-5 flex-wrap">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                <button
                  key={n}
                  onClick={() => setRatingInput(String(n))}
                  className={`w-7 h-7 rounded-lg text-[11px] font-bold transition-all ${
                    parseFloat(ratingInput) === n ? 'bg-purple-500 text-white scale-110' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>

            <div className="flex gap-2">
              <button onClick={() => setRatingOpen(false)} className="flex-1 px-4 py-2.5 rounded-xl bg-zinc-800 text-white text-sm font-medium hover:bg-zinc-700 transition-colors">
                Отмена
              </button>
              <button onClick={submitRating} className="flex-1 px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-violet-600 text-white text-sm font-semibold shadow-lg shadow-purple-500/25 hover:from-purple-700 hover:to-violet-700 transition-all">
                Сохранить
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

/* ─────────── Page ─────────── */
export default function BookmarksNew() {
  const { userId, bookmarks, loading, isInTop50 } = useBookmarks();
  const [activeTab, setActiveTab] = useState<ContentStatus>('favorite');
  const [typeFilter, setTypeFilter] = useState<ContentType | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'rating' | 'title'>('date');

  const stats = useMemo(() => {
    const s: Record<ContentStatus, number> = { favorite: 0, watching: 0, planned: 0, watched: 0, postponed: 0, dropped: 0 };
    bookmarks.forEach((b) => { if (b.status in s) s[b.status]++; });
    return s;
  }, [bookmarks]);

  const total = Object.values(stats).reduce((a, b) => a + b, 0);

  const filtered = useMemo(() => {
    let list = bookmarks.filter((b) => b.status === activeTab);
    if (typeFilter !== 'all') list = list.filter((b) => b.contentType === typeFilter);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter((b) => b.title.toLowerCase().includes(q));
    }
    return [...list].sort((a, b) => {
      if (sortBy === 'rating') return (b.userRating || 0) - (a.userRating || 0);
      if (sortBy === 'title') return a.title.localeCompare(b.title);
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });
  }, [bookmarks, activeTab, typeFilter, searchQuery, sortBy]);

  const theme = STATUS_THEME[activeTab];

  if (!userId && !loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-950 px-4">
        <div className="text-center max-w-sm w-full">
          <div className="w-20 h-20 mx-auto mb-6 rounded-3xl bg-gradient-to-br from-purple-500 to-violet-700 flex items-center justify-center shadow-2xl shadow-purple-500/30 rotate-3">
            <BookmarkIcon className="w-9 h-9 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Требуется вход</h2>
          <p className="text-zinc-500 text-sm mb-6">Войдите в аккаунт, чтобы увидеть свои закладки</p>
          <a href="/auth" className="inline-block w-full py-3 rounded-xl bg-gradient-to-r from-purple-600 to-violet-600 text-white font-semibold text-sm shadow-lg shadow-purple-500/25 hover:from-purple-500 hover:to-violet-500 transition-all">
            Войти
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-950 via-zinc-950 to-zinc-900">
      <style>{`
        .bkc { animation: bkc-in .45s cubic-bezier(.16,1,.3,1) both; }
        @keyframes bkc-in { from { opacity: 0; transform: translateY(18px); } to { opacity: 1; transform: translateY(0); } }
        .bkc-overlay { animation: bkc-fade .15s ease both; }
        .bkc-modal { animation: bkc-pop .25s cubic-bezier(.16,1,.3,1) both; }
        @keyframes bkc-fade { from { opacity: 0; } }
        @keyframes bkc-pop { from { opacity: 0; transform: scale(.94); } to { opacity: 1; transform: scale(1); } }
        .bkm-scroll::-webkit-scrollbar { height: 0; width: 0; }
      `}</style>

      {/* Hero header */}
      <div className="relative overflow-hidden">
        <div className={`absolute -top-32 left-1/2 -translate-x-1/2 w-[36rem] h-[36rem] rounded-full blur-[120px] opacity-20 bg-gradient-to-br ${theme.gradient}`} />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 pt-10 pb-6">
          <div className="flex items-end justify-between gap-4 mb-8">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-purple-400 font-semibold mb-2 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" /> Коллекция
              </p>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                Мои закладки
              </h1>
              <p className="text-sm text-zinc-500 mt-1.5">
                {total} сохранённых · {stats[activeTab]} в «{CONTENT_STATUS_CONFIG[activeTab].label}»
              </p>
            </div>

            <div className="relative hidden sm:block">
              <SlidersHorizontal className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500 pointer-events-none" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="appearance-none pl-9 pr-8 py-2.5 bg-white/[0.05] border border-white/10 text-zinc-200 text-xs font-medium rounded-xl cursor-pointer focus:outline-none focus:ring-2 focus:ring-purple-500/40"
              >
                <option value="date">Недавние</option>
                <option value="rating">По оценке</option>
                <option value="title">По названию</option>
              </select>
            </div>
          </div>

          {/* Status pills */}
          <div className="flex gap-2 overflow-x-auto bkm-scroll pb-1 mb-4">
            {STATUS_ORDER.map((s) => {
              const c = CONTENT_STATUS_CONFIG[s];
              const t = STATUS_THEME[s];
              const active = activeTab === s;
              return (
                <button
                  key={s}
                  onClick={() => setActiveTab(s)}
                  className={`flex items-center gap-2 pl-3 pr-3.5 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-300 border ${
                    active
                      ? `bg-gradient-to-r ${t.gradient} text-black/90 border-transparent shadow-lg ${t.glow} scale-[1.03]`
                      : 'bg-white/[0.04] text-zinc-400 border-white/[0.06] hover:bg-white/[0.08] hover:text-zinc-200'
                  }`}
                >
                  <span>{c.icon}</span>{c.label}
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${active ? 'bg-black/20' : 'bg-white/10'}`}>
                    {stats[s]}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Type filter + search */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex gap-1.5 p-1 rounded-xl bg-white/[0.04] border border-white/[0.06] self-start">
              {TYPE_FILTERS.map((f) => (
                <button
                  key={f.key}
                  onClick={() => setTypeFilter(f.key)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    typeFilter === f.key ? 'bg-purple-600 text-white shadow-md shadow-purple-500/25' : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  {f.icon}{f.label}
                </button>
              ))}
            </div>
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Поиск по названию..."
                className="w-full pl-10 pr-9 py-2.5 bg-white/[0.05] border border-white/10 rounded-xl text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-purple-500/40 focus:border-transparent"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded-md hover:bg-white/10">
                  <X className="w-4 h-4 text-zinc-500" />
                </button>
              )}
            </div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="sm:hidden appearance-none px-3 py-2.5 bg-white/[0.05] border border-white/10 text-zinc-200 text-xs rounded-xl"
            >
              <option value="date">Недавние</option>
              <option value="rating">По оценке</option>
              <option value="title">По названию</option>
            </select>
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-16">
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="rounded-2xl overflow-hidden bg-zinc-900/60 animate-pulse" style={{ animationDelay: `${i * 60}ms` }}>
                <div className="aspect-[2/3] bg-zinc-800/70" />
                <div className="p-3 space-y-2"><div className="h-3.5 bg-zinc-800 rounded w-3/4" /><div className="h-3 bg-zinc-800/60 rounded w-1/2" /></div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className={`w-24 h-24 rounded-3xl mb-6 flex items-center justify-center bg-gradient-to-br ${theme.gradient} shadow-2xl ${theme.glow} rotate-3`}>
              <span className="text-4xl drop-shadow">{CONTENT_STATUS_CONFIG[activeTab].icon}</span>
            </div>
            <h3 className="text-lg font-bold text-white mb-1">{EMPTY_TEXT[activeTab]}</h3>
            <p className="text-sm text-zinc-500 max-w-xs">
              Добавляйте контент кнопкой на постере в каталоге фильмов, сериалов и игр — он появится здесь моментально.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {filtered.map((b, i) => <BookmarkCard key={b.id} bookmark={b} index={i} />)}
          </div>
        )}

        {/* Top-50 hint */}
        {bookmarks.some((b) =>
          (b.contentType === 'movie' && isInTop50('movie', b.contentId)) ||
          (b.contentType === 'series' && isInTop50('anime', b.contentId)) ||
          (b.contentType === 'game' && isInTop50('game', b.contentId))
        ) && (
          <p className="mt-10 text-center text-xs text-zinc-600 flex items-center justify-center gap-1.5">
            <Trophy className="w-3.5 h-3.5 text-amber-500/60" />
            Часть закладок добавлена и в Топ-50
          </p>
        )}
      </div>
    </div>
  );
}
