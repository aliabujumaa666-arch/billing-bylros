/*
  # Add Document Title and Info Boxes Settings to PDF Templates

  ## Overview
  Adds new customization settings for document title section and info boxes to all existing PDF templates.
  This allows users to fully customize the appearance of the quotation title bar and the quote details/customer info boxes.

  ## New Settings Added

  ### Document Title Section
  - Title text (customizable, e.g., "QUOTATION", "INVOICE", etc.)
  - Font size and weight
  - Text color and background color with opacity
  - Border radius and padding
  - Reference number display and positioning
  - Reference font size

  ### Info Boxes Section  
  - Layout style (side-by-side or stacked)
  - Background and border colors
  - Border width and radius
  - Label and value text styling (colors, sizes, weights)
  - Box spacing between elements
  - Optional emoji icons for phone and email

  ## Impact
  All existing PDF templates will be updated with default values for these new settings.
  Users can now customize every aspect of the document title and info boxes through the settings page.
*/

-- Update all existing pdf_templates to include the new documentTitle and infoBoxes settings
UPDATE pdf_templates
SET settings = settings || jsonb_build_object(
  'documentTitle', jsonb_build_object(
    'fontSize', 22,
    'fontWeight', 'bold',
    'textColor', '#bb2738',
    'backgroundColor', '#bb2738',
    'backgroundOpacity', 0.1,
    'borderRadius', 2,
    'padding', 12,
    'showReferenceNumber', true,
    'referencePosition', 'right',
    'referenceFontSize', 9,
    'titleText', 'QUOTATION'
  ),
  'infoBoxes', jsonb_build_object(
    'backgroundColor', '#fafbfc',
    'borderColor', '#e2e8f0',
    'borderWidth', 1,
    'borderRadius', 2,
    'padding', 4,
    'labelColor', '#64748b',
    'labelFontSize', 8,
    'labelFontWeight', 'normal',
    'valueColor', '#1e293b',
    'valueFontSize', 9,
    'valueFontWeight', 'bold',
    'boxSpacing', 10,
    'boxShadow', false,
    'layout', 'side-by-side',
    'showIcons', false
  )
)
WHERE settings->>'documentTitle' IS NULL;

-- Update the updated_at timestamp for affected templates
UPDATE pdf_templates
SET updated_at = now()
WHERE settings->>'documentTitle' IS NOT NULL;