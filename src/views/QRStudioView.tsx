import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { 
  QrCode, 
  Printer, 
  Filter, 
  CheckSquare, 
  Square, 
  FileCode,
  Download,
  Image as ImageIcon,
  CheckCircle2
} from 'lucide-react';
import { useITM } from '../context/ITMContext';
import { Asset } from '../types/itm';
import { 
  buildQRLabelsHtml, 
  executePrint, 
  downloadPrintableHtml, 
  downloadAssetLabelImage 
} from '../utils/printHelper';

export const QRStudioView: React.FC = () => {
  const { assets, settings, dropdownOptions } = useITM();
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedIds, setSelectedIds] = useState<string[]>(assets.map(a => a.id));
  const [labelSize, setLabelSize] = useState<'standard' | 'compact' | 'zebra'>('standard');
  const [qrMap, setQrMap] = useState<Record<string, string>>({});
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const categories = ['All', ...Array.from(new Set([...(dropdownOptions.assetCategories || []), ...assets.map(a => a.category)].filter(Boolean)))];

  const displayedAssets = assets.filter(a => {
    if (selectedCategory !== 'All' && a.category !== selectedCategory) return false;
    return true;
  });

  const printableAssets = displayedAssets.filter(a => selectedIds.includes(a.id));

  // Generate QR code data URLs in parallel
  useEffect(() => {
    let isMounted = true;
    const generateAll = async () => {
      const map: Record<string, string> = {};
      await Promise.all(
        printableAssets.map(async (item) => {
          try {
            const payload = JSON.stringify({
              code: item.assetCode,
              name: item.employeeOrDeviceName,
              category: item.category,
              dept: item.department,
              sn: item.specificationOrSN,
            });
            const url = await QRCode.toDataURL(payload, {
              width: 280,
              margin: 1,
              color: {
                dark: '#000000',
                light: '#ffffff',
              },
            });
            map[item.id] = url;
          } catch (e) {
            console.error('QR generate error for', item.assetCode, e);
          }
        })
      );
      if (isMounted) {
        setQrMap(map);
      }
    };

    if (printableAssets.length > 0) {
      generateAll();
    }

    return () => {
      isMounted = false;
    };
  }, [printableAssets.length, selectedCategory, selectedIds]);

  const handleSelectAll = () => {
    if (selectedIds.length === displayedAssets.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(displayedAssets.map(a => a.id));
    }
  };

  const handlePrint = () => {
    const html = buildQRLabelsHtml(printableAssets, settings.companyName, qrMap, labelSize, false);
    executePrint(html);
    setStatusMessage(`Print dialog launched for ${printableAssets.length} labels. You can also download the HTML sheet anytime.`);
    setTimeout(() => setStatusMessage(null), 6000);
  };

  const handleDownloadHtml = () => {
    const html = buildQRLabelsHtml(printableAssets, settings.companyName, qrMap, labelSize, true);
    downloadPrintableHtml(html, `ITM_Batch_Labels_${new Date().toISOString().substring(0, 10)}.html`);
    setStatusMessage('Downloaded standalone HTML label sheet. Open in any browser tab to print!');
    setTimeout(() => setStatusMessage(null), 5000);
  };

  const handleDownloadSinglePng = async (item: Asset) => {
    const qrUrl = qrMap[item.id];
    if (!qrUrl) return;
    try {
      await downloadAssetLabelImage(item, settings.companyName, qrUrl, labelSize);
      setStatusMessage(`Saved PNG label image for ${item.assetCode}!`);
      setTimeout(() => setStatusMessage(null), 4000);
    } catch (e) {
      console.error(e);
      setStatusMessage('Error downloading PNG.');
    }
  };

  return (
    <div className="space-y-4 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-200">
              <QrCode className="w-5 h-5" />
            </span>
            QR & Barcode Tag Print Studio
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Rapid asset identification label generator with company branding, specs, and field scanner codes
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleDownloadHtml}
            disabled={printableAssets.length === 0}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-slate-50 border border-slate-300 text-xs font-semibold text-slate-700 transition-colors shadow-xs disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5 text-indigo-600" />
            <span>Download HTML Sheet</span>
          </button>

          <button
            onClick={handlePrint}
            disabled={printableAssets.length === 0}
            className="flex items-center gap-2 px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-xs font-semibold text-white shadow-sm shadow-indigo-600/30 transition-all active:scale-95 disabled:opacity-50"
          >
            <Printer className="w-4 h-4" />
            <span>Print {printableAssets.length} Selected Labels</span>
          </button>
        </div>
      </div>

      {/* Notification Toast */}
      {statusMessage && (
        <div className="p-3 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center gap-2 text-xs text-indigo-900 animate-fadeIn shadow-xs">
          <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0" />
          <span>{statusMessage}</span>
        </div>
      )}

      {/* Configuration Toolbar */}
      <div className="p-4 rounded-xl bg-white border border-slate-200 flex flex-wrap items-center justify-between gap-4 text-xs shadow-xs">
        <div className="flex flex-wrap items-center gap-3">
          {/* Category Filter */}
          <div className="flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              {categories.map((c) => (
                <option key={c} value={c}>{c === 'All' ? 'All Categories' : c}</option>
              ))}
            </select>
          </div>

          {/* Label Layout Selector */}
          <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg border border-slate-200">
            <span className="text-[10px] text-slate-500 px-2 font-semibold uppercase">Layout:</span>
            <button
              onClick={() => setLabelSize('standard')}
              className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${labelSize === 'standard' ? 'bg-indigo-600 text-white font-semibold shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
            >
              Standard A4 (2-Col)
            </button>
            <button
              onClick={() => setLabelSize('zebra')}
              className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${labelSize === 'zebra' ? 'bg-indigo-600 text-white font-semibold shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
            >
              Zebra / Dymo (4x2")
            </button>
            <button
              onClick={() => setLabelSize('compact')}
              className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${labelSize === 'compact' ? 'bg-indigo-600 text-white font-semibold shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
            >
              Compact Sticker
            </button>
          </div>

          {/* Select all toggle */}
          <button
            onClick={handleSelectAll}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs transition-colors border border-slate-200 font-medium"
          >
            {selectedIds.length === displayedAssets.length ? (
              <CheckSquare className="w-3.5 h-3.5 text-indigo-600" />
            ) : (
              <Square className="w-3.5 h-3.5 text-slate-400" />
            )}
            <span>Select All in Category ({displayedAssets.length})</span>
          </button>
        </div>

        <div className="text-[11px] text-slate-500 font-mono">
          Ready to print: <span className="font-bold text-indigo-700">{printableAssets.length}</span> labels
        </div>
      </div>

      {/* Printable Sheet Container */}
      <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs">
        {printableAssets.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs">
            No assets selected for printing. Check the selection boxes above.
          </div>
        ) : (
          <div className={`grid gap-4 ${
            labelSize === 'zebra' ? 'grid-cols-1 sm:grid-cols-2 max-w-4xl mx-auto' :
            labelSize === 'compact' ? 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4' :
            'grid-cols-1 sm:grid-cols-2 lg:grid-cols-2'
          }`}>
            {printableAssets.map((item) => (
              <div
                key={item.id}
                className="print-label-item bg-white text-slate-900 p-4 rounded-xl border-2 border-slate-900 shadow-xs flex flex-col justify-between relative overflow-hidden"
                style={{ minHeight: labelSize === 'compact' ? '140px' : '190px' }}
              >
                {/* Header */}
                <div className="flex items-center justify-between border-b-2 border-slate-900 pb-1.5 mb-2">
                  <div className="flex items-center gap-1.5">
                    <span className="h-4 w-4 rounded bg-slate-900 text-white font-black text-[9px] flex items-center justify-center">
                      IT
                    </span>
                    <span className="text-[10px] font-extrabold uppercase tracking-tight text-slate-900">
                      {settings.companyName.split(' ')[0]} PROPERTY
                    </span>
                  </div>
                  <span className="text-[8px] font-mono font-bold bg-slate-100 px-1 py-0.5 rounded border border-slate-300">
                    {item.category}
                  </span>
                </div>

                {/* Body */}
                <div className="flex items-center gap-3">
                  <div className="shrink-0 bg-white p-1 rounded-lg border border-slate-200">
                    {qrMap[item.id] ? (
                      <img 
                        src={qrMap[item.id]} 
                        alt={item.assetCode} 
                        className={labelSize === 'compact' ? 'w-16 h-16' : 'w-22 h-22'} 
                      />
                    ) : (
                      <div className="w-16 h-16 flex items-center justify-center text-[8px] text-slate-400">
                        Generating...
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0 text-left space-y-1">
                    <div className="text-xs font-black text-slate-950 truncate font-mono tracking-wider">
                      {item.assetCode}
                    </div>
                    <div className="text-[11px] font-bold text-slate-900 line-clamp-2 leading-tight">
                      {item.employeeOrDeviceName}
                    </div>
                    <div className="text-[9px] text-slate-600 truncate">
                      <span className="font-semibold">Dept:</span> {item.department}
                    </div>
                    <div className="text-[8px] text-slate-500 font-mono truncate">
                      <span className="font-semibold">SN:</span> {item.specificationOrSN}
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="mt-2 pt-1 border-t border-slate-200 flex items-center justify-between text-[8px] text-slate-500 font-mono">
                  <span>DATE: {item.purchaseDate}</span>
                  <span className="font-bold text-slate-800">TAMPER EVIDENT TAG</span>
                </div>

                {/* Save PNG button */}
                <div className="mt-2 pt-1.5 border-t border-dashed border-slate-200 flex justify-end">
                  <button
                    onClick={() => handleDownloadSinglePng(item)}
                    className="flex items-center gap-1 text-[10px] font-semibold text-indigo-600 hover:text-indigo-800 px-2 py-0.5 rounded hover:bg-indigo-50 transition-colors"
                  >
                    <ImageIcon className="w-3 h-3" />
                    <span>Save PNG Tag</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
