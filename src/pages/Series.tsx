import { useState, useEffect, useMemo, useRef } from "react";
import SeriesCard from "@/components/SeriesCard";
import CatalogHeader from "@/components/CatalogHeader";
import CinemaNav from "@/components/CinemaNav";
import PosterRow from "@/components/PosterRow";
import SeriesCategoryFilter from "@/components/SeriesCategoryFilter";
import MovieSortFilter, { SortOption, GenreFilter, GENRE_TMDB_IDS, GENRE_LIST } from "@/components/MovieSortFilter";
import { getPopularSeries, searchSeries, getMoviePosterUrl } from "@/utils/tmdbApi";
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

const SeriesPage = () => {
  const { t } = useTranslation();
  const observerTarget = useRef<HTMLDivElement>(null);

  const [allSeries, setAllSeries] = useState<Series[]>([]);
  const [displaySeries, setDisplaySeries] = useState<Series[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
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
      
      const transformed = results.results.map((series: any) => ({
        id: series.id,
        title: series.name || series.original_name,
        year: series.first_air_date ? new Date(series.first_air_date).getFullYear().toString() : '',
        rating: series.vote_average,
        poster: getMoviePosterUrl(series.poster_path, 'w342'),
        description: series.overview
      }));

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
      const TOTAL_PAGES = 25; // ~500 series

      for (let pageNum = 1; pageNum <= TOTAL_PAGES; pageNum++) {
        try {
          const results = await getPopularSeries(pageNum);
          if (results.results.length === 0) break;

          const transformed = results.results
            .filter((s: any) => s.poster_path)
            .map((series: any) => ({
              id: series.id,
              title: series.name || series.original_name,
              year: series.first_air_date ? new Date(series.first_air_date).getFullYear().toString() : '',
              rating: series.vote_average,
              poster: getMoviePosterUrl(series.poster_path, 'w342'),
              description: series.overview,
              genre_ids: series.genre_ids || []
            }));

          all.push(...transformed);

          // Progressive render
          if (pageNum >= 3) setLoading(false);
          setAllSeries([...all]);

          await new Promise(resolve => setTimeout(resolve, 120));
        } catch (err) {
          console.warn(`Failed to load page ${pageNum}:`, err);
          break;
        }
      }

      setAllSeries([...all]);
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

  const popularSeries = useMemo(() => allSeries.slice(0, 20), [allSeries]);
  const topRatedSeries = useMemo(
    () => {
      const popularIds = new Set(popularSeries.map((s) => s.id));
      return [...allSeries].filter((s) => !popularIds.has(s.id)).sort((a, b) => b.rating - a.rating).slice(0, 20);
    },
    [allSeries, popularSeries]
  );

  // Genre rows: each series appears in only ONE row (its first matching genre)
  const genreRows = useMemo(
    () => {
      const used = new Set<number>([
        ...popularSeries.map((s) => s.id),
        ...topRatedSeries.map((s) => s.id),
      ]);
      return GENRE_LIST.map((g) => {
        const tmdbIds = GENRE_TMDB_IDS[g.id]?.tv || [];
        const items: Series[] = [];
        for (const s of allSeries) {
          if (used.has(s.id)) continue;
          if (s.genre_ids?.some((id) => tmdbIds.includes(id))) {
            items.push(s);
            used.add(s.id);
            if (items.length >= 30) break;
          }
        }
        return { ...g, items };
      }).filter((r) => r.items.length >= 6);
    },
    [allSeries, popularSeries, topRatedSeries]
  );

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
          accent="text-amber-200/90"
        >
          {/* Category Filter */}
          <SeriesCategoryFilter
            selectedCategory={selectedCategory}
            onCategoryChange={setSelectedCategory}
          />

          {/* Sort and Genre Filter */}
          <MovieSortFilter
            sortBy={sortBy}
            onSortChange={setSortBy}
            genre={genreFilter}
            onGenreChange={setGenreFilter}
          />
        </CatalogHeader>

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-7 gap-4">
          {[...Array(20)].map((_, i) => (
            <div key={i} className="aspect-[2/3] bg-muted animate-pulse rounded-lg" />
          ))}
        </div>
      ) : rowsMode ? (
        <>
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
            {hasMore && <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-purple-500" />}
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