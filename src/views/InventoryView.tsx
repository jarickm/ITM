import React, { useState, useMemo } from 'react';
import { 
  Plus, 
  Search, 
  Download, 
  QrCode, 
  Edit, 
  Trash2, 
  Filter, 
  AlertTriangle, 
  CheckSquare, 
  Square,
  RotateCcw,
  X,
  CheckCircle2,
  Repeat,
  Wrench
} from 'lucide-react';
import { useITM } from '../context/ITMContext';
import { Asset, AssetCategory, AssetStatus } from '../types/itm';

interface InventoryViewProps {
  onOpenNewAsset: () => void;
  onEditAsset: (asset: Asset) => void;
  onPrintBatchQR: (assets: Asset[]) => void;
  onOpenTransfer?: (asset: Asset) => void;
  onOpenClearPasswordModal?: () => void;
}

export const InventoryView: React.FC<InventoryViewProps> = ({ 
  onOpenNewAsset, 
  onEditAsset,
  onPrintBatchQR,
  onOpenTransfer,
  onOpenClearPasswordModal
}) => {
  const { 
    assets, 
    deleteAsset, 
    setSelectedAssetForQR, 
    quickSearchQuery, 
    currentUser,
    clearAllData,
    clearAssetsOnly,
    seedInitialDataToFirebase,
    dropdownOptions
  } = useITM();

  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [departmentFilter, setDepartmentFilter] = useState<string>('All');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [localSearch, setLocalSearch] = useState<string>('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showClearModal, setShowClearModal] = useState(false);
  const [clearStatus, setClearStatus] = useState<string | null>(null);
  const [isClearing, setIsClearing] = useState(false);

  const categories = useMemo(() => [
    'All',
    ...Array.from(new Set([...(dropdownOptions.assetCategories || []), ...assets.map(a => a.category)].filter(Boolean)))
  ], [dropdownOptions.assetCategories, assets]);

  const departments = useMemo(() => [
    'All',
    ...Array.from(new Set([...(dropdownOptions.departments || []), ...assets.map(a => a.department)].filter(Boolean)))
  ], [dropdownOptions.departments, assets]);

  const statuses = useMemo(() => [
    'All',
    ...Array.from(new Set([...(dropdownOptions.assetStatuses || []), ...assets.map(a => a.status)].filter(Boolean)))
  ], [dropdownOptions.assetStatuses, assets]);

  const filteredAssets = useMemo(() => {
    const q = (quickSearchQuery || localSearch).trim().toLowerCase();
    return assets.filter(a => {
      if (categoryFilter !== 'All' && a.category !== categoryFilter) return false;
      if (departmentFilter !== 'All' && a.department !== departmentFilter) return false;
      if (statusFilter !== 'All' && a.status !== statusFilter) return false;
      if (q) {
        const match = 
          a.employeeOrDeviceName.toLowerCase().includes(q) ||
          a.assetCode.toLowerCase().includes(q) ||
          a.specificationOrSN.toLowerCase().includes(q) ||
          a.department.toLowerCase().includes(q) ||
          a.category.toLowerCase().includes(q) ||
          a.status.toLowerCase().includes(q);
        if (!match) return false;
      }
      return true;
    });
  }, [assets, categoryFilter, departmentFilter, statusFilter, quickSearchQuery, localSearch]);

  const handleSelectAll = () => {
    if (selectedIds.length === filteredAssets.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredAssets.map(a => a.id));
    }
  };

  const toggleSelectOne = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleBatchPrint = () => {
    const batch = assets.filter(a => selectedIds.includes(a.id));
    if (batch.length === 0) {
      alert('Please select at least one asset to print QR label tags.');
      return;
    }
    onPrintBatchQR(batch);
  };

  const exportCSV = () => {
    const headers = [
      'Employee / Device Name',
      'Category',
      'Specification/SN',
      'Asset Code',
      'Status',
      'Department',
      'Purchase Date',
      'Cost',
      'Warranty Expiry',
      'Location',
      'Defective',
    ];

    const rows = filteredAssets.map(a => [
      `"${a.employeeOrDeviceName.replace(/"/g, '""')}"`,
      `"${a.category}"`,
      `"${a.specificationOrSN.replace(/"/g, '""')}"`,
      `"${a.assetCode}"`,
      `"${a.status}"`,
      `"${a.department.replace(/"/g, '""')}"`,
      `"${a.purchaseDate}"`,
      a.cost || '',
      a.warrantyExpiry || '',
      `"${(a.location || '').replace(/"/g, '""')}"`,
      a.isDefective ? 'YES' : 'NO',
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `ITM_Asset_Inventory_${new Date().toISOString().substring(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleConfirmClearAll = async () => {
    setIsClearing(true);
    await clearAllData();
    setIsClearing(false);
    setShowClearModal(false);
    setClearStatus('All system records cleared! You can now start adding your company items.');
    setTimeout(() => setClearStatus(null), 5000);
  };

  const handleConfirmClearAssets = async () => {
    setIsClearing(true);
    await clearAssetsOnly();
    setIsClearing(false);
    setShowClearModal(false);
    setClearStatus('Inventory asset catalog cleared! Ready for new records.');
    setTimeout(() => setClearStatus(null), 5000);
  };

  const handleReloadDemoData = async () => {
    setIsClearing(true);
    await seedInitialDataToFirebase();
    setIsClearing(false);
    setShowClearModal(false);
    setClearStatus('Sample demo dataset restored successfully!');
    setTimeout(() => setClearStatus(null), 5000);
  };

  const canEdit = currentUser.role !== 'Auditor';

  return (
    <div className="space-y-4 animate-fadeIn">
      {/* Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            IT Asset Inventory Master Catalog
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Active tracking of company laptops, desktops, servers, monitors, and networking hardware
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {selectedIds.length > 0 && (
            <button
              onClick={handleBatchPrint}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-xs font-semibold text-white shadow-xs transition-all"
            >
              <QrCode className="w-3.5 h-3.5" />
              <span>Print Tags ({selectedIds.length})</span>
            </button>
          )}

          <button
            onClick={exportCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-slate-50 border border-slate-300 text-xs font-semibold text-slate-700 transition-colors shadow-xs"
          >
            <Download className="w-3.5 h-3.5 text-indigo-600" />
            <span>Export CSV</span>
          </button>

          {canEdit && (
            <button
              onClick={() => onOpenClearPasswordModal ? onOpenClearPasswordModal() : setShowClearModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-rose-50 border border-rose-300 text-xs font-semibold text-rose-700 transition-colors shadow-xs"
              title="Clear data protected by Master Admin Password"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear Data</span>
            </button>
          )}

          {canEdit && (
            <button
              onClick={onOpenNewAsset}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-xs font-semibold text-white shadow-xs transition-all active:scale-95"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Register Asset</span>
            </button>
          )}
        </div>
      </div>

      {/* Clear Status Notice Banner */}
      {clearStatus && (
        <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 font-semibold flex items-center justify-between animate-fadeIn shadow-xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{clearStatus}</span>
          </div>
          <button onClick={() => setClearStatus(null)} className="text-emerald-700 hover:text-emerald-900">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Filter Toolbar */}
      <div className="p-3.5 rounded-xl bg-white border border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs shadow-xs">
        <div className="flex flex-wrap items-center gap-2 flex-1 min-w-[280px]">
          {/* Local Search Input */}
          <div className="relative flex-1 min-w-[180px] max-w-xs">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              placeholder="Filter by name, SN, code..."
              className="w-full bg-slate-50 border border-slate-300 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:bg-white"
            />
          </div>

          {/* Category Filter */}
          <div className="flex items-center gap-1">
            <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              {categories.map((c) => (
                <option key={c} value={c}>{c === 'All' ? 'All Categories' : c}</option>
              ))}
            </select>
          </div>

          {/* Department Filter */}
          <select
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
            className="bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            {departments.map((d) => (
              <option key={d} value={d}>{d === 'All' ? 'All Departments' : d}</option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            {statuses.map((s) => (
              <option key={s} value={s}>{s === 'All' ? 'All Statuses' : s}</option>
            ))}
          </select>
        </div>

        <div className="text-[11px] text-slate-500 font-mono">
          Showing <span className="font-bold text-slate-900">{filteredAssets.length}</span> of {assets.length} assets
        </div>
      </div>

      {/* Required Table Columns: Employee / Device Name | Category | Specification/SN | Asset Code | Status | Department | Purchase Date */}
      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100 text-slate-600 border-b border-slate-200 font-bold uppercase tracking-wider text-[10px]">
                <th className="p-3 w-10 text-center">
                  <button
                    onClick={handleSelectAll}
                    className="text-slate-400 hover:text-slate-700 transition-colors"
                    title="Select All"
                  >
                    {selectedIds.length === filteredAssets.length && filteredAssets.length > 0 ? (
                      <CheckSquare className="w-4 h-4 text-indigo-600" />
                    ) : (
                      <Square className="w-4 h-4" />
                    )}
                  </button>
                </th>
                <th className="p-3 min-w-[200px]">Employee / Device Name</th>
                <th className="p-3 min-w-[120px]">Category</th>
                <th className="p-3 min-w-[220px]">Specification / SN</th>
                <th className="p-3 min-w-[140px]">Asset Code</th>
                <th className="p-3 min-w-[120px]">Status</th>
                <th className="p-3 min-w-[130px]">Department</th>
                <th className="p-3 min-w-[110px]">Purchase Date</th>
                <th className="p-3 text-right min-w-[100px]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredAssets.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-slate-400 text-xs">
                    No asset records match the search and filter criteria.
                  </td>
                </tr>
              ) : (
                filteredAssets.map((item) => {
                  const isSelected = selectedIds.includes(item.id);
                  return (
                    <tr 
                      key={item.id}
                      className={`hover:bg-slate-50 transition-colors ${isSelected ? 'bg-indigo-50/50' : ''}`}
                    >
                      <td className="p-3 text-center">
                        <button
                          onClick={() => toggleSelectOne(item.id)}
                          className="text-slate-400 hover:text-slate-700"
                        >
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-indigo-600" />
                          ) : (
                            <Square className="w-4 h-4" />
                          )}
                        </button>
                      </td>

                      {/* Employee / Device Name */}
                      <td className="p-3 font-semibold text-slate-900">
                        <div className="flex items-center gap-1.5">
                          <span>{item.employeeOrDeviceName}</span>
                          {item.isDefective && (
                            <span title="Defective Item" className="text-rose-600">
                              <AlertTriangle className="w-3.5 h-3.5" />
                            </span>
                          )}
                        </div>
                        {item.location && (
                          <div className="text-[10px] text-slate-400 font-normal">Loc: {item.location}</div>
                        )}
                      </td>

                      {/* Category */}
                      <td className="p-3 text-slate-700">
                        <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[11px] font-medium border border-slate-200">
                          {item.category}
                        </span>
                      </td>

                      {/* Specification/SN */}
                      <td className="p-3 text-slate-600 font-mono text-[11px]">
                        <span className="line-clamp-2 leading-relaxed" title={item.specificationOrSN}>
                          {item.specificationOrSN}
                        </span>
                      </td>

                      {/* Asset Code */}
                      <td className="p-3 font-mono font-bold text-indigo-700">
                        {item.assetCode}
                      </td>

                      {/* Status & PMS */}
                      <td className="p-3">
                        <div className="flex flex-col gap-1 items-start">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                            item.status === 'In Use' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                            item.status === 'Available' ? 'bg-cyan-50 text-cyan-700 border-cyan-200' :
                            item.status === 'Defective' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                            item.status === 'Under Maintenance' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                            'bg-slate-100 text-slate-600 border-slate-200'
                          }`}>
                            {item.status}
                          </span>
                          {item.pmsCompleted && (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                              <Wrench className="w-2.5 h-2.5 text-amber-600" />
                              <span>PMS: {item.pmsHalf || 'Done'}</span>
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Department */}
                      <td className="p-3 text-slate-700">
                        {item.department}
                      </td>

                      {/* Purchase Date */}
                      <td className="p-3 text-slate-500 font-mono text-[11px]">
                        {item.purchaseDate}
                      </td>

                      {/* Actions */}
                      <td className="p-3 text-right space-x-1">
                        <button
                          onClick={() => setSelectedAssetForQR(item)}
                          className="p-1.5 rounded hover:bg-slate-100 text-indigo-600 hover:text-indigo-800 transition-colors"
                          title="Print QR Tag"
                        >
                          <QrCode className="w-3.5 h-3.5" />
                        </button>
                        {onOpenTransfer && (
                          <button
                            onClick={() => onOpenTransfer(item)}
                            className="p-1.5 rounded hover:bg-indigo-50 text-indigo-600 hover:text-indigo-800 transition-colors"
                            title="Transfer Device / Reassign Custodian"
                          >
                            <Repeat className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {canEdit && (
                          <button
                            onClick={() => onEditAsset(item)}
                            className="p-1.5 rounded hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors"
                            title="Edit Asset"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {canEdit && (
                          <button
                            onClick={() => {
                              if (confirm(`Are you sure you want to delete asset ${item.assetCode}?`)) {
                                deleteAsset(item.id);
                              }
                            }}
                            className="p-1.5 rounded hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors"
                            title="Delete Asset"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Clear Data Confirmation Modal */}
      {showClearModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fadeIn">
          <div className="relative w-full max-w-lg bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-rose-50/60">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-rose-100 text-rose-700 border border-rose-200">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Clear Data & Start Fresh</h3>
                  <p className="text-xs text-slate-500">Wipe demo records to enter your real company inventory</p>
                </div>
              </div>
              <button
                onClick={() => setShowClearModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/80 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs text-slate-600 bg-white">
              <p className="leading-relaxed">
                Choose how you want to clear the data. Once cleared, you can start inputting your company's actual equipment, employee names, and serial numbers:
              </p>

              <div className="space-y-3">
                <div className="p-3.5 rounded-xl border border-rose-200 bg-rose-50/30 flex items-start justify-between gap-3">
                  <div className="space-y-0.5">
                    <div className="font-bold text-slate-900 flex items-center gap-1.5 text-xs">
                      <span>Clear All System Records (Wipe Everything)</span>
                      <span className="text-[10px] font-semibold uppercase px-1.5 py-0.2 rounded bg-rose-100 text-rose-800">
                        Recommended
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500">
                      Wipes all hardware assets, onboarding, offboarding, PR/IER requests, borrowing, PM, and liability slips.
                    </p>
                  </div>
                  <button
                    onClick={handleConfirmClearAll}
                    disabled={isClearing}
                    className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs shrink-0 shadow-xs transition-colors"
                  >
                    {isClearing ? 'Clearing...' : 'Clear All'}
                  </button>
                </div>

                <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 flex items-start justify-between gap-3">
                  <div className="space-y-0.5">
                    <div className="font-bold text-slate-900 text-xs">
                      Clear Asset Inventory Only
                    </div>
                    <p className="text-[11px] text-slate-500">
                      Clears only the device catalog items, leaving departments and organizational settings intact.
                    </p>
                  </div>
                  <button
                    onClick={handleConfirmClearAssets}
                    disabled={isClearing}
                    className="px-3 py-1.5 rounded-lg bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 font-semibold text-xs shrink-0 shadow-xs transition-colors"
                  >
                    {isClearing ? 'Clearing...' : 'Clear Assets'}
                  </button>
                </div>

                <div className="p-3.5 rounded-xl border border-indigo-100 bg-indigo-50/40 flex items-start justify-between gap-3">
                  <div className="space-y-0.5">
                    <div className="font-bold text-indigo-900 text-xs">
                      Need Demo Data Back Later?
                    </div>
                    <p className="text-[11px] text-indigo-700">
                      You can reload the complete sample dataset anytime for KPI demos and training.
                    </p>
                  </div>
                  <button
                    onClick={handleReloadDemoData}
                    disabled={isClearing}
                    className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shrink-0 shadow-xs transition-colors"
                  >
                    {isClearing ? 'Restoring...' : 'Restore Demo'}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end px-6 py-3.5 border-t border-slate-200 bg-slate-50">
              <button
                onClick={() => setShowClearModal(false)}
                className="px-4 py-2 rounded-lg bg-white border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors shadow-xs"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
