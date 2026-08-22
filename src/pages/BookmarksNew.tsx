import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Trash2, Star, Search, MoreVertical, BookmarkIcon, Film, Tv, Gamepad2, LayoutGrid, X, ChevronDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import * as bookmarkService from '@/services/bookmarkService';
import { ContentBookmark, ContentStatus, ContentType, CONTENT_STATUS_CONFIG } from '@/types/anime';
import supabase from '@/lib/supabase';
import { toast } from 'sonner';

/* ─── Content Type Filter Config ─── */
const CONTENT_TYPE_FILTERS: { key: ContentType | 'all'; label: string; icon: React.ReactNode }[] = [
  { key: 'all', label: 'Все', icon: <LayoutGrid className="w-4 h-4" /> },
  { key: 'movie', label: 'Фильмы', icon: <Film className="w-4 h-4" /> },
  { key: 'series', label: 'Сериалы', icon: <Tv className="w-4 h-4" /> },
  { key: 'game', label: 'Игры', icon: <Gamepad2 className="w-4 h-4" /> },
];

/* ─── Status tabs with enhanced colors ─── */
const STATUS_COLORS: Record<ContentStatus, { gradient: string; glow: string; ring: string }> = {
  favorite: { gradient: 'from-amber-500 to-orange-500', glow: 'shadow-amber-500/30', ring: 'ring-amber-500/40' },
  watching: { gradient: 'from-emerald-500 to-green-500', glow: 'shadow-emerald-500/30', ring: 'ring-emerald-500/40' },
  planned: { gradient: 'from-blue-500 to-indigo-500', glow: 'shadow-blue-500/30', ring: 'ring-blue-500/40' },
  watched: { gradient: 'from-slate-400 to-zinc-500', glow: 'shadow-slate-500/30', ring: 'ring-slate-400/40' },
  postponed: { gradient: 'from-orange-500 to-amber-600', glow: 'shadow-orange-500/30', ring: 'ring-orange-500/40' },
  dropped: { gradient: 'from-red-500 to-rose-600', glow: 'shadow-red-500/30', ring: 'ring-red-500/40' },
};

/* ─── Skeleton Card ─── */
const SkeletonCard = ({ index }: { index: number }) => (
  <div
    className="relative rounded-2xl overflow-hidden bg-zinc-900/60 animate-pulse"
    style={{ animationDelay: `${index * 80}ms` }}
  >
    <div className="aspect-[2/3] bg-zinc-800/80" />
    <div className="p-3 space-y-2">
      <div className="h-4 bg-zinc-800 rounded-lg w-3/4" />
      <div className="h-3 bg-zinc-800/60 rounded-lg w-1/2" />
    </div>
  </div>
);

/* ═══════════════════════════════════════════════════════════
   BOOKMARK CARD — Poster-first Netflix-style design
   ═══════════════════════════════════════════════════════════ */
