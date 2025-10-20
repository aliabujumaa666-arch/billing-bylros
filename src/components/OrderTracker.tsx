import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Search, Package, FileText, Calendar, ShoppingCart, FileCheck, CheckCircle } from 'lucide-react';

export function OrderTracker() {
  const [searchTerm, setSearchTerm] = useState('');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [notFound, setNotFound] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchTerm.trim()) return;

    setLoading(true);
    setNotFound(false);
    setResult(null);

    try {
      const { data: customerData } = await supabase
        .from('customers')
        .select('id, name, phone, email')
        .or(`phone.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`)
        .limit(1)
        .maybeSingle();

      if (customerData) {
        const [ordersData, quotesData, visitsData, invoicesData] = await Promise.all([
          supabase.from('orders').select('*, quotes(*)').eq('customer_id', customerData.id).order('created_at', { ascending: false }),
          supabase.from('quotes').select('*').eq('customer_id', customerData.id).order('created_at', { ascending: false }),
          supabase.from('site_visits').select('*').eq('customer_id', customerData.id).order('visit_date', { ascending: false }),
          supabase.from('invoices').select('*').eq('customer_id', customerData.id).order('created_at', { ascending: false }),
        ]);

        setResult({
          customer: customerData,
          orders: ordersData.data || [],
          quotes: quotesData.data || [],
          visits: visitsData.data || [],
          invoices: invoicesData.data || [],
        });
      } else {
        setNotFound(true);
      }
    } catch (error) {
      console.error('Error searching:', error);
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  };

  const getStatusProgress = (status: string) => {
    const statuses = ['Confirmed', 'In Production', 'Delivered', 'Installed'];
    const index = statuses.indexOf(status);
    return ((index + 1) / statuses.length) * 100;
  };

  const getStatusColor = (status: string, type: 'quote' | 'visit' | 'order' | 'invoice') => {
    if (type === 'quote') {
      const colors = { Draft: 'bg-gray-100 text-gray-700', Sent: 'bg-blue-100 text-blue-700', Accepted: 'bg-green-100 text-green-700', Rejected: 'bg-red-100 text-red-700' };
      return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-700';
    }
    if (type === 'visit') {
      const colors = { Scheduled: 'bg-yellow-100 text-yellow-700', Completed: 'bg-green-100 text-green-700', Cancelled: 'bg-red-100 text-red-700' };
      return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-700';
    }
    if (type === 'order') {
      const colors = { Confirmed: 'bg-blue-100 text-blue-700', 'In Production': 'bg-yellow-100 text-yellow-700', Delivered: 'bg-green-100 text-green-700', Installed: 'bg-purple-100 text-purple-700' };
      return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-700';
    }
    if (type === 'invoice') {
      const colors = { Unpaid: 'bg-red-100 text-red-700', Partial: 'bg-yellow-100 text-yellow-700', Paid: 'bg-green-100 text-green-700' };
      return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-700';
    }
    return 'bg-gray-100 text-gray-700';
  };

  return (
    <div>
      <h1 className="text-3xl font-bold text-slate-800 mb-2">Order Tracker</h1>
      <p className="text-slate-600 mb-6">Track your complete journey from quote to delivery by entering your phone number or email</p>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <form onSubmit={handleSearch} className="mb-6">
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Enter phone number or email..."
                className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-[#bb2738]"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 bg-[#bb2738] hover:bg-[#a01f2f] text-white rounded-lg transition-colors disabled:opacity-50"
            >
              {loading ? 'Searching...' : 'Track'}
            </button>
          </div>
        </form>

        {notFound && (
          <div className="text-center py-8">
            <p className="text-slate-500">No records found. Please check your phone number or email.</p>
          </div>
        )}

        {result && (
          <div>
            <div className="mb-6 p-4 bg-slate-50 rounded-lg">
              <h3 className="font-semibold text-slate-800 mb-1">{result.customer.name}</h3>
              <p className="text-sm text-slate-600">{result.customer.phone} {result.customer.email && `• ${result.customer.email}`}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <FileText className="w-5 h-5 text-blue-600" />
                  <span className="text-sm font-medium text-slate-700">Quotes</span>
                </div>
                <p className="text-2xl font-bold text-blue-600">{result.quotes.length}</p>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="w-5 h-5 text-purple-600" />
                  <span className="text-sm font-medium text-slate-700">Site Visits</span>
                </div>
                <p className="text-2xl font-bold text-purple-600">{result.visits.length}</p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <ShoppingCart className="w-5 h-5 text-green-600" />
                  <span className="text-sm font-medium text-slate-700">Orders</span>
                </div>
                <p className="text-2xl font-bold text-green-600">{result.orders.length}</p>
              </div>
              <div className="bg-orange-50 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <FileCheck className="w-5 h-5 text-orange-600" />
                  <span className="text-sm font-medium text-slate-700">Invoices</span>
                </div>
                <p className="text-2xl font-bold text-orange-600">{result.invoices.length}</p>
              </div>
            </div>

            <div className="space-y-6">
              {result.quotes.length > 0 && (
                <div>
                  <h3 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-blue-600" />
                    Quotes
                  </h3>
                  <div className="space-y-2">
                    {result.quotes.map((quote: any) => (
                      <div key={quote.id} className="p-4 border border-slate-200 rounded-lg bg-slate-50">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium text-slate-800">{quote.quote_number}</p>
                            <p className="text-sm text-slate-600 mt-1">AED {quote.total?.toFixed(2) || '0.00'}</p>
                            <p className="text-xs text-slate-500 mt-1">{new Date(quote.created_at).toLocaleDateString()}</p>
                          </div>
                          <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(quote.status, 'quote')}`}>
                            {quote.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {result.visits.length > 0 && (
                <div>
                  <h3 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-purple-600" />
                    Site Visits
                  </h3>
                  <div className="space-y-2">
                    {result.visits.map((visit: any) => (
                      <div key={visit.id} className="p-4 border border-slate-200 rounded-lg bg-slate-50">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium text-slate-800">{visit.location}</p>
                            <p className="text-sm text-slate-600 mt-1">{new Date(visit.visit_date).toLocaleString()}</p>
                          </div>
                          <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(visit.status, 'visit')}`}>
                            {visit.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {result.orders.length === 0 ? (
                <div className="text-center py-12 border border-slate-200 rounded-lg bg-slate-50">
                  <Package className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                  <p className="text-slate-500">No orders yet</p>
                </div>
              ) : (
                <div>
                  <h3 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
                    <ShoppingCart className="w-5 h-5 text-green-600" />
                    Orders
                  </h3>
                  <div className="space-y-4">
                    {result.orders.map((order: any) => (
                      <div key={order.id} className="p-6 border border-slate-200 rounded-lg bg-white">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h4 className="font-semibold text-slate-800">{order.order_number}</h4>
                            {order.quotes && (
                              <p className="text-xs text-slate-500 mt-0.5">From Quote: {order.quotes.quote_number}</p>
                            )}
                            <p className="text-sm text-slate-600 mt-1">
                              Ordered: {new Date(order.order_date).toLocaleDateString()}
                            </p>
                          </div>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status, 'order')}`}>
                            {order.status}
                          </span>
                        </div>

                        <div className="mb-4">
                          <div className="flex justify-between text-xs text-slate-600 mb-2">
                            <span>Confirmed</span>
                            <span>In Production</span>
                            <span>Delivered</span>
                            <span>Installed</span>
                          </div>
                          <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-[#bb2738] transition-all duration-500"
                              style={{ width: `${getStatusProgress(order.status)}%` }}
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div>
                            <span className="text-slate-600">Order Date:</span>
                            <p className="font-medium text-slate-800">
                              {new Date(order.order_date).toLocaleDateString()}
                            </p>
                          </div>
                          {order.delivery_date && (
                            <div>
                              <span className="text-slate-600">Delivery Date:</span>
                              <p className="font-medium text-slate-800">
                                {new Date(order.delivery_date).toLocaleDateString()}
                              </p>
                            </div>
                          )}
                          {order.installation_date && (
                            <div>
                              <span className="text-slate-600">Installation Date:</span>
                              <p className="font-medium text-slate-800">
                                {new Date(order.installation_date).toLocaleDateString()}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {result.invoices.length > 0 && (
                <div>
                  <h3 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
                    <FileCheck className="w-5 h-5 text-orange-600" />
                    Invoices
                  </h3>
                  <div className="space-y-2">
                    {result.invoices.map((invoice: any) => (
                      <div key={invoice.id} className="p-4 border border-slate-200 rounded-lg bg-slate-50">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium text-slate-800">{invoice.invoice_number}</p>
                            <p className="text-sm text-slate-600 mt-1">
                              Total: AED {invoice.total_amount?.toFixed(2) || '0.00'} • Balance: AED {invoice.balance?.toFixed(2) || '0.00'}
                            </p>
                            <p className="text-xs text-slate-500 mt-1">{new Date(invoice.created_at).toLocaleDateString()}</p>
                          </div>
                          <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(invoice.status, 'invoice')}`}>
                            {invoice.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {result.orders.length > 0 && (
              <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-green-800">Your Journey</p>
                    <p className="text-sm text-green-700 mt-1">
                      We're committed to delivering exceptional service. Track your progress through each stage of your project.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
