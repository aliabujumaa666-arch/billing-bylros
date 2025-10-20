/*
  # Add Workflow Relationships Between Entities

  ## Overview
  Establishes proper workflow connections between Quotes → Site Visits → Orders → Invoices

  ## Changes
  
  ### 1. Add Foreign Keys to Orders Table
  - Add `site_visit_id` (uuid, nullable) - Link orders to site visits
  - Already has `quote_id` from original schema
  
  ### 2. Add Foreign Keys to Site Visits Table  
  - Add `quote_id` (uuid, nullable) - Link site visits to quotes

  ### 3. Create Indexes
  - Index on orders.site_visit_id for performance
  - Index on site_visits.quote_id for performance

  ## Workflow
  1. Create Quote → Quote status changes
  2. Schedule Site Visit (optional) → Link to quote
  3. Create Order → Link to quote and site visit
  4. Create Invoice → Link to order (already exists)

  ## Important Notes
  - All foreign keys are nullable to allow flexible workflows
  - ON DELETE SET NULL to preserve history even if parent is deleted
  - Indexes improve query performance for relationship lookups
*/

-- Add site_visit_id to orders table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'site_visit_id'
  ) THEN
    ALTER TABLE orders ADD COLUMN site_visit_id uuid REFERENCES site_visits(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Add quote_id to site_visits table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'site_visits' AND column_name = 'quote_id'
  ) THEN
    ALTER TABLE site_visits ADD COLUMN quote_id uuid REFERENCES quotes(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_orders_site_visit_id ON orders(site_visit_id);
CREATE INDEX IF NOT EXISTS idx_orders_quote_id ON orders(quote_id);
CREATE INDEX IF NOT EXISTS idx_site_visits_quote_id ON site_visits(quote_id);
CREATE INDEX IF NOT EXISTS idx_invoices_order_id ON invoices(order_id);
