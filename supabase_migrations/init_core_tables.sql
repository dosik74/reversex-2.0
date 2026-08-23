-- ============================================================
-- reverseX: базовые таблицы для нового проекта
-- Запустить в Supabase → SQL Editor (новый проект dxbbresrxkyeprrxlwye)
-- После этого также выполнить bookmarks_and_top50.sql
-- ============================================================

-- ═══════════ ПРОФИЛИ ═══════════
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE,
  display_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_select" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update" ON public.profiles;
DROP POLICY IF EXISTS "profiles_delete" ON public.profiles;

CREATE POLICY "profiles_select" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "profiles_insert" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update" ON public.profiles FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_delete" ON public.profiles FOR DELETE USING (auth.uid() = id);

-- Бэкфилл: создать профили для уже существующих пользователей
INSERT INTO public.profiles (id, username, display_name)
SELECT u.id,
       COALESCE(u.raw_user_meta_data->>'username', split_part(u.email, '@', 1)),
       COALESCE(u.raw_user_meta_data->>'display_name', split_part(u.email, '@', 1))
FROM auth.users u
ON CONFLICT (id) DO NOTHING;

-- Автосоздание профиля при регистрации
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, display_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1))
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_on_auth_user_created ON auth.users;
CREATE TRIGGER trg_on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ═══════════ КОММЕНТАРИИ (к контенту) ═══════════
CREATE TABLE IF NOT EXISTS public.comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  movie_id TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_comments_movie ON public.comments(movie_id);

ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "comments_select" ON public.comments;
DROP POLICY IF EXISTS "comments_insert" ON public.comments;
DROP POLICY IF EXISTS "comments_delete" ON public.comments;

CREATE POLICY "comments_select" ON public.comments FOR SELECT TO authenticated USING (true);
CREATE POLICY "comments_insert" ON public.comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "comments_delete" ON public.comments FOR DELETE USING (auth.uid() = user_id);

-- ═══════════ КОММЕНТАРИИ НА ПРОФИЛЯХ ═══════════
CREATE TABLE IF NOT EXISTS public.profile_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.profile_comments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profile_comments_select" ON public.profile_comments;
DROP POLICY IF EXISTS "profile_comments_insert" ON public.profile_comments;
DROP POLICY IF EXISTS "profile_comments_delete" ON public.profile_comments;

CREATE POLICY "profile_comments_select" ON public.profile_comments FOR SELECT TO authenticated USING (true);
CREATE POLICY "profile_comments_insert" ON public.profile_comments FOR INSERT WITH CHECK (auth.uid() = author_id);
CREATE POLICY "profile_comments_delete" ON public.profile_comments FOR DELETE USING (auth.uid() = author_id);

-- ═══════════ АНАЛИТИКА ПОСЕЩЕНИЙ ═══════════
CREATE TABLE IF NOT EXISTS public.daily_visits (
  id BIGSERIAL PRIMARY KEY,
  visit_date DATE NOT NULL,
  session_id TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  page_views INTEGER DEFAULT 1,
  last_seen TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(visit_date, session_id)
);

CREATE INDEX IF NOT EXISTS idx_daily_visits_date ON public.daily_visits(visit_date);

ALTER TABLE public.daily_visits ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "daily_visits_select" ON public.daily_visits;
DROP POLICY IF EXISTS "daily_visits_write" ON public.daily_visits;
DROP POLICY IF EXISTS "daily_visits_update" ON public.daily_visits;

CREATE POLICY "daily_visits_select" ON public.daily_visits FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "daily_visits_write" ON public.daily_visits FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "daily_visits_update" ON public.daily_visits FOR UPDATE TO anon, authenticated USING (true);

-- ═══════════ ПОДПИСКИ ═══════════
CREATE TABLE IF NOT EXISTS public.follows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(follower_id, following_id)
);

ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "follows_select" ON public.follows;
DROP POLICY IF EXISTS "follows_insert" ON public.follows;
DROP POLICY IF EXISTS "follows_delete" ON public.follows;

CREATE POLICY "follows_select" ON public.follows FOR SELECT TO authenticated USING (true);
CREATE POLICY "follows_insert" ON public.follows FOR INSERT WITH CHECK (auth.uid() = follower_id);
CREATE POLICY "follows_delete" ON public.follows FOR DELETE USING (auth.uid() = follower_id);

-- ═══════════ ДРУЗЬЯ ═══════════
CREATE TABLE IF NOT EXISTS public.friendships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  addressee_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(requester_id, addressee_id)
);

