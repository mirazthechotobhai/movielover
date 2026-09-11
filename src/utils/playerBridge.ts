/**
 * EmbedMaster Player PostMessage Controller
 * 
 * Official Protocol:
 * frame.contentWindow.postMessage({
 *     source: 'embedmaster_player_command',
 *     command: command,
 *     value: value
 * }, '*');
 */

export function sendEmbedMasterCommand(
  iframe: HTMLIFrameElement | null,
  command: 'play' | 'pause' | 'seek' | 'mute' | 'unmute' | 'volume' | 'fullscreen' | string,
  value?: any
) {
  if (!iframe || !iframe.contentWindow) return;
  try {
    iframe.contentWindow.postMessage(
      {
        source: 'embedmaster_player_command',
        command: command,
        value: value,
      },
      '*'
    );
  } catch (err) {
    console.warn('[EmbedMaster Bridge] Cross-origin message dispatch warning:', err);
  }
}

/**
 * Convenience helper to seek to a specific second mark
 */
export function seekTo(iframe: HTMLIFrameElement | null, seconds: number) {
  sendEmbedMasterCommand(iframe, 'seek', seconds);
}

/**
 * Convenience helper to set volume percentage (0 - 100)
 */
export function setVolume(iframe: HTMLIFrameElement | null, percent: number) {
  sendEmbedMasterCommand(iframe, 'volume', Math.max(0, Math.min(100, percent)));
}
