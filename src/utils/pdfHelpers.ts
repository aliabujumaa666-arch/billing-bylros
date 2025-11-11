import { PDFSettings } from '../contexts/BrandContext';

export const fontMapping: Record<string, string> = {
  'helvetica': 'helvetica',
  'arial': 'helvetica',
  'verdana': 'helvetica',
  'trebuchet': 'helvetica',
  'segoe': 'helvetica',
  'tahoma': 'helvetica',
  'times': 'times',
  'georgia': 'times',
  'palatino': 'times',
  'garamond': 'times',
  'bookman': 'times',
  'courier': 'courier',
  'courier-new': 'courier',
  'lucida-console': 'courier',
};

export const getFontFamily = (fontName: string): string => {
  return fontMapping[fontName.toLowerCase()] || 'helvetica';
};

export const getDefaultPDFSettings = (): PDFSettings => ({
  fonts: {
    headerFont: 'helvetica',
    bodyFont: 'helvetica',
    headerFontSize: 22,
    bodyFontSize: 8,
    tableFontSize: 7.5,
    footerFontSize: 7,
  },
  colors: {
    tableHeaderBg: '#bb2738',
    tableHeaderText: '#ffffff',
    tableRowAlternate: '#f8fafc',
    tableBorder: '#e2e8f0',
    accentColor: '#bb2738',
    textPrimary: '#1e293b',
    textSecondary: '#475569',
  },
  layout: {
    marginTop: 10,
    marginRight: 10,
    marginBottom: 10,
    marginLeft: 10,
    headerHeight: 55,
    footerHeight: 27,
    contentSpacing: 8,
  },
  logo: {
    showLogo: true,
    logoPosition: 'left',
    logoWidth: 40,
    logoHeight: 40,
  },
  header: {
    showHeader: true,
    headerStyle: 'gradient',
    showCompanyInfo: true,
    headerTextColor: '#ffffff',
    showTagline: true,
  },
  footer: {
    showFooter: true,
    footerText: 'Thank you for choosing us!',
    showPageNumbers: true,
    showGenerationDate: true,
    footerStyle: 'gradient',
  },
  watermark: {
    enableWatermark: false,
    watermarkText: 'DRAFT',
    watermarkOpacity: 0.1,
    watermarkAngle: 45,
    watermarkFontSize: 80,
  },
  remarks: {
    remarksTitle: 'REMARKS & NOTES',
    remarksContent: [
      'Quotation valid for 30 days from issue date.',
      'Delivery: 45-60 working days after advance payment and drawing approval.',
      'Payment Terms: 50% advance, 30% before delivery, 20% after installation.',
      'Warranty: 1 year on aluminium & hardware (glass breakage not covered).',
    ],
    showRemarks: true,
  },
  terms: {
    termsTitle: 'TERMS & CONDITIONS',
    termsContent: [
      '1. This quotation is valid for 30 days from the issue date unless otherwise specified.',
      '2. A 50% deposit is required to commence work. Balance payment before delivery.',
      '3. Prices include supply and installation. Site must be ready for installation.',
      '4. Any modifications after approval may incur additional charges.',
      '5. Measurements are approximate and subject to site verification.',
    ],
    termsStyle: 'bordered',
    showTerms: true,
  },
  sections: {
    showQuoteDetails: true,
    showCustomerInfo: true,
    showItemsTable: true,
    showTotals: true,
    showRemarks: true,
    showTerms: true,
  },
  table: {
    showItemNumbers: true,
    showLocation: true,
    showType: true,
    showDimensions: true,
    showQuantity: true,
    showArea: true,
    showChargeableArea: true,
    showUnitPrice: true,
    showTotal: true,
    tableStyle: 'striped',
    headerAlignment: 'center',
    numberAlignment: 'center',
    textAlignment: 'left',
    amountAlignment: 'right',
  },
});

export const hexToRgb = (hex: string) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : { r: 187, g: 39, b: 56 };
};
