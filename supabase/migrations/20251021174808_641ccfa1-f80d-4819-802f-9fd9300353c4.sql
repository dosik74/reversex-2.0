-- Create media type enum
DO $$ BEGIN
  CREATE TYPE public.media_type AS ENUM ('movie','anime','book','music','game');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Top lists table
CREATE TABLE IF NOT EXISTS public.top_lists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  media_type public.media_type NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.top_lists ENABLE ROW LEVEL SECURITY;

-- RLS policies
DO $$ BEGIN
  CREATE POLICY "Top lists are viewable by everyone" ON public.top_lists
  FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Users can create their own top lists" ON public.top_lists
  FOR INSERT WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Users can update their own top lists" ON public.top_lists
  FOR UPDATE USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Users can delete their own top lists" ON public.top_lists
  FOR DELETE USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- updated_at trigger
DO $$ BEGIN
  CREATE TRIGGER update_top_lists_updated_at
  BEFORE UPDATE ON public.top_lists
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Top list items table
CREATE TABLE IF NOT EXISTS public.top_list_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  top_list_id UUID NOT NULL REFERENCES public.top_lists(id) ON DELETE CASCADE,
  item_id TEXT NOT NULL,
  rank INTEGER NOT NULL,
  title TEXT,
  poster_url TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_top_list_items_list_rank ON public.top_list_items(top_list_id, rank);

ALTER TABLE public.top_list_items ENABLE ROW LEVEL SECURITY;

-- Anyone can read list items (public profiles)
DO $$ BEGIN
  CREATE POLICY "Top list items are viewable by everyone" ON public.top_list_items
  FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Owners can manage items via parent list ownership
DO $$ BEGIN
  CREATE POLICY "Users can insert items into their lists" ON public.top_list_items
  FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.top_lists l
    WHERE l.id = top_list_id AND l.user_id = auth.uid()
  ));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Users can update items in their lists" ON public.top_list_items
  FOR UPDATE USING (EXISTS (
    SELECT 1 FROM public.top_lists l
    WHERE l.id = top_list_id AND l.user_id = auth.uid()
  ));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Users can delete items in their lists" ON public.top_list_items
  FOR DELETE USING (EXISTS (
    SELECT 1 FROM public.top_lists l
    WHERE l.id = top_list_id AND l.user_id = auth.uid()
  ));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
