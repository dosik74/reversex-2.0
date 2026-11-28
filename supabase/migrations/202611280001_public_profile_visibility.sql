-- Public read access for user profile activity:
-- bookmarks, ratings, comments, profile_comments, top_lists

-- 1. content_bookmarks: anyone can view bookmarks & user_rating, only owner can modify
ALTER TABLE IF EXISTS public.content_bookmarks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own bookmarks" ON public.content_bookmarks;
DROP POLICY IF EXISTS "bookmarks_select" ON public.content_bookmarks;
DROP POLICY IF EXISTS "bookmarks_public_select" ON public.content_bookmarks;
CREATE POLICY "bookmarks_public_select"
  ON public.content_bookmarks FOR SELECT
  USING (true);

-- 2. community_ratings: anyone can view
ALTER TABLE IF EXISTS public.community_ratings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can view ratings" ON public.community_ratings;
CREATE POLICY "Anyone can view ratings"
  ON public.community_ratings FOR SELECT
  USING (true);

-- 3. comments: anyone can view (guests + authenticated)
ALTER TABLE IF EXISTS public.comments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "comments_select" ON public.comments;
DROP POLICY IF EXISTS "Comments are viewable by everyone" ON public.comments;
CREATE POLICY "Comments are viewable by everyone"
  ON public.comments FOR SELECT
  USING (true);

-- 4. profile_comments: anyone can view
ALTER TABLE IF EXISTS public.profile_comments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "profile_comments_select" ON public.profile_comments;
DROP POLICY IF EXISTS "profile_comments_public_select" ON public.profile_comments;
CREATE POLICY "profile_comments_public_select"
  ON public.profile_comments FOR SELECT
  USING (true);

-- 5. top_lists & top_list_items: anyone can view
ALTER TABLE IF EXISTS public.top_lists ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "top_lists_select" ON public.top_lists;
CREATE POLICY "top_lists_select"
  ON public.top_lists FOR SELECT
  USING (true);

ALTER TABLE IF EXISTS public.top_list_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "top_list_items_select" ON public.top_list_items;
CREATE POLICY "top_list_items_select"
  ON public.top_list_items FOR SELECT
  USING (true);

-- 6. Legacy rating tables (if present): allow public SELECT
DO $$
BEGIN
  IF to_regclass('public.user_movies') IS NOT NULL THEN
    ALTER TABLE public.user_movies ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "user_movies_public_select" ON public.user_movies;
    CREATE POLICY "user_movies_public_select" ON public.user_movies FOR SELECT USING (true);
  END IF;
  IF to_regclass('public.user_series') IS NOT NULL THEN
    ALTER TABLE public.user_series ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "user_series_public_select" ON public.user_series;
    CREATE POLICY "user_series_public_select" ON public.user_series FOR SELECT USING (true);
  END IF;
  IF to_regclass('public.user_games') IS NOT NULL THEN
    ALTER TABLE public.user_games ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "user_games_public_select" ON public.user_games;
    CREATE POLICY "user_games_public_select" ON public.user_games FOR SELECT USING (true);
  END IF;
END $$;
