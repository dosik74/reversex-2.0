-- ============================================================
-- reverseX: таблицы тир-листов (fix: PGRST205 "table not found")
-- tierListService.ts ждёт именно эти колонки.
-- Запустить в Supabase → SQL Editor. Повторный запуск безопасен.
-- ============================================================

-- ═══════════ СПИСКИ ═══════════
CREATE TABLE IF NOT EXISTS public.tier_lists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  is_public boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tier_lists_user ON public.tier_lists(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tier_lists_public ON public.tier_lists(is_public, created_at DESC);

-- ═══════════ ЭЛЕМЕНТЫ (SS/S/A/B/C) ═══════════
CREATE TABLE IF NOT EXISTS public.tier_list_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tier_list_id uuid NOT NULL REFERENCES public.tier_lists(id) ON DELETE CASCADE,
  content_id text NOT NULL,
  content_type text NOT NULL CHECK (content_type IN ('movie', 'series', 'game')),
  title text NOT NULL,
  poster_url text,
  rating numeric(3,1) CHECK (rating IS NULL OR (rating >= 0 AND rating <= 10)),
  tier text NOT NULL CHECK (tier IN ('SS', 'S', 'A', 'B', 'C')),
  position integer NOT NULL DEFAULT 0 CHECK (position >= 0),
  created_at timestamptz DEFAULT now(),
  -- один контент не может лежать в списке дважды
  CONSTRAINT tier_list_items_unique UNIQUE (tier_list_id, content_id)
);

CREATE INDEX IF NOT EXISTS idx_tli_list_tier ON public.tier_list_items(tier_list_id, tier, position);
CREATE INDEX IF NOT EXISTS idx_tli_content ON public.tier_list_items(content_type, content_id);

-- ═══════════ RLS ═══════════
ALTER TABLE public.tier_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tier_list_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "tier_lists_select" ON public.tier_lists;
CREATE POLICY "tier_lists_select" ON public.tier_lists
  FOR SELECT USING (
    is_public = true
    OR user_id = (select auth.uid())
  );

DROP POLICY IF EXISTS "tier_lists_insert" ON public.tier_lists;
CREATE POLICY "tier_lists_insert" ON public.tier_lists
  FOR INSERT WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "tier_lists_update" ON public.tier_lists;
CREATE POLICY "tier_lists_update" ON public.tier_lists
  FOR UPDATE USING (user_id = (select auth.uid())) WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "tier_lists_delete" ON public.tier_lists;
CREATE POLICY "tier_lists_delete" ON public.tier_lists
  FOR DELETE USING (user_id = (select auth.uid()));

-- Элементы: читают все (виден список — видны элементы), правит владелец
DROP POLICY IF EXISTS "tier_list_items_select" ON public.tier_list_items;
CREATE POLICY "tier_list_items_select" ON public.tier_list_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.tier_lists t
      WHERE t.id = tier_list_id
        AND (t.is_public = true OR t.user_id = (select auth.uid()))
    )
  );

DROP POLICY IF EXISTS "tier_list_items_insert" ON public.tier_list_items;
CREATE POLICY "tier_list_items_insert" ON public.tier_list_items
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.tier_lists t
      WHERE t.id = tier_list_id AND t.user_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "tier_list_items_update" ON public.tier_list_items;
CREATE POLICY "tier_list_items_update" ON public.tier_list_items
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.tier_lists t
      WHERE t.id = tier_list_id AND t.user_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "tier_list_items_delete" ON public.tier_list_items;
CREATE POLICY "tier_list_items_delete" ON public.tier_list_items
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.tier_lists t
      WHERE t.id = tier_list_id AND t.user_id = (select auth.uid())
    )
  );

-- ═══════════ АВТООБНОВЛЕНИЕ updated_at ═══════════
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_tier_lists_updated_at ON public.tier_lists;
CREATE TRIGGER trg_tier_lists_updated_at BEFORE UPDATE ON public.tier_lists
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
