import { XCircle } from 'lucide-react';

export function PaymentCancel() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
        <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <XCircle className="w-12 h-12 text-red-600" />
        </div>

        <h1 className="text-3xl font-bold text-slate-800 mb-3">
          Payment Cancelled
        </h1>

        <p className="text-slate-600 mb-6">
          Your payment was cancelled. No charges have been made to your account.
        </p>

        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
          <p className="text-sm text-amber-800">
            If you encountered any issues during the payment process, please contact our support team.
          </p>
        </div>

        <div className="space-y-3">
          <button
            onClick={() => window.location.href = '/customer'}
            className="w-full bg-[#bb2738] text-white px-6 py-3 rounded-lg hover:bg-[#a01f2f] transition-colors font-medium"
          >
            Return to Dashboard
          </button>

          <button
            onClick={() => window.history.back()}
            className="w-full border border-slate-300 text-slate-700 px-6 py-3 rounded-lg hover:bg-slate-50 transition-colors font-medium"
          >
            Try Again
          </button>
        </div>
      </div>
    </div>
  );
}
