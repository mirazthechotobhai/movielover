import {
  ref,
  set,
  get,
  update,
  remove,
  onValue,
  runTransaction,
  onDisconnect,
  Unsubscribe,
} from 'firebase/database';
import { rtdb } from './config';
import {
  TvSessionData,
  RemoteCommand,
  RemoteCommandType,
  PlaybackState,
  MediaPlayPayload,
} from '../types';

// Generate stable client device ID
export function getDeviceId(): string {
  const STORAGE_KEY = 'onlinetv_device_id';
  let id = localStorage.getItem(STORAGE_KEY);
  if (!id) {
    id = 'dev_' + Math.random().toString(36).substring(2, 11) + '_' + Date.now().toString(36);
    try {
      localStorage.setItem(STORAGE_KEY, id);
    } catch {
      // ignore
    }
  }
  return id;
}

// Generate random 4-digit room code
export function generateRoomCode(): string {
  return Math.floor(1000 + Math.random() * 9000).toString();
}

export class TvSessionService {
  private static heartbeatTimer: number | null = null;
  private static commandListenerUnsub: Unsubscribe | null = null;
  private static sessionListenerUnsub: Unsubscribe | null = null;
  private static lastExecutedCommandId: string | null = null;

  public static generateRoomCode(): string {
    return generateRoomCode();
  }

  /**
   * Initialize a new TV session on the TV screen
   */
  public static async createTvSession(
    onRemoteConnected: (remoteId: string) => void,
    onRemoteDisconnected: () => void,
    onCommandReceived: (cmd: RemoteCommand) => void,
    preferredRoomCode?: string
  ): Promise<{ roomCode: string; tvId: string }> {
    if (!rtdb) {
      throw new Error('Firebase Realtime Database is not configured.');
    }

    const tvId = getDeviceId();
    let roomCode =
      preferredRoomCode && /^\d{4}$/.test(preferredRoomCode)
        ? preferredRoomCode
        : generateRoomCode();
    let sessionRef = ref(rtdb, `tvSessions/${roomCode}`);

    // Collision check: verify if code exists
    let attempts = 0;
    while (attempts < 5) {
      const snapshot = await get(sessionRef);
      if (!snapshot.exists()) break;
      const data = snapshot.val() as TvSessionData;
      // If previous heartbeat was over 45s ago, room code can be reused
      if (Date.now() - (data.lastHeartbeat || 0) > 45000) break;
      roomCode = generateRoomCode();
      sessionRef = ref(rtdb, `tvSessions/${roomCode}`);
      attempts++;
    }

    const initialData: TvSessionData = {
      roomCode,
      tvId,
      status: 'waiting',
      remoteId: null,
      createdAt: Date.now(),
      lastHeartbeat: Date.now(),
      currentMedia: null,
      playbackState: {
        playing: false,
        currentTime: 0,
        duration: 0,
        volume: 1.0,
        isMuted: false,
        title: '',
      },
      command: null,
    };

    await set(sessionRef, initialData);

    // Broadcast current active TV room in Realtime Database for instant discovery
    try {
      const activeTvRef = ref(rtdb, 'activeTvRoom');
      await set(activeTvRef, {
        roomCode,
        tvId,
        createdAt: Date.now(),
        lastHeartbeat: Date.now(),
      });
      const disconnectActive = onDisconnect(activeTvRef);
      disconnectActive.remove().catch((e) => console.warn('onDisconnect activeTvRoom failed', e));
    } catch (e) {
      console.warn('activeTvRoom broadcast error:', e);
    }

    // Setup onDisconnect cleanup for the session
    try {
      const disconnectRef = onDisconnect(sessionRef);
      disconnectRef.remove().catch((e) => console.warn('onDisconnect failed', e));
    } catch (e) {
      console.warn('onDisconnect setup error:', e);
    }

    // Start 10-second heartbeat
    this.stopHeartbeat();
    this.heartbeatTimer = window.setInterval(async () => {
      try {
        const now = Date.now();
        await update(ref(rtdb, `tvSessions/${roomCode}`), {
          lastHeartbeat: now,
        });
        await update(ref(rtdb, 'activeTvRoom'), {
          lastHeartbeat: now,
          roomCode,
        });
      } catch (err) {
        console.warn('Heartbeat update failed:', err);
      }
    }, 10000);

    // Listen to session status changes & remote claims
    let previousRemoteId: string | null = null;
    this.sessionListenerUnsub = onValue(sessionRef, (snapshot) => {
      if (!snapshot.exists()) {
        onRemoteDisconnected();
        return;
      }
      const data = snapshot.val() as TvSessionData;
      if (data.status === 'connected' && data.remoteId) {
        if (data.remoteId !== previousRemoteId) {
          previousRemoteId = data.remoteId;
          onRemoteConnected(data.remoteId);
        }
      } else if (previousRemoteId && data.status !== 'connected') {
        previousRemoteId = null;
        onRemoteDisconnected();
      }
    });

    // Listen for incoming commands from remote
    const commandRef = ref(rtdb, `tvSessions/${roomCode}/command`);
    this.commandListenerUnsub = onValue(commandRef, (snapshot) => {
      if (!snapshot.exists()) return;
      const cmd = snapshot.val() as RemoteCommand;
      if (!cmd || !cmd.commandId) return;

      // Command deduplication check
      if (this.lastExecutedCommandId === cmd.commandId) {
        return;
      }
      this.lastExecutedCommandId = cmd.commandId;
      onCommandReceived(cmd);
    });

    return { roomCode, tvId };
  }

