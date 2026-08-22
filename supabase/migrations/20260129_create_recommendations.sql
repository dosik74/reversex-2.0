-- Create recommendations table
CREATE TABLE IF NOT EXISTS recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- Create recommendation_media table for images/drawings
CREATE TABLE IF NOT EXISTS recommendation_media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recommendation_id UUID NOT NULL REFERENCES recommendations(id) ON DELETE CASCADE,
  media_type TEXT NOT NULL, -- 'image', 'drawing'
  media_url TEXT NOT NULL,
  storage_path TEXT,
  created_at TIMESTAMP DEFAULT now()
);

-- Create recommendation_replies table for comments/replies
CREATE TABLE IF NOT EXISTS recommendation_replies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recommendation_id UUID NOT NULL REFERENCES recommendations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- Create recommendation_likes table
CREATE TABLE IF NOT EXISTS recommendation_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recommendation_id UUID NOT NULL REFERENCES recommendations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT now(),
  UNIQUE(recommendation_id, user_id)
);

-- Enable RLS
ALTER TABLE recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE recommendation_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE recommendation_replies ENABLE ROW LEVEL SECURITY;
ALTER TABLE recommendation_likes ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for recommendations
CREATE POLICY "Users can view all recommendations" ON recommendations
  FOR SELECT USING (true);

CREATE POLICY "Users can create their own recommendations" ON recommendations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own recommendations" ON recommendations
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own recommendations" ON recommendations
  FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for recommendation_media
CREATE POLICY "Users can view all media" ON recommendation_media
  FOR SELECT USING (true);

CREATE POLICY "Users can upload media to their recommendations" ON recommendation_media
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM recommendations 
      WHERE id = recommendation_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their media" ON recommendation_media
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM recommendations 
      WHERE id = recommendation_id AND user_id = auth.uid()
    )
  );

-- Create RLS policies for recommendation_replies
CREATE POLICY "Users can view all replies" ON recommendation_replies
  FOR SELECT USING (true);

CREATE POLICY "Users can create replies" ON recommendation_replies
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their replies" ON recommendation_replies
  FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for recommendation_likes
CREATE POLICY "Users can view all likes" ON recommendation_likes
  FOR SELECT USING (true);

CREATE POLICY "Users can like recommendations" ON recommendation_likes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unlike recommendations" ON recommendation_likes
  FOR DELETE USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX idx_recommendations_user_id ON recommendations(user_id);
CREATE INDEX idx_recommendations_created_at ON recommendations(created_at DESC);
CREATE INDEX idx_recommendation_media_recommendation_id ON recommendation_media(recommendation_id);
CREATE INDEX idx_recommendation_replies_recommendation_id ON recommendation_replies(recommendation_id);
CREATE INDEX idx_recommendation_likes_recommendation_id ON recommendation_likes(recommendation_id);
CREATE INDEX idx_recommendation_likes_user_id ON recommendation_likes(user_id);
-- Storage bucket RLS policies (for recommendations bucket)
-- Note: Storage bucket must be created in Supabase Dashboard as PUBLIC
-- To enable storage RLS, uncomment the policies below after bucket is created

-- CREATE POLICY "Public access for images" ON storage.objects
--   FOR SELECT USING (bucket_id = 'recommendations');

-- CREATE POLICY "Users can upload to recommendations" ON storage.objects
--   FOR INSERT WITH CHECK (
--     bucket_id = 'recommendations' AND 
--     auth.uid() IS NOT NULL
--   );

-- CREATE POLICY "Users can delete their files" ON storage.objects
--   FOR DELETE USING (
--     bucket_id = 'recommendations' AND
--     auth.uid()::text = (storage.foldername(name))[1]
--   );