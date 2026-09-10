import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getDatabase,
  ref,
  set,
  get,
  onValue,
  update,
  remove,
  onDisconnect,
  runTransaction,
  Database,
} from 'firebase/database';
import { syncManager } from '../utils/syncChannel';

export const rtdbFirebaseConfig = {
  apiKey: 'AIzaSyBxXHINOSQ1MOX6E0X0m0bL1u-fvOyRaTI',
  authDomain: 'gotocinemaonline.firebaseapp.com',
  databaseURL: 'https://gotocinemaonline-default-rtdb.firebaseio.com',
  projectId: 'gotocinemaonline',
  storageBucket: 'gotocinemaonline.firebasestorage.app',
  messagingSenderId: '556702320765',
  appId: '1:556702320765:web:181b15c8d61706c5098914',
  measurementId: 'G-7KM49GD56Y',
};

// Initialize dedicated secondary app instance for Realtime Database
const RTDB_APP_NAME = 'gotocinemaonline';
const existingRtdbApp = getApps().find((a) => a.name === RTDB_APP_NAME);
const app = existingRtdbApp || initializeApp(rtdbFirebaseConfig, RTDB_APP_NAME);

let database: Database | null = null;
try {
  database = getDatabase(app);
} catch (err) {
  console.warn('Realtime database initialization note:', err);
}

export { database };

export interface RoomState {
  roomCode: string;
  isClaimed?: boolean;
  ownerId?: string | null;
  isPlaying: boolean;
  currentTime: number;
  duration?: number;
  action: 'none' | 'play' | 'pause' | 'close' | 'seek' | 'volume' | 'loadMedia';
  actionTimestamp?: number;
  volume: number; // 0 to 1
  status: 'waiting' | 'connected' | 'closed';
  mediaTitle?: string;
  mediaId?: string | number;
  mediaType?: 'movie' | 'tv';
  season?: number;
  episode?: number;
  posterPath?: string | null;
  backdropPath?: string | null;
  lastUpdated?: number;
}

// Generate unique pairing code with TV-XXXX format (e.g., TV-8492)
export function generateRoomCode(): string {
  const digits = Math.floor(1000 + Math.random() * 9000).toString();
  return `TV-${digits}`;
}

// Normalize room code to TV-XXXX format
export function normalizeRoomCode(code: string): string {
  if (!code) return '';
  const trimmed = code.trim().toUpperCase();
  if (/^\d{4}$/.test(trimmed)) {
    return `TV-${trimmed}`;
  }
  return trimmed;
}

// Get or create unique remote device/browser ID
export function getRemoteDeviceId(): string {
  if (typeof window === 'undefined') return 'remote_browser_dev';
  try {
    let id = localStorage.getItem('remote_device_id');
    if (!id) {
      id = 'dev_' + Math.random().toString(36).substring(2, 11) + '_' + Date.now().toString(36);
      localStorage.setItem('remote_device_id', id);
    }
    return id;
  } catch {
    return 'remote_device_' + Math.random().toString(36).substring(2, 9);
  }
}

/**
 * TV App / Player Page (/tv):
 * Upon loading, generate a unique random pairing code (e.g. TV-8492)
 * and register it in Firebase Realtime Database under /rooms/TV-XXXX.
 * Claim Status: "isClaimed": false, "ownerId": null.
 * Auto-Cleanup (onDisconnect): Automatically delete room node if TV loses connection / closes.
 */
