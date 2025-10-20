import { useEffect, useState } from 'react';
import { useCustomerAuth } from '../../contexts/CustomerAuthContext';
import { supabase } from '../../lib/supabase';
import { Calendar, MapPin, Clock } from 'lucide-react';

export function CustomerSiteVisits() {
  const { customerData } = useCustomerAuth();
  const [visits, setVisits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (customerData) {
      fetchVisits();
    }
  }, [customerData]);

  const fetchVisits = async () => {
    if (!customerData) return;

    const { data, error } = await supabase
      .from('site_visits')
      .select('*')
      .eq('customer_id', customerData.customer_id)
      .order('visit_date', { ascending: false });

    if (error) {
      console.error('Error fetching visits:', error);
      return;
    }

    setVisits(data || []);
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#bb2738]"></div>
      </div>
    );
  }

  if (visits.length === 0) {
    return (
      <div className="bg-white rounded-xl p-12 text-center border border-slate-200">
        <Calendar className="w-16 h-16 text-slate-300 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-slate-800 mb-2">No Site Visits Scheduled</h3>
        <p className="text-slate-600">You don't have any scheduled site visits yet.</p>
      </div>
    );
  }

  const upcomingVisits = visits.filter(v => new Date(v.visit_date) >= new Date() && v.status !== 'Cancelled');
  const pastVisits = visits.filter(v => new Date(v.visit_date) < new Date() || v.status === 'Cancelled' || v.status === 'Completed');

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-800 mb-2">Site Visits</h2>
        <p className="text-slate-600">View your scheduled and past site visits</p>
      </div>

      {upcomingVisits.length > 0 && (
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">Upcoming Visits</h3>
          <div className="space-y-4">
            {upcomingVisits.map((visit) => (
              <div key={visit.id} className="bg-white rounded-xl p-6 border-2 border-blue-200 hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Calendar className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="text-lg font-semibold text-slate-800 mb-2">
                        {new Date(visit.visit_date).toLocaleDateString('en-US', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </h4>
                      <div className="flex items-center gap-2 text-sm text-slate-600 mb-2">
                        <Clock className="w-4 h-4" />
                        {new Date(visit.visit_date).toLocaleTimeString('en-US', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <MapPin className="w-4 h-4" />
                        {visit.location}
                      </div>
                    </div>
                  </div>
                  <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                    {visit.status}
                  </span>
                </div>

                {visit.remarks && (
                  <div className="p-3 bg-slate-50 rounded-lg mb-4">
                    <p className="text-sm font-medium text-slate-700 mb-1">Remarks:</p>
                    <p className="text-sm text-slate-600">{visit.remarks}</p>
                  </div>
                )}

                {visit.payment_required && (
                  <div className="flex items-center justify-between p-3 bg-amber-50 rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-amber-900">Payment Required</p>
                      <p className="text-xs text-amber-700">AED {Number(visit.payment_amount).toLocaleString()}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      visit.payment_status === 'Paid' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {visit.payment_status}
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {pastVisits.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-slate-800 mb-4">Past Visits</h3>
          <div className="space-y-4">
            {pastVisits.map((visit) => (
              <div key={visit.id} className="bg-white rounded-xl p-6 border border-slate-200 hover:shadow-lg transition-shadow opacity-75">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center">
                      <Calendar className="w-6 h-6 text-slate-600" />
                    </div>
                    <div>
                      <h4 className="text-lg font-semibold text-slate-800 mb-2">
                        {new Date(visit.visit_date).toLocaleDateString('en-US', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </h4>
                      <div className="flex items-center gap-2 text-sm text-slate-600 mb-2">
                        <Clock className="w-4 h-4" />
                        {new Date(visit.visit_date).toLocaleTimeString('en-US', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <MapPin className="w-4 h-4" />
                        {visit.location}
                      </div>
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    visit.status === 'Completed' ? 'bg-green-100 text-green-700' :
                    visit.status === 'Cancelled' ? 'bg-red-100 text-red-700' :
                    'bg-slate-100 text-slate-700'
                  }`}>
                    {visit.status}
                  </span>
                </div>

                {visit.remarks && (
                  <div className="p-3 bg-slate-50 rounded-lg">
                    <p className="text-sm font-medium text-slate-700 mb-1">Remarks:</p>
                    <p className="text-sm text-slate-600">{visit.remarks}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
