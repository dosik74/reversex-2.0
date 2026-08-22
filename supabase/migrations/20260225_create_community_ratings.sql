-- Create community_ratings table for public voting (1-10 integer)
CREATE TABLE IF NOT EXISTS community_ratings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  content_type TEXT NOT NULL CHECK (content_type IN ('anime', 'movie', 'series', 'game')),
  content_id TEXT NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 10),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, content_id, content_type)
);

-- Indexes for fast aggregation
CREATE INDEX IF NOT EXISTS idx_community_ratings_content ON community_ratings(content_id, content_type);
CREATE INDEX IF NOT EXISTS idx_community_ratings_user ON community_ratings(user_id);

-- Enable RLS
ALTER TABLE community_ratings ENABLE ROW LEVEL SECURITY;

-- Everyone can read ratings (public data)
CREATE POLICY "Anyone can view ratings"
  ON community_ratings FOR SELECT
  USING (true);

-- Users can insert their own rating
CREATE POLICY "Users can insert own rating"
  ON community_ratings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own rating
CREATE POLICY "Users can update own rating"
  ON community_ratings FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own rating
CREATE POLICY "Users can delete own rating"
  ON community_ratings FOR DELETE
  USING (auth.uid() = user_id);
