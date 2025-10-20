/*
  # Allow Customer Self-Registration

  This migration adds a policy to allow anonymous users to create customer records
  during self-registration through the customer portal.

  ## Changes
  
  1. Security
    - Add policy for anonymous users to insert customer records
    - This is required for the self-registration flow where users aren't authenticated yet
    - The policy is restricted to INSERT only - no read, update, or delete access
  
  ## Notes
  
  - The policy allows anonymous users to create their own customer record
  - Once created, they can sign up for a portal account linked to that customer
  - This is a secure pattern as anonymous users can only insert, not view or modify existing data
*/

-- Drop policy if it exists
DROP POLICY IF EXISTS "Allow anonymous customer registration" ON customers;

-- Allow anonymous users to create customer records during self-registration
CREATE POLICY "Allow anonymous customer registration"
  ON customers
  FOR INSERT
  TO anon
  WITH CHECK (true);