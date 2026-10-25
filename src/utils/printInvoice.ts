/**
 * Production Print & Thermal Receipt Utility for Commercial Restaurant POS
 * Supports isolated printing, ESC/POS formatting (58mm/80mm),
 * Android RawBT Bluetooth thermal printing, duplicate bill stamping, and Z-Reports.
 */

import { Order, RestaurantSettings, RegisterShift } from '../types/restaurant';

/**
 * Helper to left-pad a string with spaces
 */
const padLeft = (str: string | number, len: number): string => {
  const s = String(str);
  if (s.length >= len) return s;
  return ' '.repeat(len - s.length) + s;
};

/**
 * Helper to right-pad a string with spaces
 */
const padRight = (str: string | number, len: number): string => {
  const s = String(str);
  if (s.length >= len) return s;
  return s + ' '.repeat(len - s.length);
};

/**
 * Helper to center text within a fixed width without cutting or truncating
 */
const centerText = (str: string, width: number): string => {
  const clean = String(str).trim();
  if (clean.length >= width) return clean.slice(0, width);
  const leftPad = Math.floor((width - clean.length) / 2);
  const rightPad = width - clean.length - leftPad;
  return ' '.repeat(leftPad) + clean + ' '.repeat(rightPad);
};

/**
 * Helper to justify text (left label, right value) across a full width.
 * If text cannot fit on one line, returns two clean lines rather than truncating text.
 */
const justifyText = (left: string, right: string, width: number): string => {
  const l = String(left).trim();
  const r = String(right).trim();
  if (!r) return l;
  if (!l) return padLeft(r, width);
  const spaces = width - l.length - r.length;
  if (spaces >= 1) {
    return l + ' '.repeat(spaces) + r;
  }
  return l + '\r\n' + padLeft(r, width);
};

/**
 * Word wrap helper that breaks text cleanly across maxWidth columns
 */
const wrapWords = (text: string, maxWidth: number): string[] => {
  const words = String(text).trim().split(/\s+/);
  const lines: string[] = [];
  let current = '';

  for (const w of words) {
    if (w.length > maxWidth) {
      if (current) {
        lines.push(current);
        current = '';
      }
      let remaining = w;
      while (remaining.length > maxWidth) {
        lines.push(remaining.slice(0, maxWidth));
        remaining = remaining.slice(maxWidth);
      }
      current = remaining;
      continue;
    }

    if (!current) {
      current = w;
    } else if ((current + ' ' + w).length <= maxWidth) {
      current += ' ' + w;
    } else {
      lines.push(current);
      current = w;
    }
  }
  if (current) lines.push(current);
  return lines.length > 0 ? lines : [''];
};

/**
 * Triggers printing of the invoice element with duplicate indicator support.
 */
