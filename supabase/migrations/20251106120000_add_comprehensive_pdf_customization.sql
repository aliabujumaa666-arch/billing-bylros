/*
  # Comprehensive PDF Customization for All Document Types

  ## Overview
  Extends the brand_settings table to support comprehensive PDF customization for multiple document types:
  - Quotes
  - Invoices
  - Orders
  - Warranties
  - Site Visits

  Each document type can have its own customized PDF settings or inherit from global defaults.

  ## 1. PDF Settings Structure

  ### Document Types Supported
  - `quotes`: Quotation documents
  - `invoices`: Invoice documents
  - `orders`: Order confirmation documents
  - `warranties`: Warranty certificates
  - `siteVisits`: Site visit reports

  ### Settings Categories (per document type)

  #### Fonts Configuration
  - `headerFont`: Font family for headers (helvetica, times, courier)
  - `bodyFont`: Font family for body text
  - `headerFontSize`: Header font size (10-40)
  - `bodyFontSize`: Body text font size (6-16)
  - `tableFontSize`: Table content font size (6-14)
  - `footerFontSize`: Footer text font size (6-12)

  #### Colors Configuration
  - `tableHeaderBg`: Table header background color
  - `tableHeaderText`: Table header text color
  - `tableRowAlternate`: Alternate row background color
  - `tableBorder`: Table border color
  - `accentColor`: Accent color for highlights
  - `textPrimary`: Primary text color
  - `textSecondary`: Secondary text color

  #### Layout Configuration
  - `marginTop`: Top page margin (mm)
  - `marginRight`: Right page margin (mm)
  - `marginBottom`: Bottom page margin (mm)
  - `marginLeft`: Left page margin (mm)
  - `headerHeight`: Header section height (mm)
  - `footerHeight`: Footer section height (mm)
  - `contentSpacing`: Spacing between sections (mm)

  #### Logo Configuration
  - `showLogo`: Display logo (boolean)
  - `logoPosition`: Logo position (left, center, right)
  - `logoWidth`: Logo width (mm)
  - `logoHeight`: Logo height (mm)

  #### Header Configuration
  - `showHeader`: Show custom header (boolean)
  - `headerStyle`: Header style (simple, gradient, bordered)
  - `showCompanyInfo`: Show company info (boolean)
  - `headerTextColor`: Header text color
  - `showTagline`: Show company tagline (boolean)

  #### Footer Configuration
  - `showFooter`: Show footer (boolean)
  - `footerText`: Custom footer text
  - `showPageNumbers`: Show page numbers (boolean)
  - `showGenerationDate`: Show generation date (boolean)
  - `footerStyle`: Footer style (simple, gradient, bordered)

  #### Watermark Configuration
  - `enableWatermark`: Enable watermark (boolean)
  - `watermarkText`: Watermark text
  - `watermarkOpacity`: Opacity (0-1)
  - `watermarkAngle`: Rotation angle (-90 to 90)
  - `watermarkFontSize`: Font size (20-200)

  #### Terms and Conditions
  - `termsTitle`: Terms section title
  - `termsContent`: Array of terms
  - `termsStyle`: Terms style (simple, bordered, box)
  - `showTerms`: Show terms section (boolean)

  #### Section Visibility
  - `showQuoteDetails`: Show quote/document details
  - `showCustomerInfo`: Show customer information
  - `showItemsTable`: Show items table
  - `showTotals`: Show totals section
  - `showRemarks`: Show remarks/notes
  - `showTerms`: Show terms & conditions

  #### Table Configuration
  - `showItemNumbers`: Show item numbers
  - `showLocation`: Show location column
  - `showType`: Show type column
  - `showDimensions`: Show dimensions (height/width)
  - `showQuantity`: Show quantity column
  - `showArea`: Show area column
  - `showChargeableArea`: Show chargeable area
  - `showUnitPrice`: Show unit price column
  - `showTotal`: Show total column
  - `tableStyle`: Table style (striped, grid, plain)
  - `headerAlignment`: Header text alignment
  - `numberAlignment`: Number alignment
  - `textAlignment`: Text alignment
  - `amountAlignment`: Amount alignment

  ## 2. Migration Actions
  - Updates existing brand_settings record
  - Adds comprehensive PDF settings for all document types
  - Maintains backward compatibility with existing quote PDF settings
  - Each document type has independent configuration

  ## 3. Important Notes
  - Settings are stored in JSONB format for flexibility
  - Each document type can inherit from global defaults
  - Colors use hex format (#RRGGBB)
  - Measurements in millimeters
  - All settings have sensible defaults
*/

