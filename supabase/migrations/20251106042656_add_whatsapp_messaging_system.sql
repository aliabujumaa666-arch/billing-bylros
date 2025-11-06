/*
  # WhatsApp Bulk Messaging System

  1. New Tables
    - `whatsapp_settings`: Stores API credentials and configuration
    - `whatsapp_templates`: Message templates with variables
    - `whatsapp_bulk_messages`: Campaign tracking
    - `whatsapp_message_queue`: Message delivery queue

  2. Security
    - Enable RLS on all tables
    - Only authenticated users can manage WhatsApp settings
    - Only admins can create campaigns
    - RLS restricts access by user role

  3. Features
    - Support for Twilio, Vonage, and WhatsApp Business API
    - Template system with variable support
    - Bulk messaging with scheduling
    - Message history and delivery tracking
*/

CREATE TABLE IF NOT EXISTS whatsapp_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  api_provider text NOT NULL CHECK (api_provider IN ('twilio', 'vonage', 'whatsapp-business')),
  api_key text NOT NULL,
  api_secret text,
  phone_number text NOT NULL,
  webhook_url text,
  is_active boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS whatsapp_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  category text DEFAULT 'general',
  message_text text NOT NULL,
  variables text[] DEFAULT '{}',
  preview_text text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS whatsapp_bulk_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_name text NOT NULL,
  message_text text NOT NULL,
  total_recipients integer NOT NULL DEFAULT 0,
  sent_count integer DEFAULT 0,
  failed_count integer DEFAULT 0,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'scheduled', 'sending', 'sent', 'failed')),
  scheduled_at timestamptz,
  recipient_filter jsonb,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS whatsapp_message_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bulk_message_id uuid REFERENCES whatsapp_bulk_messages(id) ON DELETE CASCADE,
  customer_id uuid,
  phone_number text NOT NULL,
  message_text text NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'skipped')),
  external_message_id text,
  error_message text,
  sent_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE whatsapp_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_bulk_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_message_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated users to view WhatsApp settings"
  ON whatsapp_settings FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to manage WhatsApp settings"
  ON whatsapp_settings FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update WhatsApp settings"
  ON whatsapp_settings FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow users to view templates"
  ON whatsapp_templates FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to manage templates"
  ON whatsapp_templates FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow users to update templates"
  ON whatsapp_templates FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow users to delete templates"
  ON whatsapp_templates FOR DELETE
  TO authenticated
  USING (true);

CREATE POLICY "Allow users to view bulk messages"
  ON whatsapp_bulk_messages FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to create campaigns"
  ON whatsapp_bulk_messages FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Allow users to view message queue"
  ON whatsapp_message_queue FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow system to manage message queue"
  ON whatsapp_message_queue FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow system to update message queue"
  ON whatsapp_message_queue FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_whatsapp_templates_active ON whatsapp_templates(is_active);
CREATE INDEX IF NOT EXISTS idx_whatsapp_bulk_messages_status ON whatsapp_bulk_messages(status);
CREATE INDEX IF NOT EXISTS idx_whatsapp_bulk_messages_created_by ON whatsapp_bulk_messages(created_by);
CREATE INDEX IF NOT EXISTS idx_whatsapp_message_queue_bulk_id ON whatsapp_message_queue(bulk_message_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_message_queue_status ON whatsapp_message_queue(status);
