import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Film,
  Tv,
  Gamepad2,
  UserCheck,
  Building2,
  Users,
  Bookmark,
  Compass,
  ArrowRight,
  SearchX,
  Star,
  Layers,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import PosterImage from '@/components/PosterImage';
import MovieCard from '@/components/MovieCard';
import SeriesCard from '@/components/SeriesCard';
import GameCard from '@/components/GameCard';
import { CONTENT_STATUS_CONFIG, ContentBookmark } from '@/types/anime';
import { GlobalSearchResultsData } from '@/services/globalSearchService';

type CategoryKey =
  | 'all'
  | 'movies'
  | 'series'
  | 'games'
  | 'people'
  | 'studios'
  | 'profiles'
  | 'bookmarks'
  | 'extras';

interface GlobalSearchResultsProps {
  query: string;
  loading: boolean;
  results: GlobalSearchResultsData;
  onClear: () => void;
}

function getBookmarkLink(b: ContentBookmark): string {
  if (b.contentType === 'movie' || b.contentType === 'anime') return `/movie/${b.contentId}`;
  if (b.contentType === 'series') return `/series/${b.contentId}`;
  if (b.contentType === 'game') return `/game/${b.contentId}`;
  return '/bookmarks';
}

const PREVIEW_MEDIA_COUNT = 7;
const PREVIEW_ENTITY_COUNT = 6;

