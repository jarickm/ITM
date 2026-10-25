import React, { useState, useMemo } from 'react';
import { 
  Building2, 
  Laptop, 
  Tag, 
  FileText, 
  AlertCircle, 
  CheckCircle, 
  UserCheck, 
  UserX, 
  Repeat, 
  Wrench, 
  ShieldAlert, 
  Scale, 
  Briefcase, 
  MapPin, 
  Plus, 
  Edit3, 
  Trash2, 
  ArrowUp, 
  ArrowDown, 
  RotateCcw, 
  Search, 
  Database, 
  Check, 
  X, 
  Sparkles,
  Sliders,
  Download,
  Upload
} from 'lucide-react';
import { useITM } from '../context/ITMContext';
import { DropdownOptionsConfig } from '../types/itm';

interface CategoryMetadata {
  key: keyof DropdownOptionsConfig;
  label: string;
  singular: string;
  description: string;
  icon: React.ElementType;
  badgeColor: string;
  example: string;
}

const CATEGORY_META: CategoryMetadata[] = [
  {
    key: 'departments',
    label: 'Departments',
    singular: 'Department',
    description: 'Corporate organizational divisions used across assets, tickets, onboarding, offboarding, loans, and liabilities.',
    icon: Building2,
    badgeColor: 'bg-indigo-100 text-indigo-700 border-indigo-200',
    example: 'e.g. IT Infrastructure & Support, Engineering, Operations & Logistics'
  },
  {
    key: 'branches',
    label: 'Company Branches & Regional Sites',
    singular: 'Branch',
    description: 'Corporate branch locations (BASA, SMP, SJDM, Cebu, CDO, Tarlac, Bicol, HQ) for asset tracking and internet uptime KPI monitoring.',
    icon: Building2,
    badgeColor: 'bg-cyan-100 text-cyan-700 border-cyan-200',
    example: 'e.g. BASA Branch, Cebu Branch, CDO Branch, Bicol'
  },
  {
    key: 'positions',
    label: 'Job Titles & Designations',
    singular: 'Position',
    description: 'Corporate staff designations used in onboarding, offboarding, and equipment custody forms.',
    icon: UserCheck,
    badgeColor: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    example: 'e.g. IT Support Specialist, Network Engineer, Developer'
  },
  {
    key: 'assetCategories',
    label: 'Asset Categories',
    singular: 'Asset Category',
    description: 'Hardware, device types, switches, software licenses, and peripherals catalog classification.',
    icon: Laptop,
    badgeColor: 'bg-blue-100 text-blue-700 border-blue-200',
    example: 'e.g. Ultrabook, GPU Server, Smart Display'
  },
  {
    key: 'assetStatuses',
    label: 'Asset Operational Statuses',
    singular: 'Asset Status',
    description: 'Hardware lifecycle states (e.g. In Use, Available in Reserve, Under Maintenance, Retired).',
    icon: Tag,
    badgeColor: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    example: 'e.g. In Transit, Testing / QA, Decommissioned'
  },
  {
    key: 'requestTypes',
    label: 'Ticket / Request Types',
    singular: 'Request Type',
    description: 'Procurement and incident ticketing classification (PR for Purchase Request, IER for Incident/Equipment Request).',
    icon: FileText,
    badgeColor: 'bg-purple-100 text-purple-700 border-purple-200',
    example: 'e.g. PR, IER, RFC, Change Order'
  },
  {
    key: 'requestPriorities',
    label: 'Ticket Severities / Priorities',
    singular: 'Severity / Priority',
    description: 'Urgency and impact classification for SLA turnaround and priority dispatch.',
    icon: AlertCircle,
    badgeColor: 'bg-rose-100 text-rose-700 border-rose-200',
    example: 'e.g. Minor, Major, Critical, Emergency / P1'
  },
  {
    key: 'requestStatuses',
    label: 'Ticket Workflow Statuses',
    singular: 'Ticket Status',
    description: 'Ticketing workflow states from submission through procurement, approval, and SLA resolution.',
    icon: CheckCircle,
    badgeColor: 'bg-amber-100 text-amber-700 border-amber-200',
    example: 'e.g. Open, Under Review, Ordered, Resolved'
  },
  {
    key: 'onboardingStatuses',
    label: 'Onboarding Workflow Statuses',
    singular: 'Onboarding Status',
    description: 'Employee IT provisioning and welcome kit allocation progress states.',
    icon: UserCheck,
    badgeColor: 'bg-teal-100 text-teal-700 border-teal-200',
    example: 'e.g. Pending HR, Staging Hardware, Completed'
  },
  {
    key: 'offboardingStatuses',
    label: 'Offboarding Clearance Statuses',
    singular: 'Offboarding Status',
    description: 'Employee equipment surrender, clearance sign-off, and account deprovisioning states.',
    icon: UserX,
    badgeColor: 'bg-orange-100 text-orange-700 border-orange-200',
    example: 'e.g. Pending Surrender, Equipment Received, Cleared'
  },
  {
    key: 'borrowStatuses',
    label: 'Equipment Loan / Borrow Statuses',
    singular: 'Borrow Status',
    description: 'Temporary equipment checkout tracking states (e.g. Active loan, Overdue, Returned).',
    icon: Repeat,
    badgeColor: 'bg-cyan-100 text-cyan-700 border-cyan-200',
    example: 'e.g. Active Loan, Extended, Returned, Overdue'
  },
  {
    key: 'pmStatuses',
    label: 'Preventive Maintenance Statuses',
    singular: 'PM Status',
    description: 'Hardware maintenance schedule states (e.g. Scheduled, In Progress, Completed, Overdue).',
    icon: Wrench,
    badgeColor: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    example: 'e.g. Scheduled, Cleaned & Inspected, Repaired'
  },
  {
    key: 'liabilityStatuses',
    label: 'Liability Custody Statuses',
    singular: 'Custody Status',
    description: 'Accountability slip legal custody status (e.g. Active Accountability, Surrendered, Transferred).',
    icon: ShieldAlert,
    badgeColor: 'bg-violet-100 text-violet-700 border-violet-200',
    example: 'e.g. Active Accountability, Transferred, Surrendered'
  },
  {
    key: 'unitsOfMeasure',
    label: 'Units of Measure (UOM)',
    singular: 'Unit of Measure',
    description: 'Quantity packaging units for equipment, cables, and liability slips (e.g. Unit, Sets, Pcs, Box).',
    icon: Scale,
    badgeColor: 'bg-slate-100 text-slate-700 border-slate-200',
    example: 'e.g. Unit, Sets, Pcs, Box, Package, Roll'
  },
  {
    key: 'companies',
    label: 'Companies & Subsidiaries',
    singular: 'Company',
    description: 'Legal business entities and branch corporations for asset ownership and custody slips.',
    icon: Briefcase,
    badgeColor: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    example: 'e.g. Apex Global Enterprises, Apex Labs Pte Ltd'
  },
  {
    key: 'locations',
    label: 'Physical Locations & Rooms',
    singular: 'Location / Room',
    description: 'Office sites, building floors, server rooms, and rack locations for hardware positioning.',
    icon: MapPin,
    badgeColor: 'bg-rose-100 text-rose-700 border-rose-200',
    example: 'e.g. HQ Server Room B-12, 3rd Floor Engineering Hub'
  }
];

