/*
  # Add Customer Registration Validation

  1. Security Issue Fixed
    - Previous policy allowed anonymous users to insert customers with no validation
    - Risk of spam, fake accounts, and database pollution
  
  2. Changes Made
    - Update anonymous customer registration policy with strict validation:
      - Email must be present and contain '@' symbol (basic format check)
      - Phone must be present and non-empty
      - Name must be present and have minimum length of 2 characters
      - Email must be unique (enforced by database constraint)
  
  3. Impact
    - Prevents spam and fake customer creation
    - Ensures data quality
    - Maintains legitimate self-registration functionality
*/

-- Drop the old policy
DROP POLICY IF EXISTS "Allow anonymous customer registration" ON customers;

-- Create new policy with validation
CREATE POLICY "Allow validated anonymous customer registration"
  ON customers
  FOR INSERT
  TO anon
  WITH CHECK (
    -- Email must exist and contain @
    email IS NOT NULL 
    AND email LIKE '%@%' 
    AND LENGTH(email) >= 5
    -- Phone must exist and not be empty
    AND phone IS NOT NULL 
    AND LENGTH(phone) >= 8
    -- Name must exist and be at least 2 characters
    AND name IS NOT NULL 
    AND LENGTH(name) >= 2
  );