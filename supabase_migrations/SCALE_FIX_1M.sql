-- ============================================================
-- reverseX: фикс схемы под нагрузку (1M пользователей)
-- Запустить в Supabase → SQL Editor.
-- Безопасно выполнять повторно (IF NOT EXISTS / IF EXISTS).
-- Порядок: дедупликация → constraints → каскады → индексы → RLS → ретеншн.
-- ============================================================

-- ═══════════ 0. ВКЛЮЧИТЬ RLS НА ВСЁ (страховка) ═══════════
ALTER TABLE public.content_bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.top_lists        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.top_list_items   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profile_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_visits     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.follows          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.friendships      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.movies_imdb_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.qr_login_sessions ENABLE ROW LEVEL SECURITY;

-- ═══════════ 1. УДАЛИТЬ ДУБЛИ (перед добавлением UNIQUE) ═══════════
DELETE FROM public.content_bookmarks a USING public.content_bookmarks b
  WHERE a.id > b.id AND a.user_id = b.user_id AND a.content_id = b.content_id AND a.content_type = b.content_type;

DELETE FROM public.community_ratings a USING public.community_ratings b
  WHERE a.id > b.id AND a.user_id = b.user_id AND a.content_type = b.content_type AND a.content_id = b.content_id;

DELETE FROM public.follows a USING public.follows b
  WHERE a.id > b.id AND a.follower_id = b.follower_id AND a.following_id = b.following_id;

DELETE FROM public.friendships a USING public.friendships b
  WHERE a.id > b.id AND a.requester_id = b.requester_id AND a.addressee_id = b.addressee_id;

DELETE FROM public.top_lists a USING public.top_lists b
  WHERE a.id > b.id AND a.user_id = b.user_id AND a.media_type = b.media_type;

DELETE FROM public.daily_visits a USING public.daily_visits b
  WHERE a.id > b.id AND a.visit_date = b.visit_date AND a.session_id = b.session_id;

-- ═══════════ 2. UNIQUE CONSTRAINTS (главная защита от багов) ═══════════
ALTER TABLE public.content_bookmarks
  DROP CONSTRAINT IF EXISTS content_bookmarks_unique;
ALTER TABLE public.content_bookmarks
  ADD CONSTRAINT content_bookmarks_unique UNIQUE (user_id, content_id, content_type);

ALTER TABLE public.community_ratings
  DROP CONSTRAINT IF EXISTS community_ratings_unique;
ALTER TABLE public.community_ratings
  ADD CONSTRAINT community_ratings_unique UNIQUE (user_id, content_type, content_id);

ALTER TABLE public.follows
  DROP CONSTRAINT IF EXISTS follows_unique;
ALTER TABLE public.follows
  ADD CONSTRAINT follows_unique UNIQUE (follower_id, following_id);

