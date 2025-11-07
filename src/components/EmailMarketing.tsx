import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useToast } from '../contexts/ToastContext';
import {
  Mail, Plus, Send, Users, BarChart3, Calendar,
  Eye, Trash2, Copy, Pause, Play, X, Filter,
  TrendingUp, MousePointerClick, AlertCircle
} from 'lucide-react';

interface EmailCampaign {
  id: string;
  name: string;
  subject: string;
  from_name: string;
  from_email: string;
  reply_to?: string;
  body_html: string;
  body_text?: string;
  status: 'draft' | 'scheduled' | 'sending' | 'sent' | 'paused' | 'cancelled';
  scheduled_at?: string;
  sent_at?: string;
  target_audience: string;
  custom_filter?: any;
  total_recipients: number;
  sent_count: number;
  delivered_count: number;
  opened_count: number;
  clicked_count: number;
  bounced_count: number;
  unsubscribed_count: number;
  created_at: string;
  updated_at: string;
}

interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: string;
}

export default function EmailMarketing() {
  const [campaigns, setCampaigns] = useState<EmailCampaign[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCampaignModal, setShowCampaignModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<EmailCampaign | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'draft' | 'scheduled' | 'sent'>('all');
  const { success, error: showError } = useToast();

  const [formData, setFormData] = useState({
    name: '',
    subject: '',
    from_name: 'BYLROS',
    from_email: 'admin@bylros.ae',
    reply_to: '',
    body_html: '',
    body_text: '',
    target_audience: 'all',
    scheduled_at: '',
  });

  useEffect(() => {
    fetchCampaigns();
    fetchCustomers();
  }, []);

  const fetchCampaigns = async () => {
    try {
      const { data, error } = await supabase
        .from('email_campaigns')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCampaigns(data || []);
    } catch (err) {
      console.error('Error fetching campaigns:', err);
      showError('Failed to load campaigns');
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomers = async () => {
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('id, name, email, phone, status');

      if (error) throw error;
      setCustomers(data || []);
    } catch (err) {
      console.error('Error fetching customers:', err);
    }
  };

  const getRecipientCount = (audience: string) => {
    if (audience === 'all') return customers.length;
    return customers.filter(c => c.status.toLowerCase() === audience).length;
  };

  const handleCreateCampaign = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const recipientCount = getRecipientCount(formData.target_audience);

      if (recipientCount === 0) {
        showError('No recipients found for selected audience');
        return;
      }

      const { data: user } = await supabase.auth.getUser();

      const campaignData = {
        ...formData,
        total_recipients: recipientCount,
        created_by: user.user?.id,
        scheduled_at: formData.scheduled_at || null,
        status: formData.scheduled_at ? 'scheduled' : 'draft',
      };

      if (selectedCampaign) {
        const { error } = await supabase
          .from('email_campaigns')
          .update(campaignData)
          .eq('id', selectedCampaign.id);

        if (error) throw error;
        success('Campaign updated successfully');
      } else {
        const { data: campaign, error } = await supabase
          .from('email_campaigns')
          .insert([campaignData])
          .select()
          .single();

        if (error) throw error;

        await createRecipients(campaign.id, formData.target_audience);
        success('Campaign created successfully');
      }

      setShowCampaignModal(false);
      resetForm();
      fetchCampaigns();
    } catch (err: any) {
      console.error('Error creating campaign:', err);
      showError(err.message || 'Failed to create campaign');
    }
  };

  const createRecipients = async (campaignId: string, audience: string) => {
    try {
      let targetCustomers = customers;

      if (audience !== 'all') {
        targetCustomers = customers.filter(c => c.status.toLowerCase() === audience);
      }

      const { data: unsubscribes } = await supabase
        .from('email_unsubscribes')
        .select('email');

      const unsubscribedEmails = new Set(unsubscribes?.map(u => u.email) || []);

      const recipients = targetCustomers
        .filter(c => c.email && !unsubscribedEmails.has(c.email))
        .map(c => ({
          campaign_id: campaignId,
          customer_id: c.id,
          email: c.email,
        }));

      const { error } = await supabase
        .from('email_campaign_recipients')
        .insert(recipients);

      if (error) throw error;
    } catch (err) {
      console.error('Error creating recipients:', err);
    }
  };

  const handleSendCampaign = async (campaign: EmailCampaign) => {
    if (!confirm(`Send campaign "${campaign.name}" to ${campaign.total_recipients} recipients?`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('email_campaigns')
        .update({ status: 'sending' })
        .eq('id', campaign.id);

      if (error) throw error;

      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-email-campaign`;
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ campaignId: campaign.id }),
      });

      if (!response.ok) {
        throw new Error('Failed to send campaign');
      }

      success('Campaign is being sent');
      fetchCampaigns();
    } catch (err: any) {
      console.error('Error sending campaign:', err);
      showError(err.message || 'Failed to send campaign');
    }
  };

  const handleDuplicateCampaign = async (campaign: EmailCampaign) => {
    try {
      const { name, subject, from_name, from_email, reply_to, body_html, body_text, target_audience } = campaign;
      const { data: user } = await supabase.auth.getUser();

      const { error } = await supabase
        .from('email_campaigns')
        .insert([{
          name: `${name} (Copy)`,
          subject,
          from_name,
          from_email,
          reply_to,
          body_html,
          body_text,
          target_audience,
          total_recipients: getRecipientCount(target_audience),
          created_by: user.user?.id,
        }]);

      if (error) throw error;
      success('Campaign duplicated successfully');
      fetchCampaigns();
    } catch (err) {
      console.error('Error duplicating campaign:', err);
      showError('Failed to duplicate campaign');
    }
  };

  const handleDeleteCampaign = async (id: string) => {
    if (!confirm('Are you sure you want to delete this campaign?')) return;

    try {
      const { error } = await supabase
        .from('email_campaigns')
        .delete()
        .eq('id', id);

      if (error) throw error;
      success('Campaign deleted successfully');
      fetchCampaigns();
    } catch (err) {
      console.error('Error deleting campaign:', err);
      showError('Failed to delete campaign');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      subject: '',
      from_name: 'BYLROS',
      from_email: 'admin@bylros.ae',
      reply_to: '',
      body_html: '',
      body_text: '',
      target_audience: 'all',
      scheduled_at: '',
    });
    setSelectedCampaign(null);
  };

  const openEditModal = (campaign: EmailCampaign) => {
    setSelectedCampaign(campaign);
    setFormData({
      name: campaign.name,
      subject: campaign.subject,
      from_name: campaign.from_name,
      from_email: campaign.from_email,
      reply_to: campaign.reply_to || '',
      body_html: campaign.body_html,
      body_text: campaign.body_text || '',
      target_audience: campaign.target_audience,
      scheduled_at: campaign.scheduled_at ? new Date(campaign.scheduled_at).toISOString().slice(0, 16) : '',
    });
    setShowCampaignModal(true);
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      draft: 'bg-gray-100 text-gray-700',
      scheduled: 'bg-blue-100 text-blue-700',
      sending: 'bg-yellow-100 text-yellow-700',
      sent: 'bg-green-100 text-green-700',
      paused: 'bg-orange-100 text-orange-700',
      cancelled: 'bg-red-100 text-red-700',
    };
    return colors[status] || colors.draft;
  };

  const filteredCampaigns = campaigns.filter(c => {
    if (activeTab === 'all') return true;
    if (activeTab === 'draft') return c.status === 'draft';
    if (activeTab === 'scheduled') return c.status === 'scheduled';
    if (activeTab === 'sent') return c.status === 'sent';
    return true;
  });

  const totalStats = {
    total: campaigns.length,
    sent: campaigns.reduce((sum, c) => sum + c.sent_count, 0),
    delivered: campaigns.reduce((sum, c) => sum + c.delivered_count, 0),
    opened: campaigns.reduce((sum, c) => sum + c.opened_count, 0),
    clicked: campaigns.reduce((sum, c) => sum + c.clicked_count, 0),
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
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Email Marketing</h1>
          <p className="text-gray-600">Create and manage email campaigns</p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setShowCampaignModal(true);
          }}
          className="flex items-center gap-2 bg-[#bb2738] hover:bg-[#a01f2f] text-white px-4 py-2.5 rounded-lg transition-colors"
        >
          <Plus className="w-5 h-5" />
          New Campaign
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Total Campaigns</span>
            <Mail className="w-5 h-5 text-[#bb2738]" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{totalStats.total}</p>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Emails Sent</span>
            <Send className="w-5 h-5 text-blue-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{totalStats.sent}</p>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Open Rate</span>
            <Eye className="w-5 h-5 text-green-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {totalStats.delivered > 0
              ? `${((totalStats.opened / totalStats.delivered) * 100).toFixed(1)}%`
              : '0%'}
          </p>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Click Rate</span>
            <MousePointerClick className="w-5 h-5 text-purple-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {totalStats.delivered > 0
              ? `${((totalStats.clicked / totalStats.delivered) * 100).toFixed(1)}%`
              : '0%'}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200">
        <div className="border-b border-gray-200">
          <div className="flex gap-4 px-6 pt-4">
            {[
              { key: 'all', label: 'All Campaigns' },
              { key: 'draft', label: 'Drafts' },
              { key: 'scheduled', label: 'Scheduled' },
              { key: 'sent', label: 'Sent' },
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`pb-3 px-2 border-b-2 transition-colors ${
                  activeTab === tab.key
                    ? 'border-[#bb2738] text-[#bb2738] font-medium'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="p-6">
          {filteredCampaigns.length === 0 ? (
            <div className="text-center py-12">
              <Mail className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-800 mb-2">No Campaigns</h3>
              <p className="text-gray-600 mb-4">Create your first email campaign to get started</p>
              <button
                onClick={() => {
                  resetForm();
                  setShowCampaignModal(true);
                }}
                className="inline-flex items-center gap-2 bg-[#bb2738] hover:bg-[#a01f2f] text-white px-4 py-2 rounded-lg transition-colors"
              >
                <Plus className="w-5 h-5" />
                Create Campaign
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredCampaigns.map(campaign => (
                <div key={campaign.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">{campaign.name}</h3>
                        <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(campaign.status)}`}>
                          {campaign.status}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-3">{campaign.subject}</p>

                      <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          <span>{campaign.total_recipients} recipients</span>
                        </div>
                        {campaign.sent_count > 0 && (
                          <>
                            <div className="flex items-center gap-1">
                              <Send className="w-4 h-4" />
                              <span>{campaign.sent_count} sent</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Eye className="w-4 h-4" />
                              <span>{campaign.opened_count} opened</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <MousePointerClick className="w-4 h-4" />
                              <span>{campaign.clicked_count} clicked</span>
                            </div>
                          </>
                        )}
                        {campaign.scheduled_at && (
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            <span>{new Date(campaign.scheduled_at).toLocaleString()}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 ml-4">
                      {campaign.status === 'draft' && (
                        <>
                          <button
                            onClick={() => openEditModal(campaign)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <Filter className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => handleSendCampaign(campaign)}
                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                            title="Send Now"
                          >
                            <Send className="w-5 h-5" />
                          </button>
                        </>
                      )}
                      {campaign.status === 'sent' && (
                        <button
                          onClick={() => {
                            setSelectedCampaign(campaign);
                            setShowStatsModal(true);
                          }}
                          className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                          title="View Stats"
                        >
                          <BarChart3 className="w-5 h-5" />
                        </button>
                      )}
                      <button
                        onClick={() => {
                          setSelectedCampaign(campaign);
                          setShowPreviewModal(true);
                        }}
                        className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                        title="Preview"
                      >
                        <Eye className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleDuplicateCampaign(campaign)}
                        className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                        title="Duplicate"
                      >
                        <Copy className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleDeleteCampaign(campaign.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {showCampaignModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">
                {selectedCampaign ? 'Edit Campaign' : 'New Email Campaign'}
              </h2>
              <button onClick={() => setShowCampaignModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCampaign} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Campaign Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-[#bb2738]"
                  placeholder="Summer Sale 2024"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">From Name</label>
                  <input
                    type="text"
                    value={formData.from_name}
                    onChange={(e) => setFormData({ ...formData, from_name: e.target.value })}
                    required
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-[#bb2738]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">From Email</label>
                  <input
                    type="email"
                    value={formData.from_email}
                    onChange={(e) => setFormData({ ...formData, from_email: e.target.value })}
                    required
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-[#bb2738]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Reply-To Email</label>
                  <input
                    type="email"
                    value={formData.reply_to}
                    onChange={(e) => setFormData({ ...formData, reply_to: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-[#bb2738]"
                    placeholder="Optional"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Target Audience</label>
                  <select
                    value={formData.target_audience}
                    onChange={(e) => setFormData({ ...formData, target_audience: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-[#bb2738]"
                  >
                    <option value="all">All Customers ({getRecipientCount('all')})</option>
                    <option value="lead">Leads ({getRecipientCount('lead')})</option>
                    <option value="quoted">Quoted ({getRecipientCount('quoted')})</option>
                    <option value="ordered">Ordered ({getRecipientCount('ordered')})</option>
                    <option value="delivered">Delivered ({getRecipientCount('delivered')})</option>
                    <option value="installed">Installed ({getRecipientCount('installed')})</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Subject Line</label>
                <input
                  type="text"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  required
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-[#bb2738]"
                  placeholder="Check out our latest offers!"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email Body (HTML)</label>
                <textarea
                  value={formData.body_html}
                  onChange={(e) => setFormData({ ...formData, body_html: e.target.value })}
                  required
                  rows={12}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-[#bb2738] font-mono text-sm"
                  placeholder="<html>...</html>"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Schedule Send (Optional)</label>
                <input
                  type="datetime-local"
                  value={formData.scheduled_at}
                  onChange={(e) => setFormData({ ...formData, scheduled_at: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-[#bb2738]"
                />
                <p className="text-xs text-gray-500 mt-1">Leave empty to save as draft</p>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCampaignModal(false)}
                  className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2.5 bg-[#bb2738] hover:bg-[#a01f2f] text-white rounded-lg transition-colors"
                >
                  {selectedCampaign ? 'Update Campaign' : 'Create Campaign'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showPreviewModal && selectedCampaign && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Preview: {selectedCampaign.name}</h2>
              <button onClick={() => setShowPreviewModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6">
              <div className="mb-4 p-4 bg-gray-50 rounded-lg space-y-2">
                <p className="text-sm"><strong>From:</strong> {selectedCampaign.from_name} &lt;{selectedCampaign.from_email}&gt;</p>
                <p className="text-sm"><strong>Subject:</strong> {selectedCampaign.subject}</p>
                <p className="text-sm"><strong>Recipients:</strong> {selectedCampaign.total_recipients}</p>
              </div>

              <div className="border border-gray-200 rounded-lg p-4">
                <div dangerouslySetInnerHTML={{ __html: selectedCampaign.body_html }} />
              </div>
            </div>
          </div>
        </div>
      )}

      {showStatsModal && selectedCampaign && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full">
            <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Campaign Statistics</h2>
              <button onClick={() => setShowStatsModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6">
              <h3 className="font-semibold text-lg mb-4">{selectedCampaign.name}</h3>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-blue-50 rounded-lg p-4">
                  <p className="text-sm text-blue-600 mb-1">Total Recipients</p>
                  <p className="text-2xl font-bold text-blue-900">{selectedCampaign.total_recipients}</p>
                </div>

                <div className="bg-green-50 rounded-lg p-4">
                  <p className="text-sm text-green-600 mb-1">Sent</p>
                  <p className="text-2xl font-bold text-green-900">{selectedCampaign.sent_count}</p>
                </div>

                <div className="bg-purple-50 rounded-lg p-4">
                  <p className="text-sm text-purple-600 mb-1">Delivered</p>
                  <p className="text-2xl font-bold text-purple-900">{selectedCampaign.delivered_count}</p>
                  <p className="text-xs text-purple-600 mt-1">
                    {selectedCampaign.sent_count > 0
                      ? `${((selectedCampaign.delivered_count / selectedCampaign.sent_count) * 100).toFixed(1)}% delivery rate`
                      : 'N/A'}
                  </p>
                </div>

                <div className="bg-amber-50 rounded-lg p-4">
                  <p className="text-sm text-amber-600 mb-1">Opened</p>
                  <p className="text-2xl font-bold text-amber-900">{selectedCampaign.opened_count}</p>
                  <p className="text-xs text-amber-600 mt-1">
                    {selectedCampaign.delivered_count > 0
                      ? `${((selectedCampaign.opened_count / selectedCampaign.delivered_count) * 100).toFixed(1)}% open rate`
                      : 'N/A'}
                  </p>
                </div>

                <div className="bg-pink-50 rounded-lg p-4">
                  <p className="text-sm text-pink-600 mb-1">Clicked</p>
                  <p className="text-2xl font-bold text-pink-900">{selectedCampaign.clicked_count}</p>
                  <p className="text-xs text-pink-600 mt-1">
                    {selectedCampaign.delivered_count > 0
                      ? `${((selectedCampaign.clicked_count / selectedCampaign.delivered_count) * 100).toFixed(1)}% click rate`
                      : 'N/A'}
                  </p>
                </div>

                <div className="bg-red-50 rounded-lg p-4">
                  <p className="text-sm text-red-600 mb-1">Bounced</p>
                  <p className="text-2xl font-bold text-red-900">{selectedCampaign.bounced_count}</p>
                  <p className="text-xs text-red-600 mt-1">
                    {selectedCampaign.sent_count > 0
                      ? `${((selectedCampaign.bounced_count / selectedCampaign.sent_count) * 100).toFixed(1)}% bounce rate`
                      : 'N/A'}
                  </p>
                </div>
              </div>

              {selectedCampaign.sent_at && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <p className="text-sm text-gray-600">
                    Sent on {new Date(selectedCampaign.sent_at).toLocaleString()}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
