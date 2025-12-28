import { useState, useEffect, useMemo, memo } from 'react';
import { supabase } from '../lib/supabase';
import { useLanguage } from '../contexts/LanguageContext';
import {
  Users,
  FileText,
  Calendar,
  ShoppingCart,
  TrendingUp,
  RefreshCw,
  AlertCircle,
  Clock,
  CheckCircle,
  AlertTriangle,
  Activity
} from 'lucide-react';
import { LoadingSpinner } from './LoadingSpinner';
import { cache, getCacheKey } from '../utils/cacheUtils';
import { getErrorMessage } from '../utils/errorHandling';

interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  trend?: {
    value: number | string;
    positive: boolean;
  };
}

const StatCard = memo(({ label, value, icon: Icon, color, trend }: StatCardProps) => (
  <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow">
    <div className="flex items-center justify-between mb-4">
      <div className={`w-12 h-12 ${color} rounded-lg flex items-center justify-center`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
      {trend && (
        <div className={`text-xs font-medium ${trend.positive ? 'text-green-600' : 'text-red-600'}`}>
          {trend.positive ? '+' : ''}{trend.value}
        </div>
      )}
    </div>
    <div className="text-2xl font-bold text-slate-800 mb-1">{value}</div>
    <div className="text-sm text-slate-600">{label}</div>
  </div>
));

StatCard.displayName = 'StatCard';

interface DashboardStats {
  total_customers: number;
  new_customers_30d: number;
  total_quotes: number;
  pending_quotes: number;
  draft_quotes: number;
  accepted_quotes: number;
  rejected_quotes: number;
  new_quotes_30d: number;
  pending_quotes_value: number;
  accepted_quotes_value: number;
  total_quotes_value: number;
  total_invoices: number;
  pending_invoices: number;
  overdue_invoices: number;
  paid_invoices: number;
  partial_invoices: number;
  cancelled_invoices: number;
  pending_invoices_value: number;
  overdue_invoices_value: number;
  total_revenue: number;
  revenue_30d: number;
  partial_revenue: number;
  total_invoices_value: number;
  total_orders: number;
  pending_orders: number;
  in_progress_orders: number;
  in_production_orders: number;
  delivered_orders: number;
  completed_orders: number;
  cancelled_orders: number;
  new_orders_30d: number;
  total_site_visits: number;
  scheduled_visits: number;
  scheduled_visits_cap: number;
  completed_visits: number;
  cancelled_visits: number;
  today_visits: number;
  upcoming_visits: number;
  total_tickets: number;
  open_tickets: number;
  closed_tickets: number;
  high_priority_tickets: number;
  total_messages: number;
  unread_messages: number;
}

interface RecentActivity {
  activity_type: string;
  reference_number: string;
  customer_name: string;
  status: string;
  amount: number;
  created_at: string;
}

export function Dashboard() {
  const { t } = useLanguage();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async (forceRefresh = false) => {
    try {
      setError(null);
      if (forceRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const cacheKeyStats = getCacheKey('dashboard', 'stats');
      const cacheKeyActivity = getCacheKey('dashboard', 'activity');

      if (!forceRefresh) {
        const cachedStats = cache.get<DashboardStats>(cacheKeyStats);
        const cachedActivity = cache.get<RecentActivity[]>(cacheKeyActivity);

        if (cachedStats && cachedActivity) {
          setStats(cachedStats);
          setRecentActivity(cachedActivity);
          setLoading(false);
          return;
        }
      }

      const [statsResult, activityResult] = await Promise.all([
        supabase.from('dashboard_stats').select('*').maybeSingle(),
        supabase.from('recent_activity').select('*').limit(10)
      ]);

      if (statsResult.error) throw statsResult.error;
      if (activityResult.error) throw activityResult.error;

      const statsData = statsResult.data as DashboardStats;
      const activityData = activityResult.data as RecentActivity[];

      cache.set(cacheKeyStats, statsData, 2 * 60 * 1000);
      cache.set(cacheKeyActivity, activityData, 2 * 60 * 1000);

      setStats(statsData);
      setRecentActivity(activityData);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setError(getErrorMessage(error));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const refreshData = async () => {
    await Promise.all([
      supabase.rpc('refresh_dashboard_stats'),
      supabase.rpc('refresh_recent_activity')
    ]);

    await fetchDashboardData(true);
  };

  const statCards = useMemo(() => {
    if (!stats) return [];

    const revenuePercentage = stats.total_revenue > 0
      ? ((stats.revenue_30d / stats.total_revenue) * 100).toFixed(1)
      : '0.0';

    const totalScheduled = (stats.scheduled_visits || 0) + (stats.scheduled_visits_cap || 0);

    return [
      {
        label: 'Total Customers',
        value: stats.total_customers,
        icon: Users,
        color: 'bg-blue-500',
        trend: {
          value: `+${stats.new_customers_30d} this month`,
          positive: stats.new_customers_30d > 0
        }
      },
      {
        label: 'Total Quotes',
        value: stats.total_quotes,
        icon: FileText,
        color: 'bg-slate-500',
        trend: {
          value: `AED ${stats.total_quotes_value.toLocaleString()}`,
          positive: true
        }
      },
      {
        label: 'Draft Quotes',
        value: stats.draft_quotes,
        icon: FileText,
        color: 'bg-gray-500',
        trend: {
          value: 'in draft',
          positive: false
        }
      },
      {
        label: 'Pending Quotes',
        value: stats.pending_quotes,
        icon: FileText,
        color: 'bg-yellow-500',
        trend: {
          value: `AED ${stats.pending_quotes_value.toLocaleString()}`,
          positive: false
        }
      },
      {
        label: 'Accepted Quotes',
        value: stats.accepted_quotes,
        icon: CheckCircle,
        color: 'bg-green-500',
        trend: {
          value: `AED ${stats.accepted_quotes_value.toLocaleString()}`,
          positive: true
        }
      },
      {
        label: 'Rejected Quotes',
        value: stats.rejected_quotes,
        icon: AlertCircle,
        color: 'bg-red-500',
        trend: {
          value: 'rejected',
          positive: false
        }
      },
      {
        label: 'New Quotes (30d)',
        value: stats.new_quotes_30d,
        icon: FileText,
        color: 'bg-cyan-500',
        trend: {
          value: 'this month',
          positive: true
        }
      },
      {
        label: 'Total Orders',
        value: stats.total_orders,
        icon: ShoppingCart,
        color: 'bg-emerald-500',
        trend: {
          value: `${stats.new_orders_30d} new (30d)`,
          positive: true
        }
      },
      {
        label: 'Pending Orders',
        value: stats.pending_orders,
        icon: Clock,
        color: 'bg-orange-400',
        trend: {
          value: 'pending',
          positive: false
        }
      },
      {
        label: 'In Progress Orders',
        value: stats.in_progress_orders,
        icon: Activity,
        color: 'bg-blue-600',
        trend: {
          value: 'in progress',
          positive: true
        }
      },
      {
        label: 'In Production',
        value: stats.in_production_orders,
        icon: Activity,
        color: 'bg-cyan-600',
        trend: {
          value: 'production',
          positive: true
        }
      },
      {
        label: 'Delivered Orders',
        value: stats.delivered_orders,
        icon: CheckCircle,
        color: 'bg-green-600',
        trend: {
          value: 'delivered',
          positive: true
        }
      },
      {
        label: 'Completed Orders',
        value: stats.completed_orders,
        icon: CheckCircle,
        color: 'bg-teal-600',
        trend: {
          value: 'completed',
          positive: true
        }
      },
      {
        label: 'Cancelled Orders',
        value: stats.cancelled_orders,
        icon: AlertTriangle,
        color: 'bg-red-600',
        trend: {
          value: 'cancelled',
          positive: false
        }
      },
      {
        label: 'Total Invoices',
        value: stats.total_invoices,
        icon: TrendingUp,
        color: 'bg-indigo-500',
        trend: {
          value: `AED ${stats.total_invoices_value.toLocaleString()}`,
          positive: true
        }
      },
      {
        label: 'Pending Invoices',
        value: stats.pending_invoices,
        icon: Clock,
        color: 'bg-yellow-600',
        trend: {
          value: `AED ${stats.pending_invoices_value.toLocaleString()}`,
          positive: false
        }
      },
      {
        label: 'Overdue Invoices',
        value: stats.overdue_invoices,
        icon: AlertTriangle,
        color: 'bg-red-500',
        trend: {
          value: `AED ${stats.overdue_invoices_value.toLocaleString()}`,
          positive: false
        }
      },
      {
        label: 'Paid Invoices',
        value: stats.paid_invoices,
        icon: CheckCircle,
        color: 'bg-green-700',
        trend: {
          value: `AED ${stats.total_revenue.toLocaleString()}`,
          positive: true
        }
      },
      {
        label: 'Partial Invoices',
        value: stats.partial_invoices,
        icon: AlertCircle,
        color: 'bg-orange-500',
        trend: {
          value: `AED ${stats.partial_revenue.toLocaleString()}`,
          positive: false
        }
      },
      {
        label: 'Cancelled Invoices',
        value: stats.cancelled_invoices,
        icon: AlertTriangle,
        color: 'bg-gray-600',
        trend: {
          value: 'cancelled',
          positive: false
        }
      },
      {
        label: 'Total Revenue',
        value: `AED ${stats.total_revenue.toLocaleString()}`,
        icon: TrendingUp,
        color: 'bg-[#bb2738]',
        trend: {
          value: 'all time paid',
          positive: true
        }
      },
      {
        label: 'Revenue (30d)',
        value: `AED ${stats.revenue_30d.toLocaleString()}`,
        icon: TrendingUp,
        color: 'bg-rose-600',
        trend: {
          value: `${revenuePercentage}% of total`,
          positive: true
        }
      },
      {
        label: 'Total Site Visits',
        value: stats.total_site_visits,
        icon: Calendar,
        color: 'bg-violet-600',
        trend: {
          value: 'all time',
          positive: true
        }
      },
      {
        label: 'Scheduled Visits',
        value: totalScheduled,
        icon: Calendar,
        color: 'bg-violet-500',
        trend: {
          value: `${stats.upcoming_visits} upcoming`,
          positive: true
        }
      },
      {
        label: 'Visits Today',
        value: stats.today_visits,
        icon: Calendar,
        color: 'bg-purple-500',
        trend: {
          value: 'today',
          positive: true
        }
      },
      {
        label: 'Completed Visits',
        value: stats.completed_visits,
        icon: CheckCircle,
        color: 'bg-green-800',
        trend: {
          value: 'completed',
          positive: true
        }
      },
      {
        label: 'Cancelled Visits',
        value: stats.cancelled_visits,
        icon: AlertTriangle,
        color: 'bg-red-700',
        trend: {
          value: 'cancelled',
          positive: false
        }
      },
      {
        label: 'Total Tickets',
        value: stats.total_tickets,
        icon: AlertCircle,
        color: 'bg-amber-600',
        trend: {
          value: 'all time',
          positive: true
        }
      },
      {
        label: 'Open Tickets',
        value: stats.open_tickets,
        icon: AlertCircle,
        color: 'bg-amber-500',
        trend: {
          value: `${stats.high_priority_tickets} high priority`,
          positive: false
        }
      },
      {
        label: 'Closed Tickets',
        value: stats.closed_tickets,
        icon: CheckCircle,
        color: 'bg-teal-500',
        trend: {
          value: 'closed',
          positive: true
        }
      },
      {
        label: 'Total Messages',
        value: stats.total_messages,
        icon: Activity,
        color: 'bg-sky-600',
        trend: {
          value: 'all time',
          positive: true
        }
      },
      {
        label: 'Unread Messages',
        value: stats.unread_messages,
        icon: Clock,
        color: 'bg-sky-500',
        trend: {
          value: 'from customers',
          positive: false
        }
      },
    ];
  }, [stats]);

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'quote': return FileText;
      case 'invoice': return TrendingUp;
      case 'order': return ShoppingCart;
      default: return Activity;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'approved': case 'paid': case 'completed': return 'bg-green-100 text-green-800';
      case 'rejected': case 'overdue': return 'bg-red-100 text-red-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return <LoadingSpinner size="lg" fullScreen />;
  }

  if (error) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Failed to Load Dashboard</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => fetchDashboardData(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!stats) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 mb-2">{t('nav.dashboard')}</h1>
          <p className="text-slate-600">Welcome to BYLROS Customer Operations Platform</p>
        </div>
        <button
          onClick={refreshData}
          disabled={refreshing}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
        {statCards.map((stat, index) => (
          <StatCard key={index} {...stat} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Recent Activity
          </h2>
          <div className="space-y-3">
            {recentActivity.length === 0 ? (
              <p className="text-slate-500 text-center py-8">No recent activity</p>
            ) : (
              recentActivity.map((activity, index) => {
                const Icon = getActivityIcon(activity.activity_type);
                return (
                  <div key={index} className="flex items-center gap-4 p-3 rounded-lg hover:bg-slate-50 transition-colors">
                    <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Icon className="h-5 w-5 text-slate-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-slate-900">{activity.reference_number}</span>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(activity.status)}`}>
                          {activity.status}
                        </span>
                      </div>
                      <div className="text-sm text-slate-600">{activity.customer_name}</div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      {activity.amount && (
                        <div className="font-semibold text-slate-900">
                          AED {activity.amount.toLocaleString()}
                        </div>
                      )}
                      <div className="text-xs text-slate-500">
                        {new Date(activity.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
            <CheckCircle className="h-5 w-5" />
            Quick Actions
          </h2>
          <div className="space-y-3">
            <button className="w-full p-4 border-2 border-slate-200 rounded-lg hover:border-[#bb2738] hover:bg-slate-50 transition-all text-left">
              <h3 className="font-semibold text-slate-800 mb-1">Create Quote</h3>
              <p className="text-sm text-slate-600">Generate a new quotation</p>
            </button>
            <button className="w-full p-4 border-2 border-slate-200 rounded-lg hover:border-[#bb2738] hover:bg-slate-50 transition-all text-left">
              <h3 className="font-semibold text-slate-800 mb-1">Schedule Visit</h3>
              <p className="text-sm text-slate-600">Book a site visit</p>
            </button>
            <button className="w-full p-4 border-2 border-slate-200 rounded-lg hover:border-[#bb2738] hover:bg-slate-50 transition-all text-left">
              <h3 className="font-semibold text-slate-800 mb-1">Create Invoice</h3>
              <p className="text-sm text-slate-600">Generate an invoice</p>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
