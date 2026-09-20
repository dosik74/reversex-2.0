// TMDB API configuration
export const TMDB_API_KEY = 'a981b3ba0b345f578fb917ee74a90bf3';
const TMDB_ACCESS_TOKEN = 'eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiJhOTgxYjNiYTBiMzQ1ZjU3OGZiOTE3ZWU3NGE5MGJmMyIsIm5iZiI6MTc1MjUyMjUxMy40MjcsInN1YiI6IjY4NzU1ZjExNzUzYjVjNTYwM2Y5MWJkMyIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.Trm6p4NqL6VPKlvUkGkRMKVjeH2KAklTAllVbnolV8w';
export const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

export interface TMDBMovie {
  id: number;
  title: string;
  original_title: string;
  release_date: string;
  poster_path: string | null;
  backdrop_path: string | null;
  overview: string;
  vote_average: number;
  vote_count: number;
  genres: Array<{ id: number; name: string }>;
  runtime: number;
  budget: number;
  revenue: number;
  status?: string;
  production_companies?: Array<{ id: number; name: string; logo_path: string | null; origin_country: string }>;
}

export interface TMDBMovieResponse {
  results: Array<{
    id: number;
    title: string;
    original_title: string;
    release_date: string;
    poster_path: string | null;
    backdrop_path: string | null;
    overview: string;
    vote_average: number;
    vote_count: number;
    genre_ids: number[];
    popularity?: number;
  }>;
  total_pages: number;
  total_results: number;
  page: number;
}

const headers = {
  'Authorization': `Bearer ${TMDB_ACCESS_TOKEN}`,
  'Accept': 'application/json'
};

/**
 * Fetch movies by genre with pagination and sorting
 */
export const fetchMoviesByGenre = async (
  genreId: number,
  sortBy: 'popularity.desc' | 'rating.desc' | 'release_date.desc' = 'popularity.desc',
  page: number = 1
): Promise<{ movies: TMDBMovieResponse['results']; totalPages: number }> => {
  try {
    const response = await fetch(
      `${TMDB_BASE_URL}/discover/movie?with_genres=${genreId}&sort_by=${sortBy}&page=${page}&language=ru-RU`,
      { headers }
    );

    if (!response.ok) {
      throw new Error(`TMDB API error: ${response.status}`);
    }

    const data: TMDBMovieResponse = await response.json();
    return {
      movies: data.results,
      totalPages: data.total_pages
    };
  } catch (error) {
    console.error('Error fetching movies by genre:', error);
    throw error;
  }
};

/**
 * Search movies by title
 */
export const searchMovies = async (
  query: string,
  page: number = 1
): Promise<{ movies: TMDBMovieResponse['results']; totalPages: number }> => {
  try {
    const response = await fetch(
      `${TMDB_BASE_URL}/search/movie?query=${encodeURIComponent(query)}&page=${page}&language=ru-RU`,
      { headers }
    );

    if (!response.ok) {
      throw new Error(`TMDB API error: ${response.status}`);
    }

    const data: TMDBMovieResponse = await response.json();
    return {
      movies: data.results,
      totalPages: data.total_pages
    };
  } catch (error) {
    console.error('Error searching movies:', error);
    throw error;
  }
};

/**
 * TMDB отдаёт русские названия жанров со строчной буквы («документальный»).
 * Приводим к нормальному виду для бейджей: «Документальный».
 */
export const formatGenreName = (name: string): string =>
  name ? name.charAt(0).toUpperCase() + name.slice(1) : name;

/** Статус фильма/сериала по-русски (TMDB отдаёт английский) */
const STATUS_RU: Record<string, string> = {
  Released: 'Выпущен',
  Rumored: 'По слухам',
  Planned: 'Запланирован',
  'In Production': 'В производстве',
  'Post Production': 'Постпродакшн',
  Canceled: 'Отменён',
  Cancelled: 'Отменён',
  'Returning Series': 'Выходит',
  Ended: 'Завершён',
  Pilot: 'Пилот',
};

export const statusRu = (status?: string): string =>
  status ? STATUS_RU[status] || status : '';

/** 129 → «2 ч 9 мин», 45 → «45 мин» */
export const formatRuntime = (minutes?: number): string => {
  if (!minutes || minutes <= 0) return '';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h <= 0) return `${m} мин`;
  return m > 0 ? `${h} ч ${m} мин` : `${h} ч`;
};