export async function initializePlayerRoom(
  roomCode: string,
  initialMedia?: {
    title: string;
    id: string | number;
    type: 'movie' | 'tv';
    posterPath?: string | null;
    backdropPath?: string | null;
    season?: number;
    episode?: number;
  }
): Promise<void> {
  const cleanCode = normalizeRoomCode(roomCode);
  const defaultState: RoomState = {
    roomCode: cleanCode,
    isClaimed: false,
    ownerId: null,
    isPlaying: true,
    currentTime: 0,
    action: 'none',
    actionTimestamp: Date.now(),
    volume: 1,
    status: 'waiting',
    mediaTitle: initialMedia?.title || 'Avatar: Fire and Ash',
    mediaId: initialMedia?.id || 'tt31193180',
    mediaType: initialMedia?.type || 'movie',
    season: initialMedia?.season || 1,
    episode: initialMedia?.episode || 1,
    posterPath: initialMedia?.posterPath || null,
    backdropPath: initialMedia?.backdropPath || null,
    lastUpdated: Date.now(),
  };

  // Broadcast channel notification
  syncManager.send({
    source: 'embedmaster_player_client',
    type: 'syncState',
    state: {
      isPlaying: true,
      currentTime: 0,
      duration: 0,
      volume: 100,
      isMuted: false,
      isFullscreen: false,
      lastUpdated: Date.now(),
    },
  });

  if (!database) return;

  try {
    const roomRef = ref(database, `rooms/${cleanCode}`);
    await set(roomRef, defaultState);

    // Auto-Cleanup (onDisconnect):
    // If the TV app is closed, uninstalled, or loses connection,
    // Firebase automatically deletes the room node so stale sessions don't persist.
    const disconnectRef = onDisconnect(roomRef);
    await disconnectRef.remove();
  } catch (err) {
    console.warn('RTDB room initialization error:', err);
  }
}

/**
 * Player Page: Listen to room changes
 */
export function listenToRoom(
  roomCode: string,
  callback: (data: RoomState | null) => void
): () => void {
  // Also register BroadcastChannel listener for local instant sync
  const bcUnsub = syncManager.subscribe((msg) => {
    if (msg.source === 'embedmaster_remote') {
      if (msg.type === 'play' || msg.type === 'pause' || msg.type === 'stop') {
        const isPlay = msg.type === 'play';
        callback({
          roomCode,
          isPlaying: isPlay,
          currentTime: 0,
          action: isPlay ? 'play' : 'pause',
          actionTimestamp: Date.now(),
          volume: 1,
          status: 'connected',
        });
      } else if (msg.type === 'seek') {
        callback({
          roomCode,
          isPlaying: true,
          currentTime: typeof msg.value === 'number' ? msg.value : 0,
          action: 'seek',
          actionTimestamp: Date.now(),
          volume: 1,
          status: 'connected',
        });
      } else if (msg.type === 'volume') {
        callback({
          roomCode,
          isPlaying: true,
          currentTime: 0,
          action: 'volume',
          actionTimestamp: Date.now(),
          volume: typeof msg.value === 'number' ? msg.value / 100 : 1,
          status: 'connected',
        });
      } else if (msg.type === 'loadMedia' && msg.media) {
        callback({
          roomCode,
          isPlaying: true,
          currentTime: 0,
          action: 'loadMedia',
          actionTimestamp: Date.now(),
          volume: 1,
          status: 'connected',
          mediaId: msg.media.id,
          mediaTitle: msg.media.title,
          mediaType: msg.media.type,
          season: msg.media.season,
          episode: msg.media.episode,
        });
      }
    }
  });

  if (!database) {
    return bcUnsub;
  }

  try {
    const roomRef = ref(database, `rooms/${roomCode}`);
    const unsubscribeRTDB = onValue(
      roomRef,
      (snapshot) => {
        if (snapshot.exists()) {
          callback(snapshot.val() as RoomState);
        } else {
          callback(null);
        }
      },
      (error) => {
        console.warn('RTDB listen error:', error);
      }
    );

    return () => {
      bcUnsub();
      unsubscribeRTDB();
    };
  } catch {
    return bcUnsub;
  }
}

export interface ClaimResult {
  success: boolean;
  error?: string;
  roomState?: RoomState;
}

