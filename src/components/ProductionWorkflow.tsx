import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Search, Filter, CheckCircle, Clock, AlertCircle, XCircle, User, Plus } from 'lucide-react';

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
        return { icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50' };
      case 'in_progress':
        return { icon: Clock, color: 'text-blue-600', bg: 'bg-blue-50' };
      case 'rejected':
      case 'failed':
        return { icon: XCircle, color: 'text-red-600', bg: 'bg-red-50' };
      case 'on_hold':
        return { icon: AlertCircle, color: 'text-yellow-600', bg: 'bg-yellow-50' };
      default:
        return { icon: Clock, color: 'text-slate-400', bg: 'bg-slate-50' };
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

  const getStatusBadge = (status: string) => {
    const config = getStageStatus(status);
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${config.bg} ${config.color}`}>
        <config.icon className="w-3 h-3" />
        {status.replace('_', ' ')}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#bb2738]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-800">Production Workflow</h2>
        {ordersWithoutWorkflows.length > 0 && (
          <button
            onClick={() => setShowOrdersWithoutWorkflows(!showOrdersWithoutWorkflows)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            {showOrdersWithoutWorkflows ? 'Hide' : `Show ${ordersWithoutWorkflows.length} Order${ordersWithoutWorkflows.length !== 1 ? 's' : ''} Without Workflow`}
          </button>
        )}
      </div>

      <div className="flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Search by order number or customer..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#bb2738] focus:border-transparent"
          />
        </div>
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#bb2738] focus:border-transparent appearance-none bg-white"
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
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-blue-900 mb-3">Orders Without Production Workflow</h3>
          <div className="space-y-2">
            {ordersWithoutWorkflows.map(order => (
              <div key={order.id} className="flex items-center justify-between bg-white p-3 rounded-lg border border-blue-100">
                <div className="flex-1">
                  <div className="font-medium text-slate-800">{order.order_number}</div>
                  <div className="text-sm text-slate-600">{order.customer_name} • {new Date(order.order_date).toLocaleDateString()}</div>
                </div>
                <button
                  onClick={() => handleCreateWorkflowForOrder(order.id, order.order_number)}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Create Workflow
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Order
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Design Approval
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Manufacturing
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Quality Check
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Packaging
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredWorkflows.map((workflow) => (
                <tr key={workflow.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4">
                    <div>
                      <div className="font-medium text-slate-900">{workflow.orders.order_number}</div>
                      <div className="text-sm text-slate-600">{workflow.orders.customer_name}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => openUpdateModal(workflow, 'design_approval')}
                      className="text-left hover:opacity-75 transition-opacity"
                    >
                      {getStatusBadge(workflow.design_approval_status)}
                      {workflow.design_approval_started_at && (
                        <div className="text-xs text-slate-500 mt-1">
                          Started {new Date(workflow.design_approval_started_at).toLocaleDateString()}
                        </div>
                      )}
                    </button>
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => openUpdateModal(workflow, 'manufacturing')}
                      className="text-left hover:opacity-75 transition-opacity"
                    >
                      {getStatusBadge(workflow.manufacturing_status)}
                      {workflow.manufacturing_started_at && (
                        <div className="text-xs text-slate-500 mt-1">
                          Started {new Date(workflow.manufacturing_started_at).toLocaleDateString()}
                        </div>
                      )}
                    </button>
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => openUpdateModal(workflow, 'quality_check')}
                      className="text-left hover:opacity-75 transition-opacity"
                    >
                      {getStatusBadge(workflow.quality_check_status)}
                      {workflow.quality_check_started_at && (
                        <div className="text-xs text-slate-500 mt-1">
                          Started {new Date(workflow.quality_check_started_at).toLocaleDateString()}
                        </div>
                      )}
                    </button>
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => openUpdateModal(workflow, 'packaging')}
                      className="text-left hover:opacity-75 transition-opacity"
                    >
                      {getStatusBadge(workflow.packaging_status)}
                      {workflow.packaging_started_at && (
                        <div className="text-xs text-slate-500 mt-1">
                          Started {new Date(workflow.packaging_started_at).toLocaleDateString()}
                        </div>
                      )}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showUpdateModal && selectedWorkflow && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-200">
              <h3 className="text-lg font-semibold text-slate-900">
                Update {selectedStage.replace('_', ' ')} Stage
              </h3>
              <p className="text-sm text-slate-600 mt-1">
                Order: {selectedWorkflow.orders.order_number}
              </p>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Status
                </label>
                <select
                  value={stageUpdate.status}
                  onChange={(e) => setStageUpdate({ ...stageUpdate, status: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#bb2738] focus:border-transparent"
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
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  <User className="w-4 h-4 inline mr-1" />
                  Assign To
                </label>
                <select
                  value={stageUpdate.assignedTo}
                  onChange={(e) => setStageUpdate({ ...stageUpdate, assignedTo: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#bb2738] focus:border-transparent"
                >
                  <option value="">Unassigned</option>
                  {users.map(user => (
                    <option key={user.id} value={user.id}>{user.email}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Notes
                </label>
                <textarea
                  value={stageUpdate.notes}
                  onChange={(e) => setStageUpdate({ ...stageUpdate, notes: e.target.value })}
                  rows={4}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#bb2738] focus:border-transparent"
                  placeholder="Add notes about this stage..."
                />
              </div>
            </div>

            <div className="p-6 border-t border-slate-200 flex gap-3">
              <button
                onClick={() => {
                  setShowUpdateModal(false);
                  setStageUpdate({ status: '', notes: '', assignedTo: '' });
                }}
                className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleStageUpdate(selectedWorkflow.id, selectedStage)}
                disabled={!stageUpdate.status}
                className="flex-1 px-4 py-2 bg-[#bb2738] text-white rounded-lg hover:bg-[#9a1f2d] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
