import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Search, Filter, CheckCircle, Clock, AlertCircle, XCircle, User, Plus, TrendingUp, Package, LayoutGrid, List, ArrowRight, Calendar } from 'lucide-react';

interface Order {
  id: string;
  order_number: string;
  customer_name: string;
  total: number;
}

interface Workflow {
  id: string;
  order_id: string;
  design_approval_status: string;
  design_approval_started_at: string | null;
  design_approval_completed_at: string | null;
  design_approval_assigned_to: string | null;
  design_approval_notes: string | null;
  manufacturing_status: string;
  manufacturing_started_at: string | null;
  manufacturing_completed_at: string | null;
  manufacturing_assigned_to: string | null;
  manufacturing_notes: string | null;
  quality_check_status: string;
  quality_check_started_at: string | null;
  quality_check_completed_at: string | null;
  quality_check_assigned_to: string | null;
  quality_check_notes: string | null;
  packaging_status: string;
  packaging_started_at: string | null;
  packaging_completed_at: string | null;
  packaging_assigned_to: string | null;
  packaging_notes: string | null;
  orders: Order;
}

interface StageUpdate {
  status: string;
  notes: string;
  assignedTo: string;
}

export function ProductionWorkflow() {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedWorkflow, setSelectedWorkflow] = useState<Workflow | null>(null);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [selectedStage, setSelectedStage] = useState<string>('');
  const [stageUpdate, setStageUpdate] = useState<StageUpdate>({
    status: '',
    notes: '',
    assignedTo: '',
  });
  const [users, setUsers] = useState<{ id: string; email: string }[]>([]);
  const [ordersWithoutWorkflows, setOrdersWithoutWorkflows] = useState<any[]>([]);
  const [showOrdersWithoutWorkflows, setShowOrdersWithoutWorkflows] = useState(false);
  const [viewMode, setViewMode] = useState<'card' | 'table'>('card');

  useEffect(() => {
    loadWorkflows();
    loadUsers();
    loadOrdersWithoutWorkflows();
  }, []);

  const loadWorkflows = async () => {
    try {
      const { data, error } = await supabase
        .from('production_workflows')
        .select(`
          *,
          orders (
            id,
            order_number,
            customer_name,
            total
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setWorkflows(data || []);
    } catch (error) {
      console.error('Error loading workflows:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      const { data, error } = await supabase.auth.admin.listUsers();
      if (error) throw error;
      setUsers(data.users.map(u => ({ id: u.id, email: u.email || '' })));
    } catch (error) {
      console.error('Error loading users:', error);
    }
  };

  const loadOrdersWithoutWorkflows = async () => {
    try {
      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select('id, order_number, customer_name, order_date, status')
        .order('created_at', { ascending: false });

      if (ordersError) throw ordersError;

      const { data: workflows, error: workflowsError } = await supabase
        .from('production_workflows')
        .select('order_id');

      if (workflowsError) throw workflowsError;

      const workflowOrderIds = new Set(workflows?.map(w => w.order_id) || []);
      const ordersWithout = orders?.filter(order => !workflowOrderIds.has(order.id)) || [];

      setOrdersWithoutWorkflows(ordersWithout);
    } catch (error) {
      console.error('Error loading orders without workflows:', error);
    }
  };

  const handleCreateWorkflowForOrder = async (orderId: string, orderNumber: string) => {
    try {
      const { data, error } = await supabase.rpc('create_workflow_for_order', {
        p_order_id: orderId
      });

      if (error) throw error;

      if (data?.success) {
        alert(`Production workflow created for order ${orderNumber}!`);
        loadWorkflows();
        loadOrdersWithoutWorkflows();
      } else {
        alert(data?.message || 'Workflow already exists for this order');
      }
    } catch (error) {
      console.error('Error creating workflow:', error);
      alert('Failed to create workflow');
    }
  };

  const getStageStatus = (status: string) => {
    switch (status) {
      case 'completed':
      case 'approved':
      case 'passed':
        return { icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200', ring: 'ring-emerald-500' };
      case 'in_progress':
        return { icon: Clock, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200', ring: 'ring-blue-500' };
      case 'rejected':
      case 'failed':
        return { icon: XCircle, color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200', ring: 'ring-red-500' };
      case 'on_hold':
        return { icon: AlertCircle, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200', ring: 'ring-amber-500' };
      default:
        return { icon: Clock, color: 'text-slate-400', bg: 'bg-slate-50', border: 'border-slate-200', ring: 'ring-slate-500' };
    }
  };

  const handleStageUpdate = async (workflowId: string, stage: string) => {
    try {
      const now = new Date().toISOString();
      const updates: any = {};
      const statusKey = `${stage}_status`;
      const notesKey = `${stage}_notes`;
      const assignedToKey = `${stage}_assigned_to`;

      updates[statusKey] = stageUpdate.status;
      updates[notesKey] = stageUpdate.notes;
      updates[assignedToKey] = stageUpdate.assignedTo || null;

      if (stageUpdate.status === 'in_progress' && !selectedWorkflow?.[`${stage}_started_at` as keyof Workflow]) {
        updates[`${stage}_started_at`] = now;
      }

      if (['completed', 'approved', 'passed'].includes(stageUpdate.status)) {
        updates[`${stage}_completed_at`] = now;
      }

      const { error } = await supabase
        .from('production_workflows')
        .update(updates)
        .eq('id', workflowId);

      if (error) throw error;

      await loadWorkflows();
      setShowUpdateModal(false);
      setStageUpdate({ status: '', notes: '', assignedTo: '' });
    } catch (error) {
      console.error('Error updating workflow:', error);
      alert('Failed to update workflow stage');
    }
  };

  const openUpdateModal = (workflow: Workflow, stage: string) => {
    setSelectedWorkflow(workflow);
    setSelectedStage(stage);
    const statusKey = `${stage}_status` as keyof Workflow;
    const notesKey = `${stage}_notes` as keyof Workflow;
    const assignedToKey = `${stage}_assigned_to` as keyof Workflow;

    setStageUpdate({
      status: workflow[statusKey] as string || '',
      notes: workflow[notesKey] as string || '',
      assignedTo: workflow[assignedToKey] as string || '',
    });
    setShowUpdateModal(true);
  };

  const filteredWorkflows = workflows.filter(workflow => {
    const matchesSearch = workflow.orders.order_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      workflow.orders.customer_name.toLowerCase().includes(searchTerm.toLowerCase());

    if (statusFilter === 'all') return matchesSearch;

    const hasStageInStatus =
      workflow.design_approval_status === statusFilter ||
      workflow.manufacturing_status === statusFilter ||
      workflow.quality_check_status === statusFilter ||
      workflow.packaging_status === statusFilter;

    return matchesSearch && hasStageInStatus;
  });

  const calculateProgress = (workflow: Workflow) => {
    const stages = [
      workflow.design_approval_status,
      workflow.manufacturing_status,
      workflow.quality_check_status,
      workflow.packaging_status
    ];
    const completedStages = stages.filter(s => ['completed', 'approved', 'passed'].includes(s)).length;
    return (completedStages / stages.length) * 100;
  };

  const getStats = () => {
    const total = workflows.length;
    const inProgress = workflows.filter(w =>
      [w.design_approval_status, w.manufacturing_status, w.quality_check_status, w.packaging_status]
        .some(s => s === 'in_progress')
    ).length;
    const completed = workflows.filter(w =>
      [w.design_approval_status, w.manufacturing_status, w.quality_check_status, w.packaging_status]
        .every(s => ['completed', 'approved', 'passed'].includes(s))
    ).length;
    const onHold = workflows.filter(w =>
      [w.design_approval_status, w.manufacturing_status, w.quality_check_status, w.packaging_status]
        .some(s => s === 'on_hold')
    ).length;

    return { total, inProgress, completed, onHold };
  };

  const stats = getStats();

  const getStatusBadge = (status: string) => {
    const config = getStageStatus(status);
    return (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${config.bg} ${config.color} border ${config.border}`}>
        <config.icon className="w-3.5 h-3.5" />
        {status.replace('_', ' ').toUpperCase()}
      </span>
    );
  };

  const getUserInitials = (userId: string) => {
    const user = users.find(u => u.id === userId);
    if (!user) return '?';
    return user.email.substring(0, 2).toUpperCase();
  };

  const renderStageCard = (workflow: Workflow, stage: string, title: string, index: number) => {
    const statusKey = `${stage}_status` as keyof Workflow;
    const assignedToKey = `${stage}_assigned_to` as keyof Workflow;
    const startedAtKey = `${stage}_started_at` as keyof Workflow;
    const status = workflow[statusKey] as string;
    const assignedTo = workflow[assignedToKey] as string;
    const startedAt = workflow[startedAtKey] as string;
    const config = getStageStatus(status);
    const isCompleted = ['completed', 'approved', 'passed'].includes(status);
    const isActive = status === 'in_progress';

    return (
      <button
        key={stage}
        onClick={() => openUpdateModal(workflow, stage)}
        className={`relative group flex-1 p-4 rounded-xl border-2 transition-all hover:shadow-md ${
          isCompleted ? 'bg-emerald-50 border-emerald-300' :
          isActive ? 'bg-blue-50 border-blue-300' :
          'bg-white border-slate-200 hover:border-slate-300'
        }`}
      >
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${config.bg} ${config.color}`}>
              <config.icon className="w-4 h-4" />
            </div>
            <div className="text-left">
              <div className="text-xs font-semibold text-slate-600 uppercase tracking-wide">{title}</div>
              <div className={`text-xs font-medium mt-0.5 ${config.color}`}>
                {status.replace('_', ' ')}
              </div>
            </div>
          </div>
          {index < 3 && (
            <ArrowRight className={`w-5 h-5 ${isCompleted ? 'text-emerald-400' : 'text-slate-300'}`} />
          )}
        </div>

        {assignedTo && (
          <div className="flex items-center gap-2 mt-2">
            <div className="w-6 h-6 rounded-full bg-[#bb2738] text-white text-xs font-semibold flex items-center justify-center">
              {getUserInitials(assignedTo)}
            </div>
            <span className="text-xs text-slate-600">{users.find(u => u.id === assignedTo)?.email}</span>
          </div>
        )}

        {startedAt && (
          <div className="flex items-center gap-1.5 mt-2 text-xs text-slate-500">
            <Calendar className="w-3.5 h-3.5" />
            {new Date(startedAt).toLocaleDateString()}
          </div>
        )}
      </button>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-slate-200 border-t-[#bb2738]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-900">Production Workflow</h2>
          <p className="text-slate-600 mt-1">Track and manage production stages for all orders</p>
        </div>
        <div className="flex items-center gap-3">
          {ordersWithoutWorkflows.length > 0 && (
            <button
              onClick={() => setShowOrdersWithoutWorkflows(!showOrdersWithoutWorkflows)}
              className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all shadow-sm hover:shadow font-medium"
            >
              <Plus className="w-4 h-4" />
              {ordersWithoutWorkflows.length} Missing
            </button>
          )}
          <div className="flex items-center gap-2 bg-white rounded-lg border border-slate-200 p-1">
            <button
              onClick={() => setViewMode('card')}
              className={`p-2 rounded transition-colors ${
                viewMode === 'card' ? 'bg-[#bb2738] text-white' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-2 rounded transition-colors ${
                viewMode === 'table' ? 'bg-[#bb2738] text-white' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">Total Workflows</p>
              <p className="text-3xl font-bold text-slate-900 mt-2">{stats.total}</p>
            </div>
            <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center">
              <Package className="w-6 h-6 text-slate-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">In Progress</p>
              <p className="text-3xl font-bold text-blue-600 mt-2">{stats.inProgress}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Clock className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">Completed</p>
              <p className="text-3xl font-bold text-emerald-600 mt-2">{stats.completed}</p>
            </div>
            <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-emerald-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">On Hold</p>
              <p className="text-3xl font-bold text-amber-600 mt-2">{stats.onHold}</p>
            </div>
            <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center">
              <AlertCircle className="w-6 h-6 text-amber-600" />
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Search by order number or customer..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#bb2738] focus:border-transparent bg-white shadow-sm"
          />
        </div>
        <div className="relative sm:w-64">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#bb2738] focus:border-transparent appearance-none bg-white shadow-sm"
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="passed">Passed</option>
            <option value="failed">Failed</option>
            <option value="on_hold">On Hold</option>
          </select>
        </div>
      </div>

      {showOrdersWithoutWorkflows && ordersWithoutWorkflows.length > 0 && (
        <div className="bg-gradient-to-r from-blue-50 to-blue-100 border-2 border-blue-200 rounded-xl p-6 shadow-sm">
          <h3 className="text-lg font-bold text-blue-900 mb-4 flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            Orders Without Production Workflow
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {ordersWithoutWorkflows.map(order => (
              <div key={order.id} className="flex items-center justify-between bg-white p-4 rounded-lg border border-blue-200 shadow-sm hover:shadow transition-shadow">
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-slate-800 truncate">{order.order_number}</div>
                  <div className="text-sm text-slate-600 truncate">{order.customer_name}</div>
                  <div className="text-xs text-slate-500 mt-1">{new Date(order.order_date).toLocaleDateString()}</div>
                </div>
                <button
                  onClick={() => handleCreateWorkflowForOrder(order.id, order.order_number)}
                  className="ml-3 flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium shrink-0"
                >
                  <Plus className="w-4 h-4" />
                  Create
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {filteredWorkflows.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12">
          <div className="text-center">
            <Package className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-700 mb-2">No workflows found</h3>
            <p className="text-slate-500">Create an order to start tracking production workflows</p>
          </div>
        </div>
      ) : viewMode === 'card' ? (
        <div className="space-y-4">
          {filteredWorkflows.map((workflow) => {
            const progress = calculateProgress(workflow);
            return (
              <div key={workflow.id} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-shadow">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-bold text-slate-900">{workflow.orders.order_number}</h3>
                      <p className="text-sm text-slate-600">{workflow.orders.customer_name}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-[#bb2738]">{Math.round(progress)}%</div>
                      <div className="text-xs text-slate-500 uppercase tracking-wide">Complete</div>
                    </div>
                  </div>

                  <div className="w-full bg-slate-200 rounded-full h-2 mb-6">
                    <div
                      className="bg-gradient-to-r from-[#bb2738] to-red-400 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${progress}%` }}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                    {renderStageCard(workflow, 'design_approval', 'Design Approval', 0)}
                    {renderStageCard(workflow, 'manufacturing', 'Manufacturing', 1)}
                    {renderStageCard(workflow, 'quality_check', 'Quality Check', 2)}
                    {renderStageCard(workflow, 'packaging', 'Packaging', 3)}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">Order</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">Design Approval</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">Manufacturing</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">Quality Check</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">Packaging</th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-slate-700 uppercase tracking-wider">Progress</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredWorkflows.map((workflow) => {
                  const progress = calculateProgress(workflow);
                  return (
                    <tr key={workflow.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-semibold text-slate-900">{workflow.orders.order_number}</div>
                        <div className="text-sm text-slate-600">{workflow.orders.customer_name}</div>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => openUpdateModal(workflow, 'design_approval')}
                          className="text-left hover:opacity-75 transition-opacity"
                        >
                          {getStatusBadge(workflow.design_approval_status)}
                        </button>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => openUpdateModal(workflow, 'manufacturing')}
                          className="text-left hover:opacity-75 transition-opacity"
                        >
                          {getStatusBadge(workflow.manufacturing_status)}
                        </button>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => openUpdateModal(workflow, 'quality_check')}
                          className="text-left hover:opacity-75 transition-opacity"
                        >
                          {getStatusBadge(workflow.quality_check_status)}
                        </button>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => openUpdateModal(workflow, 'packaging')}
                          className="text-left hover:opacity-75 transition-opacity"
                        >
                          {getStatusBadge(workflow.packaging_status)}
                        </button>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-3">
                          <div className="w-24 bg-slate-200 rounded-full h-2">
                            <div
                              className="bg-gradient-to-r from-[#bb2738] to-red-400 h-2 rounded-full"
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                          <span className="text-sm font-semibold text-slate-700 w-12 text-right">
                            {Math.round(progress)}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showUpdateModal && selectedWorkflow && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-white">
              <h3 className="text-xl font-bold text-slate-900">
                Update {selectedStage.replace('_', ' ').split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
              </h3>
              <p className="text-sm text-slate-600 mt-1 flex items-center gap-2">
                <Package className="w-4 h-4" />
                {selectedWorkflow.orders.order_number} - {selectedWorkflow.orders.customer_name}
              </p>
            </div>

            <div className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Status</label>
                <select
                  value={stageUpdate.status}
                  onChange={(e) => setStageUpdate({ ...stageUpdate, status: e.target.value })}
                  className="w-full border-2 border-slate-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-[#bb2738] focus:border-[#bb2738] transition-all"
                >
                  <option value="">Select status</option>
                  {selectedStage === 'design_approval' && (
                    <>
                      <option value="pending">Pending</option>
                      <option value="in_progress">In Progress</option>
                      <option value="approved">Approved</option>
                      <option value="rejected">Rejected</option>
                    </>
                  )}
                  {selectedStage === 'manufacturing' && (
                    <>
                      <option value="pending">Pending</option>
                      <option value="in_progress">In Progress</option>
                      <option value="completed">Completed</option>
                      <option value="on_hold">On Hold</option>
                    </>
                  )}
                  {selectedStage === 'quality_check' && (
                    <>
                      <option value="pending">Pending</option>
                      <option value="in_progress">In Progress</option>
                      <option value="passed">Passed</option>
                      <option value="failed">Failed</option>
                    </>
                  )}
                  {selectedStage === 'packaging' && (
                    <>
                      <option value="pending">Pending</option>
                      <option value="in_progress">In Progress</option>
                      <option value="completed">Completed</option>
                    </>
                  )}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Assign To
                </label>
                <select
                  value={stageUpdate.assignedTo}
                  onChange={(e) => setStageUpdate({ ...stageUpdate, assignedTo: e.target.value })}
                  className="w-full border-2 border-slate-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-[#bb2738] focus:border-[#bb2738] transition-all"
                >
                  <option value="">Unassigned</option>
                  {users.map(user => (
                    <option key={user.id} value={user.id}>{user.email}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Notes</label>
                <textarea
                  value={stageUpdate.notes}
                  onChange={(e) => setStageUpdate({ ...stageUpdate, notes: e.target.value })}
                  rows={4}
                  className="w-full border-2 border-slate-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-[#bb2738] focus:border-[#bb2738] transition-all resize-none"
                  placeholder="Add notes about this stage..."
                />
              </div>
            </div>

            <div className="p-6 border-t border-slate-200 bg-slate-50 flex gap-3">
              <button
                onClick={() => {
                  setShowUpdateModal(false);
                  setStageUpdate({ status: '', notes: '', assignedTo: '' });
                }}
                className="flex-1 px-4 py-3 border-2 border-slate-300 text-slate-700 font-semibold rounded-lg hover:bg-white transition-all"
              >
                Cancel
              </button>
              <button
                onClick={() => handleStageUpdate(selectedWorkflow.id, selectedStage)}
                disabled={!stageUpdate.status}
                className="flex-1 px-4 py-3 bg-[#bb2738] text-white font-semibold rounded-lg hover:bg-[#9a1f2d] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
              >
                Update Stage
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
