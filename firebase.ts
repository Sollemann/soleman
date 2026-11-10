/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { initializeApp } from 'firebase/app';
import { getAnalytics, isSupported } from 'firebase/analytics';
import { getAuth } from 'firebase/auth';
import {
  initializeFirestore,
  getFirestore,
  doc,
  getDocFromServer,
  Firestore,
} from 'firebase/firestore';
// ID Database Firestore Eksplisit sesuai permintaan pengguna
export const FIRESTORE_DATABASE_ID = 'ai-studio-soleman-a9ae4e15-e9c1-4a53-891d-a685b5451526';

// Konfigurasi resmi Firebase Soleman Cirebon tertulis langsung di dalam kode sumber
// agar berjalan 100% normal tanpa bergantung pada env variable lokal AI Studio saat di-deploy ke Vercel
export const firebaseConfig = {
  apiKey: 'AIzaSyBXyZHxsA5M_FRgMkD1qTw_6cvX87gzzbY',
  authDomain: 'soleman-cirebon.firebaseapp.com',
  projectId: 'soleman-cirebon',
  storageBucket: 'soleman-cirebon.firebasestorage.app',
  messagingSenderId: '386040967503',
  appId: '1:386040967503:web:7780bf3e3bb7720ebb953a',
  measurementId: 'G-FXQB2BDTFC',
};

// Initialize Firebase App
export const app = initializeApp(firebaseConfig);

// Initialize Analytics (aman untuk semua browser)
export const analyticsPromise =
  typeof window !== 'undefined'
    ? isSupported()
        .then((yes) => (yes ? getAnalytics(app) : null))
        .catch(() => null)
    : Promise.resolve(null);

// Initialize Firebase Auth
export const auth = getAuth(app);

// Inisialisasi Firebase Firestore dengan ID Database eksplisit:
// getFirestore(app, 'ai-studio-soleman-a9ae4e15-e9c1-4a53-891d-a685b5451526')
let firestoreInstance: Firestore;
try {
  firestoreInstance = initializeFirestore(
    app,
    { ignoreUndefinedProperties: true },
    FIRESTORE_DATABASE_ID
  );
} catch {
  firestoreInstance = getFirestore(app, FIRESTORE_DATABASE_ID);
}

export const db: Firestore = firestoreInstance;
export const dbProvisioned: Firestore | null = null;

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Validate connection to Firestore (default) on boot
export async function testFirestoreConnection(): Promise<{
  ok: boolean;
  errorMessage?: string;
}> {
  try {
    await getDocFromServer(doc(db, 'oderan', '__connection_test__'));
    return { ok: true };
  } catch (error) {
    const rawMsg = error instanceof Error ? error.message : String(error);
    if (rawMsg.includes('the client is offline')) {
      console.error('Please check your Firebase configuration.');
    }
    return { ok: false, errorMessage: rawMsg };
  }
}
