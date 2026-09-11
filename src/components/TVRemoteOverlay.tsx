import React from 'react';
import { 
  ChevronUp, 
  ChevronDown, 
  ChevronLeft, 
  ChevronRight, 
  CornerDownLeft, 
  ArrowLeft, 
  Play, 
  Volume2, 
  VolumeX, 
  X, 
  Tv 
} from 'lucide-react';

interface TVRemoteOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TVRemoteOverlay: React.FC<TVRemoteOverlayProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const dispatchVirtualKey = (key: string, keyCode: number) => {
    // Dispatch to activeElement or document
    const target = document.activeElement || document.body;
    
    // For arrow keys, we can also perform spatial navigation fallback if focus didn't move
    const eventDown = new KeyboardEvent('keydown', {
      key,
      code: key,
      keyCode,
      which: keyCode,
      bubbles: true,
      cancelable: true
    });
    target.dispatchEvent(eventDown);

    // If Enter, trigger click on active element
    if (key === 'Enter' && document.activeElement instanceof HTMLElement) {
      document.activeElement.click();
    }

    // Spatial focus helper for arrow keys when using virtual remote
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(key)) {
      handleSpatialFocus(key);
    }
  };

  const handleSpatialFocus = (direction: string) => {
    const focusableSelector = 'button:not([disabled]), [tabindex="0"], a[href], input:not([disabled])';
    const focusable = Array.from(document.querySelectorAll<HTMLElement>(focusableSelector))
      .filter(el => {
        const rect = el.getBoundingClientRect();
        return rect.width > 0 && rect.height > 0 && !el.closest('#virtual-tv-remote');
      });

    if (focusable.length === 0) return;

    const current = document.activeElement as HTMLElement | null;
    if (!current || !focusable.includes(current)) {
      focusable[0]?.focus();
      return;
    }

    const curRect = current.getBoundingClientRect();
    const curCenter = {
      x: curRect.left + curRect.width / 2,
      y: curRect.top + curRect.height / 2
    };

    let bestCandidate: HTMLElement | null = null;
    let minDistance = Infinity;

    for (const el of focusable) {
      if (el === current) continue;
      const r = el.getBoundingClientRect();
      const center = {
        x: r.left + r.width / 2,
        y: r.top + r.height / 2
      };

      let isValidDir = false;
      if (direction === 'ArrowRight' && center.x > curCenter.x + 10) isValidDir = true;
      if (direction === 'ArrowLeft' && center.x < curCenter.x - 10) isValidDir = true;
      if (direction === 'ArrowDown' && center.y > curCenter.y + 10) isValidDir = true;
      if (direction === 'ArrowUp' && center.y < curCenter.y - 10) isValidDir = true;

      if (isValidDir) {
        // Weighted distance (primary axis has lower cost)
        const dx = Math.abs(center.x - curCenter.x);
        const dy = Math.abs(center.y - curCenter.y);
        const dist = (direction === 'ArrowLeft' || direction === 'ArrowRight')
          ? dx + dy * 2.5
          : dy + dx * 2.5;

        if (dist < minDistance) {
          minDistance = dist;
          bestCandidate = el;
        }
      }
    }

    if (bestCandidate) {
      bestCandidate.focus();
      bestCandidate.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
    }
  };

  return (
    <div
      id="virtual-tv-remote"
      className="fixed bottom-5 right-5 z-50 w-72 bg-slate-900/95 backdrop-blur-xl border border-sky-500/30 rounded-3xl shadow-2xl p-4 text-white select-none animate-in slide-in-from-bottom-5 duration-200"
    >
      {/* Remote Header */}
      <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-sky-500/20 text-sky-400">
            <Tv className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold tracking-tight">Android TV Remote</h4>
            <p className="text-[10px] text-slate-400">D-Pad & Navigation Hub</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* D-Pad Controller */}
      <div className="flex flex-col items-center justify-center my-2">
        <div className="relative w-44 h-44 rounded-full bg-slate-800/90 border border-white/15 p-2 flex items-center justify-center shadow-inner">
          {/* UP */}
          <button
            onClick={() => dispatchVirtualKey('ArrowUp', 38)}
            className="absolute top-2 left-1/2 -translate-x-1/2 w-12 h-10 rounded-t-full bg-slate-700/60 hover:bg-sky-500 active:scale-95 text-slate-200 hover:text-white flex items-center justify-center transition-all"
            title="Arrow Up"
          >
            <ChevronUp className="w-6 h-6" />
          </button>

          {/* DOWN */}
          <button
            onClick={() => dispatchVirtualKey('ArrowDown', 40)}
            className="absolute bottom-2 left-1/2 -translate-x-1/2 w-12 h-10 rounded-b-full bg-slate-700/60 hover:bg-sky-500 active:scale-95 text-slate-200 hover:text-white flex items-center justify-center transition-all"
            title="Arrow Down"
          >
            <ChevronDown className="w-6 h-6" />
          </button>

          {/* LEFT */}
          <button
            onClick={() => dispatchVirtualKey('ArrowLeft', 37)}
            className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-12 rounded-l-full bg-slate-700/60 hover:bg-sky-500 active:scale-95 text-slate-200 hover:text-white flex items-center justify-center transition-all"
            title="Arrow Left"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>

          {/* RIGHT */}
          <button
            onClick={() => dispatchVirtualKey('ArrowRight', 39)}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-12 rounded-r-full bg-slate-700/60 hover:bg-sky-500 active:scale-95 text-slate-200 hover:text-white flex items-center justify-center transition-all"
            title="Arrow Right"
          >
            <ChevronRight className="w-6 h-6" />
          </button>

          {/* CENTER OK BUTTON */}
          <button
            onClick={() => dispatchVirtualKey('Enter', 13)}
            className="w-16 h-16 rounded-full bg-sky-500 hover:bg-sky-400 active:scale-90 text-white font-extrabold text-sm flex items-center justify-center shadow-lg shadow-sky-500/30 transition-all border-2 border-white/20"
            title="OK / Select (Enter)"
          >
            OK
          </button>
        </div>
      </div>

      {/* Function Buttons Row */}
      <div className="grid grid-cols-3 gap-2 mt-3 pt-2 border-t border-white/10">
        <button
          onClick={() => dispatchVirtualKey('Escape', 27)}
          className="flex flex-col items-center justify-center py-2 rounded-xl bg-white/5 hover:bg-white/15 active:scale-95 border border-white/10 text-slate-300"
          title="Back (ESC)"
        >
          <ArrowLeft className="w-4 h-4 text-sky-400" />
          <span className="text-[10px] font-semibold mt-0.5">Back</span>
        </button>

        <button
          onClick={() => dispatchVirtualKey(' ', 32)}
          className="flex flex-col items-center justify-center py-2 rounded-xl bg-white/5 hover:bg-white/15 active:scale-95 border border-white/10 text-slate-300"
          title="Play / Pause"
        >
          <Play className="w-4 h-4 text-emerald-400" />
          <span className="text-[10px] font-semibold mt-0.5">Play/Pause</span>
        </button>

        <button
          onClick={() => dispatchVirtualKey('Enter', 13)}
          className="flex flex-col items-center justify-center py-2 rounded-xl bg-white/5 hover:bg-white/15 active:scale-95 border border-white/10 text-slate-300"
          title="Select"
        >
          <CornerDownLeft className="w-4 h-4 text-amber-400" />
          <span className="text-[10px] font-semibold mt-0.5">Select</span>
        </button>
      </div>

      {/* Guide Note */}
      <p className="text-[10px] text-slate-400 text-center mt-2.5">
        Physical TV Remote arrows, OK, and Back work natively!
      </p>
    </div>
  );
};
