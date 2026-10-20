import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { 
  Printer, 
  X, 
  Download, 
  Tag, 
  Check, 
  Copy, 
  FileCode, 
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { Asset } from '../types/itm';
import { useITM } from '../context/ITMContext';
import { 
  buildQRLabelsHtml, 
  executePrint, 
  downloadPrintableHtml,
  downloadAssetLabelImage,
  copyAssetLabelImageToClipboard
} from '../utils/printHelper';

interface QRPrintModalProps {
  asset: Asset | null;
  onClose: () => void;
  batchAssets?: Asset[];
}

export const QRPrintModal: React.FC<QRPrintModalProps> = ({ asset, onClose, batchAssets }) => {
  const { settings } = useITM();
  const [qrMap, setQrMap] = useState<Record<string, string>>({});
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedImage, setCopiedImage] = useState(false);
  const [layout, setLayout] = useState<'standard' | 'zebra' | 'compact'>('standard');
  const [statusNotice, setStatusNotice] = useState<string | null>(null);

  const targetAssets: Asset[] = batchAssets && batchAssets.length > 0 ? batchAssets : (asset ? [asset] : []);

  useEffect(() => {
    const generateQRs = async () => {
      const map: Record<string, string> = {};
      for (const item of targetAssets) {
        try {
          const payload = JSON.stringify({
            code: item.assetCode,
            name: item.employeeOrDeviceName,
            category: item.category,
            dept: item.department,
            sn: item.specificationOrSN,
          });
          const dataUrl = await QRCode.toDataURL(payload, {
            width: 320,
            margin: 1,
            color: {
              dark: '#000000',
              light: '#ffffff',
            },
          });
          map[item.id] = dataUrl;
        } catch (err) {
          console.error('QR generation error:', err);
        }
      }
      setQrMap(map);
    };

    if (targetAssets.length > 0) {
      generateQRs();
    }
  }, [targetAssets]);

  if (targetAssets.length === 0) return null;

  const handlePrint = () => {
    const html = buildQRLabelsHtml(targetAssets, settings.companyName, qrMap, layout, false);
    executePrint(html);
    setStatusNotice('Print dialog initiated. If your browser blocks popups, use "Save Label as Image" or "Download HTML Sheet".');
    setTimeout(() => setStatusNotice(null), 6000);
  };

  const handleDownloadPng = async (item: Asset) => {
    const qrUrl = qrMap[item.id];
    if (!qrUrl) return;
    try {
      await downloadAssetLabelImage(item, settings.companyName, qrUrl, layout);
      setStatusNotice(`Saved label image for ${item.assetCode} as high-res PNG!`);
      setTimeout(() => setStatusNotice(null), 4000);
    } catch (e) {
      console.error(e);
      setStatusNotice('Error generating PNG image.');
    }
  };

  const handleCopyImage = async (item: Asset) => {
    const qrUrl = qrMap[item.id];
    if (!qrUrl) return;
    const ok = await copyAssetLabelImageToClipboard(item, settings.companyName, qrUrl, layout);
    if (ok) {
      setCopiedImage(true);
      setStatusNotice('Copied high-res label tag image to clipboard! You can paste into Word, Excel or Docs.');
      setTimeout(() => {
        setCopiedImage(false);
        setStatusNotice(null);
      }, 4000);
    } else {
      setStatusNotice('Clipboard image copy not supported in this browser. Please use "Save PNG Image" instead.');
    }
  };

  const handleDownloadHtml = () => {
    const html = buildQRLabelsHtml(targetAssets, settings.companyName, qrMap, layout, true);
    downloadPrintableHtml(html, `ITM_QR_Labels_${new Date().toISOString().substring(0, 10)}.html`);
    setStatusNotice('Downloaded self-contained HTML print sheet. Open it in any browser tab to print directly!');
    setTimeout(() => setStatusNotice(null), 5000);
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/40 backdrop-blur-xs animate-fadeIn">
      <div className="relative w-full max-w-2xl bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-slate-200 bg-slate-50/80">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-200">
              <Tag className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                {targetAssets.length > 1 ? `Print QR Asset Tags (${targetAssets.length} Assets)` : 'Asset QR Identification Label & Tag'}
              </h2>
              <p className="text-xs text-slate-500">
                Ready for thermal printers (Zebra, Brother, Dymo) or standard laser/inkjet paper
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/80 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Layout & Quick Action Switcher */}
        <div className="px-5 sm:px-6 py-2.5 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-600 text-[11px] uppercase tracking-wider">Layout:</span>
            <div className="flex bg-white rounded-lg border border-slate-300 p-0.5 shadow-xs">
              <button
                onClick={() => setLayout('standard')}
                className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${layout === 'standard' ? 'bg-indigo-600 text-white font-semibold shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
              >
                Standard (A4 2-Col)
              </button>
              <button
                onClick={() => setLayout('zebra')}
                className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${layout === 'zebra' ? 'bg-indigo-600 text-white font-semibold shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
              >
                Zebra / Dymo 4x2"
              </button>
              <button
                onClick={() => setLayout('compact')}
                className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${layout === 'compact' ? 'bg-indigo-600 text-white font-semibold shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
              >
                Compact Sticker
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadHtml}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white border border-slate-300 text-[11px] font-semibold text-slate-700 hover:text-indigo-600 hover:bg-slate-50 transition-colors shadow-xs"
              title="Download standalone HTML sheet that auto-prompts print dialog"
            >
              <FileCode className="w-3.5 h-3.5 text-indigo-600" />
              <span>Download HTML Sheet</span>
            </button>
          </div>
        </div>

        {/* Status notification toast */}
        {statusNotice && (
          <div className="mx-6 mt-3 p-2.5 rounded-lg bg-indigo-50 border border-indigo-200 flex items-center gap-2 text-xs text-indigo-900 animate-fadeIn">
            <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0" />
            <span className="flex-1">{statusNotice}</span>
          </div>
        )}

        {/* Printable Preview Area */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4 bg-slate-100/50">
          <div className={`grid gap-4 ${layout === 'zebra' ? 'grid-cols-1 max-w-lg mx-auto' : layout === 'compact' ? 'grid-cols-2 sm:grid-cols-3' : 'grid-cols-1 sm:grid-cols-2'}`}>
            {targetAssets.map((item) => (
              <div
                key={item.id}
                className="print-label-card bg-white text-slate-900 p-4 rounded-xl border-2 border-slate-900 shadow-sm flex flex-col justify-between relative overflow-hidden group"
                style={{ minHeight: layout === 'compact' ? '140px' : '200px' }}
              >
                {/* Brand Header */}
                <div className="flex items-center justify-between border-b-2 border-slate-900 pb-1.5 mb-2">
                  <div className="flex items-center gap-1.5">
                    <span className="h-5 w-5 rounded bg-slate-900 text-white font-black text-[10px] flex items-center justify-center">
                      IT
                    </span>
                    <span className="text-[11px] font-extrabold uppercase tracking-tight text-slate-900">
                      {settings.companyName.split(' ')[0]} IT ASSET
                    </span>
                  </div>
                  <span className="text-[9px] font-mono font-bold bg-slate-100 px-1.5 py-0.5 rounded border border-slate-300">
                    {item.category}
                  </span>
                </div>

                {/* Body: QR & Details */}
                <div className="flex items-center gap-3">
                  <div className="shrink-0 bg-white p-1 rounded-lg border border-slate-200">
                    {qrMap[item.id] ? (
                      <img 
                        src={qrMap[item.id]} 
                        alt={item.assetCode} 
                        className={layout === 'compact' ? 'w-16 h-16 object-contain' : 'w-24 h-24 object-contain'} 
                      />
                    ) : (
                      <div className="w-20 h-20 flex items-center justify-center bg-slate-100 text-[10px] text-slate-400">
                        Generating...
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0 text-left space-y-1">
                    <div className="text-xs font-black text-slate-950 truncate font-mono tracking-wider">
                      {item.assetCode}
                    </div>
                    <div className="text-[11px] font-bold text-slate-800 line-clamp-2 leading-tight">
                      {item.employeeOrDeviceName}
                    </div>
                    <div className="text-[10px] text-slate-600 truncate">
                      <span className="font-semibold">Dept:</span> {item.department}
                    </div>
                    <div className="text-[9px] text-slate-500 font-mono truncate">
                      <span className="font-semibold">SN:</span> {item.specificationOrSN}
                    </div>
                  </div>
                </div>

                {/* Footer Barcode / Warning */}
                <div className="mt-3 pt-2 border-t border-slate-200 flex items-center justify-between text-[8px] text-slate-500 font-mono">
                  <span>PUR: {item.purchaseDate}</span>
                  <span className="font-bold text-slate-900">DO NOT REMOVE TAG</span>
                </div>

                {/* Quick Individual Actions overlay on hover for single items */}
                <div className="mt-2 pt-2 border-t border-dashed border-slate-200 flex items-center justify-between gap-1 text-[11px]">
                  <button
                    onClick={() => handleDownloadPng(item)}
                    className="flex items-center gap-1 text-indigo-700 hover:text-indigo-900 font-semibold py-0.5 px-1.5 rounded hover:bg-indigo-50 transition-colors"
                    title="Save this label as a 300-DPI PNG file"
                  >
                    <ImageIcon className="w-3.5 h-3.5" />
                    <span>Save PNG Image</span>
                  </button>
                  <button
                    onClick={() => handleCopyImage(item)}
                    className="flex items-center gap-1 text-slate-600 hover:text-slate-900 font-semibold py-0.5 px-1.5 rounded hover:bg-slate-100 transition-colors"
                    title="Copy PNG tag image to clipboard"
                  >
                    {copiedImage ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedImage ? 'Copied' : 'Copy Image'}</span>
                  </button>
                </div>
              </div>
            ))}
          </div>

          {targetAssets.length === 1 && (
            <div className="p-3 rounded-lg bg-white border border-slate-200 flex items-center justify-between text-xs text-slate-700 shadow-xs">
              <span className="font-mono text-indigo-700 font-semibold">{targetAssets[0].assetCode}</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleCopyCode(targetAssets[0].assetCode)}
                  className="flex items-center gap-1 text-[11px] text-slate-600 hover:text-slate-900 px-2 py-1 rounded bg-slate-50 border border-slate-200 hover:bg-slate-100 transition-colors"
                >
                  {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedCode ? 'Copied' : 'Copy Asset Code'}</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Actions Footer */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-t border-slate-200 bg-white">
          <div className="text-[11px] text-slate-500">
            Thermal Label: <span className="font-semibold text-slate-700">4" × 2" (Zebra/Dymo)</span> or standard paper.
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-700 transition-colors"
            >
              Close
            </button>

            {targetAssets.length === 1 && (
              <button
                onClick={() => handleDownloadPng(targetAssets[0])}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 border border-slate-300 text-xs font-semibold text-slate-800 transition-colors"
              >
                <ImageIcon className="w-3.5 h-3.5 text-indigo-600" />
                <span>Save PNG</span>
              </button>
            )}

            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-xs font-semibold text-white shadow-md shadow-indigo-600/20 transition-all active:scale-95"
            >
              <Printer className="w-4 h-4" />
              <span>Print Label Now</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
