-- ============================================================
-- reverseX: вход по юзернейму + пароль (без email)
-- Запустить в Supabase → SQL Editor, затем:
--   Dashboard → Authentication → Providers → Email →
--   выключить «Confirm email» (иначе регистрация не даст сессию)
-- ============================================================

-- Проверка занятости юзернейма. SECURITY DEFINER — работает и для
-- анонимного гостя на странице регистрации (RLS profiles мешать не будет).
CREATE OR REPLACE FUNCTION public.is_username_available(p_username text)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    p_username ~ '^[a-z0-9_]{3,20}$'          -- формат
    AND NOT EXISTS (
      SELECT 1 FROM public.profiles
      WHERE lower(username) = p_username
    );
$$;

-- RPC доступен всем (гость проверяет ник ДО регистрации)
GRANT EXECUTE ON FUNCTION public.is_username_available(text) TO anon, authenticated;

-- На всякий случай: уникальность username (без учёта регистра)
CREATE UNIQUE INDEX IF NOT EXISTS profiles_username_lower_uniq
  ON public.profiles (lower(username))
  WHERE username IS NOT NULL;

-- Бэкфилл: у старых пользователей, зарегистрированных по email,
-- username мог не доехать в профиль. Ставим ник из начала email.
UPDATE public.profiles
SET username = lower(split_part(display_name, '@', 1))
WHERE username IS NULL
  AND display_name LIKE '%@%';
