import React, { useState } from 'react';
import { X, Wrench, Save } from 'lucide-react';
import { PreventiveMaintenanceRecord, PMStatus } from '../types/itm';
import { useITM } from '../context/ITMContext';
import { CategoryDropdownField } from './CategoryDropdownField';

interface MaintenanceModalProps {
  record: PreventiveMaintenanceRecord | null;
  onClose: () => void;
  onSave: (data: Omit<PreventiveMaintenanceRecord, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
}

export const MaintenanceModal: React.FC<MaintenanceModalProps> = ({ record, onClose, onSave }) => {
  const { assets, dropdownOptions } = useITM();
  const [description, setDescription] = useState(record?.description || '');
  const [date, setDate] = useState(record?.date || new Date().toISOString().substring(0, 10));
  const [datePurchase, setDatePurchase] = useState(record?.datePurchase || '');
  const [assetCode, setAssetCode] = useState(record?.assetCode || '');
  const [activityWorkDone, setActivityWorkDone] = useState(record?.activityWorkDone || '');
  const [performedBy, setPerformedBy] = useState(record?.performedBy || '');
  const [status, setStatus] = useState<PMStatus>(record?.status || 'Completed');
  const [recommendation, setRecommendation] = useState(record?.recommendation || '');
  const [department, setDepartment] = useState(record?.department || dropdownOptions.departments[0] || '');
  const [nextMaintenanceDate, setNextMaintenanceDate] = useState(record?.nextMaintenanceDate || '');
  const [cost, setCost] = useState<string>(record?.cost ? String(record.cost) : '');
  const [loading, setLoading] = useState(false);

  // Autofill asset details if assetCode matches an existing asset
  const handleAssetCodeChange = (code: string) => {
    setAssetCode(code);
    const found = assets.find(a => a.assetCode.toLowerCase() === code.trim().toLowerCase());
    if (found) {
      if (!department) setDepartment(found.department);
      if (!datePurchase) setDatePurchase(found.purchaseDate);
      if (!description) {
        setDescription(`Routine Preventive Maintenance - ${found.employeeOrDeviceName}`);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description || !date || !datePurchase || !assetCode || !activityWorkDone || !performedBy || !recommendation || !department) {
      alert('Please fill all mandatory Preventive Maintenance fields.');
      return;
    }

    setLoading(true);
    try {
      await onSave({
        description,
        date,
        datePurchase,
        assetCode,
        activityWorkDone,
        performedBy,
        status,
        recommendation,
        department,
        nextMaintenanceDate: nextMaintenanceDate || undefined,
        cost: cost ? parseFloat(cost) : undefined,
      });
      onClose();
    } catch (err) {
      console.error(err);
      alert('Error saving PM record');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/40 backdrop-blur-xs animate-fadeIn">
      <div className="relative w-full max-w-xl bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-amber-50 text-amber-600 border border-amber-200">
              <Wrench className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                {record ? 'Edit Preventive Maintenance Record' : 'Log Preventive Maintenance Activity'}
              </h2>
              <p className="text-xs text-slate-500">Routine hardware cleaning, firmware updates, diagnostics & suggestions</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1 sm:col-span-2">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-600">
                Description *
              </label>
              <input
                type="text"
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g. Server Thermal Inspection & Fan Filter De-dusting"
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-600">
                Asset Code *
              </label>
              <input
                type="text"
                required
                value={assetCode}
                onChange={(e) => handleAssetCodeChange(e.target.value)}
                placeholder="e.g. APX-SRV-2023-002"
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs text-amber-700 font-mono font-bold focus:bg-white focus:outline-none focus:ring-1 focus:ring-amber-500"
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
                PM Activity Date *
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-600">
                Date Purchase *
              </label>
              <input
                type="date"
                required
                value={datePurchase}
                onChange={(e) => setDatePurchase(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-600">
                Performed By *
              </label>
              <input
                type="text"
                required
                value={performedBy}
                onChange={(e) => setPerformedBy(e.target.value)}
                placeholder="Technician or Engineer Name"
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>

            <CategoryDropdownField
              label="PM Status"
              categoryKey="pmStatuses"
              value={status}
              onChange={(val) => setStatus(val as PMStatus)}
              required
            />

            <div className="space-y-1">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-600">
                Next Scheduled PM Date
              </label>
              <input
                type="date"
                value={nextMaintenanceDate}
                onChange={(e) => setNextMaintenanceDate(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-600">
                Maintenance Cost ($)
              </label>
              <input
                type="number"
                step="0.01"
                value={cost}
                onChange={(e) => setCost(e.target.value)}
                placeholder="0.00"
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-600">
              Activity / Work Done *
            </label>
            <textarea
              required
              rows={3}
              value={activityWorkDone}
              onChange={(e) => setActivityWorkDone(e.target.value)}
              placeholder="Cleaned vents, replaced thermal paste, updated BIOS/firmware, diagnostics check..."
              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-600">
              Recommendation *
            </label>
            <textarea
              required
              rows={2}
              value={recommendation}
              onChange={(e) => setRecommendation(e.target.value)}
              placeholder="Recommended actions, component replacement schedule, warranty extension..."
              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
          </div>

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
              className="flex items-center gap-2 px-5 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-xs font-semibold text-white shadow-md shadow-amber-600/20 transition-all active:scale-95"
            >
              <Save className="w-4 h-4" />
              <span>{loading ? 'Saving...' : 'Save PM Record'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
