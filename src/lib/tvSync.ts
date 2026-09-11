import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  serverTimestamp,
  collection,
  query,
  where,
  limit,
  Unsubscribe,
} from 'firebase/firestore';
import { db } from './firebase';
import { TvRoomData, MediaItem } from '../types';

// BroadcastChannel for instant zero-latency multi-tab sync
const syncChannel: BroadcastChannel | null =
  typeof window !== 'undefined' && 'BroadcastChannel' in window
    ? new BroadcastChannel('embedmaster_tv_sync_channel')
    : null;

/**
 * Generates a unique 6-digit numeric room code (e.g., 583921)
 */
export function generateTvRoomCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * TV Page: Register and open a unique TV room session in Firestore + Local Sync
 */
export async function createTvRoom(
  roomCode: string,
  initialMedia?: MediaItem
): Promise<TvRoomData> {
  const roomRef = doc(db, 'tv_rooms', roomCode);
  const latestRef = doc(db, 'tv_rooms', '_latest_tv_room');

  const newRoom: TvRoomData = {
    roomCode,
    status: 'waiting',
    createdAt: Date.now(),
    lastActive: Date.now(),
    controllerId: null,
    currentMedia: initialMedia || null,
    playbackCommand: null,
    tvState: {
      isPlaying: true,
      volume: 100,
      currentTime: 0,
      duration: 0,
      title: initialMedia?.title || 'EmbedMaster Cinema TV',
      mediaType: initialMedia?.type || 'movie',
    },
  };

  // Local fallback storage for instant pairing across tabs
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(`embedmaster_active_tv_${roomCode}`, JSON.stringify(newRoom));
      localStorage.setItem('embedmaster_latest_tv_code', roomCode);
      syncChannel?.postMessage({ type: 'tv_opened', roomCode, room: newRoom });
      syncChannel?.postMessage({ type: 'room_created', room: newRoom });
    } catch (e) {
      // Storage quota or private mode
    }
  }

  // Cloud Firestore synchronization (adds room & broadcasts latest code to all clients)
  try {
    await setDoc(roomRef, {
      ...newRoom,
      createdAt: serverTimestamp(),
      lastActive: serverTimestamp(),
    });
    // Save to Firestore latest TV doc so any remote/cinema tab gets the exact code immediately
    await setDoc(latestRef, {
      latestRoomCode: roomCode,
      status: 'waiting',
      updatedAt: serverTimestamp(),
      createdAt: Date.now(),
    });
  } catch (err: any) {
    console.warn('[Firebase TV] Firestore setDoc warning (will use local channel fallback):', err?.message);
  }

  return newRoom;
}

/**
 * Listen in real-time to the latest TV code opened on any tab or device
 */
export function subscribeToLatestTvCode(
  callback: (code: string | null) => void
): Unsubscribe {
  // 1. Check local storage first for instantaneous availability
  if (typeof window !== 'undefined') {
    const cached = localStorage.getItem('embedmaster_latest_tv_code');
    if (cached) callback(cached);
  }

  // 2. Multi-tab BroadcastChannel listener for zero latency
  const handleMessage = (e: MessageEvent) => {
    if (!e.data) return;
    if (
      e.data.type === 'tv_opened' ||
      e.data.type === 'room_created' ||
      e.data.type === 'embedmaster_tv_opened'
    ) {
      const code = e.data.roomCode || e.data.room?.roomCode;
      if (code) {
        callback(code);
      }
    }
  };

  syncChannel?.addEventListener('message', handleMessage);

  if (typeof window !== 'undefined') {
    window.addEventListener('message', handleMessage);
  }

  // 3. Storage event listener (fires across tabs on same origin when localStorage is modified)
  const handleStorage = (e: StorageEvent) => {
    if (e.key === 'embedmaster_latest_tv_code' && e.newValue) {
      callback(e.newValue);
    }
  };

  if (typeof window !== 'undefined') {
    window.addEventListener('storage', handleStorage);
  }

  // 4. Firestore: Immediate getDoc to fetch latest code from database right away
  const latestRef = doc(db, 'tv_rooms', '_latest_tv_room');
  getDoc(latestRef)
    .then((snap) => {
      if (snap.exists()) {
        const data = snap.data();
        if (data?.latestRoomCode) {
          callback(data.latestRoomCode);
        }
      }
    })
    .catch((err) => {
      console.warn('[Firebase TV] Initial getDoc latest TV warning:', err?.message);
    });

  // 5. Firestore real-time snapshot for cross-device & cross-tab support
  const firestoreUnsub = onSnapshot(
    latestRef,
    (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        if (data?.latestRoomCode) {
          callback(data.latestRoomCode);
        }
      }
    },
    (err) => {
      console.warn('[Firebase TV] latestRoomCode snapshot fallback warning:', err?.message);
    }
  );

  // 6. Backup polling interval (every 2.5 seconds) to ensure fresh sync even if tab sleeps
  const pollInterval = setInterval(() => {
    getDoc(latestRef)
      .then((snap) => {
        if (snap.exists()) {
          const data = snap.data();
          if (data?.latestRoomCode) {
            callback(data.latestRoomCode);
          }
        }
      })
      .catch(() => {});
  }, 2500);

  return () => {
    clearInterval(pollInterval);
    syncChannel?.removeEventListener('message', handleMessage);
    if (typeof window !== 'undefined') {
      window.removeEventListener('message', handleMessage);
      window.removeEventListener('storage', handleStorage);
    }
    firestoreUnsub();
  };
}

