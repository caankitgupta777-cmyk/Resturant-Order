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
  CheckCircle2,
  Clock,
  Volume2,
} from 'lucide-react';

interface HeaderProps {
  onOpenCart: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenCart }) => {
  const {
    currentView,
    setCurrentView,
    customerTableNumber,
    setCustomerTableNumber,
    cartCount,
    orders,
    notifications,
    markAllNotificationsRead,
    requestPushPermission,
    pushPermissionState,
  } = useRestaurant();

  const [showNotifMenu, setShowNotifMenu] = useState(false);

  const activeKdsTickets = orders.filter(
    o => o.status === 'received' || o.status === 'in_kitchen' || o.status === 'ready'
  ).length;

  const unreadNotifs = notifications.filter(n => !n.read).length;

  const navItems: { id: AppView; label: string; icon: React.ComponentType<{ className?: string }>; badge?: number }[] = [
    { id: 'customer', label: 'Customer Dining', icon: UtensilsCrossed },
    { id: 'kds', label: 'Kitchen KDS', icon: ChefHat, badge: activeKdsTickets },
    { id: 'tables', label: 'Floor & Booking', icon: LayoutGrid },
    { id: 'inventory', label: 'Inventory Guard', icon: Boxes },
    { id: 'analytics', label: 'Daily Analytics', icon: BarChart3 },
  ];

  return (
    <header className="sticky top-0 z-30 bg-neutral-900/95 border-b border-neutral-800 backdrop-blur-md">
      {/* Top Banner with Brand and Global Actions */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2.5 flex items-center justify-between gap-3">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-red-600 flex items-center justify-center shadow-lg shadow-amber-900/30">
            <Flame className="w-6 h-6 text-neutral-950 fill-neutral-950" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-base sm:text-lg tracking-tight text-white font-['Outfit']">
                Varhad Rasoi
              </span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-red-500/20 text-red-400 border border-red-500/30 uppercase tracking-wider">
                Amravati
              </span>
            </div>
            <p className="text-[11px] text-neutral-400 hidden sm:block">
              Vidarbha Heritage Dining & Real-Time KDS
            </p>
          </div>
        </div>

        {/* Center / Right controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Table quick selector for customer mode */}
          <div className="flex items-center gap-1.5 bg-neutral-800/90 border border-neutral-700/80 rounded-lg px-2 py-1 text-xs text-neutral-300">
            <span className="text-neutral-400 hidden md:inline">Table:</span>
            <select
              value={customerTableNumber}
              onChange={(e) => setCustomerTableNumber(Number(e.target.value))}
              aria-label="Select dining table"
              className="bg-transparent font-semibold text-amber-400 focus:outline-none cursor-pointer"
            >
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => (
                <option key={num} value={num} className="bg-neutral-800 text-neutral-200">
                  T-{num} {num === 4 ? '(Our Table)' : ''}
                </option>
              ))}
            </select>
          </div>

          {/* PWA Install Button */}
          <div className="hidden sm:block">
            <PWAInstallButton />
          </div>

          {/* Push Notification button */}
          {pushPermissionState !== 'granted' && (
            <button
              onClick={() => requestPushPermission()}
              className="hidden lg:flex items-center gap-1 text-[11px] bg-neutral-800 hover:bg-neutral-750 text-neutral-300 border border-neutral-700 px-2 py-1 rounded-md transition"
              title="Enable push notifications for kitchen order updates"
            >
              <Bell className="w-3 h-3 text-amber-400" />
              <span>Enable Alerts</span>
            </button>
          )}

          {/* Notification Bell Menu */}
          <div className="relative">
            <button
              onClick={() => {
                setShowNotifMenu(!showNotifMenu);
                if (!showNotifMenu) markAllNotificationsRead();
              }}
              className="relative p-2 rounded-lg bg-neutral-800/80 border border-neutral-700/70 text-neutral-300 hover:text-white hover:bg-neutral-750 transition"
              title="Recent Notifications & Alerts"
            >
              <Bell className="w-4 h-4" />
              {unreadNotifs > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full text-[10px] font-bold flex items-center justify-center animate-pulse">
                  {unreadNotifs}
                </span>
              )}
            </button>

            {/* Notification Dropdown */}
            {showNotifMenu && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-neutral-900 border border-neutral-750 rounded-2xl shadow-2xl overflow-hidden z-50">
                <div className="p-3 bg-neutral-850 border-b border-neutral-800 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Volume2 className="w-4 h-4 text-amber-400" />
                    <span className="text-xs font-semibold text-neutral-200">Real-Time Kitchen & Order Log</span>
                  </div>
                  <span className="text-[10px] text-neutral-400">Live KDS WebSync</span>
                </div>
                <div className="max-h-72 overflow-y-auto divide-y divide-neutral-800/60 p-1">
                  {notifications.length === 0 ? (
                    <div className="p-6 text-center text-xs text-neutral-500">
                      No recent alerts. Place an order or update KDS to see live events.
                    </div>
                  ) : (
                    notifications.map(n => (
                      <div key={n.id} className="p-3 hover:bg-neutral-800/50 rounded-xl transition text-xs">
                        <div className="flex items-center justify-between text-neutral-400 text-[10px] mb-1">
                          <span className="font-semibold text-amber-400 uppercase tracking-wider">{n.type}</span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-2.5 h-2.5" />
                            {n.timestamp}
                          </span>
                        </div>
                        <h4 className="font-medium text-neutral-200">{n.title}</h4>
                        <p className="text-neutral-400 text-[11px] mt-0.5 leading-relaxed">{n.body}</p>
                      </div>
                    ))
                  )}
                </div>
                {notifications.length > 0 && (
                  <div className="p-2 bg-neutral-850/50 border-t border-neutral-800 text-center">
                    <button
                      onClick={() => setShowNotifMenu(false)}
                      className="text-[11px] text-neutral-400 hover:text-white"
                    >
                      Close Log
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Cart Trigger */}
          <button
            onClick={onOpenCart}
            className="flex items-center gap-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-neutral-950 font-bold px-3 py-1.5 rounded-lg shadow-md transition"
          >
            <div className="relative">
              <ShoppingCart className="w-4 h-4" />
              {cartCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full text-[10px] w-4 h-4 flex items-center justify-center font-extrabold border border-neutral-900">
                  {cartCount}
                </span>
              )}
            </div>
            <span className="text-xs hidden sm:inline">Order Tray</span>
          </button>
        </div>
      </div>

      {/* Navigation Sub-bar */}
      <div className="border-t border-neutral-800/80 bg-neutral-950/60 px-3 sm:px-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between overflow-x-auto no-scrollbar py-1.5 gap-2">
          <div className="flex items-center gap-1 sm:gap-2">
            {navItems.map(item => {
              const Icon = item.icon;
              const isActive = currentView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setCurrentView(item.id)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
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

          {/* Quick status ticker */}
          <div className="hidden lg:flex items-center gap-2 text-[11px] text-neutral-400 pr-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>KDS Station Sync: <strong>Rajkamal Hub</strong></span>
          </div>
        </div>
      </div>
    </header>
  );
};
