import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Plus, Package, CreditCard as Edit, Trash2, X, ArrowRight, Download } from 'lucide-react';
import { exportOrderToPDF } from '../utils/exportUtils';
import { useBrand } from '../contexts/BrandContext';

export function Orders() {
  const { brand } = useBrand();
  const [orders, setOrders] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [quotes, setQuotes] = useState<any[]>([]);
  const [siteVisits, setSiteVisits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingOrder, setEditingOrder] = useState<any>(null);
  const [formData, setFormData] = useState({
    customer_id: '',
    quote_id: '',
    site_visit_id: '',
    order_number: '',
    order_date: new Date().toISOString().split('T')[0],
    delivery_date: '',
    installation_date: '',
    status: 'Confirmed',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [ordersData, customersData, quotesData, visitsData] = await Promise.all([
        supabase.from('orders').select('*, customers(*), quotes(*), site_visits(*)').order('created_at', { ascending: false }),
        supabase.from('customers').select('*').order('name'),
        supabase.from('quotes').select('*').order('created_at', { ascending: false }),
        supabase.from('site_visits').select('*').order('created_at', { ascending: false }),
      ]);

      setOrders(ordersData.data || []);
      setCustomers(customersData.data || []);
      setQuotes(quotesData.data || []);
      setSiteVisits(visitsData.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateOrderNumber = () => {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `ORD-${year}${month}-${random}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const orderData = {
      ...formData,
      order_number: editingOrder?.order_number || generateOrderNumber(),
      quote_id: formData.quote_id || null,
      site_visit_id: formData.site_visit_id || null,
    };

    try {
      if (editingOrder) {
        await supabase.from('orders').update(orderData).eq('id', editingOrder.id);
      } else {
        await supabase.from('orders').insert([orderData]);
      }

      setShowModal(false);
      setEditingOrder(null);
      resetForm();
      fetchData();
    } catch (error) {
      console.error('Error saving order:', error);
      alert('Failed to save order');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this order?')) return;
    try {
      await supabase.from('orders').delete().eq('id', id);
      fetchData();
    } catch (error) {
      console.error('Error deleting order:', error);
    }
  };

  const handleConvertToInvoice = async (order: any) => {
    if (!confirm(`Create invoice for order ${order.order_number}?`)) return;

    try {
      const invoiceNumber = `INV-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;

      const totalAmount = order.quotes?.total || 0;

      await supabase.from('invoices').insert([{
        customer_id: order.customer_id,
        order_id: order.id,
        invoice_number: invoiceNumber,
        total_amount: totalAmount,
        deposit_paid: 0,
        payment_before_delivery: 0,
        balance: totalAmount,
        status: 'Unpaid',
        due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      }]);

      alert(`Invoice ${invoiceNumber} created successfully!`);
      fetchData();
    } catch (error) {
      console.error('Error creating invoice:', error);
      alert('Failed to create invoice');
    }
  };

  const resetForm = () => {
    setFormData({
      customer_id: '',
      quote_id: '',
      site_visit_id: '',
      order_number: '',
      order_date: new Date().toISOString().split('T')[0],
      delivery_date: '',
      installation_date: '',
      status: 'Confirmed',
    });
  };

  const openEditModal = (order: any) => {
    setEditingOrder(order);
    setFormData({
      customer_id: order.customer_id,
      quote_id: order.quote_id || '',
      site_visit_id: order.site_visit_id || '',
      order_number: order.order_number,
      order_date: order.order_date,
      delivery_date: order.delivery_date || '',
      installation_date: order.installation_date || '',
      status: order.status,
    });
    setShowModal(true);
  };

  const getStatusColor = (status: string) => {
    const colors = {
      'Confirmed': 'bg-blue-100 text-blue-800',
      'In Production': 'bg-yellow-100 text-yellow-800',
      'Delivered': 'bg-green-100 text-green-800',
      'Installed': 'bg-purple-100 text-purple-800',
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const handleDownloadPDF = async (order: any) => {
    await exportOrderToPDF(order, order.customers, brand);
  };

  const filteredQuotes = quotes.filter(q => q.customer_id === formData.customer_id);
  const filteredVisits = siteVisits.filter(v => v.customer_id === formData.customer_id);

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-slate-800">Orders</h1>
        <button
          onClick={() => {
            resetForm();
            setEditingOrder(null);
            setShowModal(true);
          }}
          className="flex items-center gap-2 bg-[#bb2738] hover:bg-[#a01f2f] text-white px-4 py-2.5 rounded-lg transition-colors"
        >
          <Plus className="w-5 h-5" />
          Create Order
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Order #</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Customer</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Quote</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Order Date</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Delivery</th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-slate-600 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {loading ? (
                <tr><td colSpan={7} className="px-6 py-8 text-center text-slate-500">Loading...</td></tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <Package className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                    <p className="text-slate-500">No orders yet</p>
                  </td>
                </tr>
              ) : (
                orders.map((order) => (
                  <tr key={order.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-slate-800">{order.order_number}</td>
                    <td className="px-6 py-4 text-slate-600">{order.customers?.name}</td>
                    <td className="px-6 py-4 text-slate-600">{order.quotes?.quote_number || '-'}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-600">{new Date(order.order_date).toLocaleDateString()}</td>
                    <td className="px-6 py-4 text-slate-600">
                      {order.delivery_date ? new Date(order.delivery_date).toLocaleDateString() : '-'}
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <button
                        onClick={() => handleDownloadPDF(order)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-sm text-green-700 hover:bg-green-50 rounded-lg transition-colors"
                        title="Download PDF"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                      {(order.status === 'Delivered' || order.status === 'Installed') && (
                        <button
                          onClick={() => handleConvertToInvoice(order)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 text-sm text-[#bb2738] hover:bg-red-50 rounded-lg transition-colors font-medium"
                        >
                          <ArrowRight className="w-4 h-4" />
                          Create Invoice
                        </button>
                      )}
                      <button
                        onClick={() => openEditModal(order)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-sm text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(order.id)}
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
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b border-slate-200 sticky top-0 bg-white">
              <h2 className="text-xl font-bold text-slate-800">
                {editingOrder ? 'Edit' : 'Create'} Order
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
                    onChange={(e) => setFormData({ ...formData, customer_id: e.target.value, quote_id: '', site_visit_id: '' })}
                    required
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-[#bb2738]"
                  >
                    <option value="">Select Customer</option>
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>{c.name} - {c.phone}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Related Quote</label>
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
                  <label className="block text-sm font-medium text-slate-700 mb-2">Related Site Visit</label>
                  <select
                    value={formData.site_visit_id}
                    onChange={(e) => setFormData({ ...formData, site_visit_id: e.target.value })}
                    disabled={!formData.customer_id}
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-[#bb2738] disabled:bg-slate-100"
                  >
                    <option value="">None</option>
                    {filteredVisits.map((v) => (
                      <option key={v.id} value={v.id}>
                        {new Date(v.visit_date).toLocaleDateString()} - {v.location}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Order Date *</label>
                  <input
                    type="date"
                    value={formData.order_date}
                    onChange={(e) => setFormData({ ...formData, order_date: e.target.value })}
                    required
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-[#bb2738]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Delivery Date</label>
                  <input
                    type="date"
                    value={formData.delivery_date}
                    onChange={(e) => setFormData({ ...formData, delivery_date: e.target.value })}
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-[#bb2738]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Installation Date</label>
                  <input
                    type="date"
                    value={formData.installation_date}
                    onChange={(e) => setFormData({ ...formData, installation_date: e.target.value })}
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-[#bb2738]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Status *</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    required
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-[#bb2738]"
                  >
                    <option value="Confirmed">Confirmed</option>
                    <option value="In Production">In Production</option>
                    <option value="Delivered">Delivered</option>
                    <option value="Installed">Installed</option>
                  </select>
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
                  {editingOrder ? 'Update' : 'Create'} Order
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
