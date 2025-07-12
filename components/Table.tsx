
import React from 'react';

export interface ColumnDefinition<T> {
  header: string;
  accessor: keyof T | string; // Can be a key or a dot-separated path for nested objects
  render?: (row: T) => React.ReactNode;
  cellClassName?: string;
  headerClassName?: string;
}

interface TableProps<T> {
  columns: ColumnDefinition<T>[];
  data: T[];
  renderRowActions?: (row: T) => React.ReactNode;
  onRowClick?: (row: T) => void;
  isLoading?: boolean;
  emptyStateMessage?: string;
  selectableRows?: boolean;
  selectedRowIds?: Set<string | number>;
  onRowSelectionChange?: (rowId: string | number, isSelected: boolean) => void;
  onSelectAllRows?: (isSelected: boolean, currentRowIds: (string | number)[]) => void;
}

const getNestedValue = (obj: any, path: string) => {
  return path.split('.').reduce((acc, part) => acc && acc[part], obj);
};

const Table = <T extends { id: string | number }>({
  columns,
  data,
  renderRowActions,
  onRowClick,
  isLoading = false,
  emptyStateMessage = "No data available.",
  selectableRows = false,
  selectedRowIds = new Set(),
  onRowSelectionChange,
  onSelectAllRows,
}: TableProps<T>) => {
  // Safeguard: ensure data is always an array for internal operations
  const tableData = Array.isArray(data) ? data : [];

  const allCurrentRowIds = tableData.map(row => row.id);
  const isAllSelected = allCurrentRowIds.length > 0 && allCurrentRowIds.every(id => selectedRowIds.has(id));
  const isIndeterminate = !isAllSelected && allCurrentRowIds.some(id => selectedRowIds.has(id));

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (onSelectAllRows) {
      onSelectAllRows(e.target.checked, allCurrentRowIds);
    }
  };

  const handleRowSelect = (rowId: string | number, isSelected: boolean) => {
    if (onRowSelectionChange) {
      onRowSelectionChange(rowId, isSelected);
    }
  };

  return (
    <div className="overflow-x-auto bg-white shadow-md rounded-lg">
      <table className="min-w-full divide-y divide-brand-neutral-200">
        <thead className="bg-brand-neutral-50">
          <tr>
            {selectableRows && (
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-brand-text-muted uppercase tracking-wider">
                <input
                  type="checkbox"
                  className="form-checkbox h-4 w-4 text-brand-primary rounded border-brand-neutral-300 focus:ring-brand-primary-light"
                  checked={isAllSelected}
                  ref={el => {
                    if (el) {
                      el.indeterminate = isIndeterminate;
                    }
                  }}
                  onChange={handleSelectAll}
                  aria-label="Select all rows on this page"
                  disabled={isLoading || tableData.length === 0}
                />
              </th>
            )}
            {columns.map((col, index) => (
              <th
                key={index}
                scope="col"
                className={`px-4 py-3 text-left text-xs font-medium text-brand-text-muted uppercase tracking-wider ${col.headerClassName || ''}`}
              >
                {col.header}
              </th>
            ))}
            {renderRowActions && (
              <th scope="col" className="relative px-4 py-3 text-xs font-medium text-brand-text-muted uppercase tracking-wider text-right">
                Actions
              </th>
            )}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-brand-neutral-100">
          {isLoading ? (
            <tr>
              <td colSpan={columns.length + (renderRowActions ? 1 : 0) + (selectableRows ? 1 : 0)} className="p-8 text-center text-brand-text-secondary">
                Loading data...
              </td>
            </tr>
          ) : tableData.length === 0 ? (
            <tr>
              <td colSpan={columns.length + (renderRowActions ? 1 : 0) + (selectableRows ? 1 : 0)} className="p-8 text-center text-brand-text-secondary">
                {emptyStateMessage}
              </td>
            </tr>
          ) : (
            tableData.map((row) => (
              <tr
                key={row.id}
                className={`hover:bg-brand-neutral-50/50 transition-colors duration-150 ${onRowClick && !selectableRows ? 'cursor-pointer' : ''} ${selectedRowIds.has(row.id) ? 'bg-brand-primary-light/10' : ''}`}
                onClick={onRowClick && !selectableRows ? () => onRowClick(row) : undefined}
              >
                {selectableRows && (
                  <td className="px-4 py-3 whitespace-nowrap">
                    <input
                      type="checkbox"
                      className="form-checkbox h-4 w-4 text-brand-primary rounded border-brand-neutral-300 focus:ring-brand-primary-light"
                      checked={selectedRowIds.has(row.id)}
                      onChange={(e) => handleRowSelect(row.id, e.target.checked)}
                      aria-label={`Select row ${row.id}`}
                    />
                  </td>
                )}
                {columns.map((col, index) => (
                  <td key={index} className={`px-4 py-3 whitespace-nowrap text-sm text-brand-text-secondary ${col.cellClassName || ''}`}>
                    {col.render ? col.render(row) : String(getNestedValue(row, col.accessor as string) ?? '')}
                  </td>
                ))}
                {renderRowActions && (
                  <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium space-x-2">
                    {renderRowActions(row)}
                  </td>
                )}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

export default Table;
