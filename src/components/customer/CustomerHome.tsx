import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import { useCustomerAuth } from '../../contexts/CustomerAuthContext';
import * as Icons from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { LoadingSpinner } from '../LoadingSpinner';

export function CustomerHome({ onNavigate }: { onNavigate: (view: string) => void }) {
  const { customerData } = useCustomerAuth();
  const [settings, setSettings] = useState<any>(null);
  const [stats, setStats] = useState({
    quotesCount: 0,
    ordersCount: 0,
    invoicesCount: 0,
    visitsCount: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSettings();
    if (customerData) {
      fetchStats();
    }
  }, [customerData]);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('portal_settings')
        .select('setting_value')
        .eq('setting_key', 'home_page')
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setSettings(data.setting_value);
      }
    } catch (err) {
      console.error('Error fetching settings:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    if (!customerData) return;

    const [quotesRes, ordersRes, invoicesRes, visitsRes] = await Promise.all([
      supabase.from('quotes').select('id', { count: 'exact' }).eq('customer_id', customerData.customer_id),
      supabase.from('orders').select('id', { count: 'exact' }).eq('customer_id', customerData.customer_id),
      supabase.from('invoices').select('id', { count: 'exact' }).eq('customer_id', customerData.customer_id),
      supabase.from('site_visits').select('id', { count: 'exact' }).eq('customer_id', customerData.customer_id),
    ]);

    setStats({
      quotesCount: quotesRes.count || 0,
      ordersCount: ordersRes.count || 0,
      invoicesCount: invoicesRes.count || 0,
      visitsCount: visitsRes.count || 0,
    });
  };

  const getIcon = useCallback((iconName: string): LucideIcon => {
    const IconComponent = (Icons as any)[iconName];
    return IconComponent || Icons.Star;
  }, []);

  if (loading) {
    return <LoadingSpinner size="lg" />;
  }

  if (!settings || !settings.enabled) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-slate-800 mb-4">Welcome to BYLROS Customer Portal</h2>
        <p className="text-slate-600">Use the navigation above to access your account features.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div
        className="rounded-2xl p-12 text-white text-center"
        style={{ backgroundColor: settings.hero.backgroundColor }}
      >
        <h1 className="text-4xl font-bold mb-4">{settings.hero.title}</h1>
        <p className="text-xl opacity-90">{settings.hero.subtitle}</p>
      </div>

      <div className="bg-white rounded-xl p-8 border border-slate-200">
        <h2 className="text-2xl font-bold text-slate-800 mb-4">{settings.welcome.title}</h2>
        <p className="text-slate-600 leading-relaxed mb-6">{settings.welcome.message}</p>

        {settings.welcome.showStats && customerData && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            <div className="bg-slate-50 rounded-lg p-4 text-center">
              <div className="text-3xl font-bold text-[#bb2738] mb-1">{stats.quotesCount}</div>
              <div className="text-sm text-slate-600">Quotes</div>
            </div>
            <div className="bg-slate-50 rounded-lg p-4 text-center">
              <div className="text-3xl font-bold text-blue-600 mb-1">{stats.ordersCount}</div>
              <div className="text-sm text-slate-600">Orders</div>
            </div>
            <div className="bg-slate-50 rounded-lg p-4 text-center">
              <div className="text-3xl font-bold text-amber-600 mb-1">{stats.invoicesCount}</div>
              <div className="text-sm text-slate-600">Invoices</div>
            </div>
            <div className="bg-slate-50 rounded-lg p-4 text-center">
              <div className="text-3xl font-bold text-green-600 mb-1">{stats.visitsCount}</div>
              <div className="text-sm text-slate-600">Visits</div>
            </div>
          </div>
        )}
      </div>

      {settings.features && settings.features.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {settings.features.map((feature: any, index: number) => {
            const IconComponent = getIcon(feature.icon);
            return (
              <div
                key={index}
                className="bg-white rounded-xl p-6 border border-slate-200 hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => {
                  const viewMap: { [key: string]: string } = {
                    'FileText': 'quotes',
                    'Package': 'orders',
                    'DollarSign': 'invoices',
                    'Calendar': 'visits',
                  };
                  const view = viewMap[feature.icon] || 'profile';
                  onNavigate(view);
                }}
              >
                <div className="w-12 h-12 bg-[#bb2738]/10 rounded-lg flex items-center justify-center mb-4">
                  <IconComponent className="w-6 h-6 text-[#bb2738]" />
                </div>
                <h3 className="text-lg font-semibold text-slate-800 mb-2">{feature.title}</h3>
                <p className="text-slate-600 text-sm">{feature.description}</p>
              </div>
            );
          })}
        </div>
      )}

      {settings.roadmap?.enabled && settings.roadmap?.steps && settings.roadmap.steps.length > 0 && (
        <div className="rounded-xl p-8 md:p-12" style={{ backgroundColor: settings.roadmap.backgroundColor }}>
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-slate-800 mb-3">{settings.roadmap.title}</h2>
              <p className="text-lg text-slate-600">{settings.roadmap.subtitle}</p>
            </div>

            <div className="relative">
              <div className="hidden md:block absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#bb2738] via-[#bb2738] to-[#bb2738] opacity-20" style={{ top: '2.5rem' }}></div>

              <div className="grid grid-cols-1 md:grid-cols-5 gap-6 md:gap-4">
                {settings.roadmap.steps.map((step: any, index: number) => {
                  const IconComponent = getIcon(step.icon);
                  return (
                    <div key={index} className="relative">
                      <div className="flex md:flex-col items-start md:items-center gap-4 md:gap-0">
                        <div className="relative z-10 flex flex-col items-center">
                          <div className="w-20 h-20 bg-[#bb2738] text-white rounded-full flex items-center justify-center mb-3 shadow-lg">
                            <IconComponent className="w-10 h-10" />
                          </div>
                          <div className="w-10 h-10 bg-white border-4 border-[#bb2738] text-[#bb2738] rounded-full flex items-center justify-center font-bold text-lg -mt-6 mb-3 shadow-md">
                            {step.order}
                          </div>
                        </div>

                        <div className="flex-1 md:text-center">
                          <h3 className="text-lg font-bold text-slate-800 mb-2">{step.title}</h3>
                          <p className="text-sm text-slate-600 leading-relaxed">{step.description}</p>
                        </div>
                      </div>

                      {index < settings.roadmap.steps.length - 1 && (
                        <div className="md:hidden absolute left-10 top-20 bottom-0 w-0.5 bg-[#bb2738]/30"></div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {settings.contact && settings.contact.showContactInfo && (
        <div className="bg-slate-50 rounded-xl p-8 border border-slate-200">
          <h2 className="text-2xl font-bold text-slate-800 mb-4">{settings.contact.title}</h2>
          <p className="text-slate-600 mb-6">{settings.contact.message}</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#bb2738] rounded-lg flex items-center justify-center">
                <Icons.Mail className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="text-xs text-slate-600 mb-1">Email</div>
                <a href={`mailto:${settings.contact.email}`} className="text-slate-800 hover:text-[#bb2738] font-medium">
                  {settings.contact.email}
                </a>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#bb2738] rounded-lg flex items-center justify-center">
                <Icons.Phone className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="text-xs text-slate-600 mb-1">Phone</div>
                <a href={`tel:${settings.contact.phone}`} className="text-slate-800 hover:text-[#bb2738] font-medium">
                  {settings.contact.phone}
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
