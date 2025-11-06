import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { FileUpload } from './FileUpload';
import { useToast } from '../contexts/ToastContext';
import { X, Download, Trash2, FileText, Image as ImageIcon, File, Eye } from 'lucide-react';

interface Attachment {
  id: string;
  entity_type: string;
  entity_id: string;
  file_name: string;
  file_url: string;
  file_type: string;
  created_at: string;
}

interface CustomerAttachmentsProps {
  customerId: string;
  customerName: string;
  onClose: () => void;
}

export function CustomerAttachments({ customerId, customerName, onClose }: CustomerAttachmentsProps) {
  const { success, error: showError } = useToast();
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  useEffect(() => {
    fetchAttachments();
  }, [customerId]);

  const fetchAttachments = async () => {
    try {
      const { data, error } = await supabase
        .from('attachments')
        .select('*')
        .eq('entity_type', 'customer')
        .eq('entity_id', customerId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAttachments(data || []);
    } catch (err) {
      console.error('Error fetching attachments:', err);
      showError('Failed to load attachments');
    } finally {
      setLoading(false);
    }
  };

  const handleFilesSelected = (files: File[]) => {
    setSelectedFiles(files);
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) {
      showError('Please select files to upload');
      return;
    }

    setUploading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      for (const file of selectedFiles) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${customerId}-${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `customer-documents/${customerId}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('uploads')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { error: insertError } = await supabase
          .from('attachments')
          .insert([{
            entity_type: 'customer',
            entity_id: customerId,
            file_name: file.name,
            file_url: filePath,
            file_type: file.type,
          }]);

        if (insertError) throw insertError;
      }

      success(`Successfully uploaded ${selectedFiles.length} file(s)`);
      setSelectedFiles([]);
      fetchAttachments();
    } catch (err) {
      console.error('Error uploading files:', err);
      showError('Failed to upload files');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (attachment: Attachment) => {
    if (!confirm(`Are you sure you want to delete ${attachment.file_name}?`)) return;

    try {
      const { error: storageError } = await supabase.storage
        .from('uploads')
        .remove([attachment.file_url]);

      if (storageError) throw storageError;

      const { error: dbError } = await supabase
        .from('attachments')
        .delete()
        .eq('id', attachment.id);

      if (dbError) throw dbError;

      success('File deleted successfully');
      fetchAttachments();
    } catch (err) {
      console.error('Error deleting file:', err);
      showError('Failed to delete file');
    }
  };

  const handleDownload = async (attachment: Attachment) => {
    try {
      const { data, error } = await supabase.storage
        .from('uploads')
        .download(attachment.file_url);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = attachment.file_name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error downloading file:', err);
      showError('Failed to download file');
    }
  };

  const handleView = async (attachment: Attachment) => {
    try {
      const { data, error } = await supabase.storage
        .from('uploads')
        .createSignedUrl(attachment.file_url, 3600);

      if (error) throw error;

      window.open(data.signedUrl, '_blank');
    } catch (err) {
      console.error('Error viewing file:', err);
      showError('Failed to view file');
    }
  };

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith('image/')) {
      return <ImageIcon className="w-5 h-5 text-blue-500" />;
    }
    if (fileType === 'application/pdf') {
      return <FileText className="w-5 h-5 text-red-500" />;
    }
    return <File className="w-5 h-5 text-slate-500" />;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex justify-between items-center p-6 border-b border-slate-200">
          <div>
            <h2 className="text-xl font-bold text-slate-800">Customer Documents</h2>
            <p className="text-sm text-slate-600 mt-1">{customerName}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="bg-slate-50 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">Upload New Files</h3>
            <FileUpload
              onFilesSelected={handleFilesSelected}
              maxFiles={10}
              maxSizeMB={10}
              acceptedTypes={['image/jpeg', 'image/png', 'image/jpg', 'application/pdf']}
              multiple={true}
            />
            {selectedFiles.length > 0 && (
              <div className="mt-4 flex justify-end">
                <button
                  onClick={handleUpload}
                  disabled={uploading}
                  className="px-6 py-2.5 bg-[#bb2738] hover:bg-[#a01f2f] text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {uploading ? 'Uploading...' : `Upload ${selectedFiles.length} File(s)`}
                </button>
              </div>
            )}
          </div>

          <div>
            <h3 className="text-lg font-semibold text-slate-800 mb-4">
              Uploaded Documents ({attachments.length})
            </h3>

            {loading ? (
              <div className="text-center py-8 text-slate-500">Loading...</div>
            ) : attachments.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                No documents uploaded yet
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3">
                {attachments.map((attachment) => (
                  <div
                    key={attachment.id}
                    className="flex items-center gap-4 p-4 bg-white border border-slate-200 rounded-lg hover:border-slate-300 transition-colors"
                  >
                    {getFileIcon(attachment.file_type)}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-800 truncate">
                        {attachment.file_name}
                      </p>
                      <p className="text-xs text-slate-500">
                        Uploaded {formatDate(attachment.created_at)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleView(attachment)}
                        className="p-2 hover:bg-blue-50 text-blue-600 rounded-lg transition-colors"
                        title="View"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDownload(attachment)}
                        className="p-2 hover:bg-green-50 text-green-600 rounded-lg transition-colors"
                        title="Download"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(attachment)}
                        className="p-2 hover:bg-red-50 text-red-600 rounded-lg transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="border-t border-slate-200 p-6 bg-slate-50">
          <button
            onClick={onClose}
            className="w-full px-6 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
