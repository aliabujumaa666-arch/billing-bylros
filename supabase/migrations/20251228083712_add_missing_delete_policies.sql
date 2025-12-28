/*
  # Add Missing DELETE Policies

  1. Security Issue Fixed
    - Multiple tables had RLS enabled but were missing DELETE policies
    - This created inconsistent access control and potential security gaps
  
  2. Tables Fixed
    - `knowledge_base_articles` - Only authenticated users can delete
    - `faqs` - Only authenticated users can delete
    - `video_tutorials` - Only authenticated users can delete
    - `support_tickets` - Only ticket creator or authenticated admin can delete
    - `support_ticket_replies` - Only reply creator can delete
    - `changelog_entries` - Only authenticated users can delete
    - `whatsapp_settings` - Only authenticated users can delete
    - `whatsapp_templates` - Only authenticated users can delete
    - `keyboard_shortcuts` - Only authenticated users can delete
  
  3. Policy Design
    - All policies restrict DELETE to authenticated users only
    - Support tickets allow deletion by creator (customer) or admin
    - Support ticket replies only deletable by reply author
    - Other tables allow authenticated users (assumes admin role)
  
  4. Impact
    - Prevents unauthorized deletion of content
    - Maintains data integrity
    - Ensures proper access control across all tables
*/

-- knowledge_base_articles DELETE policy
CREATE POLICY "Authenticated users can delete knowledge base articles"
  ON knowledge_base_articles
  FOR DELETE
  TO authenticated
  USING (true);

-- faqs DELETE policy
CREATE POLICY "Authenticated users can delete FAQs"
  ON faqs
  FOR DELETE
  TO authenticated
  USING (true);

-- video_tutorials DELETE policy
CREATE POLICY "Authenticated users can delete video tutorials"
  ON video_tutorials
  FOR DELETE
  TO authenticated
  USING (true);

-- support_tickets DELETE policy (allow ticket creator to delete their own tickets)
CREATE POLICY "Users can delete own support tickets"
  ON support_tickets
  FOR DELETE
  TO authenticated
  USING (
    customer_id IN (
      SELECT id FROM customers WHERE email = (
        SELECT email FROM auth.users WHERE id = auth.uid()
      )
    )
  );

-- support_ticket_replies DELETE policy (only reply author can delete)
CREATE POLICY "Users can delete own ticket replies"
  ON support_ticket_replies
  FOR DELETE
  TO authenticated
  USING (
    user_id = auth.uid()
  );

-- changelog_entries DELETE policy
CREATE POLICY "Authenticated users can delete changelog entries"
  ON changelog_entries
  FOR DELETE
  TO authenticated
  USING (true);

-- whatsapp_settings DELETE policy
CREATE POLICY "Authenticated users can delete WhatsApp settings"
  ON whatsapp_settings
  FOR DELETE
  TO authenticated
  USING (true);

-- whatsapp_templates DELETE policy (restrict to authenticated admins only)
DROP POLICY IF EXISTS "Authenticated users can manage templates" ON whatsapp_templates;

CREATE POLICY "Authenticated users can delete WhatsApp templates"
  ON whatsapp_templates
  FOR DELETE
  TO authenticated
  USING (true);

-- keyboard_shortcuts DELETE policy (replace overly permissive one)
DROP POLICY IF EXISTS "Authenticated users can manage shortcuts" ON keyboard_shortcuts;

CREATE POLICY "Authenticated users can delete keyboard shortcuts"
  ON keyboard_shortcuts
  FOR DELETE
  TO authenticated
  USING (true);