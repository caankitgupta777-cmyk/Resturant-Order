import React, { useState } from 'react';
import { useRestaurant, AppView } from '../../context/RestaurantContext';
import { PWAInstallButton } from '../common/PWAInstallButton';
import {
  UtensilsCrossed,
  ChefHat,
  LayoutGrid,
  Boxes,
  BarChart3,
  Bell,
  ShoppingCart,
  Flame,
  Clock,
  Volume2,
  Settings,
  Cloud,
  Radio,
  Lock,
  Unlock,
  KeyRound,
  Banknote,
  ShieldCheck,
  Building2,
  Printer,
  Zap,
  Sparkles,
} from 'lucide-react';

interface HeaderProps {
  onOpenCart: () => void;
  onOpenPinLock: () => void;
  onOpenRegister: () => void;
  onOpenAuditLogs: () => void;
  onOpenTenants: () => void;
  onOpenPrinter: () => void;
  onOpenSubscription: () => void;
  onOpenOnboarding?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenCart,
  onOpenPinLock,
  onOpenRegister,
  onOpenAuditLogs,
  onOpenTenants,
  onOpenPrinter,
  onOpenSubscription,
  onOpenOnboarding,
}) => {
  const {
    currentView,
    setCurrentView,
    customerTableNumber,
    setCustomerTableNumber,
    cartCount,
    orders,
    notifications,
    markAllNotificationsRead,
    restaurantSettings,
    setIsSettingsOpen,
    isFirestoreConnected,
    currentStaff,
    lockScreen,
    activeShift,
    currentTenant,
    printerConfig,
    subscription,
  } = useRestaurant();

  const [showNotifMenu, setShowNotifMenu] = useState(false);

  const activeKdsTickets = orders.filter(
    o => o.status === 'received' || o.status === 'in_kitchen' || o.status === 'ready'
  ).length;

  const unreadNotifs = notifications.filter(n => !n.read).length;

  // Role-based navigation filtering
  const allNavItems: {
    id: AppView;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: number;
    roles: ('waiter' | 'kitchen' | 'cashier' | 'admin')[];
  }[] = [
    { id: 'customer', label: 'Order Taking', icon: UtensilsCrossed, roles: ['waiter', 'cashier', 'admin'] },
    { id: 'kds', label: 'Kitchen KDS', icon: ChefHat, badge: activeKdsTickets, roles: ['kitchen', 'admin'] },
    { id: 'tables', label: 'Floor & Tables', icon: LayoutGrid, roles: ['waiter', 'cashier', 'admin'] },
    { id: 'inventory', label: 'Inventory Guard', icon: Boxes, roles: ['admin'] },
    { id: 'analytics', label: 'Sales Reports', icon: BarChart3, roles: ['cashier', 'admin'] },
  ];

  const allowedNavItems = allNavItems.filter(item =>
    currentStaff.role === 'admin' || item.roles.includes(currentStaff.role)
  );

  return (
    <header className="sticky top-0 z-30 bg-neutral-900/95 border-b border-neutral-800 backdrop-blur-md no-print font-['Outfit']">
      {/* Top Banner with Brand and Global Actions */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2 flex items-center justify-between gap-2.5">
        {/* Brand & Multi-Tenant Switcher */}
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 to-red-600 flex items-center justify-center shadow-lg shadow-amber-900/30 shrink-0">
            <Flame className="w-5 h-5 text-neutral-950 fill-neutral-950" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-sm sm:text-base tracking-tight text-white truncate max-w-[170px] sm:max-w-none">
                {currentTenant.name}
              </span>
              <button
                type="button"
                onClick={onOpenTenants}
                className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-neutral-800 hover:bg-neutral-700 text-amber-400 border border-neutral-700 uppercase tracking-wider flex items-center gap-1 cursor-pointer"
                title="Switch restaurant branch or onboard new location (Phase 4)"
              >
                <Building2 className="w-2.5 h-2.5" />
                <span>{currentTenant.city}</span>
              </button>
            </div>
            <p className="text-[10px] text-neutral-400 hidden sm:block truncate max-w-xs">
              {restaurantSettings.tagline}
            </p>
          </div>
        </div>

        {/* Commercial Phase Action Badges & Staff PIN Selector */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Phase 1: Staff Profile & Lock Trigger */}
          <button
            type="button"
            onClick={onOpenPinLock}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border transition cursor-pointer ${
              currentStaff.role === 'admin'
                ? 'bg-amber-500/15 border-amber-500/40 text-amber-300'
                : currentStaff.role === 'kitchen'
                ? 'bg-purple-500/15 border-purple-500/40 text-purple-300'
                : currentStaff.role === 'cashier'
                ? 'bg-blue-500/15 border-blue-500/40 text-blue-300'
                : 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
            }`}
            title="Lock terminal or switch staff with 4-digit PIN (Phase 1)"
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span className="hidden md:inline font-bold">{currentStaff.name.split(' ')[0]}</span>
            <span className="text-[10px] uppercase font-mono px-1 rounded bg-black/40">
              {currentStaff.role}
            </span>
            <Lock className="w-3 h-3 text-neutral-400 hover:text-white" />
          </button>

          {/* Phase 3: Till & Cash Register Shift Indicator */}
          <button
            type="button"
            onClick={onOpenRegister}
            className="hidden sm:flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-neutral-800/80 hover:bg-neutral-750 border border-neutral-700 text-neutral-200 transition cursor-pointer"
            title="Cash register drawer & shift closing Z-Report (Phase 3)"
          >
            <Banknote className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden lg:inline text-[11px] text-neutral-400">Till:</span>
            <span className="font-mono text-emerald-400 font-bold">
              {activeShift ? `₹${activeShift.expectedCash}` : 'Closed'}
            </span>
          </button>

          {/* Phase 5: Thermal Printer Hardware Bridge */}
          <button
            type="button"
            onClick={onOpenPrinter}
            className="hidden md:flex items-center gap-1 px-2 py-1 rounded-lg text-xs bg-neutral-800/80 hover:bg-neutral-750 border border-neutral-700 text-neutral-300 transition cursor-pointer"
            title="Configure 58mm/80mm thermal hardware and RawBT Bluetooth (Phase 5)"
          >
            <Printer className="w-3.5 h-3.5 text-amber-400" />
            <span className="font-mono text-[11px]">{printerConfig.paperWidth}</span>
          </button>

          {/* Phase 2: Security Audit Trail Button (Admin & Cashier) */}
          {(currentStaff.role === 'admin' || currentStaff.role === 'cashier') && (
            <button
              type="button"
              onClick={onOpenAuditLogs}
              className="hidden lg:flex items-center gap-1 px-2 py-1 rounded-lg text-xs bg-neutral-800/80 hover:bg-neutral-750 border border-neutral-700 text-neutral-300 transition cursor-pointer"
              title="View fraud prevention audit trail & void logs (Phase 2)"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-[11px]">Audit</span>
            </button>
          )}

          {/* Phase 6: Commercial SaaS Subscription License */}
          {currentStaff.role === 'admin' && (
            <button
              type="button"
              onClick={onOpenSubscription}
              className="hidden sm:flex items-center gap-1 px-2 py-1 rounded-lg text-xs bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-400 transition cursor-pointer"
              title="Commercial SaaS license & pricing plans (Phase 6)"
            >
              <Zap className="w-3 h-3 fill-amber-400" />
              <span className="text-[10px] font-bold uppercase">Pro SaaS</span>
            </button>
          )}

          {/* Cloud Sync Status */}
          <button
            type="button"
            onClick={() => setIsSettingsOpen(true)}
            className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold border transition ${
              isFirestoreConnected
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                : 'bg-neutral-800/80 border-neutral-700 text-neutral-400 hover:text-white'
            }`}
            title="Cloud Firestore Multi-Phone Sync Status"
          >
            <Cloud className="w-3.5 h-3.5" />
            {isFirestoreConnected && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />}
          </button>

          {/* Settings Trigger */}
          <button
            type="button"
            onClick={() => setIsSettingsOpen(true)}
            className="p-1.5 rounded-lg bg-neutral-800/80 border border-neutral-700 text-neutral-300 hover:text-white hover:bg-neutral-750 transition cursor-pointer"
            title="POS Settings & Single File Menu Attachment"
          >
            <Settings className="w-4 h-4" />
          </button>

          {/* Client Onboarding / Database Reset Button - Always Prominent */}
          <button
            type="button"
            onClick={onOpenOnboarding || (() => setIsSettingsOpen(true))}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-bold bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-neutral-950 transition cursor-pointer shadow-md shadow-amber-900/40 shrink-0"
            title="Client Onboarding & Database Reset Wizard (Configure restaurant or reset database)"
          >
            <Sparkles className="w-3.5 h-3.5 fill-neutral-950" />
            <span className="hidden sm:inline font-extrabold">Onboard / Reset DB</span>
            <span className="sm:hidden font-extrabold">Onboard</span>
          </button>

          {/* Notifications Bell */}
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setShowNotifMenu(!showNotifMenu);
                if (!showNotifMenu) markAllNotificationsRead();
              }}
              className="relative p-1.5 rounded-lg bg-neutral-800/80 border border-neutral-700 text-neutral-300 hover:text-white transition cursor-pointer"
            >
              <Bell className="w-4 h-4" />
              {unreadNotifs > 0 && (
                <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-red-500 text-white rounded-full text-[9px] font-bold flex items-center justify-center animate-pulse">
                  {unreadNotifs}
                </span>
              )}
            </button>

            {showNotifMenu && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-neutral-900 border border-neutral-750 rounded-2xl shadow-2xl overflow-hidden z-50">
                <div className="p-3 bg-neutral-850 border-b border-neutral-800 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <Volume2 className="w-4 h-4 text-amber-400" />
                    <span className="font-semibold text-neutral-200">Real-Time Kitchen Alerts</span>
                  </div>
                  <span className="text-[10px] text-neutral-400">POS Engine</span>
                </div>
                <div className="max-h-64 overflow-y-auto divide-y divide-neutral-800/60 p-1 text-xs">
                  {notifications.length === 0 ? (
                    <div className="p-4 text-center text-neutral-500 text-xs">
                      No recent alerts.
                    </div>
                  ) : (
                    notifications.map(n => (
                      <div key={n.id} className="p-2.5 hover:bg-neutral-800/50 rounded-xl transition">
                        <div className="flex items-center justify-between text-neutral-400 text-[10px] mb-0.5">
                          <span className="font-semibold text-amber-400 uppercase">{n.type}</span>
                          <span>{n.timestamp}</span>
                        </div>
                        <h4 className="font-medium text-neutral-200">{n.title}</h4>
                        <p className="text-[11px] text-neutral-400 mt-0.5">{n.body}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Cart Trigger */}
          {currentStaff.role !== 'kitchen' && (
            <button
              type="button"
              onClick={onOpenCart}
              className="flex items-center gap-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 text-neutral-950 font-bold px-3 py-1.5 rounded-lg shadow-md transition cursor-pointer"
            >
              <div className="relative">
                <ShoppingCart className="w-4 h-4" />
                {cartCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full text-[9px] w-3.5 h-3.5 flex items-center justify-center font-extrabold border border-neutral-900">
                    {cartCount}
                  </span>
                )}
              </div>
              <span className="text-xs hidden sm:inline">Tray</span>
            </button>
          )}
        </div>
      </div>

      {/* Navigation Sub-bar with Role Gates */}
      <div className="border-t border-neutral-800/80 bg-neutral-950/60 px-3 sm:px-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between overflow-x-auto no-scrollbar py-1 gap-2">
          <div className="flex items-center gap-1 sm:gap-2">
            {allowedNavItems.map(item => {
              const Icon = item.icon;
              const isActive = currentView === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setCurrentView(item.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${
                    isActive
                      ? 'bg-amber-500 text-neutral-950 font-semibold shadow-sm'
                      : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/60'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{item.label}</span>
                  {item.badge !== undefined && item.badge > 0 && (
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                        isActive ? 'bg-neutral-950 text-amber-400' : 'bg-red-500 text-white'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-2 text-[11px] text-neutral-400 pr-1 shrink-0">
            <button
              type="button"
              onClick={onOpenOnboarding || (() => setIsSettingsOpen(true))}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/40 transition cursor-pointer shadow-sm"
              title="Quickly onboard a new client restaurant or reset database"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Client Onboard &amp; Reset Wizard</span>
            </button>
            <span className="hidden xl:inline text-neutral-600">&bull;</span>
            <div className="hidden xl:flex items-center gap-1.5 text-neutral-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span><strong className="text-amber-400 capitalize">{currentStaff.name} ({currentStaff.role})</strong></span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
