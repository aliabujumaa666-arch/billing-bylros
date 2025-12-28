import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import {
  Save, Eye, Plus, Trash2, Settings, CreditCard, Building2, Mail,
  Keyboard, Menu, Search, ChevronLeft, ChevronRight, X, AlertCircle,
  CheckCircle, FileText, Phone, GripVertical,
  Monitor, Smartphone, Home, Info, UserPlus
} from 'lucide-react';
import { PayPalSettings } from './PayPalSettings';
import { StripeSettings } from './StripeSettings';
import { BrandSettings } from './BrandSettings';
import EmailSettings from './EmailSettings';
import { KeyboardShortcutSettings } from './KeyboardShortcutSettings';
import { NavigationMenuSettings } from './NavigationMenuSettings';
import { BankTransferSettings } from './BankTransferSettings';
import { CustomerRegistrationSettings } from './CustomerRegistrationSettings';

type TabType = 'brand' | 'portal' | 'navigation' | 'registration' | 'paypal' | 'stripe' | 'bank' | 'email' | 'shortcuts';

interface Toast {
  id: number;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
}

export function PortalSettings() {
  const [activeTab, setActiveTab] = useState<TabType>('brand');
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [originalSettings, setOriginalSettings] = useState<any>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [previewMode, setPreviewMode] = useState<'desktop' | 'mobile'>('desktop');
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    fetchSettings();
  }, []);

  useEffect(() => {
    if (settings && originalSettings) {
      setHasUnsavedChanges(JSON.stringify(settings) !== JSON.stringify(originalSettings));
    }
  }, [settings, originalSettings]);

  const addToast = (type: Toast['type'], message: string) => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 5000);
  };

  const removeToast = (id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

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
        setOriginalSettings(JSON.parse(JSON.stringify(data.setting_value)));
      }
    } catch (err: any) {
      setError('Failed to load settings: ' + err.message);
      addToast('error', 'Failed to load settings: ' + err.message);
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

      setOriginalSettings(JSON.parse(JSON.stringify(settings)));
      setSuccess('Settings saved successfully!');
      addToast('success', 'Settings saved successfully!');
      setHasUnsavedChanges(false);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError('Failed to save settings: ' + err.message);
      addToast('error', 'Failed to save settings: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDiscard = () => {
    if (window.confirm('Are you sure you want to discard all unsaved changes?')) {
      setSettings(JSON.parse(JSON.stringify(originalSettings)));
      setHasUnsavedChanges(false);
      addToast('info', 'Changes discarded');
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
    addToast('info', 'New feature added');
  };

  const removeFeature = (index: number) => {
    if (window.confirm('Are you sure you want to remove this feature?')) {
      setSettings((prev: any) => ({
        ...prev,
        features: prev.features.filter((_: any, i: number) => i !== index)
      }));
      addToast('info', 'Feature removed');
    }
  };

  const moveFeature = (index: number, direction: 'up' | 'down') => {
    setSettings((prev: any) => {
      const newFeatures = [...prev.features];
      const newIndex = direction === 'up' ? index - 1 : index + 1;
      if (newIndex < 0 || newIndex >= newFeatures.length) return prev;

      [newFeatures[index], newFeatures[newIndex]] = [newFeatures[newIndex], newFeatures[index]];

      return {
        ...prev,
        features: newFeatures
      };
    });
  };

  const navigationItems = [
    { id: 'brand' as TabType, label: 'Brand Identity', icon: Building2, section: 'Brand', description: 'Company info and branding' },
    { id: 'portal' as TabType, label: 'Portal Content', icon: Home, section: 'Portal', description: 'Customer portal homepage' },
    { id: 'navigation' as TabType, label: 'Navigation Menus', icon: Menu, section: 'Portal', description: 'Header and footer menus' },
    { id: 'registration' as TabType, label: 'Customer Registration', icon: UserPlus, section: 'Portal', description: 'Self-registration settings' },
    { id: 'paypal' as TabType, label: 'PayPal', icon: CreditCard, section: 'Integrations', description: 'PayPal payment gateway' },
    { id: 'stripe' as TabType, label: 'Stripe', icon: CreditCard, section: 'Integrations', description: 'Stripe payment gateway' },
    { id: 'bank' as TabType, label: 'Bank Transfer', icon: Building2, section: 'Integrations', description: 'Bank transfer payment' },
    { id: 'email' as TabType, label: 'Email Settings', icon: Mail, section: 'System', description: 'SMTP and email config' },
    { id: 'shortcuts' as TabType, label: 'Keyboard Shortcuts', icon: Keyboard, section: 'System', description: 'Keyboard shortcut config' },
  ];

  const filteredNavItems = navigationItems.filter(item =>
    item.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const groupedNavItems = filteredNavItems.reduce((acc, item) => {
    if (!acc[item.section]) {
      acc[item.section] = [];
    }
    acc[item.section].push(item);
    return acc;
  }, {} as Record<string, typeof navigationItems>);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-[#bb2738] border-t-transparent mx-auto mb-4"></div>
          <p className="text-slate-600 font-medium">Loading settings...</p>
        </div>
      </div>
    );
  }

  if (!settings && activeTab === 'portal') {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-lg text-red-700">
        <div className="flex items-center gap-2">
          <AlertCircle className="w-5 h-5" />
          <span className="font-medium">Failed to load portal settings</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Toast Notifications */}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {toasts.map(toast => (
          <div
            key={toast.id}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg backdrop-blur-sm animate-slide-in-right ${
              toast.type === 'success' ? 'bg-green-500 text-white' :
              toast.type === 'error' ? 'bg-red-500 text-white' :
              toast.type === 'warning' ? 'bg-yellow-500 text-white' :
              'bg-blue-500 text-white'
            }`}
          >
            {toast.type === 'success' && <CheckCircle className="w-5 h-5" />}
            {toast.type === 'error' && <AlertCircle className="w-5 h-5" />}
            {toast.type === 'info' && <Info className="w-5 h-5" />}
            <span className="flex-1 font-medium">{toast.message}</span>
            <button onClick={() => removeToast(toast.id)} className="hover:opacity-75">
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      {/* Sidebar Navigation */}
      <div className={`${sidebarCollapsed ? 'w-20' : 'w-72'} bg-white border-r border-slate-200 flex flex-col transition-all duration-300 shadow-xl`}>
        {/* Sidebar Header */}
        <div className="p-6 border-b border-slate-200">
          <div className="flex items-center justify-between mb-4">
            {!sidebarCollapsed && (
              <div>
                <h2 className="text-xl font-bold text-slate-800">Settings</h2>
                <p className="text-sm text-slate-500">Configure your platform</p>
              </div>
            )}
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors ml-auto"
            >
              {sidebarCollapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
            </button>
          </div>

          {!sidebarCollapsed && (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search settings..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#bb2738] focus:border-transparent outline-none text-sm"
              />
            </div>
          )}
        </div>

        {/* Navigation Items */}
        <div className="flex-1 overflow-y-auto p-3">
          {Object.entries(groupedNavItems).map(([section, items]) => (
            <div key={section} className="mb-6">
              {!sidebarCollapsed && (
                <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 px-3">
                  {section}
                </h3>
              )}
              <div className="space-y-1">
                {items.map(item => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setActiveTab(item.id)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
                        isActive
                          ? 'bg-[#bb2738] text-white shadow-md'
                          : 'text-slate-700 hover:bg-slate-100'
                      }`}
                      title={sidebarCollapsed ? item.label : ''}
                    >
                      <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                      {!sidebarCollapsed && (
                        <div className="flex-1 text-left">
                          <div className={`font-medium text-sm ${isActive ? 'text-white' : 'text-slate-800'}`}>
                            {item.label}
                          </div>
                          <div className={`text-xs ${isActive ? 'text-white/80' : 'text-slate-500'}`}>
                            {item.description}
                          </div>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Sidebar Footer */}
        {!sidebarCollapsed && hasUnsavedChanges && activeTab === 'portal' && (
          <div className="p-4 border-t border-slate-200 bg-yellow-50">
            <div className="flex items-center gap-2 text-yellow-800 text-sm mb-2">
              <AlertCircle className="w-4 h-4" />
              <span className="font-medium">Unsaved Changes</span>
            </div>
            <p className="text-xs text-yellow-700 mb-3">You have unsaved changes in this section</p>
            <div className="flex gap-2">
              <button
                onClick={handleDiscard}
                className="flex-1 px-3 py-1.5 bg-white border border-yellow-300 text-yellow-800 rounded text-xs font-medium hover:bg-yellow-100 transition-colors"
              >
                Discard
              </button>
              <button
                onClick={handleSave}
                className="flex-1 px-3 py-1.5 bg-[#bb2738] text-white rounded text-xs font-medium hover:bg-[#a01f2f] transition-colors"
              >
                Save Now
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-white border-b border-slate-200 px-8 py-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                {(() => {
                  const currentItem = navigationItems.find(item => item.id === activeTab);
                  const Icon = currentItem?.icon || Settings;
                  return <Icon className="w-8 h-8 text-[#bb2738]" />;
                })()}
                <h1 className="text-3xl font-bold text-slate-800">
                  {navigationItems.find(item => item.id === activeTab)?.label || 'Settings'}
                </h1>
              </div>
              <p className="text-slate-600">
                {navigationItems.find(item => item.id === activeTab)?.description || 'Manage your settings'}
              </p>
            </div>
            <div className="flex gap-3">
              {activeTab === 'portal' && (
                <>
                  <button
                    onClick={() => setShowPreview(!showPreview)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors border ${
                      showPreview
                        ? 'bg-slate-100 border-slate-300 text-slate-700'
                        : 'bg-white border-slate-300 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <Eye className="w-4 h-4" />
                    {showPreview ? 'Hide Preview' : 'Show Preview'}
                  </button>
                  <a
                    href="/customer"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors"
                  >
                    <Eye className="w-4 h-4" />
                    Open Portal
                  </a>
                  <button
                    onClick={handleSave}
                    disabled={saving || !hasUnsavedChanges}
                    className="flex items-center gap-2 px-6 py-2 bg-[#bb2738] text-white rounded-lg hover:bg-[#a01f2f] transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
                  >
                    <Save className="w-4 h-4" />
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto">
          <div className={`${showPreview && activeTab === 'portal' ? 'grid grid-cols-2 gap-6' : ''} h-full`}>
            {/* Settings Panel */}
            <div className={`${showPreview && activeTab === 'portal' ? '' : 'max-w-6xl mx-auto'} p-8`}>
              {activeTab === 'brand' ? (
                <BrandSettings />
              ) : activeTab === 'paypal' ? (
                <PayPalSettings />
              ) : activeTab === 'stripe' ? (
                <StripeSettings />
              ) : activeTab === 'bank' ? (
                <BankTransferSettings />
              ) : activeTab === 'email' ? (
                <EmailSettings />
              ) : activeTab === 'navigation' ? (
                <NavigationMenuSettings />
              ) : activeTab === 'registration' ? (
                <CustomerRegistrationSettings />
              ) : activeTab === 'shortcuts' ? (
                <KeyboardShortcutSettings />
              ) : (
                <div className="space-y-6">
                  {error && (
                    <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 flex items-center gap-2">
                      <AlertCircle className="w-5 h-5" />
                      {error}
                    </div>
                  )}

                  {success && (
                    <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-green-700 flex items-center gap-2">
                      <CheckCircle className="w-5 h-5" />
                      {success}
                    </div>
                  )}

                  {/* Hero Section */}
                  <div className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                    <div className="p-6 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-[#bb2738]/10 rounded-lg">
                          <Home className="w-6 h-6 text-[#bb2738]" />
                        </div>
                        <div>
                          <h2 className="text-xl font-semibold text-slate-800">Hero Section</h2>
                          <p className="text-sm text-slate-500">Main banner at the top of your portal</p>
                        </div>
                      </div>
                    </div>

                    <div className="p-6 space-y-5">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Main Title
                          <span className="text-slate-400 font-normal ml-2">(Displayed prominently on homepage)</span>
                        </label>
                        <input
                          type="text"
                          value={settings.hero.title}
                          onChange={(e) => updateSettings(['hero', 'title'], e.target.value)}
                          className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#bb2738] focus:border-transparent outline-none transition-shadow"
                          placeholder="Welcome to Our Customer Portal"
                        />
                        <p className="mt-1 text-xs text-slate-500">Recommended: 30-60 characters</p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Subtitle
                          <span className="text-slate-400 font-normal ml-2">(Supporting text below title)</span>
                        </label>
                        <input
                          type="text"
                          value={settings.hero.subtitle}
                          onChange={(e) => updateSettings(['hero', 'subtitle'], e.target.value)}
                          className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#bb2738] focus:border-transparent outline-none transition-shadow"
                          placeholder="Access your orders, quotes, and support"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Background Color
                        </label>
                        <div className="flex gap-3">
                          <div className="relative">
                            <input
                              type="color"
                              value={settings.hero.backgroundColor}
                              onChange={(e) => updateSettings(['hero', 'backgroundColor'], e.target.value)}
                              className="w-20 h-12 rounded-lg cursor-pointer border-2 border-slate-300"
                            />
                          </div>
                          <input
                            type="text"
                            value={settings.hero.backgroundColor}
                            onChange={(e) => updateSettings(['hero', 'backgroundColor'], e.target.value)}
                            className="flex-1 px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#bb2738] focus:border-transparent outline-none font-mono"
                            placeholder="#000000"
                          />
                          <div
                            className="w-20 h-12 rounded-lg border-2 border-slate-300"
                            style={{ backgroundColor: settings.hero.backgroundColor }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Welcome Section */}
                  <div className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                    <div className="p-6 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-[#bb2738]/10 rounded-lg">
                          <FileText className="w-6 h-6 text-[#bb2738]" />
                        </div>
                        <div>
                          <h2 className="text-xl font-semibold text-slate-800">Welcome Section</h2>
                          <p className="text-sm text-slate-500">Greeting message for your customers</p>
                        </div>
                      </div>
                    </div>

                    <div className="p-6 space-y-5">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Section Title
                        </label>
                        <input
                          type="text"
                          value={settings.welcome.title}
                          onChange={(e) => updateSettings(['welcome', 'title'], e.target.value)}
                          className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#bb2738] focus:border-transparent outline-none transition-shadow"
                          placeholder="Welcome Back"
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
                          className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#bb2738] focus:border-transparent outline-none resize-none transition-shadow"
                          placeholder="Thank you for choosing us. Access all your information in one place."
                        />
                        <p className="mt-1 text-xs text-slate-500">
                          {settings.welcome.message.length} characters
                        </p>
                      </div>

                      <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-lg">
                        <input
                          type="checkbox"
                          id="showStats"
                          checked={settings.welcome.showStats}
                          onChange={(e) => updateSettings(['welcome', 'showStats'], e.target.checked)}
                          className="w-5 h-5 text-[#bb2738] rounded focus:ring-[#bb2738]"
                        />
                        <label htmlFor="showStats" className="flex-1">
                          <div className="text-sm font-medium text-slate-700">Show Statistics Cards</div>
                          <div className="text-xs text-slate-500">Display order count, quotes, and invoices</div>
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* Features Section */}
                  <div className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                    <div className="p-6 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-[#bb2738]/10 rounded-lg">
                            <Settings className="w-6 h-6 text-[#bb2738]" />
                          </div>
                          <div>
                            <h2 className="text-xl font-semibold text-slate-800">Features Showcase</h2>
                            <p className="text-sm text-slate-500">Highlight key features of your portal</p>
                          </div>
                        </div>
                        <button
                          onClick={addFeature}
                          className="flex items-center gap-2 px-4 py-2 bg-[#bb2738] text-white rounded-lg hover:bg-[#a01f2f] transition-colors shadow-sm"
                        >
                          <Plus className="w-4 h-4" />
                          Add Feature
                        </button>
                      </div>
                    </div>

                    <div className="p-6">
                      {settings.features.length === 0 ? (
                        <div className="text-center py-12 text-slate-500">
                          <Settings className="w-12 h-12 mx-auto mb-3 opacity-50" />
                          <p className="font-medium">No features added yet</p>
                          <p className="text-sm">Click "Add Feature" to showcase your portal's capabilities</p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {settings.features.map((feature: any, index: number) => (
                            <div key={index} className="p-5 border-2 border-slate-200 rounded-lg hover:border-[#bb2738]/30 transition-colors bg-slate-50/50">
                              <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center gap-3">
                                  <div className="flex flex-col gap-1">
                                    <button
                                      onClick={() => moveFeature(index, 'up')}
                                      disabled={index === 0}
                                      className="p-1 hover:bg-slate-200 rounded disabled:opacity-30 disabled:cursor-not-allowed"
                                      title="Move up"
                                    >
                                      <ChevronLeft className="w-4 h-4 rotate-90" />
                                    </button>
                                    <button
                                      onClick={() => moveFeature(index, 'down')}
                                      disabled={index === settings.features.length - 1}
                                      className="p-1 hover:bg-slate-200 rounded disabled:opacity-30 disabled:cursor-not-allowed"
                                      title="Move down"
                                    >
                                      <ChevronRight className="w-4 h-4 rotate-90" />
                                    </button>
                                  </div>
                                  <div className="p-2 bg-white rounded-lg border border-slate-300">
                                    <GripVertical className="w-4 h-4 text-slate-400" />
                                  </div>
                                  <h3 className="font-semibold text-slate-800">Feature {index + 1}</h3>
                                </div>
                                <button
                                  onClick={() => removeFeature(index)}
                                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                  title="Remove feature"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>

                              <div className="space-y-4">
                                <div>
                                  <label className="block text-sm font-medium text-slate-700 mb-2">
                                    Icon Name (Lucide Icons)
                                  </label>
                                  <input
                                    type="text"
                                    value={feature.icon}
                                    onChange={(e) => {
                                      const newFeatures = [...settings.features];
                                      newFeatures[index].icon = e.target.value;
                                      updateSettings(['features'], newFeatures);
                                    }}
                                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#bb2738] focus:border-transparent outline-none text-sm"
                                    placeholder="e.g., Star, Package, FileText"
                                  />
                                  <p className="mt-1 text-xs text-slate-500">
                                    Browse icons at <a href="https://lucide.dev" target="_blank" rel="noopener noreferrer" className="text-[#bb2738] hover:underline">lucide.dev</a>
                                  </p>
                                </div>

                                <div>
                                  <label className="block text-sm font-medium text-slate-700 mb-2">
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
                                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#bb2738] focus:border-transparent outline-none text-sm"
                                    placeholder="Feature name"
                                  />
                                </div>

                                <div>
                                  <label className="block text-sm font-medium text-slate-700 mb-2">
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
                                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#bb2738] focus:border-transparent outline-none text-sm resize-none"
                                    placeholder="Describe this feature"
                                  />
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Contact Section */}
                  <div className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                    <div className="p-6 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-[#bb2738]/10 rounded-lg">
                          <Phone className="w-6 h-6 text-[#bb2738]" />
                        </div>
                        <div>
                          <h2 className="text-xl font-semibold text-slate-800">Contact Section</h2>
                          <p className="text-sm text-slate-500">Display contact information on portal</p>
                        </div>
                      </div>
                    </div>

                    <div className="p-6 space-y-5">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Section Title
                        </label>
                        <input
                          type="text"
                          value={settings.contact.title}
                          onChange={(e) => updateSettings(['contact', 'title'], e.target.value)}
                          className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#bb2738] focus:border-transparent outline-none transition-shadow"
                          placeholder="Get in Touch"
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
                          className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#bb2738] focus:border-transparent outline-none resize-none transition-shadow"
                          placeholder="We're here to help. Contact us anytime."
                        />
                      </div>

                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2">
                            Email
                          </label>
                          <input
                            type="email"
                            value={settings.contact.email}
                            onChange={(e) => updateSettings(['contact', 'email'], e.target.value)}
                            className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#bb2738] focus:border-transparent outline-none transition-shadow"
                            placeholder="support@company.com"
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
                            className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#bb2738] focus:border-transparent outline-none transition-shadow"
                            placeholder="+1 (555) 123-4567"
                          />
                        </div>
                      </div>

                      <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-lg">
                        <input
                          type="checkbox"
                          id="showContactInfo"
                          checked={settings.contact.showContactInfo}
                          onChange={(e) => updateSettings(['contact', 'showContactInfo'], e.target.checked)}
                          className="w-5 h-5 text-[#bb2738] rounded focus:ring-[#bb2738]"
                        />
                        <label htmlFor="showContactInfo" className="flex-1">
                          <div className="text-sm font-medium text-slate-700">Show Contact Information</div>
                          <div className="text-xs text-slate-500">Display email and phone on the portal</div>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Preview Panel */}
            {showPreview && activeTab === 'portal' && (
              <div className="border-l border-slate-200 bg-white p-6 overflow-y-auto">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-slate-800">Live Preview</h3>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setPreviewMode('desktop')}
                      className={`p-2 rounded-lg transition-colors ${
                        previewMode === 'desktop'
                          ? 'bg-[#bb2738] text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                      title="Desktop view"
                    >
                      <Monitor className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setPreviewMode('mobile')}
                      className={`p-2 rounded-lg transition-colors ${
                        previewMode === 'mobile'
                          ? 'bg-[#bb2738] text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                      title="Mobile view"
                    >
                      <Smartphone className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className={`border-2 border-slate-300 rounded-lg overflow-hidden ${
                  previewMode === 'mobile' ? 'max-w-sm mx-auto' : ''
                }`}>
                  <div className="bg-slate-100 p-2 border-b border-slate-300 flex items-center gap-2">
                    <div className="flex gap-1.5">
                      <div className="w-3 h-3 rounded-full bg-red-400"></div>
                      <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                      <div className="w-3 h-3 rounded-full bg-green-400"></div>
                    </div>
                    <div className="flex-1 bg-white rounded px-3 py-1 text-xs text-slate-500">
                      /customer
                    </div>
                  </div>

                  <div className="bg-white overflow-y-auto" style={{ height: '600px' }}>
                    {/* Hero Preview */}
                    <div
                      className="p-8 text-white text-center"
                      style={{ backgroundColor: settings.hero.backgroundColor }}
                    >
                      <h1 className="text-3xl font-bold mb-2">{settings.hero.title}</h1>
                      <p className="text-lg opacity-90">{settings.hero.subtitle}</p>
                    </div>

                    {/* Welcome Preview */}
                    <div className="p-8">
                      <h2 className="text-2xl font-bold text-slate-800 mb-4">{settings.welcome.title}</h2>
                      <p className="text-slate-600 mb-6">{settings.welcome.message}</p>

                      {settings.welcome.showStats && (
                        <div className="grid grid-cols-3 gap-4 mb-6">
                          {['Orders', 'Quotes', 'Invoices'].map((stat, i) => (
                            <div key={i} className="p-4 bg-slate-50 rounded-lg text-center">
                              <div className="text-2xl font-bold text-[#bb2738]">{i * 5 + 3}</div>
                              <div className="text-sm text-slate-600">{stat}</div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Features Preview */}
                    {settings.features.length > 0 && (
                      <div className="p-8 bg-slate-50">
                        <h2 className="text-2xl font-bold text-slate-800 mb-6 text-center">Features</h2>
                        <div className="grid grid-cols-2 gap-4">
                          {settings.features.map((feature: any, i: number) => (
                            <div key={i} className="p-4 bg-white rounded-lg">
                              <div className="text-[#bb2738] mb-2">
                                <Settings className="w-6 h-6" />
                              </div>
                              <h3 className="font-semibold text-slate-800 mb-1">{feature.title}</h3>
                              <p className="text-sm text-slate-600">{feature.description}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Contact Preview */}
                    {settings.contact.showContactInfo && (
                      <div className="p-8 bg-white">
                        <h2 className="text-2xl font-bold text-slate-800 mb-4">{settings.contact.title}</h2>
                        <p className="text-slate-600 mb-4">{settings.contact.message}</p>
                        <div className="space-y-2 text-sm">
                          <p className="text-slate-700">
                            <strong>Email:</strong> {settings.contact.email}
                          </p>
                          <p className="text-slate-700">
                            <strong>Phone:</strong> {settings.contact.phone}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes slide-in-right {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }

        .animate-slide-in-right {
          animation: slide-in-right 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
