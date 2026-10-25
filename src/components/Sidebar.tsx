import React from 'react';
import { 
  LayoutDashboard, 
  Layers, 
  AlertOctagon, 
  UserPlus, 
  UserMinus, 
  FileText, 
  ShoppingCart, 
  Repeat, 
  Wrench, 
  ClipboardCheck, 
  QrCode, 
  History, 
  Settings,
  Sliders,
  ChevronRight,
  Target
} from 'lucide-react';
import { useITM } from '../context/ITMContext';

export const Sidebar: React.FC = () => {
  const { 
    activeTab, 
    setActiveTab, 
    assets, 
    onboardings, 
    offboardings, 
    requests, 
    borrowings, 
    preventiveMaintenance, 
    liabilities,
    t 
  } = useITM();

  const defectiveCount = assets.filter(a => a.status === 'Defective' || a.isDefective).length;
  const pendingOnboardings = onboardings.filter(o => o.status !== 'Completed').length;
  const pendingOffboardings = offboardings.filter(o => o.status !== 'Cleared').length;
  const openRequests = requests.filter(r => r.status === 'Open' || r.status === 'In Progress').length;
  const activeBorrowings = borrowings.filter(b => b.status === 'Active / Borrowed' || b.status === 'Overdue').length;

  const navItems = [
    {
      id: 'dashboard',
      label: t('dashboard'),
      icon: LayoutDashboard,
      badge: null,
      color: 'text-indigo-600',
    },
    {
      id: 'kpi_targets',
      label: '🎯 Target & KPI 2026',
      icon: Target,
      badge: 'Official',
      badgeColor: 'bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold',
      color: 'text-emerald-600',
    },
    {
      id: 'inventory',
      label: t('inventory'),
      icon: Layers,
      badge: assets.length,
      color: 'text-cyan-600',
    },
    {
      id: 'defective',
      label: t('defectiveItems'),
      icon: AlertOctagon,
      badge: defectiveCount > 0 ? defectiveCount : null,
      badgeColor: 'bg-rose-100 text-rose-700 border border-rose-200',
      color: 'text-rose-600',
    },
    {
      id: 'onboarding',
      label: t('onboarding'),
      icon: UserPlus,
      badge: pendingOnboardings > 0 ? pendingOnboardings : null,
      badgeColor: 'bg-amber-100 text-amber-700 border border-amber-200',
      color: 'text-amber-600',
    },
    {
      id: 'offboarding',
      label: t('offboarding'),
      icon: UserMinus,
      badge: pendingOffboardings > 0 ? pendingOffboardings : null,
      badgeColor: 'bg-orange-100 text-orange-700 border border-orange-200',
      color: 'text-orange-600',
    },
    {
      id: 'requests',
      label: t('requests'),
      icon: FileText,
      badge: openRequests > 0 ? openRequests : null,
      badgeColor: 'bg-purple-100 text-purple-700 border border-purple-200',
      color: 'text-purple-600',
    },
    {
      id: 'pr_only',
      label: t('prOnly'),
      icon: ShoppingCart,
      badge: requests.filter(r => r.requestType === 'PR').length,
      color: 'text-emerald-600',
    },
    {
      id: 'borrowing',
      label: t('borrowing'),
      icon: Repeat,
      badge: activeBorrowings > 0 ? activeBorrowings : null,
      badgeColor: 'bg-blue-100 text-blue-700 border border-blue-200',
      color: 'text-blue-600',
    },
    {
      id: 'maintenance',
      label: t('maintenance'),
      icon: Wrench,
      badge: preventiveMaintenance.length,
      color: 'text-amber-600',
    },
    {
      id: 'liabilities',
      label: t('liabilities'),
      icon: ClipboardCheck,
      badge: liabilities.length,
      color: 'text-teal-600',
    },
    {
      id: 'qr_studio',
      label: 'QR & Barcode Studio',
      icon: QrCode,
      badge: 'Print',
      badgeColor: 'bg-indigo-100 text-indigo-700 border border-indigo-200',
      color: 'text-indigo-600',
    },
    {
      id: 'activity_logs',
      label: t('auditLogs'),
      icon: History,
      badge: null,
      color: 'text-slate-500',
    },
    {
      id: 'categories',
      label: 'Dropdown Categories',
      icon: Sliders,
      badge: 'Master',
      badgeColor: 'bg-indigo-100 text-indigo-700 border border-indigo-200',
      color: 'text-indigo-600',
    },
    {
      id: 'settings',
      label: t('settings'),
      icon: Settings,
      badge: null,
      color: 'text-slate-500',
    },
  ];

  return (
    <aside className="w-64 shrink-0 bg-slate-50 border-r border-slate-200 flex flex-col h-[calc(100vh-53px)] select-none">
      <div className="p-3">
        <div className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
          Core Operations
        </div>
      </div>

      <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all group ${
                isActive
                  ? 'bg-indigo-50 text-indigo-900 border-l-2 border-indigo-600 pl-2.5 font-semibold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <div className="flex items-center gap-2.5 truncate">
                <Icon className={`w-4 h-4 shrink-0 transition-colors ${isActive ? 'text-indigo-600' : item.color} group-hover:scale-105`} />
                <span className="truncate">{item.label}</span>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                {item.badge !== null && item.badge !== undefined && (
                  <span
                    className={`text-[10px] font-semibold px-1.5 py-0.2 rounded-full ${
                      item.badgeColor || 'bg-slate-200 text-slate-700 border border-slate-300'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
                {isActive && <ChevronRight className="w-3 h-3 text-indigo-600" />}
              </div>
            </button>
          );
        })}
      </nav>

      {/* Footer Info Box */}
      <div className="p-3 m-3 rounded-xl bg-white border border-slate-200 text-[11px] text-slate-600 space-y-1 shadow-xs">
        <div className="flex items-center justify-between text-slate-800 font-semibold">
          <span>Enterprise Backup</span>
          <span className="text-[10px] text-emerald-700 font-mono font-bold bg-emerald-50 px-1 rounded">Active 24/7</span>
        </div>
        <p className="text-[10px] text-slate-500 leading-tight">
          SHA-256 encrypted backups with automated daily snapshot triggers.
        </p>
      </div>
    </aside>
  );
};
