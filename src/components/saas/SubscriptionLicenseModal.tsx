import React, { useState } from 'react';
import { useRestaurant } from '../../context/RestaurantContext';
import {
  CreditCard,
  ShieldCheck,
  CheckCircle2,
  X,
  Sparkles,
  KeyRound,
  Zap,
  Building,
  Check,
} from 'lucide-react';

interface SubscriptionLicenseModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SubscriptionLicenseModal: React.FC<SubscriptionLicenseModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { subscription, activateLicenseKey, restaurantSettings } = useRestaurant();
  const [licenseInput, setLicenseInput] = useState('');
  const [statusMsg, setStatusMsg] = useState<{ success: boolean; message: string } | null>(null);

  if (!isOpen) return null;

  const handleApplyKey = (e: React.FormEvent) => {
    e.preventDefault();
    const res = activateLicenseKey(licenseInput);
    setStatusMsg(res);
    if (res.success) {
      setLicenseInput('');
    }
  };

  const pricingTiers = [
    {
      name: 'Starter POS',
      price: '₹899',
      period: '/ month',
      desc: 'Ideal for small cafes, juice bars & quick service food stalls',
      features: ['Up to 3 Waiter Phones', '1 Kitchen Display Screen', 'Offline Queue Sync', 'Thermal Receipt Printing'],
      popular: false,
    },
    {
      name: 'Pro Cloud Multi-Device',
      price: '₹1,499',
      period: '/ month',
      desc: 'Most popular for full-service family dining restaurants & restro-bars',
      features: ['Unlimited Waiter Phones', 'Multi-Station KDS Screens', 'Shared Cloud Firestore Sync', 'Day-End Z-Report Reconciliation', 'Role PIN Protection & Audit Logs'],
      popular: true,
    },
    {
      name: 'Enterprise Chain',
      price: '₹3,999',
      period: '/ month',
      desc: 'For multi-outlet brands & restaurant chains with centralized admin',
      features: ['Unlimited Outlets & Branches', 'Multi-Tenant Partitioning', 'Centralized Menu Management', 'Dedicated Account Manager'],
      popular: false,
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 overflow-y-auto font-['Outfit']">
      <div className="w-full max-w-2xl bg-neutral-900 border border-neutral-750 rounded-3xl shadow-2xl p-5 sm:p-6 text-neutral-100 space-y-4 max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center text-neutral-950 font-bold shadow-lg shadow-amber-950/40">
              <Zap className="w-5 h-5 fill-neutral-950" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white">
                Commercial SaaS Licensing &amp; Subscription Packages
              </h2>
              <p className="text-xs text-neutral-400">
                Manage commercial client licenses, renewal dates, and commercial resale plans
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

        <div className="space-y-4 text-xs flex-1 overflow-y-auto">
          {/* Current Active Plan Badge */}
          <div className="p-4 rounded-2xl bg-neutral-950 border border-neutral-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="text-[10px] text-neutral-400 uppercase font-bold tracking-wider">
                Active Client License
              </span>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-base font-extrabold text-white font-['Outfit']">
                  {subscription.plan}
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 uppercase">
                  {subscription.status}
                </span>
              </div>
              <p className="text-[11px] text-neutral-400 mt-1">
                Registered to: <strong className="text-neutral-200">{subscription.registeredTo}</strong> &bull; Valid Until: <strong className="text-amber-400 font-mono">{subscription.validUntil}</strong>
              </p>
              <span className="text-[10px] text-neutral-500 font-mono block mt-0.5">
                License Key: {subscription.licenseKey}
              </span>
            </div>

            <div className="text-right sm:text-right">
              <span className="text-[10px] text-neutral-400 block">Max Staff Seats</span>
              <span className="text-xl font-mono font-bold text-white">{subscription.maxStaffSeats} Terminals</span>
            </div>
          </div>

          {/* License Key Activation Box */}
          <form onSubmit={handleApplyKey} className="p-4 rounded-2xl bg-neutral-950 border border-neutral-800 space-y-2.5">
            <label className="text-xs font-bold text-neutral-200 block flex items-center gap-1.5">
              <KeyRound className="w-3.5 h-3.5 text-amber-400" />
              <span>Activate Commercial License Key (Reseller / Client)</span>
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="e.g. VR-PRO-2026-CLIENT-CODE"
                value={licenseInput}
                onChange={(e) => setLicenseInput(e.target.value)}
                className="flex-1 px-3 py-2 bg-neutral-900 border border-neutral-800 rounded-xl text-white font-mono uppercase text-xs focus:outline-none focus:border-amber-500"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold rounded-xl text-xs transition cursor-pointer"
              >
                Verify &amp; Activate
              </button>
            </div>

            {statusMsg && (
              <p className={`text-[11px] font-semibold ${statusMsg.success ? 'text-emerald-400' : 'text-red-400'}`}>
                {statusMsg.message}
              </p>
            )}
          </form>

          {/* Commercial SaaS Packages for Selling to Restaurants */}
          <div className="space-y-2">
            <span className="text-xs font-bold text-neutral-300 uppercase tracking-wider block">
              Commercial Packaging Guide (For Selling To Restaurants)
            </span>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {pricingTiers.map((tier, idx) => (
                <div
                  key={idx}
                  className={`p-4 rounded-2xl border flex flex-col justify-between space-y-3 ${
                    tier.popular
                      ? 'bg-amber-500/10 border-amber-500/50 shadow-lg shadow-amber-950/20'
                      : 'bg-neutral-950 border-neutral-800'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-white text-sm">{tier.name}</h4>
                      {tier.popular && (
                        <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-amber-500 text-neutral-950">
                          Recommended
                        </span>
                      )}
                    </div>
                    <div className="flex items-baseline gap-1 pt-1">
                      <span className="text-xl font-black text-white font-mono">{tier.price}</span>
                      <span className="text-[10px] text-neutral-400">{tier.period}</span>
                    </div>
                    <p className="text-[11px] text-neutral-400 leading-snug">{tier.desc}</p>
                  </div>

                  <ul className="space-y-1.5 border-t border-neutral-800/80 pt-2 text-[10px] text-neutral-300">
                    {tier.features.map((feat, fIdx) => (
                      <li key={fIdx} className="flex items-center gap-1.5">
                        <Check className="w-3 h-3 text-emerald-400 shrink-0" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="pt-2 flex justify-end border-t border-neutral-800">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-neutral-800 hover:bg-neutral-750 text-white rounded-xl text-xs font-semibold"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
