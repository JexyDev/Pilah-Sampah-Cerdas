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
      if (metaEnv.MODE === "test") return true;
      // Staging menu & experimental QC modules hanya aktif jika eksplisit diatur
      if (metaEnv.VITE_ENABLE_STAGING_MENU === "true" || metaEnv.VITE_APP_ENV === "staging") {
        return true;
      }
    }
  } catch {
    // Ignore in non-vite contexts
  }

  // Browser hostname inspection: Hanya aktif pada domain staging resmi (misal: staging.berseka.id)
  if (typeof window !== "undefined" && window.location) {
    const host = (window.location.hostname || "").toLowerCase();
    if (host.includes("staging.berseka.id") || host.startsWith("staging.")) {
      return true;
    }
  }

  // Localhost dan Production default mengikuti menu stabil 'main' (Production mode)
  return false;
};

export const isProductionEnv = (): boolean => !isStagingEnv();
