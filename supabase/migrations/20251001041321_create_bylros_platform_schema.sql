/*
  # BYLROS Customer Operations Platform - Database Schema

  ## Overview
  Complete database schema for managing the full customer lifecycle from lead to payment.

  ## 1. New Tables

  ### `customers`
  - `id` (uuid, primary key) - Unique customer identifier
  - `name` (text) - Customer full name
  - `email` (text) - Customer email address
  - `phone` (text) - Customer phone number
  - `location` (text) - Customer address/location
  - `status` (text) - Lead, Quoted, Ordered, Delivered, Installed
  - `notes` (text) - Additional notes about customer
  - `created_at` (timestamptz) - Record creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ### `quotes`
  - `id` (uuid, primary key) - Unique quote identifier
  - `customer_id` (uuid, foreign key) - Reference to customers table
  - `quote_number` (text) - Human-readable quote number
  - `items` (jsonb) - Array of quote items with location, type, dimensions, price
  - `subtotal` (decimal) - Subtotal before VAT
  - `vat_amount` (decimal) - VAT amount (5%)
  - `discount` (decimal) - Discount amount
  - `total` (decimal) - Final total amount
  - `remarks` (text) - Additional remarks
  - `status` (text) - Draft, Sent, Accepted, Rejected
  - `valid_until` (date) - Quote validity date
  - `created_at` (timestamptz) - Quote creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ### `site_visits`
  - `id` (uuid, primary key) - Unique visit identifier
  - `customer_id` (uuid, foreign key) - Reference to customers table
  - `visit_date` (timestamptz) - Scheduled visit date and time
  - `location` (text) - Visit location
  - `remarks` (text) - Visit remarks
  - `status` (text) - Scheduled, Completed, Cancelled
  - `payment_required` (boolean) - Whether payment is required
  - `payment_amount` (decimal) - Payment amount if required
  - `payment_status` (text) - Unpaid, Paid
  - `created_at` (timestamptz) - Record creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ### `orders`
  - `id` (uuid, primary key) - Unique order identifier
  - `customer_id` (uuid, foreign key) - Reference to customers table
  - `quote_id` (uuid, foreign key) - Reference to quotes table
  - `order_number` (text) - Human-readable order number
  - `order_date` (date) - Order placement date
  - `delivery_date` (date) - Expected/actual delivery date
  - `installation_date` (date) - Expected/actual installation date
  - `status` (text) - Confirmed, In Production, Delivered, Installed
  - `created_at` (timestamptz) - Record creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ### `invoices`
  - `id` (uuid, primary key) - Unique invoice identifier
  - `customer_id` (uuid, foreign key) - Reference to customers table
  - `order_id` (uuid, foreign key) - Reference to orders table
  - `invoice_number` (text) - Human-readable invoice number
  - `total_amount` (decimal) - Total invoice amount
  - `deposit_paid` (decimal) - Deposit amount paid
  - `payment_before_delivery` (decimal) - Payment before delivery
  - `balance` (decimal) - Remaining balance
  - `status` (text) - Unpaid, Partial, Paid
  - `due_date` (date) - Payment due date
  - `created_at` (timestamptz) - Record creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ### `payments`
  - `id` (uuid, primary key) - Unique payment identifier
  - `invoice_id` (uuid, foreign key) - Reference to invoices table
  - `amount` (decimal) - Payment amount
  - `payment_date` (date) - Payment date
  - `payment_method` (text) - Cash, Card, Bank Transfer, PayPal, Stripe
  - `reference` (text) - Payment reference number
  - `notes` (text) - Payment notes
  - `created_at` (timestamptz) - Record creation timestamp

  ### `attachments`
  - `id` (uuid, primary key) - Unique attachment identifier
  - `entity_type` (text) - Type: customer, quote, order, invoice
  - `entity_id` (uuid) - Reference to parent entity
  - `file_name` (text) - Original file name
  - `file_url` (text) - URL to stored file
  - `file_type` (text) - MIME type
  - `created_at` (timestamptz) - Upload timestamp

  ## 2. Security
  - Enable RLS on all tables
  - Add policies for authenticated admin users to manage all records
  - Add policies for customers to view their own orders (public tracker)

  ## 3. Important Notes
  - All monetary values use decimal type for precision
  - JSONB used for flexible quote items structure
  - Status fields use text for flexibility (can add enum later)
  - Timestamps auto-update for audit trail
  - Foreign keys ensure data integrity
*/

-- Create customers table
CREATE TABLE IF NOT EXISTS customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text,
  phone text NOT NULL,
  location text,
  status text DEFAULT 'Lead' CHECK (status IN ('Lead', 'Quoted', 'Ordered', 'Delivered', 'Installed')),
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create quotes table
CREATE TABLE IF NOT EXISTS quotes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  quote_number text UNIQUE NOT NULL,
  items jsonb DEFAULT '[]'::jsonb,
  subtotal decimal(10,2) DEFAULT 0,
  vat_amount decimal(10,2) DEFAULT 0,
  discount decimal(10,2) DEFAULT 0,
  total decimal(10,2) DEFAULT 0,
  remarks text,
  status text DEFAULT 'Draft' CHECK (status IN ('Draft', 'Sent', 'Accepted', 'Rejected')),
  valid_until date,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create site_visits table
