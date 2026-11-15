import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Bookmark, BookmarkCheck, Trash2, Loader2, ChevronDown } from 'lucide-react';
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
    // При ресайзе (клавиатура на мобиле, поворот экрана) не закрываем,
    // а пересчитываем позицию меню
    window.addEventListener('scroll', close, { passive: true });
    window.addEventListener('resize', place);
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('scroll', close);
      window.removeEventListener('resize', place);
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
          aria-expanded={open}
          data-status={bookmark?.status}
          className={`gpb-btn relative flex items-center h-14 px-5 gap-2 rounded-full whitespace-nowrap md:h-[5.375rem] md:px-[2.375rem] md:gap-[1.125rem] ${
            bookmark ? 'gpb-has-status' : ''
          } ${open ? 'gpb-open' : ''}`}
        >
          {/* Градиентная точка статуса (видна только с закладкой) */}
          <span className="gpb-dot" aria-hidden="true" />
          <span className="gpb-title">
            {bookmark ? CONTENT_STATUS_CONFIG[bookmark.status].label : 'В закладки'}
          </span>
          {/* Разделитель */}
          <span className="gpb-divider" aria-hidden="true" />
          {/* Чип рейтинга тайтла */}
          {externalRating != null && (
            <span className="gpb-score-chip" title="Рейтинг тайтла">
              <span className="gpb-score">{Number(externalRating).toFixed(1)}</span>
            </span>
          )}
          {/* Стрелка */}
          <span className="gpb-arrow" aria-hidden="true">
            <ChevronDown />
          </span>
        </button>
      ) : (
        <button
          onClick={() => setOpen((v) => !v)}
          title="Действия"
          className={`p-2 rounded-full border border-white/10 backdrop-blur-md transition-all duration-200 hover:scale-110 active:scale-95 ${
            bookmark || inTop50
              ? 'bg-cyan-600/80 hover:bg-cyan-500 shadow-lg shadow-cyan-500/30'
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
            className="gpb-menu fixed z-[91]"
            style={{ right: menuPos.right, top: menuPos.top, bottom: menuPos.bottom }}
          >
            {/* Каскад 1: быстрые карточки */}
            <div className="gpb-stagger" style={{ '--stagger': 1 } as React.CSSProperties}>
              <div className="gpb-quick-grid">
                <button onClick={handleTop50} className={`gpb-tile ${inTop50 ? 'gpb-tile--active' : ''}`}>
                  <span className="gpb-tile-info">
                    <span className="gpb-tile-title">Топ-50</span>
                    <span className="gpb-tile-sub">{inTop50 ? 'В Топ-50' : 'Добавить'}</span>
                  </span>
                  <span className="gpb-tile-dot" />
                </button>
                <button onClick={() => setShowRateModal(true)} className="gpb-tile">
                  <span className="gpb-tile-info">
                    <span className="gpb-tile-title">Оценить</span>
                    <span className="gpb-tile-sub">
                      {bookmark?.userRating ? `Рейтинг ${bookmark.userRating}` : 'Ещё нет'}
                    </span>
                  </span>
                  <span className="gpb-tile-arrow">→</span>
                </button>
              </div>
            </div>

            {/* Каскад 2: разделитель «Статус» */}
            <div className="gpb-stagger" style={{ '--stagger': 2 } as React.CSSProperties}>
              <div className="gpb-menu-divider"><span>Статус</span></div>
            </div>

            {/* Каскад 3+: статусы — пилюли с разным объёмом */}
            <div className="gpb-status-stack">
              {ALL_STATUSES.map((s, i) => {
                const cfg = CONTENT_STATUS_CONFIG[s];
                const isCurrent = bookmark?.status === s;
                return (
                  <div className="gpb-stagger" key={s} style={{ '--stagger': 3 + i } as React.CSSProperties}>
                    <button
                      onClick={() => handleStatus(s)}
                      disabled={!!pendingStatus}
                      className={`gpb-pill gpb-pill--${s} ${isCurrent ? 'gpb-pill--selected' : ''}`}
                    >
                      <span className="gpb-pill-dot" />
                      <span className="gpb-pill-name">{cfg.label}</span>
                      {pendingStatus === s && <Loader2 className="w-3.5 h-3.5 animate-spin opacity-70" />}
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Удалить из закладок */}
            {bookmark && (
              <div className="gpb-stagger" style={{ '--stagger': 9 } as React.CSSProperties}>
                <button onClick={handleRemove} className="gpb-remove">
                  <Trash2 className="w-3.5 h-3.5" />
                  Удалить из закладок
                </button>
              </div>
            )}
          </div>
        </>,
        document.body
      )}

      {/* Rating modal — стеклянная панель из макета */}
      {showRateModal && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[100] gpb-rate-overlay"
          onClick={() => setShowRateModal(false)}
        >
          <div className="gpb-rate" onClick={(e) => e.stopPropagation()}>
            <div className="gpb-rate__header">
              <span className="gpb-rate__spacer" />
              <div className="gpb-rate__score-box">
                <span className="gpb-rate__big">
                  {ratingInput !== '' ? ratingInput : bookmark?.userRating ?? '—'}
                </span>
                <span className="gpb-rate__phrase">
                  {(() => {
                    const v = parseFloat(ratingInput !== '' ? ratingInput : String(bookmark?.userRating ?? ''));
                    if (isNaN(v)) return 'Поставь оценку';
                    return v <= 2 ? 'Плохо' : v <= 4 ? 'Так себе' : v <= 6 ? 'Нормально' : v <= 8 ? 'Хорошо' : v < 10 ? 'Отлично' : 'Шедевр';
                  })()}
                </span>
              </div>
              <button className="gpb-rate__icon-btn" onClick={() => setShowRateModal(false)} title="Закрыть">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <div className="gpb-rate__grid">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                <button
                  key={n}
                  onClick={() => setRatingInput(String(n))}
                  style={{ '--pad-index': n } as React.CSSProperties}
                  className={`gpb-rate__pad ${parseFloat(ratingInput) === n ? 'gpb-rate__pad--active' : ''}`}
                >
                  {n}
                </button>
              ))}
            </div>

            <div className="gpb-rate__row">
              <input
                type="number"
                min="0"
                max="10"
                step="0.1"
                value={ratingInput}
                onChange={(e) => setRatingInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && submitRating()}
                placeholder="7.5"
                className="gpb-rate__input"
              />
              <button onClick={submitRating} disabled={!userId} className="gpb-rate__save">
                Сохранить
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        /* ── Стеклянное меню (из макета button/) ── */
        .gpb-menu {
          width: min(320px, calc(100vw - 20px));
          border-radius: 24px;
          border: 1.5px solid rgba(255, 255, 255, 0.48);
          background: linear-gradient(175deg, rgba(255, 255, 255, 0.26) 0%, rgba(24, 30, 35, 0.96) 24%, rgba(14, 18, 22, 0.98) 100%);
          backdrop-filter: blur(40px) saturate(160%);
          -webkit-backdrop-filter: blur(40px) saturate(160%);
          box-shadow:
            0 36px 92px -10px rgba(0, 0, 0, 0.78),
            0 10px 28px rgba(0, 0, 0, 0.38),
            inset 0 1.5px 2px rgba(255, 255, 255, 0.55);
          padding: 12px;
          display: flex;
          flex-direction: column;
          gap: 8px;
          animation: gpb-menu-in .42s cubic-bezier(.34,1.35,.64,1) both;
          transform-origin: top right;
        }
        @media (min-width: 768px) {
          .gpb-menu { width: 360px; border-radius: 28px; padding: 14px; }
        }
        @keyframes gpb-menu-in {
          from { opacity: 0; transform: scale(.95) translateY(-12px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }

        /* Каскадное появление частей */
        .gpb-stagger {
          width: 100%;
          display: flex;
          justify-content: center;
          align-items: center;
          animation: gpb-item-in .44s cubic-bezier(.34,1.35,.64,1) both;
          animation-delay: calc(var(--stagger) * 36ms + 20ms);
        }
        @keyframes gpb-item-in {
          from { opacity: 0; transform: translateY(16px) scale(.96); }
          to { opacity: 1; transform: none; }
        }

        /* Быстрые карточки */
        .gpb-quick-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; width: 100%; }
        .gpb-tile {
          display: flex; align-items: center; justify-content: space-between;
          padding: 11px 14px; border-radius: 16px;
          border: 1.5px solid rgba(255, 255, 255, 0.15);
          background: rgba(255, 255, 255, 0.08);
          color: #fff; cursor: pointer; outline: none; text-align: left; user-select: none;
          transition: background .25s cubic-bezier(.16,1,.3,1), border-color .25s cubic-bezier(.16,1,.3,1), transform .22s cubic-bezier(.34,1.35,.64,1);
        }
        .gpb-tile:hover { background: rgba(255, 255, 255, 0.2); border-color: rgba(255, 255, 255, 0.4); transform: translateY(-2px); }
        .gpb-tile:active { transform: scale(0.97); }
        .gpb-tile--active { background: rgba(255, 255, 255, 0.26); border-color: rgba(255, 255, 255, 0.6); }
        .gpb-tile-info { display: flex; flex-direction: column; gap: 3px; min-width: 0; }
        .gpb-tile-title { font-family: "Benzin-Bold", sans-serif; font-weight: 700; font-size: 13px; letter-spacing: .02em; color: #fff; }
        .gpb-tile-sub { font-size: 12px; color: rgba(255, 255, 255, 0.68); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .gpb-tile-dot { width: 8px; height: 8px; border-radius: 50%; background: rgba(255, 255, 255, 0.3); flex-shrink: 0; transition: all .3s cubic-bezier(.16,1,.3,1); }
        .gpb-tile--active .gpb-tile-dot { background: #34d399; box-shadow: 0 0 10px #34d399; transform: scale(1.3); }
        .gpb-tile-arrow { font-size: 15px; font-weight: 800; color: rgba(255, 255, 255, 0.6); flex-shrink: 0; transition: transform .25s cubic-bezier(.34,1.35,.64,1), color .2s ease; }
        .gpb-tile:hover .gpb-tile-arrow { transform: translateX(4px); color: #fff; }

        /* Разделитель «Статус» */
        .gpb-menu-divider { display: flex; align-items: center; gap: 12px; padding: 4px 6px; width: 100%; }
        .gpb-menu-divider::before, .gpb-menu-divider::after { content: ''; flex: 1; height: 1px; background: rgba(255, 255, 255, 0.15); }
        .gpb-menu-divider span { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: .08em; color: rgba(255, 255, 255, 0.42); }

        /* Статусы: каскад пилюль с разным объёмом */
        .gpb-status-stack { display: flex; flex-direction: column; gap: 8px; align-items: center; width: 100%; }
        .gpb-pill {
          display: flex; align-items: center; justify-content: center;
          width: var(--w); height: var(--h); gap: var(--g); padding: 0 var(--px);
          border-radius: 9999px; border: var(--bw) solid var(--bc);
          background: var(--bg); box-shadow: var(--sh); opacity: var(--op, 1);
          color: #fff; cursor: pointer; outline: none; user-select: none; position: relative;
          transition: transform .28s cubic-bezier(.34,1.35,.64,1), background .25s cubic-bezier(.16,1,.3,1), box-shadow .28s cubic-bezier(.16,1,.3,1), border-color .25s ease, opacity .25s ease;
        }
        .gpb-pill:hover:not(:disabled), .gpb-pill:focus-visible {
          background: rgba(255, 255, 255, 0.24) !important;
          border-color: rgba(255, 255, 255, 0.85) !important;
          transform: translateY(-3px) scale(1.05);
          opacity: 1 !important;
        }
        .gpb-pill:active:not(:disabled) { transform: translateY(1px) scale(0.97); }
        .gpb-pill:disabled { opacity: .6; cursor: default; }
        .gpb-pill--selected {
          background: rgba(255, 255, 255, 0.3) !important;
          border-color: rgba(255, 255, 255, 0.95) !important;
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.5), inset 0 2px 2px rgba(255, 255, 255, 0.8) !important;
          opacity: 1 !important;
        }
        .gpb-pill-name {
          font-family: "Benzin-Bold", sans-serif; font-size: var(--f); font-weight: var(--fw);
          color: var(--tc, #fff); line-height: 1; letter-spacing: var(--ls, 0);
          text-shadow: 0 2px 8px rgba(0, 0, 0, 0.5); white-space: nowrap;
        }
        .gpb-pill-dot {
          width: var(--d); height: var(--d); border-radius: 50%; flex-shrink: 0;
          background: var(--dc); box-shadow: var(--dsh);
          transition: transform .25s cubic-bezier(.34,1.35,.64,1), box-shadow .25s ease;
        }
        .gpb-pill:hover .gpb-pill-dot, .gpb-pill--selected .gpb-pill-dot { transform: scale(1.4); }

        /* Мобильные объёмы */
        .gpb-pill--favorite { --w: 78%; --h: 32px; --g: 7px; --px: 14px; --bg: rgba(255,255,255,.11); --bw: 1px; --bc: rgba(255,255,255,.35); --sh: 0 5px 13px -2px rgba(0,0,0,.3); --f: 12px; --fw: 700; --d: 6px; --dc: #ffd000; --dsh: 0 0 9px #ffd000; }
        .gpb-pill--watching { --w: 100%; --h: 46px; --g: 10px; --px: 20px; --bg: radial-gradient(ellipse at 50% 20%, rgba(255,255,255,.32) 0%, rgba(255,255,255,.16) 100%); --bw: 1.5px; --bc: rgba(255,255,255,.75); --sh: 0 13px 29px -4px rgba(0,0,0,.52), inset 0 2px 3px rgba(255,255,255,.9); --f: 18px; --fw: 900; --ls: .03em; --d: 9px; --dc: #00e5ff; --dsh: 0 0 16px #00e5ff, 0 0 4px #ffffff; }
        .gpb-pill--planned  { --w: 93%; --h: 40px; --g: 9px;  --px: 18px; --bg: radial-gradient(ellipse at 50% 25%, rgba(255,255,255,.24) 0%, rgba(255,255,255,.13) 100%); --bw: 1.5px; --bc: rgba(255,255,255,.55); --sh: 0 10px 22px -3px rgba(0,0,0,.42), inset 0 1.5px 2px rgba(255,255,255,.75); --f: 15px; --fw: 800; --d: 8px; --dc: #ff9900; --dsh: 0 0 12px #ff9900; }
        .gpb-pill--watched  { --w: 86%; --h: 36px; --g: 8px;  --px: 16px; --bg: rgba(255,255,255,.15); --bw: 1.5px; --bc: rgba(255,255,255,.42); --sh: 0 6px 18px -2px rgba(0,0,0,.35), inset 0 1px 1.5px rgba(255,255,255,.6); --f: 13.5px; --fw: 700; --d: 7px; --dc: #10b981; --dsh: 0 0 10px #10b981; }
        .gpb-pill--postponed{ --w: 68%; --h: 28px; --g: 6px;  --px: 13px; --bg: rgba(255,255,255,.07); --bw: 1px; --bc: rgba(255,255,255,.24); --sh: 0 3px 10px rgba(0,0,0,.25); --op: .85; --f: 10.5px; --fw: 700; --tc: rgba(255,255,255,.88); --d: 5.5px; --dc: #818cf8; --dsh: 0 0 8px rgba(129,140,248,.65); }
        .gpb-pill--dropped  { --w: 58%; --h: 24px; --g: 6px;  --px: 11px; --bg: rgba(255,255,255,.05); --bw: 1px; --bc: rgba(255,255,255,.16); --sh: 0 2px 8px rgba(0,0,0,.2); --op: .65; --f: 9.5px; --fw: 600; --tc: rgba(255,255,255,.75); --d: 4.5px; --dc: #ff416c; --dsh: 0 0 6px #ff416c; }

        /* Десктоп: точные размеры макета */
        @media (min-width: 768px) {
          .gpb-pill--favorite { --h: 40px; --g: 9px; --px: 18px; --f: 15px; --d: 7.5px; }
          .gpb-pill--watching { --h: 58px; --g: 12px; --px: 26px; --f: 23px; --d: 11px; }
          .gpb-pill--planned  { --h: 50px; --g: 11px; --px: 22px; --f: 19px; --d: 9.5px; }
          .gpb-pill--watched  { --h: 45px; --g: 10px; --px: 20px; --f: 17px; --d: 8.5px; }
          .gpb-pill--postponed{ --h: 35px; --g: 8px; --px: 16px; --f: 13px; --d: 6.5px; }
          .gpb-pill--dropped  { --h: 30px; --g: 7px; --px: 14px; --f: 11.5px; --d: 5.5px; }
        }

        /* Удалить из закладок */
        .gpb-remove {
          display: flex; align-items: center; justify-content: center; gap: 8px;
          padding: 9px 16px; border-radius: 9999px;
          font-size: 12px; font-weight: 600; color: rgba(255, 130, 140, 0.85);
          background: rgba(255, 65, 108, 0.08); border: 1px solid rgba(255, 65, 108, 0.2);
          cursor: pointer; transition: background .2s ease, border-color .2s ease, color .2s ease;
        }
        .gpb-remove:hover { background: rgba(255, 65, 108, 0.16); border-color: rgba(255, 65, 108, 0.45); color: #ff8fa0; }

        /* ── Панель оценки (из макета button/) ── */
        .gpb-rate-overlay { animation: gpb-fade .15s ease-out both; }
        @keyframes gpb-fade { from { opacity: 0; } to { opacity: 1; } }
        .gpb-rate {
          width: 480px; max-width: calc(100vw - 28px);
          border-radius: 34px;
          background: linear-gradient(175deg, rgba(255, 255, 255, 0.36) 0%, rgba(22, 28, 33, 0.97) 22%, rgba(12, 16, 20, 0.99) 100%);
          border: 1.5px solid rgba(255, 255, 255, 0.75);
          box-shadow:
            0 44px 100px -12px rgba(0, 0, 0, 0.88),
            0 14px 36px rgba(0, 0, 0, 0.45),
            inset 0 2px 3px rgba(255, 255, 255, 0.75);
          backdrop-filter: blur(48px) saturate(180%);
          -webkit-backdrop-filter: blur(48px) saturate(180%);
          padding: 24px 26px 22px;
          display: flex; flex-direction: column; gap: 16px;
          animation: gpb-rate-in .44s cubic-bezier(.34,1.35,.64,1) both;
        }
        @keyframes gpb-rate-in {
          from { opacity: 0; transform: scale(.84) translateY(12px); }
          to { opacity: 1; transform: none; }
        }
        .gpb-rate__header { display: flex; align-items: center; justify-content: space-between; }
        .gpb-rate__spacer { width: 42px; flex-shrink: 0; }
        .gpb-rate__score-box { display: flex; flex-direction: column; align-items: center; gap: 3px; }
        .gpb-rate__big {
          font-family: "Benzin-Bold", sans-serif; font-size: 52px; font-weight: 900;
          color: #fff; line-height: 1; letter-spacing: -.02em; text-shadow: 0 4px 18px rgba(0, 0, 0, 0.6);
        }
        .gpb-rate__phrase { font-size: 14px; font-weight: 700; color: #ffd000; letter-spacing: .04em; text-shadow: 0 0 12px currentColor; }
        .gpb-rate__icon-btn {
          width: 42px; height: 42px; border-radius: 50%; flex-shrink: 0;
          border: 1.5px solid rgba(255, 255, 255, 0.28); background: rgba(255, 255, 255, 0.12); color: #fff;
          display: flex; align-items: center; justify-content: center; cursor: pointer;
          transition: transform .25s cubic-bezier(.34,1.35,.64,1), background .2s ease, border-color .2s ease;
        }
        .gpb-rate__icon-btn svg { width: 20px; height: 20px; }
        .gpb-rate__icon-btn:hover { background: rgba(255, 255, 255, 0.3); border-color: rgba(255, 255, 255, 0.85); transform: scale(1.12); }
        .gpb-rate__icon-btn:active { transform: scale(0.94); }
        .gpb-rate__grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 10px; }
        .gpb-rate__pad {
          height: 54px; border-radius: 16px;
          background: rgba(255, 255, 255, 0.09); border: 1.5px solid rgba(255, 255, 255, 0.2);
          color: #fff; font-family: "Benzin-Bold", sans-serif; font-size: 22px; font-weight: 800;
          cursor: pointer; outline: none; user-select: none;
          display: flex; align-items: center; justify-content: center; position: relative;
          opacity: 0; transform: scale(.82) translateY(12px);
          animation: gpb-pad-in .4s cubic-bezier(.34,1.35,.64,1) both;
          animation-delay: calc(var(--pad-index) * 20ms + 40ms);
          transition: background .2s ease, border-color .2s ease, box-shadow .2s ease, transform .2s ease;
        }
        @keyframes gpb-pad-in { to { opacity: 1; transform: scale(1) translateY(0); } }
        .gpb-rate__pad:hover {
          background: rgba(255, 255, 255, 0.35); border-color: rgba(255, 255, 255, 0.95);
          transform: translateY(-5px) scale(1.15) !important;
          box-shadow: 0 12px 28px rgba(0, 0, 0, 0.55), 0 0 20px rgba(255, 255, 255, 0.45);
          z-index: 5;
        }
        .gpb-rate__pad:active { transform: scale(0.94) !important; }
        .gpb-rate__pad--active {
          background: #ffffff; color: #101418; border-color: #ffffff;
          box-shadow: 0 0 24px rgba(255, 255, 255, 0.95);
        }
        .gpb-rate__row { display: flex; gap: 10px; }
        .gpb-rate__input {
          flex: 1; min-width: 0; padding: 10px 14px; border-radius: 14px;
          background: rgba(255, 255, 255, 0.08); border: 1.5px solid rgba(255, 255, 255, 0.2);
          color: #fff; font-weight: 700; text-align: center; outline: none;
        }
        .gpb-rate__input:focus { border-color: rgba(255, 255, 255, 0.6); background: rgba(255, 255, 255, 0.14); }
        .gpb-rate__save {
          padding: 10px 22px; border-radius: 14px; flex-shrink: 0;
          border: 1.5px solid rgba(255, 255, 255, 0.4); background: rgba(255, 255, 255, 0.2);
          color: #fff; font-family: "Benzin-Bold", sans-serif; font-size: 14px; cursor: pointer;
          transition: background .2s ease, transform .2s cubic-bezier(.34,1.35,.64,1);
        }
        .gpb-rate__save:hover:not(:disabled) { background: rgba(255, 255, 255, 0.32); transform: translateY(-1px); }
        .gpb-rate__save:disabled { opacity: .5; cursor: not-allowed; }

        /* ── Glass pill bookmark button (из макета button/) ── */
        .gpb-btn {
          border: 1.5px solid rgba(255, 255, 255, 0.72);
          background: radial-gradient(
            ellipse at 50% 12%,
            rgba(255, 255, 255, 0.44) 0%,
            rgba(255, 255, 255, 0.15) 65%,
            rgba(0, 0, 0, 0.06) 100%
          );
          backdrop-filter: blur(32px) saturate(150%);
          -webkit-backdrop-filter: blur(32px) saturate(150%);
          box-shadow:
            inset 0 2px 2px rgba(255, 255, 255, 0.95),
            inset 0 -2.5px 6px rgba(0, 0, 0, 0.22),
            0 24px 54px -10px rgba(0, 0, 0, 0.48),
            0 4px 14px rgba(0, 0, 0, 0.2);
          color: #fff;
          cursor: pointer;
          outline: none;
          user-select: none;
          transition:
            transform 0.35s cubic-bezier(0.16, 1, 0.3, 1),
            box-shadow 0.35s cubic-bezier(0.16, 1, 0.3, 1),
            border-color 0.3s ease;
        }
        .gpb-btn:hover {
          transform: translateY(-2px);
          border-color: rgba(255, 255, 255, 0.98);
          box-shadow:
            inset 0 2.5px 3.5px rgba(255, 255, 255, 1),
            inset 0 -3px 7px rgba(0, 0, 0, 0.25),
            0 30px 64px -10px rgba(0, 0, 0, 0.55),
            0 8px 20px rgba(0, 0, 0, 0.26);
        }
        .gpb-btn:active {
          transform: translateY(1px) scale(0.975);
          box-shadow:
            inset 0 1px 2px rgba(255, 255, 255, 0.6),
            inset 0 2px 6px rgba(0, 0, 0, 0.25),
            0 10px 24px rgba(0, 0, 0, 0.32);
        }

        /* Точка статуса */
        .gpb-dot {
          width: 0.5rem;
          height: 0.5rem;
          border-radius: 9999px;
          background: #fff;
          flex-shrink: 0;
          opacity: 0;
          transform: scale(0);
          transition: opacity 0.3s ease, transform 0.35s cubic-bezier(0.34, 1.35, 0.64, 1);
        }
        .gpb-has-status .gpb-dot {
          opacity: 1;
          transform: scale(1);
        }
        .gpb-btn[data-status="favorite"] .gpb-dot { background: #ffd000; box-shadow: 0 0 10px #ffd000; }
        .gpb-btn[data-status="watching"] .gpb-dot { background: #00e5ff; box-shadow: 0 0 10px #00e5ff; }
        .gpb-btn[data-status="planned"]  .gpb-dot { background: #ff9900; box-shadow: 0 0 10px #ff9900; }
        .gpb-btn[data-status="watched"]  .gpb-dot { background: #10b981; box-shadow: 0 0 10px #10b981; }
        .gpb-btn[data-status="postponed"] .gpb-dot { background: #818cf8; box-shadow: 0 0 10px #818cf8; }
        .gpb-btn[data-status="dropped"]  .gpb-dot { background: #ff416c; box-shadow: 0 0 10px #ff416c; }

        /* Заголовок: Benzin-Bold */
        .gpb-title {
          font-family: "Benzin-Bold", sans-serif;
          font-weight: 700;
          font-size: 0.9375rem;
          letter-spacing: 0.02em;
          color: #ffffff;
          text-shadow: 0 2px 8px rgba(0, 0, 0, 0.4);
          white-space: nowrap;
          line-height: 1;
        }

        /* Разделитель */
        .gpb-divider {
          width: 1.5px;
          height: 1.375rem;
          flex-shrink: 0;
          background: linear-gradient(180deg, transparent, rgba(255, 255, 255, 0.45), transparent);
        }

        /* Чип рейтинга */
        .gpb-score-chip {
          display: inline-flex;
          align-items: center;
          padding: 0.25rem 0.6rem;
          border-radius: 9999px;
          background: rgba(255, 255, 255, 0.18);
          border: 1px solid rgba(255, 255, 255, 0.35);
          box-shadow: inset 0 1px 1px rgba(255, 255, 255, 0.45);
          transition: background 0.25s ease, transform 0.25s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .gpb-btn:hover .gpb-score-chip {
          background: rgba(255, 255, 255, 0.28);
        }
        .gpb-score {
          font-family: "Benzin-Bold", sans-serif;
          font-weight: 700;
          font-size: 0.875rem;
          letter-spacing: 0.01em;
          color: #ffffff;
          line-height: 1;
        }

        /* Стрелка */
        .gpb-arrow {
          display: flex;
          align-items: center;
          justify-content: center;
          color: rgba(255, 255, 255, 0.9);
          transition: transform 0.45s cubic-bezier(0.34, 1.35, 0.64, 1);
        }
        .gpb-arrow svg {
          width: 14px;
          height: 14px;
        }
        .gpb-open .gpb-arrow {
          transform: rotate(180deg) scale(1.15);
        }

        /* Десктоп: точные размеры макета */
        @media (min-width: 768px) {
          .gpb-title { font-size: 1.3125rem; }
          .gpb-divider { height: 2.375rem; }
          .gpb-score-chip { padding: 0.375rem 0.875rem; }
          .gpb-score { font-size: 1.1875rem; }
          .gpb-arrow svg { width: 19px; height: 19px; }
        }

        @media (prefers-reduced-motion: reduce) {
          .gpb-stagger, .gpb-menu, .gpb-rate, .gpb-rate__pad, .gpb-rate-overlay { animation-duration: .01s; }
          .gpb-btn, .gpb-arrow, .gpb-dot, .gpb-score-chip, .gpb-tile, .gpb-pill, .gpb-rate__icon-btn { transition: none; }
        }
      `}</style>
    </div>
  );
}
