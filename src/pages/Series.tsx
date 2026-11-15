import { useState, useEffect, useMemo, useRef } from "react";
import { Link } from "react-router-dom";
import SeriesCard from "@/components/SeriesCard";
import PosterImage from "@/components/PosterImage";
import CatalogHeader from "@/components/CatalogHeader";
import CatalogFilterBar from "@/components/CatalogFilterBar";
import CinemaNav from "@/components/CinemaNav";
import PosterRow from "@/components/PosterRow";
import { SortOption, GenreFilter, GENRE_TMDB_IDS, GENRE_LIST } from "@/components/MovieSortFilter";
import { claimExclusive, dedupeById } from "@/utils/dedupe";
import { getPopularSeries, getTrendingSeries, searchSeries, getMoviePosterUrl } from "@/utils/tmdbApi";
import { useScrollRestore } from "@/hooks/useScrollRestore";
import { useTranslation } from "react-i18next";
import { ContentStatus } from "@/types/anime";
import supabase from "@/lib/supabase";

interface Series {
  id: number;
  title: string;
  year: string;
  rating: number;
  poster: string;
  description: string;
  rank?: number;
  genre_ids?: number[];
}

const SERIES_PER_PAGE = 20;

// In-memory cache for Series page across navigation
let seriesMemoryCache: Series[] | null = null;
let seriesTrendingMemoryCache: Series[] | null = null;

