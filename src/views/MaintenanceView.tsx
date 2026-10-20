import React, { useState, useMemo } from 'react';
import { 
  Wrench, 
  Search, 
  Download, 
  Plus, 
  Edit, 
  Trash2 
} from 'lucide-react';
import { useITM } from '../context/ITMContext';
import { PreventiveMaintenanceRecord } from '../types/itm';

interface MaintenanceViewProps {
  onOpenNewPM: () => void;
  onEditPM: (record: PreventiveMaintenanceRecord) => void;
}

export const MaintenanceView: React.FC<MaintenanceViewProps> = ({ onOpenNewPM, onEditPM }) => {
  const { preventiveMaintenance, deletePreventiveMaintenance, quickSearchQuery, currentUser, dropdownOptions } = useITM();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [departmentFilter, setDepartmentFilter] = useState('All');

  const statuses = useMemo(() => [
    'All',
    ...Array.from(new Set([...(dropdownOptions.pmStatuses || []), ...preventiveMaintenance.map(pm => pm.status)].filter(Boolean)))
  ], [dropdownOptions.pmStatuses, preventiveMaintenance]);

  const departments = useMemo(() => [
    'All',
    ...Array.from(new Set([...(dropdownOptions.departments || []), ...preventiveMaintenance.map(pm => pm.department)].filter(Boolean)))
  ], [dropdownOptions.departments, preventiveMaintenance]);

  const filtered = useMemo(() => {
    const q = (quickSearchQuery || search).trim().toLowerCase();
    return preventiveMaintenance.filter(pm => {
      if (statusFilter !== 'All' && pm.status !== statusFilter) return false;
      if (departmentFilter !== 'All' && pm.department !== departmentFilter) return false;
      if (q) {
        const match = 
          pm.description.toLowerCase().includes(q) ||
          pm.assetCode.toLowerCase().includes(q) ||
          pm.performedBy.toLowerCase().includes(q) ||
          pm.department.toLowerCase().includes(q) ||
          pm.activityWorkDone.toLowerCase().includes(q) ||
          pm.recommendation.toLowerCase().includes(q);
        if (!match) return false;
      }
      return true;
    });
  }, [preventiveMaintenance, statusFilter, quickSearchQuery, search]);

  const exportCSV = () => {
    const headers = [
      'Description',
      'Date',
      'Date Purchase',
      'Asset Code',
      'Activity / Work Done',
      'Performed by',
      'Status',
      'Recommendation',
      'Department',
      'Next Maintenance Date',
    ];

    const rows = filtered.map(pm => [
      `"${pm.description.replace(/"/g, '""')}"`,
      pm.date,
      pm.datePurchase,
      `"${pm.assetCode}"`,
      `"${pm.activityWorkDone.replace(/"/g, '""')}"`,
      `"${pm.performedBy}"`,
      pm.status,
      `"${pm.recommendation.replace(/"/g, '""')}"`,
      `"${pm.department}"`,
      pm.nextMaintenanceDate || '',
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `ITM_Preventive_Maintenance_Records_${new Date().toISOString().substring(0, 10)}.csv`);
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
            <span className="p-1.5 rounded-lg bg-amber-50 text-amber-600 border border-amber-200">
              <Wrench className="w-5 h-5" />
            </span>
            IT Preventive Maintenance (PM) Inspection Log
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Routine thermal cleaning, UPS battery testing, firmware patches & hardware longevity recommendations
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={exportCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-slate-50 border border-slate-300 text-xs font-semibold text-slate-700 transition-colors shadow-xs"
          >
            <Download className="w-3.5 h-3.5 text-amber-600" />
            <span>Export CSV</span>
          </button>

          {canEdit && (
            <button
              onClick={onOpenNewPM}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-xs font-semibold text-white shadow-xs transition-all active:scale-95"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Log PM Activity</span>
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
              placeholder="Search description, asset code, technician..."
              className="w-full bg-slate-50 border border-slate-300 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-amber-500 focus:bg-white"
            />
          </div>

          <select
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
            className="bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-amber-500"
          >
            {departments.map((d) => (
              <option key={d} value={d}>{d === 'All' ? 'All Departments' : d}</option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-amber-500"
          >
            {statuses.map((s) => (
              <option key={s} value={s}>{s === 'All' ? 'All Statuses' : s}</option>
            ))}
          </select>
        </div>

        <div className="text-[11px] text-slate-500 font-mono">
          Showing <span className="font-bold text-slate-900">{filtered.length}</span> PM records
        </div>
      </div>

      {/* Required Table Columns:
          Description | Date | Date Purchase | Asset Code | Activity / Work Done | Performed by | Status | Recommendation | Department
      */}
      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100 text-slate-600 border-b border-slate-200 font-bold uppercase tracking-wider text-[10px]">
                <th className="p-3 min-w-[220px]">Description</th>
                <th className="p-3 min-w-[100px]">Date</th>
                <th className="p-3 min-w-[100px]">Date Purchase</th>
                <th className="p-3 min-w-[130px]">Asset Code</th>
                <th className="p-3 min-w-[260px]">Activity / Work Done</th>
                <th className="p-3 min-w-[140px]">Performed by</th>
                <th className="p-3 min-w-[120px]">Status</th>
                <th className="p-3 min-w-[240px]">Recommendation</th>
                <th className="p-3 min-w-[130px]">Department</th>
                <th className="p-3 text-right min-w-[80px]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={10} className="p-8 text-center text-slate-400 text-xs">
                    No preventive maintenance records found.
                  </td>
                </tr>
              ) : (
                filtered.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                    {/* Description */}
                    <td className="p-3 font-semibold text-slate-900">
                      {item.description}
                    </td>

                    {/* Date */}
                    <td className="p-3 text-slate-500 font-mono text-[11px]">
                      {item.date}
                    </td>

                    {/* Date Purchase */}
                    <td className="p-3 text-slate-500 font-mono text-[11px]">
                      {item.datePurchase}
                    </td>

                    {/* Asset Code */}
                    <td className="p-3 font-mono font-bold text-amber-700">
                      {item.assetCode}
                    </td>

                    {/* Activity / Work Done */}
                    <td className="p-3 text-slate-700">
                      <p className="line-clamp-2 leading-relaxed" title={item.activityWorkDone}>
                        {item.activityWorkDone}
                      </p>
                    </td>

                    {/* Performed by */}
                    <td className="p-3 text-slate-700">
                      {item.performedBy}
                    </td>

                    {/* Status */}
                    <td className="p-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                        item.status === 'Completed' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                        item.status === 'Scheduled' ? 'bg-cyan-50 text-cyan-700 border-cyan-200' :
                        item.status === 'In Progress' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                        'bg-rose-50 text-rose-700 border-rose-200'
                      }`}>
                        {item.status}
                      </span>
                    </td>

                    {/* Recommendation */}
                    <td className="p-3 text-slate-700">
                      <p className="line-clamp-2 leading-relaxed text-amber-800" title={item.recommendation}>
                        {item.recommendation}
                      </p>
                    </td>

                    {/* Department */}
                    <td className="p-3 text-slate-700">
                      {item.department}
                    </td>

                    {/* Actions */}
                    <td className="p-3 text-right space-x-1">
                      {canEdit && (
                        <button
                          onClick={() => onEditPM(item)}
                          className="p-1 rounded hover:bg-slate-100 text-slate-500 hover:text-slate-900 transition-colors"
                          title="Edit PM Log"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                      )}
                      {canEdit && (
                        <button
                          onClick={() => {
                            if (confirm(`Delete maintenance record for ${item.assetCode}?`)) {
                              deletePreventiveMaintenance(item.id);
                            }
                          }}
                          className="p-1 rounded hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors"
                          title="Delete PM Log"
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
