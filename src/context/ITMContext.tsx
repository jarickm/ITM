import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { 
  signInWithGoogleWorkspace as authGoogleSignIn, 
  logoutGoogleWorkspace as authGoogleSignOut, 
  initWorkspaceAuthListener 
} from '../firebase/config';
import { 
  Asset, 
  OnboardingRecord, 
  OffboardingRecord, 
  RequestRecord, 
  BorrowingRecord, 
  PreventiveMaintenanceRecord, 
  LiabilityRecord, 
  ActivityLog,
  SystemSettings,
  UserProfile,
  UserRole,
  LanguageCode,
  DropdownOptionsConfig,
  KPITargets2026Data,
  AssetCustodyTransfer,
  OrientationSessionLog,
  NetsuiteConcernLog,
  MONTHS_LIST
} from '../types/itm';
import { 
  SEED_ASSETS, 
  SEED_ONBOARDINGS, 
  SEED_OFFBOARDINGS, 
  SEED_REQUESTS, 
  SEED_BORROWINGS, 
  SEED_PREVENTIVE_MAINTENANCE, 
  SEED_LIABILITIES, 
  SEED_ACTIVITY_LOGS, 
  INITIAL_SETTINGS,
  DEFAULT_DROPDOWN_OPTIONS,
  SEED_KPI_2026 
} from '../data/seedData';
import { TRANSLATIONS } from '../utils/i18n';

export interface AlertNotification {
  id: string;
  type: 'low_stock' | 'warranty' | 'overdue' | 'maintenance';
  title: string;
  message: string;
  date: string;
  read: boolean;
}

interface ITMContextType {
  // Collections
  assets: Asset[];
  onboardings: OnboardingRecord[];
  offboardings: OffboardingRecord[];
  requests: RequestRecord[];
  borrowings: BorrowingRecord[];
  preventiveMaintenance: PreventiveMaintenanceRecord[];
  liabilities: LiabilityRecord[];
  activityLogs: ActivityLog[];
  settings: SystemSettings;
  dropdownOptions: DropdownOptionsConfig;

  // Dropdown & Category Operations
  updateDropdownOptions: (newOptions: Partial<DropdownOptionsConfig>) => Promise<void>;
  addDropdownOption: (categoryKey: keyof DropdownOptionsConfig, value: string) => Promise<void>;
  editDropdownOption: (categoryKey: keyof DropdownOptionsConfig, oldValue: string, newValue: string, updateExistingRecords?: boolean) => Promise<void>;
  deleteDropdownOption: (categoryKey: keyof DropdownOptionsConfig, value: string) => Promise<void>;
  resetDropdownCategoryToDefault: (categoryKey: keyof DropdownOptionsConfig) => Promise<void>;

  // Official Measurement of Target - IT 2026
  kpi2026: KPITargets2026Data;
  updateKPI2026: (updates: Partial<KPITargets2026Data>) => Promise<void>;
  resetKPI2026ToDefaults: () => Promise<void>;
  autoSyncKPIFromSystem: () => Promise<KPITargets2026Data>;
  addOrientationSession: (session: Omit<OrientationSessionLog, 'id' | 'createdAt'>) => Promise<void>;
  deleteOrientationSession: (id: string) => Promise<void>;
  addNetsuiteConcern: (concern: Omit<NetsuiteConcernLog, 'id' | 'createdAt'>) => Promise<void>;
  deleteNetsuiteConcern: (id: string) => Promise<void>;

  // CRUD Asset & Custody Transfer
  addAsset: (asset: Omit<Asset, 'id' | 'createdAt' | 'updatedAt'>) => Promise<string>;
  updateAsset: (id: string, updates: Partial<Asset>) => Promise<void>;
  deleteAsset: (id: string) => Promise<void>;
  transferAsset: (transferData: AssetCustodyTransfer) => Promise<void>;
  markAssetPMSDone: (assetId: string, pmsHalf: '1st Half' | '2nd Half' | 'Both', technician: string, remarks?: string) => Promise<void>;

  // CRUD Onboarding
  addOnboarding: (rec: Omit<OnboardingRecord, 'id' | 'createdAt' | 'updatedAt'>) => Promise<string>;
  updateOnboarding: (id: string, updates: Partial<OnboardingRecord>) => Promise<void>;
  deleteOnboarding: (id: string) => Promise<void>;

  // CRUD Offboarding
  addOffboarding: (rec: Omit<OffboardingRecord, 'id' | 'createdAt' | 'updatedAt'>) => Promise<string>;
  updateOffboarding: (id: string, updates: Partial<OffboardingRecord>) => Promise<void>;
  deleteOffboarding: (id: string) => Promise<void>;

  // CRUD Request
  addRequest: (rec: Omit<RequestRecord, 'id' | 'createdAt' | 'updatedAt'>) => Promise<string>;
  updateRequest: (id: string, updates: Partial<RequestRecord>) => Promise<void>;
  deleteRequest: (id: string) => Promise<void>;

  // CRUD Borrowing
  addBorrowing: (rec: Omit<BorrowingRecord, 'id' | 'createdAt' | 'updatedAt'>) => Promise<string>;
  updateBorrowing: (id: string, updates: Partial<BorrowingRecord>) => Promise<void>;
  deleteBorrowing: (id: string) => Promise<void>;

  // CRUD Preventive Maintenance
  addPreventiveMaintenance: (rec: Omit<PreventiveMaintenanceRecord, 'id' | 'createdAt' | 'updatedAt'>) => Promise<string>;
  updatePreventiveMaintenance: (id: string, updates: Partial<PreventiveMaintenanceRecord>) => Promise<void>;
  deletePreventiveMaintenance: (id: string) => Promise<void>;

  // CRUD Liability
  addLiability: (rec: Omit<LiabilityRecord, 'id' | 'createdAt' | 'updatedAt'>) => Promise<string>;
  updateLiability: (id: string, updates: Partial<LiabilityRecord>) => Promise<void>;
  deleteLiability: (id: string) => Promise<void>;

  // Audit
  logActivity: (action: string, targetEntity: string, targetId: string, details: string) => Promise<void>;

