import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useToast } from '../contexts/ToastContext';
import { MessageSquare, Search, Eye, X, Download, TrendingUp, ChevronDown, ChevronUp, Copy } from 'lucide-react';

interface BulkMessage {
  id: string;
  campaign_name: string;
  message_text: string;
  total_recipients: number;
  sent_count: number;
  failed_count: number;
  status: string;
  created_at: string;
  updated_at: string;
  scheduled_at?: string;
  recipient_filter?: any;
}

interface MessageQueueItem {
  id: string;
  phone_number: string;
  message_text: string;
  status: string;
  sent_at?: string;
  error_message?: string;
  created_at: string;
  customer_id?: string;
}

interface CampaignStats {
  successRate: number;
  failureRate: number;
  pendingRate: number;
  avgDeliveryTime?: string;
}

export function WhatsAppHistory() {
  const { error: showError, success: showSuccess } = useToast();
  const [messages, setMessages] = useState<BulkMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedCampaign, setSelectedCampaign] = useState<BulkMessage | null>(null);
  const [campaignMessages, setCampaignMessages] = useState<MessageQueueItem[]>([]);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [campaignStats, setCampaignStats] = useState<CampaignStats | null>(null);

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchMessages = async () => {
    try {
      const { data, error } = await supabase
        .from('whatsapp_bulk_messages')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMessages(data || []);
    } catch (err: any) {
      console.error('Error fetching messages:', err);
      showError('Failed to load message history');
    } finally {
      setLoading(false);
    }
  };

  const fetchCampaignDetails = async (campaignId: string) => {
    setLoadingDetails(true);
    try {
      const { data, error } = await supabase
        .from('whatsapp_message_queue')
        .select('*')
        .eq('bulk_message_id', campaignId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCampaignMessages(data || []);

      const sentMessages = data?.filter(m => m.status === 'sent' && m.sent_at) || [];
      const stats: CampaignStats = {
        successRate: data?.length ? (data.filter(m => m.status === 'sent').length / data.length) * 100 : 0,
        failureRate: data?.length ? (data.filter(m => m.status === 'failed').length / data.length) * 100 : 0,
        pendingRate: data?.length ? (data.filter(m => m.status === 'pending').length / data.length) * 100 : 0,
      };

      if (sentMessages.length > 0) {
        const avgTime = sentMessages.reduce((acc, m) => {
          const created = new Date(m.created_at).getTime();
          const sent = new Date(m.sent_at!).getTime();
          return acc + (sent - created);
        }, 0) / sentMessages.length;
        stats.avgDeliveryTime = `${Math.round(avgTime / 1000)}s`;
      }

      setCampaignStats(stats);
    } catch (err: any) {
      console.error('Error fetching campaign details:', err);
      showError('Failed to load campaign details');
    } finally {
      setLoadingDetails(false);
    }
  };

  const viewCampaignDetails = (campaign: BulkMessage) => {
    setSelectedCampaign(campaign);
    fetchCampaignDetails(campaign.id);
  };

  const closeCampaignDetails = () => {
    setSelectedCampaign(null);
    setCampaignMessages([]);
    setCampaignStats(null);
  };

  const exportCampaignData = (campaign: BulkMessage) => {
    const csvContent = [
      ['Campaign Name', campaign.campaign_name],
      ['Message', campaign.message_text],
      ['Total Recipients', campaign.total_recipients.toString()],
      ['Sent', campaign.sent_count.toString()],
      ['Failed', campaign.failed_count.toString()],
      ['Status', campaign.status],
      ['Created', new Date(campaign.created_at).toLocaleString()],
      [''],
      ['Phone Number', 'Status', 'Sent At', 'Error']
    ];

    campaignMessages.forEach(msg => {
      csvContent.push([
        msg.phone_number,
        msg.status,
        msg.sent_at ? new Date(msg.sent_at).toLocaleString() : 'N/A',
        msg.error_message || ''
      ]);
    });

    const csv = csvContent.map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `campaign_${campaign.campaign_name.replace(/\s+/g, '_')}_${Date.now()}.csv`;
    a.click();
    showSuccess('Campaign data exported successfully');
  };

  const copyCampaignMessage = (messageText: string) => {
    navigator.clipboard.writeText(messageText);
    showSuccess('Message copied to clipboard');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'sent':
        return 'bg-green-100 text-green-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'sending':
        return 'bg-blue-100 text-blue-800';
      case 'scheduled':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-slate-100 text-slate-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sent':
        return '✓';
      case 'failed':
        return '✕';
      case 'sending':
        return '⟳';
      case 'scheduled':
        return '⏱';
      default:
        return '○';
    }
  };

  const filteredMessages = messages.filter(msg => {
    const matchesSearch = msg.campaign_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || msg.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const calculateOverallStats = () => {
    const totalCampaigns = messages.length;
    const totalMessages = messages.reduce((sum, m) => sum + m.total_recipients, 0);
    const totalSent = messages.reduce((sum, m) => sum + (m.sent_count || 0), 0);
    const totalFailed = messages.reduce((sum, m) => sum + (m.failed_count || 0), 0);
    const successRate = totalMessages ? ((totalSent / totalMessages) * 100).toFixed(1) : '0';

    return { totalCampaigns, totalMessages, totalSent, totalFailed, successRate };
  };

  const overallStats = calculateOverallStats();

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
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">Campaign History</h2>
            <p className="text-slate-600 text-sm mt-1">View and analyze all WhatsApp campaigns</p>
          </div>
          <button
            onClick={() => setShowStats(!showStats)}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
          >
            <TrendingUp className="w-4 h-4" />
            {showStats ? 'Hide' : 'Show'} Analytics
            {showStats ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>

        {showStats && (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
            <div className="bg-white rounded-lg border border-slate-200 p-4">
              <p className="text-xs text-slate-600 font-medium uppercase tracking-wide">Total Campaigns</p>
              <p className="text-2xl font-bold text-slate-900 mt-2">{overallStats.totalCampaigns}</p>
            </div>
            <div className="bg-white rounded-lg border border-slate-200 p-4">
              <p className="text-xs text-slate-600 font-medium uppercase tracking-wide">Total Messages</p>
              <p className="text-2xl font-bold text-slate-900 mt-2">{overallStats.totalMessages}</p>
            </div>
            <div className="bg-white rounded-lg border border-slate-200 p-4">
              <p className="text-xs text-slate-600 font-medium uppercase tracking-wide">Sent</p>
              <p className="text-2xl font-bold text-green-700 mt-2">{overallStats.totalSent}</p>
            </div>
            <div className="bg-white rounded-lg border border-slate-200 p-4">
              <p className="text-xs text-slate-600 font-medium uppercase tracking-wide">Failed</p>
              <p className="text-2xl font-bold text-red-700 mt-2">{overallStats.totalFailed}</p>
            </div>
            <div className="bg-white rounded-lg border border-slate-200 p-4">
              <p className="text-xs text-slate-600 font-medium uppercase tracking-wide">Success Rate</p>
              <p className="text-2xl font-bold text-blue-700 mt-2">{overallStats.successRate}%</p>
            </div>
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-200 space-y-4">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder="Search campaigns..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-[#bb2738]"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2.5 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-[#bb2738]"
            >
              <option value="all">All Status</option>
              <option value="sent">Sent</option>
              <option value="sending">Sending</option>
              <option value="scheduled">Scheduled</option>
              <option value="failed">Failed</option>
              <option value="pending">Pending</option>
            </select>
          </div>
        </div>

        {filteredMessages.length === 0 ? (
          <div className="p-12 text-center">
            <MessageSquare className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500 mb-2">No campaigns found</p>
            <p className="text-sm text-slate-400">
              {messages.length === 0 ? 'Start sending messages to see history' : 'Try adjusting your filters'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700">Campaign</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700">Recipients</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700">Sent</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700">Failed</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredMessages.map((msg) => {
                  const successRate = msg.total_recipients ? ((msg.sent_count || 0) / msg.total_recipients * 100).toFixed(0) : '0';
                  return (
                    <tr key={msg.id} className="border-b border-slate-200 hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="max-w-xs">
                          <p className="font-medium text-slate-900 truncate">{msg.campaign_name}</p>
                          <p className="text-xs text-slate-500 truncate mt-1">{msg.message_text}</p>
                          {msg.scheduled_at && (
                            <p className="text-xs text-yellow-600 mt-1">
                              Scheduled: {new Date(msg.scheduled_at).toLocaleString()}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-semibold text-slate-900">{msg.total_recipients}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <span className="text-green-700 font-semibold">{msg.sent_count || 0}</span>
                          <span className="text-xs text-slate-500 ml-1">({successRate}%)</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={msg.failed_count > 0 ? 'text-red-700 font-semibold' : 'text-slate-600'}>
                          {msg.failed_count || 0}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold inline-flex items-center gap-1 ${getStatusColor(msg.status)}`}>
                          <span className="text-sm">{getStatusIcon(msg.status)}</span>
                          {msg.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600 whitespace-nowrap">
                        {new Date(msg.created_at).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => viewCampaignDetails(msg)}
                            className="text-blue-600 hover:text-blue-700 p-1.5 rounded hover:bg-blue-50 transition-colors"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => copyCampaignMessage(msg.message_text)}
                            className="text-slate-600 hover:text-slate-700 p-1.5 rounded hover:bg-slate-100 transition-colors"
                            title="Copy Message"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selectedCampaign && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-slate-900">{selectedCampaign.campaign_name}</h3>
                <p className="text-sm text-slate-600 mt-1">Campaign Details & Message Status</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => exportCampaignData(selectedCampaign)}
                  className="flex items-center gap-2 px-4 py-2 bg-[#bb2738] text-white rounded-lg hover:bg-[#a01f2f] transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Export
                </button>
                <button
                  onClick={closeCampaignDetails}
                  className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {campaignStats && (
              <div className="p-6 bg-slate-50 border-b border-slate-200">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-xs text-slate-600 font-medium">Success Rate</p>
                    <p className="text-lg font-bold text-green-700">{campaignStats.successRate.toFixed(1)}%</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-600 font-medium">Failure Rate</p>
                    <p className="text-lg font-bold text-red-700">{campaignStats.failureRate.toFixed(1)}%</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-600 font-medium">Pending</p>
                    <p className="text-lg font-bold text-yellow-700">{campaignStats.pendingRate.toFixed(1)}%</p>
                  </div>
                  {campaignStats.avgDeliveryTime && (
                    <div>
                      <p className="text-xs text-slate-600 font-medium">Avg Delivery Time</p>
                      <p className="text-lg font-bold text-blue-700">{campaignStats.avgDeliveryTime}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="flex-1 overflow-y-auto p-6">
              <div className="mb-6 p-4 bg-slate-50 rounded-lg">
                <p className="text-sm font-medium text-slate-700 mb-2">Message Content:</p>
                <p className="text-sm text-slate-900 whitespace-pre-wrap">{selectedCampaign.message_text}</p>
              </div>

              <h4 className="font-semibold text-slate-900 mb-3">
                Individual Message Status ({campaignMessages.length} total)
              </h4>

              {loadingDetails ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#bb2738]"></div>
                </div>
              ) : campaignMessages.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  <MessageSquare className="w-8 h-8 mx-auto mb-2 text-slate-400" />
                  No message details available
                </div>
              ) : (
                <div className="space-y-2">
                  {campaignMessages.map((msg) => (
                    <div key={msg.id} className="p-3 border border-slate-200 rounded-lg hover:bg-slate-50">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <p className="font-medium text-slate-900">{msg.phone_number}</p>
                          {msg.sent_at && (
                            <p className="text-xs text-slate-500 mt-1">
                              Sent: {new Date(msg.sent_at).toLocaleString()}
                            </p>
                          )}
                          {msg.error_message && (
                            <p className="text-xs text-red-600 mt-1">Error: {msg.error_message}</p>
                          )}
                        </div>
                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${getStatusColor(msg.status)}`}>
                          {msg.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-xl p-4">
        <h3 className="font-semibold text-blue-900 mb-2">Message Status Guide</h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
          <div>
            <span className="inline-block w-2 h-2 bg-slate-500 rounded-full mr-2"></span>
            <span className="text-blue-800">Pending - Not yet sent</span>
          </div>
          <div>
            <span className="inline-block w-2 h-2 bg-yellow-500 rounded-full mr-2"></span>
            <span className="text-blue-800">Scheduled - Waiting</span>
          </div>
          <div>
            <span className="inline-block w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
            <span className="text-blue-800">Sending - In progress</span>
          </div>
          <div>
            <span className="inline-block w-2 h-2 bg-green-500 rounded-full mr-2"></span>
            <span className="text-blue-800">Sent - Delivered</span>
          </div>
          <div>
            <span className="inline-block w-2 h-2 bg-red-500 rounded-full mr-2"></span>
            <span className="text-blue-800">Failed - Error</span>
          </div>
        </div>
      </div>
    </div>
  );
}
