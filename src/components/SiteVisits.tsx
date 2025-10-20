import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Calendar, Plus, X } from 'lucide-react';

export function SiteVisits() {
  const [visits, setVisits] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [quotes, setQuotes] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    customer_id: '',
    quote_id: '',
    visit_date: '',
    location: '',
    remarks: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const [visitsData, customersData, quotesData] = await Promise.all([
      supabase.from('site_visits').select('*, customers(*), quotes(*)').order('visit_date', { ascending: false }),
      supabase.from('customers').select('*').order('name'),
      supabase.from('quotes').select('*').order('created_at', { ascending: false }),
    ]);
    setVisits(visitsData.data || []);
    setCustomers(customersData.data || []);
    setQuotes(quotesData.data || []);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const visitData = {
      ...formData,
      quote_id: formData.quote_id || null,
    };
    await supabase.from('site_visits').insert([visitData]);
    setShowModal(false);
    setFormData({ customer_id: '', quote_id: '', visit_date: '', location: '', remarks: '' });
    fetchData();
  };

  const filteredQuotes = quotes.filter(q => q.customer_id === formData.customer_id);

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-slate-800">Site Visits</h1>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-[#bb2738] hover:bg-[#a01f2f] text-white px-4 py-2.5 rounded-lg"
        >
          <Plus className="w-5 h-5" />
          Schedule Visit
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {visits.length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500">No site visits scheduled</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-200">
            {visits.map((visit) => (
              <div key={visit.id} className="p-6 hover:bg-slate-50">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-slate-800">{visit.customers?.name}</h3>
                    {visit.quotes && (
                      <p className="text-xs text-slate-500 mt-0.5">Quote: {visit.quotes.quote_number}</p>
                    )}
                    <p className="text-sm text-slate-600 mt-1">{visit.location}</p>
                    <p className="text-sm text-slate-500 mt-2">
                      {new Date(visit.visit_date).toLocaleString()}
                    </p>
                  </div>
                  <span className="px-3 py-1 bg-purple-100 text-purple-800 text-sm rounded-full">
                    {visit.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
            <div className="flex justify-between items-center p-6 border-b">
              <h2 className="text-xl font-bold">Schedule Site Visit</h2>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-slate-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Customer</label>
                <select
                  value={formData.customer_id}
                  onChange={(e) => setFormData({ ...formData, customer_id: e.target.value, quote_id: '' })}
                  required
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-[#bb2738]"
                >
                  <option value="">Select Customer</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Related Quote (Optional)</label>
                <select
                  value={formData.quote_id}
                  onChange={(e) => setFormData({ ...formData, quote_id: e.target.value })}
                  disabled={!formData.customer_id}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-[#bb2738] disabled:bg-slate-100"
                >
                  <option value="">None</option>
                  {filteredQuotes.map((q) => (
                    <option key={q.id} value={q.id}>{q.quote_number}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Visit Date & Time</label>
                <input
                  type="datetime-local"
                  value={formData.visit_date}
                  onChange={(e) => setFormData({ ...formData, visit_date: e.target.value })}
                  required
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-[#bb2738]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Location</label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  required
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-[#bb2738]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Remarks</label>
                <textarea
                  value={formData.remarks}
                  onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-[#bb2738]"
                />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-6 py-2.5 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-[#bb2738] hover:bg-[#a01f2f] text-white rounded-lg"
                >
                  Schedule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
