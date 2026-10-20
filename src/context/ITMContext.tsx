import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { 
  collection, 
  onSnapshot, 
  doc, 
  setDoc, 
  deleteDoc, 
  updateDoc,
  getDocs 
} from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType, initAuthListener, testConnection } from '../firebase/config';
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
  LanguageCode 
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
  INITIAL_SETTINGS 
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

  // CRUD Asset
  addAsset: (asset: Omit<Asset, 'id' | 'createdAt' | 'updatedAt'>) => Promise<string>;
  updateAsset: (id: string, updates: Partial<Asset>) => Promise<void>;
  deleteAsset: (id: string) => Promise<void>;

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
  clearAllData: () => Promise<void>;
  clearAssetsOnly: () => Promise<void>;
  createBackupSnapshot: () => void;
  restoreBackupSnapshot: (jsonData: string) => Promise<void>;

  // Auth & Roles
  currentUser: UserProfile;
  setCurrentUser: (user: UserProfile) => void;
  language: LanguageCode;
  setLanguage: (lang: LanguageCode) => void;
  t: (key: string) => string;

  // System & Offline State
  isOnline: boolean;
  isFirebaseConnected: boolean;
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

const LOCAL_STORAGE_PREFIX = 'itm_pro_';

export const ITMProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const isCleared = typeof window !== 'undefined' && localStorage.getItem(LOCAL_STORAGE_PREFIX + 'cleared') === 'true';

  // Local fallback states loaded from localStorage or initial seed
  const [assets, setAssets] = useState<Asset[]>(() => {
    const cached = localStorage.getItem(LOCAL_STORAGE_PREFIX + 'assets');
    if (isCleared) return cached ? JSON.parse(cached) : [];
    return cached ? JSON.parse(cached) : SEED_ASSETS;
  });

  const [onboardings, setOnboardings] = useState<OnboardingRecord[]>(() => {
    const cached = localStorage.getItem(LOCAL_STORAGE_PREFIX + 'onboardings');
    if (isCleared) return cached ? JSON.parse(cached) : [];
    return cached ? JSON.parse(cached) : SEED_ONBOARDINGS;
  });

  const [offboardings, setOffboardings] = useState<OffboardingRecord[]>(() => {
    const cached = localStorage.getItem(LOCAL_STORAGE_PREFIX + 'offboardings');
    if (isCleared) return cached ? JSON.parse(cached) : [];
    return cached ? JSON.parse(cached) : SEED_OFFBOARDINGS;
  });

  const [requests, setRequests] = useState<RequestRecord[]>(() => {
    const cached = localStorage.getItem(LOCAL_STORAGE_PREFIX + 'requests');
    if (isCleared) return cached ? JSON.parse(cached) : [];
    return cached ? JSON.parse(cached) : SEED_REQUESTS;
  });

  const [borrowings, setBorrowings] = useState<BorrowingRecord[]>(() => {
    const cached = localStorage.getItem(LOCAL_STORAGE_PREFIX + 'borrowings');
    if (isCleared) return cached ? JSON.parse(cached) : [];
    return cached ? JSON.parse(cached) : SEED_BORROWINGS;
  });

  const [preventiveMaintenance, setPreventiveMaintenance] = useState<PreventiveMaintenanceRecord[]>(() => {
    const cached = localStorage.getItem(LOCAL_STORAGE_PREFIX + 'pm');
    if (isCleared) return cached ? JSON.parse(cached) : [];
    return cached ? JSON.parse(cached) : SEED_PREVENTIVE_MAINTENANCE;
  });

  const [liabilities, setLiabilities] = useState<LiabilityRecord[]>(() => {
    const cached = localStorage.getItem(LOCAL_STORAGE_PREFIX + 'liabilities');
    if (isCleared) return cached ? JSON.parse(cached) : [];
    return cached ? JSON.parse(cached) : SEED_LIABILITIES;
  });

  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>(() => {
    const cached = localStorage.getItem(LOCAL_STORAGE_PREFIX + 'activity_logs');
    if (isCleared) return cached ? JSON.parse(cached) : [];
    return cached ? JSON.parse(cached) : SEED_ACTIVITY_LOGS;
  });

  const [settings, setSettingsState] = useState<SystemSettings>(() => {
    const cached = localStorage.getItem(LOCAL_STORAGE_PREFIX + 'settings');
    return cached ? JSON.parse(cached) : INITIAL_SETTINGS;
  });

  const [currentUser, setCurrentUser] = useState<UserProfile>({
    name: 'JM Montojo',
    email: 'jmmontojo2022@gmail.com',
    role: 'Admin',
    department: 'IT Infrastructure & Security',
    adId: 'CORP\\jmmontojo',
  });

  const [language, setLanguage] = useState<LanguageCode>('en');
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [isFirebaseConnected, setIsFirebaseConnected] = useState<boolean>(false);
  const [quickSearchQuery, setQuickSearchQuery] = useState<string>('');
  const [selectedAssetForQR, setSelectedAssetForQR] = useState<Asset | null>(null);
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [alerts, setAlerts] = useState<AlertNotification[]>([]);

  // Sync to local storage
  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_PREFIX + 'assets', JSON.stringify(assets));
  }, [assets]);

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_PREFIX + 'onboardings', JSON.stringify(onboardings));
  }, [onboardings]);

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_PREFIX + 'offboardings', JSON.stringify(offboardings));
  }, [offboardings]);

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_PREFIX + 'requests', JSON.stringify(requests));
  }, [requests]);

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_PREFIX + 'borrowings', JSON.stringify(borrowings));
  }, [borrowings]);

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_PREFIX + 'pm', JSON.stringify(preventiveMaintenance));
  }, [preventiveMaintenance]);

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_PREFIX + 'liabilities', JSON.stringify(liabilities));
  }, [liabilities]);

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_PREFIX + 'activity_logs', JSON.stringify(activityLogs));
  }, [activityLogs]);

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_PREFIX + 'settings', JSON.stringify(settings));
  }, [settings]);

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

  // Compute Alerts dynamically (Low stock, upcoming maintenance, overdue borrowings, expiring warranties)
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

  // Firestore Realtime Connection and Sync
  useEffect(() => {
    let unsubs: (() => void)[] = [];

    const unsubscribeAuth = initAuthListener(async (user) => {
      if (!user) return;

      const connOk = await testConnection();
      setIsFirebaseConnected(connOk);

      // Attach Firestore onSnapshot listeners
      try {
        const assetsUnsub = onSnapshot(collection(db, 'assets'), (snapshot) => {
          const clearedFlag = localStorage.getItem(LOCAL_STORAGE_PREFIX + 'cleared') === 'true';
          if (!snapshot.empty) {
            const list = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Asset));
            setAssets(list);
          } else if (clearedFlag) {
            setAssets([]);
          }
        }, (err) => {
          handleFirestoreError(err, OperationType.GET, 'assets');
        });
        unsubs.push(assetsUnsub);

        const onbUnsub = onSnapshot(collection(db, 'onboardings'), (snapshot) => {
          const clearedFlag = localStorage.getItem(LOCAL_STORAGE_PREFIX + 'cleared') === 'true';
          if (!snapshot.empty) {
            const list = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as OnboardingRecord));
            setOnboardings(list);
          } else if (clearedFlag) {
            setOnboardings([]);
          }
        }, (err) => {
          handleFirestoreError(err, OperationType.GET, 'onboardings');
        });
        unsubs.push(onbUnsub);

        const offUnsub = onSnapshot(collection(db, 'offboardings'), (snapshot) => {
          const clearedFlag = localStorage.getItem(LOCAL_STORAGE_PREFIX + 'cleared') === 'true';
          if (!snapshot.empty) {
            const list = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as OffboardingRecord));
            setOffboardings(list);
          } else if (clearedFlag) {
            setOffboardings([]);
          }
        }, (err) => {
          handleFirestoreError(err, OperationType.GET, 'offboardings');
        });
        unsubs.push(offUnsub);

        const reqUnsub = onSnapshot(collection(db, 'requests'), (snapshot) => {
          const clearedFlag = localStorage.getItem(LOCAL_STORAGE_PREFIX + 'cleared') === 'true';
          if (!snapshot.empty) {
            const list = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as RequestRecord));
            setRequests(list);
          } else if (clearedFlag) {
            setRequests([]);
          }
        }, (err) => {
          handleFirestoreError(err, OperationType.GET, 'requests');
        });
        unsubs.push(reqUnsub);

        const brwUnsub = onSnapshot(collection(db, 'borrowings'), (snapshot) => {
          const clearedFlag = localStorage.getItem(LOCAL_STORAGE_PREFIX + 'cleared') === 'true';
          if (!snapshot.empty) {
            const list = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as BorrowingRecord));
            setBorrowings(list);
          } else if (clearedFlag) {
            setBorrowings([]);
          }
        }, (err) => {
          handleFirestoreError(err, OperationType.GET, 'borrowings');
        });
        unsubs.push(brwUnsub);

        const pmUnsub = onSnapshot(collection(db, 'preventive_maintenance'), (snapshot) => {
          const clearedFlag = localStorage.getItem(LOCAL_STORAGE_PREFIX + 'cleared') === 'true';
          if (!snapshot.empty) {
            const list = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as PreventiveMaintenanceRecord));
            setPreventiveMaintenance(list);
          } else if (clearedFlag) {
            setPreventiveMaintenance([]);
          }
        }, (err) => {
          handleFirestoreError(err, OperationType.GET, 'preventive_maintenance');
        });
        unsubs.push(pmUnsub);

        const liaUnsub = onSnapshot(collection(db, 'liabilities'), (snapshot) => {
          const clearedFlag = localStorage.getItem(LOCAL_STORAGE_PREFIX + 'cleared') === 'true';
          if (!snapshot.empty) {
            const list = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as LiabilityRecord));
            setLiabilities(list);
          } else if (clearedFlag) {
            setLiabilities([]);
          }
        }, (err) => {
          handleFirestoreError(err, OperationType.GET, 'liabilities');
        });
        unsubs.push(liaUnsub);

        const logUnsub = onSnapshot(collection(db, 'activity_logs'), (snapshot) => {
          const clearedFlag = localStorage.getItem(LOCAL_STORAGE_PREFIX + 'cleared') === 'true';
          if (!snapshot.empty) {
            const list = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as ActivityLog));
            list.sort((a, b) => (b.timestamp || '').localeCompare(a.timestamp || ''));
            setActivityLogs(list);
          } else if (clearedFlag) {
            setActivityLogs([]);
          }
        }, (err) => {
          handleFirestoreError(err, OperationType.GET, 'activity_logs');
        });
        unsubs.push(logUnsub);
      } catch (e) {
        console.warn('Real-time listener initialization notice:', e);
      }
    });

    return () => {
      unsubscribeAuth();
      unsubs.forEach(u => u());
    };
  }, []);

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

    if (auth.currentUser) {
      try {
        await setDoc(doc(db, 'activity_logs', newLog.id), newLog);
      } catch (err) {
        console.warn('Activity log sync notice:', err);
      }
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

    if (auth.currentUser) {
      try {
        await setDoc(doc(db, 'assets', id), newAsset);
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `assets/${id}`);
      }
    }
    return id;
  };

  const updateAsset = async (id: string, updates: Partial<Asset>) => {
    const now = new Date().toISOString();
    setAssets(prev => prev.map(a => a.id === id ? { ...a, ...updates, updatedAt: now } : a));
    const target = assets.find(a => a.id === id);
    await logActivity('ASSET_UPDATE', 'Asset', target?.assetCode || id, `Updated asset fields: ${Object.keys(updates).join(', ')}`);

    if (auth.currentUser) {
      try {
        await updateDoc(doc(db, 'assets', id), { ...updates, updatedAt: now });
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `assets/${id}`);
      }
    }
  };

  const deleteAsset = async (id: string) => {
    const target = assets.find(a => a.id === id);
    setAssets(prev => prev.filter(a => a.id !== id));
    await logActivity('ASSET_DELETE', 'Asset', target?.assetCode || id, `Deleted asset ${target?.employeeOrDeviceName}`);

    if (auth.currentUser) {
      try {
        await deleteDoc(doc(db, 'assets', id));
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, `assets/${id}`);
      }
    }
  };

  // CRUD ONBOARDING
  const addOnboarding = async (rec: Omit<OnboardingRecord, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
    const id = `onb-${Date.now()}`;
    const now = new Date().toISOString();
    const newRec: OnboardingRecord = { ...rec, id, createdAt: now, updatedAt: now };
    setOnboardings(prev => [newRec, ...prev]);
    await logActivity('ONBOARDING_CREATE', 'Onboarding', newRec.controlNumber, `Registered onboarding for ${newRec.employeeName}`);

    if (auth.currentUser) {
      try {
        await setDoc(doc(db, 'onboardings', id), newRec);
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `onboardings/${id}`);
      }
    }
    return id;
  };

  const updateOnboarding = async (id: string, updates: Partial<OnboardingRecord>) => {
    const now = new Date().toISOString();
    setOnboardings(prev => prev.map(r => r.id === id ? { ...r, ...updates, updatedAt: now } : r));
    await logActivity('ONBOARDING_UPDATE', 'Onboarding', id, `Updated onboarding record`);

    if (auth.currentUser) {
      try {
        await updateDoc(doc(db, 'onboardings', id), { ...updates, updatedAt: now });
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `onboardings/${id}`);
      }
    }
  };

  const deleteOnboarding = async (id: string) => {
    setOnboardings(prev => prev.filter(r => r.id !== id));
    await logActivity('ONBOARDING_DELETE', 'Onboarding', id, `Deleted onboarding record`);

    if (auth.currentUser) {
      try {
        await deleteDoc(doc(db, 'onboardings', id));
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, `onboardings/${id}`);
      }
    }
  };

  // CRUD OFFBOARDING
  const addOffboarding = async (rec: Omit<OffboardingRecord, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
    const id = `off-${Date.now()}`;
    const now = new Date().toISOString();
    const newRec: OffboardingRecord = { ...rec, id, createdAt: now, updatedAt: now };
    setOffboardings(prev => [newRec, ...prev]);
    await logActivity('OFFBOARDING_CREATE', 'Offboarding', newRec.controlNumber, `Created separation clearance for ${newRec.employeeName}`);

    if (auth.currentUser) {
      try {
        await setDoc(doc(db, 'offboardings', id), newRec);
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `offboardings/${id}`);
      }
    }
    return id;
  };

  const updateOffboarding = async (id: string, updates: Partial<OffboardingRecord>) => {
    const now = new Date().toISOString();
    setOffboardings(prev => prev.map(r => r.id === id ? { ...r, ...updates, updatedAt: now } : r));
    await logActivity('OFFBOARDING_UPDATE', 'Offboarding', id, `Updated offboarding clearance`);

    if (auth.currentUser) {
      try {
        await updateDoc(doc(db, 'offboardings', id), { ...updates, updatedAt: now });
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `offboardings/${id}`);
      }
    }
  };

  const deleteOffboarding = async (id: string) => {
    setOffboardings(prev => prev.filter(r => r.id !== id));
    await logActivity('OFFBOARDING_DELETE', 'Offboarding', id, `Deleted offboarding clearance`);

    if (auth.currentUser) {
      try {
        await deleteDoc(doc(db, 'offboardings', id));
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, `offboardings/${id}`);
      }
    }
  };

  // CRUD REQUESTS (PR / IER)
  const addRequest = async (rec: Omit<RequestRecord, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
    const id = `req-${Date.now()}`;
    const now = new Date().toISOString();
    const newRec: RequestRecord = { ...rec, id, createdAt: now, updatedAt: now };
    setRequests(prev => [newRec, ...prev]);
    await logActivity('REQUEST_CREATE', 'Request', newRec.referenceNo, `Submitted ${newRec.requestType} ticket: ${newRec.referenceNo}`);

    if (auth.currentUser) {
      try {
        await setDoc(doc(db, 'requests', id), newRec);
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `requests/${id}`);
      }
    }
    return id;
  };

  const updateRequest = async (id: string, updates: Partial<RequestRecord>) => {
    const now = new Date().toISOString();
    setRequests(prev => prev.map(r => r.id === id ? { ...r, ...updates, updatedAt: now } : r));
    await logActivity('REQUEST_UPDATE', 'Request', id, `Updated request ticket status/details`);

    if (auth.currentUser) {
      try {
        await updateDoc(doc(db, 'requests', id), { ...updates, updatedAt: now });
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `requests/${id}`);
      }
    }
  };

  const deleteRequest = async (id: string) => {
    setRequests(prev => prev.filter(r => r.id !== id));
    await logActivity('REQUEST_DELETE', 'Request', id, `Deleted request ticket`);

    if (auth.currentUser) {
      try {
        await deleteDoc(doc(db, 'requests', id));
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, `requests/${id}`);
      }
    }
  };

  // CRUD BORROWINGS
  const addBorrowing = async (rec: Omit<BorrowingRecord, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
    const id = `brw-${Date.now()}`;
    const now = new Date().toISOString();
    const newRec: BorrowingRecord = { ...rec, id, createdAt: now, updatedAt: now };
    setBorrowings(prev => [newRec, ...prev]);
    await logActivity('BORROW_CREATE', 'Borrowing', id, `Borrowed ${newRec.itemCategory} by ${newRec.borrowerName}`);

    if (auth.currentUser) {
      try {
        await setDoc(doc(db, 'borrowings', id), newRec);
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `borrowings/${id}`);
      }
    }
    return id;
  };

  const updateBorrowing = async (id: string, updates: Partial<BorrowingRecord>) => {
    const now = new Date().toISOString();
    setBorrowings(prev => prev.map(r => r.id === id ? { ...r, ...updates, updatedAt: now } : r));
    await logActivity('BORROW_UPDATE', 'Borrowing', id, `Updated equipment loan status`);

    if (auth.currentUser) {
      try {
        await updateDoc(doc(db, 'borrowings', id), { ...updates, updatedAt: now });
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `borrowings/${id}`);
      }
    }
  };

  const deleteBorrowing = async (id: string) => {
    setBorrowings(prev => prev.filter(r => r.id !== id));
    await logActivity('BORROW_DELETE', 'Borrowing', id, `Deleted equipment loan`);

    if (auth.currentUser) {
      try {
        await deleteDoc(doc(db, 'borrowings', id));
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, `borrowings/${id}`);
      }
    }
  };

  // CRUD PREVENTIVE MAINTENANCE
  const addPreventiveMaintenance = async (rec: Omit<PreventiveMaintenanceRecord, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
    const id = `pm-${Date.now()}`;
    const now = new Date().toISOString();
    const newRec: PreventiveMaintenanceRecord = { ...rec, id, createdAt: now, updatedAt: now };
    setPreventiveMaintenance(prev => [newRec, ...prev]);
    await logActivity('PM_CREATE', 'PreventiveMaintenance', newRec.assetCode, `Recorded PM activity for ${newRec.assetCode}`);

    if (auth.currentUser) {
      try {
        await setDoc(doc(db, 'preventive_maintenance', id), newRec);
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `preventive_maintenance/${id}`);
      }
    }
    return id;
  };

  const updatePreventiveMaintenance = async (id: string, updates: Partial<PreventiveMaintenanceRecord>) => {
    const now = new Date().toISOString();
    setPreventiveMaintenance(prev => prev.map(r => r.id === id ? { ...r, ...updates, updatedAt: now } : r));
    await logActivity('PM_UPDATE', 'PreventiveMaintenance', id, `Updated PM record`);

    if (auth.currentUser) {
      try {
        await updateDoc(doc(db, 'preventive_maintenance', id), { ...updates, updatedAt: now });
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `preventive_maintenance/${id}`);
      }
    }
  };

  const deletePreventiveMaintenance = async (id: string) => {
    setPreventiveMaintenance(prev => prev.filter(r => r.id !== id));
    await logActivity('PM_DELETE', 'PreventiveMaintenance', id, `Deleted PM log`);

    if (auth.currentUser) {
      try {
        await deleteDoc(doc(db, 'preventive_maintenance', id));
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, `preventive_maintenance/${id}`);
      }
    }
  };

  // CRUD LIABILITY
  const addLiability = async (rec: Omit<LiabilityRecord, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
    const id = `lia-${Date.now()}`;
    const now = new Date().toISOString();
    const newRec: LiabilityRecord = { ...rec, id, createdAt: now, updatedAt: now };
    setLiabilities(prev => [newRec, ...prev]);
    await logActivity('LIABILITY_CREATE', 'Liability', newRec.assetCode, `Issued accountability form to ${newRec.employeeName}`);

    if (auth.currentUser) {
      try {
        await setDoc(doc(db, 'liabilities', id), newRec);
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `liabilities/${id}`);
      }
    }
    return id;
  };

  const updateLiability = async (id: string, updates: Partial<LiabilityRecord>) => {
    const now = new Date().toISOString();
    setLiabilities(prev => prev.map(r => r.id === id ? { ...r, ...updates, updatedAt: now } : r));
    await logActivity('LIABILITY_UPDATE', 'Liability', id, `Updated liability custody record`);

    if (auth.currentUser) {
      try {
        await updateDoc(doc(db, 'liabilities', id), { ...updates, updatedAt: now });
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `liabilities/${id}`);
      }
    }
  };

  const deleteLiability = async (id: string) => {
    setLiabilities(prev => prev.filter(r => r.id !== id));
    await logActivity('LIABILITY_DELETE', 'Liability', id, `Deleted liability record`);

    if (auth.currentUser) {
      try {
        await deleteDoc(doc(db, 'liabilities', id));
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, `liabilities/${id}`);
      }
    }
  };

  // SETTINGS
  const updateSettings = async (newSettings: Partial<SystemSettings>) => {
    const merged = { ...settings, ...newSettings };
    setSettingsState(merged);
    await logActivity('SETTINGS_UPDATE', 'Settings', 'global', `System settings updated`);

    if (auth.currentUser) {
      try {
        await setDoc(doc(db, 'settings', 'global'), merged);
      } catch (err) {
        console.warn('Settings sync notice:', err);
      }
    }
  };

  // 1-Click Seed Initial Data to Firebase
  const seedInitialDataToFirebase = async () => {
    if (!auth.currentUser) return;
    try {
      for (const a of SEED_ASSETS) {
        await setDoc(doc(db, 'assets', a.id), a);
      }
      for (const o of SEED_ONBOARDINGS) {
        await setDoc(doc(db, 'onboardings', o.id), o);
      }
      for (const off of SEED_OFFBOARDINGS) {
        await setDoc(doc(db, 'offboardings', off.id), off);
      }
      for (const req of SEED_REQUESTS) {
        await setDoc(doc(db, 'requests', req.id), req);
      }
      for (const b of SEED_BORROWINGS) {
        await setDoc(doc(db, 'borrowings', b.id), b);
      }
      for (const pm of SEED_PREVENTIVE_MAINTENANCE) {
        await setDoc(doc(db, 'preventive_maintenance', pm.id), pm);
      }
      for (const l of SEED_LIABILITIES) {
        await setDoc(doc(db, 'liabilities', l.id), l);
      }
      for (const log of SEED_ACTIVITY_LOGS) {
        await setDoc(doc(db, 'activity_logs', log.id), log);
      }
      localStorage.removeItem(LOCAL_STORAGE_PREFIX + 'cleared');
      await logActivity('DATABASE_SEED', 'System', 'all', 'Seeded initial enterprise dataset to Firebase Firestore');
    } catch (err) {
      console.error('Seeding error:', err);
    }
  };

  // Clear All System Data (Wipe database & start fresh)
  const clearAllData = async () => {
    localStorage.setItem(LOCAL_STORAGE_PREFIX + 'cleared', 'true');
    localStorage.setItem(LOCAL_STORAGE_PREFIX + 'assets', JSON.stringify([]));
    localStorage.setItem(LOCAL_STORAGE_PREFIX + 'onboardings', JSON.stringify([]));
    localStorage.setItem(LOCAL_STORAGE_PREFIX + 'offboardings', JSON.stringify([]));
    localStorage.setItem(LOCAL_STORAGE_PREFIX + 'requests', JSON.stringify([]));
    localStorage.setItem(LOCAL_STORAGE_PREFIX + 'borrowings', JSON.stringify([]));
    localStorage.setItem(LOCAL_STORAGE_PREFIX + 'pm', JSON.stringify([]));
    localStorage.setItem(LOCAL_STORAGE_PREFIX + 'liabilities', JSON.stringify([]));
    localStorage.setItem(LOCAL_STORAGE_PREFIX + 'activity_logs', JSON.stringify([]));

    setAssets([]);
    setOnboardings([]);
    setOffboardings([]);
    setRequests([]);
    setBorrowings([]);
    setPreventiveMaintenance([]);
    setLiabilities([]);
    setActivityLogs([]);

    if (auth.currentUser) {
      const collectionsToWipe = [
        'assets',
        'onboardings',
        'offboardings',
        'requests',
        'borrowings',
        'preventive_maintenance',
        'liabilities',
        'activity_logs',
      ];

      for (const col of collectionsToWipe) {
        try {
          const snap = await getDocs(collection(db, col));
          await Promise.all(snap.docs.map(d => deleteDoc(doc(db, col, d.id))));
        } catch (err) {
          console.warn(`Error clearing collection ${col}:`, err);
        }
      }
    }

    await logActivity('SYSTEM_CLEARED', 'System', 'all', 'All system data and inventory records cleared for a fresh start');
  };

  // Clear Inventory Assets Only
  const clearAssetsOnly = async () => {
    localStorage.setItem(LOCAL_STORAGE_PREFIX + 'assets', JSON.stringify([]));
    setAssets([]);

    if (auth.currentUser) {
      try {
        const snap = await getDocs(collection(db, 'assets'));
        await Promise.all(snap.docs.map(d => deleteDoc(doc(db, 'assets', d.id))));
      } catch (err) {
        console.warn('Error clearing assets:', err);
      }
    }

    await logActivity('ASSETS_CLEARED', 'Asset', 'all', 'All inventory asset records cleared');
  };

  // Backup snapshots
  const createBackupSnapshot = () => {
    const snapshot = {
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      system: 'ITM Pro Enterprise',
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
      }
    };

    const blob = new Blob([JSON.stringify(snapshot, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ITM_Snapshot_Backup_${new Date().toISOString().substring(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);

    updateSettings({ lastBackupDate: new Date().toISOString() });
    logActivity('BACKUP_EXPORT', 'System', 'snapshot', 'Created full JSON snapshot backup of ITM database');
  };

  const restoreBackupSnapshot = async (jsonData: string) => {
    try {
      const parsed = JSON.parse(jsonData);
      if (parsed.data) {
        if (parsed.data.assets) setAssets(parsed.data.assets);
        if (parsed.data.onboardings) setOnboardings(parsed.data.onboardings);
        if (parsed.data.offboardings) setOffboardings(parsed.data.offboardings);
        if (parsed.data.requests) setRequests(parsed.data.requests);
        if (parsed.data.borrowings) setBorrowings(parsed.data.borrowings);
        if (parsed.data.preventiveMaintenance) setPreventiveMaintenance(parsed.data.preventiveMaintenance);
        if (parsed.data.liabilities) setLiabilities(parsed.data.liabilities);
        if (parsed.data.activityLogs) setActivityLogs(parsed.data.activityLogs);
        if (parsed.data.settings) setSettingsState(parsed.data.settings);
        await logActivity('BACKUP_RESTORE', 'System', 'snapshot', 'Restored ITM database from JSON backup snapshot');
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
        addAsset,
        updateAsset,
        deleteAsset,
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
        clearAllData,
        clearAssetsOnly,
        createBackupSnapshot,
        restoreBackupSnapshot,
        currentUser,
        setCurrentUser,
        language,
        setLanguage,
        t,
        isOnline,
        isFirebaseConnected,
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
