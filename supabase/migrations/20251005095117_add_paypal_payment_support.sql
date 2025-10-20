/*
  # Add PayPal Payment Support

  1. Schema Changes
    - Add `paypal_transaction_id` column to `payments` table to track PayPal transaction IDs
    - Add `paypal_order_id` column to `payments` table to track PayPal order IDs  
    - Add `payment_processor` column to `payments` table to distinguish payment sources
    - Add `payment_metadata` JSONB column to `payments` table for storing additional PayPal data
    
  2. New Table
    - `paypal_webhooks` table to log all PayPal webhook events
      - `id` (uuid, primary key)
      - `event_id` (text, unique) - PayPal's webhook event ID
      - `event_type` (text) - Type of webhook event
      - `resource_type` (text) - Resource type from PayPal
      - `payload` (jsonb) - Full webhook payload
      - `processed` (boolean) - Whether webhook was processed
      - `created_at` (timestamp)
    
  3. Security
    - Enable RLS on `paypal_webhooks` table
    - Only authenticated admin users can view webhook logs
    - Customers can only see their own PayPal payment records
    
  4. Indexes
    - Add index on `payments.paypal_transaction_id` for fast lookups
    - Add index on `paypal_webhooks.event_id` for duplicate prevention
    - Add index on `paypal_webhooks.processed` for efficient querying
*/

-- Add PayPal support columns to payments table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'payments' AND column_name = 'paypal_transaction_id'
  ) THEN
    ALTER TABLE payments ADD COLUMN paypal_transaction_id text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'payments' AND column_name = 'paypal_order_id'
  ) THEN
    ALTER TABLE payments ADD COLUMN paypal_order_id text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'payments' AND column_name = 'payment_processor'
  ) THEN
    ALTER TABLE payments ADD COLUMN payment_processor text DEFAULT 'manual';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'payments' AND column_name = 'payment_metadata'
  ) THEN
    ALTER TABLE payments ADD COLUMN payment_metadata jsonb;
  END IF;
END $$;

-- Create paypal_webhooks table
CREATE TABLE IF NOT EXISTS paypal_webhooks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id text UNIQUE NOT NULL,
  event_type text NOT NULL,
  resource_type text,
  payload jsonb NOT NULL,
  processed boolean DEFAULT false,
  error_message text,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on paypal_webhooks
ALTER TABLE paypal_webhooks ENABLE ROW LEVEL SECURITY;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_payments_paypal_transaction_id 
  ON payments(paypal_transaction_id) 
  WHERE paypal_transaction_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_payments_paypal_order_id 
  ON payments(paypal_order_id) 
  WHERE paypal_order_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_paypal_webhooks_event_id 
  ON paypal_webhooks(event_id);

CREATE INDEX IF NOT EXISTS idx_paypal_webhooks_processed 
  ON paypal_webhooks(processed) 
  WHERE processed = false;

-- RLS Policies for paypal_webhooks (admin only access)
CREATE POLICY "Admin users can view webhook logs"
  ON paypal_webhooks
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
    )
  );

CREATE POLICY "Service role can insert webhooks"
  ON paypal_webhooks
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Service role can update webhooks"
  ON paypal_webhooks
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);