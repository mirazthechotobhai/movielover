import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getDatabase,
  ref,
  set,
  update,
  onValue,
  onDisconnect,
  get,
  Database,
  DatabaseReference,
  Unsubscribe
} from 'firebase/database';
import { RoomState } from '../types';

// Provided Firebase Configuration
export const firebaseConfig = {
  apiKey: "AIzaSyBxXHINOSQ1MOX6E0X0m0bL1u-fvOyRaTI",
  authDomain: "gotocinemaonline.firebaseapp.com",
  projectId: "gotocinemaonline",
  storageBucket: "gotocinemaonline.firebasestorage.app",
  messagingSenderId: "556702320765",
  appId: "1:556702320765:web:181b15c8d61706c5098914",
  measurementId: "G-7KM49GD56Y",
  // Standard Realtime Database URL
  databaseURL: "https://gotocinemaonline-default-rtdb.firebaseio.com"
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

let database: Database | null = null;
try {
  database = getDatabase(app);
} catch (err) {
  console.warn("Firebase RTDB init note:", err);
}

export { database };

// Cross-tab broadcast channel for local multi-tab sync
const broadcastChannel = typeof window !== 'undefined' && 'BroadcastChannel' in window
  ? new BroadcastChannel('streamcast_rooms_channel')
  : null;

function getLocalRoom(roomCode: string): RoomState | null {
  try {
    const raw = localStorage.getItem(`room_${roomCode}`);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function setLocalRoom(roomCode: string, state: RoomState | null) {
  try {
    if (!state) {
      localStorage.removeItem(`room_${roomCode}`);
    } else {
      localStorage.setItem(`room_${roomCode}`, JSON.stringify(state));
    }
  } catch {}
}

/**
 * Generate a random 4-digit numeric room code (e.g. 4829)
 */
export function generateRoomCode(): string {
  const code = Math.floor(1000 + Math.random() * 9000);
  return code.toString();
}

/**
 * Initialize a new room node in both Server Relay Hub & Firebase Realtime Database
 */
export async function initializeRoom(
  roomCode: string,
  initialMedia?: RoomState['media']
): Promise<{ ref: DatabaseReference | null; defaultState: RoomState }> {
  const defaultState: RoomState = {
    roomCode,
    isPlaying: false,
    currentTime: 0,
    action: 'none',
    actionTimestamp: Date.now(),
    volume: 1,
    status: 'waiting',
    media: initialMedia || {
      id: 'tt31193180',
      title: 'Featured Movie',
      type: 'movie',
      releaseYear: '2024',
      overview: 'Experience high quality streaming controlled straight from your phone.'
    },
    lastUpdated: Date.now()
  };

  setLocalRoom(roomCode, defaultState);

  if (broadcastChannel) {
    broadcastChannel.postMessage({ type: 'ROOM_UPDATE', roomCode, state: defaultState });
  }

  // 1. Sync to Server Relay Hub
  try {
    await fetch(`/api/rooms/${roomCode}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(defaultState)
    });
  } catch (err) {
    console.warn("Server room init warning:", err);
  }

  // 2. Sync to Firebase Realtime Database if available
  let roomRef: DatabaseReference | null = null;
  if (database) {
    try {
      roomRef = ref(database, `rooms/${roomCode}`);
      await set(roomRef, defaultState);
      try {
        await onDisconnect(roomRef).remove();
      } catch {}
    } catch (err) {
      console.info("Firebase RTDB status: Using active Server Relay Hub");
    }
  }

  return { ref: roomRef, defaultState };
}

/**
 * Subscribe to changes on a room node using Server-Sent Events, Firebase RTDB, and Local Broadcast
 */
export function subscribeToRoom(
  roomCode: string,
  onUpdate: (state: RoomState | null) => void
): () => void {
  let unsubFirebase: Unsubscribe | null = null;
  let eventSource: EventSource | null = null;
  let pollInterval: NodeJS.Timeout | null = null;

  // Initial local state delivery
  const localInitial = getLocalRoom(roomCode);
  if (localInitial) {
    onUpdate(localInitial);
  }

  // 1. Connect via Server-Sent Events (SSE) for instantaneous cross-device sync
  if (typeof window !== 'undefined' && 'EventSource' in window) {
    try {
      eventSource = new EventSource(`/api/rooms/${roomCode}/stream`);
      eventSource.onmessage = (event) => {
        try {
          if (!event.data) return;
          const data = JSON.parse(event.data);
          if (data) {
            setLocalRoom(roomCode, data);
            onUpdate(data);
          } else {
            onUpdate(null);
          }
        } catch (e) {
          console.warn("SSE parse error:", e);
        }
      };

      eventSource.onerror = () => {
        // Fallback to active polling if SSE disconnects
        if (!pollInterval) {
          pollInterval = setInterval(async () => {
            try {
              const res = await fetch(`/api/rooms/${roomCode}`);
              if (res.ok) {
                const data = await res.json();
                setLocalRoom(roomCode, data);
                onUpdate(data);
              }
            } catch {}
          }, 1000);
        }
      };
    } catch (err) {
      console.warn("EventSource setup warning:", err);
    }
  }

  // 2. Fetch initial state immediately from Server
  fetch(`/api/rooms/${roomCode}`)
    .then((res) => (res.ok ? res.json() : null))
    .then((data) => {
      if (data) {
        setLocalRoom(roomCode, data);
        onUpdate(data);
      }
    })
    .catch(() => {});

  // 3. Connect to Firebase Realtime Database
  if (database) {
    try {
      const roomRef = ref(database, `rooms/${roomCode}`);
      unsubFirebase = onValue(
        roomRef,
        (snapshot) => {
          if (snapshot.exists()) {
            const data = snapshot.val() as RoomState;
            setLocalRoom(roomCode, data);
            onUpdate(data);
          }
        },
        (error) => {
          console.info("Firebase RTDB notice: Server stream active", error.message);
        }
      );
    } catch (err) {
      console.warn("RTDB listener notice:", err);
    }
  }

  // 4. Local BroadcastChannel for instant same-browser multi-tab updates
  const handleBroadcast = (event: MessageEvent) => {
    if (event.data && event.data.roomCode === roomCode) {
      if (event.data.type === 'ROOM_UPDATE') {
        onUpdate(event.data.state);
      } else if (event.data.type === 'ROOM_REMOVED') {
        onUpdate(null);
      }
    }
  };

  if (broadcastChannel) {
    broadcastChannel.addEventListener('message', handleBroadcast);
  }

  // 5. LocalStorage fallback
  const handleStorage = (e: StorageEvent) => {
    if (e.key === `room_${roomCode}`) {
      if (e.newValue) {
        try {
          onUpdate(JSON.parse(e.newValue));
        } catch {}
      } else {
        onUpdate(null);
      }
    }
  };
  window.addEventListener('storage', handleStorage);

  return () => {
    if (eventSource) eventSource.close();
    if (pollInterval) clearInterval(pollInterval);
    if (unsubFirebase) unsubFirebase();
    if (broadcastChannel) broadcastChannel.removeEventListener('message', handleBroadcast);
    window.removeEventListener('storage', handleStorage);
  };
}

/**
 * Check if a room exists before connecting
 */
export async function checkRoomExists(roomCode: string): Promise<boolean> {
  // Check Server Hub
  try {
    const res = await fetch(`/api/rooms/${roomCode}`);
    if (res.ok) return true;
  } catch {}

  // Check Firebase RTDB
  if (database) {
    try {
      const roomRef = ref(database, `rooms/${roomCode}`);
      const snap = await get(roomRef);
      if (snap.exists()) return true;
    } catch {}
  }

  // Check Local
  return getLocalRoom(roomCode) !== null;
}

/**
 * Update room state in Server Hub, Firebase Realtime Database, and Local storage
 */
export async function updateRoomState(
  roomCode: string,
  partialState: Partial<RoomState>
): Promise<void> {
  const current = getLocalRoom(roomCode) || ({ roomCode } as RoomState);
  const updated: RoomState = {
    ...current,
    ...partialState,
    roomCode,
    lastUpdated: Date.now(),
  };

  setLocalRoom(roomCode, updated);

  if (broadcastChannel) {
    broadcastChannel.postMessage({
      type: 'ROOM_UPDATE',
      roomCode,
      state: updated,
    });
  }

  // 1. Push to Server Hub (broadcasts to all SSE listeners in milliseconds)
  try {
    await fetch(`/api/rooms/${roomCode}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(partialState)
    });
  } catch (err) {
    console.warn("Server update warning:", err);
  }

  // 2. Push to Firebase Realtime Database
  if (database) {
    try {
      const roomRef = ref(database, `rooms/${roomCode}`);
      await update(roomRef, {
        ...partialState,
        lastUpdated: Date.now(),
      });
    } catch {}
  }
}

/**
 * Remove room
 */
export async function removeRoom(roomCode: string): Promise<void> {
  setLocalRoom(roomCode, null);

  if (broadcastChannel) {
    broadcastChannel.postMessage({
      type: 'ROOM_REMOVED',
      roomCode,
    });
  }

  try {
    await fetch(`/api/rooms/${roomCode}`, { method: 'DELETE' });
  } catch {}

  if (database) {
    try {
      const roomRef = ref(database, `rooms/${roomCode}`);
      await set(roomRef, null);
    } catch {}
  }
}
