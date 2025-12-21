import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useLanguage } from '../contexts/LanguageContext';
import { useToast } from '../contexts/ToastContext';
import { Plus, Search, CreditCard as Edit, Trash2, X, Upload, Download, Paperclip, MessageCircle, Mail, LogIn } from 'lucide-react';
import { CustomerBulkImport } from './CustomerBulkImport';
import { CustomerAttachments } from './CustomerAttachments';
import { WhatsAppDirectChat } from './WhatsAppDirectChat';
import { exportToExcel, exportToPDF } from '../utils/exportUtils';

type Customer = {
  id: string;
  name: string;
  email: string | null;
  phone: string;
  location: string | null;
  status: 'Lead' | 'Quoted' | 'Ordered' | 'Delivered' | 'Installed';
  notes: string | null;
  created_at: string;
  attachment_count?: number;
};

export function Customers() {
  const { t } = useLanguage();
  const { success, error: showError } = useToast();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showBulkImport, setShowBulkImport] = useState(false);
  const [showAttachments, setShowAttachments] = useState(false);
  const [showWhatsAppChat, setShowWhatsAppChat] = useState(false);
  const [showWhatsAppPopup, setShowWhatsAppPopup] = useState(false);
  const [whatsappMessage, setWhatsappMessage] = useState('');
  const [showEmailPopup, setShowEmailPopup] = useState(false);
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    location: '',
    status: 'Lead' as Customer['status'],
    notes: '',
  });

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const customersData = data || [];

      const customersWithCounts = await Promise.all(
        customersData.map(async (customer) => {
          const { count } = await supabase
            .from('attachments')
            .select('*', { count: 'exact', head: true })
            .eq('entity_type', 'customer')
            .eq('entity_id', customer.id);

          return {
            ...customer,
            attachment_count: count || 0
          };
        })
      );

      setCustomers(customersWithCounts);
    } catch (err) {
      console.error('Error fetching customers:', err);
      showError('Failed to load customers');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingCustomer) {
        const { error } = await supabase
          .from('customers')
          .update(formData)
          .eq('id', editingCustomer.id);

        if (error) throw error;
        success('Customer updated successfully');
      } else {
        const { error } = await supabase
          .from('customers')
          .insert([formData]);

        if (error) throw error;
        success('Customer created successfully');
      }

      setShowModal(false);
      setEditingCustomer(null);
      resetForm();
      fetchCustomers();
    } catch (err) {
      console.error('Error saving customer:', err);
      showError('Failed to save customer');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this customer?')) return;

    try {
      const { error } = await supabase
        .from('customers')
        .delete()
        .eq('id', id);

      if (error) throw error;
      success('Customer deleted successfully');
      fetchCustomers();
    } catch (err) {
      console.error('Error deleting customer:', err);
      showError('Failed to delete customer');
    }
  };

  const handleLoginAsCustomer = async (customer: Customer) => {
    try {
      if (!customer.email) {
        showError('Customer must have an email address to access the portal');
        return;
      }

      let customerUser = await supabase
        .from('customer_users')
        .select('id, customer_id, email')
        .eq('customer_id', customer.id)
        .maybeSingle();

      if (!customerUser.data) {
        const { data: newUser, error: createError } = await supabase
          .from('customer_users')
          .insert({
            customer_id: customer.id,
            email: customer.email
          })
          .select('id, customer_id, email')
          .single();

        if (createError) {
          console.error('Error creating customer portal account:', createError);
          showError('Failed to create customer portal account');
          return;
        }

        customerUser.data = newUser;
        success('Customer portal account created successfully');
      }

      sessionStorage.setItem('admin_impersonation', JSON.stringify({
        customer_id: customer.id,
        customer_user_id: customerUser.data.id,
        customer_email: customerUser.data.email,
        customer_name: customer.name
      }));

      window.location.href = '/customer';
    } catch (err) {
      console.error('Error logging in as customer:', err);
      showError('Failed to login as customer');
    }
  };

  const handleBulkDelete = async () => {
    if (selectedRows.size === 0) {
      showError('No customers selected');
      return;
    }

    if (!confirm(`Are you sure you want to delete ${selectedRows.size} customer(s)?`)) return;

    try {
      const { error } = await supabase
        .from('customers')
        .delete()
        .in('id', Array.from(selectedRows));

      if (error) throw error;
      success(`Deleted ${selectedRows.size} customer(s) successfully`);
      setSelectedRows(new Set());
      fetchCustomers();
    } catch (err) {
      console.error('Error deleting customers:', err);
      showError('Failed to delete customers');
    }
  };

  const handleExportExcel = () => {
    const selectedCustomers = selectedRows.size > 0
      ? customers.filter(c => selectedRows.has(c.id))
      : filteredCustomers;

    if (selectedCustomers.length === 0) {
      showError('No customers to export');
      return;
    }

    exportToExcel(selectedCustomers, 'customers');
    success(`Exported ${selectedCustomers.length} customer(s) to Excel`);
  };

  const handleExportPDF = () => {
    const selectedCustomers = selectedRows.size > 0
      ? customers.filter(c => selectedRows.has(c.id))
      : filteredCustomers;

    if (selectedCustomers.length === 0) {
      showError('No customers to export');
      return;
    }

    exportToPDF(
      selectedCustomers,
      ['name', 'phone', 'email', 'location', 'status'],
      ['Name', 'Phone', 'Email', 'Location', 'Status'],
      'customers'
    );
    success(`Exported ${selectedCustomers.length} customer(s) to PDF`);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      location: '',
      status: 'Lead',
      notes: '',
    });
  };

  const openEditModal = (customer: Customer) => {
    setEditingCustomer(customer);
    setFormData({
      name: customer.name,
      email: customer.email || '',
      phone: customer.phone,
      location: customer.location || '',
      status: customer.status,
      notes: customer.notes || '',
    });
    setShowModal(true);
  };

  const filteredCustomers = customers.filter(customer =>
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.phone.includes(searchTerm) ||
    (customer.email && customer.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const getStatusColor = (status: string) => {
    const colors = {
      Lead: 'bg-blue-100 text-blue-800',
      Quoted: 'bg-yellow-100 text-yellow-800',
      Ordered: 'bg-purple-100 text-purple-800',
      Delivered: 'bg-green-100 text-green-800',
      Installed: 'bg-slate-100 text-slate-800',
    };
    return colors[status as keyof typeof colors] || 'bg-slate-100 text-slate-800';
  };

  const handleWhatsAppSend = () => {
    if (!selectedCustomer) return;

    let phoneNumber = selectedCustomer.phone.replace(/\D/g, '');

    if (!phoneNumber.startsWith('966')) {
      phoneNumber = '966' + phoneNumber;
    }

    const encodedMessage = encodeURIComponent(whatsappMessage);
    const whatsappUrl = `https://wa.me/${phoneNumber}${whatsappMessage ? `?text=${encodedMessage}` : ''}`;

    window.open(whatsappUrl, '_blank');

    setShowWhatsAppPopup(false);
    setWhatsappMessage('');
    setSelectedCustomer(null);
  };

  const handleEmailSend = () => {
    if (!selectedCustomer || !selectedCustomer.email) return;

    const encodedSubject = encodeURIComponent(emailSubject);
    const encodedBody = encodeURIComponent(emailBody);

    const mailtoUrl = `mailto:${selectedCustomer.email}${emailSubject || emailBody ? '?' : ''}${emailSubject ? `subject=${encodedSubject}` : ''}${emailSubject && emailBody ? '&' : ''}${emailBody ? `body=${encodedBody}` : ''}`;

    window.location.href = mailtoUrl;

    setShowEmailPopup(false);
    setEmailSubject('');
    setEmailBody('');
    setSelectedCustomer(null);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-slate-800">{t('nav.customers')}</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowBulkImport(true)}
            className="flex items-center gap-2 bg-slate-700 hover:bg-slate-800 text-white px-4 py-2.5 rounded-lg transition-colors"
          >
            <Upload className="w-5 h-5" />
            Import
          </button>
          <button
            onClick={() => {
              resetForm();
              setEditingCustomer(null);
              setShowModal(true);
            }}
            className="flex items-center gap-2 bg-[#bb2738] hover:bg-[#a01f2f] text-white px-4 py-2.5 rounded-lg transition-colors"
          >
            <Plus className="w-5 h-5" />
            {t('common.add')} {t('nav.customers')}
          </button>
        </div>
      </div>

      {selectedRows.size > 0 && (
        <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-between">
          <span className="text-sm font-medium text-blue-800">
            {selectedRows.size} customer(s) selected
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportExcel}
              className="flex items-center gap-1 px-3 py-1.5 text-sm bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
            >
              <Download className="w-4 h-4" />
              Excel
            </button>
            <button
              onClick={handleExportPDF}
              className="flex items-center gap-1 px-3 py-1.5 text-sm bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
            >
              <Download className="w-4 h-4" />
              PDF
            </button>
            <button
              onClick={handleBulkDelete}
              className="flex items-center gap-1 px-3 py-1.5 text-sm bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              Delete
            </button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-200">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder={t('common.search')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-[#bb2738]"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase">{t('customer.name')}</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase">{t('customer.phone')}</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase">{t('customer.email')}</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase">{t('customer.location')}</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase">{t('common.status')}</th>
                <th className="px-6 py-3 text-center text-xs font-semibold text-slate-600 uppercase">Files</th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-slate-600 uppercase">{t('common.actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-slate-500">Loading...</td>
                </tr>
              ) : filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-slate-500">No customers found</td>
                </tr>
              ) : (
                filteredCustomers.map((customer) => (
                  <tr key={customer.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-slate-800">{customer.name}</td>
                    <td className="px-6 py-4 text-slate-600">{customer.phone}</td>
                    <td className="px-6 py-4 text-slate-600">{customer.email || '-'}</td>
                    <td className="px-6 py-4 text-slate-600">{customer.location || '-'}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(customer.status)}`}>
                        {t(`status.${customer.status.toLowerCase()}`)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => {
                          setSelectedCustomer(customer);
                          setShowAttachments(true);
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors"
                      >
                        <Paperclip className="w-4 h-4" />
                        {customer.attachment_count || 0}
                      </button>
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <button
                        onClick={() => {
                          setSelectedCustomer(customer);
                          setWhatsappMessage('');
                          setShowWhatsAppPopup(true);
                        }}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-sm text-green-700 hover:bg-green-50 rounded-lg transition-colors"
                        title="Contact via WhatsApp"
                      >
                        <MessageCircle className="w-4 h-4" />
                        WhatsApp
                      </button>
                      {customer.email && (
                        <button
                          onClick={() => {
                            setSelectedCustomer(customer);
                            setEmailSubject('');
                            setEmailBody('');
                            setShowEmailPopup(true);
                          }}
                          className="inline-flex items-center gap-1 px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Send Email"
                        >
                          <Mail className="w-4 h-4" />
                          Email
                        </button>
                      )}
                      <button
                        onClick={() => handleLoginAsCustomer(customer)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-sm text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                        title="Login as Customer"
                      >
                        <LogIn className="w-4 h-4" />
                        Login
                      </button>
                      <button
                        onClick={() => openEditModal(customer)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50 rounded-lg transition-colors"
                      >
                        <Edit className="w-4 h-4" />
                        {t('common.edit')}
                      </button>
                      <button
                        onClick={() => handleDelete(customer.id)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-sm text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                        {t('common.delete')}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b border-slate-200">
              <h2 className="text-xl font-bold text-slate-800">
                {editingCustomer ? t('common.edit') : t('common.add')} {t('nav.customers')}
              </h2>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-slate-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">{t('customer.name')}</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-[#bb2738]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">{t('customer.phone')}</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    required
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-[#bb2738]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">{t('customer.email')}</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-[#bb2738]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">{t('common.status')}</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as Customer['status'] })}
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-[#bb2738]"
                  >
                    <option value="Lead">{t('status.lead')}</option>
                    <option value="Quoted">{t('status.quoted')}</option>
                    <option value="Ordered">{t('status.ordered')}</option>
                    <option value="Delivered">{t('status.delivered')}</option>
                    <option value="Installed">{t('status.installed')}</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">{t('customer.location')}</label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-[#bb2738]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">{t('customer.notes')}</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-[#bb2738]"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-6 py-2.5 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  {t('common.cancel')}
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-[#bb2738] hover:bg-[#a01f2f] text-white rounded-lg transition-colors"
                >
                  {t('common.save')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showBulkImport && (
        <CustomerBulkImport
          onClose={() => setShowBulkImport(false)}
          onImportComplete={() => {
            fetchCustomers();
            setShowBulkImport(false);
          }}
        />
      )}

      {showAttachments && selectedCustomer && (
        <CustomerAttachments
          customerId={selectedCustomer.id}
          customerName={selectedCustomer.name}
          onClose={() => {
            setShowAttachments(false);
            setSelectedCustomer(null);
            fetchCustomers();
          }}
        />
      )}

      {showWhatsAppChat && selectedCustomer && (
        <WhatsAppDirectChat
          customerId={selectedCustomer.id}
          customerName={selectedCustomer.name}
          customerPhone={selectedCustomer.phone}
          onClose={() => {
            setShowWhatsAppChat(false);
            setSelectedCustomer(null);
          }}
        />
      )}

      {showWhatsAppPopup && selectedCustomer && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full">
            <div className="flex justify-between items-center p-6 border-b border-slate-200">
              <div>
                <h2 className="text-xl font-bold text-slate-800">Send WhatsApp Message</h2>
                <p className="text-sm text-slate-600 mt-1">
                  To: {selectedCustomer.name} ({selectedCustomer.phone})
                </p>
              </div>
              <button
                onClick={() => {
                  setShowWhatsAppPopup(false);
                  setWhatsappMessage('');
                  setSelectedCustomer(null);
                }}
                className="p-2 hover:bg-slate-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Message (Optional)
              </label>
              <textarea
                value={whatsappMessage}
                onChange={(e) => setWhatsappMessage(e.target.value)}
                placeholder="Type your message here..."
                rows={6}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-green-500 resize-none"
              />
              <p className="text-xs text-slate-500 mt-2">
                This will open WhatsApp with a pre-filled message. You can edit it before sending.
              </p>
            </div>

            <div className="flex justify-end gap-3 p-6 border-t border-slate-200">
              <button
                onClick={() => {
                  setShowWhatsAppPopup(false);
                  setWhatsappMessage('');
                  setSelectedCustomer(null);
                }}
                className="px-6 py-2.5 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleWhatsAppSend}
                className="px-6 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors flex items-center gap-2"
              >
                <MessageCircle className="w-4 h-4" />
                Open WhatsApp
              </button>
            </div>
          </div>
        </div>
      )}

      {showEmailPopup && selectedCustomer && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full">
            <div className="flex justify-between items-center p-6 border-b border-slate-200">
              <div>
                <h2 className="text-xl font-bold text-slate-800">Send Email</h2>
                <p className="text-sm text-slate-600 mt-1">
                  To: {selectedCustomer.name} ({selectedCustomer.email})
                </p>
              </div>
              <button
                onClick={() => {
                  setShowEmailPopup(false);
                  setEmailSubject('');
                  setEmailBody('');
                  setSelectedCustomer(null);
                }}
                className="p-2 hover:bg-slate-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Subject (Optional)
                </label>
                <input
                  type="text"
                  value={emailSubject}
                  onChange={(e) => setEmailSubject(e.target.value)}
                  placeholder="Email subject..."
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Message (Optional)
                </label>
                <textarea
                  value={emailBody}
                  onChange={(e) => setEmailBody(e.target.value)}
                  placeholder="Type your message here..."
                  rows={6}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>

              <p className="text-xs text-slate-500">
                This will open your default email client with a pre-filled message. You can edit it before sending.
              </p>
            </div>

            <div className="flex justify-end gap-3 p-6 border-t border-slate-200">
              <button
                onClick={() => {
                  setShowEmailPopup(false);
                  setEmailSubject('');
                  setEmailBody('');
                  setSelectedCustomer(null);
                }}
                className="px-6 py-2.5 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleEmailSend}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-2"
              >
                <Mail className="w-4 h-4" />
                Open Email Client
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
