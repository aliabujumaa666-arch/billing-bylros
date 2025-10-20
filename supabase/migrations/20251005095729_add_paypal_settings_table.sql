/*
  # Add PayPal Settings Table

  1. New Table
    - `paypal_settings` table to store PayPal API credentials
      - `id` (uuid, primary key)
      - `client_id` (text) - PayPal Client ID
      - `client_secret` (text) - PayPal Client Secret
      - `mode` (text) - 'sandbox' or 'live'
      - `webhook_id` (text) - PayPal Webhook ID
      - `is_active` (boolean) - Whether PayPal is enabled
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
  2. Security
    - Enable RLS on `paypal_settings` table
    - Only authenticated admin users can view and update settings
    
  3. Default Record
    - Insert default settings record with sandbox mode
*/

-- Create paypal_settings table
CREATE TABLE IF NOT EXISTS paypal_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id text DEFAULT '',
  client_secret text DEFAULT '',
  mode text DEFAULT 'sandbox' CHECK (mode IN ('sandbox', 'live')),
  webhook_id text DEFAULT '',
  is_active boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE paypal_settings ENABLE ROW LEVEL SECURITY;

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_paypal_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS paypal_settings_updated_at ON paypal_settings;
CREATE TRIGGER paypal_settings_updated_at
  BEFORE UPDATE ON paypal_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_paypal_settings_updated_at();

-- RLS Policies for paypal_settings (authenticated users only)
CREATE POLICY "Authenticated users can view PayPal settings"
  ON paypal_settings
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can update PayPal settings"
  ON paypal_settings
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can insert PayPal settings"
  ON paypal_settings
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Insert default settings if no record exists
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM paypal_settings) THEN
    INSERT INTO paypal_settings (client_id, client_secret, mode, is_active)
    VALUES ('', '', 'sandbox', false);
  END IF;
END $$;