export const DropdownManager: React.FC = () => {
  const { 
    dropdownOptions, 
    updateDropdownOptions, 
    addDropdownOption, 
    editDropdownOption, 
    deleteDropdownOption, 
    resetDropdownCategoryToDefault,
    isFirebaseConnected
  } = useITM();

  const [activeCategoryKey, setActiveCategoryKey] = useState<keyof DropdownOptionsConfig>('departments');
  const [newValue, setNewValue] = useState('');
  const [filterQuery, setFilterQuery] = useState('');
  const [editingOldValue, setEditingOldValue] = useState<string | null>(null);
  const [editingNewValue, setEditingNewValue] = useState('');
  const [cascadeUpdate, setCascadeUpdate] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusNotice, setStatusNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const activeMeta = useMemo(() => {
    return CATEGORY_META.find(c => c.key === activeCategoryKey) || CATEGORY_META[0];
  }, [activeCategoryKey]);

  const currentOptions = useMemo(() => {
    return dropdownOptions[activeCategoryKey] || [];
  }, [dropdownOptions, activeCategoryKey]);

  const filteredOptions = useMemo(() => {
    const q = filterQuery.trim().toLowerCase();
    if (!q) return currentOptions;
    return currentOptions.filter(opt => opt.toLowerCase().includes(q));
  }, [currentOptions, filterQuery]);

  const notify = (type: 'success' | 'error', message: string) => {
    setStatusNotice({ type, message });
    setTimeout(() => setStatusNotice(null), 4000);
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newValue.trim();
    if (!trimmed) return;

    if (currentOptions.some(item => item.toLowerCase() === trimmed.toLowerCase())) {
      notify('error', `"${trimmed}" already exists in the ${activeMeta.label} database list.`);
      return;
    }

    setIsSubmitting(true);
    try {
      await addDropdownOption(activeCategoryKey, trimmed);
      setNewValue('');
      notify('success', `Added "${trimmed}" to ${activeMeta.label} in database!`);
    } catch (err) {
      console.error(err);
      notify('error', `Failed to save option to database.`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStartEdit = (val: string) => {
    setEditingOldValue(val);
    setEditingNewValue(val);
  };

  const handleSaveEdit = async () => {
    if (!editingOldValue) return;
    const trimmed = editingNewValue.trim();
    if (!trimmed) return;

    if (trimmed === editingOldValue) {
      setEditingOldValue(null);
      return;
    }

    // Check duplicate
    if (currentOptions.some(item => item.toLowerCase() === trimmed.toLowerCase() && item !== editingOldValue)) {
      notify('error', `"${trimmed}" already exists in this category.`);
      return;
    }

    setIsSubmitting(true);
    try {
      await editDropdownOption(activeCategoryKey, editingOldValue, trimmed, cascadeUpdate);
      notify('success', `Renamed "${editingOldValue}" to "${trimmed}" in database${cascadeUpdate ? ' and updated existing records' : ''}!`);
      setEditingOldValue(null);
      setEditingNewValue('');
    } catch (err) {
      console.error(err);
      notify('error', 'Failed to rename category option in database.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (val: string) => {
    if (currentOptions.length <= 1) {
      notify('error', `Cannot delete the last remaining option in ${activeMeta.label}.`);
      return;
    }

    const ok = window.confirm(
      `Delete "${val}" from ${activeMeta.label} database list?\n\n` +
      `This label will no longer appear in new form dropdown menus.`
    );
    if (!ok) return;

    setIsSubmitting(true);
    try {
      await deleteDropdownOption(activeCategoryKey, val);
      notify('success', `Deleted "${val}" from ${activeMeta.label} database!`);
    } catch (err) {
      console.error(err);
      notify('error', 'Failed to delete option from database.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMove = async (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= currentOptions.length) return;

    const reordered = [...currentOptions];
    const [moved] = reordered.splice(index, 1);
    reordered.splice(targetIndex, 0, moved);

    try {
      await updateDropdownOptions({ [activeCategoryKey]: reordered });
    } catch (err) {
      console.error(err);
      notify('error', 'Failed to save reordered list to database.');
    }
  };

  const handleResetDefaults = async () => {
    const ok = window.confirm(
      `Reset "${activeMeta.label}" back to factory default labels?\n\n` +
      `Any custom items you added to this category will be reset.`
    );
    if (!ok) return;

    setIsSubmitting(true);
    try {
      await resetDropdownCategoryToDefault(activeCategoryKey);
      notify('success', `Reset ${activeMeta.label} to standard factory defaults.`);
    } catch (err) {
      console.error(err);
      notify('error', 'Failed to reset category.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleExportJSON = () => {
    const blob = new Blob([JSON.stringify(dropdownOptions, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `itm_dropdown_categories_${new Date().toISOString().substring(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = JSON.parse(text);
        if (typeof parsed !== 'object' || !parsed.departments) {
          throw new Error('Invalid format');
        }
        await updateDropdownOptions(parsed);
        notify('success', 'Imported and synchronized all dropdown categories to database!');
      } catch (err) {
        notify('error', 'Failed to parse JSON taxonomy file. Please verify file format.');
      }
    };
    reader.readAsText(file);
  };

  const IconComponent = activeMeta.icon;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-indigo-900 via-slate-900 to-indigo-950 text-white shadow-md border border-indigo-800/40 relative overflow-hidden">
        <div className="absolute right-0 top-0 -mt-8 -mr-8 w-48 h-48 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-indigo-600/50 text-indigo-200 border border-indigo-400/30">
                <Sliders className="w-4 h-4" />
              </span>
              <span className="text-[10px] font-bold tracking-widest uppercase text-indigo-300">
                Master Database Taxonomy
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                {isFirebaseConnected ? 'Cloud Sync Active' : 'Local + Database'}
              </span>
            </div>
            <h1 className="text-xl font-bold text-white mt-1">
              Dropdown Categories & Labels Master Manager
            </h1>
            <p className="text-xs text-indigo-200/80 mt-0.5 max-w-2xl leading-relaxed">
              Every dropdown in the system (Departments, Categories, Operational Statuses, Ticketing Severities, UOM, Companies, and Physical Rooms) is backed by the database. Edit, rename, reorder, or add custom labels here with automatic cascade updates across all existing records.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleExportJSON}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-semibold backdrop-blur-sm border border-white/20 transition-all active:scale-95"
              title="Download backup of all custom category options"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Taxonomy</span>
            </button>
            <label className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold cursor-pointer shadow-xs transition-all active:scale-95">
              <Upload className="w-3.5 h-3.5" />
              <span>Import Taxonomy</span>
              <input type="file" accept=".json" onChange={handleImportJSON} className="hidden" />
            </label>
          </div>
        </div>
      </div>

      {/* Status Notice Toast */}
      {statusNotice && (
        <div className={`p-3 rounded-xl border text-xs font-semibold flex items-center justify-between gap-2 animate-fadeIn ${
          statusNotice.type === 'success' 
            ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
            : 'bg-rose-50 border-rose-200 text-rose-800'
        }`}>
          <div className="flex items-center gap-2">
            {statusNotice.type === 'success' ? (
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{statusNotice.message}</span>
          </div>
          <button onClick={() => setStatusNotice(null)} className="text-slate-400 hover:text-slate-600">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Category Navigation Tabs */}
        <div className="lg:col-span-4 space-y-2">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 px-1">
            Choose Dropdown Category ({CATEGORY_META.length})
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-2 space-y-1 shadow-xs max-h-[720px] overflow-y-auto">
            {CATEGORY_META.map((cat) => {
              const count = (dropdownOptions[cat.key] || []).length;
              const isActive = activeCategoryKey === cat.key;
              const CatIcon = cat.icon;

              return (
                <button
                  key={cat.key}
                  type="button"
                  onClick={() => {
                    setActiveCategoryKey(cat.key);
                    setFilterQuery('');
                    setEditingOldValue(null);
                  }}
                  className={`w-full text-left p-3 rounded-xl transition-all flex items-center justify-between gap-2.5 ${
                    isActive 
                      ? 'bg-indigo-600 text-white shadow-sm font-semibold' 
                      : 'hover:bg-slate-100 text-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className={`p-1.5 rounded-lg shrink-0 ${
                      isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                    }`}>
                      <CatIcon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs truncate">{cat.label}</div>
                      <div className={`text-[10px] truncate ${isActive ? 'text-indigo-200' : 'text-slate-400'}`}>
                        {cat.singular}
                      </div>
                    </div>
                  </div>

                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold shrink-0 ${
                    isActive 
                      ? 'bg-white/25 text-white' 
                      : 'bg-slate-100 text-slate-600'
                  }`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Column: Values Management Workspace */}
        <div className="lg:col-span-8 space-y-5">
          {/* Active Category Card */}
          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-5">
            {/* Header info */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
              <div className="flex items-start gap-3">
                <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-200">
                  <IconComponent className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-sm font-bold text-slate-900">
                      {activeMeta.label}
                    </h2>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                      {currentOptions.length} labels in database
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {activeMeta.description}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleResetDefaults}
                disabled={isSubmitting}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-semibold transition-colors shrink-0"
                title="Restore default initial values for this category"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Defaults</span>
              </button>
            </div>

            {/* Quick Add Form */}
            <form onSubmit={handleAdd} className="space-y-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600 flex items-center justify-between">
                <span>Add New {activeMeta.singular} Value to Database:</span>
                <span className="text-[10px] text-slate-400 font-normal">Press Enter to save</span>
              </label>

              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Database className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-indigo-500" />
                  <input
                    type="text"
                    value={newValue}
                    onChange={(e) => setNewValue(e.target.value)}
                    placeholder={activeMeta.example}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:bg-white transition-colors"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting || !newValue.trim()}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs disabled:opacity-50 transition-all shrink-0 active:scale-95"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Label</span>
                </button>
              </div>
            </form>

            {/* Search and count filter */}
            <div className="flex items-center justify-between gap-3 pt-2">
              <div className="relative flex-1 max-w-xs">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                <input
                  type="text"
                  value={filterQuery}
                  onChange={(e) => setFilterQuery(e.target.value)}
                  placeholder={`Filter ${activeMeta.label.toLowerCase()}...`}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:bg-white"
                />
              </div>

              <div className="text-[11px] text-slate-500 font-mono">
                Showing {filteredOptions.length} of {currentOptions.length} entries
              </div>
            </div>

            {/* List of Options */}
            <div className="rounded-xl border border-slate-200 divide-y divide-slate-100 overflow-hidden max-h-[380px] overflow-y-auto">
              {filteredOptions.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400">
                  No matching {activeMeta.label.toLowerCase()} found.
                </div>
              ) : (
                filteredOptions.map((opt, idx) => {
                  const originalIndex = currentOptions.indexOf(opt);
                  const isEditing = editingOldValue === opt;

                  return (
                    <div 
                      key={opt}
                      className={`p-2.5 flex items-center justify-between gap-3 transition-colors ${
                        isEditing ? 'bg-indigo-50/80 border-indigo-200' : 'hover:bg-slate-50'
                      }`}
                    >
                      {/* Left: Reorder Controls & Label */}
                      <div className="flex items-center gap-2.5 flex-1 min-w-0">
                        {/* Up / Down reorder arrows */}
                        <div className="flex flex-col gap-0.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleMove(originalIndex, 'up')}
                            disabled={originalIndex === 0}
                            className="p-0.5 text-slate-400 hover:text-indigo-600 disabled:opacity-20 hover:bg-slate-200 rounded transition-colors"
                            title="Move up in dropdown order"
                          >
                            <ArrowUp className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleMove(originalIndex, 'down')}
                            disabled={originalIndex === currentOptions.length - 1}
                            className="p-0.5 text-slate-400 hover:text-indigo-600 disabled:opacity-20 hover:bg-slate-200 rounded transition-colors"
                            title="Move down in dropdown order"
                          >
                            <ArrowDown className="w-3 h-3" />
                          </button>
                        </div>

                        {/* Order badge */}
                        <span className="w-5 text-center text-[10px] font-mono text-slate-400 font-semibold shrink-0">
                          {originalIndex + 1}.
                        </span>

                        {/* Label or Inline Edit Input */}
                        {isEditing ? (
                          <div className="flex-1 space-y-1.5 py-1">
                            <div className="flex items-center gap-2">
                              <input
                                type="text"
                                autoFocus
                                value={editingNewValue}
                                onChange={(e) => setEditingNewValue(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    e.preventDefault();
                                    handleSaveEdit();
                                  } else if (e.key === 'Escape') {
                                    setEditingOldValue(null);
                                  }
                                }}
                                className="flex-1 bg-white border border-indigo-300 rounded-lg px-2.5 py-1 text-xs text-slate-900 font-medium focus:outline-none focus:ring-1 focus:ring-indigo-500"
                              />
                              <button
                                type="button"
                                onClick={handleSaveEdit}
                                disabled={isSubmitting || !editingNewValue.trim()}
                                className="flex items-center gap-1 px-3 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs"
                              >
                                <Check className="w-3 h-3" />
                                <span>Save</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => setEditingOldValue(null)}
                                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>

                            <label className="flex items-center gap-1.5 text-[10px] text-slate-600 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={cascadeUpdate}
                                onChange={(e) => setCascadeUpdate(e.target.checked)}
                                className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-3 h-3"
                              />
                              <span>Automatically update all existing database records using &quot;{opt}&quot;</span>
                            </label>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 truncate">
                            <span className="text-xs font-medium text-slate-900 truncate">
                              {opt}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Right: Actions */}
                      {!isEditing && (
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleStartEdit(opt)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                            title={`Rename "${opt}" in database`}
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(opt)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                            title={`Delete "${opt}" from database`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* Live Interactive Dropdown Preview */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Live Form Preview: How it appears to users</span>
                </span>
                <span className="text-[10px] text-slate-400 font-mono">
                  {currentOptions.length} Selectable Options
                </span>
              </div>

              <div className="max-w-md">
                <label className="text-[10px] font-semibold uppercase text-slate-500 mb-1 block">
                  {activeMeta.label} Dropdown Field
                </label>
                <select 
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-500 shadow-xs"
                  defaultValue={currentOptions[0] || ''}
                >
                  <option value="">-- Choose {activeMeta.singular} --</option>
                  {currentOptions.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
                <p className="text-[10px] text-slate-400 mt-1">
                  * All changes made in this manager immediately reflect in this preview and in every modal & filter across the app.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