ALTER TABLE public.friendships ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "friendships_select" ON public.friendships;
DROP POLICY IF EXISTS "friendships_insert" ON public.friendships;
DROP POLICY IF EXISTS "friendships_update" ON public.friendships;
DROP POLICY IF EXISTS "friendships_delete" ON public.friendships;

CREATE POLICY "friendships_select" ON public.friendships FOR SELECT TO authenticated
  USING (auth.uid() IN (requester_id, addressee_id));
CREATE POLICY "friendships_insert" ON public.friendships FOR INSERT WITH CHECK (auth.uid() = requester_id);
CREATE POLICY "friendships_update" ON public.friendships FOR UPDATE
  USING (auth.uid() IN (requester_id, addressee_id));
CREATE POLICY "friendships_delete" ON public.friendships FOR DELETE
  USING (auth.uid() IN (requester_id, addressee_id));

-- ═══════════ ЛИЧНЫЕ СООБЩЕНИЯ ═══════════
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_messages_sender ON public.messages(sender_id, receiver_id);

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "messages_select" ON public.messages;
DROP POLICY IF EXISTS "messages_insert" ON public.messages;
DROP POLICY IF EXISTS "messages_update" ON public.messages;
DROP POLICY IF EXISTS "messages_delete" ON public.messages;

CREATE POLICY "messages_select" ON public.messages FOR SELECT TO authenticated
  USING (auth.uid() IN (sender_id, receiver_id));
CREATE POLICY "messages_insert" ON public.messages FOR INSERT WITH CHECK (auth.uid() = sender_id);
CREATE POLICY "messages_update" ON public.messages FOR UPDATE
  USING (auth.uid() IN (sender_id, receiver_id));
CREATE POLICY "messages_delete" ON public.messages FOR DELETE
  USING (auth.uid() IN (sender_id, receiver_id));

-- ═══════════ УВЕДОМЛЕНИЯ ═══════════
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  actor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  type TEXT NOT NULL,
  data JSONB DEFAULT '{}',
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications(user_id);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "notifications_select" ON public.notifications;
DROP POLICY IF EXISTS "notifications_insert" ON public.notifications;
DROP POLICY IF EXISTS "notifications_update" ON public.notifications;
DROP POLICY IF EXISTS "notifications_delete" ON public.notifications;

CREATE POLICY "notifications_select" ON public.notifications FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "notifications_insert" ON public.notifications FOR INSERT WITH CHECK (true);
CREATE POLICY "notifications_update" ON public.notifications FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "notifications_delete" ON public.notifications FOR DELETE USING (auth.uid() = user_id);

-- ═══════════ ОЦЕНКИ СООБЩЕСТВА ═══════════
CREATE TABLE IF NOT EXISTS public.community_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content_type TEXT NOT NULL CHECK (content_type IN ('movie', 'series', 'game')),
  content_id TEXT NOT NULL,
  rating NUMERIC(3,1) NOT NULL CHECK (rating >= 0 AND rating <= 10),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, content_type, content_id)
);

ALTER TABLE public.community_ratings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "community_ratings_select" ON public.community_ratings;
DROP POLICY IF EXISTS "community_ratings_write" ON public.community_ratings;
DROP POLICY IF EXISTS "community_ratings_update" ON public.community_ratings;
DROP POLICY IF EXISTS "community_ratings_delete" ON public.community_ratings;

CREATE POLICY "community_ratings_select" ON public.community_ratings FOR SELECT TO authenticated USING (true);
CREATE POLICY "community_ratings_write" ON public.community_ratings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "community_ratings_update" ON public.community_ratings FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "community_ratings_delete" ON public.community_ratings FOR DELETE USING (auth.uid() = user_id);

-- ═══════════ КЭШ IMDb РЕЙТИНГОВ ═══════════
CREATE TABLE IF NOT EXISTS public.movies_imdb_ratings (
  tmdb_id INTEGER PRIMARY KEY,
  media_type TEXT NOT NULL DEFAULT 'movie',
  imdb_id TEXT,
  imdb_rating NUMERIC(3,1),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.movies_imdb_ratings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "imdb_select" ON public.movies_imdb_ratings;
DROP POLICY IF EXISTS "imdb_write" ON public.movies_imdb_ratings;
DROP POLICY IF EXISTS "imdb_update" ON public.movies_imdb_ratings;

CREATE POLICY "imdb_select" ON public.movies_imdb_ratings FOR SELECT TO authenticated USING (true);
CREATE POLICY "imdb_write" ON public.movies_imdb_ratings FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "imdb_update" ON public.movies_imdb_ratings FOR UPDATE TO authenticated USING (true);
