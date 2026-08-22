import supabase from './supabase';
import { OMDbRating } from './omdbApi';

export interface IMDbRatingRecord {
  id: string;
  tmdb_id: number;
  imdb_id: string | null;
  imdb_rating: number | null;
  imdb_votes: number | null;
  media_type: 'movie' | 'tv';
  last_updated: string;
  created_at: string;
}

/**
 * Get cached IMDb rating from database
 */
export const getCachedIMDbRating = async (
  tmdbId: number
): Promise<IMDbRatingRecord | null> => {
  try {
    const { data, error } = await supabase
      .from('movies_imdb_ratings')
      .select('*')
      .eq('tmdb_id', tmdbId)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching cached rating:', error);
      return null;
    }

    return data || null;
  } catch (error) {
    console.error('Error getting cached IMDb rating:', error);
    return null;
  }
};

/**
 * Save IMDb rating to cache
 */
export const saveIMDbRating = async (
  tmdbId: number,
  imdbId: string | null,
  rating: OMDbRating | null,
  mediaType: 'movie' | 'tv'
): Promise<IMDbRatingRecord | null> => {
  try {
    if (!rating) {
      return null;
    }

    const payload = {
      tmdb_id: tmdbId,
      imdb_id: imdbId,
      imdb_rating: rating.imdbRating || null,
      imdb_votes: rating.imdbVotes || null,
      media_type: mediaType,
      last_updated: new Date().toISOString()
    };

    // First try to update
    const { data: existing, error: checkError } = await supabase
      .from('movies_imdb_ratings')
      .select('id')
      .eq('tmdb_id', tmdbId)
      .single();

    let result;
    let error;

    if (existing && !checkError) {
      // Update existing
      const res = await supabase
        .from('movies_imdb_ratings')
        .update(payload)
        .eq('tmdb_id', tmdbId)
        .select()
        .single();
      result = res.data;
      error = res.error;
    } else {
      // Insert new
      const res = await supabase
        .from('movies_imdb_ratings')
        .insert([payload])
        .select()
        .single();
      result = res.data;
      error = res.error;
    }

    if (error) {
      console.error('Error saving IMDb rating:', error);
      return null;
    }

    return result;
  } catch (error) {
    console.error('Error saving IMDb rating:', error);
    return null;
  }
};

/**
 * Get or fetch IMDb rating (with caching)
 */
export const getOrFetchIMDbRating = async (
  tmdbId: number,
  imdbId: string | null,
  rating: OMDbRating | null,
  mediaType: 'movie' | 'tv'
): Promise<IMDbRatingRecord | null> => {
  // Try to get from cache first
  const cached = await getCachedIMDbRating(tmdbId);
  
  if (cached) {
    // Update if data is stale (older than 7 days)
    const lastUpdated = new Date(cached.last_updated);
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    
    if (lastUpdated < sevenDaysAgo && rating) {
      return await saveIMDbRating(tmdbId, imdbId, rating, mediaType);
    }
    
    return cached;
  }

  // Save new rating if provided
  if (rating) {
    return await saveIMDbRating(tmdbId, imdbId, rating, mediaType);
  }

  return null;
};

/**
 * Batch fetch/cache IMDb ratings
 */
export const batchCacheIMDbRatings = async (
  ratings: Array<{
    tmdbId: number;
    imdbId: string | null;
    rating: OMDbRating | null;
    mediaType: 'movie' | 'tv';
  }>
): Promise<IMDbRatingRecord[]> => {
  try {
    const records = ratings
      .filter(r => r.rating) // Only save non-null ratings
      .map(r => ({
        tmdb_id: r.tmdbId,
        imdb_id: r.imdbId,
        imdb_rating: r.rating?.imdbRating || null,
        imdb_votes: r.rating?.imdbVotes || null,
        media_type: r.mediaType,
        last_updated: new Date().toISOString()
      }));

    if (records.length === 0) {
      return [];
    }

    const { data, error } = await supabase
      .from('movies_imdb_ratings')
      .upsert(records, {
        onConflict: 'tmdb_id'
      })
      .select();

    if (error) {
      console.error('Error batch caching ratings:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error batch caching IMDb ratings:', error);
    return [];
  }
};

export default {
  getCachedIMDbRating,
  saveIMDbRating,
  getOrFetchIMDbRating,
  batchCacheIMDbRatings
};
