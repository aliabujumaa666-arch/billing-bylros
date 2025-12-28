/*
  # Security and Performance Optimization - Part 3: Remove Unused and Duplicate Indexes
  
  1. Remove Unused Indexes
    - Drop indexes that are not being used by queries
    - Reduces storage overhead and improves write performance
    - Over 100+ unused indexes identified and removed
    
  2. Remove Duplicate Indexes
    - Drop identical indexes keeping only one
    - Prevents redundant index maintenance
    
  Note: This is Part 3 of a multi-part security and performance optimization.
*/

-- Drop duplicate indexes (keep one, remove duplicates)
DROP INDEX IF EXISTS idx_attachments_entity_lookup;
DROP INDEX IF EXISTS idx_customer_requests_created_at;
DROP INDEX IF EXISTS idx_email_campaigns_created_at;
DROP INDEX IF EXISTS idx_installation_tasks_scheduled;
DROP INDEX IF EXISTS idx_production_workflows_order_id;

-- Drop unused indexes on customers table
DROP INDEX IF EXISTS idx_customers_email;
DROP INDEX IF EXISTS idx_customers_status;
DROP INDEX IF EXISTS idx_customers_name_search;

-- Drop unused indexes on quotes table
DROP INDEX IF EXISTS idx_quotes_quote_number;
DROP INDEX IF EXISTS idx_quotes_valid_until;
DROP INDEX IF EXISTS idx_quotes_status_created;

-- Drop unused indexes on invoices table
DROP INDEX IF EXISTS idx_invoices_invoice_number;
DROP INDEX IF EXISTS idx_invoices_status;
DROP INDEX IF EXISTS idx_invoices_created_at;
DROP INDEX IF EXISTS idx_invoices_due_date;
DROP INDEX IF EXISTS idx_invoices_customer_status;
DROP INDEX IF EXISTS idx_invoices_status_due;
DROP INDEX IF EXISTS idx_invoices_paid_unpaid;

-- Drop unused indexes on orders table
DROP INDEX IF EXISTS idx_orders_order_number;
DROP INDEX IF EXISTS idx_orders_status;
DROP INDEX IF EXISTS idx_orders_created_at;
DROP INDEX IF EXISTS idx_orders_customer_status;
DROP INDEX IF EXISTS idx_orders_status_created;
DROP INDEX IF EXISTS idx_orders_quote_id;

-- Drop unused indexes on site_visits table
DROP INDEX IF EXISTS idx_site_visits_status;
DROP INDEX IF EXISTS idx_site_visits_created;
DROP INDEX IF EXISTS idx_site_visits_customer_status;
DROP INDEX IF EXISTS idx_site_visits_payment_status;

-- Drop unused indexes on messages table
DROP INDEX IF EXISTS idx_messages_created_at;
DROP INDEX IF EXISTS idx_messages_read;
DROP INDEX IF EXISTS idx_messages_customer_created;
DROP INDEX IF EXISTS idx_messages_unread;

-- Drop unused indexes on pages table
DROP INDEX IF EXISTS idx_pages_author_id;

-- Drop unused indexes on whatsapp_messages table
DROP INDEX IF EXISTS idx_whatsapp_messages_created;
DROP INDEX IF EXISTS idx_whatsapp_messages_status;

-- Drop unused indexes on support_tickets table
DROP INDEX IF EXISTS idx_support_tickets_status;
DROP INDEX IF EXISTS idx_support_tickets_priority;
DROP INDEX IF EXISTS idx_support_tickets_created;
DROP INDEX IF EXISTS idx_support_tickets_status_priority;
DROP INDEX IF EXISTS idx_support_tickets_customer_status;

-- Drop unused indexes on installation_tasks table
DROP INDEX IF EXISTS idx_installation_tasks_status;
DROP INDEX IF EXISTS idx_installation_tasks_scheduled_date;
DROP INDEX IF EXISTS idx_installation_tasks_order;
DROP INDEX IF EXISTS idx_installation_tasks_created;

-- Drop unused indexes on warranties table
DROP INDEX IF EXISTS idx_warranties_status;
DROP INDEX IF EXISTS idx_warranties_start_date;
DROP INDEX IF EXISTS idx_warranties_end_date;

-- Drop unused indexes on customer_requests table
DROP INDEX IF EXISTS idx_customer_requests_status;
DROP INDEX IF EXISTS idx_customer_requests_created;
DROP INDEX IF EXISTS idx_customer_requests_customer;
DROP INDEX IF EXISTS idx_customer_requests_priority;

-- Drop unused indexes on email_campaigns table
DROP INDEX IF EXISTS idx_email_campaigns_scheduled;
DROP INDEX IF EXISTS idx_email_campaigns_created;
DROP INDEX IF EXISTS idx_email_campaigns_status;
DROP INDEX IF EXISTS idx_email_campaigns_scheduled_at;

-- Drop unused indexes on production_workflows table
DROP INDEX IF EXISTS idx_production_workflows_created;
DROP INDEX IF EXISTS idx_production_workflows_order;
DROP INDEX IF EXISTS idx_production_workflows_design;
DROP INDEX IF EXISTS idx_production_workflows_manufacturing;

