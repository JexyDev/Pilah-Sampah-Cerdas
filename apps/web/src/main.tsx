/**
 * Project: BERSEKA
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 * Dikembangkan sebagai bagian dari program PKL di PT Makerindo, tanpa perjanjian tertulis mengenai kepemilikan hak cipta.
 */

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import "leaflet/dist/leaflet.css";
import App from "./App.tsx";

// Auto-reload when dynamic import / code-splitting chunk fails due to new deployment
window.addEventListener("vite:preloadError", (event) => {
  event.preventDefault();
  console.warn("Vite dynamic import preload error detected. Busting cache & reloading...", event);
  const reloadKey = "vite_preload_last_reload";
  const lastReload = parseInt(sessionStorage.getItem(reloadKey) || "0", 10);
  const now = Date.now();
  if (now - lastReload > 8000) {
    sessionStorage.setItem(reloadKey, now.toString());
    if (typeof window !== "undefined" && "caches" in window) {
      caches
        .keys()
        .then((names) => {
          names.forEach((name) => caches.delete(name));
        })
        .catch(() => {});
    }
    const url = new URL(window.location.href);
    url.searchParams.set("_v", now.toString());
    window.location.replace(url.toString());
  }
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);

