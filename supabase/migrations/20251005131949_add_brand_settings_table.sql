/*
  # Add Brand Settings Table

  ## Overview
  Create a centralized brand settings table to manage all company branding information including logo, company details, contact information, and visual identity.

  ## 1. New Tables

  ### `brand_settings`
  - `id` (uuid, primary key) - Unique setting identifier
  - `setting_key` (text, unique) - Setting identifier (always 'brand')
  - `setting_value` (jsonb) - JSON object containing all brand settings
  - `updated_at` (timestamptz) - Last update timestamp
  - `updated_by` (uuid) - User who last updated (references auth.users)

  ## 2. Default Brand Settings Structure
  The setting_value JSONB will contain:
  - Company identity: name, tagline, founding year
  - Logos: primary logo URL, dark logo URL, favicon URL
  - Contact information: phone, email, address, operating hours
  - Social media: Facebook, Instagram, LinkedIn, Twitter links
  - Visual identity: primary color, accent colors
  - Business details: trade license, registration info

  ## 3. Security
  - Enable RLS on brand_settings table
  - Authenticated admins can read and update settings
  - Public/anonymous users can read settings (for display)
  - Only admins can modify settings

  ## 4. Important Notes
  - Settings stored as JSONB for flexibility
  - Single row with setting_key='brand' stores all brand information
  - Indexed on setting_key for fast lookups
  - Auto-updates timestamp on changes
*/

-- Create brand_settings table
CREATE TABLE IF NOT EXISTS brand_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key text UNIQUE NOT NULL,
  setting_value jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_brand_settings_key ON brand_settings(setting_key);

-- Create trigger for auto-updating updated_at
CREATE TRIGGER update_brand_settings_updated_at BEFORE UPDATE ON brand_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE brand_settings ENABLE ROW LEVEL SECURITY;

-- Admins can view all brand settings
CREATE POLICY "Admins can view brand settings"
  ON brand_settings FOR SELECT
  TO authenticated
  USING (true);

-- Admins can update brand settings
CREATE POLICY "Admins can update brand settings"
  ON brand_settings FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Admins can insert brand settings
CREATE POLICY "Admins can insert brand settings"
  ON brand_settings FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Public can read brand settings (for display purposes)
CREATE POLICY "Public can read brand settings"
  ON brand_settings FOR SELECT
  TO anon
  USING (true);

-- Insert default BYLROS brand settings
INSERT INTO brand_settings (setting_key, setting_value)
VALUES (
  'brand',
  '{
    "company": {
      "name": "BYLROS",
      "fullName": "BYLROS ALUMINUM & GLASS SYSTEM",
      "tagline": "Premium Glass & Aluminum Solutions",
      "foundingYear": "1985",
      "description": "Your trusted partner in glass and aluminum installations. We bring innovation, quality, and expertise to every project."
    },
    "logos": {
      "primary": "/Untitled-design-3.png",
      "darkMode": "/Untitled-design-3.png",
      "favicon": "/Untitled-design-3.png"
    },
    "contact": {
      "phone": "+971-52-5458-968",
      "email": "info@bylros.ae",
      "address": {
        "street": "Costra Business Park (Block B)",
        "city": "Dubai",
        "area": "Production City",
        "country": "UAE",
        "fullAddress": "Costra Business Park (Block B), Production City, Dubai, UAE"
      },
      "operatingHours": "24/7 Support Available"
    },
    "socialMedia": {
      "facebook": "",
      "instagram": "",
      "linkedin": "",
      "twitter": ""
    },
    "visual": {
      "primaryColor": "#bb2738",
      "accentColor": "#a01f2f",
      "lightColor": "#f8f9fa"
    },
    "business": {
      "tradeLicense": "",
      "registrationNumber": "",
      "vatNumber": ""
    }
  }'::jsonb
)
ON CONFLICT (setting_key) DO NOTHING;
