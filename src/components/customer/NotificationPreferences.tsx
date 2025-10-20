import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useCustomerAuth } from '../../contexts/CustomerAuthContext';
import { useToast } from '../../contexts/ToastContext';
import { Mail, MessageSquare, Smartphone, Save } from 'lucide-react';

interface Preferences {
  email_quotes: boolean;
  email_orders: boolean;
  email_invoices: boolean;
  email_reminders: boolean;
  email_marketing: boolean;
  sms_critical: boolean;
  sms_updates: boolean;
  in_app_messages: boolean;
}

export function NotificationPreferences() {
  const { customerData } = useCustomerAuth();
  const { success, error: showError } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [preferences, setPreferences] = useState<Preferences>({
    email_quotes: true,
    email_orders: true,
    email_invoices: true,
    email_reminders: true,
    email_marketing: false,
    sms_critical: true,
    sms_updates: false,
    in_app_messages: true,
  });

  useEffect(() => {
    console.log('NotificationPreferences - customerData:', customerData);

    if (customerData === null) {
      console.log('NotificationPreferences - customerData is null, waiting...');
      return;
    }

    if (customerData && customerData.customer_id) {
      console.log('NotificationPreferences - fetching preferences for customer:', customerData.customer_id);
      fetchPreferences();
    } else if (customerData && !customerData.customer_id) {
      console.error('Customer data missing customer_id:', customerData);
      setLoading(false);
    }
  }, [customerData]);

  const fetchPreferences = async () => {
    if (!customerData || !customerData.customer_id) {
      console.error('Cannot fetch preferences: missing customer data');
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('customer_id', customerData.customer_id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        setPreferences({
          email_quotes: data.email_quotes ?? true,
          email_orders: data.email_orders ?? true,
          email_invoices: data.email_invoices ?? true,
          email_reminders: data.email_reminders ?? true,
          email_marketing: data.email_marketing ?? false,
          sms_critical: data.sms_critical ?? true,
          sms_updates: data.sms_updates ?? false,
          in_app_messages: data.in_app_messages ?? true,
        });
      }
    } catch (err: any) {
      console.error('Error fetching preferences:', err);
      showError('Failed to load notification preferences');
    } finally {
      setLoading(false);
    }
  };

  const savePreferences = async () => {
    if (!customerData) return;

    setSaving(true);
    try {
      const { data: existing } = await supabase
        .from('notification_preferences')
        .select('id')
        .eq('customer_id', customerData.customer_id)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from('notification_preferences')
          .update({
            ...preferences,
            updated_at: new Date().toISOString(),
          })
          .eq('customer_id', customerData.customer_id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('notification_preferences')
          .insert([{
            customer_id: customerData.customer_id,
            ...preferences,
          }]);

        if (error) throw error;
      }

      success('Notification preferences saved successfully');
    } catch (err: any) {
      console.error('Error saving preferences:', err);
      showError(err.message || 'Failed to save preferences');
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = (key: keyof Preferences) => {
    setPreferences(prev => ({ ...prev, [key]: !prev[key] }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#bb2738]"></div>
      </div>
    );
  }

  if (!customerData || !customerData.customer_id) {
    return (
      <div className="max-w-4xl">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-red-800 mb-2">Unable to Load Preferences</h2>
          <p className="text-red-700">Customer data is not available. Please try refreshing the page or contact support if the issue persists.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-800 mb-2">Notification Preferences</h1>
        <p className="text-slate-600">Manage how you receive updates from BYLROS</p>
      </div>

      <div className="space-y-6">
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="bg-gradient-to-r from-[#bb2738] to-[#a01f2f] p-6">
            <div className="flex items-center gap-3 text-white">
              <Mail className="w-6 h-6" />
              <div>
                <h2 className="text-xl font-bold">Email Notifications</h2>
                <p className="text-white/80 text-sm">Choose what emails you want to receive</p>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between py-3 border-b border-slate-200">
              <div>
                <p className="font-medium text-slate-800">Quote Updates</p>
                <p className="text-sm text-slate-600">Get notified when new quotes are created or updated</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={preferences.email_quotes}
                  onChange={() => handleToggle('email_quotes')}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#bb2738]/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#bb2738]"></div>
              </label>
            </div>

            <div className="flex items-center justify-between py-3 border-b border-slate-200">
              <div>
                <p className="font-medium text-slate-800">Order Updates</p>
                <p className="text-sm text-slate-600">Receive notifications about order status changes</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={preferences.email_orders}
                  onChange={() => handleToggle('email_orders')}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#bb2738]/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#bb2738]"></div>
              </label>
            </div>

            <div className="flex items-center justify-between py-3 border-b border-slate-200">
              <div>
                <p className="font-medium text-slate-800">Invoice Notifications</p>
                <p className="text-sm text-slate-600">Get alerts about new invoices and payments</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={preferences.email_invoices}
                  onChange={() => handleToggle('email_invoices')}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#bb2738]/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#bb2738]"></div>
              </label>
            </div>

            <div className="flex items-center justify-between py-3 border-b border-slate-200">
              <div>
                <p className="font-medium text-slate-800">Payment Reminders</p>
                <p className="text-sm text-slate-600">Receive reminders for pending payments</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={preferences.email_reminders}
                  onChange={() => handleToggle('email_reminders')}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#bb2738]/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#bb2738]"></div>
              </label>
            </div>

            <div className="flex items-center justify-between py-3">
              <div>
                <p className="font-medium text-slate-800">Marketing Emails</p>
                <p className="text-sm text-slate-600">Promotional offers and company news</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={preferences.email_marketing}
                  onChange={() => handleToggle('email_marketing')}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#bb2738]/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#bb2738]"></div>
              </label>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="bg-gradient-to-r from-green-600 to-emerald-600 p-6">
            <div className="flex items-center gap-3 text-white">
              <Smartphone className="w-6 h-6" />
              <div>
                <h2 className="text-xl font-bold">SMS Notifications</h2>
                <p className="text-white/80 text-sm">Receive important updates via text message</p>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between py-3 border-b border-slate-200">
              <div>
                <p className="font-medium text-slate-800">Critical Alerts</p>
                <p className="text-sm text-slate-600">Urgent updates about orders and deliveries</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={preferences.sms_critical}
                  onChange={() => handleToggle('sms_critical')}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-600/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between py-3">
              <div>
                <p className="font-medium text-slate-800">General Updates</p>
                <p className="text-sm text-slate-600">Non-urgent status updates and reminders</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={preferences.sms_updates}
                  onChange={() => handleToggle('sms_updates')}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-600/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
              </label>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-cyan-600 p-6">
            <div className="flex items-center gap-3 text-white">
              <MessageSquare className="w-6 h-6" />
              <div>
                <h2 className="text-xl font-bold">In-App Notifications</h2>
                <p className="text-white/80 text-sm">Notifications within the customer portal</p>
              </div>
            </div>
          </div>

          <div className="p-6">
            <div className="flex items-center justify-between py-3">
              <div>
                <p className="font-medium text-slate-800">Portal Messages</p>
                <p className="text-sm text-slate-600">Receive messages from admin in the portal</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={preferences.in_app_messages}
                  onChange={() => handleToggle('in_app_messages')}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-600/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            onClick={savePreferences}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-3 bg-[#bb2738] hover:bg-[#a01f2f] disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
          >
            <Save className="w-5 h-5" />
            {saving ? 'Saving...' : 'Save Preferences'}
          </button>
        </div>
      </div>
    </div>
  );
}
