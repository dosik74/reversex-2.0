import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { getPopularMovies, getMoviePosterUrl, getPopularSeries } from '@/utils/tmdbApi';
import { toast } from 'sonner';

interface PopularItem {
  id: string;
  tmdbId: number;
  title: string;
  poster: string;
  rating: number;
  description: string;
  contentType: 'movie' | 'series' | 'game';
}

interface PopularContentProps {
  onAddItem: (item: PopularItem) => void;
}

const PopularContent = ({ onAddItem }: PopularContentProps) => {
  const [movies, setMovies] = useState<PopularItem[]>([]);
  const [series, setSeries] = useState<PopularItem[]>([]);
  const [games, setGames] = useState<PopularItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadContent();
  }, []);

  const loadContent = async () => {
    setLoading(true);
    try {
      // Load popular movies
      const moviesResponse = await getPopularMovies(1);
      const transformedMovies = moviesResponse.movies
        .slice(0, 10)
        .map((movie: any) => ({
          id: String(movie.id),
          tmdbId: movie.id,
          title: movie.title,
          poster: getMoviePosterUrl(movie.poster_path, 'w342'),
          rating: movie.vote_average,
          description: movie.overview,
          contentType: 'movie' as const
        }));
      setMovies(transformedMovies);

      // Load popular series
      const seriesResponse = await getPopularSeries(1);
      const transformedSeries = seriesResponse.results
        .slice(0, 10)
        .map((show: any) => ({
          id: String(show.id),
          tmdbId: show.id,
          title: show.name || show.original_name,
          poster: getMoviePosterUrl(show.poster_path, 'w342'),
          rating: show.vote_average,
          description: show.overview,
          contentType: 'series' as const
        }));
      setSeries(transformedSeries);

      // Load popular games
      const gamesResponse = await fetch(
        `https://api.rawg.io/api/games?key=c33c648c0d8f45c494af8da025d7b862&page_size=10&ordering=-rating`
      );
      const gamesData = await gamesResponse.json();
      const transformedGames = gamesData.results
        .filter((game: any) => game.background_image)
        .map((game: any) => ({
          id: String(game.id),
          title: game.name,
          poster: game.background_image,
          rating: game.rating || 0,
          description: game.description || '',
          contentType: 'game' as const
        }));
      setGames(transformedGames);
    } catch (error) {
      console.error('Error loading popular content:', error);
      toast.error('Не удалось загрузить рекомендации');
    } finally {
      setLoading(false);
    }
  };

  const renderContent = (items: PopularItem[]) => {
    if (items.length === 0) {
      return <p className="text-muted-foreground text-center py-8">Ничего не найдено</p>;
    }

    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
        {items.map((item) => (
          <Card key={`${item.contentType}-${item.id}`} className="hover:shadow-lg transition-shadow overflow-hidden group h-full flex flex-col">
            <CardContent className="p-0 relative flex-1 flex flex-col">
              <img
                src={item.poster}
                alt={item.title}
                className="w-full h-48 object-cover flex-shrink-0"
              />
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-60 transition-all duration-300 flex items-center justify-center">
                <Button
                  size="sm"
                  variant="outline"
                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => onAddItem(item)}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="p-2 flex-1 flex flex-col justify-between">
                <div>
                  <p className="text-xs font-semibold truncate line-clamp-2">{item.title}</p>
                  <p className="text-xs text-muted-foreground">⭐ {item.rating.toFixed(1)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Популярное</CardTitle>
        <CardDescription>
          Выберите популярные фильмы, сериалы и игры чтобы добавить в тир-лист
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-center text-muted-foreground py-8">Загрузка...</p>
        ) : (
          <Tabs defaultValue="movies" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="movies">Фильмы</TabsTrigger>
              <TabsTrigger value="series">Сериалы</TabsTrigger>
              <TabsTrigger value="games">Игры</TabsTrigger>
            </TabsList>

            <TabsContent value="movies" className="mt-6">
              {renderContent(movies)}
            </TabsContent>

            <TabsContent value="series" className="mt-6">
              {renderContent(series)}
            </TabsContent>

            <TabsContent value="games" className="mt-6">
              {renderContent(games)}
            </TabsContent>
          </Tabs>
        )}
      </CardContent>
    </Card>
  );
};

export default PopularContent;
