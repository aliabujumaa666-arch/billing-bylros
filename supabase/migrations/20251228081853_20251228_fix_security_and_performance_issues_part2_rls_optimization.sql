/*
  # Security and Performance Optimization - Part 2: RLS Policy Optimization
  
  1. RLS Policy Performance Fixes
    - Replace auth.uid() with (SELECT auth.uid()) in all RLS policies
    - This prevents re-evaluation of auth functions for each row
    - Dramatically improves query performance at scale
    
  2. Tables Affected
    - site_visits, orders, quotes, warranties, warranty_claims
    - pdf_templates, customers, custom_reports, invoices
    - api_keys, webhooks, reminders, search_history, messages
    
  Note: This is Part 2 of a multi-part security and performance optimization.
*/

-- Site Visits
DROP POLICY IF EXISTS "Users can view site visits" ON public.site_visits;
CREATE POLICY "Users can view site visits"
  ON public.site_visits FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) IS NOT NULL);

-- Orders
DROP POLICY IF EXISTS "Users can view orders" ON public.orders;
CREATE POLICY "Users can view orders"
  ON public.orders FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) IS NOT NULL);

-- Quotes
DROP POLICY IF EXISTS "Users can view quotes" ON public.quotes;
CREATE POLICY "Users can view quotes"
  ON public.quotes FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) IS NOT NULL);

-- Warranties
DROP POLICY IF EXISTS "Users can view warranties" ON public.warranties;
CREATE POLICY "Users can view warranties"
  ON public.warranties FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) IS NOT NULL);

-- Warranty Claims
DROP POLICY IF EXISTS "Users can view warranty claims" ON public.warranty_claims;
CREATE POLICY "Users can view warranty claims"
  ON public.warranty_claims FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) IS NOT NULL);

-- PDF Templates
DROP POLICY IF EXISTS "Users can create templates" ON public.pdf_templates;
CREATE POLICY "Users can create templates"
  ON public.pdf_templates FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT auth.uid()) IS NOT NULL);

DROP POLICY IF EXISTS "Users can update own templates" ON public.pdf_templates;
CREATE POLICY "Users can update own templates"
  ON public.pdf_templates FOR UPDATE
  TO authenticated
  USING (created_by = (SELECT auth.uid()))
  WITH CHECK (created_by = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can delete own templates" ON public.pdf_templates;
CREATE POLICY "Users can delete own templates"
  ON public.pdf_templates FOR DELETE
  TO authenticated
  USING (created_by = (SELECT auth.uid()));

-- Customers
DROP POLICY IF EXISTS "Users can view customers" ON public.customers;
CREATE POLICY "Users can view customers"
  ON public.customers FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) IS NOT NULL);

DROP POLICY IF EXISTS "Users can update customers" ON public.customers;
CREATE POLICY "Users can update customers"
  ON public.customers FOR UPDATE
  TO authenticated
  USING ((SELECT auth.uid()) IS NOT NULL);

-- Custom Reports
DROP POLICY IF EXISTS "Users can view own reports" ON public.custom_reports;
CREATE POLICY "Users can view own reports"
  ON public.custom_reports FOR SELECT
  TO authenticated
  USING (created_by = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can create reports" ON public.custom_reports;
CREATE POLICY "Users can create reports"
  ON public.custom_reports FOR INSERT
  TO authenticated
  WITH CHECK (created_by = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can update own reports" ON public.custom_reports;
CREATE POLICY "Users can update own reports"
  ON public.custom_reports FOR UPDATE
  TO authenticated
  USING (created_by = (SELECT auth.uid()))
  WITH CHECK (created_by = (SELECT auth.uid()));

-- Invoices
DROP POLICY IF EXISTS "Users can view invoices" ON public.invoices;
CREATE POLICY "Users can view invoices"
  ON public.invoices FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) IS NOT NULL);

-- API Keys
DROP POLICY IF EXISTS "Users can view own api keys" ON public.api_keys;
CREATE POLICY "Users can view own api keys"
  ON public.api_keys FOR SELECT
  TO authenticated
  USING (created_by = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can manage own api keys" ON public.api_keys;
CREATE POLICY "Users can manage own api keys"
  ON public.api_keys FOR ALL
  TO authenticated
  USING (created_by = (SELECT auth.uid()))
  WITH CHECK (created_by = (SELECT auth.uid()));

-- Webhooks
DROP POLICY IF EXISTS "Users can view own webhooks" ON public.webhooks;
CREATE POLICY "Users can view own webhooks"
  ON public.webhooks FOR SELECT
  TO authenticated
  USING (created_by = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can manage own webhooks" ON public.webhooks;
CREATE POLICY "Users can manage own webhooks"
  ON public.webhooks FOR ALL
  TO authenticated
  USING (created_by = (SELECT auth.uid()))
  WITH CHECK (created_by = (SELECT auth.uid()));

-- Reminders
DROP POLICY IF EXISTS "Users can view own reminders" ON public.reminders;
CREATE POLICY "Users can view own reminders"
  ON public.reminders FOR SELECT
  TO authenticated
  USING (created_by = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can create reminders" ON public.reminders;
CREATE POLICY "Users can create reminders"
  ON public.reminders FOR INSERT
  TO authenticated
  WITH CHECK (created_by = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can update own reminders" ON public.reminders;
CREATE POLICY "Users can update own reminders"
  ON public.reminders FOR UPDATE
  TO authenticated
  USING (created_by = (SELECT auth.uid()))
  WITH CHECK (created_by = (SELECT auth.uid()));

-- Search History
DROP POLICY IF EXISTS "Users can view own search history" ON public.search_history;
CREATE POLICY "Users can view own search history"
  ON public.search_history FOR SELECT
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can create search history" ON public.search_history;
CREATE POLICY "Users can create search history"
  ON public.search_history FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));

-- Messages
DROP POLICY IF EXISTS "Users can view messages" ON public.messages;
CREATE POLICY "Users can view messages"
  ON public.messages FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) IS NOT NULL);

DROP POLICY IF EXISTS "Users can update messages" ON public.messages;
CREATE POLICY "Users can update messages"
  ON public.messages FOR UPDATE
  TO authenticated
  USING ((SELECT auth.uid()) IS NOT NULL);