/**
 * First-Come-First-Served Claiming with Firebase runTransaction:
 * When a user inputs the code and hits "Connect", use a transactional check in Firebase to ensure isClaimed is false.
 * If unclaimed, update the node to "isClaimed": true and store the remote's unique device/browser ID as ownerId.
 * If already claimed by another device, reject the connection and display an error message ("Code already claimed").
 */
export async function claimAndConnectRemote(
  rawCode: string,
  deviceId: string = getRemoteDeviceId()
): Promise<ClaimResult> {
  const code = normalizeRoomCode(rawCode);
  if (!code) {
    return { success: false, error: 'Please enter a valid pairing code (e.g. TV-8492)' };
  }

  // Send connect ping via local sync
  syncManager.send({
    source: 'embedmaster_remote',
    type: 'ping',
  });

  if (!database) {
    try {
      localStorage.setItem('pairedCode', code);
    } catch {}
    return {
      success: true,
      roomState: {
        roomCode: code,
        isClaimed: true,
        ownerId: deviceId,
        isPlaying: true,
        currentTime: 0,
        action: 'play',
        volume: 1,
        status: 'connected',
      },
    };
  }

  try {
    const roomRef = ref(database, `rooms/${code}`);
    const snapshot = await get(roomRef);

    if (!snapshot.exists()) {
      return {
        success: false,
        error: `TV with code "${code}" was not found or is offline. Please check the code on your TV screen.`,
      };
    }

    let rejectionReason: string | null = null;

    const txResult = await runTransaction(roomRef, (currentData) => {
      if (currentData === null) {
        return null;
      }

      // If already claimed by another device/browser
      if (currentData.isClaimed === true && currentData.ownerId && currentData.ownerId !== deviceId) {
        rejectionReason = 'Code already claimed';
        return; // Return undefined to abort transaction
      }

      // First-come-first-served claim or reconnection by original owner
      currentData.isClaimed = true;
      currentData.ownerId = deviceId;
      currentData.status = 'connected';
      currentData.action = 'play';
      currentData.actionTimestamp = Date.now();
      currentData.lastUpdated = Date.now();
      return currentData;
    });

    if (!txResult.committed || rejectionReason) {
      return {
        success: false,
        error: rejectionReason || 'Code already claimed',
      };
    }

    const state = txResult.snapshot.val() as RoomState;
    // Save to persistent browser storage as requested
    try {
      localStorage.setItem('pairedCode', code);
    } catch {}

    return {
      success: true,
      roomState: state,
    };
  } catch (err: any) {
    console.error('claimAndConnectRemote error:', err);
    return {
      success: false,
      error: err?.message || 'Failed to connect to TV room.',
    };
  }
}

/**
 * Forget / Unlink Button:
 * Clears localStorage.removeItem('pairedCode') and resets remote state.
 * Releases claim on the TV room if this device was the owner.
 */
export async function forgetAndDisconnectRemote(
  roomCode: string,
  deviceId: string = getRemoteDeviceId()
): Promise<void> {
  const code = normalizeRoomCode(roomCode);
  try {
    localStorage.removeItem('pairedCode');
  } catch {}

  if (!database || !code) return;

  try {
    const roomRef = ref(database, `rooms/${code}`);
    const snap = await get(roomRef);
    if (snap.exists()) {
      const data = snap.val() as RoomState;
      if (data.ownerId === deviceId) {
        await update(roomRef, {
          isClaimed: false,
          ownerId: null,
          status: 'waiting',
          lastUpdated: Date.now(),
        });
      }
    }
  } catch (err) {
    console.warn('forgetAndDisconnectRemote note:', err);
  }
}

/**
 * Remote Page: Connect to TV Room (Legacy wrapper)
 */
export async function connectRemoteToRoom(roomCode: string): Promise<RoomState | null> {
  const result = await claimAndConnectRemote(roomCode);
  return result.roomState || null;
}

/**
 * Remote Page: Send command to player in real-time
 */
