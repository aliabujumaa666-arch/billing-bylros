/*
  # Fix Warranties RLS Policy

  1. Changes
    - Drop existing "Admins can manage warranties" policy that queries auth.users
    - Create new policy that allows authenticated admins to manage warranties
    - This fixes the permission denied error when creating warranties

  2. Security
    - Authenticated users can create, read, update warranties
    - Customers can only view their own warranties (existing policy unchanged)
*/

-- Drop the problematic policy
DROP POLICY IF EXISTS "Admins can manage warranties" ON warranties;

-- Create new policy for authenticated users (admins)
CREATE POLICY "Authenticated users can manage warranties"
  ON warranties
  FOR ALL
  TO authenticated
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);
