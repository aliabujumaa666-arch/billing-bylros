/*
  # Email Marketing System

  1. New Tables
    - `email_campaigns`
      - `id` (uuid, primary key)
      - `name` (text) - Campaign name
      - `subject` (text) - Email subject line
      - `from_name` (text) - Sender name
      - `from_email` (text) - Sender email
      - `reply_to` (text) - Reply-to email
      - `body_html` (text) - HTML email body
      - `body_text` (text) - Plain text version
      - `status` (text) - draft, scheduled, sending, sent, paused
      - `scheduled_at` (timestamptz) - When to send
      - `sent_at` (timestamptz) - When actually sent
      - `target_audience` (text) - all, leads, quoted, ordered, delivered, installed, custom
      - `custom_filter` (jsonb) - Advanced filtering criteria
      - `total_recipients` (integer) - Total number of recipients
      - `sent_count` (integer) - Number of emails sent
      - `delivered_count` (integer) - Number delivered
      - `opened_count` (integer) - Number opened
      - `clicked_count` (integer) - Number clicked
      - `bounced_count` (integer) - Number bounced
      - `unsubscribed_count` (integer) - Number unsubscribed
      - `created_by` (uuid) - User who created the campaign
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `email_campaign_recipients`
      - `id` (uuid, primary key)
      - `campaign_id` (uuid, foreign key to email_campaigns)
      - `customer_id` (uuid, foreign key to customers)
      - `email` (text) - Recipient email
      - `status` (text) - pending, sent, delivered, opened, clicked, bounced, failed
      - `sent_at` (timestamptz)
      - `delivered_at` (timestamptz)
      - `opened_at` (timestamptz)
      - `clicked_at` (timestamptz)
      - `bounced_at` (timestamptz)
      - `bounce_reason` (text)
      - `open_count` (integer) - Number of times opened
      - `click_count` (integer) - Number of times clicked
      - `tracking_token` (text) - Unique token for tracking
      - `created_at` (timestamptz)

    - `email_unsubscribes`
      - `id` (uuid, primary key)
      - `email` (text, unique) - Unsubscribed email
      - `customer_id` (uuid, foreign key to customers)
      - `reason` (text) - Reason for unsubscribing
      - `unsubscribed_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated admin users
*/

-- Create email campaigns table
CREATE TABLE IF NOT EXISTS email_campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  subject text NOT NULL,
  from_name text NOT NULL DEFAULT 'BYLROS',
  from_email text NOT NULL,
  reply_to text,
  body_html text NOT NULL,
  body_text text,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'sending', 'sent', 'paused', 'cancelled')),
  scheduled_at timestamptz,
  sent_at timestamptz,
  target_audience text NOT NULL DEFAULT 'all' CHECK (target_audience IN ('all', 'leads', 'quoted', 'ordered', 'delivered', 'installed', 'custom')),
  custom_filter jsonb,
  total_recipients integer DEFAULT 0,
  sent_count integer DEFAULT 0,
  delivered_count integer DEFAULT 0,
  opened_count integer DEFAULT 0,
  clicked_count integer DEFAULT 0,
  bounced_count integer DEFAULT 0,
  unsubscribed_count integer DEFAULT 0,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create campaign recipients table
CREATE TABLE IF NOT EXISTS email_campaign_recipients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid REFERENCES email_campaigns(id) ON DELETE CASCADE NOT NULL,
  customer_id uuid REFERENCES customers(id) ON DELETE CASCADE,
  email text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'delivered', 'opened', 'clicked', 'bounced', 'failed')),
  sent_at timestamptz,
  delivered_at timestamptz,
  opened_at timestamptz,
  clicked_at timestamptz,
  bounced_at timestamptz,
  bounce_reason text,
  open_count integer DEFAULT 0,
  click_count integer DEFAULT 0,
  tracking_token text UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
  created_at timestamptz DEFAULT now()
);

-- Create unsubscribes table
CREATE TABLE IF NOT EXISTS email_unsubscribes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  customer_id uuid REFERENCES customers(id) ON DELETE SET NULL,
  reason text,
  unsubscribed_at timestamptz DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_email_campaigns_status ON email_campaigns(status);
CREATE INDEX IF NOT EXISTS idx_email_campaigns_created_at ON email_campaigns(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_email_campaigns_scheduled_at ON email_campaigns(scheduled_at) WHERE status = 'scheduled';
CREATE INDEX IF NOT EXISTS idx_email_campaign_recipients_campaign_id ON email_campaign_recipients(campaign_id);
CREATE INDEX IF NOT EXISTS idx_email_campaign_recipients_customer_id ON email_campaign_recipients(customer_id);
CREATE INDEX IF NOT EXISTS idx_email_campaign_recipients_status ON email_campaign_recipients(status);
CREATE INDEX IF NOT EXISTS idx_email_campaign_recipients_tracking_token ON email_campaign_recipients(tracking_token);
CREATE INDEX IF NOT EXISTS idx_email_unsubscribes_email ON email_unsubscribes(email);

-- Enable Row Level Security
ALTER TABLE email_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_campaign_recipients ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_unsubscribes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for email_campaigns
CREATE POLICY "Authenticated users can view campaigns"
  ON email_campaigns
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create campaigns"
  ON email_campaigns
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update campaigns"
  ON email_campaigns
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete campaigns"
  ON email_campaigns
  FOR DELETE
  TO authenticated
  USING (true);

-- RLS Policies for email_campaign_recipients
CREATE POLICY "Authenticated users can view recipients"
  ON email_campaign_recipients
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create recipients"
  ON email_campaign_recipients
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update recipients"
  ON email_campaign_recipients
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete recipients"
  ON email_campaign_recipients
  FOR DELETE
  TO authenticated
  USING (true);

-- RLS Policies for email_unsubscribes
CREATE POLICY "Public can insert unsubscribes"
  ON email_unsubscribes
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Authenticated users can view unsubscribes"
  ON email_unsubscribes
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can delete unsubscribes"
  ON email_unsubscribes
  FOR DELETE
  TO authenticated
  USING (true);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_email_campaign_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS update_email_campaigns_updated_at ON email_campaigns;
CREATE TRIGGER update_email_campaigns_updated_at
  BEFORE UPDATE ON email_campaigns
  FOR EACH ROW
  EXECUTE FUNCTION update_email_campaign_updated_at();
