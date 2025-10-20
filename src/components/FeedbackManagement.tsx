import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { MessageCircle, Star, Filter, X } from 'lucide-react';

export function FeedbackManagement() {
  const [feedback, setFeedback] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedFeedback, setSelectedFeedback] = useState<any>(null);
  const [adminNotes, setAdminNotes] = useState('');

  useEffect(() => {
    fetchFeedback();
  }, []);

  const fetchFeedback = async () => {
    const { data } = await supabase
      .from('user_feedback')
      .select('*')
      .order('created_at', { ascending: false });

    if (data) setFeedback(data);
    setLoading(false);
  };

  const updateStatus = async (id: string, status: string) => {
    await supabase.from('user_feedback').update({ status }).eq('id', id);
    fetchFeedback();
    if (selectedFeedback?.id === id) {
      setSelectedFeedback({ ...selectedFeedback, status });
    }
  };

  const saveNotes = async () => {
    if (!selectedFeedback) return;
    await supabase.from('user_feedback').update({ admin_notes: adminNotes }).eq('id', selectedFeedback.id);
    alert('Notes saved successfully');
    fetchFeedback();
  };

  const filteredFeedback = feedback.filter(f => filterStatus === 'all' || f.status === filterStatus);

  const getTypeColor = (type: string) => {
    const colors = {
      bug: 'bg-red-100 text-red-700',
      feature_request: 'bg-blue-100 text-blue-700',
      improvement: 'bg-green-100 text-green-700',
      praise: 'bg-purple-100 text-purple-700'
    };
    return colors[type as keyof typeof colors] || 'bg-slate-100 text-slate-700';
  };

  const getStatusColor = (status: string) => {
    const colors = {
      new: 'bg-blue-100 text-blue-700',
      reviewed: 'bg-yellow-100 text-yellow-700',
      implemented: 'bg-green-100 text-green-700',
      rejected: 'bg-red-100 text-red-700'
    };
    return colors[status as keyof typeof colors] || 'bg-slate-100 text-slate-700';
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
          <h1 className="text-3xl font-bold text-slate-800 mb-2">User Feedback</h1>
          <p className="text-slate-600">Review and manage user feedback submissions</p>
        </div>
        <div className="flex items-center gap-3">
          <Filter className="w-5 h-5 text-slate-600" />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#bb2738] focus:border-transparent outline-none"
          >
            <option value="all">All ({feedback.length})</option>
            <option value="new">New ({feedback.filter(f => f.status === 'new').length})</option>
            <option value="reviewed">Reviewed ({feedback.filter(f => f.status === 'reviewed').length})</option>
            <option value="implemented">Implemented ({feedback.filter(f => f.status === 'implemented').length})</option>
            <option value="rejected">Rejected ({feedback.filter(f => f.status === 'rejected').length})</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-3">
          {filteredFeedback.map(item => (
            <div
              key={item.id}
              onClick={() => { setSelectedFeedback(item); setAdminNotes(item.admin_notes || ''); }}
              className={`bg-white rounded-xl border border-slate-200 p-4 cursor-pointer hover:shadow-md transition-shadow ${selectedFeedback?.id === item.id ? 'ring-2 ring-[#bb2738]' : ''}`}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${getTypeColor(item.feedback_type)}`}>
                    {item.feedback_type.replace('_', ' ')}
                  </span>
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${getStatusColor(item.status)}`}>
                    {item.status}
                  </span>
                </div>
              </div>
              <p className="text-sm text-slate-800 mb-2 line-clamp-2">{item.message}</p>
              <div className="flex items-center gap-2 text-xs text-slate-500">
                {item.rating > 0 && (
                  <div className="flex items-center gap-1">
                    <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                    {item.rating}/5
                  </div>
                )}
                <span>{new Date(item.created_at).toLocaleDateString()}</span>
              </div>
            </div>
          ))}

          {filteredFeedback.length === 0 && (
            <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
              <MessageCircle className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-slate-800 mb-2">No Feedback Found</h3>
              <p className="text-slate-600">No feedback matches your filter</p>
            </div>
          )}
        </div>

        <div className="lg:col-span-2">
          {selectedFeedback ? (
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getTypeColor(selectedFeedback.feedback_type)}`}>
                      {selectedFeedback.feedback_type.replace('_', ' ')}
                    </span>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(selectedFeedback.status)}`}>
                      {selectedFeedback.status}
                    </span>
                  </div>
                  <p className="text-sm text-slate-600">From: {selectedFeedback.user_type} • Page: {selectedFeedback.page_url}</p>
                  <p className="text-sm text-slate-500">{new Date(selectedFeedback.created_at).toLocaleString()}</p>
                </div>
                <button onClick={() => setSelectedFeedback(null)} className="p-2 hover:bg-slate-100 rounded-lg">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {selectedFeedback.rating > 0 && (
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-sm font-medium text-slate-700">Rating:</span>
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className={`w-5 h-5 ${i < selectedFeedback.rating ? 'fill-yellow-400 text-yellow-400' : 'text-slate-300'}`} />
                  ))}
                </div>
              )}

              <div className="mb-6 p-4 bg-slate-50 rounded-lg">
                <p className="text-slate-800 whitespace-pre-wrap">{selectedFeedback.message}</p>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-700 mb-2">Status</label>
                <div className="flex gap-2">
                  <button
                    onClick={() => updateStatus(selectedFeedback.id, 'reviewed')}
                    className="flex-1 px-4 py-2 bg-yellow-100 text-yellow-700 rounded-lg hover:bg-yellow-200 transition-colors text-sm"
                  >
                    Reviewed
                  </button>
                  <button
                    onClick={() => updateStatus(selectedFeedback.id, 'implemented')}
                    className="flex-1 px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors text-sm"
                  >
                    Implemented
                  </button>
                  <button
                    onClick={() => updateStatus(selectedFeedback.id, 'rejected')}
                    className="flex-1 px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors text-sm"
                  >
                    Rejected
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Admin Notes</label>
                <textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  rows={4}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#bb2738] focus:border-transparent outline-none"
                  placeholder="Add internal notes about this feedback..."
                />
                <button
                  onClick={saveNotes}
                  className="mt-2 px-4 py-2 bg-[#bb2738] text-white rounded-lg hover:bg-[#a01f2f] transition-colors"
                >
                  Save Notes
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-slate-200 p-12 text-center h-full flex items-center justify-center">
              <div>
                <MessageCircle className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-slate-800 mb-2">Select Feedback</h3>
                <p className="text-slate-600">Click on feedback to view details</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
