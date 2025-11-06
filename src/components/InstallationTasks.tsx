import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Plus, Calendar, MapPin, Upload, Shield, CheckCircle, CreditCard as Edit, Trash2 } from 'lucide-react';

interface Order {
  id: string;
  order_number: string;
  customer_name: string;
}

interface InstallationTask {
  id: string;
  order_id: string | null;
  task_title: string;
  task_description: string | null;
  scheduled_date: string | null;
  scheduled_time_start: string | null;
  assigned_to: string | null;
  status: string;
  priority: string;
  installation_address: string | null;
  orders?: { order_number: string; customer_name: string };
}

export function InstallationTasks() {
  const [tasks, setTasks] = useState<InstallationTask[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingTask, setEditingTask] = useState<InstallationTask | null>(null);
  const [selectedTask, setSelectedTask] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoType, setPhotoType] = useState<string>('before');
  const [showWarrantyModal, setShowWarrantyModal] = useState(false);
  const [warrantyTask, setWarrantyTask] = useState<InstallationTask | null>(null);
  const [warrantyFormData, setWarrantyFormData] = useState({
    product_name: '',
    product_description: '',
    serial_number: '',
    duration_months: '12',
    coverage_type: 'Standard',
    coverage_details: '',
  });
  const [formData, setFormData] = useState({
    order_id: '',
    task_title: '',
    task_description: '',
    scheduled_date: '',
    scheduled_time_start: '',
    installation_address: '',
    priority: 'medium',
  });

  useEffect(() => {
    loadTasks();
    loadOrders();
  }, []);

  const loadTasks = async () => {
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
        .order('scheduled_date', { ascending: true });

      if (error) throw error;

      const formattedTasks = (data || []).map(task => ({
        ...task,
        orders: task.orders ? {
          order_number: task.orders.order_number,
          customer_name: task.orders.customers?.name || 'Unknown Customer'
        } : undefined
      }));

      setTasks(formattedTasks);
    } catch (error) {
      console.error('Error loading tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadOrders = async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          id,
          order_number,
          customers(name)
        `)
        .order('order_number', { ascending: false });

      if (error) throw error;

      const formattedOrders = (data || []).map((order: any) => ({
        id: order.id,
        order_number: order.order_number,
        customer_name: Array.isArray(order.customers) ? order.customers[0]?.name : order.customers?.name || 'Unknown Customer'
      }));

      setOrders(formattedOrders);
    } catch (error) {
      console.error('Error loading orders:', error);
    }
  };

  const handleAddTask = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const taskData = {
        ...formData,
        order_id: formData.order_id || null,
        assigned_to: user.id,
      };

      const { error } = await supabase
        .from('installation_tasks')
        .insert([taskData]);

      if (error) throw error;

      await loadTasks();
      setShowModal(false);
      setFormData({
        order_id: '',
        task_title: '',
        task_description: '',
        scheduled_date: '',
        scheduled_time_start: '',
        installation_address: '',
        priority: 'medium',
      });
    } catch (error) {
      console.error('Error adding task:', error);
      alert('Failed to add task: ' + (error as Error).message);
    }
  };

  const handleEditTask = async () => {
    if (!editingTask) return;

    try {
      const { error } = await supabase
        .from('installation_tasks')
        .update({
          order_id: formData.order_id || null,
          task_title: formData.task_title,
          task_description: formData.task_description,
          scheduled_date: formData.scheduled_date,
          scheduled_time_start: formData.scheduled_time_start,
          installation_address: formData.installation_address,
          priority: formData.priority,
        })
        .eq('id', editingTask.id);

      if (error) throw error;

      await loadTasks();
      setShowModal(false);
      setEditingTask(null);
      setFormData({
        order_id: '',
        task_title: '',
        task_description: '',
        scheduled_date: '',
        scheduled_time_start: '',
        installation_address: '',
        priority: 'medium',
      });
    } catch (error) {
      console.error('Error updating task:', error);
      alert('Failed to update task: ' + (error as Error).message);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!confirm('Are you sure you want to delete this installation task?')) return;

    try {
      const { error } = await supabase
        .from('installation_tasks')
        .delete()
        .eq('id', taskId);

      if (error) throw error;

      await loadTasks();
    } catch (error) {
      console.error('Error deleting task:', error);
      alert('Failed to delete task: ' + (error as Error).message);
    }
  };

  const openEditModal = (task: InstallationTask) => {
    setEditingTask(task);
    setFormData({
      order_id: task.order_id || '',
      task_title: task.task_title,
      task_description: task.task_description || '',
      scheduled_date: task.scheduled_date || '',
      scheduled_time_start: task.scheduled_time_start || '',
      installation_address: task.installation_address || '',
      priority: task.priority,
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingTask(null);
    setFormData({
      order_id: '',
      task_title: '',
      task_description: '',
      scheduled_date: '',
      scheduled_time_start: '',
      installation_address: '',
      priority: 'medium',
    });
  };

  const handlePhotoUpload = async () => {
    if (!photoFile || !selectedTask) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const fileExt = photoFile.name.split('.').pop();
      const fileName = `${selectedTask}-${Date.now()}.${fileExt}`;
      const filePath = `installation-photos/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('uploads')
        .upload(filePath, photoFile);

      if (uploadError) throw uploadError;

      const task = tasks.find(t => t.id === selectedTask);
      if (!task) return;

      const { error: insertError } = await supabase
        .from('installation_photos')
        .insert([{
          order_id: task.order_id,
          installation_task_id: selectedTask,
          photo_type: photoType,
          storage_path: filePath,
          file_name: fileName,
          file_size: photoFile.size,
          mime_type: photoFile.type,
          uploaded_by: user.id,
        }]);

      if (insertError) throw insertError;

      alert('Photo uploaded successfully');
      setPhotoFile(null);
      setSelectedTask(null);
    } catch (error) {
      console.error('Error uploading photo:', error);
      alert('Failed to upload photo');
    }
  };

  const handleCompleteTask = async (task: InstallationTask) => {
    if (!confirm('Mark this installation as completed?')) return;

    try {
      const { error } = await supabase
        .from('installation_tasks')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString()
        })
        .eq('id', task.id);

      if (error) throw error;

      await loadTasks();

      if (task.order_id) {
        setWarrantyTask(task);
        setWarrantyFormData({
          product_name: task.task_title || '',
          product_description: '',
          serial_number: '',
          duration_months: '12',
          coverage_type: 'Standard',
          coverage_details: '',
        });
        setShowWarrantyModal(true);
      } else {
        alert('Installation marked as completed');
      }
    } catch (error) {
      console.error('Error completing task:', error);
      alert('Failed to complete task');
    }
  };

  const handleCreateWarranty = async () => {
    if (!warrantyTask || !warrantyTask.order_id) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data: orderData } = await supabase
        .from('orders')
        .select('customer_id')
        .eq('id', warrantyTask.order_id)
        .single();

      if (!orderData) throw new Error('Order not found');

      const warrantyNumber = `WR-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;

      const startDate = new Date();
      const endDate = new Date();
      endDate.setMonth(endDate.getMonth() + parseInt(warrantyFormData.duration_months));

      const { error } = await supabase
        .from('warranties')
        .insert([{
          order_id: warrantyTask.order_id,
          customer_id: orderData.customer_id,
          warranty_number: warrantyNumber,
          product_name: warrantyFormData.product_name,
          product_description: warrantyFormData.product_description,
          serial_number: warrantyFormData.serial_number || null,
          start_date: startDate.toISOString().split('T')[0],
          end_date: endDate.toISOString().split('T')[0],
          duration_months: parseInt(warrantyFormData.duration_months),
          coverage_type: warrantyFormData.coverage_type,
          coverage_details: warrantyFormData.coverage_details || null,
          registered_by: user.id,
          registration_date: new Date().toISOString(),
          status: 'active',
        }]);

      if (error) throw error;

      alert('Warranty created successfully!');
      setShowWarrantyModal(false);
      setWarrantyTask(null);
    } catch (error) {
      console.error('Error creating warranty:', error);
      alert('Failed to create warranty: ' + (error as Error).message);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-700';
      case 'in_progress': return 'bg-blue-100 text-blue-700';
      case 'scheduled': return 'bg-slate-100 text-slate-700';
      case 'cancelled': return 'bg-red-100 text-red-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-700';
      case 'high': return 'bg-orange-100 text-orange-700';
      case 'medium': return 'bg-yellow-100 text-yellow-700';
      case 'low': return 'bg-green-100 text-green-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#bb2738]"></div></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-800">Installation Tasks</h2>
        <button onClick={() => setShowModal(true)} className="flex items-center gap-2 px-4 py-2 bg-[#bb2738] text-white rounded-lg hover:bg-[#9a1f2d] transition-colors">
          <Plus className="w-5 h-5" />
          Create Task
        </button>
      </div>

      <div className="grid gap-4">
        {tasks.map((task) => (
          <div key={task.id} className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-slate-900 mb-1">{task.task_title}</h3>
                {task.orders ? (
                  <p className="text-sm text-slate-600">{task.orders.order_number} - {task.orders.customer_name}</p>
                ) : (
                  <p className="text-sm text-slate-500 italic">No order linked</p>
                )}
              </div>
              <div className="flex gap-2">
                <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(task.status)}`}>
                  {task.status}
                </span>
                <span className={`px-2 py-1 rounded text-xs font-medium ${getPriorityColor(task.priority)}`}>
                  {task.priority}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              {task.scheduled_date && (
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <Calendar className="w-4 h-4" />
                  {new Date(task.scheduled_date).toLocaleDateString()}
                  {task.scheduled_time_start && ` at ${task.scheduled_time_start}`}
                </div>
              )}
              {task.installation_address && (
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <MapPin className="w-4 h-4" />
                  {task.installation_address}
                </div>
              )}
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => openEditModal(task)}
                className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                <Edit className="w-4 h-4" />
                Edit
              </button>
              <button
                onClick={() => handleDeleteTask(task.id)}
                className="flex items-center gap-2 text-sm text-red-600 hover:text-red-700 font-medium"
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </button>
              <button
                onClick={() => setSelectedTask(task.id)}
                className="flex items-center gap-2 text-sm text-[#bb2738] hover:text-[#9a1f2d] font-medium"
              >
                <Upload className="w-4 h-4" />
                Upload Photos
              </button>
              {task.status !== 'completed' && (
                <button
                  onClick={() => handleCompleteTask(task)}
                  className="flex items-center gap-2 text-sm text-green-600 hover:text-green-700 font-medium"
                >
                  <CheckCircle className="w-4 h-4" />
                  Mark Complete
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-200">
              <h3 className="text-lg font-semibold text-slate-900">
                {editingTask ? 'Edit Installation Task' : 'Create Installation Task'}
              </h3>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-2">Link to Order (Optional)</label>
                  <select value={formData.order_id} onChange={(e) => setFormData({ ...formData, order_id: e.target.value })} className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#bb2738] focus:border-transparent">
                    <option value="">No order linked</option>
                    {orders.map(order => (
                      <option key={order.id} value={order.id}>
                        {order.order_number} - {order.customer_name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-2">Task Title *</label>
                  <input type="text" value={formData.task_title} onChange={(e) => setFormData({ ...formData, task_title: e.target.value })} className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#bb2738] focus:border-transparent" />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-2">Description</label>
                  <textarea value={formData.task_description} onChange={(e) => setFormData({ ...formData, task_description: e.target.value })} rows={3} className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#bb2738] focus:border-transparent" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Scheduled Date</label>
                  <input type="date" value={formData.scheduled_date} onChange={(e) => setFormData({ ...formData, scheduled_date: e.target.value })} className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#bb2738] focus:border-transparent" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Start Time</label>
                  <input type="time" value={formData.scheduled_time_start} onChange={(e) => setFormData({ ...formData, scheduled_time_start: e.target.value })} className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#bb2738] focus:border-transparent" />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-2">Installation Address</label>
                  <input type="text" value={formData.installation_address} onChange={(e) => setFormData({ ...formData, installation_address: e.target.value })} className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#bb2738] focus:border-transparent" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Priority</label>
                  <select value={formData.priority} onChange={(e) => setFormData({ ...formData, priority: e.target.value })} className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#bb2738] focus:border-transparent">
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-slate-200 flex gap-3">
              <button onClick={closeModal} className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors">Cancel</button>
              <button
                onClick={editingTask ? handleEditTask : handleAddTask}
                disabled={!formData.task_title}
                className="flex-1 px-4 py-2 bg-[#bb2738] text-white rounded-lg hover:bg-[#9a1f2d] transition-colors disabled:opacity-50"
              >
                {editingTask ? 'Update Task' : 'Create Task'}
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedTask && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6 border-b border-slate-200">
              <h3 className="text-lg font-semibold text-slate-900">Upload Installation Photo</h3>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Photo Type</label>
                <select value={photoType} onChange={(e) => setPhotoType(e.target.value)} className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#bb2738] focus:border-transparent">
                  <option value="before">Before</option>
                  <option value="during">During</option>
                  <option value="after">After</option>
                  <option value="issue">Issue</option>
                  <option value="completion">Completion</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Select Photo</label>
                <input type="file" accept="image/*" onChange={(e) => setPhotoFile(e.target.files?.[0] || null)} className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#bb2738] focus:border-transparent" />
              </div>
            </div>
            <div className="p-6 border-t border-slate-200 flex gap-3">
              <button onClick={() => { setSelectedTask(null); setPhotoFile(null); }} className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors">Cancel</button>
              <button onClick={handlePhotoUpload} disabled={!photoFile} className="flex-1 px-4 py-2 bg-[#bb2738] text-white rounded-lg hover:bg-[#9a1f2d] transition-colors disabled:opacity-50">Upload Photo</button>
            </div>
          </div>
        </div>
      )}

      {showWarrantyModal && warrantyTask && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-200">
              <div className="flex items-center gap-3">
                <Shield className="w-6 h-6 text-[#bb2738]" />
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">Create Warranty</h3>
                  <p className="text-sm text-slate-600">Installation completed for {warrantyTask.orders?.order_number}</p>
                </div>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                <p className="text-sm text-green-800">Installation marked as complete. Create a warranty for this order?</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Product Name *</label>
                <input
                  type="text"
                  value={warrantyFormData.product_name}
                  onChange={(e) => setWarrantyFormData({ ...warrantyFormData, product_name: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#bb2738] focus:border-transparent"
                  placeholder="e.g., Solar Panel Installation"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Product Description</label>
                <textarea
                  value={warrantyFormData.product_description}
                  onChange={(e) => setWarrantyFormData({ ...warrantyFormData, product_description: e.target.value })}
                  rows={3}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#bb2738] focus:border-transparent"
                  placeholder="Detailed description of the installed product"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Serial Number</label>
                  <input
                    type="text"
                    value={warrantyFormData.serial_number}
                    onChange={(e) => setWarrantyFormData({ ...warrantyFormData, serial_number: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#bb2738] focus:border-transparent"
                    placeholder="Optional"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Duration (Months) *</label>
                  <select
                    value={warrantyFormData.duration_months}
                    onChange={(e) => setWarrantyFormData({ ...warrantyFormData, duration_months: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#bb2738] focus:border-transparent"
                  >
                    <option value="6">6 Months</option>
                    <option value="12">12 Months</option>
                    <option value="24">24 Months</option>
                    <option value="36">36 Months</option>
                    <option value="60">60 Months</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Coverage Type *</label>
                <select
                  value={warrantyFormData.coverage_type}
                  onChange={(e) => setWarrantyFormData({ ...warrantyFormData, coverage_type: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#bb2738] focus:border-transparent"
                >
                  <option value="Standard">Standard</option>
                  <option value="Extended">Extended</option>
                  <option value="Premium">Premium</option>
                  <option value="Limited">Limited</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Coverage Details</label>
                <textarea
                  value={warrantyFormData.coverage_details}
                  onChange={(e) => setWarrantyFormData({ ...warrantyFormData, coverage_details: e.target.value })}
                  rows={3}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#bb2738] focus:border-transparent"
                  placeholder="What does this warranty cover?"
                />
              </div>
            </div>
            <div className="p-6 border-t border-slate-200 flex gap-3">
              <button
                onClick={() => {
                  setShowWarrantyModal(false);
                  setWarrantyTask(null);
                }}
                className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
              >
                Skip Warranty
              </button>
              <button
                onClick={handleCreateWarranty}
                disabled={!warrantyFormData.product_name}
                className="flex-1 px-4 py-2 bg-[#bb2738] text-white rounded-lg hover:bg-[#9a1f2d] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <Shield className="w-4 h-4" />
                Create Warranty
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
