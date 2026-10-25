import React, { useState } from 'react';
import { useRestaurant } from '../../context/RestaurantContext';
import { printZReport } from '../../utils/printInvoice';
import {
  Banknote,
  Receipt,
  X,
  Printer,
  CheckCircle2,
  AlertTriangle,
  History,
  Lock,
  ArrowRight,
  Calculator,
} from 'lucide-react';

interface CashRegisterModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CashRegisterModal: React.FC<CashRegisterModalProps> = ({ isOpen, onClose }) => {
  const {
    activeShift,
    openRegisterShift,
    closeRegisterShift,
    shiftHistory,
    restaurantSettings,
  } = useRestaurant();

  const [activeTab, setActiveTab] = useState<'current' | 'close' | 'history'>('current');

  // Open Shift Form State
  const [openingFloatInput, setOpeningFloatInput] = useState<number>(2000);
  const [openNotes, setOpenNotes] = useState<string>('Standard morning cash drawer float');

  // Close Shift Denominations State
  const [denom500, setDenom500] = useState<number>(0);
  const [denom200, setDenom200] = useState<number>(0);
  const [denom100, setDenom100] = useState<number>(0);
  const [denom50, setDenom50] = useState<number>(0);
  const [denom20, setDenom20] = useState<number>(0);
  const [denom10, setDenom10] = useState<number>(0);
  const [coins, setCoins] = useState<number>(0);
  const [closeNotes, setCloseNotes] = useState<string>('');

  if (!isOpen) return null;

  const actualCashCounted =
    denom500 * 500 +
    denom200 * 200 +
    denom100 * 100 +
    denom50 * 50 +
    denom20 * 20 +
    denom10 * 10 +
    coins;

  const expectedCash = activeShift ? activeShift.expectedCash : 0;
  const discrepancy = actualCashCounted - expectedCash;

  const handleStartShift = (e: React.FormEvent) => {
    e.preventDefault();
    openRegisterShift(openingFloatInput, openNotes);
    setActiveTab('current');
  };

