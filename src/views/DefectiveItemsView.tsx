import React from 'react';
import { 
  AlertOctagon, 
  Wrench, 
  CheckCircle2, 
  Download, 
  Trash2, 
  Edit,
  ShieldAlert
} from 'lucide-react';
import { useITM } from '../context/ITMContext';
import { Asset } from '../types/itm';

interface DefectiveItemsViewProps {
  onEditAsset: (asset: Asset) => void;
}

export const DefectiveItemsView: React.FC<DefectiveItemsViewProps> = ({ onEditAsset }) => {
  const { assets, updateAsset, currentUser } = useITM();

  const defectiveList = assets.filter(a => a.status === 'Defective' || a.isDefective);

  const handleReturnToService = async (asset: Asset) => {
    if (confirm(`Confirm repair complete and return asset ${asset.assetCode} to Available Pool?`)) {
      await updateAsset(asset.id, {
        status: 'Available',
        isDefective: false,
        notes: (asset.notes ? asset.notes + ' | ' : '') + `Repaired & returned to service on ${new Date().toISOString().substring(0, 10)}`,
      });
    }
  };

  const handleScrapRetire = async (asset: Asset) => {
    if (confirm(`Retire/Scrap asset ${asset.assetCode} as beyond economical repair?`)) {
      await updateAsset(asset.id, {
        status: 'Retired',
        isDefective: true,
        notes: (asset.notes ? asset.notes + ' | ' : '') + `Decommissioned & scrapped on ${new Date().toISOString().substring(0, 10)}`,
      });
    }
  };

  const exportDefectiveCSV = () => {
    const headers = [
      'Asset Code',
      'Device Name',
      'Category',
      'Department',
      'Defect Description',
      'RMA Number',
      'Repair Vendor',
      'Purchase Date',
      'Status',
    ];

    const rows = defectiveList.map(a => [
      `"${a.assetCode}"`,
      `"${a.employeeOrDeviceName.replace(/"/g, '""')}"`,
      `"${a.category}"`,
      `"${a.department}"`,
      `"${(a.defectiveDetails || '').replace(/"/g, '""')}"`,
      `"${a.rmaNumber || ''}"`,
      `"${a.repairVendor || ''}"`,
      a.purchaseDate,
      a.status,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `ITM_Defective_RMA_Report_${new Date().toISOString().substring(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const canEdit = currentUser.role !== 'Auditor';

  return (
    <div className="space-y-4 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-rose-50 text-rose-600 border border-rose-200">
              <AlertOctagon className="w-5 h-5" />
            </span>
            Defective IT Equipment & RMA Management
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Quarantined PCs, monitors, servers and accessories requiring vendor RMA, parts replacement or scrap
          </p>
        </div>

        <button
          onClick={exportDefectiveCSV}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-slate-50 border border-slate-300 text-xs font-semibold text-slate-700 transition-colors shadow-xs"
        >
          <Download className="w-3.5 h-3.5 text-rose-600" />
          <span>Export Defective List CSV</span>
        </button>
      </div>

      {/* Summary KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-3.5 rounded-xl bg-white border border-slate-200 flex items-center justify-between shadow-xs">
          <div>
            <div className="text-[10px] font-semibold uppercase text-slate-500">Total Defective Hardware</div>
            <div className="text-xl font-black text-rose-600">{defectiveList.length} Units</div>
          </div>
          <div className="p-2 rounded-lg bg-rose-50 text-rose-600">
            <AlertOctagon className="w-5 h-5" />
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-white border border-slate-200 flex items-center justify-between shadow-xs">
          <div>
            <div className="text-[10px] font-semibold uppercase text-slate-500">Under Active RMA Vendor Return</div>
            <div className="text-xl font-black text-amber-700">
              {defectiveList.filter(a => !!a.rmaNumber).length} Units
            </div>
          </div>
          <div className="p-2 rounded-lg bg-amber-50 text-amber-600">
            <ShieldAlert className="w-5 h-5" />
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-white border border-slate-200 flex items-center justify-between shadow-xs">
          <div>
            <div className="text-[10px] font-semibold uppercase text-slate-500">Total Capital at Risk</div>
            <div className="text-xl font-black text-slate-900">
              ${defectiveList.reduce((acc, a) => acc + (a.cost || 0), 0).toLocaleString()}
            </div>
          </div>
          <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600">
            <Wrench className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Defective Table */}
      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100 text-slate-600 border-b border-slate-200 font-bold uppercase tracking-wider text-[10px]">
                <th className="p-3 min-w-[130px]">Asset Code</th>
                <th className="p-3 min-w-[180px]">Device / Model</th>
                <th className="p-3 min-w-[110px]">Category</th>
                <th className="p-3 min-w-[120px]">Department</th>
                <th className="p-3 min-w-[240px]">Defect Diagnostic & Findings</th>
                <th className="p-3 min-w-[140px]">RMA No.</th>
                <th className="p-3 min-w-[150px]">Repair Vendor</th>
                <th className="p-3 text-right min-w-[140px]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {defectiveList.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-400 text-xs">
                    <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                    No hardware currently defective or in RMA status. All IT inventory healthy.
                  </td>
                </tr>
              ) : (
                defectiveList.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                    {/* Asset Code */}
                    <td className="p-3 font-mono font-bold text-rose-700">
                      {item.assetCode}
                    </td>

                    {/* Device / Model */}
                    <td className="p-3 font-semibold text-slate-900">
                      <div>{item.employeeOrDeviceName}</div>
                      <div className="text-[10px] text-slate-500 font-mono font-normal truncate max-w-[180px]">
                        {item.specificationOrSN}
                      </div>
                    </td>

                    {/* Category */}
                    <td className="p-3 text-slate-700">
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[11px] border border-slate-200">
                        {item.category}
                      </span>
                    </td>

                    {/* Department */}
                    <td className="p-3 text-slate-700">
                      {item.department}
                    </td>

                    {/* Defect Details */}
                    <td className="p-3 text-rose-900">
                      <p className="line-clamp-2 leading-relaxed bg-rose-50 p-2 rounded border border-rose-200 text-[11px]">
                        {item.defectiveDetails || 'Hardware malfunction reported during inspection.'}
                      </p>
                    </td>

                    {/* RMA No */}
                    <td className="p-3 font-mono text-indigo-700">
                      {item.rmaNumber ? (
                        <span className="px-2 py-0.5 rounded bg-indigo-50 border border-indigo-200 text-[11px] font-semibold">
                          {item.rmaNumber}
                        </span>
                      ) : (
                        <span className="text-slate-400 italic">None</span>
                      )}
                    </td>

                    {/* Repair Vendor */}
                    <td className="p-3 text-slate-700">
                      {item.repairVendor || <span className="text-slate-400 italic">In-house IT Tech</span>}
                    </td>

                    {/* Actions */}
                    <td className="p-3 text-right space-x-1">
                      {canEdit && (
                        <button
                          onClick={() => handleReturnToService(item)}
                          className="px-2 py-1 rounded bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-800 text-[10px] font-semibold transition-colors"
                          title="Mark Repaired & Return to Available Stock"
                        >
                          Repaired
                        </button>
                      )}
                      {canEdit && (
                        <button
                          onClick={() => onEditAsset(item)}
                          className="p-1 rounded hover:bg-slate-100 text-slate-500 hover:text-slate-900 transition-colors"
                          title="Edit RMA Details"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                      )}
                      {canEdit && (
                        <button
                          onClick={() => handleScrapRetire(item)}
                          className="p-1 rounded hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors"
                          title="Decommission / Scrap"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
