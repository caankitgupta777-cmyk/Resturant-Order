import React, { useState } from 'react';
import { useRestaurant } from '../../context/RestaurantContext';
import { ShieldAlert, X, AlertTriangle, KeyRound } from 'lucide-react';

interface ManagerVoidAuthModalProps {
  orderId: string | null;
  onClose: () => void;
  onVoidSuccess?: () => void;
}

export const ManagerVoidAuthModal: React.FC<ManagerVoidAuthModalProps> = ({
  orderId,
  onClose,
  onVoidSuccess,
}) => {
  const { orders, voidOrderWithManagerApproval } = useRestaurant();

  const order = orders.find(o => o.id === orderId);

  const [managerPin, setManagerPin] = useState('');
  const [reason, setReason] = useState('Customer Walked Out / Cancelled');
  const [customNotes, setCustomNotes] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!order) return null;

  const handleVoidSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const fullReason = customNotes ? `${reason} (${customNotes})` : reason;
    const res = voidOrderWithManagerApproval(order.id, managerPin, fullReason);

    if (res.success) {
      if (onVoidSuccess) onVoidSuccess();
      onClose();
    } else {
      setErrorMsg(res.error || 'Manager authorization failed');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 overflow-y-auto font-['Outfit']">
      <div className="w-full max-w-md bg-neutral-900 border border-red-500/40 rounded-3xl shadow-2xl p-6 text-neutral-100 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-500/20 border border-red-500/30 flex items-center justify-center text-red-400">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base">Manager Void Authorization</h3>
              <p className="text-xs text-neutral-400">Prevent theft &amp; record audit trail</p>
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

        {/* Warning banner */}
        <div className="p-3 bg-red-950/30 border border-red-500/30 rounded-xl text-xs text-red-300 flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            You are attempting to void <strong>Order #{order.orderNumber}</strong> (Table #{order.tableNumber}) totaling <strong>₹{order.totalAmount}</strong>. This action is permanently recorded in the financial audit log.
          </div>
        </div>

        {errorMsg && (
          <div className="p-2.5 rounded-xl bg-red-950/60 border border-red-500/40 text-xs text-red-300 font-semibold">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleVoidSubmit} className="space-y-3.5 text-xs">
          {/* Reason Select */}
          <div>
            <label className="text-neutral-300 font-semibold block mb-1">
              Select Cancellation Reason
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-white focus:outline-none focus:border-red-500/50"
            >
              <option value="Customer Walked Out / Cancelled">Customer Walked Out / Cancelled</option>
              <option value="Accidental Duplicate KOT">Accidental Duplicate KOT</option>
              <option value="Wrong Table Number Selected">Wrong Table Number Selected</option>
              <option value="Kitchen Out of Ingredients">Kitchen Out of Ingredients</option>
              <option value="Quality / Taste Complaint">Quality / Taste Complaint</option>
              <option value="Manager Complimentary Void">Manager Complimentary Void</option>
            </select>
          </div>

          <div>
            <label className="text-neutral-300 font-semibold block mb-1">
              Additional Audit Notes (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Guest had emergency and left before starter arrived"
              value={customNotes}
              onChange={(e) => setCustomNotes(e.target.value)}
              className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-white focus:outline-none focus:border-red-500/50"
            />
          </div>

          {/* Manager PIN Input */}
          <div>
            <label className="text-neutral-300 font-semibold block mb-1 flex items-center justify-between">
              <span>Enter Manager PIN</span>
              <span className="text-[10px] text-amber-400 font-mono">(Demo PIN: 9999)</span>
            </label>
            <div className="relative">
              <KeyRound className="w-4 h-4 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                maxLength={4}
                required
                placeholder="4-digit PIN"
                value={managerPin}
                onChange={(e) => setManagerPin(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-white font-mono tracking-widest text-center text-sm focus:outline-none focus:border-red-500"
              />
            </div>
          </div>

          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-neutral-400 hover:text-white"
            >
              Back
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl transition shadow-lg shadow-red-950/40 cursor-pointer"
            >
              Authorize &amp; Void Order
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