  // Settings & DB Management
  updateSettings: (newSettings: Partial<SystemSettings>) => Promise<void>;
  seedInitialDataToFirebase: () => Promise<void>;
  seedInitialDataToSupabase: () => Promise<void>;
  clearAllData: () => Promise<void>;
  clearAssetsOnly: () => Promise<void>;
  clearDataWithPassword: (password: string, clearScope: 'all' | 'assets' | 'requests' | 'borrowings') => Promise<{ success: boolean; message: string }>;
  createBackupSnapshot: () => void;
  restoreBackupSnapshot: (jsonData: string) => Promise<void>;
  refreshFromSupabase: () => Promise<void>;

  // Auth & Roles & Google Workspace
  currentUser: UserProfile;
  setCurrentUser: (user: UserProfile) => void;
  setUserRole: (role: UserRole) => void;
  signInWithGoogleWorkspace: () => Promise<void>;
  logoutGoogleWorkspace: () => Promise<void>;
  isGoogleWorkspaceLoggedIn: boolean;
  language: LanguageCode;
  setLanguage: (lang: LanguageCode) => void;
  t: (key: string) => string;

  // Cloud Database (Supabase PostgreSQL) State
  isOnline: boolean;
  isFirebaseConnected: boolean; // Aliased to isSupabaseConnected for backward compatibility
  isSupabaseConnected: boolean;
  supabaseHost: string;
  isCloudLoading: boolean;
  cloudDatabaseId: string;
  alerts: AlertNotification[];
  markAlertRead: (id: string) => void;
  clearAllAlerts: () => void;

  // Global UI State
  quickSearchQuery: string;
  setQuickSearchQuery: (q: string) => void;
  selectedAssetForQR: Asset | null;
  setSelectedAssetForQR: (asset: Asset | null) => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const ITMContext = createContext<ITMContextType | undefined>(undefined);

const SUPABASE_HOST = 'aws-0-ap-northeast-1.pooler.supabase.com';

export const ITMProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Pure Supabase PostgreSQL State - initialized with baseline enterprise records for zero UI flicker/locking
  const [assets, setAssets] = useState<Asset[]>(SEED_ASSETS);
  const [onboardings, setOnboardings] = useState<OnboardingRecord[]>(SEED_ONBOARDINGS);
  const [offboardings, setOffboardings] = useState<OffboardingRecord[]>(SEED_OFFBOARDINGS);
  const [requests, setRequests] = useState<RequestRecord[]>(SEED_REQUESTS);
  const [borrowings, setBorrowings] = useState<BorrowingRecord[]>(SEED_BORROWINGS);
  const [preventiveMaintenance, setPreventiveMaintenance] = useState<PreventiveMaintenanceRecord[]>(SEED_PREVENTIVE_MAINTENANCE);
  const [liabilities, setLiabilities] = useState<LiabilityRecord[]>(SEED_LIABILITIES);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>(SEED_ACTIVITY_LOGS);
  const [settings, setSettingsState] = useState<SystemSettings>(INITIAL_SETTINGS);
  const [dropdownOptions, setDropdownOptionsState] = useState<DropdownOptionsConfig>(DEFAULT_DROPDOWN_OPTIONS);
  const [kpi2026, setKpi2026] = useState<KPITargets2026Data>(SEED_KPI_2026);

  const [currentUser, setCurrentUser] = useState<UserProfile>({
    name: 'JM Montojo',
    email: 'jmmontojo2022@gmail.com',
    role: 'Super Admin',
    department: 'IT Infrastructure & Security',
    adId: 'CORP\\jmmontojo',
  });

  const [isGoogleWorkspaceLoggedIn, setIsGoogleWorkspaceLoggedIn] = useState<boolean>(false);
  const [language, setLanguage] = useState<LanguageCode>('en');
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [isSupabaseConnected, setIsSupabaseConnected] = useState<boolean>(true);
  const [isCloudLoading, setIsCloudLoading] = useState<boolean>(false);
  const [quickSearchQuery, setQuickSearchQuery] = useState<string>('');
  const [selectedAssetForQR, setSelectedAssetForQR] = useState<Asset | null>(null);
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [alerts, setAlerts] = useState<AlertNotification[]>([]);

  // Clear legacy local storage keys
  useEffect(() => {
    try {
      const keysToPurge = [
        'assets', 'onboardings', 'offboardings', 'requests', 'borrowings',
        'pm', 'liabilities', 'activity_logs', 'settings', 'dropdown_options', 'kpi_2026', 'cleared'
      ];
      keysToPurge.forEach(k => localStorage.removeItem('itm_pro_' + k));
    } catch {
      // Ignore
    }
  }, []);

  // Online / offline listeners
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Google Workspace Authentication Listener
  useEffect(() => {
    const unsub = initWorkspaceAuthListener((user) => {
      if (user) {
        setIsGoogleWorkspaceLoggedIn(true);
        setCurrentUser(prev => ({
          ...prev,
          name: user.displayName || prev.name,
          email: user.email || prev.email,
          avatarUrl: user.photoURL || undefined,
          role: user.email === 'jmmontojo2022@gmail.com' ? 'Super Admin' : prev.role,
        }));
      } else {
        setIsGoogleWorkspaceLoggedIn(false);
      }
    });

    return () => unsub();
  }, []);

  const signInWithGoogleWorkspace = async () => {
    try {
      const user = await authGoogleSignIn();
      if (user) {
        setIsGoogleWorkspaceLoggedIn(true);
        setCurrentUser(prev => ({
          ...prev,
          name: user.displayName || prev.name,
          email: user.email || prev.email,
          avatarUrl: user.photoURL || undefined,
          role: user.email === 'jmmontojo2022@gmail.com' ? 'Super Admin' : prev.role,
        }));
        await logActivity('WORKSPACE_LOGIN', 'User', user.email || '', `Signed in via Google Workspace (${user.email})`);
      }
    } catch (err: any) {
      console.error('Workspace Login Error:', err);
    }
  };

  const logoutGoogleWorkspace = async () => {
    await authGoogleSignOut();
    setIsGoogleWorkspaceLoggedIn(false);
    await logActivity('WORKSPACE_LOGOUT', 'User', currentUser.email, `Signed out from Google Workspace`);
  };

