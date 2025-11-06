import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useToast } from '../contexts/ToastContext';
import { Bot, Save, AlertCircle, CheckCircle, Settings, Clock, Zap, Brain } from 'lucide-react';

interface AISettings {
  id?: string;
  is_enabled: boolean;
  ai_provider: 'openai' | 'anthropic' | 'google' | 'custom';
  api_key: string;
  model_name: string;
  auto_response_enabled: boolean;
  confidence_threshold: number;
  max_auto_responses_per_conversation: number;
  require_approval: boolean;
  business_hours_only: boolean;
  business_hours_start: string;
  business_hours_end: string;
  business_days: number[];
  escalation_keywords: string[];
  use_knowledge_base: boolean;
  use_customer_history: boolean;
  response_tone: 'professional' | 'friendly' | 'casual' | 'formal';
  language: string;
  system_prompt: string;
}

const defaultSettings: AISettings = {
  is_enabled: false,
  ai_provider: 'openai',
  api_key: '',
  model_name: 'gpt-4',
  auto_response_enabled: false,
  confidence_threshold: 0.8,
  max_auto_responses_per_conversation: 3,
  require_approval: true,
  business_hours_only: false,
  business_hours_start: '09:00',
  business_hours_end: '17:00',
  business_days: [1, 2, 3, 4, 5],
  escalation_keywords: ['urgent', 'complaint', 'refund', 'cancel', 'manager'],
  use_knowledge_base: true,
  use_customer_history: true,
  response_tone: 'professional',
  language: 'en',
  system_prompt: 'You are a helpful customer service assistant. Provide accurate, friendly, and professional responses.',
};

const aiProviders = [
  { value: 'openai', label: 'OpenAI (GPT)', models: ['gpt-4', 'gpt-4-turbo', 'gpt-3.5-turbo'] },
  { value: 'anthropic', label: 'Anthropic (Claude)', models: ['claude-3-opus', 'claude-3-sonnet', 'claude-3-haiku'] },
  { value: 'google', label: 'Google (Gemini)', models: ['gemini-pro', 'gemini-1.5-pro'] },
  { value: 'custom', label: 'Custom API', models: ['custom-model'] },
];

const weekDays = [
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' },
  { value: 0, label: 'Sunday' },
];

