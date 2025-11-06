import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { getDefaultPDFSettings } from '../utils/pdfHelpers';

export interface PDFSettings {
  fonts: {
    headerFont: string;
    bodyFont: string;
    headerFontSize: number;
    bodyFontSize: number;
    tableFontSize: number;
    footerFontSize: number;
  };
  colors: {
    tableHeaderBg: string;
    tableHeaderText: string;
    tableRowAlternate: string;
    tableBorder: string;
    accentColor: string;
    textPrimary: string;
    textSecondary: string;
  };
  layout: {
    marginTop: number;
    marginRight: number;
    marginBottom: number;
    marginLeft: number;
    headerHeight: number;
    footerHeight: number;
    contentSpacing: number;
  };
  logo: {
    showLogo: boolean;
    logoPosition: 'left' | 'center' | 'right';
    logoWidth: number;
    logoHeight: number;
  };
  header: {
    showHeader: boolean;
    headerStyle: 'simple' | 'gradient' | 'bordered';
    showCompanyInfo: boolean;
    headerTextColor: string;
    showTagline: boolean;
  };
  footer: {
    showFooter: boolean;
    footerText: string;
    showPageNumbers: boolean;
    showGenerationDate: boolean;
    footerStyle: 'simple' | 'gradient' | 'bordered';
  };
  watermark: {
    enableWatermark: boolean;
    watermarkText: string;
    watermarkOpacity: number;
    watermarkAngle: number;
    watermarkFontSize: number;
  };
  terms: {
    termsTitle: string;
    termsContent: string[];
    termsStyle: 'simple' | 'bordered' | 'box';
    showTerms: boolean;
  };
  sections: {
    showQuoteDetails: boolean;
    showCustomerInfo: boolean;
    showItemsTable: boolean;
    showTotals: boolean;
    showRemarks: boolean;
    showTerms: boolean;
  };
  table: {
    showItemNumbers: boolean;
    showLocation: boolean;
    showType: boolean;
    showDimensions: boolean;
    showQuantity: boolean;
    showArea: boolean;
    showChargeableArea: boolean;
    showUnitPrice: boolean;
    showTotal: boolean;
    tableStyle: 'striped' | 'grid' | 'plain';
    headerAlignment: 'left' | 'center' | 'right';
    numberAlignment: 'left' | 'center' | 'right';
    textAlignment: 'left' | 'center' | 'right';
    amountAlignment: 'left' | 'center' | 'right';
  };
}

export type DocumentType = 'quotes' | 'invoices' | 'orders' | 'warranties' | 'siteVisits';

export interface DocumentPDFSettings {
  quotes: PDFSettings;
  invoices: PDFSettings;
  orders: PDFSettings;
  warranties: PDFSettings;
  siteVisits: PDFSettings;
  global?: {
    useGlobalDefaults: boolean;
    defaultSettings: PDFSettings;
  };
}

interface BrandSettings {
  company: {
    name: string;
    fullName: string;
    tagline: string;
    foundingYear: string;
    description: string;
  };
  logos: {
    primary: string;
    darkMode: string;
    favicon: string;
  };
  contact: {
    phone: string;
    email: string;
    address: {
      street: string;
      city: string;
      area: string;
      country: string;
      fullAddress: string;
    };
    operatingHours: string;
  };
  socialMedia: {
    facebook: string;
    instagram: string;
    linkedin: string;
    twitter: string;
  };
  visual: {
    primaryColor: string;
    accentColor: string;
    lightColor: string;
  };
  business: {
    tradeLicense: string;
    registrationNumber: string;
    vatNumber: string;
  };
  pdf?: PDFSettings;
  pdfSettings?: DocumentPDFSettings;
}

interface BrandContextType {
  brand: BrandSettings | null;
  loading: boolean;
  error: string | null;
  refreshBrand: () => Promise<void>;
  getPDFSettings: (documentType: DocumentType) => PDFSettings;
  updatePDFSettings: (documentType: DocumentType, settings: PDFSettings) => Promise<void>;
}

