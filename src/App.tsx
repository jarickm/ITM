/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Cloud, RefreshCw } from 'lucide-react';
import { ITMProvider, useITM } from './context/ITMContext';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { ScannerModal } from './components/ScannerModal';
import { QRPrintModal } from './components/QRPrintModal';
import { AssetModal } from './components/AssetModal';
import { OnboardingModal } from './components/OnboardingModal';
import { OffboardingModal } from './components/OffboardingModal';
import { RequestModal } from './components/RequestModal';
import { BorrowModal } from './components/BorrowModal';
import { MaintenanceModal } from './components/MaintenanceModal';
import { LiabilityModal } from './components/LiabilityModal';
import { ClearDataModal } from './components/ClearDataModal';
import { AssetTransferModal } from './components/AssetTransferModal';
import { ITCompanionAI } from './components/ITCompanionAI';

// Views
import { DashboardView } from './views/DashboardView';
import { InventoryView } from './views/InventoryView';
import { DefectiveItemsView } from './views/DefectiveItemsView';
import { OnboardingView } from './views/OnboardingView';
import { OffboardingView } from './views/OffboardingView';
import { RequestsView } from './views/RequestsView';
import { PROnlyView } from './views/PROnlyView';
import { BorrowingView } from './views/BorrowingView';
import { MaintenanceView } from './views/MaintenanceView';
import { LiabilitiesView } from './views/LiabilitiesView';
import { QRStudioView } from './views/QRStudioView';
import { ActivityLogsView } from './views/ActivityLogsView';
import { SettingsView } from './views/SettingsView';
import { KPITargets2026View } from './views/KPITargets2026View';

// Models
import { 
  Asset, 
  OnboardingRecord, 
  OffboardingRecord, 
  RequestRecord, 
  BorrowingRecord, 
  PreventiveMaintenanceRecord, 
  LiabilityRecord, 
  RequestType 
} from './types/itm';

