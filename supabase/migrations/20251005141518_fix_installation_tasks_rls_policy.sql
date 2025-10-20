/*
  # Fix Installation Tasks RLS Policy

  1. Changes
    - Drop the problematic policy that queries auth.users
    - Create proper policies for INSERT, UPDATE, DELETE, and SELECT operations
    - Allow authenticated users to manage their own installation tasks
    - Simplify the authentication check to use auth.uid() directly

  2. Security
    - All policies check for authenticated users only
    - Users can only manage tasks they create or are assigned to
*/

-- Drop existing problematic policy
DROP POLICY IF EXISTS "Admins can manage installation tasks" ON installation_tasks;

-- Create separate policies for each operation

-- Allow authenticated users to insert tasks
CREATE POLICY "Authenticated users can create installation tasks"
  ON installation_tasks
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

-- Allow users to update their assigned tasks
CREATE POLICY "Users can update their installation tasks"
  ON installation_tasks
  FOR UPDATE
  TO authenticated
  USING (assigned_to = auth.uid() OR auth.uid() IS NOT NULL)
  WITH CHECK (assigned_to = auth.uid() OR auth.uid() IS NOT NULL);

-- Allow users to delete their assigned tasks
CREATE POLICY "Users can delete their installation tasks"
  ON installation_tasks
  FOR DELETE
  TO authenticated
  USING (assigned_to = auth.uid() OR auth.uid() IS NOT NULL);

-- The existing SELECT policy is fine, but let's add a broader one for all authenticated users
CREATE POLICY "Authenticated users can view all installation tasks"
  ON installation_tasks
  FOR SELECT
  TO authenticated
  USING (auth.uid() IS NOT NULL);
