import { useState, useMemo, useEffect } from 'react';
import { useNavigate, Link, useParams, useSearchParams } from 'react-router-dom';
import {
  Search, X, Star, Trash2, Trophy, Bookmark as BookmarkIcon,
  Film, Tv, Gamepad2, Clapperboard, Sparkles,
  MoreVertical, ExternalLink, Check, ChevronDown, Play, CalendarClock,
  CheckCheck, Pause, ArrowRight, type LucideIcon, SlidersHorizontal,
  Plus, Eye, ArrowLeft
} from 'lucide-react';
import { useBookmarks } from '@/context/BookmarkContext';
import { getUserBookmarks } from '@/services/bookmarkService';
import supabase from '@/lib/supabase';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import ImportBookmarksDialog from '@/components/ImportBookmarksDialog';
import PosterImage from '@/components/PosterImage';
import { ContentBookmark, ContentStatus, ContentType, CONTENT_STATUS_CONFIG } from '@/types/anime';
import { toast } from 'sonner';

/**
 * Порядок статусов как в Аниксарт / Кинопоиск:
 * Смотрю → В планах → Просмотрено → Отложено → Брошено → Избранное
 */
const STATUS_ORDER: ContentStatus[] = [
  'watching',
  'planned',
  'watched',
  'postponed',
  'dropped',
  'favorite',
];

/**
 * Чёткая цветовая дифференциация статусов (Кинопоиск & Anixart):
 * Смотрю: Изумрудно-зелёный
 * В планах: Неоново-синий
 * Просмотрено: Фиолетовый / Пурпурный
 * Отложено: Тёплый оранжевый
 * Брошено: Рубиново-красный
 * Избранное: Золотой янтарь
 */
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
    bar: string;
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
    bar: 'bg-emerald-500',
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
    bar: 'bg-sky-500',
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
    bar: 'bg-purple-500',
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
    bar: 'bg-orange-500',
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
    bar: 'bg-rose-500',
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
    bar: 'bg-amber-400',
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

/* ─────────────────────────────────────────────────────────────
   Rating Modal
───────────────────────────────────────────────────────────── */
function RatingModal({
  title,
  currentRating,
  onClose,
  onSave,
}: {
  title: string;
  currentRating?: number;
  onClose: () => void;
  onSave: (rating: number) => void;
}) {
  const [ratingInput, setRatingInput] = useState(String(currentRating || ''));

  const submit = () => {
    const r = parseFloat(ratingInput);
    if (isNaN(r) || r < 0 || r > 10) {
      toast.error('Оценка от 0 до 10');
      return;
    }
    onSave(r);
  };

  return (
    <div
      className="fixed inset-0 z-[120] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-3xl border border-white/15 bg-zinc-900/95 p-6 shadow-2xl shadow-black/80 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between mb-4">
          <div className="min-w-0 pr-2">
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
              Ваша оценка
            </h3>
            <p className="text-xs text-zinc-400 truncate mt-0.5">{title}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <input
          type="number"
          min="0"
          max="10"
          step="0.1"
          value={ratingInput}
          onChange={(e) => setRatingInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && submit()}
          placeholder="0–10"
          autoFocus
          className="w-full px-4 py-3 mb-4 bg-black/60 border border-white/10 rounded-full text-white text-center text-4xl font-black tabular-nums focus:outline-none focus:ring-2 focus:ring-amber-400/50"
        />

        <div className="grid grid-cols-5 gap-1.5 mb-6">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
            <button
              key={n}
              onClick={() => setRatingInput(String(n))}
              className={`h-9 rounded-full text-xs font-black tabular-nums transition-all ${
                parseFloat(ratingInput) === n
                  ? 'bg-amber-400 text-black shadow-lg shadow-amber-400/30 scale-105'
                  : 'bg-white/5 text-zinc-300 hover:bg-white/15 hover:text-white border border-white/5'
              }`}
            >
              {n}
            </button>
          ))}
        </div>

        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-full bg-white/10 text-zinc-300 text-sm font-semibold hover:bg-white/15 transition-colors"
          >
            Отмена
          </button>
          <button
            onClick={submit}
            className="flex-1 py-2.5 rounded-full bg-gradient-to-r from-amber-400 to-yellow-500 text-black text-sm font-bold shadow-lg shadow-amber-500/25 hover:brightness-105 transition-all"
          >
            Сохранить
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   Кинопоиск-style List Row:
   1. Номер позиции (1, 2, 3...)
   2. Аккуратный постер
   3. Название + Год + Жанр + Страна + Режиссер/Тип
   4. Кинопоиск/TMDB рейтинг (зеленый/серый/красный бейдж)
   5. Личная оценка пользователя
   6. Кнопка смены статуса и меню
