import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { HelpCircle, Plus, CreditCard as Edit2, Trash2, Eye, EyeOff, Save, X, Search } from 'lucide-react';

export function FAQManagement() {
  const [faqs, setFaqs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingFaq, setEditingFaq] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  useEffect(() => {
    fetchFaqs();
  }, []);

  const fetchFaqs = async () => {
    const { data } = await supabase
      .from('faqs')
      .select('*')
      .order('order_index');

    if (data) setFaqs(data);
    setLoading(false);
  };

  const saveFaq = async () => {
    if (!editingFaq.question || !editingFaq.answer) {
      alert('Question and answer are required');
      return;
    }

    if (editingFaq.id) {
      await supabase.from('faqs').update(editingFaq).eq('id', editingFaq.id);
    } else {
      await supabase.from('faqs').insert([editingFaq]);
    }

    setEditingFaq(null);
    fetchFaqs();
  };

  const deleteFaq = async (id: string) => {
    if (!confirm('Delete this FAQ?')) return;
    await supabase.from('faqs').delete().eq('id', id);
    fetchFaqs();
  };

  const toggleActive = async (faq: any) => {
    await supabase.from('faqs').update({ is_active: !faq.is_active }).eq('id', faq.id);
    fetchFaqs();
  };

  const categories = [...new Set(faqs.map(f => f.category))];

  const filteredFaqs = faqs.filter(faq => {
    const matchesSearch = searchQuery === '' ||
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || faq.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

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
          <h1 className="text-3xl font-bold text-slate-800 mb-2">FAQ Management</h1>
          <p className="text-slate-600">Manage frequently asked questions for customers and admins</p>
        </div>
        <button
          onClick={() => setEditingFaq({ question: '', answer: '', category: 'General', order_index: 0, target_audience: 'both', is_active: true })}
          className="flex items-center gap-2 px-4 py-2 bg-[#bb2738] text-white rounded-lg hover:bg-[#a01f2f] transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add FAQ
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <h3 className="font-semibold text-slate-800 mb-4">Categories</h3>
            <div className="space-y-2">
              <button
                onClick={() => setSelectedCategory('all')}
                className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${selectedCategory === 'all' ? 'bg-[#bb2738] text-white' : 'hover:bg-slate-100 text-slate-700'}`}
              >
                All FAQs ({faqs.length})
              </button>
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${selectedCategory === cat ? 'bg-[#bb2738] text-white' : 'hover:bg-slate-100 text-slate-700'}`}
                >
                  {cat} ({faqs.filter(f => f.category === cat).length})
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="lg:col-span-3 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search FAQs..."
              className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#bb2738] focus:border-transparent outline-none"
            />
          </div>

          <div className="space-y-3">
            {filteredFaqs.map(faq => (
              <div key={faq.id} className="bg-white rounded-xl border border-slate-200 p-5 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-lg font-semibold text-slate-800">{faq.question}</h3>
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${faq.is_active ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'}`}>
                        {faq.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <p className="text-sm text-slate-600 mb-2">{faq.answer}</p>
                    <div className="flex items-center gap-3 text-xs text-slate-500">
                      <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded">{faq.category}</span>
                      <span className="bg-purple-50 text-purple-700 px-2 py-1 rounded">{faq.target_audience}</span>
                      <span>{faq.views_count} views</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => toggleActive(faq)}
                      className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                      title={faq.is_active ? 'Deactivate' : 'Activate'}
                    >
                      {faq.is_active ? <EyeOff className="w-4 h-4 text-slate-600" /> : <Eye className="w-4 h-4 text-slate-600" />}
                    </button>
                    <button onClick={() => setEditingFaq(faq)} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                      <Edit2 className="w-4 h-4 text-slate-600" />
                    </button>
                    <button onClick={() => deleteFaq(faq.id)} className="p-2 hover:bg-red-50 rounded-lg transition-colors">
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {filteredFaqs.length === 0 && (
              <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
                <HelpCircle className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-slate-800 mb-2">No FAQs Found</h3>
                <p className="text-slate-600">Create your first FAQ</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {editingFaq && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 max-w-2xl w-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-slate-800">
                {editingFaq.id ? 'Edit FAQ' : 'Add FAQ'}
              </h3>
              <button onClick={() => setEditingFaq(null)} className="p-1 hover:bg-slate-100 rounded">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Question</label>
                <input
                  type="text"
                  value={editingFaq.question}
                  onChange={(e) => setEditingFaq({ ...editingFaq, question: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#bb2738] focus:border-transparent outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Answer</label>
                <textarea
                  value={editingFaq.answer}
                  onChange={(e) => setEditingFaq({ ...editingFaq, answer: e.target.value })}
                  rows={6}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#bb2738] focus:border-transparent outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Category</label>
                  <input
                    type="text"
                    value={editingFaq.category}
                    onChange={(e) => setEditingFaq({ ...editingFaq, category: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#bb2738] focus:border-transparent outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Target Audience</label>
                  <select
                    value={editingFaq.target_audience}
                    onChange={(e) => setEditingFaq({ ...editingFaq, target_audience: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#bb2738] focus:border-transparent outline-none"
                  >
                    <option value="both">Both Admin & Customer</option>
                    <option value="admin">Admin Only</option>
                    <option value="customer">Customer Only</option>
                  </select>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={editingFaq.is_active}
                  onChange={(e) => setEditingFaq({ ...editingFaq, is_active: e.target.checked })}
                  className="w-5 h-5 text-[#bb2738] rounded focus:ring-[#bb2738]"
                />
                <label htmlFor="is_active" className="text-sm font-medium text-slate-700">Active</label>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setEditingFaq(null)} className="flex-1 px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors">
                  Cancel
                </button>
                <button onClick={saveFaq} className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-[#bb2738] text-white rounded-lg hover:bg-[#a01f2f] transition-colors">
                  <Save className="w-4 h-4" />
                  Save FAQ
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
