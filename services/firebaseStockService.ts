/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { collection, doc, setDoc, onSnapshot } from 'firebase/firestore';
import { db, dbDefault } from '../firebase';
import { ServiceStockItem } from '../types';

export const STOCK_COLLECTION = 'stok_layanan';

export function subscribeToStockStatus(
  onStockUpdate: (stockMap: Record<string, ServiceStockItem>) => void
): () => void {
  const stockMap: Record<string, ServiceStockItem> = {};
  const unsubs: (() => void)[] = [];

  const handleSnapshot = (snapshot: any) => {
    snapshot.forEach((docSnap: any) => {
      const data = docSnap.data() as ServiceStockItem;
      if (!data || !data.serviceId) return;
      const existing = stockMap[data.serviceId];
      if (!existing || (data.updatedAtMs || 0) >= (existing.updatedAtMs || 0)) {
        stockMap[data.serviceId] = data;
      }
    });
    onStockUpdate({ ...stockMap });
  };

  try {
    unsubs.push(
      onSnapshot(collection(db, STOCK_COLLECTION), handleSnapshot, () => {
        // Fallback gracefully if network unavailable
      })
    );
  } catch {
    // Ignore
  }

  if (dbDefault && dbDefault !== db) {
    try {
      unsubs.push(
        onSnapshot(collection(dbDefault, STOCK_COLLECTION), handleSnapshot, () => {})
      );
    } catch {
      // Ignore
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

export async function saveServiceStockStatus(
  serviceId: string,
  isOutOfStock: boolean,
  emptySizes: string[] = [],
  note: string = ''
): Promise<boolean> {
  const payload: ServiceStockItem = {
    serviceId,
    isOutOfStock,
    emptySizes: emptySizes.filter(Boolean),
    note: note.trim(),
    updatedAt: new Date().toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' }),
    updatedAtMs: Date.now(),
  };

  const writes: Promise<any>[] = [
    setDoc(doc(db, STOCK_COLLECTION, serviceId), payload, { merge: true }),
  ];
  if (dbDefault && dbDefault !== db) {
    writes.push(setDoc(doc(dbDefault, STOCK_COLLECTION, serviceId), payload, { merge: true }));
  }

  const results = await Promise.allSettled(writes);
  return results.some((r) => r.status === 'fulfilled');
}

export function isServiceOrSizeOutOfStock(
  stockMap: Record<string, ServiceStockItem> | undefined,
  serviceId: string,
  shoeSize?: string
): { blocked: boolean; reason?: string } {
  if (!stockMap) return { blocked: false };
  const entry = stockMap[serviceId];
  if (!entry) return { blocked: false };

  if (entry.isOutOfStock) {
    return {
      blocked: true,
      reason: entry.note || 'Stok bahan / tapak untuk menu ini sedang kosong.',
    };
  }

  if (shoeSize && Array.isArray(entry.emptySizes) && entry.emptySizes.includes(shoeSize)) {
    return {
      blocked: true,
      reason: entry.note || `Stok tapak ukuran EU ${shoeSize} sedang kosong.`,
    };
  }

  return { blocked: false };
}
