import React, { useState, useMemo } from 'react';
import { 
  ClipboardCheck, 
  Search, 
  Download, 
  Plus, 
  Edit, 
  Trash2, 
  Printer 
} from 'lucide-react';
import { useITM } from '../context/ITMContext';
import { LiabilityRecord } from '../types/itm';

interface LiabilitiesViewProps {
  onOpenNewLiability: () => void;
  onEditLiability: (record: LiabilityRecord) => void;
}

export const LiabilitiesView: React.FC<LiabilitiesViewProps> = ({ 
  onOpenNewLiability, 
  onEditLiability 
}) => {
  const { liabilities, deleteLiability, quickSearchQuery, currentUser, dropdownOptions } = useITM();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [departmentFilter, setDepartmentFilter] = useState('All');

  const statuses = useMemo(() => [
    'All',
    ...Array.from(new Set([...(dropdownOptions.liabilityStatuses || []), ...liabilities.map(l => l.status)].filter(Boolean)))
  ], [dropdownOptions.liabilityStatuses, liabilities]);

  const departments = useMemo(() => [
    'All',
    ...Array.from(new Set([...(dropdownOptions.departments || []), ...liabilities.map(l => l.department)].filter(Boolean)))
  ], [dropdownOptions.departments, liabilities]);

  const filtered = useMemo(() => {
    const q = (quickSearchQuery || search).trim().toLowerCase();
    return liabilities.filter(l => {
      if (statusFilter !== 'All' && l.status !== statusFilter) return false;
      if (departmentFilter !== 'All' && l.department !== departmentFilter) return false;
      if (q) {
        const match = 
          l.employeeName.toLowerCase().includes(q) ||
          l.assetCode.toLowerCase().includes(q) ||
          l.itemDescription.toLowerCase().includes(q) ||
          l.department.toLowerCase().includes(q) ||
          l.company.toLowerCase().includes(q);
        if (!match) return false;
      }
      return true;
    });
  }, [liabilities, statusFilter, departmentFilter, quickSearchQuery, search]);

  const exportCSV = () => {
    const headers = [
      'Qty',
      'UOM',
      'Item Description',
      'Date Issued',
      'Employee Name',
      'Department',
      'Asset Code',
      'Company',
      'Status',
    ];

    const rows = filtered.map(l => [
      l.qty,
      l.uom,
      `"${l.itemDescription.replace(/"/g, '""')}"`,
      l.dateIssued,
      `"${l.employeeName.replace(/"/g, '""')}"`,
      `"${l.department}"`,
      `"${l.assetCode}"`,
      `"${l.company}"`,
      l.status,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `ITM_Liability_Records_${new Date().toISOString().substring(0, 10)}.csv`);
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
            <span className="p-1.5 rounded-lg bg-teal-50 text-teal-600 border border-teal-200">
              <ClipboardCheck className="w-5 h-5" />
            </span>
            Equipment Liability & Accountability Custody Records
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Formal equipment acknowledgment slips, employee property custody contracts, and clearance verification
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={exportCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-slate-50 border border-slate-300 text-xs font-semibold text-slate-700 transition-colors shadow-xs"
          >
            <Download className="w-3.5 h-3.5 text-teal-600" />
            <span>Export CSV</span>
          </button>

          {canEdit && (
            <button
              onClick={onOpenNewLiability}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-xs font-semibold text-white shadow-xs transition-all active:scale-95"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Issue Liability Record</span>
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
              placeholder="Search employee, asset code, description..."
              className="w-full bg-slate-50 border border-slate-300 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-teal-500 focus:bg-white"
            />
          </div>

          <select
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
            className="bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-teal-500"
          >
            {departments.map((d) => (
              <option key={d} value={d}>{d === 'All' ? 'All Departments' : d}</option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-teal-500"
          >
            {statuses.map((s) => (
              <option key={s} value={s}>{s === 'All' ? 'All Custody Statuses' : s}</option>
            ))}
          </select>
        </div>

        <div className="text-[11px] text-slate-500 font-mono">
          Showing <span className="font-bold text-slate-900">{filtered.length}</span> liability forms
        </div>
      </div>

      {/* Required Table Columns:
          Qty | UOM | Item Description | Date Issued | Employee Name | Department | Asset Code | Company
      */}
      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100 text-slate-600 border-b border-slate-200 font-bold uppercase tracking-wider text-[10px]">
                <th className="p-3 min-w-[70px] text-center">Qty</th>
                <th className="p-3 min-w-[80px]">UOM</th>
                <th className="p-3 min-w-[260px]">Item Description</th>
                <th className="p-3 min-w-[110px]">Date Issued</th>
                <th className="p-3 min-w-[160px]">Employee Name</th>
                <th className="p-3 min-w-[130px]">Department</th>
                <th className="p-3 min-w-[140px]">Asset Code</th>
                <th className="p-3 min-w-[160px]">Company</th>
                <th className="p-3 min-w-[130px]">Custody Status</th>
                <th className="p-3 text-right min-w-[90px]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={10} className="p-8 text-center text-slate-400 text-xs">
                    No liability or custody records found.
                  </td>
                </tr>
              ) : (
                filtered.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                    {/* Qty */}
                    <td className="p-3 font-bold text-slate-900 text-center">
                      {item.qty}
                    </td>

                    {/* UOM */}
                    <td className="p-3 text-slate-700">
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-[11px] font-mono border border-slate-200">
                        {item.uom}
                      </span>
                    </td>

                    {/* Item Description */}
                    <td className="p-3 font-semibold text-slate-900">
                      <p className="line-clamp-2 leading-relaxed" title={item.itemDescription}>
                        {item.itemDescription}
                      </p>
                    </td>

                    {/* Date Issued */}
                    <td className="p-3 text-slate-500 font-mono text-[11px]">
                      {item.dateIssued}
                    </td>

                    {/* Employee Name */}
                    <td className="p-3 font-medium text-slate-900">
                      {item.employeeName}
                    </td>

                    {/* Department */}
                    <td className="p-3 text-slate-700">
                      {item.department}
                    </td>

                    {/* Asset Code */}
                    <td className="p-3 font-mono font-bold text-teal-700">
                      {item.assetCode}
                    </td>

                    {/* Company */}
                    <td className="p-3 text-slate-700">
                      {item.company}
                    </td>

                    {/* Status */}
                    <td className="p-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                        item.status === 'Active Accountability' ? 'bg-teal-50 text-teal-700 border-teal-200' :
                        item.status === 'Surrendered' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                        'bg-amber-50 text-amber-700 border-amber-200'
                      }`}>
                        {item.status}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="p-3 text-right space-x-1">
                      <button
                        onClick={() => onEditLiability(item)}
                        className="p-1 rounded hover:bg-slate-100 text-teal-600 hover:text-teal-800 transition-colors"
                        title="Print Accountability Form / Edit"
                      >
                        <Printer className="w-3.5 h-3.5" />
                      </button>
                      {canEdit && (
                        <button
                          onClick={() => {
                            if (confirm(`Delete liability record for ${item.employeeName}?`)) {
                              deleteLiability(item.id);
                            }
                          }}
                          className="p-1 rounded hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors"
                          title="Delete Record"
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
