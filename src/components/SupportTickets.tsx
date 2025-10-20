import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Ticket, MessageSquare, Send, X, Filter, Clock } from 'lucide-react';

export function SupportTickets() {
  const [tickets, setTickets] = useState<any[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [replies, setReplies] = useState<any[]>([]);
  const [replyText, setReplyText] = useState('');
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    fetchTickets();
  }, []);

  useEffect(() => {
    if (selectedTicket) {
      fetchReplies(selectedTicket.id);
    }
  }, [selectedTicket]);

  const fetchTickets = async () => {
    const { data } = await supabase
      .from('support_tickets')
      .select('*, customer:customers(name)')
      .order('created_at', { ascending: false });

    if (data) setTickets(data);
    setLoading(false);
  };

  const fetchReplies = async (ticketId: string) => {
    const { data } = await supabase
      .from('support_ticket_replies')
      .select('*')
      .eq('ticket_id', ticketId)
      .order('created_at');

    if (data) setReplies(data);
  };

  const sendReply = async () => {
    if (!replyText.trim()) return;

    const { data: { user } } = await supabase.auth.getUser();

    await supabase.from('support_ticket_replies').insert([{
      ticket_id: selectedTicket.id,
      user_id: user?.id,
      reply_text: replyText,
      is_internal_note: false
    }]);

    await supabase.from('support_tickets').update({ status: 'in_progress' }).eq('id', selectedTicket.id);

    const { data: customerData } = await supabase
      .from('customers')
      .select('email')
      .eq('id', selectedTicket.customer_id)
      .maybeSingle();

    if (customerData?.email) {
      try {
        await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-ticket-notification`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            type: 'ticket_reply',
            ticket: { ...selectedTicket, status: 'in_progress' },
            customerEmail: customerData.email,
          }),
        });
      } catch (error) {
        console.error('Failed to send notification:', error);
      }
    }

    setReplyText('');
    fetchReplies(selectedTicket.id);
    fetchTickets();
  };

  const updateTicketStatus = async (ticketId: string, status: string) => {
    await supabase.from('support_tickets').update({ status }).eq('id', ticketId);

    const ticket = tickets.find(t => t.id === ticketId);
    if (ticket) {
      const { data: customerData } = await supabase
        .from('customers')
        .select('email')
        .eq('id', ticket.customer_id)
        .maybeSingle();

      if (customerData?.email) {
        try {
          await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-ticket-notification`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              type: 'ticket_status_update',
              ticket: { ...ticket, status },
              customerEmail: customerData.email,
            }),
          });
        } catch (error) {
          console.error('Failed to send notification:', error);
        }
      }
    }

    fetchTickets();
    if (selectedTicket?.id === ticketId) {
      setSelectedTicket({ ...selectedTicket, status });
    }
  };

  const updatePriority = async (ticketId: string, priority: string) => {
    await supabase.from('support_tickets').update({ priority }).eq('id', ticketId);
    fetchTickets();
    if (selectedTicket?.id === ticketId) {
      setSelectedTicket({ ...selectedTicket, priority });
    }
  };

  const filteredTickets = tickets.filter(t => filterStatus === 'all' || t.status === filterStatus);

  const getPriorityColor = (priority: string) => {
    const colors = {
      urgent: 'bg-red-100 text-red-700',
      high: 'bg-orange-100 text-orange-700',
      medium: 'bg-yellow-100 text-yellow-700',
      low: 'bg-blue-100 text-blue-700'
    };
    return colors[priority as keyof typeof colors] || 'bg-slate-100 text-slate-700';
  };

  const getStatusColor = (status: string) => {
    const colors = {
      open: 'bg-blue-100 text-blue-700',
      in_progress: 'bg-yellow-100 text-yellow-700',
      waiting: 'bg-purple-100 text-purple-700',
      resolved: 'bg-green-100 text-green-700',
      closed: 'bg-slate-100 text-slate-700'
    };
    return colors[status as keyof typeof colors] || 'bg-slate-100 text-slate-700';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#bb2738]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 mb-2">Support Tickets</h1>
          <p className="text-slate-600">Manage customer support requests</p>
        </div>
        <div className="flex items-center gap-3">
          <Filter className="w-5 h-5 text-slate-600" />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#bb2738] focus:border-transparent outline-none"
          >
            <option value="all">All Tickets ({tickets.length})</option>
            <option value="open">Open ({tickets.filter(t => t.status === 'open').length})</option>
            <option value="in_progress">In Progress ({tickets.filter(t => t.status === 'in_progress').length})</option>
            <option value="waiting">Waiting ({tickets.filter(t => t.status === 'waiting').length})</option>
            <option value="resolved">Resolved ({tickets.filter(t => t.status === 'resolved').length})</option>
            <option value="closed">Closed ({tickets.filter(t => t.status === 'closed').length})</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-3">
          {filteredTickets.map(ticket => (
            <div
              key={ticket.id}
              onClick={() => setSelectedTicket(ticket)}
              className={`bg-white rounded-xl border border-slate-200 p-4 cursor-pointer hover:shadow-md transition-shadow ${selectedTicket?.id === ticket.id ? 'ring-2 ring-[#bb2738]' : ''}`}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-slate-800">#{ticket.ticket_number}</span>
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${getPriorityColor(ticket.priority)}`}>
                      {ticket.priority}
                    </span>
                  </div>
                  <h3 className="font-medium text-slate-800 mb-1">{ticket.subject}</h3>
                  <p className="text-sm text-slate-600 mb-2">{ticket.customer_name}</p>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(ticket.status)}`}>
                  {ticket.status.replace('_', ' ')}
                </span>
                <span className="text-xs text-slate-500">{new Date(ticket.created_at).toLocaleDateString()}</span>
              </div>
            </div>
          ))}

          {filteredTickets.length === 0 && (
            <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
              <Ticket className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-slate-800 mb-2">No Tickets Found</h3>
              <p className="text-slate-600">No support tickets match your filter</p>
            </div>
          )}
        </div>

        <div className="lg:col-span-2">
          {selectedTicket ? (
            <div className="bg-white rounded-xl border border-slate-200">
              <div className="p-6 border-b border-slate-200">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <h2 className="text-2xl font-bold text-slate-800">#{selectedTicket.ticket_number}</h2>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getPriorityColor(selectedTicket.priority)}`}>
                        {selectedTicket.priority}
                      </span>
                    </div>
                    <h3 className="text-xl text-slate-800 mb-2">{selectedTicket.subject}</h3>
                    <p className="text-sm text-slate-600">
                      From: {selectedTicket.customer_name} ({selectedTicket.customer_email})
                    </p>
                    <p className="text-sm text-slate-500 mt-1">
                      Created: {new Date(selectedTicket.created_at).toLocaleString()}
                    </p>
                  </div>
                  <button onClick={() => setSelectedTicket(null)} className="p-2 hover:bg-slate-100 rounded-lg">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Status</label>
                    <select
                      value={selectedTicket.status}
                      onChange={(e) => updateTicketStatus(selectedTicket.id, e.target.value)}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#bb2738] focus:border-transparent outline-none"
                    >
                      <option value="open">Open</option>
                      <option value="in_progress">In Progress</option>
                      <option value="waiting">Waiting</option>
                      <option value="resolved">Resolved</option>
                      <option value="closed">Closed</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Priority</label>
                    <select
                      value={selectedTicket.priority}
                      onChange={(e) => updatePriority(selectedTicket.id, e.target.value)}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#bb2738] focus:border-transparent outline-none"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="urgent">Urgent</option>
                    </select>
                  </div>
                </div>

                <div className="mt-4 p-4 bg-slate-50 rounded-lg">
                  <p className="text-sm text-slate-800 whitespace-pre-wrap">{selectedTicket.description}</p>
                </div>
              </div>

              <div className="p-6 max-h-96 overflow-y-auto">
                <h4 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
                  <MessageSquare className="w-5 h-5" />
                  Replies ({replies.length})
                </h4>
                <div className="space-y-4">
                  {replies.map(reply => (
                    <div key={reply.id} className={`p-4 rounded-lg ${reply.is_internal_note ? 'bg-yellow-50 border border-yellow-200' : 'bg-slate-50'}`}>
                      <div className="flex items-center gap-2 mb-2">
                        <Clock className="w-4 h-4 text-slate-500" />
                        <span className="text-sm text-slate-600">{new Date(reply.created_at).toLocaleString()}</span>
                        {reply.is_internal_note && (
                          <span className="text-xs bg-yellow-200 text-yellow-800 px-2 py-0.5 rounded">Internal Note</span>
                        )}
                      </div>
                      <p className="text-sm text-slate-800 whitespace-pre-wrap">{reply.reply_text}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-6 border-t border-slate-200">
                <div className="flex gap-3">
                  <textarea
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Type your reply..."
                    rows={3}
                    className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#bb2738] focus:border-transparent outline-none"
                  />
                  <button
                    onClick={sendReply}
                    disabled={!replyText.trim()}
                    className="flex items-center gap-2 px-6 py-2 bg-[#bb2738] text-white rounded-lg hover:bg-[#a01f2f] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Send className="w-4 h-4" />
                    Send
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-slate-200 p-12 text-center h-full flex items-center justify-center">
              <div>
                <Ticket className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-slate-800 mb-2">Select a Ticket</h3>
                <p className="text-slate-600">Click on a ticket to view details and reply</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
