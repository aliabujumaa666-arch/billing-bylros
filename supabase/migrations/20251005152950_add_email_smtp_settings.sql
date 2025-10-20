/*
  # Add Email SMTP Settings Table

  1. New Tables
    - email_smtp_settings
      - id (uuid, primary key)
      - smtp_host (text) - SMTP server hostname
      - smtp_port (integer) - SMTP port (465 for SSL/TLS)
      - smtp_username (text) - Email account username
      - smtp_password (text) - Email account password (encrypted)
      - imap_host (text) - IMAP server hostname
      - imap_port (integer) - IMAP port (993 for SSL/TLS)
      - pop3_port (integer) - POP3 port (995 for SSL/TLS)
      - use_ssl (boolean) - Whether to use SSL/TLS
      - from_email (text) - Default sender email address
      - from_name (text) - Default sender name
      - is_active (boolean) - Whether this configuration is active
      - created_at (timestamptz)
      - updated_at (timestamptz)

  2. Security
    - Enable RLS on email_smtp_settings table
    - Add policy for authenticated users to read settings
    - Add policy for authenticated users to update settings
    - Add policy for authenticated users to insert settings
*/

CREATE TABLE IF NOT EXISTS email_smtp_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  smtp_host text NOT NULL,
  smtp_port integer NOT NULL DEFAULT 465,
  smtp_username text NOT NULL,
  smtp_password text NOT NULL,
  imap_host text NOT NULL,
  imap_port integer NOT NULL DEFAULT 993,
  pop3_port integer NOT NULL DEFAULT 995,
  use_ssl boolean DEFAULT true,
  from_email text NOT NULL,
  from_name text DEFAULT 'BYLROS',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE email_smtp_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read SMTP settings"
  ON email_smtp_settings
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert SMTP settings"
  ON email_smtp_settings
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update SMTP settings"
  ON email_smtp_settings
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete SMTP settings"
  ON email_smtp_settings
  FOR DELETE
  TO authenticated
  USING (true);