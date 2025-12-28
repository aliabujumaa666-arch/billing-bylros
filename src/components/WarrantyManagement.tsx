import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Shield, AlertCircle, Star, Download, Plus, Edit2, Trash2, X } from 'lucide-react';
import { exportWarrantyToPDF } from '../utils/exportUtils';
import { useBrand } from '../contexts/BrandContext';

interface Warranty {
  id: string;
  warranty_number: string;
  product_name: string;
  product_description?: string;
  serial_number?: string;
  start_date: string;
  end_date: string;
  duration_months: number;
  coverage_type?: string;
  coverage_details?: string;
  status: string;
  notes?: string;
  order_id?: string;
  customer_id?: string;
  orders?: { order_number: string; customer_name: string } | null;
}

interface Feedback {
  id: string;
  overall_rating: number;
  comments: string;
  order_id?: string;
  customer_id?: string;
  orders: { order_number: string; customer_name: string };
  submitted_at: string;
  quality_rating: number;
  timeliness_rating: number;
  professionalism_rating: number;
  would_recommend?: boolean;
}

export function WarrantyManagement() {
  const { brand } = useBrand();
  const [warranties, setWarranties] = useState<Warranty[]>([]);
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'warranties' | 'feedback'>('warranties');
  const [showWarrantyModal, setShowWarrantyModal] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [editingWarranty, setEditingWarranty] = useState<Warranty | null>(null);
  const [editingFeedback, setEditingFeedback] = useState<Feedback | null>(null);
  const [warrantyForm, setWarrantyForm] = useState({
    warranty_number: '',
    product_name: '',
    product_description: '',
    serial_number: '',
    start_date: new Date().toISOString().split('T')[0],
    end_date: '',
    duration_months: 12,
    coverage_type: 'full',
    coverage_details: '',
    status: 'active',
    notes: '',
    order_id: '',
    customer_id: '',
  });
  const [feedbackForm, setFeedbackForm] = useState({
    order_id: '',
    customer_id: '',
    overall_rating: 5,
    quality_rating: 5,
    timeliness_rating: 5,
    professionalism_rating: 5,
    comments: '',
    would_recommend: true,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [warrantyData, feedbackData, customersData, ordersData] = await Promise.all([
        supabase
          .from('warranties')
          .select(`
            *,
            orders(
              order_number,
              customers(name)
            )
          `)
          .order('created_at', { ascending: false }),
        supabase
          .from('installation_feedback')
          .select(`
            *,
            orders!inner(
              order_number,
              customers(name)
            )
          `)
          .order('submitted_at', { ascending: false }),
        supabase
          .from('customers')
          .select('*')
          .order('name'),
        supabase
          .from('orders')
          .select('*, customers(name)')
          .order('created_at', { ascending: false }),
      ]);

      if (warrantyData.error) {
        console.error('Error loading warranties:', warrantyData.error);
      }

      if (feedbackData.error) {
        console.error('Error loading feedback:', feedbackData.error);
      }

      const formattedWarranties = (warrantyData.data || []).map(w => ({
        ...w,
        orders: w.orders ? {
          order_number: w.orders.order_number,
          customer_name: w.orders.customers?.name || 'Unknown Customer'
        } : null
      }));

      const formattedFeedback = (feedbackData.data || []).map(f => ({
        ...f,
        orders: {
          order_number: f.orders.order_number,
          customer_name: f.orders.customers?.name || 'Unknown Customer'
        }
      }));

      setWarranties(formattedWarranties);
      setFeedbacks(formattedFeedback);
      setCustomers(customersData.data || []);
      setOrders(ordersData.data || []);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateWarrantyNumber = () => {
    const date = new Date();
    const year = date.getFullYear();
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `WAR-${year}-${random}`;
  };

  const calculateEndDate = (startDate: string, durationMonths: number) => {
    const date = new Date(startDate);
    date.setMonth(date.getMonth() + durationMonths);
    return date.toISOString().split('T')[0];
  };

  const handleCreateWarranty = () => {
    setEditingWarranty(null);
    setWarrantyForm({
      warranty_number: generateWarrantyNumber(),
      product_name: '',
      product_description: '',
      serial_number: '',
      start_date: new Date().toISOString().split('T')[0],
      end_date: calculateEndDate(new Date().toISOString().split('T')[0], 12),
      duration_months: 12,
      coverage_type: 'full',
      coverage_details: '',
      status: 'active',
      notes: '',
      order_id: '',
      customer_id: '',
    });
    setShowWarrantyModal(true);
  };

  const handleEditWarranty = (warranty: Warranty) => {
    setEditingWarranty(warranty);
    setWarrantyForm({
      warranty_number: warranty.warranty_number,
      product_name: warranty.product_name,
      product_description: warranty.product_description || '',
      serial_number: warranty.serial_number || '',
      start_date: warranty.start_date,
      end_date: warranty.end_date,
      duration_months: warranty.duration_months,
      coverage_type: warranty.coverage_type || 'full',
      coverage_details: warranty.coverage_details || '',
      status: warranty.status,
      notes: warranty.notes || '',
      order_id: warranty.order_id || '',
      customer_id: warranty.customer_id || '',
    });
    setShowWarrantyModal(true);
  };

  const handleSaveWarranty = async () => {
    try {
      const warrantyData = {
        ...warrantyForm,
        customer_id: warrantyForm.customer_id || null,
        order_id: warrantyForm.order_id || null,
      };

      if (editingWarranty) {
        const { error } = await supabase
          .from('warranties')
          .update(warrantyData)
          .eq('id', editingWarranty.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('warranties')
          .insert([warrantyData]);

        if (error) throw error;
      }

      setShowWarrantyModal(false);
      loadData();
    } catch (error) {
      console.error('Error saving warranty:', error);
      alert('Failed to save warranty. Please try again.');
    }
  };

  const handleDeleteWarranty = async (id: string) => {
    if (!confirm('Are you sure you want to delete this warranty?')) return;

    try {
      const { error } = await supabase
        .from('warranties')
        .delete()
        .eq('id', id);

      if (error) throw error;
      loadData();
    } catch (error) {
      console.error('Error deleting warranty:', error);
      alert('Failed to delete warranty. Please try again.');
    }
  };

  const handleCreateFeedback = () => {
    setEditingFeedback(null);
    setFeedbackForm({
      order_id: '',
      customer_id: '',
      overall_rating: 5,
      quality_rating: 5,
      timeliness_rating: 5,
      professionalism_rating: 5,
      comments: '',
      would_recommend: true,
    });
    setShowFeedbackModal(true);
  };

  const handleEditFeedback = (feedback: Feedback) => {
    setEditingFeedback(feedback);
    setFeedbackForm({
      order_id: feedback.order_id || '',
      customer_id: feedback.customer_id || '',
      overall_rating: feedback.overall_rating,
      quality_rating: feedback.quality_rating,
      timeliness_rating: feedback.timeliness_rating,
      professionalism_rating: feedback.professionalism_rating,
      comments: feedback.comments || '',
      would_recommend: feedback.would_recommend || true,
    });
    setShowFeedbackModal(true);
  };

  const handleSaveFeedback = async () => {
    try {
      const feedbackData = {
        ...feedbackForm,
        customer_id: feedbackForm.customer_id || null,
        order_id: feedbackForm.order_id || null,
      };

      if (editingFeedback) {
        const { error } = await supabase
          .from('installation_feedback')
          .update(feedbackData)
          .eq('id', editingFeedback.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('installation_feedback')
          .insert([feedbackData]);

        if (error) throw error;
      }

      setShowFeedbackModal(false);
      loadData();
    } catch (error) {
      console.error('Error saving feedback:', error);
      alert('Failed to save feedback. Please try again.');
    }
  };

  const handleDeleteFeedback = async (id: string) => {
    if (!confirm('Are you sure you want to delete this feedback?')) return;

    try {
      const { error } = await supabase
        .from('installation_feedback')
        .delete()
        .eq('id', id);

      if (error) throw error;
      loadData();
    } catch (error) {
      console.error('Error deleting feedback:', error);
      alert('Failed to delete feedback. Please try again.');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-700';
      case 'expired': return 'bg-red-100 text-red-700';
      case 'claimed': return 'bg-yellow-100 text-yellow-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  const renderStars = (rating: number) => {
    return [...Array(5)].map((_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${i < rating ? 'text-yellow-400 fill-yellow-400' : 'text-slate-300'}`}
      />
    ));
  };

  const handleDownloadPDF = async (warranty: Warranty) => {
    await exportWarrantyToPDF(warranty, warranty.orders, brand);
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#bb2738]"></div></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-800">Warranty & Feedback Management</h2>
        {activeTab === 'warranties' ? (
          <button
            onClick={handleCreateWarranty}
            className="flex items-center gap-2 px-4 py-2 bg-[#bb2738] text-white rounded-lg hover:bg-[#a01f2e] transition-colors"
          >
            <Plus className="w-4 h-4" />
            Create Warranty
          </button>
        ) : (
          <button
            onClick={handleCreateFeedback}
            className="flex items-center gap-2 px-4 py-2 bg-[#bb2738] text-white rounded-lg hover:bg-[#a01f2e] transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Feedback
          </button>
        )}
      </div>

      <div className="flex gap-2 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('warranties')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'warranties'
              ? 'text-[#bb2738] border-b-2 border-[#bb2738]'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Shield className="w-4 h-4 inline mr-2" />
          Warranties ({warranties.length})
        </button>
        <button
          onClick={() => setActiveTab('feedback')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'feedback'
              ? 'text-[#bb2738] border-b-2 border-[#bb2738]'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Star className="w-4 h-4 inline mr-2" />
          Customer Feedback ({feedbacks.length})
        </button>
      </div>

      {activeTab === 'warranties' && (
        <div className="grid gap-4">
          {warranties.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg border border-slate-200">
              <Shield className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500">No warranties yet</p>
            </div>
          ) : (
            warranties.map((warranty) => {
            const daysUntilExpiry = Math.ceil(
              (new Date(warranty.end_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
            );
            const isExpiringSoon = daysUntilExpiry > 0 && daysUntilExpiry <= 30;

            return (
              <div key={warranty.id} className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900">{warranty.product_name}</h3>
                    {warranty.orders && (
                      <p className="text-sm text-slate-600">
                        {warranty.orders.order_number} - {warranty.orders.customer_name}
                      </p>
                    )}
                    <p className="text-sm text-slate-600 mt-1">Warranty #: {warranty.warranty_number}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(warranty.status)}`}>
                    {warranty.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-slate-500">Start Date</p>
                    <p className="text-sm font-medium text-slate-900">
                      {new Date(warranty.start_date).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">End Date</p>
                    <p className="text-sm font-medium text-slate-900">
                      {new Date(warranty.end_date).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                {isExpiringSoon && warranty.status === 'active' && (
                  <div className="mt-4 flex items-center gap-2 text-sm text-orange-600 bg-orange-50 p-3 rounded-lg">
                    <AlertCircle className="w-4 h-4" />
                    Expires in {daysUntilExpiry} days
                  </div>
                )}

                <div className="mt-4 flex justify-end gap-2">
                  <button
                    onClick={() => handleEditWarranty(warranty)}
                    className="inline-flex items-center gap-2 px-4 py-2 text-sm text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteWarranty(warranty.id)}
                    className="inline-flex items-center gap-2 px-4 py-2 text-sm text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </button>
                  <button
                    onClick={() => handleDownloadPDF(warranty)}
                    className="inline-flex items-center gap-2 px-4 py-2 text-sm text-green-700 hover:bg-green-50 rounded-lg transition-colors font-medium"
                  >
                    <Download className="w-4 h-4" />
                    Download
                  </button>
                </div>
              </div>
            );
          })
          )}
        </div>
      )}

      {activeTab === 'feedback' && (
        <div className="grid gap-4">
          {feedbacks.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg border border-slate-200">
              <Star className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500">No feedback yet</p>
            </div>
          ) : (
            feedbacks.map((feedback) => {
              const avgRating = (
                feedback.overall_rating +
                feedback.quality_rating +
                feedback.timeliness_rating +
                feedback.professionalism_rating
              ) / 4;

              return (
                <div key={feedback.id} className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-slate-900">{feedback.orders.customer_name}</h3>
                      <p className="text-sm text-slate-600">{feedback.orders.order_number}</p>
                      <p className="text-xs text-slate-500 mt-1">
                        {new Date(feedback.submitted_at).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex flex-col items-end">
                      <div className="flex gap-1 mb-1">{renderStars(Math.round(avgRating))}</div>
                      <span className="text-sm font-medium text-slate-900">{avgRating.toFixed(1)}/5</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="text-xs text-slate-500 mb-1">Quality</p>
                      <div className="flex gap-1">{renderStars(feedback.quality_rating)}</div>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 mb-1">Timeliness</p>
                      <div className="flex gap-1">{renderStars(feedback.timeliness_rating)}</div>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 mb-1">Professionalism</p>
                      <div className="flex gap-1">{renderStars(feedback.professionalism_rating)}</div>
                    </div>
                  </div>

                  {feedback.comments && (
                    <div className="bg-slate-50 rounded-lg p-4 mb-4">
                      <p className="text-sm text-slate-700">{feedback.comments}</p>
                    </div>
                  )}

                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => handleEditFeedback(feedback)}
                      className="inline-flex items-center gap-2 px-4 py-2 text-sm text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteFeedback(feedback.id)}
                      className="inline-flex items-center gap-2 px-4 py-2 text-sm text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {showWarrantyModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b border-slate-200 sticky top-0 bg-white">
              <h2 className="text-xl font-bold text-slate-800">
                {editingWarranty ? 'Edit Warranty' : 'Create Warranty'}
              </h2>
              <button onClick={() => setShowWarrantyModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Warranty Number</label>
                  <input
                    type="text"
                    value={warrantyForm.warranty_number}
                    onChange={(e) => setWarrantyForm({ ...warrantyForm, warranty_number: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
                  <select
                    value={warrantyForm.status}
                    onChange={(e) => setWarrantyForm({ ...warrantyForm, status: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  >
                    <option value="active">Active</option>
                    <option value="expired">Expired</option>
                    <option value="claimed">Claimed</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Customer</label>
                <select
                  value={warrantyForm.customer_id}
                  onChange={(e) => setWarrantyForm({ ...warrantyForm, customer_id: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                >
                  <option value="">Select Customer</option>
                  {customers.map((customer) => (
                    <option key={customer.id} value={customer.id}>{customer.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Order (Optional)</label>
                <select
                  value={warrantyForm.order_id}
                  onChange={(e) => setWarrantyForm({ ...warrantyForm, order_id: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                >
                  <option value="">Select Order</option>
                  {orders.map((order) => (
                    <option key={order.id} value={order.id}>
                      {order.order_number} - {order.customers?.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Product Name *</label>
                <input
                  type="text"
                  value={warrantyForm.product_name}
                  onChange={(e) => setWarrantyForm({ ...warrantyForm, product_name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Product Description</label>
                <textarea
                  value={warrantyForm.product_description}
                  onChange={(e) => setWarrantyForm({ ...warrantyForm, product_description: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Serial Number</label>
                  <input
                    type="text"
                    value={warrantyForm.serial_number}
                    onChange={(e) => setWarrantyForm({ ...warrantyForm, serial_number: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Duration (Months)</label>
                  <input
                    type="number"
                    value={warrantyForm.duration_months}
                    onChange={(e) => {
                      const months = parseInt(e.target.value);
                      setWarrantyForm({
                        ...warrantyForm,
                        duration_months: months,
                        end_date: calculateEndDate(warrantyForm.start_date, months)
                      });
                    }}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Start Date *</label>
                  <input
                    type="date"
                    value={warrantyForm.start_date}
                    onChange={(e) => setWarrantyForm({
                      ...warrantyForm,
                      start_date: e.target.value,
                      end_date: calculateEndDate(e.target.value, warrantyForm.duration_months)
                    })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">End Date</label>
                  <input
                    type="date"
                    value={warrantyForm.end_date}
                    onChange={(e) => setWarrantyForm({ ...warrantyForm, end_date: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Coverage Type</label>
                <select
                  value={warrantyForm.coverage_type}
                  onChange={(e) => setWarrantyForm({ ...warrantyForm, coverage_type: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                >
                  <option value="full">Full Coverage</option>
                  <option value="limited">Limited Coverage</option>
                  <option value="parts_only">Parts Only</option>
                  <option value="labor_only">Labor Only</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Coverage Details</label>
                <textarea
                  value={warrantyForm.coverage_details}
                  onChange={(e) => setWarrantyForm({ ...warrantyForm, coverage_details: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  rows={2}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Notes</label>
                <textarea
                  value={warrantyForm.notes}
                  onChange={(e) => setWarrantyForm({ ...warrantyForm, notes: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  rows={3}
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 p-6 border-t border-slate-200 sticky bottom-0 bg-white">
              <button
                onClick={() => setShowWarrantyModal(false)}
                className="px-4 py-2 text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveWarranty}
                className="px-4 py-2 bg-[#bb2738] text-white rounded-lg hover:bg-[#a01f2e] transition-colors"
              >
                {editingWarranty ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showFeedbackModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b border-slate-200 sticky top-0 bg-white">
              <h2 className="text-xl font-bold text-slate-800">
                {editingFeedback ? 'Edit Feedback' : 'Add Feedback'}
              </h2>
              <button onClick={() => setShowFeedbackModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Customer</label>
                <select
                  value={feedbackForm.customer_id}
                  onChange={(e) => setFeedbackForm({ ...feedbackForm, customer_id: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                >
                  <option value="">Select Customer</option>
                  {customers.map((customer) => (
                    <option key={customer.id} value={customer.id}>{customer.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Order</label>
                <select
                  value={feedbackForm.order_id}
                  onChange={(e) => setFeedbackForm({ ...feedbackForm, order_id: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                >
                  <option value="">Select Order</option>
                  {orders.map((order) => (
                    <option key={order.id} value={order.id}>
                      {order.order_number} - {order.customers?.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Overall Rating</label>
                  <select
                    value={feedbackForm.overall_rating}
                    onChange={(e) => setFeedbackForm({ ...feedbackForm, overall_rating: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  >
                    {[1, 2, 3, 4, 5].map((rating) => (
                      <option key={rating} value={rating}>{rating} Star{rating > 1 ? 's' : ''}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Quality Rating</label>
                  <select
                    value={feedbackForm.quality_rating}
                    onChange={(e) => setFeedbackForm({ ...feedbackForm, quality_rating: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  >
                    {[1, 2, 3, 4, 5].map((rating) => (
                      <option key={rating} value={rating}>{rating} Star{rating > 1 ? 's' : ''}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Timeliness Rating</label>
                  <select
                    value={feedbackForm.timeliness_rating}
                    onChange={(e) => setFeedbackForm({ ...feedbackForm, timeliness_rating: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  >
                    {[1, 2, 3, 4, 5].map((rating) => (
                      <option key={rating} value={rating}>{rating} Star{rating > 1 ? 's' : ''}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Professionalism Rating</label>
                  <select
                    value={feedbackForm.professionalism_rating}
                    onChange={(e) => setFeedbackForm({ ...feedbackForm, professionalism_rating: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  >
                    {[1, 2, 3, 4, 5].map((rating) => (
                      <option key={rating} value={rating}>{rating} Star{rating > 1 ? 's' : ''}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Comments</label>
                <textarea
                  value={feedbackForm.comments}
                  onChange={(e) => setFeedbackForm({ ...feedbackForm, comments: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  rows={4}
                  placeholder="Share your experience..."
                />
              </div>

              <div>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={feedbackForm.would_recommend}
                    onChange={(e) => setFeedbackForm({ ...feedbackForm, would_recommend: e.target.checked })}
                    className="w-4 h-4 text-[#bb2738] border-slate-300 rounded"
                  />
                  <span className="text-sm text-slate-700">Would recommend to others</span>
                </label>
              </div>
            </div>
            <div className="flex justify-end gap-3 p-6 border-t border-slate-200 sticky bottom-0 bg-white">
              <button
                onClick={() => setShowFeedbackModal(false)}
                className="px-4 py-2 text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveFeedback}
                className="px-4 py-2 bg-[#bb2738] text-white rounded-lg hover:bg-[#a01f2e] transition-colors"
              >
                {editingFeedback ? 'Update' : 'Add'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}