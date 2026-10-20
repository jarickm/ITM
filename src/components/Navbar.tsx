import React, { useState } from 'react';
import { 
  Search, 
  QrCode, 
  Bell, 
  Globe, 
  ShieldCheck, 
  Wifi, 
  WifiOff, 
  ChevronDown, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  X,
  Database,
  UserCheck
} from 'lucide-react';
import { useITM } from '../context/ITMContext';
import { UserRole, LanguageCode } from '../types/itm';

interface NavbarProps {
  onOpenScanner: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenScanner }) => {
  const { 
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
    seedInitialDataToFirebase
  } = useITM();

  const [showAlertsDropdown, setShowAlertsDropdown] = useState(false);
  const [showRoleDropdown, setShowRoleDropdown] = useState(false);
  const [showLangDropdown, setShowLangDropdown] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);

  const unreadAlerts = alerts.filter(a => !a.read);

  const handleRoleChange = (role: UserRole) => {
    setCurrentUser({
      ...currentUser,
      role,
    });
    setShowRoleDropdown(false);
  };

  const handleLanguageChange = (lang: LanguageCode) => {
    setLanguage(lang);
    setShowLangDropdown(false);
  };

  const handleSeedFirebase = async () => {
    setIsSeeding(true);
    await seedInitialDataToFirebase();
    setIsSeeding(false);
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 lg:px-6 py-2.5 flex items-center justify-between gap-4 shadow-xs">
      {/* Brand & Mobile Scanner */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-lg bg-gradient-to-tr from-indigo-600 to-indigo-700 flex items-center justify-center shadow-md shadow-indigo-600/20 text-white font-black tracking-wider text-sm">
            ITM
          </div>
          <div className="hidden sm:block">
            <h1 className="text-sm font-bold tracking-tight text-slate-900 flex items-center gap-1.5">
              ITM Pro
              <span className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
                Enterprise
              </span>
            </h1>
            <p className="text-[11px] text-slate-500 font-medium">Asset & Operations Management</p>
          </div>
        </div>
      </div>

      {/* Global Quick Search Bar */}
      <div className="flex-1 max-w-xl mx-2">
        <div className="relative group">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
          <input
            type="text"
            value={quickSearchQuery}
            onChange={(e) => setQuickSearchQuery(e.target.value)}
            placeholder={t('searchPlaceholder')}
            className="w-full bg-slate-100/80 hover:bg-slate-100 focus:bg-white border border-slate-200 rounded-lg pl-10 pr-9 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-inner"
          />
          {quickSearchQuery && (
            <button 
              onClick={() => setQuickSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Actions & Status */}
      <div className="flex items-center gap-2">
        {/* Quick QR & Barcode Scanner Button */}
        <button
          onClick={onOpenScanner}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-sm shadow-indigo-600/20 active:scale-95 transition-all"
          title="Scan Asset QR Code or Barcode"
        >
          <QrCode className="w-4 h-4" />
          <span className="hidden md:inline">{t('quickScan')}</span>
        </button>

        {/* Sync / Firebase Status */}
        <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 border border-slate-200 text-[11px] text-slate-700">
          {isOnline ? (
            <span className="flex items-center gap-1.5 text-emerald-700 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <Wifi className="w-3 h-3 text-emerald-600" />
              <span>{isFirebaseConnected ? 'Cloud Active' : 'Online'}</span>
            </span>
          ) : (
            <span className="flex items-center gap-1.5 text-amber-700 font-medium">
              <WifiOff className="w-3 h-3 text-amber-600" />
              <span>Offline Cache</span>
            </span>
          )}
        </div>

        {/* Firebase Quick Seed Button */}
        <button
          onClick={handleSeedFirebase}
          disabled={isSeeding}
          className="hidden xl:flex items-center gap-1 px-2.5 py-1 rounded-md bg-slate-100 hover:bg-slate-200 border border-slate-200 text-[11px] text-slate-700 font-medium transition-colors"
          title="Sync demo dataset to Firebase Firestore"
        >
          <Database className="w-3 h-3 text-indigo-600" />
          <span>{isSeeding ? 'Syncing...' : 'Sync to Cloud'}</span>
        </button>

        {/* Notification Bell Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowAlertsDropdown(!showAlertsDropdown)}
            className="relative p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 border border-slate-200 transition-colors"
            title="System Alerts & Notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadAlerts.length > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[9px] font-bold text-white shadow-xs animate-bounce">
                {unreadAlerts.length}
              </span>
            )}
          </button>

          {showAlertsDropdown && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-xl bg-white border border-slate-200 shadow-2xl z-50 p-3 overflow-hidden text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 mb-2">
                <span className="font-semibold text-slate-900 flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                  System Notifications & Stock Alerts ({alerts.length})
                </span>
                {alerts.length > 0 && (
                  <button
                    onClick={clearAllAlerts}
                    className="text-[10px] text-slate-500 hover:text-rose-600 transition-colors"
                  >
                    Clear All
                  </button>
                )}
              </div>
              <div className="max-h-72 overflow-y-auto space-y-2 pr-1">
                {alerts.length === 0 ? (
                  <div className="text-center py-6 text-slate-400">
                    <CheckCircle2 className="w-6 h-6 mx-auto mb-1 text-emerald-500" />
                    <p>All stock, maintenance & loan checks healthy.</p>
                  </div>
                ) : (
                  alerts.map((alert) => (
                    <div
                      key={alert.id}
                      onClick={() => markAlertRead(alert.id)}
                      className={`p-2.5 rounded-lg border transition-all cursor-pointer ${
                        alert.read 
                          ? 'bg-slate-50 border-slate-200 text-slate-400 opacity-70' 
                          : 'bg-indigo-50/50 border-indigo-100 text-slate-800'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className={`font-semibold ${
                          alert.type === 'low_stock' ? 'text-amber-700' :
                          alert.type === 'overdue' ? 'text-rose-700' : 'text-indigo-700'
                        }`}>
                          {alert.title}
                        </span>
                        <span className="text-[10px] text-slate-400 flex items-center gap-0.5">
                          <Clock className="w-2.5 h-2.5" />
                          {alert.date}
                        </span>
                      </div>
                      <p className="text-[11px] mt-1 text-slate-600 leading-relaxed">{alert.message}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Language Selector */}
        <div className="relative">
          <button
            onClick={() => setShowLangDropdown(!showLangDropdown)}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 text-xs transition-colors"
          >
            <Globe className="w-3.5 h-3.5 text-indigo-600" />
            <span className="uppercase font-semibold text-[11px]">{language}</span>
          </button>

          {showLangDropdown && (
            <div className="absolute right-0 mt-2 w-36 rounded-lg bg-white border border-slate-200 shadow-xl z-50 py-1 text-xs">
              <button
                onClick={() => handleLanguageChange('en')}
                className={`w-full text-left px-3 py-1.5 hover:bg-slate-50 ${language === 'en' ? 'text-indigo-600 font-semibold bg-indigo-50/50' : 'text-slate-700'}`}
              >
                🇺🇸 English
              </button>
              <button
                onClick={() => handleLanguageChange('es')}
                className={`w-full text-left px-3 py-1.5 hover:bg-slate-50 ${language === 'es' ? 'text-indigo-600 font-semibold bg-indigo-50/50' : 'text-slate-700'}`}
              >
                🇪🇸 Español
              </button>
              <button
                onClick={() => handleLanguageChange('fil')}
                className={`w-full text-left px-3 py-1.5 hover:bg-slate-50 ${language === 'fil' ? 'text-indigo-600 font-semibold bg-indigo-50/50' : 'text-slate-700'}`}
              >
                🇵🇭 Filipino
              </button>
              <button
                onClick={() => handleLanguageChange('ja')}
                className={`w-full text-left px-3 py-1.5 hover:bg-slate-50 ${language === 'ja' ? 'text-indigo-600 font-semibold bg-indigo-50/50' : 'text-slate-700'}`}
              >
                🇯🇵 日本語
              </button>
            </div>
          )}
        </div>

        {/* User Role Switcher & Active Directory SSO Badge */}
        <div className="relative">
          <button
            onClick={() => setShowRoleDropdown(!showRoleDropdown)}
            className="flex items-center gap-2 pl-2 pr-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 border border-slate-200 text-xs transition-colors"
          >
            <div className="h-6 w-6 rounded-full bg-indigo-600 flex items-center justify-center text-white text-[10px] font-bold">
              {currentUser.name.charAt(0)}
            </div>
            <div className="text-left hidden sm:block">
              <div className="font-semibold text-slate-900 leading-tight text-[11px] truncate max-w-[100px]">
                {currentUser.name}
              </div>
              <div className="text-[10px] text-indigo-700 font-mono font-medium">
                {currentUser.role}
              </div>
            </div>
            <ChevronDown className="w-3 h-3 text-slate-500" />
          </button>

          {showRoleDropdown && (
            <div className="absolute right-0 mt-2 w-64 rounded-xl bg-white border border-slate-200 shadow-2xl z-50 p-2 text-xs">
              <div className="px-2 py-1.5 mb-1.5 border-b border-slate-100">
                <div className="flex items-center gap-1.5 text-emerald-700 text-[11px] font-semibold">
                  <UserCheck className="w-3.5 h-3.5" />
                  SSO Active Directory Authenticated
                </div>
                <div className="text-[10px] text-slate-500 font-mono mt-0.5 truncate">{currentUser.adId}</div>
                <div className="text-[10px] text-slate-500">{currentUser.email}</div>
              </div>

              <div className="text-[10px] uppercase font-semibold text-slate-400 px-2 py-1">
                Switch Role (RBAC Simulation)
              </div>

              {(['Admin', 'IT Manager', 'IT Technician', 'Auditor'] as UserRole[]).map((role) => (
                <button
                  key={role}
                  onClick={() => handleRoleChange(role)}
                  className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-md hover:bg-slate-100 text-left transition-colors ${
                    currentUser.role === role ? 'text-indigo-700 font-semibold bg-indigo-50' : 'text-slate-700'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
                    {role}
                  </span>
                  {currentUser.role === role && <span className="text-[10px] text-indigo-600 font-bold">Active</span>}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
