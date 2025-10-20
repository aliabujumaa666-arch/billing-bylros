import { useEffect, useState } from 'react';
import { useCustomerAuth } from '../../contexts/CustomerAuthContext';
import { supabase } from '../../lib/supabase';
import { FileText, Download, DollarSign, Calendar, CreditCard } from 'lucide-react';
import { exportInvoiceToPDF } from '../../utils/exportUtils';
import { PayPalButtons, PayPalScriptProvider } from '@paypal/react-paypal-js';
import { loadStripe, Stripe } from '@stripe/stripe-js';

export function CustomerInvoices() {
  const { customerData } = useCustomerAuth();
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [customer, setCustomer] = useState<any>(null);
  const [payingInvoiceId, setPayingInvoiceId] = useState<string | null>(null);
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [paypalClientId, setPaypalClientId] = useState<string | null>(null);
  const [stripePublishableKey, setStripePublishableKey] = useState<string | null>(null);
  const [stripeInstance, setStripeInstance] = useState<Stripe | null>(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'paypal' | 'stripe' | null>(null);

  useEffect(() => {
    if (customerData) {
      fetchInvoices();
      fetchCustomer();
      fetchPaymentGatewayConfig();
    }
  }, [customerData]);

  const fetchPaymentGatewayConfig = async () => {
    const { data: paypalData } = await supabase
      .from('paypal_settings')
      .select('client_id, is_active')
      .maybeSingle();

    if (paypalData && paypalData.is_active && paypalData.client_id) {
      setPaypalClientId(paypalData.client_id);
    }

    const { data: stripeData } = await supabase
      .from('stripe_settings')
      .select('publishable_key, is_active')
      .maybeSingle();

    if (stripeData && stripeData.is_active && stripeData.publishable_key) {
      setStripePublishableKey(stripeData.publishable_key);
      loadStripe(stripeData.publishable_key).then(stripe => setStripeInstance(stripe));
    }
  };

  const fetchCustomer = async () => {
    if (!customerData) return;

    const { data } = await supabase
      .from('customers')
      .select('*')
      .eq('id', customerData.customer_id)
      .single();

    if (data) setCustomer(data);
  };

  const fetchInvoices = async () => {
    if (!customerData) return;

    const { data, error } = await supabase
      .from('invoices')
      .select(`
        *,
        order:orders(order_number),
        payments(*)
      `)
      .eq('customer_id', customerData.customer_id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching invoices:', error);
      return;
    }

    setInvoices(data || []);
    setLoading(false);
  };

  const handleDownloadPDF = async (invoice: any) => {
    if (!customer) return;

    const { data: payments } = await supabase
      .from('payments')
      .select('*')
      .eq('invoice_id', invoice.id)
      .order('payment_date', { ascending: true });

    const invoiceWithPayments = {
      ...invoice,
      payments: payments || []
    };

    exportInvoiceToPDF(invoiceWithPayments, customer, payments || []);
  };

  const handlePayPalApprove = async (data: any, invoice: any) => {
    setPaymentProcessing(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/paypal-capture-payment`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({
            order_id: data.orderID,
            invoice_id: invoice.id,
          }),
        }
      );

      const result = await response.json();

      if (result.success) {
        alert('Payment successful! Your invoice has been updated.');
        setPayingInvoiceId(null);
        setSelectedPaymentMethod(null);
        await fetchInvoices();
      } else {
        throw new Error(result.error || 'Payment failed');
      }
    } catch (error) {
      console.error('Payment error:', error);
      alert('Payment processing failed. Please try again or contact support.');
    } finally {
      setPaymentProcessing(false);
    }
  };

  const createPayPalOrder = async (invoice: any) => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/paypal-create-order`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({
            invoice_id: invoice.id,
            amount: invoice.balance,
            currency: 'AED',
          }),
        }
      );

      const result = await response.json();

      if (result.error) {
        throw new Error(result.error);
      }

      return result.order_id;
    } catch (error) {
      console.error('Error creating PayPal order:', error);
      throw error;
    }
  };

  const handleStripePayment = async (invoice: any) => {
    if (!stripeInstance) {
      alert('Stripe is not configured. Please contact support.');
      return;
    }

    setPaymentProcessing(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/stripe-create-payment-intent`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({
            invoice_id: invoice.id,
            amount: invoice.balance,
            currency: 'AED',
          }),
        }
      );

      const result = await response.json();

      if (result.error) {
        throw new Error(result.error);
      }

      const { error } = await stripeInstance.confirmCardPayment(result.client_secret, {
        payment_method: {
          card: {
            token: 'tok_visa',
          },
        },
      });

      if (error) {
        throw new Error(error.message);
      }

      alert('Payment successful! Your invoice has been updated.');
      setPayingInvoiceId(null);
      setSelectedPaymentMethod(null);
      await fetchInvoices();
    } catch (error: any) {
      console.error('Stripe payment error:', error);
      alert('Payment processing failed: ' + error.message);
    } finally {
      setPaymentProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#bb2738]"></div>
      </div>
    );
  }

  if (invoices.length === 0) {
    return (
      <div className="bg-white rounded-xl p-12 text-center border border-slate-200">
        <FileText className="w-16 h-16 text-slate-300 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-slate-800 mb-2">No Invoices Yet</h3>
        <p className="text-slate-600">You don't have any invoices yet.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-800 mb-2">My Invoices</h2>
        <p className="text-slate-600">View your invoices and payment history</p>
      </div>

      <div className="space-y-4">
        {invoices.map((invoice) => {
          const totalPaid = Number(invoice.deposit_paid) + Number(invoice.payment_before_delivery);
          const balance = Number(invoice.total_amount) - totalPaid;
          const paymentPercentage = (totalPaid / Number(invoice.total_amount)) * 100;

          return (
            <div key={invoice.id} className="bg-white rounded-xl p-6 border border-slate-200 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center">
                    <FileText className="w-6 h-6 text-amber-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-slate-800 mb-1">
                      Invoice #{invoice.invoice_number}
                    </h3>
                    {invoice.order && (
                      <p className="text-sm text-slate-600">
                        Order #{invoice.order.order_number}
                      </p>
                    )}
                    <div className="flex items-center gap-2 text-sm text-slate-600 mt-1">
                      <Calendar className="w-4 h-4" />
                      {new Date(invoice.created_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-slate-800 mb-1">
                    AED {Number(invoice.total_amount).toLocaleString()}
                  </div>
                  <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                    invoice.status === 'Paid' ? 'bg-green-100 text-green-700' :
                    invoice.status === 'Partial' ? 'bg-amber-100 text-amber-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    {invoice.status}
                  </span>
                </div>
              </div>

              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-slate-700">Payment Progress</span>
                  <span className="text-sm font-medium text-slate-700">{paymentPercentage.toFixed(0)}%</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 ${
                      invoice.status === 'Paid' ? 'bg-green-500' :
                      invoice.status === 'Partial' ? 'bg-amber-500' :
                      'bg-red-500'
                    }`}
                    style={{ width: `${paymentPercentage}%` }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div className="p-3 bg-slate-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <DollarSign className="w-4 h-4 text-slate-600" />
                    <p className="text-xs text-slate-600">Total</p>
                  </div>
                  <p className="font-semibold text-slate-800">AED {Number(invoice.total_amount).toLocaleString()}</p>
                </div>

                <div className="p-3 bg-green-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <DollarSign className="w-4 h-4 text-green-600" />
                    <p className="text-xs text-green-700">Deposit</p>
                  </div>
                  <p className="font-semibold text-green-800">AED {Number(invoice.deposit_paid).toLocaleString()}</p>
                </div>

                <div className="p-3 bg-blue-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <DollarSign className="w-4 h-4 text-blue-600" />
                    <p className="text-xs text-blue-700">Before Delivery</p>
                  </div>
                  <p className="font-semibold text-blue-800">AED {Number(invoice.payment_before_delivery).toLocaleString()}</p>
                </div>

                <div className="p-3 bg-amber-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <DollarSign className="w-4 h-4 text-amber-600" />
                    <p className="text-xs text-amber-700">Balance</p>
                  </div>
                  <p className="font-semibold text-amber-800">AED {balance.toLocaleString()}</p>
                </div>
              </div>

              {invoice.due_date && (
                <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <span className="font-medium">Due Date:</span> {new Date(invoice.due_date).toLocaleDateString()}
                  </p>
                </div>
              )}

              {invoice.payments && invoice.payments.length > 0 && (
                <div className="mb-4">
                  <p className="text-sm font-medium text-slate-700 mb-2">Payment History:</p>
                  <div className="space-y-2">
                    {invoice.payments.map((payment: any) => (
                      <div key={payment.id} className="flex items-center justify-between p-2 bg-slate-50 rounded">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full" />
                          <span className="text-sm text-slate-700">
                            {new Date(payment.payment_date).toLocaleDateString()} - {payment.payment_method}
                          </span>
                        </div>
                        <span className="text-sm font-semibold text-slate-800">
                          AED {Number(payment.amount).toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex flex-wrap gap-3">
                {invoice.status !== 'Paid' && invoice.balance > 0 && (
                  <div className="w-full">
                    {payingInvoiceId === invoice.id ? (
                      <div className="border border-slate-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <p className="text-sm font-medium text-slate-700">Select Payment Method</p>
                          <button
                            onClick={() => {
                              setPayingInvoiceId(null);
                              setSelectedPaymentMethod(null);
                            }}
                            className="text-sm text-slate-600 hover:text-slate-800"
                            disabled={paymentProcessing}
                          >
                            Cancel
                          </button>
                        </div>

                        {paymentProcessing ? (
                          <div className="flex items-center justify-center py-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#bb2738]"></div>
                          </div>
                        ) : !selectedPaymentMethod ? (
                          <div className="space-y-3">
                            {paypalClientId && (
                              <button
                                onClick={() => setSelectedPaymentMethod('paypal')}
                                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-[#0070ba] text-white rounded-lg hover:bg-[#005fa3] transition-colors"
                              >
                                <CreditCard className="w-5 h-5" />
                                Pay with PayPal
                              </button>
                            )}
                            {stripePublishableKey && (
                              <button
                                onClick={() => setSelectedPaymentMethod('stripe')}
                                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-[#635bff] text-white rounded-lg hover:bg-[#5449d4] transition-colors"
                              >
                                <CreditCard className="w-5 h-5" />
                                Pay with Stripe
                              </button>
                            )}
                            {!paypalClientId && !stripePublishableKey && (
                              <div className="text-center py-4 text-slate-600">
                                <p>Payment system is not configured. Please contact support.</p>
                              </div>
                            )}
                          </div>
                        ) : selectedPaymentMethod === 'paypal' && paypalClientId ? (
                          <div>
                            <button
                              onClick={() => setSelectedPaymentMethod(null)}
                              className="mb-3 text-sm text-slate-600 hover:text-slate-800"
                            >
                              ← Back to payment methods
                            </button>
                            <PayPalScriptProvider options={{ clientId: paypalClientId, currency: 'USD' }}>
                              <PayPalButtons
                                style={{ layout: 'vertical' }}
                                createOrder={() => createPayPalOrder(invoice)}
                                onApprove={(data) => handlePayPalApprove(data, invoice)}
                                onError={(err) => {
                                  console.error('PayPal error:', err);
                                  alert('PayPal error. Please try again.');
                                  setSelectedPaymentMethod(null);
                                }}
                              />
                            </PayPalScriptProvider>
                          </div>
                        ) : selectedPaymentMethod === 'stripe' ? (
                          <div>
                            <button
                              onClick={() => setSelectedPaymentMethod(null)}
                              className="mb-3 text-sm text-slate-600 hover:text-slate-800"
                            >
                              ← Back to payment methods
                            </button>
                            <button
                              onClick={() => handleStripePayment(invoice)}
                              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-[#635bff] text-white rounded-lg hover:bg-[#5449d4] transition-colors"
                            >
                              <CreditCard className="w-5 h-5" />
                              Complete Stripe Payment
                            </button>
                            <p className="text-xs text-slate-500 mt-2 text-center">
                              You will be redirected to complete your payment securely
                            </p>
                          </div>
                        ) : null}
                      </div>
                    ) : (
                      <button
                        onClick={() => setPayingInvoiceId(invoice.id)}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors w-full justify-center"
                      >
                        <CreditCard className="w-4 h-4" />
                        Pay AED {invoice.balance.toLocaleString()}
                      </button>
                    )}
                  </div>
                )}
                <button
                  onClick={() => handleDownloadPDF(invoice)}
                  className="flex items-center gap-2 px-4 py-2 bg-[#bb2738] text-white rounded-lg hover:bg-[#a01f2f] transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Download Invoice PDF
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
