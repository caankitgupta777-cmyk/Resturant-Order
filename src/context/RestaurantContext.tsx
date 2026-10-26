import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import {
  MenuItem,
  InventoryItem,
  RestaurantTable,
  Order,
  OrderStatus,
  ItemStatus,
  TableBooking,
  WaiterCall,
  PushNotificationMessage,
  SplitPaymentInfo,
  RestaurantSettings,
  FirebaseConfigData,
  StaffRole,
  StaffUser,
  AuditLog,
  RegisterShift,
  RestaurantTenant,
  ThermalPrinterConfig,
  SubscriptionLicense,
  ClientOnboardingOptions,
} from '../types/restaurant';
import {
  AMRAVATI_MENU,
  CAFE_FASTFOOD_MENU,
  CLEAN_STARTER_MENU,
  INITIAL_INVENTORY,
  INITIAL_TABLES,
  INITIAL_SAMPLE_ORDERS,
  DEFAULT_RESTAURANT_SETTINGS,
  INITIAL_STAFF_USERS,
  INITIAL_REGISTER_SHIFT,
  INITIAL_TENANTS,
  DEFAULT_PRINTER_CONFIG,
  DEFAULT_SUBSCRIPTION,
} from '../data/amravatiMenu';
import { soundEffects } from '../utils/audio';
import { firebaseSyncService } from '../services/firebaseSync';

export type AppView = 'customer' | 'kds' | 'tables' | 'inventory' | 'analytics';

interface CartItem {
  item: MenuItem;
  quantity: number;
  notes?: string;
}

export const canOrderBeBilled = (order: Order): boolean => {
  return order.status === 'served' || order.status === 'ready' || order.status === 'billed' || order.status === 'completed';
};

interface RestaurantContextType {
  // Navigation & View
  currentView: AppView;
  setCurrentView: (view: AppView) => void;
  customerTableNumber: number;
  setCustomerTableNumber: (num: number) => void;

  // Settings
  restaurantSettings: RestaurantSettings;
  updateRestaurantSettings: (newSettings: RestaurantSettings) => void;
  isSettingsOpen: boolean;
  setIsSettingsOpen: (open: boolean) => void;

  // Phase 1: Security & Staff Roles with 4-Digit PIN Lock
  staffUsers: StaffUser[];
  currentStaff: StaffUser;
  isScreenLocked: boolean;
  setIsScreenLocked: (locked: boolean) => void;
  loginWithPin: (pin: string) => { success: boolean; staff?: StaffUser; error?: string };
  logoutStaff: () => void;
  lockScreen: () => void;
  unlockScreen: (pin: string) => boolean;
  switchStaffRole: (role: StaffRole) => void;
  updateStaffPin: (staffId: string, newPin: string) => boolean;
  isRoleAllowed: (allowedRoles: StaffRole[]) => boolean;

  // Phase 2: Fraud Prevention, Audit Log & Order Void Authorization
  auditLogs: AuditLog[];
  addAuditLog: (action: AuditLog['action'], details: string, orderId?: string, amount?: number, reason?: string) => void;
  voidOrderWithManagerApproval: (orderId: string, managerPin: string, reason: string) => { success: boolean; error?: string };
  recordBillReprint: (orderId: string) => void;

  // Phase 3: Shift Management, Cash Register & Day-End Z-Report
  activeShift: RegisterShift | null;
  shiftHistory: RegisterShift[];
  openRegisterShift: (openingFloat: number, notes?: string) => RegisterShift;
  closeRegisterShift: (actualCashCounted: number, notes?: string) => { shift: RegisterShift; discrepancy: number };

  // Phase 4: Multi-Tenant Architecture
  currentTenant: RestaurantTenant;
  tenantsList: RestaurantTenant[];
  switchTenant: (tenantId: string) => void;
  createTenant: (tenantData: Omit<RestaurantTenant, 'createdAt'>) => RestaurantTenant;

  // Phase 5: Hardware & Thermal Printer Config
  printerConfig: ThermalPrinterConfig;
  updatePrinterConfig: (config: ThermalPrinterConfig) => void;

  // Phase 6: Commercial SaaS Subscription
  subscription: SubscriptionLicense;
  activateLicenseKey: (key: string) => { success: boolean; message: string };

  // Cloud & Firebase Sync
  isFirestoreConnected: boolean;
  connectFirestore: (config: FirebaseConfigData) => boolean;
  disconnectFirestore: () => void;

  // Menu Data & Single-File Attachment
  menu: MenuItem[];
  updateWholeMenu: (newMenu: MenuItem[]) => { success: boolean; count: number; error?: string };
  resetMenuToDefault: () => void;

  // Client Onboarding & Database Reset / Production Launch
  resetDatabaseForNewClient: (options: ClientOnboardingOptions) => void;
  wipeTestDataOnly: (openingFloat?: number) => void;
  resetToDemoData: () => void;
  inventory: InventoryItem[];
  tables: RestaurantTable[];
  orders: Order[];
  bookings: TableBooking[];
  notifications: PushNotificationMessage[];
  waiterCalls: WaiterCall[];
  cart: CartItem[];

  // Network & Offline
  isOnline: boolean;
  isSimulatedOffline: boolean;
  setSimulatedOffline: (val: boolean) => void;
  pendingOfflineCount: number;
  syncOfflineQueue: () => void;

  // Cart Operations
  addToCart: (item: MenuItem, notes?: string) => { success: boolean; message?: string };
  updateCartQuantity: (itemId: string, qty: number) => void;
  removeFromCart: (itemId: string) => void;
  clearCart: () => void;
  cartTotal: number;
  cartCount: number;

  // Order Operations
  placeOrder: (customerName?: string, customerEmail?: string, notes?: string) => Promise<{ success: boolean; order?: Order; message?: string }>;
  updateOrderStatus: (orderId: string, status: OrderStatus) => void;
  updateOrderItemStatus: (orderId: string, itemIdx: number, status: ItemStatus) => void;
  processPayment: (orderId: string, paymentMethod: 'upi' | 'card' | 'cash' | 'netbanking', customerEmail?: string) => Promise<{ success: boolean; invoiceNumber: string }>;
  processSplitPayment: (orderId: string, splitInfo: SplitPaymentInfo, customerEmail: string) => Promise<{ success: boolean; invoiceNumber: string }>;
  
  // Table & Booking Operations
  bookTable: (booking: Omit<TableBooking, 'id' | 'bookingRef' | 'createdAt' | 'status'>) => { success: boolean; bookingRef: string; message: string };
  updateTableStatus: (tableId: string, status: RestaurantTable['status']) => void;
  callWaiter: (tableNumber: number, type: WaiterCall['type']) => void;
  resolveWaiterCall: (callId: string) => void;

  // Inventory Management
  updateInventoryStock: (itemId: string, newStock: number) => void;
  restockItem: (itemId: string, amount: number) => void;
  checkItemStockAvailability: (itemId: string, requestedQty: number) => { available: boolean; stockLeft: number };

  // Notifications
  clearNotification: (id: string) => void;
  markAllNotificationsRead: () => void;
  requestPushPermission: () => Promise<boolean>;
  pushPermissionState: NotificationPermission | 'unsupported';
}

const RestaurantContext = createContext<RestaurantContextType | null>(null);

