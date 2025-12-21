import { useEffect, useState } from 'react';
import { useCustomerAuth } from '../../contexts/CustomerAuthContext';
import { useBrand } from '../../contexts/BrandContext';
import { supabase } from '../../lib/supabase';
import { Package, FileText, Calendar, DollarSign, User, LogOut, Home, HelpCircle, Bell, MessageSquare, PackageCheck, Menu, X, Shield, Receipt, UserCog, ArrowLeft } from 'lucide-react';
import { CustomerHome } from './CustomerHome';
import { CustomerProfile } from './CustomerProfile';
import { CustomerQuotes } from './CustomerQuotes';
import { CustomerOrders } from './CustomerOrders';
import { CustomerInvoices } from './CustomerInvoices';
import { CustomerSiteVisits } from './CustomerSiteVisits';
import { CustomerWarranties } from './CustomerWarranties';
import { PaymentSuccess } from './PaymentSuccess';
import { PaymentCancel } from './PaymentCancel';
import { CustomerHelpCenter } from './CustomerHelpCenter';
import { CustomerChangelog } from './CustomerChangelog';
import { NotificationPreferences } from './NotificationPreferences';
import { CustomerMessages } from './CustomerMessages';
import { CustomerReceipts } from './CustomerReceipts';
import { FeedbackWidget } from '../FeedbackWidget';

type View = 'home' | 'overview' | 'profile' | 'quotes' | 'orders' | 'invoices' | 'receipts' | 'visits' | 'warranties' | 'help' | 'changelog' | 'notifications' | 'messages' | 'payment-success' | 'payment-cancel';

