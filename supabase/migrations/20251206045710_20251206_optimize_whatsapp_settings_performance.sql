/*
  # Optimize WhatsApp Settings Performance

  ## Overview
  Adds performance indexes and improves the whatsapp_settings table for better query performance.

  ## Indexes Added
  - api_provider: For filtering by provider type
  - is_active: For quickly finding active settings
  - created_by: For finding user-specific settings

  ## Performance Impact
  These indexes improve performance for:
  - Loading active WhatsApp settings
  - Filtering by provider
  - Finding user's configurations
*/

CREATE INDEX IF NOT EXISTS idx_whatsapp_settings_is_active 
  ON whatsapp_settings(is_active);

CREATE INDEX IF NOT EXISTS idx_whatsapp_settings_api_provider 
  ON whatsapp_settings(api_provider);

CREATE INDEX IF NOT EXISTS idx_whatsapp_settings_created_by 
  ON whatsapp_settings(created_by);
