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
} from '../types/restaurant';
import { AMRAVATI_MENU, INITIAL_INVENTORY, INITIAL_TABLES, INITIAL_SAMPLE_ORDERS } from '../data/amravatiMenu';
import { soundEffects } from '../utils/audio';

export type AppView = 'customer' | 'kds' | 'tables' | 'inventory' | 'analytics';

interface CartItem {
  item: MenuItem;
  quantity: number;
  notes?: string;
}

interface RestaurantContextType {
  // Navigation & View
  currentView: AppView;
  setCurrentView: (view: AppView) => void;
  customerTableNumber: number;
  setCustomerTableNumber: (num: number) => void;

  // Data
  menu: MenuItem[];
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

const STORAGE_KEY_ORDERS = 'varhad_amravati_orders_v2';
const STORAGE_KEY_INVENTORY = 'varhad_amravati_inventory_v2';
const STORAGE_KEY_TABLES = 'varhad_amravati_tables_v2';
const STORAGE_KEY_BOOKINGS = 'varhad_amravati_bookings_v2';
const STORAGE_KEY_OFFLINE_QUEUE = 'varhad_amravati_offline_queue_v2';

export const RestaurantProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentView, setCurrentView] = useState<AppView>('customer');
  const [customerTableNumber, setCustomerTableNumber] = useState<number>(4); // Table 4 (AC Dining) default
  const [menu] = useState<MenuItem[]>(AMRAVATI_MENU);

  // Connectivity
  const [rawOnline, setRawOnline] = useState<boolean>(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [isSimulatedOffline, setIsSimulatedOffline] = useState<boolean>(false);
  const isOnline = rawOnline && !isSimulatedOffline;

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

  // Sync to localStorage
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

  // BroadcastChannel for instant multi-window/multi-tab sync between customer & KDS
  useEffect(() => {
    if (typeof window === 'undefined' || !('BroadcastChannel' in window)) return;
    const channel = new BroadcastChannel('amravati_kds_sync_channel');

    channel.onmessage = (event) => {
      const { type, payload } = event.data || {};
      if (type === 'NEW_ORDER') {
        setOrders(prev => {
          if (prev.some(o => o.id === payload.id)) return prev;
          soundEffects.playKitchenBell();
          return [payload, ...prev];
        });
      } else if (type === 'ORDER_STATUS_UPDATE') {
        setOrders(prev => prev.map(o => o.id === payload.orderId ? { ...o, status: payload.status } : o));
      } else if (type === 'WAITER_CALL') {
        soundEffects.playWaiterBuzz();
        setWaiterCalls(prev => [payload, ...prev]);
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

  // Notification helper
  const addNotification = useCallback((title: string, body: string, type: PushNotificationMessage['type']) => {
    const newMsg: PushNotificationMessage = {
      id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      title,
      body,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      type,
      read: false,
    };
    setNotifications(prev => [newMsg, ...prev.slice(0, 19)]);

    // Trigger system notification if permitted
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification(title, {
          body,
          icon: '/favicon.ico',
        });
      } catch {}
    }
  }, []);

  const requestPushPermission = async () => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      try {
        const permission = await Notification.requestPermission();
        setPushPermissionState(permission);
        if (permission === 'granted') {
          addNotification('Push Notifications Active', 'You will receive real-time order status updates for Amravati kitchen orders.', 'order');
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

  // Cart operations
  const addToCart = useCallback((item: MenuItem, notes?: string) => {
    const inventoryStock = inventory.find(i => i.id === item.inventoryItemId);
    const existingInCart = cart.find(c => c.item.id === item.id)?.quantity || 0;
    const requestedTotal = existingInCart + 1;

    if (inventoryStock && inventoryStock.inStock < requestedTotal) {
      return {
        success: false,
        message: `Sorry! Only ${inventoryStock.inStock} ${inventoryStock.localUnit} of ${item.name} ingredients currently available in kitchen inventory.`,
      };
    }

    setCart(prev => {
      const idx = prev.findIndex(c => c.item.id === item.id);
      if (idx > -1) {
        const updated = [...prev];
        updated[idx] = { ...updated[idx], quantity: updated[idx].quantity + 1, notes: notes || updated[idx].notes };
        return updated;
      }
      return [...prev, { item, quantity: 1, notes }];
    });

    return { success: true };
  }, [cart, inventory]);

  const updateCartQuantity = useCallback((itemId: string, qty: number) => {
    if (qty <= 0) {
      setCart(prev => prev.filter(c => c.item.id !== itemId));
      return;
    }
    const cartItem = cart.find(c => c.item.id === itemId);
    if (cartItem) {
      const stock = inventory.find(i => i.id === cartItem.item.inventoryItemId);
      if (stock && stock.inStock < qty) {
        addNotification('Stock Limit Reached', `Maximum ${stock.inStock} ${stock.localUnit} left in inventory for ${cartItem.item.name}.`, 'kitchen');
        return;
      }
    }
    setCart(prev => prev.map(c => c.item.id === itemId ? { ...c, quantity: qty } : c));
  }, [cart, inventory, addNotification]);

  const removeFromCart = useCallback((itemId: string) => {
    setCart(prev => prev.filter(c => c.item.id !== itemId));
  }, []);

  const clearCart = useCallback(() => {
    setCart([]);
  }, []);

  const cartTotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + (item.item.price * item.quantity), 0);
  }, [cart]);

  const cartCount = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.quantity, 0);
  }, [cart]);

  // Order Placement
  const placeOrder = async (customerName = 'Guest Customer', customerEmail = 'caankitgupta777@gmail.com', notes = '') => {
    if (cart.length === 0) {
      return { success: false, message: 'Cart is empty. Please add delicious Amravati dishes first!' };
    }

    // Double check inventory
    for (const cartItem of cart) {
      const inv = inventory.find(i => i.id === cartItem.item.inventoryItemId);
      if (inv && inv.inStock < cartItem.quantity) {
        return {
          success: false,
          message: `Discrepancy alert: ${cartItem.item.name} only has ${inv.inStock} ${inv.localUnit} left in kitchen inventory. Please adjust quantity.`,
        };
      }
    }

    const table = tables.find(t => t.number === customerTableNumber);
    const subtotal = cartTotal;
    const cgst = Number((subtotal * 0.025).toFixed(2));
    const sgst = Number((subtotal * 0.025).toFixed(2));
    const totalAmount = Math.round(subtotal + cgst + sgst);

    const randomSuffix = Math.floor(100 + Math.random() * 900);
    const orderNumber = `AMR-${randomSuffix}`;

    const newOrder: Order = {
      id: `ord-${Date.now()}`,
      orderNumber,
      tableId: table?.id || `tbl-${customerTableNumber}`,
      tableNumber: customerTableNumber,
      section: table?.section || 'AC Dining Hall',
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
      totalAmount,
      status: 'received',
      paymentStatus: 'unpaid',
      createdAt: new Date().toISOString(),
      estimatedPrepMinutes: Math.max(...cart.map(c => c.item.prepTimeMinutes), 15),
      customerName,
      customerEmail,
      waiterNotes: notes,
      isOfflineCreated: !isOnline,
    };

    // Auto-deduct inventory
    setInventory(prev => {
      const updated = [...prev];
      for (const cartItem of cart) {
        const idx = updated.findIndex(i => i.id === cartItem.item.inventoryItemId);
        if (idx > -1) {
          const deductAmount = cartItem.quantity * (cartItem.item.inventoryItemId.includes('kg') ? 0.25 : 1);
          updated[idx] = {
            ...updated[idx],
            inStock: Math.max(0, Number((updated[idx].inStock - deductAmount).toFixed(1))),
          };
        }
      }
      return updated;
    });

    // Update table status to occupied
    setTables(prev => prev.map(t => t.number === customerTableNumber ? {
      ...t,
      status: 'occupied',
      currentOrderId: orderNumber,
      currentGuestName: customerName,
    } : t));

    if (!isOnline) {
      // Offline mode: enqueue
      setOfflineQueue(prev => [newOrder, ...prev]);
      setOrders(prev => [newOrder, ...prev]);
      soundEffects.playKitchenBell();
      clearCart();
      addNotification('Order Saved Offline', `Order #${orderNumber} stored locally. It will auto-sync to KDS once network reconnects.`, 'order');
      return {
        success: true,
        order: newOrder,
        message: `Order #${orderNumber} saved locally in offline queue.`,
      };
    }

    // Online: add to orders & broadcast to KDS
    setOrders(prev => [newOrder, ...prev]);
    soundEffects.playKitchenBell();
    broadcastEvent('NEW_ORDER', newOrder);
    clearCart();

    addNotification('Order Sent to Kitchen Display', `Order #${orderNumber} for Table ${customerTableNumber} dispatched directly to Chef station!`, 'kitchen');

    return {
      success: true,
      order: newOrder,
      message: `Order #${orderNumber} successfully sent to Kitchen Display System!`,
    };
  };

  // Sync offline queue when back online
  const syncOfflineQueue = useCallback(() => {
    if (offlineQueue.length === 0) return;
    
    // Broadcast all offline orders
    offlineQueue.forEach(ord => {
      broadcastEvent('NEW_ORDER', { ...ord, isOfflineCreated: false, syncedAt: new Date().toISOString() });
    });

    setOrders(prev => prev.map(o => {
      if (o.isOfflineCreated) {
        return { ...o, isOfflineCreated: false, syncedAt: new Date().toISOString() };
      }
      return o;
    }));

    addNotification('Offline Orders Synced', `Successfully synced ${offlineQueue.length} queued order(s) with the Kitchen Display System!`, 'kitchen');
    setOfflineQueue([]);
  }, [offlineQueue, broadcastEvent, addNotification]);

  // Auto-sync when reconnecting
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
          addNotification('Dish Ready for Table ' + o.tableNumber, `Chef has prepared Order #${o.orderNumber}. Ready for server pickup!`, 'order');
        } else if (status === 'served') {
          addNotification('Order Served', `Order #${o.orderNumber} successfully served to Table ${o.tableNumber}.`, 'order');
          // Table moves to billing/dining
          setTables(tPrev => tPrev.map(t => t.number === o.tableNumber ? { ...t, status: 'billing' } : t));
        }

        broadcastEvent('ORDER_STATUS_UPDATE', { orderId, status });
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
        // If all items ready, update entire order
        const allReady = newItems.every(i => i.status === 'ready' || i.status === 'served');
        const nextStatus = allReady ? 'ready' : 'in_kitchen';
        if (allReady && o.status !== 'ready') {
          soundEffects.playOrderReady();
          addNotification('Order Ready!', `All items for Order #${o.orderNumber} (Table ${o.tableNumber}) are plated and ready!`, 'order');
        }
        return { ...o, items: newItems, status: nextStatus };
      }
      return o;
    }));
  }, [addNotification]);

  // Split payment and automated invoicing
  const processSplitPayment = useCallback(async (
    orderId: string,
    splitInfo: SplitPaymentInfo,
    customerEmail: string
  ) => {
    const invoiceNumber = `INV-VR-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    setOrders(prev => prev.map(o => {
      if (o.id === orderId) {
        return {
          ...o,
          status: 'completed',
          paymentStatus: 'paid',
          splitPayment: splitInfo,
          invoiceGenerated: true,
          invoiceNumber,
          customerEmail: customerEmail || o.customerEmail,
        };
      }
      return o;
    }));

    // Free the table
    const targetOrder = orders.find(o => o.id === orderId);
    if (targetOrder) {
      setTables(prev => prev.map(t => t.number === targetOrder.tableNumber ? {
        ...t,
        status: 'cleaning',
        currentOrderId: undefined,
        currentGuestName: undefined,
      } : t));
    }

    soundEffects.playPaymentSuccess();
    addNotification(
      'Payment & Invoice Generated',
      `Payment settled for ${invoiceNumber}. Tax invoice automatically sent to ${customerEmail}.`,
      'payment'
    );

    return { success: true, invoiceNumber };
  }, [orders, addNotification]);

  // Table Booking
  const bookTable = useCallback((bookingData: Omit<TableBooking, 'id' | 'bookingRef' | 'createdAt' | 'status'>) => {
    const bookingRef = `BKG-VR-${Math.floor(100 + Math.random() * 900)}`;
    const newBooking: TableBooking = {
      ...bookingData,
      id: `bkg-${Date.now()}`,
      bookingRef,
      status: 'confirmed',
      createdAt: new Date().toISOString(),
    };

    setBookings(prev => [newBooking, ...prev]);

    // Mark table reserved
    setTables(prev => prev.map(t => t.number === bookingData.tableNumber ? {
      ...t,
      status: 'reserved',
      currentGuestName: bookingData.customerName,
      reservationTime: bookingData.timeSlot,
    } : t));

    addNotification(
      'Table Reservation Confirmed',
      `Table #${bookingData.tableNumber} reserved for ${bookingData.customerName} on ${bookingData.date} at ${bookingData.timeSlot}. Ref: ${bookingRef}`,
      'table'
    );

    return {
      success: true,
      bookingRef,
      message: `Table #${bookingData.tableNumber} booked successfully! Booking Ref: ${bookingRef}`,
    };
  }, [addNotification]);

  const updateTableStatus = useCallback((tableId: string, status: RestaurantTable['status']) => {
    setTables(prev => prev.map(t => t.id === tableId ? { ...t, status } : t));
  }, []);

  // Waiter Calls
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
    addNotification('Table Request', `Table ${tableNumber} requested ${type.toUpperCase()}. Waiter notified.`, 'table');
  }, [broadcastEvent, addNotification]);

  const resolveWaiterCall = useCallback((callId: string) => {
    setWaiterCalls(prev => prev.filter(c => c.id !== callId));
  }, []);

  // Inventory Management
  const updateInventoryStock = useCallback((itemId: string, newStock: number) => {
    setInventory(prev => prev.map(item => item.id === itemId ? { ...item, inStock: Math.max(0, newStock) } : item));
  }, []);

  const restockItem = useCallback((itemId: string, amount: number) => {
    setInventory(prev => prev.map(item => item.id === itemId ? { ...item, inStock: item.inStock + amount } : item));
    addNotification('Inventory Restocked', `Item restocked (+${amount} units).`, 'kitchen');
  }, [addNotification]);

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
        menu,
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
