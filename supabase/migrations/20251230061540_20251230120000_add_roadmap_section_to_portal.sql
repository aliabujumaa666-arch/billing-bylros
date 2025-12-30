/*
  # Add Roadmap Section to Customer Portal Homepage

  ## Overview
  This migration adds a roadmap section to the customer portal homepage settings,
  allowing admins to showcase their company's workflow process to customers.

  ## Changes
  1. Updates the existing portal_settings record for 'home_page'
  2. Adds a new "roadmap" section in the settings JSONB with:
     - enabled (boolean) - Toggle to show/hide the section
     - title (text) - Section heading
     - subtitle (text) - Description text
     - backgroundColor (hex color) - Background color for the section
     - steps (array) - Ordered list of process steps

  ## Roadmap Steps Structure
  Each step contains:
  - order (number) - Sequential step number
  - icon (text) - Lucide icon name
  - title (text) - Step name
  - description (text) - Step explanation

  ## Default Roadmap
  Pre-configured with a 5-step workflow suitable for aluminium & glass solutions:
  1. Request Quote - Initial consultation
  2. Review & Approval - Quote review and approval
  3. Production - Manufacturing process
  4. Installation - On-site installation
  5. Final Inspection - Quality check and handover

  ## Security
  - Uses existing RLS policies on portal_settings table
  - No additional security changes required
*/

-- Update the home_page settings to include roadmap section
UPDATE portal_settings
SET setting_value = jsonb_set(
  setting_value,
  '{roadmap}',
  '{
    "enabled": true,
    "title": "How We Work",
    "subtitle": "Our streamlined process ensures quality results from start to finish",
    "backgroundColor": "#f8fafc",
    "steps": [
      {
        "order": 1,
        "icon": "FileSearch",
        "title": "Request Quote",
        "description": "Share your requirements and we will create a detailed quote tailored to your needs"
      },
      {
        "order": 2,
        "icon": "CheckCircle",
        "title": "Review & Approval",
        "description": "Review the quote, ask questions, and approve when ready to proceed"
      },
      {
        "order": 3,
        "icon": "Hammer",
        "title": "Production",
        "description": "Our skilled team manufactures your aluminium and glass products with precision"
      },
      {
        "order": 4,
        "icon": "Truck",
        "title": "Installation",
        "description": "Professional installation by our experienced technicians at your site"
      },
      {
        "order": 5,
        "icon": "Award",
        "title": "Final Inspection",
        "description": "Quality check and handover ensuring everything meets our high standards"
      }
    ]
  }'::jsonb,
  true
)
WHERE setting_key = 'home_page';
