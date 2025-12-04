"use client";

import { useState, useEffect } from 'react';

/**
 * Hook to detect mobile viewport based on screen width.
 * Uses matchMedia for real-time updates when viewport changes.
 * 
 * @param breakpoint - Width threshold in pixels (default: 768 for md breakpoint)
 * @returns boolean - true if viewport width is less than breakpoint
 */
export default function useIsMobile(breakpoint: number = 768): boolean {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Check if window is available (client-side)
    if (typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia(`(max-width: ${breakpoint - 1}px)`);
    
    // Set initial value
    setIsMobile(mediaQuery.matches);

    // Handler for media query changes
    const handleChange = (event: MediaQueryListEvent) => {
      setIsMobile(event.matches);
    };

    // Add listener for viewport changes
    mediaQuery.addEventListener('change', handleChange);

    // Cleanup listener on unmount
    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, [breakpoint]);

  return isMobile;
}