  const handleExecuteCloseShift = () => {
    if (!activeShift) return;
    const { shift } = closeRegisterShift(actualCashCounted, closeNotes);
    printZReport(shift, restaurantSettings);
    setActiveTab('history');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 overflow-y-auto font-['Outfit']">
      <div className="w-full max-w-2xl bg-neutral-900 border border-neutral-750 rounded-3xl shadow-2xl p-5 sm:p-6 text-neutral-100 space-y-4 max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Banknote className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white">
                Cash Register &amp; Shift Settlement (Z-Report)
              </h2>
              <p className="text-xs text-neutral-400">
                Opening cash drawer, physical currency reconciliation, and day-end audits
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-neutral-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selectors */}
        <div className="flex gap-2 border-b border-neutral-800 pb-2">
          <button
            type="button"
            onClick={() => setActiveTab('current')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
              activeTab === 'current'
                ? 'bg-amber-500 text-neutral-950'
                : 'text-neutral-400 hover:text-white bg-neutral-800/60'
            }`}
          >
            Live Register Status
          </button>
          {activeShift && (
            <button
              type="button"
              onClick={() => setActiveTab('close')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                activeTab === 'close'
                  ? 'bg-emerald-500 text-neutral-950'
                  : 'text-neutral-400 hover:text-white bg-neutral-800/60'
              }`}
            >
              <span>Close Shift &amp; Z-Report</span>
            </button>
          )}
          <button
            type="button"
            onClick={() => setActiveTab('history')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              activeTab === 'history'
                ? 'bg-amber-500 text-neutral-950'
                : 'text-neutral-400 hover:text-white bg-neutral-800/60'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Shift History ({shiftHistory.length})</span>
          </button>
        </div>

        {/* TAB 1: Live Status or Open Form */}
        {activeTab === 'current' && (
          <div className="flex-1 overflow-y-auto space-y-4">
            {activeShift ? (
              <div className="space-y-4 text-xs">
                {/* Active Shift Summary Card */}
                <div className="p-4 rounded-2xl bg-neutral-950 border border-neutral-800 space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-neutral-800">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                      <span className="font-bold text-white text-sm">Shift Active ({activeShift.id})</span>
                    </div>
                    <span className="text-neutral-400">
                      Opened by: <strong className="text-white">{activeShift.openedBy}</strong>
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    <div className="p-3 bg-neutral-900 rounded-xl border border-neutral-800">
                      <span className="text-[10px] text-neutral-400 block">Opening Float</span>
                      <span className="text-base font-bold font-mono text-white">
                        {restaurantSettings.currencySymbol}{activeShift.openingFloat}
                      </span>
                    </div>

                    <div className="p-3 bg-neutral-900 rounded-xl border border-neutral-800">
                      <span className="text-[10px] text-neutral-400 block">Cash Sales</span>
                      <span className="text-base font-bold font-mono text-amber-400">
                        {restaurantSettings.currencySymbol}{activeShift.cashSales}
                      </span>
                    </div>

                    <div className="p-3 bg-neutral-900 rounded-xl border border-neutral-800">
                      <span className="text-[10px] text-neutral-400 block">UPI / QR Sales</span>
                      <span className="text-base font-bold font-mono text-emerald-400">
                        {restaurantSettings.currencySymbol}{activeShift.upiSales}
                      </span>
                    </div>

                    <div className="p-3 bg-neutral-900 rounded-xl border border-neutral-800">
                      <span className="text-[10px] text-neutral-400 block">Card Sales</span>
                      <span className="text-base font-bold font-mono text-blue-400">
                        {restaurantSettings.currencySymbol}{activeShift.cardSales}
                      </span>
                    </div>
                  </div>

                  <div className="p-3.5 bg-gradient-to-r from-emerald-950/40 to-neutral-900 rounded-xl border border-emerald-500/30 flex items-center justify-between">
                    <div>
                      <span className="text-[11px] text-neutral-400 block">Expected Physical Cash in Drawer</span>
                      <span className="text-xl font-black font-mono text-emerald-400">
                        {restaurantSettings.currencySymbol}{activeShift.expectedCash}
                      </span>
                      <span className="text-[10px] text-neutral-500 block">
                        (Float {restaurantSettings.currencySymbol}{activeShift.openingFloat} + Cash Sales {restaurantSettings.currencySymbol}{activeShift.cashSales})
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => setActiveTab('close')}
                      className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-bold rounded-xl text-xs transition shadow-md"
                    >
                      Count Drawer &amp; Close Shift
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <form onSubmit={handleStartShift} className="p-4 rounded-2xl bg-neutral-950 border border-neutral-800 space-y-3.5 text-xs">
                <div className="space-y-1">
                  <h3 className="font-bold text-white text-sm">Open New Register Shift</h3>
                  <p className="text-neutral-400">
                    No active shift running. Enter the starting physical cash amount in the till.
                  </p>
                </div>

                <div>
                  <label className="text-neutral-300 font-semibold block mb-1">
                    Opening Float Cash ({restaurantSettings.currencySymbol})
                  </label>
                  <input
                    type="number"
                    min={0}
                    required
                    value={openingFloatInput}
                    onChange={(e) => setOpeningFloatInput(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-neutral-900 border border-neutral-800 rounded-xl text-white font-mono text-sm focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="text-neutral-300 font-semibold block mb-1">
                    Shift Notes
                  </label>
                  <input
                    type="text"
                    value={openNotes}
                    onChange={(e) => setOpenNotes(e.target.value)}
                    className="w-full px-3 py-2 bg-neutral-900 border border-neutral-800 rounded-xl text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 text-neutral-950 font-bold text-xs transition"
                >
                  Start Shift with {restaurantSettings.currencySymbol}{openingFloatInput}
                </button>
              </form>
            )}
          </div>
        )}

        {/* TAB 2: Physical Currency Denomination Calculator & Z-Report */}
        {activeTab === 'close' && activeShift && (
          <div className="flex-1 overflow-y-auto space-y-4 text-xs">
            <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-center justify-between">
              <div>
                <span className="text-neutral-300 font-bold">Expected Drawer Cash:</span>
                <span className="text-base font-black font-mono text-amber-400 ml-2">
                  {restaurantSettings.currencySymbol}{expectedCash}
                </span>
              </div>
              <div>
                <span className="text-neutral-300 font-bold">Counted:</span>
                <span className="text-base font-black font-mono text-white ml-2">
                  {restaurantSettings.currencySymbol}{actualCashCounted}
                </span>
              </div>
              <div>
                <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                  discrepancy === 0 ? 'bg-emerald-500/20 text-emerald-400' :
                  discrepancy > 0 ? 'bg-blue-500/20 text-blue-400' : 'bg-red-500/20 text-red-400'
                }`}>
                  {discrepancy === 0 ? 'BALANCED' : discrepancy > 0 ? `+${restaurantSettings.currencySymbol}${discrepancy} Over` : `${restaurantSettings.currencySymbol}${discrepancy} Short`}
                </span>
              </div>
            </div>

            {/* Denomination Counter Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 bg-neutral-950 p-4 rounded-2xl border border-neutral-800">
              {[
                { label: '₹500 Notes', val: denom500, set: setDenom500, mult: 500 },
                { label: '₹200 Notes', val: denom200, set: setDenom200, mult: 200 },
                { label: '₹100 Notes', val: denom100, set: setDenom100, mult: 100 },
                { label: '₹50 Notes', val: denom50, set: setDenom50, mult: 50 },
                { label: '₹20 Notes', val: denom20, set: setDenom20, mult: 20 },
                { label: '₹10 Notes', val: denom10, set: setDenom10, mult: 10 },
              ].map((d, i) => (
                <div key={i} className="p-2 bg-neutral-900 rounded-xl border border-neutral-800 space-y-1">
                  <div className="flex justify-between text-[11px] text-neutral-400">
                    <span>{d.label}</span>
                    <span className="font-mono text-neutral-300">₹{d.val * d.mult}</span>
                  </div>
                  <input
                    type="number"
                    min={0}
                    value={d.val}
                    onChange={(e) => d.set(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-full px-2 py-1 bg-neutral-950 border border-neutral-700 rounded-lg text-white font-mono text-center text-xs"
                  />
                </div>
              ))}
            </div>

            <div>
              <label className="text-neutral-400 block mb-1">
                Coins &amp; Loose Change Total ({restaurantSettings.currencySymbol})
              </label>
              <input
                type="number"
                min={0}
                value={coins}
                onChange={(e) => setCoins(Number(e.target.value))}
                className="w-full px-3 py-1.5 bg-neutral-950 border border-neutral-800 rounded-xl text-white font-mono"
              />
            </div>

            <div>
              <label className="text-neutral-400 block mb-1">
                Day-End Closing Notes (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. Evening rush handled smoothly, cash reconciled"
                value={closeNotes}
                onChange={(e) => setCloseNotes(e.target.value)}
                className="w-full px-3 py-1.5 bg-neutral-950 border border-neutral-800 rounded-xl text-white"
              />
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setActiveTab('current')}
                className="px-4 py-2 text-neutral-400 hover:text-white"
              >
                Back
              </button>
              <button
                type="button"
                onClick={handleExecuteCloseShift}
                className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 text-neutral-950 font-bold rounded-xl shadow-lg transition"
              >
                <Printer className="w-4 h-4" />
                <span>Close Shift &amp; Print Z-Report</span>
              </button>
            </div>
          </div>
        )}

        {/* TAB 3: Shift History */}
        {activeTab === 'history' && (
          <div className="flex-1 overflow-y-auto space-y-2 text-xs">
            {shiftHistory.length === 0 ? (
              <p className="text-neutral-500 text-center py-8">
                No closed shifts in archive yet. Close your first shift to generate Z-Reports.
              </p>
            ) : (
              shiftHistory.map((sh) => (
                <div key={sh.id} className="p-3 rounded-xl bg-neutral-950 border border-neutral-800 flex items-center justify-between">
                  <div>
                    <div className="font-bold text-white">{sh.id}</div>
                    <span className="text-[11px] text-neutral-400">
                      Closed by {sh.closedBy} &bull; {sh.closedAt ? new Date(sh.closedAt).toLocaleTimeString() : ''}
                    </span>
                    <span className="text-[10px] text-neutral-500 block">
                      Sales: {restaurantSettings.currencySymbol}{sh.totalSales} &bull; Expected: {restaurantSettings.currencySymbol}{sh.expectedCash} &bull; Counted: {restaurantSettings.currencySymbol}{sh.actualCashCounted}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => printZReport(sh, restaurantSettings)}
                    className="flex items-center gap-1 px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg text-[11px] font-semibold border border-neutral-700 transition"
                  >
                    <Printer className="w-3.5 h-3.5 text-amber-400" />
                    <span>Re-print Z-Report</span>
                  </button>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};
