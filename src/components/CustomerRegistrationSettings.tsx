import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Save, AlertCircle, CheckCircle, UserPlus, ShieldCheck, Settings as SettingsIcon } from 'lucide-react';

interface RegistrationSettings {
  enabled: boolean;
  requireApproval: boolean;
  defaultStatus: string;
  notifyAdmin: boolean;
  customMessage: string;
}

export function CustomerRegistrationSettings() {
  const [settings, setSettings] = useState<RegistrationSettings>({
    enabled: true,
    requireApproval: false,
    defaultStatus: 'Lead',
    notifyAdmin: false,
    customMessage: 'Create an account to access your quotes, orders, and invoices.'
  });
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
        .select('setting_value')
        .eq('setting_key', 'customer_registration')
        .maybeSingle();

      if (error) throw error;

      if (data?.setting_value) {
        setSettings(data.setting_value as RegistrationSettings);
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
          updated_at: new Date().toISOString()
        })
        .eq('setting_key', 'customer_registration');

      if (error) throw error;

      setSuccess('Registration settings saved successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError('Failed to save settings: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#bb2738] border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg p-6 shadow-sm border border-slate-200">
        <div className="flex items-start gap-3">
          <div className="p-3 bg-blue-50 rounded-lg">
            <UserPlus className="w-6 h-6 text-blue-600" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-slate-800 mb-1">Customer Self-Registration</h3>
            <p className="text-sm text-slate-600">
              Control how customers can register for accounts on your customer portal. Configure approval workflows, default statuses, and registration availability.
            </p>
          </div>
        </div>
      </div>

      {/* Status Messages */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-red-800">Error</p>
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      )}

      {success && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3">
          <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-green-800">Success</p>
            <p className="text-sm text-green-700">{success}</p>
          </div>
        </div>
      )}

      {/* Registration Status */}
      <div className="bg-white rounded-lg p-6 shadow-sm border border-slate-200 space-y-4">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-slate-50 rounded-lg">
            <SettingsIcon className="w-5 h-5 text-slate-600" />
          </div>
          <div className="flex-1">
            <h4 className="text-base font-semibold text-slate-800 mb-1">Registration Status</h4>
            <p className="text-sm text-slate-600 mb-4">
              Enable or disable customer self-registration on the customer portal login page.
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
          <div className="flex-1">
            <p className="text-sm font-medium text-slate-800">Allow Self-Registration</p>
            <p className="text-xs text-slate-600">Customers can create their own accounts</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={settings.enabled}
              onChange={(e) => setSettings({ ...settings, enabled: e.target.checked })}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-slate-300 rounded-full peer peer-checked:bg-[#bb2738] peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
          </label>
        </div>

        {!settings.enabled && (
          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800">
              Registration is disabled. Customers will need to contact support to create an account.
            </p>
          </div>
        )}
      </div>

      {/* Approval Workflow */}
      {settings.enabled && (
        <div className="bg-white rounded-lg p-6 shadow-sm border border-slate-200 space-y-4">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-slate-50 rounded-lg">
              <ShieldCheck className="w-5 h-5 text-slate-600" />
            </div>
            <div className="flex-1">
              <h4 className="text-base font-semibold text-slate-800 mb-1">Approval Workflow</h4>
              <p className="text-sm text-slate-600 mb-4">
                Configure whether new registrations require admin approval before customers can access the portal.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
            <div className="flex-1">
              <p className="text-sm font-medium text-slate-800">Require Admin Approval</p>
              <p className="text-xs text-slate-600">New customers must be approved before they can login</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.requireApproval}
                onChange={(e) => setSettings({ ...settings, requireApproval: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-300 rounded-full peer peer-checked:bg-[#bb2738] peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
            </label>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-700">
              Default Customer Status
            </label>
            <select
              value={settings.defaultStatus}
              onChange={(e) => setSettings({ ...settings, defaultStatus: e.target.value })}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#bb2738] focus:border-transparent"
            >
              <option value="Lead">Lead</option>
              <option value="Pending">Pending</option>
              <option value="Active">Active</option>
            </select>
            <p className="text-xs text-slate-500">
              {settings.requireApproval
                ? 'Status will be set to "Pending" until admin approves, then changed to this status'
                : 'This status will be assigned to newly registered customers'}
            </p>
          </div>

          {settings.requireApproval && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                Customers with "Pending" status cannot log in until an admin changes their status.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Custom Message */}
      {settings.enabled && (
        <div className="bg-white rounded-lg p-6 shadow-sm border border-slate-200 space-y-4">
          <div>
            <h4 className="text-base font-semibold text-slate-800 mb-1">Registration Message</h4>
            <p className="text-sm text-slate-600 mb-4">
              Customize the message shown to customers on the login page below the registration button.
            </p>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-700">
              Custom Message
            </label>
            <textarea
              value={settings.customMessage}
              onChange={(e) => setSettings({ ...settings, customMessage: e.target.value })}
              rows={3}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#bb2738] focus:border-transparent"
              placeholder="Enter a message to encourage customer registration..."
            />
            <p className="text-xs text-slate-500">
              This message appears below the "Create an account" button on the login page.
            </p>
          </div>
        </div>
      )}

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-6 py-3 bg-[#bb2738] hover:bg-[#a01f2f] text-white font-semibold rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
        >
          <Save className="w-5 h-5" />
          {saving ? 'Saving...' : 'Save Settings'}
        </button>
      </div>

      {/* Information Panel */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="text-sm font-semibold text-blue-900 mb-2">How It Works</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• When enabled, customers can create accounts from the customer portal login page</li>
          <li>• Self-registered customers are automatically added to your customer database</li>
          <li>• With approval enabled, customers must wait for admin approval before accessing the portal</li>
          <li>• All self-registered customers are marked in the notes field for easy identification</li>
          <li>• You can filter self-registered customers in the Customers page using the status filter</li>
        </ul>
      </div>
    </div>
  );
}
