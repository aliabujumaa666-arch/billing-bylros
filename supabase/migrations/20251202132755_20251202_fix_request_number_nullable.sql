/*
  # Fix Request Number Column Nullability

  ## Problem
  The request_number column is still marked as NOT NULL, which prevents proper NULL handling
  in the UNIQUE constraint. PostgreSQL UNIQUE constraints treat multiple NULLs as distinct,
  which is what we need.

  ## Solution
  Make the request_number column nullable so it can be NULL until the trigger generates a value.
*/

DO $$
BEGIN
  -- Make the column nullable
  ALTER TABLE customer_requests 
    ALTER COLUMN request_number DROP NOT NULL;
  
  -- Ensure default is NULL
  ALTER TABLE customer_requests 
    ALTER COLUMN request_number SET DEFAULT NULL;
    
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Column modification attempted: %', SQLERRM;
END $$;