import { useState } from 'react';
import { supabase } from '../lib/supabase';
import * as XLSX from 'xlsx';
import { X, Upload, Download, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';

type ValidationError = {
  row: number;
  field: string;
  message: string;
};

type Props = {
  onClose: () => void;
  onImportComplete: () => void;
};

export function QuoteBulkImport({ onClose, onImportComplete }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [errors, setErrors] = useState<ValidationError[]>([]);
  const [successCount, setSuccessCount] = useState(0);
  const [showResults, setShowResults] = useState(false);

  const downloadTemplate = () => {
    const templateData = [
      [
        'customer_name',
        'customer_phone',
        'customer_email',
        'location',
        'type',
        'height',
        'width',
        'qty',
        'unit_price',
        'remarks',
        'valid_until'
      ],
      [
        'John Doe',
        '+971501234567',
        'john@example.com',
        '120 series thermal break s',
        'window',
        '158',
        '158',
        '1',
        '8',
        'Sample quote',
        '2025/12/31'
      ],
      [
        'Jane Smith',
        '+971509876543',
        'jane@example.com',
        'Living Room',
        'door',
        '200',
        '90',
        '2',
        '15',
        'Urgent',
        '2025/11/30'
      ]
    ];

    const worksheet = XLSX.utils.aoa_to_sheet(templateData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Quote Template');

    const colWidths = [
      { wch: 20 },
      { wch: 15 },
      { wch: 25 },
      { wch: 25 },
      { wch: 15 },
      { wch: 10 },
      { wch: 10 },
      { wch: 8 },
      { wch: 12 },
      { wch: 30 },
      { wch: 15 }
    ];
    worksheet['!cols'] = colWidths;

    XLSX.writeFile(workbook, 'Quote_Import_Template.xlsx');
  };

  const validateRow = (row: any, rowIndex: number): ValidationError[] => {
    const errors: ValidationError[] = [];

    if (!row.customer_name || String(row.customer_name).trim() === '') {
      errors.push({ row: rowIndex, field: 'customer_name', message: 'Customer name is required' });
    }

    if (!row.customer_phone || String(row.customer_phone).trim() === '') {
      errors.push({ row: rowIndex, field: 'customer_phone', message: 'Customer phone is required' });
    }

    if (!row.location || String(row.location).trim() === '') {
      errors.push({ row: rowIndex, field: 'location', message: 'Location is required' });
    }

    if (!row.type || String(row.type).trim() === '') {
      errors.push({ row: rowIndex, field: 'type', message: 'Type is required' });
    }

    const height = parseFloat(row.height);
    if (isNaN(height) || height <= 0) {
      errors.push({ row: rowIndex, field: 'height', message: 'Height must be a positive number' });
    }

    const width = parseFloat(row.width);
    if (isNaN(width) || width <= 0) {
      errors.push({ row: rowIndex, field: 'width', message: 'Width must be a positive number' });
    }

    const qty = parseInt(row.qty);
    if (isNaN(qty) || qty <= 0) {
      errors.push({ row: rowIndex, field: 'qty', message: 'Quantity must be a positive number' });
    }

    const unitPrice = parseFloat(row.unit_price);
    if (isNaN(unitPrice) || unitPrice <= 0) {
      errors.push({ row: rowIndex, field: 'unit_price', message: 'Unit price must be a positive number' });
    }

    return errors;
  };

  const processFile = async () => {
    if (!file) {
      alert('Please select a file to import');
      return;
    }

    setImporting(true);
    setProgress(0);
    setErrors([]);
    setSuccessCount(0);
    setShowResults(false);

    try {
      const fileBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(fileBuffer, { type: 'array' });
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      if (jsonData.length === 0) {
        alert('The file is empty or has no data rows');
        setImporting(false);
        return;
      }

      const allErrors: ValidationError[] = [];
      const quotesMap = new Map<string, any>();

      jsonData.forEach((row: any, index) => {
        const rowNum = index + 2;
        const rowErrors = validateRow(row, rowNum);

        if (rowErrors.length > 0) {
          allErrors.push(...rowErrors);
        } else {
          const phone = String(row.customer_phone).trim();

          if (!quotesMap.has(phone)) {
            quotesMap.set(phone, {
              customer_name: String(row.customer_name).trim(),
              customer_phone: phone,
              customer_email: row.customer_email ? String(row.customer_email).trim() : null,
              items: [],
              remarks: row.remarks ? String(row.remarks).trim() : '',
              valid_until: row.valid_until ? String(row.valid_until).trim() : null
            });
          }

          const quote = quotesMap.get(phone);
          const height = parseFloat(row.height) || 0;
          const width = parseFloat(row.width) || 0;
          const qty = parseInt(row.qty) || 0;
          const unit_price = parseFloat(row.unit_price) || 0;

          const area = height > 0 && width > 0 && qty > 0
            ? (height * width * qty) / 10000
            : 0;
          const total = area > 0 && unit_price > 0
            ? area * unit_price
            : 0;

          quote.items.push({
            location: String(row.location).trim(),
            type: String(row.type).trim(),
            height,
            width,
            qty,
            area,
            unit_price,
            total
          });
        }
      });

      if (allErrors.length > 0) {
        setErrors(allErrors);
        setShowResults(true);
        setImporting(false);
        return;
      }

      const quotes = Array.from(quotesMap.values());
      let importedCount = 0;
      const totalQuotes = quotes.length;

      for (const quoteData of quotes) {
        try {
          let customer = await supabase
            .from('customers')
            .select('*')
            .eq('phone', quoteData.customer_phone)
            .maybeSingle();

          if (!customer.data) {
            const newCustomer = await supabase
              .from('customers')
              .insert([{
                name: quoteData.customer_name,
                phone: quoteData.customer_phone,
                email: quoteData.customer_email,
                status: 'Lead'
              }])
              .select()
              .single();

            customer = newCustomer;
          }

          if (customer.data) {
            const subtotal = quoteData.items.reduce((sum: number, item: any) => sum + item.total, 0);
            const vat_amount = subtotal * 0.05;
            const total = subtotal + vat_amount;

            const quoteNumber = `QT-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;

            await supabase.from('quotes').insert([{
              customer_id: customer.data.id,
              quote_number: quoteNumber,
              items: quoteData.items,
              subtotal,
              vat_amount,
              discount: 0,
              total,
              remarks: quoteData.remarks,
              status: 'Draft',
              valid_until: quoteData.valid_until
            }]);

            importedCount++;
          }
        } catch (error) {
          console.error('Error importing quote:', error);
          allErrors.push({
            row: 0,
            field: 'import',
            message: `Failed to import quote for ${quoteData.customer_name}: ${error}`
          });
        }

        setProgress(Math.round((importedCount / totalQuotes) * 100));
      }

      setSuccessCount(importedCount);
      setErrors(allErrors);
      setShowResults(true);

      if (importedCount > 0) {
        onImportComplete();
      }
    } catch (error) {
      console.error('Error processing file:', error);
      alert('Failed to process file. Please check the format and try again.');
    } finally {
      setImporting(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      const fileExtension = selectedFile.name.split('.').pop()?.toLowerCase();
      if (fileExtension === 'xlsx' || fileExtension === 'xls') {
        setFile(selectedFile);
        setShowResults(false);
        setErrors([]);
      } else {
        alert('Please select an Excel file (.xlsx or .xls)');
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b border-slate-200 sticky top-0 bg-white z-10">
          <h2 className="text-xl font-bold text-slate-800">Bulk Import Quotes</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 mb-2">Instructions</h3>
            <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
              <li>Download the template file to see the required format</li>
              <li>Fill in your quote data following the template structure</li>
              <li>Multiple rows with the same customer phone will be grouped into one quote</li>
              <li>Customers will be created automatically if they don't exist</li>
              <li>All quotes will be imported with "Draft" status</li>
            </ul>
          </div>

          <div className="flex gap-3">
            <button
              onClick={downloadTemplate}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 border-2 border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors font-medium"
            >
              <Download className="w-5 h-5" />
              Download Template
            </button>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Select Excel File (.xlsx or .xls)
            </label>
            <div className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center hover:border-slate-400 transition-colors">
              <input
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileChange}
                className="hidden"
                id="file-upload"
                disabled={importing}
              />
              <label
                htmlFor="file-upload"
                className="cursor-pointer flex flex-col items-center gap-2"
              >
                <Upload className="w-12 h-12 text-slate-400" />
                <span className="text-sm font-medium text-slate-700">
                  {file ? file.name : 'Click to select file or drag and drop'}
                </span>
                <span className="text-xs text-slate-500">Excel files only (.xlsx, .xls)</span>
              </label>
            </div>
          </div>

          {importing && (
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <Loader2 className="w-5 h-5 text-[#bb2738] animate-spin" />
                <span className="text-sm font-medium text-slate-700">Importing quotes... {progress}%</span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2">
                <div
                  className="bg-[#bb2738] h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {showResults && (
            <div className="space-y-4">
              {successCount > 0 && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-green-900">Import Successful</h4>
                    <p className="text-sm text-green-800">
                      Successfully imported {successCount} quote{successCount > 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
              )}

              {errors.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-start gap-3 mb-3">
                    <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-red-900">Import Errors</h4>
                      <p className="text-sm text-red-800">
                        {errors.length} error{errors.length > 1 ? 's' : ''} found
                      </p>
                    </div>
                  </div>
                  <div className="max-h-48 overflow-y-auto space-y-2">
                    {errors.map((error, idx) => (
                      <div key={idx} className="text-sm text-red-800 bg-white rounded p-2">
                        <span className="font-medium">Row {error.row}:</span> {error.field} - {error.message}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
            <button
              onClick={onClose}
              className="px-6 py-2.5 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
              disabled={importing}
            >
              {showResults && successCount > 0 ? 'Close' : 'Cancel'}
            </button>
            <button
              onClick={processFile}
              disabled={!file || importing}
              className="px-6 py-2.5 bg-[#bb2738] hover:bg-[#a01f2f] text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {importing ? 'Importing...' : 'Import Quotes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
