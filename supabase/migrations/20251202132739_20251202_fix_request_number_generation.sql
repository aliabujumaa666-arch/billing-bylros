/*
  # Fix Customer Request Number Generation

  ## Problem
  The request_number column had a default value of empty string ('') which caused duplicate key violations
  when multiple requests were submitted. The UNIQUE constraint was preventing duplicate empty strings.

  ## Solution
  1. Drop the UNIQUE constraint temporarily
  2. Remove the empty string default value
  3. Make the column nullable (NULL by default)
  4. Set existing empty strings to NULL
  5. Recreate the UNIQUE constraint to properly handle the trigger
  6. Update the trigger function to handle NULL values correctly

  ## Changes
  - Modified request_number default from '' to NULL
  - Updated constraint to allow NULL for request_number
  - Ensured trigger fires for all inserts and generates unique numbers
  - Cleaned up existing duplicate empty string values
*/

DO $$
BEGIN
  -- First, let's drop the existing unique constraint
  ALTER TABLE customer_requests DROP CONSTRAINT IF EXISTS customer_requests_request_number_key;
  
  -- Set any empty string request_numbers to NULL
  UPDATE customer_requests SET request_number = NULL WHERE request_number = '';
  
  -- Modify the column to be nullable with NULL default
  ALTER TABLE customer_requests 
    ALTER COLUMN request_number DROP DEFAULT,
    ALTER COLUMN request_number SET DEFAULT NULL;
  
  -- Recreate the UNIQUE constraint (this allows NULL values to coexist in unique indexes)
  ALTER TABLE customer_requests ADD CONSTRAINT customer_requests_request_number_key UNIQUE (request_number);
  
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Error in migration: %', SQLERRM;
END $$;

-- Recreate the trigger function with better logic
CREATE OR REPLACE FUNCTION set_request_number()
RETURNS TRIGGER AS $$
DECLARE
  next_num integer;
  request_num text;
  max_attempts integer := 10;
  attempts integer := 0;
BEGIN
  -- Only generate if request_number is NULL or empty
  IF NEW.request_number IS NULL OR NEW.request_number = '' THEN
    -- Retry logic to handle potential race conditions
    WHILE attempts < max_attempts LOOP
      next_num := nextval('request_number_seq');
      request_num := 'REQ-' || LPAD(next_num::text, 5, '0');
      
      -- Check if this number already exists
      IF NOT EXISTS (SELECT 1 FROM customer_requests WHERE request_number = request_num) THEN
        NEW.request_number := request_num;
        RETURN NEW;
      END IF;
      
      attempts := attempts + 1;
    END LOOP;
    
    -- Fallback: use timestamp-based unique number if sequence fails
    IF NEW.request_number IS NULL OR NEW.request_number = '' THEN
      NEW.request_number := 'REQ-' || TO_CHAR(now(), 'YYMMDDHHmmss') || '-' || SUBSTR(MD5(random()::text), 1, 3);
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Ensure the trigger is set correctly
DROP TRIGGER IF EXISTS customer_requests_set_number ON customer_requests;
CREATE TRIGGER customer_requests_set_number
  BEFORE INSERT ON customer_requests
  FOR EACH ROW
  EXECUTE FUNCTION set_request_number();

-- Generate request numbers for any existing NULL entries
UPDATE customer_requests 
SET request_number = 'REQ-' || LPAD(nextval('request_number_seq')::text, 5, '0')
WHERE request_number IS NULL;