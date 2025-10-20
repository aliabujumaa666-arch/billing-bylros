/*
  # Add Discount Fields to Quotes

  1. Schema Changes
    - Add `discount_type` column to `quotes` table
      - Values: 'none', 'percentage', 'fixed'
      - Default: 'none'
    - Add `discount_value` column to `quotes` table
      - Numeric value representing either percentage or fixed amount
      - Default: 0
    
  2. Notes
    - Allows quotes to apply discounts on subtotal before VAT
    - Percentage discount: discount_value represents percentage (e.g., 10 for 10%)
    - Fixed discount: discount_value represents fixed amount in AED
    - Discount is applied before VAT calculation
*/

-- Add discount_type column to quotes table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'quotes' AND column_name = 'discount_type'
  ) THEN
    ALTER TABLE quotes ADD COLUMN discount_type text DEFAULT 'none' CHECK (discount_type IN ('none', 'percentage', 'fixed'));
  END IF;
END $$;

-- Add discount_value column to quotes table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'quotes' AND column_name = 'discount_value'
  ) THEN
    ALTER TABLE quotes ADD COLUMN discount_value numeric(10,2) DEFAULT 0;
  END IF;
END $$;