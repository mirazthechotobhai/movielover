/**
 * Navigation helpers to open Player or Remote in a new tab or route.
 */

export const getPlayerUrl = (roomCode?: string | null): string => {
  if (typeof window === 'undefined') return '/tv.html?mode=tv&autoplay=on&fullscreen=1';
  const url = new URL(window.location.origin + '/tv.html');
  url.searchParams.set('mode', 'tv');
  url.searchParams.set('autoplay', 'on');
  url.searchParams.set('fullscreen', '1');
  if (roomCode && roomCode.trim()) {
    url.searchParams.set('room', roomCode.trim());
  }
  return url.toString();
};

export const getRemoteUrl = (roomCode?: string | null): string => {
  if (typeof window === 'undefined') return '/remote.html?mode=remote';
  const url = new URL(window.location.origin + '/remote.html');
  url.searchParams.set('mode', 'remote');
  if (roomCode && roomCode.trim()) {
    url.searchParams.set('room', roomCode.trim());
  }
  return url.toString();
};

export const openPlayerInNewTab = (roomCode?: string | null) => {
  const url = getPlayerUrl(roomCode);
  if (typeof window === 'undefined') return;
  const newWindow = window.open(url, '_blank', 'noopener,noreferrer');
  if (!newWindow || newWindow.closed || typeof newWindow.closed === 'undefined') {
    const a = document.createElement('a');
    a.href = url;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }
};

export const openRemoteInNewTab = (roomCode?: string | null) => {
  const url = getRemoteUrl(roomCode);
  if (typeof window === 'undefined') return;
  const newWindow = window.open(url, '_blank', 'noopener,noreferrer');
  if (!newWindow || newWindow.closed || typeof newWindow.closed === 'undefined') {
    const a = document.createElement('a');
    a.href = url;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }
};
