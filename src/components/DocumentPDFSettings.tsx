import { useState } from 'react';
import { PDFSettings, DocumentType } from '../contexts/BrandContext';
import { Type, Palette, Layout, Image, FileText, Eye, Settings, PlusCircle, Trash2, HelpCircle, RotateCcw, Save, Sparkles, ChevronDown, ChevronUp, GripVertical, Info } from 'lucide-react';
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

export function DocumentPDFSettings({ documentLabel, settings, onUpdate }: DocumentPDFSettingsProps) {
  const [activeTab, setActiveTab] = useState<'fonts' | 'colors' | 'layout' | 'sections' | 'advanced'>('fonts');
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});
  const [showPreview, setShowPreview] = useState(true);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [draggedType, setDraggedType] = useState<'remarks' | 'terms' | null>(null);

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

  const tabs = [
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

              <div className="border border-slate-200 rounded-lg p-6 bg-gradient-to-br from-yellow-50 via-white to-blue-50">
                <h4 className="font-semibold text-slate-800 mb-4 flex items-center gap-2 text-lg">
                  <FileText className="w-5 h-5 text-amber-600" />
                  Document Notes & Legal Terms
                  <span className="text-xs font-normal text-slate-500 ml-auto">Displayed on PDF</span>
                </h4>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-white rounded-lg p-4 border-2 border-amber-200 shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center">
                          <FileText className="w-4 h-4 text-amber-600" />
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
                        className="w-4 h-4 text-amber-600 border-slate-300 rounded focus:ring-amber-600"
                      />
                    </div>

                    <div className="mb-3">
                      <label className="block text-xs font-medium text-slate-600 mb-1">Section Title</label>
                      <input
                        type="text"
                        value={settings.remarks?.remarksTitle || 'REMARKS & NOTES'}
                        onChange={(e) => updateSettings('remarks', 'remarksTitle', e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-amber-600 bg-amber-50"
                        placeholder="REMARKS & NOTES"
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="block text-xs font-medium text-slate-600">Content Lines</label>
                        <button
                          type="button"
                          onClick={addRemark}
                          className="flex items-center gap-1 text-xs text-amber-600 hover:text-amber-700 font-medium"
                        >
                          <PlusCircle className="w-3 h-3" />
                          Add Line
                        </button>
                      </div>
                      <div className="space-y-2 max-h-72 overflow-y-auto bg-amber-50/50 p-2 rounded-lg">
                        {(settings.remarks?.remarksContent || []).map((remark, index) => (
                          <div
                            key={index}
                            draggable
                            onDragStart={() => handleDragStart(index, 'remarks')}
                            onDragOver={(e) => handleDragOver(e, index, 'remarks')}
                            onDragEnd={handleDragEnd}
                            className={`flex gap-2 p-2 rounded-lg transition-all ${
                              draggedIndex === index && draggedType === 'remarks' ? 'opacity-50 bg-amber-100' : 'bg-white hover:bg-amber-50'
                            } border border-amber-200`}
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
                              className="flex-1 px-2 py-1.5 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-amber-600 text-xs"
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

                  <div className="bg-white rounded-lg p-4 border-2 border-blue-200 shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                          <FileText className="w-4 h-4 text-blue-600" />
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
                        className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-600"
                      />
                    </div>

                    <div className="mb-3">
                      <label className="block text-xs font-medium text-slate-600 mb-1">Section Title</label>
                      <input
                        type="text"
                        value={settings.terms.termsTitle}
                        onChange={(e) => updateSettings('terms', 'termsTitle', e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-600 bg-blue-50"
                        placeholder="TERMS & CONDITIONS"
                      />
                    </div>

                    <div className="mb-3">
                      <label className="block text-xs font-medium text-slate-600 mb-1">Display Style</label>
                      <select
                        value={settings.terms.termsStyle}
                        onChange={(e) => updateSettings('terms', 'termsStyle', e.target.value as any)}
                        className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-600"
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
                          className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium"
                        >
                          <PlusCircle className="w-3 h-3" />
                          Add Line
                        </button>
                      </div>
                      <div className="space-y-2 max-h-72 overflow-y-auto bg-blue-50/50 p-2 rounded-lg">
                        {settings.terms.termsContent.map((term, index) => (
                          <div
                            key={index}
                            draggable
                            onDragStart={() => handleDragStart(index, 'terms')}
                            onDragOver={(e) => handleDragOver(e, index, 'terms')}
                            onDragEnd={handleDragEnd}
                            className={`flex gap-2 p-2 rounded-lg transition-all ${
                              draggedIndex === index && draggedType === 'terms' ? 'opacity-50 bg-blue-100' : 'bg-white hover:bg-blue-50'
                            } border border-blue-200`}
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
                              className="flex-1 px-2 py-1.5 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-600 text-xs"
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

                <div className="mt-4 bg-slate-50 rounded-lg p-3 border border-slate-200">
                  <p className="text-xs text-slate-600 flex items-center gap-2">
                    <Info className="w-4 h-4 text-slate-500" />
                    <span><strong>Tip:</strong> Remarks appear in a yellow box, Terms in a blue box. Drag items to reorder them. Use clear, concise language.</span>
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
    </div>
  );
}
