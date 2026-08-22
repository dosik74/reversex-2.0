import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, Plus } from 'lucide-react';
import { searchMovies, getMoviePosterUrl, searchSeries } from '@/utils/tmdbApi';
import { Card, CardContent } from '@/components/ui/card';

interface SearchResult {
  id: string;
  title: string;
  poster: string;
  rating: number;
  description: string;
  contentType: 'movie' | 'series' | 'game';
  tmdbId?: number;
}

interface TierListSearchProps {
  onAddItem: (item: SearchResult) => void;
}

const TierListSearch = ({ onAddItem }: TierListSearchProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('movies');

  const searchMoviesContent = async (query: string) => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    setLoading(true);
    try {
      const response = await searchMovies(query);
      const transformed = response.movies.map((movie: any) => ({
        id: String(movie.id),
        tmdbId: movie.id,
        title: movie.title,
        poster: getMoviePosterUrl(movie.poster_path, 'w342'),
        rating: movie.vote_average,
        description: movie.overview,
        contentType: 'movie' as const
      }));
      setResults(transformed);
    } catch (error) {
      console.error('Error searching movies:', error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const searchSeriesContent = async (query: string) => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    setLoading(true);
    try {
      const response = await searchSeries(query);
      const transformed = response.results.map((series: any) => ({
        id: String(series.id),
        tmdbId: series.id,
        title: series.name || series.original_name,
        poster: getMoviePosterUrl(series.poster_path, 'w342'),
        rating: series.vote_average,
        description: series.overview,
        contentType: 'series' as const
      }));
      setResults(transformed);
    } catch (error) {
      console.error('Error searching series:', error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const searchGamesContent = async (query: string) => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    setLoading(true);
    try {
      const apiKey = "c33c648c0d8f45c494af8da025d7b862";
      const response = await fetch(
        `https://api.rawg.io/api/games?key=${apiKey}&search=${encodeURIComponent(query)}&page_size=20`
      );
      const data = await response.json();

      const transformed = data.results
        .filter((game: any) => game.background_image)
        .map((game: any) => ({
          id: String(game.id),
          title: game.name,
          poster: game.background_image,
          rating: game.rating || 0,
          description: game.description || '',
          contentType: 'game' as const
        }));

      setResults(transformed);
    } catch (error) {
      console.error('Error searching games:', error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (activeTab === 'movies') searchMoviesContent(query);
    else if (activeTab === 'series') searchSeriesContent(query);
    else if (activeTab === 'games') searchGamesContent(query);
  };

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    if (searchQuery.trim()) {
      if (tab === 'movies') searchMoviesContent(searchQuery);
      else if (tab === 'series') searchSeriesContent(searchQuery);
      else if (tab === 'games') searchGamesContent(searchQuery);
    }
  };

  return (
    <div className="w-full space-y-4">
      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="movies">Фильмы</TabsTrigger>
          <TabsTrigger value="series">Сериалы</TabsTrigger>
          <TabsTrigger value="games">Игры</TabsTrigger>
        </TabsList>

        <div className="mt-4 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={`Поиск ${activeTab === 'movies' ? 'фильмов' : activeTab === 'series' ? 'сериалов' : 'игр'}...`}
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-10"
            />
          </div>

          {loading && <p className="text-center text-sm text-muted-foreground">Загрузка...</p>}

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 max-h-96 overflow-y-auto">
            {results.map((result) => (
              <Card key={`${result.contentType}-${result.id}`} className="hover:shadow-lg transition-shadow cursor-pointer overflow-hidden group">
                <CardContent className="p-0 relative h-full">
                  <img
                    src={result.poster}
                    alt={result.title}
                    className="w-full h-48 object-cover"
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-60 transition-all duration-300 flex items-center justify-center">
                    <Button
                      size="sm"
                      variant="outline"
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => onAddItem(result)}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="p-2">
                    <p className="text-xs font-semibold truncate">{result.title}</p>
                    <p className="text-xs text-muted-foreground">⭐ {result.rating.toFixed(1)}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {!loading && results.length === 0 && searchQuery && (
            <p className="text-center text-sm text-muted-foreground">Ничего не найдено</p>
          )}
        </div>
      </Tabs>
    </div>
  );
};

export default TierListSearch;
