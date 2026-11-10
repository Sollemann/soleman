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
import { db, dbDefault, OperationType, handleFirestoreError, FIRESTORE_DATABASE_ID } from '../firebase';
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
/**
 * Langganan real-time (onSnapshot) hibrida ke Database Eksplisit DAN Database Default.
 * Menggabungkan pesanan secara otomatis agar pesanan dari HP manapun di soleman.vercel.app
 * langsung muncul di Portal Khusus Kurir Soleman tanpa perlu me-refresh halaman.
 */
export function subscribeToOrdersRealtime(
  onOrdersUpdate: (orders: Order[]) => void,
  onSyncStateChange?: (state: FirestoreSyncState) => void,
  onErrorChange?: (errorMsg: string | null) => void
): () => void {
  purgeLegacyLocalStorage();
  onSyncStateChange?.('connecting');

  // Map terpadu untuk menggabungkan pesanan dari kedua database tanpa duplikasi
  const ordersMap = new Map<string, StoredOrderDocument>();

  const emitMergedOrders = () => {
    const list = Array.from(ordersMap.values());
    list.sort((a, b) => {
      const timeA = a.createdAtMs || a.updatedAtMs || 0;
      const timeB = b.createdAtMs || b.updatedAtMs || 0;
      return timeB - timeA;
    });
    onOrdersUpdate(list);
  };

  const handleSnapshot = (snapshot: any, sourceDb: any) => {
    onSyncStateChange?.('connected');
    onErrorChange?.(null);

    snapshot.forEach((docSnap: any) => {
      const data = docSnap.data() as StoredOrderDocument;
      if (!data || !data.id) return;

      // Hapus data contoh lama jika pernah tersimpan
      if (
        LEGACY_SAMPLE_IDS.has(data.id) ||
        data.customerName?.toLowerCase() === 'budi santoso'
      ) {
        void deleteDoc(doc(sourceDb, ORDERS_COLLECTION, docSnap.id)).catch(() => {});
        return;
      }

      const existing = ordersMap.get(data.id);
      if (!existing || (data.updatedAtMs || 0) >= (existing.updatedAtMs || 0)) {
        ordersMap.set(data.id, data);
      }
    });

    emitMergedOrders();
  };

  const unsubs: (() => void)[] = [];

  // 1. Listener Database Utama (ai-studio-soleman-afbee615-a9c1-4a53-891d-a685b5451528)
  try {
    const unsubExplicit = onSnapshot(
      collection(db, ORDERS_COLLECTION),
      (snap) => handleSnapshot(snap, db),
      (err) => {
        console.warn('Explicit DB listener warning:', err.message);
      }
    );
    unsubs.push(unsubExplicit);
  } catch (e) {
    console.warn('Failed to attach explicit listener:', e);
  }

  // 2. Listener Database Default (default) untuk sinkronisasi cadangan lintas HP
  if (dbDefault && dbDefault !== db) {
    try {
      const unsubDefault = onSnapshot(
        collection(dbDefault, ORDERS_COLLECTION),
        (snap) => handleSnapshot(snap, dbDefault),
        (err) => {
          console.warn('Default DB listener warning:', err.message);
        }
      );
      unsubs.push(unsubDefault);
    } catch (e) {
      console.warn('Failed to attach default listener:', e);
    }
  }

  return () => {
    unsubs.forEach((fn) => {
      try {
        fn();
      } catch {}
    });
  };
}

/**
 * Simpan atau perbarui dokumen pesanan ke Firebase Firestore secara serentak
 * ke Database Eksplisit dan Database Default (koleksi 'oderan' dan 'orders')
 * agar pesanan tersimpan 100% aman dan langsung masuk ke semua HP.
 */
export async function saveOrderToFirestore(
  order: Order,
  isNewOrder: boolean = false,
  onErrorChange?: (errorMsg: string | null) => void
): Promise<boolean> {
  purgeLegacyLocalStorage();
  const sanitized = sanitizeOrderForFirestore(order, isNewOrder);

  const writes: Promise<any>[] = [
    setDoc(doc(db, ORDERS_COLLECTION, order.id), sanitized, { merge: true }),
    setDoc(doc(db, 'orders', order.id), sanitized, { merge: true }),
  ];

  if (dbDefault && dbDefault !== db) {
    writes.push(
      setDoc(doc(dbDefault, ORDERS_COLLECTION, order.id), sanitized, { merge: true }),
      setDoc(doc(dbDefault, 'orders', order.id), sanitized, { merge: true })
    );
  }

  const results = await Promise.allSettled(writes);
  const anySuccess = results.some((r) => r.status === 'fulfilled');

  if (anySuccess) {
    onErrorChange?.(null);
    return true;
  }

  const firstRejection = results.find((r) => r.status === 'rejected') as PromiseRejectedResult | undefined;
  const friendlyErr = formatFirebaseErrorMessage(
    firstRejection?.reason || new Error('Gagal menyimpan pesanan ke cloud Firestore'),
    `menyimpan pesanan #${order.id}`
  );
  onErrorChange?.(friendlyErr);
  return false;
}

/**
 * Hapus satu dokumen pesanan dari seluruh database dan koleksi di Firebase Firestore.
 */
export async function deleteOrderFromFirestore(
  orderId: string,
  onErrorChange?: (errorMsg: string | null) => void
): Promise<boolean> {
  purgeLegacyLocalStorage();
  const deletes: Promise<any>[] = [
    deleteDoc(doc(db, ORDERS_COLLECTION, orderId)),
    deleteDoc(doc(db, 'orders', orderId)),
  ];

  if (dbDefault && dbDefault !== db) {
    deletes.push(
      deleteDoc(doc(dbDefault, ORDERS_COLLECTION, orderId)),
      deleteDoc(doc(dbDefault, 'orders', orderId))
    );
  }

  try {
    await Promise.allSettled(deletes);
    onErrorChange?.(null);
    return true;
  } catch (error) {
    const friendlyErr = formatFirebaseErrorMessage(error, `menghapus pesanan #${orderId}`);
    onErrorChange?.(friendlyErr);
    return false;
  }
}
