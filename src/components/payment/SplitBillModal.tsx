import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { useRestaurant } from '../../context/RestaurantContext';
import { soundEffects } from '../../utils/audio';
import { printInvoiceElement, downloadThermalReceiptTxt, printViaRawBT } from '../../utils/printInvoice';
import {
  X,
  CreditCard,
  QrCode,
  CheckCircle2,
  Printer,
  Receipt,
  Building,
  ShieldAlert,
  Download,
  Bluetooth,
  Banknote,
  UtensilsCrossed,
  ArrowRight,
} from 'lucide-react';

interface BillPaymentModalProps {
  orderId: string | null;
  onClose: () => void;
}

export const BillPaymentModal: React.FC<BillPaymentModalProps> = ({ orderId, onClose }) => {
  const { orders, processPayment, restaurantSettings, recordBillReprint, printerConfig } = useRestaurant();

  const order = orders.find(o => o.id === orderId);

  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'upi' | 'card' | 'cash' | 'netbanking'>('upi');
  const [customerEmail, setCustomerEmail] = useState<string>(order?.customerEmail || 'guest@example.com');
  const [printStatus, setPrintStatus] = useState<string | null>(null);

  const [isCompleted, setIsCompleted] = useState<boolean>(() => {
    return order?.status === 'completed' || order?.paymentStatus === 'paid' || !!order?.invoiceNumber;
  });
  const [generatedInvoiceNum, setGeneratedInvoiceNum] = useState<string>(() => {
    return order?.invoiceNumber || (order?.status === 'completed' ? `INV-VR-${order.orderNumber}` : '');
  });

  React.useEffect(() => {
    if (order) {
      const isPaid = order.status === 'completed' || order.paymentStatus === 'paid' || !!order.invoiceNumber;
      setIsCompleted(isPaid);
      setGeneratedInvoiceNum(order.invoiceNumber || (isPaid ? `INV-VR-${order.orderNumber}` : ''));
      if (order.paymentMethod) {
        setSelectedPaymentMethod(order.paymentMethod);
      } else if (order.splitPayment?.shares?.[0]?.paymentMethod) {
        setSelectedPaymentMethod(order.splitPayment.shares[0].paymentMethod as any);
      }
      if (order.customerEmail) {
        setCustomerEmail(order.customerEmail);
      }
    }
  }, [order?.id, order?.status, order?.paymentStatus, order?.invoiceNumber, order?.paymentMethod]);

  if (!order) return null;

  // Single direct bill settlement for the full order amount
  const handleSettleBill = async () => {
    try {
      confetti({
        particleCount: 55,
        spread: 60,
        origin: { y: 0.6 },
      });
    } catch {}

    const res = await processPayment(order.id, selectedPaymentMethod, customerEmail);
    if (res.success) {
      setGeneratedInvoiceNum(res.invoiceNumber);
      setIsCompleted(true);
    }
  };

  // Direct print invoice handler with iframe isolation & duplicate tracking
  const handlePrint = () => {
    setPrintStatus('Opening Print Dialog...');
    const isDuplicate = (order.printCount || 0) >= 1;
    recordBillReprint(order.id);
    printInvoiceElement('restaurant-tax-invoice', isDuplicate);
    setTimeout(() => {
      setPrintStatus(null);
    }, 2500);
  };

  const handleDownloadTxt = () => {
    const isDuplicate = (order.printCount || 0) >= 1;
    recordBillReprint(order.id);
    downloadThermalReceiptTxt(order, restaurantSettings, printerConfig.paperWidth, isDuplicate);
    setPrintStatus(`Downloaded ${printerConfig.paperWidth} Receipt (.txt)`);
    setTimeout(() => {
      setPrintStatus(null);
    }, 2500);
  };

  const handleRawBTPrint = () => {
    recordBillReprint(order.id);
    printViaRawBT(order, restaurantSettings, printerConfig.paperWidth);
    setPrintStatus('Sent to Android RawBT Service');
    setTimeout(() => setPrintStatus(null), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-3 sm:p-5 overflow-y-auto font-['Outfit']">
      <div className="w-full max-w-2xl bg-neutral-900 border border-neutral-750 rounded-2xl shadow-2xl overflow-hidden my-auto text-neutral-100 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-neutral-950 border-b border-neutral-800 flex items-center justify-between no-print">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-950/40 text-neutral-950">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-white font-['Outfit']">
                  Bill Settlement &amp; Invoice
                </h2>
                <span className="text-xs font-mono font-bold text-amber-400 bg-neutral-800 px-2 py-0.5 rounded border border-neutral-700">
                  #{order.orderNumber}
                </span>
              </div>
              <p className="text-xs text-neutral-400">
                Table #{order.tableNumber} ({order.section}) &bull; Payable: <strong className="text-emerald-400 font-mono text-sm">{restaurantSettings.currencySymbol}{order.totalAmount}</strong>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 flex-1">
          {/* STEP 1: Direct Payment Settlement */}
          {!isCompleted ? (
            <>
              {/* Simulated Gateway Info Banner */}
              <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-300 text-xs flex items-start gap-2.5">
                <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div className="leading-relaxed">
                  <strong>DIRECT BILL SETTLEMENT:</strong> Customer pays the full amount ({restaurantSettings.currencySymbol}{order.totalAmount}) in a single transaction. Select the payment method below to finalize the bill and print the GST Tax Invoice.
                </div>
              </div>

              {/* Order Items & Total Summary Card */}
              <div className="bg-neutral-950 rounded-xl border border-neutral-800 p-4 space-y-3">
                <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
                  <div className="flex items-center gap-2">
                    <UtensilsCrossed className="w-4 h-4 text-amber-400" />
                    <span className="text-xs font-bold text-white">Order Details</span>
                  </div>
                  <span className="text-xs text-neutral-400">
                    {order.items.reduce((s, i) => s + i.quantity, 0)} items &bull; Guest: <strong>{order.customerName || 'Dine-In Customer'}</strong>
                  </span>
                </div>

                {/* Items preview */}
                <div className="space-y-1 max-h-36 overflow-y-auto pr-1">
                  {order.items.map((it, idx) => (
                    <div key={idx} className="flex justify-between items-center text-xs py-1 border-b border-neutral-800/40 last:border-none">
                      <span className="text-neutral-300">
                        {it.name} <strong className="text-amber-400 font-mono">x{it.quantity}</strong>
                      </span>
                      <span className="font-mono text-neutral-200">
                        {restaurantSettings.currencySymbol}{it.price * it.quantity}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Subtotals & Taxes breakdown */}
                <div className="border-t border-neutral-800 pt-2.5 space-y-1 text-xs">
                  <div className="flex justify-between text-neutral-400">
                    <span>Subtotal:</span>
                    <span className="font-mono">{restaurantSettings.currencySymbol}{order.subtotal}</span>
                  </div>
                  <div className="flex justify-between text-neutral-400">
                    <span>CGST ({restaurantSettings.cgstRate}%):</span>
                    <span className="font-mono">{restaurantSettings.currencySymbol}{order.cgst.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-neutral-400">
                    <span>SGST ({restaurantSettings.sgstRate}%):</span>
                    <span className="font-mono">{restaurantSettings.currencySymbol}{order.sgst.toFixed(2)}</span>
                  </div>
                  {order.serviceCharge !== undefined && order.serviceCharge > 0 && (
                    <div className="flex justify-between text-neutral-400">
                      <span>Service Charge ({restaurantSettings.serviceChargeRate}%):</span>
                      <span className="font-mono">{restaurantSettings.currencySymbol}{order.serviceCharge.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm font-extrabold text-white pt-2 border-t border-neutral-700">
                    <span>Grand Total Payable:</span>
                    <span className="font-mono text-base text-emerald-400 font-black">
                      {restaurantSettings.currencySymbol}{order.totalAmount}
                    </span>
                  </div>
                </div>
              </div>

              {/* Payment Method Selector */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-neutral-300 uppercase tracking-wider block">
                  Select Payment Method
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: 'upi', label: 'UPI QR Code', icon: QrCode, badge: 'Instant' },
                    { id: 'cash', label: 'Cash Counter', icon: Banknote, badge: 'Counter' },
                    { id: 'card', label: 'Card (EDC POS)', icon: CreditCard, badge: 'Terminal' },
                    { id: 'netbanking', label: 'Net Banking', icon: Building, badge: 'Direct' },
                  ].map(method => {
                    const Icon = method.icon;
                    const isSel = selectedPaymentMethod === method.id;
                    return (
                      <button
                        key={method.id}
                        type="button"
                        onClick={() => setSelectedPaymentMethod(method.id as any)}
                        className={`p-3 rounded-xl border text-xs font-semibold flex flex-col items-center gap-1.5 transition cursor-pointer ${
                          isSel
                            ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400 shadow-md shadow-emerald-950/30'
                            : 'bg-neutral-800/60 border-neutral-700/60 text-neutral-400 hover:text-white hover:bg-neutral-800'
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                        <span className="font-bold">{method.label}</span>
                        <span className="text-[10px] text-neutral-500">{method.badge}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Dynamic Payment Method Display */}
              {selectedPaymentMethod === 'upi' ? (
                <div className="p-4 bg-neutral-950 rounded-xl border border-neutral-800 flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
                  <div className="w-24 h-24 bg-white p-2 rounded-xl flex items-center justify-center shrink-0 shadow-md">
                    <div className="w-full h-full border border-neutral-900 flex flex-col items-center justify-center text-[9px] text-neutral-900 font-mono">
                      <QrCode className="w-14 h-14 text-neutral-950" />
                      <span className="font-bold">BHIM UPI</span>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <span className="text-xs font-bold text-neutral-200">
                      Scan UPI QR Code to Pay {restaurantSettings.currencySymbol}{order.totalAmount}
                    </span>
                    <p className="text-[11px] text-neutral-400 leading-relaxed">
                      UPI ID: <span className="font-mono text-amber-400 font-semibold">{restaurantSettings.restaurantName.toLowerCase().replace(/\s+/g, '')}@icici</span>
                    </p>
                    <p className="text-[10px] text-neutral-400">
                      Supports PhonePe, Google Pay, Paytm, BHIM, CRED, and mobile banking apps.
                    </p>
                  </div>
                </div>
              ) : selectedPaymentMethod === 'cash' ? (
                <div className="p-4 bg-neutral-950 rounded-xl border border-neutral-800 space-y-1.5 text-xs">
                  <div className="flex items-center gap-2">
                    <Banknote className="w-4 h-4 text-emerald-400" />
                    <span className="font-bold text-neutral-200">Cash Counter Settlement</span>
                  </div>
                  <p className="text-[11px] text-neutral-400 leading-relaxed">
                    Verify cash of <strong className="text-white">{restaurantSettings.currencySymbol}{order.totalAmount}</strong> collected in the cash register drawer before clicking Settle Bill.
                  </p>
                </div>
              ) : selectedPaymentMethod === 'card' ? (
                <div className="p-4 bg-neutral-950 rounded-xl border border-neutral-800 space-y-1.5 text-xs">
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-blue-400" />
                    <span className="font-bold text-neutral-200">Card EDC Terminal Settlement</span>
                  </div>
                  <p className="text-[11px] text-neutral-400 leading-relaxed">
                    Swipe, insert, or tap customer card on PineLabs / Innoviti EDC machine for <strong className="text-white">{restaurantSettings.currencySymbol}{order.totalAmount}</strong>.
                  </p>
                </div>
              ) : (
                <div className="p-4 bg-neutral-950 rounded-xl border border-neutral-800 space-y-1.5 text-xs">
                  <div className="flex items-center gap-2">
                    <Building className="w-4 h-4 text-amber-400" />
                    <span className="font-bold text-neutral-200">Net Banking / Digital Settlement</span>
                  </div>
                  <p className="text-[11px] text-neutral-400 leading-relaxed">
                    Verify IMPS/NEFT transfer of <strong className="text-white">{restaurantSettings.currencySymbol}{order.totalAmount}</strong> in restaurant current account.
                  </p>
                </div>
              )}
            </>
          ) : (
            /* STEP 2: Payment Complete & GST Invoice Preview */
            <div className="space-y-4 animate-in fade-in duration-300">
              {/* Success Banner */}
              <div className="p-3.5 rounded-2xl bg-emerald-950/40 border border-emerald-500/40 flex items-center gap-3 no-print">
                <div className="w-9 h-9 rounded-full bg-emerald-500 text-neutral-950 flex items-center justify-center font-bold shrink-0">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-emerald-400">
                    Payment Recorded &amp; Table Settled
                  </h3>
                  <p className="text-xs text-neutral-300 mt-0.5">
                    Order #{order.orderNumber} successfully settled via {selectedPaymentMethod.toUpperCase()}. Ready for thermal receipt printing.
                  </p>
                </div>
              </div>

              {/* Official Tax Invoice - Formatted strictly for print */}
              <div
                id="restaurant-tax-invoice"
                className="print-target bg-white text-neutral-900 rounded-xl p-6 shadow-2xl font-sans text-xs space-y-4 border border-neutral-300 mx-auto max-w-lg"
              >
                {/* Header */}
                <div className="text-center border-b pb-3 border-neutral-300">
                  <h2 className="text-base font-extrabold tracking-tight uppercase text-neutral-950">
                    {restaurantSettings.restaurantName}
                  </h2>
                  <p className="text-[10px] text-neutral-600">
                    {restaurantSettings.address}, {restaurantSettings.city}, {restaurantSettings.state}
                  </p>
                  <p className="text-[10px] text-neutral-600">
                    Phone: {restaurantSettings.phone}
                  </p>
                  <div className="text-[9px] text-neutral-500 flex justify-center gap-3 mt-1">
                    <span>GSTIN: {restaurantSettings.gstin}</span>
                    <span>&bull;</span>
                    <span>FSSAI Lic: {restaurantSettings.fssaiNumber}</span>
                  </div>
                  <div className="mt-1 text-[11px] font-bold bg-neutral-100 py-0.5 rounded text-neutral-800">
                    TAX INVOICE / BILL OF SUPPLY
                  </div>
                </div>

                {/* Metadata */}
                <div className="grid grid-cols-2 text-[10px] text-neutral-700 gap-1 border-b pb-2 border-neutral-200">
                  <div>
                    <div><strong>Invoice No:</strong> {generatedInvoiceNum}</div>
                    <div><strong>Date &amp; Time:</strong> {order.createdAt ? new Date(order.createdAt).toLocaleString('en-IN') : new Date().toLocaleString('en-IN')}</div>
                    <div><strong>Table No:</strong> Table #{order.tableNumber} ({order.section})</div>
                  </div>
                  <div className="text-right">
                    <div><strong>Order Ref:</strong> #{order.orderNumber}</div>
                    <div><strong>Customer:</strong> {order.customerName || 'Dine-In Guest'}</div>
                    <div><strong>Payment Method:</strong> {(order.paymentMethod || selectedPaymentMethod).toUpperCase()} (Paid in Full)</div>
                  </div>
                </div>

                {/* Items Table */}
                <div className="space-y-1">
                  <div className="grid grid-cols-6 font-bold border-b border-neutral-300 pb-1 text-[10px] text-neutral-800">
                    <span className="col-span-3">Item Description</span>
                    <span className="text-center">Qty</span>
                    <span className="text-right">Rate</span>
                    <span className="text-right">Amount</span>
                  </div>

                  <div className="divide-y divide-neutral-100 text-[10px]">
                    {order.items.map((it, idx) => (
                      <div key={idx} className="grid grid-cols-6 py-1.5">
                        <div className="col-span-3">
                          <span className="font-semibold">{it.name}</span>
                          <span className="text-[9px] text-neutral-500 block">{it.localName}</span>
                        </div>
                        <span className="text-center font-mono">{it.quantity}</span>
                        <span className="text-right font-mono">{restaurantSettings.currencySymbol}{it.price}</span>
                        <span className="text-right font-mono font-bold">{restaurantSettings.currencySymbol}{it.price * it.quantity}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Taxes & Totals */}
                <div className="border-t border-neutral-300 pt-2 space-y-1 text-[10px]">
                  <div className="flex justify-between text-neutral-600">
                    <span>Sub Total:</span>
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
                  <div className="flex justify-between text-xs font-black text-neutral-950 pt-1 border-t border-neutral-300">
                    <span>Grand Total:</span>
                    <span className="font-mono text-sm">{restaurantSettings.currencySymbol}{order.totalAmount}</span>
                  </div>
                </div>

                {/* Settlement Summary */}
                <div className="bg-neutral-50 p-2 rounded text-[10px] text-neutral-700 border border-neutral-200 flex items-center justify-between">
                  <span><strong>Settlement:</strong> Settled in full via {selectedPaymentMethod.toUpperCase()}</span>
                  <span className="font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">100% PAID</span>
                </div>

                <div className="text-center text-[9px] text-neutral-500 border-t pt-2">
                  Thank you for dining at {restaurantSettings.restaurantName}! Visit again.
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Controls */}
        <div className="p-4 sm:p-5 bg-neutral-950 border-t border-neutral-800 flex items-center justify-between gap-3 no-print">
          {!isCompleted ? (
            <>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs text-neutral-400 hover:text-white transition"
              >
                Back to Table
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSettleBill}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-neutral-950 font-black text-xs shadow-lg shadow-emerald-950/40 transition cursor-pointer active:scale-95"
                >
                  <CreditCard className="w-4 h-4" />
                  <span>Settle Bill ({restaurantSettings.currencySymbol}{order.totalAmount}) via {selectedPaymentMethod.toUpperCase()}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </>
          ) : (
            <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={handlePrint}
                  className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-2.5 bg-neutral-800 hover:bg-neutral-700 active:scale-95 text-white rounded-xl text-xs font-semibold transition border border-neutral-700 shadow-md cursor-pointer"
                >
                  <Printer className="w-4 h-4 text-amber-400" />
                  <span>Print Invoice Receipt</span>
                </button>

                <button
                  type="button"
                  onClick={handleDownloadTxt}
                  className="flex items-center justify-center gap-1.5 px-3 py-2.5 bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-white rounded-xl text-xs font-medium transition border border-neutral-800 cursor-pointer"
                  title="Download ESC/POS thermal text receipt file"
                >
                  <Download className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="hidden sm:inline">{printerConfig.paperWidth} .txt</span>
                </button>

                <button
                  type="button"
                  onClick={handleRawBTPrint}
                  className="flex items-center justify-center gap-1.5 px-3 py-2.5 bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-white rounded-xl text-xs font-medium transition border border-neutral-800 cursor-pointer"
                  title="Silent Bluetooth print via Android RawBT Print Service app"
                >
                  <Bluetooth className="w-3.5 h-3.5 text-blue-400" />
                  <span className="hidden sm:inline">RawBT</span>
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
                Close Window
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Also export as SplitBillModal for seamless backward compatibility
export const SplitBillModal = BillPaymentModal;