const MainAppContent: React.FC = () => {
  const { 
    activeTab, 
    assets,
    selectedAssetForQR, 
    setSelectedAssetForQR,
    addAsset,
    updateAsset,
    addOnboarding,
    updateOnboarding,
    addOffboarding,
    updateOffboarding,
    addRequest,
    updateRequest,
    addBorrowing,
    updateBorrowing,
    addPreventiveMaintenance,
    updatePreventiveMaintenance,
    addLiability,
    updateLiability,
    isCloudLoading,
    cloudDatabaseId
  } = useITM();

  // Modals state
  const [showScanner, setShowScanner] = useState(false);
  const [batchPrintAssets, setBatchPrintAssets] = useState<Asset[]>([]);

  // Asset Modal
  const [showAssetModal, setShowAssetModal] = useState(false);
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);

  // Onboarding Modal
  const [showOnboardingModal, setShowOnboardingModal] = useState(false);
  const [editingOnboarding, setEditingOnboarding] = useState<OnboardingRecord | null>(null);

  // Offboarding Modal
  const [showOffboardingModal, setShowOffboardingModal] = useState(false);
  const [editingOffboarding, setEditingOffboarding] = useState<OffboardingRecord | null>(null);

  // Request Modal
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [editingRequest, setEditingRequest] = useState<RequestRecord | null>(null);
  const [defaultRequestType, setDefaultRequestType] = useState<RequestType>('PR');

  // Borrow Modal
  const [showBorrowModal, setShowBorrowModal] = useState(false);
  const [editingBorrow, setEditingBorrow] = useState<BorrowingRecord | null>(null);

  // PM Modal
  const [showPMModal, setShowPMModal] = useState(false);
  const [editingPM, setEditingPM] = useState<PreventiveMaintenanceRecord | null>(null);

  // Liability Modal
  const [showLiabilityModal, setShowLiabilityModal] = useState(false);
  const [editingLiability, setEditingLiability] = useState<LiabilityRecord | null>(null);

  // Clear Data Modal (Password protected)
  const [showClearDataModal, setShowClearDataModal] = useState(false);

  // Device Custody Transfer Modal
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [transferTargetAsset, setTransferTargetAsset] = useState<Asset | null>(null);
  const [transferFromEmployee, setTransferFromEmployee] = useState<string | undefined>(undefined);

  const handleOpenTransfer = (assetOrEmployee?: Asset | string) => {
    if (typeof assetOrEmployee === 'string') {
      const foundAsset = assets.find(a => 
        a.employeeOrDeviceName.toLowerCase().includes(assetOrEmployee.toLowerCase())
      );
      setTransferTargetAsset(foundAsset || null);
      setTransferFromEmployee(assetOrEmployee);
    } else if (assetOrEmployee) {
      setTransferTargetAsset(assetOrEmployee);
      setTransferFromEmployee(assetOrEmployee.employeeOrDeviceName);
    } else {
      setTransferTargetAsset(null);
      setTransferFromEmployee(undefined);
    }
    setShowTransferModal(true);
  };

  // Asset handlers
  const handleOpenNewAsset = () => {
    setEditingAsset(null);
    setShowAssetModal(true);
  };

  const handleEditAsset = (asset: Asset) => {
    setEditingAsset(asset);
    setShowAssetModal(true);
  };

  const handleSaveAsset = async (data: Omit<Asset, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (editingAsset) {
      await updateAsset(editingAsset.id, data);
    } else {
      await addAsset(data);
    }
  };

  // Onboarding handlers
  const handleOpenNewOnboarding = () => {
    setEditingOnboarding(null);
    setShowOnboardingModal(true);
  };

  const handleEditOnboarding = (rec: OnboardingRecord) => {
    setEditingOnboarding(rec);
    setShowOnboardingModal(true);
  };

  const handleSaveOnboarding = async (data: Omit<OnboardingRecord, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (editingOnboarding) {
      await updateOnboarding(editingOnboarding.id, data);
    } else {
      await addOnboarding(data);
    }
  };

  // Offboarding handlers
  const handleOpenNewOffboarding = () => {
    setEditingOffboarding(null);
    setShowOffboardingModal(true);
  };

  const handleEditOffboarding = (rec: OffboardingRecord) => {
    setEditingOffboarding(rec);
    setShowOffboardingModal(true);
  };

  const handleSaveOffboarding = async (data: Omit<OffboardingRecord, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (editingOffboarding) {
      await updateOffboarding(editingOffboarding.id, data);
    } else {
      await addOffboarding(data);
    }
  };

  // Request handlers
  const handleOpenNewRequest = (type: RequestType = 'PR') => {
    setDefaultRequestType(type);
    setEditingRequest(null);
    setShowRequestModal(true);
  };

  const handleEditRequest = (rec: RequestRecord) => {
    setEditingRequest(rec);
    setDefaultRequestType(rec.requestType);
    setShowRequestModal(true);
  };

  const handleSaveRequest = async (data: Omit<RequestRecord, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (editingRequest) {
      await updateRequest(editingRequest.id, data);
    } else {
      await addRequest(data);
    }
  };

  // Borrow handlers
  const handleOpenNewBorrow = () => {
    setEditingBorrow(null);
    setShowBorrowModal(true);
  };

  const handleEditBorrow = (rec: BorrowingRecord) => {
    setEditingBorrow(rec);
    setShowBorrowModal(true);
  };

  const handleSaveBorrow = async (data: Omit<BorrowingRecord, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (editingBorrow) {
      await updateBorrowing(editingBorrow.id, data);
    } else {
      await addBorrowing(data);
    }
  };

  // PM handlers
  const handleOpenNewPM = () => {
    setEditingPM(null);
    setShowPMModal(true);
  };

  const handleEditPM = (rec: PreventiveMaintenanceRecord) => {
    setEditingPM(rec);
    setShowPMModal(true);
  };

  const handleSavePM = async (data: Omit<PreventiveMaintenanceRecord, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (editingPM) {
      await updatePreventiveMaintenance(editingPM.id, data);
    } else {
      await addPreventiveMaintenance(data);
    }
  };

  // Liability handlers
  const handleOpenNewLiability = () => {
    setEditingLiability(null);
    setShowLiabilityModal(true);
  };

  const handleEditLiability = (rec: LiabilityRecord) => {
    setEditingLiability(rec);
    setShowLiabilityModal(true);
  };

  const handleSaveLiability = async (data: Omit<LiabilityRecord, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (editingLiability) {
      await updateLiability(editingLiability.id, data);
    } else {
      await addLiability(data);
    }
  };

  // Batch QR Print
  const handlePrintBatchQR = (assetsList: Asset[]) => {
    setBatchPrintAssets(assetsList);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-indigo-600 selection:text-white">
      {/* Top Navbar */}
      <Navbar 
        onOpenScanner={() => setShowScanner(true)} 
        onOpenClearModal={() => setShowClearDataModal(true)} 
      />

      {/* Main Body */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <Sidebar />

        {/* Viewport content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6 bg-slate-100/60">
          {activeTab === 'dashboard' && (
            <DashboardView
              onOpenNewAsset={handleOpenNewAsset}
              onOpenScanner={() => setShowScanner(true)}
              onOpenNewRequest={() => handleOpenNewRequest('PR')}
              onOpenNewBorrow={handleOpenNewBorrow}
            />
          )}

          {activeTab === 'kpi_targets' && (
            <KPITargets2026View />
          )}

          {activeTab === 'inventory' && (
            <InventoryView
              onOpenNewAsset={handleOpenNewAsset}
              onEditAsset={handleEditAsset}
              onPrintBatchQR={handlePrintBatchQR}
              onOpenTransfer={handleOpenTransfer}
              onOpenClearPasswordModal={() => setShowClearDataModal(true)}
            />
          )}

          {activeTab === 'defective' && (
            <DefectiveItemsView
              onEditAsset={handleEditAsset}
            />
          )}

          {activeTab === 'onboarding' && (
            <OnboardingView
              onOpenNewOnboarding={handleOpenNewOnboarding}
              onEditOnboarding={handleEditOnboarding}
            />
          )}

          {activeTab === 'offboarding' && (
            <OffboardingView
              onOpenNewOffboarding={handleOpenNewOffboarding}
              onEditOffboarding={handleEditOffboarding}
              onOpenTransferDevice={handleOpenTransfer}
            />
          )}

          {activeTab === 'requests' && (
            <RequestsView
              onOpenNewRequest={handleOpenNewRequest}
              onEditRequest={handleEditRequest}
            />
          )}

          {activeTab === 'pr_only' && (
            <PROnlyView
              onOpenNewPR={() => handleOpenNewRequest('PR')}
              onEditRequest={handleEditRequest}
            />
          )}

          {activeTab === 'borrowing' && (
            <BorrowingView
              onOpenNewBorrow={handleOpenNewBorrow}
              onEditBorrow={handleEditBorrow}
            />
          )}

          {activeTab === 'maintenance' && (
            <MaintenanceView
              onOpenNewPM={handleOpenNewPM}
              onEditPM={handleEditPM}
            />
          )}

          {activeTab === 'liabilities' && (
            <LiabilitiesView
              onOpenNewLiability={handleOpenNewLiability}
              onEditLiability={handleEditLiability}
            />
          )}

          {activeTab === 'qr_studio' && (
            <QRStudioView />
          )}

          {activeTab === 'activity_logs' && (
            <ActivityLogsView />
          )}

          {activeTab === 'categories' && (
            <SettingsView initialTab="dropdowns" />
          )}

          {activeTab === 'settings' && (
            <SettingsView initialTab="general" />
          )}
        </main>
      </div>

      {/* Global Modals */}
      {showScanner && (
        <ScannerModal
          onClose={() => setShowScanner(false)}
          onSelectAsset={(asset) => {
            handleEditAsset(asset);
          }}
        />
      )}

      {/* Single / Batch QR Print Modal */}
      {(selectedAssetForQR || batchPrintAssets.length > 0) && (
        <QRPrintModal
          asset={selectedAssetForQR}
          batchAssets={batchPrintAssets}
          onClose={() => {
            setSelectedAssetForQR(null);
            setBatchPrintAssets([]);
          }}
        />
      )}

      {showAssetModal && (
        <AssetModal
          asset={editingAsset}
          onClose={() => {
            setShowAssetModal(false);
            setEditingAsset(null);
          }}
          onSave={handleSaveAsset}
        />
      )}

      {showOnboardingModal && (
        <OnboardingModal
          record={editingOnboarding}
          onClose={() => {
            setShowOnboardingModal(false);
            setEditingOnboarding(null);
          }}
          onSave={handleSaveOnboarding}
        />
      )}

      {showOffboardingModal && (
        <OffboardingModal
          record={editingOffboarding}
          onClose={() => {
            setShowOffboardingModal(false);
            setEditingOffboarding(null);
          }}
          onSave={handleSaveOffboarding}
        />
      )}

      {showRequestModal && (
        <RequestModal
          record={editingRequest}
          defaultType={defaultRequestType}
          onClose={() => {
            setShowRequestModal(false);
            setEditingRequest(null);
          }}
          onSave={handleSaveRequest}
        />
      )}

      {showBorrowModal && (
        <BorrowModal
          record={editingBorrow}
          onClose={() => {
            setShowBorrowModal(false);
            setEditingBorrow(null);
          }}
          onSave={handleSaveBorrow}
        />
      )}

      {showPMModal && (
        <MaintenanceModal
          record={editingPM}
          onClose={() => {
            setShowPMModal(false);
            setEditingPM(null);
          }}
          onSave={handleSavePM}
        />
      )}

      {showLiabilityModal && (
        <LiabilityModal
          record={editingLiability}
          onClose={() => {
            setShowLiabilityModal(false);
            setEditingLiability(null);
          }}
          onSave={handleSaveLiability}
        />
      )}

      {/* Master Password Protected Clear Data Modal */}
      {showClearDataModal && (
        <ClearDataModal onClose={() => setShowClearDataModal(false)} />
      )}

      {/* Device Custody Transfer & Handover Slip Modal */}
      {showTransferModal && (
        <AssetTransferModal
          initialAsset={transferTargetAsset || undefined}
          initialFromEmployee={transferFromEmployee}
          onClose={() => {
            setShowTransferModal(false);
            setTransferTargetAsset(null);
            setTransferFromEmployee(undefined);
          }}
        />
      )}

      {/* Google Workspace & IT AI Companion */}
      <ITCompanionAI />
    </div>
  );
};

export default function App() {
  return (
    <ITMProvider>
      <MainAppContent />
    </ITMProvider>
  );
}
