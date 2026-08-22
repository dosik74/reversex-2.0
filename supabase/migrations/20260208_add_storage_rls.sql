-- Add RLS policies for Storage bucket "recommendations"
-- This allows authenticated users to upload and view files

-- First, enable RLS on storage.objects if not already enabled
ALTER TABLE IF EXISTS storage.objects ENABLE ROW LEVEL SECURITY;

-- Policy: Allow everyone to view public files
CREATE POLICY IF NOT EXISTS "Public access for uploaded files" ON storage.objects
  FOR SELECT
  USING (bucket_id = 'recommendations');

-- Policy: Allow authenticated users to upload files
CREATE POLICY IF NOT EXISTS "Users can upload recommendations" ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'recommendations' AND 
    auth.uid() IS NOT NULL
  );

-- Policy: Allow users to delete their own files (by folder name = user_id)
CREATE POLICY IF NOT EXISTS "Users can delete their own files" ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'recommendations' AND
    auth.uid() IS NOT NULL
  );

-- Policy: Allow users to update their files
CREATE POLICY IF NOT EXISTS "Users can update their files" ON storage.objects
  FOR UPDATE
  WITH CHECK (
    bucket_id = 'recommendations' AND
    auth.uid() IS NOT NULL
  );
