import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Plus, Trash2, GripVertical, ExternalLink, Save, ArrowUp, ArrowDown } from 'lucide-react';

interface MenuItem {
  label: string;
  url: string;
  order: number;
  is_external: boolean;
  open_new_tab: boolean;
}

export function NavigationMenuSettings() {
  const [headerMenu, setHeaderMenu] = useState<MenuItem[]>([]);
  const [footerMenu, setFooterMenu] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [pages, setPages] = useState<any[]>([]);

  useEffect(() => {
    fetchMenus();
    fetchPages();
  }, []);

  const fetchPages = async () => {
    try {
      const { data } = await supabase
        .from('pages')
        .select('id, title, slug')
        .eq('is_published', true)
        .order('title');

      if (data) setPages(data);
    } catch (error) {
      console.error('Error fetching pages:', error);
    }
  };

  const fetchMenus = async () => {
    try {
      const { data, error } = await supabase
        .from('portal_settings')
        .select('header_menu, footer_menu')
        .eq('setting_key', 'home_page')
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setHeaderMenu(data.header_menu || []);
        setFooterMenu(data.footer_menu || []);
      }
    } catch (error) {
      console.error('Error fetching menus:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveMenus = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('portal_settings')
        .update({
          header_menu: headerMenu,
          footer_menu: footerMenu,
        })
        .eq('setting_key', 'home_page');

      if (error) throw error;
      alert('Navigation menus saved successfully!');
    } catch (error) {
      console.error('Error saving menus:', error);
      alert('Failed to save navigation menus');
    } finally {
      setSaving(false);
    }
  };

  const addHeaderItem = () => {
    setHeaderMenu([...headerMenu, {
      label: 'New Link',
      url: '/',
      order: headerMenu.length,
      is_external: false,
      open_new_tab: false,
    }]);
  };

  const addFooterItem = () => {
    setFooterMenu([...footerMenu, {
      label: 'New Link',
      url: '/',
      order: footerMenu.length,
      is_external: false,
      open_new_tab: false,
    }]);
  };

  const removeHeaderItem = (index: number) => {
    setHeaderMenu(headerMenu.filter((_, i) => i !== index).map((item, i) => ({ ...item, order: i })));
  };

  const removeFooterItem = (index: number) => {
    setFooterMenu(footerMenu.filter((_, i) => i !== index).map((item, i) => ({ ...item, order: i })));
  };

  const updateHeaderItem = (index: number, field: keyof MenuItem, value: any) => {
    const updated = [...headerMenu];
    updated[index] = { ...updated[index], [field]: value };
    setHeaderMenu(updated);
  };

  const updateFooterItem = (index: number, field: keyof MenuItem, value: any) => {
    const updated = [...footerMenu];
    updated[index] = { ...updated[index], [field]: value };
    setFooterMenu(updated);
  };

  const moveHeaderItem = (index: number, direction: 'up' | 'down') => {
    if (
      (direction === 'up' && index === 0) ||
      (direction === 'down' && index === headerMenu.length - 1)
    ) {
      return;
    }

    const newIndex = direction === 'up' ? index - 1 : index + 1;
    const updated = [...headerMenu];
    [updated[index], updated[newIndex]] = [updated[newIndex], updated[index]];
    setHeaderMenu(updated.map((item, i) => ({ ...item, order: i })));
  };

  const moveFooterItem = (index: number, direction: 'up' | 'down') => {
    if (
      (direction === 'up' && index === 0) ||
      (direction === 'down' && index === footerMenu.length - 1)
    ) {
      return;
    }

    const newIndex = direction === 'up' ? index - 1 : index + 1;
    const updated = [...footerMenu];
    [updated[index], updated[newIndex]] = [updated[newIndex], updated[index]];
    setFooterMenu(updated.map((item, i) => ({ ...item, order: i })));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#bb2738]"></div>
      </div>
    );
  }

  const renderMenuItem = (
    item: MenuItem,
    index: number,
    type: 'header' | 'footer',
    updateFn: (index: number, field: keyof MenuItem, value: any) => void,
    removeFn: (index: number) => void,
    moveFn: (index: number, direction: 'up' | 'down') => void,
    totalItems: number
  ) => (
    <div key={index} className="bg-slate-50 rounded-lg p-4 border border-slate-200">
      <div className="flex items-start gap-4">
        <div className="flex flex-col gap-1 mt-2">
          <button
            onClick={() => moveFn(index, 'up')}
            disabled={index === 0}
            className="p-1 hover:bg-slate-200 rounded disabled:opacity-30 disabled:cursor-not-allowed"
            title="Move up"
          >
            <ArrowUp className="w-4 h-4 text-slate-600" />
          </button>
          <GripVertical className="w-4 h-4 text-slate-400" />
          <button
            onClick={() => moveFn(index, 'down')}
            disabled={index === totalItems - 1}
            className="p-1 hover:bg-slate-200 rounded disabled:opacity-30 disabled:cursor-not-allowed"
            title="Move down"
          >
            <ArrowDown className="w-4 h-4 text-slate-600" />
          </button>
        </div>

        <div className="flex-1 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Label *</label>
              <input
                type="text"
                value={item.label}
                onChange={(e) => updateFn(index, 'label', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-[#bb2738]"
                placeholder="About Us"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">URL *</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={item.url}
                  onChange={(e) => updateFn(index, 'url', e.target.value)}
                  className="flex-1 px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-[#bb2738]"
                  placeholder="/page/about-us"
                />
                <select
                  value=""
                  onChange={(e) => {
                    if (e.target.value) {
                      updateFn(index, 'url', e.target.value);
                    }
                  }}
                  className="px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-[#bb2738] text-sm"
                >
                  <option value="">Quick Select</option>
                  <option value="/">Home</option>
                  <option value="/customer">Customer Portal</option>
                  <option value="/book-visit">Book Site Visit</option>
                  <option value="/submit-request">Submit Request</option>
                  {pages.map((page) => (
                    <option key={page.id} value={`/page/${page.slug}`}>
                      {page.title}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={item.is_external}
                onChange={(e) => updateFn(index, 'is_external', e.target.checked)}
                className="w-4 h-4 text-[#bb2738] border-slate-300 rounded focus:ring-[#bb2738]"
              />
              <span className="text-sm text-slate-700 flex items-center gap-1">
                <ExternalLink className="w-3 h-3" />
                External Link
              </span>
            </label>

            {item.is_external && (
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={item.open_new_tab}
                  onChange={(e) => updateFn(index, 'open_new_tab', e.target.checked)}
                  className="w-4 h-4 text-[#bb2738] border-slate-300 rounded focus:ring-[#bb2738]"
                />
                <span className="text-sm text-slate-700">Open in New Tab</span>
              </label>
            )}
          </div>
        </div>

        <button
          onClick={() => removeFn(index)}
          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          title="Remove item"
        >
          <Trash2 className="w-5 h-5" />
        </button>
      </div>
    </div>
  );

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Navigation Menus</h2>
          <p className="text-slate-600 mt-1">Manage header and footer navigation links</p>
        </div>
        <button
          onClick={saveMenus}
          disabled={saving}
          className="flex items-center gap-2 px-6 py-2.5 bg-[#bb2738] text-white rounded-lg hover:bg-[#a01f2f] transition-colors disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          {saving ? 'Saving...' : 'Save Menus'}
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-slate-800">Header Menu</h3>
          <button
            onClick={addHeaderItem}
            className="flex items-center gap-2 px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Item
          </button>
        </div>

        <div className="space-y-3">
          {headerMenu.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              No header menu items. Click "Add Item" to create one.
            </div>
          ) : (
            headerMenu.map((item, index) =>
              renderMenuItem(item, index, 'header', updateHeaderItem, removeHeaderItem, moveHeaderItem, headerMenu.length)
            )
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-slate-800">Footer Menu</h3>
          <button
            onClick={addFooterItem}
            className="flex items-center gap-2 px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Item
          </button>
        </div>

        <div className="space-y-3">
          {footerMenu.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              No footer menu items. Click "Add Item" to create one.
            </div>
          ) : (
            footerMenu.map((item, index) =>
              renderMenuItem(item, index, 'footer', updateFooterItem, removeFooterItem, moveFooterItem, footerMenu.length)
            )
          )}
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-semibold text-blue-900 mb-2">Tips:</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Use the arrow buttons to reorder menu items</li>
          <li>• Internal links should start with / (e.g., /page/about-us)</li>
          <li>• External links should include http:// or https://</li>
          <li>• Use "Quick Select" to easily choose from available pages</li>
          <li>• Enable "Open in New Tab" for external links to improve user experience</li>
        </ul>
      </div>
    </div>
  );
}
