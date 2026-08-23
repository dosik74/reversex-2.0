-- ============================================================
-- reverseX: Кастомизация профиля
-- Запустить в SQL Editor ПОСЛЕ init_core_tables.sql
-- ============================================================

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS avatar_frame_url TEXT,
  ADD COLUMN IF NOT EXISTS background_url TEXT,
  ADD COLUMN IF NOT EXISTS background_type TEXT DEFAULT 'image' CHECK (background_type IN ('image', 'video')),
  ADD COLUMN IF NOT EXISTS theme TEXT DEFAULT 'dark',
  ADD COLUMN IF NOT EXISTS accent_color TEXT,
  ADD COLUMN IF NOT EXISTS about_me TEXT,
  ADD COLUMN IF NOT EXISTS banner_url TEXT,
  ADD COLUMN IF NOT EXISTS favorite_content JSONB,
  ADD COLUMN IF NOT EXISTS gallery_images JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS achievements JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS showcase JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS customization JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS custom_slug TEXT;

-- Уникальный кастомный URL
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_custom_slug ON public.profiles(custom_slug) WHERE custom_slug IS NOT NULL;
