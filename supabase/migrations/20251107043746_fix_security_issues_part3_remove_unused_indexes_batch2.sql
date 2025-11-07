/*
  # Security Fix Part 3: Remove Unused Indexes - Batch 2

  1. Remove Unused WhatsApp and Customer Indexes
    - Part 2 of 3: WhatsApp messaging, customer, and related indexes
  
  2. Notes
    - Continues cleanup of unused indexes
    - Improves database write performance
*/

-- WhatsApp AI and messaging indexes
DROP INDEX IF EXISTS idx_whatsapp_ai_settings_created_by;
DROP INDEX IF EXISTS idx_whatsapp_ai_training_rated_by;
DROP INDEX IF EXISTS idx_whatsapp_bulk_messages_template_id;
DROP INDEX IF EXISTS idx_whatsapp_message_logs_queue_id;
DROP INDEX IF EXISTS idx_whatsapp_messages_ai_approved_by;
DROP INDEX IF EXISTS idx_whatsapp_messages_reply_to_message_id;
DROP INDEX IF EXISTS idx_whatsapp_quick_replies_created_by;
DROP INDEX IF EXISTS idx_whatsapp_settings_created_by;
DROP INDEX IF EXISTS idx_whatsapp_templates_created_by;

-- Customer request indexes
DROP INDEX IF EXISTS idx_customer_requests_status;
DROP INDEX IF EXISTS idx_customer_requests_priority;
DROP INDEX IF EXISTS idx_customer_requests_assigned_to;
DROP INDEX IF EXISTS idx_portal_settings_updated_by;
DROP INDEX IF EXISTS idx_customer_requests_quote_id;

-- Payment indexes
DROP INDEX IF EXISTS idx_payments_stripe_payment_intent_id;
DROP INDEX IF EXISTS idx_payments_stripe_charge_id;
DROP INDEX IF EXISTS idx_payments_paypal_transaction_id;
DROP INDEX IF EXISTS idx_payments_paypal_order_id;
DROP INDEX IF EXISTS idx_payments_payment_date;

-- Customer indexes
DROP INDEX IF EXISTS idx_customers_email;
DROP INDEX IF EXISTS idx_customers_status;
DROP INDEX IF EXISTS idx_customers_created_at;
DROP INDEX IF EXISTS idx_customer_users_email;
