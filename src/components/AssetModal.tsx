import React, { useState, useEffect } from 'react';
import { X, Layers, Save, AlertTriangle, Wrench } from 'lucide-react';
import { Asset, AssetCategory, AssetStatus } from '../types/itm';
import { CategoryDropdownField } from './CategoryDropdownField';
import { useITM } from '../context/ITMContext';

interface AssetModalProps {
  asset: Asset | null;
  onClose: () => void;
  onSave: (assetData: Omit<Asset, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
}

export const AssetModal: React.FC<AssetModalProps> = ({ asset, onClose, onSave }) => {
  const { dropdownOptions } = useITM();
  const [employeeOrDeviceName, setEmployeeOrDeviceName] = useState(asset?.employeeOrDeviceName || '');
  const [category, setCategory] = useState<AssetCategory>(asset?.category || dropdownOptions.assetCategories[0] || 'Laptop');
  const [specificationOrSN, setSpecificationOrSN] = useState(asset?.specificationOrSN || '');
  const [assetCode, setAssetCode] = useState(asset?.assetCode || '');
  const [status, setStatus] = useState<AssetStatus>(asset?.status || 'Available');
  const [department, setDepartment] = useState(asset?.department || dropdownOptions.departments[0] || 'IT Reserve Pool');
  const [purchaseDate, setPurchaseDate] = useState(asset?.purchaseDate || new Date().toISOString().substring(0, 10));
  const [cost, setCost] = useState<string>(asset?.cost ? String(asset.cost) : '');
  const [warrantyExpiry, setWarrantyExpiry] = useState(asset?.warrantyExpiry || '');
  const [location, setLocation] = useState(asset?.location || '');
  const [notes, setNotes] = useState(asset?.notes || '');
  const [isDefective, setIsDefective] = useState(asset?.isDefective || asset?.status === 'Defective');
  const [defectiveDetails, setDefectiveDetails] = useState(asset?.defectiveDetails || '');
  const [repairVendor, setRepairVendor] = useState(asset?.repairVendor || '');
  const [rmaNumber, setRmaNumber] = useState(asset?.rmaNumber || '');
  // PMS fields
  const [pmsCompleted, setPmsCompleted] = useState(asset?.pmsCompleted || false);
  const [pmsDate, setPmsDate] = useState(asset?.pmsDate || new Date().toISOString().substring(0, 10));
  const [pmsHalf, setPmsHalf] = useState<'1st Half' | '2nd Half' | 'Both'>(asset?.pmsHalf || '1st Half');
  const [pmsTechnician, setPmsTechnician] = useState(asset?.pmsTechnician || '');
  const [pmsRemarks, setPmsRemarks] = useState(asset?.pmsRemarks || '');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!asset && !assetCode) {
      const prefix = category === 'Laptop' ? 'APX-NB' :
                     category === 'Desktop PC' ? 'APX-DT' :
                     category === 'Monitor' ? 'APX-MON' :
                     category === 'Server' ? 'APX-SRV' :
                     category === 'Network & Switch' ? 'APX-NET' :
                     category === 'Printer & Scanner' ? 'APX-PRN' :
                     category === 'Mobile Device / Tablet' ? 'APX-MOB' : 'APX-AST';
      const year = new Date().getFullYear();
      const rand = Math.floor(100 + Math.random() * 900);
      setAssetCode(`${prefix}-${year}-${rand}`);
    }
  }, [category, asset]);

  const handleStatusChange = (newStatus: AssetStatus) => {
    setStatus(newStatus);
    if (newStatus === 'Defective') {
      setIsDefective(true);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!employeeOrDeviceName || !assetCode || !specificationOrSN) {
      alert('Please complete all required fields.');
      return;
    }

    setLoading(true);
    try {
      await onSave({
        employeeOrDeviceName,
        category,
        specificationOrSN,
        assetCode,
        status,
        department,
        purchaseDate,
        cost: cost ? parseFloat(cost) : undefined,
        warrantyExpiry: warrantyExpiry || undefined,
        location: location || undefined,
        notes: notes || undefined,
        isDefective: isDefective || status === 'Defective',
        defectiveDetails: isDefective ? defectiveDetails : undefined,
        repairVendor: isDefective ? repairVendor : undefined,
        rmaNumber: isDefective ? rmaNumber : undefined,
        pmsCompleted,
        pmsDate: pmsCompleted ? pmsDate : undefined,
        pmsHalf: pmsCompleted ? pmsHalf : undefined,
        pmsTechnician: pmsCompleted ? pmsTechnician : undefined,
        pmsRemarks: pmsCompleted ? pmsRemarks : undefined,
      });
      onClose();
    } catch (err) {
      console.error('Save error:', err);
      alert('Failed to save asset. Please verify input data.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-2xl bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-200">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                {asset ? 'Edit IT Asset File' : 'Register New IT Asset'}
              </h2>
              <p className="text-xs text-slate-500">
                Asset master catalog entry with specifications, custody & warranty
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/50">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Employee / Device Name */}
            <div className="space-y-1 sm:col-span-2">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-600">
                Employee / Device Name <span className="text-rose-600">*</span>
              </label>
              <input
                type="text"
                required
                value={employeeOrDeviceName}
                onChange={(e) => setEmployeeOrDeviceName(e.target.value)}
                placeholder="e.g. MacBook Pro 16 M3 Max (Dev-Lead) or John Doe - Laptop"
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            {/* Category */}
            <CategoryDropdownField
              label="Category"
              categoryKey="assetCategories"
              value={category}
              onChange={(val) => setCategory(val as AssetCategory)}
              required
            />

            {/* Asset Code */}
            <div className="space-y-1">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-600">
                Asset Code <span className="text-rose-600">*</span>
              </label>
              <input
                type="text"
                required
                value={assetCode}
                onChange={(e) => setAssetCode(e.target.value)}
                placeholder="e.g. APX-NB-2024-001"
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-indigo-700 font-mono font-bold focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            {/* Specification / SN */}
            <div className="space-y-1 sm:col-span-2">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-600">
                Specification / SN <span className="text-rose-600">*</span>
              </label>
              <input
                type="text"
                required
                value={specificationOrSN}
                onChange={(e) => setSpecificationOrSN(e.target.value)}
                placeholder="e.g. Core i7-13700H / 32GB RAM / 1TB SSD / SN: 7H84JK2"
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            {/* Status */}
            <CategoryDropdownField
              label="Status"
              categoryKey="assetStatuses"
              value={status}
              onChange={(val) => handleStatusChange(val as AssetStatus)}
              required
            />

            {/* Department */}
            <CategoryDropdownField
              label="Department"
              categoryKey="departments"
              value={department}
              onChange={(val) => setDepartment(val)}
              required
            />

            {/* Purchase Date */}
            <div className="space-y-1">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-600">
                Purchase Date <span className="text-rose-600">*</span>
              </label>
              <input
                type="date"
                required
                value={purchaseDate}
                onChange={(e) => setPurchaseDate(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            {/* Cost (USD) */}
            <div className="space-y-1">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-600">
                Purchase Cost ($)
              </label>
              <input
                type="number"
                step="0.01"
                value={cost}
                onChange={(e) => setCost(e.target.value)}
                placeholder="0.00"
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            {/* Warranty Expiry */}
            <div className="space-y-1">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-600">
                Warranty Expiry
              </label>
              <input
                type="date"
                value={warrantyExpiry}
                onChange={(e) => setWarrantyExpiry(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            {/* Physical Location */}
            <CategoryDropdownField
              label="Physical Location / Room"
              categoryKey="locations"
              value={location}
              onChange={(val) => setLocation(val)}
              placeholder="-- Select or Add Location --"
            />
          </div>

          {/* Notes */}
          <div className="space-y-1">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-600">
              Operational Notes / Custody Remarks
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Hardware details, assigned accessories, special software configuration..."
              className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          {/* Planned Maintenance (PMS) Alignment Section */}
          <div className="p-4 rounded-xl bg-amber-50/60 border border-amber-200 space-y-3">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={pmsCompleted}
                  onChange={(e) => setPmsCompleted(e.target.checked)}
                  className="rounded border-slate-300 text-amber-600 focus:ring-amber-500"
                />
                <span className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                  <Wrench className="w-3.5 h-3.5 text-amber-600" />
                  Planned Maintenance (PMS) Completed
                </span>
              </label>
              {pmsCompleted && (
                <span className="text-[10px] text-amber-800 font-bold bg-white px-2 py-0.5 rounded border border-amber-200">
                  Counted in 2026 KPI Target (161 Devices)
                </span>
              )}
            </div>

            {pmsCompleted && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-amber-200 text-xs">
                <div>
                  <label className="text-[10px] font-bold text-slate-700 uppercase block mb-1">PMS Half Period</label>
                  <select
                    value={pmsHalf}
                    onChange={(e) => setPmsHalf(e.target.value as any)}
                    className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 font-semibold focus:outline-none"
                  >
                    <option value="1st Half">1st Half Planned</option>
                    <option value="2nd Half">2nd Half Planned</option>
                    <option value="Both">Both 1st & 2nd Half</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-700 uppercase block mb-1">Date Maintained</label>
                  <input
                    type="date"
                    value={pmsDate}
                    onChange={(e) => setPmsDate(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-700 uppercase block mb-1">Inspector / Tech</label>
                  <input
                    type="text"
                    value={pmsTechnician}
                    onChange={(e) => setPmsTechnician(e.target.value)}
                    placeholder="e.g. IT Helpdesk"
                    className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Defective & RMA Section */}
          <div className="p-4 rounded-xl bg-rose-50/60 border border-rose-200 space-y-3">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isDefective}
                  onChange={(e) => {
                    setIsDefective(e.target.checked);
                    if (e.target.checked && status !== 'Defective') {
                      setStatus('Defective');
                    }
                  }}
                  className="rounded border-slate-300 text-rose-600 focus:ring-rose-500"
                />
                <span className="text-xs font-bold text-rose-700 flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  Tag as Defective Hardware / RMA Required
                </span>
              </label>
              {isDefective && (
                <span className="text-[10px] text-rose-700 font-mono font-bold bg-white px-2 py-0.5 rounded border border-rose-200">
                  Visible in Defective Items Desk
                </span>
              )}
            </div>

            {isDefective && (
              <div className="space-y-3 pt-2 border-t border-rose-200">
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-700">
                    Defect Description & Diagnostic Findings
                  </label>
                  <textarea
                    rows={2}
                    value={defectiveDetails}
                    onChange={(e) => setDefectiveDetails(e.target.value)}
                    placeholder="e.g. Motherboard no-POST, swollen battery, cracked LCD panel, horizontal lines..."
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-rose-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-700">
                      RMA Reference Number
                    </label>
                    <input
                      type="text"
                      value={rmaNumber}
                      onChange={(e) => setRmaNumber(e.target.value)}
                      placeholder="e.g. RMA-DELL-992144"
                      className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-rose-700 focus:outline-none focus:ring-1 focus:ring-rose-500 font-mono font-bold"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-700">
                      Repair Vendor / Service Center
                    </label>
                    <input
                      type="text"
                      value={repairVendor}
                      onChange={(e) => setRepairVendor(e.target.value)}
                      placeholder="e.g. Dell ProSupport / Apple Authorized Hub"
                      className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-rose-500"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-xs font-semibold text-white shadow-xs transition-all active:scale-95 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{loading ? 'Saving...' : 'Save Asset Record'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