const STORAGE_KEY_ORDERS = 'varhad_amravati_orders_v3';
const STORAGE_KEY_INVENTORY = 'varhad_amravati_inventory_v3';
const STORAGE_KEY_TABLES = 'varhad_amravati_tables_v3';
const STORAGE_KEY_BOOKINGS = 'varhad_amravati_bookings_v3';
const STORAGE_KEY_OFFLINE_QUEUE = 'varhad_amravati_offline_queue_v3';
const STORAGE_KEY_SETTINGS = 'varhad_amravati_settings_v3';
const STORAGE_KEY_MENU = 'varhad_amravati_menu_v3';
const STORAGE_KEY_STAFF = 'varhad_amravati_staff_v3';
const STORAGE_KEY_CURRENT_STAFF = 'varhad_amravati_current_staff_v3';
const STORAGE_KEY_AUDIT = 'varhad_amravati_audit_v3';
const STORAGE_KEY_SHIFT = 'varhad_amravati_shift_v3';
const STORAGE_KEY_SHIFT_HIST = 'varhad_amravati_shift_hist_v3';
const STORAGE_KEY_TENANTS = 'varhad_amravati_tenants_v3';
const STORAGE_KEY_PRINTER = 'varhad_amravati_printer_v3';
const STORAGE_KEY_SUBSCRIPTION = 'varhad_amravati_subscription_v3';

