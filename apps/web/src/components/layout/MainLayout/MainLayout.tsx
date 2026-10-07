/**
 * Project: BERSEKA
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 * Dikembangkan sebagai bagian dari program PKL di PT Makerindo, tanpa perjanjian tertulis mengenai kepemilikan hak cipta.
 */

import React, { useState, useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";

import { ErrorBoundary } from "react-error-boundary";
import Sidebar from "../Sidebar/Sidebar";
import Header from "../Header/Header";
import ErrorBoundaryFallback from "../../common/ErrorBoundaryFallback";
import { useThemeStore } from "../../../store/useThemeStore";
import { useAuthStore } from "../../../store/useAuthStore";
import { IOSSafariGate } from "../../common/IOSSafariGate";

const MainLayout: React.FC = () => {
  const { user } = useAuthStore();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Sync darkmode exclusively when user is inside the authenticated menu/dashboard layout
  useEffect(() => {
    useThemeStore.getState().setInsideMainLayout(true);
    return () => {
      useThemeStore.getState().setInsideMainLayout(false);
    };
  }, []);

  // Auto-close mobile drawer on route transition without blocking navigation
  useEffect(() => {
    if (typeof window !== "undefined" && window.innerWidth < 1024) {
      setIsSidebarOpen(false);
    }
  }, [location.pathname, location.search]);

  // For MAHASISWA_KKN, render dedicated mobile shell with strict iOS Safari verification
  if (user?.peran === "MAHASISWA_KKN") {
    return (
      <ErrorBoundary FallbackComponent={ErrorBoundaryFallback}>
        <IOSSafariGate>
          <Outlet />
        </IOSSafariGate>
      </ErrorBoundary>
    );
  }

  const handleToggleSidebar = () => {
    if (typeof window !== "undefined" && window.innerWidth < 1024) {
      setIsSidebarOpen((prev) => !prev);
    } else {
      setIsCollapsed((prev) => !prev);
    }
  };

  return (
    <div className="flex bg-surface min-h-screen relative overflow-x-hidden w-full max-w-full min-w-0 print:bg-white print:overflow-visible">
      <div className="print:hidden">
        <Sidebar
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          isCollapsed={isCollapsed}
        />
      </div>
      <main
        className={`ml-0 ${
          isCollapsed ? "lg:ml-[84px]" : "lg:ml-[280px]"
        } min-h-screen flex flex-col justify-between flex-1 w-full min-w-0 max-w-full transition-all duration-300 overflow-x-hidden print:ml-0 print:p-0 print:m-0 print:w-full print:block print:overflow-visible`}
      >
        <div className="w-full min-w-0 max-w-full print:p-0">
          <div className="print:hidden">
            <Header onToggleSidebar={handleToggleSidebar} isCollapsed={isCollapsed} />
          </div>
          <ErrorBoundary FallbackComponent={ErrorBoundaryFallback}>
            <div className="p-3 sm:p-5 md:p-6 w-full min-w-0 max-w-full print:p-0 print:m-0">
              <Outlet />
            </div>
          </ErrorBoundary>
        </div>
      </main>
    </div>
  );
};

export default MainLayout;
