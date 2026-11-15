-- ============================================================
-- reverseX: политики daily_visits (fix: "row-level security policy")
-- Гость тоже должен писать визит — иначе аналитика падает на каждой странице.
-- ============================================================

DROP POLICY IF EXISTS "daily_visits_select" ON public.daily_visits;
CREATE POLICY "daily_visits_select" ON public.daily_visits
  FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "daily_visits_write" ON public.daily_visits;
CREATE POLICY "daily_visits_write" ON public.daily_visits
  FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "daily_visits_update" ON public.daily_visits;
CREATE POLICY "daily_visits_update" ON public.daily_visits
  FOR UPDATE TO anon, authenticated USING (true)
  WITH CHECK (true);
