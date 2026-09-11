/**
 * Cross-browser Smart TV & WebView Fullscreen API helper
 * Compatible with Android TV, Samsung Tizen, LG WebOS, WebKit, and Standard W3C
 */

export function openFullscreen(targetElement?: HTMLElement | null): Promise<void> {
  const elem = targetElement || document.documentElement;
  const anyElem = elem as any;

  try {
    if (elem.requestFullscreen) {
      return elem.requestFullscreen();
    } else if (anyElem.webkitRequestFullscreen) {
      /* Safari / Older WebViews / Samsung Tizen */
      return anyElem.webkitRequestFullscreen();
    } else if (anyElem.mozRequestFullScreen) {
      /* Firefox */
      return anyElem.mozRequestFullScreen();
    } else if (anyElem.msRequestFullscreen) {
      /* IE / Edge legacy */
      return anyElem.msRequestFullscreen();
    } else if (anyElem.webkitEnterFullscreen) {
      /* iOS video/iframe */
      return anyElem.webkitEnterFullscreen();
    }
  } catch (err) {
    console.warn('[Smart TV Fullscreen] requestFullscreen error:', err);
  }
  return Promise.resolve();
}

export function closeFullscreen(): Promise<void> {
  const doc = document as any;
  try {
    if (document.exitFullscreen) {
      return document.exitFullscreen();
    } else if (doc.webkitExitFullscreen) {
      return doc.webkitExitFullscreen();
    } else if (doc.mozCancelFullScreen) {
      return doc.mozCancelFullScreen();
    } else if (doc.msExitFullscreen) {
      return doc.msExitFullscreen();
    }
  } catch (err) {
    console.warn('[Smart TV Fullscreen] exitFullscreen error:', err);
  }
  return Promise.resolve();
}

export function isFullscreenActive(): boolean {
  const doc = document as any;
  return Boolean(
    document.fullscreenElement ||
      doc.webkitFullscreenElement ||
      doc.mozFullScreenElement ||
      doc.msFullscreenElement
  );
}

export function toggleTvFullscreen(targetElement?: HTMLElement | null): Promise<void> {
  if (isFullscreenActive()) {
    return closeFullscreen();
  } else {
    return openFullscreen(targetElement);
  }
}

export const requestTvFullscreen = openFullscreen;