/**
 * TV Page: Terminate/disconnect session when TV page closes
 */
export async function terminateTvRoom(roomCode: string): Promise<void> {
  if (!roomCode) return;
  const roomRef = doc(db, 'tv_rooms', roomCode);

  // Local cleanup
  if (typeof window !== 'undefined') {
    try {
      localStorage.removeItem(`embedmaster_active_tv_${roomCode}`);
      syncChannel?.postMessage({ type: 'room_terminated', roomCode });
    } catch (e) {}
  }

  // Cloud Firestore cleanup
  try {
    await updateDoc(roomRef, {
      status: 'terminated',
      lastActive: serverTimestamp(),
    });
    await deleteDoc(roomRef);
  } catch (err) {
    // Non-blocking
  }
}

/**
 * Main Page / Remote: Claim and activate an available TV room code
 */
export async function claimTvRoom(
  roomCode: string,
  controllerId: string = 'remote-' + Math.random().toString(36).substring(2, 8)
): Promise<{ success: boolean; error?: string; room?: TvRoomData }> {
  if (!roomCode || roomCode.trim().length === 0) {
    return { success: false, error: 'Please enter a valid TV Room Code' };
  }

  const cleanCode = roomCode.trim();
  const roomRef = doc(db, 'tv_rooms', cleanCode);

  let roomData: TvRoomData | null = null;
  let fromLocal = false;

  // 1. First attempt: Query Cloud Firestore
  try {
    const snap = await getDoc(roomRef);
    if (snap.exists()) {
      roomData = snap.data() as TvRoomData;
    }
  } catch (err: any) {
    console.warn('[Firebase TV] Firestore getDoc failed/offline, checking local channel:', err?.message);
  }

  // 2. Fallback: Check local multi-tab cache
  if (!roomData && typeof window !== 'undefined') {
    try {
      const cached = localStorage.getItem(`embedmaster_active_tv_${cleanCode}`);
      if (cached) {
        roomData = JSON.parse(cached);
        fromLocal = true;
      }
    } catch (e) {}
  }

  // If room wasn't found in either Firestore or local tab cache
  if (!roomData) {
    return {
      success: false,
      error: `Room Code "${cleanCode}" does not exist. Please open the TV page first.`,
    };
  }

  // Validate room status
  if (roomData.status === 'terminated') {
    return {
      success: false,
      error: `Room "${cleanCode}" has been closed by the TV screen.`,
    };
  }

  // Claim or re-activate room locally
  const updatedRoom: TvRoomData = {
    ...roomData,
    status: 'connected',
    controllerId,
    lastActive: Date.now(),
  };

  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(`embedmaster_active_tv_${cleanCode}`, JSON.stringify(updatedRoom));
      syncChannel?.postMessage({ type: 'room_claimed', room: updatedRoom });
    } catch (e) {}
  }

  // Claim room in Cloud Firestore
  try {
    await updateDoc(roomRef, {
      status: 'connected',
      controllerId,
      lastActive: serverTimestamp(),
    });
  } catch (err: any) {
    console.warn('[Firebase TV] Firestore updateDoc claim warning:', err?.message);
    // If local was successful, still return success to the user so pairing is seamless
  }

  return {
    success: true,
    room: updatedRoom,
  };
}

/**
 * Main Page / Remote: Send command to the connected TV room in real-time
 */
export async function sendTvCommand(
  roomCode: string,
  action: 'play' | 'pause' | 'seek' | 'time_jump' | 'volume' | 'mute' | 'unmute' | 'fullscreen' | 'play_media' | 'reload',
  value?: any
): Promise<void> {
  if (!roomCode) return;
  const roomRef = doc(db, 'tv_rooms', roomCode);

  const commandPayload = {
    action,
    value: value !== undefined ? value : null,
    timestamp: Date.now(),
  };

  // 1. Instant multi-tab broadcast
  if (typeof window !== 'undefined') {
    try {
      syncChannel?.postMessage({
        type: 'playback_command',
        roomCode,
        command: commandPayload,
      });

      // Also trigger a storage event for cross-tab listeners
      localStorage.setItem(
        `embedmaster_cmd_${roomCode}`,
        JSON.stringify(commandPayload)
      );
    } catch (e) {}
  }

  // 2. Cloud Firestore update for cross-device sync
  const firestorePayload: any = {
    playbackCommand: commandPayload,
    lastActive: serverTimestamp(),
  };

  if (action === 'play_media' && value) {
    firestorePayload.currentMedia = value;
  }

  try {
    await updateDoc(roomRef, firestorePayload);
  } catch (err: any) {
    console.warn('[Firebase TV] Firestore sendTvCommand warning:', err?.message);
  }
}

