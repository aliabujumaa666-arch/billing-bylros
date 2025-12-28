/*
  # Fix Overly Permissive DELETE Policies

  1. Security Issues Fixed
    - `user_feedback` table: Previous policy allowed ANY authenticated user to delete ANY feedback
      - New policy: Only the creator can delete their own feedback
    - `messages` table: Previous policy allowed ANY authenticated user to delete ANY message  
      - New policy: Only the sender can delete their own messages
  
  2. Changes Made
    - Drop existing overly permissive DELETE policies
    - Create new restrictive DELETE policies with proper ownership checks
    - Use `auth.uid()` to ensure users can only delete their own records
  
  3. Impact
    - Prevents unauthorized deletion of feedback and messages
    - Maintains data integrity and user privacy
    - Aligns with principle of least privilege
*/

-- Fix user_feedback DELETE policy
DROP POLICY IF EXISTS "Admins can delete feedback" ON user_feedback;

CREATE POLICY "Users can delete own feedback"
  ON user_feedback
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Fix messages DELETE policy  
DROP POLICY IF EXISTS "Users can delete messages" ON messages;

CREATE POLICY "Users can delete own messages"
  ON messages
  FOR DELETE
  TO authenticated
  USING (sender_id = auth.uid());