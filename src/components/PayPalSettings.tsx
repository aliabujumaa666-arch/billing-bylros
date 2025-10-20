import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Save, AlertCircle, CheckCircle, CreditCard, Eye, EyeOff } from 'lucide-react';

export function PayPalSettings() {
  const [settings, setSettings] = useState({
    client_id: '',
    client_secret: '',
    mode: 'sandbox',
    webhook_id: '',
    is_active: false,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showSecret, setShowSecret] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('paypal_settings')
        .select('*')
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setSettings({
          client_id: data.client_id || '',
          client_secret: data.client_secret || '',
          mode: data.mode || 'sandbox',
          webhook_id: data.webhook_id || '',
          is_active: data.is_active || false,
        });
      }
    } catch (err: any) {
      setError('Failed to load PayPal settings: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setError('');
    setSuccess('');
    setSaving(true);

    try {
      const { data: existing } = await supabase
        .from('paypal_settings')
        .select('id')
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from('paypal_settings')
          .update(settings)
          .eq('id', existing.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('paypal_settings')
          .insert([settings]);

        if (error) throw error;
      }

      setSuccess('PayPal settings saved successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError('Failed to save PayPal settings: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleTestConnection = async () => {
    setError('');
    setSuccess('');

    if (!settings.client_id || !settings.client_secret) {
      setError('Please enter both Client ID and Client Secret');
      return;
    }

    try {
      const apiUrl = settings.mode === 'live'
        ? 'https://api-m.paypal.com'
        : 'https://api-m.sandbox.paypal.com';

      const auth = btoa(`${settings.client_id}:${settings.client_secret}`);

      const response = await fetch(`${apiUrl}/v1/oauth2/token`, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: 'grant_type=client_credentials',
      });

      if (response.ok) {
        setSuccess('Connection successful! Your PayPal credentials are valid.');
        setTimeout(() => setSuccess(''), 5000);
      } else {
        throw new Error('Invalid credentials');
      }
    } catch (err: any) {
      setError('Connection failed: Invalid PayPal credentials. Please check your Client ID and Secret.');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#bb2738]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">PayPal Settings</h2>
          <p className="text-slate-600">Configure PayPal payment gateway integration</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-6 py-2 bg-[#bb2738] text-white rounded-lg hover:bg-[#a01f2f] transition-colors disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          {saving ? 'Saving...' : 'Save Settings'}
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div className="text-red-700">{error}</div>
        </div>
      )}

      {success && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3">
          <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
          <div className="text-green-700">{success}</div>
        </div>
      )}

      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
            <CreditCard className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-800">PayPal API Configuration</h3>
            <p className="text-sm text-slate-600">Enter your PayPal API credentials</p>
          </div>
        </div>

        <div className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Environment Mode
            </label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="mode"
                  value="sandbox"
                  checked={settings.mode === 'sandbox'}
                  onChange={(e) => setSettings({ ...settings, mode: e.target.value })}
                  className="w-4 h-4 text-[#bb2738] focus:ring-[#bb2738]"
                />
                <span className="text-sm text-slate-700">Sandbox (Testing)</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="mode"
                  value="live"
                  checked={settings.mode === 'live'}
                  onChange={(e) => setSettings({ ...settings, mode: e.target.value })}
                  className="w-4 h-4 text-[#bb2738] focus:ring-[#bb2738]"
                />
                <span className="text-sm text-slate-700">Live (Production)</span>
              </label>
            </div>
            <p className="text-xs text-slate-500 mt-2">
              Use Sandbox mode for testing. Switch to Live when ready for production.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              PayPal Client ID *
            </label>
            <input
              type="text"
              value={settings.client_id}
              onChange={(e) => setSettings({ ...settings, client_id: e.target.value })}
              placeholder="Enter your PayPal Client ID"
              className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#bb2738] focus:border-transparent outline-none"
            />
            <p className="text-xs text-slate-500 mt-1">
              Get this from your PayPal Developer Dashboard
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              PayPal Client Secret *
            </label>
            <div className="relative">
              <input
                type={showSecret ? 'text' : 'password'}
                value={settings.client_secret}
                onChange={(e) => setSettings({ ...settings, client_secret: e.target.value })}
                placeholder="Enter your PayPal Client Secret"
                className="w-full px-4 py-2.5 pr-12 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#bb2738] focus:border-transparent outline-none"
              />
              <button
                type="button"
                onClick={() => setShowSecret(!showSecret)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700"
              >
                {showSecret ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Keep this secret secure and never share it publicly
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Webhook ID (Optional)
            </label>
            <input
              type="text"
              value={settings.webhook_id}
              onChange={(e) => setSettings({ ...settings, webhook_id: e.target.value })}
              placeholder="Enter PayPal Webhook ID"
              className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#bb2738] focus:border-transparent outline-none"
            />
            <p className="text-xs text-slate-500 mt-1">
              Configure webhooks in PayPal Dashboard for automatic payment notifications
            </p>
          </div>

          <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-lg">
            <input
              type="checkbox"
              id="is_active"
              checked={settings.is_active}
              onChange={(e) => setSettings({ ...settings, is_active: e.target.checked })}
              className="w-5 h-5 text-[#bb2738] rounded focus:ring-[#bb2738]"
            />
            <label htmlFor="is_active" className="text-sm font-medium text-slate-700">
              Enable PayPal payments in customer portal
            </label>
          </div>

          <div className="pt-4 border-t border-slate-200">
            <button
              onClick={handleTestConnection}
              className="px-6 py-2.5 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors"
            >
              Test Connection
            </button>
          </div>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-5">
        <h4 className="font-semibold text-blue-900 mb-3">How to get PayPal API Credentials:</h4>
        <ol className="space-y-2 text-sm text-blue-800">
          <li className="flex gap-2">
            <span className="font-semibold">1.</span>
            <span>Go to <a href="https://developer.paypal.com/dashboard" target="_blank" rel="noopener noreferrer" className="underline hover:text-blue-900">PayPal Developer Dashboard</a></span>
          </li>
          <li className="flex gap-2">
            <span className="font-semibold">2.</span>
            <span>Log in with your PayPal account or create a developer account</span>
          </li>
          <li className="flex gap-2">
            <span className="font-semibold">3.</span>
            <span>Navigate to "Apps & Credentials" section</span>
          </li>
          <li className="flex gap-2">
            <span className="font-semibold">4.</span>
            <span>Create a new app or use an existing one</span>
          </li>
          <li className="flex gap-2">
            <span className="font-semibold">5.</span>
            <span>Copy the Client ID and Secret from the app details page</span>
          </li>
          <li className="flex gap-2">
            <span className="font-semibold">6.</span>
            <span>For production, ensure you switch to Live mode and use Live credentials</span>
          </li>
        </ol>
      </div>
    </div>
  );
}
