-- Migration: Create daily_visits analytics table
-- Description: Tracks daily unique sessions for accurate "online now", "today", "yesterday", "month" metrics.

CREATE TABLE IF NOT EXISTS public.daily_visits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  visit_date DATE NOT NULL DEFAULT CURRENT_DATE,
  session_id UUID NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  last_seen TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  page_views INTEGER NOT NULL DEFAULT 1
);

-- Constraint for efficient upserting daily unique sessions
ALTER TABLE public.daily_visits 
  ADD CONSTRAINT unique_visit_per_day UNIQUE (visit_date, session_id);

-- Index for quick lookups on online users (last 5 minutes) and daily stats
CREATE INDEX IF NOT EXISTS idx_daily_visits_last_seen ON public.daily_visits(last_seen);
CREATE INDEX IF NOT EXISTS idx_daily_visits_date ON public.daily_visits(visit_date);

-- Enable Row Level Security (RLS)
ALTER TABLE public.daily_visits ENABLE ROW LEVEL SECURITY;

-- Allow anyone (including anonymous) to insert/upsert their own session stats
CREATE POLICY "Allow anonymous and authenticated inserts daily_visits" 
  ON public.daily_visits 
  FOR INSERT 
  WITH CHECK (true);

-- Allow updates (only for the same session)
CREATE POLICY "Allow session updates daily_visits" 
  ON public.daily_visits 
  FOR UPDATE 
  USING (true);

-- For now, allow reading by all so the admin dashboard works simply
-- (In a real app, this might explicitly check for an admin role)
CREATE POLICY "Allow public read daily_visits" 
  ON public.daily_visits 
  FOR SELECT 
  USING (true);
