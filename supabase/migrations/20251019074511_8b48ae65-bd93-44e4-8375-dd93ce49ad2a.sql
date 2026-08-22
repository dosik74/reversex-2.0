-- Add storage bucket for avatars
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('avatars', 'avatars', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
ON CONFLICT (id) DO NOTHING;

-- Add storage bucket for profile backgrounds
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('backgrounds', 'backgrounds', true, 10485760, ARRAY['image/gif', 'image/webp', 'image/jpeg', 'image/png'])
ON CONFLICT (id) DO NOTHING;

-- Storage policies for avatars
CREATE POLICY "Anyone can view avatars"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload their own avatar"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update their own avatar"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own avatar"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Storage policies for backgrounds
CREATE POLICY "Anyone can view backgrounds"
ON storage.objects FOR SELECT
USING (bucket_id = 'backgrounds');

CREATE POLICY "Users can upload their own background"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'backgrounds' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update their own background"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'backgrounds' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own background"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'backgrounds' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Add realtime only to tables that aren't already added
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND tablename = 'friendships'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE friendships;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND tablename = 'follows'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE follows;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND tablename = 'notifications'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
  END IF;
END $$;

-- Create function to calculate user level based on XP
CREATE OR REPLACE FUNCTION public.calculate_level(xp_amount integer)
RETURNS integer
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT FLOOR(SQRT(xp_amount / 100.0))::integer + 1;
$$;

-- Create function to award XP and update level
CREATE OR REPLACE FUNCTION public.award_xp(user_id uuid, xp_amount integer)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_xp integer;
  new_level integer;
BEGIN
  UPDATE profiles
  SET xp = xp + xp_amount
  WHERE id = user_id
  RETURNING xp INTO new_xp;
  
  new_level := calculate_level(new_xp);
  
  UPDATE profiles
  SET level = new_level
  WHERE id = user_id;
END;
$$;

-- Trigger to award XP on rating a movie
CREATE OR REPLACE FUNCTION public.award_xp_on_rating()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM award_xp(NEW.user_id, 10);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_movie_rated ON user_movies;
CREATE TRIGGER on_movie_rated
AFTER INSERT ON user_movies
FOR EACH ROW
EXECUTE FUNCTION award_xp_on_rating();

-- Trigger to award XP on adding favorite
CREATE OR REPLACE FUNCTION public.award_xp_on_favorite()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM award_xp(NEW.user_id, 5);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_favorite_added ON favorite_movies;
CREATE TRIGGER on_favorite_added
AFTER INSERT ON favorite_movies
FOR EACH ROW
EXECUTE FUNCTION award_xp_on_favorite();

-- Trigger to award XP on commenting
CREATE OR REPLACE FUNCTION public.award_xp_on_comment()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM award_xp(NEW.user_id, 3);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_comment_added ON comments;
CREATE TRIGGER on_comment_added
AFTER INSERT ON comments
FOR EACH ROW
EXECUTE FUNCTION award_xp_on_comment();