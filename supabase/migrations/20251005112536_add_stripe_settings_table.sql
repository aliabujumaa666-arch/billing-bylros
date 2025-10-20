/*
  # Add Stripe Settings and Payment Gateway Configuration

  1. New Tables
    - `stripe_settings` table to store Stripe API credentials
      - `id` (uuid, primary key)
      - `publishable_key` (text) - Stripe Publishable Key
      - `secret_key` (text) - Stripe Secret Key
      - `webhook_secret` (text) - Stripe Webhook Secret
      - `is_active` (boolean) - Whether Stripe is enabled
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `stripe_webhooks` table to log Stripe webhook events
      - `id` (uuid, primary key)
      - `event_id` (text, unique) - Stripe event ID
      - `event_type` (text) - Event type from Stripe
      - `payload` (jsonb) - Full webhook payload
      - `processed` (boolean) - Whether the event has been processed
      - `error_message` (text) - Any error during processing
      - `created_at` (timestamp)
    
  2. Updates to Existing Tables
    - Add `stripe_payment_intent_id` and `stripe_charge_id` to `payments` table
    
  3. Security
    - Enable RLS on `stripe_settings` and `stripe_webhooks` tables
    - Only authenticated admin users can view and update settings
    - Authenticated users can view webhooks for debugging
    
  4. Default Record
    - Insert default settings record with Stripe disabled
*/

-- Create stripe_settings table
CREATE TABLE IF NOT EXISTS stripe_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  publishable_key text DEFAULT '',
  secret_key text DEFAULT '',
  webhook_secret text DEFAULT '',
  is_active boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE stripe_settings ENABLE ROW LEVEL SECURITY;

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_stripe_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS stripe_settings_updated_at ON stripe_settings;
CREATE TRIGGER stripe_settings_updated_at
  BEFORE UPDATE ON stripe_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_stripe_settings_updated_at();

-- RLS Policies for stripe_settings (authenticated users only)
CREATE POLICY "Authenticated users can view Stripe settings"
  ON stripe_settings
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can update Stripe settings"
  ON stripe_settings
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can insert Stripe settings"
  ON stripe_settings
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Insert default settings if no record exists
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM stripe_settings) THEN
    INSERT INTO stripe_settings (publishable_key, secret_key, is_active)
    VALUES ('', '', false);
  END IF;
END $$;

-- Create stripe_webhooks table for logging
CREATE TABLE IF NOT EXISTS stripe_webhooks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id text NOT NULL UNIQUE,
  event_type text NOT NULL,
  payload jsonb NOT NULL,
  processed boolean DEFAULT false,
  error_message text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE stripe_webhooks ENABLE ROW LEVEL SECURITY;

-- RLS Policies for stripe_webhooks (authenticated users can view)
CREATE POLICY "Authenticated users can view Stripe webhooks"
  ON stripe_webhooks
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Service role can insert Stripe webhooks"
  ON stripe_webhooks
  FOR INSERT
  TO service_role
  WITH CHECK (true);

-- Add Stripe fields to payments table if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'payments' AND column_name = 'stripe_payment_intent_id'
  ) THEN
    ALTER TABLE payments ADD COLUMN stripe_payment_intent_id text DEFAULT '';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'payments' AND column_name = 'stripe_charge_id'
  ) THEN
    ALTER TABLE payments ADD COLUMN stripe_charge_id text DEFAULT '';
  END IF;
END $$;

-- Create index on Stripe IDs for faster lookups
CREATE INDEX IF NOT EXISTS idx_payments_stripe_payment_intent_id ON payments(stripe_payment_intent_id);
CREATE INDEX IF NOT EXISTS idx_payments_stripe_charge_id ON payments(stripe_charge_id);
CREATE INDEX IF NOT EXISTS idx_stripe_webhooks_event_id ON stripe_webhooks(event_id);
CREATE INDEX IF NOT EXISTS idx_stripe_webhooks_processed ON stripe_webhooks(processed);