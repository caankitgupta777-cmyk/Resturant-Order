import React, { useState } from 'react';
import { useRestaurant } from '../../context/RestaurantContext';
import { InventoryItem } from '../../types/restaurant';
import {
  Boxes,
  AlertTriangle,
  CheckCircle2,
  Plus,
  RefreshCw,
  TrendingDown,
  ShieldAlert,
  Coins,
  Package,
  ArrowUpRight,
  Info,
} from 'lucide-react';

export const InventoryManagementView: React.FC = () => {
  const {
    inventory,
    updateInventoryStock,
    restockItem,
    menu,
    orders,
  } = useRestaurant();

  const [selectedItemForRestock, setSelectedItemForRestock] = useState<InventoryItem | null>(null);
  const [restockAmount, setRestockAmount] = useState<number>(10);
  const [filterStockStatus, setFilterStockStatus] = useState<'all' | 'low' | 'out'>('all');

  // Total valuation
  const totalValuation = inventory.reduce((sum, item) => sum + (item.inStock * item.costPerUnit), 0);
  const lowStockCount = inventory.filter(i => i.inStock > 0 && i.inStock <= i.minThreshold).length;
  const outOfStockCount = inventory.filter(i => i.inStock <= 0).length;

  const filteredInventory = inventory.filter(item => {
    if (filterStockStatus === 'low') return item.inStock > 0 && item.inStock <= item.minThreshold;
    if (filterStockStatus === 'out') return item.inStock <= 0;
    return true;
  });

  const handleRestockSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItemForRestock || restockAmount <= 0) return;
    restockItem(selectedItemForRestock.id, restockAmount);
    setSelectedItemForRestock(null);
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Header Banner */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 sm:p-5 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center text-neutral-950 shadow-lg shadow-amber-950/40">
            <Boxes className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-white font-['Outfit'] tracking-tight">
                Kitchen Inventory Database & Stock Guard
              </h1>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                Discrepancy Prevention Active
              </span>
            </div>
            <p className="text-xs text-neutral-400 mt-0.5">
              Live ingredient deductions prevent overselling & maintain kitchen readiness
            </p>
          </div>
        </div>

        {/* Inventory High Level KPIs */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="px-3 py-2 rounded-xl bg-neutral-950 border border-neutral-800 text-xs">
            <span className="text-neutral-400 block text-[10px]">Total Stock Value</span>
            <span className="font-extrabold text-amber-400 text-sm">₹{Math.round(totalValuation).toLocaleString()}</span>
          </div>

          <div className="px-3 py-2 rounded-xl bg-neutral-950 border border-neutral-800 text-xs">
            <span className="text-neutral-400 block text-[10px]">Low Stock Alert</span>
            <span className={`font-extrabold text-sm ${lowStockCount > 0 ? 'text-amber-400' : 'text-neutral-300'}`}>
              {lowStockCount} items
            </span>
          </div>

          <div className="px-3 py-2 rounded-xl bg-neutral-950 border border-neutral-800 text-xs">
            <span className="text-neutral-400 block text-[10px]">Sold Out</span>
            <span className={`font-extrabold text-sm ${outOfStockCount > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
              {outOfStockCount} items
            </span>
          </div>
        </div>
      </div>

      {/* Discrepancy Prevention Rule Explanation */}
      <div className="p-3.5 bg-amber-500/10 border border-amber-500/30 rounded-xl text-xs text-amber-300 flex items-start gap-2.5">
        <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <strong>Auto-Discrepancy Prevention Guard:</strong> Every customer order placed automatically decrements corresponding ingredient portions (such as Malai Paneer, Saoji Masala, or Rajkamal Rabdi). If an ingredient reaches zero, all associated dishes are locked as &quot;Sold Out&quot; on customer menus to avoid kitchen bottlenecks.
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setFilterStockStatus('all')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
            filterStockStatus === 'all'
              ? 'bg-amber-500 text-neutral-950 font-bold'
              : 'bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white'
          }`}
        >
          All Items ({inventory.length})
        </button>

        <button
          onClick={() => setFilterStockStatus('low')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
            filterStockStatus === 'low'
              ? 'bg-amber-500 text-neutral-950 font-bold'
              : 'bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white'
          }`}
        >
          <span>Low Threshold Alert</span>
          {lowStockCount > 0 && (
            <span className="bg-amber-600 text-white text-[10px] px-1.5 rounded-full font-bold">
              {lowStockCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setFilterStockStatus('out')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
            filterStockStatus === 'out'
              ? 'bg-amber-500 text-neutral-950 font-bold'
              : 'bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white'
          }`}
        >
          <span>Out of Stock</span>
          {outOfStockCount > 0 && (
            <span className="bg-red-500 text-white text-[10px] px-1.5 rounded-full font-bold">
              {outOfStockCount}
            </span>
          )}
        </button>
      </div>

      {/* Inventory Table */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-neutral-950 text-neutral-400 uppercase text-[10px] font-bold tracking-wider border-b border-neutral-800">
              <tr>
                <th className="py-3 px-4">Ingredient / Stock Name</th>
                <th className="py-3 px-4">Current Stock</th>
                <th className="py-3 px-4">Min. Threshold</th>
                <th className="py-3 px-4">Unit Cost</th>
                <th className="py-3 px-4">Status & Protection</th>
                <th className="py-3 px-4">Linked Amravati Dishes</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/80">
              {filteredInventory.map(item => {
                const isOut = item.inStock <= 0;
                const isLow = item.inStock > 0 && item.inStock <= item.minThreshold;

                // Find linked dish names
                const linkedDishNames = menu
                  .filter(m => m.inventoryItemId === item.id)
                  .map(m => m.name);

                return (
                  <tr key={item.id} className="hover:bg-neutral-800/40 transition">
                    <td className="py-3.5 px-4 font-semibold text-neutral-100">
                      {item.name}
                    </td>

                    <td className="py-3.5 px-4 font-mono font-bold text-sm">
                      <span className={isOut ? 'text-red-400' : isLow ? 'text-amber-400' : 'text-emerald-400'}>
                        {item.inStock}
                      </span>{' '}
                      <span className="text-[11px] text-neutral-400 font-normal">{item.localUnit}</span>
                    </td>

                    <td className="py-3.5 px-4 text-neutral-400 font-mono">
                      {item.minThreshold} {item.localUnit}
                    </td>

                    <td className="py-3.5 px-4 text-neutral-300 font-mono">
                      ₹{item.costPerUnit} / {item.localUnit}
                    </td>

                    <td className="py-3.5 px-4">
                      {isOut ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-red-500/20 text-red-400 border border-red-500/30">
                          <ShieldAlert className="w-3 h-3" />
                          Sold Out Guard Active
                        </span>
                      ) : isLow ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                          <AlertTriangle className="w-3 h-3" />
                          Low Stock Alert
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                          <CheckCircle2 className="w-3 h-3" />
                          Healthy Stock
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-[11px] text-neutral-400 max-w-xs truncate">
                      {linkedDishNames.join(', ') || 'General Prep'}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => {
                            setSelectedItemForRestock(item);
                            setRestockAmount(10);
                          }}
                          className="px-2.5 py-1 bg-neutral-800 hover:bg-neutral-700 text-amber-400 font-bold rounded-lg text-xs transition flex items-center gap-1"
                        >
                          <Plus className="w-3 h-3" />
                          <span>Restock</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Restock Modal */}
      {selectedItemForRestock && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-2xl bg-neutral-900 border border-neutral-750 p-6 shadow-2xl text-neutral-100">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
              <h3 className="text-base font-bold text-white">
                Restock Inventory Item
              </h3>
              <button
                onClick={() => setSelectedItemForRestock(null)}
                className="text-neutral-400 hover:text-white p-1"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleCreateRestock} className="mt-4 space-y-4 text-xs">
              <div>
                <span className="text-neutral-400 block">Item:</span>
                <span className="text-sm font-bold text-white">{selectedItemForRestock.name}</span>
                <p className="text-[11px] text-amber-400 mt-0.5">
                  Current Stock: {selectedItemForRestock.inStock} {selectedItemForRestock.localUnit}
                </p>
              </div>

              <div>
                <label className="text-neutral-300 font-semibold block mb-1">
                  Add Stock Quantity ({selectedItemForRestock.localUnit})
                </label>
                <div className="flex items-center gap-2 mb-2">
                  {[5, 10, 25, 50].map(amt => (
                    <button
                      type="button"
                      key={amt}
                      onClick={() => setRestockAmount(amt)}
                      className={`flex-1 py-1 rounded-lg font-bold border ${
                        restockAmount === amt
                          ? 'bg-amber-500 text-neutral-950 border-amber-400'
                          : 'bg-neutral-800 text-neutral-300 border-neutral-700'
                      }`}
                    >
                      +{amt}
                    </button>
                  ))}
                </div>
                <input
                  type="number"
                  min="1"
                  step="0.5"
                  value={restockAmount}
                  onChange={(e) => setRestockAmount(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-white font-mono focus:outline-none focus:border-amber-500/50"
                />
              </div>

              <div className="p-3 bg-neutral-950 rounded-xl border border-neutral-800 text-[11px] text-neutral-400">
                New Projected Stock: <strong className="text-emerald-400 font-mono text-xs">{selectedItemForRestock.inStock + restockAmount} {selectedItemForRestock.localUnit}</strong>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedItemForRestock(null)}
                  className="px-4 py-2 text-neutral-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold rounded-xl shadow-md transition"
                >
                  Confirm Restock
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );

  function handleCreateRestock(e: React.FormEvent) {
    e.preventDefault();
    handleRestockSubmit(e);
  }
};
