import { useState, useEffect } from 'react';
import { X, Download, Mail, Printer, ZoomIn, ZoomOut, Maximize2, Minimize2 } from 'lucide-react';
import jsPDF from 'jspdf';

interface PDFPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  pdfGenerator: () => jsPDF | Promise<jsPDF>;
  filename: string;
  title: string;
  onEmail?: () => void;
}

export function PDFPreviewModal({ isOpen, onClose, pdfGenerator, filename, title, onEmail }: PDFPreviewModalProps) {
  const [pdfUrl, setPdfUrl] = useState<string>('');
  const [zoom, setZoom] = useState(100);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      generatePreview();
    }

    return () => {
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl);
      }
    };
  }, [isOpen]);

  const generatePreview = async () => {
    setLoading(true);
    try {
      const docOrPromise = pdfGenerator();
      const doc = docOrPromise instanceof Promise ? await docOrPromise : docOrPromise;

      if (!doc || typeof doc.output !== 'function') {
        throw new Error('Invalid PDF document returned from generator');
      }

      const blob = doc.output('blob');
      const url = URL.createObjectURL(blob);
      setPdfUrl(url);
    } catch (error) {
      console.error('Error generating PDF preview:', error);
      alert(`Failed to generate PDF preview: ${error instanceof Error ? error.message : 'Unknown error'}`);
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    try {
      const docOrPromise = pdfGenerator();
      const doc = docOrPromise instanceof Promise ? await docOrPromise : docOrPromise;
      doc.save(filename);
    } catch (error) {
      console.error('Error downloading PDF:', error);
      alert('Failed to download PDF');
    }
  };

  const handlePrint = () => {
    if (pdfUrl) {
      const printWindow = window.open(pdfUrl);
      printWindow?.addEventListener('load', () => {
        printWindow.print();
      });
    }
  };

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 25, 200));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 25, 50));
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className={`bg-white rounded-xl shadow-2xl flex flex-col transition-all duration-300 ${isFullscreen ? 'w-full h-full' : 'w-full max-w-5xl h-[90vh]'}`}>
        <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-blue-50">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
            <div>
              <h2 className="text-lg font-bold text-slate-800">{title}</h2>
              <p className="text-sm text-slate-600">Preview your PDF before downloading</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleZoomOut}
              disabled={zoom <= 50}
              className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-50"
              title="Zoom Out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="text-sm font-medium text-slate-700 min-w-[60px] text-center">{zoom}%</span>
            <button
              onClick={handleZoomIn}
              disabled={zoom >= 200}
              className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-50"
              title="Zoom In"
            >
              <ZoomIn className="w-4 h-4" />
            </button>

            <div className="w-px h-6 bg-slate-300 mx-2"></div>

            <button
              onClick={toggleFullscreen}
              className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>

            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-3 py-2 text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
              title="Print"
            >
              <Printer className="w-4 h-4" />
              <span className="text-sm font-medium hidden sm:inline">Print</span>
            </button>

            {onEmail && (
              <button
                onClick={onEmail}
                className="flex items-center gap-2 px-3 py-2 text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                title="Email PDF"
              >
                <Mail className="w-4 h-4" />
                <span className="text-sm font-medium hidden sm:inline">Email</span>
              </button>
            )}

            <button
              onClick={handleDownload}
              className="flex items-center gap-2 px-4 py-2 bg-[#bb2738] text-white rounded-lg hover:bg-[#a01f2f] transition-colors"
              title="Download"
            >
              <Download className="w-4 h-4" />
              <span className="text-sm font-medium">Download</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors ml-2"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-auto bg-slate-100 p-4">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-[#bb2738] mx-auto mb-4"></div>
                <p className="text-slate-600 font-medium">Generating PDF preview...</p>
              </div>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center">
              <iframe
                src={pdfUrl}
                className="w-full h-full rounded-lg shadow-xl border-2 border-slate-300 bg-white"
                style={{
                  transform: `scale(${zoom / 100})`,
                  transformOrigin: 'top center',
                  minHeight: '100%'
                }}
                title="PDF Preview"
              />
            </div>
          )}
        </div>

        <div className="p-4 border-t border-slate-200 bg-slate-50">
          <div className="flex items-center justify-between text-sm text-slate-600">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-blue-500"></div>
              <span>Ready to download: <span className="font-medium text-slate-800">{filename}</span></span>
            </div>
            <span className="text-xs">Use zoom controls to adjust view</span>
          </div>
        </div>
      </div>
    </div>
  );
}