  // Pull All Data from Supabase PostgreSQL API
  const refreshFromSupabase = useCallback(async () => {
    try {
      const res = await fetch('/api/all-data');
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          if (Array.isArray(data.assets) && data.assets.length > 0) setAssets(data.assets);
          if (Array.isArray(data.onboardings)) setOnboardings(data.onboardings);
          if (Array.isArray(data.offboardings)) setOffboardings(data.offboardings);
          if (Array.isArray(data.requests)) setRequests(data.requests);
          if (Array.isArray(data.borrowings)) setBorrowings(data.borrowings);
          if (Array.isArray(data.preventiveMaintenance)) setPreventiveMaintenance(data.preventiveMaintenance);
          if (Array.isArray(data.liabilities)) setLiabilities(data.liabilities);
          if (Array.isArray(data.activityLogs)) setActivityLogs(data.activityLogs);
          if (data.settings) setSettingsState(data.settings);
          if (data.dropdownOptions) setDropdownOptionsState(data.dropdownOptions);
          if (data.kpi2026) setKpi2026(data.kpi2026);
          setIsSupabaseConnected(true);
        }
      }
    } catch (err) {
      console.warn('[Supabase Sync Notice]:', err);
    } finally {
      setIsCloudLoading(false);
    }
  }, []);

  // Initial load and periodic polling for real-time collaboration
  useEffect(() => {
    refreshFromSupabase();

    // Re-sync on window focus
    const handleFocus = () => {
      refreshFromSupabase();
    };
    window.addEventListener('focus', handleFocus);

    // Poll every 15 seconds for updates
    const interval = setInterval(refreshFromSupabase, 15000);

    return () => {
      window.removeEventListener('focus', handleFocus);
      clearInterval(interval);
    };
  }, [refreshFromSupabase]);

  // Compute Alerts dynamically
  useEffect(() => {
    const newAlerts: AlertNotification[] = [];

    // 1. Low stock alert
    const categoryCounts: Record<string, number> = {};
    assets.forEach(a => {
      if (a.status === 'Available') {
        categoryCounts[a.category] = (categoryCounts[a.category] || 0) + 1;
      }
    });

    Object.entries(settings.lowStockThresholds || {}).forEach(([cat, threshold]) => {
      const count = categoryCounts[cat] || 0;
      if (count < threshold) {
        newAlerts.push({
          id: `alert-stock-${cat}`,
          type: 'low_stock',
          title: `Low Stock Alert: ${cat}`,
          message: `Only ${count} available unit(s) remaining (threshold: ${threshold}). Automated reorder dispatch ready.`,
          date: new Date().toLocaleDateString(),
          read: false,
        });
      }
    });

    // 2. Overdue borrowings
    const nowStr = new Date().toISOString().split('T')[0];
    borrowings.forEach(b => {
      if (b.status === 'Active / Borrowed' && b.returnDate < nowStr) {
        newAlerts.push({
          id: `alert-borrow-${b.id}`,
          type: 'overdue',
          title: `Overdue Loan: ${b.borrowerName}`,
          message: `${b.itemCategory} was due on ${b.returnDate}. Return is overdue.`,
          date: b.returnDate,
          read: false,
        });
      }
    });

    // 3. Warranty expirations within 90 days
    const in90Days = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    assets.forEach(a => {
      if (a.warrantyExpiry && a.warrantyExpiry <= in90Days && a.status !== 'Retired') {
        newAlerts.push({
          id: `alert-warranty-${a.id}`,
          type: 'warranty',
          title: `Warranty Expiration: ${a.assetCode}`,
          message: `${a.employeeOrDeviceName} warranty expires on ${a.warrantyExpiry}. Check renewal or maintenance contract.`,
          date: a.warrantyExpiry,
          read: false,
        });
      }
    });

    setAlerts(newAlerts);
  }, [assets, borrowings, settings.lowStockThresholds]);

  // Translation helper
  const t = useCallback((key: string): string => {
    const dict = TRANSLATIONS[language] || TRANSLATIONS['en'];
    return dict[key] || TRANSLATIONS['en'][key] || key;
  }, [language]);

  // Log activity helper
  const logActivity = async (action: string, targetEntity: string, targetId: string, details: string) => {
    const newLog: ActivityLog = {
      id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      actor: `${currentUser.email} (${currentUser.role})`,
      action,
      targetEntity,
      targetId,
      details,
    };

    setActivityLogs(prev => [newLog, ...prev]);

    try {
      await fetch('/api/activity-logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newLog),
      });
    } catch (err) {
      console.warn('Activity log sync notice:', err);
    }
  };

  // CRUD ASSETS
  const addAsset = async (assetData: Omit<Asset, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
    const id = `ast-${Date.now()}`;
    const now = new Date().toISOString();
    const newAsset: Asset = {
      ...assetData,
      id,
      createdAt: now,
      updatedAt: now,
    };

    setAssets(prev => [newAsset, ...prev]);
    await logActivity('ASSET_CREATE', 'Asset', newAsset.assetCode, `Created asset ${newAsset.employeeOrDeviceName} (${newAsset.assetCode})`);

    try {
      await fetch('/api/assets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newAsset),
      });
    } catch (err) {
      console.error('Asset creation error:', err);
    }
    return id;
  };

  const updateAsset = async (id: string, updates: Partial<Asset>) => {
    const now = new Date().toISOString();
    setAssets(prev => prev.map(a => a.id === id ? { ...a, ...updates, updatedAt: now } : a));
    const target = assets.find(a => a.id === id);
    const updated = { ...(target || {}), ...updates, id, updatedAt: now } as Asset;

    await logActivity('ASSET_UPDATE', 'Asset', target?.assetCode || id, `Updated asset fields: ${Object.keys(updates).join(', ')}`);

    try {
      await fetch(`/api/assets/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated),
      });
    } catch (err) {
      console.error('Asset update error:', err);
    }
  };

  const deleteAsset = async (id: string) => {
    const target = assets.find(a => a.id === id);
    setAssets(prev => prev.filter(a => a.id !== id));
    await logActivity('ASSET_DELETE', 'Asset', target?.assetCode || id, `Deleted asset ${target?.employeeOrDeviceName}`);

    try {
      await fetch(`/api/assets/${id}`, { method: 'DELETE' });
    } catch (err) {
      console.error('Asset delete error:', err);
    }
  };

  // ASSET CUSTODY TRANSFER & TURNOVER
  const transferAsset = async (transferData: AssetCustodyTransfer) => {
    const asset = assets.find(a => 
      a.id === transferData.id || 
      a.employeeOrDeviceName === transferData.fromEmployee ||
      a.assetCode === transferData.turnoverReceiptNumber
    );

    const now = new Date().toISOString();
    let targetAssetId = asset?.id;

    if (!targetAssetId) {
      const match = assets.find(a => 
        a.employeeOrDeviceName.toLowerCase().includes(transferData.fromEmployee.toLowerCase())
      );
      if (match) targetAssetId = match.id;
    }

    if (targetAssetId) {
      const target = assets.find(a => a.id === targetAssetId)!;
      const history = target.custodyHistory || [];
      const updatedHistory = [transferData, ...history];

      const newStatus = transferData.toEmployee === 'IT Reserve Pool' || transferData.toEmployee === 'IT Department' 
        ? 'Available' 
        : 'In Use';

      await updateAsset(targetAssetId, {
        employeeOrDeviceName: transferData.toEmployee,
        department: transferData.toDepartment,
        location: transferData.toBranch || target.location,
        status: newStatus as any,
        custodyHistory: updatedHistory,
        updatedAt: now,
      });

      await logActivity(
        'ASSET_CUSTODY_TRANSFER',
        'Asset',
        target.assetCode,
        `Device custody transferred from ${transferData.fromEmployee} (${transferData.fromDepartment}) to ${transferData.toEmployee} (${transferData.toDepartment}). Reason: ${transferData.reason}. Turnover Ref: ${transferData.turnoverReceiptNumber}`
      );
    } else {
      await logActivity(
        'CUSTODY_TRANSFER_LOG',
        'TurnoverSlip',
        transferData.turnoverReceiptNumber,
        `Turnover recorded from ${transferData.fromEmployee} to ${transferData.toEmployee}. Reason: ${transferData.reason}`
      );
    }
  };

  // MARK PMS DONE ON ASSET
  const markAssetPMSDone = async (
    assetId: string, 
    pmsHalf: '1st Half' | '2nd Half' | 'Both', 
    technician: string, 
    remarks?: string
  ) => {
    const target = assets.find(a => a.id === assetId);
    if (!target) return;

    const now = new Date().toISOString();
    const todayStr = now.substring(0, 10);

    await updateAsset(assetId, {
      pmsCompleted: true,
      pmsHalf,
      pmsDate: todayStr,
      pmsTechnician: technician,
      pmsRemarks: remarks || 'Semi-annual preventive maintenance diagnostics completed.',
      updatedAt: now,
    });

    await addPreventiveMaintenance({
      description: `${target.employeeOrDeviceName} - ${target.specificationOrSN} (${target.category})`,
      date: todayStr,
      datePurchase: target.purchaseDate || todayStr,
      assetCode: target.assetCode,
      activityWorkDone: `PMS (${pmsHalf}) certified. Diagnostics completed.`,
      performedBy: technician,
      status: 'Completed',
      recommendation: remarks || 'Diagnostics passed. Continue regular maintenance.',
      department: target.department || 'IT Operations',
      nextMaintenanceDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString().substring(0, 10),
    });

    await logActivity(
      'PMS_COMPLETED',
      'Asset',
      target.assetCode,
      `Marked PMS (${pmsHalf}) as Completed for ${target.employeeOrDeviceName} (${target.assetCode}) by ${technician}`
    );
  };

  // CRUD ONBOARDING
  const addOnboarding = async (rec: Omit<OnboardingRecord, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
    const id = `onb-${Date.now()}`;
    const now = new Date().toISOString();
    const newRec: OnboardingRecord = { ...rec, id, createdAt: now, updatedAt: now };

    setOnboardings(prev => [newRec, ...prev]);
    await logActivity('ONBOARDING_CREATE', 'Onboarding', newRec.employeeName, `Created onboarding for ${newRec.employeeName} (${newRec.position})`);

    try {
      await fetch('/api/onboardings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newRec),
      });
    } catch (err) {
      console.error(err);
    }
    return id;
  };

  const updateOnboarding = async (id: string, updates: Partial<OnboardingRecord>) => {
    const now = new Date().toISOString();
    setOnboardings(prev => prev.map(o => o.id === id ? { ...o, ...updates, updatedAt: now } : o));
    const target = onboardings.find(o => o.id === id);
    const updated = { ...(target || {}), ...updates, id, updatedAt: now } as OnboardingRecord;

    await logActivity('ONBOARDING_UPDATE', 'Onboarding', target?.employeeName || id, `Updated onboarding for ${target?.employeeName}`);

    try {
      await fetch(`/api/onboardings/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated),
      });
    } catch (err) {
      console.error(err);
    }
  };

  const deleteOnboarding = async (id: string) => {
    const target = onboardings.find(o => o.id === id);
    setOnboardings(prev => prev.filter(o => o.id !== id));
    await logActivity('ONBOARDING_DELETE', 'Onboarding', target?.employeeName || id, `Deleted onboarding for ${target?.employeeName}`);

    try {
      await fetch(`/api/onboardings/${id}`, { method: 'DELETE' });
    } catch (err) {
      console.error(err);
    }
  };

  // CRUD OFFBOARDING
  const addOffboarding = async (rec: Omit<OffboardingRecord, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
    const id = `off-${Date.now()}`;
    const now = new Date().toISOString();
    const newRec: OffboardingRecord = { ...rec, id, createdAt: now, updatedAt: now };

    setOffboardings(prev => [newRec, ...prev]);
    await logActivity('OFFBOARDING_CREATE', 'Offboarding', newRec.employeeName, `Created offboarding for ${newRec.employeeName}`);

    try {
      await fetch('/api/offboardings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newRec),
      });
    } catch (err) {
      console.error(err);
    }
    return id;
  };

  const updateOffboarding = async (id: string, updates: Partial<OffboardingRecord>) => {
    const now = new Date().toISOString();
    setOffboardings(prev => prev.map(o => o.id === id ? { ...o, ...updates, updatedAt: now } : o));
    const target = offboardings.find(o => o.id === id);
    const updated = { ...(target || {}), ...updates, id, updatedAt: now } as OffboardingRecord;

    await logActivity('OFFBOARDING_UPDATE', 'Offboarding', target?.employeeName || id, `Updated offboarding for ${target?.employeeName}`);

    try {
      await fetch(`/api/offboardings/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated),
      });
    } catch (err) {
      console.error(err);
    }
  };

  const deleteOffboarding = async (id: string) => {
    const target = offboardings.find(o => o.id === id);
    setOffboardings(prev => prev.filter(o => o.id !== id));
    await logActivity('OFFBOARDING_DELETE', 'Offboarding', target?.employeeName || id, `Deleted offboarding for ${target?.employeeName}`);

    try {
      await fetch(`/api/offboardings/${id}`, { method: 'DELETE' });
    } catch (err) {
      console.error(err);
    }
  };

  // CRUD REQUESTS
  const addRequest = async (rec: Omit<RequestRecord, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
    const id = `req-${Date.now()}`;
    const now = new Date().toISOString();
    const newRec: RequestRecord = { ...rec, id, createdAt: now, updatedAt: now };

    setRequests(prev => [newRec, ...prev]);
    await logActivity('REQUEST_CREATE', 'Request', newRec.referenceNo, `Created ${newRec.requestType} ticket: ${newRec.actionsTakenOrRemarks || newRec.departmentOrBranches}`);

    try {
      await fetch('/api/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newRec),
      });
    } catch (err) {
      console.error(err);
    }
    return id;
  };

  const updateRequest = async (id: string, updates: Partial<RequestRecord>) => {
    const now = new Date().toISOString();
    setRequests(prev => prev.map(r => r.id === id ? { ...r, ...updates, updatedAt: now } : r));
    const target = requests.find(r => r.id === id);
    const updated = { ...(target || {}), ...updates, id, updatedAt: now } as RequestRecord;

    await logActivity('REQUEST_UPDATE', 'Request', target?.referenceNo || id, `Updated request ticket ${target?.referenceNo || id}`);

    try {
      await fetch(`/api/requests/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated),
      });
    } catch (err) {
      console.error(err);
    }
  };

  const deleteRequest = async (id: string) => {
    const target = requests.find(r => r.id === id);
    setRequests(prev => prev.filter(r => r.id !== id));
    await logActivity('REQUEST_DELETE', 'Request', target?.referenceNo || id, `Deleted request ticket ${target?.referenceNo || id}`);

    try {
      await fetch(`/api/requests/${id}`, { method: 'DELETE' });
    } catch (err) {
      console.error(err);
    }
  };

  // CRUD BORROWING
  const addBorrowing = async (rec: Omit<BorrowingRecord, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
    const id = `brw-${Date.now()}`;
    const now = new Date().toISOString();
    const newRec: BorrowingRecord = { ...rec, id, createdAt: now, updatedAt: now };

    setBorrowings(prev => [newRec, ...prev]);
    await logActivity('BORROWING_CREATE', 'Borrowing', newRec.borrowerName, `Borrowed ${newRec.itemCategory} by ${newRec.borrowerName}`);

    try {
      await fetch('/api/borrowings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newRec),
      });
    } catch (err) {
      console.error(err);
    }
    return id;
  };

  const updateBorrowing = async (id: string, updates: Partial<BorrowingRecord>) => {
    const now = new Date().toISOString();
    setBorrowings(prev => prev.map(b => b.id === id ? { ...b, ...updates, updatedAt: now } : b));
    const target = borrowings.find(b => b.id === id);
    const updated = { ...(target || {}), ...updates, id, updatedAt: now } as BorrowingRecord;

    await logActivity('BORROWING_UPDATE', 'Borrowing', target?.borrowerName || id, `Updated borrowing for ${target?.borrowerName}`);

    try {
      await fetch(`/api/borrowings/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated),
      });
    } catch (err) {
      console.error(err);
    }
  };

  const deleteBorrowing = async (id: string) => {
    const target = borrowings.find(b => b.id === id);
    setBorrowings(prev => prev.filter(b => b.id !== id));
    await logActivity('BORROWING_DELETE', 'Borrowing', target?.borrowerName || id, `Deleted borrowing for ${target?.borrowerName}`);

    try {
      await fetch(`/api/borrowings/${id}`, { method: 'DELETE' });
    } catch (err) {
      console.error(err);
    }
  };

  // CRUD PREVENTIVE MAINTENANCE
  const addPreventiveMaintenance = async (rec: Omit<PreventiveMaintenanceRecord, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
    const id = `pm-${Date.now()}`;
    const now = new Date().toISOString();
    const newRec: PreventiveMaintenanceRecord = { ...rec, id, createdAt: now, updatedAt: now };

    setPreventiveMaintenance(prev => [newRec, ...prev]);
    await logActivity('PM_CREATE', 'PreventiveMaintenance', newRec.assetCode, `Logged maintenance for ${newRec.assetCode}`);

    try {
      await fetch('/api/preventive-maintenance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newRec),
      });
    } catch (err) {
      console.error(err);
    }
    return id;
  };

  const updatePreventiveMaintenance = async (id: string, updates: Partial<PreventiveMaintenanceRecord>) => {
    const now = new Date().toISOString();
    setPreventiveMaintenance(prev => prev.map(p => p.id === id ? { ...p, ...updates, updatedAt: now } : p));
    const target = preventiveMaintenance.find(p => p.id === id);
    const updated = { ...(target || {}), ...updates, id, updatedAt: now } as PreventiveMaintenanceRecord;

    await logActivity('PM_UPDATE', 'PreventiveMaintenance', target?.assetCode || id, `Updated maintenance for ${target?.assetCode}`);

    try {
      await fetch(`/api/preventive-maintenance/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated),
      });
    } catch (err) {
      console.error(err);
    }
  };

  const deletePreventiveMaintenance = async (id: string) => {
    const target = preventiveMaintenance.find(p => p.id === id);
    setPreventiveMaintenance(prev => prev.filter(p => p.id !== id));
    await logActivity('PM_DELETE', 'PreventiveMaintenance', target?.assetCode || id, `Deleted maintenance for ${target?.assetCode}`);

    try {
      await fetch(`/api/preventive-maintenance/${id}`, { method: 'DELETE' });
    } catch (err) {
      console.error(err);
    }
  };

  // CRUD LIABILITY
  const addLiability = async (rec: Omit<LiabilityRecord, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
    const id = `lia-${Date.now()}`;
    const now = new Date().toISOString();
    const newRec: LiabilityRecord = { ...rec, id, createdAt: now, updatedAt: now };

    setLiabilities(prev => [newRec, ...prev]);
    await logActivity('LIABILITY_CREATE', 'Liability', newRec.employeeName, `Created liability for ${newRec.employeeName}: ${newRec.itemDescription}`);

    try {
      await fetch('/api/liabilities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newRec),
      });
    } catch (err) {
      console.error(err);
    }
    return id;
  };

  const updateLiability = async (id: string, updates: Partial<LiabilityRecord>) => {
    const now = new Date().toISOString();
    setLiabilities(prev => prev.map(l => l.id === id ? { ...l, ...updates, updatedAt: now } : l));
    const target = liabilities.find(l => l.id === id);
    const updated = { ...(target || {}), ...updates, id, updatedAt: now } as LiabilityRecord;

    await logActivity('LIABILITY_UPDATE', 'Liability', target?.employeeName || id, `Updated liability for ${target?.employeeName}`);

    try {
      await fetch(`/api/liabilities/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated),
      });
    } catch (err) {
      console.error(err);
    }
  };

  const deleteLiability = async (id: string) => {
    const target = liabilities.find(l => l.id === id);
    setLiabilities(prev => prev.filter(l => l.id !== id));
    await logActivity('LIABILITY_DELETE', 'Liability', target?.employeeName || id, `Deleted liability for ${target?.employeeName}`);

    try {
      await fetch(`/api/liabilities/${id}`, { method: 'DELETE' });
    } catch (err) {
      console.error(err);
    }
  };

  // SETTINGS
  const updateSettings = async (newSettings: Partial<SystemSettings>) => {
    const updated = { ...settings, ...newSettings };
    setSettingsState(updated);
    await logActivity('SETTINGS_UPDATE', 'System', 'global', 'Updated system configuration parameters');

    try {
      await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated),
      });
    } catch (err) {
      console.error(err);
    }
  };

  // DROPDOWN & CATEGORY OPERATIONS
  const updateDropdownOptions = async (newOptions: Partial<DropdownOptionsConfig>) => {
    const updated = { ...dropdownOptions, ...newOptions };
    setDropdownOptionsState(updated);
    await logActivity('DROPDOWN_UPDATE', 'Category', 'all', 'Updated dropdown category masters');

    try {
      await fetch('/api/dropdown-options', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated),
      });
    } catch (err) {
      console.error(err);
    }
  };

  const addDropdownOption = async (categoryKey: keyof DropdownOptionsConfig, value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return;
    const currentList = dropdownOptions[categoryKey] || [];
    if (currentList.includes(trimmed)) return;

    const updatedList = [...currentList, trimmed];
    const updatedConfig = { ...dropdownOptions, [categoryKey]: updatedList };
    await updateDropdownOptions(updatedConfig);
    await logActivity('DROPDOWN_OPTION_ADD', 'Category', categoryKey, `Added "${trimmed}" to ${categoryKey}`);
  };

  const editDropdownOption = async (
    categoryKey: keyof DropdownOptionsConfig,
    oldValue: string,
    newValue: string,
    updateExistingRecords = true
  ) => {
    const trimmedNew = newValue.trim();
    if (!trimmedNew || oldValue === trimmedNew) return;

    const currentList = dropdownOptions[categoryKey] || [];
    const updatedList = currentList.map(item => item === oldValue ? trimmedNew : item);
    const updatedConfig = { ...dropdownOptions, [categoryKey]: updatedList };
    await updateDropdownOptions(updatedConfig);
    await logActivity('DROPDOWN_OPTION_EDIT', 'Category', categoryKey, `Renamed "${oldValue}" to "${trimmedNew}"`);

    if (updateExistingRecords) {
      if (categoryKey === 'departments') {
        assets.forEach(a => { if (a.department === oldValue) updateAsset(a.id, { department: trimmedNew }); });
      } else if (categoryKey === 'branches') {
        assets.forEach(a => { if (a.location === oldValue) updateAsset(a.id, { location: trimmedNew }); });
      } else if (categoryKey === 'assetCategories') {
        assets.forEach(a => { if (a.category === oldValue) updateAsset(a.id, { category: trimmedNew }); });
      } else if (categoryKey === 'assetStatuses') {
        assets.forEach(a => { if (a.status === oldValue) updateAsset(a.id, { status: trimmedNew as any }); });
      }
    }
  };

  const deleteDropdownOption = async (categoryKey: keyof DropdownOptionsConfig, value: string) => {
    const currentList = dropdownOptions[categoryKey] || [];
    const updatedList = currentList.filter(item => item !== value);
    const updatedConfig = { ...dropdownOptions, [categoryKey]: updatedList };
    await updateDropdownOptions(updatedConfig);
    await logActivity('DROPDOWN_OPTION_DELETE', 'Category', categoryKey, `Removed "${value}" from ${categoryKey}`);
  };

  const resetDropdownCategoryToDefault = async (categoryKey: keyof DropdownOptionsConfig) => {
    const defaultList = DEFAULT_DROPDOWN_OPTIONS[categoryKey];
    const updatedConfig = { ...dropdownOptions, [categoryKey]: defaultList };
    await updateDropdownOptions(updatedConfig);
    await logActivity('DROPDOWN_CATEGORY_RESET', 'Category', categoryKey, `Reset ${categoryKey} to factory defaults`);
  };

  // KPI 2026 OPERATIONS
  const updateKPI2026 = async (updates: Partial<KPITargets2026Data>) => {
    const merged: KPITargets2026Data = {
      ...kpi2026,
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    setKpi2026(merged);
    await logActivity('KPI_UPDATE', 'KPI2026', 'targets', 'Updated IT 2026 Target records');

    try {
      await fetch('/api/kpi-2026', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(merged),
      });
    } catch (err) {
      console.error(err);
    }
  };

  const resetKPI2026ToDefaults = async () => {
    setKpi2026(SEED_KPI_2026);
    await logActivity('KPI_RESET', 'KPI2026', 'targets', 'Reset IT 2026 Targets to baseline');
    try {
      await fetch('/api/kpi-2026', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(SEED_KPI_2026),
      });
    } catch (err) {
      console.error(err);
    }
  };

  const autoSyncKPIFromSystem = async (): Promise<KPITargets2026Data> => {
    const pmsDoneFirstHalf = assets.filter(a => a.pmsCompleted && (a.pmsHalf === '1st Half' || a.pmsHalf === 'Both')).length;
    const pmsDoneSecondHalf = assets.filter(a => a.pmsCompleted && (a.pmsHalf === '2nd Half' || a.pmsHalf === 'Both')).length;

    const locationTargets: Record<string, { planned: number; actualDoneFirstHalf: number; actualDoneSecondHalf: number }> = {
      ...(kpi2026.pms.locationTargets || {})
    };
    (dropdownOptions.branches || []).forEach(branch => {
      const branchAssets = assets.filter(a => 
        (a.location && a.location.toLowerCase().includes(branch.toLowerCase())) ||
        (a.department && a.department.toLowerCase().includes(branch.toLowerCase()))
      );
      const firstHalfDone = branchAssets.filter(a => a.pmsCompleted && (a.pmsHalf === '1st Half' || a.pmsHalf === 'Both')).length;
      const secondHalfDone = branchAssets.filter(a => a.pmsCompleted && (a.pmsHalf === '2nd Half' || a.pmsHalf === 'Both')).length;
      if (!locationTargets[branch]) {
        locationTargets[branch] = { 
          planned: Math.max(10, branchAssets.length || 15), 
          actualDoneFirstHalf: firstHalfDone, 
          actualDoneSecondHalf: secondHalfDone 
        };
      } else {
        locationTargets[branch].actualDoneFirstHalf = firstHalfDone > 0 ? firstHalfDone : locationTargets[branch].actualDoneFirstHalf;
        locationTargets[branch].actualDoneSecondHalf = secondHalfDone > 0 ? secondHalfDone : locationTargets[branch].actualDoneSecondHalf;
      }
    });

    const updated: KPITargets2026Data = {
      ...kpi2026,
      pms: {
        firstHalf: {
          planned: kpi2026.pms.firstHalf.planned || 161,
          actualDone: pmsDoneFirstHalf > 0 ? pmsDoneFirstHalf : kpi2026.pms.firstHalf.actualDone,
        },
        secondHalf: {
          planned: kpi2026.pms.secondHalf.planned || 161,
          actualDone: pmsDoneSecondHalf > 0 ? pmsDoneSecondHalf : kpi2026.pms.secondHalf.actualDone,
        },
        locationTargets,
      },
      updatedAt: new Date().toISOString(),
    };

    await updateKPI2026(updated);
    return updated;
  };

  const addOrientationSession = async (session: Omit<OrientationSessionLog, 'id' | 'createdAt'>) => {
    const id = `ori-${Date.now()}`;
    const newSession: OrientationSessionLog = { ...session, id, createdAt: new Date().toISOString() };
    const currentSessions = kpi2026.orientationSessions || [];
    const updatedSessions = [newSession, ...currentSessions];

    const dateObj = new Date(session.date);
    const monthIndex = isNaN(dateObj.getMonth()) ? 0 : dateObj.getMonth();
    const monthName = MONTHS_LIST[monthIndex] || 'January';

    const currentMonthData = kpi2026.orientations[monthName] || { conductedNetsuite: 0, scheduledNetsuite: 0, conductedBasic: 0, scheduledBasic: 0 };
    const isNetsuite = session.category === 'NetSuite System Training';
    const updatedMonthData = {
      ...currentMonthData,
      conductedNetsuite: isNetsuite && session.status === 'Conducted' ? currentMonthData.conductedNetsuite + 1 : currentMonthData.conductedNetsuite,
      scheduledNetsuite: isNetsuite ? currentMonthData.scheduledNetsuite + 1 : currentMonthData.scheduledNetsuite,
      conductedBasic: !isNetsuite && session.status === 'Conducted' ? currentMonthData.conductedBasic + 1 : currentMonthData.conductedBasic,
      scheduledBasic: !isNetsuite ? currentMonthData.scheduledBasic + 1 : currentMonthData.scheduledBasic,
    };

    const updatedKPI: Partial<KPITargets2026Data> = {
      orientationSessions: updatedSessions,
      orientations: {
        ...kpi2026.orientations,
        [monthName]: updatedMonthData,
      }
    };
    await updateKPI2026(updatedKPI);
  };

  const deleteOrientationSession = async (id: string) => {
    const updatedSessions = (kpi2026.orientationSessions || []).filter(s => s.id !== id);
    await updateKPI2026({ orientationSessions: updatedSessions });
  };

  const addNetsuiteConcern = async (concern: Omit<NetsuiteConcernLog, 'id' | 'createdAt'>) => {
    const id = `ns-${Date.now()}`;
    const newConcern: NetsuiteConcernLog = { ...concern, id, createdAt: new Date().toISOString() };
    const currentConcerns = kpi2026.netsuiteConcerns || [];
    const updatedConcerns = [newConcern, ...currentConcerns];

    const dateObj = new Date(concern.dateReported);
    const monthIndex = isNaN(dateObj.getMonth()) ? 0 : dateObj.getMonth();
    const monthName = MONTHS_LIST[monthIndex] || 'January';

    const currentMonthData = kpi2026.netsuite[monthName] || { minorResolvedDays: 0, minorReported: 0, majorResolvedDays: 0, majorReported: 0 };
    const isMinor = concern.priority.includes('Minor');
    const updatedMonthData = {
      ...currentMonthData,
      minorReported: isMinor ? currentMonthData.minorReported + 1 : currentMonthData.minorReported,
      minorResolvedDays: isMinor && concern.resolvedOnTime ? currentMonthData.minorResolvedDays + Number(concern.daysToResolve || 1) : currentMonthData.minorResolvedDays,
      majorReported: !isMinor ? currentMonthData.majorReported + 1 : currentMonthData.majorReported,
      majorResolvedDays: !isMinor && concern.resolvedOnTime ? currentMonthData.majorResolvedDays + Number(concern.daysToResolve || 1) : currentMonthData.majorResolvedDays,
    };

    const updatedKPI: Partial<KPITargets2026Data> = {
      netsuiteConcerns: updatedConcerns,
      netsuite: {
        ...kpi2026.netsuite,
        [monthName]: updatedMonthData,
      }
    };
    await updateKPI2026(updatedKPI);
  };

  const deleteNetsuiteConcern = async (id: string) => {
    const updatedConcerns = (kpi2026.netsuiteConcerns || []).filter(c => c.id !== id);
    await updateKPI2026({ netsuiteConcerns: updatedConcerns });
  };

  // Seed Initial Data to Supabase
  const seedInitialDataToSupabase = async () => {
    try {
      const res = await fetch('/api/seed', { method: 'POST' });
      if (res.ok) {
        await refreshFromSupabase();
        await logActivity('DATABASE_SEED', 'Supabase', 'all', 'Seeded initial enterprise dataset to Supabase PostgreSQL');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const seedInitialDataToFirebase = seedInitialDataToSupabase; // Alias for backward compatibility

  // Clear All Data
  const clearAllData = async () => {
    setAssets([]);
    setOnboardings([]);
    setOffboardings([]);
    setRequests([]);
    setBorrowings([]);
    setPreventiveMaintenance([]);
    setLiabilities([]);
    setActivityLogs([]);

    try {
      await fetch('/api/clear-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: 'ITAdmin@2026', scope: 'all' })
      });
      await logActivity('SYSTEM_CLEARED', 'Supabase', 'all', 'All system data and inventory records cleared from Supabase');
    } catch (err) {
      console.error(err);
    }
  };

  const clearAssetsOnly = async () => {
    setAssets([]);
    try {
      await fetch('/api/clear-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: 'ITAdmin@2026', scope: 'assets' })
      });
      await logActivity('ASSETS_CLEARED', 'Supabase', 'assets', 'All inventory asset records cleared from Supabase');
    } catch (err) {
      console.error(err);
    }
  };

  const clearDataWithPassword = async (
    password: string, 
    clearScope: 'all' | 'assets' | 'requests' | 'borrowings'
  ): Promise<{ success: boolean; message: string }> => {
    const expectedPassword = settings.masterAdminPassword || 'ITAdmin@2026';
    if (password !== expectedPassword) {
      return { success: false, message: 'Invalid IT Admin Master Password. Access denied.' };
    }

    try {
      const res = await fetch('/api/clear-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password, scope: clearScope })
      });
      const data = await res.json();
      if (data.success) {
        if (clearScope === 'all') {
          setAssets([]);
          setOnboardings([]);
          setOffboardings([]);
          setRequests([]);
          setBorrowings([]);
          setPreventiveMaintenance([]);
          setLiabilities([]);
          setActivityLogs([]);
        } else if (clearScope === 'assets') {
          setAssets([]);
        } else if (clearScope === 'requests') {
          setRequests([]);
        } else if (clearScope === 'borrowings') {
          setBorrowings([]);
        }
        return { success: true, message: data.message || 'Data wiped from Supabase successfully.' };
      }
      return { success: false, message: data.message || 'Operation failed.' };
    } catch (err: any) {
      return { success: false, message: err.message || 'Network error.' };
    }
  };

  // ROLE & USER PERMISSIONS
  const setUserRole = (role: UserRole) => {
    setCurrentUser(prev => ({ ...prev, role }));
  };

  // Backup & Restore
  const createBackupSnapshot = () => {
    const snapshot = {
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      system: 'ITM Pro Enterprise Cloud',
      database: 'Supabase PostgreSQL (' + SUPABASE_HOST + ')',
      company: settings.companyName,
      data: {
        assets,
        onboardings,
        offboardings,
        requests,
        borrowings,
        preventiveMaintenance,
        liabilities,
        activityLogs,
        settings,
        dropdownOptions,
        kpi2026,
      }
    };

    const blob = new Blob([JSON.stringify(snapshot, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ITM_Supabase_Backup_${new Date().toISOString().substring(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);

    updateSettings({ lastBackupDate: new Date().toISOString() });
    logActivity('BACKUP_EXPORT', 'Supabase', 'snapshot', 'Created full JSON snapshot backup of Supabase database');
  };

  const restoreBackupSnapshot = async (jsonData: string) => {
    try {
      const parsed = JSON.parse(jsonData);
      if (parsed.data) {
        const res = await fetch('/api/restore-backup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ data: parsed.data })
        });
        if (res.ok) {
          await refreshFromSupabase();
          await logActivity('BACKUP_RESTORE', 'Supabase', 'snapshot', 'Restored ITM database directly into Supabase');
        }
      }
    } catch (err) {
      console.error('Failed to parse backup JSON:', err);
      throw new Error('Invalid backup file format');
    }
  };

  const markAlertRead = (id: string) => {
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, read: true } : a));
  };

  const clearAllAlerts = () => {
    setAlerts([]);
  };

  return (
    <ITMContext.Provider
      value={{
        assets,
        onboardings,
        offboardings,
        requests,
        borrowings,
        preventiveMaintenance,
        liabilities,
        activityLogs,
        settings,
        dropdownOptions,
        updateDropdownOptions,
        addDropdownOption,
        editDropdownOption,
        deleteDropdownOption,
        resetDropdownCategoryToDefault,
        kpi2026,
        updateKPI2026,
        resetKPI2026ToDefaults,
        autoSyncKPIFromSystem,
        addOrientationSession,
        deleteOrientationSession,
        addNetsuiteConcern,
        deleteNetsuiteConcern,
        addAsset,
        updateAsset,
        deleteAsset,
        transferAsset,
        markAssetPMSDone,
        addOnboarding,
        updateOnboarding,
        deleteOnboarding,
        addOffboarding,
        updateOffboarding,
        deleteOffboarding,
        addRequest,
        updateRequest,
        deleteRequest,
        addBorrowing,
        updateBorrowing,
        deleteBorrowing,
        addPreventiveMaintenance,
        updatePreventiveMaintenance,
        deletePreventiveMaintenance,
        addLiability,
        updateLiability,
        deleteLiability,
        logActivity,
        updateSettings,
        seedInitialDataToFirebase,
        seedInitialDataToSupabase,
        clearAllData,
        clearAssetsOnly,
        clearDataWithPassword,
        createBackupSnapshot,
        restoreBackupSnapshot,
        refreshFromSupabase,
        currentUser,
        setCurrentUser,
        setUserRole,
        signInWithGoogleWorkspace,
        logoutGoogleWorkspace,
        isGoogleWorkspaceLoggedIn,
        language,
        setLanguage,
        t,
        isOnline,
        isFirebaseConnected: isSupabaseConnected,
        isSupabaseConnected,
        supabaseHost: SUPABASE_HOST,
        isCloudLoading,
        cloudDatabaseId: SUPABASE_HOST,
        alerts,
        markAlertRead,
        clearAllAlerts,
        quickSearchQuery,
        setQuickSearchQuery,
        selectedAssetForQR,
        setSelectedAssetForQR,
        activeTab,
        setActiveTab,
      }}
    >
      {children}
    </ITMContext.Provider>
  );
};

export const useITM = () => {
  const context = useContext(ITMContext);
  if (!context) {
    throw new Error('useITM must be used within an ITMProvider');
  }
  return context;
};
