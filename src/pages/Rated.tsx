import { useState, useEffect, useMemo } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
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
  User,
  Bookmark,
  Share2,
} from 'lucide-react';
import { useBookmarks } from '@/context/BookmarkContext';
import { useAppContext } from '@/context/AppContext';
import supabase from '@/lib/supabase';
import { loadUserRatedItems, RatedItem } from '@/services/ratedService';
import PosterImage from '@/components/PosterImage';
import ContentActionsButton from '@/components/ContentActionsButton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ContentType, CONTENT_STATUS_CONFIG } from '@/types/anime';
import { toast } from 'sonner';

type CategoryFilter = 'all' | 'movie' | 'series' | 'game' | 'anime';
type SortMode = 'rating_desc' | 'rating_asc' | 'recent' | 'title';

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
  const { targetUserId } = useParams<{ targetUserId?: string }>();
  const [searchParams] = useSearchParams();
  const queryUserId = searchParams.get('user') || targetUserId || null;

  const { user, profile: myProfile, loading: authLoading } = useAppContext();
  const { bookmarks, loading: bookmarksLoading } = useBookmarks();

  const [resolvedTarget, setResolvedTarget] = useState<{
    id: string;
    username: string;
    display_name: string | null;
    avatar_url: string | null;
  } | null>(null);
  const [targetNotFound, setTargetNotFound] = useState(false);
  const [resolvingTarget, setResolvingTarget] = useState(Boolean(queryUserId));

  const isOtherUser = Boolean(
    queryUserId &&
      queryUserId !== user?.id &&
      (!myProfile?.username || queryUserId.toLowerCase() !== myProfile.username.toLowerCase())
  );

  const [extraItems, setExtraItems] = useState<RatedItem[]>([]);
  const [loadingRemote, setLoadingRemote] = useState(false);

  const [category, setCategory] = useState<CategoryFilter>('all');
  const [sortBy, setSortBy] = useState<SortMode>('rating_desc');
  const [searchQuery, setSearchQuery] = useState('');

  // Определяем целевого пользователя, если открыт /rated/:username или /rated/:id
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
    let q = supabase.from('profiles').select('id, username, display_name, avatar_url');
    if (isUUID) {
      q = q.eq('id', queryUserId);
    } else {
      q = q.or(`username.ilike.${queryUserId},custom_slug.eq.${queryUserId}`);
    }

    q.maybeSingle().then(({ data }) => {
      if (!active) return;
      if (!data) {
        setResolvedTarget(null);
        setTargetNotFound(true);
      } else {
        setResolvedTarget(data);
        if (data.username && typeof window !== 'undefined') {
          const targetPath = `/rated/${data.username}`;
          if (window.location.pathname !== targetPath && (isUUID || window.location.pathname.includes(data.id))) {
            window.history.replaceState(null, '', targetPath);
          }
        }
      }
      setResolvingTarget(false);
    });

    return () => {
      active = false;
    };
  }, [queryUserId]);

  const effectiveUserId = isOtherUser ? resolvedTarget?.id || null : user?.id || null;

  // Свои оценённые из закладок (мгновенно из BookmarkContext)
  const myBookmarkRated = useMemo<RatedItem[]>(() => {
    if (isOtherUser) return [];
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
  }, [bookmarks, isOtherUser]);

  // Загружаем оценки целевого пользователя (или доп. оценки для своего)
  useEffect(() => {
    if (!effectiveUserId) {
      setExtraItems([]);
      return;
    }

    let cancelled = false;
    setLoadingRemote(true);

    loadUserRatedItems(effectiveUserId, isOtherUser ? [] : myBookmarkRated)
      .then((items) => {
        if (!cancelled) {
          setExtraItems(items);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoadingRemote(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [effectiveUserId, isOtherUser, myBookmarkRated]);

  const allRated = useMemo<RatedItem[]>(() => {
    if (isOtherUser) return extraItems;
    const map = new Map<string, RatedItem>();
    for (const item of myBookmarkRated) map.set(item.key, item);
    for (const item of extraItems) {
      if (!map.has(item.key)) map.set(item.key, item);
    }
    return Array.from(map.values());
  }, [isOtherUser, myBookmarkRated, extraItems]);

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

  const handle = isOtherUser
    ? resolvedTarget?.username || resolvedTarget?.id
    : myProfile?.username || user?.id;
  const profilePath = handle ? (resolvedTarget?.username || (!isOtherUser && myProfile?.username) ? `/${handle}` : `/profile/${handle}`) : '/';
  const bookmarksPath = handle ? `/bookmarks/${handle}` : '/bookmarks';
  const shareUrl = typeof window !== 'undefined' && handle ? `${window.location.origin}/rated/${handle}` : '';

  const loading =
    (!isOtherUser && authLoading) ||
    resolvingTarget ||
    (loadingRemote && allRated.length === 0) ||
    (!isOtherUser && !!user && bookmarksLoading && allRated.length === 0);

  if (!isOtherUser && !authLoading && !user) {
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

  if (isOtherUser && !resolvingTarget && targetNotFound) {
    return (
      <div className="container mx-auto px-4 py-16">
        <Card className="max-w-md mx-auto p-8 text-center">
          <h1 className="text-2xl font-bold mb-2">Пользователь не найден</h1>
          <p className="text-sm text-muted-foreground mb-6">
            Не удалось найти оценки пользователя «{queryUserId}».
          </p>
          <Button asChild variant="secondary">
            <Link to="/">На главную</Link>
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 py-8 space-y-7">
        {/* Заголовок + удобные переходники */}
        <div className="relative overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-amber-500/15 via-primary/10 to-background p-6 md:p-8 space-y-5">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div className="flex items-center gap-4 min-w-0">
              {isOtherUser && resolvedTarget && (
                <Link to={profilePath} className="shrink-0">
                  <Avatar className="w-16 h-16 md:w-20 md:h-20 border-2 border-amber-400/40">
                    <AvatarImage src={resolvedTarget.avatar_url || undefined} />
                    <AvatarFallback className="text-xl font-bold">
                      {(resolvedTarget.username || 'U')[0].toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </Link>
              )}
              <div className="min-w-0">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/30 mb-3">
                  <Star className="w-3.5 h-3.5 fill-amber-400" />
                  {isOtherUser
                    ? `Оценки пользователя @${resolvedTarget?.username || 'user'}`
                    : 'Личные оценки'}
                </div>
                <h1 className="text-3xl md:text-4xl font-bold tracking-tight truncate">
                  {isOtherUser
                    ? resolvedTarget?.display_name || resolvedTarget?.username || 'Оценённые'
                    : 'Оценённые'}
                </h1>
                <p className="text-muted-foreground mt-1 text-sm md:text-base">
                  {isOtherUser
                    ? 'Все оценки пользователя по категориям: фильмы, сериалы, игры и аниме'
                    : 'Всё, что вы оценили — по категориям: фильмы, сериалы, игры и аниме'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 flex-wrap shrink-0">
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

          {/* Удобные переходники между Профилем / Закладками / Оценками */}
          {handle && (
            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-white/10">
              <Button asChild variant="secondary" size="sm" className="rounded-full gap-1.5">
                <Link to={profilePath}>
                  <User className="w-3.5 h-3.5" />
                  {isOtherUser ? 'Профиль' : 'Мой профиль'}
                </Link>
              </Button>
              <Button asChild variant="secondary" size="sm" className="rounded-full gap-1.5">
                <Link to={bookmarksPath}>
                  <Bookmark className="w-3.5 h-3.5 text-emerald-400" />
                  {isOtherUser ? 'Закладки пользователя' : 'Мои закладки'}
                </Link>
              </Button>
              {shareUrl && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="rounded-full gap-1.5"
                  onClick={() => {
                    navigator.clipboard?.writeText(shareUrl);
                    toast.success('Ссылка на оценки скопирована');
                  }}
                >
                  <Share2 className="w-3.5 h-3.5" />
                  Поделиться оценками
                </Button>
              )}
            </div>
          )}
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
              {allRated.length === 0
                ? isOtherUser
                  ? 'У пользователя пока нет оценённых тайтлов'
                  : 'Пока нет оценённых тайтлов'
                : 'В этой категории ничего не найдено'}
            </h2>
            <p className="text-sm text-muted-foreground max-w-md mx-auto mb-6">
              {allRated.length === 0
                ? isOtherUser
                  ? 'Когда пользователь оценит фильмы, сериалы или игры, они появятся здесь.'
                  : 'Ставьте оценки фильмам, сериалам и играм через кнопку действий или рейтинг — они автоматически появятся здесь.'
                : 'Попробуйте выбрать другую категорию или изменить поисковый запрос.'}
            </p>
            {!isOtherUser && (
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
            )}
          </Card>
        ) : category === 'all' ? (
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
                      <RatedCard key={item.key} item={item} readOnly={isOtherUser} />
                    ))}
                  </div>
                </section>
              );
            })}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {filteredAndSorted.map((item) => (
              <RatedCard key={item.key} item={item} readOnly={isOtherUser} />
            ))}
          </div>
        )}

        {loadingRemote && allRated.length > 0 && (
          <p className="text-xs text-muted-foreground text-center">
            Синхронизация дополнительных оценок...
          </p>
        )}
      </div>
    </div>
  );
}

function RatedCard({ item, readOnly }: { item: RatedItem; readOnly: boolean }) {
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

          <span className="absolute top-2 left-2 z-10 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-black/70 text-white backdrop-blur-md border border-white/10">
            {catLabel}
          </span>

          {!readOnly && (
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
          )}

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
