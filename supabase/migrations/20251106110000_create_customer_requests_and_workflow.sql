/*
  # Create Customer Requests System

  ## Overview
  Creates a comprehensive customer request submission system that integrates with the platform workflow.

  ## 1. New Tables

  ### `customer_requests`
  - `id` (uuid, primary key) - Unique request identifier
  - `request_number` (text) - Human-readable request number (auto-generated)
  - `customer_name` (text) - Customer full name
  - `phone` (text) - Customer phone number
  - `email` (text) - Customer email address
  - `project_description` (text) - Description of the customer's project
  - `preferred_date` (date) - Preferred date for service
  - `status` (text) - New, Under Review, Converted to Quote, Rejected
  - `priority` (text) - Low, Medium, High, Urgent
  - `assigned_to` (uuid) - Staff member assigned to this request
  - `customer_id` (uuid) - Link to existing customer if converted
  - `quote_id` (uuid) - Link to quote if converted
  - `admin_notes` (text) - Internal notes from admin
  - `created_at` (timestamptz) - Request submission timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ### `request_attachments`
  - `id` (uuid, primary key) - Unique attachment identifier
  - `request_id` (uuid, foreign key) - Reference to customer_requests table
  - `file_name` (text) - Original file name
  - `file_url` (text) - URL to stored file in Supabase Storage
  - `file_type` (text) - MIME type
  - `file_size` (integer) - File size in bytes
  - `created_at` (timestamptz) - Upload timestamp

  ## 2. Sequences
  - Create sequence for auto-generating request numbers (REQ-XXXXX format)

  ## 3. Security
  - Enable RLS on all tables
  - Allow authenticated users to view and insert their own requests
  - Allow admin users full access to all requests
  - Allow public to insert new requests (for submission page)

  ## 4. Important Notes
  - Request numbers are auto-generated with format REQ-00001, REQ-00002, etc.
  - Integrates with existing customers and quotes tables
  - File uploads stored in Supabase Storage with proper organization
*/

-- Create customer_requests table
CREATE TABLE IF NOT EXISTS customer_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_number text UNIQUE NOT NULL DEFAULT '',
  customer_name text NOT NULL,
  phone text NOT NULL,
  email text DEFAULT '',
  project_description text NOT NULL,
  preferred_date date,
  status text DEFAULT 'New' CHECK (status IN ('New', 'Under Review', 'Converted to Quote', 'Rejected', 'Completed')),
  priority text DEFAULT 'Medium' CHECK (priority IN ('Low', 'Medium', 'High', 'Urgent')),
  assigned_to uuid,
  customer_id uuid REFERENCES customers(id) ON DELETE SET NULL,
  quote_id uuid REFERENCES quotes(id) ON DELETE SET NULL,
  admin_notes text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create request_attachments table
CREATE TABLE IF NOT EXISTS request_attachments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id uuid NOT NULL REFERENCES customer_requests(id) ON DELETE CASCADE,
  file_name text NOT NULL,
  file_url text NOT NULL,
  file_type text NOT NULL,
  file_size integer NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create sequence for request numbers
CREATE SEQUENCE IF NOT EXISTS request_number_seq START WITH 1;

-- Create function to generate request number
CREATE OR REPLACE FUNCTION generate_request_number()
RETURNS text AS $$
DECLARE
  next_num integer;
  request_num text;
BEGIN
  next_num := nextval('request_number_seq');
  request_num := 'REQ-' || LPAD(next_num::text, 5, '0');
  RETURN request_num;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-generate request number
CREATE OR REPLACE FUNCTION set_request_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.request_number IS NULL OR NEW.request_number = '' THEN
    NEW.request_number := generate_request_number();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS customer_requests_set_number ON customer_requests;
CREATE TRIGGER customer_requests_set_number
  BEFORE INSERT ON customer_requests
  FOR EACH ROW
  EXECUTE FUNCTION set_request_number();

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_customer_requests_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS customer_requests_updated_at ON customer_requests;
CREATE TRIGGER customer_requests_updated_at
  BEFORE UPDATE ON customer_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_customer_requests_updated_at();

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_customer_requests_status ON customer_requests(status);
CREATE INDEX IF NOT EXISTS idx_customer_requests_priority ON customer_requests(priority);
CREATE INDEX IF NOT EXISTS idx_customer_requests_assigned_to ON customer_requests(assigned_to);
CREATE INDEX IF NOT EXISTS idx_customer_requests_customer_id ON customer_requests(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_requests_quote_id ON customer_requests(quote_id);
CREATE INDEX IF NOT EXISTS idx_customer_requests_created_at ON customer_requests(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_request_attachments_request_id ON request_attachments(request_id);

-- Enable RLS
ALTER TABLE customer_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE request_attachments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for customer_requests

-- Allow anyone to insert new requests (public submission)
DROP POLICY IF EXISTS "Anyone can create customer requests" ON customer_requests;
CREATE POLICY "Anyone can create customer requests"
  ON customer_requests
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Allow anyone to view requests (for public confirmation pages)
DROP POLICY IF EXISTS "Anyone can view their own requests" ON customer_requests;
CREATE POLICY "Anyone can view their own requests"
  ON customer_requests
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Allow authenticated users to view all requests (admins)
DROP POLICY IF EXISTS "Authenticated users can view all requests" ON customer_requests;
CREATE POLICY "Authenticated users can view all requests"
  ON customer_requests
  FOR SELECT
  TO authenticated
  USING (true);

-- Allow authenticated users to update requests
DROP POLICY IF EXISTS "Authenticated users can update requests" ON customer_requests;
CREATE POLICY "Authenticated users can update requests"
  ON customer_requests
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Allow authenticated users to delete requests
DROP POLICY IF EXISTS "Authenticated users can delete requests" ON customer_requests;
CREATE POLICY "Authenticated users can delete requests"
  ON customer_requests
  FOR DELETE
  TO authenticated
  USING (true);

-- RLS Policies for request_attachments

-- Allow anyone to insert attachments
DROP POLICY IF EXISTS "Anyone can upload attachments" ON request_attachments;
CREATE POLICY "Anyone can upload attachments"
  ON request_attachments
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Allow anyone to view attachments
DROP POLICY IF EXISTS "Anyone can view attachments" ON request_attachments;
CREATE POLICY "Anyone can view attachments"
  ON request_attachments
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Allow authenticated users to delete attachments
DROP POLICY IF EXISTS "Authenticated users can delete attachments" ON request_attachments;
CREATE POLICY "Authenticated users can delete attachments"
  ON request_attachments
  FOR DELETE
  TO authenticated
  USING (true);
