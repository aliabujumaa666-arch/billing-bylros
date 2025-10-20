import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabase';

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
}

interface BrandContextType {
  brand: BrandSettings | null;
  loading: boolean;
  error: string | null;
  refreshBrand: () => Promise<void>;
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

  return (
    <BrandContext.Provider value={{ brand, loading, error, refreshBrand }}>
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