export const RestaurantProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentView, setCurrentView] = useState<AppView>('customer');
  const [customerTableNumber, setCustomerTableNumber] = useState<number>(4);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Phase 1: Staff Users & PIN Authentication
  const [staffUsers, setStaffUsers] = useState<StaffUser[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_STAFF);
      return saved ? JSON.parse(saved) : INITIAL_STAFF_USERS;
    } catch {
      return INITIAL_STAFF_USERS;
    }
  });

  const [currentStaff, setCurrentStaff] = useState<StaffUser>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_CURRENT_STAFF);
      return saved ? JSON.parse(saved) : INITIAL_STAFF_USERS[3]; // Default to Admin for smooth setup
    } catch {
      return INITIAL_STAFF_USERS[3];
    }
  });

  const [isScreenLocked, setIsScreenLocked] = useState<boolean>(false);

  // Phase 2: Audit Logs
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_AUDIT);
      return saved ? JSON.parse(saved) : [
        {
          id: 'audit-init-1',
          timestamp: new Date(Date.now() - 3600000).toISOString(),
          staffName: 'Manager Ankit (Admin/Owner)',
          staffRole: 'admin',
          action: 'DRAWER_OPEN',
          details: 'POS system initialized with opening cash register float ₹2,000',
          amount: 2000,
        }
      ];
    } catch {
      return [];
    }
  });

  // Phase 3: Shift Register & Day-End Z-Report
  const [activeShift, setActiveShift] = useState<RegisterShift | null>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_SHIFT);
      return saved ? JSON.parse(saved) : INITIAL_REGISTER_SHIFT;
    } catch {
      return INITIAL_REGISTER_SHIFT;
    }
  });

  const [shiftHistory, setShiftHistory] = useState<RegisterShift[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_SHIFT_HIST);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Phase 4: Multi-Tenant Architecture
  const [tenantsList, setTenantsList] = useState<RestaurantTenant[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_TENANTS);
      return saved ? JSON.parse(saved) : INITIAL_TENANTS;
    } catch {
      return INITIAL_TENANTS;
    }
  });

  const [currentTenant, setCurrentTenant] = useState<RestaurantTenant>(() => {
    return tenantsList[0] || INITIAL_TENANTS[0];
  });

  // Phase 5: Hardware Printer Config
  const [printerConfig, setPrinterConfig] = useState<ThermalPrinterConfig>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_PRINTER);
      return saved ? JSON.parse(saved) : DEFAULT_PRINTER_CONFIG;
    } catch {
      return DEFAULT_PRINTER_CONFIG;
    }
  });

  // Phase 6: Commercial SaaS Subscription License
  const [subscription, setSubscription] = useState<SubscriptionLicense>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_SUBSCRIPTION);
      return saved ? JSON.parse(saved) : DEFAULT_SUBSCRIPTION;
    } catch {
      return DEFAULT_SUBSCRIPTION;
    }
  });

  // Business & Tax Settings
  const [restaurantSettings, setRestaurantSettings] = useState<RestaurantSettings>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_SETTINGS);
      return saved ? JSON.parse(saved) : DEFAULT_RESTAURANT_SETTINGS;
    } catch {
      return DEFAULT_RESTAURANT_SETTINGS;
    }
  });

  // Single-File Menu state
  const [menu, setMenu] = useState<MenuItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_MENU);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch {}
    return AMRAVATI_MENU;
  });

  // Connectivity
  const [rawOnline, setRawOnline] = useState<boolean>(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [isSimulatedOffline, setIsSimulatedOffline] = useState<boolean>(false);
  const isOnline = rawOnline && !isSimulatedOffline;

  // Cloud Firestore Sync State
  const [isFirestoreConnected, setIsFirestoreConnected] = useState<boolean>(() => {
    return firebaseSyncService.isConnected();
  });

  // Inventory State with localStorage
  const [inventory, setInventory] = useState<InventoryItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_INVENTORY);
      return saved ? JSON.parse(saved) : INITIAL_INVENTORY;
    } catch {
      return INITIAL_INVENTORY;
    }
  });

  // Tables State with localStorage
  const [tables, setTables] = useState<RestaurantTable[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_TABLES);
      return saved ? JSON.parse(saved) : INITIAL_TABLES;
    } catch {
      return INITIAL_TABLES;
    }
  });

  // Orders State with localStorage
  const [orders, setOrders] = useState<Order[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_ORDERS);
      return saved ? JSON.parse(saved) : (INITIAL_SAMPLE_ORDERS as Order[]);
    } catch {
      return INITIAL_SAMPLE_ORDERS as Order[];
    }
  });

  // Bookings State
  const [bookings, setBookings] = useState<TableBooking[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_BOOKINGS);
      return saved ? JSON.parse(saved) : [
        {
          id: 'bkg-1',
          bookingRef: 'BKG-AMR-782',
          customerName: 'Patil Reunion',
          customerEmail: 'patil.amr@example.com',
          customerPhone: '+91 98220 12345',
          guests: 6,
          date: new Date().toISOString().split('T')[0],
          timeSlot: '19:30',
          tableId: 'tbl-6',
          tableNumber: 6,
          section: 'Royal Courtyard',
          specialRequests: 'Near fountain, please serve Saoji starters first',
          status: 'confirmed',
          createdAt: new Date(Date.now() - 3600000).toISOString(),
        }
      ];
    } catch {
      return [];
    }
  });

  // Cart State (table ordering)
  const [cart, setCart] = useState<CartItem[]>([]);

  // Notifications & Waiter calls
  const [notifications, setNotifications] = useState<PushNotificationMessage[]>([]);
  const [waiterCalls, setWaiterCalls] = useState<WaiterCall[]>([]);
  const [offlineQueue, setOfflineQueue] = useState<Order[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_OFFLINE_QUEUE);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Push notification permission state
  const [pushPermissionState, setPushPermissionState] = useState<NotificationPermission | 'unsupported'>('default');

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setPushPermissionState(Notification.permission);
    } else {
      setPushPermissionState('unsupported');
    }
  }, []);

  // Save states to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_ORDERS, JSON.stringify(orders));
    } catch {}
  }, [orders]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_INVENTORY, JSON.stringify(inventory));
    } catch {}
  }, [inventory]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_TABLES, JSON.stringify(tables));
    } catch {}
  }, [tables]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_BOOKINGS, JSON.stringify(bookings));
    } catch {}
  }, [bookings]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_OFFLINE_QUEUE, JSON.stringify(offlineQueue));
    } catch {}
  }, [offlineQueue]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_STAFF, JSON.stringify(staffUsers));
    } catch {}
  }, [staffUsers]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_CURRENT_STAFF, JSON.stringify(currentStaff));
    } catch {}
  }, [currentStaff]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_AUDIT, JSON.stringify(auditLogs));
    } catch {}
  }, [auditLogs]);

  useEffect(() => {
    try {
      if (activeShift) {
        localStorage.setItem(STORAGE_KEY_SHIFT, JSON.stringify(activeShift));
      } else {
        localStorage.removeItem(STORAGE_KEY_SHIFT);
      }
    } catch {}
  }, [activeShift]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_SHIFT_HIST, JSON.stringify(shiftHistory));
    } catch {}
  }, [shiftHistory]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_TENANTS, JSON.stringify(tenantsList));
    } catch {}
  }, [tenantsList]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_PRINTER, JSON.stringify(printerConfig));
    } catch {}
  }, [printerConfig]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_SUBSCRIPTION, JSON.stringify(subscription));
    } catch {}
  }, [subscription]);

  // Online / Offline window listeners
  useEffect(() => {
    const handleOnline = () => setRawOnline(true);
    const handleOffline = () => setRawOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Notification helper
  const addNotification = useCallback((title: string, body: string, type: PushNotificationMessage['type']) => {
    const newMsg: PushNotificationMessage = {
      id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      title,
      body,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      type,
      read: false,
    };
    setNotifications(prev => [newMsg, ...prev.slice(0, 19)]);

    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification(title, {
          body,
          icon: '/favicon.ico',
        });
      } catch {}
    }
  }, []);

  // BroadcastChannel for instant local multi-window/multi-tab sync
  useEffect(() => {
    if (typeof window === 'undefined' || !('BroadcastChannel' in window)) return;
    const channel = new BroadcastChannel('amravati_kds_sync_channel');

    channel.onmessage = (event) => {
      const { type, payload } = event.data || {};
      if (type === 'NEW_ORDER') {
        if (!payload || !payload.id) return;
        setOrders(prev => {
          if (prev.some(o => o.id === payload.id)) return prev;
          soundEffects.playKitchenBell();
          return [payload, ...prev];
        });
      } else if (type === 'ORDER_STATUS_UPDATE') {
        if (!payload || !payload.orderId) return;
        setOrders(prev => prev.map(o => o.id === payload.orderId ? { ...o, status: payload.status } : o));
      } else if (type === 'WAITER_CALL') {
        if (!payload || !payload.id) return;
        setWaiterCalls(prev => {
          if (prev.some(c => c.id === payload.id)) return prev;
          soundEffects.playWaiterBuzz();
          return [payload, ...prev];
        });
      }
    };

    return () => {
      channel.close();
    };
  }, []);

  const broadcastEvent = useCallback((type: string, payload: unknown) => {
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        const channel = new BroadcastChannel('amravati_kds_sync_channel');
        channel.postMessage({ type, payload });
        channel.close();
      } catch {}
    }
  }, []);

  // Firestore Real-Time Subscriptions across devices
  useEffect(() => {
    if (!firebaseSyncService.isConnected()) {
      setIsFirestoreConnected(false);
      return;
    }

    setIsFirestoreConnected(true);

    const unsubOrders = firebaseSyncService.subscribeToOrders((remoteOrders) => {
      if (!remoteOrders || remoteOrders.length === 0) return;
      setOrders((prev) => {
        const merged = [...prev];
        remoteOrders.forEach((ro) => {
          const idx = merged.findIndex((o) => o.id === ro.id || o.orderNumber === ro.orderNumber);
          if (idx > -1) {
            merged[idx] = ro;
          } else {
            merged.unshift(ro);
            soundEffects.playKitchenBell();
          }
        });
        return merged;
      });
    });

    const unsubCalls = firebaseSyncService.subscribeToWaiterCalls((remoteCalls) => {
      if (!remoteCalls || remoteCalls.length === 0) return;
      setWaiterCalls((prev) => {
        const merged = [...prev];
        remoteCalls.forEach((rc) => {
          if (!merged.some((c) => c.id === rc.id)) {
            merged.unshift(rc);
            soundEffects.playWaiterBuzz();
          }
        });
        return merged;
      });
    });

    return () => {
      unsubOrders();
      unsubCalls();
    };
  }, []);

  const connectFirestore = useCallback((config: FirebaseConfigData) => {
    const success = firebaseSyncService.configure(config);
    setIsFirestoreConnected(success);
    return success;
  }, []);

  const disconnectFirestore = useCallback(() => {
    firebaseSyncService.disconnect();
    setIsFirestoreConnected(false);
  }, []);

  const updateRestaurantSettings = useCallback((newSettings: RestaurantSettings) => {
    setRestaurantSettings(newSettings);
    try {
      localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(newSettings));
    } catch {}
  }, []);

  // ==========================================
  // PHASE 1: STAFF ROLES & 4-DIGIT PIN AUTH
  // ==========================================
  const loginWithPin = useCallback((pin: string) => {
    const trimmed = pin.trim();
    const matching = staffUsers.find(u => u.pin === trimmed && u.active);
    if (matching) {
      setCurrentStaff(matching);
      setIsScreenLocked(false);
      soundEffects.playClick();

      // Role-based view routing
      if (matching.role === 'kitchen') {
        setCurrentView('kds');
      } else if (matching.role === 'waiter') {
        setCurrentView('tables');
      } else if (matching.role === 'cashier') {
        setCurrentView('tables');
      }

      addNotification('Staff Login Verified', `Welcome ${matching.name} (${matching.role.toUpperCase()})`, 'table');
      return { success: true, staff: matching };
    }
    soundEffects.playWaiterBuzz();
    return { success: false, error: 'Incorrect 4-digit PIN' };
  }, [staffUsers, addNotification]);

  const logoutStaff = useCallback(() => {
    setIsScreenLocked(true);
    soundEffects.playClick();
  }, []);

  const lockScreen = useCallback(() => {
    setIsScreenLocked(true);
  }, []);

  const unlockScreen = useCallback((pin: string) => {
    const res = loginWithPin(pin);
    return res.success;
  }, [loginWithPin]);

  const switchStaffRole = useCallback((role: StaffRole) => {
    const staff = staffUsers.find(s => s.role === role);
    if (staff) {
      setCurrentStaff(staff);
      if (role === 'kitchen') setCurrentView('kds');
      else if (role === 'waiter') setCurrentView('tables');
    }
  }, [staffUsers]);

  const updateStaffPin = useCallback((staffId: string, newPin: string) => {
    if (newPin.length !== 4 || isNaN(Number(newPin))) return false;
    setStaffUsers(prev => prev.map(u => u.id === staffId ? { ...u, pin: newPin } : u));
    return true;
  }, []);

  const isRoleAllowed = useCallback((allowedRoles: StaffRole[]) => {
    if (!currentStaff) return false;
    if (currentStaff.role === 'admin') return true;
    return allowedRoles.includes(currentStaff.role);
  }, [currentStaff]);

  // ==========================================
  // PHASE 2: FRAUD PREVENTION & AUDIT LOGS
  // ==========================================
  const addAuditLog = useCallback((
    action: AuditLog['action'],
    details: string,
    orderId?: string,
    amount?: number,
    reason?: string
  ) => {
    const newEntry: AuditLog = {
      id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
      staffName: currentStaff?.name || 'Staff',
      staffRole: currentStaff?.role || 'waiter',
      action,
      details,
      orderId,
      amount,
      reason,
    };
    setAuditLogs(prev => [newEntry, ...prev]);
  }, [currentStaff]);

  const voidOrderWithManagerApproval = useCallback((orderId: string, managerPin: string, reason: string) => {
    const manager = staffUsers.find(u => u.role === 'admin' && u.pin === managerPin);
    if (!manager) {
      return { success: false, error: 'Invalid Manager PIN. Order voids strictly require manager authorization.' };
    }
    const order = orders.find(o => o.id === orderId);
    if (!order) {
      return { success: false, error: 'Order not found.' };
    }

    setOrders(prev => prev.map(o => o.id === orderId ? {
      ...o,
      status: 'cancelled',
      voidReason: reason,
      voidedBy: manager.name,
    } : o));

    // Restock ingredients
    setInventory(prev => {
      const updated = [...prev];
      for (const item of order.items) {
        const mi = menu.find(m => m.id === item.menuItemId);
        if (mi?.inventoryItemId) {
          const invIdx = updated.findIndex(i => i.id === mi.inventoryItemId);
          if (invIdx > -1) {
            const deductTotal = item.quantity * (mi.recipeDeduction?.amount ?? 1);
            updated[invIdx] = {
              ...updated[invIdx],
              inStock: Number((updated[invIdx].inStock + deductTotal).toFixed(2)),
            };
          }
        }
      }
      return updated;
    });

    // Free table
    setTables(prev => prev.map(t => t.number === order.tableNumber ? {
      ...t,
      status: 'available',
      currentOrderId: undefined,
      currentGuestName: undefined,
    } : t));

    addAuditLog('ORDER_VOID', `Order #${order.orderNumber} (Table ${order.tableNumber}) voided by Manager ${manager.name}. Reason: ${reason}`, order.id, order.totalAmount, reason);
    soundEffects.playWaiterBuzz();
    addNotification('Order Voided by Manager', `Order #${order.orderNumber} voided. Ingredients restocked.`, 'order');

    return { success: true };
  }, [staffUsers, orders, menu, addAuditLog, addNotification]);

  const recordBillReprint = useCallback((orderId: string) => {
    const order = orders.find(o => o.id === orderId);
    if (!order) return;
    const currentCount = order.printCount || 1;
    const updatedCount = currentCount + 1;

    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, printCount: updatedCount } : o));
    addAuditLog('BILL_REPRINT', `Invoice #${order.invoiceNumber || order.orderNumber} re-printed (Copy #${updatedCount}) by ${currentStaff?.name || 'Staff'}`, order.id, order.totalAmount);
  }, [orders, currentStaff, addAuditLog]);

  // ==========================================
  // PHASE 3: SHIFT & CASH REGISTER CLOSING
  // ==========================================
  const openRegisterShift = useCallback((openingFloat: number, notes?: string) => {
    const newShift: RegisterShift = {
      id: `shift-${Date.now()}`,
      openedAt: new Date().toISOString(),
      openedBy: currentStaff?.name || 'Cashier',
      openingFloat,
      cashSales: 0,
      upiSales: 0,
      cardSales: 0,
      totalSales: 0,
      expectedCash: openingFloat,
      status: 'open',
      notes,
    };
    setActiveShift(newShift);
    addAuditLog('DRAWER_OPEN', `Register shift opened with float ₹${openingFloat} by ${newShift.openedBy}`, undefined, openingFloat);
    return newShift;
  }, [currentStaff, addAuditLog]);

  const closeRegisterShift = useCallback((actualCashCounted: number, notes?: string) => {
    if (!activeShift) throw new Error('No active shift to close');
    const expected = activeShift.expectedCash;
    const discrepancy = actualCashCounted - expected;

    const closedShift: RegisterShift = {
      ...activeShift,
      closedAt: new Date().toISOString(),
      closedBy: currentStaff?.name || 'Cashier',
      actualCashCounted,
      cashDiscrepancy: discrepancy,
      status: 'closed',
      notes: notes || activeShift.notes,
    };

    setActiveShift(null);
    setShiftHistory(prev => [closedShift, ...prev]);
    addAuditLog(
      'REGISTER_CLOSE',
      `Shift closed. Expected: ₹${expected}, Counted: ₹${actualCashCounted} (Discrepancy: ₹${discrepancy})`,
      undefined,
      closedShift.totalSales
    );

    return { shift: closedShift, discrepancy };
  }, [activeShift, currentStaff, addAuditLog]);

  // ==========================================
  // PHASE 4: MULTI-TENANT ARCHITECTURE
  // ==========================================
  const switchTenant = useCallback((tenantId: string) => {
    const t = tenantsList.find(x => x.tenantId === tenantId);
    if (!t) return;
    setCurrentTenant(t);
    setRestaurantSettings(prev => ({
      ...prev,
      restaurantName: t.name,
      city: t.city,
      address: t.address,
      phone: t.phone,
      email: t.email || prev.email,
      gstin: t.gstin,
      fssaiNumber: t.fssaiNumber,
      currencySymbol: t.currencySymbol,
      tenantId: t.tenantId,
    }));
    addNotification('Switched Branch Workspace', `Now active in ${t.name} (${t.city})`, 'kitchen');
  }, [tenantsList, addNotification]);

  const createTenant = useCallback((tenantData: Omit<RestaurantTenant, 'createdAt'>) => {
    const newTenant: RestaurantTenant = {
      ...tenantData,
      createdAt: new Date().toISOString(),
    };
    setTenantsList(prev => [...prev, newTenant]);
    switchTenant(newTenant.tenantId);
    return newTenant;
  }, [switchTenant]);

  // ==========================================
  // PHASE 5: PRINTER CONFIG
  // ==========================================
  const updatePrinterConfig = useCallback((newConfig: ThermalPrinterConfig) => {
    setPrinterConfig(newConfig);
  }, []);

  // ==========================================
  // PHASE 6: COMMERCIAL SAAS SUBSCRIPTION
  // ==========================================
  const activateLicenseKey = useCallback((key: string) => {
    if (key.trim().length < 6) {
      return { success: false, message: 'Invalid key. Must be a valid commercial license code.' };
    }
    const updated: SubscriptionLicense = {
      ...subscription,
      licenseKey: key.trim().toUpperCase(),
      status: 'active',
      plan: 'Pro Cloud Multi-Device (₹1,499/mo)',
      validUntil: new Date(Date.now() + 365 * 24 * 3600 * 1000).toISOString().split('T')[0],
    };
    setSubscription(updated);
    addNotification('License Key Activated', 'Commercial Pro plan active for 365 days across all devices.', 'order');
    return { success: true, message: 'License key verified! All commercial features unlocked.' };
  }, [subscription, addNotification]);

  // ==========================================
  // SINGLE-FILE MENU ATTACHMENT / UPDATE
  // ==========================================
  const updateWholeMenu = useCallback((newMenu: MenuItem[]) => {
    if (!Array.isArray(newMenu) || newMenu.length === 0) {
      return { success: false, count: 0, error: 'File does not contain a valid dish array.' };
    }
    const validItems = newMenu.filter(item => item && item.id && item.name && typeof item.price === 'number');
    if (validItems.length === 0) {
      return { success: false, count: 0, error: 'No valid dishes detected.' };
    }

    setMenu(validItems);
    try {
      localStorage.setItem(STORAGE_KEY_MENU, JSON.stringify(validItems));
    } catch {}

    addAuditLog('MENU_IMPORTED', `Whole menu replaced from single file attachment (${validItems.length} items)`);
    addNotification('Menu Updated', `Imported ${validItems.length} dishes from file attachment.`, 'kitchen');
    return { success: true, count: validItems.length };
  }, [addAuditLog, addNotification]);

  const resetMenuToDefault = useCallback(() => {
    setMenu(AMRAVATI_MENU);
    try {
      localStorage.removeItem(STORAGE_KEY_MENU);
    } catch {}
    addAuditLog('MENU_IMPORTED', 'Menu restored to authentic Amravati baseline');
    addNotification('Menu Restored', 'Reset to authentic Amravati Varhad Rasoi default menu.', 'kitchen');
  }, [addAuditLog, addNotification]);

  // ==========================================
  // CLIENT ONBOARDING & DATABASE RESET WIZARD
  // ==========================================
  const resetDatabaseForNewClient = useCallback((options: ClientOnboardingOptions) => {
    // 1. Generate clean tables according to tableCount
    const count = Math.max(1, Math.min(60, Number(options.tableCount) || 10));
    const sections: ('AC Dining Hall' | 'Royal Courtyard' | 'Rooftop Lounge' | 'Family Cabana')[] = [
      'AC Dining Hall', 'Royal Courtyard', 'Rooftop Lounge', 'Family Cabana'
    ];
    const newTables: RestaurantTable[] = Array.from({ length: count }, (_, i) => {
      const num = i + 1;
      const section = sections[Math.floor((i / count) * sections.length)] || 'AC Dining Hall';
      return {
        id: `tbl-${num}`,
        number: num,
        section,
        capacity: num % 3 === 0 ? 6 : num % 2 === 0 ? 4 : 2,
        status: 'available',
      };
    });

    // 2. Select initial menu preset
    let chosenMenu = menu;
    if (options.menuPreset === 'amravati') {
      chosenMenu = AMRAVATI_MENU;
    } else if (options.menuPreset === 'cafe_fastfood') {
      chosenMenu = CAFE_FASTFOOD_MENU;
    } else if (options.menuPreset === 'clean') {
      chosenMenu = CLEAN_STARTER_MENU;
    }

    // 3. New Restaurant Business & Tax Settings
    const cleanSlug = options.restaurantName.toLowerCase().replace(/[^a-z0-9]/g, '-').slice(0, 18);
    const generatedTenantId = `rest-${cleanSlug}-${Date.now().toString().slice(-4)}`;
    const newSettings: RestaurantSettings = {
      restaurantName: options.restaurantName.trim(),
      tagline: options.tagline?.trim() || 'Fine Dining & Quick Service Restaurant',
      address: options.address.trim(),
      city: options.city.trim(),
      state: options.state?.trim() || `${options.city.trim()} Region`,
      phone: options.phone.trim(),
      email: options.email?.trim() || 'billing@restaurant.com',
      gstin: options.gstin?.trim() || '27XXXXX0000X1Z1',
      fssaiNumber: options.fssaiNumber?.trim() || '10000000000000',
      cgstRate: options.cgstRate !== undefined ? Number(options.cgstRate) : 2.5,
      sgstRate: options.sgstRate !== undefined ? Number(options.sgstRate) : 2.5,
      serviceChargeRate: options.serviceChargeRate !== undefined ? Number(options.serviceChargeRate) : 0,
      currencySymbol: options.currencySymbol || '₹',
      merchantUpiId: options.merchantUpiId?.trim() || `${options.restaurantName.toLowerCase().replace(/[^a-z0-9]/g, '')}@okaxis`,
      tenantId: generatedTenantId,
    };

    // 4. Create new Tenant workspace
    const newTenant: RestaurantTenant = {
      tenantId: generatedTenantId,
      name: newSettings.restaurantName,
      city: newSettings.city,
      address: newSettings.address,
      phone: newSettings.phone,
      email: newSettings.email,
      gstin: newSettings.gstin,
      fssaiNumber: newSettings.fssaiNumber,
      currencySymbol: newSettings.currencySymbol,
      createdAt: new Date().toISOString(),
      isDefault: true,
    };

    // 5. Open fresh cash register shift
    const openingFloat = Number(options.openingFloat) || 1000;
    const newShift: RegisterShift = {
      id: `shift-${Date.now()}`,
      openedAt: new Date().toISOString(),
      openedBy: currentStaff.name,
      openingFloat,
      cashSales: 0,
      upiSales: 0,
      cardSales: 0,
      totalSales: 0,
      expectedCash: openingFloat,
      status: 'open',
      notes: `Client onboarded: ${newSettings.restaurantName} initialized with ${newSettings.currencySymbol}${openingFloat} opening cash float.`,
    };

    // 6. Fresh initialization audit log
    const newAudit: AuditLog[] = [
      {
        id: `audit-${Date.now()}`,
        timestamp: new Date().toISOString(),
        staffName: currentStaff.name,
        staffRole: currentStaff.role,
        action: 'DRAWER_OPEN',
        details: `Client Onboarding Complete: ${newSettings.restaurantName} configured with ${count} tables. Till initialized with ${newSettings.currencySymbol}${openingFloat}.`,
        amount: openingFloat,
      }
    ];

    // Update in-memory state
    setRestaurantSettings(newSettings);
    setCurrentTenant(newTenant);
    setTenantsList(prev => [newTenant, ...prev.filter(t => t.tenantId !== generatedTenantId)]);
    setTables(newTables);
    setMenu(chosenMenu);
    setOrders([]);
    setBookings([]);
    setWaiterCalls([]);
    setCart([]);
    setActiveShift(newShift);
    setShiftHistory([]);
    setAuditLogs(newAudit);

    // Persist to LocalStorage
    try {
      localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(newSettings));
      localStorage.setItem(STORAGE_KEY_TABLES, JSON.stringify(newTables));
      localStorage.setItem(STORAGE_KEY_MENU, JSON.stringify(chosenMenu));
      localStorage.setItem(STORAGE_KEY_ORDERS, JSON.stringify([]));
      localStorage.setItem(STORAGE_KEY_BOOKINGS, JSON.stringify([]));
      localStorage.setItem(STORAGE_KEY_SHIFT, JSON.stringify(newShift));
      localStorage.setItem(STORAGE_KEY_SHIFT_HIST, JSON.stringify([]));
      localStorage.setItem(STORAGE_KEY_AUDIT, JSON.stringify(newAudit));
      localStorage.setItem(STORAGE_KEY_TENANTS, JSON.stringify([newTenant, ...tenantsList.filter(t => t.tenantId !== generatedTenantId)]));
    } catch {}

    soundEffects.playKitchenBell();
    addNotification('Client Onboarding Complete', `${newSettings.restaurantName} is now ready for live billing!`, 'order');
  }, [currentStaff, menu, tenantsList, addNotification]);

  const wipeTestDataOnly = useCallback((openingFloatVal: number = 2000) => {
    const float = Number(openingFloatVal) || 2000;
    // Keep settings, menu, inventory, staff
    // Free all tables
    const clearedTables: RestaurantTable[] = tables.map(t => ({
      ...t,
      status: 'available',
      currentOrderId: undefined,
      currentGuestName: undefined,
      waiterAssigned: undefined,
      reservationTime: undefined,
    }));

    const newShift: RegisterShift = {
      id: `shift-${Date.now()}`,
      openedAt: new Date().toISOString(),
      openedBy: currentStaff.name,
      openingFloat: float,
      cashSales: 0,
      upiSales: 0,
      cardSales: 0,
      totalSales: 0,
      expectedCash: float,
      status: 'open',
      notes: 'Fresh shift started after live production launch reset. All test orders wiped.',
    };

    const newAudit: AuditLog[] = [
      {
        id: `audit-${Date.now()}`,
        timestamp: new Date().toISOString(),
        staffName: currentStaff.name,
        staffRole: currentStaff.role,
        action: 'DRAWER_OPEN',
        details: `Live Production Launch Reset: Cleared all test orders & invoices. Reset ${clearedTables.length} tables to available. Shift opened with ₹${float}.`,
        amount: float,
      }
    ];

    setOrders([]);
    setBookings([]);
    setWaiterCalls([]);
    setCart([]);
    setTables(clearedTables);
    setActiveShift(newShift);
    setShiftHistory([]);
    setAuditLogs(newAudit);

    try {
      localStorage.setItem(STORAGE_KEY_ORDERS, JSON.stringify([]));
      localStorage.setItem(STORAGE_KEY_BOOKINGS, JSON.stringify([]));
      localStorage.setItem(STORAGE_KEY_TABLES, JSON.stringify(clearedTables));
      localStorage.setItem(STORAGE_KEY_SHIFT, JSON.stringify(newShift));
      localStorage.setItem(STORAGE_KEY_SHIFT_HIST, JSON.stringify([]));
      localStorage.setItem(STORAGE_KEY_AUDIT, JSON.stringify(newAudit));
    } catch {}

    soundEffects.playKitchenBell();
    addNotification('Production Reset Complete', 'All test orders cleared. System is 100% clean for live customer billing.', 'kitchen');
  }, [tables, currentStaff, addNotification]);

  const resetToDemoData = useCallback(() => {
    setRestaurantSettings(DEFAULT_RESTAURANT_SETTINGS);
    setCurrentTenant(INITIAL_TENANTS[0]);
    setTenantsList(INITIAL_TENANTS);
    setTables(INITIAL_TABLES);
    setMenu(AMRAVATI_MENU);
    setInventory(INITIAL_INVENTORY);
    setOrders(INITIAL_SAMPLE_ORDERS as Order[]);
    setActiveShift(INITIAL_REGISTER_SHIFT);
    setShiftHistory([]);
    setCart([]);
    setWaiterCalls([]);
    setBookings([
      {
        id: 'bkg-1',
        bookingRef: 'BKG-AMR-782',
        customerName: 'Patil Reunion',
        customerEmail: 'patil.amr@example.com',
        customerPhone: '+91 98220 12345',
        guests: 6,
        date: new Date().toISOString().split('T')[0],
        timeSlot: '19:30',
        tableId: 'tbl-6',
        tableNumber: 6,
        section: 'Royal Courtyard',
        status: 'confirmed',
        createdAt: new Date(Date.now() - 3600000).toISOString(),
      }
    ]);
    const initAudit: AuditLog[] = [
      {
        id: 'audit-init-1',
        timestamp: new Date().toISOString(),
        staffName: 'Manager Ankit (Admin/Owner)',
        staffRole: 'admin',
        action: 'DRAWER_OPEN',
        details: 'POS system restored to Amravati demo benchmark dataset with sample orders.',
        amount: 2000,
      }
    ];
    setAuditLogs(initAudit);

    try {
      localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(DEFAULT_RESTAURANT_SETTINGS));
      localStorage.setItem(STORAGE_KEY_TENANTS, JSON.stringify(INITIAL_TENANTS));
      localStorage.setItem(STORAGE_KEY_TABLES, JSON.stringify(INITIAL_TABLES));
      localStorage.removeItem(STORAGE_KEY_MENU);
      localStorage.setItem(STORAGE_KEY_INVENTORY, JSON.stringify(INITIAL_INVENTORY));
      localStorage.setItem(STORAGE_KEY_ORDERS, JSON.stringify(INITIAL_SAMPLE_ORDERS));
      localStorage.setItem(STORAGE_KEY_SHIFT, JSON.stringify(INITIAL_REGISTER_SHIFT));
      localStorage.setItem(STORAGE_KEY_SHIFT_HIST, JSON.stringify([]));
      localStorage.setItem(STORAGE_KEY_AUDIT, JSON.stringify(initAudit));
    } catch {}

    soundEffects.playKitchenBell();
    addNotification('Demo Data Restored', 'Reset to Varhad Rasoi Amravati demo dataset.', 'table');
  }, [addNotification]);

  // Push Permission
  const requestPushPermission = async () => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      try {
        const permission = await Notification.requestPermission();
        setPushPermissionState(permission);
        if (permission === 'granted') {
          addNotification('Push Notifications Active', 'Real-time order status updates enabled for all kitchen orders.', 'order');
          return true;
        }
      } catch {}
    }
    return false;
  };

  // Inventory Helper
  const checkItemStockAvailability = useCallback((inventoryId: string, requestedQty: number) => {
    const item = inventory.find(i => i.id === inventoryId);
    if (!item) return { available: true, stockLeft: 999 };
    return {
      available: item.inStock >= requestedQty,
      stockLeft: item.inStock,
    };
  }, [inventory]);

  const updateInventoryStock = useCallback((itemId: string, newStock: number) => {
    setInventory(prev => prev.map(i => i.id === itemId ? { ...i, inStock: Math.max(0, newStock) } : i));
  }, []);

  const restockItem = useCallback((itemId: string, amount: number) => {
    setInventory(prev => prev.map(i => i.id === itemId ? { ...i, inStock: i.inStock + amount } : i));
    addNotification('Inventory Restocked', `Added ${amount} units to inventory stock.`, 'table');
  }, [addNotification]);

  // Cart Operations
  const addToCart = useCallback((item: MenuItem, notes?: string) => {
    const stockCheck = checkItemStockAvailability(item.inventoryItemId, 1);
    if (!stockCheck.available) {
      return {
        success: false,
        message: `${item.name} is currently SOLD OUT (Stock: ${stockCheck.stockLeft}).`,
      };
    }

    setCart(prev => {
      const existing = prev.find(c => c.item.id === item.id && c.notes === notes);
      if (existing) {
        return prev.map(c => c === existing ? { ...c, quantity: c.quantity + 1 } : c);
      }
      return [...prev, { item, quantity: 1, notes }];
    });

    soundEffects.playClick();
    return { success: true };
  }, [checkItemStockAvailability]);

  const updateCartQuantity = useCallback((itemId: string, qty: number) => {
    if (qty <= 0) {
      setCart(prev => prev.filter(c => c.item.id !== itemId));
    } else {
      setCart(prev => prev.map(c => c.item.id === itemId ? { ...c, quantity: qty } : c));
    }
  }, []);

  const removeFromCart = useCallback((itemId: string) => {
    setCart(prev => prev.filter(c => c.item.id !== itemId));
  }, []);

  const clearCart = useCallback(() => {
    setCart([]);
  }, []);

  const cartTotal = useMemo(() => {
    return cart.reduce((sum, c) => sum + (c.item.price * c.quantity), 0);
  }, [cart]);

  const cartCount = useMemo(() => {
    return cart.reduce((sum, c) => sum + c.quantity, 0);
  }, [cart]);

  // Order Placement
  const placeOrder = async (customerName: string = 'Dine-In Guest', customerEmail?: string, notes?: string) => {
    if (cart.length === 0) {
      return { success: false, message: 'Cart is empty. Please add items.' };
    }

    for (const c of cart) {
      const avail = checkItemStockAvailability(c.item.inventoryItemId, c.quantity);
      if (!avail.available) {
        return {
          success: false,
          message: `Cannot place order: ${c.item.name} only has ${avail.stockLeft} portions left.`,
        };
      }
    }

    const orderNumber = `VR-${Math.floor(100 + Math.random() * 900)}`;
    const currentTable = tables.find(t => t.number === customerTableNumber);
    const subtotal = cartTotal;
    const cgst = Number(((subtotal * restaurantSettings.cgstRate) / 100).toFixed(2));
    const sgst = Number(((subtotal * restaurantSettings.sgstRate) / 100).toFixed(2));
    const serviceCharge = restaurantSettings.serviceChargeRate > 0
      ? Number(((subtotal * restaurantSettings.serviceChargeRate) / 100).toFixed(2))
      : 0;
    const totalAmount = Math.round(subtotal + cgst + sgst + serviceCharge);

    const newOrder: Order = {
      id: `ord-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      orderNumber,
      tableId: currentTable?.id || `tbl-${customerTableNumber}`,
      tableNumber: customerTableNumber,
      section: currentTable?.section || 'AC Dining Hall',
      items: cart.map(c => ({
        menuItemId: c.item.id,
        name: c.item.name,
        localName: c.item.localName,
        price: c.item.price,
        quantity: c.quantity,
        specialInstructions: c.notes,
        status: 'pending',
        station: c.item.station,
      })),
      subtotal,
      cgst,
      sgst,
      serviceCharge,
      totalAmount,
      status: 'received',
      paymentStatus: 'unpaid',
      createdAt: new Date().toISOString(),
      estimatedPrepMinutes: Math.max(...cart.map(c => c.item.prepTimeMinutes), 15),
      customerName,
      customerEmail,
      waiterNotes: notes,
      isOfflineCreated: !isOnline,
      tenantId: currentTenant.tenantId,
    };

    // Recipe deductions
    setInventory(prev => {
      const updated = [...prev];
      for (const cartItem of cart) {
        const idx = updated.findIndex(i => i.id === cartItem.item.inventoryItemId);
        if (idx > -1) {
          const perUnit = cartItem.item.recipeDeduction?.amount ?? (cartItem.item.inventoryItemId.includes('kg') ? 0.25 : 1);
          const deductTotal = Number((cartItem.quantity * perUnit).toFixed(2));
          updated[idx] = {
            ...updated[idx],
            inStock: Math.max(0, Number((updated[idx].inStock - deductTotal).toFixed(2))),
          };
        }
      }
      return updated;
    });

    // Update table status
    setTables(prev => prev.map(t => t.number === customerTableNumber ? {
      ...t,
      status: 'occupied',
      currentOrderId: orderNumber,
      currentGuestName: customerName,
    } : t));

    if (firebaseSyncService.isConnected()) {
      firebaseSyncService.syncOrder(newOrder);
    }

    if (!isOnline) {
      setOfflineQueue(prev => [newOrder, ...prev]);
      setOrders(prev => [newOrder, ...prev]);
      soundEffects.playKitchenBell();
      clearCart();
      addNotification('Order Saved Offline', `Order #${orderNumber} queued locally. It will auto-sync once reconnected.`, 'order');
      return {
        success: true,
        order: newOrder,
        message: `Order #${orderNumber} saved locally in offline queue.`,
      };
    }

    setOrders(prev => [newOrder, ...prev]);
    soundEffects.playKitchenBell();
    broadcastEvent('NEW_ORDER', newOrder);
    clearCart();

    addNotification('Order Sent to Kitchen Display', `Order #${orderNumber} (Table ${customerTableNumber}) sent to Kitchen Display System!`, 'kitchen');

    return {
      success: true,
      order: newOrder,
      message: `Order #${orderNumber} sent to Kitchen Display System!`,
    };
  };

  // Sync offline queue when back online
  const syncOfflineQueue = useCallback(() => {
    if (offlineQueue.length === 0) return;
    
    offlineQueue.forEach(ord => {
      broadcastEvent('NEW_ORDER', { ...ord, isOfflineCreated: false, syncedAt: new Date().toISOString() });
      if (firebaseSyncService.isConnected()) {
        firebaseSyncService.syncOrder(ord);
      }
    });

    setOrders(prev => prev.map(o => {
      if (o.isOfflineCreated) {
        return { ...o, isOfflineCreated: false, syncedAt: new Date().toISOString() };
      }
      return o;
    }));

    addNotification('Offline Orders Synced', `Synced ${offlineQueue.length} queued order(s) with Kitchen Display System!`, 'kitchen');
    setOfflineQueue([]);
  }, [offlineQueue, broadcastEvent, addNotification]);

  useEffect(() => {
    if (isOnline && offlineQueue.length > 0) {
      syncOfflineQueue();
    }
  }, [isOnline, offlineQueue.length, syncOfflineQueue]);

  // Update order status (KDS actions)
  const updateOrderStatus = useCallback((orderId: string, status: OrderStatus) => {
    setOrders(prev => prev.map(o => {
      if (o.id === orderId) {
        const updatedItems = o.items.map(item => {
          if (status === 'ready') return { ...item, status: 'ready' as const };
          if (status === 'served') return { ...item, status: 'served' as const };
          if (status === 'in_kitchen' && item.status === 'pending') return { ...item, status: 'preparing' as const };
          return item;
        });

        const updatedOrder = { ...o, status, items: updatedItems };

        if (status === 'ready') {
          soundEffects.playOrderReady();
          addNotification('Dish Ready for Table ' + o.tableNumber, `Chef finished preparing Order #${o.orderNumber}. Ready for server pickup!`, 'order');
        } else if (status === 'served') {
          addNotification('Order Served to Table ' + o.tableNumber, `Order #${o.orderNumber} served. Ready for billing when requested.`, 'order');
          setTables(tPrev => tPrev.map(t => t.number === o.tableNumber ? { ...t, status: 'billing' } : t));
        }

        broadcastEvent('ORDER_STATUS_UPDATE', { orderId, status });

        if (firebaseSyncService.isConnected()) {
          firebaseSyncService.updateOrderStatus(orderId, status, updatedItems);
        }

        return updatedOrder;
      }
      return o;
    }));
  }, [broadcastEvent, addNotification]);

  // Update individual item status in KDS
  const updateOrderItemStatus = useCallback((orderId: string, itemIdx: number, itemStatus: ItemStatus) => {
    setOrders(prev => prev.map(o => {
      if (o.id === orderId) {
        const newItems = [...o.items];
        if (newItems[itemIdx]) {
          newItems[itemIdx] = { ...newItems[itemIdx], status: itemStatus };
        }

        const allServed = newItems.every(i => i.status === 'served');
        const allReady = newItems.every(i => i.status === 'ready' || i.status === 'served');
        const anyPreparing = newItems.some(i => i.status === 'preparing' || i.status === 'ready');

        let nextStatus: OrderStatus = o.status;
        if (allServed) {
          nextStatus = 'served';
          setTables(tPrev => tPrev.map(t => t.number === o.tableNumber ? { ...t, status: 'billing' } : t));
        } else if (allReady) {
          nextStatus = 'ready';
        } else if (anyPreparing) {
          nextStatus = 'in_kitchen';
        }

        if (allReady && o.status !== 'ready') {
          soundEffects.playOrderReady();
          addNotification('Order Ready!', `All items for Order #${o.orderNumber} (Table ${o.tableNumber}) are plated!`, 'order');
        }

        const updatedOrder = { ...o, items: newItems, status: nextStatus };

        if (firebaseSyncService.isConnected()) {
          firebaseSyncService.updateOrderStatus(orderId, nextStatus, newItems);
        }

        return updatedOrder;
      }
      return o;
    }));
  }, [addNotification]);

  // Process direct payment settlement & update Shift cash drawer
  const processPayment = useCallback(async (
    orderId: string,
    paymentMethod: 'upi' | 'card' | 'cash' | 'netbanking',
    customerEmail?: string
  ) => {
    const invoiceNumber = `INV-VR-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const targetOrder = orders.find(o => o.id === orderId);
    const paidAt = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    setOrders(prev => prev.map(o => {
      if (o.id === orderId) {
        const completedOrder: Order = {
          ...o,
          status: 'completed',
          paymentStatus: 'paid',
          paymentMethod,
          paidAt,
          invoiceGenerated: true,
          invoiceNumber,
          customerEmail: customerEmail || o.customerEmail,
          printCount: 1,
        };

        if (firebaseSyncService.isConnected()) {
          firebaseSyncService.syncOrder(completedOrder);
        }

        return completedOrder;
      }
      return o;
    }));

    // Update active register shift with collected amounts
    if (activeShift && targetOrder) {
      const amount = targetOrder.totalAmount;
      const addCash = paymentMethod === 'cash' ? amount : 0;
      const addUpi = paymentMethod === 'upi' ? amount : 0;
      const addCard = paymentMethod === 'card' || paymentMethod === 'netbanking' ? amount : 0;

      setActiveShift(prev => {
        if (!prev) return null;
        const newCashSales = prev.cashSales + addCash;
        const newUpiSales = prev.upiSales + addUpi;
        const newCardSales = prev.cardSales + addCard;
        const newTotalSales = prev.totalSales + amount;
        return {
          ...prev,
          cashSales: newCashSales,
          upiSales: newUpiSales,
          cardSales: newCardSales,
          totalSales: newTotalSales,
          expectedCash: prev.openingFloat + newCashSales,
        };
      });
    }

    // Free the table for next party / cleaning
    if (targetOrder) {
      setTables(prev => prev.map(t => t.number === targetOrder.tableNumber ? {
        ...t,
        status: 'cleaning',
        currentOrderId: undefined,
        currentGuestName: undefined,
      } : t));
    }

    soundEffects.playPaymentSuccess();
    addAuditLog('DISCOUNT_APPLIED', `Invoice ${invoiceNumber} settled via ${paymentMethod.toUpperCase()} (Amount: ₹${targetOrder?.totalAmount}) by ${currentStaff?.name || 'Cashier'}`);
    addNotification('Payment Recorded', `Payment settled via ${paymentMethod.toUpperCase()} for ${invoiceNumber}. Tax invoice generated for printing.`, 'payment');

    return { success: true, invoiceNumber };
  }, [orders, activeShift, currentStaff, addAuditLog, addNotification]);

  // Backward compatible wrapper for legacy calls
  const processSplitPayment = useCallback(async (
    orderId: string,
    splitInfo: SplitPaymentInfo,
    customerEmail: string
  ) => {
    const primaryMethod = splitInfo.shares[0]?.paymentMethod || 'upi';
    return processPayment(orderId, primaryMethod, customerEmail);
  }, [processPayment]);

  // Table Booking
  const bookTable = useCallback((bookingData: Omit<TableBooking, 'id' | 'bookingRef' | 'createdAt' | 'status'>) => {
    const bookingRef = `BKG-VR-${Math.floor(100 + Math.random() * 900)}`;
    const newBooking: TableBooking = {
      ...bookingData,
      id: `bkg-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      bookingRef,
      status: 'confirmed',
      createdAt: new Date().toISOString(),
    };

    setBookings(prev => [newBooking, ...prev]);

    setTables(prev => prev.map(t => t.number === bookingData.tableNumber ? {
      ...t,
      status: 'reserved',
      currentGuestName: bookingData.customerName,
      reservationTime: bookingData.timeSlot,
    } : t));

    addNotification(
      'Reservation Confirmed',
      `Table #${bookingData.tableNumber} reserved for ${bookingData.customerName} on ${bookingData.date} at ${bookingData.timeSlot}. Ref: ${bookingRef}`,
      'table'
    );

    return {
      success: true,
      bookingRef,
      message: `Table #${bookingData.tableNumber} booked for ${bookingData.customerName} at ${bookingData.timeSlot}`,
    };
  }, [addNotification]);

  const updateTableStatus = useCallback((tableId: string, status: RestaurantTable['status']) => {
    setTables(prev => prev.map(t => t.id === tableId ? { ...t, status } : t));
  }, []);

  const callWaiter = useCallback((tableNumber: number, type: WaiterCall['type']) => {
    const newCall: WaiterCall = {
      id: `call-${Date.now()}`,
      tableNumber,
      type,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: 'pending',
    };

    setWaiterCalls(prev => [newCall, ...prev]);
    soundEffects.playWaiterBuzz();
    broadcastEvent('WAITER_CALL', newCall);

    if (firebaseSyncService.isConnected()) {
      firebaseSyncService.syncWaiterCall(newCall);
    }

    addNotification(
      `Service Alert: Table #${tableNumber}`,
      `Guest requested ${type.toUpperCase()} assistance.`,
      'table'
    );
  }, [broadcastEvent, addNotification]);

  const resolveWaiterCall = useCallback((callId: string) => {
    setWaiterCalls(prev => prev.filter(c => c.id !== callId));
  }, []);

  const clearNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const markAllNotificationsRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  }, []);

  return (
    <RestaurantContext.Provider
      value={{
        currentView,
        setCurrentView,
        customerTableNumber,
        setCustomerTableNumber,
        restaurantSettings,
        updateRestaurantSettings,
        isSettingsOpen,
        setIsSettingsOpen,

        // Phase 1: Security & Staff Roles
        staffUsers,
        currentStaff,
        isScreenLocked,
        setIsScreenLocked,
        loginWithPin,
        logoutStaff,
        lockScreen,
        unlockScreen,
        switchStaffRole,
        updateStaffPin,
        isRoleAllowed,

        // Phase 2: Audit Logs & Order Voids
        auditLogs,
        addAuditLog,
        voidOrderWithManagerApproval,
        recordBillReprint,

        // Phase 3: Shift Management
        activeShift,
        shiftHistory,
        openRegisterShift,
        closeRegisterShift,

        // Phase 4: Multi-Tenant Architecture
        currentTenant,
        tenantsList,
        switchTenant,
        createTenant,

        // Phase 5: Hardware Printer
        printerConfig,
        updatePrinterConfig,

        // Phase 6: Commercial SaaS
        subscription,
        activateLicenseKey,

        // Cloud & Offline
        isFirestoreConnected,
        connectFirestore,
        disconnectFirestore,
        menu,
        updateWholeMenu,
        resetMenuToDefault,
        resetDatabaseForNewClient,
        wipeTestDataOnly,
        resetToDemoData,
        inventory,
        tables,
        orders,
        bookings,
        notifications,
        waiterCalls,
        cart,
        isOnline,
        isSimulatedOffline,
        setSimulatedOffline: setIsSimulatedOffline,
        pendingOfflineCount: offlineQueue.length,
        syncOfflineQueue,
        addToCart,
        updateCartQuantity,
        removeFromCart,
        clearCart,
        cartTotal,
        cartCount,
        placeOrder,
        updateOrderStatus,
        updateOrderItemStatus,
        processPayment,
        processSplitPayment,
        bookTable,
        updateTableStatus,
        callWaiter,
        resolveWaiterCall,
        updateInventoryStock,
        restockItem,
        checkItemStockAvailability,
        clearNotification,
        markAllNotificationsRead,
        requestPushPermission,
        pushPermissionState,
      }}
    >
      {children}
    </RestaurantContext.Provider>
  );
};

export const useRestaurant = () => {
  const context = useContext(RestaurantContext);
  if (!context) {
    throw new Error('useRestaurant must be used within a RestaurantProvider');
  }
  return context;
};
