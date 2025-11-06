import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useToast } from '../contexts/ToastContext';
import { MessageSquare, Search, Archive, Star, Clock, Bot, User, Settings } from 'lucide-react';
import { WhatsAppDirectChat } from './WhatsAppDirectChat';

interface Conversation {
  id: string;
  customer_id: string;
  customer_name: string;
  customer_phone: string;
  status: 'active' | 'archived' | 'spam';
  unread_count: number;
  last_message_at: string;
  last_message_preview: string;
  last_message_from: 'customer' | 'admin' | 'ai';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  tags: string[];
}

export function WhatsAppInbox() {
  const { error: showError } = useToast();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'archived'>('active');
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [showChat, setShowChat] = useState(false);

  useEffect(() => {
    fetchConversations();

    const subscription = supabase
      .channel('conversations-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'whatsapp_conversations',
        },
        () => {
          fetchConversations();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [statusFilter]);

  const fetchConversations = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('whatsapp_conversations')
        .select('*')
        .order('last_message_at', { ascending: false });

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      const { data, error } = await query;

      if (error) throw error;
      setConversations(data || []);
    } catch (err: any) {
      console.error('Error fetching conversations:', err);
      showError('Failed to load conversations');
    } finally {
      setLoading(false);
    }
  };

  const archiveConversation = async (id: string) => {
    try {
      const { error } = await supabase
        .from('whatsapp_conversations')
        .update({ status: 'archived' })
        .eq('id', id);

      if (error) throw error;
      fetchConversations();
    } catch (err: any) {
      console.error('Error archiving conversation:', err);
      showError('Failed to archive conversation');
    }
  };

  const updatePriority = async (id: string, priority: Conversation['priority']) => {
    try {
      const { error } = await supabase
        .from('whatsapp_conversations')
        .update({ priority })
        .eq('id', id);

      if (error) throw error;
      fetchConversations();
    } catch (err: any) {
      console.error('Error updating priority:', err);
      showError('Failed to update priority');
    }
  };

  const filteredConversations = conversations.filter((conv) =>
    conv.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    conv.customer_phone.includes(searchTerm) ||
    conv.last_message_preview.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getPriorityColor = (priority: string) => {
    const colors = {
      low: 'text-slate-500',
      normal: 'text-blue-500',
      high: 'text-orange-500',
      urgent: 'text-red-500',
    };
    return colors[priority as keyof typeof colors] || 'text-slate-500';
  };

  const getSenderIcon = (senderType: string) => {
    switch (senderType) {
      case 'customer':
        return <User className="w-3 h-3 text-slate-500" />;
      case 'ai':
        return <Bot className="w-3 h-3 text-purple-500" />;
      default:
        return <MessageSquare className="w-3 h-3 text-green-500" />;
    }
  };

  const getUnreadBadge = (count: number) => {
    if (count === 0) return null;
    return (
      <span className="ml-auto bg-[#25D366] text-white text-xs font-semibold px-2 py-0.5 rounded-full">
        {count > 99 ? '99+' : count}
      </span>
    );
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">WhatsApp Inbox</h1>
          <p className="text-slate-600">Manage all customer conversations in one place</p>
        </div>
        <button
          onClick={() => window.location.href = '#ai-settings'}
          className="flex items-center gap-2 px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
        >
          <Settings className="w-5 h-5" />
          AI Settings
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-200 space-y-4">
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder="Search conversations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-[#25D366]"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="px-4 py-2.5 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-[#25D366]"
            >
              <option value="all">All</option>
              <option value="active">Active</option>
              <option value="archived">Archived</option>
            </select>
          </div>

          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-[#25D366] rounded-full"></div>
              <span className="text-slate-600">
                {conversations.filter((c) => c.unread_count > 0).length} Unread
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <span className="text-slate-600">
                {conversations.filter((c) => c.priority === 'urgent').length} Urgent
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Bot className="w-4 h-4 text-purple-500" />
              <span className="text-slate-600">AI Active</span>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#25D366]"></div>
          </div>
        ) : filteredConversations.length === 0 ? (
          <div className="py-12 text-center">
            <MessageSquare className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500 mb-2">No conversations found</p>
            <p className="text-sm text-slate-400">
              {conversations.length === 0
                ? 'Start a conversation from the Customers page'
                : 'Try adjusting your search or filters'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-200">
            {filteredConversations.map((conversation) => (
              <div
                key={conversation.id}
                onClick={() => {
                  setSelectedConversation(conversation);
                  setShowChat(true);
                }}
                className={`p-4 hover:bg-slate-50 cursor-pointer transition-colors ${
                  conversation.unread_count > 0 ? 'bg-green-50' : ''
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 bg-[#25D366] rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0">
                    {conversation.customer_name.charAt(0).toUpperCase()}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-semibold text-slate-900 truncate">
                        {conversation.customer_name}
                      </h3>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            updatePriority(
                              conversation.id,
                              conversation.priority === 'urgent' ? 'normal' : 'urgent'
                            );
                          }}
                          className={`${getPriorityColor(conversation.priority)}`}
                        >
                          <Star
                            className={`w-4 h-4 ${
                              conversation.priority === 'urgent' ? 'fill-current' : ''
                            }`}
                          />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            archiveConversation(conversation.id);
                          }}
                          className="text-slate-400 hover:text-slate-600"
                        >
                          <Archive className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <p className="text-sm text-slate-600 mb-1">{conversation.customer_phone}</p>

                    <div className="flex items-center gap-2">
                      {getSenderIcon(conversation.last_message_from)}
                      <p className="text-sm text-slate-600 truncate flex-1">
                        {conversation.last_message_preview}
                      </p>
                    </div>

                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <Clock className="w-3 h-3" />
                        <span>
                          {new Date(conversation.last_message_at).toLocaleString([], {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                      {getUnreadBadge(conversation.unread_count)}
                    </div>

                    {conversation.tags.length > 0 && (
                      <div className="flex gap-1 mt-2">
                        {conversation.tags.slice(0, 3).map((tag, idx) => (
                          <span
                            key={idx}
                            className="text-xs px-2 py-0.5 bg-slate-200 text-slate-700 rounded"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <MessageSquare className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-800">
                {conversations.filter((c) => c.status === 'active').length}
              </p>
              <p className="text-sm text-slate-600">Active Chats</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <Bot className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-800">
                {conversations.filter((c) => c.last_message_from === 'ai').length}
              </p>
              <p className="text-sm text-slate-600">AI Responses Today</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
              <Clock className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-800">
                {conversations.reduce((sum, c) => sum + c.unread_count, 0)}
              </p>
              <p className="text-sm text-slate-600">Unread Messages</p>
            </div>
          </div>
        </div>
      </div>

      {showChat && selectedConversation && (
        <WhatsAppDirectChat
          customerId={selectedConversation.customer_id}
          customerName={selectedConversation.customer_name}
          customerPhone={selectedConversation.customer_phone}
          onClose={() => {
            setShowChat(false);
            setSelectedConversation(null);
            fetchConversations();
          }}
        />
      )}
    </div>
  );
}
