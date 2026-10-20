import React, { useState, useMemo } from 'react';
import { 
  Repeat, 
  Search, 
  Download, 
  Plus, 
  Edit, 
  Trash2 
} from 'lucide-react';
import { useITM } from '../context/ITMContext';
import { BorrowingRecord } from '../types/itm';

interface BorrowingViewProps {
  onOpenNewBorrow: () => void;
  onEditBorrow: (record: BorrowingRecord) => void;
}

export const BorrowingView: React.FC<BorrowingViewProps> = ({ 
  onOpenNewBorrow, 
  onEditBorrow 
}) => {
  const { borrowings, updateBorrowing, deleteBorrowing, quickSearchQuery, currentUser, dropdownOptions } = useITM();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [departmentFilter, setDepartmentFilter] = useState('All');

  const statuses = useMemo(() => [
    'All',
    ...Array.from(new Set([...(dropdownOptions.borrowStatuses || []), ...borrowings.map(b => b.status)].filter(Boolean)))
  ], [dropdownOptions.borrowStatuses, borrowings]);

  const departments = useMemo(() => [
    'All',
    ...Array.from(new Set([...(dropdownOptions.departments || []), ...borrowings.map(b => b.department)].filter(Boolean)))
  ], [dropdownOptions.departments, borrowings]);

  const filtered = useMemo(() => {
    const q = (quickSearchQuery || search).trim().toLowerCase();
    return borrowings.filter(b => {
      if (statusFilter !== 'All' && b.status !== statusFilter) return false;
      if (departmentFilter !== 'All' && b.department !== departmentFilter) return false;
      if (q) {
        const match = 
          b.borrowerName.toLowerCase().includes(q) ||
          b.department.toLowerCase().includes(q) ||
          b.itemCategory.toLowerCase().includes(q) ||
          (b.assetCode && b.assetCode.toLowerCase().includes(q)) ||
          b.remarks.toLowerCase().includes(q);
        if (!match) return false;
      }
      return true;
    });
  }, [borrowings, statusFilter, departmentFilter, quickSearchQuery, search]);

  const handleQuickReturn = async (b: BorrowingRecord) => {
    await updateBorrowing(b.id, {
      status: 'Returned',
      actualReturnDate: new Date().toISOString().substring(0, 10),
    });
  };

  const exportCSV = () => {
    const headers = [
      'Borrower Name',
      'Department',
      'Item Category',
      'Borrow Date',
      'Return Date',
      'Actual Return Date',
      'Status',
      'Remarks',
      'Asset Code',
    ];

    const rows = filtered.map(b => [
      `"${b.borrowerName.replace(/"/g, '""')}"`,
      `"${b.department}"`,
      `"${b.itemCategory}"`,
      b.borrowDate,
      b.returnDate,
      b.actualReturnDate || '',
      b.status,
      `"${b.remarks.replace(/"/g, '""')}"`,
      b.assetCode || '',
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `ITM_Equipment_Borrowing_Tracker_${new Date().toISOString().substring(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const canEdit = currentUser.role !== 'Auditor';

  return (
    <div className="space-y-4 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-blue-50 text-blue-600 border border-blue-200">
              <Repeat className="w-5 h-5" />
            </span>
            IT Equipment Borrowing & Loan Tracker
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Checkout desk for temporary laptops, presentation adapters, barcode scanners, and tools
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={exportCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-slate-50 border border-slate-300 text-xs font-semibold text-slate-700 transition-colors shadow-xs"
          >
            <Download className="w-3.5 h-3.5 text-blue-600" />
            <span>Export CSV</span>
          </button>

          {canEdit && (
            <button
              onClick={onOpenNewBorrow}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-xs font-semibold text-white shadow-xs transition-all active:scale-95"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Checkout Equipment</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter toolbar */}
      <div className="p-3.5 rounded-xl bg-white border border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs shadow-xs">
        <div className="flex items-center gap-2 flex-1 max-w-sm">
          <div className="relative w-full">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search borrower, item, department..."
              className="w-full bg-slate-50 border border-slate-300 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white"
            />
          </div>

          <select
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
            className="bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            {departments.map((d) => (
              <option key={d} value={d}>{d === 'All' ? 'All Departments' : d}</option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            {statuses.map((s) => (
              <option key={s} value={s}>{s === 'All' ? 'All Statuses' : s}</option>
            ))}
          </select>
        </div>

        <div className="text-[11px] text-slate-500 font-mono">
          Showing <span className="font-bold text-slate-900">{filtered.length}</span> borrowing records
        </div>
      </div>

      {/* Required Table Columns:
          Borrower Name | Department | Item Category | Borrow Date | Return Date | Status | Remarks
      */}
      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100 text-slate-600 border-b border-slate-200 font-bold uppercase tracking-wider text-[10px]">
                <th className="p-3 min-w-[160px]">Borrower Name</th>
                <th className="p-3 min-w-[130px]">Department</th>
                <th className="p-3 min-w-[160px]">Item Category</th>
                <th className="p-3 min-w-[110px]">Borrow Date</th>
                <th className="p-3 min-w-[110px]">Return Date</th>
                <th className="p-3 min-w-[130px]">Status</th>
                <th className="p-3 min-w-[240px]">Remarks</th>
                <th className="p-3 text-right min-w-[120px]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-400 text-xs">
                    No borrowing records found.
                  </td>
                </tr>
              ) : (
                filtered.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                    {/* Borrower Name */}
                    <td className="p-3 font-semibold text-slate-900">
                      <div>{item.borrowerName}</div>
                      {item.assetCode && (
                        <div className="text-[10px] text-indigo-700 font-mono font-medium">Tag: {item.assetCode}</div>
                      )}
                    </td>

                    {/* Department */}
                    <td className="p-3 text-slate-700">
                      {item.department}
                    </td>

                    {/* Item Category */}
                    <td className="p-3 text-slate-700 font-medium">
                      {item.itemCategory}
                    </td>

                    {/* Borrow Date */}
                    <td className="p-3 text-slate-500 font-mono text-[11px]">
                      {item.borrowDate}
                    </td>

                    {/* Return Date */}
                    <td className="p-3 text-slate-500 font-mono text-[11px]">
                      <div className={item.status === 'Overdue' ? 'text-rose-700 font-bold' : ''}>
                        {item.returnDate}
                      </div>
                      {item.actualReturnDate && (
                        <div className="text-[10px] text-slate-400">Returned: {item.actualReturnDate}</div>
                      )}
                    </td>

                    {/* Status */}
                    <td className="p-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                        item.status === 'Returned' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                        item.status === 'Overdue' ? 'bg-rose-50 text-rose-700 border-rose-200 animate-pulse font-bold' :
                        item.status === 'Damaged on Return' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                        'bg-blue-50 text-blue-700 border-blue-200'
                      }`}>
                        {item.status}
                      </span>
                    </td>

                    {/* Remarks */}
                    <td className="p-3 text-slate-700">
                      <p className="line-clamp-2 leading-relaxed" title={item.remarks}>
                        {item.remarks}
                      </p>
                    </td>

                    {/* Actions */}
                    <td className="p-3 text-right space-x-1">
                      {canEdit && item.status !== 'Returned' && (
                        <button
                          onClick={() => handleQuickReturn(item)}
                          className="px-2 py-1 rounded bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-800 text-[10px] font-semibold transition-colors"
                          title="Mark Returned Today"
                        >
                          Return
                        </button>
                      )}
                      {canEdit && (
                        <button
                          onClick={() => onEditBorrow(item)}
                          className="p-1 rounded hover:bg-slate-100 text-slate-500 hover:text-slate-900 transition-colors"
                          title="Edit Loan"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                      )}
                      {canEdit && (
                        <button
                          onClick={() => {
                            if (confirm(`Delete borrowing record for ${item.borrowerName}?`)) {
                              deleteBorrowing(item.id);
                            }
                          }}
                          className="p-1 rounded hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors"
                          title="Delete Loan"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
