-- Create tier_lists table
CREATE TABLE IF NOT EXISTS tier_lists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  is_public BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create tier_list_items table (for storing movies, series, and games)
CREATE TABLE IF NOT EXISTS tier_list_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tier_list_id UUID NOT NULL REFERENCES tier_lists(id) ON DELETE CASCADE,
  content_id VARCHAR(255) NOT NULL,
  content_type VARCHAR(50) NOT NULL, -- 'movie', 'series', 'game'
  title VARCHAR(255) NOT NULL,
  poster_url TEXT,
  rating FLOAT,
  tier VARCHAR(10) NOT NULL, -- 'SS', 'S', 'A', 'B', 'C'
  position INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX idx_tier_lists_user_id ON tier_lists(user_id);
CREATE INDEX idx_tier_lists_is_public ON tier_lists(is_public);
CREATE INDEX idx_tier_list_items_tier_list_id ON tier_list_items(tier_list_id);
CREATE INDEX idx_tier_list_items_tier ON tier_list_items(tier);

-- Enable RLS
ALTER TABLE tier_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE tier_list_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies for tier_lists
CREATE POLICY "Users can view their own tier lists" ON tier_lists
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view public tier lists" ON tier_lists
  FOR SELECT USING (is_public = TRUE OR auth.uid() = user_id);

CREATE POLICY "Users can create tier lists" ON tier_lists
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tier lists" ON tier_lists
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own tier lists" ON tier_lists
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for tier_list_items
CREATE POLICY "Users can view items in their tier lists" ON tier_list_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM tier_lists 
      WHERE id = tier_list_id AND (user_id = auth.uid() OR is_public = TRUE)
    )
  );

CREATE POLICY "Users can create items in their tier lists" ON tier_list_items
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM tier_lists 
      WHERE id = tier_list_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update items in their tier lists" ON tier_list_items
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM tier_lists 
      WHERE id = tier_list_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete items in their tier lists" ON tier_list_items
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM tier_lists 
      WHERE id = tier_list_id AND user_id = auth.uid()
    )
  );
