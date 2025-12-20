import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useLanguage } from '../contexts/LanguageContext';
import { useBrand } from '../contexts/BrandContext';
import { exportQuoteToPDF, exportQuoteToExcel } from '../utils/exportUtils';
import { Plus, Download, FileSpreadsheet, CreditCard as Edit, Trash2, X, ArrowRight, Upload, Zap, Copy, ClipboardPaste, Eye, Mail } from 'lucide-react';
import { QuoteBulkImport } from './QuoteBulkImport';
import { PDFPreviewModal } from './PDFPreviewModal';
import { EmailPDFModal } from './EmailPDFModal';
import jsPDF from 'jspdf';

type QuoteItem = {
  location: string;
  type: string;
  height: number;
  width: number;
  qty: number;
  area: number;
  chargeable_area: number;
  unit_price: number;
  total: number;
};

export function Quotes() {
  const { t } = useLanguage();
  const { brand } = useBrand();
  const [quotes, setQuotes] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showBulkImport, setShowBulkImport] = useState(false);
  const [showBulkAddItems, setShowBulkAddItems] = useState(false);
  const [editingQuote, setEditingQuote] = useState<any>(null);
  const [bulkItemInput, setBulkItemInput] = useState({ location: '', type: '', height: '', width: '', qty: '1', unit_price: '' });
  const [showPDFPreview, setShowPDFPreview] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [selectedQuote, setSelectedQuote] = useState<any>(null);
  const [pdfBlob, setPdfBlob] = useState<Blob | null>(null);
  const [formData, setFormData] = useState({
    customer_id: '',
    items: [{ location: '', type: '', height: 0, width: 0, qty: 1, area: 0, chargeable_area: 0, unit_price: 0, total: 0 }] as QuoteItem[],
    remarks: '',
    status: 'Draft',
    valid_until: '',
    minimum_chargeable_area: 1.0,
    discount_type: 'none' as 'none' | 'percentage' | 'fixed',
    discount_value: 0,
    shipping_amount: 0,
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [quotesData, customersData] = await Promise.all([
        supabase.from('quotes').select('*, customers(*)').order('created_at', { ascending: false }),
        supabase.from('customers').select('*').order('name'),
      ]);

      setQuotes(quotesData.data || []);
      setCustomers(customersData.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateQuoteNumber = () => {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `QT-${year}${month}-${random}`;
  };

  const calculateTotals = (items: QuoteItem[]) => {
    const subtotal = items.reduce((sum, item) => sum + item.total, 0);
    const total_chargeable_area = items.reduce((sum, item) => sum + (item.chargeable_area || 0), 0);

    let discount_amount = 0;
    if (formData.discount_type === 'percentage') {
      discount_amount = subtotal * (formData.discount_value / 100);
    } else if (formData.discount_type === 'fixed') {
      discount_amount = formData.discount_value;
    }

    const subtotal_after_discount = subtotal - discount_amount;
    const vat_amount = subtotal_after_discount * 0.05;
    const shipping_amount = formData.shipping_amount || 0;
    const total = subtotal_after_discount + vat_amount + shipping_amount;

    return { subtotal, discount: discount_amount, vat_amount, total, total_chargeable_area, shipping_amount };
  };

  const addItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { location: '', type: '', height: 0, width: 0, qty: 1, area: 0, chargeable_area: 0, unit_price: 0, total: 0 }],
    });
  };

  const addBulkItem = () => {
    const height = parseFloat(bulkItemInput.height) || 0;
    const width = parseFloat(bulkItemInput.width) || 0;
    const qty = parseInt(bulkItemInput.qty) || 0;
    const unitPrice = parseFloat(bulkItemInput.unit_price) || 0;
    const minChargeableArea = Number(formData.minimum_chargeable_area) || 1.0;

    const area = height > 0 && width > 0 && qty > 0 ? (height * width * qty) / 10000 : 0;
    const chargeable_area = Math.max(area, minChargeableArea * qty);
    const total = chargeable_area > 0 && unitPrice > 0 ? chargeable_area * unitPrice : 0;

    const newItem = {
      location: bulkItemInput.location,
      type: bulkItemInput.type,
      height,
      width,
      qty,
      area,
      chargeable_area,
      unit_price: unitPrice,
      total
    };

    setFormData({
      ...formData,
      items: [...formData.items, newItem]
    });

    setBulkItemInput({ location: '', type: '', height: '', width: '', qty: '1', unit_price: bulkItemInput.unit_price });
  };

  const duplicateItem = (index: number) => {
    const itemToCopy = { ...formData.items[index] };
    setFormData({
      ...formData,
      items: [...formData.items, itemToCopy]
    });
  };

  const pasteItemsFromClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      const rows = text.split('\n').filter(row => row.trim());

      const newItems: QuoteItem[] = [];

      for (const row of rows) {
        const cells = row.split('\t');
        if (cells.length >= 6) {
          const height = parseFloat(cells[2]) || 0;
          const width = parseFloat(cells[3]) || 0;
          const qty = parseInt(cells[4]) || 0;
          const unitPrice = parseFloat(cells[5]) || 0;
          const minChargeableArea = Number(formData.minimum_chargeable_area) || 1.0;

          const area = height > 0 && width > 0 && qty > 0 ? (height * width * qty) / 10000 : 0;
          const chargeable_area = Math.max(area, minChargeableArea * qty);
          const total = chargeable_area > 0 && unitPrice > 0 ? chargeable_area * unitPrice : 0;

          newItems.push({
            location: cells[0] || '',
            type: cells[1] || '',
            height,
            width,
            qty,
            area,
            chargeable_area,
            unit_price: unitPrice,
            total
          });
        }
      }

      if (newItems.length > 0) {
        setFormData({
          ...formData,
          items: [...formData.items, ...newItems]
        });
        alert(`Successfully added ${newItems.length} items from clipboard`);
      } else {
        alert('No valid items found in clipboard. Format: Location\tType\tHeight\tWidth\tQty\tUnit Price');
      }
    } catch (error) {
      console.error('Failed to read clipboard:', error);
      alert('Failed to read clipboard. Please make sure you have copied the data.');
    }
  };

  const applyItemTemplate = (template: string) => {
    const templates: Record<string, Partial<typeof bulkItemInput>> = {
      'window-standard': { type: 'Window', height: '150', width: '120', unit_price: '8' },
      'door-standard': { type: 'Door', height: '220', width: '100', unit_price: '15' },
      'sliding-door': { type: 'Sliding Door', height: '240', width: '200', unit_price: '25' },
      'partition': { type: 'Glass Partition', height: '250', width: '100', unit_price: '20' },
    };

    if (templates[template]) {
      setBulkItemInput({ ...bulkItemInput, ...templates[template] });
    }
  };

  const updateItem = (index: number, field: keyof QuoteItem, value: any) => {
    const newItems = [...formData.items];
    newItems[index] = { ...newItems[index], [field]: value };

    if (['height', 'width', 'qty', 'unit_price'].includes(field)) {
      const item = newItems[index];
      const height = Number(item.height) || 0;
      const width = Number(item.width) || 0;
      const qty = Number(item.qty) || 0;
      const unitPrice = Number(item.unit_price) || 0;
      const minChargeableArea = Number(formData.minimum_chargeable_area) || 1.0;

      item.area = height > 0 && width > 0 && qty > 0
        ? (height * width * qty) / 10000
        : 0;

      item.chargeable_area = Math.max(item.area, minChargeableArea * qty);

      item.total = item.chargeable_area > 0 && unitPrice > 0
        ? item.chargeable_area * unitPrice
        : 0;
    }

    setFormData({ ...formData, items: newItems });
  };

  const removeItem = (index: number) => {
    setFormData({ ...formData, items: formData.items.filter((_, i) => i !== index) });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.items.length === 0) {
      alert('Please add at least one item to the quote');
      return;
    }

    if (!formData.customer_id) {
      alert('Please select a customer');
      return;
    }

    const validItems = formData.items.filter(item => item.location || item.type || item.height > 0 || item.width > 0);
    if (validItems.length === 0) {
      alert('Please fill in at least one item with valid data');
      return;
    }

    const totals = calculateTotals(validItems);
    const quoteData = {
      customer_id: formData.customer_id,
      items: validItems,
      remarks: formData.remarks || '',
      status: formData.status,
      valid_until: formData.valid_until || null,
      minimum_chargeable_area: formData.minimum_chargeable_area || 1.0,
      discount_type: formData.discount_type || 'none',
      discount_value: formData.discount_value || 0,
      shipping_amount: formData.shipping_amount || 0,
      quote_number: editingQuote?.quote_number || generateQuoteNumber(),
      subtotal: totals.subtotal,
      discount: totals.discount,
      vat_amount: totals.vat_amount,
      total: totals.total,
    };

    try {
      let result;
      if (editingQuote) {
        result = await supabase.from('quotes').update(quoteData).eq('id', editingQuote.id).select();
      } else {
        result = await supabase.from('quotes').insert([quoteData]).select();
      }

      if (result.error) {
        throw result.error;
      }

      alert(editingQuote ? 'Quote updated successfully!' : 'Quote created successfully!');
      setShowModal(false);
      setEditingQuote(null);
      resetForm();
      fetchData();
    } catch (error: any) {
      console.error('Error saving quote:', error);
      alert(`Failed to save quote: ${error.message || 'Please try again.'}`);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure?')) return;
    try {
      await supabase.from('quotes').delete().eq('id', id);
      fetchData();
    } catch (error) {
      console.error('Error deleting quote:', error);
    }
  };

  const handlePreviewPDF = (quote: any) => {
    setSelectedQuote(quote);
    setShowPDFPreview(true);
  };

  const generatePDFForPreview = () => {
    return (async () => {
      await exportQuoteToPDF(selectedQuote, selectedQuote.customers, brand);
      return new jsPDF();
    })() as unknown as jsPDF;
  };

  const handleEmailPDF = async (quote: any) => {
    try {
      setSelectedQuote(quote);
      await exportQuoteToPDF(quote, quote.customers, brand);
      const testDoc = new jsPDF();
      testDoc.text('PDF Content', 10, 10);
      const blob = testDoc.output('blob');
      setPdfBlob(blob);
      setShowEmailModal(true);
    } catch (error) {
      console.error('Error preparing email:', error);
      alert('Failed to prepare PDF for email');
    }
  };

  const handleDownloadPDF = async (quote: any) => {
    try {
      await exportQuoteToPDF(quote, quote.customers, brand);
    } catch (error) {
      console.error('Error downloading PDF:', error);
      alert('Failed to download PDF');
    }
  };

  const handleConvertToOrder = async (quote: any) => {
    if (!confirm(`Convert quote ${quote.quote_number} to an order?`)) return;

    try {
      const orderNumber = `ORD-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;

      await supabase.from('orders').insert([{
        customer_id: quote.customer_id,
        quote_id: quote.id,
        order_number: orderNumber,
        order_date: new Date().toISOString().split('T')[0],
        status: 'Confirmed'
      }]);

      await supabase.from('quotes').update({ status: 'Accepted' }).eq('id', quote.id);

      alert(`Order ${orderNumber} created successfully!`);
      fetchData();
    } catch (error) {
      console.error('Error converting to order:', error);
      alert('Failed to create order');
    }
  };

  const resetForm = () => {
    setFormData({
      customer_id: '',
      items: [{ location: '', type: '', height: 0, width: 0, qty: 1, area: 0, chargeable_area: 0, unit_price: 0, total: 0 }],
      remarks: '',
      status: 'Draft',
      valid_until: '',
      minimum_chargeable_area: 1.0,
      discount_type: 'none',
      discount_value: 0,
      shipping_amount: 0,
    });
  };

  const openEditModal = (quote: any) => {
    setEditingQuote(quote);
    setFormData({
      customer_id: quote.customer_id,
      items: quote.items && quote.items.length > 0 ? quote.items : [{ location: '', type: '', height: 0, width: 0, qty: 1, area: 0, chargeable_area: 0, unit_price: 0, total: 0 }],
      remarks: quote.remarks || '',
      status: quote.status,
      valid_until: quote.valid_until || '',
      minimum_chargeable_area: quote.minimum_chargeable_area || 1.0,
      discount_type: quote.discount_type || 'none',
      discount_value: quote.discount_value || 0,
      shipping_amount: quote.shipping_amount || 0,
    });
    setShowModal(true);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-slate-800">{t('nav.quotes')}</h1>
        <div className="flex gap-3">
          <button
            onClick={() => setShowBulkImport(true)}
            className="flex items-center gap-2 bg-slate-600 hover:bg-slate-700 text-white px-4 py-2.5 rounded-lg transition-colors"
          >
            <Upload className="w-5 h-5" />
            Bulk Import
          </button>
          <button
            onClick={() => {
              resetForm();
              setEditingQuote(null);
              setShowModal(true);
            }}
            className="flex items-center gap-2 bg-[#bb2738] hover:bg-[#a01f2f] text-white px-4 py-2.5 rounded-lg transition-colors"
          >
            <Plus className="w-5 h-5" />
            Create Quote
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Quote #</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Customer</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Total</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Date</th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-slate-600 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {loading ? (
                <tr><td colSpan={6} className="px-6 py-8 text-center text-slate-500">Loading...</td></tr>
              ) : quotes.length === 0 ? (
                <tr><td colSpan={6} className="px-6 py-8 text-center text-slate-500">No quotes found</td></tr>
              ) : (
                quotes.map((quote) => (
                  <tr key={quote.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-slate-800">{quote.quote_number}</td>
                    <td className="px-6 py-4 text-slate-600">{quote.customers?.name}</td>
                    <td className="px-6 py-4 text-slate-600">AED {(quote.total || 0).toFixed(2)}</td>
                    <td className="px-6 py-4">
                      <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {quote.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-600">{new Date(quote.created_at).toLocaleDateString()}</td>
                    <td className="px-6 py-4 text-right space-x-2">
                      {quote.status === 'Draft' || quote.status === 'Sent' ? (
                        <button
                          onClick={() => handleConvertToOrder(quote)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 text-sm text-[#bb2738] hover:bg-red-50 rounded-lg transition-colors font-medium"
                        >
                          <ArrowRight className="w-4 h-4" />
                          Convert to Order
                        </button>
                      ) : null}
                      <button
                        onClick={() => handlePreviewPDF(quote)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-sm text-purple-700 hover:bg-purple-50 rounded-lg transition-colors"
                        title="Preview PDF"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleEmailPDF(quote)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-sm text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Email PDF"
                      >
                        <Mail className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDownloadPDF(quote)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-sm text-green-700 hover:bg-green-50 rounded-lg transition-colors"
                        title="Download PDF"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => exportQuoteToExcel(quote, quote.customers)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-sm text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors"
                        title="Export to Excel"
                      >
                        <FileSpreadsheet className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => openEditModal(quote)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-sm text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(quote.id)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-sm text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
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
        <div className="fixed inset-0 bg-black/50 flex items-start justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-xl max-w-6xl w-full my-8 max-h-[calc(100vh-4rem)]">
            <div className="flex justify-between items-center p-6 border-b border-slate-200 sticky top-0 bg-white z-10">
              <h2 className="text-xl font-bold text-slate-800">
                {editingQuote ? 'Edit' : 'Create'} Quote
              </h2>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-slate-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form id="quote-form" onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto max-h-[calc(100vh-12rem)]">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-2">Customer</label>
                  <select
                    value={formData.customer_id}
                    onChange={(e) => setFormData({ ...formData, customer_id: e.target.value })}
                    required
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-[#bb2738]"
                  >
                    <option value="">Select Customer</option>
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>{c.name} - {c.phone}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Valid Until</label>
                  <input
                    type="date"
                    value={formData.valid_until}
                    onChange={(e) => setFormData({ ...formData, valid_until: e.target.value })}
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-[#bb2738]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Min Area (m²/item)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.minimum_chargeable_area}
                    onChange={(e) => {
                      const newMinArea = parseFloat(e.target.value) || 1.0;
                      setFormData({ ...formData, minimum_chargeable_area: newMinArea });
                      const updatedItems = formData.items.map(item => {
                        const chargeableArea = Math.max(item.area, newMinArea * item.qty);
                        return {
                          ...item,
                          chargeable_area: chargeableArea,
                          total: chargeableArea * item.unit_price
                        };
                      });
                      setFormData({ ...formData, minimum_chargeable_area: newMinArea, items: updatedItems });
                    }}
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-[#bb2738]"
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-3">
                  <label className="text-sm font-medium text-slate-700">Items</label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setShowBulkAddItems(!showBulkAddItems)}
                      className="flex items-center gap-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors text-sm font-medium"
                    >
                      <Zap className="w-4 h-4" />
                      {showBulkAddItems ? 'Hide' : 'Show'} Quick Add
                    </button>
                    <button
                      type="button"
                      onClick={pasteItemsFromClipboard}
                      className="flex items-center gap-1 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg transition-colors text-sm"
                      title="Paste from Excel (Location, Type, Height, Width, Qty, Unit Price)"
                    >
                      <ClipboardPaste className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={addItem}
                      className="text-sm text-[#bb2738] hover:underline font-medium"
                    >
                      + Add Row
                    </button>
                  </div>
                </div>

                {showBulkAddItems && (
                  <div className="mb-4 p-4 bg-gradient-to-br from-slate-50 to-blue-50 border border-slate-200 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold text-slate-800 flex items-center gap-2">
                        <Zap className="w-4 h-4 text-[#bb2738]" />
                        Quick Add Items
                      </h4>
                      <select
                        onChange={(e) => applyItemTemplate(e.target.value)}
                        className="text-xs px-2 py-1 border border-slate-300 rounded"
                        value=""
                      >
                        <option value="">Select Template...</option>
                        <option value="window-standard">Standard Window (150x120)</option>
                        <option value="door-standard">Standard Door (220x100)</option>
                        <option value="sliding-door">Sliding Door (240x200)</option>
                        <option value="partition">Glass Partition (250x100)</option>
                      </select>
                    </div>
                    <div className="grid grid-cols-7 gap-2 mb-2">
                      <input
                        type="text"
                        placeholder="Location"
                        value={bulkItemInput.location}
                        onChange={(e) => setBulkItemInput({ ...bulkItemInput, location: e.target.value })}
                        className="px-2 py-2 border border-slate-300 rounded text-sm"
                      />
                      <input
                        type="text"
                        placeholder="Type"
                        value={bulkItemInput.type}
                        onChange={(e) => setBulkItemInput({ ...bulkItemInput, type: e.target.value })}
                        className="px-2 py-2 border border-slate-300 rounded text-sm"
                      />
                      <input
                        type="number"
                        placeholder="H (cm)"
                        value={bulkItemInput.height}
                        onChange={(e) => setBulkItemInput({ ...bulkItemInput, height: e.target.value })}
                        className="px-2 py-2 border border-slate-300 rounded text-sm"
                      />
                      <input
                        type="number"
                        placeholder="W (cm)"
                        value={bulkItemInput.width}
                        onChange={(e) => setBulkItemInput({ ...bulkItemInput, width: e.target.value })}
                        className="px-2 py-2 border border-slate-300 rounded text-sm"
                      />
                      <input
                        type="number"
                        placeholder="Qty"
                        value={bulkItemInput.qty}
                        onChange={(e) => setBulkItemInput({ ...bulkItemInput, qty: e.target.value })}
                        className="px-2 py-2 border border-slate-300 rounded text-sm"
                      />
                      <input
                        type="number"
                        placeholder="Price"
                        step="0.01"
                        value={bulkItemInput.unit_price}
                        onChange={(e) => setBulkItemInput({ ...bulkItemInput, unit_price: e.target.value })}
                        className="px-2 py-2 border border-slate-300 rounded text-sm"
                      />
                      <button
                        type="button"
                        onClick={addBulkItem}
                        className="px-4 py-2 bg-[#bb2738] hover:bg-[#a01f2f] text-white rounded text-sm font-medium transition-colors"
                      >
                        Add
                      </button>
                    </div>
                    <p className="text-xs text-slate-600 mt-2">
                      💡 Tip: Fill in the fields and click "Add" to quickly add items. Unit price persists for batch entry.
                    </p>
                  </div>
                )}

                <div className="overflow-x-auto border border-slate-300 rounded-lg">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="px-3 py-2 text-left">Location</th>
                        <th className="px-3 py-2 text-left">Type</th>
                        <th className="px-3 py-2 text-left">H (cm)</th>
                        <th className="px-3 py-2 text-left">W (cm)</th>
                        <th className="px-3 py-2 text-left">Qty</th>
                        <th className="px-3 py-2 text-left">Area (m²)</th>
                        <th className="px-3 py-2 text-left">Charge (m²)</th>
                        <th className="px-3 py-2 text-left">Unit Price</th>
                        <th className="px-3 py-2 text-left">Total</th>
                        <th className="px-3 py-2"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {formData.items.map((item, idx) => (
                        <tr key={idx} className="border-t border-slate-200">
                          <td className="px-3 py-2">
                            <input
                              type="text"
                              value={item.location}
                              onChange={(e) => updateItem(idx, 'location', e.target.value)}
                              className="w-full px-2 py-1 border border-slate-300 rounded"
                            />
                          </td>
                          <td className="px-3 py-2">
                            <input
                              type="text"
                              value={item.type}
                              onChange={(e) => updateItem(idx, 'type', e.target.value)}
                              className="w-full px-2 py-1 border border-slate-300 rounded"
                            />
                          </td>
                          <td className="px-3 py-2">
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              value={item.height || ''}
                              onChange={(e) => updateItem(idx, 'height', e.target.value === '' ? 0 : parseFloat(e.target.value))}
                              className="w-20 px-2 py-1 border border-slate-300 rounded"
                              placeholder="0"
                            />
                          </td>
                          <td className="px-3 py-2">
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              value={item.width || ''}
                              onChange={(e) => updateItem(idx, 'width', e.target.value === '' ? 0 : parseFloat(e.target.value))}
                              className="w-20 px-2 py-1 border border-slate-300 rounded"
                              placeholder="0"
                            />
                          </td>
                          <td className="px-3 py-2">
                            <input
                              type="number"
                              min="0"
                              value={item.qty || ''}
                              onChange={(e) => updateItem(idx, 'qty', e.target.value === '' ? 0 : parseInt(e.target.value))}
                              className="w-16 px-2 py-1 border border-slate-300 rounded"
                              placeholder="0"
                            />
                          </td>
                          <td className="px-3 py-2 text-slate-600">{(item.area || 0).toFixed(2)}</td>
                          <td className="px-3 py-2">
                            <span className={item.chargeable_area > item.area ? 'text-amber-600 font-medium' : 'text-slate-600'}>
                              {(item.chargeable_area || 0).toFixed(2)}
                            </span>
                          </td>
                          <td className="px-3 py-2">
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              value={item.unit_price || ''}
                              onChange={(e) => updateItem(idx, 'unit_price', e.target.value === '' ? 0 : parseFloat(e.target.value))}
                              className="w-24 px-2 py-1 border border-slate-300 rounded"
                              placeholder="0"
                            />
                          </td>
                          <td className="px-3 py-2 text-slate-600">{(item.total || 0).toFixed(2)}</td>
                          <td className="px-3 py-2">
                            <div className="flex gap-1">
                              <button
                                type="button"
                                onClick={() => duplicateItem(idx)}
                                className="text-blue-600 hover:text-blue-800"
                                title="Duplicate item"
                              >
                                <Copy className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => removeItem(idx)}
                                className="text-red-600 hover:text-red-800"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="mt-4 flex justify-end">
                  <div className="space-y-2 text-sm min-w-[280px]">
                    <div className="flex justify-between gap-8 bg-blue-50 px-3 py-2 rounded-lg">
                      <span className="text-blue-800 font-medium">Total Chargeable Area:</span>
                      <span className="font-bold text-blue-900">{calculateTotals(formData.items).total_chargeable_area.toFixed(2)} m²</span>
                    </div>
                    <div className="flex justify-between gap-8">
                      <span className="text-slate-600">Subtotal:</span>
                      <span className="font-medium">AED {calculateTotals(formData.items).subtotal.toFixed(2)}</span>
                    </div>
                    {formData.discount_type !== 'none' && calculateTotals(formData.items).discount > 0 && (
                      <div className="flex justify-between gap-8 text-green-700">
                        <span>Discount {formData.discount_type === 'percentage' ? `(${formData.discount_value}%)` : ''}:</span>
                        <span className="font-medium">- AED {calculateTotals(formData.items).discount.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between gap-8">
                      <span className="text-slate-600">VAT (5%):</span>
                      <span className="font-medium">AED {calculateTotals(formData.items).vat_amount.toFixed(2)}</span>
                    </div>
                    {formData.shipping_amount > 0 && (
                      <div className="flex justify-between gap-8">
                        <span className="text-slate-600">Shipping:</span>
                        <span className="font-medium">AED {formData.shipping_amount.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-end gap-8 text-base font-bold border-t border-slate-200 pt-2">
                      <span>AED {calculateTotals(formData.items).total.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Discount Type</label>
                  <select
                    value={formData.discount_type}
                    onChange={(e) => setFormData({ ...formData, discount_type: e.target.value as any, discount_value: e.target.value === 'none' ? 0 : formData.discount_value })}
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-[#bb2738]"
                  >
                    <option value="none">No Discount</option>
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed">Fixed Amount (AED)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Discount Value {formData.discount_type === 'percentage' ? '(%)' : formData.discount_type === 'fixed' ? '(AED)' : ''}
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max={formData.discount_type === 'percentage' ? 100 : undefined}
                    value={formData.discount_value}
                    onChange={(e) => setFormData({ ...formData, discount_value: parseFloat(e.target.value) || 0 })}
                    disabled={formData.discount_type === 'none'}
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-[#bb2738] disabled:bg-slate-100 disabled:cursor-not-allowed"
                    placeholder="0.00"
                  />
                </div>
                <div className="flex items-end">
                  <div className="w-full p-3 bg-green-50 border border-green-200 rounded-lg">
                    <div className="text-xs text-green-700 mb-1">Discount Amount</div>
                    <div className="text-lg font-semibold text-green-800">
                      AED {calculateTotals(formData.items).discount.toFixed(2)}
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-2">Shipping Amount (AED)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.shipping_amount}
                    onChange={(e) => setFormData({ ...formData, shipping_amount: parseFloat(e.target.value) || 0 })}
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-[#bb2738]"
                    placeholder="0.00"
                  />
                  <p className="text-xs text-slate-500 mt-1">Shipping is added after VAT and is not included in VAT calculations</p>
                </div>
                <div className="flex items-end">
                  <div className="w-full p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="text-xs text-blue-700 mb-1">Total with Shipping</div>
                    <div className="text-lg font-semibold text-blue-800">
                      AED {calculateTotals(formData.items).total.toFixed(2)}
                    </div>
                  </div>
                </div>
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

            </form>

            <div className="flex justify-end gap-3 p-6 border-t border-slate-200 bg-white sticky bottom-0">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="px-6 py-2.5 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="quote-form"
                className="px-6 py-2.5 bg-[#bb2738] hover:bg-[#a01f2f] text-white rounded-lg transition-colors"
              >
                Save Quote
              </button>
            </div>
          </div>
        </div>
      )}

      {showBulkImport && (
        <QuoteBulkImport
          onClose={() => setShowBulkImport(false)}
          onImportComplete={() => {
            fetchData();
            setShowBulkImport(false);
          }}
        />
      )}

      {selectedQuote && showPDFPreview && (
        <PDFPreviewModal
          isOpen={showPDFPreview}
          onClose={() => {
            setShowPDFPreview(false);
            setSelectedQuote(null);
          }}
          pdfGenerator={() => generatePDFForPreview()}
          filename={`Quote_${selectedQuote.quote_number}.pdf`}
          title={`Quote ${selectedQuote.quote_number} - Preview`}
          onEmail={() => {
            setShowPDFPreview(false);
            handleEmailPDF(selectedQuote);
          }}
        />
      )}

      {selectedQuote && showEmailModal && pdfBlob && (
        <EmailPDFModal
          isOpen={showEmailModal}
          onClose={() => {
            setShowEmailModal(false);
            setSelectedQuote(null);
            setPdfBlob(null);
          }}
          documentType="quote"
          documentId={selectedQuote.id}
          documentNumber={selectedQuote.quote_number}
          recipientEmail={selectedQuote.customers?.email}
          recipientName={selectedQuote.customers?.name}
          pdfBlob={pdfBlob}
          filename={`Quote_${selectedQuote.quote_number}.pdf`}
        />
      )}
    </div>
  );
}
