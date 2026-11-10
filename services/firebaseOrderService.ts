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
} from 'firebase/firestore';
import { db, OperationType, handleFirestoreError, FIRESTORE_DATABASE_ID } from '../firebase';
import { Order } from '../types';

// Koleksi utama di Firebase Firestore sesuai instruksi pengguna
export const ORDERS_COLLECTION = 'oderan';

// Daftar ID data contoh lama yang wajib dihapus jika pernah tersimpan sebelumnya
const LEGACY_SAMPLE_IDS = new Set([
  'SLC-3891',
  'SLC-3892',
  'SLC-3893',
  'SLC-8821',
  'SLC-8825',
  'SLC-8830',
  'SLC-8834',
  'SLC-8840',
]);

export type FirestoreSyncState = 'connecting' | 'connected' | 'error';

interface StoredOrderDocument extends Order {
  createdAtMs?: number;
  updatedAtMs?: number;
}

/**
 * Bersihkan localStorage lama sepenuhnya agar aplikasi 100% tidak pernah memakai penyimpanan lokal.
 */
export function purgeLegacyLocalStorage(): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem('solcreft_orders_cirebon_v1');
  } catch {
    // Abaikan jika browser memblokir akses storage
  }
}

/**
 * Format pesan error Firebase agar mudah dipahami di banner merah pada layar.
 */
export function formatFirebaseErrorMessage(error: unknown, contextAction: string): string {
  const raw = error instanceof Error ? error.message : String(error);
  if (
    raw.includes('permission-denied') ||
    raw.includes('Missing or insufficient permissions')
  ) {
    return `Gagal ${contextAction} ke koleksi "${ORDERS_COLLECTION}" di Firebase Firestore (Database: ${FIRESTORE_DATABASE_ID}): Akses ditolak oleh Firestore Security Rules (permission-denied). Silakan periksa tab Rules di database ${FIRESTORE_DATABASE_ID}.`;
  }
  if (raw.includes('not-found') || raw.includes('does not exist')) {
    return `Gagal ${contextAction}: Database Firebase Firestore "${FIRESTORE_DATABASE_ID}" tidak ditemukan atau belum aktif di project "soleman-cirebon".`;
  }
  if (raw.includes('offline') || raw.includes('unavailable')) {
    return `Gagal ${contextAction} ke Firebase Firestore (${FIRESTORE_DATABASE_ID}): Perangkat sedang offline atau koneksi ke server Firebase terputus (${raw}).`;
  }
  return `Gagal ${contextAction} ke Firebase Firestore (${FIRESTORE_DATABASE_ID}) koleksi "${ORDERS_COLLECTION}": ${raw}`;
}

/**
 * Bersihkan properti bernilai undefined secara rekursif dan batasi ukuran foto base64
 * agar dokumen selalu aman disimpan ke Cloud Firestore (< 1MB limit).
 */
function sanitizeOrderForFirestore(
  order: Order,
  isNewOrder: boolean = false
): Record<string, any> {
  const now = Date.now();
  const raw: StoredOrderDocument = {
    ...order,
    createdAtMs:
      (order as StoredOrderDocument).createdAtMs || (isNewOrder ? now : now - 1000),
    updatedAtMs: now,
  };

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
 * Langganan real-time (onSnapshot) langsung ke koleksi 'oderan' di Firebase Firestore (default).
 * TIDAK menggunakan localStorage dan TIDAK mengisi data contoh bawaan (seperti Budi Santoso).
 * Jika koneksi ke Firebase Firestore (default) gagal, memicu callback onError untuk menampilkan pesan error merah di layar.
 */
export function subscribeToOrdersRealtime(
  onOrdersUpdate: (orders: Order[]) => void,
  onSyncStateChange?: (state: FirestoreSyncState) => void,
  onErrorChange?: (errorMsg: string | null) => void
): () => void {
  purgeLegacyLocalStorage();
  onSyncStateChange?.('connecting');

  const colRef = collection(db, ORDERS_COLLECTION);

  const unsubscribe = onSnapshot(
    colRef,
    (snapshot) => {
      onSyncStateChange?.('connected');
      onErrorChange?.(null);

      const loadedOrders: StoredOrderDocument[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data() as StoredOrderDocument;
        if (!data || !data.id) return;

        // Jika masih ada data contoh lama (seperti Budi Santoso / SLC-3893), hapus otomatis dari Firestore
        if (
          LEGACY_SAMPLE_IDS.has(data.id) ||
          data.customerName?.toLowerCase() === 'budi santoso'
        ) {
          void deleteDoc(doc(db, ORDERS_COLLECTION, docSnap.id)).catch(() => {});
          return;
        }

        loadedOrders.push(data);
      });

      // Urutkan pesanan: yang paling baru tampil paling atas
      loadedOrders.sort((a, b) => {
        const timeA = a.createdAtMs || a.updatedAtMs || 0;
        const timeB = b.createdAtMs || b.updatedAtMs || 0;
        return timeB - timeA;
      });

      onOrdersUpdate(loadedOrders);
    },
    (error) => {
      onSyncStateChange?.('error');
      const friendlyErr = formatFirebaseErrorMessage(
        error,
        'membaca data real-time'
      );
      onErrorChange?.(friendlyErr);
      try {
        handleFirestoreError(error, OperationType.LIST, ORDERS_COLLECTION);
      } catch (loggedErr) {
        console.error('Firestore real-time listener error:', loggedErr);
      }
    }
  );

  return unsubscribe;
}

/**
 * Simpan atau perbarui satu dokumen pesanan langsung ke koleksi 'oderan' di Firebase Firestore.
 * Jika gagal, lempar/kirim pesan error merah ke layar.
 */
export async function saveOrderToFirestore(
  order: Order,
  isNewOrder: boolean = false,
  onErrorChange?: (errorMsg: string | null) => void
): Promise<boolean> {
  purgeLegacyLocalStorage();
  const path = `${ORDERS_COLLECTION}/${order.id}`;
  const sanitized = sanitizeOrderForFirestore(order, isNewOrder);

  try {
    // Simpan ke koleksi utama 'oderan' di Firebase Firestore
    await setDoc(doc(db, ORDERS_COLLECTION, order.id), sanitized, { merge: true });

    onErrorChange?.(null);
    return true;
  } catch (error) {
    const friendlyErr = formatFirebaseErrorMessage(
      error,
      `menyimpan pesanan #${order.id}`
    );
    onErrorChange?.(friendlyErr);
    try {
      handleFirestoreError(
        error,
        isNewOrder ? OperationType.CREATE : OperationType.UPDATE,
        path
      );
    } catch (loggedErr) {
      console.error('Firestore save error:', loggedErr);
    }
    return false;
  }
}

/**
 * Hapus satu dokumen pesanan dari koleksi 'oderan' di Firebase Firestore.
 */
export async function deleteOrderFromFirestore(
  orderId: string,
  onErrorChange?: (errorMsg: string | null) => void
): Promise<boolean> {
  purgeLegacyLocalStorage();
  const path = `${ORDERS_COLLECTION}/${orderId}`;
  try {
    await deleteDoc(doc(db, ORDERS_COLLECTION, orderId));
    onErrorChange?.(null);
    return true;
  } catch (error) {
    const friendlyErr = formatFirebaseErrorMessage(
      error,
      `menghapus pesanan #${orderId}`
    );
    onErrorChange?.(friendlyErr);
    try {
      handleFirestoreError(error, OperationType.DELETE, path);
    } catch (loggedErr) {
      console.error('Firestore delete error:', loggedErr);
    }
    return false;
  }
}
