import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useToast } from '../contexts/ToastContext';
import {
  Users, Plus, Edit, Trash2, Send, TrendingUp, List, MessageSquare,
  Eye, X, Upload, Download, Filter, Search, Calendar, CheckCircle,
  Clock, XCircle, BarChart3, Tag, Mail, Phone, FileText, Zap
} from 'lucide-react';

interface ContactList {
  id: string;
  name: string;
  description: string;
  created_at: string;
  contact_count?: number;
}

interface Contact {
  id: string;
  list_id: string;
  name: string;
  phone_number: string;
  email: string;
  tags: string[];
  notes: string;
  status: 'active' | 'inactive' | 'unsubscribed';
  created_at: string;
}

interface Campaign {
  id: string;
  name: string;
  description: string;
  message_template: string;
  target_list_id: string;
  status: 'draft' | 'active' | 'completed' | 'paused';
  scheduled_date: string | null;
  created_by: string;
  created_at: string;
  list_name?: string;
  message_stats?: {
    total: number;
    sent: number;
    failed: number;
    pending: number;
  };
}

interface CampaignMessage {
  id: string;
  campaign_id: string;
  contact_id: string;
  message_content: string;
  status: 'pending' | 'sent' | 'failed' | 'skipped';
  sent_at: string | null;
  notes: string;
  contact_name?: string;
  phone_number?: string;
}

