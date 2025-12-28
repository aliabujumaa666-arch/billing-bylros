-- Add Site Visit Photos System
--
-- 1. New Tables
--    - site_visit_photos: Store photos for site visits
--    - site_visit_worker_links: Generate upload links for workers
--
-- 2. Security
--    - Enable RLS on both tables
--    - Admins can manage all records
--    - Workers can upload via anonymous link
--
-- 3. Storage
--    - Policies for site-visit-photos folder in uploads bucket

-- Create site_visit_photos table
CREATE TABLE IF NOT EXISTS site_visit_photos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  site_visit_id uuid NOT NULL REFERENCES site_visits(id) ON DELETE CASCADE,
  photo_type text NOT NULL DEFAULT 'general',
  storage_path text NOT NULL,
  file_name text NOT NULL,
  uploaded_by uuid REFERENCES auth.users(id),
  uploaded_by_name text,
  caption text,
  created_at timestamptz DEFAULT now()
);

-- Create site_visit_worker_links table
CREATE TABLE IF NOT EXISTS site_visit_worker_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  site_visit_id uuid NOT NULL REFERENCES site_visits(id) ON DELETE CASCADE,
  link_token text UNIQUE NOT NULL,
  worker_name text,
  expires_at timestamptz,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_site_visit_photos_site_visit_id ON site_visit_photos(site_visit_id);
CREATE INDEX IF NOT EXISTS idx_site_visit_worker_links_token ON site_visit_worker_links(link_token);
CREATE INDEX IF NOT EXISTS idx_site_visit_worker_links_site_visit_id ON site_visit_worker_links(site_visit_id);

-- Enable RLS
ALTER TABLE site_visit_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_visit_worker_links ENABLE ROW LEVEL SECURITY;

-- Policies for site_visit_photos
CREATE POLICY "Admins can view all site visit photos"
  ON site_visit_photos FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can insert site visit photos"
  ON site_visit_photos FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Admins can update site visit photos"
  ON site_visit_photos FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Admins can delete site visit photos"
  ON site_visit_photos FOR DELETE
  TO authenticated
  USING (true);

CREATE POLICY "Workers can view site visit photos via link"
  ON site_visit_photos FOR SELECT
  TO anon
  USING (
    EXISTS (
      SELECT 1 FROM site_visit_worker_links
      WHERE site_visit_worker_links.site_visit_id = site_visit_photos.site_visit_id
      AND site_visit_worker_links.is_active = true
      AND (site_visit_worker_links.expires_at IS NULL OR site_visit_worker_links.expires_at > now())
    )
  );

CREATE POLICY "Workers can upload photos via link"
  ON site_visit_photos FOR INSERT
  TO anon
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM site_visit_worker_links
      WHERE site_visit_worker_links.site_visit_id = site_visit_photos.site_visit_id
      AND site_visit_worker_links.is_active = true
      AND (site_visit_worker_links.expires_at IS NULL OR site_visit_worker_links.expires_at > now())
    )
  );

-- Policies for site_visit_worker_links
CREATE POLICY "Admins can view worker links"
  ON site_visit_worker_links FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can create worker links"
  ON site_visit_worker_links FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Admins can update worker links"
  ON site_visit_worker_links FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Admins can delete worker links"
  ON site_visit_worker_links FOR DELETE
  TO authenticated
  USING (true);

CREATE POLICY "Workers can view their link info"
  ON site_visit_worker_links FOR SELECT
  TO anon
  USING (is_active = true AND (expires_at IS NULL OR expires_at > now()));

-- Storage policies for site-visit-photos folder
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Allow reading site visit photos'
  ) THEN
    CREATE POLICY "Allow reading site visit photos"
      ON storage.objects FOR SELECT
      TO anon, authenticated
      USING (
        bucket_id = 'uploads' 
        AND (storage.foldername(name))[1] = 'site-visit-photos'
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Allow worker uploads to site visit photos'
  ) THEN
    CREATE POLICY "Allow worker uploads to site visit photos"
      ON storage.objects FOR INSERT
      TO anon, authenticated
      WITH CHECK (
        bucket_id = 'uploads' 
        AND (storage.foldername(name))[1] = 'site-visit-photos'
      );
  END IF;
END $$;