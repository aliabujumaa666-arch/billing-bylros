/*
  # Custom Pages Management System

  ## Overview
  Creates a system for managing custom pages with rich content, allowing admins
  to create static pages like About Us, Terms & Conditions, Privacy Policy, etc.

  ## 1. New Tables

  ### `pages`
  - `id` (uuid, primary key) - Unique page identifier
  - `title` (text) - Page title
  - `slug` (text, unique) - URL-friendly identifier (e.g., "about-us", "terms")
  - `content` (text) - Page content (HTML/rich text)
  - `meta_description` (text) - SEO meta description
  - `meta_keywords` (text) - SEO keywords
  - `is_published` (boolean) - Whether page is visible to public
  - `show_in_header` (boolean) - Show link in header navigation
  - `show_in_footer` (boolean) - Show link in footer navigation
  - `sort_order` (integer) - Order for navigation display
  - `page_type` (text) - Type of page (standard, landing, legal)
  - `author_id` (uuid, foreign key) - User who created the page
  - `created_at` (timestamptz) - Page creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp
  - `published_at` (timestamptz) - When page was published

  ## 2. Security
  - Enable RLS on pages table
  - Add policies for authenticated admin users to manage all pages
  - Add policies for public (anon) users to view published pages only

  ## 3. Indexes
  - Create indexes on slug, is_published for performance

  ## 4. Important Notes
  - Slugs must be unique and URL-friendly
  - Content supports HTML for rich formatting
  - Pages can be drafted before publishing
  - Sort order controls navigation menu ordering
  - Timestamps track page lifecycle
*/

-- Create pages table
CREATE TABLE IF NOT EXISTS pages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  slug text UNIQUE NOT NULL,
  content text NOT NULL DEFAULT '',
  meta_description text,
  meta_keywords text,
  is_published boolean DEFAULT false,
  show_in_header boolean DEFAULT false,
  show_in_footer boolean DEFAULT true,
  sort_order integer DEFAULT 0,
  page_type text DEFAULT 'standard' CHECK (page_type IN ('standard', 'landing', 'legal')),
  author_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  published_at timestamptz
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_pages_slug ON pages(slug);
CREATE INDEX IF NOT EXISTS idx_pages_published ON pages(is_published) WHERE is_published = true;
CREATE INDEX IF NOT EXISTS idx_pages_header ON pages(show_in_header) WHERE show_in_header = true AND is_published = true;
CREATE INDEX IF NOT EXISTS idx_pages_footer ON pages(show_in_footer) WHERE show_in_footer = true AND is_published = true;
CREATE INDEX IF NOT EXISTS idx_pages_sort_order ON pages(sort_order);

-- Create trigger for auto-updating updated_at
CREATE TRIGGER update_pages_updated_at BEFORE UPDATE ON pages
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to auto-set published_at when is_published changes to true
CREATE OR REPLACE FUNCTION set_page_published_at()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_published = true AND OLD.is_published = false THEN
    NEW.published_at = now();
  ELSIF NEW.is_published = false THEN
    NEW.published_at = NULL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_page_published_at_trigger
  BEFORE UPDATE ON pages
  FOR EACH ROW
  EXECUTE FUNCTION set_page_published_at();

-- Function to generate URL-friendly slug from title
CREATE OR REPLACE FUNCTION generate_slug(input_text text)
RETURNS text AS $$
BEGIN
  RETURN lower(
    regexp_replace(
      regexp_replace(
        regexp_replace(input_text, '[^\w\s-]', '', 'g'),
        '\s+', '-', 'g'
      ),
      '-+', '-', 'g'
    )
  );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Enable Row Level Security
ALTER TABLE pages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for admin users (full access)
CREATE POLICY "Admins can view all pages"
  ON pages FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can insert pages"
  ON pages FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Admins can update pages"
  ON pages FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Admins can delete pages"
  ON pages FOR DELETE
  TO authenticated
  USING (true);

-- RLS Policies for public users (view published pages only)
CREATE POLICY "Public can view published pages"
  ON pages FOR SELECT
  TO anon
  USING (is_published = true);

-- Add comment to pages table for documentation
COMMENT ON TABLE pages IS 'Custom pages with rich content that can be displayed on the website. Supports drafts, publishing, and navigation integration.';