-- Function to generate default PDF settings for a document type
CREATE OR REPLACE FUNCTION get_default_document_pdf_settings(doc_type text)
RETURNS jsonb AS $$
BEGIN
  -- Base settings that all document types share
  RETURN jsonb_build_object(
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
      'footerText', CASE
        WHEN doc_type = 'quotes' THEN 'Thank you for choosing us!'
        WHEN doc_type = 'invoices' THEN 'Payment Terms: As per agreement'
        WHEN doc_type = 'orders' THEN 'Thank you for your order!'
        WHEN doc_type = 'warranties' THEN 'Your satisfaction is our priority'
        WHEN doc_type = 'siteVisits' THEN 'Professional Site Assessment Services'
        ELSE 'Thank you for your business!'
      END,
      'showPageNumbers', true,
      'showGenerationDate', true,
      'footerStyle', 'gradient'
    ),
    'watermark', jsonb_build_object(
      'enableWatermark', false,
      'watermarkText', CASE
        WHEN doc_type = 'quotes' THEN 'DRAFT'
        WHEN doc_type = 'invoices' THEN 'UNPAID'
        ELSE 'CONFIDENTIAL'
      END,
      'watermarkOpacity', 0.1,
      'watermarkAngle', 45,
      'watermarkFontSize', 80
    ),
    'terms', jsonb_build_object(
      'termsTitle', 'TERMS & CONDITIONS',
      'termsContent', CASE
        WHEN doc_type = 'quotes' THEN jsonb_build_array(
          '1. This quotation is valid for 30 days from the issue date unless otherwise specified.',
          '2. A 50% deposit is required to commence work. Balance payment before delivery.',
          '3. Prices include supply and installation. Site must be ready for installation.',
          '4. Any modifications after approval may incur additional charges.',
          '5. Measurements are approximate and subject to site verification.'
        )
        WHEN doc_type = 'invoices' THEN jsonb_build_array(
          '1. Payment is due within the agreed terms.',
          '2. Late payments may incur additional charges.',
          '3. All amounts are in AED unless otherwise specified.',
          '4. Goods remain property of the seller until full payment is received.'
        )
        WHEN doc_type = 'orders' THEN jsonb_build_array(
          '1. Order confirmation is subject to availability.',
          '2. Delivery timeframe as per agreed schedule.',
          '3. Customer to inspect goods upon delivery.',
          '4. Any issues must be reported within 24 hours.'
        )
        WHEN doc_type = 'warranties' THEN jsonb_build_array(
          '1. Warranty covers manufacturing defects only.',
          '2. Regular maintenance required as per guidelines.',
          '3. Warranty void if product modified or misused.',
          '4. Claims must be reported within warranty period.'
        )
        ELSE jsonb_build_array(
          '1. Standard terms and conditions apply.',
          '2. All work performed to industry standards.',
          '3. Customer satisfaction guaranteed.'
        )
      END,
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
  );
END;
$$ LANGUAGE plpgsql;

-- Update brand_settings with comprehensive PDF configuration
DO $$
DECLARE
  current_settings jsonb;
  new_pdf_settings jsonb;
BEGIN
  -- Get current settings
  SELECT setting_value INTO current_settings
  FROM brand_settings
  WHERE setting_key = 'brand';

  -- Build new PDF settings structure with all document types
  new_pdf_settings := jsonb_build_object(
    'quotes', get_default_document_pdf_settings('quotes'),
    'invoices', get_default_document_pdf_settings('invoices'),
    'orders', get_default_document_pdf_settings('orders'),
    'warranties', get_default_document_pdf_settings('warranties'),
    'siteVisits', get_default_document_pdf_settings('siteVisits'),
    'global', jsonb_build_object(
      'useGlobalDefaults', false,
      'defaultSettings', get_default_document_pdf_settings('global')
    )
  );

  -- If there's existing PDF settings for quotes, preserve them
  IF current_settings ? 'pdf' THEN
    new_pdf_settings := jsonb_set(
      new_pdf_settings,
      '{quotes}',
      current_settings->'pdf'
    );
  END IF;

  -- Update the settings
  UPDATE brand_settings
  SET setting_value = jsonb_set(
    COALESCE(current_settings, '{}'::jsonb),
    '{pdfSettings}',
    new_pdf_settings
  )
  WHERE setting_key = 'brand';

  -- If no record exists, create one
  IF NOT FOUND THEN
    INSERT INTO brand_settings (setting_key, setting_value)
    VALUES ('brand', jsonb_build_object('pdfSettings', new_pdf_settings));
  END IF;
END $$;

-- Add helpful comment
COMMENT ON COLUMN brand_settings.setting_value IS
'Brand configuration stored as JSONB. Structure includes:
- company: Company information
- logos: Logo URLs
- contact: Contact information
- visual: Visual identity settings
- business: Business registration details
- pdfSettings: Comprehensive PDF customization per document type (quotes, invoices, orders, warranties, siteVisits)
  Each document type has full control over fonts, colors, layout, headers, footers, watermarks, terms, and table configuration.';
