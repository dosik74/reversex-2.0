import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import {
  getCompanyDetails,
  getCompanyMovies,
  getMoviePosterUrl,
  type TMDBCompany,
} from "@/utils/tmdbApi";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import BackButton from "@/components/BackButton";
import { Star, MapPin, Globe, Clapperboard } from "lucide-react";

const CompanyPage = () => {
  const { id } = useParams<{ id: string }>();
  const [company, setCompany] = useState<TMDBCompany | null>(null);
  const [movies, setMovies] = useState<Array<{ id: number; title: string; poster_path: string | null; release_date: string; vote_average: number }>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      try {
        setLoading(true);
        const companyId = parseInt(id);
        const [details, films] = await Promise.all([
          getCompanyDetails(companyId),
          getCompanyMovies(companyId, 1),
        ]);
        setCompany(details);
        setMovies(films.movies.filter((m) => m.poster_path).slice(0, 40));
      } catch (err) {
        console.error('Error fetching company:', err);
        setError('Не удалось загрузить страницу студии');
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
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
          </div>
          <p className="mt-4 text-muted-foreground">Загружаем...</p>
        </div>
      </div>
    );
  }

  if (error || !company) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="border-destructive/50">
          <CardContent className="pt-6 text-center">
            <p className="text-destructive mb-4">{error || 'Студия не найдена'}</p>
            <BackButton fallback="/movies" label="Назад" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen font-ui">
      <div className="relative overflow-hidden border-b border-white/[0.06]">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[42rem] h-[42rem] rounded-full blur-[140px] opacity-[0.14] bg-gradient-to-br from-amber-200 to-orange-500 pointer-events-none" />
        <div className="container mx-auto px-4 py-8 relative">
          <div className="mb-6 inline-block">
            <BackButton fallback="/movies" label="Назад" />
          </div>
          <div className="flex flex-col sm:flex-row gap-6 sm:gap-8 items-start">
            <div className="w-40 sm:w-56 aspect-[3/2] rounded-2xl bg-white/[0.05] border border-white/10 flex items-center justify-center p-6 flex-shrink-0">
              {company.logo_path ? (
                <img
                  src={`https://image.tmdb.org/t/p/w500${company.logo_path}`}
                  alt={company.name}
                  className="max-w-full max-h-full object-contain"
                />
              ) : (
                <Clapperboard className="w-12 h-12 text-zinc-600" />
              )}
            </div>
            <div className="flex flex-col justify-end min-w-0">
              <span className="inline-flex w-fit items-center gap-1.5 text-xs font-semibold bg-amber-300/10 text-amber-200 border border-amber-200/20 rounded-full px-3 py-1 mb-3">
                <Clapperboard className="w-3.5 h-3.5" />
                Кинокомпания
              </span>
              <h1 className="font-grotesk text-4xl sm:text-5xl font-bold tracking-tight text-white mb-3">
                {company.name}
              </h1>
              <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted-foreground">
                {company.origin_country && (
                  <span className="inline-flex items-center gap-1.5">
                    <MapPin className="w-4 h-4" />
                    {company.origin_country}
                  </span>
                )}
                {company.headquarters && <span>{company.headquarters}</span>}
                {company.homepage && (
                  <a href={company.homepage} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-primary hover:underline">
                    <Globe className="w-4 h-4" />
                    Сайт
                  </a>
                )}
                <span className="inline-flex items-center gap-1.5">
                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  {movies.length} фильмов
                </span>
              </div>
              {company.description && (
                <p className="mt-4 text-muted-foreground leading-relaxed max-w-2xl">{company.description}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle>Фильмы студии</CardTitle>
          </CardHeader>
          <CardContent>
            {movies.length === 0 ? (
              <p className="text-muted-foreground text-sm">Фильмы не найдены</p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {movies.map((m) => (
                  <Link key={m.id} to={`/movie/${m.id}`} className="group">
                    <div className="relative overflow-hidden rounded-lg mb-2">
                      <img
                        src={getMoviePosterUrl(m.poster_path, 'w342')}
                        alt={m.title}
                        loading="lazy"
                        className="w-full aspect-[2/3] object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      {m.vote_average > 0 && (
                        <span className="absolute bottom-1.5 right-1.5 bg-black/70 text-xs font-bold px-1.5 py-0.5 rounded flex items-center gap-1">
                          <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                          {m.vote_average.toFixed(1)}
                        </span>
                      )}
                    </div>
                    <p className="font-semibold text-sm truncate group-hover:text-primary transition-colors">{m.title}</p>
                    <p className="text-xs text-muted-foreground">{(m.release_date || '').split('-')[0]}</p>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CompanyPage;
