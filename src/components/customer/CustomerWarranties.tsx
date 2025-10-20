import { useEffect, useState } from 'react';
import { useCustomerAuth } from '../../contexts/CustomerAuthContext';
import { supabase } from '../../lib/supabase';
import { Shield, Calendar, Package, FileText, CheckCircle, Clock, AlertCircle } from 'lucide-react';

interface Warranty {
  id: string;
  warranty_number: string;
  product_name: string;
  product_description: string | null;
  serial_number: string | null;
  start_date: string;
  end_date: string;
  duration_months: number;
  coverage_type: string;
  coverage_details: string | null;
  status: string;
  registration_date: string;
  orders: {
    order_number: string;
  } | null;
}

export function CustomerWarranties() {
  const { customerData } = useCustomerAuth();
  const [warranties, setWarranties] = useState<Warranty[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedWarranty, setSelectedWarranty] = useState<Warranty | null>(null);

  useEffect(() => {
    if (customerData) {
      loadWarranties();
    }
  }, [customerData]);

  const loadWarranties = async () => {
    if (!customerData) return;

    try {
      const { data, error } = await supabase
        .from('warranties')
        .select(`
          *,
          orders(order_number)
        `)
        .eq('customer_id', customerData.customer_id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setWarranties(data || []);
    } catch (error) {
      console.error('Error loading warranties:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-700 border-green-200';
      case 'expired': return 'bg-red-100 text-red-700 border-red-200';
      case 'claimed': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'cancelled': return 'bg-slate-100 text-slate-700 border-slate-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle className="w-5 h-5" />;
      case 'expired': return <AlertCircle className="w-5 h-5" />;
      case 'claimed': return <Clock className="w-5 h-5" />;
      default: return <Shield className="w-5 h-5" />;
    }
  };

  const getDaysRemaining = (endDate: string) => {
    const end = new Date(endDate);
    const today = new Date();
    const diffTime = end.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#bb2738]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">My Warranties</h2>
          <p className="text-slate-600 mt-1">View and manage your product warranties</p>
        </div>
      </div>

      {warranties.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <Shield className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-800 mb-2">No Warranties Yet</h3>
          <p className="text-slate-600">Your product warranties will appear here once installations are completed</p>
        </div>
      ) : (
        <div className="grid gap-6">
          {warranties.map((warranty) => {
            const daysRemaining = getDaysRemaining(warranty.end_date);
            const isExpiringSoon = daysRemaining <= 30 && daysRemaining > 0;

            return (
              <div
                key={warranty.id}
                className="bg-white rounded-xl border border-slate-200 overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => setSelectedWarranty(warranty)}
              >
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <Shield className="w-6 h-6 text-[#bb2738]" />
                        <div>
                          <h3 className="text-lg font-semibold text-slate-800">{warranty.product_name}</h3>
                          <p className="text-sm text-slate-500">{warranty.warranty_number}</p>
                        </div>
                      </div>
                      {warranty.product_description && (
                        <p className="text-sm text-slate-600 ml-9">{warranty.product_description}</p>
                      )}
                    </div>
                    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border ${getStatusColor(warranty.status)}`}>
                      {getStatusIcon(warranty.status)}
                      <span className="text-sm font-medium capitalize">{warranty.status}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 pt-4 border-t border-slate-100">
                    <div>
                      <p className="text-xs text-slate-500 mb-1">Order Number</p>
                      <p className="text-sm font-medium text-slate-800">{warranty.orders?.order_number || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 mb-1">Start Date</p>
                      <p className="text-sm font-medium text-slate-800">{new Date(warranty.start_date).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 mb-1">End Date</p>
                      <p className="text-sm font-medium text-slate-800">{new Date(warranty.end_date).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 mb-1">Duration</p>
                      <p className="text-sm font-medium text-slate-800">{warranty.duration_months} months</p>
                    </div>
                  </div>

                  {warranty.status === 'active' && (
                    <div className={`mt-4 p-3 rounded-lg ${isExpiringSoon ? 'bg-amber-50 border border-amber-200' : 'bg-green-50 border border-green-200'}`}>
                      <div className="flex items-center gap-2">
                        {isExpiringSoon ? (
                          <>
                            <Clock className="w-4 h-4 text-amber-600" />
                            <span className="text-sm font-medium text-amber-800">
                              Expires in {daysRemaining} days
                            </span>
                          </>
                        ) : (
                          <>
                            <CheckCircle className="w-4 h-4 text-green-600" />
                            <span className="text-sm font-medium text-green-800">
                              {daysRemaining} days remaining
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {selectedWarranty && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setSelectedWarranty(null)}>
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b border-slate-200">
              <div className="flex items-center gap-3">
                <Shield className="w-8 h-8 text-[#bb2738]" />
                <div>
                  <h3 className="text-xl font-semibold text-slate-800">{selectedWarranty.product_name}</h3>
                  <p className="text-sm text-slate-500">{selectedWarranty.warranty_number}</p>
                </div>
              </div>
            </div>

            <div className="p-6 space-y-6">
              <div className={`flex items-center gap-3 px-4 py-3 rounded-lg border ${getStatusColor(selectedWarranty.status)}`}>
                {getStatusIcon(selectedWarranty.status)}
                <div className="flex-1">
                  <p className="font-medium capitalize">{selectedWarranty.status} Warranty</p>
                  {selectedWarranty.status === 'active' && (
                    <p className="text-sm opacity-80">
                      Valid until {new Date(selectedWarranty.end_date).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </div>

              {selectedWarranty.product_description && (
                <div>
                  <h4 className="font-semibold text-slate-800 mb-2">Product Description</h4>
                  <p className="text-slate-600">{selectedWarranty.product_description}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 p-4 rounded-lg">
                  <div className="flex items-center gap-2 text-slate-600 mb-1">
                    <Package className="w-4 h-4" />
                    <p className="text-sm font-medium">Order Number</p>
                  </div>
                  <p className="text-slate-800 font-semibold">{selectedWarranty.orders?.order_number || 'N/A'}</p>
                </div>

                {selectedWarranty.serial_number && (
                  <div className="bg-slate-50 p-4 rounded-lg">
                    <div className="flex items-center gap-2 text-slate-600 mb-1">
                      <FileText className="w-4 h-4" />
                      <p className="text-sm font-medium">Serial Number</p>
                    </div>
                    <p className="text-slate-800 font-semibold">{selectedWarranty.serial_number}</p>
                  </div>
                )}

                <div className="bg-slate-50 p-4 rounded-lg">
                  <div className="flex items-center gap-2 text-slate-600 mb-1">
                    <Calendar className="w-4 h-4" />
                    <p className="text-sm font-medium">Start Date</p>
                  </div>
                  <p className="text-slate-800 font-semibold">{new Date(selectedWarranty.start_date).toLocaleDateString()}</p>
                </div>

                <div className="bg-slate-50 p-4 rounded-lg">
                  <div className="flex items-center gap-2 text-slate-600 mb-1">
                    <Calendar className="w-4 h-4" />
                    <p className="text-sm font-medium">End Date</p>
                  </div>
                  <p className="text-slate-800 font-semibold">{new Date(selectedWarranty.end_date).toLocaleDateString()}</p>
                </div>

                <div className="bg-slate-50 p-4 rounded-lg">
                  <div className="flex items-center gap-2 text-slate-600 mb-1">
                    <Shield className="w-4 h-4" />
                    <p className="text-sm font-medium">Coverage Type</p>
                  </div>
                  <p className="text-slate-800 font-semibold">{selectedWarranty.coverage_type}</p>
                </div>

                <div className="bg-slate-50 p-4 rounded-lg">
                  <div className="flex items-center gap-2 text-slate-600 mb-1">
                    <Clock className="w-4 h-4" />
                    <p className="text-sm font-medium">Duration</p>
                  </div>
                  <p className="text-slate-800 font-semibold">{selectedWarranty.duration_months} months</p>
                </div>
              </div>

              {selectedWarranty.coverage_details && (
                <div>
                  <h4 className="font-semibold text-slate-800 mb-2">Coverage Details</h4>
                  <div className="bg-slate-50 p-4 rounded-lg">
                    <p className="text-slate-600">{selectedWarranty.coverage_details}</p>
                  </div>
                </div>
              )}

              <div className="text-xs text-slate-500">
                <p>Registered on {new Date(selectedWarranty.registration_date).toLocaleDateString()}</p>
              </div>
            </div>

            <div className="p-6 border-t border-slate-200">
              <button
                onClick={() => setSelectedWarranty(null)}
                className="w-full px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-800 transition-colors"
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
