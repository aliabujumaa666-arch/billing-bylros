import { useState, useEffect } from 'react';
import { Building2, Calendar, MapPin, Upload, ArrowLeft, CheckCircle, AlertCircle, Loader2, X, Image as ImageIcon } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface WorkerPhotoUploadProps {
  onBack?: () => void;
}

interface UploadedPhoto {
  file: File;
  preview: string;
  photoType: string;
  caption: string;
}

export function WorkerPhotoUpload({ onBack }: WorkerPhotoUploadProps) {
  const [step, setStep] = useState<'loading' | 'form' | 'uploading' | 'success' | 'error'>('loading');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [task, setTask] = useState<any>(null);
  const [workerName, setWorkerName] = useState('');
  const [photos, setPhotos] = useState<UploadedPhoto[]>([]);
  const [currentPhotoType, setCurrentPhotoType] = useState('before');
  const [currentCaption, setCurrentCaption] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');

    if (token) {
      fetchTask(token);
    } else {
      setError('Invalid upload link');
      setStep('error');
    }
  }, []);

  const fetchTask = async (token: string) => {
    try {
      const { data, error } = await supabase
        .from('installation_tasks')
        .select(`
          *,
          orders(
            order_number,
            customers(name)
          )
        `)
        .eq('upload_link_token', token)
        .maybeSingle();

      if (error || !data) {
        setError('Upload link not found or has expired');
        setStep('error');
        return;
      }

      if (!data.upload_link_active) {
        setError('This upload link has been deactivated');
        setStep('error');
        return;
      }

      if (new Date(data.upload_link_expires_at) < new Date()) {
        setError('This upload link has expired');
        setStep('error');
        return;
      }

      if (data.status === 'completed') {
        setError('This installation task has been completed and no longer accepts uploads');
        setStep('error');
        return;
      }

      setTask(data);
      setStep('form');
    } catch (err) {
      console.error('Error fetching task:', err);
      setError('Failed to load upload information');
      setStep('error');
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];

    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      alert('File size must be less than 10MB');
      return;
    }

    const preview = URL.createObjectURL(file);
    setPhotos([...photos, {
      file,
      preview,
      photoType: currentPhotoType,
      caption: currentCaption,
    }]);

    setCurrentCaption('');
    e.target.value = '';
  };

  const removePhoto = (index: number) => {
    const newPhotos = [...photos];
    URL.revokeObjectURL(newPhotos[index].preview);
    newPhotos.splice(index, 1);
    setPhotos(newPhotos);
  };

  const handleUploadPhotos = async () => {
    if (photos.length === 0) {
      alert('Please add at least one photo');
      return;
    }

    if (!workerName.trim()) {
      alert('Please enter your name');
      return;
    }

    setStep('uploading');
    setLoading(true);
    let uploadedCount = 0;

    try {
      for (const photo of photos) {
        const fileExt = photo.file.name.split('.').pop();
        const fileName = `${task.id}-${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
        const filePath = `installation-photos/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('uploads')
          .upload(filePath, photo.file);

        if (uploadError) throw uploadError;

        const { error: insertError } = await supabase
          .from('installation_photos')
          .insert([{
            order_id: task.order_id,
            installation_task_id: task.id,
            photo_type: photo.photoType,
            storage_path: filePath,
            file_name: fileName,
            file_size: photo.file.size,
            mime_type: photo.file.type,
            caption: photo.caption || null,
            uploaded_by_name: workerName.trim(),
          }]);

        if (insertError) throw insertError;

        uploadedCount++;
        setUploadProgress(Math.round((uploadedCount / photos.length) * 100));
      }

      photos.forEach(photo => URL.revokeObjectURL(photo.preview));
      setStep('success');
    } catch (error) {
      console.error('Error uploading photos:', error);
      setError('Failed to upload photos. Please try again.');
      setStep('error');
    } finally {
      setLoading(false);
    }
  };

  if (step === 'loading') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-12 h-12 text-[#bb2738] animate-spin" />
          <p className="text-slate-600">Loading upload information...</p>
        </div>
      </div>
    );
  }

  if (step === 'error') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-8">
          <div className="flex flex-col items-center text-center gap-4">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
              <AlertCircle className="w-8 h-8 text-red-600" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900">Upload Unavailable</h2>
            <p className="text-slate-600">{error}</p>
            {onBack && (
              <button
                onClick={onBack}
                className="mt-4 flex items-center gap-2 text-[#bb2738] hover:text-[#9a1f2d] font-medium"
              >
                <ArrowLeft className="w-4 h-4" />
                Go Back
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (step === 'success') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-8">
          <div className="flex flex-col items-center text-center gap-4">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900">Upload Successful!</h2>
            <p className="text-slate-600">
              {photos.length} photo{photos.length !== 1 ? 's' : ''} uploaded successfully for this installation task.
            </p>
            <div className="bg-slate-50 rounded-lg p-4 w-full text-left">
              <p className="text-sm text-slate-600">Task: <span className="font-medium text-slate-900">{task.task_title}</span></p>
              {task.orders && (
                <p className="text-sm text-slate-600 mt-1">Order: <span className="font-medium text-slate-900">{task.orders.order_number}</span></p>
              )}
            </div>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 px-6 py-3 bg-[#bb2738] text-white rounded-lg hover:bg-[#9a1f2d] transition-colors font-medium w-full"
            >
              Upload More Photos
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (step === 'uploading') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-8">
          <div className="flex flex-col items-center text-center gap-4">
            <Loader2 className="w-12 h-12 text-[#bb2738] animate-spin" />
            <h2 className="text-2xl font-bold text-slate-900">Uploading Photos...</h2>
            <div className="w-full">
              <div className="bg-slate-200 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-[#bb2738] h-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
              <p className="text-sm text-slate-600 mt-2">{uploadProgress}% complete</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="bg-[#bb2738] text-white p-6">
            <div className="flex items-center gap-3 mb-4">
              <Upload className="w-8 h-8" />
              <div>
                <h1 className="text-2xl font-bold">Upload Installation Photos</h1>
                <p className="text-white/90 text-sm">Share progress photos for this installation</p>
              </div>
            </div>
          </div>

          <div className="p-6">
            <div className="bg-slate-50 rounded-lg p-4 mb-6">
              <h3 className="font-semibold text-slate-900 mb-3">Installation Details</h3>
              <div className="space-y-2">
                <div className="flex items-start gap-2">
                  <Building2 className="w-5 h-5 text-slate-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-slate-600">Task</p>
                    <p className="font-medium text-slate-900">{task.task_title}</p>
                  </div>
                </div>
                {task.orders && (
                  <div className="flex items-start gap-2">
                    <Building2 className="w-5 h-5 text-slate-400 mt-0.5" />
                    <div>
                      <p className="text-sm text-slate-600">Order</p>
                      <p className="font-medium text-slate-900">
                        {task.orders.order_number} - {task.orders.customers?.name}
                      </p>
                    </div>
                  </div>
                )}
                {task.scheduled_date && (
                  <div className="flex items-start gap-2">
                    <Calendar className="w-5 h-5 text-slate-400 mt-0.5" />
                    <div>
                      <p className="text-sm text-slate-600">Scheduled</p>
                      <p className="font-medium text-slate-900">
                        {new Date(task.scheduled_date).toLocaleDateString()}
                        {task.scheduled_time_start && ` at ${task.scheduled_time_start}`}
                      </p>
                    </div>
                  </div>
                )}
                {task.installation_address && (
                  <div className="flex items-start gap-2">
                    <MapPin className="w-5 h-5 text-slate-400 mt-0.5" />
                    <div>
                      <p className="text-sm text-slate-600">Location</p>
                      <p className="font-medium text-slate-900">{task.installation_address}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Your Name *</label>
                <input
                  type="text"
                  value={workerName}
                  onChange={(e) => setWorkerName(e.target.value)}
                  placeholder="Enter your name"
                  className="w-full border border-slate-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-[#bb2738] focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Photo Type</label>
                <select
                  value={currentPhotoType}
                  onChange={(e) => setCurrentPhotoType(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-[#bb2738] focus:border-transparent"
                >
                  <option value="before">Before Installation</option>
                  <option value="during">During Installation</option>
                  <option value="after">After Installation</option>
                  <option value="issue">Issue/Problem</option>
                  <option value="completion">Completion</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Caption (Optional)</label>
                <input
                  type="text"
                  value={currentCaption}
                  onChange={(e) => setCurrentCaption(e.target.value)}
                  placeholder="Add a description for this photo"
                  className="w-full border border-slate-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-[#bb2738] focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Select Photo</label>
                <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center hover:border-[#bb2738] transition-colors">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                    id="photo-upload"
                  />
                  <label htmlFor="photo-upload" className="cursor-pointer">
                    <ImageIcon className="w-12 h-12 text-slate-400 mx-auto mb-2" />
                    <p className="text-slate-600 mb-1">Click to select a photo</p>
                    <p className="text-xs text-slate-500">JPG, PNG or HEIC (Max 10MB)</p>
                  </label>
                </div>
              </div>

              {photos.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-slate-700 mb-3">
                    Photos to Upload ({photos.length})
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    {photos.map((photo, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={photo.preview}
                          alt={`Upload ${index + 1}`}
                          className="w-full h-32 object-cover rounded-lg"
                        />
                        <button
                          onClick={() => removePhoto(index)}
                          className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="w-4 h-4" />
                        </button>
                        <div className="mt-1">
                          <p className="text-xs font-medium text-slate-700 capitalize">{photo.photoType}</p>
                          {photo.caption && (
                            <p className="text-xs text-slate-500 truncate">{photo.caption}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <button
                onClick={handleUploadPhotos}
                disabled={photos.length === 0 || !workerName.trim() || loading}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-[#bb2738] text-white rounded-lg hover:bg-[#9a1f2d] transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Upload className="w-5 h-5" />
                Upload {photos.length} Photo{photos.length !== 1 ? 's' : ''}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
