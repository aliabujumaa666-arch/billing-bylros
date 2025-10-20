import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { BookOpen, Plus, CreditCard as Edit2, Trash2, Eye, EyeOff, Save, X, Search } from 'lucide-react';

export function KnowledgeBase() {
  const [categories, setCategories] = useState<any[]>([]);
  const [articles, setArticles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingArticle, setEditingArticle] = useState<any>(null);
  const [editingCategory, setEditingCategory] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const [categoriesRes, articlesRes] = await Promise.all([
      supabase.from('knowledge_base_categories').select('*').order('order_index'),
      supabase.from('knowledge_base_articles').select('*, category:knowledge_base_categories(name)').order('created_at', { ascending: false })
    ]);

    if (categoriesRes.data) setCategories(categoriesRes.data);
    if (articlesRes.data) setArticles(articlesRes.data);
    setLoading(false);
  };

  const saveCategory = async () => {
    if (!editingCategory.name) {
      alert('Category name is required');
      return;
    }

    if (editingCategory.id) {
      await supabase.from('knowledge_base_categories').update(editingCategory).eq('id', editingCategory.id);
    } else {
      await supabase.from('knowledge_base_categories').insert([editingCategory]);
    }

    setEditingCategory(null);
    fetchData();
  };

  const deleteCategory = async (id: string) => {
    if (!confirm('Delete this category? All articles in this category will also be deleted.')) return;
    await supabase.from('knowledge_base_categories').delete().eq('id', id);
    fetchData();
  };

  const saveArticle = async () => {
    if (!editingArticle.title || !editingArticle.content) {
      alert('Title and content are required');
      return;
    }

    const slug = editingArticle.slug || editingArticle.title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const articleData = { ...editingArticle, slug };

    if (editingArticle.id) {
      await supabase.from('knowledge_base_articles').update(articleData).eq('id', editingArticle.id);
    } else {
      await supabase.from('knowledge_base_articles').insert([articleData]);
    }

    setEditingArticle(null);
    fetchData();
  };

  const deleteArticle = async (id: string) => {
    if (!confirm('Delete this article?')) return;
    await supabase.from('knowledge_base_articles').delete().eq('id', id);
    fetchData();
  };

  const togglePublish = async (article: any) => {
    await supabase.from('knowledge_base_articles').update({ is_published: !article.is_published }).eq('id', article.id);
    fetchData();
  };

  const filteredArticles = articles.filter(article => {
    const matchesSearch = searchQuery === '' ||
      article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      article.content.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || article.category_id === selectedCategory;
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
          <h1 className="text-3xl font-bold text-slate-800 mb-2">Knowledge Base</h1>
          <p className="text-slate-600">Create and manage help articles and documentation</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setEditingCategory({ name: '', description: '', icon: 'BookOpen', order_index: 0, is_active: true })}
            className="flex items-center gap-2 px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Category
          </button>
          <button
            onClick={() => setEditingArticle({ title: '', slug: '', content: '', summary: '', category_id: categories[0]?.id, tags: [], is_published: false, target_audience: 'both' })}
            className="flex items-center gap-2 px-4 py-2 bg-[#bb2738] text-white rounded-lg hover:bg-[#a01f2f] transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Article
          </button>
        </div>
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
                All Articles ({articles.length})
              </button>
              {categories.map(cat => (
                <div key={cat.id} className="flex items-center gap-2">
                  <button
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`flex-1 text-left px-3 py-2 rounded-lg transition-colors ${selectedCategory === cat.id ? 'bg-[#bb2738] text-white' : 'hover:bg-slate-100 text-slate-700'}`}
                  >
                    {cat.name} ({articles.filter(a => a.category_id === cat.id).length})
                  </button>
                  <button onClick={() => setEditingCategory(cat)} className="p-1 hover:bg-slate-100 rounded">
                    <Edit2 className="w-4 h-4 text-slate-600" />
                  </button>
                  <button onClick={() => deleteCategory(cat.id)} className="p-1 hover:bg-slate-100 rounded">
                    <Trash2 className="w-4 h-4 text-red-600" />
                  </button>
                </div>
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
              placeholder="Search articles..."
              className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#bb2738] focus:border-transparent outline-none"
            />
          </div>

          <div className="space-y-3">
            {filteredArticles.map(article => (
              <div key={article.id} className="bg-white rounded-xl border border-slate-200 p-5 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-lg font-semibold text-slate-800">{article.title}</h3>
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${article.is_published ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'}`}>
                        {article.is_published ? 'Published' : 'Draft'}
                      </span>
                      <span className="px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-700">
                        {article.target_audience}
                      </span>
                    </div>
                    {article.category && (
                      <p className="text-sm text-slate-600">{article.category.name}</p>
                    )}
                    {article.summary && (
                      <p className="text-sm text-slate-600 mt-2">{article.summary}</p>
                    )}
                    <div className="flex items-center gap-4 mt-2 text-xs text-slate-500">
                      <span>{article.views_count} views</span>
                      <span>{article.helpful_count} helpful</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => togglePublish(article)}
                      className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                      title={article.is_published ? 'Unpublish' : 'Publish'}
                    >
                      {article.is_published ? <EyeOff className="w-4 h-4 text-slate-600" /> : <Eye className="w-4 h-4 text-slate-600" />}
                    </button>
                    <button onClick={() => setEditingArticle(article)} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                      <Edit2 className="w-4 h-4 text-slate-600" />
                    </button>
                    <button onClick={() => deleteArticle(article.id)} className="p-2 hover:bg-red-50 rounded-lg transition-colors">
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {filteredArticles.length === 0 && (
              <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
                <BookOpen className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-slate-800 mb-2">No Articles Found</h3>
                <p className="text-slate-600">Create your first knowledge base article</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {editingCategory && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-slate-800">
                {editingCategory.id ? 'Edit Category' : 'Add Category'}
              </h3>
              <button onClick={() => setEditingCategory(null)} className="p-1 hover:bg-slate-100 rounded">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Name</label>
                <input
                  type="text"
                  value={editingCategory.name}
                  onChange={(e) => setEditingCategory({ ...editingCategory, name: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#bb2738] focus:border-transparent outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Description</label>
                <textarea
                  value={editingCategory.description}
                  onChange={(e) => setEditingCategory({ ...editingCategory, description: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#bb2738] focus:border-transparent outline-none"
                />
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={editingCategory.is_active}
                  onChange={(e) => setEditingCategory({ ...editingCategory, is_active: e.target.checked })}
                  className="w-5 h-5 text-[#bb2738] rounded focus:ring-[#bb2738]"
                />
                <label htmlFor="is_active" className="text-sm font-medium text-slate-700">Active</label>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setEditingCategory(null)} className="flex-1 px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors">
                  Cancel
                </button>
                <button onClick={saveCategory} className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-[#bb2738] text-white rounded-lg hover:bg-[#a01f2f] transition-colors">
                  <Save className="w-4 h-4" />
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {editingArticle && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-xl p-6 max-w-4xl w-full my-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-slate-800">
                {editingArticle.id ? 'Edit Article' : 'Add Article'}
              </h3>
              <button onClick={() => setEditingArticle(null)} className="p-1 hover:bg-slate-100 rounded">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Title</label>
                  <input
                    type="text"
                    value={editingArticle.title}
                    onChange={(e) => setEditingArticle({ ...editingArticle, title: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#bb2738] focus:border-transparent outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Category</label>
                  <select
                    value={editingArticle.category_id}
                    onChange={(e) => setEditingArticle({ ...editingArticle, category_id: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#bb2738] focus:border-transparent outline-none"
                  >
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Summary</label>
                <input
                  type="text"
                  value={editingArticle.summary}
                  onChange={(e) => setEditingArticle({ ...editingArticle, summary: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#bb2738] focus:border-transparent outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Content (Markdown supported)</label>
                <textarea
                  value={editingArticle.content}
                  onChange={(e) => setEditingArticle({ ...editingArticle, content: e.target.value })}
                  rows={12}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#bb2738] focus:border-transparent outline-none font-mono text-sm"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Target Audience</label>
                  <select
                    value={editingArticle.target_audience}
                    onChange={(e) => setEditingArticle({ ...editingArticle, target_audience: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#bb2738] focus:border-transparent outline-none"
                  >
                    <option value="both">Both Admin & Customer</option>
                    <option value="admin">Admin Only</option>
                    <option value="customer">Customer Only</option>
                  </select>
                </div>
                <div className="flex items-end">
                  <label className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={editingArticle.is_published}
                      onChange={(e) => setEditingArticle({ ...editingArticle, is_published: e.target.checked })}
                      className="w-5 h-5 text-[#bb2738] rounded focus:ring-[#bb2738]"
                    />
                    <span className="text-sm font-medium text-slate-700">Published</span>
                  </label>
                </div>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setEditingArticle(null)} className="flex-1 px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors">
                  Cancel
                </button>
                <button onClick={saveArticle} className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-[#bb2738] text-white rounded-lg hover:bg-[#a01f2f] transition-colors">
                  <Save className="w-4 h-4" />
                  Save Article
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
