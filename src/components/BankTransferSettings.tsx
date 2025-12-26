import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Save, Building2, CreditCard, AlertCircle, Copy, Check } from 'lucide-react';

interface BankTransferSettings {
  id?: string;
  bank_name: string;
  account_holder_name: string;
  account_number: string;
  iban: string;
  swift_bic: string;
  branch_name: string;
  branch_code: string;
  currency: string;
  payment_instructions: string;
  is_active: boolean;
  require_proof_upload: boolean;
  verification_wait_time: string;
}

export function BankTransferSettings() {
  const [settings, setSettings] = useState<BankTransferSettings>({
    bank_name: '',
    account_holder_name: '',
    account_number: '',
    iban: '',
    swift_bic: '',
    branch_name: '',
    branch_code: '',
    currency: 'AED',
    payment_instructions: 'Please use your invoice number as the payment reference.',
    is_active: false,
    require_proof_upload: true,
    verification_wait_time: '1-2 business days'
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [copiedField, setCopiedField] = useState<string | null>(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('bank_transfer_settings')
        .select('*')
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setSettings(data);
      }
    } catch (err: any) {
      setError('Failed to load bank transfer settings: ' + err.message);
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
        .from('bank_transfer_settings')
        .select('id')
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from('bank_transfer_settings')
          .update({
            ...settings,
            updated_at: new Date().toISOString()
          })
          .eq('id', existing.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('bank_transfer_settings')
          .insert([settings]);

        if (error) throw error;
      }

      setSuccess('Bank transfer settings saved successfully!');
      setTimeout(() => setSuccess(''), 3000);
      await fetchSettings();
    } catch (err: any) {
      setError('Failed to save settings: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#bb2738]"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-white">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Building2 className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-800">Bank Transfer Settings</h2>
              <p className="text-slate-600">Configure bank account details for customer payments</p>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {error && (
            <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="flex items-center gap-2 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
              <Check className="w-5 h-5 flex-shrink-0" />
              <span>{success}</span>
            </div>
          )}

          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-200">
            <div>
              <label className="flex items-center gap-3 cursor-pointer">
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={settings.is_active}
                    onChange={(e) => setSettings({ ...settings, is_active: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-14 h-7 bg-slate-300 rounded-full peer peer-checked:bg-green-500 transition-colors"></div>
                  <div className="absolute left-1 top-1 w-5 h-5 bg-white rounded-full transition-transform peer-checked:translate-x-7"></div>
                </div>
                <div>
                  <span className="font-semibold text-slate-800">Enable Bank Transfer</span>
                  <p className="text-sm text-slate-600">Allow customers to pay via bank transfer</p>
                </div>
              </label>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Bank Name *
              </label>
              <input
                type="text"
                value={settings.bank_name}
                onChange={(e) => setSettings({ ...settings, bank_name: e.target.value })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., Emirates NBD"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Account Holder Name *
              </label>
              <input
                type="text"
                value={settings.account_holder_name}
                onChange={(e) => setSettings({ ...settings, account_holder_name: e.target.value })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Your Company Name"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Account Number *
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={settings.account_number}
                  onChange={(e) => setSettings({ ...settings, account_number: e.target.value })}
                  className="w-full px-4 py-2 pr-10 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="XXXX-XXXX-XXXX"
                  required
                />
                <button
                  type="button"
                  onClick={() => copyToClipboard(settings.account_number, 'account_number')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2 hover:bg-slate-100 rounded transition-colors"
                >
                  {copiedField === 'account_number' ? (
                    <Check className="w-4 h-4 text-green-600" />
                  ) : (
                    <Copy className="w-4 h-4 text-slate-400" />
                  )}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                IBAN
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={settings.iban}
                  onChange={(e) => setSettings({ ...settings, iban: e.target.value })}
                  className="w-full px-4 py-2 pr-10 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="AE07XXXXXXXXXXXXXXXXXXXX"
                />
                {settings.iban && (
                  <button
                    type="button"
                    onClick={() => copyToClipboard(settings.iban, 'iban')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2 hover:bg-slate-100 rounded transition-colors"
                  >
                    {copiedField === 'iban' ? (
                      <Check className="w-4 h-4 text-green-600" />
                    ) : (
                      <Copy className="w-4 h-4 text-slate-400" />
                    )}
                  </button>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                SWIFT/BIC Code
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={settings.swift_bic}
                  onChange={(e) => setSettings({ ...settings, swift_bic: e.target.value })}
                  className="w-full px-4 py-2 pr-10 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="EBILAEAD"
                />
                {settings.swift_bic && (
                  <button
                    type="button"
                    onClick={() => copyToClipboard(settings.swift_bic, 'swift_bic')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2 hover:bg-slate-100 rounded transition-colors"
                  >
                    {copiedField === 'swift_bic' ? (
                      <Check className="w-4 h-4 text-green-600" />
                    ) : (
                      <Copy className="w-4 h-4 text-slate-400" />
                    )}
                  </button>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Currency
              </label>
              <select
                value={settings.currency}
                onChange={(e) => setSettings({ ...settings, currency: e.target.value })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="AED">AED - UAE Dirham</option>
                <option value="USD">USD - US Dollar</option>
                <option value="EUR">EUR - Euro</option>
                <option value="GBP">GBP - British Pound</option>
                <option value="SAR">SAR - Saudi Riyal</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Branch Name
              </label>
              <input
                type="text"
                value={settings.branch_name}
                onChange={(e) => setSettings({ ...settings, branch_name: e.target.value })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Dubai Marina Branch"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Branch Code
              </label>
              <input
                type="text"
                value={settings.branch_code}
                onChange={(e) => setSettings({ ...settings, branch_code: e.target.value })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="001"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Payment Instructions
            </label>
            <textarea
              value={settings.payment_instructions}
              onChange={(e) => setSettings({ ...settings, payment_instructions: e.target.value })}
              rows={4}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter instructions for customers making bank transfers..."
            />
            <p className="mt-2 text-sm text-slate-500">
              These instructions will be shown to customers when they select bank transfer as payment method.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Verification Wait Time
            </label>
            <input
              type="text"
              value={settings.verification_wait_time}
              onChange={(e) => setSettings({ ...settings, verification_wait_time: e.target.value })}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="1-2 business days"
            />
            <p className="mt-2 text-sm text-slate-500">
              Expected time for payment verification (shown to customers)
            </p>
          </div>

          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.require_proof_upload}
                onChange={(e) => setSettings({ ...settings, require_proof_upload: e.target.checked })}
                className="mt-1 w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
              />
              <div>
                <span className="font-medium text-slate-800">Require Proof of Payment</span>
                <p className="text-sm text-slate-600 mt-1">
                  Customers must upload a payment receipt or transfer screenshot when paying via bank transfer
                </p>
              </div>
            </label>
          </div>

          <div className="flex justify-end pt-4 border-t border-slate-200">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-6 py-3 bg-[#bb2738] text-white rounded-lg hover:bg-[#a01f2f] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="w-5 h-5" />
              {saving ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </div>
      </div>

      {settings.is_active && (
        <div className="mt-6 bg-gradient-to-r from-blue-50 to-slate-50 rounded-xl p-6 border border-blue-200">
          <div className="flex items-start gap-3">
            <CreditCard className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
            <div>
              <h3 className="font-semibold text-slate-800 mb-2">Bank Transfer Preview</h3>
              <p className="text-sm text-slate-600 mb-4">
                This is how customers will see your bank details:
              </p>
              <div className="bg-white rounded-lg p-4 border border-slate-200 space-y-3">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-slate-600">Bank Name:</span>
                    <p className="font-semibold text-slate-800">{settings.bank_name || 'Not set'}</p>
                  </div>
                  <div>
                    <span className="text-slate-600">Account Holder:</span>
                    <p className="font-semibold text-slate-800">{settings.account_holder_name || 'Not set'}</p>
                  </div>
                  <div>
                    <span className="text-slate-600">Account Number:</span>
                    <p className="font-semibold text-slate-800">{settings.account_number || 'Not set'}</p>
                  </div>
                  {settings.iban && (
                    <div>
                      <span className="text-slate-600">IBAN:</span>
                      <p className="font-semibold text-slate-800">{settings.iban}</p>
                    </div>
                  )}
                  {settings.swift_bic && (
                    <div>
                      <span className="text-slate-600">SWIFT/BIC:</span>
                      <p className="font-semibold text-slate-800">{settings.swift_bic}</p>
                    </div>
                  )}
                  <div>
                    <span className="text-slate-600">Currency:</span>
                    <p className="font-semibold text-slate-800">{settings.currency}</p>
                  </div>
                </div>
                {settings.payment_instructions && (
                  <div className="pt-3 border-t border-slate-200">
                    <span className="text-sm text-slate-600">Instructions:</span>
                    <p className="text-sm text-slate-800 mt-1">{settings.payment_instructions}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
