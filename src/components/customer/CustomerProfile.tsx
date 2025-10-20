import { useEffect, useState } from 'react';
import { useCustomerAuth } from '../../contexts/CustomerAuthContext';
import { supabase } from '../../lib/supabase';
import { User, Mail, Phone, MapPin, Save } from 'lucide-react';

export function CustomerProfile() {
  const { customerData } = useCustomerAuth();
  const [customer, setCustomer] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    location: '',
    notes: '',
  });

  useEffect(() => {
    if (customerData) {
      fetchCustomer();
    }
  }, [customerData]);

  const fetchCustomer = async () => {
    if (!customerData) return;

    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .eq('id', customerData.customer_id)
      .single();

    if (error) {
      console.error('Error fetching customer:', error);
      return;
    }

    setCustomer(data);
    setFormData({
      name: data.name || '',
      email: data.email || '',
      phone: data.phone || '',
      location: data.location || '',
      notes: data.notes || '',
    });
  };

  const handleSave = async () => {
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const { error } = await supabase
        .from('customers')
        .update({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          location: formData.location,
          notes: formData.notes,
        })
        .eq('id', customerData!.customer_id);

      if (error) throw error;

      setSuccess('Profile updated successfully!');
      setIsEditing(false);
      fetchCustomer();
    } catch (err: any) {
      setError(err.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  if (!customer) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#bb2738]"></div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl">
      <div className="bg-white rounded-xl p-8 border border-slate-200">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-slate-800">My Profile</h2>
          {!isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="px-4 py-2 bg-[#bb2738] text-white rounded-lg hover:bg-[#a01f2f] transition-colors"
            >
              Edit Profile
            </button>
          )}
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm mb-4">
            {error}
          </div>
        )}

        {success && (
          <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm mb-4">
            {success}
          </div>
        )}

        <div className="space-y-6">
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
              <User className="w-4 h-4" />
              Full Name
            </label>
            {isEditing ? (
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#bb2738] focus:border-transparent outline-none"
              />
            ) : (
              <p className="text-slate-800 text-lg">{customer.name}</p>
            )}
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
              <Mail className="w-4 h-4" />
              Email
            </label>
            {isEditing ? (
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#bb2738] focus:border-transparent outline-none"
              />
            ) : (
              <p className="text-slate-800 text-lg">{customer.email || 'Not provided'}</p>
            )}
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
              <Phone className="w-4 h-4" />
              Phone Number
            </label>
            {isEditing ? (
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#bb2738] focus:border-transparent outline-none"
              />
            ) : (
              <p className="text-slate-800 text-lg">{customer.phone}</p>
            )}
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
              <MapPin className="w-4 h-4" />
              Location
            </label>
            {isEditing ? (
              <input
                type="text"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#bb2738] focus:border-transparent outline-none"
              />
            ) : (
              <p className="text-slate-800 text-lg">{customer.location || 'Not provided'}</p>
            )}
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
              <User className="w-4 h-4" />
              Customer Status
            </label>
            <div className="inline-block">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                customer.status === 'Lead' ? 'bg-slate-100 text-slate-700' :
                customer.status === 'Quoted' ? 'bg-blue-100 text-blue-700' :
                customer.status === 'Ordered' ? 'bg-amber-100 text-amber-700' :
                customer.status === 'Delivered' ? 'bg-purple-100 text-purple-700' :
                'bg-green-100 text-green-700'
              }`}>
                {customer.status}
              </span>
            </div>
          </div>

          {isEditing && (
            <div className="flex gap-3 pt-4">
              <button
                onClick={handleSave}
                disabled={loading}
                className="flex items-center gap-2 px-6 py-2.5 bg-[#bb2738] text-white rounded-lg hover:bg-[#a01f2f] transition-colors disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
              <button
                onClick={() => {
                  setIsEditing(false);
                  setError('');
                  setSuccess('');
                  fetchCustomer();
                }}
                className="px-6 py-2.5 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition-colors"
              >
                Cancel
              </button>
            </div>
          )}
        </div>

        <div className="mt-8 pt-6 border-t border-slate-200">
          <p className="text-sm text-slate-600">
            <strong>Customer Since:</strong> {new Date(customer.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
      </div>
    </div>
  );
}
