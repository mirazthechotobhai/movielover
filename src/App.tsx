import React, { useState, useEffect } from 'react';
import { MainPage } from './components/MainPage';
import { PlayerPage } from './components/PlayerPage';
import { RemotePage } from './components/RemotePage';

type ViewMode = 'main' | 'player' | 'remote';

export default function App() {
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    if (typeof window !== 'undefined') {
      const path = window.location.pathname.toLowerCase();
      const search = new URLSearchParams(window.location.search);

      if (path.includes('remote') || search.get('page') === 'remote' || search.has('room')) {
        return 'remote';
      }
      if (path.includes('player') || search.get('page') === 'player') {
        return 'player';
      }
    }
    // Main page does NOT show the QR code - it shows the main cinema catalog with the Player button
    return 'main';
  });

  // Check URL changes (e.g. back/forward navigation)
  useEffect(() => {
    const handlePopState = () => {
      const search = new URLSearchParams(window.location.search);
      const path = window.location.pathname.toLowerCase();
      if (path.includes('remote') || search.get('page') === 'remote' || search.has('room')) {
        setViewMode('remote');
      } else if (path.includes('player') || search.get('page') === 'player') {
        setViewMode('player');
      } else {
        setViewMode('main');
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  return (
    <div className="min-h-screen w-full bg-[#0b0b10] text-white">
      {/* If accessed on /player.html or as player in new tab: Displays full player with QR code on screen */}
      {viewMode === 'player' && (
        <PlayerPage />
      )}

      {/* If accessed on /remote.html or mobile remote */}
      {viewMode === 'remote' && (
        <RemotePage />
      )}

      {/* Main Page: Does NOT display QR code. Has prominent "Player" button to launch player in new tab */}
      {viewMode === 'main' && (
        <MainPage />
      )}
    </div>
  );
}