const BookmarkCard = ({
  bookmark,
  onDelete,
  onStatusChange,
  onRatingChange,
  index,
}: {
  bookmark: ContentBookmark;
  onDelete: () => void;
  onStatusChange: (newStatus: ContentStatus) => void;
  onRatingChange: (newRating: number) => void;
  index: number;
}) => {
  const navigate = useNavigate();
  const [showActions, setShowActions] = useState(false);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  const [userRating, setUserRating] = useState<string>((bookmark.userRating || 0).toString());
  const config = CONTENT_STATUS_CONFIG[bookmark.status];
  const colors = STATUS_COLORS[bookmark.status];
  const statuses: ContentStatus[] = ['favorite', 'watching', 'planned', 'watched', 'postponed', 'dropped'];
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowActions(false);
        setShowStatusMenu(false);
      }
    };
    if (showActions || showStatusMenu) {
      document.addEventListener('mousedown', handler);
    }
    return () => document.removeEventListener('mousedown', handler);
  }, [showActions, showStatusMenu]);

  const handlePosterClick = () => {
    const route = bookmark.contentType === 'movie' ? 'movie' : bookmark.contentType === 'series' ? 'series' : 'game';
    navigate(`/${route}/${bookmark.contentId}`);
  };

  const handleRatingSubmit = () => {
    const rating = parseFloat(userRating);
    if (isNaN(rating) || rating < 0 || rating > 10) {
      toast.error('Рейтинг от 0 до 10');
      return;
    }
    onRatingChange(rating);
    setShowRatingModal(false);
    toast.success('Рейтинг обновлён');
  };

  const handleStatusChange = (newStatus: ContentStatus) => {
    onStatusChange(newStatus);
    setShowActions(false);
    setShowStatusMenu(false);
    toast.success(`Статус → ${CONTENT_STATUS_CONFIG[newStatus].label}`);
  };

  const handleDelete = () => {
    if (window.confirm('Удалить закладку?')) {
      onDelete();
      toast.success('Закладка удалена');
    }
  };

  const typeIcon = bookmark.contentType === 'movie' ? '🎬' : bookmark.contentType === 'series' ? '📺' : '🎮';

  return (
    <>
      <div
        className="bk-card group relative rounded-2xl overflow-hidden bg-zinc-900/80 border border-zinc-800/50 hover:border-zinc-700/80 transition-all duration-500 cursor-pointer"
        style={{ animationDelay: `${index * 60}ms` }}
      >
        {/* Poster */}
        <div className="relative aspect-[2/3] overflow-hidden" onClick={handlePosterClick}>
          {bookmark.posterUrl ? (
            <img
              src={bookmark.posterUrl}
              alt={bookmark.title}
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
              loading="lazy"
              onError={(e) => {
                (e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="300" height="450" viewBox="0 0 300 450"%3E%3Crect fill="%2318181b" width="300" height="450"/%3E%3Ctext x="150" y="225" text-anchor="middle" fill="%2352525b" font-size="14"%3EНет постера%3C/text%3E%3C/svg%3E';
              }}
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-zinc-800 to-zinc-900 flex items-center justify-center">
              <BookmarkIcon className="w-10 h-10 text-zinc-700" />
            </div>
          )}

          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-60 group-hover:opacity-80 transition-opacity duration-500" />

          {/* Hover overlay with actions */}
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center gap-3">
            <button
              onClick={(e) => { e.stopPropagation(); setShowRatingModal(true); }}
              className="p-2.5 rounded-full bg-white/15 backdrop-blur-sm hover:bg-white/25 transition-all duration-200 hover:scale-110"
              title="Рейтинг"
            >
              <Star className="w-5 h-5 text-amber-400" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); setShowActions(!showActions); }}
              className="p-2.5 rounded-full bg-white/15 backdrop-blur-sm hover:bg-white/25 transition-all duration-200 hover:scale-110"
              title="Меню"
            >
              <MoreVertical className="w-5 h-5 text-white" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); handleDelete(); }}
              className="p-2.5 rounded-full bg-white/15 backdrop-blur-sm hover:bg-red-500/40 transition-all duration-200 hover:scale-110"
              title="Удалить"
            >
              <Trash2 className="w-5 h-5 text-red-400" />
            </button>
          </div>

          {/* Content type badge */}
          <span className="absolute top-2.5 left-2.5 text-sm bg-black/50 backdrop-blur-sm rounded-lg px-2 py-0.5">{typeIcon}</span>

          {/* Rating badge */}
          {bookmark.externalRating ? (
            <div className="absolute top-2.5 right-2.5 flex items-center gap-1 bg-black/60 backdrop-blur-sm rounded-lg px-2 py-1">
              <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
              <span className="text-xs font-bold text-amber-400">{bookmark.externalRating.toFixed(1)}</span>
            </div>
          ) : null}

          {/* User rating if set */}
          {bookmark.userRating ? (
            <div className="absolute bottom-14 right-2.5 flex items-center gap-1 bg-purple-600/70 backdrop-blur-sm rounded-lg px-2 py-1">
              <span className="text-[10px] text-purple-200">МОЙ</span>
              <span className="text-xs font-bold text-white">{bookmark.userRating.toFixed(1)}</span>
            </div>
          ) : null}

          {/* Status badge on poster */}
          <div className={`absolute bottom-2.5 left-2.5 right-2.5 flex items-center justify-between`}>
            <span className={`px-2.5 py-1 rounded-lg text-[11px] font-bold uppercase tracking-wider bg-gradient-to-r ${colors.gradient} text-white shadow-lg ${colors.glow}`}>
              {config.label}
            </span>
            {bookmark.isFavorite && <span className="text-sm">⭐</span>}
          </div>
        </div>

        {/* Info below poster */}
        <div className="p-3 space-y-1">
          <h3 className="font-semibold text-white text-sm leading-tight line-clamp-2 group-hover:text-purple-300 transition-colors duration-300">
            {bookmark.title}
          </h3>
          <div className="flex items-center gap-2 text-[11px] text-zinc-500">
            {bookmark.releaseYear && <span>{bookmark.releaseYear}</span>}
            {bookmark.genre && (
              <>
                <span>•</span>
                <span className="line-clamp-1">{bookmark.genre.split(',')[0]}</span>
              </>
            )}
          </div>
          {bookmark.progress !== undefined && bookmark.totalItems ? (
            <div className="pt-1">
              <div className="flex items-center justify-between text-[10px] text-zinc-500 mb-1">
                <span>Прогресс</span>
                <span>{bookmark.progress}/{bookmark.totalItems}</span>
              </div>
              <div className="h-1 bg-zinc-800 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full bg-gradient-to-r ${colors.gradient} transition-all duration-500`}
                  style={{ width: `${Math.min((bookmark.progress / bookmark.totalItems) * 100, 100)}%` }}
                />
              </div>
            </div>
          ) : null}
        </div>

        {/* Actions dropdown */}
        {showActions && (
          <div
            ref={menuRef}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-30 bg-zinc-900/95 backdrop-blur-xl border border-zinc-700/50 rounded-xl shadow-2xl shadow-black/50 min-w-[200px] bk-dropdown"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-2 space-y-0.5">
              <p className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider px-3 py-1.5">Изменить статус</p>
              {statuses.map(s => (
                <button
                  key={s}
                  onClick={() => handleStatusChange(s)}
                  className={`w-full text-left px-3 py-2 text-xs rounded-lg transition-all duration-200 flex items-center gap-2 ${bookmark.status === s
                    ? `bg-gradient-to-r ${STATUS_COLORS[s].gradient} text-white font-semibold`
                    : 'text-zinc-300 hover:bg-zinc-800'
                    }`}
                >
                  <span>{CONTENT_STATUS_CONFIG[s].icon}</span>
                  {CONTENT_STATUS_CONFIG[s].label}
                </button>
              ))}
              <div className="border-t border-zinc-800 my-1" />
              <button
                onClick={handleDelete}
                className="w-full text-left px-3 py-2 text-xs text-red-400 hover:bg-red-500/10 rounded-lg transition-colors flex items-center gap-2"
              >
                <Trash2 className="w-3.5 h-3.5" /> Удалить закладку
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Rating Modal */}
      {showRatingModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 bk-modal-overlay" onClick={() => setShowRatingModal(false)}>
          <div className="bg-zinc-900 border border-zinc-800 w-80 rounded-2xl p-6 shadow-2xl bk-modal" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-white">Ваш рейтинг</h3>
              <button onClick={() => setShowRatingModal(false)} className="p-1 hover:bg-zinc-800 rounded-lg transition-colors">
                <X className="w-5 h-5 text-zinc-400" />
              </button>
            </div>

            <div className="mb-6">
              <div className="relative mb-4">
                <input
                  type="number"
                  min="0"
                  max="10"
                  step="0.1"
                  value={userRating}
                  onChange={(e) => setUserRating(e.target.value)}
                  placeholder="0-10"
                  className="w-full px-4 py-3 bg-zinc-800/80 border border-zinc-700 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 text-center text-3xl font-bold transition-all"
                />
              </div>
              <div className="flex justify-center gap-1.5 mb-3">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => (
                  <button
                    key={n}
                    onClick={() => setUserRating(n.toString())}
                    className={`w-7 h-7 rounded-lg text-[11px] font-bold transition-all duration-200 ${parseFloat(userRating) === n
                      ? 'bg-purple-500 text-white scale-110'
                      : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-white'
                      }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-2">
              <button onClick={() => setShowRatingModal(false)} className="flex-1 px-4 py-2.5 bg-zinc-800 text-white rounded-xl hover:bg-zinc-700 transition-colors text-sm font-medium">
                Отмена
              </button>
              <button onClick={handleRatingSubmit} className="flex-1 px-4 py-2.5 bg-gradient-to-r from-purple-600 to-violet-600 text-white rounded-xl hover:from-purple-700 hover:to-violet-700 transition-all text-sm font-medium shadow-lg shadow-purple-500/25">
                Сохранить
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

/* ═══════════════════════════════════════════════════════════
   MAIN PAGE COMPONENT
   ═══════════════════════════════════════════════════════════ */
export default function BookmarksNew() {
  const [user, setUser] = useState<any>(null);
  const [bookmarks, setBookmarks] = useState<ContentBookmark[]>([]);
  const [activeTab, setActiveTab] = useState<ContentStatus>('watching');
  const [contentTypeFilter, setContentTypeFilter] = useState<ContentType | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'rating' | 'title'>('date');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<Record<ContentStatus, number>>({
    favorite: 0, watching: 0, planned: 0, watched: 0, postponed: 0, dropped: 0,
  });

  const statuses: ContentStatus[] = ['favorite', 'watching', 'planned', 'watched', 'postponed', 'dropped'];

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Get user
  useEffect(() => {
    const getUser = async () => {
      const { data } = await supabase.auth.getUser();
      setUser(data.user);
    };
    getUser();
  }, []);

  // Load bookmarks
  useEffect(() => {
    const loadBookmarks = async () => {
      if (!user?.id) { setLoading(false); return; }
      try {
        setLoading(true);
        const data = await bookmarkService.getUserBookmarks(user.id);
        setBookmarks(data);

        const newStats: Record<ContentStatus, number> = {
          favorite: 0, watching: 0, planned: 0, watched: 0, postponed: 0, dropped: 0,
        };
        data.forEach(b => { if (b.status in newStats) newStats[b.status]++; });
        setStats(newStats);
      } catch (error) {
        console.error('Error loading bookmarks:', error);
      } finally {
        setLoading(false);
      }
    };
    loadBookmarks();
  }, [user?.id]);

  // Filtered & sorted bookmarks
  const filteredBookmarks = useMemo(() => {
    let filtered = bookmarks.filter(b => b.status === activeTab);

    if (contentTypeFilter !== 'all') {
      filtered = filtered.filter(b => b.contentType === contentTypeFilter);
    }

    if (debouncedSearch) {
      const q = debouncedSearch.toLowerCase();
      filtered = filtered.filter(b => b.title.toLowerCase().includes(q));
    }

    if (sortBy === 'rating') {
      filtered.sort((a, b) => (b.externalRating || 0) - (a.externalRating || 0));
    } else if (sortBy === 'title') {
      filtered.sort((a, b) => a.title.localeCompare(b.title));
    } else {
      filtered.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    }

    return filtered;
  }, [activeTab, contentTypeFilter, debouncedSearch, sortBy, bookmarks]);

  const handleDelete = useCallback(async (id: string) => {
    setBookmarks(prev => prev.filter(b => b.id !== id));
    setStats(prev => {
      const bookmark = bookmarks.find(b => b.id === id);
      if (bookmark) return { ...prev, [bookmark.status]: Math.max(0, prev[bookmark.status] - 1) };
      return prev;
    });
    try {
      await bookmarkService.deleteBookmark(id);
    } catch {
      // Reload on error
      if (user?.id) {
        const data = await bookmarkService.getUserBookmarks(user.id);
        setBookmarks(data);
      }
    }
  }, [bookmarks, user?.id]);

  const handleStatusChange = useCallback(async (id: string, newStatus: ContentStatus) => {
    const bookmark = bookmarks.find(b => b.id === id);
    if (!bookmark) return;
    // Optimistic
    const oldStatus = bookmark.status;
    setBookmarks(prev => prev.map(b => b.id === id ? { ...b, status: newStatus } : b));
    setStats(prev => ({
      ...prev,
      [oldStatus]: Math.max(0, prev[oldStatus] - 1),
      [newStatus]: prev[newStatus] + 1,
    }));
    try {
      await bookmarkService.updateBookmarkStatus(id, newStatus);
    } catch {
      // Revert
      setBookmarks(prev => prev.map(b => b.id === id ? { ...b, status: oldStatus } : b));
      setStats(prev => ({
        ...prev,
        [oldStatus]: prev[oldStatus] + 1,
        [newStatus]: Math.max(0, prev[newStatus] - 1),
      }));
    }
  }, [bookmarks]);

  const handleRatingChange = useCallback(async (id: string, newRating: number) => {
    setBookmarks(prev => prev.map(b => b.id === id ? { ...b, userRating: newRating } : b));
    try {
      await bookmarkService.updateBookmarkRating(id, newRating);
    } catch {
      toast.error('Ошибка при обновлении рейтинга');
    }
  }, []);

  const totalBookmarks = Object.values(stats).reduce((a, b) => a + b, 0);

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-zinc-950">
        <div className="text-center bk-fade-in">
          <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-purple-600 to-violet-600 flex items-center justify-center shadow-2xl shadow-purple-500/30">
            <BookmarkIcon className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-2xl font-bold mb-2 text-white">Требуется вход</h2>
          <p className="text-zinc-400">Войдите чтобы просмотреть свои закладки</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950">
      {/* CSS Animations */}
      <style>{`
        .bk-card {
          animation: bk-slide-up 0.5s cubic-bezier(0.16, 1, 0.3, 1) both;
        }
        .bk-fade-in {
          animation: bk-fade 0.4s ease-out both;
        }
        .bk-dropdown {
          animation: bk-scale-in 0.2s cubic-bezier(0.16, 1, 0.3, 1) both;
        }
        .bk-modal-overlay {
          animation: bk-fade 0.2s ease-out both;
        }
        .bk-modal {
          animation: bk-scale-in 0.3s cubic-bezier(0.16, 1, 0.3, 1) both;
        }
        .bk-tab-indicator {
          transition: left 0.3s cubic-bezier(0.16, 1, 0.3, 1), width 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }
        @keyframes bk-slide-up {
          from { opacity: 0; transform: translateY(24px) scale(0.97); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes bk-fade {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes bk-scale-in {
          from { opacity: 0; transform: scale(0.9); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes bk-shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        .bk-skeleton {
          background: linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.04) 50%, transparent 100%);
          background-size: 200% 100%;
          animation: bk-shimmer 1.5s infinite;
        }
        .bk-tab-active {
          transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .bk-scrollbar::-webkit-scrollbar { height: 0; width: 0; }
      `}</style>

      {/* ─── Glassmorphism Header ─── */}
      <div className="sticky top-0 z-20">
        {/* Gradient background */}
        <div className="absolute inset-0 bg-gradient-to-b from-purple-900/20 via-zinc-950/95 to-zinc-950 backdrop-blur-xl" />

        <div className="relative container mx-auto px-4 pt-6 pb-4">
          {/* Title + stats */}
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600 to-violet-600 flex items-center justify-center shadow-lg shadow-purple-500/25">
                <BookmarkIcon className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">Мои закладки</h1>
                <p className="text-xs text-zinc-500">{totalBookmarks} всего</p>
              </div>
            </div>

            {/* Sort dropdown */}
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="appearance-none pl-3 pr-8 py-2 bg-zinc-800/80 text-white text-xs font-medium rounded-xl border border-zinc-700/50 hover:border-zinc-600 transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-purple-500/30"
              >
                <option value="date">По дате</option>
                <option value="rating">По рейтингу</option>
                <option value="title">По названию</option>
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500 pointer-events-none" />
            </div>
          </div>

          {/* Search */}
          <div className="relative mb-4">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input
              placeholder="Поиск по названию..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-10 py-2.5 bg-zinc-800/60 border border-zinc-700/40 text-white text-sm rounded-xl placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500/50 transition-all"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 hover:bg-zinc-700 rounded-md transition-colors">
                <X className="w-4 h-4 text-zinc-500" />
              </button>
            )}
          </div>

          {/* Content Type Filter Chips */}
          <div className="flex gap-2 mb-4 bk-scrollbar overflow-x-auto pb-1">
            {CONTENT_TYPE_FILTERS.map(f => (
              <button
                key={f.key}
                onClick={() => setContentTypeFilter(f.key)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all duration-300 ${contentTypeFilter === f.key
                  ? 'bg-purple-600/20 text-purple-300 border border-purple-500/30 shadow-sm shadow-purple-500/10'
                  : 'bg-zinc-800/50 text-zinc-400 border border-zinc-700/30 hover:bg-zinc-800 hover:text-zinc-300'
                  }`}
              >
                {f.icon}
                {f.label}
              </button>
            ))}
          </div>

          {/* Status Tabs */}
          <div className="flex gap-1 bk-scrollbar overflow-x-auto pb-1">
            {statuses.map(status => {
              const c = CONTENT_STATUS_CONFIG[status];
              const sc = STATUS_COLORS[status];
              const isActive = activeTab === status;
              return (
                <button
                  key={status}
                  onClick={() => setActiveTab(status)}
                  className={`bk-tab-active flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap ${isActive
                    ? `bg-gradient-to-r ${sc.gradient} text-white shadow-lg ${sc.glow}`
                    : 'bg-zinc-800/40 text-zinc-500 hover:bg-zinc-800/70 hover:text-zinc-300'
                    }`}
                >
                  <span className="text-sm">{c.icon}</span>
                  <span>{c.label}</span>
                  <span className={`ml-0.5 text-[10px] px-1.5 py-0.5 rounded-md ${isActive ? 'bg-white/20' : 'bg-zinc-700/50'
                    }`}>
                    {stats[status]}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ─── Content Grid ─── */}
      <div className="container mx-auto px-4 py-6">
        {/* Result count */}
        <div className="flex items-center justify-between mb-4">
          <p className="text-xs text-zinc-600 font-medium">
            {filteredBookmarks.length} {filteredBookmarks.length === 1 ? 'элемент' : 'элементов'}
          </p>
        </div>

        {loading ? (
          /* Skeleton Grid */
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {Array.from({ length: 12 }).map((_, i) => (
              <SkeletonCard key={i} index={i} />
            ))}
          </div>
        ) : filteredBookmarks.length === 0 ? (
          /* Empty state */
          <div className="flex flex-col items-center justify-center py-20 bk-fade-in">
            <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${STATUS_COLORS[activeTab].gradient} flex items-center justify-center mb-6 shadow-xl ${STATUS_COLORS[activeTab].glow} opacity-50`}>
              <span className="text-3xl">{CONTENT_STATUS_CONFIG[activeTab].icon}</span>
            </div>
            <p className="text-zinc-400 text-base font-medium mb-1">Здесь пока пусто</p>
            <p className="text-zinc-600 text-sm">
              {contentTypeFilter !== 'all'
                ? `Нет ${contentTypeFilter === 'movie' ? 'фильмов' : contentTypeFilter === 'series' ? 'сериалов' : 'игр'} в этой категории`
                : 'Добавляйте контент из каталога'
              }
            </p>
          </div>
        ) : (
          /* Cards Grid */
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {filteredBookmarks.map((bookmark, i) => (
              <BookmarkCard
                key={bookmark.id}
                bookmark={bookmark}
                index={i}
                onDelete={() => handleDelete(bookmark.id)}
                onStatusChange={(newStatus) => handleStatusChange(bookmark.id, newStatus)}
                onRatingChange={(newRating) => handleRatingChange(bookmark.id, newRating)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
