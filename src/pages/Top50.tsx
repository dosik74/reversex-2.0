import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ChevronLeft,
  ChevronRight,
  Trash2,
  Search,
  Loader2,
  ArrowUp,
  ArrowDown,
  X,
} from 'lucide-react';
import supabase from '@/lib/supabase';
import { useAppContext } from '@/context/AppContext';
import { useBookmarks } from '@/context/BookmarkContext';
import { loadUserRatedItems } from '@/services/ratedService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import '@/styles/top50.css';

export type Top50CategoryKey = 'movie' | 'series' | 'anime' | 'dorama' | 'game' | 'music';
type SortMode = 'rank_asc' | 'rating_desc' | 'date_desc' | 'title_asc';

interface CategoryDef {
  key: Top50CategoryKey;
  label: string;
  accent: string;
  badgeCls: string;
}

const CATEGORIES: CategoryDef[] = [
  {
    key: 'movie',
    label: 'Кино',
    accent: 'from-amber-400 to-orange-500',
    badgeCls: 'border-amber-400/40 bg-amber-400/15 text-amber-300',
  },
  {
    key: 'series',
    label: 'Сериалы',
    accent: 'from-cyan-400 to-blue-500',
    badgeCls: 'border-cyan-400/40 bg-cyan-400/15 text-cyan-300',
  },
  {
    key: 'anime',
    label: 'Аниме',
    accent: 'from-pink-400 to-rose-500',
    badgeCls: 'border-pink-400/40 bg-pink-400/15 text-pink-300',
  },
  {
    key: 'dorama',
    label: 'Дорамы',
    accent: 'from-violet-400 to-purple-500',
    badgeCls: 'border-violet-400/40 bg-violet-400/15 text-violet-300',
  },
  {
    key: 'game',
    label: 'Игры',
    accent: 'from-emerald-400 to-teal-500',
    badgeCls: 'border-emerald-400/40 bg-emerald-400/15 text-emerald-300',
  },
  {
    key: 'music',
    label: 'Музыка',
    accent: 'from-fuchsia-400 to-pink-500',
    badgeCls: 'border-fuchsia-400/40 bg-fuchsia-400/15 text-fuchsia-300',
  },
];

interface Top50Entry {
  uid: string;
  itemId: string;
  category: Top50CategoryKey;
  rank: number;
  title: string;
  posterUrl: string | null;
  userRating?: number;
  externalRating?: number;
  year?: string;
  createdAt: string;
  dbRowId?: string;
}

interface SearchCandidate {
  id: string;
  title: string;
  posterUrl: string | null;
  year?: string;
  subtitle?: string;
}

const TMDB_TOKEN =
  'eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiJhOTgxYjNiYTBiMzQ1ZjU3OGZiOTE3ZWU3NGE5MGJmMyIsIm5iZiI6MTc1MjUyMjUxMy40MjcsInN1YiI6IjY4NzU1ZjExNzUzYjVjNTYwM2Y5MWJkMyIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.Trm6p4NqL6VPKlvUkGkRMKVjeH2KAklTAllVbnolV8w';
const RAWG_API_KEY = 'c33c648c0d8f45c494af8da025d7b862';

function getDetailRoute(category: Top50CategoryKey, itemId: string): string | null {
  if (category === 'movie') return `/movie/${itemId}`;
  if (category === 'series' || category === 'anime' || category === 'dorama') return `/series/${itemId}`;
  if (category === 'game') return `/game/${itemId}`;
  return null;
}

function getDbMediaType(category: Top50CategoryKey): 'movie' | 'anime' | 'game' | null {
  if (category === 'movie') return 'movie';
  if (category === 'game') return 'game';
  if (category === 'series' || category === 'anime') return 'anime';
  return null;
}

function isAnimeMeta(genre?: string, contentType?: string, title?: string): boolean {
  if (contentType === 'anime') return true;
  const text = `${genre || ''} ${title || ''}`.toLowerCase();
  return /аниме|anime|мультфильм|animation/.test(text);
}

/** Серый плейсхолдер постера при отсутствии или загрузке изображения */
function PosterWithPlaceholder({
  src,
  alt,
  className = '',
}: {
  src?: string | null;
  alt: string;
  className?: string;
  icon?: any;
}) {
  const [status, setStatus] = useState<'loading' | 'loaded' | 'error'>(src ? 'loading' : 'error');

  useEffect(() => {
    setStatus(src ? 'loading' : 'error');
  }, [src]);

  return (
    <div className={`relative h-full w-full bg-zinc-800 overflow-hidden ${className}`}>
      {status !== 'loaded' && (
        <div
          aria-hidden="true"
          className="absolute inset-0 flex items-center justify-center bg-gradient-to-b from-zinc-700/70 to-zinc-800/95 text-zinc-500 animate-pulse px-2 text-center"
        >
          <span className="text-[10px] font-medium uppercase tracking-wider opacity-60">Нет постера</span>
        </div>
      )}
      {src && status !== 'error' && (
        <img
          src={src}
          alt={alt}
          loading="lazy"
          onLoad={() => setStatus('loaded')}
          onError={() => setStatus('error')}
          className={`h-full w-full object-cover transition-opacity duration-300 ${
            status === 'loaded' ? 'opacity-100' : 'opacity-0'
          }`}
        />
      )}
    </div>
  );
}

/** Интерактивная 3D-карточка постера с наклоном за курсором */
function TiltPosterCard({
  to,
  className,
  glowGradient,
  children,
}: {
  to: string | null;
  className: string;
  glowGradient?: string;
  children: React.ReactNode;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === 'touch') return;
    const el = wrapRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const px = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const py = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));
    const rx = (0.5 - py) * 14;
    const ry = (px - 0.5) * 16;
    el.classList.add('is-hovered');
    el.style.setProperty('--rx', `${rx.toFixed(2)}deg`);
    el.style.setProperty('--ry', `${ry.toFixed(2)}deg`);
  };

  const onPointerLeave = () => {
    const el = wrapRef.current;
    if (!el) return;
    el.classList.remove('is-hovered');
    el.style.setProperty('--rx', '0deg');
    el.style.setProperty('--ry', '0deg');
  };

  return (
    <div
      ref={wrapRef}
      onPointerMove={onPointerMove}
      onPointerLeave={onPointerLeave}
      className="top50-card-wrap relative w-full"
    >
      <div
        className={`top50-tilt-aura bg-gradient-to-br ${glowGradient || 'from-amber-400/50 to-orange-500/40'}`}
      />
      {to ? (
        <Link to={to} className={`top50-tilt-card top50-poster-zoom ${className}`}>
          {children}
        </Link>
      ) : (
        <div className={`top50-tilt-card top50-poster-zoom ${className}`}>
          {children}
        </div>
      )}
    </div>
  );
}

