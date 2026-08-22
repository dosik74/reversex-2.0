import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { getMovieDetails, getMovieVideos, getMovieCredits, getSimilarMovies, getMoviePosterUrl } from "@/utils/tmdbApi";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Star, Play } from "lucide-react";
import { useIMDbRating } from "@/hooks/useIMDbRating";
import CommunityRating from "@/components/CommunityRating";
import AddToBookmarksButton from "@/components/AddToBookmarksButton";

interface MovieDetails {
  id: number;
  title: string;
  original_title: string;
  release_date: string;
  poster_path: string | null;
  backdrop_path: string | null;
  overview: string;
  vote_average: number;
  vote_count: number;
  runtime: number;
  budget: number;
  revenue: number;
  status: string;
  genres: Array<{ id: number; name: string }>;
}

interface Video {
  id: string;
  key: string;
  name: string;
  site: string;
  type: string;
}

interface Cast {
  id: number;
  name: string;
  character: string;
  profile_path: string | null;
}

interface SimilarMovie {
  id: number;
  title: string;
  poster_path: string | null;
  release_date: string;
  vote_average: number;
}

const MovieDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [movie, setMovie] = useState<MovieDetails | null>(null);
  const [videos, setVideos] = useState<Video[]>([]);
  const [cast, setCast] = useState<Cast[]>([]);
  const [similarMovies, setSimilarMovies] = useState<SimilarMovie[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const movieId = id ? parseInt(id) : undefined;
  const { rating: imdbRating, loading: imdbLoading } = useIMDbRating({
    tmdbId: movieId,
    mediaType: 'movie'
  });

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;

      try {
        setLoading(true);
        const movieId = parseInt(id);

        // Fetch all data in parallel
        const [movieData, videosData, creditsData, similarData] = await Promise.all([
          getMovieDetails(movieId),
          getMovieVideos(movieId),
          getMovieCredits(movieId),
          getSimilarMovies(movieId)
        ]);

        setMovie(movieData);
        setVideos(videosData.filter(v => v.site === 'YouTube'));
        setCast(creditsData.cast.slice(0, 10));
        setSimilarMovies(similarData.movies.filter((m: any) => m.poster_path).slice(0, 6));
      } catch (err) {
        console.error('Error fetching movie details:', err);
        setError('Failed to load movie details');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <div className="inline-block">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
          <p className="mt-4 text-muted-foreground">Загружаем фильм...</p>
        </div>
      </div>
    );
  }

  if (error || !movie) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="border-destructive/50">
          <CardContent className="pt-6 text-center">
            <p className="text-destructive mb-4">{error || 'Фильм не найден'}</p>
            <Link to="/movies">
              <Button variant="outline">← Вернуться к фильмам</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const mainTrailer = videos.find(v => v.type === 'Trailer') || videos[0];
  const releaseYear = movie.release_date ? new Date(movie.release_date).getFullYear() : '';

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <div
        className="h-[500px] bg-cover bg-center relative overflow-hidden"
        style={{
          backgroundImage: `linear-gradient(to bottom, rgba(0,0,0,0.4), rgba(15,15,28,1)), url(${movie.backdrop_path
              ? `https://image.tmdb.org/t/p/w1280${movie.backdrop_path}`
              : 'https://placehold.co/1280x500/1a1a2e/ffffff'
            })`,
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
        <div className="container mx-auto px-4 h-full flex items-end pb-8 relative z-10">
          <div className="flex gap-8 animate-fade-up w-full">
            <img
              src={getMoviePosterUrl(movie.poster_path, 'w500')}
              alt={movie.title}
              className="w-56 h-80 rounded-lg shadow-2xl object-cover transform hover:scale-105 transition-transform duration-300 flex-shrink-0"
              onError={(e) => {
                e.currentTarget.src = 'https://placehold.co/300x450/1a1a2e/ffffff?text=No+Image';
              }}
            />
            <div className="flex flex-col justify-end space-y-4 flex-1">
              <div>
                <h1 className="text-5xl font-display font-bold mb-2 gradient-text">{movie.title}</h1>
                <p className="text-lg text-muted-foreground">{releaseYear}</p>
              </div>

              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2 bg-card/80 px-4 py-2 rounded-lg">
                  <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                  <span className="text-2xl font-bold">{movie.vote_average.toFixed(1)}</span>
                  <span className="text-sm text-muted-foreground">/10</span>
                </div>

                {imdbRating && imdbRating.imdbRating !== null && !imdbLoading && (
                  <div className="flex items-center gap-2 bg-yellow-600/80 px-4 py-2 rounded-lg text-black font-bold">
                    <span className="text-sm">IMDb</span>
                    <span className="text-2xl">{imdbRating.imdbRating.toFixed(1)}</span>
                    <span className="text-sm">/10</span>
                  </div>
                )}

                {imdbLoading && !imdbRating && (
                  <div className="flex items-center gap-2 bg-muted/50 px-4 py-2 rounded-lg animate-pulse">
                    <span className="text-sm">IMDb...</span>
                  </div>
                )}

                {movie.runtime && (
                  <div className="bg-card/80 px-4 py-2 rounded-lg text-sm">
                    ⏱️ {movie.runtime} мин
                  </div>
                )}

                {movie.genres && movie.genres.length > 0 && (
                  <div className="bg-card/80 px-4 py-2 rounded-lg text-sm">
                    {movie.genres.map(g => g.name).join(', ')}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            {/* Description */}
            {movie.overview && (
              <Card className="animate-fade-up card-glow">
                <CardHeader>
                  <CardTitle>Описание</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground leading-relaxed text-lg">{movie.overview}</p>
                </CardContent>
              </Card>
            )}

            {/* Budget and Revenue */}
            {(movie.budget || movie.revenue) && (
              <Card className="animate-fade-up card-glow" style={{ animationDelay: '0.1s' }}>
                <CardHeader>
                  <CardTitle>Финансы</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    {movie.budget ? (
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Бюджет</p>
                        <p className="text-lg font-semibold">${(movie.budget / 1000000).toFixed(0)}M</p>
                      </div>
                    ) : null}
                    {movie.revenue ? (
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Кассовые сборы</p>
                        <p className="text-lg font-semibold">${(movie.revenue / 1000000).toFixed(0)}M</p>
                      </div>
                    ) : null}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Trailer */}
            {mainTrailer && (
              <Card className="animate-fade-up card-glow" style={{ animationDelay: '0.2s' }}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Play className="w-5 h-5" />
                    Трейлер
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="aspect-video rounded-lg overflow-hidden bg-muted">
                    <iframe
                      width="100%"
                      height="100%"
                      src={`https://www.youtube.com/embed/${mainTrailer.key}`}
                      title={mainTrailer.name}
                      frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Cast */}
            {cast.length > 0 && (
              <Card className="animate-fade-up card-glow" style={{ animationDelay: '0.3s' }}>
                <CardHeader>
                  <CardTitle>Актёры</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
                    {cast.map((actor) => (
                      <div key={actor.id} className="text-center">
                        <img
                          src={
                            actor.profile_path
                              ? `https://image.tmdb.org/t/p/w342${actor.profile_path}`
                              : 'https://placehold.co/200x300/1a1a2e/ffffff?text=No+Image'
                          }
                          alt={actor.name}
                          className="w-full aspect-[2/3] object-cover rounded-lg mb-2"
                        />
                        <p className="font-semibold text-sm truncate">{actor.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{actor.character}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Similar Movies */}
            {similarMovies.length > 0 && (
              <Card className="animate-fade-up card-glow" style={{ animationDelay: '0.4s' }}>
                <CardHeader>
                  <CardTitle>Похожие фильмы</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                    {similarMovies.map((similar: any) => (
                      <Link
                        key={similar.id}
                        to={`/movie/${similar.id}`}
                        className="group cursor-pointer"
                      >
                        <div className="relative overflow-hidden rounded-lg mb-2">
                          <img
                            src={getMoviePosterUrl(similar.poster_path, 'w342')}
                            alt={similar.title}
                            className="w-full aspect-[2/3] object-cover group-hover:scale-110 transition-transform duration-300"
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                            <Star className="w-6 h-6 fill-yellow-400 text-yellow-400" />
                          </div>
                        </div>
                        <p className="font-semibold text-sm truncate group-hover:text-primary transition-colors">
                          {similar.title}
                        </p>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                          {similar.vote_average.toFixed(1)}
                        </div>
                      </Link>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">О фильме</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                {movie.original_title && movie.original_title !== movie.title && (
                  <div>
                    <p className="text-muted-foreground">Оригинальное название</p>
                    <p className="font-semibold">{movie.original_title}</p>
                  </div>
                )}
                {movie.release_date && (
                  <div>
                    <p className="text-muted-foreground">Дата выпуска</p>
                    <p className="font-semibold">{new Date(movie.release_date).toLocaleDateString('ru-RU')}</p>
                  </div>
                )}
                {movie.runtime && (
                  <div>
                    <p className="text-muted-foreground">Продолжительность</p>
                    <p className="font-semibold">{movie.runtime} минут</p>
                  </div>
                )}
                {movie.status && (
                  <div>
                    <p className="text-muted-foreground">Статус</p>
                    <p className="font-semibold">{movie.status}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <div>
              <Link to="/movies" className="w-full block">
                <Button variant="outline" className="w-full">
                  ← Вернуться к фильмам
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MovieDetail;