import { useState, useEffect } from 'react';
import { Building2, Calendar, MapPin, CreditCard, ArrowLeft, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { PayPalScriptProvider, PayPalButtons } from '@paypal/react-paypal-js';
import { loadStripe } from '@stripe/stripe-js';

interface SiteVisitPaymentProps {
  onBack?: () => void;
}

export function SiteVisitPayment({ onBack }: SiteVisitPaymentProps) {
  const [step, setStep] = useState<'loading' | 'payment' | 'success' | 'error'>('loading');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [siteVisit, setSiteVisit] = useState<any>(null);
  const [paymentMethod, setPaymentMethod] = useState<'paypal' | 'stripe'>('paypal');
  const [paypalConfig, setPaypalConfig] = useState<any>(null);
  const [stripeConfig, setStripeConfig] = useState<any>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');

    if (token) {
      fetchSiteVisit(token);
    } else {
      setError('Invalid payment link');
      setStep('error');
    }
  }, []);

  const fetchSiteVisit = async (token: string) => {
    try {
      const { data, error } = await supabase
        .from('site_visits')
        .select('*, customers(*)')
        .eq('payment_link_token', token)
        .maybeSingle();

      if (error || !data) {
        setError('Payment link not found or has expired');
        setStep('error');
        return;
      }

      if (data.payment_status === 'Paid') {
        setError('This site visit has already been paid');
        setStep('error');
        return;
      }

      if (new Date(data.payment_link_expires_at) < new Date()) {
        setError('This payment link has expired');
        setStep('error');
        return;
      }

      setSiteVisit(data);
      await fetchPaymentConfigs();
      setStep('payment');
    } catch (err) {
      console.error('Error fetching site visit:', err);
      setError('Failed to load payment information');
      setStep('error');
    }
  };

  const fetchPaymentConfigs = async () => {
    try {
      const [paypalData, stripeData] = await Promise.all([
        supabase.from('paypal_settings').select('*').maybeSingle(),
        supabase.from('stripe_settings').select('*').maybeSingle(),
      ]);

      if (paypalData.data && paypalData.data.is_active) {
        setPaypalConfig({
          clientId: paypalData.data.client_id,
          currency: 'USD',
          intent: 'capture',
        });
      }

      if (stripeData.data && stripeData.data.is_active) {
        setStripeConfig({
          publishableKey: stripeData.data.publishable_key,
        });
      }
    } catch (err) {
      console.error('Error fetching payment configs:', err);
    }
  };

  const createPayPalOrder = async () => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/paypal-create-site-visit-payment`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            site_visit_id: siteVisit.id,
            amount: siteVisit.payment_amount,
          }),
        }
      );

      const data = await response.json();
      if (!response.ok) throw new Error(data.error);

      return data.order_id;
    } catch (err: any) {
      console.error('Error creating order:', err);
      setError('Failed to create payment order');
      throw err;
    }
  };

  const onPayPalApprove = async (data: any) => {
    try {
      setLoading(true);
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/paypal-capture-site-visit-payment`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            order_id: data.orderID,
            site_visit_id: siteVisit.id,
          }),
        }
      );

      const result = await response.json();
      if (!response.ok) throw new Error(result.error);

      setStep('success');
    } catch (err: any) {
      console.error('Error capturing payment:', err);
      setError('Payment failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleStripePayment = async () => {
    try {
      setLoading(true);
      setError('');

      const stripe = await loadStripe(stripeConfig.publishableKey);
      if (!stripe) {
        throw new Error('Failed to load Stripe');
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/stripe-create-site-visit-payment`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            site_visit_id: siteVisit.id,
            amount: siteVisit.payment_amount,
          }),
        }
      );

      const data = await response.json();
      if (!response.ok) throw new Error(data.error);

      const result = await stripe.confirmCardPayment(data.client_secret);

      if (result.error) {
        throw new Error(result.error.message);
      }

      await supabase
        .from('site_visits')
        .update({
          payment_status: 'Paid',
          payment_method: 'Stripe',
          payment_date: new Date().toISOString(),
        })
        .eq('id', siteVisit.id);

      setStep('success');
    } catch (err: any) {
      console.error('Error processing Stripe payment:', err);
      setError(err.message || 'Payment failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (step === 'loading') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-[#bb2738] animate-spin mx-auto mb-4" />
          <p className="text-slate-600">Loading payment information...</p>
        </div>
      </div>
    );
  }

  if (step === 'error') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
          <AlertCircle className="w-16 h-16 text-red-600 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-slate-900 mb-4">Payment Unavailable</h2>
          <p className="text-slate-600 mb-6">{error}</p>
          {onBack && (
            <button
              onClick={onBack}
              className="w-full px-6 py-3 bg-slate-600 hover:bg-slate-700 text-white rounded-lg transition-colors font-medium"
            >
              Back to Home
            </button>
          )}
        </div>
      </div>
    );
  }

  if (step === 'success') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-4">Payment Successful!</h2>
          <p className="text-slate-600 mb-6">
            Your site visit payment has been processed successfully. We'll contact you shortly to confirm the appointment details.
          </p>
          <div className="bg-slate-50 rounded-lg p-4 mb-6">
            <p className="text-sm text-slate-600 mb-2">Site Visit Details</p>
            <p className="text-lg font-semibold text-slate-900">{siteVisit?.location}</p>
            <p className="text-sm text-slate-600 mt-1">
              {new Date(siteVisit?.visit_date).toLocaleString()}
            </p>
          </div>
          {onBack && (
            <button
              onClick={onBack}
              className="w-full px-6 py-3 bg-[#bb2738] hover:bg-[#a01f2f] text-white rounded-lg transition-colors font-medium"
            >
              Back to Home
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#bb2738] rounded-lg flex items-center justify-center">
                <Building2 className="w-6 h-6 text-white" />
              </div>
              <span className="font-bold text-xl text-slate-800">BYLROS</span>
            </div>
            {onBack && (
              <button
                onClick={onBack}
                className="flex items-center gap-2 text-slate-600 hover:text-slate-900"
              >
                <ArrowLeft className="w-5 h-5" />
                <span className="hidden sm:inline">Back</span>
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="py-12 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-4">
              Complete Site Visit Payment
            </h1>
            <p className="text-lg text-slate-600">
              Secure payment for your scheduled site visit
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-8 mb-6">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">Visit Details</h3>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-slate-400 mt-0.5" />
                <div>
                  <p className="text-sm text-slate-600">Location</p>
                  <p className="text-slate-900 font-medium">{siteVisit?.location}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Calendar className="w-5 h-5 text-slate-400 mt-0.5" />
                <div>
                  <p className="text-sm text-slate-600">Scheduled Date</p>
                  <p className="text-slate-900 font-medium">
                    {new Date(siteVisit?.visit_date).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-slate-800">Payment Amount</h3>
              <span className="text-3xl font-bold text-[#bb2738]">
                AED {siteVisit?.payment_amount?.toFixed(2)}
              </span>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            )}

            <div className="mb-6">
              <label className="block text-sm font-medium text-slate-700 mb-3">
                Select Payment Method
              </label>
              <div className="grid grid-cols-2 gap-4">
                {paypalConfig && (
                  <button
                    onClick={() => setPaymentMethod('paypal')}
                    className={`p-4 border-2 rounded-lg transition-all ${
                      paymentMethod === 'paypal'
                        ? 'border-[#bb2738] bg-red-50'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <CreditCard className="w-6 h-6 mx-auto mb-2 text-slate-700" />
                    <span className="text-sm font-medium text-slate-900">PayPal</span>
                  </button>
                )}
                {stripeConfig && (
                  <button
                    onClick={() => setPaymentMethod('stripe')}
                    className={`p-4 border-2 rounded-lg transition-all ${
                      paymentMethod === 'stripe'
                        ? 'border-[#bb2738] bg-red-50'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <CreditCard className="w-6 h-6 mx-auto mb-2 text-slate-700" />
                    <span className="text-sm font-medium text-slate-900">Card (Stripe)</span>
                  </button>
                )}
              </div>
            </div>

            {paymentMethod === 'paypal' && paypalConfig && (
              <PayPalScriptProvider options={paypalConfig}>
                <PayPalButtons
                  createOrder={createPayPalOrder}
                  onApprove={onPayPalApprove}
                  onError={(err) => {
                    console.error('PayPal error:', err);
                    setError('Payment error occurred. Please try again.');
                  }}
                  disabled={loading}
                  style={{ layout: 'vertical' }}
                />
              </PayPalScriptProvider>
            )}

            {paymentMethod === 'stripe' && stripeConfig && (
              <button
                onClick={handleStripePayment}
                disabled={loading}
                className="w-full py-4 bg-[#bb2738] hover:bg-[#a01f2f] text-white rounded-lg transition-colors font-semibold text-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <CreditCard className="w-5 h-5" />
                    Pay with Card
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
