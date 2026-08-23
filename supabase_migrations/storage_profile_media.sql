-- ============================================================
-- reverseX: бакет для загрузки медиа профиля
-- Запустить в SQL Editor ПОСЛЕ profile_customization.sql
-- ============================================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('profile-media', 'profile-media', true)
ON CONFLICT (id) DO UPDATE SET public = true;

DROP POLICY IF EXISTS "profile_media_read" ON storage.objects;
DROP POLICY IF EXISTS "profile_media_insert" ON storage.objects;
DROP POLICY IF EXISTS "profile_media_update" ON storage.objects;
DROP POLICY IF EXISTS "profile_media_delete" ON storage.objects;

-- Публичное чтение (URL аватаров/фонов/галерей)
CREATE POLICY "profile_media_read" ON storage.objects FOR SELECT
  USING (bucket_id = 'profile-media');

-- Загружать можно только в свою папку userId/
CREATE POLICY "profile_media_insert" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'profile-media'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "profile_media_update" ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'profile-media'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "profile_media_delete" ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'profile-media'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
