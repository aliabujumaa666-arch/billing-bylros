import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useToast } from '../contexts/ToastContext';
import { Send, Settings, FileText, CheckCircle, Loader, History, Zap, Eye, Save } from 'lucide-react';
import { MetaWhatsAppConnect } from './MetaWhatsAppConnect';
import { WhatsAppHistory } from './WhatsAppHistory';

interface WhatsAppSettings {
  id: string;
  api_provider: string;
  api_key: string;
  api_secret?: string;
  phone_number: string;
  webhook_url?: string;
  is_active: boolean;
}

interface Template {
  id: string;
  name: string;
  category: string;
  message_text: string;
  variables: string[];
  is_active: boolean;
}

interface Customer {
  id: string;
  name: string;
  phone: string;
}

export function WhatsAppMessaging() {
  const { success: showSuccess, error: showError } = useToast();
  const [activeTab, setActiveTab] = useState<'send' | 'settings' | 'templates' | 'history'>('send');
  const [settings, setSettings] = useState<WhatsAppSettings | null>(null);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [savingDraft, setSavingDraft] = useState(false);

  const [campaignName, setCampaignName] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [customMessage, setCustomMessage] = useState('');
  const [recipientFilter, setRecipientFilter] = useState<'all' | 'selected'>('all');
  const [selectedCustomers, setSelectedCustomers] = useState<string[]>([]);
  const [scheduleDate, setScheduleDate] = useState('');
  const [showPreview, setShowPreview] = useState(false);

  const [newTemplate, setNewTemplate] = useState({
    name: '',
    category: 'general',
    message_text: ''
  });

  const [apiSettings, setApiSettings] = useState({
    api_provider: 'twilio',
    api_key: '',
    api_secret: '',
    phone_number: '',
    webhook_url: ''
  });

  const [configMethod, setConfigMethod] = useState<'manual' | 'meta'>('meta');

  useEffect(() => {
    Promise.all([
      fetchSettings(),
      fetchTemplates(),
      fetchCustomers()
    ]).finally(() => setLoading(false));
  }, []);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('whatsapp_settings')
        .select('*')
        .eq('is_active', true)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;
      setSettings(data);
      if (data) {
        setApiSettings({
          api_provider: data.api_provider,
          api_key: data.api_key,
          api_secret: data.api_secret || '',
          phone_number: data.phone_number,
          webhook_url: data.webhook_url || ''
        });
      }
    } catch (err: any) {
      console.error('Error fetching settings:', err);
      showError('Failed to load WhatsApp settings');
    }
  };

  const fetchTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from('whatsapp_templates')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTemplates(data || []);
    } catch (err: any) {
      console.error('Error fetching templates:', err);
      showError('Failed to load templates');
    }
  };

  const fetchCustomers = async () => {
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('id, name, phone')
        .not('phone', 'is', null)
        .order('name');

      if (error) throw error;
      setCustomers(data || []);
    } catch (err: any) {
      console.error('Error fetching customers:', err);
      showError('Failed to load customers');
    }
  };

  const saveSettings = async () => {
    try {
      if (settings) {
        const { error } = await supabase
          .from('whatsapp_settings')
          .update({
            api_provider: apiSettings.api_provider,
            api_key: apiSettings.api_key,
            api_secret: apiSettings.api_secret,
            phone_number: apiSettings.phone_number,
            webhook_url: apiSettings.webhook_url,
            updated_at: new Date().toISOString()
          })
          .eq('id', settings.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('whatsapp_settings')
          .insert({
            ...apiSettings,
            is_active: true
          });

        if (error) throw error;
      }

      showSuccess('Settings saved successfully');
      await fetchSettings();
    } catch (err: any) {
      console.error('Error saving settings:', err);
      showError('Failed to save settings');
    }
  };

  const saveTemplate = async () => {
    try {
      const variables = extractVariables(newTemplate.message_text);

      const { error } = await supabase
        .from('whatsapp_templates')
        .insert({
          ...newTemplate,
          variables
        });

      if (error) throw error;

      showSuccess('Template created successfully');
      setNewTemplate({ name: '', category: 'general', message_text: '' });
      await fetchTemplates();
    } catch (err: any) {
      console.error('Error saving template:', err);
      showError('Failed to save template');
    }
  };

  const extractVariables = (text: string): string[] => {
    const matches = text.match(/\{([^}]+)\}/g);
    return matches ? matches.map(m => m.slice(1, -1)) : [];
  };

  const saveDraft = async () => {
    if (!campaignName) {
      showError('Please provide a campaign name');
      return;
    }

    setSavingDraft(true);
    try {
      const recipients = recipientFilter === 'all'
        ? customers
        : customers.filter(c => selectedCustomers.includes(c.id));

      const messageText = selectedTemplate
        ? templates.find(t => t.id === selectedTemplate)?.message_text || customMessage
        : customMessage;

      const { error } = await supabase
        .from('whatsapp_bulk_messages')
        .insert({
          campaign_name: `[DRAFT] ${campaignName}`,
          message_text: messageText || 'Draft message pending',
          total_recipients: recipients.length,
          status: 'pending',
          scheduled_at: scheduleDate || null,
          recipient_filter: { type: recipientFilter, customer_ids: selectedCustomers },
          created_by: (await supabase.auth.getUser()).data.user?.id
        });

      if (error) throw error;

      showSuccess('Draft saved successfully!');
      setCampaignName('');
      setCustomMessage('');
      setSelectedTemplate('');
      setSelectedCustomers([]);
      setScheduleDate('');
    } catch (err: any) {
      console.error('Error saving draft:', err);
      showError('Failed to save draft');
    } finally {
      setSavingDraft(false);
    }
  };

  const sendBulkMessage = async () => {
    if (!campaignName || (!selectedTemplate && !customMessage)) {
      showError('Please provide campaign name and message');
      return;
    }

    if (recipientFilter === 'selected' && selectedCustomers.length === 0) {
      showError('Please select at least one recipient');
      return;
    }

    setSending(true);
    try {
      const recipients = recipientFilter === 'all'
        ? customers
        : customers.filter(c => selectedCustomers.includes(c.id));

      const messageText = selectedTemplate
        ? templates.find(t => t.id === selectedTemplate)?.message_text || customMessage
        : customMessage;

      const { data: campaign, error: campaignError } = await supabase
        .from('whatsapp_bulk_messages')
        .insert({
          campaign_name: campaignName,
          message_text: messageText,
          total_recipients: recipients.length,
          status: scheduleDate ? 'scheduled' : 'pending',
          scheduled_at: scheduleDate || null,
          recipient_filter: { type: recipientFilter, customer_ids: selectedCustomers },
          created_by: (await supabase.auth.getUser()).data.user?.id,
          started_at: scheduleDate ? null : new Date().toISOString()
        })
        .select()
        .single();

      if (campaignError) throw campaignError;

      const queueItems = recipients.map(customer => ({
        bulk_message_id: campaign.id,
        customer_id: customer.id,
        phone_number: customer.phone,
        message_text: messageText,
        status: 'pending'
      }));

      const { error: queueError } = await supabase
        .from('whatsapp_message_queue')
        .insert(queueItems);

      if (queueError) throw queueError;

      showSuccess(`Campaign created successfully! ${recipients.length} messages queued.`);
      setCampaignName('');
      setCustomMessage('');
      setSelectedTemplate('');
      setSelectedCustomers([]);
      setScheduleDate('');
      setActiveTab('history');
    } catch (err: any) {
      console.error('Error sending bulk message:', err);
      showError('Failed to create campaign');
    } finally {
      setSending(false);
    }
  };

  const getPreviewMessage = () => {
    const messageText = selectedTemplate
      ? templates.find(t => t.id === selectedTemplate)?.message_text || customMessage
      : customMessage;

    return messageText.replace(/{name}/g, 'John Doe').replace(/{(\w+)}/g, '[Variable: $1]');
  };

  const deleteTemplate = async (id: string) => {
    try {
      const { error } = await supabase
        .from('whatsapp_templates')
        .delete()
        .eq('id', id);

      if (error) throw error;
      showSuccess('Template deleted successfully');
      await fetchTemplates();
    } catch (err: any) {
      console.error('Error deleting template:', err);
      showError('Failed to delete template');
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
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-800 mb-2">WhatsApp Messaging</h1>
        <p className="text-slate-600">Send bulk WhatsApp messages to your customers</p>
      </div>

      {!settings && activeTab !== 'settings' && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <p className="text-yellow-800 font-medium">WhatsApp not configured</p>
          <p className="text-yellow-700 text-sm mt-1">
            Please configure your WhatsApp API settings before sending messages.
          </p>
          <button
            onClick={() => setActiveTab('settings')}
            className="mt-3 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
          >
            Configure Now
          </button>
        </div>
      )}

      <div className="flex gap-2 mb-6 overflow-x-auto">
        <button
          onClick={() => setActiveTab('send')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors whitespace-nowrap ${
            activeTab === 'send'
              ? 'bg-[#bb2738] text-white'
              : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <Send className="w-4 h-4" />
          Send Message
        </button>
        <button
          onClick={() => setActiveTab('templates')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors whitespace-nowrap ${
            activeTab === 'templates'
              ? 'bg-[#bb2738] text-white'
              : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <FileText className="w-4 h-4" />
          Templates
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors whitespace-nowrap ${
            activeTab === 'history'
              ? 'bg-[#bb2738] text-white'
              : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <History className="w-4 h-4" />
          History
        </button>
        <button
          onClick={() => setActiveTab('settings')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors whitespace-nowrap ${
            activeTab === 'settings'
              ? 'bg-[#bb2738] text-white'
              : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <Settings className="w-4 h-4" />
          Settings
        </button>
      </div>

      {activeTab === 'send' && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Campaign Name
            </label>
            <input
              type="text"
              value={campaignName}
              onChange={(e) => setCampaignName(e.target.value)}
              placeholder="e.g., Monthly Newsletter"
              className="w-full px-4 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-[#bb2738]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Select Template (Optional)
            </label>
            <select
              value={selectedTemplate}
              onChange={(e) => {
                setSelectedTemplate(e.target.value);
                const template = templates.find(t => t.id === e.target.value);
                if (template) setCustomMessage(template.message_text);
              }}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-[#bb2738]"
            >
              <option value="">Custom Message</option>
              {templates.map(template => (
                <option key={template.id} value={template.id}>
                  {template.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Message
            </label>
            <textarea
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
              placeholder="Type your message here... Use {name} for customer name"
              rows={6}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-[#bb2738]"
            />
            <p className="text-xs text-slate-500 mt-1">
              Use variables like {'{name}'} to personalize messages
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Recipients
            </label>
            <div className="space-y-3">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  checked={recipientFilter === 'all'}
                  onChange={() => setRecipientFilter('all')}
                  className="text-[#bb2738] focus:ring-[#bb2738]"
                />
                <span>All Customers ({customers.length})</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  checked={recipientFilter === 'selected'}
                  onChange={() => setRecipientFilter('selected')}
                  className="text-[#bb2738] focus:ring-[#bb2738]"
                />
                <span>Selected Customers</span>
              </label>

              {recipientFilter === 'selected' && (
                <div className="ml-6 mt-3 max-h-64 overflow-y-auto border border-slate-200 rounded-lg p-4 space-y-2">
                  {customers.map(customer => (
                    <label key={customer.id} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={selectedCustomers.includes(customer.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedCustomers([...selectedCustomers, customer.id]);
                          } else {
                            setSelectedCustomers(selectedCustomers.filter(id => id !== customer.id));
                          }
                        }}
                        className="text-[#bb2738] focus:ring-[#bb2738]"
                      />
                      <span className="text-sm">{customer.name} - {customer.phone}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Schedule (Optional)
            </label>
            <input
              type="datetime-local"
              value={scheduleDate}
              onChange={(e) => setScheduleDate(e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-[#bb2738]"
            />
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setShowPreview(!showPreview)}
              disabled={!customMessage && !selectedTemplate}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-white border-2 border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Eye className="w-5 h-5" />
              {showPreview ? 'Hide Preview' : 'Preview Message'}
            </button>
            <button
              onClick={saveDraft}
              disabled={savingDraft || !campaignName}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-white border-2 border-blue-300 text-blue-700 rounded-lg hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {savingDraft ? (
                <>
                  <Loader className="w-5 h-5 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  Save Draft
                </>
              )}
            </button>
          </div>

          {showPreview && (customMessage || selectedTemplate) && (
            <div className="p-4 bg-slate-50 border-2 border-slate-200 rounded-lg">
              <p className="text-xs font-semibold text-slate-600 uppercase mb-2">Message Preview</p>
              <div className="bg-white p-4 rounded-lg border border-slate-300">
                <p className="text-sm text-slate-900 whitespace-pre-wrap">{getPreviewMessage()}</p>
              </div>
              <p className="text-xs text-slate-500 mt-2">
                Variables like {'{name}'} will be replaced with actual customer data
              </p>
            </div>
          )}

          <button
            onClick={sendBulkMessage}
            disabled={sending || !settings}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-[#bb2738] text-white rounded-lg hover:bg-[#a01f2f] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {sending ? (
              <>
                <Loader className="w-5 h-5 animate-spin" />
                Creating Campaign...
              </>
            ) : (
              <>
                <Send className="w-5 h-5" />
                {scheduleDate ? 'Schedule Campaign' : 'Send Now'}
              </>
            )}
          </button>
        </div>
      )}

      {activeTab === 'templates' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h2 className="text-lg font-semibold text-slate-800 mb-4">Create New Template</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Template Name
                </label>
                <input
                  type="text"
                  value={newTemplate.name}
                  onChange={(e) => setNewTemplate({ ...newTemplate, name: e.target.value })}
                  placeholder="e.g., Welcome Message"
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-[#bb2738]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Category
                </label>
                <select
                  value={newTemplate.category}
                  onChange={(e) => setNewTemplate({ ...newTemplate, category: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-[#bb2738]"
                >
                  <option value="general">General</option>
                  <option value="marketing">Marketing</option>
                  <option value="notification">Notification</option>
                  <option value="reminder">Reminder</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Message Text
                </label>
                <textarea
                  value={newTemplate.message_text}
                  onChange={(e) => setNewTemplate({ ...newTemplate, message_text: e.target.value })}
                  placeholder="Hello {name}, welcome to our service!"
                  rows={4}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-[#bb2738]"
                />
              </div>

              <button
                onClick={saveTemplate}
                disabled={!newTemplate.name || !newTemplate.message_text}
                className="px-6 py-2 bg-[#bb2738] text-white rounded-lg hover:bg-[#a01f2f] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Save Template
              </button>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="p-6 border-b border-slate-200">
              <h2 className="text-lg font-semibold text-slate-800">Saved Templates</h2>
            </div>
            <div className="divide-y divide-slate-200">
              {templates.length === 0 ? (
                <div className="p-12 text-center">
                  <FileText className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                  <p className="text-slate-500">No templates created yet</p>
                </div>
              ) : (
                templates.map(template => (
                  <div key={template.id} className="p-6 hover:bg-slate-50">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="font-semibold text-slate-900">{template.name}</h3>
                        <span className="text-xs text-slate-500 px-2 py-1 bg-slate-100 rounded mt-1 inline-block">
                          {template.category}
                        </span>
                      </div>
                      <button
                        onClick={() => deleteTemplate(template.id)}
                        className="text-red-600 hover:text-red-700 text-sm"
                      >
                        Delete
                      </button>
                    </div>
                    <p className="text-slate-600 text-sm mt-2">{template.message_text}</p>
                    {template.variables.length > 0 && (
                      <p className="text-xs text-slate-500 mt-2">
                        Variables: {template.variables.join(', ')}
                      </p>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'settings' && (
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-800 mb-4">WhatsApp API Settings</h2>

          {settings && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h3 className="font-semibold text-green-900">Connected</h3>
                  <p className="text-sm text-green-800 mt-1">
                    Provider: {settings.api_provider} | Phone: {settings.phone_number}
                  </p>
                </div>
                <button
                  onClick={() => {
                    if (confirm('Are you sure you want to disconnect and reconfigure?')) {
                      supabase
                        .from('whatsapp_settings')
                        .update({ is_active: false })
                        .eq('id', settings.id)
                        .then(() => {
                          setSettings(null);
                          showSuccess('Disconnected successfully');
                        });
                    }
                  }}
                  className="text-sm text-red-600 hover:text-red-700"
                >
                  Disconnect
                </button>
              </div>
            </div>
          )}

          <div className="mb-6">
            <div className="flex gap-2 p-1 bg-slate-100 rounded-lg">
              <button
                onClick={() => setConfigMethod('meta')}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md transition-colors ${
                  configMethod === 'meta'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Zap className="w-4 h-4" />
                Meta OAuth (Recommended)
              </button>
              <button
                onClick={() => setConfigMethod('manual')}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md transition-colors ${
                  configMethod === 'manual'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Settings className="w-4 h-4" />
                Manual Configuration
              </button>
            </div>
          </div>

          {configMethod === 'meta' ? (
            <MetaWhatsAppConnect onSuccess={fetchSettings} />
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  API Provider
                </label>
                <select
                  value={apiSettings.api_provider}
                  onChange={(e) => setApiSettings({ ...apiSettings, api_provider: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-[#bb2738]"
                >
                  <option value="twilio">Twilio</option>
                  <option value="vonage">Vonage</option>
                  <option value="whatsapp-business">WhatsApp Business API</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  API Key
                </label>
                <input
                  type="text"
                  value={apiSettings.api_key}
                  onChange={(e) => setApiSettings({ ...apiSettings, api_key: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-[#bb2738]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  API Secret
                </label>
                <input
                  type="password"
                  value={apiSettings.api_secret}
                  onChange={(e) => setApiSettings({ ...apiSettings, api_secret: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-[#bb2738]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Phone Number
                </label>
                <input
                  type="text"
                  value={apiSettings.phone_number}
                  onChange={(e) => setApiSettings({ ...apiSettings, phone_number: e.target.value })}
                  placeholder="+1234567890"
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-[#bb2738]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Webhook URL (Optional)
                </label>
                <input
                  type="url"
                  value={apiSettings.webhook_url}
                  onChange={(e) => setApiSettings({ ...apiSettings, webhook_url: e.target.value })}
                  placeholder="https://your-domain.com/webhook"
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-[#bb2738]"
                />
              </div>

              <button
                onClick={saveSettings}
                className="w-full px-6 py-3 bg-[#bb2738] text-white rounded-lg hover:bg-[#a01f2f] transition-colors"
              >
                Save Settings
              </button>
            </div>
          )}
        </div>
      )}

      {activeTab === 'history' && <WhatsAppHistory />}
    </div>
  );
}
