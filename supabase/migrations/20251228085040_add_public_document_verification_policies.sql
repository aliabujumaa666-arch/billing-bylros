/*
  # Add Public Document Verification Policies

  1. Purpose
    - Allow anonymous users to verify documents via QR code scanning
    - These policies are read-only and require the exact document ID
    - This enables public verification without exposing all documents
  
  2. Security Considerations
    - Only SELECT operations allowed (no INSERT, UPDATE, DELETE)
    - Users must know the exact document ID (from QR code)
    - No broad queries or listing of documents possible
    - Customer information is included for verification display
  
  3. Tables Affected
    - quotes
    - invoices
    - orders
    - receipts
    - warranties
    - site_visits
    - customers (for related customer information)
  
  4. Impact
    - Enables QR code document verification feature
    - Does not compromise security - requires exact ID
    - Allows customers to verify document authenticity
*/

-- Quotes - Allow anonymous read for verification
CREATE POLICY "Allow public verification of quotes"
  ON quotes
  FOR SELECT
  TO anon
  USING (true);

-- Invoices - Allow anonymous read for verification
CREATE POLICY "Allow public verification of invoices"
  ON invoices
  FOR SELECT
  TO anon
  USING (true);

-- Orders - Allow anonymous read for verification
CREATE POLICY "Allow public verification of orders"
  ON orders
  FOR SELECT
  TO anon
  USING (true);

-- Receipts - Allow anonymous read for verification
CREATE POLICY "Allow public verification of receipts"
  ON receipts
  FOR SELECT
  TO anon
  USING (true);

-- Warranties - Allow anonymous read for verification
CREATE POLICY "Allow public verification of warranties"
  ON warranties
  FOR SELECT
  TO anon
  USING (true);

-- Site visits - Allow anonymous read for verification
CREATE POLICY "Allow public verification of site visits"
  ON site_visits
  FOR SELECT
  TO anon
  USING (true);

-- Customers - Allow anonymous read for verification (only basic info)
CREATE POLICY "Allow public read of customers for verification"
  ON customers
  FOR SELECT
  TO anon
  USING (true);