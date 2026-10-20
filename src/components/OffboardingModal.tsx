import React, { useState } from 'react';
import { X, UserMinus, Save, ShieldCheck } from 'lucide-react';
import { OffboardingRecord, OffboardingStatus } from '../types/itm';
import { useITM } from '../context/ITMContext';
import { CategoryDropdownField } from './CategoryDropdownField';

interface OffboardingModalProps {
  record: OffboardingRecord | null;
  onClose: () => void;
  onSave: (data: Omit<OffboardingRecord, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
}

export const OffboardingModal: React.FC<OffboardingModalProps> = ({ record, onClose, onSave }) => {
  const { settings, dropdownOptions } = useITM();
  const [employeeName, setEmployeeName] = useState(record?.employeeName || '');
  const [department, setDepartment] = useState(record?.department || dropdownOptions.departments[0] || 'Operations');
  const [position, setPosition] = useState(record?.position || '');
  const [separationDate, setSeparationDate] = useState(record?.separationDate || new Date().toISOString().substring(0, 10));
  const [company, setCompany] = useState(record?.company || settings.companyName || dropdownOptions.companies[0] || '');
  const [controlNumber, setControlNumber] = useState(
    record?.controlNumber || `OFF-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`
  );
  const [status, setStatus] = useState<OffboardingStatus>(record?.status || 'Pending Surrender');
  const [pendingAssetsText, setPendingAssetsText] = useState(record?.pendingAssets?.join(', ') || '');
  const [clearedAssetsText, setClearedAssetsText] = useState(record?.clearedAssets?.join(', ') || '');
  const [itClearanceSignOff, setItClearanceSignOff] = useState(record?.itClearanceSignOff || false);
  const [notes, setNotes] = useState(record?.notes || '');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!employeeName || !department || !position || !controlNumber) {
      alert('Please fill all mandatory fields.');
      return;
    }

    setLoading(true);
    try {
      await onSave({
        employeeName,
        department,
        position,
        separationDate,
        company,
        controlNumber,
        status,
        pendingAssets: pendingAssetsText ? pendingAssetsText.split(',').map(s => s.trim()).filter(Boolean) : [],
        clearedAssets: clearedAssetsText ? clearedAssetsText.split(',').map(s => s.trim()).filter(Boolean) : [],
        itClearanceSignOff,
        notes,
      });
      onClose();
    } catch (err) {
      console.error(err);
      alert('Error saving offboarding record');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-xl bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-orange-50 text-orange-600 border border-orange-200">
              <UserMinus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                {record ? 'Edit Offboarding Record' : 'Employee Separation IT Asset Clearance'}
              </h2>
              <p className="text-xs text-slate-500">Track device return verification, data wiping & sign-off</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/50">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-600">
                Employee Name *
              </label>
              <input
                type="text"
                required
                value={employeeName}
                onChange={(e) => setEmployeeName(e.target.value)}
                placeholder="e.g. David Vance"
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-600">
                Control Number *
              </label>
              <input
                type="text"
                required
                value={controlNumber}
                onChange={(e) => setControlNumber(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-orange-700 font-mono font-bold"
              />
            </div>

            <CategoryDropdownField
              label="Department"
              categoryKey="departments"
              value={department}
              onChange={(val) => setDepartment(val)}
              required
            />

            <div className="space-y-1">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-600">
                Position *
              </label>
              <input
                type="text"
                required
                value={position}
                onChange={(e) => setPosition(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-600">
                Separation Date *
              </label>
              <input
                type="date"
                required
                value={separationDate}
                onChange={(e) => setSeparationDate(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900"
              />
            </div>

            <CategoryDropdownField
              label="Company"
              categoryKey="companies"
              value={company}
              onChange={(val) => setCompany(val)}
              required
            />

            <CategoryDropdownField
              label="Clearance Status"
              categoryKey="offboardingStatuses"
              value={status}
              onChange={(val) => {
                setStatus(val as OffboardingStatus);
                if (val === 'Cleared') setItClearanceSignOff(true);
              }}
              required
              className="sm:col-span-2"
            />
          </div>

          <div className="space-y-3 pt-2 border-t border-slate-200">
            <div className="space-y-1">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-600">
                Pending Assets to Return (Comma-separated codes)
              </label>
              <input
                type="text"
                value={pendingAssetsText}
                onChange={(e) => setPendingAssetsText(e.target.value)}
                placeholder="e.g. APX-NB-2023-014, APX-MOB-2023-008"
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 font-mono"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-600">
                Cleared & Inspected Assets (Comma-separated codes)
              </label>
              <input
                type="text"
                value={clearedAssetsText}
                onChange={(e) => setClearedAssetsText(e.target.value)}
                placeholder="e.g. APX-NB-2022-077, APX-BAR-2022-003"
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-emerald-700 font-mono font-medium"
              />
            </div>

            <div className="p-3 rounded-xl bg-emerald-50/60 border border-emerald-200 flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={itClearanceSignOff}
                  onChange={(e) => setItClearanceSignOff(e.target.checked)}
                  className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                />
                <span className="text-xs font-bold text-emerald-800 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  Official IT Department Clearance Certificate Signed
                </span>
              </label>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-600">
              Clearance Remarks
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Data wiping confirmation, accessories condition, password de-provisioning..."
              className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-5 py-2 rounded-lg bg-orange-600 hover:bg-orange-700 text-xs font-semibold text-white shadow-xs"
            >
              <Save className="w-4 h-4" />
              <span>{loading ? 'Saving...' : 'Save Offboarding'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
