import React, { useState, useMemo } from 'react';
import { 
  History, 
  Search, 
  Download, 
  User 
} from 'lucide-react';
import { useITM } from '../context/ITMContext';

export const ActivityLogsView: React.FC = () => {
  const { activityLogs, quickSearchQuery } = useITM();
  const [search, setSearch] = useState('');
  const [entityFilter, setEntityFilter] = useState('All');

  const entities = ['All', 'Asset', 'Onboarding', 'Offboarding', 'Request', 'Borrowing', 'PreventiveMaintenance', 'Liability', 'System', 'Settings'];

  const filtered = useMemo(() => {
    const q = (quickSearchQuery || search).trim().toLowerCase();
    return activityLogs.filter(log => {
      if (entityFilter !== 'All' && log.targetEntity !== entityFilter) return false;
      if (q) {
        const match = 
          log.actor.toLowerCase().includes(q) ||
          log.action.toLowerCase().includes(q) ||
          log.targetId.toLowerCase().includes(q) ||
          log.details.toLowerCase().includes(q);
        if (!match) return false;
      }
      return true;
    });
  }, [activityLogs, entityFilter, quickSearchQuery, search]);

  const exportCSV = () => {
    const headers = ['Timestamp', 'Actor / User', 'Action', 'Target Entity', 'Target ID', 'Details'];
    const rows = filtered.map(l => [
      l.timestamp,
      `"${l.actor}"`,
      l.action,
      l.targetEntity,
      `"${l.targetId}"`,
      `"${l.details.replace(/"/g, '""')}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `ITM_Security_Audit_Log_${new Date().toISOString().substring(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-slate-100 text-slate-700 border border-slate-200">
              <History className="w-5 h-5" />
            </span>
            Security & Asset Transfer Audit Trail
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Tamper-evident activity logs recording asset handoffs, status modifications, PM reports & user actions
          </p>
        </div>

        <button
          onClick={exportCSV}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-slate-50 border border-slate-300 text-xs font-semibold text-slate-700 transition-colors shadow-xs"
        >
          <Download className="w-3.5 h-3.5 text-indigo-600" />
          <span>Export Audit Trail CSV</span>
        </button>
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
              placeholder="Search user, action, asset code..."
              className="w-full bg-slate-50 border border-slate-300 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:bg-white"
            />
          </div>

          <select
            value={entityFilter}
            onChange={(e) => setEntityFilter(e.target.value)}
            className="bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            {entities.map((ent) => (
              <option key={ent} value={ent}>{ent === 'All' ? 'All Modules' : ent}</option>
            ))}
          </select>
        </div>

        <div className="text-[11px] text-slate-500 font-mono">
          Showing <span className="font-bold text-slate-900">{filtered.length}</span> security events
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100 text-slate-600 border-b border-slate-200 font-bold uppercase tracking-wider text-[10px]">
                <th className="p-3 min-w-[140px]">Timestamp</th>
                <th className="p-3 min-w-[180px]">User / Actor</th>
                <th className="p-3 min-w-[140px]">Action Type</th>
                <th className="p-3 min-w-[120px]">Target Entity</th>
                <th className="p-3 min-w-[130px]">Target Ref</th>
                <th className="p-3 min-w-[280px]">Operational Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400 text-xs">
                    No activity logs recorded yet.
                  </td>
                </tr>
              ) : (
                filtered.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                    {/* Timestamp */}
                    <td className="p-3 text-slate-500 font-mono text-[11px] whitespace-nowrap">
                      {log.timestamp}
                    </td>

                    {/* Actor */}
                    <td className="p-3 font-semibold text-slate-900">
                      <div className="flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                        <span className="truncate max-w-[200px]" title={log.actor}>{log.actor}</span>
                      </div>
                    </td>

                    {/* Action */}
                    <td className="p-3 font-mono text-[11px]">
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-indigo-700 font-medium border border-slate-200">
                        {log.action}
                      </span>
                    </td>

                    {/* Target Entity */}
                    <td className="p-3 text-slate-700">
                      {log.targetEntity}
                    </td>

                    {/* Target ID */}
                    <td className="p-3 font-mono font-bold text-amber-700">
                      {log.targetId}
                    </td>

                    {/* Details */}
                    <td className="p-3 text-slate-700 leading-relaxed">
                      {log.details}
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
