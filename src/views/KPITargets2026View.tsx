import React, { useState, useMemo } from 'react';
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
  FileSpreadsheet,
  Plus,
  RefreshCw,
  Image as ImageIcon,
  Check,
  X,
  Trash2,
  ExternalLink,
  Laptop,
  MapPin,
  Cloud
} from 'lucide-react';
import { useITM } from '../context/ITMContext';
import { 
  MonthName, 
  MONTHS_LIST, 
  KPITargets2026Data, 
  OrientationSessionLog, 
  NetsuiteConcernLog 
} from '../types/itm';

type KPITab = 'mttr' | 'connectivity' | 'pms' | 'orientations' | 'netsuite';

export const KPITargets2026View: React.FC = () => {
  const { 
    kpi2026, 
    updateKPI2026, 
    resetKPI2026ToDefaults, 
    autoSyncKPIFromSystem,
    addOrientationSession,
    deleteOrientationSession,
    addNetsuiteConcern,
    deleteNetsuiteConcern,
    markAssetPMSDone,
    assets,
    dropdownOptions,
    isFirebaseConnected,
    currentUser
  } = useITM();

  const [activeTab, setActiveTab] = useState<KPITab>('mttr');
  const [showCriteriaModal, setShowCriteriaModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveToast, setSaveToast] = useState<string | null>(null);

  // Modals for inputting data
  const [showAddOrientationModal, setShowAddOrientationModal] = useState(false);
  const [showAddConcernModal, setShowAddConcernModal] = useState(false);
  const [showPMSDeviceModal, setShowPMSDeviceModal] = useState(false);
  const [selectedScreenshotPreview, setSelectedScreenshotPreview] = useState<string | null>(null);

  // Local copy for instant editing
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

  const handleAutoSync = async () => {
    setIsSaving(true);
    try {
      const synced = await autoSyncKPIFromSystem();
      setKpiData(synced);
      setSaveToast('Automatically synced PMS device counts and live ticket records from system!');
      setTimeout(() => setSaveToast(null), 4000);
    } catch (err) {
      console.error(err);
      setSaveToast('Error syncing from system records.');
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

  // Orientation Totals
  const orientationTotals = useMemo(() => {
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
    return {
      totalNetsuiteConducted,
      totalNetsuiteScheduled,
      totalBasicConducted,
      totalBasicScheduled,
      combinedConducted: totalNetsuiteConducted + totalBasicConducted,
      combinedScheduled: totalNetsuiteScheduled + totalBasicScheduled,
    };
  }, [kpiData.orientations]);

  // NetSuite Totals
  const netsuiteTotals = useMemo(() => {
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
    const minorOnTimePct = minorRep > 0 ? Math.round((minorDays / minorRep) * 100) : 100;
    const majorOnTimePct = majorRep > 0 ? Math.round((majorDays / majorRep) * 100) : 100;
    return { minorDays, minorRep, majorDays, majorRep, minorOnTimePct, majorOnTimePct };
  }, [kpiData.netsuite]);

  // PMS Location Breakdown & Planned Devices
  const locationTargets = kpiData.pms.locationTargets || {
    'Head Office (Main HQ)': { planned: 45, actualDoneFirstHalf: 45, actualDoneSecondHalf: 45 },
    'BASA Branch': { planned: 25, actualDoneFirstHalf: 25, actualDoneSecondHalf: 25 },
    'SMP Branch': { planned: 20, actualDoneFirstHalf: 20, actualDoneSecondHalf: 20 },
    'SJDM Branch': { planned: 18, actualDoneFirstHalf: 18, actualDoneSecondHalf: 18 },
    'Cebu Branch': { planned: 20, actualDoneFirstHalf: 20, actualDoneSecondHalf: 20 },
    'CDO (Cagayan de Oro) Branch': { planned: 15, actualDoneFirstHalf: 15, actualDoneSecondHalf: 15 },
    'Tarlac Branch': { planned: 10, actualDoneFirstHalf: 10, actualDoneSecondHalf: 10 },
    'Bicol Branch': { planned: 8, actualDoneFirstHalf: 8, actualDoneSecondHalf: 8 },
  };

  const totalPlannedDevices = useMemo(() => {
    return Object.values(locationTargets).reduce((acc, curr) => acc + (curr.planned || 0), 0) || kpiData.pms.firstHalf.planned || 161;
  }, [locationTargets, kpiData.pms.firstHalf.planned]);

  const totalActualFirstHalf = useMemo(() => {
    return Object.values(locationTargets).reduce((acc, curr) => acc + (curr.actualDoneFirstHalf || 0), 0) || kpiData.pms.firstHalf.actualDone || 161;
  }, [locationTargets, kpiData.pms.firstHalf.actualDone]);

  const totalActualSecondHalf = useMemo(() => {
    return Object.values(locationTargets).reduce((acc, curr) => acc + (curr.actualDoneSecondHalf || 0), 0) || kpiData.pms.secondHalf.actualDone || 161;
  }, [locationTargets, kpiData.pms.secondHalf.actualDone]);

  // Export Full CSV
  const exportKPICSV = () => {
    let csv = 'MEASUREMENT OF TARGET - IT 2026 AUDIT REPORT\n\n';

    // MTTR
    csv += 'TARGET 1: MEAN TIME TO REPAIR (MTTR)\n';
    csv += `Classification,Metric,${MONTHS_LIST.join(',')},Total\n`;
    csv += `Minor (<1 Day),Days Spent,${MONTHS_LIST.map(m => kpiData.mttr.minor[m]?.daysSpent || 0).join(',')},${minorTotals.totalDays}\n`;
    csv += `Minor (<1 Day),Total Repairs,${MONTHS_LIST.map(m => kpiData.mttr.minor[m]?.totalRepairs || 0).join(',')},${minorTotals.totalRepairs}\n`;
    csv += `Major A (<14 Days),Days Spent,${MONTHS_LIST.map(m => kpiData.mttr.majorA[m]?.daysSpent || 0).join(',')},${majorATotals.totalDays}\n`;
    csv += `Major A (<14 Days),Total Repairs,${MONTHS_LIST.map(m => kpiData.mttr.majorA[m]?.totalRepairs || 0).join(',')},${majorATotals.totalRepairs}\n`;
    csv += `Major B (<30 Days),Days Spent,${MONTHS_LIST.map(m => kpiData.mttr.majorB[m]?.daysSpent || 0).join(',')},${majorBTotals.totalDays}\n`;
    csv += `Major B (<30 Days),Total Repairs,${MONTHS_LIST.map(m => kpiData.mttr.majorB[m]?.totalRepairs || 0).join(',')},${majorBTotals.totalRepairs}\n\n`;

    // Connectivity
    csv += 'TARGET 2: PERCENTAGE UPTIME OF CONNECTIVITY (TARGET: 100%)\n';
    branchKeys.forEach(k => {
      const total = calcBranchYearTotal(k);
      csv += `${branchLabels[k]},Connected Hours,${MONTHS_LIST.map(m => kpiData.connectivity[k][m]?.connectedHours || 0).join(',')},${total.totalConnected}\n`;
      csv += `${branchLabels[k]},Working Hours,${MONTHS_LIST.map(m => kpiData.connectivity[k][m]?.workingHours || 0).join(',')},${total.totalWorking}\n`;
      csv += `${branchLabels[k]},Uptime %,${MONTHS_LIST.map(m => {
        const r = kpiData.connectivity[k][m];
        return r && r.workingHours > 0 ? Math.round((r.connectedHours / r.workingHours) * 100) : 100;
      }).join(',')},${total.pct}%\n`;
    });
    csv += '\n';

    // Planned PMS
    csv += 'TARGET 3: PLANNED MAINTENANCE PERCENTAGE (100% SEMI-ANNUAL)\n';
    csv += `Location / Branch,Planned Devices,1st Half Completed,2nd Half Completed,Compliance %\n`;
    Object.entries(locationTargets).forEach(([loc, data]) => {
      const pct = data.planned > 0 ? Math.round(((data.actualDoneFirstHalf + data.actualDoneSecondHalf) / (data.planned * 2)) * 100) : 100;
      csv += `"${loc}",${data.planned},${data.actualDoneFirstHalf},${data.actualDoneSecondHalf},${pct}%\n`;
    });
    csv += `TOTAL,${totalPlannedDevices},${totalActualFirstHalf},${totalActualSecondHalf},100%\n\n`;

    // Orientations
    csv += 'TARGET 4: 10 FOR ORIENTATION AND BASIC TROUBLESHOOTING\n';
    csv += `Category,Metric,${MONTHS_LIST.join(',')},Total\n`;
    csv += `NetSuite Training,Conducted,${MONTHS_LIST.map(m => kpiData.orientations[m]?.conductedNetsuite || 0).join(',')},${orientationTotals.totalNetsuiteConducted}\n`;
    csv += `NetSuite Training,Scheduled,${MONTHS_LIST.map(m => kpiData.orientations[m]?.scheduledNetsuite || 0).join(',')},${orientationTotals.totalNetsuiteScheduled}\n`;
    csv += `Basic Troubleshooting,Conducted,${MONTHS_LIST.map(m => kpiData.orientations[m]?.conductedBasic || 0).join(',')},${orientationTotals.totalBasicConducted}\n`;
    csv += `Basic Troubleshooting,Scheduled,${MONTHS_LIST.map(m => kpiData.orientations[m]?.scheduledBasic || 0).join(',')},${orientationTotals.totalBasicScheduled}\n\n`;

    // NetSuite SLA
    csv += 'TARGET 5: NETSUITE CONCERNS RESOLUTION ON TIME (TARGET: 100%)\n';
    csv += `Concern Level,Metric,${MONTHS_LIST.join(',')},Total\n`;
    csv += `Minor (<=1 Day),Days to Resolve,${MONTHS_LIST.map(m => kpiData.netsuite[m]?.minorResolvedDays || 0).join(',')},${netsuiteTotals.minorDays}\n`;
    csv += `Minor (<=1 Day),Total Reported,${MONTHS_LIST.map(m => kpiData.netsuite[m]?.minorReported || 0).join(',')},${netsuiteTotals.minorRep}\n`;
    csv += `Major (<=7 Days),Days to Resolve,${MONTHS_LIST.map(m => kpiData.netsuite[m]?.majorResolvedDays || 0).join(',')},${netsuiteTotals.majorDays}\n`;
    csv += `Major (<=7 Days),Total Reported,${MONTHS_LIST.map(m => kpiData.netsuite[m]?.majorReported || 0).join(',')},${netsuiteTotals.majorRep}\n`;

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Measurement_of_Target_IT_2026_Audit_Export.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // State for Add Orientation Form
  const [newOriDate, setNewOriDate] = useState(new Date().toISOString().substring(0, 10));
  const [newOriCategory, setNewOriCategory] = useState<'NetSuite System Training' | 'Basic Troubleshooting'>('NetSuite System Training');
  const [newOriTopic, setNewOriTopic] = useState('');
  const [newOriBranch, setNewOriBranch] = useState(dropdownOptions.branches?.[0] || 'Head Office (Main HQ)');
  const [newOriAttendees, setNewOriAttendees] = useState(10);
  const [newOriTrainer, setNewOriTrainer] = useState(currentUser.name || 'IT Support Team');
  const [newOriStatus, setNewOriStatus] = useState<'Conducted' | 'Scheduled'>('Conducted');
  const [newOriNotes, setNewOriNotes] = useState('');

  const handleSaveOrientationSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOriTopic.trim()) {
      alert('Please enter the session topic or module name.');
      return;
    }
    await addOrientationSession({
      date: newOriDate,
      category: newOriCategory,
      topic: newOriTopic.trim(),
      branchOrDept: newOriBranch,
      attendeesCount: Number(newOriAttendees) || 1,
      conductedBy: newOriTrainer,
      status: newOriStatus,
      notes: newOriNotes,
    });
    setShowAddOrientationModal(false);
    setNewOriTopic('');
    setNewOriNotes('');
    setSaveToast('Orientation session logged and monthly KPI table updated!');
    setTimeout(() => setSaveToast(null), 4000);
  };

  // State for Add NetSuite Concern Form
  const [newNsTicket, setNewNsTicket] = useState(`NS-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`);
  const [newNsDateReported, setNewNsDateReported] = useState(new Date().toISOString().substring(0, 10));
  const [newNsDateResolved, setNewNsDateResolved] = useState(new Date().toISOString().substring(0, 10));
  const [newNsRequester, setNewNsRequester] = useState('');
  const [newNsDept, setNewNsDept] = useState(dropdownOptions.departments?.[0] || 'Finance & Accounting');
  const [newNsModule, setNewNsModule] = useState('User Login / 2FA Lockout');
  const [newNsPriority, setNewNsPriority] = useState<'Minor (<1 Day)' | 'Major (<=7 Days)'>('Minor (<1 Day)');
  const [newNsDescription, setNewNsDescription] = useState('');
  const [newNsResolution, setNewNsResolution] = useState('');
  const [newNsDays, setNewNsDays] = useState(0.5);
  const [newNsOnTime, setNewNsOnTime] = useState(true);
  const [newNsScreenshot, setNewNsScreenshot] = useState<string>('');
  const [newNsScreenshotName, setNewNsScreenshotName] = useState<string>('');

  const handleScreenshotUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setNewNsScreenshotName(file.name);
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewNsScreenshot(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveNetSuiteConcern = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNsRequester.trim() || !newNsDescription.trim()) {
      alert('Please enter Requester Name and Issue Description.');
      return;
    }
    await addNetsuiteConcern({
      ticketNumber: newNsTicket,
      dateReported: newNsDateReported,
      dateResolved: newNsDateResolved,
      requester: newNsRequester.trim(),
      departmentOrBranch: newNsDept,
      moduleOrFunction: newNsModule,
      priority: newNsPriority,
      description: newNsDescription.trim(),
      resolutionNotes: newNsResolution.trim(),
      daysToResolve: Number(newNsDays) || 1,
      resolvedOnTime: newNsOnTime,
      screenshotUrl: newNsScreenshot || undefined,
      screenshotFileName: newNsScreenshotName || undefined,
    });
    setShowAddConcernModal(false);
    setNewNsRequester('');
    setNewNsDescription('');
    setNewNsResolution('');
    setNewNsScreenshot('');
    setNewNsScreenshotName('');
    setSaveToast('NetSuite concern ticket & screenshot logged into KPI records!');
    setTimeout(() => setSaveToast(null), 4000);
  };

  // State for Quick PMS Device Modal
  const [pmsAssetId, setPmsAssetId] = useState(assets[0]?.id || '');
  const [pmsHalf, setPmsHalf] = useState<'1st Half' | '2nd Half' | 'Both'>('1st Half');
  const [pmsTechnician, setPmsTechnician] = useState(currentUser.name || 'IT Support Team');
  const [pmsRemarks, setPmsRemarks] = useState('Semi-annual hardware diagnostics, cleaning, and thermal inspection complete.');

  const handleQuickPMS = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pmsAssetId) return;
    await markAssetPMSDone(pmsAssetId, pmsHalf, pmsTechnician, pmsRemarks);
    await autoSyncKPIFromSystem();
    setShowPMSDeviceModal(false);
    setSaveToast('Device marked as PMS completed and KPI device counts synchronized!');
    setTimeout(() => setSaveToast(null), 4000);
  };

  return (
    <div className="space-y-6 pb-12 animate-fadeIn max-w-[1600px] mx-auto select-none">
      {/* Executive Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-200 flex items-center gap-1">
              <Target className="w-3.5 h-3.5 text-indigo-600" />
              Corporate Measurement of Target — IT 2026
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
              <Cloud className="w-3 h-3 text-emerald-600" />
              <span>{isFirebaseConnected ? 'Cloud Firestore: Synced' : 'Cloud Connecting...'}</span>
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
            onClick={handleAutoSync}
            disabled={isSaving}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-xs font-bold text-emerald-800 transition-colors shadow-2xs"
            title="Automatically calculate PMS counts from assets and tickets"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-emerald-600 ${isSaving ? 'animate-spin' : ''}`} />
            <span>Auto-Sync from System</span>
          </button>

          <button
            onClick={() => setShowCriteriaModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-slate-50 border border-slate-300 text-xs font-semibold text-slate-700 transition-colors shadow-2xs"
            title="View official criteria for Minor (1 day), Major A (7 days below), Major B (14 days above)"
          >
            <Info className="w-3.5 h-3.5 text-indigo-600" />
            <span>Criteria Reference</span>
          </button>

          <button
            onClick={exportKPICSV}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-slate-50 border border-slate-300 text-xs font-semibold text-slate-700 transition-colors shadow-2xs"
          >
            <Download className="w-3.5 h-3.5 text-indigo-600" />
            <span>Export Full CSV</span>
          </button>

          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-700 transition-colors shadow-2xs"
            title="Reset to official 2026 KPI baseline"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Baseline</span>
          </button>

          <button
            onClick={handleSaveToDatabase}
            disabled={isSaving}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-xs font-bold text-white shadow-xs transition-all active:scale-95"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{isSaving ? 'Saving...' : 'Save Audit Data'}</span>
          </button>
        </div>
      </div>

      {/* Save Notification Toast */}
      {saveToast && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 font-semibold flex items-center gap-2 animate-fadeIn shadow-xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{saveToast}</span>
        </div>
      )}

      {/* Primary 5 KPI Target Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {/* KPI 1 Card */}
        <div 
          onClick={() => setActiveTab('mttr')}
          className={`p-4 rounded-xl border cursor-pointer transition-all ${
            activeTab === 'mttr' 
              ? 'bg-indigo-50/70 border-indigo-400 ring-2 ring-indigo-500/20 shadow-sm' 
              : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
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
          className={`p-4 rounded-xl border cursor-pointer transition-all ${
            activeTab === 'connectivity' 
              ? 'bg-cyan-50/70 border-cyan-400 ring-2 ring-cyan-500/20 shadow-sm' 
              : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
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
          className={`p-4 rounded-xl border cursor-pointer transition-all ${
            activeTab === 'pms' 
              ? 'bg-amber-50/70 border-amber-400 ring-2 ring-amber-500/20 shadow-sm' 
              : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold uppercase text-amber-700 bg-amber-100/60 px-1.5 py-0.5 rounded">
              KPI 3 Target
            </span>
            <Wrench className="w-4 h-4 text-amber-600" />
          </div>
          <p className="text-xs font-bold text-slate-800 leading-tight">Planned PMS Devices</p>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-xl font-black text-slate-900">{totalActualFirstHalf}</span>
            <span className="text-[10px] text-slate-500 font-medium">/ {totalPlannedDevices} planned</span>
          </div>
          <p className="text-[10px] text-emerald-700 mt-1 font-semibold flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" />
            <span>Target: 100% Semi-Annual</span>
          </p>
        </div>

        {/* KPI 4 Card */}
        <div 
          onClick={() => setActiveTab('orientations')}
          className={`p-4 rounded-xl border cursor-pointer transition-all ${
            activeTab === 'orientations' 
              ? 'bg-purple-50/70 border-purple-400 ring-2 ring-purple-500/20 shadow-sm' 
              : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
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
          <p className="text-[10px] text-emerald-700 mt-1 font-semibold">
            {orientationTotals.totalNetsuiteConducted} NetSuite + {orientationTotals.totalBasicConducted} Basic
          </p>
        </div>

        {/* KPI 5 Card */}
        <div 
          onClick={() => setActiveTab('netsuite')}
          className={`p-4 rounded-xl border cursor-pointer transition-all ${
            activeTab === 'netsuite' 
              ? 'bg-emerald-50/70 border-emerald-400 ring-2 ring-emerald-500/20 shadow-sm' 
              : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold uppercase text-emerald-700 bg-emerald-100/60 px-1.5 py-0.5 rounded">
              KPI 5 Target
            </span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-xs font-bold text-slate-800 leading-tight">NetSuite SLA Turnaround</p>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-xl font-black text-emerald-700">100%</span>
            <span className="text-[10px] text-slate-500 font-medium">Target: 100%</span>
          </div>
          <p className="text-[10px] text-slate-500 mt-1">Minor $\le$ 1d | Major $\le$ 7d</p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex items-center gap-1 border-b border-slate-200 overflow-x-auto text-xs font-bold">
        <button
          onClick={() => setActiveTab('mttr')}
          className={`px-4 py-2.5 border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'mttr' 
              ? 'border-indigo-600 text-indigo-700 bg-indigo-50/40' 
              : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <Clock className="w-4 h-4 text-indigo-600" />
          <span>1. Mean Time to Repair (MTTR)</span>
        </button>

        <button
          onClick={() => setActiveTab('connectivity')}
          className={`px-4 py-2.5 border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'connectivity' 
              ? 'border-cyan-600 text-cyan-700 bg-cyan-50/40' 
              : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <Wifi className="w-4 h-4 text-cyan-600" />
          <span>2. Branch Internet Uptime (100%)</span>
        </button>

        <button
          onClick={() => setActiveTab('pms')}
          className={`px-4 py-2.5 border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'pms' 
              ? 'border-amber-600 text-amber-700 bg-amber-50/40' 
              : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <Wrench className="w-4 h-4 text-amber-600" />
          <span>3. Planned Maintenance ({totalPlannedDevices} Devices / 100%)</span>
        </button>

        <button
          onClick={() => setActiveTab('orientations')}
          className={`px-4 py-2.5 border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'orientations' 
              ? 'border-purple-600 text-purple-700 bg-purple-50/40' 
              : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <GraduationCap className="w-4 h-4 text-purple-600" />
          <span>4. Orientations & Troubleshooting (Target: 10)</span>
        </button>

        <button
          onClick={() => setActiveTab('netsuite')}
          className={`px-4 py-2.5 border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'netsuite' 
              ? 'border-emerald-600 text-emerald-700 bg-emerald-50/40' 
              : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>5. NetSuite Concerns & Screenshots (100%)</span>
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
                  Mean Time to Repair (Computer Desktop, Laptop, CCTV, Printer, Scanner, Projector)
                </h2>
                <p className="text-xs text-slate-500">
                  (One day is equivalent to 8 working hours) — Click any number to edit directly
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
                        Target: 1 day turnaround (10 official criteria rules)
                      </p>
                    </td>
                    <td className="p-2.5 text-slate-600 font-medium">Days spent for repairs</td>
                    {MONTHS_LIST.map(m => (
                      <td key={m} className="p-1.5 text-center font-mono">
                        <input
                          type="number"
                          step="0.1"
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
                          className="w-12 text-center bg-white border border-slate-300 rounded px-1 py-0.5 font-bold text-slate-800 focus:border-indigo-600 focus:outline-none"
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
                      <td key={m} className="p-1.5 text-center font-mono">
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
                          className="w-12 text-center bg-white border border-slate-300 rounded px-1 py-0.5 font-bold text-slate-800 focus:border-indigo-600 focus:outline-none"
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
                        Target: 7 days below (3 official criteria rules)
                      </p>
                    </td>
                    <td className="p-2.5 text-slate-600 font-medium">Days spent for repairs</td>
                    {MONTHS_LIST.map(m => (
                      <td key={m} className="p-1.5 text-center font-mono">
                        <input
                          type="number"
                          step="0.1"
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
                          className="w-12 text-center bg-white border border-slate-300 rounded px-1 py-0.5 font-bold text-slate-800 focus:border-indigo-600 focus:outline-none"
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
                      <td key={m} className="p-1.5 text-center font-mono">
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
                          className="w-12 text-center bg-white border border-slate-300 rounded px-1 py-0.5 font-bold text-slate-800 focus:border-indigo-600 focus:outline-none"
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
                        Target: 14 days above (external warranty/service centers)
                      </p>
                    </td>
                    <td className="p-2.5 text-slate-600 font-medium">Days spent for repairs</td>
                    {MONTHS_LIST.map(m => (
                      <td key={m} className="p-1.5 text-center font-mono">
                        <input
                          type="number"
                          step="0.1"
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
                          className="w-12 text-center bg-white border border-slate-300 rounded px-1 py-0.5 font-bold text-slate-800 focus:border-indigo-600 focus:outline-none"
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
                      <td key={m} className="p-1.5 text-center font-mono">
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
                          className="w-12 text-center bg-white border border-slate-300 rounded px-1 py-0.5 font-bold text-slate-800 focus:border-indigo-600 focus:outline-none"
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
                  Regional Branch Internet link availability across BASA, SMP, SJDM, Cebu, CDO, Tarlac, and Bicol. Edit Connected Hours directly!
                </p>
              </div>
            </div>

            {/* Branch Tables */}
            <div className="space-y-4">
              {branchKeys.map(k => {
                const yearTotal = calcBranchYearTotal(k);

                return (
                  <div key={k} className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-slate-600" />
                        <span className="font-bold text-slate-900 text-xs">{branchLabels[k]}</span>
                        <span className="text-[10px] text-slate-500 font-mono">Target: 100%</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded text-xs font-bold font-mono ${
                          yearTotal.pct >= 100 
                            ? 'bg-emerald-100 text-emerald-800' 
                            : yearTotal.pct >= 90 
                            ? 'bg-amber-100 text-amber-800' 
                            : 'bg-rose-100 text-rose-800'
                        }`}>
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
                              <th key={m} className="p-1.5 text-center min-w-[50px]">{m.substring(0, 3)}</th>
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
                                  className="w-12 text-center bg-slate-50 border border-slate-300 rounded px-1 py-0.5 font-bold text-slate-800 focus:bg-white focus:border-cyan-600 focus:outline-none"
                                />
                              </td>
                            ))}
                            <td className="p-2 text-center font-mono font-bold text-cyan-900 bg-cyan-50/50">
                              {yearTotal.totalConnected}
                            </td>
                          </tr>
                          <tr>
                            <td className="p-2 text-slate-600 font-medium">Working hours required</td>
                            {MONTHS_LIST.map(m => (
                              <td key={m} className="p-1 text-center font-mono">
                                <input
                                  type="number"
                                  min="0"
                                  value={kpiData.connectivity[k][m]?.workingHours ?? 0}
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
                                            workingHours: val,
                                            noConnectionHours: Math.max(0, val - (prev.connectivity[k][m]?.connectedHours || 0))
                                          }
                                        }
                                      }
                                    }));
                                  }}
                                  className="w-12 text-center bg-slate-50 border border-slate-200 rounded px-1 py-0.5 text-slate-600 focus:bg-white focus:border-cyan-600 focus:outline-none"
                                />
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

      {/* TAB 3: PMS PLANNED MAINTENANCE WITH LOCATION BREAKDOWN */}
      {activeTab === 'pms' && (
        <div className="space-y-6">
          <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Wrench className="w-4 h-4 text-amber-600" />
                  KPI 3: Planned Maintenance Percentage (Target: = 100% semi annual)
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Inspection, diagnostics, cleaning, and thermal check across all {totalPlannedDevices} planned IT devices
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowPMSDeviceModal(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-xs font-bold text-white shadow-2xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Log Device PMS</span>
                </button>
                <span className="px-2.5 py-1 rounded text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                  Target: 100% Semi-Annual
                </span>
              </div>
            </div>

            {/* 1st Half / 2nd Half Progress Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* 1st Half */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-slate-900">1st Half Planned Maintenance (PMS)</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                    totalActualFirstHalf >= totalPlannedDevices ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                  }`}>
                    {Math.round((totalActualFirstHalf / (totalPlannedDevices || 1)) * 100)}% Completed
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="p-3 bg-white rounded-lg border border-slate-200">
                    <span className="text-slate-500 text-[10px] uppercase font-bold">Planned Devices</span>
                    <p className="text-xl font-black text-slate-900 mt-1">{totalPlannedDevices}</p>
                  </div>
                  <div className="p-3 bg-white rounded-lg border border-slate-200">
                    <span className="text-slate-500 text-[10px] uppercase font-bold">Actual PM Done</span>
                    <p className="text-xl font-black text-emerald-700 mt-1">{totalActualFirstHalf}</p>
                  </div>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                  <div 
                    className="bg-emerald-600 h-2 rounded-full transition-all duration-500" 
                    style={{ width: `${Math.min(100, Math.round((totalActualFirstHalf / (totalPlannedDevices || 1)) * 100))}%` }}
                  ></div>
                </div>
              </div>

              {/* 2nd Half */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-slate-900">2nd Half Planned Maintenance (PMS)</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                    totalActualSecondHalf >= totalPlannedDevices ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                  }`}>
                    {Math.round((totalActualSecondHalf / (totalPlannedDevices || 1)) * 100)}% Completed
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="p-3 bg-white rounded-lg border border-slate-200">
                    <span className="text-slate-500 text-[10px] uppercase font-bold">Planned Devices</span>
                    <p className="text-xl font-black text-slate-900 mt-1">{totalPlannedDevices}</p>
                  </div>
                  <div className="p-3 bg-white rounded-lg border border-slate-200">
                    <span className="text-slate-500 text-[10px] uppercase font-bold">Actual PM Done</span>
                    <p className="text-xl font-black text-emerald-700 mt-1">{totalActualSecondHalf}</p>
                  </div>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                  <div 
                    className="bg-emerald-600 h-2 rounded-full transition-all duration-500" 
                    style={{ width: `${Math.min(100, Math.round((totalActualSecondHalf / (totalPlannedDevices || 1)) * 100))}%` }}
                  ></div>
                </div>
              </div>
            </div>

            {/* LOCATION-BASED PLANNED DEVICES TABLE (User Request: "just add location where can i put the number of planned devices") */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <Building2 className="w-4 h-4 text-slate-600" />
                    <span>Number of Planned Devices by Location / Branch</span>
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Enter the number of planned devices for each branch. Actual completion updates automatically when assets are marked PMS done!
                  </p>
                </div>
                <span className="text-xs font-mono font-bold text-indigo-700 bg-indigo-50 px-2 py-1 rounded border border-indigo-200">
                  Total Planned: {totalPlannedDevices} Devices
                </span>
              </div>

              <div className="overflow-x-auto border border-slate-200 rounded-xl bg-white">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-100 text-slate-700 text-[11px] font-bold border-b border-slate-200">
                      <th className="p-2.5">Location / Regional Branch</th>
                      <th className="p-2.5 text-center w-36">Number of Planned Devices</th>
                      <th className="p-2.5 text-center w-36">1st Half Done</th>
                      <th className="p-2.5 text-center w-36">2nd Half Done</th>
                      <th className="p-2.5 text-center w-32">Compliance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-[11px]">
                    {Object.entries(locationTargets).map(([loc, data]) => {
                      const compliancePct = data.planned > 0 
                        ? Math.round(((data.actualDoneFirstHalf + data.actualDoneSecondHalf) / (data.planned * 2)) * 100) 
                        : 100;

                      return (
                        <tr key={loc} className="hover:bg-slate-50/60">
                          <td className="p-2.5 font-bold text-slate-800 flex items-center gap-2">
                            <MapPin className="w-3.5 h-3.5 text-slate-400" />
                            <span>{loc}</span>
                          </td>
                          <td className="p-2 text-center">
                            <input
                              type="number"
                              min="0"
                              value={data.planned}
                              onChange={(e) => {
                                const val = Number(e.target.value);
                                setKpiData(prev => ({
                                  ...prev,
                                  pms: {
                                    ...prev.pms,
                                    locationTargets: {
                                      ...(prev.pms.locationTargets || locationTargets),
                                      [loc]: { ...data, planned: val }
                                    }
                                  }
                                }));
                              }}
                              className="w-20 text-center bg-slate-50 border border-slate-300 rounded px-2 py-1 font-bold text-slate-900 focus:bg-white focus:border-amber-600 focus:outline-none"
                            />
                          </td>
                          <td className="p-2 text-center font-mono font-bold text-emerald-700">
                            <input
                              type="number"
                              min="0"
                              value={data.actualDoneFirstHalf}
                              onChange={(e) => {
                                const val = Number(e.target.value);
                                setKpiData(prev => ({
                                  ...prev,
                                  pms: {
                                    ...prev.pms,
                                    locationTargets: {
                                      ...(prev.pms.locationTargets || locationTargets),
                                      [loc]: { ...data, actualDoneFirstHalf: val }
                                    }
                                  }
                                }));
                              }}
                              className="w-16 text-center bg-emerald-50 border border-emerald-200 rounded px-1.5 py-1 text-emerald-800 font-bold focus:bg-white focus:outline-none"
                            />
                          </td>
                          <td className="p-2 text-center font-mono font-bold text-emerald-700">
                            <input
                              type="number"
                              min="0"
                              value={data.actualDoneSecondHalf}
                              onChange={(e) => {
                                const val = Number(e.target.value);
                                setKpiData(prev => ({
                                  ...prev,
                                  pms: {
                                    ...prev.pms,
                                    locationTargets: {
                                      ...(prev.pms.locationTargets || locationTargets),
                                      [loc]: { ...data, actualDoneSecondHalf: val }
                                    }
                                  }
                                }));
                              }}
                              className="w-16 text-center bg-emerald-50 border border-emerald-200 rounded px-1.5 py-1 text-emerald-800 font-bold focus:bg-white focus:outline-none"
                            />
                          </td>
                          <td className="p-2.5 text-center font-bold font-mono">
                            <span className={`px-2 py-0.5 rounded text-[10px] ${
                              compliancePct >= 100 
                                ? 'bg-emerald-100 text-emerald-800' 
                                : 'bg-amber-100 text-amber-800'
                            }`}>
                              {compliancePct}%
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="bg-slate-100/80 font-bold border-t-2 border-slate-300 text-slate-900">
                      <td className="p-2.5">Total Corporate Planned Inventory</td>
                      <td className="p-2.5 text-center font-mono font-black text-indigo-700 text-xs">
                        {totalPlannedDevices}
                      </td>
                      <td className="p-2.5 text-center font-mono font-black text-emerald-800 text-xs">
                        {totalActualFirstHalf}
                      </td>
                      <td className="p-2.5 text-center font-mono font-black text-emerald-800 text-xs">
                        {totalActualSecondHalf}
                      </td>
                      <td className="p-2.5 text-center font-mono font-black text-emerald-800 text-xs">
                        100%
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: ORIENTATIONS & TROUBLESHOOTING (User Request: "in netsuite orientation how can i input data here also?") */}
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
                  Target: 10 sessions (NetSuite system training & IT basic troubleshooting). Log training sessions below!
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowAddOrientationModal(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-xs font-bold text-white shadow-2xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Log Orientation Session</span>
                </button>
                <span className="px-2.5 py-1 rounded text-xs font-bold bg-purple-100 text-purple-800">
                  YTD: {orientationTotals.combinedConducted} / 10 Target
                </span>
              </div>
            </div>

            {/* Monthly Summary Table */}
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
                          className="w-10 text-center bg-purple-50/50 border border-purple-200 rounded px-1 py-0.5 font-bold text-purple-900 focus:bg-white focus:outline-none"
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
                        <input
                          type="number"
                          min="0"
                          value={kpiData.orientations[m]?.scheduledNetsuite ?? 0}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            setKpiData(prev => ({
                              ...prev,
                              orientations: {
                                ...prev.orientations,
                                [m]: { ...prev.orientations[m], scheduledNetsuite: val }
                              }
                            }));
                          }}
                          className="w-10 text-center bg-slate-50 border border-slate-200 rounded px-1 py-0.5 text-slate-600 focus:bg-white focus:outline-none"
                        />
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
                          className="w-10 text-center bg-blue-50/50 border border-blue-200 rounded px-1 py-0.5 font-bold text-blue-900 focus:bg-white focus:outline-none"
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
                        <input
                          type="number"
                          min="0"
                          value={kpiData.orientations[m]?.scheduledBasic ?? 0}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            setKpiData(prev => ({
                              ...prev,
                              orientations: {
                                ...prev.orientations,
                                [m]: { ...prev.orientations[m], scheduledBasic: val }
                              }
                            }));
                          }}
                          className="w-10 text-center bg-slate-50 border border-slate-200 rounded px-1 py-0.5 text-slate-600 focus:bg-white focus:outline-none"
                        />
                      </td>
                    ))}
                    <td className="p-2 text-center font-mono font-bold text-slate-700 bg-slate-50">
                      {orientationTotals.totalBasicScheduled}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* List of Detailed Orientation Sessions */}
            <div className="space-y-3 pt-3">
              <h3 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-purple-600" />
                <span>Logged Training Sessions Registry</span>
              </h3>

              <div className="overflow-x-auto border border-slate-200 rounded-xl bg-white">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-100 text-slate-700 text-[11px] font-bold border-b border-slate-200">
                      <th className="p-2.5">Date</th>
                      <th className="p-2.5">Category</th>
                      <th className="p-2.5">Topic / Module</th>
                      <th className="p-2.5">Branch / Dept</th>
                      <th className="p-2.5 text-center">Attendees</th>
                      <th className="p-2.5">Trainer</th>
                      <th className="p-2.5 text-center">Status</th>
                      <th className="p-2.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-[11px]">
                    {(kpiData.orientationSessions || []).length === 0 ? (
                      <tr>
                        <td colSpan={8} className="p-4 text-center text-slate-400">
                          No orientation sessions logged yet. Click &quot;Log Orientation Session&quot; to add one.
                        </td>
                      </tr>
                    ) : (
                      (kpiData.orientationSessions || []).map((session) => (
                        <tr key={session.id} className="hover:bg-slate-50">
                          <td className="p-2.5 font-mono text-slate-600">{session.date}</td>
                          <td className="p-2.5">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                              session.category === 'NetSuite System Training' 
                                ? 'bg-purple-100 text-purple-800' 
                                : 'bg-blue-100 text-blue-800'
                            }`}>
                              {session.category}
                            </span>
                          </td>
                          <td className="p-2.5 font-bold text-slate-900">{session.topic}</td>
                          <td className="p-2.5 text-slate-600">{session.branchOrDept}</td>
                          <td className="p-2.5 text-center font-mono font-bold text-slate-800">{session.attendeesCount}</td>
                          <td className="p-2.5 text-slate-700">{session.conductedBy}</td>
                          <td className="p-2.5 text-center">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              session.status === 'Conducted' 
                                ? 'bg-emerald-100 text-emerald-800' 
                                : 'bg-amber-100 text-amber-800'
                            }`}>
                              {session.status}
                            </span>
                          </td>
                          <td className="p-2.5 text-right">
                            <button
                              onClick={() => deleteOrientationSession(session.id)}
                              className="text-slate-400 hover:text-rose-600 p-1 rounded"
                              title="Delete record"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: NETSUITE CONCERNS WITH SCREENSHOT UPLOAD & PREVIEW */}
      {activeTab === 'netsuite' && (
        <div className="space-y-6">
          <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  KPI 5: Percentage of NetSuite Concerns Resolved on Time with IT (Target: 100%)
                </h2>
                <p className="text-xs text-slate-500">
                  Minor Concern: resolved within 1 day (8h) | Major Concern: resolved within 7 days. Log concerns with screenshots below!
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowAddConcernModal(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-xs font-bold text-white shadow-2xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Log NetSuite Concern + Screenshot</span>
                </button>
                <span className="px-2.5 py-1 rounded text-xs font-bold bg-emerald-100 text-emerald-800">
                  Target: 100% On-Time
                </span>
              </div>
            </div>

            {/* Monthly Summary Table */}
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
                          step="0.1"
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
                          className="w-10 text-center bg-emerald-50/60 border border-emerald-300 rounded px-1 py-0.5 font-bold text-emerald-900 focus:bg-white focus:outline-none"
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
                        <input
                          type="number"
                          min="0"
                          value={kpiData.netsuite[m]?.minorReported ?? 0}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            setKpiData(prev => ({
                              ...prev,
                              netsuite: {
                                ...prev.netsuite,
                                [m]: { ...prev.netsuite[m], minorReported: val }
                              }
                            }));
                          }}
                          className="w-10 text-center bg-slate-50 border border-slate-200 rounded px-1 py-0.5 text-slate-600 focus:bg-white focus:outline-none"
                        />
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
                          step="0.1"
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
                          className="w-10 text-center bg-indigo-50/60 border border-indigo-300 rounded px-1 py-0.5 font-bold text-indigo-900 focus:bg-white focus:outline-none"
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
                        <input
                          type="number"
                          min="0"
                          value={kpiData.netsuite[m]?.majorReported ?? 0}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            setKpiData(prev => ({
                              ...prev,
                              netsuite: {
                                ...prev.netsuite,
                                [m]: { ...prev.netsuite[m], majorReported: val }
                              }
                            }));
                          }}
                          className="w-10 text-center bg-slate-50 border border-slate-200 rounded px-1 py-0.5 text-slate-600 focus:bg-white focus:outline-none"
                        />
                      </td>
                    ))}
                    <td className="p-2 text-center font-mono font-bold text-slate-700 bg-slate-50">
                      {netsuiteTotals.majorRep}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Logged NetSuite Concerns Registry with Screenshot Gallery */}
            <div className="space-y-3 pt-3">
              <h3 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <ImageIcon className="w-3.5 h-3.5 text-emerald-600" />
                <span>NetSuite Concern Tickets & Error Screenshot Audit Log</span>
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(kpiData.netsuiteConcerns || []).length === 0 ? (
                  <div className="col-span-2 p-6 text-center text-slate-400 border border-dashed border-slate-200 rounded-xl">
                    No NetSuite concerns logged yet. Click &quot;Log NetSuite Concern + Screenshot&quot; to register a ticket.
                  </div>
                ) : (
                  (kpiData.netsuiteConcerns || []).map((ticket) => (
                    <div 
                      key={ticket.id} 
                      className="p-4 rounded-xl border border-slate-200 bg-white hover:border-slate-300 transition-all space-y-3 shadow-2xs"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-xs text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                              {ticket.ticketNumber}
                            </span>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              ticket.priority.includes('Minor') 
                                ? 'bg-emerald-100 text-emerald-800' 
                                : 'bg-indigo-100 text-indigo-800'
                            }`}>
                              {ticket.priority}
                            </span>
                          </div>
                          <p className="font-bold text-slate-900 text-xs mt-1.5">{ticket.moduleOrFunction}</p>
                          <p className="text-[11px] text-slate-500">
                            Reported by <strong>{ticket.requester}</strong> ({ticket.departmentOrBranch}) on {ticket.dateReported}
                          </p>
                        </div>

                        <button
                          onClick={() => deleteNetsuiteConcern(ticket.id)}
                          className="text-slate-400 hover:text-rose-600 p-1"
                          title="Delete record"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <p className="text-xs text-slate-700 bg-slate-50 p-2.5 rounded-lg border border-slate-100 leading-relaxed">
                        {ticket.description}
                      </p>

                      {ticket.resolutionNotes && (
                        <div className="text-[11px] text-emerald-800 bg-emerald-50/60 p-2 rounded-lg border border-emerald-100">
                          <span className="font-bold block">Resolution:</span>
                          <span>{ticket.resolutionNotes} ({ticket.daysToResolve} days)</span>
                        </div>
                      )}

                      {/* Screenshot thumbnail if attached */}
                      {ticket.screenshotUrl && (
                        <div className="pt-1">
                          <span className="text-[10px] font-bold text-slate-500 block mb-1">Attached Screenshot / Error Proof:</span>
                          <div 
                            onClick={() => setSelectedScreenshotPreview(ticket.screenshotUrl!)}
                            className="relative group cursor-pointer overflow-hidden rounded-lg border border-slate-200 h-28 bg-slate-100 flex items-center justify-center"
                          >
                            <img 
                              src={ticket.screenshotUrl} 
                              alt="Error Screenshot" 
                              className="w-full h-full object-cover group-hover:scale-105 transition-all"
                            />
                            <div className="absolute inset-0 bg-slate-900/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold gap-1">
                              <ExternalLink className="w-3.5 h-3.5" />
                              <span>Click to Zoom</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 1: ADD ORIENTATION SESSION */}
      {showAddOrientationModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-fadeIn">
          <div className="relative w-full max-w-lg bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 bg-purple-50 border-b border-purple-100">
              <div className="flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-purple-600" />
                <h3 className="text-sm font-bold text-slate-900">Log Orientation & Troubleshooting Session</h3>
              </div>
              <button 
                onClick={() => setShowAddOrientationModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveOrientationSession} className="p-6 space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Orientation Category *</label>
                <select
                  value={newOriCategory}
                  onChange={(e) => setNewOriCategory(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                >
                  <option value="NetSuite System Training">NetSuite System Training</option>
                  <option value="Basic Troubleshooting">Basic Troubleshooting</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Session Topic / Curriculum *</label>
                <input
                  type="text"
                  required
                  value={newOriTopic}
                  onChange={(e) => setNewOriTopic(e.target.value)}
                  placeholder="e.g. NetSuite PO Approval Flow & Attachment Standards"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Date Conducted</label>
                  <input
                    type="date"
                    value={newOriDate}
                    onChange={(e) => setNewOriDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Attendees Count</label>
                  <input
                    type="number"
                    min="1"
                    value={newOriAttendees}
                    onChange={(e) => setNewOriAttendees(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Branch / Department</label>
                  <select
                    value={newOriBranch}
                    onChange={(e) => setNewOriBranch(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                  >
                    {(dropdownOptions.branches || []).map(b => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Conducted By (Trainer)</label>
                  <input
                    type="text"
                    value={newOriTrainer}
                    onChange={(e) => setNewOriTrainer(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Session Notes / Key Takeaways</label>
                <textarea
                  rows={2}
                  value={newOriNotes}
                  onChange={(e) => setNewOriNotes(e.target.value)}
                  placeholder="Covered system prerequisites, common errors, and practical exercises."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddOrientationModal(false)}
                  className="px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-100 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-bold"
                >
                  Save Session
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: ADD NETSUITE CONCERN WITH SCREENSHOT */}
      {showAddConcernModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-fadeIn overflow-y-auto">
          <div className="relative w-full max-w-xl bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden flex flex-col my-6">
            <div className="flex items-center justify-between px-6 py-4 bg-emerald-50 border-b border-emerald-100">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <h3 className="text-sm font-bold text-slate-900">Log NetSuite Concern Ticket & Screenshot</h3>
              </div>
              <button 
                onClick={() => setShowAddConcernModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveNetSuiteConcern} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Ticket Reference No.</label>
                  <input
                    type="text"
                    value={newNsTicket}
                    onChange={(e) => setNewNsTicket(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">SLA Turnaround Priority *</label>
                  <select
                    value={newNsPriority}
                    onChange={(e) => setNewNsPriority(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold"
                  >
                    <option value="Minor (<1 Day)">Minor (&lt;= 1 Day / 8 Hours)</option>
                    <option value="Major (<=7 Days)">Major (&lt;= 7 Days)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Requester Employee *</label>
                  <input
                    type="text"
                    required
                    value={newNsRequester}
                    onChange={(e) => setNewNsRequester(e.target.value)}
                    placeholder="e.g. Maria Santos"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Department</label>
                  <select
                    value={newNsDept}
                    onChange={(e) => setNewNsDept(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                  >
                    {(dropdownOptions.departments || []).map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">NetSuite Module / Function</label>
                <input
                  type="text"
                  value={newNsModule}
                  onChange={(e) => setNewNsModule(e.target.value)}
                  placeholder="e.g. User Login / Two-Factor Lockout or PO Script Error"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Issue Description *</label>
                <textarea
                  rows={2}
                  required
                  value={newNsDescription}
                  onChange={(e) => setNewNsDescription(e.target.value)}
                  placeholder="Detail what happened in NetSuite (e.g. user cannot log in, error dialog prompt)."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Resolution Actions Taken</label>
                <textarea
                  rows={2}
                  value={newNsResolution}
                  onChange={(e) => setNewNsResolution(e.target.value)}
                  placeholder="How was it fixed? e.g. Reset 2FA in NetSuite admin, cleared browser cache."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Days to Resolve</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    value={newNsDays}
                    onChange={(e) => setNewNsDays(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono"
                  />
                </div>
                <div className="flex items-center pt-5">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newNsOnTime}
                      onChange={(e) => setNewNsOnTime(e.target.checked)}
                      className="rounded text-emerald-600 w-4 h-4"
                    />
                    <span className="font-bold text-slate-800">Resolved On-Time within SLA</span>
                  </label>
                </div>
              </div>

              {/* SCREENSHOT UPLOAD */}
              <div className="p-3 bg-slate-50 border border-dashed border-slate-300 rounded-xl space-y-2">
                <label className="font-bold text-slate-700 flex items-center gap-1.5">
                  <ImageIcon className="w-4 h-4 text-emerald-600" />
                  <span>Attach Error Screenshot / Proof:</span>
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleScreenshotUpload}
                  className="w-full text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-emerald-100 file:text-emerald-800 hover:file:bg-emerald-200"
                />
                {newNsScreenshot && (
                  <div className="mt-2">
                    <p className="text-[10px] text-emerald-700 font-semibold mb-1">Screenshot preview:</p>
                    <img 
                      src={newNsScreenshot} 
                      alt="Uploaded preview" 
                      className="max-h-32 rounded-lg border border-slate-200 object-contain bg-white"
                    />
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddConcernModal(false)}
                  className="px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-100 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                >
                  Save NetSuite Concern
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: QUICK LOG DEVICE PMS */}
      {showPMSDeviceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-fadeIn">
          <div className="relative w-full max-w-md bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 bg-amber-50 border-b border-amber-100">
              <div className="flex items-center gap-2">
                <Wrench className="w-5 h-5 text-amber-600" />
                <h3 className="text-sm font-bold text-slate-900">Log Device Planned Maintenance (PMS)</h3>
              </div>
              <button 
                onClick={() => setShowPMSDeviceModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleQuickPMS} className="p-6 space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Select Asset / Computer *</label>
                <select
                  value={pmsAssetId}
                  onChange={(e) => setPmsAssetId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                >
                  {assets.map(a => (
                    <option key={a.id} value={a.id}>
                      [{a.assetCode}] {a.employeeOrDeviceName} ({a.department})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">PMS Cycle Period *</label>
                <select
                  value={pmsHalf}
                  onChange={(e) => setPmsHalf(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold"
                >
                  <option value="1st Half">1st Half Planned Maintenance</option>
                  <option value="2nd Half">2nd Half Planned Maintenance</option>
                  <option value="Both">Both 1st & 2nd Half (Annual Total)</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Inspection Performed By</label>
                <input
                  type="text"
                  value={pmsTechnician}
                  onChange={(e) => setPmsTechnician(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Maintenance Remarks</label>
                <textarea
                  rows={2}
                  value={pmsRemarks}
                  onChange={(e) => setPmsRemarks(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowPMSDeviceModal(false)}
                  className="px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-100 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold"
                >
                  Confirm PMS Complete
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SCREENSHOT FULL ZOOM MODAL */}
      {selectedScreenshotPreview && (
        <div 
          onClick={() => setSelectedScreenshotPreview(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-xs animate-fadeIn cursor-pointer"
        >
          <div className="relative max-w-4xl max-h-[90vh] bg-white p-2 rounded-2xl shadow-2xl">
            <button
              onClick={() => setSelectedScreenshotPreview(null)}
              className="absolute top-4 right-4 p-2 rounded-full bg-slate-900/70 text-white hover:bg-slate-900 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <img 
              src={selectedScreenshotPreview} 
              alt="Zoomed Screenshot" 
              className="max-h-[85vh] w-auto object-contain rounded-xl"
            />
          </div>
        </div>
      )}

      {/* OFFICIAL CRITERIA REFERENCE MODAL */}
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
                  <li>Printer for Repair and Cleaning with Part Replacement.</li>
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
                    Target: 14 Days Above (Supplier / External Service Center)
                  </span>
                </div>
                <ol className="list-decimal list-inside space-y-1 text-[11px] text-slate-600 leading-relaxed">
                  <li>Laptop with parts replacement under external supplier warranty or authorized service center (e.g. motherboard, LCD panel).</li>
                  <li>Structural network cabling and additional data drop point installation.</li>
                </ol>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
