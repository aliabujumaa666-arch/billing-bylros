/*
  # Add WhatsApp Marketing Performance Indexes

  ## Overview
  Adds missing performance indexes to WhatsApp marketing tables for faster queries.

  ## Indexes Added
  - whatsapp_marketing_contacts: Index on list_id (for filtering by contact list)
  - whatsapp_marketing_contacts: Index on status (for filtering active contacts)
  - whatsapp_marketing_campaigns: Index on target_list_id (for linking lists to campaigns)
  - whatsapp_marketing_campaigns: Index on created_by (for filtering user's campaigns)
  - whatsapp_marketing_campaigns: Index on status (for filtering campaign status)
  - whatsapp_campaign_messages: Index on campaign_id (for loading campaign messages)
  - whatsapp_campaign_messages: Index on contact_id (for contact lookup)
  - whatsapp_campaign_messages: Index on status (for filtering message status)

  ## Performance Impact
  These indexes significantly improve query performance for:
  - Loading contacts by list
  - Filtering active/inactive contacts
  - Loading campaigns by creator
  - Loading campaign messages
*/

CREATE INDEX IF NOT EXISTS idx_whatsapp_marketing_contacts_list_id 
  ON whatsapp_marketing_contacts(list_id);

CREATE INDEX IF NOT EXISTS idx_whatsapp_marketing_contacts_status 
  ON whatsapp_marketing_contacts(status);

CREATE INDEX IF NOT EXISTS idx_whatsapp_marketing_campaigns_target_list_id 
  ON whatsapp_marketing_campaigns(target_list_id);

CREATE INDEX IF NOT EXISTS idx_whatsapp_marketing_campaigns_created_by 
  ON whatsapp_marketing_campaigns(created_by);

CREATE INDEX IF NOT EXISTS idx_whatsapp_marketing_campaigns_status 
  ON whatsapp_marketing_campaigns(status);

CREATE INDEX IF NOT EXISTS idx_whatsapp_campaign_messages_campaign_id 
  ON whatsapp_campaign_messages(campaign_id);

CREATE INDEX IF NOT EXISTS idx_whatsapp_campaign_messages_contact_id 
  ON whatsapp_campaign_messages(contact_id);

CREATE INDEX IF NOT EXISTS idx_whatsapp_campaign_messages_status 
  ON whatsapp_campaign_messages(status);
