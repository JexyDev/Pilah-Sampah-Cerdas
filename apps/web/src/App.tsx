/**
 * Project: BERSEKA
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
            borderRadius: "9999px",
            padding: "10px 24px",
            fontSize: "13px",
            fontWeight: "800",
            maxWidth: "500px",
            boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.06), 0 4px 6px -2px rgba(0, 0, 0, 0.03)",
          },
          success: {
            style: {
              background: "#e6f9f0",
              color: "#005c3d",
              border: "1.5px solid #10b981",
            },
            iconTheme: {
              primary: "#009966",
              secondary: "#ffffff",
            },
          },
          error: {
            style: {
              background: "#fef2f2",
              color: "#991b1b",
              border: "1.5px solid #f87171",
            },
            iconTheme: {
              primary: "#ef4444",
              secondary: "#ffffff",
            },
          },
        }}
      />
      <AppRoutes />
    </BrowserRouter>
  );
};

export default App;
