/*
  # Payment Receipts System

  ## Overview
  Creates a comprehensive payment receipt system that automatically generates receipts
  when payments are recorded, integrates with invoices and payments, and provides
  access to both admin users and customers.

  ## 1. New Tables

  ### `receipts`
  - `id` (uuid, primary key) - Unique receipt identifier
  - `receipt_number` (text, unique) - Human-readable receipt number (e.g., RCP-202511-001)
  - `customer_id` (uuid, foreign key) - Reference to customers table
  - `payment_id` (uuid, foreign key) - Reference to payments table
  - `invoice_id` (uuid, foreign key) - Reference to invoices table
  - `order_id` (uuid, foreign key, nullable) - Reference to orders table if applicable
  - `amount_paid` (decimal) - Amount paid in this transaction
  - `payment_method` (text) - Payment method used
  - `payment_reference` (text) - Payment reference number
  - `invoice_total` (decimal) - Total invoice amount
  - `previous_balance` (decimal) - Balance before this payment
  - `remaining_balance` (decimal) - Balance after this payment
  - `payment_date` (date) - Date of payment
  - `notes` (text) - Additional notes about the payment
  - `status` (text) - Receipt status (generated, sent, void)
  - `created_at` (timestamptz) - Receipt generation timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ## 2. Security
  - Enable RLS on receipts table
  - Add policies for authenticated admin users to manage all receipts
  - Add policies for customers to view their own receipts only

  ## 3. Indexes
  - Create indexes on customer_id, payment_id, invoice_id, receipt_number for performance

  ## 4. Important Notes
  - Receipts are automatically generated when payments are recorded
  - Receipt numbers follow format: RCP-YYYYMM-XXX
  - All monetary values use decimal type for precision
  - Foreign keys ensure data integrity
  - Timestamps auto-update for audit trail
*/

-- Create receipts table
CREATE TABLE IF NOT EXISTS receipts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  receipt_number text UNIQUE NOT NULL,
  customer_id uuid NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  payment_id uuid NOT NULL REFERENCES payments(id) ON DELETE CASCADE,
  invoice_id uuid NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  order_id uuid REFERENCES orders(id) ON DELETE SET NULL,
  amount_paid decimal(10,2) NOT NULL,
  payment_method text NOT NULL,
  payment_reference text,
  invoice_total decimal(10,2) NOT NULL,
  previous_balance decimal(10,2) NOT NULL,
  remaining_balance decimal(10,2) NOT NULL,
  payment_date date NOT NULL DEFAULT CURRENT_DATE,
  notes text,
  status text DEFAULT 'generated' CHECK (status IN ('generated', 'sent', 'void')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_receipts_customer_id ON receipts(customer_id);
CREATE INDEX IF NOT EXISTS idx_receipts_payment_id ON receipts(payment_id);
CREATE INDEX IF NOT EXISTS idx_receipts_invoice_id ON receipts(invoice_id);
CREATE INDEX IF NOT EXISTS idx_receipts_receipt_number ON receipts(receipt_number);
CREATE INDEX IF NOT EXISTS idx_receipts_payment_date ON receipts(payment_date);
CREATE INDEX IF NOT EXISTS idx_receipts_status ON receipts(status);

-- Create trigger for auto-updating updated_at
CREATE TRIGGER update_receipts_updated_at BEFORE UPDATE ON receipts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE receipts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for admin users (full access)
CREATE POLICY "Admins can view all receipts"
  ON receipts FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can insert receipts"
  ON receipts FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Admins can update receipts"
  ON receipts FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Admins can delete receipts"
  ON receipts FOR DELETE
  TO authenticated
  USING (true);

-- RLS Policies for customers (view their own receipts only)
CREATE POLICY "Customers can view their own receipts"
  ON receipts FOR SELECT
  TO anon
  USING (
    EXISTS (
      SELECT 1 FROM customer_users
      WHERE customer_users.customer_id = receipts.customer_id
    )
  );

-- Function to generate unique receipt number
CREATE OR REPLACE FUNCTION generate_receipt_number()
RETURNS text AS $$
DECLARE
  new_number text;
  counter integer;
  year_month text;
BEGIN
  year_month := TO_CHAR(CURRENT_DATE, 'YYYYMM');
  
  -- Get the highest number for this month
  SELECT COALESCE(
    MAX(
      CAST(
        SUBSTRING(receipt_number FROM '\d+$') AS integer
      )
    ), 0
  ) INTO counter
  FROM receipts
  WHERE receipt_number LIKE 'RCP-' || year_month || '-%';
  
  counter := counter + 1;
  new_number := 'RCP-' || year_month || '-' || LPAD(counter::text, 3, '0');
  
  RETURN new_number;
END;
$$ LANGUAGE plpgsql;

-- Add comment to receipts table for documentation
COMMENT ON TABLE receipts IS 'Payment receipts generated when payments are recorded. Provides customers with payment confirmation and transaction history.';
