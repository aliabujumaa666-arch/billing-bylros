import { useState } from 'react';
import { supabase } from '../lib/supabase';
import * as XLSX from 'xlsx';
import { X, Upload, Download, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { useToast } from '../contexts/ToastContext';

interface Props {
  onClose: () => void;
  onImportComplete: () => void;
}

export function CustomerBulkImport({ onClose, onImportComplete }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [results, setResults] = useState<{ success: number; failed: number; errors: string[] } | null>(null);
  const { success, error: showError } = useToast();

  const downloadTemplate = () => {
    const template = [
      {
        name: 'John Doe',
        phone: '+971501234567',
        email: 'john@example.com',
        company: 'ABC Company',
        address: 'Dubai, UAE',
        customer_type: 'individual',
        status: 'active'
      }
    ];

    const ws = XLSX.utils.json_to_sheet(template);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Customers Template');
    XLSX.writeFile(wb, 'customers_import_template.xlsx');
    success('Template downloaded successfully');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setResults(null);
    }
  };

  const validateRow = (row: any, rowIndex: number): string | null => {
    if (!row.name || row.name.trim() === '') {
      return `Row ${rowIndex}: Name is required`;
    }
    if (!row.phone || row.phone.trim() === '') {
      return `Row ${rowIndex}: Phone is required`;
    }
    if (row.customer_type && !['individual', 'business'].includes(row.customer_type)) {
      return `Row ${rowIndex}: customer_type must be 'individual' or 'business'`;
    }
    if (row.status && !['active', 'inactive', 'suspended'].includes(row.status)) {
      return `Row ${rowIndex}: status must be 'active', 'inactive', or 'suspended'`;
    }
    return null;
  };

  const handleImport = async () => {
    if (!file) {
      showError('Please select a file');
      return;
    }

    setImporting(true);
    const errors: string[] = [];
    let successCount = 0;
    let failedCount = 0;

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      if (jsonData.length === 0) {
        showError('The file is empty');
        setImporting(false);
        return;
      }

      for (let i = 0; i < jsonData.length; i++) {
        const row: any = jsonData[i];
        const validationError = validateRow(row, i + 2);

        if (validationError) {
          errors.push(validationError);
          failedCount++;
          continue;
        }

        const customerData = {
          name: row.name.trim(),
          phone: row.phone.trim(),
          email: row.email?.trim() || null,
          company: row.company?.trim() || null,
          address: row.address?.trim() || null,
          customer_type: row.customer_type || 'individual',
          status: row.status || 'active',
          notes: row.notes?.trim() || null,
        };

        const { error: insertError } = await supabase
          .from('customers')
          .insert([customerData]);

        if (insertError) {
          errors.push(`Row ${i + 2}: ${insertError.message}`);
          failedCount++;
        } else {
          successCount++;
        }
      }

      setResults({ success: successCount, failed: failedCount, errors });

      if (successCount > 0) {
        success(`Successfully imported ${successCount} customer(s)`);
        onImportComplete();
      }

      if (failedCount > 0) {
        showError(`Failed to import ${failedCount} customer(s)`);
      }
    } catch (err) {
      showError('Failed to process file. Please check the format.');
      console.error(err);
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-800">Bulk Import Customers</h2>
            <p className="text-sm text-slate-600 mt-1">Import multiple customers from Excel or CSV file</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-blue-800 mb-2">Import Instructions:</p>
                <ul className="text-sm text-blue-700 space-y-1 list-disc list-inside">
                  <li>Download the template file and fill in your customer data</li>
                  <li>Required fields: name, phone</li>
                  <li>Optional fields: email, company, address, notes</li>
                  <li>customer_type: individual or business (default: individual)</li>
                  <li>status: active, inactive, or suspended (default: active)</li>
                </ul>
              </div>
            </div>
          </div>

          <button
            onClick={downloadTemplate}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors"
          >
            <Download className="w-5 h-5" />
            Download Template File
          </button>

          <div className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center">
            <input
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileChange}
              className="hidden"
              id="file-upload"
            />
            <label htmlFor="file-upload" className="cursor-pointer">
              <Upload className="w-12 h-12 text-slate-400 mx-auto mb-3" />
              <p className="text-slate-700 font-medium mb-1">
                {file ? file.name : 'Click to select file or drag and drop'}
              </p>
              <p className="text-sm text-slate-500">Excel (.xlsx, .xls) or CSV files</p>
            </label>
          </div>

          {results && (
            <div className="space-y-3">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 text-green-700">
                  <CheckCircle2 className="w-5 h-5" />
                  <span className="font-medium">{results.success} succeeded</span>
                </div>
                {results.failed > 0 && (
                  <div className="flex items-center gap-2 text-red-700">
                    <AlertCircle className="w-5 h-5" />
                    <span className="font-medium">{results.failed} failed</span>
                  </div>
                )}
              </div>

              {results.errors.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 max-h-48 overflow-y-auto">
                  <p className="text-sm font-medium text-red-800 mb-2">Errors:</p>
                  <ul className="text-sm text-red-700 space-y-1">
                    {results.errors.map((err, i) => (
                      <li key={i}>{err}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleImport}
              disabled={!file || importing}
              className="flex-1 px-4 py-2 bg-[#bb2738] text-white rounded-lg hover:bg-[#a01f2f] disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              {importing ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Importing...
                </>
              ) : (
                <>
                  <Upload className="w-5 h-5" />
                  Import Customers
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
