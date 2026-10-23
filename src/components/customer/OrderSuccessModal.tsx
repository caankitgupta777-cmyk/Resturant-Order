import React from 'react';
import { ChefHat, CheckCircle2, Clock, ArrowRight } from 'lucide-react';

interface OrderSuccessModalProps {
  orderNumber: string | null;
  onClose: () => void;
  onViewKDS: () => void;
}

export const OrderSuccessModal: React.FC<OrderSuccessModalProps> = ({
  orderNumber,
  onClose,
  onViewKDS,
}) => {
  if (!orderNumber) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-neutral-900 border border-neutral-750 rounded-2xl p-6 text-neutral-100 shadow-2xl text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center mx-auto shadow-inner">
          <ChefHat className="w-9 h-9" />
        </div>

        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-bold border border-emerald-500/30 mb-2">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Direct Kitchen Dispatch
          </div>
          <h2 className="text-xl font-black text-white font-['Outfit']">
            Order #{orderNumber} Placed!
          </h2>
          <p className="text-xs text-neutral-400 mt-1 max-w-sm mx-auto leading-relaxed">
            Your dishes have been beamed directly to the Kitchen Display System. Our chefs are preparing your authentic Varhadi meal with fresh ingredients.
          </p>
        </div>

        <div className="p-3 bg-neutral-950 rounded-xl border border-neutral-800 text-xs text-neutral-300 flex items-center justify-center gap-2 font-mono">
          <Clock className="w-4 h-4 text-amber-400" />
          <span>Estimated Prep Time: ~15 - 18 minutes</span>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row gap-2">
          <button
            onClick={onViewKDS}
            className="flex-1 py-2.5 bg-neutral-800 hover:bg-neutral-750 text-neutral-200 font-bold rounded-xl text-xs transition border border-neutral-700 flex items-center justify-center gap-1.5"
          >
            <span>View on Kitchen Display</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onClose}
            className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-black rounded-xl text-xs transition shadow-md"
          >
            Stay on Menu
          </button>
        </div>
      </div>
    </div>
  );
};
