import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Star,
  Film,
  Tv,
  Gamepad2,
  Sparkles,
  Search,
  Layers,
  ArrowUpDown,
  LogIn,
} from 'lucide-react';
import { useBookmarks } from '@/context/BookmarkContext';
import { useAppContext } from '@/context/AppContext';
import supabase from '@/lib/supabase';
import { getMovieDetails, getSeriesDetails, getMoviePosterUrl } from '@/utils/tmdbApi';
import { fetchRawg, RAWG_API_KEY } from '@/utils/rawgApi';
import PosterImage from '@/components/PosterImage';
import ContentActionsButton from '@/components/ContentActionsButton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ContentType, CONTENT_STATUS_CONFIG, ContentStatus } from '@/types/anime';

type CategoryFilter = 'all' | 'movie' | 'series' | 'game' | 'anime';
type SortMode = 'rating_desc' | 'rating_asc' | 'recent' | 'title';

export interface RatedItem {
  key: string;
  contentId: string;
  contentType: ContentType;
  title: string;
  posterUrl?: string | null;
  userRating: number;
  externalRating?: number;
  releaseYear?: string;
  genre?: string;
  status?: ContentStatus;
  notes?: string;
  updatedAt: string;
  source: 'bookmark' | 'community' | 'legacy';
}

const CATEGORY_META: Array<{
  key: Exclude<CategoryFilter, 'all'>;
  label: string;
  singular: string;
  icon: any;
  gradient: string;
}> = [
  {
    key: 'movie',
    label: 'Фильмы',
    singular: 'Фильм',
    icon: Film,
    gradient: 'from-violet-500 to-purple-600',
  },
  {
    key: 'series',
    label: 'Сериалы',
    singular: 'Сериал',
    icon: Tv,
    gradient: 'from-cyan-500 to-blue-600',
  },
  {
    key: 'game',
    label: 'Игры',
    singular: 'Игра',
    icon: Gamepad2,
    gradient: 'from-amber-500 to-orange-600',
  },
  {
    key: 'anime',
    label: 'Аниме',
    singular: 'Аниме',
    icon: Sparkles,
    gradient: 'from-pink-500 to-rose-600',
  },
];

function getItemLink(type: ContentType, id: string): string {
  if (type === 'series') return `/series/${id}`;
  if (type === 'game') return `/game/${id}`;
  return `/movie/${id}`;
}

function getTop50MediaType(type: ContentType): string {
  if (type === 'game') return 'game';
  if (type === 'anime') return 'anime';
  return 'movie';
}

function ratingBadgeStyle(rating: number): string {
  if (rating >= 8) return 'bg-emerald-500 text-black';
  if (rating >= 6) return 'bg-amber-400 text-black';
  return 'bg-rose-500 text-white';
}

