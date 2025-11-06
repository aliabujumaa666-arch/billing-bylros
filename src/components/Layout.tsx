import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useBrand } from '../contexts/BrandContext';
import {
  Building2, Users, FileText, Calendar, ShoppingCart,
  FileCheck, Package, LogOut, Menu, X, Globe, Settings,
  BookOpen, HelpCircle, Video, Ticket, MessageSquare, PackageCheck, HardDrive,
  Workflow, Boxes, CalendarDays, Wrench, Shield
} from 'lucide-react';
import { FeedbackWidget } from './FeedbackWidget';
import { KeyboardShortcuts } from './KeyboardShortcuts';

interface LayoutProps {
  children: React.ReactNode;
  currentPage: string;
  onNavigate: (page: string) => void;
}

export function Layout({ children, currentPage, onNavigate }: LayoutProps) {
  const { signOut } = useAuth();
  const { t, language, setLanguage, isRTL } = useLanguage();
  const { brand } = useBrand();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navigation = [
    { id: 'dashboard', icon: Building2, label: t('nav.dashboard') },
    { id: 'customers', icon: Users, label: t('nav.customers') },
    { id: 'quotes', icon: FileText, label: t('nav.quotes') },
    { id: 'visits', icon: Calendar, label: t('nav.visits') },
    { id: 'orders', icon: ShoppingCart, label: t('nav.orders') },
    { id: 'invoices', icon: FileCheck, label: t('nav.invoices') },
    { id: 'tracker', icon: Package, label: t('nav.tracker') },
    { id: 'production-workflow', icon: Workflow, label: 'Production Workflow' },
    { id: 'inventory', icon: Boxes, label: 'Inventory Management' },
    { id: 'calendar', icon: CalendarDays, label: 'Calendar View' },
    { id: 'installation-tasks', icon: Wrench, label: 'Installation Tasks' },
    { id: 'warranty-feedback', icon: Shield, label: 'Warranty & Feedback' },
    { id: 'portal-settings', icon: Settings, label: 'Portal Settings' },
    { id: 'cache-management', icon: HardDrive, label: 'Clear Cache' },
  ];

  const supportNavigation = [
    { id: 'knowledge-base', icon: BookOpen, label: 'Knowledge Base' },
    { id: 'faq-management', icon: HelpCircle, label: 'FAQs' },
    { id: 'video-tutorials', icon: Video, label: 'Video Tutorials' },
    { id: 'support-tickets', icon: Ticket, label: 'Support Tickets' },
    { id: 'messages', icon: MessageSquare, label: 'Messages' },
    { id: 'whatsapp-messaging', icon: MessageSquare, label: 'WhatsApp' },
    { id: 'feedback-management', icon: MessageSquare, label: 'Feedback' },
    { id: 'changelog-management', icon: PackageCheck, label: 'Changelog' },
    { id: 'email-templates', icon: FileText, label: 'Email Templates' },
  ];

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const shortcuts = [
    { key: 'd', description: 'Go to Dashboard', action: () => onNavigate('dashboard'), ctrlKey: true },
    { key: 'c', description: 'Go to Customers', action: () => onNavigate('customers'), ctrlKey: true },
    { key: 'q', description: 'Go to Quotes', action: () => onNavigate('quotes'), ctrlKey: true },
    { key: 'o', description: 'Go to Orders', action: () => onNavigate('orders'), ctrlKey: true },
    { key: 'i', description: 'Go to Invoices', action: () => onNavigate('invoices'), ctrlKey: true },
    { key: 's', description: 'Go to Site Visits', action: () => onNavigate('visits'), ctrlKey: true },
  ];

  return (
    <div className="min-h-screen bg-slate-50" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-0 left-0 right-0 bg-white border-b border-slate-200 z-40">
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
        fixed top-0 ${isRTL ? 'right-0' : 'left-0'} h-full bg-white border-${isRTL ? 'l' : 'r'} border-slate-200 z-50
        w-64 transform transition-transform duration-200 ease-in-out flex flex-col
        ${sidebarOpen ? 'translate-x-0' : isRTL ? 'translate-x-full lg:translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="p-6 border-b border-slate-200 flex-shrink-0">
          <div className="flex flex-col items-center">
            <img
              src={brand?.logos.primary || '/Untitled-design-3.png'}
              alt={`${brand?.company.name || 'BYLROS'} Logo`}
              className="h-14 w-auto mb-2"
            />
            <p className="text-xs text-slate-600 font-medium">Admin Portal</p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          <nav className="p-4 space-y-1">
            {navigation.map((item) => {
              const Icon = item.icon;
              const isActive = currentPage === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onNavigate(item.id);
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
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 px-4">Documentation & Support</p>
            <div className="space-y-1">
              {supportNavigation.map((item) => {
                const Icon = item.icon;
                const isActive = currentPage === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      onNavigate(item.id);
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

        <div className="border-t border-slate-200 p-4 space-y-2 flex-shrink-0 bg-white">
          <div className="flex items-center gap-2 px-4 py-2">
            <Globe className="w-5 h-5 text-slate-600 flex-shrink-0" />
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value as 'en' | 'ar' | 'zh')}
              className="flex-1 border border-slate-300 rounded-lg px-2 py-1 text-sm outline-none focus:ring-2 focus:ring-[#bb2738]"
            >
              <option value="en">English</option>
              <option value="ar">العربية</option>
              <option value="zh">中文</option>
            </select>
          </div>
          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium">{t('auth.signOut')}</span>
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className={`pt-20 lg:pt-8 ${isRTL ? 'lg:mr-64' : 'lg:ml-64'}`}>
        <div className="p-6 lg:p-8">
          {children}
        </div>
      </main>

      {/* Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      <FeedbackWidget userType="admin" />
      <KeyboardShortcuts shortcuts={shortcuts} />
    </div>
  );
}
