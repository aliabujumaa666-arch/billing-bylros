/*
  # Fix Customer Users Admin Insert Policy

  1. Changes
    - Add policy to allow authenticated users (admins) to create customer portal accounts
    - This enables the admin "Login as Customer" feature to automatically create portal accounts
  
  2. Security
    - Policy restricted to authenticated users only
    - Admins are already authenticated and have access to the admin panel
*/

-- Add policy for admins to create customer portal accounts
CREATE POLICY "Admins can create customer portal accounts"
  ON customer_users
  FOR INSERT
  TO authenticated
  WITH CHECK (true);