import { useState, useEffect, useMemo, useRef } from "react";
import { Link } from "react-router-dom";
import CatalogSearch from "@/components/CatalogSearch";
import MovieCard from "@/components/MovieCard";
import PosterImage from "@/components/PosterImage";
import ContentActionsButton from "@/components/ContentActionsButton";
import CatalogFilterBar from "@/components/CatalogFilterBar";
import CinemaNav from "@/components/CinemaNav";
import PosterRow from "@/components/PosterRow";
import PosterStatus, { posterStatusRing } from "@/components/PosterStatus";
import { useBookmarks } from "@/context/BookmarkContext";
import { SortOption, GenreFilter, GENRE_TMDB_IDS, GENRE_LIST } from "@/components/MovieSortFilter";
import { claimExclusive, dedupeById } from "@/utils/dedupe";
import { useScrollRestore } from "@/hooks/useScrollRestore";
import { getPopularMovies, getTrendingMovies, searchMovies, getTopRatedMovies } from "@/utils/tmdbApi";
import { useTranslation } from "react-i18next";
import { ContentStatus } from "@/types/anime";
import supabase from "@/lib/supabase";

interface Movie {
  id: number;
  title: string;
  year: string;
  rating: number;
  votes?: number;
  poster: string;
  backdrop?: string;
  description: string;
  rank?: number;
  genre_ids?: number[];
}

/** genre_ids → русские названия чипсов (для hero-мета) */
const genreNames = (ids?: number[], limit = 3): string[] => {
  if (!ids?.length) return [];
  const names: string[] = [];
  for (const g of GENRE_LIST) {
    const tmdbIds = GENRE_TMDB_IDS[g.id]?.movie || [];
    if (ids.some((id) => tmdbIds.includes(id))) {
      names.push(g.name);
      if (names.length >= limit) break;
    }
  }
  return names;
};

const MOVIES_PER_PAGE = 20;

// In-memory cache for Movies page across navigation
let moviesMemoryCache: {
  allMovies: Movie[];
  tab: 'trending' | 'top1000';
} | null = null;
let moviesTrendingMemoryCache: Movie[] | null = null;

