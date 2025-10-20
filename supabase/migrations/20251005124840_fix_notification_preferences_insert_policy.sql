/*
  # Fix Notification Preferences Insert Policy

  ## Changes
  - Add INSERT policy for customers to create their own preferences
  - This allows customers to create their initial preferences record

  ## Security
  - Customers can only insert preferences for their own customer_id
  - Policy checks that the customer_id matches their authenticated customer_id
*/

-- Drop existing policies if they exist (to avoid conflicts)
DO $$ 
BEGIN
  DROP POLICY IF EXISTS "Customers can insert own preferences" ON notification_preferences;
EXCEPTION
  WHEN undefined_object THEN NULL;
END $$;

-- Create INSERT policy for customers
CREATE POLICY "Customers can insert own preferences"
  ON notification_preferences FOR INSERT
  TO authenticated
  WITH CHECK (
    customer_id IN (
      SELECT customer_id FROM customer_users WHERE id = auth.uid()
    )
  );
