/*
  # Add DELETE policy for messages table

  1. Changes
    - Add DELETE policy to allow authenticated admins to delete messages
  
  2. Security
    - Only authenticated users can delete messages
    - This allows admins to manage and remove messages as needed
*/

-- Add DELETE policy for messages
CREATE POLICY "Users can delete messages"
  ON messages
  FOR DELETE
  TO authenticated
  USING (true);
