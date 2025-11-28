import { useEffect, RefObject } from 'react';

function getFocusableElements(container: HTMLElement | null): HTMLElement[] {
  if (!container) return [];
  const selectors = [
    'a[href]',
    'area[href]',
    'input:not([disabled]):not([type="hidden"])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    'button:not([disabled])',
    'iframe',
    'object',
    'embed',
    '[contenteditable]',
    '[tabindex]:not([tabindex="-1"])',
  ];
  const nodes = Array.from(container.querySelectorAll<HTMLElement>(selectors.join(',')));
  return nodes.filter((el) => !!(el.offsetWidth || el.offsetHeight || el.getClientRects().length));
}

// Simple focus trap hook: when active, traps Tab/Shift+Tab inside container and
// restores focus to the previously focused element on deactivate.
export default function useFocusTrap(containerRef: RefObject<HTMLElement | null>, active: boolean) {
  useEffect(() => {
    if (!active) return;
    const container = containerRef.current;
    if (!container) return;

    const prevActive = document.activeElement as HTMLElement | null;

    // Move focus to the first focusable element or container itself
    const focusables = getFocusableElements(container);
    const first = focusables[0] ?? container;
    first.focus();

    function handleKey(e: KeyboardEvent) {
      if (e.key !== 'Tab') return;
      const focusList = getFocusableElements(container);
      if (focusList.length === 0) {
        e.preventDefault();
        return;
      }
      const firstEl = focusList[0];
      const lastEl = focusList[focusList.length - 1];

      if (!e.shiftKey && document.activeElement === lastEl) {
        e.preventDefault();
        firstEl.focus();
        return;
      }
      if (e.shiftKey && document.activeElement === firstEl) {
        e.preventDefault();
        lastEl.focus();
        return;
      }
    }

    function handleFocusIn(e: FocusEvent) {
      if (!container) return
      if (!container.contains(e.target as Node)) {
        // If focus moves outside, bring it back to the container
        const focusList = getFocusableElements(container);
        (focusList[0] ?? container).focus();
      }
    }

    document.addEventListener('keydown', handleKey);
    document.addEventListener('focusin', handleFocusIn);

    return () => {
      document.removeEventListener('keydown', handleKey);
      document.removeEventListener('focusin', handleFocusIn);
      try {
        prevActive?.focus();
      } catch (e) {
        // ignore
      }
    };
  }, [containerRef, active]);
}
