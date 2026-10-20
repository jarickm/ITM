import React, { useState, useMemo } from 'react';
import { 
  ShoppingCart, 
  Search, 
  Download, 
  Plus, 
  Edit, 
  Trash2, 
  DollarSign 
} from 'lucide-react';
import { useITM } from '../context/ITMContext';
import { RequestRecord } from '../types/itm';

interface PROnlyViewProps {
  onOpenNewPR: () => void;
  onEditRequest: (record: RequestRecord) => void;
}

export const PROnlyView: React.FC<PROnlyViewProps> = ({ onOpenNewPR, onEditRequest }) => {
  const { requests, deleteRequest, quickSearchQuery, currentUser, dropdownOptions } = useITM();
  const [search, setSearch] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');

  const departments = useMemo(() => [
    'All',
    ...Array.from(new Set([...(dropdownOptions.departments || []), ...requests.filter(r => r.requestType === 'PR').map(r => r.departmentOrBranches)].filter(Boolean)))
  ], [dropdownOptions.departments, requests]);

  const statuses = useMemo(() => [
    'All',
    ...Array.from(new Set([...(dropdownOptions.requestStatuses || []), ...requests.filter(r => r.requestType === 'PR').map(r => r.status)].filter(Boolean)))
  ], [dropdownOptions.requestStatuses, requests]);

  const prList = useMemo(() => {
    const q = (quickSearchQuery || search).trim().toLowerCase();
    return requests
      .filter(r => r.requestType === 'PR')
      .filter(r => {
        if (departmentFilter !== 'All' && r.departmentOrBranches !== departmentFilter) return false;
        if (statusFilter !== 'All' && r.status !== statusFilter) return false;
        if (q) {
          const match = 
            r.referenceNo.toLowerCase().includes(q) ||
            r.employeeOrRequesterName.toLowerCase().includes(q) ||
            r.departmentOrBranches.toLowerCase().includes(q) ||
            r.actionsTakenOrRemarks.toLowerCase().includes(q);
          if (!match) return false;
        }
        return true;
      });
  }, [requests, departmentFilter, statusFilter, quickSearchQuery, search]);

  const totalPRAmount = prList.reduce((acc, r) => acc + (r.estimatedAmount || 0), 0);

  const exportCSV = () => {
    const headers = [
      'Date',
      'Request Type',
      'Reference No. (PR/IER)',
      'Employee/Requester Name',
      'Department/Branches',
      'Actions Taken/Remarks',
      'Estimated Amount ($)',
      'Status',
    ];

    const rows = prList.map(r => [
      r.dateReported,
      r.requestType,
      `"${r.referenceNo}"`,
      `"${r.employeeOrRequesterName.replace(/"/g, '""')}"`,
      `"${r.departmentOrBranches.replace(/"/g, '""')}"`,
      `"${r.actionsTakenOrRemarks.replace(/"/g, '""')}"`,
      r.estimatedAmount || 0,
      r.status,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `ITM_Purchase_Requests_PR_${new Date().toISOString().substring(0, 10)}.csv`);
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
            <span className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-200">
              <ShoppingCart className="w-5 h-5" />
            </span>
            Purchase Requests (PR Only) Tracker
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Dedicated view for IT hardware procurement requests, vendor quotes, and budget authorization
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={exportCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-slate-50 border border-slate-300 text-xs font-semibold text-slate-700 transition-colors shadow-xs"
          >
            <Download className="w-3.5 h-3.5 text-emerald-600" />
            <span>Export PR CSV</span>
          </button>

          {canEdit && (
            <button
              onClick={onOpenNewPR}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-xs font-semibold text-white shadow-xs transition-all active:scale-95"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create Purchase Request</span>
            </button>
          )}
        </div>
      </div>

      {/* KPI banner */}
      <div className="p-4 rounded-xl bg-white border border-slate-200 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-6">
          <div>
            <div className="text-[10px] font-semibold uppercase text-slate-500">Total PR Tickets</div>
            <div className="text-xl font-black text-emerald-700">{prList.length} Requests</div>
          </div>
          <div className="border-l border-slate-200 pl-6">
            <div className="text-[10px] font-semibold uppercase text-slate-500">Total Estimated Procurement Cost</div>
            <div className="text-xl font-black text-slate-900 font-mono">
              ${totalPRAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </div>
          </div>
        </div>
        <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600">
          <DollarSign className="w-5 h-5" />
        </div>
      </div>

      {/* Filter toolbar */}
      <div className="p-3.5 rounded-xl bg-white border border-slate-200 flex items-center justify-between gap-3 text-xs shadow-xs">
        <div className="flex items-center gap-2 flex-1 max-w-lg">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search PR ref #, requester, remarks..."
              className="w-full bg-slate-50 border border-slate-300 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:bg-white"
            />
          </div>

          <select
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
            className="bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          >
            {departments.map((d) => (
              <option key={d} value={d}>{d === 'All' ? 'All Departments' : d}</option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          >
            {statuses.map((s) => (
              <option key={s} value={s}>{s === 'All' ? 'All Statuses' : s}</option>
            ))}
          </select>
        </div>

        <div className="text-[11px] text-slate-500 font-mono">
          Showing <span className="font-bold text-slate-900">{prList.length}</span> PR entries
        </div>
      </div>

      {/* Required Table Columns:
          Date | Request Type | Reference No. (PR/IER) | Employee/Requester Name | Department/Branches | Actions Taken/Remarks
      */}
      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100 text-slate-600 border-b border-slate-200 font-bold uppercase tracking-wider text-[10px]">
                <th className="p-3 min-w-[110px]">Date</th>
                <th className="p-3 min-w-[100px]">Request Type</th>
                <th className="p-3 min-w-[150px]">Reference No. (PR/IER)</th>
                <th className="p-3 min-w-[180px]">Employee/Requester Name</th>
                <th className="p-3 min-w-[150px]">Department/Branches</th>
                <th className="p-3 min-w-[280px]">Actions Taken/Remarks</th>
                <th className="p-3 min-w-[120px]">Est. Amount ($)</th>
                <th className="p-3 text-right min-w-[90px]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {prList.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-400 text-xs">
                    No Purchase Requests found.
                  </td>
                </tr>
              ) : (
                prList.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                    {/* Date */}
                    <td className="p-3 text-slate-500 font-mono text-[11px]">
                      {item.dateReported}
                    </td>

                    {/* Request Type */}
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold text-[10px]">
                        {item.requestType}
                      </span>
                    </td>

                    {/* Reference No. */}
                    <td className="p-3 font-mono font-bold text-indigo-700">
                      {item.referenceNo}
                    </td>

                    {/* Employee/Requester Name */}
                    <td className="p-3 font-semibold text-slate-900">
                      {item.employeeOrRequesterName}
                    </td>

                    {/* Department/Branches */}
                    <td className="p-3 text-slate-700">
                      {item.departmentOrBranches}
                    </td>

                    {/* Actions Taken/Remarks */}
                    <td className="p-3 text-slate-700">
                      <p className="line-clamp-2 leading-relaxed" title={item.actionsTakenOrRemarks}>
                        {item.actionsTakenOrRemarks}
                      </p>
                    </td>

                    {/* Estimated Amount */}
                    <td className="p-3 font-mono text-emerald-700 font-bold">
                      {item.estimatedAmount ? `$${item.estimatedAmount.toLocaleString()}` : '-'}
                    </td>

                    {/* Actions */}
                    <td className="p-3 text-right space-x-1">
                      {canEdit && (
                        <button
                          onClick={() => onEditRequest(item)}
                          className="p-1 rounded hover:bg-slate-100 text-slate-500 hover:text-slate-900 transition-colors"
                          title="Edit PR"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                      )}
                      {canEdit && (
                        <button
                          onClick={() => {
                            if (confirm(`Delete PR ${item.referenceNo}?`)) {
                              deleteRequest(item.id);
                            }
                          }}
                          className="p-1 rounded hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors"
                          title="Delete PR"
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