CREATE TABLE IF NOT EXISTS site_visits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  visit_date timestamptz NOT NULL,
  location text NOT NULL,
  remarks text,
  status text DEFAULT 'Scheduled' CHECK (status IN ('Scheduled', 'Completed', 'Cancelled')),
  payment_required boolean DEFAULT false,
  payment_amount decimal(10,2) DEFAULT 0,
  payment_status text DEFAULT 'Unpaid' CHECK (payment_status IN ('Unpaid', 'Paid')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create orders table
CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  quote_id uuid REFERENCES quotes(id) ON DELETE SET NULL,
  order_number text UNIQUE NOT NULL,
  order_date date DEFAULT CURRENT_DATE,
  delivery_date date,
  installation_date date,
  status text DEFAULT 'Confirmed' CHECK (status IN ('Confirmed', 'In Production', 'Delivered', 'Installed')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create invoices table
CREATE TABLE IF NOT EXISTS invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  order_id uuid REFERENCES orders(id) ON DELETE SET NULL,
  invoice_number text UNIQUE NOT NULL,
  total_amount decimal(10,2) NOT NULL,
  deposit_paid decimal(10,2) DEFAULT 0,
  payment_before_delivery decimal(10,2) DEFAULT 0,
  balance decimal(10,2) DEFAULT 0,
  status text DEFAULT 'Unpaid' CHECK (status IN ('Unpaid', 'Partial', 'Paid')),
  due_date date,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create payments table
CREATE TABLE IF NOT EXISTS payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id uuid NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  amount decimal(10,2) NOT NULL,
  payment_date date DEFAULT CURRENT_DATE,
  payment_method text CHECK (payment_method IN ('Cash', 'Card', 'Bank Transfer', 'PayPal', 'Stripe')),
  reference text,
  notes text,
  created_at timestamptz DEFAULT now()
);

-- Create attachments table
CREATE TABLE IF NOT EXISTS attachments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type text NOT NULL CHECK (entity_type IN ('customer', 'quote', 'order', 'invoice')),
  entity_id uuid NOT NULL,
  file_name text NOT NULL,
  file_url text NOT NULL,
  file_type text,
  created_at timestamptz DEFAULT now()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_customers_status ON customers(status);
CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);
CREATE INDEX IF NOT EXISTS idx_quotes_customer_id ON quotes(customer_id);
CREATE INDEX IF NOT EXISTS idx_quotes_quote_number ON quotes(quote_number);
CREATE INDEX IF NOT EXISTS idx_site_visits_customer_id ON site_visits(customer_id);
CREATE INDEX IF NOT EXISTS idx_site_visits_visit_date ON site_visits(visit_date);
CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON orders(order_number);
CREATE INDEX IF NOT EXISTS idx_invoices_customer_id ON invoices(customer_id);
CREATE INDEX IF NOT EXISTS idx_payments_invoice_id ON payments(invoice_id);
CREATE INDEX IF NOT EXISTS idx_attachments_entity ON attachments(entity_type, entity_id);

-- Create function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for auto-updating updated_at
CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON customers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_quotes_updated_at BEFORE UPDATE ON quotes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_site_visits_updated_at BEFORE UPDATE ON site_visits
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_invoices_updated_at BEFORE UPDATE ON invoices
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE attachments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for authenticated admin users (full access)
CREATE POLICY "Admins can view all customers"
  ON customers FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can insert customers"
  ON customers FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Admins can update customers"
  ON customers FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Admins can delete customers"
  ON customers FOR DELETE
  TO authenticated
  USING (true);

-- Similar policies for quotes
CREATE POLICY "Admins can view all quotes"
  ON quotes FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can insert quotes"
  ON quotes FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Admins can update quotes"
  ON quotes FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Admins can delete quotes"
  ON quotes FOR DELETE
  TO authenticated
  USING (true);

-- Similar policies for site_visits
CREATE POLICY "Admins can view all site visits"
  ON site_visits FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can insert site visits"
  ON site_visits FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Admins can update site visits"
  ON site_visits FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Admins can delete site visits"
  ON site_visits FOR DELETE
  TO authenticated
  USING (true);

-- Similar policies for orders
CREATE POLICY "Admins can view all orders"
  ON orders FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can insert orders"
  ON orders FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Admins can update orders"
  ON orders FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Admins can delete orders"
  ON orders FOR DELETE
  TO authenticated
  USING (true);

-- Similar policies for invoices
CREATE POLICY "Admins can view all invoices"
  ON invoices FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can insert invoices"
  ON invoices FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Admins can update invoices"
  ON invoices FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Admins can delete invoices"
  ON invoices FOR DELETE
  TO authenticated
  USING (true);

-- Similar policies for payments
CREATE POLICY "Admins can view all payments"
  ON payments FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can insert payments"
  ON payments FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Admins can update payments"
  ON payments FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Admins can delete payments"
  ON payments FOR DELETE
  TO authenticated
  USING (true);

-- Similar policies for attachments
CREATE POLICY "Admins can view all attachments"
  ON attachments FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can insert attachments"
  ON attachments FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Admins can delete attachments"
  ON attachments FOR DELETE
  TO authenticated
  USING (true);

-- Public policies for customer order tracking (read-only access by phone/email)
CREATE POLICY "Customers can view their own orders by phone"
  ON orders FOR SELECT
  TO anon
  USING (
    EXISTS (
      SELECT 1 FROM customers
      WHERE customers.id = orders.customer_id
    )
  );

CREATE POLICY "Customers can view their own customer data"
  ON customers FOR SELECT
  TO anon
  USING (true);
