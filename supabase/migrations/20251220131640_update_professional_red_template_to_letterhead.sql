/*
  # Update Professional Red Template to Letterhead Style
  
  ## Overview
  Updates the Professional Red PDF template to use letterhead-style header instead of gradient header.
  This matches the classic letterhead design with logo, company info in two columns, and red separator line.
  
  ## Changes
  - Header style changed from "gradient" to "letterhead"
  - Header text color changed from white (#ffffff) to black (#000000)
  - Logo size reduced from 40x40 to 20x20 for better proportions
  - Header height adjusted from 55 to 42 to match letterhead layout
  - Tagline disabled for cleaner letterhead look
  
  ## Impact
  All PDFs using the Professional Red template will now display with the classic letterhead header format
  featuring a white background, black text, and red accent line separator.
*/

-- Update the Professional Red template settings
UPDATE pdf_templates
SET 
  settings = jsonb_set(
    jsonb_set(
      jsonb_set(
        jsonb_set(
          jsonb_set(
            jsonb_set(
              settings,
              '{header,headerStyle}',
              '"letterhead"'
            ),
            '{header,headerTextColor}',
            '"#000000"'
          ),
          '{header,showTagline}',
          'false'
        ),
        '{logo,logoWidth}',
        '20'
      ),
      '{logo,logoHeight}',
      '20'
    ),
    '{layout,headerHeight}',
    '42'
  ),
  updated_at = now()
WHERE name = 'Professional Red' AND is_system = true;