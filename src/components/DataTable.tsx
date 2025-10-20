import { useState, useMemo } from 'react';
import { ChevronDown, ChevronUp, ChevronsUpDown, Filter, X } from 'lucide-react';

interface Column<T> {
  key: keyof T | string;
  label: string;
  sortable?: boolean;
  filterable?: boolean;
  render?: (row: T) => React.ReactNode;
  width?: string;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  onRowClick?: (row: T) => void;
  selectedRows?: Set<string>;
  onSelectionChange?: (selectedIds: Set<string>) => void;
  idKey?: keyof T;
  emptyMessage?: string;
}

export function DataTable<T extends Record<string, any>>({
  data,
  columns,
  onRowClick,
  selectedRows,
  onSelectionChange,
  idKey = 'id' as keyof T,
  emptyMessage = 'No data available'
}: DataTableProps<T>) {
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: 'asc' | 'desc';
  } | null>(null);
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [showFilters, setShowFilters] = useState(false);

  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const clearFilter = (key: string) => {
    setFilters(prev => {
      const newFilters = { ...prev };
      delete newFilters[key];
      return newFilters;
    });
  };

  const clearAllFilters = () => {
    setFilters({});
  };

  const handleSelectAll = (checked: boolean) => {
    if (!onSelectionChange) return;

    if (checked) {
      const allIds = new Set(data.map(row => String(row[idKey])));
      onSelectionChange(allIds);
    } else {
      onSelectionChange(new Set());
    }
  };

  const handleSelectRow = (id: string, checked: boolean) => {
    if (!onSelectionChange || !selectedRows) return;

    const newSelection = new Set(selectedRows);
    if (checked) {
      newSelection.add(id);
    } else {
      newSelection.delete(id);
    }
    onSelectionChange(newSelection);
  };

  const processedData = useMemo(() => {
    let result = [...data];

    Object.entries(filters).forEach(([key, value]) => {
      if (value) {
        result = result.filter(row => {
          const cellValue = String(row[key] || '').toLowerCase();
          return cellValue.includes(value.toLowerCase());
        });
      }
    });

    if (sortConfig) {
      result.sort((a, b) => {
        const aValue = a[sortConfig.key];
        const bValue = b[sortConfig.key];

        if (aValue === null || aValue === undefined) return 1;
        if (bValue === null || bValue === undefined) return -1;

        if (typeof aValue === 'number' && typeof bValue === 'number') {
          return sortConfig.direction === 'asc' ? aValue - bValue : bValue - aValue;
        }

        const aString = String(aValue).toLowerCase();
        const bString = String(bValue).toLowerCase();

        if (aString < bString) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aString > bString) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return result;
  }, [data, filters, sortConfig]);

  const activeFilterCount = Object.values(filters).filter(v => v).length;
  const allSelected = selectedRows && data.length > 0 && selectedRows.size === data.length;
  const someSelected = selectedRows && selectedRows.size > 0 && !allSelected;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {selectedRows && selectedRows.size > 0 && (
            <span className="text-sm text-slate-600">
              {selectedRows.size} selected
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {activeFilterCount > 0 && (
            <button
              onClick={clearAllFilters}
              className="flex items-center gap-1 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
              Clear filters ({activeFilterCount})
            </button>
          )}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors ${
              showFilters
                ? 'bg-[#bb2738] text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Filter className="w-4 h-4" />
            Filters
          </button>
        </div>
      </div>

      {showFilters && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 p-4 bg-slate-50 rounded-lg border border-slate-200">
          {columns.filter(col => col.filterable !== false).map((column) => (
            <div key={String(column.key)}>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                {column.label}
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={filters[String(column.key)] || ''}
                  onChange={(e) => handleFilterChange(String(column.key), e.target.value)}
                  placeholder={`Filter ${column.label.toLowerCase()}...`}
                  className="w-full px-3 py-2 pr-8 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-[#bb2738]"
                />
                {filters[String(column.key)] && (
                  <button
                    onClick={() => clearFilter(String(column.key))}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-slate-200 rounded"
                  >
                    <X className="w-3 h-3 text-slate-500" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="overflow-x-auto rounded-lg border border-slate-200">
        <table className="w-full">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              {onSelectionChange && (
                <th className="px-4 py-3 text-left w-12">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    ref={input => {
                      if (input) input.indeterminate = someSelected || false;
                    }}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300 text-[#bb2738] focus:ring-[#bb2738]"
                  />
                </th>
              )}
              {columns.map((column) => (
                <th
                  key={String(column.key)}
                  className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider"
                  style={{ width: column.width }}
                >
                  {column.sortable !== false ? (
                    <button
                      onClick={() => handleSort(String(column.key))}
                      className="flex items-center gap-2 hover:text-[#bb2738] transition-colors group"
                    >
                      <span>{column.label}</span>
                      {sortConfig?.key === String(column.key) ? (
                        sortConfig.direction === 'asc' ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )
                      ) : (
                        <ChevronsUpDown className="w-4 h-4 opacity-0 group-hover:opacity-50 transition-opacity" />
                      )}
                    </button>
                  ) : (
                    column.label
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 bg-white">
            {processedData.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length + (onSelectionChange ? 1 : 0)}
                  className="px-4 py-12 text-center text-slate-500"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              processedData.map((row, index) => {
                const rowId = String(row[idKey]);
                const isSelected = selectedRows?.has(rowId);

                return (
                  <tr
                    key={rowId || index}
                    onClick={() => onRowClick?.(row)}
                    className={`transition-colors ${
                      onRowClick ? 'cursor-pointer hover:bg-slate-50' : ''
                    } ${isSelected ? 'bg-blue-50' : ''}`}
                  >
                    {onSelectionChange && (
                      <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) => handleSelectRow(rowId, e.target.checked)}
                          className="w-4 h-4 rounded border-slate-300 text-[#bb2738] focus:ring-[#bb2738]"
                        />
                      </td>
                    )}
                    {columns.map((column) => (
                      <td
                        key={String(column.key)}
                        className="px-4 py-3 text-sm text-slate-800"
                      >
                        {column.render
                          ? column.render(row)
                          : String(row[column.key] ?? '')}
                      </td>
                    ))}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {processedData.length > 0 && (
        <div className="flex items-center justify-between text-sm text-slate-600">
          <span>
            Showing {processedData.length} of {data.length} results
          </span>
        </div>
      )}
    </div>
  );
}
