import { useEffect, useState } from 'react';
import { useCustomerAuth } from '../../contexts/CustomerAuthContext';
import { supabase } from '../../lib/supabase';
import { FileText, Download, Calendar } from 'lucide-react';
import { exportQuoteToPDF } from '../../utils/exportUtils';

export function CustomerQuotes() {
  const { customerData } = useCustomerAuth();
  const [quotes, setQuotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [customer, setCustomer] = useState<any>(null);

  useEffect(() => {
    if (customerData) {
      fetchQuotes();
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

  const fetchQuotes = async () => {
    if (!customerData) return;

    const { data, error } = await supabase
      .from('quotes')
      .select('*')
      .eq('customer_id', customerData.customer_id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching quotes:', error);
      return;
    }

    setQuotes(data || []);
    setLoading(false);
  };

  const handleDownloadPDF = (quote: any) => {
    if (customer) {
      exportQuoteToPDF(quote, customer);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#bb2738]"></div>
      </div>
    );
  }

  if (quotes.length === 0) {
    return (
      <div className="bg-white rounded-xl p-12 text-center border border-slate-200">
        <FileText className="w-16 h-16 text-slate-300 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-slate-800 mb-2">No Quotes Yet</h3>
        <p className="text-slate-600">You haven't received any quotes from BYLROS yet.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-800 mb-2">My Quotes</h2>
        <p className="text-slate-600">View and download all quotes you've received</p>
      </div>

      <div className="space-y-4">
        {quotes.map((quote) => (
          <div key={quote.id} className="bg-white rounded-xl p-6 border border-slate-200 hover:shadow-lg transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-[#bb2738]/10 rounded-lg flex items-center justify-center">
                  <FileText className="w-6 h-6 text-[#bb2738]" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-800 mb-1">
                    Quote #{quote.quote_number}
                  </h3>
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <Calendar className="w-4 h-4" />
                    {new Date(quote.created_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-slate-800 mb-1">
                  AED {Number(quote.total).toLocaleString()}
                </div>
                <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                  quote.status === 'Draft' ? 'bg-slate-100 text-slate-700' :
                  quote.status === 'Sent' ? 'bg-blue-100 text-blue-700' :
                  quote.status === 'Accepted' ? 'bg-green-100 text-green-700' :
                  'bg-red-100 text-red-700'
                }`}>
                  {quote.status}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 mb-4 p-4 bg-slate-50 rounded-lg">
              <div>
                <p className="text-xs text-slate-600 mb-1">Subtotal</p>
                <p className="font-semibold text-slate-800">AED {Number(quote.subtotal).toLocaleString()}</p>
              </div>
              <div>
                <p className="text-xs text-slate-600 mb-1">VAT (5%)</p>
                <p className="font-semibold text-slate-800">AED {Number(quote.vat_amount).toLocaleString()}</p>
              </div>
              <div>
                <p className="text-xs text-slate-600 mb-1">Items</p>
                <p className="font-semibold text-slate-800">{Array.isArray(quote.items) ? quote.items.length : 0}</p>
              </div>
            </div>

            {quote.remarks && (
              <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                <p className="text-sm font-medium text-blue-900 mb-1">Remarks:</p>
                <p className="text-sm text-blue-800">{quote.remarks}</p>
              </div>
            )}

            {quote.valid_until && (
              <div className="mb-4">
                <p className="text-sm text-slate-600">
                  Valid until: <span className="font-medium">{new Date(quote.valid_until).toLocaleDateString()}</span>
                </p>
              </div>
            )}

            <button
              onClick={() => handleDownloadPDF(quote)}
              className="flex items-center gap-2 px-4 py-2 bg-[#bb2738] text-white rounded-lg hover:bg-[#a01f2f] transition-colors"
            >
              <Download className="w-4 h-4" />
              Download PDF
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
