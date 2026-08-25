/**
 * Project: BERSEKA
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 * Dikembangkan sebagai bagian dari program PKL di PT Makerindo, tanpa perjanjian tertulis mengenai kepemilikan hak cipta.
 */

import React, { useState, useEffect } from "react";
import { Outlet } from "react-router-dom";

import { ErrorBoundary } from "react-error-boundary";
import Sidebar from "../Sidebar/Sidebar";
import Header from "../Header/Header";
import ErrorBoundaryFallback from "../../common/ErrorBoundaryFallback";
import { useThemeStore } from "../../../store/useThemeStore";

const MainLayout: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Sync darkmode exclusively when user is inside the authenticated menu/dashboard layout
  useEffect(() => {
    useThemeStore.getState().setInsideMainLayout(true);
    return () => {
      useThemeStore.getState().setInsideMainLayout(false);
    };
  }, []);

  const handleToggleSidebar = () => {
    if (typeof window !== "undefined" && window.innerWidth < 1024) {
      setIsSidebarOpen((prev) => !prev);
    } else {
      setIsCollapsed((prev) => !prev);
    }
  };

  return (
    <div className="flex bg-surface min-h-screen relative overflow-x-hidden w-full max-w-full min-w-0">
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        isCollapsed={isCollapsed}
      />
      <main
        className={`ml-0 ${
          isCollapsed ? "lg:ml-[84px]" : "lg:ml-[280px]"
        } min-h-screen flex flex-col justify-between flex-1 w-full min-w-0 max-w-full transition-all duration-300 overflow-x-hidden`}
      >
        <div className="w-full min-w-0 max-w-full">
          <Header onToggleSidebar={handleToggleSidebar} isCollapsed={isCollapsed} />
          <ErrorBoundary FallbackComponent={ErrorBoundaryFallback}>
            <div className="p-container-margin w-full min-w-0 max-w-full">
              <Outlet />
            </div>
          </ErrorBoundary>
        </div>
      </main>
    </div>
  );
};

export default MainLayout;
