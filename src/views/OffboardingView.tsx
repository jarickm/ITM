import React, { useState, useMemo } from 'react';
import { 
  UserMinus, 
  Search, 
  Download, 
  Edit, 
  Trash2, 
  Plus, 
  ShieldCheck, 
  Clock,
  Repeat
} from 'lucide-react';
import { useITM } from '../context/ITMContext';
import { OffboardingRecord } from '../types/itm';

interface OffboardingViewProps {
  onOpenNewOffboarding: () => void;
  onEditOffboarding: (record: OffboardingRecord) => void;
  onOpenTransferDevice?: (employeeName: string) => void;
}

export const OffboardingView: React.FC<OffboardingViewProps> = ({ 
  onOpenNewOffboarding, 
  onEditOffboarding,
  onOpenTransferDevice
}) => {
  const { offboardings, deleteOffboarding, quickSearchQuery, currentUser, dropdownOptions } = useITM();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [departmentFilter, setDepartmentFilter] = useState('All');

  const statuses = useMemo(() => [
    'All',
    ...Array.from(new Set([...(dropdownOptions.offboardingStatuses || []), ...offboardings.map(o => o.status)].filter(Boolean)))
  ], [dropdownOptions.offboardingStatuses, offboardings]);

  const departments = useMemo(() => [
    'All',
    ...Array.from(new Set([...(dropdownOptions.departments || []), ...offboardings.map(o => o.department)].filter(Boolean)))
  ], [dropdownOptions.departments, offboardings]);

  const filtered = useMemo(() => {
    const q = (quickSearchQuery || search).trim().toLowerCase();
    return offboardings.filter(o => {
      if (statusFilter !== 'All' && o.status !== statusFilter) return false;
      if (departmentFilter !== 'All' && o.department !== departmentFilter) return false;
      if (q) {
        const match = 
          o.employeeName.toLowerCase().includes(q) ||
          o.department.toLowerCase().includes(q) ||
          o.position.toLowerCase().includes(q) ||
          o.controlNumber.toLowerCase().includes(q) ||
          o.company.toLowerCase().includes(q);
        if (!match) return false;
      }
      return true;
    });
  }, [offboardings, statusFilter, departmentFilter, quickSearchQuery, search]);

  const exportCSV = () => {
    const headers = [
      'Employee Name',
      'Department',
      'Position',
      'Separation Date',
      'Company',
      'Control Number',
      'Status',
      'IT Clearance Signed',
      'Pending Assets',
      'Cleared Assets',
    ];

    const rows = filtered.map(o => [
      `"${o.employeeName.replace(/"/g, '""')}"`,
      `"${o.department}"`,
      `"${o.position}"`,
      o.separationDate,
      `"${o.company}"`,
      `"${o.controlNumber}"`,
      o.status,
      o.itClearanceSignOff ? 'YES' : 'NO',
      `"${(o.pendingAssets || []).join(', ')}"`,
      `"${(o.clearedAssets || []).join(', ')}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `ITM_Offboarding_Records_${new Date().toISOString().substring(0, 10)}.csv`);
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
            <span className="p-1.5 rounded-lg bg-orange-50 text-orange-600 border border-orange-200">
              <UserMinus className="w-5 h-5" />
            </span>
            Employee Offboarding & IT Asset Clearance
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Hardware surrender verification, data sanitization certification, and custody release
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={exportCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-slate-50 border border-slate-300 text-xs font-semibold text-slate-700 transition-colors shadow-xs"
          >
            <Download className="w-3.5 h-3.5 text-orange-600" />
            <span>Export CSV</span>
          </button>

          {canEdit && (
            <button
              onClick={onOpenNewOffboarding}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-orange-600 hover:bg-orange-700 text-xs font-semibold text-white shadow-xs transition-all active:scale-95"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Clearance Record</span>
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
              placeholder="Search employee, position, control #..."
              className="w-full bg-slate-50 border border-slate-300 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-orange-500 focus:bg-white"
            />
          </div>

          <select
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
            className="bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-orange-500"
          >
            {departments.map((d) => (
              <option key={d} value={d}>{d === 'All' ? 'All Departments' : d}</option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-orange-500"
          >
            {statuses.map((s) => (
              <option key={s} value={s}>{s === 'All' ? 'All Statuses' : s}</option>
            ))}
          </select>
        </div>

        <div className="text-[11px] text-slate-500 font-mono">
          Showing <span className="font-bold text-slate-900">{filtered.length}</span> offboarding records
        </div>
      </div>

      {/* Required Table Columns: Employee Name | Department | Position | Separation Date | Company | Control Number | Status */}
      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100 text-slate-600 border-b border-slate-200 font-bold uppercase tracking-wider text-[10px]">
                <th className="p-3 min-w-[160px]">Employee Name</th>
                <th className="p-3 min-w-[130px]">Department</th>
                <th className="p-3 min-w-[140px]">Position</th>
                <th className="p-3 min-w-[120px]">Separation Date</th>
                <th className="p-3 min-w-[160px]">Company</th>
                <th className="p-3 min-w-[130px]">Control Number</th>
                <th className="p-3 min-w-[140px]">Status</th>
                <th className="p-3 min-w-[130px]">IT Sign-off</th>
                <th className="p-3 min-w-[160px]">Pending Hardware</th>
                <th className="p-3 text-right min-w-[90px]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={10} className="p-8 text-center text-slate-400 text-xs">
                    No offboarding records match criteria.
                  </td>
                </tr>
              ) : (
                filtered.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                    {/* Employee Name */}
                    <td className="p-3 font-semibold text-slate-900">
                      {item.employeeName}
                    </td>

                    {/* Department */}
                    <td className="p-3 text-slate-700">
                      {item.department}
                    </td>

                    {/* Position */}
                    <td className="p-3 text-slate-700">
                      {item.position}
                    </td>

                    {/* Separation Date */}
                    <td className="p-3 text-slate-500 font-mono">
                      {item.separationDate}
                    </td>

                    {/* Company */}
                    <td className="p-3 text-slate-700">
                      {item.company}
                    </td>

                    {/* Control Number */}
                    <td className="p-3 font-mono font-bold text-orange-700">
                      {item.controlNumber}
                    </td>

                    {/* Status */}
                    <td className="p-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                        item.status === 'Cleared' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                        item.status === 'Partially Returned' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                        item.status === 'Disputed' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                        'bg-orange-50 text-orange-700 border-orange-200'
                      }`}>
                        {item.status}
                      </span>
                    </td>

                    {/* IT Clearance Sign-off */}
                    <td className="p-3">
                      {item.itClearanceSignOff ? (
                        <span className="flex items-center gap-1 text-emerald-700 font-semibold text-[11px]">
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                          Signed & Cleared
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-amber-700 text-[11px] font-medium">
                          <Clock className="w-3.5 h-3.5 text-amber-600" />
                          Pending Sign-off
                        </span>
                      )}
                    </td>

                    {/* Pending Hardware */}
                    <td className="p-3 font-mono text-[11px]">
                      {item.pendingAssets && item.pendingAssets.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {item.pendingAssets.map((code) => (
                            <span key={code} className="px-1.5 py-0.5 bg-rose-50 text-rose-700 rounded border border-rose-200">
                              {code}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-emerald-700 text-[11px] font-medium">All Surrendered</span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="p-3 text-right space-x-1">
                      {onOpenTransferDevice && (
                        <button
                          onClick={() => onOpenTransferDevice(item.employeeName)}
                          className="inline-flex items-center gap-1 px-2 py-1 rounded bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold text-[10px] border border-indigo-200 transition-colors"
                          title="Transfer device from this employee to incoming replacement"
                        >
                          <Repeat className="w-3 h-3 text-indigo-600" />
                          <span>Transfer Device</span>
                        </button>
                      )}
                      {canEdit && (
                        <button
                          onClick={() => onEditOffboarding(item)}
                          className="p-1 rounded hover:bg-slate-100 text-slate-500 hover:text-slate-900 transition-colors"
                          title="Edit"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                      )}
                      {canEdit && (
                        <button
                          onClick={() => {
                            if (confirm(`Delete offboarding record for ${item.employeeName}?`)) {
                              deleteOffboarding(item.id);
                            }
                          }}
                          className="p-1 rounded hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors"
                          title="Delete"
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
