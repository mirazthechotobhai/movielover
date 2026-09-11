/**
 * Custom 2D Spatial Navigation Engine for Smart TV / 10-Foot UI
 * Designed for web applications running embedded iframe players (e.g., TMDB streams)
 * providing keyboard, remote D-Pad, and spatial focus traversal.
 */

export type SpatialDirection = 'up' | 'down' | 'left' | 'right';

export interface SpatialRect {
  left: number;
  top: number;
  right: number;
  bottom: number;
  width: number;
  height: number;
  cx: number;
  cy: number;
}

type SpatialFocusListener = (element: HTMLElement | null, elementId: string | null) => void;

class SpatialNavigationManager {
  private listeners: Set<SpatialFocusListener> = new Set();
  private currentFocusedElement: HTMLElement | null = null;
  private isEnabled: boolean = true;

  constructor() {
    if (typeof window !== 'undefined') {
      // Sync with native DOM focus events
      window.addEventListener('focusin', this.handleFocusIn, true);
    }
  }

  private handleFocusIn = (e: FocusEvent) => {
    const target = e.target as HTMLElement | null;
    if (target && this.isSpatialCandidate(target)) {
      this.updateFocusedElement(target, false);
    }
  };

  public subscribe(listener: SpatialFocusListener): () => void {
    this.listeners.add(listener);
    listener(this.currentFocusedElement, this.currentFocusedElement?.id || null);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    const id = this.currentFocusedElement?.id || null;
    this.listeners.forEach((fn) => fn(this.currentFocusedElement, id));
  }

  public setEnabled(enabled: boolean) {
    this.isEnabled = enabled;
  }

  public getIsEnabled(): boolean {
    return this.isEnabled;
  }

  public getCurrentElement(): HTMLElement | null {
    return this.currentFocusedElement;
  }

  /**
   * Determine if an element is a candidate for spatial navigation
   */
  public isSpatialCandidate(el: HTMLElement): boolean {
    if (!el || el.nodeType !== Node.ELEMENT_NODE) return false;
    if (el.getAttribute('aria-hidden') === 'true') return false;
    if ((el as HTMLButtonElement).disabled) return false;

    // Must be visible
    const style = window.getComputedStyle(el);
    if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') {
      return false;
    }

    const rect = el.getBoundingClientRect();
    if (rect.width === 0 && rect.height === 0) return false;

    // Marked as spatial or standard focusable interactive element
    const hasSpatialAttr = el.hasAttribute('data-spatial');
    const tabIndex = el.getAttribute('tabindex');
    const isInteractiveTag = ['BUTTON', 'A', 'INPUT', 'SELECT', 'TEXTAREA'].includes(el.tagName);

