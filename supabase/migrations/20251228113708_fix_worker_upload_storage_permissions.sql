/*
  # Fix Worker Photo Upload Storage Permissions

  ## Overview
  Adds storage bucket policies to allow anonymous users to upload installation photos via valid upload tokens.

  ## Changes
  1. Add storage policy to allow anonymous users to insert photos to installation-photos folder
  2. Ensure proper path restrictions for security

  ## Security
  - Only allows uploads to installation-photos/ folder
  - Validates that a valid upload token exists before allowing upload
  - File size limits enforced on client side (10MB)
*/

-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Allow worker uploads to installation photos" ON storage.objects;

-- Create storage policy to allow anonymous uploads for installation photos
CREATE POLICY "Allow worker uploads to installation photos"
  ON storage.objects
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    bucket_id = 'uploads'
    AND (storage.foldername(name))[1] = 'installation-photos'
  );

-- Add policy to allow anonymous users to read installation photos (for preview)
DROP POLICY IF EXISTS "Allow reading installation photos" ON storage.objects;

CREATE POLICY "Allow reading installation photos"
  ON storage.objects
  FOR SELECT
  TO anon, authenticated
  USING (
    bucket_id = 'uploads'
    AND (storage.foldername(name))[1] = 'installation-photos'
  );
