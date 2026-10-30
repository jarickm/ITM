import React, { useState } from 'react';
import { X, UserPlus, Save } from 'lucide-react';
import { OnboardingRecord, OnboardingStatus } from '../types/itm';
import { useITM } from '../context/ITMContext';
import { CategoryDropdownField } from './CategoryDropdownField';

interface OnboardingModalProps {
  record: OnboardingRecord | null;
  onClose: () => void;
  onSave: (data: Omit<OnboardingRecord, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({ record, onClose, onSave }) => {
  const { assets, settings, dropdownOptions } = useITM();
  const [employeeName, setEmployeeName] = useState(record?.employeeName || '');
  const [department, setDepartment] = useState(record?.department || dropdownOptions.departments[0] || 'Engineering');
  const [position, setPosition] = useState(record?.position || '');
  const [startDate, setStartDate] = useState(record?.startDate || new Date().toISOString().substring(0, 10));
  const [company, setCompany] = useState(record?.company || settings.companyName || dropdownOptions.companies[0] || '');
  const [controlNumber, setControlNumber] = useState(
    record?.controlNumber || `ONB-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`
  );
  const [status, setStatus] = useState<OnboardingStatus>(record?.status || 'Pending');
  const [dateOfOnboarding, setDateOfOnboarding] = useState(record?.dateOfOnboarding || new Date().toISOString().substring(0, 10));
  const [selectedAsset, setSelectedAsset] = useState<string>('');
  const [assignedAssets, setAssignedAssets] = useState<string[]>(record?.assignedAssets || []);
  const [notes, setNotes] = useState(record?.notes || '');
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const availableAssets = assets.filter(a => a.status === 'Available');

  const handleAddAsset = () => {
    if (selectedAsset && !assignedAssets.includes(selectedAsset)) {
      setAssignedAssets([...assignedAssets, selectedAsset]);
      setSelectedAsset('');
    }
  };

  const handleRemoveAsset = (code: string) => {
    setAssignedAssets(assignedAssets.filter(c => c !== code));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const emp = employeeName.trim();
    if (!emp) {
      setFormError('Please enter the Employee Name.');
      return;
    }

    const dept = department || dropdownOptions.departments[0] || 'IT';
    const pos = position.trim() || 'Staff';
    const ctrl = controlNumber.trim() || `ONB-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`;

    setLoading(true);
    try {
      await onSave({
        employeeName: emp,
        department: dept,
        position: pos,
        startDate,
        company: company || settings.companyName || 'Corporate',
        controlNumber: ctrl,
        status,
        dateOfOnboarding,
        assignedAssets,
        notes,
      });
      onClose();
    } catch (err: any) {
      console.error(err);
      setFormError(err.message || 'Error saving onboarding record to Supabase');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-xl bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-amber-50 text-amber-600 border border-amber-200">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                {record ? 'Edit Onboarding Record' : 'New Employee Onboarding IT Provisioning'}
              </h2>
              <p className="text-xs text-slate-500">Track equipment issuance and provisioning control number</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        {formError && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-center gap-2 animate-fadeIn">
            <span className="font-semibold">{formError}</span>
          </div>
        )}

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
                placeholder="e.g. Sarah Jenkins"
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
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-amber-700 font-mono font-bold"
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
                placeholder="Senior Engineer / Analyst"
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-600">
                Start Date *
              </label>
              <input
                type="date"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-600">
                Date of Onboarding *
              </label>
              <input
                type="date"
                required
                value={dateOfOnboarding}
                onChange={(e) => setDateOfOnboarding(e.target.value)}
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
              label="Status"
              categoryKey="onboardingStatuses"
              value={status}
              onChange={(val) => setStatus(val as OnboardingStatus)}
              required
            />
          </div>

          {/* Assigned Assets Allocation */}
          <div className="space-y-2 pt-2 border-t border-slate-200">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-600">
              Assign Equipment from Available Pool:
            </label>
            <div className="flex gap-2">
              <select
                value={selectedAsset}
                onChange={(e) => setSelectedAsset(e.target.value)}
                className="flex-1 bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900"
              >
                <option value="">-- Select an Available Asset --</option>
                {availableAssets.map((a) => (
                  <option key={a.id} value={a.assetCode}>
                    {a.assetCode} - {a.employeeOrDeviceName} ({a.category})
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={handleAddAsset}
                className="px-3 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-xs font-semibold text-white"
              >
                Assign
              </button>
            </div>

            {assignedAssets.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-1">
                {assignedAssets.map((code) => (
                  <span
                    key={code}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white border border-slate-300 text-xs text-indigo-700 font-mono shadow-xs"
                  >
                    <span>{code}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveAsset(code)}
                      className="text-slate-400 hover:text-rose-600"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-600">
              Notes & Special Instructions
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Software licenses, VPN setup, special peripheral requests..."
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
              className="flex items-center gap-2 px-5 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-xs font-semibold text-white shadow-xs"
            >
              <Save className="w-4 h-4" />
              <span>{loading ? 'Saving...' : 'Save Onboarding'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
