export type OrderStatus = 'received' | 'in_kitchen' | 'ready' | 'served' | 'billed' | 'completed' | 'cancelled';
export type ItemStatus = 'pending' | 'preparing' | 'ready' | 'served';
export type TableStatus = 'available' | 'occupied' | 'reserved' | 'billing' | 'cleaning';
export type TableSection = 'AC Dining Hall' | 'Royal Courtyard' | 'Rooftop Lounge' | 'Family Cabana';

export interface MenuItem {
  id: string;
  name: string;
  localName: string; // Marathi/Hindi local name
  category: 'Varhadi Specials' | 'Saoji Treats' | 'Starters' | 'Main Course' | 'Breads & Rice' | 'Amravati Sweets' | 'Beverages';
  description: string;
  price: number;
  isVeg: boolean;
  isSpicy?: boolean;
  spiceLevel?: 1 | 2 | 3;
  inventoryItemId: string;
  prepTimeMinutes: number;
  image: string;
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
  itemsAssigned?: string[]; // Item names or IDs
}

export interface SplitPaymentInfo {
  mode: 'equal' | 'by_item' | 'custom_amount';
  totalAmount: number;
  shares: SplitShare[];
}

export interface Order {
  id: string;
  orderNumber: string; // e.g. AMR-104
  tableId: string;
  tableNumber: number;
  section: TableSection;
  items: OrderItem[];
  subtotal: number;
  cgst: number; // 2.5%
  sgst: number; // 2.5%
  totalAmount: number;
  status: OrderStatus;
  paymentStatus: 'unpaid' | 'partially_paid' | 'paid';
  createdAt: string;
  estimatedPrepMinutes: number;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  waiterNotes?: string;
  splitPayment?: SplitPaymentInfo;
  invoiceGenerated?: boolean;
  invoiceNumber?: string;
  isOfflineCreated?: boolean;
  syncedAt?: string;
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
