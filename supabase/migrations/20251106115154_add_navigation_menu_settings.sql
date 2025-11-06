/*
  # Navigation Menu Settings

  ## Overview
  Adds navigation menu configuration to portal_settings to allow customization
  of header and footer menu items.

  ## Changes
  - Add header_menu and footer_menu JSON fields to portal_settings
  - These fields will store arrays of menu items with labels, links, and order

  ## Menu Item Structure
  {
    "label": "About Us",
    "url": "/page/about-us",
    "order": 0,
    "is_external": false,
    "open_new_tab": false
  }

  ## Important Notes
  - Menu items can link to internal pages or external URLs
  - Order determines display sequence
  - External links can optionally open in new tabs
*/

-- Add navigation menu fields to portal_settings if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'portal_settings' AND column_name = 'header_menu'
  ) THEN
    ALTER TABLE portal_settings ADD COLUMN header_menu jsonb DEFAULT '[]'::jsonb;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'portal_settings' AND column_name = 'footer_menu'
  ) THEN
    ALTER TABLE portal_settings ADD COLUMN footer_menu jsonb DEFAULT '[]'::jsonb;
  END IF;
END $$;

-- Add comment for documentation
COMMENT ON COLUMN portal_settings.header_menu IS 'Array of menu items to display in the header navigation. Each item contains label, url, order, is_external, and open_new_tab properties.';
COMMENT ON COLUMN portal_settings.footer_menu IS 'Array of menu items to display in the footer navigation. Each item contains label, url, order, is_external, and open_new_tab properties.';
