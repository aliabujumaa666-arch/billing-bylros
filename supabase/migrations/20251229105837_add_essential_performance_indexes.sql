/*
  # Add Essential Performance Indexes

  1. Performance Optimization
    - Add index on quotes.status for filtering queries
    - Add composite index on invoices (status, due_date) for overdue queries
    - Add index on customers.email for portal lookups
    - Add index on orders.status for status filtering
    - Add index on site_visits.status for filtering
    - Add index on customer_users.email for authentication lookups
    - Add index on attachments (entity_type, entity_id) composite for faster lookups
    - Add index on whatsapp_messages.conversation_id for message history
    - Add index on support_tickets.status for filtering
    - Add index on email_campaigns.status for campaign management

  2. Notes
    - These are the most critical indexes for improving query performance
    - Indexes on foreign keys improve JOIN performance
    - Composite indexes optimize multi-column WHERE clauses
*/

CREATE INDEX IF NOT EXISTS idx_quotes_status ON quotes(status);

CREATE INDEX IF NOT EXISTS idx_quotes_customer_id ON quotes(customer_id);

CREATE INDEX IF NOT EXISTS idx_invoices_status_due_date ON invoices(status, due_date);

CREATE INDEX IF NOT EXISTS idx_invoices_customer_id ON invoices(customer_id);

CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email) WHERE email IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);

CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON orders(customer_id);

CREATE INDEX IF NOT EXISTS idx_site_visits_status ON site_visits(status);

CREATE INDEX IF NOT EXISTS idx_site_visits_customer_id ON site_visits(customer_id);

CREATE INDEX IF NOT EXISTS idx_customer_users_email ON customer_users(email);

CREATE INDEX IF NOT EXISTS idx_attachments_entity ON attachments(entity_type, entity_id);

CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_conversation_id ON whatsapp_messages(conversation_id);

CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_sent_at ON whatsapp_messages(sent_at DESC);

CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON support_tickets(status);

CREATE INDEX IF NOT EXISTS idx_email_campaigns_status ON email_campaigns(status);

CREATE INDEX IF NOT EXISTS idx_customer_requests_customer_id ON customer_requests(customer_id);

CREATE INDEX IF NOT EXISTS idx_customer_requests_status ON customer_requests(status);

CREATE INDEX IF NOT EXISTS idx_warranties_customer_id ON warranties(customer_id);

CREATE INDEX IF NOT EXISTS idx_installation_tasks_order_id ON installation_tasks(order_id);