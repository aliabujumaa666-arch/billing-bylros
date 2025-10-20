import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { BookOpen, HelpCircle, Video, Search, ThumbsUp, ThumbsDown, Play, MessageSquare, ChevronDown, ChevronUp } from 'lucide-react';
import { useCustomerAuth } from '../../contexts/CustomerAuthContext';

export function CustomerHelpCenter() {
  const { customerData } = useCustomerAuth();
  const [activeTab, setActiveTab] = useState<'articles' | 'faqs' | 'videos' | 'support'>('articles');
  const [categories, setCategories] = useState<any[]>([]);
  const [articles, setArticles] = useState<any[]>([]);
  const [faqs, setFaqs] = useState<any[]>([]);
  const [videos, setVideos] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedArticle, setSelectedArticle] = useState<any>(null);
  const [expandedFaqs, setExpandedFaqs] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [supportTicket, setSupportTicket] = useState({
    subject: '',
    description: '',
    category: 'General'
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const [categoriesRes, articlesRes, faqsRes, videosRes] = await Promise.all([
      supabase.from('knowledge_base_categories').select('*').eq('is_active', true).order('order_index'),
      supabase.from('knowledge_base_articles').select('*, category:knowledge_base_categories(name)').eq('is_published', true).in('target_audience', ['customer', 'both']).order('created_at', { ascending: false }),
      supabase.from('faqs').select('*').eq('is_active', true).in('target_audience', ['customer', 'both']).order('order_index'),
      supabase.from('video_tutorials').select('*').eq('is_published', true).in('target_audience', ['customer', 'both']).order('order_index')
    ]);

    if (categoriesRes.data) setCategories(categoriesRes.data);
    if (articlesRes.data) setArticles(articlesRes.data);
    if (faqsRes.data) setFaqs(faqsRes.data);
    if (videosRes.data) setVideos(videosRes.data);
    setLoading(false);
  };


  const handleArticleClick = async (article: any) => {
    setSelectedArticle(article);
    await supabase.from('knowledge_base_articles').update({ views_count: article.views_count + 1 }).eq('id', article.id);
  };

  const handleHelpful = async (articleId: string, helpful: boolean) => {
    const field = helpful ? 'helpful_count' : 'unhelpful_count';
    const article = articles.find(a => a.id === articleId);
    if (article) {
      await supabase.from('knowledge_base_articles').update({ [field]: article[field] + 1 }).eq('id', articleId);
      fetchData();
    }
  };

  const toggleFaqExpanded = async (faqId: string) => {
    const newExpanded = new Set(expandedFaqs);
    if (expandedFaqs.has(faqId)) {
      newExpanded.delete(faqId);
    } else {
      newExpanded.add(faqId);
      const faq = faqs.find(f => f.id === faqId);
      if (faq) {
        await supabase.from('faqs').update({ views_count: faq.views_count + 1 }).eq('id', faqId);
      }
    }
    setExpandedFaqs(newExpanded);
  };

  const handleVideoClick = async (video: any) => {
    await supabase.from('video_tutorials').update({ views_count: video.views_count + 1 }).eq('id', video.id);
    window.open(video.video_url, '_blank');
  };

  const submitSupportTicket = async () => {
    if (!supportTicket.subject || !supportTicket.description) {
      alert('Please fill in all required fields');
      return;
    }

    const ticketNumber = 'TKT-' + Date.now().toString().slice(-8);

    const ticketData = {
      ticket_number: ticketNumber,
      customer_id: customerData?.customer_id,
      customer_email: customerData?.email || '',
      customer_name: customerData?.name || 'Customer',
      subject: supportTicket.subject,
      description: supportTicket.description,
      category: supportTicket.category,
      priority: 'medium',
      status: 'open'
    };

    const { data: newTicket, error } = await supabase.from('support_tickets').insert([ticketData]).select().single();

    if (error) {
      alert('Failed to submit ticket. Please try again.');
      return;
    }

    try {
      await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-ticket-notification`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'new_ticket',
          ticket: newTicket,
          customerEmail: customerData?.email,
        }),
      });
    } catch (error) {
      console.error('Failed to send notification:', error);
    }

    alert(`Support ticket ${ticketNumber} submitted successfully! We'll get back to you soon.`);
    setSupportTicket({ subject: '', description: '', category: 'General' });
  };

  const filteredArticles = articles.filter(article => {
    const matchesSearch = searchQuery === '' ||
      article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      article.content.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || article.category_id === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const filteredFaqs = faqs.filter(faq =>
    searchQuery === '' ||
    faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
    faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredVideos = videos.filter(video =>
    searchQuery === '' ||
    video.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    video.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#bb2738]"></div>
      </div>
    );
  }

  if (selectedArticle) {
    return (
      <div className="space-y-6">
        <button
          onClick={() => setSelectedArticle(null)}
          className="flex items-center gap-2 text-[#bb2738] hover:underline"
        >
          ← Back to Help Center
        </button>

        <div className="bg-white rounded-xl border border-slate-200 p-8">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-slate-800 mb-2">{selectedArticle.title}</h1>
            {selectedArticle.category && (
              <span className="inline-block px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                {selectedArticle.category.name}
              </span>
            )}
          </div>

          <div className="prose max-w-none">
            <div className="text-slate-700 whitespace-pre-wrap">{selectedArticle.content}</div>
          </div>

          <div className="mt-8 pt-6 border-t border-slate-200">
            <p className="text-sm font-medium text-slate-700 mb-3">Was this article helpful?</p>
            <div className="flex gap-3">
              <button
                onClick={() => handleHelpful(selectedArticle.id, true)}
                className="flex items-center gap-2 px-4 py-2 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors"
              >
                <ThumbsUp className="w-4 h-4" />
                Yes ({selectedArticle.helpful_count})
              </button>
              <button
                onClick={() => handleHelpful(selectedArticle.id, false)}
                className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-colors"
              >
                <ThumbsDown className="w-4 h-4" />
                No ({selectedArticle.unhelpful_count})
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-800 mb-2">Help Center</h1>
        <p className="text-slate-600">Find answers to your questions and get support</p>
      </div>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search for help..."
          className="w-full pl-12 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#bb2738] focus:border-transparent outline-none text-lg"
        />
      </div>

      <div className="flex gap-3 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('articles')}
          className={`flex items-center gap-2 px-4 py-3 font-medium text-sm transition-colors border-b-2 ${
            activeTab === 'articles' ? 'border-[#bb2738] text-[#bb2738]' : 'border-transparent text-slate-600 hover:text-slate-800'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          Articles ({articles.length})
        </button>
        <button
          onClick={() => setActiveTab('faqs')}
          className={`flex items-center gap-2 px-4 py-3 font-medium text-sm transition-colors border-b-2 ${
            activeTab === 'faqs' ? 'border-[#bb2738] text-[#bb2738]' : 'border-transparent text-slate-600 hover:text-slate-800'
          }`}
        >
          <HelpCircle className="w-4 h-4" />
          FAQs ({faqs.length})
        </button>
        <button
          onClick={() => setActiveTab('videos')}
          className={`flex items-center gap-2 px-4 py-3 font-medium text-sm transition-colors border-b-2 ${
            activeTab === 'videos' ? 'border-[#bb2738] text-[#bb2738]' : 'border-transparent text-slate-600 hover:text-slate-800'
          }`}
        >
          <Video className="w-4 h-4" />
          Videos ({videos.length})
        </button>
        <button
          onClick={() => setActiveTab('support')}
          className={`flex items-center gap-2 px-4 py-3 font-medium text-sm transition-colors border-b-2 ${
            activeTab === 'support' ? 'border-[#bb2738] text-[#bb2738]' : 'border-transparent text-slate-600 hover:text-slate-800'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          Contact Support
        </button>
      </div>

      {activeTab === 'articles' && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl border border-slate-200 p-4">
              <h3 className="font-semibold text-slate-800 mb-3">Categories</h3>
              <div className="space-y-2">
                <button
                  onClick={() => setSelectedCategory('all')}
                  className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${selectedCategory === 'all' ? 'bg-[#bb2738] text-white' : 'hover:bg-slate-100 text-slate-700'}`}
                >
                  All Articles
                </button>
                {categories.map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${selectedCategory === cat.id ? 'bg-[#bb2738] text-white' : 'hover:bg-slate-100 text-slate-700'}`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="lg:col-span-3 space-y-4">
            {filteredArticles.map(article => (
              <div
                key={article.id}
                onClick={() => handleArticleClick(article)}
                className="bg-white rounded-xl border border-slate-200 p-5 hover:shadow-md transition-shadow cursor-pointer"
              >
                <h3 className="text-lg font-semibold text-slate-800 mb-2">{article.title}</h3>
                {article.summary && <p className="text-sm text-slate-600 mb-3">{article.summary}</p>}
                <div className="flex items-center gap-4 text-xs text-slate-500">
                  {article.category && <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded">{article.category.name}</span>}
                  <span>{article.views_count} views</span>
                  <span className="flex items-center gap-1">
                    <ThumbsUp className="w-3 h-3" /> {article.helpful_count}
                  </span>
                </div>
              </div>
            ))}
            {filteredArticles.length === 0 && (
              <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
                <BookOpen className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-slate-800 mb-2">No Articles Found</h3>
                <p className="text-slate-600">Try a different search or category</p>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'faqs' && (
        <div className="space-y-3">
          {filteredFaqs.map(faq => {
            const isExpanded = expandedFaqs.has(faq.id);
            return (
              <div key={faq.id} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <button
                  onClick={() => toggleFaqExpanded(faq.id)}
                  className="w-full flex items-center justify-between p-5 hover:bg-slate-50 transition-colors text-left"
                >
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-slate-800">{faq.question}</h3>
                    <div className="flex items-center gap-3 mt-2 text-xs text-slate-500">
                      <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded">{faq.category}</span>
                      <span>{faq.views_count} views</span>
                    </div>
                  </div>
                  {isExpanded ? <ChevronUp className="w-5 h-5 text-slate-500" /> : <ChevronDown className="w-5 h-5 text-slate-500" />}
                </button>
                {isExpanded && (
                  <div className="px-5 pb-5 border-t border-slate-100">
                    <p className="text-slate-700 whitespace-pre-wrap mt-4">{faq.answer}</p>
                  </div>
                )}
              </div>
            );
          })}
          {filteredFaqs.length === 0 && (
            <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
              <HelpCircle className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-slate-800 mb-2">No FAQs Found</h3>
              <p className="text-slate-600">Try a different search</p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'videos' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredVideos.map(video => (
            <div key={video.id} className="bg-white rounded-xl border border-slate-200 overflow-hidden hover:shadow-lg transition-shadow">
              <div className="relative h-48 bg-slate-100">
                {video.thumbnail_url ? (
                  <img src={video.thumbnail_url} alt={video.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Video className="w-16 h-16 text-slate-300" />
                  </div>
                )}
                <button
                  onClick={() => handleVideoClick(video)}
                  className="absolute inset-0 flex items-center justify-center bg-black/30 hover:bg-black/50 transition-colors"
                >
                  <Play className="w-16 h-16 text-white" />
                </button>
              </div>
              <div className="p-4">
                <h3 className="text-lg font-semibold text-slate-800 mb-2">{video.title}</h3>
                <p className="text-sm text-slate-600 mb-3 line-clamp-2">{video.description}</p>
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded">{video.category}</span>
                  <span>{video.views_count} views</span>
                </div>
              </div>
            </div>
          ))}
          {filteredVideos.length === 0 && (
            <div className="col-span-full bg-white rounded-xl border border-slate-200 p-12 text-center">
              <Video className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-slate-800 mb-2">No Videos Found</h3>
              <p className="text-slate-600">Try a different search</p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'support' && (
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h2 className="text-2xl font-bold text-slate-800 mb-2">Contact Support</h2>
            <p className="text-slate-600 mb-6">Can't find what you're looking for? Submit a support ticket and we'll help you out.</p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Category</label>
                <select
                  value={supportTicket.category}
                  onChange={(e) => setSupportTicket({ ...supportTicket, category: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#bb2738] focus:border-transparent outline-none"
                >
                  <option value="General">General</option>
                  <option value="Technical">Technical</option>
                  <option value="Billing">Billing</option>
                  <option value="Product">Product</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Subject *</label>
                <input
                  type="text"
                  value={supportTicket.subject}
                  onChange={(e) => setSupportTicket({ ...supportTicket, subject: e.target.value })}
                  placeholder="Brief description of your issue"
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#bb2738] focus:border-transparent outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Description *</label>
                <textarea
                  value={supportTicket.description}
                  onChange={(e) => setSupportTicket({ ...supportTicket, description: e.target.value })}
                  placeholder="Please provide details about your issue..."
                  rows={6}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#bb2738] focus:border-transparent outline-none"
                />
              </div>

              <button
                onClick={submitSupportTicket}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-[#bb2738] text-white rounded-lg hover:bg-[#a01f2f] transition-colors"
              >
                <MessageSquare className="w-5 h-5" />
                Submit Support Ticket
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
