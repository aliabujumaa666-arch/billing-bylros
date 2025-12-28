import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useToast } from '../contexts/ToastContext';
import { MessageSquare, Send, X, User, Clock, Pencil, Trash2 } from 'lucide-react';

interface Message {
  id: string;
  customer_id: string;
  sender_type: 'admin' | 'customer';
  sender_id: string;
  subject: string;
  message: string;
  is_read: boolean;
  parent_id: string | null;
  attachments: any[];
  created_at: string;
  read_at: string | null;
  customer?: { name: string };
}

export function Messages() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [replies, setReplies] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCompose, setShowCompose] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [composeData, setComposeData] = useState({
    customer_id: '',
    subject: '',
    message: '',
  });
  const [customers, setCustomers] = useState<any[]>([]);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editData, setEditData] = useState({ subject: '', message: '' });
  const [deleting, setDeleting] = useState(false);
  const { success, error: showError } = useToast();

  useEffect(() => {
    fetchMessages();
    fetchCustomers();
  }, []);

  useEffect(() => {
    if (selectedMessage) {
      fetchReplies(selectedMessage.id);
      markAsRead(selectedMessage.id);
    }
  }, [selectedMessage]);

  const fetchMessages = async () => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*, customer:customers(name)')
        .is('parent_id', null)
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

  const fetchCustomers = async () => {
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('id, name')
        .order('name');

      if (error) throw error;
      setCustomers(data || []);
    } catch (err) {
      console.error('Error fetching customers:', err);
    }
  };

  const fetchReplies = async (parentId: string) => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('parent_id', parentId)
        .order('created_at');

      if (error) throw error;
      setReplies(data || []);
    } catch (err) {
      console.error('Error fetching replies:', err);
    }
  };

  const markAsRead = async (messageId: string) => {
    try {
      await supabase
        .from('messages')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq('id', messageId);

      fetchMessages();
    } catch (err) {
      console.error('Error marking as read:', err);
    }
  };

  const sendReply = async () => {
    if (!replyText.trim() || !selectedMessage) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();

      const { error } = await supabase.from('messages').insert([{
        customer_id: selectedMessage.customer_id,
        sender_type: 'admin',
        sender_id: user?.id || '',
        subject: `Re: ${selectedMessage.subject}`,
        message: replyText,
        parent_id: selectedMessage.id,
      }]);

      if (error) throw error;

      success('Reply sent successfully');
      setReplyText('');
      fetchReplies(selectedMessage.id);
    } catch (err: any) {
      console.error('Error sending reply:', err);
      showError(err.message || 'Failed to send reply');
    }
  };

  const composeMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const { data: { user } } = await supabase.auth.getUser();

      const { error } = await supabase.from('messages').insert([{
        customer_id: composeData.customer_id,
        sender_type: 'admin',
        sender_id: user?.id || '',
        subject: composeData.subject,
        message: composeData.message,
      }]);

      if (error) throw error;

      success('Message sent successfully');
      setShowCompose(false);
      setComposeData({ customer_id: '', subject: '', message: '' });
      fetchMessages();
    } catch (err: any) {
      console.error('Error sending message:', err);
      showError(err.message || 'Failed to send message');
    }
  };

  const openEditModal = () => {
    if (selectedMessage) {
      setEditData({
        subject: selectedMessage.subject,
        message: selectedMessage.message,
      });
      setShowEditModal(true);
    }
  };

  const updateMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMessage) return;

    try {
      const { error } = await supabase
        .from('messages')
        .update({
          subject: editData.subject,
          message: editData.message,
        })
        .eq('id', selectedMessage.id);

      if (error) throw error;

      success('Message updated successfully');
      setShowEditModal(false);
      setSelectedMessage({ ...selectedMessage, ...editData });
      fetchMessages();
    } catch (err: any) {
      console.error('Error updating message:', err);
      showError(err.message || 'Failed to update message');
    }
  };

  const deleteMessage = async () => {
    if (!selectedMessage) return;

    setDeleting(true);
    try {
      const { error } = await supabase
        .from('messages')
        .delete()
        .eq('id', selectedMessage.id);

      if (error) throw error;

      success('Message deleted successfully');
      setShowDeleteModal(false);
      setSelectedMessage(null);
      fetchMessages();
    } catch (err: any) {
      console.error('Error deleting message:', err);
      showError(err.message || 'Failed to delete message');
    } finally {
      setDeleting(false);
    }
  };

  const unreadCount = messages.filter(m => !m.is_read).length;

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
          <h1 className="text-3xl font-bold text-slate-800 mb-2">Messages</h1>
          <p className="text-slate-600">
            {unreadCount > 0 ? `${unreadCount} unread message${unreadCount > 1 ? 's' : ''}` : 'All messages read'}
          </p>
        </div>
        <button
          onClick={() => setShowCompose(true)}
          className="flex items-center gap-2 bg-[#bb2738] hover:bg-[#a01f2f] text-white px-4 py-2.5 rounded-lg transition-colors"
        >
          <MessageSquare className="w-5 h-5" />
          New Message
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="p-4 border-b border-slate-200 bg-slate-50">
            <h3 className="font-semibold text-slate-800">Inbox</h3>
          </div>
          <div className="overflow-y-auto max-h-[600px]">
            {messages.length === 0 ? (
              <div className="p-8 text-center text-slate-500">
                <MessageSquare className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                <p>No messages</p>
              </div>
            ) : (
              messages.map((message) => (
                <button
                  key={message.id}
                  onClick={() => setSelectedMessage(message)}
                  className={`w-full p-4 text-left border-b border-slate-200 hover:bg-slate-50 transition-colors ${
                    selectedMessage?.id === message.id ? 'bg-blue-50' : ''
                  } ${!message.is_read ? 'bg-blue-50/50' : ''}`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {!message.is_read && (
                        <div className="w-2 h-2 bg-[#bb2738] rounded-full"></div>
                      )}
                      <span className="font-medium text-slate-800 text-sm">
                        {message.customer?.name || 'Unknown'}
                      </span>
                    </div>
                    <span className="text-xs text-slate-500">
                      {new Date(message.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-sm font-medium text-slate-700 mb-1 line-clamp-1">
                    {message.subject}
                  </p>
                  <p className="text-sm text-slate-600 line-clamp-2">{message.message}</p>
                </button>
              ))
            )}
          </div>
        </div>

        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 overflow-hidden">
          {selectedMessage ? (
            <div className="flex flex-col h-[600px]">
              <div className="p-6 border-b border-slate-200 bg-slate-50">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h2 className="text-xl font-bold text-slate-800 mb-1">{selectedMessage.subject}</h2>
                    <div className="flex items-center gap-4 text-sm text-slate-600">
                      <span className="flex items-center gap-1">
                        <User className="w-4 h-4" />
                        {selectedMessage.customer?.name || 'Unknown'}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {new Date(selectedMessage.created_at).toLocaleString()}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={openEditModal}
                      className="p-2 hover:bg-slate-200 rounded-lg transition-colors"
                      title="Edit message"
                    >
                      <Pencil className="w-4 h-4 text-slate-600" />
                    </button>
                    <button
                      onClick={() => setShowDeleteModal(true)}
                      className="p-2 hover:bg-red-100 rounded-lg transition-colors"
                      title="Delete message"
                    >
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </button>
                    <button
                      onClick={() => setSelectedMessage(null)}
                      className="p-2 hover:bg-slate-200 rounded-lg transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                <div className="bg-slate-50 rounded-lg p-4">
                  <div className="flex items-start gap-3 mb-2">
                    <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm">
                      {selectedMessage.customer?.name?.charAt(0) || 'C'}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-slate-800 text-sm">
                        {selectedMessage.customer?.name || 'Unknown'}
                      </p>
                      <p className="text-xs text-slate-500">
                        {new Date(selectedMessage.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <p className="text-slate-700 whitespace-pre-wrap">{selectedMessage.message}</p>
                </div>

                {replies.map((reply) => (
                  <div
                    key={reply.id}
                    className={`rounded-lg p-4 ${
                      reply.sender_type === 'admin'
                        ? 'bg-[#bb2738]/10 ml-8'
                        : 'bg-slate-50'
                    }`}
                  >
                    <div className="flex items-start gap-3 mb-2">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm ${
                        reply.sender_type === 'admin' ? 'bg-[#bb2738]' : 'bg-blue-500'
                      }`}>
                        {reply.sender_type === 'admin' ? 'A' : 'C'}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-slate-800 text-sm">
                          {reply.sender_type === 'admin' ? 'Admin' : selectedMessage.customer?.name}
                        </p>
                        <p className="text-xs text-slate-500">
                          {new Date(reply.created_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <p className="text-slate-700 whitespace-pre-wrap">{reply.message}</p>
                  </div>
                ))}
              </div>

              <div className="p-4 border-t border-slate-200">
                <div className="flex gap-2">
                  <textarea
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Type your reply..."
                    rows={3}
                    className="flex-1 px-4 py-2.5 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-[#bb2738] resize-none"
                  />
                  <button
                    onClick={sendReply}
                    disabled={!replyText.trim()}
                    className="px-4 py-2 bg-[#bb2738] hover:bg-[#a01f2f] disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-[600px] text-slate-500">
              <div className="text-center">
                <MessageSquare className="w-16 h-16 mx-auto mb-4 text-slate-300" />
                <p>Select a message to view</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {showCompose && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full">
            <div className="border-b border-slate-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-800">New Message</h2>
              <button onClick={() => setShowCompose(false)} className="p-2 hover:bg-slate-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={composeMessage} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Customer</label>
                <select
                  value={composeData.customer_id}
                  onChange={(e) => setComposeData({ ...composeData, customer_id: e.target.value })}
                  required
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-[#bb2738]"
                >
                  <option value="">Select a customer</option>
                  {customers.map((customer) => (
                    <option key={customer.id} value={customer.id}>
                      {customer.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Subject</label>
                <input
                  type="text"
                  value={composeData.subject}
                  onChange={(e) => setComposeData({ ...composeData, subject: e.target.value })}
                  required
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-[#bb2738]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Message</label>
                <textarea
                  value={composeData.message}
                  onChange={(e) => setComposeData({ ...composeData, message: e.target.value })}
                  required
                  rows={6}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-[#bb2738] resize-none"
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowCompose(false)}
                  className="flex-1 px-4 py-2.5 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2.5 bg-[#bb2738] hover:bg-[#a01f2f] text-white rounded-lg transition-colors"
                >
                  Send Message
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showEditModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full">
            <div className="border-b border-slate-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-800">Edit Message</h2>
              <button onClick={() => setShowEditModal(false)} className="p-2 hover:bg-slate-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={updateMessage} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Subject</label>
                <input
                  type="text"
                  value={editData.subject}
                  onChange={(e) => setEditData({ ...editData, subject: e.target.value })}
                  required
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-[#bb2738]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Message</label>
                <textarea
                  value={editData.message}
                  onChange={(e) => setEditData({ ...editData, message: e.target.value })}
                  required
                  rows={6}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-[#bb2738] resize-none"
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 px-4 py-2.5 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2.5 bg-[#bb2738] hover:bg-[#a01f2f] text-white rounded-lg transition-colors"
                >
                  Update Message
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
            <div className="border-b border-slate-200 px-6 py-4">
              <h2 className="text-xl font-bold text-slate-800">Delete Message</h2>
            </div>

            <div className="p-6">
              <p className="text-slate-600 mb-4">
                Are you sure you want to delete this message? This action cannot be undone.
              </p>
              {selectedMessage && (
                <div className="bg-slate-50 rounded-lg p-4 mb-4">
                  <p className="font-medium text-slate-800 mb-1">{selectedMessage.subject}</p>
                  <p className="text-sm text-slate-600 line-clamp-2">{selectedMessage.message}</p>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowDeleteModal(false)}
                  disabled={deleting}
                  className="flex-1 px-4 py-2.5 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={deleteMessage}
                  disabled={deleting}
                  className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {deleting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Deleting...
                    </>
                  ) : (
                    'Delete Message'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
