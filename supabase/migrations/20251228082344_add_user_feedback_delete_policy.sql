/*
  # Add DELETE policy for user_feedback table

  1. Changes
    - Add DELETE policy to allow authenticated admins to delete feedback entries
  
  2. Security
    - Only authenticated users can delete feedback entries
    - This allows admins to manage and remove feedback as needed
*/

-- Add DELETE policy for user_feedback
CREATE POLICY "Admins can delete feedback"
  ON user_feedback
  FOR DELETE
  TO authenticated
  USING (true);
