import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import {
  FileText, Eye, X, Download, Trash2, User, Phone, Mail,
  Calendar, MessageSquare, AlertCircle, CheckCircle, Clock, XCircle, Filter, Search
} from 'lucide-react';

export function CustomerRequests() {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [attachments, setAttachments] = useState<any[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const requestsData = await supabase
      .from('customer_requests')
      .select('*, customers(*), quotes(*)')
      .order('created_at', { ascending: false });

    setRequests(requestsData.data || []);
    setLoading(false);
  };

  const fetchAttachments = async (requestId: string) => {
    const { data } = await supabase
      .from('request_attachments')
      .select('*')
      .eq('request_id', requestId)
      .order('created_at', { ascending: false });

    setAttachments(data || []);
  };

  const handleViewDetails = async (request: any) => {
    setSelectedRequest(request);
    await fetchAttachments(request.id);
    setShowDetailModal(true);
  };

  const handleStatusChange = async (requestId: string, newStatus: string) => {
    const { error } = await supabase
      .from('customer_requests')
      .update({ status: newStatus })
      .eq('id', requestId);

    if (!error) {
      fetchData();
      if (selectedRequest?.id === requestId) {
        setSelectedRequest({ ...selectedRequest, status: newStatus });
      }
    }
  };

  const handlePriorityChange = async (requestId: string, newPriority: string) => {
    const { error } = await supabase
      .from('customer_requests')
      .update({ priority: newPriority })
      .eq('id', requestId);

    if (!error) {
      fetchData();
      if (selectedRequest?.id === requestId) {
        setSelectedRequest({ ...selectedRequest, priority: newPriority });
      }
    }
  };

  const handleConvertToCustomer = async (request: any) => {
    const { data: customerData, error: customerError } = await supabase
      .from('customers')
      .insert([{
        name: request.customer_name,
        phone: request.phone,
        email: request.email,
        location: '',
        status: 'Lead',
        notes: `Converted from request ${request.request_number}\n\nProject: ${request.project_description}`,
      }])
      .select()
      .single();

    if (!customerError && customerData) {
      await supabase
        .from('customer_requests')
        .update({
          customer_id: customerData.id,
          status: 'Converted to Quote',
        })
        .eq('id', request.id);

      fetchData();
      setShowDetailModal(false);
      alert(`Successfully converted to customer: ${customerData.name}`);
    }
  };

  const handleDelete = async (requestId: string) => {
    if (!confirm('Are you sure you want to delete this request?')) return;

    const { error } = await supabase
      .from('customer_requests')
      .delete()
      .eq('id', requestId);

    if (!error) {
      fetchData();
      setShowDetailModal(false);
    }
  };

  const handleSaveNotes = async () => {
    if (!selectedRequest) return;

    const { error } = await supabase
      .from('customer_requests')
      .update({ admin_notes: selectedRequest.admin_notes })
      .eq('id', selectedRequest.id);

    if (!error) {
      fetchData();
    }
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      'New': 'bg-blue-100 text-blue-800',
      'Under Review': 'bg-yellow-100 text-yellow-800',
      'Converted to Quote': 'bg-green-100 text-green-800',
      'Rejected': 'bg-red-100 text-red-800',
      'Completed': 'bg-slate-100 text-slate-800',
    };

    const icons = {
      'New': <AlertCircle className="w-3 h-3" />,
      'Under Review': <Clock className="w-3 h-3" />,
      'Converted to Quote': <CheckCircle className="w-3 h-3" />,
      'Rejected': <XCircle className="w-3 h-3" />,
      'Completed': <CheckCircle className="w-3 h-3" />,
    };

    return (
      <span className={`px-3 py-1 text-xs rounded-full flex items-center gap-1 ${styles[status as keyof typeof styles] || 'bg-slate-100 text-slate-800'}`}>
        {icons[status as keyof typeof icons]}
        {status}
      </span>
    );
  };

  const getPriorityBadge = (priority: string) => {
    const styles = {
      'Low': 'bg-slate-100 text-slate-600',
      'Medium': 'bg-blue-100 text-blue-800',
      'High': 'bg-orange-100 text-orange-800',
      'Urgent': 'bg-red-100 text-red-800',
    };

    return (
      <span className={`px-2 py-1 text-xs rounded ${styles[priority as keyof typeof styles] || 'bg-slate-100 text-slate-600'}`}>
        {priority}
      </span>
    );
  };

  const filteredRequests = requests.filter(request => {
    const matchesStatus = filterStatus === 'all' || request.status === filterStatus;
    const matchesPriority = filterPriority === 'all' || request.priority === filterPriority;
    const matchesSearch = searchQuery === '' ||
      request.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      request.request_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      request.phone.includes(searchQuery) ||
      request.email.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesStatus && matchesPriority && matchesSearch;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#bb2738]"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-slate-800">Customer Requests</h1>
        <div className="flex items-center gap-3">
          <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
            {filteredRequests.length} Requests
          </span>
        </div>
      </div>

      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name, request number, phone, or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-[#bb2738]"
          />
        </div>

        <div className="flex gap-3">
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="pl-9 pr-4 py-2.5 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-[#bb2738] appearance-none bg-white"
            >
              <option value="all">All Status</option>
              <option value="New">New</option>
              <option value="Under Review">Under Review</option>
              <option value="Converted to Quote">Converted</option>
              <option value="Rejected">Rejected</option>
              <option value="Completed">Completed</option>
            </select>
          </div>

          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="px-4 py-2.5 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-[#bb2738] appearance-none bg-white"
          >
            <option value="all">All Priorities</option>
            <option value="Low">Low</option>
            <option value="Medium">Medium</option>
            <option value="High">High</option>
            <option value="Urgent">Urgent</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {filteredRequests.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500">No requests found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Request #
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Priority
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {filteredRequests.map((request) => (
                  <tr key={request.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-medium text-[#bb2738]">
                        {request.request_number}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-slate-900">{request.customer_name}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-slate-600">{request.phone}</div>
                      {request.email && (
                        <div className="text-xs text-slate-500">{request.email}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(request.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getPriorityBadge(request.priority)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                      {new Date(request.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <button
                        onClick={() => handleViewDetails(request)}
                        className="text-[#bb2738] hover:text-[#a01f2f] font-medium flex items-center gap-1"
                      >
                        <Eye className="w-4 h-4" />
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showDetailModal && selectedRequest && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b sticky top-0 bg-white z-10">
              <div>
                <h2 className="text-xl font-bold">Request Details</h2>
                <p className="text-sm text-slate-600">{selectedRequest.request_number}</p>
              </div>
              <button
                onClick={() => setShowDetailModal(false)}
                className="p-2 hover:bg-slate-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-sm font-medium text-slate-700 mb-3">Customer Information</h3>
                  <div className="space-y-3">
                    <div className="flex items-start gap-2">
                      <User className="w-4 h-4 text-slate-400 mt-0.5" />
                      <div>
                        <p className="text-xs text-slate-500">Name</p>
                        <p className="text-sm font-medium text-slate-900">{selectedRequest.customer_name}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <Phone className="w-4 h-4 text-slate-400 mt-0.5" />
                      <div>
                        <p className="text-xs text-slate-500">Phone</p>
                        <p className="text-sm font-medium text-slate-900">{selectedRequest.phone}</p>
                      </div>
                    </div>
                    {selectedRequest.email && (
                      <div className="flex items-start gap-2">
                        <Mail className="w-4 h-4 text-slate-400 mt-0.5" />
                        <div>
                          <p className="text-xs text-slate-500">Email</p>
                          <p className="text-sm font-medium text-slate-900">{selectedRequest.email}</p>
                        </div>
                      </div>
                    )}
                    {selectedRequest.preferred_date && (
                      <div className="flex items-start gap-2">
                        <Calendar className="w-4 h-4 text-slate-400 mt-0.5" />
                        <div>
                          <p className="text-xs text-slate-500">Preferred Date</p>
                          <p className="text-sm font-medium text-slate-900">
                            {new Date(selectedRequest.preferred_date).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-slate-700 mb-3">Request Status</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs text-slate-500 mb-1">Status</label>
                      <select
                        value={selectedRequest.status}
                        onChange={(e) => handleStatusChange(selectedRequest.id, e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-[#bb2738]"
                      >
                        <option value="New">New</option>
                        <option value="Under Review">Under Review</option>
                        <option value="Converted to Quote">Converted to Quote</option>
                        <option value="Rejected">Rejected</option>
                        <option value="Completed">Completed</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs text-slate-500 mb-1">Priority</label>
                      <select
                        value={selectedRequest.priority}
                        onChange={(e) => handlePriorityChange(selectedRequest.id, e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-[#bb2738]"
                      >
                        <option value="Low">Low</option>
                        <option value="Medium">Medium</option>
                        <option value="High">High</option>
                        <option value="Urgent">Urgent</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium text-slate-700 mb-2">Project Description</h3>
                <div className="bg-slate-50 rounded-lg p-4">
                  <p className="text-sm text-slate-700 whitespace-pre-wrap">
                    {selectedRequest.project_description}
                  </p>
                </div>
              </div>

              {attachments.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-slate-700 mb-3">Attachments</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {attachments.map((attachment) => (
                      <div
                        key={attachment.id}
                        className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200"
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <FileText className="w-5 h-5 text-slate-400 flex-shrink-0" />
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-slate-900 truncate">
                              {attachment.file_name}
                            </p>
                            <p className="text-xs text-slate-500">
                              {(attachment.file_size / 1024).toFixed(1)} KB
                            </p>
                          </div>
                        </div>
                        <a
                          href={attachment.file_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 text-[#bb2738] hover:bg-[#bb2738] hover:text-white rounded-lg transition-colors flex-shrink-0"
                        >
                          <Download className="w-4 h-4" />
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <h3 className="text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
                  <MessageSquare className="w-4 h-4" />
                  Admin Notes
                </h3>
                <textarea
                  value={selectedRequest.admin_notes}
                  onChange={(e) => setSelectedRequest({ ...selectedRequest, admin_notes: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-[#bb2738] resize-none"
                  placeholder="Add internal notes here..."
                />
                <button
                  onClick={handleSaveNotes}
                  className="mt-2 px-4 py-2 bg-slate-600 hover:bg-slate-700 text-white text-sm rounded-lg"
                >
                  Save Notes
                </button>
              </div>

              <div className="flex justify-between pt-4 border-t">
                <button
                  onClick={() => handleDelete(selectedRequest.id)}
                  className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg flex items-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete Request
                </button>
                <div className="flex gap-3">
                  {!selectedRequest.customer_id && (
                    <button
                      onClick={() => handleConvertToCustomer(selectedRequest)}
                      className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg"
                    >
                      Convert to Customer
                    </button>
                  )}
                  <button
                    onClick={() => setShowDetailModal(false)}
                    className="px-6 py-2 bg-slate-600 hover:bg-slate-700 text-white rounded-lg"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
