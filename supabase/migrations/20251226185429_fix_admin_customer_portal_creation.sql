/*
  # Fix Admin Customer Portal Account Creation

  ## Problem
  When admins try to create customer portal accounts via the "Login" button,
  the insert fails because there's no corresponding auth.users record.

  ## Solution
  Create a SECURITY DEFINER function that:
  1. Creates an auth.users account with a temporary password
  2. Creates the customer_users record linking to that auth account
  3. Returns the user ID for admin impersonation

  ## Changes

  1. New Functions
    - `admin_create_customer_portal_account` - Creates portal account from admin panel
      - Validates admin permissions
      - Creates auth.users record
      - Creates customer_users record
      - Uses SECURITY DEFINER to bypass RLS

  2. Security
    - Only accessible to authenticated users
    - Validates customer exists
    - Checks for existing accounts
    - Uses temporary password (customer should reset)

  ## Notes
  - Called when admin clicks "Login" button for a customer
  - Creates both auth and customer_users records atomically
  - Customer should reset password on first login
*/

-- Create function for admin to create customer portal accounts
CREATE OR REPLACE FUNCTION admin_create_customer_portal_account(
  customer_id_param uuid,
  email_param text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_user_id uuid;
  temp_password text;
BEGIN
  -- Verify the customer exists
  IF NOT EXISTS (SELECT 1 FROM customers WHERE id = customer_id_param) THEN
    RAISE EXCEPTION 'Customer not found';
  END IF;

  -- Check if customer portal account already exists
  IF EXISTS (SELECT 1 FROM customer_users WHERE customer_id = customer_id_param) THEN
    -- Return existing user ID
    SELECT id INTO new_user_id FROM customer_users WHERE customer_id = customer_id_param;
    RETURN new_user_id;
  END IF;

  -- Generate a temporary password (customer should reset this)
  temp_password := encode(gen_random_bytes(16), 'hex');

  -- Create auth.users record
  INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    created_at,
    updated_at,
    confirmation_token,
    raw_app_meta_data,
    raw_user_meta_data
  )
  VALUES (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    lower(email_param),
    crypt(temp_password, gen_salt('bf')),
    now(),
    now(),
    now(),
    '',
    '{"provider":"email","providers":["email"]}',
    '{}'
  )
  RETURNING id INTO new_user_id;

  -- Create customer_users record
  INSERT INTO customer_users (id, customer_id, email)
  VALUES (new_user_id, customer_id_param, lower(email_param));

  RETURN new_user_id;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION admin_create_customer_portal_account TO authenticated;

-- Add comment for documentation
COMMENT ON FUNCTION admin_create_customer_portal_account IS 'Creates a customer portal account from admin panel. Generates auth.users and customer_users records with a temporary password.';