  /**
   * Update playback state from TV to Firebase for remote sync
   */
  public static async updatePlaybackState(roomCode: string, state: Partial<PlaybackState>): Promise<void> {
    if (!rtdb || !roomCode) return;
    try {
      await update(ref(rtdb, `tvSessions/${roomCode}/playbackState`), {
        ...state,
        lastUpdated: Date.now(),
      });
    } catch (err) {
      console.warn('Failed to update playback state:', err);
    }
  }

  /**
   * Update currently playing media on TV
   */
  public static async updateCurrentMedia(roomCode: string, media: MediaPlayPayload | null): Promise<void> {
    if (!rtdb || !roomCode) return;
    try {
      await update(ref(rtdb, `tvSessions/${roomCode}`), {
        currentMedia: media,
      });
    } catch (err) {
      console.warn('Failed to update current media:', err);
    }
  }

  /**
   * Clean up TV session when leaving the TV view or closing tab
   */
  public static async destroyTvSession(roomCode: string): Promise<void> {
    this.stopHeartbeat();
    if (this.sessionListenerUnsub) {
      this.sessionListenerUnsub();
      this.sessionListenerUnsub = null;
    }
    if (this.commandListenerUnsub) {
      this.commandListenerUnsub();
      this.commandListenerUnsub = null;
    }

    if (rtdb && roomCode) {
      try {
        await remove(ref(rtdb, `tvSessions/${roomCode}`));
        const snap = await get(ref(rtdb, 'activeTvRoom'));
        if (snap.exists() && snap.val()?.roomCode === roomCode) {
          await remove(ref(rtdb, 'activeTvRoom'));
        }
      } catch (err) {
        console.warn('Failed to remove TV session on destroy:', err);
      }
    }
  }

  /**
   * Listen to active TV room in Realtime Database for instant discovery on the main site
   */
  public static listenToActiveTvRoom(callback: (roomCode: string | null) => void): Unsubscribe | null {
    if (!rtdb) return null;
    const activeTvRef = ref(rtdb, 'activeTvRoom');
    return onValue(activeTvRef, (snapshot) => {
      if (!snapshot.exists()) {
        callback(null);
        return;
      }
      const data = snapshot.val();
      if (data && data.roomCode) {
        const age = Date.now() - (data.lastHeartbeat || data.createdAt || 0);
        // Valid if within 60 seconds
        if (age < 60000) {
          callback(data.roomCode);
        } else {
          callback(null);
        }
      } else {
        callback(null);
      }
    });
  }

