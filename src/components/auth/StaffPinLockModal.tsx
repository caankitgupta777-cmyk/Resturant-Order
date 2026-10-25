import React, { useState } from 'react';
import { useRestaurant } from '../../context/RestaurantContext';
import { StaffRole } from '../../types/restaurant';
import {
  Lock,
  Unlock,
  KeyRound,
  ShieldAlert,
  UserCheck,
  ChefHat,
  Receipt,
  UtensilsCrossed,
  Sparkles,
  Delete,
  CheckCircle2,
} from 'lucide-react';

interface StaffPinLockModalProps {
  isOpen: boolean;
  onClose?: () => void;
}

export const StaffPinLockModal: React.FC<StaffPinLockModalProps> = ({ isOpen, onClose }) => {
  const {
    currentStaff,
    staffUsers,
    loginWithPin,
    isScreenLocked,
    setIsScreenLocked,
  } = useRestaurant();

  const [enteredPin, setEnteredPin] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen && !isScreenLocked) return null;

  const handleKeyPress = (num: string) => {
    if (enteredPin.length < 4) {
      const next = enteredPin + num;
      setEnteredPin(next);
      setErrorMsg(null);
      if (next.length === 4) {
        verifyPin(next);
      }
    }
  };

  const handleBackspace = () => {
    setEnteredPin(prev => prev.slice(0, -1));
    setErrorMsg(null);
  };

  const handleClear = () => {
    setEnteredPin('');
    setErrorMsg(null);
  };

  const verifyPin = (pin: string) => {
    const res = loginWithPin(pin);
    if (res.success) {
      setEnteredPin('');
      setErrorMsg(null);
      if (onClose) onClose();
    } else {
      setErrorMsg(res.error || 'Incorrect PIN');
      setEnteredPin('');
    }
  };

  const handleQuickPin = (pin: string) => {
    setEnteredPin(pin);
    verifyPin(pin);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 overflow-y-auto font-['Outfit']">
      <div className="w-full max-w-sm bg-neutral-900 border border-neutral-750 rounded-3xl shadow-2xl p-6 text-neutral-100 flex flex-col items-center space-y-5 animate-in fade-in duration-200">
        {/* Header Icon */}
        <div className="w-14 h-14 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-lg shadow-amber-950/40">
          <KeyRound className="w-7 h-7" />
        </div>

        <div className="text-center space-y-1">
          <h2 className="text-xl font-black text-white">Staff Terminal Lock</h2>
          <p className="text-xs text-neutral-400">
            Enter your 4-digit staff PIN to unlock terminal
          </p>
        </div>

        {/* PIN Dots Indicator */}
        <div className="flex items-center justify-center gap-3 py-2">
          {[0, 1, 2, 3].map(idx => (
            <div
              key={idx}
              className={`w-3.5 h-3.5 rounded-full transition-all duration-150 ${
                enteredPin.length > idx
                  ? 'bg-amber-400 ring-4 ring-amber-500/30 scale-110'
                  : 'bg-neutral-800 border border-neutral-700'
              }`}
            />
          ))}
        </div>

        {errorMsg && (
          <div className="text-xs font-semibold text-red-400 bg-red-950/40 border border-red-500/30 px-3 py-1.5 rounded-xl">
            {errorMsg}
          </div>
        )}

        {/* Numeric Keypad */}
        <div className="grid grid-cols-3 gap-2.5 w-full max-w-[260px]">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(num => (
            <button
              key={num}
              type="button"
              onClick={() => handleKeyPress(num)}
              className="h-14 rounded-2xl bg-neutral-800/80 hover:bg-neutral-750 active:bg-amber-500 active:text-neutral-950 text-xl font-bold text-white transition border border-neutral-700/60 shadow-sm cursor-pointer flex items-center justify-center select-none"
            >
              {num}
            </button>
          ))}
          <button
            type="button"
            onClick={handleClear}
            className="h-14 rounded-2xl bg-neutral-800/40 hover:bg-neutral-800 text-xs font-bold text-neutral-400 transition cursor-pointer select-none"
          >
            Clear
          </button>
          <button
            type="button"
            onClick={() => handleKeyPress('0')}
            className="h-14 rounded-2xl bg-neutral-800/80 hover:bg-neutral-750 active:bg-amber-500 active:text-neutral-950 text-xl font-bold text-white transition border border-neutral-700/60 shadow-sm cursor-pointer flex items-center justify-center select-none"
          >
            0
          </button>
          <button
            type="button"
            onClick={handleBackspace}
            className="h-14 rounded-2xl bg-neutral-800/40 hover:bg-neutral-800 text-neutral-300 transition cursor-pointer flex items-center justify-center select-none"
          >
            <Delete className="w-5 h-5" />
          </button>
        </div>

        {/* Demo Fast Access Role Badges (Essential for rapid testing) */}
        <div className="w-full pt-3 border-t border-neutral-800 space-y-2">
          <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider block text-center">
            Demo Quick PIN Selectors
          </span>
          <div className="grid grid-cols-2 gap-1.5 text-[11px]">
            {staffUsers.map(u => (
              <button
                key={u.id}
                type="button"
                onClick={() => handleQuickPin(u.pin)}
                className="p-2 rounded-xl bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 text-left transition flex items-center justify-between cursor-pointer"
              >
                <div className="truncate">
                  <div className="font-semibold text-white truncate">{u.name.split(' ')[0]}</div>
                  <span className="text-[10px] text-amber-400 uppercase font-bold">{u.role}</span>
                </div>
                <span className="font-mono text-xs font-bold text-neutral-400 bg-neutral-800 px-1.5 py-0.5 rounded">
                  {u.pin}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
