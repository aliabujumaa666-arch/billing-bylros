import { useState } from 'react';
import { PDFSettings, DocumentType } from '../contexts/BrandContext';
import { Type, Palette, Layout, Image, FileText, Eye, Settings, PlusCircle, Trash2 } from 'lucide-react';

interface DocumentPDFSettingsProps {
  documentType: DocumentType;
  documentLabel: string;
  settings: PDFSettings;
  onUpdate: (settings: PDFSettings) => void;
}

export function DocumentPDFSettings({ documentLabel, settings, onUpdate }: DocumentPDFSettingsProps) {
  const [activeTab, setActiveTab] = useState<'fonts' | 'colors' | 'layout' | 'sections' | 'advanced'>('fonts');

  const updateSettings = (section: keyof PDFSettings, field: string, value: any) => {
    onUpdate({
      ...settings,
      [section]: {
        ...settings[section],
        [field]: value,
      },
    });
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

  const tabs = [
    { id: 'fonts', label: 'Fonts & Typography', icon: Type },
    { id: 'colors', label: 'Colors', icon: Palette },
    { id: 'layout', label: 'Layout & Spacing', icon: Layout },
    { id: 'sections', label: 'Sections & Visibility', icon: Eye },
    { id: 'advanced', label: 'Advanced Options', icon: Settings },
  ] as const;

  return (
    <div className="space-y-6">
      <div className="border-b border-slate-200">
        <div className="flex space-x-1 overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-[#bb2738] text-[#bb2738] font-medium'
                    : 'border-transparent text-slate-600 hover:text-slate-800 hover:border-slate-300'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="bg-white rounded-lg border border-slate-200 p-6">
        {activeTab === 'fonts' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                <Type className="w-5 h-5" />
                Font Settings
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Header Font Family</label>
                  <select
                    value={settings.fonts.headerFont}
                    onChange={(e) => updateSettings('fonts', 'headerFont', e.target.value)}
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-[#bb2738]"
                  >
                    <option value="helvetica">Helvetica</option>
                    <option value="times">Times</option>
                    <option value="courier">Courier</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Body Font Family</label>
                  <select
                    value={settings.fonts.bodyFont}
                    onChange={(e) => updateSettings('fonts', 'bodyFont', e.target.value)}
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-[#bb2738]"
                  >
                    <option value="helvetica">Helvetica</option>
                    <option value="times">Times</option>
                    <option value="courier">Courier</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Header Font Size</label>
                  <input
                    type="number"
                    min="10"
                    max="40"
                    value={settings.fonts.headerFontSize}
                    onChange={(e) => updateSettings('fonts', 'headerFontSize', parseInt(e.target.value))}
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-[#bb2738]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Body Font Size</label>
                  <input
                    type="number"
                    min="6"
                    max="16"
                    value={settings.fonts.bodyFontSize}
                    onChange={(e) => updateSettings('fonts', 'bodyFontSize', parseInt(e.target.value))}
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-[#bb2738]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Table Font Size</label>
                  <input
                    type="number"
                    min="6"
                    max="14"
                    value={settings.fonts.tableFontSize}
                    onChange={(e) => updateSettings('fonts', 'tableFontSize', parseInt(e.target.value))}
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-[#bb2738]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Footer Font Size</label>
                  <input
                    type="number"
                    min="6"
                    max="12"
                    value={settings.fonts.footerFontSize}
                    onChange={(e) => updateSettings('fonts', 'footerFontSize', parseInt(e.target.value))}
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-[#bb2738]"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'colors' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                <Palette className="w-5 h-5" />
                Color Settings
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Table Header Background</label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={settings.colors.tableHeaderBg}
                      onChange={(e) => updateSettings('colors', 'tableHeaderBg', e.target.value)}
                      className="h-11 w-16 border border-slate-300 rounded cursor-pointer"
                    />
                    <input
                      type="text"
                      value={settings.colors.tableHeaderBg}
                      onChange={(e) => updateSettings('colors', 'tableHeaderBg', e.target.value)}
                      className="flex-1 px-4 py-2.5 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-[#bb2738]"
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
                      className="h-11 w-16 border border-slate-300 rounded cursor-pointer"
                    />
                    <input
                      type="text"
                      value={settings.colors.tableHeaderText}
                      onChange={(e) => updateSettings('colors', 'tableHeaderText', e.target.value)}
                      className="flex-1 px-4 py-2.5 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-[#bb2738]"
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
                      className="h-11 w-16 border border-slate-300 rounded cursor-pointer"
                    />
                    <input
                      type="text"
                      value={settings.colors.tableRowAlternate}
                      onChange={(e) => updateSettings('colors', 'tableRowAlternate', e.target.value)}
                      className="flex-1 px-4 py-2.5 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-[#bb2738]"
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
                      className="h-11 w-16 border border-slate-300 rounded cursor-pointer"
                    />
                    <input
                      type="text"
                      value={settings.colors.tableBorder}
                      onChange={(e) => updateSettings('colors', 'tableBorder', e.target.value)}
                      className="flex-1 px-4 py-2.5 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-[#bb2738]"
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
                      className="h-11 w-16 border border-slate-300 rounded cursor-pointer"
                    />
                    <input
                      type="text"
                      value={settings.colors.accentColor}
                      onChange={(e) => updateSettings('colors', 'accentColor', e.target.value)}
                      className="flex-1 px-4 py-2.5 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-[#bb2738]"
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
                      className="h-11 w-16 border border-slate-300 rounded cursor-pointer"
                    />
                    <input
                      type="text"
                      value={settings.colors.textPrimary}
                      onChange={(e) => updateSettings('colors', 'textPrimary', e.target.value)}
                      className="flex-1 px-4 py-2.5 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-[#bb2738]"
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
                      className="h-11 w-16 border border-slate-300 rounded cursor-pointer"
                    />
                    <input
                      type="text"
                      value={settings.colors.textSecondary}
                      onChange={(e) => updateSettings('colors', 'textSecondary', e.target.value)}
                      className="flex-1 px-4 py-2.5 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-[#bb2738]"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'layout' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                <Layout className="w-5 h-5" />
                Layout & Spacing
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-medium text-slate-700">Page Margins (mm)</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Top</label>
                      <input
                        type="number"
                        min="0"
                        max="50"
                        value={settings.layout.marginTop}
                        onChange={(e) => updateSettings('layout', 'marginTop', parseInt(e.target.value))}
                        className="w-full px-4 py-2.5 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-[#bb2738]"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Right</label>
                      <input
                        type="number"
                        min="0"
                        max="50"
                        value={settings.layout.marginRight}
                        onChange={(e) => updateSettings('layout', 'marginRight', parseInt(e.target.value))}
                        className="w-full px-4 py-2.5 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-[#bb2738]"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Bottom</label>
                      <input
                        type="number"
                        min="0"
                        max="50"
                        value={settings.layout.marginBottom}
                        onChange={(e) => updateSettings('layout', 'marginBottom', parseInt(e.target.value))}
                        className="w-full px-4 py-2.5 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-[#bb2738]"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Left</label>
                      <input
                        type="number"
                        min="0"
                        max="50"
                        value={settings.layout.marginLeft}
                        onChange={(e) => updateSettings('layout', 'marginLeft', parseInt(e.target.value))}
                        className="w-full px-4 py-2.5 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-[#bb2738]"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium text-slate-700">Section Dimensions</h4>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Header Height (mm)</label>
                      <input
                        type="number"
                        min="20"
                        max="100"
                        value={settings.layout.headerHeight}
                        onChange={(e) => updateSettings('layout', 'headerHeight', parseInt(e.target.value))}
                        className="w-full px-4 py-2.5 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-[#bb2738]"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Footer Height (mm)</label>
                      <input
                        type="number"
                        min="10"
                        max="50"
                        value={settings.layout.footerHeight}
                        onChange={(e) => updateSettings('layout', 'footerHeight', parseInt(e.target.value))}
                        className="w-full px-4 py-2.5 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-[#bb2738]"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Content Spacing (mm)</label>
                      <input
                        type="number"
                        min="2"
                        max="20"
                        value={settings.layout.contentSpacing}
                        onChange={(e) => updateSettings('layout', 'contentSpacing', parseInt(e.target.value))}
                        className="w-full px-4 py-2.5 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-[#bb2738]"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium text-slate-700">Logo Settings</h4>
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
                        <label className="block text-sm font-medium text-slate-700 mb-2">Width (mm)</label>
                        <input
                          type="number"
                          min="10"
                          max="100"
                          value={settings.logo.logoWidth}
                          onChange={(e) => updateSettings('logo', 'logoWidth', parseInt(e.target.value))}
                          className="w-full px-4 py-2.5 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-[#bb2738]"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Height (mm)</label>
                        <input
                          type="number"
                          min="10"
                          max="100"
                          value={settings.logo.logoHeight}
                          onChange={(e) => updateSettings('logo', 'logoHeight', parseInt(e.target.value))}
                          className="w-full px-4 py-2.5 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-[#bb2738]"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
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
          </div>
        )}

        {activeTab === 'sections' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                <Eye className="w-5 h-5" />
                Section Visibility
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <h4 className="font-medium text-slate-700 mb-3">Main Sections</h4>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={settings.sections.showQuoteDetails}
                      onChange={(e) => updateSettings('sections', 'showQuoteDetails', e.target.checked)}
                      className="w-4 h-4 text-[#bb2738] border-slate-300 rounded focus:ring-[#bb2738]"
                    />
                    <label className="text-sm font-medium text-slate-700">Show Quote Details</label>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={settings.sections.showCustomerInfo}
                      onChange={(e) => updateSettings('sections', 'showCustomerInfo', e.target.checked)}
                      className="w-4 h-4 text-[#bb2738] border-slate-300 rounded focus:ring-[#bb2738]"
                    />
                    <label className="text-sm font-medium text-slate-700">Show Customer Information</label>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={settings.sections.showItemsTable}
                      onChange={(e) => updateSettings('sections', 'showItemsTable', e.target.checked)}
                      className="w-4 h-4 text-[#bb2738] border-slate-300 rounded focus:ring-[#bb2738]"
                    />
                    <label className="text-sm font-medium text-slate-700">Show Items Table</label>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={settings.sections.showTotals}
                      onChange={(e) => updateSettings('sections', 'showTotals', e.target.checked)}
                      className="w-4 h-4 text-[#bb2738] border-slate-300 rounded focus:ring-[#bb2738]"
                    />
                    <label className="text-sm font-medium text-slate-700">Show Totals Section</label>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={settings.sections.showRemarks}
                      onChange={(e) => updateSettings('sections', 'showRemarks', e.target.checked)}
                      className="w-4 h-4 text-[#bb2738] border-slate-300 rounded focus:ring-[#bb2738]"
                    />
                    <label className="text-sm font-medium text-slate-700">Show Remarks</label>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={settings.sections.showTerms}
                      onChange={(e) => updateSettings('sections', 'showTerms', e.target.checked)}
                      className="w-4 h-4 text-[#bb2738] border-slate-300 rounded focus:ring-[#bb2738]"
                    />
                    <label className="text-sm font-medium text-slate-700">Show Terms & Conditions</label>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="font-medium text-slate-700 mb-3">Table Columns</h4>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={settings.table.showItemNumbers}
                      onChange={(e) => updateSettings('table', 'showItemNumbers', e.target.checked)}
                      className="w-4 h-4 text-[#bb2738] border-slate-300 rounded focus:ring-[#bb2738]"
                    />
                    <label className="text-sm font-medium text-slate-700">Item Numbers</label>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={settings.table.showLocation}
                      onChange={(e) => updateSettings('table', 'showLocation', e.target.checked)}
                      className="w-4 h-4 text-[#bb2738] border-slate-300 rounded focus:ring-[#bb2738]"
                    />
                    <label className="text-sm font-medium text-slate-700">Location</label>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={settings.table.showType}
                      onChange={(e) => updateSettings('table', 'showType', e.target.checked)}
                      className="w-4 h-4 text-[#bb2738] border-slate-300 rounded focus:ring-[#bb2738]"
                    />
                    <label className="text-sm font-medium text-slate-700">Type</label>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={settings.table.showDimensions}
                      onChange={(e) => updateSettings('table', 'showDimensions', e.target.checked)}
                      className="w-4 h-4 text-[#bb2738] border-slate-300 rounded focus:ring-[#bb2738]"
                    />
                    <label className="text-sm font-medium text-slate-700">Dimensions (Height/Width)</label>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={settings.table.showQuantity}
                      onChange={(e) => updateSettings('table', 'showQuantity', e.target.checked)}
                      className="w-4 h-4 text-[#bb2738] border-slate-300 rounded focus:ring-[#bb2738]"
                    />
                    <label className="text-sm font-medium text-slate-700">Quantity</label>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={settings.table.showArea}
                      onChange={(e) => updateSettings('table', 'showArea', e.target.checked)}
                      className="w-4 h-4 text-[#bb2738] border-slate-300 rounded focus:ring-[#bb2738]"
                    />
                    <label className="text-sm font-medium text-slate-700">Area</label>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={settings.table.showChargeableArea}
                      onChange={(e) => updateSettings('table', 'showChargeableArea', e.target.checked)}
                      className="w-4 h-4 text-[#bb2738] border-slate-300 rounded focus:ring-[#bb2738]"
                    />
                    <label className="text-sm font-medium text-slate-700">Chargeable Area</label>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={settings.table.showUnitPrice}
                      onChange={(e) => updateSettings('table', 'showUnitPrice', e.target.checked)}
                      className="w-4 h-4 text-[#bb2738] border-slate-300 rounded focus:ring-[#bb2738]"
                    />
                    <label className="text-sm font-medium text-slate-700">Unit Price</label>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={settings.table.showTotal}
                      onChange={(e) => updateSettings('table', 'showTotal', e.target.checked)}
                      className="w-4 h-4 text-[#bb2738] border-slate-300 rounded focus:ring-[#bb2738]"
                    />
                    <label className="text-sm font-medium text-slate-700">Total</label>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'advanced' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Advanced Options
              </h3>

              <div className="space-y-6">
                <div className="border border-slate-200 rounded-lg p-4">
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

                <div className="border border-slate-200 rounded-lg p-4">
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

                <div className="border border-slate-200 rounded-lg p-4">
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
                        Opacity: {settings.watermark.watermarkOpacity}
                      </label>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.05"
                        value={settings.watermark.watermarkOpacity}
                        onChange={(e) => updateSettings('watermark', 'watermarkOpacity', parseFloat(e.target.value))}
                        className="w-full"
                        disabled={!settings.watermark.enableWatermark}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Angle: {settings.watermark.watermarkAngle}°
                      </label>
                      <input
                        type="range"
                        min="-90"
                        max="90"
                        step="5"
                        value={settings.watermark.watermarkAngle}
                        onChange={(e) => updateSettings('watermark', 'watermarkAngle', parseInt(e.target.value))}
                        className="w-full"
                        disabled={!settings.watermark.enableWatermark}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Font Size</label>
                      <input
                        type="number"
                        min="20"
                        max="200"
                        value={settings.watermark.watermarkFontSize}
                        onChange={(e) => updateSettings('watermark', 'watermarkFontSize', parseInt(e.target.value))}
                        className="w-full px-4 py-2.5 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-[#bb2738]"
                        disabled={!settings.watermark.enableWatermark}
                      />
                    </div>
                  </div>
                </div>

                <div className="border border-slate-200 rounded-lg p-4">
                  <h4 className="font-medium text-slate-700 mb-4 flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    Terms & Conditions
                  </h4>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={settings.terms.showTerms}
                        onChange={(e) => updateSettings('terms', 'showTerms', e.target.checked)}
                        className="w-4 h-4 text-[#bb2738] border-slate-300 rounded focus:ring-[#bb2738]"
                      />
                      <label className="text-sm font-medium text-slate-700">Show Terms & Conditions</label>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Title</label>
                      <input
                        type="text"
                        value={settings.terms.termsTitle}
                        onChange={(e) => updateSettings('terms', 'termsTitle', e.target.value)}
                        className="w-full px-4 py-2.5 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-[#bb2738]"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Style</label>
                      <select
                        value={settings.terms.termsStyle}
                        onChange={(e) => updateSettings('terms', 'termsStyle', e.target.value as any)}
                        className="w-full px-4 py-2.5 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-[#bb2738]"
                      >
                        <option value="simple">Simple</option>
                        <option value="bordered">Bordered</option>
                        <option value="box">Box</option>
                      </select>
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="block text-sm font-medium text-slate-700">Terms Content</label>
                        <button
                          type="button"
                          onClick={addTerm}
                          className="flex items-center gap-1 text-sm text-[#bb2738] hover:underline"
                        >
                          <PlusCircle className="w-4 h-4" />
                          Add Term
                        </button>
                      </div>
                      <div className="space-y-2 max-h-64 overflow-y-auto">
                        {settings.terms.termsContent.map((term, index) => (
                          <div key={index} className="flex gap-2">
                            <input
                              type="text"
                              value={term}
                              onChange={(e) => updateTerm(index, e.target.value)}
                              className="flex-1 px-4 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-[#bb2738] text-sm"
                            />
                            <button
                              type="button"
                              onClick={() => removeTerm(index)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          <strong>Note:</strong> Changes to PDF settings will apply to all future {documentLabel} PDFs generated. Existing PDFs will not be affected.
        </p>
      </div>
    </div>
  );
}