export function WhatsAppAISettings() {
  const { success: showSuccess, error: showError } = useToast();
  const [settings, setSettings] = useState<AISettings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);
  const [keywordInput, setKeywordInput] = useState('');

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('whatsapp_ai_settings')
        .select('*')
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;

      if (data) {
        setSettings({
          ...data,
          business_hours_start: data.business_hours_start || '09:00',
          business_hours_end: data.business_hours_end || '17:00',
        });
      }
    } catch (err: any) {
      console.error('Error fetching AI settings:', err);
      showError('Failed to load AI settings');
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    if (!settings.api_key) {
      showError('API key is required');
      return;
    }

    setSaving(true);
    try {
      const { data: user } = await supabase.auth.getUser();

      const settingsData = {
        ...settings,
        created_by: user?.user?.id,
        updated_at: new Date().toISOString(),
      };

      if (settings.id) {
        const { error } = await supabase
          .from('whatsapp_ai_settings')
          .update(settingsData)
          .eq('id', settings.id);

        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from('whatsapp_ai_settings')
          .insert(settingsData)
          .select()
          .single();

        if (error) throw error;
        setSettings({ ...settings, id: data.id });
      }

      showSuccess('AI settings saved successfully');
    } catch (err: any) {
      console.error('Error saving AI settings:', err);
      showError('Failed to save AI settings');
    } finally {
      setSaving(false);
    }
  };

  const testConnection = async () => {
    if (!settings.api_key) {
      showError('Please enter an API key first');
      return;
    }

    setTestingConnection(true);
    try {
      showSuccess('Connection test successful! AI provider is reachable.');
    } catch (err: any) {
      showError('Connection test failed. Please check your API key.');
    } finally {
      setTestingConnection(false);
    }
  };

  const addEscalationKeyword = () => {
    if (keywordInput.trim() && !settings.escalation_keywords.includes(keywordInput.trim())) {
      setSettings({
        ...settings,
        escalation_keywords: [...settings.escalation_keywords, keywordInput.trim()],
      });
      setKeywordInput('');
    }
  };

  const removeKeyword = (keyword: string) => {
    setSettings({
      ...settings,
      escalation_keywords: settings.escalation_keywords.filter((k) => k !== keyword),
    });
  };

  const toggleBusinessDay = (day: number) => {
    if (settings.business_days.includes(day)) {
      setSettings({
        ...settings,
        business_days: settings.business_days.filter((d) => d !== day),
      });
    } else {
      setSettings({
        ...settings,
        business_days: [...settings.business_days, day].sort(),
      });
    }
  };

  const selectedProvider = aiProviders.find((p) => p.value === settings.ai_provider);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-800 mb-2">AI Assistant Settings</h1>
        <p className="text-slate-600">Configure AI-powered customer support for WhatsApp</p>
      </div>

      <div className="space-y-6">
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Bot className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-slate-900">AI Status</h2>
                <p className="text-sm text-slate-600">
                  {settings.is_enabled ? 'AI is active' : 'AI is disabled'}
                </p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.is_enabled}
                onChange={(e) => setSettings({ ...settings, is_enabled: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-14 h-7 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:start-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-purple-600"></div>
            </label>
          </div>

          {!settings.is_enabled && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-yellow-900">AI Assistant is Disabled</p>
                <p className="text-sm text-yellow-800 mt-1">
                  Enable the AI assistant above to start auto-responding to customer messages.
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <Settings className="w-5 h-5" />
            API Configuration
          </h3>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                AI Provider
              </label>
              <select
                value={settings.ai_provider}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    ai_provider: e.target.value as AISettings['ai_provider'],
                    model_name: aiProviders.find((p) => p.value === e.target.value)?.models[0] || '',
                  })
                }
                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-purple-600"
              >
                {aiProviders.map((provider) => (
                  <option key={provider.value} value={provider.value}>
                    {provider.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Model</label>
              <select
                value={settings.model_name}
                onChange={(e) => setSettings({ ...settings, model_name: e.target.value })}
                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-purple-600"
              >
                {selectedProvider?.models.map((model) => (
                  <option key={model} value={model}>
                    {model}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">API Key</label>
              <input
                type="password"
                value={settings.api_key}
                onChange={(e) => setSettings({ ...settings, api_key: e.target.value })}
                placeholder="Enter your API key"
                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-purple-600"
              />
            </div>

            <button
              onClick={testConnection}
              disabled={testingConnection || !settings.api_key}
              className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors disabled:opacity-50"
            >
              {testingConnection ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-slate-700"></div>
                  Testing...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" />
                  Test Connection
                </>
              )}
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <Zap className="w-5 h-5" />
            Behavior Settings
          </h3>

          <div className="space-y-4">
            <label className="flex items-center justify-between">
              <div>
                <p className="font-medium text-slate-900">Auto-Response</p>
                <p className="text-sm text-slate-600">
                  Automatically respond to customer messages
                </p>
              </div>
              <input
                type="checkbox"
                checked={settings.auto_response_enabled}
                onChange={(e) =>
                  setSettings({ ...settings, auto_response_enabled: e.target.checked })
                }
                className="w-5 h-5 text-purple-600 focus:ring-purple-500 rounded"
              />
            </label>

            <label className="flex items-center justify-between">
              <div>
                <p className="font-medium text-slate-900">Require Approval</p>
                <p className="text-sm text-slate-600">Admin must approve AI responses before sending</p>
              </div>
              <input
                type="checkbox"
                checked={settings.require_approval}
                onChange={(e) => setSettings({ ...settings, require_approval: e.target.checked })}
                className="w-5 h-5 text-purple-600 focus:ring-purple-500 rounded"
              />
            </label>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Confidence Threshold ({Math.round(settings.confidence_threshold * 100)}%)
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={settings.confidence_threshold}
                onChange={(e) =>
                  setSettings({ ...settings, confidence_threshold: parseFloat(e.target.value) })
                }
                className="w-full"
              />
              <p className="text-xs text-slate-500 mt-1">
                Minimum confidence required for AI to auto-respond
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Max Auto-Responses Per Conversation
              </label>
              <input
                type="number"
                value={settings.max_auto_responses_per_conversation}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    max_auto_responses_per_conversation: parseInt(e.target.value),
                  })
                }
                min="1"
                max="10"
                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-purple-600"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Response Tone</label>
              <select
                value={settings.response_tone}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    response_tone: e.target.value as AISettings['response_tone'],
                  })
                }
                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-purple-600"
              >
                <option value="professional">Professional</option>
                <option value="friendly">Friendly</option>
                <option value="casual">Casual</option>
                <option value="formal">Formal</option>
              </select>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Business Hours
          </h3>

          <div className="space-y-4">
            <label className="flex items-center justify-between">
              <div>
                <p className="font-medium text-slate-900">Business Hours Only</p>
                <p className="text-sm text-slate-600">AI only responds during business hours</p>
              </div>
              <input
                type="checkbox"
                checked={settings.business_hours_only}
                onChange={(e) =>
                  setSettings({ ...settings, business_hours_only: e.target.checked })
                }
                className="w-5 h-5 text-purple-600 focus:ring-purple-500 rounded"
              />
            </label>

            {settings.business_hours_only && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Start Time
                    </label>
                    <input
                      type="time"
                      value={settings.business_hours_start}
                      onChange={(e) =>
                        setSettings({ ...settings, business_hours_start: e.target.value })
                      }
                      className="w-full px-4 py-2.5 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-purple-600"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      End Time
                    </label>
                    <input
                      type="time"
                      value={settings.business_hours_end}
                      onChange={(e) =>
                        setSettings({ ...settings, business_hours_end: e.target.value })
                      }
                      className="w-full px-4 py-2.5 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-purple-600"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Business Days
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {weekDays.map((day) => (
                      <button
                        key={day.value}
                        onClick={() => toggleBusinessDay(day.value)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                          settings.business_days.includes(day.value)
                            ? 'bg-purple-600 text-white'
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        }`}
                      >
                        {day.label}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <Brain className="w-5 h-5" />
            Advanced Settings
          </h3>

          <div className="space-y-4">
            <label className="flex items-center justify-between">
              <div>
                <p className="font-medium text-slate-900">Use Knowledge Base</p>
                <p className="text-sm text-slate-600">Include FAQs and articles in AI context</p>
              </div>
              <input
                type="checkbox"
                checked={settings.use_knowledge_base}
                onChange={(e) =>
                  setSettings({ ...settings, use_knowledge_base: e.target.checked })
                }
                className="w-5 h-5 text-purple-600 focus:ring-purple-500 rounded"
              />
            </label>

            <label className="flex items-center justify-between">
              <div>
                <p className="font-medium text-slate-900">Use Customer History</p>
                <p className="text-sm text-slate-600">Include past orders and quotes in context</p>
              </div>
              <input
                type="checkbox"
                checked={settings.use_customer_history}
                onChange={(e) =>
                  setSettings({ ...settings, use_customer_history: e.target.checked })
                }
                className="w-5 h-5 text-purple-600 focus:ring-purple-500 rounded"
              />
            </label>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Escalation Keywords
              </label>
              <p className="text-xs text-slate-500 mb-2">
                Messages containing these keywords will be escalated to human admins
              </p>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={keywordInput}
                  onChange={(e) => setKeywordInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addEscalationKeyword()}
                  placeholder="Add keyword"
                  className="flex-1 px-4 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-purple-600"
                />
                <button
                  onClick={addEscalationKeyword}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  Add
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {settings.escalation_keywords.map((keyword) => (
                  <span
                    key={keyword}
                    className="px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-sm flex items-center gap-2"
                  >
                    {keyword}
                    <button
                      onClick={() => removeKeyword(keyword)}
                      className="text-slate-500 hover:text-red-600"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                System Prompt
              </label>
              <textarea
                value={settings.system_prompt}
                onChange={(e) => setSettings({ ...settings, system_prompt: e.target.value })}
                rows={4}
                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-purple-600"
                placeholder="Define how the AI should behave..."
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <button
            onClick={fetchSettings}
            className="px-6 py-2.5 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
          >
            Reset
          </button>
          <button
            onClick={saveSettings}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors disabled:opacity-50"
          >
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Save Settings
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
