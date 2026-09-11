import { initializeApp, getApps, getApp } from "firebase/app";
import { getAnalytics, isSupported } from "firebase/analytics";
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  deleteDoc, 
  getDocs, 
  query, 
  orderBy, 
  serverTimestamp 
} from "firebase/firestore";
import { getAuth, signInAnonymously } from "firebase/auth";
import { WatchlistItem } from "../types";

// User provided Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBS8Tnh6bo1cD6eDe0JeVOb58h4mpP0Bcs",
  authDomain: "gotocinema-275da.firebaseapp.com",
  projectId: "gotocinema-275da",
  storageBucket: "gotocinema-275da.firebasestorage.app",
  messagingSenderId: "208207695827",
  appId: "1:208207695827:web:cd8978702a24dc55796926",
  measurementId: "G-GG8328HQJN"
};

// Initialize Firebase App
export const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const db = getFirestore(app);
export const auth = getAuth(app);

// Optional analytics initialization
if (typeof window !== "undefined") {
  isSupported().then((supported) => {
    if (supported) {
      getAnalytics(app);
    }
  }).catch(() => {
    // Ignore analytics unsupported error in restricted iframes
  });
}

const LOCAL_STORAGE_WATCHLIST_KEY = "gotocinema_tv_watchlist";

// Get local watchlist
export function getLocalWatchlist(): WatchlistItem[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_WATCHLIST_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

// Save local watchlist
function setLocalWatchlist(items: WatchlistItem[]) {
  try {
    localStorage.setItem(LOCAL_STORAGE_WATCHLIST_KEY, JSON.stringify(items));
  } catch {
    // LocalStorage quota or restricted
  }
}

// Ensure anonymous authentication for the TV device
let currentUserId: string | null = null;
async function ensureAuthUser(): Promise<string> {
  if (currentUserId) return currentUserId;
  if (auth.currentUser) {
    currentUserId = auth.currentUser.uid;
    return currentUserId;
  }
  try {
    const cred = await signInAnonymously(auth);
    currentUserId = cred.user.uid;
    return currentUserId;
  } catch {
    // If anonymous auth is not enabled in Firebase console, fallback to local persistent ID
    let guestId = localStorage.getItem("gotocinema_tv_device_id");
    if (!guestId) {
      guestId = "tv_guest_" + Math.random().toString(36).substring(2, 10);
      localStorage.setItem("gotocinema_tv_device_id", guestId);
    }
    currentUserId = guestId;
    return currentUserId;
  }
}

// Fetch Watchlist (Syncs Firebase & LocalStorage)
export async function fetchWatchlist(): Promise<WatchlistItem[]> {
  const localItems = getLocalWatchlist();
  try {
    const uid = await ensureAuthUser();
    const q = query(
      collection(db, "users", uid, "watchlist"),
      orderBy("addedAt", "desc")
    );
    const snap = await getDocs(q);
    if (!snap.empty) {
      const remoteItems: WatchlistItem[] = snap.docs.map(d => d.data() as WatchlistItem);
      setLocalWatchlist(remoteItems);
      return remoteItems;
    }
  } catch (err) {
    console.warn("Firestore sync unavailable, using local store:", err);
  }
  return localItems;
}

// Add item to Watchlist
export async function addToWatchlist(item: WatchlistItem): Promise<void> {
  const current = getLocalWatchlist();
  const exists = current.some(i => i.tmdbId === item.tmdbId && i.mediaType === item.mediaType);
  if (!exists) {
    const updated = [item, ...current];
    setLocalWatchlist(updated);
  }

  try {
    const uid = await ensureAuthUser();
    const docRef = doc(db, "users", uid, "watchlist", `${item.mediaType}_${item.tmdbId}`);
    await setDoc(docRef, {
      ...item,
      updatedAt: serverTimestamp()
    });
  } catch (err) {
    console.warn("Firestore write error (using local storage fallback):", err);
  }
}

// Remove item from Watchlist
export async function removeFromWatchlist(tmdbId: number, mediaType: 'movie' | 'tv' | 'anime'): Promise<void> {
  const current = getLocalWatchlist();
  const updated = current.filter(i => !(i.tmdbId === tmdbId && i.mediaType === mediaType));
  setLocalWatchlist(updated);

  try {
    const uid = await ensureAuthUser();
    const docRef = doc(db, "users", uid, "watchlist", `${mediaType}_${tmdbId}`);
    await deleteDoc(docRef);
  } catch (err) {
    console.warn("Firestore delete error (using local storage fallback):", err);
  }
}
