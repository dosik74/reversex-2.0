import { useState, useEffect, useRef, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Search, ChevronDown } from "lucide-react";
import MovieActionMenu from "@/components/MovieActionMenu";
import MovieSortFilter, { SortOption } from "@/components/MovieSortFilter";
import { getPopularMovies } from "@/utils/tmdbApi";
import { useTranslation } from "react-i18next";
import supabase from "@/lib/supabase";

interface Movie {
  id: number;
  title: string;
  year: string;
  rating: number;
  poster: string;
  description: string;
  genre_ids?: number[];
}

interface UserMovieStatus {
  movieId: number;
  rating: number;
  status: 'watched' | 'planned' | 'abandoned' | null;
}

const DISPLAY_PER_BATCH = 60;

const ExploreMovies = () => {
  const { t } = useTranslation();
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const [allMovies, setAllMovies] = useState<Movie[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [displayedCount, setDisplayedCount] = useState(DISPLAY_PER_BATCH);
  const [sortBy, setSortBy] = useState<SortOption>('popularity');
  const [userMovieStatus, setUserMovieStatus] = useState<Map<number, UserMovieStatus>>(new Map());
  const [currentPage, setCurrentPage] = useState(1);

  // Load user statuses
  const loadUserMovieStatuses = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('user_movies')
        .select('movie_id, rating, status')
        .eq('user_id', user.id);

      if (data) {
        const statusMap = new Map(
          data.map((item) => [
            item.movie_id,
            {
              movieId: item.movie_id,
              rating: item.rating || 0,
              status: item.status
            }
          ])
        );
        setUserMovieStatus(statusMap);
      }
    } catch (error) {
      console.warn('Error loading statuses:', error);
    }
  }, []);

  // Load movies from TMDB via getPopularMovies
  useEffect(() => {
    const loadMovies = async () => {
      try {
        setLoading(true);
        const allMoviesData: Movie[] = [];

        // Load first 20 pages (400 movies) - getPopularMovies works!
        for (let page = 1; page <= 20; page++) {
          try {
            const { movies } = await getPopularMovies(page);
            
            const transformed = movies
              .filter(m => m.poster_path)
              .map(m => ({
                id: m.id,
                title: m.title,
                year: m.release_date?.split('-')[0] || 'Unknown',
                rating: Math.round(m.vote_average * 10) / 10,
                poster: `https://image.tmdb.org/t/p/w342${m.poster_path}`,
                description: m.overview || '',
                genre_ids: m.genre_ids || []
              }));

            allMoviesData.push(...transformed);
            console.log(`Loaded page ${page}: ${transformed.length} movies`);
          } catch (err) {
            console.warn(`Failed to load page ${page}:`, err);
          }

          // Small delay to avoid rate limits
          await new Promise(resolve => setTimeout(resolve, 200));
        }

        console.log(`Total movies loaded: ${allMoviesData.length}`);
        setAllMovies(allMoviesData);
        setDisplayedCount(DISPLAY_PER_BATCH);

        // Load user statuses
        await loadUserMovieStatuses();
      } catch (error) {
        console.error('Error loading movies:', error);
      } finally {
        setLoading(false);
      }
    };

    loadMovies();
  }, [loadUserMovieStatuses]);

  // Virtual scroll
  const handleScroll = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const { scrollHeight, scrollTop, clientHeight } = container;
    const distanceFromBottom = scrollHeight - (scrollTop + clientHeight);

    if (displayedCount < allMovies.length && distanceFromBottom < 1500) {
      setDisplayedCount(prev => Math.min(prev + DISPLAY_PER_BATCH, allMovies.length));
    }
  }, [displayedCount, allMovies.length]);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  const handleRatingChange = async (movieId: number, rating: number) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('user_movies')
        .upsert({
          user_id: user.id,
          movie_id: movieId,
          rating: rating,
          status: rating > 0 ? 'watched' : (userMovieStatus.get(movieId)?.status || null),
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id,movie_id'
        });

      if (!error) {
        const updated = userMovieStatus.get(movieId) || { movieId, rating: 0, status: null };
        updated.rating = rating;
        if (rating > 0) {
          updated.status = 'watched';
        }
        setUserMovieStatus(new Map(userMovieStatus.set(movieId, updated)));
      }
    } catch (error) {
      console.error('Error updating rating:', error);
    }
  };

  const handleStatusChange = async (
    movieId: number,
    status: 'watched' | 'planned' | 'abandoned' | null
  ) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('user_movies')
        .upsert({
          user_id: user.id,
          movie_id: movieId,
          status: status,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id,movie_id'
        });

      if (!error) {
        const updated = userMovieStatus.get(movieId) || { movieId, rating: 0, status: null };
        updated.status = status;
        setUserMovieStatus(new Map(userMovieStatus.set(movieId, updated)));
      }
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const displayedMovies = allMovies.slice(0, displayedCount);

  return (
    <div className="container mx-auto px-4 py-8 h-[calc(100vh-100px)] flex flex-col">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">Исследовать фильмы</h1>
        <p className="text-gray-400 text-sm md:text-base">
          Оценивайте и отслеживайте фильмы • {allMovies.length} фильмов загружено
        </p>
      </div>

      {/* Filters */}
      <div className="mb-4 flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <Input
            placeholder="Поиск фильмов..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-gray-800 border-gray-700 text-white placeholder:text-gray-500 text-sm"
          />
        </div>
        <MovieSortFilter sortBy={sortBy} onSortChange={setSortBy} />
      </div>

      {/* Movies Grid */}
      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-gray-900 pr-2"
      >
        {loading ? (
          <div className="flex flex-col items-center justify-center h-full gap-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-400"></div>
            <p className="text-gray-400">Загрузка фильмов... {allMovies.length} / ~400</p>
          </div>
        ) : allMovies.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-400">Фильмы не загружены. Попробуйте перезагрузить страницу.</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-2 md:gap-3 pb-8">
              {displayedMovies.map((movie) => {
                const status = userMovieStatus.get(movie.id);
                return (
                  <div key={movie.id} className="flex flex-col gap-2">
                    <div className="relative rounded-lg overflow-hidden bg-gray-800 aspect-[2/3] group hover:shadow-lg hover:shadow-yellow-600/20 transition-shadow">
                      <img
                        src={movie.poster}
                        alt={movie.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                      />
                      {status?.rating ? (
                        <div className="absolute top-1 right-1 bg-yellow-500 text-black px-1.5 py-0.5 rounded text-xs font-bold">
                          ⭐ {status.rating}
                        </div>
                      ) : null}
                      {status?.status ? (
                        <div className="absolute bottom-1 left-1 bg-gray-900/90 text-xs px-1 py-0.5 rounded font-semibold">
                          {status.status === 'watched' && <span className="text-green-400">✓</span>}
                          {status.status === 'planned' && <span className="text-blue-400">⏱</span>}
                          {status.status === 'abandoned' && <span className="text-red-400">✗</span>}
                        </div>
                      ) : null}
                    </div>

                    <div className="min-h-[35px]">
                      <h3 className="text-xs font-semibold text-white line-clamp-2 leading-tight">{movie.title}</h3>
                      <p className="text-xs text-gray-400">{movie.year}</p>
                    </div>

                    <MovieActionMenu
                      movieId={movie.id}
                      movieTitle={movie.title}
                      currentRating={status?.rating || 0}
                      currentStatus={status?.status || null}
                      onRatingChange={(rating) => handleRatingChange(movie.id, rating)}
                      onStatusChange={(status) => handleStatusChange(movie.id, status)}
                    />
                  </div>
                );
              })}
            </div>

            {/* Scroll indicator */}
            {displayedCount < allMovies.length && (
              <div className="flex justify-center py-8">
                <div className="flex items-center gap-2 text-gray-400 text-sm">
                  <ChevronDown size={16} className="animate-bounce" />
                  <p>
                    Показано: {displayedCount} / {allMovies.length}
                  </p>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default ExploreMovies;
