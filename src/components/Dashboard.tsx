import { useState, useEffect, useMemo, memo } from 'react';
import { supabase } from '../lib/supabase';
import { useLanguage } from '../contexts/LanguageContext';
import { Users, FileText, Calendar, ShoppingCart, TrendingUp } from 'lucide-react';
import { LoadingSpinner } from './LoadingSpinner';

interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}

const StatCard = memo(({ label, value, icon: Icon, color }: StatCardProps) => (
  <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow">
    <div className="flex items-center justify-between mb-4">
      <div className={`w-12 h-12 ${color} rounded-lg flex items-center justify-center`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
    </div>
    <div className="text-2xl font-bold text-slate-800 mb-1">{value}</div>
    <div className="text-sm text-slate-600">{label}</div>
  </div>
));

StatCard.displayName = 'StatCard';

export function Dashboard() {
  const { t } = useLanguage();
  const [stats, setStats] = useState({
    customers: 0,
    quotes: 0,
    visits: 0,
    orders: 0,
    revenue: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const [customersData, quotesData, visitsData, ordersData, invoicesData] = await Promise.all([
        supabase.from('customers').select('id', { count: 'exact', head: true }),
        supabase.from('quotes').select('id', { count: 'exact', head: true }),
        supabase.from('site_visits').select('id', { count: 'exact', head: true }),
        supabase.from('orders').select('id', { count: 'exact', head: true }),
        supabase.from('invoices').select('total_amount'),
      ]);

      const revenue = invoicesData.data?.reduce((sum, inv) => sum + Number(inv.total_amount), 0) || 0;

      setStats({
        customers: customersData.count || 0,
        quotes: quotesData.count || 0,
        visits: visitsData.count || 0,
        orders: ordersData.count || 0,
        revenue,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = useMemo(() => [
    { label: 'Total Customers', value: stats.customers, icon: Users, color: 'bg-blue-500' },
    { label: 'Active Quotes', value: stats.quotes, icon: FileText, color: 'bg-yellow-500' },
    { label: 'Site Visits', value: stats.visits, icon: Calendar, color: 'bg-purple-500' },
    { label: 'Orders', value: stats.orders, icon: ShoppingCart, color: 'bg-green-500' },
    { label: 'Total Revenue', value: `AED ${stats.revenue.toLocaleString()}`, icon: TrendingUp, color: 'bg-[#bb2738]' },
  ], [stats]);

  if (loading) {
    return <LoadingSpinner size="lg" fullScreen />;
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-800 mb-2">{t('nav.dashboard')}</h1>
        <p className="text-slate-600">Welcome to BYLROS Customer Operations Platform</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
        {statCards.map((stat, index) => (
          <StatCard key={index} {...stat} />
        ))}
      </div>

      <div className="mt-8 bg-white rounded-xl shadow-sm border border-slate-200 p-8">
        <h2 className="text-xl font-bold text-slate-800 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button className="p-4 border-2 border-slate-200 rounded-lg hover:border-[#bb2738] hover:bg-slate-50 transition-all text-left">
            <h3 className="font-semibold text-slate-800 mb-1">Create Quote</h3>
            <p className="text-sm text-slate-600">Generate a new quotation for a customer</p>
          </button>
          <button className="p-4 border-2 border-slate-200 rounded-lg hover:border-[#bb2738] hover:bg-slate-50 transition-all text-left">
            <h3 className="font-semibold text-slate-800 mb-1">Schedule Visit</h3>
            <p className="text-sm text-slate-600">Book a site visit with a customer</p>
          </button>
          <button className="p-4 border-2 border-slate-200 rounded-lg hover:border-[#bb2738] hover:bg-slate-50 transition-all text-left">
            <h3 className="font-semibold text-slate-800 mb-1">Create Invoice</h3>
            <p className="text-sm text-slate-600">Generate invoice for an order</p>
          </button>
        </div>
      </div>
    </div>
  );
}
