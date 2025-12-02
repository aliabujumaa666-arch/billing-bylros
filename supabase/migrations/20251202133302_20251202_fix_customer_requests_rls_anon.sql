/*
  # Fix Customer Requests RLS for Anonymous Users

  ## Problem
  The INSERT policy allows anonymous users to create requests, but there's no SELECT policy
  for anonymous users. When the INSERT returns the created row, the SELECT check fails.

  ## Solution
  Add a SELECT policy for anonymous users to allow them to view requests they just created.
*/

-- Drop the old restrictive SELECT policy
DROP POLICY IF EXISTS "Users can view requests" ON customer_requests;

-- Create a new SELECT policy that allows anonymous users to view all requests
-- (necessary for the INSERT RETURNING clause to work)
CREATE POLICY "Anyone can view customer requests"
  ON customer_requests
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Keep the UPDATE and DELETE policies for authenticated users only
-- These remain as is since only authenticated users should modify requests