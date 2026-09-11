import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAnalytics, isSupported, Analytics } from 'firebase/analytics';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  User,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  onSnapshot,
  serverTimestamp,
  Unsubscribe,
  getDocFromServer,
} from 'firebase/firestore';
import firebaseAppletConfig from '../../firebase-applet-config.json';
import { RemoteCommand, RemotePlayerState } from '../utils/remoteSync';

// Use project configuration from firebase-applet-config.json
export const firebaseConfig = {
  apiKey: firebaseAppletConfig.apiKey,
  authDomain: firebaseAppletConfig.authDomain,
  projectId: firebaseAppletConfig.projectId,
  storageBucket: firebaseAppletConfig.storageBucket,
  messagingSenderId: firebaseAppletConfig.messagingSenderId,
  appId: firebaseAppletConfig.appId,
  measurementId: firebaseAppletConfig.measurementId,
};

// Initialize Firebase App instance safely (prevent duplicate initialization)
export const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Use the specific firestoreDatabaseId if configured in firebase-applet-config.json
export const db =
  firebaseAppletConfig.firestoreDatabaseId &&
  firebaseAppletConfig.firestoreDatabaseId !== '(default)'
    ? getFirestore(app, firebaseAppletConfig.firestoreDatabaseId)
    : getFirestore(app);

// Initialize Firebase Analytics safely (supported in browser environments)
export let analytics: Analytics | null = null;
if (typeof window !== 'undefined') {
  isSupported().then((supported) => {
    if (supported) {
      analytics = getAnalytics(app);
      console.log('[Firebase] Analytics initialized successfully');
    }
  }).catch(() => {});
}

// Validate connection on startup (catch offline errors gracefully)
export async function testConnection(): Promise<void> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error: any) {
    // Offline or custom project rules - non-blocking as local broadcast channel handles sync
    console.warn('[Firebase] Initial connection check:', error?.message || error);
  }
}
testConnection();

export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

/**
 * Sign in with Google / Gmail
 */
export async function signInWithGoogle(): Promise<User> {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error: any) {
    console.error('[Firebase Auth] Error signing in with Google:', error);
    throw error;
  }
}

/**
 * Sign out current user
 */
export async function logoutFirebaseUser(): Promise<void> {
  try {
    await signOut(auth);
  } catch (error: any) {
    console.error('[Firebase Auth] Error signing out:', error);
    throw error;
  }
}

/**
 * Generate a clean 6-digit numeric pairing code
 */
export function generatePairingCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export interface RemoteSessionData {
  code: string;
  userId: string;
  userEmail: string | null;
  userName: string | null;
  userPhoto: string | null;
  createdAt: any;
  lastActive: any;
  lastCommand?: {
    command: RemoteCommand;
    value?: any;
    timestamp: number;
  } | null;
  playerState?: RemotePlayerState | null;
  paired: boolean;
}

/**
 * Register or restore a remote session in Firestore
 */
export async function initRemoteSession(
  user: User,
  existingCode?: string | null
): Promise<string> {
  // Use existing code from localStorage if available, or generate a new 6-digit code
  const code = existingCode || generatePairingCode();
  const sessionRef = doc(db, 'remote_sessions', code);

  try {
    const existingSnap = await getDoc(sessionRef);
    if (existingSnap.exists()) {
      await updateDoc(sessionRef, {
        userId: user.uid,
        userEmail: user.email,
        userName: user.displayName,
        userPhoto: user.photoURL,
        lastActive: serverTimestamp(),
      });
    } else {
      await setDoc(sessionRef, {
        code,
        userId: user.uid,
        userEmail: user.email,
        userName: user.displayName,
        userPhoto: user.photoURL,
        createdAt: serverTimestamp(),
        lastActive: serverTimestamp(),
        lastCommand: null,
        playerState: null,
        paired: false,
      });
    }
  } catch (err) {
    console.warn('[Firebase] Remote session init error:', err);
  }

  return code;
}

/**
 * Send command from Remote to Firestore
 */
export async function sendFirestoreCommand(
  code: string,
  command: RemoteCommand,
  value?: any
): Promise<void> {
  if (!code) return;
  const sessionRef = doc(db, 'remote_sessions', code);
  try {
    await updateDoc(sessionRef, {
      lastCommand: {
        command,
        value: value !== undefined ? value : null,
        timestamp: Date.now(),
      },
      lastActive: serverTimestamp(),
    });
  } catch (err) {
    console.warn('[Firebase] Error sending firestore command:', err);
  }
}

/**
 * Listen to remote session document (used by Remote tab to know pairing status and player state)
 */
export function subscribeToRemoteSession(
  code: string,
  onUpdate: (data: RemoteSessionData) => void
): Unsubscribe {
  const sessionRef = doc(db, 'remote_sessions', code);
  return onSnapshot(
    sessionRef,
    (snapshot) => {
      if (snapshot.exists()) {
        onUpdate(snapshot.data() as RemoteSessionData);
      }
    },
    (err) => {
      console.warn('[Firebase] Remote session subscribe error:', err);
    }
  );
}

/**
 * Main Player: Connect to a remote session via 6-digit code and listen for commands
 */
export function linkMainPlayerToSession(
  code: string,
  onCommand: (command: RemoteCommand, value?: any) => void,
  onSessionLinked: (session: RemoteSessionData) => void
): Unsubscribe {
  const sessionRef = doc(db, 'remote_sessions', code);
  let lastProcessedTimestamp = 0;

  return onSnapshot(
    sessionRef,
    (snapshot) => {
      if (!snapshot.exists()) return;
      const data = snapshot.data() as RemoteSessionData;
      onSessionLinked(data);

      if (
        data.lastCommand &&
        data.lastCommand.timestamp &&
        data.lastCommand.timestamp > lastProcessedTimestamp
      ) {
        lastProcessedTimestamp = data.lastCommand.timestamp;
        onCommand(data.lastCommand.command, data.lastCommand.value);
      }
    },
    (err) => {
      console.warn('[Firebase] Main player session subscribe error:', err);
    }
  );
}

/**
 * Main Player: Broadcast player state to the Firestore remote session
 */
export async function syncPlayerStateToFirestore(
  code: string,
  state: RemotePlayerState
): Promise<void> {
  if (!code) return;
  const sessionRef = doc(db, 'remote_sessions', code);
  try {
    await updateDoc(sessionRef, {
      playerState: state,
      paired: true,
      lastActive: serverTimestamp(),
    });
  } catch (err) {
    // Non-blocking
  }
}
