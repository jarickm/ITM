import React from 'react';
import { 
  Layers, 
  CheckCircle2, 
  AlertOctagon, 
  Repeat, 
  FileText, 
  Clock, 
  TrendingUp, 
  ShieldAlert, 
  Download, 
  Plus, 
  QrCode, 
  Wrench,
  AlertTriangle,
  ArrowRight,
  UserPlus,
  UserMinus
} from 'lucide-react';
import { useITM } from '../context/ITMContext';

interface DashboardViewProps {
  onOpenNewAsset: () => void;
  onOpenScanner: () => void;
  onOpenNewRequest: () => void;
  onOpenNewBorrow: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ 
  onOpenNewAsset, 
  onOpenScanner, 
  onOpenNewRequest, 
  onOpenNewBorrow 
}) => {
  const { 
    assets, 
    requests, 
    borrowings, 
    onboardings, 
    offboardings, 
    preventiveMaintenance, 
    alerts,
    setActiveTab, 
    t 
  } = useITM();

  // Metrics calculation
  const totalAssets = assets.length;
  const inUseAssets = assets.filter(a => a.status === 'In Use').length;
  const availableAssets = assets.filter(a => a.status === 'Available').length;
  const defectiveAssets = assets.filter(a => a.status === 'Defective' || a.isDefective).length;
  const maintenanceAssets = assets.filter(a => a.status === 'Under Maintenance').length;
  const activeLoans = borrowings.filter(b => b.status === 'Active / Borrowed').length;
  const overdueLoans = borrowings.filter(b => b.status === 'Overdue').length;

  const openTickets = requests.filter(r => r.status === 'Open' || r.status === 'In Progress');
  const avgSlaDays = requests.length > 0 
    ? Math.round((requests.reduce((acc, r) => acc + (r.days || 0), 0) / requests.length) * 10) / 10 
    : 0;

  // Category breakdown
  const categoryCounts: Record<string, number> = {};
  assets.forEach(a => {
    categoryCounts[a.category] = (categoryCounts[a.category] || 0) + 1;
  });

  // Department breakdown
  const departmentCounts: Record<string, number> = {};
  assets.forEach(a => {
    departmentCounts[a.department] = (departmentCounts[a.department] || 0) + 1;
  });

  const exportKPIReport = () => {
    const summary = [
      ['ITM Enterprise KPI Performance Audit Report'],
      ['Generated At', new Date().toISOString()],
      [''],
      ['Metric', 'Value'],
      ['Total IT Assets', totalAssets],
      ['In Use Assets', inUseAssets],
      ['Available Reserve Pool', availableAssets],
      ['Defective / RMA Assets', defectiveAssets],
      ['Under Maintenance', maintenanceAssets],
      ['Active Equipment Loans', activeLoans],
      ['Overdue Loans', overdueLoans],
      ['Open PR / IER Tickets', openTickets.length],
      ['Average SLA Turnaround Days', avgSlaDays],
      ['Pending Onboardings', onboardings.filter(o => o.status !== 'Completed').length],
      ['Pending Offboarding Clearances', offboardings.filter(o => o.status !== 'Cleared').length],
      ['Total Preventive Maintenance Records', preventiveMaintenance.length],
    ];

    const csvContent = 'data:text/csv;charset=utf-8,' + summary.map(e => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `ITM_KPI_Report_${new Date().toISOString().substring(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Top Welcome / Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            Operations & KPI Executive Dashboard
          </h1>
          <p className="text-xs text-slate-500 mt-0.5 font-medium">
            Real-time asset utilization, inventory turnover, procurement requests & SLA monitoring
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={exportKPIReport}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-slate-50 border border-slate-300 text-xs font-semibold text-slate-700 transition-colors shadow-xs"
          >
            <Download className="w-3.5 h-3.5 text-indigo-600" />
            <span>Export KPI CSV</span>
          </button>
          <button
            onClick={onOpenNewAsset}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-xs font-semibold text-white shadow-sm shadow-indigo-600/30 transition-all active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Asset</span>
          </button>
        </div>
      </div>

      {/* Stock & Operational Warning Alert Banner (if any) */}
      {alerts.length > 0 && (
        <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 flex items-start justify-between gap-3 text-xs shadow-xs">
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-amber-900">
                Active System Alerts ({alerts.length}):
              </span>
              <span className="text-amber-800 ml-1.5">
                {alerts[0].title} — {alerts[0].message}
              </span>
              {alerts.length > 1 && (
                <span className="text-amber-700 font-semibold ml-1">
                  (+{alerts.length - 1} more in notification center)
                </span>
              )}
            </div>
          </div>
          <button
            onClick={() => setActiveTab('settings')}
            className="text-[11px] text-amber-800 hover:text-amber-950 font-semibold whitespace-nowrap underline shrink-0"
          >
            Manage Thresholds
          </button>
        </div>
      )}

      {/* Primary KPI Grid (8 Cards) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-4 gap-3.5">
        {/* Total Assets */}
        <div 
          onClick={() => setActiveTab('inventory')}
          className="p-4 rounded-xl bg-white border border-slate-200 hover:border-indigo-300 transition-all cursor-pointer group shadow-xs hover:shadow-md"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Total Assets</span>
            <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600 group-hover:scale-110 transition-transform">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900">{totalAssets}</div>
          <div className="text-[10px] text-slate-500 mt-1 flex items-center justify-between">
            <span>Hardware Catalog</span>
            <span className="text-indigo-600 font-medium group-hover:translate-x-0.5 transition-transform flex items-center">
              View <ArrowRight className="w-2.5 h-2.5 ml-0.5" />
            </span>
          </div>
        </div>

        {/* In Use */}
        <div 
          onClick={() => setActiveTab('inventory')}
          className="p-4 rounded-xl bg-white border border-slate-200 hover:border-emerald-300 transition-all cursor-pointer group shadow-xs hover:shadow-md"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Active In Use</span>
            <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600 group-hover:scale-110 transition-transform">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-700">{inUseAssets}</div>
          <div className="text-[10px] text-slate-500 mt-1">
            {totalAssets > 0 ? `${Math.round((inUseAssets / totalAssets) * 100)}% utilization rate` : '0%'}
          </div>
        </div>

        {/* Available Stock */}
        <div 
          onClick={() => setActiveTab('inventory')}
          className="p-4 rounded-xl bg-white border border-slate-200 hover:border-cyan-300 transition-all cursor-pointer group shadow-xs hover:shadow-md"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Available Stock</span>
            <div className="p-1.5 rounded-lg bg-cyan-50 text-cyan-600 group-hover:scale-110 transition-transform">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-cyan-700">{availableAssets}</div>
          <div className="text-[10px] text-slate-500 mt-1">Ready for deployment</div>
        </div>

        {/* Defective / RMA */}
        <div 
          onClick={() => setActiveTab('defective')}
          className="p-4 rounded-xl bg-white border border-slate-200 hover:border-rose-300 transition-all cursor-pointer group shadow-xs hover:shadow-md"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Defective (RMA)</span>
            <div className="p-1.5 rounded-lg bg-rose-50 text-rose-600 group-hover:scale-110 transition-transform">
              <AlertOctagon className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-rose-700">{defectiveAssets}</div>
          <div className="text-[10px] text-slate-500 mt-1 flex items-center justify-between">
            <span>Requires repair</span>
            <span className="text-rose-600 font-medium flex items-center">
              RMA Queue <ArrowRight className="w-2.5 h-2.5 ml-0.5" />
            </span>
          </div>
        </div>

        {/* Borrowed Devices */}
        <div 
          onClick={() => setActiveTab('borrowing')}
          className="p-4 rounded-xl bg-white border border-slate-200 hover:border-blue-300 transition-all cursor-pointer group shadow-xs hover:shadow-md"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Active Loans</span>
            <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600 group-hover:scale-110 transition-transform">
              <Repeat className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-blue-700">{activeLoans}</div>
          <div className="text-[10px] text-slate-500 mt-1">
            {overdueLoans > 0 ? (
              <span className="text-rose-600 font-semibold">{overdueLoans} overdue!</span>
            ) : (
              'All returns on schedule'
            )}
          </div>
        </div>

        {/* Open PR / IERs */}
        <div 
          onClick={() => setActiveTab('requests')}
          className="p-4 rounded-xl bg-white border border-slate-200 hover:border-purple-300 transition-all cursor-pointer group shadow-xs hover:shadow-md"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Open PR / IER</span>
            <div className="p-1.5 rounded-lg bg-purple-50 text-purple-600 group-hover:scale-110 transition-transform">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-purple-700">{openTickets.length}</div>
          <div className="text-[10px] text-slate-500 mt-1">
            {requests.filter(r => r.majorOrMinor === 'Critical').length} critical tickets
          </div>
        </div>

        {/* Avg SLA Days */}
        <div 
          onClick={() => setActiveTab('requests')}
          className="p-4 rounded-xl bg-white border border-slate-200 hover:border-amber-300 transition-all cursor-pointer group shadow-xs hover:shadow-md"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Avg SLA Days</span>
            <div className="p-1.5 rounded-lg bg-amber-50 text-amber-600 group-hover:scale-110 transition-transform">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-amber-700">{avgSlaDays} <span className="text-xs font-normal text-slate-500">days</span></div>
          <div className="text-[10px] text-slate-500 mt-1">Resolution turnaround</div>
        </div>

        {/* Onboarding & Offboarding Pipelines */}
        <div 
          onClick={() => setActiveTab('onboarding')}
          className="p-4 rounded-xl bg-white border border-slate-200 hover:border-amber-300 transition-all cursor-pointer group shadow-xs hover:shadow-md"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider">HR Pipeline</span>
            <div className="p-1.5 rounded-lg bg-orange-50 text-orange-600 group-hover:scale-110 transition-transform">
              <UserPlus className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-orange-700">
            {onboardings.filter(o => o.status !== 'Completed').length}
            <span className="text-xs text-slate-500 font-normal"> onb / </span>
            {offboardings.filter(o => o.status !== 'Cleared').length}
            <span className="text-xs text-slate-500 font-normal"> off</span>
          </div>
          <div className="text-[10px] text-slate-500 mt-1">Pending equipment actions</div>
        </div>
      </div>

      {/* Operational Breakdown & Visual Progress */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Distribution Card */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 space-y-4 shadow-xs">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-600" />
              IT Assets by Category
            </h3>
            <span className="text-[11px] text-slate-500 font-mono">
              {Object.keys(categoryCounts).length} Distinct Categories
            </span>
          </div>

          <div className="space-y-3">
            {Object.entries(categoryCounts).map(([cat, count]) => {
              const pct = totalAssets > 0 ? Math.round((count / totalAssets) * 100) : 0;
              return (
                <div key={cat} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-700 font-medium">{cat}</span>
                    <span className="text-slate-600 font-mono">
                      {count} units <span className="text-slate-400">({pct}%)</span>
                    </span>
                  </div>
                  <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-indigo-600 rounded-full transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Department Distribution Card */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 space-y-4 shadow-xs">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-cyan-600" />
              Asset Custody by Department
            </h3>
            <span className="text-[11px] text-slate-500 font-mono">
              {Object.keys(departmentCounts).length} Departments
            </span>
          </div>

          <div className="space-y-3">
            {Object.entries(departmentCounts).slice(0, 6).map(([dept, count]) => {
              const pct = totalAssets > 0 ? Math.round((count / totalAssets) * 100) : 0;
              return (
                <div key={dept} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-700 font-medium truncate max-w-[200px]">{dept}</span>
                    <span className="text-slate-600 font-mono">
                      {count} items <span className="text-slate-400">({pct}%)</span>
                    </span>
                  </div>
                  <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-cyan-600 rounded-full transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Quick Access Operational Grid */}
      <div className="p-5 rounded-2xl bg-white border border-slate-200 space-y-3 shadow-xs">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
          Fast Access Shortcuts & Quick Action Workflows:
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <button
            onClick={onOpenScanner}
            className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-left transition-colors"
          >
            <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600">
              <QrCode className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900">Scan Barcode / QR</div>
              <div className="text-[10px] text-slate-500">Camera & USB scanner</div>
            </div>
          </button>

          <button
            onClick={onOpenNewRequest}
            className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-left transition-colors"
          >
            <div className="p-2 rounded-lg bg-purple-50 text-purple-600">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900">File PR / IER Ticket</div>
              <div className="text-[10px] text-slate-500">Procure or Incident</div>
            </div>
          </button>

          <button
            onClick={onOpenNewBorrow}
            className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-left transition-colors"
          >
            <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
              <Repeat className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900">Borrow Equipment</div>
              <div className="text-[10px] text-slate-500">Dispatch device loan</div>
            </div>
          </button>

          <button
            onClick={() => setActiveTab('qr_studio')}
            className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-left transition-colors"
          >
            <div className="p-2 rounded-lg bg-cyan-50 text-cyan-600">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900">Print Asset Tags</div>
              <div className="text-[10px] text-slate-500">Thermal / adhesive tags</div>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};
