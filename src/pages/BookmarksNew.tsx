import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search, X, Star, Trash2, Trophy, Bookmark as BookmarkIcon,
  Film, Tv, Gamepad2, Clapperboard, LayoutGrid, SlidersHorizontal, Sparkles,
  MoreVertical, ExternalLink, Check, ChevronDown, Play, CalendarClock,
  CheckCheck, Pause, type LucideIcon,
} from 'lucide-react';
import { useBookmarks } from '@/context/BookmarkContext';
import { ContentBookmark, ContentStatus, ContentType, CONTENT_STATUS_CONFIG } from '@/types/anime';
import { toast } from 'sonner';

const STATUS_ORDER: ContentStatus[] = ['favorite', 'watching', 'planned', 'watched', 'postponed', 'dropped'];

const STATUS_THEME: Record<ContentStatus, { gradient: string; glow: string; text: string; soft: string; dot: string }> = {
  favorite:  { gradient: 'from-amber-300 to-amber-500',   glow: 'shadow-amber-500/25',   text: 'text-amber-300',     soft: 'bg-amber-400/10',     dot: 'bg-amber-300' },
  watching:  { gradient: 'from-emerald-300 to-teal-500', glow: 'shadow-emerald-500/25', text: 'text-emerald-300',   soft: 'bg-emerald-400/10',   dot: 'bg-emerald-300' },
  planned:   { gradient: 'from-sky-300 to-indigo-400',   glow: 'shadow-sky-500/25',      text: 'text-sky-300',       soft: 'bg-sky-400/10',       dot: 'bg-sky-300' },
  watched:   { gradient: 'from-zinc-300 to-zinc-500',    glow: 'shadow-zinc-500/25',     text: 'text-zinc-300',      soft: 'bg-zinc-400/10',      dot: 'bg-zinc-300' },
  postponed: { gradient: 'from-orange-300 to-pink-400',  glow: 'shadow-orange-500/25',   text: 'text-orange-300',    soft: 'bg-orange-400/10',    dot: 'bg-orange-300' },
  dropped:   { gradient: 'from-red-300 to-rose-500',     glow: 'shadow-red-500/25',      text: 'text-red-300',       soft: 'bg-red-400/10',       dot: 'bg-red-300' },
};

const TYPE_FILTERS: { key: ContentType | 'all'; label: string; icon: React.ReactNode }[] = [
  { key: 'all', label: 'Все', icon: <LayoutGrid className="w-3.5 h-3.5" /> },
  { key: 'movie', label: 'Фильмы', icon: <Film className="w-3.5 h-3.5" /> },
  { key: 'series', label: 'Сериалы', icon: <Tv className="w-3.5 h-3.5" /> },
  { key: 'anime', label: 'Аниме', icon: <Clapperboard className="w-3.5 h-3.5" /> },
  { key: 'game', label: 'Игры', icon: <Gamepad2 className="w-3.5 h-3.5" /> },
];

const TYPE_ICON: Record<ContentType, React.ReactNode> = {
  movie: <Film className="w-3.5 h-3.5" />,
  series: <Tv className="w-3.5 h-3.5" />,
  anime: <Clapperboard className="w-3.5 h-3.5" />,
  game: <Gamepad2 className="w-3.5 h-3.5" />,
};

const EMPTY_TEXT: Record<ContentStatus, string> = {
  favorite: 'Нет избранного',
  watching: 'Ничего не смотрите',
  planned: 'Планов пока нет',
  watched: 'Ничего не просмотрено',
  postponed: 'Нет отложенного',
  dropped: 'Ничего не брошено',
};

/* Векторные иконки статусов вместо эмодзи — стабильно на всех платформах */
const STATUS_ICON: Record<ContentStatus, LucideIcon> = {
  favorite: Star,
  watching: Play,
  planned: CalendarClock,
  watched: CheckCheck,
  postponed: Pause,
  dropped: X,
};

