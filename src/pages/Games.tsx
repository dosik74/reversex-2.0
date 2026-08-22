import { useState, useEffect, useMemo, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, X } from "lucide-react";
import GameCard from "@/components/GameCard";
import MovieSortFilter, { SortOption } from "@/components/MovieSortFilter";
import { useScrollRestore } from "@/hooks/useScrollRestore";
import { useTranslation } from "react-i18next";

interface Game {
  id: number;
  title: string;
  year: string;
  rating: number;
  poster: string;
  description: string;
  genres?: string[];
}

const GAMES_PER_PAGE = 20;

const GAME_GENRES = [
  "Action",
  "Adventure",
  "RPG",
  "Strategy",
  "Simulation",
  "Sports",
  "Racing",
  "Puzzle",
  "Shooter",
  "Fighting",
  "Indie",
  "Horror",
];

const Games = () => {
  const { t } = useTranslation();
  const observerTarget = useRef<HTMLDivElement>(null);
  
  const [allGames, setAllGames] = useState<Game[]>([]);
  const [displayGames, setDisplayGames] = useState<Game[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [sortBy, setSortBy] = useState<SortOption>('popularity');

  // Restore scroll after content loads
  useScrollRestore(!loading ? 0 : 50);

  // Infinite scroll observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          loadMore();
        }
      },
      { threshold: 0.1 }
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => {
      if (observerTarget.current) {
        observer.unobserve(observerTarget.current);
      }
    };
  }, [hasMore, loading, page]);

  // Apply filters and sorting to all games
  const filteredAndSortedGames = useMemo(() => {
    let result = allGames;

    // Apply genre filter
    if (selectedGenres.length > 0) {
      result = result.filter(game => {
        return game.genres?.some(genre => selectedGenres.includes(genre));
      });
    }

    // Apply sorting
    result = [...result].sort((a, b) => {
      switch (sortBy) {
        case 'rating':
          return b.rating - a.rating;
        case 'title':
          return a.title.localeCompare(b.title);
        case 'year':
          return parseInt(b.year) - parseInt(a.year);
        case 'popularity':
        default:
          return b.rating - a.rating; // Default to rating for games
      }
    });

    return result;
  }, [allGames, selectedGenres, sortBy]);

  // Initialize display when allGames loads
  useEffect(() => {
    if (allGames.length > 0) {
      setDisplayGames(filteredAndSortedGames.slice(0, GAMES_PER_PAGE));
      setPage(1);
      setHasMore(filteredAndSortedGames.length > GAMES_PER_PAGE);
    }
  }, [allGames.length]);

  useEffect(() => {
    fetchPopularGames();
  }, []);

  useEffect(() => {
    if (searchQuery.trim()) {
      performSearch();
    } else {
      // Apply filtered and sorted games when not searching
      setDisplayGames(filteredAndSortedGames.slice(0, GAMES_PER_PAGE));
      setPage(1);
      setHasMore(filteredAndSortedGames.length > GAMES_PER_PAGE);
    }
  }, [searchQuery, selectedGenres, sortBy]);

  const fetchPopularGames = async () => {
    try {
      setLoading(true);
      const apiKey = "c33c648c0d8f45c494af8da025d7b862";
      
      const response = await fetch(
        `https://api.rawg.io/api/games?key=${apiKey}&page_size=100&ordering=-rating`
      );
      const data = await response.json();

      const transformedGames: Game[] = data.results
        .filter((g: any) => g.background_image)
        .map((g: any) => ({
          id: g.id,
          title: g.name,
          year: g.released?.split('-')[0] || 'Unknown',
          rating: Math.round((g.rating || 0) * 10) / 10,
          poster: g.background_image,
          description: g.description || '',
          genres: g.genres?.map((genre: any) => genre.name) || []
        }));

      setAllGames(transformedGames);
      setDisplayGames(transformedGames.slice(0, GAMES_PER_PAGE));
      setHasMore(transformedGames.length > GAMES_PER_PAGE);
    } catch (error) {
      console.error('Error fetching games:', error);
    } finally {
      setLoading(false);
    }
  };

  const performSearch = async () => {
    try {
      setLoading(true);
      const apiKey = "c33c648c0d8f45c494af8da025d7b862";
      
      let url = `https://api.rawg.io/api/games?key=${apiKey}&page_size=40`;
      
      if (searchQuery.trim()) {
        url += `&search=${encodeURIComponent(searchQuery)}`;
      }
      
      if (selectedGenres.length > 0) {
        const genreIds = selectedGenres.map(genre => {
          const genreMap: { [key: string]: string } = {
            "Action": "action",
            "Adventure": "adventure",
            "RPG": "roleplaying",
            "Strategy": "strategy",
            "Simulation": "simulation",
            "Sports": "sports",
            "Racing": "racing",
            "Puzzle": "puzzle",
            "Shooter": "shooter",
            "Fighting": "fighting",
            "Indie": "indie",
            "Horror": "horror",
          };
          return genreMap[genre] || genre.toLowerCase();
        }).join(',');
        url += `&genres=${genreIds}`;
      }

      const response = await fetch(url);
      const data = await response.json();

      const transformedGames: Game[] = data.results
        .filter((g: any) => g.background_image)
        .map((g: any) => ({
          id: g.id,
          title: g.name,
          year: g.released?.split('-')[0] || 'Unknown',
          rating: Math.round((g.rating || 0) * 10) / 10,
          poster: g.background_image,
          description: g.description || '',
          genres: g.genres?.map((genre: any) => genre.name) || []
        }));

      setAllGames(transformedGames);
      setDisplayGames(transformedGames.slice(0, GAMES_PER_PAGE));
      setPage(1);
      setHasMore(transformedGames.length > GAMES_PER_PAGE);
    } catch (error) {
      console.error('Error searching games:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMore = () => {
    const nextPage = page + 1;
    const start = page * GAMES_PER_PAGE;
    const end = start + GAMES_PER_PAGE;

    const source = filteredAndSortedGames;
    setDisplayGames((prev) => [...prev, ...source.slice(start, end)]);
    setPage(nextPage);
    setHasMore(end < source.length);
  };

  const toggleGenre = (genre: string) => {
    setSelectedGenres((prev) =>
      prev.includes(genre) ? prev.filter((g) => g !== genre) : [...prev, genre]
    );
  };

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedGenres([]);
    fetchPopularGames();
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-6 gradient-text">Игры</h1>

        {/* Search Bar */}
        <div className="relative max-w-md mb-6">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
          <Input
            type="text"
            placeholder="Поиск игр..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Genre Filters */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold">Жанры</h2>
            {(searchQuery || selectedGenres.length > 0) && (
              <Button variant="ghost" size="sm" onClick={clearFilters} className="flex items-center gap-2">
                <X className="w-4 h-4" />
                Очистить фильтры
              </Button>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {GAME_GENRES.map((genre) => (
              <Button
                key={genre}
                variant={selectedGenres.includes(genre) ? "default" : "outline"}
                size="sm"
                onClick={() => toggleGenre(genre)}
              >
                {genre}
              </Button>
            ))}
          </div>
        </div>

        {/* Sort Filter */}
        <MovieSortFilter
          sortBy={sortBy}
          onSortChange={setSortBy}
          genre="all"
          onGenreChange={() => {}}
        />
      </div>

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {[...Array(20)].map((_, i) => (
            <div key={i} className="aspect-[2/3] bg-muted animate-pulse rounded-lg" />
          ))}
        </div>
      ) : displayGames.length > 0 ? (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {displayGames.map((game) => (
              <GameCard key={game.id} game={game} />
            ))}
          </div>

          {/* Infinite Scroll Observer */}
          <div ref={observerTarget} className="flex justify-center py-8">
            {hasMore && <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-purple-500" />}
          </div>
        </>
      ) : (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Игры не найдены</p>
        </div>
      )}
    </div>
  );
};

export default Games;
