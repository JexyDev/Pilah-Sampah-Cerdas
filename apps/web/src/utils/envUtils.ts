/**
 * Project: BERSEKA
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 * 
 * Utility penentu lingkungan operasional (Staging / Development vs Production Main).
 */

export const isStagingEnv = (): boolean => {
  // Test environment fallback
  if (typeof process !== "undefined" && process.env && process.env.NODE_ENV === "test") {
    return true;
  }

  // Vite environment variables
  try {
    const metaEnv = import.meta.env;
    if (metaEnv) {
      if (metaEnv.MODE === "test" || metaEnv.DEV) return true;
      const appEnv = String(metaEnv.VITE_APP_ENV || metaEnv.MODE || "").toLowerCase();
      if (appEnv === "staging" || appEnv === "development") return true;
    }
  } catch {
    // Ignore in non-vite contexts
  }

  // Browser hostname inspection
  if (typeof window !== "undefined" && window.location) {
    const host = (window.location.hostname || "").toLowerCase();
    if (
      host.includes("staging") ||
      host === "localhost" ||
      host === "127.0.0.1" ||
      host.startsWith("192.168.") ||
      host.startsWith("10.") ||
      host.endsWith(".local")
    ) {
      return true;
    }
  }

  return false;
};
