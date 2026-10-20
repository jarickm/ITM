import React, { useState } from 'react';
import { X, Repeat, Save } from 'lucide-react';
import { BorrowingRecord, BorrowStatus } from '../types/itm';
import { useITM } from '../context/ITMContext';
import { CategoryDropdownField } from './CategoryDropdownField';

interface BorrowModalProps {
  record: BorrowingRecord | null;
  onClose: () => void;
  onSave: (data: Omit<BorrowingRecord, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
}

export const BorrowModal: React.FC<BorrowModalProps> = ({ record, onClose, onSave }) => {
  const { assets, dropdownOptions } = useITM();
  const [borrowerName, setBorrowerName] = useState(record?.borrowerName || '');
  const [department, setDepartment] = useState(record?.department || dropdownOptions.departments[0] || '');
  const [itemCategory, setItemCategory] = useState(record?.itemCategory || dropdownOptions.assetCategories[0] || 'Laptop');
  const [assetCode, setAssetCode] = useState(record?.assetCode || '');
  const [borrowDate, setBorrowDate] = useState(record?.borrowDate || new Date().toISOString().substring(0, 10));
  const [returnDate, setReturnDate] = useState(record?.returnDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().substring(0, 10));
  const [actualReturnDate, setActualReturnDate] = useState(record?.actualReturnDate || '');
  const [status, setStatus] = useState<BorrowStatus>(record?.status || 'Active / Borrowed');
  const [remarks, setRemarks] = useState(record?.remarks || '');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!borrowerName || !department || !itemCategory || !borrowDate || !returnDate) {
      alert('Please fill all mandatory loan tracking fields.');
      return;
    }

    setLoading(true);
    try {
      await onSave({
        borrowerName,
        department,
        itemCategory,
        assetCode: assetCode || undefined,
        borrowDate,
        returnDate,
        actualReturnDate: actualReturnDate || undefined,
        status,
        remarks,
      });
      onClose();
    } catch (err) {
      console.error(err);
      alert('Error saving equipment loan');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/40 backdrop-blur-xs animate-fadeIn">
      <div className="relative w-full max-w-xl bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-blue-50 text-blue-600 border border-blue-200">
              <Repeat className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                {record ? 'Edit Equipment Borrowing Record' : 'Dispatch IT Equipment Loan'}
              </h2>
              <p className="text-xs text-slate-500">Track temporary checkout of laptops, presentation docks & accessories</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-600">
                Borrower Name *
              </label>
              <input
                type="text"
                required
                value={borrowerName}
                onChange={(e) => setBorrowerName(e.target.value)}
                placeholder="e.g. Jessica Wu"
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <CategoryDropdownField
              label="Department"
              categoryKey="departments"
              value={department}
              onChange={(val) => setDepartment(val)}
              required
            />

            <CategoryDropdownField
              label="Item Category"
              categoryKey="assetCategories"
              value={itemCategory}
              onChange={(val) => setItemCategory(val)}
              required
            />

            <div className="space-y-1">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-600">
                Asset Code (Optional)
              </label>
              <input
                type="text"
                value={assetCode}
                onChange={(e) => setAssetCode(e.target.value)}
                placeholder="e.g. APX-NB-2024-045"
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs text-blue-700 font-mono focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-600">
                Borrow Date *
              </label>
              <input
                type="date"
                required
                value={borrowDate}
                onChange={(e) => setBorrowDate(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-600">
                Expected Return Date *
              </label>
              <input
                type="date"
                required
                value={returnDate}
                onChange={(e) => setReturnDate(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <CategoryDropdownField
              label="Status"
              categoryKey="borrowStatuses"
              value={status}
              onChange={(val) => {
                setStatus(val as BorrowStatus);
                if (val === 'Returned' && !actualReturnDate) {
                  setActualReturnDate(new Date().toISOString().substring(0, 10));
                }
              }}
              required
            />

            <div className="space-y-1">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-600">
                Actual Return Date
              </label>
              <input
                type="date"
                value={actualReturnDate}
                onChange={(e) => setActualReturnDate(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-600">
              Remarks & Purpose of Loan
            </label>
            <textarea
              rows={3}
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="Event purpose, conference details, accessories included..."
              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
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
              className="flex items-center gap-2 px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-xs font-semibold text-white shadow-md shadow-blue-600/20 transition-all active:scale-95"
            >
              <Save className="w-4 h-4" />
              <span>{loading ? 'Saving...' : 'Save Borrow Record'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