/* ─────────── Row ─────────── */
function BookmarkRow({ bookmark, index }: { bookmark: ContentBookmark; index: number }) {
  const navigate = useNavigate();
  const { setStatus, removeBookmark, updateRating } = useBookmarks();
  const [ratingOpen, setRatingOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [ratingInput, setRatingInput] = useState(String(bookmark.userRating || ''));

  const theme = STATUS_THEME[bookmark.status];
  const cfg = CONTENT_STATUS_CONFIG[bookmark.status];

  const openDetail = () => {
    const route = bookmark.contentType === 'movie' ? 'movie'
      : bookmark.contentType === 'series' ? 'series' : bookmark.contentType === 'game' ? 'game' : null;
    if (route) navigate(`/${route}/${bookmark.contentId}`);
  };

  const applyStatus = (s: ContentStatus) => {
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

  const handleStatus = (e: React.MouseEvent, s: ContentStatus) => {
    e.stopPropagation();
    setMenuOpen(false);
    applyStatus(s);
  };

  const handleDelete = () => {
    setMenuOpen(false);
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
        className={`bkc group relative flex gap-3.5 rounded-2xl bg-white/[0.03] border border-white/[0.07] p-3 hover:border-amber-200/25 hover:bg-white/[0.05] transition-all duration-300 cursor-pointer ${menuOpen ? 'z-20' : ''}`}
        style={{ animationDelay: `${Math.min(index * 40, 400)}ms` }}
        onClick={openDetail}
      >
        {/* Poster */}
        <div className="relative w-24 sm:w-28 shrink-0 aspect-[2/3] rounded-xl overflow-hidden bg-zinc-800">
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
              <BookmarkIcon className="w-7 h-7 text-zinc-700" />
            </div>
          )}
          {!!bookmark.externalRating && (
            <span className="absolute bottom-1.5 left-1.5 flex items-center gap-1 bg-black/70 backdrop-blur-sm rounded-md px-1.5 py-0.5">
              <Star className="w-3 h-3 fill-amber-300 text-amber-300" />
              <span className="text-[11px] font-bold text-amber-200 tabular-nums">{Number(bookmark.externalRating).toFixed(1)}</span>
            </span>
          )}
        </div>

        {/* Body */}
        <div className="flex-1 min-w-0 flex flex-col py-0.5">
          <h3 className="text-[17px] font-semibold text-white leading-snug line-clamp-2 pr-8 group-hover:text-amber-100 transition-colors">
            {bookmark.title}
          </h3>
          <p className="mt-1 flex items-center gap-1.5 text-[13px] text-zinc-400">
            <span className="inline-flex text-zinc-500">{TYPE_ICON[bookmark.contentType]}</span>
            {bookmark.releaseYear && <span className="tabular-nums">{bookmark.releaseYear}</span>}
            {!!bookmark.userRating && (
              <span className={`inline-flex items-center gap-0.5 font-semibold ${theme.text}`}>
                <Star className="w-3 h-3 fill-current" />{Number(bookmark.userRating).toFixed(1)}
              </span>
            )}
          </p>
          {bookmark.synopsis ? (
            <p className="mt-1.5 text-[13px] leading-relaxed text-zinc-500 line-clamp-3">
              {bookmark.synopsis}
            </p>
          ) : (
            <p className="mt-1.5 text-[13px] text-zinc-700">Без описания</p>
          )}
          <div className="mt-auto pt-2 flex items-center gap-2">
            <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wide ${theme.soft} ${theme.text} border border-white/[0.07]`}>
              <span className={`w-1.5 h-1.5 rounded-full ${theme.dot}`} />
              {cfg.label}
            </span>
          </div>
        </div>

        {/* ⋮ menu */}
        <div className="absolute top-2 right-2">
          <button
            onClick={(e) => { e.stopPropagation(); setMenuOpen(!menuOpen); }}
            title="Действия"
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${menuOpen ? 'bg-white/15 text-white' : 'text-zinc-400 hover:bg-white/10 hover:text-white active:bg-white/15'}`}
          >
            <MoreVertical className="w-5 h-5" />
          </button>

          {menuOpen && (
            <>
              <div className="fixed inset-0 z-20" onClick={(e) => { e.stopPropagation(); setMenuOpen(false); }} />
              <div className="absolute right-0 top-9 z-30 w-52 rounded-xl border border-white/10 bg-zinc-900 shadow-2xl shadow-black/60 py-1.5 bkc-modal" onClick={(e) => e.stopPropagation()}>
                <button
                  onClick={(e) => { e.stopPropagation(); setMenuOpen(false); openDetail(); }}
                  className="w-full flex items-center gap-2.5 px-3.5 py-2 text-[13px] text-zinc-200 hover:bg-white/[0.06] transition-colors text-left"
                >
                  <ExternalLink className="w-4 h-4 text-zinc-500" /> Открыть
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); setMenuOpen(false); setRatingOpen(true); }}
                  className="w-full flex items-center gap-2.5 px-3.5 py-2 text-[13px] text-zinc-200 hover:bg-white/[0.06] transition-colors text-left"
                >
                  <Star className="w-4 h-4 text-amber-300" /> Оценить{bookmark.userRating ? ` (${Number(bookmark.userRating).toFixed(1)})` : ''}
                </button>
                <div className="my-1.5 h-px bg-white/[0.07]" />
                {STATUS_ORDER.map((s) => (
                  <button
                    key={s}
                    onClick={(e) => handleStatus(e, s)}
                    className="w-full flex items-center gap-2.5 px-3.5 py-2 text-[13px] text-zinc-200 hover:bg-white/[0.06] transition-colors text-left"
                  >
                    {(() => {
                      const Icon = STATUS_ICON[s];
                      return <Icon className="w-4 h-4 text-zinc-400" />;
                    })()}
                    <span className="flex-1">{CONTENT_STATUS_CONFIG[s].label}</span>
                    {bookmark.status === s && <Check className="w-3.5 h-3.5 text-amber-300" />}
                  </button>
                ))}
                <div className="my-1.5 h-px bg-white/[0.07]" />
                <button
                  onClick={(e) => { e.stopPropagation(); handleDelete(); }}
                  className="w-full flex items-center gap-2.5 px-3.5 py-2 text-[13px] text-red-300 hover:bg-red-500/10 transition-colors text-left"
                >
                  <Trash2 className="w-4 h-4" /> Удалить
                </button>
              </div>
            </>
          )}
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
              className="w-full px-4 py-3 mb-4 bg-zinc-800 border border-zinc-700 rounded-xl text-white text-center text-3xl font-bold tabular-nums focus:outline-none focus:ring-2 focus:ring-amber-200/40"
            />

            <div className="flex justify-center gap-1 mb-5 flex-wrap">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                <button
                  key={n}
                  onClick={() => setRatingInput(String(n))}
                  className={`w-7 h-7 rounded-lg text-[11px] font-bold tabular-nums transition-all ${
                    parseFloat(ratingInput) === n ? 'bg-amber-300 text-black scale-110' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
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
              <button onClick={submitRating} className="flex-1 px-4 py-2.5 rounded-xl bg-gradient-to-b from-amber-200 to-amber-400 text-black text-sm font-semibold shadow-lg shadow-amber-500/25 hover:brightness-105 transition-all">
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
  const [filterOpen, setFilterOpen] = useState(false);

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
      <div className="min-h-screen font-ui flex items-center justify-center bg-zinc-950 px-4">
        <div className="text-center max-w-sm w-full">
          <div className="w-20 h-20 mx-auto mb-6 rounded-3xl bg-gradient-to-b from-amber-200 to-amber-500 flex items-center justify-center shadow-2xl shadow-amber-500/25 rotate-3">
            <BookmarkIcon className="w-9 h-9 text-black" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Требуется вход</h2>
          <p className="text-zinc-500 text-sm mb-6">Войдите в аккаунт, чтобы увидеть свои закладки</p>
          <a href="/auth" className="inline-block w-full py-3 rounded-xl bg-white text-black font-semibold text-sm hover:bg-zinc-200 transition-all">
            Войти
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen font-ui bg-gradient-to-b from-zinc-950 via-zinc-950 to-zinc-900">
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
      <div className="relative overflow-visible">
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[36rem] h-[36rem] rounded-full blur-[120px] opacity-[0.14] bg-gradient-to-br from-amber-200 to-orange-500" />
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber-100/40 to-transparent" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 pt-10 pb-6">
          <div className="flex items-end justify-between gap-4 mb-8">
            <div>
              <p className="text-[11px] uppercase tracking-[0.28em] text-amber-200/90 font-bold mb-2 flex items-center gap-2">
                <span className="h-px w-6 bg-current opacity-60" />
                <Sparkles className="w-3.5 h-3.5" /> Коллекция
              </p>
              <h1 className="text-4xl sm:text-5xl font-bold text-white tracking-tight">
                Мои закладки
              </h1>
              <p className="text-sm text-zinc-500 mt-1.5">
                {total} сохранённых · {stats[activeTab]} в «{CONTENT_STATUS_CONFIG[activeTab].label}»
              </p>
            </div>
          </div>

          {/* Status pills */}
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1 mb-4">
            {STATUS_ORDER.map((s) => {
              const c = CONTENT_STATUS_CONFIG[s];
              const t = STATUS_THEME[s];
              const active = activeTab === s;
              const Icon = STATUS_ICON[s];
              return (
                <button
                  key={s}
                  onClick={() => setActiveTab(s)}
                  className={`flex items-center gap-2 pl-3 pr-3.5 py-2 rounded-full text-xs font-semibold whitespace-nowrap shrink-0 transition-colors duration-200 border ${
                    active
                      ? `${t.soft} ${t.text} border-transparent ring-1 ring-white/20`
                      : 'bg-white/[0.04] text-zinc-400 border-white/[0.06] hover:bg-white/[0.08] hover:text-zinc-200'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${s === 'favorite' || s === 'watching' ? 'fill-current' : ''}`} />
                  {c.label}
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold tabular-nums ${active ? 'bg-black/20' : 'bg-white/10'}`}>
                    {stats[s]}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Search + one filter button */}
          <div className="flex gap-2.5">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Поиск по названию..."
                className="w-full pl-10 pr-9 py-2.5 bg-white/[0.05] border border-white/10 rounded-xl text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-amber-200/30 focus:border-transparent"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded-md hover:bg-white/10">
                  <X className="w-4 h-4 text-zinc-500" />
                </button>
              )}
            </div>
            <div className="relative">
              <button
                onClick={() => setFilterOpen(!filterOpen)}
                title="Тип и сортировка"
                className={`h-[46px] px-4 rounded-xl border flex items-center gap-2 text-sm font-semibold whitespace-nowrap transition-colors ${filterOpen || typeFilter !== 'all' || sortBy !== 'date' ? 'bg-white text-black border-transparent' : 'bg-white/[0.05] border-white/10 text-zinc-200 hover:bg-white/[0.09]'}`}
              >
                <SlidersHorizontal className="w-4 h-4" />
                {TYPE_FILTERS.find((f) => f.key === typeFilter)?.label}
                <ChevronDown className={`w-3.5 h-3.5 opacity-60 transition-transform ${filterOpen ? 'rotate-180' : ''}`} />
              </button>

              {filterOpen && (
                <>
                  <div className="fixed inset-0 z-20" onClick={() => setFilterOpen(false)} />
                  <div className="absolute right-0 top-12 z-30 w-60 rounded-xl border border-white/10 bg-zinc-900 shadow-2xl shadow-black/60 py-1.5 bkc-modal">
                    <p className="px-3.5 pt-2 pb-1 text-[10px] font-bold uppercase tracking-[0.15em] text-zinc-500">Тип</p>
                    {TYPE_FILTERS.map((f) => (
                      <button
                        key={f.key}
                        onClick={() => { setTypeFilter(f.key); }}
                        className="w-full flex items-center gap-2.5 px-3.5 py-2 text-[13px] text-zinc-200 hover:bg-white/[0.06] transition-colors text-left"
                      >
                        <span className="text-zinc-500">{f.icon}</span>
                        <span className="flex-1">{f.label}</span>
                        {typeFilter === f.key && <Check className="w-3.5 h-3.5 text-amber-300" />}
                      </button>
                    ))}
                    <div className="my-1.5 h-px bg-white/[0.07]" />
                    <p className="px-3.5 pt-1 pb-1 text-[10px] font-bold uppercase tracking-[0.15em] text-zinc-500">Сортировка</p>
                    {([
                      { key: 'date', label: 'Недавние' },
                      { key: 'rating', label: 'По оценке' },
                      { key: 'title', label: 'По названию' },
                    ] as const).map((o) => (
                      <button
                        key={o.key}
                        onClick={() => { setSortBy(o.key); }}
                        className="w-full flex items-center gap-2.5 px-3.5 py-2 text-[13px] text-zinc-200 hover:bg-white/[0.06] transition-colors text-left"
                      >
                        <span className="flex-1 pl-[26px]">{o.label}</span>
                        {sortBy === o.key && <Check className="w-3.5 h-3.5 text-amber-300" />}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* List */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-16">
        {loading ? (
          <div className="flex flex-col gap-3 max-w-3xl">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex gap-3.5 rounded-2xl bg-zinc-900/60 p-3 animate-pulse" style={{ animationDelay: `${i * 60}ms` }}>
                <div className="w-24 sm:w-28 shrink-0 aspect-[2/3] rounded-xl bg-zinc-800/70" />
                <div className="flex-1 py-1 space-y-2.5">
                  <div className="h-4 bg-zinc-800 rounded w-2/3" />
                  <div className="h-3 bg-zinc-800/60 rounded w-1/3" />
                  <div className="h-3 bg-zinc-800/60 rounded w-full" />
                  <div className="h-3 bg-zinc-800/60 rounded w-5/6" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className={`w-24 h-24 rounded-3xl mb-6 flex items-center justify-center bg-gradient-to-b from-amber-200 to-amber-500 shadow-2xl ${theme.glow} rotate-3`}>
              {(() => {
                const Icon = STATUS_ICON[activeTab];
                return <Icon className="w-10 h-10 text-black/80 fill-black/20" />;
              })()}
            </div>
            <h3 className="text-lg font-bold text-white mb-1">{EMPTY_TEXT[activeTab]}</h3>
            <p className="text-sm text-zinc-500 max-w-xs">
              Добавляйте контент кнопкой на постере в каталоге фильмов, сериалов, аниме и игр — он появится здесь моментально.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3 max-w-3xl">
            {filtered.map((b, i) => <BookmarkRow key={b.id} bookmark={b} index={i} />)}
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
