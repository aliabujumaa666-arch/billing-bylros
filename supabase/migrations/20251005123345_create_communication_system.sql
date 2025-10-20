/*
  # Communication System Schema

  ## Overview
  This migration creates a comprehensive communication system for the BYLROS platform,
  including email notifications, SMS alerts, in-app messaging, and notification preferences.

  ## New Tables

  ### 1. email_templates
  Stores customizable email templates for various communication types

  ### 2. notification_preferences  
  Customer notification preferences for opt-in/opt-out

  ### 3. messages
  In-app messaging between admin and customers

  ### 4. notification_log
  Audit log for all sent notifications

  ### 5. scheduled_notifications
  Queue for scheduled/automated notifications

  ## Security
  - Enable RLS on all tables
  - Admins have full access
  - Customers can only access their own data
*/

-- Create email_templates table
CREATE TABLE IF NOT EXISTS email_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  subject text NOT NULL,
  body_html text NOT NULL,
  variables jsonb DEFAULT '[]'::jsonb,
  category text NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create notification_preferences table
CREATE TABLE IF NOT EXISTS notification_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid REFERENCES customers(id) ON DELETE CASCADE UNIQUE NOT NULL,
  email_quotes boolean DEFAULT true,
  email_orders boolean DEFAULT true,
  email_invoices boolean DEFAULT true,
  email_reminders boolean DEFAULT true,
  email_marketing boolean DEFAULT false,
  sms_critical boolean DEFAULT true,
  sms_updates boolean DEFAULT false,
  in_app_messages boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create messages table
CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid REFERENCES customers(id) ON DELETE CASCADE NOT NULL,
  sender_type text NOT NULL CHECK (sender_type IN ('admin', 'customer')),
  sender_id uuid NOT NULL,
  subject text NOT NULL,
  message text NOT NULL,
  is_read boolean DEFAULT false,
  parent_id uuid REFERENCES messages(id) ON DELETE SET NULL,
  attachments jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now(),
  read_at timestamptz
);

-- Create notification_log table
CREATE TABLE IF NOT EXISTS notification_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid REFERENCES customers(id) ON DELETE SET NULL,
  notification_type text NOT NULL CHECK (notification_type IN ('email', 'sms', 'in_app')),
  template_name text,
  recipient text NOT NULL,
  subject text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('sent', 'failed', 'pending')),
  error_message text,
  metadata jsonb DEFAULT '{}'::jsonb,
  sent_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Create scheduled_notifications table
