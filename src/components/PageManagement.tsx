import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Plus, Search, Eye, Edit, Trash2, X, FileText, Globe, Layout } from 'lucide-react';

export function PageManagement() {
  const { user } = useAuth();
  const [pages, setPages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingPage, setEditingPage] = useState<any>(null);
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    content: '',
    meta_description: '',
    meta_keywords: '',
    is_published: false,
    show_in_header: false,
    show_in_footer: true,
    sort_order: 0,
    page_type: 'standard',
  });

  useEffect(() => {
    fetchPages();
  }, []);

  const fetchPages = async () => {
    try {
      const { data, error } = await supabase
        .from('pages')
        .select('*')
        .order('sort_order', { ascending: true });

      if (error) throw error;
      setPages(data || []);
    } catch (error) {
      console.error('Error fetching pages:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const pageData = {
        ...formData,
        slug: formData.slug || generateSlug(formData.title),
        author_id: user?.id,
      };

      if (editingPage) {
        const { error } = await supabase
          .from('pages')
          .update(pageData)
          .eq('id', editingPage.id);

        if (error) throw error;
        alert('Page updated successfully!');
      } else {
        const { error } = await supabase
          .from('pages')
          .insert([pageData]);

        if (error) throw error;
        alert('Page created successfully!');
      }

      setShowModal(false);
      setEditingPage(null);
      resetForm();
      fetchPages();
    } catch (error: any) {
      console.error('Error saving page:', error);
      alert('Failed to save page: ' + (error.message || 'Unknown error'));
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this page?')) return;

    try {
      const { error } = await supabase
        .from('pages')
        .delete()
        .eq('id', id);

      if (error) throw error;
      alert('Page deleted successfully!');
      fetchPages();
    } catch (error) {
      console.error('Error deleting page:', error);
      alert('Failed to delete page');
    }
  };

  const handleTogglePublish = async (page: any) => {
    try {
      const { error } = await supabase
        .from('pages')
        .update({ is_published: !page.is_published })
        .eq('id', page.id);

      if (error) throw error;
      fetchPages();
    } catch (error) {
      console.error('Error toggling publish status:', error);
      alert('Failed to update page status');
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      slug: '',
      content: '',
      meta_description: '',
      meta_keywords: '',
      is_published: false,
      show_in_header: false,
      show_in_footer: true,
      sort_order: 0,
      page_type: 'standard',
    });
  };

  const openEditModal = (page: any) => {
    setEditingPage(page);
    setFormData({
      title: page.title,
      slug: page.slug,
      content: page.content,
      meta_description: page.meta_description || '',
      meta_keywords: page.meta_keywords || '',
      is_published: page.is_published,
      show_in_header: page.show_in_header,
      show_in_footer: page.show_in_footer,
      sort_order: page.sort_order,
      page_type: page.page_type,
    });
    setShowModal(true);
  };

  const filteredPages = pages.filter(page =>
    page.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    page.slug.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getPageTypeColor = (type: string) => {
    const colors = {
      standard: 'bg-blue-100 text-blue-800',
      landing: 'bg-purple-100 text-purple-800',
      legal: 'bg-slate-100 text-slate-800',
    };
    return colors[type as keyof typeof colors] || 'bg-slate-100 text-slate-800';
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-slate-800">Page Management</h1>
        <button
          onClick={() => {
            resetForm();
            setEditingPage(null);
            setShowModal(true);
          }}
          className="flex items-center gap-2 bg-[#bb2738] hover:bg-[#a01f2f] text-white px-4 py-2.5 rounded-lg transition-colors"
        >
          <Plus className="w-5 h-5" />
          Create Page
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-200">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search pages by title or slug..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-[#bb2738]"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Title</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Slug</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Type</th>
                <th className="px-6 py-3 text-center text-xs font-semibold text-slate-600 uppercase">Status</th>
                <th className="px-6 py-3 text-center text-xs font-semibold text-slate-600 uppercase">Navigation</th>
                <th className="px-6 py-3 text-center text-xs font-semibold text-slate-600 uppercase">Order</th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-slate-600 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {loading ? (
                <tr><td colSpan={7} className="px-6 py-8 text-center text-slate-500">Loading...</td></tr>
              ) : filteredPages.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <FileText className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                    <p className="text-slate-500">No pages found</p>
                  </td>
                </tr>
              ) : (
                filteredPages.map((page) => (
                  <tr key={page.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-slate-800">{page.title}</td>
                    <td className="px-6 py-4 text-slate-600 font-mono text-sm">{page.slug}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${getPageTypeColor(page.page_type)}`}>
                        {page.page_type}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => handleTogglePublish(page)}
                        className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                          page.is_published
                            ? 'bg-green-100 text-green-800 hover:bg-green-200'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {page.is_published ? 'Published' : 'Draft'}
                      </button>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        {page.show_in_header && (
                          <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">Header</span>
                        )}
                        {page.show_in_footer && (
                          <span className="px-2 py-1 bg-slate-100 text-slate-700 rounded text-xs">Footer</span>
                        )}
                        {!page.show_in_header && !page.show_in_footer && (
                          <span className="text-slate-400 text-xs">None</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center text-slate-600">{page.sort_order}</td>
                    <td className="px-6 py-4 text-right space-x-2">
                      {page.is_published && (
                        <a
                          href={`/page/${page.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 px-3 py-1.5 text-sm text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                          <Eye className="w-4 h-4" />
                          View
                        </a>
                      )}
                      <button
                        onClick={() => openEditModal(page)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-sm text-green-700 hover:bg-green-50 rounded-lg transition-colors"
                      >
                        <Edit className="w-4 h-4" />
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(page.id)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-sm text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b border-slate-200">
              <h2 className="text-xl font-bold text-slate-800">
                {editingPage ? 'Edit' : 'Create'} Page
              </h2>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-slate-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-2">Page Title *</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => {
                      setFormData({ ...formData, title: e.target.value });
                      if (!editingPage) {
                        setFormData(prev => ({ ...prev, slug: generateSlug(e.target.value) }));
                      }
                    }}
                    required
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-[#bb2738]"
                    placeholder="About Us"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-2">URL Slug *</label>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500">/page/</span>
                    <input
                      type="text"
                      value={formData.slug}
                      onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                      required
                      className="flex-1 px-4 py-2.5 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-[#bb2738]"
                      placeholder="about-us"
                    />
                  </div>
                  <p className="text-xs text-slate-500 mt-1">URL-friendly version of the title</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Page Type</label>
                  <select
                    value={formData.page_type}
                    onChange={(e) => setFormData({ ...formData, page_type: e.target.value })}
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-[#bb2738]"
                  >
                    <option value="standard">Standard</option>
                    <option value="landing">Landing Page</option>
                    <option value="legal">Legal Document</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Sort Order</label>
                  <input
                    type="number"
                    value={formData.sort_order}
                    onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) || 0 })}
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-[#bb2738]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Content *</label>
                <textarea
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  required
                  rows={12}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-[#bb2738] font-mono text-sm"
                  placeholder="Enter HTML content or plain text..."
                />
                <p className="text-xs text-slate-500 mt-1">Supports HTML formatting</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Meta Description</label>
                <textarea
                  value={formData.meta_description}
                  onChange={(e) => setFormData({ ...formData, meta_description: e.target.value })}
                  rows={2}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-[#bb2738]"
                  placeholder="Brief description for search engines"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Meta Keywords</label>
                <input
                  type="text"
                  value={formData.meta_keywords}
                  onChange={(e) => setFormData({ ...formData, meta_keywords: e.target.value })}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-[#bb2738]"
                  placeholder="keyword1, keyword2, keyword3"
                />
              </div>

              <div className="border-t border-slate-200 pt-4">
                <p className="text-sm font-medium text-slate-700 mb-3">Visibility Settings</p>
                <div className="space-y-3">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.is_published}
                      onChange={(e) => setFormData({ ...formData, is_published: e.target.checked })}
                      className="w-4 h-4 text-[#bb2738] border-slate-300 rounded focus:ring-[#bb2738]"
                    />
                    <div>
                      <span className="text-sm font-medium text-slate-700">Publish Page</span>
                      <p className="text-xs text-slate-500">Make this page visible to the public</p>
                    </div>
                  </label>

                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.show_in_header}
                      onChange={(e) => setFormData({ ...formData, show_in_header: e.target.checked })}
                      className="w-4 h-4 text-[#bb2738] border-slate-300 rounded focus:ring-[#bb2738]"
                    />
                    <div>
                      <span className="text-sm font-medium text-slate-700">Show in Header Navigation</span>
                      <p className="text-xs text-slate-500">Display link in the top navigation menu</p>
                    </div>
                  </label>

                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.show_in_footer}
                      onChange={(e) => setFormData({ ...formData, show_in_footer: e.target.checked })}
                      className="w-4 h-4 text-[#bb2738] border-slate-300 rounded focus:ring-[#bb2738]"
                    />
                    <div>
                      <span className="text-sm font-medium text-slate-700">Show in Footer Navigation</span>
                      <p className="text-xs text-slate-500">Display link in the footer menu</p>
                    </div>
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-6 py-2.5 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-[#bb2738] hover:bg-[#a01f2f] text-white rounded-lg transition-colors"
                >
                  {editingPage ? 'Update' : 'Create'} Page
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