const defaultBrandSettings: BrandSettings = {
  company: {
    name: 'BYLROS',
    fullName: 'BYLROS ALUMINUM & GLASS SYSTEM',
    tagline: 'Premium Glass & Aluminum Solutions',
    foundingYear: '1985',
    description: 'Your trusted partner in glass and aluminum installations.',
  },
  logos: {
    primary: '/Untitled-design-3.png',
    darkMode: '/Untitled-design-3.png',
    favicon: '/Untitled-design-3.png',
  },
  contact: {
    phone: '+971-52-5458-968',
    email: 'info@bylros.ae',
    address: {
      street: 'Costra Business Park (Block B)',
      city: 'Dubai',
      area: 'Production City',
      country: 'UAE',
      fullAddress: 'Costra Business Park (Block B), Production City, Dubai, UAE',
    },
    operatingHours: '24/7 Support Available',
  },
  socialMedia: {
    facebook: '',
    instagram: '',
    linkedin: '',
    twitter: '',
  },
  visual: {
    primaryColor: '#bb2738',
    accentColor: '#a01f2f',
    lightColor: '#f8f9fa',
  },
  business: {
    tradeLicense: '',
    registrationNumber: '',
    vatNumber: '',
  },
};

const BrandContext = createContext<BrandContextType | undefined>(undefined);

function getDefaultPDFSettingsForType(documentType: DocumentType): PDFSettings {
  const baseSettings = getDefaultPDFSettings();

  const footerTexts: Record<DocumentType, string> = {
    quotes: 'Thank you for choosing us!',
    invoices: 'Payment Terms: As per agreement',
    orders: 'Thank you for your order!',
    warranties: 'Your satisfaction is our priority',
    siteVisits: 'Professional Site Assessment Services',
  };

  const watermarkTexts: Record<DocumentType, string> = {
    quotes: 'DRAFT',
    invoices: 'UNPAID',
    orders: 'ORDER',
    warranties: 'WARRANTY',
    siteVisits: 'CONFIDENTIAL',
  };

  return {
    ...baseSettings,
    footer: {
      ...baseSettings.footer,
      footerText: footerTexts[documentType],
    },
    watermark: {
      ...baseSettings.watermark,
      watermarkText: watermarkTexts[documentType],
    },
  };
}

export function BrandProvider({ children }: { children: ReactNode }) {
  const [brand, setBrand] = useState<BrandSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBrand = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('brand_settings')
        .select('setting_value')
        .eq('setting_key', 'brand')
        .maybeSingle();

      if (fetchError) throw fetchError;

      if (data && data.setting_value) {
        setBrand(data.setting_value as BrandSettings);
      } else {
        setBrand(defaultBrandSettings);
      }
    } catch (err: any) {
      console.error('Error fetching brand settings:', err);
      setError(err.message);
      setBrand(defaultBrandSettings);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBrand();

    const channel = supabase
      .channel('brand-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'brand_settings',
          filter: 'setting_key=eq.brand',
        },
        () => {
          fetchBrand();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const refreshBrand = async () => {
    await fetchBrand();
  };

  const getPDFSettings = (documentType: DocumentType): PDFSettings => {
    if (!brand) {
      return getDefaultPDFSettingsForType(documentType);
    }

    if (brand.pdfSettings) {
      if (brand.pdfSettings.global?.useGlobalDefaults) {
        return brand.pdfSettings.global.defaultSettings;
      }
      return brand.pdfSettings[documentType] || getDefaultPDFSettingsForType(documentType);
    }

    if (brand.pdf && documentType === 'quotes') {
      return brand.pdf;
    }

    return getDefaultPDFSettingsForType(documentType);
  };

  const updatePDFSettings = async (documentType: DocumentType, settings: PDFSettings) => {
    try {
      const currentValue = brand || defaultBrandSettings;
      const pdfSettings = currentValue.pdfSettings || {} as DocumentPDFSettings;

      const updatedPdfSettings = {
        ...pdfSettings,
        [documentType]: settings,
      };

      const updatedBrand = {
        ...currentValue,
        pdfSettings: updatedPdfSettings,
      };

      const { error } = await supabase
        .from('brand_settings')
        .upsert({
          setting_key: 'brand',
          setting_value: updatedBrand,
        }, {
          onConflict: 'setting_key',
        });

      if (error) throw error;

      await fetchBrand();
    } catch (err: any) {
      console.error('Error updating PDF settings:', err);
      throw err;
    }
  };

  return (
    <BrandContext.Provider value={{ brand, loading, error, refreshBrand, getPDFSettings, updatePDFSettings }}>
      {children}
    </BrandContext.Provider>
  );
}

export function useBrand() {
  const context = useContext(BrandContext);
  if (context === undefined) {
    throw new Error('useBrand must be used within a BrandProvider');
  }
  return context;
}