/** 160000000 → «$160 млн», 1132723226 → «$1,13 млрд» */
export const formatMoney = (value?: number): string => {
  if (!value || value <= 0) return '';
  if (value >= 1_000_000_000) {
    return `$${(value / 1_000_000_000).toLocaleString('ru-RU', { maximumFractionDigits: 2 })} млрд`;
  }
  if (value >= 1_000_000) {
    return `$${Math.round(value / 1_000_000).toLocaleString('ru-RU')} млн`;
  }
  return `$${value.toLocaleString('ru-RU')}`;
};

/**
 * Get movie details including runtime, budget, revenue
 */
export const getMovieDetails = async (movieId: number, language: string = 'ru-RU'): Promise<TMDBMovie> => {
  try {
    const response = await fetch(
      `${TMDB_BASE_URL}/movie/${movieId}?language=${language}`,
      { headers }
    );

    if (!response.ok) {
      throw new Error(`TMDB API error: ${response.status}`);
    }

    const data: TMDBMovie = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching movie details:', error);
    throw error;
  }
};

/**
 * Get popular movies
 */
export const getPopularMovies = async (
  page: number = 1
): Promise<{ movies: TMDBMovieResponse['results']; totalPages: number }> => {
  try {
    const response = await fetch(
      `${TMDB_BASE_URL}/movie/popular?page=${page}&language=ru-RU`,
      { headers }
    );

    if (!response.ok) {
      throw new Error(`TMDB API error: ${response.status}`);
    }

    const data: TMDBMovieResponse = await response.json();
    return {
      movies: data.results,
      totalPages: data.total_pages
    };
  } catch (error) {
    console.error('Error fetching popular movies:', error);
    throw error;
  }
};

/**
 * Get top-rated movies
 */
export const getTopRatedMovies = async (
  page: number = 1
): Promise<{ movies: TMDBMovieResponse['results']; totalPages: number }> => {
  try {
    const response = await fetch(
      `${TMDB_BASE_URL}/movie/top_rated?page=${page}&language=ru-RU`,
      { headers }
    );

    if (!response.ok) {
      throw new Error(`TMDB API error: ${response.status}`);
    }

    const data: TMDBMovieResponse = await response.json();
    return {
      movies: data.results,
      totalPages: data.total_pages
    };
  } catch (error) {
    console.error('Error fetching top-rated movies:', error);
    throw error;
  }
};

/**
 * Get movie poster URL
 */
export const getMoviePosterUrl = (posterPath: string | null, size: 'w342' | 'w500' | 'w780' = 'w342'): string => {
  if (!posterPath) {
    return 'https://placehold.co/342x513/1a1a2e/ffffff?text=No+Image';
  }
  return `https://image.tmdb.org/t/p/${size}${posterPath}`;
};

/**
 * Get TMDB genres
 */
export const getGenres = async (): Promise<Array<{ id: number; name: string }>> => {
  try {
    const response = await fetch(
      `${TMDB_BASE_URL}/genre/movie/list?language=ru-RU`,
      { headers }
    );

    if (!response.ok) {
      throw new Error(`TMDB API error: ${response.status}`);
    }

    const data = await response.json();
    return data.genres || [];
  } catch (error) {
    console.error('Error fetching genres:', error);
    return [];
  }
};

/**
 * Get movie videos (trailers, teasers, etc.)
 */
export const getMovieVideos = async (movieId: number): Promise<Array<{
  id: string;
  key: string;
  name: string;
  site: string;
  type: string;
}>> => {
  try {
    const response = await fetch(
      `${TMDB_BASE_URL}/movie/${movieId}/videos?language=ru-RU`,
      { headers }
    );

    if (!response.ok) {
      throw new Error(`TMDB API error: ${response.status}`);
    }

    const data = await response.json();
    return data.results || [];
  } catch (error) {
    console.error('Error fetching movie videos:', error);
    return [];
  }
};

/**
 * Get movie credits (cast and crew)
 */
export const getMovieCredits = async (movieId: number): Promise<{
  cast: Array<{ id: number; name: string; character: string; profile_path: string | null; order?: number }>;
  crew: Array<{ id: number; name: string; job: string; profile_path: string | null }>;
}> => {
  try {
    const response = await fetch(
      `${TMDB_BASE_URL}/movie/${movieId}/credits`,
      { headers }
    );

    if (!response.ok) {
      throw new Error(`TMDB API error: ${response.status}`);
    }

    const data = await response.json();
    return {
      cast: data.cast || [],
      crew: data.crew || []
    };
  } catch (error) {
    console.error('Error fetching movie credits:', error);
    return { cast: [], crew: [] };
  }
};

