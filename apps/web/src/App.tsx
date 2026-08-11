/**
 * Project: TrashCare
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 * Dikembangkan sebagai bagian dari program PKL di PT Makerindo, tanpa perjanjian tertulis mengenai kepemilikan hak cipta.
 */

import React, { useEffect } from "react";
import { BrowserRouter } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import AppRoutes from "./routes/AppRoutes";
import { useThemeStore } from "./store/useThemeStore";
import "./App.css";

const App: React.FC = () => {
  useEffect(() => {
    useThemeStore.getState().initTheme();
  }, []);

  return (
    <BrowserRouter>
      <Toaster
        position="top-center"
        toastOptions={{
          duration: 4000,
          style: {
            background: "transparent",
            boxShadow: "none",
            padding: 0,
            maxWidth: "420px",
          },
        }}
      />
      <AppRoutes />
    </BrowserRouter>
  );
};

export default App;
