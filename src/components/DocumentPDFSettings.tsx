import { useState, useEffect } from 'react';
import { PDFSettings, DocumentType, PDFTemplate, useBrand } from '../contexts/BrandContext';
import { Type, Palette, Layout, Image, FileText, Eye, Settings, PlusCircle, Trash2, HelpCircle, RotateCcw, Save, Sparkles, ChevronDown, ChevronUp, GripVertical, Info, Download, Upload, Copy, Layers, Star, Clock, Tag, Edit } from 'lucide-react';
import { getDefaultPDFSettings } from '../utils/pdfHelpers';

interface DocumentPDFSettingsProps {
  documentType: DocumentType;
  documentLabel: string;
  settings: PDFSettings;
  onUpdate: (settings: PDFSettings) => void;
}

interface ColorPreset {
  name: string;
  colors: {
    tableHeaderBg: string;
    accentColor: string;
    textPrimary: string;
  };
}

export function DocumentPDFSettings({ documentType, documentLabel, settings, onUpdate }: DocumentPDFSettingsProps) {
  const brandContext = useBrand();
  const [activeTab, setActiveTab] = useState<'fonts' | 'colors' | 'layout' | 'sections' | 'advanced' | 'templates'>('fonts');
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});
  const [showPreview, setShowPreview] = useState(true);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [draggedType, setDraggedType] = useState<'remarks' | 'terms' | null>(null);
  const [templates, setTemplates] = useState<PDFTemplate[]>([]);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showCopyModal, setShowCopyModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<PDFTemplate | null>(null);
  const [templateName, setTemplateName] = useState('');
  const [templateDescription, setTemplateDescription] = useState('');
  const [templateTags, setTemplateTags] = useState('');
  const [isGlobalTemplate, setIsGlobalTemplate] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      const data = await brandContext.loadTemplates();
      setTemplates(data);
    } catch (error) {
      console.error('Failed to load templates:', error);
    }
  };

  const updateSettings = (section: keyof PDFSettings, field: string, value: any) => {
    onUpdate({
      ...settings,
      [section]: {
        ...settings[section],
        [field]: value,
      },
    });
    setSaveStatus('saved');
    setTimeout(() => setSaveStatus('idle'), 2000);
  };

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const colorPresets: ColorPreset[] = [
    { name: 'Professional Red', colors: { tableHeaderBg: '#bb2738', accentColor: '#bb2738', textPrimary: '#1e293b' } },
    { name: 'Ocean Blue', colors: { tableHeaderBg: '#0369a1', accentColor: '#0369a1', textPrimary: '#0f172a' } },
    { name: 'Forest Green', colors: { tableHeaderBg: '#15803d', accentColor: '#15803d', textPrimary: '#1e293b' } },
    { name: 'Royal Purple', colors: { tableHeaderBg: '#7c3aed', accentColor: '#7c3aed', textPrimary: '#1e1b4b' } },
    { name: 'Sunset Orange', colors: { tableHeaderBg: '#ea580c', accentColor: '#ea580c', textPrimary: '#1c1917' } },
    { name: 'Midnight Navy', colors: { tableHeaderBg: '#1e3a8a', accentColor: '#1e3a8a', textPrimary: '#0f172a' } },
  ];

  const applyColorPreset = (preset: ColorPreset) => {
    onUpdate({
      ...settings,
      colors: {
        ...settings.colors,
        ...preset.colors,
      },
    });
    setSaveStatus('saved');
    setTimeout(() => setSaveStatus('idle'), 2000);
  };

  const resetToDefaults = () => {
    if (confirm('Are you sure you want to reset all settings to default? This cannot be undone.')) {
      onUpdate(getDefaultPDFSettings());
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    }
  };

  const addRemark = () => {
    const newRemarks = [...(settings.remarks?.remarksContent || []), 'New remark...'];
    updateSettings('remarks', 'remarksContent', newRemarks);
  };

  const updateRemark = (index: number, value: string) => {
    const newRemarks = [...(settings.remarks?.remarksContent || [])];
    newRemarks[index] = value;
    updateSettings('remarks', 'remarksContent', newRemarks);
  };

  const removeRemark = (index: number) => {
    const newRemarks = (settings.remarks?.remarksContent || []).filter((_, i) => i !== index);
    updateSettings('remarks', 'remarksContent', newRemarks);
  };

  const addTerm = () => {
    const newTerms = [...settings.terms.termsContent, 'New term...'];
    updateSettings('terms', 'termsContent', newTerms);
  };

  const updateTerm = (index: number, value: string) => {
    const newTerms = [...settings.terms.termsContent];
    newTerms[index] = value;
    updateSettings('terms', 'termsContent', newTerms);
  };

  const removeTerm = (index: number) => {
    const newTerms = settings.terms.termsContent.filter((_, i) => i !== index);
    updateSettings('terms', 'termsContent', newTerms);
  };

  const handleDragStart = (index: number, type: 'remarks' | 'terms') => {
    setDraggedIndex(index);
    setDraggedType(type);
  };

  const handleDragOver = (e: React.DragEvent, index: number, type: 'remarks' | 'terms') => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index || draggedType !== type) return;

    if (type === 'remarks') {
      const newRemarks = [...(settings.remarks?.remarksContent || [])];
      const draggedItem = newRemarks[draggedIndex];
      newRemarks.splice(draggedIndex, 1);
      newRemarks.splice(index, 0, draggedItem);
      updateSettings('remarks', 'remarksContent', newRemarks);
    } else {
      const newTerms = [...settings.terms.termsContent];
      const draggedItem = newTerms[draggedIndex];
      newTerms.splice(draggedIndex, 1);
      newTerms.splice(index, 0, draggedItem);
      updateSettings('terms', 'termsContent', newTerms);
    }

    setDraggedIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDraggedType(null);
  };

  const handleSaveTemplate = async () => {
    try {
      const tags = templateTags.split(',').map(tag => tag.trim()).filter(Boolean);
      await brandContext.saveTemplate({
        name: templateName,
        description: templateDescription,
        document_type: isGlobalTemplate ? 'global' : documentType,
        is_default: false,
        is_global: isGlobalTemplate,
        is_system: false,
        settings,
        tags,
      });
      setShowSaveModal(false);
      setTemplateName('');
      setTemplateDescription('');
      setTemplateTags('');
      setIsGlobalTemplate(false);
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
      await loadTemplates();
    } catch (error) {
      console.error('Failed to save template:', error);
      alert('Failed to save template. Please try again.');
    }
  };

  const handleApplyTemplate = async (templateId: string) => {
    try {
      await brandContext.applyTemplate(templateId, documentType);
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (error) {
      console.error('Failed to apply template:', error);
      alert('Failed to apply template. Please try again.');
    }
  };

  const handleDeleteTemplate = async (templateId: string) => {
    if (confirm('Are you sure you want to delete this template?')) {
      try {
        await brandContext.deleteTemplate(templateId);
        await loadTemplates();
      } catch (error) {
        console.error('Failed to delete template:', error);
        alert('Failed to delete template. Please try again.');
      }
    }
  };

  const handleEditTemplate = (template: PDFTemplate) => {
    setEditingTemplate(template);
    setTemplateName(template.name);
    setTemplateDescription(template.description);
    setTemplateTags(template.tags.join(', '));
    setIsGlobalTemplate(template.is_global);
    setShowEditModal(true);
  };

  const handleUpdateTemplate = async () => {
    if (!editingTemplate) return;

    if (!templateName.trim()) {
      alert('Please enter a template name');
      return;
    }

    try {
      const updates = {
        name: templateName,
        description: templateDescription,
        tags: templateTags.split(',').map(tag => tag.trim()).filter(tag => tag),
        is_global: isGlobalTemplate,
      };

      await brandContext.updateTemplate(editingTemplate.id, updates);
      await loadTemplates();
      setShowEditModal(false);
      setEditingTemplate(null);
      setTemplateName('');
      setTemplateDescription('');
      setTemplateTags('');
      setIsGlobalTemplate(false);
    } catch (error) {
      console.error('Failed to update template:', error);
      alert('Failed to update template. Please try again.');
    }
  };

  const handleCopySettings = async (targetType: DocumentType) => {
    try {
      await brandContext.copySettings(documentType, targetType);
      setShowCopyModal(false);
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (error) {
      console.error('Failed to copy settings:', error);
      alert('Failed to copy settings. Please try again.');
    }
  };

  const handleExportSettings = () => {
    const dataStr = JSON.stringify(settings, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${documentType}-pdf-settings.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleImportSettings = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const imported = JSON.parse(e.target?.result as string);
        onUpdate(imported);
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 2000);
      } catch (error) {
        console.error('Failed to import settings:', error);
        alert('Failed to import settings. Please check the file format.');
      }
    };
    reader.readAsText(file);
  };

  const filteredTemplates = templates.filter(template => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      template.name.toLowerCase().includes(query) ||
      template.description.toLowerCase().includes(query) ||
      template.tags.some(tag => tag.toLowerCase().includes(query))
    );
  });

  const tabs = [
    { id: 'templates', label: 'Templates', icon: Layers },
    { id: 'fonts', label: 'Fonts & Typography', icon: Type },
    { id: 'colors', label: 'Colors', icon: Palette },
    { id: 'layout', label: 'Layout & Spacing', icon: Layout },
    { id: 'sections', label: 'Sections & Visibility', icon: Eye },
    { id: 'advanced', label: 'Advanced Options', icon: Settings },
  ] as const;

  const Tooltip = ({ text, children }: { text: string; children: React.ReactNode }) => (
    <div className="group relative inline-block">
      {children}
      <span className="invisible group-hover:visible absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-slate-800 text-white text-xs rounded-lg whitespace-nowrap z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
        {text}
      </span>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-slate-50 to-blue-50 rounded-lg p-6 border border-slate-200 mb-6 shadow-sm">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-white p-3 rounded-lg shadow-sm">
              <FileText className="w-6 h-6 text-[#bb2738]" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800">Customize Your {documentLabel} PDF</h2>
              <p className="text-sm text-slate-600">Design professional documents that match your brand</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {saveStatus === 'saved' && (
              <div className="flex items-center gap-2 bg-green-100 text-green-700 px-4 py-2 rounded-lg animate-fade-in">
                <Save className="w-4 h-4" />
                <span className="text-sm font-medium">Saved!</span>
              </div>
            )}
            <button
              onClick={() => setShowCopyModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-all duration-200 shadow-sm hover:shadow"
            >
              <Copy className="w-4 h-4" />
              <span className="text-sm font-medium hidden sm:inline">Copy Settings</span>
            </button>
            <button
              onClick={resetToDefaults}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-all duration-200 shadow-sm hover:shadow"
            >
              <RotateCcw className="w-4 h-4" />
              <span className="text-sm font-medium hidden sm:inline">Reset to Defaults</span>
            </button>
          </div>
        </div>
      </div>

      <div className="border-b border-slate-200 bg-white rounded-t-lg">
        <div className="flex space-x-1 overflow-x-auto p-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-5 py-3 border-b-2 transition-all duration-200 whitespace-nowrap rounded-t-lg ${
                  activeTab === tab.id
                    ? 'border-[#bb2738] text-[#bb2738] font-semibold bg-gradient-to-b from-red-50 to-transparent'
                    : 'border-transparent text-slate-600 hover:text-slate-800 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="bg-white rounded-lg border border-slate-200 shadow-sm">
        {activeTab === 'templates' && (
          <div className="space-y-6 p-6">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-100">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-3">
                  <div className="bg-white p-2 rounded-lg shadow-sm">
                    <Layers className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-slate-800">PDF Templates</h3>
                    <p className="text-sm text-slate-600">Save and reuse your PDF configurations</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={handleExportSettings}
                    className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-all"
                  >
                    <Download className="w-4 h-4" />
                    <span className="text-sm">Export JSON</span>
                  </button>
                  <label className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-all cursor-pointer">
                    <Upload className="w-4 h-4" />
                    <span className="text-sm">Import JSON</span>
                    <input type="file" accept=".json" onChange={handleImportSettings} className="hidden" />
                  </label>
                  <button
                    onClick={() => setShowSaveModal(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-[#bb2738] text-white rounded-lg hover:bg-[#a01f2f] transition-all shadow-sm"
                  >
                    <Save className="w-4 h-4" />
                    <span className="text-sm font-medium">Save Template</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="mb-4">
              <input
                type="text"
                placeholder="Search templates by name, description, or tags..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-[#bb2738]"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredTemplates.map((template) => (
                <div
                  key={template.id}
                  className="border border-slate-200 rounded-lg p-4 hover:border-[#bb2738] transition-all hover:shadow-md bg-white"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold text-slate-800">{template.name}</h4>
                        {template.is_system && (
                          <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full font-medium">
                            System
                          </span>
                        )}
                        {template.is_global && (
                          <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full font-medium">
                            Global
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-600">{template.description}</p>
                    </div>
                  </div>

                  {template.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {template.tags.map((tag, idx) => (
                        <span key={idx} className="px-2 py-1 bg-slate-100 text-slate-600 text-xs rounded">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center gap-2 text-xs text-slate-500 mb-3">
                    <Clock className="w-3 h-3" />
                    <span>Used {template.usage_count} times</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleApplyTemplate(template.id)}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-[#bb2738] text-white rounded-lg hover:bg-[#a01f2f] transition-all text-sm font-medium"
                    >
                      <Sparkles className="w-4 h-4" />
                      Apply
                    </button>
                    {!template.is_system && (
                      <>
                        <button
                          onClick={() => handleEditTemplate(template)}
                          className="px-3 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-blue-50 hover:border-blue-300 hover:text-blue-600 transition-all"
                          title="Edit template"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteTemplate(template.id)}
                          className="px-3 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-red-50 hover:border-red-300 hover:text-red-600 transition-all"
                          title="Delete template"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {filteredTemplates.length === 0 && (
              <div className="text-center py-12">
                <Layers className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-600 font-medium mb-2">No templates found</p>
                <p className="text-sm text-slate-500">
                  {searchQuery ? 'Try a different search term' : 'Create your first template to get started'}
                </p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'fonts' && (
          <div className="space-y-6 p-6">
            <div className="bg-gradient-to-r from-blue-50 to-slate-50 rounded-lg p-4 border border-blue-100">
              <div className="flex items-center gap-3">
                <div className="bg-white p-2 rounded-lg shadow-sm">
                  <Type className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-800">Font Settings</h3>
                  <p className="text-sm text-slate-600">Choose fonts and sizes for your document</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
                  Header Font Family
                  <Tooltip text="Font used for headings and titles">
                    <HelpCircle className="w-4 h-4 text-slate-400 cursor-help" />
                  </Tooltip>
                </label>
                <select
                  value={settings.fonts.headerFont}
                  onChange={(e) => updateSettings('fonts', 'headerFont', e.target.value)}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-[#bb2738] transition-all hover:border-slate-400 bg-white"
                >
                  <optgroup label="Sans-Serif Fonts">
                    <option value="helvetica">Helvetica</option>
                    <option value="arial">Arial</option>
                    <option value="verdana">Verdana</option>
                    <option value="trebuchet">Trebuchet MS</option>
                    <option value="segoe">Segoe UI</option>
                    <option value="tahoma">Tahoma</option>
                  </optgroup>
                  <optgroup label="Serif Fonts">
                    <option value="times">Times New Roman</option>
                    <option value="georgia">Georgia</option>
                    <option value="palatino">Palatino</option>
                    <option value="garamond">Garamond</option>
                    <option value="bookman">Bookman</option>
                  </optgroup>
                  <optgroup label="Monospace Fonts">
                    <option value="courier">Courier</option>
                    <option value="courier-new">Courier New</option>
                    <option value="lucida-console">Lucida Console</option>
                  </optgroup>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
                  Body Font Family
                  <Tooltip text="Font used for body text and descriptions">
                    <HelpCircle className="w-4 h-4 text-slate-400 cursor-help" />
                  </Tooltip>
                </label>
                <select
                  value={settings.fonts.bodyFont}
                  onChange={(e) => updateSettings('fonts', 'bodyFont', e.target.value)}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-[#bb2738] transition-all hover:border-slate-400 bg-white"
                >
                  <optgroup label="Sans-Serif Fonts">
                    <option value="helvetica">Helvetica</option>
                    <option value="arial">Arial</option>
                    <option value="verdana">Verdana</option>
                    <option value="trebuchet">Trebuchet MS</option>
                    <option value="segoe">Segoe UI</option>
                    <option value="tahoma">Tahoma</option>
                  </optgroup>
                  <optgroup label="Serif Fonts">
                    <option value="times">Times New Roman</option>
                    <option value="georgia">Georgia</option>
                    <option value="palatino">Palatino</option>
                    <option value="garamond">Garamond</option>
                    <option value="bookman">Bookman</option>
                  </optgroup>
                  <optgroup label="Monospace Fonts">
                    <option value="courier">Courier</option>
                    <option value="courier-new">Courier New</option>
                    <option value="lucida-console">Lucida Console</option>
                  </optgroup>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Header Font Size: <span className="text-[#bb2738] font-semibold">{settings.fonts.headerFontSize}pt</span>
                </label>
                <input
                  type="range"
                  min="10"
                  max="40"
                  value={settings.fonts.headerFontSize}
                  onChange={(e) => updateSettings('fonts', 'headerFontSize', parseInt(e.target.value))}
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#bb2738]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Body Font Size: <span className="text-[#bb2738] font-semibold">{settings.fonts.bodyFontSize}pt</span>
                </label>
                <input
                  type="range"
                  min="6"
                  max="16"
                  value={settings.fonts.bodyFontSize}
                  onChange={(e) => updateSettings('fonts', 'bodyFontSize', parseInt(e.target.value))}
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#bb2738]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Table Font Size: <span className="text-[#bb2738] font-semibold">{settings.fonts.tableFontSize}pt</span>
                </label>
                <input
                  type="range"
                  min="6"
                  max="14"
                  step="0.5"
                  value={settings.fonts.tableFontSize}
                  onChange={(e) => updateSettings('fonts', 'tableFontSize', parseFloat(e.target.value))}
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#bb2738]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Footer Font Size: <span className="text-[#bb2738] font-semibold">{settings.fonts.footerFontSize}pt</span>
                </label>
                <input
                  type="range"
                  min="6"
                  max="12"
                  value={settings.fonts.footerFontSize}
                  onChange={(e) => updateSettings('fonts', 'footerFontSize', parseInt(e.target.value))}
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#bb2738]"
                />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'colors' && (
          <div className="space-y-6 p-6">
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-4 border border-purple-100 mb-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-white p-2 rounded-lg shadow-sm">
                  <Sparkles className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-slate-800">Quick Color Presets</h4>
                  <p className="text-sm text-slate-600">Apply professional color schemes instantly</p>
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                {colorPresets.map((preset) => (
                  <button
                    key={preset.name}
                    onClick={() => applyColorPreset(preset)}
                    className="group relative p-3 bg-white rounded-lg border-2 border-slate-200 hover:border-[#bb2738] transition-all duration-200 hover:shadow-md"
                  >
                    <div className="flex gap-1 mb-2">
                      <div
                        className="w-6 h-6 rounded shadow-sm"
                        style={{ backgroundColor: preset.colors.tableHeaderBg }}
                      />
                      <div
                        className="w-6 h-6 rounded shadow-sm"
                        style={{ backgroundColor: preset.colors.accentColor }}
                      />
                    </div>
                    <span className="text-xs font-medium text-slate-700 block">{preset.name}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-gradient-to-r from-pink-50 to-slate-50 rounded-lg p-4 border border-pink-100 mb-4">
              <div className="flex items-center gap-3">
                <div className="bg-white p-2 rounded-lg shadow-sm">
                  <Palette className="w-5 h-5 text-pink-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-800">Custom Color Settings</h3>
                  <p className="text-sm text-slate-600">Fine-tune colors to match your brand</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Table Header Background</label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={settings.colors.tableHeaderBg}
                    onChange={(e) => updateSettings('colors', 'tableHeaderBg', e.target.value)}
                    className="h-11 w-16 border border-slate-300 rounded-lg cursor-pointer"
                  />
                  <input
                    type="text"
                    value={settings.colors.tableHeaderBg}
                    onChange={(e) => updateSettings('colors', 'tableHeaderBg', e.target.value)}
                    className="flex-1 px-4 py-2.5 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-[#bb2738] font-mono text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Table Header Text</label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={settings.colors.tableHeaderText}
                    onChange={(e) => updateSettings('colors', 'tableHeaderText', e.target.value)}
                    className="h-11 w-16 border border-slate-300 rounded-lg cursor-pointer"
                  />
                  <input
                    type="text"
                    value={settings.colors.tableHeaderText}
                    onChange={(e) => updateSettings('colors', 'tableHeaderText', e.target.value)}
                    className="flex-1 px-4 py-2.5 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-[#bb2738] font-mono text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Table Alternate Row</label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={settings.colors.tableRowAlternate}
                    onChange={(e) => updateSettings('colors', 'tableRowAlternate', e.target.value)}
                    className="h-11 w-16 border border-slate-300 rounded-lg cursor-pointer"
                  />
                  <input
                    type="text"
                    value={settings.colors.tableRowAlternate}
                    onChange={(e) => updateSettings('colors', 'tableRowAlternate', e.target.value)}
                    className="flex-1 px-4 py-2.5 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-[#bb2738] font-mono text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Table Border Color</label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={settings.colors.tableBorder}
                    onChange={(e) => updateSettings('colors', 'tableBorder', e.target.value)}
                    className="h-11 w-16 border border-slate-300 rounded-lg cursor-pointer"
                  />
                  <input
                    type="text"
                    value={settings.colors.tableBorder}
                    onChange={(e) => updateSettings('colors', 'tableBorder', e.target.value)}
                    className="flex-1 px-4 py-2.5 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-[#bb2738] font-mono text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Accent Color</label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={settings.colors.accentColor}
                    onChange={(e) => updateSettings('colors', 'accentColor', e.target.value)}
                    className="h-11 w-16 border border-slate-300 rounded-lg cursor-pointer"
                  />
                  <input
                    type="text"
                    value={settings.colors.accentColor}
                    onChange={(e) => updateSettings('colors', 'accentColor', e.target.value)}
                    className="flex-1 px-4 py-2.5 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-[#bb2738] font-mono text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Primary Text Color</label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={settings.colors.textPrimary}
                    onChange={(e) => updateSettings('colors', 'textPrimary', e.target.value)}
                    className="h-11 w-16 border border-slate-300 rounded-lg cursor-pointer"
                  />
                  <input
                    type="text"
                    value={settings.colors.textPrimary}
                    onChange={(e) => updateSettings('colors', 'textPrimary', e.target.value)}
                    className="flex-1 px-4 py-2.5 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-[#bb2738] font-mono text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Secondary Text Color</label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={settings.colors.textSecondary}
                    onChange={(e) => updateSettings('colors', 'textSecondary', e.target.value)}
                    className="h-11 w-16 border border-slate-300 rounded-lg cursor-pointer"
                  />
                  <input
                    type="text"
                    value={settings.colors.textSecondary}
                    onChange={(e) => updateSettings('colors', 'textSecondary', e.target.value)}
                    className="flex-1 px-4 py-2.5 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-[#bb2738] font-mono text-sm"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'layout' && (
          <div className="space-y-6 p-6">
            <div className="bg-gradient-to-r from-green-50 to-slate-50 rounded-lg p-4 border border-green-100">
              <div className="flex items-center gap-3">
                <div className="bg-white p-2 rounded-lg shadow-sm">
                  <Layout className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-800">Layout & Spacing</h3>
                  <p className="text-sm text-slate-600">Control margins, spacing, and element positioning</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4 bg-slate-50 p-4 rounded-lg border border-slate-200">
                <h4 className="font-medium text-slate-700 flex items-center gap-2">
                  Page Margins (mm)
                  <Tooltip text="Space around the edges of your document">
                    <Info className="w-4 h-4 text-slate-400 cursor-help" />
                  </Tooltip>
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Top: {settings.layout.marginTop}mm</label>
                    <input
                      type="range"
                      min="0"
                      max="50"
                      value={settings.layout.marginTop}
                      onChange={(e) => updateSettings('layout', 'marginTop', parseInt(e.target.value))}
                      className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#bb2738]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Right: {settings.layout.marginRight}mm</label>
                    <input
                      type="range"
                      min="0"
                      max="50"
                      value={settings.layout.marginRight}
                      onChange={(e) => updateSettings('layout', 'marginRight', parseInt(e.target.value))}
                      className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#bb2738]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Bottom: {settings.layout.marginBottom}mm</label>
                    <input
                      type="range"
                      min="0"
                      max="50"
                      value={settings.layout.marginBottom}
                      onChange={(e) => updateSettings('layout', 'marginBottom', parseInt(e.target.value))}
                      className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#bb2738]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Left: {settings.layout.marginLeft}mm</label>
                    <input
                      type="range"
                      min="0"
                      max="50"
                      value={settings.layout.marginLeft}
                      onChange={(e) => updateSettings('layout', 'marginLeft', parseInt(e.target.value))}
                      className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#bb2738]"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4 bg-slate-50 p-4 rounded-lg border border-slate-200">
                <h4 className="font-medium text-slate-700">Section Dimensions</h4>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Header Height: {settings.layout.headerHeight}mm</label>
                    <input
                      type="range"
                      min="20"
                      max="100"
                      value={settings.layout.headerHeight}
                      onChange={(e) => updateSettings('layout', 'headerHeight', parseInt(e.target.value))}
                      className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#bb2738]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Footer Height: {settings.layout.footerHeight}mm</label>
                    <input
                      type="range"
                      min="10"
                      max="50"
                      value={settings.layout.footerHeight}
                      onChange={(e) => updateSettings('layout', 'footerHeight', parseInt(e.target.value))}
                      className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#bb2738]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Content Spacing: {settings.layout.contentSpacing}mm</label>
                    <input
                      type="range"
                      min="2"
                      max="20"
                      value={settings.layout.contentSpacing}
                      onChange={(e) => updateSettings('layout', 'contentSpacing', parseInt(e.target.value))}
                      className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#bb2738]"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4 bg-slate-50 p-4 rounded-lg border border-slate-200">
                <h4 className="font-medium text-slate-700 flex items-center gap-2">
                  <Image className="w-4 h-4" />
                  Logo Settings
                </h4>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={settings.logo.showLogo}
                      onChange={(e) => updateSettings('logo', 'showLogo', e.target.checked)}
                      className="w-4 h-4 text-[#bb2738] border-slate-300 rounded focus:ring-[#bb2738]"
                    />
                    <label className="text-sm font-medium text-slate-700">Show Logo</label>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Logo Position</label>
                    <select
                      value={settings.logo.logoPosition}
                      onChange={(e) => updateSettings('logo', 'logoPosition', e.target.value as any)}
                      className="w-full px-4 py-2.5 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-[#bb2738]"
                    >
                      <option value="left">Left</option>
                      <option value="center">Center</option>
                      <option value="right">Right</option>
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Width: {settings.logo.logoWidth}mm</label>
                      <input
                        type="range"
                        min="10"
                        max="100"
                        value={settings.logo.logoWidth}
                        onChange={(e) => updateSettings('logo', 'logoWidth', parseInt(e.target.value))}
                        className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#bb2738]"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Height: {settings.logo.logoHeight}mm</label>
                      <input
                        type="range"
                        min="10"
                        max="100"
                        value={settings.logo.logoHeight}
                        onChange={(e) => updateSettings('logo', 'logoHeight', parseInt(e.target.value))}
                        className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#bb2738]"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4 bg-slate-50 p-4 rounded-lg border border-slate-200">
                <h4 className="font-medium text-slate-700">Table Alignment</h4>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Table Style</label>
                    <select
                      value={settings.table.tableStyle}
                      onChange={(e) => updateSettings('table', 'tableStyle', e.target.value as any)}
                      className="w-full px-4 py-2.5 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-[#bb2738]"
                    >
                      <option value="striped">Striped</option>
                      <option value="grid">Grid</option>
                      <option value="plain">Plain</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Header Alignment</label>
                    <select
                      value={settings.table.headerAlignment}
                      onChange={(e) => updateSettings('table', 'headerAlignment', e.target.value as any)}
                      className="w-full px-4 py-2.5 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-[#bb2738]"
                    >
                      <option value="left">Left</option>
                      <option value="center">Center</option>
                      <option value="right">Right</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Amount Alignment</label>
                    <select
                      value={settings.table.amountAlignment}
                      onChange={(e) => updateSettings('table', 'amountAlignment', e.target.value as any)}
                      className="w-full px-4 py-2.5 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-[#bb2738]"
                    >
                      <option value="left">Left</option>
                      <option value="center">Center</option>
                      <option value="right">Right</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t border-slate-300 pt-6 mt-6">
              <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5 text-[#bb2738]" />
                Document Title Section
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4 bg-slate-50 p-4 rounded-lg border border-slate-200">
                  <h4 className="font-medium text-slate-700">Title Text & Style</h4>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Title Text</label>
                      <input
                        type="text"
                        value={settings.documentTitle.titleText}
                        onChange={(e) => updateSettings('documentTitle', 'titleText', e.target.value)}
                        className="w-full px-4 py-2.5 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-[#bb2738]"
                        placeholder="QUOTATION"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Font Size: {settings.documentTitle.fontSize}pt</label>
                      <input
                        type="range"
                        min="12"
                        max="36"
                        value={settings.documentTitle.fontSize}
                        onChange={(e) => updateSettings('documentTitle', 'fontSize', parseInt(e.target.value))}
                        className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#bb2738]"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Font Weight</label>
                      <select
                        value={settings.documentTitle.fontWeight}
                        onChange={(e) => updateSettings('documentTitle', 'fontWeight', e.target.value as any)}
                        className="w-full px-4 py-2.5 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-[#bb2738]"
                      >
                        <option value="normal">Normal</option>
                        <option value="bold">Bold</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="space-y-4 bg-slate-50 p-4 rounded-lg border border-slate-200">
                  <h4 className="font-medium text-slate-700">Background & Colors</h4>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Text Color</label>
                      <div className="flex gap-2">
                        <input
                          type="color"
                          value={settings.documentTitle.textColor}
                          onChange={(e) => updateSettings('documentTitle', 'textColor', e.target.value)}
                          className="w-12 h-10 border border-slate-300 rounded cursor-pointer"
                        />
                        <input
                          type="text"
                          value={settings.documentTitle.textColor}
                          onChange={(e) => updateSettings('documentTitle', 'textColor', e.target.value)}
                          className="flex-1 px-4 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-[#bb2738]"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Background Color</label>
                      <div className="flex gap-2">
                        <input
                          type="color"
                          value={settings.documentTitle.backgroundColor}
                          onChange={(e) => updateSettings('documentTitle', 'backgroundColor', e.target.value)}
                          className="w-12 h-10 border border-slate-300 rounded cursor-pointer"
                        />
                        <input
                          type="text"
                          value={settings.documentTitle.backgroundColor}
                          onChange={(e) => updateSettings('documentTitle', 'backgroundColor', e.target.value)}
                          className="flex-1 px-4 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-[#bb2738]"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Background Opacity: {Math.round(settings.documentTitle.backgroundOpacity * 100)}%</label>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.1"
                        value={settings.documentTitle.backgroundOpacity}
                        onChange={(e) => updateSettings('documentTitle', 'backgroundOpacity', parseFloat(e.target.value))}
                        className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#bb2738]"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-4 bg-slate-50 p-4 rounded-lg border border-slate-200">
                  <h4 className="font-medium text-slate-700">Reference Number</h4>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={settings.documentTitle.showReferenceNumber}
                        onChange={(e) => updateSettings('documentTitle', 'showReferenceNumber', e.target.checked)}
                        className="w-4 h-4 text-[#bb2738] border-slate-300 rounded focus:ring-[#bb2738]"
                      />
                      <label className="text-sm font-medium text-slate-700">Show Reference Number</label>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Reference Position</label>
                      <select
                        value={settings.documentTitle.referencePosition}
                        onChange={(e) => updateSettings('documentTitle', 'referencePosition', e.target.value as any)}
                        className="w-full px-4 py-2.5 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-[#bb2738]"
                        disabled={!settings.documentTitle.showReferenceNumber}
                      >
                        <option value="right">Right (Same Line)</option>
                        <option value="below">Below Title</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Reference Font Size: {settings.documentTitle.referenceFontSize}pt</label>
                      <input
                        type="range"
                        min="6"
                        max="16"
                        value={settings.documentTitle.referenceFontSize}
                        onChange={(e) => updateSettings('documentTitle', 'referenceFontSize', parseInt(e.target.value))}
                        className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#bb2738]"
                        disabled={!settings.documentTitle.showReferenceNumber}
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-4 bg-slate-50 p-4 rounded-lg border border-slate-200">
                  <h4 className="font-medium text-slate-700">Layout Settings</h4>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Border Radius: {settings.documentTitle.borderRadius}mm</label>
                      <input
                        type="range"
                        min="0"
                        max="10"
                        value={settings.documentTitle.borderRadius}
                        onChange={(e) => updateSettings('documentTitle', 'borderRadius', parseInt(e.target.value))}
                        className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#bb2738]"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Padding: {settings.documentTitle.padding}mm</label>
                      <input
                        type="range"
                        min="6"
                        max="24"
                        value={settings.documentTitle.padding}
                        onChange={(e) => updateSettings('documentTitle', 'padding', parseInt(e.target.value))}
                        className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#bb2738]"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t border-slate-300 pt-6 mt-6">
              <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                <Layout className="w-5 h-5 text-[#bb2738]" />
                Info Boxes (Quote Details & Customer Info)
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4 bg-slate-50 p-4 rounded-lg border border-slate-200">
                  <h4 className="font-medium text-slate-700">Box Layout</h4>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Layout Style</label>
                      <select
                        value={settings.infoBoxes.layout}
                        onChange={(e) => updateSettings('infoBoxes', 'layout', e.target.value as any)}
                        className="w-full px-4 py-2.5 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-[#bb2738]"
                      >
                        <option value="side-by-side">Side by Side</option>
                        <option value="stacked">Stacked (Vertical)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Box Spacing: {settings.infoBoxes.boxSpacing}mm</label>
                      <input
                        type="range"
                        min="2"
                        max="20"
                        value={settings.infoBoxes.boxSpacing}
                        onChange={(e) => updateSettings('infoBoxes', 'boxSpacing', parseInt(e.target.value))}
                        className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#bb2738]"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={settings.infoBoxes.showIcons}
                        onChange={(e) => updateSettings('infoBoxes', 'showIcons', e.target.checked)}
                        className="w-4 h-4 text-[#bb2738] border-slate-300 rounded focus:ring-[#bb2738]"
                      />
                      <label className="text-sm font-medium text-slate-700">Show Icons (📞, ✉)</label>
                    </div>
                  </div>
                </div>

                <div className="space-y-4 bg-slate-50 p-4 rounded-lg border border-slate-200">
                  <h4 className="font-medium text-slate-700">Box Styling</h4>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Background Color</label>
                      <div className="flex gap-2">
                        <input
                          type="color"
                          value={settings.infoBoxes.backgroundColor}
                          onChange={(e) => updateSettings('infoBoxes', 'backgroundColor', e.target.value)}
                          className="w-12 h-10 border border-slate-300 rounded cursor-pointer"
                        />
                        <input
                          type="text"
                          value={settings.infoBoxes.backgroundColor}
                          onChange={(e) => updateSettings('infoBoxes', 'backgroundColor', e.target.value)}
                          className="flex-1 px-4 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-[#bb2738]"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Border Color</label>
                      <div className="flex gap-2">
                        <input
                          type="color"
                          value={settings.infoBoxes.borderColor}
                          onChange={(e) => updateSettings('infoBoxes', 'borderColor', e.target.value)}
                          className="w-12 h-10 border border-slate-300 rounded cursor-pointer"
                        />
                        <input
                          type="text"
                          value={settings.infoBoxes.borderColor}
                          onChange={(e) => updateSettings('infoBoxes', 'borderColor', e.target.value)}
                          className="flex-1 px-4 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-[#bb2738]"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Border Width: {settings.infoBoxes.borderWidth}px</label>
                      <input
                        type="range"
                        min="0"
                        max="4"
                        step="0.5"
                        value={settings.infoBoxes.borderWidth}
                        onChange={(e) => updateSettings('infoBoxes', 'borderWidth', parseFloat(e.target.value))}
                        className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#bb2738]"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Border Radius: {settings.infoBoxes.borderRadius}mm</label>
                      <input
                        type="range"
                        min="0"
                        max="10"
                        value={settings.infoBoxes.borderRadius}
                        onChange={(e) => updateSettings('infoBoxes', 'borderRadius', parseInt(e.target.value))}
                        className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#bb2738]"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-4 bg-slate-50 p-4 rounded-lg border border-slate-200">
                  <h4 className="font-medium text-slate-700">Label Text</h4>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Label Color</label>
                      <div className="flex gap-2">
                        <input
                          type="color"
                          value={settings.infoBoxes.labelColor}
                          onChange={(e) => updateSettings('infoBoxes', 'labelColor', e.target.value)}
                          className="w-12 h-10 border border-slate-300 rounded cursor-pointer"
                        />
                        <input
                          type="text"
                          value={settings.infoBoxes.labelColor}
                          onChange={(e) => updateSettings('infoBoxes', 'labelColor', e.target.value)}
                          className="flex-1 px-4 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-[#bb2738]"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Label Font Size: {settings.infoBoxes.labelFontSize}pt</label>
                      <input
                        type="range"
                        min="6"
                        max="14"
                        value={settings.infoBoxes.labelFontSize}
                        onChange={(e) => updateSettings('infoBoxes', 'labelFontSize', parseInt(e.target.value))}
                        className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#bb2738]"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Label Font Weight</label>
                      <select
                        value={settings.infoBoxes.labelFontWeight}
                        onChange={(e) => updateSettings('infoBoxes', 'labelFontWeight', e.target.value as any)}
                        className="w-full px-4 py-2.5 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-[#bb2738]"
                      >
                        <option value="normal">Normal</option>
                        <option value="bold">Bold</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="space-y-4 bg-slate-50 p-4 rounded-lg border border-slate-200">
                  <h4 className="font-medium text-slate-700">Value Text</h4>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Value Color</label>
                      <div className="flex gap-2">
                        <input
                          type="color"
                          value={settings.infoBoxes.valueColor}
                          onChange={(e) => updateSettings('infoBoxes', 'valueColor', e.target.value)}
                          className="w-12 h-10 border border-slate-300 rounded cursor-pointer"
                        />
                        <input
                          type="text"
                          value={settings.infoBoxes.valueColor}
                          onChange={(e) => updateSettings('infoBoxes', 'valueColor', e.target.value)}
                          className="flex-1 px-4 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-[#bb2738]"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Value Font Size: {settings.infoBoxes.valueFontSize}pt</label>
                      <input
                        type="range"
                        min="6"
                        max="14"
                        value={settings.infoBoxes.valueFontSize}
                        onChange={(e) => updateSettings('infoBoxes', 'valueFontSize', parseInt(e.target.value))}
                        className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#bb2738]"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Value Font Weight</label>
                      <select
                        value={settings.infoBoxes.valueFontWeight}
                        onChange={(e) => updateSettings('infoBoxes', 'valueFontWeight', e.target.value as any)}
                        className="w-full px-4 py-2.5 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-[#bb2738]"
                      >
                        <option value="normal">Normal</option>
                        <option value="bold">Bold</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'sections' && (
          <div className="space-y-6 p-6">
            <div className="bg-gradient-to-r from-orange-50 to-slate-50 rounded-lg p-4 border border-orange-100">
              <div className="flex items-center gap-3">
                <div className="bg-white p-2 rounded-lg shadow-sm">
                  <Eye className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-800">Section Visibility</h3>
                  <p className="text-sm text-slate-600">Control which sections appear in your PDF</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3 bg-slate-50 p-4 rounded-lg border border-slate-200">
                <h4 className="font-medium text-slate-700 mb-3 flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Main Sections
                </h4>
                <div className="space-y-2">
                  {[
                    { key: 'showQuoteDetails', label: 'Show Quote Details' },
                    { key: 'showCustomerInfo', label: 'Show Customer Information' },
                    { key: 'showItemsTable', label: 'Show Items Table' },
                    { key: 'showTotals', label: 'Show Totals Section' },
                    { key: 'showRemarks', label: 'Show Remarks' },
                    { key: 'showTerms', label: 'Show Terms & Conditions' },
                  ].map(({ key, label }) => (
                    <div key={key} className="flex items-center gap-2 p-2 hover:bg-white rounded transition-colors">
                      <input
                        type="checkbox"
                        checked={settings.sections[key as keyof typeof settings.sections]}
                        onChange={(e) => updateSettings('sections', key, e.target.checked)}
                        className="w-4 h-4 text-[#bb2738] border-slate-300 rounded focus:ring-[#bb2738]"
                      />
                      <label className="text-sm font-medium text-slate-700">{label}</label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-3 bg-slate-50 p-4 rounded-lg border border-slate-200">
                <h4 className="font-medium text-slate-700 mb-3 flex items-center gap-2">
                  <Layout className="w-4 h-4" />
                  Table Columns
                </h4>
                <div className="space-y-2">
                  {[
                    { key: 'showItemNumbers', label: 'Item Numbers' },
                    { key: 'showLocation', label: 'Location' },
                    { key: 'showType', label: 'Type' },
                    { key: 'showDimensions', label: 'Dimensions (Height/Width)' },
                    { key: 'showQuantity', label: 'Quantity' },
                    { key: 'showArea', label: 'Area' },
                    { key: 'showChargeableArea', label: 'Chargeable Area' },
                    { key: 'showUnitPrice', label: 'Unit Price' },
                    { key: 'showTotal', label: 'Total' },
                  ].map(({ key, label }) => (
                    <div key={key} className="flex items-center gap-2 p-2 hover:bg-white rounded transition-colors">
                      <input
                        type="checkbox"
                        checked={settings.table[key as keyof typeof settings.table]}
                        onChange={(e) => updateSettings('table', key, e.target.checked)}
                        className="w-4 h-4 text-[#bb2738] border-slate-300 rounded focus:ring-[#bb2738]"
                      />
                      <label className="text-sm font-medium text-slate-700">{label}</label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'advanced' && (
          <div className="space-y-6 p-6">
            <div className="bg-gradient-to-r from-slate-50 to-gray-50 rounded-lg p-4 border border-slate-200">
              <div className="flex items-center gap-3">
                <div className="bg-white p-2 rounded-lg shadow-sm">
                  <Settings className="w-5 h-5 text-slate-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-800">Advanced Options</h3>
                  <p className="text-sm text-slate-600">Fine-tune headers, footers, watermarks, and terms</p>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="border border-slate-200 rounded-lg p-4 bg-slate-50">
                <h4 className="font-medium text-slate-700 mb-4 flex items-center gap-2">
                  <Image className="w-4 h-4" />
                  Header Settings
                </h4>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={settings.header.showHeader}
                      onChange={(e) => updateSettings('header', 'showHeader', e.target.checked)}
                      className="w-4 h-4 text-[#bb2738] border-slate-300 rounded focus:ring-[#bb2738]"
                    />
                    <label className="text-sm font-medium text-slate-700">Show Header</label>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Header Style</label>
                    <select
                      value={settings.header.headerStyle}
                      onChange={(e) => updateSettings('header', 'headerStyle', e.target.value as any)}
                      className="w-full px-4 py-2.5 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-[#bb2738]"
                    >
                      <option value="simple">Simple</option>
                      <option value="gradient">Gradient</option>
                      <option value="bordered">Bordered</option>
                      <option value="letterhead">Letterhead</option>
                    </select>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={settings.header.showCompanyInfo}
                      onChange={(e) => updateSettings('header', 'showCompanyInfo', e.target.checked)}
                      className="w-4 h-4 text-[#bb2738] border-slate-300 rounded focus:ring-[#bb2738]"
                    />
                    <label className="text-sm font-medium text-slate-700">Show Company Info</label>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={settings.header.showTagline}
                      onChange={(e) => updateSettings('header', 'showTagline', e.target.checked)}
                      className="w-4 h-4 text-[#bb2738] border-slate-300 rounded focus:ring-[#bb2738]"
                    />
                    <label className="text-sm font-medium text-slate-700">Show Tagline</label>
                  </div>
                </div>
              </div>

              <div className="border border-slate-200 rounded-lg p-4 bg-slate-50">
                <h4 className="font-medium text-slate-700 mb-4">Footer Settings</h4>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={settings.footer.showFooter}
                      onChange={(e) => updateSettings('footer', 'showFooter', e.target.checked)}
                      className="w-4 h-4 text-[#bb2738] border-slate-300 rounded focus:ring-[#bb2738]"
                    />
                    <label className="text-sm font-medium text-slate-700">Show Footer</label>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Footer Style</label>
                    <select
                      value={settings.footer.footerStyle}
                      onChange={(e) => updateSettings('footer', 'footerStyle', e.target.value as any)}
                      className="w-full px-4 py-2.5 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-[#bb2738]"
                    >
                      <option value="simple">Simple</option>
                      <option value="gradient">Gradient</option>
                      <option value="bordered">Bordered</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Footer Text</label>
                    <input
                      type="text"
                      value={settings.footer.footerText}
                      onChange={(e) => updateSettings('footer', 'footerText', e.target.value)}
                      className="w-full px-4 py-2.5 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-[#bb2738]"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={settings.footer.showPageNumbers}
                      onChange={(e) => updateSettings('footer', 'showPageNumbers', e.target.checked)}
                      className="w-4 h-4 text-[#bb2738] border-slate-300 rounded focus:ring-[#bb2738]"
                    />
                    <label className="text-sm font-medium text-slate-700">Show Page Numbers</label>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={settings.footer.showGenerationDate}
                      onChange={(e) => updateSettings('footer', 'showGenerationDate', e.target.checked)}
                      className="w-4 h-4 text-[#bb2738] border-slate-300 rounded focus:ring-[#bb2738]"
                    />
                    <label className="text-sm font-medium text-slate-700">Show Generation Date</label>
                  </div>
                </div>
              </div>

              <div className="border border-slate-200 rounded-lg p-4 bg-slate-50">
                <h4 className="font-medium text-slate-700 mb-4">Watermark Settings</h4>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={settings.watermark.enableWatermark}
                      onChange={(e) => updateSettings('watermark', 'enableWatermark', e.target.checked)}
                      className="w-4 h-4 text-[#bb2738] border-slate-300 rounded focus:ring-[#bb2738]"
                    />
                    <label className="text-sm font-medium text-slate-700">Enable Watermark</label>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Watermark Text</label>
                    <input
                      type="text"
                      value={settings.watermark.watermarkText}
                      onChange={(e) => updateSettings('watermark', 'watermarkText', e.target.value)}
                      className="w-full px-4 py-2.5 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-[#bb2738]"
                      disabled={!settings.watermark.enableWatermark}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Opacity: <span className="text-[#bb2738] font-semibold">{settings.watermark.watermarkOpacity}</span>
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={settings.watermark.watermarkOpacity}
                      onChange={(e) => updateSettings('watermark', 'watermarkOpacity', parseFloat(e.target.value))}
                      className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#bb2738]"
                      disabled={!settings.watermark.enableWatermark}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Angle: <span className="text-[#bb2738] font-semibold">{settings.watermark.watermarkAngle}°</span>
                    </label>
                    <input
                      type="range"
                      min="-90"
                      max="90"
                      step="5"
                      value={settings.watermark.watermarkAngle}
                      onChange={(e) => updateSettings('watermark', 'watermarkAngle', parseInt(e.target.value))}
                      className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#bb2738]"
                      disabled={!settings.watermark.enableWatermark}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Font Size: <span className="text-[#bb2738] font-semibold">{settings.watermark.watermarkFontSize}pt</span>
                    </label>
                    <input
                      type="range"
                      min="20"
                      max="200"
                      value={settings.watermark.watermarkFontSize}
                      onChange={(e) => updateSettings('watermark', 'watermarkFontSize', parseInt(e.target.value))}
                      className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#bb2738]"
                      disabled={!settings.watermark.enableWatermark}
                    />
                  </div>
                </div>
              </div>

              <div className="border border-slate-300 rounded-lg p-6 bg-gradient-to-br from-slate-50 via-white to-slate-50 shadow-sm">
                <h4 className="font-semibold text-slate-800 mb-4 flex items-center gap-2 text-lg">
                  <FileText className="w-5 h-5 text-[#bb2738]" />
                  Document Notes & Legal Terms
                  <span className="text-xs font-normal text-slate-500 ml-auto">Displayed on PDF</span>
                </h4>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-white rounded-lg p-4 border-2 border-yellow-300 shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
                          <FileText className="w-4 h-4 text-yellow-700" />
                        </div>
                        <div>
                          <h5 className="font-semibold text-slate-800 text-sm">Remarks & Notes</h5>
                          <p className="text-xs text-slate-500">Important information for customers</p>
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        checked={settings.remarks?.showRemarks !== false}
                        onChange={(e) => updateSettings('remarks', 'showRemarks', e.target.checked)}
                        className="w-4 h-4 text-[#bb2738] border-slate-300 rounded focus:ring-[#bb2738]"
                      />
                    </div>

                    <div className="mb-3">
                      <label className="block text-xs font-medium text-slate-600 mb-1">Section Title</label>
                      <input
                        type="text"
                        value={settings.remarks?.remarksTitle || 'REMARKS & NOTES'}
                        onChange={(e) => updateSettings('remarks', 'remarksTitle', e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-[#bb2738] bg-yellow-50"
                        placeholder="REMARKS & NOTES"
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="block text-xs font-medium text-slate-600">Content Lines</label>
                        <button
                          type="button"
                          onClick={addRemark}
                          className="flex items-center gap-1 text-xs text-[#bb2738] hover:text-[#a01f2f] font-medium"
                        >
                          <PlusCircle className="w-3 h-3" />
                          Add Line
                        </button>
                      </div>
                      <div className="space-y-2 max-h-72 overflow-y-auto bg-yellow-50/50 p-2 rounded-lg">
                        {(settings.remarks?.remarksContent || []).map((remark, index) => (
                          <div
                            key={index}
                            draggable
                            onDragStart={() => handleDragStart(index, 'remarks')}
                            onDragOver={(e) => handleDragOver(e, index, 'remarks')}
                            onDragEnd={handleDragEnd}
                            className={`flex gap-2 p-2 rounded-lg transition-all ${
                              draggedIndex === index && draggedType === 'remarks' ? 'opacity-50 bg-yellow-100' : 'bg-white hover:bg-yellow-50'
                            } border border-yellow-300`}
                          >
                            <button
                              type="button"
                              className="p-1 text-slate-400 hover:text-slate-600 cursor-move"
                            >
                              <GripVertical className="w-3 h-3" />
                            </button>
                            <input
                              type="text"
                              value={remark}
                              onChange={(e) => updateRemark(index, e.target.value)}
                              className="flex-1 px-2 py-1.5 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-[#bb2738] text-xs"
                              placeholder="Add remark or note..."
                            />
                            <button
                              type="button"
                              onClick={() => removeRemark(index)}
                              className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-lg p-4 border-2 border-sky-300 shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-sky-100 rounded-lg flex items-center justify-center">
                          <FileText className="w-4 h-4 text-sky-700" />
                        </div>
                        <div>
                          <h5 className="font-semibold text-slate-800 text-sm">Terms & Conditions</h5>
                          <p className="text-xs text-slate-500">Legal terms and policies</p>
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        checked={settings.terms.showTerms}
                        onChange={(e) => updateSettings('terms', 'showTerms', e.target.checked)}
                        className="w-4 h-4 text-[#bb2738] border-slate-300 rounded focus:ring-[#bb2738]"
                      />
                    </div>

                    <div className="mb-3">
                      <label className="block text-xs font-medium text-slate-600 mb-1">Section Title</label>
                      <input
                        type="text"
                        value={settings.terms.termsTitle}
                        onChange={(e) => updateSettings('terms', 'termsTitle', e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-[#bb2738] bg-sky-50"
                        placeholder="TERMS & CONDITIONS"
                      />
                    </div>

                    <div className="mb-3">
                      <label className="block text-xs font-medium text-slate-600 mb-1">Display Style</label>
                      <select
                        value={settings.terms.termsStyle}
                        onChange={(e) => updateSettings('terms', 'termsStyle', e.target.value as any)}
                        className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-[#bb2738]"
                      >
                        <option value="simple">Simple</option>
                        <option value="bordered">Bordered</option>
                        <option value="box">Box</option>
                      </select>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="block text-xs font-medium text-slate-600">Content Lines</label>
                        <button
                          type="button"
                          onClick={addTerm}
                          className="flex items-center gap-1 text-xs text-[#bb2738] hover:text-[#a01f2f] font-medium"
                        >
                          <PlusCircle className="w-3 h-3" />
                          Add Line
                        </button>
                      </div>
                      <div className="space-y-2 max-h-72 overflow-y-auto bg-sky-50/50 p-2 rounded-lg">
                        {settings.terms.termsContent.map((term, index) => (
                          <div
                            key={index}
                            draggable
                            onDragStart={() => handleDragStart(index, 'terms')}
                            onDragOver={(e) => handleDragOver(e, index, 'terms')}
                            onDragEnd={handleDragEnd}
                            className={`flex gap-2 p-2 rounded-lg transition-all ${
                              draggedIndex === index && draggedType === 'terms' ? 'opacity-50 bg-sky-100' : 'bg-white hover:bg-sky-50'
                            } border border-sky-300`}
                          >
                            <button
                              type="button"
                              className="p-1 text-slate-400 hover:text-slate-600 cursor-move"
                            >
                              <GripVertical className="w-3 h-3" />
                            </button>
                            <input
                              type="text"
                              value={term}
                              onChange={(e) => updateTerm(index, e.target.value)}
                              className="flex-1 px-2 py-1.5 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-[#bb2738] text-xs"
                              placeholder="Add term or condition..."
                            />
                            <button
                              type="button"
                              onClick={() => removeTerm(index)}
                              className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-4 bg-slate-100 rounded-lg p-3 border border-slate-300">
                  <p className="text-xs text-slate-600 flex items-center gap-2">
                    <Info className="w-4 h-4 text-slate-500" />
                    <span><strong>Tip:</strong> Remarks appear in a yellow-bordered box, Terms in a blue-bordered box. Drag items to reorder them. Use clear, concise language.</span>
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="bg-gradient-to-r from-blue-50 to-slate-50 border border-blue-200 rounded-lg p-4 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="bg-blue-100 p-2 rounded-lg">
            <Info className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <p className="text-sm text-blue-900 font-medium mb-1">Important Note</p>
            <p className="text-sm text-blue-800">
              Changes to PDF settings will apply to all future {documentLabel} PDFs generated. Existing PDFs will not be affected.
            </p>
          </div>
        </div>
      </div>

      {showSaveModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
            <h3 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
              <Save className="w-5 h-5 text-[#bb2738]" />
              Save as Template
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Template Name</label>
                <input
                  type="text"
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-[#bb2738]"
                  placeholder="e.g., My Custom Design"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Description</label>
                <textarea
                  value={templateDescription}
                  onChange={(e) => setTemplateDescription(e.target.value)}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-[#bb2738]"
                  rows={3}
                  placeholder="Brief description of this template..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Tags (comma-separated)</label>
                <input
                  type="text"
                  value={templateTags}
                  onChange={(e) => setTemplateTags(e.target.value)}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-[#bb2738]"
                  placeholder="e.g., professional, blue, modern"
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={isGlobalTemplate}
                  onChange={(e) => setIsGlobalTemplate(e.target.checked)}
                  className="w-4 h-4 text-[#bb2738] border-slate-300 rounded focus:ring-[#bb2738]"
                />
                <label className="text-sm font-medium text-slate-700">
                  Make this a global template (can be used for all document types)
                </label>
              </div>
            </div>
            <div className="flex items-center gap-3 mt-6">
              <button
                onClick={() => setShowSaveModal(false)}
                className="flex-1 px-4 py-2.5 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-all font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveTemplate}
                disabled={!templateName.trim()}
                className="flex-1 px-4 py-2.5 bg-[#bb2738] text-white rounded-lg hover:bg-[#a01f2f] transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Save Template
              </button>
            </div>
          </div>
        </div>
      )}

      {showEditModal && editingTemplate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
            <h3 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
              <Edit className="w-5 h-5 text-[#bb2738]" />
              Edit Template
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Template Name</label>
                <input
                  type="text"
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-[#bb2738]"
                  placeholder="e.g., My Custom Design"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Description</label>
                <textarea
                  value={templateDescription}
                  onChange={(e) => setTemplateDescription(e.target.value)}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-[#bb2738]"
                  rows={3}
                  placeholder="Brief description of this template..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Tags (comma-separated)</label>
                <input
                  type="text"
                  value={templateTags}
                  onChange={(e) => setTemplateTags(e.target.value)}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-[#bb2738]"
                  placeholder="e.g., professional, blue, modern"
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={isGlobalTemplate}
                  onChange={(e) => setIsGlobalTemplate(e.target.checked)}
                  className="w-4 h-4 text-[#bb2738] border-slate-300 rounded focus:ring-[#bb2738]"
                />
                <label className="text-sm font-medium text-slate-700">
                  Make this a global template (can be used for all document types)
                </label>
              </div>
            </div>
            <div className="flex items-center gap-3 mt-6">
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditingTemplate(null);
                  setTemplateName('');
                  setTemplateDescription('');
                  setTemplateTags('');
                  setIsGlobalTemplate(false);
                }}
                className="flex-1 px-4 py-2.5 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-all font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateTemplate}
                disabled={!templateName.trim()}
                className="flex-1 px-4 py-2.5 bg-[#bb2738] text-white rounded-lg hover:bg-[#a01f2f] transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Update Template
              </button>
            </div>
          </div>
        </div>
      )}

      {showCopyModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
            <h3 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
              <Copy className="w-5 h-5 text-[#bb2738]" />
              Copy Settings To
            </h3>
            <p className="text-sm text-slate-600 mb-4">
              Copy current {documentLabel} settings to another document type
            </p>
            <div className="space-y-2">
              {(['quotes', 'invoices', 'orders', 'warranties', 'siteVisits'] as DocumentType[])
                .filter(type => type !== documentType)
                .map(type => (
                  <button
                    key={type}
                    onClick={() => handleCopySettings(type)}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg hover:border-[#bb2738] hover:bg-red-50 transition-all text-left font-medium text-slate-700 hover:text-[#bb2738]"
                  >
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </button>
                ))}
            </div>
            <button
              onClick={() => setShowCopyModal(false)}
              className="w-full mt-4 px-4 py-2.5 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-all font-medium"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
