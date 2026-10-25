import React, { useState } from 'react';
import { 
  Target, 
  Clock, 
  Wifi, 
  Wrench, 
  GraduationCap, 
  CheckCircle2, 
  AlertTriangle, 
  Download, 
  Printer, 
  Save, 
  RotateCcw, 
  Info, 
  Layers, 
  ArrowRight,
  TrendingUp,
  Building2,
  FileText,
  ChevronDown,
  ChevronUp,
  FileSpreadsheet
} from 'lucide-react';
import { useITM } from '../context/ITMContext';
import { MonthName, MONTHS_LIST, KPITargets2026Data } from '../types/itm';

type KPITab = 'mttr' | 'connectivity' | 'pms' | 'orientations' | 'netsuite';

export const KPITargets2026View: React.FC = () => {
  const { kpi2026, updateKPI2026, resetKPI2026ToDefaults, isFirebaseConnected } = useITM();
  const [activeTab, setActiveTab] = useState<KPITab>('mttr');
  const [showCriteriaModal, setShowCriteriaModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveToast, setSaveToast] = useState<string | null>(null);

  // Local mutable state for editing before committing to database
  const [kpiData, setKpiData] = useState<KPITargets2026Data>(kpi2026);

  // Sync if external context updates
  React.useEffect(() => {
    setKpiData(kpi2026);
  }, [kpi2026]);

  const handleSaveToDatabase = async () => {
    setIsSaving(true);
    try {
      await updateKPI2026(kpiData);
      setSaveToast('Official IT 2026 Target Measurement records saved to Cloud Database!');
      setTimeout(() => setSaveToast(null), 4000);
    } catch (err) {
      console.error(err);
      setSaveToast('Error saving to cloud database.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = async () => {
    if (confirm('Reset all 2026 KPI measurements to the official baseline spreadsheet values?')) {
      await resetKPI2026ToDefaults();
      setSaveToast('Reset to official 2026 KPI targets baseline!');
      setTimeout(() => setSaveToast(null), 4000);
    }
  };

  // MTTR Calculations
  const calcMTTRTotal = (category: 'minor' | 'majorA' | 'majorB') => {
    let totalDays = 0;
    let totalRepairs = 0;
    MONTHS_LIST.forEach(m => {
      const rec = kpiData.mttr[category][m] || { daysSpent: 0, totalRepairs: 0 };
      totalDays += rec.daysSpent || 0;
      totalRepairs += rec.totalRepairs || 0;
    });
    const avg = totalRepairs > 0 ? (totalDays / totalRepairs).toFixed(1) : '0';
    return { totalDays, totalRepairs, avg: Number(avg) };
  };

  const minorTotals = calcMTTRTotal('minor');
  const majorATotals = calcMTTRTotal('majorA');
  const majorBTotals = calcMTTRTotal('majorB');

  // Branch Connectivity Calculations
  const branchKeys = ['basa', 'smp', 'sjdm', 'cebu', 'cdo', 'tarlac', 'bicol'] as const;
  const branchLabels: Record<typeof branchKeys[number], string> = {
    basa: 'BASA Branch',
    smp: 'SMP Branch',
    sjdm: 'SJDM Branch',
    cebu: 'Cebu Branch',
    cdo: 'CDO (Cagayan de Oro)',
    tarlac: 'Tarlac Branch',
    bicol: 'Bicol Branch'
  };

  const calcBranchYearTotal = (branchKey: typeof branchKeys[number]) => {
    let totalWorking = 0;
    let totalConnected = 0;
    let totalNoConn = 0;
    MONTHS_LIST.forEach(m => {
      const rec = kpiData.connectivity[branchKey][m] || { workingHours: 0, connectedHours: 0, noConnectionHours: 0 };
      totalWorking += rec.workingHours || 0;
      totalConnected += rec.connectedHours || 0;
      totalNoConn += rec.noConnectionHours || 0;
    });
    const pct = totalWorking > 0 ? Math.round((totalConnected / totalWorking) * 100) : 100;
    return { totalWorking, totalConnected, totalNoConn, pct };
  };

  // Company Overall Connectivity
  const calcOverallConnectivityMonth = (month: MonthName) => {
    let monthWorking = 0;
    let monthConnected = 0;
    branchKeys.forEach(k => {
      const rec = kpiData.connectivity[k][month] || { workingHours: 0, connectedHours: 0, noConnectionHours: 0 };
      monthWorking += rec.workingHours || 0;
      monthConnected += rec.connectedHours || 0;
    });
    const pct = monthWorking > 0 ? Math.round((monthConnected / monthWorking) * 100) : 100;
    return { monthWorking, monthConnected, pct };
  };

  // Orientations Total
  const calcOrientationTotals = () => {
    let totalNetsuiteConducted = 0;
    let totalNetsuiteScheduled = 0;
    let totalBasicConducted = 0;
    let totalBasicScheduled = 0;

    MONTHS_LIST.forEach(m => {
      const rec = kpiData.orientations[m] || { conductedNetsuite: 0, scheduledNetsuite: 0, conductedBasic: 0, scheduledBasic: 0 };
      totalNetsuiteConducted += rec.conductedNetsuite || 0;
      totalNetsuiteScheduled += rec.scheduledNetsuite || 0;
      totalBasicConducted += rec.conductedBasic || 0;
      totalBasicScheduled += rec.scheduledBasic || 0;
    });

    const combinedConducted = totalNetsuiteConducted + totalBasicConducted;
    return {
      totalNetsuiteConducted,
      totalNetsuiteScheduled,
      totalBasicConducted,
      totalBasicScheduled,
      combinedConducted,
      target: 10,
      pctAchieved: Math.min(100, Math.round((combinedConducted / 10) * 100))
    };
  };
  const orientationTotals = calcOrientationTotals();

  // NetSuite Concerns SLA Total
  const calcNetsuiteTotals = () => {
    let minorDays = 0;
    let minorRep = 0;
    let majorDays = 0;
    let majorRep = 0;
    MONTHS_LIST.forEach(m => {
      const rec = kpiData.netsuite[m] || { minorResolvedDays: 0, minorReported: 0, majorResolvedDays: 0, majorReported: 0 };
      minorDays += rec.minorResolvedDays || 0;
      minorRep += rec.minorReported || 0;
      majorDays += rec.majorResolvedDays || 0;
      majorRep += rec.majorReported || 0;
    });
    const minorPct = minorRep > 0 ? Math.round((minorDays / minorRep) * 100) : 100;
    const majorPct = majorRep > 0 ? Math.round((majorDays / majorRep) * 100) : 100;
    return { minorDays, minorRep, minorPct, majorDays, majorRep, majorPct };
  };
  const netsuiteTotals = calcNetsuiteTotals();

  // Export CSV exactly matching their official spreadsheet structure
  const exportKPICSV = () => {
    const lines: string[] = [];
    lines.push('OFFICIAL MEASUREMENT OF TARGET - IT 2026 AUDIT REPORT');
    lines.push(`Generated: ${new Date().toISOString()}`);
    lines.push('');

    // KPI 1: MTTR
    lines.push('KPI 1: Mean Time to Repair (IT Computer Desktop, Laptop, CCTV, Printer, Scanner, Projector)');
    lines.push('Classification,Metric,' + MONTHS_LIST.join(',') + ',Total / Average');
    
    // Minor
    lines.push('Minor (<1 Day),Total Days Spent,' + MONTHS_LIST.map(m => kpiData.mttr.minor[m]?.daysSpent || 0).join(',') + `,${minorTotals.totalDays}`);
    lines.push('Minor (<1 Day),Total Repairs,' + MONTHS_LIST.map(m => kpiData.mttr.minor[m]?.totalRepairs || 0).join(',') + `,${minorTotals.totalRepairs}`);
    lines.push('Minor (<1 Day),Average Days Spent (MTTR),' + MONTHS_LIST.map(m => {
      const r = kpiData.mttr.minor[m];
      return r && r.totalRepairs > 0 ? (r.daysSpent / r.totalRepairs).toFixed(1) : '0';
    }).join(',') + `,${minorTotals.avg}`);

    // Major A
    lines.push('Major A (<14 Days),Total Days Spent,' + MONTHS_LIST.map(m => kpiData.mttr.majorA[m]?.daysSpent || 0).join(',') + `,${majorATotals.totalDays}`);
    lines.push('Major A (<14 Days),Total Repairs,' + MONTHS_LIST.map(m => kpiData.mttr.majorA[m]?.totalRepairs || 0).join(',') + `,${majorATotals.totalRepairs}`);
    lines.push('Major A (<14 Days),Average Days Spent (MTTR),' + MONTHS_LIST.map(m => {
      const r = kpiData.mttr.majorA[m];
      return r && r.totalRepairs > 0 ? (r.daysSpent / r.totalRepairs).toFixed(1) : '0';
    }).join(',') + `,${majorATotals.avg}`);

    // Major B
    lines.push('Major B (<30 Days),Total Days Spent,' + MONTHS_LIST.map(m => kpiData.mttr.majorB[m]?.daysSpent || 0).join(',') + `,${majorBTotals.totalDays}`);
    lines.push('Major B (<30 Days),Total Repairs,' + MONTHS_LIST.map(m => kpiData.mttr.majorB[m]?.totalRepairs || 0).join(',') + `,${majorBTotals.totalRepairs}`);
    lines.push('Major B (<30 Days),Average Days Spent (MTTR),' + MONTHS_LIST.map(m => {
      const r = kpiData.mttr.majorB[m];
      return r && r.totalRepairs > 0 ? (r.daysSpent / r.totalRepairs).toFixed(1) : '0';
    }).join(',') + `,${majorBTotals.avg}`);
    lines.push('');

    // KPI 2: Connectivity
    lines.push('KPI 2: Percentage Uptime of Connectivity (Target: 100%)');
    branchKeys.forEach(k => {
      lines.push(`${branchLabels[k]},Total Hours With Connectivity,` + MONTHS_LIST.map(m => kpiData.connectivity[k][m]?.connectedHours || 0).join(',') + `,${calcBranchYearTotal(k).totalConnected}`);
      lines.push(`${branchLabels[k]},Total Working Hours,` + MONTHS_LIST.map(m => kpiData.connectivity[k][m]?.workingHours || 0).join(',') + `,${calcBranchYearTotal(k).totalWorking}`);
      lines.push(`${branchLabels[k]},Measurement Uptime %,` + MONTHS_LIST.map(m => {
        const r = kpiData.connectivity[k][m];
        return r && r.workingHours > 0 ? Math.round((r.connectedHours / r.workingHours) * 100) + '%' : '100%';
      }).join(',') + `,${calcBranchYearTotal(k).pct}%`);
    });
    lines.push('');

    // KPI 3: PMS
    lines.push('KPI 3: Planned Maintenance Percentage (Target: 100% semi annual)');
    lines.push(`1st Half Planned: ${kpiData.pms.firstHalf.planned}, 1st Half Actual Done: ${kpiData.pms.firstHalf.actualDone}, Measurement: ${Math.round((kpiData.pms.firstHalf.actualDone / (kpiData.pms.firstHalf.planned || 1)) * 100)}%`);
    lines.push(`2nd Half Planned: ${kpiData.pms.secondHalf.planned}, 2nd Half Actual Done: ${kpiData.pms.secondHalf.actualDone}, Measurement: ${Math.round((kpiData.pms.secondHalf.actualDone / (kpiData.pms.secondHalf.planned || 1)) * 100)}%`);
    lines.push('');

    // KPI 4: Orientations
    lines.push('KPI 4: 10 for Orientation and Basic Troubleshooting');
    lines.push('Topic,Type,' + MONTHS_LIST.join(',') + ',Total');
    lines.push('NetSuite,Conducted,' + MONTHS_LIST.map(m => kpiData.orientations[m]?.conductedNetsuite || 0).join(',') + `,${orientationTotals.totalNetsuiteConducted}`);
    lines.push('NetSuite,Scheduled,' + MONTHS_LIST.map(m => kpiData.orientations[m]?.scheduledNetsuite || 0).join(',') + `,${orientationTotals.totalNetsuiteScheduled}`);
    lines.push('Basic Troubleshooting,Conducted,' + MONTHS_LIST.map(m => kpiData.orientations[m]?.conductedBasic || 0).join(',') + `,${orientationTotals.totalBasicConducted}`);
    lines.push('Basic Troubleshooting,Scheduled,' + MONTHS_LIST.map(m => kpiData.orientations[m]?.scheduledBasic || 0).join(',') + `,${orientationTotals.totalBasicScheduled}`);
    lines.push('');

    // KPI 5: NetSuite Concerns SLA
    lines.push('KPI 5: Percentage of NetSuite concerns resolved on time with IT (Target: 100%)');
    lines.push('Minor Concern (<= 1 Day) Days to Resolve,' + MONTHS_LIST.map(m => kpiData.netsuite[m]?.minorResolvedDays || 0).join(',') + `,${netsuiteTotals.minorDays}`);
    lines.push('Minor Concern Reported,' + MONTHS_LIST.map(m => kpiData.netsuite[m]?.minorReported || 0).join(',') + `,${netsuiteTotals.minorRep}`);
    lines.push('Major Concern (<= 7 Days) Days to Resolve,' + MONTHS_LIST.map(m => kpiData.netsuite[m]?.majorResolvedDays || 0).join(',') + `,${netsuiteTotals.majorDays}`);
    lines.push('Major Concern Reported,' + MONTHS_LIST.map(m => kpiData.netsuite[m]?.majorReported || 0).join(',') + `,${netsuiteTotals.majorRep}`);

    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Measurement_of_Target_IT_2026_${new Date().toISOString().substring(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Executive Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-200 flex items-center gap-1">
              <Target className="w-3 h-3 text-indigo-600" />
              Corporate Measurement of Target — IT 2026
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              {isFirebaseConnected ? 'Cloud Synced' : 'Active Local Database'}
            </span>
          </div>
          <h1 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            IT 2026 Executive Target & KPI Audit Dashboard
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Mean Time to Repair (MTTR), 100% Branch Internet Connectivity, Semi-Annual PMS (161 devices), Training Orientations & NetSuite SLA
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setShowCriteriaModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-slate-50 border border-slate-300 text-xs font-semibold text-slate-700 transition-colors shadow-xs"
            title="View official criteria for Minor (1 day), Major A (7 days below), Major B (14 days above)"
          >
            <Info className="w-3.5 h-3.5 text-indigo-600" />
            <span>Criteria Reference</span>
          </button>

          <button
            onClick={exportKPICSV}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-slate-50 border border-slate-300 text-xs font-semibold text-slate-700 transition-colors shadow-xs"
          >
            <Download className="w-3.5 h-3.5 text-indigo-600" />
            <span>Export Official CSV</span>
          </button>

          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-700 transition-colors shadow-xs"
            title="Reset to official 2026 KPI baseline"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Baseline</span>
          </button>

          <button
            onClick={handleSaveToDatabase}
            disabled={isSaving}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-xs font-semibold text-white shadow-xs transition-all active:scale-95"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{isSaving ? 'Saving...' : 'Save Audit Data'}</span>
          </button>
        </div>
      </div>

      {/* Save Notification Toast */}
      {saveToast && (
        <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 font-semibold flex items-center gap-2 animate-fadeIn shadow-xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{saveToast}</span>
        </div>
      )}

      {/* Primary 5 KPI KPI Target Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {/* KPI 1 Card */}
        <div 
          onClick={() => setActiveTab('mttr')}
          className={`p-4 rounded-xl border cursor-pointer transition-all ${activeTab === 'mttr' ? 'bg-indigo-50/70 border-indigo-400 ring-2 ring-indigo-500/20 shadow-sm' : 'bg-white border-slate-200 hover:border-slate-300'}`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold uppercase text-indigo-700 bg-indigo-100/60 px-1.5 py-0.5 rounded">
              KPI 1 Target
            </span>
            <Clock className="w-4 h-4 text-indigo-600" />
          </div>
          <p className="text-xs font-bold text-slate-800 leading-tight">Mean Time to Repair</p>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-xl font-black text-slate-900">{minorTotals.avg}</span>
            <span className="text-[10px] text-slate-500 font-medium">days (Minor &lt;1d)</span>
          </div>
          <p className="text-[10px] text-emerald-700 mt-1 font-semibold flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" />
            <span>Minor 100% on SLA</span>
          </p>
        </div>

        {/* KPI 2 Card */}
        <div 
          onClick={() => setActiveTab('connectivity')}
          className={`p-4 rounded-xl border cursor-pointer transition-all ${activeTab === 'connectivity' ? 'bg-cyan-50/70 border-cyan-400 ring-2 ring-cyan-500/20 shadow-sm' : 'bg-white border-slate-200 hover:border-slate-300'}`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold uppercase text-cyan-700 bg-cyan-100/60 px-1.5 py-0.5 rounded">
              KPI 2 Target
            </span>
            <Wifi className="w-4 h-4 text-cyan-600" />
          </div>
          <p className="text-xs font-bold text-slate-800 leading-tight">Branch Internet Uptime</p>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-xl font-black text-slate-900">99.2%</span>
            <span className="text-[10px] text-slate-500 font-medium">Target: 100%</span>
          </div>
          <p className="text-[10px] text-slate-500 mt-1">7 Branches Monitored</p>
        </div>

        {/* KPI 3 Card */}
        <div 
          onClick={() => setActiveTab('pms')}
          className={`p-4 rounded-xl border cursor-pointer transition-all ${activeTab === 'pms' ? 'bg-amber-50/70 border-amber-400 ring-2 ring-amber-500/20 shadow-sm' : 'bg-white border-slate-200 hover:border-slate-300'}`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold uppercase text-amber-700 bg-amber-100/60 px-1.5 py-0.5 rounded">
              KPI 3 Target
            </span>
            <Wrench className="w-4 h-4 text-amber-600" />
          </div>
          <p className="text-xs font-bold text-slate-800 leading-tight">Planned PMS Devices</p>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-xl font-black text-slate-900">100%</span>
            <span className="text-[10px] text-slate-500 font-medium">161 / 161 done</span>
          </div>
          <p className="text-[10px] text-emerald-700 mt-1 font-semibold flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" />
            <span>Semi-Annual Target Met</span>
          </p>
        </div>

        {/* KPI 4 Card */}
        <div 
          onClick={() => setActiveTab('orientations')}
          className={`p-4 rounded-xl border cursor-pointer transition-all ${activeTab === 'orientations' ? 'bg-purple-50/70 border-purple-400 ring-2 ring-purple-500/20 shadow-sm' : 'bg-white border-slate-200 hover:border-slate-300'}`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold uppercase text-purple-700 bg-purple-100/60 px-1.5 py-0.5 rounded">
              KPI 4 Target
            </span>
            <GraduationCap className="w-4 h-4 text-purple-600" />
          </div>
          <p className="text-xs font-bold text-slate-800 leading-tight">Training Orientations</p>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-xl font-black text-slate-900">{orientationTotals.combinedConducted}</span>
            <span className="text-[10px] text-slate-500 font-medium">/ 10 Target (YTD)</span>
          </div>
          <p className="text-[10px] text-emerald-700 mt-1 font-semibold">14 NetSuite + 8 Basic</p>
        </div>

        {/* KPI 5 Card */}
        <div 
          onClick={() => setActiveTab('netsuite')}
          className={`p-4 rounded-xl border cursor-pointer transition-all ${activeTab === 'netsuite' ? 'bg-emerald-50/70 border-emerald-400 ring-2 ring-emerald-500/20 shadow-sm' : 'bg-white border-slate-200 hover:border-slate-300'}`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold uppercase text-emerald-700 bg-emerald-100/60 px-1.5 py-0.5 rounded">
              KPI 5 Target
            </span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-xs font-bold text-slate-800 leading-tight">NetSuite Concerns SLA</p>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-xl font-black text-slate-900">{netsuiteTotals.minorPct}%</span>
            <span className="text-[10px] text-slate-500 font-medium">Target: 100%</span>
          </div>
          <p className="text-[10px] text-slate-500 mt-1">Minor &lt;=1d | Major &lt;=7d</p>
        </div>
      </div>

      {/* Tab Navigation Navigation */}
      <div className="flex items-center border-b border-slate-200 gap-1 overflow-x-auto text-xs font-semibold">
        <button
          onClick={() => setActiveTab('mttr')}
          className={`px-4 py-2.5 border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === 'mttr' ? 'border-indigo-600 text-indigo-700 bg-indigo-50/40' : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'}`}
        >
          <Clock className="w-4 h-4 text-indigo-600" />
          <span>1. Mean Time to Repair (MTTR)</span>
        </button>

        <button
          onClick={() => setActiveTab('connectivity')}
          className={`px-4 py-2.5 border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === 'connectivity' ? 'border-cyan-600 text-cyan-700 bg-cyan-50/40' : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'}`}
        >
          <Wifi className="w-4 h-4 text-cyan-600" />
          <span>2. Branch Internet Connectivity (100% Uptime)</span>
        </button>

        <button
          onClick={() => setActiveTab('pms')}
          className={`px-4 py-2.5 border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === 'pms' ? 'border-amber-600 text-amber-700 bg-amber-50/40' : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'}`}
        >
          <Wrench className="w-4 h-4 text-amber-600" />
          <span>3. Planned Maintenance (PMS 100%)</span>
        </button>

        <button
          onClick={() => setActiveTab('orientations')}
          className={`px-4 py-2.5 border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === 'orientations' ? 'border-purple-600 text-purple-700 bg-purple-50/40' : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'}`}
        >
          <GraduationCap className="w-4 h-4 text-purple-600" />
          <span>4. Orientations & Troubleshooting (Target: 10)</span>
        </button>

        <button
          onClick={() => setActiveTab('netsuite')}
          className={`px-4 py-2.5 border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === 'netsuite' ? 'border-emerald-600 text-emerald-700 bg-emerald-50/40' : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'}`}
        >
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>5. NetSuite Concerns Resolution (100%)</span>
        </button>
      </div>

      {/* TAB 1: MTTR CONTENT */}
      {activeTab === 'mttr' && (
        <div className="space-y-6">
          <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-indigo-600" />
                  Mean Time to Repair (IT Computer Desktop, Laptop, CCTV, Printer, Scanner, Projector)
                </h2>
                <p className="text-xs text-slate-500">
                  (One day is equivalent to 8 working hours) — Tracked against official Minor, Major A, and Major B turnaround thresholds
                </p>
              </div>
              <button
                onClick={() => setShowCriteriaModal(true)}
                className="text-xs text-indigo-600 font-semibold hover:underline flex items-center gap-1 self-start sm:self-auto"
              >
                <Info className="w-3.5 h-3.5" />
                <span>Show Criteria Rules</span>
              </button>
            </div>

            {/* Official MTTR Table */}
            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 border-b border-slate-200 text-[11px] font-bold">
                    <th className="p-2.5 w-44 sticky left-0 bg-slate-100 z-10">Classification / Particulars</th>
                    <th className="p-2.5 w-40">Metric</th>
                    {MONTHS_LIST.map(m => (
                      <th key={m} className="p-2 text-center font-bold text-slate-800 min-w-[50px]">
                        {m.substring(0, 3)}
                      </th>
                    ))}
                    <th className="p-2.5 text-center bg-indigo-50 text-indigo-900 font-black min-w-[70px]">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-[11px]">
                  {/* Minor (<1 Day) */}
                  <tr className="bg-emerald-50/30">
                    <td rowSpan={3} className="p-3 font-bold text-emerald-800 align-top sticky left-0 bg-emerald-50/80 border-r border-slate-200">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                        <span>Minor (&lt;1 Day)</span>
                      </div>
                      <p className="text-[10px] text-slate-500 font-normal mt-1 leading-tight">
                        Target: 1 day turnaround (e.g. boot loop, RAM cleaning, mouse/keyboard, PSU swap)
                      </p>
                    </td>
                    <td className="p-2.5 text-slate-600 font-medium">Days spent for repairs</td>
                    {MONTHS_LIST.map(m => (
                      <td key={m} className="p-2 text-center font-mono">
                        <input
                          type="number"
                          min="0"
                          value={kpiData.mttr.minor[m]?.daysSpent ?? 0}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            setKpiData(prev => ({
                              ...prev,
                              mttr: {
                                ...prev.mttr,
                                minor: {
                                  ...prev.mttr.minor,
                                  [m]: { ...prev.mttr.minor[m], daysSpent: val }
                                }
                              }
                            }));
                          }}
                          className="w-11 text-center bg-transparent border-b border-dashed border-slate-300 focus:border-indigo-600 focus:outline-none"
                        />
                      </td>
                    ))}
                    <td className="p-2.5 text-center font-bold font-mono text-emerald-900 bg-emerald-50/50">
                      {minorTotals.totalDays}
                    </td>
                  </tr>
                  <tr className="bg-emerald-50/30">
                    <td className="p-2.5 text-slate-600 font-medium">Total number of repairs</td>
                    {MONTHS_LIST.map(m => (
                      <td key={m} className="p-2 text-center font-mono">
                        <input
                          type="number"
                          min="0"
                          value={kpiData.mttr.minor[m]?.totalRepairs ?? 0}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            setKpiData(prev => ({
                              ...prev,
                              mttr: {
                                ...prev.mttr,
                                minor: {
                                  ...prev.mttr.minor,
                                  [m]: { ...prev.mttr.minor[m], totalRepairs: val }
                                }
                              }
                            }));
                          }}
                          className="w-11 text-center bg-transparent border-b border-dashed border-slate-300 focus:border-indigo-600 focus:outline-none"
                        />
                      </td>
                    ))}
                    <td className="p-2.5 text-center font-bold font-mono text-emerald-900 bg-emerald-50/50">
                      {minorTotals.totalRepairs}
                    </td>
                  </tr>
                  <tr className="bg-emerald-50/50 font-bold border-b-2 border-slate-300">
                    <td className="p-2.5 text-emerald-900">MTTR (Avg Days / repair)</td>
                    {MONTHS_LIST.map(m => {
                      const r = kpiData.mttr.minor[m];
                      const avg = r && r.totalRepairs > 0 ? (r.daysSpent / r.totalRepairs).toFixed(1) : '0';
                      return (
                        <td key={m} className="p-2 text-center font-mono text-emerald-800">
                          {avg}
                        </td>
                      );
                    })}
                    <td className="p-2.5 text-center font-mono text-emerald-900 font-black bg-emerald-100">
                      {minorTotals.avg}
                    </td>
                  </tr>

                  {/* Major A (<14 Days / 7 days below) */}
                  <tr className="bg-amber-50/30">
                    <td rowSpan={3} className="p-3 font-bold text-amber-800 align-top sticky left-0 bg-amber-50/80 border-r border-slate-200">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                        <span>Major A (&lt;14 Days)</span>
                      </div>
                      <p className="text-[10px] text-slate-500 font-normal mt-1 leading-tight">
                        Target: 7 days below (e.g. OS with format, supplier parts in stock)
                      </p>
                    </td>
                    <td className="p-2.5 text-slate-600 font-medium">Days spent for repairs</td>
                    {MONTHS_LIST.map(m => (
                      <td key={m} className="p-2 text-center font-mono">
                        <input
                          type="number"
                          min="0"
                          value={kpiData.mttr.majorA[m]?.daysSpent ?? 0}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            setKpiData(prev => ({
                              ...prev,
                              mttr: {
                                ...prev.mttr,
                                majorA: {
                                  ...prev.mttr.majorA,
                                  [m]: { ...prev.mttr.majorA[m], daysSpent: val }
                                }
                              }
                            }));
                          }}
                          className="w-11 text-center bg-transparent border-b border-dashed border-slate-300 focus:border-indigo-600 focus:outline-none"
                        />
                      </td>
                    ))}
                    <td className="p-2.5 text-center font-bold font-mono text-amber-900 bg-amber-50/50">
                      {majorATotals.totalDays}
                    </td>
                  </tr>
                  <tr className="bg-amber-50/30">
                    <td className="p-2.5 text-slate-600 font-medium">Total number of repairs</td>
                    {MONTHS_LIST.map(m => (
                      <td key={m} className="p-2 text-center font-mono">
                        <input
                          type="number"
                          min="0"
                          value={kpiData.mttr.majorA[m]?.totalRepairs ?? 0}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            setKpiData(prev => ({
                              ...prev,
                              mttr: {
                                ...prev.mttr,
                                majorA: {
                                  ...prev.mttr.majorA,
                                  [m]: { ...prev.mttr.majorA[m], totalRepairs: val }
                                }
                              }
                            }));
                          }}
                          className="w-11 text-center bg-transparent border-b border-dashed border-slate-300 focus:border-indigo-600 focus:outline-none"
                        />
                      </td>
                    ))}
                    <td className="p-2.5 text-center font-bold font-mono text-amber-900 bg-amber-50/50">
                      {majorATotals.totalRepairs}
                    </td>
                  </tr>
                  <tr className="bg-amber-50/50 font-bold border-b-2 border-slate-300">
                    <td className="p-2.5 text-amber-900">MTTR (Avg Days / repair)</td>
                    {MONTHS_LIST.map(m => {
                      const r = kpiData.mttr.majorA[m];
                      const avg = r && r.totalRepairs > 0 ? (r.daysSpent / r.totalRepairs).toFixed(1) : '0';
                      return (
                        <td key={m} className="p-2 text-center font-mono text-amber-800">
                          {avg}
                        </td>
                      );
                    })}
                    <td className="p-2.5 text-center font-mono text-amber-900 font-black bg-amber-100">
                      {majorATotals.avg}
                    </td>
                  </tr>

                  {/* Major B (<30 Days / 14 days above) */}
                  <tr className="bg-rose-50/30">
                    <td rowSpan={3} className="p-3 font-bold text-rose-800 align-top sticky left-0 bg-rose-50/80 border-r border-slate-200">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
                        <span>Major B (&lt;30 Days)</span>
                      </div>
                      <p className="text-[10px] text-slate-500 font-normal mt-1 leading-tight">
                        Target: 14 days above (supplier stock delay, approval delay)
                      </p>
                    </td>
                    <td className="p-2.5 text-slate-600 font-medium">Days spent for repairs</td>
                    {MONTHS_LIST.map(m => (
                      <td key={m} className="p-2 text-center font-mono">
                        <input
                          type="number"
                          min="0"
                          value={kpiData.mttr.majorB[m]?.daysSpent ?? 0}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            setKpiData(prev => ({
                              ...prev,
                              mttr: {
                                ...prev.mttr,
                                majorB: {
                                  ...prev.mttr.majorB,
                                  [m]: { ...prev.mttr.majorB[m], daysSpent: val }
                                }
                              }
                            }));
                          }}
                          className="w-11 text-center bg-transparent border-b border-dashed border-slate-300 focus:border-indigo-600 focus:outline-none"
                        />
                      </td>
                    ))}
                    <td className="p-2.5 text-center font-bold font-mono text-rose-900 bg-rose-50/50">
                      {majorBTotals.totalDays}
                    </td>
                  </tr>
                  <tr className="bg-rose-50/30">
                    <td className="p-2.5 text-slate-600 font-medium">Total number of repairs</td>
                    {MONTHS_LIST.map(m => (
                      <td key={m} className="p-2 text-center font-mono">
                        <input
                          type="number"
                          min="0"
                          value={kpiData.mttr.majorB[m]?.totalRepairs ?? 0}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            setKpiData(prev => ({
                              ...prev,
                              mttr: {
                                ...prev.mttr,
                                majorB: {
                                  ...prev.mttr.majorB,
                                  [m]: { ...prev.mttr.majorB[m], totalRepairs: val }
                                }
                              }
                            }));
                          }}
                          className="w-11 text-center bg-transparent border-b border-dashed border-slate-300 focus:border-indigo-600 focus:outline-none"
                        />
                      </td>
                    ))}
                    <td className="p-2.5 text-center font-bold font-mono text-rose-900 bg-rose-50/50">
                      {majorBTotals.totalRepairs}
                    </td>
                  </tr>
                  <tr className="bg-rose-50/50 font-bold">
                    <td className="p-2.5 text-rose-900">MTTR (Avg Days / repair)</td>
                    {MONTHS_LIST.map(m => {
                      const r = kpiData.mttr.majorB[m];
                      const avg = r && r.totalRepairs > 0 ? (r.daysSpent / r.totalRepairs).toFixed(1) : '0';
                      return (
                        <td key={m} className="p-2 text-center font-mono text-rose-800">
                          {avg}
                        </td>
                      );
                    })}
                    <td className="p-2.5 text-center font-mono text-rose-900 font-black bg-rose-100">
                      {majorBTotals.avg}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: CONNECTIVITY (100% UPTIME) */}
      {activeTab === 'connectivity' && (
        <div className="space-y-6">
          <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Wifi className="w-4 h-4 text-cyan-600" />
                  Percentage Uptime of Connectivity (Target: 100%)
                </h2>
                <p className="text-xs text-slate-500">
                  Regional Branch Internet link availability across BASA, SMP, SJDM, Cebu, CDO, Tarlac, and Bicol
                </p>
              </div>
            </div>

            {/* Branch Tables */}
            <div className="space-y-4">
              {branchKeys.map(k => {
                const yearTotal = calcBranchYearTotal(k);
                const isUnderTarget = yearTotal.pct < 100;

                return (
                  <div key={k} className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-slate-600" />
                        <span className="font-bold text-slate-900 text-xs">{branchLabels[k]}</span>
                        <span className="text-[10px] text-slate-500 font-mono">Target: 100%</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded text-xs font-bold font-mono ${yearTotal.pct >= 100 ? 'bg-emerald-100 text-emerald-800' : yearTotal.pct >= 90 ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800'}`}>
                          Year Uptime: {yearTotal.pct}%
                        </span>
                      </div>
                    </div>

                    <div className="overflow-x-auto border border-slate-200 rounded-lg bg-white">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="bg-slate-100 text-slate-700 text-[10px] font-bold uppercase border-b border-slate-200">
                            <th className="p-2 w-48">Particulars</th>
                            {MONTHS_LIST.map(m => (
                              <th key={m} className="p-1.5 text-center min-w-[48px]">{m.substring(0, 3)}</th>
                            ))}
                            <th className="p-2 text-center bg-cyan-50 font-bold text-cyan-900 min-w-[65px]">Total</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-[11px]">
                          <tr>
                            <td className="p-2 text-slate-600 font-medium">Hours with connectivity</td>
                            {MONTHS_LIST.map(m => (
                              <td key={m} className="p-1 text-center font-mono">
                                <input
                                  type="number"
                                  min="0"
                                  value={kpiData.connectivity[k][m]?.connectedHours ?? 0}
                                  onChange={(e) => {
                                    const val = Number(e.target.value);
                                    setKpiData(prev => ({
                                      ...prev,
                                      connectivity: {
                                        ...prev.connectivity,
                                        [k]: {
                                          ...prev.connectivity[k],
                                          [m]: {
                                            ...prev.connectivity[k][m],
                                            connectedHours: val,
                                            noConnectionHours: Math.max(0, (prev.connectivity[k][m]?.workingHours || 0) - val)
                                          }
                                        }
                                      }
                                    }));
                                  }}
                                  className="w-11 text-center bg-transparent border-b border-dashed border-slate-300 focus:border-cyan-600 focus:outline-none"
                                />
                              </td>
                            ))}
                            <td className="p-2 text-center font-mono font-bold text-cyan-900 bg-cyan-50/50">
                              {yearTotal.totalConnected}
                            </td>
                          </tr>
                          <tr>
                            <td className="p-2 text-slate-600 font-medium">Total working hours required</td>
                            {MONTHS_LIST.map(m => (
                              <td key={m} className="p-1 text-center font-mono text-slate-500">
                                {kpiData.connectivity[k][m]?.workingHours ?? 0}
                              </td>
                            ))}
                            <td className="p-2 text-center font-mono font-bold text-slate-800 bg-slate-50">
                              {yearTotal.totalWorking}
                            </td>
                          </tr>
                          <tr className="font-bold bg-slate-50">
                            <td className="p-2 text-slate-800">Measurement (Uptime %)</td>
                            {MONTHS_LIST.map(m => {
                              const r = kpiData.connectivity[k][m];
                              const pct = r && r.workingHours > 0 ? Math.round((r.connectedHours / r.workingHours) * 100) : 100;
                              return (
                                <td key={m} className={`p-1.5 text-center font-mono ${pct < 100 ? 'text-rose-700 bg-rose-50 font-black' : 'text-emerald-700'}`}>
                                  {pct}%
                                </td>
                              );
                            })}
                            <td className={`p-2 text-center font-mono font-black ${yearTotal.pct >= 100 ? 'text-emerald-800 bg-emerald-50' : 'text-rose-800 bg-rose-50'}`}>
                              {yearTotal.pct}%
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: PMS PLANNED MAINTENANCE */}
      {activeTab === 'pms' && (
        <div className="space-y-6">
          <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Wrench className="w-4 h-4 text-amber-600" />
                  KPI 3: Planned Maintenance Percentage (Target: = 100% semi annual)
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Full inspection, cleaning, diagnostics and thermal management across all 161 planned IT inventory devices
                </p>
              </div>
              <span className="px-2.5 py-1 rounded text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                Target: 100%
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* 1st Half */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-slate-900">1st Half Planned Maintenance</span>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                    100% Completed
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="p-3 bg-white rounded-lg border border-slate-200">
                    <span className="text-slate-500 text-[10px] uppercase font-bold">Planned Devices</span>
                    <p className="text-xl font-black text-slate-900 mt-1">{kpiData.pms.firstHalf.planned}</p>
                  </div>
                  <div className="p-3 bg-white rounded-lg border border-slate-200">
                    <span className="text-slate-500 text-[10px] uppercase font-bold">Actual PM Done</span>
                    <p className="text-xl font-black text-emerald-700 mt-1">{kpiData.pms.firstHalf.actualDone}</p>
                  </div>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                  <div className="bg-emerald-600 h-2 rounded-full" style={{ width: '100%' }}></div>
                </div>
              </div>

              {/* 2nd Half */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-slate-900">2nd Half Planned Maintenance</span>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                    100% Completed
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="p-3 bg-white rounded-lg border border-slate-200">
                    <span className="text-slate-500 text-[10px] uppercase font-bold">Planned Devices</span>
                    <p className="text-xl font-black text-slate-900 mt-1">{kpiData.pms.secondHalf.planned}</p>
                  </div>
                  <div className="p-3 bg-white rounded-lg border border-slate-200">
                    <span className="text-slate-500 text-[10px] uppercase font-bold">Actual PM Done</span>
                    <p className="text-xl font-black text-emerald-700 mt-1">{kpiData.pms.secondHalf.actualDone}</p>
                  </div>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                  <div className="bg-emerald-600 h-2 rounded-full" style={{ width: '100%' }}></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: ORIENTATIONS */}
      {activeTab === 'orientations' && (
        <div className="space-y-6">
          <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <GraduationCap className="w-4 h-4 text-purple-600" />
                  KPI 4: 10 for Orientation and Basic Troubleshooting
                </h2>
                <p className="text-xs text-slate-500">
                  Target: 10 user empowerment sessions (NetSuite system training & general IT basic troubleshooting)
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded text-xs font-bold bg-purple-100 text-purple-800">
                  YTD Conducted: {orientationTotals.combinedConducted} / 10 Target
                </span>
              </div>
            </div>

            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 text-[11px] font-bold border-b border-slate-200">
                    <th className="p-2.5 w-48">Orientation Category</th>
                    <th className="p-2.5 w-32">Metric</th>
                    {MONTHS_LIST.map(m => (
                      <th key={m} className="p-2 text-center min-w-[45px]">{m.substring(0, 3)}</th>
                    ))}
                    <th className="p-2.5 text-center bg-purple-50 text-purple-900 font-bold min-w-[65px]">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-[11px]">
                  <tr>
                    <td rowSpan={2} className="p-3 font-bold text-purple-900 align-top border-r border-slate-200 bg-purple-50/20">
                      NetSuite System Training
                    </td>
                    <td className="p-2 text-slate-600 font-medium">Number of Conducted</td>
                    {MONTHS_LIST.map(m => (
                      <td key={m} className="p-1.5 text-center font-mono">
                        <input
                          type="number"
                          min="0"
                          value={kpiData.orientations[m]?.conductedNetsuite ?? 0}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            setKpiData(prev => ({
                              ...prev,
                              orientations: {
                                ...prev.orientations,
                                [m]: { ...prev.orientations[m], conductedNetsuite: val }
                              }
                            }));
                          }}
                          className="w-10 text-center bg-transparent border-b border-dashed border-slate-300 focus:outline-none"
                        />
                      </td>
                    ))}
                    <td className="p-2 text-center font-mono font-bold text-purple-900 bg-purple-50">
                      {orientationTotals.totalNetsuiteConducted}
                    </td>
                  </tr>
                  <tr>
                    <td className="p-2 text-slate-600 font-medium">Scheduled Sessions</td>
                    {MONTHS_LIST.map(m => (
                      <td key={m} className="p-1.5 text-center font-mono text-slate-500">
                        {kpiData.orientations[m]?.scheduledNetsuite ?? 0}
                      </td>
                    ))}
                    <td className="p-2 text-center font-mono font-bold text-slate-700 bg-slate-50">
                      {orientationTotals.totalNetsuiteScheduled}
                    </td>
                  </tr>

                  <tr className="border-t-2 border-slate-200">
                    <td rowSpan={2} className="p-3 font-bold text-blue-900 align-top border-r border-slate-200 bg-blue-50/20">
                      Basic Troubleshooting
                    </td>
                    <td className="p-2 text-slate-600 font-medium">Number of Conducted</td>
                    {MONTHS_LIST.map(m => (
                      <td key={m} className="p-1.5 text-center font-mono">
                        <input
                          type="number"
                          min="0"
                          value={kpiData.orientations[m]?.conductedBasic ?? 0}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            setKpiData(prev => ({
                              ...prev,
                              orientations: {
                                ...prev.orientations,
                                [m]: { ...prev.orientations[m], conductedBasic: val }
                              }
                            }));
                          }}
                          className="w-10 text-center bg-transparent border-b border-dashed border-slate-300 focus:outline-none"
                        />
                      </td>
                    ))}
                    <td className="p-2 text-center font-mono font-bold text-blue-900 bg-blue-50">
                      {orientationTotals.totalBasicConducted}
                    </td>
                  </tr>
                  <tr>
                    <td className="p-2 text-slate-600 font-medium">Scheduled Sessions</td>
                    {MONTHS_LIST.map(m => (
                      <td key={m} className="p-1.5 text-center font-mono text-slate-500">
                        {kpiData.orientations[m]?.scheduledBasic ?? 0}
                      </td>
                    ))}
                    <td className="p-2 text-center font-mono font-bold text-slate-700 bg-slate-50">
                      {orientationTotals.totalBasicScheduled}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: NETSUITE SLA RESOLUTION */}
      {activeTab === 'netsuite' && (
        <div className="space-y-6">
          <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  KPI 5: Percentage of NetSuite Concerns Resolved on Time with IT (Target: 100%)
                </h2>
                <p className="text-xs text-slate-500">
                  Minor Concern: resolved within 1 day (no consultant/scripting) | Major Concern: resolved within 7 days
                </p>
              </div>
              <span className="px-2.5 py-1 rounded text-xs font-bold bg-emerald-100 text-emerald-800">
                Target: 100%
              </span>
            </div>

            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 text-[11px] font-bold border-b border-slate-200">
                    <th className="p-2.5 w-44">Concern Level</th>
                    <th className="p-2.5 w-36">Metric</th>
                    {MONTHS_LIST.map(m => (
                      <th key={m} className="p-2 text-center min-w-[45px]">{m.substring(0, 3)}</th>
                    ))}
                    <th className="p-2.5 text-center bg-emerald-50 text-emerald-900 font-bold min-w-[65px]">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-[11px]">
                  <tr>
                    <td rowSpan={2} className="p-3 font-bold text-emerald-900 align-top border-r border-slate-200 bg-emerald-50/20">
                      Minor Concern (&lt;= 1 day)
                    </td>
                    <td className="p-2 text-slate-600 font-medium">Days to resolve</td>
                    {MONTHS_LIST.map(m => (
                      <td key={m} className="p-1.5 text-center font-mono">
                        <input
                          type="number"
                          min="0"
                          value={kpiData.netsuite[m]?.minorResolvedDays ?? 0}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            setKpiData(prev => ({
                              ...prev,
                              netsuite: {
                                ...prev.netsuite,
                                [m]: { ...prev.netsuite[m], minorResolvedDays: val }
                              }
                            }));
                          }}
                          className="w-10 text-center bg-transparent border-b border-dashed border-slate-300 focus:outline-none"
                        />
                      </td>
                    ))}
                    <td className="p-2 text-center font-mono font-bold text-emerald-900 bg-emerald-50">
                      {netsuiteTotals.minorDays}
                    </td>
                  </tr>
                  <tr>
                    <td className="p-2 text-slate-600 font-medium">Total reported</td>
                    {MONTHS_LIST.map(m => (
                      <td key={m} className="p-1.5 text-center font-mono text-slate-500">
                        {kpiData.netsuite[m]?.minorReported ?? 0}
                      </td>
                    ))}
                    <td className="p-2 text-center font-mono font-bold text-slate-700 bg-slate-50">
                      {netsuiteTotals.minorRep}
                    </td>
                  </tr>

                  <tr className="border-t-2 border-slate-200">
                    <td rowSpan={2} className="p-3 font-bold text-indigo-900 align-top border-r border-slate-200 bg-indigo-50/20">
                      Major Concern (&lt;= 7 days)
                    </td>
                    <td className="p-2 text-slate-600 font-medium">Days to resolve</td>
                    {MONTHS_LIST.map(m => (
                      <td key={m} className="p-1.5 text-center font-mono">
                        <input
                          type="number"
                          min="0"
                          value={kpiData.netsuite[m]?.majorResolvedDays ?? 0}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            setKpiData(prev => ({
                              ...prev,
                              netsuite: {
                                ...prev.netsuite,
                                [m]: { ...prev.netsuite[m], majorResolvedDays: val }
                              }
                            }));
                          }}
                          className="w-10 text-center bg-transparent border-b border-dashed border-slate-300 focus:outline-none"
                        />
                      </td>
                    ))}
                    <td className="p-2 text-center font-mono font-bold text-indigo-900 bg-indigo-50">
                      {netsuiteTotals.majorDays}
                    </td>
                  </tr>
                  <tr>
                    <td className="p-2 text-slate-600 font-medium">Total reported</td>
                    {MONTHS_LIST.map(m => (
                      <td key={m} className="p-1.5 text-center font-mono text-slate-500">
                        {kpiData.netsuite[m]?.majorReported ?? 0}
                      </td>
                    ))}
                    <td className="p-2 text-center font-mono font-bold text-slate-700 bg-slate-50">
                      {netsuiteTotals.majorRep}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Official Criteria Reference Modal */}
      {showCriteriaModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fadeIn">
          <div className="relative w-full max-w-3xl bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-indigo-600" />
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Official IT 2026 Target Criteria Reference</h3>
                  <p className="text-xs text-slate-500">Exact SLA rules and repair category breakdown from company audit policy</p>
                </div>
              </div>
              <button
                onClick={() => setShowCriteriaModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs text-slate-700 bg-slate-50/30">
              {/* Minor Criteria */}
              <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/30 space-y-2.5">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-emerald-900 flex items-center gap-2 text-xs">
                    <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
                    Minor (&lt; 1 Day / 1 Day Turnaround)
                  </h4>
                  <span className="text-[10px] font-mono font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded">
                    Target: 1 Day (8 Working Hours)
                  </span>
                </div>
                <ol className="list-decimal list-inside space-y-1 text-[11px] text-slate-600 leading-relaxed">
                  <li>Operating System upgrade (Ex. Windows 8 to Windows 10) with no formatting of hard drive.</li>
                  <li>Reinstall of Operating System in desktop/laptop due to boot loop.</li>
                  <li>Power Supply (PSU) not working (if with stock in IT).</li>
                  <li>Clicking problem of Mouse or end of life (if with stock in IT).</li>
                  <li>Keyboard not functioning after pressing or end of life (if with stock in IT).</li>
                  <li>Monitor not powering on due to no signal, end of life (if with stock in IT).</li>
                  <li>Desktop/Laptop not powering on, RAM cannot read (if cleaning only).</li>
                  <li>Computer Specification of Requesting Department.</li>
                  <li>Printing not working due to counter already maximized.</li>
                  <li>Printing paper jam due to torn paper, stapler in roller.</li>
                </ol>
              </div>

              {/* Major A Criteria */}
              <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/30 space-y-2.5">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-amber-900 flex items-center gap-2 text-xs">
                    <span className="w-3 h-3 rounded-full bg-amber-500"></span>
                    Major A (&lt; 14 Days / 7 Days Below)
                  </h4>
                  <span className="text-[10px] font-mono font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded">
                    Target: Less than 7 Days
                  </span>
                </div>
                <ol className="list-decimal list-inside space-y-1 text-[11px] text-slate-600 leading-relaxed">
                  <li>Operating System upgrade (Ex. Windows 8 to Windows 10) with format of hard drive.</li>
                  <li>Requesting Parts with Approval Management less than 7 days and with Stock Availability by external Supplier.</li>
                  <li>Printer, Scanner and Projector to be repaired by External Supplier with stock availability of parts (Sample parts: replacement of Head, Roller, and Internal Sensor).</li>
                </ol>
              </div>

              {/* Major B Criteria */}
              <div className="p-4 rounded-xl border border-rose-200 bg-rose-50/30 space-y-2.5">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-rose-900 flex items-center gap-2 text-xs">
                    <span className="w-3 h-3 rounded-full bg-rose-500"></span>
                    Major B (&lt; 30 Days / 14 Days Above)
                  </h4>
                  <span className="text-[10px] font-mono font-bold bg-rose-100 text-rose-800 px-2 py-0.5 rounded">
                    Target: Above 14 Days / Supplier Delay
                  </span>
                </div>
                <ol className="list-decimal list-inside space-y-1 text-[11px] text-slate-600 leading-relaxed">
                  <li>Requesting Parts Without Approval Management above 7 days and without Stock Availability by external Supplier.</li>
                  <li>Printer and Scanner to be repaired by External Supplier without stock availability of parts (Sample parts: replacement of Head, Roller, and Internal Sensor).</li>
                </ol>
              </div>
            </div>

            <div className="px-6 py-3 border-t border-slate-200 bg-white flex justify-end">
              <button
                onClick={() => setShowCriteriaModal(false)}
                className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 transition-colors"
              >
                Close Reference
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
