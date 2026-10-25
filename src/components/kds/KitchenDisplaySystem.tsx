import React, { useState, useEffect } from 'react';
import { useRestaurant } from '../../context/RestaurantContext';
import { Order, OrderStatus, ItemStatus } from '../../types/restaurant';
import { soundEffects } from '../../utils/audio';
import {
  ChefHat,
  Clock,
  CheckCircle2,
  AlertCircle,
  Bell,
  Utensils,
  Flame,
  ArrowRight,
  Filter,
  Volume2,
  Check,
  RefreshCw,
  Sparkles,
  Layers,
} from 'lucide-react';

export const KitchenDisplaySystem: React.FC = () => {
  const {
    orders,
    updateOrderStatus,
    updateOrderItemStatus,
    tables,
  } = useRestaurant();

  const [selectedStation, setSelectedStation] = useState<string>('All Stations');
  const [statusFilter, setStatusFilter] = useState<'active' | 'ready' | 'history'>('active');
  const [currentTime, setCurrentTime] = useState<Date>(new Date());

  // Live timer tick every 10 seconds for ticket wait times
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 10000);
    return () => clearInterval(timer);
  }, []);

  const stations = [
    'All Stations',
    'Curry & Saoji Station',
    'Tandoor & Breads',
    'Rice & Starters',
    'Dessert & Bar',
  ];

  // Filter orders based on status & station
  const filteredOrders = orders.filter(order => {
    // Status filter
    if (statusFilter === 'active') {
      if (order.status !== 'received' && order.status !== 'in_kitchen') return false;
    } else if (statusFilter === 'ready') {
      if (order.status !== 'ready') return false;
    } else if (statusFilter === 'history') {
      if (order.status !== 'served' && order.status !== 'completed') return false;
    }

    // Station filter
    if (selectedStation !== 'All Stations') {
      const hasStationItem = order.items.some(i => i.station === selectedStation);
      if (!hasStationItem) return false;
    }

    return true;
  });

  // Calculate elapsed time in minutes
  const getElapsedMinutes = (createdAt: string) => {
    const diffMs = currentTime.getTime() - new Date(createdAt).getTime();
    return Math.max(0, Math.floor(diffMs / (1000 * 60)));
  };

  const activeTicketCount = orders.filter(o => o.status === 'received' || o.status === 'in_kitchen').length;
  const readyTicketCount = orders.filter(o => o.status === 'ready').length;

  return (
    <div className="space-y-5 pb-20">
      {/* KDS Header & Bump Bar Controls */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 sm:p-5 shadow-2xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-amber-500 to-red-600 flex items-center justify-center shadow-lg shadow-amber-950/40">
              <ChefHat className="w-6 h-6 text-neutral-950" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-white font-['Outfit'] tracking-tight">
                  Amravati Kitchen Display System (KDS)
                </h1>
                <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  Live Sync
                </span>
              </div>
              <p className="text-xs text-neutral-400 mt-0.5">
                Real-time ticket bump bar & cooking station coordinator
              </p>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="flex items-center gap-3 flex-wrap">
            <button
              onClick={() => soundEffects.playKitchenBell()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-750 text-neutral-300 border border-neutral-700 text-xs font-semibold transition"
              title="Test Kitchen Bell Sound"
            >
              <Volume2 className="w-3.5 h-3.5 text-amber-400" />
              <span>Test Bell</span>
            </button>

            <div className="flex items-center gap-1.5 bg-neutral-950 px-3 py-1.5 rounded-xl border border-neutral-800 text-xs">
              <span className="text-neutral-400">Cooking:</span>
              <span className="font-extrabold text-amber-400">{activeTicketCount}</span>
            </div>

            <div className="flex items-center gap-1.5 bg-neutral-950 px-3 py-1.5 rounded-xl border border-neutral-800 text-xs">
              <span className="text-neutral-400">Plated Ready:</span>
              <span className="font-extrabold text-emerald-400">{readyTicketCount}</span>
            </div>
          </div>
        </div>

        {/* Filter Navigation */}
        <div className="mt-4 pt-4 border-t border-neutral-800/80 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Status Tabs */}
          <div className="flex items-center gap-1.5 bg-neutral-950 p-1 rounded-xl border border-neutral-800">
            <button
              onClick={() => setStatusFilter('active')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                statusFilter === 'active'
                  ? 'bg-amber-500 text-neutral-950 shadow-sm'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <span>Active Orders</span>
              {activeTicketCount > 0 && (
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-extrabold ${statusFilter === 'active' ? 'bg-neutral-950 text-amber-400' : 'bg-amber-500 text-neutral-950'}`}>
                  {activeTicketCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setStatusFilter('ready')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                statusFilter === 'ready'
                  ? 'bg-emerald-500 text-neutral-950 shadow-sm'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <span>Ready for Table</span>
              {readyTicketCount > 0 && (
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-extrabold ${statusFilter === 'ready' ? 'bg-neutral-950 text-emerald-400' : 'bg-emerald-500 text-neutral-950'}`}>
                  {readyTicketCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setStatusFilter('history')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                statusFilter === 'history'
                  ? 'bg-neutral-700 text-white shadow-sm'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              Served History
            </button>
          </div>

          {/* Station Selector */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            {stations.map(st => (
              <button
                key={st}
                onClick={() => setSelectedStation(st)}
                className={`px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition ${
                  selectedStation === st
                    ? 'bg-neutral-800 text-amber-400 border border-amber-500/40 font-semibold'
                    : 'text-neutral-400 hover:text-neutral-200 border border-transparent'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* KDS Ticket Cards Grid */}
      {filteredOrders.length === 0 ? (
        <div className="bg-neutral-900/60 border border-neutral-800 rounded-2xl p-12 text-center text-neutral-500">
          <ChefHat className="w-12 h-12 mx-auto stroke-1 text-neutral-600 mb-2" />
          <h3 className="text-base font-bold text-neutral-300">All Clean on the Line!</h3>
          <p className="text-xs text-neutral-500 mt-1">
            No orders currently pending under this filter. New customer table orders will ding and appear here in real time.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredOrders.map(order => {
            const elapsedMins = getElapsedMinutes(order.createdAt);
            const isLate = elapsedMins >= 15;
            const isWarning = elapsedMins >= 8 && elapsedMins < 15;

            // Highlight color based on urgency
            const urgencyBg =
              order.status === 'ready'
                ? 'border-emerald-500/60 bg-emerald-950/20'
                : isLate
                ? 'border-red-500 bg-red-950/20 ring-1 ring-red-500/50'
                : isWarning
                ? 'border-amber-500/60 bg-amber-950/20'
                : 'border-neutral-800 bg-neutral-900';

            return (
              <div
                key={order.id}
                className={`rounded-2xl border flex flex-col justify-between overflow-hidden shadow-xl transition-all ${urgencyBg}`}
              >
                <div>
                  {/* Ticket Header */}
                  <div className="p-3.5 border-b border-neutral-800 flex items-center justify-between bg-neutral-950/60">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm font-black text-amber-400">
                          #{order.orderNumber}
                        </span>
                        <span className="text-xs font-bold text-white px-2 py-0.5 rounded bg-neutral-800 border border-neutral-700">
                          Table {order.tableNumber}
                        </span>
                      </div>
                      <p className="text-[11px] text-neutral-400 mt-0.5">
                        {order.section} &bull; {order.customerName || 'Dine-In Guest'}
                      </p>
                    </div>

                    {/* Timer */}
                    <div className="text-right">
                      <div
                        className={`flex items-center gap-1 font-mono text-xs font-bold px-2 py-1 rounded-md ${
                          order.status === 'ready'
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : isLate
                            ? 'bg-red-500 text-white animate-pulse'
                            : isWarning
                            ? 'bg-amber-500/20 text-amber-400'
                            : 'bg-neutral-800 text-neutral-300'
                        }`}
                      >
                        <Clock className="w-3.5 h-3.5" />
                        <span>{elapsedMins}m ago</span>
                      </div>
                      <span className="text-[10px] text-neutral-500 block mt-0.5">
                        Est: {order.estimatedPrepMinutes}m
                      </span>
                    </div>
                  </div>

                  {/* Special Cooking Instructions Banner */}
                  {order.waiterNotes && (
                    <div className="p-2.5 bg-amber-500/10 border-b border-amber-500/20 text-amber-300 text-xs flex items-center gap-2">
                      <Flame className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <span className="italic font-medium">{order.waiterNotes}</span>
                    </div>
                  )}

                  {/* Ticket Items List */}
                  <div className="p-3.5 divide-y divide-neutral-800/70">
                    {order.items.map((item, idx) => {
                      const isItemMatchingStation = selectedStation === 'All Stations' || item.station === selectedStation;
                      return (
                        <div
                          key={`${order.id}-item-${item.menuItemId}-${idx}`}
                          className={`py-2.5 flex items-start justify-between gap-3 text-xs ${
                            !isItemMatchingStation ? 'opacity-40' : ''
                          }`}
                        >
                          <div className="space-y-0.5 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-black text-amber-400 text-sm">
                                {item.quantity}x
                              </span>
                              <span className="font-semibold text-neutral-100">
                                {item.name}
                              </span>
                            </div>
                            <span className="text-[11px] text-neutral-400 block font-serif">
                              {item.localName}
                            </span>
                            <span className="text-[10px] text-neutral-500">
                              {item.station}
                            </span>
                          </div>

                          {/* Individual Item Status Toggle */}
                          <button
                            onClick={() => {
                              const nextStatus: ItemStatus =
                                item.status === 'pending'
                                  ? 'preparing'
                                  : item.status === 'preparing'
                                  ? 'ready'
                                  : 'served';
                              updateOrderItemStatus(order.id, idx, nextStatus);
                            }}
                            className={`px-2 py-1 rounded text-[10px] font-bold uppercase transition flex items-center gap-1 ${
                              item.status === 'ready'
                                ? 'bg-emerald-500 text-neutral-950'
                                : item.status === 'preparing'
                                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                                : item.status === 'served'
                                ? 'bg-neutral-800 text-neutral-400'
                                : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
                            }`}
                          >
                            {item.status === 'ready' && <Check className="w-3 h-3 stroke-[3]" />}
                            <span>{item.status}</span>
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Ticket Bump Bar Footer */}
                <div className="p-3.5 bg-neutral-950/80 border-t border-neutral-800 flex items-center justify-between gap-2">
                  <div className="text-[11px] text-neutral-400">
                    Status: <strong className="text-white capitalize">{order.status.replace('_', ' ')}</strong>
                  </div>

                  <div className="flex items-center gap-2">
                    {order.status === 'received' && (
                      <button
                        onClick={() => updateOrderStatus(order.id, 'in_kitchen')}
                        className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs flex items-center gap-1.5 shadow-md transition"
                      >
                        <ChefHat className="w-3.5 h-3.5" />
                        <span>Start Prep</span>
                      </button>
                    )}

                    {order.status === 'in_kitchen' && (
                      <button
                        onClick={() => updateOrderStatus(order.id, 'ready')}
                        className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-black text-xs flex items-center gap-1.5 shadow-md transition"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Mark Ready</span>
                      </button>
                    )}

                    {order.status === 'ready' && (
                      <button
                        onClick={() => updateOrderStatus(order.id, 'served')}
                        className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md transition"
                      >
                        <Utensils className="w-3.5 h-3.5" />
                        <span>Bump (Served)</span>
                      </button>
                    )}

                    {(order.status === 'served' || order.status === 'completed') && (
                      <button
                        onClick={() => updateOrderStatus(order.id, 'in_kitchen')}
                        className="px-2.5 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs flex items-center gap-1 transition"
                        title="Recall order back to active line"
                      >
                        <RefreshCw className="w-3 h-3" />
                        <span>Recall</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
