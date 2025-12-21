/*
  # Auto-set Valid Until Date for Quotes

  1. Changes
    - Add a trigger function to automatically set valid_until to 30 days from created_at
    - Apply trigger on INSERT to quotes table
    - Only sets valid_until if it's not already provided

  2. Purpose
    - Ensures valid_until is always 30 days from the issue date (created_at)
    - Eliminates manual date calculation errors
    - Provides consistent quote validity period
*/

-- Create function to set valid_until to 30 days from created_at
CREATE OR REPLACE FUNCTION set_quote_valid_until()
RETURNS TRIGGER AS $$
BEGIN
  -- Only set valid_until if it's not provided
  IF NEW.valid_until IS NULL THEN
    NEW.valid_until := (NEW.created_at + INTERVAL '30 days')::date;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if it exists
DROP TRIGGER IF EXISTS set_valid_until_trigger ON quotes;

-- Create trigger on quotes table
CREATE TRIGGER set_valid_until_trigger
  BEFORE INSERT ON quotes
  FOR EACH ROW
  EXECUTE FUNCTION set_quote_valid_until();