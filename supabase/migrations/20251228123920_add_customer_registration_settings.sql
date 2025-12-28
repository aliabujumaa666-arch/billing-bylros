/*
  # Add Customer Registration Settings

  ## Overview
  This migration adds settings to control customer self-registration behavior in the customer portal.

  ## 1. New Portal Settings
  - Add `customer_registration` settings to portal_settings table
    - `enabled` (boolean) - Allow/disallow customer self-registration
    - `requireApproval` (boolean) - Require admin approval for new registrations
    - `defaultStatus` (string) - Default status for self-registered customers (Lead/Pending)
    - `notifyAdmin` (boolean) - Send email notification to admin on new registration

  ## 2. Default Configuration
  - Self-registration enabled by default (current behavior)
  - No approval required (customers can login immediately)
  - Default status: "Lead"
  - Admin notifications disabled by default

  ## 3. Security
  - Uses existing RLS policies on portal_settings table
  - Only admins can modify registration settings
  - Public can read settings to determine if registration is allowed

  ## 4. Important Notes
  - Admins can disable self-registration to prevent new customer signups
  - Approval workflow marks customers as "Pending" until admin approves
  - Self-registered customers are marked in notes field for easy identification
*/

-- Insert customer registration settings
INSERT INTO portal_settings (setting_key, setting_value)
VALUES (
  'customer_registration',
  '{
    "enabled": true,
    "requireApproval": false,
    "defaultStatus": "Lead",
    "notifyAdmin": false,
    "allowedDomains": [],
    "blockedDomains": [],
    "customMessage": "Create an account to access your quotes, orders, and invoices."
  }'::jsonb
)
ON CONFLICT (setting_key) 
DO UPDATE SET 
  setting_value = EXCLUDED.setting_value
WHERE portal_settings.setting_value->>'enabled' IS NULL;
