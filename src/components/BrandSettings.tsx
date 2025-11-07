import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Save, Building2, Phone, Palette, FileText, Globe, Upload, FileDown } from 'lucide-react';
import { PDFSettings, DocumentType, useBrand } from '../contexts/BrandContext';
import { DocumentPDFSettings } from './DocumentPDFSettings';

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
}

export function BrandSettings() {
  const [settings, setSettings] = useState<BrandSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeSection, setActiveSection] = useState<'brand' | 'pdf'>('brand');
  const [selectedDocumentType, setSelectedDocumentType] = useState<DocumentType>('quotes');
  const { getPDFSettings, updatePDFSettings } = useBrand();
  const [currentPDFSettings, setCurrentPDFSettings] = useState<PDFSettings | null>(null);
  const [pendingPDFSettings, setPendingPDFSettings] = useState<PDFSettings | null>(null);

  useEffect(() => {
    if (activeSection === 'pdf') {
      const pdfSettings = getPDFSettings(selectedDocumentType);
      setCurrentPDFSettings(pdfSettings);
      setPendingPDFSettings(pdfSettings);
    }
  }, [selectedDocumentType, activeSection, getPDFSettings]);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('brand_settings')
        .select('*')
        .eq('setting_key', 'brand')
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setSettings(data.setting_value);
      }
    } catch (err: any) {
      setError('Failed to load brand settings: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setError('');
    setSuccess('');
    setSaving(true);

    try {
      if (activeSection === 'brand') {
        const { error } = await supabase
          .from('brand_settings')
          .update({
            setting_value: settings,
            updated_at: new Date().toISOString(),
          })
          .eq('setting_key', 'brand');

        if (error) throw error;

        setSuccess('Brand settings saved successfully!');
        setTimeout(() => setSuccess(''), 3000);
      } else if (activeSection === 'pdf' && pendingPDFSettings) {
        await updatePDFSettings(selectedDocumentType, pendingPDFSettings);
        setCurrentPDFSettings(pendingPDFSettings);
        setSuccess(`PDF settings for ${selectedDocumentType} saved successfully!`);
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err: any) {
      setError('Failed to save settings: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const updateSettings = (path: string[], value: any) => {
    setSettings((prev: any) => {
      if (!prev) return prev;
      const newSettings = JSON.parse(JSON.stringify(prev));
      let current = newSettings;

      for (let i = 0; i < path.length - 1; i++) {
        current = current[path[i]];
      }

      current[path[path.length - 1]] = value;
      return newSettings;
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#bb2738]"></div>
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-lg text-red-700">
        Failed to load brand settings
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Brand Settings</h2>
          <p className="text-slate-600 mt-1">Manage your company branding and identity</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-6 py-2 bg-[#bb2738] text-white rounded-lg hover:bg-[#a01f2f] transition-colors disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      {success && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
          {success}
        </div>
      )}

      <div className="border-b border-slate-200">
        <div className="flex space-x-1">
          <button
            onClick={() => setActiveSection('brand')}
            className={`flex items-center gap-2 px-6 py-3 border-b-2 transition-colors font-medium ${
              activeSection === 'brand'
                ? 'border-[#bb2738] text-[#bb2738]'
                : 'border-transparent text-slate-600 hover:text-slate-800 hover:border-slate-300'
            }`}
          >
            <Building2 className="w-5 h-5" />
            Brand Identity
          </button>
          <button
            onClick={() => setActiveSection('pdf')}
            className={`flex items-center gap-2 px-6 py-3 border-b-2 transition-colors font-medium ${
              activeSection === 'pdf'
                ? 'border-[#bb2738] text-[#bb2738]'
                : 'border-transparent text-slate-600 hover:text-slate-800 hover:border-slate-300'
            }`}
          >
            <FileDown className="w-5 h-5" />
            Quote PDF Settings
          </button>
        </div>
      </div>

      {activeSection === 'brand' && (
        <>
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <div className="flex items-center gap-3 mb-6">
              <Building2 className="w-6 h-6 text-[#bb2738]" />
              <h3 className="text-xl font-semibold text-slate-800">Company Identity</h3>
            </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Company Name
            </label>
            <input
              type="text"
              value={settings.company.name}
              onChange={(e) => updateSettings(['company', 'name'], e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#bb2738] focus:border-transparent outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Full Company Name
            </label>
            <input
              type="text"
              value={settings.company.fullName}
              onChange={(e) => updateSettings(['company', 'fullName'], e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#bb2738] focus:border-transparent outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Tagline
            </label>
            <input
              type="text"
              value={settings.company.tagline}
              onChange={(e) => updateSettings(['company', 'tagline'], e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#bb2738] focus:border-transparent outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Founded Year
            </label>
            <input
              type="text"
              value={settings.company.foundingYear}
              onChange={(e) => updateSettings(['company', 'foundingYear'], e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#bb2738] focus:border-transparent outline-none"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Company Description
            </label>
            <textarea
              value={settings.company.description}
              onChange={(e) => updateSettings(['company', 'description'], e.target.value)}
              rows={3}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#bb2738] focus:border-transparent outline-none resize-none"
            />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <div className="flex items-center gap-3 mb-6">
          <Upload className="w-6 h-6 text-[#bb2738]" />
          <h3 className="text-xl font-semibold text-slate-800">Logos</h3>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Primary Logo URL
            </label>
            <input
              type="text"
              value={settings.logos.primary}
              onChange={(e) => updateSettings(['logos', 'primary'], e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#bb2738] focus:border-transparent outline-none"
              placeholder="/path/to/logo.png"
            />
            {settings.logos.primary && (
              <div className="mt-3 p-4 bg-slate-50 rounded-lg">
                <p className="text-xs text-slate-600 mb-2">Preview:</p>
                <img
                  src={settings.logos.primary}
                  alt="Primary Logo"
                  className="h-16 w-auto"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Dark Mode Logo URL
            </label>
            <input
              type="text"
              value={settings.logos.darkMode}
              onChange={(e) => updateSettings(['logos', 'darkMode'], e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#bb2738] focus:border-transparent outline-none"
              placeholder="/path/to/logo-dark.png"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Favicon URL
            </label>
            <input
              type="text"
              value={settings.logos.favicon}
              onChange={(e) => updateSettings(['logos', 'favicon'], e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#bb2738] focus:border-transparent outline-none"
              placeholder="/path/to/favicon.png"
            />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <div className="flex items-center gap-3 mb-6">
          <Phone className="w-6 h-6 text-[#bb2738]" />
          <h3 className="text-xl font-semibold text-slate-800">Contact Information</h3>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Phone Number
            </label>
            <input
              type="text"
              value={settings.contact.phone}
              onChange={(e) => updateSettings(['contact', 'phone'], e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#bb2738] focus:border-transparent outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Email Address
            </label>
            <input
              type="email"
              value={settings.contact.email}
              onChange={(e) => updateSettings(['contact', 'email'], e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#bb2738] focus:border-transparent outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Street Address
            </label>
            <input
              type="text"
              value={settings.contact.address.street}
              onChange={(e) => updateSettings(['contact', 'address', 'street'], e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#bb2738] focus:border-transparent outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Area
            </label>
            <input
              type="text"
              value={settings.contact.address.area}
              onChange={(e) => updateSettings(['contact', 'address', 'area'], e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#bb2738] focus:border-transparent outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              City
            </label>
            <input
              type="text"
              value={settings.contact.address.city}
              onChange={(e) => updateSettings(['contact', 'address', 'city'], e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#bb2738] focus:border-transparent outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Country
            </label>
            <input
              type="text"
              value={settings.contact.address.country}
              onChange={(e) => updateSettings(['contact', 'address', 'country'], e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#bb2738] focus:border-transparent outline-none"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Operating Hours
            </label>
            <input
              type="text"
              value={settings.contact.operatingHours}
              onChange={(e) => updateSettings(['contact', 'operatingHours'], e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#bb2738] focus:border-transparent outline-none"
            />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <div className="flex items-center gap-3 mb-6">
          <Globe className="w-6 h-6 text-[#bb2738]" />
          <h3 className="text-xl font-semibold text-slate-800">Social Media</h3>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Facebook URL
            </label>
            <input
              type="url"
              value={settings.socialMedia.facebook}
              onChange={(e) => updateSettings(['socialMedia', 'facebook'], e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#bb2738] focus:border-transparent outline-none"
              placeholder="https://facebook.com/..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Instagram URL
            </label>
            <input
              type="url"
              value={settings.socialMedia.instagram}
              onChange={(e) => updateSettings(['socialMedia', 'instagram'], e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#bb2738] focus:border-transparent outline-none"
              placeholder="https://instagram.com/..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              LinkedIn URL
            </label>
            <input
              type="url"
              value={settings.socialMedia.linkedin}
              onChange={(e) => updateSettings(['socialMedia', 'linkedin'], e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#bb2738] focus:border-transparent outline-none"
              placeholder="https://linkedin.com/company/..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Twitter URL
            </label>
            <input
              type="url"
              value={settings.socialMedia.twitter}
              onChange={(e) => updateSettings(['socialMedia', 'twitter'], e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#bb2738] focus:border-transparent outline-none"
              placeholder="https://twitter.com/..."
            />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <div className="flex items-center gap-3 mb-6">
          <Palette className="w-6 h-6 text-[#bb2738]" />
          <h3 className="text-xl font-semibold text-slate-800">Visual Identity</h3>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Primary Color
            </label>
            <div className="flex gap-3">
              <input
                type="color"
                value={settings.visual.primaryColor}
                onChange={(e) => updateSettings(['visual', 'primaryColor'], e.target.value)}
                className="w-20 h-10 rounded-lg cursor-pointer"
              />
              <input
                type="text"
                value={settings.visual.primaryColor}
                onChange={(e) => updateSettings(['visual', 'primaryColor'], e.target.value)}
                className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#bb2738] focus:border-transparent outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Accent Color
            </label>
            <div className="flex gap-3">
              <input
                type="color"
                value={settings.visual.accentColor}
                onChange={(e) => updateSettings(['visual', 'accentColor'], e.target.value)}
                className="w-20 h-10 rounded-lg cursor-pointer"
              />
              <input
                type="text"
                value={settings.visual.accentColor}
                onChange={(e) => updateSettings(['visual', 'accentColor'], e.target.value)}
                className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#bb2738] focus:border-transparent outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Light Color
            </label>
            <div className="flex gap-3">
              <input
                type="color"
                value={settings.visual.lightColor}
                onChange={(e) => updateSettings(['visual', 'lightColor'], e.target.value)}
                className="w-20 h-10 rounded-lg cursor-pointer"
              />
              <input
                type="text"
                value={settings.visual.lightColor}
                onChange={(e) => updateSettings(['visual', 'lightColor'], e.target.value)}
                className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#bb2738] focus:border-transparent outline-none"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <div className="flex items-center gap-3 mb-6">
          <FileText className="w-6 h-6 text-[#bb2738]" />
          <h3 className="text-xl font-semibold text-slate-800">Business Details</h3>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Trade License Number
            </label>
            <input
              type="text"
              value={settings.business.tradeLicense}
              onChange={(e) => updateSettings(['business', 'tradeLicense'], e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#bb2738] focus:border-transparent outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Registration Number
            </label>
            <input
              type="text"
              value={settings.business.registrationNumber}
              onChange={(e) => updateSettings(['business', 'registrationNumber'], e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#bb2738] focus:border-transparent outline-none"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-2">
              VAT Number
            </label>
            <input
              type="text"
              value={settings.business.vatNumber}
              onChange={(e) => updateSettings(['business', 'vatNumber'], e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#bb2738] focus:border-transparent outline-none"
            />
          </div>
        </div>
      </div>
        </>
      )}

      {activeSection === 'pdf' && (
        <>
          <div className="bg-white rounded-xl border border-slate-200 p-6 mb-6">
            <div className="flex items-center gap-3 mb-6">
              <FileText className="w-6 h-6 text-[#bb2738]" />
              <h3 className="text-xl font-semibold text-slate-800">Select Document Type</h3>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {[
                { value: 'quotes' as DocumentType, label: 'Quotes' },
                { value: 'invoices' as DocumentType, label: 'Invoices' },
                { value: 'orders' as DocumentType, label: 'Orders' },
                { value: 'warranties' as DocumentType, label: 'Warranties' },
                { value: 'siteVisits' as DocumentType, label: 'Site Visits' },
              ].map((docType) => (
                <button
                  key={docType.value}
                  onClick={() => setSelectedDocumentType(docType.value)}
                  className={`px-4 py-3 rounded-lg font-medium transition-all ${
                    selectedDocumentType === docType.value
                      ? 'bg-[#bb2738] text-white shadow-md'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {docType.label}
                </button>
              ))}
            </div>
          </div>

          {pendingPDFSettings && (
            <DocumentPDFSettings
              documentType={selectedDocumentType}
              documentLabel={selectedDocumentType}
              settings={pendingPDFSettings}
              onUpdate={(pdfSettings) => {
                setPendingPDFSettings(pdfSettings);
              }}
            />
          )}
        </>
      )}
    </div>
  );
}
