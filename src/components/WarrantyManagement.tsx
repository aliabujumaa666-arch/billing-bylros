import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Shield, AlertCircle, Star, Download } from 'lucide-react';
import { exportWarrantyToPDF } from '../utils/exportUtils';
import { useBrand } from '../contexts/BrandContext';

interface Warranty {
  id: string;
  warranty_number: string;
  product_name: string;
  start_date: string;
  end_date: string;
  status: string;
  orders?: { order_number: string; customer_name: string } | null;
}

interface Feedback {
  id: string;
  overall_rating: number;
  comments: string;
  orders: { order_number: string; customer_name: string };
  submitted_at: string;
  quality_rating: number;
  timeliness_rating: number;
  professionalism_rating: number;
}

export function WarrantyManagement() {
  const { brand } = useBrand();
  const [warranties, setWarranties] = useState<Warranty[]>([]);
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'warranties' | 'feedback'>('warranties');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const { data: warrantyData, error: warrantyError } = await supabase
        .from('warranties')
        .select(`
          *,
          orders(
            order_number,
            customers(name)
          )
        `)
        .order('created_at', { ascending: false });

      if (warrantyError) {
        console.error('Error loading warranties:', warrantyError);
      }

      const { data: feedbackData, error: feedbackError } = await supabase
        .from('installation_feedback')
        .select(`
          *,
          orders!inner(
            order_number,
            customers(name)
          )
        `)
        .order('submitted_at', { ascending: false });

      if (feedbackError) {
        console.error('Error loading feedback:', feedbackError);
      }

      const formattedWarranties = (warrantyData || []).map(w => ({
        ...w,
        orders: w.orders ? {
          order_number: w.orders.order_number,
          customer_name: w.orders.customers?.name || 'Unknown Customer'
        } : null
      }));

      const formattedFeedback = (feedbackData || []).map(f => ({
        ...f,
        orders: {
          order_number: f.orders.order_number,
          customer_name: f.orders.customers?.name || 'Unknown Customer'
        }
      }));

      setWarranties(formattedWarranties);
      setFeedbacks(formattedFeedback);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-700';
      case 'expired': return 'bg-red-100 text-red-700';
      case 'claimed': return 'bg-yellow-100 text-yellow-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  const renderStars = (rating: number) => {
    return [...Array(5)].map((_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${i < rating ? 'text-yellow-400 fill-yellow-400' : 'text-slate-300'}`}
      />
    ));
  };

  const handleDownloadPDF = async (warranty: Warranty) => {
    await exportWarrantyToPDF(warranty, warranty.orders, brand);
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#bb2738]"></div></div>;
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-slate-800">Warranty & Feedback Management</h2>

      <div className="flex gap-2 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('warranties')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'warranties'
              ? 'text-[#bb2738] border-b-2 border-[#bb2738]'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Shield className="w-4 h-4 inline mr-2" />
          Warranties ({warranties.length})
        </button>
        <button
          onClick={() => setActiveTab('feedback')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'feedback'
              ? 'text-[#bb2738] border-b-2 border-[#bb2738]'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Star className="w-4 h-4 inline mr-2" />
          Customer Feedback ({feedbacks.length})
        </button>
      </div>

      {activeTab === 'warranties' && (
        <div className="grid gap-4">
          {warranties.map((warranty) => {
            const daysUntilExpiry = Math.ceil(
              (new Date(warranty.end_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
            );
            const isExpiringSoon = daysUntilExpiry > 0 && daysUntilExpiry <= 30;

            return (
              <div key={warranty.id} className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900">{warranty.product_name}</h3>
                    {warranty.orders && (
                      <p className="text-sm text-slate-600">
                        {warranty.orders.order_number} - {warranty.orders.customer_name}
                      </p>
                    )}
                    <p className="text-sm text-slate-600 mt-1">Warranty #: {warranty.warranty_number}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(warranty.status)}`}>
                    {warranty.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-slate-500">Start Date</p>
                    <p className="text-sm font-medium text-slate-900">
                      {new Date(warranty.start_date).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">End Date</p>
                    <p className="text-sm font-medium text-slate-900">
                      {new Date(warranty.end_date).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                {isExpiringSoon && warranty.status === 'active' && (
                  <div className="mt-4 flex items-center gap-2 text-sm text-orange-600 bg-orange-50 p-3 rounded-lg">
                    <AlertCircle className="w-4 h-4" />
                    Expires in {daysUntilExpiry} days
                  </div>
                )}

                <div className="mt-4 flex justify-end">
                  <button
                    onClick={() => handleDownloadPDF(warranty)}
                    className="inline-flex items-center gap-2 px-4 py-2 text-sm text-green-700 hover:bg-green-50 rounded-lg transition-colors font-medium"
                  >
                    <Download className="w-4 h-4" />
                    Download Certificate
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {activeTab === 'feedback' && (
        <div className="grid gap-4">
          {feedbacks.map((feedback) => {
            const avgRating = (
              feedback.overall_rating +
              feedback.quality_rating +
              feedback.timeliness_rating +
              feedback.professionalism_rating
            ) / 4;

            return (
              <div key={feedback.id} className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900">{feedback.orders.customer_name}</h3>
                    <p className="text-sm text-slate-600">{feedback.orders.order_number}</p>
                    <p className="text-xs text-slate-500 mt-1">
                      {new Date(feedback.submitted_at).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex flex-col items-end">
                    <div className="flex gap-1 mb-1">{renderStars(Math.round(avgRating))}</div>
                    <span className="text-sm font-medium text-slate-900">{avgRating.toFixed(1)}/5</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Quality</p>
                    <div className="flex gap-1">{renderStars(feedback.quality_rating)}</div>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Timeliness</p>
                    <div className="flex gap-1">{renderStars(feedback.timeliness_rating)}</div>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Professionalism</p>
                    <div className="flex gap-1">{renderStars(feedback.professionalism_rating)}</div>
                  </div>
                </div>

                {feedback.comments && (
                  <div className="bg-slate-50 rounded-lg p-4">
                    <p className="text-sm text-slate-700">{feedback.comments}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
