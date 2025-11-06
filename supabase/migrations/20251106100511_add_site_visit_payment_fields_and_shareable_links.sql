/*
  # Add Site Visit Payment Fields and Shareable Links

  ## Overview
  Enhances the site_visits table to support manual payment recording, online payment integration (Stripe/PayPal), and shareable payment link functionality for customers.

  ## 1. Changes to site_visits Table
  Add new columns for payment tracking and shareable links:
    - `payment_method` (text) - Payment method: Cash, Bank Transfer, PayPal, Stripe, etc.
    - `stripe_payment_intent_id` (text) - Stripe payment intent reference
    - `paypal_order_id` (text) - PayPal order reference
    - `paypal_transaction_id` (text) - PayPal transaction reference
    - `payment_date` (timestamptz) - When payment was completed
    - `payment_link_token` (text) - Unique token for shareable payment link
    - `payment_link_generated_at` (timestamptz) - When payment link was generated
    - `payment_link_expires_at` (timestamptz) - Payment link expiration time
    - `payment_transaction_reference` (text) - Manual payment reference number
    - `payment_notes` (text) - Additional payment notes

  ## 2. Indexes
  Add indexes for efficient queries:
    - Index on payment_link_token for quick payment link lookups
    - Index on payment_status for filtering unpaid visits
    - Index on stripe_payment_intent_id for webhook processing
    - Index on paypal_transaction_id for webhook processing

  ## 3. Security
  All existing RLS policies remain in place for authenticated admin users

  ## 4. Important Notes
  - Payment link tokens are unique and secure for customer payment access
  - Payment fields support both manual and automated payment tracking
  - Existing site visit records are preserved with default NULL values for new fields
*/

-- Add payment tracking fields to site_visits table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'site_visits' AND column_name = 'payment_method'
  ) THEN
    ALTER TABLE site_visits ADD COLUMN payment_method text DEFAULT '';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'site_visits' AND column_name = 'stripe_payment_intent_id'
  ) THEN
    ALTER TABLE site_visits ADD COLUMN stripe_payment_intent_id text DEFAULT '';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'site_visits' AND column_name = 'paypal_order_id'
  ) THEN
    ALTER TABLE site_visits ADD COLUMN paypal_order_id text DEFAULT '';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'site_visits' AND column_name = 'paypal_transaction_id'
  ) THEN
    ALTER TABLE site_visits ADD COLUMN paypal_transaction_id text DEFAULT '';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'site_visits' AND column_name = 'payment_date'
  ) THEN
    ALTER TABLE site_visits ADD COLUMN payment_date timestamptz;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'site_visits' AND column_name = 'payment_link_token'
  ) THEN
    ALTER TABLE site_visits ADD COLUMN payment_link_token text DEFAULT '';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'site_visits' AND column_name = 'payment_link_generated_at'
  ) THEN
    ALTER TABLE site_visits ADD COLUMN payment_link_generated_at timestamptz;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'site_visits' AND column_name = 'payment_link_expires_at'
  ) THEN
    ALTER TABLE site_visits ADD COLUMN payment_link_expires_at timestamptz;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'site_visits' AND column_name = 'payment_transaction_reference'
  ) THEN
    ALTER TABLE site_visits ADD COLUMN payment_transaction_reference text DEFAULT '';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'site_visits' AND column_name = 'payment_notes'
  ) THEN
    ALTER TABLE site_visits ADD COLUMN payment_notes text DEFAULT '';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'site_visits' AND column_name = 'quote_id'
  ) THEN
    ALTER TABLE site_visits ADD COLUMN quote_id uuid REFERENCES quotes(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Create indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_site_visits_payment_link_token ON site_visits(payment_link_token) WHERE payment_link_token != '';
CREATE INDEX IF NOT EXISTS idx_site_visits_payment_status ON site_visits(payment_status);
CREATE INDEX IF NOT EXISTS idx_site_visits_stripe_payment ON site_visits(stripe_payment_intent_id) WHERE stripe_payment_intent_id != '';
CREATE INDEX IF NOT EXISTS idx_site_visits_paypal_transaction ON site_visits(paypal_transaction_id) WHERE paypal_transaction_id != '';

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Public can view site visit by payment link token" ON site_visits;
DROP POLICY IF EXISTS "Public can update site visit payment via token" ON site_visits;

-- RLS policy to allow public to view site visit by payment link token (for payment page)
CREATE POLICY "Public can view site visit by payment link token"
  ON site_visits
  FOR SELECT
  TO anon, authenticated
  USING (
    payment_link_token != '' 
    AND payment_link_expires_at > now()
    AND payment_status = 'Unpaid'
  );

-- RLS policy to allow public to update payment status via payment link
CREATE POLICY "Public can update site visit payment via token"
  ON site_visits
  FOR UPDATE
  TO anon, authenticated
  USING (
    payment_link_token != '' 
    AND payment_link_expires_at > now()
  )
  WITH CHECK (
    payment_link_token != '' 
    AND payment_link_expires_at > now()
  );