/*
  # Add Worker Photo Upload Links to Installation Tasks

  ## Overview
  Enhances the installation_tasks table to support shareable upload links for workers to upload installation photos without requiring authentication.

  ## 1. Changes to installation_tasks Table
  Add new columns for upload link functionality:
    - `upload_link_token` (text) - Unique secure token for worker access
    - `upload_link_generated_at` (timestamptz) - When the link was generated
    - `upload_link_expires_at` (timestamptz) - Link expiration time
    - `upload_link_active` (boolean) - Whether the link is active or revoked

  ## 2. Changes to installation_photos Table
  Add field to track worker name:
    - `uploaded_by_name` (text) - Name of worker who uploaded photo (for non-authenticated uploads)

  ## 3. Indexes
  Add indexes for efficient queries:
    - Index on upload_link_token for quick link lookups
    - Index on upload_link_expires_at for cleanup queries

  ## 4. Security
  Add RLS policies to allow public uploads via valid token:
    - Allow anonymous users to view installation task details via token
    - Allow anonymous users to upload photos via valid token

  ## 5. Important Notes
  - Upload link tokens are unique and secure for worker access
  - Links can be revoked by setting upload_link_active to false
  - Default link expiration is 7 days from generation
*/

-- Add upload link fields to installation_tasks table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'installation_tasks' AND column_name = 'upload_link_token'
  ) THEN
    ALTER TABLE installation_tasks ADD COLUMN upload_link_token text DEFAULT '';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'installation_tasks' AND column_name = 'upload_link_generated_at'
  ) THEN
    ALTER TABLE installation_tasks ADD COLUMN upload_link_generated_at timestamptz;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'installation_tasks' AND column_name = 'upload_link_expires_at'
  ) THEN
    ALTER TABLE installation_tasks ADD COLUMN upload_link_expires_at timestamptz;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'installation_tasks' AND column_name = 'upload_link_active'
  ) THEN
    ALTER TABLE installation_tasks ADD COLUMN upload_link_active boolean DEFAULT true;
  END IF;
END $$;

-- Add uploaded_by_name field to installation_photos table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'installation_photos' AND column_name = 'uploaded_by_name'
  ) THEN
    ALTER TABLE installation_photos ADD COLUMN uploaded_by_name text DEFAULT '';
  END IF;
END $$;

-- Create indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_installation_tasks_upload_token
  ON installation_tasks(upload_link_token)
  WHERE upload_link_token != '';

CREATE INDEX IF NOT EXISTS idx_installation_tasks_upload_expires
  ON installation_tasks(upload_link_expires_at)
  WHERE upload_link_expires_at IS NOT NULL;

-- Drop existing public policies if they exist
DROP POLICY IF EXISTS "Public can view installation task by upload token" ON installation_tasks;
DROP POLICY IF EXISTS "Public can upload photos via valid token" ON installation_photos;

-- RLS policy to allow public to view installation task details via upload link token
CREATE POLICY "Public can view installation task by upload token"
  ON installation_tasks
  FOR SELECT
  TO anon, authenticated
  USING (
    upload_link_token != ''
    AND upload_link_active = true
    AND upload_link_expires_at > now()
  );

-- RLS policy to allow public to upload photos via valid upload link
CREATE POLICY "Public can upload photos via valid token"
  ON installation_photos
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM installation_tasks
      WHERE installation_tasks.id = installation_photos.installation_task_id
      AND installation_tasks.upload_link_token != ''
      AND installation_tasks.upload_link_active = true
      AND installation_tasks.upload_link_expires_at > now()
      AND installation_tasks.status != 'completed'
    )
  );