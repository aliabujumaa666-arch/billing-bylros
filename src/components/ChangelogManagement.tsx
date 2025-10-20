import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Package, Plus, CreditCard as Edit2, Trash2, Eye, EyeOff, Save, X } from 'lucide-react';

export function ChangelogManagement() {
  const [entries, setEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingEntry, setEditingEntry] = useState<any>(null);

  useEffect(() => {
    fetchEntries();
  }, []);

  const fetchEntries = async () => {
    const { data } = await supabase
      .from('changelog_entries')
      .select('*')
      .order('release_date', { ascending: false });

    if (data) setEntries(data);
    setLoading(false);
  };

  const saveEntry = async () => {
    if (!editingEntry.version || !editingEntry.title || !editingEntry.release_date) {
      alert('Version, title, and release date are required');
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();

    const entryData = {
      ...editingEntry,
      created_by: editingEntry.id ? editingEntry.created_by : user?.id
    };

    if (editingEntry.id) {
      await supabase.from('changelog_entries').update(entryData).eq('id', editingEntry.id);
    } else {
      await supabase.from('changelog_entries').insert([entryData]);
    }

    setEditingEntry(null);
    fetchEntries();
  };

  const deleteEntry = async (id: string) => {
    if (!confirm('Delete this changelog entry?')) return;
    await supabase.from('changelog_entries').delete().eq('id', id);
    fetchEntries();
  };

  const togglePublish = async (entry: any) => {
    await supabase.from('changelog_entries').update({ is_published: !entry.is_published }).eq('id', entry.id);
    fetchEntries();
  };

  const addChange = () => {
    const newChanges = [...(editingEntry.changes || []), { type: 'feature', description: '' }];
    setEditingEntry({ ...editingEntry, changes: newChanges });
  };

  const updateChange = (index: number, field: string, value: string) => {
    const newChanges = [...editingEntry.changes];
    newChanges[index] = { ...newChanges[index], [field]: value };
    setEditingEntry({ ...editingEntry, changes: newChanges });
  };

  const removeChange = (index: number) => {
    const newChanges = editingEntry.changes.filter((_: any, i: number) => i !== index);
    setEditingEntry({ ...editingEntry, changes: newChanges });
  };

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
          <h1 className="text-3xl font-bold text-slate-800 mb-2">Changelog Management</h1>
          <p className="text-slate-600">Track and communicate platform updates</p>
        </div>
        <button
          onClick={() => setEditingEntry({ version: '', title: '', description: '', release_date: new Date().toISOString().split('T')[0], changes: [], is_published: false })}
          className="flex items-center gap-2 px-4 py-2 bg-[#bb2738] text-white rounded-lg hover:bg-[#a01f2f] transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Release
        </button>
      </div>

      <div className="space-y-4">
        {entries.map(entry => (
          <div key={entry.id} className="bg-white rounded-xl border border-slate-200 p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-xl font-bold text-slate-800">v{entry.version} - {entry.title}</h3>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${entry.is_published ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'}`}>
                    {entry.is_published ? 'Published' : 'Draft'}
                  </span>
                </div>
                <p className="text-sm text-slate-600 mb-2">{new Date(entry.release_date).toLocaleDateString()}</p>
                {entry.description && <p className="text-sm text-slate-600">{entry.description}</p>}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => togglePublish(entry)}
                  className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                  title={entry.is_published ? 'Unpublish' : 'Publish'}
                >
                  {entry.is_published ? <EyeOff className="w-4 h-4 text-slate-600" /> : <Eye className="w-4 h-4 text-slate-600" />}
                </button>
                <button onClick={() => setEditingEntry(entry)} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                  <Edit2 className="w-4 h-4 text-slate-600" />
                </button>
                <button onClick={() => deleteEntry(entry.id)} className="p-2 hover:bg-red-50 rounded-lg transition-colors">
                  <Trash2 className="w-4 h-4 text-red-600" />
                </button>
              </div>
            </div>

            {entry.changes && entry.changes.length > 0 && (
              <div className="space-y-2">
                {entry.changes.map((change: any, index: number) => (
                  <div key={index} className="flex items-start gap-2 text-sm">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                      change.type === 'feature' ? 'bg-green-100 text-green-700' :
                      change.type === 'improvement' ? 'bg-blue-100 text-blue-700' :
                      change.type === 'fix' ? 'bg-orange-100 text-orange-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {change.type}
                    </span>
                    <span className="text-slate-700">{change.description}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}

        {entries.length === 0 && (
          <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
            <Package className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-800 mb-2">No Releases Yet</h3>
            <p className="text-slate-600">Create your first changelog entry</p>
          </div>
        )}
      </div>

      {editingEntry && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-xl p-6 max-w-4xl w-full my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-slate-800">
                {editingEntry.id ? 'Edit Release' : 'Add Release'}
              </h3>
              <button onClick={() => setEditingEntry(null)} className="p-1 hover:bg-slate-100 rounded">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Version *</label>
                  <input
                    type="text"
                    value={editingEntry.version}
                    onChange={(e) => setEditingEntry({ ...editingEntry, version: e.target.value })}
                    placeholder="1.0.0"
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#bb2738] focus:border-transparent outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Release Date *</label>
                  <input
                    type="date"
                    value={editingEntry.release_date}
                    onChange={(e) => setEditingEntry({ ...editingEntry, release_date: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#bb2738] focus:border-transparent outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Title *</label>
                <input
                  type="text"
                  value={editingEntry.title}
                  onChange={(e) => setEditingEntry({ ...editingEntry, title: e.target.value })}
                  placeholder="Major feature release"
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#bb2738] focus:border-transparent outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Description</label>
                <textarea
                  value={editingEntry.description}
                  onChange={(e) => setEditingEntry({ ...editingEntry, description: e.target.value })}
                  rows={3}
                  placeholder="Brief overview of this release"
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#bb2738] focus:border-transparent outline-none"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-slate-700">Changes</label>
                  <button
                    onClick={addChange}
                    className="flex items-center gap-1 text-sm text-[#bb2738] hover:underline"
                  >
                    <Plus className="w-4 h-4" />
                    Add Change
                  </button>
                </div>
                <div className="space-y-3">
                  {(editingEntry.changes || []).map((change: any, index: number) => (
                    <div key={index} className="flex gap-3 items-start p-3 bg-slate-50 rounded-lg">
                      <select
                        value={change.type}
                        onChange={(e) => updateChange(index, 'type', e.target.value)}
                        className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#bb2738] focus:border-transparent outline-none text-sm"
                      >
                        <option value="feature">Feature</option>
                        <option value="improvement">Improvement</option>
                        <option value="fix">Fix</option>
                        <option value="breaking">Breaking</option>
                      </select>
                      <input
                        type="text"
                        value={change.description}
                        onChange={(e) => updateChange(index, 'description', e.target.value)}
                        placeholder="Describe the change..."
                        className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#bb2738] focus:border-transparent outline-none text-sm"
                      />
                      <button
                        onClick={() => removeChange(index)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="is_published"
                  checked={editingEntry.is_published}
                  onChange={(e) => setEditingEntry({ ...editingEntry, is_published: e.target.checked })}
                  className="w-5 h-5 text-[#bb2738] rounded focus:ring-[#bb2738]"
                />
                <label htmlFor="is_published" className="text-sm font-medium text-slate-700">Published</label>
              </div>

              <div className="flex gap-3">
                <button onClick={() => setEditingEntry(null)} className="flex-1 px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors">
                  Cancel
                </button>
                <button onClick={saveEntry} className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-[#bb2738] text-white rounded-lg hover:bg-[#a01f2f] transition-colors">
                  <Save className="w-4 h-4" />
                  Save Release
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