-- друзья: запретить повторные заявки (rejected можно создать заново —
-- для этого уникальность по паре, статус меняется update'ом)
ALTER TABLE public.friendships
  DROP CONSTRAINT IF EXISTS friendships_unique;
ALTER TABLE public.friendships
  ADD CONSTRAINT friendships_unique UNIQUE (requester_id, addressee_id);

ALTER TABLE public.top_lists
  DROP CONSTRAINT IF EXISTS top_lists_unique;
ALTER TABLE public.top_lists
  ADD CONSTRAINT top_lists_unique UNIQUE (user_id, media_type);

ALTER TABLE public.daily_visits
  DROP CONSTRAINT IF EXISTS daily_visits_unique;
ALTER TABLE public.daily_visits
  ADD CONSTRAINT daily_visits_unique UNIQUE (visit_date, session_id);

-- ═══════════ 3. ON DELETE CASCADE (пересоздание FK) ═══════════
ALTER TABLE public.content_bookmarks DROP CONSTRAINT IF EXISTS content_bookmarks_user_id_fkey;
ALTER TABLE public.content_bookmarks ADD CONSTRAINT content_bookmarks_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.top_lists DROP CONSTRAINT IF EXISTS top_lists_user_id_fkey;
ALTER TABLE public.top_lists ADD CONSTRAINT top_lists_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.top_list_items DROP CONSTRAINT IF EXISTS top_list_items_top_list_id_fkey;
ALTER TABLE public.top_list_items ADD CONSTRAINT top_list_items_top_list_id_fkey
  FOREIGN KEY (top_list_id) REFERENCES public.top_lists(id) ON DELETE CASCADE;

ALTER TABLE public.comments DROP CONSTRAINT IF EXISTS comments_user_id_fkey;
ALTER TABLE public.comments ADD CONSTRAINT comments_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.community_ratings DROP CONSTRAINT IF EXISTS community_ratings_user_id_fkey;
ALTER TABLE public.community_ratings ADD CONSTRAINT community_ratings_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.follows DROP CONSTRAINT IF EXISTS follows_follower_id_fkey;
ALTER TABLE public.follows ADD CONSTRAINT follows_follower_id_fkey
  FOREIGN KEY (follower_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.follows DROP CONSTRAINT IF EXISTS follows_following_id_fkey;
ALTER TABLE public.follows ADD CONSTRAINT follows_following_id_fkey
  FOREIGN KEY (following_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.friendships DROP CONSTRAINT IF EXISTS friendships_requester_id_fkey;
ALTER TABLE public.friendships ADD CONSTRAINT friendships_requester_id_fkey
  FOREIGN KEY (requester_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.friendships DROP CONSTRAINT IF EXISTS friendships_addressee_id_fkey;
ALTER TABLE public.friendships ADD CONSTRAINT friendships_addressee_id_fkey
  FOREIGN KEY (addressee_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.messages DROP CONSTRAINT IF EXISTS messages_sender_id_fkey;
ALTER TABLE public.messages ADD CONSTRAINT messages_sender_id_fkey
  FOREIGN KEY (sender_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.messages DROP CONSTRAINT IF EXISTS messages_receiver_id_fkey;
ALTER TABLE public.messages ADD CONSTRAINT messages_receiver_id_fkey
  FOREIGN KEY (receiver_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.notifications DROP CONSTRAINT IF EXISTS notifications_user_id_fkey;
ALTER TABLE public.notifications ADD CONSTRAINT notifications_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.notifications DROP CONSTRAINT IF EXISTS notifications_actor_id_fkey;
ALTER TABLE public.notifications ADD CONSTRAINT notifications_actor_id_fkey
  FOREIGN KEY (actor_id) REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE public.daily_visits DROP CONSTRAINT IF EXISTS daily_visits_user_id_fkey;
ALTER TABLE public.daily_visits ADD CONSTRAINT daily_visits_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE public.profile_comments DROP CONSTRAINT IF EXISTS profile_comments_author_id_fkey;
ALTER TABLE public.profile_comments ADD CONSTRAINT profile_comments_author_id_fkey
  FOREIGN KEY (author_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.profile_comments DROP CONSTRAINT IF EXISTS profile_comments_profile_id_fkey;
ALTER TABLE public.profile_comments ADD CONSTRAINT profile_comments_profile_id_fkey
  FOREIGN KEY (profile_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- ═══════════ 4. ИНДЕКСЫ (под реальные запросы сайта) ═══════════
-- Закладки: список юзера по статусу + публичные запросы по контенту
CREATE INDEX IF NOT EXISTS idx_cb_user_status ON public.content_bookmarks(user_id, status, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_cb_content     ON public.content_bookmarks(content_type, content_id);

-- Комментарии к контенту и профилям
CREATE INDEX IF NOT EXISTS idx_comments_movie ON public.comments(movie_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_comments_user  ON public.comments(user_id);
CREATE INDEX IF NOT EXISTS idx_pc_profile     ON public.profile_comments(profile_id, created_at DESC);

-- Топ-50
CREATE INDEX IF NOT EXISTS idx_tl_user  ON public.top_lists(user_id);
CREATE INDEX IF NOT EXISTS idx_tli_list ON public.top_list_items(top_list_id, rank);

-- Чат: диалог + инбокс (непрочитанные)
CREATE INDEX IF NOT EXISTS idx_msg_pair  ON public.messages(sender_id, receiver_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_msg_inbox ON public.messages(receiver_id, is_read, created_at DESC);

-- Уведомления: непрочитанные сверху
CREATE INDEX IF NOT EXISTS idx_notif_user ON public.notifications(user_id, is_read, created_at DESC);

-- Соцграф
CREATE INDEX IF NOT EXISTS idx_fr_req  ON public.friendships(requester_id);
CREATE INDEX IF NOT EXISTS idx_fr_addr ON public.friendships(addressee_id);
CREATE INDEX IF NOT EXISTS idx_fl_follower  ON public.follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_fl_following ON public.follows(following_id);

-- Оценки сообщества по контенту (агрегаты)
CREATE INDEX IF NOT EXISTS idx_cr_content ON public.community_ratings(content_type, content_id);

-- QR-вход: поиск по хешу токена и коду
CREATE INDEX IF NOT EXISTS idx_qr_hash ON public.qr_login_sessions(login_token_hash);
CREATE INDEX IF NOT EXISTS idx_qr_pair ON public.qr_login_sessions(pair_code);

-- Аналитика по датам
CREATE INDEX IF NOT EXISTS idx_dv_date ON public.daily_visits(visit_date);

-- Быстрый поиск профиля по slug (/id/:slug)
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_slug
  ON public.profiles(custom_slug) WHERE custom_slug IS NOT NULL;

-- ═══════════ 5. ФИКС PK: TMDB movie/tv id ПЕРЕСЕКАЮТСЯ ═══════════
-- Один tmdb_id может быть и фильмом, и сериалом → сейчас кэш затирает сам себя.
ALTER TABLE public.movies_imdb_ratings DROP CONSTRAINT IF EXISTS movies_imdb_ratings_pkey;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'movies_imdb_ratings_pkey'
      AND pg_get_constraintdef(oid) LIKE '%media_type%'
  ) THEN
    ALTER TABLE public.movies_imdb_ratings
      ADD CONSTRAINT movies_imdb_ratings_pkey PRIMARY KEY (tmdb_id, media_type);
  END IF;
END $$;

-- ═══════════ 6. АВТООБНОВЛЕНИЕ updated_at ═══════════
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_cb_updated_at ON public.content_bookmarks;
CREATE TRIGGER trg_cb_updated_at BEFORE UPDATE ON public.content_bookmarks
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trg_profiles_updated_at ON public.profiles;
CREATE TRIGGER trg_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ═══════════ 7. ПРАВИЛО ДЛЯ RLS-ПОЛИТИК (скорость!) ═══════════
-- Плохо (выполняется на КАЖДУЮ строку):
--   USING (auth.uid() = user_id)
-- Хорошо (вычисляется 1 раз на запрос):
--   USING (user_id = (select auth.uid()))
-- Пример, повторить тот же паттерн во всех политиках:
DROP POLICY IF EXISTS "bookmarks_select" ON public.content_bookmarks;
CREATE POLICY "bookmarks_select" ON public.content_bookmarks
  FOR SELECT USING (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "bookmarks_insert" ON public.content_bookmarks;
CREATE POLICY "bookmarks_insert" ON public.content_bookmarks
  FOR INSERT WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "bookmarks_update" ON public.content_bookmarks;
CREATE POLICY "bookmarks_update" ON public.content_bookmarks
  FOR UPDATE USING (user_id = (select auth.uid())) WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "bookmarks_delete" ON public.content_bookmarks;
CREATE POLICY "bookmarks_delete" ON public.content_bookmarks
  FOR DELETE USING (user_id = (select auth.uid()));

-- ═══════════ 8. РЕТЕНШН АНАЛИТИКИ (таблица растёт на миллионы строк/день) ═══════════
DELETE FROM public.daily_visits WHERE visit_date < now() - interval '180 days';
DELETE FROM public.qr_login_sessions WHERE expires_at < now() - interval '1 day';
-- Повторять по расписанию (pg_cron если включён, иначе вручную/Edge Function):
--   DELETE FROM daily_visits WHERE visit_date < now() - interval '180 days';

-- ═══════════ 9. ОПЦИОНАЛЬНО: типы колонок (проверить перед запуском) ═══════════
-- release_year должен быть числом, иначе сортировка ломается:
-- ALTER TABLE public.content_bookmarks
--   ALTER COLUMN release_year TYPE integer
--   USING NULLIF(regexp_replace(release_year, '\D', '', 'g'), '')::integer;

-- Если выбираешь friendships и НЕ используешь follows (меньше кода = меньше багов):
-- DROP TABLE IF EXISTS public.follows CASCADE;

-- Если is_favorite дублирует status='favorite' (код должен писать status):
-- ALTER TABLE public.content_bookmarks DROP COLUMN IF EXISTS is_favorite;

-- Если external_rating дублирует кэш movies_imdb_ratings:
-- ALTER TABLE public.content_bookmarks DROP COLUMN IF EXISTS external_rating;