/** Размер и оформление Top-5 с прогрессивным уменьшением слева направо от #1 к #5 */
function getTop5ScaleMeta(pos: number) {
  switch (pos) {
    case 1:
      return {
        // #1 — левее всего и крупнее всего
        flexWeight: '31 1 0%',
        ring: 'border-amber-400/75 shadow-[0_16px_52px_rgba(251,191,36,0.28)]',
        badgeBg: 'bg-amber-400 text-black',
        titleSize: 'text-xs sm:text-base md:text-lg',
        glow: 'from-amber-400/65 via-orange-500/40 to-transparent',
      };
    case 2:
      return {
        // #2 — сразу справа, близко и чуть меньше
        flexWeight: '24.5 1 0%',
        ring: 'border-slate-300/60 shadow-[0_12px_38px_rgba(203,213,225,0.18)]',
        badgeBg: 'bg-slate-200 text-black',
        titleSize: 'text-[11px] sm:text-sm md:text-base',
        glow: 'from-slate-300/55 via-cyan-400/30 to-transparent',
      };
    case 3:
      return {
        flexWeight: '19.5 1 0%',
        ring: 'border-orange-400/60 shadow-[0_10px_30px_rgba(251,146,60,0.18)]',
        badgeBg: 'bg-orange-400 text-black',
        titleSize: 'text-[10px] sm:text-xs md:text-sm',
        glow: 'from-orange-400/55 via-amber-500/30 to-transparent',
      };
    case 4:
      return {
        flexWeight: '15.5 1 0%',
        ring: 'border-white/25',
        badgeBg: 'bg-zinc-900/95 text-white border border-white/25',
        titleSize: 'text-[9px] sm:text-xs md:text-sm',
        glow: 'from-white/30 via-primary/25 to-transparent',
      };
    default:
      return {
        flexWeight: '12.5 1 0%',
        ring: 'border-white/20',
        badgeBg: 'bg-zinc-900/95 text-zinc-200 border border-white/20',
        titleSize: 'text-[9px] sm:text-[11px] md:text-xs',
        glow: 'from-white/25 via-primary/20 to-transparent',
      };
  }
}

