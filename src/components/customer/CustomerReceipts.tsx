import { useEffect, useState } from 'react';
import { useCustomerAuth } from '../../contexts/CustomerAuthContext';
import { useBrand } from '../../contexts/BrandContext';
import { supabase } from '../../lib/supabase';
import { Receipt, Download, Calendar, CreditCard, FileText, DollarSign } from 'lucide-react';
import { exportReceiptToPDF } from '../../utils/exportUtils';

export function CustomerReceipts() {
  const { customerData } = useCustomerAuth();
  const { brand } = useBrand();
  const [receipts, setReceipts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [customer, setCustomer] = useState<any>(null);

  useEffect(() => {
    if (customerData) {
      fetchReceipts();
      fetchCustomer();
    }
  }, [customerData]);

  const fetchCustomer = async () => {
    if (!customerData) return;

    const { data } = await supabase
      .from('customers')
      .select('*')
      .eq('id', customerData.customer_id)
      .single();

    if (data) setCustomer(data);
  };

  const fetchReceipts = async () => {
    if (!customerData) return;

    const { data, error } = await supabase
      .from('receipts')
      .select(`
        *,
        invoice:invoices(invoice_number),
        order:orders(order_number)
      `)
      .eq('customer_id', customerData.customer_id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching receipts:', error);
      return;
    }

    setReceipts(data || []);
    setLoading(false);
  };

  const handleDownloadPDF = async (receipt: any) => {
    if (!customer) return;

    try {
      const { data: invoice } = await supabase
        .from('invoices')
        .select('*')
        .eq('id', receipt.invoice_id)
        .single();

      if (invoice) {
        exportReceiptToPDF(receipt, customer, invoice, brand);
      }
    } catch (error) {
      console.error('Error downloading receipt:', error);
      alert('Failed to download receipt PDF');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#bb2738]"></div>
      </div>
    );
  }

  if (receipts.length === 0) {
    return (
      <div className="bg-white rounded-xl p-12 text-center border border-slate-200">
        <Receipt className="w-16 h-16 text-slate-300 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-slate-800 mb-2">No Receipts Yet</h3>
        <p className="text-slate-600">Payment receipts will appear here when you make payments.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-800 mb-2">Payment Receipts</h2>
        <p className="text-slate-600">View and download your payment receipts</p>
      </div>

      <div className="space-y-4">
        {receipts.map((receipt) => (
          <div key={receipt.id} className="bg-white rounded-xl p-6 border border-slate-200 hover:shadow-lg transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <Receipt className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-800 mb-1">
                    Receipt #{receipt.receipt_number}
                  </h3>
                  {receipt.invoice && (
                    <p className="text-sm text-slate-600 flex items-center gap-1">
                      <FileText className="w-4 h-4" />
                      Invoice #{receipt.invoice.invoice_number}
                    </p>
                  )}
                  <div className="flex items-center gap-2 text-sm text-slate-600 mt-1">
                    <Calendar className="w-4 h-4" />
                    {new Date(receipt.payment_date).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-green-600 mb-1">
                  AED {Number(receipt.amount_paid).toLocaleString()}
                </div>
                <span className="inline-block px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                  Payment Received
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div className="p-3 bg-slate-50 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <DollarSign className="w-4 h-4 text-slate-600" />
                  <p className="text-xs text-slate-600">Invoice Total</p>
                </div>
                <p className="font-semibold text-slate-800">AED {Number(receipt.invoice_total).toLocaleString()}</p>
              </div>

              <div className="p-3 bg-slate-50 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <DollarSign className="w-4 h-4 text-slate-600" />
                  <p className="text-xs text-slate-600">Previous Balance</p>
                </div>
                <p className="font-semibold text-slate-800">AED {Number(receipt.previous_balance).toLocaleString()}</p>
              </div>

              <div className="p-3 bg-green-50 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <DollarSign className="w-4 h-4 text-green-600" />
                  <p className="text-xs text-green-700">Amount Paid</p>
                </div>
                <p className="font-semibold text-green-800">AED {Number(receipt.amount_paid).toLocaleString()}</p>
              </div>

              <div className={`p-3 rounded-lg ${receipt.remaining_balance > 0 ? 'bg-amber-50' : 'bg-green-50'}`}>
                <div className="flex items-center gap-2 mb-1">
                  <DollarSign className={`w-4 h-4 ${receipt.remaining_balance > 0 ? 'text-amber-600' : 'text-green-600'}`} />
                  <p className={`text-xs ${receipt.remaining_balance > 0 ? 'text-amber-700' : 'text-green-700'}`}>
                    Remaining Balance
                  </p>
                </div>
                <p className={`font-semibold ${receipt.remaining_balance > 0 ? 'text-amber-800' : 'text-green-800'}`}>
                  AED {Number(receipt.remaining_balance).toLocaleString()}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between py-3 border-t border-slate-200">
              <div className="flex items-center gap-4 text-sm text-slate-600">
                <div className="flex items-center gap-2">
                  <CreditCard className="w-4 h-4" />
                  <span>{receipt.payment_method}</span>
                </div>
                {receipt.payment_reference && (
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400">|</span>
                    <span>Ref: {receipt.payment_reference}</span>
                  </div>
                )}
                {receipt.order && (
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400">|</span>
                    <span>Order #{receipt.order.order_number}</span>
                  </div>
                )}
              </div>
              <button
                onClick={() => handleDownloadPDF(receipt)}
                className="flex items-center gap-2 px-4 py-2 bg-[#bb2738] text-white rounded-lg hover:bg-[#a01f2f] transition-colors"
              >
                <Download className="w-4 h-4" />
                Download Receipt
              </button>
            </div>

            {receipt.notes && (
              <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-slate-700">
                  <span className="font-medium">Note:</span> {receipt.notes}
                </p>
              </div>
            )}

            {receipt.remaining_balance <= 0 && (
              <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-800 font-medium text-center">
                  Invoice Paid in Full
                </p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
