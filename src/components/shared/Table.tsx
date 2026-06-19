import React, { useState, useMemo } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  getFilteredRowModel,
  flexRender,
} from '@tanstack/react-table';
import type { ColumnDef, SortingState } from '@tanstack/react-table';
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ArrowUpDown,
  Download,
  SlidersHorizontal,
} from 'lucide-react';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';

interface TableProps<TData> {
  columns: ColumnDef<TData, any>[];
  data: TData[];
  searchKey?: string;
  searchPlaceholder?: string;
  bulkActions?: (selectedRows: TData[]) => React.ReactNode;
  exportFileName?: string;
  pageSize?: number;
}

export function Table<TData>({
  columns,
  data,
  searchPlaceholder = 'Search...',
  bulkActions,
  exportFileName = 'export-data',
  pageSize = 10,
}: TableProps<TData>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState('');
  const [columnVisibility, setColumnVisibility] = useState<Record<string, boolean>>({});
  const [rowSelection, setRowSelection] = useState<Record<string, boolean>>({});
  const [showVisibilityMenu, setShowVisibilityMenu] = useState(false);

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      globalFilter,
      columnVisibility,
      rowSelection,
    },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    initialState: {
      pagination: {
        pageSize: pageSize,
      },
    },
  });

  const selectedRows = useMemo(() => {
    return table.getSelectedRowModel().flatRows.map((row) => row.original);
  }, [rowSelection, data]);

  // Export to CSV
  const handleExportCSV = () => {
    // Flatten data for export
    const exportData = data.map((row: any) => {
      const flattened: Record<string, any> = {};
      table.getAllColumns().forEach((col) => {
        if (col.getIsVisible() && col.id !== 'select' && col.id !== 'actions') {
          // evaluate path or value
          const val = row[col.id];
          flattened[col.id] = typeof val === 'object' ? JSON.stringify(val) : val;
        }
      });
      return flattened;
    });

    const csv = Papa.unparse(exportData);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${exportFileName}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export to Excel
  const handleExportExcel = () => {
    const exportData = data.map((row: any) => {
      const flattened: Record<string, any> = {};
      table.getAllColumns().forEach((col) => {
        if (col.getIsVisible() && col.id !== 'select' && col.id !== 'actions') {
          const val = row[col.id];
          flattened[col.id] = typeof val === 'object' ? JSON.stringify(val) : val;
        }
      });
      return flattened;
    });

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Data');
    XLSX.writeFile(workbook, `${exportFileName}.xlsx`);
  };

  return (
    <div className="space-y-4">
      {/* Top controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <input
            type="text"
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            placeholder={searchPlaceholder}
            className="w-full px-4 py-2 bg-background-card border border-gold/10 rounded-xl text-white placeholder-text-muted focus:border-gold focus:ring-1 focus:ring-gold text-sm"
          />
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-3 self-end md:self-auto">
          {/* Column Visibility Menu */}
          <div className="relative">
            <button
              onClick={() => setShowVisibilityMenu(!showVisibilityMenu)}
              className="flex items-center gap-2 px-3 py-2 bg-background-card hover:bg-background-card/80 border border-gold/10 hover:border-gold/30 rounded-xl text-xs font-semibold text-text-muted hover:text-white transition-all cursor-pointer"
            >
              <SlidersHorizontal className="w-4 h-4 text-gold" />
              Columns
            </button>
            {showVisibilityMenu && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowVisibilityMenu(false)} />
                <div className="absolute right-0 mt-2 w-48 bg-background-card border border-gold/10 rounded-xl shadow-xl z-20 p-2 space-y-1">
                  <div className="px-2 py-1 text-xxs font-bold text-gold uppercase tracking-wider">Toggle Columns</div>
                  {table.getAllLeafColumns().map((column) => {
                    if (column.id === 'select' || column.id === 'actions') return null;
                    return (
                      <label
                        key={column.id}
                        className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-white/5 text-xs text-text-muted hover:text-white cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={column.getIsVisible()}
                          onChange={column.getToggleVisibilityHandler()}
                          className="rounded border-gold/20 text-gold focus:ring-gold accent-gold"
                        />
                        {column.id}
                      </label>
                    );
                  })}
                </div>
              </>
            )}
          </div>

          {/* Export CSV/Excel */}
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-3 py-2 bg-background-card hover:bg-background-card/80 border border-gold/10 hover:border-gold/30 rounded-xl text-xs font-semibold text-text-muted hover:text-white transition-all cursor-pointer"
          >
            <Download className="w-4 h-4 text-gold" />
            CSV
          </button>
          <button
            onClick={handleExportExcel}
            className="flex items-center gap-2 px-3 py-2 bg-background-card hover:bg-background-card/80 border border-gold/10 hover:border-gold/30 rounded-xl text-xs font-semibold text-text-muted hover:text-white transition-all cursor-pointer"
          >
            <Download className="w-4 h-4 text-gold" />
            Excel
          </button>
        </div>
      </div>

      {/* Bulk actions drawer */}
      {selectedRows.length > 0 && bulkActions && (
        <div className="flex items-center justify-between p-3 bg-gold/10 border border-gold/20 rounded-xl animate-fade-in">
          <span className="text-xs font-semibold text-gold tracking-wide">
            {selectedRows.length} item(s) selected
          </span>
          <div className="flex items-center gap-2">
            {bulkActions(selectedRows)}
          </div>
        </div>
      )}

      {/* Data Table */}
      <div className="overflow-x-auto rounded-xl border border-white/5 bg-background-card">
        <table className="w-full border-collapse text-left text-sm text-text-muted">
          <thead className="bg-[#050B16]/50 text-xs font-bold text-gold uppercase tracking-wider border-b border-white/5">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className="px-6 py-4 font-semibold text-gold whitespace-nowrap"
                  >
                    {header.isPlaceholder ? null : (
                      <div
                        className={
                          header.column.getCanSort()
                            ? 'flex items-center gap-1 cursor-pointer select-none'
                            : ''
                        }
                        onClick={header.column.getToggleSortingHandler()}
                      >
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        {header.column.getCanSort() && (
                          <ArrowUpDown className="w-3.5 h-3.5 ml-1 text-gold/60" />
                        )}
                      </div>
                    )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="divide-y divide-white/5">
            {table.getRowModel().rows.length > 0 ? (
              table.getRowModel().rows.map((row) => (
                <tr
                  key={row.id}
                  className={`hover:bg-white/2 transition-colors duration-150 ${
                    row.getIsSelected() ? 'bg-gold/5' : ''
                  }`}
                >
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="px-6 py-3 text-white whitespace-nowrap align-middle">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={columns.length} className="px-6 py-12 text-center text-text-muted">
                  No records found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="flex items-center justify-between mt-4 text-xs font-medium text-text-muted">
        <div className="flex items-center gap-2">
          <span>
            Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount() || 1}
          </span>
          <span className="text-text-muted/40">|</span>
          <select
            value={table.getState().pagination.pageSize}
            onChange={(e) => table.setPageSize(Number(e.target.value))}
            className="px-2 py-1 bg-background-card border border-gold/10 rounded-lg text-white text-xs cursor-pointer focus:border-gold"
          >
            {[5, 10, 20, 50, 100].map((size) => (
              <option key={size} value={size}>
                Show {size}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => table.setPageIndex(0)}
            disabled={!table.getCanPreviousPage()}
            className="p-2 bg-background-card hover:bg-background-card/85 disabled:opacity-30 rounded-lg border border-gold/10 text-white cursor-pointer"
          >
            <ChevronsLeft className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            className="p-2 bg-background-card hover:bg-background-card/85 disabled:opacity-30 rounded-lg border border-gold/10 text-white cursor-pointer"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            className="p-2 bg-background-card hover:bg-background-card/85 disabled:opacity-30 rounded-lg border border-gold/10 text-white cursor-pointer"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => table.setPageIndex(table.getPageCount() - 1)}
            disabled={!table.getCanNextPage()}
            className="p-2 bg-background-card hover:bg-background-card/85 disabled:opacity-30 rounded-lg border border-gold/10 text-white cursor-pointer"
          >
            <ChevronsRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