export default function GlobalSearchResults({
  query,
  loading,
  results,
  onClear,
}: GlobalSearchResultsProps) {
  const [activeCategory, setActiveCategory] = useState<CategoryKey>('all');

  const counts = useMemo(
    () => ({
      movies: results.movies.length,
      series: results.series.length,
      games: results.games.length,
      people: results.people.length,
      studios: results.studios.length,
      profiles: results.profiles.length,
      bookmarks: results.bookmarks.length,
      extras: results.extras.length,
    }),
    [results]
  );

  const totalCount =
    counts.movies +
    counts.series +
    counts.games +
    counts.people +
    counts.studios +
    counts.profiles +
    counts.bookmarks +
    counts.extras;

  const categories: Array<{ key: CategoryKey; label: string; count: number; icon: any }> = [
    { key: 'all', label: 'Все', count: totalCount, icon: Layers },
    { key: 'movies', label: 'Фильмы', count: counts.movies, icon: Film },
    { key: 'series', label: 'Сериалы', count: counts.series, icon: Tv },
    { key: 'games', label: 'Игры', count: counts.games, icon: Gamepad2 },
    { key: 'people', label: 'Персоны', count: counts.people, icon: UserCheck },
    { key: 'studios', label: 'Студии', count: counts.studios, icon: Building2 },
    { key: 'profiles', label: 'Пользователи', count: counts.profiles, icon: Users },
    { key: 'bookmarks', label: 'Закладки', count: counts.bookmarks, icon: Bookmark },
    { key: 'extras', label: 'Разделы и коллекции', count: counts.extras, icon: Compass },
  ];

  // Если выбранная вкладка опустела после нового запроса — сбрасываем на 'all'
  const effectiveCategory: CategoryKey =
    activeCategory === 'all' || counts[activeCategory] > 0 ? activeCategory : 'all';

  const showSection = (key: Exclude<CategoryKey, 'all'>) =>
    counts[key] > 0 && (effectiveCategory === 'all' || effectiveCategory === key);

  return (
    <section className="mb-14 space-y-6" aria-live="polite">
      {/* Заголовок результатов */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight">
            Результаты поиска: <span className="text-primary">«{query}»</span>
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            {loading
              ? 'Ищем по фильмам, сериалам, играм, персонам, студиям, пользователям и разделам...'
              : `Найдено совпадений: ${totalCount}`}
          </p>
        </div>

        <Button variant="outline" size="sm" onClick={onClear} className="rounded-xl">
          Сбросить поиск
        </Button>
      </div>

      {/* Фильтр-пилюли по категориям */}
      {(loading || totalCount > 0) && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
          {categories
            .filter((c) => c.key === 'all' || c.count > 0)
            .map(({ key, label, count, icon: Icon }) => {
              const isActive = effectiveCategory === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setActiveCategory(key)}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs sm:text-sm font-medium whitespace-nowrap shrink-0 transition-all border ${
                    isActive
                      ? 'bg-primary text-primary-foreground border-primary shadow-md'
                      : 'bg-card/80 border-border text-muted-foreground hover:text-foreground hover:bg-muted'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{label}</span>
                  <span
                    className={`ml-0.5 px-1.5 py-0.2 rounded-full text-[11px] font-semibold ${
                      isActive ? 'bg-black/20 text-primary-foreground' : 'bg-muted text-foreground/80'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
        </div>
      )}

      {/* Скелетон загрузки */}
      {loading && totalCount === 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-7 gap-4">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="aspect-[2/3] rounded-xl bg-muted animate-pulse" />
          ))}
        </div>
      )}

      {/* Пустой результат */}
      {!loading && totalCount === 0 && (
        <Card className="p-10 text-center border-dashed">
          <SearchX className="w-12 h-12 mx-auto text-muted-foreground/60 mb-3" />
          <h3 className="text-lg font-semibold mb-1">Ничего не найдено</h3>
          <p className="text-sm text-muted-foreground max-w-md mx-auto mb-5">
            По запросу «{query}» не нашлось фильмов, сериалов, игр, персон, студий, пользователей или разделов. Попробуйте изменить формулировку.
          </p>
          <Button variant="secondary" onClick={onClear}>
            Очистить запрос
          </Button>
        </Card>
      )}

      {/* Разделы и коллекции (быстрая навигация сверху, если совпало) */}
      {showSection('extras') && (
        <div className="space-y-3">
          <SectionHeader
            icon={Compass}
            title="Разделы сайта, Watch, топы и подборки"
            count={counts.extras}
            showAll={effectiveCategory === 'all' && counts.extras > PREVIEW_ENTITY_COUNT}
            onShowAll={() => setActiveCategory('extras')}
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {(effectiveCategory === 'all'
              ? results.extras.slice(0, PREVIEW_ENTITY_COUNT)
              : results.extras
            ).map((item) => (
              <Link key={item.key} to={item.to} className="group">
                <Card className="p-3.5 h-full flex items-center justify-between gap-3 hover:border-primary/50 hover:bg-card/90 transition-all">
                  <div className="flex items-center gap-3 min-w-0">
                    {item.imageUrl ? (
                      <img
                        src={item.imageUrl}
                        alt={item.title}
                        className="w-10 h-14 object-cover rounded-md shrink-0 bg-muted"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                        <Compass className="w-5 h-5" />
                      </div>
                    )}
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-sm truncate group-hover:text-primary transition-colors">
                          {item.title}
                        </p>
                        <Badge variant={item.isBeta ? 'secondary' : 'outline'} className="text-[10px] shrink-0">
                          {item.badge}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{item.subtitle}</p>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0" />
                </Card>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Закладки пользователя */}
      {showSection('bookmarks') && (
        <div className="space-y-3">
          <SectionHeader
            icon={Bookmark}
            title="В ваших закладках"
            count={counts.bookmarks}
            showAll={effectiveCategory === 'all' && counts.bookmarks > PREVIEW_ENTITY_COUNT}
            onShowAll={() => setActiveCategory('bookmarks')}
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {(effectiveCategory === 'all'
              ? results.bookmarks.slice(0, PREVIEW_ENTITY_COUNT)
              : results.bookmarks
            ).map((bm) => {
              const statusCfg = CONTENT_STATUS_CONFIG[bm.status];
              return (
                <Link key={bm.id} to={getBookmarkLink(bm)} className="group">
                  <Card className="p-3 h-full flex items-center gap-3 hover:border-primary/50 transition-all">
                    <div className="w-12 h-16 rounded-lg overflow-hidden shrink-0 bg-zinc-900">
                      <PosterImage src={bm.posterUrl} alt={bm.title} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-sm truncate group-hover:text-primary transition-colors">
                        {bm.title}
                      </p>
                      <div className="flex flex-wrap items-center gap-1.5 mt-1">
                        {statusCfg && (
                          <Badge variant="secondary" className="text-[10px]">
                            {statusCfg.label}
                          </Badge>
                        )}
                        {bm.releaseYear && (
                          <span className="text-xs text-muted-foreground">{bm.releaseYear}</span>
                        )}
                        {bm.userRating > 0 && (
                          <span className="inline-flex items-center gap-0.5 text-xs text-yellow-500 font-medium">
                            <Star className="w-3 h-3 fill-yellow-500" />
                            {bm.userRating}
                          </span>
                        )}
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary shrink-0" />
                  </Card>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Фильмы */}
      {showSection('movies') && (
        <div className="space-y-3">
          <SectionHeader
            icon={Film}
            title="Фильмы"
            count={counts.movies}
            showAll={effectiveCategory === 'all' && counts.movies > PREVIEW_MEDIA_COUNT}
            onShowAll={() => setActiveCategory('movies')}
          />
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-7 gap-4">
            {(effectiveCategory === 'all'
              ? results.movies.slice(0, PREVIEW_MEDIA_COUNT)
              : results.movies
            ).map((movie) => (
              <MovieCard key={movie.id} movie={movie} />
            ))}
          </div>
        </div>
      )}

      {/* Сериалы */}
      {showSection('series') && (
        <div className="space-y-3">
          <SectionHeader
            icon={Tv}
            title="Сериалы"
            count={counts.series}
            showAll={effectiveCategory === 'all' && counts.series > PREVIEW_MEDIA_COUNT}
            onShowAll={() => setActiveCategory('series')}
          />
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-7 gap-4">
            {(effectiveCategory === 'all'
              ? results.series.slice(0, PREVIEW_MEDIA_COUNT)
              : results.series
            ).map((series) => (
              <SeriesCard key={series.id} series={series} />
            ))}
          </div>
        </div>
      )}

      {/* Игры */}
      {showSection('games') && (
        <div className="space-y-3">
          <SectionHeader
            icon={Gamepad2}
            title="Игры"
            count={counts.games}
            showAll={effectiveCategory === 'all' && counts.games > PREVIEW_MEDIA_COUNT}
            onShowAll={() => setActiveCategory('games')}
          />
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-7 gap-4">
            {(effectiveCategory === 'all'
              ? results.games.slice(0, PREVIEW_MEDIA_COUNT)
              : results.games
            ).map((game) => (
              <GameCard key={game.id} game={game} />
            ))}
          </div>
        </div>
      )}

      {/* Персоны (актёры, режиссёры) */}
      {showSection('people') && (
        <div className="space-y-3">
          <SectionHeader
            icon={UserCheck}
            title="Персоны (актёры и режиссёры)"
            count={counts.people}
            showAll={effectiveCategory === 'all' && counts.people > PREVIEW_ENTITY_COUNT}
            onShowAll={() => setActiveCategory('people')}
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {(effectiveCategory === 'all'
              ? results.people.slice(0, PREVIEW_ENTITY_COUNT)
              : results.people
            ).map((person) => (
              <Link key={person.id} to={`/person/${person.id}`} className="group">
                <Card className="p-3.5 h-full flex items-center gap-3.5 hover:border-primary/50 transition-all">
                  <Avatar className="h-14 w-14 rounded-xl shrink-0">
                    <AvatarImage src={person.photoUrl || undefined} className="object-cover" />
                    <AvatarFallback className="rounded-xl">
                      {person.name.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-sm truncate group-hover:text-primary transition-colors">
                      {person.name}
                    </p>
                    <p className="text-xs text-primary/80">{person.department}</p>
                    {person.knownFor && (
                      <p className="text-xs text-muted-foreground truncate mt-0.5">{person.knownFor}</p>
                    )}
                  </div>
                  <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary shrink-0" />
                </Card>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Студии (кинокомпании и игровые студии) */}
      {showSection('studios') && (
        <div className="space-y-3">
          <SectionHeader
            icon={Building2}
            title="Киностудии и разработчики игр"
            count={counts.studios}
            showAll={effectiveCategory === 'all' && counts.studios > PREVIEW_ENTITY_COUNT}
            onShowAll={() => setActiveCategory('studios')}
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {(effectiveCategory === 'all'
              ? results.studios.slice(0, PREVIEW_ENTITY_COUNT)
              : results.studios
            ).map((studio) => (
              <Link key={studio.key} to={studio.to} className="group">
                <Card className="p-3.5 h-full flex items-center gap-3.5 hover:border-primary/50 transition-all">
                  <div className="w-12 h-12 rounded-xl bg-muted/60 border border-border flex items-center justify-center overflow-hidden shrink-0 p-1">
                    {studio.imageUrl ? (
                      <img
                        src={studio.imageUrl}
                        alt={studio.name}
                        className="w-full h-full object-contain rounded-lg"
                      />
                    ) : (
                      <Building2 className="w-5 h-5 text-muted-foreground" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-sm truncate group-hover:text-primary transition-colors">
                      {studio.name}
                    </p>
                    <p className="text-xs text-muted-foreground truncate mt-0.5">{studio.meta}</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary shrink-0" />
                </Card>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Пользователи сайта */}
      {showSection('profiles') && (
        <div className="space-y-3">
          <SectionHeader
            icon={Users}
            title="Пользователи"
            count={counts.profiles}
            showAll={effectiveCategory === 'all' && counts.profiles > PREVIEW_ENTITY_COUNT}
            onShowAll={() => setActiveCategory('profiles')}
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {(effectiveCategory === 'all'
              ? results.profiles.slice(0, PREVIEW_ENTITY_COUNT)
              : results.profiles
            ).map((user) => {
              const userHandle = user.username || user.id;
              return (
                <Card key={user.id} className="p-3.5 h-full flex flex-col justify-between gap-3 hover:border-primary/50 transition-all">
                  <Link to={user.to} className="group flex items-center gap-3.5 min-w-0">
                    <Avatar className="h-12 w-12 shrink-0">
                      <AvatarImage src={user.avatarUrl || undefined} />
                      <AvatarFallback>
                        {(user.displayName || user.username || 'U')[0].toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-sm truncate group-hover:text-primary transition-colors">
                          {user.displayName || user.username || 'Пользователь'}
                        </p>
                        <Badge variant="outline" className="text-[10px] shrink-0">
                          Ур. {user.level}
                        </Badge>
                      </div>
                      {user.username && (
                        <p className="text-xs text-muted-foreground truncate">@{user.username}</p>
                      )}
                      {user.bio && (
                        <p className="text-xs text-muted-foreground/80 truncate mt-0.5">{user.bio}</p>
                      )}
                    </div>
                    <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary shrink-0" />
                  </Link>

                  <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-border/60">
                    <Link
                      to={user.to}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium bg-muted/70 hover:bg-primary/15 hover:text-primary transition-colors"
                    >
                      Профиль
                    </Link>
                    <Link
                      to={`/bookmarks/${userHandle}`}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-colors"
                    >
                      <Bookmark className="w-3 h-3" />
                      Закладки
                    </Link>
                    <Link
                      to={`/rated/${userHandle}`}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 transition-colors"
                    >
                      <Star className="w-3 h-3" />
                      Оценки
                    </Link>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}

function SectionHeader({
  icon: Icon,
  title,
  count,
  showAll,
  onShowAll,
}: {
  icon: any;
  title: string;
  count: number;
  showAll: boolean;
  onShowAll: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-2">
      <div className="flex items-center gap-2">
        <Icon className="w-5 h-5 text-primary" />
        <h3 className="text-lg md:text-xl font-bold tracking-tight">{title}</h3>
        <Badge variant="secondary" className="text-xs">
          {count}
        </Badge>
      </div>
      {showAll && (
        <Button variant="ghost" size="sm" onClick={onShowAll} className="text-xs gap-1">
          Показать все ({count})
          <ArrowRight className="w-3.5 h-3.5" />
        </Button>
      )}
    </div>
  );
}
