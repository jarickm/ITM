import React, { useState } from 'react';
import { X, ClipboardCheck, Save, Printer } from 'lucide-react';
import { LiabilityRecord, LiabilityStatus } from '../types/itm';
import { useITM } from '../context/ITMContext';
import { executePrint } from '../utils/printHelper';
import { CategoryDropdownField } from './CategoryDropdownField';

interface LiabilityModalProps {
  record: LiabilityRecord | null;
  onClose: () => void;
  onSave: (data: Omit<LiabilityRecord, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
}

export const LiabilityModal: React.FC<LiabilityModalProps> = ({ record, onClose, onSave }) => {
  const { settings } = useITM();
  const [qty, setQty] = useState<number>(record?.qty || 1);
  const [uom, setUom] = useState(record?.uom || 'Unit');
  const [itemDescription, setItemDescription] = useState(record?.itemDescription || '');
  const [dateIssued, setDateIssued] = useState(record?.dateIssued || new Date().toISOString().substring(0, 10));
  const [employeeName, setEmployeeName] = useState(record?.employeeName || '');
  const [department, setDepartment] = useState(record?.department || '');
  const [assetCode, setAssetCode] = useState(record?.assetCode || '');
  const [company, setCompany] = useState(record?.company || settings.companyName);
  const [status, setStatus] = useState<LiabilityStatus>(record?.status || 'Active Accountability');
  const [remarks, setRemarks] = useState(record?.remarks || '');
  const [signedAcknowledged] = useState(record?.signedAcknowledged || true);
  const [loading, setLoading] = useState(false);
  const [showPrintSlip, setShowPrintSlip] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!employeeName || !itemDescription || !dateIssued || !department || !assetCode || !company) {
      alert('Please fill all mandatory accountability fields.');
      return;
    }

