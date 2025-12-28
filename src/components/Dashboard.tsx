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
  Activity,
  DollarSign,
  ChevronDown,
  ChevronUp,
  Zap,
  Target,
  MessageSquare,
  Package,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
  Filter
} from 'lucide-react';
import { LoadingSpinner } from './LoadingSpinner';
import { cache, getCacheKey } from '../utils/cacheUtils';
import { getErrorMessage } from '../utils/errorHandling';

interface HeroCardProps {
  label: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  gradient: string;
  change?: {
    value: string;
    positive: boolean;
  };
  subtitle?: string;
}

const HeroCard = memo(({ label, value, icon: Icon, gradient, change, subtitle }: HeroCardProps) => (
  <div className={`relative overflow-hidden rounded-2xl ${gradient} p-6 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1`}>
    <div className="relative z-10">
      <div className="flex items-center justify-between mb-4">
        <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
          <Icon className="w-7 h-7 text-white" />
        </div>
        {change && (
          <div className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm font-semibold ${
            change.positive ? 'bg-white/20' : 'bg-white/20'
          }`}>
            {change.positive ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
            {change.value}
          </div>
        )}
      </div>
      <div className="text-4xl font-bold mb-2">{value}</div>
      <div className="text-white/90 font-medium mb-1">{label}</div>
      {subtitle && <div className="text-white/70 text-sm">{subtitle}</div>}
    </div>
    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16" />
    <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full -ml-12 -mb-12" />
  </div>
));

HeroCard.displayName = 'HeroCard';

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
  <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 hover:shadow-md transition-all duration-200 hover:border-slate-300">
    <div className="flex items-center justify-between mb-3">
      <div className={`w-11 h-11 ${color} rounded-xl flex items-center justify-center shadow-sm`}>
        <Icon className="w-5 h-5 text-white" />
      </div>
      {trend && (
        <div className={`text-xs font-semibold px-2 py-1 rounded-lg ${
          trend.positive ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'
        }`}>
          {trend.value}
        </div>
      )}
    </div>
    <div className="text-2xl font-bold text-slate-800 mb-1">{value}</div>
    <div className="text-sm text-slate-600 font-medium">{label}</div>
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
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    quotes: true,
    orders: true,
    invoices: true,
    visits: false,
    support: false
  });
  const [activityFilter, setActivityFilter] = useState<string>('all');

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

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const heroCards = useMemo(() => {
    if (!stats) return [];

    const revenuePercentage = stats.total_revenue > 0
      ? ((stats.revenue_30d / stats.total_revenue) * 100).toFixed(1)
      : '0.0';

    const outstandingValue = stats.pending_invoices_value + stats.overdue_invoices_value;
    const conversionRate = stats.total_quotes > 0
      ? ((stats.accepted_quotes / stats.total_quotes) * 100).toFixed(1)
      : '0.0';

    return [
      {
        label: t('dashboard.totalRevenue'),
        value: `AED ${stats.total_revenue.toLocaleString()}`,
        icon: DollarSign,
        gradient: 'bg-gradient-to-br from-emerald-500 to-teal-600',
        change: {
          value: `+${revenuePercentage}% ${t('dashboard.thisMonth')}`,
          positive: parseFloat(revenuePercentage) > 0
        },
        subtitle: t('dashboard.allTimePaidInvoices')
      },
      {
        label: t('dashboard.totalRevenue'),
        value: `AED ${stats.total_revenue.toLocaleString()}`,
        icon: TrendingUp,
        gradient: 'bg-gradient-to-br from-blue-500 to-cyan-600',
        change: {
          value: `${revenuePercentage}% ${t('dashboard.ofTotal')}`,
          positive: true
        },
        subtitle: t('dashboard.allTime')
      },
      {
        label: t('dashboard.outstandingInvoices'),
        value: `AED ${outstandingValue.toLocaleString()}`,
        icon: AlertCircle,
        gradient: 'bg-gradient-to-br from-orange-500 to-red-500',
        change: {
          value: `${stats.pending_invoices + stats.overdue_invoices} ${t('dashboard.invoices')}`,
          positive: false
        },
        subtitle: t('dashboard.pendingOverdue')
      },
      {
        label: t('dashboard.quoteConversion'),
        value: `${conversionRate}%`,
        icon: Target,
        gradient: 'bg-gradient-to-br from-slate-600 to-slate-800',
        change: {
          value: `${stats.accepted_quotes}/${stats.total_quotes} ${t('dashboard.accepted')}`,
          positive: parseFloat(conversionRate) > 50
        },
        subtitle: t('dashboard.acceptanceRate')
      }
    ];
  }, [stats]);

  const organizedStats = useMemo(() => {
    if (!stats) return null;

    const totalScheduled = (stats.scheduled_visits || 0) + (stats.scheduled_visits_cap || 0);

    return {
      quotes: [
        {
          label: t('dashboard.totalQuotes'),
          value: stats.total_quotes,
          icon: FileText,
          color: 'bg-slate-600',
          trend: { value: `AED ${stats.total_quotes_value.toLocaleString()}`, positive: true }
        },
        {
          label: t('dashboard.pendingQuotes'),
          value: stats.pending_quotes,
          icon: Clock,
          color: 'bg-amber-500',
          trend: { value: `AED ${stats.pending_quotes_value.toLocaleString()}`, positive: false }
        },
        {
          label: t('dashboard.acceptedQuotes'),
          value: stats.accepted_quotes,
          icon: CheckCircle,
          color: 'bg-emerald-600',
          trend: { value: `AED ${stats.accepted_quotes_value.toLocaleString()}`, positive: true }
        },
        {
          label: t('dashboard.draftQuotes'),
          value: stats.draft_quotes,
          icon: FileText,
          color: 'bg-slate-400',
          trend: { value: t('dashboard.inDraft'), positive: false }
        }
      ],
      orders: [
        {
          label: t('dashboard.totalOrders'),
          value: stats.total_orders,
          icon: ShoppingCart,
          color: 'bg-blue-600',
          trend: { value: `+${stats.new_orders_30d} ${t('dashboard.thisMonth')}`, positive: true }
        },
        {
          label: t('dashboard.inProgress'),
          value: stats.in_progress_orders,
          icon: Activity,
          color: 'bg-cyan-600',
          trend: { value: t('dashboard.active'), positive: true }
        },
        {
          label: t('dashboard.inProduction'),
          value: stats.in_production_orders,
          icon: Package,
          color: 'bg-sky-600',
          trend: { value: t('dashboard.manufacturing'), positive: true }
        },
        {
          label: t('dashboard.completed'),
          value: stats.completed_orders,
          icon: CheckCircle,
          color: 'bg-teal-600',
          trend: { value: t('dashboard.done'), positive: true }
        }
      ],
      invoices: [
        {
          label: 'Total Invoices',
          value: stats.total_invoices,
          icon: FileText,
          color: 'bg-slate-700',
          trend: { value: `AED ${stats.total_invoices_value.toLocaleString()}`, positive: true }
        },
        {
          label: 'Pending',
          value: stats.pending_invoices,
          icon: Clock,
          color: 'bg-amber-600',
          trend: { value: `AED ${stats.pending_invoices_value.toLocaleString()}`, positive: false }
        },
        {
          label: 'Overdue',
          value: stats.overdue_invoices,
          icon: AlertTriangle,
          color: 'bg-red-600',
          trend: { value: `AED ${stats.overdue_invoices_value.toLocaleString()}`, positive: false }
        },
        {
          label: 'Paid',
          value: stats.paid_invoices,
          icon: CheckCircle,
          color: 'bg-emerald-700',
          trend: { value: `AED ${stats.total_revenue.toLocaleString()}`, positive: true }
        }
      ],
      visits: [
        {
          label: 'Total Visits',
          value: stats.total_site_visits,
          icon: Calendar,
          color: 'bg-blue-500',
          trend: { value: 'All time', positive: true }
        },
        {
          label: 'Scheduled',
          value: totalScheduled,
          icon: Clock,
          color: 'bg-sky-500',
          trend: { value: `${stats.upcoming_visits} upcoming`, positive: true }
        },
        {
          label: 'Today',
          value: stats.today_visits,
          icon: Calendar,
          color: 'bg-cyan-600',
          trend: { value: 'Today', positive: true }
        },
        {
          label: 'Completed',
          value: stats.completed_visits,
          icon: CheckCircle,
          color: 'bg-teal-700',
          trend: { value: 'Done', positive: true }
        }
      ],
      support: [
        {
          label: 'Total Tickets',
          value: stats.total_tickets,
          icon: MessageSquare,
          color: 'bg-slate-600',
          trend: { value: 'All time', positive: true }
        },
        {
          label: 'Open Tickets',
          value: stats.open_tickets,
          icon: AlertCircle,
          color: 'bg-orange-600',
          trend: { value: `${stats.high_priority_tickets} high priority`, positive: false }
        },
        {
          label: 'Unread Messages',
          value: stats.unread_messages,
          icon: MessageSquare,
          color: 'bg-blue-500',
          trend: { value: 'From customers', positive: false }
        },
        {
          label: 'Closed Tickets',
          value: stats.closed_tickets,
          icon: CheckCircle,
          color: 'bg-teal-600',
          trend: { value: 'Resolved', positive: true }
        }
      ]
    };
  }, [stats]);

  const insights = useMemo(() => {
    if (!stats) return [];

    const alerts = [];

    if (stats.overdue_invoices > 0) {
      alerts.push({
        type: 'high',
        icon: AlertTriangle,
        title: 'Overdue Invoices',
        description: `${stats.overdue_invoices} invoices totaling AED ${stats.overdue_invoices_value.toLocaleString()} are overdue`,
        color: 'border-red-500 bg-red-50'
      });
    }

    if (stats.pending_quotes > 5) {
      alerts.push({
        type: 'medium',
        icon: Clock,
        title: 'Pending Quotes',
        description: `${stats.pending_quotes} quotes worth AED ${stats.pending_quotes_value.toLocaleString()} need attention`,
        color: 'border-amber-500 bg-amber-50'
      });
    }

    if (stats.open_tickets > stats.total_tickets * 0.3 && stats.open_tickets > 0) {
      alerts.push({
        type: 'medium',
        icon: MessageSquare,
        title: 'Support Backlog',
        description: `${stats.open_tickets} open tickets (${stats.high_priority_tickets} high priority)`,
        color: 'border-orange-500 bg-orange-50'
      });
    }

    if (stats.unread_messages > 10) {
      alerts.push({
        type: 'low',
        icon: MessageSquare,
        title: 'Unread Messages',
        description: `${stats.unread_messages} unread customer messages`,
        color: 'border-blue-500 bg-blue-50'
      });
    }

    if (alerts.length === 0) {
      alerts.push({
        type: 'success',
        icon: CheckCircle,
        title: 'All Clear',
        description: 'Everything is running smoothly',
        color: 'border-emerald-500 bg-emerald-50'
      });
    }

    return alerts;
  }, [stats]);

  const filteredActivity = useMemo(() => {
    if (activityFilter === 'all') return recentActivity;
    return recentActivity.filter(activity => activity.activity_type === activityFilter);
  }, [recentActivity, activityFilter]);

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
      case 'pending': return 'bg-amber-100 text-amber-800';
      case 'approved': case 'paid': case 'completed': return 'bg-emerald-100 text-emerald-800';
      case 'rejected': case 'overdue': return 'bg-red-100 text-red-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      default: return 'bg-slate-100 text-slate-800';
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
          <h3 className="text-lg font-semibold text-gray-900 mb-2">{t('dashboard.failedToLoad')}</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => fetchDashboardData(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            {t('dashboard.tryAgain')}
          </button>
        </div>
      </div>
    );
  }

  if (!stats || !organizedStats) {
    return null;
  }

  return (
    <div className="space-y-8 pb-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-slate-900 mb-2">{t('dashboard.title')}</h1>
          <p className="text-slate-600 text-lg">{t('dashboard.subtitle')}</p>
        </div>
        <button
          onClick={refreshData}
          disabled={refreshing}
          className="flex items-center gap-2 px-5 py-2.5 bg-white border-2 border-slate-300 rounded-xl hover:bg-slate-50 hover:border-slate-400 transition-all font-medium disabled:opacity-50 shadow-sm"
        >
          <RefreshCw className={`h-5 w-5 ${refreshing ? 'animate-spin' : ''}`} />
          {t('common.refreshData')}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {heroCards.map((card, index) => (
          <HeroCard key={index} {...card} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl flex items-center justify-center">
                  <Activity className="h-5 w-5 text-white" />
                </div>
                {t('dashboard.recentActivity')}
              </h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActivityFilter('all')}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    activityFilter === 'all'
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {t('common.all')}
                </button>
                <button
                  onClick={() => setActivityFilter('quote')}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    activityFilter === 'quote'
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {t('nav.quotes')}
                </button>
                <button
                  onClick={() => setActivityFilter('order')}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    activityFilter === 'order'
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {t('nav.orders')}
                </button>
                <button
                  onClick={() => setActivityFilter('invoice')}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    activityFilter === 'invoice'
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {t('nav.invoices')}
                </button>
              </div>
            </div>
            <div className="space-y-2 max-h-[500px] overflow-y-auto">
              {filteredActivity.length === 0 ? (
                <p className="text-slate-500 text-center py-12">{t('dashboard.noActivityFound')}</p>
              ) : (
                filteredActivity.map((activity, index) => {
                  const Icon = getActivityIcon(activity.activity_type);
                  return (
                    <div key={index} className="flex items-center gap-4 p-4 rounded-xl hover:bg-slate-50 transition-all border border-transparent hover:border-slate-200">
                      <div className="w-12 h-12 bg-gradient-to-br from-slate-100 to-slate-200 rounded-xl flex items-center justify-center flex-shrink-0">
                        <Icon className="h-6 w-6 text-slate-700" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-slate-900">{activity.reference_number}</span>
                          <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${getStatusColor(activity.status)}`}>
                            {activity.status}
                          </span>
                        </div>
                        <div className="text-sm text-slate-600">{activity.customer_name}</div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        {activity.amount > 0 && (
                          <div className="font-bold text-slate-900 mb-1">
                            AED {activity.amount.toLocaleString()}
                          </div>
                        )}
                        <div className="text-xs text-slate-500 font-medium">
                          {new Date(activity.created_at).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            <h2 className="text-2xl font-bold text-slate-900 mb-4 flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl flex items-center justify-center">
                <Zap className="h-5 w-5 text-white" />
              </div>
              {t('dashboard.insights')}
            </h2>
            <div className="space-y-3">
              {insights.map((insight, index) => {
                const Icon = insight.icon;
                return (
                  <div key={index} className={`p-4 rounded-xl border-l-4 ${insight.color}`}>
                    <div className="flex items-start gap-3">
                      <Icon className="h-5 w-5 mt-0.5 flex-shrink-0" />
                      <div>
                        <h3 className="font-semibold text-slate-900 mb-1">{insight.title}</h3>
                        <p className="text-sm text-slate-600">{insight.description}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            <h2 className="text-2xl font-bold text-slate-900 mb-4 flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center">
                <Target className="h-5 w-5 text-white" />
              </div>
              {t('dashboard.quickActions')}
            </h2>
            <div className="space-y-3">
              <button className="w-full group p-4 border-2 border-slate-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all text-left">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-500 transition-colors">
                    <FileText className="h-5 w-5 text-blue-600 group-hover:text-white transition-colors" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900 mb-0.5">{t('dashboard.createQuote')}</h3>
                    <p className="text-xs text-slate-600">{t('dashboard.newQuotation')}</p>
                  </div>
                </div>
              </button>
              <button className="w-full group p-4 border-2 border-slate-200 rounded-xl hover:border-cyan-500 hover:bg-cyan-50 transition-all text-left">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-cyan-100 rounded-lg flex items-center justify-center group-hover:bg-cyan-500 transition-colors">
                    <Calendar className="h-5 w-5 text-cyan-600 group-hover:text-white transition-colors" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900 mb-0.5">{t('dashboard.scheduleVisit')}</h3>
                    <p className="text-xs text-slate-600">{t('dashboard.bookSiteVisit')}</p>
                  </div>
                </div>
              </button>
              <button className="w-full group p-4 border-2 border-slate-200 rounded-xl hover:border-emerald-500 hover:bg-emerald-50 transition-all text-left">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center group-hover:bg-emerald-500 transition-colors">
                    <TrendingUp className="h-5 w-5 text-emerald-600 group-hover:text-white transition-colors" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900 mb-0.5">{t('dashboard.createInvoice')}</h3>
                    <p className="text-xs text-slate-600">{t('dashboard.generateInvoice')}</p>
                  </div>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <button
            onClick={() => toggleSection('quotes')}
            className="w-full flex items-center justify-between mb-4 group"
          >
            <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-slate-600 to-slate-800 rounded-xl flex items-center justify-center">
                <FileText className="h-5 w-5 text-white" />
              </div>
              {t('dashboard.quotesOverview')}
            </h2>
            {expandedSections.quotes ? (
              <ChevronUp className="h-6 w-6 text-slate-400 group-hover:text-slate-600 transition-colors" />
            ) : (
              <ChevronDown className="h-6 w-6 text-slate-400 group-hover:text-slate-600 transition-colors" />
            )}
          </button>
          {expandedSections.quotes && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {organizedStats.quotes.map((stat, index) => (
                <StatCard key={index} {...stat} />
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <button
            onClick={() => toggleSection('orders')}
            className="w-full flex items-center justify-between mb-4 group"
          >
            <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-xl flex items-center justify-center">
                <ShoppingCart className="h-5 w-5 text-white" />
              </div>
              {t('dashboard.ordersOverview')}
            </h2>
            {expandedSections.orders ? (
              <ChevronUp className="h-6 w-6 text-slate-400 group-hover:text-slate-600 transition-colors" />
            ) : (
              <ChevronDown className="h-6 w-6 text-slate-400 group-hover:text-slate-600 transition-colors" />
            )}
          </button>
          {expandedSections.orders && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {organizedStats.orders.map((stat, index) => (
                <StatCard key={index} {...stat} />
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <button
            onClick={() => toggleSection('invoices')}
            className="w-full flex items-center justify-between mb-4 group"
          >
            <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-600 to-teal-700 rounded-xl flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-white" />
              </div>
              {t('dashboard.invoicesOverview')}
            </h2>
            {expandedSections.invoices ? (
              <ChevronUp className="h-6 w-6 text-slate-400 group-hover:text-slate-600 transition-colors" />
            ) : (
              <ChevronDown className="h-6 w-6 text-slate-400 group-hover:text-slate-600 transition-colors" />
            )}
          </button>
          {expandedSections.invoices && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {organizedStats.invoices.map((stat, index) => (
                <StatCard key={index} {...stat} />
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <button
            onClick={() => toggleSection('visits')}
            className="w-full flex items-center justify-between mb-4 group"
          >
            <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-sky-500 to-cyan-600 rounded-xl flex items-center justify-center">
                <Calendar className="h-5 w-5 text-white" />
              </div>
              {t('dashboard.siteVisits')}
            </h2>
            {expandedSections.visits ? (
              <ChevronUp className="h-6 w-6 text-slate-400 group-hover:text-slate-600 transition-colors" />
            ) : (
              <ChevronDown className="h-6 w-6 text-slate-400 group-hover:text-slate-600 transition-colors" />
            )}
          </button>
          {expandedSections.visits && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {organizedStats.visits.map((stat, index) => (
                <StatCard key={index} {...stat} />
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <button
            onClick={() => toggleSection('support')}
            className="w-full flex items-center justify-between mb-4 group"
          >
            <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl flex items-center justify-center">
                <MessageSquare className="h-5 w-5 text-white" />
              </div>
              {t('dashboard.supportMessages')}
            </h2>
            {expandedSections.support ? (
              <ChevronUp className="h-6 w-6 text-slate-400 group-hover:text-slate-600 transition-colors" />
            ) : (
              <ChevronDown className="h-6 w-6 text-slate-400 group-hover:text-slate-600 transition-colors" />
            )}
          </button>
          {expandedSections.support && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {organizedStats.support.map((stat, index) => (
                <StatCard key={index} {...stat} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
