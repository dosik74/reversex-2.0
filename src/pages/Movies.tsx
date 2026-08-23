import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import MovieCard from "@/components/MovieCard";
import CatalogHeader from "@/components/CatalogHeader";
import MovieCategoryFilter from "@/components/MovieCategoryFilter";
import MovieSortFilter, { SortOption, GenreFilter } from "@/components/MovieSortFilter";
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
  poster: string;
  description: string;
  rank?: number;
  genre_ids?: number[];
}

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

    // Apply genre filter
    if (genreFilter !== 'all') {
      result = result.filter(movie => {
        // TODO: Filter by genre once genre_ids are properly populated from TMDB
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
  }, [allMovies, selectedCategory, sortBy, genreFilter]);

  // Initialize display when allMovies loads
  useEffect(() => {
    if (allMovies.length > 0) {
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
      const { movies } = await getPopularMovies(1);
      
      const transformedMovies: Movie[] = movies
        .filter(m => m.poster_path)
        .map(m => ({
          id: m.id,
          title: m.title,
          year: m.release_date?.split('-')[0] || 'Unknown',
          rating: Math.round(m.vote_average * 10) / 10,
          poster: `https://image.tmdb.org/t/p/w342${m.poster_path}`,
          description: m.overview || ''
        }));

      setAllMovies(transformedMovies);
      setDisplayMovies(transformedMovies.slice(0, MOVIES_PER_PAGE));
      setHasMore(transformedMovies.length > MOVIES_PER_PAGE);
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
      
      // Fetch multiple pages to get ~1000 top-rated movies
      for (let pageNum = 1; pageNum <= 50; pageNum++) {
        try {
          const { movies } = await getTopRatedMovies(pageNum);
          
          const transformedMovies: Movie[] = movies
            .filter(m => m.poster_path && m.vote_count > 500)
            .map((m, idx) => ({
              id: m.id,
              title: m.title,
              year: m.release_date?.split('-')[0] || 'Unknown',
              rating: Math.round(m.vote_average * 10) / 10,
              poster: `https://image.tmdb.org/t/p/w342${m.poster_path}`,
              description: m.overview || '',
              rank: allTopMovies.length + idx + 1
            }));

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
      
      const transformedMovies: Movie[] = movies
        .filter(m => m.poster_path)
        .map(m => ({
          id: m.id,
          title: m.title,
          year: m.release_date?.split('-')[0] || 'Unknown',
          rating: Math.round(m.vote_average * 10) / 10,
          poster: `https://image.tmdb.org/t/p/w342${m.poster_path}`,
          description: m.overview || ''
        }));

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

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 py-8">
        <CatalogHeader
          scriptLabel="Кинотеатр"
          title={tab === 'trending' ? 'Исследуйте фильмы' : 'Лучшие всех времён'}
          subtitle={tab === 'trending'
            ? `Популярное сейчас · ${allMovies.length} фильмов`
            : `Топ 1000 · ${allMovies.length} фильмов`}
          searchPlaceholder={tab === 'trending' ? 'Поиск фильмов...' : 'Поиск в топ 1000...'}
          searchValue={searchQuery}
          onSearchChange={setSearchQuery}
          glow={tab === 'trending' ? 'from-purple-500 to-violet-600' : 'from-amber-400 to-orange-500'}
        >
          {/* Tab pills */}
          <div className="flex gap-2 mb-5">
            {([
              { key: 'trending', label: 'Популярное сейчас' },
              { key: 'top1000', label: 'Топ 1000 Всех Времён' },
            ] as const).map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setTab(key)}
                className={`px-4 py-2 rounded-full text-xs font-semibold transition-all duration-300 border ${
                  tab === key
                    ? key === 'top1000'
                      ? 'bg-gradient-to-r from-amber-400 to-orange-500 text-black/90 border-transparent shadow-lg shadow-orange-500/25 scale-[1.03]'
                      : 'bg-gradient-to-r from-purple-500 to-violet-600 text-white border-transparent shadow-lg shadow-purple-500/25 scale-[1.03]'
                    : 'bg-white/[0.04] text-zinc-400 border-white/[0.06] hover:bg-white/[0.08] hover:text-zinc-200'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Category Filter */}
          <MovieCategoryFilter
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
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {[...Array(20)].map((_, i) => (
            <div key={i} className="aspect-[2/3] bg-muted animate-pulse rounded-lg" />
          ))}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {displayMovies.map((movie) => (
              <div key={movie.id} className="relative group">
                {/* Rank Badge */}
                {movie.rank && (
                  <div className="absolute top-2 left-2 z-10 bg-yellow-500 text-black rounded-full w-10 h-10 flex items-center justify-center font-bold text-sm shadow-lg group-hover:scale-110 transition-transform">
                    #{movie.rank}
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