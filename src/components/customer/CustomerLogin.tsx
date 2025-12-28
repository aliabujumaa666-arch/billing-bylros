import { useState, useEffect } from 'react';
import { useCustomerAuth } from '../../contexts/CustomerAuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useBrand } from '../../contexts/BrandContext';
import { supabase } from '../../lib/supabase';

interface RegistrationSettings {
  enabled: boolean;
  requireApproval: boolean;
  defaultStatus: string;
  notifyAdmin: boolean;
  customMessage?: string;
}

export function CustomerLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [registrationSettings, setRegistrationSettings] = useState<RegistrationSettings>({
    enabled: true,
    requireApproval: false,
    defaultStatus: 'Lead',
    notifyAdmin: false
  });
  const { signIn, signUp } = useCustomerAuth();
  const { brand } = useBrand();
  const { } = useLanguage();

  useEffect(() => {
    fetchRegistrationSettings();
  }, []);

  const fetchRegistrationSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('portal_settings')
        .select('setting_value')
        .eq('setting_key', 'customer_registration')
        .maybeSingle();

      if (error) throw error;

      if (data?.setting_value) {
        setRegistrationSettings(data.setting_value as RegistrationSettings);
      }
    } catch (err) {
      console.error('Error fetching registration settings:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      if (isSignUp) {
        if (!registrationSettings.enabled) {
          setError('Customer registration is currently disabled. Please contact support.');
          setLoading(false);
          return;
        }

        if (password !== confirmPassword) {
          setError('Passwords do not match');
          setLoading(false);
          return;
        }
        if (password.length < 6) {
          setError('Password must be at least 6 characters');
          setLoading(false);
          return;
        }
        if (!name.trim()) {
          setError('Please enter your name');
          setLoading(false);
          return;
        }

        const { data: existingCustomer } = await supabase
          .from('customers')
          .select('id')
          .eq('email', email)
          .maybeSingle();

        let customerId: string;
        const customerStatus = registrationSettings.requireApproval ? 'Pending' : registrationSettings.defaultStatus;
        const registrationNote = registrationSettings.requireApproval
          ? 'Self-registered via customer portal - Pending admin approval'
          : 'Self-registered via customer portal';

        if (existingCustomer) {
          customerId = existingCustomer.id;
        } else {
          const { data: newCustomer, error: customerError } = await supabase
            .from('customers')
            .insert({
              name: name.trim(),
              email: email.toLowerCase(),
              phone: phone || '',
              location: null,
              status: customerStatus,
              notes: registrationNote
            })
            .select('id')
            .single();

          if (customerError) throw customerError;
          if (!newCustomer) throw new Error('Failed to create customer record');

          customerId = newCustomer.id;
        }

        await signUp(email, password, customerId);

        const successMessage = registrationSettings.requireApproval
          ? 'Account created successfully! Your registration is pending admin approval. You will be notified once approved.'
          : 'Account created successfully! You can now sign in.';

        setSuccess(successMessage);
        setIsSignUp(false);
        setPassword('');
        setConfirmPassword('');
        setPhone('');
        setName('');
      } else {
        await signIn(email, password);
      }
    } catch (err: any) {
      setError(err.message || `Failed to ${isSignUp ? 'sign up' : 'sign in'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="flex flex-col items-center mb-8">
            <img
              src={brand?.logos.primary || '/Untitled-design-3.png'}
              alt={`${brand?.company.name || 'BYLROS'} Logo`}
              className="h-20 w-auto mb-3"
            />
            <p className="text-slate-600 text-sm font-medium">Customer Portal</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {error}
              </div>
            )}

            {success && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
                {success}
              </div>
            )}

            {isSignUp && (
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-slate-700 mb-2">
                  Full Name
                </label>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#bb2738] focus:border-transparent outline-none transition-all"
                  placeholder="John Doe"
                />
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-2">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#bb2738] focus:border-transparent outline-none transition-all"
                placeholder="your.email@example.com"
              />
            </div>

            {isSignUp && (
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-slate-700 mb-2">
                  Phone Number (Optional)
                </label>
                <input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#bb2738] focus:border-transparent outline-none transition-all"
                  placeholder="+971-52-5458-968"
                />
              </div>
            )}

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-2">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#bb2738] focus:border-transparent outline-none transition-all"
                placeholder="••••••••"
              />
            </div>

            {isSignUp && (
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-700 mb-2">
                  Confirm Password
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#bb2738] focus:border-transparent outline-none transition-all"
                  placeholder="••••••••"
                />
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#bb2738] hover:bg-[#a01f2f] text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl active:scale-95"
            >
              {loading ? (isSignUp ? 'Creating account...' : 'Signing in...') : (isSignUp ? 'Create Account' : 'Sign In')}
            </button>
          </form>

          {registrationSettings.enabled && (
            <div className="mt-6 text-center">
              <button
                onClick={() => {
                  setIsSignUp(!isSignUp);
                  setError('');
                  setSuccess('');
                  setPassword('');
                  setConfirmPassword('');
                  setPhone('');
                  setName('');
                }}
                className="text-sm text-[#bb2738] hover:underline"
              >
                {isSignUp ? 'Already have an account? Sign in' : 'New customer? Create an account'}
              </button>
              {registrationSettings.customMessage && !isSignUp && (
                <p className="text-xs text-slate-500 mt-2">{registrationSettings.customMessage}</p>
              )}
            </div>
          )}

          {!registrationSettings.enabled && !isSignUp && (
            <div className="mt-6 text-center">
              <p className="text-xs text-slate-500">
                New customer? Please contact support to create an account.
              </p>
            </div>
          )}

          <div className="mt-6 text-center text-xs text-slate-500">
            {brand?.company.fullName || 'BYLROS Middle East Aluminium & Glass LLC'}
          </div>
        </div>
      </div>
    </div>
  );
}
