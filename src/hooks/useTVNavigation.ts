import { useEffect } from 'react';

/**
 * useTVNavigation
 * Enables automatic spatial navigation for Android TV remotes and keyboard arrows.
 * Also handles Back button navigation (Back / Escape / Backspace).
 */
export function useTVNavigation(options?: {
  onBack?: () => boolean | void; // return true if handled
  enabled?: boolean;
}) {
  const { onBack, enabled = true } = options || {};

  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // 1. Back Navigation
      if (['Escape', 'Backspace', 'GoBack', 'BrowserBack'].includes(e.key)) {
        // If an input is focused and has text, allow normal backspace
        if (e.key === 'Backspace' && document.activeElement instanceof HTMLInputElement) {
          return;
        }
        if (onBack) {
          const handled = onBack();
          if (handled !== false) {
            e.preventDefault();
            return;
          }
        }
      }

      // 2. Spatial Arrow Navigation for D-Pad
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        // If inside an open text input and moving left/right, let input handle caret
        if (
          document.activeElement instanceof HTMLInputElement &&
          ['ArrowLeft', 'ArrowRight'].includes(e.key)
        ) {
          return;
        }

        const focusableSelector =
          'button:not([disabled]):not([tabindex="-1"]), [tabindex="0"], a[href], input:not([disabled])';
        const allFocusable = Array.from(
          document.querySelectorAll<HTMLElement>(focusableSelector)
        ).filter((el) => {
          const rect = el.getBoundingClientRect();
          return (
            rect.width > 0 &&
            rect.height > 0 &&
            !el.closest('#virtual-tv-remote') &&
            window.getComputedStyle(el).visibility !== 'hidden'
          );
        });

        if (allFocusable.length === 0) return;

        const current = document.activeElement as HTMLElement | null;

        // If nothing is currently focused, focus first sensible item
        if (!current || !allFocusable.includes(current)) {
          const heroPlay = document.getElementById('hero-play-btn');
          if (heroPlay && allFocusable.includes(heroPlay)) {
            heroPlay.focus();
            e.preventDefault();
            return;
          }
          allFocusable[0]?.focus();
          e.preventDefault();
          return;
        }

        const curRect = current.getBoundingClientRect();
        const curCenter = {
          x: curRect.left + curRect.width / 2,
          y: curRect.top + curRect.height / 2
        };

        let bestCandidate: HTMLElement | null = null;
        let minDistance = Infinity;

        for (const candidate of allFocusable) {
          if (candidate === current) continue;

          const r = candidate.getBoundingClientRect();
          const center = {
            x: r.left + r.width / 2,
            y: r.top + r.height / 2
          };

          let isValidDir = false;
          if (e.key === 'ArrowRight' && center.x > curCenter.x + 8) isValidDir = true;
          if (e.key === 'ArrowLeft' && center.x < curCenter.x - 8) isValidDir = true;
          if (e.key === 'ArrowDown' && center.y > curCenter.y + 8) isValidDir = true;
          if (e.key === 'ArrowUp' && center.y < curCenter.y - 8) isValidDir = true;

          if (isValidDir) {
            const dx = Math.abs(center.x - curCenter.x);
            const dy = Math.abs(center.y - curCenter.y);

            // Favor movement directly along the axis of the arrow key
            const distance =
              e.key === 'ArrowLeft' || e.key === 'ArrowRight'
                ? dx + dy * 2.2
                : dy + dx * 2.2;

            if (distance < minDistance) {
              minDistance = distance;
              bestCandidate = candidate;
            }
          }
        }

        if (bestCandidate) {
          e.preventDefault();
          bestCandidate.focus();
          bestCandidate.scrollIntoView({
            behavior: 'smooth',
            block: 'nearest',
            inline: 'nearest'
          });
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [enabled, onBack]);
}
