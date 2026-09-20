import { useState, useEffect, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import {
  getPersonDetails,
  getPersonMovieCredits,
  getPersonTvCredits,
  getMoviePosterUrl,
  type TMDBPerson,
  type TMDBCredit,
} from "@/utils/tmdbApi";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import BackButton from "@/components/BackButton";
import { Star, Cake, MapPin, Briefcase } from "lucide-react";

const DEPARTMENT_RU: Record<string, string> = {
  Acting: 'Актёр',
  Directing: 'Режиссёр',
  Writing: 'Сценарист',
  Production: 'Продюсер',
  Sound: 'Композитор',
  Camera: 'Оператор',
  Editing: 'Монтажёр',
  Art: 'Художник',
  Costume: 'Костюмы',
};

const JOB_RU: Record<string, string> = {
  Director: 'Режиссёр',
  Screenplay: 'Сценарий',
  Writer: 'Сценарист',
  Producer: 'Продюсер',
  'Executive Producer': 'Исп. продюсер',
  'Director of Photography': 'Оператор',
  'Original Music Composer': 'Композитор',
  Editor: 'Монтаж',
  Novel: 'Роман',
  Characters: 'Персонажи',
};

const jobRu = (job?: string) => (job ? JOB_RU[job] || job : '');
const titleOf = (c: TMDBCredit) => c.title || c.name || c.original_title || c.original_name || 'Без названия';
const yearOf = (c: TMDBCredit) => (c.release_date || c.first_air_date || '').split('-')[0];

type Work = TMDBCredit & { media: 'movie' | 'series' };

const PersonPage = () => {
  const { id } = useParams<{ id: string }>();
  const [person, setPerson] = useState<TMDBPerson | null>(null);
  const [acted, setActed] = useState<Work[]>([]);
  const [directed, setDirected] = useState<Work[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<'acted' | 'crew'>('acted');
  const [bioOpen, setBioOpen] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      try {
        setLoading(true);
        const personId = parseInt(id);
        const [details, movies, series] = await Promise.all([
          getPersonDetails(personId),
          getPersonMovieCredits(personId),
          getPersonTvCredits(personId),
        ]);
        setPerson(details);
        // Если русской биографии нет — подтягиваем английскую
        if (!details.biography?.trim()) {
          getPersonDetails(personId, 'en-US')
            .then((en) => {
              if (en.biography?.trim()) setPerson((prev) => (prev ? { ...prev, biography: en.biography } : prev));
            })
            .catch(() => {});
        }

        const seen = new Set<string>();
        const pushUnique = (arr: Work[], c: TMDBCredit, media: 'movie' | 'series') => {
          const key = `${media}-${c.id}`;
          if (seen.has(key) || (!c.poster_path && !c.character && !c.job)) return;
          seen.add(key);
          arr.push({ ...c, media });
        };

        const castList: Work[] = [];
        movies.cast.forEach((c) => pushUnique(castList, c, 'movie'));
        series.cast.forEach((c) => pushUnique(castList, c, 'series'));
        // Сначала с постером и рейтингом
        castList.sort((a, b) => (b.vote_average || 0) - (a.vote_average || 0));

        const seenCrew = new Set<string>();
        const crewList: Work[] = [];
        [...movies.crew, ...series.crew].forEach((c) => {
          const key = `${c.media_type === 'tv' ? 'series' : 'movie'}-${c.id}-${c.job}`;
          if (seenCrew.has(key)) return;
          seenCrew.add(key);
          crewList.push({ ...c, media: c.media_type === 'tv' ? 'series' : 'movie' });
        });
        crewList.sort((a, b) => (b.vote_average || 0) - (a.vote_average || 0));

        setActed(castList);
        setDirected(crewList);
        setTab(castList.length > 0 ? 'acted' : 'crew');
      } catch (err) {
        console.error('Error fetching person:', err);
        setError('Не удалось загрузить страницу');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const age = useMemo(() => {
    if (!person?.birthday) return null;
    const end = person.deathday ? new Date(person.deathday) : new Date();
    const years = end.getFullYear() - new Date(person.birthday).getFullYear();
    return years;
  }, [person]);

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

  if (error || !person) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="border-destructive/50">
          <CardContent className="pt-6 text-center">
            <p className="text-destructive mb-4">{error || 'Персона не найдена'}</p>
            <BackButton fallback="/" label="Назад" />
          </CardContent>
        </Card>
      </div>
    );
  }

  const works = tab === 'acted' ? acted : directed;
  const fmtDate = (d: string | null) =>
    d ? new Date(d).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' }) : '';

  return (
    <div className="min-h-screen font-ui">
      {/* Hero */}
      <div className="relative overflow-hidden border-b border-white/[0.06]">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[42rem] h-[42rem] rounded-full blur-[140px] opacity-[0.14] bg-gradient-to-br from-amber-200 to-orange-500 pointer-events-none" />
        <div className="container mx-auto px-4 py-8 relative">
          <div className="mb-6 inline-block">
            <BackButton fallback="/" label="Назад" />
          </div>
          <div className="flex flex-col sm:flex-row gap-6 sm:gap-8">
            <img
              src={
                person.profile_path
                  ? `https://image.tmdb.org/t/p/w342${person.profile_path}`
                  : 'https://placehold.co/300x450/1a1a2e/ffffff?text=No+Photo'
              }
              alt={person.name}
              className="w-40 sm:w-56 aspect-[2/3] object-cover rounded-2xl shadow-2xl border border-white/10 flex-shrink-0"
            />
            <div className="flex flex-col justify-end min-w-0">
              <span className="inline-flex w-fit items-center gap-1.5 text-xs font-semibold bg-amber-300/10 text-amber-200 border border-amber-200/20 rounded-full px-3 py-1 mb-3">
                <Briefcase className="w-3.5 h-3.5" />
                {DEPARTMENT_RU[person.known_for_department] || person.known_for_department || 'Кино'}
              </span>
              <h1 className="font-grotesk text-4xl sm:text-5xl font-bold tracking-tight text-white mb-3">
                {person.name}
              </h1>
              <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted-foreground">
                {person.birthday && (
                  <span className="inline-flex items-center gap-1.5">
                    <Cake className="w-4 h-4" />
                    {fmtDate(person.birthday)}
                    {age !== null && ` · ${age} ${person.deathday ? '— ' + fmtDate(person.deathday) : 'лет'}`}
                  </span>
                )}
                {person.place_of_birth && (
                  <span className="inline-flex items-center gap-1.5">
                    <MapPin className="w-4 h-4" />
                    {person.place_of_birth}
                  </span>
                )}
                <span className="inline-flex items-center gap-1.5">
                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  {acted.length} в кадре · {directed.length} за кадром
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            {/* Биография */}
            {person.biography && (
              <Card>
                <CardHeader>
                  <CardTitle>Биография</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className={`text-muted-foreground leading-relaxed whitespace-pre-line ${bioOpen ? '' : 'line-clamp-6'}`}>
                    {person.biography}
                  </p>
                  {person.biography.length > 400 && (
                    <Button variant="ghost" size="sm" className="mt-2 px-0" onClick={() => setBioOpen(!bioOpen)}>
                      {bioOpen ? 'Свернуть' : 'Читать полностью'}
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Фильмография */}
            <Card>
              <CardHeader>
                <CardTitle>Фильмография</CardTitle>
                <div className="flex gap-2 mt-3">
                  {acted.length > 0 && (
                    <button
                      onClick={() => setTab('acted')}
                      className={`px-4 py-2 rounded-full text-xs font-semibold border transition-colors ${
                        tab === 'acted'
                          ? 'bg-white text-black border-transparent'
                          : 'bg-white/[0.04] text-zinc-400 border-white/[0.08] hover:text-white'
                      }`}
                    >
                      Снимался · {acted.length}
                    </button>
                  )}
                  {directed.length > 0 && (
                    <button
                      onClick={() => setTab('crew')}
                      className={`px-4 py-2 rounded-full text-xs font-semibold border transition-colors ${
                        tab === 'crew'
                          ? 'bg-white text-black border-transparent'
                          : 'bg-white/[0.04] text-zinc-400 border-white/[0.08] hover:text-white'
                      }`}
                    >
                      Снимал · {directed.length}
                    </button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {works.length === 0 ? (
                  <p className="text-muted-foreground text-sm">Пока пусто</p>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {works.slice(0, 60).map((w, i) => (
                      <Link
                        key={`${w.media}-${w.id}-${w.job || w.character || i}`}
                        to={w.media === 'movie' ? `/movie/${w.id}` : `/series/${w.id}`}
                        className="group"
                      >
                        <div className="relative overflow-hidden rounded-lg mb-2">
                          <img
                            src={getMoviePosterUrl(w.poster_path, 'w342')}
                            alt={titleOf(w)}
                            loading="lazy"
                            className="w-full aspect-[2/3] object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          {w.vote_average > 0 && (
                            <span className="absolute bottom-1.5 right-1.5 bg-black/70 text-xs font-bold px-1.5 py-0.5 rounded flex items-center gap-1">
                              <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                              {w.vote_average.toFixed(1)}
                            </span>
                          )}
                          {w.media === 'series' && (
                            <span className="absolute top-1.5 left-1.5 bg-black/70 text-[10px] font-semibold px-1.5 py-0.5 rounded">
                              Сериал
                            </span>
                          )}
                        </div>
                        <p className="font-semibold text-sm truncate group-hover:text-primary transition-colors">
                          {titleOf(w)}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {[yearOf(w), tab === 'acted' ? w.character : jobRu(w.job)].filter(Boolean).join(' · ')}
                        </p>
                      </Link>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Факты */}
          <div className="space-y-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Факты</CardTitle>
              </CardHeader>
              <CardContent className="!pt-2 text-sm">
                <dl className="divide-y divide-white/[0.06]">
                <div className="flex items-baseline justify-between gap-4 py-2.5">
                  <dt className="text-muted-foreground flex-shrink-0">Известен как</dt>
                  <dd className="font-semibold text-right">{DEPARTMENT_RU[person.known_for_department] || person.known_for_department || '—'}</dd>
                </div>
                {person.birthday && (
                  <div className="flex items-baseline justify-between gap-4 py-2.5">
                    <dt className="text-muted-foreground flex-shrink-0">Дата рождения</dt>
                    <dd className="font-semibold tabular-nums text-right">{fmtDate(person.birthday)}</dd>
                  </div>
                )}
                {person.deathday && (
                  <div className="flex items-baseline justify-between gap-4 py-2.5">
                    <dt className="text-muted-foreground flex-shrink-0">Дата смерти</dt>
                    <dd className="font-semibold tabular-nums text-right">{fmtDate(person.deathday)}</dd>
                  </div>
                )}
                {person.place_of_birth && (
                  <div className="flex items-baseline justify-between gap-4 py-2.5">
                    <dt className="text-muted-foreground flex-shrink-0">Место рождения</dt>
                    <dd className="font-semibold text-right">{person.place_of_birth}</dd>
                  </div>
                )}
                </dl>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PersonPage;
