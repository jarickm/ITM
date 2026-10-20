import React, { useState, useEffect, useRef } from 'react';
import { 
  Camera, 
  X, 
  Barcode, 
  Search, 
  ArrowRight, 
  Printer 
} from 'lucide-react';
import { useITM } from '../context/ITMContext';
import { Asset, AssetStatus } from '../types/itm';

interface ScannerModalProps {
  onClose: () => void;
  onSelectAsset?: (asset: Asset) => void;
}

export const ScannerModal: React.FC<ScannerModalProps> = ({ onClose, onSelectAsset }) => {
  const { assets, updateAsset, setSelectedAssetForQR, setActiveTab } = useITM();
  const [manualCode, setManualCode] = useState('');
  const [matchedAsset, setMatchedAsset] = useState<Asset | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // USB Barcode Scanner Wedge listener
  useEffect(() => {
    let buffer = '';
    let lastKeyTime = Date.now();

    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.tagName === 'INPUT' && (e.target as HTMLElement).id !== 'barcode-wedge-input') {
        return;
      }

      const currentTime = Date.now();
      if (currentTime - lastKeyTime > 200) {
        buffer = '';
      }
      lastKeyTime = currentTime;

      if (e.key === 'Enter') {
        if (buffer.trim().length > 3) {
          lookupAsset(buffer.trim());
          buffer = '';
        }
      } else if (e.key.length === 1) {
        buffer += e.key;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [assets]);

  const startCamera = async () => {
    try {
      setCameraError(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setCameraActive(true);
    } catch (err) {
      console.warn('Camera access error:', err);
      setCameraError('Camera access denied or unavailable on this device. You can use manual code input or standard USB scanner wedge.');
      setCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const lookupAsset = (query: string) => {
    const q = query.trim().toLowerCase();
    if (!q) return;

    try {
      const parsed = JSON.parse(query);
      if (parsed.code) {
        const found = assets.find(a => a.assetCode.toLowerCase() === parsed.code.toLowerCase());
        if (found) {
          setMatchedAsset(found);
          return;
        }
      }
    } catch {
      // not json, continue
    }

    const found = assets.find(a => 
      a.assetCode.toLowerCase() === q ||
      a.specificationOrSN.toLowerCase().includes(q) ||
      a.employeeOrDeviceName.toLowerCase().includes(q) ||
      a.id.toLowerCase() === q
    );

    if (found) {
      setMatchedAsset(found);
    } else {
      setMatchedAsset(null);
      alert(`No asset matching code "${query}" was found in the inventory database.`);
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    lookupAsset(manualCode);
  };

  const handleQuickStatusChange = async (newStatus: AssetStatus) => {
    if (!matchedAsset) return;
    await updateAsset(matchedAsset.id, { 
      status: newStatus,
      isDefective: newStatus === 'Defective',
    });
    setMatchedAsset({ ...matchedAsset, status: newStatus, isDefective: newStatus === 'Defective' });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-xl bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-200">
              <Barcode className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                Barcode & QR Asset Scanner
                <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-200">
                  USB Wedge Ready
                </span>
              </h2>
              <p className="text-xs text-slate-500">Scan physical asset tags, 1D/2D barcodes, or manual SN code lookup</p>
            </div>
          </div>
          <button
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5 bg-slate-50/50">
          {/* Camera Viewfinder */}
          <div className="relative rounded-xl overflow-hidden bg-slate-900 border border-slate-200 flex flex-col items-center justify-center min-h-[200px]">
            {cameraActive ? (
              <div className="relative w-full aspect-video">
                <video
                  ref={videoRef}
                  playsInline
                  autoPlay
                  muted
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-48 h-48 border-2 border-dashed border-indigo-400 rounded-lg relative animate-pulse flex items-center justify-center">
                    <span className="text-[10px] text-white font-mono bg-black/70 px-2 py-0.5 rounded">
                      Align QR / Barcode
                    </span>
                  </div>
                </div>
                <button
                  onClick={stopCamera}
                  className="absolute bottom-3 right-3 px-3 py-1 bg-white/90 hover:bg-white text-slate-900 rounded-lg text-xs font-semibold shadow-xs"
                >
                  Turn Off Camera
                </button>
              </div>
            ) : (
              <div className="p-6 text-center space-y-3 bg-white w-full border border-slate-200 rounded-xl">
                <div className="mx-auto w-12 h-12 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 border border-indigo-100">
                  <Camera className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-bold text-slate-800">Live Device Camera Scanning</p>
                  <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
                    Activate camera for instant mobile & tablet field asset audits, or plug in a USB handheld barcode gun.
                  </p>
                </div>
                {cameraError && (
                  <p className="text-[11px] text-amber-800 bg-amber-50 p-2 rounded border border-amber-200 text-left">
                    {cameraError}
                  </p>
                )}
                <div className="flex justify-center gap-2">
                  <button
                    onClick={startCamera}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition-all"
                  >
                    <Camera className="w-3.5 h-3.5" />
                    <span>Start Camera Stream</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Manual / USB Scanner Input */}
          <form onSubmit={handleManualSubmit} className="space-y-2">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-600 flex items-center justify-between">
              <span>Manual Asset Code / Serial No. / USB Wedge</span>
              <span className="text-indigo-600 text-[10px] lowercase font-mono">press enter to query</span>
            </label>
            <div className="relative">
              <Barcode className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                id="barcode-wedge-input"
                type="text"
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                placeholder="e.g. APX-NB-2024-001 or SN: 7H84JK2"
                className="w-full bg-white border border-slate-300 rounded-xl pl-9 pr-24 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-mono shadow-xs"
              />
              <button
                type="submit"
                className="absolute right-1.5 top-1/2 -translate-y-1/2 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold transition-colors flex items-center gap-1"
              >
                <Search className="w-3 h-3" />
                <span>Search</span>
              </button>
            </div>
          </form>

          {/* Quick Demo Scan Buttons */}
          <div className="space-y-1.5">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
              Quick Test Codes:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {assets.slice(0, 4).map((a) => (
                <button
                  key={a.id}
                  onClick={() => {
                    setManualCode(a.assetCode);
                    lookupAsset(a.assetCode);
                  }}
                  className="px-2 py-1 rounded bg-white hover:bg-slate-100 border border-slate-300 text-[10px] font-mono text-indigo-700 font-semibold transition-colors shadow-xs"
                >
                  {a.assetCode}
                </button>
              ))}
            </div>
          </div>

          {/* Asset Matched Result Card */}
          {matchedAsset && (
            <div className="p-4 rounded-xl bg-white border border-indigo-200 shadow-md space-y-3 animate-fadeIn">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
                    {matchedAsset.assetCode}
                  </span>
                  <h3 className="text-sm font-bold text-slate-900 mt-1">
                    {matchedAsset.employeeOrDeviceName}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {matchedAsset.category} • {matchedAsset.department}
                  </p>
                </div>
                <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border ${
                  matchedAsset.status === 'In Use' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                  matchedAsset.status === 'Available' ? 'bg-cyan-50 text-cyan-700 border-cyan-200' :
                  matchedAsset.status === 'Defective' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                  'bg-amber-50 text-amber-700 border-amber-200'
                }`}>
                  {matchedAsset.status}
                </span>
              </div>

              <div className="text-[11px] text-slate-600 font-mono bg-slate-50 p-2.5 rounded-lg border border-slate-200 space-y-1">
                <div><span className="text-slate-400">Spec/SN:</span> {matchedAsset.specificationOrSN}</div>
                <div><span className="text-slate-400">Purchase Date:</span> {matchedAsset.purchaseDate}</div>
                {matchedAsset.location && <div><span className="text-slate-400">Location:</span> {matchedAsset.location}</div>}
              </div>

              {/* Quick Status Modifiers */}
              <div className="space-y-1.5 pt-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Update Asset Status Instantly:
                </span>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => handleQuickStatusChange('In Use')}
                    className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-800 text-[11px] font-semibold"
                  >
                    Set: In Use
                  </button>
                  <button
                    onClick={() => handleQuickStatusChange('Available')}
                    className="px-2.5 py-1 rounded-lg bg-cyan-50 hover:bg-cyan-100 border border-cyan-300 text-cyan-800 text-[11px] font-semibold"
                  >
                    Set: Available Pool
                  </button>
                  <button
                    onClick={() => handleQuickStatusChange('Under Maintenance')}
                    className="px-2.5 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-800 text-[11px] font-semibold"
                  >
                    Set: Maintenance
                  </button>
                  <button
                    onClick={() => handleQuickStatusChange('Defective')}
                    className="px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 border border-rose-300 text-rose-800 text-[11px] font-semibold"
                  >
                    Set: Defective (RMA)
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                <button
                  onClick={() => setSelectedAssetForQR(matchedAsset)}
                  className="flex items-center gap-1.5 text-xs text-indigo-600 hover:text-indigo-800 font-semibold"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print QR Tag</span>
                </button>

                <button
                  onClick={() => {
                    if (onSelectAsset) {
                      onSelectAsset(matchedAsset);
                    } else {
                      setActiveTab('inventory');
                    }
                    stopCamera();
                    onClose();
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs"
                >
                  <span>Open Full Asset File</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-200 bg-white flex items-center justify-between text-xs text-slate-500">
          <span>Supported: QR Code, Code 128, EAN, UPC, Datamatrix</span>
          <button
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="px-3 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