export async function sendRemoteCommand(
  roomCode: string,
  action: RoomState['action'],
  extra?: Partial<RoomState>
): Promise<void> {
  const cleanCode = roomCode.trim();
  if (!cleanCode) return;

  const updates: Partial<RoomState> = {
    action,
    actionTimestamp: Date.now(),
    lastUpdated: Date.now(),
    ...extra,
  };

  // BroadcastChannel for instant local reflection
  if (action === 'play') {
    syncManager.send({ source: 'embedmaster_remote', type: 'play' });
  } else if (action === 'pause') {
    syncManager.send({ source: 'embedmaster_remote', type: 'pause' });
  } else if (action === 'seek' && typeof extra?.currentTime === 'number') {
    syncManager.send({ source: 'embedmaster_remote', type: 'seek', value: extra.currentTime });
  } else if (action === 'volume' && typeof extra?.volume === 'number') {
    syncManager.send({ source: 'embedmaster_remote', type: 'volume', value: Math.round(extra.volume * 100) });
  } else if (action === 'close') {
    syncManager.send({ source: 'embedmaster_remote', type: 'stop' });
  } else if (action === 'loadMedia' && extra?.mediaId) {
    syncManager.send({
      source: 'embedmaster_remote',
      type: 'loadMedia',
      media: {
        id: String(extra.mediaId),
        title: extra.mediaTitle || 'Media Stream',
        type: extra.mediaType || 'movie',
        season: extra.season,
        episode: extra.episode,
      },
    });
  }

  if (!database) return;

  try {
    const roomRef = ref(database, `rooms/${cleanCode}`);
    await update(roomRef, updates);
  } catch (err) {
    console.warn('RTDB sendRemoteCommand error:', err);
  }
}

/**
 * Player Page: Update current media playing in the room (Movie / TV / Anime)
 * This synchronizes with any connected remote or viewer instantly
 */
export async function updatePlayerMedia(
  roomCode: string,
  media: {
    id: string | number;
    title: string;
    type: 'movie' | 'tv';
    season?: number;
    episode?: number;
  },
  posterPath?: string | null,
  backdropPath?: string | null
): Promise<void> {
  const cleanCode = roomCode.trim();
  if (!cleanCode) return;

  const updates: Partial<RoomState> = {
    mediaTitle: media.title,
    mediaId: String(media.id),
    mediaType: media.type,
    season: media.season || 1,
    episode: media.episode || 1,
    posterPath: posterPath || null,
    backdropPath: backdropPath || null,
    currentTime: 0,
    isPlaying: true,
    action: 'loadMedia',
    actionTimestamp: Date.now(),
    lastUpdated: Date.now(),
  };

  // Broadcast to local tabs/windows
  syncManager.send({
    source: 'embedmaster_player_client',
    type: 'loadMedia',
    media: {
      id: String(media.id),
      title: media.title,
      type: media.type,
      season: media.season || 1,
      episode: media.episode || 1,
    },
  });

  if (!database) return;

  try {
    const roomRef = ref(database, `rooms/${cleanCode}`);
    await update(roomRef, updates);
  } catch (err) {
    console.warn('RTDB updatePlayerMedia error:', err);
  }
}

/**
 * Remote Page: Update player status from player
 */
export async function updatePlayerPlaybackState(
  roomCode: string,
  state: {
    isPlaying: boolean;
    currentTime: number;
    duration?: number;
    volume: number;
  }
): Promise<void> {
  if (!database || !roomCode) return;
  try {
    const roomRef = ref(database, `rooms/${roomCode}`);
    await update(roomRef, {
      isPlaying: state.isPlaying,
      currentTime: Math.round(state.currentTime),
      duration: state.duration ? Math.round(state.duration) : undefined,
      volume: state.volume,
      lastUpdated: Date.now(),
    });
  } catch (err) {
    // Non-blocking
  }
}

/**
 * Destroy / cleanup room
 */
