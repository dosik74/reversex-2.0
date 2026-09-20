import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { getSeriesDetails, getSeriesVideos, getSeriesCredits, getSimilarSeries, getSeriesRecommendations, discoverSeriesByGenres, rankBySimilarity, orderCrew, getMoviePosterUrl, formatGenreName, statusRu, formatRuntime } from "@/utils/tmdbApi";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Star, Play, ChevronRight } from "lucide-react";
import ContentActionsButton from "@/components/ContentActionsButton";
import BackButton from "@/components/BackButton";

interface SeriesDetails {
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
  total_episode_count?: number;
}

interface Crew {
  id: number;
  name: string;
  job: string;
  profile_path: string | null;
}

interface SimilarSeries {
  id: number;
  title: string;
  poster_path: string | null;
  release_date: string;
  vote_average: number;
  genre_ids?: number[];
  vote_count?: number;
}

const SeriesDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [series, setSeries] = useState<SeriesDetails | null>(null);
  const [videos, setVideos] = useState<Video[]>([]);
  const [cast, setCast] = useState<Cast[]>([]);
  const [crew, setCrew] = useState<Crew[]>([]);
  const [castExpanded, setCastExpanded] = useState(false);
  const [similarSeries, setSimilarSeries] = useState<SimilarSeries[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        const seriesId = parseInt(id);

        // Fetch all data in parallel
        const [seriesData, videosData, creditsData, similarData, recData] = await Promise.all([
          getSeriesDetails(seriesId),
          getSeriesVideos(seriesId),
          getSeriesCredits(seriesId),
          getSimilarSeries(seriesId),
          getSeriesRecommendations(seriesId)
        ]);

        setSeries(seriesData as SeriesDetails);
        // Если русского описания нет — подтягиваем английское, чтобы не было пустой страницы
        if (!seriesData.overview?.trim()) {
          getSeriesDetails(seriesId, 'en-US')
            .then((en) => {
              if (en.overview?.trim()) setSeries((prev) => (prev ? { ...prev, overview: en.overview } : prev));
            })
            .catch(() => {});
        }
        setVideos(videosData.filter(v => v.site === 'YouTube'));
        setCast(
          [...creditsData.cast]
            .sort((a, b) =>
              (b.total_episode_count ?? -1) - (a.total_episode_count ?? -1) ||
              (a.order ?? 999) - (b.order ?? 999)
            )
            .slice(0, 30)
        );
        setCastExpanded(false);
        setCrew(creditsData.crew || []);
        // Умные «похожие»: similar + recommendations, ранжируем по жанрам,
        // мусор без голосов выкидываем, нехватку добиваем топом тех же жанров
        const genreIds = (seriesData.genres || []).map(g => g.id);
        let ranked = rankBySimilarity(
          genreIds,
          [...similarData.series, ...recData.series].filter(s => s.id !== seriesId && s.poster_path)
        );
        if (ranked.length < 6 && genreIds.length > 0) {
          const extra = await discoverSeriesByGenres(genreIds.slice(0, 2));
          ranked = rankBySimilarity(genreIds, [...ranked, ...extra.filter(s => s.id !== seriesId && s.poster_path)]);
        }
        setSimilarSeries(ranked.slice(0, 12));
      } catch (err) {
        console.error('Error fetching series details:', err);
        setError('Failed to load series details');
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
          <p className="mt-4 text-muted-foreground">Загружаем сериал...</p>
        </div>
      </div>
    );
  }

  if (error || !series) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="border-destructive/50">
          <CardContent className="pt-6 text-center">
            <p className="text-destructive mb-4">{error || 'Сериал не найден'}</p>
            <BackButton fallback="/series" label="Вернуться к сериалам" />
          </CardContent>
        </Card>
      </div>
    );
  }

  const mainTrailer = videos.find(v => v.type === 'Trailer') || videos[0];
  const releaseYear = series.release_date ? new Date(series.release_date).getFullYear() : '';

  return (
    <div className="min-h-screen font-ui">
      {/* Hero Section */}
      <div
        className="h-[500px] bg-cover bg-center relative"
        style={{
          backgroundImage: `linear-gradient(to bottom, rgba(0,0,0,0.4), rgba(15,15,28,1)), url(${
            series.backdrop_path 
              ? `https://image.tmdb.org/t/p/w1280${series.backdrop_path}`
              : 'https://placehold.co/1280x500/1a1a2e/ffffff'
          })`,
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
        <div className="container mx-auto px-4 h-full flex items-end pb-8 relative z-10">
          <div className="flex gap-8 animate-fade-up w-full">
            <img
              src={getMoviePosterUrl(series.poster_path, 'w500')}
              alt={series.title}
              className="w-56 h-80 rounded-lg shadow-2xl object-cover transform hover:scale-105 transition-transform duration-300 flex-shrink-0"
              onError={(e) => {
                e.currentTarget.src = 'https://placehold.co/300x450/1a1a2e/ffffff?text=No+Image';
              }}
            />
            <div className="flex flex-col justify-end space-y-4 flex-1">
              <div>
                <h1 className="text-6xl md:text-7xl font-script font-bold mb-2 text-white drop-shadow-[0_2px_12px_rgba(0,0,0,0.9)]">{series.title}</h1>
                <p className="text-lg text-muted-foreground">{releaseYear}</p>
              </div>

              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2 bg-card/80 px-4 py-2 rounded-lg">
                  <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                  <span className="text-2xl font-bold">{series.vote_average.toFixed(1)}</span>
                  <span className="text-sm text-muted-foreground">/10</span>
                </div>

                {series.runtime ? (
                  <div className="bg-card/80 px-4 py-2 rounded-lg text-sm tabular-nums">
                    ⏱️ {formatRuntime(series.runtime)} / серия
                  </div>
                ) : null}

                {series.genres && series.genres.length > 0 && (
                  <div className="bg-card/80 px-4 py-2 rounded-lg text-sm">
                    {series.genres.map(g => formatGenreName(g.name)).join(', ')}
                  </div>
                )}

                <ContentActionsButton
                  contentId={series.id.toString()}
                  contentType="series"
                  top50MediaType="anime"
                  title={series.title}
                  posterUrl={getMoviePosterUrl(series.poster_path, 'w500')}
                  externalRating={series.vote_average}
                  releaseYear={String(releaseYear || '')}
                  genre={series.genres?.map(g => g.name).join(', ')}
                  synopsis={series.overview}
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
            {series.overview && (
              <Card className="animate-fade-up card-glow">
                <CardHeader>
                  <CardTitle>Описание</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground leading-relaxed text-lg">{series.overview}</p>
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
                        <p className="text-xs text-muted-foreground truncate">
                          {[actor.character, actor.total_episode_count ? `${actor.total_episode_count} эп.` : ''].filter(Boolean).join(' · ')}
                        </p>
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

            {/* Crew: создатели и команда */}
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

            {/* Similar Series */}
            {similarSeries.length > 0 && (
              <Card className="animate-fade-up card-glow" style={{ animationDelay: '0.4s' }}>
                <CardHeader>
                  <CardTitle>Похожие сериалы</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                    {similarSeries.map((similar: any) => (
                      <Link
                        key={similar.id}
                        to={`/series/${similar.id}`}
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
            {series.production_companies && series.production_companies.length > 0 && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Студии</CardTitle>
                </CardHeader>
                <CardContent className="!pt-2">
                  <div className="divide-y divide-white/[0.06]">
                  {series.production_companies.map((c) => (
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
                <CardTitle className="text-lg">О сериале</CardTitle>
              </CardHeader>
              <CardContent className="!pt-2 text-sm">
                <dl className="divide-y divide-white/[0.06]">
                {series.original_title && series.original_title !== series.title && (
                  <div className="flex items-baseline justify-between gap-4 py-2.5">
                    <dt className="text-muted-foreground flex-shrink-0">Оригинальное название</dt>
                    <dd className="font-semibold text-right truncate">{series.original_title}</dd>
                  </div>
                )}
                {series.release_date && (
                  <div className="flex items-baseline justify-between gap-4 py-2.5">
                    <dt className="text-muted-foreground flex-shrink-0">Дата выпуска</dt>
                    <dd className="font-semibold tabular-nums text-right">
                      {new Date(series.release_date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </dd>
                  </div>
                )}
                {series.runtime ? (
                  <div className="flex items-baseline justify-between gap-4 py-2.5">
                    <dt className="text-muted-foreground flex-shrink-0">Серия</dt>
                    <dd className="font-semibold tabular-nums">{formatRuntime(series.runtime)}</dd>
                  </div>
                ) : null}
                {series.status && (
                  <div className="flex items-baseline justify-between gap-4 py-2.5">
                    <dt className="text-muted-foreground flex-shrink-0">Статус</dt>
                    <dd className="font-semibold">{statusRu(series.status)}</dd>
                  </div>
                )}
                </dl>
              </CardContent>
            </Card>

            <div>
              <BackButton fallback="/series" label="Вернуться к сериалам" className="w-full" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SeriesDetail;