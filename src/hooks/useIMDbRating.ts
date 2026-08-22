import { useState, useEffect, useRef } from 'react';
import { getIMDbRating, OMDbRating } from '@/utils/omdbApi';
import { getImdbIdFromTMDB, getImdbIdFromTMDBSeries } from '@/utils/ratingService';
import { getCachedIMDbRating, saveIMDbRating } from '@/utils/imdbCache';

interface UseIMDbRatingOptions {
  tmdbId?: number;
  imdbId?: string;
  mediaType?: 'movie' | 'tv';
}

export const useIMDbRating = (options: UseIMDbRatingOptions) => {
  const [rating, setRating] = useState<OMDbRating | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isMountedRef = useRef(true);
  const fetchedRef = useRef(false);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    // Don't fetch again if we already have it
    if (fetchedRef.current) {
      return;
    }

    const fetchRating = async () => {
      if (!options.imdbId && !options.tmdbId) {
        setRating(null);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        let imdbId = options.imdbId;
        const tmdbId = options.tmdbId;

        // Step 1: Try to get from database cache first
        if (tmdbId && !imdbId) {
          try {
            const cached = await getCachedIMDbRating(tmdbId);
            if (cached && cached.imdb_rating && isMountedRef.current) {
              const ratingObj: OMDbRating = {
                imdbId: cached.imdb_id || '',
                imdbRating: cached.imdb_rating,
                imdbVotes: cached.imdb_votes,
                imdbType: options.mediaType === 'tv' ? 'series' : 'movie'
              };
              setRating(ratingObj);
              setLoading(false);
              fetchedRef.current = true;
              return;
            }
            
            // Get imdbId from cache if available
            if (cached && cached.imdb_id) {
              imdbId = cached.imdb_id;
            }
          } catch (cacheErr) {
            console.warn('Cache error:', cacheErr);
          }
        }

        // Step 2: If we still don't have IMDb ID, fetch it from TMDB
        if (!imdbId && tmdbId) {
          try {
            if (options.mediaType === 'tv') {
              imdbId = await getImdbIdFromTMDBSeries(tmdbId);
            } else {
              imdbId = await getImdbIdFromTMDB(tmdbId);
            }
            console.log(`Got IMDb ID for TMDB ${tmdbId}: ${imdbId}`);
          } catch (tmdbErr) {
            console.error('TMDB error:', tmdbErr);
            setError('Failed to get IMDb ID');
          }
        }

        // Step 3: Now fetch the rating from OMDb
        if (imdbId && isMountedRef.current) {
          console.log(`Fetching OMDb rating for ${imdbId}`);
          const fetchedRating = await getIMDbRating(imdbId);
          
          if (isMountedRef.current) {
            setRating(fetchedRating);
            console.log(`Got rating: ${fetchedRating?.imdbRating}`);

            // Step 4: Save to cache
            if (tmdbId && fetchedRating) {
              try {
                await saveIMDbRating(
                  tmdbId,
                  imdbId,
                  fetchedRating,
                  options.mediaType || 'movie'
                );
                console.log(`Saved to cache for TMDB ${tmdbId}`);
              } catch (saveErr) {
                console.warn('Save error:', saveErr);
              }
            }
          }
        } else if (!imdbId && isMountedRef.current) {
          console.warn('Could not get IMDb ID');
          setError('IMDb ID not found');
        }
      } catch (err) {
        if (isMountedRef.current) {
          setError(err instanceof Error ? err.message : 'Failed to fetch rating');
          console.error('Error fetching IMDb rating:', err);
        }
      } finally {
        if (isMountedRef.current) {
          setLoading(false);
          fetchedRef.current = true;
        }
      }
    };

    fetchRating();
  }, [options.tmdbId, options.imdbId, options.mediaType]);

  return { rating, loading, error };
};

export default useIMDbRating;