export default function Rated() {
  const { user, loading: authLoading } = useAppContext();
  const { bookmarks, loading: bookmarksLoading } = useBookmarks();

  const [extraItems, setExtraItems] = useState<RatedItem[]>([]);
  const [loadingExtra, setLoadingExtra] = useState(false);

  const [category, setCategory] = useState<CategoryFilter>('all');
  const [sortBy, setSortBy] = useState<SortMode>('rating_desc');
  const [searchQuery, setSearchQuery] = useState('');

  // Базовые оценённые из закладок (мгновенно из BookmarkContext)
  const bookmarkRated = useMemo<RatedItem[]>(() => {
    return bookmarks
      .filter((b) => typeof b.userRating === 'number' && b.userRating > 0)
      .map((b) => ({
        key: `${b.contentType}:${b.contentId}`,
        contentId: String(b.contentId),
        contentType: b.contentType,
        title: b.title,
        posterUrl: b.posterUrl || null,
        userRating: Number(b.userRating),
        externalRating: b.externalRating,
        releaseYear: b.releaseYear,
        genre: b.genre,
        status: b.status,
        notes: b.notes,
        updatedAt: b.updatedAt || b.createdAt || '',
        source: 'bookmark' as const,
      }));
  }, [bookmarks]);

  // Догружаем оценки из community_ratings и таблиц user_movies / user_series / user_games,
  // если пользователь оценивал что-то без добавления в закладки
  useEffect(() => {
    if (!user?.id) {
      setExtraItems([]);
      return;
    }

    let cancelled = false;
    const bookmarkKeys = new Set(bookmarkRated.map((i) => i.key));

    const loadExtraRatings = async () => {
      setLoadingExtra(true);
      try {
        const [commRes, legacyMoviesRes, legacySeriesRes, legacyGamesRes] = await Promise.allSettled([
          supabase
            .from('community_ratings')
            .select('content_id, content_type, rating, updated_at, created_at')
            .eq('user_id', user.id)
            .gt('rating', 0),
          supabase
            .from('user_movies')
            .select('movie_id, title, poster_path, release_date, rating, updated_at, created_at')
            .eq('user_id', user.id)
            .gt('rating', 0),
          supabase
            .from('user_series')
            .select('series_id, title, poster_path, release_date, rating, updated_at, created_at')
            .eq('user_id', user.id)
            .gt('rating', 0),
          supabase
            .from('user_games')
            .select('game_id, title, background_image, released, rating, updated_at, created_at')
            .eq('user_id', user.id)
            .gt('rating', 0),
        ]);

        const collected = new Map<string, RatedItem>();

        const addLegacy = (item: RatedItem) => {
          if (bookmarkKeys.has(item.key) || collected.has(item.key)) return;
          collected.set(item.key, item);
        };

        if (legacyMoviesRes.status === 'fulfilled' && !legacyMoviesRes.value.error) {
          for (const m of (legacyMoviesRes.value.data || []) as any[]) {
            addLegacy({
              key: `movie:${m.movie_id}`,
              contentId: String(m.movie_id),
              contentType: 'movie',
              title: m.title || `Фильм #${m.movie_id}`,
              posterUrl: m.poster_path
                ? m.poster_path.startsWith('http')
                  ? m.poster_path
                  : getMoviePosterUrl(m.poster_path, 'w342')
                : null,
              userRating: Number(m.rating),
              releaseYear: m.release_date?.split('-')[0],
              updatedAt: m.updated_at || m.created_at || '',
              source: 'legacy',
            });
          }
        }

        if (legacySeriesRes.status === 'fulfilled' && !legacySeriesRes.value.error) {
          for (const s of (legacySeriesRes.value.data || []) as any[]) {
            addLegacy({
              key: `series:${s.series_id}`,
              contentId: String(s.series_id),
              contentType: 'series',
              title: s.title || `Сериал #${s.series_id}`,
              posterUrl: s.poster_path
                ? s.poster_path.startsWith('http')
                  ? s.poster_path
                  : getMoviePosterUrl(s.poster_path, 'w342')
                : null,
              userRating: Number(s.rating),
              releaseYear: s.release_date?.split('-')[0],
              updatedAt: s.updated_at || s.created_at || '',
              source: 'legacy',
            });
          }
        }

        if (legacyGamesRes.status === 'fulfilled' && !legacyGamesRes.value.error) {
          for (const g of (legacyGamesRes.value.data || []) as any[]) {
            addLegacy({
              key: `game:${g.game_id}`,
              contentId: String(g.game_id),
              contentType: 'game',
              title: g.title || `Игра #${g.game_id}`,
              posterUrl: g.background_image || null,
              userRating: Number(g.rating),
              releaseYear: g.released?.split('-')[0],
              updatedAt: g.updated_at || g.created_at || '',
              source: 'legacy',
            });
          }
        }

        // Обогащаем записи из community_ratings, если их нет ни в закладках, ни в legacy
        if (commRes.status === 'fulfilled' && !commRes.value.error) {
          const rows = ((commRes.value.data || []) as any[]).filter((r) => {
            const k = `${r.content_type}:${r.content_id}`;
            return !bookmarkKeys.has(k) && !collected.has(k);
          });

          const enriched = await Promise.allSettled(
            rows.slice(0, 40).map(async (r): Promise<RatedItem> => {
              const type = (r.content_type || 'movie') as ContentType;
              const id = String(r.content_id);
              const base: RatedItem = {
                key: `${type}:${id}`,
                contentId: id,
                contentType: type,
                title: `${type === 'game' ? 'Игра' : type === 'series' ? 'Сериал' : 'Фильм'} #${id}`,
                posterUrl: null,
                userRating: Number(r.rating),
                updatedAt: r.updated_at || r.created_at || '',
                source: 'community',
              };

              try {
                if (type === 'movie' || type === 'anime') {
                  const d = await getMovieDetails(Number(id));
                  return {
                    ...base,
                    title: d.title || base.title,
                    posterUrl: d.poster_path ? getMoviePosterUrl(d.poster_path, 'w342') : null,
                    releaseYear: d.release_date?.split('-')[0],
                    externalRating: d.vote_average ? Math.round(d.vote_average * 10) / 10 : undefined,
                  };
                }
                if (type === 'series') {
                  const d = await getSeriesDetails(Number(id));
                  return {
                    ...base,
                    title: d.title || base.title,
                    posterUrl: d.poster_path ? getMoviePosterUrl(d.poster_path, 'w342') : null,
                    releaseYear: d.release_date?.split('-')[0],
                    externalRating: d.vote_average ? Math.round(d.vote_average * 10) / 10 : undefined,
                  };
                }
                if (type === 'game') {
                  const d = await fetchRawg(`https://api.rawg.io/api/games/${id}?key=${RAWG_API_KEY}`);
                  return {
                    ...base,
                    title: d.name || base.title,
                    posterUrl: d.background_image || null,
                    releaseYear: d.released?.split('-')[0],
                    externalRating: d.rating ? Math.round(d.rating * 10) / 10 : undefined,
                  };
                }
              } catch {
                // fallback to base title
              }
              return base;
            })
          );

          for (const res of enriched) {
            if (res.status === 'fulfilled') {
              collected.set(res.value.key, res.value);
            }
          }
        }

        if (!cancelled) {
          setExtraItems(Array.from(collected.values()));
        }
      } finally {
        if (!cancelled) {
          setLoadingExtra(false);
        }
      }
    };

    loadExtraRatings();
    return () => {
      cancelled = true;
    };
  }, [user?.id, bookmarkRated]);

  // Объединяем все оценённые позиции без дублей
  const allRated = useMemo<RatedItem[]>(() => {
    const map = new Map<string, RatedItem>();
    for (const item of bookmarkRated) {
      map.set(item.key, item);
    }
    for (const item of extraItems) {
      if (!map.has(item.key)) {
        map.set(item.key, item);
      }
    }
    return Array.from(map.values());
  }, [bookmarkRated, extraItems]);

  const countsByType = useMemo(() => {
    const counts: Record<CategoryFilter, number> = {
      all: allRated.length,
      movie: 0,
      series: 0,
      game: 0,
      anime: 0,
    };
    for (const item of allRated) {
      if (item.contentType in counts) {
        counts[item.contentType]++;
      }
    }
    return counts;
  }, [allRated]);

  const averageScore = useMemo(() => {
    if (allRated.length === 0) return null;
    const sum = allRated.reduce((acc, item) => acc + item.userRating, 0);
    return (sum / allRated.length).toFixed(1);
  }, [allRated]);

  const filteredAndSorted = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const list = allRated.filter((item) => {
      if (category !== 'all' && item.contentType !== category) return false;
      if (q && !item.title.toLowerCase().includes(q) && !(item.genre || '').toLowerCase().includes(q)) {
        return false;
      }
      return true;
    });

    return [...list].sort((a, b) => {
      switch (sortBy) {
        case 'rating_desc':
          return b.userRating - a.userRating || b.updatedAt.localeCompare(a.updatedAt);
        case 'rating_asc':
          return a.userRating - b.userRating || b.updatedAt.localeCompare(a.updatedAt);
        case 'title':
          return a.title.localeCompare(b.title, 'ru');
        case 'recent':
        default:
          return b.updatedAt.localeCompare(a.updatedAt) || b.userRating - a.userRating;
      }
    });
  }, [allRated, category, searchQuery, sortBy]);

  const loading = authLoading || (!!user && bookmarksLoading && allRated.length === 0);

  if (!authLoading && !user) {
    return (
      <div className="container mx-auto px-4 py-16">
        <Card className="max-w-md mx-auto p-8 text-center">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/15 text-amber-400 flex items-center justify-center mx-auto mb-4">
            <Star className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Оценённые</h1>
          <p className="text-sm text-muted-foreground mb-6">
            Войдите в аккаунт, чтобы видеть все ваши оценки фильмов, сериалов и игр по категориям.
          </p>
          <Button asChild className="gap-2">
            <Link to="/auth">
              <LogIn className="w-4 h-4" />
              Войти в аккаунт
            </Link>
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 py-8 space-y-7">
        {/* Заголовок */}
        <div className="relative overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-amber-500/15 via-primary/10 to-background p-6 md:p-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/30 mb-3">
                <Star className="w-3.5 h-3.5 fill-amber-400" />
                Личные оценки
              </div>
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Оценённые</h1>
              <p className="text-muted-foreground mt-1 text-sm md:text-base">
                Всё, что вы оценили — по категориям: фильмы, сериалы, игры и аниме
              </p>
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              <div className="px-4 py-2.5 rounded-2xl bg-card/80 border border-border backdrop-blur-sm">
                <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Всего оценок</p>
                <p className="text-2xl font-bold tabular-nums">{allRated.length}</p>
              </div>
              {averageScore && (
                <div className="px-4 py-2.5 rounded-2xl bg-card/80 border border-border backdrop-blur-sm">
                  <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Средний балл</p>
                  <p className="text-2xl font-bold tabular-nums text-amber-400">★ {averageScore}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Фильтры по категориям + поиск + сортировка */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
            <button
              type="button"
              onClick={() => setCategory('all')}
              className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap shrink-0 border transition-all ${
                category === 'all'
                  ? 'bg-primary text-primary-foreground border-primary shadow-md'
                  : 'bg-card/80 border-border text-muted-foreground hover:text-foreground hover:bg-muted'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>Все</span>
              <span className="ml-0.5 text-xs opacity-80">{countsByType.all}</span>
            </button>

            {CATEGORY_META.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                type="button"
                onClick={() => setCategory(key)}
                className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap shrink-0 border transition-all ${
                  category === key
                    ? 'bg-primary text-primary-foreground border-primary shadow-md'
                    : 'bg-card/80 border-border text-muted-foreground hover:text-foreground hover:bg-muted'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{label}</span>
                <span className="ml-0.5 text-xs opacity-80">{countsByType[key]}</span>
              </button>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
            <div className="relative sm:w-64">
              <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Поиск по оценённым..."
                className="pl-9 rounded-xl"
              />
            </div>

            <div className="inline-flex items-center gap-1.5 bg-card border border-border rounded-xl px-3 h-10">
              <ArrowUpDown className="w-4 h-4 text-muted-foreground shrink-0" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortMode)}
                aria-label="Сортировка"
                className="bg-transparent text-sm focus:outline-none cursor-pointer"
              >
                <option value="rating_desc" className="bg-background text-foreground">
                  Сначала высокие оценки
                </option>
                <option value="rating_asc" className="bg-background text-foreground">
                  Сначала низкие оценки
                </option>
                <option value="recent" className="bg-background text-foreground">
                  Недавно оценённые
                </option>
                <option value="title" className="bg-background text-foreground">
                  По алфавиту
                </option>
              </select>
            </div>
          </div>
        </div>

        {/* Контент */}
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="aspect-[2/3] rounded-xl bg-muted animate-pulse" />
            ))}
          </div>
        ) : filteredAndSorted.length === 0 ? (
          <Card className="p-12 text-center border-dashed">
            <Star className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
            <h2 className="text-xl font-semibold mb-1">
              {allRated.length === 0 ? 'Пока нет оценённых тайтлов' : 'В этой категории ничего не найдено'}
            </h2>
            <p className="text-sm text-muted-foreground max-w-md mx-auto mb-6">
              {allRated.length === 0
                ? 'Ставьте оценки фильмам, сериалам и играм через кнопку действий или рейтинг — они автоматически появятся здесь.'
                : 'Попробуйте выбрать другую категорию или изменить поисковый запрос.'}
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              <Button asChild variant="secondary">
                <Link to="/movies">К фильмам</Link>
              </Button>
              <Button asChild variant="secondary">
                <Link to="/series">К сериалам</Link>
              </Button>
              <Button asChild variant="secondary">
                <Link to="/games">К играм</Link>
              </Button>
            </div>
          </Card>
        ) : category === 'all' ? (
          /* Когда выбрано «Все» — группируем по категориям (Фильмы, Сериалы, Игры, Аниме) */
          <div className="space-y-10">
            {CATEGORY_META.map((cat) => {
              const items = filteredAndSorted.filter((item) => item.contentType === cat.key);
              if (items.length === 0) return null;
              const Icon = cat.icon;
              const catAvg = (
                items.reduce((acc, i) => acc + i.userRating, 0) / items.length
              ).toFixed(1);

              return (
                <section key={cat.key} className="space-y-4">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`w-9 h-9 rounded-xl bg-gradient-to-br ${cat.gradient} flex items-center justify-center text-white shadow-sm`}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      <h2 className="text-xl md:text-2xl font-bold tracking-tight">{cat.label}</h2>
                      <Badge variant="secondary">{items.length}</Badge>
                      <span className="text-xs text-muted-foreground hidden sm:inline">
                        · среднее ★ {catAvg}
                      </span>
                    </div>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setCategory(cat.key)}
                      className="text-xs"
                    >
                      Только {cat.label.toLowerCase()}
                    </Button>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                    {items.map((item) => (
                      <RatedCard key={item.key} item={item} />
                    ))}
                  </div>
                </section>
              );
            })}
          </div>
        ) : (
          /* Конкретная выбранная категория */
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {filteredAndSorted.map((item) => (
              <RatedCard key={item.key} item={item} />
            ))}
          </div>
        )}

        {loadingExtra && (
          <p className="text-xs text-muted-foreground text-center">
            Синхронизация дополнительных оценок...
          </p>
        )}
      </div>
    </div>
  );
}

