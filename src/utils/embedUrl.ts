import { MediaItem, PlayerSettings } from '../types';

export function buildEmbedUrl(media: MediaItem, settings?: Partial<PlayerSettings>): string {
  const cleanId = String(media?.id || '').trim() || 'tt31193180';
  let base = '';

  if (media.type === 'tv') {
    const s = Math.max(1, media.season || 1);
    const ep = Math.max(1, media.episode || 1);
    base = `https://embedmaster.link/tv/${encodeURIComponent(cleanId)}/${s}/${ep}`;
  } else {
    base = `https://embedmaster.link/movie/${encodeURIComponent(cleanId)}`;
  }

  const params = new URLSearchParams();

  if (settings?.skin) {
    params.set('skin', settings.skin);
  }
  // Welcome page is set to 'off' so video starts playing immediately without asking to click
  params.set('welcome_page', settings?.welcomePage || 'off');
  params.set('autoplay', 'on');
  params.set('auto_play', '1');
  params.set('auto', '1');
  params.set('play', '1');
  params.set('start', '1');
  params.set('volume', '100');
  params.set('vol', '100');
  params.set('muted', '0');
  params.set('mute', '0');

  let queryString = params.toString();

  // Subtitles query params format: sub_url[]=...&sub_label[]=...
  if (settings?.subtitles && settings.subtitles.length > 0) {
    const subParts: string[] = [];
    settings.subtitles.forEach((sub) => {
      if (sub.url && sub.url.trim()) {
        subParts.push(`sub_url[]=${encodeURIComponent(sub.url.trim())}`);
        subParts.push(`sub_label[]=${encodeURIComponent(sub.label.trim() || 'Custom Subtitle')}`);
      }
    });
    if (subParts.length > 0) {
      queryString += (queryString ? '&' : '') + subParts.join('&');
    }
  }

  return queryString ? `${base}?${queryString}` : base;
}

export function isValidMediaId(id: string): boolean {
  const trimmed = id.trim();
  if (!trimmed) return false;
  // IMDb starts with tt followed by digits, or TMDB is numeric
  return /^tt\d+$/i.test(trimmed) || /^\d+$/.test(trimmed);
}