export function CustomerDashboard() {
  const { user, customerData, signOut } = useCustomerAuth();
  const { brand } = useBrand();
  const [activeView, setActiveView] = useState<View>('home');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [stats, setStats] = useState({
    quotesCount: 0,
    ordersCount: 0,
    invoicesCount: 0,
    visitsCount: 0,
    warrantiesCount: 0,
    totalSpent: 0,
  });
  const [customer, setCustomer] = useState<any>(null);
  const isAdmin = user && !customerData;
  const isImpersonating = sessionStorage.getItem('admin_impersonation') !== null;

  useEffect(() => {
    if (customerData) {
      fetchStats();
      fetchCustomerInfo();
    }

    const path = window.location.pathname;
    if (path.includes('/payment-success')) {
      setActiveView('payment-success');
    } else if (path.includes('/payment-cancel')) {
      setActiveView('payment-cancel');
    }
  }, [customerData]);

  const fetchCustomerInfo = async () => {
    if (!customerData) return;

    const { data } = await supabase
      .from('customers')
      .select('*')
      .eq('id', customerData.customer_id)
      .maybeSingle();

    if (data) setCustomer(data);
  };

  const fetchStats = async () => {
    if (!customerData) return;

    const [quotesRes, ordersRes, invoicesRes, visitsRes, warrantiesRes] = await Promise.all([
      supabase.from('quotes').select('id', { count: 'exact' }).eq('customer_id', customerData.customer_id),
      supabase.from('orders').select('id', { count: 'exact' }).eq('customer_id', customerData.customer_id),
      supabase.from('invoices').select('total_amount').eq('customer_id', customerData.customer_id),
      supabase.from('site_visits').select('id', { count: 'exact' }).eq('customer_id', customerData.customer_id),
      supabase.from('warranties').select('id', { count: 'exact' }).eq('customer_id', customerData.customer_id).eq('status', 'active'),
    ]);

    const totalSpent = invoicesRes.data?.reduce((sum, inv) => sum + Number(inv.total_amount), 0) || 0;

    setStats({
      quotesCount: quotesRes.count || 0,
      ordersCount: ordersRes.count || 0,
      invoicesCount: invoicesRes.data?.length || 0,
      visitsCount: visitsRes.count || 0,
      warrantiesCount: warrantiesRes.count || 0,
      totalSpent,
    });
  };

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const handleExitImpersonation = () => {
    sessionStorage.removeItem('admin_impersonation');
    window.location.href = '/admin';
  };

  const renderView = () => {
    switch (activeView) {
      case 'home':
        return <CustomerHome onNavigate={(view) => setActiveView(view as View)} />;
      case 'profile':
        return <CustomerProfile />;
      case 'quotes':
        return <CustomerQuotes />;
      case 'orders':
        return <CustomerOrders />;
      case 'invoices':
        return <CustomerInvoices />;
      case 'receipts':
        return <CustomerReceipts />;
      case 'visits':
        return <CustomerSiteVisits />;
      case 'warranties':
        return <CustomerWarranties />;
      case 'payment-success':
        return <PaymentSuccess />;
      case 'payment-cancel':
        return <PaymentCancel />;
      case 'help':
        return <CustomerHelpCenter />;
      case 'changelog':
        return <CustomerChangelog />;
      case 'notifications':
        return <NotificationPreferences />;
      case 'messages':
        return <CustomerMessages />;
      case 'overview':
      default:
        return (
          <div>
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-slate-800 mb-2">Welcome back, {customer?.name || 'Customer'}!</h2>
              <p className="text-slate-600">Here's an overview of your account with {brand?.company.name || 'BYLROS'}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              <div className="bg-white rounded-xl p-6 border border-slate-200 hover:shadow-lg transition-shadow">
                <div className="flex items-center justify-between mb-4">
                  <FileText className="w-8 h-8 text-[#bb2738]" />
                  <span className="text-3xl font-bold text-slate-800">{stats.quotesCount}</span>
                </div>
                <h3 className="text-slate-600 font-medium">Quotes Received</h3>
              </div>

              <div className="bg-white rounded-xl p-6 border border-slate-200 hover:shadow-lg transition-shadow">
                <div className="flex items-center justify-between mb-4">
                  <Package className="w-8 h-8 text-blue-600" />
                  <span className="text-3xl font-bold text-slate-800">{stats.ordersCount}</span>
                </div>
                <h3 className="text-slate-600 font-medium">Active Orders</h3>
              </div>

              <div className="bg-white rounded-xl p-6 border border-slate-200 hover:shadow-lg transition-shadow">
                <div className="flex items-center justify-between mb-4">
                  <Calendar className="w-8 h-8 text-green-600" />
                  <span className="text-3xl font-bold text-slate-800">{stats.visitsCount}</span>
                </div>
                <h3 className="text-slate-600 font-medium">Site Visits</h3>
              </div>

              <div className="bg-white rounded-xl p-6 border border-slate-200 hover:shadow-lg transition-shadow">
                <div className="flex items-center justify-between mb-4">
                  <DollarSign className="w-8 h-8 text-amber-600" />
                  <span className="text-3xl font-bold text-slate-800">{stats.invoicesCount}</span>
                </div>
                <h3 className="text-slate-600 font-medium">Invoices</h3>
              </div>

              <div className="bg-white rounded-xl p-6 border border-slate-200 hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setActiveView('warranties')}>
                <div className="flex items-center justify-between mb-4">
                  <Shield className="w-8 h-8 text-emerald-600" />
                  <span className="text-3xl font-bold text-slate-800">{stats.warrantiesCount}</span>
                </div>
                <h3 className="text-slate-600 font-medium">Active Warranties</h3>
              </div>

              <div className="bg-white rounded-xl p-6 border border-slate-200 hover:shadow-lg transition-shadow md:col-span-2">
                <div className="flex items-center justify-between mb-4">
                  <DollarSign className="w-8 h-8 text-[#bb2738]" />
                  <span className="text-3xl font-bold text-slate-800">AED {stats.totalSpent.toLocaleString()}</span>
                </div>
                <h3 className="text-slate-600 font-medium">Total Value</h3>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <button
                onClick={() => setActiveView('orders')}
                className="bg-[#bb2738] hover:bg-[#a01f2f] text-white p-6 rounded-xl text-left transition-colors"
              >
                <Package className="w-8 h-8 mb-3" />
                <h3 className="text-xl font-semibold mb-1">Track Orders</h3>
                <p className="text-white/80 text-sm">View status and progress of your orders</p>
              </button>

              <button
                onClick={() => setActiveView('invoices')}
                className="bg-slate-700 hover:bg-slate-800 text-white p-6 rounded-xl text-left transition-colors"
              >
                <FileText className="w-8 h-8 mb-3" />
                <h3 className="text-xl font-semibold mb-1">View Invoices</h3>
                <p className="text-white/80 text-sm">Check your invoices and payment history</p>
              </button>
            </div>
          </div>
        );
    }
  };

  const navigation = [
    { id: 'home', icon: Home, label: 'Home' },
    { id: 'overview', icon: Package, label: 'Overview' },
    { id: 'quotes', icon: FileText, label: 'Quotes' },
    { id: 'orders', icon: Package, label: 'Orders' },
    { id: 'invoices', icon: DollarSign, label: 'Invoices' },
    { id: 'receipts', icon: Receipt, label: 'Receipts' },
    { id: 'visits', icon: Calendar, label: 'Site Visits' },
    { id: 'warranties', icon: Shield, label: 'Warranties' },
  ];

  const supportNav = [
    { id: 'help', icon: HelpCircle, label: 'Help Center' },
    { id: 'changelog', icon: PackageCheck, label: "What's New" },
    { id: 'messages', icon: MessageSquare, label: 'Messages' },
    { id: 'notifications', icon: Bell, label: 'Notifications' },
    { id: 'profile', icon: User, label: 'Profile' },
  ];

  if (isAdmin) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="flex justify-center mb-6">
            <div className="p-4 bg-blue-50 rounded-full">
              <Shield className="w-12 h-12 text-blue-600" />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-3">Admin Access</h2>
          <p className="text-slate-600 mb-6">
            You are logged in as an administrator. This portal is designed for customers to view their orders, quotes, and invoices.
          </p>
          <p className="text-slate-600 mb-6">
            To access the admin panel, please visit the admin portal.
          </p>
          <div className="space-y-3">
            <button
              onClick={() => {
                window.location.href = '/admin';
              }}
              className="w-full bg-[#bb2738] hover:bg-[#a01f2f] text-white font-semibold py-3 px-6 rounded-lg transition-all shadow-lg hover:shadow-xl"
            >
              Go to Admin Panel
            </button>
            <button
              onClick={handleSignOut}
              className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-3 px-6 rounded-lg transition-all"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {isImpersonating && (
        <div className="fixed top-0 left-0 right-0 bg-gradient-to-r from-purple-600 to-purple-700 text-white px-6 py-3 z-50 shadow-lg">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <UserCog className="w-5 h-5" />
              <div>
                <p className="text-sm font-semibold">Admin View</p>
                <p className="text-xs text-purple-100">You are viewing as: {customer?.name || 'Customer'}</p>
              </div>
            </div>
            <button
              onClick={handleExitImpersonation}
              className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors text-sm font-medium"
            >
              <ArrowLeft className="w-4 h-4" />
              Return to Admin Panel
            </button>
          </div>
        </div>
      )}
      {/* Mobile Header */}
      <div className={`lg:hidden fixed left-0 right-0 bg-white border-b border-slate-200 z-40 ${isImpersonating ? 'top-[52px]' : 'top-0'}`}>
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <img
              src={brand?.logos.primary || '/Untitled-design-3.png'}
              alt={`${brand?.company.name || 'BYLROS'} Logo`}
              className="h-10 w-auto"
            />
          </div>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-lg hover:bg-slate-100"
          >
            {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Sidebar */}
      <aside className={`
        fixed left-0 bg-white border-r border-slate-200 z-40
        w-64 transform transition-transform duration-200 ease-in-out flex flex-col
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        ${isImpersonating ? 'top-[52px] h-[calc(100vh-52px)]' : 'top-0 h-full'}
      `}>
        <div className="p-6 border-b border-slate-200 flex-shrink-0">
          <div className="flex flex-col items-center">
            <img
              src={brand?.logos.primary || '/Untitled-design-3.png'}
              alt={`${brand?.company.name || 'BYLROS'} Logo`}
              className="h-14 w-auto mb-2"
            />
            <p className="text-xs text-slate-600 font-medium">Customer Portal</p>
            <p className="text-xs text-slate-500 mt-1">{customer?.name}</p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          <nav className="p-4 space-y-1">
            {navigation.map((item) => {
              const Icon = item.icon;
              const isActive = activeView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveView(item.id as View);
                    setSidebarOpen(false);
                  }}
                  className={`
                    w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all
                    ${isActive
                      ? 'bg-[#bb2738] text-white shadow-md'
                      : 'text-slate-700 hover:bg-slate-100'
                    }
                  `}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                </button>
              );
            })}
          </nav>

          <div className="px-4 py-2 mt-6 mb-4">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 px-4">Support & Settings</p>
            <div className="space-y-1">
              {supportNav.map((item) => {
                const Icon = item.icon;
                const isActive = activeView === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveView(item.id as View);
                      setSidebarOpen(false);
                    }}
                    className={`
                      w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all text-sm
                      ${isActive
                        ? 'bg-[#bb2738] text-white shadow-md'
                        : 'text-slate-700 hover:bg-slate-100'
                      }
                    `}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="font-medium">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="border-t border-slate-200 p-4 flex-shrink-0 bg-white">
          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium">Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main content */}
      <main className={`lg:ml-64 ${isImpersonating ? 'pt-[132px] lg:pt-[68px]' : 'pt-20 lg:pt-8'}`}>
        <div className="p-6 lg:p-8">
          {renderView()}
        </div>
      </main>
      <FeedbackWidget userType="customer" />
    </div>
  );
}
