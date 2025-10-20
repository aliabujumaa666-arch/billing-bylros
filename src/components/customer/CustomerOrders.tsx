import { useEffect, useState } from 'react';
import { useCustomerAuth } from '../../contexts/CustomerAuthContext';
import { supabase } from '../../lib/supabase';
import { Package, Calendar, Truck, Wrench } from 'lucide-react';

export function CustomerOrders() {
  const { customerData } = useCustomerAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (customerData) {
      fetchOrders();
    }
  }, [customerData]);

  const fetchOrders = async () => {
    if (!customerData) return;

    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('customer_id', customerData.customer_id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching orders:', error);
      return;
    }

    setOrders(data || []);
    setLoading(false);
  };

  const getStatusProgress = (status: string) => {
    switch (status) {
      case 'Confirmed':
        return 25;
      case 'In Production':
        return 50;
      case 'Delivered':
        return 75;
      case 'Installed':
        return 100;
      default:
        return 0;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#bb2738]"></div>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="bg-white rounded-xl p-12 text-center border border-slate-200">
        <Package className="w-16 h-16 text-slate-300 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-slate-800 mb-2">No Orders Yet</h3>
        <p className="text-slate-600">You haven't placed any orders with BYLROS yet.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-800 mb-2">My Orders</h2>
        <p className="text-slate-600">Track the progress of your orders</p>
      </div>

      <div className="space-y-6">
        {orders.map((order) => {
          const progress = getStatusProgress(order.status);

          return (
            <div key={order.id} className="bg-white rounded-xl p-6 border border-slate-200 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Package className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-slate-800 mb-1">
                      Order #{order.order_number}
                    </h3>
                    <p className="text-sm text-slate-600">
                      Placed on {new Date(order.order_date).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  order.status === 'Confirmed' ? 'bg-blue-100 text-blue-700' :
                  order.status === 'In Production' ? 'bg-amber-100 text-amber-700' :
                  order.status === 'Delivered' ? 'bg-purple-100 text-purple-700' :
                  'bg-green-100 text-green-700'
                }`}>
                  {order.status}
                </span>
              </div>

              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-slate-700">Progress</span>
                  <span className="text-sm font-medium text-slate-700">{progress}%</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-[#bb2738] to-green-600 transition-all duration-500"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
                  <Calendar className="w-5 h-5 text-slate-600 mt-0.5" />
                  <div>
                    <p className="text-xs text-slate-600 mb-1">Order Date</p>
                    <p className="text-sm font-semibold text-slate-800">
                      {new Date(order.order_date).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
                  <Truck className="w-5 h-5 text-slate-600 mt-0.5" />
                  <div>
                    <p className="text-xs text-slate-600 mb-1">Delivery Date</p>
                    <p className="text-sm font-semibold text-slate-800">
                      {order.delivery_date ? new Date(order.delivery_date).toLocaleDateString() : 'TBD'}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
                  <Wrench className="w-5 h-5 text-slate-600 mt-0.5" />
                  <div>
                    <p className="text-xs text-slate-600 mb-1">Installation Date</p>
                    <p className="text-sm font-semibold text-slate-800">
                      {order.installation_date ? new Date(order.installation_date).toLocaleDateString() : 'TBD'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-slate-200">
                <div className="flex items-center gap-2">
                  <div className="flex-1 flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${order.status === 'Confirmed' || order.status === 'In Production' || order.status === 'Delivered' || order.status === 'Installed' ? 'bg-green-500' : 'bg-slate-300'}`} />
                    <span className="text-xs text-slate-600">Confirmed</span>
                  </div>
                  <div className="flex-1 flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${order.status === 'In Production' || order.status === 'Delivered' || order.status === 'Installed' ? 'bg-green-500' : 'bg-slate-300'}`} />
                    <span className="text-xs text-slate-600">In Production</span>
                  </div>
                  <div className="flex-1 flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${order.status === 'Delivered' || order.status === 'Installed' ? 'bg-green-500' : 'bg-slate-300'}`} />
                    <span className="text-xs text-slate-600">Delivered</span>
                  </div>
                  <div className="flex-1 flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${order.status === 'Installed' ? 'bg-green-500' : 'bg-slate-300'}`} />
                    <span className="text-xs text-slate-600">Installed</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
