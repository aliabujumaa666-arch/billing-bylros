/*
  # Add Default ID Generation for Customer Users

  1. Changes
    - Add default UUID generation for customer_users.id column
    - This allows admins to create portal accounts without requiring auth user IDs
  
  2. Security
    - No changes to RLS policies
    - Maintains existing security model
*/

-- Add default UUID generation for customer_users id column
ALTER TABLE customer_users 
ALTER COLUMN id SET DEFAULT gen_random_uuid();