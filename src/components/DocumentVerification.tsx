import { useState, useEffect } from 'react';
import { CheckCircle2, XCircle, FileText, Calendar, DollarSign, User, Building2, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useBrand } from '../contexts/BrandContext';

interface DocumentVerificationProps {
  documentType: string;
  documentId: string;
}

interface DocumentData {
  number: string;
  date: string;
  total?: number;
  customerName?: string;
  customerEmail?: string;
  status?: string;
  isValid: boolean;
}

export function DocumentVerification({ documentType, documentId }: DocumentVerificationProps) {
  const [loading, setLoading] = useState(true);
  const [documentData, setDocumentData] = useState<DocumentData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { logo, primaryColor, companyName } = useBrand();

  useEffect(() => {
    fetchDocumentData();
  }, [documentType, documentId]);

  const fetchDocumentData = async () => {
    try {
      setLoading(true);
      setError(null);

      let data: any = null;
      let tableName = '';
      let numberField = '';
      let dateField = '';
      let totalField = '';

      switch (documentType) {
        case 'quote':
          tableName = 'quotes';
          numberField = 'quote_number';
          dateField = 'created_at';
          totalField = 'total';
          break;
        case 'invoice':
          tableName = 'invoices';
          numberField = 'invoice_number';
          dateField = 'created_at';
          totalField = 'total_amount';
          break;
        case 'receipt':
          tableName = 'receipts';
          numberField = 'receipt_number';
          dateField = 'payment_date';
          totalField = 'amount_paid';
          break;
        case 'order':
          tableName = 'orders';
          numberField = 'order_number';
          dateField = 'order_date';
          totalField = '';
          break;
        case 'warranty':
          tableName = 'warranties';
          numberField = 'warranty_number';
          dateField = 'start_date';
          totalField = '';
          break;
        case 'sitevisit':
          tableName = 'site_visits';
          numberField = 'id';
          dateField = 'visit_date';
          totalField = 'payment_amount';
          break;
        default:
          setError('Invalid document type');
          setLoading(false);
          return;
      }

      const { data: document, error: fetchError } = await supabase
        .from(tableName)
        .select(`
          *,
          customers (
            name,
            email
          )
        `)
        .eq('id', documentId)
        .single();

      if (fetchError || !document) {
        setError('Document not found');
        setLoading(false);
        return;
      }

      const documentNumber = documentType === 'sitevisit'
        ? `SV-${document.id.substring(0, 8)}`
        : document[numberField];

      setDocumentData({
        number: documentNumber,
        date: new Date(document[dateField]).toLocaleDateString(),
        total: totalField ? document[totalField] : undefined,
        customerName: document.customers?.name,
        customerEmail: document.customers?.email,
        status: document.status,
        isValid: true,
      });
    } catch (err) {
      console.error('Error fetching document:', err);
      setError('Failed to verify document');
    } finally {
      setLoading(false);
    }
  };

  const getDocumentTypeLabel = () => {
    switch (documentType) {
      case 'quote': return 'Quotation';
      case 'invoice': return 'Invoice';
      case 'receipt': return 'Receipt';
      case 'order': return 'Order';
      case 'warranty': return 'Warranty';
      case 'sitevisit': return 'Site Visit';
      default: return 'Document';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4" style={{ color: primaryColor }} />
          <p className="text-slate-600 font-medium">Verifying document...</p>
        </div>
      </div>
    );
  }

  if (error || !documentData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-red-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <XCircle className="w-12 h-12 text-red-600" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-3">Document Not Found</h1>
          <p className="text-slate-600 mb-6">{error || 'The document you are trying to verify does not exist or has been removed.'}</p>
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-sm text-red-700">
              This QR code may be invalid or the document may have been deleted from the system.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl overflow-hidden max-w-lg w-full">
        <div className="p-8 pb-6 text-center" style={{ backgroundColor: primaryColor }}>
          {logo && (
            <div className="mb-4">
              <img src={logo} alt={companyName} className="h-16 mx-auto" />
            </div>
          )}
          <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
            <CheckCircle2 className="w-12 h-12" style={{ color: primaryColor }} />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Document Verified</h1>
          <p className="text-white/90">This is an authentic {getDocumentTypeLabel().toLowerCase()}</p>
        </div>

        <div className="p-8">
          <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl p-6 mb-6 border border-emerald-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center shadow-sm">
                <FileText className="w-6 h-6" style={{ color: primaryColor }} />
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">
                  {getDocumentTypeLabel()}
                </p>
                <p className="text-xl font-bold text-slate-900">{documentData.number}</p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-3 text-slate-700">
                <Calendar className="w-5 h-5 text-slate-400" />
                <div>
                  <p className="text-xs text-slate-500">Date</p>
                  <p className="font-semibold">{documentData.date}</p>
                </div>
              </div>

              {documentData.total !== undefined && (
                <div className="flex items-center gap-3 text-slate-700">
                  <DollarSign className="w-5 h-5 text-slate-400" />
                  <div>
                    <p className="text-xs text-slate-500">Amount</p>
                    <p className="font-semibold text-lg">${documentData.total.toFixed(2)}</p>
                  </div>
                </div>
              )}

              {documentData.status && (
                <div className="flex items-center gap-3 text-slate-700">
                  <FileText className="w-5 h-5 text-slate-400" />
                  <div>
                    <p className="text-xs text-slate-500">Status</p>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800 capitalize">
                      {documentData.status}
                    </span>
                  </div>
                </div>
              )}

              {documentData.customerName && (
                <div className="flex items-center gap-3 text-slate-700">
                  <User className="w-5 h-5 text-slate-400" />
                  <div>
                    <p className="text-xs text-slate-500">Customer</p>
                    <p className="font-semibold">{documentData.customerName}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl p-4 text-center shadow-lg">
            <div className="flex items-center justify-center gap-2 text-white">
              <Building2 className="w-5 h-5" />
              <p className="font-semibold">{companyName}</p>
            </div>
            <p className="text-white/80 text-sm mt-1">Verified on {new Date().toLocaleDateString()}</p>
          </div>

          <div className="mt-6 text-center">
            <p className="text-xs text-slate-500">
              This document has been verified against our records and is confirmed to be authentic.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
