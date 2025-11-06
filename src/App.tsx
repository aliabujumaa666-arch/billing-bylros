import { useState, useEffect, lazy, Suspense } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { CustomerAuthProvider, useCustomerAuth } from './contexts/CustomerAuthContext';
import { LanguageProvider } from './contexts/LanguageContext';
import { ToastProvider } from './contexts/ToastContext';
import { BrandProvider } from './contexts/BrandContext';
import { Login } from './components/Login';
import { Layout } from './components/Layout';
import { PublicHome } from './components/PublicHome';
import { PublicBooking } from './components/PublicBooking';
import { GlobalSearch } from './components/GlobalSearch';

const Dashboard = lazy(() => import('./components/Dashboard').then(module => ({ default: module.Dashboard })));
const Customers = lazy(() => import('./components/Customers').then(module => ({ default: module.Customers })));
const Quotes = lazy(() => import('./components/Quotes').then(module => ({ default: module.Quotes })));
const SiteVisits = lazy(() => import('./components/SiteVisits').then(module => ({ default: module.SiteVisits })));
const Orders = lazy(() => import('./components/Orders').then(module => ({ default: module.Orders })));
const Invoices = lazy(() => import('./components/Invoices').then(module => ({ default: module.Invoices })));
const OrderTracker = lazy(() => import('./components/OrderTracker').then(module => ({ default: module.OrderTracker })));
const PortalSettings = lazy(() => import('./components/PortalSettings').then(module => ({ default: module.PortalSettings })));
const KnowledgeBase = lazy(() => import('./components/KnowledgeBase').then(module => ({ default: module.KnowledgeBase })));
const FAQManagement = lazy(() => import('./components/FAQManagement').then(module => ({ default: module.FAQManagement })));
const VideoTutorials = lazy(() => import('./components/VideoTutorials').then(module => ({ default: module.VideoTutorials })));
const SupportTickets = lazy(() => import('./components/SupportTickets').then(module => ({ default: module.SupportTickets })));
const FeedbackManagement = lazy(() => import('./components/FeedbackManagement').then(module => ({ default: module.FeedbackManagement })));
const ChangelogManagement = lazy(() => import('./components/ChangelogManagement').then(module => ({ default: module.ChangelogManagement })));
const EmailTemplates = lazy(() => import('./components/EmailTemplates').then(module => ({ default: module.EmailTemplates })));
const Messages = lazy(() => import('./components/Messages').then(module => ({ default: module.Messages })));
const CacheManagement = lazy(() => import('./components/CacheManagement').then(module => ({ default: module.CacheManagement })));
const ProductionWorkflow = lazy(() => import('./components/ProductionWorkflow').then(module => ({ default: module.ProductionWorkflow })));
const InventoryManagement = lazy(() => import('./components/InventoryManagement').then(module => ({ default: module.InventoryManagement })));
const CalendarView = lazy(() => import('./components/CalendarView').then(module => ({ default: module.CalendarView })));
const InstallationTasks = lazy(() => import('./components/InstallationTasks').then(module => ({ default: module.InstallationTasks })));
const WarrantyManagement = lazy(() => import('./components/WarrantyManagement').then(module => ({ default: module.WarrantyManagement })));
const WhatsAppMessaging = lazy(() => import('./components/WhatsAppMessaging').then(module => ({ default: module.WhatsAppMessaging })));
const WhatsAppInbox = lazy(() => import('./components/WhatsAppInbox').then(module => ({ default: module.WhatsAppInbox })));
const WhatsAppAISettings = lazy(() => import('./components/WhatsAppAISettings').then(module => ({ default: module.WhatsAppAISettings })));
const CustomerLogin = lazy(() => import('./components/customer/CustomerLogin').then(module => ({ default: module.CustomerLogin })));
const CustomerDashboard = lazy(() => import('./components/customer/CustomerDashboard').then(module => ({ default: module.CustomerDashboard })));

function LoadingFallback() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#bb2738]"></div>
        <p className="text-slate-600">Loading...</p>
      </div>
    </div>
  );
}

