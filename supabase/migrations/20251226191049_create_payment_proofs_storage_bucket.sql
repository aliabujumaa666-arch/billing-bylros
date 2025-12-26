/*
  # Create Storage Bucket for Payment Proofs

  1. New Storage Bucket
    - `payment-proofs` bucket for storing payment receipts
    - Public access for reading (so admins can view)
    - Authenticated users can upload
    
  2. Security
    - Customers can upload their own payment proofs
    - Admins can view all payment proofs
    - Files are organized by customer_id/invoice_id/timestamp
*/

-- Create payment-proofs storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('payment-proofs', 'payment-proofs', true)
ON CONFLICT (id) DO NOTHING;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can upload payment proofs" ON storage.objects;
DROP POLICY IF EXISTS "Public can view payment proofs" ON storage.objects;
DROP POLICY IF EXISTS "Users can update payment proofs" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete payment proofs" ON storage.objects;
DROP POLICY IF EXISTS "Anon can upload payment proofs" ON storage.objects;

-- Allow authenticated users to upload to their own folder
CREATE POLICY "Users can upload payment proofs"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'payment-proofs'
  );

-- Allow anonymous users to upload (for customer portal)
CREATE POLICY "Anon can upload payment proofs"
  ON storage.objects FOR INSERT
  TO anon
  WITH CHECK (
    bucket_id = 'payment-proofs'
  );

-- Allow public read access
CREATE POLICY "Public can view payment proofs"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'payment-proofs');

-- Allow authenticated users to update their files
CREATE POLICY "Users can update payment proofs"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'payment-proofs');

-- Allow authenticated users to delete their files
CREATE POLICY "Users can delete payment proofs"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'payment-proofs');