/**
 * Get similar movies
 */
export const getSimilarMovies = async (movieId: number): Promise<{ movies: TMDBMovieResponse['results']; }> => {
  try {
    const response = await fetch(
      `${TMDB_BASE_URL}/movie/${movieId}/similar?language=ru-RU`,
      { headers }
    );

    if (!response.ok) {
      throw new Error(`TMDB API error: ${response.status}`);
    }

    const data: TMDBMovieResponse = await response.json();
    return {
      movies: data.results
    };
  } catch (error) {
    console.error('Error fetching similar movies:', error);
    return { movies: [] };
  }
};

/**
 * Get popular TV series
 */
export const getPopularSeries = async (page: number = 1): Promise<TMDBMovieResponse> => {
  try {
    const response = await fetch(
      `${TMDB_BASE_URL}/tv/popular?language=ru-RU&page=${page}`,
      { headers }
    );

    if (!response.ok) {
      throw new Error(`TMDB API error: ${response.status}`);
    }

    const data: TMDBMovieResponse = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching popular series:', error);
    return { results: [], total_pages: 0, total_results: 0, page };
  }
};

/**
 * Search TV series
 */
export const searchSeries = async (query: string, page: number = 1): Promise<TMDBMovieResponse> => {
  try {
    const response = await fetch(
      `${TMDB_BASE_URL}/search/tv?query=${encodeURIComponent(query)}&language=ru-RU&page=${page}`,
      { headers }
    );

    if (!response.ok) {
      throw new Error(`TMDB API error: ${response.status}`);
    }

    const data: TMDBMovieResponse = await response.json();
    return data;
  } catch (error) {
    console.error('Error searching series:', error);
    return { results: [], total_pages: 0, total_results: 0, page };
  }
};

/**
 * Get TV series details
 */
export const getSeriesDetails = async (seriesId: number, language: string = 'ru-RU'): Promise<TMDBMovie> => {
  try {
    const response = await fetch(
      `${TMDB_BASE_URL}/tv/${seriesId}?language=${language}`,
      { headers }
    );

    if (!response.ok) {
      throw new Error(`TMDB API error: ${response.status}`);
    }

    const data = await response.json();
    
    // Transform TV series data to match movie interface
    return {
      id: data.id,
      title: data.name || data.original_name,
      original_title: data.original_name,
      release_date: data.first_air_date,
      poster_path: data.poster_path,
      backdrop_path: data.backdrop_path,
      overview: data.overview,
      vote_average: data.vote_average,
      vote_count: data.vote_count,
      runtime: data.episode_run_time?.[0] || 0,
      budget: 0,
      revenue: 0,
      genres: data.genres || [],
      production_companies: data.production_companies || []
    };
  } catch (error) {
    console.error('Error fetching series details:', error);
    throw error;
  }
};

/**
 * Get TV series videos/trailers
 */
export const getSeriesVideos = async (seriesId: number): Promise<Array<{
  id: string;
  key: string;
  name: string;
  site: string;
  type: string;
}>> => {
  try {
    const response = await fetch(
      `${TMDB_BASE_URL}/tv/${seriesId}/videos?language=ru-RU`,
      { headers }
    );

    if (!response.ok) {
      throw new Error(`TMDB API error: ${response.status}`);
    }

    const data = await response.json();
    return data.results || [];
  } catch (error) {
    console.error('Error fetching series videos:', error);
    return [];
  }
};

/**
 * Get TV series cast + crew (полный состав, без обрезки — сортировка на клиенте)
 */
export const getSeriesCredits = async (seriesId: number): Promise<{
  cast: Array<{ id: number; name: string; character: string; profile_path: string | null; order?: number; total_episode_count?: number; }>;
  crew: Array<{ id: number; name: string; job: string; profile_path: string | null; }>;
}> => {
  try {
    const response = await fetch(
      `${TMDB_BASE_URL}/tv/${seriesId}/credits?language=ru-RU`,
      { headers }
    );

    if (!response.ok) {
      throw new Error(`TMDB API error: ${response.status}`);
    }

    const data = await response.json();
    return {
      cast: data.cast || [],
      crew: data.crew || []
    };
  } catch (error) {
    console.error('Error fetching series credits:', error);
    return { cast: [], crew: [] };
  }
};

