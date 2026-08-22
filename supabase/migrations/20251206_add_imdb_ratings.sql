-- Add IMDb rating storage
-- Create movies_imdb_ratings table to cache IMDb data
CREATE TABLE IF NOT EXISTS public.movies_imdb_ratings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tmdb_id INTEGER NOT NULL UNIQUE,
    imdb_id TEXT,
    imdb_rating NUMERIC(3, 1),
    imdb_votes INTEGER,
    media_type TEXT NOT NULL, -- 'movie' or 'tv'
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create index for fast lookups
CREATE INDEX IF NOT EXISTS idx_movies_imdb_ratings_tmdb_id ON public.movies_imdb_ratings(tmdb_id);
CREATE INDEX IF NOT EXISTS idx_movies_imdb_ratings_imdb_id ON public.movies_imdb_ratings(imdb_id);
CREATE INDEX IF NOT EXISTS idx_movies_imdb_ratings_media_type ON public.movies_imdb_ratings(media_type);

-- Grant permissions
GRANT SELECT ON public.movies_imdb_ratings TO anon, authenticated;
GRANT INSERT, UPDATE ON public.movies_imdb_ratings TO authenticated;
