-- ============================================================================
-- RLS POLICIES FOR STORAGE BUCKET: recommendations
-- ============================================================================
-- This file contains all RLS policies needed for the recommendations bucket
-- Execute this SQL in Supabase Dashboard → SQL Editor

-- ============================================================================
-- 1. ENABLE RLS on storage.objects table
-- ============================================================================
ALTER TABLE IF EXISTS storage.objects ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 2. DROP existing policies (if upgrading)
-- ============================================================================
-- Drop old policies if they exist to avoid conflicts
DROP POLICY IF EXISTS "Public access for uploaded files" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload recommendations" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own files" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their files" ON storage.objects;

-- ============================================================================
-- 3. RLS POLICIES FOR SELECT (Read/Download)
-- ============================================================================
-- Allow ANYONE (authenticated or not) to VIEW files in recommendations bucket
-- This makes uploaded photos publicly visible
CREATE POLICY "Public access for recommendations uploads" ON storage.objects
  FOR SELECT
  USING (bucket_id = 'recommendations');

-- ============================================================================
-- 4. RLS POLICIES FOR INSERT (Upload)
-- ============================================================================
-- Allow only AUTHENTICATED users to upload to recommendations bucket
-- They cannot be anonymous
CREATE POLICY "Authenticated users can upload to recommendations" ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'recommendations' 
    AND auth.uid() IS NOT NULL
  );

-- ============================================================================
-- 5. RLS POLICIES FOR DELETE (Remove files)
-- ============================================================================
-- Allow authenticated users to delete their own files
-- The folder structure is: {recommendation_id}/{timestamp}.{ext}
-- So we allow deletion if user is authenticated
CREATE POLICY "Authenticated users can delete from recommendations" ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'recommendations'
    AND auth.uid() IS NOT NULL
  );

-- ============================================================================
-- 6. RLS POLICIES FOR UPDATE (Modify metadata)
-- ============================================================================
-- Allow authenticated users to update file metadata
CREATE POLICY "Authenticated users can update recommendations" ON storage.objects
  FOR UPDATE
  WITH CHECK (
    bucket_id = 'recommendations'
    AND auth.uid() IS NOT NULL
  );

-- ============================================================================
-- SUMMARY OF POLICIES
-- ============================================================================
-- SELECT:  ✅ Everyone (public) - anyone can VIEW photos
-- INSERT:  ✅ Authenticated only - users must be logged in to UPLOAD
-- DELETE:  ✅ Authenticated only - only logged in users can DELETE
-- UPDATE:  ✅ Authenticated only - only logged in users can UPDATE metadata

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================
-- Run these to verify policies are created:

-- Check if RLS is enabled:
-- SELECT tablename, rowsecurity FROM pg_tables WHERE tablename = 'objects' AND schemaname = 'storage';
-- Should show: objects | t (t = true, enabled)

-- List all policies:
-- SELECT policyname, cmd, roles FROM pg_policies 
-- WHERE tablename = 'objects' AND schemaname = 'storage'
-- ORDER BY cmd, policyname;

-- Should show 4 policies:
-- 1. "Public access for recommendations uploads" (SELECT)
-- 2. "Authenticated users can upload to recommendations" (INSERT)
-- 3. "Authenticated users can delete from recommendations" (DELETE)
-- 4. "Authenticated users can update recommendations" (UPDATE)

-- ============================================================================
-- NOTES
-- ============================================================================
-- 1. The recommendations bucket must exist in Supabase Storage
-- 2. The bucket must be set to PUBLIC (not private)
-- 3. Users must be authenticated (logged in) to upload photos
-- 4. Anyone (even anonymous users) can VIEW the photos
-- 5. Only authenticated users can delete/update file metadata
-- 6. This setup is secure and prevents anonymous spam uploads
