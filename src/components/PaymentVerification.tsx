import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { CheckCircle, XCircle, ExternalLink, FileText, Calendar, User, DollarSign, Eye } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface PendingPayment {
  id: string;
  invoice_id: string;
  amount: number;
  payment_date: string;
  payment_method: string;
  payment_proof_url: string | null;
  reference: string;
  notes: string;
  created_at: string;
  invoice: {
    invoice_number: string;
    total_amount: number;
    customer: {
      name: string;
      email: string;
      phone: string;
    };
  };
}

export function PaymentVerification() {
  const { user } = useAuth();
  const [pendingPayments, setPendingPayments] = useState<PendingPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [selectedProof, setSelectedProof] = useState<string | null>(null);
  const [verificationNotes, setVerificationNotes] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    fetchPendingPayments();
  }, []);

  const fetchPendingPayments = async () => {
    try {
      const { data, error } = await supabase
        .from('payments')
        .select(`
          *,
          invoice:invoices(
            invoice_number,
            total_amount,
            customer:customers(
              name,
              email,
              phone
            )
          )
        `)
        .eq('payment_status', 'pending')
        .eq('payment_method', 'Bank Transfer')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setPendingPayments(data || []);
    } catch (error) {
      console.error('Error fetching pending payments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (paymentId: string, status: 'verified' | 'rejected') => {
    if (!user) return;

    setProcessing(paymentId);
    try {
      const { error } = await supabase
        .from('payments')
        .update({
          payment_status: status,
          verified_by: user.id,
          verified_at: new Date().toISOString(),
          verification_notes: verificationNotes[paymentId] || ''
        })
        .eq('id', paymentId);

      if (error) throw error;

      if (status === 'verified') {
        const payment = pendingPayments.find(p => p.id === paymentId);
        if (payment) {
          const { data: invoice } = await supabase
            .from('invoices')
            .select('deposit_paid, payment_before_delivery, total_amount')
            .eq('id', payment.invoice_id)
            .single();

          if (invoice) {
            const totalPaid = Number(invoice.deposit_paid) + Number(invoice.payment_before_delivery) + Number(payment.amount);
            const newStatus = totalPaid >= Number(invoice.total_amount) ? 'Paid' : 'Partial';

            await supabase
              .from('invoices')
              .update({
                payment_before_delivery: Number(invoice.payment_before_delivery) + Number(payment.amount),
                status: newStatus
              })
              .eq('id', payment.invoice_id);
          }
        }
      }

      alert(`Payment ${status === 'verified' ? 'approved' : 'rejected'} successfully!`);
      await fetchPendingPayments();
      setVerificationNotes(prev => {
        const newNotes = { ...prev };
        delete newNotes[paymentId];
        return newNotes;
      });
    } catch (error: any) {
      console.error('Error verifying payment:', error);
      alert('Failed to verify payment: ' + error.message);
    } finally {
      setProcessing(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#bb2738]"></div>
      </div>
    );
  }

  if (pendingPayments.length === 0) {
    return (
      <div className="bg-white rounded-xl p-12 text-center border border-slate-200">
        <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-slate-800 mb-2">All Caught Up!</h3>
        <p className="text-slate-600">There are no pending bank transfer payments to verify.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-800 mb-2">Payment Verification</h2>
        <p className="text-slate-600">Review and verify pending bank transfer payments</p>
        <div className="mt-3 inline-flex items-center gap-2 px-4 py-2 bg-amber-50 border border-amber-200 rounded-lg">
          <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
          <span className="text-sm font-medium text-amber-800">
            {pendingPayments.length} payment{pendingPayments.length !== 1 ? 's' : ''} pending verification
          </span>
        </div>
      </div>

      <div className="space-y-4">
        {pendingPayments.map((payment) => (
          <div key={payment.id} className="bg-white rounded-xl p-6 border border-slate-200 hover:shadow-lg transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center">
                  <FileText className="w-6 h-6 text-amber-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-800 mb-1">
                    Invoice #{payment.invoice.invoice_number}
                  </h3>
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <User className="w-4 h-4" />
                    {payment.invoice.customer.name}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-600 mt-1">
                    <Calendar className="w-4 h-4" />
                    Submitted: {new Date(payment.created_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-slate-800 mb-1">
                  AED {Number(payment.amount).toLocaleString()}
                </div>
                <span className="inline-block px-3 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
                  Pending Verification
                </span>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4 mb-4">
              <div className="p-4 bg-slate-50 rounded-lg">
                <h4 className="text-sm font-medium text-slate-700 mb-2">Customer Details</h4>
                <div className="space-y-1 text-sm">
                  <p className="text-slate-600">
                    <span className="font-medium">Name:</span> {payment.invoice.customer.name}
                  </p>
                  <p className="text-slate-600">
                    <span className="font-medium">Email:</span> {payment.invoice.customer.email}
                  </p>
                  <p className="text-slate-600">
                    <span className="font-medium">Phone:</span> {payment.invoice.customer.phone}
                  </p>
                </div>
              </div>

              <div className="p-4 bg-slate-50 rounded-lg">
                <h4 className="text-sm font-medium text-slate-700 mb-2">Payment Details</h4>
                <div className="space-y-1 text-sm">
                  <p className="text-slate-600">
                    <span className="font-medium">Payment Date:</span> {new Date(payment.payment_date).toLocaleDateString()}
                  </p>
                  <p className="text-slate-600">
                    <span className="font-medium">Reference:</span> {payment.reference}
                  </p>
                  <p className="text-slate-600">
                    <span className="font-medium">Method:</span> {payment.payment_method}
                  </p>
                </div>
              </div>
            </div>

            {payment.notes && (
              <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  <span className="font-medium">Customer Notes:</span> {payment.notes}
                </p>
              </div>
            )}

            {payment.payment_proof_url && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Proof of Payment
                </label>
                <div className="flex gap-3">
                  <button
                    onClick={() => setSelectedProof(payment.payment_proof_url)}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Eye className="w-4 h-4" />
                    View Proof
                  </button>
                  <a
                    href={payment.payment_proof_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Open in New Tab
                  </a>
                </div>
              </div>
            )}

            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Verification Notes (Optional)
              </label>
              <textarea
                value={verificationNotes[payment.id] || ''}
                onChange={(e) => setVerificationNotes({ ...verificationNotes, [payment.id]: e.target.value })}
                rows={2}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Add notes about this verification..."
              />
            </div>

            <div className="flex gap-3 pt-4 border-t border-slate-200">
              <button
                onClick={() => handleVerify(payment.id, 'verified')}
                disabled={processing === payment.id}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {processing === payment.id ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                ) : (
                  <>
                    <CheckCircle className="w-5 h-5" />
                    Approve Payment
                  </>
                )}
              </button>
              <button
                onClick={() => handleVerify(payment.id, 'rejected')}
                disabled={processing === payment.id}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <XCircle className="w-5 h-5" />
                Reject Payment
              </button>
            </div>
          </div>
        ))}
      </div>

      {selectedProof && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4" onClick={() => setSelectedProof(null)}>
          <div className="bg-white rounded-xl max-w-4xl max-h-[90vh] overflow-auto p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-800">Proof of Payment</h3>
              <button
                onClick={() => setSelectedProof(null)}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <XCircle className="w-6 h-6 text-slate-600" />
              </button>
            </div>
            <div className="flex items-center justify-center">
              {selectedProof.toLowerCase().endsWith('.pdf') ? (
                <iframe
                  src={selectedProof}
                  className="w-full h-[70vh] border border-slate-200 rounded-lg"
                  title="Payment Proof PDF"
                />
              ) : (
                <img
                  src={selectedProof}
                  alt="Payment Proof"
                  className="max-w-full max-h-[70vh] object-contain rounded-lg"
                />
              )}
            </div>
            <div className="mt-4 flex justify-end gap-3">
              <a
                href={selectedProof}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
                Open in New Tab
              </a>
              <button
                onClick={() => setSelectedProof(null)}
                className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition-colors"
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
