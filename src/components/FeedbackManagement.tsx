import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { MessageCircle, Star, Filter, X, Pencil, Trash2 } from 'lucide-react';
import { useToast } from '../contexts/ToastContext';

export function FeedbackManagement() {
  const [feedback, setFeedback] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedFeedback, setSelectedFeedback] = useState<any>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editData, setEditData] = useState({
    feedback_type: '',
    message: '',
    rating: 0,
    status: '',
  });
  const [deleting, setDeleting] = useState(false);
  const { success, error: showError } = useToast();

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
    try {
      const { error } = await supabase
        .from('user_feedback')
        .update({ admin_notes: adminNotes })
        .eq('id', selectedFeedback.id);

      if (error) throw error;
      success('Notes saved successfully');
      fetchFeedback();
    } catch (err: any) {
      showError(err.message || 'Failed to save notes');
    }
  };

  const openEditModal = () => {
    if (selectedFeedback) {
      setEditData({
        feedback_type: selectedFeedback.feedback_type,
        message: selectedFeedback.message,
        rating: selectedFeedback.rating,
        status: selectedFeedback.status,
      });
      setShowEditModal(true);
    }
  };

  const updateFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFeedback) return;

    try {
      const { error } = await supabase
        .from('user_feedback')
        .update({
          feedback_type: editData.feedback_type,
          message: editData.message,
          rating: editData.rating,
          status: editData.status,
          admin_notes: adminNotes,
        })
        .eq('id', selectedFeedback.id);

      if (error) throw error;

      success('Feedback updated successfully');
      setShowEditModal(false);
      setSelectedFeedback({ ...selectedFeedback, ...editData });
      fetchFeedback();
    } catch (err: any) {
      console.error('Error updating feedback:', err);
      showError(err.message || 'Failed to update feedback');
    }
  };

  const deleteFeedback = async () => {
    if (!selectedFeedback) return;

    setDeleting(true);
    try {
      const { error } = await supabase
        .from('user_feedback')
        .delete()
        .eq('id', selectedFeedback.id);

      if (error) throw error;

      success('Feedback deleted successfully');
      setShowDeleteModal(false);
      setSelectedFeedback(null);
      fetchFeedback();
    } catch (err: any) {
      console.error('Error deleting feedback:', err);
      showError(err.message || 'Failed to delete feedback');
    } finally {
      setDeleting(false);
    }
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
                <div className="flex items-center gap-2">
                  <button
                    onClick={openEditModal}
                    className="p-2 hover:bg-slate-200 rounded-lg transition-colors"
                    title="Edit feedback"
                  >
                    <Pencil className="w-4 h-4 text-slate-600" />
                  </button>
                  <button
                    onClick={() => setShowDeleteModal(true)}
                    className="p-2 hover:bg-red-100 rounded-lg transition-colors"
                    title="Delete feedback"
                  >
                    <Trash2 className="w-4 h-4 text-red-600" />
                  </button>
                  <button onClick={() => setSelectedFeedback(null)} className="p-2 hover:bg-slate-100 rounded-lg">
                    <X className="w-5 h-5" />
                  </button>
                </div>
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

      {showEditModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full">
            <div className="border-b border-slate-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-800">Edit Feedback</h2>
              <button onClick={() => setShowEditModal(false)} className="p-2 hover:bg-slate-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={updateFeedback} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Feedback Type</label>
                <select
                  value={editData.feedback_type}
                  onChange={(e) => setEditData({ ...editData, feedback_type: e.target.value })}
                  required
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-[#bb2738]"
                >
                  <option value="bug">Bug</option>
                  <option value="feature_request">Feature Request</option>
                  <option value="improvement">Improvement</option>
                  <option value="praise">Praise</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Message</label>
                <textarea
                  value={editData.message}
                  onChange={(e) => setEditData({ ...editData, message: e.target.value })}
                  required
                  rows={6}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-[#bb2738] resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Rating (0-5)</label>
                <input
                  type="number"
                  min="0"
                  max="5"
                  value={editData.rating}
                  onChange={(e) => setEditData({ ...editData, rating: parseInt(e.target.value) || 0 })}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-[#bb2738]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Status</label>
                <select
                  value={editData.status}
                  onChange={(e) => setEditData({ ...editData, status: e.target.value })}
                  required
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-[#bb2738]"
                >
                  <option value="new">New</option>
                  <option value="reviewed">Reviewed</option>
                  <option value="implemented">Implemented</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 px-4 py-2.5 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2.5 bg-[#bb2738] hover:bg-[#a01f2f] text-white rounded-lg transition-colors"
                >
                  Update Feedback
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
            <div className="border-b border-slate-200 px-6 py-4">
              <h2 className="text-xl font-bold text-slate-800">Delete Feedback</h2>
            </div>

            <div className="p-6">
              <p className="text-slate-600 mb-4">
                Are you sure you want to delete this feedback? This action cannot be undone.
              </p>
              {selectedFeedback && (
                <div className="bg-slate-50 rounded-lg p-4 mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${getTypeColor(selectedFeedback.feedback_type)}`}>
                      {selectedFeedback.feedback_type.replace('_', ' ')}
                    </span>
                  </div>
                  <p className="text-sm text-slate-600 line-clamp-3">{selectedFeedback.message}</p>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowDeleteModal(false)}
                  disabled={deleting}
                  className="flex-1 px-4 py-2.5 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={deleteFeedback}
                  disabled={deleting}
                  className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {deleting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Deleting...
                    </>
                  ) : (
                    'Delete Feedback'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
