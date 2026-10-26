import React, { useState } from 'react';
import { 
  AlertTriangle, 
  Lock, 
  Trash2, 
  X, 
  CheckCircle2, 
  KeyRound,
  ShieldAlert,
  Database
} from 'lucide-react';
import { useITM } from '../context/ITMContext';

interface ClearDataModalProps {
  onClose: () => void;
}

export const ClearDataModal: React.FC<ClearDataModalProps> = ({ onClose }) => {
  const { clearDataWithPassword, settings, currentUser } = useITM();
  const [password, setPassword] = useState('');
  const [clearScope, setClearScope] = useState<'all' | 'assets' | 'requests' | 'borrowings'>('all');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const isViewer = currentUser.role === 'Viewer / Staff';

  const handleExecuteClear = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (isViewer) {
      setErrorMsg('Access denied: Viewer / Staff role cannot purge or clear data. Please switch to Super Admin.');
      return;
    }

    if (!password.trim()) {
      setErrorMsg('Please enter the IT Admin Master Password to confirm.');
      return;
    }

    setIsProcessing(true);
    try {
      const res = await clearDataWithPassword(password, clearScope);
      if (res.success) {
        setSuccessMsg(res.message);
        setTimeout(() => {
          onClose();
        }, 1800);
      } else {
        setErrorMsg(res.message);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'An error occurred during data clearance.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
      <div className="relative w-full max-w-lg bg-white border border-rose-200 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-rose-50 border-b border-rose-100">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-rose-100 text-rose-700">
              <ShieldAlert className="w-5 h-5 text-rose-600" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Clear Data & Reset System</h3>
              <p className="text-xs text-rose-600 font-medium">Protected by IT Admin Master Password</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/50 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleExecuteClear} className="p-6 space-y-5">
          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-medium flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Scope Selector */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 block">Select Data Scope to Clear:</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <label 
                className={`flex items-start gap-2.5 p-3 rounded-xl border cursor-pointer transition-all ${
                  clearScope === 'all' 
                    ? 'border-rose-400 bg-rose-50/60 ring-2 ring-rose-200' 
                    : 'border-slate-200 hover:bg-slate-50'
                }`}
              >
                <input
                  type="radio"
                  name="clearScope"
                  checked={clearScope === 'all'}
                  onChange={() => setClearScope('all')}
                  className="mt-0.5 text-rose-600"
                />
                <div>
                  <span className="font-bold text-slate-900 block">Complete Wipe</span>
                  <span className="text-[11px] text-slate-500">All demo assets, logs, requests, borrowings, & liabilities</span>
                </div>
              </label>

              <label 
                className={`flex items-start gap-2.5 p-3 rounded-xl border cursor-pointer transition-all ${
                  clearScope === 'assets' 
                    ? 'border-rose-400 bg-rose-50/60 ring-2 ring-rose-200' 
                    : 'border-slate-200 hover:bg-slate-50'
                }`}
              >
                <input
                  type="radio"
                  name="clearScope"
                  checked={clearScope === 'assets'}
                  onChange={() => setClearScope('assets')}
                  className="mt-0.5 text-rose-600"
                />
                <div>
                  <span className="font-bold text-slate-900 block">Assets Only</span>
                  <span className="text-[11px] text-slate-500">Wipe hardware inventory so you can input fresh items</span>
                </div>
              </label>

              <label 
                className={`flex items-start gap-2.5 p-3 rounded-xl border cursor-pointer transition-all ${
                  clearScope === 'requests' 
                    ? 'border-rose-400 bg-rose-50/60 ring-2 ring-rose-200' 
                    : 'border-slate-200 hover:bg-slate-50'
                }`}
              >
                <input
                  type="radio"
                  name="clearScope"
                  checked={clearScope === 'requests'}
                  onChange={() => setClearScope('requests')}
                  className="mt-0.5 text-rose-600"
                />
                <div>
                  <span className="font-bold text-slate-900 block">PR & Requests Only</span>
                  <span className="text-[11px] text-slate-500">Clear incident & PR records</span>
                </div>
              </label>

              <label 
                className={`flex items-start gap-2.5 p-3 rounded-xl border cursor-pointer transition-all ${
                  clearScope === 'borrowings' 
                    ? 'border-rose-400 bg-rose-50/60 ring-2 ring-rose-200' 
                    : 'border-slate-200 hover:bg-slate-50'
                }`}
              >
                <input
                  type="radio"
                  name="clearScope"
                  checked={clearScope === 'borrowings'}
                  onChange={() => setClearScope('borrowings')}
                  className="mt-0.5 text-rose-600"
                />
                <div>
                  <span className="font-bold text-slate-900 block">Borrowings Only</span>
                  <span className="text-[11px] text-slate-500">Clear active loan items</span>
                </div>
              </label>
            </div>
          </div>

          {/* Master Password Input */}
          <div className="space-y-1.5 pt-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-rose-600" />
                <span>Enter IT Admin Master Password:</span>
              </label>
              <span className="text-[10px] text-slate-400 font-mono">
                Default: <strong className="text-slate-600">ITAdmin@2026</strong>
              </span>
            </div>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password to authorize deletion"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono focus:bg-white focus:border-rose-600 focus:outline-none transition-all pr-20"
                autoFocus
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-semibold text-slate-500 hover:text-slate-800 px-2 py-1 bg-white border border-slate-200 rounded-md"
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>

          <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-[11px] text-amber-800 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              This action permanently wipes selected records from Cloud Firestore and local storage. Once cleared, you can start inputting your company's live inventory and records.
            </p>
          </div>

          {/* Footer buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isProcessing}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isProcessing || !password}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-xs font-bold text-white shadow-sm transition-all active:scale-95"
            >
              <Trash2 className="w-4 h-4" />
              <span>{isProcessing ? 'Verifying & Clearing...' : 'Authorize & Clear Data'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
