import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import {
  Calendar, Plus, X, Edit2, Trash2, DollarSign, Link as LinkIcon,
  Copy, CheckCircle, Loader2, AlertCircle, Share2, Download, Upload, Image, Camera
} from 'lucide-react';
import { exportSiteVisitToPDF } from '../utils/exportUtils';
import { useBrand } from '../contexts/BrandContext';

interface SiteVisitPhoto {
  id: string;
  photo_type: string;
  storage_path: string;
  file_name: string;
  uploaded_by: string | null;
  uploaded_by_name: string | null;
  caption: string | null;
  created_at: string;
  photoUrl?: string;
}

export function SiteVisits() {
  const { brand } = useBrand();
  const [visits, setVisits] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [quotes, setQuotes] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showShareLinkModal, setShowShareLinkModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showPhotosModal, setShowPhotosModal] = useState(false);
  const [showWorkerLinkModal, setShowWorkerLinkModal] = useState(false);
  const [selectedVisit, setSelectedVisit] = useState<any>(null);
  const [paymentLink, setPaymentLink] = useState('');
  const [workerLink, setWorkerLink] = useState('');
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);
  const [loadingPhotos, setLoadingPhotos] = useState(false);
  const [visitPhotos, setVisitPhotos] = useState<SiteVisitPhoto[]>([]);
  const [photoFiles, setPhotoFiles] = useState<File[]>([]);
  const [photoType, setPhotoType] = useState('before');
  const [photoCaption, setPhotoCaption] = useState('');
  const [formData, setFormData] = useState({
    customer_id: '',
    quote_id: '',
    visit_date: '',
    location: '',
    remarks: '',
    payment_required: false,
    payment_amount: 300.00,
  });
  const [paymentData, setPaymentData] = useState({
    amount: 0,
    payment_method: 'Cash',
    payment_date: new Date().toISOString().split('T')[0],
    transaction_reference: '',
    payment_notes: '',
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
      payment_status: formData.payment_required ? 'Unpaid' : 'Paid',
    };
    await supabase.from('site_visits').insert([visitData]);
    setShowModal(false);
    setFormData({
      customer_id: '',
      quote_id: '',
      visit_date: '',
      location: '',
      remarks: '',
      payment_required: false,
      payment_amount: 300.00,
    });
    fetchData();
  };

  const handleEdit = (visit: any) => {
    setSelectedVisit(visit);
    setFormData({
      customer_id: visit.customer_id,
      quote_id: visit.quote_id || '',
      visit_date: visit.visit_date.slice(0, 16),
      location: visit.location,
      remarks: visit.remarks || '',
      payment_required: visit.payment_required || false,
      payment_amount: visit.payment_amount || 300.00,
    });
    setShowEditModal(true);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase
      .from('site_visits')
      .update({
        customer_id: formData.customer_id,
        quote_id: formData.quote_id || null,
        visit_date: formData.visit_date,
        location: formData.location,
        remarks: formData.remarks,
        payment_required: formData.payment_required,
        payment_amount: formData.payment_amount,
      })
      .eq('id', selectedVisit.id);

    if (!error) {
      setShowEditModal(false);
      setSelectedVisit(null);
      fetchData();
    }
  };

  const handleDelete = async () => {
    if (!selectedVisit) return;

    const { error } = await supabase
      .from('site_visits')
      .delete()
      .eq('id', selectedVisit.id);

    if (!error) {
      setShowDeleteModal(false);
      setSelectedVisit(null);
      fetchData();
    }
  };

  const handleManualPayment = (visit: any) => {
    setSelectedVisit(visit);
    setPaymentData({
      amount: visit.payment_amount || 0,
      payment_method: 'Cash',
      payment_date: new Date().toISOString().split('T')[0],
      transaction_reference: '',
      payment_notes: '',
    });
    setShowPaymentModal(true);
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase
      .from('site_visits')
      .update({
        payment_status: 'Paid',
        payment_method: paymentData.payment_method,
        payment_date: paymentData.payment_date,
        payment_transaction_reference: paymentData.transaction_reference,
        payment_notes: paymentData.payment_notes,
      })
      .eq('id', selectedVisit.id);

    setLoading(false);

    if (!error) {
      setShowPaymentModal(false);
      setSelectedVisit(null);
      fetchData();
    }
  };

  const generatePaymentLink = async (visit: any) => {
    setLoading(true);
    setSelectedVisit(visit);

    const token = crypto.randomUUID();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const { error } = await supabase
      .from('site_visits')
      .update({
        payment_link_token: token,
        payment_link_generated_at: new Date().toISOString(),
        payment_link_expires_at: expiresAt.toISOString(),
      })
      .eq('id', visit.id);

    setLoading(false);

    if (!error) {
      const link = `${window.location.origin}/site-visit-payment?token=${token}`;
      setPaymentLink(link);
      setShowShareLinkModal(true);
      fetchData();
    }
  };

  const handleDownloadPDF = async (visit: any) => {
    await exportSiteVisitToPDF(visit, visit.customers, brand);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getPhotoUrl = async (path: string) => {
    const { data, error } = await supabase.storage
      .from('uploads')
      .createSignedUrl(path, 3600);

    if (error) {
      console.error('Error creating signed URL:', error);
      return '';
    }

    return data.signedUrl;
  };

  const handleUploadPhotos = (visit: any) => {
    setSelectedVisit(visit);
    setPhotoFiles([]);
    setPhotoType('before');
    setPhotoCaption('');
    setShowUploadModal(true);
  };

  const handlePhotoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setPhotoFiles(Array.from(e.target.files));
    }
  };

  const handlePhotoUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVisit || photoFiles.length === 0) return;

    setUploadingPhotos(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();

      for (const file of photoFiles) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${selectedVisit.id}-${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `site-visit-photos/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('uploads')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { error: dbError } = await supabase
          .from('site_visit_photos')
          .insert({
            site_visit_id: selectedVisit.id,
            photo_type: photoType,
            storage_path: filePath,
            file_name: file.name,
            uploaded_by: user?.id,
            caption: photoCaption || null,
          });

        if (dbError) throw dbError;
      }

      setShowUploadModal(false);
      setPhotoFiles([]);
      setPhotoType('before');
      setPhotoCaption('');
      alert('Photos uploaded successfully!');
    } catch (error) {
      console.error('Error uploading photos:', error);
      alert('Failed to upload photos');
    } finally {
      setUploadingPhotos(false);
    }
  };

  const handleViewPhotos = async (visit: any) => {
    setSelectedVisit(visit);
    setShowPhotosModal(true);
    setLoadingPhotos(true);

    try {
      const { data, error } = await supabase
        .from('site_visit_photos')
        .select('*')
        .eq('site_visit_id', visit.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const photosWithUrls = await Promise.all(
        (data || []).map(async (photo) => ({
          ...photo,
          photoUrl: await getPhotoUrl(photo.storage_path)
        }))
      );

      setVisitPhotos(photosWithUrls);
    } catch (error) {
      console.error('Error loading photos:', error);
      alert('Failed to load photos');
    } finally {
      setLoadingPhotos(false);
    }
  };

  const handleDownloadPhoto = async (photo: SiteVisitPhoto) => {
    try {
      const { data, error } = await supabase.storage
        .from('uploads')
        .download(photo.storage_path);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = photo.file_name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading photo:', error);
      alert('Failed to download photo');
    }
  };

  const handleGenerateWorkerLink = async (visit: any) => {
    setLoading(true);
    setSelectedVisit(visit);

    try {
      const linkToken = crypto.randomUUID();

      const { error } = await supabase
        .from('site_visit_worker_links')
        .insert({
          site_visit_id: visit.id,
          link_token: linkToken,
          is_active: true,
        });

      if (error) throw error;

      const link = `${window.location.origin}/worker-upload?token=${linkToken}&type=site_visit`;
      setWorkerLink(link);
      setShowWorkerLinkModal(true);
    } catch (error) {
      console.error('Error generating worker link:', error);
      alert('Failed to generate worker link');
    } finally {
      setLoading(false);
    }
  };

  const filteredQuotes = quotes.filter(q => q.customer_id === formData.customer_id);

  const getPaymentStatusBadge = (visit: any) => {
    if (!visit.payment_required) {
      return <span className="px-3 py-1 bg-slate-100 text-slate-600 text-xs rounded-full">No Payment</span>;
    }

    switch (visit.payment_status) {
      case 'Paid':
        return (
          <span className="px-3 py-1 bg-green-100 text-green-800 text-xs rounded-full flex items-center gap-1">
            <CheckCircle className="w-3 h-3" />
            Paid {visit.payment_method && `(${visit.payment_method})`}
          </span>
        );
      case 'Unpaid':
        return <span className="px-3 py-1 bg-red-100 text-red-800 text-xs rounded-full">Unpaid</span>;
      default:
        return <span className="px-3 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">Pending</span>;
    }
  };

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
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-slate-800">{visit.customers?.name}</h3>
                      <span className={`px-3 py-1 text-xs rounded-full ${
                        visit.status === 'Scheduled' ? 'bg-blue-100 text-blue-800' :
                        visit.status === 'Completed' ? 'bg-green-100 text-green-800' :
                        'bg-slate-100 text-slate-800'
                      }`}>
                        {visit.status}
                      </span>
                      {getPaymentStatusBadge(visit)}
                    </div>
                    {visit.quotes && (
                      <p className="text-xs text-slate-500 mb-1">Quote: {visit.quotes.quote_number}</p>
                    )}
                    <p className="text-sm text-slate-600 mb-1">{visit.location}</p>
                    <p className="text-sm text-slate-500">
                      {new Date(visit.visit_date).toLocaleString()}
                    </p>
                    {visit.payment_required && (
                      <p className="text-sm font-semibold text-slate-800 mt-2">
                        Payment Amount: AED {visit.payment_amount?.toFixed(2)}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleUploadPhotos(visit)}
                      className="p-2 text-teal-600 hover:bg-teal-50 rounded-lg transition-colors"
                      title="Upload Photos"
                    >
                      <Upload className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleViewPhotos(visit)}
                      className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                      title="View Photos"
                    >
                      <Image className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleGenerateWorkerLink(visit)}
                      disabled={loading && selectedVisit?.id === visit.id}
                      className="p-2 text-orange-600 hover:bg-orange-50 rounded-lg transition-colors disabled:opacity-50"
                      title="Generate Worker Link"
                    >
                      {loading && selectedVisit?.id === visit.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Camera className="w-4 h-4" />
                      )}
                    </button>
                    <button
                      onClick={() => handleDownloadPDF(visit)}
                      className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                      title="Download PDF"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleEdit(visit)}
                      className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                      title="Edit Visit"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        setSelectedVisit(visit);
                        setShowDeleteModal(true);
                      }}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete Visit"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    {visit.payment_required && visit.payment_status === 'Unpaid' && (
                      <>
                        <button
                          onClick={() => handleManualPayment(visit)}
                          className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                          title="Record Manual Payment"
                        >
                          <DollarSign className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => generatePaymentLink(visit)}
                          disabled={loading}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50"
                          title="Share Payment Link"
                        >
                          {loading && selectedVisit?.id === visit.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Share2 className="w-4 h-4" />
                          )}
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b sticky top-0 bg-white">
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
              <div className="border-t pt-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.payment_required}
                    onChange={(e) => setFormData({ ...formData, payment_required: e.target.checked })}
                    className="w-4 h-4 text-[#bb2738] rounded focus:ring-[#bb2738]"
                  />
                  <span className="text-sm font-medium text-slate-700">Payment Required</span>
                </label>
              </div>
              {formData.payment_required && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Payment Amount (AED)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.payment_amount}
                    onChange={(e) => setFormData({ ...formData, payment_amount: parseFloat(e.target.value) })}
                    required
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-[#bb2738]"
                  />
                </div>
              )}
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

      {showEditModal && selectedVisit && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b sticky top-0 bg-white">
              <h2 className="text-xl font-bold">Edit Site Visit</h2>
              <button onClick={() => setShowEditModal(false)} className="p-2 hover:bg-slate-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleUpdate} className="p-6 space-y-4">
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
              <div className="border-t pt-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.payment_required}
                    onChange={(e) => setFormData({ ...formData, payment_required: e.target.checked })}
                    className="w-4 h-4 text-[#bb2738] rounded focus:ring-[#bb2738]"
                  />
                  <span className="text-sm font-medium text-slate-700">Payment Required</span>
                </label>
              </div>
              {formData.payment_required && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Payment Amount (AED)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.payment_amount}
                    onChange={(e) => setFormData({ ...formData, payment_amount: parseFloat(e.target.value) })}
                    required
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-[#bb2738]"
                  />
                </div>
              )}
              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-6 py-2.5 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-[#bb2738] hover:bg-[#a01f2f] text-white rounded-lg"
                >
                  Update
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showDeleteModal && selectedVisit && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-start gap-4 mb-6">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                <AlertCircle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900 mb-2">Delete Site Visit</h2>
                <p className="text-slate-600">
                  Are you sure you want to delete this site visit? This action cannot be undone.
                </p>
                <div className="mt-3 p-3 bg-slate-50 rounded-lg">
                  <p className="text-sm font-medium text-slate-900">{selectedVisit.customers?.name}</p>
                  <p className="text-sm text-slate-600">{selectedVisit.location}</p>
                  <p className="text-xs text-slate-500 mt-1">
                    {new Date(selectedVisit.visit_date).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setSelectedVisit(null);
                }}
                className="px-6 py-2.5 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {showPaymentModal && selectedVisit && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
            <div className="flex justify-between items-center p-6 border-b">
              <h2 className="text-xl font-bold">Record Manual Payment</h2>
              <button onClick={() => setShowPaymentModal(false)} className="p-2 hover:bg-slate-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleRecordPayment} className="p-6 space-y-4">
              <div className="bg-slate-50 rounded-lg p-4 mb-4">
                <p className="text-sm text-slate-600 mb-1">Customer</p>
                <p className="font-semibold text-slate-900">{selectedVisit.customers?.name}</p>
                <p className="text-sm text-slate-600 mt-2 mb-1">Location</p>
                <p className="text-slate-900">{selectedVisit.location}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Payment Amount (AED)</label>
                <input
                  type="number"
                  step="0.01"
                  value={paymentData.amount}
                  onChange={(e) => setPaymentData({ ...paymentData, amount: parseFloat(e.target.value) })}
                  required
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-[#bb2738]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Payment Method</label>
                <select
                  value={paymentData.payment_method}
                  onChange={(e) => setPaymentData({ ...paymentData, payment_method: e.target.value })}
                  required
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-[#bb2738]"
                >
                  <option value="Cash">Cash</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                  <option value="PayPal">PayPal</option>
                  <option value="Stripe">Stripe</option>
                  <option value="Cheque">Cheque</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Payment Date</label>
                <input
                  type="date"
                  value={paymentData.payment_date}
                  onChange={(e) => setPaymentData({ ...paymentData, payment_date: e.target.value })}
                  required
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-[#bb2738]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Transaction Reference</label>
                <input
                  type="text"
                  value={paymentData.transaction_reference}
                  onChange={(e) => setPaymentData({ ...paymentData, transaction_reference: e.target.value })}
                  placeholder="Optional"
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-[#bb2738]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Payment Notes</label>
                <textarea
                  value={paymentData.payment_notes}
                  onChange={(e) => setPaymentData({ ...paymentData, payment_notes: e.target.value })}
                  rows={3}
                  placeholder="Optional"
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-[#bb2738]"
                />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowPaymentModal(false)}
                  className="px-6 py-2.5 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg disabled:opacity-50 flex items-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <DollarSign className="w-4 h-4" />
                      Record Payment
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showShareLinkModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6">
            <div className="flex items-start gap-4 mb-6">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                <LinkIcon className="w-6 h-6 text-blue-600" />
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-bold text-slate-900 mb-2">Payment Link Generated</h2>
                <p className="text-slate-600">
                  Share this secure payment link with your customer. The link expires in 7 days.
                </p>
              </div>
            </div>
            <div className="bg-slate-50 rounded-lg p-4 mb-4">
              <p className="text-sm text-slate-600 mb-2">Payment Link</p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={paymentLink}
                  readOnly
                  className="flex-1 px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm"
                />
                <button
                  onClick={() => copyToClipboard(paymentLink)}
                  className="px-4 py-2 bg-[#bb2738] hover:bg-[#a01f2f] text-white rounded-lg flex items-center gap-2"
                >
                  {copied ? (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      Copy
                    </>
                  )}
                </button>
              </div>
            </div>
            <div className="flex justify-end">
              <button
                onClick={() => {
                  setShowShareLinkModal(false);
                  setPaymentLink('');
                  setCopied(false);
                }}
                className="px-6 py-2.5 bg-slate-600 hover:bg-slate-700 text-white rounded-lg"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {showUploadModal && selectedVisit && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
            <div className="flex justify-between items-center p-6 border-b">
              <h2 className="text-xl font-bold">Upload Photos</h2>
              <button onClick={() => setShowUploadModal(false)} className="p-2 hover:bg-slate-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handlePhotoUpload} className="p-6 space-y-4">
              <div className="bg-slate-50 rounded-lg p-4 mb-4">
                <p className="text-sm text-slate-600 mb-1">Site Visit</p>
                <p className="font-semibold text-slate-900">{selectedVisit.customers?.name}</p>
                <p className="text-sm text-slate-600">{selectedVisit.location}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Photo Type</label>
                <select
                  value={photoType}
                  onChange={(e) => setPhotoType(e.target.value)}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-teal-500"
                >
                  <option value="before">Before</option>
                  <option value="during">During</option>
                  <option value="after">After</option>
                  <option value="issue">Issue</option>
                  <option value="general">General</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Photos</label>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handlePhotoFileChange}
                  required
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-teal-500"
                />
                {photoFiles.length > 0 && (
                  <p className="text-sm text-slate-600 mt-2">{photoFiles.length} file(s) selected</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Caption (Optional)</label>
                <textarea
                  value={photoCaption}
                  onChange={(e) => setPhotoCaption(e.target.value)}
                  rows={3}
                  placeholder="Add a description or note"
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="px-6 py-2.5 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploadingPhotos}
                  className="px-6 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg disabled:opacity-50 flex items-center gap-2"
                >
                  {uploadingPhotos ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4" />
                      Upload Photos
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showPhotosModal && selectedVisit && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex justify-between items-center p-6 border-b">
              <div>
                <h2 className="text-xl font-bold">Site Visit Photos</h2>
                <p className="text-sm text-slate-600 mt-1">
                  {selectedVisit.customers?.name} - {selectedVisit.location}
                </p>
              </div>
              <button onClick={() => setShowPhotosModal(false)} className="p-2 hover:bg-slate-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              {loadingPhotos ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
                </div>
              ) : visitPhotos.length === 0 ? (
                <div className="text-center py-12">
                  <Image className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                  <p className="text-slate-500">No photos uploaded yet</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {visitPhotos.map((photo) => (
                    <div key={photo.id} className="bg-slate-50 rounded-lg overflow-hidden border border-slate-200">
                      <div className="aspect-square relative bg-slate-200">
                        {photo.photoUrl ? (
                          <img
                            src={photo.photoUrl}
                            alt={photo.photo_type}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              console.error('Image failed to load:', photo.storage_path);
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Image className="w-12 h-12 text-slate-400" />
                          </div>
                        )}
                      </div>
                      <div className="p-4 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="inline-block px-2 py-1 bg-teal-100 text-teal-700 text-xs font-medium rounded capitalize">
                            {photo.photo_type}
                          </span>
                          <button
                            onClick={() => handleDownloadPhoto(photo)}
                            className="p-1 text-slate-600 hover:bg-slate-100 rounded transition-colors"
                            title="Download"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                        </div>
                        <p className="text-sm text-slate-700 font-medium">{photo.file_name}</p>
                        {photo.caption && (
                          <p className="text-xs text-slate-600">{photo.caption}</p>
                        )}
                        {photo.uploaded_by_name && (
                          <p className="text-xs text-slate-500">Uploaded by: {photo.uploaded_by_name}</p>
                        )}
                        <p className="text-xs text-slate-400">
                          {new Date(photo.created_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="border-t p-4 flex justify-end">
              <button
                onClick={() => setShowPhotosModal(false)}
                className="px-6 py-2.5 bg-slate-600 hover:bg-slate-700 text-white rounded-lg"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {showWorkerLinkModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6">
            <div className="flex items-start gap-4 mb-6">
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
                <Camera className="w-6 h-6 text-orange-600" />
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-bold text-slate-900 mb-2">Worker Upload Link</h2>
                <p className="text-slate-600">
                  Share this link with workers to upload photos from site. No login required.
                </p>
              </div>
            </div>
            <div className="bg-slate-50 rounded-lg p-4 mb-4">
              <p className="text-sm text-slate-600 mb-2">Upload Link</p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={workerLink}
                  readOnly
                  className="flex-1 px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm"
                />
                <button
                  onClick={() => copyToClipboard(workerLink)}
                  className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg flex items-center gap-2"
                >
                  {copied ? (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      Copy
                    </>
                  )}
                </button>
              </div>
            </div>
            <div className="flex justify-end">
              <button
                onClick={() => {
                  setShowWorkerLinkModal(false);
                  setWorkerLink('');
                  setCopied(false);
                }}
                className="px-6 py-2.5 bg-slate-600 hover:bg-slate-700 text-white rounded-lg"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