/**
 * Get similar TV series (нормализуем tv-поля к виду { title, release_date })
 */
export const getSimilarSeries = async (seriesId: number): Promise<{ series: TMDBMovieResponse['results']; }> => {
  try {
    const response = await fetch(
      `${TMDB_BASE_URL}/tv/${seriesId}/similar?language=ru-RU`,
      { headers }
    );

    if (!response.ok) {
      throw new Error(`TMDB API error: ${response.status}`);
    }

    const data = await response.json();
    return {
      series: (data.results || []).map(normalizeTvItem)
    };
  } catch (error) {
    console.error('Error fetching similar series:', error);
    return { series: [] };
  }
};

/** Приводим tv-объект (name/first_air_date) к movie-виду (title/release_date) */
export const normalizeTvItem = (s: any): TMDBMovieResponse['results'][number] => ({
  id: s.id,
  title: s.name || s.original_name || s.title || 'Без названия',
  original_title: s.original_name || '',
  release_date: s.first_air_date || s.release_date || '',
  poster_path: s.poster_path || null,
  backdrop_path: s.backdrop_path || null,
  overview: s.overview || '',
  vote_average: s.vote_average || 0,
  vote_count: s.vote_count || 0,
  genre_ids: s.genre_ids || [],
  popularity: s.popularity || 0,
});

/**
 * Рекомендации TMDB — второй источник «похожего».
 * Для малоизвестных тайтлов /similar часто отдаёт мусор,
 * recommendations + ранжирование по жанрам дают заметно чище выдачу.
 */
export const getMovieRecommendations = async (movieId: number): Promise<{ movies: TMDBMovieResponse['results']; }> => {
  try {
    const response = await fetch(
      `${TMDB_BASE_URL}/movie/${movieId}/recommendations?language=ru-RU`,
      { headers }
    );
    if (!response.ok) throw new Error(`TMDB API error: ${response.status}`);
    const data: TMDBMovieResponse = await response.json();
    return { movies: data.results || [] };
  } catch (error) {
    console.error('Error fetching movie recommendations:', error);
    return { movies: [] };
  }
};

export const getSeriesRecommendations = async (seriesId: number): Promise<{ series: TMDBMovieResponse['results']; }> => {
  try {
    const response = await fetch(
      `${TMDB_BASE_URL}/tv/${seriesId}/recommendations?language=ru-RU`,
      { headers }
    );
    if (!response.ok) throw new Error(`TMDB API error: ${response.status}`);
    const data = await response.json();
    return { series: (data.results || []).map(normalizeTvItem) };
  } catch (error) {
    console.error('Error fetching series recommendations:', error);
    return { series: [] };
  }
};

/**
 * Добивка: популярные тайтлы тех же жанров, если похожего набралось мало.
 */
export const discoverMoviesByGenres = async (genreIds: number[]): Promise<TMDBMovieResponse['results']> => {
  try {
    const response = await fetch(
      `${TMDB_BASE_URL}/discover/movie?with_genres=${genreIds.join(',')}&sort_by=vote_count.desc&vote_count.gte=25&page=1&language=ru-RU`,
      { headers }
    );
    if (!response.ok) throw new Error(`TMDB API error: ${response.status}`);
    const data: TMDBMovieResponse = await response.json();
    return data.results || [];
  } catch (error) {
    console.error('Error discovering movies by genres:', error);
    return [];
  }
};

export const discoverSeriesByGenres = async (genreIds: number[]): Promise<TMDBMovieResponse['results']> => {
  try {
    const response = await fetch(
      `${TMDB_BASE_URL}/discover/tv?with_genres=${genreIds.join(',')}&sort_by=vote_count.desc&vote_count.gte=15&page=1&language=ru-RU`,
      { headers }
    );
    if (!response.ok) throw new Error(`TMDB API error: ${response.status}`);
    const data = await response.json();
    return (data.results || []).map(normalizeTvItem);
  } catch (error) {
    console.error('Error discovering series by genres:', error);
    return [];
  }
};

/**
 * Ранжирование «похожих»: отсекаем мусор без голосов и без общих жанров,
 * сортируем по совпадению жанров, затем по числу голосов.
 */
export const rankBySimilarity = <
  T extends { id: number; genre_ids?: number[]; vote_count?: number; popularity?: number }
