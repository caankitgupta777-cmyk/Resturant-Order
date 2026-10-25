import React, { useState } from 'react';
import { Order, RestaurantSettings } from '../../types/restaurant';
import { useRestaurant } from '../../context/RestaurantContext';
import {
  printInvoiceElement,
  downloadThermalReceiptTxt,
  printViaRawBT,
} from '../../utils/printInvoice';
import {
  X,
  Printer,
  Download,
  Bluetooth,
  Receipt,
  CheckCircle2,
  Clock,
  User,
  Table,
  Building,
  CreditCard,
  Copy,
  Check,
  Share2,
  FileText,
  AlertTriangle,
} from 'lucide-react';

interface FullBillModalProps {
  order: Order | null;
  onClose: () => void;
}

export const FullBillModal: React.FC<FullBillModalProps> = ({ order, onClose }) => {
  const { restaurantSettings, printerConfig, recordBillReprint } = useRestaurant();
  const [printStatus, setPrintStatus] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);

  if (!order) return null;

  const invoiceNumber = order.invoiceNumber || `INV-VR-${order.orderNumber}`;
  const isPaid = order.status === 'completed' || order.paymentStatus === 'paid' || !!order.invoiceNumber;
  const isDuplicate = (order.printCount || 0) >= 1;

  const formattedDate = order.createdAt
    ? new Date(order.createdAt).toLocaleString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : new Date().toLocaleString('en-IN');

  const handlePrint = () => {
    setPrintStatus('Opening Print Window...');
    recordBillReprint(order.id);
    printInvoiceElement('full-tax-invoice-view', isDuplicate);
    setTimeout(() => setPrintStatus(null), 2500);
  };

  const handleDownloadTxt = () => {
    recordBillReprint(order.id);
    downloadThermalReceiptTxt(order, restaurantSettings, printerConfig.paperWidth, isDuplicate);
    setPrintStatus(`Downloaded ${printerConfig.paperWidth} Receipt (.txt)`);
    setTimeout(() => setPrintStatus(null), 2500);
  };

  const handleRawBT = () => {
    recordBillReprint(order.id);
    printViaRawBT(order, restaurantSettings, printerConfig.paperWidth);
    setPrintStatus('Sent to Android RawBT Service');
    setTimeout(() => setPrintStatus(null), 2500);
  };

  const handleCopyBill = () => {
    const lines = [
      `=========================================`,
      `${restaurantSettings.restaurantName.toUpperCase()}`,
      `${restaurantSettings.address}, ${restaurantSettings.city}`,
      `GSTIN: ${restaurantSettings.gstin} | FSSAI: ${restaurantSettings.fssaiNumber}`,
      `=========================================`,
      `INVOICE: ${invoiceNumber}`,
      `ORDER: #${order.orderNumber} | TABLE: #${order.tableNumber} (${order.section})`,
      `DATE: ${formattedDate}`,
      `GUEST: ${order.customerName || 'Dine-In Customer'}`,
      `-----------------------------------------`,
      ...order.items.map(
        i => `${i.name} x${i.quantity} @ ${restaurantSettings.currencySymbol}${i.price} = ${restaurantSettings.currencySymbol}${i.price * i.quantity}`
      ),
      `-----------------------------------------`,
      `SUBTOTAL: ${restaurantSettings.currencySymbol}${order.subtotal}`,
      `CGST (${restaurantSettings.cgstRate}%): ${restaurantSettings.currencySymbol}${order.cgst.toFixed(2)}`,
      `SGST (${restaurantSettings.sgstRate}%): ${restaurantSettings.currencySymbol}${order.sgst.toFixed(2)}`,
      order.serviceCharge ? `SERVICE CHARGE: ${restaurantSettings.currencySymbol}${order.serviceCharge.toFixed(2)}` : '',
      `GRAND TOTAL: ${restaurantSettings.currencySymbol}${order.totalAmount}`,
      `STATUS: ${isPaid ? 'PAID & SETTLED' : 'PENDING PAYMENT'}`,
      `=========================================`,
    ].filter(Boolean).join('\n');

    navigator.clipboard.writeText(lines).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => {});
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-3 sm:p-5 overflow-y-auto">
      <div className="w-full max-w-2xl bg-neutral-900 border border-neutral-750 rounded-2xl shadow-2xl overflow-hidden my-auto text-neutral-100 flex flex-col max-h-[92vh]">
        {/* Header Bar */}
        <div className="p-4 sm:p-5 bg-neutral-950 border-b border-neutral-800 flex items-center justify-between no-print">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center text-neutral-950 shadow-lg shadow-amber-950/40">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-white font-['Outfit']">
                  Tax Invoice &amp; Full Bill
                </h2>
                <span className="text-xs font-mono font-bold text-amber-400 bg-neutral-800 px-2 py-0.5 rounded border border-neutral-700">
                  {invoiceNumber}
                </span>
                {isPaid ? (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 uppercase">
                    Paid
                  </span>
                ) : (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30 uppercase">
                    Unpaid
                  </span>
                )}
              </div>
              <p className="text-xs text-neutral-400">
                Table #{order.tableNumber} &bull; Order #{order.orderNumber} &bull; {formattedDate}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition cursor-pointer"
            title="Close bill"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 flex-1">
          {/* Printable / Displayable Invoice */}
          <div
            id="full-tax-invoice-view"
            className="print-target bg-white text-neutral-900 rounded-xl p-5 sm:p-7 shadow-xl font-sans text-xs space-y-4 border border-neutral-300 mx-auto max-w-lg"
          >
            {/* Duplicate Notice */}
            {isDuplicate && (
              <div className="text-center bg-red-50 text-red-700 border border-red-300 py-1 px-2 rounded font-mono font-bold text-[10px] tracking-wider uppercase">
                *** DUPLICATE COPY (Reprint #{order.printCount || 1}) ***
              </div>
            )}

            {/* Restaurant Details Header */}
            <div className="text-center border-b pb-3 border-neutral-300">
              <h1 className="text-lg font-black tracking-tight uppercase text-neutral-950 font-serif">
                {restaurantSettings.restaurantName}
              </h1>
              <p className="text-[11px] font-medium text-neutral-700 mt-0.5">
                Authentic Vidarbhian &amp; Saoji Specialties
              </p>
              <p className="text-[10px] text-neutral-600 mt-1">
                {restaurantSettings.address}, {restaurantSettings.city}, {restaurantSettings.state}
              </p>
              <p className="text-[10px] text-neutral-600">
                Phone: {restaurantSettings.phone} &bull; Email: {restaurantSettings.email}
              </p>
              <div className="text-[9px] text-neutral-600 flex justify-center gap-3 mt-1.5 font-mono">
                <span><strong>GSTIN:</strong> {restaurantSettings.gstin}</span>
                <span>&bull;</span>
                <span><strong>FSSAI:</strong> {restaurantSettings.fssaiNumber}</span>
              </div>
              <div className="mt-2 text-[11px] font-black bg-neutral-100 py-1 rounded text-neutral-900 border border-neutral-300 tracking-wider">
                TAX INVOICE / CASH MEMO
              </div>
            </div>

            {/* Bill & Guest Metadata */}
            <div className="grid grid-cols-2 text-[10px] text-neutral-700 gap-2 border-b pb-3 border-neutral-200">
              <div className="space-y-0.5">
                <div><strong>Invoice No:</strong> <span className="font-mono text-neutral-950">{invoiceNumber}</span></div>
                <div><strong>Order No:</strong> <span className="font-mono text-neutral-950">#{order.orderNumber}</span></div>
                <div><strong>Table:</strong> Table #{order.tableNumber} ({order.section})</div>
                <div><strong>Date &amp; Time:</strong> {formattedDate}</div>
              </div>
              <div className="text-right space-y-0.5">
                <div><strong>Customer:</strong> {order.customerName || 'Dine-In Guest'}</div>
                {order.customerEmail && (
                  <div className="truncate max-w-[200px] ml-auto"><strong>Email:</strong> {order.customerEmail}</div>
                )}
                <div>
                  <strong>Payment Status:</strong>{' '}
                  <span className={`font-bold ${isPaid ? 'text-emerald-700' : 'text-amber-700'}`}>
                    {isPaid ? 'SETTLED / PAID' : 'PENDING'}
                  </span>
                </div>
                {order.splitPayment?.shares?.[0]?.paymentMethod && (
                  <div>
                    <strong>Method:</strong> {order.splitPayment.shares[0].paymentMethod.toUpperCase()}
                  </div>
                )}
              </div>
            </div>

            {/* All Itemized Items Table */}
            <div className="space-y-1">
              <div className="grid grid-cols-12 font-bold border-b border-neutral-300 pb-1.5 text-[10px] text-neutral-900">
                <span className="col-span-6">Dish Description</span>
                <span className="col-span-2 text-center">Qty</span>
                <span className="col-span-2 text-right">Rate</span>
                <span className="col-span-2 text-right">Amount</span>
              </div>

              <div className="divide-y divide-neutral-150 text-[10px]">
                {order.items.map((it, idx) => (
                  <div key={idx} className="grid grid-cols-12 py-2 items-start">
                    <div className="col-span-6 pr-2">
                      <div className="font-bold text-neutral-900">{it.name}</div>
                      {it.localName && (
                        <span className="text-[9px] text-neutral-600 block">{it.localName}</span>
                      )}
                      {it.specialInstructions && (
                        <span className="text-[8px] text-amber-800 bg-amber-50 px-1 py-0.5 rounded inline-block mt-0.5 border border-amber-200">
                          Note: {it.specialInstructions}
                        </span>
                      )}
                    </div>
                    <span className="col-span-2 text-center font-mono font-bold text-neutral-800">
                      {it.quantity}
                    </span>
                    <span className="col-span-2 text-right font-mono text-neutral-700">
                      {restaurantSettings.currencySymbol}{it.price}
                    </span>
                    <span className="col-span-2 text-right font-mono font-bold text-neutral-950">
                      {restaurantSettings.currencySymbol}{it.price * it.quantity}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Tax & Financial Breakdown */}
            <div className="border-t border-neutral-300 pt-2 space-y-1 text-[10px]">
              <div className="flex justify-between text-neutral-600">
                <span>Total Items ({order.items.reduce((s, i) => s + i.quantity, 0)} items):</span>
                <span className="font-mono">{restaurantSettings.currencySymbol}{order.subtotal}</span>
              </div>

              <div className="flex justify-between text-neutral-600">
                <span>CGST ({restaurantSettings.cgstRate}%):</span>
                <span className="font-mono">{restaurantSettings.currencySymbol}{order.cgst.toFixed(2)}</span>
              </div>

              <div className="flex justify-between text-neutral-600">
                <span>SGST ({restaurantSettings.sgstRate}%):</span>
                <span className="font-mono">{restaurantSettings.currencySymbol}{order.sgst.toFixed(2)}</span>
              </div>

              {order.serviceCharge !== undefined && order.serviceCharge > 0 && (
                <div className="flex justify-between text-neutral-600">
                  <span>Service Charge ({restaurantSettings.serviceChargeRate}%):</span>
                  <span className="font-mono">{restaurantSettings.currencySymbol}{order.serviceCharge.toFixed(2)}</span>
                </div>
              )}

              <div className="flex justify-between text-xs font-black text-neutral-950 pt-2 border-t-2 border-neutral-800">
                <span className="text-sm">GRAND TOTAL:</span>
                <span className="font-mono text-base font-extrabold text-neutral-950">
                  {restaurantSettings.currencySymbol}{order.totalAmount}
                </span>
              </div>
            </div>

            {/* Payment Settlement Details */}
            <div className="bg-neutral-50 p-2.5 rounded-lg border border-neutral-200 flex items-center justify-between text-[10px] text-neutral-700">
              <span className="font-medium">
                Payment Mode: <strong className="uppercase text-neutral-900">{order.paymentMethod || order.splitPayment?.shares?.[0]?.paymentMethod || 'UPI'}</strong>
              </span>
              <span className="text-emerald-700 font-bold bg-emerald-100 px-2 py-0.5 rounded border border-emerald-300">
                {isPaid ? 'PAID IN FULL' : 'PENDING'}
              </span>
            </div>

            {/* Footer Thank You */}
            <div className="text-center text-[9px] text-neutral-500 border-t pt-3 space-y-0.5">
              <p className="font-semibold text-neutral-800">Thank you for dining at {restaurantSettings.restaurantName}!</p>
              <p>For feedback or home delivery, call {restaurantSettings.phone}</p>
              <p className="text-[8px] text-neutral-400">Software: Smart Restaurant POS v3.2</p>
            </div>
          </div>
        </div>

        {/* Modal Footer Controls */}
        <div className="p-4 sm:p-5 bg-neutral-950 border-t border-neutral-800 flex flex-col sm:flex-row items-center justify-between gap-3 no-print">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={handlePrint}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-2.5 bg-neutral-800 hover:bg-neutral-700 active:scale-95 text-white rounded-xl text-xs font-semibold transition border border-neutral-700 shadow-md cursor-pointer"
            >
              <Printer className="w-4 h-4 text-amber-400" />
              <span>Print Tax Invoice</span>
            </button>

            <button
              type="button"
              onClick={handleRawBT}
              className="flex items-center justify-center gap-1.5 px-3 py-2.5 bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-white rounded-xl text-xs font-medium transition border border-neutral-800 cursor-pointer"
              title="Silent Bluetooth print via Android RawBT Print Service app"
            >
              <Bluetooth className="w-3.5 h-3.5 text-blue-400" />
              <span className="hidden sm:inline">RawBT</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadTxt}
              className="flex items-center justify-center gap-1.5 px-3 py-2.5 bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-white rounded-xl text-xs font-medium transition border border-neutral-800 cursor-pointer"
              title="Download ESC/POS thermal text receipt file"
            >
              <Download className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline">Receipt .txt</span>
            </button>

            <button
              type="button"
              onClick={handleCopyBill}
              className="flex items-center justify-center gap-1.5 px-3 py-2.5 bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-white rounded-xl text-xs font-medium transition border border-neutral-800 cursor-pointer"
              title="Copy bill text to clipboard"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-amber-400" />}
              <span className="hidden sm:inline">{copied ? 'Copied' : 'Copy'}</span>
            </button>
          </div>

          {printStatus && (
            <span className="text-[11px] text-amber-400 font-medium px-2.5 py-1 bg-amber-500/10 rounded-lg border border-amber-500/30 animate-pulse">
              {printStatus}
            </span>
          )}

          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-2.5 bg-amber-500 hover:bg-amber-400 active:scale-95 text-neutral-950 font-bold rounded-xl text-xs transition cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
