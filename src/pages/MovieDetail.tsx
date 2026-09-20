import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { getMovieDetails, getMovieVideos, getMovieCredits, getSimilarMovies, getMovieRecommendations, discoverMoviesByGenres, rankBySimilarity, orderCrew, getMoviePosterUrl, formatGenreName, statusRu, formatRuntime, formatMoney } from "@/utils/tmdbApi";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Star, Play, ChevronRight } from "lucide-react";
import { useIMDbRating } from "@/hooks/useIMDbRating";
import CommunityRating from "@/components/CommunityRating";
import ContentActionsButton from "@/components/ContentActionsButton";
import BackButton from "@/components/BackButton";

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
  status?: string;
  genres: Array<{ id: number; name: string }>;
  production_companies?: Array<{ id: number; name: string; logo_path: string | null; origin_country: string }>;
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
  order?: number;
}

interface Crew {
  id: number;
  name: string;
  job: string;
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
  const [crew, setCrew] = useState<Crew[]>([]);
  const [castExpanded, setCastExpanded] = useState(false);
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
        const [movieData, videosData, creditsData, similarData, recData] = await Promise.all([
          getMovieDetails(movieId),
          getMovieVideos(movieId),
          getMovieCredits(movieId),
          getSimilarMovies(movieId),
          getMovieRecommendations(movieId)
        ]);

