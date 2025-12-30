import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import {
  ArrowLeft,
  Save,
  Eye,
  Settings,
  Image as ImageIcon,
  Calendar,
  Lock,
  Code,
  FileText,
  Clock,
  Trash2,
  RotateCcw,
  ChevronDown,
  ChevronUp,
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  Link as LinkIcon,
  Quote,
  Heading1,
  Heading2,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Undo,
  Redo,
} from 'lucide-react';

interface PageEditorProps {
  pageId?: string;
  onBack: () => void;
}

export function PageEditor({ pageId, onBack }: PageEditorProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(!!pageId);
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isVisualMode, setIsVisualMode] = useState(true);
  const [slugStatus, setSlugStatus] = useState<'checking' | 'available' | 'taken' | null>(null);

  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    content: '',
    draft_content: '',
    excerpt: '',
    meta_description: '',
    meta_keywords: '',
    featured_image_url: '',
    status: 'draft',
    visibility: 'public',
    password: '',
    template: 'default',
    parent_id: null as string | null,
    sort_order: 0,
    page_type: 'standard',
    show_in_header: false,
    show_in_footer: true,
    allow_comments: false,
    custom_css: '',
    custom_js: '',
    scheduled_at: '',
  });

  const [expandedPanels, setExpandedPanels] = useState({
    publish: true,
    pageAttributes: true,
    featuredImage: false,
    seo: false,
    visibility: false,
    navigation: false,
    discussion: false,
    pageOptions: false,
  });

  const autoSaveTimeout = useRef<NodeJS.Timeout>();
  const slugCheckTimeout = useRef<NodeJS.Timeout>();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (pageId) {
      fetchPage();
    }
  }, [pageId]);

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  const fetchPage = async () => {
    if (!pageId) return;

    try {
      const { data, error } = await supabase
        .from('pages')
        .select('*')
        .eq('id', pageId)
        .maybeSingle();

      if (error) throw error;

      if (!data) {
        alert('Page not found');
        onBack();
        return;
      }

      setFormData({
        title: data.title || '',
        slug: data.slug || '',
        content: data.content || '',
        draft_content: data.draft_content || '',
        excerpt: data.excerpt || '',
        meta_description: data.meta_description || '',
        meta_keywords: data.meta_keywords || '',
        featured_image_url: data.featured_image_url || '',
        status: data.status || 'draft',
        visibility: data.visibility || 'public',
        password: data.password || '',
        template: data.template || 'default',
        parent_id: data.parent_id,
        sort_order: data.sort_order || 0,
        page_type: data.page_type || 'standard',
        show_in_header: data.show_in_header || false,
        show_in_footer: data.show_in_footer || true,
        allow_comments: data.allow_comments || false,
        custom_css: data.custom_css || '',
        custom_js: data.custom_js || '',
        scheduled_at: data.scheduled_at || '',
      });
    } catch (error) {
      console.error('Error fetching page:', error);
      alert('Failed to load page');
      onBack();
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

  const checkSlugExists = async (slug: string): Promise<boolean> => {
    try {
      const query = supabase
        .from('pages')
        .select('id')
        .eq('slug', slug);

      if (pageId) {
        query.neq('id', pageId);
      }

      const { data, error } = await query;
      if (error) throw error;

      return (data?.length || 0) > 0;
    } catch (error) {
      console.error('Error checking slug:', error);
      return false;
    }
  };

  const ensureUniqueSlug = async (baseSlug: string): Promise<string> => {
    let slug = baseSlug;
    let counter = 1;

    while (await checkSlugExists(slug)) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    return slug;
  };

  const handleTitleChange = (title: string) => {
    setFormData(prev => ({
      ...prev,
      title,
      slug: pageId ? prev.slug : generateSlug(title),
    }));
    setHasUnsavedChanges(true);
    scheduleAutoSave();
  };

  const handleFieldChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setHasUnsavedChanges(true);

    if (field === 'slug') {
      if (slugCheckTimeout.current) {
        clearTimeout(slugCheckTimeout.current);
      }
      setSlugStatus('checking');
      slugCheckTimeout.current = setTimeout(async () => {
        const exists = await checkSlugExists(value);
        setSlugStatus(exists ? 'taken' : 'available');
      }, 500);
    }

    scheduleAutoSave();
  };

  const scheduleAutoSave = () => {
    if (autoSaveTimeout.current) {
      clearTimeout(autoSaveTimeout.current);
    }
    autoSaveTimeout.current = setTimeout(() => {
      handleSave(true);
    }, 3000);
  };

  const handleSave = async (isAutoSave = false) => {
    if (!formData.title.trim()) {
      if (!isAutoSave) alert('Please enter a page title');
      return;
    }

    const baseSlug = formData.slug || generateSlug(formData.title);
    if (!baseSlug.trim()) {
      if (!isAutoSave) alert('Please enter a valid page title that can be converted to a URL slug');
      return;
    }

    if (slugStatus === 'taken' && !isAutoSave) {
      alert('The slug is already in use. Please choose a different one.');
      return;
    }

    setSaving(true);

    try {
      const uniqueSlug = pageId ? baseSlug : await ensureUniqueSlug(baseSlug);

      if (uniqueSlug !== baseSlug && !pageId) {
        setFormData(prev => ({ ...prev, slug: uniqueSlug }));
        setSlugStatus('available');
      }

      const pageData = {
        ...formData,
        slug: uniqueSlug,
        author_id: pageId ? undefined : user?.id,
        last_modified_by: user?.id,
        scheduled_at: formData.scheduled_at || null,
        is_published: formData.status === 'published',
      };

      if (pageId) {
        const { error } = await supabase
          .from('pages')
          .update(pageData)
          .eq('id', pageId);

        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from('pages')
          .insert([pageData])
          .select()
          .single();

        if (error) throw error;
        if (!isAutoSave) {
          onBack();
          return;
        }
      }

      setLastSaved(new Date());
      setHasUnsavedChanges(false);
      if (!isAutoSave) {
        alert('Page saved successfully!');
      }
    } catch (error: any) {
      console.error('Error saving page:', error);
      if (!isAutoSave) {
        alert('Failed to save page: ' + (error.message || 'Unknown error'));
      }
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async () => {
    const newStatus = formData.status === 'published' ? 'draft' : 'published';

    try {
      setSaving(true);

      if (!pageId) {
        alert('Please save the page first before publishing.');
        return;
      }

      const { error } = await supabase
        .from('pages')
        .update({
          status: newStatus,
          is_published: newStatus === 'published',
          last_modified_by: user?.id,
        })
        .eq('id', pageId);

      if (error) throw error;

      setFormData(prev => ({ ...prev, status: newStatus }));
      setHasUnsavedChanges(false);
      alert(`Page ${newStatus === 'published' ? 'published' : 'unpublished'} successfully!`);
    } catch (error: any) {
      console.error('Error updating page status:', error);
      alert('Failed to update page status: ' + (error.message || 'Unknown error'));
    } finally {
      setSaving(false);
    }
  };

  const handleTrash = async () => {
    if (!confirm('Move this page to trash?')) return;

    try {
      setSaving(true);

      if (!pageId) {
        setFormData(prev => ({ ...prev, status: 'trash' }));
        onBack();
        return;
      }

      const { error } = await supabase
        .from('pages')
        .update({
          status: 'trash',
          last_modified_by: user?.id,
        })
        .eq('id', pageId);

      if (error) throw error;

      setHasUnsavedChanges(false);
      onBack();
    } catch (error: any) {
      console.error('Error moving page to trash:', error);
      alert('Failed to move page to trash: ' + (error.message || 'Unknown error'));
    } finally {
      setSaving(false);
    }
  };

  const insertFormatting = (before: string, after: string = '', placeholder: string = '') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = formData.content.substring(start, end);
    const textToInsert = selectedText || placeholder;
    const newText = formData.content.substring(0, start) + before + textToInsert + after + formData.content.substring(end);

    handleFieldChange('content', newText);

    setTimeout(() => {
      textarea.focus();
      const newCursorPos = start + before.length + textToInsert.length;
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };

  const formatBold = () => insertFormatting('<strong>', '</strong>', 'bold text');
  const formatItalic = () => insertFormatting('<em>', '</em>', 'italic text');
  const formatUnderline = () => insertFormatting('<u>', '</u>', 'underlined text');
  const formatH1 = () => insertFormatting('<h1>', '</h1>', 'Heading 1');
  const formatH2 = () => insertFormatting('<h2>', '</h2>', 'Heading 2');
  const formatUL = () => insertFormatting('<ul>\n  <li>', '</li>\n</ul>', 'List item');
  const formatOL = () => insertFormatting('<ol>\n  <li>', '</li>\n</ol>', 'List item');
  const formatQuote = () => insertFormatting('<blockquote>', '</blockquote>', 'Quote text');

  const formatLink = () => {
    const url = prompt('Enter URL:');
    if (url) {
      insertFormatting(`<a href="${url}">`, '</a>', 'link text');
    }
  };

  const formatImage = () => {
    const url = prompt('Enter image URL:');
    if (url) {
      const alt = prompt('Enter image description (alt text):') || '';
      insertFormatting(`<img src="${url}" alt="${alt}" />`, '');
    }
  };

  const formatAlignLeft = () => insertFormatting('<div style="text-align: left;">', '</div>', 'Left aligned text');
  const formatAlignCenter = () => insertFormatting('<div style="text-align: center;">', '</div>', 'Centered text');
  const formatAlignRight = () => insertFormatting('<div style="text-align: right;">', '</div>', 'Right aligned text');

  const togglePanel = (panel: keyof typeof expandedPanels) => {
    setExpandedPanels(prev => ({ ...prev, [panel]: !prev[panel] }));
  };

  const wordCount = formData.content.trim().split(/\s+/).filter(Boolean).length;

  const Panel = ({ title, name, children }: { title: string; name: keyof typeof expandedPanels; children: React.ReactNode }) => (
    <div className="border border-slate-200 rounded-lg mb-3 bg-white">
      <button
        type="button"
        onClick={() => togglePanel(name)}
        className="w-full flex items-center justify-between p-3 hover:bg-slate-50 transition-colors"
      >
        <span className="font-medium text-slate-800 text-sm">{title}</span>
        {expandedPanels[name] ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </button>
      {expandedPanels[name] && <div className="p-3 border-t border-slate-200">{children}</div>}
    </div>
  );

  const getStatusBadgeColor = (status: string) => {
    const colors = {
      draft: 'bg-slate-100 text-slate-700',
      published: 'bg-green-100 text-green-700',
      scheduled: 'bg-blue-100 text-blue-700',
      pending: 'bg-orange-100 text-orange-700',
      trash: 'bg-red-100 text-red-700',
    };
    return colors[status as keyof typeof colors] || colors.draft;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#bb2738] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600">Loading page...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-full px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => {
                  if (hasUnsavedChanges && !confirm('You have unsaved changes. Leave anyway?')) return;
                  onBack();
                }}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-xl font-semibold text-slate-800">
                  {pageId ? 'Edit Page' : 'Add New Page'}
                </h1>
                <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                  {lastSaved && (
                    <span>Last saved: {lastSaved.toLocaleTimeString()}</span>
                  )}
                  {saving && <span className="text-[#bb2738]">Saving...</span>}
                  {hasUnsavedChanges && !saving && <span className="text-orange-600">Unsaved changes</span>}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {pageId && formData.status === 'published' && (
                <a
                  href={`/page/${formData.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2 text-slate-700 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  <Eye className="w-4 h-4" />
                  Preview
                </a>
              )}
              <button
                onClick={() => handleSave(false)}
                disabled={saving || !hasUnsavedChanges}
                className="flex items-center gap-2 px-4 py-2 text-slate-700 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save className="w-4 h-4" />
                Save Draft
              </button>
              <button
                onClick={handlePublish}
                disabled={saving}
                className="flex items-center gap-2 px-4 py-2 bg-[#bb2738] hover:bg-[#a01f2f] text-white rounded-lg transition-colors disabled:opacity-50"
              >
                {formData.status === 'published' ? 'Unpublish' : 'Publish'}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex max-w-full">
        <div className="flex-1 p-6">
          <div className="max-w-4xl mx-auto">
            <input
              type="text"
              value={formData.title}
              onChange={(e) => handleTitleChange(e.target.value)}
              placeholder="Add title"
              className="w-full text-4xl font-bold border-none outline-none mb-2 placeholder-slate-300 px-0"
            />

            <div className="flex items-center gap-2 text-sm text-slate-500 mb-4">
              <span>Permalink:</span>
              <span className="text-slate-700">/page/</span>
              <input
                type="text"
                value={formData.slug}
                onChange={(e) => handleFieldChange('slug', e.target.value)}
                placeholder="your-page-slug"
                className="border border-slate-200 rounded px-2 py-1 text-slate-700 outline-none focus:ring-2 focus:ring-[#bb2738] focus:border-transparent"
              />
              {slugStatus === 'checking' && (
                <span className="text-blue-600 text-xs">Checking...</span>
              )}
              {slugStatus === 'available' && (
                <span className="text-green-600 text-xs">✓ Available</span>
              )}
              {slugStatus === 'taken' && (
                <span className="text-red-600 text-xs">✗ Already exists</span>
              )}
            </div>

            <div className="mb-4 flex gap-2 border-b border-slate-200">
              <button
                onClick={() => setIsVisualMode(true)}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                  isVisualMode
                    ? 'border-[#bb2738] text-[#bb2738]'
                    : 'border-transparent text-slate-600 hover:text-slate-800'
                }`}
              >
                <FileText className="w-4 h-4 inline mr-2" />
                Visual
              </button>
              <button
                onClick={() => setIsVisualMode(false)}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                  !isVisualMode
                    ? 'border-[#bb2738] text-[#bb2738]'
                    : 'border-transparent text-slate-600 hover:text-slate-800'
                }`}
              >
                <Code className="w-4 h-4 inline mr-2" />
                Code
              </button>
            </div>

            <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
              {isVisualMode && (
                <div className="flex items-center gap-1 p-2 border-b border-slate-200 bg-slate-50 flex-wrap">
                  <button
                    type="button"
                    onClick={formatBold}
                    className="p-2 hover:bg-white rounded transition-colors border border-transparent hover:border-slate-300"
                    title="Bold (Ctrl+B)"
                  >
                    <Bold className="w-4 h-4 text-slate-700" />
                  </button>
                  <button
                    type="button"
                    onClick={formatItalic}
                    className="p-2 hover:bg-white rounded transition-colors border border-transparent hover:border-slate-300"
                    title="Italic (Ctrl+I)"
                  >
                    <Italic className="w-4 h-4 text-slate-700" />
                  </button>
                  <button
                    type="button"
                    onClick={formatUnderline}
                    className="p-2 hover:bg-white rounded transition-colors border border-transparent hover:border-slate-300"
                    title="Underline (Ctrl+U)"
                  >
                    <Underline className="w-4 h-4 text-slate-700" />
                  </button>

                  <div className="w-px h-6 bg-slate-300 mx-1"></div>

                  <button
                    type="button"
                    onClick={formatH1}
                    className="p-2 hover:bg-white rounded transition-colors border border-transparent hover:border-slate-300"
                    title="Heading 1"
                  >
                    <Heading1 className="w-4 h-4 text-slate-700" />
                  </button>
                  <button
                    type="button"
                    onClick={formatH2}
                    className="p-2 hover:bg-white rounded transition-colors border border-transparent hover:border-slate-300"
                    title="Heading 2"
                  >
                    <Heading2 className="w-4 h-4 text-slate-700" />
                  </button>

                  <div className="w-px h-6 bg-slate-300 mx-1"></div>

                  <button
                    type="button"
                    onClick={formatUL}
                    className="p-2 hover:bg-white rounded transition-colors border border-transparent hover:border-slate-300"
                    title="Bullet List"
                  >
                    <List className="w-4 h-4 text-slate-700" />
                  </button>
                  <button
                    type="button"
                    onClick={formatOL}
                    className="p-2 hover:bg-white rounded transition-colors border border-transparent hover:border-slate-300"
                    title="Numbered List"
                  >
                    <ListOrdered className="w-4 h-4 text-slate-700" />
                  </button>
                  <button
                    type="button"
                    onClick={formatQuote}
                    className="p-2 hover:bg-white rounded transition-colors border border-transparent hover:border-slate-300"
                    title="Blockquote"
                  >
                    <Quote className="w-4 h-4 text-slate-700" />
                  </button>

                  <div className="w-px h-6 bg-slate-300 mx-1"></div>

                  <button
                    type="button"
                    onClick={formatAlignLeft}
                    className="p-2 hover:bg-white rounded transition-colors border border-transparent hover:border-slate-300"
                    title="Align Left"
                  >
                    <AlignLeft className="w-4 h-4 text-slate-700" />
                  </button>
                  <button
                    type="button"
                    onClick={formatAlignCenter}
                    className="p-2 hover:bg-white rounded transition-colors border border-transparent hover:border-slate-300"
                    title="Align Center"
                  >
                    <AlignCenter className="w-4 h-4 text-slate-700" />
                  </button>
                  <button
                    type="button"
                    onClick={formatAlignRight}
                    className="p-2 hover:bg-white rounded transition-colors border border-transparent hover:border-slate-300"
                    title="Align Right"
                  >
                    <AlignRight className="w-4 h-4 text-slate-700" />
                  </button>

                  <div className="w-px h-6 bg-slate-300 mx-1"></div>

                  <button
                    type="button"
                    onClick={formatLink}
                    className="p-2 hover:bg-white rounded transition-colors border border-transparent hover:border-slate-300"
                    title="Insert Link"
                  >
                    <LinkIcon className="w-4 h-4 text-slate-700" />
                  </button>
                  <button
                    type="button"
                    onClick={formatImage}
                    className="p-2 hover:bg-white rounded transition-colors border border-transparent hover:border-slate-300"
                    title="Insert Image"
                  >
                    <ImageIcon className="w-4 h-4 text-slate-700" />
                  </button>
                </div>
              )}

              <textarea
                ref={textareaRef}
                value={formData.content}
                onChange={(e) => handleFieldChange('content', e.target.value)}
                placeholder="Start writing your content..."
                rows={20}
                className={`w-full p-4 outline-none resize-none ${
                  isVisualMode ? 'font-normal' : 'font-mono text-sm'
                }`}
              />
              <div className="px-4 py-2 border-t border-slate-200 text-xs text-slate-500 bg-slate-50">
                Word count: {wordCount}
              </div>
            </div>
          </div>
        </div>

        <div className="w-80 p-6 border-l border-slate-200 bg-slate-50 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 73px)' }}>
          <Panel title="Publish" name="publish">
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => handleFieldChange('status', e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-[#bb2738]"
                >
                  <option value="draft">Draft</option>
                  <option value="pending">Pending Review</option>
                  <option value="published">Published</option>
                  <option value="scheduled">Scheduled</option>
                </select>
              </div>

              {formData.status === 'scheduled' && (
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    <Clock className="w-3 h-3 inline mr-1" />
                    Publish On
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.scheduled_at}
                    onChange={(e) => handleFieldChange('scheduled_at', e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-[#bb2738]"
                  />
                </div>
              )}

              {pageId && (
                <button
                  onClick={handleTrash}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm text-red-700 border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  Move to Trash
                </button>
              )}
            </div>
          </Panel>

          <Panel title="Page Attributes" name="pageAttributes">
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Template</label>
                <select
                  value={formData.template}
                  onChange={(e) => handleFieldChange('template', e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-[#bb2738]"
                >
                  <option value="default">Default</option>
                  <option value="full-width">Full Width</option>
                  <option value="landing">Landing Page</option>
                  <option value="sidebar-left">Sidebar Left</option>
                  <option value="sidebar-right">Sidebar Right</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Page Type</label>
                <select
                  value={formData.page_type}
                  onChange={(e) => handleFieldChange('page_type', e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-[#bb2738]"
                >
                  <option value="standard">Standard</option>
                  <option value="landing">Landing Page</option>
                  <option value="legal">Legal Document</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Sort Order</label>
                <input
                  type="number"
                  value={formData.sort_order}
                  onChange={(e) => handleFieldChange('sort_order', parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-[#bb2738]"
                />
              </div>
            </div>
          </Panel>

          <Panel title="Featured Image" name="featuredImage">
            <div className="space-y-3">
              {formData.featured_image_url && (
                <div className="relative">
                  <img
                    src={formData.featured_image_url}
                    alt="Featured"
                    className="w-full h-32 object-cover rounded-lg"
                  />
                  <button
                    onClick={() => handleFieldChange('featured_image_url', '')}
                    className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              )}
              <input
                type="text"
                value={formData.featured_image_url}
                onChange={(e) => handleFieldChange('featured_image_url', e.target.value)}
                placeholder="Image URL"
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-[#bb2738]"
              />
            </div>
          </Panel>

          <Panel title="SEO" name="seo">
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Meta Description</label>
                <textarea
                  value={formData.meta_description}
                  onChange={(e) => handleFieldChange('meta_description', e.target.value)}
                  rows={3}
                  placeholder="Brief description for search engines"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-[#bb2738] resize-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Meta Keywords</label>
                <input
                  type="text"
                  value={formData.meta_keywords}
                  onChange={(e) => handleFieldChange('meta_keywords', e.target.value)}
                  placeholder="keyword1, keyword2"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-[#bb2738]"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Excerpt</label>
                <textarea
                  value={formData.excerpt}
                  onChange={(e) => handleFieldChange('excerpt', e.target.value)}
                  rows={3}
                  placeholder="Short summary"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-[#bb2738] resize-none"
                />
              </div>
            </div>
          </Panel>

          <Panel title="Visibility" name="visibility">
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  <Lock className="w-3 h-3 inline mr-1" />
                  Visibility
                </label>
                <select
                  value={formData.visibility}
                  onChange={(e) => handleFieldChange('visibility', e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-[#bb2738]"
                >
                  <option value="public">Public</option>
                  <option value="private">Private</option>
                  <option value="password">Password Protected</option>
                </select>
              </div>
              {formData.visibility === 'password' && (
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Password</label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => handleFieldChange('password', e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-[#bb2738]"
                  />
                </div>
              )}
            </div>
          </Panel>

          <Panel title="Navigation" name="navigation">
            <div className="space-y-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.show_in_header}
                  onChange={(e) => handleFieldChange('show_in_header', e.target.checked)}
                  className="w-4 h-4 text-[#bb2738] border-slate-300 rounded focus:ring-[#bb2738]"
                />
                <span className="text-sm text-slate-700">Show in Header Menu</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.show_in_footer}
                  onChange={(e) => handleFieldChange('show_in_footer', e.target.checked)}
                  className="w-4 h-4 text-[#bb2738] border-slate-300 rounded focus:ring-[#bb2738]"
                />
                <span className="text-sm text-slate-700">Show in Footer Menu</span>
              </label>
            </div>
          </Panel>

          <Panel title="Discussion" name="discussion">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.allow_comments}
                onChange={(e) => handleFieldChange('allow_comments', e.target.checked)}
                className="w-4 h-4 text-[#bb2738] border-slate-300 rounded focus:ring-[#bb2738]"
              />
              <span className="text-sm text-slate-700">Allow comments</span>
            </label>
          </Panel>

          <Panel title="Page Options" name="pageOptions">
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Custom CSS</label>
                <textarea
                  value={formData.custom_css}
                  onChange={(e) => handleFieldChange('custom_css', e.target.value)}
                  rows={4}
                  placeholder=".custom-class { }"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-[#bb2738] font-mono resize-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Custom JavaScript</label>
                <textarea
                  value={formData.custom_js}
                  onChange={(e) => handleFieldChange('custom_js', e.target.value)}
                  rows={4}
                  placeholder="// Your code here"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-[#bb2738] font-mono resize-none"
                />
              </div>
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}
