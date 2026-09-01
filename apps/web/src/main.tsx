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
  console.warn("Vite dynamic import preload error detected. Reloading page...", event);
  const reloaded = sessionStorage.getItem("vite_preload_reloaded");
  if (!reloaded) {
    sessionStorage.setItem("vite_preload_reloaded", "true");
    window.location.reload();
  }
});

// Clear reload guard once page loads successfully
window.addEventListener("load", () => {
  sessionStorage.removeItem("vite_preload_reloaded");
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);

