-- ============================================================================
-- RLS POLICIES FOR RECOMMENDATIONS BUCKET (matching existing pattern)
-- ============================================================================
-- Based on working policies for avatars/backgrounds buckets

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Anyone can view recommendations" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload recommendations" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own recommendations" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own recommendations" ON storage.objects;
DROP POLICY IF EXISTS "allow_authenticated_uploads" ON storage.objects;
DROP POLICY IF EXISTS "allow_public_read" ON storage.objects;
DROP POLICY IF EXISTS "allow_authenticated_delete" ON storage.objects;
DROP POLICY IF EXISTS "allow_authenticated_update" ON storage.objects;

-- Enable RLS (should already be enabled)
ALTER TABLE IF EXISTS storage.objects ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- SELECT Policy - Anyone can view recommendations (public)
-- ============================================================================
CREATE POLICY "Anyone can view recommendations" ON storage.objects
  FOR SELECT
  USING (bucket_id = 'recommendations'::text);

-- ============================================================================
-- INSERT Policy - Users can upload to recommendations (authenticated users)
-- ============================================================================
CREATE POLICY "Users can upload recommendations" ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'recommendations'::text
    AND auth.uid() IS NOT NULL
  );

-- ============================================================================
-- DELETE Policy - Users can delete their own recommendations
-- ============================================================================
-- Folder structure: {recommendation_id}/{timestamp}.{ext}
-- So we check if first folder matches user ID
CREATE POLICY "Users can delete their own recommendations" ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'recommendations'::text
    AND (auth.uid())::text = (storage.foldername(name))[1]
  );

-- ============================================================================
-- UPDATE Policy - Users can update their own recommendations
-- ============================================================================
CREATE POLICY "Users can update their own recommendations" ON storage.objects
  FOR UPDATE
  WITH CHECK (
    bucket_id = 'recommendations'::text
    AND (auth.uid())::text = (storage.foldername(name))[1]
  );

-- ============================================================================
-- VERIFY POLICIES
-- ============================================================================
-- Run this to verify all 4 policies are created:
-- SELECT policyname, cmd, roles, qual FROM pg_policies 
-- WHERE tablename = 'objects' AND schemaname = 'storage' 
-- AND policyname LIKE '%recommendation%'
-- ORDER BY cmd;

-- Should show:
-- 1. Anyone can view recommendations (SELECT)
-- 2. Users can upload recommendations (INSERT)
-- 3. Users can delete their own recommendations (DELETE)
-- 4. Users can update their own recommendations (UPDATE)