  private static stopHeartbeat() {
    if (this.heartbeatTimer !== null) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  // ==================== REMOTE SIDE ====================

  /**
   * Atomic Claim of TV Code by a Remote Device (Race-condition safe)
   */
  public static async claimTvCode(
    roomCode: string
  ): Promise<{ success: boolean; message: string; sessionData?: TvSessionData }> {
    if (!rtdb) {
      return { success: false, message: 'Firebase Realtime Database is not available.' };
    }

    const cleanCode = String(roomCode || '').trim();
    if (!/^\d{4}$/.test(cleanCode)) {
      return { success: false, message: 'Please enter a valid 4-digit numeric TV code.' };
    }

    const remoteDeviceId = getDeviceId();
    const sessionRef = ref(rtdb, `tvSessions/${cleanCode}`);

    try {
      // First inspect status for specific error messages
      const preCheck = await get(sessionRef);
      if (!preCheck.exists()) {
        return { success: false, message: `No active TV found with code ${cleanCode}. Please check your TV screen.` };
      }

      const existingData = preCheck.val() as TvSessionData;
      const now = Date.now();

      // Check heartbeat expiration (45s)
      if (now - (existingData.lastHeartbeat || 0) > 45000) {
        return { success: false, message: `TV session ${cleanCode} has timed out or disconnected.` };
      }

      // Check if already claimed by another remote
      if (
        existingData.status === 'connected' &&
        existingData.remoteId &&
        existingData.remoteId !== remoteDeviceId
      ) {
        return { success: false, message: 'This TV session is already connected to another remote.' };
      }

      // Execute atomic transaction to prevent race conditions
      const txnResult = await runTransaction(sessionRef, (current) => {
        if (!current) return current; // doesn't exist
        if (current.status === 'connected' && current.remoteId && current.remoteId !== remoteDeviceId) {
          return; // abort transaction
        }
        current.status = 'connected';
        current.remoteId = remoteDeviceId;
        current.connectedAt = Date.now();
        return current;
      });

      if (!txnResult.committed) {
        return { success: false, message: 'Failed to pair: Code was claimed simultaneously by another device.' };
      }

      const updated = txnResult.snapshot.val() as TvSessionData;
      return {
        success: true,
        message: `Successfully connected to TV #${cleanCode}!`,
        sessionData: updated,
      };
    } catch (err: any) {
      console.error('Error claiming TV session:', err);
      return { success: false, message: err?.message || 'Network error while connecting to TV.' };
    }
  }

  /**
   * Listen to TV session state from Remote side (for playback status, media info, and disconnect detection)
   */
  public static subscribeToTvState(
    roomCode: string,
    onStateChange: (data: TvSessionData) => void,
    onDisconnected: () => void
  ): Unsubscribe {
    if (!rtdb) return () => {};

    const sessionRef = ref(rtdb, `tvSessions/${roomCode}`);
    return onValue(sessionRef, (snapshot) => {
      if (!snapshot.exists()) {
        onDisconnected();
        return;
      }
      const data = snapshot.val() as TvSessionData;
      // Check if heartbeat is still alive
      if (Date.now() - (data.lastHeartbeat || 0) > 45000) {
        onDisconnected();
        return;
      }
      onStateChange(data);
    });
  }

  /**
   * Send a command from Remote to the connected TV
   */
  public static async sendCommand(
    roomCode: string,
    type: RemoteCommandType,
    payload: any = null
  ): Promise<boolean> {
    if (!rtdb || !roomCode) return false;

    const commandId = `cmd_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    const cmd: RemoteCommand = {
      commandId,
      type,
      payload,
      timestamp: Date.now(),
      senderId: getDeviceId(),
    };

    try {
      await set(ref(rtdb, `tvSessions/${roomCode}/command`), cmd);
      return true;
    } catch (err) {
      console.error('Failed to send remote command:', err);
      return false;
    }
  }

  /**
   * Disconnect remote from the TV session
   */
  public static async disconnectRemote(roomCode: string): Promise<void> {
    if (!rtdb || !roomCode) return;
    try {
      const myId = getDeviceId();
      const sessionRef = ref(rtdb, `tvSessions/${roomCode}`);
      await runTransaction(sessionRef, (current) => {
        if (!current) return current;
        if (current.remoteId === myId) {
          current.status = 'waiting';
          current.remoteId = null;
        }
        return current;
      });
    } catch (err) {
      console.warn('Error disconnecting remote:', err);
    }
  }
}
