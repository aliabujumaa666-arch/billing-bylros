/*
  # Add Customer Portal Users and Access Control

  ## Overview
  This migration adds support for customer portal users who can log in and view their own data.

  ## 1. New Tables

  ### `customer_users`
  - `id` (uuid, primary key) - Links to auth.users
  - `customer_id` (uuid, foreign key) - Links to customers table
  - `email` (text, unique) - Customer email address
  - `created_at` (timestamptz) - Account creation timestamp
  - `last_login` (timestamptz) - Last login timestamp

  ## 2. Security Changes
  - Update RLS policies to allow customers to view only their own data
  - Add policies for customer_users table
  - Add policies for customers to view their quotes, orders, invoices, site visits

  ## 3. Important Notes
  - Customer users are separate from admin users in auth.users
  - Customers are linked via customer_id to ensure proper data isolation
  - All policies check authentication and ownership
*/

-- Create customer_users table to link auth users to customers
CREATE TABLE IF NOT EXISTS customer_users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  customer_id uuid NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now(),
  last_login timestamptz DEFAULT now(),
  UNIQUE(customer_id)
);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_customer_users_customer_id ON customer_users(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_users_email ON customer_users(email);

-- Enable RLS on customer_users
ALTER TABLE customer_users ENABLE ROW LEVEL SECURITY;

-- Customer users can view their own record
CREATE POLICY "Customer users can view own record"
  ON customer_users FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Customer users can update their last_login
CREATE POLICY "Customer users can update own record"
  ON customer_users FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Update customers table policies to allow customers to view their own data
CREATE POLICY "Customers can view own customer record"
  ON customers FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM customer_users
      WHERE customer_users.customer_id = customers.id
      AND customer_users.id = auth.uid()
    )
  );

CREATE POLICY "Customers can update own customer record"
  ON customers FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM customer_users
      WHERE customer_users.customer_id = customers.id
      AND customer_users.id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM customer_users
      WHERE customer_users.customer_id = customers.id
      AND customer_users.id = auth.uid()
    )
  );

-- Customer users can view their own quotes
CREATE POLICY "Customers can view own quotes"
  ON quotes FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM customer_users
      WHERE customer_users.customer_id = quotes.customer_id
      AND customer_users.id = auth.uid()
    )
  );

-- Customer users can view their own orders
CREATE POLICY "Customers can view own orders"
  ON orders FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM customer_users
      WHERE customer_users.customer_id = orders.customer_id
      AND customer_users.id = auth.uid()
    )
  );

-- Customer users can view their own invoices
CREATE POLICY "Customers can view own invoices"
  ON invoices FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM customer_users
      WHERE customer_users.customer_id = invoices.customer_id
      AND customer_users.id = auth.uid()
    )
  );

-- Customer users can view their own payments
CREATE POLICY "Customers can view own payments"
  ON payments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM customer_users cu
      JOIN invoices i ON i.customer_id = cu.customer_id
      WHERE i.id = payments.invoice_id
      AND cu.id = auth.uid()
    )
  );

-- Customer users can view their own site visits
CREATE POLICY "Customers can view own site visits"
  ON site_visits FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM customer_users
      WHERE customer_users.customer_id = site_visits.customer_id
      AND customer_users.id = auth.uid()
    )
  );

-- Customer users can view their own attachments
CREATE POLICY "Customers can view own attachments"
  ON attachments FOR SELECT
  TO authenticated
  USING (
    entity_type = 'customer' AND EXISTS (
      SELECT 1 FROM customer_users
      WHERE customer_users.customer_id = attachments.entity_id
      AND customer_users.id = auth.uid()
    )
    OR
    entity_type = 'quote' AND EXISTS (
      SELECT 1 FROM customer_users cu
      JOIN quotes q ON q.customer_id = cu.customer_id
      WHERE q.id = attachments.entity_id
      AND cu.id = auth.uid()
    )
    OR
    entity_type = 'order' AND EXISTS (
      SELECT 1 FROM customer_users cu
      JOIN orders o ON o.customer_id = cu.customer_id
      WHERE o.id = attachments.entity_id
      AND cu.id = auth.uid()
    )
    OR
    entity_type = 'invoice' AND EXISTS (
      SELECT 1 FROM customer_users cu
      JOIN invoices i ON i.customer_id = cu.customer_id
      WHERE i.id = attachments.entity_id
      AND cu.id = auth.uid()
    )
  );
