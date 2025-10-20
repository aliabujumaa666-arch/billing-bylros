import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useCustomerAuth } from '../../contexts/CustomerAuthContext';
import { useToast } from '../../contexts/ToastContext';
import { MessageSquare, Send, Mail, MailOpen, Reply, Clock } from 'lucide-react';

interface Message {
  id: string;
  customer_id: string;
  sender_type: 'admin' | 'customer';
  sender_id: string;
  subject: string;
  message: string;
  is_read: boolean;
  parent_id: string | null;
  attachments: any;
  created_at: string;
  read_at: string | null;
}

export function CustomerMessages() {
  const { customerData } = useCustomerAuth();
  const { success, error: showError } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [replyText, setReplyText] = useState('');
  const [newSubject, setNewSubject] = useState('');
  const [newMessage, setNewMessage] = useState('');
  const [showNewMessage, setShowNewMessage] = useState(false);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (customerData?.customer_id) {
      fetchMessages();
    }
  }, [customerData]);

  const fetchMessages = async () => {
    if (!customerData?.customer_id) return;

    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('customer_id', customerData.customer_id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setMessages(data || []);
    } catch (err) {
      console.error('Error fetching messages:', err);
      showError('Failed to load messages');
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (messageId: string) => {
    try {
      const { error } = await supabase
        .from('messages')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq('id', messageId);

      if (error) throw error;

      setMessages(prev =>
        prev.map(msg =>
          msg.id === messageId ? { ...msg, is_read: true, read_at: new Date().toISOString() } : msg
        )
      );
    } catch (err) {
      console.error('Error marking message as read:', err);
    }
  };

  const handleSelectMessage = (message: Message) => {
    setSelectedMessage(message);
    if (!message.is_read) {
      markAsRead(message.id);
    }
  };

  const handleSendReply = async () => {
    if (!customerData?.customer_id || !selectedMessage || !replyText.trim()) return;

    setSending(true);
    try {
      const { error } = await supabase
        .from('messages')
        .insert({
          customer_id: customerData.customer_id,
          sender_type: 'customer',
          sender_id: customerData.id,
          subject: `Re: ${selectedMessage.subject}`,
          message: replyText,
          is_read: false,
          parent_id: selectedMessage.id,
        });

      if (error) throw error;

      success('Reply sent successfully');
      setReplyText('');
      fetchMessages();
    } catch (err) {
      console.error('Error sending reply:', err);
      showError('Failed to send reply');
    } finally {
      setSending(false);
    }
  };

  const handleSendNewMessage = async () => {
    if (!customerData?.customer_id || !newSubject.trim() || !newMessage.trim()) {
      showError('Please fill in all fields');
      return;
    }

    setSending(true);
    try {
      const { error } = await supabase
        .from('messages')
        .insert({
          customer_id: customerData.customer_id,
          sender_type: 'customer',
          sender_id: customerData.id,
          subject: newSubject,
          message: newMessage,
          is_read: false,
        });

      if (error) throw error;

      success('Message sent successfully');
      setNewSubject('');
      setNewMessage('');
      setShowNewMessage(false);
      fetchMessages();
    } catch (err) {
      console.error('Error sending message:', err);
      showError('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const getThreadMessages = (parentId: string) => {
    return messages.filter(msg => msg.parent_id === parentId);
  };

  const formatDate = (date: string) => {
    const d = new Date(date);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60));

    if (diffInHours < 24) {
      return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    }
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#bb2738]"></div>
      </div>
    );
  }

  const threadMessages = messages.filter(msg => !msg.parent_id);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 mb-2">Messages</h1>
          <p className="text-slate-600">Communicate with BYLROS team</p>
        </div>
        <button
          onClick={() => setShowNewMessage(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#bb2738] hover:bg-[#a01f2f] text-white rounded-lg transition-colors"
        >
          <MessageSquare className="w-5 h-5" />
          New Message
        </button>
      </div>

      {showNewMessage && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full p-6">
            <h2 className="text-xl font-bold text-slate-800 mb-4">New Message</h2>
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Subject</label>
                <input
                  type="text"
                  value={newSubject}
                  onChange={(e) => setNewSubject(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#bb2738] focus:border-transparent"
                  placeholder="Enter subject"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Message</label>
                <textarea
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  rows={6}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#bb2738] focus:border-transparent"
                  placeholder="Type your message here..."
                />
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleSendNewMessage}
                disabled={sending || !newSubject.trim() || !newMessage.trim()}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-[#bb2738] hover:bg-[#a01f2f] disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
              >
                <Send className="w-5 h-5" />
                {sending ? 'Sending...' : 'Send Message'}
              </button>
              <button
                onClick={() => {
                  setShowNewMessage(false);
                  setNewSubject('');
                  setNewMessage('');
                }}
                className="px-4 py-2.5 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="p-4 bg-slate-50 border-b border-slate-200">
            <h2 className="font-semibold text-slate-800">Inbox</h2>
            <p className="text-sm text-slate-600">{messages.filter(m => !m.is_read).length} unread</p>
          </div>
          <div className="overflow-y-auto max-h-[600px]">
            {threadMessages.length === 0 ? (
              <div className="p-8 text-center">
                <MessageSquare className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500">No messages yet</p>
                <p className="text-sm text-slate-400 mt-1">Start a conversation with our team</p>
              </div>
            ) : (
              threadMessages.map(message => (
                <button
                  key={message.id}
                  onClick={() => handleSelectMessage(message)}
                  className={`w-full p-4 text-left border-b border-slate-200 hover:bg-slate-50 transition-colors ${
                    selectedMessage?.id === message.id ? 'bg-blue-50 hover:bg-blue-50' : ''
                  } ${!message.is_read ? 'bg-blue-50/50' : ''}`}
                >
                  <div className="flex items-start gap-3">
                    {message.is_read ? (
                      <MailOpen className="w-5 h-5 text-slate-400 flex-shrink-0 mt-0.5" />
                    ) : (
                      <Mail className="w-5 h-5 text-[#bb2738] flex-shrink-0 mt-0.5" />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className={`font-semibold text-slate-800 truncate ${!message.is_read ? 'font-bold' : ''}`}>
                          {message.subject}
                        </span>
                      </div>
                      <p className="text-sm text-slate-600 line-clamp-2">{message.message}</p>
                      <div className="flex items-center gap-2 mt-2 text-xs text-slate-500">
                        <Clock className="w-3 h-3" />
                        {formatDate(message.created_at)}
                      </div>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200">
          {selectedMessage ? (
            <div className="flex flex-col h-full">
              <div className="p-6 border-b border-slate-200">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h2 className="text-xl font-bold text-slate-800 mb-1">{selectedMessage.subject}</h2>
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <span className="font-medium">
                        {selectedMessage.sender_type === 'admin' ? 'BYLROS Team' : 'You'}
                      </span>
                      <span>•</span>
                      <span>{formatDate(selectedMessage.created_at)}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-4 max-h-[400px]">
                <div className={`p-4 rounded-lg ${
                  selectedMessage.sender_type === 'admin' ? 'bg-slate-50' : 'bg-blue-50'
                }`}>
                  <p className="text-slate-700 whitespace-pre-wrap">{selectedMessage.message}</p>
                </div>

                {getThreadMessages(selectedMessage.id).map(reply => (
                  <div
                    key={reply.id}
                    className={`p-4 rounded-lg ${
                      reply.sender_type === 'admin' ? 'bg-slate-50' : 'bg-blue-50 ml-6'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-2 text-sm">
                      <span className="font-medium text-slate-700">
                        {reply.sender_type === 'admin' ? 'BYLROS Team' : 'You'}
                      </span>
                      <span className="text-slate-500">•</span>
                      <span className="text-slate-500">{formatDate(reply.created_at)}</span>
                    </div>
                    <p className="text-slate-700 whitespace-pre-wrap">{reply.message}</p>
                  </div>
                ))}
              </div>

              <div className="p-4 border-t border-slate-200">
                <textarea
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#bb2738] focus:border-transparent mb-3"
                  placeholder="Type your reply..."
                />
                <button
                  onClick={handleSendReply}
                  disabled={sending || !replyText.trim()}
                  className="flex items-center gap-2 px-4 py-2.5 bg-[#bb2738] hover:bg-[#a01f2f] disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
                >
                  <Reply className="w-5 h-5" />
                  {sending ? 'Sending...' : 'Send Reply'}
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full p-12">
              <div className="text-center">
                <MessageSquare className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-slate-800 mb-2">No Message Selected</h3>
                <p className="text-slate-600">Select a message from the list to view and reply</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
