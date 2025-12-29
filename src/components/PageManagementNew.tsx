import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import {
  Plus,
  Search,
  Eye,
  Edit,
  Trash2,
  Copy,
  MoreVertical,
  FileText,
  Filter,
  ChevronDown,
} from 'lucide-react';
import { PageEditor } from './PageEditor';

export function PageManagementNew() {
  const { user } = useAuth();
  const [pages, setPages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [selectedPages, setSelectedPages] = useState<Set<string>>(new Set());
  const [bulkAction, setBulkAction] = useState('');
  const [showEditor, setShowEditor] = useState(false);
  const [editingPageId, setEditingPageId] = useState<string | undefined>();
  const [sortColumn, setSortColumn] = useState<string>('updated_at');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    fetchPages();
  }, [sortColumn, sortDirection]);

  const fetchPages = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('pages')
        .select('*')
        .neq('status', 'trash')
        .order(sortColumn, { ascending: sortDirection === 'asc' });

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching pages:', error);
        throw error;
      }

      console.log('Fetched pages:', data?.length || 0);
      setPages(data || []);
    } catch (error) {
      console.error('Failed to fetch pages:', error);
      alert('Failed to load pages. Please refresh the page.');
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedPages(new Set(filteredPages.map(p => p.id)));
    } else {
      setSelectedPages(new Set());
    }
  };

  const handleSelectPage = (pageId: string, checked: boolean) => {
    const newSelection = new Set(selectedPages);
    if (checked) {
      newSelection.add(pageId);
    } else {
      newSelection.delete(pageId);
    }
    setSelectedPages(newSelection);
  };

  const handleBulkAction = async () => {
    if (!bulkAction || selectedPages.size === 0) return;

    const confirmed = confirm(`Apply ${bulkAction} to ${selectedPages.size} page(s)?`);
    if (!confirmed) return;

    try {
      const updates: any = {};

      switch (bulkAction) {
        case 'publish':
          updates.status = 'published';
          updates.is_published = true;
          break;
        case 'draft':
          updates.status = 'draft';
          updates.is_published = false;
          break;
        case 'trash':
          updates.status = 'trash';
          break;
        case 'delete':
          const { error: deleteError } = await supabase
            .from('pages')
            .delete()
            .in('id', Array.from(selectedPages));
          if (deleteError) throw deleteError;
          fetchPages();
          setSelectedPages(new Set());
          setBulkAction('');
          return;
      }

      if (Object.keys(updates).length > 0) {
        const { error } = await supabase
          .from('pages')
          .update(updates)
          .in('id', Array.from(selectedPages));

        if (error) throw error;
        fetchPages();
        setSelectedPages(new Set());
        setBulkAction('');
      }
    } catch (error) {
      console.error('Error applying bulk action:', error);
      alert('Failed to apply bulk action');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Move this page to trash?')) return;

    try {
      const { error } = await supabase
        .from('pages')
        .update({ status: 'trash' })
        .eq('id', id);

      if (error) throw error;
      fetchPages();
    } catch (error) {
      console.error('Error moving page to trash:', error);
      alert('Failed to move page to trash');
    }
  };

  const ensureUniqueSlug = async (baseSlug: string): Promise<string> => {
    let slug = baseSlug;
    let counter = 1;

    while (true) {
      const { data, error } = await supabase
        .from('pages')
        .select('id')
        .eq('slug', slug);

      if (error) {
        console.error('Error checking slug:', error);
        break;
      }

      if (!data || data.length === 0) {
        break;
      }

      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    return slug;
  };

  const handleDuplicate = async (page: any) => {
    try {
      const { title, slug, content, excerpt, meta_description, meta_keywords, page_type, template, custom_css, custom_js } = page;

      const baseSlug = `${slug}-copy`;
      const uniqueSlug = await ensureUniqueSlug(baseSlug);

      const newPage = {
        title: `${title} (Copy)`,
        slug: uniqueSlug,
        content,
        excerpt,
        meta_description,
        meta_keywords,
        page_type,
        template,
        custom_css,
        custom_js,
        status: 'draft',
        author_id: user?.id,
      };

      const { error } = await supabase
        .from('pages')
        .insert([newPage]);

      if (error) throw error;
      fetchPages();
      alert('Page duplicated successfully!');
    } catch (error) {
      console.error('Error duplicating page:', error);
      alert('Failed to duplicate page');
    }
  };

  const handleTogglePublish = async (page: any) => {
    const newStatus = page.status === 'published' ? 'draft' : 'published';
    try {
      const { error } = await supabase
        .from('pages')
        .update({
          status: newStatus,
          is_published: newStatus === 'published'
        })
        .eq('id', page.id);

      if (error) throw error;
      fetchPages();
    } catch (error) {
      console.error('Error toggling publish status:', error);
      alert('Failed to update page status');
    }
  };

  const filteredPages = pages.filter(page => {
    const matchesSearch = page.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          page.slug.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          page.content?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || page.status === statusFilter;
    const matchesType = typeFilter === 'all' || page.page_type === typeFilter;

    return matchesSearch && matchesStatus && matchesType;
  });

  const getStatusCounts = () => {
    return {
      all: pages.length,
      published: pages.filter(p => p.status === 'published').length,
      draft: pages.filter(p => p.status === 'draft').length,
      scheduled: pages.filter(p => p.status === 'scheduled').length,
      pending: pages.filter(p => p.status === 'pending').length,
    };
  };

  const statusCounts = getStatusCounts();

  const getStatusBadge = (status: string, published: boolean) => {
    const colors = {
      draft: 'bg-slate-200 text-slate-700',
      published: 'bg-green-500 text-white',
      scheduled: 'bg-blue-500 text-white',
      pending: 'bg-orange-500 text-white',
      trash: 'bg-red-500 text-white',
    };

    return (
      <div className="flex items-center gap-2">
        <span className={`w-2 h-2 rounded-full ${colors[status as keyof typeof colors] || colors.draft}`}></span>
        <span className={`w-2 h-2 rounded-full ${published ? 'bg-green-500' : 'bg-slate-300'}`}></span>
      </div>
    );
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '—';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins} minutes ago`;
    if (diffHours < 24) return `${diffHours} hours ago`;
    if (diffDays < 7) return `${diffDays} days ago`;

    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  if (showEditor) {
    return <PageEditor pageId={editingPageId} onBack={() => {
      setShowEditor(false);
      setEditingPageId(undefined);
      fetchPages();
    }} />;
  }

  return (
    <div className="bg-white">
      <div className="px-6 py-4 border-b border-slate-200">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-semibold text-slate-800">
            <FileText className="w-6 h-6 inline mr-2 text-[#bb2738]" />
            Pages
          </h1>
          <button
            onClick={() => {
              setEditingPageId(undefined);
              setShowEditor(true);
            }}
            className="flex items-center gap-2 bg-[#bb2738] hover:bg-[#a01f2f] text-white px-4 py-2 rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Page
          </button>
        </div>

        <div className="flex items-center gap-4 text-sm border-b border-slate-200 -mb-px">
          <button
            onClick={() => setStatusFilter('all')}
            className={`pb-3 px-1 border-b-2 transition-colors ${
              statusFilter === 'all'
                ? 'border-[#bb2738] text-[#bb2738] font-medium'
                : 'border-transparent text-slate-600 hover:text-slate-800'
            }`}
          >
            All <span className="text-slate-400">({statusCounts.all})</span>
          </button>
          <button
            onClick={() => setStatusFilter('published')}
            className={`pb-3 px-1 border-b-2 transition-colors ${
              statusFilter === 'published'
                ? 'border-[#bb2738] text-[#bb2738] font-medium'
                : 'border-transparent text-slate-600 hover:text-slate-800'
            }`}
          >
            Published <span className="text-slate-400">({statusCounts.published})</span>
          </button>
          <button
            onClick={() => setStatusFilter('draft')}
            className={`pb-3 px-1 border-b-2 transition-colors ${
              statusFilter === 'draft'
                ? 'border-[#bb2738] text-[#bb2738] font-medium'
                : 'border-transparent text-slate-600 hover:text-slate-800'
            }`}
          >
            Drafts <span className="text-slate-400">({statusCounts.draft})</span>
          </button>
          {statusCounts.scheduled > 0 && (
            <button
              onClick={() => setStatusFilter('scheduled')}
              className={`pb-3 px-1 border-b-2 transition-colors ${
                statusFilter === 'scheduled'
                  ? 'border-[#bb2738] text-[#bb2738] font-medium'
                  : 'border-transparent text-slate-600 hover:text-slate-800'
              }`}
            >
              Scheduled <span className="text-slate-400">({statusCounts.scheduled})</span>
            </button>
          )}
          {statusCounts.pending > 0 && (
            <button
              onClick={() => setStatusFilter('pending')}
              className={`pb-3 px-1 border-b-2 transition-colors ${
                statusFilter === 'pending'
                  ? 'border-[#bb2738] text-[#bb2738] font-medium'
                  : 'border-transparent text-slate-600 hover:text-slate-800'
              }`}
            >
              Pending <span className="text-slate-400">({statusCounts.pending})</span>
            </button>
          )}
        </div>
      </div>

      <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <select
              value={bulkAction}
              onChange={(e) => setBulkAction(e.target.value)}
              className="px-3 py-1.5 text-sm border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-[#bb2738]"
            >
              <option value="">Bulk actions</option>
              <option value="publish">Publish</option>
              <option value="draft">Move to Draft</option>
              <option value="trash">Move to Trash</option>
              <option value="delete">Delete Permanently</option>
            </select>
            <button
              onClick={handleBulkAction}
              disabled={!bulkAction || selectedPages.size === 0}
              className="px-4 py-1.5 text-sm border border-slate-300 rounded-lg hover:bg-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Apply
            </button>
          </div>

          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="px-3 py-1.5 text-sm border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-[#bb2738]"
          >
            <option value="all">All dates</option>
            <option value="today">Today</option>
            <option value="week">Last 7 days</option>
            <option value="month">Last 30 days</option>
          </select>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-1.5 text-sm border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-[#bb2738]"
          >
            <option value="all">All types</option>
            <option value="standard">Standard</option>
            <option value="landing">Landing</option>
            <option value="legal">Legal</option>
          </select>

          <button className="px-4 py-1.5 text-sm border border-slate-300 rounded-lg hover:bg-white transition-colors">
            <Filter className="w-4 h-4 inline mr-1" />
            Filter
          </button>

          <div className="flex-1"></div>

          <div className="relative flex-shrink-0 w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search pages..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-1.5 text-sm border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-[#bb2738]"
            />
          </div>

          <span className="text-sm text-slate-600">{filteredPages.length} items</span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="w-10 px-4 py-3">
                <input
                  type="checkbox"
                  checked={selectedPages.size === filteredPages.length && filteredPages.length > 0}
                  onChange={(e) => handleSelectAll(e.target.checked)}
                  className="w-4 h-4 text-[#bb2738] border-slate-300 rounded focus:ring-[#bb2738]"
                />
              </th>
              <th
                className="px-4 py-3 text-left text-xs font-semibold text-slate-700 cursor-pointer hover:bg-slate-100"
                onClick={() => handleSort('title')}
              >
                <div className="flex items-center gap-1">
                  Title
                  {sortColumn === 'title' && <ChevronDown className={`w-3 h-3 ${sortDirection === 'desc' ? 'rotate-180' : ''}`} />}
                </div>
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700">Author</th>
              <th
                className="px-4 py-3 text-left text-xs font-semibold text-slate-700 cursor-pointer hover:bg-slate-100"
                onClick={() => handleSort('updated_at')}
              >
                <div className="flex items-center gap-1">
                  Date
                  {sortColumn === 'updated_at' && <ChevronDown className={`w-3 h-3 ${sortDirection === 'desc' ? 'rotate-180' : ''}`} />}
                </div>
              </th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-slate-700">Status</th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-slate-700">Revisions</th>
              <th className="w-10 px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {loading ? (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                  Loading pages...
                </td>
              </tr>
            ) : filteredPages.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center">
                  <FileText className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                  <p className="text-slate-500 text-lg font-medium mb-2">No pages found</p>
                  <p className="text-slate-400 text-sm mb-4">Get started by creating your first page</p>
                  <button
                    onClick={() => {
                      setEditingPageId(undefined);
                      setShowEditor(true);
                    }}
                    className="inline-flex items-center gap-2 bg-[#bb2738] hover:bg-[#a01f2f] text-white px-4 py-2 rounded-lg transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Add New Page
                  </button>
                </td>
              </tr>
            ) : (
              filteredPages.map((page) => (
                <tr key={page.id} className="hover:bg-slate-50 transition-colors group">
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selectedPages.has(page.id)}
                      onChange={(e) => handleSelectPage(page.id, e.target.checked)}
                      className="w-4 h-4 text-[#bb2738] border-slate-300 rounded focus:ring-[#bb2738]"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col">
                      <button
                        onClick={() => {
                          setEditingPageId(page.id);
                          setShowEditor(true);
                        }}
                        className="font-medium text-slate-800 hover:text-[#bb2738] text-left transition-colors"
                      >
                        {page.title}
                      </button>
                      <div className="flex items-center gap-2 mt-1 text-xs">
                        <span className="text-slate-400">/page/{page.slug}</span>
                        <span className="text-slate-300">—</span>
                        <span className="text-slate-500 capitalize">{page.page_type}</span>
                        {page.template !== 'default' && (
                          <>
                            <span className="text-slate-300">—</span>
                            <span className="text-slate-500 capitalize">{page.template}</span>
                          </>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => {
                            setEditingPageId(page.id);
                            setShowEditor(true);
                          }}
                          className="text-[#bb2738] hover:underline text-xs"
                        >
                          Edit
                        </button>
                        <span className="text-slate-300">|</span>
                        <button
                          onClick={() => handleTogglePublish(page)}
                          className="text-[#bb2738] hover:underline text-xs"
                        >
                          {page.status === 'published' ? 'Unpublish' : 'Publish'}
                        </button>
                        <span className="text-slate-300">|</span>
                        <button
                          onClick={() => handleDelete(page.id)}
                          className="text-red-600 hover:underline text-xs"
                        >
                          Trash
                        </button>
                        {page.status === 'published' && (
                          <>
                            <span className="text-slate-300">|</span>
                            <a
                              href={`/page/${page.slug}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[#bb2738] hover:underline text-xs"
                            >
                              View
                            </a>
                          </>
                        )}
                        <span className="text-slate-300">|</span>
                        <button
                          onClick={() => handleDuplicate(page)}
                          className="text-[#bb2738] hover:underline text-xs"
                        >
                          Duplicate
                        </button>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-sm text-slate-600">
                      Admin
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-sm">
                      <div className="text-slate-700 font-medium">
                        {page.status === 'published' ? 'Published' : 'Last Modified'}
                      </div>
                      <div className="text-slate-500 text-xs">
                        {formatDate(page.updated_at)}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-2">
                      {getStatusBadge(page.status, page.is_published)}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="text-sm text-slate-600">{page.revision_count || 0}</span>
                  </td>
                  <td className="px-4 py-3">
                    <button className="p-1 hover:bg-slate-100 rounded transition-colors">
                      <MoreVertical className="w-4 h-4 text-slate-400" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