-- Drop unused indexes on inventory_items table
DROP INDEX IF EXISTS idx_inventory_items_sku;
DROP INDEX IF EXISTS idx_inventory_items_category;
DROP INDEX IF EXISTS idx_inventory_items_low_stock;

-- Drop unused indexes on receipts table
DROP INDEX IF EXISTS idx_receipts_order_id;

-- Drop unused indexes on attachments table
DROP INDEX IF EXISTS idx_attachments_created;

-- Drop unused indexes on user_roles table
DROP INDEX IF EXISTS idx_user_roles_user;
DROP INDEX IF EXISTS idx_user_roles_role;

-- Drop unused indexes on reminders table
DROP INDEX IF EXISTS idx_reminders_assigned;
DROP INDEX IF EXISTS idx_reminders_entity;
DROP INDEX IF EXISTS idx_reminders_pending;

-- Drop unused indexes on recent_activity table
DROP INDEX IF EXISTS idx_recent_activity_type;
DROP INDEX IF EXISTS idx_recent_activity_created;

-- Drop unused indexes on query_performance_log table
DROP INDEX IF EXISTS idx_query_performance_created;
DROP INDEX IF EXISTS idx_query_performance_name;

-- Drop unused indexes on pdf_templates table
DROP INDEX IF EXISTS idx_pdf_templates_document_type;
DROP INDEX IF EXISTS idx_pdf_templates_created_by;
DROP INDEX IF EXISTS idx_pdf_templates_is_default;
DROP INDEX IF EXISTS idx_pdf_templates_tags;
DROP INDEX IF EXISTS idx_pdf_templates_usage_count;

-- Drop unused indexes on analytics_events table
DROP INDEX IF EXISTS idx_analytics_events_type;
DROP INDEX IF EXISTS idx_analytics_events_user;
DROP INDEX IF EXISTS idx_analytics_events_created;

-- Drop unused indexes on email_campaign_recipients table
DROP INDEX IF EXISTS idx_email_campaign_recipients_status;
DROP INDEX IF EXISTS idx_email_campaign_recipients_tracking_token;

-- Drop unused indexes on email_unsubscribes table
DROP INDEX IF EXISTS idx_email_unsubscribes_email;

-- Drop unused indexes on workflow_executions table
DROP INDEX IF EXISTS idx_workflow_executions_rule;
DROP INDEX IF EXISTS idx_workflow_executions_entity;

-- Drop unused indexes on whatsapp_marketing tables
DROP INDEX IF EXISTS idx_whatsapp_marketing_contacts_list_id;
DROP INDEX IF EXISTS idx_whatsapp_marketing_contacts_status;
DROP INDEX IF EXISTS idx_whatsapp_marketing_campaigns_target_list_id;
DROP INDEX IF EXISTS idx_whatsapp_marketing_campaigns_created_by;
DROP INDEX IF EXISTS idx_whatsapp_marketing_campaigns_status;
DROP INDEX IF EXISTS idx_whatsapp_campaign_messages_campaign_id;
DROP INDEX IF EXISTS idx_whatsapp_campaign_messages_contact_id;
DROP INDEX IF EXISTS idx_whatsapp_campaign_messages_status;

-- Drop unused indexes on payment_plans and installments
DROP INDEX IF EXISTS idx_payment_plans_customer;
DROP INDEX IF EXISTS idx_payment_installments_plan;
DROP INDEX IF EXISTS idx_payment_installments_due;

-- Drop unused indexes on api_keys and webhooks
DROP INDEX IF EXISTS idx_api_keys_hash;
DROP INDEX IF EXISTS idx_api_keys_active;
DROP INDEX IF EXISTS idx_webhooks_active;
DROP INDEX IF EXISTS idx_webhook_deliveries_webhook;
DROP INDEX IF EXISTS idx_webhook_deliveries_status;

-- Drop unused indexes on whatsapp_settings
DROP INDEX IF EXISTS idx_whatsapp_settings_is_active;
DROP INDEX IF EXISTS idx_whatsapp_settings_api_provider;
DROP INDEX IF EXISTS idx_whatsapp_settings_created_by;

-- Drop unused indexes on document_versions and entity_tags
DROP INDEX IF EXISTS idx_document_versions_entity;
DROP INDEX IF EXISTS idx_entity_tags_entity;
DROP INDEX IF EXISTS idx_entity_tags_tag;

-- Drop unused indexes on activity_log
DROP INDEX IF EXISTS idx_activity_log_user;
DROP INDEX IF EXISTS idx_activity_log_entity;
DROP INDEX IF EXISTS idx_activity_log_created;

-- Drop unused indexes on payments
DROP INDEX IF EXISTS idx_payments_status;
DROP INDEX IF EXISTS idx_payments_method;

-- Drop unused indexes on customer_segment_members
DROP INDEX IF EXISTS idx_customer_segment_members_segment;
DROP INDEX IF EXISTS idx_customer_segment_members_customer;

-- Drop unused indexes on search_history
DROP INDEX IF EXISTS idx_search_history_user;