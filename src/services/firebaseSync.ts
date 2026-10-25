import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import {
  getFirestore,
  Firestore,
  collection,
  doc,
  setDoc,
  updateDoc,
  onSnapshot,
  query,
  limit,
  serverTimestamp,
} from 'firebase/firestore';
import { Order, WaiterCall, FirebaseConfigData } from '../types/restaurant';

const STORAGE_KEY_FIREBASE_CONFIG = 'varhad_firebase_config_v1';
const DEFAULT_CHANNEL_ID = 'amravati_kitchen_main';

class FirebaseSyncService {
  private app: FirebaseApp | null = null;
  private db: Firestore | null = null;
  private unsubscribeOrders: (() => void) | null = null;
  private unsubscribeWaiterCalls: (() => void) | null = null;
  private isConfiguredState: boolean = false;
  private currentChannelId: string = DEFAULT_CHANNEL_ID;

  constructor() {
    this.initFromStorage();
  }

  public getStoredConfig(): FirebaseConfigData | null {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_FIREBASE_CONFIG);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {}
    return null;
  }

  public initFromStorage(): boolean {
    const config = this.getStoredConfig();
    if (config && config.projectId && config.apiKey) {
      return this.configure(config);
    }
    return false;
  }

  public configure(config: FirebaseConfigData): boolean {
    try {
      this.currentChannelId = config.channelId || DEFAULT_CHANNEL_ID;

      const firebaseConfig = {
        apiKey: config.apiKey,
        authDomain: config.authDomain || `${config.projectId}.firebaseapp.com`,
        projectId: config.projectId,
        storageBucket: config.storageBucket || `${config.projectId}.appspot.com`,
        messagingSenderId: config.messagingSenderId || '',
        appId: config.appId || '',
      };

      if (!getApps().length) {
        this.app = initializeApp(firebaseConfig);
      } else {
        this.app = getApp();
      }

      this.db = getFirestore(this.app);
      this.isConfiguredState = true;

      // Save to localStorage
      try {
        localStorage.setItem(STORAGE_KEY_FIREBASE_CONFIG, JSON.stringify(config));
      } catch {}

      return true;
    } catch (err) {
      console.warn('Firebase configuration error:', err);
      this.isConfiguredState = false;
      return false;
    }
  }

  public disconnect(): void {
    if (this.unsubscribeOrders) {
      this.unsubscribeOrders();
      this.unsubscribeOrders = null;
    }
    if (this.unsubscribeWaiterCalls) {
      this.unsubscribeWaiterCalls();
      this.unsubscribeWaiterCalls = null;
    }
    this.isConfiguredState = false;
    this.db = null;
    this.app = null;
    try {
      localStorage.removeItem(STORAGE_KEY_FIREBASE_CONFIG);
    } catch {}
  }

  public isConnected(): boolean {
    return this.isConfiguredState && this.db !== null;
  }

  public getChannelId(): string {
    return this.currentChannelId;
  }

  /**
   * Listen to real-time order updates across all mobile phones and kitchen TV
   */
  public subscribeToOrders(
    onOrdersUpdate: (orders: Order[]) => void,
    onError?: (err: Error) => void
  ): () => void {
    if (!this.isConnected() || !this.db) {
      return () => {};
    }

    try {
      const ordersCol = collection(this.db, 'restaurants', this.currentChannelId, 'orders');
      const q = query(ordersCol, limit(100));

      this.unsubscribeOrders = onSnapshot(
        q,
        (snapshot) => {
          const remoteOrders: Order[] = [];
          snapshot.forEach((docSnap) => {
            const data = docSnap.data();
            if (data && data.orderNumber) {
              remoteOrders.push(data as Order);
            }
          });
          onOrdersUpdate(remoteOrders);
        },
        (error) => {
          console.error('Firestore onSnapshot error on orders:', error);
          if (onError) onError(error);
        }
      );

      return () => {
        if (this.unsubscribeOrders) {
          this.unsubscribeOrders();
          this.unsubscribeOrders = null;
        }
      };
    } catch (err) {
      console.warn('Could not subscribe to Firestore orders:', err);
      return () => {};
    }
  }

  /**
   * Save or update an order to Firestore for instant synchronization across devices
   */
  public async syncOrder(order: Order): Promise<boolean> {
    if (!this.isConnected() || !this.db) {
      return false;
    }

    try {
      const orderRef = doc(this.db, 'restaurants', this.currentChannelId, 'orders', order.id);
      await setDoc(
        orderRef,
        {
          ...order,
          cloudUpdatedAt: serverTimestamp(),
          syncedToCloud: true,
        },
        { merge: true }
      );
      return true;
    } catch (err) {
      console.error('Failed to sync order to Firestore:', err);
      return false;
    }
  }

  /**
   * Update order status on Firestore
   */
  public async updateOrderStatus(orderId: string, status: Order['status'], items?: Order['items']): Promise<boolean> {
    if (!this.isConnected() || !this.db) {
      return false;
    }

    try {
      const orderRef = doc(this.db, 'restaurants', this.currentChannelId, 'orders', orderId);
      const payload: Record<string, unknown> = {
        status,
        cloudUpdatedAt: serverTimestamp(),
      };
      if (items) {
        payload.items = items;
      }
      await updateDoc(orderRef, payload);
      return true;
    } catch (err) {
      console.error('Failed to update order status in Firestore:', err);
      return false;
    }
  }

  /**
   * Sync waiter call to Firestore
   */
  public async syncWaiterCall(call: WaiterCall): Promise<boolean> {
    if (!this.isConnected() || !this.db) {
      return false;
    }

    try {
      const callRef = doc(this.db, 'restaurants', this.currentChannelId, 'waiterCalls', call.id);
      await setDoc(callRef, {
        ...call,
        cloudUpdatedAt: serverTimestamp(),
      });
      return true;
    } catch (err) {
      console.error('Failed to sync waiter call to Firestore:', err);
      return false;
    }
  }

  /**
   * Listen to waiter calls across mobile devices
   */
  public subscribeToWaiterCalls(
    onCallsUpdate: (calls: WaiterCall[]) => void
  ): () => void {
    if (!this.isConnected() || !this.db) {
      return () => {};
    }

    try {
      const callsCol = collection(this.db, 'restaurants', this.currentChannelId, 'waiterCalls');
      const q = query(callsCol, limit(50));

      this.unsubscribeWaiterCalls = onSnapshot(
        q,
        (snapshot) => {
          const calls: WaiterCall[] = [];
          snapshot.forEach((docSnap) => {
            const data = docSnap.data();
            if (data && data.tableNumber) {
              calls.push(data as WaiterCall);
            }
          });
          onCallsUpdate(calls);
        },
        (error) => {
          console.error('Firestore onSnapshot error on waiterCalls:', error);
        }
      );

      return () => {
        if (this.unsubscribeWaiterCalls) {
          this.unsubscribeWaiterCalls();
          this.unsubscribeWaiterCalls = null;
        }
      };
    } catch (err) {
      console.warn('Could not subscribe to waiter calls:', err);
      return () => {};
    }
  }
}

export const firebaseSyncService = new FirebaseSyncService();
