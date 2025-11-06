import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Plus, Send, Edit2, Trash2, Copy, Play, Pause, CheckCircle, Clock, ExternalLink } from 'lucide-react';

interface ContactList {
  id: string;
  name: string;
  description: string;
}

interface Campaign {
  id: string;
  name: string;
  description: string;
  message_template: string;
  target_list_id: string | null;
  status: 'draft' | 'active' | 'completed' | 'paused';
  scheduled_date: string | null;
  created_at: string;
  contact_list?: ContactList;
}

interface CampaignMessage {
  id: string;
  contact_id: string;
  message_content: string;
  status: 'pending' | 'sent' | 'failed' | 'skipped';
  sent_at: string | null;
  contact?: {
    name: string;
    phone_number: string;
  };
}

export default function WhatsAppMarketingCampaigns() {
  const { user } = useAuth();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [contactLists, setContactLists] = useState<ContactList[]>([]);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [campaignMessages, setCampaignMessages] = useState<CampaignMessage[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [showMessages, setShowMessages] = useState(false);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    message_template: '',
    target_list_id: '',
    status: 'draft' as Campaign['status'],
    scheduled_date: '',
  });

  useEffect(() => {
    loadCampaigns();
    loadContactLists();
  }, []);

  const loadCampaigns = async () => {
    try {
      const { data, error } = await supabase
        .from('whatsapp_marketing_campaigns')
        .select(`
          *,
          contact_list:whatsapp_contact_lists(id, name, description)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCampaigns(data || []);
    } catch (error) {
      console.error('Error loading campaigns:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadContactLists = async () => {
    try {
      const { data, error } = await supabase
        .from('whatsapp_contact_lists')
        .select('*')
        .order('name');

      if (error) throw error;
      setContactLists(data || []);
    } catch (error) {
      console.error('Error loading contact lists:', error);
    }
  };

  const loadCampaignMessages = async (campaignId: string) => {
    try {
      const { data, error } = await supabase
        .from('whatsapp_campaign_messages')
        .select(`
          *,
          contact:whatsapp_marketing_contacts(name, phone_number)
        `)
        .eq('campaign_id', campaignId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCampaignMessages(data || []);
    } catch (error) {
      console.error('Error loading campaign messages:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      const campaignData = {
        ...formData,
        target_list_id: formData.target_list_id || null,
        scheduled_date: formData.scheduled_date || null,
        created_by: user.id,
      };

      if (selectedCampaign) {
        const { error } = await supabase
          .from('whatsapp_marketing_campaigns')
          .update(campaignData)
          .eq('id', selectedCampaign.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('whatsapp_marketing_campaigns')
          .insert([campaignData]);

        if (error) throw error;
      }

      setShowForm(false);
      setSelectedCampaign(null);
      setFormData({
        name: '',
        description: '',
        message_template: '',
        target_list_id: '',
        status: 'draft',
        scheduled_date: '',
      });
      loadCampaigns();
    } catch (error) {
      console.error('Error saving campaign:', error);
      alert('Failed to save campaign');
    }
  };

  const handleEdit = (campaign: Campaign) => {
    setSelectedCampaign(campaign);
    setFormData({
      name: campaign.name,
      description: campaign.description,
      message_template: campaign.message_template,
      target_list_id: campaign.target_list_id || '',
      status: campaign.status,
      scheduled_date: campaign.scheduled_date || '',
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this campaign?')) return;

    try {
      const { error } = await supabase
        .from('whatsapp_marketing_campaigns')
        .delete()
        .eq('id', id);

      if (error) throw error;
      loadCampaigns();
    } catch (error) {
      console.error('Error deleting campaign:', error);
      alert('Failed to delete campaign');
    }
  };

  const handleGenerateMessages = async (campaign: Campaign) => {
    if (!campaign.target_list_id) {
      alert('Please select a target contact list first');
      return;
    }

    try {
      const { data: contacts, error: contactsError } = await supabase
        .from('whatsapp_marketing_contacts')
        .select('*')
        .eq('list_id', campaign.target_list_id)
        .eq('status', 'active');

      if (contactsError) throw contactsError;

      if (!contacts || contacts.length === 0) {
        alert('No active contacts found in the selected list');
        return;
      }

      const messages = contacts.map(contact => {
        let personalizedMessage = campaign.message_template;
        personalizedMessage = personalizedMessage.replace(/\{name\}/g, contact.name);
        personalizedMessage = personalizedMessage.replace(/\{phone\}/g, contact.phone_number);
        personalizedMessage = personalizedMessage.replace(/\{email\}/g, contact.email || '');

        return {
          campaign_id: campaign.id,
          contact_id: contact.id,
          message_content: personalizedMessage,
          status: 'pending' as const,
        };
      });

      const { error: insertError } = await supabase
        .from('whatsapp_campaign_messages')
        .insert(messages);

      if (insertError) throw insertError;

      alert(`Generated ${messages.length} personalized messages!`);
      loadCampaignMessages(campaign.id);
    } catch (error) {
      console.error('Error generating messages:', error);
      alert('Failed to generate messages');
    }
  };

  const handleViewMessages = (campaign: Campaign) => {
    setSelectedCampaign(campaign);
    loadCampaignMessages(campaign.id);
    setShowMessages(true);
  };

  const handleMarkAsSent = async (messageId: string) => {
    try {
      const { error } = await supabase
        .from('whatsapp_campaign_messages')
        .update({
          status: 'sent',
          sent_at: new Date().toISOString(),
        })
        .eq('id', messageId);

      if (error) throw error;

      if (selectedCampaign) {
        loadCampaignMessages(selectedCampaign.id);
      }
    } catch (error) {
      console.error('Error marking message as sent:', error);
      alert('Failed to update message status');
    }
  };

  const openWhatsAppWeb = (phoneNumber: string, message: string) => {
    const cleanPhone = phoneNumber.replace(/[^0-9]/g, '');
    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/${cleanPhone}?text=${encodedMessage}`, '_blank');
  };

  const getStatusBadge = (status: Campaign['status']) => {
    const styles = {
      draft: 'bg-gray-100 text-gray-800',
      active: 'bg-blue-100 text-blue-800',
      completed: 'bg-green-100 text-green-800',
      paused: 'bg-yellow-100 text-yellow-800',
    };

    const icons = {
      draft: Clock,
      active: Play,
      completed: CheckCircle,
      paused: Pause,
    };

    const Icon = icons[status];

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[status]}`}>
        <Icon className="w-3 h-3 mr-1" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const getMessageStatusBadge = (status: CampaignMessage['status']) => {
    const styles = {
      pending: 'bg-yellow-100 text-yellow-800',
      sent: 'bg-green-100 text-green-800',
      failed: 'bg-red-100 text-red-800',
      skipped: 'bg-gray-100 text-gray-800',
    };

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[status]}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (showMessages && selectedCampaign) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <button
              onClick={() => {
                setShowMessages(false);
                setSelectedCampaign(null);
              }}
              className="text-sm text-gray-600 hover:text-gray-900 mb-2"
            >
              ← Back to Campaigns
            </button>
            <h2 className="text-2xl font-bold text-gray-900">
              Campaign Messages: {selectedCampaign.name}
            </h2>
          </div>
        </div>

        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Phone
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Message
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {campaignMessages.map((message) => (
                  <tr key={message.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {message.contact?.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {message.contact?.phone_number}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 max-w-md truncate">
                      {message.message_content}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getMessageStatusBadge(message.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                      {message.status === 'pending' && (
                        <>
                          <button
                            onClick={() => openWhatsAppWeb(message.contact?.phone_number || '', message.message_content)}
                            className="text-green-600 hover:text-green-900"
                            title="Send via WhatsApp Web"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleMarkAsSent(message.id)}
                            className="text-blue-600 hover:text-blue-900"
                            title="Mark as Sent"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(message.message_content);
                          alert('Message copied to clipboard!');
                        }}
                        className="text-gray-600 hover:text-gray-900"
                        title="Copy Message"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  if (showForm) {
    return (
      <div className="space-y-6">
        <div>
          <button
            onClick={() => {
              setShowForm(false);
              setSelectedCampaign(null);
            }}
            className="text-sm text-gray-600 hover:text-gray-900 mb-2"
          >
            ← Back to Campaigns
          </button>
          <h2 className="text-2xl font-bold text-gray-900">
            {selectedCampaign ? 'Edit Campaign' : 'Create New Campaign'}
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="bg-white shadow-md rounded-lg p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Campaign Name
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Target Contact List
            </label>
            <select
              value={formData.target_list_id}
              onChange={(e) => setFormData({ ...formData, target_list_id: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select a contact list</option>
              {contactLists.map((list) => (
                <option key={list.id} value={list.id}>
                  {list.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Message Template
            </label>
            <textarea
              required
              value={formData.message_template}
              onChange={(e) => setFormData({ ...formData, message_template: e.target.value })}
              rows={6}
              placeholder="Use {name}, {phone}, {email} as placeholders"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              Use placeholders: {'{name}'}, {'{phone}'}, {'{email}'}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as Campaign['status'] })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="draft">Draft</option>
                <option value="active">Active</option>
                <option value="paused">Paused</option>
                <option value="completed">Completed</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Scheduled Date (Optional)
              </label>
              <input
                type="datetime-local"
                value={formData.scheduled_date}
                onChange={(e) => setFormData({ ...formData, scheduled_date: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="flex space-x-3 pt-4">
            <button
              type="submit"
              className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
            >
              {selectedCampaign ? 'Update Campaign' : 'Create Campaign'}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowForm(false);
                setSelectedCampaign(null);
              }}
              className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">WhatsApp Marketing Campaigns</h2>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>New Campaign</span>
        </button>
      </div>

      <div className="grid gap-6">
        {campaigns.map((campaign) => (
          <div key={campaign.id} className="bg-white shadow-md rounded-lg p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  <h3 className="text-xl font-semibold text-gray-900">{campaign.name}</h3>
                  {getStatusBadge(campaign.status)}
                </div>
                {campaign.description && (
                  <p className="text-gray-600 mb-2">{campaign.description}</p>
                )}
                {campaign.contact_list && (
                  <p className="text-sm text-gray-500">
                    Target List: {campaign.contact_list.name}
                  </p>
                )}
                {campaign.scheduled_date && (
                  <p className="text-sm text-gray-500">
                    Scheduled: {new Date(campaign.scheduled_date).toLocaleString()}
                  </p>
                )}
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => handleEdit(campaign)}
                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                  title="Edit"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(campaign.id)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="bg-gray-50 rounded-md p-4 mb-4">
              <p className="text-sm font-medium text-gray-700 mb-2">Message Template:</p>
              <p className="text-sm text-gray-600 whitespace-pre-wrap">{campaign.message_template}</p>
            </div>

            <div className="flex space-x-2">
              <button
                onClick={() => handleGenerateMessages(campaign)}
                className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors"
              >
                <Send className="w-4 h-4" />
                <span>Generate Messages</span>
              </button>
              <button
                onClick={() => handleViewMessages(campaign)}
                className="flex items-center space-x-2 border border-gray-300 px-4 py-2 rounded-md hover:bg-gray-50 transition-colors"
              >
                <span>View Messages</span>
              </button>
            </div>
          </div>
        ))}

        {campaigns.length === 0 && (
          <div className="text-center py-12 bg-white rounded-lg shadow-md">
            <p className="text-gray-500">No campaigns yet. Create your first campaign to get started!</p>
          </div>
        )}
      </div>
    </div>
  );
}