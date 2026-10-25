import React, { useState } from 'react';
import { useRestaurant } from '../../context/RestaurantContext';
import { Building2, Plus, Check, X, Store, MapPin, Phone, FileCheck } from 'lucide-react';

interface TenantOnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TenantOnboardingModal: React.FC<TenantOnboardingModalProps> = ({ isOpen, onClose }) => {
  const { currentTenant, tenantsList, switchTenant, createTenant } = useRestaurant();
  const [isAddingNew, setIsAddingNew] = useState(false);

  // New Restaurant Onboarding Form State
  const [name, setName] = useState('');
  const [city, setCity] = useState('Amravati');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('+91 ');
  const [gstin, setGstin] = useState('');
  const [fssai, setFssai] = useState('');
  const [currencySymbol, setCurrencySymbol] = useState('₹');

  if (!isOpen) return null;

  const handleCreateNewTenant = (e: React.FormEvent) => {
    e.preventDefault();
    const slug = name.toLowerCase().replace(/[^a-z0-9]/g, '-').slice(0, 20);
    const tenantId = `rest-${slug}-${Math.floor(100 + Math.random() * 900)}`;

    createTenant({
      tenantId,
      name,
      city,
      address,
      phone,
      gstin: gstin || '27XXXXX0000X1Z1',
      fssaiNumber: fssai || '10000000000000',
      currencySymbol,
    });

    setIsAddingNew(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 overflow-y-auto font-['Outfit']">
      <div className="w-full max-w-xl bg-neutral-900 border border-neutral-750 rounded-3xl shadow-2xl p-5 sm:p-6 text-neutral-100 space-y-4 max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white">
                Multi-Tenant Restaurant Workspaces &amp; Branches
              </h2>
              <p className="text-xs text-neutral-400">
                Switch between restaurant locations or onboard a new client branch
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

        {!isAddingNew ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-neutral-300 uppercase tracking-wider">
                Available Restaurant Tenants ({tenantsList.length})
              </span>
              <button
                type="button"
                onClick={() => setIsAddingNew(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold rounded-xl text-xs transition cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Onboard New Branch</span>
              </button>
            </div>

            <div className="space-y-2.5">
              {tenantsList.map(t => {
                const isActive = t.tenantId === currentTenant.tenantId;
                return (
                  <div
                    key={t.tenantId}
                    className={`p-3.5 rounded-2xl border transition flex items-center justify-between ${
                      isActive
                        ? 'bg-amber-500/15 border-amber-500/50 shadow-md'
                        : 'bg-neutral-950 border-neutral-800 hover:border-neutral-700'
                    }`}
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-sm">{t.name}</span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-neutral-800 text-amber-400 border border-neutral-700">
                          {t.city}
                        </span>
                        {isActive && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                            Active Workspace
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-neutral-400">{t.address}</p>
                      <span className="text-[10px] text-neutral-500 font-mono block">
                        GSTIN: {t.gstin} &bull; Tenant ID: {t.tenantId}
                      </span>
                    </div>

                    {!isActive && (
                      <button
                        type="button"
                        onClick={() => {
                          switchTenant(t.tenantId);
                          onClose();
                        }}
                        className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-white rounded-xl text-xs font-semibold border border-neutral-700 transition"
                      >
                        Switch To Branch
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <form onSubmit={handleCreateNewTenant} className="space-y-3 text-xs">
            <div className="space-y-1">
              <h3 className="font-bold text-white text-sm">Onboard New Restaurant Tenant</h3>
              <p className="text-neutral-400">
                Creates an isolated workspace with separate tables, orders, and sales reports.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-neutral-300 font-semibold block mb-1">Restaurant Legal / Trade Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Saoji Family Restaurant"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="text-neutral-300 font-semibold block mb-1">City / Region</label>
                <input
                  type="text"
                  required
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-white focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <div>
              <label className="text-neutral-300 font-semibold block mb-1">Premises Address</label>
              <input
                type="text"
                required
                placeholder="e.g. Near Bus Stand, Camp Road"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-white focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-neutral-300 font-semibold block mb-1">Phone Number</label>
                <input
                  type="text"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="text-neutral-300 font-semibold block mb-1">GSTIN Number</label>
                <input
                  type="text"
                  placeholder="27AABCV..."
                  value={gstin}
                  onChange={(e) => setGstin(e.target.value)}
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-white font-mono uppercase focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="text-neutral-300 font-semibold block mb-1">FSSAI License</label>
                <input
                  type="text"
                  placeholder="1152..."
                  value={fssai}
                  onChange={(e) => setFssai(e.target.value)}
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-white font-mono focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsAddingNew(false)}
                className="px-4 py-2 text-neutral-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold rounded-xl transition"
              >
                Provision &amp; Switch to Restaurant
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
