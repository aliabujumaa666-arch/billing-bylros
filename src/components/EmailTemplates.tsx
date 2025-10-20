import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useToast } from '../contexts/ToastContext';
import { Mail, Plus, CreditCard as Edit, Trash2, X, Eye, Power } from 'lucide-react';

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body_html: string;
  variables: string[];
  category: string;
  is_active: boolean;
  created_at: string;
}

export function EmailTemplates() {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    subject: '',
    body_html: '',
    variables: [] as string[],
    category: 'general',
    is_active: true,
  });
  const { success, error: showError } = useToast();

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from('email_templates')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTemplates(data || []);
    } catch (err) {
      console.error('Error fetching templates:', err);
      showError('Failed to load email templates');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (selectedTemplate) {
        const { error } = await supabase
          .from('email_templates')
          .update({
            ...formData,
            variables: formData.variables,
            updated_at: new Date().toISOString(),
          })
          .eq('id', selectedTemplate.id);

        if (error) throw error;
        success('Template updated successfully');
      } else {
        const { error } = await supabase
          .from('email_templates')
          .insert([{ ...formData, variables: formData.variables }]);

        if (error) throw error;
        success('Template created successfully');
      }

      setShowModal(false);
      setSelectedTemplate(null);
      resetForm();
      fetchTemplates();
    } catch (err: any) {
      console.error('Error saving template:', err);
      showError(err.message || 'Failed to save template');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this template?')) return;

    try {
      const { error } = await supabase
        .from('email_templates')
        .delete()
        .eq('id', id);

      if (error) throw error;
      success('Template deleted successfully');
      fetchTemplates();
    } catch (err) {
      console.error('Error deleting template:', err);
      showError('Failed to delete template');
    }
  };

  const toggleActive = async (template: EmailTemplate) => {
    try {
      const { error } = await supabase
        .from('email_templates')
        .update({ is_active: !template.is_active })
        .eq('id', template.id);

      if (error) throw error;
      success(`Template ${!template.is_active ? 'activated' : 'deactivated'}`);
      fetchTemplates();
    } catch (err) {
      console.error('Error toggling template:', err);
      showError('Failed to update template status');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      subject: '',
      body_html: '',
      variables: [],
      category: 'general',
      is_active: true,
    });
  };

  const openEditModal = (template: EmailTemplate) => {
    setSelectedTemplate(template);
    setFormData({
      name: template.name,
      subject: template.subject,
      body_html: template.body_html,
      variables: template.variables || [],
      category: template.category,
      is_active: template.is_active,
    });
    setShowModal(true);
  };

  const addVariable = () => {
    const varName = prompt('Enter variable name (without {{}}):');
    if (varName && varName.trim()) {
      setFormData(prev => ({
        ...prev,
        variables: [...prev.variables, varName.trim()]
      }));
    }
  };

  const removeVariable = (index: number) => {
    setFormData(prev => ({
      ...prev,
      variables: prev.variables.filter((_, i) => i !== index)
    }));
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      quote: 'bg-amber-100 text-amber-700',
      order: 'bg-blue-100 text-blue-700',
      invoice: 'bg-green-100 text-green-700',
      general: 'bg-slate-100 text-slate-700',
    };
    return colors[category] || colors.general;
  };

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
          <h1 className="text-3xl font-bold text-slate-800 mb-2">Email Templates</h1>
          <p className="text-slate-600">Manage customizable email notification templates</p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setSelectedTemplate(null);
            setShowModal(true);
          }}
          className="flex items-center gap-2 bg-[#bb2738] hover:bg-[#a01f2f] text-white px-4 py-2.5 rounded-lg transition-colors"
        >
          <Plus className="w-5 h-5" />
          New Template
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {templates.map((template) => (
          <div
            key={template.id}
            className="bg-white rounded-xl border border-slate-200 overflow-hidden hover:shadow-lg transition-shadow"
          >
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-[#bb2738] to-[#a01f2f] rounded-lg flex items-center justify-center">
                    <Mail className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-800">{template.name}</h3>
                    <span className={`inline-block px-2 py-1 text-xs rounded mt-1 ${getCategoryColor(template.category)}`}>
                      {template.category}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => toggleActive(template)}
                  className={`p-2 rounded-lg transition-colors ${
                    template.is_active
                      ? 'bg-green-100 text-green-600 hover:bg-green-200'
                      : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
                  }`}
                >
                  <Power className="w-4 h-4" />
                </button>
              </div>

              <p className="text-sm text-slate-600 mb-4 line-clamp-2">{template.subject}</p>

              {template.variables && template.variables.length > 0 && (
                <div className="mb-4">
                  <p className="text-xs font-medium text-slate-500 mb-2">Variables:</p>
                  <div className="flex flex-wrap gap-1">
                    {template.variables.slice(0, 3).map((variable, idx) => (
                      <span key={idx} className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded">
                        {`{{${variable}}}`}
                      </span>
                    ))}
                    {template.variables.length > 3 && (
                      <span className="px-2 py-1 bg-slate-100 text-slate-600 text-xs rounded">
                        +{template.variables.length - 3}
                      </span>
                    )}
                  </div>
                </div>
              )}

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setSelectedTemplate(template);
                    setShowPreview(true);
                  }}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors"
                >
                  <Eye className="w-4 h-4" />
                  Preview
                </button>
                <button
                  onClick={() => openEditModal(template)}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg transition-colors"
                >
                  <Edit className="w-4 h-4" />
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(template.id)}
                  className="p-2 bg-red-100 hover:bg-red-200 text-red-600 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {templates.length === 0 && (
        <div className="text-center py-12">
          <Mail className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-slate-800 mb-2">No Templates</h3>
          <p className="text-slate-600">Create your first email template to get started</p>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-800">
                {selectedTemplate ? 'Edit Template' : 'New Template'}
              </h2>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-slate-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Template Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    disabled={!!selectedTemplate}
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-[#bb2738] disabled:bg-slate-100"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-[#bb2738]"
                  >
                    <option value="general">General</option>
                    <option value="quote">Quote</option>
                    <option value="order">Order</option>
                    <option value="invoice">Invoice</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Subject Line</label>
                <input
                  type="text"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  required
                  placeholder="Use {{variable}} for dynamic content"
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-[#bb2738]"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-slate-700">Variables</label>
                  <button
                    type="button"
                    onClick={addVariable}
                    className="text-sm text-[#bb2738] hover:text-[#a01f2f]"
                  >
                    + Add Variable
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.variables.map((variable, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-700 rounded-lg"
                    >
                      {`{{${variable}}}`}
                      <button
                        type="button"
                        onClick={() => removeVariable(index)}
                        className="hover:text-blue-900"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                  {formData.variables.length === 0 && (
                    <span className="text-sm text-slate-500">No variables defined</span>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Email Body (HTML)</label>
                <textarea
                  value={formData.body_html}
                  onChange={(e) => setFormData({ ...formData, body_html: e.target.value })}
                  required
                  rows={12}
                  placeholder="Enter HTML content. Use {{variable}} for dynamic content."
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-[#bb2738] font-mono text-sm"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="w-4 h-4 rounded border-slate-300 text-[#bb2738] focus:ring-[#bb2738]"
                />
                <label className="text-sm text-slate-700">Active (template will be available for use)</label>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2.5 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2.5 bg-[#bb2738] hover:bg-[#a01f2f] text-white rounded-lg transition-colors"
                >
                  {selectedTemplate ? 'Update Template' : 'Create Template'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showPreview && selectedTemplate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-800">Preview: {selectedTemplate.name}</h2>
              <button onClick={() => setShowPreview(false)} className="p-2 hover:bg-slate-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6">
              <div className="mb-4 p-4 bg-slate-50 rounded-lg">
                <p className="text-sm font-medium text-slate-700 mb-1">Subject:</p>
                <p className="text-slate-900">{selectedTemplate.subject}</p>
              </div>

              <div className="border border-slate-200 rounded-lg p-4">
                <div dangerouslySetInnerHTML={{ __html: selectedTemplate.body_html }} />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
