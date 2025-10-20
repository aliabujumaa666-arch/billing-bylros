import { useState, useEffect } from 'react';
import { Building2, Calendar, MapPin, User, Phone, Mail, CreditCard, ArrowLeft, CheckCircle, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { PayPalScriptProvider, PayPalButtons } from '@paypal/react-paypal-js';

interface PublicBookingProps {
  onBack: () => void;
}

export function PublicBooking({ onBack }: PublicBookingProps) {
  const [step, setStep] = useState<'form' | 'payment' | 'success'>('form');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [bookingId, setBookingId] = useState('');
  const [paypalConfig, setPaypalConfig] = useState<any>(null);

  const [formData, setFormData] = useState({
    customer_name: '',
    phone: '',
    email: '',
    location: '',
    preferred_date: '',
    preferred_time: '',
    notes: '',
  });

  const VISIT_COST = 300.00;

  useEffect(() => {
    fetchPayPalConfig();
  }, []);

  const fetchPayPalConfig = async () => {
    try {
      const { data, error } = await supabase
        .from('paypal_settings')
        .select('*')
        .maybeSingle();

      if (error || !data || !data.is_active) {
        setError('Payment system is currently unavailable. Please contact us directly.');
        return;
      }

      setPaypalConfig({
        clientId: data.client_id,
        currency: 'USD',
        intent: 'capture',
      });
    } catch (err) {
      console.error('Error fetching PayPal config:', err);
      setError('Failed to load payment system.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (!formData.customer_name || !formData.phone || !formData.location || !formData.preferred_date) {
        setError('Please fill in all required fields');
        setLoading(false);
        return;
      }

      const { data, error: insertError } = await supabase
        .from('public_site_visit_bookings')
        .insert([{
          customer_name: formData.customer_name,
          phone: formData.phone,
          email: formData.email,
          location: formData.location,
          preferred_date: formData.preferred_date,
          preferred_time: formData.preferred_time,
          notes: formData.notes,
          amount: VISIT_COST,
          status: 'pending_payment',
        }])
        .select()
        .single();

      if (insertError) throw insertError;

      setBookingId(data.id);
      setStep('payment');
    } catch (err: any) {
      setError('Failed to submit booking. Please try again.');
      console.error('Booking error:', err);
    } finally {
      setLoading(false);
    }
  };

  const createPayPalOrder = async () => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/paypal-create-booking-payment`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            booking_id: bookingId,
            amount: VISIT_COST,
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
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/paypal-capture-booking-payment`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            order_id: data.orderID,
            booking_id: bookingId,
          }),
        }
      );

      const result = await response.json();
      if (!response.ok) throw new Error(result.error);

      setStep('success');
    } catch (err: any) {
      console.error('Error capturing payment:', err);
      setError('Payment failed. Please try again.');
    }
  };

  if (step === 'success') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-4">Booking Confirmed!</h2>
          <p className="text-slate-600 mb-6">
            Your site visit has been booked successfully. We'll contact you shortly to confirm the appointment details.
          </p>
          <div className="bg-slate-50 rounded-lg p-4 mb-6">
            <p className="text-sm text-slate-600 mb-2">Booking Reference</p>
            <p className="text-lg font-mono font-semibold text-slate-900">{bookingId.slice(0, 8).toUpperCase()}</p>
          </div>
          <button
            onClick={onBack}
            className="w-full px-6 py-3 bg-[#bb2738] hover:bg-[#a01f2f] text-white rounded-lg transition-colors font-medium"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  if (step === 'payment') {
    if (!paypalConfig) {
      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
            <AlertCircle className="w-16 h-16 text-red-600 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-slate-900 mb-4">Payment Unavailable</h2>
            <p className="text-slate-600 mb-6">{error || 'Payment system is not configured.'}</p>
            <button
              onClick={onBack}
              className="w-full px-6 py-3 bg-slate-600 hover:bg-slate-700 text-white rounded-lg transition-colors font-medium"
            >
              Back to Home
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-slate-50 py-12 px-4">
        <div className="max-w-2xl mx-auto">
          <button
            onClick={() => setStep('form')}
            className="flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-6"
          >
            <ArrowLeft className="w-5 h-5" />
            Back
          </button>

          <div className="bg-white rounded-xl shadow-lg p-8">
            <div className="flex items-center justify-center mb-6">
              <div className="w-16 h-16 bg-[#bb2738] rounded-full flex items-center justify-center">
                <CreditCard className="w-8 h-8 text-white" />
              </div>
            </div>

            <h2 className="text-2xl font-bold text-slate-900 text-center mb-2">Complete Payment</h2>
            <p className="text-slate-600 text-center mb-8">Site Visit Fee: AED {VISIT_COST.toFixed(2)}</p>

            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            )}

            <PayPalScriptProvider options={paypalConfig}>
              <PayPalButtons
                createOrder={createPayPalOrder}
                onApprove={onPayPalApprove}
                onError={(err) => {
                  console.error('PayPal error:', err);
                  setError('Payment error occurred. Please try again.');
                }}
                style={{ layout: 'vertical' }}
              />
            </PayPalScriptProvider>
          </div>
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
            <button
              onClick={onBack}
              className="flex items-center gap-2 text-slate-600 hover:text-slate-900"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="hidden sm:inline">Back to Home</span>
            </button>
          </div>
        </div>
      </header>

      <main className="py-12 px-4">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-10">
            <h1 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-4">
              Book Your Site Visit
            </h1>
            <p className="text-lg text-slate-600">
              Schedule a professional site assessment for AED {VISIT_COST.toFixed(2)}
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-8">
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-red-700">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Full Name *
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      type="text"
                      required
                      value={formData.customer_name}
                      onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                      className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#bb2738] focus:border-transparent outline-none"
                      placeholder="John Doe"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Phone Number *
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      type="tel"
                      required
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#bb2738] focus:border-transparent outline-none"
                      placeholder="+971-XX-XXX-XXXX"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#bb2738] focus:border-transparent outline-none"
                    placeholder="john@example.com"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Location / Address *
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                  <textarea
                    required
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    rows={3}
                    className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#bb2738] focus:border-transparent outline-none resize-none"
                    placeholder="Enter your full address"
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Preferred Date *
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      type="date"
                      required
                      min={new Date().toISOString().split('T')[0]}
                      value={formData.preferred_date}
                      onChange={(e) => setFormData({ ...formData, preferred_date: e.target.value })}
                      className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#bb2738] focus:border-transparent outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Preferred Time
                  </label>
                  <select
                    value={formData.preferred_time}
                    onChange={(e) => setFormData({ ...formData, preferred_time: e.target.value })}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#bb2738] focus:border-transparent outline-none"
                  >
                    <option value="">Any time</option>
                    <option value="morning">Morning (9 AM - 12 PM)</option>
                    <option value="afternoon">Afternoon (12 PM - 3 PM)</option>
                    <option value="evening">Evening (3 PM - 6 PM)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Additional Notes
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#bb2738] focus:border-transparent outline-none resize-none"
                  placeholder="Any specific requirements or details you'd like us to know..."
                />
              </div>

              <div className="bg-slate-50 rounded-lg p-6 border border-slate-200">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-slate-700 font-medium">Site Visit Fee</span>
                  <span className="text-2xl font-bold text-[#bb2738]">AED {VISIT_COST.toFixed(2)}</span>
                </div>
                <p className="text-sm text-slate-600">
                  This fee covers the cost of professional site assessment and measurement. This amount will be refunded once you confirm the order.
                </p>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-[#bb2738] hover:bg-[#a01f2f] text-white rounded-lg transition-colors font-semibold text-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Processing...' : 'Proceed to Payment'}
              </button>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}
