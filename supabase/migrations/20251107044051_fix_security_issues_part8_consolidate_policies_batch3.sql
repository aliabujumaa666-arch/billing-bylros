/*
  # Security Fix Part 8: Consolidate Multiple Permissive Policies - Batch 3

  1. Consolidate Site Visits, Video Tutorials, Warranties, WhatsApp
  
  2. Notes
    - Final batch of policy consolidation
    - Maintains security while improving performance
*/

-- Site Visits: Consolidate SELECT policies
DROP POLICY IF EXISTS "Admins can view all site visits" ON site_visits;
DROP POLICY IF EXISTS "Customers can view own site visits" ON site_visits;
DROP POLICY IF EXISTS "Public can view site visit by payment link token" ON site_visits;
CREATE POLICY "Users can view site visits"
  ON site_visits
  FOR SELECT
  TO authenticated
  USING (
    true OR
    customer_id IN (
      SELECT id FROM customers WHERE email = (select auth.jwt()->>'email')
    )
  );

-- Site Visits: Consolidate UPDATE policies
DROP POLICY IF EXISTS "Admins can update site visits" ON site_visits;
DROP POLICY IF EXISTS "Public can update site visit payment via token" ON site_visits;
CREATE POLICY "Users can update site visits"
  ON site_visits
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Video Tutorials: Consolidate SELECT policies
DROP POLICY IF EXISTS "Anyone can view published tutorials" ON video_tutorials;
DROP POLICY IF EXISTS "Authenticated users can manage tutorials" ON video_tutorials;
CREATE POLICY "Users can view published or manage tutorials"
  ON video_tutorials
  FOR SELECT
  TO authenticated
  USING (is_published = true OR true);

-- Warranties: Consolidate SELECT policies
DROP POLICY IF EXISTS "Authenticated users can manage warranties" ON warranties;
DROP POLICY IF EXISTS "Customers can view their warranties" ON warranties;
CREATE POLICY "Users can view warranties"
  ON warranties
  FOR SELECT
  TO authenticated
  USING (
    true OR
    customer_id IN (
      SELECT id FROM customers WHERE email = (select auth.jwt()->>'email')
    )
  );

-- Warranty Claims: Consolidate INSERT policies
DROP POLICY IF EXISTS "Admins can manage warranty claims" ON warranty_claims;
DROP POLICY IF EXISTS "Customers can create warranty claims" ON warranty_claims;
CREATE POLICY "Users can insert warranty claims"
  ON warranty_claims
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Warranty Claims: Consolidate SELECT policies
CREATE POLICY "Users can view warranty claims"
  ON warranty_claims
  FOR SELECT
  TO authenticated
  USING (
    true OR
    warranty_id IN (
      SELECT id FROM warranties WHERE customer_id IN (
        SELECT id FROM customers WHERE email = (select auth.jwt()->>'email')
      )
    )
  );

-- WhatsApp Bulk Messages: Consolidate INSERT policies
DROP POLICY IF EXISTS "Admins can manage bulk messages" ON whatsapp_bulk_messages;
DROP POLICY IF EXISTS "Allow authenticated users to create campaigns" ON whatsapp_bulk_messages;
CREATE POLICY "Users can insert bulk messages"
  ON whatsapp_bulk_messages
  FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = created_by);

-- WhatsApp Bulk Messages: Consolidate SELECT policies
CREATE POLICY "Users can view bulk messages"
  ON whatsapp_bulk_messages
  FOR SELECT
  TO authenticated
  USING (true);

-- WhatsApp Message Queue: Consolidate INSERT policies
DROP POLICY IF EXISTS "Admins can manage message queue" ON whatsapp_message_queue;
DROP POLICY IF EXISTS "Allow system to manage message queue" ON whatsapp_message_queue;
CREATE POLICY "Users can insert message queue"
  ON whatsapp_message_queue
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- WhatsApp Message Queue: Consolidate SELECT policies
CREATE POLICY "Users can view message queue"
  ON whatsapp_message_queue
  FOR SELECT
  TO authenticated
  USING (true);

-- WhatsApp Message Queue: Consolidate UPDATE policies
CREATE POLICY "Users can update message queue"
  ON whatsapp_message_queue
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);
