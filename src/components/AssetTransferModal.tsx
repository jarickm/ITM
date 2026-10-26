import React, { useState } from 'react';
import { 
  Repeat, 
  ArrowRight, 
  User, 
  Building2, 
  MapPin, 
  Calendar, 
  CheckSquare, 
  Square, 
  Printer, 
  FileCheck, 
  X, 
  Save, 
  AlertCircle,
  Laptop
} from 'lucide-react';
import { useITM } from '../context/ITMContext';
import { Asset, AssetCustodyTransfer } from '../types/itm';

interface AssetTransferModalProps {
  initialAsset?: Asset;
  initialFromEmployee?: string;
  onClose: () => void;
  onSuccess?: () => void;
}

const COMMON_ACCESSORIES = [
  'Power Adapter / Charger',
  'Laptop Bag / Sleeve',
  'USB Optical Mouse',
  'USB-C Multiport Dock / Dongle',
  'Kensington Security Cable Lock',
  'HDMI / DisplayPort Cable',
  'Ethernet Cable (Patch Cord)'
];

export const AssetTransferModal: React.FC<AssetTransferModalProps> = ({
  initialAsset,
  initialFromEmployee,
  onClose,
  onSuccess
}) => {
  const { assets, dropdownOptions, transferAsset, currentUser, settings } = useITM();

  // Selected asset
  const [selectedAssetId, setSelectedAssetId] = useState<string>(initialAsset?.id || (assets[0]?.id || ''));
  const currentSelectedAsset = assets.find(a => a.id === selectedAssetId) || initialAsset;

  // Transfer fields
  const [transferDate, setTransferDate] = useState<string>(new Date().toISOString().substring(0, 10));
  const [fromEmployee, setFromEmployee] = useState<string>(
    initialFromEmployee || currentSelectedAsset?.employeeOrDeviceName || ''
  );
  const [fromDepartment, setFromDepartment] = useState<string>(currentSelectedAsset?.department || '');
  const [fromBranch, setFromBranch] = useState<string>(currentSelectedAsset?.location || '');

  // New Custodian / Destination
  const [toEmployee, setToEmployee] = useState<string>('');
  const [toDepartment, setToDepartment] = useState<string>(dropdownOptions.departments?.[0] || 'IT Infrastructure & Support');
  const [toBranch, setToBranch] = useState<string>(dropdownOptions.branches?.[0] || 'Head Office (Main HQ)');
  const [reason, setReason] = useState<string>('Employee Resigned');
  const [conditionOnTransfer, setConditionOnTransfer] = useState<string>('Good (Inspected & Formatted)');
  const [selectedAccessories, setSelectedAccessories] = useState<string[]>([
    'Power Adapter / Charger',
    'Laptop Bag / Sleeve'
  ]);
  const [transferNotes, setTransferNotes] = useState<string>('');
  const [authorizedBy, setAuthorizedBy] = useState<string>(currentUser.name || 'IT Support Team');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSlipPreview, setShowSlipPreview] = useState(false);

  // Generate unique slip reference
  const [slipNumber] = useState(`TRF-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`);

  // Sync when selected asset changes
  const handleAssetChange = (id: string) => {
    setSelectedAssetId(id);
    const found = assets.find(a => a.id === id);
    if (found) {
      setFromEmployee(found.employeeOrDeviceName);
      setFromDepartment(found.department);
      setFromBranch(found.location || '');
    }
  };

  const toggleAccessory = (item: string) => {
    setSelectedAccessories(prev => 
      prev.includes(item) ? prev.filter(x => x !== item) : [...prev, item]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentSelectedAsset) return;
    if (!toEmployee.trim()) {
      alert('Please enter the name of the new custodian / recipient.');
      return;
    }

    setIsSubmitting(true);
    try {
      const transferRecord: AssetCustodyTransfer = {
        id: currentSelectedAsset.id,
        transferDate,
        fromEmployee: fromEmployee || 'IT Pool / Unassigned',
        fromDepartment: fromDepartment || 'IT Reserve',
        fromBranch,
        toEmployee: toEmployee.trim(),
        toDepartment,
        toBranch,
        reason,
        conditionOnTransfer,
        accessoriesIncluded: selectedAccessories,
        transferNotes,
        authorizedBy,
        turnoverReceiptNumber: slipNumber,
        receivedAcknowledged: true,
      };

      await transferAsset(transferRecord);
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      console.error(err);
      alert('Failed to process device transfer.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePrintSlip = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden flex flex-col my-8 max-h-[92vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-indigo-50/70 border-b border-indigo-100 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-indigo-600 text-white shadow-xs">
              <Repeat className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                IT Device Custody Transfer & Reassignment
              </h3>
              <p className="text-xs text-indigo-700 font-medium">
                Official ownership handover & turnover acknowledgment
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/50 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs text-slate-800">
          {/* Slip Number Banner */}
          <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-slate-50 border border-slate-200 rounded-xl">
            <div className="flex items-center gap-2">
              <FileCheck className="w-4 h-4 text-emerald-600" />
              <span className="font-bold text-slate-700">Turnover Receipt Slip:</span>
              <span className="font-mono font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                {slipNumber}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setShowSlipPreview(!showSlipPreview)}
              className="text-xs font-semibold text-indigo-600 hover:underline flex items-center gap-1"
            >
              <span>{showSlipPreview ? 'Hide Receipt Slip' : 'Preview Turnover Slip'}</span>
            </button>
          </div>

          {/* Printable Turnover Slip Preview */}
          {showSlipPreview && (
            <div className="p-5 border-2 border-dashed border-indigo-200 rounded-xl bg-slate-50/80 space-y-4 print:p-0 print:border-none">
              <div className="text-center pb-3 border-b border-slate-300">
                <h4 className="font-bold text-sm uppercase text-slate-900">{settings.companyName || 'Corporate IT Department'}</h4>
                <p className="text-[11px] text-slate-600 font-medium">Equipment Turnover & Custody Transfer Acknowledgment</p>
                <p className="text-[10px] text-slate-400 font-mono mt-0.5">Control No: {slipNumber} | Date: {transferDate}</p>
              </div>

              <div className="grid grid-cols-2 gap-4 text-[11px]">
                <div className="p-3 bg-white rounded-lg border border-slate-200">
                  <span className="font-bold text-slate-500 uppercase text-[9px] block">Previous Custodian (From):</span>
                  <p className="font-bold text-slate-900 mt-1">{fromEmployee || 'N/A'}</p>
                  <p className="text-slate-600">{fromDepartment} {fromBranch ? `(${fromBranch})` : ''}</p>
                  <p className="text-[10px] text-rose-600 font-semibold mt-1">Reason: {reason}</p>
                </div>

                <div className="p-3 bg-white rounded-lg border border-slate-200">
                  <span className="font-bold text-emerald-600 uppercase text-[9px] block">New Custodian (To):</span>
                  <p className="font-bold text-slate-900 mt-1">{toEmployee || '[Recipient Employee Name]'}</p>
                  <p className="text-slate-600">{toDepartment} {toBranch ? `(${toBranch})` : ''}</p>
                  <p className="text-[10px] text-emerald-700 font-semibold mt-1">Condition: {conditionOnTransfer}</p>
                </div>
              </div>

              <div className="p-3 bg-white rounded-lg border border-slate-200 text-[11px]">
                <span className="font-bold text-slate-500 uppercase text-[9px] block">Assigned Equipment:</span>
                <p className="font-bold text-slate-900 mt-0.5">
                  {currentSelectedAsset?.employeeOrDeviceName} ({currentSelectedAsset?.assetCode})
                </p>
                <p className="text-slate-500 font-mono text-[10px]">SN/Specs: {currentSelectedAsset?.specificationOrSN}</p>
                <div className="mt-2 pt-2 border-t border-slate-100">
                  <span className="text-[10px] font-semibold text-slate-600">Accessories Included:</span>
                  <p className="text-[10px] text-slate-700">{selectedAccessories.join(', ') || 'None'}</p>
                </div>
              </div>

              {/* Signature Lines */}
              <div className="grid grid-cols-3 gap-4 pt-4 text-center text-[10px]">
                <div>
                  <div className="h-8 border-b border-slate-400"></div>
                  <span className="block font-bold text-slate-700 mt-1">Surrendered By</span>
                  <span className="text-slate-400 text-[9px]">{fromEmployee}</span>
                </div>
                <div>
                  <div className="h-8 border-b border-slate-400"></div>
                  <span className="block font-bold text-slate-700 mt-1">Received & Acknowledged</span>
                  <span className="text-slate-400 text-[9px]">{toEmployee || 'New Custodian'}</span>
                </div>
                <div>
                  <div className="h-8 border-b border-slate-400"></div>
                  <span className="block font-bold text-slate-700 mt-1">Authorized IT Officer</span>
                  <span className="text-slate-400 text-[9px]">{authorizedBy}</span>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={handlePrintSlip}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                >
                  <Printer className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Print Turnover Slip</span>
                </button>
              </div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* 1. Device Selection */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Laptop className="w-4 h-4 text-indigo-600" />
                <span>Select Device / Asset to Transfer:</span>
              </label>
              <select
                value={selectedAssetId}
                onChange={(e) => handleAssetChange(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium focus:bg-white focus:border-indigo-600 focus:outline-none"
              >
                {assets.map(a => (
                  <option key={a.id} value={a.id}>
                    [{a.assetCode}] {a.employeeOrDeviceName} — Currently with {a.employeeOrDeviceName.split(' ')[0]} ({a.department})
                  </option>
                ))}
              </select>
              {currentSelectedAsset && (
                <div className="mt-1 p-2 bg-slate-50 rounded-lg text-[11px] text-slate-600 flex items-center justify-between">
                  <span>Category: <strong>{currentSelectedAsset.category}</strong></span>
                  <span className="font-mono text-slate-500">{currentSelectedAsset.specificationOrSN}</span>
                </div>
              )}
            </div>

            {/* 2. Visual Transfer Flow: FROM -> TO */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 rounded-xl border border-slate-200 bg-slate-50/50">
              {/* FROM (Origin) */}
              <div className="space-y-3 bg-white p-3.5 rounded-xl border border-slate-200">
                <div className="flex items-center gap-2 text-rose-700 font-bold text-xs pb-1 border-b border-slate-100">
                  <User className="w-3.5 h-3.5" />
                  <span>Current Custodian (From):</span>
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-slate-500 uppercase">Employee Name</label>
                  <input
                    type="text"
                    value={fromEmployee}
                    onChange={(e) => setFromEmployee(e.target.value)}
                    placeholder="e.g. John Doe (Resigned)"
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:bg-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-slate-500 uppercase">Department</label>
                  <input
                    type="text"
                    value={fromDepartment}
                    onChange={(e) => setFromDepartment(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 focus:bg-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-slate-500 uppercase">Transfer Reason</label>
                  <select
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 focus:bg-white focus:outline-none"
                  >
                    <option value="Employee Resigned">Employee Resigned (Offboarding Turnover)</option>
                    <option value="Department Transfer">Department Transfer / Relocation</option>
                    <option value="Position Promotion">Position Promotion / Upgrade</option>
                    <option value="Temporary Reallocation">Temporary Reallocation</option>
                    <option value="Return to IT Stock">Return to IT Stock / Vault</option>
                    <option value="Hardware Replacement">Hardware Replacement</option>
                  </select>
                </div>
              </div>

              {/* TO (Destination) */}
              <div className="space-y-3 bg-white p-3.5 rounded-xl border border-emerald-200 ring-1 ring-emerald-500/20">
                <div className="flex items-center gap-2 text-emerald-800 font-bold text-xs pb-1 border-b border-slate-100">
                  <User className="w-3.5 h-3.5 text-emerald-600" />
                  <span>New Custodian / Assignee (To):</span>
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-slate-500 uppercase">New Employee / Recipient Name *</label>
                  <input
                    type="text"
                    required
                    value={toEmployee}
                    onChange={(e) => setToEmployee(e.target.value)}
                    placeholder="e.g. Jane Smith (Replacement Hire)"
                    className="w-full px-2.5 py-1.5 bg-emerald-50/40 border border-emerald-300 rounded-lg text-xs font-bold text-slate-900 focus:bg-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-slate-500 uppercase">Department</label>
                  <select
                    value={toDepartment}
                    onChange={(e) => setToDepartment(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:bg-white focus:outline-none"
                  >
                    {(dropdownOptions.departments || []).map(dept => (
                      <option key={dept} value={dept}>{dept}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-slate-500 uppercase">Branch / Location</label>
                  <select
                    value={toBranch}
                    onChange={(e) => setToBranch(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:bg-white focus:outline-none"
                  >
                    {(dropdownOptions.branches || []).map(branch => (
                      <option key={branch} value={branch}>{branch}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* 3. Condition & Date */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-bold text-slate-700 uppercase block mb-1">
                  Effective Date of Transfer
                </label>
                <div className="relative">
                  <input
                    type="date"
                    value={transferDate}
                    onChange={(e) => setTransferDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-700 uppercase block mb-1">
                  Physical & Operational Condition
                </label>
                <select
                  value={conditionOnTransfer}
                  onChange={(e) => setConditionOnTransfer(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium focus:bg-white focus:outline-none"
                >
                  <option value="Excellent (Cleaned & Formatted)">Excellent (Cleaned & Formatted)</option>
                  <option value="Good (Normal cosmetic wear)">Good (Normal cosmetic wear)</option>
                  <option value="Fair (Minor scratches, fully working)">Fair (Minor scratches, fully working)</option>
                  <option value="Requires PMS / Maintenance">Requires PMS / Maintenance</option>
                  <option value="Defective / For IT Repair Bay">Defective / For IT Repair Bay</option>
                </select>
              </div>
            </div>

            {/* 4. Accessories Checkboxes */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-700 uppercase block">
                Accessories Handed Over with Device:
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {COMMON_ACCESSORIES.map(acc => {
                  const isChecked = selectedAccessories.includes(acc);
                  return (
                    <button
                      type="button"
                      key={acc}
                      onClick={() => toggleAccessory(acc)}
                      className={`flex items-center gap-2 p-2 rounded-lg border text-left text-[11px] transition-all ${
                        isChecked 
                          ? 'border-indigo-400 bg-indigo-50/70 font-semibold text-indigo-900' 
                          : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                      }`}
                    >
                      {isChecked ? (
                        <CheckSquare className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                      ) : (
                        <Square className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      )}
                      <span className="truncate">{acc}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 5. Notes & Sign-off */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-700 uppercase block">
                Turnover Notes / Remarks:
              </label>
              <textarea
                rows={2}
                value={transferNotes}
                onChange={(e) => setTransferNotes(e.target.value)}
                placeholder="e.g. Employee resigned on 2026-10-15. Laptop surrendered to IT, formatted, and assigned to incoming replacement."
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:bg-white focus:outline-none"
              />
            </div>

            {/* Footer Buttons */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
              <span className="text-[11px] text-slate-400 font-medium">
                Authorized Officer: <strong className="text-slate-600">{authorizedBy}</strong>
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !toEmployee.trim()}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-xs font-bold text-white shadow-sm transition-all active:scale-95"
                >
                  <Save className="w-4 h-4" />
                  <span>{isSubmitting ? 'Transferring...' : 'Execute Device Transfer'}</span>
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
