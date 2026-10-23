import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { useRestaurant } from '../../context/RestaurantContext';
import { SplitPaymentInfo, SplitShare } from '../../types/restaurant';
import { soundEffects } from '../../utils/audio';
import {
  X,
  CreditCard,
  QrCode,
  Smartphone,
  CheckCircle2,
  Mail,
  Printer,
  Download,
  Users,
  Divide,
  Receipt,
  FileCheck,
  Send,
  Building,
  Check,
  ShieldCheck,
  Sparkles,
  ArrowRight,
} from 'lucide-react';

interface SplitBillModalProps {
  orderId: string | null;
  onClose: () => void;
}

export const SplitBillModal: React.FC<SplitBillModalProps> = ({ orderId, onClose }) => {
  const { orders, processSplitPayment } = useRestaurant();

  const order = orders.find(o => o.id === orderId);

  const [splitMode, setSplitMode] = useState<'equal' | 'by_item' | 'custom_amount'>('equal');
  const [personCount, setPersonCount] = useState<number>(3);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'upi' | 'card' | 'cash' | 'netbanking'>('upi');
  const [customerEmail, setCustomerEmail] = useState<string>(order?.customerEmail || 'caankitgupta777@gmail.com');

  // Equal split shares
  const [equalShares, setEqualShares] = useState<SplitShare[]>(() => {
    if (!order) return [];
    const shareAmt = Math.round(order.totalAmount / 3);
    return [
      { id: 'p1', personName: 'Person 1 (Ankit)', amount: shareAmt, isPaid: false },
      { id: 'p2', personName: 'Person 2 (Rohan)', amount: shareAmt, isPaid: false },
      { id: 'p3', personName: 'Person 3 (Pooja)', amount: order.totalAmount - (shareAmt * 2), isPaid: false },
    ];
  });

  // State when payment is complete
  const [isCompleted, setIsCompleted] = useState<boolean>(false);
  const [generatedInvoiceNum, setGeneratedInvoiceNum] = useState<string>('');
  const [isEmailSending, setIsEmailSending] = useState<boolean>(false);
  const [emailSentStatus, setEmailSentStatus] = useState<boolean>(false);
  const [activePaymentStep, setActivePaymentStep] = useState<'split' | 'gateway' | 'invoice'>('split');
  const [activePayingPersonId, setActivePayingPersonId] = useState<string | null>(null);

  if (!order) return null;

  // Recalculate equal shares when person count changes
  const handlePersonCountChange = (count: number) => {
    setPersonCount(count);
    const baseAmount = Math.floor(order.totalAmount / count);
    const remainder = order.totalAmount - (baseAmount * count);

    const newShares: SplitShare[] = Array.from({ length: count }, (_, idx) => ({
      id: `p-${idx + 1}`,
      personName: idx === 0 ? 'Person 1 (You)' : `Person ${idx + 1}`,
      amount: idx === count - 1 ? baseAmount + remainder : baseAmount,
      isPaid: false,
    }));
    setEqualShares(newShares);
  };

  // Pay single person share
  const handlePaySingleShare = (shareId: string) => {
    setEqualShares(prev => prev.map(s => s.id === shareId ? {
      ...s,
      isPaid: true,
      paymentMethod: selectedPaymentMethod,
      paidAt: new Date().toLocaleTimeString(),
    } : s));

    soundEffects.playPaymentSuccess();

    // Check if all shares are paid
    const updated = equalShares.map(s => s.id === shareId ? { ...s, isPaid: true } : s);
    if (updated.every(s => s.isPaid)) {
      handleFinalizePayment(updated);
    }
  };

  // Pay all remaining shares at once
  const handlePayAll = () => {
    const fullyPaid = equalShares.map(s => ({
      ...s,
      isPaid: true,
      paymentMethod: selectedPaymentMethod,
      paidAt: new Date().toLocaleTimeString(),
    }));
    setEqualShares(fullyPaid);
    handleFinalizePayment(fullyPaid);
  };

  const handleFinalizePayment = async (shares: SplitShare[]) => {
    try {
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.6 },
      });
    } catch {}

    const splitInfo: SplitPaymentInfo = {
      mode: splitMode,
      totalAmount: order.totalAmount,
      shares,
    };

    const res = await processSplitPayment(order.id, splitInfo, customerEmail);
    if (res.success) {
      setGeneratedInvoiceNum(res.invoiceNumber);
      setIsCompleted(true);
      setActivePaymentStep('invoice');

      // Auto-dispatch simulated email
      setIsEmailSending(true);
      setTimeout(() => {
        setIsEmailSending(false);
        setEmailSentStatus(true);
      }, 1500);
    }
  };

  // Print invoice handler
  const handlePrint = () => {
    window.print();
  };

  const totalPaidSoFar = equalShares.filter(s => s.isPaid).reduce((sum, s) => sum + s.amount, 0);
  const remainingToPay = order.totalAmount - totalPaidSoFar;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-3 sm:p-5 overflow-y-auto">
      <div className="w-full max-w-2xl bg-neutral-900 border border-neutral-750 rounded-2xl shadow-2xl overflow-hidden my-auto text-neutral-100 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-neutral-950 border-b border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-950/40">
              <Receipt className="w-5 h-5 text-neutral-950" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-white font-['Outfit']">
                  Split Bill & Settle Payment
                </h2>
                <span className="text-xs font-mono font-bold text-amber-400 bg-neutral-800 px-2 py-0.5 rounded border border-neutral-700">
                  #{order.orderNumber}
                </span>
              </div>
              <p className="text-xs text-neutral-400">
                Table {order.tableNumber} &bull; Total: <strong className="text-white">₹{order.totalAmount}</strong> (Incl. 5% GST)
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6 flex-1">
          {/* STEP 1: If Not Completed, show Split Mode & Payment Gateway */}
          {!isCompleted ? (
            <>
              {/* Split Mode Selector */}
              <div className="space-y-3">
                <label className="text-xs font-bold text-neutral-300 uppercase tracking-wider block">
                  Choose Split Methodology
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => setSplitMode('equal')}
                    className={`p-3 rounded-xl border text-xs font-semibold text-center transition flex flex-col items-center gap-1.5 ${
                      splitMode === 'equal'
                        ? 'bg-amber-500/20 border-amber-500 text-amber-400 shadow-sm'
                        : 'bg-neutral-800/60 border-neutral-700/60 text-neutral-400 hover:text-white'
                    }`}
                  >
                    <Users className="w-4 h-4" />
                    <span>Split Equally</span>
                  </button>

                  <button
                    onClick={() => setSplitMode('by_item')}
                    className={`p-3 rounded-xl border text-xs font-semibold text-center transition flex flex-col items-center gap-1.5 ${
                      splitMode === 'by_item'
                        ? 'bg-amber-500/20 border-amber-500 text-amber-400 shadow-sm'
                        : 'bg-neutral-800/60 border-neutral-700/60 text-neutral-400 hover:text-white'
                    }`}
                  >
                    <Divide className="w-4 h-4" />
                    <span>By Dish Ordered</span>
                  </button>

                  <button
                    onClick={() => setSplitMode('custom_amount')}
                    className={`p-3 rounded-xl border text-xs font-semibold text-center transition flex flex-col items-center gap-1.5 ${
                      splitMode === 'custom_amount'
                        ? 'bg-amber-500/20 border-amber-500 text-amber-400 shadow-sm'
                        : 'bg-neutral-800/60 border-neutral-700/60 text-neutral-400 hover:text-white'
                    }`}
                  >
                    <CreditCard className="w-4 h-4" />
                    <span>Custom Shares</span>
                  </button>
                </div>
              </div>

              {/* Number of People Stepper (for equal split) */}
              {splitMode === 'equal' && (
                <div className="bg-neutral-950 p-4 rounded-xl border border-neutral-800 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-neutral-200">Split Between How Many People?</span>
                    <p className="text-[11px] text-neutral-400 mt-0.5">
                      Each person pays ~₹{Math.round(order.totalAmount / personCount)}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    {[2, 3, 4, 5, 6].map(num => (
                      <button
                        key={num}
                        onClick={() => handlePersonCountChange(num)}
                        className={`w-8 h-8 rounded-lg text-xs font-black transition ${
                          personCount === num
                            ? 'bg-amber-500 text-neutral-950 shadow-md'
                            : 'bg-neutral-800 text-neutral-400 hover:text-white'
                        }`}
                      >
                        {num}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Person Shares Breakdown */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between text-xs text-neutral-400">
                  <span>Guest Breakdown</span>
                  <span>Paid: <strong className="text-emerald-400">₹{totalPaidSoFar}</strong> / Remaining: <strong className="text-amber-400">₹{remainingToPay}</strong></span>
                </div>

                <div className="divide-y divide-neutral-800/80 bg-neutral-950/70 rounded-xl border border-neutral-800 p-2">
                  {equalShares.map((share) => (
                    <div key={share.id} className="py-2.5 px-2 flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                          share.isPaid ? 'bg-emerald-500 text-neutral-950' : 'bg-neutral-800 text-neutral-400'
                        }`}>
                          {share.isPaid ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : share.personName.charAt(0)}
                        </span>
                        <div>
                          <div className="text-xs font-bold text-neutral-200">{share.personName}</div>
                          <span className="text-[11px] text-neutral-400">
                            {share.isPaid ? `Paid via ${share.paymentMethod?.toUpperCase()} at ${share.paidAt}` : 'Awaiting settlement'}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="text-sm font-black text-white">₹{share.amount}</span>
                        {share.isPaid ? (
                          <span className="text-emerald-400 text-xs font-bold px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30">
                            Settled
                          </span>
                        ) : (
                          <button
                            onClick={() => handlePaySingleShare(share.id)}
                            className="px-2.5 py-1 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold rounded-lg text-xs transition shadow-sm"
                          >
                            Pay Share
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Payment Gateway Method Selection */}
              <div className="space-y-3">
                <label className="text-xs font-bold text-neutral-300 uppercase tracking-wider block">
                  Select Payment Gateway
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: 'upi', label: 'UPI / QR Code', icon: QrCode },
                    { id: 'card', label: 'Credit/Debit Card', icon: CreditCard },
                    { id: 'netbanking', label: 'Net Banking', icon: Building },
                    { id: 'cash', label: 'Cash at Counter', icon: Receipt },
                  ].map(method => {
                    const Icon = method.icon;
                    const isSel = selectedPaymentMethod === method.id;
                    return (
                      <button
                        key={method.id}
                        onClick={() => setSelectedPaymentMethod(method.id as any)}
                        className={`p-3 rounded-xl border text-xs font-semibold flex flex-col items-center gap-1.5 transition ${
                          isSel
                            ? 'bg-emerald-500/15 border-emerald-500 text-emerald-400 shadow-sm'
                            : 'bg-neutral-800/60 border-neutral-700/60 text-neutral-400 hover:text-white'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        <span>{method.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* UPI QR Display or Card Input preview */}
              {selectedPaymentMethod === 'upi' ? (
                <div className="p-4 bg-neutral-950 rounded-xl border border-neutral-800 flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
                  <div className="w-28 h-28 bg-white p-2 rounded-xl flex items-center justify-center shrink-0 shadow-lg">
                    {/* Simulated Authentic Indian UPI QR Code */}
                    <div className="w-full h-full border-2 border-neutral-900 flex flex-col items-center justify-center p-1 text-[10px] text-neutral-900 font-mono">
                      <QrCode className="w-16 h-16 text-neutral-950" />
                      <span className="text-[9px] font-bold">BHIM UPI PAY</span>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <span className="text-xs font-bold text-neutral-200">
                      Scan with Google Pay, PhonePe, or Paytm
                    </span>
                    <p className="text-[11px] text-neutral-400 leading-relaxed">
                      UPI ID: <span className="font-mono text-amber-400 font-semibold">varhadrasoi.amravati@icici</span>
                    </p>
                    <p className="text-[10px] text-neutral-500">
                      Instant 0% transaction fee. Auto-receipt generated.
                    </p>
                  </div>
                </div>
              ) : selectedPaymentMethod === 'card' ? (
                <div className="p-4 bg-neutral-950 rounded-xl border border-neutral-800 space-y-2 text-xs">
                  <div className="flex items-center gap-2 text-neutral-300 font-semibold mb-1">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <span>256-Bit Encrypted Indian Card Gateway</span>
                  </div>
                  <input
                    type="text"
                    disabled
                    value="•••• •••• •••• 4242 (Demo Card Active)"
                    className="w-full px-3 py-2 bg-neutral-900 border border-neutral-800 rounded-lg text-neutral-400 font-mono"
                  />
                  <div className="flex gap-2">
                    <input
                      type="text"
                      disabled
                      value="12/28"
                      className="w-1/2 px-3 py-1.5 bg-neutral-900 border border-neutral-800 rounded-lg text-neutral-400 text-center font-mono"
                    />
                    <input
                      type="text"
                      disabled
                      value="•••"
                      className="w-1/2 px-3 py-1.5 bg-neutral-900 border border-neutral-800 rounded-lg text-neutral-400 text-center font-mono"
                    />
                  </div>
                </div>
              ) : null}

              {/* Customer Email for Automated Invoicing */}
              <div className="bg-neutral-950 p-3.5 rounded-xl border border-neutral-800 space-y-1.5">
                <label className="text-xs font-bold text-neutral-300 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-amber-400" />
                  Email Address for Instant GST Tax Invoice
                </label>
                <input
                  type="email"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  placeholder="Enter customer email"
                  className="w-full px-3 py-2 bg-neutral-900 border border-neutral-800 rounded-lg text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-amber-500/50"
                />
                <span className="text-[10px] text-neutral-500 block">
                  The invoice will be dispatched automatically to this email upon payment confirmation.
                </span>
              </div>
            </>
          ) : (
            /* STEP 2: Payment Complete & GST Invoice Preview */
            <div className="space-y-5 animate-in fade-in duration-300">
              {/* Success Banner */}
              <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-500/40 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-500 text-neutral-950 flex items-center justify-center font-bold shrink-0">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-emerald-400">
                    Payment Settled & Table Cleared
                  </h3>
                  <p className="text-xs text-neutral-300 mt-0.5">
                    Order #{order.orderNumber} settled in full. Thank you for dining at Varhad Rasoi Amravati!
                  </p>
                </div>
              </div>

              {/* Email Automated Dispatch Status */}
              <div className="p-3.5 rounded-xl bg-neutral-950 border border-neutral-800 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-amber-400" />
                  <div>
                    <span className="font-semibold text-neutral-200">Automated Email Invoice Dispatch</span>
                    <p className="text-[11px] text-neutral-400">To: <span className="text-white font-medium">{customerEmail}</span></p>
                  </div>
                </div>

                <div>
                  {isEmailSending ? (
                    <span className="flex items-center gap-1.5 text-amber-400 font-semibold text-[11px]">
                      <Send className="w-3 h-3 animate-spin" /> Sending...
                    </span>
                  ) : emailSentStatus ? (
                    <span className="flex items-center gap-1 text-emerald-400 font-bold text-[11px] bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/30">
                      <Check className="w-3 h-3" /> Dispatched
                    </span>
                  ) : null}
                </div>
              </div>

              {/* Printable Official GST Tax Invoice */}
              <div id="restaurant-tax-invoice" className="bg-white text-neutral-900 rounded-xl p-5 shadow-2xl font-sans text-xs space-y-4 border border-neutral-300">
                {/* Header */}
                <div className="text-center border-b pb-3 border-neutral-300">
                  <h2 className="text-base font-extrabold tracking-tight uppercase text-neutral-950">
                    VARHAD RASOI & HERITAGE DINING
                  </h2>
                  <p className="text-[10px] text-neutral-600">
                    Rajkamal Square, Badnera Road, Amravati, Maharashtra - 444601
                  </p>
                  <div className="text-[9px] text-neutral-500 flex justify-center gap-3 mt-1">
                    <span>GSTIN: 27AABCV1234F1Z8</span>
                    <span>&bull;</span>
                    <span>FSSAI Lic: 11522026000412</span>
                  </div>
                  <div className="mt-1 text-[11px] font-bold bg-neutral-100 py-0.5 rounded text-neutral-800">
                    TAX INVOICE / BILL OF SUPPLY
                  </div>
                </div>

                {/* Metadata */}
                <div className="grid grid-cols-2 text-[10px] text-neutral-700 gap-1 border-b pb-2 border-neutral-200">
                  <div>
                    <div><strong>Invoice No:</strong> {generatedInvoiceNum}</div>
                    <div><strong>Date & Time:</strong> {new Date().toLocaleString()}</div>
                    <div><strong>Table No:</strong> Table #{order.tableNumber} ({order.section})</div>
                  </div>
                  <div className="text-right">
                    <div><strong>Order Ref:</strong> #{order.orderNumber}</div>
                    <div><strong>Customer:</strong> {order.customerName || 'Ankit Gupta'}</div>
                    <div><strong>Payment Method:</strong> {selectedPaymentMethod.toUpperCase()} (Split)</div>
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
                        <span className="text-right font-mono">₹{it.price}</span>
                        <span className="text-right font-mono font-bold">₹{it.price * it.quantity}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Taxes & Totals */}
                <div className="border-t border-neutral-300 pt-2 space-y-1 text-[10px]">
                  <div className="flex justify-between text-neutral-600">
                    <span>Sub Total:</span>
                    <span className="font-mono">₹{order.subtotal}</span>
                  </div>
                  <div className="flex justify-between text-neutral-600">
                    <span>CGST (2.5%):</span>
                    <span className="font-mono">₹{order.cgst.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-neutral-600">
                    <span>SGST (2.5%):</span>
                    <span className="font-mono">₹{order.sgst.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-xs font-black text-neutral-950 pt-1 border-t border-neutral-300">
                    <span>Grand Total:</span>
                    <span className="font-mono text-sm">₹{order.totalAmount}</span>
                  </div>
                </div>

                {/* Split info summary */}
                <div className="bg-neutral-50 p-2 rounded text-[9px] text-neutral-600 border border-neutral-200">
                  <strong>Split Settlement Record:</strong> Paid in {equalShares.length} shares across guests. Fully reconciled.
                </div>

                <div className="text-center text-[9px] text-neutral-500 border-t pt-2">
                  Thank you for visiting Varhad Rasoi Amravati! Please visit again.
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Controls */}
        <div className="p-4 sm:p-5 bg-neutral-950 border-t border-neutral-800 flex items-center justify-between gap-3">
          {!isCompleted ? (
            <>
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs text-neutral-400 hover:text-white"
              >
                Back to Table
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={handlePayAll}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-neutral-950 font-black text-xs shadow-lg shadow-emerald-950/40 transition"
                >
                  <CreditCard className="w-4 h-4" />
                  <span>Settle All Shares (₹{remainingToPay})</span>
                </button>
              </div>
            </>
          ) : (
            <div className="w-full flex items-center justify-between">
              <button
                onClick={handlePrint}
                className="flex items-center gap-1.5 px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-white rounded-xl text-xs font-semibold transition"
              >
                <Printer className="w-4 h-4" />
                <span>Print / Save PDF</span>
              </button>

              <button
                onClick={onClose}
                className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold rounded-xl text-xs transition"
              >
                Done
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