const Movies = () => {
  const { t } = useTranslation();
  const { getBookmark } = useBookmarks();
  const observerTarget = useRef<HTMLDivElement>(null);
  
  const [tab, setTab] = useState<'trending' | 'top1000'>(() => moviesMemoryCache?.tab || 'trending');
  const [trendingMovies, setTrendingMoviesState] = useState<Movie[]>(() => moviesTrendingMemoryCache || []);
  const [allMovies, setAllMoviesState] = useState<Movie[]>(() => moviesMemoryCache?.allMovies || []);
  const [displayMovies, setDisplayMovies] = useState<Movie[]>([]);
  const [preview, setPreview] = useState<{query:string; items:Movie[]; error?:boolean} | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(() => !moviesMemoryCache || moviesMemoryCache.allMovies.length === 0);

  const setTrendingMovies = (movies: Movie[]) => {
    moviesTrendingMemoryCache = movies;
    setTrendingMoviesState(movies);
  };

  const setAllMovies = (movies: Movie[]) => {
    moviesMemoryCache = { allMovies: movies, tab };
    setAllMoviesState(movies);
  };
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<ContentStatus | 'all'>('all');
  const [sortBy, setSortBy] = useState<SortOption>('popularity');
  const [genreFilter, setGenreFilter] = useState<GenreFilter>('all');
  const [userBookmarks, setUserBookmarks] = useState<Set<string>>(new Set());

  // Restore scroll after content loads
  useScrollRestore(!loading ? 0 : 50);

  // Load user bookmarks
  useEffect(() => {
    loadUserBookmarks();
  }, []);

  const loadUserBookmarks = async () => {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user?.id) return;

      const { data } = await supabase
        .from('content_bookmarks')
        .select('content_id')
        .eq('user_id', user.user.id)
        .eq('content_type', 'movie');

      if (data) {
        setUserBookmarks(new Set(data.map((item: any) => item.content_id.toString())));
      }
    } catch (error) {
      console.error('Error loading bookmarks:', error);
    }
  };

  // Infinite scroll observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading && !isSearching) {
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
  }, [hasMore, loading, isSearching, page]);

  useEffect(() => {
    if (moviesMemoryCache && moviesMemoryCache.tab === tab && moviesMemoryCache.allMovies.length > 0) {
      setLoading(false);
      return;
    }
    if (tab === 'trending') {
      fetchPopularMovies();
    } else {
      fetchAllTop1000Movies();
    }
    setSearchQuery("");
  }, [tab]);

  // Apply filters and sorting to all movies
  const filteredAndSortedMovies = useMemo(() => {
    let result = allMovies;

    // Apply category filter
    if (selectedCategory !== 'all') {
      result = result.filter(movie => {
        // TODO: Filter by user's movie list status once implemented
        return true;
      });
    }

    // Apply genre filter (real TMDB genre_ids)
    if (genreFilter !== 'all') {
      const tmdbIds = GENRE_TMDB_IDS[genreFilter]?.movie || [];
      result = result.filter(movie => movie.genre_ids?.some(id => tmdbIds.includes(id)));
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
          return (a.rank || 0) - (b.rank || 0) || 0;
      }
    });

    return result;
  }, [allMovies, selectedCategory, sortBy, genreFilter]);

  // Initialize display when allMovies loads (skip if grid already populated — background pages keep appending)
  useEffect(() => {
    if (allMovies.length > 0 && displayMovies.length === 0) {
      setDisplayMovies(filteredAndSortedMovies.slice(0, MOVIES_PER_PAGE));
      setPage(1);
      setHasMore(filteredAndSortedMovies.length > MOVIES_PER_PAGE);
    }
  }, [allMovies.length]);

  useEffect(() => {
    if (searchQuery.trim()) {
      let current = true;
      const timer = window.setTimeout(() => handleSearch(searchQuery, () => current), 180);
      return () => { current = false; window.clearTimeout(timer); setLoading(false); };
    } else {
      setPreview(null);
      // Apply filtered and sorted movies
      setDisplayMovies(filteredAndSortedMovies.slice(0, MOVIES_PER_PAGE));
      setPage(1);
      setHasMore(filteredAndSortedMovies.length > MOVIES_PER_PAGE);
      setIsSearching(false);
    }
  }, [searchQuery, selectedCategory, sortBy, genreFilter]);

  const fetchPopularMovies = async () => {
    try {
      setLoading(true);
      const all: Movie[] = [];
      const seen = new Set<number>();

      // Загружаем тренды дня + первые 6 страниц каталога параллельно (120 фильмов)
      const [trendingRes, ...pageResults] = await Promise.allSettled([
        getTrendingMovies('day'),
        ...Array.from({ length: 6 }, (_, i) => getPopularMovies(i + 1))
      ]);

      let trendingList: Movie[] = [];
      if (trendingRes.status === 'fulfilled' && trendingRes.value?.results) {
        trendingList = (trendingRes.value.results as any[])
          .filter(m => m.poster_path)
          .map(m => ({
            id: m.id,
            title: m.title || m.original_title,
            year: m.release_date?.split('-')[0] || 'Unknown',
            rating: Math.round((m.vote_average || 0) * 10) / 10,
            votes: m.vote_count || 0,
            poster: `https://image.tmdb.org/t/p/w342${m.poster_path}`,
            backdrop: m.backdrop_path ? `https://image.tmdb.org/t/p/w1280${m.backdrop_path}` : undefined,
            description: m.overview || '',
            genre_ids: m.genre_ids || []
          }));
      }

      for (const res of pageResults) {
        if (res.status === 'fulfilled' && res.value?.movies) {
          const transformedMovies: Movie[] = res.value.movies
            .filter(m => m.poster_path && !seen.has(m.id))
            .map(m => ({
              id: m.id,
              title: m.title,
              year: m.release_date?.split('-')[0] || 'Unknown',
              rating: Math.round(m.vote_average * 10) / 10,
              votes: m.vote_count || 0,
              poster: `https://image.tmdb.org/t/p/w342${m.poster_path}`,
              backdrop: m.backdrop_path ? `https://image.tmdb.org/t/p/w1280${m.backdrop_path}` : undefined,
              description: m.overview || '',
              genre_ids: m.genre_ids || []
            }));
          transformedMovies.forEach(m => seen.add(m.id));
          all.push(...transformedMovies);
        }
      }

      setTrendingMovies(trendingList);
      // Выводим стабильную коллекцию за один раз: Топ-10 и ряды больше не прыгают
      setAllMovies([...all]);
      setLoading(false);

      // Фоновая тихая догрузка страниц 7–16 единым пакетом
      setTimeout(async () => {
        try {
          const bgPromises = Array.from({ length: 10 }, (_, i) => getPopularMovies(i + 7));
          const bgResults = await Promise.allSettled(bgPromises);
          const bgMovies: Movie[] = [];
          for (const res of bgResults) {
            if (res.status === 'fulfilled' && res.value?.movies) {
              const transformed = res.value.movies
                .filter(m => m.poster_path && !seen.has(m.id))
                .map(m => ({
                  id: m.id,
                  title: m.title,
                  year: m.release_date?.split('-')[0] || 'Unknown',
                  rating: Math.round(m.vote_average * 10) / 10,
                  votes: m.vote_count || 0,
                  poster: `https://image.tmdb.org/t/p/w342${m.poster_path}`,
                  backdrop: m.backdrop_path ? `https://image.tmdb.org/t/p/w1280${m.backdrop_path}` : undefined,
                  description: m.overview || '',
                  genre_ids: m.genre_ids || []
                }));
              transformed.forEach(m => seen.add(m.id));
              bgMovies.push(...transformed);
            }
          }
          if (bgMovies.length > 0) {
            all.push(...bgMovies);
            setAllMovies([...all]);
          }
        } catch {}
      }, 1500);

    } catch (error) {
      console.error('Error fetching movies:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllTop1000Movies = async () => {
    try {
      setLoading(true);
      let allTopMovies: Movie[] = [];
      const seen = new Set<number>();

      // Fetch multiple pages to get ~1000 top-rated movies
      for (let pageNum = 1; pageNum <= 50; pageNum++) {
        try {
          const { movies } = await getTopRatedMovies(pageNum);

          const transformedMovies: Movie[] = movies
            .filter(m => m.poster_path && m.vote_count > 500 && !seen.has(m.id))
            .map((m, idx) => ({
              id: m.id,
              title: m.title,
              year: m.release_date?.split('-')[0] || 'Unknown',
              rating: Math.round(m.vote_average * 10) / 10,
              votes: m.vote_count || 0,
              poster: `https://image.tmdb.org/t/p/w342${m.poster_path}`,
              backdrop: m.backdrop_path ? `https://image.tmdb.org/t/p/w1280${m.backdrop_path}` : undefined,
              description: m.overview || '',
              genre_ids: m.genre_ids || [],
              rank: allTopMovies.length + idx + 1
            }));
          transformedMovies.forEach(m => seen.add(m.id));

          allTopMovies = [...allTopMovies, ...transformedMovies];
          
          // Stop if we have enough movies or reached the end
          if (allTopMovies.length >= 1000 || movies.length === 0) {
            break;
          }
        } catch (error) {
          console.error(`Error fetching page ${pageNum}:`, error);
          break;
        }
      }

      // Trim to exactly 1000 or less
      allTopMovies = allTopMovies.slice(0, 1000);

      setAllMovies(allTopMovies);
      setDisplayMovies(allTopMovies.slice(0, MOVIES_PER_PAGE));
      setHasMore(allTopMovies.length > MOVIES_PER_PAGE);
    } catch (error) {
      console.error('Error fetching top movies:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (query: string, isCurrent: () => boolean) => {
    if (!query.trim()) {
      setIsSearching(false);
      return;
    }

    try {
      setIsSearching(true);
      setLoading(true);
      const { movies } = await searchMovies(query, 1);
      
      const transformedMovies: Movie[] = dedupeById(movies
        .filter(m => m.poster_path)
        .map(m => ({
          id: m.id,
          title: m.title,
          year: m.release_date?.split('-')[0] || 'Unknown',
          rating: Math.round(m.vote_average * 10) / 10,
          votes: m.vote_count || 0,
          poster: `https://image.tmdb.org/t/p/w342${m.poster_path}`,
          backdrop: m.backdrop_path ? `https://image.tmdb.org/t/p/w1280${m.backdrop_path}` : undefined,
          description: m.overview || '',
          genre_ids: m.genre_ids || []
        })));

      if (!isCurrent()) return;
      setPreview({query:searchQuery, items:transformedMovies.slice(0,5)});
      setAllMovies(transformedMovies);
      setDisplayMovies(transformedMovies.slice(0, MOVIES_PER_PAGE));
      setPage(1);
      setHasMore(transformedMovies.length > MOVIES_PER_PAGE);
    } catch (error) {
      if (!isCurrent()) return;
      setPreview({query:searchQuery, items:[], error:true});
      console.error('Error searching movies:', error);
    } finally {
      if (isCurrent()) setLoading(false);
    }
  };

  const loadMore = () => {
    const nextPage = page + 1;
    const start = page * MOVIES_PER_PAGE;
    const end = start + MOVIES_PER_PAGE;

    const source = filteredAndSortedMovies;
    setDisplayMovies((prev) => [...prev, ...source.slice(start, end)]);
    setPage(nextPage);
    setHasMore(end < source.length);
  };

  // Kinopoisk-style rows mode: no active filters/search, trending tab
  const rowsMode = tab === 'trending' && !searchQuery.trim() && genreFilter === 'all' && selectedCategory === 'all';

  const renderMovie = (movie: Movie) => <MovieCard movie={movie} />;

  // ── Эксклюзивные ряды одним проходом: каждый фильм живёт ровно
  // в одном ряду — ни по id, ни по базе названия («Обитель зла» vs
  // «Обитель зла: Раккун-Сити») повторов нет ──
  const rails = useMemo(() => {
    const usedIds = new Set<number | string>();
    const usedTitles = new Set<string>();
    const idOf = (m: Movie) => m.id;
    const titleOf = (m: Movie) => m.title;

    // «Топ-10 сегодня» строго из реальных дневных трендов TMDB (trending/movie/day)
    const sourceForTop10 = trendingMovies.length > 0 ? trendingMovies : allMovies;
    const topTen = claimExclusive(sourceForTop10, 10, usedIds, usedTitles, idOf, titleOf);
    const topRated = claimExclusive(
      [...allMovies].sort((a, b) => b.rating - a.rating),
      20, usedIds, usedTitles, idOf, titleOf,
    );
    const genreRows = GENRE_LIST.map((g) => {
      const tmdbIds = GENRE_TMDB_IDS[g.id]?.movie || [];
      const items = claimExclusive(
        allMovies.filter((m) => m.genre_ids?.some((id) => tmdbIds.includes(id))),
        30, usedIds, usedTitles, idOf, titleOf,
      );
      return { ...g, items };
    }).filter((r) => r.items.length >= 6);
    return { topTen, topRated, genreRows };
  }, [allMovies, trendingMovies]);
  const { topTen, topRated: topRatedMovies, genreRows } = rails;

  // ── Billboard hero: витрина топ-10 (как билборд КП — spotlight, не ряд) ──
  const featured = useMemo(() => {
    const fromTop = topTen.filter((m) => m.backdrop).slice(0, 5);
    if (fromTop.length > 0) return fromTop;
    return allMovies.filter((m) => m.backdrop).slice(0, 5);
  }, [topTen, allMovies]);
  const [heroIdx, setHeroIdx] = useState(0);
  useEffect(() => { setHeroIdx(0); }, [tab]);
  useEffect(() => {
    if (featured.length < 2) return;
    const id = setInterval(() => setHeroIdx((i) => (i + 1) % featured.length), 7000);
    return () => clearInterval(id);
  }, [featured.length, tab]);
  const hero = featured.length ? featured[heroIdx % featured.length] : undefined;
  const heroGenres = useMemo(() => genreNames(hero?.genre_ids), [hero]);

  const filtersActive = selectedCategory !== 'all' || sortBy !== 'popularity' || genreFilter !== 'all';

  return (
    <div className="min-h-screen">
      <style>{`
        .mv-hero-img { animation: mv-zoom 7.5s ease-out both; }
        @keyframes mv-zoom { from { transform: scale(1.09); } to { transform: scale(1); } }
        .mv-hero-text { animation: mv-rise .55s cubic-bezier(.16,1,.3,1) both; }
        @keyframes mv-rise { from { opacity: 0; transform: translateY(18px); } to { opacity: 1; transform: none; } }

        /* ========================================================
           CINEMATIC 3D TOP-10 NUMBERS (VOLUMETRIC / КИНЕМАТОГРАФИЧНЫЙ ОБЪЁМ)
           ======================================================== */
        .top10-num {
          font-family: 'Montserrat', 'Impact', 'Arial Black', -apple-system, BlinkMacSystemFont, sans-serif;
          font-weight: 900;
          letter-spacing: -0.05em;
          display: inline-block;
          user-select: none;
          pointer-events: none;
          transform-origin: bottom center;
          will-change: transform;
        }

        /* 🥇 Rank 1: Luminous Royal Cyber-Gold (яркое, сияющее чистое золото с белым бликом) */
        .top10-num-1 {
          background: linear-gradient(180deg, #ffffff 0%, #fffbeb 15%, #fef08a 35%, #facc15 60%, #eab308 85%, #ca8a04 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          -webkit-text-stroke: 2px #fffbeb;
          filter:
            drop-shadow(1px 1px 0px #f59e0b)
            drop-shadow(2px 2px 0px #d97706)
            drop-shadow(3px 3px 0px #b45309)
            drop-shadow(4px 4px 0px #92400e)
            drop-shadow(5px 5px 0px #78350f)
            drop-shadow(6px 6px 0px #451a03)
            drop-shadow(8px 10px 18px rgba(0, 0, 0, 0.95))
            drop-shadow(0px 0px 24px rgba(250, 204, 21, 0.45));
        }

        /* 🥈 Rank 2: Diamond Platinum Chrome (кристальный ультра-яркий платиновый хром) */
        .top10-num-2 {
          background: linear-gradient(180deg, #ffffff 0%, #ffffff 25%, #f1f5f9 45%, #cbd5e1 70%, #94a3b8 90%, #64748b 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          -webkit-text-stroke: 2px #ffffff;
          filter:
            drop-shadow(1px 1px 0px #cbd5e1)
            drop-shadow(2px 2px 0px #94a3b8)
            drop-shadow(3px 3px 0px #64748b)
            drop-shadow(4px 4px 0px #475569)
            drop-shadow(5px 5px 0px #334155)
            drop-shadow(6px 6px 0px #1e293b)
            drop-shadow(8px 10px 18px rgba(0, 0, 0, 0.95))
            drop-shadow(0px 0px 24px rgba(255, 255, 255, 0.4));
        }

        /* 🥉 Rank 3: Radiant Amber-Bronze (насыщенная сияющая медно-янтарная бронза) */
        .top10-num-3 {
          background: linear-gradient(180deg, #ffffff 0%, #fff7ed 15%, #ffedd5 35%, #fed7aa 55%, #fb923c 80%, #ea580c 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          -webkit-text-stroke: 2px #ffedd5;
          filter:
            drop-shadow(1px 1px 0px #fb923c)
            drop-shadow(2px 2px 0px #f97316)
            drop-shadow(3px 3px 0px #ea580c)
            drop-shadow(4px 4px 0px #c2410c)
            drop-shadow(5px 5px 0px #9a3412)
            drop-shadow(6px 6px 0px #7c2d12)
            drop-shadow(8px 10px 18px rgba(0, 0, 0, 0.95))
            drop-shadow(0px 0px 24px rgba(251, 146, 60, 0.4));
        }

        /* 🎬 Ranks 4-10: Polished Steel / Titanium Chrome (тот самый полюбившийся стиль) */
        .top10-num-regular {
          background: linear-gradient(180deg, #ffffff 0%, #ffffff 25%, #e4e4e7 45%, #a1a1aa 70%, #52525b 90%, #27272a 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          -webkit-text-stroke: 2px #ffffff;
          filter:
            drop-shadow(1px 1px 0px #a1a1aa)
            drop-shadow(2px 2px 0px #71717a)
            drop-shadow(3px 3px 0px #52525b)
            drop-shadow(4px 4px 0px #3f3f46)
            drop-shadow(5px 5px 0px #27272a)
            drop-shadow(6px 6px 0px #18181b)
            drop-shadow(8px 10px 18px rgba(0, 0, 0, 0.95))
            drop-shadow(0px 0px 18px rgba(255, 255, 255, 0.25));
        }

        .top10-num-10 {
          letter-spacing: -0.16em;
        }

        .top10-num-10 {
          letter-spacing: -0.16em;
        }
      `}</style>
      <div className="container mx-auto px-4 py-8">
        <CinemaNav active="movies" />

        {/* ── Billboard hero: тёмная кинозал-карточка в обеих темах ── */}
        {loading && featured.length === 0 ? (
          <div className="relative overflow-hidden rounded-[1.75rem] border border-border bg-zinc-950 min-h-[380px] md:min-h-[460px] animate-pulse">
            <div className="absolute bottom-0 p-6 md:p-10 space-y-3">
              <div className="h-4 w-40 rounded bg-white/10" />
              <div className="h-10 w-80 max-w-full rounded-lg bg-white/10" />
              <div className="h-4 w-64 max-w-full rounded bg-white/10" />
            </div>
          </div>
        ) : hero ? (
          <section className="relative overflow-hidden rounded-[1.75rem] border border-white/10 bg-zinc-950 text-white shadow-[0_30px_80px_-30px_rgba(0,0,0,0.7)]">
            {/* backdrop */}
            {featured.map((m, i) => (
              <img
                key={m.id}
                src={m.backdrop}
                alt=""
                aria-hidden
                className={`absolute inset-0 w-full h-full object-cover object-top transition-opacity duration-1000 ${
                  i === heroIdx % featured.length ? 'opacity-100 mv-hero-img' : 'opacity-0'
                }`}
                loading={i === 0 ? 'eager' : 'lazy'}
              />
            ))}
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/55 to-black/5 pointer-events-none" />
            <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/35 to-transparent pointer-events-none" />
            {/* контент */}
            <div key={hero.id} className="relative px-5 md:px-10 pt-16 md:pt-20 pb-16 md:pb-14 max-w-3xl">
              <div className="mv-hero-text">
                <span className="inline-block rounded-full bg-amber-400 text-black text-[13px] font-extrabold tracking-normal px-3.5 py-1.5 shadow-lg shadow-amber-500/30">
                  № {(heroIdx % featured.length) + 1} в тренде
                </span>
              </div>
              <h1
                className="mv-hero-text font-black tracking-tight leading-[0.95] text-4xl sm:text-5xl lg:text-6xl mt-4 [text-wrap:balance]"
                style={{ animationDelay: '60ms' }}
              >
                {hero.title}
              </h1>
              <div className="mv-hero-text flex flex-wrap items-center gap-x-3 gap-y-2 mt-4 text-sm" style={{ animationDelay: '120ms' }}>
                <span className="font-black text-amber-300">
                  {hero.rating.toFixed(1)}
                </span>
                {hero.votes ? <span className="text-white/50 text-xs font-semibold">{hero.votes.toLocaleString('ru-RU')} оценок</span> : null}
                <span className="text-white/30">•</span>
                <span className="font-semibold text-white/85">{hero.year}</span>
                {heroGenres.map((g) => (
                  <span key={g} className="rounded-full border border-white/20 bg-white/10 backdrop-blur px-2.5 py-0.5 text-xs font-semibold text-white/85">
                    {g}
                  </span>
                ))}
              </div>
              {hero.description && (
                <p className="mv-hero-text mt-3 max-w-xl text-sm md:text-[15px] leading-relaxed text-white/70 line-clamp-2 md:line-clamp-3" style={{ animationDelay: '180ms' }}>
                  {hero.description}
                </p>
              )}
              <div className="mv-hero-text flex flex-wrap items-center gap-2.5 mt-6" style={{ animationDelay: '240ms' }}>
                <Link
                  to={`/movie/${hero.id}`}
                  className="inline-flex items-center h-11 px-6 rounded-full bg-gradient-to-b from-amber-300 to-amber-500 text-black text-sm font-black shadow-[0_10px_30px_-8px_rgba(251,191,36,0.7)] hover:brightness-110 active:scale-95 transition-all"
                >
                  Смотреть
                </Link>
                <Link
                  to={`/movie/${hero.id}`}
                  className="inline-flex items-center h-11 px-5 rounded-full border border-white/20 bg-white/10 backdrop-blur text-sm font-bold text-white hover:bg-white/20 active:scale-95 transition-all"
                >
                  Подробнее
                </Link>
                <ContentActionsButton
                  contentId={hero.id.toString()}
                  contentType="movie"
                  top50MediaType="movie"
                  title={hero.title}
                  posterUrl={hero.poster}
                  externalRating={hero.rating}
                  releaseYear={hero.year}
                  synopsis={hero.description}
                />
              </div>
            </div>
            {/* точки */}
            <div className="absolute bottom-5 right-5 md:right-8 flex items-center gap-1.5">
              {featured.map((m, i) => (
                <button
                  key={m.id}
                  onClick={() => setHeroIdx(i)}
                  aria-label={m.title}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    i === heroIdx % featured.length ? 'w-7 bg-amber-400' : 'w-2.5 bg-white/30 hover:bg-white/60'
                  }`}
                />
              ))}
            </div>
          </section>
        ) : null}

        {/* ── Тулбар: поиск + табы + фильтры ── */}
        <div className="mt-5 rounded-2xl border border-border/70 bg-card/70 backdrop-blur px-3.5 py-3 dark:bg-white/[0.02]">
          <div className="flex flex-col gap-2.5 xl:flex-row xl:items-center">
            <div className="relative flex-1 min-w-[220px]">
              <CatalogSearch
                value={searchQuery}
                onChange={setSearchQuery}
          preview={preview?.query === searchQuery ? preview : undefined}
          resultPath="/movie/"
                placeholder={tab === 'trending' ? 'Поиск фильмов...' : 'Поиск в топ 1000...'}
              />
            </div>
            <div className="inline-flex items-center gap-1 p-1 rounded-full bg-muted/70 border border-border dark:bg-white/[0.04] dark:border-white/[0.08] self-start">
              {([
                { key: 'trending', label: 'В тренде' },
                { key: 'top1000', label: 'Топ 1000' },
              ] as const).map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setTab(key)}
                  className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all duration-200 ${
                    tab === key
                      ? 'bg-foreground text-background shadow dark:bg-white dark:text-black'
                      : 'text-muted-foreground hover:text-foreground dark:hover:text-white'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2 mt-2.5">
            <CatalogFilterBar
              statusValue={selectedCategory}
              onStatusChange={setSelectedCategory}
              contentType="movie"
              sortBy={sortBy}
              onSortChange={setSortBy}
              genre={genreFilter}
              onGenreChange={setGenreFilter}
              onReset={() => {
                setSelectedCategory('all');
                setSortBy('popularity');
                setGenreFilter('all');
              }}
            />
            <p className="text-xs font-semibold text-muted-foreground px-1">
              <span className="text-foreground">{filtersActive || searchQuery.trim() ? filteredAndSortedMovies.length : allMovies.length}</span> в каталоге
            </p>
          </div>
        </div>

        {loading ? (
          rowsMode ? (
            <div className="space-y-10">
              {/* Топ-10 скелетон */}
              <div>
                <div className="h-7 w-48 bg-zinc-900/80 rounded-lg animate-pulse mb-4" />
                <div className="flex gap-4 overflow-hidden pb-4">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="shrink-0 flex items-end gap-2">
                      <div className="w-14 h-24 bg-zinc-900/50 rounded-xl animate-pulse -mr-3" />
                      <div className="w-[140px] aspect-[2/3] bg-zinc-900/80 rounded-2xl animate-pulse border border-white/5" />
                    </div>
                  ))}
                </div>
              </div>
              {/* Ряды подборок */}
              {[...Array(2)].map((_, r) => (
                <div key={r}>
                  <div className="h-6 w-40 bg-zinc-900/80 rounded-lg animate-pulse mb-3" />
                  <div className="flex gap-4 overflow-hidden pb-2">
                    {[...Array(7)].map((_, i) => (
                      <div key={i} className="w-[140px] aspect-[2/3] bg-zinc-900/80 rounded-xl shrink-0 animate-pulse border border-white/5" />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-7 gap-4">
              {[...Array(14)].map((_, i) => (
                <div key={i} className="aspect-[2/3] bg-zinc-900/80 animate-pulse rounded-xl border border-white/5" />
              ))}
            </div>
          )
        ) : rowsMode ? (
          <>
            {/* Топ-10 с гигантскими 3D номерами */}
            {topTen.length > 0 && (
              <section className="mb-12">
                <h2 className="font-grotesk text-xl sm:text-2xl font-bold tracking-tight text-foreground dark:text-white min-w-0 mb-4 flex items-center gap-2">
                  <span>Топ-10 сегодня</span>
                </h2>
                <div className="flex gap-2 sm:gap-4 overflow-x-auto kp-scroll pb-4 pt-2 -mx-2 px-2">
                  {topTen.map((m, i) => (
                    <Link
                      key={m.id}
                      to={`/movie/${m.id}`}
                      className="group shrink-0 flex flex-col rounded-2xl p-1.5 transition-all duration-300 hover:bg-muted/30 dark:hover:bg-white/[0.03]"
                    >
                      {/* Верхняя часть: 3D Номер + Постер (номер выровнен строго по низу ПОСТЕРА) */}
                      <div className="flex items-end relative">
                        <span
                          className={`top10-num ${
                            i === 0
                              ? "top10-num-1 -mr-1.5 sm:-mr-2.5"
                              : i === 1
                              ? "top10-num-2 -mr-2.5 sm:-mr-3.5 md:-mr-4"
                              : i === 2
                              ? "top10-num-3 -mr-2.5 sm:-mr-3.5 md:-mr-4"
                              : i === 9
                              ? "top10-num-10 -mr-6 sm:-mr-8 md:-mr-9"
                              : "top10-num-regular -mr-3 sm:-mr-4 md:-mr-5"
                          } text-[7.5rem] sm:text-[9.5rem] md:text-[11rem] leading-[0.82] select-none mb-3 sm:mb-4 transition-transform duration-300 group-hover:-translate-y-2`}
                        >
                          {i + 1}
                        </span>
                        <div className={`relative z-10 w-[136px] sm:w-[158px] aspect-[2/3] rounded-2xl overflow-hidden border border-white/10 dark:border-white/15 shadow-[0_12px_28px_rgba(0,0,0,0.65)] transition-all duration-300 group-hover:scale-[1.03] group-hover:shadow-[0_22px_45px_rgba(0,0,0,0.88)] group-hover:border-primary/50 ${posterStatusRing(getBookmark('movie', String(m.id)))}`}>
                          <PosterImage
                            src={m.poster}
                            alt={m.title}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                          />
                          <PosterStatus bookmark={getBookmark('movie', String(m.id))} />
                        </div>
                      </div>

                      {/* Нижняя часть: Название и рейтинг (строго под постером, НЕ перекрываются цифрой) */}
                      <div className="relative z-20 mt-2 w-[136px] sm:w-[158px] self-end px-0.5">
                        <span className="block text-xs sm:text-[13px] font-semibold truncate text-foreground/90 dark:text-zinc-100 group-hover:text-primary transition-colors">
                          {m.title}
                        </span>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-xs font-bold text-amber-500 dark:text-amber-400">
                            ★ {m.rating.toFixed(1)}
                          </span>
                          <span className="text-[11px] font-medium text-muted-foreground">
                            · {m.year}
                          </span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            )}
            <PosterRow title="Высокий рейтинг" items={topRatedMovies} render={renderMovie} getKey={(m) => m.id} />
            {genreRows.map((row) => (
              <PosterRow key={row.id} title={row.name} items={row.items} render={renderMovie} getKey={(m) => m.id} />
            ))}
          </>
        ) : (
        <>
          <div id="catalog-search-results" tabIndex={-1} className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-7 gap-4">
            {displayMovies.map((movie) => (
              <div key={movie.id} className="relative group">
                {/* Rank ticket */}
                {movie.rank && (
                  <div className="absolute top-2 left-2 z-10 rounded-lg bg-zinc-950/90 backdrop-blur border border-amber-400/40 px-2 py-1 shadow-lg group-hover:scale-105 transition-transform">
                    <span className="text-xs font-black tracking-wider text-amber-300">#{movie.rank}</span>
                  </div>
                )}
                <MovieCard movie={movie} />
              </div>
            ))}
          </div>
          
          {/* Infinite Scroll Observer */}
          <div ref={observerTarget} className="flex justify-center py-8">
            {hasMore && <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-cyan-500" />}
          </div>
        </>
      )}

      {!loading && displayMovies.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">{t('movies.noResults')}</p>
        </div>
      )}
      </div>
    </div>
  );
};
export default Movies;