import React, { useState, useMemo } from 'react';
import { useRestaurant } from '../../context/RestaurantContext';
import { MenuItem } from '../../types/restaurant';
import {
  Flame,
  Search,
  Clock,
  Plus,
  Minus,
  Check,
  AlertTriangle,
  BellRing,
  CreditCard,
  ChefHat,
  Sparkles,
  Droplets,
  HelpCircle,
  Receipt,
  CheckCircle2,
} from 'lucide-react';

interface CustomerViewProps {
  onOpenSplitBill: (orderId: string) => void;
}

export const CustomerView: React.FC<CustomerViewProps> = ({ onOpenSplitBill }) => {
  const {
    menu,
    inventory,
    tables,
    customerTableNumber,
    cart,
    addToCart,
    updateCartQuantity,
    orders,
    callWaiter,
  } = useRestaurant();

  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [vegOnly, setVegOnly] = useState(false);
  const [showCallWaiterModal, setShowCallWaiterModal] = useState(false);
  const [waiterCallSent, setWaiterCallSent] = useState<string | null>(null);

  // Find table details
  const currentTable = tables.find(t => t.number === customerTableNumber);

  // Find active order for this table
  const activeOrder = orders.find(
    o => o.tableNumber === customerTableNumber && (o.status !== 'completed' && o.status !== 'cancelled')
  );

  // Categories list
  const categories = ['All', 'Varhadi Specials', 'Saoji Treats', 'Breads & Rice', 'Starters', 'Amravati Sweets', 'Beverages'];

  // Filter menu
  const filteredDishes = useMemo(() => {
    return menu.filter(item => {
      if (selectedCategory !== 'All' && item.category !== selectedCategory) return false;
      if (vegOnly && !item.isVeg) return false;
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesName = item.name.toLowerCase().includes(query);
        const matchesLocal = item.localName.toLowerCase().includes(query);
        const matchesDesc = item.description.toLowerCase().includes(query);
        const matchesCategory = item.category.toLowerCase().includes(query);
        if (!matchesName && !matchesLocal && !matchesDesc && !matchesCategory) return false;
      }
      return true;
    });
  }, [menu, selectedCategory, vegOnly, searchQuery]);

  // Handle Waiter Call
  const handleCall = (type: 'water' | 'service' | 'bill') => {
    callWaiter(customerTableNumber, type);
    setWaiterCallSent(type);
    setTimeout(() => {
      setShowCallWaiterModal(false);
      setWaiterCallSent(null);
    }, 2000);
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Table Greeting & Quick Service Ribbon */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 sm:p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                Table #{customerTableNumber} &bull; {currentTable?.section || 'AC Dining'}
              </span>
              <span className="text-xs text-neutral-400">
                Status: <strong className="capitalize text-neutral-200">{currentTable?.status || 'Active'}</strong>
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white font-['Outfit'] tracking-tight">
              Varhad Heritage Dining & Rasoi
            </h1>
            <p className="text-xs sm:text-sm text-neutral-400 mt-1 max-w-xl">
              Authentic Saoji & Varhadi culinary traditions of Amravati City. Orders are routed directly to our Kitchen Display System.
            </p>
          </div>

          {/* Quick Table Actions */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setShowCallWaiterModal(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-750 text-neutral-200 border border-neutral-700 text-xs font-semibold transition"
            >
              <BellRing className="w-3.5 h-3.5 text-amber-400" />
              <span>Call Server</span>
            </button>

            {activeOrder && (
              <button
                onClick={() => onOpenSplitBill(activeOrder.id)}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-md shadow-emerald-950/40 transition"
              >
                <CreditCard className="w-3.5 h-3.5" />
                <span>Split Bill & Pay</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Active Order Live Tracker (if there's an ongoing order for this table) */}
      {activeOrder && (
        <div className="bg-neutral-900/90 border border-amber-500/30 rounded-2xl p-4 sm:p-5 shadow-lg relative">
          <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
            <div className="flex items-center gap-2">
              <ChefHat className="w-5 h-5 text-amber-400" />
              <div>
                <h3 className="text-sm font-bold text-white">
                  Live Kitchen Order: #{activeOrder.orderNumber}
                </h3>
                <p className="text-[11px] text-neutral-400">
                  {activeOrder.items.length} item(s) &bull; Est. Prep Time: {activeOrder.estimatedPrepMinutes} mins
                </p>
              </div>
            </div>

            <div className="text-right">
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold capitalize ${
                activeOrder.status === 'received' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' :
                activeOrder.status === 'in_kitchen' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30 animate-pulse' :
                activeOrder.status === 'ready' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                activeOrder.status === 'served' ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' :
                'bg-neutral-800 text-neutral-300'
              }`}>
                {activeOrder.status.replace('_', ' ')}
              </span>
            </div>
          </div>

          {/* Progress Timeline Stepper */}
          <div className="mt-4 grid grid-cols-4 gap-2 text-center">
            {[
              { key: 'received', label: 'Received in KDS', desc: 'Order confirmed' },
              { key: 'in_kitchen', label: 'Chef Preparing', desc: 'Spices blending' },
              { key: 'ready', label: 'Plated & Ready', desc: 'Hot on counter' },
              { key: 'served', label: 'Served', desc: 'Enjoy your meal' },
            ].map((step, idx) => {
              const statusOrder = ['received', 'in_kitchen', 'ready', 'served', 'billed', 'completed'];
              const currentIdx = statusOrder.indexOf(activeOrder.status);
              const isPast = currentIdx >= idx;
              const isCurrent = activeOrder.status === step.key;

              return (
                <div key={step.key} className="flex flex-col items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold mb-1 transition-all ${
                    isPast
                      ? 'bg-amber-500 text-neutral-950 ring-4 ring-amber-500/20'
                      : 'bg-neutral-800 text-neutral-500 border border-neutral-700'
                  }`}>
                    {isPast ? <Check className="w-4 h-4 stroke-[3]" /> : idx + 1}
                  </div>
                  <span className={`text-[11px] font-semibold ${isCurrent ? 'text-amber-400' : isPast ? 'text-neutral-200' : 'text-neutral-500'}`}>
                    {step.label}
                  </span>
                  <span className="text-[10px] text-neutral-500 hidden sm:inline">
                    {step.desc}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Quick item peek */}
          <div className="mt-3 pt-3 border-t border-neutral-800/80 flex items-center justify-between text-xs text-neutral-400">
            <span className="truncate max-w-md">
              Dishes: {activeOrder.items.map(i => `${i.name} (x${i.quantity})`).join(', ')}
            </span>
            <span className="font-semibold text-neutral-200">
              Total: ₹{activeOrder.totalAmount}
            </span>
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Search box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search Amravati Saoji, Patodi Rassa, Rabdi Jalebi, Poha..."
              className="w-full pl-10 pr-4 py-2 bg-neutral-900 border border-neutral-800 rounded-xl text-xs sm:text-sm text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-amber-500/50"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 text-xs hover:text-white"
              >
                Clear
              </button>
            )}
          </div>

          {/* Veg Only filter toggle */}
          <label className="flex items-center gap-2 cursor-pointer bg-neutral-900 border border-neutral-800 px-3 py-2 rounded-xl text-xs font-semibold text-neutral-300 select-none">
            <input
              type="checkbox"
              checked={vegOnly}
              onChange={(e) => setVegOnly(e.target.checked)}
              className="rounded border-neutral-700 text-amber-500 focus:ring-0"
            />
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <span>Pure Veg Only</span>
          </label>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                selectedCategory === cat
                  ? 'bg-amber-500 text-neutral-950 font-bold shadow-md shadow-amber-950/30'
                  : 'bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-neutral-200 hover:border-neutral-700'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Menu Dishes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredDishes.map(dish => {
          const invItem = inventory.find(i => i.id === dish.inventoryItemId);
          const isOutOfStock = invItem ? invItem.inStock <= 0 : false;
          const isLowStock = invItem ? invItem.inStock > 0 && invItem.inStock <= invItem.minThreshold : false;
          const cartEntry = cart.find(c => c.item.id === dish.id);
          const cartQuantity = cartEntry?.quantity || 0;

          return (
            <div
              key={dish.id}
              className={`rounded-2xl border transition-all duration-200 overflow-hidden flex flex-col justify-between ${
                isOutOfStock
                  ? 'bg-neutral-900/40 border-neutral-800/60 opacity-65'
                  : 'bg-neutral-900 border-neutral-800 hover:border-neutral-700 shadow-lg hover:shadow-xl'
              }`}
            >
              <div>
                {/* Dish Image Banner */}
                <div className="relative h-44 w-full overflow-hidden bg-neutral-950">
                  <img
                    src={dish.image}
                    alt={dish.name}
                    className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/20 to-transparent" />

                  {/* Veg / Non-Veg badge */}
                  <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                    <span className={`w-5 h-5 rounded border bg-neutral-950/90 flex items-center justify-center ${
                      dish.isVeg ? 'border-emerald-500 text-emerald-500' : 'border-red-500 text-red-500'
                    }`}>
                      <span className={`w-2 h-2 rounded-full ${dish.isVeg ? 'bg-emerald-500' : 'bg-red-500'}`} />
                    </span>

                    {dish.isAmravatiSpecial && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-neutral-950 shadow-md flex items-center gap-1">
                        <Sparkles className="w-2.5 h-2.5" />
                        Amravati Special
                      </span>
                    )}
                  </div>

                  {/* Spice indicator */}
                  {dish.spiceLevel && dish.spiceLevel > 0 && (
                    <div className="absolute top-2.5 right-2.5 bg-neutral-950/80 backdrop-blur-md px-2 py-0.5 rounded-md text-[10px] text-red-400 font-semibold border border-red-500/20 flex items-center gap-0.5">
                      <Flame className="w-3 h-3 text-red-500 fill-red-500" />
                      <span>{dish.spiceLevel === 3 ? 'Saoji Fire' : 'Zanzanit'}</span>
                    </div>
                  )}

                  {/* Stock Alert Badge */}
                  {isOutOfStock ? (
                    <div className="absolute bottom-2 left-2.5 bg-red-600/90 text-white text-[11px] font-bold px-2 py-0.5 rounded flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" />
                      Sold Out in Kitchen
                    </div>
                  ) : isLowStock ? (
                    <div className="absolute bottom-2 left-2.5 bg-amber-600/90 text-neutral-950 text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      Only {invItem?.inStock} {invItem?.localUnit} left!
                    </div>
                  ) : null}
                </div>

                {/* Dish Info */}
                <div className="p-4 space-y-2">
                  <div>
                    <h3 className="font-bold text-neutral-100 text-base leading-snug font-['Outfit']">
                      {dish.name}
                    </h3>
                    <p className="text-xs text-amber-400 font-medium font-serif mt-0.5">
                      {dish.localName}
                    </p>
                  </div>

                  <p className="text-xs text-neutral-400 line-clamp-2 leading-relaxed">
                    {dish.description}
                  </p>

                  <div className="flex items-center gap-3 text-[11px] text-neutral-400 pt-1">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-amber-400" />
                      {dish.prepTimeMinutes} mins
                    </span>
                    <span>&bull;</span>
                    <span className="text-neutral-400">{dish.station}</span>
                  </div>
                </div>
              </div>

              {/* Card Footer: Price & Add to Cart */}
              <div className="p-4 pt-0 border-t border-neutral-800/80 flex items-center justify-between mt-2">
                <div>
                  <span className="text-xs text-neutral-400">Price</span>
                  <div className="text-lg font-black text-white">
                    ₹{dish.price}
                  </div>
                </div>

                {/* Cart Control or Out of Stock */}
                {isOutOfStock ? (
                  <button
                    disabled
                    className="px-3.5 py-1.5 bg-neutral-800 text-neutral-500 rounded-xl text-xs font-semibold cursor-not-allowed border border-neutral-700/50"
                  >
                    Unavailable
                  </button>
                ) : cartQuantity > 0 ? (
                  <div className="flex items-center gap-2 bg-neutral-800 border border-neutral-700 rounded-xl p-1 shadow-inner">
                    <button
                      onClick={() => updateCartQuantity(dish.id, cartQuantity - 1)}
                      className="w-7 h-7 rounded-lg bg-neutral-700 text-white flex items-center justify-center hover:bg-neutral-600 transition"
                      aria-label="Decrease quantity"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="w-5 text-center text-xs font-extrabold text-amber-400">
                      {cartQuantity}
                    </span>
                    <button
                      onClick={() => updateCartQuantity(dish.id, cartQuantity + 1)}
                      className="w-7 h-7 rounded-lg bg-amber-500 text-neutral-950 flex items-center justify-center font-bold hover:bg-amber-400 transition"
                      aria-label="Increase quantity"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => addToCart(dish)}
                    className="flex items-center gap-1.5 bg-neutral-800 hover:bg-amber-500 hover:text-neutral-950 text-neutral-200 border border-neutral-700 hover:border-amber-400 font-bold px-3.5 py-2 rounded-xl text-xs transition shadow-sm"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Call Waiter Modal */}
      {showCallWaiterModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-2xl bg-neutral-900 border border-neutral-750 p-6 shadow-2xl text-neutral-100">
            <h3 className="text-base font-bold text-white mb-1 flex items-center gap-2">
              <BellRing className="w-4 h-4 text-amber-400" />
              Call Server for Table #{customerTableNumber}
            </h3>
            <p className="text-xs text-neutral-400 mb-4">
              Select your request and your assigned table server will be notified immediately.
            </p>

            {waiterCallSent ? (
              <div className="py-4 text-center text-sm font-semibold text-emerald-400 flex flex-col items-center gap-2">
                <CheckCircle2 className="w-8 h-8 animate-bounce text-emerald-400" />
                Request for {waiterCallSent.toUpperCase()} sent to waiter console!
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-2.5">
                <button
                  onClick={() => handleCall('water')}
                  className="flex items-center justify-between p-3 rounded-xl bg-neutral-800 hover:bg-neutral-750 border border-neutral-700 text-left transition"
                >
                  <div className="flex items-center gap-2.5">
                    <Droplets className="w-4 h-4 text-blue-400" />
                    <span className="text-xs font-semibold text-neutral-200">Drinking Water / Glasses</span>
                  </div>
                  <span className="text-[10px] text-neutral-400">Tap to call</span>
                </button>

                <button
                  onClick={() => handleCall('service')}
                  className="flex items-center justify-between p-3 rounded-xl bg-neutral-800 hover:bg-neutral-750 border border-neutral-700 text-left transition"
                >
                  <div className="flex items-center gap-2.5">
                    <HelpCircle className="w-4 h-4 text-amber-400" />
                    <span className="text-xs font-semibold text-neutral-200">Table Assistance / Extra Cutlery</span>
                  </div>
                  <span className="text-[10px] text-neutral-400">Tap to call</span>
                </button>

                <button
                  onClick={() => handleCall('bill')}
                  className="flex items-center justify-between p-3 rounded-xl bg-neutral-800 hover:bg-neutral-750 border border-neutral-700 text-left transition"
                >
                  <div className="flex items-center gap-2.5">
                    <Receipt className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs font-semibold text-neutral-200">Request Final Bill / Invoice</span>
                  </div>
                  <span className="text-[10px] text-neutral-400">Tap to call</span>
                </button>

                <button
                  onClick={() => setShowCallWaiterModal(false)}
                  className="mt-2 w-full py-2 text-xs text-neutral-400 hover:text-white"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
