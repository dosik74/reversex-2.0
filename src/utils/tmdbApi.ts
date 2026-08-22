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
 * Get movie details including runtime, budget, revenue
 */
export const getMovieDetails = async (movieId: number): Promise<TMDBMovie> => {
  try {
    const response = await fetch(
      `${TMDB_BASE_URL}/movie/${movieId}?language=ru-RU`,
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
  cast: Array<{ id: number; name: string; character: string; profile_path: string | null }>;
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
export const getSeriesDetails = async (seriesId: number): Promise<TMDBMovie> => {
  try {
    const response = await fetch(
      `${TMDB_BASE_URL}/tv/${seriesId}?language=ru-RU`,
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
      genres: data.genres || []
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
 * Get TV series cast
 */
export const getSeriesCredits = async (seriesId: number): Promise<{
  cast: Array<{ id: number; name: string; character: string; profile_path: string | null; }>;
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
      cast: (data.cast || []).slice(0, 20)
    };
  } catch (error) {
    console.error('Error fetching series credits:', error);
    return { cast: [] };
  }
};

/**
 * Get similar TV series
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

    const data: TMDBMovieResponse = await response.json();
    return {
      series: data.results
    };
  } catch (error) {
    console.error('Error fetching similar series:', error);
    return { series: [] };
  }
};
