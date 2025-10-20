import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Save, AlertCircle, CheckCircle, CreditCard, Eye, EyeOff } from 'lucide-react';

export function StripeSettings() {
  const [settings, setSettings] = useState({
    publishable_key: '',
    secret_key: '',
    webhook_secret: '',
    is_active: false,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showSecret, setShowSecret] = useState(false);
  const [showWebhookSecret, setShowWebhookSecret] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('stripe_settings')
        .select('*')
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setSettings({
          publishable_key: data.publishable_key || '',
          secret_key: data.secret_key || '',
          webhook_secret: data.webhook_secret || '',
          is_active: data.is_active || false,
        });
      }
    } catch (err: any) {
      setError('Failed to load Stripe settings: ' + err.message);
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
        .from('stripe_settings')
        .select('id')
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from('stripe_settings')
          .update(settings)
          .eq('id', existing.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('stripe_settings')
          .insert([settings]);

        if (error) throw error;
      }

      setSuccess('Stripe settings saved successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError('Failed to save Stripe settings: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleTestConnection = async () => {
    setError('');
    setSuccess('');

    if (!settings.secret_key) {
      setError('Please enter the Secret Key');
      return;
    }

    try {
      const response = await fetch('https://api.stripe.com/v1/balance', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${settings.secret_key}`,
        },
      });

      if (response.ok) {
        setSuccess('Connection successful! Your Stripe credentials are valid.');
        setTimeout(() => setSuccess(''), 5000);
      } else {
        throw new Error('Invalid credentials');
      }
    } catch (err: any) {
      setError('Connection failed: Invalid Stripe credentials. Please check your Secret Key.');
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
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Stripe Settings</h2>
          <p className="text-slate-600">Configure Stripe payment gateway integration</p>
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
            <h3 className="text-lg font-semibold text-slate-800">Stripe API Configuration</h3>
            <p className="text-sm text-slate-600">Enter your Stripe API credentials</p>
          </div>
        </div>

        <div className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Stripe Publishable Key *
            </label>
            <input
              type="text"
              value={settings.publishable_key}
              onChange={(e) => setSettings({ ...settings, publishable_key: e.target.value })}
              placeholder="pk_test_... or pk_live_..."
              className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#bb2738] focus:border-transparent outline-none"
            />
            <p className="text-xs text-slate-500 mt-1">
              Get this from your Stripe Dashboard (starts with pk_)
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Stripe Secret Key *
            </label>
            <div className="relative">
              <input
                type={showSecret ? 'text' : 'password'}
                value={settings.secret_key}
                onChange={(e) => setSettings({ ...settings, secret_key: e.target.value })}
                placeholder="sk_test_... or sk_live_..."
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
              Keep this secret secure and never share it publicly (starts with sk_)
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Webhook Signing Secret (Optional)
            </label>
            <div className="relative">
              <input
                type={showWebhookSecret ? 'text' : 'password'}
                value={settings.webhook_secret}
                onChange={(e) => setSettings({ ...settings, webhook_secret: e.target.value })}
                placeholder="whsec_..."
                className="w-full px-4 py-2.5 pr-12 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#bb2738] focus:border-transparent outline-none"
              />
              <button
                type="button"
                onClick={() => setShowWebhookSecret(!showWebhookSecret)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700"
              >
                {showWebhookSecret ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Configure webhooks in Stripe Dashboard for automatic payment notifications
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
              Enable Stripe payments in customer portal
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
        <h4 className="font-semibold text-blue-900 mb-3">How to get Stripe API Credentials:</h4>
        <ol className="space-y-2 text-sm text-blue-800">
          <li className="flex gap-2">
            <span className="font-semibold">1.</span>
            <span>Go to <a href="https://dashboard.stripe.com" target="_blank" rel="noopener noreferrer" className="underline hover:text-blue-900">Stripe Dashboard</a></span>
          </li>
          <li className="flex gap-2">
            <span className="font-semibold">2.</span>
            <span>Log in with your Stripe account or create a new account</span>
          </li>
          <li className="flex gap-2">
            <span className="font-semibold">3.</span>
            <span>Navigate to "Developers" → "API keys" section</span>
          </li>
          <li className="flex gap-2">
            <span className="font-semibold">4.</span>
            <span>Use test keys (pk_test_..., sk_test_...) for testing</span>
          </li>
          <li className="flex gap-2">
            <span className="font-semibold">5.</span>
            <span>For production, switch to live mode and use live keys (pk_live_..., sk_live_...)</span>
          </li>
          <li className="flex gap-2">
            <span className="font-semibold">6.</span>
            <span>For webhooks: Go to "Developers" → "Webhooks" and add your endpoint URL</span>
          </li>
        </ol>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-lg p-5">
        <h4 className="font-semibold text-amber-900 mb-3">Important Security Notes:</h4>
        <ul className="space-y-2 text-sm text-amber-800">
          <li className="flex gap-2">
            <span>•</span>
            <span>The Publishable Key (pk_...) is safe to use in your frontend code</span>
          </li>
          <li className="flex gap-2">
            <span>•</span>
            <span>The Secret Key (sk_...) must NEVER be exposed in your frontend - it's only used on the server</span>
          </li>
          <li className="flex gap-2">
            <span>•</span>
            <span>Always use test keys during development and testing</span>
          </li>
          <li className="flex gap-2">
            <span>•</span>
            <span>Only switch to live keys when you're ready for production payments</span>
          </li>
        </ul>
      </div>
    </div>
  );
}
