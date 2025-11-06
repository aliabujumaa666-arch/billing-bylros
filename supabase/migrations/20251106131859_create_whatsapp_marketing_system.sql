/*
  # WhatsApp Marketing Management System

  1. New Tables
    - `whatsapp_contact_lists`
      - `id` (uuid, primary key)
      - `name` (text) - List name
      - `description` (text) - List description
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `whatsapp_marketing_contacts`
      - `id` (uuid, primary key)
      - `list_id` (uuid, foreign key to whatsapp_contact_lists)
      - `name` (text) - Contact name
      - `phone_number` (text) - WhatsApp phone number
      - `email` (text, optional) - Contact email
      - `tags` (text array) - Tags for segmentation
      - `notes` (text) - Additional notes
      - `status` (text) - active, inactive, unsubscribed
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `whatsapp_marketing_campaigns`
      - `id` (uuid, primary key)
      - `name` (text) - Campaign name
      - `description` (text) - Campaign description
      - `message_template` (text) - Message template with variables
      - `target_list_id` (uuid, foreign key to whatsapp_contact_lists)
      - `status` (text) - draft, active, completed, paused
      - `scheduled_date` (timestamptz, optional) - When to send
      - `created_by` (uuid, foreign key to auth.users)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `whatsapp_campaign_messages`
      - `id` (uuid, primary key)
      - `campaign_id` (uuid, foreign key to whatsapp_marketing_campaigns)
      - `contact_id` (uuid, foreign key to whatsapp_marketing_contacts)
      - `message_content` (text) - Personalized message
      - `status` (text) - pending, sent, failed, skipped
      - `sent_at` (timestamptz, optional)
      - `notes` (text) - Delivery notes or errors
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage their own marketing data
    
  3. Indexes
    - Add indexes for frequently queried columns (list_id, campaign_id, status, phone_number)
*/

-- Create whatsapp_contact_lists table
CREATE TABLE IF NOT EXISTS whatsapp_contact_lists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE whatsapp_contact_lists ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can manage contact lists"
  ON whatsapp_contact_lists
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create whatsapp_marketing_contacts table
CREATE TABLE IF NOT EXISTS whatsapp_marketing_contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  list_id uuid REFERENCES whatsapp_contact_lists(id) ON DELETE CASCADE,
  name text NOT NULL,
  phone_number text NOT NULL,
  email text DEFAULT '',
  tags text[] DEFAULT '{}',
  notes text DEFAULT '',
  status text DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'unsubscribed')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE whatsapp_marketing_contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view marketing contacts"
  ON whatsapp_marketing_contacts
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert marketing contacts"
  ON whatsapp_marketing_contacts
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update marketing contacts"
  ON whatsapp_marketing_contacts
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete marketing contacts"
  ON whatsapp_marketing_contacts
  FOR DELETE
  TO authenticated
  USING (true);

-- Create index on list_id for faster queries
CREATE INDEX IF NOT EXISTS idx_whatsapp_marketing_contacts_list_id 
  ON whatsapp_marketing_contacts(list_id);

CREATE INDEX IF NOT EXISTS idx_whatsapp_marketing_contacts_status 
  ON whatsapp_marketing_contacts(status);

CREATE INDEX IF NOT EXISTS idx_whatsapp_marketing_contacts_phone 
  ON whatsapp_marketing_contacts(phone_number);

-- Create whatsapp_marketing_campaigns table
CREATE TABLE IF NOT EXISTS whatsapp_marketing_campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text DEFAULT '',
  message_template text NOT NULL,
  target_list_id uuid REFERENCES whatsapp_contact_lists(id) ON DELETE SET NULL,
  status text DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'completed', 'paused')),
  scheduled_date timestamptz,
  created_by uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE whatsapp_marketing_campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view marketing campaigns"
  ON whatsapp_marketing_campaigns
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert marketing campaigns"
  ON whatsapp_marketing_campaigns
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Authenticated users can update their marketing campaigns"
  ON whatsapp_marketing_campaigns
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = created_by)
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Authenticated users can delete their marketing campaigns"
  ON whatsapp_marketing_campaigns
  FOR DELETE
  TO authenticated
  USING (auth.uid() = created_by);

-- Create index on target_list_id and status for faster queries
CREATE INDEX IF NOT EXISTS idx_whatsapp_marketing_campaigns_list_id 
  ON whatsapp_marketing_campaigns(target_list_id);

CREATE INDEX IF NOT EXISTS idx_whatsapp_marketing_campaigns_status 
  ON whatsapp_marketing_campaigns(status);

CREATE INDEX IF NOT EXISTS idx_whatsapp_marketing_campaigns_created_by 
  ON whatsapp_marketing_campaigns(created_by);

-- Create whatsapp_campaign_messages table
CREATE TABLE IF NOT EXISTS whatsapp_campaign_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid REFERENCES whatsapp_marketing_campaigns(id) ON DELETE CASCADE,
  contact_id uuid REFERENCES whatsapp_marketing_contacts(id) ON DELETE CASCADE,
  message_content text NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'skipped')),
  sent_at timestamptz,
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE whatsapp_campaign_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view campaign messages"
  ON whatsapp_campaign_messages
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert campaign messages"
  ON whatsapp_campaign_messages
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update campaign messages"
  ON whatsapp_campaign_messages
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete campaign messages"
  ON whatsapp_campaign_messages
  FOR DELETE
  TO authenticated
  USING (true);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_whatsapp_campaign_messages_campaign_id 
  ON whatsapp_campaign_messages(campaign_id);

CREATE INDEX IF NOT EXISTS idx_whatsapp_campaign_messages_contact_id 
  ON whatsapp_campaign_messages(contact_id);

CREATE INDEX IF NOT EXISTS idx_whatsapp_campaign_messages_status 
  ON whatsapp_campaign_messages(status);