        setMovie(movieData);
        // Если русского описания нет — подтягиваем английское, чтобы не было пустой страницы
        if (!movieData.overview?.trim()) {
          getMovieDetails(movieId, 'en-US')
            .then((en) => {
              if (en.overview?.trim()) setMovie((prev) => (prev ? { ...prev, overview: en.overview } : prev));
            })
            .catch(() => {});
        }
        setVideos(videosData.filter(v => v.site === 'YouTube'));
        // Главные роли — первыми (порядок в титрах), берём до 30
        setCast([...creditsData.cast].sort((a, b) => (a.order ?? 999) - (b.order ?? 999)).slice(0, 30));
        setCastExpanded(false);
        setCrew(creditsData.crew || []);
        // Умные «похожие»: similar + recommendations, ранжируем по жанрам,
        // мусор без голосов выкидываем, нехватку добиваем топом тех же жанров
        const genreIds = (movieData.genres || []).map(g => g.id);
        let ranked = rankBySimilarity(
          genreIds,
          [...similarData.movies, ...recData.movies].filter(m => m.id !== movieId && m.poster_path)
        );
        if (ranked.length < 6 && genreIds.length > 0) {
          const extra = await discoverMoviesByGenres(genreIds.slice(0, 2));
          ranked = rankBySimilarity(genreIds, [...ranked, ...extra.filter(m => m.id !== movieId && m.poster_path)]);
        }
        setSimilarMovies(ranked.slice(0, 12));
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
            <BackButton fallback="/movies" label="Вернуться к фильмам" />
          </CardContent>
        </Card>
      </div>
    );
  }

  const mainTrailer = videos.find(v => v.type === 'Trailer') || videos[0];
  const releaseYear = movie.release_date ? new Date(movie.release_date).getFullYear() : '';

  return (
    <div className="min-h-screen font-ui">
      {/* Hero Section */}
      <div
        className="h-[500px] bg-cover bg-center relative"
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
                <h1 className="text-6xl md:text-7xl font-script font-bold mb-2 text-white drop-shadow-[0_2px_12px_rgba(0,0,0,0.9)]">{movie.title}</h1>
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

                {movie.runtime ? (
                  <div className="bg-card/80 px-4 py-2 rounded-lg text-sm tabular-nums">
                    ⏱️ {formatRuntime(movie.runtime)}
                  </div>
                ) : null}

                {movie.genres && movie.genres.length > 0 && (
                  <div className="bg-card/80 px-4 py-2 rounded-lg text-sm">
                    {movie.genres.map(g => formatGenreName(g.name)).join(', ')}
                  </div>
                )}

                <ContentActionsButton
                  contentId={movie.id.toString()}
                  contentType="movie"
                  top50MediaType="movie"
                  title={movie.title}
                  posterUrl={getMoviePosterUrl(movie.poster_path, 'w500')}
                  externalRating={movie.vote_average}
                  releaseYear={String(releaseYear || '')}
                  genre={movie.genres?.map(g => g.name).join(', ')}
                  synopsis={movie.overview}
                  variant="detail"
                />
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
                  <div className="grid grid-cols-2 gap-6">
                    {movie.budget ? (
                      <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] px-5 py-4">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground mb-1.5">Бюджет</p>
                        <p className="text-2xl font-bold tabular-nums">{formatMoney(movie.budget)}</p>
                      </div>
                    ) : null}
                    {movie.revenue ? (
                      <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] px-5 py-4">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground mb-1.5">Кассовые сборы</p>
                        <p className="text-2xl font-bold tabular-nums text-amber-200">{formatMoney(movie.revenue)}</p>
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
                    {(castExpanded ? cast : cast.slice(0, 10)).map((actor) => (
                      <Link key={actor.id} to={`/person/${actor.id}`} className="text-center group">
                        <img
                          src={
                            actor.profile_path
                              ? `https://image.tmdb.org/t/p/w342${actor.profile_path}`
                              : 'https://placehold.co/200x300/1a1a2e/ffffff?text=No+Image'
                          }
                          alt={actor.name}
                          loading="lazy"
                          className="w-full aspect-[2/3] object-cover rounded-lg mb-2 group-hover:ring-2 group-hover:ring-primary/60 transition-all"
                        />
                        <p className="font-semibold text-sm truncate group-hover:text-primary transition-colors">{actor.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{actor.character}</p>
                      </Link>
                    ))}
                  </div>
                  {cast.length > 10 && (
                    <div className="flex justify-center mt-6">
                      <button
                        onClick={() => setCastExpanded(!castExpanded)}
                        className="px-6 py-2 rounded-full text-xs font-semibold bg-white/[0.05] border border-white/10 text-zinc-300 hover:bg-white/[0.1] hover:text-white transition-colors"
                      >
                        {castExpanded ? 'Свернуть' : `Показать всех · ${cast.length}`}
                      </button>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Crew: режиссёры и команда */}
            {crew.length > 0 && (
              <Card className="animate-fade-up card-glow" style={{ animationDelay: '0.35s' }}>
                <CardHeader>
                  <CardTitle>Съёмочная группа</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
                    {orderCrew(crew).slice(0, 10).map((member, i) => (
                      <Link key={`${member.id}-${member.job}-${i}`} to={`/person/${member.id}`} className="text-center group">
                        <img
                          src={
                            member.profile_path
                              ? `https://image.tmdb.org/t/p/w342${member.profile_path}`
                              : 'https://placehold.co/200x300/1a1a2e/ffffff?text=No+Image'
                          }
                          alt={member.name}
                          className="w-full aspect-[2/3] object-cover rounded-lg mb-2 group-hover:ring-2 group-hover:ring-primary/60 transition-all"
                        />
                        <p className="font-semibold text-sm truncate group-hover:text-primary transition-colors">{member.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{member.job}</p>
                      </Link>
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
            {movie.production_companies && movie.production_companies.length > 0 && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Студии</CardTitle>
                </CardHeader>
                <CardContent className="!pt-2">
                  <div className="divide-y divide-white/[0.06]">
                  {movie.production_companies.map((c) => (
                    <Link
                      key={c.id}
                      to={`/company/${c.id}`}
                      className="flex items-center gap-3 py-2.5 group"
                    >
                      {c.logo_path ? (
                        <img
                          src={`https://image.tmdb.org/t/p/w92${c.logo_path}`}
                          alt={c.name}
                          className="w-9 h-9 object-contain rounded-lg bg-white/[0.07] p-1 flex-shrink-0"
                        />
                      ) : (
                        <span className="w-9 h-9 rounded-lg bg-white/[0.07] flex items-center justify-center text-sm font-bold text-muted-foreground flex-shrink-0">
                          {c.name[0]}
                        </span>
                      )}
                      <span className="text-sm font-medium group-hover:text-primary transition-colors truncate flex-1">
                        {c.name}
                      </span>
                      <ChevronRight className="w-4 h-4 text-zinc-600 group-hover:text-primary group-hover:translate-x-0.5 transition-all flex-shrink-0" />
                    </Link>
                  ))}
                  </div>
                </CardContent>
              </Card>
            )}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">О фильме</CardTitle>
              </CardHeader>
              <CardContent className="!pt-2 text-sm">
                <dl className="divide-y divide-white/[0.06]">
                {movie.original_title && movie.original_title !== movie.title && (
                  <div className="flex items-baseline justify-between gap-4 py-2.5">
                    <dt className="text-muted-foreground flex-shrink-0">Оригинальное название</dt>
                    <dd className="font-semibold text-right truncate">{movie.original_title}</dd>
                  </div>
                )}
                {movie.release_date && (
                  <div className="flex items-baseline justify-between gap-4 py-2.5">
                    <dt className="text-muted-foreground flex-shrink-0">Дата выпуска</dt>
                    <dd className="font-semibold tabular-nums text-right">
                      {new Date(movie.release_date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </dd>
                  </div>
                )}
                {movie.runtime ? (
                  <div className="flex items-baseline justify-between gap-4 py-2.5">
                    <dt className="text-muted-foreground flex-shrink-0">Продолжительность</dt>
                    <dd className="font-semibold tabular-nums">{formatRuntime(movie.runtime)}</dd>
                  </div>
                ) : null}
                {movie.status && (
                  <div className="flex items-baseline justify-between gap-4 py-2.5">
                    <dt className="text-muted-foreground flex-shrink-0">Статус</dt>
                    <dd className="font-semibold">{statusRu(movie.status)}</dd>
                  </div>
                )}
                </dl>
              </CardContent>
            </Card>

            <div>
              <BackButton fallback="/movies" label="Вернуться к фильмам" className="w-full" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MovieDetail;