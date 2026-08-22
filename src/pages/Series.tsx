import { useState, useEffect, useMemo, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import SeriesCard from "@/components/SeriesCard";
import SeriesCategoryFilter from "@/components/SeriesCategoryFilter";
import MovieSortFilter, { SortOption, GenreFilter } from "@/components/MovieSortFilter";
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

    // Apply genre filter
    if (genreFilter !== 'all') {
      result = result.filter(series => {
        // TODO: Filter by genre_ids once properly populated from TMDB
        return true;
      });
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

  // Initialize display when allSeries loads
  useEffect(() => {
    if (allSeries.length > 0) {
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
      const results = await getPopularSeries(1);
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
      setHasMore(transformed.length > SERIES_PER_PAGE);
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

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-4 gradient-text">
          {t('Исследуйте сериалы') || 'Explore Series'}
        </h1>
        <div className="relative max-w-md mb-6">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
          <Input
            type="text"
            placeholder={t('series.searchPlaceholder') || 'Search series...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

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

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {[...Array(20)].map((_, i) => (
            <div key={i} className="aspect-[2/3] bg-muted animate-pulse rounded-lg" />
          ))}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
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
  );
};

export default SeriesPage;