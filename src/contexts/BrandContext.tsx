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
    headerStyle: 'simple' | 'gradient' | 'bordered' | 'letterhead';
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
  remarks: {
    remarksTitle: string;
    remarksContent: string[];
    remarksStyle: 'simple' | 'bordered' | 'box';
    showRemarks: boolean;
  };
  terms: {
    termsTitle: string;
    termsContent: string[];
    termsStyle: 'simple' | 'bordered' | 'box';
    showTerms: boolean;
    showCompanyInfo?: boolean;
    companyInfoText?: string;
    showCompanyStamp?: boolean;
    companyStampUrl?: string;
    companyInfoSpacing?: number;
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
  documentTitle: {
    fontSize: number;
    fontWeight: 'normal' | 'bold';
    textColor: string;
    backgroundColor: string;
    backgroundOpacity: number;
    borderRadius: number;
    padding: number;
    showReferenceNumber: boolean;
    referencePosition: 'right' | 'below';
    referenceFontSize: number;
    titleText: string;
  };
  infoBoxes: {
    backgroundColor: string;
    borderColor: string;
    borderWidth: number;
    borderRadius: number;
    padding: number;
    labelColor: string;
    labelFontSize: number;
    labelFontWeight: 'normal' | 'bold';
    valueColor: string;
    valueFontSize: number;
    valueFontWeight: 'normal' | 'bold';
    boxSpacing: number;
    boxShadow: boolean;
    layout: 'side-by-side' | 'stacked';
    showIcons: boolean;
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

export interface PDFTemplate {
  id: string;
  name: string;
  description: string;
  document_type: DocumentType | 'global';
  is_default: boolean;
  is_global: boolean;
  is_system: boolean;
  settings: PDFSettings;
  preview_image?: string;
  tags: string[];
  created_by?: string;
  created_at: string;
  updated_at: string;
  usage_count: number;
}

interface BrandContextType {
  brand: BrandSettings | null;
  loading: boolean;
  error: string | null;
  refreshBrand: () => Promise<void>;
  getPDFSettings: (documentType: DocumentType) => PDFSettings;
  updatePDFSettings: (documentType: DocumentType, settings: PDFSettings) => Promise<void>;
  loadTemplates: () => Promise<PDFTemplate[]>;
  saveTemplate: (template: Omit<PDFTemplate, 'id' | 'created_at' | 'updated_at' | 'usage_count' | 'created_by'>) => Promise<PDFTemplate>;
  updateTemplate: (templateId: string, updates: Partial<Omit<PDFTemplate, 'id' | 'created_at' | 'updated_at' | 'usage_count' | 'created_by'>>) => Promise<void>;
  applyTemplate: (templateId: string, documentType: DocumentType) => Promise<void>;
  deleteTemplate: (templateId: string) => Promise<void>;
  copySettings: (fromType: DocumentType, toType: DocumentType) => Promise<void>;
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

  const loadTemplates = async (): Promise<PDFTemplate[]> => {
    try {
      const { data, error } = await supabase
        .from('pdf_templates')
        .select('*')
        .order('is_system', { ascending: false })
        .order('usage_count', { ascending: false });

      if (error) throw error;

      return data || [];
    } catch (err: any) {
      console.error('Error loading templates:', err);
      throw err;
    }
  };

  const saveTemplate = async (
    template: Omit<PDFTemplate, 'id' | 'created_at' | 'updated_at' | 'usage_count' | 'created_by'>
  ): Promise<PDFTemplate> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('pdf_templates')
        .insert({
          ...template,
          created_by: user.id,
        })
        .select()
        .single();

      if (error) throw error;

      return data;
    } catch (err: any) {
      console.error('Error saving template:', err);
      throw err;
    }
  };

  const updateTemplate = async (
    templateId: string,
    updates: Partial<Omit<PDFTemplate, 'id' | 'created_at' | 'updated_at' | 'usage_count' | 'created_by'>>
  ) => {
    try {
      const { error } = await supabase
        .from('pdf_templates')
        .update(updates)
        .eq('id', templateId);

      if (error) throw error;
    } catch (err: any) {
      console.error('Error updating template:', err);
      throw err;
    }
  };

  const applyTemplate = async (templateId: string, documentType: DocumentType) => {
    try {
      const { data: template, error: fetchError } = await supabase
        .from('pdf_templates')
        .select('settings')
        .eq('id', templateId)
        .single();

      if (fetchError) throw fetchError;

      await supabase.rpc('increment_template_usage', { template_id: templateId });

      await updatePDFSettings(documentType, template.settings as PDFSettings);
    } catch (err: any) {
      console.error('Error applying template:', err);
      throw err;
    }
  };

  const deleteTemplate = async (templateId: string) => {
    try {
      const { error } = await supabase
        .from('pdf_templates')
        .delete()
        .eq('id', templateId);

      if (error) throw error;
    } catch (err: any) {
      console.error('Error deleting template:', err);
      throw err;
    }
  };

  const copySettings = async (fromType: DocumentType, toType: DocumentType) => {
    try {
      const settings = getPDFSettings(fromType);
      await updatePDFSettings(toType, settings);
    } catch (err: any) {
      console.error('Error copying settings:', err);
      throw err;
    }
  };

  return (
    <BrandContext.Provider
      value={{
        brand,
        loading,
        error,
        refreshBrand,
        getPDFSettings,
        updatePDFSettings,
        loadTemplates,
        saveTemplate,
        updateTemplate,
        applyTemplate,
        deleteTemplate,
        copySettings,
      }}
    >
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
