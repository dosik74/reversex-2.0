import { useState, useEffect, useMemo, useRef } from "react";
import { Link } from "react-router-dom";
import MovieCard from "@/components/MovieCard";
import ContentActionsButton from "@/components/ContentActionsButton";
import CatalogFilterBar from "@/components/CatalogFilterBar";
import CinemaNav from "@/components/CinemaNav";
import PosterRow from "@/components/PosterRow";
import { SortOption, GenreFilter, GENRE_TMDB_IDS, GENRE_LIST } from "@/components/MovieSortFilter";
import { claimExclusive, dedupeById } from "@/utils/dedupe";
import { useScrollRestore } from "@/hooks/useScrollRestore";
import { getPopularMovies, searchMovies, getTopRatedMovies } from "@/utils/tmdbApi";
import { useTranslation } from "react-i18next";
import { ContentStatus } from "@/types/anime";
import supabase from "@/lib/supabase";

interface Movie {
  id: number;
  title: string;
  year: string;
  rating: number;
  votes?: number;
  poster: string;
  backdrop?: string;
  description: string;
  rank?: number;
  genre_ids?: number[];
}

/** genre_ids → русские названия чипсов (для hero-мета) */
const genreNames = (ids?: number[], limit = 3): string[] => {
  if (!ids?.length) return [];
  const names: string[] = [];
  for (const g of GENRE_LIST) {
    const tmdbIds = GENRE_TMDB_IDS[g.id]?.movie || [];
    if (ids.some((id) => tmdbIds.includes(id))) {
      names.push(g.name);
      if (names.length >= limit) break;
    }
  }
  return names;
};

const MOVIES_PER_PAGE = 20;

