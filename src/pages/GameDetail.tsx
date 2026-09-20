import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Star } from "lucide-react";
import { getGameDescriptionRu } from "@/lib/translationToggle";
import BackButton from "@/components/BackButton";
import ContentActionsButton from "@/components/ContentActionsButton";
import { gameGenreRu, formatVotes, fetchRawg, RAWG_API_KEY } from "@/utils/rawgApi";

interface GameDetails {
  id: number;
  name: string;
  description: string;
  released: string;
  rating: number;
  ratings_count?: number;
  background_image: string;
  genres: Array<{ id: number; name: string }>;
  platforms: Array<{ platform: { id: number; name: string } }>;
  developers: Array<{ id?: number; name: string; slug?: string }>;
  publishers: Array<{ id?: number; name: string; slug?: string }>;
  website: string;
  metacritic: number;
  playtime: number;
}

const GameDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [game, setGame] = useState<GameDetails | null>(null);
  const [rusDescription, setRusDescription] = useState<{ text: string; machine: boolean } | null>(null);
  const [trStatus, setTrStatus] = useState<'loading' | 'ready' | 'failed'>('loading');
  const [isTranslated, setIsTranslated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchGame = async () => {
      if (!id) return;

      try {
        setLoading(true);
        setError(null);
        // fetchRawg: ретраи при 429, кидает при ошибке — error-JSON в стейт не попадёт
        const data = await fetchRawg(
          `https://api.rawg.io/api/games/${id}?key=${RAWG_API_KEY}`
        );
        if (!data || typeof data.id !== 'number') {
          throw new Error('Игра не найдена');
        }
        setGame(data);
      } catch (err) {
        console.error('Error fetching game details:', err);
        setError('Не удалось загрузить игру. Возможно, API перегружен — попробуйте обновить страницу.');
      } finally {
        setLoading(false);
      }
    };

    fetchGame();
  }, [id]);

  // Загружаем русское описание в фоне: Steam → автоперевод → сдаёмся
  useEffect(() => {
    if (!game?.id) return;
    const gid = game.id;
    const englishHtml = game.description;
    let cancelled = false;
    setTrStatus('loading');
    setRusDescription(null);

    getGameDescriptionRu(gid, englishHtml)
      .then(desc => {
        if (cancelled) return;
        if (desc) {
          setRusDescription(desc);
          setTrStatus('ready');
          console.log(`[GameDetail] RU description ready for game ${gid} (machine: ${desc.machine})`);
        } else {
          setTrStatus('failed');
        }
      })
      .catch(() => {
        if (!cancelled) setTrStatus('failed');
      });

    return () => {
      cancelled = true;
    };
  }, [game?.id]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <div className="inline-block">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
          <p className="mt-4 text-muted-foreground">Загружаем игру...</p>
        </div>
      </div>
    );
  }

  if (error || !game) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <p className="text-red-500 mb-4">{error || 'Игра не найдена'}</p>
          <BackButton fallback="/games" label="Вернуться к играм" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 font-ui">
      {/* Back Button */}
      <div className="mb-6 inline-block">
        <BackButton fallback="/games" label="Вернуться к играм" />
      </div>

      {/* Hero Section */}
      <div className="mb-8">
        <div className="relative h-[400px] rounded-lg mb-8">
          <img
            src={game.background_image}
            alt={game.name}
            className="w-full h-full object-cover rounded-lg"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-6">
            <h1 className="text-6xl md:text-7xl font-script font-bold text-white mb-4 drop-shadow-[0_2px_12px_rgba(0,0,0,0.9)]">{game.name}</h1>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 bg-black/50 px-4 py-2 rounded-lg">
                <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                <span className="text-xl font-bold text-white">{(game.rating ?? 0).toFixed(1)}</span>
              </div>
              <ContentActionsButton
                contentId={game.id.toString()}
                contentType="game"
                top50MediaType="game"
                title={game.name}
                posterUrl={game.background_image}
                externalRating={game.rating ?? 0}
                genre={game.genres?.map((g: any) => g.name).join(', ')}
                synopsis={game.description}
                variant="detail"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-8">
          {/* Description */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Описание</CardTitle>
              {trStatus !== 'failed' && (
                <Button
                  variant={isTranslated ? "default" : "outline"}
                  size="sm"
                  onClick={() => setIsTranslated(!isTranslated)}
                  className="ml-4"
                >
                  {isTranslated ? '🇷🇺 Русский' : '🇬🇧 English'}
                </Button>
              )}
            </CardHeader>
            <CardContent>
              <div
                className="prose dark:prose-invert max-w-none"
                dangerouslySetInnerHTML={{ __html: isTranslated && rusDescription ? rusDescription.text : (game?.description || 'Описание недоступно') }}
              />
              {isTranslated && trStatus === 'loading' && (
                <p className="text-muted-foreground italic">Русский перевод загружается...</p>
              )}
              {isTranslated && rusDescription?.machine && (
                <p className="text-xs text-muted-foreground mt-2">Автоматический перевод</p>
              )}
            </CardContent>
          </Card>

          {/* Genres */}
          {game.genres && game.genres.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Жанры</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {game.genres.map((genre) => (
                    <span
                      key={genre.id}
                      className="px-3 py-1 bg-primary/20 text-primary rounded-full text-sm font-medium"
                    >
                      {gameGenreRu(genre.name)}
                    </span>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Platforms */}
          {game.platforms && game.platforms.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Платформы</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {game.platforms.map((p, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1 bg-accent/20 text-accent rounded-full text-sm font-medium"
                    >
                      {p.platform.name}
                    </span>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Info Card */}
          <Card>
            <CardHeader>
              <CardTitle>Информация</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {game.released && (
                <div>
                  <p className="text-sm text-muted-foreground">Дата выпуска</p>
                  <p className="font-semibold">{new Date(game.released).toLocaleDateString('ru-RU')}</p>
                </div>
              )}

              {game.metacritic && (
                <div>
                  <p className="text-sm text-muted-foreground">Metacritic</p>
                  <p className="font-semibold">{game.metacritic}/100</p>
                </div>
              )}

              {(game.ratings_count || 0) > 0 && (
                <div>
                  <p className="text-sm text-muted-foreground">Оценок игроков</p>
                  <p className="font-semibold">{formatVotes(game.ratings_count)}</p>
                </div>
              )}

              {game.playtime && (
                <div>
                  <p className="text-sm text-muted-foreground">Среднее время прохождения</p>
                  <p className="font-semibold">{game.playtime} часов</p>
                </div>
              )}

              {game.website && (
                <div>
                  <p className="text-sm text-muted-foreground">Официальный сайт</p>
                  <a
                    href={game.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline break-all text-sm"
                  >
                    Посетить сайт
                  </a>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Developers */}
          {game.developers && game.developers.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Разработчик</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {game.developers.map((d, i) => (
                  d.id ? (
                    <Link
                      key={d.id}
                      to={`/studio/developer/${d.id}`}
                      className="block font-semibold hover:text-primary hover:underline transition-colors"
                    >
                      {d.name}
                    </Link>
                  ) : (
                    <p key={i} className="font-semibold">{d.name}</p>
                  )
                ))}
              </CardContent>
            </Card>
          )}

          {/* Publishers */}
          {game.publishers && game.publishers.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Издатель</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {game.publishers.map((p, i) => (
                  p.id ? (
                    <Link
                      key={p.id}
                      to={`/studio/publisher/${p.id}`}
                      className="block font-semibold hover:text-primary hover:underline transition-colors"
                    >
                      {p.name}
                    </Link>
                  ) : (
                    <p key={i} className="font-semibold">{p.name}</p>
                  )
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default GameDetail;
