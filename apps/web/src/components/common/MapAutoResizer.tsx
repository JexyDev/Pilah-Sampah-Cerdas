/**
 * Project: BERSEKA
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 * 
 * MapAutoResizer: Automatically triggers map.invalidateSize() on mount, window resize,
 * orientation change, and layout reflow to eliminate grey/unrendered tile artifacts on mobile and tab switching.
 */

import React, { useEffect } from "react";
import { useMap } from "react-leaflet";

export interface MapAutoResizerProps {
  delayMs?: number;
}

export const MapAutoResizer: React.FC<MapAutoResizerProps> = ({ delayMs = 250 }) => {
  const map = useMap();

  useEffect(() => {
    // Initial invalidate after render/transitions
    const timer = setTimeout(() => {
      try {
        map.invalidateSize();
      } catch {
        // Ignore if unmounted
      }
    }, delayMs);

    const handleResize = () => {
      try {
        map.invalidateSize();
      } catch {
        // Ignore
      }
    };

    window.addEventListener("resize", handleResize);
    window.addEventListener("orientationchange", handleResize);

    return () => {
      clearTimeout(timer);
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("orientationchange", handleResize);
    };
  }, [map, delayMs]);

  return null;
};

export default MapAutoResizer;
