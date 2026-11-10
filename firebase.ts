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
import appletConfig from './firebase-applet-config.json';

// Konfigurasi Firebase Soleman Cirebon (menggabungkan kredensial user & database yang diprovisikan)
export const firebaseConfig = {
  apiKey: appletConfig.apiKey || 'AIzaSyBXyZHxsA5M_FRgMkD1qTw_6cvX87gzzbY',
  authDomain: appletConfig.authDomain || 'soleman-cirebon.firebaseapp.com',
  projectId: appletConfig.projectId || 'soleman-cirebon',
  storageBucket: appletConfig.storageBucket || 'soleman-cirebon.firebasestorage.app',
  messagingSenderId: appletConfig.messagingSenderId || '386040967503',
  appId: appletConfig.appId || '1:386040967503:web:7780bf3e3bb7720ebb953a',
  measurementId: appletConfig.measurementId || 'G-FXQB2BDTFC',
  firestoreDatabaseId: appletConfig.firestoreDatabaseId,
};

// Initialize Firebase App
export const app = initializeApp(firebaseConfig);

// Initialize Firebase Analytics (ketika didukung oleh browser)
export const analyticsPromise =
  typeof window !== 'undefined'
    ? isSupported()
        .then((yes) => (yes ? getAnalytics(app) : null))
        .catch(() => null)
    : Promise.resolve(null);

// Initialize Firebase Auth
export const auth = getAuth(app);

// Initialize Cloud Firestore dengan ignoreUndefinedProperties agar field opsional tidak memicu error
let firestoreInstance: Firestore;
try {
  firestoreInstance = initializeFirestore(
    app,
    { ignoreUndefinedProperties: true },
    firebaseConfig.firestoreDatabaseId
  );
} catch {
  firestoreInstance = getFirestore(app, firebaseConfig.firestoreDatabaseId);
}

export const db = firestoreInstance;

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

// Validate connection to Firestore on startup
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.includes('the client is offline')
    ) {
      console.error('Please check your Firebase configuration.');
    }
  }
}

if (typeof window !== 'undefined') {
  testConnection();
}
