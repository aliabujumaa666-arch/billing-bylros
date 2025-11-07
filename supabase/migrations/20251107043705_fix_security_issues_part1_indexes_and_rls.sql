/*
  # Security Fix Part 1: Add Missing Indexes and Optimize RLS

  1. Add Missing Foreign Key Indexes
    - Add index on pages.author_id
    - Add index on receipts.order_id
  
  2. Fix RLS Policies - Optimize auth.uid() calls
    - Fix whatsapp_marketing_campaigns policies to use (select auth.uid())
  
  3. Notes
    - These changes improve query performance and security
    - RLS optimization prevents re-evaluation of auth functions for each row
*/

-- Add missing foreign key indexes
CREATE INDEX IF NOT EXISTS idx_pages_author_id ON pages(author_id);
CREATE INDEX IF NOT EXISTS idx_receipts_order_id ON receipts(order_id);

-- Fix RLS policies for whatsapp_marketing_campaigns to optimize auth.uid() calls
DROP POLICY IF EXISTS "Authenticated users can insert marketing campaigns" ON whatsapp_marketing_campaigns;
CREATE POLICY "Authenticated users can insert marketing campaigns"
  ON whatsapp_marketing_campaigns
  FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = created_by);

DROP POLICY IF EXISTS "Authenticated users can update their marketing campaigns" ON whatsapp_marketing_campaigns;
CREATE POLICY "Authenticated users can update their marketing campaigns"
  ON whatsapp_marketing_campaigns
  FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = created_by)
  WITH CHECK ((select auth.uid()) = created_by);

DROP POLICY IF EXISTS "Authenticated users can delete their marketing campaigns" ON whatsapp_marketing_campaigns;
CREATE POLICY "Authenticated users can delete their marketing campaigns"
  ON whatsapp_marketing_campaigns
  FOR DELETE
  TO authenticated
  USING ((select auth.uid()) = created_by);
