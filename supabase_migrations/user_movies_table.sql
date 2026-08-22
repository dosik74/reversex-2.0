-- Create user_movies table for tracking watched movies, ratings, and status
CREATE TABLE IF NOT EXISTS public.user_movies (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  movie_id INTEGER NOT NULL,
  rating INTEGER DEFAULT 0 CHECK (rating >= 0 AND rating <= 10),
  status TEXT CHECK (status IN ('watched', 'planned', 'abandoned')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, movie_id)
);

-- Create index for faster queries
CREATE INDEX idx_user_movies_user_id ON public.user_movies(user_id);
CREATE INDEX idx_user_movies_movie_id ON public.user_movies(movie_id);

-- Enable RLS
ALTER TABLE public.user_movies ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own movie records"
  ON public.user_movies FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own movie records"
  ON public.user_movies FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own movie records"
  ON public.user_movies FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own movie records"
  ON public.user_movies FOR DELETE
  USING (auth.uid() = user_id);
