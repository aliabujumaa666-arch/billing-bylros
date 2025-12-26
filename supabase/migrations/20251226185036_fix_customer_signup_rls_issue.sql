/*
  # Fix Customer Signup RLS Issue

  ## Problem
  When customers sign up, the auth session isn't fully established before attempting
  to insert into customer_users table, causing RLS policy failures.

  ## Solution
  Create a SECURITY DEFINER function that bypasses RLS for the initial customer_users
  insert during registration.

  ## Changes

  1. New Functions
    - `create_customer_portal_user` - Safely creates customer portal user records
      - Validates user exists in auth.users
      - Inserts into customer_users with elevated privileges
      - Uses SECURITY DEFINER to bypass RLS

  2. Security
    - Function only accessible to authenticated users
    - Validates user_id exists in auth system
    - Uses ON CONFLICT to handle duplicate inserts gracefully
    - Maintains data integrity with proper validation

  ## Notes
  - This function is called after auth.signUp() succeeds
  - It bypasses RLS timing issues by running with elevated privileges
  - The function validates all inputs before insertion
*/

-- Create function to safely create customer portal user
CREATE OR REPLACE FUNCTION create_customer_portal_user(
  user_id uuid,
  customer_id_param uuid,
  email_param text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Verify the user exists in auth.users
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = user_id) THEN
    RAISE EXCEPTION 'User not found in auth system';
  END IF;

  -- Verify the customer exists
  IF NOT EXISTS (SELECT 1 FROM customers WHERE id = customer_id_param) THEN
    RAISE EXCEPTION 'Customer not found';
  END IF;

  -- Insert into customer_users
  INSERT INTO customer_users (id, customer_id, email)
  VALUES (user_id, customer_id_param, email_param)
  ON CONFLICT (id) DO NOTHING;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION create_customer_portal_user TO authenticated;

-- Add comment for documentation
COMMENT ON FUNCTION create_customer_portal_user IS 'Creates a customer portal user account. Used during customer self-registration to bypass RLS timing issues.';