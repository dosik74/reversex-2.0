import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { getSeriesDetails, getSeriesVideos, getSeriesCredits, getSimilarSeries, getMoviePosterUrl } from "@/utils/tmdbApi";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Star, Play } from "lucide-react";

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

interface SimilarSeries {
  id: number;
  title: string;
  poster_path: string | null;
  release_date: string;
  vote_average: number;
}

const SeriesDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [series, setSeries] = useState<SeriesDetails | null>(null);
  const [videos, setVideos] = useState<Video[]>([]);
  const [cast, setCast] = useState<Cast[]>([]);
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
        const [seriesData, videosData, creditsData, similarData] = await Promise.all([
          getSeriesDetails(seriesId),
          getSeriesVideos(seriesId),
          getSeriesCredits(seriesId),
          getSimilarSeries(seriesId)
        ]);

        setSeries(seriesData as SeriesDetails);
        setVideos(videosData.filter(v => v.site === 'YouTube'));
        setCast(creditsData.cast.slice(0, 10));
        setSimilarSeries(similarData.series.filter((s: any) => s.poster_path).slice(0, 6));
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
            <Link to="/series">
              <Button variant="outline">← Вернуться к сериалам</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const mainTrailer = videos.find(v => v.type === 'Trailer') || videos[0];
  const releaseYear = series.release_date ? new Date(series.release_date).getFullYear() : '';

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <div
        className="h-[500px] bg-cover bg-center relative overflow-hidden"
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
                <h1 className="text-5xl font-display font-bold mb-2 gradient-text">{series.title}</h1>
                <p className="text-lg text-muted-foreground">{releaseYear}</p>
              </div>

              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2 bg-card/80 px-4 py-2 rounded-lg">
                  <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                  <span className="text-2xl font-bold">{series.vote_average.toFixed(1)}</span>
                  <span className="text-sm text-muted-foreground">/10</span>
                </div>

                {series.runtime && (
                  <div className="bg-card/80 px-4 py-2 rounded-lg text-sm">
                    ⏱️ {series.runtime} мин
                  </div>
                )}

                {series.genres && series.genres.length > 0 && (
                  <div className="bg-card/80 px-4 py-2 rounded-lg text-sm">
                    {series.genres.map(g => g.name).join(', ')}
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
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">О сериале</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                {series.original_title && series.original_title !== series.title && (
                  <div>
                    <p className="text-muted-foreground">Оригинальное название</p>
                    <p className="font-semibold">{series.original_title}</p>
                  </div>
                )}
                {series.release_date && (
                  <div>
                    <p className="text-muted-foreground">Дата выпуска</p>
                    <p className="font-semibold">{new Date(series.release_date).toLocaleDateString('ru-RU')}</p>
                  </div>
                )}
                {series.runtime && (
                  <div>
                    <p className="text-muted-foreground">Продолжительность серии</p>
                    <p className="font-semibold">{series.runtime} минут</p>
                  </div>
                )}
                {series.status && (
                  <div>
                    <p className="text-muted-foreground">Статус</p>
                    <p className="font-semibold">{series.status}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <div>
              <Link to="/series" className="w-full block">
                <Button variant="outline" className="w-full">
                  ← Вернуться к сериалам
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SeriesDetail;