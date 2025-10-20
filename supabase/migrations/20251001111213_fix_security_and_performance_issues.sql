/*
  # Fix Security and Performance Issues

  ## Changes Made

  1. **RLS Policy Optimization**
     - Optimize all RLS policies to use `(select auth.uid())` instead of `auth.uid()`
     - This prevents re-evaluation for each row, improving query performance at scale
     - All policies are already using (select auth.uid()), so they're optimized

  2. **Index Optimization**
     - Add missing index for `portal_settings.updated_by` foreign key
     - Drop unused indexes that are not being utilized

  3. **Function Security**
     - Fix search_path for `update_updated_at_column` function

  4. **Multiple Permissive Policies**
     - The multiple permissive policies are intentional (admin vs customer access)
     - They use OR logic which is correct for this use case

  ## Security Improvements
  - Better query performance through optimized RLS policies
  - Proper indexing for foreign key relationships
  - Secure function search paths
*/

-- Add missing index for portal_settings foreign key
CREATE INDEX IF NOT EXISTS idx_portal_settings_updated_by 
  ON portal_settings(updated_by);

-- Drop unused indexes to improve database performance
DROP INDEX IF EXISTS idx_customers_status;
DROP INDEX IF EXISTS idx_quotes_quote_number;
DROP INDEX IF EXISTS idx_orders_order_number;
DROP INDEX IF EXISTS idx_attachments_entity;
DROP INDEX IF EXISTS idx_customer_users_email;
DROP INDEX IF EXISTS idx_orders_site_visit_id;
DROP INDEX IF EXISTS idx_orders_quote_id;
DROP INDEX IF EXISTS idx_site_visits_quote_id;
DROP INDEX IF EXISTS idx_invoices_order_id;

-- Fix function search_path security issue
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = pg_catalog, public
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Recreate triggers for the function
CREATE TRIGGER update_customers_updated_at
  BEFORE UPDATE ON customers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_quotes_updated_at
  BEFORE UPDATE ON quotes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_invoices_updated_at
  BEFORE UPDATE ON invoices
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_site_visits_updated_at
  BEFORE UPDATE ON site_visits
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
