import React, { useState, useEffect } from 'react';
import { X, FileText, Save } from 'lucide-react';
import { RequestRecord, RequestType, RequestPriority, RequestStatus } from '../types/itm';

interface RequestModalProps {
  record: RequestRecord | null;
  defaultType?: RequestType;
  onClose: () => void;
  onSave: (data: Omit<RequestRecord, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
}

export const RequestModal: React.FC<RequestModalProps> = ({ 
  record, 
  defaultType = 'PR', 
  onClose, 
  onSave 
}) => {
  const [requestType, setRequestType] = useState<RequestType>(record?.requestType || defaultType);
  const [referenceNo, setReferenceNo] = useState(record?.referenceNo || '');
  const [dateReported, setDateReported] = useState(record?.dateReported || new Date().toISOString().substring(0, 10));
  const [dateCreated, setDateCreated] = useState(record?.dateCreated || new Date().toISOString().substring(0, 10));
  const [employeeOrRequesterName, setEmployeeOrRequesterName] = useState(record?.employeeOrRequesterName || '');
  const [departmentOrBranches, setDepartmentOrBranches] = useState(record?.departmentOrBranches || '');
  const [actionsTakenOrRemarks, setActionsTakenOrRemarks] = useState(record?.actionsTakenOrRemarks || '');
  const [dateResolved, setDateResolved] = useState(record?.dateResolved || '');
  const [days, setDays] = useState<number>(record?.days || 0);
  const [majorOrMinor, setMajorOrMinor] = useState<RequestPriority>(record?.majorOrMinor || 'Minor');
  const [status, setStatus] = useState<RequestStatus>(record?.status || 'Open');
  const [estimatedAmount, setEstimatedAmount] = useState<string>(record?.estimatedAmount ? String(record.estimatedAmount) : '');
  const [assignedTechnician, setAssignedTechnician] = useState(record?.assignedTechnician || '');
  const [loading, setLoading] = useState(false);

  // Auto-generate reference number if creating new
  useEffect(() => {
    if (!record && !referenceNo) {
      const year = new Date().getFullYear();
      const rand = Math.floor(1000 + Math.random() * 9000);
      setReferenceNo(`${requestType}-${year}-${rand}`);
    }
  }, [record, requestType]);

  // Recalculate turnaround days SLA
  useEffect(() => {
    if (dateCreated) {
      const end = dateResolved ? new Date(dateResolved) : new Date();
      const start = new Date(dateCreated);
      const diffTime = Math.max(0, end.getTime() - start.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      setDays(diffDays);
    }
  }, [dateCreated, dateResolved]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!referenceNo || !employeeOrRequesterName || !departmentOrBranches || !actionsTakenOrRemarks) {
      alert('Please fill all mandatory ticket fields.');
      return;
    }

    setLoading(true);
    try {
      await onSave({
        dateReported,
        requestType,
        referenceNo,
        employeeOrRequesterName,
        departmentOrBranches,
        actionsTakenOrRemarks,
        dateCreated,
        dateResolved: dateResolved || '',
        days,
        majorOrMinor,
        status,
        estimatedAmount: estimatedAmount ? parseFloat(estimatedAmount) : undefined,
        assignedTechnician: assignedTechnician || undefined,
      });
      onClose();
    } catch (err) {
      console.error(err);
      alert('Error saving request record');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/40 backdrop-blur-xs animate-fadeIn">
      <div className="relative w-full max-w-2xl bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className={`p-2 rounded-lg ${requestType === 'PR' ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' : 'bg-purple-50 text-purple-600 border border-purple-200'}`}>
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                {record ? `Edit ${record.requestType} Ticket: ${record.referenceNo}` : `New ${requestType} Record`}
              </h2>
              <p className="text-xs text-slate-500">
                {requestType === 'PR' ? 'Purchase Request & Procurement Authorization' : 'Incident / Equipment Request & SLA Resolution'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Request Type */}
            <div className="space-y-1">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-600">
                Request Type *
              </label>
              <select
                value={requestType}
                onChange={(e) => setRequestType(e.target.value as RequestType)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="PR">PR (Purchase Request)</option>
                <option value="IER">IER (Incident / Equipment Request)</option>
              </select>
            </div>

            {/* Reference No */}
            <div className="space-y-1">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-600">
                Reference No. (PR/IER) *
              </label>
              <input
                type="text"
                required
                value={referenceNo}
                onChange={(e) => setReferenceNo(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs text-indigo-700 font-mono font-bold focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            {/* DATE REPORTED */}
            <div className="space-y-1">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-600">
                DATE REPORTED *
              </label>
              <input
                type="date"
                required
                value={dateReported}
                onChange={(e) => setDateReported(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            {/* DATE CREATED IER/PR */}
            <div className="space-y-1">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-600">
                DATE CREATED IER/PR *
              </label>
              <input
                type="date"
                required
                value={dateCreated}
                onChange={(e) => setDateCreated(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            {/* Employee / Requester Name */}
            <div className="space-y-1">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-600">
                Employee / Requester Name *
              </label>
              <input
                type="text"
                required
                value={employeeOrRequesterName}
                onChange={(e) => setEmployeeOrRequesterName(e.target.value)}
                placeholder="e.g. Alex Turner"
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            {/* Department / Branches */}
            <div className="space-y-1">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-600">
                Department / Branches *
              </label>
              <input
                type="text"
                required
                value={departmentOrBranches}
                onChange={(e) => setDepartmentOrBranches(e.target.value)}
                placeholder="e.g. HQ - Finance or Branch Cebu"
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            {/* Major / Minor */}
            <div className="space-y-1">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-600">
                Severity / Classification *
              </label>
              <select
                value={majorOrMinor}
                onChange={(e) => setMajorOrMinor(e.target.value as RequestPriority)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="Minor">Minor (Routine)</option>
                <option value="Major">Major (High Priority)</option>
                <option value="Critical">Critical (Immediate SLA)</option>
              </select>
            </div>

            {/* Status */}
            <div className="space-y-1">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-600">
                Ticket Status *
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as RequestStatus)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="Open">Open</option>
                <option value="In Progress">In Progress</option>
                <option value="Pending Approval">Pending Approval</option>
                <option value="Resolved">Resolved</option>
                <option value="Closed">Closed</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>

            {/* DATE RESOLVED */}
            <div className="space-y-1">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-600">
                DATE RESOLVED
              </label>
              <input
                type="date"
                value={dateResolved}
                onChange={(e) => setDateResolved(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            {/* DAYS (Turnaround Time SLA) */}
            <div className="space-y-1">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-600">
                Turnaround Time (DAYS SLA)
              </label>
              <div className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs text-indigo-700 font-mono font-bold flex items-center justify-between">
                <span>{days} Day(s)</span>
                <span className="text-[10px] text-slate-500 font-normal">Auto-calculated</span>
              </div>
            </div>

            {requestType === 'PR' && (
              <div className="space-y-1 sm:col-span-2">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-600">
                  Estimated Purchase Amount ($)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={estimatedAmount}
                  onChange={(e) => setEstimatedAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            )}
          </div>

          {/* Actions Taken / Remarks */}
          <div className="space-y-1">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-600">
              Actions Taken / Remarks <span className="text-rose-500">*</span>
            </label>
            <textarea
              required
              rows={3}
              value={actionsTakenOrRemarks}
              onChange={(e) => setActionsTakenOrRemarks(e.target.value)}
              placeholder="Detailed investigation findings, hardware swapped, vendor quotes, procurement remarks..."
              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
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
              className="flex items-center gap-2 px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-xs font-semibold text-white shadow-md shadow-indigo-600/20 transition-all active:scale-95"
            >
              <Save className="w-4 h-4" />
              <span>{loading ? 'Saving...' : 'Save Request Ticket'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