    return hasSpatialAttr || isInteractiveTag || (tabIndex !== null && tabIndex !== '-1');
  }

  /**
   * Retrieve all currently visible and focusable spatial candidates in the document
   */
  public getCandidates(): HTMLElement[] {
    const selector = '[data-spatial="true"], button:not([disabled]), a[href], [tabindex="0"], input:not([disabled])';
    const elements = Array.from(document.querySelectorAll<HTMLElement>(selector));
    return elements.filter((el) => this.isSpatialCandidate(el));
  }

  private getRect(el: HTMLElement): SpatialRect {
    const rect = el.getBoundingClientRect();
    return {
      left: rect.left,
      top: rect.top,
      right: rect.right,
      bottom: rect.bottom,
      width: rect.width,
      height: rect.height,
      cx: rect.left + rect.width / 2,
      cy: rect.top + rect.height / 2,
    };
  }

  /**
   * Update active spatial focus with visual classes and native .focus()
   */
  public updateFocusedElement(el: HTMLElement | null, triggerNativeFocus: boolean = true) {
    if (this.currentFocusedElement && this.currentFocusedElement !== el) {
      this.currentFocusedElement.classList.remove('spatial-focused');
      this.currentFocusedElement.removeAttribute('data-focused');
    }

    this.currentFocusedElement = el;

    if (el) {
      el.classList.add('spatial-focused');
      el.setAttribute('data-focused', 'true');

      if (triggerNativeFocus && document.activeElement !== el) {
        try {
          el.focus({ preventScroll: true });
        } catch {
          // Ignore
        }
      }

      // Smoothly scroll into viewport if offscreen
      this.ensureVisible(el);
    }

    this.notify();
  }

  private ensureVisible(el: HTMLElement) {
    try {
      const rect = el.getBoundingClientRect();
      const inView =
        rect.top >= 0 &&
        rect.left >= 0 &&
        rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
        rect.right <= (window.innerWidth || document.documentElement.clientWidth);

      if (!inView) {
        el.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
      }
    } catch {
      // Fallback
    }
  }

  /**
   * Calculate 2D directional score based on W3C CSS Spatial Navigation principles:
   * Prioritizes elements strictly in the heading direction and rewards collinear alignment.
   */
  private calculateDistance(current: SpatialRect, candidate: SpatialRect, dir: SpatialDirection): number | null {
    let primaryDist = 0;
    let secondaryDist = 0;
    let hasCollinearOverlap = false;

    switch (dir) {
      case 'left':
        primaryDist = current.left - candidate.right;
        if (primaryDist < -5) return null; // Behind or right of current
        secondaryDist = Math.abs(current.cy - candidate.cy);
        hasCollinearOverlap = candidate.bottom >= current.top && candidate.top <= current.bottom;
        break;

      case 'right':
        primaryDist = candidate.left - current.right;
        if (primaryDist < -5) return null; // Behind or left of current
        secondaryDist = Math.abs(current.cy - candidate.cy);
        hasCollinearOverlap = candidate.bottom >= current.top && candidate.top <= current.bottom;
        break;

      case 'up':
        primaryDist = current.top - candidate.bottom;
        if (primaryDist < -5) return null; // Below current
        secondaryDist = Math.abs(current.cx - candidate.cx);
        hasCollinearOverlap = candidate.right >= current.left && candidate.left <= current.right;
        break;

      case 'down':
        primaryDist = candidate.top - current.bottom;
        if (primaryDist < -5) return null; // Above current
        secondaryDist = Math.abs(current.cx - candidate.cx);
        hasCollinearOverlap = candidate.right >= current.left && candidate.left <= current.right;
        break;
    }

    // Direct Euclidean distance between centers
    const dx = current.cx - candidate.cx;
    const dy = current.cy - candidate.cy;
    const euclidean = Math.sqrt(dx * dx + dy * dy);

    // If there's collinear overlap in the perpendicular axis, penalize secondary axis less
    const secondaryWeight = hasCollinearOverlap ? 1.2 : 2.8;

    return Math.max(0, primaryDist) * 1.5 + secondaryDist * secondaryWeight + euclidean * 0.4;
  }

  /**
   * Move spatial focus in a given 2D direction
   */
  public navigate(dir: SpatialDirection): HTMLElement | null {
    const candidates = this.getCandidates();
    if (candidates.length === 0) return null;

    // If nothing currently focused, focus default (preferably center OK or player frame)
    if (!this.currentFocusedElement || !document.body.contains(this.currentFocusedElement)) {
      const defaultTarget =
        document.getElementById('dpad-btn-center-ok') ||
        document.getElementById('spatial-player-frame') ||
        candidates[0];

      if (defaultTarget) {
        this.updateFocusedElement(defaultTarget, true);
        return defaultTarget;
      }
      return null;
    }

    const currentRect = this.getRect(this.currentFocusedElement);

    let bestCandidate: HTMLElement | null = null;
    let bestScore = Infinity;

    for (const cand of candidates) {
      if (cand === this.currentFocusedElement) continue;

      const candRect = this.getRect(cand);
      const score = this.calculateDistance(currentRect, candRect, dir);

      if (score !== null && score < bestScore) {
        bestScore = score;
        bestCandidate = cand;
      }
    }

    if (bestCandidate) {
      this.updateFocusedElement(bestCandidate, true);
      return bestCandidate;
    }

    // Smart Fallback across main regions (Player <-> Remote)
    return this.smartRegionFallback(dir);
  }

  /**
   * Fallback bridge between Player and Remote sections if geometrical bounds
   * have large padding gaps.
   */
  private smartRegionFallback(dir: SpatialDirection): HTMLElement | null {
    if (!this.currentFocusedElement) return null;
    const isInsidePlayer = !!this.currentFocusedElement.closest('#media-player-container');
    const isInsideRemote = !!this.currentFocusedElement.closest('#remote-control-container');

    if (dir === 'down' && isInsidePlayer) {
      const remoteTarget =
        document.getElementById('dpad-btn-up') ||
        document.getElementById('dpad-btn-center-ok') ||
        document.getElementById('btn-remote-mode');
      if (remoteTarget) {
        this.updateFocusedElement(remoteTarget, true);
        return remoteTarget;
      }
    } else if (dir === 'up' && isInsideRemote) {
      const playerTarget =
        document.getElementById('btn-bezel-play') ||
        document.getElementById('spatial-player-frame') ||
        document.getElementById('btn-focus-player');
      if (playerTarget) {
        this.updateFocusedElement(playerTarget, true);
        return playerTarget;
      }
    }

    return null;
  }

  /**
   * Activate currently focused element (simulates click or enters player)
   */
  public activateCurrent(): boolean {
    if (!this.currentFocusedElement) {
      // Default to center OK
      const defaultTarget = document.getElementById('dpad-btn-center-ok');
      if (defaultTarget) {
        defaultTarget.click();
        return true;
      }
      return false;
    }

    const el = this.currentFocusedElement;

    // Special handler if the focused item is the Movie Player Frame
    if (el.id === 'spatial-player-frame' || el.closest('#embed-master-iframe')) {
      const iframe = document.getElementById('embed-master-iframe') as HTMLIFrameElement | null;
      if (iframe) {
        try {
          iframe.focus();
        } catch {}
      }
      return true;
    }

    // Native click invocation
    el.click();
    return true;
  }

  /**
   * Explicitly set spatial focus to an element or element ID
   */
  public setFocus(target: HTMLElement | string | null) {
    if (!target) {
      this.updateFocusedElement(null);
      return;
    }

    const el = typeof target === 'string' ? document.getElementById(target) : target;
    if (el && this.isSpatialCandidate(el)) {
      this.updateFocusedElement(el, true);
    }
  }
}

// Global Singleton Instance
export const spatialNav = new SpatialNavigationManager();
