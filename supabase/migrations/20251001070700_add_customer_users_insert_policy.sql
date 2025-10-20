/*
  # Allow Customer User Registration

  This migration adds a policy to allow authenticated users to create their own
  customer_users record during the registration process.

  ## Changes
  
  1. Security
    - Add INSERT policy for customer_users table
    - Users can only insert a record with their own auth.uid()
    - This prevents users from creating customer_user records for other users
  
  ## Notes
  
  - This policy is triggered after Supabase auth.signUp() succeeds
  - The user must insert a record where the id matches their auth.uid()
  - This ensures users can only link themselves to a customer, not impersonate others
*/

-- Drop policy if it exists
DROP POLICY IF EXISTS "Users can create own customer user record" ON customer_users;

-- Allow authenticated users to create their own customer_users record
CREATE POLICY "Users can create own customer user record"
  ON customer_users
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);