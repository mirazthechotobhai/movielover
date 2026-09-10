import {
  doc,
  setDoc,
  getDoc,
  collection,
  query,
  onSnapshot,
  deleteDoc,
  Unsubscribe,
} from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from './firebase';
import { PlayerSettings, MediaItem, PlaybackState } from '../types';
import { buildEmbedUrl } from '../utils/embedUrl';

export interface CloudUserProfile {
  userId: string;
  email: string;
  displayName?: string;
  createdAt: string;
}

export interface CloudPlayerSettings {
  userId: string;
  skin: string;
  autoplay: boolean;
  subtitles: boolean;
  welcomePage?: boolean;
  defaultVolume?: number;
  updatedAt: string;
}

export interface CloudCustomMedia {
  id: string;
  userId: string;
  title: string;
  embedUrl: string;
  type: string;
  createdAt: string;
}

export interface CloudRemoteSession {
  sessionId: string;
  hostUserId: string;
  isPlaying: boolean;
  currentTime?: number;
  duration?: number;
  volume: number;
  isMuted: boolean;
  mediaTitle?: string;
  mediaUrl?: string;
  lastCommand?: string;
  lastCommandValue?: number;
  updatedAt: string;
}

// 1. User Profile Sync
export async function syncUserProfile(user: { uid: string; email?: string | null; displayName?: string | null }): Promise<void> {
  const path = `users/${user.uid}`;
  try {
    const userRef = doc(db, 'users', user.uid);
    const existing = await getDoc(userRef);
    if (!existing.exists()) {
      await setDoc(userRef, {
        userId: user.uid,
        email: user.email || 'user@firebase.local',
        displayName: user.displayName || 'Cinema Operator',
        createdAt: new Date().toISOString(),
      });
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

// 2. Player Settings Cloud Sync
export async function savePlayerSettingsToCloud(userId: string, settings: PlayerSettings): Promise<void> {
  if (!auth.currentUser || auth.currentUser.uid !== userId) {
    return;
  }
  const path = `users/${userId}/settings/player`;
  try {
    const settingsRef = doc(db, 'users', userId, 'settings', 'player');
    await setDoc(settingsRef, {
      userId,
      skin: settings.skin || 'onyx',
      autoplay: settings.autoplay === 'on',
      subtitles: settings.subtitles.length > 0,
      welcomePage: settings.welcomePage === 'on',
      defaultVolume: 80,
      updatedAt: new Date().toISOString(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export function subscribeToCloudSettings(
  userId: string,
  onUpdate: (settings: Partial<PlayerSettings>) => void
): Unsubscribe {
  if (!auth.currentUser || auth.currentUser.uid !== userId) {
    return () => {};
  }
  const path = `users/${userId}/settings/player`;
  const settingsRef = doc(db, 'users', userId, 'settings', 'player');
  return onSnapshot(
    settingsRef,
    (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        onUpdate({
          skin: data.skin === 'aurora' ? 'aurora' : 'onyx',
          autoplay: data.autoplay ? 'on' : 'off',
          welcomePage: data.welcomePage ? 'on' : 'off',
        });
      }
    },
    (err) => {
      if (!auth.currentUser) return;
      handleFirestoreError(err, OperationType.GET, path);
    }
  );
}

// 3. Custom Media Streams Cloud Sync
export async function saveCustomMediaToCloud(userId: string, media: MediaItem, customEmbedUrl?: string): Promise<void> {
  if (!auth.currentUser || auth.currentUser.uid !== userId) {
    return;
  }
  const cleanId = media.id.replace(/[^a-zA-Z0-9_-]/g, '_');
  const path = `users/${userId}/customMedia/${cleanId}`;
  try {
    const mediaRef = doc(db, 'users', userId, 'customMedia', cleanId);
    const resolvedUrl = customEmbedUrl || buildEmbedUrl(media);
    await setDoc(mediaRef, {
      id: cleanId,
      userId,
      title: media.title.slice(0, 200),
      embedUrl: resolvedUrl.slice(0, 2000),
      type: media.type || 'movie',
      createdAt: new Date().toISOString(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export function subscribeToUserMedia(
  userId: string,
  onMediaList: (items: CloudCustomMedia[]) => void
): Unsubscribe {
  if (!auth.currentUser || auth.currentUser.uid !== userId) {
    return () => {};
  }
  const path = `users/${userId}/customMedia`;
  const mediaCol = collection(db, 'users', userId, 'customMedia');
  return onSnapshot(
    mediaCol,
    (snapshot) => {
      const items: CloudCustomMedia[] = [];
      snapshot.forEach((d) => items.push(d.data() as CloudCustomMedia));
      onMediaList(items);
    },
    (err) => {
      if (!auth.currentUser) return;
      handleFirestoreError(err, OperationType.LIST, path);
    }
  );
}

// 4. Real-time Cloud Remote Control Session
export async function createOrUpdateRemoteSession(
  sessionId: string,
  hostUserId: string,
  state: PlaybackState,
  currentMedia?: MediaItem,
  lastCommand?: string,
  lastCommandValue?: number
): Promise<void> {
  if (!auth.currentUser) {
    return;
  }
  const currentUid = auth.currentUser.uid;
  const cleanId = sessionId.replace(/[^a-zA-Z0-9_-]/g, '_');
  const path = `remoteSessions/${cleanId}`;
  try {
    const sessionRef = doc(db, 'remoteSessions', cleanId);
    const resolvedUrl = currentMedia ? buildEmbedUrl(currentMedia) : '';
    await setDoc(
      sessionRef,
      {
        sessionId: cleanId,
        hostUserId: currentUid,
        isPlaying: Boolean(state.isPlaying),
        currentTime: typeof state.currentTime === 'number' ? Math.round(state.currentTime) : 0,
        duration: typeof state.duration === 'number' ? Math.round(state.duration) : 0,
        volume: typeof state.volume === 'number' ? state.volume : 80,
        isMuted: Boolean(state.isMuted),
        mediaTitle: currentMedia?.title ? currentMedia.title.slice(0, 200) : 'Active Stream',
        mediaUrl: resolvedUrl.slice(0, 1000),
        lastCommand: lastCommand || '',
        lastCommandValue: typeof lastCommandValue === 'number' ? lastCommandValue : 0,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export function subscribeToRemoteSession(
  sessionId: string,
  onSessionUpdate: (session: CloudRemoteSession) => void
): Unsubscribe {
  if (!auth.currentUser) {
    return () => {};
  }
  const cleanId = sessionId.replace(/[^a-zA-Z0-9_-]/g, '_');
  const path = `remoteSessions/${cleanId}`;
  const sessionRef = doc(db, 'remoteSessions', cleanId);
  return onSnapshot(
    sessionRef,
    (snapshot) => {
      if (snapshot.exists()) {
        onSessionUpdate(snapshot.data() as CloudRemoteSession);
      }
    },
    (err) => {
      if (!auth.currentUser) return;
      handleFirestoreError(err, OperationType.GET, path);
    }
  );
}

