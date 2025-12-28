/*
  # Add Performance Indexes

  1. Performance Issue Fixed
    - Multiple tables lacked indexes on frequently queried columns
    - Slow query performance for filtering and joining operations
  
  2. Indexes Added
    - `messages` table:
      - Index on `customer_id` for filtering messages by customer
      - Index on `sender_id` for filtering by sender
      - Composite index on `customer_id, created_at DESC` for recent messages
    
    - `notification_log` table:
      - Composite index on `customer_id, created_at DESC` for notification history
      - Index on `sent_at` for sent notification queries
    
    - `whatsapp_conversations` table:
      - Index on `customer_id` for customer conversation lookup
      - Index on `customer_phone` for phone number searches
      - Composite index on `status, updated_at DESC` for active conversation queries
    
    - `activity_log` table:
      - Composite index on `user_id, created_at DESC` for user audit trails
      - Index on `action` for action-based filtering
    
    - `support_tickets` table:
      - Composite index on `status, created_at DESC` for filtering open tickets
      - Index on `customer_id` for customer ticket lookup
    
    - `orders` table:
      - Composite index on `status, created_at DESC` for order status filtering
  
  3. Impact
    - Significantly improved query performance for common operations
    - Faster page loads for message history, notifications, and conversations
    - Better performance for audit logs and ticket management
*/

-- Messages table indexes
CREATE INDEX IF NOT EXISTS idx_messages_customer_id 
  ON messages(customer_id);

CREATE INDEX IF NOT EXISTS idx_messages_sender_id 
  ON messages(sender_id);

CREATE INDEX IF NOT EXISTS idx_messages_customer_recent 
  ON messages(customer_id, created_at DESC);

-- Notification log indexes
CREATE INDEX IF NOT EXISTS idx_notification_log_customer 
  ON notification_log(customer_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_notification_log_sent 
  ON notification_log(sent_at) 
  WHERE sent_at IS NOT NULL;

-- WhatsApp conversations indexes
CREATE INDEX IF NOT EXISTS idx_whatsapp_conversations_customer 
  ON whatsapp_conversations(customer_id);

CREATE INDEX IF NOT EXISTS idx_whatsapp_conversations_phone 
  ON whatsapp_conversations(customer_phone);

CREATE INDEX IF NOT EXISTS idx_whatsapp_conversations_status 
  ON whatsapp_conversations(status, updated_at DESC);

-- Activity log indexes
CREATE INDEX IF NOT EXISTS idx_activity_log_user 
  ON activity_log(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_activity_log_action 
  ON activity_log(action);

-- Support tickets indexes
CREATE INDEX IF NOT EXISTS idx_support_tickets_status 
  ON support_tickets(status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_support_tickets_customer 
  ON support_tickets(customer_id);

-- Orders table indexes
CREATE INDEX IF NOT EXISTS idx_orders_status 
  ON orders(status, created_at DESC);

-- Customer users index for email lookups
CREATE INDEX IF NOT EXISTS idx_customer_users_email 
  ON customer_users(email);

-- Quotes table index for customer lookups
CREATE INDEX IF NOT EXISTS idx_quotes_customer 
  ON quotes(customer_id);

-- Invoices table index for customer lookups
CREATE INDEX IF NOT EXISTS idx_invoices_customer 
  ON invoices(customer_id);