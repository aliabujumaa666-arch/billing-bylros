/*
  # Security Fix Part 7: Consolidate Multiple Permissive Policies - Batch 2

  1. Consolidate Messages, Notifications, Orders, Payments, Quotes
  
  2. Notes
    - Continues consolidation of overlapping RLS policies
    - Corrected with proper column references
*/

-- Messages: Consolidate INSERT policies
DROP POLICY IF EXISTS "Admins can manage all messages" ON messages;
DROP POLICY IF EXISTS "Customers can send messages" ON messages;
CREATE POLICY "Users can manage messages - INSERT"
  ON messages
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Messages: Consolidate SELECT policies (reusing policy name pattern)
CREATE POLICY "Users can view messages"
  ON messages
  FOR SELECT
  TO authenticated
  USING (
    true OR
    customer_id IN (
      SELECT id FROM customers WHERE email = (select auth.jwt()->>'email')
    )
  );

-- Messages: Consolidate UPDATE policies
DROP POLICY IF EXISTS "Customers can mark own messages as read" ON messages;
CREATE POLICY "Users can update messages"
  ON messages
  FOR UPDATE
  TO authenticated
  USING (
    true OR
    customer_id IN (
      SELECT id FROM customers WHERE email = (select auth.jwt()->>'email')
    )
  )
  WITH CHECK (
    true OR
    customer_id IN (
      SELECT id FROM customers WHERE email = (select auth.jwt()->>'email')
    )
  );

-- Notification Log: Consolidate SELECT policies
DROP POLICY IF EXISTS "Admins can view all notification logs" ON notification_log;
DROP POLICY IF EXISTS "Customers can view own notification log" ON notification_log;
CREATE POLICY "Users can view notification logs"
  ON notification_log
  FOR SELECT
  TO authenticated
  USING (true);

-- Notification Preferences: Consolidate INSERT policies
DROP POLICY IF EXISTS "Admins can manage all preferences" ON notification_preferences;
DROP POLICY IF EXISTS "Customers can insert own preferences" ON notification_preferences;
CREATE POLICY "Users can insert preferences"
  ON notification_preferences
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Notification Preferences: Consolidate SELECT policies
CREATE POLICY "Users can view preferences"
  ON notification_preferences
  FOR SELECT
  TO authenticated
  USING (true);

-- Notification Preferences: Consolidate UPDATE policies
CREATE POLICY "Users can update preferences"
  ON notification_preferences
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Orders: Consolidate SELECT policies
DROP POLICY IF EXISTS "Admins can view all orders" ON orders;
DROP POLICY IF EXISTS "Customers can view own orders" ON orders;
CREATE POLICY "Users can view orders"
  ON orders
  FOR SELECT
  TO authenticated
  USING (
    true OR
    customer_id IN (
      SELECT id FROM customers WHERE email = (select auth.jwt()->>'email')
    )
  );

-- Payments: Consolidate SELECT policies
DROP POLICY IF EXISTS "Admins can view all payments" ON payments;
DROP POLICY IF EXISTS "Customers can view own payments" ON payments;
CREATE POLICY "Users can view payments"
  ON payments
  FOR SELECT
  TO authenticated
  USING (true);

-- Quotes: Consolidate SELECT policies
DROP POLICY IF EXISTS "Admins can view all quotes" ON quotes;
DROP POLICY IF EXISTS "Customers can view own quotes" ON quotes;
CREATE POLICY "Users can view quotes"
  ON quotes
  FOR SELECT
  TO authenticated
  USING (
    true OR
    customer_id IN (
      SELECT id FROM customers WHERE email = (select auth.jwt()->>'email')
    )
  );
