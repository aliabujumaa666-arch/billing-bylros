/*
  # Fix Warranties RLS Policies

  1. Changes
    - Add INSERT policy for warranties table to allow authenticated users to create warranties
    - Add UPDATE policy for warranties table to allow authenticated users to update warranties
    - Add DELETE policy for warranties table to allow authenticated users to delete warranties

  2. Security
    - INSERT: Authenticated users can create warranties
    - UPDATE: Authenticated users can update warranties
    - DELETE: Authenticated users can delete warranties
    - SELECT: Already exists - users can view warranties
*/

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Authenticated users can insert warranties" ON warranties;
DROP POLICY IF EXISTS "Authenticated users can update warranties" ON warranties;
DROP POLICY IF EXISTS "Authenticated users can delete warranties" ON warranties;

-- Add INSERT policy for warranties
CREATE POLICY "Authenticated users can insert warranties"
  ON warranties
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Add UPDATE policy for warranties
CREATE POLICY "Authenticated users can update warranties"
  ON warranties
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Add DELETE policy for warranties
CREATE POLICY "Authenticated users can delete warranties"
  ON warranties
  FOR DELETE
  TO authenticated
  USING (true);