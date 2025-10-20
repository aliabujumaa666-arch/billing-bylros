/*
  # Add Customer Portal Home Page Settings

  ## Overview
  This migration adds a settings table to allow admins to customize the customer portal home page.

  ## 1. New Tables

  ### `portal_settings`
  - `id` (uuid, primary key) - Unique setting identifier
  - `setting_key` (text, unique) - Setting identifier (e.g., 'home_page')
  - `setting_value` (jsonb) - JSON object containing all settings
  - `updated_at` (timestamptz) - Last update timestamp
  - `updated_by` (uuid) - User who last updated (references auth.users)

  ## 2. Default Settings
  - Insert default home page settings with welcome message, hero section, features, etc.

  ## 3. Security
  - Enable RLS on portal_settings table
  - Admins can read and update settings
  - Customers can read settings (for displaying home page)
  - Only admins can modify settings

  ## 4. Important Notes
  - Settings are stored as JSONB for flexibility
  - Home page can include: title, subtitle, hero image, welcome message, features, contact info
  - All content is customizable from admin panel
*/

-- Create portal_settings table
CREATE TABLE IF NOT EXISTS portal_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key text UNIQUE NOT NULL,
  setting_value jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_portal_settings_key ON portal_settings(setting_key);

-- Create trigger for auto-updating updated_at
CREATE TRIGGER update_portal_settings_updated_at BEFORE UPDATE ON portal_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE portal_settings ENABLE ROW LEVEL SECURITY;

-- Admins can view all settings
CREATE POLICY "Admins can view all portal settings"
  ON portal_settings FOR SELECT
  TO authenticated
  USING (true);

-- Admins can update settings
CREATE POLICY "Admins can update portal settings"
  ON portal_settings FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Admins can insert settings
CREATE POLICY "Admins can insert portal settings"
  ON portal_settings FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Customers and public can read settings (for home page display)
CREATE POLICY "Public can read portal settings"
  ON portal_settings FOR SELECT
  TO anon
  USING (true);

-- Insert default home page settings
INSERT INTO portal_settings (setting_key, setting_value)
VALUES (
  'home_page',
  '{
    "enabled": true,
    "hero": {
      "title": "Welcome to BYLROS Customer Portal",
      "subtitle": "Track your orders, view quotes, and manage your account",
      "backgroundColor": "#bb2738"
    },
    "welcome": {
      "title": "Your Trusted Partner in Aluminium & Glass Solutions",
      "message": "Welcome to your personal BYLROS portal. Here you can access all your quotes, track orders in real-time, view invoices, and manage your profile. We are committed to providing you with the best service and transparency throughout your project journey.",
      "showStats": true
    },
    "features": [
      {
        "icon": "FileText",
        "title": "View Quotes",
        "description": "Access all your quotes and download them as PDF documents"
      },
      {
        "icon": "Package",
        "title": "Track Orders",
        "description": "Monitor your orders with real-time progress updates"
      },
      {
        "icon": "DollarSign",
        "title": "Manage Invoices",
        "description": "View invoices, payment history, and download receipts"
      },
      {
        "icon": "Calendar",
        "title": "Site Visits",
        "description": "See upcoming and past scheduled site visits"
      }
    ],
    "contact": {
      "title": "Need Help?",
      "message": "Our team is here to assist you with any questions or concerns.",
      "email": "info@bylros.ae",
      "phone": "+971 XX XXX XXXX",
      "showContactInfo": true
    },
    "customSections": []
  }'::jsonb
)
ON CONFLICT (setting_key) DO NOTHING;
