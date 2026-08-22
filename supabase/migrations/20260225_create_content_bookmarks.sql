-- Create content_bookmarks table
CREATE TABLE IF NOT EXISTS content_bookmarks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  content_type TEXT NOT NULL CHECK (content_type IN ('anime', 'movie', 'series', 'game')),
  content_id TEXT NOT NULL,
  title TEXT NOT NULL,
  poster_url TEXT,
  status TEXT NOT NULL CHECK (status IN ('favorite', 'watching', 'planned', 'watched', 'postponed', 'dropped')),
  user_rating NUMERIC DEFAULT 0,
  external_rating NUMERIC,
  progress INTEGER DEFAULT 0,
  total_items INTEGER DEFAULT 0,
  is_favorite BOOLEAN DEFAULT false,
  notes TEXT,
  synopsis TEXT,
  genre TEXT,
  release_year TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_content_bookmarks_user_id ON content_bookmarks(user_id);
CREATE INDEX IF NOT EXISTS idx_content_bookmarks_status ON content_bookmarks(user_id, status);
CREATE INDEX IF NOT EXISTS idx_content_bookmarks_content ON content_bookmarks(user_id, content_id, content_type);

-- Enable RLS
ALTER TABLE content_bookmarks ENABLE ROW LEVEL SECURITY;

-- RLS Policies: users can only access their own bookmarks
CREATE POLICY "Users can view own bookmarks"
  ON content_bookmarks FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own bookmarks"
  ON content_bookmarks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own bookmarks"
  ON content_bookmarks FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own bookmarks"
  ON content_bookmarks FOR DELETE
  USING (auth.uid() = user_id);
