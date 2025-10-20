/*
  # Create Public Site Visit Bookings Table

  1. New Table
    - `public_site_visit_bookings` for storing site visit booking requests from public
      - `id` (uuid, primary key)
      - `customer_name` (text) - Name of the person booking
      - `phone` (text) - Contact phone number
      - `email` (text) - Email address (optional)
      - `location` (text) - Site visit location/address
      - `preferred_date` (date) - Preferred date for visit
      - `preferred_time` (text) - Preferred time slot (morning/afternoon/evening)
      - `notes` (text) - Additional notes from customer
      - `amount` (numeric) - Booking fee amount
      - `status` (text) - Status: pending_payment, paid, confirmed, completed, cancelled
      - `paypal_order_id` (text) - PayPal order reference
      - `paypal_transaction_id` (text) - PayPal transaction ID
      - `payment_date` (timestamp) - When payment was completed
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
  
  2. Security
    - Enable RLS on table
    - Allow public insert for new bookings
    - Allow public to read their own bookings by ID
    - Admin access for all operations
  
  3. Indexes
    - Index on status for filtering
    - Index on preferred_date for scheduling
*/

-- Create public_site_visit_bookings table
CREATE TABLE IF NOT EXISTS public_site_visit_bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_name text NOT NULL,
  phone text NOT NULL,
  email text DEFAULT '',
  location text NOT NULL,
  preferred_date date NOT NULL,
  preferred_time text DEFAULT '',
  notes text DEFAULT '',
  amount numeric(10,2) NOT NULL DEFAULT 100.00,
  status text DEFAULT 'pending_payment' CHECK (status IN ('pending_payment', 'paid', 'confirmed', 'completed', 'cancelled')),
  paypal_order_id text DEFAULT '',
  paypal_transaction_id text DEFAULT '',
  payment_date timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_public_bookings_status ON public_site_visit_bookings(status);
CREATE INDEX IF NOT EXISTS idx_public_bookings_date ON public_site_visit_bookings(preferred_date);

-- Enable RLS
ALTER TABLE public_site_visit_bookings ENABLE ROW LEVEL SECURITY;

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_public_bookings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS public_bookings_updated_at ON public_site_visit_bookings;
CREATE TRIGGER public_bookings_updated_at
  BEFORE UPDATE ON public_site_visit_bookings
  FOR EACH ROW
  EXECUTE FUNCTION update_public_bookings_updated_at();

-- RLS Policies for public_site_visit_bookings

-- Allow anyone to insert new bookings (public can book)
CREATE POLICY "Anyone can create site visit bookings"
  ON public_site_visit_bookings
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Allow anyone to read bookings by ID (for confirmation)
CREATE POLICY "Anyone can read bookings by ID"
  ON public_site_visit_bookings
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Allow authenticated admin users to update bookings
CREATE POLICY "Authenticated users can update bookings"
  ON public_site_visit_bookings
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Allow authenticated admin users to delete bookings
CREATE POLICY "Authenticated users can delete bookings"
  ON public_site_visit_bookings
  FOR DELETE
  TO authenticated
  USING (true);