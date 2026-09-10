import { FC, MouseEvent } from 'react';
import {
  Tv,
  Film,
  Clapperboard,
  Flame,
  Search,
  X,
  Radio,
  ExternalLink,
} from 'lucide-react';
import { ActiveCategory, MediaPlayPayload } from '../types';
import { PWAInstallButton } from './PWAInstallButton';

interface HeaderProps {
  activeCategory: ActiveCategory;
  onSelectCategory: (cat: ActiveCategory) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onClearSearch: () => void;
  onOpenTvMode: (e?: MouseEvent) => void;
  onOpenRemoteModal: () => void;
  connectedRoomCode: string | null;
  activeMedia?: MediaPlayPayload | null;
  tvRoomId: string;
  inputRoomId: string;
  onInputRoomIdChange: (val: string) => void;
  onActivateTv: () => void;
}

export const Header: FC<HeaderProps> = ({
  activeCategory,
  onSelectCategory,
  searchQuery,
  onSearchChange,
  onClearSearch,
  onOpenTvMode,
  onOpenRemoteModal,
  connectedRoomCode,
  activeMedia,
  tvRoomId,
  inputRoomId,
  onInputRoomIdChange,
  onActivateTv,
}) => {
  const isConnected = !!connectedRoomCode;
  let tvHref = '?tv=true';
  if (activeMedia) {
    tvHref += `&mediaId=${activeMedia.mediaId}&title=${encodeURIComponent(activeMedia.title)}`;
  }

  return (
    <header className="sticky top-0 z-40 bg-neutral-950/90 backdrop-blur-xl border-b border-neutral-800/80 transition-all">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-col gap-3">
        {/* Top Row: Logo, 2 Boxes (TV Room & Auto-fill), Active Button, TV Button */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20 text-neutral-950 font-black">
              <Tv className="w-5 h-5 sm:w-6 sm:h-6 text-neutral-950" />
            </div>
            <div>
              <span className="text-lg sm:text-xl font-black tracking-tight text-white flex items-center gap-1.5">
                OnlineTV
                <span className="text-[10px] uppercase font-bold tracking-widest px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                  STREAM
                </span>
              </span>
            </div>
          </div>

          {/* Action Center: 2 Side-by-side Boxes, Active Button, TV Button */}
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            {/* Box 1: TV Room ID (automatically populated when TV is opened) */}
            <div className="flex flex-col">
              <span className="text-[9px] font-bold text-cyan-400 uppercase tracking-wider pl-1 mb-0.5">
                TV Room ID
              </span>
              <input
                id="header-box-1-tv-room"
                type="text"
                readOnly
                value={tvRoomId ? tvRoomId : ''}
                placeholder="Wait TV..."
                title="Box 1: TV Room ID (automatically appears when TV is opened)"
                className="w-20 sm:w-24 px-2 py-1.5 rounded-xl bg-neutral-900 border border-cyan-500/50 text-xs font-mono font-black text-cyan-300 text-center placeholder:text-neutral-500 placeholder:text-[10px] focus:outline-none select-all"
              />
            </div>

            {/* Box 2: Auto-filled Room ID */}
            <div className="flex flex-col">
              <span className="text-[9px] font-bold text-neutral-400 uppercase tracking-wider pl-1 mb-0.5">
                Auto Fill
              </span>
              <input
                id="header-box-2-auto-fill"
                type="text"
                value={inputRoomId}
                onChange={(e) => onInputRoomIdChange(e.target.value)}
                placeholder="Room ID"
                title="Box 2: Auto-filled with Room ID from Box 1"
                maxLength={6}
                className="w-20 sm:w-24 px-2 py-1.5 rounded-xl bg-neutral-900 border border-neutral-700 focus:border-cyan-400 text-xs font-mono font-black text-white text-center placeholder:text-neutral-500 placeholder:text-[10px] focus:outline-none"
              />
            </div>

            {/* Active Button */}
            <div className="flex flex-col justify-end">
              <span className="text-[9px] font-bold text-transparent select-none pl-1 mb-0.5 hidden sm:block">
                Action
              </span>
              <button
                id="header-btn-active-tv"
                onClick={() => onActivateTv()}
                title={isConnected ? `TV #${connectedRoomCode} is Active` : 'Click to Activate TV Session'}
                className={`flex items-center justify-center gap-1.5 px-3.5 sm:px-4 py-1.5 rounded-xl font-black text-xs sm:text-sm tracking-wide transition-all transform active:scale-95 cursor-pointer shadow-md select-none ${
                  isConnected
                    ? 'bg-emerald-500 hover:bg-emerald-400 text-neutral-950 shadow-emerald-500/30 ring-2 ring-emerald-400/50'
                    : 'bg-cyan-500 hover:bg-cyan-400 text-neutral-950 shadow-cyan-500/25 hover:scale-105'
                }`}
              >
                {isConnected && <span className="w-2 h-2 rounded-full bg-neutral-950 animate-ping" />}
                <span>Active</span>
              </button>
            </div>

            {/* PROMINENT TV BUTTON - Opens in new tab */}
            <div className="flex flex-col justify-end">
              <span className="text-[9px] font-bold text-transparent select-none pl-1 mb-0.5 hidden sm:block">
                TV
              </span>
              <a
                id="header-prominent-tv-btn"
                href={tvHref}
                target="_blank"
                rel="opener"
                onClick={(e) => onOpenTvMode(e)}
                title="Open Smart TV Player in New Tab"
                className="flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 hover:border-cyan-400 text-cyan-400 hover:text-cyan-300 font-black text-xs sm:text-sm tracking-wide transition-all active:scale-95 cursor-pointer no-underline select-none"
              >
                <Tv className="w-4 h-4" />
                <span>TV</span>
                <ExternalLink className="w-3 h-3 text-cyan-400/70" />
              </a>
            </div>

            {/* TV Remote Modal Keypad Button */}
            <div className="flex flex-col justify-end">
              <span className="text-[9px] font-bold text-transparent select-none pl-1 mb-0.5 hidden sm:block">
                Remote
              </span>
              <button
                id="header-tv-remote-btn"
                onClick={onOpenRemoteModal}
                title={isConnected ? `Connected to TV #${connectedRoomCode}` : 'Pair with Smart TV'}
                className="p-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-neutral-300 hover:text-white transition cursor-pointer"
              >
                <Radio className={`w-4 h-4 ${isConnected ? 'text-emerald-400 animate-pulse' : 'text-neutral-400'}`} />
              </button>
            </div>

            <PWAInstallButton />
          </div>
        </div>

        {/* Bottom Row: Search Bar + Categories */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1">
          {/* Search Bar (Section 12) */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />
            <input
              id="global-search-input"
              type="text"
              placeholder="Search movies, TV shows, anime..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-10 pr-9 py-2 rounded-xl bg-neutral-900 border border-neutral-800 hover:border-neutral-700 focus:border-cyan-400 text-xs sm:text-sm text-white placeholder:text-neutral-500 focus:outline-none transition"
            />
            {searchQuery && (
              <button
                onClick={onClearSearch}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-neutral-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Categories: Movies, TV Shows, Anime (Section 5, 10, 11) */}
          <nav className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
            <button
              id="nav-tab-movies"
              onClick={() => onSelectCategory('movies')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex-shrink-0 cursor-pointer ${
                activeCategory === 'movies' && !searchQuery
                  ? 'bg-cyan-500 text-neutral-950 shadow-md shadow-cyan-500/20'
                  : 'bg-neutral-900/90 text-neutral-300 hover:text-white hover:bg-neutral-800 border border-neutral-800'
              }`}
            >
              <Film className="w-3.5 h-3.5" />
              <span>Movies</span>
            </button>

            <button
              id="nav-tab-tv-shows"
              onClick={() => onSelectCategory('tv')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex-shrink-0 cursor-pointer ${
                activeCategory === 'tv' && !searchQuery
                  ? 'bg-cyan-500 text-neutral-950 shadow-md shadow-cyan-500/20'
                  : 'bg-neutral-900/90 text-neutral-300 hover:text-white hover:bg-neutral-800 border border-neutral-800'
              }`}
            >
              <Clapperboard className="w-3.5 h-3.5" />
              <span>TV Shows</span>
            </button>

            <button
              id="nav-tab-anime"
              onClick={() => onSelectCategory('anime')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex-shrink-0 cursor-pointer ${
                activeCategory === 'anime' && !searchQuery
                  ? 'bg-cyan-500 text-neutral-950 shadow-md shadow-cyan-500/20'
                  : 'bg-neutral-900/90 text-neutral-300 hover:text-white hover:bg-neutral-800 border border-neutral-800'
              }`}
            >
              <Flame className="w-3.5 h-3.5" />
              <span>Anime</span>
            </button>
          </nav>
        </div>
      </div>
    </header>
  );
};
