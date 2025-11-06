import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import {
  Calendar, Plus, X, Edit2, Trash2, DollarSign, Link as LinkIcon,
  Copy, CheckCircle, Loader2, AlertCircle, Share2
} from 'lucide-react';

export function SiteVisits() {
  const [visits, setVisits] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [quotes, setQuotes] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showShareLinkModal, setShowShareLinkModal] = useState(false);
  const [selectedVisit, setSelectedVisit] = useState<any>(null);
  const [paymentLink, setPaymentLink] = useState('');
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    customer_id: '',
    quote_id: '',
    visit_date: '',
    location: '',
    remarks: '',
    payment_required: false,
    payment_amount: 300.00,
  });
  const [paymentData, setPaymentData] = useState({
    amount: 0,
    payment_method: 'Cash',
    payment_date: new Date().toISOString().split('T')[0],
    transaction_reference: '',
    payment_notes: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const [visitsData, customersData, quotesData] = await Promise.all([
      supabase.from('site_visits').select('*, customers(*), quotes(*)').order('visit_date', { ascending: false }),
      supabase.from('customers').select('*').order('name'),
      supabase.from('quotes').select('*').order('created_at', { ascending: false }),
    ]);
    setVisits(visitsData.data || []);
    setCustomers(customersData.data || []);
    setQuotes(quotesData.data || []);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const visitData = {
      ...formData,
      quote_id: formData.quote_id || null,
      payment_status: formData.payment_required ? 'Unpaid' : 'Paid',
    };
    await supabase.from('site_visits').insert([visitData]);
    setShowModal(false);
    setFormData({
      customer_id: '',
      quote_id: '',
      visit_date: '',
      location: '',
      remarks: '',
      payment_required: false,
      payment_amount: 300.00,
    });
    fetchData();
  };

  const handleEdit = (visit: any) => {
    setSelectedVisit(visit);
    setFormData({
      customer_id: visit.customer_id,
      quote_id: visit.quote_id || '',
      visit_date: visit.visit_date.slice(0, 16),
      location: visit.location,
      remarks: visit.remarks || '',
      payment_required: visit.payment_required || false,
      payment_amount: visit.payment_amount || 300.00,
    });
    setShowEditModal(true);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase
      .from('site_visits')
      .update({
        customer_id: formData.customer_id,
        quote_id: formData.quote_id || null,
        visit_date: formData.visit_date,
        location: formData.location,
        remarks: formData.remarks,
        payment_required: formData.payment_required,
        payment_amount: formData.payment_amount,
      })
      .eq('id', selectedVisit.id);

    if (!error) {
      setShowEditModal(false);
      setSelectedVisit(null);
      fetchData();
    }
  };

  const handleDelete = async () => {
    if (!selectedVisit) return;

    const { error } = await supabase
      .from('site_visits')
      .delete()
      .eq('id', selectedVisit.id);

    if (!error) {
      setShowDeleteModal(false);
      setSelectedVisit(null);
      fetchData();
    }
  };

  const handleManualPayment = (visit: any) => {
    setSelectedVisit(visit);
    setPaymentData({
      amount: visit.payment_amount || 0,
      payment_method: 'Cash',
      payment_date: new Date().toISOString().split('T')[0],
      transaction_reference: '',
      payment_notes: '',
    });
    setShowPaymentModal(true);
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase
      .from('site_visits')
      .update({
        payment_status: 'Paid',
        payment_method: paymentData.payment_method,
        payment_date: paymentData.payment_date,
        payment_transaction_reference: paymentData.transaction_reference,
        payment_notes: paymentData.payment_notes,
      })
      .eq('id', selectedVisit.id);

    setLoading(false);

    if (!error) {
      setShowPaymentModal(false);
      setSelectedVisit(null);
      fetchData();
    }
  };

  const generatePaymentLink = async (visit: any) => {
    setLoading(true);
    setSelectedVisit(visit);

    const token = crypto.randomUUID();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const { error } = await supabase
      .from('site_visits')
      .update({
        payment_link_token: token,
        payment_link_generated_at: new Date().toISOString(),
        payment_link_expires_at: expiresAt.toISOString(),
      })
      .eq('id', visit.id);

    setLoading(false);

    if (!error) {
      const link = `${window.location.origin}/site-visit-payment?token=${token}`;
      setPaymentLink(link);
      setShowShareLinkModal(true);
      fetchData();
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(paymentLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const filteredQuotes = quotes.filter(q => q.customer_id === formData.customer_id);

  const getPaymentStatusBadge = (visit: any) => {
    if (!visit.payment_required) {
      return <span className="px-3 py-1 bg-slate-100 text-slate-600 text-xs rounded-full">No Payment</span>;
    }

    switch (visit.payment_status) {
      case 'Paid':
        return (
          <span className="px-3 py-1 bg-green-100 text-green-800 text-xs rounded-full flex items-center gap-1">
            <CheckCircle className="w-3 h-3" />
            Paid {visit.payment_method && `(${visit.payment_method})`}
          </span>
        );
      case 'Unpaid':
        return <span className="px-3 py-1 bg-red-100 text-red-800 text-xs rounded-full">Unpaid</span>;
      default:
        return <span className="px-3 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">Pending</span>;
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-slate-800">Site Visits</h1>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-[#bb2738] hover:bg-[#a01f2f] text-white px-4 py-2.5 rounded-lg"
        >
          <Plus className="w-5 h-5" />
          Schedule Visit
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {visits.length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500">No site visits scheduled</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-200">
            {visits.map((visit) => (
              <div key={visit.id} className="p-6 hover:bg-slate-50">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-slate-800">{visit.customers?.name}</h3>
                      <span className={`px-3 py-1 text-xs rounded-full ${
                        visit.status === 'Scheduled' ? 'bg-blue-100 text-blue-800' :
                        visit.status === 'Completed' ? 'bg-green-100 text-green-800' :
                        'bg-slate-100 text-slate-800'
                      }`}>
                        {visit.status}
                      </span>
                      {getPaymentStatusBadge(visit)}
                    </div>
                    {visit.quotes && (
                      <p className="text-xs text-slate-500 mb-1">Quote: {visit.quotes.quote_number}</p>
                    )}
                    <p className="text-sm text-slate-600 mb-1">{visit.location}</p>
                    <p className="text-sm text-slate-500">
                      {new Date(visit.visit_date).toLocaleString()}
                    </p>
                    {visit.payment_required && (
                      <p className="text-sm font-semibold text-slate-800 mt-2">
                        Payment Amount: AED {visit.payment_amount?.toFixed(2)}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleEdit(visit)}
                      className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                      title="Edit Visit"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        setSelectedVisit(visit);
                        setShowDeleteModal(true);
                      }}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete Visit"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    {visit.payment_required && visit.payment_status === 'Unpaid' && (
                      <>
                        <button
                          onClick={() => handleManualPayment(visit)}
                          className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                          title="Record Manual Payment"
                        >
                          <DollarSign className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => generatePaymentLink(visit)}
                          disabled={loading}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50"
                          title="Share Payment Link"
                        >
                          {loading && selectedVisit?.id === visit.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Share2 className="w-4 h-4" />
                          )}
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
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b sticky top-0 bg-white">
              <h2 className="text-xl font-bold">Schedule Site Visit</h2>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-slate-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Customer</label>
                <select
                  value={formData.customer_id}
                  onChange={(e) => setFormData({ ...formData, customer_id: e.target.value, quote_id: '' })}
                  required
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-[#bb2738]"
                >
                  <option value="">Select Customer</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Related Quote (Optional)</label>
                <select
                  value={formData.quote_id}
                  onChange={(e) => setFormData({ ...formData, quote_id: e.target.value })}
                  disabled={!formData.customer_id}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-[#bb2738] disabled:bg-slate-100"
                >
                  <option value="">None</option>
                  {filteredQuotes.map((q) => (
                    <option key={q.id} value={q.id}>{q.quote_number}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Visit Date & Time</label>
                <input
                  type="datetime-local"
                  value={formData.visit_date}
                  onChange={(e) => setFormData({ ...formData, visit_date: e.target.value })}
                  required
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-[#bb2738]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Location</label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  required
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-[#bb2738]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Remarks</label>
                <textarea
                  value={formData.remarks}
                  onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-[#bb2738]"
                />
              </div>
              <div className="border-t pt-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.payment_required}
                    onChange={(e) => setFormData({ ...formData, payment_required: e.target.checked })}
                    className="w-4 h-4 text-[#bb2738] rounded focus:ring-[#bb2738]"
                  />
                  <span className="text-sm font-medium text-slate-700">Payment Required</span>
                </label>
              </div>
              {formData.payment_required && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Payment Amount (AED)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.payment_amount}
                    onChange={(e) => setFormData({ ...formData, payment_amount: parseFloat(e.target.value) })}
                    required
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-[#bb2738]"
                  />
                </div>
              )}
              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-6 py-2.5 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-[#bb2738] hover:bg-[#a01f2f] text-white rounded-lg"
                >
                  Schedule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showEditModal && selectedVisit && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b sticky top-0 bg-white">
              <h2 className="text-xl font-bold">Edit Site Visit</h2>
              <button onClick={() => setShowEditModal(false)} className="p-2 hover:bg-slate-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleUpdate} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Customer</label>
                <select
                  value={formData.customer_id}
                  onChange={(e) => setFormData({ ...formData, customer_id: e.target.value, quote_id: '' })}
                  required
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-[#bb2738]"
                >
                  <option value="">Select Customer</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Related Quote (Optional)</label>
                <select
                  value={formData.quote_id}
                  onChange={(e) => setFormData({ ...formData, quote_id: e.target.value })}
                  disabled={!formData.customer_id}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-[#bb2738] disabled:bg-slate-100"
                >
                  <option value="">None</option>
                  {filteredQuotes.map((q) => (
                    <option key={q.id} value={q.id}>{q.quote_number}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Visit Date & Time</label>
                <input
                  type="datetime-local"
                  value={formData.visit_date}
                  onChange={(e) => setFormData({ ...formData, visit_date: e.target.value })}
                  required
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-[#bb2738]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Location</label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  required
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-[#bb2738]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Remarks</label>
                <textarea
                  value={formData.remarks}
                  onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-[#bb2738]"
                />
              </div>
              <div className="border-t pt-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.payment_required}
                    onChange={(e) => setFormData({ ...formData, payment_required: e.target.checked })}
                    className="w-4 h-4 text-[#bb2738] rounded focus:ring-[#bb2738]"
                  />
                  <span className="text-sm font-medium text-slate-700">Payment Required</span>
                </label>
              </div>
              {formData.payment_required && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Payment Amount (AED)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.payment_amount}
                    onChange={(e) => setFormData({ ...formData, payment_amount: parseFloat(e.target.value) })}
                    required
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-[#bb2738]"
                  />
                </div>
              )}
              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-6 py-2.5 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-[#bb2738] hover:bg-[#a01f2f] text-white rounded-lg"
                >
                  Update
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showDeleteModal && selectedVisit && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-start gap-4 mb-6">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                <AlertCircle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900 mb-2">Delete Site Visit</h2>
                <p className="text-slate-600">
                  Are you sure you want to delete this site visit? This action cannot be undone.
                </p>
                <div className="mt-3 p-3 bg-slate-50 rounded-lg">
                  <p className="text-sm font-medium text-slate-900">{selectedVisit.customers?.name}</p>
                  <p className="text-sm text-slate-600">{selectedVisit.location}</p>
                  <p className="text-xs text-slate-500 mt-1">
                    {new Date(selectedVisit.visit_date).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setSelectedVisit(null);
                }}
                className="px-6 py-2.5 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {showPaymentModal && selectedVisit && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
            <div className="flex justify-between items-center p-6 border-b">
              <h2 className="text-xl font-bold">Record Manual Payment</h2>
              <button onClick={() => setShowPaymentModal(false)} className="p-2 hover:bg-slate-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleRecordPayment} className="p-6 space-y-4">
              <div className="bg-slate-50 rounded-lg p-4 mb-4">
                <p className="text-sm text-slate-600 mb-1">Customer</p>
                <p className="font-semibold text-slate-900">{selectedVisit.customers?.name}</p>
                <p className="text-sm text-slate-600 mt-2 mb-1">Location</p>
                <p className="text-slate-900">{selectedVisit.location}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Payment Amount (AED)</label>
                <input
                  type="number"
                  step="0.01"
                  value={paymentData.amount}
                  onChange={(e) => setPaymentData({ ...paymentData, amount: parseFloat(e.target.value) })}
                  required
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-[#bb2738]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Payment Method</label>
                <select
                  value={paymentData.payment_method}
                  onChange={(e) => setPaymentData({ ...paymentData, payment_method: e.target.value })}
                  required
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-[#bb2738]"
                >
                  <option value="Cash">Cash</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                  <option value="PayPal">PayPal</option>
                  <option value="Stripe">Stripe</option>
                  <option value="Cheque">Cheque</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Payment Date</label>
                <input
                  type="date"
                  value={paymentData.payment_date}
                  onChange={(e) => setPaymentData({ ...paymentData, payment_date: e.target.value })}
                  required
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-[#bb2738]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Transaction Reference</label>
                <input
                  type="text"
                  value={paymentData.transaction_reference}
                  onChange={(e) => setPaymentData({ ...paymentData, transaction_reference: e.target.value })}
                  placeholder="Optional"
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-[#bb2738]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Payment Notes</label>
                <textarea
                  value={paymentData.payment_notes}
                  onChange={(e) => setPaymentData({ ...paymentData, payment_notes: e.target.value })}
                  rows={3}
                  placeholder="Optional"
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-[#bb2738]"
                />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowPaymentModal(false)}
                  className="px-6 py-2.5 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg disabled:opacity-50 flex items-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <DollarSign className="w-4 h-4" />
                      Record Payment
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showShareLinkModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6">
            <div className="flex items-start gap-4 mb-6">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                <LinkIcon className="w-6 h-6 text-blue-600" />
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-bold text-slate-900 mb-2">Payment Link Generated</h2>
                <p className="text-slate-600">
                  Share this secure payment link with your customer. The link expires in 7 days.
                </p>
              </div>
            </div>
            <div className="bg-slate-50 rounded-lg p-4 mb-4">
              <p className="text-sm text-slate-600 mb-2">Payment Link</p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={paymentLink}
                  readOnly
                  className="flex-1 px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm"
                />
                <button
                  onClick={copyToClipboard}
                  className="px-4 py-2 bg-[#bb2738] hover:bg-[#a01f2f] text-white rounded-lg flex items-center gap-2"
                >
                  {copied ? (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      Copy
                    </>
                  )}
                </button>
              </div>
            </div>
            <div className="flex justify-end">
              <button
                onClick={() => {
                  setShowShareLinkModal(false);
                  setPaymentLink('');
                  setCopied(false);
                }}
                className="px-6 py-2.5 bg-slate-600 hover:bg-slate-700 text-white rounded-lg"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