function AdminApp() {
  const { user, loading } = useAuth();
  const [currentPage, setCurrentPage] = useState('dashboard');

  const handleSearchNavigate = (page: string) => {
    setCurrentPage(page);
  };

  if (loading) {
    return <LoadingFallback />;
  }

  if (!user) {
    return <Login />;
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard />;
      case 'customers':
        return <Customers />;
      case 'quotes':
        return <Quotes />;
      case 'visits':
        return <SiteVisits />;
      case 'orders':
        return <Orders />;
      case 'invoices':
        return <Invoices />;
      case 'tracker':
        return <OrderTracker />;
      case 'portal-settings':
        return <PortalSettings />;
      case 'knowledge-base':
        return <KnowledgeBase />;
      case 'faq-management':
        return <FAQManagement />;
      case 'video-tutorials':
        return <VideoTutorials />;
      case 'support-tickets':
        return <SupportTickets />;
      case 'feedback-management':
        return <FeedbackManagement />;
      case 'changelog-management':
        return <ChangelogManagement />;
      case 'email-templates':
        return <EmailTemplates />;
      case 'messages':
        return <Messages />;
      case 'cache-management':
        return <CacheManagement />;
      case 'production-workflow':
        return <ProductionWorkflow />;
      case 'inventory':
        return <InventoryManagement />;
      case 'calendar':
        return <CalendarView />;
      case 'installation-tasks':
        return <InstallationTasks />;
      case 'warranty-feedback':
        return <WarrantyManagement />;
      case 'whatsapp-messaging':
        return <WhatsAppMessaging />;
      case 'whatsapp-inbox':
        return <WhatsAppInbox />;
      case 'whatsapp-ai-settings':
        return <WhatsAppAISettings />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <>
      <GlobalSearch onNavigate={handleSearchNavigate} />
      <Layout currentPage={currentPage} onNavigate={setCurrentPage}>
        <Suspense fallback={<LoadingFallback />}>
          {renderPage()}
        </Suspense>
      </Layout>
    </>
  );
}

function CustomerApp() {
  const { user, loading } = useCustomerAuth();

  if (loading) {
    return <LoadingFallback />;
  }

  if (!user) {
    return (
      <Suspense fallback={<LoadingFallback />}>
        <CustomerLogin />
      </Suspense>
    );
  }

  return (
    <Suspense fallback={<LoadingFallback />}>
      <CustomerDashboard />
    </Suspense>
  );
}

function AppRouter() {
  const [viewMode, setViewMode] = useState<'public' | 'admin' | 'customer' | 'booking'>('public');

  useEffect(() => {
    const path = window.location.pathname;
    if (path.startsWith('/book-visit')) {
      setViewMode('booking');
    } else if (path.startsWith('/customer')) {
      setViewMode('customer');
    } else if (path.startsWith('/admin')) {
      setViewMode('admin');
    } else {
      setViewMode('public');
    }
  }, []);

  const navigateToTracker = () => {
    window.history.pushState({}, '', '/tracker');
    setViewMode('admin');
  };

  const navigateToCustomerLogin = () => {
    window.history.pushState({}, '', '/customer');
    setViewMode('customer');
  };

  const navigateToAdmin = () => {
    window.history.pushState({}, '', '/admin');
    setViewMode('admin');
  };

  const navigateToBooking = () => {
    window.history.pushState({}, '', '/book-visit');
    setViewMode('booking');
  };

  const navigateToPublic = () => {
    window.history.pushState({}, '', '/');
    setViewMode('public');
  };

  // Prevent unused variable warning - this function is available for future use
  void navigateToAdmin;

  if (viewMode === 'booking') {
    return (
      <BrandProvider>
        <PublicBooking onBack={navigateToPublic} />
      </BrandProvider>
    );
  }

  if (viewMode === 'public') {
    return (
      <BrandProvider>
        <PublicHome
          onNavigateToTracker={navigateToTracker}
          onNavigateToCustomerLogin={navigateToCustomerLogin}
          onNavigateToBooking={navigateToBooking}
        />
      </BrandProvider>
    );
  }

  if (viewMode === 'customer') {
    return (
      <BrandProvider>
        <ToastProvider>
          <CustomerAuthProvider>
            <LanguageProvider>
              <CustomerApp />
            </LanguageProvider>
          </CustomerAuthProvider>
        </ToastProvider>
      </BrandProvider>
    );
  }

  return (
    <BrandProvider>
      <ToastProvider>
        <AuthProvider>
          <LanguageProvider>
            <AdminApp />
          </LanguageProvider>
        </AuthProvider>
      </ToastProvider>
    </BrandProvider>
  );
}

function App() {
  return <AppRouter />;
}

export default App;
