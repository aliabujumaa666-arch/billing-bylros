import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Save, Eye, Plus, Trash2, Settings, CreditCard, Building2, Mail, Keyboard, Menu } from 'lucide-react';
import { PayPalSettings } from './PayPalSettings';
import { StripeSettings } from './StripeSettings';
import { BrandSettings } from './BrandSettings';
import EmailSettings from './EmailSettings';
import { KeyboardShortcutSettings } from './KeyboardShortcutSettings';
import { NavigationMenuSettings } from './NavigationMenuSettings';

export function PortalSettings() {
  const [activeTab, setActiveTab] = useState<'brand' | 'portal' | 'navigation' | 'paypal' | 'stripe' | 'email' | 'shortcuts'>('brand');
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('portal_settings')
        .select('*')
        .eq('setting_key', 'home_page')
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setSettings(data.setting_value);
      }
    } catch (err: any) {
      setError('Failed to load settings: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setError('');
    setSuccess('');
    setSaving(true);

    try {
      const { error } = await supabase
        .from('portal_settings')
        .update({
          setting_value: settings,
          updated_at: new Date().toISOString(),
        })
        .eq('setting_key', 'home_page');

      if (error) throw error;

      setSuccess('Settings saved successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError('Failed to save settings: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const updateSettings = (path: string[], value: any) => {
    setSettings((prev: any) => {
      const newSettings = { ...prev };
      let current = newSettings;

      for (let i = 0; i < path.length - 1; i++) {
        current = current[path[i]];
      }

      current[path[path.length - 1]] = value;
      return newSettings;
    });
  };

  const addFeature = () => {
    setSettings((prev: any) => ({
      ...prev,
      features: [
        ...prev.features,
        {
          icon: 'Star',
          title: 'New Feature',
          description: 'Feature description'
        }
      ]
    }));
  };

  const removeFeature = (index: number) => {
    setSettings((prev: any) => ({
      ...prev,
      features: prev.features.filter((_: any, i: number) => i !== index)
    }));
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
        Failed to load portal settings
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 mb-2">Settings</h1>
          <p className="text-slate-600">Manage customer portal and payment settings</p>
        </div>
        <div className="flex gap-3">
          {activeTab === 'portal' && (
            <>
              <a
                href="/customer"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors"
              >
                <Eye className="w-4 h-4" />
                Preview Portal
              </a>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 px-6 py-2 bg-[#bb2738] text-white rounded-lg hover:bg-[#a01f2f] transition-colors disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </>
          )}
        </div>
      </div>

      <div className="flex gap-3 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('brand')}
          className={`flex items-center gap-2 px-4 py-3 font-medium text-sm transition-colors border-b-2 ${
            activeTab === 'brand'
              ? 'border-[#bb2738] text-[#bb2738]'
              : 'border-transparent text-slate-600 hover:text-slate-800'
          }`}
        >
          <Building2 className="w-4 h-4" />
          Brand Settings
        </button>
        <button
          onClick={() => setActiveTab('portal')}
          className={`flex items-center gap-2 px-4 py-3 font-medium text-sm transition-colors border-b-2 ${
            activeTab === 'portal'
              ? 'border-[#bb2738] text-[#bb2738]'
              : 'border-transparent text-slate-600 hover:text-slate-800'
          }`}
        >
          <Settings className="w-4 h-4" />
          Portal Settings
        </button>
        <button
          onClick={() => setActiveTab('paypal')}
          className={`flex items-center gap-2 px-4 py-3 font-medium text-sm transition-colors border-b-2 ${
            activeTab === 'paypal'
              ? 'border-[#bb2738] text-[#bb2738]'
              : 'border-transparent text-slate-600 hover:text-slate-800'
          }`}
        >
          <CreditCard className="w-4 h-4" />
          PayPal Settings
        </button>
        <button
          onClick={() => setActiveTab('stripe')}
          className={`flex items-center gap-2 px-4 py-3 font-medium text-sm transition-colors border-b-2 ${
            activeTab === 'stripe'
              ? 'border-[#bb2738] text-[#bb2738]'
              : 'border-transparent text-slate-600 hover:text-slate-800'
          }`}
        >
          <CreditCard className="w-4 h-4" />
          Stripe Settings
        </button>
        <button
          onClick={() => setActiveTab('email')}
          className={`flex items-center gap-2 px-4 py-3 font-medium text-sm transition-colors border-b-2 ${
            activeTab === 'email'
              ? 'border-[#bb2738] text-[#bb2738]'
              : 'border-transparent text-slate-600 hover:text-slate-800'
          }`}
        >
          <Mail className="w-4 h-4" />
          Email Settings
        </button>
        <button
          onClick={() => setActiveTab('navigation')}
          className={`flex items-center gap-2 px-4 py-3 font-medium text-sm transition-colors border-b-2 ${
            activeTab === 'navigation'
              ? 'border-[#bb2738] text-[#bb2738]'
              : 'border-transparent text-slate-600 hover:text-slate-800'
          }`}
        >
          <Menu className="w-4 h-4" />
          Navigation
        </button>
        <button
          onClick={() => setActiveTab('shortcuts')}
          className={`flex items-center gap-2 px-4 py-3 font-medium text-sm transition-colors border-b-2 ${
            activeTab === 'shortcuts'
              ? 'border-[#bb2738] text-[#bb2738]'
              : 'border-transparent text-slate-600 hover:text-slate-800'
          }`}
        >
          <Keyboard className="w-4 h-4" />
          Shortcuts
        </button>
      </div>

      {activeTab === 'brand' ? (
        <BrandSettings />
      ) : activeTab === 'paypal' ? (
        <PayPalSettings />
      ) : activeTab === 'stripe' ? (
        <StripeSettings />
      ) : activeTab === 'email' ? (
        <EmailSettings />
      ) : activeTab === 'navigation' ? (
        <NavigationMenuSettings />
      ) : activeTab === 'shortcuts' ? (
        <KeyboardShortcutSettings />
      ) : (
        <>
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

      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <div className="flex items-center gap-3 mb-6">
          <Settings className="w-6 h-6 text-[#bb2738]" />
          <h2 className="text-xl font-semibold text-slate-800">Hero Section</h2>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Main Title
            </label>
            <input
              type="text"
              value={settings.hero.title}
              onChange={(e) => updateSettings(['hero', 'title'], e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#bb2738] focus:border-transparent outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Subtitle
            </label>
            <input
              type="text"
              value={settings.hero.subtitle}
              onChange={(e) => updateSettings(['hero', 'subtitle'], e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#bb2738] focus:border-transparent outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Background Color
            </label>
            <div className="flex gap-3">
              <input
                type="color"
                value={settings.hero.backgroundColor}
                onChange={(e) => updateSettings(['hero', 'backgroundColor'], e.target.value)}
                className="w-20 h-10 rounded-lg cursor-pointer"
              />
              <input
                type="text"
                value={settings.hero.backgroundColor}
                onChange={(e) => updateSettings(['hero', 'backgroundColor'], e.target.value)}
                className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#bb2738] focus:border-transparent outline-none"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h2 className="text-xl font-semibold text-slate-800 mb-6">Welcome Section</h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Section Title
            </label>
            <input
              type="text"
              value={settings.welcome.title}
              onChange={(e) => updateSettings(['welcome', 'title'], e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#bb2738] focus:border-transparent outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Welcome Message
            </label>
            <textarea
              value={settings.welcome.message}
              onChange={(e) => updateSettings(['welcome', 'message'], e.target.value)}
              rows={4}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#bb2738] focus:border-transparent outline-none resize-none"
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="showStats"
              checked={settings.welcome.showStats}
              onChange={(e) => updateSettings(['welcome', 'showStats'], e.target.checked)}
              className="w-4 h-4 text-[#bb2738] rounded focus:ring-[#bb2738]"
            />
            <label htmlFor="showStats" className="text-sm font-medium text-slate-700">
              Show Statistics Cards
            </label>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-slate-800">Features</h2>
          <button
            onClick={addFeature}
            className="flex items-center gap-2 px-4 py-2 bg-[#bb2738] text-white rounded-lg hover:bg-[#a01f2f] transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Feature
          </button>
        </div>

        <div className="space-y-4">
          {settings.features.map((feature: any, index: number) => (
            <div key={index} className="p-4 border border-slate-200 rounded-lg">
              <div className="flex items-start justify-between mb-4">
                <h3 className="font-medium text-slate-800">Feature {index + 1}</h3>
                <button
                  onClick={() => removeFeature(index)}
                  className="p-1 text-red-600 hover:bg-red-50 rounded"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Icon Name (Lucide)
                  </label>
                  <input
                    type="text"
                    value={feature.icon}
                    onChange={(e) => {
                      const newFeatures = [...settings.features];
                      newFeatures[index].icon = e.target.value;
                      updateSettings(['features'], newFeatures);
                    }}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#bb2738] focus:border-transparent outline-none text-sm"
                    placeholder="e.g., Star, Package, FileText"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Title
                  </label>
                  <input
                    type="text"
                    value={feature.title}
                    onChange={(e) => {
                      const newFeatures = [...settings.features];
                      newFeatures[index].title = e.target.value;
                      updateSettings(['features'], newFeatures);
                    }}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#bb2738] focus:border-transparent outline-none text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={feature.description}
                    onChange={(e) => {
                      const newFeatures = [...settings.features];
                      newFeatures[index].description = e.target.value;
                      updateSettings(['features'], newFeatures);
                    }}
                    rows={2}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#bb2738] focus:border-transparent outline-none text-sm resize-none"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h2 className="text-xl font-semibold text-slate-800 mb-6">Contact Section</h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Section Title
            </label>
            <input
              type="text"
              value={settings.contact.title}
              onChange={(e) => updateSettings(['contact', 'title'], e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#bb2738] focus:border-transparent outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Message
            </label>
            <textarea
              value={settings.contact.message}
              onChange={(e) => updateSettings(['contact', 'message'], e.target.value)}
              rows={3}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#bb2738] focus:border-transparent outline-none resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Email
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
              Phone
            </label>
            <input
              type="tel"
              value={settings.contact.phone}
              onChange={(e) => updateSettings(['contact', 'phone'], e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#bb2738] focus:border-transparent outline-none"
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="showContactInfo"
              checked={settings.contact.showContactInfo}
              onChange={(e) => updateSettings(['contact', 'showContactInfo'], e.target.checked)}
              className="w-4 h-4 text-[#bb2738] rounded focus:ring-[#bb2738]"
            />
            <label htmlFor="showContactInfo" className="text-sm font-medium text-slate-700">
              Show Contact Information
            </label>
          </div>
        </div>
      </div>
        </>
      )}
    </div>
  );
}
