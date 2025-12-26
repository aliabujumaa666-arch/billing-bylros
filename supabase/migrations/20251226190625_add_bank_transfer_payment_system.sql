/*
  # Add Bank Transfer Payment System

  1. New Tables
    - `bank_transfer_settings`
      - `id` (uuid, primary key)
      - `bank_name` (text) - Name of the bank
      - `account_holder_name` (text) - Account holder name
      - `account_number` (text) - Bank account number
      - `iban` (text) - International Bank Account Number
      - `swift_bic` (text) - SWIFT/BIC code
      - `branch_name` (text) - Branch name
      - `branch_code` (text) - Branch code
      - `currency` (text) - Currency (e.g., AED, USD)
      - `payment_instructions` (text) - Custom instructions for customers
      - `is_active` (boolean) - Whether bank transfer is enabled
      - `require_proof_upload` (boolean) - Whether proof of payment is required
      - `verification_wait_time` (text) - Expected wait time for verification
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Changes to Existing Tables
    - Add `payment_proof_url` to payments table for storing uploaded proof
    - Add `payment_status` to payments table (pending, verified, rejected)
    - Add `verified_by` to payments table
    - Add `verified_at` to payments table
    - Add `verification_notes` to payments table

  3. Security
    - Enable RLS on bank_transfer_settings table
    - Authenticated users can read bank transfer settings
    - Only authenticated admin users can modify bank transfer settings
    - Customers can update payments with proof of payment
    - Only admins can verify payments
*/

-- Create bank_transfer_settings table
CREATE TABLE IF NOT EXISTS bank_transfer_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bank_name text NOT NULL DEFAULT '',
  account_holder_name text NOT NULL DEFAULT '',
  account_number text NOT NULL DEFAULT '',
  iban text DEFAULT '',
  swift_bic text DEFAULT '',
  branch_name text DEFAULT '',
  branch_code text DEFAULT '',
  currency text DEFAULT 'AED',
  payment_instructions text DEFAULT '',
  is_active boolean DEFAULT false,
  require_proof_upload boolean DEFAULT true,
  verification_wait_time text DEFAULT '1-2 business days',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add payment proof and verification fields to payments table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'payments' AND column_name = 'payment_proof_url'
  ) THEN
    ALTER TABLE payments ADD COLUMN payment_proof_url text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'payments' AND column_name = 'payment_status'
  ) THEN
    ALTER TABLE payments ADD COLUMN payment_status text DEFAULT 'verified' CHECK (payment_status IN ('pending', 'verified', 'rejected'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'payments' AND column_name = 'verified_by'
  ) THEN
    ALTER TABLE payments ADD COLUMN verified_by uuid REFERENCES auth.users(id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'payments' AND column_name = 'verified_at'
  ) THEN
    ALTER TABLE payments ADD COLUMN verified_at timestamptz;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'payments' AND column_name = 'verification_notes'
  ) THEN
    ALTER TABLE payments ADD COLUMN verification_notes text;
  END IF;
END $$;

-- Enable RLS
ALTER TABLE bank_transfer_settings ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Authenticated users can read bank transfer settings" ON bank_transfer_settings;
DROP POLICY IF EXISTS "Admins can insert bank transfer settings" ON bank_transfer_settings;
DROP POLICY IF EXISTS "Admins can update bank transfer settings" ON bank_transfer_settings;
DROP POLICY IF EXISTS "Admins can delete bank transfer settings" ON bank_transfer_settings;
DROP POLICY IF EXISTS "Anonymous can read active bank transfer settings" ON bank_transfer_settings;

-- RLS Policies for bank_transfer_settings
CREATE POLICY "Authenticated users can read bank transfer settings"
  ON bank_transfer_settings FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Anonymous can read active bank transfer settings"
  ON bank_transfer_settings FOR SELECT
  TO anon
  USING (is_active = true);

CREATE POLICY "Admins can insert bank transfer settings"
  ON bank_transfer_settings FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Admins can update bank transfer settings"
  ON bank_transfer_settings FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Admins can delete bank transfer settings"
  ON bank_transfer_settings FOR DELETE
  TO authenticated
  USING (true);

-- Insert default bank transfer settings
INSERT INTO bank_transfer_settings (
  bank_name,
  account_holder_name,
  account_number,
  currency,
  payment_instructions,
  is_active
) VALUES (
  'Your Bank Name',
  'Your Company Name',
  'XXXX-XXXX-XXXX',
  'AED',
  'Please use your invoice number as the payment reference.',
  false
) ON CONFLICT DO NOTHING;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(payment_status) WHERE payment_status = 'pending';
CREATE INDEX IF NOT EXISTS idx_payments_method ON payments(payment_method);
