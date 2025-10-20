import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Video, Plus, CreditCard as Edit2, Trash2, Eye, EyeOff, Save, X, Play } from 'lucide-react';

export function VideoTutorials() {
  const [tutorials, setTutorials] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingTutorial, setEditingTutorial] = useState<any>(null);

  useEffect(() => {
    fetchTutorials();
  }, []);

  const fetchTutorials = async () => {
    const { data } = await supabase
      .from('video_tutorials')
      .select('*')
      .order('order_index');

    if (data) setTutorials(data);
    setLoading(false);
  };

  const saveTutorial = async () => {
    if (!editingTutorial.title || !editingTutorial.video_url) {
      alert('Title and video URL are required');
      return;
    }

    if (editingTutorial.id) {
      await supabase.from('video_tutorials').update(editingTutorial).eq('id', editingTutorial.id);
    } else {
      await supabase.from('video_tutorials').insert([editingTutorial]);
    }

    setEditingTutorial(null);
    fetchTutorials();
  };

  const deleteTutorial = async (id: string) => {
    if (!confirm('Delete this tutorial?')) return;
    await supabase.from('video_tutorials').delete().eq('id', id);
    fetchTutorials();
  };

  const togglePublish = async (tutorial: any) => {
    await supabase.from('video_tutorials').update({ is_published: !tutorial.is_published }).eq('id', tutorial.id);
    fetchTutorials();
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
          <h1 className="text-3xl font-bold text-slate-800 mb-2">Video Tutorials</h1>
          <p className="text-slate-600">Manage video tutorials for customers and admins</p>
        </div>
        <button
          onClick={() => setEditingTutorial({ title: '', description: '', video_url: '', thumbnail_url: '', duration_seconds: 0, category: 'General', tags: [], target_audience: 'both', is_published: false })}
          className="flex items-center gap-2 px-4 py-2 bg-[#bb2738] text-white rounded-lg hover:bg-[#a01f2f] transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Tutorial
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tutorials.map(tutorial => (
          <div key={tutorial.id} className="bg-white rounded-xl border border-slate-200 overflow-hidden hover:shadow-lg transition-shadow">
            <div className="relative h-48 bg-slate-100">
              {tutorial.thumbnail_url ? (
                <img src={tutorial.thumbnail_url} alt={tutorial.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Video className="w-16 h-16 text-slate-300" />
                </div>
              )}
              <div className="absolute top-2 right-2 flex gap-2">
                <span className={`px-2 py-1 rounded text-xs font-medium ${tutorial.is_published ? 'bg-green-500 text-white' : 'bg-slate-500 text-white'}`}>
                  {tutorial.is_published ? 'Published' : 'Draft'}
                </span>
              </div>
              <button className="absolute inset-0 flex items-center justify-center bg-black/30 hover:bg-black/50 transition-colors">
                <Play className="w-16 h-16 text-white" />
              </button>
            </div>
            <div className="p-4">
              <h3 className="text-lg font-semibold text-slate-800 mb-2">{tutorial.title}</h3>
              <p className="text-sm text-slate-600 mb-3 line-clamp-2">{tutorial.description}</p>
              <div className="flex items-center gap-2 mb-3 text-xs">
                <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded">{tutorial.category}</span>
                <span className="bg-purple-50 text-purple-700 px-2 py-1 rounded">{tutorial.target_audience}</span>
                <span className="text-slate-500">{tutorial.views_count} views</span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => togglePublish(tutorial)}
                  className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors text-sm"
                >
                  {tutorial.is_published ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  {tutorial.is_published ? 'Unpublish' : 'Publish'}
                </button>
                <button onClick={() => setEditingTutorial(tutorial)} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                  <Edit2 className="w-4 h-4 text-slate-600" />
                </button>
                <button onClick={() => deleteTutorial(tutorial.id)} className="p-2 hover:bg-red-50 rounded-lg transition-colors">
                  <Trash2 className="w-4 h-4 text-red-600" />
                </button>
              </div>
            </div>
          </div>
        ))}

        {tutorials.length === 0 && (
          <div className="col-span-full bg-white rounded-xl border border-slate-200 p-12 text-center">
            <Video className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-800 mb-2">No Tutorials Yet</h3>
            <p className="text-slate-600">Create your first video tutorial</p>
          </div>
        )}
      </div>

      {editingTutorial && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-slate-800">
                {editingTutorial.id ? 'Edit Tutorial' : 'Add Tutorial'}
              </h3>
              <button onClick={() => setEditingTutorial(null)} className="p-1 hover:bg-slate-100 rounded">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Title</label>
                <input
                  type="text"
                  value={editingTutorial.title}
                  onChange={(e) => setEditingTutorial({ ...editingTutorial, title: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#bb2738] focus:border-transparent outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Description</label>
                <textarea
                  value={editingTutorial.description}
                  onChange={(e) => setEditingTutorial({ ...editingTutorial, description: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#bb2738] focus:border-transparent outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Video URL (YouTube, Vimeo, etc.)</label>
                <input
                  type="url"
                  value={editingTutorial.video_url}
                  onChange={(e) => setEditingTutorial({ ...editingTutorial, video_url: e.target.value })}
                  placeholder="https://youtube.com/watch?v=..."
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#bb2738] focus:border-transparent outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Thumbnail URL (Optional)</label>
                <input
                  type="url"
                  value={editingTutorial.thumbnail_url}
                  onChange={(e) => setEditingTutorial({ ...editingTutorial, thumbnail_url: e.target.value })}
                  placeholder="https://..."
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#bb2738] focus:border-transparent outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Category</label>
                  <input
                    type="text"
                    value={editingTutorial.category}
                    onChange={(e) => setEditingTutorial({ ...editingTutorial, category: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#bb2738] focus:border-transparent outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Target Audience</label>
                  <select
                    value={editingTutorial.target_audience}
                    onChange={(e) => setEditingTutorial({ ...editingTutorial, target_audience: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#bb2738] focus:border-transparent outline-none"
                  >
                    <option value="both">Both Admin & Customer</option>
                    <option value="admin">Admin Only</option>
                    <option value="customer">Customer Only</option>
                  </select>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="is_published"
                  checked={editingTutorial.is_published}
                  onChange={(e) => setEditingTutorial({ ...editingTutorial, is_published: e.target.checked })}
                  className="w-5 h-5 text-[#bb2738] rounded focus:ring-[#bb2738]"
                />
                <label htmlFor="is_published" className="text-sm font-medium text-slate-700">Published</label>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setEditingTutorial(null)} className="flex-1 px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors">
                  Cancel
                </button>
                <button onClick={saveTutorial} className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-[#bb2738] text-white rounded-lg hover:bg-[#a01f2f] transition-colors">
                  <Save className="w-4 h-4" />
                  Save Tutorial
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
