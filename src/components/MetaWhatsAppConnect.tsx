import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useToast } from '../contexts/ToastContext';
import { CheckCircle, AlertCircle, Loader, ExternalLink } from 'lucide-react';

interface MetaWhatsAppConnectProps {
  onSuccess: () => void;
}

interface PhoneNumber {
  id: string;
  display_phone_number: string;
  verified_name: string;
  quality_rating?: string;
}

export function MetaWhatsAppConnect({ onSuccess }: MetaWhatsAppConnectProps) {
  const { success: showSuccess, error: showError } = useToast();
  const [metaAppId, setMetaAppId] = useState('');
  const [metaAppSecret, setMetaAppSecret] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  const [phoneNumbers, setPhoneNumbers] = useState<PhoneNumber[]>([]);
  const [selectedPhone, setSelectedPhone] = useState('');
  const [accessToken, setAccessToken] = useState('');
  const [step, setStep] = useState<'credentials' | 'authenticate' | 'select_phone' | 'complete'>('credentials');
  const [errorDetails, setErrorDetails] = useState<any>(null);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');

    if (code && metaAppId && metaAppSecret) {
      handleOAuthCallback(code);
    }
  }, []);

  const initiateMetaLogin = () => {
    if (!metaAppId || !metaAppSecret) {
      showError('Please provide Meta App ID and App Secret');
      return;
    }

    const redirectUri = `${window.location.origin}${window.location.pathname}`;
    const scope = 'business_management,whatsapp_business_management,whatsapp_business_messaging';

    const authUrl = `https://www.facebook.com/v21.0/dialog/oauth?client_id=${metaAppId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${scope}&response_type=code`;

    localStorage.setItem('meta_app_id', metaAppId);
    localStorage.setItem('meta_app_secret', metaAppSecret);

    window.location.href = authUrl;
  };

  const handleOAuthCallback = async (code: string) => {
    setIsConnecting(true);

    try {
      const storedAppId = localStorage.getItem('meta_app_id') || metaAppId;
      const storedAppSecret = localStorage.getItem('meta_app_secret') || metaAppSecret;

      if (!storedAppId || !storedAppSecret) {
        throw new Error('Missing app credentials');
      }

      const redirectUri = `${window.location.origin}${window.location.pathname}`;

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/meta-oauth-callback?code=${code}&app_id=${storedAppId}&app_secret=${storedAppSecret}&redirect_uri=${encodeURIComponent(redirectUri)}`,
        {
          headers: {
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        setErrorDetails(data);
        throw new Error(data.error || 'Failed to authenticate with Meta');
      }

      setAccessToken(data.access_token);
      setPhoneNumbers(data.phone_numbers || []);

      if (data.phone_numbers && data.phone_numbers.length > 0) {
        setStep('select_phone');
      } else {
        showError('No WhatsApp phone numbers found in your Meta account');
        setStep('credentials');
      }

      window.history.replaceState({}, document.title, window.location.pathname);

      localStorage.removeItem('meta_app_id');
      localStorage.removeItem('meta_app_secret');

    } catch (err: any) {
      console.error('OAuth callback error:', err);
      console.error('Error details:', errorDetails);

      let errorMessage = err.message || 'Failed to connect to Meta';

      if (errorDetails?.step) {
        errorMessage += ` (Step: ${errorDetails.step})`;
      }

      if (errorDetails?.hint) {
        errorMessage += `. ${errorDetails.hint}`;
      }

      showError(errorMessage);
      setStep('credentials');
    } finally {
      setIsConnecting(false);
    }
  };

  const saveConfiguration = async () => {
    if (!selectedPhone || !accessToken) {
      showError('Please select a phone number');
      return;
    }

    setIsConnecting(true);

    try {
      const phoneData = phoneNumbers.find(p => p.id === selectedPhone);

      if (!phoneData) {
        throw new Error('Invalid phone number selection');
      }

      const { data: user } = await supabase.auth.getUser();

      const { data: existingSettings } = await supabase
        .from('whatsapp_settings')
        .select('id')
        .eq('is_active', true)
        .maybeSingle();

      if (existingSettings) {
        await supabase
          .from('whatsapp_settings')
          .update({ is_active: false })
          .eq('id', existingSettings.id);
      }

      const { error: insertError } = await supabase
        .from('whatsapp_settings')
        .insert({
          api_provider: 'whatsapp-business',
          api_key: accessToken,
          api_secret: metaAppSecret,
          phone_number: phoneData.display_phone_number,
          is_active: true,
          created_by: user?.user?.id,
          metadata: {
            phone_number_id: selectedPhone,
            verified_name: phoneData.verified_name,
            quality_rating: phoneData.quality_rating,
            configured_via: 'meta_oauth',
            configured_at: new Date().toISOString()
          }
        });

      if (insertError) throw insertError;

      showSuccess('WhatsApp Business API connected successfully!');
      setStep('complete');

      setTimeout(() => {
        onSuccess();
      }, 2000);

    } catch (err: any) {
      console.error('Error saving configuration:', err);
      showError('Failed to save WhatsApp configuration');
    } finally {
      setIsConnecting(false);
    }
  };

  if (isConnecting) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Loader className="w-12 h-12 text-[#bb2738] animate-spin mb-4" />
        <p className="text-slate-600">Connecting to Meta...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {step === 'credentials' && (
        <>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 mb-2">Setup Instructions</h3>
            <ol className="list-decimal list-inside text-sm text-blue-800 space-y-2">
              <li>
                <strong>Create Meta App:</strong> Go to <a href="https://developers.facebook.com" target="_blank" rel="noopener noreferrer" className="underline font-semibold">developers.facebook.com</a> and create a Business app
              </li>
              <li>
                <strong>Add WhatsApp Product:</strong> In your app dashboard, click "Add Product" and select "WhatsApp"
              </li>
              <li>
                <strong>Get Credentials:</strong> Go to App Settings → Basic and copy your App ID and App Secret
              </li>
              <li>
                <strong>Configure OAuth:</strong> In App Settings → Basic → Add Platform → Website, add this OAuth redirect URI:<br/>
                <code className="bg-blue-100 px-2 py-1 rounded block mt-1 text-xs break-all">{window.location.origin}{window.location.pathname}</code>
              </li>
              <li>
                <strong>Set Permissions:</strong> Make sure your app has these permissions enabled:
                <ul className="list-disc list-inside ml-4 mt-1">
                  <li>business_management</li>
                  <li>whatsapp_business_management</li>
                  <li>whatsapp_business_messaging</li>
                </ul>
              </li>
              <li>
                <strong>Link Business Account:</strong> In WhatsApp → Getting Started, link your Meta Business Account that contains your WhatsApp Business Account
              </li>
            </ol>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h3 className="font-semibold text-yellow-900 mb-2">Common Issues</h3>
            <ul className="list-disc list-inside text-sm text-yellow-800 space-y-1">
              <li><strong>No phone numbers found:</strong> Make sure your WhatsApp Business Account is linked to the Meta Business Account</li>
              <li><strong>Permission errors:</strong> Verify all required permissions are granted in your app settings</li>
              <li><strong>Redirect URI mismatch:</strong> Ensure the redirect URI in Meta matches exactly (including https://)</li>
              <li><strong>App not approved:</strong> For testing, use your own phone number. For production, submit app for review</li>
            </ul>
          </div>

          {errorDetails && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <h3 className="font-semibold text-red-900 mb-2">Connection Error Details</h3>
              <div className="text-sm text-red-800 space-y-1">
                <p><strong>Error:</strong> {errorDetails.error || 'Unknown error'}</p>
                {errorDetails.step && <p><strong>Failed at:</strong> {errorDetails.step}</p>}
                {errorDetails.hint && <p><strong>Suggestion:</strong> {errorDetails.hint}</p>}
                {errorDetails.details && (
                  <details className="mt-2">
                    <summary className="cursor-pointer font-semibold">Technical Details</summary>
                    <pre className="mt-2 p-2 bg-red-100 rounded text-xs overflow-auto">
                      {JSON.stringify(errorDetails.details, null, 2)}
                    </pre>
                  </details>
                )}
              </div>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Meta App ID *
              </label>
              <input
                type="text"
                value={metaAppId}
                onChange={(e) => {
                  setMetaAppId(e.target.value);
                  setErrorDetails(null);
                }}
                placeholder="1234567890123456"
                className="w-full px-4 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-[#bb2738]"
              />
              <p className="text-xs text-slate-500 mt-1">Found in App Settings → Basic</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Meta App Secret *
              </label>
              <input
                type="password"
                value={metaAppSecret}
                onChange={(e) => {
                  setMetaAppSecret(e.target.value);
                  setErrorDetails(null);
                }}
                placeholder="Enter your Meta App Secret"
                className="w-full px-4 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-[#bb2738]"
              />
              <p className="text-xs text-slate-500 mt-1">Found in App Settings → Basic (click "Show")</p>
            </div>

            <button
              onClick={initiateMetaLogin}
              disabled={!metaAppId || !metaAppSecret}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-[#1877f2] text-white rounded-lg hover:bg-[#166fe5] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ExternalLink className="w-5 h-5" />
              Connect with Meta
            </button>
          </div>
        </>
      )}

      {step === 'select_phone' && (
        <>
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-green-900">Successfully Connected to Meta</h3>
              <p className="text-sm text-green-800 mt-1">
                Select a WhatsApp Business phone number to use for messaging
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Select WhatsApp Phone Number
              </label>

              {phoneNumbers.length === 0 ? (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm text-yellow-800">
                      No WhatsApp phone numbers found. Please add a phone number to your WhatsApp Business account in Meta Business Manager.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  {phoneNumbers.map((phone) => (
                    <label
                      key={phone.id}
                      className={`flex items-center gap-3 p-4 border-2 rounded-lg cursor-pointer transition-all ${
                        selectedPhone === phone.id
                          ? 'border-[#bb2738] bg-red-50'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <input
                        type="radio"
                        checked={selectedPhone === phone.id}
                        onChange={() => setSelectedPhone(phone.id)}
                        className="text-[#bb2738] focus:ring-[#bb2738]"
                      />
                      <div className="flex-1">
                        <p className="font-semibold text-slate-900">{phone.display_phone_number}</p>
                        <p className="text-sm text-slate-600">{phone.verified_name}</p>
                        {phone.quality_rating && (
                          <span className="text-xs text-slate-500 mt-1 inline-block">
                            Quality: {phone.quality_rating}
                          </span>
                        )}
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setStep('credentials');
                  setPhoneNumbers([]);
                  setAccessToken('');
                }}
                className="flex-1 px-6 py-3 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition-colors"
              >
                Back
              </button>
              <button
                onClick={saveConfiguration}
                disabled={!selectedPhone || phoneNumbers.length === 0}
                className="flex-1 px-6 py-3 bg-[#bb2738] text-white rounded-lg hover:bg-[#a01f2f] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Save Configuration
              </button>
            </div>
          </div>
        </>
      )}

      {step === 'complete' && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
          <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-green-900 mb-2">All Set!</h3>
          <p className="text-green-800">
            Your WhatsApp Business API has been configured successfully. You can now start sending messages.
          </p>
        </div>
      )}
    </div>
  );
}
