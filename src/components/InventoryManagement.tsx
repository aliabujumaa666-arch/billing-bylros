import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Search, Plus, CreditCard as Edit2, AlertTriangle, Package, TrendingDown, TrendingUp, Filter } from 'lucide-react';

interface InventoryItem {
  id: string;
  item_type: string;
  sku: string;
  name: string;
  description: string | null;
  category: string | null;
  quantity_in_stock: number;
  minimum_quantity: number;
  unit_of_measure: string;
  unit_cost: number;
  unit_price: number;
  supplier_name: string | null;
  supplier_contact: string | null;
  lead_time_days: number;
  location: string | null;
  notes: string | null;
  is_active: boolean;
  created_at: string;
}

interface Transaction {
  id: string;
  transaction_type: string;
  quantity: number;
  transaction_date: string;
  notes: string | null;
}

export function InventoryManagement() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [formData, setFormData] = useState({
    item_type: 'material',
    sku: '',
    name: '',
    description: '',
    category: '',
    quantity_in_stock: 0,
    minimum_quantity: 0,
    unit_of_measure: 'unit',
    unit_cost: 0,
    unit_price: 0,
    supplier_name: '',
    supplier_contact: '',
    lead_time_days: 7,
    location: '',
    notes: '',
  });
  const [transactionData, setTransactionData] = useState({
    transaction_type: 'purchase',
    quantity: 0,
    notes: '',
  });

  useEffect(() => {
    loadItems();
  }, []);

  const loadItems = async () => {
    try {
      const { data, error } = await supabase
        .from('inventory_items')
        .select('*')
        .order('name');

      if (error) throw error;
      setItems(data || []);
    } catch (error) {
      console.error('Error loading inventory:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddItem = async () => {
    try {
      const { error } = await supabase
        .from('inventory_items')
        .insert([formData]);

      if (error) throw error;

      await loadItems();
      setShowAddModal(false);
      resetForm();
    } catch (error) {
      console.error('Error adding item:', error);
      alert('Failed to add item');
    }
  };

  const handleTransaction = async () => {
    if (!selectedItem) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      let quantityChange = transactionData.quantity;
      if (['usage', 'adjustment'].includes(transactionData.transaction_type) && quantityChange > 0) {
        quantityChange = -quantityChange;
      }

      const newQuantity = selectedItem.quantity_in_stock + quantityChange;

      if (newQuantity < 0) {
        alert('Insufficient stock for this transaction');
        return;
      }

      const { error: transError } = await supabase
        .from('inventory_transactions')
        .insert([{
          inventory_item_id: selectedItem.id,
          transaction_type: transactionData.transaction_type,
          quantity: quantityChange,
          previous_quantity: selectedItem.quantity_in_stock,
          new_quantity: newQuantity,
          unit_cost: selectedItem.unit_cost,
          total_cost: Math.abs(quantityChange) * selectedItem.unit_cost,
          notes: transactionData.notes,
          performed_by: user.id,
        }]);

      if (transError) throw transError;

      const { error: updateError } = await supabase
        .from('inventory_items')
        .update({ quantity_in_stock: newQuantity })
        .eq('id', selectedItem.id);

      if (updateError) throw updateError;

      await loadItems();
      setShowTransactionModal(false);
      setTransactionData({ transaction_type: 'purchase', quantity: 0, notes: '' });
      setSelectedItem(null);
    } catch (error) {
      console.error('Error recording transaction:', error);
      alert('Failed to record transaction');
    }
  };

  const resetForm = () => {
    setFormData({
      item_type: 'material',
      sku: '',
      name: '',
      description: '',
      category: '',
      quantity_in_stock: 0,
      minimum_quantity: 0,
      unit_of_measure: 'unit',
      unit_cost: 0,
      unit_price: 0,
      supplier_name: '',
      supplier_contact: '',
      lead_time_days: 7,
      location: '',
      notes: '',
    });
  };

  const openTransactionModal = (item: InventoryItem) => {
    setSelectedItem(item);
    setShowTransactionModal(true);
  };

  const filteredItems = items.filter(item => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.category && item.category.toLowerCase().includes(searchTerm.toLowerCase()));

    if (typeFilter === 'all') return matchesSearch;
    if (typeFilter === 'low_stock') return matchesSearch && item.quantity_in_stock <= item.minimum_quantity;
    return matchesSearch && item.item_type === typeFilter;
  });

  const getLowStockCount = () => {
    return items.filter(item => item.quantity_in_stock <= item.minimum_quantity).length;
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
        <h2 className="text-2xl font-bold text-slate-800">Inventory Management</h2>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-[#bb2738] text-white rounded-lg hover:bg-[#9a1f2d] transition-colors"
        >
          <Plus className="w-5 h-5" />
          Add Item
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">Total Items</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">{items.length}</p>
            </div>
            <Package className="w-10 h-10 text-blue-600" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">Low Stock Items</p>
              <p className="text-2xl font-bold text-red-600 mt-1">{getLowStockCount()}</p>
            </div>
            <AlertTriangle className="w-10 h-10 text-red-600" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">Materials</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">
                {items.filter(i => i.item_type === 'material').length}
              </p>
            </div>
            <TrendingDown className="w-10 h-10 text-slate-600" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">Finished Products</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">
                {items.filter(i => i.item_type === 'finished_product').length}
              </p>
            </div>
            <TrendingUp className="w-10 h-10 text-green-600" />
          </div>
        </div>
      </div>

      <div className="flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name, SKU, or category..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#bb2738] focus:border-transparent"
          />
        </div>
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#bb2738] focus:border-transparent appearance-none bg-white"
          >
            <option value="all">All Types</option>
            <option value="material">Materials</option>
            <option value="finished_product">Finished Products</option>
            <option value="tool">Tools</option>
            <option value="consumable">Consumables</option>
            <option value="low_stock">Low Stock</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Item
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  SKU
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Stock
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Unit Cost
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Location
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredItems.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4">
                    <div>
                      <div className="font-medium text-slate-900">{item.name}</div>
                      {item.category && (
                        <div className="text-sm text-slate-600">{item.category}</div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">
                    {item.sku}
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                      {item.item_type.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <span className={`font-medium ${item.quantity_in_stock <= item.minimum_quantity ? 'text-red-600' : 'text-slate-900'}`}>
                        {item.quantity_in_stock}
                      </span>
                      <span className="text-sm text-slate-600">/ {item.minimum_quantity} min</span>
                      {item.quantity_in_stock <= item.minimum_quantity && (
                        <AlertTriangle className="w-4 h-4 text-red-600" />
                      )}
                    </div>
                    <div className="text-xs text-slate-500">{item.unit_of_measure}</div>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-900">
                    ${item.unit_cost.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">
                    {item.location || '-'}
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => openTransactionModal(item)}
                      className="text-[#bb2738] hover:text-[#9a1f2d] font-medium text-sm"
                    >
                      Add Transaction
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-200">
              <h3 className="text-lg font-semibold text-slate-900">Add Inventory Item</h3>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Item Type *
                  </label>
                  <select
                    value={formData.item_type}
                    onChange={(e) => setFormData({ ...formData, item_type: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#bb2738] focus:border-transparent"
                  >
                    <option value="material">Material</option>
                    <option value="finished_product">Finished Product</option>
                    <option value="tool">Tool</option>
                    <option value="consumable">Consumable</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    SKU *
                  </label>
                  <input
                    type="text"
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#bb2738] focus:border-transparent"
                    placeholder="e.g., MAT-001"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#bb2738] focus:border-transparent"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={2}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#bb2738] focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Category
                  </label>
                  <input
                    type="text"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#bb2738] focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Unit of Measure
                  </label>
                  <input
                    type="text"
                    value={formData.unit_of_measure}
                    onChange={(e) => setFormData({ ...formData, unit_of_measure: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#bb2738] focus:border-transparent"
                    placeholder="e.g., unit, kg, m²"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Initial Stock
                  </label>
                  <input
                    type="number"
                    value={formData.quantity_in_stock}
                    onChange={(e) => setFormData({ ...formData, quantity_in_stock: parseInt(e.target.value) || 0 })}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#bb2738] focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Minimum Quantity
                  </label>
                  <input
                    type="number"
                    value={formData.minimum_quantity}
                    onChange={(e) => setFormData({ ...formData, minimum_quantity: parseInt(e.target.value) || 0 })}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#bb2738] focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Unit Cost
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.unit_cost}
                    onChange={(e) => setFormData({ ...formData, unit_cost: parseFloat(e.target.value) || 0 })}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#bb2738] focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Unit Price
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.unit_price}
                    onChange={(e) => setFormData({ ...formData, unit_price: parseFloat(e.target.value) || 0 })}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#bb2738] focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Location
                  </label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#bb2738] focus:border-transparent"
                    placeholder="e.g., Warehouse A, Shelf 3"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Supplier Name
                  </label>
                  <input
                    type="text"
                    value={formData.supplier_name}
                    onChange={(e) => setFormData({ ...formData, supplier_name: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#bb2738] focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Supplier Contact
                  </label>
                  <input
                    type="text"
                    value={formData.supplier_contact}
                    onChange={(e) => setFormData({ ...formData, supplier_contact: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#bb2738] focus:border-transparent"
                    placeholder="Phone or email"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Lead Time (days)
                  </label>
                  <input
                    type="number"
                    value={formData.lead_time_days}
                    onChange={(e) => setFormData({ ...formData, lead_time_days: parseInt(e.target.value) || 7 })}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#bb2738] focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-slate-200 flex gap-3">
              <button
                onClick={() => {
                  setShowAddModal(false);
                  resetForm();
                }}
                className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAddItem}
                disabled={!formData.sku || !formData.name}
                className="flex-1 px-4 py-2 bg-[#bb2738] text-white rounded-lg hover:bg-[#9a1f2d] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Add Item
              </button>
            </div>
          </div>
        </div>
      )}

      {showTransactionModal && selectedItem && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6 border-b border-slate-200">
              <h3 className="text-lg font-semibold text-slate-900">Record Transaction</h3>
              <p className="text-sm text-slate-600 mt-1">{selectedItem.name}</p>
              <p className="text-sm text-slate-600">Current Stock: {selectedItem.quantity_in_stock} {selectedItem.unit_of_measure}</p>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Transaction Type
                </label>
                <select
                  value={transactionData.transaction_type}
                  onChange={(e) => setTransactionData({ ...transactionData, transaction_type: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#bb2738] focus:border-transparent"
                >
                  <option value="purchase">Purchase (Add Stock)</option>
                  <option value="usage">Usage (Remove Stock)</option>
                  <option value="adjustment">Adjustment</option>
                  <option value="return">Return</option>
                  <option value="transfer">Transfer</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Quantity
                </label>
                <input
                  type="number"
                  value={transactionData.quantity}
                  onChange={(e) => setTransactionData({ ...transactionData, quantity: parseInt(e.target.value) || 0 })}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#bb2738] focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Notes
                </label>
                <textarea
                  value={transactionData.notes}
                  onChange={(e) => setTransactionData({ ...transactionData, notes: e.target.value })}
                  rows={3}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#bb2738] focus:border-transparent"
                  placeholder="Add notes about this transaction..."
                />
              </div>
            </div>

            <div className="p-6 border-t border-slate-200 flex gap-3">
              <button
                onClick={() => {
                  setShowTransactionModal(false);
                  setTransactionData({ transaction_type: 'purchase', quantity: 0, notes: '' });
                  setSelectedItem(null);
                }}
                className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleTransaction}
                disabled={transactionData.quantity === 0}
                className="flex-1 px-4 py-2 bg-[#bb2738] text-white rounded-lg hover:bg-[#9a1f2d] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Record Transaction
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
