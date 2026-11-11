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
import firebaseAppletConfig from './firebase-applet-config.json';

// ID Database Firestore Eksplisit aktif di project soleman-cirebon
export const FIRESTORE_DATABASE_ID =
  firebaseAppletConfig.firestoreDatabaseId ||
  'ai-studio-soleman-afbee615-a9c1-4a53-891d-a685b5451528';

export const firebaseConfig = {
  ...firebaseAppletConfig,
  firestoreDatabaseId: FIRESTORE_DATABASE_ID,
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

// 1. Inisialisasi Database Eksplisit (ai-studio-soleman-afbee615-a9c1-4a53-891d-a685b5451528)
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

// 2. Inisialisasi Database Default (default) untuk kompatibilitas penuh antar-HP di Vercel
let defaultFirestoreInstance: Firestore;
try {
  defaultFirestoreInstance = initializeFirestore(app, {
    ignoreUndefinedProperties: true,
  });
} catch {
  defaultFirestoreInstance = getFirestore(app);
}
export const dbDefault: Firestore = defaultFirestoreInstance;
export const dbProvisioned: Firestore | null = defaultFirestoreInstance;

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

// Validate connection to Firestore on boot
export async function testFirestoreConnection(): Promise<{
  ok: boolean;
  errorMessage?: string;
}> {
  try {
    await getDocFromServer(doc(db, 'oderan', 'connection-test'));
    return { ok: true };
  } catch (error) {
    const rawMsg = error instanceof Error ? error.message : String(error);
    if (rawMsg.includes('the client is offline')) {
      console.error('Please check your Firebase configuration.');
    }
    return { ok: false, errorMessage: rawMsg };
  }
}
