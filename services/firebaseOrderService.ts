/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  writeBatch,
} from 'firebase/firestore';
import { db, OperationType, handleFirestoreError } from '../firebase';
import { Order } from '../types';
import { INITIAL_ORDERS } from '../data/solcreftData';

const ORDERS_COLLECTION = 'orders';
const LOCAL_CACHE_KEY = 'solcreft_orders_cirebon_v1';

export type FirestoreSyncState = 'connecting' | 'connected' | 'error';

interface StoredOrderDocument extends Order {
  createdAtMs?: number;
  updatedAtMs?: number;
}

/**
 * Bersihkan properti bernilai undefined secara rekursif dan batasi ukuran foto base64
 * agar dokumen selalu aman disimpan ke Cloud Firestore (< 1MB limit).
 */
function sanitizeOrderForFirestore(order: Order, isNewOrder: boolean = false): Record<string, any> {
  const now = Date.now();
  const raw: StoredOrderDocument = {
    ...order,
    createdAtMs: (order as StoredOrderDocument).createdAtMs || (isNewOrder ? now : now - 1000),
    updatedAtMs: now,
  };

  // Jaga agar base64 foto tidak melebihi batas dokumen 1MB Firestore
  if (raw.photoUrl && raw.photoUrl.length > 350000) {
    raw.photoUrl = raw.photoUrl.slice(0, 350000);
  }
  if (Array.isArray(raw.photos)) {
    raw.photos = raw.photos
      .slice(0, 2)
      .filter((p) => typeof p === 'string' && p.length <= 350000);
  }

  return JSON.parse(
    JSON.stringify(raw, (_key, value) => (value === undefined ? null : value))
  );
}

/**
 * Langganan real-time (onSnapshot) ke koleksi 'orders' di Firebase Firestore.
 * Setiap kali ada pesanan baru atau perubahan status (jemput, workshop, siap antar, selesai),
 * seluruh HP Kurir Soleman, Admin Workshop, dan Pelanggan otomatis ter-update tanpa refresh!
 */
export function subscribeToOrdersRealtime(
  onOrdersUpdate: (orders: Order[]) => void,
  onSyncStateChange?: (state: FirestoreSyncState) => void
): () => void {
  onSyncStateChange?.('connecting');
  let hasSeededInitial = false;

  const colRef = collection(db, ORDERS_COLLECTION);

  const unsubscribe = onSnapshot(
    colRef,
    async (snapshot) => {
      onSyncStateChange?.('connected');

      // Jika koleksi Firestore masih kosong saat pertama kali dibuka, seed data awal
      if (snapshot.empty && !hasSeededInitial) {
        hasSeededInitial = true;
        try {
          let seedSource: Order[] = INITIAL_ORDERS;
          try {
            const localSaved = localStorage.getItem(LOCAL_CACHE_KEY);
            if (localSaved) {
              const parsed = JSON.parse(localSaved);
              if (Array.isArray(parsed) && parsed.length > 0) {
                seedSource = parsed;
              }
            }
          } catch {
            // Gunakan INITIAL_ORDERS
          }

          const batch = writeBatch(db);
          const baseTime = Date.now();
          seedSource.forEach((ord, index) => {
            const sanitized = sanitizeOrderForFirestore(ord, false);
            sanitized.createdAtMs = baseTime - index * 60000;
            sanitized.updatedAtMs = baseTime - index * 60000;
            batch.set(doc(db, ORDERS_COLLECTION, ord.id), sanitized);
          });
          await batch.commit();
        } catch (seedErr) {
          console.warn('Info seed initial orders:', seedErr);
        }
        return;
      }

      const loadedOrders: StoredOrderDocument[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data() as StoredOrderDocument;
        if (data && data.id) {
          loadedOrders.push(data);
        }
      });

      // Urutkan pesanan: yang baru dibuat / baru diperbarui tampil paling atas
      loadedOrders.sort((a, b) => {
        const timeA = a.createdAtMs || a.updatedAtMs || 0;
        const timeB = b.createdAtMs || b.updatedAtMs || 0;
        return timeB - timeA;
      });

      // Simpan salinan ke cache lokal untuk cadangan instan saat sinyal lemah
      try {
        localStorage.setItem(LOCAL_CACHE_KEY, JSON.stringify(loadedOrders));
      } catch {
        // Abaikan jika storage penuh
      }

      onOrdersUpdate(loadedOrders);
    },
    (error) => {
      onSyncStateChange?.('error');
      try {
        handleFirestoreError(error, OperationType.LIST, ORDERS_COLLECTION);
      } catch (loggedErr) {
        console.warn('Firestore listener warning:', loggedErr);
      }
    }
  );

  return unsubscribe;
}

/**
 * Simpan atau perbarui satu dokumen pesanan ke Firebase Firestore secara real-time.
 */
export async function saveOrderToFirestore(
  order: Order,
  isNewOrder: boolean = false
): Promise<void> {
  const path = `${ORDERS_COLLECTION}/${order.id}`;
  try {
    const sanitized = sanitizeOrderForFirestore(order, isNewOrder);
    await setDoc(doc(db, ORDERS_COLLECTION, order.id), sanitized, { merge: true });
  } catch (error) {
    handleFirestoreError(
      error,
      isNewOrder ? OperationType.CREATE : OperationType.UPDATE,
      path
    );
  }
}

/**
 * Hapus satu dokumen pesanan dari Firebase Firestore secara real-time.
 */
export async function deleteOrderFromFirestore(orderId: string): Promise<void> {
  const path = `${ORDERS_COLLECTION}/${orderId}`;
  try {
    await deleteDoc(doc(db, ORDERS_COLLECTION, orderId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}