const SeriesPage = () => {
  const { t } = useTranslation();
  const observerTarget = useRef<HTMLDivElement>(null);

  const [trendingSeries, setTrendingSeriesState] = useState<Series[]>(() => seriesTrendingMemoryCache || []);
  const [allSeries, setAllSeriesState] = useState<Series[]>(() => seriesMemoryCache || []);
  const [displaySeries, setDisplaySeries] = useState<Series[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(() => !seriesMemoryCache || seriesMemoryCache.length === 0);

  const setTrendingSeries = (series: Series[]) => {
    seriesTrendingMemoryCache = series;
    setTrendingSeriesState(series);
  };

  const setAllSeries = (series: Series[]) => {
    seriesMemoryCache = series;
    setAllSeriesState(series);
  };
  const [isSearching, setIsSearching] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [searchResultsTotal, setSearchResultsTotal] = useState(0);
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
        .eq('content_type', 'series');

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

  // Apply filters and sorting to all series
  const filteredAndSortedSeries = useMemo(() => {
    let result = allSeries;

    // Apply category filter
    if (selectedCategory !== 'all') {
      result = result.filter(series => {
        // TODO: Filter by user's series list status once implemented
        return true;
      });
    }

    // Apply genre filter (real TMDB genre_ids)
    if (genreFilter !== 'all') {
      const tmdbIds = GENRE_TMDB_IDS[genreFilter]?.tv || [];
      result = result.filter(series => series.genre_ids?.some(id => tmdbIds.includes(id)));
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
  }, [allSeries, selectedCategory, sortBy, genreFilter]);

  // Initialize display when allSeries loads (skip if grid already populated)
  useEffect(() => {
    if (allSeries.length > 0 && displaySeries.length === 0) {
      setDisplaySeries(filteredAndSortedSeries.slice(0, SERIES_PER_PAGE));
      setPage(1);
      setHasMore(filteredAndSortedSeries.length > SERIES_PER_PAGE);
    }
  }, [allSeries.length]);

  useEffect(() => {
    if (seriesMemoryCache && seriesMemoryCache.length > 0 && seriesTrendingMemoryCache && seriesTrendingMemoryCache.length > 0) {
      setLoading(false);
      return;
    }
    fetchSeries();
  }, []);

  useEffect(() => {
    if (searchQuery.trim()) {
      handleSearch(searchQuery);
    } else {
      // Apply filtered and sorted series
      setDisplaySeries(filteredAndSortedSeries.slice(0, SERIES_PER_PAGE));
      setPage(1);
      setHasMore(filteredAndSortedSeries.length > SERIES_PER_PAGE);
      setIsSearching(false);
    }
  }, [searchQuery, selectedCategory, sortBy, genreFilter]);

  const handleSearch = async (query: string) => {
    if (!query.trim()) {
      setIsSearching(false);
      return;
    }

    try {
      setIsSearching(true);
      setLoading(true);
      const results = await searchSeries(query);
      
      const transformed = dedupeById(results.results.map((series: any) => ({
        id: series.id,
        title: series.name || series.original_name,
        year: series.first_air_date ? new Date(series.first_air_date).getFullYear().toString() : '',
        rating: series.vote_average,
        poster: getMoviePosterUrl(series.poster_path, 'w342'),
        description: series.overview
      })));

      setAllSeries(transformed);
      setDisplaySeries(transformed.slice(0, SERIES_PER_PAGE));
      setSearchResultsTotal(results.total_results);
      setPage(1);
      setHasMore(transformed.length > SERIES_PER_PAGE);
    } catch (error) {
      console.error('Error searching series:', error);
      setAllSeries([]);
      setDisplaySeries([]);
    } finally {
      setLoading(false);
      setIsSearching(false);
    }
  };

  const fetchSeries = async () => {
    try {
      setLoading(true);
      const all: Series[] = [];
      const seen = new Set<number>();

      // Загружаем тренды дня + первые 6 страниц каталога параллельно (120 сериалов) без дёрганья
      const [trendingRes, ...pageResults] = await Promise.allSettled([
        getTrendingSeries('day'),
        ...Array.from({ length: 6 }, (_, i) => getPopularSeries(i + 1))
      ]);

      let trendingList: Series[] = [];
      if (trendingRes.status === 'fulfilled' && trendingRes.value?.results) {
        trendingList = (trendingRes.value.results as any[])
          .filter((s: any) => s.poster_path)
          .map((series: any) => ({
            id: series.id,
            title: series.name || series.title || series.original_name,
            year: series.first_air_date ? new Date(series.first_air_date).getFullYear().toString() : '',
            rating: Math.round((series.vote_average || 0) * 10) / 10,
            poster: getMoviePosterUrl(series.poster_path, 'w342'),
            description: series.overview || '',
            genre_ids: series.genre_ids || []
          }));
      }

      for (const res of pageResults) {
        if (res.status === 'fulfilled' && res.value?.results) {
          const transformed = (res.value.results as any[])
            .filter((s: any) => s.poster_path && !seen.has(s.id))
            .map((series: any) => ({
              id: series.id,
              title: series.name || series.title || series.original_name,
              year: series.first_air_date ? new Date(series.first_air_date).getFullYear().toString() : '',
              rating: Math.round((series.vote_average || 0) * 10) / 10,
              poster: getMoviePosterUrl(series.poster_path, 'w342'),
              description: series.overview || '',
              genre_ids: series.genre_ids || []
            }));
          transformed.forEach(s => seen.add(s.id));
          all.push(...transformed);
        }
      }

      setTrendingSeries(trendingList);
      setAllSeries([...all]);
      setLoading(false);

      // Фоновая тихая догрузка страниц 7–16 единым пакетом
      setTimeout(async () => {
        try {
          const bgPromises = Array.from({ length: 10 }, (_, i) => getPopularSeries(i + 7));
          const bgResults = await Promise.allSettled(bgPromises);
          const bgSeries: Series[] = [];
          for (const res of bgResults) {
            if (res.status === 'fulfilled' && res.value?.results) {
              const transformed = res.value.results
                .filter((s: any) => s.poster_path && !seen.has(s.id))
                .map((series: any) => ({
                  id: series.id,
                  title: series.name || series.original_name,
                  year: series.first_air_date ? new Date(series.first_air_date).getFullYear().toString() : '',
                  rating: series.vote_average,
                  poster: getMoviePosterUrl(series.poster_path, 'w342'),
                  description: series.overview,
                  genre_ids: series.genre_ids || []
                }));
              transformed.forEach(s => seen.add(s.id));
              bgSeries.push(...transformed);
            }
          }
          if (bgSeries.length > 0) {
            all.push(...bgSeries);
            setAllSeries([...all]);
          }
        } catch {}
      }, 1500);

    } catch (error) {
      console.error('Error fetching series:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMore = () => {
    const nextPage = page + 1;
    const start = page * SERIES_PER_PAGE;
    const end = start + SERIES_PER_PAGE;

    const source = filteredAndSortedSeries;
    setDisplaySeries((prev) => [...prev, ...source.slice(start, end)]);
    setPage(nextPage);
    setHasMore(end < source.length);
  };

  // Kinopoisk-style rows mode: no active filters/search
  const rowsMode = !searchQuery.trim() && genreFilter === 'all' && selectedCategory === 'all';

  // ── Эксклюзивные ряды одним проходом: каждый сериал ровно в одном
  // ряду — ни по id, ни по базе названия повторов нет ──
  const rails = useMemo(() => {
    const usedIds = new Set<number | string>();
    const usedTitles = new Set<string>();
    const idOf = (s: Series) => s.id;
    const titleOf = (s: Series) => s.title;

    // «Топ-10 сегодня» строго из реальных дневных трендов TMDB (trending/tv/day)
    const sourceForTop10 = trendingSeries.length > 0 ? trendingSeries : allSeries;
    const topTen = claimExclusive(sourceForTop10, 10, usedIds, usedTitles, idOf, titleOf);

    const popular = claimExclusive(allSeries, 20, usedIds, usedTitles, idOf, titleOf);
    const topRated = claimExclusive(
      [...allSeries].sort((a, b) => b.rating - a.rating),
      20, usedIds, usedTitles, idOf, titleOf,
    );
    const genres = GENRE_LIST.map((g) => {
      const tmdbIds = GENRE_TMDB_IDS[g.id]?.tv || [];
      const items = claimExclusive(
        allSeries.filter((s) => s.genre_ids?.some((id) => tmdbIds.includes(id))),
        30, usedIds, usedTitles, idOf, titleOf,
      );
      return { ...g, items };
    }).filter((r) => r.items.length >= 6);
    return { topTen, popular, topRated, genres };
  }, [allSeries, trendingSeries]);
  const { topTen, popular: popularSeries, topRated: topRatedSeries, genres: genreRows } = rails;

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 py-8">
        <CinemaNav active="series" />
        <CatalogHeader
          scriptLabel="Кинотеатр"
          title="Сериалы"
          subtitle={`Популярное сейчас · ${allSeries.length} в каталоге`}
          searchPlaceholder="Поиск сериалов..."
          searchValue={searchQuery}
          onSearchChange={setSearchQuery}
          glow="from-amber-200 to-orange-500"
          accent="text-amber-700 dark:text-amber-200/90"
        >
          <CatalogFilterBar
            statusValue={selectedCategory}
            onStatusChange={setSelectedCategory}
            contentType="series"
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
        </CatalogHeader>

      {loading ? (
        rowsMode ? (
          <div className="space-y-10">
            {/* Топ-10 скелетон */}
            <div>
              <div className="h-7 w-48 bg-zinc-900/80 rounded-lg animate-pulse mb-4" />
              <div className="flex gap-4 overflow-hidden pb-4">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="shrink-0 flex items-end gap-2">
                    <div className="w-14 h-24 bg-zinc-900/50 rounded-xl animate-pulse -mr-3" />
                    <div className="w-[140px] aspect-[2/3] bg-zinc-900/80 rounded-2xl animate-pulse border border-white/5" />
                  </div>
                ))}
              </div>
            </div>
            {/* Ряды подборок */}
            {[...Array(2)].map((_, r) => (
              <div key={r}>
                <div className="h-6 w-40 bg-zinc-900/80 rounded-lg animate-pulse mb-3" />
                <div className="flex gap-4 overflow-hidden pb-2">
                  {[...Array(7)].map((_, i) => (
                    <div key={i} className="w-[140px] aspect-[2/3] bg-zinc-900/80 rounded-xl shrink-0 animate-pulse border border-white/5" />
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-7 gap-4">
            {[...Array(14)].map((_, i) => (
              <div key={i} className="aspect-[2/3] bg-zinc-900/80 animate-pulse rounded-xl border border-white/5" />
            ))}
          </div>
        )
      ) : rowsMode ? (
        <>
          {/* Топ-10 сегодня с гигантскими 3D номерами */}
          {topTen.length > 0 && (
            <section className="mb-12">
              <h2 className="font-grotesk text-xl sm:text-2xl font-bold tracking-tight text-foreground dark:text-white min-w-0 mb-4 flex items-center gap-2">
                <span>Топ-10 сегодня</span>
              </h2>
              <div className="flex gap-2 sm:gap-4 overflow-x-auto kp-scroll pb-4 pt-2 -mx-2 px-2">
                {topTen.map((s, i) => (
                  <Link
                    key={s.id}
                    to={`/series/${s.id}`}
                    className="group shrink-0 flex flex-col rounded-2xl p-1.5 transition-all duration-300 hover:bg-muted/30 dark:hover:bg-white/[0.03]"
                  >
                    {/* Верхняя часть: 3D Номер + Постер */}
                    <div className="flex items-end relative">
                      <span
                        className={`top10-num ${
                          i === 0
                            ? "top10-num-1 -mr-1.5 sm:-mr-2.5"
                            : i === 1
                            ? "top10-num-2 -mr-2.5 sm:-mr-3.5 md:-mr-4"
                            : i === 2
                            ? "top10-num-3 -mr-2.5 sm:-mr-3.5 md:-mr-4"
                            : i === 9
                            ? "top10-num-10 -mr-6 sm:-mr-8 md:-mr-9"
                            : "top10-num-regular -mr-3 sm:-mr-4 md:-mr-5"
                        } text-[7.5rem] sm:text-[9.5rem] md:text-[11rem] leading-[0.82] select-none mb-3 sm:mb-4 transition-transform duration-300 group-hover:-translate-y-2`}
                      >
                        {i + 1}
                      </span>
                      <div className="relative z-10 w-[136px] sm:w-[158px] aspect-[2/3] rounded-2xl overflow-hidden border border-white/10 dark:border-white/15 shadow-[0_12px_28px_rgba(0,0,0,0.65)] transition-all duration-300 group-hover:scale-[1.03] group-hover:shadow-[0_22px_45px_rgba(0,0,0,0.88)] group-hover:border-primary/50">
                        <PosterImage
                          src={s.poster}
                          alt={s.title}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      </div>
                    </div>

                    {/* Нижняя часть: Название и рейтинг (строго под постером) */}
                    <div className="relative z-20 mt-2 w-[136px] sm:w-[158px] self-end px-0.5">
                      <span className="block text-xs sm:text-[13px] font-semibold truncate text-foreground/90 dark:text-zinc-100 group-hover:text-primary transition-colors">
                        {s.title}
                      </span>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-xs font-bold text-amber-500 dark:text-amber-400">
                          ★ {Number(s.rating).toFixed(1)}
                        </span>
                        {s.year && (
                          <span className="text-[11px] font-medium text-muted-foreground">
                            · {s.year}
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}

          <PosterRow title="Популярные сериалы" items={popularSeries} render={(s) => <SeriesCard series={s} />} getKey={(s) => s.id} />
          <PosterRow title="Высокий рейтинг" items={topRatedSeries} render={(s) => <SeriesCard series={s} />} getKey={(s) => s.id} />
          {genreRows.map((row) => (
            <PosterRow key={row.id} title={row.name} items={row.items} render={(s) => <SeriesCard series={s} />} getKey={(s) => s.id} />
          ))}
        </>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-7 gap-4">
            {displaySeries.map((series) => (
              <SeriesCard key={series.id} series={series} />
            ))}
          </div>
          
          {/* Infinite Scroll Observer */}
          <div ref={observerTarget} className="flex justify-center py-8">
            {hasMore && <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-cyan-500" />}
          </div>
        </>
      )}

      {!loading && displaySeries.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">
            {t('series.noResults') || 'No series found'}
          </p>
        </div>
      )}
      </div>
    </div>
  );
};

export default SeriesPage;