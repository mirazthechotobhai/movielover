export type RemoteCommand =
  | 'play'
  | 'pause'
  | 'toggle_play'
  | 'volume_up'
  | 'volume_down'
  | 'seek_forward'
  | 'seek_backward'
  | 'seek_forward_30'
  | 'seek_backward_30'
  | 'toggle_mute'
  | 'mute'
  | 'unmute'
  | 'toggle_fullscreen'
  | 'reload'
  | 'next_episode'
  | 'prev_episode'
  | 'set_volume'
  | 'seek_to';

export interface RemotePlayerState {
  isPlaying: boolean;
  isMuted: boolean;
  volumeLevel: number;
  currentTime: number;
  duration: number;
  title: string;
  type: 'movie' | 'tv';
  season?: number;
  episode?: number;
  id: string;
}

export interface RemoteMessage {
  type: 'COMMAND' | 'STATE' | 'PING';
  command?: RemoteCommand;
  value?: any;
  state?: RemotePlayerState;
  timestamp: number;
}

const CHANNEL_NAME = 'embedmaster_remote_sync';
const STORAGE_CMD_KEY = 'embedmaster_remote_last_cmd';
const STORAGE_STATE_KEY = 'embedmaster_remote_last_state';

// Create broadcast channel safely (if supported)
function getBroadcastChannel(): BroadcastChannel | null {
  if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
    try {
      return new BroadcastChannel(CHANNEL_NAME);
    } catch {
      return null;
    }
  }
  return null;
}

/**
 * Send command from Remote tab to Main player tab
 */
export function sendRemoteCommand(command: RemoteCommand, value?: any) {
  const payload: RemoteMessage = {
    type: 'COMMAND',
    command,
    value,
    timestamp: Date.now(),
  };

  // 1. BroadcastChannel dispatch
  const channel = getBroadcastChannel();
  if (channel) {
    try {
      channel.postMessage(payload);
    } catch (err) {
      console.warn('[RemoteSync] BroadcastChannel command error:', err);
    }
  }

  // 2. LocalStorage dispatch (fires 'storage' event across all other tabs on same origin)
  try {
    localStorage.setItem(STORAGE_CMD_KEY, JSON.stringify(payload));
  } catch (err) {
    console.warn('[RemoteSync] LocalStorage command dispatch error:', err);
  }

  // 3. Opener postMessage dispatch if opened via window.open()
  if (typeof window !== 'undefined' && window.opener && !window.opener.closed) {
    try {
      window.opener.postMessage(payload, '*');
    } catch {}
  }
}

/**
 * Broadcast main player's live state to Remote tab(s)
 */
export function broadcastPlayerState(state: RemotePlayerState) {
  const payload: RemoteMessage = {
    type: 'STATE',
    state,
    timestamp: Date.now(),
  };

  const channel = getBroadcastChannel();
  if (channel) {
    try {
      channel.postMessage(payload);
    } catch (err) {
      console.warn('[RemoteSync] BroadcastChannel state error:', err);
    }
  }

  try {
    localStorage.setItem(STORAGE_STATE_KEY, JSON.stringify(payload));
  } catch {}
}

/**
 * Send PING from Remote tab to request immediate state from main player
 */
export function sendRemotePing() {
  const payload: RemoteMessage = {
    type: 'PING',
    timestamp: Date.now(),
  };

  const channel = getBroadcastChannel();
  if (channel) {
    try {
      channel.postMessage(payload);
    } catch {}
  }

  try {
    localStorage.setItem('embedmaster_remote_ping', Date.now().toString());
  } catch {}

  if (typeof window !== 'undefined' && window.opener && !window.opener.closed) {
    try {
      window.opener.postMessage(payload, '*');
    } catch {}
  }
}

/**
 * Hook or listener helper for the main player tab to handle commands from remote
 */
export function setupMainPlayerRemoteListener(
  onCommand: (command: RemoteCommand, value?: any) => void,
  onPing: () => void
): () => void {
  const channel = getBroadcastChannel();

  const handleMessageData = (data: any) => {
    if (!data || typeof data !== 'object') return;
    if (data.type === 'COMMAND' && data.command) {
      onCommand(data.command, data.value);
    } else if (data.type === 'PING') {
      onPing();
    }
  };

  // BroadcastChannel listener
  if (channel) {
    channel.onmessage = (e) => handleMessageData(e.data);
  }

  // LocalStorage storage listener (handles commands in case BroadcastChannel is isolated)
  const handleStorage = (e: StorageEvent) => {
    if (e.key === STORAGE_CMD_KEY && e.newValue) {
      try {
        const parsed = JSON.parse(e.newValue);
        handleMessageData(parsed);
      } catch {}
    } else if (e.key === 'embedmaster_remote_ping') {
      onPing();
    }
  };
  window.addEventListener('storage', handleStorage);

  // Window message listener (for window.opener)
  const handleWindowMsg = (e: MessageEvent) => {
    handleMessageData(e.data);
  };
  window.addEventListener('message', handleWindowMsg);

  return () => {
    if (channel) channel.close();
    window.removeEventListener('storage', handleStorage);
    window.removeEventListener('message', handleWindowMsg);
  };
}

/**
 * Hook or listener helper for Remote tab to receive live player state updates
 */
export function setupRemoteStateListener(
  onStateUpdate: (state: RemotePlayerState) => void
): () => void {
  const channel = getBroadcastChannel();

  const handleMessageData = (data: any) => {
    if (!data || typeof data !== 'object') return;
    if (data.type === 'STATE' && data.state) {
      onStateUpdate(data.state);
    }
  };

  if (channel) {
    channel.onmessage = (e) => handleMessageData(e.data);
  }

  const handleStorage = (e: StorageEvent) => {
    if (e.key === STORAGE_STATE_KEY && e.newValue) {
      try {
        const parsed = JSON.parse(e.newValue);
        handleMessageData(parsed);
      } catch {}
    }
  };
  window.addEventListener('storage', handleStorage);

  const handleWindowMsg = (e: MessageEvent) => {
    handleMessageData(e.data);
  };
  window.addEventListener('message', handleWindowMsg);

  // Check last known state from localStorage immediately
  try {
    const cached = localStorage.getItem(STORAGE_STATE_KEY);
    if (cached) {
      const parsed = JSON.parse(cached);
      if (parsed?.state) onStateUpdate(parsed.state);
    }
  } catch {}

  return () => {
    if (channel) channel.close();
    window.removeEventListener('storage', handleStorage);
    window.removeEventListener('message', handleWindowMsg);
  };
}