/**
 * TV Page: Continuously sync live playback state back to Firestore & Local
 */
export async function syncTvPlayerState(
  roomCode: string,
  state: {
    isPlaying: boolean;
    volume: number;
    currentTime: number;
    duration: number;
    title: string;
    mediaType: string;
  }
): Promise<void> {
  if (!roomCode) return;
  const roomRef = doc(db, 'tv_rooms', roomCode);

  if (typeof window !== 'undefined') {
    try {
      syncChannel?.postMessage({
        type: 'tv_state_update',
        roomCode,
        state,
      });
    } catch (e) {}
  }

  try {
    await updateDoc(roomRef, {
      tvState: state,
      lastActive: serverTimestamp(),
    });
  } catch (err) {
    // Non-blocking
  }
}

/**
 * Real-time subscription to a specific TV Room document (Hybrid: Firestore + BroadcastChannel)
 */
export function subscribeToTvRoom(
  roomCode: string,
  onUpdate: (room: TvRoomData | null) => void
): Unsubscribe {
  const roomRef = doc(db, 'tv_rooms', roomCode);

  // Handle local channel messages (0ms latency between tabs on same browser)
  const handleChannelMessage = (event: MessageEvent) => {
    const data = event.data;
    if (!data) return;

    if (data.type === 'playback_command' && data.roomCode === roomCode) {
      onUpdate({
        roomCode,
        status: 'connected',
        createdAt: null,
        lastActive: Date.now(),
        controllerId: 'local-controller',
        currentMedia: data.command.action === 'play_media' ? data.command.value : null,
        playbackCommand: data.command,
        tvState: null,
      });
    } else if (data.type === 'room_claimed' && data.room?.roomCode === roomCode) {
      onUpdate(data.room);
    } else if (data.type === 'room_terminated' && data.roomCode === roomCode) {
      onUpdate(null);
    }
  };

  syncChannel?.addEventListener('message', handleChannelMessage);

  // Also listen to storage events
  const handleStorageEvent = (e: StorageEvent) => {
    if (e.key === `embedmaster_cmd_${roomCode}` && e.newValue) {
      try {
        const cmd = JSON.parse(e.newValue);
        onUpdate({
          roomCode,
          status: 'connected',
          createdAt: null,
          lastActive: Date.now(),
          controllerId: 'storage-controller',
          currentMedia: cmd.action === 'play_media' ? cmd.value : null,
          playbackCommand: cmd,
          tvState: null,
        });
      } catch (err) {}
    }
  };
  window.addEventListener('storage', handleStorageEvent);

  // Firestore Snapshot listener for cross-device updates
  const firestoreUnsub = onSnapshot(
    roomRef,
    (snap) => {
      if (snap.exists()) {
        onUpdate(snap.data() as TvRoomData);
      }
    },
    (err) => {
      console.warn('[Firebase TV] Room subscribe snapshot warning:', err?.message);
    }
  );

  return () => {
    firestoreUnsub();
    syncChannel?.removeEventListener('message', handleChannelMessage);
    window.removeEventListener('storage', handleStorageEvent);
  };
}

/**
 * Main Page / Remote: Subscribe to all currently available waiting TV rooms
 */
export function subscribeToAvailableTvRooms(
  onUpdate: (rooms: TvRoomData[]) => void
): Unsubscribe {
  const roomsColl = collection(db, 'tv_rooms');
  const q = query(roomsColl, where('status', '==', 'waiting'), limit(8));

  // Check local active rooms as immediate seed
  if (typeof window !== 'undefined') {
    try {
      const localRooms: TvRoomData[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('embedmaster_active_tv_')) {
          const val = localStorage.getItem(key);
          if (val) {
            const parsed = JSON.parse(val);
            if (parsed.status === 'waiting') {
              localRooms.push(parsed);
            }
          }
        }
      }
      if (localRooms.length > 0) {
        onUpdate(localRooms);
      }
    } catch (e) {}
  }

  // Firestore snapshot listener
  const firestoreUnsub = onSnapshot(
    q,
    (snapshot) => {
      const rooms: TvRoomData[] = [];
      snapshot.forEach((docSnap) => {
        rooms.push(docSnap.data() as TvRoomData);
      });
      onUpdate(rooms);
    },
    (err) => {
      console.warn('[Firebase TV] Available rooms query warning:', err?.message);
    }
  );

  return () => {
    firestoreUnsub();
  };
}
