// Service to integrate TMDB and OMDb APIs
import { TMDB_API_KEY, TMDB_BASE_URL } from './tmdbApi';
import { getIMDbRating, OMDbRating } from './omdbApi';

export interface MovieWithRating {
  id: number;
  title: string;
  imdbId: string | null;
  imdbRating: OMDbRating | null;
  poster_path: string | null;
  release_date: string;
}

/**
 * Get IMDb ID from TMDB movie ID
 */
export const getImdbIdFromTMDB = async (tmdbId: number): Promise<string | null> => {
  try {
    const response = await fetch(
      `${TMDB_BASE_URL}/movie/${tmdbId}?api_key=${TMDB_API_KEY}&language=en-US`,
      { method: 'GET' }
    );

    if (!response.ok) {
      console.error(`TMDB API error: ${response.status}`);
      return null;
    }

    const data = await response.json();
    return data.imdb_id || null;
  } catch (error) {
    console.error('Error fetching IMDb ID from TMDB:', error);
    return null;
  }
};

/**
 * Get IMDb ID from TMDB TV series ID
 */
export const getImdbIdFromTMDBSeries = async (tmdbId: number): Promise<string | null> => {
  try {
    // First try getting external_ids directly
    const response = await fetch(
      `${TMDB_BASE_URL}/tv/${tmdbId}/external_ids?api_key=${TMDB_API_KEY}`,
      { method: 'GET' }
    );

    if (!response.ok) {
      console.error(`TMDB API error: ${response.status}`);
      return null;
    }

    const data = await response.json();
    return data.imdb_id || null;
  } catch (error) {
    console.error('Error fetching IMDb ID from TMDB series:', error);
    return null;
  }
};

/**
 * Get movie with IMDb rating
 */
export const getMovieWithRating = async (
  tmdbId: number,
  title: string,
  posterPath: string | null,
  releaseDate: string
): Promise<MovieWithRating> => {
  const imdbId = await getImdbIdFromTMDB(tmdbId);
  let imdbRating: OMDbRating | null = null;

  if (imdbId) {
    imdbRating = await getIMDbRating(imdbId);
  }

  return {
    id: tmdbId,
    title,
    imdbId,
    imdbRating,
    poster_path: posterPath,
    release_date: releaseDate
  };
};

/**
 * Get series with IMDb rating
 */
export const getSeriesWithRating = async (
  tmdbId: number,
  title: string,
  posterPath: string | null,
  releaseDate: string
): Promise<MovieWithRating> => {
  const imdbId = await getImdbIdFromTMDBSeries(tmdbId);
  let imdbRating: OMDbRating | null = null;

  if (imdbId) {
    imdbRating = await getIMDbRating(imdbId);
  }

  return {
    id: tmdbId,
    title,
    imdbId,
    imdbRating,
    poster_path: posterPath,
    release_date: releaseDate
  };
};

export default {
  getImdbIdFromTMDB,
  getImdbIdFromTMDBSeries,
  getMovieWithRating,
  getSeriesWithRating
};
