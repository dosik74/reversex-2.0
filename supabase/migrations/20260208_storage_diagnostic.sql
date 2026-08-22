-- ============================================================================
-- STORAGE BUCKET DIAGNOSTIC QUERIES
-- ============================================================================
-- Run these queries in Supabase Dashboard → SQL Editor to diagnose storage issues

-- ============================================================================
-- 1. Check if RLS is enabled on storage.objects
-- ============================================================================
SELECT tablename, rowsecurity FROM pg_tables 
WHERE tablename = 'objects' AND schemaname = 'storage';

-- Expected result: objects | t
-- If f or NULL → RLS is disabled, need to enable:
-- ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 2. List all RLS policies on storage.objects
-- ============================================================================
SELECT 
  policyname,
  cmd,
  roles,
  qual
FROM pg_policies 
WHERE tablename = 'objects' AND schemaname = 'storage'
ORDER BY cmd, policyname;

-- Should show 4 policies for recommendations bucket:
-- - Public access for recommendations uploads (SELECT)
-- - Authenticated users can upload to recommendations (INSERT)
-- - Authenticated users can delete from recommendations (DELETE)
-- - Authenticated users can update recommendations (UPDATE)

-- ============================================================================
-- 3. Check permissions - what can current user do?
-- ============================================================================
-- Run after: SET ROLE authenticated;
-- This simulates being an authenticated user

-- Can insert (upload)?
SELECT (SELECT COUNT(*) > 0 FROM storage.objects WHERE bucket_id = 'recommendations' LIMIT 1) as can_read;

-- ============================================================================
-- 4. List all buckets
-- ============================================================================
SELECT id, name, public, created_at 
FROM storage.buckets 
ORDER BY created_at DESC;

-- Look for "recommendations" bucket
-- If missing → create with: 
-- INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types) 
-- VALUES ('recommendations', 'recommendations', true, 104857600, null);

-- ============================================================================
-- 5. List all files in recommendations bucket
-- ============================================================================
SELECT 
  id,
  name,
  path_tokens,
  metadata,
  created_at,
  updated_at
FROM storage.objects
WHERE bucket_id = 'recommendations'
ORDER BY created_at DESC
LIMIT 20;

-- If empty → no files are uploaded
-- If has files → uploads are working, check if visible in app

-- ============================================================================
-- 6. Check metadata for specific recommendation
-- ============================================================================
-- Replace 'RECOMMENDATION_ID' with actual UUID
SELECT 
  name,
  size,
  metadata,
  created_at
FROM storage.objects
WHERE bucket_id = 'recommendations'
  AND path_tokens[1] = 'RECOMMENDATION_ID'
ORDER BY created_at DESC;

-- ============================================================================
-- 7. Check if recommendation_media table has records
-- ============================================================================
SELECT 
  id,
  recommendation_id,
  media_type,
  media_url,
  storage_path,
  created_at
FROM recommendation_media
ORDER BY created_at DESC
LIMIT 10;

-- If empty → metadata not being saved
-- If has data → check if URLs are correct

-- ============================================================================
-- 8. Full RLS policy definition
-- ============================================================================
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  qual AS check_expression,
  with_check AS insert_check
FROM pg_policies 
WHERE schemaname = 'storage' AND tablename = 'objects'
ORDER BY tablename, policyname;

-- ============================================================================
-- 9. Check storage.objects definition
-- ============================================================================
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'storage' AND table_name = 'objects'
ORDER BY ordinal_position;

-- ============================================================================
-- COMMON SOLUTIONS
-- ============================================================================

-- If RLS is disabled:
-- ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- If bucket missing:
-- INSERT INTO storage.buckets (id, name, public, file_size_limit) 
-- VALUES ('recommendations', 'recommendations', true, 104857600);

-- If policies missing:
-- See: APPLY_STORAGE_RLS.md (run the complete SQL there)

-- If you need to drop all storage policies and start fresh:
-- DROP POLICY IF EXISTS "name1" ON storage.objects;
-- DROP POLICY IF EXISTS "name2" ON storage.objects;
-- ... (repeat for all policies)
-- Then run: APPLY_STORAGE_RLS.md

-- ============================================================================
-- QUICK HEALTH CHECK
-- ============================================================================
-- Run all above queries to get complete picture:
-- 1. Is RLS enabled? (query 1)
-- 2. How many policies? (query 2 - should be 4)
-- 3. Is recommendations bucket public? (query 4)
-- 4. How many files uploaded? (query 5)
-- 5. Is metadata saved? (query 7)

-- All should be ✅ for storage to work
