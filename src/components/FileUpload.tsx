import { useState, useCallback } from 'react';
import { Upload, X, File, Image, FileText } from 'lucide-react';

interface FileUploadProps {
  onFilesSelected: (files: File[]) => void;
  maxFiles?: number;
  maxSizeMB?: number;
  acceptedTypes?: string[];
  multiple?: boolean;
}

export function FileUpload({
  onFilesSelected,
  maxFiles = 5,
  maxSizeMB = 10,
  acceptedTypes = ['image/*', 'application/pdf', '.doc', '.docx', '.xls', '.xlsx'],
  multiple = true
}: FileUploadProps) {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [errors, setErrors] = useState<string[]>([]);

  const validateFile = (file: File): string | null => {
    const maxSize = maxSizeMB * 1024 * 1024;

    if (file.size > maxSize) {
      return `${file.name} exceeds ${maxSizeMB}MB limit`;
    }

    const fileType = file.type || '';
    const fileName = file.name.toLowerCase();
    const isAccepted = acceptedTypes.some(type => {
      if (type.startsWith('.')) {
        return fileName.endsWith(type);
      }
      if (type.includes('*')) {
        const baseType = type.split('/')[0];
        return fileType.startsWith(baseType);
      }
      return fileType === type;
    });

    if (!isAccepted) {
      return `${file.name} is not an accepted file type`;
    }

    return null;
  };

  const handleFiles = useCallback((files: FileList | null) => {
    if (!files) return;

    const newErrors: string[] = [];
    const validFiles: File[] = [];

    const filesToProcess = Array.from(files).slice(0, maxFiles - selectedFiles.length);

    filesToProcess.forEach(file => {
      const error = validateFile(file);
      if (error) {
        newErrors.push(error);
      } else {
        validFiles.push(file);
      }
    });

    if (filesToProcess.length < files.length) {
      newErrors.push(`Only ${maxFiles} files allowed. Extra files ignored.`);
    }

    setErrors(newErrors);

    if (validFiles.length > 0) {
      const updatedFiles = [...selectedFiles, ...validFiles];
      setSelectedFiles(updatedFiles);
      onFilesSelected(updatedFiles);
    }
  }, [selectedFiles, maxFiles, onFilesSelected]);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  }, [handleFiles]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files);
    }
  }, [handleFiles]);

  const removeFile = (index: number) => {
    const updatedFiles = selectedFiles.filter((_, i) => i !== index);
    setSelectedFiles(updatedFiles);
    onFilesSelected(updatedFiles);
  };

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) {
      return <Image className="w-5 h-5 text-blue-500" />;
    }
    if (file.type === 'application/pdf') {
      return <FileText className="w-5 h-5 text-red-500" />;
    }
    return <File className="w-5 h-5 text-slate-500" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div className="space-y-4">
      <div
        className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          dragActive
            ? 'border-[#bb2738] bg-red-50'
            : 'border-slate-300 hover:border-slate-400 bg-slate-50'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          type="file"
          multiple={multiple}
          onChange={handleChange}
          accept={acceptedTypes.join(',')}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
        <Upload className="w-12 h-12 text-slate-400 mx-auto mb-4" />
        <p className="text-slate-700 font-medium mb-1">
          Drag and drop files here, or click to browse
        </p>
        <p className="text-sm text-slate-500">
          Maximum {maxFiles} files, up to {maxSizeMB}MB each
        </p>
      </div>

      {errors.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          {errors.map((error, index) => (
            <p key={index} className="text-sm text-red-700">{error}</p>
          ))}
        </div>
      )}

      {selectedFiles.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-slate-700">
            Selected Files ({selectedFiles.length}/{maxFiles})
          </p>
          {selectedFiles.map((file, index) => (
            <div
              key={index}
              className="flex items-center gap-3 p-3 bg-white border border-slate-200 rounded-lg"
            >
              {getFileIcon(file)}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-800 truncate">{file.name}</p>
                <p className="text-xs text-slate-500">{formatFileSize(file.size)}</p>
              </div>
              <button
                onClick={() => removeFile(index)}
                className="flex-shrink-0 p-1 hover:bg-slate-100 rounded transition-colors"
              >
                <X className="w-4 h-4 text-slate-500" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