function RatedCard({ item }: { item: RatedItem }) {
  const catLabel =
    CATEGORY_META.find((c) => c.key === item.contentType)?.singular || item.contentType;
  const statusLabel = item.status ? CONTENT_STATUS_CONFIG[item.status]?.label : null;

  return (
    <Link to={getItemLink(item.contentType, item.contentId)} className="group block">
      <Card className="overflow-hidden hover-lift relative h-full">
        <div className="aspect-[2/3] relative overflow-hidden bg-zinc-950">
          <PosterImage
            src={item.posterUrl}
            alt={item.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />

          {/* Бейдж категории слева сверху */}
          <span className="absolute top-2 left-2 z-10 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-black/70 text-white backdrop-blur-md border border-white/10">
            {catLabel}
          </span>

          {/* Кнопка действий (можно быстро поменять оценку или статус) */}
          <div className="absolute top-2 right-2 z-10 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-200">
            <ContentActionsButton
              contentId={item.contentId}
              contentType={item.contentType}
              top50MediaType={getTop50MediaType(item.contentType)}
              title={item.title}
              posterUrl={item.posterUrl || undefined}
              externalRating={item.externalRating}
              releaseYear={item.releaseYear}
              genre={item.genre}
            />
          </div>

          {/* Ваша оценка — главный акцентный бейдж */}
          <span
            className={`absolute bottom-2 right-2 z-10 ${ratingBadgeStyle(
              item.userRating
            )} text-sm font-bold px-2.5 py-0.5 rounded-md shadow-lg flex items-center gap-1`}
          >
            <Star className="w-3.5 h-3.5 fill-current" />
            {Number(item.userRating).toFixed(1).replace(/\.0$/, '')}
          </span>

          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent opacity-80 group-hover:opacity-100 transition-opacity" />

          <div className="absolute bottom-0 left-0 right-14 p-3">
            <h3 className="text-sm font-semibold text-white line-clamp-2 leading-snug">
              {item.title}
            </h3>
            <div className="flex items-center gap-1.5 mt-1 text-[11px] text-white/75 flex-wrap">
              {item.releaseYear && <span>{item.releaseYear}</span>}
              {statusLabel && (
                <>
                  {item.releaseYear && <span>·</span>}
                  <span className="truncate">{statusLabel}</span>
                </>
              )}
            </div>
          </div>
        </div>
      </Card>
    </Link>
  );
}
