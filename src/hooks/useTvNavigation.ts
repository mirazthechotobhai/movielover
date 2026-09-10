import { useEffect, useState, useCallback, useRef } from 'react';

interface UseTvNavigationOptions {
  enabled?: boolean;
  onBack?: () => void;
  onPlayPause?: () => void;
}

export function useTvNavigation({ enabled = true, onBack, onPlayPause }: UseTvNavigationOptions = {}) {
  const [currentFocusId, setCurrentFocusId] = useState<string | null>(null);
  const isNavigatingWithKeys = useRef(false);

  // Helper to find all navigable elements
  const getNavigableElements = useCallback((): HTMLElement[] => {
    const selector = 'button:not([disabled]), [tabindex="0"], a[href], input:not([disabled]), [data-nav="true"]';
    const elements = Array.from(document.querySelectorAll<HTMLElement>(selector));
    return elements.filter((el) => {
      // Must be visible
      const style = window.getComputedStyle(el);
      return style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0' && el.offsetParent !== null;
    });
  }, []);

  // Spatial navigation calculation
  const findNextElement = useCallback(
    (currentEl: HTMLElement, direction: 'up' | 'down' | 'left' | 'right'): HTMLElement | null => {
      const elements = getNavigableElements().filter((el) => el !== currentEl);
      if (elements.length === 0) return null;

      const currentRect = currentEl.getBoundingClientRect();
      const currentCenter = {
        x: currentRect.left + currentRect.width / 2,
        y: currentRect.top + currentRect.height / 2,
      };

      let bestElement: HTMLElement | null = null;
      let minDistance = Infinity;

      for (const el of elements) {
        const rect = el.getBoundingClientRect();
        const center = {
          x: rect.left + rect.width / 2,
          y: rect.top + rect.height / 2,
        };

        const dx = center.x - currentCenter.x;
        const dy = center.y - currentCenter.y;

        let isInDirection = false;
        let primaryDist = 0;
        let secondaryDist = 0;

        switch (direction) {
          case 'up':
            isInDirection = dy < -8;
            primaryDist = Math.abs(dy);
            secondaryDist = Math.abs(dx);
            break;
          case 'down':
            isInDirection = dy > 8;
            primaryDist = Math.abs(dy);
            secondaryDist = Math.abs(dx);
            break;
          case 'left':
            isInDirection = dx < -8;
            primaryDist = Math.abs(dx);
            secondaryDist = Math.abs(dy);
            break;
          case 'right':
            isInDirection = dx > 8;
            primaryDist = Math.abs(dx);
            secondaryDist = Math.abs(dy);
            break;
        }

        if (isInDirection) {
          // Weighted distance gives priority to items aligned along the movement axis
          const score = primaryDist + secondaryDist * 1.8;
          if (score < minDistance) {
            minDistance = score;
            bestElement = el;
          }
        }
      }

      return bestElement;
    },
    [getNavigableElements]
  );

  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement as HTMLElement | null;

      // Do not intercept input typing unless it's an arrow key escape or enter
      const isInput = activeEl?.tagName === 'INPUT' || activeEl?.tagName === 'TEXTAREA';

      // Android TV / Remote key codes
      switch (e.key) {
        case 'ArrowUp':
        case 'Up': {
          if (isInput && e.key !== 'ArrowUp') return;
          e.preventDefault();
          isNavigatingWithKeys.current = true;
          const current = activeEl || getNavigableElements()[0];
          if (current) {
            const next = findNextElement(current, 'up');
            if (next) {
              next.focus();
              next.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
              setCurrentFocusId(next.id || next.getAttribute('data-nav-id') || null);
            }
          }
          break;
        }

        case 'ArrowDown':
        case 'Down': {
          if (isInput && e.key !== 'ArrowDown') return;
          e.preventDefault();
          isNavigatingWithKeys.current = true;
          const current = activeEl || getNavigableElements()[0];
          if (current) {
            const next = findNextElement(current, 'down');
            if (next) {
              next.focus();
              next.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
              setCurrentFocusId(next.id || next.getAttribute('data-nav-id') || null);
            }
          }
          break;
        }

        case 'ArrowLeft':
        case 'Left': {
          if (isInput) return; // allow cursor moving in text input
          e.preventDefault();
          isNavigatingWithKeys.current = true;
          const current = activeEl || getNavigableElements()[0];
          if (current) {
            const next = findNextElement(current, 'left');
            if (next) {
              next.focus();
              next.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
              setCurrentFocusId(next.id || next.getAttribute('data-nav-id') || null);
            }
          }
          break;
        }

        case 'ArrowRight':
        case 'Right': {
          if (isInput) return; // allow cursor moving in text input
          e.preventDefault();
          isNavigatingWithKeys.current = true;
          const current = activeEl || getNavigableElements()[0];
          if (current) {
            const next = findNextElement(current, 'right');
            if (next) {
              next.focus();
              next.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
              setCurrentFocusId(next.id || next.getAttribute('data-nav-id') || null);
            }
          }
          break;
        }

        case 'Enter': {
          // OK button on TV remote
          if (activeEl && activeEl !== document.body && !isInput) {
            e.preventDefault();
            activeEl.click();
          }
          break;
        }

        case 'Escape':
        case 'Backspace':
        case 'GoBack': {
          // Back button on TV remote
          if (isInput) return;
          if (onBack) {
            e.preventDefault();
            onBack();
          }
          break;
        }

        case 'MediaPlayPause':
        case 'MediaPlay':
        case 'MediaPause': {
          if (onPlayPause) {
            e.preventDefault();
            onPlayPause();
          }
          break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [enabled, findNextElement, getNavigableElements, onBack, onPlayPause]);

  return {
    currentFocusId,
    isNavigatingWithKeys: isNavigatingWithKeys.current,
  };
}
