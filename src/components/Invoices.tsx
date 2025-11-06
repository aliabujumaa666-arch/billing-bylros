import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { exportInvoiceToPDF } from '../utils/exportUtils';
import { useBrand } from '../contexts/BrandContext';
import { Download, FileCheck, Plus, CreditCard as Edit, Trash2, X, DollarSign } from 'lucide-react';

export function Invoices() {
  const { brand } = useBrand();
  const [invoices, setInvoices] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<any>(null);
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [formData, setFormData] = useState({
    customer_id: '',
    order_id: '',
    total_amount: 0,
    deposit_paid: 0,
    payment_before_delivery: 0,
    due_date: '',
  });
  const [paymentData, setPaymentData] = useState({
    amount: 0,
    payment_date: new Date().toISOString().split('T')[0],
    payment_method: 'Cash',
    reference: '',
    notes: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [invoicesData, customersData, ordersData] = await Promise.all([
        supabase.from('invoices').select('*, customers(*), orders(*)').order('created_at', { ascending: false }),
        supabase.from('customers').select('*').order('name'),
        supabase.from('orders').select('*').order('created_at', { ascending: false }),
      ]);

      setInvoices(invoicesData.data || []);
      setCustomers(customersData.data || []);
      setOrders(ordersData.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateInvoiceNumber = () => {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `INV-${year}${month}-${random}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const balance = formData.total_amount - formData.deposit_paid - formData.payment_before_delivery;
    const status = balance <= 0 ? 'Paid' : (formData.deposit_paid > 0 || formData.payment_before_delivery > 0) ? 'Partial' : 'Unpaid';

    const invoiceData = {
      ...formData,
      invoice_number: editingInvoice?.invoice_number || generateInvoiceNumber(),
      balance,
      status,
      order_id: formData.order_id || null,
    };

    try {
      if (editingInvoice) {
        await supabase.from('invoices').update(invoiceData).eq('id', editingInvoice.id);
      } else {
        await supabase.from('invoices').insert([invoiceData]);
      }

      setShowModal(false);
      setEditingInvoice(null);
      resetForm();
      fetchData();
    } catch (error) {
      console.error('Error saving invoice:', error);
      alert('Failed to save invoice');
    }
  };

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedInvoice) return;

    try {
      await supabase.from('payments').insert([{
        invoice_id: selectedInvoice.id,
        ...paymentData,
      }]);

      const newBalance = selectedInvoice.balance - paymentData.amount;
      const newStatus = newBalance <= 0 ? 'Paid' : 'Partial';

      await supabase.from('invoices').update({
        balance: newBalance,
        status: newStatus,
      }).eq('id', selectedInvoice.id);

      setShowPaymentModal(false);
      setSelectedInvoice(null);
      setPaymentData({
        amount: 0,
        payment_date: new Date().toISOString().split('T')[0],
        payment_method: 'Cash',
        reference: '',
        notes: '',
      });
      fetchData();
      alert('Payment recorded successfully!');
    } catch (error) {
      console.error('Error recording payment:', error);
      alert('Failed to record payment');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this invoice?')) return;
    try {
      await supabase.from('invoices').delete().eq('id', id);
      fetchData();
    } catch (error) {
      console.error('Error deleting invoice:', error);
    }
  };

  const handleExportPDF = async (invoice: any) => {
    const { data: payments } = await supabase
      .from('payments')
      .select('*')
      .eq('invoice_id', invoice.id)
      .order('payment_date', { ascending: true });
    exportInvoiceToPDF(invoice, invoice.customers, payments || [], brand);
  };

  const resetForm = () => {
    setFormData({
      customer_id: '',
      order_id: '',
      total_amount: 0,
      deposit_paid: 0,
      payment_before_delivery: 0,
      due_date: '',
    });
  };

  const openEditModal = (invoice: any) => {
    setEditingInvoice(invoice);
    setFormData({
      customer_id: invoice.customer_id,
      order_id: invoice.order_id || '',
      total_amount: invoice.total_amount,
      deposit_paid: invoice.deposit_paid,
      payment_before_delivery: invoice.payment_before_delivery,
      due_date: invoice.due_date || '',
    });
    setShowModal(true);
  };

  const openPaymentModal = (invoice: any) => {
    setSelectedInvoice(invoice);
    setPaymentData({
      amount: invoice.balance,
      payment_date: new Date().toISOString().split('T')[0],
      payment_method: 'Cash',
      reference: '',
      notes: '',
    });
    setShowPaymentModal(true);
  };

  const getStatusColor = (status: string) => {
    const colors = {
      Paid: 'bg-green-100 text-green-800',
      Partial: 'bg-yellow-100 text-yellow-800',
      Unpaid: 'bg-red-100 text-red-800',
    };
    return colors[status as keyof typeof colors];
  };

  const filteredOrders = orders.filter(o => o.customer_id === formData.customer_id);

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-slate-800">Invoices</h1>
        <button
          onClick={() => {
            resetForm();
            setEditingInvoice(null);
            setShowModal(true);
          }}
          className="flex items-center gap-2 bg-[#bb2738] hover:bg-[#a01f2f] text-white px-4 py-2.5 rounded-lg transition-colors"
        >
          <Plus className="w-5 h-5" />
          Create Invoice
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Invoice #</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Customer</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Order</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Total</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Balance</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Status</th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-slate-600 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {loading ? (
                <tr><td colSpan={7} className="px-6 py-8 text-center text-slate-500">Loading...</td></tr>
              ) : invoices.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <FileCheck className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                    <p className="text-slate-500">No invoices yet</p>
                  </td>
                </tr>
              ) : (
                invoices.map((invoice) => (
                  <tr key={invoice.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-slate-800">{invoice.invoice_number}</td>
                    <td className="px-6 py-4 text-slate-600">{invoice.customers?.name}</td>
                    <td className="px-6 py-4 text-slate-600">{invoice.orders?.order_number || '-'}</td>
                    <td className="px-6 py-4 text-slate-600">
                      AED {invoice.total_amount.toFixed(2)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-800">AED {invoice.balance.toFixed(2)}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(invoice.status)}`}>
                        {invoice.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      {invoice.status !== 'Paid' && (
                        <button
                          onClick={() => openPaymentModal(invoice)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 text-sm text-[#bb2738] hover:bg-red-50 rounded-lg transition-colors font-medium"
                        >
                          <DollarSign className="w-4 h-4" />
                          Add Payment
                        </button>
                      )}
                      <button
                        onClick={() => handleExportPDF(invoice)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-sm text-green-700 hover:bg-green-50 rounded-lg transition-colors"
                      >
                        <Download className="w-4 h-4" />
                        PDF
                      </button>
                      <button
                        onClick={() => openEditModal(invoice)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-sm text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(invoice.id)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-sm text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full">
            <div className="flex justify-between items-center p-6 border-b border-slate-200">
              <h2 className="text-xl font-bold text-slate-800">
                {editingInvoice ? 'Edit' : 'Create'} Invoice
              </h2>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-slate-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-2">Customer *</label>
                  <select
                    value={formData.customer_id}
                    onChange={(e) => setFormData({ ...formData, customer_id: e.target.value, order_id: '' })}
                    required
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-[#bb2738]"
                  >
                    <option value="">Select Customer</option>
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>{c.name} - {c.phone}</option>
                    ))}
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-2">Related Order</label>
                  <select
                    value={formData.order_id}
                    onChange={(e) => setFormData({ ...formData, order_id: e.target.value })}
                    disabled={!formData.customer_id}
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-[#bb2738] disabled:bg-slate-100"
                  >
                    <option value="">None</option>
                    {filteredOrders.map((o) => (
                      <option key={o.id} value={o.id}>{o.order_number}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Total Amount *</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.total_amount || ''}
                    onChange={(e) => setFormData({ ...formData, total_amount: parseFloat(e.target.value) || 0 })}
                    required
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-[#bb2738]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Due Date</label>
                  <input
                    type="date"
                    value={formData.due_date}
                    onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-[#bb2738]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Deposit Paid</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.deposit_paid || ''}
                    onChange={(e) => setFormData({ ...formData, deposit_paid: parseFloat(e.target.value) || 0 })}
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-[#bb2738]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Payment Before Delivery</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.payment_before_delivery || ''}
                    onChange={(e) => setFormData({ ...formData, payment_before_delivery: parseFloat(e.target.value) || 0 })}
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-[#bb2738]"
                  />
                </div>
              </div>

              <div className="bg-slate-50 p-4 rounded-lg">
                <div className="text-sm text-slate-600">
                  Balance: <span className="font-semibold text-lg text-slate-800">
                    AED {(formData.total_amount - formData.deposit_paid - formData.payment_before_delivery).toFixed(2)}
                  </span>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-6 py-2.5 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-[#bb2738] hover:bg-[#a01f2f] text-white rounded-lg transition-colors"
                >
                  {editingInvoice ? 'Update' : 'Create'} Invoice
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showPaymentModal && selectedInvoice && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
            <div className="flex justify-between items-center p-6 border-b border-slate-200">
              <h2 className="text-xl font-bold text-slate-800">Record Payment</h2>
              <button onClick={() => setShowPaymentModal(false)} className="p-2 hover:bg-slate-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handlePaymentSubmit} className="p-6 space-y-4">
              <div className="bg-slate-50 p-4 rounded-lg mb-4">
                <p className="text-sm text-slate-600">Invoice: <span className="font-medium">{selectedInvoice.invoice_number}</span></p>
                <p className="text-sm text-slate-600 mt-1">Outstanding Balance: <span className="font-semibold text-lg text-[#bb2738]">AED {selectedInvoice.balance.toFixed(2)}</span></p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Payment Amount *</label>
                <input
                  type="number"
                  step="0.01"
                  value={paymentData.amount || ''}
                  onChange={(e) => setPaymentData({ ...paymentData, amount: parseFloat(e.target.value) || 0 })}
                  max={selectedInvoice.balance}
                  required
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-[#bb2738]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Payment Date *</label>
                <input
                  type="date"
                  value={paymentData.payment_date}
                  onChange={(e) => setPaymentData({ ...paymentData, payment_date: e.target.value })}
                  required
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-[#bb2738]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Payment Method *</label>
                <select
                  value={paymentData.payment_method}
                  onChange={(e) => setPaymentData({ ...paymentData, payment_method: e.target.value })}
                  required
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-[#bb2738]"
                >
                  <option value="Cash">Cash</option>
                  <option value="Card">Card</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                  <option value="Cheque">Cheque</option>
                  <option value="PayPal">PayPal</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Reference Number</label>
                <input
                  type="text"
                  value={paymentData.reference}
                  onChange={(e) => setPaymentData({ ...paymentData, reference: e.target.value })}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-[#bb2738]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Notes</label>
                <textarea
                  value={paymentData.notes}
                  onChange={(e) => setPaymentData({ ...paymentData, notes: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-[#bb2738]"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowPaymentModal(false)}
                  className="px-6 py-2.5 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-[#bb2738] hover:bg-[#a01f2f] text-white rounded-lg transition-colors"
                >
                  Record Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
