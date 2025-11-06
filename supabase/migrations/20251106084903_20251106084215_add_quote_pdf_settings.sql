/*
  # Add Quote PDF Styling Settings

  ## Overview
  Extends the brand_settings table to include comprehensive PDF styling configuration for quotes.
  This allows customization of fonts, colors, layouts, headers, footers, logos, watermarks, and terms.

  ## 1. Changes to Existing Tables

  ### `brand_settings` Extension
  The setting_value JSONB field will be extended with a new `pdf` section containing:

  #### Fonts Configuration
  - `headerFont`: Font family for headers
  - `bodyFont`: Font family for body text
  - `headerFontSize`: Default header font size
  - `bodyFontSize`: Default body text font size
  - `tableFontSize`: Font size for table content
  - `footerFontSize`: Font size for footer text

  #### Colors Configuration
  - `tableHeaderBg`: Background color for table headers
  - `tableHeaderText`: Text color for table headers
  - `tableRowAlternate`: Alternate row background color
  - `tableBorder`: Table border color
  - `accentColor`: Accent color for highlights
  - `textPrimary`: Primary text color
  - `textSecondary`: Secondary text color

  #### Layout Configuration
  - `marginTop`: Top page margin
  - `marginRight`: Right page margin
  - `marginBottom`: Bottom page margin
  - `marginLeft`: Left page margin
  - `headerHeight`: Height of header section
  - `footerHeight`: Height of footer section
  - `contentSpacing`: Spacing between content sections

  #### Logo Configuration
  - `showLogo`: Whether to display logo
  - `logoPosition`: Logo position (left, center, right)
  - `logoWidth`: Logo width
  - `logoHeight`: Logo height

  #### Header Configuration
  - `showHeader`: Whether to show custom header
  - `headerStyle`: Header style (simple, gradient, bordered)
  - `showCompanyInfo`: Show company info in header
  - `headerTextColor`: Header text color

  #### Footer Configuration
  - `showFooter`: Whether to show footer
  - `footerText`: Custom footer text (supports variables)
  - `showPageNumbers`: Show page numbers
  - `showGenerationDate`: Show generation date

  #### Watermark Configuration
  - `enableWatermark`: Whether to show watermark
  - `watermarkText`: Watermark text
  - `watermarkOpacity`: Watermark opacity (0-1)
  - `watermarkAngle`: Watermark rotation angle
  - `watermarkFontSize`: Watermark font size

  #### Terms and Conditions
  - `termsTitle`: Title for terms section
  - `termsContent`: Array of terms text
  - `termsStyle`: Terms section style (box, simple, bordered)
  - `showTerms`: Whether to show terms section

  ## 2. Migration Actions
  - No schema changes required (uses existing JSONB flexibility)
  - Updates existing brand record with default PDF settings
  - Maintains backward compatibility with existing settings

  ## 3. Important Notes
  - All settings have sensible defaults matching current PDF design
  - Settings are optional; missing values fall back to hardcoded defaults
  - Colors use hex format (#RRGGBB)
  - Measurements use PDF units (typically millimeters or points)
  - Template variables supported in footer text: {date}, {time}, {page}, {quote_number}
*/

-- Update the existing brand settings record to include PDF configuration
-- This is a safe operation that adds to the JSONB without affecting existing data
UPDATE brand_settings
SET setting_value = setting_value || jsonb_build_object(
  'pdf', jsonb_build_object(
    'fonts', jsonb_build_object(
      'headerFont', 'helvetica',
      'bodyFont', 'helvetica',
      'headerFontSize', 22,
      'bodyFontSize', 9,
      'tableFontSize', 8,
      'footerFontSize', 8
    ),
    'colors', jsonb_build_object(
      'tableHeaderBg', '#bb2738',
      'tableHeaderText', '#ffffff',
      'tableRowAlternate', '#f8fafc',
      'tableBorder', '#e2e8f0',
      'accentColor', '#bb2738',
      'textPrimary', '#1e293b',
      'textSecondary', '#475569'
    ),
    'layout', jsonb_build_object(
      'marginTop', 10,
      'marginRight', 10,
      'marginBottom', 10,
      'marginLeft', 10,
      'headerHeight', 55,
      'footerHeight', 27,
      'contentSpacing', 8
    ),
    'logo', jsonb_build_object(
      'showLogo', true,
      'logoPosition', 'left',
      'logoWidth', 40,
      'logoHeight', 40
    ),
    'header', jsonb_build_object(
      'showHeader', true,
      'headerStyle', 'gradient',
      'showCompanyInfo', true,
      'headerTextColor', '#ffffff',
      'showTagline', true
    ),
    'footer', jsonb_build_object(
      'showFooter', true,
      'footerText', 'Thank you for choosing us!',
      'showPageNumbers', true,
      'showGenerationDate', true,
      'footerStyle', 'gradient'
    ),
    'watermark', jsonb_build_object(
      'enableWatermark', false,
      'watermarkText', 'DRAFT',
      'watermarkOpacity', 0.1,
      'watermarkAngle', 45,
      'watermarkFontSize', 80
    ),
    'terms', jsonb_build_object(
      'termsTitle', 'TERMS & CONDITIONS',
      'termsContent', jsonb_build_array(
        '1. This quotation is valid for 30 days from the issue date unless otherwise specified.',
        '2. A 50% deposit is required to commence work. Balance payment before delivery.',
        '3. Prices include supply and installation. Site must be ready for installation.',
        '4. Any modifications after approval may incur additional charges.',
        '5. Measurements are approximate and subject to site verification.'
      ),
      'termsStyle', 'bordered',
      'showTerms', true
    ),
    'sections', jsonb_build_object(
      'showQuoteDetails', true,
      'showCustomerInfo', true,
      'showItemsTable', true,
      'showTotals', true,
      'showRemarks', true,
      'showTerms', true
    ),
    'table', jsonb_build_object(
      'showItemNumbers', true,
      'showLocation', true,
      'showType', true,
      'showDimensions', true,
      'showQuantity', true,
      'showArea', true,
      'showChargeableArea', true,
      'showUnitPrice', true,
      'showTotal', true,
      'tableStyle', 'striped',
      'headerAlignment', 'center',
      'numberAlignment', 'center',
      'textAlignment', 'left',
      'amountAlignment', 'right'
    )
  )
)
WHERE setting_key = 'brand';

-- Create a comment explaining the PDF settings structure
COMMENT ON TABLE brand_settings IS 'Stores brand configuration including company info, visual identity, and PDF styling settings. The pdf section in setting_value contains comprehensive customization options for quote PDF generation.';