export default function Top50() {
  const { targetUserId } = useParams<{ targetUserId?: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const queryUserId = searchParams.get('user') || targetUserId || null;

  const { user, profile: myProfile, loading: authLoading } = useAppContext();
  const { bookmarks, refresh: refreshBookmarks } = useBookmarks();

  const initialCatParam = searchParams.get('cat') as Top50CategoryKey | null;
  const [activeCategory, setActiveCategory] = useState<Top50CategoryKey>(() =>
    CATEGORIES.some((c) => c.key === initialCatParam) ? initialCatParam! : 'movie'
  );
  const [sortBy, setSortBy] = useState<SortMode>('rank_asc');

  const [resolvedTarget, setResolvedTarget] = useState<{
    id: string;
    username: string;
    display_name: string | null;
    avatar_url: string | null;
    customization?: Record<string, any> | null;
  } | null>(null);
  const [targetNotFound, setTargetNotFound] = useState(false);
  const [resolvingTarget, setResolvingTarget] = useState(Boolean(queryUserId));

  const isOtherUser = Boolean(
    queryUserId &&
      queryUserId !== user?.id &&
      (!myProfile?.username || queryUserId.toLowerCase() !== myProfile.username.toLowerCase())
  );

  const isOwn = !isOtherUser && Boolean(user?.id);
  const effectiveUserId = isOtherUser ? resolvedTarget?.id || null : user?.id || null;

  const [byCategory, setByCategory] = useState<Record<Top50CategoryKey, Top50Entry[]>>({
    movie: [],
    series: [],
    anime: [],
    dorama: [],
    game: [],
    music: [],
  });
  const [loading, setLoading] = useState(true);

  // Add item dialog
  const [addOpen, setAddOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchCandidate[]>([]);
  const [searching, setSearching] = useState(false);
  const [savingItem, setSavingItem] = useState<string | null>(null);

  // Touch swipe tracking & directional slide animation for category switching
  const swipeStartRef = useRef<{ x: number; y: number } | null>(null);
  const [slideDir, setSlideDir] = useState(1);

  const selectCategory = useCallback(
    (cat: Top50CategoryKey, explicitDir?: -1 | 1) => {
      if (cat === activeCategory) return;
      const prevIdx = CATEGORIES.findIndex((c) => c.key === activeCategory);
      const nextIdx = CATEGORIES.findIndex((c) => c.key === cat);
      setSlideDir(explicitDir ?? (nextIdx >= prevIdx ? 1 : -1));
      setActiveCategory(cat);
      const next = new URLSearchParams(searchParams);
      next.set('cat', cat);
      setSearchParams(next, { replace: true });
    },
    [activeCategory, searchParams, setSearchParams]
  );

  const stepCategory = useCallback(
    (delta: -1 | 1) => {
      const idx = CATEGORIES.findIndex((c) => c.key === activeCategory);
      const nextIdx = (idx + delta + CATEGORIES.length) % CATEGORIES.length;
      selectCategory(CATEGORIES[nextIdx].key, delta);
    },
    [activeCategory, selectCategory]
  );

  // Resolve target user if /top50/:handle
  useEffect(() => {
    if (!queryUserId) {
      setResolvedTarget(null);
      setTargetNotFound(false);
      setResolvingTarget(false);
      return;
    }

    let active = true;
    setResolvingTarget(true);
    setTargetNotFound(false);

    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(queryUserId);
    let q = supabase.from('profiles').select('id, username, display_name, avatar_url, customization');
    q = isUUID ? q.eq('id', queryUserId) : q.or(`username.ilike.${queryUserId},custom_slug.eq.${queryUserId}`);

    q.maybeSingle().then(({ data }) => {
      if (!active) return;
      if (!data) {
        setResolvedTarget(null);
        setTargetNotFound(true);
      } else {
        setResolvedTarget(data as any);
      }
      setResolvingTarget(false);
    });

    return () => {
      active = false;
    };
  }, [queryUserId]);

  // Load user's Top 50 across all 6 categories
  const loadTop50 = useCallback(async () => {
    if (!effectiveUserId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const [profileRes, listsRes, ratedItems, bmRes] = await Promise.all([
        supabase.from('profiles').select('customization').eq('id', effectiveUserId).maybeSingle(),
        supabase.from('top_lists').select('id, title, media_type').eq('user_id', effectiveUserId),
        loadUserRatedItems(effectiveUserId).catch(() => []),
        supabase
          .from('content_bookmarks')
          .select('content_id, content_type, title, poster_url, genre, release_year, user_rating, external_rating')
          .eq('user_id', effectiveUserId),
      ]);

      const ratingByKey = new Map<string, { userRating?: number; externalRating?: number; year?: string }>();
      const bmTypeById = new Map<string, { contentType: string; genre?: string; posterUrl?: string; year?: string }>();

      for (const r of ratedItems) {
        ratingByKey.set(`${r.contentType}:${r.contentId}`, {
          userRating: r.userRating,
          externalRating: r.externalRating,
          year: r.releaseYear,
        });
        ratingByKey.set(r.contentId, {
          userRating: r.userRating,
          externalRating: r.externalRating,
          year: r.releaseYear,
        });
      }

      for (const b of (bmRes.data || []) as any[]) {
        const cid = String(b.content_id);
        bmTypeById.set(cid, {
          contentType: b.content_type || 'movie',
          genre: b.genre || undefined,
          posterUrl: b.poster_url || undefined,
          year: b.release_year || undefined,
        });
        if (!ratingByKey.has(cid) && b.user_rating) {
          ratingByKey.set(cid, {
            userRating: Number(b.user_rating),
            externalRating: b.external_rating != null ? Number(b.external_rating) : undefined,
            year: b.release_year || undefined,
          });
        }
      }

      const lists = (listsRes.data || []) as Array<{ id: string; title: string; media_type: string }>;
      const listIds = lists.map((l) => l.id);
      const itemsRes = listIds.length
        ? await supabase
            .from('top_list_items')
            .select('id, top_list_id, item_id, rank, title, poster_url, created_at')
            .in('top_list_id', listIds)
            .order('rank', { ascending: true })
        : { data: [] as any[] };

      const listTypeMap = new Map(lists.map((l) => [l.id, l.media_type]));
      const customTop50 = ((profileRes.data as any)?.customization?.top50 || {}) as Partial<
        Record<Top50CategoryKey, Top50Entry[]>
      >;

      const next: Record<Top50CategoryKey, Top50Entry[]> = {
        movie: [],
        series: [],
        anime: [],
        dorama: [],
        game: [],
        music: [],
      };

      // Populate from top_list_items first
      for (const raw of (itemsRes.data || []) as any[]) {
        const mediaType = listTypeMap.get(raw.top_list_id) || 'movie';
        const cid = String(raw.item_id);
        const bmMeta = bmTypeById.get(cid);
        const ratingInfo = ratingByKey.get(`${mediaType}:${cid}`) || ratingByKey.get(cid);

        let cat: Top50CategoryKey = 'movie';
        if (mediaType === 'game') cat = 'game';
        else if (mediaType === 'music') cat = 'music';
        else if (mediaType === 'dorama') cat = 'dorama';
        else if (mediaType === 'series') cat = 'series';
        else if (mediaType === 'anime') {
          cat = isAnimeMeta(bmMeta?.genre, bmMeta?.contentType, raw.title) ? 'anime' : 'series';
        }

        next[cat].push({
          uid: `db:${raw.id}`,
          dbRowId: String(raw.id),
          itemId: cid,
          category: cat,
          rank: Number(raw.rank) || next[cat].length + 1,
          title: raw.title || 'Без названия',
          posterUrl: raw.poster_url || bmMeta?.posterUrl || null,
          userRating: ratingInfo?.userRating,
          externalRating: ratingInfo?.externalRating,
          year: ratingInfo?.year || bmMeta?.year,
          createdAt: raw.created_at || '',
        });
      }

      // Merge customization.top50 entries (allows full support for Дорамы, Музыка, Сериалы, Аниме, etc.)
      for (const catDef of CATEGORIES) {
        const key = catDef.key;
        const customList = Array.isArray(customTop50[key]) ? customTop50[key]! : [];
        if (customList.length > 0) {
          // Use explicit custom list ordering while keeping ratings fresh
          const existingDbByItem = new Map(next[key].map((e) => [e.itemId, e]));
          next[key] = customList.slice(0, 50).map((entry, i) => {
            const ratingInfo = ratingByKey.get(String(entry.itemId));
            const dbMatch = existingDbByItem.get(String(entry.itemId));
            return {
              ...entry,
              uid: dbMatch?.uid || entry.uid || `custom:${key}:${entry.itemId}`,
              dbRowId: dbMatch?.dbRowId || entry.dbRowId,
              category: key,
              rank: i + 1,
              userRating: ratingInfo?.userRating ?? entry.userRating,
              externalRating: ratingInfo?.externalRating ?? entry.externalRating,
              year: ratingInfo?.year ?? entry.year,
            };
          });
        } else {
          next[key] = next[key]
            .sort((a, b) => a.rank - b.rank)
            .slice(0, 50)
            .map((e, i) => ({ ...e, rank: i + 1 }));
        }
      }

      setByCategory(next);
    } catch (err) {
      console.error('Error loading Top 50:', err);
    } finally {
      setLoading(false);
    }
  }, [effectiveUserId]);

  useEffect(() => {
    void loadTop50();
  }, [loadTop50]);

  // Persist category order to profiles.customization.top50 (and sync top_lists if applicable)
  const persistCategory = async (category: Top50CategoryKey, items: Top50Entry[]) => {
    if (!isOwn || !effectiveUserId) return;
    const normalized = items.slice(0, 50).map((it, idx) => ({ ...it, rank: idx + 1 }));
    setByCategory((prev) => ({ ...prev, [category]: normalized }));

    try {
      const { data: row } = await supabase
        .from('profiles')
        .select('customization')
        .eq('id', effectiveUserId)
        .single();
      const customization = ((row?.customization as any) || {}) as Record<string, any>;
      const top50 = (customization.top50 || {}) as Record<string, any>;
      top50[category] = normalized.map(({ dbRowId, ...rest }) => rest);
      customization.top50 = top50;
      await supabase.from('profiles').update({ customization }).eq('id', effectiveUserId);

      // Sync ranks back to top_list_items for entries linked to top_lists
      const dbUpdates = normalized.filter((it) => it.dbRowId);
      if (dbUpdates.length > 0) {
        await Promise.all(
          dbUpdates.map((it) =>
            supabase.from('top_list_items').update({ rank: it.rank }).eq('id', it.dbRowId!)
          )
        );
      }
    } catch (e) {
      console.error('Failed to persist Top 50:', e);
    }
  };

  // Search external catalogs inside "+ Добавить" modal for current category
  useEffect(() => {
    if (!addOpen) return;
    const q = searchQuery.trim();
    if (q.length < 2) {
      setSearchResults([]);
      return;
    }

    let cancelled = false;
    const timer = window.setTimeout(async () => {
      setSearching(true);
      try {
        if (activeCategory === 'game') {
          const res = await fetch(
            `https://api.rawg.io/api/games?key=${RAWG_API_KEY}&search=${encodeURIComponent(q)}&page_size=18`
          );
          const data = await res.json();
          if (!cancelled) {
            setSearchResults(
              (data.results || []).map((g: any) => ({
                id: String(g.id),
                title: g.name,
                posterUrl: g.background_image || null,
                year: g.released ? String(g.released).slice(0, 4) : undefined,
                subtitle: 'Игра',
              }))
            );
          }
        } else if (activeCategory === 'music') {
          const res = await fetch(
            `https://itunes.apple.com/search?term=${encodeURIComponent(q)}&entity=album&limit=18`
          );
          const data = await res.json();
          if (!cancelled) {
            setSearchResults(
              (data.results || []).map((m: any) => ({
                id: String(m.collectionId || m.trackId),
                title: `${m.collectionName || m.trackName} — ${m.artistName}`,
                posterUrl: m.artworkUrl100 ? String(m.artworkUrl100).replace('100x100bb', '600x600bb') : null,
                year: m.releaseDate ? String(m.releaseDate).slice(0, 4) : undefined,
                subtitle: m.primaryGenreName || 'Музыка',
              }))
            );
          }
        } else {
          const endpoint = activeCategory === 'movie' ? 'search/movie' : 'search/tv';
          const res = await fetch(
            `https://api.themoviedb.org/3/${endpoint}?query=${encodeURIComponent(q)}&page=1&language=ru-RU`,
            {
              headers: {
                Authorization: `Bearer ${TMDB_TOKEN}`,
                Accept: 'application/json',
              },
            }
          );
          const data = await res.json();
          if (!cancelled) {
            setSearchResults(
              (data.results || []).map((m: any) => ({
                id: String(m.id),
                title: m.title || m.name,
                posterUrl: m.poster_path ? `https://image.tmdb.org/t/p/w500${m.poster_path}` : null,
                year: (m.release_date || m.first_air_date || '').slice(0, 4) || undefined,
              }))
            );
          }
        }
      } catch (e) {
        console.error('Top50 search error:', e);
      } finally {
        if (!cancelled) setSearching(false);
      }
    }, 350);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [addOpen, searchQuery, activeCategory]);

  const handleAddCandidate = async (cand: SearchCandidate) => {
    if (!isOwn || !effectiveUserId) return;
    const current = byCategory[activeCategory] || [];
    if (current.some((x) => x.itemId === cand.id)) {
      toast.info('Уже есть в этом Топ 50');
      return;
    }
    if (current.length >= 50) {
      toast.error('В этом списке уже максимум 50 позиций');
      return;
    }

    setSavingItem(cand.id);
    try {
      const dbType = getDbMediaType(activeCategory);
      let dbRowId: string | undefined;

      if (dbType) {
        const { data: listRow } = await supabase
          .from('top_lists')
          .select('id')
          .eq('user_id', effectiveUserId)
          .eq('media_type', dbType)
          .maybeSingle();

        let listId = listRow?.id;
        if (!listId) {
          const { data: created } = await supabase
            .from('top_lists')
            .insert({ user_id: effectiveUserId, title: `Top 50 ${activeCategory}`, media_type: dbType })
            .select('id')
            .maybeSingle();
          listId = created?.id;
        }

        if (listId) {
          const { data: ins } = await supabase
            .from('top_list_items')
            .insert({
              top_list_id: listId,
              item_id: cand.id,
              rank: current.length + 1,
              title: cand.title,
              poster_url: cand.posterUrl,
            })
            .select('id')
            .maybeSingle();
          if (ins?.id) dbRowId = String(ins.id);
        }
      }

      const newEntry: Top50Entry = {
        uid: dbRowId ? `db:${dbRowId}` : `custom:${activeCategory}:${cand.id}`,
        dbRowId,
        itemId: cand.id,
        category: activeCategory,
        rank: current.length + 1,
        title: cand.title,
        posterUrl: cand.posterUrl,
        year: cand.year,
        createdAt: new Date().toISOString(),
      };

      await persistCategory(activeCategory, [...current, newEntry]);
      void refreshBookmarks();
      toast.success(`Добавлено в «Топ 50 · ${currentCatMeta.label}»`);
    } catch (e) {
      console.error(e);
      toast.error('Не удалось добавить');
    } finally {
      setSavingItem(null);
    }
  };

  const handleRemoveEntry = async (entry: Top50Entry) => {
    if (!isOwn) return;
    const current = byCategory[activeCategory] || [];
    if (entry.dbRowId) {
      await supabase.from('top_list_items').delete().eq('id', entry.dbRowId);
    }
    await persistCategory(
      activeCategory,
      current.filter((x) => x.uid !== entry.uid)
    );
    toast.success('Удалено из Топ 50');
  };

  const handleShiftRank = async (entry: Top50Entry, delta: -1 | 1) => {
    if (!isOwn) return;
    const list = [...(byCategory[activeCategory] || [])];
    const idx = list.findIndex((x) => x.uid === entry.uid);
    const targetIdx = idx + delta;
    if (idx < 0 || targetIdx < 0 || targetIdx >= list.length) return;
    const [moved] = list.splice(idx, 1);
    list.splice(targetIdx, 0, moved);
    await persistCategory(activeCategory, list);
  };

  const currentCatMeta = useMemo(
    () => CATEGORIES.find((c) => c.key === activeCategory) || CATEGORIES[0],
    [activeCategory]
  );

  const sortedItems = useMemo(() => {
    const raw = [...(byCategory[activeCategory] || [])];
    switch (sortBy) {
      case 'rating_desc':
        return raw.sort(
          (a, b) => (b.userRating ?? -1) - (a.userRating ?? -1) || a.rank - b.rank
        );
      case 'date_desc':
        return raw.sort(
          (a, b) => (b.createdAt || '').localeCompare(a.createdAt || '') || a.rank - b.rank
        );
      case 'title_asc':
        return raw.sort((a, b) => a.title.localeCompare(b.title, 'ru'));
      case 'rank_asc':
      default:
        return raw.sort((a, b) => a.rank - b.rank);
    }
  }, [byCategory, activeCategory, sortBy]);

  const top5Items = sortedItems.slice(0, 5);
  const restItems = sortedItems.slice(5, 50);

  const quickBookmarkCandidates = useMemo<SearchCandidate[]>(() => {
    const existingIds = new Set((byCategory[activeCategory] || []).map((x) => x.itemId));
    return bookmarks
      .filter((b) => {
        if (existingIds.has(String(b.contentId))) return false;
        if (activeCategory === 'movie') return b.contentType === 'movie';
        if (activeCategory === 'game') return b.contentType === 'game';
        if (activeCategory === 'anime') return isAnimeMeta(b.genre, b.contentType, b.title);
        if (activeCategory === 'dorama') return /корея|дорама|япон|китай/i.test(`${b.genre || ''} ${b.title}`);
        if (activeCategory === 'series') return b.contentType === 'series' && !isAnimeMeta(b.genre, b.contentType, b.title);
        return false;
      })
      .slice(0, 20)
      .map((b) => ({
        id: String(b.contentId),
        title: b.title,
        posterUrl: b.posterUrl || null,
        year: b.releaseYear,
        subtitle: b.userRating ? `Моя оценка: ★ ${b.userRating}` : b.genre,
      }));
  }, [bookmarks, byCategory, activeCategory]);

  const handle = isOtherUser
    ? resolvedTarget?.username || resolvedTarget?.id
    : myProfile?.username || user?.id;
  const profilePath = handle
    ? resolvedTarget?.username || (!isOtherUser && myProfile?.username)
      ? `/${handle}`
      : `/profile/${handle}`
    : '/';
  const bookmarksPath = handle ? `/bookmarks/${handle}` : '/bookmarks';
  const ratedPath = handle ? `/rated/${handle}` : '/rated';
  const shareUrl =
    typeof window !== 'undefined' && handle ? `${window.location.origin}/top50/${handle}` : '';

  // Keyboard navigation between categories
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (addOpen) return;
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      if (e.key === 'ArrowLeft') stepCategory(-1);
      if (e.key === 'ArrowRight') stepCategory(1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [stepCategory, addOpen]);

  if (isOtherUser && !resolvingTarget && targetNotFound) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold mb-2">Пользователь не найден</h1>
        <p className="text-sm text-muted-foreground mb-6">
          Не удалось загрузить Топ 50 пользователя «{queryUserId}».
        </p>
        <Button asChild variant="secondary">
          <Link to="/">На главную</Link>
        </Button>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen overflow-x-clip pb-28 md:pb-24"
      onTouchStart={(e) => {
        if (e.touches.length !== 1) return;
        swipeStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      }}
      onTouchEnd={(e) => {
        if (!swipeStartRef.current || e.changedTouches.length !== 1) return;
        const dx = e.changedTouches[0].clientX - swipeStartRef.current.x;
        const dy = e.changedTouches[0].clientY - swipeStartRef.current.y;
        swipeStartRef.current = null;
        if (Math.abs(dx) > 64 && Math.abs(dx) > Math.abs(dy) * 1.4) {
          stepCategory(dx < 0 ? 1 : -1);
        }
      }}
    >
      <div className="mx-auto w-full max-w-[1440px] px-3 sm:px-6 lg:px-8 pt-5 sm:pt-8 space-y-7">
        {/* 1. Заголовок «Топ 50» + индикатор текущей категории + сортировка */}
        <section className="rounded-3xl border border-white/10 bg-gradient-to-br from-white/[0.04] via-card/70 to-background p-4 sm:p-7 space-y-5">
          {isOtherUser && resolvedTarget && (
            <div className="flex items-center justify-between gap-3 pb-3 border-b border-white/10">
              <Link to={profilePath} className="flex items-center gap-3 min-w-0 group">
                <Avatar className="w-10 h-10 border border-white/20 shrink-0">
                  <AvatarImage src={resolvedTarget.avatar_url || undefined} />
                  <AvatarFallback>{(resolvedTarget.username || 'U')[0].toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="text-sm font-bold truncate group-hover:text-amber-300 transition-colors">
                    {resolvedTarget.display_name || resolvedTarget.username}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">@{resolvedTarget.username}</p>
                </div>
              </Link>
              <div className="flex flex-wrap items-center gap-1.5">
                <Button asChild size="sm" variant="secondary" className="rounded-full h-8 text-xs">
                  <Link to={profilePath}>Профиль</Link>
                </Button>
                <Button asChild size="sm" variant="secondary" className="rounded-full h-8 text-xs hidden sm:inline-flex">
                  <Link to={bookmarksPath}>Закладки</Link>
                </Button>
                <Button asChild size="sm" variant="secondary" className="rounded-full h-8 text-xs hidden sm:inline-flex">
                  <Link to={ratedPath}>Оценки</Link>
                </Button>
              </div>
            </div>
          )}

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            {/* Крупный заголовок в шрифте Monplesir Script + текстовый индикатор категории */}
            <div className="flex flex-wrap items-baseline gap-3 sm:gap-5 min-w-0">
              <h1
                className="text-5xl sm:text-7xl font-normal leading-none tracking-normal text-white select-none py-1"
                style={{ fontFamily: '"Monplesir Script", "Martina Script", cursive' }}
              >
                Топ 50
              </h1>

              <motion.span
                key={activeCategory}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                className={`inline-flex items-center gap-2 rounded-full border px-3.5 py-1 text-sm sm:text-base font-bold ${currentCatMeta.badgeCls}`}
              >
                <span>{currentCatMeta.label}</span>
                <span className="text-xs opacity-75 font-mono">{sortedItems.length}/50</span>
              </motion.span>
            </div>

            {/* Контрол сортировки + действия (без лишних значков) */}
            <div className="flex flex-wrap items-center gap-2.5 shrink-0">
              <div className="inline-flex items-center rounded-xl border border-white/15 bg-black/40 px-3 h-10 text-sm">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortMode)}
                  aria-label="Сортировка"
                  className="bg-transparent text-xs sm:text-sm font-medium focus:outline-none cursor-pointer"
                >
                  <option value="rank_asc" className="bg-zinc-950 text-white">
                    Позиция (1–50)
                  </option>
                  <option value="rating_desc" className="bg-zinc-950 text-white">
                    Оценка пользователя
                  </option>
                  <option value="date_desc" className="bg-zinc-950 text-white">
                    Дата добавления
                  </option>
                  <option value="title_asc" className="bg-zinc-950 text-white">
                    По названию
                  </option>
                </select>
              </div>

              {isOwn && (
                <Button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setSearchResults([]);
                    setAddOpen(true);
                  }}
                  className="rounded-xl h-10 px-4 bg-amber-400 text-black hover:bg-amber-300 font-bold"
                >
                  Добавить
                </Button>
              )}

              {shareUrl && (
                <Button
                  type="button"
                  variant="outline"
                  className="rounded-xl h-10 px-3.5 border-white/15 text-xs font-semibold"
                  onClick={() => {
                    navigator.clipboard?.writeText(shareUrl);
                    toast.success('Ссылка на Топ 50 скопирована');
                  }}
                >
                  Поделиться
                </Button>
              )}
            </div>
          </div>

          {!isOtherUser && handle && (
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <Button asChild size="sm" variant="secondary" className="rounded-full h-8 text-xs">
                <Link to={profilePath}>Мой профиль</Link>
              </Button>
              <Button asChild size="sm" variant="secondary" className="rounded-full h-8 text-xs">
                <Link to={bookmarksPath}>Мои закладки</Link>
              </Button>
              <Button asChild size="sm" variant="secondary" className="rounded-full h-8 text-xs">
                <Link to={ratedPath}>Оценённые</Link>
              </Button>
            </div>
          )}
        </section>

        {/* 2. Центральный блок: Топ-5 с прогрессивным масштабом + позиции 6–50 в стандартной сетке */}
        {loading || resolvingTarget || authLoading ? (
          <div className="space-y-8" style={{ perspective: 1400 }}>
            <div className="flex flex-nowrap items-end justify-start gap-2 sm:gap-3.5 md:gap-4 w-full max-w-[1360px]">
              {[1, 2, 3, 4, 5].map((pos) => {
                const meta = getTop5ScaleMeta(pos);
                return (
                  <div
                    key={pos}
                    style={{ flex: meta.flexWeight, minWidth: 0 }}
                    className="aspect-[2/3] rounded-xl sm:rounded-2xl bg-zinc-800/90 border border-white/10 animate-pulse"
                  />
                );
              })}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 2xl:grid-cols-6 gap-4 sm:gap-5">
              {Array.from({ length: 12 }).map((_, i) => (
                <div
                  key={i}
                  className="aspect-[2/3] rounded-xl bg-zinc-800/80 border border-white/5 animate-pulse"
                />
              ))}
            </div>
          </div>
        ) : !isOtherUser && !user ? (
          <div className="rounded-3xl border border-white/10 bg-card/50 p-10 text-center max-w-md mx-auto space-y-4">
            <h2 className="text-xl font-bold">Войдите, чтобы собрать свой Топ 50</h2>
            <p className="text-sm text-muted-foreground">
              Составьте персональные рейтинги по категориям: Кино, Сериалы, Аниме, Дорамы, Игры и Музыка.
            </p>
            <Button asChild className="rounded-full px-6">
              <Link to="/auth">Войти в аккаунт</Link>
            </Button>
          </div>
        ) : (
          <motion.div
            key={activeCategory}
            initial={{ opacity: 0, x: slideDir >= 0 ? 36 : -36 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
            className="space-y-10"
          >
            {sortedItems.length === 0 && !isOwn ? (
              <div className="rounded-3xl border border-dashed border-white/15 bg-zinc-900/40 p-10 sm:p-14 text-center space-y-2">
                <h2 className="text-xl font-bold">В категории «{currentCatMeta.label}» пока пусто</h2>
                <p className="text-sm text-muted-foreground">
                  Пользователь пока не заполнил раздел «{currentCatMeta.label}».
                </p>
              </div>
            ) : (
              <>
            {/* Топ-5 позиций: #1 левее всего и крупнее, #2..#5 правее, близко и по убыванию размера */}
            {(top5Items.length > 0 || isOwn) && (
              <section className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs sm:text-sm font-bold uppercase tracking-wider text-amber-300">
                    Топ-5
                  </span>
                </div>

                <div className="flex flex-nowrap items-end justify-start gap-2 sm:gap-3.5 md:gap-4 w-full max-w-[1360px]">
                  {[0, 1, 2, 3, 4].map((slotIdx) => {
                    const displayPos = slotIdx + 1;
                    const item = top5Items[slotIdx];
                    const meta = getTop5ScaleMeta(displayPos);

                    if (!item) {
                      if (!isOwn || sortBy !== 'rank_asc') return null;
                      return (
                        <button
                          key={`empty-${displayPos}`}
                          type="button"
                          onClick={() => {
                            setSearchQuery('');
                            setSearchResults([]);
                            setAddOpen(true);
                          }}
                          style={{ flex: meta.flexWeight, minWidth: 0 }}
                          className="group relative aspect-[2/3] rounded-xl sm:rounded-2xl border border-dashed border-zinc-600/70 bg-zinc-800/75 hover:bg-zinc-800 hover:border-amber-400/70 hover:-translate-y-1.5 transition-all duration-200 flex flex-col items-center justify-center gap-1.5 text-zinc-400 hover:text-amber-300"
                        >
                          <span
                            className={`absolute top-1.5 left-1.5 sm:top-2.5 sm:left-2.5 inline-flex items-center justify-center rounded-lg px-1.5 sm:px-2 py-0.5 text-[10px] sm:text-xs font-black ${meta.badgeBg}`}
                          >
                            #{displayPos}
                          </span>
                          <span className="text-[11px] sm:text-xs font-semibold opacity-80">Добавить</span>
                        </button>
                      );
                    }

                    const to = getDetailRoute(activeCategory, item.itemId);
                    const cardInner = (
                      <>
                        <PosterWithPlaceholder
                          src={item.posterUrl}
                          alt={item.title}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/25 to-transparent pointer-events-none" />

                        {/* Позиция #1–#5 */}
                        <div
                          className={`top50-rank-pop absolute top-1.5 left-1.5 sm:top-3 sm:left-3 z-10 inline-flex items-center justify-center rounded-lg sm:rounded-xl px-1.5 sm:px-2.5 py-0.5 sm:py-1 text-[10px] sm:text-sm font-black shadow-lg ${meta.badgeBg}`}
                        >
                          #{item.rank}
                        </div>

                        {/* Оценка */}
                        {(item.userRating || item.externalRating) && (
                          <div className="hidden sm:inline-flex absolute top-3 right-3 z-10 items-center rounded-lg bg-black/75 backdrop-blur-sm border border-amber-400/35 px-2.5 py-0.5 text-xs font-bold text-amber-300">
                            {Number(item.userRating || item.externalRating)
                              .toFixed(1)
                              .replace(/\.0$/, '')}
                          </div>
                        )}

                        {/* Название и год */}
                        <div className="top50-meta-lift absolute bottom-0 inset-x-0 p-2 sm:p-4 z-10">
                          <h3 className={`font-display font-bold text-white line-clamp-1 sm:line-clamp-2 leading-snug ${meta.titleSize}`}>
                            {item.title}
                          </h3>
                          {item.year && (
                            <p className="hidden sm:block text-[10px] sm:text-xs text-zinc-400 font-mono mt-0.5">{item.year}</p>
                          )}
                        </div>
                      </>
                    );

                    return (
                      <div
                        key={item.uid}
                        style={{ flex: meta.flexWeight, minWidth: 0 }}
                        className="group relative"
                      >
                        <TiltPosterCard
                          to={to}
                          glowGradient={meta.glow}
                          className={`relative block aspect-[2/3] w-full rounded-xl sm:rounded-2xl overflow-hidden border-2 bg-zinc-800 ${meta.ring}`}
                        >
                          {cardInner}
                        </TiltPosterCard>

                        {isOwn && sortBy === 'rank_asc' && (
                          <div className="mt-1.5 flex items-center justify-center gap-0.5 sm:gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                            <button
                              type="button"
                              onClick={() => handleShiftRank(item, -1)}
                              disabled={slotIdx === 0}
                              title="Выше в топе"
                              className="rounded-md border border-white/10 bg-zinc-900/90 p-0.5 sm:p-1 text-zinc-300 hover:text-white disabled:opacity-30"
                            >
                              <ArrowUp className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleShiftRank(item, 1)}
                              disabled={slotIdx === sortedItems.length - 1}
                              title="Ниже в топе"
                              className="rounded-md border border-white/10 bg-zinc-900/90 p-0.5 sm:p-1 text-zinc-300 hover:text-white disabled:opacity-30"
                            >
                              <ArrowDown className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRemoveEntry(item)}
                              title="Удалить из топа"
                              className="rounded-md border border-rose-500/30 bg-rose-500/15 p-0.5 sm:p-1 text-rose-300 hover:bg-rose-500/30"
                            >
                              <Trash2 className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {/* Позиции 6–50: единый крупный стандартный размер сетки */}
            {restItems.length > 0 && (
              <section className="space-y-4">
                <div className="flex items-center justify-between border-t border-white/10 pt-5">
                  <h2 className="text-sm sm:text-base font-bold text-zinc-300">
                    Позиции 6–{Math.min(50, sortedItems.length)}
                  </h2>
                  <span className="text-xs text-muted-foreground">{restItems.length} тайтлов</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 2xl:grid-cols-6 gap-4 sm:gap-5">
                  {restItems.map((item, idx) => {
                    const realIdx = idx + 5;
                    const to = getDetailRoute(activeCategory, item.itemId);

                    const cardInner = (
                      <>
                        <PosterWithPlaceholder
                          src={item.posterUrl}
                          alt={item.title}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/15 to-transparent pointer-events-none" />
                        <div className="top50-rank-pop absolute top-2 left-2 rounded-lg bg-black/80 border border-white/15 px-2 py-0.5 text-xs font-black text-white">
                          #{item.rank}
                        </div>
                        {(item.userRating || item.externalRating) && (
                          <div className="absolute top-2 right-2 inline-flex items-center rounded-md bg-black/80 px-2 py-0.5 text-[11px] font-bold text-amber-300">
                            {Number(item.userRating || item.externalRating)
                              .toFixed(1)
                              .replace(/\.0$/, '')}
                          </div>
                        )}
                        <div className="top50-meta-lift absolute bottom-0 inset-x-0 p-2.5 sm:p-3">
                          <h3 className="text-xs sm:text-sm font-bold text-white line-clamp-2 leading-tight">
                            {item.title}
                          </h3>
                        </div>
                      </>
                    );

                    return (
                      <div key={item.uid} className="group relative">
                        <TiltPosterCard
                          to={to}
                          glowGradient={currentCatMeta.accent}
                          className="relative block aspect-[2/3] w-full rounded-xl overflow-hidden border border-white/15 bg-zinc-800 hover:border-amber-400/60"
                        >
                          {cardInner}
                        </TiltPosterCard>

                        {isOwn && sortBy === 'rank_asc' && (
                          <div className="mt-1.5 flex items-center justify-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                            <button
                              type="button"
                              onClick={() => handleShiftRank(item, -1)}
                              title="Выше"
                              className="rounded border border-white/10 bg-zinc-900 p-1 text-zinc-300 hover:text-white"
                            >
                              <ArrowUp className="w-3 h-3" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleShiftRank(item, 1)}
                              disabled={realIdx === sortedItems.length - 1}
                              title="Ниже"
                              className="rounded border border-white/10 bg-zinc-900 p-1 text-zinc-300 hover:text-white disabled:opacity-30"
                            >
                              <ArrowDown className="w-3 h-3" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRemoveEntry(item)}
                              title="Удалить"
                              className="rounded border border-rose-500/30 bg-rose-500/15 p-1 text-rose-300"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </section>
            )}
              </>
            )}
          </motion.div>
        )}
      </div>

      {/* 3. Нижний/сквозной горизонтальный переключатель категорий (свайп + табы + круговые стрелки) */}
      <div className="fixed bottom-[68px] md:bottom-4 left-0 right-0 z-40 px-2 sm:px-4 pointer-events-none">
        <div className="mx-auto max-w-3xl pointer-events-auto rounded-full border border-white/15 bg-black/80 backdrop-blur-2xl shadow-[0_12px_40px_rgba(0,0,0,0.75)] p-1.5 flex items-center gap-1">
          <button
            type="button"
            onClick={() => stepCategory(-1)}
            aria-label="Предыдущая категория"
            className="shrink-0 h-9 w-9 rounded-full flex items-center justify-center text-zinc-300 hover:text-white hover:bg-white/10 transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <div className="flex-1 flex items-center gap-1 overflow-x-auto no-scrollbar">
            {CATEGORIES.map((cat) => {
              const isActive = cat.key === activeCategory;
              const count = (byCategory[cat.key] || []).length;
              return (
                <button
                  key={cat.key}
                  type="button"
                  onClick={() => selectCategory(cat.key)}
                  className={`relative inline-flex items-center gap-1.5 rounded-full px-3 sm:px-4 py-1.5 text-xs sm:text-sm font-bold whitespace-nowrap shrink-0 transition-colors ${
                    isActive
                      ? 'text-black'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  {isActive && (
                    <motion.span
                      layoutId="top50ActivePill"
                      transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
                      className={`absolute inset-0 rounded-full bg-gradient-to-r ${cat.accent} shadow-md`}
                    />
                  )}
                  <span className="relative z-10">{cat.label}</span>
                  {count > 0 && (
                    <span className={`relative z-10 text-[10px] font-mono ${isActive ? 'opacity-80' : 'opacity-50'}`}>
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={() => stepCategory(1)}
            aria-label="Следующая категория"
            className="shrink-0 h-9 w-9 rounded-full flex items-center justify-center text-zinc-300 hover:text-white hover:bg-white/10 transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Диалог добавления в Топ 50 текущей категории */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>
              Добавить в «Топ 50 · {currentCatMeta.label}»
            </DialogTitle>
          </DialogHeader>

          <div className="relative">
            <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={`Поиск в категории «${currentCatMeta.label}»...`}
              className="pl-9 pr-9"
              autoFocus
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="flex-1 overflow-y-auto space-y-2 pr-1 mt-2 min-h-[220px]">
            {searching ? (
              <div className="flex items-center justify-center py-12 text-muted-foreground gap-2">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span className="text-sm">Поиск...</span>
              </div>
            ) : searchQuery.trim().length < 2 ? (
              quickBookmarkCandidates.length > 0 ? (
                <div className="space-y-2">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground px-1">
                    Из ваших закладок и оценок
                  </p>
                  {quickBookmarkCandidates.map((cand) => (
                    <div
                      key={cand.id}
                      className="flex items-center gap-3 rounded-xl border border-border bg-card/60 p-2.5"
                    >
                      <div className="w-11 aspect-[2/3] rounded-lg overflow-hidden bg-zinc-800 shrink-0">
                        <PosterWithPlaceholder
                          src={cand.posterUrl}
                          alt={cand.title}
                          icon={currentCatMeta.icon}
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold truncate">{cand.title}</p>
                        {(cand.year || cand.subtitle) && (
                          <p className="text-xs text-muted-foreground truncate">
                            {[cand.year, cand.subtitle].filter(Boolean).join(' · ')}
                          </p>
                        )}
                      </div>
                      <Button
                        type="button"
                        size="sm"
                        disabled={savingItem === cand.id}
                        onClick={() => handleAddCandidate(cand)}
                        className="shrink-0 rounded-full"
                      >
                        {savingItem === cand.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Добавить'}
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-sm text-muted-foreground py-12">
                  Введите минимум 2 символа для поиска
                </p>
              )
            ) : searchResults.length === 0 ? (
              <p className="text-center text-sm text-muted-foreground py-12">Ничего не найдено</p>
            ) : (
              searchResults.map((cand) => {
                const already = (byCategory[activeCategory] || []).some((x) => x.itemId === cand.id);
                return (
                  <div
                    key={cand.id}
                    className="flex items-center gap-3 rounded-xl border border-border bg-card/60 p-2.5"
                  >
                    <div className="w-11 aspect-[2/3] rounded-lg overflow-hidden bg-zinc-800 shrink-0">
                      <PosterWithPlaceholder
                        src={cand.posterUrl}
                        alt={cand.title}
                        icon={currentCatMeta.icon}
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold truncate">{cand.title}</p>
                      {(cand.year || cand.subtitle) && (
                        <p className="text-xs text-muted-foreground truncate">
                          {[cand.year, cand.subtitle].filter(Boolean).join(' · ')}
                        </p>
                      )}
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      disabled={already || savingItem === cand.id}
                      onClick={() => handleAddCandidate(cand)}
                      variant={already ? 'secondary' : 'default'}
                      className="shrink-0 rounded-full"
                    >
                      {savingItem === cand.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : already ? (
                        'В топе'
                      ) : (
                        'Добавить'
                      )}
                    </Button>
                  </div>
                );
              })
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
