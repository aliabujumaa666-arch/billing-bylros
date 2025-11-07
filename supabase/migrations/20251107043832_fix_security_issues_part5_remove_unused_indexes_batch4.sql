/*
  # Security Fix Part 5: Remove Unused Indexes - Batch 4

  1. Remove Remaining Unused Indexes
    - Knowledge base, FAQs, videos, messages, WhatsApp marketing, and misc indexes
  
  2. Notes
    - Completes unused index cleanup
    - Improves overall database performance
*/

-- Knowledge base indexes
DROP INDEX IF EXISTS idx_kb_articles_category_id;
DROP INDEX IF EXISTS idx_kb_articles_slug;
DROP INDEX IF EXISTS idx_kb_articles_published;
DROP INDEX IF EXISTS idx_kb_articles_search;

-- FAQ indexes
DROP INDEX IF EXISTS idx_faqs_category;
DROP INDEX IF EXISTS idx_faqs_active;
DROP INDEX IF EXISTS idx_faqs_search;

-- Tutorial indexes
DROP INDEX IF EXISTS idx_tutorials_category;
DROP INDEX IF EXISTS idx_tutorials_published;

-- Support ticket indexes
DROP INDEX IF EXISTS idx_support_tickets_number;
DROP INDEX IF EXISTS idx_support_tickets_status;

-- Feedback and changelog indexes
DROP INDEX IF EXISTS idx_feedback_status;
DROP INDEX IF EXISTS idx_changelog_published;

-- Page indexes
DROP INDEX IF EXISTS idx_pages_published;
DROP INDEX IF EXISTS idx_pages_header;
DROP INDEX IF EXISTS idx_pages_footer;

-- Message indexes
DROP INDEX IF EXISTS idx_messages_sender;
DROP INDEX IF EXISTS idx_messages_created;
DROP INDEX IF EXISTS idx_messages_ai_generated;

-- WhatsApp conversation indexes
DROP INDEX IF EXISTS idx_conversations_admin;
DROP INDEX IF EXISTS idx_conversations_last_message;
DROP INDEX IF EXISTS idx_conversations_unread;
DROP INDEX IF EXISTS idx_messages_status;

-- WhatsApp AI training indexes
DROP INDEX IF EXISTS idx_ai_training_message;
DROP INDEX IF EXISTS idx_ai_training_rating;
DROP INDEX IF EXISTS idx_quick_replies_category;

-- WhatsApp bulk messaging indexes
DROP INDEX IF EXISTS idx_whatsapp_bulk_messages_created_by;
DROP INDEX IF EXISTS idx_whatsapp_message_queue_bulk_id;
DROP INDEX IF EXISTS idx_whatsapp_message_queue_status;
DROP INDEX IF EXISTS idx_whatsapp_templates_active;
DROP INDEX IF EXISTS idx_whatsapp_bulk_messages_status;
DROP INDEX IF EXISTS idx_whatsapp_logs_bulk_message;

-- WhatsApp marketing indexes
DROP INDEX IF EXISTS idx_whatsapp_marketing_contacts_list_id;
DROP INDEX IF EXISTS idx_whatsapp_marketing_contacts_status;
DROP INDEX IF EXISTS idx_whatsapp_marketing_contacts_phone;
DROP INDEX IF EXISTS idx_whatsapp_marketing_campaigns_list_id;
DROP INDEX IF EXISTS idx_whatsapp_marketing_campaigns_status;
DROP INDEX IF EXISTS idx_whatsapp_marketing_campaigns_created_by;
DROP INDEX IF EXISTS idx_whatsapp_campaign_messages_campaign_id;
DROP INDEX IF EXISTS idx_whatsapp_campaign_messages_contact_id;
DROP INDEX IF EXISTS idx_whatsapp_campaign_messages_status;

-- Keyboard shortcuts indexes
DROP INDEX IF EXISTS idx_keyboard_shortcuts_action;
DROP INDEX IF EXISTS idx_keyboard_shortcuts_enabled;

-- Inventory indexes
DROP INDEX IF EXISTS idx_inventory_items_sku;
DROP INDEX IF EXISTS idx_inventory_items_type;
DROP INDEX IF EXISTS idx_inventory_transactions_item_id;

-- Installation tasks indexes
DROP INDEX IF EXISTS idx_installation_tasks_assigned_to;

-- Attachment indexes
DROP INDEX IF EXISTS idx_attachments_created_at;

-- Recently added unused indexes
DROP INDEX IF EXISTS idx_whatsapp_queue_retry;
DROP INDEX IF EXISTS idx_whatsapp_queue_pending;
DROP INDEX IF EXISTS idx_whatsapp_bulk_scheduled;