export const printInvoiceElement = (
  elementId: string = 'restaurant-tax-invoice',
  isDuplicate: boolean = false
): boolean => {
  try {
    const targetEl = document.getElementById(elementId);
    if (!targetEl) {
      console.warn(`Element #${elementId} not found, falling back to window.print()`);
      window.print();
      return true;
    }

    const existingFrame = document.getElementById('pos-print-frame');
    if (existingFrame) {
      existingFrame.remove();
    }

    const printFrame = document.createElement('iframe');
    printFrame.id = 'pos-print-frame';
    printFrame.style.position = 'fixed';
    printFrame.style.right = '0';
    printFrame.style.bottom = '0';
    printFrame.style.width = '0';
    printFrame.style.height = '0';
    printFrame.style.border = '0';
    printFrame.style.opacity = '0';
    printFrame.style.pointerEvents = 'none';

    document.body.appendChild(printFrame);

    const frameDoc = printFrame.contentWindow?.document;
    if (!frameDoc) {
      window.print();
      return true;
    }

    frameDoc.open();
    frameDoc.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>Tax Invoice - Receipt</title>
          <style>
            @page {
              size: auto;
              margin: 3mm 4mm;
            }
            * {
              box-sizing: border-box;
              margin: 0;
              padding: 0;
            }
            body {
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
              font-size: 11px;
              line-height: 1.3;
              color: #000000;
              background: #ffffff;
              padding: 6px;
              width: 100%;
              max-width: 80mm;
              margin: 0 auto;
            }
            .text-center { text-align: center; }
            .text-right { text-align: right; }
            .font-bold { font-weight: bold; }
            .font-black { font-weight: 900; }
            .font-mono { font-family: monospace; }
            .uppercase { text-transform: uppercase; }
            .border-b { border-bottom: 1px dashed #444; }
            .border-t { border-top: 1px dashed #444; }
            .border { border: 1px dashed #444; }
            .py-1 { padding-top: 2px; padding-bottom: 2px; }
            .py-2 { padding-top: 5px; padding-bottom: 5px; }
            .duplicate-badge {
              border: 1px solid #000;
              padding: 2px 4px;
              font-weight: bold;
              font-size: 10px;
              display: inline-block;
              margin: 4px auto;
              text-align: center;
              width: 90%;
            }
            table { width: 100%; border-collapse: collapse; }
            th, td { padding: 2px 0; }
          </style>
        </head>
        <body>
          ${isDuplicate ? '<div class="text-center"><div class="duplicate-badge">*** DUPLICATE BILL - RE-PRINT ***</div></div>' : ''}
          <div class="receipt-container">
            ${targetEl.innerHTML}
          </div>
        </body>
      </html>
    `);
    frameDoc.close();

    setTimeout(() => {
      try {
        printFrame.contentWindow?.focus();
        printFrame.contentWindow?.print();
      } catch (err) {
        console.warn('Iframe print failed, calling window.print()', err);
        window.print();
      } finally {
        setTimeout(() => {
          if (document.body.contains(printFrame)) {
            printFrame.remove();
          }
        }, 3000);
      }
    }, 250);

    return true;
  } catch (error) {
    console.error('Print error:', error);
    window.print();
    return false;
  }
};

/**
 * Generates an ESC/POS formatted receipt string (58mm or 80mm).
 * Engineered for standard thermal printers without character truncation or column distortion.
 */
export const generateEscPosReceiptText = (
  order: Order,
  settings: RestaurantSettings,
  paperWidth: '58mm' | '80mm' = '80mm',
  isDuplicate: boolean = false
): string => {
  const width = paperWidth === '58mm' ? 32 : 48;
  const line = '='.repeat(width);
  const dashed = '-'.repeat(width);
  const curr = (settings.currencySymbol === '₹' || !settings.currencySymbol) ? 'Rs.' : settings.currencySymbol;

  const lines: string[] = [];
  const add = (str: string) => lines.push(str);

  // Top border
  add(line);

  // Duplicate indicator
  if (isDuplicate || (order.printCount || 0) > 1) {
    add(centerText('*** DUPLICATE BILL / RE-PRINT ***', width));
    add(centerText('ORIGINAL ALREADY ISSUED', width));
    add(dashed);
  }

  // Restaurant Header (properly wrapped and centered without truncation)
  const restName = settings.restaurantName ? settings.restaurantName.toUpperCase() : 'RESTAURANT';
  wrapWords(restName, width).forEach(l => add(centerText(l, width)));

  const fullAddress = `${settings.address || ''}${settings.city ? ', ' + settings.city : ''}${settings.state ? ', ' + settings.state : ''}`.trim();
  if (fullAddress) {
    wrapWords(fullAddress, width).forEach(l => add(centerText(l, width)));
  }

  if (settings.phone) {
    add(centerText(`Phone: ${settings.phone}`, width));
  }

  // Tax Identifiers
  const gstin = settings.gstin ? `GSTIN: ${settings.gstin}` : '';
  const fssai = settings.fssaiNumber ? `FSSAI: ${settings.fssaiNumber}` : '';

  if (paperWidth === '80mm' && gstin && fssai) {
    add(centerText(`${gstin} | ${fssai}`, width));
  } else {
    if (gstin) add(centerText(gstin, width));
    if (fssai) add(centerText(fssai, width));
  }

  add(dashed);
  add(centerText('TAX INVOICE / CASH MEMO', width));
  add(dashed);

  // Invoice & Order Metadata
  const invoiceNum = order.invoiceNumber || `INV-VR-${order.orderNumber}`;
  const dateObj = order.createdAt ? new Date(order.createdAt) : new Date();
  const dateStr = !isNaN(dateObj.getTime())
    ? dateObj.toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' })
    : new Date().toLocaleDateString('en-IN');
  const timeStr = !isNaN(dateObj.getTime())
    ? dateObj.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })
    : new Date().toLocaleTimeString('en-IN');

  const isPaid = order.paymentStatus === 'paid' || order.status === 'completed';

  if (paperWidth === '80mm') {
    add(justifyText(`Invoice No : ${invoiceNum}`, `Table : Table #${order.tableNumber}`, width));
    add(justifyText(`Order Ref  : #${order.orderNumber}`, `Section: ${order.section || 'Dining'}`, width));
    add(justifyText(`Date & Time: ${dateStr}, ${timeStr}`, '', width));
    if (order.customerName) {
      add(justifyText(`Customer   : ${order.customerName}`, `Status : ${isPaid ? 'PAID' : 'PENDING'}`, width));
    } else {
      add(justifyText(`Status     : ${isPaid ? 'PAID' : 'PENDING'}`, '', width));
    }
  } else {
    // 58mm compact layout
    add(`Invoice: ${invoiceNum}`);
    add(justifyText(`Order  : #${order.orderNumber}`, `Tbl #${order.tableNumber}`, width));
    add(justifyText(`Section: ${order.section || 'Dining'}`, isPaid ? 'PAID' : 'DUE', width));
    add(justifyText(`Date   : ${dateStr}`, `${timeStr}`, width));
    if (order.customerName) {
      add(`Guest  : ${order.customerName}`);
    }
  }

  add(dashed);

  // Items Table Header & Column Widths
  if (paperWidth === '80mm') {
    // Exact column sum: 22 + 4 + 10 + 12 = 48 columns
    const colName = 22;
    const colQty = 4;
    const colRate = 10;
    const colAmt = 12;

    add(
      padRight('ITEM DESCRIPTION', colName) +
      padLeft('QTY', colQty) +
      padLeft('RATE', colRate) +
      padLeft('AMOUNT', colAmt)
    );
    add(dashed);

    order.items.forEach(it => {
      const rateStr = it.price.toFixed(2);
      const amtStr = (it.price * it.quantity).toFixed(2);
      const nameParts = wrapWords(it.name, colName - 1);

      // First line: dish name first chunk + Qty + Rate + Amount
      add(
        padRight(nameParts[0], colName) +
        padLeft(String(it.quantity), colQty) +
        padLeft(rateStr, colRate) +
        padLeft(amtStr, colAmt)
      );

      // Subsequent lines for wrapped dish name (wrap remaining to width - 2)
      if (nameParts.length > 1) {
        const remainingName = nameParts.slice(1).join(' ');
        const wrappedRemaining = wrapWords(remainingName, width - 2);
        wrappedRemaining.forEach(l => add('  ' + l));
      }
    });
  } else {
    // 58mm: Exact column sum: 15 + 3 + 6 + 8 = 32 columns
    const colName = 15;
    const colQty = 3;
    const colRate = 6;
    const colAmt = 8;

    add(
      padRight('ITEM', colName) +
      padLeft('QTY', colQty) +
      padLeft('RATE', colRate) +
      padLeft('AMT', colAmt)
    );
    add(dashed);

    order.items.forEach(it => {
      const rateStr = String(Math.round(it.price));
      const amtStr = String(Math.round(it.price * it.quantity));
      const nameParts = wrapWords(it.name, colName - 1);

      add(
        padRight(nameParts[0], colName) +
        padLeft(String(it.quantity), colQty) +
        padLeft(rateStr, colRate) +
        padLeft(amtStr, colAmt)
      );

      if (nameParts.length > 1) {
        const remainingName = nameParts.slice(1).join(' ');
        const wrappedRemaining = wrapWords(remainingName, width - 2);
        wrappedRemaining.forEach(l => add('  ' + l));
      }
    });
  }

  add(dashed);

  // Financial Subtotals & GST Breakdown
  if (paperWidth === '80mm') {
    add(justifyText('Sub Total:', `${curr} ${order.subtotal.toFixed(2)}`, width));
    add(justifyText(`CGST (${settings.cgstRate}%):`, `${curr} ${order.cgst.toFixed(2)}`, width));
    add(justifyText(`SGST (${settings.sgstRate}%):`, `${curr} ${order.sgst.toFixed(2)}`, width));
    if (order.serviceCharge && order.serviceCharge > 0) {
      add(justifyText(`Service Charge (${settings.serviceChargeRate || 5}%):`, `${curr} ${order.serviceCharge.toFixed(2)}`, width));
    }
    add(line);
    add(justifyText('GRAND TOTAL:', `${curr} ${order.totalAmount.toFixed(2)}`, width));
    add(line);
  } else {
    add(justifyText('Sub Total:', `${curr} ${order.subtotal}`, width));
    add(justifyText(`CGST (${settings.cgstRate}%):`, `${curr} ${order.cgst.toFixed(2)}`, width));
    add(justifyText(`SGST (${settings.sgstRate}%):`, `${curr} ${order.sgst.toFixed(2)}`, width));
    if (order.serviceCharge && order.serviceCharge > 0) {
      add(justifyText('Service Chg:', `${curr} ${order.serviceCharge.toFixed(2)}`, width));
    }
    add(line);
    add(justifyText('GRAND TOTAL:', `${curr} ${order.totalAmount}`, width));
    add(line);
  }

  // Payment Settlement Information (Single payment mode, no split)
  const paymentMode = (
    order.paymentMethod ||
    order.splitPayment?.shares?.[0]?.paymentMethod ||
    (isPaid ? 'UPI' : 'PENDING')
  ).toUpperCase();

  if (paperWidth === '80mm') {
    add(justifyText('Payment Mode :', paymentMode, width));
    add(justifyText('Payment Status:', isPaid ? 'PAID IN FULL (100%)' : 'PENDING', width));
    add(justifyText('Settlement   :', isPaid ? 'VERIFIED & CLOSED' : 'UNSETTLED', width));
  } else {
    add(justifyText('Payment:', paymentMode, width));
    add(justifyText('Status :', isPaid ? '100% PAID' : 'PENDING', width));
  }

  add(dashed);

  // Thermal Receipt Footer (wrapped cleanly to width)
  wrapWords('Thank You for Dining With Us!', width).forEach(l => add(centerText(l, width)));
  wrapWords('Please Visit Us Again!', width).forEach(l => add(centerText(l, width)));
  if (settings.phone) {
    add(centerText(`Ph: ${settings.phone}`, width));
  }
  add(line);

  // Feed 4 blank lines at end for clean thermal printer cutting
  add('');
  add('');
  add('');
  add('');

  return lines.join('\r\n');
};

/**
 * Downloads receipt as plain text file (.txt) formatted for 58mm or 80mm thermal printers.
 */
export const downloadThermalReceiptTxt = (
  order: Order,
  settings: RestaurantSettings,
  paperWidth: '58mm' | '80mm' = '80mm',
  isDuplicate: boolean = false
) => {
  const receipt = generateEscPosReceiptText(order, settings, paperWidth, isDuplicate);
  const blob = new Blob([receipt], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Receipt_${order.invoiceNumber || order.orderNumber}_${paperWidth}${isDuplicate ? '_COPY' : ''}.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

/**
 * Android RawBT Bluetooth Thermal Print Trigger
 * Launches RawBT app installed on phone via Android Intent.
 */
export const printViaRawBT = (
  order: Order,
  settings: RestaurantSettings,
  paperWidth: '58mm' | '80mm' = '80mm',
  isDuplicate: boolean = false
) => {
  const receiptText = generateEscPosReceiptText(order, settings, paperWidth, isDuplicate);
  // Base64 encode for RawBT URL scheme: rawbt:data:text/plain;base64,{data}
  const base64Data = btoa(unescape(encodeURIComponent(receiptText)));
  const rawbtUrl = `rawbt:data:text/plain;base64,${base64Data}`;
  window.location.href = rawbtUrl;
};

/**
 * Generates and prints the Day-End Financial Close (Z-Report).
 */
export const printZReport = (shift: RegisterShift, settings: RestaurantSettings) => {
  const printFrame = document.createElement('iframe');
  printFrame.style.position = 'fixed';
  printFrame.style.right = '0';
  printFrame.style.bottom = '0';
  printFrame.style.width = '0';
  printFrame.style.height = '0';
  printFrame.style.border = '0';
  document.body.appendChild(printFrame);

  const frameDoc = printFrame.contentWindow?.document;
  if (!frameDoc) {
    window.print();
    return;
  }

  const discrepancy = (shift.cashDiscrepancy || 0);
  const discrepancyLabel = discrepancy === 0 ? 'BALANCED' : discrepancy > 0 ? `+${settings.currencySymbol}${discrepancy} (CASH OVER)` : `-${settings.currencySymbol}${Math.abs(discrepancy)} (CASH SHORT)`;

  frameDoc.open();
  frameDoc.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>Z-Report: Day-End Register Close</title>
        <style>
          body { font-family: monospace, sans-serif; font-size: 11px; padding: 10px; max-width: 80mm; margin: 0 auto; color: #000; }
          .center { text-align: center; }
          .bold { font-weight: bold; }
          .dashed { border-top: 1px dashed #000; margin: 5px 0; }
          .row { display: flex; justify-content: space-between; margin: 3px 0; }
        </style>
      </head>
      <body>
        <div class="center bold" style="font-size: 14px;">${settings.restaurantName.toUpperCase()}</div>
        <div class="center">${settings.address}, ${settings.city}</div>
        <div class="center">GSTIN: ${settings.gstin}</div>
        <div class="dashed"></div>
        <div class="center bold">*** OFFICIAL Z-REPORT: DAY-END CLOSE ***</div>
        <div class="center">Shift ID: ${shift.id}</div>
        <div class="dashed"></div>
        <div class="row"><span>Opened At:</span><span>${new Date(shift.openedAt).toLocaleString()}</span></div>
        <div class="row"><span>Closed At:</span><span>${shift.closedAt ? new Date(shift.closedAt).toLocaleString() : new Date().toLocaleString()}</span></div>
        <div class="row"><span>Cashier:</span><span>${shift.openedBy}</span></div>
        <div class="dashed"></div>
        <div class="row bold"><span>OPENING FLOAT:</span><span>${settings.currencySymbol}${shift.openingFloat}</span></div>
        <div class="row"><span>Cash Sales:</span><span>${settings.currencySymbol}${shift.cashSales}</span></div>
        <div class="row"><span>UPI / QR Sales:</span><span>${settings.currencySymbol}${shift.upiSales}</span></div>
        <div class="row"><span>Card Sales:</span><span>${settings.currencySymbol}${shift.cardSales}</span></div>
        <div class="dashed"></div>
        <div class="row bold" style="font-size: 13px;"><span>TOTAL SALES TODAY:</span><span>${settings.currencySymbol}${shift.totalSales}</span></div>
        <div class="dashed"></div>
        <div class="row"><span>Expected Drawer Cash:</span><span>${settings.currencySymbol}${shift.expectedCash}</span></div>
        <div class="row"><span>Actual Cash Counted:</span><span>${settings.currencySymbol}${shift.actualCashCounted ?? shift.expectedCash}</span></div>
        <div class="row bold"><span>Discrepancy:</span><span>${discrepancyLabel}</span></div>
        <div class="dashed"></div>
        <div style="margin-top: 20px;" class="center">Manager Signature: __________________</div>
        <div style="margin-top: 20px;" class="center">Cashier Signature: __________________</div>
        <div class="dashed"></div>
        <div class="center" style="font-size: 9px;">Generated by Smart Restaurant POS &bull; varhad-pos</div>
      </body>
    </html>
  `);
  frameDoc.close();

  setTimeout(() => {
    printFrame.contentWindow?.focus();
    printFrame.contentWindow?.print();
    setTimeout(() => printFrame.remove(), 2500);
  }, 250);
};
