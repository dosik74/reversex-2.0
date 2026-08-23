import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Star, Plus, ArrowLeft } from "lucide-react";
import supabase from "@/utils/supabase";
import { toast } from "sonner";
import { getGameDescriptionFromSteam } from "@/lib/translationToggle";

interface GameDetails {
  id: number;
  name: string;
  description: string;
  released: string;
  rating: number;
  background_image: string;
  genres: Array<{ id: number; name: string }>;
  platforms: Array<{ platform: { id: number; name: string } }>;
  developers: Array<{ name: string }>;
  publishers: Array<{ name: string }>;
  website: string;
  metacritic: number;
  playtime: number;
}

const GameDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [game, setGame] = useState<GameDetails | null>(null);
  const [rusDescription, setRusDescription] = useState<string | null>(null);
  const [isTranslated, setIsTranslated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [addingToTop50, setAddingToTop50] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    const fetchGame = async () => {
      if (!id) return;

      try {
        setLoading(true);
        const apiKey = "c33c648c0d8f45c494af8da025d7b862";
        const response = await fetch(
          `https://api.rawg.io/api/games/${id}?key=${apiKey}`
        );
        const data = await response.json();
        setGame(data);
      } catch (err) {
        console.error('Error fetching game details:', err);
        setError('Failed to load game details');
      } finally {
        setLoading(false);
      }
    };

    const getCurrentUser = async () => {
      try {
        const { data } = await supabase.auth.getUser();
        setCurrentUserId(data.user?.id || null);
      } catch (error) {
        console.error("Error getting user:", error);
      }
    };

    fetchGame();
    getCurrentUser();
  }, [id]);

  // Fetch Russian description in background (non-blocking)
  useEffect(() => {
    if (game?.id) {
      // Don't await - let it load in background
      getGameDescriptionFromSteam(game.id)
        .then(desc => {
          if (desc) {
            setRusDescription(desc);
            console.log(`[GameDetail] Loaded Russian description for game ${game.id}`);
          }
        })
        .catch(error => {
          console.warn('[GameDetail] Error loading translation:', error);
        });
    }
  }, [game?.id]);

  const handleAddToTop50 = async (e: React.MouseEvent) => {
    e.preventDefault();

    if (!currentUserId) {
      toast.error('Войдите в аккаунт чтобы добавить в Top 50');
      return;
    }

    if (!game) return;

    setAddingToTop50(true);
    try {
      let topListId: string | undefined;

      const { data: existingList, error: listError } = await supabase
        .from('top_lists')
        .select('id')
        .eq('user_id', currentUserId)
        .eq('media_type', 'game')
        .single();

      if (existingList) {
        topListId = existingList.id;
      } else if (!listError || listError.code === 'PGRST116') {
        const { data: newList, error: createError } = await supabase
          .from('top_lists')
          .insert({ user_id: currentUserId, title: 'Top 50 Games', media_type: 'game' })
          .select('id')
          .single();

        if (createError) throw createError;
        topListId = newList?.id;
      }

      if (!topListId) throw new Error('Failed to create or find top list');

      const { data: existingItem } = await supabase
        .from('top_list_items')
        .select('id')
        .eq('top_list_id', topListId)
        .eq('item_id', game.id.toString())
        .single();

      if (existingItem) {
        toast.info('Уже в Top 50');
        return;
      }

      const { data: items } = await supabase
        .from('top_list_items')
        .select('rank')
        .eq('top_list_id', topListId)
        .order('rank', { ascending: false })
        .limit(1);

      const nextRank = (items?.[0]?.rank || 0) + 1;

      const { error: insertError } = await supabase.from('top_list_items').insert({
        top_list_id: topListId,
        item_id: game.id.toString(),
        rank: nextRank,
        title: game.name,
        poster_url: game.background_image,
      });

      if (insertError) throw insertError;
      toast.success('Добавлено в Top 50');
    } catch (error) {
      console.error(error);
      toast.error('Ошибка при добавлении в Top 50');
    } finally {
      setAddingToTop50(false);
    }
  };

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
          <Link to="/games">
            <Button variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Вернуться к играм
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Back Button */}
      <Link to="/games" className="mb-6 inline-block">
        <Button variant="outline" size="sm">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Вернуться к играм
        </Button>
      </Link>

      {/* Hero Section */}
      <div className="mb-8">
        <div className="relative h-[400px] rounded-lg overflow-hidden mb-8">
          <img
            src={game.background_image}
            alt={game.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-6">
            <h1 className="text-5xl font-script font-bold text-white mb-4">{game.name}</h1>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 bg-black/50 px-4 py-2 rounded-lg">
                <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                <span className="text-xl font-bold text-white">{game.rating.toFixed(1)}</span>
              </div>
              <Button
                onClick={handleAddToTop50}
                disabled={addingToTop50}
                className="bg-primary hover:bg-primary/90 text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                Добавить в Top 50
              </Button>
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
              <Button
                variant={isTranslated ? "default" : "outline"}
                size="sm"
                onClick={() => setIsTranslated(!isTranslated)}
                className="ml-4"
              >
                {isTranslated ? '🇷🇺 Русский' : '🇬🇧 English'}
              </Button>
            </CardHeader>
            <CardContent>
              <div
                className="prose dark:prose-invert max-w-none"
                dangerouslySetInnerHTML={{ __html: isTranslated && rusDescription ? rusDescription : (game?.description || 'Описание недоступно') }}
              />
              {isTranslated && !rusDescription && (
                <p className="text-muted-foreground italic">Русский перевод загружается...</p>
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
                      {genre.name}
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
              <CardContent>
                <p className="font-semibold">{game.developers[0]?.name || 'Неизвестно'}</p>
              </CardContent>
            </Card>
          )}

          {/* Publishers */}
          {game.publishers && game.publishers.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Издатель</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="font-semibold">{game.publishers[0]?.name || 'Неизвестно'}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default GameDetail;
