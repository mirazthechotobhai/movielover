import React, { useState, useEffect } from 'react';
import { Film, Tv, Sparkles, Search, Bookmark, Gamepad2, Clock } from 'lucide-react';
import { MainCategory } from '../types';

interface NavbarProps {
  activeCategory: MainCategory;
  onSelectCategory: (cat: MainCategory) => void;
  onOpenSearch: () => void;
  onOpenWatchlist: () => void;
  onToggleRemoteHelp: () => void;
  isRemoteOverlayOpen: boolean;
  watchlistCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeCategory,
  onSelectCategory,
  onOpenSearch,
  onOpenWatchlist,
  onToggleRemoteHelp,
  isRemoteOverlayOpen,
  watchlistCount
}) => {
  const [time, setTime] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTime(
        now.toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
          hour12: true
        })
      );
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <header className="sticky top-0 z-40 bg-[#090a0f]/90 backdrop-blur-md border-b border-white/5 tv-safe-area py-3 transition-colors">
      <div className="flex items-center justify-between gap-4">
        {/* Logo & TV Badge */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-sky-500/20 ring-1 ring-white/20">
              <Film className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-heading font-extrabold text-xl tracking-tight text-white">
                  GoTo<span className="text-sky-400">Cinema</span>
                </span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-sky-500/20 text-sky-300 border border-sky-500/30 uppercase tracking-wider">
                  TV
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">Smart Android TV Edition</p>
            </div>
          </div>
        </div>

        {/* 3 Main Categories Requested: Movie, TV Show, Anime */}
        <nav className="flex items-center p-1 rounded-2xl bg-white/[0.04] border border-white/10 shadow-inner" role="tablist">
          <button
            id="nav-tab-movie"
            role="tab"
            aria-selected={activeCategory === 'movie'}
            onClick={() => onSelectCategory('movie')}
            className={`tv-focusable flex items-center gap-2 px-4 sm:px-5 py-2 rounded-xl text-sm sm:text-base font-semibold transition-all ${
              activeCategory === 'movie'
                ? 'bg-sky-500 text-white shadow-md shadow-sky-500/30'
                : 'text-slate-300 hover:text-white hover:bg-white/5'
            }`}
          >
            <Film className="w-4 h-4 sm:w-5 sm:h-5" />
            <span>Movies</span>
          </button>

          <button
            id="nav-tab-tv"
            role="tab"
            aria-selected={activeCategory === 'tv'}
            onClick={() => onSelectCategory('tv')}
            className={`tv-focusable flex items-center gap-2 px-4 sm:px-5 py-2 rounded-xl text-sm sm:text-base font-semibold transition-all ${
              activeCategory === 'tv'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-300 hover:text-white hover:bg-white/5'
            }`}
          >
            <Tv className="w-4 h-4 sm:w-5 sm:h-5" />
            <span>TV Shows</span>
          </button>

          <button
            id="nav-tab-anime"
            role="tab"
            aria-selected={activeCategory === 'anime'}
            onClick={() => onSelectCategory('anime')}
            className={`tv-focusable flex items-center gap-2 px-4 sm:px-5 py-2 rounded-xl text-sm sm:text-base font-semibold transition-all ${
              activeCategory === 'anime'
                ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30'
                : 'text-slate-300 hover:text-white hover:bg-white/5'
            }`}
          >
            <Sparkles className="w-4 h-4 sm:w-5 sm:h-5" />
            <span>Anime</span>
          </button>
        </nav>

        {/* Right Tools: Search, Watchlist, Remote D-pad Toggle, Clock */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Search Button */}
          <button
            id="nav-search-btn"
            onClick={onOpenSearch}
            className="tv-focusable p-2.5 rounded-xl bg-white/[0.05] hover:bg-white/10 text-slate-200 border border-white/10 flex items-center gap-2 text-sm"
            title="Search Movies, Shows & Anime"
          >
            <Search className="w-4 h-4 sm:w-5 sm:h-5 text-sky-400" />
            <span className="hidden md:inline text-xs font-medium text-slate-300">Search</span>
          </button>

          {/* Watchlist Button */}
          <button
            id="nav-watchlist-btn"
            onClick={onOpenWatchlist}
            className="tv-focusable p-2.5 rounded-xl bg-white/[0.05] hover:bg-white/10 text-slate-200 border border-white/10 relative flex items-center gap-2 text-sm"
            title="My Watchlist"
          >
            <Bookmark className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400" />
            <span className="hidden md:inline text-xs font-medium text-slate-300">Watchlist</span>
            {watchlistCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-amber-500 text-black font-bold text-[10px] w-4 h-4 rounded-full flex items-center justify-center">
                {watchlistCount}
              </span>
            )}
          </button>

          {/* TV Remote Mode / Virtual Remote Toggle */}
          <button
            id="nav-remote-btn"
            onClick={onToggleRemoteHelp}
            className={`tv-focusable p-2.5 rounded-xl border flex items-center gap-1.5 text-xs font-medium transition-all ${
              isRemoteOverlayOpen
                ? 'bg-sky-500/20 border-sky-400 text-sky-300 shadow-sm shadow-sky-500/20'
                : 'bg-white/[0.05] hover:bg-white/10 border-white/10 text-slate-300'
            }`}
            title="TV Remote Navigation Helper"
          >
            <Gamepad2 className="w-4 h-4 text-sky-400" />
            <span className="hidden lg:inline">TV Remote</span>
          </button>

          {/* TV Clock Display */}
          {time && (
            <div className="hidden xl:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.03] border border-white/5 text-slate-400 font-mono text-xs">
              <Clock className="w-3.5 h-3.5 text-slate-500" />
              <span>{time}</span>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