export function WhatsAppMarketing() {
  const { success, error: showError } = useToast();
  const [activeTab, setActiveTab] = useState<'lists' | 'campaigns' | 'analytics'>('lists');
  const [loading, setLoading] = useState(true);

  const [contactLists, setContactLists] = useState<ContactList[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [campaignMessages, setCampaignMessages] = useState<CampaignMessage[]>([]);

  const [selectedList, setSelectedList] = useState<string | null>(null);
  const [selectedCampaign, setSelectedCampaign] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const [showListModal, setShowListModal] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);
  const [showCampaignModal, setShowCampaignModal] = useState(false);
  const [showCampaignDetails, setShowCampaignDetails] = useState(false);

  const [listForm, setListForm] = useState({ name: '', description: '' });
  const [contactForm, setContactForm] = useState({
    list_id: '',
    name: '',
    phone_number: '',
    email: '',
    tags: [] as string[],
    notes: '',
    status: 'active' as const
  });
  const [campaignForm, setCampaignForm] = useState({
    name: '',
    description: '',
    message_template: '',
    target_list_id: '',
    scheduled_date: '',
    status: 'draft' as const
  });

  const [editingList, setEditingList] = useState<ContactList | null>(null);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null);

  const [newTag, setNewTag] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (selectedList) {
      loadContacts(selectedList);
    }
  }, [selectedList]);

  useEffect(() => {
    if (selectedCampaign && showCampaignDetails) {
      loadCampaignMessages(selectedCampaign);
    }
  }, [selectedCampaign, showCampaignDetails]);

  const loadData = async () => {
    setLoading(true);
    try {
      await Promise.all([loadContactLists(), loadCampaigns()]);
    } catch (err) {
      console.error('Error loading data:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadContactLists = async () => {
    try {
      const { data: lists, error } = await supabase
        .from('whatsapp_contact_lists')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const listsWithCounts = await Promise.all(
        (lists || []).map(async (list) => {
          const { count } = await supabase
            .from('whatsapp_marketing_contacts')
            .select('*', { count: 'exact', head: true })
            .eq('list_id', list.id);
          return { ...list, contact_count: count || 0 };
        })
      );

      setContactLists(listsWithCounts);
    } catch (err: any) {
      console.error('Error loading contact lists:', err);
      showError('Failed to load contact lists');
    }
  };

  const loadContacts = async (listId: string) => {
    try {
      const { data, error } = await supabase
        .from('whatsapp_marketing_contacts')
        .select('*')
        .eq('list_id', listId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setContacts(data || []);
    } catch (err: any) {
      console.error('Error loading contacts:', err);
      showError('Failed to load contacts');
    }
  };

  const loadCampaigns = async () => {
    try {
      const { data, error } = await supabase
        .from('whatsapp_marketing_campaigns')
        .select(`
          *,
          whatsapp_contact_lists(name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const campaignsWithStats = await Promise.all(
        (data || []).map(async (campaign: any) => {
          const { data: messages } = await supabase
            .from('whatsapp_campaign_messages')
            .select('status')
            .eq('campaign_id', campaign.id);

          const stats = {
            total: messages?.length || 0,
            sent: messages?.filter((m: any) => m.status === 'sent').length || 0,
            failed: messages?.filter((m: any) => m.status === 'failed').length || 0,
            pending: messages?.filter((m: any) => m.status === 'pending').length || 0
          };

          return {
            ...campaign,
            list_name: campaign.whatsapp_contact_lists?.name || 'N/A',
            message_stats: stats
          };
        })
      );

      setCampaigns(campaignsWithStats);
    } catch (err: any) {
      console.error('Error loading campaigns:', err);
      showError('Failed to load campaigns');
    }
  };

  const loadCampaignMessages = async (campaignId: string) => {
    try {
      const { data, error } = await supabase
        .from('whatsapp_campaign_messages')
        .select(`
          *,
          whatsapp_marketing_contacts(name, phone_number)
        `)
        .eq('campaign_id', campaignId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedMessages = (data || []).map((msg: any) => ({
        ...msg,
        contact_name: msg.whatsapp_marketing_contacts?.name || 'Unknown',
        phone_number: msg.whatsapp_marketing_contacts?.phone_number || 'N/A'
      }));

      setCampaignMessages(formattedMessages);
    } catch (err: any) {
      console.error('Error loading campaign messages:', err);
      showError('Failed to load campaign messages');
    }
  };

  const saveList = async () => {
    try {
      if (editingList) {
        const { error } = await supabase
          .from('whatsapp_contact_lists')
          .update({ ...listForm, updated_at: new Date().toISOString() })
          .eq('id', editingList.id);

        if (error) throw error;
        success('Contact list updated successfully');
      } else {
        const { error } = await supabase
          .from('whatsapp_contact_lists')
          .insert([listForm]);

        if (error) throw error;
        success('Contact list created successfully');
      }

      setShowListModal(false);
      setEditingList(null);
      setListForm({ name: '', description: '' });
      loadContactLists();
    } catch (err: any) {
      console.error('Error saving list:', err);
      showError(err.message || 'Failed to save contact list');
    }
  };

  const deleteList = async (id: string) => {
    if (!confirm('Are you sure? This will delete all contacts in this list.')) return;

    try {
      const { error } = await supabase
        .from('whatsapp_contact_lists')
        .delete()
        .eq('id', id);

      if (error) throw error;
      success('Contact list deleted successfully');
      if (selectedList === id) {
        setSelectedList(null);
        setContacts([]);
      }
      loadContactLists();
    } catch (err: any) {
      console.error('Error deleting list:', err);
      showError('Failed to delete contact list');
    }
  };

  const saveContact = async () => {
    try {
      if (!contactForm.list_id) {
        showError('Please select a contact list');
        return;
      }

      if (editingContact) {
        const { error } = await supabase
          .from('whatsapp_marketing_contacts')
          .update({ ...contactForm, updated_at: new Date().toISOString() })
          .eq('id', editingContact.id);

        if (error) throw error;
        success('Contact updated successfully');
      } else {
        const { error } = await supabase
          .from('whatsapp_marketing_contacts')
          .insert([contactForm]);

        if (error) throw error;
        success('Contact created successfully');
      }

      setShowContactModal(false);
      setEditingContact(null);
      setContactForm({
        list_id: '',
        name: '',
        phone_number: '',
        email: '',
        tags: [],
        notes: '',
        status: 'active'
      });
      if (selectedList) loadContacts(selectedList);
      loadContactLists();
    } catch (err: any) {
      console.error('Error saving contact:', err);
      showError(err.message || 'Failed to save contact');
    }
  };

  const deleteContact = async (id: string) => {
    if (!confirm('Are you sure you want to delete this contact?')) return;

    try {
      const { error } = await supabase
        .from('whatsapp_marketing_contacts')
        .delete()
        .eq('id', id);

      if (error) throw error;
      success('Contact deleted successfully');
      if (selectedList) loadContacts(selectedList);
      loadContactLists();
    } catch (err: any) {
      console.error('Error deleting contact:', err);
      showError('Failed to delete contact');
    }
  };

  const saveCampaign = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      if (editingCampaign) {
        const { error } = await supabase
          .from('whatsapp_marketing_campaigns')
          .update({
            name: campaignForm.name,
            description: campaignForm.description,
            message_template: campaignForm.message_template,
            target_list_id: campaignForm.target_list_id,
            scheduled_date: campaignForm.scheduled_date || null,
            status: campaignForm.status,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingCampaign.id);

        if (error) throw error;
        success('Campaign updated successfully');
      } else {
        const { data: campaign, error: campaignError } = await supabase
          .from('whatsapp_marketing_campaigns')
          .insert([{
            ...campaignForm,
            scheduled_date: campaignForm.scheduled_date || null,
            created_by: user.id
          }])
          .select()
          .single();

        if (campaignError) throw campaignError;

        if (campaignForm.target_list_id) {
          const { data: contactsData } = await supabase
            .from('whatsapp_marketing_contacts')
            .select('*')
            .eq('list_id', campaignForm.target_list_id)
            .eq('status', 'active');

          if (contactsData && contactsData.length > 0) {
            const messages = contactsData.map(contact => {
              let personalizedMessage = campaignForm.message_template;
              personalizedMessage = personalizedMessage.replace(/{name}/g, contact.name);
              return {
                campaign_id: campaign.id,
                contact_id: contact.id,
                message_content: personalizedMessage,
                status: 'pending'
              };
            });

            const { error: messagesError } = await supabase
              .from('whatsapp_campaign_messages')
              .insert(messages);

            if (messagesError) throw messagesError;
          }
        }

        success('Campaign created successfully');
      }

      setShowCampaignModal(false);
      setEditingCampaign(null);
      setCampaignForm({
        name: '',
        description: '',
        message_template: '',
        target_list_id: '',
        scheduled_date: '',
        status: 'draft'
      });
      loadCampaigns();
    } catch (err: any) {
      console.error('Error saving campaign:', err);
      showError(err.message || 'Failed to save campaign');
    }
  };

  const deleteCampaign = async (id: string) => {
    if (!confirm('Are you sure you want to delete this campaign?')) return;

    try {
      const { error } = await supabase
        .from('whatsapp_marketing_campaigns')
        .delete()
        .eq('id', id);

      if (error) throw error;
      success('Campaign deleted successfully');
      loadCampaigns();
    } catch (err: any) {
      console.error('Error deleting campaign:', err);
      showError('Failed to delete campaign');
    }
  };

  const updateCampaignStatus = async (campaignId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('whatsapp_marketing_campaigns')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', campaignId);

      if (error) throw error;
      success(`Campaign ${newStatus === 'active' ? 'activated' : newStatus === 'paused' ? 'paused' : 'updated'}`);
      loadCampaigns();
    } catch (err: any) {
      console.error('Error updating campaign status:', err);
      showError('Failed to update campaign status');
    }
  };

  const addTag = () => {
    if (newTag.trim() && !contactForm.tags.includes(newTag.trim())) {
      setContactForm({
        ...contactForm,
        tags: [...contactForm.tags, newTag.trim()]
      });
      setNewTag('');
    }
  };

  const removeTag = (tag: string) => {
    setContactForm({
      ...contactForm,
      tags: contactForm.tags.filter(t => t !== tag)
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sent':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-600" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-600" />;
      default:
        return <Clock className="w-4 h-4 text-slate-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      draft: 'bg-slate-100 text-slate-700',
      active: 'bg-green-100 text-green-700',
      completed: 'bg-blue-100 text-blue-700',
      paused: 'bg-yellow-100 text-yellow-700',
      sent: 'bg-green-100 text-green-700',
      pending: 'bg-yellow-100 text-yellow-700',
      failed: 'bg-red-100 text-red-700',
      skipped: 'bg-slate-100 text-slate-700'
    };
    return styles[status] || styles.draft;
  };

  const filteredContacts = contacts.filter(contact => {
    const matchesSearch = contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact.phone_number.includes(searchTerm);
    const matchesStatus = statusFilter === 'all' || contact.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

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
        <h1 className="text-3xl font-bold text-slate-800 mb-2">WhatsApp Marketing</h1>
        <p className="text-slate-600">Manage contact lists, create campaigns, and track performance</p>
      </div>

      <div className="flex gap-2 mb-6 overflow-x-auto">
        <button
          onClick={() => setActiveTab('lists')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors whitespace-nowrap ${
            activeTab === 'lists'
              ? 'bg-[#bb2738] text-white'
              : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <List className="w-4 h-4" />
          Contact Lists
        </button>
        <button
          onClick={() => setActiveTab('campaigns')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors whitespace-nowrap ${
            activeTab === 'campaigns'
              ? 'bg-[#bb2738] text-white'
              : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <Send className="w-4 h-4" />
          Campaigns
        </button>
        <button
          onClick={() => setActiveTab('analytics')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors whitespace-nowrap ${
            activeTab === 'analytics'
              ? 'bg-[#bb2738] text-white'
              : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          Analytics
        </button>
      </div>

      {activeTab === 'lists' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-slate-800">Contact Lists</h2>
            <button
              onClick={() => {
                setEditingList(null);
                setListForm({ name: '', description: '' });
                setShowListModal(true);
              }}
              className="flex items-center gap-2 bg-[#bb2738] hover:bg-[#a01f2f] text-white px-4 py-2 rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" />
              New List
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {contactLists.map(list => (
              <div
                key={list.id}
                className="bg-white rounded-xl border border-slate-200 overflow-hidden hover:shadow-lg transition-shadow"
              >
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="font-semibold text-slate-900 mb-1">{list.name}</h3>
                      <p className="text-sm text-slate-600 line-clamp-2">{list.description}</p>
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => {
                          setEditingList(list);
                          setListForm({ name: list.name, description: list.description });
                          setShowListModal(true);
                        }}
                        className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                      >
                        <Edit className="w-4 h-4 text-slate-600" />
                      </button>
                      <button
                        onClick={() => deleteList(list.id)}
                        className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mb-4">
                    <Users className="w-4 h-4 text-slate-500" />
                    <span className="text-sm text-slate-700">{list.contact_count || 0} contacts</span>
                  </div>

                  <button
                    onClick={() => setSelectedList(list.id)}
                    className="w-full px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors"
                  >
                    View Contacts
                  </button>
                </div>
              </div>
            ))}
          </div>

          {contactLists.length === 0 && (
            <div className="text-center py-12 bg-white rounded-xl border border-slate-200">
              <List className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-slate-800 mb-2">No Contact Lists</h3>
              <p className="text-slate-600">Create your first contact list to get started</p>
            </div>
          )}

          {selectedList && (
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-slate-800">
                  Contacts - {contactLists.find(l => l.id === selectedList)?.name}
                </h3>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setEditingContact(null);
                      setContactForm({
                        list_id: selectedList,
                        name: '',
                        phone_number: '',
                        email: '',
                        tags: [],
                        notes: '',
                        status: 'active'
                      });
                      setShowContactModal(true);
                    }}
                    className="flex items-center gap-2 bg-[#bb2738] hover:bg-[#a01f2f] text-white px-4 py-2 rounded-lg transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Add Contact
                  </button>
                  <button
                    onClick={() => setSelectedList(null)}
                    className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>

              <div className="flex gap-4 mb-4">
                <div className="flex-1 relative">
                  <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search contacts..."
                    className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-[#bb2738]"
                  />
                </div>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-4 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-[#bb2738]"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="unsubscribed">Unsubscribed</option>
                </select>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Name</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Phone</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Email</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Tags</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {filteredContacts.map(contact => (
                      <tr key={contact.id} className="hover:bg-slate-50">
                        <td className="px-4 py-3 text-sm text-slate-900">{contact.name}</td>
                        <td className="px-4 py-3 text-sm text-slate-700">{contact.phone_number}</td>
                        <td className="px-4 py-3 text-sm text-slate-700">{contact.email || '-'}</td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-1">
                            {contact.tags.slice(0, 2).map((tag, idx) => (
                              <span key={idx} className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded">
                                {tag}
                              </span>
                            ))}
                            {contact.tags.length > 2 && (
                              <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-xs rounded">
                                +{contact.tags.length - 2}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-block px-2 py-1 text-xs rounded ${getStatusBadge(contact.status)}`}>
                            {contact.status}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-2">
                            <button
                              onClick={() => {
                                setEditingContact(contact);
                                setContactForm({
                                  list_id: contact.list_id,
                                  name: contact.name,
                                  phone_number: contact.phone_number,
                                  email: contact.email,
                                  tags: contact.tags,
                                  notes: contact.notes,
                                  status: contact.status
                                });
                                setShowContactModal(true);
                              }}
                              className="p-1 hover:bg-slate-100 rounded"
                            >
                              <Edit className="w-4 h-4 text-slate-600" />
                            </button>
                            <button
                              onClick={() => deleteContact(contact.id)}
                              className="p-1 hover:bg-red-50 rounded"
                            >
                              <Trash2 className="w-4 h-4 text-red-600" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {filteredContacts.length === 0 && (
                  <div className="text-center py-8">
                    <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-500">No contacts found</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'campaigns' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-slate-800">Campaigns</h2>
            <button
              onClick={() => {
                setEditingCampaign(null);
                setCampaignForm({
                  name: '',
                  description: '',
                  message_template: '',
                  target_list_id: '',
                  scheduled_date: '',
                  status: 'draft'
                });
                setShowCampaignModal(true);
              }}
              className="flex items-center gap-2 bg-[#bb2738] hover:bg-[#a01f2f] text-white px-4 py-2 rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" />
              New Campaign
            </button>
          </div>

          <div className="grid grid-cols-1 gap-6">
            {campaigns.map(campaign => (
              <div
                key={campaign.id}
                className="bg-white rounded-xl border border-slate-200 overflow-hidden hover:shadow-lg transition-shadow"
              >
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-slate-900">{campaign.name}</h3>
                        <span className={`px-3 py-1 text-xs rounded-full ${getStatusBadge(campaign.status)}`}>
                          {campaign.status}
                        </span>
                      </div>
                      <p className="text-sm text-slate-600 mb-3">{campaign.description}</p>
                      <div className="flex items-center gap-4 text-sm text-slate-600">
                        <div className="flex items-center gap-1">
                          <List className="w-4 h-4" />
                          <span>{campaign.list_name}</span>
                        </div>
                        {campaign.scheduled_date && (
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            <span>{new Date(campaign.scheduled_date).toLocaleString()}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => {
                          setSelectedCampaign(campaign.id);
                          setShowCampaignDetails(true);
                        }}
                        className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                      >
                        <Eye className="w-4 h-4 text-slate-600" />
                      </button>
                      <button
                        onClick={() => {
                          setEditingCampaign(campaign);
                          setCampaignForm({
                            name: campaign.name,
                            description: campaign.description,
                            message_template: campaign.message_template,
                            target_list_id: campaign.target_list_id,
                            scheduled_date: campaign.scheduled_date || '',
                            status: campaign.status
                          });
                          setShowCampaignModal(true);
                        }}
                        className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                      >
                        <Edit className="w-4 h-4 text-slate-600" />
                      </button>
                      <button
                        onClick={() => deleteCampaign(campaign.id)}
                        className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </button>
                    </div>
                  </div>

                  {campaign.message_stats && (
                    <div className="grid grid-cols-4 gap-4 mb-4">
                      <div className="bg-slate-50 rounded-lg p-3">
                        <div className="text-xs text-slate-600 mb-1">Total</div>
                        <div className="text-xl font-semibold text-slate-900">{campaign.message_stats.total}</div>
                      </div>
                      <div className="bg-green-50 rounded-lg p-3">
                        <div className="text-xs text-green-600 mb-1">Sent</div>
                        <div className="text-xl font-semibold text-green-700">{campaign.message_stats.sent}</div>
                      </div>
                      <div className="bg-yellow-50 rounded-lg p-3">
                        <div className="text-xs text-yellow-600 mb-1">Pending</div>
                        <div className="text-xl font-semibold text-yellow-700">{campaign.message_stats.pending}</div>
                      </div>
                      <div className="bg-red-50 rounded-lg p-3">
                        <div className="text-xs text-red-600 mb-1">Failed</div>
                        <div className="text-xl font-semibold text-red-700">{campaign.message_stats.failed}</div>
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2">
                    {campaign.status === 'draft' && (
                      <button
                        onClick={() => updateCampaignStatus(campaign.id, 'active')}
                        className="flex-1 px-4 py-2 bg-green-100 hover:bg-green-200 text-green-700 rounded-lg transition-colors"
                      >
                        <Zap className="w-4 h-4 inline mr-2" />
                        Activate
                      </button>
                    )}
                    {campaign.status === 'active' && (
                      <button
                        onClick={() => updateCampaignStatus(campaign.id, 'paused')}
                        className="flex-1 px-4 py-2 bg-yellow-100 hover:bg-yellow-200 text-yellow-700 rounded-lg transition-colors"
                      >
                        Pause
                      </button>
                    )}
                    {campaign.status === 'paused' && (
                      <button
                        onClick={() => updateCampaignStatus(campaign.id, 'active')}
                        className="flex-1 px-4 py-2 bg-green-100 hover:bg-green-200 text-green-700 rounded-lg transition-colors"
                      >
                        Resume
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {campaigns.length === 0 && (
            <div className="text-center py-12 bg-white rounded-xl border border-slate-200">
              <Send className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-slate-800 mb-2">No Campaigns</h3>
              <p className="text-slate-600">Create your first campaign to start sending messages</p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'analytics' && (
        <div className="space-y-6">
          <h2 className="text-xl font-semibold text-slate-800">Campaign Analytics</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-slate-600">Total Campaigns</h3>
                <BarChart3 className="w-5 h-5 text-[#bb2738]" />
              </div>
              <div className="text-3xl font-bold text-slate-900">{campaigns.length}</div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-slate-600">Total Contacts</h3>
                <Users className="w-5 h-5 text-[#bb2738]" />
              </div>
              <div className="text-3xl font-bold text-slate-900">
                {contactLists.reduce((sum, list) => sum + (list.contact_count || 0), 0)}
              </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-slate-600">Active Campaigns</h3>
                <Zap className="w-5 h-5 text-[#bb2738]" />
              </div>
              <div className="text-3xl font-bold text-slate-900">
                {campaigns.filter(c => c.status === 'active').length}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">Campaign Performance</h3>
            <div className="space-y-4">
              {campaigns.map(campaign => {
                const stats = campaign.message_stats;
                const total = stats?.total || 0;
                const sent = stats?.sent || 0;
                const successRate = total > 0 ? ((sent / total) * 100).toFixed(1) : '0';

                return (
                  <div key={campaign.id} className="border border-slate-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-slate-900">{campaign.name}</h4>
                      <span className="text-sm text-slate-600">{successRate}% success rate</span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-2">
                      <div
                        className="bg-green-600 h-2 rounded-full transition-all"
                        style={{ width: `${successRate}%` }}
                      ></div>
                    </div>
                    <div className="flex items-center justify-between mt-2 text-xs text-slate-600">
                      <span>{sent} sent</span>
                      <span>{total} total</span>
                    </div>
                  </div>
                );
              })}

              {campaigns.length === 0 && (
                <div className="text-center py-8">
                  <BarChart3 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-500">No campaign data available</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {showListModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
            <div className="border-b border-slate-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-800">
                {editingList ? 'Edit List' : 'New Contact List'}
              </h2>
              <button onClick={() => setShowListModal(false)} className="p-2 hover:bg-slate-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">List Name</label>
                <input
                  type="text"
                  value={listForm.name}
                  onChange={(e) => setListForm({ ...listForm, name: e.target.value })}
                  placeholder="e.g., VIP Customers"
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-[#bb2738]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Description</label>
                <textarea
                  value={listForm.description}
                  onChange={(e) => setListForm({ ...listForm, description: e.target.value })}
                  placeholder="Brief description of this contact list"
                  rows={3}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-[#bb2738]"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowListModal(false)}
                  className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={saveList}
                  disabled={!listForm.name}
                  className="flex-1 px-4 py-2 bg-[#bb2738] hover:bg-[#a01f2f] text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {editingList ? 'Update' : 'Create'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showContactModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-800">
                {editingContact ? 'Edit Contact' : 'New Contact'}
              </h2>
              <button onClick={() => setShowContactModal(false)} className="p-2 hover:bg-slate-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Name</label>
                  <input
                    type="text"
                    value={contactForm.name}
                    onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                    placeholder="Contact name"
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-[#bb2738]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Phone Number</label>
                  <input
                    type="tel"
                    value={contactForm.phone_number}
                    onChange={(e) => setContactForm({ ...contactForm, phone_number: e.target.value })}
                    placeholder="+1234567890"
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-[#bb2738]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Email (Optional)</label>
                <input
                  type="email"
                  value={contactForm.email}
                  onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                  placeholder="email@example.com"
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-[#bb2738]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Tags</label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                    placeholder="Add tag..."
                    className="flex-1 px-4 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-[#bb2738]"
                  />
                  <button
                    onClick={addTag}
                    className="px-4 py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg transition-colors"
                  >
                    <Tag className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {contactForm.tags.map((tag, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-lg"
                    >
                      {tag}
                      <button onClick={() => removeTag(tag)} className="hover:text-blue-900">
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Status</label>
                <select
                  value={contactForm.status}
                  onChange={(e) => setContactForm({ ...contactForm, status: e.target.value as any })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-[#bb2738]"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="unsubscribed">Unsubscribed</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Notes</label>
                <textarea
                  value={contactForm.notes}
                  onChange={(e) => setContactForm({ ...contactForm, notes: e.target.value })}
                  placeholder="Additional notes..."
                  rows={3}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-[#bb2738]"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowContactModal(false)}
                  className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={saveContact}
                  disabled={!contactForm.name || !contactForm.phone_number}
                  className="flex-1 px-4 py-2 bg-[#bb2738] hover:bg-[#a01f2f] text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {editingContact ? 'Update' : 'Create'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showCampaignModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-800">
                {editingCampaign ? 'Edit Campaign' : 'New Campaign'}
              </h2>
              <button onClick={() => setShowCampaignModal(false)} className="p-2 hover:bg-slate-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Campaign Name</label>
                <input
                  type="text"
                  value={campaignForm.name}
                  onChange={(e) => setCampaignForm({ ...campaignForm, name: e.target.value })}
                  placeholder="e.g., Holiday Sale 2024"
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-[#bb2738]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Description</label>
                <textarea
                  value={campaignForm.description}
                  onChange={(e) => setCampaignForm({ ...campaignForm, description: e.target.value })}
                  placeholder="Brief description of this campaign"
                  rows={2}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-[#bb2738]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Target Contact List</label>
                <select
                  value={campaignForm.target_list_id}
                  onChange={(e) => setCampaignForm({ ...campaignForm, target_list_id: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-[#bb2738]"
                >
                  <option value="">Select a contact list</option>
                  {contactLists.map(list => (
                    <option key={list.id} value={list.id}>
                      {list.name} ({list.contact_count || 0} contacts)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Message Template</label>
                <textarea
                  value={campaignForm.message_template}
                  onChange={(e) => setCampaignForm({ ...campaignForm, message_template: e.target.value })}
                  placeholder="Hello {name}, we have a special offer for you!"
                  rows={6}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-[#bb2738]"
                />
                <p className="text-xs text-slate-500 mt-1">
                  Use {'{name}'} to personalize with contact name
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Schedule Date (Optional)</label>
                  <input
                    type="datetime-local"
                    value={campaignForm.scheduled_date}
                    onChange={(e) => setCampaignForm({ ...campaignForm, scheduled_date: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-[#bb2738]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Status</label>
                  <select
                    value={campaignForm.status}
                    onChange={(e) => setCampaignForm({ ...campaignForm, status: e.target.value as any })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-[#bb2738]"
                  >
                    <option value="draft">Draft</option>
                    <option value="active">Active</option>
                    <option value="paused">Paused</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowCampaignModal(false)}
                  className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={saveCampaign}
                  disabled={!campaignForm.name || !campaignForm.target_list_id || !campaignForm.message_template}
                  className="flex-1 px-4 py-2 bg-[#bb2738] hover:bg-[#a01f2f] text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {editingCampaign ? 'Update' : 'Create'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showCampaignDetails && selectedCampaign && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-800">Campaign Details</h2>
              <button onClick={() => setShowCampaignDetails(false)} className="p-2 hover:bg-slate-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Contact</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Phone</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Sent At</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Notes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {campaignMessages.map(message => (
                      <tr key={message.id} className="hover:bg-slate-50">
                        <td className="px-4 py-3 text-sm text-slate-900">{message.contact_name}</td>
                        <td className="px-4 py-3 text-sm text-slate-700">{message.phone_number}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            {getStatusIcon(message.status)}
                            <span className={`px-2 py-1 text-xs rounded ${getStatusBadge(message.status)}`}>
                              {message.status}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-700">
                          {message.sent_at ? new Date(message.sent_at).toLocaleString() : '-'}
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-600">{message.notes || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {campaignMessages.length === 0 && (
                  <div className="text-center py-8">
                    <MessageSquare className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-500">No messages in this campaign</p>
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