>(
  genreIds: number[],
  items: T[]
): T[] => {
  const wanted = new Set(genreIds);
  const seen = new Set<number>();
  return items
    .filter((m) => {
      if (seen.has(m.id)) return false;
      seen.add(m.id);
      return true;
    })
    .map((m) => ({
      m,
      overlap: (m.genre_ids || []).filter((g) => wanted.has(g)).length,
      votes: m.vote_count || 0,
    }))
    .filter((x) => x.votes >= 10 || x.overlap >= 2)
    .sort(
      (a, b) =>
        b.overlap - a.overlap ||
        b.votes - a.votes ||
        (b.m.popularity || 0) - (a.m.popularity || 0)
    )
    .map((x) => x.m);
};

/** Ключевые профессии — первыми, без фото не показываем */
const KEY_CREW_JOBS = [
  'Director',
  'Screenplay',
  'Writer',
  'Producer',
  'Executive Producer',
  'Novel',
  'Characters',
  'Director of Photography',
  'Original Music Composer',
  'Editor',
];

export const orderCrew = <T extends { job: string; profile_path: string | null }>(crew: T[]): T[] => {
  const rank = (job: string) => {
    const i = KEY_CREW_JOBS.indexOf(job);
    return i === -1 ? KEY_CREW_JOBS.length : i;
  };
  return crew
    .filter((c) => c.profile_path)
    .sort((a, b) => rank(a.job) - rank(b.job));
};

// ── Wiki: персоны (актёры, режиссёры) ─────────────────────────────────────

export interface TMDBPerson {
  id: number;
  name: string;
  biography: string;
  birthday: string | null;
  deathday: string | null;
  place_of_birth: string | null;
  profile_path: string | null;
  known_for_department: string;
  popularity: number;
}

export interface TMDBCredit {
  id: number;
  title?: string;
  name?: string;
  original_title?: string;
  original_name?: string;
  poster_path: string | null;
  release_date?: string;
  first_air_date?: string;
  vote_average: number;
  character?: string;
  job?: string;
  department?: string;
  media_type?: string;
}

export const getPersonDetails = async (personId: number, language: string = 'ru-RU'): Promise<TMDBPerson> => {
  const response = await fetch(
    `${TMDB_BASE_URL}/person/${personId}?language=${language}`,
    { headers }
  );
  if (!response.ok) throw new Error(`TMDB API error: ${response.status}`);
  return response.json();
};

export const getPersonMovieCredits = async (personId: number): Promise<{ cast: TMDBCredit[]; crew: TMDBCredit[] }> => {
  const response = await fetch(
    `${TMDB_BASE_URL}/person/${personId}/movie_credits?language=ru-RU`,
    { headers }
  );
  if (!response.ok) throw new Error(`TMDB API error: ${response.status}`);
  const data = await response.json();
  return { cast: data.cast || [], crew: data.crew || [] };
};

export const getPersonTvCredits = async (personId: number): Promise<{ cast: TMDBCredit[]; crew: TMDBCredit[] }> => {
  const response = await fetch(
    `${TMDB_BASE_URL}/person/${personId}/tv_credits?language=ru-RU`,
    { headers }
  );
  if (!response.ok) throw new Error(`TMDB API error: ${response.status}`);
  const data = await response.json();
  return { cast: data.cast || [], crew: data.crew || [] };
};

// ── Wiki: кинокомпании ────────────────────────────────────────────────────

export interface TMDBCompany {
  id: number;
  name: string;
  description: string;
  headquarters: string;
  homepage: string;
  logo_path: string | null;
  origin_country: string;
}

export const getCompanyDetails = async (companyId: number): Promise<TMDBCompany> => {
  const response = await fetch(`${TMDB_BASE_URL}/company/${companyId}`, { headers });
  if (!response.ok) throw new Error(`TMDB API error: ${response.status}`);
  return response.json();
};

export const getCompanyMovies = async (
  companyId: number,
  page: number = 1
): Promise<{ movies: TMDBMovieResponse['results']; totalPages: number }> => {
  const response = await fetch(
    `${TMDB_BASE_URL}/discover/movie?with_companies=${companyId}&sort_by=popularity.desc&page=${page}&language=ru-RU`,
    { headers }
  );
  if (!response.ok) throw new Error(`TMDB API error: ${response.status}`);
  const data: TMDBMovieResponse = await response.json();
  return { movies: data.results, totalPages: data.total_pages };
};
