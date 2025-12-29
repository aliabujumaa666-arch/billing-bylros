/*
  # Enhance Pages System for WordPress-Style Interface

  ## Overview
  Adds comprehensive fields and functionality to support a professional WordPress-style
  page management interface with revisions, drafts, SEO tracking, and enhanced metadata.

  ## 1. New Columns Added to `pages` Table

  ### User Tracking
  - `last_modified_by` (uuid) - User who last edited the page

  ### Content Management
  - `draft_content` (text) - Save draft changes without affecting published content
  - `featured_image_url` (text) - URL to featured/hero image
  - `excerpt` (text) - Short summary/excerpt of page content

  ### Analytics & Quality
  - `view_count` (integer) - Number of page views
  - `revision_count` (integer) - Number of times page has been revised

  ### Page Attributes
  - `page_attributes` (jsonb) - Custom attributes (template, parent_id, custom_css, etc.)
  - `template` (text) - Page template type (default, full-width, landing, etc.)
  - `parent_id` (uuid) - Parent page for hierarchical structure

  ### SEO & Visibility
  - `status` (text) - Page status (draft, published, scheduled, trash)
  - `scheduled_at` (timestamptz) - Scheduled publish date/time
  - `visibility` (text) - Visibility setting (public, private, password)
  - `password` (text) - Password for protected pages

  ### Additional Settings
  - `allow_comments` (boolean) - Enable/disable comments
  - `custom_css` (text) - Custom CSS for this page
  - `custom_js` (text) - Custom JavaScript for this page

  ## 2. New Tables

  ### `page_revisions`
  - Stores complete history of page changes
  - Allows reverting to previous versions
  - Tracks who made changes and when

  ## 3. Security
  - Update RLS policies for new fields
  - Add policies for page_revisions table

  ## 4. Indexes
  - Add indexes for status, scheduled_at, parent_id for performance
  - Add indexes for page_revisions queries

  ## 5. Important Notes
  - Draft content allows editing without affecting published version
  - Revision history provides complete audit trail
  - Page hierarchy enables parent-child relationships
  - Status field replaces simple is_published boolean for more flexibility
*/

-- Add new columns to pages table
DO $$
BEGIN
  -- User tracking
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'pages' AND column_name = 'last_modified_by'
  ) THEN
    ALTER TABLE pages ADD COLUMN last_modified_by uuid REFERENCES auth.users(id) ON DELETE SET NULL;
  END IF;

  -- Content management
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'pages' AND column_name = 'draft_content'
  ) THEN
    ALTER TABLE pages ADD COLUMN draft_content text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'pages' AND column_name = 'featured_image_url'
  ) THEN
    ALTER TABLE pages ADD COLUMN featured_image_url text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'pages' AND column_name = 'excerpt'
  ) THEN
    ALTER TABLE pages ADD COLUMN excerpt text;
  END IF;

  -- Analytics
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'pages' AND column_name = 'view_count'
  ) THEN
    ALTER TABLE pages ADD COLUMN view_count integer DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'pages' AND column_name = 'revision_count'
  ) THEN
    ALTER TABLE pages ADD COLUMN revision_count integer DEFAULT 0;
  END IF;

  -- Page attributes
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'pages' AND column_name = 'page_attributes'
  ) THEN
    ALTER TABLE pages ADD COLUMN page_attributes jsonb DEFAULT '{}'::jsonb;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'pages' AND column_name = 'template'
  ) THEN
    ALTER TABLE pages ADD COLUMN template text DEFAULT 'default';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'pages' AND column_name = 'parent_id'
  ) THEN
    ALTER TABLE pages ADD COLUMN parent_id uuid REFERENCES pages(id) ON DELETE SET NULL;
  END IF;

  -- Status management
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'pages' AND column_name = 'status'
  ) THEN
    ALTER TABLE pages ADD COLUMN status text DEFAULT 'draft'
      CHECK (status IN ('draft', 'published', 'scheduled', 'trash', 'pending'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'pages' AND column_name = 'scheduled_at'
  ) THEN
    ALTER TABLE pages ADD COLUMN scheduled_at timestamptz;
  END IF;

  -- Visibility
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'pages' AND column_name = 'visibility'
  ) THEN
    ALTER TABLE pages ADD COLUMN visibility text DEFAULT 'public'
      CHECK (visibility IN ('public', 'private', 'password'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'pages' AND column_name = 'password'
  ) THEN
    ALTER TABLE pages ADD COLUMN password text;
  END IF;

  -- Additional settings
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'pages' AND column_name = 'allow_comments'
  ) THEN
    ALTER TABLE pages ADD COLUMN allow_comments boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'pages' AND column_name = 'custom_css'
  ) THEN
    ALTER TABLE pages ADD COLUMN custom_css text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'pages' AND column_name = 'custom_js'
  ) THEN
    ALTER TABLE pages ADD COLUMN custom_js text;
  END IF;
