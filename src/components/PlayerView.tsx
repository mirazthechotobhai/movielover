import React, { forwardRef } from 'react';
import { MediaItem } from '../types';

interface PlayerViewProps {
  embedUrl: string;
  media: MediaItem;
  displayMode?: string;
  isShieldActive?: boolean;
  onToggleShield?: () => void;
  onToggleFullscreen?: () => void;
  isPlaying?: boolean;
  osdText?: string | null;
}

export const PlayerView = forwardRef<HTMLIFrameElement, PlayerViewProps>(
  ({ embedUrl, media, osdText }, ref) => {
    return (
      <div
        id="player-viewport-wrapper"
        className="relative w-full h-full flex-1 flex items-center justify-center bg-black overflow-hidden select-none"
      >
        <iframe
          id="embedmaster_iframe"
          ref={ref}
          src={embedUrl}
          width="100%"
          height="100%"
          frameBorder="0"
          allow="autoplay *; fullscreen *; picture-in-picture *; encrypted-media *"
          allowFullScreen
          title={`Player - ${media.title}`}
          className="w-full h-full border-0 absolute inset-0"
          referrerPolicy="origin"
        />

        {/* Dynamic OSD Toast if active */}
        {osdText && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-30 pointer-events-none animate-in fade-in duration-150">
            <div className="px-4 py-2 rounded-xl bg-black/80 text-white text-xs font-medium backdrop-blur-sm shadow-md">
              {osdText}
            </div>
          </div>
        )}
      </div>
    );
  }
);

PlayerView.displayName = 'PlayerView';
