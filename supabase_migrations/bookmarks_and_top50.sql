-- ============================================================
-- reverseX: Закладки (content_bookmarks) + Топ-50 (top_lists)
-- Запустить в Supabase → SQL Editor
-- ============================================================

-- ═══════════ 1. ЗАКЛАДКИ ═══════════
CREATE TABLE IF NOT EXISTS public.content_bookmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content_type TEXT NOT NULL CHECK (content_type IN ('movie', 'series', 'game')),
  content_id TEXT NOT NULL,
  title TEXT NOT NULL,
  poster_url TEXT,
  status TEXT NOT NULL DEFAULT 'planned' CHECK (status IN ('favorite', 'watching', 'planned', 'watched', 'postponed', 'dropped')),
  user_rating NUMERIC(3,1) DEFAULT 0 CHECK (user_rating >= 0 AND user_rating <= 10),
  external_rating NUMERIC(3,1),
  progress INTEGER DEFAULT 0 CHECK (progress >= 0),
  total_items INTEGER DEFAULT 0 CHECK (total_items >= 0),
  is_favorite BOOLEAN DEFAULT FALSE,
  notes TEXT DEFAULT '',
  synopsis TEXT,
  genre TEXT,
  release_year TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, content_id, content_type)
);

CREATE INDEX IF NOT EXISTS idx_bookmarks_user_id ON public.content_bookmarks(user_id);
CREATE INDEX IF NOT EXISTS idx_bookmarks_user_status ON public.content_bookmarks(user_id, status);
CREATE INDEX IF NOT EXISTS idx_bookmarks_content ON public.content_bookmarks(content_type, content_id);

ALTER TABLE public.content_bookmarks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "bookmarks_select" ON public.content_bookmarks;
DROP POLICY IF EXISTS "bookmarks_insert" ON public.content_bookmarks;
DROP POLICY IF EXISTS "bookmarks_update" ON public.content_bookmarks;
DROP POLICY IF EXISTS "bookmarks_delete" ON public.content_bookmarks;

CREATE POLICY "bookmarks_select" ON public.content_bookmarks
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "bookmarks_insert" ON public.content_bookmarks
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "bookmarks_update" ON public.content_bookmarks
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "bookmarks_delete" ON public.content_bookmarks
  FOR DELETE USING (auth.uid() = user_id);

-- Функция триггера (создаём если нет)
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Автообновление updated_at
DROP TRIGGER IF EXISTS trg_bookmarks_updated_at ON public.content_bookmarks;
CREATE TRIGGER trg_bookmarks_updated_at
  BEFORE UPDATE ON public.content_bookmarks
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ═══════════ 2. ТОП-50 СПИСКИ ═══════════
CREATE TABLE IF NOT EXISTS public.top_lists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  media_type TEXT NOT NULL CHECK (media_type IN ('movie', 'anime', 'game')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, media_type)
);

CREATE INDEX IF NOT EXISTS idx_top_lists_user ON public.top_lists(user_id);

-- Элементы топа
CREATE TABLE IF NOT EXISTS public.top_list_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  top_list_id UUID NOT NULL REFERENCES public.top_lists(id) ON DELETE CASCADE,
  item_id TEXT NOT NULL,
  rank INTEGER NOT NULL CHECK (rank >= 1 AND rank <= 50),
  title TEXT,
  poster_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(top_list_id, item_id)
);

CREATE INDEX IF NOT EXISTS idx_top_list_items_list ON public.top_list_items(top_list_id);
CREATE INDEX IF NOT EXISTS idx_top_list_items_rank ON public.top_list_items(top_list_id, rank);

-- RLS: списки видны всем (публичный профиль), менять может только владелец
ALTER TABLE public.top_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.top_list_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "top_lists_select" ON public.top_lists;
DROP POLICY IF EXISTS "top_lists_insert" ON public.top_lists;
DROP POLICY IF EXISTS "top_lists_update" ON public.top_lists;
DROP POLICY IF EXISTS "top_lists_delete" ON public.top_lists;
DROP POLICY IF EXISTS "top_list_items_select" ON public.top_list_items;
DROP POLICY IF EXISTS "top_list_items_insert" ON public.top_list_items;
DROP POLICY IF EXISTS "top_list_items_update" ON public.top_list_items;
DROP POLICY IF EXISTS "top_list_items_delete" ON public.top_list_items;

-- Чтение — все авторизованные (чтобы окружающие видели Топ на профиле)
CREATE POLICY "top_lists_select" ON public.top_lists
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "top_lists_insert" ON public.top_lists
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "top_lists_update" ON public.top_lists
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "top_lists_delete" ON public.top_lists
  FOR DELETE USING (auth.uid() = user_id);

-- Чтение элементов — через владельца списка (join)
CREATE POLICY "top_list_items_select" ON public.top_list_items
  FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.top_lists tl
      WHERE tl.id = top_list_id
    )
  );

CREATE POLICY "top_list_items_insert" ON public.top_list_items
  FOR INSERT WITH CHECK (
    auth.uid() IN (
      SELECT tl.user_id FROM public.top_lists tl WHERE tl.id = top_list_id
    )
  );

CREATE POLICY "top_list_items_update" ON public.top_list_items
  FOR UPDATE USING (
    auth.uid() IN (
      SELECT tl.user_id FROM public.top_lists tl WHERE tl.id = top_list_id
    )
  ) WITH CHECK (
    auth.uid() IN (
      SELECT tl.user_id FROM public.top_lists tl WHERE tl.id = top_list_id
    )
  );

CREATE POLICY "top_list_items_delete" ON public.top_list_items
  FOR DELETE USING (
    auth.uid() IN (
      SELECT tl.user_id FROM public.top_lists tl WHERE tl.id = top_list_id
    )
  );