export async function closeRoom(roomCode: string): Promise<void> {
  if (!database || !roomCode) return;
  try {
    const roomRef = ref(database, `rooms/${roomCode}`);
    await remove(roomRef);
  } catch {
    // Silent
  }
}

export interface TvSession {
  roomCode: string;
  status: 'waiting' | 'active' | 'closed';
  updatedAt: number;
}

/**
 * Register current active TV session so remote can immediately display the new code
 */
export async function registerActiveTv(roomCode: string): Promise<void> {
  const clean = roomCode.trim();
  if (!clean) return;

  try {
    localStorage.setItem('embedmaster_active_tv_code', clean);
    syncManager.send({
      source: 'embedmaster_player_client',
      type: 'tv_opened',
      value: clean,
    });
  } catch {}

  if (!database) return;
  try {
    const tvRef = ref(database, 'active_tv_session');
    await set(tvRef, {
      roomCode: clean,
      status: 'waiting',
      updatedAt: Date.now(),
    });
    onDisconnect(tvRef)
      .set({
        roomCode: '',
        status: 'closed',
        updatedAt: Date.now(),
      })
      .catch(() => {});
  } catch (err) {
    console.warn('registerActiveTv note:', err);
  }
}

/**
 * Unregister TV session on window close / reload
 */
export async function unregisterActiveTv(roomCode: string): Promise<void> {
  const clean = roomCode.trim();
  try {
    localStorage.removeItem('embedmaster_active_tv_code');
    syncManager.send({
      source: 'embedmaster_player_client',
      type: 'tv_closed',
      value: clean,
    });
  } catch {}

  if (!database) return;
  try {
    const tvRef = ref(database, 'active_tv_session');
    await set(tvRef, {
      roomCode: '',
      status: 'closed',
      updatedAt: Date.now(),
    });
  } catch (err) {
    console.warn('unregisterActiveTv note:', err);
  }
}

/**
 * Remote Page: Listen to active TV presence in real-time
 */
export function listenToActiveTv(
  callback: (session: TvSession | null) => void
): () => void {
  // 1. BroadcastChannel listener for local browser tabs
  const bcUnsub = syncManager.subscribe((msg) => {
    if (msg.source === 'embedmaster_player_client') {
      if (msg.type === 'tv_opened' && typeof msg.value === 'string') {
        callback({
          roomCode: msg.value,
          status: 'waiting',
          updatedAt: Date.now(),
        });
      } else if (msg.type === 'tv_closed') {
        callback({
          roomCode: '',
          status: 'closed',
          updatedAt: Date.now(),
        });
      }
    }
  });

  // 2. Storage event fallback
  const handleStorage = (e: StorageEvent) => {
    if (e.key === 'embedmaster_active_tv_code') {
      if (e.newValue) {
        callback({
          roomCode: e.newValue,
          status: 'waiting',
          updatedAt: Date.now(),
        });
      } else {
        callback({
          roomCode: '',
          status: 'closed',
          updatedAt: Date.now(),
        });
      }
    }
  };
  if (typeof window !== 'undefined') {
    window.addEventListener('storage', handleStorage);
  }

  if (!database) {
    return () => {
      bcUnsub();
      if (typeof window !== 'undefined') {
        window.removeEventListener('storage', handleStorage);
      }
    };
  }

  try {
    const tvRef = ref(database, 'active_tv_session');
    const unsubscribeRTDB = onValue(
      tvRef,
      (snapshot) => {
        if (snapshot.exists()) {
          callback(snapshot.val() as TvSession);
        } else {
          callback(null);
        }
      },
      (err) => {
        console.warn('RTDB listenToActiveTv note:', err);
      }
    );

    return () => {
      bcUnsub();
      if (typeof window !== 'undefined') {
        window.removeEventListener('storage', handleStorage);
      }
      unsubscribeRTDB();
    };
  } catch {
    return () => {
      bcUnsub();
      if (typeof window !== 'undefined') {
        window.removeEventListener('storage', handleStorage);
      }
    };
  }
}

