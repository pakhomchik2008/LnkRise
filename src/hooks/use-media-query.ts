"use client";

import * as React from "react";

export function useMediaQuery(query: string): boolean {
  const subscribe = React.useCallback(
    (onChange: () => void) => {
      const list = window.matchMedia(query);
      list.addEventListener("change", onChange);
      return () => list.removeEventListener("change", onChange);
    },
    [query],
  );

  const getSnapshot = React.useCallback(() => window.matchMedia(query).matches, [query]);

  // Server has no viewport — report false and let the client correct it.
  return React.useSyncExternalStore(subscribe, getSnapshot, () => false);
}

export const useIsMobile = () => useMediaQuery("(max-width: 767px)");
export const useIsDesktop = () => useMediaQuery("(min-width: 1024px)");
