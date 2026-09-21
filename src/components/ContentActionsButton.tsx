import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Bookmark, BookmarkCheck, Trophy, Star, Check, Trash2, Loader2 } from 'lucide-react';
import { ContentType, ContentStatus, CONTENT_STATUS_CONFIG } from '@/types/anime';
import { useBookmarks } from '@/context/BookmarkContext';
import { toast } from 'sonner';

interface ContentActionsButtonProps {
  contentId: string;
  contentType: ContentType;
  /** media_type used for top_lists: movie | game | anime */
  top50MediaType?: string;
  title: string;
  posterUrl?: string;
  externalRating?: number;
  genre?: string;
  releaseYear?: string;
  synopsis?: string;
  /** poster = small round icon on cards, detail = large pill on detail pages */
  variant?: 'poster' | 'detail';
}

const ALL_STATUSES: ContentStatus[] = ['favorite', 'watching', 'planned', 'watched', 'postponed', 'dropped'];

export default function ContentActionsButton({
  contentId,
  contentType,
  top50MediaType,
  title,
  posterUrl,
  externalRating,
  genre,
  releaseYear,
  synopsis,
  variant = 'poster',
}: ContentActionsButtonProps) {
  const {
    getBookmark,
    isInTop50,
    setStatus,
    removeBookmark,
    toggleTop50,
    userId,
  } = useBookmarks();

  const [open, setOpen] = useState(false);
  const [showRateModal, setShowRateModal] = useState(false);
  const [ratingInput, setRatingInput] = useState('');
  const [pendingStatus, setPendingStatus] = useState<ContentStatus | null>(null);
  const [menuPos, setMenuPos] = useState<{ top?: number; bottom?: number; right: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const bookmark = getBookmark(contentType, contentId);
  const inTop50 = top50MediaType ? isInTop50(top50MediaType, contentId) : false;

  // Меню живёт в портале поверх всего: не режется overflow-hidden карточек
  // и не перекрывается соседними рядами. Позиция от кнопки, закрытие —
  // по клику мимо, скроллу, ресайзу и Escape.
  useEffect(() => {
    if (!open) {
      setMenuPos(null);
      return;
    }
    const place = () => {
      const el = containerRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const right = Math.max(8, window.innerWidth - rect.right);
      const openUp = rect.bottom + 420 > window.innerHeight && rect.top > 420;
      setMenuPos(
        openUp
          ? { bottom: Math.max(8, window.innerHeight - rect.top + 8), right }
          : { top: rect.bottom + 8, right }
      );
    };
    place();
    const close = () => setOpen(false);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('scroll', close, { passive: true });
    window.addEventListener('resize', close);
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('scroll', close);
      window.removeEventListener('resize', close);
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const handleStatus = (status: ContentStatus) => {
    setPendingStatus(status);
    // Instant UI feedback — context applies optimistic update synchronously
    setStatus({
      contentType,
      contentId,
      title,
      posterUrl,
      externalRating,
      genre,
      releaseYear,
      synopsis,
      status,
    });
    toast.success(
      bookmark
        ? `Статус обновлён → «${CONTENT_STATUS_CONFIG[status].label}»`
        : `Добавлено → «${CONTENT_STATUS_CONFIG[status].label}»`
    );
    setTimeout(() => {
      setPendingStatus(null);
      setOpen(false);
    }, 250);
  };

  const handleTop50 = () => {
    toggleTop50(top50MediaType || 'movie', { id: String(contentId), title, posterUrl });
  };

  const handleRemove = () => {
    removeBookmark(contentType, contentId);
    toast.success('Удалено из закладок');
    setOpen(false);
  };

  const submitRating = () => {
    const rating = parseFloat(ratingInput);
    if (isNaN(rating) || rating < 0 || rating > 10) {
      toast.error('Оценка должна быть от 0 до 10');
      return;
    }
    setStatus({
      contentType,
      contentId,
      title,
      posterUrl,
      externalRating,
      genre,
      releaseYear,
      synopsis,
      status: bookmark ? bookmark.status : 'watched',
      userRating: rating,
    });
    toast.success(`Оценка ${rating} сохранена`);
    setShowRateModal(false);
    setRatingInput('');
    setOpen(false);
  };

  return (
    <div
      ref={containerRef}
      className="relative"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
    >
      {/* Single trigger button */}
      {variant === 'detail' ? (
        <button
          onClick={() => setOpen((v) => !v)}
          className={`flex items-center gap-2.5 px-6 py-3 rounded-full font-semibold text-sm whitespace-nowrap backdrop-blur-md transition-all duration-200 hover:scale-[1.04] active:scale-95 border ${
            bookmark
              ? 'bg-gradient-to-r from-purple-600 to-violet-600 border-transparent text-white shadow-lg shadow-purple-500/40'
              : 'bg-white/10 border-white/20 text-white hover:bg-white/20'
          }`}
        >
          {bookmark ? <BookmarkCheck className="w-5 h-5" /> : <Bookmark className="w-5 h-5" />}
          {bookmark ? CONTENT_STATUS_CONFIG[bookmark.status].label : 'В закладки'}
        </button>
      ) : (
        <button
          onClick={() => setOpen((v) => !v)}
          title="Действия"
          className={`p-2 rounded-full backdrop-blur-sm transition-all duration-200 hover:scale-110 active:scale-95 ${
            bookmark || inTop50
              ? 'bg-purple-600/80 hover:bg-purple-500 shadow-lg shadow-purple-500/30'
              : 'bg-black/60 hover:bg-black/80'
          }`}
        >
          {bookmark ? (
            <BookmarkCheck className="w-5 h-5 text-white" />
          ) : (
            <Bookmark className="w-5 h-5 text-white" />
          )}
        </button>
      )}

      {/* Dropdown (портал поверх всего) */}
      {open && menuPos && createPortal(
        <>
          <div className="fixed inset-0 z-[90]" onClick={() => setOpen(false)} />
          <div
            className="fixed w-56 bg-zinc-900/95 backdrop-blur-xl border border-zinc-700/60 rounded-xl shadow-2xl shadow-black/60 z-[91] overflow-hidden act-menu"
            style={{ right: menuPos.right, top: menuPos.top, bottom: menuPos.bottom }}
          >
          {/* Top 50 */}
          <button
            onClick={handleTop50}
            className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm font-medium transition-colors ${
              inTop50 ? 'text-amber-400 bg-amber-500/10 hover:bg-amber-500/20' : 'text-white hover:bg-zinc-800'
            }`}
          >
            <Trophy className="w-4 h-4 shrink-0" />
            <span className="flex-1 text-left">{inTop50 ? 'В Топ-50 ✓' : 'Добавить в Топ-50'}</span>
            {inTop50 && <Check className="w-4 h-4" />}
          </button>

          <div className="border-t border-zinc-800" />

          {/* Rate */}
          <button
            onClick={() => setShowRateModal(true)}
            className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-white hover:bg-zinc-800 transition-colors"
          >
            <Star className="w-4 h-4 text-amber-400 shrink-0" />
            <span className="flex-1 text-left">
              Оценить{bookmark?.userRating ? ` (${bookmark.userRating})` : ''}
            </span>
          </button>

          <div className="border-t border-zinc-800 my-0.5" />

          {/* Statuses */}
          <p className="px-3.5 pt-2 pb-1 text-[10px] uppercase tracking-wider text-zinc-500 font-bold">
            Статус
          </p>
          <div className="max-h-[240px] overflow-y-auto pb-1">
            {ALL_STATUSES.map((s) => {
              const cfg = CONTENT_STATUS_CONFIG[s];
              const isCurrent = bookmark?.status === s;
              return (
                <button
                  key={s}
                  onClick={() => handleStatus(s)}
                  disabled={!!pendingStatus}
                  className={`w-full flex items-center gap-2.5 px-3.5 py-2 text-sm transition-colors ${
                    isCurrent ? `${cfg.bgColor} ${cfg.color} font-semibold` : 'text-zinc-200 hover:bg-zinc-800'
                  }`}
                >
                  <span className="text-base leading-none">{cfg.icon}</span>
                  <span className="flex-1 text-left">{cfg.label}</span>
                  {isCurrent ? (
                    <Check className="w-4 h-4" />
                  ) : pendingStatus === s ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin opacity-60" />
                  ) : null}
                </button>
              );
            })}
          </div>

          {/* Remove */}
          {bookmark && (
            <>
              <div className="border-t border-zinc-800" />
              <button
                onClick={handleRemove}
                className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                Удалить из закладок
              </button>
            </>
          )}
          </div>
        </>,
        document.body
      )}

      {/* Rating modal */}
      {showRateModal && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[100] act-overlay"
          onClick={() => setShowRateModal(false)}
        >
          <div
            className="bg-zinc-900 border border-zinc-700 w-80 rounded-2xl p-6 shadow-2xl act-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-bold text-white mb-1">Оценить</h3>
            <p className="text-xs text-zinc-500 mb-4 truncate">{title}</p>

            <input
              type="number"
              min="0"
              max="10"
              step="0.1"
              value={ratingInput}
              onChange={(e) => setRatingInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && submitRating()}
              placeholder="0–10"
              autoFocus
              className="w-full px-4 py-3 mb-4 bg-zinc-800 border border-zinc-700 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/50 text-center text-3xl font-bold"
            />

            <div className="flex justify-center gap-1.5 mb-5">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                <button
                  key={n}
                  onClick={() => setRatingInput(String(n))}
                  className={`w-7 h-7 rounded-lg text-[11px] font-bold transition-all ${
                    parseFloat(ratingInput) === n
                      ? 'bg-purple-500 text-white scale-110'
                      : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-white'
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setShowRateModal(false)}
                className="flex-1 px-4 py-2.5 bg-zinc-800 text-white rounded-xl hover:bg-zinc-700 text-sm font-medium transition-colors"
              >
                Отмена
              </button>
              <button
                onClick={submitRating}
                disabled={!userId}
                className="flex-1 px-4 py-2.5 bg-gradient-to-r from-purple-600 to-violet-600 text-white rounded-xl hover:from-purple-700 hover:to-violet-700 text-sm font-medium shadow-lg shadow-purple-500/25 transition-all disabled:opacity-50"
              >
                Сохранить
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .act-menu { animation: act-pop .18s cubic-bezier(.16,1,.3,1) both; transform-origin: top right; }
        .act-overlay { animation: act-fade .15s ease-out both; }
        .act-modal { animation: act-pop .25s cubic-bezier(.16,1,.3,1) both; }
        @keyframes act-pop { from { opacity: 0; transform: scale(.92) translateY(-4px); } to { opacity: 1; transform: scale(1) translateY(0); } }
        @keyframes act-fade { from { opacity: 0; } to { opacity: 1; } }
      `}</style>
    </div>
  );
}
