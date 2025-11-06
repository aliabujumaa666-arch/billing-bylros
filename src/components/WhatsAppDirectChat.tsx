import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useToast } from '../contexts/ToastContext';
import { X, Send, Loader, Bot, User, CheckCheck, Clock, Sparkles } from 'lucide-react';

interface Message {
  id: string;
  message_text: string;
  sender_type: 'customer' | 'admin' | 'ai';
  sender_name: string;
  is_ai_generated: boolean;
  ai_confidence_score?: number;
  status: 'pending' | 'sent' | 'delivered' | 'read' | 'failed';
  created_at: string;
}

interface Conversation {
  id: string;
  customer_name: string;
  customer_phone: string;
}

interface QuickReply {
  id: string;
  title: string;
  message_template: string;
}

interface WhatsAppDirectChatProps {
  customerId: string;
  customerName: string;
  customerPhone: string;
  onClose: () => void;
}

export function WhatsAppDirectChat({ customerId, customerName, customerPhone, onClose }: WhatsAppDirectChatProps) {
  const { success: showSuccess, error: showError } = useToast();
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [messageText, setMessageText] = useState('');
  const [quickReplies, setQuickReplies] = useState<QuickReply[]>([]);
  const [showQuickReplies, setShowQuickReplies] = useState(false);
  const [aiGenerating, setAiGenerating] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    initializeChat();
    fetchQuickReplies();
  }, [customerId]);

  useEffect(() => {
    if (conversation?.id) {
      const subscription = supabase
        .channel(`conversation:${conversation.id}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'whatsapp_messages',
            filter: `conversation_id=eq.${conversation.id}`,
          },
          (payload) => {
            setMessages((current) => [...current, payload.new as Message]);
            scrollToBottom();
          }
        )
        .subscribe();

      return () => {
        subscription.unsubscribe();
      };
    }
  }, [conversation?.id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const initializeChat = async () => {
    try {
      setLoading(true);

      let { data: existingConv, error: convError } = await supabase
        .from('whatsapp_conversations')
        .select('*')
        .eq('customer_id', customerId)
        .maybeSingle();

      if (convError && convError.code !== 'PGRST116') throw convError;

      if (!existingConv) {
        const { data: newConv, error: createError } = await supabase
          .from('whatsapp_conversations')
          .insert({
            customer_id: customerId,
            customer_phone: customerPhone,
            customer_name: customerName,
            assigned_admin_id: (await supabase.auth.getUser()).data.user?.id,
          })
          .select()
          .single();

        if (createError) throw createError;
        existingConv = newConv;
      }

      setConversation(existingConv);

      const { data: msgs, error: msgsError } = await supabase
        .from('whatsapp_messages')
        .select('*')
        .eq('conversation_id', existingConv.id)
        .order('created_at', { ascending: true });

      if (msgsError) throw msgsError;
      setMessages(msgs || []);

      await supabase
        .from('whatsapp_conversations')
        .update({ unread_count: 0 })
        .eq('id', existingConv.id);

    } catch (err: any) {
      console.error('Error initializing chat:', err);
      showError('Failed to load conversation');
    } finally {
      setLoading(false);
    }
  };

  const fetchQuickReplies = async () => {
    try {
      const { data, error } = await supabase
        .from('whatsapp_quick_replies')
        .select('*')
        .eq('is_active', true)
        .order('usage_count', { ascending: false })
        .limit(10);

      if (error) throw error;
      setQuickReplies(data || []);
    } catch (err: any) {
      console.error('Error fetching quick replies:', err);
    }
  };

  const sendMessage = async (text: string) => {
    if (!text.trim() || !conversation) return;

    setSending(true);
    try {
      const { data: user } = await supabase.auth.getUser();

      const { error } = await supabase
        .from('whatsapp_messages')
        .insert({
          conversation_id: conversation.id,
          message_type: 'outgoing',
          sender_type: 'admin',
          sender_id: user?.user?.id,
          sender_name: user?.user?.email || 'Admin',
          message_text: text,
          status: 'sent',
          sent_at: new Date().toISOString(),
        });

      if (error) throw error;

      setMessageText('');
      showSuccess('Message sent');
    } catch (err: any) {
      console.error('Error sending message:', err);
      showError('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const generateAIResponse = async () => {
    if (!conversation) return;

    setAiGenerating(true);
    try {
      const recentMessages = messages.slice(-5);
      const context = recentMessages
        .map((m) => `${m.sender_type}: ${m.message_text}`)
        .join('\n');

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/whatsapp-ai-response`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            conversation_id: conversation.id,
            customer_id: customerId,
            context,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to generate AI response');
      }

      setMessageText(data.suggested_response);
      showSuccess('AI response generated! Review and send when ready.');
    } catch (err: any) {
      console.error('Error generating AI response:', err);
      showError(err.message || 'Failed to generate AI response');
    } finally {
      setAiGenerating(false);
    }
  };

  const handleQuickReply = (template: string) => {
    setMessageText(template);
    setShowQuickReplies(false);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sent':
        return <CheckCheck className="w-3 h-3 text-slate-400" />;
      case 'delivered':
        return <CheckCheck className="w-3 h-3 text-blue-500" />;
      case 'read':
        return <CheckCheck className="w-3 h-3 text-green-500" />;
      case 'failed':
        return <X className="w-3 h-3 text-red-500" />;
      default:
        return <Clock className="w-3 h-3 text-slate-400" />;
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl p-8 flex flex-col items-center gap-3">
          <Loader className="w-12 h-12 text-[#bb2738] animate-spin" />
          <p className="text-slate-600">Loading conversation...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl h-[80vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-slate-50 rounded-t-xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#25D366] rounded-full flex items-center justify-center text-white font-semibold">
              {customerName.charAt(0).toUpperCase()}
            </div>
            <div>
              <h3 className="font-semibold text-slate-900">{customerName}</h3>
              <p className="text-sm text-slate-600">{customerPhone}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-200 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-slate-600" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-500">
              <p>No messages yet. Start the conversation!</p>
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${
                  message.sender_type === 'customer' ? 'justify-start' : 'justify-end'
                }`}
              >
                <div
                  className={`max-w-[70%] rounded-lg px-4 py-2 ${
                    message.sender_type === 'customer'
                      ? 'bg-white border border-slate-200'
                      : message.is_ai_generated
                      ? 'bg-purple-100 border border-purple-200'
                      : 'bg-[#25D366] text-white'
                  }`}
                >
                  {message.is_ai_generated && (
                    <div className="flex items-center gap-1 text-xs text-purple-700 mb-1">
                      <Bot className="w-3 h-3" />
                      <span>AI Generated</span>
                      {message.ai_confidence_score && (
                        <span className="ml-1">
                          ({Math.round(message.ai_confidence_score * 100)}%)
                        </span>
                      )}
                    </div>
                  )}
                  <p
                    className={`text-sm ${
                      message.sender_type === 'customer' ? 'text-slate-800' : ''
                    }`}
                  >
                    {message.message_text}
                  </p>
                  <div
                    className={`flex items-center justify-between gap-2 mt-1 text-xs ${
                      message.sender_type === 'customer'
                        ? 'text-slate-500'
                        : 'text-white/80'
                    }`}
                  >
                    <span>
                      {new Date(message.created_at).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                    {message.sender_type !== 'customer' && (
                      <div>{getStatusIcon(message.status)}</div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {showQuickReplies && quickReplies.length > 0 && (
          <div className="border-t border-slate-200 p-3 bg-white max-h-40 overflow-y-auto">
            <p className="text-xs font-semibold text-slate-700 mb-2">Quick Replies</p>
            <div className="space-y-1">
              {quickReplies.map((reply) => (
                <button
                  key={reply.id}
                  onClick={() => handleQuickReply(reply.message_template)}
                  className="w-full text-left px-3 py-2 text-sm bg-slate-50 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <p className="font-medium text-slate-900">{reply.title}</p>
                  <p className="text-xs text-slate-600 truncate">{reply.message_template}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="border-t border-slate-200 p-4 bg-white rounded-b-xl">
          <div className="flex items-center gap-2 mb-2">
            <button
              onClick={() => setShowQuickReplies(!showQuickReplies)}
              className="px-3 py-1.5 text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors"
            >
              Quick Replies
            </button>
            <button
              onClick={generateAIResponse}
              disabled={aiGenerating}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-purple-100 hover:bg-purple-200 text-purple-700 rounded-lg transition-colors disabled:opacity-50"
            >
              {aiGenerating ? (
                <>
                  <Loader className="w-3 h-3 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="w-3 h-3" />
                  AI Suggest
                </>
              )}
            </button>
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage(messageText)}
              placeholder="Type a message..."
              className="flex-1 px-4 py-2.5 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-[#25D366]"
            />
            <button
              onClick={() => sendMessage(messageText)}
              disabled={sending || !messageText.trim()}
              className="px-6 py-2.5 bg-[#25D366] hover:bg-[#20b358] text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {sending ? (
                <Loader className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
