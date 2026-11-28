import { useState, useEffect, useMemo, useRef } from "react";
import GameCard from "@/components/GameCard";
import CatalogHeader from "@/components/CatalogHeader";
import CatalogFilterBar from "@/components/CatalogFilterBar";
import CinemaNav from "@/components/CinemaNav";
import PosterRow from "@/components/PosterRow";
import { SortOption } from "@/components/MovieSortFilter";
import { claimExclusive } from "@/utils/dedupe";
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

// In-memory cache for Games page across navigation
let gamesMemoryCache: Game[] | null = null;

const Games = () => {
  const { t } = useTranslation();
  const observerTarget = useRef<HTMLDivElement>(null);
  
  const [allGames, setAllGamesState] = useState<Game[]>(() => gamesMemoryCache || []);
  const [displayGames, setDisplayGames] = useState<Game[]>([]);
  const [preview, setPreview] = useState<{query:string; items:Game[]; error?:boolean} | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [loading, setLoading] = useState(() => !gamesMemoryCache || gamesMemoryCache.length === 0);

  const setAllGames = (games: Game[]) => {
    gamesMemoryCache = games;
    setAllGamesState(games);
  };
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
    if (gamesMemoryCache && gamesMemoryCache.length > 0) {
      setLoading(false);
      return;
    }
    fetchPopularGames();
  }, []);

  useEffect(() => {
    if (searchQuery.trim()) {
      let current = true;
      const timer = window.setTimeout(() => performSearch(() => current), 180);
      return () => { current = false; window.clearTimeout(timer); setLoading(false); };
    } else {
      setPreview(null);
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
      const TOTAL_PAGES = 5; // 5 × 40 = 200 игр

      // Загружаем страницы параллельно за ~400мс без задержек и дёрганья
      const promises = Array.from({ length: TOTAL_PAGES }, (_, i) =>
        fetchRawg(
          `https://api.rawg.io/api/games?key=${RAWG_API_KEY}&page_size=40&page=${i + 1}&ordering=-added`
        ).catch(() => null)
      );

      const results = await Promise.all(promises);

      for (const data of results) {
        if (!data?.results) continue;
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
      }

      setAllGames([...byId.values()]);
    } catch (error) {
      console.error('Error fetching games:', error);
    } finally {
      setLoading(false);
    }
  };

  const performSearch = async (isCurrent: () => boolean) => {
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

      if (!isCurrent()) return;
      setPreview({query:searchQuery, items:transformedGames.slice(0,5)});
      setAllGames(transformedGames);
      setDisplayGames(transformedGames.slice(0, GAMES_PER_PAGE));
      setPage(1);
      setHasMore(transformedGames.length > GAMES_PER_PAGE);
    } catch (error) {
      if (!isCurrent()) return;
      setPreview({query:searchQuery, items:[], error:true});
      console.error('Error searching games:', error);
    } finally {
      if (isCurrent()) setLoading(false);
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

  // ── Эксклюзивные ряды одним проходом: каждая игра ровно в одном
  // ряду — ни по id, ни по базе названия повторов нет ──
  const rails = useMemo(() => {
    const usedIds = new Set<number | string>();
    const usedTitles = new Set<string>();
    const idOf = (g: Game) => g.id;
    const titleOf = (g: Game) => g.title;
    const top = claimExclusive(allGames, 20, usedIds, usedTitles, idOf, titleOf);
    const genres = GAME_GENRES.map((genre) => {
      const items = claimExclusive(
        allGames.filter((g) => g.genres?.some((x) => x.toLowerCase() === genre.toLowerCase())),
        30, usedIds, usedTitles, idOf, titleOf,
      );
      return { id: genre, name: gameGenreRu(genre), items };
    }).filter((r) => r.items.length >= 6);
    return { top, genres };
  }, [allGames]);
  const { top: topGames, genres: genreRows } = rails;

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
          preview={preview?.query === searchQuery ? preview : undefined}
          resultPath="/game/"
          glow="from-amber-200 to-orange-500"
          accent="text-amber-700 dark:text-amber-200/90"
        >
          <CatalogFilterBar
            showStatus={false}
            sortBy={sortBy}
            onSortChange={setSortBy}
            genreMode="multi"
            multiOptions={GAME_GENRES.map((g) => ({ id: g, label: gameGenreRu(g) }))}
            multiSelected={selectedGenres}
            onToggleMultiGenre={toggleGenre}
            onReset={() => {
              setSelectedGenres([]);
              setSortBy('popularity');
            }}
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
          <div id="catalog-search-results" tabIndex={-1} className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-7 gap-4">
            {displayGames.map((game) => (
              <GameCard key={game.id} game={game} />
            ))}
          </div>

          {/* Infinite Scroll Observer */}
          <div ref={observerTarget} className="flex justify-center py-8">
            {hasMore && <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-cyan-500" />}
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