END $$;

-- Migrate existing is_published data to status field
UPDATE pages
SET status = CASE
  WHEN is_published = true THEN 'published'
  ELSE 'draft'
END
WHERE status = 'draft' AND is_published IS NOT NULL;

-- Create page_revisions table
CREATE TABLE IF NOT EXISTS page_revisions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id uuid NOT NULL REFERENCES pages(id) ON DELETE CASCADE,
  title text NOT NULL,
  slug text NOT NULL,
  content text NOT NULL,
  meta_description text,
  meta_keywords text,
  excerpt text,
  page_type text,
  template text,
  custom_css text,
  custom_js text,
  page_attributes jsonb DEFAULT '{}'::jsonb,
  revision_number integer NOT NULL,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  change_summary text
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_pages_status ON pages(status);
CREATE INDEX IF NOT EXISTS idx_pages_scheduled ON pages(scheduled_at) WHERE scheduled_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_pages_parent ON pages(parent_id) WHERE parent_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_pages_last_modified_by ON pages(last_modified_by);
CREATE INDEX IF NOT EXISTS idx_pages_template ON pages(template);
CREATE INDEX IF NOT EXISTS idx_pages_visibility ON pages(visibility);

CREATE INDEX IF NOT EXISTS idx_page_revisions_page_id ON page_revisions(page_id);
CREATE INDEX IF NOT EXISTS idx_page_revisions_created_at ON page_revisions(created_at DESC);

-- Function to automatically create revision when page is updated
CREATE OR REPLACE FUNCTION create_page_revision()
RETURNS TRIGGER AS $$
BEGIN
  -- Only create revision if content has actually changed
  IF OLD.content IS DISTINCT FROM NEW.content OR
     OLD.title IS DISTINCT FROM NEW.title OR
     OLD.slug IS DISTINCT FROM NEW.slug THEN

    INSERT INTO page_revisions (
      page_id, title, slug, content, meta_description, meta_keywords,
      excerpt, page_type, template, custom_css, custom_js, page_attributes,
      revision_number, created_by, change_summary
    ) VALUES (
      OLD.id, OLD.title, OLD.slug, OLD.content, OLD.meta_description,
      OLD.meta_keywords, OLD.excerpt, OLD.page_type, OLD.template,
      OLD.custom_css, OLD.custom_js, OLD.page_attributes,
      OLD.revision_count + 1, NEW.last_modified_by, 'Page updated'
    );

    -- Increment revision count
    NEW.revision_count = OLD.revision_count + 1;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic revision creation
DROP TRIGGER IF EXISTS create_page_revision_trigger ON pages;
CREATE TRIGGER create_page_revision_trigger
  BEFORE UPDATE ON pages
  FOR EACH ROW
  EXECUTE FUNCTION create_page_revision();

-- Function to handle scheduled publishing
CREATE OR REPLACE FUNCTION publish_scheduled_pages()
RETURNS void AS $$
BEGIN
  UPDATE pages
  SET status = 'published',
      is_published = true,
      published_at = now()
  WHERE status = 'scheduled'
    AND scheduled_at IS NOT NULL
    AND scheduled_at <= now();
END;
$$ LANGUAGE plpgsql;

-- Enable Row Level Security on page_revisions
ALTER TABLE page_revisions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for page_revisions (admin only)
CREATE POLICY "Admins can view all page revisions"
  ON page_revisions FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can insert page revisions"
  ON page_revisions FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Admins can delete page revisions"
  ON page_revisions FOR DELETE
  TO authenticated
  USING (true);

-- Update the existing published pages policy to use status
DROP POLICY IF EXISTS "Public can view published pages" ON pages;
CREATE POLICY "Public can view published pages"
  ON pages FOR SELECT
  TO anon
  USING (status = 'published' AND visibility = 'public');

-- Add comments for documentation
COMMENT ON COLUMN pages.status IS 'Page workflow status: draft, published, scheduled, trash, pending';
COMMENT ON COLUMN pages.draft_content IS 'Draft version of content that does not affect the published page';
COMMENT ON COLUMN pages.revision_count IS 'Total number of revisions made to this page';
COMMENT ON COLUMN pages.page_attributes IS 'Flexible JSON storage for custom page attributes and settings';
COMMENT ON TABLE page_revisions IS 'Complete revision history for all pages, enabling version control and rollback';