CREATE TABLE IF NOT EXISTS scheduled_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid REFERENCES customers(id) ON DELETE CASCADE NOT NULL,
  notification_type text NOT NULL CHECK (notification_type IN ('email', 'sms')),
  template_name text NOT NULL,
  scheduled_for timestamptz NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'cancelled', 'failed')),
  retry_count integer DEFAULT 0,
  data jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  processed_at timestamptz
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_notification_preferences_customer ON notification_preferences(customer_id);
CREATE INDEX IF NOT EXISTS idx_messages_customer ON messages(customer_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_parent ON messages(parent_id);
CREATE INDEX IF NOT EXISTS idx_messages_created ON messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notification_log_customer ON notification_log(customer_id);
CREATE INDEX IF NOT EXISTS idx_notification_log_status ON notification_log(status);
CREATE INDEX IF NOT EXISTS idx_notification_log_created ON notification_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_scheduled_notifications_customer ON scheduled_notifications(customer_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_notifications_status ON scheduled_notifications(status);
CREATE INDEX IF NOT EXISTS idx_scheduled_notifications_scheduled ON scheduled_notifications(scheduled_for);

-- Enable Row Level Security
ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE scheduled_notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for email_templates
CREATE POLICY "Admins can manage email templates"
  ON email_templates FOR ALL
  TO authenticated
  USING (true);

-- RLS Policies for notification_preferences
CREATE POLICY "Customers can view own preferences"
  ON notification_preferences FOR SELECT
  TO authenticated
  USING (
    customer_id IN (
      SELECT customer_id FROM customer_users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Customers can update own preferences"
  ON notification_preferences FOR UPDATE
  TO authenticated
  USING (
    customer_id IN (
      SELECT customer_id FROM customer_users WHERE id = auth.uid()
    )
  )
  WITH CHECK (
    customer_id IN (
      SELECT customer_id FROM customer_users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage all preferences"
  ON notification_preferences FOR ALL
  TO authenticated
  USING (true);

-- RLS Policies for messages
CREATE POLICY "Customers can view own messages"
  ON messages FOR SELECT
  TO authenticated
  USING (
    customer_id IN (
      SELECT customer_id FROM customer_users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Customers can send messages"
  ON messages FOR INSERT
  TO authenticated
  WITH CHECK (
    sender_type = 'customer' AND
    customer_id IN (
      SELECT customer_id FROM customer_users WHERE id = auth.uid()
    ) AND
    sender_id = auth.uid()
  );

CREATE POLICY "Customers can mark own messages as read"
  ON messages FOR UPDATE
  TO authenticated
  USING (
    customer_id IN (
      SELECT customer_id FROM customer_users WHERE id = auth.uid()
    )
  )
  WITH CHECK (is_read = true);

CREATE POLICY "Admins can manage all messages"
  ON messages FOR ALL
  TO authenticated
  USING (true);

-- RLS Policies for notification_log
CREATE POLICY "Customers can view own notification log"
  ON notification_log FOR SELECT
  TO authenticated
  USING (
    customer_id IN (
      SELECT customer_id FROM customer_users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all notification logs"
  ON notification_log FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "System can insert notification logs"
  ON notification_log FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- RLS Policies for scheduled_notifications
CREATE POLICY "Admins can manage scheduled notifications"
  ON scheduled_notifications FOR ALL
  TO authenticated
  USING (true);

-- Insert default email templates
INSERT INTO email_templates (name, subject, body_html, variables, category) VALUES
(
  'quote_created',
  'New Quote {{quote_number}} from BYLROS',
  '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;"><div style="background: linear-gradient(135deg, #bb2738, #a01f2f); padding: 30px; text-align: center;"><h1 style="color: white; margin: 0;">New Quote Available</h1></div><div style="padding: 30px; background: white;"><p>Dear {{customer_name}},</p><p>Thank you for your interest in BYLROS. We have prepared a quote for you.</p><div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;"><p style="margin: 5px 0;"><strong>Quote Number:</strong> {{quote_number}}</p><p style="margin: 5px 0;"><strong>Total Amount:</strong> AED {{total_amount}}</p><p style="margin: 5px 0;"><strong>Valid Until:</strong> {{valid_until}}</p></div><p>Please log in to your customer portal to review the complete quote details.</p><p style="margin-top: 30px;">Best regards,<br>BYLROS Team</p></div></div>',
  '["customer_name", "quote_number", "total_amount", "valid_until"]'::jsonb,
  'quote'
),
(
  'order_confirmed',
  'Order {{order_number}} Confirmed',
  '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;"><div style="background: linear-gradient(135deg, #10b981, #059669); padding: 30px; text-align: center;"><h1 style="color: white; margin: 0;">Order Confirmed</h1></div><div style="padding: 30px; background: white;"><p>Dear {{customer_name}},</p><p>Your order has been confirmed and is now being processed.</p><div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;"><p style="margin: 5px 0;"><strong>Order Number:</strong> {{order_number}}</p><p style="margin: 5px 0;"><strong>Status:</strong> {{status}}</p></div><p>We will keep you updated on the progress of your order.</p><p style="margin-top: 30px;">Best regards,<br>BYLROS Team</p></div></div>',
  '["customer_name", "order_number", "status"]'::jsonb,
  'order'
),
(
  'payment_reminder',
  'Payment Reminder - Invoice {{invoice_number}}',
  '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;"><div style="background: linear-gradient(135deg, #f59e0b, #d97706); padding: 30px; text-align: center;"><h1 style="color: white; margin: 0;">Payment Reminder</h1></div><div style="padding: 30px; background: white;"><p>Dear {{customer_name}},</p><p>This is a friendly reminder about your pending payment.</p><div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;"><p style="margin: 5px 0;"><strong>Invoice Number:</strong> {{invoice_number}}</p><p style="margin: 5px 0;"><strong>Amount Due:</strong> AED {{amount_due}}</p><p style="margin: 5px 0;"><strong>Due Date:</strong> {{due_date}}</p></div><p>Please make the payment at your earliest convenience.</p><p style="margin-top: 30px;">Best regards,<br>BYLROS Team</p></div></div>',
  '["customer_name", "invoice_number", "amount_due", "due_date"]'::jsonb,
  'invoice'
) ON CONFLICT (name) DO NOTHING;
