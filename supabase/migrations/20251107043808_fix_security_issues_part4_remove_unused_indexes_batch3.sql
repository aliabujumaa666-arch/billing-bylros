/*
  # Security Fix Part 4: Remove Unused Indexes - Batch 3

  1. Remove Unused Order, Invoice, and Receipt Indexes
    - Part 3 of 3: Orders, invoices, receipts, and miscellaneous indexes
  
  2. Notes
    - Final batch of unused index cleanup
    - Completes performance optimization
*/

-- Quote indexes
DROP INDEX IF EXISTS idx_quotes_status;
DROP INDEX IF EXISTS idx_quotes_created_at;
DROP INDEX IF EXISTS idx_quotes_quote_number;

-- Site visit indexes
DROP INDEX IF EXISTS idx_site_visits_quote_id;
DROP INDEX IF EXISTS idx_site_visits_status;
DROP INDEX IF EXISTS idx_site_visits_payment_link_token;
DROP INDEX IF EXISTS idx_site_visits_payment_status;
DROP INDEX IF EXISTS idx_site_visits_stripe_payment;
DROP INDEX IF EXISTS idx_site_visits_paypal_transaction;

-- Order indexes
DROP INDEX IF EXISTS idx_orders_quote_id;
DROP INDEX IF EXISTS idx_orders_site_visit_id;
DROP INDEX IF EXISTS idx_orders_status;
DROP INDEX IF EXISTS idx_orders_order_date;
DROP INDEX IF EXISTS idx_orders_order_number;

-- Invoice indexes
DROP INDEX IF EXISTS idx_invoices_order_id;
DROP INDEX IF EXISTS idx_invoices_status;
DROP INDEX IF EXISTS idx_invoices_created_at;
DROP INDEX IF EXISTS idx_invoices_invoice_number;

-- Receipt indexes
DROP INDEX IF EXISTS idx_receipts_customer_id;
DROP INDEX IF EXISTS idx_receipts_payment_id;
DROP INDEX IF EXISTS idx_receipts_invoice_id;
DROP INDEX IF EXISTS idx_receipts_receipt_number;
DROP INDEX IF EXISTS idx_receipts_payment_date;
DROP INDEX IF EXISTS idx_receipts_status;

-- Audit and webhook indexes
DROP INDEX IF EXISTS idx_audit_logs_entity_id;
DROP INDEX IF EXISTS idx_audit_logs_created_at;
DROP INDEX IF EXISTS idx_audit_logs_user_id;
DROP INDEX IF EXISTS idx_audit_logs_entity_type;
DROP INDEX IF EXISTS idx_audit_logs_entity_composite;
DROP INDEX IF EXISTS idx_stripe_webhooks_event_id;
DROP INDEX IF EXISTS idx_stripe_webhooks_processed;
DROP INDEX IF EXISTS idx_paypal_webhooks_event_id;
DROP INDEX IF EXISTS idx_paypal_webhooks_processed;

-- Public booking indexes
DROP INDEX IF EXISTS idx_public_bookings_status;
DROP INDEX IF EXISTS idx_public_bookings_date;

-- Notification indexes
DROP INDEX IF EXISTS idx_notification_log_status;
DROP INDEX IF EXISTS idx_notification_log_created;
DROP INDEX IF EXISTS idx_scheduled_notifications_status;
DROP INDEX IF EXISTS idx_scheduled_notifications_scheduled;