const Movies = () => {
  const { t } = useTranslation();
  const observerTarget = useRef<HTMLDivElement>(null);
  
  const [tab, setTab] = useState<'trending' | 'top1000'>('trending');
  const [allMovies, setAllMovies] = useState<Movie[]>([]);
  const [displayMovies, setDisplayMovies] = useState<Movie[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<ContentStatus | 'all'>('all');
  const [sortBy, setSortBy] = useState<SortOption>('popularity');
  const [genreFilter, setGenreFilter] = useState<GenreFilter>('all');
  const [userBookmarks, setUserBookmarks] = useState<Set<string>>(new Set());

  // Restore scroll after content loads
  useScrollRestore(!loading ? 0 : 50);

  // Load user bookmarks
  useEffect(() => {
    loadUserBookmarks();
  }, []);

  const loadUserBookmarks = async () => {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user?.id) return;

      const { data } = await supabase
        .from('content_bookmarks')
        .select('content_id')
        .eq('user_id', user.user.id)
        .eq('content_type', 'movie');

      if (data) {
        setUserBookmarks(new Set(data.map((item: any) => item.content_id.toString())));
      }
    } catch (error) {
      console.error('Error loading bookmarks:', error);
    }
  };

  // Infinite scroll observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading && !isSearching) {
          loadMore();
        }
      },
      { threshold: 0.1 }
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => {
      if (observerTarget.current) {
        observer.unobserve(observerTarget.current);
      }
    };
  }, [hasMore, loading, isSearching, page]);

  useEffect(() => {
    if (tab === 'trending') {
      fetchPopularMovies();
    } else {
      fetchAllTop1000Movies();
    }
    setSearchQuery("");
  }, [tab]);

  // Apply filters and sorting to all movies
  const filteredAndSortedMovies = useMemo(() => {
    let result = allMovies;

    // Apply category filter
    if (selectedCategory !== 'all') {
      result = result.filter(movie => {
        // TODO: Filter by user's movie list status once implemented
        return true;
      });
    }

    // Apply genre filter (real TMDB genre_ids)
    if (genreFilter !== 'all') {
      const tmdbIds = GENRE_TMDB_IDS[genreFilter]?.movie || [];
      result = result.filter(movie => movie.genre_ids?.some(id => tmdbIds.includes(id)));
    }

    // Apply sorting
    result = [...result].sort((a, b) => {
      switch (sortBy) {
        case 'rating':
          return b.rating - a.rating;
        case 'title':
          return a.title.localeCompare(b.title);
        case 'year':
          return parseInt(b.year) - parseInt(a.year);
        case 'popularity':
        default:
          return (a.rank || 0) - (b.rank || 0) || 0;
      }
    });

    return result;
  }, [allMovies, selectedCategory, sortBy, genreFilter]);

  // Initialize display when allMovies loads (skip if grid already populated — background pages keep appending)
  useEffect(() => {
    if (allMovies.length > 0 && displayMovies.length === 0) {
      setDisplayMovies(filteredAndSortedMovies.slice(0, MOVIES_PER_PAGE));
      setPage(1);
      setHasMore(filteredAndSortedMovies.length > MOVIES_PER_PAGE);
    }
  }, [allMovies.length]);

  useEffect(() => {
    if (searchQuery.trim()) {
      handleSearch(searchQuery);
    } else {
      // Apply filtered and sorted movies
      setDisplayMovies(filteredAndSortedMovies.slice(0, MOVIES_PER_PAGE));
      setPage(1);
      setHasMore(filteredAndSortedMovies.length > MOVIES_PER_PAGE);
      setIsSearching(false);
    }
  }, [searchQuery, selectedCategory, sortBy, genreFilter]);

  const fetchPopularMovies = async () => {
    try {
      setLoading(true);
      const all: Movie[] = [];
      const seen = new Set<number>(); // страницы TMDB пересекаются — режем дубли на входе
      const TOTAL_PAGES = 25; // ~500 movies

      for (let pageNum = 1; pageNum <= TOTAL_PAGES; pageNum++) {
        try {
          const { movies } = await getPopularMovies(pageNum);
          if (movies.length === 0) break;

          const transformedMovies: Movie[] = movies
            .filter(m => m.poster_path && !seen.has(m.id))
            .map(m => ({
              id: m.id,
              title: m.title,
              year: m.release_date?.split('-')[0] || 'Unknown',
              rating: Math.round(m.vote_average * 10) / 10,
              votes: m.vote_count || 0,
              poster: `https://image.tmdb.org/t/p/w342${m.poster_path}`,
              backdrop: m.backdrop_path ? `https://image.tmdb.org/t/p/w1280${m.backdrop_path}` : undefined,
              description: m.overview || '',
              genre_ids: m.genre_ids || []
            }));
          transformedMovies.forEach(m => seen.add(m.id));

          all.push(...transformedMovies);

          // Progressive render: UI is usable after first pages, rest loads in background
          if (pageNum >= 3) setLoading(false);
          setAllMovies([...all]);

          await new Promise(resolve => setTimeout(resolve, 120));
        } catch (err) {
          console.warn(`Failed to load page ${pageNum}:`, err);
          break;
        }
      }

      setAllMovies([...all]);
    } catch (error) {
      console.error('Error fetching movies:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllTop1000Movies = async () => {
    try {
      setLoading(true);
      let allTopMovies: Movie[] = [];
      const seen = new Set<number>();

      // Fetch multiple pages to get ~1000 top-rated movies
      for (let pageNum = 1; pageNum <= 50; pageNum++) {
        try {
          const { movies } = await getTopRatedMovies(pageNum);

          const transformedMovies: Movie[] = movies
            .filter(m => m.poster_path && m.vote_count > 500 && !seen.has(m.id))
            .map((m, idx) => ({
              id: m.id,
              title: m.title,
              year: m.release_date?.split('-')[0] || 'Unknown',
              rating: Math.round(m.vote_average * 10) / 10,
              votes: m.vote_count || 0,
              poster: `https://image.tmdb.org/t/p/w342${m.poster_path}`,
              backdrop: m.backdrop_path ? `https://image.tmdb.org/t/p/w1280${m.backdrop_path}` : undefined,
              description: m.overview || '',
              genre_ids: m.genre_ids || [],
              rank: allTopMovies.length + idx + 1
            }));
          transformedMovies.forEach(m => seen.add(m.id));

          allTopMovies = [...allTopMovies, ...transformedMovies];
          
          // Stop if we have enough movies or reached the end
          if (allTopMovies.length >= 1000 || movies.length === 0) {
            break;
          }
        } catch (error) {
          console.error(`Error fetching page ${pageNum}:`, error);
          break;
        }
      }

      // Trim to exactly 1000 or less
      allTopMovies = allTopMovies.slice(0, 1000);

      setAllMovies(allTopMovies);
      setDisplayMovies(allTopMovies.slice(0, MOVIES_PER_PAGE));
      setHasMore(allTopMovies.length > MOVIES_PER_PAGE);
    } catch (error) {
      console.error('Error fetching top movies:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (query: string) => {
    if (!query.trim()) {
      setIsSearching(false);
      return;
    }

    try {
      setIsSearching(true);
      setLoading(true);
      const { movies } = await searchMovies(query, 1);
      
      const transformedMovies: Movie[] = dedupeById(movies
        .filter(m => m.poster_path)
        .map(m => ({
          id: m.id,
          title: m.title,
          year: m.release_date?.split('-')[0] || 'Unknown',
          rating: Math.round(m.vote_average * 10) / 10,
          votes: m.vote_count || 0,
          poster: `https://image.tmdb.org/t/p/w342${m.poster_path}`,
          backdrop: m.backdrop_path ? `https://image.tmdb.org/t/p/w1280${m.backdrop_path}` : undefined,
          description: m.overview || '',
          genre_ids: m.genre_ids || []
        })));

      setAllMovies(transformedMovies);
      setDisplayMovies(transformedMovies.slice(0, MOVIES_PER_PAGE));
      setPage(1);
      setHasMore(transformedMovies.length > MOVIES_PER_PAGE);
    } catch (error) {
      console.error('Error searching movies:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMore = () => {
    const nextPage = page + 1;
    const start = page * MOVIES_PER_PAGE;
    const end = start + MOVIES_PER_PAGE;

    const source = filteredAndSortedMovies;
    setDisplayMovies((prev) => [...prev, ...source.slice(start, end)]);
    setPage(nextPage);
    setHasMore(end < source.length);
  };

  // Kinopoisk-style rows mode: no active filters/search, trending tab
  const rowsMode = tab === 'trending' && !searchQuery.trim() && genreFilter === 'all' && selectedCategory === 'all';

  const renderMovie = (movie: Movie) => <MovieCard movie={movie} />;

  // ── Эксклюзивные ряды одним проходом: каждый фильм живёт ровно
  // в одном ряду — ни по id, ни по базе названия («Обитель зла» vs
  // «Обитель зла: Раккун-Сити») повторов нет ──
  const rails = useMemo(() => {
    const usedIds = new Set<number | string>();
    const usedTitles = new Set<string>();
    const idOf = (m: Movie) => m.id;
    const titleOf = (m: Movie) => m.title;
    const topTen = claimExclusive(allMovies, 10, usedIds, usedTitles, idOf, titleOf);
    const topRated = claimExclusive(
      [...allMovies].sort((a, b) => b.rating - a.rating),
      20, usedIds, usedTitles, idOf, titleOf,
    );
    const genreRows = GENRE_LIST.map((g) => {
      const tmdbIds = GENRE_TMDB_IDS[g.id]?.movie || [];
      const items = claimExclusive(
        allMovies.filter((m) => m.genre_ids?.some((id) => tmdbIds.includes(id))),
        30, usedIds, usedTitles, idOf, titleOf,
      );
      return { ...g, items };
    }).filter((r) => r.items.length >= 6);
    return { topTen, topRated, genreRows };
  }, [allMovies]);
  const { topTen, topRated: topRatedMovies, genreRows } = rails;

  // ── Billboard hero: витрина топ-10 (как билборд КП — spotlight, не ряд) ──
  const featured = useMemo(() => {
    const fromTop = topTen.filter((m) => m.backdrop).slice(0, 5);
    if (fromTop.length > 0) return fromTop;
    return allMovies.filter((m) => m.backdrop).slice(0, 5);
  }, [topTen, allMovies]);
  const [heroIdx, setHeroIdx] = useState(0);
  useEffect(() => { setHeroIdx(0); }, [tab]);
  useEffect(() => {
    if (featured.length < 2) return;
    const id = setInterval(() => setHeroIdx((i) => (i + 1) % featured.length), 7000);
    return () => clearInterval(id);
  }, [featured.length, tab]);
  const hero = featured.length ? featured[heroIdx % featured.length] : undefined;
  const heroGenres = useMemo(() => genreNames(hero?.genre_ids), [hero]);

  const filtersActive = selectedCategory !== 'all' || sortBy !== 'popularity' || genreFilter !== 'all';

  return (
    <div className="min-h-screen">
      <style>{`
        .mv-hero-img { animation: mv-zoom 7.5s ease-out both; }
        @keyframes mv-zoom { from { transform: scale(1.09); } to { transform: scale(1); } }
        .mv-hero-text { animation: mv-rise .55s cubic-bezier(.16,1,.3,1) both; }
        @keyframes mv-rise { from { opacity: 0; transform: translateY(18px); } to { opacity: 1; transform: none; } }
        .mv-num { color: transparent; -webkit-text-stroke: 2px hsl(var(--foreground) / 0.85); }
        .dark .mv-num { -webkit-text-stroke: 2px rgba(255,255,255,0.85); }
      `}</style>
      <div className="container mx-auto px-4 py-8">
        <CinemaNav active="movies" />

        {/* ── Billboard hero: тёмная кинозал-карточка в обеих темах ── */}
        {loading && featured.length === 0 ? (
          <div className="relative overflow-hidden rounded-[1.75rem] border border-border bg-zinc-950 min-h-[380px] md:min-h-[460px] animate-pulse">
            <div className="absolute bottom-0 p-6 md:p-10 space-y-3">
              <div className="h-4 w-40 rounded bg-white/10" />
              <div className="h-10 w-80 max-w-full rounded-lg bg-white/10" />
              <div className="h-4 w-64 max-w-full rounded bg-white/10" />
            </div>
          </div>
        ) : hero ? (
          <section className="relative overflow-hidden rounded-[1.75rem] border border-white/10 bg-zinc-950 text-white shadow-[0_30px_80px_-30px_rgba(0,0,0,0.7)]">
            {/* backdrop */}
            {featured.map((m, i) => (
              <img
                key={m.id}
                src={m.backdrop}
                alt=""
                aria-hidden
                className={`absolute inset-0 w-full h-full object-cover object-top transition-opacity duration-1000 ${
                  i === heroIdx % featured.length ? 'opacity-100 mv-hero-img' : 'opacity-0'
                }`}
                loading={i === 0 ? 'eager' : 'lazy'}
              />
            ))}
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/55 to-black/5 pointer-events-none" />
            <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/35 to-transparent pointer-events-none" />
            {/* контент */}
            <div key={hero.id} className="relative px-5 md:px-10 pt-16 md:pt-20 pb-16 md:pb-14 max-w-3xl">
              <div className="mv-hero-text">
                <span className="inline-block rounded-full bg-amber-400 text-black text-[13px] font-extrabold tracking-normal px-3.5 py-1.5 shadow-lg shadow-amber-500/30">
                  № {(heroIdx % featured.length) + 1} в тренде
                </span>
              </div>
              <h1
                className="mv-hero-text font-black tracking-tight leading-[0.95] text-4xl sm:text-5xl lg:text-6xl mt-4 [text-wrap:balance]"
                style={{ animationDelay: '60ms' }}
              >
                {hero.title}
              </h1>
              <div className="mv-hero-text flex flex-wrap items-center gap-x-3 gap-y-2 mt-4 text-sm" style={{ animationDelay: '120ms' }}>
                <span className="font-black text-amber-300">
                  {hero.rating.toFixed(1)}
                </span>
                {hero.votes ? <span className="text-white/50 text-xs font-semibold">{hero.votes.toLocaleString('ru-RU')} оценок</span> : null}
                <span className="text-white/30">•</span>
                <span className="font-semibold text-white/85">{hero.year}</span>
                {heroGenres.map((g) => (
                  <span key={g} className="rounded-full border border-white/20 bg-white/10 backdrop-blur px-2.5 py-0.5 text-xs font-semibold text-white/85">
                    {g}
                  </span>
                ))}
              </div>
              {hero.description && (
                <p className="mv-hero-text mt-3 max-w-xl text-sm md:text-[15px] leading-relaxed text-white/70 line-clamp-2 md:line-clamp-3" style={{ animationDelay: '180ms' }}>
                  {hero.description}
                </p>
              )}
              <div className="mv-hero-text flex flex-wrap items-center gap-2.5 mt-6" style={{ animationDelay: '240ms' }}>
                <Link
                  to={`/movie/${hero.id}`}
                  className="inline-flex items-center h-11 px-6 rounded-full bg-gradient-to-b from-amber-300 to-amber-500 text-black text-sm font-black shadow-[0_10px_30px_-8px_rgba(251,191,36,0.7)] hover:brightness-110 active:scale-95 transition-all"
                >
                  Смотреть
                </Link>
                <Link
                  to={`/movie/${hero.id}`}
                  className="inline-flex items-center h-11 px-5 rounded-full border border-white/20 bg-white/10 backdrop-blur text-sm font-bold text-white hover:bg-white/20 active:scale-95 transition-all"
                >
                  Подробнее
                </Link>
                <ContentActionsButton
                  contentId={hero.id.toString()}
                  contentType="movie"
                  top50MediaType="movie"
                  title={hero.title}
                  posterUrl={hero.poster}
                  externalRating={hero.rating}
                  releaseYear={hero.year}
                  synopsis={hero.description}
                />
              </div>
            </div>
            {/* точки */}
            <div className="absolute bottom-5 right-5 md:right-8 flex items-center gap-1.5">
              {featured.map((m, i) => (
                <button
                  key={m.id}
                  onClick={() => setHeroIdx(i)}
                  aria-label={m.title}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    i === heroIdx % featured.length ? 'w-7 bg-amber-400' : 'w-2.5 bg-white/30 hover:bg-white/60'
                  }`}
                />
              ))}
            </div>
          </section>
        ) : null}

        {/* ── Тулбар: поиск + табы + фильтры ── */}
        <div className="mt-5 rounded-2xl border border-border/70 bg-card/70 backdrop-blur px-3.5 py-3 dark:bg-white/[0.02]">
          <div className="flex flex-col gap-2.5 xl:flex-row xl:items-center">
            <div className="relative flex-1 min-w-[220px]">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={tab === 'trending' ? 'Поиск фильмов...' : 'Поиск в топ 1000...'}
                className="w-full px-5 h-11 bg-background border border-border rounded-full text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-amber-500/50 focus:ring-4 focus:ring-amber-500/10 transition-all dark:bg-black/40 dark:border-white/10 dark:focus:border-amber-200/40"
              />
            </div>
            <div className="inline-flex items-center gap-1 p-1 rounded-full bg-muted/70 border border-border dark:bg-white/[0.04] dark:border-white/[0.08] self-start">
              {([
                { key: 'trending', label: 'В тренде' },
                { key: 'top1000', label: 'Топ 1000' },
              ] as const).map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setTab(key)}
                  className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all duration-200 ${
                    tab === key
                      ? 'bg-foreground text-background shadow dark:bg-white dark:text-black'
                      : 'text-muted-foreground hover:text-foreground dark:hover:text-white'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2 mt-2.5">
            <CatalogFilterBar
              statusValue={selectedCategory}
              onStatusChange={setSelectedCategory}
              contentType="movie"
              sortBy={sortBy}
              onSortChange={setSortBy}
              genre={genreFilter}
              onGenreChange={setGenreFilter}
              onReset={() => {
                setSelectedCategory('all');
                setSortBy('popularity');
                setGenreFilter('all');
              }}
            />
            <p className="text-xs font-semibold text-muted-foreground px-1">
              <span className="text-foreground">{filtersActive || searchQuery.trim() ? filteredAndSortedMovies.length : allMovies.length}</span> в каталоге
            </p>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-7 gap-4">
            {[...Array(20)].map((_, i) => (
              <div key={i} className="aspect-[2/3] bg-muted animate-pulse rounded-lg" />
            ))}
          </div>
        ) : rowsMode ? (
          <>
            {/* Топ-10 с гигантскими номерами */}
            {topTen.length > 0 && (
              <section className="mb-10">
                <h2 className="font-grotesk text-xl sm:text-2xl font-bold tracking-tight text-foreground dark:text-white min-w-0 mb-4">
                  Топ-10 сегодня
                </h2>
                <div className="flex gap-1.5 overflow-x-auto kp-scroll pb-2 -mx-1 px-1">
                  {topTen.map((m, i) => (
                    <Link
                      key={m.id}
                      to={`/movie/${m.id}`}
                      className="group shrink-0 flex items-end rounded-2xl p-2 -ml-1 transition-colors hover:bg-muted/60 dark:hover:bg-white/[0.04]"
                    >
                      <span className="mv-num font-black leading-[0.78] text-[5.5rem] sm:text-[7rem] -mr-3 sm:-mr-4 select-none transition-transform duration-300 group-hover:-translate-y-1">
                        {i + 1}
                      </span>
                      <span className="block w-[128px] sm:w-[148px]">
                        <span className="block aspect-[2/3] rounded-xl overflow-hidden border border-border/60 shadow-lg">
                          <img
                            src={m.poster}
                            alt={m.title}
                            loading="lazy"
                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                          />
                        </span>
                        <span className="block mt-1.5 text-xs font-semibold truncate text-foreground/90 dark:text-zinc-200">
                          {m.title}
                        </span>
                        <span className="text-[11px] font-bold text-amber-600 dark:text-amber-300">
                          {m.rating.toFixed(1)}
                          <span className="font-medium text-muted-foreground"> · {m.year}</span>
                        </span>
                      </span>
                    </Link>
                  ))}
                </div>
              </section>
            )}
            <PosterRow title="Высокий рейтинг" items={topRatedMovies} render={renderMovie} getKey={(m) => m.id} />
            {genreRows.map((row) => (
              <PosterRow key={row.id} title={row.name} items={row.items} render={renderMovie} getKey={(m) => m.id} />
            ))}
          </>
        ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-7 gap-4">
            {displayMovies.map((movie) => (
              <div key={movie.id} className="relative group">
                {/* Rank ticket */}
                {movie.rank && (
                  <div className="absolute top-2 left-2 z-10 rounded-lg bg-zinc-950/90 backdrop-blur border border-amber-400/40 px-2 py-1 shadow-lg group-hover:scale-105 transition-transform">
                    <span className="text-xs font-black tracking-wider text-amber-300">#{movie.rank}</span>
                  </div>
                )}
                <MovieCard movie={movie} />
              </div>
            ))}
          </div>
          
          {/* Infinite Scroll Observer */}
          <div ref={observerTarget} className="flex justify-center py-8">
            {hasMore && <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-purple-500" />}
          </div>
        </>
      )}

      {!loading && displayMovies.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">{t('movies.noResults')}</p>
        </div>
      )}
      </div>
    </div>
  );
};
export default Movies;