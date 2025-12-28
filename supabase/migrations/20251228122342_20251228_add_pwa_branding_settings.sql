/*
  # Add PWA Branding Settings

  ## Overview
  Add Progressive Web App (PWA) branding configuration to the brand_settings table to allow customization of app name, icons, theme colors, and display settings.

  ## Changes
  1. Update the brand_settings default structure to include PWA settings
  2. Add pwa object with:
     - appName: Full app name shown during installation
     - shortName: Short name shown on home screen
     - description: App description
     - themeColor: Theme color for browser UI
     - backgroundColor: Background color for splash screen
     - icon192: Path to 192x192 icon
     - icon512: Path to 512x512 icon

  ## Important Notes
  - Existing brand_settings will be updated with default PWA values
  - PWA icons should be uploaded to storage and paths configured
  - Theme color will be used in meta tags and manifest
*/

-- Update existing brand settings to include PWA configuration
UPDATE brand_settings
SET setting_value = setting_value || jsonb_build_object(
  'pwa', jsonb_build_object(
    'appName', 'BYLROS Customer Operations Platform',
    'shortName', 'BYLROS',
    'description', 'Complete customer operations and business management platform',
    'themeColor', '#0ea5e9',
    'backgroundColor', '#ffffff',
    'icon192', '/icon-192.png',
    'icon512', '/icon-512.png'
  )
)
WHERE setting_key = 'brand'
AND NOT (setting_value ? 'pwa');
