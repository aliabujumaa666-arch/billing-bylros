/*
  # Add Shipping Amount to Quotes

  This migration adds shipping functionality to quotes. Shipping is a separate charge 
  that is not included in VAT calculations.

  ## Changes
  
  1. New Column
    - `shipping_amount` (numeric)
      - Stores the shipping cost
      - Default value: 0
      - Not included in VAT calculations
      - Added to total after VAT
  
  ## Important Notes
  - Shipping is added AFTER VAT calculation
  - Formula: Total = (Subtotal - Discount) + VAT + Shipping
  - This allows for separate shipping charges that aren't taxed
*/

-- Add shipping_amount column to quotes table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'quotes' AND column_name = 'shipping_amount'
  ) THEN
    ALTER TABLE quotes ADD COLUMN shipping_amount numeric DEFAULT 0;
  END IF;
END $$;