export type OrderStatus = 'received' | 'in_kitchen' | 'ready' | 'served' | 'billed' | 'completed' | 'cancelled';
export type ItemStatus = 'pending' | 'preparing' | 'ready' | 'served';
export type TableStatus = 'available' | 'occupied' | 'reserved' | 'billing' | 'cleaning';
export type TableSection = 'AC Dining Hall' | 'Royal Courtyard' | 'Rooftop Lounge' | 'Family Cabana';

// Phase 1: Security & Staff Roles
export type StaffRole = 'waiter' | 'kitchen' | 'cashier' | 'admin';

export interface StaffUser {
  id: string;
  name: string;
  role: StaffRole;
  pin: string; // 4-digit PIN
  phone?: string;
  active: boolean;
}

// Phase 2: Fraud Prevention & Audit Trail
export interface AuditLog {
  id: string;
  timestamp: string;
  staffName: string;
  staffRole: StaffRole;
  action: 'ORDER_VOID' | 'DISCOUNT_APPLIED' | 'BILL_REPRINT' | 'PRICE_MODIFIED' | 'MENU_IMPORTED' | 'REGISTER_CLOSE' | 'DRAWER_OPEN';
  details: string;
  orderId?: string;
  amount?: number;
  managerAuthorizedBy?: string;
  reason?: string;
}

// Phase 3: Shift Management & Cash Reconciliation
export interface RegisterShift {
  id: string;
  openedAt: string;
  closedAt?: string;
  openedBy: string;
  closedBy?: string;
  openingFloat: number; // Cash in drawer at start
  cashSales: number;
  upiSales: number;
  cardSales: number;
  totalSales: number;
  expectedCash: number; // openingFloat + cashSales
  actualCashCounted?: number;
  cashDiscrepancy?: number; // actualCashCounted - expectedCash (over/short)
  status: 'open' | 'closed';
  notes?: string;
}

// Phase 4: Multi-Tenant Architecture
export interface RestaurantTenant {
  tenantId: string;
  name: string;
  city: string;
  address: string;
  phone: string;
  email?: string;
  gstin: string;
  fssaiNumber: string;
  currencySymbol: string;
  createdAt: string;
  isDefault?: boolean;
}

// Phase 5: Hardware & Thermal Printing
export interface ThermalPrinterConfig {
  paperWidth: '58mm' | '80mm'; // 58mm (32 chars) or 80mm (48 chars)
  autoCut: boolean;
  printCopies: number;
  openCashDrawer: boolean;
  bluetoothDeviceName?: string;
  useRawBTIntent: boolean; // Android RawBT thermal print service
}

// Phase 6: Commercial SaaS Subscription
export interface SubscriptionLicense {
  plan: 'Trial (14 Days)' | 'Starter POS (₹899/mo)' | 'Pro Cloud Multi-Device (₹1,499/mo)' | 'Enterprise Chain (₹3,999/mo)';
  status: 'trial' | 'active' | 'expired';
  validUntil: string;
  licenseKey: string;
  restaurantId: string;
  maxStaffSeats: number;
  cloudSyncEnabled: boolean;
  registeredTo: string;
}

export interface MenuItem {
  id: string;
  name: string;
  localName: string;
  category: 'Varhadi Specials' | 'Saoji Treats' | 'Starters' | 'Main Course' | 'Breads & Rice' | 'Amravati Sweets' | 'Beverages';
  description: string;
  price: number;
  isVeg: boolean;
  isSpicy?: boolean;
  spiceLevel?: 1 | 2 | 3;
  inventoryItemId: string;
  recipeDeduction?: {
    inventoryItemId: string;
    amount: number;
  };
  prepTimeMinutes: number;
  image?: string;
  station: 'Curry & Saoji Station' | 'Tandoor & Breads' | 'Rice & Starters' | 'Dessert & Bar';
  isAmravatiSpecial?: boolean;
  calories?: number;
  tags?: string[];
}

export interface InventoryItem {
  id: string;
  name: string;
  localUnit: string;
  inStock: number;
  minThreshold: number;
  costPerUnit: number;
  dishesLinked: string[];
}

export interface OrderItem {
  menuItemId: string;
  name: string;
  localName: string;
  price: number;
  quantity: number;
  specialInstructions?: string;
  status: ItemStatus;
  station: string;
}

export interface SplitShare {
  id: string;
  personName: string;
  amount: number;
  isPaid: boolean;
  paymentMethod?: 'upi' | 'card' | 'cash' | 'netbanking';
  transactionRef?: string;
  paidAt?: string;
  itemsAssigned?: string[];
}

export interface SplitPaymentInfo {
  mode: 'equal' | 'by_item' | 'custom_amount';
  totalAmount: number;
  shares: SplitShare[];
}

export interface Order {
  id: string;
  orderNumber: string;
  tableId: string;
  tableNumber: number;
  section: TableSection;
  items: OrderItem[];
  subtotal: number;
  cgst: number;
  sgst: number;
  serviceCharge?: number;
  totalAmount: number;
  status: OrderStatus;
  paymentStatus: 'unpaid' | 'partially_paid' | 'paid';
  createdAt: string;
  estimatedPrepMinutes: number;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  waiterNotes?: string;
  paymentMethod?: 'upi' | 'card' | 'cash' | 'netbanking';
  paidAt?: string;
  splitPayment?: SplitPaymentInfo;
  invoiceGenerated?: boolean;
  invoiceNumber?: string;
  isOfflineCreated?: boolean;
  syncedAt?: string;
  syncedToCloud?: boolean;
  printCount?: number; // Tracks re-prints for audit log
  voidReason?: string;
  voidedBy?: string;
  tenantId?: string; // Multi-tenant isolation
}

export interface RestaurantTable {
  id: string;
  number: number;
  section: TableSection;
  capacity: number;
  status: TableStatus;
  currentOrderId?: string;
  currentGuestName?: string;
  waiterAssigned?: string;
  reservationTime?: string;
}

export interface TableBooking {
  id: string;
  bookingRef: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  guests: number;
  date: string;
  timeSlot: string;
  tableId: string;
  tableNumber: number;
  section: TableSection;
  specialRequests?: string;
  status: 'confirmed' | 'seated' | 'cancelled';
  createdAt: string;
}

export interface WaiterCall {
  id: string;
  tableNumber: number;
  type: 'water' | 'service' | 'bill' | 'cleaning';
  timestamp: string;
  status: 'pending' | 'resolved';
}

export interface PushNotificationMessage {
  id: string;
  title: string;
  body: string;
  timestamp: string;
  type: 'order' | 'kitchen' | 'payment' | 'table';
  read: boolean;
}

export interface RestaurantSettings {
  restaurantName: string;
  tagline: string;
  address: string;
  city: string;
  state: string;
  phone: string;
  email: string;
  gstin: string;
  fssaiNumber: string;
  cgstRate: number;
  sgstRate: number;
  serviceChargeRate: number;
  currencySymbol: string;
  tenantId?: string;
  merchantUpiId?: string;
}

export interface ClientOnboardingOptions {
  restaurantName: string;
  tagline?: string;
  address: string;
  city: string;
  state?: string;
  phone: string;
  email?: string;
  gstin?: string;
  fssaiNumber?: string;
  merchantUpiId?: string;
  currencySymbol?: string;
  cgstRate?: number;
  sgstRate?: number;
  serviceChargeRate?: number;
  tableCount: number;
  openingFloat: number;
  menuPreset: 'keep' | 'clean' | 'amravati' | 'cafe_fastfood';
}

export interface FirebaseConfigData {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket?: string;
  messagingSenderId?: string;
  appId?: string;
  channelId?: string;
}
