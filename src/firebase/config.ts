// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAnalytics, isSupported, Analytics } from 'firebase/analytics';
import { getDatabase, Database, ref, onValue } from 'firebase/database';
import { getFirestore, Firestore, doc, getDocFromServer } from 'firebase/firestore';
import { getAuth, Auth, signInAnonymously } from 'firebase/auth';

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
export const firebaseConfig = {
  apiKey: "AIzaSyD-8ll3D3m-by9-vQaKTTX-r1V2JObXilc",
  authDomain: "onlinetv-2a646.firebaseapp.com",
  databaseURL: "https://onlinetv-2a646-default-rtdb.firebaseio.com",
  projectId: "onlinetv-2a646",
  storageBucket: "onlinetv-2a646.firebasestorage.app",
  messagingSenderId: "1058040740024",
  appId: "1:1058040740024:web:7aa0f956853363615c1c4d",
  measurementId: "G-G57E5F0HF8",
  firestoreDatabaseId: "ai-studio-onlinetv-1d545108-32c0-482e-b3ed-e8bf8aed53d4"
};

// Initialize Firebase
export const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Initialize Analytics
export let analytics: Analytics | null = null;
if (typeof window !== 'undefined') {
  isSupported().then((supported) => {
    if (supported) {
      analytics = getAnalytics(app);
      console.log('Firebase Analytics active with measurementId:', firebaseConfig.measurementId);
    }
  }).catch((err) => {
    console.debug('Firebase Analytics initialization:', err);
  });
}

// Realtime Database for Smart TV remote control & room pairing
let rtdbInstance: Database | null = null;
try {
  rtdbInstance = getDatabase(app);
  if (typeof window !== 'undefined' && rtdbInstance) {
    const connectedRef = ref(rtdbInstance, '.info/connected');
    onValue(connectedRef, (snap) => {
      if (snap.val() === true) {
        console.log('Firebase Realtime Database: Online & Connected');
      } else {
        console.log('Firebase Realtime Database: Waiting for connection...');
      }
    });
  }
} catch (err) {
  console.warn('Firebase RTDB warning:', err);
}
export const rtdb = rtdbInstance;

// Cloud Firestore Database
let firestoreInstance: Firestore | null = null;
try {
  firestoreInstance = getFirestore(app, firebaseConfig.firestoreDatabaseId);
} catch (err) {
  try {
    firestoreInstance = getFirestore(app);
  } catch (fallbackErr) {
    console.warn('Firestore initialization warning:', fallbackErr);
  }
}
export const db = firestoreInstance;

// Authentication
let authInstance: Auth | null = null;
try {
  authInstance = getAuth(app);
  if (typeof window !== 'undefined' && authInstance) {
    signInAnonymously(authInstance).catch((err) => {
      console.debug('Firebase Anonymous Auth status:', err?.code || err?.message);
    });
  }
} catch (err) {
  console.warn('Firebase Auth warning:', err);
}
export const auth = authInstance;

// Test connection on boot
export async function testConnection() {
  if (!db || typeof window === 'undefined') return;
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firebase connection check:', error.message);
    }
  }
}

testConnection();
