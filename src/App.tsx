import React, { useState, useEffect } from 'react';
import { PlayerPage } from './components/PlayerPage';
import { RemoteControlPage } from './components/RemoteControlPage';
import { Tv, Smartphone, ExternalLink } from 'lucide-react';
import { getPlayerUrl, openPlayerInNewTab } from './utils/navigation';

export default function App() {
  const getInitialView = (): 'player' | 'remote' => {
    if (typeof window !== 'undefined') {
      const path = window.location.pathname.toLowerCase();
      const params = new URLSearchParams(window.location.search);
      // If explicitly tv / player mode or path is tv.html / player.html
      if (
        params.get('mode') === 'tv' ||
        params.get('mode') === 'player' ||
        path.includes('/tv') ||
        path.includes('tv.html') ||
        path.includes('player')
      ) {
        return 'player';
      }
      if (params.get('mode') === 'remote' || path.includes('remote')) {
        return 'remote';
      }
    }
    // Main page is remote page by default
    return 'remote';
  };

  const [activeView, setActiveView] = useState<'player' | 'remote'>(getInitialView);

  // Sync with browser history / popstate if user navigates back/forth
  useEffect(() => {
    const handlePopState = () => {
      setActiveView(getInitialView());
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const switchToView = (view: 'player' | 'remote') => {
    setActiveView(view);
    if (typeof window !== 'undefined' && window.history) {
      const url = new URL(window.location.href);
      if (view === 'remote') {
        url.searchParams.set('mode', 'remote');
      } else {
        url.searchParams.set('mode', 'tv');
      }
      window.history.pushState({}, '', url.toString());
    }
  };

  return (
    <div className="relative min-h-screen w-full bg-black text-white flex flex-col font-sans">
      {/* Floating Action Bar - ONLY shown on Remote view, completely hidden on TV Player */}
      {activeView === 'remote' && (
        <div className="fixed bottom-3 right-3 z-50 flex items-center gap-1.5 p-1.5 rounded-2xl bg-zinc-900/95 border border-zinc-700/80 shadow-2xl backdrop-blur-md text-xs">
          {/* TV Button: opens Player in a new tab with fullscreen & autoplay */}
          <a
            href={getPlayerUrl()}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => {
              e.preventDefault();
              openPlayerInNewTab();
            }}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-black shadow-lg shadow-cyan-500/25 transition active:scale-95 cursor-pointer"
            title="Open Fullscreen TV Player with Autoplay in New Tab"
          >
            <Tv className="w-4 h-4 text-white" />
            <span className="font-black tracking-wider">TV</span>
            <ExternalLink className="w-3 h-3 ml-0.5 opacity-90" />
          </a>

          {/* View switcher for current tab */}
          <button
            onClick={() => switchToView('player')}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition text-xs font-medium cursor-pointer"
            title="Switch to TV Player view in current tab"
          >
            <Tv className="w-3.5 h-3.5 text-zinc-400" />
            <span>TV View</span>
          </button>
        </div>
      )}

      {/* Render Active View */}
      {activeView === 'player' ? (
        <PlayerPage onNavigateToRemote={() => switchToView('remote')} />
      ) : (
        <RemoteControlPage onBackToPlayer={() => switchToView('player')} />
      )}
    </div>
  );
}
