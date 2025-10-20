import { useEffect } from 'react';
import { CheckCircle } from 'lucide-react';

export function PaymentSuccess() {
  useEffect(() => {
    const timer = setTimeout(() => {
      window.location.href = '/customer';
    }, 5000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-12 h-12 text-green-600" />
        </div>

        <h1 className="text-3xl font-bold text-slate-800 mb-3">
          Payment Successful!
        </h1>

        <p className="text-slate-600 mb-6">
          Your payment has been processed successfully. Your invoice has been updated.
        </p>

        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
          <p className="text-sm text-green-800">
            A confirmation email has been sent to your registered email address.
          </p>
        </div>

        <p className="text-sm text-slate-500 mb-6">
          Redirecting you back to your dashboard in 5 seconds...
        </p>

        <button
          onClick={() => window.location.href = '/customer'}
          className="w-full bg-[#bb2738] text-white px-6 py-3 rounded-lg hover:bg-[#a01f2f] transition-colors font-medium"
        >
          Return to Dashboard Now
        </button>
      </div>
    </div>
  );
}