───────────────────────────────────────────────────────────── */
function KinopoiskBookmarkRow({
  bookmark,
  index,
  readOnly = false,
}: {
  bookmark: ContentBookmark;
  index: number;
  readOnly?: boolean;
}) {
  const navigate = useNavigate();
  const { setStatus, removeBookmark, updateRating } = useBookmarks();
  const [ratingOpen, setRatingOpen] = useState(false);
  const [statusMenuOpen, setStatusMenuOpen] = useState(false);

  const theme = STATUS_THEME[bookmark.status];
  const Icon = theme.icon;

  const openDetail = () => {
    const route =
      bookmark.contentType === 'movie'
        ? 'movie'
        : bookmark.contentType === 'series'
        ? 'series'
        : bookmark.contentType === 'game'
        ? 'game'
        : null;
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
    toast.success(`Перемещено в «${STATUS_THEME[s].name}»`);
  };

  const handleDelete = () => {
    setStatusMenuOpen(false);
    removeBookmark(bookmark.contentType, bookmark.contentId);
    toast.success('Удалено из закладок');
  };

  // Цвет рейтинга как на Кинопоиске (>= 7.0 зеленый, 5.0-6.9 серый, < 5.0 красный)
  const extRating = bookmark.externalRating ? Number(bookmark.externalRating) : 0;
  const ratingBadgeClass =
    extRating >= 7.0
      ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
      : extRating >= 5.5
      ? 'bg-zinc-800 text-zinc-300 border-zinc-700'
      : 'bg-rose-500/15 text-rose-400 border-rose-500/30';

  return (
    <>
      <div
        onClick={openDetail}
        className="bk-row group relative flex items-center gap-4 sm:gap-6 p-4 sm:p-6 rounded-2xl overflow-hidden min-h-[150px] sm:min-h-[200px] md:min-h-[250px] transition-all duration-300 cursor-pointer"
      >
        {/* Индивидуальный фон карточки — размытый постер конкретного фильма */}
        {bookmark.posterUrl && (
          <div
            className="absolute inset-0 bg-cover bg-center blur-3xl scale-125 opacity-30 group-hover:opacity-45 transition-opacity duration-500 pointer-events-none"
            style={{ backgroundImage: `url(${bookmark.posterUrl})` }}
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-black/75 pointer-events-none" />
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-transparent via-purple-400/70 to-transparent opacity-60 pointer-events-none" />

        {/* Номер в списке (как на Кинопоиске: 1, 2, 3...) */}
        <span className="bk-rank relative z-10 w-8 sm:w-12 text-center text-xl sm:text-3xl text-zinc-400 shrink-0 select-none group-hover:text-purple-300 transition-colors">
          {index + 1}
        </span>

        {/* Компактный качественный постер */}
        <div className="relative z-10 w-24 sm:w-36 md:w-48 aspect-[2/3] shrink-0 rounded-xl overflow-hidden bg-zinc-800 shadow-2xl shadow-black/80 border border-white/15 ring-1 ring-white/10">
          <PosterImage
            src={bookmark.posterUrl}
            alt={bookmark.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        </div>

        {/* Центральная колонка с информацией о фильме/сериале */}
        <div className="relative z-10 flex-1 min-w-0 pr-2">
          {/* Название + Год */}
          <div className="flex flex-wrap items-baseline gap-2">
            <h3 className="bk-benzin text-base sm:text-2xl md:text-3xl text-white group-hover:text-purple-200 transition-colors line-clamp-2 leading-tight">
              {bookmark.title}
            </h3>
            {bookmark.releaseYear && (
              <span className="bk-epic text-sm sm:text-lg text-zinc-300 font-bold tabular-nums shrink-0">
                {bookmark.releaseYear}
              </span>
            )}
          </div>

          {/* Мета-информация: Тип контента · Жанр */}
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mt-2 text-xs sm:text-sm text-zinc-300">
            <span className="bk-benzin px-2 py-0.5 rounded bg-white/10 text-[11px] text-zinc-200">
              {TYPE_LABEL[bookmark.contentType]}
            </span>
            {bookmark.genre && (
              <span className="truncate max-w-[220px] sm:max-w-md text-zinc-400">
                · {bookmark.genre}
              </span>
            )}
          </div>

          {/* Статус-чип с цветной точкой (как в Anixart) */}
          <div className="mt-3 flex items-center gap-2">
            <span
              className={`bk-benzin inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] ${theme.badge} border`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${theme.dot}`} />
              {theme.name}
            </span>
          </div>
        </div>

        {/* Правая колонка: Рейтинги Кинопоиска/TMDB + Личная оценка + Меню */}
        <div className="relative z-10 flex items-center gap-3 sm:gap-6 shrink-0" onClick={(e) => e.stopPropagation()}>
          {/* Внешний рейтинг (TMDB/Кинопоиск) */}
          {extRating > 0 && (
            <div className="hidden sm:flex flex-col items-end">
              <span
                className={`bk-epic text-xl sm:text-2xl font-black tabular-nums px-3 py-1 rounded-full border ${ratingBadgeClass}`}
              >
                {extRating.toFixed(1)}
              </span>
              <span className="bk-eyebrow text-zinc-500 mt-0.5">
                TMDB
              </span>
            </div>
          )}

          {/* Личная оценка пользователя */}
          {readOnly ? (
            bookmark.userRating ? (
              <div className="flex flex-col items-center">
                <div
                  className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-400/15 border border-amber-400/30 text-amber-300"
                  title="Оценка пользователя"
                >
                  <Star className="w-3.5 h-3.5 fill-current" />
                  <span className="bk-epic text-base font-black tabular-nums">
                    {Number(bookmark.userRating).toFixed(1)}
                  </span>
                </div>
                <span className="text-[10px] text-zinc-500 mt-0.5 hidden sm:block">Оценка</span>
              </div>
            ) : null
          ) : (
            <div className="flex flex-col items-center">
              {bookmark.userRating ? (
                <button
                  onClick={() => setRatingOpen(true)}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-400/15 border border-amber-400/30 text-amber-300 hover:bg-amber-400/25 transition-colors"
                  title="Изменить оценку"
                >
                  <Star className="w-3.5 h-3.5 fill-current" />
                  <span className="bk-epic text-base font-black tabular-nums">
                    {Number(bookmark.userRating).toFixed(1)}
                  </span>
                </button>
              ) : (
                <button
                  onClick={() => setRatingOpen(true)}
                  className="flex items-center gap-1 px-2 py-1 rounded-full hover:bg-white/10 text-zinc-500 hover:text-amber-300 transition-colors text-xs font-medium"
                  title="Поставить оценку"
                >
                  <Star className="w-3.5 h-3.5" />
                  <span className="hidden md:inline">Оценить</span>
                </button>
              )}
              <span className="text-[10px] text-zinc-500 mt-0.5 hidden sm:block">Моя оценка</span>
            </div>
          )}

          {/* Действия / Переход */}
          {readOnly ? (
            <button
              onClick={openDetail}
              className="w-9 h-9 rounded-full flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
              title="Открыть карточку"
            >
              <ExternalLink className="w-4 h-4" />
            </button>
          ) : (
            <div className="relative">
              <button
                onClick={() => setStatusMenuOpen(!statusMenuOpen)}
                className="w-11 h-11 rounded-full flex items-center justify-center text-zinc-300 hover:text-white hover:bg-white/15 border border-white/10 transition-colors"
                title="Действия"
              >
                <MoreVertical className="w-4 h-4" />
              </button>

            {statusMenuOpen && (
              <>
                <div
                  className="fixed inset-0 z-30"
                  onClick={() => setStatusMenuOpen(false)}
                />
                <div className="absolute right-0 top-12 z-40 w-56 rounded-2xl border border-white/15 bg-zinc-900/95 backdrop-blur-xl shadow-2xl shadow-black/80 py-2 animate-in zoom-in-95 duration-150">
                  <button
                    onClick={() => {
                      setStatusMenuOpen(false);
                      openDetail();
                    }}
                    className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs text-zinc-200 hover:bg-white/10 transition-colors text-left"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-zinc-400" /> Открыть страницу
                  </button>

                  <button
                    onClick={() => {
                      setStatusMenuOpen(false);
                      setRatingOpen(true);
                    }}
                    className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs text-zinc-200 hover:bg-white/10 transition-colors text-left"
                  >
                    <Star className="w-3.5 h-3.5 text-amber-400" />
                    <span>
                      {bookmark.userRating
                        ? `Изменить оценку (${Number(bookmark.userRating).toFixed(1)})`
                        : 'Поставить оценку'}
                    </span>
                  </button>

                  <div className="my-1.5 h-px bg-white/10" />

                  <div className="px-3.5 py-1 text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                    Переместить в:
                  </div>

                  {STATUS_ORDER.map((s) => {
                    const itemTheme = STATUS_THEME[s];
                    const ItemIcon = itemTheme.icon;
                    return (
                      <button
                        key={s}
                        onClick={() => {
                          setStatusMenuOpen(false);
                          applyStatus(s);
                        }}
                        className="w-full flex items-center gap-2.5 px-3.5 py-1.5 text-xs text-zinc-200 hover:bg-white/10 transition-colors text-left"
                      >
                        <ItemIcon className={`w-3.5 h-3.5 ${itemTheme.text}`} />
                        <span className="flex-1">{itemTheme.name}</span>
                        {bookmark.status === s && (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        )}
                      </button>
                    );
                  })}

                  <div className="my-1.5 h-px bg-white/10" />

                  <button
                    onClick={handleDelete}
                    className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs text-rose-400 hover:bg-rose-500/10 transition-colors text-left"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Удалить из списка
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>

      {ratingOpen && (
        <RatingModal
          title={bookmark.title}
          currentRating={bookmark.userRating}
          onClose={() => setRatingOpen(false)}
          onSave={(r) => {
            updateRating(bookmark.id, r);
            setRatingOpen(false);
            toast.success(`Оценка ${r} сохранена`);
          }}
        />
      )}
    </>
  );
}

/* ─────────────────────────────────────────────────────────────
   Main Bookmarks Page (Кинопоиск & Anixart Layout)
───────────────────────────────────────────────────────────── */
export default function BookmarksNew() {
  const { targetUserId } = useParams<{ targetUserId?: string }>();
  const [searchParams] = useSearchParams();
  const queryUserId = searchParams.get('user') || targetUserId || null;

  const { userId: currentUserId, bookmarks: myBookmarks, loading: contextLoading, isInTop50 } = useBookmarks();

  // Режим просмотра: чужие закладки (публичный просмотр) или свои
  const isOtherUser = Boolean(queryUserId && queryUserId !== currentUserId);
  const effectiveUserId = isOtherUser ? queryUserId : currentUserId;

  const [externalBookmarks, setExternalBookmarks] = useState<ContentBookmark[]>(() => {
    if (queryUserId) {
      try {
        const cached = localStorage.getItem(`rx_public_bookmarks_${queryUserId}`);
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed)) return parsed;
        }
      } catch {}
    }
    return [];
  });

  const [targetProfile, setTargetProfile] = useState<{
    username: string;
    display_name: string | null;
    avatar_url: string | null;
  } | null>(null);

  const [extLoading, setExtLoading] = useState<boolean>(isOtherUser);

  // Загружаем профиль и закладки целевого пользователя при публичном просмотре
  useEffect(() => {
    if (!isOtherUser || !queryUserId) return;
    let active = true;

    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(queryUserId);
    let profileQuery = supabase.from('profiles').select('id, username, display_name, avatar_url');
    if (isUUID) {
      profileQuery = profileQuery.eq('id', queryUserId);
    } else {
      profileQuery = profileQuery.or(`username.ilike.${queryUserId},custom_slug.eq.${queryUserId}`);
    }

    profileQuery.maybeSingle().then(({ data }) => {
      if (!active || !data) {
        if (active) setExtLoading(false);
        return;
      }
      setTargetProfile(data);
      const realUid = data.id;

      // Canonicalize URL to username if available
      if (data.username && typeof window !== 'undefined') {
        const currentPath = window.location.pathname;
        const targetPath = `/bookmarks/${data.username}`;
        if (currentPath !== targetPath && (isUUID || currentPath.includes(realUid))) {
          window.history.replaceState(null, '', targetPath);
        }
      }

      getUserBookmarks(realUid)
        .then((bData) => {
          if (active) {
            setExternalBookmarks(bData);
            try {
              localStorage.setItem(`rx_public_bookmarks_${realUid}`, JSON.stringify(bData));
              localStorage.setItem(`rx_public_bookmarks_${queryUserId}`, JSON.stringify(bData));
            } catch {}
          }
        })
        .catch((err) => console.error('Error fetching target user bookmarks:', err))
        .finally(() => {
          if (active) setExtLoading(false);
        });
    });

    return () => {
      active = false;
    };
  }, [isOtherUser, queryUserId]);

  const bookmarks = isOtherUser ? externalBookmarks : myBookmarks;
  const loading = isOtherUser ? extLoading : contextLoading;

  const [activeTab, setActiveTab] = useState<ContentStatus>('watched');
  const [typeFilter, setTypeFilter] = useState<ContentType | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'rating' | 'title' | 'year'>('date');

  // Подсчёт количества по каждому статусу
  const stats = useMemo(() => {
    const s: Record<ContentStatus, number> = {
      watching: 0,
      planned: 0,
      watched: 0,
      postponed: 0,
      dropped: 0,
      favorite: 0,
    };
    bookmarks.forEach((b) => {
      if (b.status in s) s[b.status]++;
    });
    return s;
  }, [bookmarks]);

  const total = Object.values(stats).reduce((a, b) => a + b, 0);

  // Умный фокус: если в текущей вкладке 0 тайтлов, но есть контент в других статусах,
  // сразу открываем статус с контентом (например, "Просмотрено", где 4 тайтла)
  useEffect(() => {
    if (bookmarks.length > 0 && stats[activeTab] === 0) {
      const best = STATUS_ORDER.find((s) => stats[s] > 0);
      if (best) setActiveTab(best);
    }
  }, [bookmarks.length]);

  // Подсчёт тайтлов по типу в текущей вкладке
  const currentTabTypeCounts = useMemo(() => {
    const inTab = bookmarks.filter((b) => b.status === activeTab);
    const counts: Record<string, number> = { all: inTab.length, movie: 0, series: 0, anime: 0, game: 0 };
    inTab.forEach((b) => {
      if (b.contentType in counts) counts[b.contentType]++;
    });
    return counts;
  }, [bookmarks, activeTab]);

  // Фильтрация и сортировка
  const filtered = useMemo(() => {
    let list = bookmarks.filter((b) => b.status === activeTab);
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
  }, [bookmarks, activeTab, typeFilter, searchQuery, sortBy]);

  const activeTheme = STATUS_THEME[activeTab];

  if (!effectiveUserId && !loading) {
    return (
      <div className="min-h-screen font-sans flex items-center justify-center bg-zinc-950 px-4">
        <div className="text-center max-w-sm w-full p-8 rounded-3xl border border-white/10 bg-black/60 backdrop-blur-2xl shadow-2xl">
          <div className="w-20 h-20 mx-auto mb-6 rounded-3xl bg-gradient-to-tr from-amber-400 to-yellow-500 flex items-center justify-center shadow-xl shadow-amber-500/25">
            <BookmarkIcon className="w-9 h-9 text-black" />
          </div>
          <h2 className="bk-title text-2xl mb-2">Требуется вход</h2>
          <p className="text-zinc-400 text-sm mb-6">
            Войдите в аккаунт, чтобы просматривать личные списки и историю просмотров.
          </p>
          <Link
            to="/auth"
            className="inline-flex items-center justify-center w-full py-3 rounded-full bg-white text-black font-bold text-sm hover:bg-zinc-200 transition-all shadow-lg"
          >
            Войти в аккаунт
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen font-sans bg-zinc-950 text-foreground relative pb-28">
      {/* Деликатная фоновая подсветка текущего статуса */}
      <div
        style={{ backgroundColor: activeTheme.hex }}
        className="absolute -top-40 left-1/2 -translate-x-1/2 w-[40rem] h-[24rem] rounded-full blur-[160px] opacity-[0.14] pointer-events-none transition-all duration-700"
      />

      <div className="relative w-full max-w-[1680px] mx-auto px-4 sm:px-8 pt-8">
        {/* Шапка раздела в стиле Кинопоиска */}
        {isOtherUser ? (
          <div className="bk-hero p-5 sm:p-7 mb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-5">
            <div className="relative flex items-center gap-4 sm:gap-5 min-w-0">
              <Avatar className="w-16 h-16 sm:w-20 sm:h-20 rounded-full border-2 border-emerald-400/40 shrink-0 shadow-xl shadow-black/50">
                <AvatarImage src={targetProfile?.avatar_url || undefined} />
                <AvatarFallback className="bk-benzin bg-emerald-500/15 text-emerald-300 text-2xl">
                  {targetProfile?.username?.[0]?.toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <div className="bk-eyebrow flex items-center gap-2 text-emerald-300 mb-2">
                  <BookmarkIcon className="w-4 h-4" />
                  <span className="truncate">Закладки пользователя @{targetProfile?.username || 'user'}</span>
                </div>
                <h1 className="bk-title truncate">
                  {targetProfile?.display_name || targetProfile?.username || 'Списки пользователя'}
                </h1>
                <div className="bk-script text-xl sm:text-2xl text-emerald-200/70 leading-none mt-1">bookmarks</div>
                <p className="text-xs sm:text-sm font-bold text-zinc-300 mt-3">
                  {total} тайтлов в коллекции · {stats[activeTab]} в категории «{activeTheme.name}»
                </p>
              </div>
            </div>

            <div className="relative flex items-center gap-2.5 shrink-0">
              <Link
                to={targetProfile?.username ? `/${targetProfile.username}` : `/profile/${effectiveUserId}`}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-full bg-white/10 hover:bg-white/20 text-white text-xs font-black transition-all border border-white/15 shadow-lg"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Вернуться в профиль</span>
              </Link>
            </div>
          </div>
        ) : (
          <div className="bk-hero p-5 sm:p-7 mb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-5">
            <div className="relative min-w-0">
              <div className="bk-eyebrow flex items-center gap-2 text-zinc-300 mb-2">
                <Film className="w-4 h-4 text-primary" />
                <span>Личная медиатека</span>
              </div>
              <h1 className="bk-title">Мои списки</h1>
              <div className="bk-script text-2xl sm:text-3xl text-purple-200/70 leading-none mt-1">my collection</div>
              <p className="text-xs sm:text-sm font-bold text-zinc-300 mt-3">
                {total} фильмов и сериалов · {stats[activeTab]} в категории «{activeTheme.name}»
              </p>
            </div>

            <div className="relative flex items-center gap-2.5 shrink-0">
              <ImportBookmarksDialog />
            </div>
          </div>
        )}

        {/* ── Вкладки статусов (как в Anixart: Смотрю, В планах, Просмотрено...) ── */}
        <div className="flex gap-2 overflow-x-auto kp-scroll pb-2 mb-6 -mx-4 px-4 sm:mx-0 sm:px-0">
          {STATUS_ORDER.map((s) => {
            const t = STATUS_THEME[s];
            const active = activeTab === s;
            const Icon = t.icon;
            const count = stats[s];

            return (
              <button
                key={s}
                onClick={() => setActiveTab(s)}
                className={`bk-tab group flex items-center gap-2 px-5 py-3 rounded-full text-sm sm:text-base whitespace-nowrap shrink-0 transition-all duration-200 border ${
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
                  className={`bk-epic text-xs font-black px-2 py-0.5 rounded-full tabular-nums ${
                    active ? 'bg-black/25 text-inherit' : 'bg-white/10 text-zinc-300'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* ── Панель фильтров: Тип контента + Поиск + Сортировка ── */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-6 p-2 rounded-2xl bg-zinc-900/60 border border-white/[0.08]">
          {/* Фильтры типов (Все, Фильмы, Сериалы...) */}
          <div className="flex items-center gap-1 overflow-x-auto kp-scroll p-0.5">
            {TYPE_FILTERS.map((f) => {
              const count = currentTabTypeCounts[f.key] || 0;
              const active = typeFilter === f.key;

              return (
                <button
                  key={f.key}
                  onClick={() => setTypeFilter(f.key)}
                  className={`bk-benzin flex items-center gap-1.5 px-4 py-2 rounded-full text-xs sm:text-sm whitespace-nowrap transition-all ${
                    active
                      ? 'bg-white text-black shadow-sm'
                      : 'text-zinc-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <span>{f.label}</span>
                  <span
                    className={`bk-epic text-[11px] tabular-nums font-black px-1.5 py-0.5 rounded-full ${
                      active ? 'bg-black/20 text-black' : 'bg-white/10 text-zinc-400'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Поиск и Сортировка */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1 sm:w-56">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500" />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Поиск по названию..."
                className="w-full pl-8 pr-7 py-2 bg-black/40 border border-white/10 rounded-full text-xs sm:text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-white/30"
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
              className="h-9 px-3 rounded-full bg-black/40 border border-white/10 text-xs text-zinc-300 font-semibold focus:outline-none cursor-pointer"
            >
              <option value="date" className="bg-zinc-900 text-white">По дате</option>
              <option value="rating" className="bg-zinc-900 text-white">По оценке</option>
              <option value="year" className="bg-zinc-900 text-white">По году</option>
              <option value="title" className="bg-zinc-900 text-white">По названию</option>
            </select>
          </div>
        </div>

        {/* ── Кинопоиск-style Список тайтлов ── */}
        <div className="flex items-end justify-between gap-4 mb-3 px-1">
          <h2 className="bk-benzin text-lg sm:text-2xl text-white">Коллекция</h2>
          <span className="bk-script text-xl sm:text-3xl text-zinc-500 leading-none">collection</span>
        </div>
        {loading ? (
          <div className="flex flex-col gap-2.5">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="h-40 sm:h-56 rounded-2xl bg-zinc-900/40 border border-white/5 animate-pulse"
              />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          /* Пустой список с подсказкой перехода */
          <div className="flex flex-col items-center justify-center py-16 px-4 text-center rounded-3xl border border-dashed border-white/10 bg-zinc-900/20">
            <div
              className={`w-16 h-16 rounded-2xl mb-4 flex items-center justify-center border ${activeTheme.border} ${activeTheme.bgSoft}`}
            >
              {(() => {
                const Icon = activeTheme.icon;
                return <Icon className={`w-8 h-8 ${activeTheme.text}`} />;
              })()}
            </div>

            <h3 className="bk-benzin text-lg sm:text-2xl text-white mb-1.5">
              В списке «{activeTheme.name}» пока пусто
            </h3>
            <p className="text-xs sm:text-sm text-zinc-400 max-w-sm mb-6 leading-relaxed">
              Добавляйте фильмы и сериалы в этот список кликом на значок закладки в каталоге.
            </p>

            {/* Если у пользователя есть тайтлы в другом статусе — предлагаем перейти туда в 1 клик */}
            {total > 0 && stats[activeTab] === 0 ? (
              <div className="flex flex-wrap items-center justify-center gap-3">
                {(() => {
                  const populated = STATUS_ORDER.find((s) => stats[s] > 0);
                  if (!populated) return null;
                  const pt = STATUS_THEME[populated];
                  return (
                    <button
                      onClick={() => setActiveTab(populated)}
                      className={`px-5 py-2.5 rounded-full font-bold text-xs sm:text-sm flex items-center gap-2 ${pt.activeTab}`}
                    >
                      <span>Открыть «{pt.name}» ({stats[populated]})</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  );
                })()}
                <Link
                  to="/movies"
                  className="px-5 py-2.5 rounded-full font-semibold text-xs text-zinc-300 bg-white/5 hover:bg-white/10 border border-white/10 transition-colors"
                >
                  Каталог фильмов
                </Link>
              </div>
            ) : (
              <Link
                to="/movies"
                className="px-5 py-2.5 rounded-full font-bold text-xs sm:text-sm bg-white text-black hover:bg-zinc-200 transition-colors"
              >
                Перейти в каталог
              </Link>
            )}
          </div>
        ) : (
          /* Список тайтлов */
          <div className="flex flex-col gap-4 sm:gap-5">
            {filtered.map((bookmark, index) => (
              <KinopoiskBookmarkRow
                key={bookmark.id}
                bookmark={bookmark}
                index={index}
                readOnly={isOtherUser}
              />
            ))}
          </div>
        )}

        {/* Сноска о синхронизации с Топ-50 */}
        {!isOtherUser && typeof isInTop50 === 'function' && bookmarks.some(
          (b) =>
            (b.contentType === 'movie' && isInTop50('movie', b.contentId)) ||
            (b.contentType === 'series' && isInTop50('anime', b.contentId)) ||
            (b.contentType === 'game' && isInTop50('game', b.contentId))
        ) && (
          <p className="mt-10 text-center text-xs text-zinc-500 flex items-center justify-center gap-1.5">
            <Trophy className="w-3.5 h-3.5 text-amber-400" />
            <span>Часть закладок также синхронизирована с вашим личным Топ-50 профиля</span>
          </p>
        )}
      </div>
    </div>
  );
}
