import React, { useState } from 'react';
import { useRestaurant } from '../../context/RestaurantContext';
import { Printer, Smartphone, Bluetooth, CheckCircle2, X, Sliders, ExternalLink } from 'lucide-react';
import { printViaRawBT, printInvoiceElement } from '../../utils/printInvoice';

interface ThermalPrinterModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ThermalPrinterModal: React.FC<ThermalPrinterModalProps> = ({ isOpen, onClose }) => {
  const { printerConfig, updatePrinterConfig, orders, restaurantSettings } = useRestaurant();
  const [testStatus, setTestStatus] = useState<string | null>(null);

  if (!isOpen) return null;

  const sampleOrder = orders[0];

  const handleTestRawBT = () => {
    if (!sampleOrder) return;
    setTestStatus('Sending print test to Android RawBT print service...');
    printViaRawBT(sampleOrder, restaurantSettings, printerConfig.paperWidth);
    setTimeout(() => setTestStatus(null), 3000);
  };

  const handleTestBrowserPrint = () => {
    setTestStatus('Triggering thermal print dialog...');
    printInvoiceElement('restaurant-tax-invoice');
    setTimeout(() => setTestStatus(null), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 overflow-y-auto font-['Outfit']">
      <div className="w-full max-w-xl bg-neutral-900 border border-neutral-750 rounded-3xl shadow-2xl p-5 sm:p-6 text-neutral-100 space-y-4 max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white">
                Hardware &amp; Thermal Printer Configuration
              </h2>
              <p className="text-xs text-neutral-400">
                Setup 58mm/80mm receipt printers, RawBT Android bridge, and Bluetooth printing
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

        <div className="space-y-4 text-xs">
          {/* Paper Width Selection */}
          <div className="p-4 bg-neutral-950 rounded-2xl border border-neutral-800 space-y-3">
            <label className="text-xs font-bold text-neutral-200 block">
              Receipt Paper Width
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => updatePrinterConfig({ ...printerConfig, paperWidth: '80mm' })}
                className={`p-3.5 rounded-xl border text-left transition flex flex-col justify-between ${
                  printerConfig.paperWidth === '80mm'
                    ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                    : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-white'
                }`}
              >
                <div className="font-bold text-white text-sm">80mm (Standard POS)</div>
                <p className="text-[11px] text-neutral-400 mt-1">
                  48 columns &bull; Countertop USB/Ethernet thermal printers (Epson, TVS, NGX)
                </p>
              </button>

              <button
                type="button"
                onClick={() => updatePrinterConfig({ ...printerConfig, paperWidth: '58mm' })}
                className={`p-3.5 rounded-xl border text-left transition flex flex-col justify-between ${
                  printerConfig.paperWidth === '58mm'
                    ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                    : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-white'
                }`}
              >
                <div className="font-bold text-white text-sm">58mm (Portable Bluetooth)</div>
                <p className="text-[11px] text-neutral-400 mt-1">
                  32 columns &bull; Handheld mobile Bluetooth thermal printers (Sunmi, iMin, Everycom)
                </p>
              </button>
            </div>
          </div>

          {/* Android RawBT Integration */}
          <div className="p-4 bg-neutral-950 rounded-2xl border border-neutral-800 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-emerald-400" />
                <span className="font-bold text-white">Android Silent Bluetooth Print (RawBT)</span>
              </div>
              <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">
                Recommended for Phones
              </span>
            </div>
            <p className="text-[11px] text-neutral-400 leading-relaxed">
              When taking orders on Android phones or Sunmi handhelds, you can bypass the browser print dialog and send raw ESC/POS bytes directly to your Bluetooth thermal printer using the free <strong>RawBT Print Service</strong> app.
            </p>

            <div className="pt-2 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={handleTestRawBT}
                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs transition cursor-pointer flex items-center gap-1.5"
              >
                <Bluetooth className="w-3.5 h-3.5" />
                <span>Test RawBT Bluetooth Print</span>
              </button>

              <button
                type="button"
                onClick={handleTestBrowserPrint}
                className="px-3.5 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 font-semibold rounded-xl text-xs transition border border-neutral-700"
              >
                Test Standard Print
              </button>
            </div>

            {testStatus && (
              <p className="text-amber-400 font-semibold text-[11px] animate-pulse">
                {testStatus}
              </p>
            )}
          </div>

          {/* Hardware toggles */}
          <div className="p-4 bg-neutral-950 rounded-2xl border border-neutral-800 space-y-2">
            <span className="font-bold text-neutral-300 block mb-2">POS Hardware Signals</span>
            <div className="flex items-center justify-between py-1 border-b border-neutral-900">
              <span className="text-neutral-300">Auto-Cut Paper After Receipt</span>
              <input
                type="checkbox"
                checked={printerConfig.autoCut}
                onChange={(e) => updatePrinterConfig({ ...printerConfig, autoCut: e.target.checked })}
                className="rounded border-neutral-700 text-amber-500"
              />
            </div>
            <div className="flex items-center justify-between py-1">
              <span className="text-neutral-300">Kick / Open Cash Drawer on Cash Payment</span>
              <input
                type="checkbox"
                checked={printerConfig.openCashDrawer}
                onChange={(e) => updatePrinterConfig({ ...printerConfig, openCashDrawer: e.target.checked })}
                className="rounded border-neutral-700 text-amber-500"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-2 border-t border-neutral-800">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold rounded-xl text-xs transition"
          >
            Save Printer Settings
          </button>
        </div>
      </div>
    </div>
  );
};
