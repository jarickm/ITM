import React, { useState, useMemo } from 'react';
import { 
  FileText, 
  Search, 
  Download, 
  Plus, 
  Edit, 
  Trash2 
} from 'lucide-react';
import { useITM } from '../context/ITMContext';
import { RequestRecord, RequestType, RequestPriority } from '../types/itm';

interface RequestsViewProps {
  onOpenNewRequest: (defaultType?: RequestType) => void;
  onEditRequest: (record: RequestRecord) => void;
}

export const RequestsView: React.FC<RequestsViewProps> = ({ 
  onOpenNewRequest, 
  onEditRequest 
}) => {
  const { requests, deleteRequest, quickSearchQuery, currentUser, dropdownOptions } = useITM();
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<'All' | 'PR' | 'IER'>('All');
  const [priorityFilter, setPriorityFilter] = useState<string>('All');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [departmentFilter, setDepartmentFilter] = useState<string>('All');

  const priorities = useMemo(() => [
    'All',
    ...Array.from(new Set([...(dropdownOptions.requestPriorities || []), ...requests.map(r => r.majorOrMinor)].filter(Boolean)))
  ], [dropdownOptions.requestPriorities, requests]);

  const statuses = useMemo(() => [
    'All',
    ...Array.from(new Set([...(dropdownOptions.requestStatuses || []), ...requests.map(r => r.status)].filter(Boolean)))
  ], [dropdownOptions.requestStatuses, requests]);

  const departments = useMemo(() => [
    'All',
    ...Array.from(new Set([...(dropdownOptions.departments || []), ...requests.map(r => r.departmentOrBranches)].filter(Boolean)))
  ], [dropdownOptions.departments, requests]);

  const filtered = useMemo(() => {
    const q = (quickSearchQuery || search).trim().toLowerCase();
    return requests.filter(r => {
      if (typeFilter !== 'All' && r.requestType !== typeFilter) return false;
      if (priorityFilter !== 'All' && r.majorOrMinor !== priorityFilter) return false;
      if (statusFilter !== 'All' && r.status !== statusFilter) return false;
      if (departmentFilter !== 'All' && r.departmentOrBranches !== departmentFilter) return false;
      if (q) {
        const match = 
          r.referenceNo.toLowerCase().includes(q) ||
          r.employeeOrRequesterName.toLowerCase().includes(q) ||
          r.departmentOrBranches.toLowerCase().includes(q) ||
          r.actionsTakenOrRemarks.toLowerCase().includes(q) ||
          r.requestType.toLowerCase().includes(q);
        if (!match) return false;
      }
      return true;
    });
  }, [requests, typeFilter, priorityFilter, statusFilter, departmentFilter, quickSearchQuery, search]);

  const exportCSV = () => {
    const headers = [
      'DATE REPORTED',
      'Request Type',
      'Reference No. (PR/IER)',
      'Employee/Requester Name',
      'Department/Branches',
      'Actions Taken/Remarks',
      'DATE CREATED IER/PR',
      'DATE RESOLVED',
      'DAYS',
      'Major/Minor',
      'Status',
    ];

    const rows = filtered.map(r => [
      r.dateReported,
      r.requestType,
      `"${r.referenceNo}"`,
      `"${r.employeeOrRequesterName.replace(/"/g, '""')}"`,
      `"${r.departmentOrBranches.replace(/"/g, '""')}"`,
      `"${r.actionsTakenOrRemarks.replace(/"/g, '""')}"`,
      r.dateCreated,
      r.dateResolved || '',
      r.days,
      r.majorOrMinor,
      r.status,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `ITM_PR_IER_Records_${new Date().toISOString().substring(0, 10)}.csv`);
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
            <span className="p-1.5 rounded-lg bg-purple-50 text-purple-600 border border-purple-200">
              <FileText className="w-5 h-5" />
            </span>
            PR & IER Requests Central Desk
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Purchase Requests (PR) and Incident / Equipment Requests (IER) with SLA turnaround tracking
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={exportCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-slate-50 border border-slate-300 text-xs font-semibold text-slate-700 transition-colors shadow-xs"
          >
            <Download className="w-3.5 h-3.5 text-purple-600" />
            <span>Export CSV</span>
          </button>

          {canEdit && (
            <button
              onClick={() => onOpenNewRequest('PR')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-xs font-semibold text-white shadow-xs transition-all active:scale-95"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create PR</span>
            </button>
          )}

          {canEdit && (
            <button
              onClick={() => onOpenNewRequest('IER')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-xs font-semibold text-white shadow-xs transition-all active:scale-95"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create IER</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter toolbar */}
      <div className="p-3.5 rounded-xl bg-white border border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs shadow-xs">
        <div className="flex flex-wrap items-center gap-2 flex-1 min-w-[280px]">
          <div className="relative flex-1 min-w-[180px] max-w-xs">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filter by ref #, requester, branch..."
              className="w-full bg-slate-50 border border-slate-300 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-purple-500 focus:bg-white"
            />
          </div>

          {/* Type Filter Tabs */}
          <div className="flex rounded-lg bg-slate-100 border border-slate-200 p-0.5">
            <button
              onClick={() => setTypeFilter('All')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors ${typeFilter === 'All' ? 'bg-purple-600 text-white font-semibold' : 'text-slate-600 hover:text-slate-900'}`}
            >
              All Types
            </button>
            <button
              onClick={() => setTypeFilter('PR')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors ${typeFilter === 'PR' ? 'bg-emerald-600 text-white font-semibold' : 'text-slate-600 hover:text-slate-900'}`}
            >
              PR Only
            </button>
            <button
              onClick={() => setTypeFilter('IER')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors ${typeFilter === 'IER' ? 'bg-purple-600 text-white font-semibold' : 'text-slate-600 hover:text-slate-900'}`}
            >
              IER Only
            </button>
          </div>

          {/* Department Filter */}
          <select
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
            className="bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-purple-500"
          >
            {departments.map((d) => (
              <option key={d} value={d}>{d === 'All' ? 'All Departments' : d}</option>
            ))}
          </select>

          {/* Major / Minor Filter */}
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-purple-500"
          >
            {priorities.map((p) => (
              <option key={p} value={p}>{p === 'All' ? 'All Severities' : p}</option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-purple-500"
          >
            {statuses.map((s) => (
              <option key={s} value={s}>{s === 'All' ? 'All Statuses' : s}</option>
            ))}
          </select>
        </div>

        <div className="text-[11px] text-slate-500 font-mono">
          Showing <span className="font-bold text-slate-900">{filtered.length}</span> tickets
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100 text-slate-600 border-b border-slate-200 font-bold uppercase tracking-wider text-[10px]">
                <th className="p-3 min-w-[110px]">DATE REPORTED</th>
                <th className="p-3 min-w-[90px]">Request Type</th>
                <th className="p-3 min-w-[140px]">Reference No. (PR/IER)</th>
                <th className="p-3 min-w-[160px]">Employee / Requester</th>
                <th className="p-3 min-w-[140px]">Department / Branches</th>
                <th className="p-3 min-w-[260px]">Actions Taken / Remarks</th>
                <th className="p-3 min-w-[120px]">DATE CREATED</th>
                <th className="p-3 min-w-[120px]">DATE RESOLVED</th>
                <th className="p-3 min-w-[80px]">DAYS</th>
                <th className="p-3 min-w-[100px]">Major/Minor</th>
                <th className="p-3 text-right min-w-[90px]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={11} className="p-8 text-center text-slate-400 text-xs">
                    No PR or IER records match your search filter.
                  </td>
                </tr>
              ) : (
                filtered.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                    {/* DATE REPORTED */}
                    <td className="p-3 text-slate-500 font-mono text-[11px]">
                      {item.dateReported}
                    </td>

                    {/* Request Type */}
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                        item.requestType === 'PR' 
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                          : 'bg-purple-50 text-purple-700 border border-purple-200'
                      }`}>
                        {item.requestType}
                      </span>
                    </td>

                    {/* Reference No. (PR/IER) */}
                    <td className="p-3 font-mono font-bold text-indigo-700">
                      {item.referenceNo}
                    </td>

                    {/* Employee / Requester Name */}
                    <td className="p-3 font-semibold text-slate-900">
                      {item.employeeOrRequesterName}
                    </td>

                    {/* Department / Branches */}
                    <td className="p-3 text-slate-700">
                      {item.departmentOrBranches}
                    </td>

                    {/* Actions Taken / Remarks */}
                    <td className="p-3 text-slate-700">
                      <p className="line-clamp-2 leading-relaxed" title={item.actionsTakenOrRemarks}>
                        {item.actionsTakenOrRemarks}
                      </p>
                    </td>

                    {/* DATE CREATED IER/PR */}
                    <td className="p-3 text-slate-500 font-mono text-[11px]">
                      {item.dateCreated}
                    </td>

                    {/* DATE RESOLVED */}
                    <td className="p-3 text-slate-500 font-mono text-[11px]">
                      {item.dateResolved ? (
                        <span className="text-emerald-700 font-medium">{item.dateResolved}</span>
                      ) : (
                        <span className="text-amber-700 italic">Pending</span>
                      )}
                    </td>

                    {/* DAYS */}
                    <td className="p-3 font-mono font-bold text-center">
                      <span className={`px-2 py-0.5 rounded text-[11px] ${
                        item.days > 5 ? 'bg-rose-50 text-rose-700' : 'bg-slate-100 text-slate-700'
                      }`}>
                        {item.days} d
                      </span>
                    </td>

                    {/* Major / Minor */}
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${
                        item.majorOrMinor === 'Critical' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                        item.majorOrMinor === 'Major' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                        'bg-slate-100 text-slate-600 border-slate-200'
                      }`}>
                        {item.majorOrMinor}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="p-3 text-right space-x-1">
                      {canEdit && (
                        <button
                          onClick={() => onEditRequest(item)}
                          className="p-1 rounded hover:bg-slate-100 text-slate-500 hover:text-slate-900 transition-colors"
                          title="Edit Ticket"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                      )}
                      {canEdit && (
                        <button
                          onClick={() => {
                            if (confirm(`Delete request ticket ${item.referenceNo}?`)) {
                              deleteRequest(item.id);
                            }
                          }}
                          className="p-1 rounded hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors"
                          title="Delete Ticket"
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
