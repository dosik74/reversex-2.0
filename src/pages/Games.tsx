import { useState, useEffect, useMemo, useRef } from "react";
import { Search, X } from "lucide-react";
import GameCard from "@/components/GameCard";
import CatalogHeader from "@/components/CatalogHeader";
import CinemaNav from "@/components/CinemaNav";
import PosterRow from "@/components/PosterRow";
import MovieSortFilter, { SortOption } from "@/components/MovieSortFilter";
import { useScrollRestore } from "@/hooks/useScrollRestore";
import { useTranslation } from "react-i18next";
import { fetchRawg, gameGenreRu, RAWG_API_KEY } from "@/utils/rawgApi";

interface Game {
  id: number;
  title: string;
  year: string;
  rating: number;
  ratingsCount?: number;
  poster: string;
  description: string;
  genres?: string[];
}

/** Одна игра — одна карточка: склеиваем дубли по id (RAWG отдаёт повторы между страницами) */
const dedupeGames = (games: Game[]): Game[] => {
  const map = new Map<number, Game>();
  for (const g of games) {
    if (!map.has(g.id)) map.set(g.id, g);
  }
  return [...map.values()];
};

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

  // Initialize display when allGames loads (skip if grid already populated)
  useEffect(() => {
    if (allGames.length > 0 && displayGames.length === 0) {
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
      // ordering=-added: реально популярные игры. -rating у RAWG забит
      // ноунеймом с 5 голосами 5★ — отсюда «одинаковые» 4.8 у всех.
      const byId = new Map<number, Game>();
      const TOTAL_PAGES = 6; // 6 × 40 = до 240 игр

      for (let pageNum = 1; pageNum <= TOTAL_PAGES; pageNum++) {
        try {
          const data = await fetchRawg(
            `https://api.rawg.io/api/games?key=${RAWG_API_KEY}&page_size=40&page=${pageNum}&ordering=-added`
          );
          if (!data.results || data.results.length === 0) break;

          for (const g of data.results) {
            if (!g.background_image || byId.has(g.id)) continue;
            byId.set(g.id, {
              id: g.id,
              title: g.name,
              year: g.released?.split('-')[0] || 'Unknown',
              rating: Math.round((g.rating || 0) * 10) / 10,
              ratingsCount: g.ratings_count || 0,
              poster: g.background_image,
              description: g.description || '',
              genres: g.genres?.map((genre: any) => genre.name) || []
            });
          }

          // Progressive render
          if (pageNum >= 1) setLoading(false);
          setAllGames([...byId.values()]);

          await new Promise(resolve => setTimeout(resolve, 150));
        } catch (err) {
          console.warn(`Failed to load games page ${pageNum}:`, err);
          continue; // одна упавшая страница не роняет весь каталог
        }
      }

      setAllGames([...byId.values()]);
    } catch (error) {
      console.error('Error fetching games:', error);
    } finally {
      setLoading(false);
    }
  };

  const performSearch = async () => {
    try {
      setLoading(true);
      let url = `https://api.rawg.io/api/games?key=${RAWG_API_KEY}&page_size=40`;
      
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

      const data = await fetchRawg(url);

      const transformedGames: Game[] = dedupeGames(data.results
        .filter((g: any) => g.background_image)
        .map((g: any) => ({
          id: g.id,
          title: g.name,
          year: g.released?.split('-')[0] || 'Unknown',
          rating: Math.round((g.rating || 0) * 10) / 10,
          ratingsCount: g.ratings_count || 0,
          poster: g.background_image,
          description: g.description || '',
          genres: g.genres?.map((genre: any) => genre.name) || []
        })));

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

  // Kinopoisk-style rows mode: no active filters/search
  const rowsMode = !searchQuery.trim() && selectedGenres.length === 0;

  const topGames = useMemo(() => allGames.slice(0, 20), [allGames]);

  // Genre rows: each game appears in only ONE row (its first matching genre)
  const genreRows = useMemo(
    () => {
      const used = new Set<number>(topGames.map((g) => g.id));
      return GAME_GENRES.map((genre) => {
        const items: Game[] = [];
        for (const g of allGames) {
          if (used.has(g.id)) continue;
          if (g.genres?.some((x) => x.toLowerCase() === genre.toLowerCase())) {
            items.push(g);
            used.add(g.id);
            if (items.length >= 30) break;
          }
        }
        return { id: genre, name: gameGenreRu(genre), items };
      }).filter((r) => r.items.length >= 6);
    },
    [allGames, topGames]
  );

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
    <div className="min-h-screen">
      <div className="container mx-auto px-4 py-8">
        <CinemaNav active="games" />
        <CatalogHeader
          scriptLabel="Кинотеатр"
          title="Игры"
          subtitle={`Лучшие игры · ${allGames.length} в каталоге`}
          searchPlaceholder="Поиск игр..."
          searchValue={searchQuery}
          onSearchChange={setSearchQuery}
          glow="from-amber-200 to-orange-500"
          accent="text-amber-200/90"
        >
          {/* Genre pills */}
          <div className="mb-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-[10px] uppercase tracking-[0.2em] text-zinc-500 font-bold">Жанры</p>
              {(searchQuery || selectedGenres.length > 0) && (
                <button
                  onClick={clearFilters}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-white/[0.04] border border-white/[0.06] text-zinc-400 hover:bg-red-500/10 hover:text-red-300 hover:border-red-500/30 transition-all"
                >
                  <X className="w-3.5 h-3.5" />
                  Очистить
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {GAME_GENRES.map((genre) => {
                const active = selectedGenres.includes(genre);
                return (
                  <button
                    key={genre}
                    onClick={() => toggleGenre(genre)}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-colors duration-200 border ${
                      active
                        ? 'bg-white text-black border-transparent'
                        : 'bg-white/[0.04] text-zinc-400 border-white/[0.06] hover:bg-white/[0.08] hover:text-zinc-200'
                    }`}
                  >
                    {gameGenreRu(genre)}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Sort Filter */}
          <MovieSortFilter
            sortBy={sortBy}
            onSortChange={setSortBy}
            genre="all"
            onGenreChange={() => {}}
            showGenres={false}
          />
        </CatalogHeader>

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-7 gap-4">
          {[...Array(20)].map((_, i) => (
            <div key={i} className="aspect-[2/3] bg-muted animate-pulse rounded-lg" />
          ))}
        </div>
      ) : rowsMode ? (
        <>
          <PosterRow title="Лучшие игры" items={topGames} render={(g) => <GameCard game={g} />} getKey={(g) => g.id} />
          {genreRows.map((row) => (
            <PosterRow key={row.id} title={row.name} items={row.items} render={(g) => <GameCard game={g} />} getKey={(g) => g.id} />
          ))}
        </>
      ) : displayGames.length > 0 ? (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-7 gap-4">
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
    </div>
  );
};

export default Games;
