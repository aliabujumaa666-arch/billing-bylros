/*
  # Add Minimum Chargeable Area to Quotes

  1. Schema Changes
    - Add `minimum_chargeable_area` column to `quotes` table
      - Default value of 1.0 square meter per item
      - Used to enforce minimum billing area for each quote item
    
  2. Notes
    - This allows quotes to apply a minimum chargeable area rule
    - If calculated area is less than minimum, the minimum is used for pricing
    - Commonly used in glass/material businesses where small items have a minimum charge
*/

-- Add minimum_chargeable_area column to quotes table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'quotes' AND column_name = 'minimum_chargeable_area'
  ) THEN
    ALTER TABLE quotes ADD COLUMN minimum_chargeable_area numeric(10,2) DEFAULT 1.00;
  END IF;
END $$;