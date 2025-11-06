import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { exportReceiptToPDF } from '../utils/exportUtils';
import { useBrand } from '../contexts/BrandContext';
import { Download, Receipt, Eye, X, Search, FileText } from 'lucide-react';

export function Receipts() {
  const { brand } = useBrand();
  const [receipts, setReceipts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedReceipt, setSelectedReceipt] = useState<any>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  useEffect(() => {
    fetchReceipts();
  }, []);

  const fetchReceipts = async () => {
    try {
      const { data, error } = await supabase
        .from('receipts')
        .select(`
          *,
          customer:customers(*),
          invoice:invoices(*),
          payment:payments(*),
          order:orders(order_number)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setReceipts(data || []);
    } catch (error) {
      console.error('Error fetching receipts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = async (receipt: any) => {
    try {
      const { data: customer } = await supabase
        .from('customers')
        .select('*')
        .eq('id', receipt.customer_id)
        .single();

      const { data: invoice } = await supabase
        .from('invoices')
        .select('*')
        .eq('id', receipt.invoice_id)
        .single();

      if (customer && invoice) {
        exportReceiptToPDF(receipt, customer, invoice, brand);
      }
    } catch (error) {
      console.error('Error downloading receipt:', error);
      alert('Failed to download receipt PDF');
    }
  };

  const openDetailModal = (receipt: any) => {
    setSelectedReceipt(receipt);
    setShowDetailModal(true);
  };

  const getStatusColor = (status: string) => {
    const colors = {
      generated: 'bg-blue-100 text-blue-800',
      sent: 'bg-green-100 text-green-800',
      void: 'bg-red-100 text-red-800',
    };
    return colors[status as keyof typeof colors] || 'bg-slate-100 text-slate-800';
  };

  const filteredReceipts = receipts.filter(receipt =>
    receipt.receipt_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    receipt.customer?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    receipt.invoice?.invoice_number.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-slate-800">Payment Receipts</h1>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-200">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search by receipt number, customer, or invoice..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-[#bb2738]"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Receipt #</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Customer</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Invoice</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Amount Paid</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Payment Date</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Method</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Status</th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-slate-600 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {loading ? (
                <tr><td colSpan={8} className="px-6 py-8 text-center text-slate-500">Loading...</td></tr>
              ) : filteredReceipts.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center">
                    <Receipt className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                    <p className="text-slate-500">No receipts found</p>
                  </td>
                </tr>
              ) : (
                filteredReceipts.map((receipt) => (
                  <tr key={receipt.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-slate-800">{receipt.receipt_number}</td>
                    <td className="px-6 py-4 text-slate-600">{receipt.customer?.name}</td>
                    <td className="px-6 py-4 text-slate-600">{receipt.invoice?.invoice_number}</td>
                    <td className="px-6 py-4 text-slate-600">
                      <span className="font-semibold text-green-700">AED {receipt.amount_paid.toFixed(2)}</span>
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      {new Date(receipt.payment_date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-slate-600">{receipt.payment_method}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(receipt.status)}`}>
                        {receipt.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <button
                        onClick={() => openDetailModal(receipt)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-sm text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                        View
                      </button>
                      <button
                        onClick={() => handleDownloadPDF(receipt)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-sm text-green-700 hover:bg-green-50 rounded-lg transition-colors"
                      >
                        <Download className="w-4 h-4" />
                        PDF
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showDetailModal && selectedReceipt && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b border-slate-200">
              <h2 className="text-xl font-bold text-slate-800">Receipt Details</h2>
              <button onClick={() => setShowDetailModal(false)} className="p-2 hover:bg-slate-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center gap-3 mb-3">
                  <Receipt className="w-8 h-8 text-green-600" />
                  <div>
                    <h3 className="text-lg font-bold text-slate-800">{selectedReceipt.receipt_number}</h3>
                    <p className="text-sm text-slate-600">
                      Generated on {new Date(selectedReceipt.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <h4 className="font-semibold text-slate-800 text-sm uppercase tracking-wide">Customer Information</h4>
                  <div className="space-y-2">
                    <div>
                      <p className="text-xs text-slate-500">Name</p>
                      <p className="font-medium text-slate-800">{selectedReceipt.customer?.name}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Phone</p>
                      <p className="font-medium text-slate-800">{selectedReceipt.customer?.phone}</p>
                    </div>
                    {selectedReceipt.customer?.email && (
                      <div>
                        <p className="text-xs text-slate-500">Email</p>
                        <p className="font-medium text-slate-800">{selectedReceipt.customer?.email}</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="font-semibold text-slate-800 text-sm uppercase tracking-wide">Payment Information</h4>
                  <div className="space-y-2">
                    <div>
                      <p className="text-xs text-slate-500">Payment Date</p>
                      <p className="font-medium text-slate-800">
                        {new Date(selectedReceipt.payment_date).toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Payment Method</p>
                      <p className="font-medium text-slate-800">{selectedReceipt.payment_method}</p>
                    </div>
                    {selectedReceipt.payment_reference && (
                      <div>
                        <p className="text-xs text-slate-500">Reference Number</p>
                        <p className="font-medium text-slate-800">{selectedReceipt.payment_reference}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="border-t border-slate-200 pt-4">
                <h4 className="font-semibold text-slate-800 text-sm uppercase tracking-wide mb-3">Payment Summary</h4>
                <div className="bg-slate-50 rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-slate-500">Invoice Number</p>
                      <p className="font-medium text-slate-800">{selectedReceipt.invoice?.invoice_number}</p>
                    </div>
                    <button
                      onClick={() => handleDownloadPDF(selectedReceipt)}
                      className="inline-flex items-center gap-2 px-3 py-1.5 text-sm bg-[#bb2738] text-white rounded-lg hover:bg-[#a01f2f] transition-colors"
                    >
                      <Download className="w-4 h-4" />
                      Download PDF
                    </button>
                  </div>

                  <div className="border-t border-slate-200 pt-3 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-slate-600">Invoice Total:</span>
                      <span className="font-semibold text-slate-800">AED {selectedReceipt.invoice_total.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Previous Balance:</span>
                      <span className="font-semibold text-slate-800">AED {selectedReceipt.previous_balance.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between border-t border-slate-300 pt-2">
                      <span className="text-slate-600 font-medium">Amount Paid:</span>
                      <span className="font-bold text-green-700 text-lg">AED {selectedReceipt.amount_paid.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between border-t border-slate-300 pt-2">
                      <span className="text-slate-600 font-medium">Remaining Balance:</span>
                      <span className={`font-bold text-lg ${selectedReceipt.remaining_balance > 0 ? 'text-red-700' : 'text-green-700'}`}>
                        AED {selectedReceipt.remaining_balance.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {selectedReceipt.notes && (
                <div className="border-t border-slate-200 pt-4">
                  <h4 className="font-semibold text-slate-800 text-sm uppercase tracking-wide mb-2">Notes</h4>
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                    <p className="text-sm text-slate-700">{selectedReceipt.notes}</p>
                  </div>
                </div>
              )}

              {selectedReceipt.order && (
                <div className="border-t border-slate-200 pt-4">
                  <h4 className="font-semibold text-slate-800 text-sm uppercase tracking-wide mb-2">Related Order</h4>
                  <div className="flex items-center gap-2 text-sm">
                    <FileText className="w-4 h-4 text-slate-500" />
                    <span className="text-slate-600">Order #{selectedReceipt.order.order_number}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
