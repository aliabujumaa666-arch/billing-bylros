/*
  # Create Company Assets Storage Bucket

  1. Storage
    - Create `company-assets` bucket for storing company stamps, logos, and other assets
    - Public bucket for easy access
  
  2. Security
    - Only authenticated users can upload
    - Only authenticated users can update/delete
    - Public read access for displaying in PDFs
*/

-- Create company-assets storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('company-assets', 'company-assets', true)
ON CONFLICT (id) DO NOTHING;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Authenticated users can upload company assets" ON storage.objects;
DROP POLICY IF EXISTS "Public can view company assets" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update company assets" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete company assets" ON storage.objects;

-- Allow authenticated users to upload
CREATE POLICY "Authenticated users can upload company assets"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'company-assets'
  );

-- Allow public read access
CREATE POLICY "Public can view company assets"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'company-assets');

-- Allow authenticated users to update
CREATE POLICY "Authenticated users can update company assets"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'company-assets');

-- Allow authenticated users to delete
CREATE POLICY "Authenticated users can delete company assets"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'company-assets');