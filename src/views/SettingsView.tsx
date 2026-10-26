import React, { useState } from 'react';
import { 
  Settings, 
  Database, 
  Download, 
  Upload, 
  Bell, 
  ShieldCheck, 
  Save, 
  CheckCircle2, 
  Layers, 
  RefreshCw,
  Trash2,
  AlertTriangle,
  Sliders,
  Cloud
} from 'lucide-react';
import { useITM } from '../context/ITMContext';
import { DropdownManager } from '../components/DropdownManager';

export type SettingsSubTab = 'dropdowns' | 'general' | 'thresholds' | 'database' | 'rbac';

interface SettingsViewProps {
  initialTab?: SettingsSubTab;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ initialTab = 'dropdowns' }) => {
  const { 
    settings, 
    updateSettings, 
    createBackupSnapshot, 
    restoreBackupSnapshot,
    seedInitialDataToFirebase, 
    clearAllData,
    clearAssetsOnly,
    isFirebaseConnected,
    cloudDatabaseId
  } = useITM();

  const [activeSubTab, setActiveSubTab] = useState<SettingsSubTab>(initialTab);
  const [companyName, setCompanyName] = useState(settings.companyName);
  const [alertEmail, setAlertEmail] = useState(settings.alertEmail);
  const [emailAlertsEnabled, setEmailAlertsEnabled] = useState(settings.emailAlertsEnabled);
  const [adDomain, setAdDomain] = useState(settings.adDomain);
  const [thresholds, setThresholds] = useState<Record<string, number>>(settings.lowStockThresholds || {});
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [restoreError, setRestoreError] = useState<string | null>(null);
  const [seeding, setSeeding] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [clearNotice, setClearNotice] = useState<string | null>(null);

  const handleThresholdChange = (category: string, value: number) => {
    setThresholds(prev => ({
      ...prev,
      [category]: Math.max(0, value),
    }));
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateSettings({
      companyName,
      alertEmail,
      emailAlertsEnabled,
      adDomain,
      lowStockThresholds: thresholds,
    });
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        setRestoreError(null);
        const text = event.target?.result as string;
        await restoreBackupSnapshot(text);
        alert('Database snapshot restored successfully!');
      } catch (err) {
        setRestoreError('Failed to parse and restore database backup snapshot.');
      }
    };
    reader.readAsText(file);
  };

  const handleSeed = async () => {
    setSeeding(true);
    await seedInitialDataToFirebase();
    setSeeding(false);
    setClearNotice('Enterprise sample dataset synchronized to Firebase Firestore!');
    setTimeout(() => setClearNotice(null), 5000);
  };

  const handleClearAll = async () => {
    const ok = window.confirm(
      '⚠️ ARE YOU SURE YOU WANT TO CLEAR ALL SYSTEM DATA?\n\n' +
      'This will permanently delete all:\n' +
      '• Assets & Hardware Inventory\n' +
      '• Employee Onboardings & Offboardings\n' +
      '• PR & IER Procurement Requests\n' +
      '• Equipment Borrowing Loans\n' +
      '• Preventive Maintenance Logs\n' +
      '• Liability & Accountability Slips\n' +
      '• Activity Audit Logs\n\n' +
      'Both Firebase Firestore and local memory will be wiped so you can add fresh records from scratch.\n\n' +
      'Click OK to proceed.'
    );
    if (!ok) return;

    setClearing(true);
    await clearAllData();
    setClearing(false);
    setClearNotice('All system records cleared. You can now start adding your organization\'s live data.');
    setTimeout(() => setClearNotice(null), 6000);
  };

  const handleClearAssets = async () => {
    const ok = window.confirm(
      'Clear Asset Inventory Only?\n\n' +
      'This deletes all records in the hardware asset catalog while preserving user accounts, settings, and other categories.\n\n' +
      'Click OK to proceed.'
    );
    if (!ok) return;

    setClearing(true);
    await clearAssetsOnly();
    setClearing(false);
    setClearNotice('All asset catalog items cleared. The inventory is now ready for new records.');
    setTimeout(() => setClearNotice(null), 6000);
  };

  return (
    <div className="space-y-6 max-w-6xl animate-fadeIn pb-12">
      {/* View Header */}
      <div className="pb-3 border-b border-slate-200">
        <h1 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
          <span className="p-1.5 rounded-lg bg-slate-100 text-slate-700 border border-slate-200">
            <Settings className="w-5 h-5" />
          </span>
          System Settings & Master Data Management
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Manage dropdown taxonomy, customize department lists and operational categories, configure automated stock alerts, and oversee cloud backups.
        </p>
      </div>

      {/* Sub-tab Navigation */}
      <div className="flex flex-wrap items-center gap-2 p-1.5 rounded-xl bg-slate-200/70 border border-slate-300/80">
        <button
          type="button"
          onClick={() => setActiveSubTab('dropdowns')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all ${
            activeSubTab === 'dropdowns'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-700 hover:text-slate-900 hover:bg-slate-200/80'
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>Dropdowns & Categories</span>
          <span className={`px-1.5 py-0.2 rounded text-[10px] font-mono font-bold ${
            activeSubTab === 'dropdowns' ? 'bg-white/20 text-white' : 'bg-indigo-100 text-indigo-700'
          }`}>
            14 Masters
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('general')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${
            activeSubTab === 'general'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-700 hover:text-slate-900 hover:bg-slate-200/80'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Enterprise & Identity</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('thresholds')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${
            activeSubTab === 'thresholds'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-700 hover:text-slate-900 hover:bg-slate-200/80'
          }`}
        >
          <Bell className="w-4 h-4" />
          <span>Stock Alert Triggers</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('database')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${
            activeSubTab === 'database'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-700 hover:text-slate-900 hover:bg-slate-200/80'
          }`}
        >
          <Database className="w-4 h-4" />
          <span>Database & Cloud Backups</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('rbac')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${
            activeSubTab === 'rbac'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-700 hover:text-slate-900 hover:bg-slate-200/80'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>RBAC Matrix</span>
        </button>
      </div>

      {/* Tab 1: Dropdown & Category Master Manager */}
      {activeSubTab === 'dropdowns' && (
        <DropdownManager />
      )}

      {/* Tab 2: Enterprise & Identity Setup */}
      {activeSubTab === 'general' && (
        <form onSubmit={handleSaveSettings} className="space-y-6">
          <div className="p-5 rounded-2xl bg-white border border-slate-200 space-y-4 shadow-xs">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-600" />
              Enterprise Organization & Domain Setup
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                  Organization / Company Legal Name
                </label>
                <input
                  type="text"
                  required
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:bg-white"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                  Active Directory / LDAP SSO Domain
                </label>
                <input
                  type="text"
                  value={adDomain}
                  onChange={(e) => setAdDomain(e.target.value)}
                  placeholder="CORP.DOMAIN.INTERNAL"
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs text-indigo-700 font-mono focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:bg-white"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            {saveSuccess ? (
              <span className="flex items-center gap-1.5 text-emerald-700 text-xs font-semibold">
                <CheckCircle2 className="w-4 h-4" />
                Settings saved and active in database!
              </span>
            ) : <span />}

            <button
              type="submit"
              className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-xs transition-all text-xs"
            >
              <Save className="w-4 h-4" />
              <span>Save Organization Settings</span>
            </button>
          </div>
        </form>
      )}

      {/* Tab 3: Stock Alert Triggers */}
      {activeSubTab === 'thresholds' && (
        <form onSubmit={handleSaveSettings} className="space-y-6">
          <div className="p-5 rounded-2xl bg-white border border-slate-200 space-y-4 shadow-xs">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Bell className="w-4 h-4 text-amber-600" />
                User-Defined Stock Alert Thresholds & Automated Notifications
              </h2>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={emailAlertsEnabled}
                  onChange={(e) => setEmailAlertsEnabled(e.target.checked)}
                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-xs text-slate-700 font-medium">Enable Automated Email Dispatch</span>
              </label>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                Alert Notification Recipient Email
              </label>
              <input
                type="email"
                value={alertEmail}
                onChange={(e) => setAlertEmail(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:bg-white"
              />
            </div>

            <div className="space-y-2 pt-2">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                Low-Stock Reorder Triggers (Minimum Available Reserve Count):
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                {['Laptop', 'Desktop PC', 'Monitor', 'Network & Switch', 'Peripherals / Accessories', 'Server', 'Workstation'].map((cat) => (
                  <div key={cat} className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                    <div className="text-[11px] text-slate-700 font-semibold truncate">{cat}</div>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="0"
                        value={thresholds[cat] ?? 3}
                        onChange={(e) => handleThresholdChange(cat, parseInt(e.target.value) || 0)}
                        className="w-16 bg-white border border-slate-300 rounded px-2 py-1 text-xs text-amber-700 font-mono font-bold"
                      />
                      <span className="text-[10px] text-slate-500">units</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            {saveSuccess ? (
              <span className="flex items-center gap-1.5 text-emerald-700 text-xs font-semibold">
                <CheckCircle2 className="w-4 h-4" />
                Thresholds saved to database!
              </span>
            ) : <span />}

            <button
              type="submit"
              className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-xs transition-all text-xs"
            >
              <Save className="w-4 h-4" />
              <span>Save Stock Thresholds</span>
            </button>
          </div>
        </form>
      )}

      {/* Tab 4: Database & Cloud Backup Management */}
      {activeSubTab === 'database' && (
        <div className="p-5 rounded-2xl bg-white border border-slate-200 space-y-4 shadow-xs">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Database className="w-4 h-4 text-indigo-600" />
            Cloud Database & Automated Backup Engine
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            {/* Snapshot Backup Export */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5">
              <div className="font-bold text-slate-900 flex items-center justify-between">
                <span>Create Database Backup Snapshot</span>
                <span className="text-[10px] text-emerald-700 font-mono font-semibold bg-emerald-50 px-1 rounded">AES-256</span>
              </div>
              <p className="text-slate-600 text-[11px] leading-relaxed">
                Generates a complete, offline JSON snapshot containing all assets, tickets, borrowing records, maintenance logs, and audit histories.
              </p>
              <div className="text-[10px] text-slate-500 font-mono">
                Last backup: {settings.lastBackupDate ? new Date(settings.lastBackupDate).toLocaleString() : 'Never'}
              </div>
              <button
                type="button"
                onClick={createBackupSnapshot}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-xs transition-all text-xs"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download Snapshot Backup (.json)</span>
              </button>
            </div>

            {/* Snapshot Restore */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5">
              <div className="font-bold text-slate-900 flex items-center justify-between">
                <span>Restore Database from Snapshot</span>
                <span className="text-[10px] text-amber-700 font-mono font-semibold bg-amber-50 px-1 rounded">Disaster Recovery</span>
              </div>
              <p className="text-slate-600 text-[11px] leading-relaxed">
                Restore application state from a verified ITM backup snapshot file.
              </p>
              {restoreError && (
                <p className="text-rose-600 text-[10px] font-semibold">{restoreError}</p>
              )}
              <label className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-white hover:bg-slate-100 text-slate-800 font-semibold cursor-pointer border border-slate-300 transition-colors text-xs w-max shadow-xs">
                <Upload className="w-3.5 h-3.5 text-indigo-600" />
                <span>Upload & Restore Snapshot</span>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {/* Cloud Firestore Central Database Card */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-indigo-50/80 via-slate-50 to-emerald-50/50 border border-indigo-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
            <div className="space-y-1">
              <div className="font-bold text-slate-900 flex items-center gap-2">
                <Cloud className="w-4 h-4 text-indigo-600" />
                <span>Authoritative Database: Google Cloud Firestore</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  {isFirebaseConnected ? 'Connected & Live' : 'Connecting...'}
                </span>
              </div>
              <p className="text-slate-600 text-[11px] leading-relaxed">
                Database ID: <code className="font-mono text-indigo-700 bg-white px-1.5 py-0.5 rounded border border-indigo-200">{cloudDatabaseId}</code>
              </p>
              <p className="text-slate-500 text-[11px]">
                Pure cloud operational mode. All asset records, requests, borrowing transactions, PMS diagnostics, NetSuite tickets, and 2026 KPI targets are stored centrally in Google Cloud Firestore.
              </p>
            </div>
            <button
              type="button"
              onClick={handleSeed}
              disabled={seeding}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold transition-all text-xs shrink-0 shadow-xs"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${seeding ? 'animate-spin' : ''}`} />
              <span>{seeding ? 'Syncing...' : 'Reload Enterprise Dataset'}</span>
            </button>
          </div>

          {/* Danger Zone: Clear Data */}
          <div className="p-4 rounded-xl bg-rose-50/40 border border-rose-200 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                <span className="font-bold text-slate-900 text-xs">Database Reset & Data Clearing</span>
              </div>
              <span className="text-[10px] uppercase font-bold text-rose-700 bg-rose-100 px-2 py-0.5 rounded border border-rose-200">
                Data Management
              </span>
            </div>

            <p className="text-[11px] text-slate-600 leading-relaxed">
              Wipe sample records so you can begin entering your company's actual equipment, employee onboardings, and procurement requests from scratch.
            </p>

            {clearNotice && (
              <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{clearNotice}</span>
              </div>
            )}

            <div className="flex flex-wrap items-center gap-3 pt-1">
              <button
                type="button"
                onClick={handleClearAssets}
                disabled={clearing}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-white hover:bg-rose-50 text-rose-700 border border-rose-300 font-semibold text-xs shadow-xs transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear Asset Inventory Only</span>
              </button>

              <button
                type="button"
                onClick={handleClearAll}
                disabled={clearing}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs shadow-xs transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{clearing ? 'Clearing...' : 'Clear All System Records (Wipe Everything)'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tab 5: Multi-Level Role-Based Access Control (RBAC) Matrix */}
      {activeSubTab === 'rbac' && (
        <div className="p-5 rounded-2xl bg-white border border-slate-200 space-y-4 shadow-xs">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            Role-Based Access Control (RBAC) Permissions Matrix
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-600 border-b border-slate-200 text-[10px] font-bold uppercase">
                  <th className="p-2.5">Role</th>
                  <th className="p-2.5 text-center">Asset Catalog</th>
                  <th className="p-2.5 text-center">On/Offboarding</th>
                  <th className="p-2.5 text-center">PR / IER Desk</th>
                  <th className="p-2.5 text-center">PM & Borrowing</th>
                  <th className="p-2.5 text-center">Liability</th>
                  <th className="p-2.5 text-center">Backups & Config</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-[11px]">
                <tr>
                  <td className="p-2.5 font-bold text-indigo-700">Administrator</td>
                  <td className="p-2.5 text-center text-emerald-700 font-semibold">Full (CRUD)</td>
                  <td className="p-2.5 text-center text-emerald-700 font-semibold">Full (CRUD)</td>
                  <td className="p-2.5 text-center text-emerald-700 font-semibold">Full (CRUD)</td>
                  <td className="p-2.5 text-center text-emerald-700 font-semibold">Full (CRUD)</td>
                  <td className="p-2.5 text-center text-emerald-700 font-semibold">Full (CRUD)</td>
                  <td className="p-2.5 text-center text-emerald-700 font-semibold">Full Access</td>
                </tr>
                <tr>
                  <td className="p-2.5 font-bold text-cyan-700">IT Operations Manager</td>
                  <td className="p-2.5 text-center text-emerald-700 font-semibold">Full (CRUD)</td>
                  <td className="p-2.5 text-center text-emerald-700 font-semibold">Full (CRUD)</td>
                  <td className="p-2.5 text-center text-emerald-700 font-semibold">Approve & Edit</td>
                  <td className="p-2.5 text-center text-emerald-700 font-semibold">Full (CRUD)</td>
                  <td className="p-2.5 text-center text-emerald-700 font-semibold">Issue & Authorize</td>
                  <td className="p-2.5 text-center text-slate-500">Export Only</td>
                </tr>
                <tr>
                  <td className="p-2.5 font-bold text-amber-700">IT Support Technician</td>
                  <td className="p-2.5 text-center text-emerald-700 font-semibold">Read & Update</td>
                  <td className="p-2.5 text-center text-slate-500">Read Only</td>
                  <td className="p-2.5 text-center text-emerald-700 font-semibold">Resolve & Action</td>
                  <td className="p-2.5 text-center text-emerald-700 font-semibold">Log PM & Loans</td>
                  <td className="p-2.5 text-center text-slate-500">Read Only</td>
                  <td className="p-2.5 text-center text-rose-600">No Access</td>
                </tr>
                <tr>
                  <td className="p-2.5 font-bold text-slate-600">Internal Auditor</td>
                  <td className="p-2.5 text-center text-slate-600">Read & Export</td>
                  <td className="p-2.5 text-center text-slate-600">Read & Export</td>
                  <td className="p-2.5 text-center text-slate-600">Read & Export</td>
                  <td className="p-2.5 text-center text-slate-600">Read & Export</td>
                  <td className="p-2.5 text-center text-slate-600">Read & Export</td>
                  <td className="p-2.5 text-center text-slate-600">Audit Logs Only</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