    setLoading(true);
    try {
      await onSave({
        qty,
        uom,
        itemDescription,
        dateIssued,
        employeeName,
        department,
        assetCode,
        company,
        status,
        signedAcknowledged,
        remarks: remarks || undefined,
      });
      onClose();
    } catch (err) {
      console.error(err);
      alert('Error saving liability custody record');
    } finally {
      setLoading(false);
    }
  };

  const handlePrintSlip = () => {
    const slipHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Equipment Accountability Slip - ${employeeName}</title>
        <style>
          @page { size: auto; margin: 15mm; }
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; color: #0f172a; padding: 20px; }
          .receipt { border: 2px solid #000; padding: 24px; border-radius: 8px; }
          .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 12px; margin-bottom: 16px; }
          .title { font-size: 18px; font-weight: 900; text-transform: uppercase; }
          .subtitle { font-size: 12px; font-weight: 600; color: #475569; }
          .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; font-size: 12px; border-bottom: 1px solid #cbd5e1; padding-bottom: 12px; margin-bottom: 16px; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 16px; font-size: 12px; }
          th, td { border: 1px solid #000; padding: 8px; text-align: left; }
          th { background: #f1f5f9; font-weight: bold; }
          .terms { font-size: 10px; font-style: italic; background: #f8fafc; padding: 10px; border: 1px solid #cbd5e1; border-radius: 4px; margin-bottom: 24px; }
          .sigs { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-top: 40px; text-align: center; font-size: 12px; }
          .sig-line { border-top: 1px solid #000; padding-top: 6px; font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="receipt">
          <div class="header">
            <div class="title">${company}</div>
            <div class="subtitle">INFORMATION TECHNOLOGY SERVICES DIVISION</div>
            <h3 style="margin: 8px 0 0 0; font-size: 14px;">EQUIPMENT LIABILITY & ACCOUNTABILITY RECEIPT</h3>
          </div>
          <div class="grid">
            <div><strong>Employee Name:</strong> ${employeeName}</div>
            <div><strong>Date Issued:</strong> ${dateIssued}</div>
            <div><strong>Department:</strong> ${department}</div>
            <div><strong>Asset Code:</strong> ${assetCode}</div>
            <div><strong>Company:</strong> ${company}</div>
            <div><strong>Custody Status:</strong> ${status}</div>
          </div>
          <table>
            <thead>
              <tr>
                <th style="width: 50px; text-align: center;">Qty</th>
                <th style="width: 70px;">UOM</th>
                <th>Item Description & Specifications</th>
                <th style="width: 140px;">Asset Code</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style="text-align: center; font-weight: bold;">${qty}</td>
                <td>${uom}</td>
                <td>${itemDescription}</td>
                <td style="font-family: monospace; font-weight: bold;">${assetCode}</td>
              </tr>
            </tbody>
          </table>
          <div class="terms">
            I hereby acknowledge receipt of the IT equipment and property listed above in good working condition. 
            I assume complete responsibility for its proper use, physical care, and security. I agree to surrender this 
            equipment immediately upon request or upon separation from the company.
          </div>
          <div class="sigs">
            <div>
              <div class="sig-line">${employeeName}</div>
              <div style="font-size: 10px; color: #64748b; text-transform: uppercase;">Received By (Employee Signature)</div>
            </div>
            <div>
              <div class="sig-line">IT Asset Officer / System Admin</div>
              <div style="font-size: 10px; color: #64748b; text-transform: uppercase;">Issued & Authorized By</div>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;
    executePrint(slipHtml);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/40 backdrop-blur-xs animate-fadeIn">
      <div className="relative w-full max-w-2xl bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-teal-50 text-teal-600 border border-teal-200">
              <ClipboardCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                {record ? 'Edit Equipment Accountability Record' : 'Issue Equipment Liability & Custody Form'}
              </h2>
              <p className="text-xs text-slate-500">Formal IT asset acknowledgment slip & custody contract</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body or Printable Slip */}
        {showPrintSlip ? (
          <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50">
            <div className="bg-white text-slate-900 p-6 rounded-xl border border-slate-300 shadow-sm space-y-4 font-sans text-xs">
              {/* Slip Header */}
              <div className="text-center border-b-2 border-slate-900 pb-3">
                <h3 className="text-base font-black uppercase tracking-tight text-slate-950">{company}</h3>
                <p className="text-[11px] font-semibold text-slate-600">INFORMATION TECHNOLOGY SERVICES DIVISION</p>
                <h4 className="text-sm font-bold uppercase mt-1 tracking-wider text-teal-900 bg-teal-50 inline-block px-3 py-0.5 rounded border border-teal-200">
                  EQUIPMENT LIABILITY & ACCOUNTABILITY RECEIPT
                </h4>
              </div>

              {/* Grid Info */}
              <div className="grid grid-cols-2 gap-y-2 border-b border-slate-200 pb-3 text-[11px]">
                <div><span className="font-bold text-slate-700">Employee Name:</span> {employeeName}</div>
                <div><span className="font-bold text-slate-700">Date Issued:</span> {dateIssued}</div>
                <div><span className="font-bold text-slate-700">Department:</span> {department}</div>
                <div><span className="font-bold text-slate-700">Asset Code:</span> <span className="font-mono font-bold text-teal-800">{assetCode}</span></div>
                <div><span className="font-bold text-slate-700">Company:</span> {company}</div>
                <div><span className="font-bold text-slate-700">Custody Status:</span> {status}</div>
              </div>

              {/* Items Table */}
              <table className="w-full border-collapse border border-slate-300 text-[11px]">
                <thead>
                  <tr className="bg-slate-100 text-left font-bold text-slate-800">
                    <th className="border border-slate-300 p-1.5 w-12 text-center">Qty</th>
                    <th className="border border-slate-300 p-1.5 w-16">UOM</th>
                    <th className="border border-slate-300 p-1.5">Item Description & Specifications</th>
                    <th className="border border-slate-300 p-1.5 w-28">Asset Code</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-slate-300 p-2 text-center font-bold">{qty}</td>
                    <td className="border border-slate-300 p-2">{uom}</td>
                    <td className="border border-slate-300 p-2 font-medium">{itemDescription}</td>
                    <td className="border border-slate-300 p-2 font-mono font-bold">{assetCode}</td>
                  </tr>
                </tbody>
              </table>

              {/* Terms */}
              <p className="text-[10px] text-slate-600 leading-relaxed italic bg-slate-50 p-2.5 rounded border border-slate-200">
                I hereby acknowledge receipt of the IT equipment and property listed above in good working condition. 
                I assume complete responsibility for its proper use, physical care, and security. I agree to surrender this 
                equipment immediately upon request or upon separation from the company.
              </p>

              {/* Signatures */}
              <div className="grid grid-cols-2 gap-8 pt-6">
                <div className="border-t border-slate-800 pt-1 text-center">
                  <p className="font-bold text-slate-900">{employeeName}</p>
                  <p className="text-[10px] text-slate-500 uppercase">Received By (Employee Signature)</p>
                </div>
                <div className="border-t border-slate-800 pt-1 text-center">
                  <p className="font-bold text-slate-900">IT Asset Officer / System Admin</p>
                  <p className="text-[10px] text-slate-500 uppercase">Issued & Authorized By</p>
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center pt-2">
              <button
                type="button"
                onClick={() => setShowPrintSlip(false)}
                className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-700 transition-colors"
              >
                Back to Form
              </button>
              <button
                type="button"
                onClick={handlePrintSlip}
                className="flex items-center gap-2 px-5 py-2 rounded-lg bg-teal-600 hover:bg-teal-700 text-xs font-semibold text-white shadow-md shadow-teal-600/20 transition-all active:scale-95"
              >
                <Printer className="w-4 h-4" />
                <span>Print Official Slip</span>
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
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
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-teal-500"
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
                  onChange={(e) => setAssetCode(e.target.value)}
                  placeholder="e.g. APX-NB-2024-001"
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs text-teal-700 font-mono font-bold focus:bg-white focus:outline-none focus:ring-1 focus:ring-teal-500"
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
                label="Company"
                categoryKey="companies"
                value={company}
                onChange={(val) => setCompany(val)}
                required
              />

              <div className="space-y-1">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-600">
                  Quantity *
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={qty}
                  onChange={(e) => setQty(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-teal-500"
                />
              </div>

              <CategoryDropdownField
                label="UOM (Unit of Measure)"
                categoryKey="unitsOfMeasure"
                value={uom}
                onChange={(val) => setUom(val)}
                required
              />

              <div className="space-y-1">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-600">
                  Date Issued *
                </label>
                <input
                  type="date"
                  required
                  value={dateIssued}
                  onChange={(e) => setDateIssued(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-teal-500"
                />
              </div>

              <CategoryDropdownField
                label="Custody Status"
                categoryKey="liabilityStatuses"
                value={status}
                onChange={(val) => setStatus(val as LiabilityStatus)}
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-600">
                Item Description & Detailed Specs *
              </label>
              <textarea
                required
                rows={2}
                value={itemDescription}
                onChange={(e) => setItemDescription(e.target.value)}
                placeholder="e.g. MacBook Pro 16 M3 Max 64GB/1TB Space Black with 140W USB-C Adapter and MagSafe 3 Cable"
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-teal-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-600">
                Remarks / Custody Certificate Ref
              </label>
              <textarea
                rows={2}
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="Digital PKI signature key ID, accessory bag, security lock..."
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-teal-500"
              />
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setShowPrintSlip(true)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-700 text-xs font-semibold border border-teal-200 transition-colors"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Preview Printable Slip</span>
              </button>

              <div className="flex items-center gap-2">
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
                  className="flex items-center gap-2 px-5 py-2 rounded-lg bg-teal-600 hover:bg-teal-700 text-xs font-semibold text-white shadow-md shadow-teal-600/20 transition-all active:scale-95"
                >
                  <Save className="w-4 h-4" />
                  <span>{loading ? 'Saving...' : 'Save Liability Record'}</span>
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
