import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useToast } from '../contexts/ToastContext';
import { Keyboard, Save, RotateCcw, Plus, Trash2, X, Edit2 } from 'lucide-react';

interface KeyboardShortcut {
  id: string;
  user_id: string | null;
  shortcut_key: string;
  ctrl_key: boolean;
  shift_key: boolean;
  alt_key: boolean;
  action: string;
  description: string;
  is_enabled: boolean;
  is_custom: boolean;
}

export function KeyboardShortcutSettings() {
  const { success, error: showError } = useToast();
  const [shortcuts, setShortcuts] = useState<KeyboardShortcut[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingShortcut, setEditingShortcut] = useState<KeyboardShortcut | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [formData, setFormData] = useState({
    shortcut_key: '',
    ctrl_key: false,
    shift_key: false,
    alt_key: false,
    action: '',
    description: '',
    is_enabled: true,
  });

  const availableActions = [
    { value: 'navigate:dashboard', label: 'Go to Dashboard' },
    { value: 'navigate:customers', label: 'Go to Customers' },
    { value: 'navigate:quotes', label: 'Go to Quotes' },
    { value: 'navigate:visits', label: 'Go to Site Visits' },
    { value: 'navigate:orders', label: 'Go to Orders' },
    { value: 'navigate:invoices', label: 'Go to Invoices' },
    { value: 'navigate:tracker', label: 'Go to Order Tracker' },
    { value: 'navigate:production-workflow', label: 'Go to Production Workflow' },
    { value: 'navigate:inventory', label: 'Go to Inventory' },
    { value: 'navigate:calendar', label: 'Go to Calendar' },
    { value: 'navigate:installation-tasks', label: 'Go to Installation Tasks' },
    { value: 'navigate:warranty-feedback', label: 'Go to Warranty & Feedback' },
    { value: 'navigate:portal-settings', label: 'Go to Portal Settings' },
    { value: 'navigate:knowledge-base', label: 'Go to Knowledge Base' },
    { value: 'navigate:faq-management', label: 'Go to FAQs' },
    { value: 'navigate:video-tutorials', label: 'Go to Video Tutorials' },
    { value: 'navigate:support-tickets', label: 'Go to Support Tickets' },
    { value: 'navigate:messages', label: 'Go to Messages' },
    { value: 'navigate:whatsapp-messaging', label: 'Go to WhatsApp' },
  ];

  useEffect(() => {
    fetchShortcuts();
  }, []);

  const fetchShortcuts = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('keyboard_shortcuts')
        .select('*')
        .or(`user_id.eq.${user.id},user_id.is.null`)
        .order('action');

      if (error) throw error;

      const userShortcuts = (data || []).filter(s => s.user_id === user.id);
      const defaultShortcuts = (data || []).filter(s => s.user_id === null);

      const mergedShortcuts = defaultShortcuts.map(defaultShortcut => {
        const userOverride = userShortcuts.find(us => us.action === defaultShortcut.action);
        return userOverride || defaultShortcut;
      });

      const customShortcuts = userShortcuts.filter(
        us => !defaultShortcuts.some(ds => ds.action === us.action)
      );

      setShortcuts([...mergedShortcuts, ...customShortcuts]);
    } catch (err) {
      console.error('Error fetching shortcuts:', err);
      showError('Failed to load keyboard shortcuts');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isRecording) return;

    e.preventDefault();
    e.stopPropagation();

    if (['Control', 'Shift', 'Alt', 'Meta'].includes(e.key)) return;

    setFormData({
      ...formData,
      shortcut_key: e.key,
      ctrl_key: e.ctrlKey || e.metaKey,
      shift_key: e.shiftKey,
      alt_key: e.altKey,
    });

    setIsRecording(false);
  };

  const handleSave = async () => {
    if (!formData.shortcut_key || !formData.action) {
      showError('Please fill in all required fields');
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const existingShortcut = shortcuts.find(
        s => s.shortcut_key === formData.shortcut_key &&
             s.ctrl_key === formData.ctrl_key &&
             s.shift_key === formData.shift_key &&
             s.alt_key === formData.alt_key &&
             s.id !== editingShortcut?.id
      );

      if (existingShortcut) {
        showError('This key combination is already in use');
        return;
      }

      if (editingShortcut) {
        if (editingShortcut.user_id === null) {
          const { error } = await supabase
            .from('keyboard_shortcuts')
            .insert([{
              user_id: user.id,
              ...formData,
              is_custom: true,
            }]);

          if (error) throw error;
        } else {
          const { error } = await supabase
            .from('keyboard_shortcuts')
            .update(formData)
            .eq('id', editingShortcut.id);

          if (error) throw error;
        }
        success('Shortcut updated successfully');
      } else {
        const { error } = await supabase
          .from('keyboard_shortcuts')
          .insert([{
            user_id: user.id,
            ...formData,
            is_custom: true,
          }]);

        if (error) throw error;
        success('Shortcut created successfully');
      }

      setShowModal(false);
      setEditingShortcut(null);
      resetForm();
      fetchShortcuts();
    } catch (err) {
      console.error('Error saving shortcut:', err);
      showError('Failed to save shortcut');
    }
  };

  const handleDelete = async (shortcut: KeyboardShortcut) => {
    if (!shortcut.user_id) {
      showError('Cannot delete system default shortcuts');
      return;
    }

    if (!confirm('Are you sure you want to delete this shortcut?')) return;

    try {
      const { error } = await supabase
        .from('keyboard_shortcuts')
        .delete()
        .eq('id', shortcut.id);

      if (error) throw error;
      success('Shortcut deleted successfully');
      fetchShortcuts();
    } catch (err) {
      console.error('Error deleting shortcut:', err);
      showError('Failed to delete shortcut');
    }
  };

  const handleResetToDefault = async (shortcut: KeyboardShortcut) => {
    if (!shortcut.user_id) {
      showError('This is already a default shortcut');
      return;
    }

    if (!confirm('Reset this shortcut to default?')) return;

    try {
      const { error } = await supabase
        .from('keyboard_shortcuts')
        .delete()
        .eq('id', shortcut.id);

      if (error) throw error;
      success('Shortcut reset to default');
      fetchShortcuts();
    } catch (err) {
      console.error('Error resetting shortcut:', err);
      showError('Failed to reset shortcut');
    }
  };

  const handleToggleEnabled = async (shortcut: KeyboardShortcut) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      if (shortcut.user_id === null) {
        const { error } = await supabase
          .from('keyboard_shortcuts')
          .insert([{
            user_id: user.id,
            shortcut_key: shortcut.shortcut_key,
            ctrl_key: shortcut.ctrl_key,
            shift_key: shortcut.shift_key,
            alt_key: shortcut.alt_key,
            action: shortcut.action,
            description: shortcut.description,
            is_enabled: !shortcut.is_enabled,
            is_custom: true,
          }]);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('keyboard_shortcuts')
          .update({ is_enabled: !shortcut.is_enabled })
          .eq('id', shortcut.id);

        if (error) throw error;
      }

      success(`Shortcut ${!shortcut.is_enabled ? 'enabled' : 'disabled'}`);
      fetchShortcuts();
    } catch (err) {
      console.error('Error toggling shortcut:', err);
      showError('Failed to toggle shortcut');
    }
  };

  const resetForm = () => {
    setFormData({
      shortcut_key: '',
      ctrl_key: false,
      shift_key: false,
      alt_key: false,
      action: '',
      description: '',
      is_enabled: true,
    });
  };

  const openEditModal = (shortcut: KeyboardShortcut) => {
    setEditingShortcut(shortcut);
    setFormData({
      shortcut_key: shortcut.shortcut_key,
      ctrl_key: shortcut.ctrl_key,
      shift_key: shortcut.shift_key,
      alt_key: shortcut.alt_key,
      action: shortcut.action,
      description: shortcut.description,
      is_enabled: shortcut.is_enabled,
    });
    setShowModal(true);
  };

  const formatShortcut = (shortcut: KeyboardShortcut) => {
    const keys = [];
    if (shortcut.ctrl_key) keys.push('Ctrl');
    if (shortcut.shift_key) keys.push('Shift');
    if (shortcut.alt_key) keys.push('Alt');
    keys.push(shortcut.shortcut_key.toUpperCase());
    return keys.join(' + ');
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <Keyboard className="w-8 h-8 text-[#bb2738]" />
          <div>
            <h2 className="text-2xl font-bold text-slate-800">Keyboard Shortcuts</h2>
            <p className="text-sm text-slate-600 mt-1">Customize keyboard shortcuts for quick navigation</p>
          </div>
        </div>
        <button
          onClick={() => {
            resetForm();
            setEditingShortcut(null);
            setShowModal(true);
          }}
          className="flex items-center gap-2 bg-[#bb2738] hover:bg-[#a01f2f] text-white px-4 py-2.5 rounded-lg transition-colors"
        >
          <Plus className="w-5 h-5" />
          Add Custom Shortcut
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-500">Loading...</div>
        ) : shortcuts.length === 0 ? (
          <div className="p-8 text-center text-slate-500">No shortcuts configured</div>
        ) : (
          <div className="divide-y divide-slate-200">
            {shortcuts.map((shortcut) => (
              <div key={shortcut.id} className="p-4 hover:bg-slate-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <kbd className="px-3 py-1.5 bg-slate-100 border border-slate-300 rounded text-sm font-mono text-slate-800">
                        {formatShortcut(shortcut)}
                      </kbd>
                      <span className="text-slate-700 font-medium">{shortcut.description}</span>
                      {shortcut.user_id && (
                        <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full">
                          Custom
                        </span>
                      )}
                      {!shortcut.is_enabled && (
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-xs rounded-full">
                          Disabled
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-slate-500 mt-1">Action: {shortcut.action}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={shortcut.is_enabled}
                        onChange={() => handleToggleEnabled(shortcut)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#bb2738]/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#bb2738]"></div>
                    </label>
                    <button
                      onClick={() => openEditModal(shortcut)}
                      className="p-2 hover:bg-blue-50 text-blue-600 rounded-lg transition-colors"
                      title="Edit"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    {shortcut.user_id && (
                      <>
                        <button
                          onClick={() => handleResetToDefault(shortcut)}
                          className="p-2 hover:bg-slate-100 text-slate-600 rounded-lg transition-colors"
                          title="Reset to Default"
                        >
                          <RotateCcw className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(shortcut)}
                          className="p-2 hover:bg-red-50 text-red-600 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full">
            <div className="flex justify-between items-center p-6 border-b border-slate-200">
              <h2 className="text-xl font-bold text-slate-800">
                {editingShortcut ? 'Edit Shortcut' : 'Add Custom Shortcut'}
              </h2>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-slate-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Shortcut Key</label>
                <div className="flex items-center gap-3">
                  <input
                    type="text"
                    value={formatShortcut({
                      ...formData,
                      id: '',
                      user_id: null,
                      action: '',
                      description: '',
                      is_enabled: true,
                      is_custom: false
                    })}
                    onKeyDown={handleKeyDown}
                    onFocus={() => setIsRecording(true)}
                    onBlur={() => setIsRecording(false)}
                    placeholder={isRecording ? 'Press any key...' : 'Click to record'}
                    readOnly
                    className="flex-1 px-4 py-2.5 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-[#bb2738] cursor-text"
                  />
                  <button
                    onClick={() => setIsRecording(true)}
                    className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors"
                  >
                    {isRecording ? 'Recording...' : 'Record'}
                  </button>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Click the input field and press a key combination
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Action</label>
                <select
                  value={formData.action}
                  onChange={(e) => {
                    const selectedAction = availableActions.find(a => a.value === e.target.value);
                    setFormData({
                      ...formData,
                      action: e.target.value,
                      description: selectedAction?.label || ''
                    });
                  }}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-[#bb2738]"
                >
                  <option value="">Select an action</option>
                  {availableActions.map((action) => (
                    <option key={action.value} value={action.value}>
                      {action.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Description</label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-[#bb2738]"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_enabled"
                  checked={formData.is_enabled}
                  onChange={(e) => setFormData({ ...formData, is_enabled: e.target.checked })}
                  className="w-4 h-4 text-[#bb2738] border-slate-300 rounded focus:ring-[#bb2738]"
                />
                <label htmlFor="is_enabled" className="text-sm text-slate-700">
                  Enable this shortcut
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-3 p-6 border-t border-slate-200">
              <button
                onClick={() => setShowModal(false)}
                className="px-6 py-2.5 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="flex items-center gap-2 px-6 py-2.5 bg-[#bb2738] hover:bg-[#a01f2f] text-white rounded-lg transition-colors"
              >
                <Save className="w-4 h-4" />
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
