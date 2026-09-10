import { RemoteMessage } from '../types';

const CHANNEL_NAME = 'embedmaster_sync_channel';
const STORAGE_KEY = 'embedmaster_sync_message';

type MessageHandler = (message: RemoteMessage) => void;

class SyncChannel {
  private broadcastChannel: BroadcastChannel | null = null;
  private listeners: Set<MessageHandler> = new Set();

  constructor() {
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        this.broadcastChannel = new BroadcastChannel(CHANNEL_NAME);
        this.broadcastChannel.onmessage = (event) => {
          if (event.data && typeof event.data === 'object') {
            this.notifyListeners(event.data as RemoteMessage);
          }
        };
      } catch (e) {
        console.warn('BroadcastChannel error, falling back to localStorage', e);
      }
    }

    // Cross-tab fallback with window.storage
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', (event) => {
        if (event.key === STORAGE_KEY && event.newValue) {
          try {
            const parsed = JSON.parse(event.newValue) as RemoteMessage;
            this.notifyListeners(parsed);
          } catch (err) {
            // Ignore parse error
          }
        }
      });
    }
  }

  public subscribe(handler: MessageHandler): () => void {
    this.listeners.add(handler);
    return () => {
      this.listeners.delete(handler);
    };
  }

  private notifyListeners(message: RemoteMessage) {
    this.listeners.forEach((listener) => {
      try {
        listener(message);
      } catch (e) {
        console.error('Error in sync listener', e);
      }
    });
  }

  public send(message: Omit<RemoteMessage, 'id' | 'timestamp'>) {
    const fullMessage: RemoteMessage = {
      ...message,
      id: Math.random().toString(36).substring(2, 9),
      timestamp: Date.now(),
    };

    // 1. BroadcastChannel
    if (this.broadcastChannel) {
      try {
        this.broadcastChannel.postMessage(fullMessage);
      } catch (e) {
        console.warn('Broadcast postMessage failed', e);
      }
    }

    // 2. localStorage fallback for cross-tab sync
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(fullMessage));
      } catch (e) {
        // Storage might be unavailable or full
      }
    }

    // Also notify local listeners in current window
    this.notifyListeners(fullMessage);
  }
}

export const syncManager = new SyncChannel();
